const express = require('express');
const router = express.Router();

// API Gateway URL
const TRADING_SERVICE_URL = process.env.TRADING_SERVICE_URL || 'http://localhost:8082';

// Dữ liệu mẫu sản phẩm (fallback khi không có backend)
const sampleProducts = [
    {
        id: 1,
        name: 'Rau cải bó xôi hữu cơ',
        farmName: 'Nông trại Đà Lạt Xanh',
        price: 45000,
        unit: 'kg',
        image: 'https://images.unsplash.com/photo-1576045057995-568f588f82fb?w=500',
        organic: true,
        rating: 4.8,
        sold: 234,
        location: 'Đà Lạt, Lâm Đồng'
    },
    {
        id: 2,
        name: 'Cà chua bi đỏ',
        farmName: 'Vườn Cầu Đất Farm',
        price: 55000,
        unit: 'kg',
        image: 'https://images.unsplash.com/photo-1592924357228-91a4daadcfea?w=500',
        organic: true,
        rating: 4.9,
        sold: 567,
        location: 'Cầu Đất, Lâm Đồng'
    },
    {
        id: 3,
        name: 'Dưa leo baby',
        farmName: 'HTX Nông sản sạch Hà Nội',
        price: 35000,
        unit: 'kg',
        image: 'https://images.unsplash.com/photo-1449300079323-02e209d9d3a6?w=500',
        organic: false,
        rating: 4.5,
        sold: 189,
        location: 'Gia Lâm, Hà Nội'
    },
    {
        id: 4,
        name: 'Xà lách Mỹ',
        farmName: 'Green Farm Bình Dương',
        price: 28000,
        unit: 'kg',
        image: 'https://images.unsplash.com/photo-1556801712-76c8eb07bbc9?w=500',
        organic: true,
        rating: 4.7,
        sold: 421,
        location: 'Bình Dương'
    },
    {
        id: 5,
        name: 'Ớt chuông 3 màu',
        farmName: 'Nông trại Đà Lạt Xanh',
        price: 75000,
        unit: 'kg',
        image: 'https://images.unsplash.com/photo-1563565375-f3fdfdbefa83?w=500',
        organic: true,
        rating: 4.6,
        sold: 156,
        location: 'Đà Lạt, Lâm Đồng'
    },
    {
        id: 6,
        name: 'Bắp cải tím',
        farmName: 'Organic Mộc Châu',
        price: 32000,
        unit: 'kg',
        image: 'https://images.unsplash.com/photo-1598030343246-eec71cb44231?w=500',
        organic: true,
        rating: 4.4,
        sold: 98,
        location: 'Mộc Châu, Sơn La'
    },
    {
        id: 7,
        name: 'Cà rốt baby',
        farmName: 'Vườn Cầu Đất Farm',
        price: 42000,
        unit: 'kg',
        image: 'https://images.unsplash.com/photo-1598170845058-32b9d6a5da37?w=500',
        organic: true,
        rating: 4.8,
        sold: 312,
        location: 'Cầu Đất, Lâm Đồng'
    },
    {
        id: 8,
        name: 'Bông cải xanh',
        farmName: 'Green Farm Bình Dương',
        price: 48000,
        unit: 'kg',
        image: 'https://images.unsplash.com/photo-1459411552884-841db9b3cc2a?w=500',
        organic: false,
        rating: 4.3,
        sold: 145,
        location: 'Bình Dương'
    }
];

// Danh mục
const categories = [
    { id: 'all', name: 'Tất cả', icon: 'apps' },
    { id: 'vegetables', name: 'Rau củ', icon: 'eco' },
    { id: 'fruits', name: 'Trái cây', icon: 'nutrition' },
    { id: 'grains', name: 'Ngũ cốc', icon: 'grain' },
    { id: 'herbs', name: 'Rau thơm', icon: 'grass' }
];

// Trang sàn giao dịch
router.get('/', async (req, res) => {
    const { search, category, sort, organic } = req.query;
    
    let products = [...sampleProducts];

    // Lọc theo tìm kiếm
    if (search) {
        const searchLower = search.toLowerCase();
        products = products.filter(p => 
            p.name.toLowerCase().includes(searchLower) ||
            p.farmName.toLowerCase().includes(searchLower)
        );
    }

    // Lọc organic
    if (organic === 'true') {
        products = products.filter(p => p.organic);
    }

    // Sắp xếp
    if (sort === 'price-asc') {
        products.sort((a, b) => a.price - b.price);
    } else if (sort === 'price-desc') {
        products.sort((a, b) => b.price - a.price);
    } else if (sort === 'rating') {
        products.sort((a, b) => b.rating - a.rating);
    } else if (sort === 'sold') {
        products.sort((a, b) => b.sold - a.sold);
    }

    res.render('marketplace', {
        title: 'Sàn giao dịch - BiCap',
        products,
        categories,
        filters: { search, category, sort, organic },
        user: req.session.user || null
    });
});

// Chi tiết sản phẩm
router.get('/product/:id', async (req, res) => {
    const productId = parseInt(req.params.id);
    const product = sampleProducts.find(p => p.id === productId);

    if (!product) {
        return res.status(404).render('error', {
            title: 'Không tìm thấy sản phẩm',
            message: 'Sản phẩm bạn yêu cầu không tồn tại.',
            code: 404
        });
    }

    // Sản phẩm liên quan
    const relatedProducts = sampleProducts
        .filter(p => p.id !== productId)
        .slice(0, 4);

    res.render('product-detail', {
        title: product.name + ' - BiCap Market',
        product,
        relatedProducts,
        user: req.session.user || null
    });
});

module.exports = router;
