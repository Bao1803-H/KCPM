const express = require('express');
const path = require('path');
const bodyParser = require('body-parser');
const jwt = require('jsonwebtoken');
const cookieParser = require('cookie-parser');
const { serialize } = require('cookie');
const axios = require('axios');
require('dotenv').config({ path: path.resolve(__dirname, '..', 'config', '.env') });
const AUTH_SERVICE_URL = process.env.AUTH_SERVICE_URL;

// Per-role JWT secret for admin (must match auth-service bicap.app.jwtSecret.admin)
const JWT_SECRET_STRING = process.env.JWT_SECRET_ADMIN || 'YmljYXAtand0LWFkbWluLXJvbGUtc2VjcmV0LWtleS1hdXRoISEhIQ==';
const JWT_SECRET = Buffer.from(JWT_SECRET_STRING, 'base64');
const APPLICATION_ROLE = 'ROLE_ADMIN';
const CLIENT_ID = 'admin';
const COOKIE_NAME = 'admin_token';
const app = express();
const port = 3001;

app.set("views", path.join(__dirname, "..", "front-end", "template"));
app.set("view engine", "ejs");

app.use(express.static(path.join(__dirname, "..", "front-end")));
app.use('/assets', express.static(path.join(__dirname, "..", "assets"))); // serve CSS/JS/img
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json()); // Cho các route JSON ở admin.js (ví dụ reject lý do)
app.use(cookieParser());

// Set the clear authentication cookie for user when logout
const clearAuthCookie = (res) => {
    res.setHeader('Set-Cookie', serialize(COOKIE_NAME, '', {
        httpOnly: true, 
        secure: process.env.NODE_ENV === 'production', 
        sameSite: 'strict',
        maxAge: -1,
        path: "/"
    }));
}

const requireAuth = (req, res, next) => {
    const token = req.cookies[COOKIE_NAME] || req.cookies.auth_token; // legacy fallback

    if (!token) {
        return res.redirect('/login');
    }
     
    try {
        const decoded = jwt.verify(token, JWT_SECRET);
        req.user = decoded;
        next();
    } catch (err) {
        console.log("Error message: Middleware to verify the token is error", err.message);
        clearAuthCookie(res);
        return res.redirect('/login');
    }
}

app.get('/', (req, res) => {
    let user = null;
    try {
        const token = req.cookies[COOKIE_NAME] || req.cookies.auth_token; // legacy fallback
        if (token) {
            const decoded = jwt.verify(token, JWT_SECRET);
            user = {
                sub: decoded.sub,
                username: decoded.sub,
                email: decoded.email,
                roles: decoded.roles
            };
        }
    } catch (e) { /* Ignore JWT errors for public index page */ }
    res.render('index', { user: user });
});

// Rendering the login GUI
app.get('/login', (req, res) => {
    res.render('login', { error: null });
})

app.post('/login', async(req, res) => {
    const { email, password } = req.body;

    try {
        console.log('Attempting login for:', email);
        console.log('AUTH_SERVICE_URL:', AUTH_SERVICE_URL);
        console.log('Full URL:', `${AUTH_SERVICE_URL}/login`);
        
        const apiResponse = await axios.post(`${AUTH_SERVICE_URL}/login`, { email, password, clientId: CLIENT_ID }, {
            headers: { 'Content-Type': 'application/json' }
        });

        console.log('Login successful, response status:', apiResponse.status);

        const accessToken =
            typeof apiResponse.data === 'string'
                ? apiResponse.data
                : apiResponse.data?.accessToken || apiResponse.data?.access_token || apiResponse.data?.token;

        if (!accessToken) {
            return res.status(502).render('login', { error: 'Auth service did not return token', success: null });
        }

        const decodedToken = jwt.verify(accessToken, JWT_SECRET);
        const userRoles = decodedToken.roles;

        // Log ra để debug xem Java trả về Role gì
        console.log("User Roles from Token:", userRoles); 

        if (!userRoles || !userRoles.includes(APPLICATION_ROLE)) {
            console.error(`Role Mismatch: Required ${APPLICATION_ROLE}, Got ${JSON.stringify(userRoles)}`);
            clearAuthCookie(res);
            return res.status(403).render('login', { error: 'Bạn không có quyền truy cập Admin!', success: null });
        }

        const cookie = serialize(COOKIE_NAME, accessToken, {
            httpOnly: true, 
            secure: process.env.NODE_ENV === 'production', 
            sameSite: 'strict', 
            maxAge: 60 * 60 * 24 * 7,
            path: '/'
        });
        res.setHeader('Set-Cookie', cookie);
        res.redirect('/dashboard');

    } catch (error) {
        const status = error.response?.status || 503;
        
        console.error('Login Error Details:');
        console.error('Status:', status);
        console.error('Response data:', error.response?.data);
        console.error('Error message:', error.message);
        
        // --- PHẦN SỬA LỖI [object Object] ---
        let msg = 'Login failed';
        if (error.response && error.response.data) {
            // Nếu Java trả về object, hãy lấy thuộc tính message hoặc error của nó
            const data = error.response.data;
            if (typeof data === 'object') {
                msg = data.message || data.error || JSON.stringify(data);
            } else {
                msg = data; // Nếu là string
            }
        } else if (error.message) {
            msg = error.message;
        }
        // ------------------------------------

        console.error('Login Route Error:', msg);
        return res.status(status).render('login', { error: msg, success: null});
    }
});

app.get('/logout', (req, res) => {
    clearAuthCookie(res);
    res.redirect('/');
});

// Mount Admin routes (Dashboard + APIs)
const adminRouter = require('./admin');
app.use('/', adminRouter);

// Mount Admin Order routes (Categories, Products, Orders)
const adminOrderRouter = require('./adminOrder');
app.use('/', adminOrderRouter);

app.listen(port, () => {
    console.log(`Server started on http://localhost:${port}`);
});