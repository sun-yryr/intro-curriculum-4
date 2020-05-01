import express from 'express';
import { ensure } from './authentication-ensurer';
import { Comment } from '../models';
const router = express.Router();

router.post('/:scheduleId/users/:userId/comments', ensure, (req, res, next) => {
    const { scheduleId, userId } = req.params;
    const comment: string = req.body.comment;

    Comment.upsert({
        scheduleId,
        userId,
        comment: comment.slice(0, 255)
    }).then(() => {
        res.json({
            status: 'OK',
            comment
        });
    });
})

export default router;
