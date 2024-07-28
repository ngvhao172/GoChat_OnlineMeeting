const { getFirestore, collection, doc, getDoc, addDoc, updateDoc, deleteDoc, where, query, Timestamp, getDocs } = require('firebase/firestore');
const { app } = require('../config/firebase');
const db = getFirestore(app);
const Room = require('../models/Room');

const moment = require('moment-timezone');

class RoomService{
    async createRoom(room) {
        try {
            const roomData = {
                roomId: room.roomId,
                roomName: room.roomName,
                creatorId: room.creatorId,
                createdAt: Timestamp.fromDate(new Date(room.createdAt)),
                daysOfWeek: room.daysOfWeek,
                attendees: room.attendees,
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
                roomData.specificDates || [],
                roomData.attendees || []
            );
            return { status: true, data: room };
        } catch (error) {
            console.error('Error getting room by ID:', error);
            return { status: false, message: 'Error getting room by ID:', error };
        }
    }
    async getRoomByRoomId(roomId) {
        try {

            const roomQuery = query(
                collection(db, 'rooms'),
                where('roomId', '==', roomId.trim())
            );
            
            const querySnapshot = await getDocs(roomQuery);
            
            if (querySnapshot.empty) {
                console.log('Room not found');
                return { status: false, message: "No room found with roomId: " + roomId };
            }
            
            const roomDoc = querySnapshot.docs[0];
            const roomData = roomDoc.data();
            
            const room = new Room(
                roomDoc.id,
                roomData.roomId,
                roomData.roomName,
                roomData.creatorId,
                roomData.createdAt ? roomData.createdAt.toDate() : null,
                roomData.startAt ? roomData.startAt.toDate() : null,
                roomData.endAt ? roomData.endAt.toDate() : null,
                roomData.daysOfWeek || [],
                roomData.specificDates || [],
                roomData.attendees || []
            );
            
            return { status: true, data: room };
        } catch (error) {
            console.error('Error getting room by roomId:', error);
            return { status: false, message: 'Error getting room by roomId:', error };
        }
    }
    

    async updateRoom(id, updatedRoom) {
        try {

            if (updatedRoom.startAt) {
                updatedRoom.startAt = Timestamp.fromDate(new Date(updatedRoom.startAt));
            }
    
            if (updatedRoom.endAt) {
                updatedRoom.endAt = Timestamp.fromDate(new Date(updatedRoom.endAt));
            }
            const roomRef = doc(collection(db, "rooms"), id);
            await updateDoc(roomRef, updatedRoom);
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

    async getRoomsByCreatorId(creatorId) {
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

    async getRoomsByCreatorIdAndWeekDay(startDate, creatorId) {
        try {
    
            const daysOfWeek = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
            const dayOfWeek = daysOfWeek[new Date(startDate).getDay()];

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
           
            const snapshot2 = await getDocs(q2);   

            snapshot1.forEach((doc) => {
                const roomData = doc.data();
                console.log(roomData);
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

            snapshot2.forEach((doc) => {
                const roomData = doc.data();
                console.log(roomData);
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

                if(!rooms.includes(room)){
                    rooms.push(room);                    
                }
            });
            
            return { status: true, data: rooms };
        } catch (error) {
            console.error('Error fetching rooms:', error);
            return { status: false, message: 'Error fetching rooms:', error };
        }
    }
    async getRoomsByUserEmailAndWeekDay(startDate, userEmail) {
        try {
    
            const daysOfWeek = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
            const dayOfWeek = daysOfWeek[new Date(startDate).getDay()];

            let currentDate;
            if(startDate == moment.utc(new Date(startDate)).tz('Asia/Ho_Chi_Minh').format('YYYY-MM-DD')){
                currentDate = Timestamp.fromDate(new Date(startDate));
            }
            else{
                currentDate = moment.utc(new Date(startDate)).tz('Asia/Ho_Chi_Minh').format();
            }

            const q1 = query(
                collection(db, "rooms"),
                where('specificDates', 'array-contains', startDate)
            );
    
            const q2 = query(
                collection(db, "rooms"),
                where('daysOfWeek', 'array-contains', dayOfWeek),
                where('createdAt', "<=", currentDate)
            );
            const rooms = [];
            const snapshot1 = await getDocs(q1);

            snapshot1.forEach((doc) => {
                const roomData = doc.data();
                if (roomData.attendees && roomData.attendees.includes(userEmail)) {
                    const room = new Room(
                        doc.id,
                        roomData.roomId,
                        roomData.roomName,
                        "",
                        roomData.createdAt ? roomData.createdAt.toDate() : null,
                        roomData.startAt ? roomData.startAt.toDate() : null,
                        roomData.endAt ? roomData.endAt.toDate() : null,
                        roomData.daysOfWeek || [],
                        roomData.specificDates || [],
                        roomData.attendees || []
                    );
                    rooms.push(room);
                }
            });

            const snapshot2 = await getDocs(q2);
            snapshot2.forEach((doc) => {
                const roomData = doc.data();
                if (roomData.attendees && roomData.attendees.includes(userEmail)) {
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
                        "",
                        roomData.createdAt ? roomData.createdAt.toDate() : null,
                        roomData.startAt ? startTime : null,
                        roomData.endAt ? endTime : null,
                        roomData.daysOfWeek || [],
                        roomData.specificDates || [],
                        roomData.attendees || []
                    );

                    const roomExists = rooms.some(room => room.id === doc.id);
                    if(!roomExists){
                        rooms.push(room);                    
                    }
                }
            });

        
            return { status: true, data: rooms };
        } catch (error) {
            console.error('Error fetching rooms:', error);
            return { status: false, message: 'Error fetching rooms:', error };
        }
    }
}

module.exports = new RoomService