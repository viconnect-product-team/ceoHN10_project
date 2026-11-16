# =========================================================================
# SCRIPT DEPLOY DOC LAP: CEO HN10 MOBILE PWA HOI VIEN (1 LENH DUY NHAT)
# Ten mien chinh thuc: https://ceohn10.viconnect.vn
# Cong IP truc tiep:   https://14.225.217.232:10444
# Bat buoc:            HTTPS / SSL (cong 443 & 10444)
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

$mobileDeployScript = Join-Path $PSScriptRootCurrent "deploy/ceohn10/fast-deploy.ps1"
$sslDeployScript    = Join-Path $PSScriptRootCurrent "deploy/ssl/deploy-ssl.ps1"

Write-Host "=============================================================================" -ForegroundColor Green
Write-Host "  TRIEN KHAI MOBILE PWA HOI VIEN CEO HN10 (BAT BUOC HTTPS)" -ForegroundColor Green
Write-Host "  - Domain : https://ceohn10.viconnect.vn" -ForegroundColor White
Write-Host "  - Port IP: https://14.225.217.232:10444" -ForegroundColor Yellow
Write-Host "=============================================================================" -ForegroundColor Green

& $mobileDeployScript @PSBoundParameters -EnableHttps
if ($LASTEXITCODE -ne 0) {
    throw "Trien khai Mobile PWA that bai voi ma loi $LASTEXITCODE"
}

Write-Host "`n=============================================================================" -ForegroundColor Green
Write-Host "[OK] Trien khai Mobile PWA Hoi vien hoan tat thanh cong tren HTTPS!" -ForegroundColor Green
Write-Host "[*] Ten mien chinh thuc: https://ceohn10.viconnect.vn" -ForegroundColor White
Write-Host "[*] Truy cap IP truc tiep: https://14.225.217.232:10444" -ForegroundColor Yellow
Write-Host "=============================================================================" -ForegroundColor Green
