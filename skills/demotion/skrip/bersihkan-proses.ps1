param([switch]$JanganStudio)
# Matikan SEMUA sisa proses render Remotion (node remotion-cli, chrome-headless-shell, ffmpeg bawaan Remotion).
# Penting: menghentikan tugas latar (TaskStop) TIDAK membunuh proses anaknya. Proses yatim ini terus merender dan
# diam-diam menghabiskan CPU, sehingga render berikutnya (dan uji kecepatan) terlihat 3x lebih lambat.
# Secara bawaan Remotion Studio (server pratinjau, `remotion studio`) IKUT dimatikan; beri -JanganStudio untuk membiarkannya.
# Hanya menyentuh proses Remotion; Chrome biasa milik pengguna (chrome.exe) TIDAK disentuh.
$target = Get-CimInstance Win32_Process | Where-Object {
  (($_.Name -eq 'node.exe' -and $_.CommandLine -match 'remotion') -or $_.Name -match 'chrome-headless-shell|ffmpeg|remotion') -and -not ($JanganStudio -and $_.CommandLine -match 'studio')
}
foreach ($p in $target) {
  Write-Host ("menghentikan {0} ({1})" -f $p.Name, $p.ProcessId)
  Stop-Process -Id $p.ProcessId -Force -ErrorAction SilentlyContinue
}
Start-Sleep -Seconds 2
$sisa = (Get-CimInstance Win32_Process | Where-Object { ($_.Name -eq 'node.exe' -and $_.CommandLine -match 'remotion') -or $_.Name -match 'chrome-headless-shell|ffmpeg' } | Measure-Object).Count
Write-Host "proses render tersisa: $sisa"
