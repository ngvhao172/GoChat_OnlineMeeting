const userService = require("../services/UserService");
const multiparty = require('multiparty');
const userVerificationService = require("../services/UserVerificationService");
const fs = require('fs');
const bcrypt = require('bcrypt');
const accountService = require("../services/AccountService");

class UserController {
    async index(req, res, next) {
        return res.render('profile');
    }

    async updateProfile(req, res, next) {
        const { fullName, phoneNumber, address } = req.body;
        console.log(res.locals.user);
        const userData = await userService.getUserByEmail(res.locals.user.userEmail);
        if(!userData.status){
            req.flash('type', 'danger');
            req.flash('message', userData.message);
            return res.render('profile');
        }
        const updateResult = await userService.updateUserById(userData.data.id, { "fullName": fullName, "phoneNumber": phoneNumber ? phoneNumber : "", "address": address ? address : "" });
        if (updateResult.status) {
            req.flash('type', 'success');
            req.flash('message', 'Update profile successfully');
            res.locals.user = updateResult.data;
            return res.render('profile');
        }
        else {
            req.flash('type', 'danger');
            req.flash('message', updateResult.message);
            return res.render('profile');
        }
    }

    async updateUserAvatar(req, res, next) {
        const form = new multiparty.Form();

        form.parse(req, async (err, fields, files) => {
            if (err) {
                console.error('Error parsing form:', err);
                req.flash('type', 'danger');
                req.flash('message', 'Error parsing form data.');
                return res.redirect('/profile');
            }

            const file = files.image && files.image[0];

            if (!file) {
                req.flash('type', 'danger');
                req.flash('message', "Avatar picker not found");
                return res.redirect('/profile');
            }
            try {
                const fileBuffer = await fs.promises.readFile(file.path);
                const userData = await userService.getUserByEmail(res.locals.user.userEmail);
                if(!userData.status){
                    req.flash('type', 'danger');
                    req.flash('message', userData.message);
                    return res.render('profile');
                }
                const updateAvatar = await userService.uploadImageAndUpdateProfile(userData.data.id, {
                    buffer: fileBuffer,
                    mimetype: file.headers['content-type']
                });

                if (updateAvatar.status) {
                    req.flash('type', 'success');
                    req.flash('message', 'Update user avatar successfully');
                    res.locals.user = updateAvatar.data;
                } else {
                    req.flash('type', 'danger');
                    req.flash('message', updateAvatar.message);
                }
                return res.redirect('/profile');
            } catch (error) {
                console.error('Error processing file:', error);
                req.flash('type', 'danger');
                req.flash('message', 'An error occurred while updating the avatar.');
                return res.redirect('/profile');
            }
        });
    }

    async verifyUser(req, res, next) {
        console.log("vo day")
        try {
            const { userId, uniqueString } = req.params;
            const user = await userVerificationService.getUserVerificationByUserId(userId);
            const userVeri = user.data
            if (userVeri) {
                console.log(userVeri)
                const hashedUniqueString = userVeri.uniqueString;
                if (userVeri.expiredAt < Date.now()) {
                    userVerificationService.deleteUserVerification(userVeri.id)
                        // return;
                        .then((result) => {
                            if (result.status == true) {
                                req.flash('type', 'danger');
                                req.flash('message', "Verification failed. This link already expired");
                                return res.redirect("/login");
                            }
                            else {
                                req.flash('type', 'danger');
                                req.flash('message', "Verification failed. This link already expired");
                                return res.redirect("/login");
                            }
                        })
                        .catch((error) => {
                            req.flash('type', 'danger');
                            req.flash('message', "Verification failed. " + error.message);
                            return res.redirect("/login");
                        });
                } else {
                    console.log(uniqueString, hashedUniqueString)
                    const result = await bcrypt.compare(uniqueString, hashedUniqueString);
                    if (result) {
                        const accountUpdated = await accountService.updateAccountByUserId(userId, { verified: true });
                        if (accountUpdated.status) {
                            await userVerificationService.deleteUserVerification(userVeri.id)
                                .then((result) => {
                                    if (result.status === true) {
                                        req.flash('type', 'success');
                                        req.flash('message', "Verify successfully.");
                                        return res.redirect("/login");
                                    }
                                })
                                .catch((error) => {
                                    req.flash('type', 'danger');
                                    req.flash('message', "Verification failed. " + error.message);
                                    return res.redirect("/login");
                                })
                        }
                        else {
                            req.flash('type', 'danger');
                            req.flash('message', "Verification failed. " + accountUpdated.message);
                            return res.redirect("/login");
                        }
                    }
                    else {
                        req.flash('type', 'danger');
                        req.flash('message', "Verification failed. This link was changed");
                        return res.redirect("/login");
                    }
                }
            }
            else {
                req.flash('type', 'danger');
                req.flash('message', "Verification failed. User verification not found");
                res.redirect("/login");
            }
        } catch (error) {
            req.flash('type', 'danger');
            req.flash('message', "Verification failed. " + error.message);
            res.redirect("/login");
        }
    }

    async getUserByContainingEmail(req, res, next) {
        const { email } = req.body;
        if (email.length < 4) {
            return res.status(400).json("Not enough characters");
        }
        const users = await userService.getUsersByContainingEmail(email);
        if (users.status) {
            return res.json(users.data)
        } else {
            return res.status(400).json(users.message);
        }
    }

    async deleteUserByUserEmail(req, res, next) {
        try {
            const { email } = req.body;
            const user = await userService.getUserByEmail(email);
            if (user.status) {
                await userService.deleteUser(user.data.id);
            }
            const account = await accountService.getAccountByEmail(email);
            if (account.status) {
                await accountService.deleteAccount(account.data.id);
            }
            return res.status(200).json("Success");
        } catch (error) {
            return res.status(400).json(error.message);
        }
    }

}

module.exports = new UserController;