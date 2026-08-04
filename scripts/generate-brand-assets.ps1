Add-Type -AssemblyName System.Drawing
$ErrorActionPreference = 'Stop'

$mobileAssets = [System.IO.Path]::GetFullPath(
  (Join-Path $PSScriptRoot '..\apps\mobile\assets\images')
)
$webAssets = [System.IO.Path]::GetFullPath(
  (Join-Path $PSScriptRoot '..\apps\web\public')
)
$markPath = Join-Path $mobileAssets 'focusflow-mark.png'

if (-not (Test-Path -LiteralPath $markPath)) {
  throw "Missing source mark: $markPath"
}

$dark = [System.Drawing.ColorTranslator]::FromHtml('#071018')
$transparent = [System.Drawing.Color]::Transparent
$mark = [System.Drawing.Image]::FromFile($markPath)

function New-BrandBitmap {
  param(
    [int]$Width,
    [int]$Height,
    [System.Drawing.Color]$Background
  )

  $bitmap = [System.Drawing.Bitmap]::new(
    $Width,
    $Height,
    [System.Drawing.Imaging.PixelFormat]::Format32bppArgb
  )
  $graphics = [System.Drawing.Graphics]::FromImage($bitmap)
  $graphics.Clear($Background)
  $graphics.CompositingQuality =
    [System.Drawing.Drawing2D.CompositingQuality]::HighQuality
  $graphics.InterpolationMode =
    [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
  $graphics.PixelOffsetMode =
    [System.Drawing.Drawing2D.PixelOffsetMode]::HighQuality
  $graphics.SmoothingMode =
    [System.Drawing.Drawing2D.SmoothingMode]::AntiAlias

  return @{ Bitmap = $bitmap; Graphics = $graphics }
}

function Add-BrandMark {
  param(
    [System.Drawing.Graphics]$Graphics,
    [int]$CanvasWidth,
    [int]$CanvasHeight,
    [float]$Scale = 1
  )

  $width = $CanvasWidth * $Scale
  $height = $CanvasHeight * $Scale
  $x = ($CanvasWidth - $width) / 2
  $y = ($CanvasHeight - $height) / 2
  $destination = [System.Drawing.RectangleF]::new($x, $y, $width, $height)
  $Graphics.DrawImage($mark, $destination)
}

function Save-Png {
  param(
    [System.Drawing.Bitmap]$Bitmap,
    [string]$Path
  )

  $Bitmap.Save($Path, [System.Drawing.Imaging.ImageFormat]::Png)
}

function Export-BrandAsset {
  param(
    [int]$Width,
    [int]$Height,
    [System.Drawing.Color]$Background,
    [float]$Scale,
    [string]$Path
  )

  $canvas = New-BrandBitmap `
    -Width $Width `
    -Height $Height `
    -Background $Background
  Add-BrandMark `
    -Graphics $canvas.Graphics `
    -CanvasWidth $Width `
    -CanvasHeight $Height `
    -Scale $Scale
  Save-Png -Bitmap $canvas.Bitmap -Path $Path
  $canvas.Graphics.Dispose()
  $canvas.Bitmap.Dispose()
}

Export-BrandAsset `
  -Width 1024 `
  -Height 1024 `
  -Background $dark `
  -Scale 0.9 `
  -Path (Join-Path $mobileAssets 'icon.png')

Export-BrandAsset `
  -Width 1024 `
  -Height 1024 `
  -Background $transparent `
  -Scale 0.72 `
  -Path (Join-Path $mobileAssets 'splash-icon.png')

$adaptiveBackground = New-BrandBitmap `
  -Width 512 `
  -Height 512 `
  -Background $dark
Save-Png `
  -Bitmap $adaptiveBackground.Bitmap `
  -Path (Join-Path $mobileAssets 'android-icon-background.png')
$adaptiveBackground.Graphics.Dispose()
$adaptiveBackground.Bitmap.Dispose()

Export-BrandAsset `
  -Width 512 `
  -Height 512 `
  -Background $transparent `
  -Scale 0.82 `
  -Path (Join-Path $mobileAssets 'android-icon-foreground.png')

$monochrome = New-BrandBitmap `
  -Width 432 `
  -Height 432 `
  -Background $transparent
Add-BrandMark `
  -Graphics $monochrome.Graphics `
  -CanvasWidth 432 `
  -CanvasHeight 432 `
  -Scale 0.82
$monochrome.Graphics.Dispose()
for ($x = 0; $x -lt $monochrome.Bitmap.Width; $x++) {
  for ($y = 0; $y -lt $monochrome.Bitmap.Height; $y++) {
    $pixel = $monochrome.Bitmap.GetPixel($x, $y)
    if ($pixel.A -gt 0) {
      $monochrome.Bitmap.SetPixel(
        $x,
        $y,
        [System.Drawing.Color]::FromArgb($pixel.A, 255, 255, 255)
      )
    }
  }
}
Save-Png `
  -Bitmap $monochrome.Bitmap `
  -Path (Join-Path $mobileAssets 'android-icon-monochrome.png')
$monochrome.Bitmap.Dispose()

Export-BrandAsset `
  -Width 48 `
  -Height 48 `
  -Background $dark `
  -Scale 1 `
  -Path (Join-Path $mobileAssets 'favicon.png')

Copy-Item `
  -LiteralPath $markPath `
  -Destination (Join-Path $webAssets 'focusflow-mark.png') `
  -Force
Copy-Item `
  -LiteralPath (Join-Path $mobileAssets 'favicon.png') `
  -Destination (Join-Path $webAssets 'favicon.png') `
  -Force

$mark.Dispose()
Write-Output 'Generated mobile and web assets from focusflow-mark.png'
