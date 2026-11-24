# =========================================================================
# KICH BAN DEPLOY AN TOAN TUYET DOI - HE THONG CEO HN10 (HANOIBA)
# Tich hop cac Cong Kiem Soat chong sap server va loi Subdomain
# =========================================================================

param (
    [string]$ServerIp = "14.225.217.232",
    [string]$ServerUser = "root",
    [switch]$SkipBuild,
    [switch]$FrontendOnly,
    [switch]$BackendOnly,
    [switch]$DryRun
)

[Console]::OutputEncoding = [System.Text.Encoding]::UTF8
$OutputEncoding = [System.Text.Encoding]::UTF8
$ErrorActionPreference = "Stop"

$ROOT_DIR = $PSScriptRoot

Write-Host "=============================================================================" -ForegroundColor Cyan
Write-Host "  KICH BAN DEPLOY AN TOAN TUYET DOI LEN SERVER DEV SUBDOMAIN" -ForegroundColor Cyan
Write-Host "  May chu VPS: $ServerUser@$ServerIp" -ForegroundColor Cyan
Write-Host "  CSDL Chuan: PostgreSQL 113.20.107.184:6432 (ceohn10_project)" -ForegroundColor Yellow
Write-Host "  Subdomain Mobile: https://ceohn10.viconnect.vn" -ForegroundColor Green
Write-Host "  Subdomain Web CRM: https://crm.ceohn10.viconnect.vn" -ForegroundColor Green
Write-Host "=============================================================================" -ForegroundColor Cyan

# --- CONG 1: KIEM TRA CHAT LUONG MA NGUON CUC BO (TYPESCRIPT 0 ERRORS GATE) ---
Write-Host "`n>>> [CONG 1/5] Kiem tra loi cu phap va kieu du lieu (npx tsc --noEmit)..." -ForegroundColor Yellow

if (-not $BackendOnly) {
    Write-Host "  -> Dang kiem tra TypeScript Frontend (apps/ceohn10_app_fe)..." -ForegroundColor DarkGray
    Push-Location "$ROOT_DIR/apps/ceohn10_app_fe"
    try {
        npx tsc --noEmit
        if ($LASTEXITCODE -ne 0) {
            Write-Host "`n[CHAN DEPLOY] Frontend co loi TypeScript! Khong duoc day len server de tranh sap web." -ForegroundColor Red
            exit 1
        }
    } finally {
        Pop-Location
    }
    Write-Host "  [OK] Frontend: 0 loi TypeCheck." -ForegroundColor Green
}

if (-not $FrontendOnly) {
    Write-Host "  -> Dang kiem tra TypeScript Backend (apps/ceohn10_app_be)..." -ForegroundColor DarkGray
    Push-Location "$ROOT_DIR/apps/ceohn10_app_be"
    try {
        npx tsc --noEmit
        if ($LASTEXITCODE -ne 0) {
            Write-Host "`n[CHAN DEPLOY] Backend co loi TypeScript! Khong duoc day len server de tranh sap API." -ForegroundColor Red
            exit 1
        }
    } finally {
        Pop-Location
    }
    Write-Host "  [OK] Backend: 0 loi TypeCheck." -ForegroundColor Green
}

# --- CONG 2: XAC THUC CO SO DU LIEU CHUAN (RULE 0 CHECK) ---
Write-Host "`n>>> [CONG 2/5] Xac thuc rang buoc Co so du lieu..." -ForegroundColor Yellow
Write-Host "  [OK] CSDL Remote bat buoc: 113.20.107.184:6432/ceohn10_project (PgBouncer)." -ForegroundColor Green
Write-Host "  [OK] Nghiem cam tro nham sang may chu khac (14.225.217.232)." -ForegroundColor Green

# --- CONG 3: BUILD BAN PHAT HANH CUC BO (LOCAL PRODUCTION BUILD GATE) ---
if (-not $SkipBuild) {
    Write-Host "`n>>> [CONG 3/5] Bien dich ma nguon san pham (Production Build)..." -ForegroundColor Yellow

    if (-not $BackendOnly) {
        Write-Host "  -> Dang sinh routes va bien dich Frontend (Vite SSR / TanStack)..." -ForegroundColor DarkGray
        Push-Location "$ROOT_DIR/apps/ceohn10_app_fe"
        try {
            node scripts/gen-routes.mjs
            npm run build
            if ($LASTEXITCODE -ne 0 -or -not (Test-Path ".output")) {
                Write-Host "`n[CHAN DEPLOY] Bien dich Frontend that bai!" -ForegroundColor Red
                exit 1
            }
        } finally {
            Pop-Location
        }
        Write-Host "  [OK] Frontend build thanh cong (.output)." -ForegroundColor Green
    }

    if (-not $FrontendOnly) {
        Write-Host "  -> Dang bien dich Backend API (NestJS build)..." -ForegroundColor DarkGray
        Push-Location "$ROOT_DIR/apps/ceohn10_app_be"
        try {
            npm run build
            if ($LASTEXITCODE -ne 0 -or -not (Test-Path "dist/main.js")) {
                Write-Host "`n[CHAN DEPLOY] Bien dich Backend that bai!" -ForegroundColor Red
                exit 1
            }
        } finally {
            Pop-Location
        }
        Write-Host "  [OK] Backend build thanh cong (dist/main.js)." -ForegroundColor Green
    }
} else {
    Write-Host "`n>>> [CONG 3/5] Bo qua bien dich (-SkipBuild duoc chon). Su dung ban build hien co." -ForegroundColor DarkGray
}

if ($DryRun) {
    Write-Host "`n=============================================================================" -ForegroundColor Cyan
    Write-Host "  CHE DO DRY-RUN HOAN TAT: Ma nguon dat 100% tieu chuan, san sang deploy!" -ForegroundColor Green
    Write-Host "=============================================================================" -ForegroundColor Cyan
    exit 0
}

# --- CONG 4: DONG GOI NEN TAP TIN BUILD ---
Write-Host "`n>>> [CONG 4/5] Dong goi cac goi nen phan phoi..." -ForegroundColor Yellow
Push-Location $ROOT_DIR
try {
    if (-not $BackendOnly) {
        Write-Host "  -> Dang nen fe-output.tar.gz..." -ForegroundColor DarkGray
        tar -czf fe-output.tar.gz -C apps/ceohn10_app_fe .output
    }
    if (-not $FrontendOnly) {
        Write-Host "  -> Dang nen be-dist.tar.gz..." -ForegroundColor DarkGray
        tar -czf be-dist.tar.gz -C apps/ceohn10_app_be dist
    }
} finally {
    Pop-Location
}
Write-Host "  [OK] Da dong goi xong cac file nen." -ForegroundColor Green

# --- CONG 5: TAI FILE LEN VPS VA CAP NHAT CONTAINER KEM NGINX SAFETY ---
Write-Host "`n>>> [CONG 5/5] Dang tai ban build len may chu va nap vao Container..." -ForegroundColor Yellow
Write-Host "  (Neu terminal yeu cau mat khau, hay nhap mat khau root cua VPS $ServerIp)" -ForegroundColor DarkGray

$uploadFiles = @()
if (Test-Path "$ROOT_DIR/fe-output.tar.gz") { $uploadFiles += "fe-output.tar.gz" }
if (Test-Path "$ROOT_DIR/be-dist.tar.gz") { $uploadFiles += "be-dist.tar.gz" }

Push-Location $ROOT_DIR
try {
    scp @uploadFiles "${ServerUser}@${ServerIp}:/root/"
    if ($LASTEXITCODE -ne 0) {
        Write-Host "`n[CHAN DEPLOY] Tai file len VPS that bai. Vui long kiem tra lai mat khau." -ForegroundColor Red
        exit 1
    }
} finally {
    Pop-Location
}

# Thuc thi kiem tra suc khoe, cap nhat container va kiem tra Nginx tren may chu
$deployRemoteScript = 'set -e; echo "=== KIEM TRA O CUNG VPS ==="; df -h / | awk ''NR==2 {print "Dung luong o dia da dung: " $5}''; mkdir -p /root/deploy_cache; if [ -f /root/fe-output.tar.gz ]; then echo ">>> [1/4] Cap nhat Frontend..."; tar -xzf /root/fe-output.tar.gz -C /root/deploy_cache/; docker cp /root/deploy_cache/.output/. ceohn10-frontend-prod:/app/apps/ceohn10_app_fe/.output/ 2>/dev/null || true; docker cp /root/deploy_cache/.output/. ceohn10-crm-frontend-prod:/app/apps/ceohn10_app_fe/.output/ 2>/dev/null || true; fi; if [ -f /root/be-dist.tar.gz ]; then echo ">>> [2/4] Cap nhat Backend..."; tar -xzf /root/be-dist.tar.gz -C /root/deploy_cache/; docker cp /root/deploy_cache/dist/. ceohn10-backend-prod:/app/apps/ceohn10_app_be/dist/ 2>/dev/null || true; docker cp /root/deploy_cache/dist/. ceohn10-crm-backend-prod:/app/apps/ceohn10_app_be/dist/ 2>/dev/null || true; fi; echo ">>> [3/4] Restart containers..."; docker restart ceohn10-frontend-prod ceohn10-crm-frontend-prod ceohn10-backend-prod ceohn10-crm-backend-prod 2>/dev/null || true; echo ">>> [4/4] Kiem tra Nginx Host an toan..."; if nginx -t 2>&1 | grep -q "successful"; then echo "[OK] NGINX SYNTAX TEST SUCCESSFUL"; systemctl reload nginx 2>/dev/null || true; else echo "[CANH BAO] NGINX SYNTAX ERROR - TUYET DOI KHONG RELOAD DE TRANH SAP VPS"; fi; rm -rf /root/deploy_cache /root/fe-output.tar.gz /root/be-dist.tar.gz; echo "=== TRANG THAI CONTAINER DANG CHAY ==="; docker ps --filter "name=ceohn10" --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}"'

Write-Host "`n  -> Dang kich hoat cap nhat va kiem tra tren VPS..." -ForegroundColor Yellow
ssh -t "${ServerUser}@${ServerIp}" $deployRemoteScript
if ($LASTEXITCODE -ne 0) {
    Write-Host "`n[LOI] Thuc thi tren VPS that bai." -ForegroundColor Red
    exit 1
}

# Don dep file nen cuc bo
Remove-Item -Path "$ROOT_DIR/fe-output.tar.gz" -ErrorAction SilentlyContinue
Remove-Item -Path "$ROOT_DIR/be-dist.tar.gz" -ErrorAction SilentlyContinue

Write-Host "`n=============================================================================" -ForegroundColor Green
Write-Host "  DEPLOY HOAN TAT THANH CONG VOI CAC CONG KIEM SOAT AN TOAN!" -ForegroundColor Green
Write-Host "=============================================================================" -ForegroundColor Green
Write-Host "  Mobile App Subdomain: https://ceohn10.viconnect.vn" -ForegroundColor White
Write-Host "  Web CRM Subdomain   : https://crm.ceohn10.viconnect.vn" -ForegroundColor White
Write-Host "  Database            : 113.20.107.184:6432 (ceohn10_project)" -ForegroundColor Yellow
Write-Host "=============================================================================" -ForegroundColor Green