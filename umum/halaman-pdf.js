// ==================== Halaman Cetak ====================
// Halaman penuh seperti Accurate: PDF di kiri, tombol Cetak, Unduh PDF, Tutup di kanan (PRD 6.9).
// Dipakai Cetak Bukti, laporan, dan semua halaman daftar. PDF-nya sama di semua browser dan printer.
//   tampilkanHalamanCetak(pdf, judul, namaBerkas) : membuka halaman untuk objek pdf (umum/buat-pdf.js)
//   bukaPdfCetak(susun, judul, namaBerkas)        : susun() membuat objek pdf; kalau gagal, muncul pesan, bukan macet
// Gaya: umum/halaman-pdf.css.

pasangTampilan("halaman-pdf", /*html*/ `
    <div id="halaman-cetak-bukti" class="halaman-cetak-bukti" role="dialog" aria-modal="true" aria-labelledby="hcb-judul" hidden>
        <iframe id="hcb-pdf" class="hcb-pdf" title="Dokumen yang akan dicetak"></iframe>
        <aside class="hcb-samping">
            <h2 id="hcb-judul"></h2>
            <button type="button" id="hcb-cetak" class="tombol">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M7 9V3h10v6M7 18H4v-7a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v7h-3M7 14h10v7H7z"/></svg>
                Cetak
            </button>
            <button type="button" id="hcb-unduh" class="tombol tombol-garis">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 3v12M7 11l5 5 5-5M4 21h16"/></svg>
                Unduh PDF
            </button>
            <button type="button" id="hcb-tutup" class="tombol tombol-garis">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" aria-hidden="true"><path d="M6 6l12 12M18 6L6 18"/></svg>
                Tutup
            </button>
            <p id="hcb-petunjuk" class="petunjuk" role="status">Kalau jendela cetak tidak terbuka, klik ikon printer di pojok kanan atas dokumen.</p>
        </aside>
    </div>
`);

// Dokumen PDF yang sedang tampil: { blob, alamat, namaBerkas }, atau null
var dokumenCetak = null;
var halamanCetakBukti = document.getElementById("halaman-cetak-bukti");
var bingkaiPdf = document.getElementById("hcb-pdf");
var petunjukCetak = document.getElementById("hcb-petunjuk");
var fokusSebelumCetak = null;

// Nama berkas tanpa huruf yang dilarang Windows
function namaBerkasPdf(nama) {
    return nama.replace(/[\\/:*?"<>|]/g, "-") + ".pdf";
}

// Mengosongkan bingkai dan melepas alamat sementara PDF
function lepasDokumenCetak() {
    if (!dokumenCetak) { return; }
    bingkaiPdf.src = "about:blank";
    URL.revokeObjectURL(dokumenCetak.alamat);
    dokumenCetak = null;
}

function tampilkanHalamanCetak(pdf, judul, namaBerkas) {
    lepasDokumenCetak();
    var blob = pdf.blob();
    dokumenCetak = { blob: blob, alamat: URL.createObjectURL(blob), namaBerkas: namaBerkas };
    petunjukCetak.classList.remove("hcb-sorot");
    document.getElementById("hcb-judul").textContent = judul;   // textContent: aman dari kode HTML
    fokusSebelumCetak = document.activeElement;
    bingkaiPdf.src = dokumenCetak.alamat;
    halamanCetakBukti.hidden = false;
    document.body.classList.add("editor-terbuka");   // halaman di belakang tidak ikut tergulir
    document.getElementById("hcb-cetak").focus();
}

function bukaPdfCetak(susun, judul, namaBerkas) {
    var pdf = null;
    try {
        pdf = susun();
    } catch (galat) {
        pdf = null;
    }
    if (pdf) {
        tampilkanHalamanCetak(pdf, judul, namaBerkas);
    } else {
        tampilkanNotifikasi("Dokumen belum bisa dibuat.", "peringatan");
    }
}

function tutupHalamanCetak() {
    lepasDokumenCetak();
    halamanCetakBukti.hidden = true;
    document.body.classList.remove("editor-terbuka");
    if (fokusSebelumCetak && fokusSebelumCetak.isConnected) { fokusSebelumCetak.focus(); }
}

document.getElementById("hcb-tutup").addEventListener("click", tutupHalamanCetak);
halamanCetakBukti.addEventListener("keydown", function (kejadian) {
    if (kejadian.key === "Escape") { tutupHalamanCetak(); }
});

// Yang dicetak PDF-nya, bukan halaman aplikasi, jadi tulisan browser tidak ikut tercetak. Firefox mengizinkan halaman memulai cetak PDF.
// Chrome dan Edge tidak mengizinkan, baik lewat print() maupun perintah di dalam PDF (sudah diuji), sehingga pengguna diarahkan ke ikon
// printer pada penampil PDF.
document.getElementById("hcb-cetak").addEventListener("click", function () {
    if (!dokumenCetak) { return; }
    if (/Firefox\//.test(navigator.userAgent)) {
        try {
            bingkaiPdf.contentWindow.focus();
            bingkaiPdf.contentWindow.print();
            return;
        } catch (galat) { /* lanjut ke petunjuk di bawah */ }
    }
    petunjukCetak.classList.add("hcb-sorot");
});

document.getElementById("hcb-unduh").addEventListener("click", function () {
    if (dokumenCetak && !unduhTeks(dokumenCetak.namaBerkas, dokumenCetak.blob, "application/pdf")) {
        tampilkanNotifikasi("PDF belum bisa diunduh.", "peringatan");
    }
});
