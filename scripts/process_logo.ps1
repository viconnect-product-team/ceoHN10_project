Add-Type -AssemblyName System.Drawing

$src = [System.Drawing.Bitmap]::FromFile("d:\download\VICONNECT\CEO_VIONE_PROJECT\CEOHN10_project\assets\canva_screen.jpg")

$x = 186
$y = 43
$w = 142
$h = 46

$crop = $src.Clone([System.Drawing.Rectangle]::new($x, $y, $w, $h), [System.Drawing.Imaging.PixelFormat]::Format32bppArgb)
$src.Dispose()

$whiteLogo = New-Object System.Drawing.Bitmap($w, $h, [System.Drawing.Imaging.PixelFormat]::Format32bppArgb)
$navyLogo = New-Object System.Drawing.Bitmap($w, $h, [System.Drawing.Imaging.PixelFormat]::Format32bppArgb)

for ($px = 0; $px -lt $w; $px++) {
    for ($py = 0; $py -lt $h; $py++) {
        $c = $crop.GetPixel($px, $py)
        $r = [double]$c.R
        $g = [double]$c.G
        $b = [double]$c.B
        
        # In dark blue background, R ~ 10-35, G ~ 20-45, B ~ 80-110
        # Foreground white has R > 150, G > 150, B > 160
        # Let's use (R + G) / 2 to cleanly separate white from blue background
        $rg = ($r + $g) / 2.0
        
        # If rg < 65 -> strictly transparent background
        $alpha = 0
        if ($rg -gt 65.0) {
            $alpha = [int](($rg - 65.0) / (160.0 - 65.0) * 255.0)
            if ($alpha -gt 255) { $alpha = 255 }
        }

        if ($alpha -gt 0) {
            $whiteColor = [System.Drawing.Color]::FromArgb($alpha, 255, 255, 255)
            $whiteLogo.SetPixel($px, $py, $whiteColor)
            
            # Navy: #003B95
            $navyColor = [System.Drawing.Color]::FromArgb($alpha, 0, 59, 149)
            $navyLogo.SetPixel($px, $py, $navyColor)
        } else {
            $trans = [System.Drawing.Color]::FromArgb(0, 0, 0, 0)
            $whiteLogo.SetPixel($px, $py, $trans)
            $navyLogo.SetPixel($px, $py, $trans)
        }
    }
}

$crop.Dispose()

function Scale-Bitmap($bmp, $factor) {
    $newW = $bmp.Width * $factor
    $newH = $bmp.Height * $factor
    $scaled = New-Object System.Drawing.Bitmap($newW, $newH, [System.Drawing.Imaging.PixelFormat]::Format32bppArgb)
    $g = [System.Drawing.Graphics]::FromImage($scaled)
    $g.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
    $g.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::HighQuality
    $g.PixelOffsetMode = [System.Drawing.Drawing2D.PixelOffsetMode]::HighQuality
    $g.DrawImage($bmp, 0, 0, $newW, $newH)
    $g.Dispose()
    return $scaled
}

$navyHiRes = Scale-Bitmap $navyLogo 4
$whiteHiRes = Scale-Bitmap $whiteLogo 4

$outDir = "d:\download\VICONNECT\CEO_VIONE_PROJECT\CEOHN10_project\assets"
$navyHiRes.Save("$outDir\ceohn10_navy_logo.png", [System.Drawing.Imaging.ImageFormat]::Png)
$whiteHiRes.Save("$outDir\ceohn10_white_logo.png", [System.Drawing.Imaging.ImageFormat]::Png)

Write-Host "Regenerated crystal clean transparent logos successfully!"
