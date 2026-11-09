// ==================== Laporan: PDF dari kertas ====================
// Menyalin kertas laporan yang sedang tampil ke PDF lewat umum/pdf-tabel.js (PRD 6.9). Isi dan gaya tiap sel dibaca dari tabel di layar,
// jadi 23 laporan dan jendela Modifikasi otomatis ikut, tanpa aturan tebal atau garis yang ditulis dua kali.

var MM_PER_PIKSEL = 25.4 / 96;
var PT_PER_PIKSEL = 0.75;

// "rgb(11, 42, 91)" menjadi "#0b2a5b"
function warnaHeksaLaporan(rgb) {
    var angka = String(rgb).match(/\d+/g) || [];
    return "#" + [0, 1, 2].map(function (i) { return ("0" + Number(angka[i] || 0).toString(16)).slice(-2); }).join("");
}

function pikselGaya(nilai) { return parseFloat(nilai) || 0; }

// Garis tepi sel, atau null kalau tidak bergaris
function garisSelLaporan(gaya, sisi, skala) {
    var tebal = pikselGaya(gaya["border" + sisi + "Width"]);
    if (!tebal || gaya["border" + sisi + "Style"] === "none") { return null; }
    return { tebal: tebal * MM_PER_PIKSEL * skala, warna: warnaHeksaLaporan(gaya["border" + sisi + "Color"]), ganda: gaya["border" + sisi + "Style"] === "double" };
}

function selLaporan(td, skala, skalaHuruf) {
    var g = getComputedStyle(td);
    // Gambar kecil di sel (foto nota di laporan Bukti Pengeluaran) ikut ke PDF, setinggi tampilannya di layar
    var foto = td.querySelectorAll("img[data-pdf-gambar]");
    var gambar = Array.prototype.map.call(foto, function (img) { return jpegPdfDariGambar(img, 320, 0.8); }).filter(Boolean);
    var tinggiGambar = foto.length ? Math.max(8, foto[0].getBoundingClientRect().height * MM_PER_PIKSEL * skala) : 0;
    return {
        gambar: gambar, tinggiGambar: tinggiGambar,
        teks: td.textContent.trim(), span: td.colSpan,
        rata: ({ right: "kanan", center: "tengah" })[g.textAlign] || "kiri",
        tebal: Number(g.fontWeight) >= 600, miring: g.fontStyle === "italic", warna: warnaHeksaLaporan(g.color),
        ukuran: pikselGaya(g.fontSize) * PT_PER_PIKSEL * skalaHuruf, geser: pikselGaya(g.paddingLeft) * MM_PER_PIKSEL * skala,
        tanpaLipat: g.whiteSpace === "nowrap", alasBawah: g.verticalAlign === "bottom",
        atas: garisSelLaporan(g, "Top", skala), bawah: garisSelLaporan(g, "Bottom", skala)
    };
}

function barisTabelLaporan(tr, skala, skalaHuruf) {
    var g = tr.cells.length ? getComputedStyle(tr.cells[0]) : null;
    return {
        padAtas: g ? pikselGaya(g.paddingTop) * MM_PER_PIKSEL * skala : 0,
        padBawah: g ? pikselGaya(g.paddingBottom) * MM_PER_PIKSEL * skala : 0,
        sel: Array.prototype.map.call(tr.cells, function (td) { return selLaporan(td, skala, skalaHuruf); })
    };
}

// Lebar tiap kolom di layar (piksel). Baris tanpa sel merentang yang paling lengkap menjadi patokannya.
function lebarKolomLaporan(tabel) {
    var patokan = null;
    Array.prototype.forEach.call(tabel.rows, function (tr) {
        var utuh = Array.prototype.every.call(tr.cells, function (td) { return td.colSpan === 1; });
        if (utuh && (!patokan || tr.cells.length > patokan.cells.length)) { patokan = tr; }
    });
    return patokan ? Array.prototype.map.call(patokan.cells, function (td) { return td.getBoundingClientRect().width; }) : [];
}

function modelTabelLaporan(tabel, lebarIsi, lebarTampil) {
    var lebarPx = lebarKolomLaporan(tabel);
    var jarakPx = pikselGaya(getComputedStyle(tabel).borderSpacing);
    var totalPx = lebarPx.reduce(function (n, w) { return n + w + jarakPx; }, -jarakPx);
    // skala: layar sempit punya kertas lebih kecil dari kertas sungguhan. Tabel yang lebih lebar dari kertas diperkecil supaya muat.
    var skala = Math.min(lebarIsi / lebarTampil, lebarIsi / Math.max(1, totalPx * MM_PER_PIKSEL));
    var skalaHuruf = Math.min(1, skala);
    function baris(bagian) {
        var hasil = [];
        Array.prototype.forEach.call(bagian, function (b) {
            Array.prototype.forEach.call(b.rows, function (tr) {
                if (tr.getClientRects().length) { hasil.push(barisTabelLaporan(tr, skala, skalaHuruf)); }
            });
        });
        return hasil;
    }
    return {
        kolom: lebarPx.map(function (w) { return w * MM_PER_PIKSEL * skala; }),
        jarak: jarakPx * MM_PER_PIKSEL * skala,
        judul: tabel.tHead ? baris([tabel.tHead]) : [],
        baris: baris(tabel.tBodies).concat(tabel.tFoot ? baris([tabel.tFoot]) : [])
    };
}

// PDF laporan yang sedang tampil
function susunPdfLaporan() {
    var p = kertasLaporanAktif.halaman, u = ukuranHalamanLaporan(p);
    var kertas = { lebar: u[0], tinggi: u[1], kiri: p.kiri, kanan: p.kanan, atas: p.atas, bawah: p.bawah };
    var lebarIsi = kertas.lebar - kertas.kiri - kertas.kanan;
    function teks(id) { return document.getElementById(id).textContent; }
    var wadah = document.getElementById("lap-k-isi");
    var lebarTampil = Math.max(1, wadah.clientWidth * MM_PER_PIKSEL);
    var tabel = Array.prototype.map.call(wadah.querySelectorAll("table"), function (t) { return modelTabelLaporan(t, lebarIsi, lebarTampil); });
    var catatan = Array.prototype.map.call(document.querySelectorAll("#lap-k-catatan p"), function (x) { return x.textContent; });
    if (!tabel.length && wadah.textContent.trim()) { catatan.unshift(wadah.textContent.trim()); }   // laporan kosong hanya berisi pesan
    return susunPdfTabel({
        kertas: kertas, fleksibel: p.fleksibel,
        kepala: [
            { teks: teks("lap-k-yayasan").toUpperCase(), ukuran: 10.5, tebal: true, warna: "#111111" },
            { teks: teks("lap-k-judul"), ukuran: 14, tebal: true, warna: "#0b2a5b" },
            { teks: teks("lap-k-periode"), ukuran: 9.5, warna: "#111111" },
            { teks: document.querySelector(".lap-k-mata").textContent, ukuran: 8.5, miring: true, warna: "#4b5563" }
        ],
        keterangan: teks("lap-k-filter"),
        tabel: tabel,
        catatan: catatan,
        kaki: teks("lap-k-dicetak")
    });
}

function judulPdfLaporan() { return document.getElementById("lap-k-judul").textContent; }

function cetakKertasLaporan() {
    var judul = judulPdfLaporan();
    bukaPdfCetak(susunPdfLaporan, judul, namaBerkasPdf(namaBerkasLaporan(judul)));
}

function unduhPdfLaporan() {
    var judul = judulPdfLaporan();
    var pdf = null;
    try { pdf = susunPdfLaporan(); } catch (galat) { pdf = null; }
    if (pdf && unduhTeks(namaBerkasPdf(namaBerkasLaporan(judul)), pdf.blob(), "application/pdf")) {
        tampilkanNotifikasi(judul + " telah diunduh");
    } else {
        tampilkanNotifikasi("PDF belum bisa diunduh.", "peringatan");
    }
}

document.getElementById("lap-cetak").addEventListener("click", cetakKertasLaporan);
// Lampiran audit: bentuk cetak khusus milik laporannya sendiri (misalnya fitur/laporan-bukti)
document.getElementById("lap-cetak-audit").addEventListener("click", function () {
    if (kertasLaporanAktif && typeof kertasLaporanAktif.lap.cetakAudit === "function") { kertasLaporanAktif.lap.cetakAudit(kertasLaporanAktif.param); }
});
