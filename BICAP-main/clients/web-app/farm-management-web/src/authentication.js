const path = require('path');
const fs = require('fs');
const express = require('express');
const cookieParser = require('cookie-parser');
const multer = require('multer');
const jwt = require('jsonwebtoken');
const { serialize } = require('cookie');

const envLocalPath = path.resolve(__dirname, '..', 'config', '.env.local');
const envPath = path.resolve(__dirname, '..', 'config', '.env');

if (fs.existsSync(envLocalPath)) {
    console.log('Loading environment from .env.local');
    require('dotenv').config({ path: envLocalPath });
} else {
    console.log('Loading environment from .env');
    require('dotenv').config({ path: envPath });
}

const farmController = require('./farmController');
const productController = require('../productController');
const productProxyController = require('./productProxyController');
const shippingController = require('./shippingController');
const notificationController = require('./notificationController');
const seasonMonitorController = require('./seasonMonitorController');
const profileRoutes = require('./profile');

const AUTH_SERVICE_URL = process.env.AUTH_SERVICE_URL;
const APPLICATION_ROLE = 'ROLE_FARMMANAGER';
const CLIENT_ID = 'farm';
const COOKIE_NAME = 'farm_token';
const port = Number(process.env.PORT || 3002);
const isDevelopment = process.env.NODE_ENV !== 'production';

const app = express();

const uploadsDir = path.join(__dirname, '..', 'uploads', 'images');
if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir, { recursive: true });
}

const upload = multer({
    storage: multer.diskStorage({
        destination: (_req, _file, cb) => cb(null, uploadsDir),
        filename: (_req, file, cb) => {
            const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
            cb(null, `${file.fieldname}-${uniqueSuffix}${path.extname(file.originalname)}`);
        }
    })
});

const uploadMemory = multer({
    storage: multer.memoryStorage(),
    limits: { fileSize: 10 * 1024 * 1024 }
});

const jwtSecretString =
    process.env.JWT_SECRET_FARM || 'YmljYXAtand0LWZhcm0tcm9sZS1zZWNyZXQta2V5LWF1dGghISEhISEh';
const jwtSecretBuffer = Buffer.from(jwtSecretString, 'base64');

app.set('views', path.join(__dirname, '..', 'front-end', 'template'));
app.set('view engine', 'ejs');

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(express.static(path.join(__dirname, '..', 'front-end')));
app.use('/assets', express.static(path.join(__dirname, '..', 'assets')));
app.use('/uploads', express.static(path.join(__dirname, '..', 'uploads')));
app.use(cookieParser());
app.use((req, res, next) => {
    res.set('Cache-Control', 'no-store, no-cache, must-revalidate, private');
    res.set('Pragma', 'no-cache');
    res.set('Expires', '0');
    next();
});

const clearAuthCookie = (res) => {
    res.setHeader(
        'Set-Cookie',
        serialize(COOKIE_NAME, '', {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'Strict',
            maxAge: -1,
            path: '/'
        })
    );
};

const shouldReturnJson = (req) => {
    const acceptHeader = req.get('accept') || '';
    return req.path.startsWith('/api/') || acceptHeader.includes('application/json');
};

const handleUnauthorized = (req, res, message) => {
    if (shouldReturnJson(req)) {
        return res.status(401).json({
            error: 'Unauthorized',
            message
        });
    }

    return res.redirect('/login');
};

const verifyToken = (token) => {
    try {
        return jwt.verify(token, jwtSecretBuffer, { algorithms: ['HS256'] });
    } catch (_bufferError) {
        const secretString = Buffer.from(jwtSecretString, 'base64').toString('utf8');
        return jwt.verify(token, secretString, { algorithms: ['HS256'] });
    }
};

const issueDevToken = (role) =>
    jwt.sign(
        {
            sub: role === 'ROLE_ADMIN' ? 'local.admin' : 'local.farm.manager',
            email: role === 'ROLE_ADMIN' ? 'admin.local@bicap.test' : 'farm.local@bicap.test',
            roles: [role],
            userId: role === 'ROLE_ADMIN' ? 'admin-local-1' : 'farm-local-1'
        },
        jwtSecretBuffer,
        {
            algorithm: 'HS256',
            expiresIn: '7d'
        }
    );

const requireAuth = (req, res, next) => {
    const token = req.cookies[COOKIE_NAME] || req.cookies.auth_token;

    if (!token) {
        return handleUnauthorized(req, res, 'Authentication required.');
    }

    try {
        req.user = verifyToken(token);
        next();
    } catch (error) {
        console.error('JWT verification failed:', error.message);
        clearAuthCookie(res);
        return handleUnauthorized(req, res, 'Session is invalid or expired.');
    }
};

app.get('/health', (_req, res) => {
    res.json({
        status: 'ok',
        service: 'farm-management-web',
        port,
        rabbitmqEnabled: process.env.RABBITMQ_ENABLED !== 'false',
        timestamp: new Date().toISOString()
    });
});

app.get('/', (req, res) => {
    let user = null;

    try {
        const token = req.cookies[COOKIE_NAME] || req.cookies.auth_token;
        if (token) {
            const decoded = verifyToken(token);
            user = {
                sub: decoded.sub,
                username: decoded.sub,
                email: decoded.email,
                roles: decoded.roles
            };
        }
    } catch (_error) {
        user = null;
    }

    res.render('index', { user, isDevelopment });
});

app.get('/login', (_req, res) => {
    res.render('login', { error: null, isDevelopment });
});

app.post('/login', async (req, res) => {
    const { email, password } = req.body;

    if (!AUTH_SERVICE_URL) {
        return res.status(500).render('login', {
            error: 'Server configuration error: AUTH_SERVICE_URL is missing.',
            isDevelopment
        });
    }

    try {
        const loginResponse = await fetch(`${AUTH_SERVICE_URL}/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password, clientId: CLIENT_ID })
        });

        const responseText = (await loginResponse.text()).trim();

        if (!loginResponse.ok) {
            return res.status(loginResponse.status).render('login', {
                error: responseText || 'Invalid credentials.',
                isDevelopment
            });
        }

        const decodedToken = verifyToken(responseText);
        const userRoles = decodedToken.roles;

        const hasRequiredRole =
            (Array.isArray(userRoles) &&
                userRoles.some((role) => role === APPLICATION_ROLE || role === 'ROLE_ADMIN')) ||
            (typeof userRoles === 'string' &&
                (userRoles.includes(APPLICATION_ROLE) || userRoles.includes('ROLE_ADMIN')));

        if (!hasRequiredRole) {
            clearAuthCookie(res);
            return res.status(403).render('login', {
                error: `Access denied. Required role: ${APPLICATION_ROLE}.`,
                isDevelopment
            });
        }

        const cookie = serialize(COOKIE_NAME, responseText, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'Strict',
            maxAge: 60 * 60 * 24 * 7,
            path: '/'
        });

        res.setHeader('Set-Cookie', cookie);
        res.redirect('/dashboard');
    } catch (error) {
        console.error('Login error:', error.message);
        const helperMessage = isDevelopment
            ? 'Authentication service is not reachable. On this machine Docker is not available, so use /dev/login-as-farm to inspect protected pages locally.'
            : `Cannot connect to authentication service. ${error.message}`;
        return res.status(503).render('login', {
            error: helperMessage,
            isDevelopment
        });
    }
});

app.get('/register', (_req, res) => {
    res.render('register', { error: null, isDevelopment });
});

app.post('/register', async (req, res) => {
    const { username, email, password } = req.body;

    if (!AUTH_SERVICE_URL) {
        return res.status(500).render('register', {
            error: 'Server configuration error: AUTH_SERVICE_URL is missing.',
            isDevelopment
        });
    }

    try {
        const registerResponse = await fetch(`${AUTH_SERVICE_URL}/register`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                username,
                password,
                email,
                role: 'FARMMANAGER'
            })
        });

        if (registerResponse.ok) {
            return res.redirect('/login');
        }

        const errorText = await registerResponse.text();
        return res.status(registerResponse.status).render('register', {
            error: errorText || 'Registration failed.',
            isDevelopment
        });
    } catch (error) {
        console.error('Registration error:', error.message);
        const helperMessage = isDevelopment
            ? 'Authentication service is not reachable. If you only need to test UI locally, go back and use the dev login shortcut.'
            : `Cannot connect to authentication service. ${error.message}`;
        return res.status(503).render('register', {
            error: helperMessage,
            isDevelopment
        });
    }
});

app.get('/dashboard', requireAuth, (req, res) => {
    const marketplaceApiPath = process.env.MARKETPLACE_API_PATH || 'http://localhost:8000/api/marketplace';
    const apiGatewayBaseUrl = marketplaceApiPath.split('/api')[0];
    const farmingSeasonsApiPath =
        process.env.FARMING_SEASONS_API_PATH || 'http://localhost:8000/api/production-batches';

    res.render('dashboard', {
        user: {
            username: req.user.sub,
            email: req.user.email,
            roles: req.user.roles
        },
        API_GATEWAY_BASE_URL: apiGatewayBaseUrl,
        MARKETPLACE_API_PATH: marketplaceApiPath,
        FARMING_SEASONS_API_PATH: farmingSeasonsApiPath
    });
});

if (process.env.NODE_ENV !== 'production') {
    app.get('/debug/user-info', requireAuth, (req, res) => {
        const roles = req.user.roles;
        const rolesArray = Array.isArray(roles) ? roles : typeof roles === 'string' ? roles.split(',') : [];
        const rolesString =
            typeof roles === 'string' ? roles : Array.isArray(roles) ? roles.join(',') : String(roles);

        res.json({
            message: 'Token decoded successfully',
            user: req.user,
            availableFields: Object.keys(req.user),
            roles,
            rolesType: typeof roles,
            rolesArray,
            rolesString,
            hasROLE_FARMMANAGER:
                rolesArray.includes('ROLE_FARMMANAGER') || rolesString.includes('ROLE_FARMMANAGER'),
            hasROLE_ADMIN: rolesArray.includes('ROLE_ADMIN') || rolesString.includes('ROLE_ADMIN'),
            APPLICATION_ROLE,
            roleCheck: rolesArray.includes(APPLICATION_ROLE) || rolesString.includes(APPLICATION_ROLE)
        });
    });

    app.get('/dev/login-as-farm', (_req, res) => {
        const cookie = serialize(COOKIE_NAME, issueDevToken('ROLE_FARMMANAGER'), {
            httpOnly: true,
            secure: false,
            sameSite: 'Strict',
            maxAge: 60 * 60 * 24 * 7,
            path: '/'
        });

        res.setHeader('Set-Cookie', cookie);
        res.redirect('/dashboard');
    });

    app.get('/dev/login-as-admin', (_req, res) => {
        const cookie = serialize(COOKIE_NAME, issueDevToken('ROLE_ADMIN'), {
            httpOnly: true,
            secure: false,
            sameSite: 'Strict',
            maxAge: 60 * 60 * 24 * 7,
            path: '/'
        });

        res.setHeader('Set-Cookie', cookie);
        res.redirect('/dashboard');
    });
}

app.get('/farm-info', requireAuth, farmController.getFarmInfoPage);
app.get('/farm-info/edit', requireAuth, farmController.getEditFarmPage);
app.post('/farm-info/create', requireAuth, farmController.createFarm);
app.post('/farm-info/update', requireAuth, farmController.updateFarmInfo);

app.get('/products', requireAuth, productController.getProductsPage);
app.get('/api/export-batches', requireAuth, seasonMonitorController.getExportBatchesForFarm);
app.get('/api/marketplace-products/farm/:farmId', requireAuth, productProxyController.getProductsByFarm);
app.post('/api/marketplace-products', requireAuth, productProxyController.createProduct);
app.put('/api/marketplace-products/:productId', requireAuth, productProxyController.updateProduct);
app.delete('/api/marketplace-products/:productId', requireAuth, productProxyController.deleteProduct);
app.post(
    '/api/marketplace-products/:productId/images',
    requireAuth,
    uploadMemory.single('file'),
    productProxyController.uploadMarketplaceProductImage
);
app.post(
    '/api/images/upload',
    requireAuth,
    uploadMemory.single('file'),
    productProxyController.uploadProductImage
);

app.get('/shipping', requireAuth, shippingController.getShippingPage);

app.get('/season-monitor', requireAuth, seasonMonitorController.getSeasonMonitorPage);
app.get('/api/season-monitor/:id/detail', requireAuth, seasonMonitorController.getSeasonDetail);
app.post('/api/season-monitor/create', requireAuth, seasonMonitorController.createSeason);
app.post('/api/season-monitor/:batchId/progress', requireAuth, seasonMonitorController.updateSeasonProgress);
app.post('/api/season-monitor/:batchId/export', requireAuth, seasonMonitorController.exportSeason);

app.get('/notifications', requireAuth, notificationController.getNotificationsPage);
app.get('/api/notifications/stream', requireAuth, notificationController.streamNotifications);
app.get('/api/notifications', requireAuth, notificationController.getAllNotifications);
app.post('/api/notifications/:id/read', requireAuth, notificationController.markAsRead);
app.delete('/api/notifications/:id', requireAuth, notificationController.deleteNotification);
app.delete('/api/notifications', requireAuth, notificationController.clearAllNotifications);
app.post('/api/notifications/test', requireAuth, notificationController.sendTestNotification);

app.use('/', profileRoutes(requireAuth));

const handleLogout = (_req, res) => {
    clearAuthCookie(res);
    res.redirect('/login');
};

app.get('/logout', handleLogout);
app.post('/logout', handleLogout);

app.post('/upload/product-image', requireAuth, upload.single('productImage'), (req, res) => {
    if (!req.file) {
        return res.status(400).json({ message: 'No file uploaded.' });
    }

    return res.json({ imageUrl: `/uploads/images/${req.file.filename}` });
});

app.use((err, req, res, _next) => {
    if (err.type === 'entity.too.large') {
        return res.status(413).json({
            error: 'File too large',
            message: 'The uploaded image is too big. Please use a smaller file (max 10MB).',
            maxSize: '10MB'
        });
    }

    console.error('Global error:', err);
    return res.status(err.status || 500).json({
        error: 'Internal Server Error',
        message: err.message,
        ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
    });
});

const startServer = () =>
    app.listen(port, () => {
        console.log(`Farm Management web app started on http://localhost:${port}`);
        console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
        console.log(`RabbitMQ: ${process.env.RABBITMQ_ENABLED !== 'false' ? 'Enabled' : 'Disabled'}`);
    });

if (require.main === module) {
    startServer();
}

process.on('SIGINT', () => {
    console.log('\nShutting down gracefully...');
    process.exit(0);
});

process.on('SIGTERM', () => {
    console.log('\nShutting down gracefully...');
    process.exit(0);
});

module.exports = {
    app,
    startServer
};
