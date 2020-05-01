import { Sequelize, DataTypes, Model, HasManyCreateAssociationMixin  } from 'sequelize';

class User extends Model {
    public userId!: number;
    public username!: string;

    public static initialize(sequelize: Sequelize) {
        this.init({
            userId: {
                type: DataTypes.INTEGER,
                primaryKey: true,
                allowNull: false
            },
            username: {
                type: DataTypes.STRING,
                allowNull: false
            }
        }, {
            tableName: 'users',
            timestamps: true,
            sequelize
        });
        return this;
    }
}

export default User;
