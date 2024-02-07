import User from '../models/User';
import * as Yup from 'yup';
//Controller para relizar o cadastro e update de usuários
class UserController {
    //Método para criar/cadastrar um novo usuário na aplicação e banco de dados
    async store(req,res){
        //a constante schema é utilizada para realizar a validação de dados de entrada para a criação de cadastro de um usuário enviados através da requisição
        const schema = Yup.object().shape({
            name: Yup.string().required(),
            //o nome deve ser obrigatório
            email: Yup.string().email().required(),
            //o email deve ser obrigatorio
            password: Yup.string().required().min(6),
            //a senha deve ser obrigatoria e com no mínimo 6 digitos
        });
        //o método schema.isValid() é assincrono e realiza a validação do que está vindo no corpo/body da requisição post.
        if(!(await schema.isValid(req.body))){
            return res.status(400).json({error: "Validation fails."})
        }
        //Validação de um usuário já existente
        //o método User.findOne é assincrono e busca no banco de dados se um usuario cadastrado possui um email igual ao email enviado no body da requisicao
        const userExists = await User.findOne({where: {email: req.body.email}});
        if(userExists){
            return res.status(400).json({error: 'User already exists.'});
        }
        //Todas as validações de criação foram realizadas -> "Usuario nao cadastrado"
        //User.create(req.body) cria/cadastra no banco de dados o novo usuario 
        const {id, name, email, provider} = await User.create(req.body);
        //É retornado para a interface : id, name,email,provider do novo usuario cadastrado
        return res.json({id, name, email, provider});
    }
    //Método para atualizar as informações de um usuário já cadastrado
    async update(req,res){
        //A constante schema é criada para validar os dados de entrada enviados através da requisição
        const schema = Yup.object().shape({
            name: Yup.string(),
            //nome nao é obrigatório
            email: Yup.string().email(),
            //email não é obrigatorio
            oldPassword: Yup.string().min(6),
            //senha antiga nao é obrigatoria
            //caso o usuario informar sua oldPassword, a password->"nova senha" será obrigatória e terá que ter no mínimo 6 digitos
            //caso o usuario nao informe sua oldpassword, a password->"nova senha" não será obrigatória
            password: Yup.string().min(6).when('oldPassword', (oldPassword, field) => 
                oldPassword ? field.required() : field
            ),
            //caso o usuário informe sua password->"nova senha", ele será obrigado a informa a confirmPassword
            //caso não, nao será obrigado informar sua confirmPassword
            confirmPassword: Yup.string().when('password', (password, field) => 
                password ? field.required().oneOf([Yup.ref('password')]) : field
            )
        });
        if(!(await schema.isValid(req.body))){
            return res.status(400).json({error: "Validation fails."})
        }

        const { email, oldPassword } = req.body;
        //Como para realizar um update de um usuário, ele precisa estar cadastrado é passado como junto à requisição put
        //um token de autenticação, o qual possui o id do usuario presente, quando este é decodificado é passado para o corpo da requisição o id do usuário -> req.userId
        const user = await User.findByPk(req.userId);
        //Caso o email enviado da requisição != email do usuario recuperado pelo id
        if(email != user.email){
            const userExists = await User.findOne({ where: {email} });
            //se o email da requisição já existir no bd, significa que já há um usuário com esse email
            if(userExists){
                return res.status(400).json({error: 'User already exists.'});
            }
        }
        //caso o usuário informe sua oldPassword, será verificado se essa senha é a mesma cadastrada no bd
        if(oldPassword && !(await user.checkPassword(oldPassword))){
            //nao é a mesma cadastrada no bd
            return res.status(401).json({error: 'Password does not match.'});
        }
        //Todas as validações foram feitas
        //informações do usuário sao atualizadas pelo método user.update(req.body)
        const { id, name, provider } = await user.update(req.body);
        //É retornado à interface: id,name,email,provider do usuario atualizado
        return res.json({id, name, email, provider});
    }
}
export default new UserController();