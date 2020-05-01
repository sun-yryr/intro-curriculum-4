import express from 'express';
const router = express.Router();

router.get('/', (req, res, next) => {
    const { from } = req.query;
    if (from) {
        res.cookie('loginFrom', from, { expires: new Date(Date.now() + 600000) });
    }
    res.render('login');
});

export default router;