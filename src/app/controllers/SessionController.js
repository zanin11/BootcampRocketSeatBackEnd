import jwt from 'jsonwebtoken';
import * as Yup from 'yup';
import User from '../models/User';
import authConfig from '../../config/auth';
//Controller para realizar o login de usuários
class SessionController{
    //Método para realizar o login => Usuário já cadastrado
    async store(req,res){
        //A constante schema é utilizada para realizar a validaçao dos dados enviados pela requisição
        const schema = Yup.object().shape({
            email: Yup.string().email().required(),
            //email obrigatorio
            password: Yup.string().required(),
            //password obrigatorio
        });
        if(!(await schema.isValid(req.body))){
            return res.status(400).json({error: "Validation fails."})
        }

        const { email, password } = req.body;
        //É passado para a const user o usuário cadastrado no bd que possui o email presente no corpo da requisição 
        const user = await User.findOne({ where: { email: email }});
        if(!user){
            //nao existe usuario cadastrado com o email da requisição
            return res.status(401).json({error: 'User not found.'});
        }
        //Validação da senha
        if(!(await user.checkPassword(password))){
            //A senha presente na requisição não é equivalenete à criptografada armazenada no bd
            return res.status(401).json({error: 'Password does not match.'});
        }
        //Todas as validações foram realizadas -> Login feito com sucesso
        const { id, name } = user;
        //É retornado à interface: id, name, email, token do usuario logado
        return res.json({
            user: {
                id,
                name,
                email,
            },
            token: jwt.sign({ id },authConfig.secret, {
                expiresIn: authConfig.expiresIn,
            }),
        })
    }
}
export default new SessionController();