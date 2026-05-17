const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '..', '..', 'config', '.env') });

const fetch = require('node-fetch');
const { serialize } = require('cookie');
const jwt = require('jsonwebtoken');
const AUTH_SERVICE_URL = process.env.AUTH_SERVICE_URL;

console.log('AUTH_SERVICE_URL', AUTH_SERVICE_URL);

const APPLICATION_ROLE = 'ROLE_RETAILER';
// Per-role JWT secret for retailer (must match auth-service bicap.app.jwtSecret.retailer)
const JWT_SECRET_STRING = process.env.JWT_SECRET_RETAILER || 'YmljYXAtand0LXJldGFpbGVyLXJvbGUtc2VjcmV0LWtleS1hdXRoISEh';
const JWT_SECRET = Buffer.from(JWT_SECRET_STRING, 'base64');
const CLIENT_ID = 'retailer';
const COOKIE_NAME = 'retailer_token';

// -------------------------------------------------------------
// Utility: Clear Cookie
// -------------------------------------------------------------
const clearAuthCookie = (res) => {
    res.setHeader('Set-Cookie', serialize(COOKIE_NAME, '', {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'Strict',
        maxAge: -1,
        path: '/',
    }));
};

// Auth-Middleware
const requireAuth = (req, res, next) => {
    const token = req.cookies[COOKIE_NAME] || req.cookies.auth_token; // legacy fallback

    if (!token) {
        return res.redirect('/login');
    }

    try {
        // Validates using the Buffer secret (matches Java)
        const decoded = jwt.verify(token, JWT_SECRET);
        req.user = decoded;
        next();
    } catch (err) {
        console.error('JWT Verification Failed in Middleware:', err.message);
        clearAuthCookie(res);
        return res.redirect('/login');
    }
};

const showLogin = (req, res) => {
    res.render('login', { error: null });
};

const showRegister = (req, res) => {
    res.render('register', { error: null });
};

// -------------------------------------------------------------
// REGISTER POST: Register New User
// -------------------------------------------------------------
const register = async (req, res) => {
    const { email, password } = req.body;

    try {
        const apiResponse = await fetch(`${AUTH_SERVICE_URL}/register`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password, role: APPLICATION_ROLE }), // Send role for registration
        });

        const responseText = await apiResponse.text();

        if (!apiResponse.ok) {
            console.log('Registration failed from API:', responseText);
            return res.status(apiResponse.status).render('register', { error: responseText || 'Registration failed.' });
        }

        // Redirect to login after successful registration
        res.redirect('/login?registered=true');

    } catch (error) {
        console.error('Register Route Error:', error.message);
        return res.status(500).render('register', { error: 'Registration Error: ' + error.message });
    }
};

// -------------------------------------------------------------
// LOGIN POST: Authenticate & Set Cookie
// -------------------------------------------------------------
const login = async (req, res) => {
    const { email, password } = req.body;

    try {
        // 1. Call Java Backend
        const apiResponse = await fetch(`${AUTH_SERVICE_URL}/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password, clientId: CLIENT_ID }),
        });

        const responseText = await apiResponse.text();

        if (!apiResponse.ok) {
            console.log('Login failed from API:', responseText);
            return res.status(apiResponse.status).render('login', { error: responseText || 'Invalid credentials.' });
        }

        const accessToken = responseText;

        // 2. Verify Token & Check Role
        // Using the Buffer secret to verify signature
        const decodedToken = jwt.verify(accessToken, JWT_SECRET);

        // Java sends "roles" (plural) in the claim: .claim("roles", roles)
        const userRoles = decodedToken.roles;

        // Check: Does the user have RETAILER?
        if (!userRoles || !userRoles.includes(APPLICATION_ROLE)) {
            console.error(`Role Mismatch: Required ${APPLICATION_ROLE}, Got ${userRoles}`);
            clearAuthCookie(res);
            return res.status(403).render('login', { error: `Access Denied. You need ${APPLICATION_ROLE}.` });
        }

        // 3. Set Cookie
        const cookie = serialize(COOKIE_NAME, accessToken, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'Strict',
            maxAge: 60 * 60 * 24 * 7, // 1 week
            path: '/',
        });

        res.setHeader('Set-Cookie', cookie);
        res.redirect('/marketplace');

    } catch (error) {
        console.error('Login Route Error:', error.message);
        return res.status(503).render('login', { error: 'Login Error: ' + error.message });
    }
};

const logout = (req, res) => {
    clearAuthCookie(res);
    res.redirect('/');
};

module.exports = {
    requireAuth,
    showLogin,
    showRegister,
    register,
    login,
    logout
};
