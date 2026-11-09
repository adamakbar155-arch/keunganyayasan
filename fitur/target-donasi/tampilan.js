// ==================== Tampilan: Donasi: Target Donasi ====================
// HTML halaman Target Donasi (PRD 6.1; di Accurate tidak ada contoh yang dipakai, dirancang bersama pengguna dan
// disetujui 2026-10-29 setelah melihat gambar contoh). Satu kotak formulir tanpa tab kecil, seperti gambar contohnya.
// Daftar (tombol hijau) dibuat otomatis oleh buatModulDaftar. Kolom tanggal otomatis memakai kalender aplikasi
// (umum/preferensi.js), kotak pilihan Program otomatis menjadi kolom cari berlabel (umum/pemilih-opsi.js).
// Logikanya: fitur/target-donasi/target-donasi.js. Gaya khusus: fitur/target-donasi/target-donasi.css.

pasangTampilan("tab-target-donasi", /*html*/ `
                <div class="tab" id="tab-target-donasi" hidden>
                    <button type="button" class="tab-judul" data-tab="target-donasi">Target Donasi</button>
                    <button type="button" class="tab-tutup" data-tutup="target-donasi" aria-label="Tutup tab Target Donasi">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" aria-hidden="true"><path d="M6 6l12 12M18 6L6 18"/></svg>
                    </button>
                </div>
`);

pasangTampilan("isi-target-donasi", /*html*/ `
            <!-- ===== Isi tab Target Donasi (komponen daftar dibuat otomatis oleh buatModulDaftar) ===== -->
            <section id="isi-target-donasi" class="isi-tab" hidden>
                <div class="modul-form">
                    <div class="modul-form-kiri">
                        <!-- Sesuai gambar contoh yang disetujui: tanpa tab kecil dan tanpa judul bagian, langsung kotak isian
                             (sub-isi = kotak berbingkai dengan jarak dalam, supaya label tidak menempel ke garis) -->
                        <form id="form-target-donasi" class="form-pref" novalidate>
                          <div class="sub-isi">
                            <div class="baris-form">
                                <label for="td-nama">Nama Target <span class="wajib" aria-hidden="true">*</span></label>
                                <div>
                                    <input id="td-nama" type="text" autocomplete="off" aria-required="true" placeholder="Misalnya Beasiswa 2026">
                                    <p id="galat-td-nama" class="pesan-galat-kolom" role="alert" hidden></p>
                                </div>
                            </div>

                            <!-- Program: hanya yang masih berjalan (status Aktif); saat mengubah, Program lamanya tetap tampil -->
                            <div class="baris-form">
                                <label for="td-program">Program <span class="wajib" aria-hidden="true">*</span></label>
                                <div>
                                    <select id="td-program" aria-required="true"></select>
                                    <small class="petunjuk">Hanya Program yang masih berjalan.</small>
                                    <p id="galat-td-program" class="pesan-galat-kolom" role="alert" hidden></p>
                                </div>
                            </div>

                            <!-- Periode: tanggal mulai s/d selesai (keduanya ikut dihitung) -->
                            <div class="baris-form">
                                <label for="td-mulai">Periode <span class="wajib" aria-hidden="true">*</span></label>
                                <div>
                                    <div class="periode-td">
                                        <div class="grup-tanggal">
                                            <input id="td-mulai" type="date" aria-required="true" aria-label="Tanggal mulai">
                                        </div>
                                        <span class="histori-sd">s/d</span>
                                        <div class="grup-tanggal">
                                            <input id="td-selesai" type="date" aria-required="true" aria-label="Tanggal selesai">
                                        </div>
                                    </div>
                                    <p id="galat-td-periode" class="pesan-galat-kolom" role="alert" hidden></p>
                                </div>
                            </div>

                            <div class="baris-form">
                                <label for="td-nilai">Nilai Target <span class="wajib" aria-hidden="true">*</span></label>
                                <div>
                                    <input id="td-nilai" type="text" inputmode="numeric" autocomplete="off" aria-required="true" placeholder="0">
                                    <p id="galat-td-nilai" class="pesan-galat-kolom" role="alert" hidden></p>
                                </div>
                            </div>

                            <div class="baris-form">
                                <label for="td-catatan">Catatan</label>
                                <textarea id="td-catatan" rows="3"></textarea>
                            </div>
                          </div>
                        </form>
                    </div>

                    <!-- Tombol di sisi kanan. data-hanya-ubah = hanya tampil saat mengubah data yang sudah ada. -->
                    <div class="modul-form-aksi">
                        <button type="submit" form="form-target-donasi" class="tombol-simpan-besar" aria-label="Simpan" title="Simpan">
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M5 3h11l4 4v13a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1z"/><path d="M8 3v5h7V3"/><rect x="7" y="13" width="10" height="8" rx="1"/></svg>
                        </button>
                        <button type="button" class="tombol-hapus-besar" data-aksi="hapus" data-hanya-ubah hidden aria-label="Hapus" title="Hapus">
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M4 7h16M10 11v6M14 11v6M6 7l1 13h10l1-13M9 7V4h6v3"/></svg>
                        </button>
                    </div>
                </div>
            </section>
`);
