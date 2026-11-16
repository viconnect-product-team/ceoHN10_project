# =========================================================================
# SCRIPT DEPLOY DOC LAP: CONG QUAN TRI WEB CRM CEO HN10 (1 LENH DUY NHAT)
# Ten mien chinh thuc: https://crm_ceohn10.viconnect.vn
# Cong IP truc tiep:   https://14.225.217.232:10443
# Bat buoc:            HTTPS / SSL (cong 443 & 10443)
# Co so du lieu chuan: PostgreSQL 113.20.107.184:6432 (ceohn10_project)
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
Write-Host "  TRIEN KHAI CONG QUAN TRI WEB CRM CEO HN10 (BAT BUOC HTTPS)" -ForegroundColor Magenta
Write-Host "  - Port IP Chinh  : https://14.225.217.232:10443" -ForegroundColor Yellow
Write-Host "  - Dang Nhap      : https://14.225.217.232:10443/auth" -ForegroundColor Green
Write-Host "  - Domain du phong: https://crm_ceohn10.viconnect.vn (khi cau hinh DNS)" -ForegroundColor DarkGray
Write-Host "=============================================================================" -ForegroundColor Magenta

& $crmDeployScript @PSBoundParameters -EnableHttps
if ($LASTEXITCODE -ne 0) {
    throw "Trien khai Web CRM that bai voi ma loi $LASTEXITCODE"
}

Write-Host "`n=============================================================================" -ForegroundColor Green
Write-Host "[OK] Trien khai Cong Quan tri Web CRM hoan tat thanh cong tren HTTPS!" -ForegroundColor Green
Write-Host "[*] Truy cap IP truc tiep: https://14.225.217.232:10443" -ForegroundColor Yellow
Write-Host "[*] Cong Dang Nhap       : https://14.225.217.232:10443/auth" -ForegroundColor Green
Write-Host "=============================================================================" -ForegroundColor Green
