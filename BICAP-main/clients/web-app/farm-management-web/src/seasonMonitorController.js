const axios = require('axios');

// Get API Gateway base URL
const getApiGatewayBaseUrl = () => {
    const MARKETPLACE_API_PATH = process.env.MARKETPLACE_API_PATH || 'http://localhost:8000/api/marketplace';
    return MARKETPLACE_API_PATH.split('/api')[0] || 'http://localhost:8000';
};

const API_GATEWAY_BASE_URL = getApiGatewayBaseUrl();

// URL của API Production Batch - sử dụng Kong Gateway
const PRODUCTION_BATCH_API_URL = process.env.PRODUCTION_BATCH_API_URL || `${API_GATEWAY_BASE_URL}/api/production-batches`;
const FARMING_PROCESS_API_URL = process.env.FARMING_PROCESS_API_URL || `${API_GATEWAY_BASE_URL}/api/farming-processes`;
const EXPORT_BATCH_API_URL = process.env.EXPORT_BATCH_API_URL || `${API_GATEWAY_BASE_URL}/api/export-batches`;
const FARM_API_URL = process.env.FARM_API_URL || `${API_GATEWAY_BASE_URL}/api/farm-features`;

// Helper function để lấy Farm ID từ Owner ID
const getFarmId = async (ownerId, token) => {
    try {
        const response = await axios.get(`${FARM_API_URL}/owner/${ownerId}`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        return response.data?.id || null;
    } catch (error) {
        console.error('Error getting farm ID:', error.message);
        return null;
    }
};

// 1. Hiển thị trang Season Monitor (Danh sách mùa vụ)
exports.getSeasonMonitorPage = async (req, res) => {
    try {
        const ownerId = req.user.userId || req.user.id || req.user.sub;
        const token = req.cookies.farm_token || req.cookies.auth_token; // legacy fallback
        const farmId = await getFarmId(ownerId, token);

        if (!farmId) {
            // Set cache headers
            res.set('Cache-Control', 'no-store, no-cache, must-revalidate, private');
            res.set('Pragma', 'no-cache');
            res.set('Expires', '0');
            
            return res.render('season-monitor', {
                user: req.user,
                seasons: [],
                error: 'Không tìm thấy trang trại. Vui lòng tạo trang trại trước.',
                API_GATEWAY_BASE_URL: API_GATEWAY_BASE_URL,
                PRODUCTION_BATCH_API_URL: PRODUCTION_BATCH_API_URL,
                FARMING_PROCESS_API_URL: FARMING_PROCESS_API_URL,
                EXPORT_BATCH_API_URL: EXPORT_BATCH_API_URL
            });
        }

        // Lấy danh sách mùa vụ của trang trại
        const response = await axios.get(`${PRODUCTION_BATCH_API_URL}/farm/${farmId}`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });

        const seasons = response.data || [];
        
        // Set cache headers to prevent caching issues
        res.set('Cache-Control', 'no-store, no-cache, must-revalidate, private');
        res.set('Pragma', 'no-cache');
        res.set('Expires', '0');
        
        res.render('season-monitor', {
            user: req.user,
            seasons: seasons,
            farmId: farmId,
            error: null,
            API_GATEWAY_BASE_URL: API_GATEWAY_BASE_URL,
            PRODUCTION_BATCH_API_URL: PRODUCTION_BATCH_API_URL,
            FARMING_PROCESS_API_URL: FARMING_PROCESS_API_URL,
            EXPORT_BATCH_API_URL: EXPORT_BATCH_API_URL
        });
    } catch (error) {
        console.error('Error getting season monitor page:', error.message);
        
        // Set cache headers
        res.set('Cache-Control', 'no-store, no-cache, must-revalidate, private');
        res.set('Pragma', 'no-cache');
        res.set('Expires', '0');
        
        res.render('season-monitor', {
            user: req.user,
            seasons: [],
            error: 'Không thể tải danh sách mùa vụ: ' + error.message,
            API_GATEWAY_BASE_URL: API_GATEWAY_BASE_URL,
            PRODUCTION_BATCH_API_URL: PRODUCTION_BATCH_API_URL,
            FARMING_PROCESS_API_URL: FARMING_PROCESS_API_URL,
            EXPORT_BATCH_API_URL: EXPORT_BATCH_API_URL
        });
    }
};

// 2. Lấy chi tiết mùa vụ (API endpoint cho frontend)
exports.getSeasonDetail = async (req, res) => {
    try {
        const { id } = req.params;
        const token = req.cookies.farm_token || req.cookies.auth_token;

        if (!token) {
            return res.status(401).json({ error: 'Token không tồn tại' });
        }

        // Decode token to check roles (for debugging)
        const jwt = require('jsonwebtoken');
        try {
            const decoded = jwt.decode(token);
            console.log('🔐 [Season Detail] Token info - Username:', decoded?.sub, 'Roles:', decoded?.roles);
            console.log('🔐 [Season Detail] Token expiration:', decoded?.exp ? new Date(decoded.exp * 1000).toISOString() : 'N/A');
            if (!decoded?.roles || !decoded.roles.includes('ROLE_FARMMANAGER')) {
                console.warn('⚠️ [Season Detail] Token does not contain ROLE_FARMMANAGER!');
                console.warn('⚠️ [Season Detail] Available roles:', decoded?.roles);
            }
        } catch (e) {
            console.warn('Could not decode token:', e.message);
        }

        console.log(`🔍 [Season Detail] Getting season detail for ID: ${id}`);
        console.log('🔍 [Season Detail] API URL:', `${PRODUCTION_BATCH_API_URL}/${id}/detail`);
        console.log('🔍 [Season Detail] Token (first 50 chars):', token.substring(0, 50) + '...');
        console.log('🔍 [Season Detail] PRODUCTION_BATCH_API_URL:', PRODUCTION_BATCH_API_URL);

        // Gửi cả cookie và Authorization header để đảm bảo Kong Gateway nhận được
        const response = await axios.get(`${PRODUCTION_BATCH_API_URL}/${id}/detail`, {
            headers: { 
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json',
                'Cookie': `farm_token=${token}` // Kong now validates farm_token cookie
            },
            withCredentials: true // Đảm bảo gửi credentials
        });

        res.json(response.data);
    } catch (error) {
        console.error('❌ Error getting season detail:', error.message);
        console.error('Error type:', error.constructor.name);
        
        if (error.response) {
            console.error('Response status:', error.response.status);
            console.error('Response headers:', JSON.stringify(error.response.headers, null, 2));
            
            // Handle different response types (JSON, HTML, text, undefined, etc.)
            let responseData = error.response.data;
            
            // If responseData is undefined or null, try to get it from response
            if (responseData === undefined || responseData === null) {
                console.warn('⚠️ Response data is undefined/null');
                responseData = {};
            } else if (typeof responseData === 'string') {
                // Try to parse as JSON first
                if (responseData.trim().startsWith('{') || responseData.trim().startsWith('[')) {
                    try {
                        responseData = JSON.parse(responseData);
                    } catch (e) {
                        // If parsing fails, treat as plain text
                        console.warn('⚠️ Could not parse response as JSON, treating as text');
                        responseData = { message: responseData };
                    }
                } else {
                    // Plain text response
                    responseData = { message: responseData };
                }
            } else if (typeof responseData === 'object') {
                // Already an object, use as is
                console.log('✓ Response data is already an object');
            }
            
            console.error('📦 Response data:', JSON.stringify(responseData, null, 2));
            
            // Pass through the actual error message from the backend
            // Priority: message > error > errorMessage > default message
            let errorMessage;
            if (responseData && typeof responseData === 'object') {
                if (responseData.message) {
                    errorMessage = responseData.message;
                } else if (responseData.error) {
                    errorMessage = responseData.error;
                } else if (responseData.errorMessage) {
                    errorMessage = responseData.errorMessage;
                }
            }
            
            // If no message found, use default based on status
            if (!errorMessage) {
                if (error.response.status === 403) {
                    errorMessage = 'Access Denied: Bạn không có quyền xem chi tiết mùa vụ. Yêu cầu role: ROLE_FARMMANAGER hoặc ROLE_ADMIN. Vui lòng kiểm tra token và role của bạn.';
                } else if (error.response.status === 401) {
                    errorMessage = 'Unauthorized: Token không hợp lệ hoặc đã hết hạn. Vui lòng đăng nhập lại.';
                } else {
                    errorMessage = `Không thể lấy chi tiết mùa vụ (Status: ${error.response.status})`;
                }
            }
            
            return res.status(error.response.status).json({
                error: errorMessage,
                details: responseData || {},
                status: error.response.status,
                path: `/api/production-batches/${id}/detail`
            });
        }
        
        // Network error or other non-HTTP errors
        console.error('❌ Network or other error:', error.message);
        res.status(500).json({
            error: 'Không thể kết nối đến server: ' + error.message,
            type: 'network_error'
        });
    }
};

// 3. Tạo mùa vụ mới
exports.createSeason = async (req, res) => {
    try {
        const ownerId = req.user.userId || req.user.id || req.user.sub;
        const token = req.cookies.farm_token || req.cookies.auth_token;
        const farmId = await getFarmId(ownerId, token);

        if (!farmId) {
            return res.status(400).json({ error: 'Không tìm thấy trang trại' });
        }

        const response = await axios.post(`${PRODUCTION_BATCH_API_URL}/farm/${farmId}`, req.body, {
            headers: { 
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        });

        res.json(response.data);
    } catch (error) {
        console.error('Error creating season:', error.message);
        res.status(error.response?.status || 500).json({
            error: 'Không thể tạo mùa vụ: ' + (error.response?.data?.message || error.message)
        });
    }
};

// 4. Cập nhật tiến trình mùa vụ
exports.updateSeasonProgress = async (req, res) => {
    try {
        const { batchId } = req.params;
        const token = req.cookies.farm_token || req.cookies.auth_token;
        const ownerId = req.user.userId || req.user.id || req.user.sub;

        const response = await axios.post(`${FARMING_PROCESS_API_URL}/batch/${batchId}`, req.body, {
            headers: { 
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        });

        res.json(response.data);
    } catch (error) {
        console.error('Error updating season progress:', error.message);
        res.status(error.response?.status || 500).json({
            error: 'Không thể cập nhật tiến trình: ' + (error.response?.data?.message || error.message)
        });
    }
};

// 5. Xuất tiến trình mùa vụ (Tạo Export Batch)
exports.exportSeason = async (req, res) => {
    try {
        const { batchId } = req.params;
        const token = req.cookies.farm_token || req.cookies.auth_token;
        const ownerId = req.user.userId || req.user.id || req.user.sub;

        if (!token) {
            return res.status(401).json({ error: 'Token không tồn tại' });
        }

        const farmId = await getFarmId(ownerId, token);
        if (!farmId) {
            return res.status(400).json({ error: 'Không tìm thấy trang trại' });
        }

        console.log(`Exporting season for batch ID: ${batchId}, Farm ID: ${farmId}, Token: ${token.substring(0, 20)}...`);

        const response = await axios.post(`${EXPORT_BATCH_API_URL}/farm/${farmId}/batch/${batchId}`, req.body, {
            headers: { 
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        });

        res.json(response.data);
    } catch (error) {
        console.error('Error exporting season:', error.message);
        if (error.response) {
            console.error('Response status:', error.response.status);
            console.error('Response data:', error.response.data);
        }
        res.status(error.response?.status || 500).json({
            error: 'Không thể xuất tiến trình: ' + (error.response?.data?.message || error.message)
        });
    }
};

// 6. Lấy danh sách các lô đã xuất hàng của trang trại (cho trang sản phẩm)
exports.getExportBatchesForFarm = async (req, res) => {
    try {
        const ownerId = req.user.userId || req.user.id || req.user.sub;
        const token = req.cookies.farm_token || req.cookies.auth_token;
        const farmId = await getFarmId(ownerId, token);

        if (!farmId) {
            return res.status(404).json({ error: 'Không tìm thấy trang trại' });
        }

        const response = await axios.get(`${EXPORT_BATCH_API_URL}/farm/${farmId}`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });

        res.json(response.data || []);
    } catch (error) {
        console.error('Error getting export batches for farm:', error.message);
        if (error.response) {
            console.error('Response status:', error.response.status);
            console.error('Response data:', error.response.data);
        }
        res.status(error.response?.status || 500).json({
            error: 'Không thể tải lịch sử xuất hàng: ' + (error.response?.data?.message || error.message)
        });
    }
};
