var express = require('express');
var router = express.Router();
const passport = require("passport")

const authController = require('../controllers/AuthController');
const userController = require('../controllers/UserController');

const roomController = require('../controllers/RoomController');


router.get('/login', authController.loginGET)

router.get('/logout', authController.logout)

router.post("/login", passport.authenticate('local', { failureRedirect: '/login', failureFlash: true }),
    authController.loginPOST);

router.get('/signup', authController.signupGET)

router.post('/signup', authController.signupPOST)

router.get('/forgotpassword', authController.forgotpasswordGET)

router.post('/forgotpassword', authController.forgotpasswordPOST);

//router.post('/getUserByContainingEmail', userController.getUserByContainingEmail);

router.get('/auth/google', passport.authenticate('google', { scope: [ 'email', 'profile' ] }) );

router.get('/auth/google/callback',
    passport.authenticate( 'google', { failureRedirect: '/login', failureFlash: true}), authController.loginPOST);

router.get('/verify/:userId/:uniqueString', userController.verifyUser);


router.post('/getRoomsByDay', roomController.getRoomsByDay)

module.exports = router;