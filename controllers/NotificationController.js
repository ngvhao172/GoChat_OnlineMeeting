const NotificationSub = require("../models/NotificationSub");
const notificationService = require("../services/NotificationService");
const roomService = require("../services/RoomService");
const userService = require('../services/UserService');
const webPush = require("web-push");

class NotificationController {
    async sendNotification(req, res, next){
        const {from, to, roomId} = req.body;
        if(!from || !to || !roomId || !from.trim() || !to.trim() || !roomId.trim()){
            return res.status(400).json({ "status": "Error", "message": "Invite must have from, to and roomId" });
        }
        try {
            let fromUserAvatar;
            const fromUser = await userService.getUserByEmail(from);
            if(fromUser.status){
                fromUserAvatar = fromUser.data.avatar;
            }
            else{
                console.log("USER NOT FOUND: ", fromUser.message);
            }
            const user = await userService.getUserByEmail(to);
            if(!user.status){
                return res.status(500).json({ "status": "Error", "message": user.message });
            }
            const subs = await notificationService.getNotificationSubsByUserId(user.data.id);
            if(!subs.status){
                return res.status(500).json({ "status": "Error", "message": subs.message });
            }
            console.log(subs);
            const notifications = subs.data.map(sub =>
                webPush.sendNotification(sub.subScription, JSON.stringify({ from: fromUser.data.fullName, roomId: roomId, to: to, fromUserAvatar: fromUserAvatar }))
            );
    
            await Promise.all(notifications);
            //return res.render("main.hbs");
            res.json({ "status": "Success", "message": "Message sent to push service" });
        } catch (error) {
            console.error('Error sending notification:', error);
            res.status(500).json({ "status": "Error", "message": "Failed to send notifications" });
        }
    }
    async saveSubscription(req, res, next){
        const {userEmail, subscription} = req.body;
        if(!userEmail || !userEmail.trim() || !subscription || !subscription.trim()){
            return res.status(500).json({ "status": "Error", "message": "All fields are required" });
        }
        const userData = await userService.getUserByEmail(userEmail);
        if(!userData.status){
            return res.status(500).json({ "status": "Error", "message": userData.message });
        }
        const newSub = new NotificationSub();
        newSub.userId = userData.data.id;
        newSub.subScription = subscription;
        newSub.createdAt = new Date();
        const subSavedResult = await notificationService.createNotificationSub(newSub);
        if(subSavedResult.status){
            return res.json({ status: "Success", message: "Subscription saved!" })
        }else{
            res.status(500).json({ "status": "Error", "message": subSavedResult.message });
        }
    }

    async getSubscription(req, res, next) {
        try {
            const { endpoint, userEmail } = req.body;
            if(!userEmail || !userEmail.trim() || !endpoint || !endpoint.trim()){
                return res.status(400).json({ "status": "Error", "message": "All fields are required" });
            }
            const userData = await userService.getUserByEmail(userEmail);
            if(!userData.status){
                res.status(500).json({ "status": "Error", "message": userData.message });
            }
            const subsExisted = await notificationService.getNotificationSubByEndpointAndUserId(endpoint, userData.data.id);
    
            if (subsExisted.status) {
                return res.json({ status: true, message: "Subscription existed!" });
            } else {
                return res.json({ status: false, message: "Subscription does not exist!" });
            }
        } catch (error) {
            console.error('Error in getSubscription:', error);
            return res.status(500).json({ status: false, message: 'Internal server error', error });
        }
    }

    async sendInviteEmail(req, res, next){
        const {roomId, to} = req.body;
        if(!roomId || !roomId.trim() || !to || !to.trim()){
            return res.status(400).json({ "status": "Error", "message": "All fields are required" });
        }
        try {
            const invited = await notificationService.sendInviteEmail(to, roomId);
            if(invited.status){
                return res.json({ status: true, message: "Email Invitation sent!" });
            }
            else{
                return res.status(500).json({ status: false, message: invited.message });
            }
        } catch (error) {
            return res.status(500).json({ status: false, message: 'Error when sending email invitation', error });
        }

    }

    // async sendInviteEmailWhenCreate(req, res, next){
    //     const {roomId, to} = req.body;
    //     if(!roomId || !roomId.trim() || !to || !to.trim()){
    //         return res.status(400).json({ "status": "Error", "message": "All fields are required" });
    //     }
    //     try {
    //         const invited = await notificationService.sendInviteEmail(to, roomId);
    //         if(invited.status){
    //             const roomData = await roomService.getRoomByRoomId(roomId);
    //             if(roomData.status){
    //                 let attendees = roomData.data.attendees;
    //                 attendees.push(to);
    //                 let updateRoom = await roomService.updateRoom(roomId, {"attendees": attendees})
    //                 console.log(updateRoom);
    //             }

    //             return res.json({ status: true, message: "Email Invitation sent!" });
    //         }
    //         else{
    //             return res.status(500).json({ status: false, message: invited.message });
    //         }
    //     } catch (error) {
    //         return res.status(500).json({ status: false, message: 'Error when sending email invitation', error });
    //     }

    // }
    
}

module.exports = new NotificationController;