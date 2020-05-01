import createError from 'http-errors';
import express, { Request, Response, NextFunction } from 'express';
import path from 'path';
import cookieParser from 'cookie-parser';
import logger from 'morgan';
import helmet from 'helmet';
import session from 'express-session';
import passport from 'passport';
import PassGithub from 'passport-github2';
import dotenv from 'dotenv';
dotenv.config();

/* モデルの作成と読み込み */
import { Database } from './models';
(async () => {
  await Database.user.sync();
  await Database.schedule.sync();
  await Database.comment.sync();
  await Database.candidate.sync();
  await Database.availability.sync();
})();

/* routing */
import indexRouter from './routes/index';
import loginRouter from './routes/login';
import logoutRouter from './routes/logout';
import scheduleRouter from './routes/schedules';
import availabilitiesRouter from './routes/availabilities';
import commentsRouter from './routes/comment';

/* 定数 */
const GitHubStrategy = PassGithub.Strategy;
const GITHUB_CLIENT_ID = process.env.GITHUB_CLIENT_ID as string
const GITHUB_CLIENT_SECRET = process.env.GITHUB_CLIENT_SECRET as string
/* --- */

passport.serializeUser((user, done) => {
  done(null, user);
});

passport.deserializeUser((obj, done) => {
  done(null, obj);
});

passport.use(new GitHubStrategy({
  clientID: GITHUB_CLIENT_ID,
  clientSecret: GITHUB_CLIENT_SECRET,
  callbackURL: 'http://localhost:3000/auth/github/callback'
}, function (accessToken, refreshToken, results, profile, done) {
  process.nextTick(function () {
    Database.user.upsert({
      userId: profile.id,
      username: profile.username
    }).then(() => {
      done(null, profile);
    });
  });
}));

const app = express();
app.use(helmet());

// view engine setup
app.set('views', 'views');
app.set('view engine', 'pug');

app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static('public'));

app.use(session({
  secret: '05dfe9461ce8ea22',
  resave: false,
  saveUninitialized: false
}));
app.use(passport.initialize());
app.use(passport.session());

app.use('/', indexRouter);
app.use('/login', loginRouter);
app.use('/logout', logoutRouter);
app.use('/schedules', scheduleRouter);
app.use('/schedules', availabilitiesRouter);
app.use('/schedules', commentsRouter);

app.get('/auth/github',
  passport.authenticate('github', { scope: ['user:email'] }),
  () => {}
);

app.get('/auth/github/callback',
  passport.authenticate('github', { failureRedirect: '/login' }),
  (req: Request, res: Response) => {
    let loginFrom: string = req.cookies.loginFrom;
    if (loginFrom &&
      !loginFrom.includes('http://') &&
      !loginFrom.includes('https://')) {
        res.clearCookie('loginFrom');
        res.redirect(loginFrom);
    } else {
      res.redirect('/');
    }
  }
);

// catch 404 and forward to error handler
app.use(function(req: Request, res: Response, next: NextFunction) {
  next(createError(404));
});

// error handler
app.use(function(err: any, req: Request, res: Response, next: NextFunction) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.render('error');
});

module.exports = app;
export default app;