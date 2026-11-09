# Pemeriksaan otomatis lengkap (alat pengembangan, bukan bagian aplikasi). Jalankan dari folder mana saja:
#   powershell -File "alat-cek\cek.ps1"            -> semua pemeriksaan
#   powershell -File "alat-cek\cek.ps1" -cepat     -> tanpa uji Chrome (lebih cepat)
# Urutan: sintaks semua .js aplikasi, ESLint (nama ganda, nama tak dikenal, kode mati), banding tangkapan layar,
# uji jsdom (termasuk data rusak), lalu uji Chrome asli.
param([switch]$cepat)
$a = $PSScriptRoot
$akar = Split-Path $a -Parent
$html = Join-Path $akar "index.html"
$jsdom = Join-Path $a "node_modules\jsdom"
$chrome = "C:\Program Files\Google\Chrome\Application\chrome.exe"
$sementara = Join-Path $a ".sementara"
New-Item -ItemType Directory -Force $sementara | Out-Null
$masalah = 0

# 1) Sintaks: semua .js aplikasi (folder alat-cek dan node_modules dilewati)
$salah = 0
Get-ChildItem $akar -Recurse -Include *.js | Where-Object { $_.FullName -notmatch '\\(node_modules|alat-cek)\\' } | ForEach-Object {
    node --check $_.FullName 2>$null
    if ($LASTEXITCODE) { "SINTAKS SALAH: " + $_.FullName; $salah++ }
}
"Sintaks: " + $(if ($salah) { "$salah berkas salah" } else { "semua benar" }); $masalah += $salah

# 2) ESLint
$o = node (Join-Path $a "lint.js") 2>&1
$o | Where-Object { $_ -notmatch '^Berkas diperiksa' } | ForEach-Object { "  " + $_ }
if ($LASTEXITCODE -or ($o -match '^saran ')) { $masalah++ }

# 3) Banding tangkapan layar
node (Join-Path $a "banding.js") 2>&1 | ForEach-Object { "  " + $_ }
if ($LASTEXITCODE) { $masalah++ }

# 4) Uji jsdom (semua uji-*.js yang bukan uji-chrome-*)
$jl = 0; $jg = 0
Get-ChildItem (Join-Path $a "uji\uji-*.js") | Where-Object { $_.Name -notlike "uji-chrome-*" } | ForEach-Object {
    $o = node $_.FullName $jsdom $html 2>&1
    $gg = @($o | Select-String -CaseSensitive "GAGAL|TypeError|ReferenceError|is not defined|SyntaxError")
    if ($gg.Count -or $LASTEXITCODE) { $jg++; "  " + $_.Name + " <<< " + (($gg | Select-Object -First 3) -join " | ") } else { $jl++ }
}
"jsdom: $jl rangkaian bersih, $jg bermasalah"; $masalah += $jg

# 5) Uji Chrome asli (tiap uji memakai port dan profil sendiri)
if (-not $cepat) {
    $cl = 0; $cg = 0
    Get-ChildItem (Join-Path $a "uji\uji-chrome-*.js") | ForEach-Object {
        $n = $_.BaseName
        $o = node -r (Join-Path $a "tunggu-lebih-lama.js") $_.FullName $chrome $html (Join-Path $sementara "profil-$n") (Join-Path $sementara "png")
        $r = ($o | Select-String -CaseSensitive "^Lolos") -join ""
        $g = ($o | Select-String -CaseSensitive "GAGAL|GALAT") -join " || "
        if ($g -or $r -notmatch 'Lolos (\d+) dari \1') { $cg++; "  $n : $r $g" } else { $cl++ }
    }
    "Chrome: $cl rangkaian lolos semua, $cg bermasalah"; $masalah += $cg
}

if ($masalah) { "HASIL: ADA $masalah MASALAH"; exit 1 } else { "HASIL: SEMUA BERSIH" }
