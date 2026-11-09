// ==================== Tampilan: Preferensi (Data Yayasan, Fitur, Pembatasan, Lampiran, Akun Perkiraan, Lain-lain) ====================
// HTML halaman dan popup fitur ini. Dipasang ke index.html lewat pasangTampilan (umum/pasang-tampilan.js)
// di tempat penanda <template data-tempat="...">. Logikanya ada di umum/preferensi.js (bukan di folder ini), karena isinya
// dipakai semua fitur: pemilih tanggal, format angka/tanggal, pembatasan tanggal, dan aturan lampiran.
// Tanda /*html*/ membantu editor (misalnya ekstensi VS Code "es6-string-html") mewarnai teks sebagai HTML.

pasangTampilan("tab-preferensi", /*html*/ `
                <div class="tab" id="tab-preferensi" hidden>
                    <button type="button" class="tab-judul" data-tab="preferensi">Preferensi</button>
                    <button type="button" class="tab-tutup" data-tutup="preferensi" aria-label="Tutup tab Preferensi">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" aria-hidden="true"><path d="M6 6l12 12M18 6L6 18"/></svg>
                    </button>
                </div>
`);

pasangTampilan("isi-preferensi", /*html*/ `
            <!-- Isi tab Preferensi. Logikanya di umum/preferensi.js. Bagian yang belum dibuat bertuliskan "Isi bagian ini menyusul". -->
            <section id="isi-preferensi" class="isi-tab" hidden>
                <!-- Dua kolom: menu bagian di kiri, isi bagian yang dipilih di kanan -->
                <div class="pref">
                    <nav class="pref-menu" aria-label="Bagian Preferensi">
                        <!-- data-bagian harus sama dengan bagian id "pref-NAMA" di kolom kanan -->
                        <button type="button" class="pref-item aktif" data-bagian="yayasan">Data</button>
                        <button type="button" class="pref-item" data-bagian="fitur">Fitur</button>
                        <button type="button" class="pref-item" data-bagian="pembatasan">Pembatasan</button>
                        <button type="button" class="pref-item" data-bagian="lampiran">Lampiran</button>
                        <button type="button" class="pref-item" data-bagian="atribut">Atribut Tambahan</button>
                        <button type="button" class="pref-item" data-bagian="akun">Akun Perkiraan</button>
                        <button type="button" class="pref-item" data-bagian="lain">Lain-lain</button>
                    </nav>

                    <div class="pref-isi">
                        <!-- Bagian pertama tampil, yang lain tersembunyi (hidden) sampai dipilih -->
                        <section id="pref-yayasan" class="pref-bagian">
                            <h2 class="pref-judul">Data</h2>

                            <!-- Tab kecil di dalam bagian: Info, Kontak dan Alamat, Penanda Tangan -->
                            <div class="sub-tab-baris" role="tablist">
                                <button type="button" class="sub-tab aktif" data-subtab="info">Info</button>
                                <button type="button" class="sub-tab" data-subtab="kontak">Kontak dan Alamat</button>
                                <button type="button" class="sub-tab" data-subtab="ttd">Penanda Tangan</button>
                            </div>

                            <!-- novalidate + tidak ada kolom wajib: data boleh disimpan walau ada yang kosong -->
                            <form id="form-yayasan" class="form-pref" novalidate>

                                <!-- ===== Tab Info ===== -->
                                <div id="sub-info" class="sub-isi">
                                    <div class="baris-form">
                                        <label for="yayasan-nama">Nama yayasan</label>
                                        <input id="yayasan-nama" type="text" autocomplete="off">
                                    </div>
                                    <div class="baris-form">
                                        <label for="yayasan-tgl-mulai">Tanggal mulai data</label>
                                        <div class="grup-tanggal">
                                            <input id="yayasan-tgl-mulai" type="date">
                                            <!-- Tanggal ditulis ulang dalam bentuk teks (30 Sep 2024) oleh JavaScript -->
                                            <span id="yayasan-tgl-teks" class="tanggal-teks"></span>
                                        </div>
                                    </div>
                                    <div class="baris-form">
                                        <label for="yayasan-periode">Periode akuntansi</label>
                                        <input id="yayasan-periode" type="text" value="Januari - Desember" readonly>
                                    </div>
                                    <div class="baris-form">
                                        <label for="yayasan-mata-uang">Mata uang</label>
                                        <input id="yayasan-mata-uang" type="text" value="Rupiah (IDR)" readonly>
                                    </div>
                                </div>

                                <!-- ===== Tab Kontak dan Alamat ===== -->
                                <div id="sub-kontak" class="sub-isi" hidden>
                                    <div class="baris-form">
                                        <label for="yayasan-alamat">Alamat</label>
                                        <textarea id="yayasan-alamat" rows="3"></textarea>
                                    </div>
                                    <div class="baris-form">
                                        <label for="yayasan-telepon">Telepon</label>
                                        <input id="yayasan-telepon" type="tel" autocomplete="off">
                                    </div>
                                    <div class="baris-form">
                                        <label for="yayasan-email">Email</label>
                                        <input id="yayasan-email" type="email" autocomplete="off">
                                    </div>
                                </div>

                                <!-- ===== Tab Penanda Tangan ===== -->
                                <div id="sub-ttd" class="sub-isi" hidden>
                                    <div class="baris-form">
                                        <label for="yayasan-ketua">Nama ketua</label>
                                        <input id="yayasan-ketua" type="text" autocomplete="off">
                                    </div>
                                    <div class="baris-form">
                                        <label for="yayasan-bendahara">Nama bendahara</label>
                                        <input id="yayasan-bendahara" type="text" autocomplete="off">
                                    </div>
                                    <div class="baris-form">
                                        <label for="yayasan-logo">Logo yayasan</label>
                                        <div class="grup-logo">
                                            <!-- Tempat pratinjau logo; tersembunyi sampai ada logo -->
                                            <img id="logo-pratinjau" class="logo-pratinjau" alt="Pratinjau logo yayasan" hidden>
                                            <input id="yayasan-logo" type="file" accept="image/png, image/jpeg, image/webp">
                                            <button type="button" id="logo-hapus" class="tombol tombol-garis" hidden>Hapus logo</button>
                                            <small class="petunjuk">Format PNG, JPG, atau WEBP. Ukuran maksimal 500 KB. Isi file ikut diperiksa.</small>
                                        </div>
                                    </div>
                                </div>

                                <!-- Tombol Simpan dan pesan hasil -->
                                <div class="pref-aksi">
                                    <button type="submit" class="tombol tombol-utama">Simpan</button>
                                </div>
                            </form>
                        </section>
                        <section id="pref-fitur" class="pref-bagian" hidden>
                            <h2 class="pref-judul">Fitur</h2>

                            <!-- Saklar fitur. Centang = fitur nyala. data-fitur = nama fitur yang disimpan.
                                 Halaman lain nanti memeriksa saklar ini sebelum menampilkan kolom atau menu terkait. -->
                            <form id="form-fitur" class="form-pref" novalidate>
                                <div class="fitur-isi">

                                    <div class="fitur-kolom">
                                        <h3 class="fitur-grup">Fitur Dasar</h3>
                                        <ul class="fitur-daftar">
                                            <li>
                                                <label class="saklar"><input type="checkbox" data-fitur="aset"> <span>Pencatatan Aset</span></label>
                                                <small>Mencatat aset tetap (gedung, kendaraan, inventaris) dan penyusutannya.</small>
                                            </li>
                                            <li>
                                                <label class="saklar"><input type="checkbox" data-fitur="anggaran"> <span>Anggaran dan Target</span></label>
                                                <small>Membuat anggaran per program atau divisi, lalu membandingkannya dengan realisasi.</small>
                                            </li>
                                            <li>
                                                <label class="saklar"><input type="checkbox" data-fitur="rekonsiliasi"> <span>Rekonsiliasi Bank</span></label>
                                                <small>Mencocokkan catatan kas dan bank dengan rekening koran.</small>
                                            </li>
                                        </ul>
                                    </div>

                                    <div class="fitur-kolom">
                                        <h3 class="fitur-grup">Program dan Divisi</h3>
                                        <ul class="fitur-daftar">
                                            <li>
                                                <label class="saklar"><input type="checkbox" data-fitur="program"> <span>Program</span></label>
                                                <small>Bidang di bawah divisi, untuk memisahkan keuangan dan laporan divisi beserta program-programnya.</small>
                                            </li>
                                            <li>
                                                <label class="saklar"><input type="checkbox" data-fitur="divisi"> <span>Divisi</span></label>
                                                <small>Penanda divisi di setiap transaksi, untuk laporan per divisi.</small>
                                            </li>
                                            <!-- Saklar "Kategori Keuangan" dan "Donatur" dihapus (PRD Keputusan 6 dan 7, 2026-10-26):
                                                 terikat/tidak terikat diatur lewat akun donasi, dan Donatur selalu ada (wajib di Donasi). -->
                                        </ul>
                                    </div>
                                    <!-- Kolom "Donasi" (saklar Pengembalian Donasi) dihapus 2026-10-29: fiturnya dihilangkan (PRD 6.1). -->

                                </div>

                                <div class="pref-aksi">
                                    <button type="submit" class="tombol tombol-utama">Simpan</button>
                                </div>
                            </form>
                        </section>
                        <section id="pref-pembatasan" class="pref-bagian" hidden>
                            <h2 class="pref-judul">Pembatasan</h2>

                            <!-- Tiga tab kecil. Cara kerjanya sama dengan tab kecil di bagian Data. -->
                            <div class="sub-tab-baris" role="tablist">
                                <button type="button" class="sub-tab aktif" data-subtab="akses">Akses Pengguna</button>
                                <button type="button" class="sub-tab" data-subtab="tanggal">Tanggal Transaksi</button>
                                <button type="button" class="sub-tab" data-subtab="lainnya">Lainnya</button>
                            </div>

                            <form id="form-pembatasan" class="form-pref" novalidate>

                                <!-- ===== Tab Akses Pengguna ===== -->
                                <div id="sub-akses" class="sub-isi">
                                    <h3 class="fitur-grup">Pembatasan Akses ke Pembukuan Ini</h3>
                                    <ul class="fitur-daftar">
                                        <li>
                                            <label class="saklar"><input type="radio" name="batas-akses" value="bebas"> <span>Tidak dibatasi</span></label>
                                        </li>
                                        <li>
                                            <label class="saklar"><input type="radio" name="batas-akses" value="semua"> <span>Dibatasi semua</span></label>
                                            <small>Semua pengguna selain Finance Yayasan tidak bisa membuka pembukuan ini. Berguna saat tutup buku atau pemeriksaan.</small>
                                        </li>
                                    </ul>
                                </div>

                                <!-- ===== Tab Tanggal Transaksi ===== -->
                                <div id="sub-tanggal" class="sub-isi" hidden>
                                    <h3 class="fitur-grup">Pembatasan Tanggal Transaksi</h3>
                                    <ul class="fitur-daftar">
                                        <li>
                                            <label class="saklar"><input type="radio" name="batas-tanggal" value="bebas"> <span>Tidak dibatasi</span></label>
                                        </li>
                                        <li>
                                            <label class="saklar"><input type="radio" name="batas-tanggal" value="tertentu"> <span>Berdasarkan tanggal tertentu</span></label>
                                            <small>Transaksi pada tanggal ini dan sebelumnya dikunci: tidak bisa ditambah, diubah, atau dihapus.</small>
                                            <div class="opsi-tanggal">
                                                <input id="batas-tanggal-kunci" type="date" aria-label="Tanggal penguncian">
                                                <!-- Tanggal ditulis ulang dalam bentuk teks (30 Sep 2024) oleh JavaScript -->
                                                <span id="batas-tanggal-teks" class="tanggal-teks"></span>
                                            </div>
                                        </li>
                                    </ul>
                                </div>

                                <!-- ===== Tab Lainnya ===== -->
                                <div id="sub-lainnya" class="sub-isi" hidden>
                                    <h3 class="fitur-grup">Pembatasan Umum</h3>
                                    <ul class="fitur-daftar">
                                        <li>
                                            <label class="saklar"><input type="checkbox" id="batas-masa-depan"> <span>Tanggal yang belum berlangsung tidak bisa dipilih</span></label>
                                            <small>Di semua pilihan tanggal transaksi, hari setelah hari ini tidak bisa dipilih. Mencegah salah ketik tahun atau bulan.</small>
                                        </li>
                                    </ul>
                                    <!-- Pengaman saldo Kas/Bank minus (PRD 5.6): berlaku untuk semua transaksi yang membuat jurnal -->
                                    <h3 class="fitur-grup">Saldo Kas/Bank Minus</h3>
                                    <ul class="fitur-daftar">
                                        <li>
                                            <label class="saklar"><input type="radio" name="batas-kas-minus" value="tolak"> <span>Ditolak</span></label>
                                            <small>Transaksi yang membuat saldo Kas/Bank minus (pada tanggalnya atau sesudahnya) tidak bisa disimpan.</small>
                                        </li>
                                        <li>
                                            <label class="saklar"><input type="radio" name="batas-kas-minus" value="peringatan"> <span>Peringatan saja</span></label>
                                            <small>Muncul peringatan, tetapi transaksinya tetap disimpan.</small>
                                        </li>
                                    </ul>
                                </div>

                                <div class="pref-aksi">
                                    <button type="submit" class="tombol tombol-utama">Simpan</button>
                                </div>
                            </form>
                        </section>
                        <section id="pref-lampiran" class="pref-bagian" hidden>
                            <h2 class="pref-judul">Lampiran</h2>

                            <form id="form-lampiran" class="form-pref" novalidate>
                                <div class="sub-isi">
                                    <!-- Kotak peringatan seperti di Accurate: menjelaskan fungsi halaman ini -->
                                    <p class="kotak-peringatan">
                                        Silakan pilih menu transaksi yang <strong>MEWAJIBKAN</strong> pengguna menyertakan lampiran saat menyimpan transaksi.
                                    </p>

                                    <div class="fitur-isi lampiran-isi">
                                        <div class="fitur-kolom">
                                            <h3 class="fitur-grup">Jurnal</h3>
                                            <ul class="fitur-daftar">
                                                <li><label class="saklar"><input type="checkbox" data-lampiran="jurnal"> <span>Jurnal Umum</span></label></li>
                                                <li><label class="saklar"><input type="checkbox" data-lampiran="gaji"> <span>Pencatatan Gaji</span></label></li>
                                            </ul>
                                        </div>

                                        <div class="fitur-kolom">
                                            <h3 class="fitur-grup">Kas dan Bank</h3>
                                            <ul class="fitur-daftar">
                                                <li><label class="saklar"><input type="checkbox" data-lampiran="donasi"> <span>Donasi</span></label></li>
                                                <li><label class="saklar"><input type="checkbox" data-lampiran="pembayaran"> <span>Pembayaran Kas dan Bank</span></label></li>
                                                <li><label class="saklar"><input type="checkbox" data-lampiran="penerimaan"> <span>Penerimaan Kas dan Bank</span></label></li>
                                                <li><label class="saklar"><input type="checkbox" data-lampiran="transfer"> <span>Transfer Kas/Bank</span></label></li>
                                                <li><label class="saklar"><input type="checkbox" data-lampiran="pemindahan"> <span>Pemindahan Dana</span></label></li>
                                            </ul>
                                        </div>

                                        <!-- Kelompok ini hanya tampil kalau saklar "Pencatatan Aset" di Fitur nyala.
                                             Atribut hidden diatur JavaScript saat bagian Lampiran dibuka. -->
                                        <div id="lampiran-kelompok-aset" class="fitur-kolom" hidden>
                                            <h3 class="fitur-grup">Aset Tetap</h3>
                                            <ul class="fitur-daftar">
                                                <li><label class="saklar"><input type="checkbox" data-lampiran="aset"> <span>Aset Tetap</span></label></li>
                                                <li><label class="saklar"><input type="checkbox" data-lampiran="asetUbah"> <span>Perubahan Aset Tetap</span></label></li>
                                                <li><label class="saklar"><input type="checkbox" data-lampiran="asetDisposisi"> <span>Disposisi Aset Tetap</span></label></li>
                                            </ul>
                                        </div>
                                    </div>
                                </div>

                                <div class="pref-aksi">
                                    <button type="submit" class="tombol tombol-utama">Simpan</button>
                                </div>
                            </form>
                        </section>
                        <section id="pref-atribut" class="pref-bagian" hidden>
                            <h2 class="pref-judul">Atribut Tambahan</h2>
                            <p class="isi-menyusul">Isi bagian ini menyusul</p>
                        </section>
                        <section id="pref-akun" class="pref-bagian" hidden>
                            <h2 class="pref-judul">Akun Perkiraan</h2>

                            <div class="sub-tab-baris" role="tablist">
                                <button type="button" class="sub-tab aktif" data-subtab="ap-pendapatan">Pendapatan</button>
                                <button type="button" class="sub-tab" data-subtab="ap-kas">Kas dan Bank</button>
                                <button type="button" class="sub-tab" data-subtab="ap-aset-neto">Aset Neto</button>
                                <button type="button" class="sub-tab" data-subtab="ap-lain">Lainnya</button>
                            </div>

                            <form id="form-akun-perkiraan" class="form-pref" novalidate>

                                <!-- Setiap kolom akun memakai komponen "pemilih-akun":
                                     data-kolom = nama data yang disimpan
                                     data-maks  = jumlah akun maksimal (0 = tidak dibatasi, 1 = hanya satu akun)
                                     data-pasangan = (boleh tidak ada) kolom lain yang tidak boleh berisi akun yang sama -->

                                <!-- ===== Tab Pendapatan ===== -->
                                <div id="sub-ap-pendapatan" class="sub-isi">
                                    <!-- Akun donasi dipecah dua (PRD 6.1): sifat terikat ditentukan oleh kolom tempat akun dimasukkan.
                                         Satu akun hanya boleh ada di salah satu kolom (data-pasangan). -->
                                    <div class="baris-form">
                                        <label for="cari-donasiTerikat">Donasi Terikat</label>
                                        <div>
                                            <div class="pemilih-akun" data-kolom="donasiTerikat" data-pasangan="donasiTidakTerikat" data-maks="0">
                                                <div class="pemilih-chip"></div>
                                                <input id="cari-donasiTerikat" class="pemilih-cari" type="text" placeholder="Cari/Pilih..." autocomplete="off">
                                                <ul class="pemilih-daftar" hidden></ul>
                                            </div>
                                            <small class="petunjuk">Akun donasi yang hanya boleh dipakai sesuai permintaan donatur. Bisa dipilih di formulir Donasi.</small>
                                        </div>
                                    </div>
                                    <div class="baris-form">
                                        <label for="cari-donasiTidakTerikat">Donasi Tidak Terikat</label>
                                        <div>
                                            <div class="pemilih-akun" data-kolom="donasiTidakTerikat" data-pasangan="donasiTerikat" data-maks="0">
                                                <div class="pemilih-chip"></div>
                                                <input id="cari-donasiTidakTerikat" class="pemilih-cari" type="text" placeholder="Cari/Pilih..." autocomplete="off">
                                                <ul class="pemilih-daftar" hidden></ul>
                                            </div>
                                            <small class="petunjuk">Akun donasi yang bebas dipakai yayasan. Bisa dipilih di formulir Donasi.</small>
                                        </div>
                                    </div>
                                    <div class="baris-form">
                                        <label for="cari-pendapatanLain">Pendapatan Lainnya</label>
                                        <div>
                                            <div class="pemilih-akun" data-kolom="pendapatanLain" data-maks="0">
                                                <div class="pemilih-chip"></div>
                                                <input id="cari-pendapatanLain" class="pemilih-cari" type="text" placeholder="Cari/Pilih..." autocomplete="off">
                                                <ul class="pemilih-daftar" hidden></ul>
                                            </div>
                                            <small class="petunjuk">Akun yang bisa dipilih di formulir Penerimaan Kas dan Bank (bunga bank, hasil unit usaha, dan sebagainya).</small>
                                        </div>
                                    </div>
                                </div>

                                <!-- ===== Tab Kas dan Bank ===== -->
                                <div id="sub-ap-kas" class="sub-isi" hidden>
                                    <div class="baris-form">
                                        <label for="cari-kasBank">Kas dan Bank</label>
                                        <div>
                                            <div class="pemilih-akun" data-kolom="kasBank" data-maks="0">
                                                <div class="pemilih-chip"></div>
                                                <input id="cari-kasBank" class="pemilih-cari" type="text" placeholder="Cari/Pilih..." autocomplete="off">
                                                <ul class="pemilih-daftar" hidden></ul>
                                            </div>
                                            <small class="petunjuk">Rekening kas dan bank yang bisa dipilih di Donasi, Penerimaan Kas dan Bank, dan Transfer Kas/Bank.</small>
                                        </div>
                                    </div>
                                </div>

                                <!-- ===== Tab Aset Neto (PRD 4.2, 6.1): akun jurnal otomatis Pemindahan Dana =====
                                     data-tipe = hanya akun bertipe itu yang ditawarkan (modal = kelompok Aset Neto). Satu akun per kolom,
                                     dan kedua kolom tidak boleh berisi akun yang sama (data-pasangan). -->
                                <div id="sub-ap-aset-neto" class="sub-isi" hidden>
                                    <div class="baris-form">
                                        <label for="cari-asetNetoTerikat">Aset Neto Terikat</label>
                                        <div>
                                            <div class="pemilih-akun" data-kolom="asetNetoTerikat" data-pasangan="asetNetoTidakTerikat" data-maks="1" data-tipe="modal">
                                                <div class="pemilih-chip"></div>
                                                <input id="cari-asetNetoTerikat" class="pemilih-cari" type="text" placeholder="Cari/Pilih..." autocomplete="off">
                                                <ul class="pemilih-daftar" hidden></ul>
                                            </div>
                                            <small class="petunjuk">Dipakai Pemindahan Dana untuk dana Program (asal dan tujuan Program). Hanya satu akun bertipe Modal.</small>
                                        </div>
                                    </div>
                                    <div class="baris-form">
                                        <label for="cari-asetNetoTidakTerikat">Aset Neto Tidak Terikat</label>
                                        <div>
                                            <div class="pemilih-akun" data-kolom="asetNetoTidakTerikat" data-pasangan="asetNetoTerikat" data-maks="1" data-tipe="modal">
                                                <div class="pemilih-chip"></div>
                                                <input id="cari-asetNetoTidakTerikat" class="pemilih-cari" type="text" placeholder="Cari/Pilih..." autocomplete="off">
                                                <ul class="pemilih-daftar" hidden></ul>
                                            </div>
                                            <small class="petunjuk">Dipakai Pemindahan Dana untuk tujuan Dana Umum (tanpa Program). Hanya satu akun bertipe Modal.</small>
                                        </div>
                                    </div>
                                </div>

                                <!-- ===== Tab Lainnya ===== -->
                                <div id="sub-ap-lain" class="sub-isi" hidden>
                                    <div class="baris-form">
                                        <label for="cari-saldoAwal">Akun Saldo Awal</label>
                                        <div>
                                            <div class="pemilih-akun" data-kolom="saldoAwal" data-maks="1">
                                                <div class="pemilih-chip"></div>
                                                <input id="cari-saldoAwal" class="pemilih-cari" type="text" placeholder="Cari/Pilih..." autocomplete="off">
                                                <ul class="pemilih-daftar" hidden></ul>
                                            </div>
                                            <small class="petunjuk">Akun lawan yang dipakai otomatis saat saldo awal dimasukkan. Hanya satu akun.</small>
                                        </div>
                                    </div>
                                </div>

                                <div class="pref-aksi">
                                    <button type="submit" class="tombol tombol-utama">Simpan</button>
                                </div>
                            </form>
                        </section>
                        <section id="pref-lain" class="pref-bagian" hidden>
                            <h2 class="pref-judul">Lain-lain</h2>

                            <form id="form-format" class="form-pref" novalidate>
                                <div class="sub-isi">
                                    <h3 class="fitur-grup">Format</h3>

                                    <div class="baris-form">
                                        <label for="format-desimal">Format Desimal</label>
                                        <select id="format-desimal">
                                            <option value="indonesia">Indonesia (9.999,9)</option>
                                            <option value="internasional">Internasional (9,999.9)</option>
                                        </select>
                                    </div>

                                    <div class="baris-form">
                                        <label for="format-opsi-desimal">Opsi Desimal</label>
                                        <div class="grup-dua-kolom">
                                            <select id="format-opsi-desimal" aria-label="Jumlah angka di belakang koma">
                                                <option value="0">0 (tanpa desimal)</option>
                                                <option value="1">0,9 (satu desimal)</option>
                                                <option value="2">0,99 (dua desimal)</option>
                                            </select>
                                            <select id="format-mode-desimal" aria-label="Kapan desimal ditampilkan">
                                                <option value="jika-ada">Jika ada desimal</option>
                                                <option value="selalu">Selalu tampilkan</option>
                                            </select>
                                        </div>
                                    </div>

                                    <div class="baris-form">
                                        <label for="format-tanggal">Tampilan Tanggal</label>
                                        <select id="format-tanggal">
                                            <option value="teks">Indonesia (9 Agu 2023)</option>
                                            <option value="angka">Angka (09/08/2023)</option>
                                            <option value="iso">Tahun lebih dulu (2023-08-09)</option>
                                        </select>
                                    </div>

                                    <!-- Contoh hasil format, diperbarui JavaScript setiap pilihan berubah -->
                                    <div class="kotak-contoh" aria-live="polite">
                                        <div>Contoh angka: <strong id="contoh-angka"></strong></div>
                                        <div>Contoh tanggal: <strong id="contoh-tanggal"></strong></div>
                                    </div>
                                </div>

                                <div class="pref-aksi">
                                    <button type="submit" class="tombol tombol-utama">Simpan</button>
                                </div>
                            </form>
                        </section>
                    </div>
                </div>
            </section>
`);
