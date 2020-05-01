import express from 'express';
import { ensure } from './authentication-ensurer';
import { Availability } from '../models';

const router = express.Router();

router.post('/:scheduleId/users/:userId/candidates/:candidateId', ensure, (req, res, next) => {
    const { scheduleId, userId, candidateId } = req.params;
    const availability = req.body.availability ? parseInt(req.body.availability) : 0;

    Availability.upsert({
        scheduleId,
        userId,
        candidateId,
        availability
    }).then(() => {
        res.json({
            status: 'OK',
            availability
        });
    });
});


export default router;
