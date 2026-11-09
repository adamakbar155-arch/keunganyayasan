// ==================== Tampilan: Pencatatan Gaji (halaman, popup Rincian Karyawan) ====================
// HTML halaman dan popup fitur ini. Dipasang ke index.html lewat pasangTampilan (umum/pasang-tampilan.js)
// di tempat penanda <template data-tempat="...">. Logikanya ada di file .js lain di folder yang sama.
// Tanda /*html*/ membantu editor (misalnya ekstensi VS Code "es6-string-html") mewarnai teks sebagai HTML.

pasangTampilan("tab-pgaji", /*html*/ `
                <div class="tab" id="tab-pgaji" hidden>
                    <button type="button" class="tab-judul" data-tab="pgaji">Pencatatan Gaji</button>
                    <button type="button" class="tab-tutup" data-tutup="pgaji" aria-label="Tutup tab Pencatatan Gaji">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" aria-hidden="true"><path d="M6 6l12 12M18 6L6 18"/></svg>
                    </button>
                </div>
`);

pasangTampilan("isi-pgaji", /*html*/ `
            <!-- ===== Isi tab Pencatatan Gaji, mirip Accurate. Logikanya di fitur/gaji/gaji.js (cetak slip, lampiran, dan Ambil belum ada).
                 Tombol hijau, tab "Data Baru", dan Daftar dibuat otomatis oleh buatModulDaftar.
                 Tampilan memakai kelas yang sama dengan Jurnal Umum (jurnal-*) supaya rupanya seragam. ===== -->
            <section id="isi-pgaji" class="isi-tab" hidden>
                <div class="modul-form">
                    <div class="modul-form-kiri">
                        <form id="form-pgaji" class="jurnal-form" novalidate>

                            <!-- Bagian atas kiri: tipe pembayaran dan periode gaji; kanan: nomor, tanggal, jatuh tempo, Proses -->
                            <div class="jurnal-kepala pgaji-kepala">
                                <div class="jurnal-kepala-kolom">
                                    <div class="jurnal-baris">
                                        <label for="pgaji-tipe">Tipe Pembayaran</label>
                                        <select id="pgaji-tipe">
                                            <option value="">Silakan Pilih</option>
                                            <option value="bulanan">Bulanan</option>
                                        </select>
                                    </div>
                                    <div class="jurnal-baris">
                                        <label for="pgaji-bulan">Bulan</label>
                                        <div class="pgaji-periode">
                                            <select id="pgaji-bulan" aria-label="Bulan gaji"></select>
                                            <select id="pgaji-tahun" aria-label="Tahun gaji"></select>
                                        </div>
                                    </div>
                                </div>
                                <div class="jurnal-kepala-kolom">
                                    <div class="jurnal-baris">
                                        <label for="pgaji-aturan-nomor">Nomor # <span class="wajib" aria-hidden="true">*</span></label>
                                        <div>
                                            <!-- Otomatis: pilih aturan penomoran bertipe Pencatatan Gaji (Pengaturan, Penomoran). Dimatikan: diketik sendiri. -->
                                            <div class="jurnal-nomor">
                                                <label class="saklar" title="Nomor dibuat otomatis"><input type="checkbox" id="pgaji-nomor-otomatis" checked aria-label="Nomor otomatis"> <span>Otomatis</span></label>
                                                <select id="pgaji-aturan-nomor" aria-label="Aturan penomoran"></select>
                                                <input id="pgaji-nomor" type="text" hidden placeholder="Ketik nomor" autocomplete="off">
                                            </div>
                                            <p id="pgaji-contoh-nomor" class="petunjuk jurnal-contoh-nomor"></p>
                                        </div>
                                    </div>
                                    <div class="jurnal-baris">
                                        <label for="pgaji-tanggal">Tanggal <span class="wajib" aria-hidden="true">*</span></label>
                                        <div class="grup-tanggal">
                                            <input id="pgaji-tanggal" type="date" aria-required="true">
                                        </div>
                                    </div>
                                    <div class="jurnal-baris">
                                        <label for="pgaji-jatuh-tempo">Jatuh Tempo <span class="wajib" aria-hidden="true">*</span></label>
                                        <div class="grup-tanggal pgaji-tempo">
                                            <input id="pgaji-jatuh-tempo" type="date" aria-required="true">
                                            <!-- Proses: menu kecil berisi "Gaji" = membayar gaji ini lewat formulir Pembayaran (PRD 3.3).
                                                 Aktif begitu ada karyawan di rincian (tanpa harus disimpan dulu) dan selama belum lunas (PRD 6.2). -->
                                            <div class="pgaji-proses-bungkus">
                                                <button type="button" id="pgaji-proses" class="tombol tombol-garis" disabled aria-haspopup="true" aria-expanded="false" title="Aktif setelah ada karyawan di Rincian Karyawan">
                                                    Proses
                                                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M6 9l6 6 6-6"/></svg>
                                                </button>
                                                <ul id="pgaji-proses-menu" class="pgaji-proses-menu" hidden>
                                                    <li><button type="button" id="pgaji-proses-gaji">Gaji</button></li>
                                                </ul>
                                            </div>
                                        </div>
                                    </div>
                                    <!-- Status bayar: dihitung dari baris Pembayaran yang tertaut ke pencatatan ini (hanya dibaca) -->
                                    <div class="jurnal-baris">
                                        <label for="pgaji-status">Status</label>
                                        <input id="pgaji-status" type="text" readonly value="Belum disimpan">
                                    </div>
                                </div>
                            </div>

                            <p id="pgaji-pesan-galat" class="pesan-galat-kolom jurnal-pesan-galat" role="alert" hidden></p>

                            <!-- Badan: tab samping (Rincian Karyawan, Info lainnya) dan isinya -->
                            <div class="jurnal-badan">
                                <div class="jurnal-tab-samping" role="tablist" aria-label="Bagian pencatatan gaji">
                                    <button type="button" class="jurnal-tab-ikon aktif" role="tab" aria-selected="true" aria-controls="pgaji-panel-rincian" data-pgaji-tab="rincian" title="Rincian Karyawan" aria-label="Rincian Karyawan">
                                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M6 3h9l4 4v14H6z"/><path d="M14 3v5h5"/><path d="M9 13h7M9 17h5"/></svg>
                                    </button>
                                    <button type="button" class="jurnal-tab-ikon" role="tab" aria-selected="false" aria-controls="pgaji-panel-info" data-pgaji-tab="info" title="Info lainnya" aria-label="Info lainnya">
                                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="9"/><path d="M12 11v6M12 7.5v.5"/></svg>
                                    </button>
                                </div>

                                <div class="jurnal-isi">
                                    <!-- Panel Rincian Karyawan -->
                                    <div id="pgaji-panel-rincian" class="jurnal-panel" role="tabpanel">
                                        <div class="jurnal-alat">
                                            <div class="pgaji-alat-kiri">
                                                <div class="jurnal-cari pgaji-cari">
                                                    <input id="pgaji-cari-karyawan" type="text" placeholder="Cari/Pilih Karyawan..." autocomplete="off" role="combobox" aria-expanded="false" aria-controls="pgaji-daftar-karyawan" aria-autocomplete="list" aria-label="Cari atau pilih karyawan">
                                                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" aria-hidden="true"><circle cx="11" cy="11" r="6.5"/><path d="M20 20l-4.2-4.2"/></svg>
                                                    <ul id="pgaji-daftar-karyawan" class="jurnal-daftar-akun" role="listbox" hidden></ul>
                                                </div>
                                                <button type="button" class="tombol tombol-garis" data-pgaji-menyusul="Ambil semua karyawan">Ambil</button>
                                            </div>
                                            <div class="jurnal-judul-rincian">
                                                <h2>Rincian Karyawan<span id="pgaji-jumlah"></span> <span class="wajib" aria-hidden="true">*</span></h2>
                                            </div>
                                        </div>

                                        <div class="bungkus-tabel jurnal-bungkus-tabel">
                                            <table class="tabel-data jurnal-tabel" aria-label="Rincian karyawan">
                                                <thead>
                                                    <tr>
                                                        <th scope="col" class="jurnal-kol-geser"><span class="sembunyi-visual">Urutan</span></th>
                                                        <th scope="col" class="jurnal-kol-akun">Nama Karyawan</th>
                                                        <th scope="col" class="jurnal-kol-angka">Pendapatan Bruto</th>
                                                        <th scope="col" class="jurnal-kol-angka">Potongan</th>
                                                        <th scope="col" class="jurnal-kol-angka">Gaji dibayarkan</th>
                                                        <th scope="col" class="jurnal-kol-hapus"><span class="sembunyi-visual">Hapus baris</span></th>
                                                    </tr>
                                                </thead>
                                                <!-- Baris digambar oleh JavaScript (gambarRincianGaji); kosong = "Belum ada data" -->
                                                <tbody id="pgaji-rincian"></tbody>
                                            </table>
                                        </div>
                                    </div>

                                    <!-- Panel Info lainnya: akun Beban Gaji dan catatan. Menyimpan pencatatan TIDAK membuat jurnal;
                                         akun ini dipakai sebagai akun baris saat gaji dibayar lewat Pembayaran (PRD 3.3, 6.2). -->
                                    <div id="pgaji-panel-info" class="jurnal-panel" role="tabpanel" hidden>
                                        <h3 class="fitur-grup">Info lainnya</h3>
                                        <div class="baris-form">
                                            <label for="pgaji-beban">Beban Gaji <span class="wajib" aria-hidden="true">*</span></label>
                                            <div>
                                                <select id="pgaji-beban"></select>
                                                <p id="petunjuk-pgaji-beban" class="petunjuk" hidden>Belum ada akun Beban. Buat dulu di Buku Besar, Akun Perkiraan.</p>
                                            </div>
                                        </div>
                                        <div class="baris-form">
                                            <label for="pgaji-catatan">Catatan</label>
                                            <textarea id="pgaji-catatan" rows="4"></textarea>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </form>

                        <!-- Total seluruh karyawan -->
                        <div class="jurnal-total" aria-live="polite">
                            <div class="jurnal-total-kotak">
                                <span>Pendapatan Bruto</span>
                                <strong id="pgaji-total-bruto">Rp 0</strong>
                            </div>
                            <div class="jurnal-total-kotak">
                                <span>Gaji dibayarkan</span>
                                <strong id="pgaji-total-bayar">Rp 0</strong>
                            </div>
                        </div>
                    </div>

                    <!-- Tombol di kanan: simpan, cetak slip dan lampiran (menyusul), hapus (saat mengubah) -->
                    <div class="modul-form-aksi">
                        <button type="submit" form="form-pgaji" class="tombol-simpan-besar" id="pgaji-simpan" aria-label="Simpan" title="Simpan">
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M5 3h11l4 4v13a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1z"/><path d="M8 3v5h7V3"/><rect x="7" y="13" width="10" height="8" rx="1"/></svg>
                        </button>
                        <button type="button" class="tombol-aksi-samping tombol-aksi-biru" data-pgaji-menyusul="Cetak slip gaji" aria-label="Cetak slip gaji" title="Cetak slip gaji">
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M6 3h9l4 4v14H6z"/><path d="M14 3v5h5"/><path d="M9 13h7M9 17h5"/></svg>
                            <svg class="panah" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M6 9l6 6 6-6"/></svg>
                        </button>
                        <!-- Lampiran (alat bersama umum/lampiran.js). Angka kecil = jumlah lampiran. -->
                        <button type="button" id="pgaji-tombol-lampiran" class="tombol-aksi-samping tombol-aksi-biru" aria-label="Lampiran" title="Lampiran">
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M20 11.5l-8 8a5 5 0 0 1-7-7l9-9a3.3 3.3 0 0 1 4.7 4.7l-9 9a1.7 1.7 0 0 1-2.4-2.4l8-8"/></svg>
                            <span id="pgaji-lencana-lampiran" class="lencana-aksi" hidden>0</span>
                        </button>
                        <button type="button" class="tombol-hapus-besar" data-aksi="hapus" data-hanya-ubah hidden aria-label="Hapus" title="Hapus">
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M4 7h16M10 11v6M14 11v6M6 7l1 13h10l1-13M9 7V4h6v3"/></svg>
                        </button>
                    </div>
                </div>
            </section>
`);

pasangTampilan("dialog-rincian-gaji", /*html*/ `
    <!-- ===== Popup Rincian Karyawan (Pencatatan Gaji): muncul setelah karyawan dipilih, dan saat barisnya diklik.
         Tab "Rincian Gaji": komponen pendapatan dan potongan. Tab "Info lainnya": catatan. ===== -->
    <dialog id="dialog-rincian-gaji" class="dialog-detail dialog-rincian-gaji" aria-labelledby="judul-rincian-gaji">
        <header class="dialog-detail-kepala">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M4 20h4L19 9l-4-4L4 16z"/><path d="M13.5 6.5l4 4"/></svg>
            <h2 id="judul-rincian-gaji">Rincian Karyawan</h2>
            <button type="button" id="tutup-rincian-gaji" class="dialog-detail-tutup" aria-label="Tutup">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" aria-hidden="true"><path d="M6 6l12 12M18 6L6 18"/></svg>
            </button>
        </header>

        <div class="dialog-detail-isi">
            <div class="dialog-detail-tab" role="tablist">
                <button type="button" class="aktif" role="tab" aria-selected="true" aria-controls="rgaji-panel-gaji" data-rgaji-tab="gaji">Rincian Gaji</button>
                <button type="button" role="tab" aria-selected="false" aria-controls="rgaji-panel-info" data-rgaji-tab="info">Info lainnya</button>
            </div>

            <!-- Tab Rincian Gaji. Kolom angka diberi data-komponen; daftar komponen ada di JavaScript (komponenGaji). -->
            <div id="rgaji-panel-gaji" class="dialog-detail-panel" role="tabpanel">
                <div class="rgaji-atas">
                    <p class="rgaji-nama"><em id="rgaji-nama"></em> <span id="rgaji-jabatan"></span></p>
                    <button type="button" class="tombol tombol-garis" data-pgaji-menyusul="Ambil Gaji bulan lalu">Ambil Gaji bulan lalu</button>
                </div>

                <h3 class="rgaji-grup">Pendapatan Bruto</h3>
                <div id="rgaji-pendapatan"></div>

                <h3 class="rgaji-grup">Potongan</h3>
                <div id="rgaji-potongan"></div>

                <div class="baris-form rgaji-hasil">
                    <label for="rgaji-dibayarkan">Gaji dibayarkan</label>
                    <div class="detail-rupiah">
                        <span aria-hidden="true">Rp</span>
                        <input id="rgaji-dibayarkan" type="text" readonly value="0">
                    </div>
                </div>
            </div>

            <!-- Tab Info lainnya: hanya catatan untuk karyawan ini -->
            <div id="rgaji-panel-info" class="dialog-detail-panel" role="tabpanel" hidden>
                <div class="baris-form">
                    <label for="rgaji-catatan">Catatan</label>
                    <textarea id="rgaji-catatan" rows="4"></textarea>
                </div>
            </div>
        </div>

        <footer class="dialog-detail-kaki">
            <button type="button" id="lanjut-rincian-gaji" class="tombol tombol-utama">Lanjut</button>
        </footer>
    </dialog>
`);
