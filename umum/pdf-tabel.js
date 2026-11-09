// ==================== PDF berisi tabel ====================
// Satu cara menyusun dokumen bertabel menjadi PDF, dipakai laporan dan semua halaman daftar (PRD 6.9). Sumbernya data biasa, bukan layar:
//   susunPdfTabel({ kertas, fleksibel, kepala, keterangan, tabel, catatan, kaki })
//     kertas: { lebar, tinggi, kiri, kanan, atas, bawah } dalam mm
//     fleksibel: true = satu halaman setinggi isinya (Modifikasi laporan)
//     kepala: [{ teks, ukuran, tebal, miring, warna }], di tengah, hanya di halaman pertama
//     keterangan: teks kecil rata kanan di atas tabel (filter); catatan: [teks] sesudah tabel; kaki: teks kiri bawah tiap halaman
//     tabel: [{ kolom: [lebar mm], jarak: jarak antarkolom mm, kosong: teks kalau tanpa baris, judul: [baris], baris: [baris] }]
//     baris: { sel: [sel], padAtas, padBawah, latar }
//     sel: { teks, span, rata, tebal, miring, warna, ukuran, geser, tanpaLipat, alasBawah, atas, bawah, gambar, tinggiGambar };
//          atas/bawah = { tebal, warna, ganda }; gambar = (boleh tidak ada) [{ data, lebar, tinggi }] JPEG dari jpegPdfDariGambar,
//          ditaruh berjajar di bawah teks setinggi tinggiGambar mm (misalnya foto nota kecil di laporan Bukti Pengeluaran)
// Judul kolom diulang di tiap halaman, dan setiap halaman punya kaki "Halaman x dari y". Butuh umum/buat-pdf.js.

var JARAK_BARIS_TABEL_PDF = 1.35;
var TINGGI_FLEKSIBEL_PDF = 5000;   // batas tinggi halaman PDF yang aman, dalam mm

function lebarSelPdf(tabel, awal, span) {
    var w = 0;
    for (var i = awal; i < awal + span && i < tabel.kolom.length; i++) { w += tabel.kolom[i]; }
    return w + tabel.jarak * (span - 1);
}

// Menyiapkan satu baris: posisi, lebar, dan isi tiap sel sudah dilipat; tinggi mengikuti sel tertinggi
function ukurBarisPdfTabel(tabel, baris, x) {
    var kolomKe = 0, hasil = [], tertinggi = 0;
    baris.sel.forEach(function (s) {
        var span = s.span || 1, w = lebarSelPdf(tabel, kolomKe, span);
        var geser = s.geser || 0, ruang = Math.max(1, w - geser);
        var isi = s.teks === "" && s.gambar && s.gambar.length ? [] : (s.tanpaLipat ? [String(s.teks)] : lipatTeksPdf(s.teks, ruang, s.ukuran, s.tebal));
        var xSel = x;
        for (var i = 0; i < kolomKe; i++) { xSel += tabel.kolom[i] + tabel.jarak; }
        hasil.push({ s: s, x: xSel, w: w, ruang: ruang, isi: isi });
        var tinggiGambar = s.gambar && s.gambar.length ? (s.tinggiGambar || 10) + (isi.length ? 0.6 : 0) : 0;
        tertinggi = Math.max(tertinggi, isi.length * tinggiBarisPdf(s.ukuran, JARAK_BARIS_TABEL_PDF) + tinggiGambar);
        kolomKe += span;
    });
    return { sel: hasil, tinggi: tertinggi + (baris.padAtas || 0) + (baris.padBawah || 0), tinggiIsi: tertinggi };
}

function gambarGarisSelPdf(pdf, x, y, w, garis) {
    // Garis dobel: dua garis tipis dengan celah di tengah, seperti garis akuntansi di layar
    var tipis = garis.ganda ? garis.tebal / 3 : garis.tebal;
    pdf.kotak(x, y, w, tipis, { latar: garis.warna });
    if (garis.ganda) { pdf.kotak(x, y + tipis * 2, w, tipis, { latar: garis.warna }); }
}

// Gambar kecil di sel: berjajar ke kanan setinggi tinggiGambar; yang tidak muat lagi di lebar sel dilewati
function gambarSelPdf(pdf, s, u, y) {
    var h = s.tinggiGambar || 10, x = u.x + (s.geser || 0), batasKanan = u.x + u.w;
    s.gambar.forEach(function (g) {
        var w = Math.min(h * g.lebar / Math.max(1, g.tinggi), u.ruang);
        if (x + w > batasKanan + 0.01) { return; }
        pdf.gambar(g.data, g.lebar, g.tinggi, x, y, w, h * Math.min(1, w / (h * g.lebar / Math.max(1, g.tinggi))));
        x += w + 1;
    });
}

function gambarBarisPdfTabel(pdf, baris, ukur, y) {
    if (baris.latar) {
        var awal = ukur.sel[0], akhir = ukur.sel[ukur.sel.length - 1];
        pdf.kotak(awal.x, y, akhir.x + akhir.w - awal.x, ukur.tinggi, { latar: baris.latar });
    }
    ukur.sel.forEach(function (u) {
        var s = u.s, tinggi = tinggiBarisPdf(s.ukuran, JARAK_BARIS_TABEL_PDF);
        var yIsi = y + (baris.padAtas || 0) + (s.alasBawah ? ukur.tinggiIsi - u.isi.length * tinggi : 0);
        u.isi.forEach(function (t, n) {
            // Teks tanpa lipat yang lebih panjang dari kolomnya tetap sejajar di tepi kanan kolom
            pdf.teks(t, xRataPdf(t, u.x + (s.geser || 0), u.ruang, s, s.ukuran), garisDasarPdf(yIsi + n * tinggi, s.ukuran, JARAK_BARIS_TABEL_PDF),
                { ukuran: s.ukuran, tebal: s.tebal, miring: s.miring, warna: s.warna });
        });
        if (s.gambar && s.gambar.length) { gambarSelPdf(pdf, s, u, yIsi + u.isi.length * tinggi + (u.isi.length ? 0.6 : 0)); }
        if (s.atas) { gambarGarisSelPdf(pdf, u.x, y, u.w, s.atas); }
        if (s.bawah) { gambarGarisSelPdf(pdf, u.x, y + ukur.tinggi - s.bawah.tebal, u.w, s.bawah); }
    });
}

// Menggambar seluruh isi pada kertas setinggi tinggi mm. Mengembalikan posisi y terakhir.
function gambarIsiPdfTabel(pdf, isi, tinggi) {
    var k = isi.kertas;
    var lebarIsi = k.lebar - k.kiri - k.kanan;
    var batas = tinggi - Math.max(k.bawah, 10);   // kaki halaman ditulis di bawah batas ini
    var y = 0;

    function halamanBaru() {
        pdf.halamanBaru(k.lebar, tinggi);
        pdf.kotak(0, 0, k.lebar, 1.2, { latar: "#0b2a5b" });
        pdf.kotak(0, 0, 26, 1.2, { latar: "#f5a623" });
        y = k.atas;
    }
    function tulisTeks(teks, gaya, rata) {
        var o = { rata: rata, tebal: gaya.tebal };
        lipatTeksPdf(teks, lebarIsi, gaya.ukuran, gaya.tebal).forEach(function (t) {
            if (y + tinggiBarisPdf(gaya.ukuran) > batas) { halamanBaru(); }
            pdf.teks(t, xRataPdf(t, k.kiri, lebarIsi, o, gaya.ukuran), garisDasarPdf(y, gaya.ukuran), gaya);
            y += tinggiBarisPdf(gaya.ukuran);
        });
    }

    halamanBaru();
    (isi.kepala || []).forEach(function (g) { tulisTeks(g.teks, g, "tengah"); });
    y += 3;
    if (isi.keterangan) { tulisTeks(isi.keterangan, { ukuran: 7.5, warna: "#4b5563" }, "kanan"); y += 1; }

    (isi.tabel || []).forEach(function (tabel) {
        var lebarTabel = lebarSelPdf(tabel, 0, tabel.kolom.length);
        var x = k.kiri + Math.max(0, (lebarIsi - lebarTabel) / 2);
        function judul() {
            tabel.judul.forEach(function (b) {
                var u = ukurBarisPdfTabel(tabel, b, x);
                gambarBarisPdfTabel(pdf, b, u, y);
                y += u.tinggi;
            });
        }
        judul();
        tabel.baris.forEach(function (b) {
            var u = ukurBarisPdfTabel(tabel, b, x);
            if (y + u.tinggi > batas) { halamanBaru(); judul(); }
            gambarBarisPdfTabel(pdf, b, u, y);
            y += u.tinggi;
        });
        if (!tabel.baris.length && tabel.kosong) { y += 2; tulisTeks(tabel.kosong, { ukuran: 9, miring: true, warna: "#4b5563" }, "tengah"); }
        y += 4;
    });
    (isi.catatan || []).forEach(function (teks) { tulisTeks(teks, { ukuran: 8, warna: "#4b5563" }, "kiri"); y += 1; });
    return y;
}

function susunPdfTabel(isi) {
    var tinggi = isi.kertas.tinggi;
    if (isi.fleksibel) {
        var yAkhir = gambarIsiPdfTabel(buatPdf(), isi, TINGGI_FLEKSIBEL_PDF);
        tinggi = Math.min(TINGGI_FLEKSIBEL_PDF, Math.ceil(yAkhir) + Math.max(isi.kertas.bawah, 10) + 2);
    }
    var pdf = buatPdf();
    gambarIsiPdfTabel(pdf, isi, tinggi);

    // Kaki baru bisa ditulis sesudah jumlah halaman diketahui
    var k = isi.kertas, jumlah = pdf.jumlahHalaman(), yKaki = tinggi - Math.max(k.bawah, 10) + 5;
    var gaya = { ukuran: 7.5, warna: "#4b5563" }, lebarIsi = k.lebar - k.kiri - k.kanan;
    for (var i = 0; i < jumlah; i++) {
        pdf.pilihHalaman(i);
        if (isi.kaki) { pdf.teks(isi.kaki, k.kiri, yKaki, gaya); }
        var nomor = "Halaman " + (i + 1) + " dari " + jumlah;
        pdf.teks(nomor, xRataPdf(nomor, k.kiri, lebarIsi, { rata: "kanan" }, 7.5), yKaki, gaya);
    }
    return pdf;
}

// Daftar: semua baris yang sedang tampil sesudah filter dan pencarian, seperti Unduh CSV.
// Lebih dari 5 kolom memakai kertas mendatar. Kolom yang isinya angka rata kanan.
function susunPdfDaftar(judul, namaKolom, baris) {
    var BATAS_KOLOM_TEGAK = 5, UKURAN = 8.5;
    var mendatar = namaKolom.length > BATAS_KOLOM_TEGAK;
    var kertas = { lebar: mendatar ? 297 : 210, tinggi: mendatar ? 210 : 297, kiri: 10, kanan: 10, atas: 10, bawah: 10 };
    var lebarIsi = kertas.lebar - kertas.kiri - kertas.kanan;
    var jarak = 2;

    // Lebar kolom menurut isi terpanjang, lalu disesuaikan dengan lebar kertas
    var ukuran = namaKolom.map(function (nama, i) {
        var terlebar = lebarTeksPdf(nama, UKURAN, true);
        baris.forEach(function (b) { terlebar = Math.max(terlebar, lebarTeksPdf(String(b[i]), UKURAN, false)); });
        return Math.max(12, Math.min(lebarIsi * 0.45, terlebar + 1));
    });
    var total = ukuran.reduce(function (n, w) { return n + w; }, 0);
    var ruang = lebarIsi - jarak * (namaKolom.length - 1);
    var kolom = ukuran.map(function (w) { return w * ruang / total; });
    var kanan = namaKolom.map(function (nama, i) {
        return baris.length > 0 && baris.every(function (b) { return /^(Rp\s?)?-?[\d.,]*$/.test(String(b[i])); });
    });

    function sel(teks, i, tebal, warna) {
        return { teks: String(teks), rata: kanan[i] ? "kanan" : "kiri", tebal: tebal, ukuran: UKURAN, warna: warna };
    }
    return susunPdfTabel({
        kertas: kertas,
        kepala: [{ teks: judul, ukuran: 13, tebal: true, warna: "#0b2a5b" }],
        kaki: "Dicetak " + teksWaktuDicetak(),
        tabel: [{
            kolom: kolom, jarak: jarak, kosong: "Belum ada data.",
            judul: [{ padAtas: 1.2, padBawah: 1.2, latar: "#e8edf4", sel: namaKolom.map(function (nama, i) { return sel(nama, i, true, "#0b2a5b"); }) }],
            baris: baris.map(function (b) {
                return { padAtas: 0.9, padBawah: 0.9, sel: b.map(function (t, i) {
                    return Object.assign(sel(t, i, false, "#111111"), { bawah: { tebal: 0.15, warna: "#e4e9f1" } });
                }) };
            })
        }]
    });
}
