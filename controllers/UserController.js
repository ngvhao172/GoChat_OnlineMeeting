const userService = require("../services/UserService");
const multiparty = require('multiparty');
const fs = require('fs');

class UserController {
    async index(req, res, next){
        return res.render('profile');
    }

    async updateProfile(req, res, next){
        const {fullName, phoneNumber, address} = req.body;
        const updateResult = await userService.updateUser(res.locals.user.id, {"fullName": fullName, "phoneNumber": phoneNumber ? phoneNumber : "", "address": address ? address : ""});
        if(updateResult.status){
            req.flash('type', 'success');
            req.flash('message', 'Update profile successfully');
            res.locals.user = updateResult.data;
            return res.render('profile');
        }
        else{
            req.flash('type', 'danger');
            req.flash('message', updateResult.message);
            return res.render('profile');
        }
    }

    async updateUserAvatar(req, res, next){
        const form = new multiparty.Form();

        form.parse(req, async (err, fields, files) => {
            if (err) {
                console.error('Error parsing form:', err);
                req.flash('type', 'danger');
                req.flash('message', 'Error parsing form data.');
                return res.render('profile');
            }

            const file = files.image && files.image[0];
    
            if (!file) {
                req.flash('type', 'danger');
                req.flash('message', "Avatar picker not found");
                return res.render('profile');
            }
            try {
                const fileBuffer = await fs.promises.readFile(file.path);
        
                const updateAvatar = await userService.uploadImageAndUpdateProfile(res.locals.user.id, {
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
                return res.render('profile');
            } catch (error) {
                console.error('Error processing file:', error);
                req.flash('type', 'danger');
                req.flash('message', 'An error occurred while updating the avatar.');
                return res.render('profile');
            }
        });
    }
}

module.exports = new UserController;