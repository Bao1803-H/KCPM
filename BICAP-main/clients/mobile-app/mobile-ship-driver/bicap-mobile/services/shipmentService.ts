// app/services/shipmentService.ts
import axiosInstance from './axiosInstance';
import { AxiosError } from 'axios';

// ==============================================
// INTERFACES / TYPES
// ==============================================
export interface Product {
    name: string;
    quantity: string;
    unit?: string;
}

export interface Shipment {
    id: string | number;
    orderId?: string | number;
    status: ShipmentStatus;
    fromLocation: string;
    toLocation: string;
    farmAddress?: string;
    retailerAddress?: string;
    farmName?: string;
    retailerName?: string;
    products?: Product[];
    driverId?: string | number;
    vehicleId?: string | number;
    qrCode?: string;
    pickupTime?: string;
    deliveryTime?: string;
    createdAt?: string;
    updatedAt?: string;
}

export type ShipmentStatus = 
    | 'PENDING'       // Chờ xử lý
    | 'ASSIGNED'      // Đã giao cho tài xế
    | 'PICKED_UP'     // Đã lấy hàng
    | 'IN_TRANSIT'    // Đang vận chuyển
    | 'DELIVERED'     // Đã giao hàng
    | 'COMPLETED'     // Hoàn thành
    | 'CANCELLED';    // Đã hủy

export interface ShipmentReport {
    id?: string | number;
    shipmentId: string | number;
    description: string;
    imageUrl?: string;
    reportType?: 'DAMAGE' | 'DELAY' | 'OTHER';
    createdAt?: string;
}

export interface StatusUpdateRequest {
    status: ShipmentStatus;
    qrCode?: string;
    notes?: string;
    location?: {
        latitude: number;
        longitude: number;
    };
}

// ==============================================
// SHIPMENT SERVICE
// ==============================================
export const shipmentService = {
    /**
     * Lấy danh sách đơn hàng của tài xế đang đăng nhập
     * Kong route: /api/shipments/my-shipments -> shipping-manager-service:8083
     */
    getMyShipments: async (): Promise<Shipment[]> => {
        try {
            // Endpoint từ ShipmentController: GET /api/shipments/my-shipments
            const response = await axiosInstance.get<Shipment[]>('/api/shipments/my-shipments');
            return response.data;
        } catch (error) {
            const axiosError = error as AxiosError<{ message?: string }>;
            console.error('[ShipmentService] getMyShipments error:', axiosError.message);
            throw new Error(axiosError.response?.data?.message || 'Không thể lấy danh sách đơn hàng');
        }
    },

    /**
     * Lấy chi tiết một đơn hàng theo ID
     */
    getShipmentDetail: async (shipmentId: string | number): Promise<Shipment> => {
        try {
            const response = await axiosInstance.get<Shipment>(`/api/shipments/${shipmentId}`);
            return response.data;
        } catch (error) {
            const axiosError = error as AxiosError<{ message?: string }>;
            console.error('[ShipmentService] getShipmentDetail error:', axiosError.message);
            throw new Error(axiosError.response?.data?.message || 'Không thể lấy chi tiết đơn hàng');
        }
    },

    /**
     * Cập nhật trạng thái đơn hàng (Sau khi quét QR)
     * Kong route: PUT /api/shipments/{id}/status
     * @param shipmentId - ID của shipment
     * @param status - Trạng thái mới (PICKED_UP, IN_TRANSIT, DELIVERED, etc.)
     * @param qrCode - Mã QR đã quét (optional)
     */
    updateStatus: async (
        shipmentId: string | number, 
        status: ShipmentStatus, 
        qrCode?: string
    ): Promise<Shipment> => {
        try {
            // ShipmentController endpoint: PUT /api/shipments/{id}/status?status=XXX
            const response = await axiosInstance.put<Shipment>(
                `/api/shipments/${shipmentId}/status`,
                null, // No body needed, using query params
                {
                    params: { status }
                }
            );
            return response.data;
        } catch (error) {
            const axiosError = error as AxiosError<{ message?: string }>;
            console.error('[ShipmentService] updateStatus error:', axiosError.message);
            throw new Error(axiosError.response?.data?.message || 'Không thể cập nhật trạng thái');
        }
    },

    /**
     * Xác nhận lấy hàng - Quét QR tại nông trại
     */
    confirmPickup: async (shipmentId: string | number, qrCode: string): Promise<Shipment> => {
        return shipmentService.updateStatus(shipmentId, 'PICKED_UP', qrCode);
    },

    /**
     * Xác nhận giao hàng - Quét QR tại nhà bán lẻ
     */
    confirmDelivery: async (shipmentId: string | number, qrCode: string): Promise<Shipment> => {
        return shipmentService.updateStatus(shipmentId, 'DELIVERED', qrCode);
    },

    /**
     * Cập nhật trạng thái đang vận chuyển
     */
    startTransit: async (shipmentId: string | number): Promise<Shipment> => {
        return shipmentService.updateStatus(shipmentId, 'IN_TRANSIT');
    },

    /**
     * Gửi báo cáo sự cố từ tài xế
     * Kong route: POST /api/reports/driver/submit
     */
    reportIssue: async (
        shipmentId: string | number | null, 
        title: string,
        description: string, 
        reportType: 'INCIDENT' | 'DELAY' | 'COMPLETION' | 'GENERAL' = 'GENERAL'
    ): Promise<ShipmentReport> => {
        try {
            const response = await axiosInstance.post<ShipmentReport>(
                '/api/reports/driver/submit',
                {
                    shipmentId: shipmentId ? String(shipmentId) : null,
                    title,
                    description,
                    reportType
                }
            );
            return response.data;
        } catch (error) {
            const axiosError = error as AxiosError<{ message?: string }>;
            console.error('[ShipmentService] reportIssue error:', axiosError.message);
            throw new Error(axiosError.response?.data?.message || 'Không thể gửi báo cáo sự cố');
        }
    },

    /**
     * Lấy danh sách báo cáo của tài xế
     * Kong route: GET /api/reports/driver/my-reports
     */
    getMyReports: async (): Promise<ShipmentReport[]> => {
        try {
            const response = await axiosInstance.get<ShipmentReport[]>('/api/reports/driver/my-reports');
            return response.data;
        } catch (error) {
            const axiosError = error as AxiosError<{ message?: string }>;
            console.error('[ShipmentService] getMyReports error:', axiosError.message);
            throw new Error(axiosError.response?.data?.message || 'Không thể lấy danh sách báo cáo');
        }
    },

    /**
     * Xác thực mã QR với backend
     */
    verifyQRCode: async (qrCode: string, shipmentId: string | number): Promise<boolean> => {
        try {
            const response = await axiosInstance.post<{ valid: boolean }>('/api/shipments/verify-qr', {
                qrCode,
                shipmentId
            });
            return response.data.valid;
        } catch (error) {
            console.error('[ShipmentService] verifyQRCode error:', error);
            return false;
        }
    },

    /**
     * Lấy lịch sử giao hàng đã hoàn thành
     */
    getDeliveryHistory: async (): Promise<Shipment[]> => {
        try {
            // Lấy tất cả shipments và filter theo status
            const allShipments = await shipmentService.getMyShipments();
            return allShipments.filter(s => 
                s.status === 'COMPLETED' || s.status === 'DELIVERED'
            );
        } catch (error) {
            const axiosError = error as AxiosError<{ message?: string }>;
            console.error('[ShipmentService] getDeliveryHistory error:', axiosError.message);
            throw new Error(axiosError.response?.data?.message || 'Không thể lấy lịch sử giao hàng');
        }
    },

    /**
     * Cập nhật vị trí hiện tại của tài xế (Real-time tracking)
     */
    updateDriverLocation: async (
        shipmentId: string | number,
        latitude: number,
        longitude: number
    ): Promise<void> => {
        try {
            await axiosInstance.post(`/api/shipments/${shipmentId}/location`, {
                latitude,
                longitude,
                timestamp: new Date().toISOString()
            });
        } catch (error) {
            console.error('[ShipmentService] updateDriverLocation error:', error);
            // Không throw error vì location update không critical
        }
    },
};