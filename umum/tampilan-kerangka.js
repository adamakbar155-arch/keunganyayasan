// ==================== Tampilan kerangka: bilah atas dan menu samping ====================
// Bagian yang selalu tampil di semua halaman. Logikanya ada di umum/inti.js (popup menu) dan umum/bilah-atas.js (pilihan pembukuan).
// Dipasang ke index.html lewat pasangTampilan (umum/pasang-tampilan.js) di tempat penanda <template data-tempat="...">.
// Tanda /*html*/ membantu editor (misalnya ekstensi VS Code "es6-string-html") mewarnai teks sebagai HTML.

pasangTampilan("bilah-atas", /*html*/ `
    <!-- ===== Bar atas: nama aplikasi di kiri, ikon dan pengguna di kanan ===== -->
    <header class="bar-atas">
        <div class="merek">
            <!-- Penanda kecil buatan sendiri (bukan logo pihak lain) -->
            <span class="merek-titik" aria-hidden="true"></span>
            <span class="merek-nama">Aplikasi Keuangan</span>
        </div>

        <div class="bar-kanan">
            <button type="button" class="ikon-bar" aria-label="Cari">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="11" cy="11" r="7"/><path d="M21 21l-4.3-4.3"/></svg>
            </button>
            <button type="button" id="tombol-bantuan" class="ikon-bar" aria-label="Bantuan: pintasan keyboard (F1)" title="Pintasan keyboard (F1)">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="9"/><path d="M9.5 9.5a2.5 2.5 0 1 1 3.5 2.3c-.7.4-1 1-1 1.7"/><circle cx="12" cy="17" r="0.5"/></svg>
            </button>
            <button type="button" class="ikon-bar" aria-label="Notifikasi">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M6 8a6 6 0 1 1 12 0c0 7 3 8 3 8H3s3-1 3-8"/><path d="M10 20a2 2 0 0 0 4 0"/></svg>
            </button>

            <!-- Pilihan pembukuan: tombol yang membuka daftar kecil (yayasan, sekolah, unit usaha) -->
            <div class="pembukuan">
                <button type="button" id="tombol-pembukuan" class="pembukuan-tombol" aria-haspopup="true" aria-expanded="false" aria-label="Pilih pembukuan">
                    <strong id="nama-pembukuan">Yayasan</strong>
                    <span>Pembukuan</span>
                    <!-- Panah kecil ke bawah, tanda bahwa tombol ini membuka daftar -->
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M6 9l6 6 6-6"/></svg>
                </button>

                <!-- Daftar pembukuan. Atribut hidden = tersembunyi sampai tombol diklik.
                     data-nama = teks yang akan tampil di tombol saat dipilih. -->
                <ul id="daftar-pembukuan" class="pembukuan-daftar" hidden>
                    <li><button type="button" class="pembukuan-pilihan aktif" data-nama="Yayasan">Yayasan</button></li>
                    <li><button type="button" class="pembukuan-pilihan" data-nama="Sekolah">Sekolah</button></li>
                    <li><button type="button" class="pembukuan-pilihan" data-nama="Unit usaha">Unit usaha</button></li>
                </ul>
            </div>
            <!-- Menu pengguna (PRD 6.12): inisial nama; klik membuka nama, peran, Ganti Kata Sandi, dan Keluar (umum/sesi-aplikasi.js) -->
            <div class="menu-pengguna">
                <button type="button" id="tombol-pengguna" class="avatar" aria-haspopup="menu" aria-expanded="false" aria-controls="daftar-menu-pengguna" aria-label="Menu pengguna">?</button>
                <div id="daftar-menu-pengguna" class="daftar-menu-pengguna" role="menu" hidden>
                    <p class="menu-pengguna-nama" id="menu-pengguna-nama"></p>
                    <p class="menu-pengguna-peran" id="menu-pengguna-peran"></p>
                    <button type="button" id="menu-ganti-sandi" role="menuitem">Ganti Kata Sandi</button>
                    <button type="button" id="menu-keluar" class="menu-keluar" role="menuitem">Keluar</button>
                </div>
            </div>
        </div>
    </header>
`);

pasangTampilan("menu-samping", /*html*/ `
        <!-- Semua ikon SVG buatan sendiri; warnanya mengikuti teks lewat currentColor -->
        <nav class="menu-samping" aria-label="Menu utama">
            <!-- Menu hanya berisi ikon. Penjelasannya muncul sebagai popup saat kursor diarahkan
                 (atau saat menekan Tab): teks diambil dari atribut data-tooltip lewat CSS.
                 aria-label membuat pembaca layar tetap membaca nama menunya. -->
            <a href="#" id="tombol-pengaturan" class="menu-item" data-tooltip="Pengaturan" aria-label="Pengaturan" aria-haspopup="dialog">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.7 1.7 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.8-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-1.1-1.5 1.7 1.7 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.8 1.7 1.7 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1a1.7 1.7 0 0 0 1.5-1.1 1.7 1.7 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.8.3H9a1.7 1.7 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.8V9a1.7 1.7 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1z"/></svg>
            </a>
            <a href="#" id="tombol-master" class="menu-item" data-tooltip="Master Data" aria-label="Master Data" aria-haspopup="dialog">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M3 21h18"/><path d="M5 21V8l7-5 7 5v13"/><path d="M9 21v-6h6v6"/></svg>
            </a>
            <!-- Menu "Akun" diganti menjadi "Buku besar" (nama dan ikon) -->
            <a href="#" id="tombol-buku-besar" class="menu-item" data-tooltip="Buku besar" aria-label="Buku besar" aria-haspopup="dialog">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M4 4h12a4 4 0 0 1 4 4v12H8a4 4 0 0 1-4-4z"/><path d="M8 4v16"/></svg>
            </a>
            <!-- Menu Donasi (PRD 2.1, 6.1): membuka popup Donasi (fitur/donasi/donasi.js) -->
            <a href="#" id="tombol-donasi" class="menu-item" data-tooltip="Donasi" aria-label="Donasi" aria-haspopup="dialog">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M6 3h9l4 4v14H6z"/><path d="M14 3v5h5"/><path d="M9 13h7M9 17h5"/></svg>
            </a>
            <a href="#" id="tombol-kas" class="menu-item" data-tooltip="Kas" aria-label="Kas" aria-haspopup="dialog">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="2" y="6" width="20" height="13" rx="2"/><path d="M2 10h20"/><circle cx="16" cy="15" r="1.5"/></svg>
            </a>
            <!-- Menu Aset Tetap (PRD 6.6): membuka popup Aset Tetap (fitur/aset-tetap/aset-tetap.js) -->
            <a href="#" id="tombol-aset" class="menu-item" data-tooltip="Aset Tetap" aria-label="Aset Tetap" aria-haspopup="dialog">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M3 21h18M5 21V5l8-2v18M13 9l6 2v10"/><path d="M8 8h2M8 12h2M8 16h2"/></svg>
            </a>
            <!-- Menu Laporan (PRD 7): membuka tab Laporan (fitur/laporan/laporan.js) -->
            <a href="#" id="tombol-laporan" class="menu-item" data-tooltip="Laporan" aria-label="Laporan">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M4 20V10M10 20V4M16 20v-7M22 20H2"/></svg>
            </a>
        </nav>
`);
