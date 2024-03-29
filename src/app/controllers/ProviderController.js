import * as Yup from 'yup';
import User from '../models/User';
import File from '../models/File';
class ProviderCrontroller{
    async index(req , res){
        const provider = await User.findAll({
            where: {provider: true},
            attributes: ['id', 'name', 'email', 'avatar_id'],
            include: [{
                model: File,
                as: 'avatar',
                attributes: ['name', 'path', 'url'],
            }],
        });
        res.json(provider);
    }
}
export default new ProviderCrontroller();