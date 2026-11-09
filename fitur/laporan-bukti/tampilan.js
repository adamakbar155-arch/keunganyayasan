// HTML popup Lihat Bukti untuk laporan Bukti Pengeluaran per Divisi dan Program (PRD 5.4). Logika: laporan-bukti.js.
pasangTampilan("dialog-bukti-laporan", /*html*/ `
    <!-- ===== Popup Lihat Bukti: bukti tampil besar; bisa diunduh, pindah ke bukti lain transaksi yang sama, atau membuka transaksinya ===== -->
    <dialog id="dialog-bukti-laporan" class="dialog-detail dialog-bukti-laporan" aria-labelledby="judul-bukti-laporan">
        <header class="dialog-detail-kepala">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M20 11.5l-8 8a5 5 0 0 1-7-7l9-9a3.3 3.3 0 0 1 4.7 4.7l-9 9a1.7 1.7 0 0 1-2.4-2.4l8-8"/></svg>
            <h2 id="judul-bukti-laporan">Bukti</h2>
            <button type="button" id="tutup-bukti-laporan" class="dialog-detail-tutup" aria-label="Tutup">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" aria-hidden="true"><path d="M6 6l12 12M18 6L6 18"/></svg>
            </button>
        </header>
        <div class="dialog-detail-isi">
            <!-- Transaksi pemilik bukti: No Bukti, tanggal, jenis, nilai -->
            <p id="bukti-laporan-transaksi" class="bukti-laporan-transaksi"></p>
            <!-- Foto tampil besar; berkas lain (PDF, Word, Excel) cukup namanya, dibuka lewat Unduh -->
            <div id="bukti-laporan-tampil" class="bukti-laporan-tampil"></div>
            <!-- Bukti lain dari transaksi yang sama -->
            <ul id="bukti-laporan-lain" class="bukti-laporan-lain" aria-label="Bukti lain transaksi ini"></ul>
        </div>
        <footer class="dialog-detail-kaki">
            <button type="button" id="bukti-laporan-buka" class="tombol tombol-garis">Buka transaksi</button>
            <button type="button" id="bukti-laporan-unduh" class="tombol tombol-garis">Unduh</button>
            <button type="button" id="bukti-laporan-selesai" class="tombol tombol-utama">Tutup</button>
        </footer>
    </dialog>
`);
