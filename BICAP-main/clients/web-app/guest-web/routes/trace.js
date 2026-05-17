const express = require('express');
const router = express.Router();

// API Gateway URL
const BLOCKCHAIN_SERVICE_URL = process.env.BLOCKCHAIN_SERVICE_URL || 'http://localhost:8083';

// Dữ liệu mẫu truy xuất nguồn gốc
const sampleTraceData = {
    'BATCH_001': {
        batchId: 'BATCH_001',
        productName: 'Rau cải bó xôi hữu cơ',
        farmName: 'Nông trại Đà Lạt Xanh',
        farmLocation: 'Đà Lạt, Lâm Đồng',
        certifications: ['VietGAP', 'Organic'],
        harvestDate: '20/01/2026',
        expiryDate: '27/01/2026',
        history: [
            {
                date: '01/01/2026 - 08:00',
                action: 'Gieo hạt giống',
                actor: 'Nông trại Đà Lạt Xanh',
                details: 'Gieo 500 hạt giống cải bó xôi, nguồn gốc: Nhật Bản',
                hash: '0x7a9f8c2e1d4b6a3f5e7c9d1b4a2e8f6c3d5b7a9e1f4c6d8b2a4e7f9c1d3b5a7e9',
                verified: true
            },
            {
                date: '05/01/2026 - 14:30',
                action: 'Bón phân hữu cơ',
                actor: 'Nông trại Đà Lạt Xanh',
                details: 'Sử dụng phân compost tự ủ, không hóa chất',
                hash: '0x3b5c7d9e1f2a4b6c8d0e2f4a6b8c0d2e4f6a8b0c2d4e6f8a0b2c4d6e8f0a2b4c6',
                verified: true
            },
            {
                date: '10/01/2026 - 09:15',
                action: 'Kiểm tra chất lượng nước',
                actor: 'Đội QC nội bộ',
                details: 'pH: 6.5, EC: 1.2 mS/cm - Đạt chuẩn',
                hash: '0x9d1e3f5a7b9c1d3e5f7a9b1c3d5e7f9a1b3c5d7e9f1a3b5c7d9e1f3a5b7c9d1e3f',
                verified: true
            },
            {
                date: '15/01/2026 - 10:00',
                action: 'Phun thuốc sinh học',
                actor: 'Nông trại Đà Lạt Xanh',
                details: 'Thuốc trừ sâu sinh học Bacillus thuringiensis',
                hash: '0x2c4e6f8a0b2d4f6a8c0e2f4a6b8d0e2f4a6b8c0d2e4f6a8b0c2d4e6f8a0b2c4d6',
                verified: true
            },
            {
                date: '20/01/2026 - 06:00',
                action: 'Thu hoạch',
                actor: 'Nông trại Đà Lạt Xanh',
                details: 'Thu hoạch 150kg rau cải bó xôi, đạt tiêu chuẩn',
                hash: '0x8f0a2b4c6d8e0f2a4b6c8d0e2f4a6b8c0d2e4f6a8b0c2d4e6f8a0b2c4d6e8f0a2',
                verified: true
            },
            {
                date: '20/01/2026 - 10:30',
                action: 'Kiểm định chất lượng',
                actor: 'Trung tâm Kiểm định Nông sản Lâm Đồng',
                details: 'Kiểm tra dư lượng thuốc BVTV: KHÔNG PHÁT HIỆN',
                hash: '0x4d6e8f0a2b4c6d8e0f2a4b6c8d0e2f4a6b8c0d2e4f6a8b0c2d4e6f8a0b2c4d6e8',
                verified: true
            },
            {
                date: '20/01/2026 - 14:00',
                action: 'Đóng gói & Dán nhãn',
                actor: 'Nông trại Đà Lạt Xanh',
                details: 'Đóng gói 300 túi x 500g, dán tem QR truy xuất',
                hash: '0x1a3b5c7d9e1f3a5b7c9d1e3f5a7b9c1d3e5f7a9b1c3d5e7f9a1b3c5d7e9f1a3b5',
                verified: true
            },
            {
                date: '21/01/2026 - 05:00',
                action: 'Vận chuyển',
                actor: 'BiCap Logistics',
                details: 'Xe lạnh BKS: 49C-123.45, Nhiệt độ: 4°C',
                hash: '0x7c9d1e3f5a7b9c1d3e5f7a9b1c3d5e7f9a1b3c5d7e9f1a3b5c7d9e1f3a5b7c9d1e',
                verified: true
            }
        ]
    },
    'BATCH_002': {
        batchId: 'BATCH_002',
        productName: 'Cà chua bi đỏ',
        farmName: 'Vườn Cầu Đất Farm',
        farmLocation: 'Cầu Đất, Lâm Đồng',
        certifications: ['GlobalGAP', 'Organic'],
        harvestDate: '18/01/2026',
        expiryDate: '25/01/2026',
        history: [
            {
                date: '15/11/2025 - 09:00',
                action: 'Trồng cây giống',
                actor: 'Vườn Cầu Đất Farm',
                details: 'Trồng 1000 cây cà chua bi giống F1',
                hash: '0xab12cd34ef56gh78ij90kl12mn34op56qr78st90uv12wx34yz56ab78cd90ef12',
                verified: true
            },
            {
                date: '18/01/2026 - 07:00',
                action: 'Thu hoạch đợt 1',
                actor: 'Vườn Cầu Đất Farm',
                details: 'Thu hoạch 200kg cà chua bi chín đều',
                hash: '0xcd34ef56gh78ij90kl12mn34op56qr78st90uv12wx34yz56ab78cd90ef12gh34',
                verified: true
            }
        ]
    }
};

// Trang truy xuất nguồn gốc (với form nhập mã)
router.get('/', (req, res) => {
    res.render('trace-search', {
        title: 'Truy xuất nguồn gốc - BiCap',
        user: req.session.user || null
    });
});

// Truy xuất theo mã batch
router.get('/:batchId', async (req, res) => {
    const batchId = req.params.batchId.toUpperCase();
    
    // Thử lấy từ sample data
    let traceData = sampleTraceData[batchId];

    // Nếu mã bắt đầu bằng BATCH_ và có số, tạo data từ mẫu
    if (!traceData && batchId.startsWith('BATCH_')) {
        const baseData = sampleTraceData['BATCH_001'];
        traceData = {
            ...baseData,
            batchId: batchId,
            history: baseData.history.map(h => ({
                ...h,
                hash: '0x' + Math.random().toString(16).substr(2, 64)
            }))
        };
    }

    if (!traceData) {
        return res.render('trace-not-found', {
            title: 'Không tìm thấy - BiCap',
            batchId,
            user: req.session.user || null
        });
    }

    res.render('traceability', {
        title: `Truy xuất ${batchId} - BiCap`,
        batchId: traceData.batchId,
        productName: traceData.productName,
        farmName: traceData.farmName,
        farmLocation: traceData.farmLocation,
        certifications: traceData.certifications,
        harvestDate: traceData.harvestDate,
        expiryDate: traceData.expiryDate,
        history: traceData.history,
        user: req.session.user || null
    });
});

module.exports = router;
