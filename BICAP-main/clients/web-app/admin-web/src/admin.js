const express = require('express');
const path = require('path');
const axios = require('axios');
const jwt = require('jsonwebtoken');
const cookieParser = require('cookie-parser');
require('dotenv').config({ path: path.resolve(__dirname, '..', 'config', '.env') });

const router = express.Router();

// Cấu hình URL tới Auth Service (Java Backend)
const AUTH_SERVICE_URL = process.env.AUTH_SERVICE_URL || 'http://localhost:8080';
// Admin Service dùng cho các tác vụ quản trị User
const ADMIN_SERVICE_URL = process.env.ADMIN_SERVICE_URL || 'http://localhost:8085';
// Farm Service URL
const FARM_SERVICE_URL = process.env.FARM_SERVICE_URL || 'http://localhost:8081';

// Đồng bộ secret/role với authentication.js để đọc JWT trong cookie
// Per-role JWT secret for admin (must match auth-service bicap.app.jwtSecret.admin)
const JWT_SECRET_STRING = process.env.JWT_SECRET_ADMIN || 'YmljYXAtand0LWFkbWluLXJvbGUtc2VjcmV0LWtleS1hdXRoISEhIQ==';
const JWT_SECRET = Buffer.from(JWT_SECRET_STRING, 'base64');
const APPLICATION_ROLE = 'ROLE_ADMIN';
const COOKIE_NAME = 'admin_token';

// Gắn cookie-parser cho router (phòng trường hợp app cha chưa khai báo)
router.use(cookieParser());

// Lấy JWT từ cookie và gán req.user
const requireAuth = (req, res, next) => {
    const token = req.cookies?.[COOKIE_NAME] || req.cookies?.auth_token; // legacy fallback
    if (!token) return res.redirect('/login');
    try {
        const decoded = jwt.verify(token, JWT_SECRET);
        req.user = {
            sub: decoded.sub,
            username: decoded.sub,
            email: decoded.email,
            roles: decoded.roles || []
        };
        req.accessToken = token;
        return next();
    } catch (err) {
        return res.redirect('/login');
    }
};

// Kiểm tra role Admin
const requireAdmin = (req, res, next) => {
    if (!req.user) return res.redirect('/login');
    const roles = req.user.roles || [];
    if (!roles.includes('ADMIN') && !roles.includes(APPLICATION_ROLE)) {
        return res.status(403).render('error', { message: 'Bạn không có quyền truy cập trang này!' });
    }
    next();
};

// Shortcut: chuyển /admin về /dashboard
router.get('/admin', requireAuth, (req, res) => res.redirect('/dashboard'));

// =========================================================
// 1. ROUTE: DASHBOARD (Giao diện chính)
// =========================================================
router.get('/dashboard', requireAuth, requireAdmin, async (req, res) => {
    try {
        const headers = { Authorization: `Bearer ${req.accessToken}` };
        
        // Gọi song song cả 2 API: pending requests và stats
        const [pendingResponse, statsResponse] = await Promise.all([
            axios.get(`${ADMIN_SERVICE_URL}/api/v1/role-requests/pending`, { headers }),
            axios.get(`${ADMIN_SERVICE_URL}/api/v1/admin/dashboard/stats`, { headers }).catch((err) => {
                console.error('Lỗi gọi API stats:', err.message);
                return { data: {} };
            })
        ]);

        const pendingRequests = pendingResponse.data || [];
        const stats = statsResponse.data || {};
        
        console.log('Stats API response:', stats);

        res.render('dashboard', {
            user: req.user,
            requests: pendingRequests,
            pendingCount: pendingRequests.length,
            totalUsers: stats.totalUsers || 0,
            totalFarms: stats.totalFarms || 0,
            totalFarmManagers: stats.totalFarmManagers || 0,
            error: null
        });
    } catch (error) {
        console.error('Lỗi Admin Dashboard:', error.message);
        res.render('dashboard', {
            user: req.user,
            requests: [],
            pendingCount: 0,
            totalUsers: 0,
            totalFarms: 0,
            totalFarmManagers: 0,
            error: 'Không thể kết nối tới Service quản lý. Vui lòng thử lại sau.'
        });
    }
});

// =========================================================
// 2. ROUTE: PROXY API (Duyệt/Từ chối)
// =========================================================

// API: Duyệt yêu cầu
router.post('/api/v1/role-requests/:requestId/approve', requireAuth, requireAdmin, async (req, res) => {
    try {
        const { requestId } = req.params;
        const headers = { Authorization: `Bearer ${req.accessToken}` };
        await axios.post(`${ADMIN_SERVICE_URL}/api/v1/role-requests/${requestId}/approve`, null, { headers });
        res.status(200).json({ message: 'Duyệt thành công!' });
    } catch (error) {
        console.error('Lỗi duyệt role:', error.response?.data || error.message);
        res.status(500).json({ message: 'Lỗi server khi duyệt yêu cầu.' });
    }
});

// API: Từ chối yêu cầu
router.post('/api/v1/role-requests/:requestId/reject', requireAuth, requireAdmin, async (req, res) => {
    try {
        const { requestId } = req.params;
        const reason = req.body?.reason || 'Không đạt yêu cầu';
        const headers = { 
            Authorization: `Bearer ${req.accessToken}`,
            'Content-Type': 'text/plain'
        };
        // Java Controller nhận @RequestBody String => gửi text/plain
        await axios.post(`${ADMIN_SERVICE_URL}/api/v1/role-requests/${requestId}/reject`, reason, { headers });
        res.status(200).json({ message: 'Đã từ chối yêu cầu.' });
    } catch (error) {
        console.error('Lỗi từ chối role:', error.response?.data || error.message);
        res.status(500).json({ message: 'Lỗi server khi từ chối yêu cầu.' });
    }
});

// =========================================================
// 3. CÁC ROUTE PHỤ (Placeholder cho Menu Sidebar)
// =========================================================
router.get('/users', requireAuth, requireAdmin, (req, res) => {
    res.render('admin-users', { user: req.user });
});

router.get('/farms', requireAuth, requireAdmin, (req, res) => {
    res.render('admin-farms', { user: req.user });
});
// adminRoutes.js (Ví dụ)

// 4. Route trang Quản lý User
router.get('/admin/users', requireAuth, requireAdmin, async (req, res) => {
    try {
        const { keyword = '', role = '', page = 0, size = 10 } = req.query;
        const headers = { Authorization: `Bearer ${req.accessToken}` };

        let users = [];
        let pagination = {
            page: Number(page) || 0,
            size: Number(size) || 10,
            totalPages: 1,
            totalElements: 0
        };

        try {
            const response = await axios.get(`${ADMIN_SERVICE_URL}/api/v1/admin/users`, {
                params: { keyword, role, page, size },
                headers,
                timeout: 5000 // Timeout 5 giây
            });

            const payload = response.data || {};
            users = Array.isArray(payload) ? payload : (payload.content || []);
            pagination = {
                page: payload.number ?? Number(page) ?? 0,
                size: payload.size ?? Number(size) ?? 10,
                totalPages: payload.totalPages ?? 1,
                totalElements: payload.totalElements ?? users.length
            };
        } catch (apiError) {
            console.error('Lỗi gọi Admin Service API:', apiError.message);
            // Tiếp tục render với dữ liệu rỗng thay vì crash
        }

        res.render('users', {
            users,
            keyword,
            role,
            pagination
        });
    } catch (e) {
        console.error('Lỗi tải trang User:', e.message);
        res.status(500).render('error', { message: 'Lỗi tải trang User' });
    }
});

// Proxy: đổi trạng thái user
router.put('/api/v1/admin/users/:userId/status', requireAuth, requireAdmin, async (req, res) => {
    const { userId } = req.params;
    const { status } = req.query;

    if (!status) {
        return res.status(400).json({ message: 'Thiếu tham số status' });
    }

    try {
        const headers = { Authorization: `Bearer ${req.accessToken}` };
        const response = await axios.put(
            `${ADMIN_SERVICE_URL}/api/v1/admin/users/${userId}/status`,
            null,
            { params: { status }, headers }
        );

        res.status(response.status).json({ message: response.data || 'Cập nhật thành công' });
    } catch (error) {
        console.error('Lỗi đổi trạng thái user:', error.response?.data || error.message);
        const statusCode = error.response?.status || 500;
        const message = error.response?.data?.message || error.response?.data || 'Lỗi khi đổi trạng thái user';
        res.status(statusCode).json({ message });
    }
});

// 5. Route trang Giám sát Farm
router.get('/admin/farms', requireAuth, requireAdmin, async (req, res) => {
    try {
        const headers = { Authorization: `Bearer ${req.accessToken}` };
        
        console.log('Calling Farm Service at:', FARM_SERVICE_URL);
        
        // Gọi API lấy danh sách farm từ Farm Service
        const response = await axios.get(`${FARM_SERVICE_URL}/api/farm-features`, { 
            headers,
            timeout: 5000
        });
        
        const farmList = response.data || [];
        console.log('Farm data received:', farmList.length, 'farms');

        res.render('farms', {
            farms: farmList // List FarmResponseDTO
        });
    } catch (e) {
        console.error('Lỗi gọi Farm Service API:', e.message);
        console.error('FARM_SERVICE_URL was:', FARM_SERVICE_URL);
        res.render('farms', {
            farms: []
        });
    }
});

// 6. API Proxy: Lấy nhật ký hoạt động (logs) của Farm
router.get('/api/v1/admin/farms/:farmId/logs', requireAuth, requireAdmin, async (req, res) => {
    try {
        const { farmId } = req.params;
        const headers = { Authorization: `Bearer ${req.accessToken}` };
        
        console.log('Fetching logs for farm:', farmId);
        
        // Gọi API Farm Service để lấy logs
        const response = await axios.get(`${FARM_SERVICE_URL}/api/farm-features/${farmId}/logs`, {
            headers,
            timeout: 10000
        });
        
        const logs = response.data || [];
        console.log('Logs received:', logs.length, 'entries');
        
        res.status(200).json(logs);
    } catch (error) {
        console.error('Lỗi lấy logs farm:', error.response?.data || error.message);
        const statusCode = error.response?.status || 500;
        const message = error.response?.data?.message || 'Lỗi khi lấy nhật ký hoạt động';
        res.status(statusCode).json({ message });
    }
});

module.exports = router;