Add-Type -AssemblyName System.Drawing

$size = 256
$bitmap = New-Object System.Drawing.Bitmap $size, $size, ([System.Drawing.Imaging.PixelFormat]::Format32bppArgb)
$graphics = [System.Drawing.Graphics]::FromImage($bitmap)
$graphics.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::AntiAlias
$graphics.Clear([System.Drawing.Color]::FromArgb(255, 7, 10, 15))

$green = [System.Drawing.Color]::FromArgb(255, 52, 241, 123)
$blue = [System.Drawing.Color]::FromArgb(255, 0, 212, 255)
$panel = [System.Drawing.Color]::FromArgb(255, 16, 24, 39)

$outerPen = New-Object System.Drawing.Pen $green, 10
$innerPen = New-Object System.Drawing.Pen $blue, 7
$fill = New-Object System.Drawing.SolidBrush $panel
$core = New-Object System.Drawing.SolidBrush $green

$outer = @(
  [System.Drawing.PointF]::new(128, 36),
  [System.Drawing.PointF]::new(198, 78),
  [System.Drawing.PointF]::new(198, 178),
  [System.Drawing.PointF]::new(128, 220),
  [System.Drawing.PointF]::new(58, 178),
  [System.Drawing.PointF]::new(58, 78)
)
$inner = @(
  [System.Drawing.PointF]::new(128, 74),
  [System.Drawing.PointF]::new(168, 98),
  [System.Drawing.PointF]::new(168, 158),
  [System.Drawing.PointF]::new(128, 182),
  [System.Drawing.PointF]::new(88, 158),
  [System.Drawing.PointF]::new(88, 98)
)

$graphics.FillPolygon($fill, $outer)
$graphics.DrawPolygon($outerPen, $outer)
$graphics.DrawPolygon($innerPen, $inner)
$graphics.FillRectangle($core, 112, 116, 32, 32)
$graphics.DrawLine($outerPen, 74, 181, 106, 162)
$graphics.DrawLine($outerPen, 182, 181, 150, 162)

$pngStream = New-Object System.IO.MemoryStream
$bitmap.Save($pngStream, [System.Drawing.Imaging.ImageFormat]::Png)
$pngBytes = $pngStream.ToArray()

$icoStream = New-Object System.IO.MemoryStream
$writer = New-Object System.IO.BinaryWriter $icoStream
$writer.Write([UInt16]0)
$writer.Write([UInt16]1)
$writer.Write([UInt16]1)
$writer.Write([Byte]0)
$writer.Write([Byte]0)
$writer.Write([Byte]0)
$writer.Write([Byte]0)
$writer.Write([UInt16]1)
$writer.Write([UInt16]32)
$writer.Write([UInt32]$pngBytes.Length)
$writer.Write([UInt32]22)
$writer.Write($pngBytes)
$writer.Flush()

[System.IO.File]::WriteAllBytes((Join-Path $PSScriptRoot '..\assets\icon.ico'), $icoStream.ToArray())
$graphics.Dispose()
$bitmap.Dispose()
$pngStream.Dispose()
$icoStream.Dispose()
