import express, { Request, Response } from 'express';
import { v4 } from 'uuid';
import csurf from 'csurf';
import { ensure } from './authentication-ensurer';
import { Schedule, Candidate, User, Availability, Comment } from '../models';
const router = express.Router();
const csrfProtection = csurf({ cookie: true });

router.get('/new', ensure, csrfProtection, (req, res, next) => {
    res.render('new', {
        user: req.user,
        csrfToken: req.csrfToken()
    });
});

router.post('/', ensure, csrfProtection, (req, res, next) => {
    const scheduleId = v4();
    const updatedAt = new Date();
    if (req.user) {
        console.log("user on");
        // はいゴミ
        const User = req.user as any;
        Schedule.create({
            scheduleId,
            scheduleName: req.body.scheduleName.slice(0, 255) || '（名称未設定）',
            memo: req.body.memo,
            createdBy: User.id,
            updatedAt
        }).then(({ scheduleId }) => {
            createCandidatesAndRedirect(parseCandidateNames(req.body.candidates), scheduleId, res);
        });
    }
});

router.get('/:scheduleId', ensure, (req, res, next) => {
    Schedule.findOne({
        include: [{
            model: User,
            attributes: ['userId', 'username']
        }],
        where: {
            scheduleId: req.params.scheduleId
        },
        order: [['"updatedAt"', 'DESC']]
    }).then((schedule) => {
        if (schedule) {
            console.log(schedule);
            Candidate.findAll({
                where: { scheduleId: schedule.scheduleId },
                order: [['"candidateId"', 'ASC']]
            }).then((candidates) => {
                Availability.findAll({
                    include: [{
                        model: User,
                        attributes: ['userId', 'username']
                    }],
                    where: { scheduleId: schedule.scheduleId },
                    order: [
                        [User, 'username', 'ASC'],
                        ['"candidateId"', 'ASC']
                    ]
                }).then((availabilities) => {
                    // 出欠 MapMap(キー:ユーザー ID, 値:出欠Map(キー:候補 ID, 値:出欠)) を作成する
                    const availabilityMapMap = new Map(); // key: userId, value: Map(key: candidateId, availability)
                    availabilities.forEach((a) => {
                        const av = a as any;
                        const map = availabilityMapMap.get(av.User.userId) || new Map();
                        map.set(a.candidateId, a.availability);
                        availabilityMapMap.set(av.User.userId, map);
                    });

                    // 閲覧ユーザーと出欠に紐づくユーザーからユーザー Map (キー:ユーザー ID, 値:ユーザー) を作る
                    const userMap = new Map(); // key: userId, value: User
                    if (req.user) {
                        const user = req.user as any;
                        userMap.set(parseInt(user.id), {
                            isSelf: true,
                            userId: parseInt(user.id),
                            username: user.username
                        });
                        availabilities.forEach((a) => {
                            const av = a as any;
                            userMap.set(av.User.userId, {
                                isSelf: parseInt(user.id) === av.User.userId, // 閲覧ユーザー自身であるかを含める
                                userId: av.User.userId,
                                username: av.User.username
                            });
                        });
                    }
                    // 全ユーザー、全候補で二重ループしてそれぞれの出欠の値がない場合には、「欠席」を設定する
                    const users = Array.from(userMap).map((keyValue) => keyValue[1]);
                    users.forEach((u) => {
                        candidates.forEach((c) => {
                            const map = availabilityMapMap.get(u.userId) || new Map();
                            const a = map.get(c.candidateId) || 0; // デフォルト値は 0 を利用
                            map.set(c.candidateId, a);
                            availabilityMapMap.set(u.userId, map);
                        });
                    });

                    // コメント取得
                    Comment.findAll({
                        where: { scheduleId: schedule.scheduleId }
                    }).then((comments) => {
                        const commentMap = new Map();  // key: userId, value: comment
                        comments.forEach((comment) => {
                            commentMap.set(comment.userId, comment.comment);
                        });
                        res.render('schedule', {
                            user: req.user,
                            schedule,
                            candidates,
                            users,
                            availabilityMapMap,
                            commentMap
                        });
                    });
                });
            });
        } else {
            const err = {
                message: "予定が見つかりません",
                status: 404
            };
            next(err);
        }
    });
});

router.get('/:scheduleId/edit', ensure, csrfProtection, (req, res, next) => {
    Schedule.findOne({
        where: {
            scheduleId: req.params.scheduleId
        }
    }).then((schedule) => {
        if (schedule && isMine(req, schedule)) { // 作成者のみが編集フォームを開ける
            Candidate.findAll({
                where: { scheduleId: schedule.scheduleId },
                order: [['"candidateId"', 'ASC']]
            }).then((candidates) => {
                res.render('edit', {
                    user: req.user,
                    schedule: schedule,
                    candidates: candidates,
                    csrfToken: req.csrfToken()
                });
            });
        } else {
            const err = {
                message: '指定された予定がない、または、予定する権限がありません',
                status: 404
            }
            next(err);
        }
    });
});

router.post('/:scheduleId', ensure, csrfProtection, (req, res, next) => {
    Schedule.findOne({
        where: {
            scheduleId: req.params.scheduleId
        }
    }).then((schedule) => {
        if (schedule && isMine(req, schedule)) {
            const { edit, delete: del } = req.query;
            if (typeof (edit) === 'string' && parseInt(edit) === 1) {
                const updatedAt = new Date();
                const user = req.user as any;
                schedule.update({
                    scheduleId: schedule.scheduleId,
                    scheduleName: req.body.scheduleName.slice(0, 255) || '（名称未設定）',
                    memo: req.body.memo,
                    createdBy: user.id,
                    updatedAt: updatedAt
                }).then((schedule) => {
                    // 追加されているかチェック
                    const candidateNames = parseCandidateNames(req.body.candidates);
                    if (candidateNames) {
                        createCandidatesAndRedirect(candidateNames, schedule.scheduleId, res);
                    } else {
                        res.redirect('/schedules/' + schedule.scheduleId);
                    }
                });
            } else if (typeof (del) === 'string' && parseInt(del) === 1) {
                deleteScheduleAggregate(req.params.scheduleId, () => {
                    res.redirect('/');
                });
            }
            else {
                const err = {
                    message: '不正なリクエストです',
                    status: 400
                }
                next(err);
            }
        } else {
            const err = {
                message: '指定された予定がない、または、編集する権限がありません',
                status: 404
            }
            next(err);
        }
    });
});

export async function deleteScheduleAggregate(scheduleId: string, done: Mocha.Done, err?: any) {
    const promiseAvailabilityDestroy = await Availability.findAll({
        where: { scheduleId: scheduleId }
    }).then((availabilities) => {
        availabilities.forEach((a) => a.destroy());
    });

    const promiseCandidateDestroy = await Candidate.findAll({
        where: { scheduleId: scheduleId }
    }).then((candidates) => {
        candidates.forEach((c) => c.destroy());
    });

    const promiseCommentDestroy = await Comment.findAll({
        where: { scheduleId: scheduleId }
    }).then((comments) => {
        comments.forEach((c) => c.destroy());
    });

    Promise.all([
        promiseAvailabilityDestroy,
        promiseCandidateDestroy,
        promiseCommentDestroy
    ]).then(() => {
        return Schedule.findByPk(scheduleId).then((s) => {
            if (s) return s.destroy();
        });
    }).then(() => {
        if (err) return done(err);
        else done();
    }).catch((e) => {
        done(e);
    });
}

function createCandidatesAndRedirect(candidateNames: string[], scheduleId: string, res: Response) {
    const candidates = candidateNames.map((c) => {
        return {
            candidateName: c,
            scheduleId: scheduleId
        };
    });
    Candidate.bulkCreate(candidates).then(() => {
        res.redirect('/schedules/' + scheduleId);
    });
}

function parseCandidateNames(candidates: string) {
    return candidates.trim().split('\n').map((s) => s.trim()).filter((s) => s !== "");
}

function isMine(req: Request, schedule: Schedule) {
    const user = req.user as any;
    return schedule && schedule.createdBy === parseInt(user.id);
}

export default router;