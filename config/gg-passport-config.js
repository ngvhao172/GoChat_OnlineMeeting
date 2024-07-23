const GoogleStrategy = require('passport-google-oauth2').Strategy;
const bcrypt = require('bcrypt');

const Account = require('../models/Account');
const User = require('../models/User');
const userService = require('../services/UserService');
const accountService = require('../services/AccountService')

async function initializeGooglePassport(passport) {
    passport.use(new GoogleStrategy({
        clientID: process.env.GOOGLE_CLIENT_ID,
        clientSecret: process.env.GOOGLE_CLIENT_SECRET,
        callbackURL: `http://localhost:${process.env.PORT}/auth/google/callback`,
        passReqToCallback: true
    },
    async function (request, accessToken, refreshToken, profile, done) {
        console.log(profile);
        const user = await userService.getUserByEmail(profile.email);
        // return done(null, {id: "Uz5WzRkFxa9vi3edxaqL"});
        if (user.status) {
            //console.log(profile)
            console.log(user.data)
            return done(null, user.data);
        } else {
            //Không tồn tại tài khoản trong hệ thống
            //Tao moi
            //
            const user = new User()
            user.userEmail = profile.email;
            user.fullName = profile.displayName;
            user.avatar = profile.picture;
            user.createdAt = new Date();
            const resultUser = await userService.createUser(user);
            if(resultUser.status) {
                const userCreated = resultUser.data;
                const password = profile.email.toString().split("@")[0];
                //tao tai khoan
                //hash password
                const hasedPassword = await bcrypt.hash(password, 10);
                const account = new Account();
                account.userId = userCreated.id;
                account.password = hasedPassword;
                account.createdAt = new Date();
                account.enabled = true;
                account.verified = true;
                account.userEmail = profile.email;
                const resultAccount = await accountService.createAccount(account);
                if(resultAccount.status === true) {
                    return done(null, userCreated);
                }
                else{
                    return done(null, false, { message: resultAccount.message });
                }
            }
            return done(null, false, { message: resultUser.message });
        }
    }));
    passport.serializeUser((user, done) => done(null, user.id))
    passport.deserializeUser(async (id, done) => {
        const userData = await userService.getUserById(id);
        const user = userData.data;
        return done(null, user)
    })
}

module.exports = initializeGooglePassport;
