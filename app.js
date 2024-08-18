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
const cookieParser = require('cookie-parser');
const { v4: uuidv4 } = require('uuid');
const LocalStrategy = require("passport-local").Strategy


const userService = require("./services/UserService");

const jwt = require('jsonwebtoken')

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
const secret_key = process.env.SECRET_KEY;


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

app.use(cookieParser());
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

function authenticateToken(req, res, next) {
  const token = req.cookies.authToken;

  if (!token) return res.redirect('/login');

  jwt.verify(token, secret_key, async (err, { userEmail }) => {
      if (err) return res.redirect('/login');
      let user = await userService.getUserByEmail(userEmail);
      if(user.status){
        req.session.token = token;  
        console.log(token);
        const sessionUUID = uuidv4();
        req.session.userUUID = sessionUUID;
        req.user = user.data;
        

        passport.use(new LocalStrategy({ usernameField: 'email' }, done(null, user.data)))
        passport.serializeUser((user, done) => done(null, user.id))
        passport.deserializeUser(async (id, done) => {
            // console.log(id);
            const userData = await userService.getUserById(id);
            const user = userData.data;
            //console.log(user)
            return done(null, user)
        });
        next();
      }
      else{
        res.redirect('/login');
      }
  });
}

//app.use(authenticateToken);

app.use(function (req, res, next) {
  // console.log(req.isAuthenticated());
  if (req.isAuthenticated()) {
    //console.log("TOKEN:" +  res.locals.token)
    const sessionUUID = req.session.userUUID;
    const token = req.session.token;
    //console.log("TOKEN:" +  token)
    res.locals.user = req.user;
    res.locals.user.id = sessionUUID;
    res.locals.ws_url = ws_url;
    res.locals.token = token;
    res.locals.domain = domain;
    //console.log("TOKEN:" +  res.locals.token)
    return next();
  }
  else {
    authenticateToken(req, res, next);
    //res.redirect('/login');
  }
})

app.use('/', indexRouter);


// app.use('/users', usersRouter);

// catch 404 and forward to error handler
app.use(function(req, res, next) {
  return res.render("notfound")
});

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


