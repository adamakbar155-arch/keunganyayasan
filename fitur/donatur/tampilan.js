// ==================== Tampilan: Donasi: Donatur ====================
// HTML halaman Donatur (PRD 6.1; dari foto formulir dan daftar Pelanggan Accurate).
// Tiga tab kecil: Umum (dua kolom: Info Umum dan Info Lainnya), Lainnya (Catatan, Non Aktif), dan Riwayat Donasi
// (tabel donasi donatur ini, hanya dilihat; gayanya di fitur/donatur/donatur.css).
// Daftar (tombol hijau) dibuat otomatis oleh buatModulDaftar. Tab kecil memakai alat bersama di umum/inti.js (data-subtab).
// Logikanya: fitur/donatur/donatur.js. Gaya: gaya bersama formulir (form-pref, baris-form, dua-kolom seperti Karyawan,
// dan jurnal-nomor untuk saklar + isian sebaris seperti Nomor di Transfer).

pasangTampilan("tab-donatur", /*html*/ `
                <div class="tab" id="tab-donatur" hidden>
                    <button type="button" class="tab-judul" data-tab="donatur">Donatur</button>
                    <button type="button" class="tab-tutup" data-tutup="donatur" aria-label="Tutup tab Donatur">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" aria-hidden="true"><path d="M6 6l12 12M18 6L6 18"/></svg>
                    </button>
                </div>
`);

pasangTampilan("isi-donatur", /*html*/ `
            <!-- ===== Isi tab Donatur (komponen daftar dibuat otomatis oleh buatModulDaftar) ===== -->
            <section id="isi-donatur" class="isi-tab" hidden>
                <div class="modul-form">
                    <div class="modul-form-kiri">
                        <!-- Tiga tab kecil: Umum, Lainnya, Riwayat Donasi -->
                        <div class="sub-tab-baris" role="tablist">
                            <button type="button" class="sub-tab aktif" data-subtab="dn-umum">Umum</button>
                            <button type="button" class="sub-tab" data-subtab="dn-lainnya">Lainnya</button>
                            <button type="button" class="sub-tab" data-subtab="dn-riwayat">Riwayat Donasi</button>
                        </div>

                        <form id="form-donatur" class="form-pref" novalidate>
                            <!-- ===== Tab Umum: dua kolom (Info Umum dan Info Lainnya), seperti Accurate ===== -->
                            <div id="sub-dn-umum" class="sub-isi">
                                <div class="dua-kolom">
                                    <div>
                                        <h3 class="fitur-grup">Info Umum</h3>
                                        <div class="baris-form">
                                            <label for="dn-nama">Nama <span class="wajib" aria-hidden="true">*</span></label>
                                            <div>
                                                <input id="dn-nama" type="text" autocomplete="off" aria-required="true">
                                                <p id="galat-dn-nama" class="pesan-galat-kolom" role="alert" hidden></p>
                                            </div>
                                        </div>

                                        <!-- Saklar menyala: ID dibuat otomatis (D.00001, ...). Dimatikan: ID diketik sendiri. -->
                                        <div class="baris-form">
                                            <label for="dn-id">ID Donatur <span class="wajib" aria-hidden="true">*</span></label>
                                            <div>
                                                <div class="jurnal-nomor">
                                                    <label class="saklar" title="ID dibuat otomatis"><input type="checkbox" id="dn-id-otomatis" checked aria-label="ID otomatis"> <span>Otomatis</span></label>
                                                    <input id="dn-id" type="text" autocomplete="off" aria-required="true">
                                                </div>
                                                <p id="galat-dn-id" class="pesan-galat-kolom" role="alert" hidden></p>
                                            </div>
                                        </div>

                                        <!-- Kategori: pilih dari yang sudah pernah dipakai, atau ketik nama baru -->
                                        <div class="baris-form">
                                            <label for="dn-kategori">Kategori</label>
                                            <div>
                                                <input id="dn-kategori" type="text" autocomplete="off" list="dn-daftar-kategori" placeholder="Pilih atau ketik baru, misalnya Perorangan">
                                                <datalist id="dn-daftar-kategori"></datalist>
                                            </div>
                                        </div>
                                        <div class="baris-form">
                                            <label for="dn-telepon">No. Telepon</label>
                                            <input id="dn-telepon" type="tel" autocomplete="off">
                                        </div>
                                        <div class="baris-form">
                                            <label for="dn-hp">Handphone</label>
                                            <input id="dn-hp" type="tel" autocomplete="off">
                                        </div>
                                        <div class="baris-form">
                                            <label for="dn-wa">No. WhatsApp</label>
                                            <input id="dn-wa" type="tel" autocomplete="off">
                                        </div>
                                        <div class="baris-form">
                                            <label for="dn-email">Email</label>
                                            <input id="dn-email" type="email" autocomplete="off" placeholder="Email">
                                        </div>
                                    </div>

                                    <div>
                                        <h3 class="fitur-grup">Info Lainnya</h3>
                                        <!-- Alamat singkat (PRD 6.1): hanya Jalan dan Kota -->
                                        <div class="baris-form">
                                            <label for="dn-jalan">Alamat</label>
                                            <textarea id="dn-jalan" rows="3" placeholder="Jalan"></textarea>
                                        </div>
                                        <div class="baris-form">
                                            <label for="dn-kota">Kota</label>
                                            <input id="dn-kota" type="text" autocomplete="off" placeholder="Kota">
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <!-- ===== Tab Lainnya ===== -->
                            <div id="sub-dn-lainnya" class="sub-isi" hidden>
                                <h3 class="fitur-grup">Lainnya</h3>
                                <div class="baris-form">
                                    <label for="dn-catatan">Catatan</label>
                                    <textarea id="dn-catatan" rows="4"></textarea>
                                </div>
                                <!-- Non Aktif: donatur tetap tersimpan, tetapi tidak muncul di pilihan Donatur saat mencatat donasi baru -->
                                <div class="baris-form">
                                    <label for="dn-nonaktif">Non Aktif</label>
                                    <div>
                                        <label class="saklar"><input type="checkbox" id="dn-nonaktif"> <span>Ya</span></label>
                                        <small class="petunjuk">Donatur Non Aktif tidak muncul lagi di pilihan Donatur saat mencatat donasi baru. Hamba Allah tidak bisa dinonaktifkan.</small>
                                    </div>
                                </div>
                            </div>

                            <!-- ===== Tab Riwayat Donasi (PRD 6.1, rancangan sendiri karena di Accurate tidak ada): hanya untuk dilihat ===== -->
                            <!-- Pilihan Tahun berkelas pilih-filter supaya tetap kotak pilihan biasa (bukan isian formulir berlabel). -->
                            <div id="sub-dn-riwayat" class="sub-isi" hidden>
                                <div class="riwayat-dn-alat">
                                    <label for="dn-riwayat-tahun">Tahun</label>
                                    <select id="dn-riwayat-tahun" class="pilih-filter"></select>
                                </div>
                                <p id="dn-riwayat-kosong" class="petunjuk" hidden></p>
                                <div class="bungkus-tabel riwayat-dn-gulir">
                                    <table class="tabel-data" aria-label="Riwayat Donasi">
                                        <thead>
                                            <tr>
                                                <th scope="col">Tanggal</th>
                                                <th scope="col">No Bukti</th>
                                                <th scope="col">Nama Donasi</th>
                                                <th scope="col">Kas/Bank</th>
                                                <th scope="col" class="sel-kanan">Nilai</th>
                                            </tr>
                                        </thead>
                                        <tbody id="dn-riwayat-isi"></tbody>
                                    </table>
                                </div>
                                <p id="dn-riwayat-total" class="riwayat-dn-total"></p>
                            </div>
                        </form>
                    </div>

                    <!-- Tombol di sisi kanan. data-hanya-ubah = hanya tampil saat mengubah data yang sudah ada. -->
                    <div class="modul-form-aksi">
                        <button type="submit" form="form-donatur" class="tombol-simpan-besar" aria-label="Simpan" title="Simpan">
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M5 3h11l4 4v13a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1z"/><path d="M8 3v5h7V3"/><rect x="7" y="13" width="10" height="8" rx="1"/></svg>
                        </button>
                        <button type="button" class="tombol-hapus-besar" data-aksi="hapus" data-hanya-ubah hidden aria-label="Hapus" title="Hapus">
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M4 7h16M10 11v6M14 11v6M6 7l1 13h10l1-13M9 7V4h6v3"/></svg>
                        </button>
                    </div>
                </div>
            </section>
`);
