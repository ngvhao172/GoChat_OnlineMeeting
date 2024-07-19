const bcrypt = require('bcrypt');
const accountService = require('../services/AccountService');
const userService = require('../services/UserService');

const User = require('../models/User');
const Account = require('../models/Account');

class AuthController {
    checkIsAuthenticated(req, res, next) {
        if (req.isAuthenticated()) {
            res.locals.user = req.user;
            // console.log("USERINFO: "+ res.locals.user.account);
            return next();
        }
        else {
            //Trả về trang 403
            res.redirect('/Unauthenticated');
        }
    }

    async loginGET(req, res, next){
        if(req.isAuthenticated()) {
            return res.redirect('/');
        }
        return res.render('login2');
    }
    logout(req, res, next) {
        req.logOut(function (err) {
            if (err) {
                console.log(err);
                return next(err);
            }
            res.redirect('/login');
        });
    }
    async signupGET(req, res, next){
        res.render('signup');
    }
    async loginPOST(req, res, next){
        // res.render("login")
        if(req.isAuthenticated()){
            return res.redirect("/");
        }
        // const {email, password} = req.body;
        // console.log(email, password);
        // const account = await accountService.getAccountByEmail(email);
        // console.log("USERINFO: ", account);
    };

    async signupPOST(req, res, next){
        let { fullname, email, password, cfpassword } = req.body;
        if(password != cfpassword){
            req.flash('type', 'danger');
            req.flash('message', 'Password do not match.');
            return res.redirect('/signup');
        }
        //check mail exists
        email = email.trim();
        password = password.trim();
        cfpassword = cfpassword.trim();
        fullname = fullname.trim();
        const result = await accountService.getAccountByEmail(email);
        // console.log(result);
        if (result.status === true) {
            req.flash('type', 'danger');
            req.flash('message', 'Account already exists.');
            return res.status(400).send("ACCOUNT EXISTS!");
            return res.redirect('/signup');
        }
        //tao user
        const user = new User()
        user.userEmail = email;
        user.fullName = fullname;
        user.createdAt = new Date();
        const resultUser = await userService.createUser(user);
        if(resultUser.status === true) {
            const userCreated = resultUser.data;

            //tao tai khoan
            //hash password
            const hasedPassword = await bcrypt.hash(password, 10);
            const account = new Account();
            account.userId = userCreated.id;
            account.password = hasedPassword;
            account.createdAt = new Date();
            account.enabled = true;
            account.verified = true;
            account.userEmail = email;
            const resultAccount = await accountService.createAccount(account);
            if(resultAccount.status === true) {
                req.flash('type', 'success');
                req.flash('message', 'Account created successfully.');
                return res.status(200).send("Success!");
                return res.redirect("/login");
            }
            else{
                req.flash('type', 'danger');
                req.flash('message', resultAccount.message);
                return res.status(400).send("FAILED!");
                return res.redirect("/signup");
            }
        }
        else{
            req.flash('type', 'danger');
            req.flash('message', resultUser.message);
            return res.status(400).send("FAILED!");
            return res.redirect("/signup");
        }
    }
}

module.exports = new AuthController;