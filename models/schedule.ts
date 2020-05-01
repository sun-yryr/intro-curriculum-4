import { DataTypes, Model, Sequelize } from 'sequelize';
import User from './user';

class Schedule extends Model {
    public scheduleId!: string
    public scheduleName!: string
    public memo!: string
    public createdBy!: number
    public updateAt!: Date

    public static initialize(sequelize: Sequelize) {
        this.init({
            scheduleId: {
                type: DataTypes.UUID,
                primaryKey: true,
                allowNull: false
            },
            scheduleName: {
                type: DataTypes.STRING,
                allowNull: false
            },
            memo: {
                type: DataTypes.TEXT,
                allowNull: false
            },
            createdBy: {
                type: DataTypes.INTEGER,
                allowNull: false
            },
            updatedAt: {
                type: DataTypes.DATE,
                allowNull: false
            }
        }, {
            sequelize,
            tableName: 'schedules',
            timestamps: false,
            indexes: [{
                fields: ['createdBy']
            }]
        });
        return this;
    }

    public static associate() {
        this.belongsTo(User, {
            foreignKey: 'createdBy'
        });
    }
}

export default Schedule;
