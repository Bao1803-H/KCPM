const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '..', 'config', '.env') });

const fetch = require('node-fetch');
const { serialize } = require('cookie');  // FIX: Use destructuring to get the serialize function
const jwt = require('jsonwebtoken'); 
const AUTH_SERVICE_URL = process.env.AUTH_SERVICE_URL;

console.log('AUTH_SERVICE_URL', AUTH_SERVICE_URL);

// Update Role to match Java Enum (ROLE_RETAILER)
const APPLICATION_ROLE = "ROLE_RETAILER"; 
const COOKIE_NAME = "retailer_token";
const CLIENT_ID = "retailer";

const express = require('express');
const bodyParser = require('body-parser');
const cookieParser = require('cookie-parser');

const app = express();
const port = process.env.PORT || 3004;

// Base64 String from Java properties (FIX: Remove extra 'Cg==' to eliminate trailing newline in decoded key)
const JWT_SECRET_STRING = process.env.JWT_SECRET_RETAILER || 'YmljYXAtand0LXJldGFpbGVyLXJvbGUtc2VjcmV0LWtleS1hdXRoISEh';
const JWT_SECRET = Buffer.from(JWT_SECRET_STRING, 'base64');

app.set("views", path.join(__dirname, "..", "front-end", "template"));
app.set('view engine', "ejs");

app.use(express.static(path.join(__dirname, "..","front-end")));
app.use(bodyParser.urlencoded( { extended: false }));
app.use(cookieParser());

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

// -------------------------------------------------------------
// Routes
// -------------------------------------------------------------

app.get('/', (req, res) => {
    let user = null;
    try {
        const token = req.cookies[COOKIE_NAME] || req.cookies.auth_token; // legacy fallback
        if (token) {
            // Just decoding for display is fine here, verify() is safer though
            const decoded = jwt.verify(token, JWT_SECRET); 
            user = {
                sub: decoded.sub,
                username: decoded.sub,  // Normalize for EJS (username = sub from JWT)
                email: decoded.email,
                roles: decoded.roles
            };
        }
    } catch(e) { /* ignore errors for public index page */ }

    res.render('index', { user: user });
});

app.get('/login', (req, res) => {
    res.render('login', { error: null });
});

// -------------------------------------------------------------
// LOGIN POST: Authenticate & Set Cookie
// -------------------------------------------------------------
app.post('/login', async (req, res) => {
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

        // Check: Does the user have ROLE_RETAILER?
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
        res.redirect('/dashboard');

    } catch (error) {
        console.error('Login Route Error:', error.message);
        return res.status(503).render('login', { error: 'Login Error: ' + error.message });
    }
});

app.get('/register', (req, res) => {
    res.render('register');
});

app.post('/register', async (req, res) => {
    const { username, email, password } = req.body;
    
    try {
        const apiResponse = await fetch(`${AUTH_SERVICE_URL}/register`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ 
                username, 
                email,
                password, 
                role: 'RETAILER'  // FIX: Send as string matching backend's expected value (not array, and "RETAILER" not "ROLE_RETAILER")
            }),
        });
        
        const data = await apiResponse.json();

        if (apiResponse.ok) {
            res.redirect('/login');
        } else {
            return res.status(apiResponse.status).send(data.message || 'Registration failed.');
        }

    } catch (error) {
        console.error('Registration Error:', error);
        return res.status(503).send('Service unavailable.');
    }
});

app.get('/dashboard', requireAuth, (req, res) => {
    res.render('dashboard', { 
        user: {
            username: req.user.sub,  // FIX: Add username from JWT sub
            email: req.user.email,
            roles: req.user.roles  // Java JWT claim is "roles"
        } 
    });
});

app.post('/logout', (req, res) => {
    clearAuthCookie(res);
    res.redirect('/');
});

app.listen(port, () => {
    console.log(`Server started on http://localhost:${port}`);
});