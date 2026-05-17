const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../../config/.env') });

const axios = require('axios'); // Dùng axios thay cho node-fetch
const { serialize } = require('cookie');  // FIX: Use destructuring to get the serialize function
const jwt = require('jsonwebtoken'); 
const AUTH_SERVICE_URL = process.env.AUTH_SERVICE_URL;

let apiService;
try {
    apiService = require('../../config/apiService'); 
} catch (e) {
    console.error("CRITICAL ERROR: Không thể load file apiService.js.");
    console.error("Chi tiết lỗi:", e); // In ra lỗi cụ thể để debug
    process.exit(1); // Dừng app để báo lỗi rõ ràng
}

console.log('AUTH_SERVICE_URL', AUTH_SERVICE_URL);

const APPLICATION_ROLE = "ROLE_SHIPPINGMANAGER"; // Role đúng theo ERole enum (không có dấu gạch dưới giữa SHIPPING và MANAGER)

const express = require('express');
const bodyParser = require('body-parser');
const cookieParser = require('cookie-parser');

const app = express();
const port = 3003;

// Per-role JWT secret for shipping manager (must match auth-service bicap.app.jwtSecret.shippingManager)
const JWT_SECRET_STRING = process.env.JWT_SECRET_SHIPPING_MANAGER || 'YmljYXAtand0LXNoaXBwaW5nLW1nci1yb2xlLXNlY3JldC1rZXkhISEhIQ==';
const JWT_SECRET = Buffer.from(JWT_SECRET_STRING, 'base64');
const CLIENT_ID = 'shippingManager';
const COOKIE_NAME = 'shipping_manager_token';

app.set("views", __dirname);
app.set('view engine', "ejs");

app.use(express.static(path.join(__dirname, "..")));
app.use(bodyParser.urlencoded( { extended: false }));
app.use(cookieParser());

// Middleware: Truyền biến 'path' xuống View để highlight Sidebar
app.use((req, res, next) => {
    res.locals.path = req.path;
    next();
});

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
    const message = req.query.message || null;
    res.render('login', { error: null, message: message });
});

// -------------------------------------------------------------
// REGISTER GET: Show registration form
// -------------------------------------------------------------
app.get('/register', (req, res) => {
    res.render('register', { error: null });
});

// -------------------------------------------------------------
// REGISTER POST: Register new user
// -------------------------------------------------------------
app.post('/register', async (req, res) => {
    const { email, username, password, role } = req.body;
    
    try {
        // 1. Call Java Backend to register
        const response = await axios.post(`${AUTH_SERVICE_URL}/register`, {
            email,
            username,
            password,
            role: role || 'SHIPPINGMANAGER' // Không có ROLE_ prefix, UserRegistrationFactory sẽ tự thêm
        });
        
        // 2. Registration successful, redirect to login
        res.redirect('/login?message=Registration successful! Please login.');
        
    } catch (error) {
        console.error('Register Route Error:', error.message);
        const errorMsg = error.response && error.response.data 
            ? (typeof error.response.data === 'string' ? error.response.data : JSON.stringify(error.response.data))
            : error.message;
            
        return res.status(400).render('register', { error: 'Registration Failed: ' + errorMsg });
    }
});

// -------------------------------------------------------------
// LOGIN POST: Authenticate & Set Cookie
// -------------------------------------------------------------
app.post('/login', async (req, res) => {
    const { email, password } = req.body;  
    
    try {
        // 1. Call Java Backend
        // Sử dụng axios để tránh lỗi node-fetch ESM
        const response = await axios.post(`${AUTH_SERVICE_URL}/login`, { 
            email, 
            password,
            clientId: CLIENT_ID 
        });
        const accessToken = typeof response.data === 'string'
            ? response.data
            : (response.data?.accessToken || response.data?.access_token || response.data?.token);
        if (!accessToken) {
            return res.status(502).render('login', { error: 'Auth service did not return token.' });
        }
        
        // 2. Verify Token & Check Role
        // Using the Buffer secret to verify signature (must match auth-service)
        const decodedToken = jwt.verify(accessToken, JWT_SECRET); 
        
        // Java sends "roles" (plural) in the claim: .claim("roles", roles)
        const userRoles = decodedToken.roles;

        // Check: Does the user have ROLE_SHIPPINGMANAGER?
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
        // Xử lý lỗi từ axios (nếu backend trả về 401/403/500)
        const errorMsg = error.response && error.response.data 
            ? (typeof error.response.data === 'string' ? error.response.data : JSON.stringify(error.response.data))
            : error.message;
            
        return res.status(401).render('login', { error: 'Login Failed: ' + errorMsg });
    }
});

app.get('/dashboard', requireAuth, async (req, res) => {
    const token = req.cookies[COOKIE_NAME] || req.cookies.auth_token; // legacy fallback
    // Gọi API lấy báo cáo và danh sách vận đơn
    const report = await apiService.getSummaryReport(token);
    const shipments = await apiService.getAllShipments(token);
    const pendingDriverReports = await apiService.getPendingDriverReports(token);

    // Tính toán thống kê từ shipments
    const inTransitShipments = shipments.filter(s => s.status === 'IN_TRANSIT' || s.status === 'ASSIGNED').length;
    const deliveredShipments = shipments.filter(s => s.status === 'DELIVERED').length;
    const pendingShipments = shipments.filter(s => s.status === 'PENDING').length;

    res.render('dashboard', { 
        user: {
            username: req.user.sub,
            email: req.user.email,
            roles: req.user.roles
        },
        report: {
            ...report,
            inTransitShipments: inTransitShipments,
            deliveredShipments: deliveredShipments,
            pendingShipments: pendingShipments,
            pendingDriverReportsCount: pendingDriverReports ? pendingDriverReports.length : 0
        },
        shipments: shipments || []
    });
});

// --- 1. Trang Đơn hàng chờ (Orders) ---
app.get('/orders', requireAuth, async (req, res) => {
    const token = req.cookies[COOKIE_NAME] || req.cookies.auth_token; // legacy fallback
    const pendingOrders = await apiService.getConfirmedOrders(token);
    
    res.render('pages/orders', {
        user: { username: req.user.sub },
        orders: pendingOrders || [],
        query: req.query // Pass query params for success/error messages
    });
});

// --- 2. Trang Quản lý Vận chuyển (Shipments) ---
app.get('/shipments', requireAuth, async (req, res) => {
    const token = req.cookies[COOKIE_NAME] || req.cookies.auth_token; // legacy fallback
    const shipments = await apiService.getAllShipments(token);
    const drivers = await apiService.getAllDrivers(token);
    const vehicles = await apiService.getAllVehicles(token);

    res.render('pages/shipments', {
        user: { username: req.user.sub },
        shipments: shipments || [],
        drivers: drivers || [],
        vehicles: vehicles || [],
        query: req.query // Pass query params for success/error messages
    });
});

// --- 3. Trang Quản lý Xe (Vehicles) ---
app.get('/vehicles', requireAuth, async (req, res) => {
    const token = req.cookies[COOKIE_NAME] || req.cookies.auth_token; // legacy fallback
    const vehicles = await apiService.getAllVehicles(token);
    res.render('pages/vehicles', { 
        user: { username: req.user.sub }, 
        vehicles: vehicles || [],
        query: req.query 
    });
});

app.post('/vehicles', requireAuth, async (req, res) => {
    try {
        const token = req.cookies[COOKIE_NAME] || req.cookies.auth_token; // legacy fallback
        console.log('📝 [DEBUG] Creating vehicle - Request body:', JSON.stringify(req.body, null, 2));
        await apiService.createVehicle(token, req.body);
        res.redirect('/vehicles?success=Xe đã được thêm thành công');
    } catch (error) {
        console.error('❌ [ERROR] Error creating vehicle - Full error:', error);
        console.error('❌ [ERROR] Error message:', error.message);
        console.error('❌ [ERROR] Error name:', error.name);
        console.error('❌ [ERROR] Error response:', error.response);
        
        // Extract error message - ưu tiên error.message vì đã được extract từ apiService
        let errorMessage = error.message || 'Có lỗi xảy ra khi thêm xe';
        
        // Nếu error.message là message từ backend (dài hơn 20 ký tự và không chứa "status code" hoặc "Request failed")
        if (errorMessage && 
            errorMessage.length > 20 && 
            !errorMessage.includes('status code') && 
            !errorMessage.includes('Request failed') &&
            !errorMessage.includes('Network Error')) {
            // Đây là message từ backend, sử dụng trực tiếp
            console.error('❌ [ERROR] Using backend error message:', errorMessage);
        } else {
            // Nếu là message mặc định của axios, thử extract từ error.response
            if (error.response && error.response.data) {
                const responseData = error.response.data;
                if (typeof responseData === 'string' && responseData.length > 10) {
                    errorMessage = responseData.trim();
                    console.error('❌ [ERROR] Extracted from response.data:', errorMessage);
                } else if (typeof responseData === 'object' && responseData.error) {
                    errorMessage = responseData.error;
                    console.error('❌ [ERROR] Extracted from response.data.error:', errorMessage);
                }
            } else {
                errorMessage = 'Có lỗi xảy ra khi thêm xe';
            }
        }
        
        console.error('❌ [ERROR] Final error message to display:', errorMessage);
        res.redirect('/vehicles?error=' + encodeURIComponent(errorMessage));
    }
});

app.post('/vehicles/:id', requireAuth, async (req, res) => {
    try {
        const token = req.cookies[COOKIE_NAME] || req.cookies.auth_token; // legacy fallback
        const vehicleId = req.params.id;
        if (req.body._method === 'PUT') {
            await apiService.updateVehicle(token, vehicleId, req.body);
            res.redirect('/vehicles?success=Xe đã được cập nhật thành công');
        } else if (req.body._method === 'DELETE') {
            await apiService.deleteVehicle(token, vehicleId);
            res.redirect('/vehicles?success=Xe đã được xóa thành công');
        } else {
            res.redirect('/vehicles?error=Phương thức không hợp lệ');
        }
    } catch (error) {
        console.error('Error updating/deleting vehicle:', error);
        const action = req.body._method === 'PUT' ? 'cập nhật' : 'xóa';
        res.redirect('/vehicles?error=' + encodeURIComponent(`Có lỗi xảy ra khi ${action} xe: ${error.message || 'Vui lòng thử lại'}`));
    }
});

// --- 4. Trang Quản lý Tài xế (Drivers) ---
app.get('/drivers', requireAuth, async (req, res) => {
    const token = req.cookies[COOKIE_NAME] || req.cookies.auth_token; // legacy fallback
    const drivers = await apiService.getAllDrivers(token);
    res.render('pages/drivers', { 
        user: { username: req.user.sub }, 
        drivers: drivers || [],
        query: req.query 
    });
});

app.post('/drivers', requireAuth, async (req, res) => {
    try {
        const token = req.cookies[COOKIE_NAME] || req.cookies.auth_token; // legacy fallback
        console.log('📝 [DEBUG] Creating driver - Request body:', JSON.stringify(req.body, null, 2));
        await apiService.createDriver(token, req.body);
        res.redirect('/drivers?success=Tài xế đã được thêm thành công');
    } catch (error) {
        console.error('❌ [ERROR] Error creating driver - Full error:', error);
        console.error('❌ [ERROR] Error message:', error.message);
        console.error('❌ [ERROR] Error name:', error.name);
        console.error('❌ [ERROR] Error response:', error.response);
        
        // Extract error message - ưu tiên error.message vì đã được extract từ apiService
        let errorMessage = error.message || 'Có lỗi xảy ra khi thêm tài xế';
        
        // Nếu error.message là message từ backend (dài hơn 20 ký tự và không chứa "status code" hoặc "Request failed")
        if (errorMessage && 
            errorMessage.length > 20 && 
            !errorMessage.includes('status code') && 
            !errorMessage.includes('Request failed') &&
            !errorMessage.includes('Network Error')) {
            // Đây là message từ backend, sử dụng trực tiếp
            console.error('❌ [ERROR] Using backend error message:', errorMessage);
        } else {
            // Nếu là message mặc định của axios, thử extract từ error.response
            if (error.response && error.response.data) {
                const responseData = error.response.data;
                if (typeof responseData === 'string' && responseData.length > 10) {
                    errorMessage = responseData.trim();
                    console.error('❌ [ERROR] Extracted from response.data:', errorMessage);
                } else if (typeof responseData === 'object' && responseData.error) {
                    errorMessage = responseData.error;
                    console.error('❌ [ERROR] Extracted from response.data.error:', errorMessage);
                }
            } else {
                errorMessage = 'Có lỗi xảy ra khi thêm tài xế';
            }
        }
        
        console.error('❌ [ERROR] Final error message to display:', errorMessage);
        res.redirect('/drivers?error=' + encodeURIComponent(errorMessage));
    }
});

app.post('/drivers/:id', requireAuth, async (req, res) => {
    try {
        const token = req.cookies[COOKIE_NAME] || req.cookies.auth_token; // legacy fallback
        const driverId = req.params.id;
        if (req.body._method === 'PUT') {
            await apiService.updateDriver(token, driverId, req.body);
            res.redirect('/drivers?success=Tài xế đã được cập nhật thành công');
        } else if (req.body._method === 'DELETE') {
            await apiService.deleteDriver(token, driverId);
            res.redirect('/drivers?success=Tài xế đã được xóa thành công');
        } else {
            res.redirect('/drivers?error=Phương thức không hợp lệ');
        }
    } catch (error) {
        console.error('Error updating/deleting driver:', error);
        const action = req.body._method === 'PUT' ? 'cập nhật' : 'xóa';
        res.redirect('/drivers?error=' + encodeURIComponent(`Có lỗi xảy ra khi ${action} tài xế: ${error.message || 'Vui lòng thử lại'}`));
    }
});

// --- 5. Trang Báo cáo (Reports) ---
app.get('/reports', requireAuth, async (req, res) => {
    const token = req.cookies[COOKIE_NAME] || req.cookies.auth_token; // legacy fallback
    const report = await apiService.getSummaryReport(token);
    const driverReports = await apiService.getAllDriverReports(token);
    const pendingDriverReports = await apiService.getPendingDriverReports(token);
    const myAdminReports = await apiService.getMyAdminReports(token);
    
    res.render('pages/reports', { 
        user: { username: req.user.sub }, 
        report: report || {},
        driverReports: driverReports || [],
        pendingDriverReports: pendingDriverReports || [],
        myAdminReports: myAdminReports || [],
        query: req.query
    });
});

app.post('/reports/admin', requireAuth, async (req, res) => {
    try {
        const token = req.cookies[COOKIE_NAME] || req.cookies.auth_token; // legacy fallback
        const { title, description, reportType, priority } = req.body;
        await apiService.sendReportToAdmin(token, {
            title,
            description,
            reportType: reportType || 'GENERAL',
            priority: priority || 'MEDIUM'
        });
        res.redirect('/reports?success=Báo cáo đã được gửi thành công');
    } catch (error) {
        console.error('Error sending report to admin:', error);
        res.redirect('/reports?error=' + encodeURIComponent(error.message || 'Có lỗi xảy ra khi gửi báo cáo'));
    }
});

// --- 6. Trang Gửi Thông báo (Notifications) ---
app.get('/notifications', requireAuth, async (req, res) => {
    res.render('pages/notifications', { 
        user: { username: req.user.sub },
        query: req.query
    });
});

app.post('/notifications', requireAuth, async (req, res) => {
    try {
        const token = req.cookies[COOKIE_NAME] || req.cookies.auth_token; // legacy fallback
        const { recipientType, title, message, priority, relatedOrderId } = req.body;
        
        const notificationData = {
            recipientType,
            title,
            message,
            priority: priority || 'MEDIUM'
        };
        
        if (relatedOrderId && relatedOrderId.trim() !== '') {
            notificationData.relatedOrderId = parseInt(relatedOrderId);
        }
        
        await apiService.sendNotification(token, notificationData);
        res.redirect('/notifications?success=Thông báo đã được gửi thành công');
    } catch (error) {
        console.error('Error sending notification:', error);
        const errorMsg = error.response && error.response.data 
            ? (typeof error.response.data === 'string' ? error.response.data : error.response.data.error || JSON.stringify(error.response.data))
            : error.message;
        res.redirect('/notifications?error=' + encodeURIComponent(errorMsg || 'Có lỗi xảy ra khi gửi thông báo'));
    }
});

app.post('/shipments/create', requireAuth, async (req, res) => {
    try {
        const token = req.cookies[COOKIE_NAME] || req.cookies.auth_token; // legacy fallback
        await apiService.createShipment(token, req.body);
        res.redirect('/shipments?success=Tạo vận đơn thành công');
    } catch (error) {
        console.error('Error creating shipment:', error);
        res.redirect('/orders?error=' + encodeURIComponent(error.message || 'Có lỗi xảy ra khi tạo vận đơn'));
    }
});

app.post('/shipments/assign', requireAuth, async (req, res) => {
    try {
        const token = req.cookies[COOKIE_NAME] || req.cookies.auth_token; // legacy fallback
        const { shipmentId, driverId, vehicleId } = req.body;
        const success = await apiService.assignDriver(token, shipmentId, driverId, vehicleId);
        if (success) {
            res.redirect('/shipments?success=Gán xe thành công');
        } else {
            res.redirect('/shipments?error=Gán xe thất bại');
        }
    } catch (error) {
        console.error('Error assigning driver:', error);
        res.redirect('/shipments?error=' + encodeURIComponent(error.message || 'Có lỗi xảy ra'));
    }
});

app.post('/logout', (req, res) => {
    clearAuthCookie(res);
    res.redirect('/');
});

app.listen(port, '0.0.0.0', () => {
    console.log(`Server started on http://0.0.0.0:${port}`);
});