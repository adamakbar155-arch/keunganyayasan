// ==================== Tampilan: Donasi: Kategori Donasi ====================
// HTML halaman Kategori Donasi (PRD 6.1; dari foto formulir Barang & Jasa Accurate, fungsinya diubah untuk membuat
// akun donasi). Dua tab kecil: Umum (Nama Donasi, Sub dari, Kode Donasi, Kelompok) dan Lainnya (Catatan).
// Daftar (tombol hijau) dibuat otomatis oleh buatModulDaftar. Tab kecil memakai alat bersama di umum/inti.js (data-subtab).
// Logikanya: fitur/kategori-donasi/kategori-donasi.js. Gaya: gaya bersama formulir (form-pref, baris-form).
// Tanda /*html*/ membantu editor (misalnya ekstensi VS Code "es6-string-html") mewarnai teks sebagai HTML.

pasangTampilan("tab-kategori-donasi", /*html*/ `
                <div class="tab" id="tab-kategori-donasi" hidden>
                    <button type="button" class="tab-judul" data-tab="kategori-donasi">Kategori Donasi</button>
                    <button type="button" class="tab-tutup" data-tutup="kategori-donasi" aria-label="Tutup tab Kategori Donasi">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" aria-hidden="true"><path d="M6 6l12 12M18 6L6 18"/></svg>
                    </button>
                </div>
`);

pasangTampilan("isi-kategori-donasi", /*html*/ `
            <!-- ===== Isi tab Kategori Donasi (komponen daftar dibuat otomatis oleh buatModulDaftar) ===== -->
            <section id="isi-kategori-donasi" class="isi-tab" hidden>
                <div class="modul-form">
                    <div class="modul-form-kiri">
                        <!-- Dua tab kecil: Umum dan Lainnya -->
                        <div class="sub-tab-baris" role="tablist">
                            <button type="button" class="sub-tab aktif" data-subtab="kd-umum">Umum</button>
                            <button type="button" class="sub-tab" data-subtab="kd-lainnya">Lainnya</button>
                        </div>

                        <form id="form-kategori-donasi" class="form-pref" novalidate>
                            <!-- ===== Tab Umum ===== -->
                            <div id="sub-kd-umum" class="sub-isi">
                                <h3 class="fitur-grup">Informasi Kategori Donasi</h3>

                                <div class="baris-form">
                                    <label for="kd-nama">Nama Donasi <span class="wajib" aria-hidden="true">*</span></label>
                                    <div>
                                        <input id="kd-nama" type="text" autocomplete="off" aria-required="true" placeholder="Misalnya Infaq Umum">
                                        <p id="galat-kd-nama" class="pesan-galat-kolom" role="alert" hidden></p>
                                    </div>
                                </div>

                                <!-- Akun induk (bertipe Pendapatan, tingkat 1 atau 2): akun donasi dibuat sebagai sub akunnya -->
                                <div class="baris-form">
                                    <label for="kd-induk">Sub dari <span class="wajib" aria-hidden="true">*</span></label>
                                    <div>
                                        <select id="kd-induk" aria-required="true"></select>
                                        <p id="petunjuk-kd-induk" class="petunjuk" hidden>Belum ada akun Pendapatan yang bisa menjadi induk. Buat dulu di Buku Besar &rarr; Akun Perkiraan.</p>
                                        <p id="galat-kd-induk" class="pesan-galat-kolom" role="alert" hidden></p>
                                    </div>
                                </div>

                                <!-- Kode Donasi = kode akunnya: otomatis dari induk (kode induk + 2 digit), terkunci -->
                                <div class="baris-form">
                                    <label for="kd-kode">Kode Donasi</label>
                                    <div>
                                        <input id="kd-kode" type="text" readonly aria-readonly="true" placeholder="Otomatis setelah memilih Sub dari">
                                        <small class="petunjuk">Kode akun dibuat otomatis dari akun induknya dan tidak bisa diubah.</small>
                                    </div>
                                </div>

                                <!-- Kelompok: pilih dari daftar yang sudah ada, atau ketik nama baru -->
                                <div class="baris-form">
                                    <label for="kd-kelompok">Kelompok</label>
                                    <div>
                                        <input id="kd-kelompok" type="text" autocomplete="off" list="kd-daftar-kelompok" placeholder="Pilih atau ketik baru, misalnya Zakat">
                                        <datalist id="kd-daftar-kelompok"></datalist>
                                    </div>
                                </div>
                            </div>

                            <!-- ===== Tab Lainnya ===== -->
                            <div id="sub-kd-lainnya" class="sub-isi" hidden>
                                <h3 class="fitur-grup">Lainnya</h3>
                                <div class="baris-form">
                                    <label for="kd-catatan">Catatan</label>
                                    <textarea id="kd-catatan" rows="4"></textarea>
                                </div>
                            </div>
                        </form>
                    </div>

                    <!-- Tombol di sisi kanan. data-hanya-ubah = hanya tampil saat mengubah data yang sudah ada. -->
                    <div class="modul-form-aksi">
                        <button type="submit" form="form-kategori-donasi" class="tombol-simpan-besar" aria-label="Simpan" title="Simpan">
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M5 3h11l4 4v13a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1z"/><path d="M8 3v5h7V3"/><rect x="7" y="13" width="10" height="8" rx="1"/></svg>
                        </button>
                        <button type="button" class="tombol-hapus-besar" data-aksi="hapus" data-hanya-ubah hidden aria-label="Hapus" title="Hapus">
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M4 7h16M10 11v6M14 11v6M6 7l1 13h10l1-13M9 7V4h6v3"/></svg>
                        </button>
                    </div>
                </div>
            </section>
`);
