const WebSocket = require('ws');

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
        const roomId = this.generateRandomRoomId();

        // req.flash('created', true);
        const user = res.locals.user;
        const ws_url = res.locals.ws_url;
        const ws = new WebSocket(ws_url);
        ws.onopen = () => {
            ws.send(JSON.stringify({ action: 'create', roomId: roomId.toString().trim(), userId: user.id, email: user.userEmail}));
        }
        ws.onmessage = async (message) => {
            const data = JSON.parse(message.data);
            // console.log('Received:', data);
            // console.log(data.data.exists);
            switch (data.action) {
                case 'created':
                    if (data.status) {
                        req.flash("created", true);
                        return res.redirect(data.roomId);
                    }
                    else {
                        // console.log(data.message);
                        return res.redirect('/');
                    }
                default:
                    console.error('Unknown message action:', data.action);
            }
        }; 
    }

    getCurrentTime() {
        const now = new Date();
        const hours = now.getHours().toString().padStart(2, '0');
        const minutes = now.getMinutes().toString().padStart(2, '0');
        return `${hours}:${minutes}`;
    }
    joinRoom = async (req, res, next) => {
        //check if room exists
        const data = req.params;
        const roomId = data.roomId;
        // console.log("RoomId", roomId);
        const ws_url = res.locals.ws_url;
        const ws = new WebSocket(ws_url);
        ws.onopen = () => {
            ws.send(JSON.stringify({ action: 'check-room-existed', roomId: roomId.toString().trim(), email: res.locals.user.userEmail }));
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
                        const isOwner = (data.ownerId == res.locals.user.id)
                        if(isRoomNewCreated && isRoomNewCreated[0] == true || isPrejoined && isPrejoined[0] == true){
                            console.log("VO DAY CHU MAy?")
                            if(data.isApproved){
                                return res.render('index', {roomId: roomId, isOwner});
                            }
                            else{
                                return res.render('prejoin', {usersNumber: data.usersNumber, isOwner, isApproved: data.isApproved, roomId: roomId});
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
                    break;
                default:
                    console.error('Unknown message action:', data.action);
            }
        }; 
    }

    joinRoomPOST = async (req, res, next) => {

        console.log("VO DAY");
        const roomId = req.body.roomId;
        console.log(roomId);
        req.flash("prejoin", true);

        return res.redirect('/' + roomId.trim());
        // //request o day
        // const ws_url = res.locals.ws_url;
        // const ws = new WebSocket(ws_url);
        // ws.onopen = () => {
        //     ws.send(JSON.stringify({ action: 'requestJoin', roomId: roomId.toString().trim(), userId: res.locals.user.id, name: res.locals.user.fullName }));
        // }
        // ws.onmessage = async (message) => {
        //     const data = JSON.parse(message.data);
        //     // console.log('Received:', data);
        //     // console.log(data.exists);
        //     switch (data.action) {
        //         case 'requestResponse':
        //             if (data.isApproved) {
        //                 return res.redirect('/' + roomId.trim());
        //                 // else{
        //                 //     console.log(data);
        //                 //     return res.render('prejoin', {usersNumber: data.usersNumber, isOwner, isApproved});
        //                 // }
        //             }
        //             else {
        //                 // console.log("Room not found");
        //                 return res.redirect('/');
        //             }
        //         default:
        //             console.error('Unknown message action:', data.action);
        //     }
        // }; 
    }
    async notfound(req, res, next){
        return res.render("notfound");
    }

}

module.exports = new RoomController;