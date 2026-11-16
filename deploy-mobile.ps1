# =========================================================================
# SCRIPT DEPLOY ĐỘC LẬP: CEO HN10 MOBILE PWA HỘI VIÊN (1 LỆNH DUY NHẤT)
# Tên miền chính thức: https://ceohn10.viconnect.vn
# Cổng IP trực tiếp:   https://14.225.217.232:10444
# Bắt buộc:            HTTPS / SSL (cổng 443 & 10444)
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

$mobileDeployScript = Join-Path $PSScriptRootCurrent "deploy/ceohn10/fast-deploy.ps1"
$sslDeployScript    = Join-Path $PSScriptRootCurrent "deploy/ssl/deploy-ssl.ps1"

Write-Host "=============================================================================" -ForegroundColor Green
Write-Host "  TRIỂN KHAI MOBILE PWA HỘI VIÊN CEO HN10 (BẮT BUỘC HTTPS)" -ForegroundColor Green
Write-Host "  - Domain: https://ceohn10.viconnect.vn" -ForegroundColor White
Write-Host "  - Port IP: https://14.225.217.232:10444" -ForegroundColor Yellow
Write-Host "=============================================================================" -ForegroundColor Green

& $mobileDeployScript @PSBoundParameters -EnableHttps
if ($LASTEXITCODE -ne 0) {
    throw "Triển khai Mobile PWA thất bại với mã lỗi $LASTEXITCODE"
}

Write-Host "`n=============================================================================" -ForegroundColor Green
Write-Host "[OK] Trien khai Mobile PWA Hoi vien hoan tat thanh cong tren HTTPS!" -ForegroundColor Green
Write-Host "[*] Ten mien chinh thuc: https://ceohn10.viconnect.vn" -ForegroundColor White
Write-Host "[*] Truy cap IP truc tiep: https://14.225.217.232:10444" -ForegroundColor Yellow
Write-Host "=============================================================================" -ForegroundColor Green
