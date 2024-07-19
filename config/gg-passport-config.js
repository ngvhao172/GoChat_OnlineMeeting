const GoogleStrategy = require('passport-google-oauth2').Strategy;

const userService = require('../services/UserService');

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
        return done(null, {id: "Uz5WzRkFxa9vi3edxaqL"});
        if (user.status) {
            //console.log(profile)
            return done(null, user.data);
        } else {
            //Không tồn tại tài khoản trong hệ thống
            return done(null, false, { message: 'Tài khoản không tồn tại trong hệ thống.' });
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
