import Sequelize, { Model } from 'Sequelize';
import bcrypt from 'bcryptjs';
class User extends Model {
    static init(sequelize){
        super.init({
            name: Sequelize.STRING,
            email:Sequelize.STRING,
            password: Sequelize.VIRTUAL,
            password_hash:Sequelize.STRING,
            provider:Sequelize.BOOLEAN,
        }, 
        {
            sequelize,
        }
        );
        //Método para criptografar a senha informada pelo usuário
        this.addHook('beforeSave', async(user)=>{
            if(user.password){
                user.password_hash = await bcrypt.hash(user.password, 8);
            }
        });
        return this;
    }
    static associate(models){
        this.belongsTo(models.File, { foreignKey: 'avatar_id', as : 'avatar' });
    }
    checkPassword(password){
        //Método que compara se a senha informada é equivalente à criptografada
        return bcrypt.compare(password, this.password_hash);
    }
}
export default User;
