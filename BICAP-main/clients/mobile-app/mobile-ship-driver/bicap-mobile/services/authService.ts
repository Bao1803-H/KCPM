// app/services/authService.ts
import axiosInstance from './axiosInstance';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { AxiosError } from 'axios';
import { jwtDecode } from 'jwt-decode';

// ==============================================
// INTERFACES / TYPES
// ==============================================
export interface LoginCredentials {
    email: string;
    password: string;
}

export interface RegisterData {
    email: string;
    password: string;
    fullName?: string;
    phone?: string;
}

export interface UserProfile {
    id: string | number;
    email: string;
    fullName?: string;
    phone?: string;
    role?: string;
    roles?: string[];
    avatarUrl?: string;
}

export interface AuthResponse {
    token: string;
    refreshToken?: string;
    user?: UserProfile;
    message?: string;
}

export interface ApiError {
    message: string;
    status?: number;
    code?: string;
}

// JWT Token claims structure from auth-service
export interface JwtPayload {
    sub: string;       // username
    userId: number;
    email: string;
    roles: string;     // comma-separated roles, e.g., "ROLE_DELIVERYDRIVER"
    iss: string;
    iat: number;
    exp: number;
}

// Allowed role for mobile driver app
export const DRIVER_ROLE = 'ROLE_DELIVERYDRIVER';
// Danh sách role được phép đăng nhập
export const ALLOWED_ROLES = ['ROLE_DELIVERYDRIVER', 'ROLE_SHIPPER'];

const hasAllowedRole = (token: string): boolean => {
    const roles = extractRolesFromToken(token).map(r => r.trim().toUpperCase());
    // Log để debug role thực tế từ token
    console.log('[AuthService] Roles from token:', roles);
    return roles.some(role => ALLOWED_ROLES.includes(role));
};

// ==============================================
// JWT HELPER FUNCTIONS
// ==============================================

/**
 * Decode JWT token without verification (client-side only)
 * Note: Verification is done server-side
 */
const decodeJwt = (token: string): JwtPayload | null => {
    try {
        return jwtDecode<JwtPayload>(token);
    } catch (error) {
        console.error('[AuthService] Error decoding JWT:', error);
        return null;
    }
};

/**
 * Extract roles from JWT token
 */
const extractRolesFromToken = (token: string): string[] => {
    const payload = decodeJwt(token);
    if (!payload || !payload.roles) {
        return [];
    }
    // Roles are comma-separated string from auth-service
    return payload.roles.split(',').map(role => role.trim());
};

/**
 * Check if JWT token is expired
 */
const isTokenExpired = (token: string): boolean => {
    const payload = decodeJwt(token);
    if (!payload || !payload.exp) {
        return true;
    }
    // exp is in seconds, Date.now() returns milliseconds
    return payload.exp * 1000 < Date.now();
};

// ==============================================
// AUTH SERVICE
// ==============================================
export const authService = {
    /**
     * Đăng nhập - Gọi qua Kong API Gateway
     * Kong route: /api/auth -> auth-service:8080
     * 
     * NOTE: auth-service returns a plain string token, not a JSON object
     */
    login: async (email: string, password: string): Promise<AuthResponse> => {
        try {
            // Endpoint: POST /api/auth/login (Kong route tới auth-service)
            // auth-service returns ResponseEntity.ok(token) where token is a plain string
            const response = await axiosInstance.post<string | AuthResponse>('/api/auth/login', { 
                email, 
                password 
            });
            
            // Response.data can be a string token or an AuthResponse object
            // auth-service returns ResponseEntity.ok(token) where token is a plain string
            let token: string;
            if (typeof response.data === 'string') {
                token = response.data;
            } else if (response.data && typeof response.data === 'object' && 'token' in response.data) {
                token = response.data.token;
            } else {
                throw new Error('Invalid response format from server');
            }
            
            if (!token || typeof token !== 'string') {
                console.error('[AuthService] Invalid token received:', typeof response.data, response.data);
                throw new Error('Không nhận được token từ server');
            }

            // Check if token is expired
            if (isTokenExpired(token)) {
                throw new Error('Token đã hết hạn');
            }

            // Chỉ cho phép đăng nhập với các role hợp lệ
            if (!hasAllowedRole(token)) {
                throw new Error('Tài khoản không có quyền truy cập ứng dụng này.');
            }

            // Extract user info from JWT
            const payload = decodeJwt(token);
            const roles = extractRolesFromToken(token);

            const user: UserProfile = {
                id: payload?.userId || 0,
                email: payload?.email || email,
                fullName: payload?.sub || email.split('@')[0],
                role: roles[0] || '',
                roles: roles,
            };

            // Lưu token vào AsyncStorage
            await AsyncStorage.setItem('userToken', token);
            await AsyncStorage.setItem('userData', JSON.stringify(user));
            await AsyncStorage.setItem('userRoles', JSON.stringify(roles));
            
            // Debug log in development
            if (__DEV__) {
                console.log('[AuthService] Login successful, token length:', token.length);
            }
            
            // Lưu token vào AsyncStorage
            await AsyncStorage.setItem('userToken', token);
            
            // Return AuthResponse format for consistency
            const authResponse: AuthResponse = {
                token: token,
                message: 'Đăng nhập thành công'
            };
            
            return authResponse;
        } catch (error) {
            const axiosError = error as AxiosError<{ message?: string } | string>;
            
            // Handle string error response (auth-service returns "Invalid credentials" as string)
            let errorMessage = 'Đăng nhập thất bại';
            if (axiosError.response) {
                if (typeof axiosError.response.data === 'string') {
                    errorMessage = axiosError.response.data;
                } else if (axiosError.response.data?.message) {
                    errorMessage = axiosError.response.data.message;
                } else {
                    errorMessage = `Lỗi ${axiosError.response.status}: ${axiosError.response.statusText}`;
                }
            } else if (axiosError.message) {
                errorMessage = axiosError.message;
            }
            
            console.error('[AuthService] Login error:', errorMessage, error);
            throw new Error(errorMessage);
        }
    },

    /**
     * Đăng ký tài khoản mới
     */
    register: async (data: RegisterData): Promise<AuthResponse> => {
        try {
            const response = await axiosInstance.post<AuthResponse>('/api/auth/register', data);
            return response.data;
        } catch (error) {
            const axiosError = error as AxiosError<{ message?: string }>;
            const errorMessage = axiosError.response?.data?.message || 'Đăng ký thất bại';
            throw new Error(errorMessage);
        }
    },

    /**
     * Đăng xuất - Xóa token và dữ liệu local
     */
    logout: async (): Promise<void> => {
        try {
            // Gọi API logout nếu backend cần (optional)
            // await axiosInstance.post('/api/auth/logout');
            
            // Xóa tất cả dữ liệu auth từ local storage
            await AsyncStorage.multiRemove([
                'userToken',
                'refreshToken', 
                'userData',
                'userRoles'
            ]);
        } catch (error) {
            console.error('[AuthService] Logout error:', error);
            // Vẫn xóa local data dù có lỗi
            await AsyncStorage.multiRemove(['userToken', 'refreshToken', 'userData', 'userRoles']);
        }
    },

    /**
     * Lấy thông tin profile của user đang đăng nhập
     */
    getProfile: async (): Promise<UserProfile> => {
        try {
            const response = await axiosInstance.get<UserProfile>('/api/auth/profile');
            return response.data;
        } catch (error) {
            const axiosError = error as AxiosError<{ message?: string }>;
            const errorMessage = axiosError.response?.data?.message || 'Không thể lấy thông tin profile';
            throw new Error(errorMessage);
        }
    },

    /**
     * Cập nhật thông tin profile
     */
    updateProfile: async (data: Partial<UserProfile>): Promise<UserProfile> => {
        try {
            const response = await axiosInstance.put<UserProfile>('/api/update/profile', data);
            
            // Cập nhật lại userData trong storage
            if (response.data) {
                await AsyncStorage.setItem('userData', JSON.stringify(response.data));
            }
            
            return response.data;
        } catch (error) {
            const axiosError = error as AxiosError<{ message?: string }>;
            const errorMessage = axiosError.response?.data?.message || 'Cập nhật profile thất bại';
            throw new Error(errorMessage);
        }
    },

    /**
     * Refresh token khi token cũ hết hạn
     */
    refreshToken: async (): Promise<string | null> => {
        try {
            const refreshToken = await AsyncStorage.getItem('refreshToken');
            if (!refreshToken) {
                return null;
            }
            
            const response = await axiosInstance.post<{ token: string }>('/api/auth/refresh', {
                refreshToken
            });
            
            const newToken = response.data.token;
            await AsyncStorage.setItem('userToken', newToken);
            
            return newToken;
        } catch (error) {
            console.error('[AuthService] Refresh token failed:', error);
            return null;
        }
    },

    /**
     * Kiểm tra xem user đã đăng nhập chưa
     */
    isAuthenticated: async (): Promise<boolean> => {
        try {
            const token = await AsyncStorage.getItem('userToken');
            return !!token;
        } catch {
            return false;
        }
    },

    /**
     * Lấy token hiện tại
     */
    getToken: async (): Promise<string | null> => {
        return AsyncStorage.getItem('userToken');
    },

    /**
     * Lấy dữ liệu user đã lưu local
     */
    getStoredUser: async (): Promise<UserProfile | null> => {
        try {
            const userData = await AsyncStorage.getItem('userData');
            return userData ? JSON.parse(userData) : null;
        } catch {
            return null;
        }
    },

    /**
     * Đổi mật khẩu
     */
    changePassword: async (oldPassword: string, newPassword: string): Promise<void> => {
        try {
            await axiosInstance.post('/api/auth/change-password', {
                oldPassword,
                newPassword
            });
        } catch (error) {
            const axiosError = error as AxiosError<{ message?: string }>;
            const errorMessage = axiosError.response?.data?.message || 'Đổi mật khẩu thất bại';
            throw new Error(errorMessage);
        }
    },

    /**
     * Validate current token and check if user has driver role
     * Returns true only if token is valid and user has ROLE_DELIVERYDRIVER
     */
    validateDriverAccess: async (): Promise<boolean> => {
        try {
            const token = await AsyncStorage.getItem('userToken');
            if (!token) {
                return false;
            }

            // Check if token is expired
            if (isTokenExpired(token)) {
                // Clear expired token
                await AsyncStorage.multiRemove(['userToken', 'userData', 'userRoles']);
                return false;
            }

            // Check if user has driver role
            return hasAllowedRole(token);
        } catch (error) {
            console.error('[AuthService] validateDriverAccess error:', error);
            return false;
        }
    },

    /**
     * Get stored user roles
     */
    getStoredRoles: async (): Promise<string[]> => {
        try {
            const roles = await AsyncStorage.getItem('userRoles');
            return roles ? JSON.parse(roles) : [];
        } catch {
            return [];
        }
    },

    /**
     * Check if current user has specific role
     */
    hasRole: async (role: string): Promise<boolean> => {
        const roles = await authService.getStoredRoles();
        return roles.includes(role);
    },

    /**
     * Check if current user is a driver
     */
    isDriver: async (): Promise<boolean> => {
        return authService.hasRole(DRIVER_ROLE);
    },

    /**
     * Get decoded JWT payload from stored token
     */
    getTokenPayload: async (): Promise<JwtPayload | null> => {
        try {
            const token = await AsyncStorage.getItem('userToken');
            if (!token) return null;
            return decodeJwt(token);
        } catch {
            return null;
        }
    },
};