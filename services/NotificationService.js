const { app } = require('../config/firebase');

const NotificationSub = require("../models/NotificationSub");

const { getFirestore, collection, doc, getDoc, addDoc, updateDoc, deleteDoc, where, query, Timestamp, getDocs } = require('firebase/firestore');

const db = getFirestore(app);

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
}

module.exports = new NotificationSubService;