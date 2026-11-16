param (
    [string]$ServerIp = "14.225.217.232",
    [string]$ServerUser = "root",
    [string]$RemotePath = "~/ssl-proxy"
)

$ErrorActionPreference = "Stop"
$DEPLOY_DIR = $PSScriptRoot

Write-Host "=================================================================" -ForegroundColor Magenta
Write-Host "TRIEN KHAI NGINX REVERSE PROXY HTTPS / SSL LEN DEV SERVER..." -ForegroundColor Magenta
Write-Host "=================================================================" -ForegroundColor Magenta

# 0. Chuyen doi cac tep tin cau hinh sang Unix LF (tranh triet de loi CRLF \r\n cua Windows)
$cleanScript = @'
const fs = require('fs');
const path = require('path');
const dir = process.argv[1];
['nginx.conf', 'docker-compose.ssl.yml', 'setup-ssl.sh'].forEach(f => {
  const p = path.join(dir, f);
  if (fs.existsSync(p)) {
    const raw = fs.readFileSync(p, 'utf8');
    fs.writeFileSync(p, raw.replace(/\r\n/g, '\n').replace(/\r/g, '\n'), 'utf8');
  }
});
'@
node -e $cleanScript $DEPLOY_DIR

# 1. Tao thu muc tren server
Write-Host "`n[1/3] Tao thu muc $RemotePath tren may chu $ServerIp..." -ForegroundColor Cyan
ssh "${ServerUser}@${ServerIp}" "mkdir -p $RemotePath"

# 2. Dong bo cac tep tin cau hinh, chung chi SSL va kich ban thuc thi
Write-Host "`n[2/3] Dong bo cau hinh SSL cho Web CRM (10443), CEO HN10 (10444 / 10445)..." -ForegroundColor Cyan
$files = @(
    (Resolve-Path "$DEPLOY_DIR/nginx.conf").Path,
    (Resolve-Path "$DEPLOY_DIR/server.crt").Path,
    (Resolve-Path "$DEPLOY_DIR/server.key").Path,
    (Resolve-Path "$DEPLOY_DIR/docker-compose.ssl.yml").Path,
    (Resolve-Path "$DEPLOY_DIR/setup-ssl.sh").Path
)
$scpArgs = $files + "${ServerUser}@${ServerIp}:${RemotePath}/"
scp @scpArgs

# 3. Kich hoat Nginx SSL proxy va mo firewall cong 10443, 10444, 10445 truc tiep qua SSH
Write-Host "`n[3/3] Kich hoat Nginx SSL Proxy va mo tuong lua cong 10443, 10444, 10445..." -ForegroundColor Cyan

$remoteCommands = "cd $RemotePath && tr -d '\r' < setup-ssl.sh > run.sh && chmod +x run.sh && bash run.sh"
ssh "${ServerUser}@${ServerIp}" $remoteCommands

Write-Host "`n=================================================================" -ForegroundColor Green
Write-Host "KICH HOAT HTTPS CHO HE THONG CEO HN10 HOAN TAT!" -ForegroundColor Green
Write-Host "1. Subdomain Mobile App CEO HN10       : https://ceohn10.viconnect.vn" -ForegroundColor Yellow
Write-Host "2. Subdomain Web CRM Hiep Hoi CEO HN10 : https://crm_ceohn10.viconnect.vn (khi co DNS)" -ForegroundColor Yellow
Write-Host "3. Dev Link Mobile CEO HN10 (HTTPS)    : https://${ServerIp}:10444" -ForegroundColor Yellow
Write-Host "4. Dev Link Web CRM Hiep Hoi (HTTPS)   : https://${ServerIp}:10443" -ForegroundColor Green
Write-Host "   👉 Cong Dang Nhap Web CRM            : https://${ServerIp}:10443/auth" -ForegroundColor Green
Write-Host "5. Dev Link Frontend Truc Tiep (HTTP)  : http://${ServerIp}:5022" -ForegroundColor DarkGray
Write-Host "=================================================================" -ForegroundColor Green
$global:LASTEXITCODE = 0
