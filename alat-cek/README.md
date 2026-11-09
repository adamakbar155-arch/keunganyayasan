# alat-cek — pemeriksa otomatis (untuk pengembangan)

Folder ini **bukan bagian aplikasi**. index.html tidak memuat apa pun dari sini. Isinya alat untuk memeriksa aplikasi
setiap selesai mengubah kode. Dulu alat ini tersimpan di folder sementara sesi Claude dan sebagian hilang (Temuan 18),
jadi sekarang disimpan di proyek.

## Menjalankan semua pemeriksaan

```
powershell -File "alat-cek\cek.ps1"          # semua (sekitar 10–15 menit)
powershell -File "alat-cek\cek.ps1" -cepat   # tanpa uji Chrome
```

Hasil akhirnya `HASIL: SEMUA BERSIH` atau `HASIL: ADA n MASALAH`. Yang diperiksa, berurutan:

1. **Sintaks** semua berkas .js aplikasi.
2. **ESLint** (`lint.js`, aturannya di `eslint.config.js`): nama global yang ditulis dua kali, nama yang tidak dikenal,
   dan fungsi yang tidak dipakai di mana pun (kode mati).
3. **Banding tangkapan layar** (`banding.js`): dashboard, setiap popup menu, dan setiap halaman, di lebar 1366 dan 390 px,
   dibandingkan piksel demi piksel dengan foto di `acuan/`. Tanggal dibuat tetap (2 Nov 2026) dan animasi dimatikan,
   supaya hasilnya tidak berubah sendiri.
4. **Uji jsdom** (`uji/uji-*.js` selain uji-chrome): aturan dan hitungan, termasuk data rusak di penyimpanan.
5. **Uji Chrome asli** (`uji/uji-chrome-*.js`): mengklik dan mengetik seperti pengguna.

## Kalau tampilan memang sengaja diubah

Banding akan melaporkan `BEDA`. Lihat foto barunya di `.sementara/banding/`. Kalau tampilannya benar, jadikan acuan baru:

```
node alat-cek\banding.js acuan
```

## Pemasangan (sekali saja, butuh internet)

```
cd alat-cek
npm install
```

Ini memasang jsdom, ESLint, dan globals ke `alat-cek/node_modules`. Chrome harus ada di
`C:\Program Files\Google\Chrome\Application\chrome.exe`.

## Folder

- `uji/` — semua uji. Data di dalamnya data contoh, bukan data asli.
- `acuan/` — foto acuan untuk banding.
- `.sementara/` — hasil sementara (foto terbaru, profil Chrome, berkas gabungan ESLint). Boleh dihapus kapan saja.
- `node_modules/` — pustaka alat. Boleh dihapus; pasang lagi dengan `npm install`.
