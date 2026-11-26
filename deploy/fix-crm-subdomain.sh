#!/bin/bash
# ==============================================================================
# SCRIPT XỬ LÝ NHANH LỖI 404 NOT FOUND CHO CRM.CEOHN10.VICONNECT.VN TRÊN VPS UBUNTU
# Máy chủ: 14.225.217.232
# ==============================================================================
set -e

echo "=============================================================================="
echo " [FIX 404 NOT FOUND] THIẾT LẬP REVERSE PROXY NGINX HOST CHO CRM.CEOHN10.VICONNECT.VN"
echo "=============================================================================="

# 1. Đảm bảo thư mục chứng chỉ SSL riêng cho CEO HN10 (KHÔNG ghi đè /etc/nginx/ssl dùng chung)
mkdir -p /etc/nginx/ssl/ceohn10 2>/dev/null || true
if [ -f "/root/ssl-proxy/server.crt" ] && [ -f "/root/ssl-proxy/server.key" ]; then
    cp -f /root/ssl-proxy/server.crt /etc/nginx/ssl/ceohn10/server.crt 2>/dev/null || true
    cp -f /root/ssl-proxy/server.key /etc/nginx/ssl/ceohn10/server.key 2>/dev/null || true
fi

# 2. Tạo tệp cấu hình Host Nginx chính thức (/etc/nginx/conf.d/ceohn10_subdomains.conf)
cat << 'EOF' > /etc/nginx/conf.d/ceohn10_subdomains.conf
# ==============================================================================
# NGINX REVERSE PROXY HOST CHO CLB DOANH NHÂN CEO HN10 (PORT 80 & 443)
# ==============================================================================

# WebSocket connection upgrade mapping
map $http_upgrade $connection_upgrade {
    default upgrade;
    '' close;
}

# 1. HTTP 80 -> HTTPS 443 CHUYỂN HƯỚNG TỰ ĐỘNG
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

# 2. CỔNG QUẢN TRỊ WEB CRM: https://crm.ceohn10.viconnect.vn & crm_ceohn10.viconnect.vn
server {
    listen 443 ssl;
    server_name crm.ceohn10.viconnect.vn crm_ceohn10.viconnect.vn crm.ceoHN10.viconnect.vn;

    ssl_certificate /etc/nginx/ssl/ceohn10/server.crt;
    ssl_certificate_key /etc/nginx/ssl/ceohn10/server.key;
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers HIGH:!aNULL:!MD5;
    client_max_body_size 50M;
    client_header_buffer_size 16k;
    large_client_header_buffers 8 32k;
    proxy_buffer_size 16k;
    proxy_buffers 4 32k;
    proxy_busy_buffers_size 64k;

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

# 3. ỨNG DỤNG DI ĐỘNG HỌC VIÊN: https://ceohn10.viconnect.vn
server {
    listen 443 ssl;
    server_name ceohn10.viconnect.vn ceoHN10.viconnect.vn;

    ssl_certificate /etc/nginx/ssl/ceohn10/server.crt;
    ssl_certificate_key /etc/nginx/ssl/ceohn10/server.key;
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers HIGH:!aNULL:!MD5;
    client_max_body_size 50M;
    client_header_buffer_size 16k;
    large_client_header_buffers 8 32k;
    proxy_buffer_size 16k;
    proxy_buffers 4 32k;
    proxy_busy_buffers_size 64k;

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

# 3. Kiểm tra cú pháp Nginx Host
echo ">>> Đang kiểm tra cú pháp Nginx Host..."
nginx -t

# 4. Tải lại Nginx Host
echo ">>> Đang tải lại dịch vụ Nginx Host..."
systemctl reload nginx

# 5. Kiểm tra trạng thái các container Docker liên quan
echo ">>> Kiểm tra trạng thái các container CRM & Mobile..."
docker ps --filter name=ceohn10 --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}"

echo "=============================================================================="
echo "🎉 HOÀN TẤT CẤU HÌNH REVERSE PROXY NGINX HOST!"
echo "👉 Web CRM Subdomain : https://crm.ceohn10.viconnect.vn"
echo "👉 Mobile Subdomain  : https://ceohn10.viconnect.vn"
echo "=============================================================================="
