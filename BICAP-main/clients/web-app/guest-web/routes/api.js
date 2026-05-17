const express = require('express');
const router = express.Router();

// API Gateway URLs
const AUTH_SERVICE_URL = process.env.AUTH_SERVICE_URL || 'http://localhost:8080';

// Middleware kiểm tra auth cho API
const requireApiAuth = (req, res, next) => {
    if (!req.session.user) {
        return res.status(401).json({ error: 'Unauthorized', message: 'Vui lòng đăng nhập' });
    }
    next();
};

// ========================
// USER PROFILE API
// ========================

// Cập nhật thông tin profile
router.put('/user/profile', requireApiAuth, async (req, res) => {
    try {
        const { address } = req.body;
        
        // Gọi API backend để cập nhật
        try {
            const response = await fetch(`${AUTH_SERVICE_URL}/api/v1/users/${req.session.user.id}/profile`, {
                method: 'PUT',
                headers: { 
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${req.session.token}`
                },
                body: JSON.stringify({ address })
            });

            if (response.ok) {
                // Cập nhật session
                req.session.user.address = address;
                return res.json({ success: true, message: 'Cập nhật thành công' });
            }
        } catch (err) {
            // Fallback: Cập nhật local session khi không có backend
            console.log('Backend unavailable, updating session only');
        }

        // Cập nhật session (demo mode)
        req.session.user.address = address;
        res.json({ success: true, message: 'Cập nhật thành công (local)' });

    } catch (error) {
        console.error('Update profile error:', error);
        res.status(500).json({ error: 'Server error', message: 'Lỗi cập nhật thông tin' });
    }
});

// ========================
// ROLE REQUEST API
// ========================

// Gửi yêu cầu cấp role
router.post('/v1/role-requests/submit', requireApiAuth, async (req, res) => {
    try {
        const { requestedRole, documentUrls } = req.body;

        // Validate
        const validRoles = ['FARM_OWNER', 'SHIPPER', 'RETAILER'];
        if (!validRoles.includes(requestedRole)) {
            return res.status(400).json({ error: 'Invalid role', message: 'Role không hợp lệ' });
        }

        if (!documentUrls) {
            return res.status(400).json({ error: 'Missing document', message: 'Vui lòng tải lên giấy tờ xác thực' });
        }

        // Gọi API backend
        try {
            const response = await fetch(`${AUTH_SERVICE_URL}/api/v1/role-requests`, {
                method: 'POST',
                headers: { 
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${req.session.token}`
                },
                body: JSON.stringify({
                    userId: req.session.user.id,
                    requestedRole,
                    documentUrls
                })
            });

            if (response.ok) {
                req.session.user.requestStatus = 'PENDING';
                req.session.user.requestedRole = requestedRole;
                return res.json({ success: true, message: 'Đã gửi yêu cầu thành công' });
            } else {
                const errorData = await response.json().catch(() => ({}));
                return res.status(response.status).json({ 
                    error: 'Request failed', 
                    message: errorData.message || 'Gửi yêu cầu thất bại' 
                });
            }
        } catch (err) {
            // Fallback: Demo mode
            console.log('Backend unavailable, saving to session only');
        }

        // Demo mode: Cập nhật session
        req.session.user.requestStatus = 'PENDING';
        req.session.user.requestedRole = requestedRole;
        
        res.json({ 
            success: true, 
            message: 'Đã gửi yêu cầu thành công (demo mode). Vui lòng chờ Admin duyệt.' 
        });

    } catch (error) {
        console.error('Role request error:', error);
        res.status(500).json({ error: 'Server error', message: 'Lỗi gửi yêu cầu' });
    }
});

// Lấy trạng thái yêu cầu role
router.get('/v1/role-requests/status', requireApiAuth, async (req, res) => {
    try {
        // Gọi API backend
        try {
            const response = await fetch(`${AUTH_SERVICE_URL}/api/v1/role-requests/user/${req.session.user.id}`, {
                headers: { 'Authorization': `Bearer ${req.session.token}` }
            });

            if (response.ok) {
                const data = await response.json();
                return res.json(data);
            }
        } catch (err) {
            console.log('Backend unavailable');
        }

        // Fallback: Trả về từ session
        res.json({
            requestStatus: req.session.user.requestStatus,
            requestedRole: req.session.user.requestedRole,
            rejectReason: req.session.user.rejectReason
        });

    } catch (error) {
        console.error('Get status error:', error);
        res.status(500).json({ error: 'Server error' });
    }
});

// ========================
// SEARCH API (Public)
// ========================

router.get('/products/search', async (req, res) => {
    const { q, category, sort, organic } = req.query;
    
    // Placeholder - sẽ gọi trading-order-service
    res.json({
        products: [],
        total: 0,
        message: 'API đang được phát triển'
    });
});

// ========================
// TRACEABILITY API (Public)
// ========================

router.get('/trace/:batchId', async (req, res) => {
    const { batchId } = req.params;
    
    // Placeholder - sẽ gọi blockchain-adapter-service
    res.json({
        batchId,
        history: [],
        message: 'API đang được phát triển'
    });
});

module.exports = router;
