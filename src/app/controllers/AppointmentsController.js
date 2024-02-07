import * as Yup from 'yup';
import User from '../models/User';
import File from '../models/File';
import Appointments from '../models/Appointments';
import { startOfHour, parseISO, isBefore, format, subHours } from 'date-fns';
import pt from 'date-fns/locale/pt';
import Notification from '../schemas/Notification';
import Mail from '../../lib/Mail';
import CancellationMail from '../jobs/CancellationMail';
import Queue from '../../lib/Queue';
class AppointmentsController{
    async store(req, res){
        const schema = Yup.object().shape({
            provider_id: Yup.number().required(),
            date: Yup.date().required(),
        });
        if(!(await schema.isValid(req.body)))
            return res.status(400).json({error: "Validation fails."})
        const { provider_id, date } = req.body;
        const provider_exists = await User.findOne({where:{
            id: provider_id,
            provider: true
        }});
        if(!provider_exists){
            return res.status(400).json({error: "You can only create appointments with providers."})
        }
        const hourStart = startOfHour(parseISO(date));
        if(isBefore(hourStart, new Date())){
            return res.status(400).json({error: "You can't create appointments in past."})
        }
        const checkAvailability = await Appointments.findOne({
            where:{
                provider_id,
                canceled_at:null,
                date:hourStart,
            }
        })
        if(checkAvailability)
            return res.status(400).json({error: "Appointment date is not available."})
        if(req.userId == provider_id)
            return res.status(400).json({error: "You can't mark an appointment with yourself."})
        const apppointment = await Appointments.create({
            user_id: req.userId,
            provider_id,
            date,
        });
        const user = await User.findByPk(req.userId);
        const formatedDate = format(
            hourStart, 
            "'dia' dd 'de' MMMM', às' H:mm'h'",
        );
        await Notification.create({
            content: `Novo agendamento de ${user.name} para o ${formatedDate}`,
            user: provider_id,
        
        });
        res.json(apppointment);
    }
    async index(req,res){
        const { page = 1} = req.query;
        const appointment = await Appointments.findAll({
            where:{
                user_id: req.userId, 
                canceled_at: null,
            },
            order: ['date'],
            attributes: ['id', 'date', 'past', 'cancelable'],
            limit: 20,
            offset: (page - 1 ) * 20,
            include: [
                {
                    model: User,
                    as: 'provider',
                    attributes: ['id', 'name'],
                    include: [
                        {
                            model: File,
                            as: 'avatar',
                            attributes: ['id','path' ,'url'],
                        }    
                    ]
                },
            ],
        })
        res.json(appointment);
    }
    async delete(req,res){
        const appointment = await Appointments.findByPk(req.params.id, {
            include: [
                {
                    model: User,
                    as: 'provider',
                    attributes: ['name', 'email'],
                },
                {
                    model: User,
                    as: 'user',
                    attributes: ['name'],
                }
            ],
        });
        if(appointment.user_id != req.userId){
            return res.status(401).json({error:'You not have permission to cancel this appointment.'})
        };
        const dateWithSub = subHours(appointment.date, 2);
        console.log(dateWithSub);
        console.log(new Date());
        if(isBefore(dateWithSub, new Date())){
            return res.status(401).json({error:'You cant only cancel appointment 2 hours in advance.'})
        }
        appointment.canceled_at= new Date();
        await appointment.save();
        await Queue.add(CancellationMail.key, {
            appointment,
        });
        return res.json(appointment);
    }
}
export default new AppointmentsController();