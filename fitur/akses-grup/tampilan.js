// ==================== Tampilan: Pengaturan: Akses Grup ====================
// HTML halaman Akses Grup (PRD 6.14, dari foto Accurate). Dua tab kecil:
//   - Umum: Nama Grup, Pembatasan Akses, Daftar Pengguna (pilih beberapa Operator);
//   - Hak Akses: kelompok menu di kiri; di kanan kotak Cari, Salin Hak, dan tabel Hak Akses | Aktif | Buat | Ubah | Hapus | Lihat.
// Baris tabel dan tombol kelompok dibuat oleh fitur/akses-grup/akses-grup.js dari daftar menu di umum/hak-akses.js.
// Daftar (tombol hijau) dibuat otomatis oleh buatModulDaftar. Tab kecil memakai alat bersama di umum/inti.js (data-subtab).
// Tanda /*html*/ membantu editor (misalnya ekstensi VS Code "es6-string-html") mewarnai teks sebagai HTML.

pasangTampilan("tab-akses-grup", /*html*/ `
                <div class="tab" id="tab-akses-grup" hidden>
                    <button type="button" class="tab-judul" data-tab="akses-grup">Akses Grup</button>
                    <button type="button" class="tab-tutup" data-tutup="akses-grup" aria-label="Tutup tab Akses Grup">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" aria-hidden="true"><path d="M6 6l12 12M18 6L6 18"/></svg>
                    </button>
                </div>
`);

pasangTampilan("isi-akses-grup", /*html*/ `
            <!-- ===== Isi tab Akses Grup (komponen daftar dibuat otomatis oleh buatModulDaftar) ===== -->
            <section id="isi-akses-grup" class="isi-tab" hidden>
                <div class="modul-form">
                    <div class="modul-form-kiri">
                        <div class="sub-tab-baris" role="tablist">
                            <button type="button" class="sub-tab aktif" data-subtab="ag-umum">Umum</button>
                            <button type="button" class="sub-tab" data-subtab="ag-hak">Hak Akses</button>
                        </div>

                        <form id="form-akses-grup" class="form-pref" novalidate>
                            <!-- ===== Tab Umum ===== -->
                            <div id="sub-ag-umum" class="sub-isi">
                                <h3 class="fitur-grup">Informasi Grup</h3>

                                <div class="baris-form">
                                    <label for="ag-nama">Nama Grup <span class="wajib" aria-hidden="true">*</span></label>
                                    <div>
                                        <input id="ag-nama" type="text" autocomplete="off" aria-required="true" placeholder="Misalnya Staf Keuangan">
                                        <p id="galat-ag-nama" class="pesan-galat-kolom" role="alert" hidden></p>
                                    </div>
                                </div>

                                <!-- Hanya satu pilihan dulu; "Terbatas pada waktu" belum dibuat (PRD 6.14) -->
                                <div class="baris-form">
                                    <span class="label-kelompok" id="label-ag-pembatasan">Pembatasan Akses</span>
                                    <div role="radiogroup" aria-labelledby="label-ag-pembatasan">
                                        <ul class="fitur-daftar">
                                            <li><label class="saklar"><input type="radio" id="ag-pembatasan-preferensi" name="ag-pembatasan" value="preferensi" checked> <span>Mengikuti Pembatasan di Preferensi</span></label></li>
                                        </ul>
                                    </div>
                                </div>

                                <!-- Pilih beberapa Operator (alat bersama buatPemilihBanyak, umum/komponen-transaksi.js) -->
                                <div class="baris-form">
                                    <label for="ag-pengguna-cari">Daftar Pengguna</label>
                                    <div>
                                        <div class="pemilih-banyak pemilih-mengalir" id="ag-pengguna">
                                            <div class="pemilih-chip"></div>
                                            <input id="ag-pengguna-cari" class="pemilih-cari" type="text" placeholder="Cari/Pilih pengguna Operator..." autocomplete="off" role="combobox" aria-expanded="false" aria-controls="ag-pengguna-daftar">
                                            <ul id="ag-pengguna-daftar" class="jurnal-daftar-akun" role="listbox" hidden></ul>
                                        </div>
                                        <p class="petunjuk">Hanya pengguna Operator. Satu pengguna hanya punya satu grup, jadi memilihnya di sini memindahkannya dari grup lamanya.</p>
                                    </div>
                                </div>
                            </div>

                            <!-- ===== Tab Hak Akses ===== -->
                            <div id="sub-ag-hak" class="sub-isi" hidden>
                                <div class="hak-akses">
                                    <!-- Kelompok menu: tombolnya dibuat oleh akses-grup.js -->
                                    <div id="ag-kelompok" class="hak-kelompok" role="group" aria-label="Kelompok menu"></div>

                                    <div class="hak-kanan">
                                        <div class="hak-alat">
                                            <input id="ag-cari" type="search" placeholder="Cari menu..." aria-label="Cari menu" autocomplete="off">
                                            <select id="ag-salin-dari" aria-label="Grup yang haknya akan disalin"></select>
                                            <button type="button" id="ag-salin" class="tombol tombol-garis">Salin Hak</button>
                                        </div>
                                        <div class="hak-bungkus-tabel">
                                            <table class="tabel-data tabel-hak">
                                                <thead>
                                                    <tr>
                                                        <th scope="col">Hak Akses</th>
                                                        <th scope="col">Aktif</th>
                                                        <th scope="col">Buat</th>
                                                        <th scope="col">Ubah</th>
                                                        <th scope="col">Hapus</th>
                                                        <th scope="col">Lihat</th>
                                                    </tr>
                                                    <!-- Pilih semua per kolom (hanya menu yang tampil). Sengaja tanpa id, supaya tidak ikut diingat per tab. -->
                                                    <tr class="hak-pilih-semua" id="ag-baris-semua"></tr>
                                                </thead>
                                                <tbody id="ag-badan-hak"></tbody>
                                            </table>
                                            <p id="ag-hak-kosong" class="tabel-kosong" hidden>Tidak ada menu yang cocok.</p>
                                        </div>
                                        <p class="petunjuk">Aktif = menu tampil dan halamannya bisa dibuka. Buat = Data Baru. Ubah = menyimpan perubahan data lama.
                                            Lihat = melihat data buatan pengguna lain. Buat, Ubah, Hapus, dan Lihat hanya berlaku kalau Aktif dicentang.</p>
                                    </div>
                                </div>
                            </div>
                        </form>
                    </div>

                    <div class="modul-form-aksi">
                        <button type="submit" form="form-akses-grup" class="tombol-simpan-besar" aria-label="Simpan" title="Simpan">
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M5 3h11l4 4v13a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1z"/><path d="M8 3v5h7V3"/><rect x="7" y="13" width="10" height="8" rx="1"/></svg>
                        </button>
                        <button type="button" class="tombol-hapus-besar" data-aksi="hapus" data-hanya-ubah hidden aria-label="Hapus" title="Hapus">
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M4 7h16M10 11v6M14 11v6M6 7l1 13h10l1-13M9 7V4h6v3"/></svg>
                        </button>
                    </div>
                </div>
            </section>
`);
