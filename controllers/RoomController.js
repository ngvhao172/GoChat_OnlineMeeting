const WebSocket = require('ws');
const moment = require('moment-timezone');
const roomService = require("../services/RoomService");
const Room = require('../models/Room');
const userService = require('../services/UserService');
const notificationService = require('../services/NotificationService');

class RoomController {

    async index(req, res, next){
        return res.render('main');
    }
    generateRandomRoomId() {
        const characters = 'abcdefghijklmnopqrstuvwxyz';
        const groupLength = 4; 
        const numGroups = 3;  
        let roomId = '';
      
        for (let i = 0; i < numGroups; i++) {
            let group = '';
            for (let j = 0; j < groupLength; j++) {
                const randomIndex = Math.floor(Math.random() * characters.length);
                group += characters[randomIndex];
            }
            roomId += group;
            if (i < numGroups - 1) {
                roomId += '-';
            }
        }
      
        return roomId;
    }
    createRoom = async (req, res, next) => {
        try {
            const roomId = this.generateRandomRoomId();

            // req.flash('created', true);
            const user = res.locals.user;
            const ws_url = res.locals.ws_url;
            const token = res.locals.token;
            console.log(token)
            const ws = new WebSocket(`${ws_url}?token=${encodeURIComponent(token)}`);
            ws.onopen = () => {
                ws.send(JSON.stringify({ action: 'create', roomId: roomId.toString().trim(), userId: user.id, userEmail: user.userEmail}));
            }
            ws.onmessage = async (message) => {
                const data = JSON.parse(message.data);
                // console.log('Received:', data);
                // console.log(data.data.exists);
                switch (data.action) {
                    case 'created':
                        if (data.status) {
                            //save room to dtb
                            //
                            try {
                                let date = moment.utc(new Date()).tz('Asia/Ho_Chi_Minh').format();
                                const userData = await userService.getUserByEmail(user.userEmail);
                                const userEmail = user.userEmail;
                                if(userData.status){
                                    const newRoom = new Room();
                                    newRoom.roomId = roomId;
                                    newRoom.createdAt = date;
                                    newRoom.startAt = date;
                                    newRoom.roomName = user.fullName + "'s Go Chat";
                                    newRoom.creatorId = userData.data.id;
                                    newRoom.attendees = [userEmail]
                                    newRoom.specificDates = [moment.utc(new Date()).tz('Asia/Ho_Chi_Minh').format("YYYY-MM-DD")]
                                    console.log(newRoom)
                                    const savedRoom = await roomService.createRoom(newRoom);
                                    console.log(savedRoom);
                                }
                                req.flash("created", true);
                                return res.redirect(data.roomId);   
                            } catch (error) {
                                console.log(error);
                            }
                        }
                        else {
                            // console.log(data.message);
                            return res.redirect('/');
                        }
                    default:
                        console.error('Unknown message action:', data.action);
                }
            }; 
        } catch (error) {
            console.log(error)
        }
    }

    getCurrentTime() {
        const now = new Date();
        const hours = now.getHours().toString().padStart(2, '0');
        const minutes = now.getMinutes().toString().padStart(2, '0');
        return `${hours}:${minutes}`;
    }
    joinRoom = async (req, res, next) => {
        //check if room exists
        try {
            const data = req.params;
            const roomId = data.roomId;
            // console.log("RoomId", roomId);
            const ws_url = res.locals.ws_url;
            const token = res.locals.token;
            const ws = new WebSocket(`${ws_url}?token=${encodeURIComponent(token)}`);
            ws.onopen = () => {
                ws.send(JSON.stringify({ action: 'check-room-existed', roomId: roomId.toString().trim(), userEmail: res.locals.user.userEmail }));
            }
            ws.onmessage = async (message) => {
                const data = JSON.parse(message.data);
                console.log('Received: JOIN GET', data);
                // console.log(data.exists);
                switch (data.action) {
                    case 'checked-result':
                        if (data.exists) {
                            // console.log("Room found");
                            const isRoomNewCreated = req.flash('created');
                            const isPrejoined =  req.flash("prejoin");
                            console.log("IS PREJOIN", isPrejoined);
                            const isOwner = (data.ownerEmail == res.locals.user.userEmail);
                            if(data.isBlocked){
                                return res.render('prejoin', { isBlocked: true});
                            }
                            if(isRoomNewCreated && isRoomNewCreated[0] == true || isPrejoined && isPrejoined[0] == true){
                                try {
                                    console.log("VO DAY CHU MAy?")
                                    if(data.isApproved){
                                        const roomData = await roomService.getRoomByRoomId(roomId);
                                        let attendees = roomData.data.attendees;
                                        if(!attendees.includes(res.locals.user.userEmail)){
                                            attendees.push(res.locals.user.userEmail);
                                        }
                                        await roomService.updateRoom(roomData.data.id, { "attendees": attendees});
                                        return res.render('index', {roomId: roomId, isOwner});
                                    }
                                    else{
                                        return res.render('prejoin', {usersNumber: data.usersNumber, isOwner, isApproved: data.isApproved, roomId: roomId});
                                    }
                                } catch (error) {
                                    console.log(error);
                                    return res.redirect('/');
                                }
                            }
                            else{
                                console.log(data);
                                console.log("ISAPPROVED:", data.isApproved);
                                return res.render('prejoin', {usersNumber: data.usersNumber, isOwner, isApproved: data.isApproved, roomId: roomId});
                            }
                        }
                        else {
                            // console.log("Room not found");
                            return res.redirect('/notfound');
                        }
                    default:
                        console.error('Unknown message action:', data.action);
                }
            }; 
        } catch (error) {
            console.log(error)
        }
    }

    joinRoomPOST = async (req, res, next) => {
        try {
            console.log("VO DAY");
            const roomId = req.body.roomId;
            console.log(roomId);
            req.flash("prejoin", true);
    
            return res.redirect('/' + roomId.trim());   
        } catch (error) {
            console.log(error)
        }
    }

    async shareScreen(req, res, next){
        try {
            console.log("VO SHARE");
            const roomId = req.body.roomId;
            console.log(roomId);
            req.flash("prejoin", true);
            req.flash("companionMode", true);
    
            return res.redirect('/' + roomId.trim());   
        } catch (error) {
            console.log(error)
        }
    }

    async notfound(req, res, next){
        return res.render("notfound");
    }

    async getRoomsByDay(req, res, next){
        try {
            const { day } = req.body;
            //const userData = await userService.getUserByEmail(res.locals.user.userEmail);
            // if(userData.status){
            //     console.log(day);
                
            // }
            const rooms = await roomService.getRoomsByUserEmailAndWeekDay(day, res.locals.user.userEmail);
            if(rooms.status){
                rooms.data.forEach(room => {
                    //console.log(room.attendees[0])
                    if(room.attendees[0] == res.locals.user.userEmail){
                        room.owner = true;
                    }
                })
                return res.json(rooms.data);
            }
            return res.status(400).json(rooms.message);
        } catch (error) {
            return res.status(500).json("error:" + error);
        }
    }
    async deleteRoomById(req, res, next){
        try {
            const { id } = req.body;
            const response = await roomService.deleteRoom(id);
            if(response.status){
                return res.json(response.message)
            }
            return res.status(400).json(response.message);
        } catch (error) {
            return res.status(500).json("error:" + error);
        }
    }

    createRoomSchedule = async (req, res, next) =>{
   
        const { roomName, startAt, endAt, daysOfWeek, attendees } = req.body;
        console.log("DATA SEND TO SCHEDULE")
        console.log(roomName, startAt, endAt, daysOfWeek, attendees);

        const roomId = this.generateRandomRoomId();
        let newListAttendees = [res.locals.user.userEmail];
        if(attendees.length!=0){
            let attendant = attendees.split(",").map(email => email.trim());
            console.log(attendant)
            let startTime = new Date(startAt).toLocaleTimeString() + ' ' + new Date(startAt).toLocaleDateString();
            let endTime = new Date(endAt).toLocaleTimeString() +' '+ new Date(endAt).toLocaleDateString()
            attendant.forEach(async email => {
                if(email.includes("@")){
                    if(!newListAttendees.includes(email.trim())){
                        const userExisted = await userService.getUserByEmail(email);
                        console.log(userExisted);
                        if(userExisted.status){
                            newListAttendees.push(email.trim()); 
                            await notificationService.sendInviteEmail(email, roomId, startTime, endTime);    
                        }
                    }
                }
            });
        }
        console.log(newListAttendees);

        // req.flash('created', true);
        const user = res.locals.user;
        const ws_url = res.locals.ws_url;
        const token = res.locals.token;
        const ws = new WebSocket(`${ws_url}?token=${encodeURIComponent(token)}`);
        ws.onopen = () => {
            ws.send(JSON.stringify({ action: 'create', roomId: roomId.toString().trim(), userEmail: user.userEmail, attendes: newListAttendees}));
        }
        ws.onmessage = async (message) => {
            const data = JSON.parse(message.data);
            switch (data.action) {
                case 'created':
                    if (data.status) {
                        try {
                            let date = moment.utc(new Date()).tz('Asia/Ho_Chi_Minh').format();
                            const userData = await userService.getUserByEmail(user.userEmail)
                            if(userData.status){
                                const newRoom = new Room();
                                newRoom.roomId = roomId;
                                newRoom.createdAt = date;
                                newRoom.startAt = startAt;
                                newRoom.endAt = endAt;
                                newRoom.roomName = roomName;
                                newRoom.daysOfWeek = daysOfWeek;
                                newRoom.creatorId = userData.data.id;
                                newRoom.attendees = newListAttendees;
                                newRoom.specificDates = [moment.utc(new Date(startAt)).tz('Asia/Ho_Chi_Minh').format("YYYY-MM-DD")]
                                console.log(newRoom)
                                const savedRoom = await roomService.createRoom(newRoom);
                                console.log(savedRoom);
                                if(savedRoom.status){
                                    return res.json(savedRoom)
                                }
                                return res.status(400).json(savedRoom.message)
                            }
                            return res.status(400).json(userData.message)
                        } catch (error) {
                            console.log(error);
                            return res.status(500).json("Error when creating room: " + error)
                        }
                    }
                    else {
                        // console.log(data.message);
                        //return res.redirect('/');
                        return res.status(500).json("Room already exists")
                    }
                default:
                    console.error('Unknown message action:', data.action);
                    return res.status(500).json('Unknown message action:' + data.action)
            }
        }; 
    }

    async updateRoom(req, res, next){
        try {
            const { id, roomName, startAt, endAt, attendees, daysOfWeek } = req.body;
            let newListAttendees = [res.locals.user.userEmail];
            if(attendees.length!=0){
                let attendeesList = attendees.split(',');
                attendeesList.forEach(email => {
                    if(email.includes("@")){
                        if(!newListAttendees.includes(email.trim())){
                            newListAttendees.push(email.trim()); 
                        }
                    }
                });
            }
            
            // const roomData = await roomService.getRoomByRoomId(roomId);
            // if(roomData.status){
            let updateRoom = await roomService.updateRoom(id, {"roomName": roomName, "startAt": startAt, "endAt": endAt, "attendees": newListAttendees, "daysOfWeek": daysOfWeek});
            if(updateRoom.status){
                return res.json(updateRoom) 
            }
            else{
                return res.status(400).json(updateRoom.message)
            }
        } catch (error) {
            return res.status(500).json("Error when update room: " + error)
        }
    }

    async addRoomAttendees(req, res, next){
        try {
            const { roomId, newAttendees } = req.body;
            console.log(roomId);
            const roomData = await roomService.getRoomByRoomId(roomId);
            if(roomData.status){
                if(roomData.data.attendees[0] == res.locals.user.userEmail){
                    let attendees = roomData.data.attendees;
                    newAttendees.forEach(email => {
                        if(!attendees.includes(email)){
                            attendees.push(email);
                        }
                    })
                    let updateRoom = await roomService.updateRoom(roomData.data.id, { "attendees": attendees});
                    if(updateRoom.status){
                        return res.json(updateRoom) 
                    }
                    else{
                        return res.status(400).json(updateRoom.message)
                    } 
                }
                return res.status(400).json("Unauthorize request");
            }
        } catch (error) {
            return res.status(500).json("Error add room attendee: "+ error);
        }
    } 

    async getRoomById(req, res, next){
        const { id } = req.body;
        const roomData = await roomService.getRoomById(id);
        if(roomData.status){
            return res.status(200).json(roomData.data);
        }
        else{
            return res.status(400).json(roomData.message)
        } 
    }

    createMeetingLaterUse = async (req, res, next) => {
        try {
            const roomId = this.generateRandomRoomId();

            // req.flash('created', true);
            const user = res.locals.user;
            const ws_url = res.locals.ws_url;
            const token = res.locals.token;
            const ws = new WebSocket(`${ws_url}?token=${encodeURIComponent(token)}`);
            ws.onopen = () => {
                ws.send(JSON.stringify({ action: 'create', roomId: roomId.toString().trim(), userId: user.id, userEmail: user.userEmail}));
            }
            ws.onmessage = async (message) => {
                const data = JSON.parse(message.data);
                // console.log('Received:', data);
                // console.log(data.data.exists);
                switch (data.action) {
                    case 'created':
                        if (data.status) {
                            //save room to dtb
                            //
                            const dates = [];
                            const timezone = 'Asia/Ho_Chi_Minh';
                            let currentDate = moment.tz(timezone);
                            for (let i = 0; i < 7; i++) {
                                dates.push(currentDate.format("YYYY-MM-DD"));
                                currentDate = currentDate.add(1, 'days');
                            }
                            try {
                                let date = moment.utc(new Date()).tz('Asia/Ho_Chi_Minh').format();
                                const userData = await userService.getUserByEmail(user.userEmail);
                                const userEmail = user.userEmail;
                                if(userData.status){
                                    const newRoom = new Room();
                                    newRoom.roomId = roomId;
                                    newRoom.createdAt = date;
                                    newRoom.roomName = user.fullName + "'s Go Later Meeting";
                                    newRoom.creatorId = userData.data.id;
                                    newRoom.attendees = [userEmail]
                                    newRoom.specificDates = dates
                                    console.log(newRoom)
                                    const savedRoom = await roomService.createRoom(newRoom);
                                    console.log(savedRoom);
                                }
                                return res.status(200).json(res.locals.domain + '/' + roomId);  
                            } catch (error) {
                                return res.status(400).json("Error when creating later meeting: " + error);  
                            }
                        }
                        else {
                            // console.log(data.message);
                            return res.status(400).json("Error when creating later meeting: " + error);  
                        }
                    default:
                        console.error('Unknown message action:', data.action);
                }
            }; 
        } catch (error) {
            return res.status(500).json("Error when creating later meeting: " + error);  
        }
    }

}

module.exports = new RoomController;