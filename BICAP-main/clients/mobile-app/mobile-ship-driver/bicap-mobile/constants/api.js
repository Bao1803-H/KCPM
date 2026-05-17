// constants/api.ts
// ⚠️ DEPRECATED: Sử dụng app/services/axiosInstance.ts thay thế
// File này được giữ lại để tương thích ngược

import axiosInstance, { API_CONFIG, setCustomBaseUrl, getCurrentBaseUrl } from '../app/services/axiosInstance';

// Export lại từ axiosInstance để các file cũ vẫn hoạt động
export const API_URL = API_CONFIG.BASE_URL;
export const client = axiosInstance;
export { setCustomBaseUrl, getCurrentBaseUrl };

export default axiosInstance;