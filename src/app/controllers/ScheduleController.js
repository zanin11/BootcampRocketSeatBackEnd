import Appointments from '../models/Appointments';
import User from '../models/User';
import { Op } from 'sequelize';
import { startOfDay, endOfDay, parseISO } from 'date-fns'
class ScheduleController{
   async index(req, res){
        const checkUserProvider = await User.findOne({while:{
            id:req.userId,
            provider: true,
        }})
        if(!checkUserProvider)
            return res.status(401).json({error: 'User is not a provider.'});
        const { date } = req.query;
        const parsedDate = parseISO(date);
        const appointments = await Appointments.findAll({
            where:{
                provider_id: req.userId,
                canceled_at: null,
                date:{
                    [Op.between]: [
                        startOfDay(parsedDate),
                        endOfDay(parsedDate)
                    ]
                },
            },
            order: ['date'],
        })
        return res.json(appointments);
   }
}
export default new ScheduleController();