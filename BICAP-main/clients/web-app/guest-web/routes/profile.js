const express = require('express');
const router = express.Router();

// Trang profile (yêu cầu đăng nhập - middleware ở app.js)
router.get('/', (req, res) => {
    res.render('profile', {
        title: 'Hồ sơ cá nhân - BiCap',
        user: req.session.user
    });
});

module.exports = router;
