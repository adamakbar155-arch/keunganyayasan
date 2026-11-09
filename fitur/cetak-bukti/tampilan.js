// ==================== Tampilan: Cetak Bukti ====================
// Popup pilihan desain (PRD 6.9). Logikanya: fitur/cetak-bukti/cetak-bukti.js. Halaman Cetak: umum/halaman-pdf.js.

pasangTampilan("dialog-cetak-bukti", /*html*/ `
    <dialog id="dialog-pilih-desain" class="dialog-detail" aria-labelledby="judul-pilih-desain">
        <header class="dialog-detail-kepala">
            <h2 id="judul-pilih-desain">Pilih Desain</h2>
            <button type="button" id="tutup-pilih-desain" class="dialog-detail-tutup" aria-label="Tutup">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" aria-hidden="true"><path d="M6 6l12 12M18 6L6 18"/></svg>
            </button>
        </header>
        <div class="dialog-detail-isi">
            <div id="daftar-pilih-desain" class="daftar-ambil-favorit"></div>
        </div>
    </dialog>
`);
