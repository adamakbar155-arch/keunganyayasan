// ==================== Tampilan: Pengaturan: Transaksi Favorit ====================
// Tab dan popup Transaksi Favorit (PRD 6.8, dari foto Accurate). Daftarnya dibuat otomatis oleh buatModulDaftar.
// Logikanya: fitur/favorit/favorit.js. Gaya: fitur/favorit/favorit.css.

pasangTampilan("tab-favorit", /*html*/ `
                <div class="tab" id="tab-favorit" hidden>
                    <button type="button" class="tab-judul" data-tab="favorit">Transaksi Favorit</button>
                    <button type="button" class="tab-tutup" data-tutup="favorit" aria-label="Tutup tab Transaksi Favorit">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" aria-hidden="true"><path d="M6 6l12 12M18 6L6 18"/></svg>
                    </button>
                </div>
`);

pasangTampilan("isi-favorit", /*html*/ `
            <!-- ===== Isi tab Transaksi Favorit: hanya daftar, seluruh tampilannya dibuat otomatis oleh buatModulDaftar ===== -->
            <section id="isi-favorit" class="isi-tab" hidden></section>
`);

pasangTampilan("dialog-favorit", /*html*/ `
    <!-- ===== Menu tombol Lainnya: posisinya diatur JavaScript, tepat di bawah tombol yang diklik ===== -->
    <div id="menu-lainnya" class="menu-lainnya" role="menu" hidden>
        <button type="button" id="menu-tambah-favorit" role="menuitem">Tambah ke Favorit</button>
    </div>

    <!-- ===== Popup Favorit: menyimpan favorit baru, atau mengubah favorit dari halaman Transaksi Favorit ===== -->
    <dialog id="dialog-favorit" class="dialog-detail" aria-labelledby="judul-dialog-favorit">
        <header class="dialog-detail-kepala">
            <h2 id="judul-dialog-favorit">Tambah ke Favorit</h2>
            <button type="button" id="tutup-dialog-favorit" class="dialog-detail-tutup" aria-label="Tutup">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" aria-hidden="true"><path d="M6 6l12 12M18 6L6 18"/></svg>
            </button>
        </header>
        <div class="dialog-detail-isi">
            <div class="baris-form">
                <label for="favorit-nama">Nama Favorit <span class="wajib" aria-hidden="true">*</span></label>
                <div>
                    <input id="favorit-nama" type="text" maxlength="80" autocomplete="off" aria-required="true">
                    <p id="galat-favorit-nama" class="pesan-galat-kolom" role="alert" hidden></p>
                </div>
            </div>
            <p id="favorit-info" class="petunjuk"></p>
        </div>
        <footer class="dialog-detail-kaki favorit-kaki">
            <button type="button" id="hapus-favorit" class="tombol tombol-garis" hidden>Hapus</button>
            <button type="button" id="pakai-favorit" class="tombol tombol-garis" hidden>Pakai</button>
            <button type="button" id="simpan-favorit" class="tombol tombol-utama">Simpan</button>
        </footer>
    </dialog>

    <!-- ===== Popup Ambil: daftar favorit satu Tipe Transaksi ===== -->
    <dialog id="dialog-ambil-favorit" class="dialog-detail" aria-labelledby="judul-ambil-favorit">
        <header class="dialog-detail-kepala">
            <h2 id="judul-ambil-favorit">Ambil dari Favorit</h2>
            <button type="button" id="tutup-ambil-favorit" class="dialog-detail-tutup" aria-label="Tutup">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" aria-hidden="true"><path d="M6 6l12 12M18 6L6 18"/></svg>
            </button>
        </header>
        <div class="dialog-detail-isi">
            <div id="daftar-ambil-favorit" class="daftar-ambil-favorit"></div>
        </div>
    </dialog>
`);
