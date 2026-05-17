#!/bin/bash

# Script để tạo/update password cho admin account
# Usage: ./create_admin_password.sh <password>

PASSWORD=${1:-"admin123"}
CONTAINER_NAME="auth-db"
DB_NAME="bicap_auth_db"

echo "🔐 Tạo BCrypt hash cho password: $PASSWORD"
echo ""
echo "⚠️  Lưu ý: Bạn cần tạo BCrypt hash online tại:"
echo "   https://bcrypt-generator.com/"
echo ""
echo "Hoặc sử dụng Java Spring Boot để tạo hash."
echo ""
read -p "Nhập BCrypt hash cho password '$PASSWORD': " BCRYPT_HASH

if [ -z "$BCRYPT_HASH" ]; then
    echo "❌ Hash không được để trống!"
    exit 1
fi

echo ""
echo "🔄 Đang cập nhật password trong database..."

docker exec $CONTAINER_NAME mysql -uroot -proot $DB_NAME -e \
  "UPDATE users SET password = '$BCRYPT_HASH' WHERE username = 'admin';" 2>/dev/null

if [ $? -eq 0 ]; then
    echo "✅ Password đã được cập nhật thành công!"
    echo ""
    echo "📋 Thông tin đăng nhập:"
    echo "   Email: admin@gmail.com"
    echo "   Password: $PASSWORD"
    echo ""
    echo "🧪 Test đăng nhập:"
    echo "   curl -X POST http://localhost:8088/api/auth/login \\"
    echo "     -H \"Content-Type: application/json\" \\"
    echo "     -d '{\"email\":\"admin@gmail.com\",\"password\":\"$PASSWORD\"}'"
else
    echo "❌ Lỗi khi cập nhật password!"
    exit 1
fi
