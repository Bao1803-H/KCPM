// app/config/env.ts
// ==============================================
// CẤU HÌNH MÔI TRƯỜNG CHO APP
// ==============================================

/**
 * HƯỚNG DẪN CẤU HÌNH:
 * 
 * 1. Khi chạy trên Android Emulator:
 *    - Sử dụng IP: 10.0.2.2 (maps tới localhost của máy host)
 * 
 * 2. Khi chạy trên iOS Simulator:
 *    - Sử dụng: localhost hoặc 127.0.0.1
 * 
 * 3. Khi chạy trên thiết bị thật (cùng mạng WiFi):
 *    - Lấy IP LAN của máy tính đang chạy backend:
 *      + Windows: ipconfig -> IPv4 Address
 *      + Mac/Linux: ifconfig -> inet
 *    - Thay đổi LAN_IP bên dưới thành IP đó
 * 
 * 4. Khi deploy production:
 *    - Đổi IS_PRODUCTION = true
 *    - Cập nhật PRODUCTION_URL thành domain thực
 */

export const ENV_CONFIG = {
    // ========== DEVELOPMENT ==========
    // IP LAN của máy tính chạy backend (dùng cho thiết bị thật)
    // ⚠️ THAY ĐỔI IP NÀY KHI CHẠY TRÊN THIẾT BỊ THẬT
    LAN_IP: '192.168.1.4',
    
    // Port của Kong API Gateway
    KONG_PORT: 8000,
    
    // Port của các service (để debug trực tiếp nếu cần)
    AUTH_SERVICE_PORT: 8080,
    SHIPPING_SERVICE_PORT: 8083,
    
    // ========== PRODUCTION ==========
    IS_PRODUCTION: false,
    PRODUCTION_URL: 'https://api.bicap.com',
    
    // ========== TIMEOUTS ==========
    API_TIMEOUT: 15000, // 15 giây
    UPLOAD_TIMEOUT: 60000, // 60 giây cho upload file
    
    // ========== FEATURE FLAGS ==========
    ENABLE_MOCK_DATA: __DEV__, // Cho phép dùng mock data khi development
    ENABLE_DEBUG_LOG: __DEV__, // Log debug trong development
};

/**
 * Lấy URL API dựa trên platform và environment
 */
export const getApiUrl = (): string => {
    if (ENV_CONFIG.IS_PRODUCTION) {
        return ENV_CONFIG.PRODUCTION_URL;
    }
    
    return `http://${ENV_CONFIG.LAN_IP}:${ENV_CONFIG.KONG_PORT}`;
};

/**
 * Log helper - chỉ log khi development
 */
export const debugLog = (tag: string, ...args: any[]): void => {
    if (ENV_CONFIG.ENABLE_DEBUG_LOG) {
        console.log(`[${tag}]`, ...args);
    }
};

export default ENV_CONFIG;
