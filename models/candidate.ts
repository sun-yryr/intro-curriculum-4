import { DataTypes, Model, Sequelize } from 'sequelize';

class Candidate extends Model {
    public candidateId!: number
    public candidateName!: string
    public scheduleId!: string

    public static initialize(sequelize: Sequelize) {
        this.init({
            candidateId: {
                type: DataTypes.INTEGER,
                primaryKey: true,
                autoIncrement: true,
                allowNull: false
            },
            candidateName: {
                type: DataTypes.STRING,
                allowNull: false
            },
            scheduleId: {
                type: DataTypes.UUID,
                allowNull: false
            }
        }, {
            sequelize,
            tableName: 'candidates',
            timestamps: false,
            indexes: [{
                fields: ['scheduleId']
            }]
        });
        return this;
    }
}

export default Candidate;
