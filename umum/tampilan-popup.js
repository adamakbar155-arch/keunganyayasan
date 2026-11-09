// ==================== Tampilan popup menu dan konfirmasi ====================
// Popup yang dibuka dari ikon menu samping (Kas & Bank, Donasi, Buku Besar, Master Data, Pengaturan) dan popup konfirmasi hapus.
// Logikanya ada di umum/inti.js, fitur/kas-bank/kas-bank.js (popup Kas & Bank), dan fitur/donasi/donasi.js (popup Donasi).
// Dipasang ke index.html lewat pasangTampilan (umum/pasang-tampilan.js) di tempat penanda <template data-tempat="...">.
// Tanda /*html*/ membantu editor (misalnya ekstensi VS Code "es6-string-html") mewarnai teks sebagai HTML.
// Warna kotak di semua popup (seperti popup Donasi, keputusan pengguna 2026-11-06): kotak-hijau = transaksi, tanpa kelas
// warna (biru) = data, kotak-oranye = target, riwayat, dan lainnya.

pasangTampilan("panel-kas", /*html*/ `
    <!-- ===== Popup Kas & Bank (ikon Kas di menu samping), urutan seperti Accurate (PRD 6.3).
         Kotak yang fiturnya belum dibuat memberi tahu "belum tersedia" (lihat fitur/kas-bank/kas-bank.js). ===== -->
    <dialog id="panel-kas" class="panel-pengaturan" aria-labelledby="judul-kas">
        <div class="panel-isi">
            <header class="panel-kepala">
                <h2 id="judul-kas">Kas &amp; Bank</h2>
                <button type="button" id="tutup-kas" class="tombol-ikon" aria-label="Tutup">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" aria-hidden="true"><path d="M6 6l12 12M18 6L6 18"/></svg>
                </button>
            </header>

            <div class="kotak-pengaturan">
                <a href="#" class="kotak-menu kotak-hijau" data-halaman="Pembayaran">
                    <span class="kotak-ikon">
                        <!-- Ikon panah keluar dari dompet: uang keluar -->
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="3" y="7" width="18" height="13" rx="2"/><path d="M12 11V3M9 6l3-3 3 3"/></svg>
                    </span>
                    <span class="kotak-label-menu">Pembayaran</span>
                </a>
                <a href="#" class="kotak-menu kotak-hijau" data-halaman="Penerimaan">
                    <span class="kotak-ikon">
                        <!-- Ikon panah masuk ke dompet: uang masuk -->
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="3" y="7" width="18" height="13" rx="2"/><path d="M12 2v8M9 7l3 3 3-3"/></svg>
                    </span>
                    <span class="kotak-label-menu">Penerimaan</span>
                </a>
                <a href="#" class="kotak-menu kotak-hijau" data-halaman="Transfer Bank">
                    <span class="kotak-ikon">
                        <!-- Ikon dua panah berlawanan: pindah uang antar kas/bank -->
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M4 8h14M14 4l4 4-4 4"/><path d="M20 16H6M10 12l-4 4 4 4"/></svg>
                    </span>
                    <span class="kotak-label-menu">Transfer Bank</span>
                </a>
                <a href="#" class="kotak-menu kotak-oranye" data-halaman="Histori Bank">
                    <span class="kotak-ikon">
                        <!-- Ikon gedung bank dengan kaca pembesar: melihat riwayat transaksi satu Kas/Bank -->
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M3 9l8-5 8 5"/><path d="M5 10v6M9 10v6M13 10v3"/><path d="M3 19h9"/><circle cx="17.5" cy="16.5" r="3"/><path d="M20 19l2 2"/></svg>
                    </span>
                    <span class="kotak-label-menu">Histori Bank</span>
                </a>
                <a href="#" class="kotak-menu kotak-oranye" data-halaman="Rekonsiliasi Bank">
                    <span class="kotak-ikon">
                        <!-- Ikon lembar dengan centang: mencocokkan transaksi dengan rekening koran -->
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M6 3h9l4 4v14H6z"/><path d="M14 3v5h5"/><path d="M9 14l2 2 4-4"/></svg>
                    </span>
                    <span class="kotak-label-menu">Rekonsiliasi Bank</span>
                </a>
            </div>
        </div>
    </dialog>
`);

pasangTampilan("panel-donasi", /*html*/ `
    <!-- ===== Popup Donasi (ikon Donasi di menu samping). Pemilahan kotak dari popup Penjualan Accurate (PRD 6.1).
         Warna seperti Accurate: hijau = transaksi, biru = data, oranye = target.
         Penyaluran Bantuan dan Pengembalian Donasi tidak dibuat (keputusan 2026-10-29): uang keluar untuk keduanya
         dicatat lewat Kas & Bank > Pembayaran.
         Kotak yang fiturnya belum dibuat memberi tahu "belum tersedia" (lihat fitur/donasi/donasi.js). ===== -->
    <dialog id="panel-donasi" class="panel-pengaturan" aria-labelledby="judul-donasi">
        <div class="panel-isi">
            <header class="panel-kepala">
                <h2 id="judul-donasi">Donasi</h2>
                <button type="button" id="tutup-donasi" class="tombol-ikon" aria-label="Tutup">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" aria-hidden="true"><path d="M6 6l12 12M18 6L6 18"/></svg>
                </button>
            </header>

            <div class="kotak-pengaturan">
                <a href="#" class="kotak-menu kotak-hijau" data-halaman="Pencatatan Donasi">
                    <span class="kotak-ikon">
                        <!-- Ikon tangan menadah dengan hati di atasnya: donasi diterima (gabungan Faktur + Penerimaan Penjualan) -->
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 11l-3.2-3.1a2.2 2.2 0 0 1 3.2-3 2.2 2.2 0 0 1 3.2 3z"/><path d="M2.5 13.5v7.5"/><path d="M2.5 14.5h3.3l3.4-1.2a2 2 0 0 1 1.4 0l3.1 1.1a1.4 1.4 0 0 1-.5 2.7H10"/><path d="M13.2 17.1h2.9l4.3-2.7a1.4 1.4 0 0 1 1.7 2.2l-4.4 3.5a3 3 0 0 1-1.9.7H2.5"/></svg>
                    </span>
                    <span class="kotak-label-menu">Pencatatan Donasi</span>
                </a>
                <a href="#" class="kotak-menu kotak-hijau" data-halaman="Pemindahan Dana">
                    <span class="kotak-ikon">
                        <!-- Ikon dua koin dengan panah melengkung: memindah sisa dana antar Program -->
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="6" cy="16.5" r="4.2"/><text x="6" y="18.1" font-size="4.4" font-weight="700" font-family="sans-serif" text-anchor="middle" fill="currentColor" stroke="none">Rp</text><circle cx="18" cy="16.5" r="4.2"/><text x="18" y="18.1" font-size="4.4" font-weight="700" font-family="sans-serif" text-anchor="middle" fill="currentColor" stroke="none">Rp</text><path d="M5.5 9.5a7.5 7.5 0 0 1 12.2-2.3"/><path d="M18.3 3.8l-.4 3.6-3.6-.5"/></svg>
                    </span>
                    <span class="kotak-label-menu">Pemindahan Dana</span>
                </a>
                <a href="#" class="kotak-menu" data-halaman="Kategori Donasi">
                    <span class="kotak-ikon">
                        <!-- Ikon label dengan hati: kategori = akun donasi (padanan Kategori Penjualan) -->
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M3 11.6V4a1 1 0 0 1 1-1h7.6a1 1 0 0 1 .7.3l8.4 8.4a1 1 0 0 1 0 1.4l-7.6 7.6a1 1 0 0 1-1.4 0L3.3 12.3a1 1 0 0 1-.3-.7z"/><circle cx="7.5" cy="7.5" r="1.4"/><path d="M13.2 15.6l-2-1.9a1.3 1.3 0 0 1 2-1.7 1.3 1.3 0 0 1 2 1.7z"/></svg>
                    </span>
                    <span class="kotak-label-menu">Kategori Donasi</span>
                </a>
                <a href="#" class="kotak-menu" data-halaman="Donatur">
                    <span class="kotak-ikon">
                        <!-- Ikon orang dengan lencana hati: donatur (padanan Pelanggan) -->
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="9.5" cy="7" r="4"/><path d="M2.5 21v-.5a7 7 0 0 1 10.6-6"/><circle cx="17.5" cy="17" r="4.5"/><path d="M17.5 19.2l-1.9-1.8a1.2 1.2 0 0 1 1.9-1.5 1.2 1.2 0 0 1 1.9 1.5z"/></svg>
                    </span>
                    <span class="kotak-label-menu">Donatur</span>
                </a>
                <a href="#" class="kotak-menu kotak-oranye" data-halaman="Target Donasi">
                    <span class="kotak-ikon">
                        <!-- Ikon grafik batang naik dengan papan sasaran: target donasi (padanan Target Penjualan) -->
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M2.5 21h19"/><path d="M5 21v-4M9.5 21v-6.5M14 21v-9"/><circle cx="18" cy="7" r="4.2"/><circle cx="18" cy="7" r="1.5"/><path d="M3.5 14.5l5-3.5 3.5 1.2 2-2.9"/></svg>
                    </span>
                    <span class="kotak-label-menu">Target Donasi</span>
                </a>
            </div>
        </div>
    </dialog>
`);

pasangTampilan("panel-buku-besar", /*html*/ `
    <dialog id="panel-buku-besar" class="panel-pengaturan" aria-labelledby="judul-buku-besar">
        <div class="panel-isi">
            <header class="panel-kepala">
                <h2 id="judul-buku-besar">Buku Besar</h2>
                <button type="button" id="tutup-buku-besar" class="tombol-ikon" aria-label="Tutup">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" aria-hidden="true"><path d="M6 6l12 12M18 6L6 18"/></svg>
                </button>
            </header>

            <div class="kotak-pengaturan">
                <a href="#" class="kotak-menu" data-halaman="Akun Perkiraan">
                    <span class="kotak-ikon">
                        <!-- Ikon daftar bernomor: akun perkiraan -->
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="4" y="3" width="16" height="18" rx="2"/><path d="M8 8h8M8 12h8M8 16h5"/></svg>
                    </span>
                    <span class="kotak-label-menu">Akun Perkiraan</span>
                </a>
                <a href="#" class="kotak-menu kotak-hijau" data-halaman="Pencatatan Gaji">
                    <span class="kotak-ikon">
                        <!-- Ikon dokumen dengan pensil: pencatatan gaji -->
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M6 3h9l4 4v6"/><path d="M6 3v18h7"/><path d="M9 10h6M9 14h3"/><path d="M15.5 21l5-5 1.5 1.5-5 5-2 .5z"/></svg>
                    </span>
                    <span class="kotak-label-menu">Pencatatan Gaji</span>
                </a>
                <a href="#" class="kotak-menu kotak-hijau" data-halaman="Jurnal Umum">
                    <span class="kotak-ikon">
                        <!-- Ikon tabel: jurnal umum -->
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="3" y="4" width="18" height="16" rx="2"/><path d="M3 10h18M3 15h18M9 4v16M15 4v16"/></svg>
                    </span>
                    <span class="kotak-label-menu">Jurnal Umum</span>
                </a>
                <a href="#" class="kotak-menu kotak-oranye" data-halaman="Monitor Anggaran">
                    <span class="kotak-ikon">
                        <!-- Ikon layar dengan grafik: monitor anggaran -->
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="3" y="4" width="18" height="12" rx="2"/><path d="M12 16v4M8 20h8"/><path d="M7 13v-3M11 13V8M15 13v-4"/></svg>
                    </span>
                    <span class="kotak-label-menu">Monitor Anggaran</span>
                </a>
                <a href="#" class="kotak-menu kotak-oranye" data-halaman="Transfer Anggaran">
                    <span class="kotak-ikon">
                        <!-- Ikon dua panah bolak-balik: transfer anggaran -->
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M4 8h15M15 4l4 4-4 4"/><path d="M20 16H5M9 12l-4 4 4 4"/></svg>
                    </span>
                    <span class="kotak-label-menu">Transfer Anggaran</span>
                </a>
                <a href="#" class="kotak-menu kotak-oranye" data-halaman="Anggaran">
                    <span class="kotak-ikon">
                        <!-- Ikon grafik naik: anggaran -->
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M4 20h16"/><path d="M6 16v4M11 12v8M16 8v12"/><path d="M5 9l5-4 3 3 6-5M15 3h4v4"/></svg>
                    </span>
                    <span class="kotak-label-menu">Anggaran</span>
                </a>
                <a href="#" class="kotak-menu kotak-oranye" data-halaman="Histori Akun">
                    <span class="kotak-ikon">
                        <!-- Ikon buku dengan jam: histori akun -->
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M5 3h11a2 2 0 0 1 2 2v5"/><path d="M5 3v16a2 2 0 0 0 2 2h4"/><circle cx="17" cy="17" r="4.5"/><path d="M17 14.5V17l1.8 1.2"/></svg>
                    </span>
                    <span class="kotak-label-menu">Histori Akun</span>
                </a>
                <a href="#" class="kotak-menu kotak-oranye" data-halaman="Log Aktifitas Jurnal">
                    <span class="kotak-ikon">
                        <!-- Ikon tabel dengan kaca pembesar: log aktifitas jurnal -->
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M20 12V6a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h7"/><path d="M3 10h17M9 4v16"/><circle cx="17" cy="17" r="3"/><path d="M19.2 19.2L21.5 21.5"/></svg>
                    </span>
                    <span class="kotak-label-menu">Log Aktifitas Jurnal</span>
                </a>
            </div>
        </div>
    </dialog>
`);

pasangTampilan("panel-master", /*html*/ `
    <!-- ===== Popup Master Data (dari ikon gedung di menu samping) =====
         Memakai gaya yang sama dengan popup Pengaturan. Isinya data pendukung transaksi. -->
    <dialog id="panel-master" class="panel-pengaturan" aria-labelledby="judul-master">
        <div class="panel-isi">
            <header class="panel-kepala">
                <h2 id="judul-master">Master Data</h2>
                <button type="button" id="tutup-master" class="tombol-ikon" aria-label="Tutup">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" aria-hidden="true"><path d="M6 6l12 12M18 6L6 18"/></svg>
                </button>
            </header>

            <!-- data-halaman = nama halaman. Halamannya belum dibuat, jadi sementara hanya memunculkan pemberitahuan. -->
            <div class="kotak-pengaturan">
                <a href="#" class="kotak-menu" data-halaman="Program">
                    <span class="kotak-ikon">
                        <!-- Ikon bendera: program -->
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M5 21V4"/><path d="M5 4h11l-2 4 2 4H5"/></svg>
                    </span>
                    <span class="kotak-label-menu">Program</span>
                </a>
                <a href="#" class="kotak-menu" data-halaman="Divisi">
                    <span class="kotak-ikon">
                        <!-- Ikon bagan: divisi -->
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="9" y="3" width="6" height="5" rx="1"/><rect x="3" y="16" width="6" height="5" rx="1"/><rect x="15" y="16" width="6" height="5" rx="1"/><path d="M12 8v4M6 16v-4h12v4"/></svg>
                    </span>
                    <span class="kotak-label-menu">Divisi</span>
                </a>
                <a href="#" class="kotak-menu" data-halaman="Karyawan">
                    <span class="kotak-ikon">
                        <!-- Ikon orang dengan tas: karyawan -->
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="9" cy="7.5" r="3.5"/><path d="M2.5 21v-2.5c0-3 2.9-5 6.5-5s6.5 2 6.5 5V21"/><rect x="15.5" y="14" width="6.5" height="6" rx="1"/><path d="M17.5 14v-1.5h2.5V14"/></svg>
                    </span>
                    <span class="kotak-label-menu">Karyawan</span>
                </a>
                <a href="#" class="kotak-menu" data-halaman="Gaji/Tunjangan">
                    <span class="kotak-ikon">
                        <!-- Ikon uang bertingkat: gaji dan tunjangan -->
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="2.5" y="4" width="19" height="9" rx="1.5"/><circle cx="12" cy="8.5" r="2.3"/><path d="M12 13v3M6 16h12M6 16v3M18 16v3M12 16v3"/><circle cx="6" cy="20.5" r="1.2"/><circle cx="12" cy="20.5" r="1.2"/><circle cx="18" cy="20.5" r="1.2"/></svg>
                    </span>
                    <span class="kotak-label-menu">Gaji/Tunjangan</span>
                </a>
                <a href="#" class="kotak-menu kotak-oranye" data-halaman="Log Aktivitas">
                    <span class="kotak-ikon">
                        <!-- Ikon dokumen berisi daftar dan kaca pembesar: log aktivitas -->
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M6 3h9l4 4v6"/><path d="M6 3v18h6"/><path d="M9 9h5M9 13h3"/><circle cx="16.5" cy="17.5" r="3"/><path d="M18.7 19.7L21 22"/></svg>
                    </span>
                    <span class="kotak-label-menu">Log Aktivitas</span>
                </a>
            </div>
        </div>
    </dialog>
`);

pasangTampilan("dialog-konfirmasi", /*html*/ `
    <!-- ===== Popup konfirmasi (dipakai sebelum menghapus data) =====
         Menggantikan kotak konfirmasi bawaan browser. Dibuka lewat fungsi tanyaKonfirmasi(). -->
    <dialog id="dialog-konfirmasi" class="dialog-konfirmasi" aria-labelledby="judul-konfirmasi" aria-describedby="isi-konfirmasi">
        <div class="konfirmasi-kepala">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" aria-hidden="true"><circle cx="12" cy="12" r="9.5"/><path d="M12 11v6"/><circle cx="12" cy="7.6" r="0.6"/></svg>
            <span id="judul-konfirmasi">Konfirmasi</span>
        </div>
        <div class="konfirmasi-isi">
            <!-- Ikon segitiga peringatan buatan sendiri -->
            <svg class="konfirmasi-ikon" viewBox="0 0 48 48" aria-hidden="true">
                <path d="M24 5 L45 41 H3 Z" fill="#fbbf24" stroke="#0b2a5b" stroke-width="2.6" stroke-linejoin="round"/>
                <path d="M24 17 V28" stroke="#0b2a5b" stroke-width="3.4" stroke-linecap="round"/>
                <circle cx="24" cy="34" r="2.2" fill="#0b2a5b"/>
            </svg>
            <div>
                <p id="isi-konfirmasi" class="konfirmasi-teks"></p>
                <p id="nama-konfirmasi" class="konfirmasi-nama"></p>
            </div>
        </div>
        <div class="konfirmasi-aksi">
            <button type="button" id="batal-konfirmasi" class="tombol tombol-garis">Batal</button>
            <button type="button" id="ya-konfirmasi" class="tombol tombol-bahaya">Ya, Hapus</button>
        </div>
    </dialog>
`);

pasangTampilan("panel-pengaturan", /*html*/ `
    <!-- ===== Popup Pengaturan =====
         Memakai elemen <dialog> bawaan HTML: otomatis ada latar gelap di belakang,
         fokus keyboard terkunci di dalamnya, dan tombol Esc menutupnya. -->
    <dialog id="panel-pengaturan" class="panel-pengaturan" aria-labelledby="judul-pengaturan">
        <!-- .panel-isi dipakai sebagai pembungkus supaya klik di luar popup bisa dikenali -->
        <div class="panel-isi">
            <header class="panel-kepala">
                <h2 id="judul-pengaturan">Pengaturan</h2>
                <button type="button" id="tutup-pengaturan" class="tombol-ikon" aria-label="Tutup">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" aria-hidden="true"><path d="M6 6l12 12M18 6L6 18"/></svg>
                </button>
            </header>

            <!-- Kotak-kotak menu. Baru satu; yang lain ditambah satu per satu nanti. -->
            <div class="kotak-pengaturan">
                <a href="#" id="kotak-preferensi" class="kotak-menu" data-halaman="Preferensi">
                    <span class="kotak-ikon">
                        <!-- Ikon pengatur (slider) buatan sendiri -->
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M4 6h9M19 6h1M4 12h3M13 12h7M4 18h11M21 18h-1"/><circle cx="16" cy="6" r="2.5"/><circle cx="10" cy="12" r="2.5"/><circle cx="17.5" cy="18" r="2.5"/></svg>
                    </span>
                    <span class="kotak-label-menu">Preferensi</span>
                </a>

                <!-- Kotak lain di Pengaturan. Halamannya belum dibuat, jadi sementara hanya memunculkan pemberitahuan.
                     data-halaman = nama halaman yang disebut di pemberitahuan. -->
                <a href="#" class="kotak-menu" data-halaman="Pengguna">
                    <span class="kotak-ikon">
                        <!-- Ikon dua orang: pengguna -->
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="9" cy="8" r="3.5"/><path d="M2.5 20c0-3.6 2.9-6 6.5-6s6.5 2.4 6.5 6"/><circle cx="17.5" cy="9" r="2.6"/><path d="M17.5 14.2c2.4 0 4 1.7 4 4.3"/></svg>
                    </span>
                    <span class="kotak-label-menu">Pengguna</span>
                </a>
                <a href="#" class="kotak-menu" data-halaman="Penomoran">
                    <span class="kotak-ikon">
                        <!-- Ikon kotak berisi garis bernomor: penomoran -->
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="3" y="5" width="18" height="14" rx="2"/><path d="M7 10l1.5-1v6M12 9h3.5l-3.5 6h3.5M7 17.5h10"/></svg>
                    </span>
                    <span class="kotak-label-menu">Penomoran</span>
                </a>
                <a href="#" class="kotak-menu kotak-oranye" data-halaman="Desain Cetakan">
                    <span class="kotak-ikon">
                        <!-- Ikon printer dengan pensil: desain cetakan -->
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M7 9V3h9v6"/><path d="M7 17H5a1 1 0 0 1-1-1v-6a1 1 0 0 1 1-1h14a1 1 0 0 1 1 1v3"/><rect x="7" y="13" width="8" height="8" rx="1"/><path d="M15.5 21l5-5 1.5 1.5-5 5-2 .5z"/></svg>
                    </span>
                    <span class="kotak-label-menu">Desain Cetakan</span>
                </a>
                <a href="#" class="kotak-menu kotak-oranye" data-halaman="Cadangan Data">
                    <span class="kotak-ikon">
                        <!-- Ikon basis data dengan panah: cadangan data -->
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><ellipse cx="11" cy="5.5" rx="7" ry="2.8"/><path d="M4 5.5v6c0 1.5 3.1 2.8 7 2.8M4 11.5v6c0 1.5 3.1 2.8 7 2.8"/><path d="M18 21v-6M15 18l3-3 3 3"/></svg>
                    </span>
                    <span class="kotak-label-menu">Cadangan Data</span>
                </a>
                <a href="#" class="kotak-menu kotak-oranye" data-halaman="Transaksi Favorit">
                    <span class="kotak-ikon">
                        <!-- Ikon bintang di lembar: transaksi yang disimpan sebagai templat -->
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M6 3h9l4 4v14H6z"/><path d="M14 3v5h5"/><path d="M12 10l1.3 2.7 2.9.4-2.1 2 .5 2.9-2.6-1.4-2.6 1.4.5-2.9-2.1-2 2.9-.4z"/></svg>
                    </span>
                    <span class="kotak-label-menu">Transaksi Favorit</span>
                </a>
            </div>
        </div>
    </dialog>
`);

pasangTampilan("dialog-lampiran", /*html*/ `
    <!-- ===== Popup Lampiran (alat bersama umum/lampiran.js; dipakai Jurnal Umum, Pembayaran, Penerimaan, dll.):
         menambah, melihat, mengunduh, dan menghapus file lampiran. Perubahan baru tersimpan saat datanya disimpan. ===== -->
    <dialog id="dialog-lampiran" class="dialog-detail dialog-lampiran" aria-labelledby="judul-lampiran">
        <header class="dialog-detail-kepala">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M20 11.5l-8 8a5 5 0 0 1-7-7l9-9a3.3 3.3 0 0 1 4.7 4.7l-9 9a1.7 1.7 0 0 1-2.4-2.4l8-8"/></svg>
            <h2 id="judul-lampiran">Lampiran</h2>
            <button type="button" id="tutup-lampiran" class="dialog-detail-tutup" aria-label="Tutup">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" aria-hidden="true"><path d="M6 6l12 12M18 6L6 18"/></svg>
            </button>
        </header>

        <div class="dialog-detail-isi">
            <!-- Muncul kalau Preferensi, Lampiran mewajibkan lampiran untuk halaman ini -->
            <p id="lampiran-wajib" class="kotak-peringatan" hidden>
                Lampiran <strong>wajib</strong> untuk <span id="lampiran-wajib-nama">Jurnal Umum</span> (Preferensi, Lampiran). Data tidak bisa disimpan tanpa lampiran.
            </p>
            <p class="petunjuk lampiran-petunjuk">
                Boleh PDF, foto (JPG, PNG, WEBP), Word, Excel, CSV, atau TXT. Paling banyak 5 file, tiap file paling besar 700 KB.
                Foto dikecilkan otomatis. File PDF yang lebih besar harus dikompres dulu.
                Isi file ikut diperiksa: file yang hanya diganti namanya (misalnya program dinamai .jpg) ditolak.
            </p>
            <div class="lampiran-aksi">
                <button type="button" id="tombol-tambah-lampiran" class="tombol tombol-garis">Tambah File</button>
                <input id="lampiran-berkas" type="file" multiple class="sembunyi-visual" tabindex="-1"
                       accept=".pdf,.jpg,.jpeg,.png,.webp,.doc,.docx,.xls,.xlsx,.csv,.txt" aria-label="Pilih file lampiran">
            </div>
            <p id="galat-lampiran" class="pesan-galat-kolom" role="alert" hidden></p>
            <ul id="daftar-lampiran" class="daftar-lampiran"></ul>
            <p id="lampiran-kosong" class="petunjuk">Belum ada lampiran.</p>
        </div>

        <footer class="dialog-detail-kaki">
            <button type="button" id="selesai-lampiran" class="tombol tombol-utama">Selesai</button>
        </footer>
    </dialog>
`);

pasangTampilan("dialog-pintasan", /*html*/ `
    <!-- ===== Popup Pintasan Keyboard (PRD 6.11; logika umum/pintasan.js). Dibuka dengan F1 atau ikon ? di bilah atas. ===== -->
    <dialog id="dialog-pintasan" class="dialog-detail dialog-pintasan" aria-labelledby="judul-pintasan">
        <header class="dialog-detail-kepala">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="2" y="6" width="20" height="12" rx="2"/><path d="M6 10h.01M10 10h.01M14 10h.01M18 10h.01M7 14h10"/></svg>
            <h2 id="judul-pintasan">Pintasan Keyboard</h2>
            <button type="button" id="tutup-pintasan" class="dialog-detail-tutup" aria-label="Tutup">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" aria-hidden="true"><path d="M6 6l12 12M18 6L6 18"/></svg>
            </button>
        </header>
        <div class="dialog-detail-isi">
            <table class="tabel-pintasan">
                <tbody>
                    <tr><td><kbd>Ctrl + S</kbd></td><td>Simpan formulir yang sedang tampil</td></tr>
                    <tr><td><kbd>Alt + N</kbd></td><td>Data Baru</td></tr>
                    <tr><td><kbd>Alt + D</kbd></td><td>Pindah antara Daftar dan Formulir (tombol hijau)</td></tr>
                    <tr><td><kbd>Alt + W</kbd></td><td>Tutup tab kecil yang aktif (ada peringatan kalau isinya berubah)</td></tr>
                    <tr><td><kbd>Ctrl + P</kbd></td><td>Cetak lewat Halaman Cetak (transaksi, laporan, daftar)</td></tr>
                    <tr><td><kbd>Alt + L</kbd></td><td>Buka Lampiran (transaksi bertombol klip)</td></tr>
                    <tr><td><kbd>Esc</kbd></td><td>Tutup popup</td></tr>
                    <tr><td><kbd>F1</kbd></td><td>Tampilkan daftar pintasan ini</td></tr>
                </tbody>
            </table>
            <p class="petunjuk">Pintasan tidak bekerja saat popup terbuka (kecuali Esc). Tidak ada pintasan Hapus, supaya data tidak terhapus tidak sengaja.</p>
        </div>
        <footer class="dialog-detail-kaki">
            <button type="button" id="selesai-pintasan" class="tombol tombol-utama">Tutup</button>
        </footer>
    </dialog>
`);

pasangTampilan("dialog-ganti-sandi", /*html*/ `
    <!-- ===== Popup Ganti Kata Sandi (menu pengguna, PRD 6.12; logika umum/sesi-aplikasi.js) ===== -->
    <dialog id="dialog-ganti-sandi" class="dialog-detail dialog-ganti-sandi" aria-labelledby="judul-ganti-sandi">
        <header class="dialog-detail-kepala">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="4" y="11" width="16" height="10" rx="2"/><path d="M8 11V7a4 4 0 0 1 8 0v4"/></svg>
            <h2 id="judul-ganti-sandi">Ganti Kata Sandi</h2>
            <button type="button" id="tutup-ganti-sandi" class="dialog-detail-tutup" aria-label="Tutup">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" aria-hidden="true"><path d="M6 6l12 12M18 6L6 18"/></svg>
            </button>
        </header>
        <form id="form-ganti-sandi-app" class="dialog-detail-isi" novalidate>
            <div class="baris-form"><label for="gsa-lama">Kata sandi sekarang</label><input id="gsa-lama" type="password" autocomplete="current-password" maxlength="200"></div>
            <div class="baris-form"><label for="gsa-baru">Kata sandi baru (minimal 8 karakter)</label><input id="gsa-baru" type="password" autocomplete="new-password" maxlength="200"></div>
            <div class="baris-form"><label for="gsa-ulang">Ulangi kata sandi baru</label><input id="gsa-ulang" type="password" autocomplete="new-password" maxlength="200"></div>
            <p id="galat-ganti-sandi" class="pesan-galat-kolom" role="alert" hidden></p>
        </form>
        <footer class="dialog-detail-kaki">
            <button type="button" id="batal-ganti-sandi" class="tombol tombol-garis">Batal</button>
            <button type="submit" form="form-ganti-sandi-app" id="simpan-ganti-sandi" class="tombol tombol-utama">Simpan</button>
        </footer>
    </dialog>
`);
