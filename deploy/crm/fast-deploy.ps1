param (
    [switch]$SkipBuild,
    [switch]$SkipWebBuild,
    [switch]$FrontendOnly,
    [switch]$BackendOnly,
    [switch]$InstallDeps,
    [switch]$EnableHttps = $true,
    [switch]$NoHttps
)

if ($NoHttps) { $EnableHttps = $false }

# Thiet lap ma hoa UTF-8 cho console de khong bi loi font tieng Viet tren PowerShell
[Console]::OutputEncoding = [System.Text.Encoding]::UTF8
$OutputEncoding = [System.Text.Encoding]::UTF8
chcp 65001 > $null

# =========================================================================
# Kich ban trien khai doc lap Web CRM Platform CLB CEO HN10 (Huong 2 - Standalone Compose)
# Tach biet hoan toan khoi ViOne: Container rieng, Port 5004/5005 rieng, Compose rieng
# =========================================================================

$SERVER_IP   = "14.225.217.232"
$SERVER_USER = "root"
$REMOTE_PATH = "~/ceohn10_crm"

$DEPLOY_DIR = $PSScriptRoot
$ROOT_DIR   = (Resolve-Path "$PSScriptRoot/../..").Path

$ErrorActionPreference = "Stop"

function Invoke-CheckedCommand {
    param(
        [Parameter(Mandatory = $true)] [string]$Description,
        [Parameter(Mandatory = $true)] [scriptblock]$Action,
        [int]$MaxRetries = 1
    )
    $attempt = 1
    while ($true) {
        & $Action
        if ($LASTEXITCODE -eq 0) {
            break
        }
        if ($attempt -lt $MaxRetries) {
            Write-Host "`n[Canh bao] Tien trinh [$Description] tam thoi chua phan hoi (ma loi $LASTEXITCODE). Tu dong thu lai sau 3s (Lan $attempt/$MaxRetries)..." -ForegroundColor Yellow
            Start-Sleep -Seconds 3
            $attempt++
        } else {
            throw "Loi: Tien trinh [$Description] that bai voi ma loi $LASTEXITCODE sau $attempt lan thu."
        }
    }
}

$buildFE = -not $BackendOnly
$buildBE = -not $FrontendOnly

Push-Location $ROOT_DIR
try {
    if (-not $SkipBuild) {
        if ($buildFE) {
            if ($SkipWebBuild) {
                Write-Host "`n[0/5] Bo qua Build Frontend (Web) cuc bo (-SkipWebBuild)..." -ForegroundColor Yellow
            } else {
                Write-Host "`n[0/5] Build Frontend CRM Platform (Web) cuc bo voi Scope = crm_platform..." -ForegroundColor Cyan
                $env:NODE_OPTIONS = "--max-old-space-size=6144"
                $env:VITE_APP_SCOPE = "crm_platform"
                $env:VITE_APP_NAME = "CEO HN10 CRM Admin"
                if ($EnableHttps) {
                    $env:VITE_PUBLIC_APP_URL = "https://crm_ceohn10.viconnect.vn"
                } else {
                    $env:VITE_PUBLIC_APP_URL = "http://14.225.217.232:5004"
                }
                $env:NEST_API_URL = "http://ceohn10-crm-backend:4003"
                
                if ($InstallDeps -or (-not (Test-Path "node_modules"))) {
                    Invoke-CheckedCommand -Description "NPM Install" -Action { npm install }
                } else {
                    Write-Host "  -> Bo qua 'npm install' (da co node_modules). Dung -InstallDeps neu muon tai lai." -ForegroundColor DarkGray
                }

                Invoke-CheckedCommand -Description "Build Web CRM Platform" -Action { npm run build --prefix apps/ceohn10_app_fe }
            }
        }

        Write-Host "`n[1/5] Kiem tra Docker Engine va khoi tao quy trinh Build Docker Images..." -ForegroundColor Cyan
        
        # Kiem tra ket noi Docker Desktop voi co che Timeout chong treo tuyet doi
        $dockerHealthy = $false
        try {
            $testProc = Start-Process docker -ArgumentList "version" -NoNewWindow -PassThru -ErrorAction SilentlyContinue
            if ($testProc.WaitForExit(6000)) {
                $dockerHealthy = $true
            } else {
                if (-not $testProc.HasExited) {
                    $testProc.Kill()
                }
            }
        } catch {
            $dockerHealthy = $false
        }

        if (-not $dockerHealthy) {
            Write-Host "`n[CANH BAO NGHIEP VU] Docker Desktop tren may cuc bo dang KHONG PHAN HOI (hoac chua bat)!" -ForegroundColor Red
            Write-Host "--------------------------------------------------------------------------------" -ForegroundColor Red
            Write-Host "-> NGUYEN NHAN TREO: Tien trinh Docker Desktop tren Windows dang bi ket pipe ket noi voi WSL2." -ForegroundColor Yellow
            Write-Host "-> KHAC PHUC NHANH:" -ForegroundColor Yellow
            Write-Host "   1. Vui long mo/khoi dong lai ung dung Docker Desktop tren Windows." -ForegroundColor White
            Write-Host "   2. Doi bieu tuong con ca voi (whale icon) o khay he thong chuyen sang mau xanh (Engine running)." -ForegroundColor White
            Write-Host "   3. Thu lai lenh: .\deploy-crm.ps1" -ForegroundColor Green
            Write-Host "--------------------------------------------------------------------------------" -ForegroundColor Red
            throw "Dung tien trinh deploy vi Docker Desktop cuc bo khong phan hoi. Vui long mo lai Docker Desktop va thu lai."
        }

        if ($buildBE) {
            Invoke-CheckedCommand -Description "Xay dung Backend Image (ceohn10-crm-backend)" -Action {
                docker build -t ceohn10-crm-backend:latest -f Dockerfile.backend .
            }
        }
        if ($buildFE) {
            Invoke-CheckedCommand -Description "Xay dung Frontend Image (ceohn10-crm-frontend)" -Action {
                docker build --no-cache -t ceohn10-crm-frontend:latest -f "$DEPLOY_DIR/Dockerfile.frontend" .
            }
        }

        function Save-And-Compress-DockerImage {
            param(
                [Parameter(Mandatory = $true)] [string]$ImageName,
                [Parameter(Mandatory = $true)] [string]$OutGzPath
            )
            $gitGzip = "C:\Program Files\Git\usr\bin\gzip.exe"
            if (-not (Test-Path $gitGzip)) {
                $found = Get-Command gzip -ErrorAction SilentlyContinue
                if ($found) { $gitGzip = $found.Source }
            }

            if (Test-Path $gitGzip) {
                Write-Host "  -> Streaming truc tiep 'docker save | gzip -1' vao $OutGzPath..." -ForegroundColor Cyan
                cmd.exe /c "docker save $ImageName | `"$gitGzip`" -1 > `"$OutGzPath`""
                if ($LASTEXITCODE -ne 0 -or (-not (Test-Path $OutGzPath))) {
                    throw "Streaming Docker save that bai cho $ImageName"
                }
            } else {
                Write-Host "  -> Nen Node Stream vao $OutGzPath..." -ForegroundColor Cyan
                $nodeCompress = 'const fs = require("fs"); const zlib = require("zlib"); const { spawn } = require("child_process"); const proc = spawn("docker", ["save", process.argv[1]], { stdio: ["ignore", "pipe", "inherit"] }); const out = fs.createWriteStream(process.argv[2]); proc.stdout.pipe(zlib.createGzip({ level: 1 })).pipe(out); proc.on("close", (code) => { if (code !== 0) process.exit(code); });'
                node -e $nodeCompress $ImageName $OutGzPath
            }
        }

        Write-Host "`n[2/5] Xuat va nen Gzip (.tar.gz) toc do cao cho Web CRM Platform..." -ForegroundColor Cyan
        if ($buildBE) {
            Invoke-CheckedCommand -Description "Xuat & Nen Backend Image (.tar.gz)" -Action {
                Save-And-Compress-DockerImage -ImageName "ceohn10-crm-backend:latest" -OutGzPath "ceohn10-crm-backend.tar.gz"
            }
        }
        if ($buildFE) {
            Invoke-CheckedCommand -Description "Xay dung & Nen Frontend Image (.tar.gz)" -Action {
                Save-And-Compress-DockerImage -ImageName "ceohn10-crm-frontend:latest" -OutGzPath "ceohn10-crm-frontend.tar.gz"
            }
        }
    } else {
        Write-Host "`n[1-2/5] BO QUA quy trinh Build va dong goi (SkipBuild)..." -ForegroundColor Yellow
    }

    $SSH_OPTS = @("-o", "ConnectTimeout=30", "-o", "ServerAliveInterval=15", "-o", "ServerAliveCountMax=3")

    Write-Host "`n[3/5] Khoi tao thu muc va dong bo tep tin doc lap len may chu ha tang ($SERVER_IP)..." -ForegroundColor Cyan

    Invoke-CheckedCommand -Description "Tao thu muc ~/crm tren server" -MaxRetries 3 -Action {
        ssh @SSH_OPTS "${SERVER_USER}@${SERVER_IP}" "mkdir -p $REMOTE_PATH"
    }

    # Dam bao co tep tin .env.crm cuc bo
    Copy-Item "$DEPLOY_DIR/.env.production" "$DEPLOY_DIR/.env.crm" -Force -ErrorAction SilentlyContinue

    $filesToUpload = @(
        (Resolve-Path "$DEPLOY_DIR/.env.production").Path,
        (Resolve-Path "$DEPLOY_DIR/.env.crm").Path,
        (Resolve-Path "$DEPLOY_DIR/docker-compose.yml").Path
    )
    if (-not $SkipBuild) {
        if ($buildBE -and (Test-Path "ceohn10-crm-backend.tar.gz")) { $filesToUpload += (Resolve-Path "ceohn10-crm-backend.tar.gz").Path }
        if ($buildFE -and (Test-Path "ceohn10-crm-frontend.tar.gz")) { $filesToUpload += (Resolve-Path "ceohn10-crm-frontend.tar.gz").Path }
    }

    $scpArgs = @() + $SSH_OPTS + $filesToUpload + "${SERVER_USER}@${SERVER_IP}:${REMOTE_PATH}/"
    Invoke-CheckedCommand -Description "Chuyen giao tep tin qua SCP vao ~/crm" -MaxRetries 3 -Action {
        scp @scpArgs
    }

    Write-Host "`n[4/5] Kich hoat Docker Compose rieng cho Web CRM Platform tu xa thong qua SSH..." -ForegroundColor Cyan

    $remoteLoadCmd = ""
    if ($buildBE -and (Test-Path "ceohn10-crm-backend.tar.gz")) {
        $remoteLoadCmd += "if [ -f ceohn10-crm-backend.tar.gz ]; then docker load -i ceohn10-crm-backend.tar.gz && rm -f ceohn10-crm-backend.tar.gz; fi; "
    }
    if ($buildFE -and (Test-Path "ceohn10-crm-frontend.tar.gz")) {
        $remoteLoadCmd += "if [ -f ceohn10-crm-frontend.tar.gz ]; then docker load -i ceohn10-crm-frontend.tar.gz && rm -f ceohn10-crm-frontend.tar.gz; fi; "
    }

    $REMOTE_CMD = "cd $REMOTE_PATH; cp -f .env.production .env.crm 2>/dev/null || true; touch .env.crm; sed -i 's/\r//g' .env.crm docker-compose.yml; docker network create ceohn10-network 2>/dev/null || true; $remoteLoadCmd docker compose -f docker-compose.yml stop 2>/dev/null || true; docker rm -f ceohn10-crm-frontend-prod ceohn10-crm-backend-prod 2>/dev/null || true; docker compose -f docker-compose.yml up -d --force-recreate"

    Invoke-CheckedCommand -Description "Thuc thi cau truc container doc lap Web CRM Platform" -MaxRetries 3 -Action {
        ssh @SSH_OPTS "${SERVER_USER}@${SERVER_IP}" $REMOTE_CMD
    }

    Write-Host "`n[5/5] Don dep bo nho dem tam thoi tai may cuc bo..." -ForegroundColor Cyan
    Remove-Item ceohn10-crm-backend.tar.gz, ceohn10-crm-frontend.tar.gz, ceohn10-crm-backend.tar, ceohn10-crm-frontend.tar, crm-backend.tar.gz, crm-frontend.tar.gz -ErrorAction SilentlyContinue

    if ($EnableHttps) {
        Write-Host "`n[BO SUNG] Dong bo Nginx Reverse Proxy SSL / HTTPS..." -ForegroundColor Magenta
        & "$DEPLOY_DIR/../ssl/deploy-ssl.ps1"
    }

    Write-Host "=================================================================" -ForegroundColor Green
    Write-Host "TRIEN KHAI DOC LAP WEB CRM PLATFORM VA LANDING CEO HN10 THANH CONG!" -ForegroundColor Green
    if ($EnableHttps) {
        Write-Host "Cong Frontend CRM (HTTPS): https://${SERVER_IP}:10443" -ForegroundColor Yellow
        Write-Host "Cong Dang Nhap Web CRM   : https://${SERVER_IP}:10443/auth" -ForegroundColor Green
        Write-Host "Cong Frontend CRM (HTTP) : http://${SERVER_IP}:5022" -ForegroundColor DarkGray
    } else {
        Write-Host "Cong Frontend CRM : http://${SERVER_IP}:5022" -ForegroundColor Yellow
    }
    Write-Host "Cong Backend CRM  : http://${SERVER_IP}:5023" -ForegroundColor Yellow
    Write-Host "=================================================================" -ForegroundColor Green
    $global:LASTEXITCODE = 0
} finally {
    Pop-Location
}
