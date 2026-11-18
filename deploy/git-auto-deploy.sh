#!/bin/bash
# ==============================================================================
# SCRIPT TỰ ĐỘNG CẬP NHẬT & DEPLOY SUBDOMAINS TRỰC TIẾP TỪ GIT TRÊN SERVER VPS
# Máy chủ: 14.225.217.232
# Subdomains: https://ceohn10.viconnect.vn & https://crm.ceohn10.viconnect.vn
# ==============================================================================
set -e

REPO_DIR="/root/ceohn10_project"
BRANCH="${1:-main}"

echo "=========================================================================="
echo " [GIT AUTO DEPLOY] CẬP NHẬT MÃ NGUỒN TỪ NHÁNH: $BRANCH"
echo "=========================================================================="

if [ -d "$REPO_DIR/.git" ]; then
    echo ">>> [1/5] Kéo mã nguồn mới nhất từ Git..."
    cd "$REPO_DIR"
    git fetch origin "$BRANCH"
    git reset --hard "origin/$BRANCH"
else
    echo "Thư mục $REPO_DIR chưa có git repo. Đang sử dụng các thư mục deploy hiện có."
fi

echo ">>> [2/5] Đảm bảo mạng nội bộ ceohn10-network & vione-network..."
docker network create ceohn10-network 2>/dev/null || true
docker network create vione-network 2>/dev/null || true

echo ">>> [3/5] Khởi động lại container Mobile CEO HN10 (https://ceohn10.viconnect.vn)..."
if [ -d "/root/ceohn10_association" ]; then
    cd /root/ceohn10_association
elif [ -d "$REPO_DIR/deploy/ceohn10" ]; then
    cd "$REPO_DIR/deploy/ceohn10"
else
    cd /root/association
fi
docker compose -f docker-compose.yml stop 2>/dev/null || true
docker rm -f ceohn10-frontend-prod ceohn10-backend-prod 2>/dev/null || true
docker compose -f docker-compose.yml up -d --force-recreate

echo ">>> [4/5] Khởi động lại container CRM Hiệp Hội (https://crm.ceohn10.viconnect.vn)..."
if [ -d "/root/ceohn10_crm" ]; then
    cd /root/ceohn10_crm
elif [ -d "$REPO_DIR/deploy/crm" ]; then
    cd "$REPO_DIR/deploy/crm"
else
    cd /root/crm
fi
docker compose -f docker-compose.yml stop 2>/dev/null || true
docker rm -f ceohn10-crm-frontend-prod ceohn10-crm-backend-prod crm-frontend-prod crm-backend-prod 2>/dev/null || true
docker compose -f docker-compose.yml up -d --force-recreate

echo ">>> [5/5] Tải lại Nginx SSL Reverse Proxy..."
cd /root/ssl-proxy
bash setup-ssl.sh

echo "=========================================================================="
echo " ĐÃ CẬP NHẬT SUBDOMAINS THÀNH CÔNG!"
echo " - Mobile Subdomain : https://ceohn10.viconnect.vn"
echo " - Web CRM Subdomain: https://crm_ceohn10.viconnect.vn (hoặc https://crm.ceohn10.viconnect.vn)"
echo " - Dev Link Mobile  : http://14.225.217.232:5020 | https://14.225.217.232:10444"
echo " - Dev Link CRM     : http://14.225.217.232:5022 | https://14.225.217.232:10443"
echo "=========================================================================="
