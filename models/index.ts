import User from './user';
import Schedule from './schedule';
import Availability from './availability';
import Candidate from './candidate';
import Comment from './comment';
import { Sequelize } from 'sequelize';

const sequelize = new Sequelize(
    'postgres://t_minagawa@localhost/schedule_arranger',
    {
        dialect: 'postgres',
        dialectOptions: {
            operatorsAliases: false
        }
    }
);

const Database = {
    user: User.initialize(sequelize),
    schedule: Schedule.initialize(sequelize),
    availability: Availability.initialize(sequelize),
    candidate: Candidate.initialize(sequelize),
    comment: Comment.initialize(sequelize)
};

for (const [, model] of Object.entries(Database)) {
    if ('associate' in model) {
        model.associate();
    }
}

export {
    Database,
    User,
    Schedule,
    Availability,
    Candidate,
    Comment
}
