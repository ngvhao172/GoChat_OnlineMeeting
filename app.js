var express = require('express');
var path = require('path');
// const https = require("https");
const http = require("http");
const fs = require('fs');
const hbs = require('express-handlebars').engine;
const passport = require('passport');
const session = require('express-session');
const flash = require('express-flash');
require('dotenv').config({ path: './config/.env' });
const initializePassport = require('./config/passport-config');
const initializeGooglePassport = require('./config/gg-passport-config');
const mediasoup = require('mediasoup');
const cors = require('cors');

const webPush = require('web-push');

// Generate VAPID keys
const vapidKeys = {
  publicKey: "BCGeLzc1iyki17jIBjFxi351V6ttBrrBNpimnbw8mifWJG8x92l0G5s1fr4H2XtBjQ60rwxkd2rvjt-4TqvNqng",
  privateKey: "xoGkTegQGWUg8yAtMupFFsKvCBUZWFo84Wf8nxeCCfY"
};

webPush.setVapidDetails(
  'mailto:ngvhao172@example.com',
  vapidKeys.publicKey,
  vapidKeys.privateKey
);


//local passport config
initializePassport(passport);

//gg passport config

initializeGooglePassport(passport);

const port = process.env.PORT;
const ws_url = process.env.WS_URL;
const domain = process.env.DOMAIN;

var indexRouter = require('./routes/index');
var accessRouter = require('./routes/access');

var app = express();

const customHelpers = require('./utils/customHelpers');

app.engine('hbs', hbs({
  defaultLayout: null,
  extname: '.hbs',
  helpers: {
    json: function (context) {
      return JSON.stringify(context);
    },
    ...customHelpers.helpers
  }
}))

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'hbs');

// app.use(logger('dev'));
app.use(cors());

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));


app.use(session({
  secret: 'mysecretkey',
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: false,
  }
}));
app.use(flash());

//initalizepassport config
app.use(passport.initialize());
app.use(passport.session());

app.use('/', accessRouter);

app.use(function (req, res, next) {
  // console.log(req.isAuthenticated());
  if (req.isAuthenticated()) {
    res.locals.user = req.user;
    res.locals.ws_url = ws_url;
    res.locals.domain = domain;
    return next();
  }
  else {
    //Trả về trang 401
    res.redirect('/login');
  }
})
// app.post('/subscribe', (req, res) => {
//   const subscription = req.body;

//   // Send a push notification
//   console.log("SUBCRIBE FOUND")
//   const payload = JSON.stringify({ title: 'Test Notification', body: 'This is a test notification' });

//   webPush.sendNotification(subscription, payload)
//     .then(() => res.status(200).json({ message: 'Notification sent successfully.' }))
//     .catch(err => {
//       console.error(err);
//       res.sendStatus(500);
//     });
// });


app.use('/', indexRouter);
// app.use('/users', usersRouter);

// catch 404 and forward to error handler
app.use(function(req, res, next) {
});

// error handler
app.use(function(err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.render('error');
});

// if (process.env.NODE_ENV === 'production') {
//   dotenv.config({ path: '.env.production' });
// } else {
//   dotenv.config();
// }

let worker;
let router;

const createWorker = async () => {
  worker = await mediasoup.createWorker({
    rtcMinPort: 10000,
    rtcMaxPort: 10100,
  });
  console.log('Worker created');
  worker.on('died', error => {
    console.error('mediasoup worker died', error);
    process.exit(1);
  });
};

const createRouter = async () => {
  router = await worker.createRouter({
    mediaCodecs: [
      {
        kind: 'audio',
        mimeType: 'audio/opus',
        clockRate: 48000,
        channels: 2,
      },
      {
        kind: 'video',
        mimeType: 'video/VP8',
        clockRate: 90000,
        parameters: {
          'x-google-start-bitrate': 1000,
        },
      },
    ]
  });
  console.log('Router created');
};

const runMediasoup = async () => {
  await createWorker();
  await createRouter();
};

// const options = {
//   key: fs.readFileSync('./config/ssl-domain/key.pem', 'utf-8'),
//   cert: fs.readFileSync('./config/ssl-domain/cert.pem', 'utf-8')
// }
const server = http.createServer(app);

server.listen(port, async () => {

  console.log(`Server listening on port ${port}`);
  await runMediasoup();
  const ws = require("./socket")(server, router);
});


