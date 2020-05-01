import { Router, Response } from 'express';
import moment from 'moment-timezone';
import { Schedule } from '../models';
const router = Router();

/* GET home page. */
router.get('/', function(req, res: Response, next) {
  const title = '予定調整くん';
  if (req.user) {
    // ゴミ
    const user = req.user as any;
    Schedule.findAll({
      where: {
        createdBy: user.id
      },
      order: [['"updatedAt"', 'DESC']]
    }).then((schedules) => {
      schedules.forEach((schedule: any) => {
        schedule.formattedUpdatedAt = moment(schedule.updatedAt).tz('Asia/Tokyo').format('YYYY/MM/DD HH:mm');
      });
      res.render('index', {
        title,
        user: user,
        schedules
      });
    });
  } else {
    res.render('index', { title });
  }
});

export default router;
