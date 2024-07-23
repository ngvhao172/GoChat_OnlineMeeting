const { app } = require('../config/firebase');
const { getFirestore, collection, doc, getDocs, addDoc, updateDoc, deleteDoc, where, query, Timestamp, getDoc } = require('firebase/firestore');
const db = getFirestore(app);

const Account = require('../models/Account');

class AccountService {
    async createAccount(account) {
        try {
            const newAccount = {
                userId: account.userId,
                userEmail: account.userEmail,
                password: account.password,
                verified: account.verified,
                enabled: account.enabled,
                createdAt: Timestamp.fromDate(new Date(account.createdAt))
            };
    
            const docRef = await addDoc(collection(db, 'accounts'), newAccount);
            newAccount.id = docRef.id;
            // console.log('Account created:', newAccount);
            // return newAccount;
            return { status: true, data: newAccount };
        } catch (error) {
            console.error('Error creating account:', error);
            return { status: false, data: 'Error creating account:', error };
            // throw error;
        }
    }

    async getAccountById(id) {
        try {
            const docRef = doc(db, 'accounts', id);
            const docSnap = await getDoc(docRef);
            if (!docSnap.exists()) {
                console.log('Account not found');
                return null;
            }

            const accountData = docSnap.data();
            const account = {
                id: docSnap.id,
                userId: accountData.userId,
                userEmail: accountData.userEmail,
                fullName: accountData.fullName,
                password: accountData.password,
                verified: accountData.verified,
                enabled: accountData.enabled
            };
            console.log('Account found:', account);
            return account;
        } catch (error) {
            console.error('Error getting account by ID:', error);
            throw error;
        }
    }

    async getAccountByEmail(email) {
        try {
            const q = query(collection(db, "accounts"), where("userEmail", "==", email));
            const querySnapshot = await getDocs(q);
            // const querySnapshot = await getDocs(collection(db, 'accounts', where('userEmail', '==', "user1@gmail.com")));

            if (querySnapshot.empty) {
                console.log('Account not found');
                return { status: false, message: "Không tìm thấy tài khoản với email: " + email };
            }

            const accountData = querySnapshot.docs[0].data();
            const account = {
                id: querySnapshot.docs[0].id,
                userId: accountData.userId,
                userEmail: accountData.userEmail,
                password: accountData.password,
                verified: accountData.verified,
                enabled: accountData.enabled
            };
            // console.log('Account found:', account);
            return { status: true, data: account };
        } catch (error) {
            console.error('Error getting account by email:', error);
            throw error;
        }
    }

    async updateAccount(id, newData) {
        try {
            const docRef = doc(db, 'accounts', id);
            await updateDoc(docRef, newData);
            const updatedAccount = await this.getAccountById(id);
            if (!updatedAccount) {
                console.log('Account not found');
                return null;
            }
            console.log('Account updated:', updatedAccount);
            return updatedAccount;
        } catch (error) {
            console.error('Error updating account:', error);
            throw error;
        }
    }
    async deleteAccount(id) {
        try {
            await deleteDoc(doc(db, 'accounts', id));
            console.log('Account deleted with ID:', id);
        } catch (error) {
            console.error('Error deleting account:', error);
            throw error;
        }
    }
}

module.exports = new AccountService;