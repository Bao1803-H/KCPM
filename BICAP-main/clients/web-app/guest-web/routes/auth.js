const express = require('express');
const router = express.Router();

// API Gateway URL - QUAN TRỌNG: phải trỏ đến Kong
const AUTH_SERVICE_URL = process.env.AUTH_SERVICE_URL || 'http://kong-gateway:8000';

// Xử lý đăng nhập
router.post('/login', async (req, res) => {
    const { email, password, redirect } = req.body;

    try {
        // ✅ LOG ĐỂ DEBUG
        const loginUrl = `${AUTH_SERVICE_URL}/login`;
        console.log(`[LOGIN] Attempting login for: ${email}`);
        console.log(`[LOGIN] Calling URL: ${loginUrl}`);
        console.log(`[LOGIN] Request body:`, { email, password: '***' });

        const response = await fetch(loginUrl, {
            method: 'POST',
            headers: { 
                'Content-Type': 'application/json',
                'Accept': 'application/json'
            },
            body: JSON.stringify({ email, password })
        });

        console.log(`[LOGIN] Response status: ${response.status}`);
        console.log(`[LOGIN] Response headers:`, Object.fromEntries(response.headers.entries()));

        // ✅ ĐỌC RESPONSE AN TOÀN - XỬ LÝ CẢ JSON VÀ PLAIN TEXT
        let data;
        let responseText;
        let isJsonResponse = false;
        
        try {
            responseText = await response.text();
            console.log(`[LOGIN] Response body:`, responseText);
            
            if (!responseText || responseText.trim() === '') {
                throw new Error('Empty response from server');
            }

            // ✅ Kiểm tra xem response có phải JSON không
            const contentType = response.headers.get('content-type');
            isJsonResponse = contentType && contentType.includes('application/json');

            // ✅ Thử parse JSON, nếu lỗi thì coi như plain text
            try {
                data = JSON.parse(responseText);
                console.log(`[LOGIN] Parsed JSON:`, data);
            } catch (jsonError) {
                // Nếu không parse được JSON, coi như plain text
                console.log(`[LOGIN] Response is plain text, not JSON`);
                data = { message: responseText.replace(/^"|"$/g, '') }; // Loại bỏ dấu quotes nếu có
            }
        } catch (readError) {
            console.error('[LOGIN] Error reading response:', readError);
            throw new Error('Cannot read server response');
        }

        if (response.ok) {
            // ✅ VALIDATE DỮ LIỆU TRƯỚC KHI LƯU
            if (!data.token && !data.accessToken) {
                console.error('[LOGIN] Missing token in response:', data);
                throw new Error('Server không trả về token');
            }

            // ✅ Lưu thông tin user vào session
            req.session.user = {
                id: data.userId || data.user?.id,
                username: data.username || data.user?.username,
                email: data.email || data.user?.email,
                role: data.role || data.user?.role || 'GUEST',
                avatar: data.avatar || data.user?.avatar,
                address: data.address || data.user?.address,
                requestStatus: data.requestStatus || null,
                requestedRole: data.requestedRole || null,
                rejectReason: data.rejectReason || null
            };
            req.session.token = data.token || data.accessToken;

            console.log('[LOGIN] Login successful for:', email);
            console.log('[LOGIN] User session:', req.session.user);
            
            return res.redirect(redirect || '/');
        } else {
            // ✅ XỬ LÝ LỖI - HỖ TRỢ CẢ JSON VÀ PLAIN TEXT
            console.error('[LOGIN] Login failed with status:', response.status);
            console.error('[LOGIN] Error data:', data);
            
            // Lấy error message từ nhiều nguồn khác nhau
            let errorMessage = 'Email hoặc mật khẩu không đúng';
            
            if (typeof data === 'string') {
                errorMessage = data;
            } else if (data.message) {
                errorMessage = data.message;
            } else if (data.error) {
                errorMessage = data.error;
            }
            
            return res.render('auth/login', {
                title: 'Đăng nhập - BiCap',
                user: null,
                error: errorMessage,
                redirect: redirect || '/'
            });
        }
    } catch (error) {
        console.error('[LOGIN] Exception occurred:', error);
        console.error('[LOGIN] Error stack:', error.stack);
        
        // Demo mode fallback
        if (email === 'demo@bicap.vn' && password === 'demo123') {
            console.log('[LOGIN] Using demo mode');
            req.session.user = {
                id: 1,
                username: 'Demo User',
                email: 'demo@bicap.vn',
                role: 'GUEST',
                avatar: null,
                address: 'Hà Nội, Việt Nam',
                requestStatus: null,
                requestedRole: null,
                rejectReason: null
            };
            return res.redirect(redirect || '/');
        }

        return res.render('auth/login', {
            title: 'Đăng nhập - BiCap',
            user: null,
            error: `Lỗi: ${error.message}. Thử tài khoản demo: demo@bicap.vn / demo123`,
            redirect: redirect || '/'
        });
    }
});

// Xử lý đăng ký
router.post('/register', async (req, res) => {
    const { username, email, password, confirmPassword, role } = req.body;

    // Validation
    if (password !== confirmPassword) {
        return res.render('auth/register', {
            title: 'Đăng ký - BiCap',
            user: null,
            error: 'Mật khẩu xác nhận không khớp'
        });
    }

    if (password.length < 6) {
        return res.render('auth/register', {
            title: 'Đăng ký - BiCap',
            user: null,
            error: 'Mật khẩu phải có ít nhất 6 ký tự'
        });
    }

    try {
        const registerUrl = `${AUTH_SERVICE_URL}/register`;
        console.log(`[REGISTER] Calling URL: ${registerUrl}`);
        console.log(`[REGISTER] Data:`, { username, email, password: '***', role: 'USER' });

        const response = await fetch(registerUrl, {
            method: 'POST',
            headers: { 
                'Content-Type': 'application/json',
                'Accept': 'application/json'
            },
            body: JSON.stringify({ username, email, password, role: 'USER' })
        });

        console.log(`[REGISTER] Response status: ${response.status}`);
        
        // ✅ Xử lý response an toàn (giống như login)
        let responseText = await response.text();
        console.log(`[REGISTER] Response:`, responseText);

        if (response.ok) {
            return res.redirect('/login?success=1');
        } else {
            let errorData;
            let errorMessage = 'Đăng ký thất bại. Email có thể đã tồn tại.';
            
            // Thử parse JSON
            try {
                errorData = JSON.parse(responseText);
                errorMessage = errorData.message || errorData.error || errorMessage;
            } catch {
                // Nếu không phải JSON, dùng plain text
                errorMessage = responseText.replace(/^"|"$/g, '') || errorMessage;
            }
            
            return res.render('auth/register', {
                title: 'Đăng ký - BiCap',
                user: null,
                error: errorMessage
            });
        }
    } catch (error) {
        console.error('[REGISTER] Error:', error);
        return res.render('auth/register', {
            title: 'Đăng ký - BiCap',
            user: null,
            error: `Không thể kết nối: ${error.message}`
        });
    }
});

// Các route khác giữ nguyên
router.get('/login', (req, res) => {
    if (req.session.user) {
        return res.redirect('/profile');
    }
    res.render('auth/login', {
        title: 'Đăng nhập - BiCap',
        user: null,
        error: req.query.error || null,
        redirect: req.query.redirect || '/'
    });
});

router.get('/register', (req, res) => {
    if (req.session.user) {
        return res.redirect('/profile');
    }
    res.render('auth/register', {
        title: 'Đăng ký - BiCap',
        user: null,
        error: null
    });
});

router.get('/logout', (req, res) => {
    req.session.destroy((err) => {
        if (err) console.error('Logout error:', err);
        res.redirect('/');
    });
});

module.exports = router;