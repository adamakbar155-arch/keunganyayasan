# PLAN.md — Aplikasi Keuangan Yayasan (Belajar)

Aplikasi keuangan untuk yayasan: donasi per Program dan Divisi, kas dan bank, jurnal, gaji, dan laporan.
Alur dan fungsinya meniru Accurate, tetapi istilahnya istilah yayasan, tanpa logo, nama, atau data Accurate.
Dibangun bertahap dengan HTML, CSS, dan JavaScript biasa. Tanpa framework dan tanpa server dulu.
Data sementara disimpan di browser (localStorage). Bagian server (PHP dan MySQL) dikerjakan di tahap terpisah nanti.

**Label tugas:**
- **[KAMU]** = kamu yang mengetik, Claude memandu.
- **[CLAUDE]** = Claude yang mengerjakan dan menjelaskan. (Tugas baru di bawah ditandai [CLAUDE] dulu; kalau ada bagian inti yang ingin kamu kuasai, bilang saja dan labelnya diganti [KAMU].)

**Cara kerja:** satu tahap, satu tugas kecil per giliran. Setelah tiap tugas: penjelasan, langkah tes manual, lalu centang di sini setelah kamu konfirmasi berhasil. Tahap berikutnya hanya dimulai setelah kamu mengetik "lanjut".

**Posisi sekarang:** Tahap R (perapihan) R.1–R.5 sudah dibuat dan menunggu tes manual kamu; R.6 menunggu keputusan. Sesudah itu kembali ke Tahap H2 (H2.3 Simpan Pembayaran). Tes manual lampiran (F.1) juga masih menunggu konfirmasi kamu.

---

## Yang sudah dikerjakan (Tahap A–F)

Semua ini dibangun atas permintaan langsung di percakapan, diuji di Chrome sungguhan, dan menunggu konfirmasi akhir kamu bila belum.

- [x] **A. Kerangka aplikasi** — menu.html dan menu.css: bilah atas, menu samping (ikon), Dashboard, sistem tab, popup Pengaturan dan Master Data, notifikasi, popup konfirmasi.
- [x] **B. Preferensi** — Data Yayasan, Fitur, Pembatasan (kunci tanggal), Lampiran (saklar wajib), Akun Perkiraan, Lain-lain.
- [x] **C. Master Data** — Divisi, Program (sifat dana terikat/tidak terikat), Karyawan, Gaji/Tunjangan, Pengguna, Penomoran, Desain Cetakan, Log Aktivitas, Cadangan Data.
- [x] **D. Akun Perkiraan** — kode otomatis, induk dan sub akun (maks 3 tingkat), bagan akun awal 44 akun, tab Saldo, akun bank, popup, saldo berjalan.
- [x] **E. Jurnal Umum** — formulir mirip Accurate: nomor otomatis/pilih, pencarian akun, popup Detail Akun (penanggung jawab, Program, Divisi, keterangan), kalender bergaya Accurate di semua tanggal, simpan/ubah/hapus, Log Aktivitas.
- [x] **F. Lampiran Jurnal** — klip di formulir, maks 5 file, 700 KB per file, foto dikecilkan otomatis, isi disimpan terpisah, ikut Cadangan Data, wajib bila diatur di Preferensi.
  - [ ] F.1 Tes manual lampiran oleh kamu (menunggu konfirmasi).

---

## Tahap G — Lampiran terlihat untuk audit

**Tujuan:** Bukti (lampiran) mudah ditemukan tanpa membuka jurnal satu per satu.

**Tugas:**
- [ ] G.1 [CLAUDE] Tambah kolom "Lampiran" (ikon klip dan jumlah) di daftar Jurnal Umum. Klik membuka popup lampiran untuk dilihat dan diunduh.
- [ ] G.2 [CLAUDE] Catat di Log Aktivitas saat lampiran ditambah atau dihapus dari jurnal yang sudah tersimpan.

**Selesai kalau:**
- [ ] Jurnal yang punya lampiran terlihat jelas di daftar, dan yang tidak punya juga terlihat.
- [ ] Lampiran bisa diunduh dari daftar tanpa membuka formulir.
- [ ] Menghapus lampiran dari jurnal tersimpan tercatat di Log Aktivitas.
- [ ] Tampilan rapi di HP; teks bahasa Indonesia sederhana; Console tanpa error.

**Sengaja belum dikerjakan:** filter "tanpa lampiran" (masuk Tahap I, Laporan).

---

## Tahap H — Pencatatan Gaji

**Tujuan:** Mencatat gaji bulanan per karyawan, membuat jurnal otomatis, lalu membayarnya lewat Jurnal Umum.

**Keputusan yang sudah disepakati:**
- Komponen seperti Accurate, hanya yang dipakai. Pendapatan: Gaji Pokok, Tunjangan Jabatan, Tunjangan Makan, Tunjangan Transportasi. Potongan: Pengurangan Gaji, Iuran Bulanan dan lainnya.
- Tidak dipakai: Tunjangan PPh, tunjangan dibayar perusahaan (JHT/JKM), Pajak Penghasilan, Potongan Cicilan, Iuran Pensiun, Premi Kesehatan.
- Gaji dibayarkan = pendapatan − potongan.
- Satu jurnal saja (Cara 1, dipilih 2026-10-23): menyimpan Pencatatan Gaji TIDAK membuat jurnal otomatis dan tidak memakai akun utang gaji.
- Tombol Proses membuka Jurnal Umum baru yang terisi: Debit Beban Gaji sebesar total gaji dibayarkan, Kredit Kas/Bank (dipilih pengguna). Menu Pembayaran Kas/Bank belum ada, jadi Jurnal Umum dipakai dulu.
- Dana terikat atau tidak terikat diatur di Jurnal Umum: klik baris Beban Gaji, isi Program dan Divisi di popup Detail Akun (Info lainnya). Bila gaji dibagi ke beberapa Program, baris beban dipecah sendiri oleh pengguna.

**Tugas:**
- [ ] H.1 [CLAUDE] Tentukan bentuk data gaji dan tempat memilih akun beban gaji (satu kali). Catat di "Keputusan".
- [ ] H.2 [CLAUDE] (Tampilan sudah dibuat 2026-10-23, menunggu tes manual dan revisi) Halaman Pencatatan Gaji: Tipe Pembayaran, Bulan dan Tahun, Nomor otomatis, Tanggal, Jatuh Tempo, tabel Rincian Karyawan, total di bawah.
- [ ] H.3 [CLAUDE] (Tampilan sudah dibuat, Ambil Gaji bulan lalu menyusul) Popup per karyawan (Rincian Gaji, Info lainnya) dengan komponen di atas dan "Ambil Gaji bulan lalu".
- [ ] H.4 [CLAUDE] (Sudah dibuat 2026-10-23, menunggu tes manual) Simpan, ubah, dan hapus gaji; jurnal otomatis Debit Beban Gaji, Kredit Utang Beban (akun dipilih di Info lainnya).
- [ ] H.5 [CLAUDE] (Sudah dibuat 2026-10-23, menunggu tes manual; skema akhir: Proses ▾ Gaji membuka Jurnal Umum berisi Debit Utang Beban sebesar gaji, pengguna menambah Kas/Bank Kredit dan mengatur Program; dibayar penuh sekali; gaji yang sudah dibayar terkunci) Tombol Proses: buka Jurnal Umum terisi (Beban Gaji dan Kas/Bank), Program/Divisi diatur pengguna di Detail Akun, tandai gaji sudah diproses agar tidak dobel.
- [ ] H.6 [CLAUDE] Lampiran, Log Aktivitas, dan ikut Cadangan Data.
- [ ] H.7 [CLAUDE] Nasib modul Gaji/Tunjangan di Master Data (daftarGaji): dipakai, diubah, atau dihapus. Tanyakan dulu.

**Selesai kalau:**
- [ ] Gaji bulanan satu karyawan bisa dibuat, disimpan, diubah, dan dihapus.
- [ ] Jurnal dari Proses seimbang dan angkanya sama dengan total Gaji dibayarkan.
- [ ] Proses tidak bisa dipakai dua kali untuk gaji yang sama.
- [ ] Akun beban gaji wajib dipilih sebelum Proses, dengan pesan yang jelas.
- [ ] Setelah Proses, baris Beban Gaji bisa dipecah dan diberi Program/Divisi lewat Detail Akun.
- [ ] Teks bahasa Indonesia sederhana; tampilan HP baik; Console tanpa error.

**Sengaja belum dikerjakan:** hitungan PPh 21, BPJS, slip gaji cetak, menu Pembayaran Kas/Bank sungguhan.

---

## Tahap H3 — Pencatatan Gaji skema A (PRD 3.3, 4.2, 6.2; disusun 2026-10-25)

**Menggantikan** H.4 (jurnal Beban/Utang saat simpan), H.5 (Proses ke Jurnal Umum), H.7 (nasib Gaji/Tunjangan: dihapus), dan H2.4 (baris Utang Beban). Urutan disusun supaya setiap langkah bisa dites sendiri.

**Tugas:**
- [x] H3.1 [CLAUDE] (dites pengguna 2026-10-25: berhasil) (Sudah dibuat 2026-10-25, menunggu tes manual) Pencatatan Gaji **tanpa jurnal**: simpan tidak lagi membuat jurnal, tab Info lainnya (akun Beban/Utang) dibuang, jurnal gaji lama dibersihkan sekali, Proses ke Jurnal Umum dimatikan sementara, aturan "sekali per periode per tipe", status bayar (Belum dibayar / Sebagian / Lunas) dihitung dari baris Pembayaran. Perbaikan dari pengguna (2026-10-25): tombol Proses aktif begitu rincian berisi karyawan tanpa harus disimpan dulu; Proses > Gaji menyimpan otomatis (simpan dan Proses memakai satu fungsi yang sama, simpanPencatatanGaji).
- [ ] H3.2 [CLAUDE] (Ditunda 2026-10-25: pengguna pindah ke Kas & Bank) Komponen dan Tipe Pembayaran bisa diatur (Preferensi > Gaji): tambah, ganti nama, urutkan, nonaktifkan, tandai tipe; bawaan 6 komponen + Bulanan/THR/Bonus. Formulir dan popup gaji membaca daftar ini.
- [ ] H3.3 [CLAUDE] (Ditunda 2026-10-25) Tab **Gaji** di Master Karyawan (nilai tetap tiap komponen); terisi otomatis saat karyawan dipilih di Pencatatan Gaji.
- [x] H3.4 [CLAUDE] (dites pengguna 2026-10-25: berhasil) (Sudah dibuat 2026-10-25, menunggu tes manual; menggantikan H2.3) Simpan, ubah, hapus **Pembayaran** (= H2.3) dengan jurnal Debit rincian / Kredit Kas/Bank, termasuk baris Beban Gaji bertaut Pencatatan Gaji (boleh beberapa kali sampai lunas, tidak melebihi sisa).
- [x] H3.5 [CLAUDE] (dites pengguna 2026-10-25: berhasil) (Dimajukan atas permintaan pengguna, sudah dibuat 2026-10-25 mengikuti foto Accurate, menunggu tes manual; akun Beban Gaji dipilih di Info lainnya Pencatatan Gaji) Tombol **Proses → Gaji** membuka Pembayaran baru berisi baris Beban Gaji sebesar sisa yang belum dibayar; baris Jurnal Umum tidak bisa ditautkan ke gaji.
- [ ] H3.6 [CLAUDE] (Ditunda 2026-10-25) **Slip gaji**: Desain Cetakan tipe Slip Gaji (masa kerja, terbilang, status bayar, tanda tangan); cetak per karyawan, cetak semua, kirim WhatsApp.
- [ ] H3.7 [CLAUDE] (Ditunda 2026-10-25) Hapus halaman master Gaji/Tunjangan lama (dan datanya, setelah ditanyakan).

**Selesai kalau:** alur PRD 6.2 berjalan dari pencatatan, pembayaran sebagian dan lunas, sampai slip tercetak; jurnal gaji hanya muncul dari Pembayaran; audit keamanan dan pemeriksaan kode ganda bersih.

---

## Tahap H2 — Pembayaran Kas/Bank (seperti Accurate)

**Tujuan:** Mencatat uang keluar dari Kas/Bank lewat formulir khusus, dan dipakai juga untuk membayar gaji (tombol Proses di Pencatatan Gaji).

**Tugas (menunggu persetujuan):**
- [x] H2.1 [CLAUDE] (Digantikan H2.6; dikonfirmasi pengguna 2026-10-26) Ikon Kas di menu samping membuka popup "Kas & Bank": kotak Pembayaran (aktif), Penerimaan dan Transfer (belum tersedia).
- [x] H2.2 [CLAUDE] (Digantikan H2.7a; dikonfirmasi pengguna 2026-10-26; Info lainnya halaman: No Cek #, Penerima, Catatan) Tampilan formulir Pembayaran: Kas/Bank, Tanggal, No Bukti (otomatis, tipe penomoran baru "Pembayaran"), Ambil (menyusul), cari akun, tabel Akun / Nama Akun / Nilai, total Nilai; popup Rincian Pembayaran (Rincian Pembayaran; Info lainnya: Divisi, Program, Catatan, Pencatatan Gaji).
- [x] H2.3 [CLAUDE] (Digantikan H3.4, selesai 2026-10-25) Simpan, ubah, hapus Pembayaran; jurnal otomatis Debit akun-akun rincian, Kredit Kas/Bank; Log Aktivitas; ikut Cadangan Data.
- [x] H2.4 [CLAUDE] (Digantikan H3.5 skema A: baris Beban Gaji, bukan Utang Beban; selesai 2026-10-25) Proses > Gaji di Pencatatan Gaji membuka Pembayaran (bukan Jurnal Umum), baris Utang Beban terisi dan berkait ke gajinya.
- [x] H2.5 [CLAUDE] (dites pengguna 2026-10-25: berhasil; diubah atas permintaan pengguna: tanpa filter; daftar Jurnal Umum hanya berisi jurnal Jurnal Umum, seperti Accurate) Daftar Jurnal Umum tidak bercampur. Jurnal otomatis dari Pembayaran, Penerimaan, Transfer, dll. tidak tampil di sana, tetapi tetap dihitung di saldo dan laporan.
- [x] H2.6 [CLAUDE] (dites pengguna 2026-10-26: berhasil) Popup Kas & Bank mengikuti foto Accurate: Pembayaran, Penerimaan, Transfer Bank, Histori Bank, Rekonsiliasi Bank (PRD 6.3).
- [x] H2.7 [CLAUDE] **Penerimaan** (PRD 6.3, dari foto Accurate), dikerjakan bertahap:
  - [x] H2.7a (dites pengguna 2026-10-25: berhasil) Komponen bersama transaksi Kas/Bank di umum/ (tampilan, rincian, simpan, jurnal); Pembayaran dipindah ke komponen ini tanpa mengubah perilakunya; daftar Pembayaran ikut kolom Accurate.
  - [x] H2.7b (dites pengguna 2026-10-25: berhasil) Penerimaan (fitur/penerimaan/) memakai komponen itu: Pemberi, Atas Penerimaan, jurnal Debit Kas/Bank, Kredit rincian; kotak Penerimaan di popup Kas & Bank aktif.
  - [x] H2.7c (dites pengguna 2026-10-26: berhasil) No Bukti mengikuti Kas/Bank: aturan penomoran bisa ditautkan ke akun Kas/Bank, otomatis terpilih, tetap bisa dipilih/diketik sendiri (menutup Temuan 8).
- [x] H2.8 [CLAUDE] (dari foto Accurate; dites pengguna 2026-10-26: berhasil) **Transfer Bank** (fitur/transfer/): Dari/Ke Kas/Bank, Nilai Transfer, Catatan; jurnal Debit tujuan, Kredit asal; tab biaya tidak dipakai.
- [x] H2.9 [CLAUDE] (dari foto Accurate; dites pengguna 2026-10-26: berhasil) **Histori Bank**: transaksi satu akun Kas/Bank dengan saldo berjalan (cara hitung dipakai bersama dengan Histori Akun).
- [x] H2.10 [CLAUDE] (dari foto Accurate; dites pengguna 2026-10-26: berhasil) **Rekonsiliasi Bank** (PRD 6.3): kartu transaksi + tombol "Ada di Rekening Koran", konfirmasi sekali tiap halaman dibuka, yang cocok hilang dari daftar (bisa dibatalkan), transaksi yang sudah cocok tidak bisa diubah/dihapus. Folder fitur/rekonsiliasi-bank/. Tambahan 2026-10-26 (foto Accurate): "Saldo Rp ..." dan tampilan kosong bergambar "Tidak ada data mutasi kas/bank yang tersedia".
- [x] H2.10b [CLAUDE] (dari foto Accurate; dites pengguna 2026-10-26: berhasil) **Ceklis rekonsiliasi di Histori Bank** (PRD 6.3): kolom # berisi ceklis hijau untuk transaksi yang sudah cocok; klik ceklis + konfirmasi membatalkan tandanya. Batalkan tanda dipakai bersama dengan Rekonsiliasi Bank (fitur/jurnal/jurnal.js).
- [x] H2.13 [CLAUDE] **Histori bersama + tombol ⇄ + Histori Akun** (PRD 6.3 tambahan, 6.4; dari foto Accurate 2026-10-26). PRD disetujui 2026-10-26.
  - [x] H2.13a (dites pengguna 2026-10-26: berhasil) Halaman Histori Bank dijadikan komponen bersama di umum/ (seperti komponen transaksi Kas/Bank), tanpa mengubah perilakunya; kolom No Cek dan # bisa dinyalakan/dimatikan.
  - [x] H2.13b (dites pengguna 2026-10-26: berhasil) Tombol ⇄ Mutasi ↔ Debit/Kredit (diingat browser), Saldo Awal tampil di kolom Mutasi, Total Debit/Kredit, CSV mengikuti tampilan.
  - [x] H2.13c (dites pengguna 2026-10-26: berhasil) Histori Akun (fitur/histori-akun/) memakai komponen itu: Kas & Bank tingkat 3, tanpa No Cek dan ceklis; kotak Histori Akun di popup Buku Besar aktif.
- [ ] H2.11 [CLAUDE] (Ditunda 2026-10-26 atas permintaan pengguna, dibahas nanti) **Lampiran transaksi** (PRD 5.4): kode lampiran Jurnal Umum dijadikan komponen bersama di umum/, lalu dipakai Pembayaran, Penerimaan, Transfer, dan Pencatatan Gaji. Menunggu foto Accurate (menu klip/lampiran).
- [ ] H2.12 [CLAUDE] (Ditunda 2026-10-26 atas permintaan pengguna, dibahas nanti) **Cetak bukti Kas/Bank** (PRD 2.1, Cetak): tipe Desain Cetakan "Bukti Pembayaran", pengisian data transaksi ke desain, cetak/simpan PDF untuk Pembayaran, Penerimaan, Transfer. Menunggu foto Accurate (menu cetak dan contoh hasil cetak).

**Selesai kalau:**
- [ ] Pembayaran tersimpan membuat jurnal seimbang dan saldo Kas/Bank berkurang.
- [ ] Gaji dibayar lewat Pembayaran, penuh, sekali; status bayar gaji tetap benar.
- [ ] Daftar Jurnal Umum hanya menampilkan jurnal umum, kecuali filter diganti.
- [ ] Teks bahasa Indonesia sederhana; tampilan HP baik; Console tanpa error.

**Sengaja belum dikerjakan:** Penerimaan, Transfer, cicilan pembayaran, Ambil dari dokumen lain.

---

## Tahap D0 — Persiapan Donasi: perubahan kecil fitur lama (PRD 2.3, 4.1, 5.6, Keputusan 6–9; disetujui 2026-10-26)

**Tujuan:** Menyesuaikan fitur yang sudah ada dengan aturan baru: dana terikat tidak lagi ditandai lewat Program.

- [x] D0.1 [CLAUDE] (dites pengguna 2026-10-26: berhasil) Hapus saklar "Kategori Keuangan" dan "Donatur" dari Preferensi > Fitur (Keputusan 6 dan 7).
- [x] D0.2 [CLAUDE] (dites pengguna 2026-10-26: berhasil) Hapus isian "Sifat Dana" dari Master Data > Program (formulir, daftar, pemeriksaan wajib, log). Data lama yang masih menyimpan sifat dibiarkan dan tidak dipakai (Keputusan 8a).
- [x] D0.3 [CLAUDE] (dites pengguna 2026-10-26: berhasil) Centang "Terikat" di tab Info lainnya popup baris Pembayaran (semua baris, termasuk gaji) dan popup Detail Akun Jurnal Umum; disimpan di rincian, ikut ke baris jurnal, baris baru mengikuti baris terakhir; tidak muncul di Penerimaan (PRD 4.1, Keputusan 9).

---

## Tahap D1 — Donasi (PRD 6.1; dari foto Accurate)

**Tujuan:** Menu Donasi lengkap: Pencatatan Donasi, Pemindahan Dana, Kategori Donasi, Donatur, Target Donasi. Tiap fitur dibahas dari foto Accurate dulu, lalu ditulis di PRD. (Penyaluran Bantuan dan Pengembalian Donasi dihilangkan 2026-10-29: dicatat lewat Pembayaran.)

- [x] D1.1 [CLAUDE] (dites pengguna 2026-10-27: berhasil, termasuk ikon baru; folder fitur/donasi/) Popup menu Donasi (ikon Donasi di menu samping), 7 kotak sesuai pemilahan PRD 6.1, warna seperti Accurate (hijau transaksi, biru data, oranye target). Semua kotak "belum tersedia" dulu. Saklar baru "Pengembalian Donasi" di Preferensi > Fitur (awalnya mati); saat mati, kotaknya tidak muncul.
- [x] D1.2 [CLAUDE] (dites pengguna 2026-10-27: berhasil) Preferensi > Akun Perkiraan > Pendapatan: kolom "Pendapatan Donasi" dipecah menjadi "Donasi Terikat" dan "Donasi Tidak Terikat" (PRD 6.1). Isi lama (kalau ada) pindah ke Tidak Terikat. Alat bersama untuk membaca: akun donasi (gabungan keduanya) dan sifat sebuah akun (terikat / tidak terikat / belum diatur).
- [x] D1.3 [CLAUDE] (dites pengguna 2026-10-27: berhasil semua bagian — 1 tampilan + daftar, 2 simpan + akun otomatis, 3a kunci akun di Akun Perkiraan, 3b ubah kategori, 3c hapus kategori + keluar dari Preferensi) Kategori Donasi (folder fitur/kategori-donasi/): formulir tab Umum (Nama Donasi, Sub dari, Kode otomatis terkunci, Kelompok pilih/tambah) dan tab Lainnya (Catatan), simpan membuat akun pendapatan otomatis, ubah/hapus ikut ke akun, akunnya terkunci di Akun Perkiraan; daftar kolom Nama, Kode, Kelompok, Terikat/Tidak Terikat, filter Kelompok dan Terikat; kotak Kategori Donasi di popup Donasi aktif.
- [x] D1.4 [CLAUDE] (semua bagian dites pengguna, selesai 2026-10-29) Donatur (folder fitur/donatur/, PRD 6.1 disetujui 2026-10-28). Dikerjakan bertahap, tiap bagian dites dulu:
  - [x] Bagian 1 (dites pengguna 2026-10-28: berhasil) — Tampilan: kotak Donatur di popup Donasi aktif; formulir tab Umum (Info Umum: Nama, ID Donatur + tombol geser, Kategori pilih/ketik, No. Telepon, Handphone, No. WhatsApp, Email; Info Lainnya: Jalan, Kota) dan tab Lainnya (Catatan, Non Aktif); daftar kolom Nama, ID Donatur, Kontak Utama, Kategori, Total Donasi (Rp 0 dulu), tanpa filter.
  - [x] Bagian 2 (dites pengguna 2026-10-28: berhasil) — Simpan dan ubah: Nama wajib (boleh sama); ID otomatis D.00001 berikutnya saat tombol menyala, diketik sendiri saat mati; ID wajib dan tidak boleh kembar; Log Aktivitas mencatat perubahan (termasuk nama lama → nama baru).
  - [x] Bagian 3 (dites pengguna 2026-10-28: berhasil; kunci nama dan Non Aktif Hamba Allah ditambahkan sesudahnya, Temuan 25, dites pengguna 2026-10-29: berhasil) — Hamba Allah dan hapus: donatur bawaan "Hamba Allah" dibuat otomatis dan tidak bisa dihapus; hapus donatur lain lewat konfirmasi. (Tolak hapus untuk donatur yang sudah berdonasi, Total Donasi, dan nama donatur yang diambil lewat ID di transaksi dikerjakan bersama Pencatatan Donasi.)
- [x] D0.4 [CLAUDE] (permintaan pengguna 2026-10-28, PRD 4.1; dites pengguna: berhasil; ditambah peringatan saat klik Lanjut, dites pengguna 2026-10-29: berhasil) Bagian Dana di popup baris Jurnal Umum dan Pembayaran: dua centang Terikat dan Tidak Terikat (hanya satu); tidak bisa disimpan kalau ada baris selain Kas & Bank yang belum dipilih; baris baru ikut baris terakhir; data lama = Tidak Terikat. Ditambah (permintaan pengguna 2026-10-28): Divisi wajib di setiap baris Jurnal Umum, Pembayaran, Penerimaan (kecuali Kas & Bank); peringatan keduanya sebagai notifikasi di pojok kanan atas.
- [x] D1.5 [CLAUDE] (semua bagian dites pengguna, selesai 2026-10-29) Pencatatan Donasi (folder fitur/pencatatan-donasi/, PRD 6.1 disetujui 2026-10-28). Komponen bersama Pembayaran/Penerimaan sudah dicek (mirip ±70%); pengguna memilih **komponen sendiri** (2026-10-28) supaya Pembayaran/Penerimaan tidak tersentuh, tetapi alat kecil bersama tetap dipakai (nomor otomatis, kolom cari, pilihan Kas/Bank, simpan dengan jurnal, rekonsiliasi). Dikerjakan bertahap, tiap bagian dites dulu:
  - [x] Bagian 1 (dites pengguna 2026-10-28: berhasil, termasuk susunan atas yang diubah) — Tampilan: kotak Pencatatan Donasi di popup Donasi aktif; bagian atas kiri Donatur, Kas/Bank, Nilai Pembayaran (= jumlah rincian), kanan No Bukti + saklar Otomatis, Tanggal; tabel rincian Nama Donasi, Kode, Nilai + Total; tab "i" Info lainnya (Cara Bayar Tunai/Transfer/QRIS, Keterangan, Terekonsiliasi); popup baris (tab Rincian Donasi dan Info lainnya: Divisi, Program, Keterangan); daftar kolom Nomor, Tanggal, Donatur, Kas/Bank, Cara Bayar, Kategori Donasi, Keterangan, Nilai dengan filter Tanggal, Cara Bayar, Kas/Bank.
  - [x] Bagian 2 (dites pengguna 2026-10-28: berhasil, termasuk label pilihan Donatur dan tombol data baru untuk nama yang mirip) — Pilihan dan baris: Donatur hanya yang aktif; nama donatur yang belum ada bisa langsung disimpan sebagai donatur baru lewat tombol Simpan "…" sebagai data baru? (hanya nama, ID otomatis); Nama Donasi hanya Kategori Donasi yang akunnya ada di kolom Donasi Terikat/Tidak Terikat Preferensi; tambah/ubah/hapus baris; baris baru mengikuti Divisi dan Program baris terakhir; Total terhitung.
  - [x] Sisipan (keputusan pengguna 2026-10-28; dibuat di umum/pemilih-opsi.js; pengguna: "oke lanjut" 2026-10-28; ditambah titik ribuan saat mengetik dan Temuan 26) — **Label pilihan di semua kotak pilihan formulir** (PRD 5.1): satu alat bersama di umum/ yang mengubah setiap kotak pilihan isian formulir/popup menjadi kolom cari/pilih berlabel ✖ (kotak pilihan aslinya tetap ada tapi disembunyikan, jadi kode fitur tidak berubah), seperti kalender. Filter daftar dan pilihan Dashboard tidak diubah. Semua uji dijalankan ulang dan tampilan semua halaman dibandingkan.
  - [x] Bagian 3 (dites pengguna 2026-10-29: berhasil, termasuk No Bukti manual; tipe penomoran Donasi kini bisa ditautkan ke Kas/Bank) — Simpan, ubah, hapus: pemeriksaan (Donatur, Setor ke, No Bukti tidak kembar, minimal satu baris, Nilai > 0, Divisi wajib); jurnal otomatis (Debit Kas/Bank, Kredit akun donasi per baris dengan Divisi/Program/Keterangan); donasi yang sudah direkonsiliasi tidak bisa diubah/dihapus; Log Aktivitas.
  - [x] Bagian 4 — Hubungan dengan Donatur (tertunda dari D1.4): nama donatur selalu diambil lewat id (ganti nama di Donatur ikut berubah di daftar dan formulir donasi); donatur yang sudah berdonasi tidak bisa dihapus; kolom Total Donasi terisi; rincian donatur menampilkan riwayat donasinya. Dikerjakan dua langkah:
    - [x] 4a (dites pengguna 2026-10-29: berhasil) — Total Donasi di daftar Donatur dan tolak hapus donatur yang sudah berdonasi (fitur/donatur/donatur.js).
    - [x] 4b (PRD 6.1 disetujui 2026-10-29; di Accurate tidak ada, dirancang sendiri; dites pengguna 2026-10-29: berhasil)
- [x] D1.7 [CLAUDE] (semua bagian dites pengguna, selesai 2026-11-02) Pemindahan Dana (folder fitur/pemindahan-dana/, PRD 4.2 + 6.0 + 6.1 disetujui 2026-10-29 setelah melihat gambar contoh; di Accurate tidak ada). Dikerjakan bertahap, tiap bagian dites dulu:
  - [x] Bagian 1 (dites pengguna 2026-10-30: berhasil) — Dasar: kelompok **Aset Neto** di Preferensi > Akun Perkiraan (Aset Neto Terikat dan Tidak Terikat, hanya akun bertipe modal); alat bersama **sisa dana Program** per tanggal dari buku jurnal (PRD 6.0); tipe penomoran Pemindahan Dana.
  - [x] Bagian 2 (dibuat ulang 2026-10-29 sesuai rancangan baru: hanya ke Dana Umum; dites pengguna 2026-10-30: berhasil) — Tampilan: kotak Pemindahan Dana di popup Donasi aktif; bagian atas rapi dalam satu kotak (kiri Dari Program + sisa dana, Ambil dari Kas/Bank, Nilai Pemindahan hanya dibaca; kanan No Bukti, Tanggal); tab Tujuan: cari Kas/Bank → popup Tujuan Pemindahan (Ke Dana Umum, Kas/Bank, Nilai + tombol Semua sisa) → satu baris; tab "i" Alasan; Total; daftar kolom No Bukti, Tanggal, Dari Program, Dari Kas/Bank, Ke Kas/Bank, Alasan, Nilai dengan filter Tanggal dan Dari Program.
  - [x] Bagian 4 (dites pengguna 2026-11-02: berhasil; rancangan 2026-10-30 disetujui; dikerjakan sesudah bagian 3 dibuat, sebelum tes manual bagian 3) — **Dua arah**: Jenis Pemindahan "Sisa Program → Dana Umum" dan "Dana Umum → Divisi"; Dana Umum = Aset Neto Tidak Terikat tanpa Divisi dan tanpa Program (sisa Dana Umum dihitung dari jurnal); popup arah ② memilih Divisi tujuan; jurnal tiap arah; daftar dengan kolom Jenis, Dari, Ke dan filter Jenis. Bagian 3 dan 4 dites bersama.
  - [x] Bagian 3 (dites pengguna 2026-11-02 bersama bagian 4: berhasil) — Simpan, ubah, hapus: pemeriksaan (Program asal, Ambil dari, tanggal, tujuan, Alasan, No Bukti tidak kembar, akun Aset Neto sudah dipilih, Nilai ≤ sisa dana); jurnal otomatis (Aset Neto Terikat → Tidak Terikat, dan Kas asal → Kas Dana Umum kalau berbeda); tampil di Histori Bank/Rekonsiliasi; tanggal terkunci; Log Aktivitas.
- [ ] D1.12 [CLAUDE] (Temuan 30, audit D1; pengguna: "kerjakan sekarang") Huruf disimpan di folder proyek (tanpa Google Fonts dari internet) dan Content-Security-Policy di index.html. (login.html masih tiruan dengan skrip di dalam HTML; CSP-nya ikut Tahap K.)
- [ ] D1.11 [CLAUDE] (Temuan 29, audit D1; PRD 5.3 sudah mengatur) Transaksi bertanggal **sebelum tanggal mulai pembukuan** (Preferensi > Data) ditolak di pemeriksa tanggal bersama, dan kalender tanggal transaksi tidak bisa memilih hari sebelumnya (Tanggal Masuk Karyawan dikecualikan).
- [ ] D1.10 [CLAUDE] (Temuan 28, audit D1; PRD 6.1 disetujui 2026-11-02) Pengaman **sisa yang bisa dipindah** di Pemindahan Dana: sisa terendah mulai tanggal pemindahan ke depan (bukan per tanggal saja), dipakai saat Simpan, di kotak sisa, dan tombol "Semua sisa"; arah ① dan ②.
- [x] D1.9 [CLAUDE] (dites pengguna 2026-11-02: berhasil; permintaan pengguna 2026-10-30, PRD 5.1) **Pengaman urutan isian** di semua formulir berincian (Pembayaran, Penerimaan, Pencatatan Donasi, Pemindahan Dana, Jurnal Umum, Pencatatan Gaji): satu alat bersama buatSyaratIsian.
- [x] D1.8 [CLAUDE] (dites pengguna 2026-11-02: berhasil; Temuan 27, PRD 5.6, keputusan pengguna 2026-10-30) Pengaman **Kas/Bank minus** untuk semua transaksi berjurnal (Jurnal Umum, Pembayaran, Penerimaan, Transfer, Pencatatan Donasi, Pemindahan Dana): satu alat bersama di umum/; pilihan Ditolak (bawaan) / Peringatan saja di Preferensi > Pembatasan > Lainnya.
- [x] D1.6 [CLAUDE] (semua bagian dites pengguna, selesai 2026-10-29) Target Donasi (folder fitur/target-donasi/, PRD 6.1 disetujui 2026-10-29 setelah melihat gambar contoh; di Accurate tidak ada). Dikerjakan bertahap, tiap bagian dites dulu:
  - [x] Bagian 1 (dites pengguna 2026-10-29: berhasil; formulir tanpa tab kecil sesuai gambar contoh) — Formulir dan simpan: kotak Target Donasi di popup Donasi aktif; Nama Target, Program (hanya yang berjalan), Periode mulai s/d selesai, Nilai Target, Catatan; pemeriksaan wajib dan tanggal; simpan, ubah, hapus lewat konfirmasi, Log Aktivitas; daftar kolom Nama Target, Program, Periode, Status, Target.
  - [x] Bagian 2 (dites pengguna 2026-10-29: berhasil) — Capaian: kolom Terkumpul (jumlah baris rincian Pencatatan Donasi ber-Program sama dalam periode), Sisa, Capaian (bar + persen, berhenti di 100%, hijau ✓ kalau tercapai); filter Program dan Status; pilihan Tampilkan (Yang masih berjalan / Semua: sembunyikan target ber-Program Selesai atau berperiode lewat, permintaan pengguna 2026-10-29); Program yang dipakai target tidak bisa dihapus di Master Data. — Tab ketiga **Riwayat Donasi** di formulir Donatur: tabel Tanggal, No Bukti, Nama Donasi (panjang dipotong "…"), Kas/Bank, Nilai; terbaru di atas; tabel bergulir ke bawah dengan judul kolom tetap; pilihan Tahun (awalnya tahun ini, ada Semua); Total (n donasi) di bawah; hanya untuk dilihat.

---

## Tahap P — Membagi kode per fitur (disetujui 2026-10-23, pilihan A: JavaScript dulu, CSS menyusul)

**Tujuan:** menu.html tidak terlalu panjang; tiap fitur punya file JavaScript sendiri di folder js/. Hanya memindahkan kode, tanpa mengubah fungsi. HTML tetap satu file (memecah HTML butuh server).

**Tugas (satu file per langkah, semua uji dijalankan ulang tiap langkah):**
- [ ] P.1 [CLAUDE] (Sudah dibuat 2026-10-23, menunggu tes manual) js/jurnal.js — Jurnal Umum dan lampiran jurnal.
- [ ] P.2 [CLAUDE] (Sudah dibuat 2026-10-23, menunggu tes manual) js/gaji.js — Pencatatan Gaji.
- [ ] P.3 [CLAUDE] (Sudah dibuat 2026-10-23, menunggu tes manual) js/kas-bank.js — popup Kas & Bank dan Pembayaran.
- [ ] P.4 [CLAUDE] (Sudah dibuat 2026-10-23, menunggu tes manual) js/akun.js — Akun Perkiraan dan bagan akun awal.
- [ ] P.5 [CLAUDE] (Sudah dibuat 2026-10-23, menunggu tes manual) js/master-data.js — Divisi, Program, Karyawan, Gaji/Tunjangan.
- [ ] P.6 [CLAUDE] (Sudah dibuat 2026-10-23, menunggu tes manual; dibagi tiga karena panjang) js/pengaturan.js (Log Aktivitas, Pengguna, Penomoran), js/cetakan.js (Desain Cetakan dan editor), js/cadangan.js (Cadangan Data).
- [ ] P.7 [CLAUDE] (Sudah dibuat 2026-10-23, menunggu tes manual; dibagi empat) js/inti.js (popup menu, notifikasi, konfirmasi, tab), js/preferensi.js (Preferensi, kalender, format), js/komponen-daftar.js (buatModulDaftar, kunci cadangan), js/bilah-atas.js (pilihan pembukuan).
- [ ] P.8 [CLAUDE] (Sudah dibuat 2026-10-23 atas permintaan 'lanjutkan sampai selesai', menunggu tes manual) menu.css dibagi jadi 8 file bernomor di css/ (01-dasar ... 08-transaksi); 14 tangkapan layar sebelum/sesudah sama persis; menu.css lama dihapus.

**Selesai kalau:** semua uji lolos, Console tanpa error, menu.html hanya berisi HTML dan daftar file script.

---

## Tahap Q — Folder per fitur (disetujui 2026-10-23)

**Tujuan:** susunan rapi untuk ke depan: satu fitur = satu folder berisi tampilan (HTML), logika (JS), dan gaya (CSS). menu.html tinggal kerangka. Tetap jalan tanpa server, dan nanti mudah dipindah ke PHP (tampilan.js -> tampilan.php).

**Susunan akhir:**
```
menu.html              kerangka: bilah atas, menu samping, tempat tab, popup menu
umum/                  dipakai semua fitur (inti, preferensi, komponen daftar, kalender, gaya dasar)
fitur/<nama>/          tampilan.js (HTML halaman dan popupnya), <nama>.js (logika), <nama>.css (gaya)
```

**Cara memasang HTML:** menu.html berisi penanda tempat (`<template data-tempat="nama">`). tampilan.js tiap fitur mengganti penanda itu dengan HTML-nya, sehingga urutan HTML sama persis dengan sebelumnya. Semua tampilan.js dimuat lebih dulu, baru logika.

**Tugas (satu langkah, semua uji + perbandingan tangkapan layar dan isi halaman sebelum/sesudah):**
- [ ] Q.1 [CLAUDE] (Sudah dibuat 2026-10-23, menunggu tes manual) Folder umum/: pindahkan inti, preferensi, komponen-daftar, bilah-atas, dan CSS bersama; siapkan pemasang tampilan.
- [ ] Q.2 [CLAUDE] (Sudah dibuat 2026-10-23, menunggu tes manual) fitur/jurnal/ (Jurnal Umum dan lampiran).
- [ ] Q.3 [CLAUDE] (Sudah dibuat 2026-10-23, menunggu tes manual) fitur/gaji/ (Pencatatan Gaji).
- [ ] Q.4 [CLAUDE] (Sudah dibuat 2026-10-23, menunggu tes manual) fitur/kas-bank/ (popup Kas & Bank dan Pembayaran).
- [ ] Q.5 [CLAUDE] (Sudah dibuat 2026-10-23, menunggu tes manual) fitur/akun/ (Akun Perkiraan).
- [ ] Q.6 [CLAUDE] (Sudah dibuat 2026-10-23, menunggu tes manual) fitur/master-data/ (Divisi, Program, Karyawan, Gaji/Tunjangan).
- [ ] Q.7 [CLAUDE] (Sudah dibuat 2026-10-23, menunggu tes manual) fitur/pengaturan/ (Log Aktivitas, Pengguna, Penomoran).
- [ ] Q.8 [CLAUDE] (Sudah dibuat 2026-10-23, menunggu tes manual) fitur/cetakan/ dan fitur/cadangan/.
- [ ] Q.9 [CLAUDE] (Sudah dibuat 2026-10-23, menunggu tes manual) Preferensi dan Dashboard ke folder sendiri; folder js/ dan css/ lama dihapus bila sudah kosong.

**Selesai kalau:** tampilan sama persis (tangkapan layar identik), isi halaman setelah dimuat sama, semua uji lolos, Console tanpa error.

**Hasil (2026-10-23):** menu.html 156 baris (hanya daftar file dan penanda tempat; bilah atas, menu samping, popup menu, dan konfirmasi dipindah ke umum/tampilan-kerangka.js dan umum/tampilan-popup.js; 37 dari 38 tangkapan layar selalu identik; Dashboard desktop kadang berbeda pada penghalusan huruf kotak pilihan 'Dashboard Utama' saja, tidak menentu antar pengambilan, posisi/ukuran/isi sama). 37 dari 38 tangkapan layar identik; 1 (Dashboard desktop) berbeda hanya pada penghalusan huruf di kotak pilihan 'Dashboard Utama' (posisi, ukuran, isi sama). Isi halaman setelah dimuat identik. Folder js/ dan css/ lama dihapus. Popup menu (Pengaturan, Master Data, Buku Besar, Kas & Bank) dan popup konfirmasi tetap di kerangka menu.html. Logika Preferensi tetap di umum/preferensi.js karena dipakai bersama.

---

## Tahap R — Perapihan menyeluruh sebelum fitur baru (audit 2026-10-24)

**Tujuan:** kode bebas celah dan tersusun seperti buatan programmer profesional: tidak ada kode berulang, komentar sesuai kenyataan, tidak ada sisa lama, dan ada alat pemeriksa yang bisa dipakai lagi.

**Hasil audit (tanpa mengubah kode):**
- Bersih: 0 variabel tak terdefinisi (ESLint), 0 nama global ganda antar file, 0 nama global terbengkalai, 0 id ganda di halaman, 0 label/aria yang menunjuk elemen tak ada, 0 kebocoran memori (pendengar berulang, pengulang waktu, alamat file sementara), semua innerHTML hanya berisi teks tetap milik aplikasi, format file seragam.
- Perlu diperbaiki:
  1. Celah keamanan: ekspor CSV belum dilindungi dari "CSV injection" (isi sel diawali = + - @ bisa dijalankan Excel sebagai rumus).
  2. Komentar dan teks usang: ±25 tempat masih menulis "TAMPILAN SAJA", "lampiran menyusul", "langkah berikutnya", "tema.css", padahal sudah berubah.
  3. ±9 kelas CSS mati (sisa desain lama), 1 variabel tak terpakai (akunPerkiraan), 37 catch dengan variabel tak terpakai.
  4. Kode berulang: pencarian akun (Jurnal dan Pembayaran), pencarian karyawan (Gaji), nomor otomatis (Jurnal, Gaji, Pembayaran), dan pengisi pilihan akun/divisi/program (5 tempat) ditulis berulang-ulang. Kalau ada perbaikan, harus diubah di banyak tempat.
  5. 515 nama global (semua file berbagi satu ruang nama).

**Tugas (tiap langkah: semua uji + perbandingan tangkapan layar dengan acuan):**
- [ ] R.1 [CLAUDE] (Sudah dibuat 2026-10-25, menunggu tes manual) Tutup celah CSV injection (+ uji).
- [ ] R.2 [CLAUDE] (Sudah dibuat 2026-10-25, menunggu tes manual) Rapikan komentar dan teks usang, variabel tak terpakai, catch tanpa variabel.
- [ ] R.3 [CLAUDE] (Sudah dibuat 2026-10-25, menunggu tes manual) Hapus CSS mati.
- [ ] R.4 [CLAUDE] (Sudah dibuat 2026-10-25, menunggu tes manual) Satukan kode berulang ke komponen bersama di umum/: (a) pengisi pilihan akun/divisi/program, (b) nomor otomatis, (c) kolom cari (akun dan karyawan).
- [ ] R.5 [CLAUDE] (Sudah dibuat 2026-10-25, menunggu tes manual) README.md (susunan folder, cara menjalankan, aturan), .editorconfig (format seragam di editor), dan catatan cara memeriksa kode.
- [ ] R.6 [CLAUDE] (TANYAKAN DULU) Mengurangi nama global dengan "ruang nama" per fitur. Disarankan ditunda ke tahap server, karena menambah kerumitan bagi pemula dan akan terjadi alami saat pindah ke modul.

**Selesai kalau:** ESLint 0 temuan, semua uji lolos, tampilan identik dengan acuan, tidak ada kode yang ditulis dua kali untuk tugas yang sama.

**Hasil (2026-10-25):** semua file dibaca baris per baris. ESLint 0 temuan (catch tanpa pemakaian variabel dibiarkan; itu wajar). Uji: jsdom 24 rangkaian dan Chrome 12 rangkaian lolos, termasuk uji baru "data rusak" (17 pemeriksaan: CSV aman, semua tab dan formulir tetap terbuka walau data di penyimpanan rusak). Isi halaman sama dengan acuan; tangkapan layar yang berbeda hanya karena tanggal hari ini dan 2 baris baru di Cadangan Data. Alat bersama baru di umum/: alat.js (buatId, teksAman, rincianAman, isiPilihan) dan komponen-transaksi.js (kolom cari, nomor otomatis, tab). Jurnal 940→660 baris, Gaji 727→503, Pembayaran 467→240. Perbaikan yang ikut ditemukan: lihat Temuan 14–17.

---

## Tahap S — PRD (dokumen kebutuhan) sebelum fitur baru (disetujui 2026-10-25)

**Tujuan:** semua aturan aplikasi tertulis di satu file PRD.md sebelum kode ditulis, supaya kode tidak tumpang tindih dan tidak asal tambal. Aturan kerja sesudahnya: perubahan → ubah PRD.md dulu → sesuaikan PLAN.md → baru ubah kode.

**Cara:** tanya jawab dari nol, satu bagian per giliran (pertanyaan berpilihan), semua fitur ditulis lengkap.

**Tugas:**
- [x] S.1 [CLAUDE] Tujuan, pengguna, peran, dan pembukuan. (disetujui 2026-10-25)
- [x] S.2 [CLAUDE] Ruang lingkup (dibuat / tidak dibuat) dan daftar istilah. (disetujui 2026-10-25)
- [x] S.3 [CLAUDE] Model data: semua jenis data, isian, dan hubungannya. (disetujui 2026-10-25)
- [x] S.4 [CLAUDE] Aturan akuntansi: jurnal otomatis tiap transaksi. (disetujui 2026-10-25)
- [x] S.5 [CLAUDE] Aturan bersama: pilihan akun, penomoran, kunci tanggal, lampiran, ubah/hapus data yang sudah dipakai. (disetujui 2026-10-25)
- [ ] S.6 [CLAUDE] Fitur per menu: Preferensi, Pengaturan, Master Data, Buku Besar, Kas & Bank, Donasi, transaksi lain. (Disepakati 2026-10-25: logika dan alur setiap fitur dibahas sekarang; rincian layar dilengkapi saat foto Accurate fitur itu dikirim. Sudah: 6.0, 6.1, 6.2; 6.3 menunggu foto Penerimaan dan Transfer.)
- [ ] S.7 [CLAUDE] Laporan (mengikuti foto laporan Accurate).
- [ ] S.8 [CLAUDE] Bandingkan PRD dengan kode yang ada: bagian kode yang berbeda dari PRD dicatat sebagai tugas perbaikan di PLAN.md.

**Selesai kalau:** PRD.md disetujui kamu bagian per bagian, dan tidak ada aturan yang hanya tersimpan di kepala atau di percakapan.

---

## Tahap T — Coba di GitHub Pages (disetujui 2026-10-25)

**Tujuan:** aplikasi bisa dibuka lewat alamat internet (misalnya `https://namakamu.github.io/keuangan-yayasan/`) untuk mencoba dan mengembangkan, dari laptop maupun HP. Belum untuk data asli.

**Yang perlu diingat:**
- GitHub Pages gratis, hanya menjalankan HTML, CSS, dan JavaScript. Tidak ada PHP dan database, dan aplikasi kita memang belum butuh.
- Data tetap tersimpan di browser masing-masing perangkat, jadi data di laptop tidak terlihat di HP. Pindahkan lewat Cadangan Data kalau perlu.
- Repositori gratis bersifat publik: kodenya bisa dilihat orang. Jangan menaruh password atau data asli di kode.

**Tugas:**
- [x] T.1 [CLAUDE] (dites pengguna 2026-10-25: berhasil) (Sudah dibuat 2026-10-25, menunggu tes manual) Halaman utama `menu.html` diganti nama menjadi `index.html` (pintu depan situs); semua yang menunjuk ke menu.html ikut diperbarui; tampilan dicek sama persis.
- [ ] T.2 [CLAUDE] Siapkan untuk GitHub: file `.nojekyll`, pastikan semua alamat file relatif dan huruf besar-kecilnya cocok (server GitHub membedakan huruf besar-kecil).
- [ ] T.3 [KAMU] Buat akun GitHub dan pasang GitHub Desktop (Claude memandu).
- [ ] T.4 [KAMU] Buat repositori dan unggah folder aplikasi (Claude memandu).
- [ ] T.5 [KAMU] Aktifkan GitHub Pages dan buka alamatnya di laptop dan HP (Claude memandu).

**Selesai kalau:** aplikasi terbuka dari alamat GitHub Pages di laptop dan HP, Console tanpa error.

**Ditunda (keputusan pengguna 2026-10-25):** T.2–T.5 dikerjakan setelah aplikasi jadi; sekarang fokus perbaikan dan pengembangan. Arah yang sudah disepakati: pengembangan tetap di komputer (VS Code + Claude Code); setelah tiap tugas berhasil dites, Commit lalu Push lewat GitHub Desktop; GitHub Pages ikut berubah otomatis; riwayat versi bisa dipakai untuk kembali bila ada yang salah. Jangan mengubah file langsung di github.com.

---

## Tahap I — Laporan

**Tujuan:** Laporan yang dihitung dari jurnal, termasuk kebutuhan audit yayasan.

**Tugas:**
- [x] I.1 [CLAUDE] Rancang bersama halaman menu Laporan dan daftar laporan yang dipakai. (Daftar dan urutan diputuskan 2026-11-02; menu Laporan dari foto Accurate disetujui 2026-11-03, PRD 7.) Membuat halaman menu Laporan: kategori kiri, kartu laporan kanan, Cari.
- [ ] I.1f [CLAUDE] Laporan Tersimpan (Memorize): simpan laporan beserta pengaturannya dengan nama sendiri, tombol Impor. Dibuat sesudah laporan pertama jadi.
- [ ] I.6 [CLAUDE] Laporan usulan yang disetujui (PRD 7), masing-masing dari foto Accurate: Daftar Kas dan Bank, Rincian Beban Pembayaran, Penerimaan Donasi per Divisi, Rincian Donasi per Donatur, Buku Besar per akun.
- [ ] I.1g [CLAUDE] Kerangka bersama semua laporan (PRD 7, disetujui 2026-11-03), dibuat sekali dan dipakai ulang:
  - [x] I.1g-1 (dites pengguna 2026-11-03: berhasil) Jendela **Parameter Laporan**: Tanggal Dari–s/d (awal: tanggal 1 bulan ini s/d hari ini), Divisi dan
    Program boleh pilih beberapa (awal Semua Divisi, Program kosong), tiga kotak centang, tombol Tampilkan. Dibuka saat
    kartu laporan diklik.
  - [x] I.1g-2 (dites pengguna 2026-11-03: berhasil) **Kertas laporan gaya profesional**: kepala di tengah (nama yayasan dari Preferensi, judul biru tua,
    periode, "(Dinyatakan dalam Rupiah)"), keterangan filter, garis biru tua + potongan oranye, garis akuntansi baku,
    0 = "-", minus dalam kurung, kaki "Dicetak …" dan "Halaman x dari y". Tampil di tab hasil laporan.
    (Dibuat 2026-11-03: tab hasil bernama laporannya, tombol Ubah Parameter dan Cetak; kaki dan nomor halaman tercetak
    di setiap halaman. Aturan angka 0 = "-" dan garis akuntansi ikut tabel di I.1g-3.)
  - [x] I.1g-3 (dites pengguna 2026-11-03: berhasil) **Pohon akun bertingkat**: induk tebal, anak menjorok, baris "Jumlah <induk>", mengikuti tiga kotak
    centang (Hanya Tampilkan Total, Akun Induk, Akun Anak).
- [ ] I.1b [CLAUDE] Laporan Penghasilan Komprehensif (Laba Rugi) — bentuk sudah disetujui (PRD 7):
  - [ ] I.1b-1 Hitungan dari jurnal per periode: PENERIMAAN, BEBAN, SURPLUS (DEFISIT); kolom Dengan | Tanpa pembatasan
    (dari tanda Terikat tiap baris jurnal) | Jumlah; filter Divisi dan Program.
  - [ ] I.1b-2 Baris Pemindahan sisa program ke Dana Umum dan TOTAL PENGHASILAN KOMPREHENSIF.
  - [ ] I.1b-3 Versi per Divisi: kalau Divisi tertentu dipilih, kolom per Divisi + Total. (Cara baris Pemindahan Dana
    tampil di versi ini menunggu pembahasan.)
- [ ] I.1a [CLAUDE] Laporan Posisi Keuangan (Neraca) — memakai kerangka I.1g, dihitung sampai tanggal s/d; susunan
  barisnya masih perlu dibahas (foto hasil Neraca Accurate).
- [ ] I.1c [CLAUDE] Laporan Perubahan Aset Neto (Perubahan Modal) — dari foto Accurate.
- [ ] I.1d [CLAUDE] Laporan Arus Kas metode langsung — dari foto Accurate.
- [ ] I.1e [CLAUDE] Laporan Donasi per Program — dirancang bersama (tidak ada di Accurate), termasuk cara Pemindahan Dana tampil.
- [ ] I.2 [CLAUDE] Rincian Pengeluaran (diubah 2026-11-06, PRD 7): segala pembelian dan pengeluaran dari rincian Jurnal Umum dan Pembayaran, dengan Keterangan (dari popup Detail Akun / rincian Pembayaran), Sumber, akun, Program, Divisi, penanggung jawab, nilai. Filter periode, Program, Divisi, akun. Klik baris membuka transaksi asal.
- [ ] I.3 [CLAUDE] Filter "jurnal tanpa lampiran".
- [ ] I.4 [CLAUDE] Laporan dua kolom terikat dan tidak terikat, serta monitoring sisa dana per Program.
- [ ] I.5 [CLAUDE] Neraca Saldo (pengguna 2026-11-06: ikut dibuat). Laba Rugi dan Neraca pindah ke I.1a–I.1b.
- [ ] I.7 [CLAUDE] Bersama semua laporan (pengguna 2026-11-06: "buat seluruh laporan sampai jadi nanti aku koreksi"; PRD 7 draf): laporan didaftarkan lewat kolom `gambar` di DAFTAR_LAPORAN, Parameter hanya menampilkan isian yang berlaku (ada pilihan Akun), Unduh CSV, kertas mendatar, tabel rincian.

Catatan 2026-11-06: semua tugas Tahap I di atas dikerjakan sekaligus atas permintaan pengguna, tanpa foto Accurate untuk laporan yang belum ada fotonya; dicentang setelah pengguna selesai mengoreksi.

**Selesai kalau:**
- [ ] Angka laporan cocok dengan hitungan manual contoh.
- [ ] Belum ada data menampilkan pesan kosong yang ramah.
- [ ] Teks sederhana, tampilan HP baik, Console tanpa error.

**Belum diputuskan:** apakah Keterangan di Detail Akun wajib diisi untuk akun beban.

---

## Tahap J — Transaksi dan menu lain (urutan dibicarakan nanti)

Anggaran, Monitor Anggaran, dan Transfer Anggaran mengikuti Accurate (keputusan pengguna 2026-11-06, PRD 6.5).

**Tugas:**
- [x] J.1 [CLAUDE] Anggaran dari foto Accurate (fitur/anggaran/): satu formulir per bulan, Tipe, rincian akun Pendapatan dan Beban, daftar; akun, Divisi, dan Program yang dipakai Anggaran tidak bisa dihapus.
- [x] J.2 [CLAUDE] Monitor Anggaran dari foto Accurate (fitur/monitor-anggaran/): Anggaran, Penggunaan dari jurnal, Sisa per akun.
- [x] J.3 [CLAUDE] Transfer Anggaran dari foto Accurate (fitur/transfer-anggaran/): memindah rencana, tanpa jurnal, tidak boleh melebihi Sisa.
- [x] J.4 [CLAUDE] Laporan Perbandingan Anggaran dari foto Accurate (fitur/laporan-anggaran/): per Divisi, per Program, dan Umum; kolom Aktual, Anggaran, Selisih, % Selisih.
- [x] J.5 [CLAUDE] Log Aktifitas Jurnal dari foto Accurate (fitur/log-jurnal/): daftar semua jurnal, pilihan kolom, klik baris membuka transaksi asal.
- [x] J.6 [CLAUDE] Nomor jurnal JV.tahun.bulan.urut untuk semua jurnal (fitur/jurnal/jurnal.js), termasuk jurnal lama.
- [x] J.7 [CLAUDE] Aset Tetap versi sederhana (PRD 6.6): Kategori Aset, Aset Tetap, cek kecocokan, Proses Penyusutan, Lepas Aset, ikon dan popup sendiri.
- [x] J.8 [CLAUDE] Laporan Aset Tetap (fitur/laporan-aset/): Daftar Aset Tetap, Penyusutan Aset Tetap, Aset yang Dilepas.
- [x] J.11 [CLAUDE] Cetak Bukti (fitur/cetak-bukti/, PRD 6.9; menggantikan H2.12): lima dokumen, desain bawaan yang bisa diedit, elemen Tabel Rincian, Terbilang, tombol Cetak.
- [x] J.12 [CLAUDE] Pembuat PDF tanpa pustaka luar (umum/buat-pdf.js, PRD 6.9): teks, kotak, garis, logo, tabel, ukuran kertas sesuai desain, banyak halaman.
- [x] J.13 [CLAUDE] Halaman Cetak seperti Accurate (fitur/cetak-bukti/): PDF di bingkai, tombol Cetak, Unduh PDF, Tutup; dipakai kelima dokumen; izin frame-src blob:. Diuji di Firefox dan Chrome.
- [x] J.14 [CLAUDE] Tabel PDF bersama (umum/pdf-tabel.js) dan Halaman Cetak dipindah ke umum, supaya dipakai bukti, laporan, dan daftar (PRD 6.9).
- [x] J.15 [CLAUDE] Cetak dan Unduh PDF laporan memakai PDF: kepala, Modifikasi, tinggi fleksibel, nomor halaman; cara lama dibuang (Temuan 41).
- [x] J.16 [CLAUDE] Cetak daftar memakai PDF: semua baris hasil filter, kertas menurut jumlah kolom; cara lama dibuang (Temuan 41).
- [x] J.17 [CLAUDE] Tab Dokumen bagian 1 (umum/komponen-daftar.js, PRD 6.10): bar tab kecil, tombol x dan peringatan, batas 10, data sama pindah tab; isi tab diingat untuk formulir berisian biasa (Divisi, Program, Donatur, Akun, dan sejenisnya).
- [x] J.18 [CLAUDE] Tab Dokumen bagian 2: formulir bertabel rincian (Pembayaran, Penerimaan, Jurnal Umum, Transfer, Pencatatan Donasi) mengingat baris rincian per tab.
- [x] J.23 [CLAUDE] Formulir Data Baru bersih di semua halaman (PRD 5.3a, Temuan 44): pilihan "Silakan Pilih", tanggal dan aturan nomor kosong, isian turunan kosong; pesan wajib saat simpan. Dikerjakan per kelompok halaman, uji ikut disesuaikan.
- [x] J.20 [CLAUDE] Lampiran bersama (umum/lampiran.js, PRD 5.4; menggantikan H2.11): kode lampiran Jurnal Umum dijadikan komponen, Jurnal Umum memakainya, lalu Pembayaran dan Penerimaan.
- [x] J.21 [CLAUDE] Lampiran di Transfer Bank, Pencatatan Gaji, Pencatatan Donasi, Pemindahan Dana; pilihan wajib lampiran di Preferensi ditambah Pembayaran, Gaji, Pemindahan Dana.
- [x] J.22 [CLAUDE] Laporan Bukti Pengeluaran per Divisi dan Program (fitur/laporan-bukti/, PRD 5.4; tidak ada di Accurate, dua gambar contoh disetujui): kelompok Divisi > Program, gambar kecil + popup Lihat Bukti, Belum ada bukti, PDF Cetak bergambar, dan PDF Lampiran audit (ringkasan bernomor halaman + tanda tangan, blok bukti besar).
- [ ] J.25 [CLAUDE] Masuk dan Keluar (PRD 6.12; menggantikan K.1): login.html tersambung, akun pertama, wajib ganti sandi, menu Keluar dan Ganti Kata Sandi, keluar otomatis 40 menit, nama pengguna di Log Aktivitas, uji ikut masuk lewat alat bantu.
- [ ] J.26 [CLAUDE] Hak akses peran (PRD 5.8, 6.12): Pengawas hanya melihat, Pengguna/Preferensi/Cadangan hanya Finance Yayasan, pilihan pembukuan per peran, pengaman akun sendiri dan minimal satu Finance Yayasan aktif.
- [ ] J.24 [CLAUDE] Pintasan keyboard (umum/pintasan.js, PRD 6.11): Ctrl+S, Alt+N, Alt+D, Alt+W, Ctrl+P, Alt+L, Esc, F1 dan popup daftar pintasan; tanpa pintasan Hapus.
- [ ] J.19 [CLAUDE] Tab Dokumen bagian 3: formulir bertabel lainnya (Gaji, Anggaran, Transfer Anggaran, Pemindahan Dana, Aset, Penyusutan, Lepas Aset, Target Donasi, Kategori Donasi/Aset, Desain Cetakan); fitur yang memakai formulir (Cetak, Favorit, Ambil) disesuaikan. Hasil pemeriksaan: yang perlu diperbaiki Pemindahan Dana (Jenis tanpa id, Tujuan), Penomoran (komponen), Ambil favorit (menimpa draf), Tambah ke Favorit (tab belum disimpan); sisanya kolom biasa.
- [x] J.10 [CLAUDE] Transaksi Favorit dari foto Accurate (fitur/favorit/, PRD 6.8): Pembayaran, Penerimaan, Jurnal Umum, Pencatatan Donasi; simpan lewat Lainnya, ambil lewat tombol Ambil. Transaksi Berulang tidak dibuat dulu.
- [x] J.9 [CLAUDE] Dashboard berwarna dari data asli (fitur/dashboard/dashboard.js, PRD 6.7): 10 widget bawaan, 8 widget tambahan, pilihan bulan, tombol + Widget untuk mengatur tampil dan urutan.

Ditunda (keputusan pengguna 2026-11-07, belum diperlukan): Tutup Buku. Gambar rancangannya sudah pernah dibuat; penguncian periode sementara memakai Pembatasan di Preferensi.

Belum dimulai dan belum diurutkan: Penerimaan dan Pembayaran Kas/Bank, Transfer, Pemindahan Dana, Donatur, Histori Akun, Atribut Tambahan (Preferensi), cetak Jurnal Umum (Desain Cetakan), tombol Ambil, geser urutan baris Jurnal.

---

## Tahap K — Login dan perapihan akhir

**Tugas:**
- [x] K.1 [CLAUDE] Dipindah ke J.25 (permintaan pengguna 2026-11-09).
- [ ] K.2 [CLAUDE] Rapikan layar HP (lihat Temuan 3 dan 4).
- [ ] K.3 [CLAUDE] Periksa semua teks, penamaan, tombol dan tautan, keadaan kosong dan error.
- [ ] K.4 [KAMU] Uji semua alur di desktop dan HP; tulis catatan singkat "Cara memakai aplikasi".
- [ ] K.5 [CLAUDE] Susun rencana tahap server (PHP + MySQL) sebagai dokumen terpisah.

**Selesai kalau:**
- [ ] Tidak ada error di Console pada semua halaman.
- [ ] Tidak ada password atau data asli di kode.
- [ ] Semua temuan sudah ditangani atau diputuskan ditunda.

**Sengaja belum dikerjakan:** PHP, MySQL, login sungguhan, multi-pengguna, hosting.

---

## Temuan

Catat hal baru yang muncul selama pengerjaan (bug, ide, detail kurang). Tanyakan dulu sebelum dikerjakan.

| No | Tanggal | Temuan | Tahap | Status |
|----|---------|--------|-------|--------|
| 1 | 2026-10-21 | File lama keuangan.html dan login-cadangan.html belum diperiksa; perlu diputuskan dipakai ulang atau dihapus. | K | Selesai 2026-10-23: diperiksa (prototipe awal dan halaman kosong, tidak terpakai) lalu dihapus atas persetujuan pengguna. login.html dan login.css tetap (dirapikan di K.1). |
| 2 | 2026-10-22 | PLAN.md tidak mengikuti pekerjaan yang sudah berjalan. | Semua | Ditangani: disusun ulang 2026-10-23, menunggu persetujuan |
| 3 | 2026-10-23 | Deretan tab (.tab-baris) tidak bisa digulir dan melebar tiap tab dibuka di layar HP. | K | Menunggu keputusan |
| 4 | 2026-10-23 | Kartu Dashboard melebihi layar 390 px (lebar halaman 412 px). | K | Menunggu keputusan |
| 5 | 2026-10-23 | Akun Non Aktif masih muncul di pilihan Gaji dan Preferensi (keputusan ditunda; perubahan Non Aktif sempat dibatalkan pengguna). | J | Diputuskan di PRD 5.1 (Non Aktif disembunyikan); dikerjakan lewat S.8 |
| 6 | 2026-10-23 | Jurnal bertanggal sebelum tanggal saldo awal akun tetap dihitung ke saldo. | I | Diputuskan di PRD 5.3 (ditolak) dan 4.2 (saldo awal jadi jurnal); dikerjakan lewat S.8 |
| 7 | 2026-10-23 | Akun induk atau Non Aktif pada transaksi lain (induk sudah dikecualikan di pencarian jurnal). | J | Diputuskan di PRD 5.1; dikerjakan lewat S.8 |
| 8 | 2026-10-23 | "No. Bukti Kas/Bank" ditunda sampai menu Kas/Bank dibuat. | J | Dikerjakan di H2.7c (2026-10-25): aturan penomoran ditautkan ke akun Kas/Bank, otomatis terpilih (PRD 6.3) |
| 9 | 2026-10-23 | Jurnal tersimpan masih bisa kehilangan lampiran (hapus lalu simpan); perlu catatan Log yang jelas (tugas G.2). | G | Masuk Tahap G |
| 10 | 2026-10-23 | Unduh lampiran belum diuji di Chrome sungguhan (hanya diuji tombolnya memanggil unduhan). | G | Perlu dicek kamu |
| 11 | 2026-10-23 | Ide: transaksi berulang (misalnya Pencatatan Gaji dibuat otomatis tiap tanggal tertentu). Tanpa server, aplikasi hanya bisa membuatnya saat dibuka di browser. | H/J | Menunggu keputusan |
| 12 | 2026-10-23 | Tampilan Daftar (semua halaman: Divisi, Jurnal, Pencatatan Gaji, dst.) melebar di layar HP 390 px (±555-573 px) karena bilah cari/unduh/cetak di kanan tidak turun ke baris baru. | K | Menunggu keputusan |
| 13 | 2026-10-23 | Konfirmasi hapus memakai kalimat umum komponen bersama; untuk Pencatatan Gaji tidak disebutkan bahwa jurnal otomatisnya ikut terhapus. | H | Diputuskan di PRD 5.7; dikerjakan lewat S.8 |
| 14 | 2026-10-24 | Bug penomoran: nomor yang aturannya tanpa bulan tetap mulai dari 1 lagi tiap bulan (nomor bisa kembar). | R | Diperbaiki di R: hitungan direset sesuai isi aturan (bulan, tahun, atau tidak pernah); keterangan "Reset" di formulir ikut berubah. |
| 15 | 2026-10-24 | Karyawan dan akun yang dipakai Pencatatan Gaji masih bisa dihapus; Simpan Pengguna bisa terkirim dua kali; nomor otomatis kosong bisa tersimpan. | R | Diperbaiki di R. |
| 16 | 2026-10-25 | Data rusak di penyimpanan (misalnya baris jurnal kosong) membuat halaman Akun, Pencatatan Gaji, dan Pembayaran macet. | R | Diperbaiki di R (rincianAman) dan diuji. |
| 17 | 2026-10-25 | Ringkasan Cadangan Data belum menampilkan Pencatatan Gaji dan Pembayaran (datanya sudah ikut tercadang). Editor cetakan masih menulis "menggeser elemen menyusul" padahal sudah bisa. | R | Diperbaiki di R. |
| 18 | 2026-10-25 | Alat pemeriksa otomatis (ESLint, uji jsdom/Chrome, uji data rusak, banding tangkapan layar) masih tersimpan di folder sementara sesi Claude, bukan di proyek. Bisa hilang saat sesi berganti; sebaiknya dipindah ke folder proyek (misalnya alat-cek/) agar pemeriksaan otomatis selalu bisa dijalankan. | R | Terjadi 2026-11-02: 6 uji Chrome, banding, dan ESLint hilang dari folder sementara. Dibereskan 2026-11-02 (pengguna: "bereskan semua"): semua alat pindah ke alat-cek/ (cek.ps1, lint.js, banding.js baru dengan tanggal tetap, uji/); uji yang hilang ditulis ulang (bar, terima, gaji) atau sudah dicakup uji lain (gaji-proses, p6). Menunggu tes pengguna |
| 19 | 2026-10-25 | Saat pindah ke skema A, jurnal pembayaran gaji lama yang dibuat lewat Jurnal Umum (Debit Utang Gaji, Kredit Kas) tetap ada, sedangkan jurnal Beban/Utang lawannya dihapus. Akibatnya saldo Utang Gaji bisa minus. Datanya masih data uji; jurnal seperti itu sebaiknya dihapus atau diubah sendiri di Jurnal Umum. | H3 | Diberitahukan ke pengguna |
| 20 | 2026-10-25 | Pemeriksaan "nomor sudah dipakai" masih ditulis mirip di tiga formulir (Jurnal Umum, Pencatatan Gaji, Pembayaran). Bisa disatukan menjadi satu alat bersama di umum/ sebelum Penerimaan/Transfer/Donasi dibuat. | S.8 | Selesai 2026-10-25: nomorTransaksiTerpakai dan simpanTransaksiDenganJurnal di umum/komponen-transaksi.js, dipakai Jurnal Umum, Pencatatan Gaji, Pembayaran, Penerimaan, Transfer |
| 21 | 2026-10-26 | Pengisian pilihan Kas/Bank (isiPilihan + akunKasBankPilihan, teks "kode - nama") ditulis di 5 tempat: komponen Pembayaran/Penerimaan, Transfer Bank, Histori Bank, Rekonsiliasi Bank (dua terakhir sama persis), Penomoran. Bisa disatukan menjadi satu alat bersama di umum/komponen-transaksi.js. | S.8 | Dirapikan 2026-10-26 (disetujui): isiPilihanKasBank di umum/komponen-transaksi.js dipakai kelima tempat; tampilan sama persis. Selesai (dites pengguna 2026-10-26: berhasil) |
| 24 | 2026-10-26 | PRD 4.1 (draf): centang "Terikat" di tab Info lainnya popup baris Pembayaran (komponen bersama transaksi Kas/Bank) dan popup Detail Akun Jurnal Umum; disimpan di rincian dan ikut ke baris jurnal; baris baru mengikuti baris terakhir. Penerimaan TIDAK memakai centang ini (Keputusan PRD 9): komponen bersama perlu pengaturan untuk menyembunyikannya. | H2/Donasi | Selesai 2026-10-26 (D0.3; dites pengguna: berhasil) |
| 23 | 2026-10-26 | Keputusan PRD 8a/8c: isian "Sifat dana" (terikat/tidak terikat) di Master Data > Program harus dihapus dari kode, dan data Program lama yang sudah punya sifat dibiarkan/diabaikan. Pengaman dana Program (5.6) belum pernah dibuat di kode, jadi tidak ada yang dihapus. Keputusan PRD 6 dan 7: saklar "Kategori Keuangan" dan "Donatur" di Preferensi > Fitur dihapus dari kode (kunci fiturBawaan kategori/donatur ikut dibuang). | Donasi | Selesai 2026-10-26 (D0.1, D0.2; dites pengguna: berhasil) |
| 26 | 2026-10-28 | Kalau Preferensi > Format desimal dinyalakan (misalnya 2 angka, mode "selalu"), nilai yang SUDAH tersimpan ditampilkan ulang di kolom nominal sebagai "150.000,00" (teksAngkaIsian memakai format desimal), lalu dibaca angkaDariTeks sebagai 15.000.000 (100 kali lipat) saat Lanjut/Simpan. Terjadi di popup rincian Jurnal Umum, Pembayaran/Penerimaan, Pencatatan Donasi, Pencatatan Gaji, dan Transfer saat membuka data lama. Ketikan baru sudah aman (titik ribuan langsung, selalu angka bulat). Usul: teksAngkaIsian juga selalu angka bulat (satu baris di umum/komponen-transaksi.js). | 5.1 | Disetujui dan diperbaiki 2026-10-28: teksAngkaIsian selalu angka bulat, disatukan dengan alat titik ribuan (teksRibuanIsian dihapus); diuji (baris lama dibuka saat desimal 2 nyala tetap 150.000). Selesai (pengguna: "oke lanjut") |
| 27 | 2026-10-30 | Dari tes pengguna di Histori Bank: saldo Kas/Bank bisa **minus** — Diputuskan 2026-10-30: dibuat sekarang (D1.8), bawaan Ditolak. (Jurnal Umum 28 Okt mengeluarkan 500.000 dari kas berisi 100.000; Pemindahan Dana 30 Okt mengambil 1.000.000 dari kas berisi 600.000, karena yang diperiksa sisa dana Program, bukan isi kas). PRD 5.6 sudah mengatur pengaman **Kas/Bank minus** (diatur di Preferensi: peringatan saja atau ditolak), tetapi belum pernah masuk PLAN dan belum dibuat di kode mana pun (Jurnal Umum, Pembayaran, Transfer, Gaji, Pemindahan Dana). | 5.6 | Selesai lewat D1.8 (dites pengguna 2026-11-02: berhasil) |
| 28 | 2026-11-02 | Audit D1 (temuan pasti, tingkat rendah): batas sisa dana **Pemindahan Dana** hanya dihitung sampai tanggal pemindahan itu. Pemindahan kedua yang diberi tanggal **lebih awal** dari pemindahan lain dari dana yang sama tetap diterima, sehingga uang yang sama terpindah dua kali dan sisa Program (atau Dana Umum) jadi minus. Tombol "Semua sisa" ikut menyarankan angka terlalu besar. Usul: sisa tersedia = saldo terendah dari tanggal pemindahan ke depan (cara yang sama dengan pengaman kas minus), lalu PRD 6.1 diperjelas. | D1 | Ditanyakan ke pengguna |
| 29 | 2026-11-02 | Audit D1 (celah aturan): PRD 5.3 menolak transaksi bertanggal **sebelum tanggal mulai pembukuan**, tetapi pemeriksaan tanggal bersama (galatTanggalTransaksi) belum menolaknya. | D1 | Disetujui 2026-11-02 ("perbaiki dulu"); dibuat lewat D1.11, menunggu tes pengguna |
| 30 | 2026-11-02 | Audit D1 (penguatan, bukan celah): huruf Google Fonts masih dimuat dari internet (README bilang tidak perlu internet), dan belum ada Content-Security-Policy. Penguatan kecil lain dicatat di laporan audit (run-1/REPORT.md). | K | Disetujui 2026-11-02 ("kerjakan sekarang"); dibuat lewat D1.12 (huruf di umum/huruf/, CSP di index.html; login.html ikut Tahap K), menunggu tes pengguna |
| 31 | 2026-11-03 | Dari I.1g-1: di popup Parameter Laporan, menekan **Esc saat daftar pilihan terbuka menutup seluruh popup** (bukan hanya daftarnya). Untuk kolom Divisi/Program baru sudah diperbaiki di buatPemilihBanyak. Popup lama yang memakai kolom cari/kotak pilihan berlabel (Detail Akun Jurnal Umum, rincian Pembayaran/Penerimaan/Donasi/Gaji, tujuan Pemindahan Dana) kemungkinan punya masalah yang sama (belum dicek). Usul: perbaikan yang sama dipindah ke buatKolomCari supaya berlaku di semua kolom cari. | 5.1 | Menunggu keputusan |
| 32 | 2026-11-03 | Pemeriksaan kode ganda I.1g-1: (a) aturan "tanggal Dari tidak boleh sesudah s/d" sekarang ditulis di 3 tempat (komponen-histori.js, rekonsiliasi-bank.js, laporan/parameter.js); (b) pemilih akun Preferensi (banyak label akun) mirip alat baru buatPemilihBanyak. Usul: satukan (a) jadi satu alat bersama, dan (b) Preferensi memakai buatPemilihBanyak, setelah Tahap I. | S.8 | Menunggu keputusan |
| 33 | 2026-11-03 | Dari I.1b-1: akun induk bawaan bernama "Beban" (5101) membuat baris "Jumlah Beban" muncul DUA kali di Laporan Penghasilan Komprehensif: jumlah akun induk itu dan total bagian BEBAN (PRD 7: "Jumlah Beban"). Membingungkan pembaca/auditor. Usul: total bagian ditulis "JUMLAH PENERIMAAN" / "JUMLAH BEBAN" (huruf besar, sejajar judul bagian) atau "Total Penerimaan" / "Total Beban"; perlu ubah PRD dulu. | I | Diputuskan 2026-11-03 (pengguna: hasil pertama "membingungkan dan kurang efektif"; dari 3 gambar dipilih "Pilihan 1 ringkas bertingkat"): PRD 7 diubah, total bagian JUMLAH PENERIMAAN / JUMLAH BEBAN, akun teratas Pendapatan/Beban tidak ditulis, "Jumlah <induk>" hanya untuk isi 2 baris atau lebih. Dibuat di I.1b-1, menunggu tes pengguna |
| 34 | 2026-11-06 | Dari Laporan Posisi Keuangan: PRD 4.2 menulis saldo awal sebagai jurnal "Saldo Awal" lawan Ekuitas Saldo Awal, tetapi di kode saldo awal hanya tersimpan di data akun, tanpa jurnal. Laporan menghitung Ekuitas Saldo Awal sendiri supaya tetap seimbang dan menyebutnya di catatan. Akibatnya saldo awal selalu dihitung walaupun tanggal laporan sebelum tanggal saldonya (sama dengan Histori Akun). Perlu diputuskan: dibiarkan, atau dijadikan jurnal sesuai PRD. | I | Menunggu keputusan |
| 35 | 2026-11-06 | Laporan Jurnal tanpa Lampiran: lampiran baru bisa ditempel di Jurnal Umum; jurnal otomatis (Donasi, Pembayaran, dst.) selalu tampil karena tempat lampirannya belum ada (H2.11). Tambahan 2026-11-09: sejak J.20/J.21 semua transaksi punya lampiran, tetapi laporan ini masih hanya membaca lampiran di jurnalnya sendiri, jadi Pembayaran/Transfer/Donasi yang sudah berlampiran tetap tampil. Usul: laporan membaca lampiran transaksi asal. | I | Disetujui pengguna 2026-11-09, dikerjakan: laporan membaca lampiran transaksi asal (pembacaAsalJurnal, fitur/jurnal/jurnal.js) |
| 36 | 2026-11-06 | Uji Chrome lama memakai waktu tunggu tetap, padahal halaman kini butuh 2,4 sampai 3,4 detik saat komputer sibuk (memori bebas sekitar 700 MB). alat-cek/tunggu-lebih-lama.js memperpanjang tunggunya, tetapi uji masih bisa gagal sesekali kalau komputer sedang berat, lalu lolos saat diulang sendirian. Usul: ganti tunggu tetap dengan menunggu halaman siap di semua uji, dan cek apakah jumlah skrip (sekitar 70 berkas) perlu dirampingkan. | K | Menunggu keputusan |
| 37 | 2026-11-06 | Notifikasi biru kanan atas bisa menutupi tombol Simpan beberapa detik, terutama kalau muncul dua sekaligus (terlihat di formulir Anggaran saat uji). Berlaku di semua formulir, bukan hanya Anggaran. Usul: pindahkan notifikasi atau beri jarak dari tombol Simpan. | K | Menunggu keputusan |
| 38 | 2026-11-06 | Kotak besar Dashboard menampilkan angka contoh yang tetap (Rp 12.500.000, Kas dan bank Rp 45.200.000, dan seterusnya), walaupun data kosong. Bisa disangka angka sungguhan. Usul: diisi dari data asli saat mengerjakan isi Dashboard. | K | Selesai lewat J.9, dites pengguna 2026-11-08 |
| 39 | 2026-11-07 | Pengguna memakai Firefox dan Chrome, sedangkan uji otomatis hanya berjalan di Chrome. Cetak bukti sudah diuji manual di keduanya lewat J.13. Usul: tambah uji Firefox ke alat-cek. | K | Menunggu keputusan |
| 40 | 2026-11-07 | Data dan desain tersimpan terpisah di tiap browser (localStorage), jadi transaksi di Firefox tidak terlihat di Chrome, dan sebaliknya. Tampilan bisa disamakan, tetapi data tidak, kecuali dipindah lewat Cadangan Data atau aplikasi punya server. | K | Menunggu keputusan |
| 48 | 2026-11-09 | Ditemukan saat J.26: pilihan pembukuan di bilah atas (Yayasan, Sekolah, Unit usaha) hanya label; data belum dipisah per pembukuan (PRD 3.2 butir 2). Akibatnya Finance Sekolah tetap melihat data yang sama. Usul: pemisahan data per pembukuan dibuat sebagai tugas sendiri sebelum dipakai sungguhan. | K | Menunggu keputusan |
| 47 | 2026-11-09 | Permintaan pengguna: pintasan keyboard (contoh Ctrl+S untuk Simpan). Tidak ada foto Accurate; daftar dirancang bersama dan disetujui tanpa Alt+Delete (PRD 6.11). | J | Dikerjakan lewat J.24 |
| 46 | 2026-11-09 | Permintaan pengguna: unggahan dicek isinya, bukan hanya namanya. Lampiran (semua transaksi) sudah (J.20, umum/lampiran.js). Logo di Preferensi, Data masih hanya dicek dari jenis yang ditebak browser dari nama file. Usul: logo memakai pemeriksaan isi yang sama (tanda awal file + harus bisa dibuka sebagai gambar); logo SVG sebaiknya tidak diterima lagi karena isinya teks yang tidak bisa dicek seperti foto. | J | Disetujui pengguna 2026-11-09, dikerjakan bersama J.20 (logo PNG/JPG/WEBP dicek isinya; SVG baru ditolak) |
| 45 | 2026-11-09 | Ditemukan saat J.23: di layar HP (lebar 390), formulir Akun Perkiraan dua kolom sehingga kolom isian sangat sempit (Tipe Akun, Kode, Nama hanya beberapa huruf). Sudah begitu sebelum J.23. Usul: dikerjakan bersama K.2 (rapikan layar HP). | K | Masuk K.2 |
| 44 | 2026-11-08 | Permintaan pengguna (foto Gaji/Tunjangan): formulir yang baru dibuka harus bersih, tidak ada kolom yang otomatis terisi. Sekarang banyak pilihan langsung terpilih isian pertama (misalnya Tipe Gaji Pokok, Tipe Akun Kas & Bank, Cara Bayar Tunai), sebagian sengaja mengikuti Accurate (tanggal hari ini, nomor otomatis). Keputusan pengguna: semua kosong, simpan ditolak dengan pesan (PRD 5.3a). | K | Dikerjakan lewat J.23 |
| 43 | 2026-11-08 | Dari foto Accurate (permintaan pengguna): setiap data yang dibuka dari daftar mendapat tab kecil sendiri di samping Data Baru, bukan mengganti tab yang ada; 5 data dibuka = 5 tab. Tiap tab kecil punya tombol x; kalau isinya sudah diubah, muncul peringatan "Perubahan yang Anda lakukan akan dibatalkan, lanjutkan?". Berlaku untuk semua formulir. | K | Menunggu keputusan |
| 42 | 2026-11-08 | Temuan pengguna: akun donasi (tipe Pendapatan) masih bisa dibuat langsung di Akun Perkiraan, padahal seharusnya hanya lewat Kategori Donasi (PRD 6.1). Akibatnya bisa ada dua akun untuk donasi yang sama, lalu pencatatannya terpecah atau dobel. Keputusan pengguna: cukup peringatan saat membuat akun Pendapatan baru. | K | Selesai, dites pengguna 2026-11-08 |
| 41 | 2026-11-07 | Cetak di laporan dan daftar masih memakai jendela cetak browser, jadi tulisan browser bisa ikut tercetak dan hasil antar browser bisa berbeda. Pembuat PDF baru (umum/buat-pdf.js) bisa dipakai juga. | K | Selesai lewat J.14-J.16, dites pengguna 2026-11-08 |
| 25 | 2026-10-28 | PRD 6.1 hanya mengatur Hamba Allah "tidak bisa dihapus". Sekarang namanya masih bisa diganti (misalnya jadi nama orang) dan bisa ditandai Non Aktif, sehingga fungsinya sebagai donatur tanpa nama bisa hilang. Perlu diputuskan: nama dan Non Aktif Hamba Allah dikunci, atau dibiarkan. | D1.4 | Diputuskan 2026-10-28: dikunci (PRD 6.1). Dibuat, menunggu tes manual |
| 22 | 2026-10-26 | Foto Histori Bank Accurate menampilkan baris **Total** di bawah tabel (jumlah mutasi bersih rentang itu, dengan Dr/Cr). Histori Bank kita belum punya baris ini. | H2.9 | Disetujui 2026-10-26, dibuat: baris Total (mutasi bersih Dr/Cr) di tabel dan CSV. Selesai (dites pengguna 2026-10-26: berhasil) |

## Keputusan

Pilihan yang sudah kita sepakati.

| No | Tanggal | Keputusan | Alasan |
|----|---------|-----------|--------|
| 1 | 2026-10-21 | Hanya HTML, CSS, JavaScript biasa; data di localStorage; login hanya prototipe. | Fokus belajar dasar dulu; server dikerjakan di tahap terpisah. |
| 2 | 2026-10-21 | Seluruh teks aplikasi memakai bahasa Indonesia sederhana. | Mudah dipahami pengguna. |
| 3 | 2026-10-22 | Aplikasi untuk yayasan, meniru alur Accurate tetapi memakai istilah yayasan; tanpa logo, nama, atau data Accurate. | Sesuai kebutuhan pengguna. |
| 4 | 2026-10-23 | Kode akun otomatis dan terkunci; induk dibuat sendiri; maksimal 3 tingkat; bagan akun awal 44 akun dengan Donasi satu akun. | Seperti Accurate dan akun tidak terlalu banyak. |
| 5 | 2026-10-23 | Terikat atau tidak terikat ditentukan lewat Program, bukan lewat akun. | Akun tidak membengkak; laporan dua kolom nanti dari Program. |
| 6 | 2026-10-23 | Divisi fleksibel (tidak harus ikut Program). Baris jurnal berikutnya mengikuti Divisi dan Program baris terakhir, tetap bisa diubah. | Memudahkan pengisian. |
| 7 | 2026-10-23 | Lampiran jurnal: maks 5 file, 700 KB per file, foto dikecilkan, isi disimpan terpisah dari data jurnal. | Penyimpanan browser hanya sekitar 5 MB. |
| 8 | 2026-10-23 | Pencatatan Gaji: komponen terpilih (lihat Tahap H); tanpa jurnal otomatis saat disimpan dan tanpa akun utang gaji; Proses membuka Jurnal Umum terisi (Beban Gaji dan Kas/Bank) sebesar gaji dibayarkan. | Pembayaran Kas/Bank belum ada; lebih sederhana. |
| 10 | 2026-10-23 | Dana terikat/tidak terikat untuk gaji diatur di Jurnal Umum lewat Detail Akun (Program/Divisi), baris beban dipecah sendiri bila perlu. | Konsisten dengan keputusan terikat lewat Program; tanpa tabel pembagian di form gaji. |
| 11 | 2026-10-23 | Kode dibagi per fitur: menu.html hanya HTML; JavaScript di js/ (12 file, skrip biasa, urutan muat penting); CSS di css/ (8 file bernomor sesuai urutan muat). Folder js/ dan css/ harus selalu ikut bila aplikasi disalin. | menu.html terlalu panjang (±9.950 baris); lebih mudah dicari, dipelajari, dan dipindah ke server nanti. |
| 12 | 2026-10-23 | Nama file dan folder aplikasi: huruf kecil semua, tanpa spasi (pakai tanda -). Alamat file selalu relatif (tanpa C:\ dan tanpa / di depan). | Hosting (Linux) membedakan huruf besar-kecil dan rawan bermasalah dengan spasi. |
| 13 | 2026-10-23 | Susunan folder per fitur (Tahap Q): umum/ untuk yang dipakai bersama, fitur/<nama>/ berisi tampilan.js, <nama>.js, <nama>.css. | Rapi, mudah diperbaiki, mudah dipindah ke PHP. |
| 9 | 2026-10-23 | Laporan Rincian Pengeluaran memakai Keterangan di Detail Akun; dikerjakan di menu Laporan (Tahap I). | Kebutuhan audit. |
| 15 | 2026-10-25 | Setiap fitur di folder sendiri, termasuk fitur dalam satu menu: Pembayaran dipindah ke fitur/pembayaran/ (tampilan.js, pembayaran.js, pembayaran.css); fitur/kas-bank/ hanya popup menu Kas & Bank. Penerimaan dan Transfer nanti di fitur/penerimaan/ dan fitur/transfer/. Perbaikan selalu MENGUBAH kode lama, tidak menumpuk. | Permintaan pengguna: rapi, satu fitur satu tempat, mudah diperbaiki. |
| 14 | 2026-10-25 | Pemeriksaan keamanan otomatis: ringan setiap tugas fitur (tinjau file yang berubah dengan skill security-audit + ESLint + semua uji); audit penuh di akhir tiap tahap (ditanyakan dulu). Aturannya di CLAUDE.md. | Celah ketahuan sedini mungkin tanpa memakan waktu dan kuota besar tiap fitur. |
