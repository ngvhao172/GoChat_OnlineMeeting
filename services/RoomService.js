// const { db } = require('../config/firebase');
// const Room = require('../models/Room');
// class RoomService {
//     async createRoom(roomId, creatorId) {
//         try {
//             const roomRef = db.collection('rooms').doc();
//             const createdAt = firebase.firestore.FieldValue.serverTimestamp();
//             await roomRef.set({
//                 roomId: roomId,
//                 creatorId: creatorId,
//                 createdAt: createdAt,
//                 updatedAt: createdAt
//             });
//             const room = new Room(roomRef.id, roomId, creatorId, createdAt);
//             console.log('Room created with ID:', roomRef.id);
//             return room;
//         } catch (error) {
//             console.error('Error creating room:', error);
//         }
//     }

//     async getRoomById(id) {
//         try {
//             const roomRef = db.collection('rooms').doc(id);
//             const doc = await roomRef.get();
//             if (doc.exists) {
//                 const data = doc.data();
//                 const room = new Room(doc.id, data.roomId, data.creatorId, data.createdAt);
//                 console.log('Room data:', room);
//                 return room;
//             } else {
//                 console.log('No such document!');
//                 return null;
//             }
//         } catch (error) {
//             console.error('Error getting room:', error);
//         }
//     }

//     async updateRoom(id, newCreatorId) {
//         try {
//             const roomRef = db.collection('rooms').doc(id);
//             const updatedAt = firebase.firestore.FieldValue.serverTimestamp();
//             await roomRef.update({
//                 creatorId: newCreatorId,
//                 updatedAt: updatedAt
//             });
//             console.log('Room updated with ID:', id);
//         } catch (error) {
//             console.error('Error updating room:', error);
//         }
//     }

//     async deleteRoom(id) {
//         try {
//             const roomRef = db.collection('rooms').doc(id);
//             await roomRef.delete();
//             console.log('Room deleted with ID:', id);
//         } catch (error) {
//             console.error('Error deleting room:', error);
//         }
//     }
// }

// module.exports = new RoomService;