const express = require('express');
const path = require('path');
const axios = require('axios');
const jwt = require('jsonwebtoken');
const cookieParser = require('cookie-parser');
require('dotenv').config({ path: path.resolve(__dirname, '..', 'config', '.env') });

const router = express.Router();

// Cấu hình URL tới các Services
const ADMIN_SERVICE_URL = process.env.ADMIN_SERVICE_URL || 'http://localhost:8085';
const TRADING_ORDER_SERVICE_URL = process.env.TRADING_ORDER_SERVICE_URL || 'http://localhost:8083';

// Đồng bộ secret/role với authentication.js để đọc JWT trong cookie
// Per-role JWT secret for admin (must match auth-service bicap.app.jwtSecret.admin)
const JWT_SECRET_STRING = process.env.JWT_SECRET_ADMIN || 'YmljYXAtand0LWFkbWluLXJvbGUtc2VjcmV0LWtleS1hdXRoISEhIQ==';
const JWT_SECRET = Buffer.from(JWT_SECRET_STRING, 'base64');
const APPLICATION_ROLE = 'ROLE_ADMIN';
const COOKIE_NAME = 'admin_token';

// Gắn cookie-parser cho router
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

// =========================================================
// 1. ROUTE: QUẢN LÝ DANH MỤC (Categories)
// =========================================================

// Trang quản lý danh mục
router.get('/admin/categories', requireAuth, requireAdmin, async (req, res) => {
    try {
        const headers = { Authorization: `Bearer ${req.accessToken}` };
        
        console.log('Calling Admin Service for categories at:', ADMIN_SERVICE_URL);
        
        // Gọi API lấy danh sách categories từ Admin Service
        const response = await axios.get(`${ADMIN_SERVICE_URL}/api/v1/admin/categories`, { 
            headers,
            timeout: 5000
        });
        
        const categories = response.data || [];
        console.log('Categories received:', categories.length, 'items');

        res.render('admin-categories', {
            categories: categories,
            user: req.user
        });
    } catch (e) {
        console.error('Lỗi gọi Categories API:', e.message);
        res.render('admin-categories', {
            categories: [],
            user: req.user
        });
    }
});

// API Proxy: Tạo danh mục mới
router.post('/api/v1/admin/categories', requireAuth, requireAdmin, async (req, res) => {
    try {
        const headers = { 
            Authorization: `Bearer ${req.accessToken}`,
            'Content-Type': 'application/json'
        };
        
        console.log('Creating new category:', req.body);
        
        const response = await axios.post(`${ADMIN_SERVICE_URL}/api/v1/admin/categories`, req.body, {
            headers,
            timeout: 5000
        });
        
        res.status(201).json(response.data);
    } catch (error) {
        console.error('Lỗi tạo category:', error.response?.data || error.message);
        const statusCode = error.response?.status || 500;
        const message = error.response?.data?.message || error.response?.data || 'Lỗi khi tạo danh mục';
        res.status(statusCode).json({ message });
    }
});

// API Proxy: Cập nhật danh mục
router.put('/api/v1/admin/categories/:id', requireAuth, requireAdmin, async (req, res) => {
    try {
        const { id } = req.params;
        const headers = { 
            Authorization: `Bearer ${req.accessToken}`,
            'Content-Type': 'application/json'
        };
        
        console.log('Updating category:', id, req.body);
        
        const response = await axios.put(`${ADMIN_SERVICE_URL}/api/v1/admin/categories/${id}`, req.body, {
            headers,
            timeout: 5000
        });
        
        res.status(200).json(response.data);
    } catch (error) {
        console.error('Lỗi cập nhật category:', error.response?.data || error.message);
        const statusCode = error.response?.status || 500;
        const message = error.response?.data?.message || error.response?.data || 'Lỗi khi cập nhật danh mục';
        res.status(statusCode).json({ message });
    }
});

// API Proxy: Xóa mềm danh mục (ẩn)
router.delete('/api/v1/admin/categories/:id', requireAuth, requireAdmin, async (req, res) => {
    try {
        const { id } = req.params;
        const headers = { Authorization: `Bearer ${req.accessToken}` };
        
        console.log('Soft deleting category:', id);
        
        const response = await axios.delete(`${ADMIN_SERVICE_URL}/api/v1/admin/categories/${id}`, {
            headers,
            timeout: 5000
        });
        
        res.status(200).json({ message: response.data || 'Đã ẩn danh mục thành công' });
    } catch (error) {
        console.error('Lỗi xóa category:', error.response?.data || error.message);
        const statusCode = error.response?.status || 500;
        const message = error.response?.data?.message || error.response?.data || 'Lỗi khi xóa danh mục';
        res.status(statusCode).json({ message });
    }
});

// API Proxy: Xóa vĩnh viễn danh mục
router.delete('/api/v1/admin/categories/:id/permanent', requireAuth, requireAdmin, async (req, res) => {
    try {
        const { id } = req.params;
        const headers = { Authorization: `Bearer ${req.accessToken}` };
        
        console.log('Hard deleting category:', id);
        
        const response = await axios.delete(`${ADMIN_SERVICE_URL}/api/v1/admin/categories/${id}/permanent`, {
            headers,
            timeout: 5000
        });
        
        res.status(200).json({ message: response.data || 'Đã xóa vĩnh viễn danh mục' });
    } catch (error) {
        console.error('Lỗi xóa vĩnh viễn category:', error.response?.data || error.message);
        const statusCode = error.response?.status || 500;
        const message = error.response?.data?.message || error.response?.data || 'Lỗi khi xóa vĩnh viễn danh mục';
        res.status(statusCode).json({ message });
    }
});

// =========================================================
// 2. ROUTE: GIÁM SÁT SẢN PHẨM (Products)
// =========================================================

// Trang giám sát sản phẩm (có thể lọc theo status)
router.get('/admin/products', requireAuth, requireAdmin, async (req, res) => {
    try {
        const { keyword = '', status = '', farmId = '', page = 0, size = 10 } = req.query;
        const headers = { Authorization: `Bearer ${req.accessToken}` };

        console.log('Calling Admin Service for products at:', ADMIN_SERVICE_URL);

        // Chỉ gửi các tham số filter khi có giá trị, tránh truyền chuỗi rỗng gây lỗi/không khớp
        const params = {
            page,
            size
        };
        if (keyword) params.keyword = keyword;
        if (status) params.status = status;
        if (farmId) params.farmId = farmId;

        // Gọi API lấy danh sách products từ Admin Service
        const response = await axios.get(`${ADMIN_SERVICE_URL}/api/v1/admin/products`, {
            params,
            headers,
            timeout: 5000
        });

        // Check if response is HTML (Login Page) instead of JSON
        if (response.headers['content-type'] && response.headers['content-type'].includes('text/html')) {
            console.error('Error: Admin Service returned HTML (Login Page). Check Security Configuration.');
            throw new Error('Admin Service returned HTML instead of JSON');
        }

        const payload = response.data || {};
        const products = payload.content || [];
        const pagination = {
            page: payload.number ?? Number(page) ?? 0,
            size: payload.size ?? Number(size) ?? 10,
            totalPages: payload.totalPages ?? 1,
            totalElements: payload.totalElements ?? products.length
        };

        console.log('Products received:', products.length, 'items');

        res.render('admin-products', {
            products: products,
            keyword,
            status,
            farmId,
            pagination,
            user: req.user
        });
    } catch (e) {
        console.error('Lỗi gọi Products API:', e.message);
        res.render('admin-products', {
            products: [],
            keyword: '',
            status: '',
            farmId: '',
            pagination: { page: 0, size: 10, totalPages: 1, totalElements: 0 },
            user: req.user
        });
    }
});

// API Proxy: Lấy chi tiết sản phẩm
router.get('/api/v1/admin/products/:id', requireAuth, requireAdmin, async (req, res) => {
    try {
        const { id } = req.params;
        const headers = { Authorization: `Bearer ${req.accessToken}` };
        
        const response = await axios.get(`${ADMIN_SERVICE_URL}/api/v1/admin/products/${id}`, {
            headers,
            timeout: 5000
        });
        
        res.status(200).json(response.data);
    } catch (error) {
        console.error('Lỗi lấy chi tiết product:', error.response?.data || error.message);
        const statusCode = error.response?.status || 500;
        const message = error.response?.data?.message || 'Lỗi khi lấy chi tiết sản phẩm';
        res.status(statusCode).json({ message });
    }
});

// API Proxy: Khóa sản phẩm (ban)
router.put('/api/v1/admin/products/:id/ban', requireAuth, requireAdmin, async (req, res) => {
    try {
        const { id } = req.params;
        const headers = { 
            Authorization: `Bearer ${req.accessToken}`,
            'Content-Type': 'application/json'
        };
        
        console.log('Banning product:', id, req.body);
        
        const response = await axios.put(`${ADMIN_SERVICE_URL}/api/v1/admin/products/${id}/ban`, req.body, {
            headers,
            timeout: 5000
        });
        
        res.status(200).json(response.data);
    } catch (error) {
        console.error('Lỗi khóa product:', error.response?.data || error.message);
        const statusCode = error.response?.status || 500;
        const message = error.response?.data?.message || 'Lỗi khi khóa sản phẩm';
        res.status(statusCode).json({ message });
    }
});

// API Proxy: Mở khóa sản phẩm (unban)
router.put('/api/v1/admin/products/:id/unban', requireAuth, requireAdmin, async (req, res) => {
    try {
        const { id } = req.params;
        const headers = { Authorization: `Bearer ${req.accessToken}` };
        
        console.log('Unbanning product:', id);
        
        const response = await axios.put(`${ADMIN_SERVICE_URL}/api/v1/admin/products/${id}/unban`, null, {
            headers,
            timeout: 5000
        });
        
        res.status(200).json(response.data);
    } catch (error) {
        console.error('Lỗi mở khóa product:', error.response?.data || error.message);
        const statusCode = error.response?.status || 500;
        const message = error.response?.data?.message || 'Lỗi khi mở khóa sản phẩm';
        res.status(statusCode).json({ message });
    }
});

// API Proxy: Thống kê sản phẩm
router.get('/api/v1/admin/products/statistics', requireAuth, requireAdmin, async (req, res) => {
    try {
        const headers = { Authorization: `Bearer ${req.accessToken}` };
        
        const response = await axios.get(`${ADMIN_SERVICE_URL}/api/v1/admin/products/statistics`, {
            headers,
            timeout: 5000
        });
        
        res.status(200).json(response.data);
    } catch (error) {
        console.error('Lỗi lấy thống kê products:', error.response?.data || error.message);
        const statusCode = error.response?.status || 500;
        const message = error.response?.data?.message || 'Lỗi khi lấy thống kê sản phẩm';
        res.status(statusCode).json({ message });
    }
});

// API Proxy: Duyệt sản phẩm (approve)
router.put('/api/v1/admin/products/:id/approve', requireAuth, requireAdmin, async (req, res) => {
    try {
        const { id } = req.params;
        const headers = { Authorization: `Bearer ${req.accessToken}` };
        
        console.log('Approving product:', id);
        
        const response = await axios.put(`${ADMIN_SERVICE_URL}/api/v1/admin/products/${id}/approve`, null, {
            headers,
            timeout: 5000
        });
        
        res.status(200).json(response.data);
    } catch (error) {
        console.error('Lỗi duyệt product:', error.response?.data || error.message);
        const statusCode = error.response?.status || 500;
        const message = error.response?.data?.message || 'Lỗi khi duyệt sản phẩm';
        res.status(statusCode).json({ message });
    }
});

// API Proxy: Từ chối sản phẩm (reject)
router.put('/api/v1/admin/products/:id/reject', requireAuth, requireAdmin, async (req, res) => {
    try {
        const { id } = req.params;
        const headers = { 
            Authorization: `Bearer ${req.accessToken}`,
            'Content-Type': 'application/json'
        };
        
        console.log('Rejecting product:', id, req.body);
        
        const response = await axios.put(`${ADMIN_SERVICE_URL}/api/v1/admin/products/${id}/reject`, req.body, {
            headers,
            timeout: 5000
        });
        
        res.status(200).json(response.data);
    } catch (error) {
        console.error('Lỗi từ chối product:', error.response?.data || error.message);
        const statusCode = error.response?.status || 500;
        const message = error.response?.data?.message || 'Lỗi khi từ chối sản phẩm';
        res.status(statusCode).json({ message });
    }
});

// =========================================================
// 2.5 ROUTE: XÉT DUYỆT SẢN PHẨM (Approvals - Pending Products)
// =========================================================

// Trang xét duyệt sản phẩm PENDING
router.get('/admin/approvals', requireAuth, requireAdmin, async (req, res) => {
    try {
        const { keyword = '', page = 0, size = 10 } = req.query;
        const headers = { Authorization: `Bearer ${req.accessToken}` };

        console.log('Calling Admin Service for PENDING products');

        const params = {
            page,
            size,
            status: 'PENDING' // Chỉ lấy sản phẩm PENDING
        };
        if (keyword) params.keyword = keyword;

        const response = await axios.get(`${ADMIN_SERVICE_URL}/api/v1/admin/products`, {
            params,
            headers,
            timeout: 5000
        });

        const payload = response.data || {};
        const products = payload.content || [];
        const pagination = {
            page: payload.number ?? Number(page) ?? 0,
            size: payload.size ?? Number(size) ?? 10,
            totalPages: payload.totalPages ?? 1,
            totalElements: payload.totalElements ?? products.length
        };
        console.log('Pending products received:', products.length, 'items');

        res.render('admin-approvals', {
            products: products,
            pagination,
            keyword,
            user: req.user
        });
    } catch (e) {
        console.error('Lỗi gọi Pending Products API:', e.message);
        res.render('admin-approvals', {
            products: [],
            pagination: { page: 0, size: 10, totalPages: 1, totalElements: 0 },
            keyword: '',
            user: req.user
        });
    }
});

// =========================================================
// 3. ROUTE: QUẢN LÝ ĐƠN HÀNG (Orders)
// =========================================================

// Trang quản lý đơn hàng
router.get('/admin/orders', requireAuth, requireAdmin, async (req, res) => {
    try {
        const { status = '' } = req.query;
        const headers = { Authorization: `Bearer ${req.accessToken}` };
        
        console.log('Calling Admin Service for orders at:', ADMIN_SERVICE_URL);
        
        let orders = [];
        
        if (status) {
            // Lấy đơn hàng theo trạng thái
            const response = await axios.get(`${ADMIN_SERVICE_URL}/api/v1/admin/orders/status/${status}`, { 
                headers,
                timeout: 5000
            });
            orders = response.data || [];
        } else {
            // Lấy tất cả đơn hàng
            const response = await axios.get(`${ADMIN_SERVICE_URL}/api/v1/admin/orders`, { 
                headers,
                timeout: 5000
            });
            orders = response.data || [];
        }
        
        console.log('Orders received:', orders.length, 'items');

        res.render('admin-orders', {
            orders: orders,
            status,
            user: req.user
        });
    } catch (e) {
        console.error('Lỗi gọi Orders API:', e.message);
        res.render('admin-orders', {
            orders: [],
            status: '',
            user: req.user
        });
    }
});

// API Proxy: Lấy tất cả đơn hàng
router.get('/api/v1/admin/orders', requireAuth, requireAdmin, async (req, res) => {
    try {
        const headers = { Authorization: `Bearer ${req.accessToken}` };
        
        const response = await axios.get(`${ADMIN_SERVICE_URL}/api/v1/admin/orders`, {
            headers,
            timeout: 5000
        });
        
        res.status(200).json(response.data);
    } catch (error) {
        console.error('Lỗi lấy danh sách orders:', error.response?.data || error.message);
        const statusCode = error.response?.status || 500;
        const message = error.response?.data?.message || 'Lỗi khi lấy danh sách đơn hàng';
        res.status(statusCode).json({ message });
    }
});

// API Proxy: Lấy chi tiết đơn hàng
router.get('/api/v1/admin/orders/:id', requireAuth, requireAdmin, async (req, res) => {
    try {
        const { id } = req.params;
        const headers = { Authorization: `Bearer ${req.accessToken}` };
        
        const response = await axios.get(`${ADMIN_SERVICE_URL}/api/v1/admin/orders/${id}`, {
            headers,
            timeout: 5000
        });
        
        res.status(200).json(response.data);
    } catch (error) {
        console.error('Lỗi lấy chi tiết order:', error.response?.data || error.message);
        const statusCode = error.response?.status || 500;
        const message = error.response?.data?.message || 'Lỗi khi lấy chi tiết đơn hàng';
        res.status(statusCode).json({ message });
    }
});

// API Proxy: Lấy đơn hàng theo trạng thái
router.get('/api/v1/admin/orders/status/:status', requireAuth, requireAdmin, async (req, res) => {
    try {
        const { status } = req.params;
        const headers = { Authorization: `Bearer ${req.accessToken}` };
        
        const response = await axios.get(`${ADMIN_SERVICE_URL}/api/v1/admin/orders/status/${status}`, {
            headers,
            timeout: 5000
        });
        
        res.status(200).json(response.data);
    } catch (error) {
        console.error('Lỗi lấy orders theo status:', error.response?.data || error.message);
        const statusCode = error.response?.status || 500;
        const message = error.response?.data?.message || 'Lỗi khi lấy đơn hàng theo trạng thái';
        res.status(statusCode).json({ message });
    }
});

// API Proxy: Lấy đơn hàng theo Farm
router.get('/api/v1/admin/orders/by-farm/:farmId', requireAuth, requireAdmin, async (req, res) => {
    try {
        const { farmId } = req.params;
        const headers = { Authorization: `Bearer ${req.accessToken}` };
        
        const response = await axios.get(`${ADMIN_SERVICE_URL}/api/v1/admin/orders/by-farm/${farmId}`, {
            headers,
            timeout: 5000
        });
        
        res.status(200).json(response.data);
    } catch (error) {
        console.error('Lỗi lấy orders theo farm:', error.response?.data || error.message);
        const statusCode = error.response?.status || 500;
        const message = error.response?.data?.message || 'Lỗi khi lấy đơn hàng theo farm';
        res.status(statusCode).json({ message });
    }
});

// API Proxy: Thống kê đơn hàng
router.get('/api/v1/admin/orders/statistics', requireAuth, requireAdmin, async (req, res) => {
    try {
        const headers = { Authorization: `Bearer ${req.accessToken}` };
        
        const response = await axios.get(`${ADMIN_SERVICE_URL}/api/v1/admin/orders/statistics`, {
            headers,
            timeout: 5000
        });
        
        res.status(200).json(response.data);
    } catch (error) {
        console.error('Lỗi lấy thống kê orders:', error.response?.data || error.message);
        const statusCode = error.response?.status || 500;
        const message = error.response?.data?.message || 'Lỗi khi lấy thống kê đơn hàng';
        res.status(statusCode).json({ message });
    }
});

// API Proxy: Đếm tổng đơn hàng
router.get('/api/v1/admin/orders/count', requireAuth, requireAdmin, async (req, res) => {
    try {
        const headers = { Authorization: `Bearer ${req.accessToken}` };
        
        const response = await axios.get(`${ADMIN_SERVICE_URL}/api/v1/admin/orders/count`, {
            headers,
            timeout: 5000
        });
        
        res.status(200).json(response.data);
    } catch (error) {
        console.error('Lỗi đếm orders:', error.response?.data || error.message);
        const statusCode = error.response?.status || 500;
        const message = error.response?.data?.message || 'Lỗi khi đếm đơn hàng';
        res.status(statusCode).json({ message });
    }
});

module.exports = router;
