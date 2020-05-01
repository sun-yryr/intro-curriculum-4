import { DataTypes, Model, Sequelize } from 'sequelize';
import User from './user';
import Candidate from './candidate';

class Availability extends Model {
    public candidateId!: number
    public userId!: number
    public availability!: number
    public scheduleId!: string

    public static initialize(sequelize: Sequelize) {
        this.init({
            candidateId: {
                type: DataTypes.INTEGER,
                primaryKey: true,
                allowNull: false
            },
            userId: {
                type: DataTypes.INTEGER,
                primaryKey: true,
                allowNull: false
            },
            availability: {
                type: DataTypes.INTEGER,
                allowNull: false,
                defaultValue: 0
            },
            scheduleId: {
                type: DataTypes.UUID,
                allowNull: false
            }
        }, {
            sequelize,
            tableName: 'availabilities',
            timestamps: false,
            indexes: [{
                fields: ['scheduleId']
            }]
        });
        return this;
    }

    public static associate() {
        this.belongsTo(User, {
            foreignKey: 'userId'
        });
        this.belongsTo(Candidate, {
            foreignKey: 'candidateId'
        })
    }
}
export default Availability;
