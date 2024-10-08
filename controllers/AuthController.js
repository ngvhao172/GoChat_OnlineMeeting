const bcrypt = require("bcrypt");
const accountService = require("../services/AccountService");
const userService = require("../services/UserService");
const userVerificationService = require("../services/UserVerificationService");
const jwt = require("jsonwebtoken");
const { v4: uuidv4 } = require("uuid");

const User = require("../models/User");
const Account = require("../models/Account");

const secret_key = process.env.SECRET_KEY;

class AuthController {
  rememberMeMiddleware(req, res, next) {
    req.rememberMe = req.body.rememberMe === "on";
    next();
  }

  checkIsAuthenticated(req, res, next) {
    if (req.isAuthenticated()) {
      res.locals.user = req.user;
      // console.log("USERINFO: "+ res.locals.user.account);
      return next();
    } else {
      //Trả về trang 403
      res.redirect("/Unauthenticated");
    }
  }

  async loginGET(req, res, next) {
    if (req.isAuthenticated()) {
      return res.redirect("/");
    }
    return res.render("login");
  }
  logout(req, res, next) {
    req.logout((err) => {
      if (err) {
        console.log("Logout error:", err);
        return next(err);
      }

      req.session.destroy((err) => {
        if (err) {
          console.log("Session destroy error:", err);
          return next(err);
        }

        res.clearCookie("authToken");

        res.redirect("/login");
      });
    });
  }

  async signupGET(req, res, next) {
    res.render("signup");
  }
  async loginPOST(req, res, next) {
    // res.render("login")
    if (req.isAuthenticated()) {
      const sessionUUID = uuidv4();
      req.session.userUUID = sessionUUID;
      const user = req.user;
      const userEmail = user.userEmail;
      const expiresIn = req.rememberMe ? "7d" : "7h";
      const token = jwt.sign({ userEmail }, secret_key, {
        expiresIn: expiresIn,
      });
      console.log(req.rememberMe);
      res.cookie("authToken", token, {
        httpOnly: true,
        secure: true,
        maxAge: req.rememberMe ? 7 * 24 * 60 * 60 * 1000 : 7 * 60 * 60 * 1000,
      });
      res.locals.token = token;
      req.session.token = token;
      return res.redirect("/");
    }
  }

  async signupPOST(req, res, next) {
    try {
      let { fullname, email, password, cfpassword } = req.body;
      if (password != cfpassword) {
        req.flash("type", "danger");
        req.flash("message", "Password do not match.");
        return res.redirect("/signup");
      }
      if (
        !fullname ||
        !email ||
        !password ||
        !cfpassword ||
        !fullname.trim() ||
        !email.trim() ||
        !password.trim() ||
        !cfpassword.trim()
      ) {
        req.flash("type", "danger");
        req.flash("message", "All fields are required.");
        return res.redirect("/signup");
      }
      const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)[a-zA-Z\d]{8,}$/;
      if (!passwordRegex.test(password)) {
        req.flash("type", "danger");
        req.flash(
          "message",
          "Password must contain at least 8 characters, 1 uppercase letter, 1 lowercase letter, and 1 number"
        );
        return res.redirect("/signup");
      }
      //check mail exists
      email = email.trim();
      password = password.trim();
      cfpassword = cfpassword.trim();
      fullname = fullname.trim();
      const result = await accountService.getAccountByEmail(email);
      // console.log(result);
      if (result.status === true) {
        req.flash("type", "danger");
        req.flash("message", "Account already exists.");
        // return res.status(400).send("ACCOUNT EXISTS!");
        return res.redirect("/signup");
      }
      //tao user
      const user = new User();
      user.userEmail = email;
      user.fullName = fullname;
      user.createdAt = new Date();
      const resultUser = await userService.createUser(user);
      if (resultUser.status === true) {
        const userCreated = resultUser.data;

        //tao tai khoan
        //hash password
        const hasedPassword = await bcrypt.hash(password, 10);
        const account = new Account();
        account.userId = userCreated.id;
        account.password = hasedPassword;
        account.createdAt = new Date();
        account.enabled = true;
        account.verified = false;
        account.userEmail = email;
        const resultAccount = await accountService.createAccount(account);
        if (resultAccount.status === true) {
          const veri = await userVerificationService.sendVerificationEmail(
            userCreated.id,
            account.userEmail
          );
          if (veri.status) {
            req.flash("type", "success");
            req.flash(
              "message",
              "Account created successfully. Please check your email inbox"
            );
            //return res.status(200).send("Success!");
            return res.redirect("/login");
          } else {
            req.flash("type", "danger");
            req.flash("message", veri.message);
            //return res.status(400).send("FAILED!");
            return res.redirect("/signup");
          }
        } else {
          req.flash("type", "danger");
          req.flash("message", resultAccount.message);
          //return res.status(400).send("FAILED!");
          return res.redirect("/signup");
        }
      } else {
        req.flash("type", "danger");
        req.flash("message", resultUser.message);
        //return res.status(400).send("FAILED!");
        return res.redirect("/signup");
      }
    } catch (error) {
      req.flash("type", "danger");
      req.flash("message", error.message);
      //return res.status(400).send("FAILED!");
      return res.redirect("/signup");
    }
  }

  generatePassword() {
    const upperCaseChars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
    const lowerCaseChars = "abcdefghijklmnopqrstuvwxyz";
    const numbers = "0123456789";
    const specialChars = "!@#$%^&*()_+~`|}{[]:;?><,./-=";

    const allChars = upperCaseChars + lowerCaseChars + numbers + specialChars;

    let password = "";

    password += upperCaseChars.charAt(
      Math.floor(Math.random() * upperCaseChars.length)
    );
    password += lowerCaseChars.charAt(
      Math.floor(Math.random() * lowerCaseChars.length)
    );
    password += numbers.charAt(Math.floor(Math.random() * numbers.length));
    password += specialChars.charAt(
      Math.floor(Math.random() * specialChars.length)
    );

    for (let i = password.length; i < 8; i++) {
      password += allChars.charAt(Math.floor(Math.random() * allChars.length));
    }
    password = password
      .split("")
      .sort(() => 0.5 - Math.random())
      .join("");

    return password;
  }

  async forgotpasswordGET(req, res, next) {
    return res.render("forgotpassword");
  }

  forgotpasswordPOST = async (req, res, next) => {
    try {
      const { email } = req.body;
      if (!email || !email.trim()) {
        req.flash("type", "danger");
        req.flash("message", "Email is required");
        return res.redirect("/forgotpassword");
      }
      const userAccountData = await accountService.getAccountByEmail(email);
      if (!userAccountData.status) {
        req.flash("type", "danger");
        req.flash("message", userAccountData.message);
        return res.redirect("/forgotpassword");
      }
      const account = userAccountData.data;
      const newPassword = this.generatePassword();
      const hasedPassword = await bcrypt.hash(newPassword, 10);
      const updatePassword = await accountService.updateAccountById(
        account.id,
        { password: hasedPassword }
      );
      if (updatePassword.status) {
        const sendResult = await accountService.sendResetPassword(
          email,
          newPassword
        );
        if (sendResult.status) {
          req.flash("type", "success");
          req.flash("message", "New password has been sent to your email.");
          return res.redirect("/forgotpassword");
        } else {
          req.flash("type", "danger");
          req.flash("message", sendResult.message);
          return res.redirect("/forgotpassword");
        }
      } else {
        req.flash("type", "danger");
        req.flash(
          "message",
          "Error when reset your password: " + updatePassword.message
        );
        return res.redirect("/forgotpassword");
      }
    } catch (error) {
      console.log(error);
    }
  };

  async authenticateToken(req, res, next) {
    const token = res.locals.token;

    if (!token) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    jwt.verify(token, secret_key, (err, user) => {
      if (err) {
        return res.status(403).json({ message: "Forbidden" });
      }
      if (user.userEmail == res.locals.user.userEmail) {
        next();
      } else {
        return res.status(401).json({ message: "Unauthorized" });
      }
    });
  }
}

module.exports = new AuthController();
