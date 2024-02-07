//Middleware de autenticação
//Toda vez que é necessário atualizar os dados de um usuário cadastrado esse middleware de autenticação é chamado
//Ideia básica: Validação do token de autenticação passado na requisição
//Importante: Cada usuário possui um token único de autenticação
import jwt from 'jsonwebtoken';
import authConfig from '../../config/auth';
import { promisify } from 'util';
export default async (req,res,next)=>{
    const authHeader = req.headers.authorization;
    if(!authHeader){
        return res.status(401).json({ error: 'Token not provided.'});
    }
    const [, token] = authHeader.split(' ');
    try{
        //O token passado é decodificado
        const decoded = await promisify(jwt.verify)(token, authConfig.secret);
        console.log(decoded);
        //Como o token possui o id do usuario, é colocado no corpo requisição o id do usuário que teve o token enviado
        req.userId = decoded.id;
        return next();
    }catch(err){
        return res.status(401).json({error: "Token invalid."});
    }
}
