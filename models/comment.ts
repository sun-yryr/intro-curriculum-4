import { DataTypes, Model, Sequelize } from 'sequelize';
import User from './user';

class Comment extends Model {
    public scheduleId!: string
    public userId!: number
    public comment!: string

    public static initialize(sequelize: Sequelize) {
        this.init({
            scheduleId: {
                type: DataTypes.STRING,
                primaryKey: true,
                allowNull: false
            },
            userId: {
                type: DataTypes.INTEGER,
                primaryKey: true,
                allowNull: false
            },
            comment: {
                type: DataTypes.STRING,
                allowNull: false
            }
        }, {
            sequelize,
            tableName: 'comments',
            timestamps: false
        });
        return this;
    }

    public static associate() {
        this.belongsTo(User, {
            foreignKey: 'userId'
        });
    }
}

export default Comment;
