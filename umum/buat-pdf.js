// ==================== Pembuat PDF ====================
// Membuat berkas PDF sungguhan tanpa pustaka luar, karena aplikasi berjalan tanpa internet (PRD 6.9, seperti umum/unduh-excel.js).
// Berkas PDF adalah daftar "objek" teks, ditutup tabel posisi tiap objek. Kertas dan posisi tersimpan di berkas, jadi hasilnya
// sama di semua browser dan semua printer. Satuan yang dipakai pemanggil: milimeter dari pojok kiri atas; PDF sendiri memakai
// point dari pojok kiri bawah, dan pengubahannya hanya ada di sini.
// Huruf: Helvetica bawaan PDF (setara Arial, tidak perlu ditanam). Huruf di luar abjad Latin belum didukung dan ditulis "?".

var PT_PER_MM = 72 / 25.4;

// Lebar huruf Helvetica (kode 32 sampai 126), per 1000 satuan ukuran huruf. Angka baku dari Adobe.
// Dipakai untuk rata kanan, rata tengah, dan melipat baris. Huruf miring selebar huruf tegak.
var LEBAR_HURUF_PDF = [278, 278, 355, 556, 556, 889, 667, 191, 333, 333, 389, 584, 278, 333, 278, 278, 556, 556, 556, 556, 556, 556, 556, 556, 556, 556, 278, 278, 584, 584, 584, 556, 1015,
    667, 667, 722, 722, 667, 611, 778, 722, 278, 500, 667, 556, 833, 722, 778, 667, 778, 722, 667, 611, 722, 667, 944, 667, 667, 611, 278, 278, 278, 469, 556, 333,
    556, 556, 500, 556, 556, 278, 556, 556, 222, 222, 500, 222, 833, 556, 556, 556, 556, 333, 500, 278, 556, 500, 722, 500, 500, 500, 334, 260, 334, 584];
var LEBAR_HURUF_TEBAL_PDF = [278, 333, 474, 556, 556, 889, 722, 238, 333, 333, 389, 584, 278, 333, 278, 278, 556, 556, 556, 556, 556, 556, 556, 556, 556, 556, 333, 333, 584, 584, 584, 611, 975,
    722, 722, 722, 722, 667, 611, 778, 722, 278, 556, 722, 611, 833, 722, 778, 667, 778, 722, 667, 611, 722, 667, 944, 667, 667, 611, 333, 278, 333, 584, 556, 333,
    556, 611, 556, 611, 556, 333, 611, 611, 278, 278, 556, 278, 889, 611, 611, 611, 611, 389, 556, 333, 611, 556, 778, 556, 556, 500, 389, 280, 389, 584];

// Huruf di luar Latin-1 yang tetap punya tempat di tabel huruf PDF (WinAnsi)
var HURUF_KHUSUS_PDF = { 0x20AC: 128, 0x2026: 133, 0x2018: 145, 0x2019: 146, 0x201C: 147, 0x201D: 148, 0x2022: 149, 0x2013: 150, 0x2014: 151 };

// Satu huruf menjadi kodenya di tabel huruf PDF. Yang tidak ada menjadi "?" (kode 63).
function kodeHurufPdf(huruf) {
    var kode = huruf.codePointAt(0);
    if ((kode >= 32 && kode <= 126) || (kode >= 160 && kode <= 255)) { return kode; }
    return HURUF_KHUSUS_PDF[kode] || 63;
}

// Lebar teks dalam milimeter
function lebarTeksPdf(teks, ukuran, tebal) {
    var tabel = tebal ? LEBAR_HURUF_TEBAL_PDF : LEBAR_HURUF_PDF;
    var jumlah = Array.from(String(teks)).reduce(function (n, huruf) {
        var kode = kodeHurufPdf(huruf);
        return n + (tabel[kode - 32] || 556);
    }, 0);
    return jumlah / 1000 * ukuran / PT_PER_MM;
}

// Melipat teks menjadi baris-baris selebar paling besar lebar mm. Tanda baris baru tetap dihormati;
// kata yang lebih panjang dari satu baris dipotong per huruf.
function lipatTeksPdf(teks, lebar, ukuran, tebal) {
    var hasil = [];
    String(teks).split("\n").forEach(function (paragraf) {
        var baris = "";
        paragraf.split(/\s+/).forEach(function (kata) {
            var coba = baris ? baris + " " + kata : kata;
            if (lebarTeksPdf(coba, ukuran, tebal) <= lebar) { baris = coba; return; }
            if (baris) { hasil.push(baris); }
            baris = "";
            Array.from(kata).forEach(function (huruf) {
                if (baris && lebarTeksPdf(baris + huruf, ukuran, tebal) > lebar) { hasil.push(baris); baris = ""; }
                baris += huruf;
            });
        });
        hasil.push(baris);
    });
    return hasil;
}

// Teks satu baris selebar paling besar lebar mm; yang terlalu panjang dipotong dengan "..." (misalnya isian sel ringkasan)
function teksSebarisPdf(teks, lebar, ukuran, tebal) {
    var baris = lipatTeksPdf(teks, lebar, ukuran, tebal);
    if (baris.length <= 1) { return baris[0] || ""; }
    var t = baris[0];
    while (t && lebarTeksPdf(t + "...", ukuran, tebal) > lebar) { t = t.slice(0, -1); }
    return t + "...";
}

// Tinggi satu baris teks dalam mm. jarak = kelipatan ukuran huruf (seperti line-height), bawaan 1,25
function tinggiBarisPdf(ukuran, jarak) { return ukuran / PT_PER_MM * (jarak || 1.25); }

// Garis dasar huruf pada baris setinggi tinggiBarisPdf, dihitung dari tepi atas baris
function garisDasarPdf(y, ukuran, jarak) { return y + tinggiBarisPdf(ukuran, jarak) / 2 + ukuran / PT_PER_MM * 0.35; }

// x untuk satu baris teks menurut perataan. g: { rata: "kiri" | "tengah" | "kanan", tebal }
function xRataPdf(teks, x, w, g, ukuran) {
    var sisa = w - lebarTeksPdf(teks, ukuran, g.tebal);
    if (g.rata === "kanan") { return x + sisa; }
    if (g.rata === "tengah") { return x + sisa / 2; }
    return x;
}

// Angka pasti aman ditulis ke berkas, walau data desain rusak
function angkaPdf(n) {
    var nilai = Number(n);
    return (Number.isFinite(nilai) ? nilai : 0).toFixed(2);
}

// "#0b2a5b" menjadi "0.04 0.16 0.36" (nilai merah hijau biru 0 sampai 1). Warna tidak sah menjadi hitam.
function warnaPdf(warna) {
    var cocok = /^#([0-9a-f]{2})([0-9a-f]{2})([0-9a-f]{2})$/i.exec(String(warna || ""));
    if (!cocok) { return "0 0 0"; }
    return [1, 2, 3].map(function (i) { return (parseInt(cocok[i], 16) / 255).toFixed(3); }).join(" ");
}

function buatPdf() {
    var halaman = [], gambarDaftar = [], aktif = null;

    function tulis(perintah) { aktif.isi.push(perintah); }
    // Tepi atas mm menjadi posisi dari bawah dalam point
    function yPdf(y) { return (aktif.tinggi - Number(y)) * PT_PER_MM; }

    var pdf = {
        halamanBaru: function (lebar, tinggi) {
            aktif = { lebar: lebar, tinggi: tinggi, isi: [], gambar: {} };
            halaman.push(aktif);
        },
        jumlahHalaman: function () { return halaman.length; },
        // Kembali ke halaman yang sudah ada (nomor mulai 0), misalnya untuk menulis kaki "Halaman x dari y"
        pilihHalaman: function (nomor) { aktif = halaman[nomor]; },

        // Kotak berisi warna dan atau bergaris tepi. opsi: { latar, garis, tebal (mm) }
        kotak: function (x, y, w, h, opsi) {
            var o = opsi || {};
            var tebal = Number(o.tebal) || 0;
            if (!o.latar && !tebal) { return; }
            if (o.latar) { tulis(warnaPdf(o.latar) + " rg"); }
            if (tebal) { tulis(warnaPdf(o.garis) + " RG " + angkaPdf(tebal * PT_PER_MM) + " w"); }
            // Garis digambar di dalam kotak, seperti border di layar
            var setengah = tebal / 2;
            tulis([angkaPdf((x + setengah) * PT_PER_MM), angkaPdf(yPdf(y + h - setengah)), angkaPdf((w - tebal) * PT_PER_MM), angkaPdf((h - tebal) * PT_PER_MM)].join(" ")
                + " re " + (o.latar && tebal ? "B" : (o.latar ? "f" : "S")));
        },

        // Satu baris teks. y = garis dasar huruf. opsi: { ukuran (pt), tebal, miring, warna }
        teks: function (isi, x, y, opsi) {
            var o = opsi || {};
            var bait = Array.from(String(isi)).map(function (huruf) {
                return ("0" + kodeHurufPdf(huruf).toString(16).toUpperCase()).slice(-2);
            }).join("");
            if (!bait) { return; }
            var font = "F" + ((o.tebal ? 2 : 1) + (o.miring ? 2 : 0));
            tulis("BT /" + font + " " + angkaPdf(o.ukuran || 9) + " Tf " + warnaPdf(o.warna) + " rg " + angkaPdf(x * PT_PER_MM) + " " + angkaPdf(yPdf(y)) + " Td <" + bait + "> Tj ET");
        },

        // Gambar JPEG. data = Uint8Array berkas JPEG. Gambar yang sama dipakai ulang lewat nomornya.
        gambar: function (data, lebarPiksel, tinggiPiksel, x, y, w, h) {
            var nomor = gambarDaftar.findIndex(function (g) { return g.data === data; });
            if (nomor === -1) {
                gambarDaftar.push({ data: data, lebar: lebarPiksel, tinggi: tinggiPiksel });
                nomor = gambarDaftar.length - 1;
            }
            aktif.gambar[nomor] = true;
            tulis("q " + angkaPdf(w * PT_PER_MM) + " 0 0 " + angkaPdf(h * PT_PER_MM) + " " + angkaPdf(x * PT_PER_MM) + " " + angkaPdf(yPdf(y + h)) + " cm /G" + nomor + " Do Q");
        },

        // Menyusun seluruh berkas menjadi Blob PDF
        blob: function () {
            var potongan = [], panjang = 0, posisi = [];
            function tambahTeks(teks) {
                var b = new Uint8Array(teks.length);
                for (var i = 0; i < teks.length; i++) { b[i] = teks.charCodeAt(i); }
                potongan.push(b);
                panjang += b.length;
            }
            function tambahBait(b) { potongan.push(b); panjang += b.length; }
            function mulaiObjek(nomor) { posisi[nomor] = panjang; tambahTeks(nomor + " 0 obj\n"); }
            function objek(nomor, isi) { mulaiObjek(nomor); tambahTeks(isi + "\nendobj\n"); }

            // Nomor objek: 1 katalog, 2 daftar halaman, 3-6 huruf, lalu gambar, lalu halaman dan isinya
            var nomorGambar = 7;
            var nomorHalaman = nomorGambar + gambarDaftar.length;
            tambahTeks("%PDF-1.4\n");
            objek(1, "<</Type /Catalog /Pages 2 0 R>>");
            objek(2, "<</Type /Pages /Count " + halaman.length + " /Kids [" + halaman.map(function (h, i) { return (nomorHalaman + i * 2) + " 0 R"; }).join(" ") + "]>>");
            ["Helvetica", "Helvetica-Bold", "Helvetica-Oblique", "Helvetica-BoldOblique"].forEach(function (nama, i) {
                objek(3 + i, "<</Type /Font /Subtype /Type1 /BaseFont /" + nama + " /Encoding /WinAnsiEncoding>>");
            });
            gambarDaftar.forEach(function (g, i) {
                mulaiObjek(nomorGambar + i);
                tambahTeks("<</Type /XObject /Subtype /Image /Width " + g.lebar + " /Height " + g.tinggi + " /ColorSpace /DeviceRGB /BitsPerComponent 8 /Filter /DCTDecode /Length " + g.data.length + ">>\nstream\n");
                tambahBait(g.data);
                tambahTeks("\nendstream\nendobj\n");
            });
            halaman.forEach(function (h, i) {
                var nomor = nomorHalaman + i * 2;
                var daftarGambar = Object.keys(h.gambar).map(function (n) { return "/G" + n + " " + (nomorGambar + Number(n)) + " 0 R"; }).join(" ");
                objek(nomor, "<</Type /Page /Parent 2 0 R /MediaBox [0 0 " + angkaPdf(h.lebar * PT_PER_MM) + " " + angkaPdf(h.tinggi * PT_PER_MM) + "]"
                    + " /Resources <</Font <</F1 3 0 R /F2 4 0 R /F3 5 0 R /F4 6 0 R>> /XObject <<" + daftarGambar + ">>>> /Contents " + (nomor + 1) + " 0 R>>");
                var isi = h.isi.join("\n");
                objek(nomor + 1, "<</Length " + isi.length + ">>\nstream\n" + isi + "\nendstream");
            });

            var jumlahObjek = nomorHalaman + halaman.length * 2;
            var awalTabel = panjang;
            var tabel = "xref\n0 " + jumlahObjek + "\n0000000000 65535 f \n";
            for (var n = 1; n < jumlahObjek; n++) { tabel += ("0000000000" + posisi[n]).slice(-10) + " 00000 n \n"; }
            tambahTeks(tabel + "trailer\n<</Size " + jumlahObjek + " /Root 1 0 R>>\nstartxref\n" + awalTabel + "\n%%EOF\n");
            return new Blob(potongan, { type: "application/pdf" });
        }
    };
    return pdf;
}

// ----- Gambar untuk PDF -----
// PDF hanya bisa memuat gambar JPEG secara langsung. Gambar lain (PNG, WEBP, logo, foto nota) digambar ke kanvas berlatar
// putih lalu diubah ke JPEG. sisiMaks = sisi terpanjang hasil (piksel), supaya berkas PDF tidak terlalu besar.
// Dari elemen <img> yang SUDAH selesai dimuat (langsung, tanpa menunggu). Mengembalikan { data, lebar, tinggi } atau null.
function jpegPdfDariGambar(gambar, sisiMaks, mutu) {
    try {
        if (!gambar || !gambar.complete || !gambar.naturalWidth) { return null; }
        var skala = Math.min(1, sisiMaks / Math.max(gambar.naturalWidth, gambar.naturalHeight));
        var kanvas = document.createElement("canvas");
        kanvas.width = Math.max(1, Math.round(gambar.naturalWidth * skala));
        kanvas.height = Math.max(1, Math.round(gambar.naturalHeight * skala));
        var alat = kanvas.getContext("2d");
        if (!alat) { return null; }
        alat.fillStyle = "#ffffff";
        alat.fillRect(0, 0, kanvas.width, kanvas.height);
        alat.drawImage(gambar, 0, 0, kanvas.width, kanvas.height);
        var biner = atob(kanvas.toDataURL("image/jpeg", mutu || 0.85).split(",")[1]);
        var data = new Uint8Array(biner.length);
        for (var i = 0; i < biner.length; i++) { data[i] = biner.charCodeAt(i); }
        return { data: data, lebar: kanvas.width, tinggi: kanvas.height };
    } catch (galat) { return null; }   // gambar rusak: dilewati, dokumen tetap jadi
}
// Dari alamat gambar (data:...). Memuat dulu, lalu selesai({ data, lebar, tinggi }) atau selesai(null) kalau rusak.
function muatGambarPdf(alamat, sisiMaks, mutu, selesai) {
    if (!alamat) { selesai(null); return; }
    var gambar = new Image();
    gambar.onerror = function () { selesai(null); };
    gambar.onload = function () { selesai(jpegPdfDariGambar(gambar, sisiMaks, mutu)); };
    gambar.src = alamat;
}