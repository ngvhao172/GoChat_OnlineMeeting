var express = require('express');
var router = express.Router();
const passport = require("passport")

const authController = require('../controllers/AuthController');

router.get('/login', authController.loginGET)

router.get('/logout', authController.logout)

router.post("/login", passport.authenticate('local', { failureRedirect: '/login', failureFlash: true }),
    authController.loginPOST);

router.get('/signup', authController.signupGET)

router.post('/signup', authController.signupPOST)

router.get('/auth/google', passport.authenticate('google', { scope: [ 'email', 'profile' ] }));

router.get('/auth/google/callback',
    passport.authenticate( 'google', { failureRedirect: '/login', failureFlash: true, successRedirect: "/"}));

module.exports = router;