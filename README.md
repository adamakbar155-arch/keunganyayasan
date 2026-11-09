# Aplikasi Keuangan Yayasan

Aplikasi keuangan untuk yayasan: donasi per Program dan Divisi, kas dan bank, jurnal, gaji, dan (nanti) laporan.
Alurnya meniru Accurate, tetapi memakai istilah yayasan, tanpa logo, nama, atau data Accurate.

Dibuat dengan HTML, CSS, dan JavaScript biasa, tanpa framework dan tanpa server.
Data disimpan di browser (localStorage), jadi data hanya ada di browser dan komputer yang dipakai.
Rencana kerja dan keputusan ada di [PLAN.md](PLAN.md). Aturan kerja bersama Claude ada di [CLAUDE.md](CLAUDE.md).

## Cara menjalankan

1. Buka `index.html` di Chrome (klik dua kali file-nya, atau lewat Live Server di VS Code).
2. Tidak perlu memasang apa pun dan tidak perlu internet.
3. Buka `index.html`; kalau belum masuk, aplikasi pindah ke `login.html`. Pertama kali dipakai, buat akun Finance Yayasan pertama di sana. Tidak ada aktivitas 40 menit = keluar otomatis.

Penting: folder `umum/` dan `fitur/` harus selalu ikut kalau aplikasi disalin. `index.html` saja tidak cukup.

**Data tersimpan terpisah menurut cara membuka.** Membuka lewat folder (`file:///...`) dan lewat Live Server
(`http://127.0.0.1:5500/...`) dianggap browser sebagai dua situs berbeda, jadi isinya juga berbeda. Begitu juga
Live Server dengan nomor port lain (5500, 5501, ...). Pakai **satu cara** terus. Untuk memindah data dari satu cara ke
cara lain: Pengaturan → Cadangan Data → Buat Cadangan di cara lama, lalu Pulihkan file itu di cara baru.

## Susunan folder

```
index.html                 kerangka halaman: daftar file CSS/JS dan penanda tempat <template data-tempat="...">
login.html, login.css, login.js  layar Masuk, akun pertama, dan wajib ganti kata sandi (PRD 6.12)
umum/                     dipakai semua fitur
  pasang-tampilan.js        memasang HTML tiap fitur ke penanda tempat di index.html
  tampilan-kerangka.js      HTML bilah atas dan menu samping
  tampilan-popup.js         HTML popup menu (Pengaturan, Master Data, Buku Besar, Kas & Bank) dan konfirmasi
  inti.js                   tab, popup menu, notifikasi, konfirmasi
  alat.js                   alat kecil: buatId, teksAman, bacaDaftarTersimpan, rincianAman, isiPilihan, buatChip, isiSaranDatalist
  unduh-excel.js            membuat berkas Excel (.xlsx) tanpa pustaka luar
  buat-pdf.js               membuat berkas PDF tanpa pustaka luar (teks, kotak, gambar JPEG; foto diubah lewat jpegPdfDariGambar/muatGambarPdf)
  pdf-tabel.js              menyusun dokumen bertabel menjadi PDF (laporan dan daftar)
  halaman-pdf.js, .css      Halaman Cetak: PDF, tombol Cetak, Unduh PDF, Tutup
  preferensi.js             Preferensi (data yayasan, format angka/tanggal, pembatasan, lampiran, akun perkiraan)
  komponen-daftar.js        buatModulDaftar: Data Baru, Daftar, cari, urut, unduh CSV, cetak, simpan, hapus, Log
  komponen-transaksi.js     alat formulir transaksi: kolom cari, nomor otomatis, tab, angka rupiah, pemeriksa tanggal,
                            pilihan akun dan Kas/Bank, label pilihan (buatChipPilihan), kolom pilih beberapa (buatPemilihBanyak)
  lampiran.js, .css         lampiran file transaksi (buatLampiranTransaksi): popup, batas jenis/ukuran, isi file terpisah,
                            wajib menurut Preferensi; dipakai semua transaksi pencatatan (Jurnal Umum, Pembayaran, Penerimaan, Transfer, Gaji, Donasi, Pemindahan Dana)
  pemilih-opsi.js           semua kotak pilihan isian tampil sebagai kolom cari berlabel (kecuali filter, Dashboard, editor cetakan)
  tampilan-transaksi-kas.js cetakan HTML bersama transaksi Kas/Bank (Pembayaran, Penerimaan)
  komponen-transaksi-kas.js logika bersama transaksi Kas/Bank: rincian, popup, simpan, jurnal otomatis
  transaksi-kas.css         gaya bersama transaksi Kas/Bank
  tampilan-histori.js       cetakan HTML bersama halaman histori (Histori Bank, Histori Akun)
  komponen-histori.js       logika bersama halaman histori: Saldo Awal, saldo berjalan, Total, ceklis, ekspor CSV
  histori.css               gaya bersama halaman histori (juga baris atas Rekonsiliasi Bank)
  bilah-atas.js             pilihan pembukuan di bilah atas
  sesi.js                   sesi masuk (dimuat paling awal; belum masuk/40 menit diam = ke login.html), hak akses dasar
  sesi-aplikasi.js, sesi.css menu pengguna (Ganti Kata Sandi, Keluar), keluar otomatis 40 menit, Log Masuk/Keluar, peran
  sandi.js                  mengacak dan mencocokkan kata sandi (PBKDF2), dipakai layar Masuk dan halaman Pengguna
  pintasan.js               pintasan keyboard (Ctrl+S, Alt+N, Alt+D, Alt+W, Ctrl+P, Alt+L, F1) dan popup daftarnya; hanya menekan tombol yang ada
  *.css                     gaya bersama (dasar, popup, halaman daftar, kalender, layar sempit)
  huruf.css, huruf/         huruf Inter disimpan di proyek (tanpa internet), dengan lisensinya (OFL-Inter.txt)
fitur/<nama>/             satu fitur = satu folder (fitur baru selalu folder baru, misalnya fitur/penerimaan/;
                          menu yang berisi beberapa fitur, seperti Kas & Bank, hanya menyimpan popup menunya)
  tampilan.js               HTML halaman fitur (dan popupnya)
  <nama>.js                 logika fitur
  <nama>.css                gaya khusus fitur
alat-cek/                 pemeriksa otomatis untuk pengembangan (bukan bagian aplikasi; lihat alat-cek/README.md)
```

Fitur yang ada: `dashboard` (widget dari data asli, diatur lewat tombol + Widget; widget baru didaftarkan di `WIDGET_DASHBOARD`), `preferensi`, `master-data` (Divisi, Program, Karyawan, Gaji/Tunjangan),
`akun` (Akun Perkiraan), `jurnal` (Jurnal Umum), `gaji` (Pencatatan Gaji),
`kas-bank` (popup menu Kas & Bank), `donasi` (popup menu Donasi), `kategori-donasi` (Kategori Donasi: membuat akun donasi), `donatur` (Donatur), `pencatatan-donasi` (Pencatatan Donasi), `target-donasi` (Target Donasi per Program), `pemindahan-dana` (Pemindahan Dana antar Program/ke Dana Umum), `pembayaran` (Pembayaran), `penerimaan` (Penerimaan), `transfer` (Transfer Bank),
`histori-bank` (Histori Bank), `histori-akun` (Histori Akun), `log-jurnal` (Log Aktifitas Jurnal), `rekonsiliasi-bank` (Rekonsiliasi Bank),
`laporan` (menu Laporan: kategori, kartu laporan, Cari; laporan baru didaftarkan di `DAFTAR_LAPORAN`; jendela Parameter Laporan di `parameter.js`, kertas hasil, cetak, dan unduhan di `kertas.js`, jendela Modifikasi (ukuran kertas, margin) di `modifikasi.js`, pohon akun dan tabel di `pohon.js`, hitungan bersama di `hitung.js`, Laporan Tersimpan di `tersimpan.js`), `penghasilan-komprehensif`, `posisi-keuangan`, `perubahan-aset-neto`, `arus-kas`, `laporan-program` (Donasi per Program, Sisa Dana), `laporan-rincian` (Rincian Pengeluaran, Rincian Beban Pembayaran, Jurnal tanpa Lampiran), `laporan-bukti` (Bukti Pengeluaran per Divisi dan Program: gambar kecil bukti, popup Lihat Bukti, PDF Lampiran audit), `laporan-kas-donasi` (Daftar Kas dan Bank, Donasi per Divisi dan per Donatur), `laporan-buku-besar` (Neraca Saldo, Buku Besar per Akun), `anggaran` (Anggaran per bulan, tanpa jurnal; hitungan Sisa bersama di `hitung.js`), `monitor-anggaran`, `transfer-anggaran`, `laporan-anggaran` (Perbandingan Anggaran), `aset-tetap` (popup, Aset Tetap, hitungan bersama di `hitung.js`), `kategori-aset`, `penyusutan` (Proses Penyusutan), `lepas-aset`, `laporan-aset`, `pengaturan` (Log Aktivitas, Pengguna, Penomoran), `cetakan` (Desain Cetakan), `cadangan` (Cadangan Data), `cetak-bukti` (mencetak transaksi memakai Desain Cetakan; dokumen baru didaftarkan di `JENIS_CETAK` dan di `tipeCetakan`), `favorit` (Transaksi Favorit: templat dari transaksi tersimpan; formulir baru cukup diberi tombol `data-favorit-ambil` dan `data-favorit-lain`, lalu didaftarkan di `TIPE_FAVORIT`).

## Aturan kode

- **Urutan muat penting.** Semua file JS adalah skrip biasa yang berbagi satu ruang nama. Urutannya di `index.html`:
  pemasang tampilan → semua `tampilan.js` → `umum/` (logika) → `fitur/` (logika). Fungsi dari file lain hanya boleh
  dipakai kalau file itu dimuat lebih dulu, atau dipakai di dalam fungsi yang dijalankan belakangan (misalnya saat tombol diklik).
- **Urutan CSS juga penting.** Aturan di file yang dimuat belakangan menang kalau sama kuat.
- **Nama file dan folder** huruf kecil, tanpa spasi (pakai `-`). Alamat file selalu relatif.
- **Teks aplikasi** bahasa Indonesia sederhana. Isian pengguna selalu ditampilkan lewat `textContent`, tidak lewat `innerHTML`.
- **Data dari penyimpanan dianggap bisa rusak.** Jangan `JSON.parse(localStorage...)` langsung. Pakai:
  `modul.ambil()` (daftar milik halaman sendiri), `bacaDaftarTersimpan(kunci)` (daftar milik halaman yang dimuat belakangan),
  `bacaPengaturan(kunci, bawaan)` (data berbentuk objek), `rincianAman(data)` (baris transaksi), dan `teksAman` (teks).
- **Aturan bisnis ada di [PRD.md](PRD.md).** Kode tidak boleh berisi aturan yang tidak tertulis di sana.
- **Halaman berdaftar baru** dibuat dengan `buatModulDaftar` (lihat penjelasan opsinya di `umum/komponen-daftar.js`).
  Kuncinya otomatis ikut Cadangan Data. Penyimpanan lain di luar komponen itu harus didaftarkan di `jenisKunciCadangan`.
- **Jangan menulis kode yang sama dua kali.** Kalau dua fitur butuh hal yang sama, pindahkan ke `umum/`.
- **Tidak ada password atau data asli di kode.**
- **Content-Security-Policy** di `index.html` hanya mengizinkan skrip, gaya, dan huruf dari folder aplikasi. Jadi jangan
  menulis `<script>` di dalam HTML, atribut `style="..."`, atau `onclick="..."`: pakai berkas .js/.css dan `addEventListener`.
  Mengatur `elemen.style.xxx` lewat JavaScript tetap boleh.

## Cara memeriksa setelah mengubah kode

1. Buka `index.html` di Chrome, tekan **F12**, pilih tab **Console**. Tidak boleh ada tulisan merah.
2. Buka halaman yang diubah, coba simpan, ubah, dan hapus satu data.
3. Coba di layar sempit: di F12, klik ikon HP (Toggle device toolbar), pilih lebar 390.
4. Pemeriksaan otomatis: `powershell -File "alat-cek\cek.ps1"`. Isinya ESLint (kesalahan penulisan, nama ganda,
   kode mati), uji otomatis di jsdom dan Chrome, uji data rusak, serta banding tangkapan layar.
   Cara pakai dan pemasangannya ada di [alat-cek/README.md](alat-cek/README.md).
