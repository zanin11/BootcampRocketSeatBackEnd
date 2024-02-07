import Notification from '../schemas/Notification';
import User from '../models/User';
class NotificationController{
    async index(req, res){
        const provider_exists = await User.findOne({where:{
            id: req.userId,
            provider: true
        }});
        if(!provider_exists){
            return res.status(400).json({error: "Only providers can load notifications."})
        }
        const notifications = await Notification.find({user: req.userId,}).sort({createdAt: 'desc' }).limit(20);
        return res.json(notifications);
    }
    async update(req,res){
        const notification = await Notification.findByIdAndUpdate(
            req.params.id,
            { read: true },
            { new: true }
        );
        return res.json(notification);
    }
}
export default new NotificationController();