const express = require('express');
const path = require('path');
const cookieParser = require('cookie-parser');
const session = require('express-session');

const app = express();
const PORT = process.env.PORT || 3000;

// ========================
// CONFIGURATION
// ========================
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// Static files
app.use(express.static(path.join(__dirname, 'public')));

// Body parser
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Cookie parser
app.use(cookieParser());

// Session
app.use(session({
    secret: 'bicap-guest-secret-key-2024',
    resave: false,
    saveUninitialized: false,
    cookie: { 
        secure: false, // Set true in production with HTTPS
        maxAge: 24 * 60 * 60 * 1000 // 24 hours
    }
}));

// ========================
// MIDDLEWARE - Auth Check
// ========================
const authMiddleware = (req, res, next) => {
    // Make user available to all views
    res.locals.user = req.session.user || null;
    res.locals.isAuthenticated = !!req.session.user;
    next();
};
app.use(authMiddleware);

// Middleware yêu cầu đăng nhập
const requireAuth = (req, res, next) => {
    if (!req.session.user) {
        return res.redirect('/login?redirect=' + encodeURIComponent(req.originalUrl));
    }
    next();
};

// ========================
// ROUTES
// ========================
const indexRoutes = require('./routes/index');
const authRoutes = require('./routes/auth');
const marketRoutes = require('./routes/market');
const traceRoutes = require('./routes/trace');
const profileRoutes = require('./routes/profile');
const apiRoutes = require('./routes/api');

app.use('/', indexRoutes);
app.use('/', authRoutes);
app.use('/market', marketRoutes);
app.use('/trace', traceRoutes);
app.use('/profile', requireAuth, profileRoutes);
app.use('/api', apiRoutes);

// ========================
// ERROR HANDLING
// ========================
app.use((req, res, next) => {
    res.status(404).render('error', { 
        title: 'Không tìm thấy trang',
        message: 'Trang bạn yêu cầu không tồn tại.',
        code: 404
    });
});

app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).render('error', { 
        title: 'Lỗi hệ thống',
        message: 'Đã xảy ra lỗi. Vui lòng thử lại sau.',
        code: 500
    });
});

// ========================
// START SERVER
// ========================
app.listen(PORT, () => {
    console.log(`🌱 BiCap Guest Web đang chạy tại http://localhost:${PORT}`);
    console.log(`📦 Environment: ${process.env.NODE_ENV || 'development'}`);
});

module.exports = app;
