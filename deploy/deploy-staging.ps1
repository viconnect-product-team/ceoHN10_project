param (
    [switch]$SkipBuild,
    [switch]$FrontendOnly,
    [switch]$BackendOnly,
    [string]$ServerIp = "14.225.217.232",
    [string]$ServerUser = "root"
)

# Thiết lập mã hóa UTF-8 cho console PowerShell
[Console]::OutputEncoding = [System.Text.Encoding]::UTF8
$OutputEncoding = [System.Text.Encoding]::UTF8
chcp 65001 > $null

$ROOT_DIR = (Resolve-Path "$PSScriptRoot/..").Path
$DEPLOY_DIR = "$ROOT_DIR/deploy"
$ErrorActionPreference = "Stop"

Write-Host "=============================================================================" -ForegroundColor Cyan
Write-Host "  TRIỂN KHAI MÔI TRƯỜNG TEST STAGING - CLB DOANH NHÂN CEO HN10" -ForegroundColor Cyan
Write-Host "  MÁY CHỦ DEV: $ServerIp | SUBDOMAIN: staging.ceohn10.viconnect.vn" -ForegroundColor Cyan
Write-Host "=============================================================================" -ForegroundColor Cyan
Write-Host "  - Staging Frontend: https://staging.ceohn10.viconnect.vn" -ForegroundColor Yellow
Write-Host "  - Staging Backend:  https://staging-api.ceohn10.viconnect.vn (Port 3001)" -ForegroundColor Yellow
Write-Host "  - Test Database:    PostgreSQL 5433 (ceohn10_project_test - Độc lập)" -ForegroundColor Yellow
Write-Host "=============================================================================" -ForegroundColor Cyan

Push-Location $ROOT_DIR
try {
    # ── BƯỚC 1: BUILD FRONTEND CHO STAGING (NẾU KHÔNG SKIP) ──
    if (-not $SkipBuild -and -not $BackendOnly) {
        Write-Host "`n[1/3] Đang build Frontend cho môi trường Staging..." -ForegroundColor Green
        Push-Location "$ROOT_DIR/apps/ceohn10_app_fe"
        try {
            $env:VITE_APP_ENV = "staging"
            $env:VITE_API_URL = "https://staging-api.ceohn10.viconnect.vn"
            npm run build
            if ($LASTEXITCODE -ne 0) { throw "Build frontend thất bại" }
            Write-Host "✅ Build Frontend Staging hoàn tất!" -ForegroundColor Green
        } finally {
            Pop-Location
        }
    }

    # ── BƯỚC 2: BUILD BACKEND CHO STAGING (NẾU KHÔNG SKIP) ──
    if (-not $SkipBuild -and -not $FrontendOnly) {
        Write-Host "`n[2/3] Đang build Backend cho môi trường Staging..." -ForegroundColor Magenta
        Push-Location "$ROOT_DIR/apps/ceohn10_app_be"
        try {
            $env:NODE_ENV = "test"
            npm run build
            if ($LASTEXITCODE -ne 0) { throw "Build backend thất bại" }
            Write-Host "✅ Build Backend Staging hoàn tất!" -ForegroundColor Magenta
        } finally {
            Pop-Location
        }
    }

    # ── BƯỚC 3: TRIỂN KHAI VÀ KHỞI ĐỘNG CÁC CONTAINER STAGING ──
    Write-Host "`n[3/3] Đang khởi động hạ tầng Staging độc lập với docker-compose.test.yml..." -ForegroundColor Cyan
    docker compose -f "$DEPLOY_DIR/docker-compose.test.yml" up -d --build
    if ($LASTEXITCODE -ne 0) {
        Write-Host "[Cảnh báo] docker-compose trả về mã $LASTEXITCODE hoặc đang deploy remote." -ForegroundColor Yellow
    }

    Write-Host "`n=============================================================================" -ForegroundColor Green
    Write-Host "🎉 HOÀN TẤT TRIỂN KHAI MÔI TRƯỜNG TEST STAGING CEO HN10!" -ForegroundColor Green
    Write-Host "=============================================================================" -ForegroundColor Green
    Write-Host "  - Domain Staging: https://staging.ceohn10.viconnect.vn" -ForegroundColor White
    Write-Host "  - Môi trường được cách ly an toàn, độc lập với CSDL Production." -ForegroundColor DarkGray
    Write-Host "=============================================================================" -ForegroundColor Green
} finally {
    Pop-Location
}
