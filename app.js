var createError = require('http-errors');
var express = require('express');
var path = require('path');
const http = require("http");
const hbs = require('express-handlebars').engine;
var cookieParser = require('cookie-parser');
const passport = require('passport');
const session = require('express-session');
const flash = require('express-flash');
require('dotenv').config({ path: './config/.env' });
const initializePassport = require('./config/passport-config');
const mediasoup = require('mediasoup');

//local passport config
initializePassport(passport);

const port = process.env.PORT;

var indexRouter = require('./routes/index');
var accessRouter = require('./routes/access');

var app = express();

app.engine('hbs', hbs({
  defaultLayout: null,
  extname: '.hbs',
  helpers: {
    json: function (context) {
      return JSON.stringify(context);
    }
  }
}))

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'hbs');

// app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
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
    return next();
  }
  else {
    //Trả về trang 401
    res.redirect('/login');
  }
})

app.use('/', indexRouter);
// app.use('/users', usersRouter);

// catch 404 and forward to error handler
app.use(function(req, res, next) {
  next(createError(404));
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


const server = http.createServer(app);

server.listen(port, async () => {

  console.log(`Server listening on port ${port}`);
  await runMediasoup();
  const ws = require("./socket")(server, router);
});

// const mediasoup = require('mediasoup');
// const express = require('express');
// const http = require('http');
// const WebSocket = require('ws');
// var path = require('path');

// const app = express();
// const server = http.createServer(app);
// const wss = new WebSocket.Server({ server });
// const hbs = require('express-handlebars').engine;


// app.engine('hbs', hbs({
//   defaultLayout: null,
//   extname: '.hbs',
//   helpers: {
//     json: function (context) {
//       return JSON.stringify(context);
//     }
//   }
// }))

// // view engine setup
// app.set('views', path.join(__dirname, 'views'));
// app.set('view engine', 'hbs');
// app.use(express.static(path.join(__dirname, 'public')));


// var indexRouter = require('./routes/index');

// app.use('/', indexRouter);


// let worker;
// let router;
// let transports = {};
// let producers = {};
// let consumers = {};
// let nextClientId = 0;

// const createWorker = async () => {
//   worker = await mediasoup.createWorker({
//     rtcMinPort: 10000,
//     rtcMaxPort: 10100,
//   });
//   console.log('Worker created');
//   worker.on('died', error => {
//     console.error('mediasoup worker died', error);
//     process.exit(1);
//   });
// };

// const createRouter = async () => {
//   router = await worker.createRouter({
//     mediaCodecs: [
//       {
//         kind: 'audio',
//         mimeType: 'audio/opus',
//         clockRate: 48000,
//         channels: 2,
//       },
//       {
//         kind: 'video',
//         mimeType: 'video/VP8',
//         clockRate: 90000,
//         parameters: {
//           'x-google-start-bitrate': 1000,
//         },
//       },
//     ]
//   });
//   console.log('Router created');
// };

// const createWebRtcTransport = async () => {
//   const transportOptions = {
//     listenIps: [{ ip: '0.0.0.0', announcedIp: '127.0.0.1' }],
//     enableUdp: true,
//     enableTcp: true,
//     preferUdp: true,
//     iceServers: [
//       { urls: 'stun:stun.l.google.com:19302' },
//       // {
//       //   urls: "stun:stun.relay.metered.ca:80",
//       // },
//       // {
//       //     urls: "turn:global.relay.metered.ca:80",
//       //     username: "ad5b1b255ff7868080c67d5a",
//       //     credential: "pq8cUtoQPWmQ2u69",
//       // },
//       // {
//       //     urls: "turn:global.relay.metered.ca:80?transport=tcp",
//       //     username: "ad5b1b255ff7868080c67d5a",
//       //     credential: "pq8cUtoQPWmQ2u69",
//       // },
//       // {
//       //     urls: "turn:global.relay.metered.ca:443",
//       //     username: "ad5b1b255ff7868080c67d5a",
//       //     credential: "pq8cUtoQPWmQ2u69",
//       // },
//       // {
//       //     urls: "turns:global.relay.metered.ca:443?transport=tcp",
//       //     username: "ad5b1b255ff7868080c67d5a",
//       //     credential: "pq8cUtoQPWmQ2u69",
//       // },
//     ],
//   };
//   return await router.createWebRtcTransport(transportOptions);
// };

// const runMediasoup = async () => {
//   await createWorker();
//   await createRouter();
// };

// server.listen(3000, () => {
//   console.log('Server is running on port 3000');
//   runMediasoup();
//   c
// });

