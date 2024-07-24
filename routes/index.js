var express = require('express');
var router = express.Router();

const roomController = require('../controllers/RoomController');

const userController = require('../controllers/UserController');

const notificationController = require('../controllers/NotificationController');
const AccountService = require('../services/AccountService');
const accountController = require('../controllers/AccountController');

router.post('/createMeeting', roomController.createRoom);

router.get('/profile', userController.index)

router.post('/profile', userController.updateProfile)

router.post('/updateUserAvatar', userController.updateUserAvatar)

router.post('/saveSubscription', notificationController.saveSubscription)

router.post('/sendNotification', notificationController.sendNotification);

router.post('/getSubscription', notificationController.getSubscription)

router.post('/sendInviteEmail', notificationController.sendInviteEmail)

router.post('/getUserByContainingEmail', userController.getUserByContainingEmail);

router.post('/deleteUsers', userController.deleteUserByUserEmail);

router.post('/changePassword', accountController.changePassword)

router.get('/notfound', roomController.notfound)

router.get('/', roomController.index);

router.get('/favicon.ico', (req, res) => res.end());

router.get('/:roomId', roomController.joinRoom);

router.post('/:roomId', roomController.joinRoomPOST);

module.exports = router;
