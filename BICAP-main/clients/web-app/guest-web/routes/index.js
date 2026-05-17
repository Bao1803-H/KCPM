const express = require('express');
const router = express.Router();

// Trang chủ
router.get('/', (req, res) => {
    res.render('index', {
        title: 'BiCap - Nông nghiệp sạch & Blockchain',
        user: req.session.user || null
    });
});

// Trang giới thiệu
router.get('/about', (req, res) => {
    res.render('about', {
        title: 'Về chúng tôi - BiCap',
        user: req.session.user || null
    });
});

// Trang kiến thức
router.get('/education', (req, res) => {
    res.render('education', {
        title: 'Kiến thức nông nghiệp - BiCap',
        user: req.session.user || null
    });
});

// Chi tiết bài viết
router.get('/education/:id', (req, res) => {
    const articleId = req.params.id;
    
    // Dữ liệu mẫu bài viết
    const articles = {
        '1': {
            id: 1,
            title: 'Quy trình trồng rau thủy canh',
            category: 'Hướng dẫn',
            image: 'https://images.unsplash.com/photo-1625246333195-09870c4535cc?w=1200',
            author: 'TS. Nguyễn Văn An',
            date: '15/01/2026',
            content: `
                <h4>1. Giới thiệu về thủy canh</h4>
                <p>Thủy canh (Hydroponics) là phương pháp trồng cây không cần đất, thay vào đó sử dụng dung dịch dinh dưỡng hòa tan trong nước. Phương pháp này ngày càng phổ biến do tiết kiệm nước, không gian và cho năng suất cao.</p>
                
                <h4>2. Các loại hệ thống thủy canh phổ biến</h4>
                <ul>
                    <li><strong>NFT (Nutrient Film Technique):</strong> Dung dịch chảy thành lớp mỏng qua rễ cây</li>
                    <li><strong>DWC (Deep Water Culture):</strong> Rễ cây ngâm trực tiếp trong dung dịch</li>
                    <li><strong>Drip System:</strong> Hệ thống nhỏ giọt tự động</li>
                    <li><strong>Aeroponics:</strong> Phun sương dinh dưỡng lên rễ cây</li>
                </ul>
                
                <h4>3. Các bước thiết lập hệ thống cơ bản</h4>
                <p><strong>Bước 1:</strong> Chuẩn bị khay/ống PVC, bơm nước, đèn LED (nếu trồng trong nhà)</p>
                <p><strong>Bước 2:</strong> Pha dung dịch dinh dưỡng theo tỷ lệ khuyến cáo</p>
                <p><strong>Bước 3:</strong> Đặt cây con vào rọ nhựa với giá thể (đá perlite, rockwool)</p>
                <p><strong>Bước 4:</strong> Kiểm tra pH (5.5-6.5) và EC định kỳ</p>
                
                <h4>4. Các loại rau phù hợp</h4>
                <p>Xà lách, cải bó xôi, rau muống, cà chua bi, dưa leo mini, các loại rau thơm.</p>
            `
        },
        '2': {
            id: 2,
            title: 'Hiểu về Blockchain trong nông nghiệp',
            category: 'Công nghệ',
            image: 'https://images.unsplash.com/photo-1595855709915-d7b594b91763?w=1200',
            author: 'KS. Trần Minh Hoàng',
            date: '10/01/2026',
            content: `
                <h4>1. Blockchain là gì?</h4>
                <p>Blockchain là công nghệ sổ cái phân tán, nơi mọi giao dịch được ghi lại theo chuỗi các khối dữ liệu. Mỗi khối chứa thông tin và được liên kết với khối trước đó, tạo thành chuỗi không thể thay đổi.</p>
                
                <h4>2. Tại sao Blockchain quan trọng trong nông nghiệp?</h4>
                <ul>
                    <li><strong>Truy xuất nguồn gốc:</strong> Theo dõi hành trình sản phẩm từ nông trại đến bàn ăn</li>
                    <li><strong>Chống hàng giả:</strong> Dữ liệu không thể bị làm giả hay chỉnh sửa</li>
                    <li><strong>Tăng niềm tin:</strong> Người tiêu dùng có thể xác thực thông tin sản phẩm</li>
                    <li><strong>Minh bạch giá cả:</strong> Loại bỏ trung gian, nông dân được hưởng lợi hơn</li>
                </ul>
                
                <h4>3. Ứng dụng trong BiCap</h4>
                <p>BiCap sử dụng Blockchain để ghi nhận mọi hoạt động sản xuất: gieo trồng, bón phân, phun thuốc, thu hoạch, đóng gói và vận chuyển. Mỗi hành động tạo ra một giao dịch (transaction) với mã hash duy nhất.</p>
                
                <h4>4. Cách quét mã QR truy xuất</h4>
                <p>Mỗi sản phẩm BiCap đều có mã QR. Khi quét, người dùng sẽ thấy toàn bộ hành trình sản phẩm với bằng chứng được xác thực bởi Blockchain.</p>
            `
        },
        '3': {
            id: 3,
            title: 'Tiêu chuẩn VietGAP và GlobalGAP',
            category: 'Tiêu chuẩn',
            image: 'https://images.unsplash.com/photo-1574943320219-553eb213f72d?w=1200',
            author: 'ThS. Lê Thị Mai',
            date: '05/01/2026',
            content: `
                <h4>1. VietGAP là gì?</h4>
                <p>VietGAP (Vietnamese Good Agricultural Practices) là tiêu chuẩn thực hành sản xuất nông nghiệp tốt của Việt Nam, đảm bảo sản phẩm an toàn, chất lượng và bảo vệ môi trường.</p>
                
                <h4>2. GlobalGAP là gì?</h4>
                <p>GlobalGAP là tiêu chuẩn quốc tế về thực hành nông nghiệp tốt, được công nhận trên toàn thế giới. Sản phẩm đạt GlobalGAP có thể xuất khẩu sang các thị trường khó tính như EU, Mỹ, Nhật.</p>
                
                <h4>3. Các yêu cầu chính</h4>
                <ul>
                    <li><strong>An toàn thực phẩm:</strong> Không tồn dư hóa chất, vi sinh vật gây hại</li>
                    <li><strong>Bảo vệ môi trường:</strong> Sử dụng nước, phân bón hợp lý</li>
                    <li><strong>Sức khỏe người lao động:</strong> Điều kiện làm việc an toàn</li>
                    <li><strong>Truy xuất nguồn gốc:</strong> Ghi chép đầy đủ quy trình sản xuất</li>
                </ul>
                
                <h4>4. Quy trình đạt chứng nhận</h4>
                <p><strong>Bước 1:</strong> Đăng ký và đào tạo kiến thức GAP</p>
                <p><strong>Bước 2:</strong> Áp dụng quy trình sản xuất theo tiêu chuẩn</p>
                <p><strong>Bước 3:</strong> Đánh giá nội bộ và khắc phục</p>
                <p><strong>Bước 4:</strong> Đánh giá bởi tổ chức chứng nhận</p>
            `
        }
    };

    const article = articles[articleId];
    if (!article) {
        return res.status(404).render('error', {
            title: 'Không tìm thấy bài viết',
            message: 'Bài viết bạn yêu cầu không tồn tại.',
            code: 404
        });
    }

    res.render('article', {
        title: article.title + ' - BiCap',
        article,
        user: req.session.user || null
    });
});

module.exports = router;
