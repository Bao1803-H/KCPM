const apiService = require('./apiService');

const dashboardController = {
    // Trang chủ Dashboard
    getDashboard: async (req, res) => {
        const token = req.session.token; // Giả sử bạn lưu token trong session
        if (!token) return res.redirect('/login');

        const report = await apiService.getSummaryReport(token);
        const shipments = await apiService.getAllShipments(token);

        res.render('dashboard', { 
            user: req.session.user,
            report: report || { totalShipments: 0, totalDrivers: 0, totalVehicles: 0 },
            shipments: shipments
        });
    },

    // Trang quản lý vận đơn
    getShipments: async (req, res) => {
        const token = req.session.token;
        if (!token) return res.redirect('/login');

        const shipments = await apiService.getAllShipments(token);
        const drivers = await apiService.getAllDrivers(token);
        const vehicles = await apiService.getAllVehicles(token);
        const pendingOrders = await apiService.getConfirmedOrders(token);

        res.render('shipments', {
            shipments,
            drivers,
            vehicles,
            pendingOrders
        });
    },

    // Xử lý tạo vận đơn mới
    createShipment: async (req, res) => {
        const token = req.session.token;
        const { orderId, fromLocation, toLocation } = req.body;

        try {
            await apiService.createShipment(token, { orderId, fromLocation, toLocation });
            res.redirect('/shipments');
        } catch (error) {
            res.status(500).send("Lỗi tạo vận đơn");
        }
    },

    // Xử lý điều phối (Assign Driver)
    assignDriver: async (req, res) => {
        const token = req.session.token;
        const { shipmentId, driverId, vehicleId } = req.body;
        
        const success = await apiService.assignDriver(token, shipmentId, driverId, vehicleId);
        if (success) {
            res.status(200).json({ message: "Success" });
        } else {
            res.status(500).json({ message: "Failed" });
        }
    }
};

module.exports = dashboardController;