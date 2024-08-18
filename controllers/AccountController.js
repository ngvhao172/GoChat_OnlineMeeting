const bcrypt = require("bcrypt")
const accountService = require("../services/AccountService");

class AccountController {
    async changePassword(req, res, next){
        const {currentPassword, newPassword, cfPassword} = req.body;
        if(!currentPassword || !newPassword || !cfPassword || !currentPassword.trim() || !newPassword.trim() || !cfPassword.trim()){
            req.flash('type', 'danger');
            req.flash('message', 'All fields are required');
            return res.redirect('profile');
        }
        if(newPassword != cfPassword){
            req.flash('type', 'danger');
            req.flash('message', 'Passwords do not match');
            return res.redirect('profile');
        }
        const userAccountData = await accountService.getAccountByEmail(res.locals.user.userEmail);
        if(!userAccountData.status){
            req.flash('type', 'danger');
            req.flash('message', userAccountData.message);
            return res.redirect('profile');
        }
        const account = userAccountData.data;
        if (await bcrypt.compare(currentPassword, account.password)) {
            const hasedPassword = await bcrypt.hash(newPassword, 10);
            const updatePassword = await accountService.updateAccountById(account.id, {password: hasedPassword});
            if(updatePassword.status){
                req.flash('type', 'success');
                req.flash('message', "Update password successfully");
                return res.redirect('profile');
            }
            else{
                req.flash('type', 'danger');
                req.flash('message', updatePassword.message);
                return res.redirect('profile');
            }
        }
        else{
            req.flash('type', 'danger');
            req.flash('message', "Current password is incorrect");
            return res.redirect('profile');
        }
    }
}

module.exports = new AccountController;