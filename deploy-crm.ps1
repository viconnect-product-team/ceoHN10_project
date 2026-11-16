# =========================================================================
# SCRIPT DEPLOY ĐỘC LẬP: CỔNG QUẢN TRỊ WEB CRM CEO HN10 (1 LỆNH DUY NHẤT)
# Tên miền chính thức: https://crm_ceohn10.viconnect.vn (hoặc https://crm.ceohn10.viconnect.vn)
# Cổng IP trực tiếp:   https://14.225.217.232:10443
# Bắt buộc:            HTTPS / SSL (cổng 443 & 10443)
# Cơ sở dữ liệu chuẩn: PostgreSQL 113.20.107.184:6432 (ceohn10_project)
# =========================================================================

param (
    [switch]$SkipBuild,
    [switch]$SkipWebBuild,
    [switch]$FrontendOnly,
    [switch]$BackendOnly,
    [switch]$InstallDeps
)

[Console]::OutputEncoding = [System.Text.Encoding]::UTF8
$OutputEncoding = [System.Text.Encoding]::UTF8
chcp 65001 > $null

$PSScriptRootCurrent = $PSScriptRoot
if (-not $PSScriptRootCurrent) { $PSScriptRootCurrent = "." }

$crmDeployScript = Join-Path $PSScriptRootCurrent "deploy/crm/fast-deploy.ps1"
$sslDeployScript = Join-Path $PSScriptRootCurrent "deploy/ssl/deploy-ssl.ps1"

Write-Host "=============================================================================" -ForegroundColor Magenta
Write-Host "  TRIỂN KHAI CỔNG QUẢN TRỊ WEB CRM CEO HN10 (BẮT BUỘC HTTPS)" -ForegroundColor Magenta
Write-Host "  - Port IP Chính : https://14.225.217.232:10443" -ForegroundColor Yellow
Write-Host "  - Đăng Nhập     : https://14.225.217.232:10443/auth" -ForegroundColor Green
Write-Host "  - Domain dự phòng: https://crm_ceohn10.viconnect.vn (khi cấu hình DNS)" -ForegroundColor DarkGray
Write-Host "=============================================================================" -ForegroundColor Magenta

& $crmDeployScript @PSBoundParameters -EnableHttps
if ($LASTEXITCODE -ne 0) {
    throw "Triển khai Web CRM thất bại với mã lỗi $LASTEXITCODE"
}

Write-Host "`n=============================================================================" -ForegroundColor Green
Write-Host "[OK] Trien khai Cong Quan tri Web CRM hoan tat thanh cong tren HTTPS!" -ForegroundColor Green
Write-Host "[*] Truy cap IP truc tiep: https://14.225.217.232:10443" -ForegroundColor Yellow
Write-Host "[*] Cong Dang Nhap       : https://14.225.217.232:10443/auth" -ForegroundColor Green
Write-Host "=============================================================================" -ForegroundColor Green
