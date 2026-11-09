// ==================== Cetak Bukti: menyusun PDF dari desain ====================
// Mengubah elemen Desain Cetakan menjadi PDF lewat umum/buat-pdf.js (PRD 6.9). Posisi dan ukuran sama dengan editor; bedanya hanya
// satu: Tabel Rincian mengikuti jumlah baris, dan semua elemen di bawahnya naik atau turun mengikuti tabel, supaya tidak ada ruang
// kosong di tengah. Baris yang tidak muat berlanjut ke halaman PDF berikutnya, dengan judul kolom diulang.
// Dimuat sesudah fitur/cetakan/cetakan.js dan sebelum fitur/cetak-bukti/cetak-bukti.js.

var WARNA_BIRU_CETAK = "#0b2a5b";

// Elemen teks. Seperti di layar, baris yang tidak muat di kotak elemen tidak ikut tampil.
function gambarTeksPdf(pdf, e, isi, y) {
    var g = e.gaya || {}, ukuran = Number(g.ukuran) || 11;
    var w = Math.max(1, Number(e.w) - 1.6), tinggi = tinggiBarisPdf(ukuran);
    var muat = Math.max(1, Math.floor((Number(e.h) - 0.8 + 0.01) / tinggi));
    lipatTeksPdf(gantiPenanda(e.isi || "", isi), w, ukuran, g.tebal).slice(0, muat).forEach(function (baris, i) {
        pdf.teks(baris, xRataPdf(baris, Number(e.x) + 0.8, w, g, ukuran), garisDasarPdf(y + 0.4 + i * tinggi, ukuran), { ukuran: ukuran, tebal: g.tebal, miring: g.miring, warna: g.warna || "#111111" });
    });
}

// Logo masuk ke kotaknya tanpa berubah bentuk. Yayasan tanpa logo: tidak ada yang digambar di kertas.
function gambarLogoPdf(pdf, e, logo, y) {
    if (!logo) { return; }
    var skala = Math.min(Number(e.w) / logo.lebar, Number(e.h) / logo.tinggi);
    var w = logo.lebar * skala, h = logo.tinggi * skala;
    pdf.gambar(logo.data, logo.lebar, logo.tinggi, Number(e.x) + (Number(e.w) - w) / 2, y + (Number(e.h) - h) / 2, w, h);
}

function gambarElemenPdf(pdf, e, isi, logo, y) {
    var g = e.gaya || {};
    if (e.jenis === "teks") { gambarTeksPdf(pdf, e, isi, y); }
    else if (e.jenis === "kotak") { pdf.kotak(Number(e.x), y, Number(e.w), Number(e.h), { latar: g.warnaLatar, garis: g.warnaGaris || "#333333", tebal: typeof g.tebalGaris === "number" ? g.tebalGaris : 0.3 }); }
    else if (e.jenis === "garis") { pdf.kotak(Number(e.x), y, Number(e.w), Number(e.h), { latar: g.warnaGaris || "#111111" }); }
    else if (e.jenis === "logo") { gambarLogoPdf(pdf, e, logo, y); }
}

// Mengukur satu baris tabel: isi tiap sel sudah dilipat, tinggi mengikuti sel tertinggi. Jarak dalam sel sama dengan .tabel-cetak.
function ukurBarisTabelPdf(tabel, nilai, lebarTabel, ukuran, tebal) {
    var sel = tabel.kolom.map(function (k, i) {
        return lipatTeksPdf(teksAman(nilai[i]), Math.max(1, lebarTabel * k.lebar / 100 - 2.4), ukuran, tebal);
    });
    var terbanyak = sel.reduce(function (n, s) { return Math.max(n, s.length); }, 1);
    return { sel: sel, tinggi: terbanyak * tinggiBarisPdf(ukuran) + 1.6 };
}

function gambarBarisTabelPdf(pdf, tabel, ukur, x, y, lebarTabel, g) {
    var geser = x;
    tabel.kolom.forEach(function (k, i) {
        var w = lebarTabel * k.lebar / 100;
        ukur.sel[i].forEach(function (baris, n) {
            pdf.teks(baris, xRataPdf(baris, geser + 1.2, w - 2.4, { rata: k.kanan ? "kanan" : "kiri", tebal: g.tebal }, g.ukuran), garisDasarPdf(y + 0.8 + n * tinggiBarisPdf(g.ukuran), g.ukuran), g);
        });
        geser += w;
    });
}

// Menggambar Tabel Rincian mulai yAwal. Mengembalikan posisi y di bawah tabel (bisa di halaman lain).
function gambarTabelPdf(pdf, e, tabel, yAwal, kertas) {
    var gaya = e.gaya || {}, ukuran = Number(gaya.ukuran) || 9;
    var x = Number(e.x), w = Number(e.w), y = yAwal;
    var gayaIsi = { ukuran: ukuran, warna: gaya.warna || "#111111" };
    var gayaJudul = { ukuran: ukuran, tebal: true, warna: WARNA_BIRU_CETAK };
    var gayaTotal = { ukuran: ukuran, tebal: true, warna: gayaIsi.warna };
    var ukurJudul = ukurBarisTabelPdf(tabel, tabel.kolom.map(function (k) { return k.judul; }), w, ukuran, true);

    function judul() {
        gambarBarisTabelPdf(pdf, tabel, ukurJudul, x, y, w, gayaJudul);
        y += ukurJudul.tinggi;
        pdf.kotak(x, y, w, 0.4, { latar: WARNA_BIRU_CETAK });
        y += 0.4;
    }
    function halamanLanjutan() {
        pdf.halamanBaru(kertas.lebar, kertas.tinggi);
        y = kertas.atas;
        judul();
    }

    judul();
    tabel.baris.forEach(function (nilai) {
        var ukur = ukurBarisTabelPdf(tabel, nilai, w, ukuran, false);
        if (y + ukur.tinggi > kertas.batas) { halamanLanjutan(); }
        gambarBarisTabelPdf(pdf, tabel, ukur, x, y, w, gayaIsi);
        y += ukur.tinggi;
        pdf.kotak(x, y, w, 0.15, { latar: "#e4e9f1" });
        y += 0.15;
    });
    if (tabel.total) {
        var ukurTotal = ukurBarisTabelPdf(tabel, tabel.total, w, ukuran, true);
        if (y + ukurTotal.tinggi + 1 > kertas.batas) { halamanLanjutan(); }
        pdf.kotak(x, y, w, 0.4, { latar: WARNA_BIRU_CETAK });
        y += 0.4;
        gambarBarisTabelPdf(pdf, tabel, ukurTotal, x, y, w, gayaTotal);
        y += ukurTotal.tinggi;
        pdf.kotak(x, y, w, 0.6, { latar: WARNA_BIRU_CETAK });
        y += 0.6;
    }
    return y;
}

// Ukuran kertas dan batas isi dari desain
function kertasBuktiPdf(desain) {
    var kertas = ukuranKertas[desain.kertas] || ukuranKertas.A4;
    var mendatar = desain.orientasi === "landscape";
    var m = marginDesain(desain);
    var tinggi = mendatar ? kertas.lebar : kertas.tinggi;
    return { lebar: mendatar ? kertas.tinggi : kertas.lebar, tinggi: tinggi, atas: Number(m.atas) || 0, batas: tinggi - (Number(m.bawah) || 0) };
}

// Menyusun seluruh dokumen, mengembalikan objek pdf (umum/buat-pdf.js)
function susunBuktiPdf(desain, data, logo) {
    var kertas = kertasBuktiPdf(desain);
    var isi = Object.assign({}, dataContohCetakan(), { keterangan: "", no_jurnal: "" }, data, {
        dicetak: "Dicetak " + teksWaktuDicetak() + " oleh " + penggunaAktif, dibuat_oleh: penggunaAktif
    });
    var elemen = elemenDesain(desain);
    var tabelEl = isi.tabel ? elemen.find(function (e) { return e.jenis === "tabel"; }) : null;
    var pdf = buatPdf();
    pdf.halamanBaru(kertas.lebar, kertas.tinggi);

    if (!tabelEl) {
        elemen.forEach(function (e) { gambarElemenPdf(pdf, e, isi, logo, Number(e.y)); });
        return pdf;
    }
    var bawahTabel = Number(tabelEl.y) + Number(tabelEl.h);
    var bagianBawah = elemen.filter(function (e) { return e !== tabelEl && Number(e.y) >= bawahTabel; });
    elemen.forEach(function (e) {
        if (e !== tabelEl && bagianBawah.indexOf(e) === -1) { gambarElemenPdf(pdf, e, isi, logo, Number(e.y)); }
    });
    var y = gambarTabelPdf(pdf, tabelEl, isi.tabel, Number(tabelEl.y), kertas);

    // Bagian bawah tidak dipotong: kalau tidak muat, seluruhnya pindah ke halaman berikutnya
    var tinggiBawah = bagianBawah.reduce(function (n, e) { return Math.max(n, Number(e.y) + Number(e.h) - bawahTabel); }, 0);
    if (y + tinggiBawah > kertas.batas) {
        pdf.halamanBaru(kertas.lebar, kertas.tinggi);
        y = kertas.atas;
    }
    bagianBawah.forEach(function (e) { gambarElemenPdf(pdf, e, isi, logo, y + Number(e.y) - bawahTabel); });
    return pdf;
}

// Logo diubah ke JPEG lewat alat bersama umum/buat-pdf.js. Logo yang rusak dilewati: dokumen tetap jadi, tanpa logo.
function muatLogoPdf(logoData, selesai) { muatGambarPdf(logoData, 600, 0.92, selesai); }

// Membuat dokumen lalu mengirim objek pdf (umum/buat-pdf.js) ke selesai(pdf). Kalau gagal, selesai(null).
function buatBuktiPdf(desain, data, selesai) {
    muatLogoPdf(dataContohCetakan().logoData, function (logo) {
        var pdf = null;
        try {
            pdf = susunBuktiPdf(desain, data, logo);
        } catch (galat) {
            pdf = null;
        }
        selesai(pdf);
    });
}
