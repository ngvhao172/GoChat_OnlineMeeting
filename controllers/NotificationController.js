const NotificationSub = require("../models/NotificationSub");
const notificationService = require("../services/NotificationService");
const userService = require('../services/UserService');
const webPush = require("web-push");

class NotificationController {
    async sendNotification(req, res, next){
        const {from, to, roomId} = req.body;
        if(!from || !to || !roomId){
            return res.status(500).json({ "status": "Error", "message": "Invite must have from, to and roomId" });
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
        const {userId, subscription} = req.body;
        const newSub = new NotificationSub();
        newSub.userId = userId;
        newSub.subScription = subscription;
        newSub.createdAt = new Date();
        const subSavedResult = await notificationService.createNotificationSub(newSub);
        if(subSavedResult.status){
            return res.json({ status: "Success", message: "Subscription saved!" })
        }
    }

    async getSubscription(req, res, next) {
        try {
            const { endpoint, userId } = req.body;
            const subsExisted = await notificationService.getNotificationSubByEndpointAndUserId(endpoint, userId);
    
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
    
}

module.exports = new NotificationController;