param (
    [switch]$SkipBuild,
    [switch]$SkipWebBuild,
    [switch]$FrontendOnly,
    [switch]$BackendOnly,
    [switch]$InstallDeps,
    [switch]$EnableHttps = $true,
    [switch]$NoHttps,
    [switch]$MobileOnly,
    [switch]$CrmOnly
)

if ($NoHttps) { $EnableHttps = $false }

# Thiết lập mã hóa UTF-8 cho console để không bị lỗi font tiếng Việt trên PowerShell
[Console]::OutputEncoding = [System.Text.Encoding]::UTF8
$OutputEncoding = [System.Text.Encoding]::UTF8
chcp 65001 > $null

# =========================================================================
# KỊCH BẢN TRIỂN KHAI TỔNG THỂ HỆ THỐNG CEO HN10 TRÊN SERVER DEV 14.225.217.232
# CHẠY 1 LỆNH DUY NHẤT ĐỒNG THỜI CHO CẢ 2 PHÂN HỆ:
# 1. Mobile PWA Học viên: https://ceohn10.viconnect.vn (Scope: association_app)
# 2. Web CRM Quản trị:    https://crm_ceohn10.viconnect.vn (Scope: crm_platform)
# Cơ sở dữ liệu chuẩn:    PostgreSQL 113.20.107.184:6432 (ceohn10_project)
# =========================================================================

$SERVER_IP   = "14.225.217.232"
$SERVER_USER = "root"

$ROOT_DIR    = (Resolve-Path "$PSScriptRoot/..").Path
$DEPLOY_DIR  = "$ROOT_DIR/deploy"

$ErrorActionPreference = "Stop"

Write-Host "=============================================================================" -ForegroundColor Cyan
Write-Host "  TRIỂN KHAI TỔNG THỂ HỆ THỐNG CEO HN10 (DEV SERVER $SERVER_IP)" -ForegroundColor Cyan
Write-Host "  1 LỆNH DUY NHẤT CHO CẢ MOBILE PWA & CỔNG QUẢN TRỊ WEB CRM" -ForegroundColor Cyan
Write-Host "=============================================================================" -ForegroundColor Cyan
Write-Host "  - Mobile PWA Học viên:  https://ceohn10.viconnect.vn" -ForegroundColor Yellow
Write-Host "  - Web CRM Quản trị:     https://crm_ceohn10.viconnect.vn" -ForegroundColor Yellow
Write-Host "  - Cơ sở dữ liệu chuẩn:  PostgreSQL 113.20.107.184:6432 (ceohn10_project)" -ForegroundColor Yellow
Write-Host "=============================================================================" -ForegroundColor Cyan

Push-Location $ROOT_DIR
try {
    # ── BƯỚC 0: CÀI ĐẶT THƯ VIỆN NẾU YÊU CẦU ──
    if ($InstallDeps) {
        Write-Host "`n[0/4] Cài đặt dependencies toàn dự án (npm install)..." -ForegroundColor Cyan
        npm install
    }

    # ── BƯỚC 1: TRIỂN KHAI PHÂN HỆ MOBILE PWA Học viên ──
    if (-not $CrmOnly) {
        Write-Host "`n>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>" -ForegroundColor Green
        Write-Host "[GIAI ĐOẠN 1/3] TRIỂN KHAI PHÂN HỆ MOBILE PWA Học viên CEO HN10..." -ForegroundColor Green
        Write-Host ">>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>" -ForegroundColor Green

        $mobileArgs = @{
            SkipBuild     = $SkipBuild
            SkipWebBuild  = $SkipWebBuild
            FrontendOnly  = $FrontendOnly
            BackendOnly   = $BackendOnly
            EnableHttps   = $false # Sẽ chạy Nginx SSL một lần duy nhất ở bước cuối
            NoHttps       = $true
        }

        & "$DEPLOY_DIR/ceohn10/fast-deploy.ps1" @mobileArgs
        if ($LASTEXITCODE -ne 0) {
            throw "Triển khai Mobile PWA thất bại với mã lỗi $LASTEXITCODE"
        }
    } else {
        Write-Host "`n[Bỏ qua] Giai đoạn Mobile PWA (-CrmOnly được chỉ định)..." -ForegroundColor DarkGray
    }

    # ── BƯỚC 2: TRIỂN KHAI PHÂN HỆ WEB CRM QUẢN TRỊ ──
    if (-not $MobileOnly) {
        Write-Host "`n>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>" -ForegroundColor Magenta
        Write-Host "[GIAI ĐOẠN 2/3] TRIỂN KHAI PHÂN HỆ CỔNG QUẢN TRỊ WEB CRM CEO HN10..." -ForegroundColor Magenta
        Write-Host ">>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>" -ForegroundColor Magenta

        $crmArgs = @{
            SkipBuild     = $SkipBuild
            SkipWebBuild  = $SkipWebBuild
            FrontendOnly  = $FrontendOnly
            BackendOnly   = $BackendOnly
            EnableHttps   = $false # Sẽ chạy Nginx SSL một lần duy nhất ở bước cuối
            NoHttps       = $true
        }

        & "$DEPLOY_DIR/crm/fast-deploy.ps1" @crmArgs
        if ($LASTEXITCODE -ne 0) {
            throw "Triển khai Web CRM thất bại với mã lỗi $LASTEXITCODE"
        }
    } else {
        Write-Host "`n[Bỏ qua] Giai đoạn Web CRM (-MobileOnly được chỉ định)..." -ForegroundColor DarkGray
    }

    # ── BƯỚC 3: ĐỒNG BỘ NGINX REVERSE PROXY SSL (PORT 80 & 443) ──
    if ($EnableHttps) {
        Write-Host "`n>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>" -ForegroundColor Yellow
        Write-Host "[GIAI ĐOẠN 3/3] ĐỒNG BỘ NGINX REVERSE PROXY SSL / HTTPS..." -ForegroundColor Yellow
        Write-Host ">>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>" -ForegroundColor Yellow

        & "$DEPLOY_DIR/ssl/deploy-ssl.ps1" -ServerIp $SERVER_IP -ServerUser $SERVER_USER
        if ($LASTEXITCODE -ne 0) {
            Write-Host "[Cảnh báo] Kích hoạt Nginx SSL trả về mã $LASTEXITCODE, hãy kiểm tra logs trên máy chủ." -ForegroundColor Yellow
        }
    }

    # ── TỔNG KẾT VÀ HƯỚNG DẪN KIỂM THỬ ──
    Write-Host "`n=============================================================================" -ForegroundColor Green
    Write-Host "🎉 CHÚC MỪNG: HỆ THỐNG CEO HN10 ĐÃ TRIỂN KHAI HOÀN TẤT THÀNH CÔNG!" -ForegroundColor Green
    Write-Host "=============================================================================" -ForegroundColor Green
    Write-Host "1. 📱 MOBILE PWA Học viên (Giao diện chuẩn App di động, độc lập CRM):" -ForegroundColor Cyan
    Write-Host "   👉 Tên miền chính thức : https://ceohn10.viconnect.vn" -ForegroundColor White
    Write-Host "   👉 Truy cập trực tiếp IP: https://${SERVER_IP}:10444" -ForegroundColor Yellow
    Write-Host "   📌 Hướng dẫn cài đặt lên màn hình chính điện thoại (A2HS):" -ForegroundColor Yellow
    Write-Host "      - Trên Android (Chrome/Edge): App sẽ hiện banner 'Cài đặt App CEO HN10'. Bấm 'Cài ngay' để tự động cài đặt 1 chạm!" -ForegroundColor White
    Write-Host "      - Trên iPhone (Safari): Mở Safari, bấm nút Chia sẻ (⎋) ở thanh công cụ dưới -> Chọn 'Thêm vào MH chính'." -ForegroundColor White
    Write-Host "      - Ứng dụng chạy toàn màn hình độc lập (Standalone PWA), có Push Notif, Thẻ QR, Offline Cache." -ForegroundColor DarkGray
    Write-Host ""
    Write-Host "2. 💻 CỔNG QUẢN TRỊ WEB CRM (Dành cho Chủ tịch, BĐH, Thư ký, Kế toán):" -ForegroundColor Magenta
    Write-Host "   👉 Tên miền chính thức : https://crm_ceohn10.viconnect.vn (hoặc https://crm.ceohn10.viconnect.vn)" -ForegroundColor White
    Write-Host "   👉 Truy cập trực tiếp IP: https://${SERVER_IP}:10443" -ForegroundColor Yellow
    Write-Host "   👉 Tính năng: Bảng biểu Excel, Recharts phân tích tài chính 2 túi quỹ, quản lý sự kiện, điểm danh QR, phê duyệt tài trợ." -ForegroundColor White
    Write-Host ""
    Write-Host "3. 🗄️ CƠ SỞ DỮ LIỆU ĐỒNG BỘ DUY NHẤT:" -ForegroundColor Blue
    Write-Host "   👉 PostgreSQL chuẩn: 113.20.107.184:6432 (ceohn10_project)" -ForegroundColor White
    Write-Host "=============================================================================" -ForegroundColor Green

} finally {
    Pop-Location
}
