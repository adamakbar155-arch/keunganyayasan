// ==================== Tampilan: Akun Perkiraan (halaman) ====================
// HTML halaman dan popup fitur ini. Dipasang ke index.html lewat pasangTampilan (umum/pasang-tampilan.js)
// di tempat penanda <template data-tempat="...">. Logikanya ada di file .js lain di folder yang sama.
// Tanda /*html*/ membantu editor (misalnya ekstensi VS Code "es6-string-html") mewarnai teks sebagai HTML.

pasangTampilan("tab-akun", /*html*/ `
                <div class="tab" id="tab-akun" hidden>
                    <button type="button" class="tab-judul" data-tab="akun">Akun Perkiraan</button>
                    <button type="button" class="tab-tutup" data-tutup="akun" aria-label="Tutup tab Akun Perkiraan">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" aria-hidden="true"><path d="M6 6l12 12M18 6L6 18"/></svg>
                    </button>
                </div>
`);

pasangTampilan("isi-akun", /*html*/ `
            <!-- ===== Isi tab Akun Perkiraan (komponen daftar dibuat otomatis oleh buatModulDaftar) ===== -->
            <section id="isi-akun" class="isi-tab" hidden>
                <div class="modul-form">
                    <div class="modul-form-kiri">
                        <div class="sub-tab-baris">
                            <button type="button" class="sub-tab aktif" data-subtab="akun-umum">Informasi Umum</button>
                            <button type="button" class="sub-tab" data-subtab="akun-saldo">Saldo</button>
                            <!-- Hanya untuk akun yang sudah ada: daftar akun itu sendiri beserta semua sub akunnya -->
                            <button type="button" id="tab-akun-anak" class="sub-tab" data-subtab="akun-anak" hidden>Akun Anak</button>
                        </div>
                        <form id="form-akun" class="form-pref" novalidate>
                            <!-- ===== Tab Informasi Umum ===== -->
                            <div id="sub-akun-umum" class="sub-isi">
                              <!-- Dua kolom berdampingan: Informasi Akun di kiri, Informasi Bank di kanan (turun ke bawah di layar sempit) -->
                              <div class="form-dua-kolom">
                                <div class="form-kolom">
                                <h3 class="fitur-grup">Informasi Akun</h3>

                                <div class="baris-form">
                                    <label for="akun-tipe">Tipe Akun <span class="wajib" aria-hidden="true">*</span></label>
                                    <div>
                                        <select id="akun-tipe"></select>
                                        <p id="galat-akun-tipe" class="pesan-galat-kolom" role="alert" hidden></p>
                                        <!-- Temuan 42: hanya peringatan, menyimpan tetap boleh (keputusan pengguna 2026-11-08) -->
                                        <p id="akun-peringatan-donasi" class="kotak-peringatan" role="status" hidden>Akun donasi dibuat lewat Kategori Donasi (menu Donasi), bukan di sini, supaya tidak ada akun donasi ganda. Akun Pendapatan di sini hanya untuk induk atau pendapatan selain donasi.</p>
                                    </div>
                                </div>

                                <!-- Sub Akun: tidak dicentang = akun ini menjadi induk (paling atas). Dicentang = kolom Cari/Pilih muncul
                                     di sebelahnya untuk memilih akun induk dari akun yang sudah ada (bertipe sama). -->
                                <div id="akun-induk-baris-luar" class="baris-form">
                                    <label class="saklar"><input type="checkbox" id="akun-sub"> <span>Sub Akun</span></label>
                                    <div>
                                        <div id="akun-induk-baris" class="pemilih-induk" hidden>
                                            <input id="akun-induk-cari" class="pemilih-cari" type="text" placeholder="Cari/Pilih..." autocomplete="off" role="combobox" aria-expanded="false" aria-controls="akun-induk-daftar" aria-label="Akun induk">
                                            <!-- Menyimpan id akun induk yang dipilih -->
                                            <input id="akun-induk" type="hidden">
                                            <ul id="akun-induk-daftar" class="pemilih-daftar" role="listbox" hidden></ul>
                                        </div>
                                        <p id="galat-akun-induk" class="pesan-galat-kolom" role="alert" hidden></p>
                                    </div>
                                </div>

                                <div class="baris-form">
                                    <label for="akun-kode">Kode Perkiraan</label>
                                    <div>
                                        <!-- Dibuat otomatis dari tipe akun dan induknya; tidak bisa diketik -->
                                        <input id="akun-kode" type="text" readonly placeholder="Dibuat otomatis">
                                        <p class="petunjuk">Dibuat otomatis mengikuti tipe akun dan akun induknya.</p>
                                        <p id="galat-akun-kode" class="pesan-galat-kolom" role="alert" hidden></p>
                                    </div>
                                </div>

                                <div class="baris-form">
                                    <label for="akun-nama">Nama <span class="wajib" aria-hidden="true">*</span></label>
                                    <div>
                                        <input id="akun-nama" type="text" autocomplete="off" aria-required="true">
                                        <p class="petunjuk">Contoh: BCA a/c XXX-XXX, dll</p>
                                        <p id="galat-akun-nama" class="pesan-galat-kolom" role="alert" hidden></p>
                                    </div>
                                </div>

                                <div class="baris-form">
                                    <label for="akun-catatan">Catatan</label>
                                    <textarea id="akun-catatan" rows="3"></textarea>
                                </div>

                                <div class="baris-form">
                                    <span class="label-kelompok">Non Aktif</span>
                                    <label class="saklar"><input type="checkbox" id="akun-nonaktif"> <span>Ya</span></label>
                                </div>

                                </div>

                                <!-- Informasi Bank: hanya untuk tipe Kas & Bank -->
                                <div id="akun-bank" class="form-kolom" hidden>
                                    <h3 class="fitur-grup">Informasi Bank</h3>
                                    <div class="baris-form">
                                        <label for="akun-nama-bank">Nama Bank</label>
                                        <input id="akun-nama-bank" type="text" autocomplete="off">
                                    </div>
                                    <div class="baris-form">
                                        <label for="akun-no-rekening">No Rekening</label>
                                        <input id="akun-no-rekening" type="text" inputmode="numeric" autocomplete="off">
                                    </div>
                                    <div class="baris-form">
                                        <label for="akun-atas-nama">Atas Nama Rekening</label>
                                        <input id="akun-atas-nama" type="text" autocomplete="off">
                                    </div>
                                </div>
                              </div>
                            </div>

                            <!-- ===== Tab Saldo ===== -->
                            <div id="sub-akun-saldo" class="sub-isi" hidden>
                                <h3 class="fitur-grup">Saldo Awal</h3>
                                <div class="baris-form">
                                    <label for="akun-saldo">Nilai (Rp)</label>
                                    <div>
                                        <input id="akun-saldo" type="text" inputmode="numeric" autocomplete="off" placeholder="0">
                                        <p id="galat-akun-saldo" class="pesan-galat-kolom" role="alert" hidden></p>
                                    </div>
                                </div>
                                <div class="baris-form">
                                    <label for="akun-tgl-saldo">per Tgl</label>
                                    <div>
                                        <div class="grup-tanggal">
                                            <input id="akun-tgl-saldo" type="date">
                                            <span id="akun-tgl-saldo-teks" class="tanggal-teks"></span>
                                        </div>
                                        <p id="galat-akun-tgl" class="pesan-galat-kolom" role="alert" hidden></p>
                                    </div>
                                </div>

                                <!-- Saldo Saat ini: hanya di tab Saldo dan hanya untuk akun yang sudah ada.
                                     Saldo induk = saldo sendiri + semua sub akunnya -->
                                <div id="akun-saldo-kini" class="blok-saldo-kini" hidden>
                                    <h3 class="fitur-grup">Saldo Saat ini</h3>
                                    <div class="kartu-saldo">
                                        <div class="kartu-saldo-baris">
                                            <span class="kartu-saldo-label">
                                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="3" y="6" width="18" height="13" rx="2"/><path d="M3 10h18"/><circle cx="16" cy="15" r="1.4"/></svg>
                                                Saldo
                                            </span>
                                            <strong id="akun-saldo-kini-nilai" class="kartu-saldo-nilai">Rp 0</strong>
                                        </div>
                                        <p class="kartu-saldo-catatan">Saldo saat ini akan mengikuti setiap transaksi yang terjadi.</p>
                                    </div>
                                </div>
                            </div>

                            <!-- ===== Tab Akun Anak (hanya akun yang sudah ada) ===== -->
                            <div id="sub-akun-anak" class="sub-isi" hidden>
                                <h3 class="fitur-grup">Akun Anak</h3>
                                <p class="petunjuk">Akun ini beserta semua sub akunnya. Klik salah satu baris untuk membukanya.</p>
                                <div class="bungkus-tabel">
                                    <table class="tabel-data tabel-anak">
                                        <thead><tr><th scope="col">Nama</th><th scope="col">Kode Perkiraan</th></tr></thead>
                                        <tbody id="akun-anak-isi"></tbody>
                                    </table>
                                </div>
                                <p id="akun-anak-kosong" class="petunjuk" hidden>Akun ini belum punya sub akun.</p>
                            </div>
                        </form>
                    </div>

                    <div class="modul-form-aksi">
                        <button type="submit" form="form-akun" class="tombol-simpan-besar" aria-label="Simpan" title="Simpan">
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M5 3h11l4 4v13a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1z"/><path d="M8 3v5h7V3"/><rect x="7" y="13" width="10" height="8" rx="1"/></svg>
                        </button>
                        <button type="button" class="tombol-hapus-besar" data-aksi="hapus" data-hanya-ubah hidden aria-label="Hapus" title="Hapus">
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M4 7h16M10 11v6M14 11v6M6 7l1 13h10l1-13M9 7V4h6v3"/></svg>
                        </button>
                    </div>
                </div>
            </section>
`);
