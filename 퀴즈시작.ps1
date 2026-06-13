[Console]::OutputEncoding = [System.Text.Encoding]::UTF8
$Host.UI.RawUI.WindowTitle = "Quiz"

$DIR  = Split-Path -Parent $MyInvocation.MyCommand.Definition
$NODE = "C:\Program Files\nodejs\node.exe"
$CF   = "C:\Users\11x\AppData\Local\Microsoft\WinGet\Packages\Cloudflare.cloudflared_Microsoft.Winget.Source_8wekyb3d8bbwe\cloudflared.exe"
$cfLog = "$DIR\cf_log.txt"
$sLog  = "$DIR\server_log.txt"

Write-Host ""
Write-Host "  ============================================" -ForegroundColor Cyan
Write-Host "  [1/3] Starting quiz server..." -ForegroundColor Yellow

Get-Process node, cloudflared -ErrorAction SilentlyContinue | Stop-Process -Force
Start-Sleep -Seconds 1
Remove-Item $cfLog -ErrorAction SilentlyContinue

$server = Start-Process -FilePath $NODE -ArgumentList "server.js" `
    -WorkingDirectory $DIR `
    -RedirectStandardOutput $sLog `
    -PassThru -NoNewWindow
Start-Sleep -Seconds 2

if ($server.HasExited) {
    Write-Host "  ERROR: Quiz server failed to start." -ForegroundColor Red
    Read-Host "Press Enter to exit"
    exit
}
Write-Host "  [1/3] Quiz server OK (PID $($server.Id))" -ForegroundColor Green

Write-Host "  [2/3] Starting Cloudflare tunnel..." -ForegroundColor Yellow
$cf_proc = Start-Process -FilePath $CF `
    -ArgumentList "tunnel --url http://localhost:3000 --no-autoupdate" `
    -RedirectStandardError $cfLog `
    -PassThru -NoNewWindow

$url = $null
for ($i = 0; $i -lt 30; $i++) {
    Start-Sleep -Seconds 1
    if (Test-Path $cfLog) {
        $content = Get-Content $cfLog -Raw -ErrorAction SilentlyContinue
        if ($content -match 'https://[a-z0-9\-]+\.trycloudflare\.com') {
            $url = $Matches[0]
            break
        }
    }
}

if (-not $url) {
    Write-Host "  ERROR: Could not get tunnel URL." -ForegroundColor Red
    Read-Host "Press Enter to exit"
    exit
}
Write-Host "  [2/3] Tunnel OK" -ForegroundColor Green

Write-Host "  [3/3] Opening admin browser..." -ForegroundColor Yellow
Start-Process "$url/admin.html"
Write-Host "  [3/3] Done!" -ForegroundColor Green

Write-Host ""
Write-Host "  ============================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "  QR URL (for participants):" -ForegroundColor White
Write-Host ""
Write-Host "  $url" -ForegroundColor Green
Write-Host ""
Write-Host "  ============================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "  Admin page opened in browser." -ForegroundColor White
Write-Host "  DO NOT CLOSE THIS WINDOW!" -ForegroundColor Red
Write-Host ""

while ($true) { Start-Sleep -Seconds 10 }
