# =========================================================================
# SCRIPT DEPLOY 1 LỆNH DUY NHẤT CHO TOÀN BỘ DỰ ÁN CEO HN10
# Chạy cả Mobile PWA (ceohn10.viconnect.vn) & Web CRM (crm_ceohn10.viconnect.vn)
# =========================================================================

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

$scriptPath = Join-Path $PSScriptRoot "deploy/deploy-all.ps1"
& $scriptPath @PSBoundParameters
