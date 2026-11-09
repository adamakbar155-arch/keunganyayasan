// ==================== Tampilan: Laporan (menu) ====================
// HTML tab Laporan (PRD 7; dari foto menu Laporan Accurate). Kiri: daftar kategori; kanan: judul kategori, kotak Cari, dan
// kartu laporan yang dikelompokkan. Kategori dan kartunya digambar oleh fitur/laporan/laporan.js dari daftar di sana,
// jadi HTML di sini hanya kerangka. Gaya: fitur/laporan/laporan.css.

pasangTampilan("tab-laporan", /*html*/ `
                <div class="tab" id="tab-laporan" hidden>
                    <button type="button" class="tab-judul" data-tab="laporan">Laporan</button>
                    <button type="button" class="tab-tutup" data-tutup="laporan" aria-label="Tutup tab Laporan">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" aria-hidden="true"><path d="M6 6l12 12M18 6L6 18"/></svg>
                    </button>
                </div>
`);

pasangTampilan("isi-laporan", /*html*/ `
            <!-- ===== Isi tab Laporan ===== -->
            <section id="isi-laporan" class="isi-tab" hidden>
                <div class="lap-menu">
                    <!-- Daftar kategori (tombol dibuat oleh laporan.js) -->
                    <nav id="lap-kategori" class="lap-kategori" aria-label="Kategori laporan"></nav>

                    <div class="lap-panel">
                        <div class="lap-atas">
                            <h2 id="lap-judul" class="lap-judul">Laporan</h2>
                            <!-- Impor hanya tampil di Laporan Tersimpan (seperti Accurate) -->
                            <button type="button" id="lap-impor" class="lap-impor" aria-label="Impor laporan tersimpan" title="Impor" hidden>
                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 4v11M7 10l5 5 5-5M5 20h14"/></svg>
                            </button>
                            <!-- Ekspor: berkas .json yang nanti dibaca tombol Impor (fitur/laporan/tersimpan.js) -->
                            <button type="button" id="lap-ekspor" class="lap-impor" aria-label="Ekspor laporan tersimpan" title="Ekspor" hidden>
                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 15V4M7 9l5-5 5 5M5 20h14"/></svg>
                            </button>
                            <input id="lap-impor-berkas" class="sembunyi-visual" type="file" accept=".json,application/json" tabindex="-1" aria-label="Pilih berkas laporan tersimpan">
                            <input id="lap-cari" class="lap-cari" type="search" placeholder="Cari…" aria-label="Cari laporan" autocomplete="off">
                        </div>
                        <!-- Kelompok kartu laporan (dibuat oleh laporan.js) -->
                        <div id="lap-isi" class="lap-isi"></div>
                    </div>
                </div>
            </section>
`);

// Tab hasil laporan: satu tab untuk laporan yang sedang dilihat; judul tab diganti nama laporannya (fitur/laporan/kertas.js)
pasangTampilan("tab-hasil-laporan", /*html*/ `
                <div class="tab" id="tab-hasil-laporan" hidden>
                    <button type="button" class="tab-judul" data-tab="hasil-laporan" id="judul-tab-hasil-laporan">Hasil Laporan</button>
                    <button type="button" class="tab-tutup" data-tutup="hasil-laporan" aria-label="Tutup tab hasil laporan">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" aria-hidden="true"><path d="M6 6l12 12M18 6L6 18"/></svg>
                    </button>
                </div>
`);

pasangTampilan("isi-hasil-laporan", /*html*/ `
            <!-- ===== Isi tab hasil laporan (PRD 7, gaya profesional khas aplikasi; tugas I.1g-2) =====
                 Kertas putih: kepala di tengah (nama yayasan, judul, periode, "(Dinyatakan dalam Rupiah)"), keterangan
                 filter, isi laporan (diisi laporannya masing-masing), dan kaki "Dicetak ...". Saat dicetak, nomor
                 "Halaman x dari y" ditulis di bawah setiap halaman kertas (laporan.css, @page laporan). -->
            <section id="isi-hasil-laporan" class="isi-tab" hidden>
                <!-- Bilah ikon seperti Accurate, sama untuk semua laporan; nama tombol muncul saat ikon disentuh (data-tooltip) -->
                <div class="lap-hasil-alat" role="toolbar" aria-label="Alat laporan">
                    <button type="button" id="lap-ubah-parameter" class="lap-alat" data-tooltip="Parameter" aria-label="Parameter">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true"><path d="M6 3v5M6 14v7M12 3v9M12 18v3M18 3v3M18 12v9"/><circle cx="6" cy="11" r="2.4"/><circle cx="12" cy="15" r="2.4"/><circle cx="18" cy="9" r="2.4"/></svg>
                    </button>
                    <button type="button" id="lap-modifikasi" class="lap-alat" data-tooltip="Modifikasi" aria-label="Modifikasi">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 4H5a1 1 0 0 0-1 1v14a1 1 0 0 0 1 1h14a1 1 0 0 0 1-1v-7"/><path d="M18.5 3.5a2.1 2.1 0 0 1 3 3L12 16l-4 1 1-4z"/></svg>
                    </button>
                    <button type="button" id="lap-cetak" class="lap-alat" data-tooltip="Cetak" aria-label="Cetak">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M7 8V3h10v5M7 17H4v-7a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v7h-3"/><path d="M7 14h10v7H7z"/></svg>
                    </button>
                    <!-- Cetak bentuk audit: hanya untuk laporan yang punya cetakAudit di DAFTAR_LAPORAN (Bukti Pengeluaran, PRD 5.4) -->
                    <button type="button" id="lap-cetak-audit" class="lap-alat" data-tooltip="Lampiran audit" aria-label="Lampiran audit" hidden>
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M6 3h9l4 4v14H6z"/><path d="M14 3v5h5"/><path d="M9 13l2 2 4-4M9 18h7"/></svg>
                    </button>
                    <button type="button" id="lap-simpan" class="lap-alat" data-tooltip="Simpan Laporan" aria-label="Simpan Laporan">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M5 3h11l3 3v15H5z"/><path d="M8 3v6h8V3M8 21v-7h8v7"/></svg>
                    </button>
                    <!-- Unduh: menu pilihan PDF, Excel, CSV (panah kecil seperti Accurate) -->
                    <div class="lap-alat-bungkus">
                        <button type="button" id="lap-unduh" class="lap-alat lap-alat-menu" data-tooltip="Unduh" aria-label="Unduh" aria-haspopup="menu" aria-expanded="false" aria-controls="lap-menu-unduh">
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 4v11M7 10l5 5 5-5M5 20h14"/></svg>
                            <svg class="lap-panah" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M6 9l6 6 6-6"/></svg>
                        </button>
                        <div id="lap-menu-unduh" class="lap-menu-unduh" role="menu" hidden>
                            <button type="button" role="menuitem" data-unduh="pdf">PDF</button>
                            <button type="button" role="menuitem" data-unduh="excel">Excel</button>
                            <button type="button" role="menuitem" data-unduh="csv">CSV</button>
                        </div>
                    </div>
                </div>
                <article id="lap-kertas" class="lap-kertas">
                    <header class="lap-k-kepala">
                        <p id="lap-k-yayasan" class="lap-k-yayasan"></p>
                        <h1 id="lap-k-judul" class="lap-k-judul"></h1>
                        <p id="lap-k-periode" class="lap-k-periode"></p>
                        <p class="lap-k-mata">(Dinyatakan dalam Rupiah)</p>
                    </header>
                    <p id="lap-k-filter" class="lap-k-filter"></p>
                    <div id="lap-k-isi" class="lap-k-isi"></div>
                    <!-- Catatan bawah tabel, misalnya Ekuitas Saldo Awal atau peringatan tidak seimbang (diisi kertas.js) -->
                    <div id="lap-k-catatan" class="lap-k-catatan"></div>
                    <footer class="lap-k-kaki"><span id="lap-k-dicetak"></span></footer>
                </article>
            </section>
`);

pasangTampilan("dialog-rincian-baris", /*html*/ `
    <!-- ===== Popup daftar transaksi di balik satu baris laporan (PRD 7). Logika: fitur/laporan/rincian-baris.js ===== -->
    <dialog id="dialog-rincian-baris" class="dialog-detail dialog-rincian-baris-laporan" aria-labelledby="judul-rincian-baris">
        <header class="dialog-detail-kepala">
            <h2 id="judul-rincian-baris"></h2>
            <button type="button" id="tutup-rincian-baris" class="dialog-detail-tutup" aria-label="Tutup">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" aria-hidden="true"><path d="M6 6l12 12M18 6L6 18"/></svg>
            </button>
        </header>
        <div id="rincian-baris-isi" class="dialog-detail-isi"></div>
    </dialog>
`);

pasangTampilan("dialog-modifikasi-laporan", /*html*/ `
    <!-- ===== Popup Modifikasi (PRD 7, dari foto Modifikasi Accurate). Baru tab Kolom Data dan Halaman; tab lain menunggu foto.
         Logika: fitur/laporan/modifikasi.js ===== -->
    <dialog id="dialog-modifikasi-laporan" class="dialog-detail dialog-modifikasi-laporan" aria-labelledby="judul-modifikasi-laporan">
        <header class="dialog-detail-kepala">
            <h2 id="judul-modifikasi-laporan">Modifikasi</h2>
            <button type="button" id="tutup-modifikasi-laporan" class="dialog-detail-tutup" aria-label="Tutup">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" aria-hidden="true"><path d="M6 6l12 12M18 6L6 18"/></svg>
            </button>
        </header>
        <div class="dialog-detail-isi">
            <div class="dialog-detail-tab" role="tablist">
                <button type="button" class="aktif" role="tab" aria-selected="true" aria-controls="mod-panel-kolom" data-mod-tab="kolom">Kolom Data</button>
                <button type="button" role="tab" aria-selected="false" aria-controls="mod-panel-halaman" data-mod-tab="halaman">Halaman</button>
            </div>
            <!-- Tab Kolom Data: daftar kolom laporan ini (diisi modifikasi.js) -->
            <div id="mod-panel-kolom" class="dialog-detail-panel" role="tabpanel">
                <h3 class="param-subjudul">Kolom Digunakan</h3>
                <div id="mod-daftar-kolom" class="mod-daftar-kolom"></div>
            </div>
            <!-- Tab Halaman -->
            <div id="mod-panel-halaman" class="dialog-detail-panel mod-dua-kolom" role="tabpanel" hidden>
                <div>
                    <h3 class="param-subjudul">Pengaturan Kertas</h3>
                    <div class="baris-form">
                        <label for="mod-kertas">Ukr. Kertas</label>
                        <!-- pilih-filter: kotak pilihan biasa seperti foto, bukan kolom cari berlabel (umum/pemilih-opsi.js) -->
                        <select id="mod-kertas" class="pilih-filter"></select>
                    </div>
                    <div class="baris-form">
                        <span class="label-kelompok">Orientasi</span>
                        <div class="mod-orientasi" role="radiogroup" aria-label="Orientasi kertas">
                            <label><input type="radio" name="mod-orientasi" value="tegak"> Tegak</label>
                            <label><input type="radio" name="mod-orientasi" value="mendatar"> Mendatar</label>
                            <label><input type="checkbox" id="mod-fleksibel"> Tinggi kertas fleksibel</label>
                        </div>
                    </div>
                </div>
                <div>
                    <h3 class="param-subjudul">Margin Halaman</h3>
                    <div class="mod-margin">
                        <label for="mod-kiri">Kiri</label><input id="mod-kiri" type="number" min="0" max="50" step="1"><span>mm</span>
                        <label for="mod-kanan">Kanan</label><input id="mod-kanan" type="number" min="0" max="50" step="1"><span>mm</span>
                        <label for="mod-atas">Atas</label><input id="mod-atas" type="number" min="0" max="50" step="1"><span>mm</span>
                        <label for="mod-bawah">Bawah</label><input id="mod-bawah" type="number" min="0" max="50" step="1"><span>mm</span>
                    </div>
                    <p id="galat-modifikasi" class="pesan-galat-kolom" role="alert" hidden></p>
                </div>
            </div>
        </div>
        <footer class="dialog-detail-kaki">
            <button type="button" id="simpan-modifikasi-laporan" class="tombol tombol-utama">Simpan</button>
        </footer>
    </dialog>
`);

pasangTampilan("dialog-simpan-laporan", /*html*/ `
    <!-- ===== Popup Simpan Laporan (PRD 7, Laporan Tersimpan): nama sendiri untuk laporan + parameternya. Logika: tersimpan.js ===== -->
    <dialog id="dialog-simpan-laporan" class="dialog-detail dialog-simpan-laporan" aria-labelledby="judul-simpan-laporan">
        <header class="dialog-detail-kepala">
            <h2 id="judul-simpan-laporan">Simpan Laporan</h2>
            <button type="button" id="tutup-simpan-laporan" class="dialog-detail-tutup" aria-label="Tutup">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" aria-hidden="true"><path d="M6 6l12 12M18 6L6 18"/></svg>
            </button>
        </header>
        <div class="dialog-detail-isi">
            <div class="baris-form">
                <label for="simpan-laporan-nama">Nama <span class="wajib" aria-hidden="true">*</span></label>
                <div>
                    <input id="simpan-laporan-nama" type="text" maxlength="80" autocomplete="off" aria-required="true">
                    <p id="galat-simpan-laporan" class="pesan-galat-kolom" role="alert" hidden></p>
                </div>
            </div>
        </div>
        <footer class="dialog-detail-kaki">
            <button type="button" id="oke-simpan-laporan" class="tombol tombol-utama">Simpan</button>
        </footer>
    </dialog>
`);

pasangTampilan("dialog-parameter-laporan", /*html*/ `
    <!-- ===== Popup Parameter Laporan (PRD 7, dari foto Parameter Laporan Accurate): muncul saat kartu laporan diklik.
         Satu bagian saja (tab Kolom Accurate tidak dipakai, Cabang tidak dipakai). Logika: fitur/laporan/parameter.js ===== -->
    <dialog id="dialog-parameter-laporan" class="dialog-detail dialog-parameter-laporan" aria-labelledby="judul-parameter-laporan">
        <header class="dialog-detail-kepala">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M4 6h10M18 6h2M4 12h4M12 12h8M4 18h12M20 18h0"/><circle cx="16" cy="6" r="2"/><circle cx="10" cy="12" r="2"/><circle cx="18" cy="18" r="2"/></svg>
            <h2 id="judul-parameter-laporan">Parameter Laporan</h2>
            <button type="button" id="tutup-parameter-laporan" class="dialog-detail-tutup" aria-label="Tutup">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" aria-hidden="true"><path d="M6 6l12 12M18 6L6 18"/></svg>
            </button>
        </header>

        <div class="dialog-detail-isi">
            <!-- Nama laporan yang akan ditampilkan (diisi parameter.js) -->
            <p id="param-nama-laporan" class="param-nama-laporan"></p>

            <h3 class="param-subjudul">Tanggal</h3>
            <div class="baris-form">
                <label for="param-dari">Dari</label>
                <input id="param-dari" type="date" aria-label="Tanggal dari" aria-required="true">
            </div>
            <div class="baris-form">
                <label for="param-sampai">s/d</label>
                <div>
                    <input id="param-sampai" type="date" aria-label="Tanggal sampai dengan" aria-required="true">
                    <p id="galat-param-tanggal" class="pesan-galat-kolom" role="alert" hidden></p>
                </div>
            </div>

            <h3 id="param-judul-tambahan" class="param-subjudul">Parameter Tambahan</h3>
            <!-- Divisi, Program, dan Akun boleh pilih beberapa (alat bersama buatPemilihBanyak, umum/komponen-transaksi.js).
                 Hanya isian yang berlaku untuk laporan itu yang tampil (kolom parameter di DAFTAR_LAPORAN). -->
            <div class="baris-form" id="param-baris-divisi">
                <label for="param-divisi-cari">Divisi</label>
                <div class="pemilih-banyak param-pilih" id="param-divisi">
                    <div class="pemilih-chip"></div>
                    <input id="param-divisi-cari" class="pemilih-cari" type="text" placeholder="Cari/Pilih..." autocomplete="off" role="combobox" aria-expanded="false" aria-controls="param-divisi-daftar">
                    <ul id="param-divisi-daftar" class="jurnal-daftar-akun" role="listbox" hidden></ul>
                </div>
            </div>
            <div class="baris-form" id="param-baris-program">
                <label for="param-program-cari">Program</label>
                <div class="pemilih-banyak param-pilih" id="param-program">
                    <div class="pemilih-chip"></div>
                    <input id="param-program-cari" class="pemilih-cari" type="text" placeholder="Cari/Pilih... (kosong = semua)" autocomplete="off" role="combobox" aria-expanded="false" aria-controls="param-program-daftar">
                    <ul id="param-program-daftar" class="jurnal-daftar-akun" role="listbox" hidden></ul>
                </div>
            </div>
            <div class="baris-form" id="param-baris-akun" hidden>
                <label for="param-akun-cari">Akun</label>
                <div class="pemilih-banyak param-pilih" id="param-akun">
                    <div class="pemilih-chip"></div>
                    <input id="param-akun-cari" class="pemilih-cari" type="text" placeholder="Cari/Pilih... (kosong = semua)" autocomplete="off" role="combobox" aria-expanded="false" aria-controls="param-akun-daftar">
                    <ul id="param-akun-daftar" class="jurnal-daftar-akun" role="listbox" hidden></ul>
                </div>
            </div>

            <div id="param-kotak-centang" class="param-centang">
                <label><input type="checkbox" id="param-hanya-total"> Hanya Tampilkan Total</label>
                <label><input type="checkbox" id="param-akun-induk" checked> Tampilkan Akun Induk</label>
                <label><input type="checkbox" id="param-akun-anak" checked> Tampilkan Akun Anak</label>
            </div>
        </div>

        <footer class="dialog-detail-kaki">
            <button type="button" id="tampilkan-parameter-laporan" class="tombol tombol-utama">Tampilkan</button>
        </footer>
    </dialog>
`);
