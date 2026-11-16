Add-Type -AssemblyName System.Drawing

$publicDir = "d:\download\VICONNECT\CEO_VIONE_PROJECT\CEOHN10_project\apps\ceohn10_app_fe\public"
$assetsDir = "d:\download\VICONNECT\CEO_VIONE_PROJECT\CEOHN10_project\assets"

$navyLogoSrc = [System.Drawing.Bitmap]::FromFile("$assetsDir\ceohn10_navy_logo.png")
$whiteLogoSrc = [System.Drawing.Bitmap]::FromFile("$assetsDir\ceohn10_white_logo.png")

# 1. Save main logos
$navyLogoSrc.Save("$publicDir\ceohn10-official-logo.png", [System.Drawing.Imaging.ImageFormat]::Png)
$navyLogoSrc.Save("$publicDir\ceohn10-logo.png", [System.Drawing.Imaging.ImageFormat]::Png)
$navyLogoSrc.Save("$publicDir\brand-header-logo.png", [System.Drawing.Imaging.ImageFormat]::Png)
$navyLogoSrc.Save("$publicDir\ceo1983-official-logo.png", [System.Drawing.Imaging.ImageFormat]::Png)
$navyLogoSrc.Save("$publicDir\ceo1983-logo.png", [System.Drawing.Imaging.ImageFormat]::Png)

$whiteLogoSrc.Save("$publicDir\brand-header-logo-white.png", [System.Drawing.Imaging.ImageFormat]::Png)

if (Test-Path "$publicDir\landing\ceo1983-official-logo.png") {
    $navyLogoSrc.Save("$publicDir\landing\ceo1983-official-logo.png", [System.Drawing.Imaging.ImageFormat]::Png)
}
if (Test-Path "$publicDir\images\ceo1983\Logo CEO 1983.png") {
    $navyLogoSrc.Save("$publicDir\images\ceo1983\Logo CEO 1983.png", [System.Drawing.Imaging.ImageFormat]::Png)
}
if (Test-Path "$publicDir\images\ceo1983\logo-ceo-1983.png") {
    $navyLogoSrc.Save("$publicDir\images\ceo1983\logo-ceo-1983.png", [System.Drawing.Imaging.ImageFormat]::Png)
}

# 2. Generate Square App Icons with Sapphire Navy Background #003B95
function Create-SquareAppIcon($size, $isMaskable = $false) {
    $bmp = New-Object System.Drawing.Bitmap($size, $size, [System.Drawing.Imaging.PixelFormat]::Format32bppArgb)
    $g = [System.Drawing.Graphics]::FromImage($bmp)
    $g.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
    $g.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::HighQuality
    $g.PixelOffsetMode = [System.Drawing.Drawing2D.PixelOffsetMode]::HighQuality

    # Gradient background from Sapphire Navy (#002B75) to Deep Royal (#001A4A)
    $brush = New-Object System.Drawing.Drawing2D.LinearGradientBrush(
        (New-Object System.Drawing.Point(0, 0)),
        (New-Object System.Drawing.Point($size, $size)),
        ([System.Drawing.Color]::FromArgb(255, 0, 43, 117)),
        ([System.Drawing.Color]::FromArgb(255, 0, 26, 74))
    )
    $g.FillRectangle($brush, 0, 0, $size, $size)
    $brush.Dispose()

    # Draw White Logo in center
    $paddingRatio = if ($isMaskable) { 0.25 } else { 0.15 }
    $targetW = [int]($size * (1 - $paddingRatio * 2))
    $aspect = $whiteLogoSrc.Height / $whiteLogoSrc.Width
    $targetH = [int]($targetW * $aspect)

    $destX = [int](($size - $targetW) / 2)
    $destY = [int](($size - $targetH) / 2)

    $g.DrawImage($whiteLogoSrc, $destX, $destY, $targetW, $targetH)
    $g.Dispose()
    return $bmp
}

# 512x512
$icon512 = Create-SquareAppIcon 512 $false
$icon512.Save("$publicDir\app-icon-512.png", [System.Drawing.Imaging.ImageFormat]::Png)
$icon512.Save("$publicDir\app-icon.png", [System.Drawing.Imaging.ImageFormat]::Png)

# 192x192
$icon192 = Create-SquareAppIcon 192 $false
$icon192.Save("$publicDir\app-icon-192.png", [System.Drawing.Imaging.ImageFormat]::Png)
$icon192.Save("$publicDir\brand-favicon-192.png", [System.Drawing.Imaging.ImageFormat]::Png)

# Maskable icons
$iconMask512 = Create-SquareAppIcon 512 $true
$iconMask512.Save("$publicDir\app-icon-maskable-512.png", [System.Drawing.Imaging.ImageFormat]::Png)

$iconMask192 = Create-SquareAppIcon 192 $true
$iconMask192.Save("$publicDir\app-icon-maskable-192.png", [System.Drawing.Imaging.ImageFormat]::Png)

# Favicons
$icon64 = Create-SquareAppIcon 64 $false
$icon64.Save("$publicDir\brand-favicon-64.png", [System.Drawing.Imaging.ImageFormat]::Png)
$icon64.Save("$publicDir\ceohn10-favicon.png", [System.Drawing.Imaging.ImageFormat]::Png)
$icon64.Save("$publicDir\favicon.png", [System.Drawing.Imaging.ImageFormat]::Png)
$icon64.Save("$publicDir\ceo1983-favicon.png", [System.Drawing.Imaging.ImageFormat]::Png)
if (Test-Path "$publicDir\landing\ceo1983-favicon.png") {
    $icon64.Save("$publicDir\landing\ceo1983-favicon.png", [System.Drawing.Imaging.ImageFormat]::Png)
}

# Apple Touch Icons
$icon180 = Create-SquareAppIcon 180 $false
$icon180.Save("$publicDir\apple-touch-icon-180x180.png", [System.Drawing.Imaging.ImageFormat]::Png)
$icon180.Save("$publicDir\apple-touch-icon.png", [System.Drawing.Imaging.ImageFormat]::Png)

$navyLogoSrc.Dispose()
$whiteLogoSrc.Dispose()
$icon512.Dispose()
$icon192.Dispose()
$iconMask512.Dispose()
$iconMask192.Dispose()
$icon64.Dispose()
$icon180.Dispose()

Write-Host "All CEOHN10 logos and icons generated successfully!"
