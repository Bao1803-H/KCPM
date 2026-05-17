import axios from 'axios';

const API_BASE_URL = process.env.REACT_APP_SHIPPING_API_URL || 'http://localhost:8083/api';
const FARM_API_URL = process.env.REACT_APP_FARM_API_URL || 'http://localhost:8081/api';
// Auth Service chạy ở port 8085 (theo application.properties)
const AUTH_API_URL = process.env.REACT_APP_AUTH_API_URL || 'http://localhost:8085/api/auth';

// Helper function to get auth token from localStorage
const getToken = () => {
  return localStorage.getItem('shipping_manager_token') || localStorage.getItem('auth_token'); // legacy fallback
};

// Helper function to get headers with token
const getHeaders = () => {
  const token = getToken();
  return {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  };
};

const api = {
  // Authentication
  login: async (emailOrUsername, password) => {
    try {
      // Backend có thể nhận email hoặc username, nhưng AuthRequest có cả email và username
      // Thử gửi cả hai để đảm bảo tương thích
      const loginData = {
        email: emailOrUsername, // Backend signIn method dùng email
        username: emailOrUsername, // Có thể cần username
        password: password,
        clientId: "shippingmanager"
      };

      const response = await axios.post(`${AUTH_API_URL}/login`, loginData, {
        headers: {
          'Content-Type': 'application/json'
        }
      });
      
      // Backend trả về token trực tiếp (string), không phải object
      const token = typeof response.data === 'string' ? response.data : response.data.token || response.data;
      
      if (!token || token === 'Invalid credentials') {
        throw new Error('Thông tin đăng nhập không chính xác');
      }
      
      localStorage.setItem('shipping_manager_token', token);
      
      // Decode token để lấy thông tin user
      try {
        const tokenParts = token.split('.');
        if (tokenParts.length === 3) {
          const payload = JSON.parse(atob(tokenParts[1]));
          const user = {
            id: payload.id || payload.sub,
            username: payload.username || payload.sub || emailOrUsername,
            email: payload.email || emailOrUsername,
            roles: payload.roles || []
          };
          localStorage.setItem('user', JSON.stringify(user));
        }
      } catch (decodeError) {
        console.warn('Could not decode token:', decodeError);
        // Lưu thông tin cơ bản nếu không decode được
        localStorage.setItem('user', JSON.stringify({ 
          email: emailOrUsername,
          username: emailOrUsername 
        }));
      }
      
      return { token, success: true };
    } catch (error) {
      console.error('Login API error:', error);
      
      // Xử lý lỗi từ backend
      let errorMessage = 'Đăng nhập thất bại. Vui lòng kiểm tra lại thông tin.';
      
      if (error.response) {
        // Có response từ server
        const status = error.response.status;
        const data = error.response.data;
        
        if (status === 401 || status === 403) {
          errorMessage = typeof data === 'string' ? data : 'Thông tin đăng nhập không chính xác';
        } else if (status === 400) {
          errorMessage = typeof data === 'string' ? data : 'Yêu cầu không hợp lệ';
        } else if (data) {
          errorMessage = typeof data === 'string' ? data : JSON.stringify(data);
        }
      } else if (error.request) {
        // Request được gửi nhưng không có response (server không chạy hoặc CORS)
        errorMessage = 'Không thể kết nối đến server. Vui lòng kiểm tra xem Auth Service đã chạy chưa.';
      } else {
        errorMessage = error.message || errorMessage;
      }
      
      throw new Error(errorMessage);
    }
  },

  register: async (email, username, password, role) => {
    try {
      const registerData = {
        email: email,
        username: username,
        password: password,
        role: role || 'SHIPPINGMANAGER' // Không có ROLE_ prefix, auth service sẽ tự thêm
      };

      const response = await axios.post(`${AUTH_API_URL}/register`, registerData, {
        headers: {
          'Content-Type': 'application/json'
        }
      });

      return { success: true, data: response.data };
    } catch (error) {
      console.error('Register API error:', error);
      
      let errorMessage = 'Đăng ký thất bại. Vui lòng thử lại.';
      
      if (error.response) {
        const status = error.response.status;
        const data = error.response.data;
        
        if (status === 400) {
          errorMessage = typeof data === 'string' ? data : 'Thông tin đăng ký không hợp lệ';
        } else if (data) {
          errorMessage = typeof data === 'string' ? data : JSON.stringify(data);
        }
      } else if (error.request) {
        errorMessage = 'Không thể kết nối đến server. Vui lòng kiểm tra xem Auth Service đã chạy chưa.';
      } else {
        errorMessage = error.message || errorMessage;
      }
      
      throw new Error(errorMessage);
    }
  },

  logout: () => {
    localStorage.removeItem('shipping_manager_token');
    localStorage.removeItem('auth_token'); // legacy
    localStorage.removeItem('user');
  },

  isAuthenticated: () => {
    return !!(localStorage.getItem('shipping_manager_token') || localStorage.getItem('auth_token'));
  },

  // Shipments
  getAllShipments: async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}/shipments`, {
        headers: getHeaders()
      });
      return response.data;
    } catch (error) {
      console.error('Error fetching shipments:', error);
      throw error.response?.data || error.message;
    }
  },

  createShipment: async (shipmentData) => {
    try {
      const response = await axios.post(`${API_BASE_URL}/shipments`, shipmentData, {
        headers: getHeaders()
      });
      return response.data;
    } catch (error) {
      console.error('Error creating shipment:', error);
      throw error.response?.data || error.message;
    }
  },

  assignDriverAndVehicle: async (shipmentId, driverId, vehicleId) => {
    try {
      const response = await axios.put(
        `${API_BASE_URL}/shipments/${shipmentId}/assign?driverId=${driverId}&vehicleId=${vehicleId}`,
        {},
        { headers: getHeaders() }
      );
      return response.data;
    } catch (error) {
      console.error('Error assigning driver and vehicle:', error);
      throw error.response?.data || error.message;
    }
  },

  updateShipmentStatus: async (shipmentId, status) => {
    try {
      const response = await axios.put(
        `${API_BASE_URL}/shipments/${shipmentId}/status?status=${status}`,
        {},
        { headers: getHeaders() }
      );
      return response.data;
    } catch (error) {
      console.error('Error updating shipment status:', error);
      throw error.response?.data || error.message;
    }
  },

  cancelShipment: async (shipmentId) => {
    try {
      await axios.delete(`${API_BASE_URL}/shipments/${shipmentId}`, {
        headers: getHeaders()
      });
      return true;
    } catch (error) {
      console.error('Error cancelling shipment:', error);
      throw error.response?.data || error.message;
    }
  },

  // Drivers
  getAllDrivers: async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}/drivers`, {
        headers: getHeaders()
      });
      return response.data;
    } catch (error) {
      console.error('Error fetching drivers:', error);
      throw error.response?.data || error.message;
    }
  },

  searchDrivers: async (name) => {
    try {
      const response = await axios.get(`${API_BASE_URL}/drivers/search?name=${encodeURIComponent(name)}`, {
        headers: getHeaders()
      });
      return response.data;
    } catch (error) {
      console.error('Error searching drivers:', error);
      throw error.response?.data || error.message;
    }
  },

  createDriver: async (driverData) => {
    try {
      const response = await axios.post(`${API_BASE_URL}/drivers`, driverData, {
        headers: getHeaders()
      });
      return response.data;
    } catch (error) {
      console.error('Error creating driver:', error);
      if (error.response) {
        const status = error.response.status;
        const data = error.response.data;
        
        if (status === 403 || status === 401) {
          throw new Error('Access Denied: Bạn không có quyền thực hiện thao tác này. Vui lòng đảm bảo tài khoản có role ROLE_SHIPPINGMANAGER.');
        }
        
        throw new Error(typeof data === 'string' ? data : (data.message || 'Lỗi khi tạo tài xế'));
      }
      throw new Error(error.message || 'Lỗi khi tạo tài xế');
    }
  },

  updateDriver: async (driverId, driverData) => {
    try {
      // Note: Backend may not have PUT endpoint yet, using POST for now
      // This should be updated when backend adds PUT /api/drivers/{id}
      const response = await axios.put(`${API_BASE_URL}/drivers/${driverId}`, driverData, {
        headers: getHeaders()
      });
      return response.data;
    } catch (error) {
      console.error('Error updating driver:', error);
      // If PUT doesn't exist, try creating a new one (temporary workaround)
      if (error.response?.status === 404 || error.response?.status === 405) {
        throw new Error('Tính năng cập nhật tài xế chưa được hỗ trợ. Vui lòng xóa và tạo lại.');
      }
      throw error.response?.data || error.message;
    }
  },

  deleteDriver: async (driverId) => {
    try {
      await axios.delete(`${API_BASE_URL}/drivers/${driverId}`, {
        headers: getHeaders()
      });
      return true;
    } catch (error) {
      console.error('Error deleting driver:', error);
      // If DELETE doesn't exist
      if (error.response?.status === 404 || error.response?.status === 405) {
        throw new Error('Tính năng xóa tài xế chưa được hỗ trợ.');
      }
      throw error.response?.data || error.message;
    }
  },

  // Vehicles
  getAllVehicles: async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}/vehicles`, {
        headers: getHeaders()
      });
      return response.data;
    } catch (error) {
      console.error('Error fetching vehicles:', error);
      throw error.response?.data || error.message;
    }
  },

  createVehicle: async (vehicleData) => {
    try {
      const response = await axios.post(`${API_BASE_URL}/vehicles`, vehicleData, {
        headers: getHeaders()
      });
      return response.data;
    } catch (error) {
      console.error('Error creating vehicle:', error);
      if (error.response) {
        const status = error.response.status;
        const data = error.response.data;
        
        if (status === 403 || status === 401) {
          throw new Error('Access Denied: Bạn không có quyền thực hiện thao tác này. Vui lòng đảm bảo tài khoản có role ROLE_SHIPPINGMANAGER.');
        }
        
        throw new Error(typeof data === 'string' ? data : (data.message || 'Lỗi khi tạo xe'));
      }
      throw new Error(error.message || 'Lỗi khi tạo xe');
    }
  },

  updateVehicle: async (vehicleId, vehicleData) => {
    try {
      // Note: Backend may not have PUT endpoint yet
      // This should be updated when backend adds PUT /api/vehicles/{id}
      const response = await axios.put(`${API_BASE_URL}/vehicles/${vehicleId}`, vehicleData, {
        headers: getHeaders()
      });
      return response.data;
    } catch (error) {
      console.error('Error updating vehicle:', error);
      // If PUT doesn't exist
      if (error.response?.status === 404 || error.response?.status === 405) {
        throw new Error('Tính năng cập nhật xe chưa được hỗ trợ. Vui lòng xóa và tạo lại.');
      }
      throw error.response?.data || error.message;
    }
  },

  deleteVehicle: async (vehicleId) => {
    try {
      await axios.delete(`${API_BASE_URL}/vehicles/${vehicleId}`, {
        headers: getHeaders()
      });
      return true;
    } catch (error) {
      console.error('Error deleting vehicle:', error);
      // If DELETE doesn't exist
      if (error.response?.status === 404 || error.response?.status === 405) {
        throw new Error('Tính năng xóa xe chưa được hỗ trợ.');
      }
      throw error.response?.data || error.message;
    }
  },

  // Reports
  getSummaryReport: async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}/reports/summary`, {
        headers: getHeaders()
      });
      return response.data;
    } catch (error) {
      console.error('Error fetching summary report:', error);
      throw error.response?.data || error.message;
    }
  },

  // Driver Reports
  getAllDriverReports: async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}/reports/drivers`, {
        headers: getHeaders()
      });
      return response.data;
    } catch (error) {
      console.error('Error fetching driver reports:', error);
      throw error.response?.data || error.message;
    }
  },

  getDriverReports: async (driverId) => {
    try {
      const response = await axios.get(`${API_BASE_URL}/reports/drivers/${driverId}`, {
        headers: getHeaders()
      });
      return response.data;
    } catch (error) {
      console.error('Error fetching driver reports:', error);
      throw error.response?.data || error.message;
    }
  },

  getPendingDriverReports: async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}/reports/drivers/pending`, {
        headers: getHeaders()
      });
      return response.data;
    } catch (error) {
      console.error('Error fetching pending driver reports:', error);
      throw error.response?.data || error.message;
    }
  },

  // Admin Reports
  sendReportToAdmin: async (reportData) => {
    try {
      const response = await axios.post(`${API_BASE_URL}/reports/admin`, reportData, {
        headers: getHeaders()
      });
      return response.data;
    } catch (error) {
      console.error('Error sending report to admin:', error);
      throw error.response?.data || error.message;
    }
  },

  getMyAdminReports: async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}/reports/admin/my-reports`, {
        headers: getHeaders()
      });
      return response.data;
    } catch (error) {
      console.error('Error fetching my admin reports:', error);
      throw error.response?.data || error.message;
    }
  },

  // Orders (from Shipping Manager Service - proxy to Farm Service)
  getConfirmedOrders: async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}/orders/confirmed`, {
        headers: getHeaders()
      });
      return response.data || [];
    } catch (error) {
      console.error('Error fetching confirmed orders:', error);
      if (error.response) {
        const status = error.response.status;
        const data = error.response.data;
        
        if (status === 403 || status === 401) {
          throw new Error('Access Denied: Bạn không có quyền thực hiện thao tác này.');
        }
        
        throw new Error(typeof data === 'string' ? data : (data.message || 'Không thể tải danh sách đơn hàng'));
      }
      throw new Error(error.message || 'Không thể tải danh sách đơn hàng');
    }
  }
};

export default api;
