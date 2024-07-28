const { app } = require('../config/firebase');
const NotificationSub = require("../models/NotificationSub");
const { getFirestore, collection, doc, getDoc, addDoc, updateDoc, deleteDoc, where, query, Timestamp, getDocs } = require('firebase/firestore');
const db = getFirestore(app);

const nodemailer = require('nodemailer');

class NotificationSubService {
    async createNotificationSub(notificationSub) {
        try {
            const notificationSubRef = await addDoc(collection(db, 'notificationSubs'), {
                userId: notificationSub.userId,
                subScription: notificationSub.subScription,
                createdAt: Timestamp.fromDate(new Date(notificationSub.createdAt))
            });
            notificationSub.id = notificationSubRef.id;
            console.log('Notification Subscription created:', notificationSub);
            return { status: true, data: notificationSub };
        } catch (error) {
            console.error('Error creating notification subscription:', error);
            return { status: false, message: 'Error creating notification subscription', error };
        }
    }

    async getNotificationSubsByUserId(userId) {
        try {
            const q = query(collection(db, 'notificationSubs'), where('userId', '==', userId));
            const querySnapshot = await getDocs(q);
            const subs = [];
            querySnapshot.forEach((doc) => {
                subs.push(new NotificationSub(
                    doc.id,
                    doc.data().userId,
                    doc.data().subScription,
                    doc.data().createdAt.toDate()
                ));
            });
            return { status: true, data: subs };
        } catch (error) {
            console.error('Error getting notification subscriptions by user ID:', error);
            return { status: false, message: 'Error getting notification subscriptions by user ID', error };
        }
    }
    async getNotificationSubByEndpointAndUserId(endpoint, userId) {
        try {
            
            const notificationSubsRef = collection(db, 'notificationSubs');
            
            const q = query(
                notificationSubsRef,
                where('subScription.endpoint', '==', endpoint),
                where('userId', '==', userId)
            );
            
            const querySnapshot = await getDocs(q);
            
            if (querySnapshot.empty) {
                console.log('Notification Subscription not found');
                return { status: false, message: "Không tìm thấy đăng ký với endpoint: " + endpoint + " và userId: " + userId };
            }
            
            const notificationSubDoc = querySnapshot.docs[0];
            const notificationSubData = notificationSubDoc.data();
            
            const notificationSub = new NotificationSub(
                notificationSubDoc.id,
                notificationSubData.userId,
                notificationSubData.subScription,
                notificationSubData.createdAt.toDate()
            );
            
            return { status: true, data: notificationSub };
        } catch (error) {
            console.error('Error getting notification subscription by endpoint and userId:', error);
            return { status: false, message: 'Error getting notification subscription by endpoint and userId', error };
        }
    }
    
    async getNotificationSubById(id) {
        try {
            const notificationSubRef = doc(db, 'notificationSubs', id.trim());
            const notificationSubSnap = await getDoc(notificationSubRef);

            if (!notificationSubSnap.exists()) {
                console.log('Notification Subscription not found');
                return { status: false, message: "Không tìm thấy đăng ký với id: " + id };
            }

            const notificationSubData = notificationSubSnap.data();
            const notificationSub = new NotificationSub(
                notificationSubSnap.id,
                notificationSubData.userId,
                notificationSubData.subScription,
                notificationSubData.createdAt.toDate()
            );
            return { status: true, data: notificationSub };
        } catch (error) {
            console.error('Error getting notification subscription by ID:', error);
            return { status: false, message: 'Error getting notification subscription by ID', error };
        }
    }

    async updateNotificationSub(id, updatedData) {
        try {
            const notificationSubRef = doc(db, 'notificationSubs', id.trim());
            await updateDoc(notificationSubRef, updatedData);
            console.log('Notification Subscription updated with ID:', id);
            return { status: true, data: { id, ...updatedData } };
        } catch (error) {
            console.error('Error updating notification subscription:', error);
            return { status: false, message: 'Error updating notification subscription', error };
        }
    }

    async deleteNotificationSub(id) {
        try {
            const notificationSubRef = doc(db, 'notificationSubs', id.trim());
            await deleteDoc(notificationSubRef);
            console.log('Notification Subscription deleted with ID:', id);
            return { status: true, data: id };
        } catch (error) {
            console.error('Error deleting notification subscription:', error);
            return { status: false, message: 'Error deleting notification subscription', error };
        }
    }

    async listNotificationSubs() {
        try {
            const snapshot = await getDocs(collection(db, 'notificationSubs'));
            const subs = [];
            snapshot.forEach(doc => {
                subs.push(new NotificationSub(
                    doc.id,
                    doc.data().userId,
                    doc.data().subScription,
                    doc.data().createdAt.toDate()
                ));
            });
            return { status: true, data: subs };
        } catch (error) {
            console.error('Error listing notification subscriptions:', error);
            return { status: false, message: 'Error listing notification subscriptions', error };
        }
    }

    sendInviteEmail = async ( userEmail, roomId, startAt, endAt ) => {
        const transporter = nodemailer.createTransport({
            service: "gmail",
            auth: {
                user: process.env.AUTH_EMAIL,
                pass: process.env.PASSWORD,
            },
        });
        const currentUrl = process.env.DOMAIN;
        const footer = "<br/><br/><hr/><p>Best regards,<br/>GoChat - Online Meeting<br/>Address: District 7, Ho Chi Minh City, Vietnam<br/>Email: gochat.onlinemeeting@gmail.com</p>";
        const mailOptions = {
            from: process.env.AUTH_EMAIL,
            to: userEmail,
            subject: "[GoChat] Meeting Invitation",
            html: `<p>You are inviting to a meeting.</p>
                <p>Room code: ${roomId} </p>
                ${startAt ? ' <p>Start at:  ' +  startAt + '</p>'  : '' }
                ${endAt ? ' <p>End at:  ' +  endAt + '</p>'  : '' }
                <p>Press <a href=${currentUrl + "/" + roomId }> here </a> to join.</p>` + footer,
        };
        try {
            const info = await transporter.sendMail(mailOptions);
            console.log(`Verification mail has been sent to ${mailOptions.to}`);
            return { status: true };

        } catch (err) {
            console.error("An error occurred while sending email:", err.message);
            return {
                status: false,
                message: err.message,
            };
        }
    };
}

module.exports = new NotificationSubService;