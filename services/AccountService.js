const { app } = require('../config/firebase');
const { getFirestore, collection, doc, getDocs, addDoc, updateDoc, deleteDoc, where, query, Timestamp, getDoc } = require('firebase/firestore');
const db = getFirestore(app);

const Account = require('../models/Account');

const nodemailer = require('nodemailer');

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
                password: accountData.password,
                verified: accountData.verified,
                enabled: accountData.enabled
            };
            console.log('Account found:', account);
            return  { status: true, data: account };;
        } catch (error) {
            console.error('Error getting account by ID:', error);
            return { status: false, data: 'Error getting account by ID:', error };
        }
    }

    async getAccountByEmail(email) {
        try {
            const q = query(collection(db, "accounts"), where("userEmail", "==", email));
            const querySnapshot = await getDocs(q);

            if (querySnapshot.empty) {
                console.log('Account not found');
                return { status: false, message: "Account not found with email: " + email };
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
            return { status: true, data: account };
        } catch (error) {
            console.error('Error getting account by email:', error);
            return { status: false, data: 'Error getting account by email:', error };
        }
    }

    async updateAccount(id, newData) {
        try {
            const docRef = doc(db, 'accounts', id);
            await updateDoc(docRef, newData);
            const updatedAccount = await this.getAccountById(id);
            if (!updatedAccount.status) {
                console.log('Account not found');
                return null;
            }
            console.log('Account updated:', updatedAccount);
            return { status: true, data: updatedAccount.data };
        } catch (error) {
            console.error('Error updating account:', error);
            return { status: false, data: 'Error updating account', error };
        }
    }
    async deleteAccount(id) {
        try {
            await deleteDoc(doc(db, 'accounts', id));
            console.log('Account deleted with ID:', id);
            return { status: true, data: updatedAccount };
        } catch (error) {
            console.error('Error deleting account:', error);
            return { status: false, data: 'Error deleting account:', error };
            throw error;
        }
    }
    //sending mail resetpassword using nodemailer
    sendResetPassword = async (userEmail, newPassword) => {
        try {
            const transporter = nodemailer.createTransport({
                service: "gmail",
                auth: {
                    user: process.env.AUTH_EMAIL,
                    pass: process.env.PASSWORD
                }
            });
            const footer = "<br/><br/><hr/><p>Best regards,<br/>GoChat - Online Meeting<br/>Address: District 7, Ho Chi Minh City, Vietnam<br/>Email: gochat.onlinemeeting@gmail.com</p>";
            const mailOptions = {
                from: process.env.AUTH_EMAIL,
                to: userEmail,
                subject: "[GoChat] Reset Your Password",
                html: `<p>We've processed your password change request.</p>
                <p>Here is your new password: ${newPassword}</p>
                <p>Please change your password afterward to secure your account.</p> ` + footer
            };
            
            const res = await transporter.sendMail(mailOptions);
           // console.log(res);
            console.log(`Password reset mail has been sent to ${mailOptions.to}`);
            return {status: true, message: `Password reset mail has been sent to ${mailOptions.to}`}
        } catch (error) {
            console.error(error);
            return { status: false, message: "An error occurred while changing the reset password." + error };
        }
        
    }
}

module.exports = new AccountService;