const LocalStrategy = require("passport-local").Strategy
const bcrypt = require("bcrypt")
const accountService = require('../services/AccountService');
const userService = require('../services/UserService');

//Login passport 
function initialize(passport) {
    const authenticateUsers = async (email, password, done) => {
        email = email.trim();
        password = password.trim();
        const result = await accountService.getAccountByEmail(email);
        // console.log(result);
        if (result.status === true) {
            const account = result.data;
            //Tồn tại tài khoản
            if (account != null) {
                if (await bcrypt.compare(password, account.password)) {
                    //Lấy user + account đưa vào passport
                    // console.log(account.userId);
                    const userData = await userService.getUserById(account.userId);
                    if(userData.status){
                        const user = userData.data;
                        return done(null, user);
                    }
                    else{
                        return done(null, false, { message: 'Không tìm thấy người dùng' });
                    }
                }
                else {
                    return done(null, false, { message: 'Tên đăng nhập hoặc mật khẩu không đúng' });
                }
            }
        } else {
            return done(null, false, { message: 'Tên đăng nhập hoặc mật khẩu không đúng' });
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







