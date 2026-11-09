// ==================== Tampilan: Jurnal Umum (halaman, popup Detail Akun, popup Lampiran) ====================
// HTML halaman dan popup fitur ini. Dipasang ke index.html lewat pasangTampilan (umum/pasang-tampilan.js)
// di tempat penanda <template data-tempat="...">. Logikanya ada di file .js lain di folder yang sama.
// Tanda /*html*/ membantu editor (misalnya ekstensi VS Code "es6-string-html") mewarnai teks sebagai HTML.

pasangTampilan("tab-jurnal", /*html*/ `
                <div class="tab" id="tab-jurnal" hidden>
                    <button type="button" class="tab-judul" data-tab="jurnal">Jurnal Umum</button>
                    <button type="button" class="tab-tutup" data-tutup="jurnal" aria-label="Tutup tab Jurnal Umum">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" aria-hidden="true"><path d="M6 6l12 12M18 6L6 18"/></svg>
                    </button>
                </div>
`);

pasangTampilan("isi-jurnal", /*html*/ `
            <!-- ===== Isi tab Jurnal Umum. Logikanya di fitur/jurnal/jurnal.js ; Ambil dan Lainnya di fitur/favorit/favorit.js, Cetak di fitur/cetak-bukti/cetak-bukti.js.
                 Tombol hijau, tab "Data Baru", dan Daftar dibuat otomatis oleh buatModulDaftar. ===== -->
            <section id="isi-jurnal" class="isi-tab" hidden>
                <div class="modul-form">
                    <div class="modul-form-kiri">
                        <form id="form-jurnal" class="jurnal-form" novalidate>

                            <!-- Bagian atas: tanggal, tipe transaksi, nomor -->
                            <div class="jurnal-kepala">
                                <div class="jurnal-kepala-kolom">
                                    <div class="jurnal-baris">
                                        <label for="jurnal-tanggal">Tanggal <span class="wajib" aria-hidden="true">*</span></label>
                                        <div class="grup-tanggal">
                                            <input id="jurnal-tanggal" type="date" aria-required="true">
                                            <span id="jurnal-tanggal-teks" class="tanggal-teks"></span>
                                        </div>
                                    </div>
                                    <div class="jurnal-baris">
                                        <label for="jurnal-tipe">Tipe Transaksi</label>
                                        <input id="jurnal-tipe" type="text" value="Jurnal Umum" readonly>
                                    </div>
                                </div>
                                <div class="jurnal-kepala-kolom">
                                    <div class="jurnal-baris">
                                        <label for="jurnal-aturan-nomor">Nomor # <span class="wajib" aria-hidden="true">*</span></label>
                                        <div>
                                            <!-- Otomatis (bawaan): pilih aturan penomoran yang dibuat di Pengaturan, Penomoran.
                                                 Dimatikan: nomor diketik sendiri. -->
                                            <div class="jurnal-nomor">
                                                <label class="saklar" title="Nomor dibuat otomatis"><input type="checkbox" id="jurnal-nomor-otomatis" checked aria-label="Nomor otomatis"> <span>Otomatis</span></label>
                                                <select id="jurnal-aturan-nomor" aria-label="Aturan penomoran"></select>
                                                <input id="jurnal-nomor" type="text" hidden placeholder="Ketik nomor jurnal" autocomplete="off">
                                            </div>
                                            <p id="jurnal-contoh-nomor" class="petunjuk jurnal-contoh-nomor"></p>
                                        </div>
                                    </div>
                                    <div class="jurnal-baris jurnal-baris-kanan">
                                        <button type="button" class="tombol tombol-garis" data-favorit-ambil="Jurnal Umum">
                                            Ambil
                                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M6 9l6 6 6-6"/></svg>
                                        </button>
                                    </div>
                                </div>
                            </div>

                            <!-- Pesan kalau jurnal belum bisa disimpan (tanggal, nomor, dan sebagainya) -->
                            <p id="jurnal-pesan-galat" class="pesan-galat-kolom jurnal-pesan-galat" role="alert" hidden></p>

                            <!-- Badan: tab samping (Rincian, Info) dan isinya -->
                            <div class="jurnal-badan">
                                <div class="jurnal-tab-samping" role="tablist" aria-label="Bagian jurnal">
                                    <button type="button" class="jurnal-tab-ikon aktif" role="tab" aria-selected="true" aria-controls="jurnal-panel-rincian" data-jurnal-tab="rincian" title="Rincian" aria-label="Rincian">
                                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M6 3h9l4 4v14H6z"/><path d="M14 3v5h5"/><path d="M9 13h7M9 17h5"/></svg>
                                    </button>
                                    <button type="button" class="jurnal-tab-ikon" role="tab" aria-selected="false" aria-controls="jurnal-panel-info" data-jurnal-tab="info" title="Info" aria-label="Info">
                                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="9"/><path d="M12 11v6M12 7.5v.5"/></svg>
                                    </button>
                                </div>

                                <div class="jurnal-isi">
                                    <!-- Panel Rincian -->
                                    <div id="jurnal-panel-rincian" class="jurnal-panel" role="tabpanel">
                                        <div class="jurnal-alat">
                                            <div class="jurnal-cari">
                                                <input id="jurnal-cari-akun" type="text" placeholder="Cari/Pilih Akun Perkiraan..." autocomplete="off" role="combobox" aria-expanded="false" aria-controls="jurnal-daftar-akun" aria-autocomplete="list" aria-label="Cari atau pilih akun perkiraan">
                                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" aria-hidden="true"><circle cx="11" cy="11" r="6.5"/><path d="M20 20l-4.2-4.2"/></svg>
                                                <!-- Daftar hasil pencarian: nama (bagian yang cocok disorot), kode di kiri bawah, tipe akun di kanan bawah -->
                                                <ul id="jurnal-daftar-akun" class="jurnal-daftar-akun" role="listbox" hidden></ul>
                                            </div>
                                            <div class="jurnal-judul-rincian">
                                                <button type="button" class="tombol tombol-garis jurnal-tombol-cari" data-jurnal-menyusul="Pencarian rincian jurnal" aria-label="Cari di rincian jurnal">
                                                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" aria-hidden="true"><circle cx="11" cy="11" r="6.5"/><path d="M20 20l-4.2-4.2"/></svg>
                                                </button>
                                                <h2>Rincian Jurnal <span class="wajib" aria-hidden="true">*</span></h2>
                                            </div>
                                        </div>

                                        <div class="bungkus-tabel jurnal-bungkus-tabel">
                                            <table class="tabel-data jurnal-tabel" aria-label="Rincian jurnal">
                                                <thead>
                                                    <tr>
                                                        <th scope="col" class="jurnal-kol-geser"><span class="sembunyi-visual">Urutan</span></th>
                                                        <th scope="col" class="jurnal-kol-kode">Kode #</th>
                                                        <th scope="col" class="jurnal-kol-akun">Nama Perkiraan</th>
                                                        <th scope="col" class="jurnal-kol-program">Program</th>
                                                        <th scope="col" class="jurnal-kol-pj">Penanggung Jawab</th>
                                                        <th scope="col" class="jurnal-kol-ket">Keterangan</th>
                                                        <th scope="col" class="jurnal-kol-angka">Debit</th>
                                                        <th scope="col" class="jurnal-kol-angka">Kredit</th>
                                                        <th scope="col" class="jurnal-kol-hapus"><span class="sembunyi-visual">Hapus baris</span></th>
                                                    </tr>
                                                </thead>
                                                <!-- Baris rincian digambar oleh JavaScript (gambarRincianJurnal); kosong = tulisan "Belum ada data" -->
                                                <tbody id="jurnal-rincian"></tbody>
                                            </table>
                                        </div>
                                    </div>

                                    <!-- Panel Info -->
                                    <div id="jurnal-panel-info" class="jurnal-panel" role="tabpanel" hidden>
                                        <h3 class="fitur-grup">Info Jurnal</h3>
                                        <div class="baris-form">
                                            <label for="jurnal-keterangan">Keterangan</label>
                                            <textarea id="jurnal-keterangan" rows="4" placeholder="Catatan untuk seluruh jurnal ini"></textarea>
                                        </div>
                                        <div class="baris-form">
                                            <label for="jurnal-dibuat-oleh">Dibuat oleh</label>
                                            <input id="jurnal-dibuat-oleh" type="text" readonly placeholder="Terisi saat disimpan">
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </form>

                        <!-- Keterangan singkat kenapa jurnal belum bisa disimpan (belum seimbang, kurang baris) -->
                        <p id="jurnal-status" class="jurnal-status" aria-live="polite"></p>

                        <!-- Total debit dan kredit -->
                        <div class="jurnal-total" aria-live="polite">
                            <div class="jurnal-total-kotak">
                                <span>Total Debit</span>
                                <strong id="jurnal-total-debit">Rp 0</strong>
                            </div>
                            <div class="jurnal-total-kotak">
                                <span>Total Kredit</span>
                                <strong id="jurnal-total-kredit">Rp 0</strong>
                            </div>
                        </div>
                    </div>

                    <!-- Tombol di kanan: simpan (belum aktif), cetak/laporan, lampiran, menu lain -->
                    <div class="modul-form-aksi">
                        <button type="submit" form="form-jurnal" class="tombol-simpan-besar" id="jurnal-simpan" disabled aria-label="Simpan" title="Simpan">
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M5 3h11l4 4v13a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1z"/><path d="M8 3v5h7V3"/><rect x="7" y="13" width="10" height="8" rx="1"/></svg>
                        </button>
                        <button type="button" class="tombol-aksi-samping tombol-aksi-biru" data-cetak-bukti="Jurnal Umum" aria-label="Cetak" title="Cetak">
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M6 3h9l4 4v14H6z"/><path d="M14 3v5h5"/><path d="M9 13h7M9 17h5"/></svg>
                            <svg class="panah" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M6 9l6 6 6-6"/></svg>
                        </button>
                        <!-- Lampiran: membuka popup untuk menambah/melihat file. Angka kecil = jumlah lampiran. -->
                        <button type="button" id="jurnal-tombol-lampiran" class="tombol-aksi-samping tombol-aksi-biru" aria-label="Lampiran" title="Lampiran">
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M20 11.5l-8 8a5 5 0 0 1-7-7l9-9a3.3 3.3 0 0 1 4.7 4.7l-9 9a1.7 1.7 0 0 1-2.4-2.4l8-8"/></svg>
                            <span id="jurnal-lencana-lampiran" class="lencana-aksi" hidden>0</span>
                        </button>
                        <button type="button" class="tombol-aksi-samping tombol-aksi-hijau" data-favorit-lain="Jurnal Umum" aria-label="Menu lainnya" title="Lainnya">
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="9"/><path d="M8 12h.01M12 12h.01M16 12h.01"/></svg>
                            <svg class="panah" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M6 9l6 6 6-6"/></svg>
                        </button>
                        <button type="button" class="tombol-hapus-besar" data-aksi="hapus" data-hanya-ubah hidden aria-label="Hapus" title="Hapus">
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M4 7h16M10 11v6M14 11v6M6 7l1 13h10l1-13M9 7V4h6v3"/></svg>
                        </button>
                    </div>
                </div>
            </section>
`);

pasangTampilan("dialog-detail-akun", /*html*/ `
    <!-- ===== Popup Detail Akun (Jurnal Umum): muncul setelah akun dipilih, dan saat sebuah baris rincian diklik.
         Tab "Detail Akun": nilai (debit/kredit) dan penanggung jawab. Tab "Info Lainnya": divisi, program, keterangan. ===== -->
    <dialog id="dialog-detail-akun" class="dialog-detail" aria-labelledby="judul-detail-akun">
        <header class="dialog-detail-kepala">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M4 20h4L19 9l-4-4L4 16z"/><path d="M13.5 6.5l4 4"/></svg>
            <h2 id="judul-detail-akun">Detail Akun</h2>
            <button type="button" id="tutup-detail-akun" class="dialog-detail-tutup" aria-label="Tutup">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" aria-hidden="true"><path d="M6 6l12 12M18 6L6 18"/></svg>
            </button>
        </header>

        <div class="dialog-detail-isi">
            <div class="dialog-detail-tab" role="tablist">
                <button type="button" class="aktif" role="tab" aria-selected="true" aria-controls="detail-panel-detail" data-detail-tab="detail">Detail Akun</button>
                <button type="button" role="tab" aria-selected="false" aria-controls="detail-panel-info" data-detail-tab="info">Info Lainnya</button>
            </div>

            <!-- Tab Detail Akun -->
            <div id="detail-panel-detail" class="dialog-detail-panel" role="tabpanel">
                <div class="baris-form">
                    <span class="label-kelompok">Kode #</span>
                    <span id="detail-kode" class="detail-kode"></span>
                </div>
                <div class="baris-form">
                    <label for="detail-nama">Nama Perkiraan</label>
                    <input id="detail-nama" type="text" readonly>
                </div>
                <div class="baris-form">
                    <span class="label-kelompok">Nilai <span class="wajib" aria-hidden="true">*</span></span>
                    <div>
                        <div class="detail-pilihan-sisi" role="radiogroup" aria-label="Debit atau Kredit">
                            <label><input type="radio" name="detail-sisi" value="debit" checked> Debit</label>
                            <label><input type="radio" name="detail-sisi" value="kredit"> Kredit</label>
                        </div>
                        <div class="detail-rupiah">
                            <span aria-hidden="true">Rp</span>
                            <input id="detail-nilai" type="text" inputmode="numeric" autocomplete="off" placeholder="0" aria-label="Nilai dalam Rupiah" aria-required="true">
                        </div>
                        <p id="galat-detail-nilai" class="pesan-galat-kolom" role="alert" hidden></p>
                    </div>
                </div>
                <div class="baris-form">
                    <label for="detail-penanggung">Penanggung Jawab</label>
                    <input id="detail-penanggung" type="text" autocomplete="off" placeholder="Ketik nama penanggung jawab">
                </div>
            </div>

            <!-- Tab Info Lainnya -->
            <div id="detail-panel-info" class="dialog-detail-panel" role="tabpanel" hidden>
                <div class="baris-form">
                    <label for="detail-divisi">Divisi</label>
                    <select id="detail-divisi"></select>
                </div>
                <div class="baris-form">
                    <label for="detail-program">Program</label>
                    <select id="detail-program"></select>
                </div>
                <!-- Dana (PRD 4.1): pilih salah satu, Terikat atau Tidak Terikat (wajib, kecuali baris Kas & Bank).
                     Baris baru mengikuti baris terakhir. -->
                <div class="baris-form">
                    <span class="label-kelompok">Dana</span>
                    <div class="pilihan-dana">
                        <label class="saklar"><input type="checkbox" id="detail-terikat"> <span>Terikat</span></label>
                        <label class="saklar"><input type="checkbox" id="detail-tidak-terikat"> <span>Tidak Terikat</span></label>
                    </div>
                </div>
                <div class="baris-form">
                    <label for="detail-keterangan">Keterangan</label>
                    <textarea id="detail-keterangan" rows="4"></textarea>
                </div>
            </div>
        </div>

        <footer class="dialog-detail-kaki">
            <button type="button" id="lanjut-detail-akun" class="tombol tombol-utama">Lanjut</button>
        </footer>
    </dialog>
`);
