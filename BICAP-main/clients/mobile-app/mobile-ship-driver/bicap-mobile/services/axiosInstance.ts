// app/services/axiosInstance.ts
import axios, { AxiosError, AxiosInstance, InternalAxiosRequestConfig } from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';

// ==============================================
// CONFIG CHO KONG API GATEWAY
// ==============================================
// Android Emulator: 10.0.2.2 (maps to localhost của máy host)
// iOS Simulator: localhost hoặc 127.0.0.1
// Máy thật (cùng mạng LAN): Sử dụng IP LAN của máy tính (VD: 192.168.1.4)
// Production: domain thực của API gateway

const getBaseUrl = (): string => {
    // Nếu chạy trên production, thay đổi URL tại đây
    const IS_PRODUCTION = false;
    
    if (IS_PRODUCTION) {
        return 'https://api.bicap.com'; // URL production
    }
    
    // Development: Chọn URL phù hợp
    if (__DEV__) {
        // Thay IP LAN của máy tính nếu chạy trên thiết bị thật
        // Kiểm tra Platform để chọn URL phù hợp
        if (Platform.OS === 'android') {
            // Android Emulator sử dụng 10.0.2.2 để truy cập localhost của máy host
            // Nếu chạy máy thật, dùng IP LAN
            return 'http://10.0.2.2:8000'; 
        }
        // iOS Simulator có thể dùng localhost
        return 'http://localhost:8000';
    }
    
    // Fallback
    return 'http://192.168.1.4:8000';
};

// URL của Kong API Gateway (Port 8000 mặc định)
export const API_CONFIG = {
    BASE_URL: getBaseUrl(),
    TIMEOUT: 15000, // 15 giây
    // Cập nhật IP này khi chạy trên thiết bị thật
    LAN_IP: '192.168.1.4', 
};

// Cho phép override URL khi chạy trên thiết bị thật
export const setCustomBaseUrl = (url: string): void => {
    axiosInstance.defaults.baseURL = url;
};

// Tạo axios instance
const axiosInstance: AxiosInstance = axios.create({
    baseURL: API_CONFIG.BASE_URL,
    timeout: API_CONFIG.TIMEOUT,
    headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
    },
});

// ==============================================
// REQUEST INTERCEPTOR
// ==============================================
// Tự động gắn Token vào mỗi request
axiosInstance.interceptors.request.use(
    async (config: InternalAxiosRequestConfig) => {
        try {
            const token = await AsyncStorage.getItem('userToken');
            if (token && config.headers) {
                // Kong và backend service sẽ verify token này
                config.headers.Authorization = `Bearer ${token}`;
            }
            
            // Debug log trong development
            if (__DEV__) {
                console.log(`[API Request] ${config.method?.toUpperCase()} ${config.baseURL}${config.url}`);
            }
        } catch (error) {
            console.error('[API] Error getting token from storage:', error);
        }
        return config;
    },
    (error: AxiosError) => {
        console.error('[API] Request interceptor error:', error);
        return Promise.reject(error);
    }
);

// ==============================================
// RESPONSE INTERCEPTOR
// ==============================================
// Xử lý response và errors
axiosInstance.interceptors.response.use(
    (response) => {
        // Debug log trong development
        if (__DEV__) {
            console.log(`[API Response] ${response.status} - ${response.config.url}`);
        }
        return response;
    },
    async (error: AxiosError) => {
        const status = error.response?.status;
        const requestUrl = error.config?.url;
        
        // Log lỗi chi tiết trong development
        if (__DEV__) {
            console.error(`[API Error] ${status} - ${requestUrl}`, {
                message: error.message,
                data: error.response?.data,
            });
        }

        // Xử lý các mã lỗi phổ biến
        switch (status) {
            case 401:
                // Token hết hạn hoặc không hợp lệ
                console.warn('[API] Unauthorized - Token có thể đã hết hạn');
                // Xóa token cũ
                await AsyncStorage.removeItem('userToken');
                await AsyncStorage.removeItem('userData');
                // Có thể emit event để navigate về login screen
                // eventEmitter.emit('AUTH_ERROR');
                break;
                
            case 403:
                console.warn('[API] Forbidden - Không có quyền truy cập');
                break;
                
            case 404:
                console.warn('[API] Not Found - Endpoint không tồn tại:', requestUrl);
                break;
                
            case 429:
                // Rate limiting từ Kong
                console.warn('[API] Too Many Requests - Bị giới hạn bởi Kong');
                break;
                
            case 500:
            case 502:
            case 503:
                console.error('[API] Server Error - Lỗi từ backend service');
                break;
                
            default:
                if (error.code === 'ECONNABORTED') {
                    console.error('[API] Timeout - Request quá thời gian chờ');
                } else if (!error.response) {
                    console.error('[API] Network Error - Không thể kết nối đến server');
                }
        }

        return Promise.reject(error);
    }
);

// ==============================================
// HELPER FUNCTIONS
// ==============================================
// Kiểm tra kết nối đến Kong
export const checkConnection = async (): Promise<boolean> => {
    try {
        // Kong health check endpoint
        await axiosInstance.get('/api/auth/health', { timeout: 5000 });
        return true;
    } catch {
        return false;
    }
};

// Lấy URL hiện tại đang sử dụng
export const getCurrentBaseUrl = (): string => {
    return axiosInstance.defaults.baseURL || API_CONFIG.BASE_URL;
};

export default axiosInstance;