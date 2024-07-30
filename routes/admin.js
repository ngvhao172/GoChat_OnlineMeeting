const express = require('express');
const router = express.Router();

router.get('/admin/login', async (req, res, next) => {
    res.render("admin/login");
})

//router.post("/admin/login", passport.authenticate('local', { failureRedirect: '/login', failureFlash: true }),authController.loginPOST);

// Middleware để kiểm tra quyền admin
router.use((req, res, next) => {
  if (req.isAuthenticated() && req.user.role === 'admin') {
    return next();
  } else {
    res.redirect('/admin/login');
  }
});

// Các routes khác của admin
router.get('/dashboard', (req, res) => {
  res.render('admin/dashboard', { user: req.user });
});

module.exports = router;
