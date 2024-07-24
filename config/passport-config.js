const LocalStrategy = require("passport-local").Strategy
const bcrypt = require("bcrypt")
const accountService = require('../services/AccountService');
const userService = require('../services/UserService');
const userVerificationService = require("../services/UserVerificationService");

//Login passport 
function initialize(passport) {
    const authenticateUsers = async (email, password, done) => {
        if(!email || !password || !email.trim() || !password.trim()){
            return done(null, false, { message: "All fields are required" }); 
        }
        email = email.trim();
        password = password.trim();
        const result = await accountService.getAccountByEmail(email);
        // console.log(result);
        if (result.status === true) {
            const account = result.data;
            //Tồn tại tài khoản
            if (account != null) {
                if(!account.verified){
                    const userVerifiedExist = await userVerificationService.getUserVerificationByUserId(account.userId);
                    if(userVerifiedExist.status){
                        return done(null, false, { message: "Your account hasn't been verified yet. Check your email inbox to verify it" });   
                    }
                    else{
                        const newVerified = await userVerificationService.sendVerificationEmail(account.userId, account.userEmail);
                        if(newVerified.status){
                            return done(null, false, { message: "Verification has been sent. Please check your email inbox." }); 
                        }
                        else{
                            return done(null, false, { message: "Failed when sending verification. " + newVerified.message }); 
                        }
                    }
                }
                if (await bcrypt.compare(password, account.password)) {
                    //Lấy user + account đưa vào passport
                    // console.log(account.userId);
                    const userData = await userService.getUserById(account.userId);
                    if(userData.status){
                        const user = userData.data;
                        return done(null, user);
                    }
                    else{
                        return done(null, false, { message: userData.message });
                    }
                }
                else {
                    return done(null, false, { message: "Email or password incorrect" });
                }
            }
        } else {
            return done(null, false, { message: "Email or password incorrect" });
        }
    }
    passport.use(new LocalStrategy({ usernameField: 'email' }, authenticateUsers))
    passport.serializeUser((user, done) => done(null, user.id))
    passport.deserializeUser(async (id, done) => {
        // console.log(id);
        const userData = await userService.getUserById(id);
        const user = userData.data;
        return done(null, user)
    })
}

module.exports = initialize







