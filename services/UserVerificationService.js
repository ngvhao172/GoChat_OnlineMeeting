const nodemailer = require('nodemailer');
const { v4: uuidv4 } = require('uuid');
const bcrypt = require('bcrypt');
const { getFirestore, collection, doc, getDoc, addDoc, updateDoc, deleteDoc, where, query, Timestamp, getDocs } = require('firebase/firestore');
const { app } = require('../config/firebase');
const db = getFirestore(app);
const UserVerification = require('../models/UserVerification');

class UserVerificationService {

    async createUserVerification(userVerification) {
        try {
            const userVerificationRef = await addDoc(collection(db, 'userverifications'), {
                userId: userVerification.userId,
                uniqueString: userVerification.uniqueString,
                createdAt: Timestamp.fromDate(new Date(userVerification.createdAt)),
                expiredAt: Timestamp.fromDate(new Date(userVerification.expiredAt))
            });
            userVerification.id = userVerificationRef.id;
            console.log('UserVerification created:', userVerification);
            return { status: true, data: userVerification };
        } catch (error) {
            console.error('Error creating user verification:', error);
            return { status: false, message: 'Error creating user verification', error };
        }
    }
    async getUserVerificationByUserId(userId) {
        try {
            const userVerificationQuery = query(
                collection(db, "userverifications"),
                where("userId", "==", userId)
            );
            const querySnapshot = await getDocs(userVerificationQuery);
    
            if (querySnapshot.empty) {
                console.log('UserVerification not found');
                return { status: false, message: 'UserVerification not found' };
            }
            const docSnapshot = querySnapshot.docs[0]; 
            const data = docSnapshot.data();

            const userVerification = new UserVerification(
                docSnapshot.id,
                data.userId,
                data.uniqueString,
                data.createdAt.toDate(),
                data.expiredAt.toDate()
            );

            return { status: true, data: userVerification };
        } catch (error) {
            console.error('Error getting user verification by user ID:', error);
            return { status: false, message: 'Error getting user verification by user ID', error };
        }
    }
    
    async getUserVerificationById(id) {
        try {
            const userVerificationRef = doc(db, "userverifications", id);
            const userVerificationSnap = await getDoc(userVerificationRef);

            if (!userVerificationSnap.exists()) {
                console.log('UserVerification not found');
                return { status: false, message: 'UserVerification not found' };
            }

            const data = userVerificationSnap.data();
            const userVerification = new UserVerification(
                userVerificationSnap.id,
                data.userId,
                data.uniqueString,
                data.createdAt.toDate(),
                data.expiredAt.toDate()
            );

            return { status: true, data: userVerification };
        } catch (error) {
            console.error('Error getting user verification by ID:', error);
            return { status: false, message: 'Error getting user verification by ID', error };
        }
    }
    async updateUserVerification(id, updatedData) {
        try {
            const userVerificationRef = doc(db, "userverifications", id);
            await updateDoc(userVerificationRef, {
                ...updatedData,
                updatedAt: Timestamp.fromDate(new Date())
            });
            return { status: true, message: 'UserVerification updated successfully' };
        } catch (error) {
            console.error('Error updating user verification:', error);
            return { status: false, message: 'Error updating user verification', error };
        }
    }
    async deleteUserVerification(id) {
        try {
            const userVerificationRef = doc(db, "userverifications", id);
            await deleteDoc(userVerificationRef);
            return { status: true, message: 'UserVerification deleted successfully' };
        } catch (error) {
            console.error('Error deleting user verification:', error);
            return { status: false, message: 'Error deleting user verification', error };
        }
    }

    // sending mail register using nodemailer
    
    sendVerificationEmail = async ( _id, userEmail ) => {
        const transporter = nodemailer.createTransport({
            service: "gmail",
            auth: {
                user: process.env.AUTH_EMAIL,
                pass: process.env.PASSWORD,
            },
        });
        const currentUrl = process.env.DOMAIN;
        const uniqueString = uuidv4() + _id;
        const footer = "<br/><br/><hr/><p>Best regards,<br/>GoChat - Online Meeting<br/>Address: District 7, Ho Chi Minh City, Vietnam<br/>Email: gochat.onlinemeeting@gmail.com</p>";
        const mailOptions = {
            from: process.env.AUTH_EMAIL,
            to: userEmail,
            subject: "[GoChat] Verify Your Email",
            html: `<p>Verify your email address to complete the signup and login into your account.</p>
                  <p>Press <a href=${currentUrl + "/verify/" + _id + "/" + uniqueString}> here </a> to proceed. This link will expire after 10 minute.</p>` + footer,
        };

        try {
            const hasedUniqueString = await bcrypt.hash(uniqueString, 10);

            const newUserVerification = new UserVerification();
            newUserVerification.userId = _id;
            newUserVerification.uniqueString = hasedUniqueString;
            newUserVerification.createdAt = Date.now();
            newUserVerification.expiredAt = Date.now() + 600000;

            const newUserVeriSaved = await this.createUserVerification(newUserVerification);
            console.log(newUserVeriSaved);
            if(newUserVeriSaved.status){
                const info = await transporter.sendMail(mailOptions);
                console.log(`Verification mail has been sent to ${mailOptions.to}`);
                return { status: true };
            }else{
                return { status: false, message: 'Error when sending user verification: ' +  newUserVeriSaved.message };
            }

        } catch (err) {
            console.error("An error occurred while sending email:", err.message);
            return {
                status: false,
                message: err.message,
            };
        }
    };
}


module.exports = new UserVerificationService;


