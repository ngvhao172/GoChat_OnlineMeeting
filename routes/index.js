var express = require('express');
var router = express.Router();

const roomController = require('../controllers/RoomController');

router.post('/createMeeting', roomController.createRoom);

router.get('/:roomId', roomController.joinRoom);

router.post('/:roomId', roomController.joinRoomPOST);

router.get('/', roomController.index);

module.exports = router;
