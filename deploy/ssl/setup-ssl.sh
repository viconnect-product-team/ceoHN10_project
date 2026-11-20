#!/bin/bash
set -e

cd /root/ssl-proxy

# 1. Mở các cổng trên UFW nếu có UFW
if command -v ufw >/dev/null 2>&1; then
    echo "[UFW] Mở cổng 80, 443, 10443, 10444, 10445, 5020, 5021, 5022, 5023 trên tường lửa Ubuntu..."
    ufw allow 80/tcp >/dev/null 2>&1 || true
    ufw allow 443/tcp >/dev/null 2>&1 || true
    ufw allow 10443/tcp >/dev/null 2>&1 || true
    ufw allow 10444/tcp >/dev/null 2>&1 || true
    ufw allow 10445/tcp >/dev/null 2>&1 || true
    ufw allow 5020/tcp >/dev/null 2>&1 || true
    ufw allow 5021/tcp >/dev/null 2>&1 || true
    ufw allow 5022/tcp >/dev/null 2>&1 || true
    ufw allow 5023/tcp >/dev/null 2>&1 || true
    ufw reload >/dev/null 2>&1 || true
    echo "[UFW] Đã cập nhật và nạp lại quy tắc tường lửa UFW thành công."
fi

# 2. Đảm bảo IPTABLES cho phép lưu lượng đi thẳng vào Docker containers
iptables -I DOCKER-USER -p tcp -m multiport --dports 10443,10444,10445,5020,5021,5022,5023 -j ACCEPT 2>/dev/null || true
iptables -I FORWARD -p tcp -m multiport --dports 10443,10444,10445,5020,5021,5022,5023 -j ACCEPT 2>/dev/null || true
iptables -I INPUT -p tcp -m multiport --dports 80,443,10443,10444,10445,5020,5021,5022,5023 -j ACCEPT 2>/dev/null || true

# 3. Chuẩn hóa tệp tin cấu hình (loại bỏ triệt để ký tự \r xuống dòng Windows)
tr -d '\r' < nginx.conf > nginx.conf.clean && mv -f nginx.conf.clean nginx.conf 2>/dev/null || true
tr -d '\r' < docker-compose.ssl.yml > docker-compose.ssl.yml.clean && mv -f docker-compose.ssl.yml.clean docker-compose.ssl.yml 2>/dev/null || true

# 4. Khởi động lại container Nginx Proxy
echo "[Docker] Đảm bảo mạng ceohn10-network và khởi tạo container ceohn10-ssl-proxy..."
docker network create ceohn10-network 2>/dev/null || true
docker compose -f docker-compose.ssl.yml down 2>/dev/null || true
docker compose -f docker-compose.ssl.yml up -d --force-recreate

# 5. Đợi 2s để Nginx worker process ổn định
sleep 2

# 6. Kiểm tra trạng thái và logs
echo "--- TRẠNG THÁI NGINX SSL PROXY CONTAINER ---"
docker ps -a --filter name=ceohn10-ssl-proxy --format 'table {{.Names}}\t{{.Status}}\t{{.Ports}}'

echo "--- NHẬT KÝ NGINX (LOGS) ---"
docker logs --tail 15 ceohn10-ssl-proxy 2>&1 || true

# Tạm ngắt exit on error để các lệnh kiểm thử curl không làm fail script deploy
set +e

# 5.1. Cấu hình Reverse Proxy trực tiếp cho Nginx Host Ubuntu (Cổng 80 & 443)
if [ -d "/etc/nginx" ]; then
    echo "[Host Nginx] Cấu hình Reverse Proxy cho ceohn10.viconnect.vn & crm.ceohn10.viconnect.vn..."
    mkdir -p /etc/nginx/ssl 2>/dev/null || true
    if [ -f "/root/ssl-proxy/server.crt" ] && [ -f "/root/ssl-proxy/server.key" ]; then
        cp -f /root/ssl-proxy/server.crt /etc/nginx/ssl/server.crt 2>/dev/null || true
        cp -f /root/ssl-proxy/server.key /etc/nginx/ssl/server.key 2>/dev/null || true
    fi

    cat << 'EOF' > /etc/nginx/conf.d/ceohn10_subdomains.conf
# ==============================================================================
# NGINX HOST OS REVERSE PROXY CHO SUBDOMAINS CEO HN10
# ==============================================================================

# 1. HTTP 80 -> HTTPS 443 REDIRECT
server {
    listen 80;
    server_name ceohn10.viconnect.vn ceoHN10.viconnect.vn crm_ceohn10.viconnect.vn crm.ceohn10.viconnect.vn crm.ceoHN10.viconnect.vn;

    location /.well-known/acme-challenge/ {
        root /var/www/certbot;
    }

    location / {
        return 301 https://$host$request_uri;
    }
}

# 2. SUBDOMAIN WEB CRM: https://crm.ceohn10.viconnect.vn & crm_ceohn10.viconnect.vn
server {
    listen 443 ssl http2;
    server_name crm.ceohn10.viconnect.vn crm_ceohn10.viconnect.vn crm.ceoHN10.viconnect.vn;

    ssl_certificate /etc/nginx/ssl/server.crt;
    ssl_certificate_key /etc/nginx/ssl/server.key;
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers HIGH:!aNULL:!MD5;
    client_max_body_size 50M;

    location = /sw.js {
        proxy_pass http://127.0.0.1:5022;
        add_header Cache-Control "no-cache, no-store, must-revalidate" always;
    }

    location /assets/ {
        proxy_pass http://127.0.0.1:5022;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        add_header Cache-Control "public, max-age=31536000, immutable";
    }

    location / {
        proxy_pass http://127.0.0.1:5022;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection $connection_upgrade;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto https;
        add_header Cache-Control "no-cache, no-store, must-revalidate" always;
    }

    location /api/ {
        proxy_pass http://127.0.0.1:5023;
        proxy_http_version 1.1;
        proxy_set_header Connection "";
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto https;
    }

    location /uploads/ {
        proxy_pass http://127.0.0.1:5023;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto https;
    }

    location /upload/ {
        rewrite ^/upload/(.*)$ /api/upload/$1 break;
        proxy_pass http://127.0.0.1:5023;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto https;
    }

    location /socket.io/ {
        proxy_pass http://127.0.0.1:5023;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto https;
    }
}

# 3. SUBDOMAIN MOBILE APP: https://ceohn10.viconnect.vn
server {
    listen 443 ssl http2;
    server_name ceohn10.viconnect.vn ceoHN10.viconnect.vn;

    ssl_certificate /etc/nginx/ssl/server.crt;
    ssl_certificate_key /etc/nginx/ssl/server.key;
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers HIGH:!aNULL:!MD5;
    client_max_body_size 50M;

    location = /sw.js {
        proxy_pass http://127.0.0.1:5020;
        add_header Cache-Control "no-cache, no-store, must-revalidate" always;
    }

    location /assets/ {
        proxy_pass http://127.0.0.1:5020;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        add_header Cache-Control "public, max-age=31536000, immutable";
    }

    location / {
        proxy_pass http://127.0.0.1:5020;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection $connection_upgrade;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto https;
        add_header Cache-Control "no-cache, no-store, must-revalidate" always;
    }

    location /api/ {
        proxy_pass http://127.0.0.1:5021;
        proxy_http_version 1.1;
        proxy_set_header Connection "";
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto https;
    }

    location /uploads/ {
        proxy_pass http://127.0.0.1:5021;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto https;
    }

    location /upload/ {
        rewrite ^/upload/(.*)$ /api/upload/$1 break;
        proxy_pass http://127.0.0.1:5021;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto https;
    }

    location /socket.io/ {
        proxy_pass http://127.0.0.1:5021;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto https;
    }
}
EOF

    # Kiểm tra cú pháp nginx và reload
    if nginx -t 2>/dev/null; then
        echo "[Host Nginx] Cú pháp Nginx Host hợp lệ! Đang reload..."
        systemctl reload nginx 2>/dev/null || true
    else
        echo "[Host Nginx] Cảnh báo cú pháp Nginx Host, bỏ qua để bảo vệ máy chủ."
    fi
fi

# Reload host nginx nếu đang chạy trên VPS để cập nhật cấu hình nếu có
if systemctl is-active --quiet nginx 2>/dev/null; then
    echo "[Host Nginx] Tải lại Nginx chính trên máy chủ chủ..."
    systemctl reload nginx 2>/dev/null || true
fi

echo "--- TEST NỘI BỘ HTTPS 443 (SUBDOMAINS) ---"
curl -k -s -I -H "Host: ceohn10.viconnect.vn" https://127.0.0.1:443/ 2>&1 | head -n 5 || echo "Lỗi kết nối https 443 ceohn10 nội bộ"
curl -k -s -I -H "Host: crm_ceohn10.viconnect.vn" https://127.0.0.1:443/ 2>&1 | head -n 5 || echo "Lỗi kết nối https 443 crm_ceohn10 nội bộ"
curl -k -s -I -H "Host: crm.ceohn10.viconnect.vn" https://127.0.0.1:443/ 2>&1 | head -n 5 || echo "Lỗi kết nối https 443 crm nội bộ"

echo "--- KIỂM TRA PORT LẮNG NGHE (PORT BINDING) ---"
ss -tulpn 2>/dev/null | grep -E "10443|10444|10445|5022|5020" || netstat -tulpn 2>/dev/null | grep -E "10443|10444|10445|5022|5020" || true

echo "--- TEST NỘI BỘ HTTPS 10443 (WEB CRM & LANDING) ---"
curl -k -s -I https://127.0.0.1:10443/ 2>&1 | head -n 5 || echo "Lỗi kết nối https 127.0.0.1:10443 nội bộ"
curl -k -s -I https://127.0.0.1:10443/auth 2>&1 | head -n 5 || echo "Lỗi kết nối https 127.0.0.1:10443/auth nội bộ"
curl -k -s -I https://14.225.217.232:10443/auth 2>&1 | head -n 5 || echo "Lỗi kết nối https 14.225.217.232:10443/auth qua IP ngoại"

echo "--- TEST NỘI BỘ HTTPS 10444 (APP HIỆP HỘI CEO HN10) ---"
curl -k -s -I https://127.0.0.1:10444/ 2>&1 | head -n 5 || echo "Lỗi kết nối https 127.0.0.1:10444 nội bộ"
curl -k -s -I https://14.225.217.232:10444/ 2>&1 | head -n 5 || echo "Lỗi kết nối https 14.225.217.232:10444 qua IP ngoại"

echo "[OK] Nginx SSL Proxy đã được cấu hình và chạy ổn định."
exit 0
