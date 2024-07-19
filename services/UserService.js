const { app } = require('../config/firebase');
const { getFirestore, collection, doc, getDoc, addDoc, updateDoc, deleteDoc, where, query, Timestamp, getDocs } = require('firebase/firestore');
const db = getFirestore(app);
const User = require('../models/User');

class UserService {
    async createUser(user) {
        try {
            const userRef = await addDoc(collection(db, 'users'), {
                userEmail: user.userEmail,
                fullName: user.fullName,
                phoneNumber: user.phoneNumber || "",
                address: user.address || "",
                dob: user.dob || "",
                avatar: user.avatar || "",
                gender: user.gender || "",
                createdAt: Timestamp.fromDate(new Date(user.createdAt))
            });
            user.id = userRef.id;
            console.log('User created:', user);
            return { status: true, data: user };
        } catch (error) {
            console.error('Error creating user:', error);
            return { status: false, message: 'Error creating user:', error };
        }
    }
    
    async getUserById(id) {
        try {
            const userRef = doc(db, 'users', id.trim());
            const userSnap = await getDoc(userRef);
    
            if (!userSnap.exists()) {
                console.log('User not found');
                return { status: false, message: "Không tìm thấy người dùng với id: " + id };
            }
    
            const userData = userSnap.data();
            const user = new User(
                userSnap.id,
                userData.userEmail,
                userData.fullName,
                userData.phoneNumber,
                userData.address,
                userData.dob,
                userData.avatar,
                userData.gender
            );
            return { status: true, data: user };
        } catch (error) {
            console.error('Error getting user by ID:', error);
            return { status: false, message: 'Error getting user by ID:', error};
            // throw error;
        }
    }
    async getUserByEmail(email) {
        try {
            const q = query(collection(db, "users"), where("userEmail", "==", email));
            const querySnapshot = await getDocs(q);
    
            if (querySnapshot.empty) {
                console.log('User not found');
                return { status: false, message: "Không tìm thấy người dùng với email: " + email };
            }
    
            const userDoc = querySnapshot.docs[0];
            const userData = userDoc.data();
            const user = {
                id: userDoc.id,
                userId: userData.userId,
                userEmail: userData.userEmail,
                password: userData.password,
                verified: userData.verified,
                enabled: userData.enabled
            };
    
            return { status: true, data: user };
        } catch (error) {
            console.error('Error getting account by email:', error);
            return { status: false, message: 'Error getting account by email: ' + error.message };
        }
    }
    
    
    async updateUser(id, newData) {
        try {
            const userRef = doc(db, 'users', id.trim());
            await updateDoc(userRef, newData);
            const updatedUser = await getUserById(id);
            if (!updatedUser) {
                console.log('User not found');
                return null;
            }
            console.log('User updated:', updatedUser);
            return updatedUser;
        } catch (error) {
            console.error('Error updating user:', error);
            throw error;
        }
    }
    
    async deleteUser(id) {
        try {
            const userRef = doc(db, 'users', id.trim());
            await deleteDoc(userRef);
            console.log('User deleted with ID:', id);
            return { status: true, message: 'User deleted successfully' };
        } catch (error) {
            console.error('Error deleting user:', error);
            throw error;
        }
    }
}

module.exports = new UserService;
