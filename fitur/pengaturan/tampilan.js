// ==================== Tampilan: Pengaturan: Log Aktivitas, Pengguna, Penomoran ====================
// HTML halaman dan popup fitur ini. Dipasang ke index.html lewat pasangTampilan (umum/pasang-tampilan.js)
// di tempat penanda <template data-tempat="...">. Logikanya ada di file .js lain di folder yang sama.
// Tanda /*html*/ membantu editor (misalnya ekstensi VS Code "es6-string-html") mewarnai teks sebagai HTML.

pasangTampilan("tab-log", /*html*/ `
                <div class="tab" id="tab-log" hidden>
                    <button type="button" class="tab-judul" data-tab="log">Log Aktivitas</button>
                    <button type="button" class="tab-tutup" data-tutup="log" aria-label="Tutup tab Log Aktivitas">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" aria-hidden="true"><path d="M6 6l12 12M18 6L6 18"/></svg>
                    </button>
                </div>
`);

pasangTampilan("tab-pengguna", /*html*/ `
                <div class="tab" id="tab-pengguna" hidden>
                    <button type="button" class="tab-judul" data-tab="pengguna">Pengguna</button>
                    <button type="button" class="tab-tutup" data-tutup="pengguna" aria-label="Tutup tab Pengguna">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" aria-hidden="true"><path d="M6 6l12 12M18 6L6 18"/></svg>
                    </button>
                </div>
`);

pasangTampilan("tab-penomoran", /*html*/ `
                <div class="tab" id="tab-penomoran" hidden>
                    <button type="button" class="tab-judul" data-tab="penomoran">Penomoran</button>
                    <button type="button" class="tab-tutup" data-tutup="penomoran" aria-label="Tutup tab Penomoran">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" aria-hidden="true"><path d="M6 6l12 12M18 6L6 18"/></svg>
                    </button>
                </div>
`);

pasangTampilan("isi-log", /*html*/ `
            <!-- ===== Isi tab Log Aktivitas: hanya daftar, seluruh tampilannya dibuat otomatis oleh buatModulDaftar ===== -->
            <section id="isi-log" class="isi-tab" hidden></section>
`);

pasangTampilan("isi-pengguna", /*html*/ `
            <!-- ===== Isi tab Pengguna (komponen daftar dibuat otomatis oleh buatModulDaftar) ===== -->
            <section id="isi-pengguna" class="isi-tab" hidden>
                <div class="modul-form">
                    <div class="modul-form-kiri">
                        <div class="sub-tab-baris">
                            <span class="sub-tab aktif">Pengguna</span>
                        </div>
                        <form id="form-pengguna" class="form-pref" novalidate>
                            <div class="sub-isi">
                                <h3 class="fitur-grup">Info Pengguna</h3>

                                <div class="baris-form">
                                    <label for="pg-nama">Nama Lengkap <span class="wajib" aria-hidden="true">*</span></label>
                                    <div>
                                        <input id="pg-nama" type="text" autocomplete="off" aria-required="true">
                                        <p id="galat-pg-nama" class="pesan-galat-kolom" role="alert" hidden></p>
                                    </div>
                                </div>

                                <div class="baris-form">
                                    <label for="pg-username">Nama Pengguna <span class="wajib" aria-hidden="true">*</span></label>
                                    <div>
                                        <input id="pg-username" type="text" autocomplete="off" aria-required="true">
                                        <p class="petunjuk">Dipakai untuk masuk. Boleh karakter apa saja, tetapi tidak boleh sama dengan pengguna lain.</p>
                                        <p id="galat-pg-username" class="pesan-galat-kolom" role="alert" hidden></p>
                                    </div>
                                </div>

                                <div class="baris-form">
                                    <label for="pg-kontak">Email/No Handphone</label>
                                    <div>
                                        <input id="pg-kontak" type="text" autocomplete="off">
                                        <p class="petunjuk">Boleh dikosongkan. Kalau diisi, boleh dipakai untuk masuk juga.</p>
                                        <p id="galat-pg-kontak" class="pesan-galat-kolom" role="alert" hidden></p>
                                    </div>
                                </div>

                                <div class="baris-form">
                                    <label for="pg-sandi"><span id="label-pg-sandi">Kata Sandi Awal</span> <span id="tanda-wajib-pg-sandi" class="wajib" aria-hidden="true">*</span></label>
                                    <div>
                                        <input id="pg-sandi" type="password" autocomplete="new-password">
                                        <p id="petunjuk-pg-sandi" class="petunjuk">Kata sandi sementara. Pengguna wajib menggantinya saat pertama masuk.</p>
                                        <p id="galat-pg-sandi" class="pesan-galat-kolom" role="alert" hidden></p>
                                    </div>
                                </div>

                                <div class="baris-form">
                                    <label for="pg-peran">Peran <span class="wajib" aria-hidden="true">*</span></label>
                                    <div>
                                        <select id="pg-peran" aria-required="true"></select>
                                        <p id="petunjuk-pg-peran" class="petunjuk">Peran menentukan pembukuan yang boleh dibuka dan apa yang boleh dilakukan.</p>
                                        <p id="galat-pg-peran" class="pesan-galat-kolom" role="alert" hidden></p>
                                    </div>
                                </div>

                                <div class="baris-form">
                                    <span class="label-kelompok" id="label-pg-pembukuan">Pembukuan yang boleh dibuka <span class="wajib" aria-hidden="true">*</span></span>
                                    <div role="group" aria-labelledby="label-pg-pembukuan">
                                        <ul class="fitur-daftar">
                                            <li><label class="saklar"><input type="checkbox" name="pg-pembukuan" value="yayasan"> <span>Yayasan</span></label></li>
                                            <li><label class="saklar"><input type="checkbox" name="pg-pembukuan" value="sekolah"> <span>Sekolah</span></label></li>
                                            <li><label class="saklar"><input type="checkbox" name="pg-pembukuan" value="unit-usaha"> <span>Unit usaha</span></label></li>
                                        </ul>
                                        <p id="galat-pg-pembukuan" class="pesan-galat-kolom" role="alert" hidden></p>
                                    </div>
                                </div>

                                <div class="baris-form">
                                    <span class="label-kelompok">Non Aktif</span>
                                    <div>
                                        <label class="saklar"><input type="checkbox" id="pg-nonaktif"> <span>Ya</span></label>
                                        <p class="petunjuk">Pengguna yang tidak bertugas lagi sebaiknya dinonaktifkan, bukan dihapus, supaya jejaknya di Log Aktivitas tetap utuh.</p>
                                    </div>
                                </div>
                            </div>
                        </form>
                    </div>

                    <div class="modul-form-aksi">
                        <button type="submit" form="form-pengguna" class="tombol-simpan-besar" aria-label="Simpan" title="Simpan">
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M5 3h11l4 4v13a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1z"/><path d="M8 3v5h7V3"/><rect x="7" y="13" width="10" height="8" rx="1"/></svg>
                        </button>
                        <button type="button" class="tombol-hapus-besar" data-aksi="hapus" data-hanya-ubah hidden aria-label="Hapus" title="Hapus">
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M4 7h16M10 11v6M14 11v6M6 7l1 13h10l1-13M9 7V4h6v3"/></svg>
                        </button>
                    </div>
                </div>
            </section>
`);

pasangTampilan("isi-penomoran", /*html*/ `
            <!-- ===== Isi tab Penomoran (komponen daftar dibuat otomatis oleh buatModulDaftar) ===== -->
            <section id="isi-penomoran" class="isi-tab" hidden>
                <div class="modul-form">
                    <div class="modul-form-kiri">
                        <div class="sub-tab-baris">
                            <span class="sub-tab aktif">Penomoran</span>
                        </div>
                        <form id="form-penomoran" class="form-pref" novalidate>
                            <div class="sub-isi">
                                <h3 class="fitur-grup">Info Penomoran</h3>

                                <div class="baris-form">
                                    <label for="pn-nama">Nama <span class="wajib" aria-hidden="true">*</span></label>
                                    <div>
                                        <input id="pn-nama" type="text" autocomplete="off" aria-required="true">
                                        <p id="galat-pn-nama" class="pesan-galat-kolom" role="alert" hidden></p>
                                    </div>
                                </div>

                                <div class="baris-form">
                                    <label for="pn-tipe">Tipe Transaksi <span class="wajib" aria-hidden="true">*</span></label>
                                    <div>
                                        <select id="pn-tipe" aria-required="true"></select>
                                        <p id="galat-pn-tipe" class="pesan-galat-kolom" role="alert" hidden></p>
                                    </div>
                                </div>

                                <!-- Hanya untuk Pembayaran dan Penerimaan: aturan ini dipakai otomatis saat Kas/Bank itu dipilih (PRD 6.3) -->
                                <div id="baris-pn-kas" class="baris-form" hidden>
                                    <label for="pn-kas">Kas/Bank</label>
                                    <div>
                                        <select id="pn-kas"></select>
                                        <p id="galat-pn-kas" class="pesan-galat-kolom" role="alert" hidden></p>
                                        <p class="petunjuk">Saat Kas/Bank ini dipilih di transaksi, aturan ini terpilih otomatis (tetap bisa diganti).</p>
                                    </div>
                                </div>

                                <!-- Hanya satu pilihan yang dipakai, jadi ditampilkan saja (tidak bisa diubah) -->
                                <div class="baris-form">
                                    <label for="pn-reset">Tipe Penomoran</label>
                                    <input id="pn-reset" type="text" value="Reset setiap bulan" readonly>
                                </div>

                                <div class="baris-form">
                                    <label for="pn-digit">Jumlah Digit Counter <span class="wajib" aria-hidden="true">*</span></label>
                                    <div>
                                        <input id="pn-digit" type="number" min="1" max="10" aria-required="true" class="kolom-angka">
                                        <p id="galat-pn-digit" class="pesan-galat-kolom" role="alert" hidden></p>
                                    </div>
                                </div>

                                <div class="baris-form">
                                    <label for="pn-jenis">Komponen Penomoran</label>
                                    <div>
                                        <!-- Pilih jenis komponen lalu klik +. Untuk "Teks Pemisah", kolom teks muncul. -->
                                        <div class="grup-komponen">
                                            <select id="pn-jenis"></select>
                                            <input id="pn-teks" type="text" maxlength="12" placeholder="Teks, misalnya / atau DON" aria-label="Isi teks pemisah" autocomplete="off" hidden>
                                            <button type="button" id="pn-tambah" class="tombol tombol-utama" aria-label="Tambah komponen" title="Tambah komponen">
                                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.8" stroke-linecap="round" aria-hidden="true"><path d="M12 5v14M5 12h14"/></svg>
                                            </button>
                                        </div>
                                        <!-- Komponen yang sudah ditambahkan, berurutan dari kiri ke kanan -->
                                        <div id="pn-komponen" class="pemilih-chip daftar-komponen" aria-live="polite"></div>
                                        <p id="galat-pn-komponen" class="pesan-galat-kolom" role="alert" hidden></p>
                                        <div class="kotak-contoh">
                                            <div>Contoh Hasil Penomoran</div>
                                            <div class="nomor-contoh" id="pn-contoh">-</div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </form>
                    </div>

                    <div class="modul-form-aksi">
                        <button type="submit" form="form-penomoran" class="tombol-simpan-besar" aria-label="Simpan" title="Simpan">
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M5 3h11l4 4v13a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1z"/><path d="M8 3v5h7V3"/><rect x="7" y="13" width="10" height="8" rx="1"/></svg>
                        </button>
                        <button type="button" class="tombol-hapus-besar" data-aksi="hapus" data-hanya-ubah hidden aria-label="Hapus" title="Hapus">
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M4 7h16M10 11v6M14 11v6M6 7l1 13h10l1-13M9 7V4h6v3"/></svg>
                        </button>
                    </div>
                </div>
            </section>
`);
