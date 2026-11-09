// ==================== Tampilan: Master Data: Divisi, Program, Karyawan, Gaji/Tunjangan ====================
// HTML halaman dan popup fitur ini. Dipasang ke index.html lewat pasangTampilan (umum/pasang-tampilan.js)
// di tempat penanda <template data-tempat="...">. Logikanya ada di file .js lain di folder yang sama.
// Tanda /*html*/ membantu editor (misalnya ekstensi VS Code "es6-string-html") mewarnai teks sebagai HTML.

pasangTampilan("tab-divisi", /*html*/ `
                <div class="tab" id="tab-divisi" hidden>
                    <button type="button" class="tab-judul" data-tab="divisi">Divisi</button>
                    <button type="button" class="tab-tutup" data-tutup="divisi" aria-label="Tutup tab Divisi">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" aria-hidden="true"><path d="M6 6l12 12M18 6L6 18"/></svg>
                    </button>
                </div>
`);

pasangTampilan("tab-program", /*html*/ `
                <div class="tab" id="tab-program" hidden>
                    <button type="button" class="tab-judul" data-tab="program">Program</button>
                    <button type="button" class="tab-tutup" data-tutup="program" aria-label="Tutup tab Program">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" aria-hidden="true"><path d="M6 6l12 12M18 6L6 18"/></svg>
                    </button>
                </div>
`);

pasangTampilan("tab-karyawan", /*html*/ `
                <div class="tab" id="tab-karyawan" hidden>
                    <button type="button" class="tab-judul" data-tab="karyawan">Karyawan</button>
                    <button type="button" class="tab-tutup" data-tutup="karyawan" aria-label="Tutup tab Karyawan">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" aria-hidden="true"><path d="M6 6l12 12M18 6L6 18"/></svg>
                    </button>
                </div>
`);

pasangTampilan("tab-gaji", /*html*/ `
                <div class="tab" id="tab-gaji" hidden>
                    <button type="button" class="tab-judul" data-tab="gaji">Gaji/Tunjangan</button>
                    <button type="button" class="tab-tutup" data-tutup="gaji" aria-label="Tutup tab Gaji/Tunjangan">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" aria-hidden="true"><path d="M6 6l12 12M18 6L6 18"/></svg>
                    </button>
                </div>
`);

pasangTampilan("isi-divisi", /*html*/ `
            <!-- ===== Isi tab Divisi =====
                 Barisan atas (tombol hijau + tab) dan tampilan daftar dibuat otomatis oleh JavaScript
                 lewat buatModulDaftar(). Di sini hanya tampilan formulir "Data Baru". -->
            <section id="isi-divisi" class="isi-tab" hidden>
                <div class="modul-form">
                    <div class="modul-form-kiri">
                        <div class="sub-tab-baris">
                            <span class="sub-tab aktif">Divisi</span>
                        </div>
                        <form id="form-divisi" class="form-pref" novalidate>
                            <div class="sub-isi">
                                <h3 class="fitur-grup">Info Umum</h3>

                                <!-- Nama wajib diisi. Pesan kesalahan muncul di bawah kolom, bukan lewat alert. -->
                                <div class="baris-form">
                                    <label for="divisi-nama">Nama <span class="wajib" aria-hidden="true">*</span></label>
                                    <div>
                                        <input id="divisi-nama" type="text" autocomplete="off" aria-required="true">
                                        <p id="galat-divisi-nama" class="pesan-galat-kolom" role="alert" hidden></p>
                                    </div>
                                </div>
                                <div class="baris-form">
                                    <label for="divisi-keterangan">Keterangan</label>
                                    <textarea id="divisi-keterangan" rows="4"></textarea>
                                </div>
                            </div>
                        </form>
                    </div>

                    <!-- Tombol di sisi kanan. Atribut form="form-divisi" menghubungkan tombol simpan ke formulir di sebelahnya.
                         data-hanya-ubah = tombol ini hanya tampil saat mengubah data yang sudah ada. -->
                    <div class="modul-form-aksi">
                        <button type="submit" form="form-divisi" class="tombol-simpan-besar" aria-label="Simpan" title="Simpan">
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M5 3h11l4 4v13a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1z"/><path d="M8 3v5h7V3"/><rect x="7" y="13" width="10" height="8" rx="1"/></svg>
                        </button>
                        <button type="button" class="tombol-hapus-besar" data-aksi="hapus" data-hanya-ubah hidden aria-label="Hapus" title="Hapus">
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M4 7h16M10 11v6M14 11v6M6 7l1 13h10l1-13M9 7V4h6v3"/></svg>
                        </button>
                    </div>
                </div>
            </section>
`);

pasangTampilan("isi-program", /*html*/ `
            <!-- ===== Isi tab Program (komponen daftar dibuat otomatis oleh buatModulDaftar) ===== -->
            <section id="isi-program" class="isi-tab" hidden>
                <div class="modul-form">
                    <div class="modul-form-kiri">
                        <div class="sub-tab-baris">
                            <span class="sub-tab aktif">Program</span>
                        </div>
                        <form id="form-program" class="form-pref" novalidate>
                            <div class="sub-isi">
                                <h3 class="fitur-grup">Info Umum</h3>

                                <div class="baris-form">
                                    <label for="program-nama">Nama <span class="wajib" aria-hidden="true">*</span></label>
                                    <div>
                                        <input id="program-nama" type="text" autocomplete="off" aria-required="true">
                                        <p id="galat-program-nama" class="pesan-galat-kolom" role="alert" hidden></p>
                                    </div>
                                </div>

                                <!-- Baris Divisi disembunyikan kalau saklar Divisi di Preferensi → Fitur dimatikan -->
                                <div id="baris-program-divisi" class="baris-form">
                                    <label for="program-divisi">Divisi <span class="wajib" aria-hidden="true">*</span></label>
                                    <div>
                                        <select id="program-divisi" aria-required="true"></select>
                                        <p id="petunjuk-program-divisi" class="petunjuk" hidden>Belum ada divisi. Buat dulu di Master Data &rarr; Divisi.</p>
                                        <p id="galat-program-divisi" class="pesan-galat-kolom" role="alert" hidden></p>
                                    </div>
                                </div>

                                <!-- Isian "Sifat Dana" dihapus (PRD Keputusan 8a, 2026-10-26): Program = bidang di bawah Divisi,
                                     bukan penanda dana terikat. Terikat/tidak terikat ditentukan akun donasi dan centang Terikat. -->
                                <div class="baris-form">
                                    <label for="program-status">Status <span class="wajib" aria-hidden="true">*</span></label>
                                    <div>
                                        <!-- Data Baru mulai dari "Silakan Pilih" (PRD 5.3a) -->
                                        <select id="program-status" aria-required="true">
                                            <option value="">Silakan Pilih</option>
                                            <option value="aktif">Aktif</option>
                                            <option value="selesai">Selesai</option>
                                        </select>
                                        <p id="galat-program-status" class="pesan-galat-kolom" role="alert" hidden></p>
                                    </div>
                                </div>

                                <div class="baris-form">
                                    <label for="program-keterangan">Keterangan</label>
                                    <textarea id="program-keterangan" rows="4"></textarea>
                                </div>
                            </div>
                        </form>
                    </div>

                    <div class="modul-form-aksi">
                        <button type="submit" form="form-program" class="tombol-simpan-besar" aria-label="Simpan" title="Simpan">
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M5 3h11l4 4v13a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1z"/><path d="M8 3v5h7V3"/><rect x="7" y="13" width="10" height="8" rx="1"/></svg>
                        </button>
                        <button type="button" class="tombol-hapus-besar" data-aksi="hapus" data-hanya-ubah hidden aria-label="Hapus" title="Hapus">
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M4 7h16M10 11v6M14 11v6M6 7l1 13h10l1-13M9 7V4h6v3"/></svg>
                        </button>
                    </div>
                </div>
            </section>
`);

pasangTampilan("isi-karyawan", /*html*/ `
            <!-- ===== Isi tab Karyawan (komponen daftar dibuat otomatis oleh buatModulDaftar) ===== -->
            <section id="isi-karyawan" class="isi-tab" hidden>
                <div class="modul-form">
                    <div class="modul-form-kiri">
                        <!-- Tiga tab kecil: Karyawan, Alamat, Rekening Gaji -->
                        <div class="sub-tab-baris" role="tablist">
                            <button type="button" class="sub-tab aktif" data-subtab="kar-data">Karyawan</button>
                            <button type="button" class="sub-tab" data-subtab="kar-alamat">Alamat</button>
                            <button type="button" class="sub-tab" data-subtab="kar-rekening">Rekening Gaji</button>
                        </div>

                        <form id="form-karyawan" class="form-pref" novalidate>

                            <!-- ===== Tab Karyawan: dua kolom (Data Pribadi dan Data Karyawan) ===== -->
                            <div id="sub-kar-data" class="sub-isi">
                                <div class="dua-kolom">
                                    <div>
                                        <h3 class="fitur-grup">Data Pribadi</h3>
                                        <div class="baris-form">
                                            <label for="kar-nama">Nama Lengkap <span class="wajib" aria-hidden="true">*</span></label>
                                            <div>
                                                <input id="kar-nama" type="text" autocomplete="off" aria-required="true">
                                                <p id="galat-kar-nama" class="pesan-galat-kolom" role="alert" hidden></p>
                                            </div>
                                        </div>
                                        <div class="baris-form">
                                            <label for="kar-ktp">No. KTP</label>
                                            <input id="kar-ktp" type="text" inputmode="numeric" autocomplete="off">
                                        </div>
                                        <div class="baris-form">
                                            <label for="kar-email">Email</label>
                                            <div>
                                                <input id="kar-email" type="email" autocomplete="off">
                                                <p id="galat-kar-email" class="pesan-galat-kolom" role="alert" hidden></p>
                                            </div>
                                        </div>
                                        <div class="baris-form">
                                            <label for="kar-hp">Handphone</label>
                                            <input id="kar-hp" type="tel" autocomplete="off">
                                        </div>
                                        <div class="baris-form">
                                            <label for="kar-wa">No. WhatsApp</label>
                                            <input id="kar-wa" type="tel" autocomplete="off">
                                        </div>
                                    </div>

                                    <div>
                                        <h3 class="fitur-grup">Data Karyawan</h3>
                                        <div class="baris-form">
                                            <label for="kar-nomor">Nomor Pegawai <span class="wajib" aria-hidden="true">*</span></label>
                                            <div>
                                                <input id="kar-nomor" type="text" autocomplete="off" aria-required="true">
                                                <p id="galat-kar-nomor" class="pesan-galat-kolom" role="alert" hidden></p>
                                            </div>
                                        </div>
                                        <div class="baris-form">
                                            <label for="kar-jabatan">Posisi Jabatan</label>
                                            <input id="kar-jabatan" type="text" autocomplete="off">
                                        </div>
                                        <div class="baris-form">
                                            <label for="kar-tgl-masuk">Tgl Masuk</label>
                                            <div class="grup-tanggal">
                                                <input id="kar-tgl-masuk" type="date">
                                                <span id="kar-tgl-teks" class="tanggal-teks"></span>
                                            </div>
                                        </div>
                                        <div class="baris-form">
                                            <label for="kar-catatan">Catatan</label>
                                            <textarea id="kar-catatan" rows="4"></textarea>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <!-- ===== Tab Alamat ===== -->
                            <div id="sub-kar-alamat" class="sub-isi" hidden>
                                <h3 class="fitur-grup">Info Alamat</h3>
                                <div class="baris-form">
                                    <label for="kar-jalan">Alamat</label>
                                    <textarea id="kar-jalan" rows="3" placeholder="Jalan"></textarea>
                                </div>
                                <div class="baris-form">
                                    <label for="kar-kota">Kota</label>
                                    <input id="kar-kota" type="text" autocomplete="off">
                                </div>
                                <div class="baris-form">
                                    <label for="kar-kodepos">Kode Pos</label>
                                    <input id="kar-kodepos" type="text" inputmode="numeric" autocomplete="off">
                                </div>
                                <div class="baris-form">
                                    <label for="kar-provinsi">Provinsi</label>
                                    <input id="kar-provinsi" type="text" autocomplete="off">
                                </div>
                            </div>

                            <!-- ===== Tab Rekening Gaji ===== -->
                            <div id="sub-kar-rekening" class="sub-isi" hidden>
                                <h3 class="fitur-grup">Info Akun</h3>
                                <div class="baris-form">
                                    <label for="kar-bank">Nama Bank</label>
                                    <!-- Kolom isian dengan saran nama bank (datalist). Nama bank lain tetap bisa diketik sendiri. -->
                                    <input id="kar-bank" type="text" list="daftar-bank" placeholder="Cari/Pilih..." autocomplete="off">
                                    <datalist id="daftar-bank">
                                        <option value="BCA"></option>
                                        <option value="BRI"></option>
                                        <option value="BNI"></option>
                                        <option value="Bank Mandiri"></option>
                                        <option value="BSI (Bank Syariah Indonesia)"></option>
                                        <option value="Bank Muamalat"></option>
                                        <option value="CIMB Niaga"></option>
                                        <option value="Bank Permata"></option>
                                        <option value="Bank Danamon"></option>
                                        <option value="BTN"></option>
                                        <option value="Bank Mega"></option>
                                        <option value="Bank BJB"></option>
                                    </datalist>
                                </div>
                                <div class="baris-form">
                                    <label for="kar-norek">No Rekening</label>
                                    <input id="kar-norek" type="text" inputmode="numeric" autocomplete="off">
                                </div>
                                <div class="baris-form">
                                    <label for="kar-atasnama">Atas Nama Rekening</label>
                                    <input id="kar-atasnama" type="text" autocomplete="off">
                                </div>
                            </div>
                        </form>
                    </div>

                    <div class="modul-form-aksi">
                        <button type="submit" form="form-karyawan" class="tombol-simpan-besar" aria-label="Simpan" title="Simpan">
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M5 3h11l4 4v13a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1z"/><path d="M8 3v5h7V3"/><rect x="7" y="13" width="10" height="8" rx="1"/></svg>
                        </button>
                        <button type="button" class="tombol-hapus-besar" data-aksi="hapus" data-hanya-ubah hidden aria-label="Hapus" title="Hapus">
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M4 7h16M10 11v6M14 11v6M6 7l1 13h10l1-13M9 7V4h6v3"/></svg>
                        </button>
                    </div>
                </div>
            </section>
`);

pasangTampilan("isi-gaji", /*html*/ `
            <!-- ===== Isi tab Gaji/Tunjangan (komponen daftar dibuat otomatis oleh buatModulDaftar) ===== -->
            <section id="isi-gaji" class="isi-tab" hidden>
                <div class="modul-form">
                    <div class="modul-form-kiri">
                        <div class="sub-tab-baris">
                            <span class="sub-tab aktif">Gaji/Tunjangan</span>
                        </div>
                        <form id="form-gaji" class="form-pref" novalidate>
                            <div class="sub-isi">
                                <h3 class="fitur-grup">Info Umum</h3>

                                <div class="baris-form">
                                    <label for="gaji-nama">Nama <span class="wajib" aria-hidden="true">*</span></label>
                                    <div>
                                        <input id="gaji-nama" type="text" autocomplete="off" aria-required="true">
                                        <p id="galat-gaji-nama" class="pesan-galat-kolom" role="alert" hidden></p>
                                    </div>
                                </div>

                                <div class="baris-form">
                                    <label for="gaji-tipe">Tipe Gaji/Tunjangan <span class="wajib" aria-hidden="true">*</span></label>
                                    <div>
                                        <select id="gaji-tipe" aria-required="true"></select>
                                        <p id="galat-gaji-tipe" class="pesan-galat-kolom" role="alert" hidden></p>
                                    </div>
                                </div>

                                <!-- Hanya tampilan: diisi otomatis dari tipe yang dipilih -->
                                <div class="baris-form">
                                    <label for="gaji-bayar-potong">Bayar/Potong</label>
                                    <input id="gaji-bayar-potong" type="text" readonly>
                                </div>

                                <div class="baris-form">
                                    <label for="gaji-akun">Akun Beban <span id="tanda-wajib-akun" class="wajib" aria-hidden="true" hidden>*</span></label>
                                    <div>
                                        <select id="gaji-akun"></select>
                                        <p id="petunjuk-gaji-akun" class="petunjuk" hidden>Belum ada akun bertipe Beban. Kolom ini baru wajib diisi setelah akun Beban dibuat di Akun Perkiraan.</p>
                                        <p id="galat-gaji-akun" class="pesan-galat-kolom" role="alert" hidden></p>
                                    </div>
                                </div>

                                <div class="baris-form">
                                    <span class="label-kelompok">Non Aktif</span>
                                    <label class="saklar"><input type="checkbox" id="gaji-nonaktif"> <span>Ya</span></label>
                                </div>
                            </div>
                        </form>
                    </div>

                    <div class="modul-form-aksi">
                        <button type="submit" form="form-gaji" class="tombol-simpan-besar" aria-label="Simpan" title="Simpan">
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M5 3h11l4 4v13a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1z"/><path d="M8 3v5h7V3"/><rect x="7" y="13" width="10" height="8" rx="1"/></svg>
                        </button>
                        <button type="button" class="tombol-hapus-besar" data-aksi="hapus" data-hanya-ubah hidden aria-label="Hapus" title="Hapus">
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M4 7h16M10 11v6M14 11v6M6 7l1 13h10l1-13M9 7V4h6v3"/></svg>
                        </button>
                    </div>
                </div>
            </section>
`);
