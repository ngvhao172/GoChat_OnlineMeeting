const { app } = require('../config/firebase');

const { ref, uploadBytes, getDownloadURL, getStorage} = require('firebase/storage');

const { getFirestore, collection, doc, getDoc, addDoc, updateDoc, deleteDoc, where, query, Timestamp, getDocs } = require('firebase/firestore');

const db = getFirestore(app);

const storage = getStorage(app);

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
                    createdAt: Timestamp.fromDate(new Date(user.createdAt)),
                    role: "User"
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
                    return { status: false, message: "No user found with id: " + id };
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
                    userData.gender,
                    "",
                    "",
                    userData.role || "User"
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
                    return { status: false, message: "No user found with email: " + email };
                }
        
                const userDoc = querySnapshot.docs[0];
                const userData = userDoc.data();
                const user = new User(
                    userDoc.id,
                    userData.userEmail,
                    userData.fullName,
                    userData.phoneNumber,
                    userData.address,
                    userData.dob,
                    userData.avatar,
                    userData.gender,
                    "",
                    "",
                    userData.role || "User"
                );
        
                return { status: true, data: user };
            } catch (error) {
                console.error('Error getting account by email:', error);
                return { status: false, message: 'Error getting account by email: ' + error.message };
            }
        }
        async  getUsersByContainingEmail(email) {
            try {
            //   // Validate email format (optional)
            //   if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
            //     return { status: false, message: 'Invalid email format' };
            //   }
           
              const q = query(collection(db, 'users'), where('userEmail', '>=', email), where('userEmail', '<=', email + '~'));
              const querySnapshot = await getDocs(q);
          
              if (querySnapshot.empty) {
                return { status: false, message: `No users found containing email: ${email}` };
              }
          
              const users = [];
              querySnapshot.forEach(doc => {
                const userData = doc.data();
                const newUser = new User();
                newUser.email = userData.userEmail;
                newUser.avatar = userData.avatar;
                users.push(newUser);
              });
          
              return { status: true, data: users };
            } catch (error) {
              console.error('Error getting users by containing email:', error);
              return { status: false, message: 'Error getting users: ' + error.message };
            }
          }
        
    
    async updateUserById(id, newData) {
        try {
            const userRef = doc(db, 'users', id.trim());
            await updateDoc(userRef, newData);
            const updatedUser = await this.getUserById(id);
            if (!updatedUser.status) {
                console.log('User not found');
                return { status: false, message: updatedUser.message };
            }
            console.log('User updated:', updatedUser);
            return { status: true, data: updatedUser.data };
        } catch (error) {
            console.error('Error updating user:', error);
            return { status: false, message: 'Error updating user: ' + error.message };
        }
    }

    async uploadImageAndUpdateProfile(userId, file) {
        try {
            const imageRef = ref(storage, `users/${userId}/profile.jpg`);


            const blob = new Blob([file.buffer], { type: file.mimetype });

            const snapshot = await uploadBytes(imageRef, blob);
            const downloadURL = await getDownloadURL(snapshot.ref);
            
            const userRef = doc(db, 'users', userId);
            await updateDoc(userRef, { avatar: downloadURL });

            const updatedUser = await this.getUserById(userId);
            if (!updatedUser.status) {
                console.log('User not found');
                return { status: false, message: updatedUser.message };
            }
            console.log('User updated:', updatedUser);
            return { status: true, data: updatedUser.data };
        } catch (error) {
            console.error('Error updating user profile with image:', error);
            return { status: false, message: 'Error updating user avatar with image: '+ error.message };
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
