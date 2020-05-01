import express from 'express';
const router = express.Router();

router.get('/', (req, res, next) => {
    req.logOut();
    res.redirect('/');
});

export default router;