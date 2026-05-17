const axios = require('axios');

// URL gốc của API Java
// Sử dụng tên service trong Docker network, hoặc localhost nếu chạy local
const BASE_API_URL = process.env.FARM_API_URL || 'http://farm-production-service:8081/api/farm-features';

// Thêm URL cho Auth service để fetch profile (tương tự profile.js)
const AUTH_SERVICE_URL_UPDATE = process.env.AUTH_SERVICE_URL_UPDATE || 'http://default-url/api/update';

// 1. Hiển thị trang thông tin (Read)
exports.getFarmInfoPage = async (req, res) => {
    try {
        // Lấy UserID từ token (đã được thêm vào JWT)
        // Ưu tiên userId từ token, fallback về sub nếu chưa update token
        const ownerId = req.user.userId || req.user.id || req.user.sub; 

        console.log(`Debug User Token:`, req.user);
        console.log(`Owner ID used for API call: ${ownerId}`); 
        
        // GỌI API: Tìm farm theo Owner ID
        const token = req.cookies.farm_token || req.cookies.auth_token;
        const response = await axios.get(`${BASE_API_URL}/owner/${ownerId}`, {   
            headers: { 'Authorization': `Bearer ${token}` }
        });
        
        const farmData = response.data;
        console.log(`✓ Lấy thông tin farm thành công:`, farmData.farmName);

        // Render trang và truyền dữ liệu farm, luôn pass error (null nếu không có)
        // Hợp nhất dữ liệu user với các fallback để khớp với EJS (user.username)
        res.render('farm-info', { 
            farm: farmData, 
            user: {
                username: req.user?.sub || req.user?.username || req.user?.id || 'Unknown',
                email: req.user?.email || 'Unknown',
                roles: req.user?.roles || [],
                ...req.user  // Spread req.user để giữ các field khác nếu cần
            },
            error: null,
            showCreateButton: false // Đã có farm rồi
        });
    } catch (error) {
        console.error('✗ Lỗi lấy thông tin farm:', error.message);
        if (error.response) {
            console.error('API Error Status:', error.response.status);
            console.error('API Error Data:', error.response.data);
        }
        
        // Nếu chưa có farm (404 hoặc lỗi khác), hiển thị nút tạo farm
        res.render('farm-info', { 
            farm: null, 
            user: req.user,
            error: null, // Không hiển thị error, chỉ hiển thị nút tạo
            showCreateButton: true // Hiển thị nút tạo farm
        });
    }
};

// 2. Hiển thị trang chỉnh sửa
exports.getEditFarmPage = async (req, res) => {
    try {
        const ownerId = req.user.userId || req.user.id || req.user.sub;
        console.log(`Đang lấy dữ liệu edit cho Owner ID: ${ownerId}`);
        
        // Tái sử dụng API tìm theo Owner để lấy dữ liệu điền vào form
        const token = req.cookies.farm_token || req.cookies.auth_token;
        const farmResponse = await axios.get(`${BASE_API_URL}/owner/${ownerId}`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        
        // Fetch profile data để lấy avatar (tương tự profile.js)
        let profileData = {};
        try {
            const token = req.cookies.farm_token || req.cookies.auth_token;
            console.log('Fetching profile with token:', token?.substring(0, 20) + '...'); // Partial log
            const profileResp = await axios.get(`${AUTH_SERVICE_URL_UPDATE}/profile`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            profileData = profileResp.data;
            console.log('Fetched profile data for edit: ', profileData);
            
            // Xử lý avatar thành data URL
            const avatarSource = profileData.avatarBase64 || profileData.avatarBytes;
            if (avatarSource) {
                profileData.avatar = `data:image/png;base64,${avatarSource}`;
            }
        } catch (profileErr) {
            console.error('Error fetching profile for edit:', profileErr.message);
        }
        
        res.render('farm-info-edit', {
            farm: farmResponse.data, // Dữ liệu này sẽ chứa farm.id
            user: {
                username: req.user?.sub || req.user?.username || req.user?.id || 'Unknown',
                email: req.user?.email || 'Unknown',
                roles: req.user?.roles || [],
                avatar: profileData.avatar || '/assets/img/bruce-mars.jpg',  // Thêm avatar fallback
                ...req.user,  // Spread req.user
                ...profileData  // Merge profile data
            },
            pageTitle: 'Chỉnh sửa thông tin',
            error: null
        });
    } catch (error) {
        console.error('Lỗi lấy dữ liệu edit:', error.message);
        res.render('farm-info-edit', {
            farm: null,
            user: {
                username: req.user?.sub || req.user?.username || req.user?.id || 'Unknown',
                email: req.user?.email || 'Unknown',
                roles: req.user?.roles || [],
                avatar: '/assets/img/bruce-mars.jpg',  // Fallback nếu lỗi
                ...req.user
            },
            error: 'Không thể tải dữ liệu trang trại'
        });
    }
};

// 3. Tạo trang trại mới (Create)
exports.createFarm = async (req, res) => {
    try {
        const ownerId = req.user.userId || req.user.id || req.user.sub;
        console.log(`Tạo farm mới cho Owner ID: ${ownerId}`);

        // Chuẩn bị dữ liệu tạo farm
        const farmData = {
            farmName: req.body.farmName,
            address: req.body.address,
            email: req.body.email || req.user.email,
            hotline: req.body.phone,
            areaSize: req.body.area ? parseFloat(req.body.area) : null,
            description: req.body.description
        };

        // Gọi API tạo farm
        const createResponse = await axios.post(`${BASE_API_URL}/`, farmData, {
            headers: { 'Authorization': `Bearer ${(req.cookies.farm_token || req.cookies.auth_token)}` }
        });

        console.log('✓ Tạo farm thành công:', createResponse.data);
        
        // Sau khi tạo, cập nhật ownerId (nếu API không tự động set)
        if (createResponse.data && !createResponse.data.ownerId) {
            const updateData = { ownerId: ownerId };
            await axios.put(`${BASE_API_URL}/${createResponse.data.id}/info`, updateData, {
                headers: { 'Authorization': `Bearer ${(req.cookies.farm_token || req.cookies.auth_token)}` }
            });
        }

        res.redirect('/farm-info');
    } catch (error) {
        console.error('Lỗi tạo farm:', error.message);
        console.error('Error response:', error.response?.data);
        res.status(500).render('farm-info', {
            farm: null,
            user: req.user,
            error: 'Lỗi tạo trang trại: ' + (error.response?.data?.message || error.message),
            showCreateButton: true
        });
    }
};

// 4. Xử lý cập nhật (Update)
exports.updateFarmInfo = async (req, res) => {
    try {
        // Bước 1: Lấy lại thông tin Farm để biết FarmID (an toàn nhất)
        const ownerId = req.user.userId || req.user.id || req.user.sub;
        const farmResponse = await axios.get(`${BASE_API_URL}/owner/${ownerId}`, {
            headers: { 'Authorization': `Bearer ${(req.cookies.farm_token || req.cookies.auth_token)}` }
        });
        const farmId = farmResponse.data.id; // Lấy ID thật từ database

        console.log(`Cập nhật farm ID ${farmId} cho owner ${ownerId}`);

        // Bước 2: Chuẩn bị dữ liệu update
        const updateData = {
            farmName: req.body.farmName,
            address: req.body.address,
            email: req.body.email,
            hotline: req.body.phone, 
            areaSize: parseFloat(req.body.area), 
            description: req.body.description
        };

        // Bước 3: Gọi API PUT theo FarmID
        const updateResponse = await axios.put(`${BASE_API_URL}/${farmId}/info`, updateData, {
            headers: { 'Authorization': `Bearer ${(req.cookies.farm_token || req.cookies.auth_token)}` }
        });
        console.log('Cập nhật thành công:', updateResponse.data);
        
        // Redirect về trang xem với thông báo thành công
        res.redirect('/farm-info');
    } catch (error) {
        console.error('Lỗi cập nhật:', error.message);
        console.error('Error response:', error.response?.data);
        res.status(500).render('farm-info-edit', {
            farm: null,
            user: req.user,
            error: 'Lỗi cập nhật thông tin: ' + error.message
        });
    }
};