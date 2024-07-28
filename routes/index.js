var express = require('express');
var router = express.Router();

const roomController = require('../controllers/RoomController');

const userController = require('../controllers/UserController');

const notificationController = require('../controllers/NotificationController');

const accountController = require('../controllers/AccountController');

const authController = require('../controllers/AuthController');

router.post('/createMeeting', roomController.createRoom);

router.post('/shareScreen', roomController.shareScreen);

router.get('/profile', userController.index)

router.post('/profile', userController.updateProfile)

router.post('/updateUserAvatar', userController.updateUserAvatar)

router.post('/saveSubscription', notificationController.saveSubscription)

router.post('/sendNotification', notificationController.sendNotification);

router.post('/getSubscription', authController.authenticateToken, notificationController.getSubscription) // api

router.post('/sendInviteEmail', authController.authenticateToken, notificationController.sendInviteEmail) // api

router.post('/addRoomAttendees', authController.authenticateToken, roomController.addRoomAttendees) //api

router.post('/getUserByContainingEmail', authController.authenticateToken, userController.getUserByContainingEmail); // api

router.post('/deleteUsers', authController.authenticateToken, userController.deleteUserByUserEmail); //api

router.post('/getRoomsByDay', authController.authenticateToken, roomController.getRoomsByDay); //api

router.post('/deleteRoomById', authController.authenticateToken, roomController.deleteRoomById); //api

router.post('/createRoomSchedule', authController.authenticateToken, roomController.createRoomSchedule) //api

router.post('/updateRoom',authController.authenticateToken, roomController.updateRoom); //api

router.post('/getRoomById',authController.authenticateToken, roomController.getRoomById); //api

router.post('/createLaterMeeting',authController.authenticateToken, roomController.createMeetingLaterUse) //api

router.post('/changePassword', accountController.changePassword);

router.get('/notfound', roomController.notfound)

router.get('/', roomController.index);

router.get('/favicon.ico', (req, res) => res.end());

router.get('/:roomId', roomController.joinRoom);

router.post('/:roomId', roomController.joinRoomPOST);

module.exports = router;
