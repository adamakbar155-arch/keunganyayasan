# PRD — Aplikasi Keuangan Yayasan

PRD (dokumen kebutuhan) berisi **apa** yang dibangun dan **aturannya**. Urutan pengerjaan ada di [PLAN.md](PLAN.md).

**Aturan memakai dokumen ini:**
1. Ada perubahan atau fitur baru → ubah PRD.md dulu dan disetujui pengguna.
2. Sesuaikan tugas di PLAN.md.
3. Baru ubah kode. Kode tidak boleh berisi aturan yang tidak tertulis di sini.
4. Setiap perubahan dicatat di bagian 10 (Riwayat perubahan).

Status tiap bagian: **Disetujui**, **Draf** (menunggu persetujuan), atau **Belum dibahas**.

**Alur kerja setiap fitur** (disepakati 2026-10-25): sistemnya disamakan dengan Accurate.
1. Pengguna mengirim **foto layar Accurate**.
2. Logika dan alur dibahas, lalu ditulis di bagian 6 dokumen ini.
3. Tugas ditulis di PLAN.md.
4. Kode disusun rapi tanpa tumpang tindih.
5. **Audit keamanan** dan pemeriksaan kode ganda.

Bagian 1–5 (aturan umum) berlaku untuk semua fitur. Rincian layar tiap fitur di bagian 6 dilengkapi saat fotonya dikirim.

---

## 1. Tujuan, pengguna, dan pembukuan — Disetujui 2026-10-25

### 1.1 Tujuan
Aplikasi keuangan untuk yayasan, menggantikan Accurate yang sudah dipakai 2 tahun. Empat tujuan utama:
1. **Laporan untuk donatur**: menunjukkan dana tiap program dipakai untuk apa.
2. **Siap diaudit**: setiap pengeluaran punya bukti (lampiran) dan penanggung jawab.
3. **Mengganti Accurate**: semua kebutuhan harian yang selama ini dikerjakan di Accurate bisa dikerjakan di sini.
4. **Kontrol dana terikat**: dana program terikat tidak terpakai untuk keperluan lain.

Alur dan tampilan meniru Accurate supaya mudah dipakai, tetapi memakai istilah yayasan dan tanpa logo, nama, atau data Accurate.

### 1.2 Pembukuan
Ada **tiga pembukuan terpisah**: Yayasan, Sekolah, Unit usaha.
- Masing-masing punya akun, transaksi, dan laporan sendiri. **Tidak ada laporan gabungan.**
- **Yayasan**: lengkap (donasi per program/divisi, gaji, pembayaran, penerimaan, transfer kas/bank, jurnal, laporan).
- **Sekolah** dan **Unit usaha**: lebih sederhana, yaitu pemasukan, pengeluaran, dan laporan. Nanti ditambah fitur khas:
  Sekolah (tagihan SPP dan pelunasannya), Unit usaha (jual beli). Rinciannya dibahas di bagian 6.
- Tahun buku **Januari–Desember**, mata uang **Rupiah** saja, untuk ketiga pembukuan.

### 1.3 Pengguna dan peran
Pemakai sehari-hari adalah tim finance. Ada empat peran tetap:

| Peran | Pembukuan yang bisa dibuka | Boleh |
|-------|----------------------------|-------|
| Finance Yayasan | Ketiganya | Semua: mencatat, mengubah, menghapus, mengatur Preferensi dan Pengaturan, mengelola pengguna, mereset kata sandi |
| Finance Sekolah | Sekolah | Mencatat, mengubah, dan menghapus di pembukuan Sekolah; tidak mengelola pengguna |
| Finance Unit usaha | Unit usaha | Mencatat, mengubah, dan menghapus di pembukuan Unit usaha; tidak mengelola pengguna |
| Pengawas | Ketiganya | **Hanya melihat** data dan laporan; tidak ada fitur catatan |

- Disarankan minimal **2 akun Finance Yayasan**, supaya kalau satu orang lupa kata sandi masih ada yang bisa mereset.
- Login sungguhan dan pemisahan data per pengguna baru berlaku penuh di tahap server.

---

## 2. Ruang lingkup dan daftar istilah — Disetujui 2026-10-25

### 2.1 Yang dibuat (pembukuan Yayasan)
Status: **Ada** = sudah ada di aplikasi, **Sebagian** = tampilan ada tapi belum lengkap, **Belum** = belum dibuat.

| Menu | Fitur | Status |
|------|-------|--------|
| Pengaturan | Preferensi (Data, Fitur, Pembatasan, Lampiran, Akun Perkiraan, Format) | Ada |
| | Preferensi: Atribut Tambahan (isian tambahan buatan sendiri) | Belum |
| | Pengguna (4 peran), Penomoran, Desain Cetakan, Cadangan Data, Log Aktivitas | Ada |
| Master Data | Divisi, Program, Karyawan | Ada |
| Buku Besar | Akun Perkiraan | Ada |
| | Jurnal Umum (dengan lampiran) | Ada |
| | Pencatatan Gaji | Ada (cetak slip belum) |
| | Anggaran, Monitor Anggaran, Transfer Anggaran (lihat 6.5) | Ada (menunggu tes manual) |
| | Histori Akun (Kas & Bank tingkat 3, lihat 6.4) | Ada (menunggu tes manual) |
| | Log Aktifitas Jurnal (lihat 6.4) | Ada (menunggu tes manual) |
| | Aset tetap dan penyusutan (lihat 6.6) | Ada (menunggu tes manual) |
| | Tutup buku akhir tahun | Ditunda (keputusan pengguna 2026-11-07: belum diperlukan) |
| | Transaksi berulang | Belum |
| Kas & Bank | Pembayaran | Sebagian (simpan belum) |
| | Penerimaan Kas/Bank, Transfer Kas/Bank | Belum |
| | Rekonsiliasi bank | Belum |
| | Histori Bank (transaksi satu akun Kas/Bank dengan saldo berjalan; memakai cara hitung yang sama dengan Histori Akun) | Belum |
| Donasi | Donasi (dengan Program/Divisi) | Belum |
| | Pemindahan Dana (sisa Program ke Dana Umum) | Belum |
| | Target Donasi per Program (lihat 6.1; draf 2026-10-29). Penyaluran Bantuan dan Pengembalian Donasi tidak dibuat (keputusan 2026-10-29) | Belum |
| | Donatur (pindah dari Master Data), Kategori Donasi (lihat 6.1) | Belum |
| Cetak | Kuitansi donasi, slip gaji, bukti kas/bank (Pembayaran, Penerimaan, Transfer, Jurnal Umum), laporan | Belum (editor Desain Cetakan sudah ada) |
| Laporan | Lihat bagian 7 | Belum |
| Dashboard | Ringkasan angka dan widget yang bisa diatur (lihat 6.7) | Ada (menunggu tes manual) |

**Pindah dari Accurate:** cukup **saldo awal**. Akun dan saldo awal diisi per tanggal mulai; transaksi lama tetap dilihat di Accurate. Tidak ada fitur impor.

### 2.2 Yang tidak dibuat
- Pajak dan e-Faktur (PPh, PPN, pajak gaji).
- Penjualan, pembelian, dan persediaan untuk pembukuan Yayasan (fitur jual beli Unit usaha dibahas di bagian 6).
- Persetujuan transaksi oleh atasan.
- Multi mata uang (hanya Rupiah).
- Master Penerima/Pemasok: nama penerima di Pembayaran diketik bebas.
- Master Gaji/Tunjangan lama: **dihapus**, sudah digantikan Pencatatan Gaji.
- Laporan gabungan tiga pembukuan.
- Kotak Accurate **Rekening Koran** dan **SmartLink** (e-Banking, Virtual Account, e-Payment): tidak dibuat (tersambung langsung ke bank, butuh server dan kerja sama bank).

### 2.3 Daftar istilah

| Istilah | Arti di aplikasi ini |
|---------|----------------------|
| Pembukuan | Satu set catatan keuangan yang berdiri sendiri: Yayasan, Sekolah, atau Unit usaha. |
| Akun Perkiraan (akun) | Pos pencatatan, misalnya Kas Kecil, Bank BSI, Beban Gaji. Bisa bertingkat: akun induk punya sub akun (maksimal 3 tingkat). |
| Akun induk | Akun yang punya sub akun. Saldonya = jumlah sub akunnya, dan tidak bisa dipilih di transaksi. |
| Kas/Bank | Akun bertipe Kas & Bank: tempat uang benar-benar disimpan. |
| Divisi | Bagian atau bidang kerja di yayasan (padanan Departemen di Accurate). |
| Program | **Bidang di bawah Divisi** (draf 2026-10-26), selalu milik tepat satu Divisi, berstatus Aktif atau Selesai (padanan Proyek di Accurate). Gunanya memisahkan keuangan supaya tidak tercampur: laporan Divisi menampilkan keuangan Divisi itu beserta Program-programnya. Program **bukan** penanda dana terikat. Hanya Program Aktif yang bisa dipilih di transaksi baru. Di transaksi, Divisi diusulkan dari Program tetapi boleh diubah. |
| Dana terikat | Dana yang hanya boleh dipakai sesuai permintaan donatur. Tidak ada batas waktu dan tidak ada dana abadi. **Ditandai lewat akun donasi** (draf 2026-10-26): akun yang dimasukkan ke kolom Donasi Terikat di Preferensi > Akun Perkiraan. |
| Pemindahan Dana | Memindah kepemilikan dana sekaligus uangnya: sisa Program ke Dana Umum, dan Dana Umum ke Divisi (rancangan 2026-10-30, lihat 6.1). Boleh untuk semua program (izin diumumkan saat program dirilis), wajib alasan (lampiran menyusul), dan tidak boleh melebihi sisa dana program asal. |
| Dana tidak terikat | Dana yang bebas dipakai yayasan. **Ditandai lewat akun donasi** (draf 2026-10-26): akun yang dimasukkan ke kolom Donasi Tidak Terikat di Preferensi. (Aturan lama "baris tanpa Program = tidak terikat" tidak dipakai lagi; lihat Keputusan terbuka 8.) |
| Donatur | Orang atau lembaga yang memberi donasi. |
| Penanggung Jawab | Nama orang yang bertanggung jawab atas satu baris pengeluaran (untuk audit). |
| Penerima | Pihak yang menerima uang di Pembayaran (diketik bebas). |
| Transaksi | Satu kejadian keuangan yang dicatat lewat formulir: Donasi, Pembayaran, Pencatatan Gaji, Jurnal Umum, dan lain-lain. |
| Jurnal | Catatan debit-kredit hasil transaksi. Setiap transaksi menghasilkan jurnal (dibuat otomatis, kecuali Jurnal Umum yang diketik sendiri). |
| Rincian | Baris-baris di dalam satu transaksi. |
| Lampiran | File bukti (foto nota, PDF) yang ditempel pada transaksi. |
| Saldo awal | Saldo akun pada tanggal mulai memakai aplikasi. |
| Tanggal kunci | Tanggal yang dan sebelumnya tidak bisa diubah lagi (Preferensi, Pembatasan). |
| Kas/Bank Divisi | Setiap Divisi punya akun Kas/Bank sendiri. Pemiliknya cukup terlihat dari nama akun (misalnya "Kas Pendidikan"); tidak ada isian Divisi di akun. |

## 3. Model data — Disetujui 2026-10-25

### 3.1 Prinsip dasar
1. **Satu buku jurnal untuk semua.** Setiap transaksi (Donasi, Pembayaran, Penerimaan, Transfer, Pemindahan Dana, penyusutan, dan seterusnya) punya formulir sendiri. Pencatatan Gaji adalah catatan rinci tanpa jurnal; jurnal gajinya dibuat oleh Pembayaran (lihat 3.3). Saat disimpan, transaksi itu **membuat jurnalnya sendiri secara otomatis** di buku jurnal yang sama dengan Jurnal Umum.
   - Jurnal otomatis diberi tanda asal: `sumber = { jenis, id }`, misalnya `{ jenis: "gaji", id: "pg…" }`.
   - Jurnal otomatis hanya bisa diubah atau dihapus lewat formulir asalnya, bukan dari Jurnal Umum.
   - **Daftar tidak bercampur (seperti Accurate):** daftar Jurnal Umum hanya menampilkan jurnal yang diketik di Jurnal Umum. Pembayaran, Penerimaan, dan transaksi lain tampil di daftarnya masing-masing. Jurnal otomatis tetap dihitung di saldo akun, sisa dana, dan laporan.
   - **Saldo akun, saldo Program, dan semua laporan hanya membaca buku jurnal.** Laporan tidak perlu tahu jenis transaksi, jadi transaksi baru tidak perlu mengubah kode laporan.
2. **Pembukuan terpisah penuh.** Akun, transaksi, jurnal, master data (Divisi, Program, Karyawan, Donatur), penomoran, preferensi, desain cetakan, dan log disimpan terpisah untuk Yayasan, Sekolah, dan Unit usaha. **Hanya data Pengguna yang dipakai bersama.**
3. **Hapus = hapus betul, tercatat di Log.** Transaksi dan jurnalnya ikut terhapus. Log Aktivitas menyimpan siapa, kapan, dan isi data yang dihapus. Data bertanggal terkunci tidak bisa dihapus.
4. **Ubah = jurnal dibuat ulang.** Jurnal lama diganti jurnal baru sesuai isi terbaru, dengan nomor tetap. Log mencatat isi sebelum dan sesudah. Tanggal terkunci tidak bisa diubah.
5. **Data yang sudah dipakai tidak bisa dihapus.** Misalnya akun yang ada di jurnal, Program atau Divisi yang dipakai transaksi, Karyawan yang ada di Pencatatan Gaji, atau Donatur yang punya donasi. Yang bisa dilakukan: dinonaktifkan atau diubah statusnya.
6. **Setiap data punya** `id` (unik, dibuat otomatis), `dibuatOleh`, `dibuatPada`, dan `diubahPada`. Hubungan antardata selalu lewat `id`, bukan lewat nama atau kode, supaya mengganti nama tidak memutus hubungan.
7. **Nama yang tampil disimpan ulang seperlunya.** Baris jurnal menyimpan `kode` dan `nama` akun saat itu (untuk riwayat), tetapi perhitungan selalu memakai `akunId`.

### 3.2 Daftar data
Isian lengkap transaksi yang belum dibuat ditetapkan saat membahas fiturnya di bagian 6.

**Data bersama (semua pembukuan)**

| Data | Isi utama | Status |
|------|-----------|--------|
| Pengguna | nama lengkap, nama pengguna (unik), email/HP, kata sandi teracak, peran, pembukuan yang boleh dibuka, non aktif | Ada |

**Data per pembukuan: pengaturan**

| Data | Isi utama | Status |
|------|-----------|--------|
| Data yayasan | nama, alamat, telepon, email, ketua, bendahara, logo, tanggal mulai pembukuan | Ada |
| Preferensi | fitur (saklar), pembatasan (tanggal kunci, larangan tanggal masa depan), lampiran wajib per transaksi, akun perkiraan bawaan, format angka/tanggal | Ada |
| Aturan penomoran | nama, tipe transaksi, komponen (tahun, bulan, counter, teks), panjang counter | Ada |
| Desain cetakan | nama, tipe dokumen, kertas, orientasi, margin, elemen | Ada |
| Log Aktivitas | waktu, pengguna, tindakan, tipe data, referensi, rincian perubahan | Ada |

**Data per pembukuan: master**

| Data | Isi utama | Hubungan | Status |
|------|-----------|----------|--------|
| Akun Perkiraan | kode (otomatis), nama, tipe, induk, saldo awal + tanggal, info bank, catatan, non aktif | induk → Akun | Ada |
| Divisi | nama, keterangan | — | Ada |
| Program | nama, sifat (terikat/tidak terikat), status (Aktif/Selesai), keterangan | → Divisi (tepat satu) | Ada |
| Karyawan | nomor pegawai, nama, KTP, jabatan, tanggal masuk, kontak, alamat, data bank, catatan | — | Ada |
| Donatur | ID Donatur (D.00001, unik), nama, kategori, telepon, handphone, WhatsApp, email, jalan, kota, catatan, non aktif (lihat 6.1) | — | Belum |
| Aset tetap | nama, akun aset, nilai, tanggal beli, umur, metode penyusutan (dibahas di bagian 6) | → Akun | Belum |
| Anggaran | periode, akun, Program/Divisi, nilai (dibahas di bagian 6) | → Akun, Program, Divisi | Belum |

**Data per pembukuan: transaksi** (setiap transaksi membuat jurnal otomatis, kecuali Jurnal Umum yang adalah jurnal itu sendiri)

| Data | Isi utama | Hubungan | Status |
|------|-----------|----------|--------|
| **Jurnal** (buku jurnal) | nomor, tanggal, keterangan, rincian[akun, debit, kredit, Divisi, Program, penanggung jawab, keterangan], lampiran, sumber | rincian → Akun, Divisi, Program | Ada |
| Pencatatan Gaji (**tanpa jurnal**) | nomor, tanggal, jatuh tempo, periode (bulan/tahun), **akun Beban Gaji**, catatan, rincian[karyawan + komponen gaji + catatan], total; status bayar dihitung dari Pembayaran | → Karyawan, Akun | Ada (skema A sejak H3.1; komponen, slip, dan Proses → Pembayaran menyusul H3.2–H3.6) |
| Pembayaran | nomor, tanggal, akun Kas/Bank, penerima (teks), no cek, catatan, rincian[akun, nilai, Divisi, Program, catatan, Pencatatan Gaji] | → Akun, Divisi, Program, Pencatatan Gaji | Sebagian |
| Donasi | nomor, tanggal, id Donatur, akun Kas/Bank, cara bayar, keterangan; baris: Kategori Donasi (akun donasi), nilai, Divisi, Program, keterangan (lihat 6.1) | → Donatur, Kategori Donasi, Akun, Divisi, Program | Belum |
| Penerimaan Kas/Bank | seperti Pembayaran, arah uang masuk | → Akun, Divisi, Program | Belum |
| Transfer Kas/Bank | dari akun Kas/Bank, ke akun Kas/Bank, nilai | → Akun | Belum |
| Pemindahan Dana | dari Program, nilai, ambil dari Kas/Bank, ke Kas/Bank Dana Umum, alasan (lampiran menyusul) | → Program | Belum |
| Transfer Anggaran | dari pos anggaran, ke pos anggaran, nilai | → Anggaran | Belum |
| Rekonsiliasi bank | akun bank, periode, saldo rekening koran, baris jurnal yang dicocokkan | → Akun, Jurnal | Belum |
| Transaksi berulang | jenis transaksi, contoh isinya, jadwal | → transaksi asal | Belum |
| Tutup buku | tahun, tanggal ditutup, oleh | — | Belum |

### 3.3 Hubungan penting
- **Pencatatan Gaji → Pembayaran (skema A, 2026-10-25):** Pencatatan Gaji hanya mencatat rincian per karyawan dan menjadi dasar slip gaji; **tidak membuat jurnal**. Gaji dibayar lewat **satu atau beberapa baris Pembayaran** (karena tiap Divisi membayar dari Kas/Bank-nya sendiri). Setiap baris itu berakun Beban Gaji, menyimpan id pencatatan gaji, dan Divisi/Program-nya dipilih di tab Info lainnya.
  - Jumlah semua pembayaran tidak boleh melebihi gaji dibayarkan. Status: Belum dibayar / Sebagian / Lunas.
  - Pencatatan Gaji yang sudah punya pembayaran tidak bisa diubah atau dihapus. Menghapus pembayarannya mengembalikan statusnya.
  - Gaji yang belum dibayar tidak muncul sebagai utang di neraca (diterima pengguna).
  - **Gaji hanya dibayar lewat formulir Pembayaran, tidak lewat Jurnal Umum.** Tombol **Proses → Gaji** di Pencatatan Gaji membuka Pembayaran baru yang sudah terisi baris Beban Gaji sebesar sisa yang belum dibayar. Baris Jurnal Umum tidak bisa ditautkan ke Pencatatan Gaji.
- **Donasi → Donatur:** setiap donasi wajib punya Donatur. Donatur yang tidak mau disebut namanya dicatat dengan data Donatur bernama **"Hamba Allah"**.
- **Donasi → Program:** Program dipilih **per baris** rincian (boleh kosong), bersama Divisi yang wajib (6.1, draf 2026-10-28). Satu bukti donasi boleh berisi beberapa baris untuk Program berbeda. Terikat atau tidaknya ditentukan oleh akun donasi baris itu, bukan oleh Program.
- **Baris jurnal → Program:** baris tanpa Program = dana tidak terikat.

## 4. Aturan akuntansi (jurnal otomatis) — Disetujui 2026-10-25

### 4.1 Aturan umum
- Setiap jurnal wajib **seimbang**: total debit = total kredit, dan minimal 2 baris.
- Jurnal otomatis memakai **nomor dan tanggal transaksi asalnya**, dan menyimpan `sumber = { jenis, id }`.
- **Divisi, Program, Penanggung Jawab, dan keterangan** dari baris transaksi ikut ke baris jurnal yang sesuai. ~~Baris tanpa Program = dana tidak terikat.~~ (tidak dipakai lagi, 2026-10-26)
- **Penanda Terikat pada baris pengeluaran** (draf 2026-10-26): baris **Pembayaran** (termasuk baris gaji) dan baris **Jurnal Umum** punya **dua centang di bagian "Dana": "Terikat" dan "Tidak Terikat"** di tab Info lainnya popup barisnya (diubah 2026-10-28, permintaan pengguna; dulu satu centang). Hanya satu yang bisa dicentang (mencentang satu melepas yang lain). Penanda ini ikut ke baris jurnal, supaya laporan bisa membaca beban mana yang terikat (misalnya gaji yang dibiayai donasi terikat). Baris baru **mengikuti** pilihan baris terakhir (seperti Divisi dan Program), tetap bisa diubah; baris pertama belum terpilih. **Pengaman:** Jurnal Umum dan Pembayaran **tidak bisa disimpan** kalau masih ada baris yang belum dipilih salah satunya (notifikasi peringatan di pojok kanan atas menyebut barisnya, 5.1), supaya tidak lupa. Baris akun **Kas & Bank** tidak wajib dipilih (sifat dananya dilihat dari baris lawannya). Baris lama yang tersimpan sebelum aturan ini dan tidak dicentang Terikat dianggap **Tidak Terikat**. Untuk pemasukan, terikat atau tidaknya ditentukan oleh akun donasi (6.1); **Penerimaan Kas/Bank tidak punya centang Terikat** — cukup dilihat dari Divisinya (Keputusan terbuka 9).
- Sisi **Kas/Bank** pada jurnal otomatis tidak diberi Program. Program hanya menempel pada baris pendapatan, beban, dan aset neto.
- Akun yang bisa dipilih di transaksi: **hanya akun tanpa sub akun** (lihat bagian 5).
- Akun bawaan untuk jurnal otomatis (misalnya Aset Neto Terikat dan Tidak Terikat, Ekuitas Saldo Awal) dipilih sekali di **Preferensi > Akun Perkiraan**.

### 4.2 Jurnal per transaksi

| Transaksi | Debit | Kredit | Catatan |
|-----------|-------|--------|---------|
| Saldo awal akun | Akun yang diberi saldo awal (aset) | Ekuitas Saldo Awal | Dibalik untuk akun bersisi kredit (utang, aset neto, pendapatan). Satu jurnal "Saldo Awal" per akun, bertanggal saldo awalnya. Tanpa Program: **sisa dana Program dari Accurate tidak dimasukkan**; saldo Program mulai dari nol. |
| Jurnal Umum | Diketik sendiri | Diketik sendiri | Satu-satunya jurnal yang tidak otomatis. |
| Pencatatan Donasi (uang) | Kas/Bank, sebesar Total | Akun donasi tiap baris (dari Kategori Donasi), membawa Divisi, Program, Keterangan baris | Akun donasi = akun Kategori Donasi yang ada di kolom Donasi Terikat atau Tidak Terikat di Preferensi > Akun Perkiraan; kolom itulah yang menentukan terikat atau tidak (6.1). |
| Donasi (barang) | Akun aset atau beban, sesuai barangnya | Akun donasi | Nilai = taksiran. **Ditunda, dibahas tersendiri** (2026-10-28). |
| Penerimaan Kas/Bank | Kas/Bank | Akun di tiap baris rincian | Untuk uang masuk selain donasi. |
| Pembayaran | Akun di tiap baris rincian | Kas/Bank | Termasuk pembayaran gaji (lihat baris di bawah). |
| Transfer Kas/Bank | Kas/Bank tujuan | Kas/Bank asal | |
| Pencatatan Gaji | — | — | **Tidak membuat jurnal.** Hanya catatan rinci dan dasar slip gaji. |
| Pembayaran gaji | Beban Gaji, bertanda **Divisi** (dan Program bila dibiayai dana terikat) yang dipilih di Info lainnya | Kas/Bank (biasanya Kas/Bank milik Divisi itu) | Lewat formulir Pembayaran. Boleh beberapa kali sampai lunas. Nilai = bagian gaji dibayarkan (pendapatan − potongan); potongan tidak dijurnal terpisah. |
| Pemindahan Dana | ① Aset Neto Terikat [Program asal]; ② Aset Neto Tidak Terikat [tanpa Divisi = Dana Umum]; dan **Kas/Bank tujuan** | ① Aset Neto Tidak Terikat [tanpa Divisi = Dana Umum]; ② Aset Neto Tidak Terikat [Divisi tujuan]; dan **Kas/Bank asal** | Dua arah: ① sisa Program → Dana Umum, ② Dana Umum → Divisi. Kepemilikan dan uangnya pindah sekaligus; pasangan Kas/Bank tidak dibuat kalau kasnya sama. Akun Aset Neto dipilih di Preferensi > Akun Perkiraan (rancangan 2026-10-30, lihat 6.1). Wajib alasan; lampiran menyusul H2.11. |
| Penyusutan aset tetap | Beban Penyusutan | Akumulasi Penyusutan | Dibuat otomatis tiap bulan per aset. |
| Tutup buku akhir tahun | Semua akun pendapatan | Semua akun beban | Selisihnya masuk **Aset Neto Terikat** (untuk baris bertanda Program terikat) dan **Aset Neto Tidak Terikat** (sisanya), sesuai standar laporan yayasan (ISAK 35). Tahun itu lalu terkunci. |
| Transaksi berulang | Sesuai jenis transaksinya | | Membuat transaksi biasa, yang lalu membuat jurnalnya sendiri. |

### 4.3 Yang tidak membuat jurnal
- **Anggaran dan Transfer Anggaran**: rencana, bukan uang. Dibandingkan dengan jurnal di Monitor Anggaran.
- **Rekonsiliasi bank**: hanya menandai baris jurnal yang cocok dengan rekening koran. Selisih (misalnya biaya admin bank) dicatat lewat Pembayaran atau Penerimaan biasa.
- **Master data** (Divisi, Program, Karyawan, Donatur).
- **Pencatatan Gaji** (jurnalnya dibuat saat dibayar lewat Pembayaran).

## 5. Aturan bersama — Disetujui 2026-10-25

Aturan ini berlaku di **semua** formulir transaksi. Kodenya ditulis **sekali** di `umum/` dan dipakai bersama, tidak ditulis ulang per fitur.

### 5.1 Pilihan akun, Program, dan Divisi
- **Akun di transaksi:** hanya akun **tanpa sub akun** dan **tidak Non Aktif**. Akun induk dan akun Non Aktif disembunyikan. Transaksi lama yang sudah memakai akun Non Aktif tetap tampil apa adanya.
- **Pilihan Kas/Bank** (Pembayaran, Penerimaan, Transfer, Donasi): hanya akun bertipe Kas & Bank **di tingkat 3** (sub dari sub akun, misalnya 11010101 Kas Kecil Masjid), dan tidak Non Aktif. Akun Kas & Bank tingkat 1 dan 2 (misalnya 110102 Bank) tidak muncul, walaupun tidak punya sub akun.
- **Isian atas dulu (pengaman urutan isian)**: pencarian rincian baru bisa dibuka setelah isian wajib di bagian atas formulir terisi. Kalau belum, muncul peringatan (notifikasi pojok kanan atas, misalnya "Pilih Kas/Bank dulu sebelum memilih akun perkiraan.") dan kursor pindah ke isian pertama yang kurang. Perluasan ke semua formulir: permintaan pengguna 2026-10-30.
  - Pembayaran dan Penerimaan: Kas/Bank, Tanggal (sebelum memilih akun perkiraan).
  - Pencatatan Donasi: Donatur, Kas/Bank, Tanggal (sebelum memilih Kategori Donasi).
  - Pemindahan Dana: Dari Program (arah ①), Ambil dari, Tanggal (sebelum memilih tujuan; juga saat baris tujuan diklik).
  - Jurnal Umum: Tanggal (sebelum memilih akun perkiraan). Pencatatan Gaji: Tanggal (sebelum memilih karyawan).
  - Transfer Bank tidak punya pencarian rincian.
- **Program:** hanya Program **Aktif** yang bisa dipilih di transaksi baru. Baris lama dengan Program yang sudah Selesai tetap menampilkan programnya.
- **Divisi:** diusulkan dari Divisi milik Program kalau Divisi masih kosong. Divisi yang sudah dipilih tidak ditimpa.
- **Divisi wajib diisi** (permintaan pengguna 2026-10-28) di setiap baris **Jurnal Umum, Pembayaran, dan Penerimaan** (Pencatatan Donasi sudah wajib, 6.1), kecuali baris akun **Kas & Bank**. Pilihan kosongnya bertulisan "Pilih Divisi...". Transaksi tidak bisa disimpan kalau masih ada baris tanpa Divisi.
- **Peringatan pengaman baris** (Divisi kosong, dan Dana Terikat / Tidak Terikat belum dipilih, 4.1) muncul sebagai **notifikasi peringatan di pojok kanan atas**, seperti peringatan lain di aplikasi. Peringatan muncul **sedini mungkin: saat klik Lanjut di popup baris** (permintaan pengguna 2026-10-28); popup tetap terbuka dan pindah ke tab Info lainnya supaya langsung bisa diisi. Saat Simpan diperiksa sekali lagi (pesannya menyebut barisnya), untuk baris yang tidak masuk lewat popup (misalnya baris gaji dari Proses atau jurnal lama). Peringatan lain saat Simpan (misalnya Tanggal wajib) tetap seperti sebelumnya.
- **Baris berikutnya** otomatis memakai Divisi dan Program baris terakhir (tetap bisa diubah).
- **Penanda pilihan (chip)** (permintaan pengguna 2026-10-28, dari foto kolom Pelanggan Accurate): kolom cari/pilih yang menyimpan **satu** pilihan (misalnya Donatur di Pencatatan Donasi) menampilkan pilihannya sebagai label **[ID/kode] Nama ✖** di dalam kolom. Klik ✖ melepas pilihan; mengetik di kolom memulai pencarian baru dan melepas pilihan lama. Berlaku untuk semua kolom seperti itu, termasuk yang dibuat nanti. Label akun di Preferensi > Akun Perkiraan memakai bentuk label yang sama.
- **Titik ribuan langsung saat mengetik nominal** (permintaan pengguna 2026-10-28): di setiap kolom nominal (Nilai di popup rincian Jurnal Umum, Pembayaran, Penerimaan, Pencatatan Donasi; komponen Pencatatan Gaji; Nilai Transfer; Saldo Awal akun), titik pemisah ribuan muncul otomatis selagi mengetik (mengetik 1500000 langsung tampil 1.500.000), dan kursor tetap di tempat yang benar. Kolom nominal selalu berisi angka bulat (Rupiah tanpa desimal), apa pun pengaturan desimal di Preferensi.
- **Semua kotak pilihan di formulir memakai label** (keputusan pengguna 2026-10-28): setiap kotak pilihan isian di formulir dan popup (misalnya Kas/Bank, Divisi, Program, Cara Bayar, aturan No Bukti, Sub dari, Tipe Akun) tampil sebagai kolom cari/pilih: pilihan terpilih tampil sebagai label ✖, klik kolom membuka daftar pilihan yang bisa disaring dengan mengetik. Pilihan kosong (misalnya "Pilih Divisi...", "(Tanpa Program)") menjadi tulisan petunjuk saat tidak ada label; ✖ mengembalikan ke pilihan kosong itu. Kotak pilihan yang tidak punya pilihan kosong (misalnya Cara Bayar, Tipe Akun) tidak punya ✖ karena harus selalu berisi. **Tidak diubah:** filter di atas daftar (misalnya "Kelompok: Semua"), pilihan tampilan Dashboard, dan pilihan di editor Desain Cetakan (ukuran kertas, orientasi, penanda isian; alat menggambar dengan 2–3 pilihan). Pilihan Kas/Bank di Histori Bank dan Rekonsiliasi Bank **ikut** memakai label (keputusan pengguna 2026-10-28), karena daftar rekeningnya bisa panjang. Dibuat dengan satu alat bersama, seperti kalender yang mengganti semua kolom tanggal.

### 5.2 Nomor transaksi
- Setiap jenis transaksi punya aturan penomoran sendiri (Pengaturan > Penomoran).
- Bawaannya **otomatis**. Saklar bisa dimatikan untuk **mengetik nomor sendiri**.
- Nomor wajib **unik** dalam jenis transaksinya. Nomor otomatis yang hasilnya kosong ditolak.
- Hitungan nomor baru dipakai **setelah transaksi benar-benar tersimpan**.
- Hitungan dimulai dari 1 lagi sesuai isi aturannya: per bulan kalau aturannya memuat bulan, per tahun kalau hanya memuat tahun, dan tidak pernah kalau tidak memuat keduanya.

### 5.3 Tanggal
Transaksi ditolak kalau tanggalnya:
- kosong;
- **sebelum tanggal mulai pembukuan** (Preferensi > Data);
- melewati hari ini, bila larangan tanggal masa depan dinyalakan (Preferensi > Pembatasan);
- **pada atau sebelum tanggal kunci** (Preferensi > Pembatasan). Transaksi lama bertanggal terkunci juga tidak bisa diubah atau dihapus.
- Tahun yang sudah **ditutup buku** otomatis terkunci.

### 5.3a Formulir Data Baru bersih (keputusan pengguna 2026-11-08, Temuan 44)
- Formulir Data Baru di semua halaman dibuka **kosong**: semua kotak pilihan mulai dari "Silakan Pilih", tanggal kosong, aturan penomoran belum dipilih
  (nomor baru tampil setelah aturannya dipilih), dan isian turunan (misalnya Bayar/Potong dari Tipe, Kode Perkiraan dari Tipe Akun) ikut kosong
  sampai pilihan asalnya diisi. Tidak ada isian yang mengikuti transaksi terakhir.
- Menyimpan dengan isian wajib yang masih kosong **ditolak dengan pesan** ("... wajib dipilih" / "... wajib diisi"), kursor pindah ke kolom itu.
- Data yang dibuka dari daftar tetap menampilkan isinya sendiri. Sesudah Simpan, Data Baru kembali kosong dengan aturan yang sama.
- Menggantikan aturan lama "Tanggal terisi hari ini" dan "nomor otomatis langsung terpilih" di bagian lain PRD.
- Pengecualian yang bukan pilihan pengguna (keputusan 2026-11-09): saklar Otomatis Nomor tetap menyala (aturannya tetap dipilih sendiri);
  ID Donatur otomatis tetap tampil (dibuat aplikasi); isian hasil hitungan (Kode Perkiraan, Kode Donasi, Bayar/Potong, total) tampil setelah asalnya diisi.
- Tanggal Saldo Awal di Akun Perkiraan kosong, dan wajib hanya kalau Saldo Awal diisi (keputusan 2026-11-09).

### 5.4 Lampiran
- Maksimal **5 file** per transaksi, **700 KB** per file. Foto dikecilkan otomatis.
- Jenis file: PDF, gambar (JPG, PNG, WEBP), Word, Excel, CSV, TXT.
- Lampiran bisa dijadikan **wajib per jenis transaksi** (Preferensi > Lampiran).
- Isi file disimpan terpisah dari data transaksi dan ikut Cadangan Data. Menghapus transaksi ikut menghapus lampirannya.
- **Berlaku di semua transaksi pencatatan** (keputusan pengguna 2026-11-08): Jurnal Umum, Pembayaran, Penerimaan, Transfer Bank, Pencatatan Gaji,
  Pencatatan Donasi, dan Pemindahan Dana. Semuanya memakai satu popup Lampiran yang sama dengan Jurnal Umum (tombol klip dengan angka jumlah file).
  Pilihan wajib lampiran di Preferensi ditambah Pembayaran, Pencatatan Gaji, dan Pemindahan Dana. Lampiran ikut diingat per tab (6.10).
- **Laporan Bukti Pengeluaran per Divisi dan Program** (keputusan pengguna 2026-11-09; tidak ada di Accurate, dua gambar contoh disetujui; dibuat lewat J.22):
  - Kategori Divisi & Program di menu Laporan. Parameter: Tanggal Dari–s/d, Divisi dan Program (boleh beberapa), seperti laporan per Divisi lainnya.
  - Dikelompokkan: judul Divisi, lalu Program di bawahnya (tanpa Program = "Tanpa Program"), lalu transaksi urut tanggal:
    Tanggal, No Bukti, Jenis transaksi, Keterangan, Nilai bagian kelompok itu, dan bukti. Jumlah per Program, per Divisi, dan Total.
  - Transaksi yang barisnya berbeda Divisi/Program tampil di setiap kelompoknya dengan nilai bagian kelompok itu (total tetap benar).
  - Bukti: foto nota tampil sebagai gambar kecil, PDF dan dokumen lain sebagai ikon jenis berkas; klik untuk melihat besar atau mengunduh.
    Di PDF cetak, foto ikut tercetak kecil.
  - **Dua bentuk** (keputusan pengguna 2026-11-09, dari dua gambar contoh): di layar dan Cetak biasa memakai bentuk gambar kecil; ada pilihan
    cetak **"Lampiran audit"**: halaman 1 ringkasan (Divisi/Program, No Bukti, Tanggal, Nilai, jumlah bukti, nomor halaman, TOTAL, jumlah yang
    belum ada bukti, tanda tangan Disiapkan oleh dan Diperiksa oleh), lalu satu blok per transaksi dengan bukti gambar tampil besar
    (satu bukti selebar blok, dua berdampingan), blok tidak terpotong antarhalaman, tanpa bukti = kotak merah "Belum ada bukti".
    PDF/Excel/Word hanya tercetak nama berkasnya dengan tulisan "buka atau unduh dari aplikasi".
  - Transaksi tanpa lampiran tetap tampil dengan tanda merah "Belum ada bukti".
  - Sumber: **hanya transaksi pengeluaran** (keputusan pengguna 2026-11-09), dengan definisi yang sama dengan laporan Rincian Pengeluaran:
    pembelian dan pengeluaran dari Pembayaran (termasuk pembayaran gaji) dan Jurnal Umum. Donasi, Penerimaan, Transfer, dan Pemindahan Dana
    tidak masuk. Lampiran Pembayaran berfungsi sesudah J.20.
  - Kertas mendatar (kolom Bukti butuh tempat untuk gambar kecil). Popup Lihat Bukti: foto besar, pindah ke bukti lain transaksi yang sama,
    Unduh, dan Buka transaksi. Lampiran audit memakai kertas A4 tegak; satu blok per transaksi (transaksi yang terbagi beberapa Program
    menyebut semua bagiannya), dan nomor halaman tiap blok tertulis di ringkasan.
  - Lampiran dicari di transaksi asalnya (Pembayaran menyimpan lampirannya sendiri; Jurnal Umum di jurnalnya).

### 5.5 Isian wajib baris pengeluaran
Untuk baris berakun beban, pengguna memilih sendiri di **Preferensi** isian mana yang wajib: **Keterangan**, **Penanggung Jawab**, dan/atau **Divisi**. Bawaannya tidak ada yang wajib.

### 5.6 Pengaman saldo
Diatur di **Preferensi**, bisa dipilih **peringatan saja** (tetap bisa disimpan) atau **ditolak**:
- **Kas/Bank minus:** pengeluaran membuat saldo Kas/Bank minus pada tanggal itu.
  - Rincian (keputusan pengguna 2026-10-30, dari Temuan 27): diatur di **Preferensi > Pembatasan > Lainnya**, pilihan **Ditolak** (bawaan) atau **Peringatan saja**.
  - Berlaku untuk **semua transaksi yang membuat jurnal**: Jurnal Umum, Pembayaran, Penerimaan, Transfer Bank, Pencatatan Donasi, Pemindahan Dana (dan transaksi berjurnal berikutnya), saat disimpan baru maupun diubah. Pencatatan Gaji tidak membuat jurnal (uangnya keluar lewat Pembayaran).
  - Yang diperiksa: untuk tiap akun Kas/Bank di jurnal transaksi itu, **saldo akhir hari** mulai tanggal transaksi sampai tanggal terakhir di buku jurnal (saldo awal akun + semua jurnal; jurnal lama transaksi yang sedang diubah diganti versi barunya). Jadi pengeluaran bertanggal mundur yang membuat saldo hari-hari sesudahnya minus juga ketahuan.
  - Ditolak hanya kalau perubahan itu **membuat saldo lebih minus** daripada sebelumnya. Data lama yang sudah terlanjur minus tidak menghalangi transaksi lain yang tidak memperburuknya (misalnya penerimaan).
  - Pesan (notifikasi pojok kanan atas) menyebut akun Kas/Bank, tanggal saldo menjadi minus, besarnya, dan saldo yang tersedia pada tanggal transaksi.
  - Menghapus transaksi pemasukan yang membuat kas minus belum diperiksa (dibahas kalau diperlukan).
- ~~Dana Program terikat~~ — **dihapus** (keputusan pengguna 2026-10-26, Keputusan terbuka 8c): Program bukan lagi penanda dana terikat, jadi tidak ada pengaman sisa dana Program.

### 5.7 Mengubah dan menghapus
- Data yang sudah dipakai data lain **tidak bisa dihapus**. Contohnya akun di jurnal, Program/Divisi di transaksi, Karyawan di Pencatatan Gaji, Donatur di Donasi, dan Pencatatan Gaji yang sudah punya pembayaran. Pesan penolakannya menyebut di mana data itu dipakai.
- Jurnal otomatis hanya bisa diubah atau dihapus dari formulir asalnya.
- Konfirmasi hapus menyebut akibatnya, misalnya "jurnal otomatisnya ikut terhapus".
- Semua simpan, ubah, dan hapus tercatat di **Log Aktivitas**, termasuk isi sebelum dan sesudah.

### 5.8 Hak akses
- Pengguna hanya bisa membuka pembukuan yang diizinkan untuk perannya (bagian 1.3).
- **Pengawas:** semua tombol simpan, ubah, hapus, dan pengaturan tidak tersedia; hanya melihat data dan laporan.
- Hanya Finance Yayasan yang bisa membuka Pengguna, Preferensi, dan Cadangan Data.

### 5.9 Keamanan data
- Isian pengguna selalu ditampilkan sebagai teks biasa (tidak dijalankan sebagai kode).
- Data rusak di penyimpanan tidak boleh membuat halaman macet: data yang rusak dilewati.
- Ekspor CSV dilindungi dari rumus berbahaya (CSV injection).
- Kata sandi disimpan teracak (PBKDF2), tidak pernah disimpan apa adanya.

## 6. Fitur per menu — Sedang dibahas

### 6.0 Sisa dana Program dan Divisi (berlaku untuk semua fitur) — Disetujui 2026-10-25
- **Sisa dana Program** = semua pemasukan bertanda Program itu (Donasi **dan** pendapatan lain, misalnya Penerimaan Kas/Bank) − semua pengeluaran bertanda Program itu ± Pemindahan Dana.
- **Sisa dana Divisi** dihitung dengan cara yang sama dari baris bertanda Divisi itu.
- Dihitung otomatis dari **buku jurnal** (baris akun pendapatan, beban, dan aset neto), tidak disimpan terpisah.
- Pendapatan selain donasi tetap dilaporkan sebagai **pendapatan lain**, terpisah dari donasi, walaupun ikut menambah sisa dana.
- **Sisa dana tidak pernah pindah otomatis**, termasuk saat Program Selesai. Sisa hanya bisa dipindah lewat **Pemindahan Dana** yang dibuat pengguna.

### 6.1 Donatur dan Donasi — Disetujui 2026-10-25 (popup menu disetujui 2026-10-26; akun donasi dan formulir: draf)

**Popup menu Donasi** (ikon Donasi di menu samping; dari foto popup Penjualan Accurate 2026-10-26, hanya kotak yang cocok untuk yayasan). Warna kotak mengikuti Accurate: hijau = transaksi, biru = data.
- Pemilahan per kotak (pengguna 2026-10-26):

| Kotak Accurate | Menjadi | Warna |
|---|---|---|
| Faktur Penjualan **+** Penerimaan Penjualan | **Pencatatan Donasi** (dua formulir Accurate digabung jadi satu fitur; bentuknya dibahas dari foto keduanya) | hijau |
| Pengiriman Pesanan | tidak dipakai — **Penyaluran Bantuan dihilangkan** (keputusan pengguna 2026-10-29). Bantuan yang disalurkan ke penerima manfaat dicatat lewat **Kas & Bank > Pembayaran** seperti pengeluaran lain (akun beban penyaluran, Divisi, Program, Dana Terikat/Tidak Terikat). | — |
| Retur Penjualan | tidak dipakai — **Pengembalian Donasi dihilangkan** (keputusan pengguna 2026-10-29), termasuk saklarnya di Preferensi > Fitur. Donasi yang salah dicatat cukup diubah atau dihapus di Pencatatan Donasi; uang yang benar-benar dikembalikan ke donatur dicatat lewat Kas & Bank > Pembayaran. | — |
| — (kotak baru) | **Pemindahan Dana** (antar Program, PRD 2.1) | hijau |
| Kategori Penjualan | **Kategori Donasi** = tempat **membuat akun donasi** (akun pendapatan donasi) | biru |
| Pelanggan | **Donatur** (pindah dari Master Data ke sini) | biru |
| Target Penjualan | **Target Donasi** (target pengumpulan per Program; lihat Target Donasi di bawah) | oranye |
| Komisi Penjual | belum dibuat — **dikembangkan nanti** | — |
| Penawaran, Pesanan, Uang Muka, Kategori Pelanggan, Penyesuaian Harga/Diskon, SmartLink e-Commerce, Check In | tidak dipakai | — |

**Kategori Donasi** (draf 2026-10-27; dari foto formulir Barang & Jasa Accurate, fungsinya diubah untuk membuat akun donasi):
- Formulir tab **Umum**:
  - **Nama Donasi** \* (padanan Nama Barang), misalnya "Infaq Umum", "Donasi Pembangunan Masjid".
  - **Sub dari** \*: akun induk bertipe Pendapatan, dipilih setiap kali (misalnya 4101 Pendapatan > 410101 Donasi). Akun hasil tetap mengikuti batas 3 tingkat.
  - **Kode Donasi** (padanan Kode Barang) = **kode akunnya**: dibuat **otomatis dari induk** (kode induk + 2 digit berikutnya) dan **terkunci**, sama dengan aturan Akun Perkiraan.
  - **Kelompok** (padanan Kategori Barang): pilih dari daftar kelompok yang sudah ada (misalnya Zakat, Infaq, Wakaf) atau ketik nama baru untuk menambah. Tidak wajib.
  - Jenis Barang dan Satuan **tidak dipakai**.
- Tab **Lainnya** (permintaan pengguna 2026-10-27): berisi **Catatan** (teks bebas, tidak wajib).
- Tab Accurate lain (Penjualan/Pembelian, Akun, Gambar, Lain-lain) **tidak dipakai**; status **Non Aktif juga tidak dipakai** (kategori yang tidak dipakai lagi dibiarkan, atau dihapus kalau belum dipakai transaksi).
- **Simpan = akun pendapatan baru otomatis dibuat** di Akun Perkiraan (nama dan kode sama dengan Kategori Donasi, sub dari induk yang dipilih).
- **Ubah dan hapus ikut ke akunnya:** ganti nama Kategori Donasi = nama akun ikut berubah; hapus hanya boleh kalau akunnya belum dipakai transaksi, dan akunnya ikut terhapus. Akun hasil Kategori Donasi **hanya bisa diubah/dihapus lewat Kategori Donasi**, tidak dari Akun Perkiraan (disetujui 2026-10-27), seperti jurnal otomatis yang hanya bisa diubah dari transaksi asalnya.
- **Rincian ubah/hapus** (keputusan pengguna 2026-10-27):
  - Ubah Nama = nama akun ikut berubah; Kelompok dan Catatan hanya di kategori; Kode tetap terkunci.
  - **Sub dari boleh diganti selama akunnya belum dipakai** (belum ada di jurnal dan belum dimasukkan ke Preferensi); kodenya ikut berganti (kode induk baru + 2 digit). Kalau sudah dipakai, ditolak (sama dengan aturan Akun Perkiraan).
  - Hapus ditolak kalau akunnya sudah dipakai transaksi. Kalau akunnya hanya ada di kotak Donasi Terikat/Tidak Terikat Preferensi, hapus tetap jalan dan akunnya **otomatis dikeluarkan dari Preferensi**.
  - Membuat akun baru bertipe Pendapatan di Akun Perkiraan memunculkan peringatan bahwa akun donasi dibuat lewat Kategori Donasi, supaya tidak ada akun ganda. Hanya peringatan; menyimpan tetap boleh untuk induk atau pendapatan selain donasi (keputusan pengguna 2026-11-08, Temuan 42).
  - Di Akun Perkiraan, akun milik Kategori Donasi tetap tampil dengan saldonya, tetapi Simpan/Hapus ditolak dengan pesan untuk mengurusnya lewat Kategori Donasi, dan akun itu tidak bisa dijadikan induk sub akun lain. Akun itu tetap bisa dipilih di Preferensi dan formulir Donasi.
- Setelah dibuat, akunnya dimasukkan **manual** ke kolom Donasi Terikat atau Donasi Tidak Terikat di Preferensi (lihat di bawah).
- **Daftar Kategori Donasi** (dari foto daftar Barang & Jasa Accurate): kolom **Nama Donasi**, **Kode**, **Kelompok**, **Terikat / Tidak Terikat** (kolom Preferensi tempat akunnya dimasukkan, atau "Belum diatur"); filter **Kelompok** dan **Terikat / Tidak Terikat**; kolom cari dan tombol-tombol daftar seperti daftar lain di aplikasi.

**Akun donasi di Preferensi** (draf 2026-10-26):
- Kolom "Pendapatan Donasi" di Preferensi > Akun Perkiraan dipecah menjadi dua: **Donasi Terikat** dan **Donasi Tidak Terikat**. Kedua kolom bersama-sama menjadi daftar akun yang bisa dipilih di formulir Donasi. Isi kolom lama (kalau ada; pengguna belum pernah mengisinya) otomatis pindah ke **Donasi Tidak Terikat**.
- Akun yang dibuat lewat Kategori Donasi dimasukkan **manual** ke salah satu kolom itu.
- **Terikat atau tidaknya sebuah donasi ditentukan oleh akunnya** (kolom Preferensi tempat akun itu dimasukkan), bukan oleh sifat Program.
- **Program tetap dipakai**, dipilih di tab **Info lainnya** formulir Donasi bersama **Divisi** dan **Keterangan** (seperti Pembayaran dan Penerimaan). Lewat pilihan itulah akun donasi dikaitkan dengan Program, dan donasi itu menambah sisa dana Program/Divisi (6.0).
- **Divisi wajib, Program boleh kosong** di formulir Donasi (keputusan 2026-10-26).
- Formulir dan aturan tiap kotak dibahas satu per satu dari foto Accurate berikutnya.

**Donatur** (disetujui 2026-10-28; dari foto formulir dan daftar Pelanggan Accurate; dibuka dari kotak Donatur di popup Donasi):
- **Tab Umum, bagian Info Umum:**
  - **Nama** (wajib). **Nama boleh sama** dengan donatur lain (misalnya beberapa "Hamba Allah"); yang membedakan adalah ID-nya.
  - **ID Donatur** (wajib) dengan tombol geser seperti ID Pelanggan. Tombol menyala: ID dibuat otomatis berbentuk **D.00001, D.00002, ...** (nomor berikutnya sesudah yang terbesar). Tombol mati: ID diketik sendiri. ID **tidak boleh kembar**.
  - **Kategori** donatur (tidak wajib): pilih dari kategori yang sudah pernah dipakai, atau ketik nama baru, seperti Kelompok di Kategori Donasi. Tidak ada halaman Kategori Donatur tersendiri.
  - Kontak (tidak wajib): **No. Telepon** (pengganti No. Telp. Bisnis), **Handphone**, **No. WhatsApp**, **Email**. Faximili dan Website tidak dipakai.
- **Tab Umum, bagian Info Lainnya:** **Alamat** singkat, yaitu **Jalan** dan **Kota** (tidak wajib). K.Pos, Provinsi, Negara, dan Mata Uang Utama tidak dipakai (aplikasi hanya Rupiah).
- **Tab Lainnya:** **Catatan** dan kotak **Non Aktif**.
- **Hapus dan Non Aktif:** donatur yang sudah dipakai di Pencatatan Donasi **tidak bisa dihapus** (pesan menyebut tempat dipakainya). Sebagai gantinya, donatur ditandai **Non Aktif**: tetap tersimpan dan tetap tampil di transaksi lamanya, tetapi tidak muncul lagi di pilihan Donatur saat mencatat donasi baru. Aturan ini berlaku begitu Pencatatan Donasi dibuat.
- Donatur bawaan **"Hamba Allah"** untuk donatur yang tidak mau disebut namanya (keputusan 2026-10-25) tetap berlaku: dibuat otomatis dan tidak bisa dihapus. **Nama dan Non Aktif-nya juga dikunci** (keputusan 2026-10-28): namanya selalu "Hamba Allah" dan tidak bisa dinonaktifkan, supaya selalu tersedia di pilihan Donatur. Isian lain (ID, kontak, catatan) tetap bisa diubah.
- **Daftar Donatur:** kolom **Nama**, **ID Donatur**, **Kontak Utama** (No. WhatsApp; kalau kosong Handphone; kalau kosong juga No. Telepon), **Kategori**, dan **Total Donasi** (pengganti kolom Saldo; jumlah donasi dari donatur itu, baru terisi setelah Pencatatan Donasi dibuat, sampai saat itu Rp 0). Tanpa filter di atas daftar; kolom cari dan tombol daftar lainnya seperti daftar lain di aplikasi.
- **Ganti nama cukup di Donatur** (permintaan pengguna 2026-10-28): transaksi donasi menyimpan **ID donatur**, bukan salinan namanya. Jadi kalau ada salah tulis, nama cukup dibetulkan di halaman Donatur, dan semua tempat yang menampilkan donatur ikut berubah: daftar dan formulir Pencatatan Donasi, rincian donatur, laporan, serta bukti/kuitansi donasi yang dicetak atau dibuat ulang sesudahnya. Bukti yang **sudah** dicetak di kertas atau sudah terkirim (PDF/WhatsApp) tentu tidak bisa ikut berubah; untuk itu cetak atau kirim ulang. Perubahan nama tercatat di Log Aktivitas (nama lama → nama baru).
- **Tab Riwayat Donasi** (keputusan pengguna 2026-10-29; di Accurate tidak ada tampilan serupa, jadi dirancang sendiri): tab ketiga di formulir Donatur, sesudah Umum dan Lainnya.
  - Isinya tabel donasi dari donatur itu: **Tanggal**, **No Bukti**, **Nama Donasi**, **Kas/Bank**, **Nilai**, diurutkan dari tanggal terbaru. Nama Donasi = nama donasi baris-barisnya digabung dengan koma, sama seperti kolom Kategori Donasi di daftar Pencatatan Donasi (tambahan pengguna 2026-10-29). Nama Donasi yang panjang ditampilkan satu baris dan dipotong "…"; nama lengkapnya muncul saat kursor diarahkan ke sana.
  - **Donasi yang banyak** (keputusan pengguna 2026-10-29): tinggi tabel dibatasi dan isinya bisa digulir, judul kolom tetap terlihat di atas. Di atas tabel ada pilihan **Tahun**: tahun-tahun yang punya donasi, ditambah **Semua**; awalnya tahun ini.
  - Di bawah tabel: **Total (n donasi)** untuk tahun yang dipilih. Kalau dipilih Semua, angkanya sama dengan kolom Total Donasi di daftar.
  - **Hanya untuk dilihat:** baris tidak bisa diklik. Mengubah donasi tetap lewat Pencatatan Donasi.
  - Donatur yang belum pernah berdonasi, dan formulir Data Baru, menampilkan "Belum ada donasi dari donatur ini."

**Pencatatan Donasi** (disetujui 2026-10-28; dari foto Faktur Penjualan, popup Rincian Barang, daftar dan tab Info lainnya Penerimaan Penjualan Accurate; dibuka dari kotak Pencatatan Donasi di popup Donasi). Menggantikan rancangan Donasi lama (2026-10-25).
- **Satu proses saja.** Di Accurate donasi dicatat dua kali (Faktur, lalu diproses bayar ke Penerimaan Penjualan). Di aplikasi ini donasi dicatat **sekali**: satu formulir berisi donatur, rincian, dan Kas/Bank, lalu Simpan langsung membuat jurnal (uang sudah diterima). Tombol Ambil dan Proses tidak dipakai.
- **Bagian atas** (susunan diubah pengguna 2026-10-28):
  - Kiri: **Donatur**, **Kas/Bank**, **Nilai Pembayaran**. Kanan: **No Bukti**, **Tanggal**.
  - **Donatur** (wajib, cari/pilih): hanya donatur yang tidak Non Aktif. Yang disimpan **id donaturnya**, jadi ganti nama di Donatur ikut mengubah semua tampilan transaksi (lihat Donatur di atas).
  - **Donatur baru langsung dari formulir** (dari foto kolom Pelanggan Accurate): kalau nama yang diketik tidak cocok dengan donatur mana pun, daftar pilihan menampilkan "Tidak ditemukan data yang cocok" dan tombol **Simpan "…" sebagai data baru?**. Tombol itu juga muncul di bawah hasil yang mirip, selama **belum ada donatur yang namanya sama persis** (huruf besar-kecil dianggap sama); misalnya mengetik "Andi" saat sudah ada "Fandi" tetap bisa membuat donatur "Andi" (perbaikan 2026-10-28). Enter tetap memilih hasil yang disorot; tombolnya diklik. Klik tombol itu langsung menyimpan donatur baru di halaman Donatur (hanya nama; ID otomatis D.00xxx; tercatat di Log Aktivitas) dan memilihnya. Kontak dan isian lain dilengkapi nanti di halaman Donatur.
  - **Kas/Bank** (wajib; dulu "Setor ke"): akun Kas/Bank tempat uang donasi masuk (pilihan Kas/Bank yang sama dengan Pembayaran).
  - **Nilai Pembayaran** (hanya dibaca): otomatis berisi jumlah nilai rincian. Kotak **Total** di bawah tabel tetap ada dengan angka yang sama.
  - **No Bukti** (wajib) dengan saklar Otomatis dan pilihan aturan penomoran bertipe Donasi, seperti Pembayaran; saklar mati = diketik sendiri. Tidak boleh kembar.
  - **Tanggal** (wajib, awalnya hari ini).
- **Rincian Donasi** (pengganti Rincian Barang): tabel **Nama Donasi**, **Kode**, **Nilai**. Kuantitas, Satuan, @Harga, Diskon, Sub Total, dan Penjual tidak dipakai. Di bawah tabel hanya **Total**. Minimal satu baris.
  - Pilihan Nama Donasi = **Kategori Donasi** yang akunnya sudah dimasukkan ke kolom Donasi Terikat atau Donasi Tidak Terikat di Preferensi (supaya sifat dananya jelas). Kategori yang masih "Belum diatur" tidak muncul.
  - Popup baris (seperti popup Rincian Barang): tab **Rincian Donasi** (Kode, Nama Donasi, Nilai wajib > 0) dan tab **Info lainnya** (**Divisi** wajib, **Program** boleh kosong, **Keterangan**). Baris baru mengikuti Divisi dan Program baris terakhir. Tab Penangguhan tidak dipakai.
- **Tab "i" Info lainnya** (dari foto Info lainnya Penerimaan Penjualan):
  - **Cara Bayar**: pilihan tetap **Tunai**, **Transfer**, **QRIS**; awalnya Tunai.
  - **Keterangan** (pesan donatur atau catatan bukti); inilah yang tampil di kolom Keterangan daftar.
  - **Terekonsiliasi**: tulisan Sudah/Belum (hanya dibaca). Donasi yang sudah direkonsiliasi tidak bisa diubah/dihapus sebelum tandanya dibatalkan, sama dengan Pembayaran (6.3).
  - VOID tidak dipakai (donasi yang salah dihapus). Dicetak/email dan waktunya **ditunda** bersama Cetak bukti (H2.12).
- **Jurnal otomatis** (4.2): Debit **Kas/Bank** sebesar Total; Kredit **akun donasi** tiap baris sebesar nilainya, membawa Divisi, Program, dan Keterangan baris. Terikat atau tidaknya baris ditentukan oleh akun donasinya (kolom Preferensi tempat akun itu berada), bukan oleh centang. Jurnalnya hanya bisa diubah/dihapus lewat Pencatatan Donasi.
- **Daftar Pencatatan Donasi:** kolom **Nomor**, **Tanggal**, **Donatur**, **Kas/Bank**, **Cara Bayar**, **Kategori Donasi** (nama donasi baris-barisnya, digabung), **Keterangan**, **Nilai**. Filter **Tanggal**, **Cara Bayar**, **Kas/Bank**. No. Cek, Tanggal Cek, Pakai Kredit, dan filter Terima dari tidak dipakai.
- **Ikut selesai bersama fitur ini (dari Donatur):** donatur yang sudah dipakai di Pencatatan Donasi tidak bisa dihapus (pesan menyebut tempatnya); kolom **Total Donasi** di daftar Donatur terisi dari donasi yang tercatat; tab **Riwayat Donasi** di formulir Donatur (lihat Donatur di atas).
- **Ditunda:** Lampiran (bersama H2.11), cetak/PDF kuitansi dan kirim lewat WhatsApp (bersama H2.12 Cetak bukti), donasi barang (dibahas tersendiri).

**Target Donasi** (disetujui 2026-10-29 setelah melihat gambar contoh; di Accurate tidak ada contoh yang dipakai, dirancang bersama pengguna; dibuka dari kotak Target Donasi di popup Donasi). Target = angka tujuan pengumpulan donasi untuk satu **Program** dalam satu rentang tanggal; aplikasi menghitung sendiri berapa yang sudah terkumpul. Target **tidak membuat jurnal** (hanya alat pantau).
- **Formulir** (satu tab):
  - **Nama Target** (wajib), misalnya "Beasiswa 2026" atau "Ramadhan 1447 H".
  - **Program** (wajib, cari/pilih): hanya Program yang masih berjalan (bukan Selesai).
  - **Tanggal Mulai** dan **Tanggal Selesai** (wajib; Selesai tidak boleh sebelum Mulai). Bisa untuk kampanye singkat atau setahun penuh.
  - **Nilai Target** (wajib, lebih dari 0; titik ribuan otomatis).
  - **Catatan** (tidak wajib).
  - Satu Program boleh punya beberapa target, termasuk yang tanggalnya bertumpuk (misalnya target tahunan dan target Ramadhan); masing-masing dihitung sendiri.
- **Cara menghitung Terkumpul:** jumlah **nilai baris rincian** Pencatatan Donasi yang Program-nya sama dengan Program target dan tanggal donasinya di antara Tanggal Mulai dan Tanggal Selesai (keduanya ikut). Yang dihitung per baris, bukan total donasi, karena satu donasi bisa berisi beberapa baris dengan Program berbeda. Dihitung ulang setiap kali daftar dibuka, jadi donasi yang diubah atau dihapus langsung ikut.
- **Daftar Target Donasi:** kolom **Nama Target**, **Program**, **Periode** (misalnya "1 Jan 2026 - 31 Des 2026"), **Status**, **Target**, **Terkumpul**, **Sisa**, dan **Capaian** (bar dan persen). Filter **Program** dan **Status**.
  - Pilihan **Tampilkan** (permintaan pengguna 2026-10-29): **Yang masih berjalan** (awalnya) atau **Semua**. "Yang masih berjalan" menyembunyikan target yang **Program-nya sudah Selesai** di Master Data **atau** yang **periodenya sudah lewat** (Status Selesai). Data tetap tersimpan; pilih Semua untuk melihatnya.
  - **Status**: Belum Mulai (hari ini sebelum Tanggal Mulai), Berjalan, Selesai (hari ini sesudah Tanggal Selesai).
  - **Capaian berhenti di 100%** (keputusan pengguna 2026-10-29): kalau terkumpul melebihi target, persen dan bar tetap 100% dan Sisa Rp 0. Kolom Terkumpul tetap menampilkan angka sebenarnya, supaya jumlah uang yang tercatat tidak terlihat berkurang. Target yang tercapai ditandai hijau.
- **Ubah dan hapus:** target bisa diubah dan dihapus kapan saja lewat popup konfirmasi (tidak ada jurnal yang ikut terhapus). Tercatat di Log Aktivitas.
- **Program** yang dipakai target tidak bisa dihapus di Master Data (pesan menyebut Target Donasi).
- Kartu ringkas di Dashboard tidak dibuat sekarang.

**Pemindahan Dana** (rancangan 2026-10-30: dua arah lewat Dana Umum, menggantikan rancangan sebelumnya; disetujui 2026-10-30 setelah melihat gambar contoh; di Accurate tidak ada contoh, dirancang bersama pengguna; dibuka dari kotak Pemindahan Dana di popup Donasi). Memindah **kepemilikan dana sekaligus uangnya** antar "kantong" dana, dalam dua arah (keputusan pengguna 2026-10-30):
- **① Sisa Program → Dana Umum**: sisa dana Program yang selesai dikumpulkan di Dana Umum.
- **② Dana Umum → Divisi**: Dana Umum diberikan ke Divisi yang membutuhkan; sejak itu dana itu milik Divisi tersebut (tanpa Program).
- **Kantong dana** dibedakan lewat baris jurnal (dipakai juga untuk laporan nanti):
  - **Dana Program** = akun **Aset Neto Terikat** bertanda Program (dan Divisi Program itu).
  - **Dana Divisi** = akun **Aset Neto Tidak Terikat** bertanda Divisi, tanpa Program.
  - **Dana Umum** = akun **Aset Neto Tidak Terikat** (dari Preferensi) **tanpa Divisi dan tanpa Program**: milik yayasan, tidak termasuk Divisi mana pun.
- **Transfer Bank** hanya memindah uang tanpa mengubah kepemilikan (misalnya Kas Divisi Pendidikan → Bank Divisi Pendidikan). Memberi Dana Umum ke Divisi **harus lewat Pemindahan Dana**, supaya keluar dan masuknya terlihat di laporan.
- **Kas Dana Umum**: akun Kas/Bank biasa yang dibuat pengguna (misalnya "Kas Kecil Dana Umum") untuk menampung sisa dana; dipilih di kolom tujuan (arah ①) atau di Ambil dari (arah ②).
- **Formulir:**
  - **Jenis Pemindahan** (wajib, paling atas): "Sisa Program → Dana Umum" atau "Dana Umum → Divisi". Isian di bawahnya menyesuaikan.
  - Bagian atas kiri, berurutan: **Dari** (arah ①: pilih Program, Aktif maupun Selesai; arah ②: tertulis "Dana Umum") dengan **Sisa dana** kantong asal per tanggal di bawahnya; **Ambil dari** (Kas/Bank, wajib): rekening tempat uangnya sekarang; **Nilai Pemindahan** (hanya dibaca; muncul setelah nominal diisi di popup tujuan).
  - Bagian atas kanan: **No Bukti** (otomatis atau diketik, aturan bertipe Pemindahan Dana; tidak boleh kembar), **Tanggal** (wajib, aturan Pembatasan tanggal berlaku).
  - Tab **Tujuan**: kolom **Cari/Pilih tujuan** berisi pilihan **Kas/Bank**. Memilihnya membuka **popup Tujuan Pemindahan**: **Ke** (arah ①: "Dana Umum", hanya dibaca; arah ②: pilih **Divisi**, wajib), **Kas/Bank** (hanya dibaca), **Nilai** (wajib, > 0) dengan tombol **Semua sisa**, tombol **Lanjut**. Hasilnya satu baris **Ke – Kas/Bank – Nilai**; klik untuk mengubah, ✕ untuk menghapus. Hanya satu tujuan.
  - Tab kecil **"i" Info lainnya**: **Alasan** (wajib); kalau kosong saat Simpan, tab itu terbuka sendiri. **Lampiran** menyusul bersama H2.11.
  - **Total** = Nilai Pemindahan. Tampilan rapi: label sejajar dan sama lebar, kolom isian sama lebar.
  - **Pengaman urutan isian** (permintaan pengguna 2026-10-30; aturan umum di 5.1): kolom Cari/Pilih tujuan dan popup Tujuan Pemindahan **tidak bisa dibuka** sebelum (arah ①) Dari Program, Ambil dari, dan Tanggal terisi; termasuk saat baris tujuan diklik.
- **Pengaman:** Nilai tidak boleh melebihi **sisa yang bisa dipindah** dari kantong asal (sisa Program, atau sisa Dana Umum). Sisa yang bisa dipindah = **sisa terendah mulai tanggal pemindahan sampai tanggal terakhir yang tercatat**, bukan hanya sisa per tanggal pemindahan. Dengan begitu uang yang sama tidak bisa dipindah dua kali lewat pemindahan bertanggal lebih awal (Temuan 28). Kalau melebihi, **ditolak** lewat notifikasi pojok kanan atas yang menyebut sisa yang bisa dipindah. Kotak sisa di formulir dan tombol "Semua sisa" memakai angka yang sama. Saat mengubah, pemindahan itu sendiri tidak ikut mengurangi sisa.
- **Sisa dana Program** (6.0): jumlah (Kredit − Debit) baris bertanda Program itu pada akun pendapatan, pendapatan lain, beban, beban lain, dan modal/aset neto, sampai tanggal tertentu. **Sisa Dana Umum**: jumlah (Kredit − Debit) baris akun Aset Neto Tidak Terikat (Preferensi) yang tanpa Divisi dan tanpa Program.
- **Jurnal otomatis** (4.2), satu jurnal:
  - Arah ①: **Debit Aset Neto Terikat** [Program asal, Divisi Program itu] / **Kredit Aset Neto Tidak Terikat** [tanpa Divisi, tanpa Program].
  - Arah ②: **Debit Aset Neto Tidak Terikat** [tanpa Divisi, tanpa Program] / **Kredit Aset Neto Tidak Terikat** [Divisi tujuan, tanpa Program].
  - Uang (kedua arah): **Debit Kas/Bank tujuan** / **Kredit Kas/Bank asal**, tanpa Program dan Divisi (seperti Transfer Bank); tidak dibuat kalau keduanya sama.
  - Tampil di Histori Bank dan Rekonsiliasi Bank seperti transaksi Kas/Bank lain; hanya bisa diubah/dihapus lewat Pemindahan Dana.
  - Akun **Aset Neto Terikat** dan **Tidak Terikat** dipilih sekali di **Preferensi > Akun Perkiraan > Aset Neto** (akun Modal tanpa sub akun). Kalau belum dipilih, Pemindahan Dana tidak bisa disimpan dan pesannya menunjuk ke Preferensi.
- **Daftar Pemindahan Dana:** kolom **No Bukti**, **Tanggal**, **Jenis**, **Dari** (nama Program atau "Dana Umum"), **Ke** ("Dana Umum" atau nama Divisi), **Dari Kas/Bank**, **Ke Kas/Bank**, **Alasan**, **Nilai**. Filter **Tanggal** (per bulan) dan **Jenis**.
- **Ubah dan hapus** seperti transaksi lain: tanggal terkunci tidak bisa, yang sudah direkonsiliasi tidak bisa sebelum tandanya dibatalkan, Log Aktivitas mencatat, jurnal ikut dibuat ulang/dihapus.
- **Laporan** (bentuknya dibahas di bagian Laporan): dengan pencatatan di atas, laporan bisa menampilkan Laporan Dana Umum (diterima dari sisa Program …, diberikan ke Divisi …, saldo), laporan Divisi ("Diterima dari Dana Umum"), dan laporan Program ("Dialihkan ke Dana Umum", bukan beban).

### 6.2 Pencatatan Gaji dan slip gaji — Disetujui 2026-10-25

**Komponen gaji** (Preferensi > Gaji):
- Daftar komponen **Pendapatan** dan **Potongan** bisa ditambah, diubah namanya, diurutkan, dan dinonaktifkan sendiri.
- Bawaan awal: Pendapatan = Gaji Pokok, Tunjangan Jabatan, Tunjangan Makan, Tunjangan Transportasi. Potongan = Pengurangan Gaji, Iuran Bulanan.
- Komponen yang sudah dipakai Pencatatan Gaji tidak bisa dihapus, hanya dinonaktifkan. Slip lama tetap menampilkan nama komponen saat itu.
- **Tipe Pembayaran:** Bulanan, THR, Bonus/insentif, ditambah tipe lain yang bisa ditambah sendiri di Preferensi > Gaji.
- Setiap komponen ditandai **dipakai di tipe mana**. Contohnya Gaji Pokok dan tunjangan untuk Bulanan, sedangkan komponen "THR" hanya untuk THR (nilai bawaan = Gaji Pokok karyawan, bisa diubah). Rincian karyawan hanya menampilkan komponen milik tipe yang dipilih.
- Halaman master **Gaji/Tunjangan lama dihapus** (bagian 2.2); perannya digantikan daftar komponen ini.

**Gaji tetap di data Karyawan:**
- Master Karyawan mendapat tab **Gaji** berisi nilai tetap tiap komponen (misalnya Gaji Pokok Rp 2.500.000).
- Saat karyawan dimasukkan ke Pencatatan Gaji, nilai ini **terisi otomatis** dan masih bisa diubah untuk bulan itu saja.

**Formulir Pencatatan Gaji** (tanpa jurnal, lihat 3.3 dan 4.2):
- Isian atas: **Tipe Pembayaran**, Nomor (otomatis, tipe Pencatatan Gaji), Tanggal, Periode (bulan dan tahun), Jatuh Tempo, Lampiran.
- Tab **Info lainnya**: **Akun Beban Gaji** (wajib; hanya akun bertipe Beban/Beban Lainnya tanpa sub akun dan tidak Non Aktif; Data Baru mengikuti pencatatan terakhir) dan Catatan. Akun ini **tidak** membuat jurnal saat pencatatan disimpan; akun ini dipakai sebagai akun baris saat gaji dibayar lewat Pembayaran. (Di Accurate tempat yang sama berisi akun Utang, karena Accurate memakai skema dua langkah; di skema A yang dipilih adalah akun Beban.)
- Rincian: cari/pilih karyawan → popup Rincian Karyawan berisi nilai tiap komponen (terisi dari data Karyawan) dan Catatan. **Gaji dibayarkan = jumlah pendapatan − jumlah potongan.**
- Satu karyawan hanya boleh muncul sekali per pencatatan, dan **sekali per periode per tipe**. Contohnya, Bulanan Oktober dan THR Oktober boleh dibuat terpisah dan dibayar di waktu berbeda, tetapi dua kali Bulanan Oktober ditolak.
- **Status:** Belum dibayar / Sebagian / Lunas, dihitung dari baris Pembayaran yang tertaut. Ditampilkan di formulir dan di daftar.
- Tombol **Proses** aktif begitu Rincian Karyawan berisi minimal satu karyawan; **tidak perlu disimpan dulu**. Proses tidak aktif kalau rincian kosong atau gaji sudah Lunas.
- **Proses → Gaji** menyimpan pencatatan secara otomatis lebih dulu, dengan pemeriksaan yang sama dengan tombol Simpan. Kalau ada kesalahan, pesannya muncul dan Proses dibatalkan. Kalau berhasil, aplikasi **langsung pindah ke halaman Pembayaran** (seperti foto Accurate):
  - Pembayaran baru: **Kas/Bank kosong** (dipilih sendiri), **Tanggal hari ini**, **No Bukti otomatis**;
  - satu baris rincian: **akun Beban Gaji dari pencatatan**, nilai = **sisa gaji yang belum dibayar**, tertaut ke pencatatan itu (kolom Pencatatan Gaji di Info lainnya popup baris);
  - Divisi dan Program dipilih di Info lainnya popup baris; nilainya boleh diubah (bayar sebagian per Kas/Bank Divisi).
- Daftar: nomor, tanggal, periode, jumlah karyawan, total dibayarkan, status, dengan filter periode dan status.

**Slip gaji** (Desain Cetakan tipe Slip Gaji, satu slip per karyawan):
- Isi: kop yayasan, nama, jabatan, **masa kerja** (dihitung dari Tgl Masuk sampai akhir periode, misalnya "3 tahun 4 bulan"), periode, rincian komponen pendapatan dan potongan, gaji dibayarkan, **terbilang**, **tanggal dan status bayar** (tanggal pembayaran dan Kas/Bank, atau "Belum dibayar"), catatan, dan **kolom tanda tangan** bendahara dan karyawan.
- Cara membagikan:
  - **cetak / simpan PDF per karyawan**;
  - **cetak semua slip sekaligus** (berurutan, satu halaman per karyawan);
  - **kirim lewat WhatsApp**: membuka WhatsApp ke nomor karyawan dengan ringkasan slip. File PDF dilampirkan sendiri (tanpa server).

### 6.3 Kas & Bank — Draf (sebagian menunggu foto Accurate)

**Popup menu Kas & Bank** (ikon Kas di menu samping, mengikuti foto Accurate, hanya kotak yang dipakai): Pembayaran,
Penerimaan, Transfer Bank, Histori Bank, Rekonsiliasi Bank. Urutan pengerjaan: Penerimaan, Transfer Bank, Histori Bank,
Rekonsiliasi Bank.

**Pembayaran** (uang keluar dari Kas/Bank, mengikuti Accurate):
- Atas: **Kas/Bank** (wajib, dipilih dulu), Nomor (otomatis, tipe Pembayaran), Tanggal, Lampiran.
- Tab Info lainnya: No Cek, Penerima (teks bebas), Catatan.
- Rincian lewat popup: **Akun**, Untuk Pembayaran (keterangan), **Nilai**. Tab Info lainnya di popup: **Divisi**, **Program**, **Dana: Terikat / Tidak Terikat** (wajib dipilih salah satu, lihat 4.1), Catatan, **Pencatatan Gaji** (hanya untuk baris gaji, lihat 3.3). Tombol Hapus dan Lanjut.
- Isian wajib baris beban mengikuti Preferensi (5.5); pengaman dana Program dan Kas minus mengikuti 5.6.
- Jurnal: Debit akun tiap baris, Kredit Kas/Bank.
- Cetak bukti pembayaran (Desain Cetakan tipe Bukti Pembayaran).
- **Uang muka kegiatan (kasbon):** tidak ada fitur khusus. Uang muka dibayar lewat Pembayaran ke akun Uang Muka, lalu diselesaikan lewat Jurnal Umum (Debit beban, Kredit Uang Muka).

**Penerimaan Kas/Bank** (uang masuk selain donasi; dari foto Accurate 2026-10-25): **kembaran Pembayaran**, arah uangnya terbalik.
- Atas: **Kas/Bank** (wajib, dipilih dulu), Tanggal, No Bukti, Ambil. Tab Info lainnya halaman: No Cek, **Pemberi** (teks bebas), Catatan.
- Popup baris: **Akun**, **Atas Penerimaan** (keterangan), **Nilai**. Tab Info lainnya popup: **Divisi**, **Program**, Catatan. Tab Penangguhan Accurate **tidak dipakai**.
- Jurnal: **Debit Kas/Bank, Kredit akun tiap baris** (dengan Divisi/Program; sisi Kas tanpa Program) (4.2). Pendapatan bertanda Program/Divisi ikut menambah sisa dana, tetapi dilaporkan sebagai pendapatan lain (6.0).
- Pemeriksaan, ubah, hapus, Log: sama dengan Pembayaran (tanpa baris gaji).

**Satu komponen bersama untuk transaksi Kas/Bank:** Pembayaran dan Penerimaan (dan nanti transaksi Kas/Bank yang mirip) memakai satu komponen di `umum/` untuk tampilan, rincian, simpan, dan jurnal. Halaman masing-masing hanya berisi pengaturannya (judul, arah uang, label Penerima/Pemberi, tipe nomor). Perbaikan cukup di satu tempat.

**Daftar Pembayaran dan Penerimaan** (seperti foto Accurate): kolom Nomor, Tanggal, Kas/Bank, No Cek, Keterangan, Nilai; filter Tanggal dan Kas/Bank.

**No Bukti mengikuti Kas/Bank:** di Pengaturan > Penomoran, aturan bertipe Pembayaran/Penerimaan bisa ditautkan ke satu akun Kas/Bank. Saat Kas/Bank dipilih, aturan nomornya **otomatis terpilih**; pengguna tetap bisa **memilih aturan lain** atau **mematikan Otomatis dan mengetik nomor sendiri**. Kas/Bank tanpa aturan tertaut memakai aturan bertipe itu yang pertama.

**Transfer Bank** (dari foto Accurate 2026-10-25): memindah uang antar Kas/Bank **milik yayasan sendiri** (misalnya Bank ke Kas Kecil, atau Kas Divisi A ke Kas Divisi B).
- Atas: Tanggal, Nomor (otomatis, aturan tipe Transfer, atau diketik sendiri).
- Tab **Transfer Uang**: **Dari Kas/Bank**, **Ke Kas/Bank** (keduanya wajib, Kas/Bank tingkat 3, tidak boleh sama), **Nilai Transfer** (wajib, > 0). Total di bawah = nilai transfer.
- Tab **Info lainnya**: Catatan. Tab kedua Accurate (biaya) **tidak dipakai**: biaya admin bank dicatat lewat Pembayaran biasa.
- Jurnal: **Debit Kas/Bank tujuan, Kredit Kas/Bank asal**, tanpa Divisi/Program (4.2). Transfer **hanya memindah uang**: sisa dana Divisi/Program tidak berubah; kalau peruntukannya ikut pindah, catat lewat Pemindahan Dana.
- Daftar: Nomor, Tanggal, Bank (Keluar), Bank (Masuk), Keterangan, Total; filter Tanggal, Dari Kas/Bank, Ke Kas/Bank.
- Ubah, hapus, Log, tanggal terkunci, nomor unik: sama dengan transaksi lain (bagian 5).

**Histori Bank** (dari foto Accurate 2026-10-25): riwayat transaksi satu akun Kas/Bank dengan saldo berjalan.
- Atas: pilih **Kas/Bank** (tingkat 3 saja, aturan 5.1), rentang tanggal **dari s/d sampai** (bawaan: awal bulan ini s/d hari ini), tombol **segarkan** dan **ekspor CSV**.
- Tabel: Tanggal, No. Sumber #, No Cek #, Tipe Transaksi (Pembayaran, Penerimaan, Transfer Bank, Jurnal Umum, ...), Keterangan, **Mutasi** (uang keluar berwarna merah), Tipe (**Dr** = masuk, **Cr** = keluar), **Saldo** berjalan.
- Baris pertama: **Saldo Awal** "Saldo per [sehari sebelum tanggal dari]" = saldo awal akun + semua mutasi sebelum tanggal dari.
- Dihitung dari **buku jurnal** (semua jurnal yang menyentuh akun itu). Cara hitungnya dipakai bersama dengan Histori Akun (Buku Besar) nanti.
- **Klik baris membuka transaksi asalnya** (Pembayaran, Penerimaan, Transfer, atau Jurnal Umum).
- Baris terakhir **Total** (dari foto Accurate 2026-10-26, kalau ada transaksi di rentang itu): Tipe Transaksi dan Keterangan bertulisan "Total", Mutasi = **mutasi bersih** (jumlah Dr dikurangi jumlah Cr) dengan Tipe **Dr** kalau hasilnya bertambah atau **Cr** kalau berkurang (merah). Jadi Saldo Awal + Total = saldo akhir. Ikut diekspor ke CSV.
- Kolom terakhir **#** (dari foto Accurate 2026-10-26): **ceklis hijau** untuk transaksi yang sudah direkonsiliasi di akun ini. Klik ceklis: konfirmasi "Data sudah dicocokkan dengan Rekening Koran. Apakah data ini tidak cocok dengan rekening koran?" (Ya/Batal). **Ya** = tanda cocoknya dibatalkan (sama dengan Batalkan di Rekonsiliasi Bank), ceklis hilang, dan transaksinya bisa diubah atau dihapus lagi.

**Rekonsiliasi Bank** (dari foto Accurate 2026-10-26; menggantikan rancangan lama "isi saldo rekening koran lalu hitung selisih"). Transaksi yang sudah dicatat di aplikasi dicocokkan satu per satu dengan rekening koran yang dilihat sendiri; tanpa impor file.
- Atas: pilih **Kas/Bank** (tingkat 3), rentang tanggal **dari s/d sampai**, tombol segarkan.
- Kiri, **Catatan Aplikasi**: **Saldo Rp ...** (saldo akun per tanggal sampai), dan peringatan "**N data belum cocok**". Setiap transaksi Kas/Bank itu (dari buku jurnal, cara hitung yang sama dengan Histori Bank) tampil sebagai kartu: tanggal, tipe transaksi dan akun lawannya, keterangan, nomor, nilai **(Dr)** atau **(Cr)**.
- Kanan, **Rekening Bank**: tombol **"Ada di Rekening Koran"** di samping setiap kartu.
- Klik tombol: konfirmasi "Apakah transaksi ini ada tercetak dalam rekening koran?" (Ya/Batal). Konfirmasi hanya muncul **sekali setiap halaman dibuka**; klik berikutnya langsung ditandai.
- Yang sudah ditandai cocok **hilang dari daftar**. Pilihan "Tampilkan yang sudah cocok" menampilkannya beserta tombol **Batalkan** (unceklis).
- **Tidak ada data** (dari foto Accurate 2026-10-26): kalau tidak ada transaksi yang perlu dicocokkan (semua sudah cocok, atau rentang itu tanpa transaksi), judul kedua kolom tetap tampil dengan "**Saldo Rp ...**", dan di tengah halaman muncul gambar map dengan kaca pembesar serta tulisan "**Tidak ada data mutasi kas/bank yang tersedia**".
- **Transaksi yang sudah direkonsiliasi tidak bisa diubah atau dihapus** (Pembayaran, Penerimaan, Transfer, Jurnal Umum) sebelum tanda cocoknya dibatalkan, lewat tombol Batalkan di Rekonsiliasi Bank atau klik ceklis di Histori Bank. Pesannya menyebut hal itu.
- Tanda cocok disimpan per jurnal dan akun Kas/Bank, ikut Cadangan Data. Selisih (misalnya biaya admin atau bunga bank) dicatat lewat Pembayaran atau Penerimaan biasa.

**Histori Bank, tambahan dari foto Histori Akun Accurate 2026-10-26** (berlaku juga untuk Histori Akun di 6.4):
- **Tombol ⇄** di kanan atas mengganti tampilan tabel:
  - Tampilan **Mutasi** (bawaan): kolom Mutasi (Cr merah) dan Tipe (Dr/Cr), seperti sekarang.
  - Tampilan **Debit/Kredit**: kolom Mutasi dan Tipe diganti kolom **Debit** dan **Kredit**; yang tidak terisi ditulis **0**.
  - Tampilan terakhir yang dipilih diingat oleh browser.
- **Saldo Awal** tampil juga di kolom **Mutasi** (tampilan Mutasi). Di tampilan Debit/Kredit, kolom Debit dan Kredit baris Saldo Awal kosong, angkanya hanya di kolom Saldo.
- **Total** di tampilan Debit/Kredit: **jumlah Debit** dan **jumlah Kredit** rentang itu. Di tampilan Mutasi tetap mutasi bersih Dr/Cr.
- Ekspor CSV mengikuti tampilan yang sedang dipilih.

### 6.4 Buku Besar — Histori Akun disetujui 2026-10-26 (fitur Buku Besar lain belum dibahas)

**Histori Akun** (dari foto Accurate 2026-10-26; menu Buku Besar > Histori Akun): riwayat transaksi satu akun dengan saldo berjalan.
- Bentuk dan cara kerja **sama dengan Histori Bank** (6.3), termasuk Saldo Awal, baris Total, tombol ⇄ Mutasi/Debit-Kredit, klik baris membuka transaksi asal, dan ekspor CSV. Halaman dan cara hitungnya dipakai bersama, tidak ditulis dua kali.
- Pilihan akun: **hanya akun Kas & Bank tingkat 3** (aturan 5.1, sama dengan Histori Bank).
- Bedanya dengan Histori Bank: **tanpa kolom No Cek** dan **tanpa kolom #** (ceklis rekonsiliasi).
- Tabel: Tanggal, No. Sumber #, Tipe Transaksi, Keterangan, Mutasi + Tipe (atau Debit + Kredit), Saldo.

**Log Aktifitas Jurnal** (dari foto Accurate 2026-11-06; dibuka dari kotak Log Aktifitas Jurnal di popup Buku Besar): daftar semua
jurnal, baik Jurnal Umum maupun jurnal otomatis, hanya untuk dilihat. Kolom: Tanggal, Nomor #, No. Trans #, Tipe Transaksi (Jurnal
Umum, Pembayaran, Penerimaan, Transfer Bank, Pencatatan Donasi, Pemindahan Dana). Urutan awal: tanggal terbaru di atas. Atas: tombol
Segarkan, tombol roda gigi untuk memilih kolom yang tampil (sementara, tidak disimpan, minimal satu kolom), kolom Cari, dan jumlah
data. Klik baris membuka transaksi asalnya.

**Nomor jurnal** (permintaan pengguna 2026-11-06, seperti foto Log Aktifitas Jurnal Accurate): setiap jurnal, manual maupun otomatis,
punya nomor sendiri berbentuk **JV.2026.11.00081** yang tampil di kolom Nomor #. No. Trans # tetap nomor transaksinya. Satu deret per
bulan menurut tanggal jurnal, urut menurut waktu input, jadi tanggal lebih awal bisa bernomor lebih besar, seperti foto. Nomor dibuat
otomatis, tidak bisa diketik, dan tidak berubah saat transaksi diubah, termasuk kalau tanggalnya pindah bulan. Nomor jurnal yang dihapus
tidak dipakai lagi, supaya loncatan nomor terlihat saat audit. Jurnal lama diberi nomor sekali, urut menurut tanggal lalu waktu dibuat.

### 6.5 Anggaran — Draf (keputusan pengguna 2026-11-06: mengikuti Accurate)
Pengguna belum pernah memakai anggaran, tetapi akan memakainya nanti, jadi sistemnya mengikuti Accurate, bukan rancangan
sendiri. Anggaran hanya rencana: tidak membuat jurnal dan tidak mengubah saldo (4.3). Realisasi diambil dari jurnal.
- **Anggaran** (dari foto Anggaran Accurate pengguna 2026-11-06 dan gambar panduan Accurate Online): satu formulir untuk **satu
  bulan**; isian Bulan dan Tahun, Tipe (Umum, Per Divisi = Departemen, Per Program = Proyek) dan kolom pilihan Divisi/Program
  yang muncul sesuai Tipe; kolom cari akun Pendapatan, Pendapatan Lainnya, Beban, Beban Lainnya (akun paling bawah, tidak Non
  Aktif); popup berisi Beban/Pendapatan dan nilai Anggaran, tombol Lanjut; rincian Beban/Pendapatan, Kode #, Anggaran, dan
  Total; tab samping Rincian Anggaran dan Info lainnya (Catatan, Penganalisa). Tombol Simpan dan Hapus. Daftar: Periode, Tipe,
  Divisi/Program, Catatan, Total. Aturan: Tahun wajib, minimal satu akun, nilai lebih dari 0, satu akun sekali dalam satu
  formulir; bulan, tahun, tipe, dan Divisi/Program yang sama hanya boleh satu formulir, supaya rencana tidak terhitung dua
  kali. Akun, Divisi, dan Program yang sudah dipakai Anggaran tidak bisa dihapus. Tombol Ambil menyusul (menurut panduan
  Accurate: mengambil Anggaran Favorit atau impor dari file Excel); tombol Dokumen dan Lainnya di foto belum dipakai.
- **Monitor Anggaran** (dari foto Accurate 2026-11-06; hanya dilihat, tanpa formulir): baris atas Tipe, Bulan, Tahun, cari Akun,
  cari Divisi/Program (mengikuti Tipe; tidak dipakai untuk Umum; kosong = semua Divisi/Program tipe itu dijumlah), tombol Muat
  Ulang. Tabel: Nama Akun, Kode #, Anggaran, Penggunaan Anggaran, Sisa Anggaran; kosong = "Belum ada data".
  - Anggaran = nilai di formulir Anggaran + Transfer Anggaran masuk - Transfer Anggaran keluar.
  - Penggunaan = dari jurnal bulan itu. Akun beban: debit - kredit. Akun pendapatan: kredit - debit.
  - Tipe Umum menghitung **semua jurnal** akun itu (keputusan pengguna). Per Divisi dan Per Program hanya jurnal Divisi atau
    Program itu.
  - Sisa = Anggaran - Penggunaan; nilai minus ditandai merah. Baris yang tampil: akun yang punya anggaran atau transfer.
- **Transfer Anggaran** (dari foto Accurate 2026-11-06): memindahkan rencana, tidak membuat jurnal. Bagian atas: Tahun, Tipe,
  No Transfer (Otomatis lewat Penomoran), Tanggal. Tab samping: rincian dan Info lainnya (Catatan). Daftar: No Transfer, Tanggal,
  Tahun, Tipe, Dari, Ke, Nilai.
  - **Transfer Dari Anggaran**: Divisi/Program (kalau Tipe bukan Umum), Bulan, Anggaran (akun yang punya anggaran di bulan
    itu), Sisa Anggaran (hanya dibaca, angka yang sama dengan Monitor), Nilai Transfer.
  - **Ke Anggaran**: Divisi/Program (boleh berbeda dari asal, keputusan pengguna), Bulan, Anggaran (akun pendapatan atau beban
    mana pun; tidak harus sudah punya anggaran, keputusan pengguna).
  - Nilai Transfer wajib lebih dari 0 dan tidak boleh melebihi Sisa Anggaran: ditolak (keputusan pengguna).
  - Keputusan pengguna 2026-11-06: sistemnya dibuat semirip Accurate. Panduan resmi Accurate (help.accurate.id) hanya menyebut:
    pindah ke akun lain atau periode lain, nilai tersisa ditampilkan, lalu nilai transfer dan bulan tujuan diisi. Hal yang tidak
    tertulis di panduan dan foto memakai pilihan paling aman, dan bisa diubah setelah dicoba: asal dan tujuan yang sama persis
    ditolak; formulir Anggaran yang akunnya sudah menjadi asal Transfer tidak bisa dihapus dan akun itu tidak bisa dibuang dari
    rinciannya sampai Transfer dihapus. Pembatasan pendapatan hanya ke pendapatan tidak dipakai, karena tidak ada di Accurate.
- Usulan satu formulir setahun, bagi rata, dan pengaman melebihi anggaran tidak dipakai. Gambar contoh laporan Anggaran dan
  Realisasi hanya bahan pertimbangan; bentuk akhirnya mengikuti foto Monitor Anggaran.

### 6.6 Aset Tetap — Draf (keputusan pengguna 2026-11-06: versi sederhana dari foto Accurate)
Aset tetap milik yayasan, jadi jurnal penyusutannya tanpa Divisi dan Program. Ikon sendiri di menu samping, popup berisi Aset Tetap,
Kategori Aset, Proses Penyusutan, dan Lepas Aset.
- **Kategori Aset:** Nama, Akun Aset, Akun Akumulasi Penyusutan, Akun Beban Penyusutan, Umur Aset (tahun), Tidak disusutkan. Akun dan
  umur diisi sekali di sini, jadi formulir aset cukup memilih kategori. Kategori yang sudah dipakai tidak bisa dihapus.
- **Aset Tetap:** Nama, Kode Aset (otomatis AT-00001), Tanggal Beli, Tanggal Pakai, Kategori, Nilai Aset, Umur Aset, Nilai Sisa, Tidak
  disusutkan, Sudah disusutkan (aset lama), Lokasi, Catatan. Di bawah: Penyusutan per Bulan, Nilai Aset, Nilai Buku.
  **Formulir ini tidak membuat jurnal**: pembelian tetap dicatat sekali lewat Pembayaran atau Jurnal Umum ke akun aset, supaya tidak dobel.
  Daftar: Kode, Nama, Kategori, Lokasi, Nilai Aset, Sudah Disusutkan, Nilai Buku, Status (Aktif, Tidak disusutkan, Habis disusutkan, Dilepas).
- **Cek kecocokan** di atas daftar: jumlah Nilai Aset yang belum dilepas dibanding saldo akun aset di semua kategori.
- Aset yang sudah disusutkan atau dilepas tidak bisa dihapus, dan nilai, umur, nilai sisa, kategori, serta tanggal pakainya dikunci.
- **Proses Penyusutan:** garis lurus, per bulan = (Nilai Aset - Nilai Sisa) dibagi umur, dibulatkan ke atas, dan berhenti saat habis.
  Satu proses = satu bulan = satu jurnal per akhir bulan: Debit Beban Penyusutan, Kredit Akumulasi Penyusutan. Mulai bulan Tanggal Pakai,
  tanpa mengejar bulan yang terlewat. Proses pertama boleh memilih bulan; sesudahnya harus bulan berikutnya, dan tidak boleh melewati
  bulan ini. Membatalkan = menghapus proses bulan terakhir, jurnalnya ikut hilang; tidak bisa kalau asetnya sudah dilepas.
- **Lepas Aset:** Aset, Tanggal, Alasan (Dijual, Rusak, Hilang, Dihibahkan), Nilai Jual dan Kas/Bank kalau dijual, Akun Untung/Rugi, Catatan.
  Jurnal: Debit Akumulasi, Debit Kas/Bank, Kredit Aset; selisih dengan Nilai Buku masuk Akun Untung/Rugi. Sesudah dilepas, penyusutan berhenti
  dan datanya tetap tersimpan. Tanggal tidak boleh sebelum bulan penyusutan terakhir aset itu. Membatalkan = menghapus data Lepas Aset.
- **Belum termasuk:** Pindah Aset, Perubahan Aset Tetap, aset dari donasi (bersama donasi barang), Kategori Aset Tetap Pajak.

### 6.12 Masuk, Keluar, dan hak akses (keputusan pengguna 2026-11-09; layar Masuk = login.html yang sudah ada)
- **Layar Masuk** memakai login.html yang sudah ada (panel biru, Nama pengguna, Kata sandi, tombol mata, peringatan Caps Lock).
  Belum masuk atau sesi habis: aplikasi langsung pindah ke layar Masuk.
- **Pertama kali** (belum ada pengguna sama sekali): layar Masuk berganti menjadi "Buat akun Finance Yayasan pertama"
  (Nama lengkap, Nama pengguna, Kata sandi minimal 8 karakter, Ulangi kata sandi). Sesudah dibuat langsung masuk.
- **Masuk:** nama pengguna tidak membedakan huruf besar/kecil. Salah = "Nama pengguna atau kata sandi salah." (tidak menyebut yang mana).
  Akun Non Aktif ditolak. Lima kali salah berturut-turut = tunggu 1 menit.
- **Wajib ganti kata sandi** sesudah akun dibuat atau diatur ulang oleh Finance Yayasan (Pengaturan, Pengguna): sesudah masuk muncul
  formulir Ganti Kata Sandi (baru minimal 8 karakter, diulang, tidak boleh sama dengan yang lama) sebelum bisa membuka aplikasi.
  "Lupa kata sandi?" = petunjuk meminta Finance Yayasan mengatur ulang.
- **Keluar:** klik lingkaran inisial di kanan atas -> menu berisi nama, peran, Ganti Kata Sandi, dan Keluar. Masuk dan Keluar tercatat di Log Aktivitas.
- **Keluar otomatis:** tidak ada aktivitas (mouse, keyboard, sentuh, gulir) selama **40 menit** = langsung keluar tanpa peringatan; isian yang
  belum disimpan hilang. Layar Masuk menulis alasannya. Berlaku juga kalau komputer tidur lebih dari 40 menit.
- Sesi berlaku per jendela/tab browser; menutup browser = keluar.
- **Nama di Log Aktivitas** = nama lengkap pengguna yang sedang masuk.
- **Hak akses (5.8):** Pengawas hanya melihat (tombol Data Baru, Simpan, Hapus, Ambil, Lainnya, Proses, lampiran tambah/hapus, Simpan Laporan
  tidak tampil; penyimpanan juga ditolak di satu tempat sebagai pengaman kedua). Pengguna, Preferensi, dan Cadangan Data hanya untuk Finance Yayasan.
  Pilihan pembukuan di bilah atas hanya yang diizinkan peran.
- **Pengaman akun:** akun yang sedang dipakai tidak bisa dihapus atau dijadikan Non Aktif oleh dirinya sendiri; harus selalu ada minimal satu
  Finance Yayasan yang aktif.
- **Batasan (jujur, sampai tahap server):** data masih tersimpan di browser komputer itu, jadi login ini kunci layar dan pencatat siapa yang
  bekerja, bukan pengaman penuh. Data belum dipisah per pembukuan (Temuan 48), jadi pembatasan pembukuan baru membatasi pilihannya.

### 6.11 Pintasan keyboard (keputusan pengguna 2026-11-09; tidak ada foto Accurate, dirancang bersama)
- **Ctrl+S** Simpan formulir yang tampil. **Alt+N** Data Baru. **Alt+D** pindah Daftar/Formulir (tombol hijau). **Alt+W** tutup tab kecil yang aktif
  (dengan peringatan kalau ada perubahan). **Ctrl+P** Cetak lewat Halaman Cetak aplikasi (formulir transaksi, laporan), bukan cetak bawaan browser.
  **Alt+L** popup Lampiran. **Esc** tutup popup. **F1** daftar semua pintasan (juga lewat ikon ? di bilah atas).
- Tidak ada pintasan Hapus, supaya tidak ada data terhapus tidak sengaja.
- Ctrl+N, Ctrl+T, Ctrl+W dikunci browser, jadi fungsi serupa memakai Alt.
- Saat popup atau Halaman Cetak terbuka, pintasan tidak bekerja (kecuali Esc), supaya tidak menyimpan dari balik popup.
- Tombol yang tidak ada atau tidak aktif di halaman itu: pintasan tidak melakukan apa-apa.

### 6.10 Tab Dokumen di semua formulir (dari foto Accurate, disetujui pengguna 2026-11-08, Temuan 43)
- **Tab kecil per data:** di samping tombol hijau Daftar ada tab kecil. Data Baru satu tab; setiap data yang dibuka dari daftar mendapat **tab sendiri**
  berjudul nomor atau namanya, tidak mengganti tab lain. Membuka 5 data = 5 tab. Berlaku untuk semua halaman berformulir.
- **Data yang sama dibuka lagi:** pindah ke tab yang sudah terbuka, tidak membuat tab ganda.
- **Pindah tab:** perubahan yang belum disimpan **tetap ada di tabnya**, termasuk baris rincian, sampai disimpan atau tabnya ditutup. Perubahan hilang kalau halaman browser dimuat ulang.
- **Tombol x di tiap tab:** kalau isi tab sudah diubah, muncul peringatan "Perubahan yang Anda lakukan akan dibatalkan, lanjutkan?" dengan Ya dan Batal.
  Tanpa perubahan, tab langsung tertutup. Tab terakhir ditutup = kembali ke Daftar.
- **Sesudah Simpan:** tab Data Baru kembali kosong untuk input berikutnya; tab data lama tetap terbuka dengan isi terbaru dan judulnya mengikuti nomor. Sesudah Hapus, tab data itu tertutup.
- **Batas:** paling banyak 10 tab per halaman, termasuk Data Baru. Tab ke-11 ditolak dengan pesan untuk menutup tab lain dulu.
- **Isian di luar kolom biasa ikut diingat** (J.19): baris rincian, lampiran, susunan komponen Penomoran, pilihan Jenis dan baris Tujuan Pemindahan Dana.
- **Fitur yang mengisi Data Baru dari luar** (Ambil favorit, Proses > Gaji): kalau tab Data Baru masih berisi isian yang belum disimpan, ditanya dulu
  dengan peringatan yang sama seperti tombol x; Batal = tidak terjadi apa-apa.
- **Tambah ke Favorit** memakai data tersimpan; kalau tab itu masih punya perubahan yang belum disimpan, ditolak dengan pesan "Simpan dulu".
  **Cetak** dari tab yang berubah menyimpan dulu, lalu mencetak data tab itu (6.9).

### 6.9 Cetak Bukti — Draf (rancangan sendiri dari gambar contoh, keputusan pengguna 2026-11-07)
- **Dokumen:** Tanda Terima Donasi (nama ini menggantikan Kuitansi Donasi), Bukti Pembayaran, Bukti Penerimaan, Bukti Transfer, Bukti Jurnal. Slip gaji menyusul.
- **Desain bawaan:** satu per dokumen, gaya kertas laporan aplikasi, A5 mendatar; Tanda Terima Donasi seukuran slip gaji, 210 x 99 mm atau sepertiga A4 (keputusan pengguna 2026-11-07). Kop dari Preferensi Data termasuk logo; judul; nomor; tanggal; rincian; Terbilang;
  tanda tangan; kaki berisi waktu cetak, pengguna, dan nomor jurnal JV. Tanda Terima Donasi: Telah terima dari, ID Donatur, Cara Bayar, Jumlah donasi besar, rincian Kategori
  dan Program, ucapan terima kasih, tanda tangan Penerima. Bukti lain: tanda tangan Dibuat, Diperiksa, Disetujui, Penerima (Bukti Jurnal tanpa Penerima).
- **Bisa diedit lewat Desain Cetakan:** semua elemen, termasuk elemen baru **Tabel Rincian** yang barisnya mengikuti transaksi; kolom tabel tetap menurut dokumen, ukuran dan
  posisinya bisa diatur. Kalau baris lebih banyak dari ruang yang disediakan, elemen di bawah tabel turun mengikuti, dan dokumen berlanjut ke halaman berikutnya.
- **Mencetak:** ada dua cara menyimpan, tombol Simpan dan tombol Cetak (keputusan pengguna 2026-11-07). Cetak pada Data Baru atau transaksi yang diubah menyimpan dulu lewat pemeriksaan yang
  sama, lalu mencetak; kalau ditolak, tidak ada yang dicetak. Transaksi tersimpan yang tidak diubah langsung dicetak tanpa disimpan ulang. Kalau satu dokumen punya lebih dari satu desain, muncul pilihan desain. Desain bawaan otomatis dibuat
  saat pertama dipakai dan bisa diubah. Mencetak tidak mengubah data; tercatat di Log Aktivitas.
- **Halaman Cetak (dari foto Accurate, disetujui pengguna 2026-11-07):** menggantikan jendela cetak browser yang langsung terbuka, supaya hasilnya sama di semua browser. Klik Cetak di kelima dokumen langsung
  pindah ke halaman penuh: PDF sungguhan di kiri, tombol **Cetak**, **Unduh PDF**, dan **Tutup** di kanan. Unduh XLS dan e-Materai tidak dibuat. Tutup kembali ke formulir. PDF dibuat di aplikasi tanpa
  pustaka luar dan tanpa internet, mengikuti Desain Cetakan: ukuran kertas, posisi elemen, logo, dan Tabel Rincian. Terbilang, tanda tangan, dan kaki naik atau turun mengikuti jumlah baris, jadi tidak ada ruang kosong di tengah; baris yang tidak muat berlanjut ke halaman PDF berikutnya. Yayasan tanpa logo: tempat logo dikosongkan. Huruf memakai Helvetica, yang setara Arial
  di desain; huruf di luar abjad Latin, misalnya Arab, belum bisa tampil dan ditulis "?". Tombol Cetak langsung membuka jendela cetak di Firefox. Chrome dan Edge tidak mengizinkan halaman memulai cetak PDF, jadi tombol itu menyorot petunjuk untuk memakai ikon printer di pojok kanan atas dokumen.
  Desain Tanda Terima bawaan yang belum diedit, A4 maupun A5, pindah ke Slip sekali per browser. Desain tersimpan terpisah di tiap browser; untuk memindahkannya, pakai Cadangan Data. Berlaku untuk semua printer (permintaan pengguna 2026-11-07): aplikasi tidak memakai pengaturan khusus printer tertentu, dan ukuran di PDF tetap sama. Kertas yang dipakai mengikuti printer masing-masing, jadi slip di kertas A4 tetap perlu digunting. Tulisan browser tidak ikut tercetak.
  Keamanan halaman dilonggarkan satu hal saja: bingkai boleh menampilkan PDF dari aplikasi sendiri (frame-src blob:), disetujui pengguna.
- **Cetak laporan dan daftar sebagai PDF (disetujui pengguna 2026-11-08, Temuan 41):** tombol Cetak di semua laporan dan semua halaman daftar membuka Halaman Cetak yang sama dengan bukti, berisi PDF, tanpa tulisan browser.
  Laporan mengikuti kertas di layar dan jendela Modifikasi: ukuran kertas, orientasi, margin, tinggi fleksibel, dan kolom yang tampil; kepala laporan, tebal baris, garis jumlah, dan catatan tetap ada. Judul kolom diulang di tiap halaman, dan setiap halaman punya kaki "Dicetak ..." serta "Halaman x dari y".
  Daftar memuat semua baris hasil filter, A4 tegak, atau mendatar kalau kolomnya lebih dari 5. Menu Unduh PDF di laporan langsung mengunduh berkas, tanpa jendela browser. Unduh Excel dan CSV tidak berubah. Huruf memakai Helvetica, jadi tampilannya sedikit berbeda dari huruf di layar.
- **Terbilang:** rupiah bulat dalam bahasa Indonesia, sampai triliun.
- **Belum termasuk:** slip gaji, kirim lewat WhatsApp.

### 6.8 Transaksi Favorit — Draf (dari foto Accurate 2026-11-07, jawaban pengguna)
Favorit = templat dari transaksi yang sudah tersimpan, supaya transaksi rutin tidak diketik ulang. Tanpa jadwal; Transaksi Berulang tidak dibuat dulu.
- **Berlaku di:** Pembayaran, Penerimaan, Jurnal Umum, Pencatatan Donasi.
- **Menyimpan:** buka transaksi tersimpan, tombol Lainnya > Tambah ke Favorit, isi Nama Favorit (wajib, tidak boleh sama dalam satu Tipe Transaksi).
  Data Baru yang belum disimpan tidak bisa dijadikan favorit. Pembayaran yang memuat gaji ditolak, supaya gaji tidak terbayar dua kali.
- **Mengambil:** di Data Baru, tombol Ambil membuka daftar favorit Tipe Transaksi itu. Semua isian terisi, termasuk nilai, dan bisa diubah. Tanggal menjadi hari
  ini, nomor menjadi otomatis, No Cek dan lampiran tidak ikut. Tidak ada yang tersimpan sebelum tombol Simpan; semua pemeriksaan Simpan tetap berlaku.
- **Halaman Transaksi Favorit** (popup Pengaturan): Nama Favorit, Tipe Transaksi, Nilai, filter Tipe Transaksi, Cari. Klik baris: ganti nama, Pakai, atau Hapus.
  Kolom Daftar Pengguna di foto belum dipakai karena login belum ada. Favorit ikut Cadangan Data dan tidak mengubah jurnal.

### 6.7 Dashboard — Draf (keputusan pengguna 2026-11-07: model berwarna, disetujui dari gambar contoh, widget bisa diatur)
Semua angka dihitung dari data asli dengan alat yang sama dengan laporan; tidak ada angka contoh. Data kosong menampilkan pesan singkat.
Donasi di Dashboard = semua akun pendapatan dan pendapatan lainnya; Pengeluaran = semua akun beban dan beban lainnya, termasuk penyusutan;
Kas dan Bank = saldo semua akun Kas & Bank. Tombol ‹ › memilih bulan, tidak bisa melewati bulan ini; angka bulanan mengikuti bulan itu.
- **Tampil bawaan:** empat kartu warna (Kas dan Bank, Donasi, Pengeluaran, Selisih, dengan tren 8 bulan dan banding bulan lalu), Donasi dan Pengeluaran
  (lingkaran; terpakai = pengeluaran dibagi donasi), Arus Kas 7 hari (Transfer Bank tidak dihitung, karena dihitung bersih per jurnal), Tren Donasi 30 hari,
  Aktivitas Terakhir (garis waktu), Beban Terbesar (lingkaran), Program Terbaik Tahun Ini, Perlu Perhatian, Anggaran Bulan Ini (anggaran Umum, akun beban),
  Target Donasi.
- **Bisa ditambah:** Saldo per Rekening, Donasi dan Pengeluaran Tahun Ini (grafik batang), Komposisi Dana, Donasi per Kategori, Donatur Terbesar, Donasi Terbaru,
  Sisa Dana per Program, Aset Tetap.
- **Perlu Perhatian** selalu menurut keadaan hari ini, bukan bulan yang dipilih: penyusutan bulan lalu belum diproses, gaji belum lunas, akun beban lewat anggaran bulan ini, target berjalan yang berakhir dalam
  30 hari dan belum tercapai, daftar aset tidak cocok dengan Neraca, Program dengan sisa dana minus. Daftar aset yang cocok ditandai centang.
- **Tombol + Widget:** centang widget yang tampil, tombol naik dan turun untuk urutan, tombol Kembalikan ke Bawaan. Tersimpan di browser ini dan ikut
  Cadangan Data. Tiap widget punya tombol Segarkan dan Sembunyikan; judulnya bisa diklik untuk membuka halaman atau laporan terkait.
- Kotak Tren Donasi, Arus Kas, Donasi, dan pilihan Dashboard lama dihapus karena tumpang tindih.

## 7. Laporan — Sedang dibahas (mulai 2026-11-02)

Semua laporan dihitung dari buku jurnal (termasuk jurnal otomatis), tidak disimpan terpisah.

**Daftar laporan** (keputusan pengguna 2026-11-02). Nama memakai istilah laporan keuangan yayasan (ISAK 35), karena
aplikasi memakai istilah yayasan dan akun Aset Neto:

| Urutan kerja | Laporan | Nama di Accurate |
|---|---|---|
| 1 | Laporan Posisi Keuangan | Neraca |
| 2 | Laporan Penghasilan Komprehensif | Laba Rugi |
| 3 | Laporan Perubahan Aset Neto | Perubahan Modal |
| 4 | Laporan Arus Kas (metode langsung) | Arus Kas |
| 5 | Laporan Donasi per Program | (tidak ada; dirancang sendiri) |

Sesudah kelima laporan itu, tetap dikerjakan: Rincian Pengeluaran (beban dengan keterangan, Program, Divisi, dan
lampiran jurnal), pilihan "jurnal tanpa lampiran", dan pemantauan sisa dana per Program.

**Menu Laporan** (dari foto menu Laporan Accurate; gambar contoh disetujui pengguna 2026-11-03):
- Dibuka dari ikon grafik batang di menu samping; tampil sebagai tab **Laporan**.
- Kiri: daftar kategori; kanan: judul kategori, kotak Cari, lalu kartu laporan (ikon, nama, keterangan singkat)
  dikelompokkan dengan judul. Kartu biru = laporan ringkasan, kartu ungu = laporan rincian. Nama Accurate ditulis
  sebagai label kecil pada laporan ISAK 35 (Neraca, Laba Rugi, Perubahan Modal).
- Kategori dan isinya:
  - **Laporan Tersimpan** (= Memorize Accurate): laporan beserta pengaturannya (periode, Divisi, Program, pembanding)
    disimpan dengan nama sendiri, dikelompokkan menurut kategori laporannya; klik = laporan langsung tampil dengan
    pengaturan itu. Ada tombol **Impor** di sebelah kotak Cari (seperti Accurate). Laporan per Divisi cukup lewat filter
    Divisi yang disimpan di sini (tidak ada laporan khusus per Divisi).
  - **Keuangan**: Laporan Posisi Keuangan, Laporan Penghasilan Komprehensif, Laporan Perubahan Aset Neto, Laporan Arus Kas.
  - **Divisi & Program**: Laporan Donasi per Program, Sisa Dana per Program, Rincian Pengeluaran.
  - **Kas & Bank**: Daftar Kas dan Bank, Rincian Beban Pembayaran.
  - **Donasi**: Penerimaan Donasi per Divisi, Rincian Donasi per Donatur.
  - **Buku Besar**: Neraca Saldo, Buku Besar per akun, Jurnal tanpa Lampiran.

**Laporan Penghasilan Komprehensif** (keputusan pengguna 2026-11-02, dari 5 desain referensi yayasan yang diaudit; dipilih
gaya Yayasan BaKTI):
- Kolom angka per tahun dipecah dua: **Dengan pembatasan | Tanpa pembatasan** (Dengan di depan).
- **Kolom per Divisi** (dari foto Laba/Rugi Departemen Accurate, keputusan pengguna 2026-11-03): kalau di Parameter
  Laporan dipilih Divisi tertentu (bukan Semua Divisi), judul menjadi "Laporan Penghasilan Komprehensif per Divisi" dan
  kolomnya satu per Divisi terpilih ditambah **Total**, seperti Accurate, menggantikan kolom Dengan/Tanpa.
- Susunan bagian memakai istilah yayasan, bukan bagian perusahaan dagang Accurate (Beban Pokok Penjualan, Laba Kotor,
  Non Operasional tidak dipakai): **PENERIMAAN** → **JUMLAH PENERIMAAN** → **BEBAN** → **JUMLAH BEBAN** →
  **SURPLUS (DEFISIT)**. Total bagian ditulis huruf besar supaya tidak sama dengan "Jumlah <akun induk>" (Temuan 33).
- Di dalam bagian, akun tampil **ringkas bertingkat** (keputusan pengguna 2026-11-03 setelah melihat hasil pertama,
  "Pilihan 1"): akun teratas bertipe Pendapatan dan Beban (misalnya "Pendapatan", "Beban") **tidak ditulis**, karena
  sama dengan judul bagian; isinya langsung tampil sebagai kelompok. Akun teratas Pendapatan Lainnya / Beban Lainnya
  tetap tampil sebagai kelompok. Kelompok (akun induk) tebal, akun anak menjorok; baris "Jumlah <akun induk>" **hanya**
  kalau isi kelompok itu 2 baris atau lebih (isi satu baris: angkanya tidak diulang). Diatur kotak centang Tampilkan
  Akun Induk / Akun Anak / Hanya Tampilkan Total di Parameter Laporan. Kolom Dengan/Tanpa ditentukan tanda Terikat/Tidak
  Terikat di tiap baris jurnal, jadi beban program dari dana terikat langsung mengurangi kolom Dengan pembatasan (tanpa
  baris "pembebasan").
- **Gaya tampilan profesional khas aplikasi** (keputusan pengguna 2026-11-03, untuk semua laporan; tidak meniru gaya
  Accurate, tetapi layak disajikan ke auditor; gambar contoh dilihat pengguna 2026-11-03):
  - Kertas putih, huruf aplikasi (Inter), tetap jelas saat dicetak hitam-putih. Ciri aplikasi hanya garis biru tua di
    atas kertas dengan potongan oranye di kirinya, dan judul laporan berwarna biru tua.
  - Kepala di tengah: NAMA YAYASAN (dari Preferensi, huruf besar), judul laporan, "Untuk periode <tgl> sampai <tgl>"
    (Posisi Keuangan: "Per <tgl s/d>"), dan "(Dinyatakan dalam Rupiah)". Keterangan filter (Divisi, Program) kecil di
    kanan atas tabel.
  - Garis akuntansi baku: garis tunggal di atas subtotal/total, garis dobel di bawah total akhir; angka 0 ditulis "-";
    angka negatif dalam kurung.
  - Tata letak serapi Accurate (permintaan pengguna 2026-11-06, dibandingkan dengan foto Rincian Penjualan per Barang):
    kertas di layar selalu seukuran A4 (tegak, atau mendatar untuk laporan rincian); **kolom berlebar tetap dan tabel di
    tengah kertas**, tidak melar mengikuti kertas; garis judul kolom dan garis jumlah terpisah per kolom dengan jarak
    seragam; baris padat; pada tabel berkelompok baris data menjorok di bawah nama kelompok dan jumlah kelompok berwarna
    biru tua; kolom pendek (Tanggal, No Bukti, Kode) tidak terlipat; tulisan Total/Jumlah merentang di atas kolom kosong.
  - Kolom Dengan pembatasan | Tanpa pembatasan ditambah kolom **Jumlah** (= Dengan + Tanpa). Versi per Divisi tetap
    satu kolom per Divisi + Total.
  - Kaki halaman: "Dicetak <tanggal>, <jam>" di kiri dan "Halaman x dari y" di kanan. Tanpa kolom Catatan, tanpa tanda
    tangan, tanpa nama pencetak (ditawarkan, tidak dipilih pengguna).
- Sesudah Surplus (Defisit): baris **Pemindahan sisa program ke Dana Umum** (mengurangi Dengan, menambah Tanpa), lalu
  **Total penghasilan komprehensif**.
- **Kolom pembanding** (tahun lalu) bisa ditampilkan atau disembunyikan lewat pengaturan tersendiri (bukan di jendela
  Parameter Laporan; keputusan pengguna 2026-11-03); bentuknya dibahas nanti.
- Gaya ini untuk laporan lain (Perubahan Aset Neto, Neraca, Arus Kas) diputuskan nanti.

**Jendela Parameter Laporan** (dari foto Parameter Laporan Laba Rugi Accurate, keputusan pengguna 2026-11-03;
disetujui 2026-11-03):
- Muncul saat kartu laporan di menu Laporan diklik. Judul "Parameter Laporan"; hanya satu bagian (tab **Kolom** Accurate
  tidak dipakai).
- **Tanggal**: Dari dan s/d. Isi awal: tanggal 1 bulan ini sampai hari ini. Dipakai juga oleh Laporan Posisi Keuangan
  (bukan satu tanggal "Per tanggal"); angka Posisi Keuangan dihitung sampai tanggal s/d, tanggal Dari tidak mengubahnya.
- **Parameter Tambahan**: **Divisi** (pengganti Departemen) dan **Program** (pengganti Proyek), keduanya boleh pilih
  beberapa; Divisi awalnya "Semua Divisi", Program kosong = semua. Cabang Accurate tidak dipakai (yayasan tanpa cabang).
- Kotak centang **Hanya Tampilkan Total** (awal tidak), **Tampilkan Akun Induk** (awal ya), **Tampilkan Akun Anak**
  (awal ya). Artinya (keputusan pengguna 2026-11-03):
  - Induk + Anak: akun induk sebagai judul tebal, akun anak menjorok di bawahnya, lalu baris "Jumlah <induk>"
    (bertingkat kalau induknya bertingkat; hanya kalau isinya 2 baris atau lebih).
  - Hanya Induk (Anak dimatikan): satu baris per akun induk tingkat teratas yang ditampilkan di bagian itu, berisi
    jumlahnya (akun teratas yang tidak ditulis, seperti "Pendapatan" di Laporan Penghasilan Komprehensif, dilewati).
  - Hanya Anak (Induk dimatikan): akun paling bawah saja, tanpa judul induk dan tanpa baris Jumlah.
  - Hanya Tampilkan Total, atau Induk dan Anak sama-sama dimatikan: hanya baris total bagian (misalnya Jumlah
    Penerimaan, Jumlah Beban) dan baris hasil (Surplus).
- Akun yang nilainya 0 di semua kolom pada periode itu **disembunyikan** (keputusan pengguna 2026-11-03); akun yang 0
  hanya di sebagian kolom tetap tampil dengan "-".
- Tombol **Tampilkan** membuka hasil laporan.
- Kolom pembanding tahun lalu tidak ada di jendela ini; nanti diatur di pengaturan tersendiri (menunggu pembahasan).

**Laporan lainnya — DRAF untuk dikoreksi pengguna.** Permintaan pengguna 2026-11-06: "buat seluruh laporan sampai jadi
nanti aku koreksi". Jadi bagian di bawah dirancang tanpa foto Accurate dan tanpa tanya jawab per laporan, memakai kertas
dan gaya yang sudah disetujui; semuanya menunggu koreksi pengguna.

- **Aturan bersama semua laporan:** di atas kertas ada bilah ikon di tengah, seperti Accurate (dari foto, permintaan
  pengguna 2026-11-06): **Parameter** (membuka jendela Parameter Laporan dengan isian yang sedang dipakai), Cetak, Simpan
  Laporan, **Unduh** (menu PDF, Excel, CSV); nama tombol muncul saat ikon disentuh. Cetak membuka Halaman Cetak berisi PDF dan
  Unduh PDF langsung mengunduh berkas (6.9); Excel berupa .xlsx asli dengan angka tetap angka. Ikon Accurate
  lain (Segarkan, Favorit, Hapus, Perbesar, Perkecil) belum dipakai.
- **Klik baris** (permintaan pengguna 2026-11-06): di laporan ringkasan, baris akun, baris Jumlah akun, total bagian (JUMLAH
  PENERIMAAN, JUMLAH BEBAN, JUMLAH ASET, JUMLAH LIABILITAS), baris Program/Divisi, dan baris Neraca Saldo serta Daftar Kas
  bisa diklik. Muncul jendela daftar transaksi pembentuk angka itu menurut periode dan filter laporan: Tanggal, No Bukti, Sumber,
  Akun, Keterangan, Debit, Kredit, Total. Laporan "per tanggal" memuat semua transaksi sampai tanggal itu; saldo awal akun tidak
  termasuk transaksi. Klik satu transaksi membuka formulir asalnya (Jurnal Umum, Pembayaran, Penerimaan, Transfer, Pencatatan
  Donasi, Pemindahan Dana). Di laporan rincian, baris langsung membuka formulir asalnya.
- **Modifikasi** (dari foto Accurate, permintaan pengguna 2026-11-06): ikon sesudah Parameter, membuka jendela Modifikasi.
  Baru tab **Kolom Data** dan **Halaman**; tab Penyaringan, Grup, Header & Footer, Huruf, Angka, Analisa, Grafik menunggu foto.
  Kolom Data (dari foto, berlaku di semua laporan): daftar Kolom Digunakan berisi kotak centang untuk menampilkan atau
  menyembunyikan kolom; ikut layar, cetak, dan unduhan. Kolom pertama selalu tampil (terkunci) supaya
  tulisan Total punya tempat. Kalau kolom dikurangi, lebar tabel dan jarak menyesuaikan otomatis: tabel menyempit dan tetap di
  tengah kertas (permintaan pengguna 2026-11-06). Daftar kolom tambahan di kiri foto dan ikon roda per kolom belum dipakai.
  Pengaturan Kertas: Ukuran Kertas (A4, A5, F4, Letter, Legal), Orientasi (Tegak/Mendatar), Tinggi kertas fleksibel (satu
  halaman setinggi isinya). Margin Halaman: Kiri, Kanan, Atas, Bawah dalam mm, bilangan bulat 0 sampai 50, bawaan 10. Berlaku
  di layar dan saat dicetak. Bawaan orientasi: Tegak, Mendatar untuk laporan berkolom banyak. Ukuran kertas di layar mengikuti
  pilihan ini.
  **Modifikasi bersifat sementara** (keputusan pengguna 2026-11-06): berlaku pada laporan yang sedang dibuka, termasuk saat Ubah
  Parameter. Kalau laporan dibuka lagi tanpa disimpan, tampilannya kembali ke bawaan. Supaya tidak hilang, klik **Simpan
  Laporan**: Modifikasi ikut tersimpan di Laporan Tersimpan (juga ikut Ekspor/Impor).
- Laporan ringkasan pada kertas tegak A4; laporan rincian dan laporan berkolom banyak pada kertas mendatar. Jendela Parameter
  hanya menampilkan isian yang berlaku untuk laporan itu. Baris rincian bisa diklik untuk membuka transaksi asalnya.
- **Saldo per tanggal** suatu akun = Saldo Awal di data akun + semua jurnal sampai tanggal itu, menurut sisi normal akun
  (sama dengan Histori Akun). Saldo awal di kode disimpan di data akun, bukan sebagai jurnal seperti tertulis di 4.2;
  laporan menghitung **Ekuitas Saldo Awal** sebagai lawannya supaya posisi keuangan seimbang.
- **Laporan Penghasilan Komprehensif:** sesudah SURPLUS (DEFISIT), baris **Pemindahan sisa program ke Dana Umum** dan
  **TOTAL PENGHASILAN KOMPREHENSIF** hanya tampil kalau ada Pemindahan Dana pada periode itu (kalau tidak, angkanya sama
  dengan Surplus dan tidak perlu diulang). Versi per Divisi memakai baris **Pemindahan Dana** per kolom Divisi: Divisi
  asal berkurang, Divisi tujuan bertambah (jawaban sementara atas pertanyaan yang ditunda 2026-10-30).
- **Laporan Penghasilan per Divisi dan per Program** (dari foto Laba/Rugi Departemen Accurate, permintaan pengguna 2026-11-06;
  kartu di kategori Divisi & Program): satu kolom per Divisi atau Program + Total. Tanpa pilihan di Parameter:
  semua Divisi/Program yang ada transaksinya pada periode itu menjadi kolom, urut nama, ditambah "Tanpa Divisi"/"Tanpa
  Program" kalau ada. Bagian tetap PENERIMAAN, BEBAN, SURPLUS (DEFISIT). Baris induk **langsung berisi jumlahnya**, tanpa
  baris "Jumlah <induk>", seperti foto. Laporan Penghasilan Komprehensif yang difilter Divisi memakai bentuk yang sama.
  Pemindahan Dana mengikuti kolomnya; baris Dana Umum tanpa Divisi tidak punya kolom di laporan per Divisi.
- **Laporan Aset Tetap** (kategori Aset Tetap, usulan disetujui pengguna 2026-11-06): **Daftar Aset Tetap** per tanggal s/d, berkelompok
  Kategori (Kode, Nama, Tanggal Beli, Nilai Aset, Sudah Disusutkan, Nilai Buku); **Penyusutan Aset Tetap** dalam periode, berkelompok Kategori
  (Kode, Nama, Penyusutan); **Aset yang Dilepas** dalam periode (Tanggal, Kode, Nama, Alasan, Nilai Aset, Sudah Disusutkan, Nilai Buku, Nilai
  Jual, Untung/Rugi).
- **Laporan Perbandingan Anggaran** (dari foto Laba/Rugi Departemen (Perbandingan Anggaran) Accurate, 2026-11-06; di Accurate
  isi laporan Departemen dan Proyek sama): tiga kartu, **Penghasilan per Divisi (Perbandingan Anggaran)** dan **per Program**
  di kategori Divisi & Program, serta **Penghasilan (Perbandingan Anggaran)** untuk anggaran Tipe Umum di kategori Keuangan.
  - Kolom: Keterangan, Aktual, Anggaran, Selisih, % Selisih. Selisih = Aktual - Anggaran, seperti foto. % Selisih = Selisih dibagi
    Anggaran, dibulatkan; Anggaran 0: 100 % kalau ada Aktual, 0 % kalau tidak ada, seperti foto.
  - Bagian PENERIMAAN, BEBAN, SURPLUS (DEFISIT), baris induk langsung berisi jumlahnya. Kertas tetap memakai gaya laporan aplikasi.
  - Periode dihitung **per bulan penuh**: tanggal Dari menjadi awal bulan dan s/d menjadi akhir bulan, ditulis "Dari periode
    Januari 2026 s/d November 2026", karena anggaran dibuat per bulan.
  - Anggaran = jumlah per bulan pada rentang itu, sudah termasuk Transfer Anggaran, sama dengan Monitor. Aktual mengikuti aturan
    Penggunaan di Monitor. Parameter hanya menampilkan Divisi saja atau Program saja sesuai laporan; laporan Umum tanpa keduanya.
    Tanpa pilihan = semua Divisi/Program dijumlah.
- **Laporan Posisi Keuangan:** satu kolom Jumlah, per tanggal s/d. ASET (akun Kas & Bank, Aset Lancar Lainnya, Aset Tetap,
  Akumulasi Penyusutan sebagai pengurang, Aset Lainnya) → JUMLAH ASET; LIABILITAS → JUMLAH LIABILITAS; ASET NETO: Tanpa
  pembatasan dan Dengan pembatasan → JUMLAH ASET NETO → JUMLAH LIABILITAS DAN ASET NETO. Aset neto = semua baris akun modal,
  pendapatan, dan beban sampai tanggal itu, dipilah menurut tanda Terikat, karena Tutup Buku belum ada; Ekuitas Saldo Awal
  masuk Tanpa pembatasan dan disebut di catatan bawah tabel. Kalau tidak seimbang, muncul peringatan beserta selisihnya.
  Filter Divisi/Program tidak ada, karena baris Kas/Bank tidak bertanda Divisi dan Program.
- **Laporan Perubahan Aset Neto:** kolom Dengan | Tanpa | Jumlah. Baris: Saldo awal (sehari sebelum Dari), Surplus (Defisit),
  Pemindahan sisa program ke Dana Umum, Perubahan langsung aset neto (Jurnal Umum ke akun modal), Saldo akhir. Dua baris
  tengah hanya tampil kalau ada angkanya. Saldo akhir sama dengan Aset Neto di Posisi Keuangan pada tanggal s/d.
- **Laporan Arus Kas (metode langsung):** satu kolom Jumlah. Hanya jurnal yang mengubah total Kas/Bank; transfer antar
  Kas/Bank tidak ikut. Tiap akun lawan masuk: **AKTIVITAS OPERASI** (pendapatan, beban, aset lancar lain, liabilitas jangka
  pendek), **AKTIVITAS INVESTASI** (aset tetap, aset lain), **AKTIVITAS PENDANAAN** (liabilitas jangka panjang, modal).
  Lalu KENAIKAN (PENURUNAN) KAS, Kas awal periode, KAS AKHIR PERIODE. Filter Divisi/Program tidak ada (alasan sama dengan
  Posisi Keuangan).
- **Laporan Donasi per Program:** dikelompokkan per Divisi; kolom Sisa Awal | Pemasukan | Pengeluaran | Pemindahan | Sisa
  Akhir, dari baris jurnal bertanda Program (rumus sisa dana 6.0). Baris "Tanpa Program" untuk baris ber-Divisi tanpa
  Program, dan kelompok "Dana Umum" untuk baris tanpa Divisi dan tanpa Program. Kertas mendatar.
- **Sisa Dana per Program:** per tanggal s/d; kolom Dengan | Tanpa | Jumlah, baris per Program dalam kelompok Divisi.
- **Rincian Pengeluaran** (keputusan pengguna 2026-11-06, gambar Pilihan 2): segala pembelian dan pengeluaran dari rincian
  **Jurnal Umum dan Pembayaran**, satu daftar urut tanggal, untuk laporan rincian saja: setiap baris Debit selain Kas/Bank
  (beban, beli aset, bayar utang), ditambah baris Kredit akun beban sebagai koreksi (angka minus). Kolom Tanggal, No Bukti,
  Sumber, Akun, Keterangan, Program, Divisi, Penanggung Jawab, Nilai, dan Total. Keterangan = isian di popup Detail Akun
  atau rincian Pembayaran; kalau kosong, keterangan umum transaksinya. Totalnya boleh berbeda dari JUMLAH BEBAN karena
  ikut memuat pembelian non-beban. Filter periode, Divisi, Program, Akun. Klik baris membuka transaksi asal.
- **Rincian Beban Pembayaran:** baris non-Kas/Bank dari Pembayaran: Tanggal, No Bukti, Kas/Bank, Akun, Keterangan, Divisi,
  Program, Nilai, Total.
- **Jurnal tanpa Lampiran:** jurnal pada periode yang jumlah lampirannya 0: Tanggal, No Bukti, Sumber, Keterangan, Nilai.
  Jurnal otomatis belum punya tempat lampiran (H2.11), jadi semuanya ikut tampil dengan Sumbernya.
- **Daftar Kas dan Bank:** akun Kas & Bank paling bawah per tanggal s/d: Kode, Nama, Bank, No Rekening, Saldo, dan Total.
- **Penerimaan Donasi per Divisi:** baris per Divisi; kolom Terikat | Tidak Terikat | Jumlah, dari Pencatatan Donasi.
- **Rincian per Donasi** (dari foto Rincian Penjualan per Barang Accurate, permintaan pengguna 2026-11-06; gaya kertas tetap
  gaya aplikasi): dikelompokkan per Kategori Donasi, urut kode; kolom Tanggal, Nilai, Nama Donatur; baris diurutkan tanggal;
  di bawah tiap kelompok ada jumlahnya tanpa tulisan (seperti foto), lalu Total. Filter Divisi dan Program. Kertas tegak.
- **Rincian Donasi per Donatur:** dikelompokkan per donatur: Tanggal, No Bukti, Kategori, Divisi, Program, Nilai, jumlah per
  donatur, dan Total.
- **Neraca Saldo:** semua akun paling bawah per tanggal s/d: Kode, Nama, Debit, Kredit, ditambah baris Ekuitas Saldo Awal
  kalau ada, dan Total.
- **Buku Besar per Akun:** pilih akun di Parameter (kosong = semua akun yang ada transaksinya). Per akun: Saldo Awal, baris
  transaksi (Tanggal, No Bukti, Tipe, Keterangan, Debit, Kredit, Saldo), Saldo Akhir. Sama dengan Histori Akun.
- **Laporan Tersimpan:** tombol Simpan Laporan di kertas menyimpan laporan + parameternya (tanggal ikut tersimpan apa
  adanya) dengan nama sendiri. Kartunya di kategori Laporan Tersimpan: klik = langsung tampil; ada tombol hapus. **Impor**
  membaca berkas .json (paling besar 1 MB) hasil tombol **Ekspor**; nama yang sudah ada dilewati. Ikut Cadangan Data dan Log
  Aktivitas. Bentuk Impor Accurate belum ada fotonya.

## 8. Di luar aplikasi (server, hosting) — Belum dibahas

## 9. Keputusan terbuka

| No | Pertanyaan | Bagian |
|----|-----------|--------|
| ~~1~~ | ~~Saldo tiap Program dihitung dari mana?~~ **Selesai 2026-10-25:** lihat 6.0 (semua pemasukan − pengeluaran ± pemindahan, dari buku jurnal; juga per Divisi). | 6.0 |
| ~~3~~ | ~~Bentuk formulir Penerimaan Kas/Bank.~~ **Selesai 2026-10-25** dari foto Accurate (6.3). | 6.3 |
| ~~4~~ | ~~Bentuk formulir Transfer Kas/Bank.~~ **Selesai 2026-10-25** dari foto Accurate (6.3); biaya admin lewat Pembayaran. | 6.3 |
| ~~2~~ | ~~Beban gaji tidak membawa Program/Divisi.~~ **Selesai 2026-10-25:** skema A, jurnal gaji dibuat saat Pembayaran dengan Divisi/Program di baris Beban Gaji. | 4 |
| ~~5~~ | ~~Kategori Donasi itu isinya apa, dan hubungannya dengan Program?~~ **Dijawab 2026-10-26:** Kategori Donasi = membuat akun donasi; akunnya dimasukkan manual ke kolom Donasi Terikat / Tidak Terikat di Preferensi; Donasi tidak memakai Program. Bentuk menunggu foto. | 6.1 |
| 8 | **Sifat terikat pindah dari Program ke akun donasi.** Program = bidang di bawah Divisi untuk memisahkan laporan (2.3), tetap ditandai per donasi lewat Info lainnya. **Dijawab 2026-10-26:** (a) isian sifat terikat/tidak terikat di data Program **dihapus** (3.2; isian ini sudah ada di kode Master Data Program, perubahannya jadi tugas di PLAN); (c) pengaman dana Program (5.6) **dihapus**; (d) di formulir Donasi **Divisi wajib, Program boleh kosong**. **Masih terbuka:** (b) tutup buku dan Pemindahan Dana memilah Aset Neto Terikat/Tidak Terikat menurut akun donasi atau menurut Program — **dibahas saat fitur Tutup Buku**. | 2.3, 3.2, 4.2 |
| ~~9~~ | ~~Apakah centang Terikat juga muncul di baris Penerimaan?~~ **Dijawab 2026-10-26: tidak.** Finance sudah tahu Divisi mana yang sumber keuangannya terikat, jadi Penerimaan cukup dilihat dari Divisinya; centang Terikat disembunyikan di Penerimaan. | 4.1, 6.3 |
| ~~6~~ | ~~Saklar "Kategori Keuangan" di Preferensi > Fitur.~~ **Dijawab 2026-10-26: dihapus** (terikat/tidak terikat sudah lewat kolom akun donasi). | 6.1 |
| ~~7~~ | ~~Saklar "Donatur" di Preferensi > Fitur.~~ **Dijawab 2026-10-26: dihapus** (Donatur selalu ada dan wajib; tanpa nama = Hamba Allah). | 6.1 |

## 10. Riwayat perubahan

| Tanggal | Bagian | Perubahan |
|---------|--------|-----------|
| 2026-10-25 | 1 | Draf pertama dari tanya jawab; disetujui. Pengawas kini hanya melihat (sebelumnya: melihat dan memberi catatan). |
| 2026-10-25 | 2 | Draf ruang lingkup dan istilah. Master Gaji/Tunjangan lama diputuskan dihapus. Disetujui. |
| 2026-10-25 | 3 | Draf model data: satu buku jurnal, pembukuan terpisah penuh, hapus betul + Log, ubah = jurnal dibuat ulang. Disetujui. |
| 2026-10-25 | 4 | Draf aturan akuntansi: saldo awal menjadi jurnal, donasi barang lewat saklar Preferensi, Pemindahan Dana lewat jurnal Aset Neto, tutup buku ke Aset Neto terikat/tidak terikat. |
| 2026-10-25 | 2, 3, 4 | **Skema gaji A** (pengguna belum pernah memakai gaji Accurate; biasanya mencatat gaji di Pembayaran secara akumulatif): Pencatatan Gaji tanpa jurnal (rincian + slip); jurnal Debit Beban Gaji [Divisi, Program] / Kredit Kas/Bank dibuat lewat Pembayaran, boleh beberapa kali sampai lunas. Menggantikan skema Beban/Utang Beban dan aturan "dibayar penuh sekali". Setiap Divisi punya Kas/Bank sendiri (terlihat dari nama akun). Gaji hanya dibayar lewat Pembayaran (Proses → Gaji membuka Pembayaran), tidak lewat Jurnal Umum. |
| 2026-10-25 | 4 | Disetujui. |
| 2026-10-25 | 5 | Draf aturan bersama: akun Non Aktif disembunyikan, transaksi sebelum tanggal mulai ditolak, isian wajib baris beban dipilih di Preferensi, pengaman dana Program dan Kas minus diatur di Preferensi (peringatan atau ditolak). Disetujui. |
| 2026-10-25 | 6.0, 6.1 | Draf sisa dana Program/Divisi (semua pemasukan bertanda ikut menambah, sisa tidak pindah otomatis), Donatur, dan Donasi (cara bayar, pesan, kuitansi cetak/PDF dan WhatsApp). Disetujui. |
| 2026-10-25 | 6.2 | Draf Pencatatan Gaji: komponen diatur di Preferensi, gaji tetap di data Karyawan, status bayar, slip gaji dengan masa kerja (cetak per karyawan, cetak semua, WhatsApp). Tipe Pembayaran (Bulanan, THR, Bonus, + tambah sendiri) dengan komponen khusus per tipe; karyawan sekali per periode per tipe (THR dibayar terpisah dari gaji). Disetujui. |
| 2026-10-25 | 6.2 | Permintaan pengguna: Proses aktif begitu rincian berisi karyawan, tanpa harus disimpan dulu; Proses → Gaji menyimpan otomatis (pemeriksaan sama dengan Simpan) lalu lanjut. |
| 2026-10-25 | 3.2, 6.2 | Dari foto Accurate: Proses langsung pindah ke Pembayaran baru (Kas/Bank kosong, tanggal hari ini, No Bukti otomatis, satu baris akun dari pencatatan senilai sisa gaji). Akun Beban Gaji dipilih di Info lainnya Pencatatan Gaji (tetap skema A: pencatatan tanpa jurnal). |
| 2026-10-26 | 6.3 | Dari foto Rekonsiliasi Bank Accurate: kartu transaksi + tombol "Ada di Rekening Koran", konfirmasi sekali per halaman dibuka, yang cocok hilang dari daftar (bisa dibatalkan); transaksi yang sudah direkonsiliasi tidak bisa diubah/dihapus sebelum dibatalkan. Menggantikan rancangan lama (saldo rekening koran dan selisih). |
| 2026-10-26 | 6.3 | Dari foto Histori Bank Accurate: kolom # berisi ceklis hijau untuk transaksi yang sudah direkonsiliasi; klik ceklis + konfirmasi "Apakah data ini tidak cocok dengan rekening koran?" membatalkan tandanya sehingga transaksi bisa diubah lagi. |
| 2026-10-26 | 6.3 | Dari foto Rekonsiliasi Bank Accurate tanpa data: saldo ditulis "Saldo Rp ...", dan tampilan kosong bergambar "Tidak ada data mutasi kas/bank yang tersedia" menggantikan kalimat petunjuk. |
| 2026-10-26 | 6.3 | Dari foto yang sama: judul Rekonsiliasi Bank menjadi dua kotak terpisah berukuran sama, garis atas merah muda (CATATAN APLIKASI, dengan saldo di bilah abu-abu) dan biru (REKENING BANK). Kartu di kolom kiri, tombol di kolom kanan, sejajar dengan judulnya. |
| 2026-11-08 | 5.3a | Keputusan pengguna (Temuan 44): Data Baru di semua formulir dibuka kosong, termasuk pilihan, tanggal, dan aturan penomoran; simpan dengan isian wajib kosong ditolak dengan pesan. Menggantikan tanggal hari ini dan nomor otomatis terpilih. |
| 2026-11-08 | 5.4 | Keputusan pengguna: lampiran berfungsi di semua transaksi pencatatan (Pembayaran, Penerimaan, Transfer, Gaji, Donasi, Pemindahan Dana) memakai popup Jurnal Umum; laporan lampiran dirancang sendiri sesudahnya. Menggantikan "menunggu foto" pada H2.11. |
| 2026-11-08 | 5.1 | Permintaan pengguna: panel isi tab di semua formulir berwarna putih, menyatu dengan tab yang aktif (sebelumnya transparan). |
| 2026-11-08 | 6.10 | Dari foto Accurate dan jawaban pengguna (Temuan 43): tab kecil per data di semua formulir, perubahan tetap di tabnya, data sama pindah ke tab yang ada, Data Baru kosong lagi sesudah simpan, paling banyak 10 tab. Disetujui pengguna. |
| 2026-11-08 | 6.1 | Temuan 42, keputusan pengguna: peringatan di Akun Perkiraan saat membuat akun baru bertipe Pendapatan, bahwa akun donasi dibuat lewat Kategori Donasi. Tidak ada larangan. |
| 2026-11-08 | 6.9, 7 | Permintaan pengguna (Temuan 41): cetak laporan dan daftar memakai PDF dan Halaman Cetak yang sama dengan bukti. Disetujui pengguna. |
| 2026-11-07 | 6.9 | Dari foto halaman cetak Accurate dan jawaban pengguna: Halaman Cetak berisi PDF sungguhan untuk kelima dokumen, tombol Cetak, Unduh PDF, Tutup, supaya konsisten di semua browser. Disetujui pengguna. |
| 2026-11-07 | 6.9 | Permintaan pengguna: Tanda Terima Donasi seukuran slip gaji. Ukuran 210 x 99 mm (sepertiga A4) dipilih Claude, menunggu koreksi pengguna. Desain A5 lama ikut diperbarui hanya kalau belum diedit. Di printer berkertas A4, slip tercetak di bagian atas lembar dengan ukuran asli, karena browser tidak bisa mengganti kertas printer; Simpan sebagai PDF mengikuti ukuran slip. |
| 2026-11-07 | 6.9 | Keputusan pengguna: cetak bukti memakai rancangan sendiri dari gambar contoh, "Kuitansi Donasi" menjadi "Tanda Terima Donasi", dan susunannya bisa diedit lewat Desain Cetakan. |
| 2026-11-07 | 6.8 | Dari foto Transaksi Favorit Accurate dan jawaban pengguna: favorit untuk Pembayaran, Penerimaan, Jurnal Umum, dan Pencatatan Donasi; semua isian termasuk nilai ikut terisi, tanggal dan nomor baru. Transaksi Berulang tidak dibuat dulu. Tutup Buku ditunda. |
| 2026-11-07 | 6.7 | Keputusan pengguna: Dashboard model berwarna dari gambar contoh (terinspirasi foto Dashboard Accurate), dengan pilihan bulan, ditambah widget lain yang diatur lewat tombol + Widget. Menyelesaikan Temuan 38. |
| 2026-11-06 | 6.6, 7 | Draf Aset Tetap versi sederhana dari foto Accurate dan gambar contoh: tanpa jurnal pembelian, tanpa Divisi dan Program karena aset milik yayasan, Kategori Aset memuat akun dan umur, Proses Penyusutan per bulan, Lepas Aset, cek kecocokan, tiga laporan. |
| 2026-11-06 | 6.4 | Permintaan pengguna: nomor jurnal terpisah JV.tahun.bulan.urut untuk semua jurnal, mengikuti urutan input per bulan, tidak dipakai ulang. Jurnal lama ikut diberi nomor. |
| 2026-11-06 | 6.4 | Dari foto Log Aktifitas Jurnal Accurate: daftar semua jurnal dengan Tanggal, Nomor #, No. Trans #, Tipe Transaksi; pilihan kolom lewat roda gigi; klik baris membuka transaksi asal. |
| 2026-11-06 | 7 | Permintaan pengguna: laporan anggaran, dari foto Laba/Rugi Departemen (Perbandingan Anggaran) Accurate. Departemen dan Proyek isinya sama. Ditambah versi Umum supaya anggaran Tipe Umum juga punya laporan. Istilah Variance ditulis Selisih. |
| 2026-11-06 | 6.5 | Keputusan pengguna: sistem Anggaran dibuat semirip Accurate, tanpa pilihan tambahan. Aturan dicocokkan dengan panduan resmi Accurate; pembatasan pendapatan ke pendapatan dibuang; arti tombol Ambil ditulis. |
| 2026-11-06 | 6.5 | Draf Monitor dan Transfer Anggaran dari foto Accurate. Keputusan pengguna: Umum menghitung semua jurnal; transfer melebihi sisa ditolak; akun tujuan boleh akun apa saja; asal dan tujuan boleh beda Divisi/Program. Menggantikan "menunggu foto". |
| 2026-11-06 | 6.5 | Dari foto Anggaran Accurate: rincian akun Pendapatan dan Beban, kolom Divisi/Program mengikuti Tipe, tombol Ambil menyusul. Usulan Claude yang menunggu koreksi pengguna: bulan, tahun, tipe, dan Divisi/Program yang sama hanya satu formulir; akun, Divisi, dan Program yang dipakai Anggaran tidak bisa dihapus. |
| 2026-11-06 | 6.5 | Keputusan pengguna: Anggaran mengikuti Accurate (satu formulir per bulan, Tipe Umum/Per Divisi/Per Program). Monitor dan Transfer Anggaran menunggu foto. Dikerjakan di Tahap J. |
| 2026-11-06 | 7 | Permintaan pengguna: semua baris keterangan laporan bisa diklik; jendela daftar transaksi, lalu ke formulir asal. |
| 2026-11-06 | 7 | Dari foto Laba/Rugi Departemen Accurate: laporan baru Penghasilan per Divisi dan per Program; baris induk langsung berisi jumlah. |
| 2026-11-06 | 7 | Keputusan pengguna: Modifikasi hanya sementara; tanpa Simpan Laporan, laporan kembali ke bawaan saat dibuka lagi. Menggantikan "tersimpan per laporan". |
| 2026-11-06 | 7 | Dari foto Kolom Data Accurate: tab Kolom Data di Modifikasi untuk menampilkan atau menyembunyikan kolom di semua laporan. |
| 2026-11-06 | 7 | Keputusan pengguna: Rincian Pengeluaran memakai gambar Pilihan 2 (daftar urut tanggal, kolom Sumber, tanpa Lampiran) dan memuat segala pembelian dan pengeluaran dari Jurnal Umum dan Pembayaran, bukan hanya akun beban. |
| 2026-11-06 | 5.1 | Keputusan pengguna: ikon tidak jadi diganti (3D dan 2D korporat dibatalkan); semua popup menu berwarna seperti popup Donasi: hijau = transaksi, biru = data, oranye = target, riwayat, dan lainnya. |
| 2026-11-06 | 7 | Dari foto Modifikasi Accurate: ikon Modifikasi dengan tab Halaman (ukuran kertas, orientasi, tinggi fleksibel, margin), tersimpan per laporan. Tab lain menunggu foto. Margin cetak bawaan menjadi 10 mm seperti foto. |
| 2026-11-06 | 7 | Permintaan pengguna: unduhan laporan punya pilihan PDF dan Excel selain CSV. |
| 2026-11-06 | 7 | Dari foto bilah alat dan jendela Parameter Accurate: tombol di atas kertas menjadi bilah ikon di tengah (Parameter, Cetak, Simpan Laporan, Unduh CSV), berlaku untuk semua laporan. |
| 2026-11-06 | 7 | Permintaan pengguna: semua halaman laporan dirapikan serapi Accurate (ukuran kertas A4, garis per kolom, baris padat, kolom pendek tidak terlipat). Garis di atas judul kolom dihapus, tinggal garis di bawahnya per kolom. |
| 2026-11-06 | 7 | Dari foto Rincian Penjualan per Barang Accurate: laporan baru Rincian per Donasi di kategori Donasi (kelompok Kategori Donasi; Tanggal, Nilai, Nama Donatur; jumlah tiap kelompok, Total). |
| 2026-11-06 | 7 | Permintaan pengguna "buat seluruh laporan sampai jadi nanti aku koreksi": draf semua laporan tersisa, Laporan Tersimpan + Impor/Ekspor, Unduh CSV, kertas mendatar, cara Pemindahan Dana di laporan per Divisi dan Program, Ekuitas Saldo Awal sebagai lawan saldo awal. Dirancang tanpa foto Accurate; menunggu koreksi pengguna. |
| 2026-11-03 | 7 | Keputusan pengguna setelah melihat hasil pertama (terlalu banyak "Jumlah" berulang, Temuan 33), dari 3 gambar contoh dipilih "Pilihan 1 ringkas bertingkat": akun teratas Pendapatan/Beban tidak ditulis, "Jumlah <induk>" hanya kalau isi kelompok 2 baris atau lebih, total bagian ditulis JUMLAH PENERIMAAN / JUMLAH BEBAN. Disetujui 2026-11-03. |
| 2026-11-03 | 7 | Keputusan pengguna (tugas I.1g-3): arti kotak centang Akun Induk / Akun Anak / Hanya Tampilkan Total, dan akun yang 0 di semua kolom disembunyikan. Disetujui 2026-11-03. |
| 2026-11-03 | 7 | Keputusan pengguna: tampilan laporan tidak meniru Accurate, memakai gaya profesional khas aplikasi yang layak untuk auditor (kertas putih, garis biru tua + potongan oranye, kepala baku di tengah dengan "(Dinyatakan dalam Rupiah)", garis akuntansi baku, 0 = "-", kolom Jumlah); menggantikan "kepala dan kaki halaman seperti Accurate". Disetujui 2026-11-03 (bersama dua baris di bawah). |
| 2026-11-03 | 7 | Dari foto hasil Laba/Rugi Departemen Accurate: Penghasilan Komprehensif berkolom per Divisi + Total kalau Divisi tertentu dipilih (selain itu tetap Dengan/Tanpa pembatasan); bagian PENERIMAAN, BEBAN, SURPLUS (DEFISIT) tanpa bagian dagang Accurate; akun induk/anak bertingkat dengan baris Jumlah; kepala dan kaki halaman seperti Accurate untuk semua laporan; Posisi Keuangan dihitung sampai tanggal s/d. Disetujui 2026-11-03. |
| 2026-11-03 | 7 | Draf jendela Parameter Laporan dari foto Laba Rugi Accurate: Tanggal Dari–s/d (juga untuk Posisi Keuangan), Divisi dan Program boleh pilih beberapa, tiga kotak centang seperti Accurate, tanpa Cabang dan tanpa tab Kolom; kolom pembanding diatur di pengaturan tersendiri nanti. Disetujui 2026-11-03. |
| 2026-11-03 | 7 | Menu Laporan dari foto Accurate, gambar contoh disetujui: kategori Laporan Tersimpan (Memorize, dengan tombol Impor), Keuangan, Divisi & Program, Kas & Bank, Donasi, Buku Besar; laporan usulan (Daftar Kas dan Bank, Rincian Beban Pembayaran, Penerimaan Donasi per Divisi, Rincian Donasi per Donatur, Buku Besar per akun) ikut dimasukkan; laporan per Divisi cukup lewat filter Divisi yang disimpan di Laporan Tersimpan. |
| 2026-11-02 | 7 | Keputusan pengguna: Laporan Penghasilan Komprehensif memakai gaya Yayasan BaKTI (kolom Dengan / Tanpa pembatasan per tahun), baris per akun induk, kolom tergantung tanda Terikat, baris pemindahan sisa program sesudah surplus; kolom pembanding bisa ditampilkan/disembunyikan lewat pengaturan laporan seperti Accurate (menunggu foto); gaya laporan lain diputuskan nanti. |
| 2026-11-02 | 7 | Keputusan pengguna: lima laporan (Posisi Keuangan, Penghasilan Komprehensif, Perubahan Aset Neto, Arus Kas metode langsung, Donasi per Program) dengan istilah yayasan ISAK 35; urutan kerja Neraca dan Laba Rugi dulu; Rincian Pengeluaran, jurnal tanpa lampiran, dan sisa dana per Program tetap dikerjakan sesudahnya. Bentuk tiap laporan menunggu foto Accurate. |
| 2026-11-02 | 6.1 | Audit D1 (Temuan 28): pengaman Pemindahan Dana memakai **sisa terendah dari tanggal pemindahan ke depan**, bukan sisa per tanggal pemindahan saja, supaya uang yang sama tidak bisa dipindah dua kali; kotak sisa dan tombol "Semua sisa" memakai angka yang sama. Disetujui 2026-11-02. |
| 2026-10-30 | 5.1, 6.1 | Permintaan pengguna: pengaman urutan isian di semua formulir berincian (pencarian rincian baru terbuka setelah isian atas terisi; peringatan + kursor ke isian yang kurang), satu alat bersama; Pemindahan Dana juga saat baris tujuan diklik; popup Tujuan dirapikan. |
| 2026-10-30 | 5.6 | Keputusan pengguna (Temuan 27): pengaman Kas/Bank minus dibuat sekarang untuk semua transaksi berjurnal; bawaan Ditolak (bisa diganti Peringatan saja di Preferensi > Pembatasan > Lainnya); yang diperiksa saldo akhir hari mulai tanggal transaksi; hanya ditolak kalau membuat saldo lebih minus dari sebelumnya. |
| 2026-10-30 | 4.2, 6.0, 6.1 | Keputusan pengguna: Pemindahan Dana jadi **dua arah** (sisa Program → Dana Umum, dan Dana Umum → Divisi) supaya kepemilikan ikut pindah dan laporan per Divisi benar; Dana Umum = Aset Neto Tidak Terikat tanpa Divisi dan tanpa Program (milik yayasan); memberi Dana Umum ke Divisi harus lewat Pemindahan Dana, bukan Transfer Bank; Jenis Pemindahan di formulir; daftar dengan kolom Jenis. Disetujui setelah melihat gambar contoh. |
| 2026-10-29 | 4.2, 6.1 | Keputusan pengguna: Pemindahan Dana diubah jadi **hanya ke Dana Umum**, uangnya ikut pindah otomatis dari Kas/Bank asal (dipilih di formulir) ke Kas/Bank Dana Umum (dipilih di kolom tujuan; akunnya dibuat pengguna di Akun Perkiraan); tombol Semua sisa. Lalu (pengguna 2026-10-29): urutan atas Dari Program, Ambil dari, Nilai Pemindahan (hanya dibaca, muncul setelah nominal diisi); nominal dan tombol Semua sisa ada di popup tujuan; formulir dirapikan. Menggantikan rancangan banyak tujuan dan "uang tidak pindah rekening". Disetujui setelah melihat gambar contoh; tampilan di laporan Program dibahas saat bagian Laporan. |
| 2026-10-29 | 6.1 | Permintaan pengguna (dari tes bagian 2): Pemindahan Dana punya kolom Nilai Pemindahan (hanya dibaca, = Total) di bawah Dari Program; Alasan pindah ke tab kecil "i" Info lainnya. |
| 2026-10-29 | 4.2, 6.0, 6.1 | Draf Pemindahan Dana (tanpa contoh Accurate): satu Program asal ke banyak tujuan (Program Aktif atau Dana Umum), ditolak kalau melebihi sisa dana asal, Alasan wajib, lampiran menyusul H2.11; jurnal Aset Neto Terikat/Tidak Terikat yang dipilih di Preferensi; rumus sisa dana Program dari jurnal. Menggantikan "akun mengikuti sifat Program" (sifat Program sudah dihapus 2026-10-26). Disetujui setelah melihat gambar contoh. |
| 2026-10-29 | 6.1 | Permintaan pengguna: daftar Target Donasi punya pilihan Tampilkan (Yang masih berjalan / Semua) yang menyembunyikan target ber-Program Selesai atau berperiode lewat; formulir tanpa tab kecil, sesuai gambar contoh. |
| 2026-10-29 | 2.2, 6.1 | Draf Target Donasi (dirancang bersama pengguna, tanpa contoh Accurate): target per Program, periode tanggal mulai–selesai, daftar dengan Terkumpul/Sisa/Capaian, capaian berhenti di 100%; kolom Status di daftar. Disetujui setelah melihat gambar contoh. |
| 2026-10-29 | 2.2, 6.1 | Keputusan pengguna: Pengembalian Donasi dihilangkan dari popup Donasi beserta saklarnya di Preferensi > Fitur (popup tinggal 5 kotak); donasi salah diubah/dihapus di Pencatatan Donasi, uang yang dikembalikan dicatat lewat Pembayaran. |
| 2026-10-29 | 2.2, 6.1 | Keputusan pengguna: Penyaluran Bantuan dihilangkan dari popup Donasi (tinggal 6 kotak); penyaluran bantuan dicatat lewat Pembayaran. |
| 2026-10-29 | 6.1 | Keputusan pengguna (di Accurate tidak ada): riwayat donasi berupa tab ketiga "Riwayat Donasi" di formulir Donatur (Tanggal, No Bukti, Nama Donasi, Kas/Bank, Nilai, terbaru di atas, Total di bawah), hanya untuk dilihat; tabel bergulir dengan pilihan Tahun (awalnya tahun ini, ada Semua); Nama Donasi panjang dipotong "…". |
| 2026-10-28 | 5.1 | Permintaan pengguna: peringatan Divisi/Dana muncul saat klik Lanjut di popup baris (sedini mungkin), tetap diperiksa lagi saat Simpan. |
| 2026-10-28 | 4.1, 5.1 | Permintaan pengguna: Divisi wajib di setiap baris Jurnal Umum, Pembayaran, Penerimaan (kecuali Kas & Bank); peringatan Divisi kosong dan Dana belum dipilih muncul sebagai notifikasi di pojok kanan atas. |
| 2026-10-28 | 4.1, 6.3 | Permintaan pengguna: bagian Dana di popup baris Jurnal Umum dan Pembayaran berisi dua centang (Terikat, Tidak Terikat; hanya satu); jurnal/pembayaran tidak bisa disimpan kalau ada baris (selain Kas & Bank) yang belum dipilih; baris baru ikut baris terakhir; data lama = Tidak Terikat. |
| 2026-10-28 | 5.1 | Permintaan pengguna: titik ribuan muncul otomatis saat mengetik di semua kolom nominal (angka bulat). |
| 2026-10-28 | 5.1 | Keputusan pengguna: semua kotak pilihan isian di formulir dan popup memakai label (chip) dan bisa dicari; filter daftar dan pilihan Dashboard tidak diubah. Dikerjakan sekarang, sebelum Simpan Pencatatan Donasi. |
| 2026-10-28 | 5.1, 6.1 | Permintaan pengguna: penanda pilihan (chip) "[ID] Nama ✖" untuk semua kolom cari/pilih satu pilihan; tombol donatur baru tetap muncul selama belum ada nama yang sama persis (mengetik "Andi" saat ada "Fandi"). |
| 2026-10-28 | 3.2, 4.2, 6.1 | Pencatatan Donasi, permintaan pengguna: Tanggal pindah ke kanan (bersama No Bukti); Setor ke menjadi Kas/Bank di kiri di bawah Donatur; kolom baru Nilai Pembayaran (hanya dibaca, = jumlah rincian; Total di bawah tetap); donatur baru bisa dibuat langsung dari kolom Donatur lewat tombol Simpan "…" sebagai data baru? (hanya nama, ID otomatis). |
| 2026-10-28 | 3.2, 3.3, 4.2, 6.1 | Draf Pencatatan Donasi dari foto Faktur Penjualan, popup Rincian Barang, daftar dan tab Info lainnya Penerimaan Penjualan Accurate, menggantikan rancangan Donasi lama: satu proses (Faktur + Penerimaan jadi satu formulir); atas: Donatur (lewat id), Tanggal, No Bukti, Setor ke (Kas/Bank); rincian: Nama Donasi, Kode, Nilai, Total; popup baris Info lainnya: Divisi wajib, Program, Keterangan; tab Info lainnya: Cara Bayar (Tunai/Transfer/QRIS), Keterangan, status Terekonsiliasi; tanpa VOID; daftar dan filter; Program per baris (bukan satu Program per donasi); donasi barang, lampiran, dan cetak ditunda. Disetujui 2026-10-28. |
| 2026-10-28 | 6.1 | Hamba Allah: nama dan Non Aktif dikunci (Temuan 25, keputusan pengguna). |
| 2026-10-28 | 6.1 | Draf Donatur dari foto formulir dan daftar Pelanggan Accurate, menggantikan rancangan lama: Nama (boleh sama), ID Donatur D.00001 otomatis/diketik (unik), Kategori pilih/ketik, No. Telepon, Handphone, No. WhatsApp, Email, Alamat (Jalan, Kota); tab Lainnya: Catatan + Non Aktif; donatur yang sudah berdonasi tidak bisa dihapus, dinonaktifkan saja; daftar: Nama, ID, Kontak Utama, Kategori, Total Donasi, tanpa filter. Tambahan pengguna: transaksi menyimpan ID donatur, jadi ganti nama di Donatur ikut mengubah semua pencatatan dan bukti donasi (yang dicetak/dibuat ulang). Disetujui 2026-10-28. |
| 2026-10-27 | 6.1 | Rincian ubah/hapus Kategori Donasi: Sub dari boleh diganti selama akun belum dipakai (kode ikut berganti); hapus mengeluarkan akun dari Preferensi otomatis; akun terkunci di Akun Perkiraan dan tidak bisa jadi induk. |
| 2026-10-27 | 6.1 | Draf Kategori Donasi dari foto formulir Barang & Jasa Accurate: Nama Donasi, Sub dari (induk Pendapatan, dipilih tiap kali), Kode Donasi = kode akun (otomatis dari induk, terkunci), Kelompok (pilih/tambah); simpan membuat akun otomatis; ubah/hapus ikut ke akun dan hanya lewat Kategori Donasi; tab Umum + tab Lainnya (Catatan), tanpa Non Aktif; daftar: Nama, Kode, Kelompok, Terikat/Tidak Terikat, filter Kelompok dan Terikat. Disetujui 2026-10-27 (bersama kolom Donasi Terikat/Tidak Terikat di Preferensi). |
| 2026-10-26 | 2.1, 6.1 | Pemilahan kotak popup Donasi per kotak: Faktur + Penerimaan Penjualan digabung jadi Pencatatan Donasi; Pengiriman Pesanan jadi Penyaluran Bantuan (baru); Retur jadi Pengembalian Donasi; Kategori Penjualan jadi Kategori Donasi; Pelanggan jadi Donatur; Target Penjualan jadi Target Donasi (baru); Pemindahan Dana kotak baru; Komisi Penjual dikembangkan nanti; sisanya tidak dipakai. |
| 2026-10-26 | 4.1, 6.3, 9 | Draf: centang "Terikat" di Info lainnya popup baris Pembayaran (semua baris, termasuk gaji) dan Jurnal Umum; ikut ke jurnal; baris baru mengikuti baris terakhir. Menggantikan "baris tanpa Program = tidak terikat". Keputusan terbuka 9 (Penerimaan). Disetujui 2026-10-26 (pengguna: kerjakan dulu bersama hapus Sifat Dana Program dan dua saklar). |
| 2026-10-26 | 9 | Keputusan 6 dan 7 dijawab: saklar "Kategori Keuangan" dan saklar "Donatur" di Preferensi > Fitur dihapus. |
| 2026-10-26 | 2.3, 5.6, 6.1, 9 | Keputusan 8 dijawab sebagian: sifat terikat di data Program dihapus; pengaman dana Program dihapus; Donasi: Divisi wajib, Program boleh kosong. Pemilahan Aset Neto dibahas saat Tutup Buku. |
| 2026-10-26 | 6.1, 9 | Draf: Kategori Donasi = membuat akun donasi; Preferensi punya kolom Donasi Terikat dan Donasi Tidak Terikat (diisi manual); sifat terikat ditentukan akun donasi; Program, Divisi, Keterangan dipilih di Info lainnya formulir Donasi. Keputusan 5 dijawab; Keputusan 8 dibuka. Menunggu persetujuan. |
| 2026-10-26 | 2.1, 6.1, 9 | Draf popup menu Donasi dari foto popup Penjualan Accurate: Donasi, Pemindahan Dana, Pengembalian Donasi (saklar, awalnya mati), Donatur (pindah dari Master Data), Kategori Donasi. Keputusan terbuka 5–7 (Kategori Donasi, saklar Kategori Keuangan, saklar Donatur). Menunggu persetujuan. |
| 2026-10-26 | 6.3, 6.4 | Draf dari foto Histori Akun Accurate: Histori Akun (Kas & Bank tingkat 3, tanpa No Cek dan ceklis) memakai halaman bersama dengan Histori Bank; tombol ⇄ Mutasi/Debit-Kredit di keduanya; Saldo Awal tampil di kolom Mutasi; Total Debit/Kredit. Disetujui. |
| 2026-10-26 | 6.3 | Dari foto Histori Bank Accurate: baris Total di bawah tabel berisi mutasi bersih rentang itu (Dr/Cr), ikut ekspor CSV. |
| 2026-10-25 | 6.3 | Dari foto Histori Bank Accurate: Kas/Bank tingkat 3 + rentang tanggal, saldo awal dan saldo berjalan, klik baris membuka transaksi asal, ekspor CSV. |
| 2026-10-25 | 6.3 | Dari foto Transfer Bank Accurate: Dari/Ke Kas/Bank + Nilai Transfer, Info lainnya Catatan; tab biaya tidak dipakai; transfer hanya memindah uang (dana Divisi/Program tidak berubah). |
| 2026-10-25 | 3.1 | Permintaan pengguna: daftar Jurnal Umum hanya berisi jurnal Jurnal Umum; Pembayaran dan Penerimaan punya daftar sendiri dan tidak bercampur (menggantikan rencana filter Tipe Transaksi). |
| 2026-10-25 | 6.3 | Dari foto Penerimaan Accurate: kembaran Pembayaran (Pemberi, Atas Penerimaan; Penangguhan tidak dipakai); satu komponen bersama transaksi Kas/Bank; daftar Pembayaran dan Penerimaan ikut kolom Accurate; No Bukti otomatis mengikuti Kas/Bank tetapi bisa dipilih/diketik sendiri. |
| 2026-10-25 | 2.1, 2.2, 6.3 | Dari foto popup Kas & Bank Accurate: dipakai Pembayaran, Penerimaan, Transfer Bank, Histori Bank (baru), Rekonsiliasi Bank; Rekening Koran dan SmartLink tidak dibuat. Penerimaan dikerjakan lebih dulu. |
| 2026-10-25 | 5.1 | Permintaan pengguna: pilihan Kas/Bank hanya akun Kas & Bank tingkat 3 (pencarian akun rincian tetap: akun tanpa sub akun di tingkat mana pun). |
| 2026-10-25 | 6.3 | Draf Kas & Bank: Pembayaran (seperti Accurate), uang muka lewat Pembayaran + Jurnal Umum tanpa fitur khusus, Rekonsiliasi centang manual. Penerimaan dan Transfer menunggu foto Accurate. |
| 2026-11-09 | 5.4 | J.20 dan J.21: lampiran di semua transaksi pencatatan memakai satu alat bersama (umum/lampiran.js) dan satu popup. Isi file tetap di kunci lama "lampiranJurnal" (sekarang untuk semua transaksi) supaya data dan Cadangan Data lama tetap jalan. Preferensi, Lampiran ditambah Pembayaran Kas dan Bank, Pencatatan Gaji, dan Pemindahan Dana. |
| 2026-11-09 | 5.4 | J.22: laporan Bukti Pengeluaran per Divisi dan Program dibuat sesuai dua gambar contoh yang disetujui (bentuk layar/Cetak dengan gambar kecil, dan Lampiran audit). Kertas laporan mendatar. |
| 2026-11-09 | 5.4, 6.x Preferensi | Permintaan pengguna: file yang diunggah dicek ISInya, bukan hanya nama (tanda awal file; foto harus bisa dibuka sebagai gambar). Berlaku untuk lampiran semua transaksi dan logo yayasan. Logo baru hanya PNG, JPG, atau WEBP (SVG tidak diterima lagi; logo SVG lama tetap tampil sampai diganti). |
| 2026-11-09 | 6.10 | J.19: Tab Dokumen bagian 3. Penomoran (komponen) dan Pemindahan Dana (Jenis, Tujuan) ikut diingat per tab; Ambil favorit tidak lagi menimpa Data Baru yang belum disimpan; Tambah ke Favorit menolak tab yang belum disimpan. Formulir lain di daftar J.19 sudah berisi kolom biasa saja, jadi sudah ikut diingat. |
| 2026-11-09 | 6.11 | Pintasan keyboard (permintaan pengguna): Ctrl+S, Alt+N, Alt+D, Alt+W, Ctrl+P, Alt+L, Esc, F1. Hapus lewat keyboard sengaja tidak dibuat. |
| 2026-11-09 | 6.12, 5.8 | Masuk/Keluar memakai login.html yang sudah ada: akun Finance Yayasan pertama, wajib ganti sandi, keluar otomatis 40 menit tanpa peringatan (keputusan pengguna), hak akses peran sekaligus. |
