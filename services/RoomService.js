const { getFirestore, collection, doc, getDoc, addDoc, updateDoc, deleteDoc, where, query, Timestamp, getDocs } = require('firebase/firestore');
const { app } = require('../config/firebase');
const db = getFirestore(app);
const Room = require('../models/Room');

const moment = require('moment-timezone');

class RoomService{
    async createRoom(room) {
        console.log(room.createdAt);
        try {
            const roomData = {
                roomId: room.roomId,
                roomName: room.roomName,
                creatorId: room.creatorId,
                createdAt: Timestamp.fromDate(new Date(room.createdAt)),
                daysOfWeek: room.daysOfWeek,
                specificDates: room.specificDates
            };
    
            if (room.startAt) {
                roomData.startAt = Timestamp.fromDate(new Date(room.startAt));
            }
    
            if (room.endAt) {
                roomData.endAt = Timestamp.fromDate(new Date(room.endAt));
            }
    
            const roomRef = await addDoc(collection(db, "rooms"), roomData);
            room.id = roomRef.id;
            console.log('Room created:', room);
            return { status: true, data: room };
        } catch (error) {
            console.error('Error creating room:', error);
            return { status: false, message: 'Error creating room:', error };
        }
    }
    

    async getRoomById(id) {
        try {
            const roomRef = doc(db, 'rooms', id.trim());
            const roomSnap = await getDoc(roomRef);
    
            if (!roomSnap.exists()) {
                console.log('Room not found');
                return { status: false, message: "No room found with id: " + id };
            }
    
            const roomData = roomSnap.data();
            const room = new Room(
                roomSnap.id,
                roomData.roomId,
                roomData.roomName,
                roomData.creatorId,
                roomData.createdAt.toDate(),
                roomData.startAt.toDate(),
                roomData.endAt.toDate(),
                roomData.daysOfWeek || [],
                roomData.specificDates || []
            );
            return { status: true, data: room };
        } catch (error) {
            console.error('Error getting room by ID:', error);
            return { status: false, message: 'Error getting room by ID:', error };
        }
    }

    async updateRoom(roomId, updatedRoom) {
        try {
            const roomRef = doc(collection(db, "rooms"), roomId);
            await updateDoc(roomRef, {
                roomId: updatedRoom.roomId,
                roomName: updatedRoom.roomName,
                creatorId: updatedRoom.creatorId,
                startAt: Timestamp.fromDate(new Date(updatedRoom.startAt)),
                endAt: Timestamp.fromDate(new Date(updatedRoom.endAt)),
                daysOfWeek: updatedRoom.daysOfWeek,
                specificDates: updatedRoom.specificDates
            });
            console.log('Room updated:', updatedRoom);
            return { status: true, data: updatedRoom };
        } catch (error) {
            console.error('Error updating room:', error);
            return { status: false, message: 'Error updating room:', error };
        }
    }

    async deleteRoom(roomId) {
        try {
            const roomRef = doc(collection(db, "rooms"), roomId);
            await deleteDoc(roomRef);
            console.log('Room deleted with ID:', roomId);
            return { status: true, message: 'Room deleted successfully' };
        } catch (error) {
            console.error('Error deleting room:', error);
            return { status: false, message: 'Error deleting room:', error };
        }
    }

    async getRoomByCreatorId(creatorId) {
        try {
            const q = query(collection(db, "rooms"), where('creatorId', '==', creatorId));
            const querySnapshot = await getDocs(q);
            const rooms = [];
            querySnapshot.forEach((doc) => {
                const roomData = doc.data();
                const room = new Room(
                    doc.id,
                    roomData.roomId,
                    roomData.roomName,
                    roomData.creatorId,
                    roomData.createdAt.toDate(),
                    roomData.startAt.toDate(),
                    roomData.endAt.toDate(),
                    roomData.daysOfWeek || [],
                    roomData.specificDates || []
                );
                rooms.push(room);
            });
            return { status: true, data: rooms };
        } catch (error) {
            console.error('Error fetching rooms by creatorId:', error);
            return { status: false, message: 'Error fetching rooms by creatorId:', error };
        }
    }

    async getRoomByStartDay(startDay) {
        try {
            const startOfDay = new Date(startDay);
            startOfDay.setHours(0, 0, 0, 0);
            const endOfDay = new Date(startDay);
            endOfDay.setHours(23, 59, 59, 999);
            const q = query(collection(db, "rooms"), where('startAt', '>=', Timestamp.fromDate(startOfDay)), where('startAt', '<=', Timestamp.fromDate(endOfDay)));
            const querySnapshot = await getDocs(q);
            const rooms = [];
            querySnapshot.forEach((doc) => {
                const roomData = doc.data();
                const room = new Room(
                    doc.id,
                    roomData.roomId,
                    roomData.roomName,
                    roomData.creatorId,
                    roomData.createdAt.toDate(),
                    roomData.startAt.toDate(),
                    roomData.endAt.toDate(),
                    roomData.daysOfWeek || [],
                    roomData.specificDates || []
                );
                rooms.push(room);
            });
            return { status: true, data: rooms };
        } catch (error) {
            console.error('Error fetching rooms by startDay:', error);
            return { status: false, message: 'Error fetching rooms by startDay:', error };
        }
    }
    async getRoomsByCreatorIdAndWeekDay(startDate, creatorId) {
        try {
            console.log(startDate)
    
            const daysOfWeek = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
            const dayOfWeek = daysOfWeek[new Date(startDate).getDay()];

            console.log(dayOfWeek);
            let currentDate;
            if(startDate == moment.utc(new Date(startDate)).tz('Asia/Ho_Chi_Minh').format('YYYY-MM-DD')){
                currentDate = Timestamp.fromDate(new Date(startDate));
            }
            else{
                currentDate = moment.utc(new Date(startDate)).tz('Asia/Ho_Chi_Minh').format();
            }

            let q1;
            let q2;
            q1 = query(
                collection(db, "rooms"),
                where('specificDates', 'array-contains', startDate),
                where('creatorId', '==', creatorId)
            );

            q2 = query(
                collection(db, "rooms"),
                where('daysOfWeek', 'array-contains', dayOfWeek),
                where('createdAt', "<=", currentDate),
                where('creatorId', '==', creatorId)
            );
            const rooms = [];
            const snapshot1 = await getDocs(q1);

            console.log(snapshot1.empty)

            if(snapshot1.empty){
                const snapshot2 = await getDocs(q2);
                console.log(snapshot2.empty)
                snapshot2.forEach((doc) => {
                    const roomData = doc.data();
                    let startTime;
                    if(roomData.startAt){
                        startTime = new Date(startDate);
                        startTime.setHours(roomData.startAt.toDate().getHours());
                        startTime.setMinutes(roomData.startAt.toDate().getMinutes());
                        startTime.setSeconds(roomData.startAt.toDate().getSeconds());
                    }
                    let endTime;
                    if(roomData.endAt){
                        endTime = new Date(startDate);
                        endTime.setHours(roomData.endAt.toDate().getHours());
                        endTime.setMinutes(roomData.endAt.toDate().getMinutes());
                        endTime.setSeconds(roomData.endAt.toDate().getSeconds());
                    }
                    const room = new Room(
                        doc.id,
                        roomData.roomId,
                        roomData.roomName,
                        roomData.creatorId,
                        roomData.createdAt ? roomData.createdAt.toDate() : null,
                        roomData.startAt ? startTime : null,
                        roomData.endAt ? endTime : null,
                        roomData.daysOfWeek || [],
                        roomData.specificDates || []
                    );
                    rooms.push(room);
                });

            }
            else{
                snapshot1.forEach((doc) => {
                    const roomData = doc.data();
                    const room = new Room(
                        doc.id,
                        roomData.roomId,
                        roomData.roomName,
                        roomData.creatorId,
                        roomData.createdAt ? roomData.createdAt.toDate() : null,
                        roomData.startAt ? roomData.startAt.toDate() : null,
                        roomData.endAt ? roomData.endAt.toDate() : null,
                        roomData.daysOfWeek || [],
                        roomData.specificDates || []
                    );
                    rooms.push(room);
                });
            }
            return { status: true, data: rooms };
        } catch (error) {
            console.error('Error fetching rooms:', error);
            return { status: false, message: 'Error fetching rooms:', error };
        }
    }
}

module.exports = new RoomService