// ==================== Unduh Excel (.xlsx) ====================
// Berkas .xlsx asli tanpa pustaka luar (aplikasi berjalan tanpa internet, PRD 7). Berkas .xlsx adalah arsip ZIP berisi
// beberapa berkas XML; arsip dibuat tanpa pemadatan (metode "stored"), jadi cukup CRC32 dan susunan bait yang benar.
// Teks ditulis sebagai teks biasa (inlineStr), bukan rumus, jadi isi seperti "=HYPERLINK(...)" tidak dijalankan Excel.
//   baris : [[sel]] per baris. sel = { nilai: teks atau angka, tebal: true/false }, atau null untuk sel kosong.
//           Angka tampil berformat ribuan, minus dalam kurung, 0 sebagai "-", sama dengan kertas laporan.
//   lebar : [lebar kolom dalam jumlah huruf]
// Dipakai laporan (fitur/laporan/kertas.js).

var TIPE_BERKAS_EXCEL = "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet";

function teksXmlAman(nilai) {
    return String(nilai)
        .replace(/[^\x09\x0A\x0D\x20-퟿-�]/g, "")   // tanda yang tidak boleh ada di XML dibuang
        .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}

// Nomor kolom -> huruf Excel: 0 -> A, 26 -> AA
function hurufKolomExcel(n) {
    var hasil = "";
    for (var i = n + 1; i > 0; i = Math.floor((i - 1) / 26)) { hasil = String.fromCharCode(65 + (i - 1) % 26) + hasil; }
    return hasil;
}

function xmlLembarExcel(baris, lebar) {
    var kolom = lebar.map(function (l, i) { return '<col min="' + (i + 1) + '" max="' + (i + 1) + '" width="' + l + '" customWidth="1"/>'; }).join("");
    var isi = baris.map(function (b, nb) {
        var sel = b.map(function (s, nk) {
            if (!s || s.nilai === "" || s.nilai === null || s.nilai === undefined) { return ""; }
            var alamat = hurufKolomExcel(nk) + (nb + 1);
            if (typeof s.nilai === "number" && isFinite(s.nilai)) {
                return '<c r="' + alamat + '" s="' + (s.tebal ? 3 : 2) + '"><v>' + s.nilai + "</v></c>";
            }
            return '<c r="' + alamat + '" s="' + (s.tebal ? 1 : 0) + '" t="inlineStr"><is><t xml:space="preserve">' + teksXmlAman(s.nilai) + "</t></is></c>";
        }).join("");
        return '<row r="' + (nb + 1) + '">' + sel + "</row>";
    }).join("");
    return '<?xml version="1.0" encoding="UTF-8" standalone="yes"?><worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main">' +
        (kolom ? "<cols>" + kolom + "</cols>" : "") + "<sheetData>" + isi + "</sheetData></worksheet>";
}

// Empat gaya sel: 0 teks, 1 teks tebal, 2 angka, 3 angka tebal
var GAYA_EXCEL = '<?xml version="1.0" encoding="UTF-8" standalone="yes"?><styleSheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main">' +
    '<numFmts count="1"><numFmt numFmtId="164" formatCode="#,##0;(#,##0);&quot;-&quot;"/></numFmts>' +
    '<fonts count="2"><font><sz val="11"/><name val="Calibri"/></font><font><b/><sz val="11"/><name val="Calibri"/></font></fonts>' +
    '<fills count="2"><fill><patternFill patternType="none"/></fill><fill><patternFill patternType="gray125"/></fill></fills>' +
    '<borders count="1"><border><left/><right/><top/><bottom/><diagonal/></border></borders>' +
    '<cellStyleXfs count="1"><xf numFmtId="0" fontId="0" fillId="0" borderId="0"/></cellStyleXfs>' +
    '<cellXfs count="4"><xf numFmtId="0" fontId="0" fillId="0" borderId="0" xfId="0"/><xf numFmtId="0" fontId="1" fillId="0" borderId="0" xfId="0" applyFont="1"/>' +
    '<xf numFmtId="164" fontId="0" fillId="0" borderId="0" xfId="0" applyNumberFormat="1"/><xf numFmtId="164" fontId="1" fillId="0" borderId="0" xfId="0" applyFont="1" applyNumberFormat="1"/></cellXfs>' +
    "</styleSheet>";

// CRC32 baku ZIP
var TABEL_CRC32 = (function () {
    var t = [];
    for (var n = 0; n < 256; n++) {
        var c = n;
        for (var k = 0; k < 8; k++) { c = (c & 1) ? (0xEDB88320 ^ (c >>> 1)) : (c >>> 1); }
        t.push(c >>> 0);
    }
    return t;
})();
function crc32Bait(bait) {
    var c = 0xFFFFFFFF;
    for (var i = 0; i < bait.length; i++) { c = TABEL_CRC32[(c ^ bait[i]) & 0xFF] ^ (c >>> 8); }
    return (c ^ 0xFFFFFFFF) >>> 0;
}

// Arsip ZIP tanpa pemadatan. berkas = [{ nama, isi: teks }]. Hasil: Uint8Array.
function buatZipTanpaPadat(berkas) {
    var penyandi = new TextEncoder();
    function dua(n) { return [n & 255, (n >>> 8) & 255]; }
    function empat(n) { return [n & 255, (n >>> 8) & 255, (n >>> 16) & 255, (n >>> 24) & 255]; }
    var bagian = [], pusat = [], posisi = 0;
    berkas.forEach(function (b) {
        var nama = penyandi.encode(b.nama), isi = penyandi.encode(b.isi), crc = crc32Bait(isi);
        // Versi 20, tanda bit 11 (nama UTF-8), metode 0, waktu dan tanggal tetap (1 Jan 2026), lalu CRC dan ukuran
        var umum = [].concat(dua(20), dua(0x0800), dua(0), dua(0), dua(0x5C21), empat(crc), empat(isi.length), empat(isi.length), dua(nama.length), dua(0));
        var kepala = new Uint8Array([0x50, 0x4B, 0x03, 0x04].concat(umum));
        bagian.push(kepala, nama, isi);
        pusat.push(new Uint8Array([0x50, 0x4B, 0x01, 0x02].concat(dua(20), umum, dua(0), dua(0), dua(0), empat(0), empat(posisi))), nama);
        posisi += kepala.length + nama.length + isi.length;
    });
    var ukuranPusat = pusat.reduce(function (n, p) { return n + p.length; }, 0);
    var akhir = new Uint8Array([0x50, 0x4B, 0x05, 0x06, 0, 0, 0, 0].concat(dua(berkas.length), dua(berkas.length), empat(ukuranPusat), empat(posisi), dua(0)));
    var semua = bagian.concat(pusat, [akhir]);
    var hasil = new Uint8Array(semua.reduce(function (n, p) { return n + p.length; }, 0));
    var ke = 0;
    semua.forEach(function (p) { hasil.set(p, ke); ke += p.length; });
    return hasil;
}

// Isi berkas .xlsx sebagai Uint8Array. namaLembar: nama tab di Excel (paling panjang 31 huruf, tanpa tanda terlarang).
function buatBerkasExcel(namaLembar, baris, lebar) {
    var lembar = teksXmlAman(String(namaLembar).replace(/[[\]:*?/\\]/g, " ").slice(0, 31).trim() || "Laporan");
    var kepalaXml = '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>';
    return buatZipTanpaPadat([
        { nama: "[Content_Types].xml", isi: kepalaXml + '<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="xml" ContentType="application/xml"/><Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/><Override PartName="/xl/worksheets/sheet1.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/><Override PartName="/xl/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.styles+xml"/></Types>' },
        { nama: "_rels/.rels", isi: kepalaXml + '<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="xl/workbook.xml"/></Relationships>' },
        { nama: "xl/workbook.xml", isi: kepalaXml + '<workbook xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships"><sheets><sheet name="' + lembar + '" sheetId="1" r:id="rId1"/></sheets></workbook>' },
        { nama: "xl/_rels/workbook.xml.rels", isi: kepalaXml + '<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet1.xml"/><Relationship Id="rId2" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles" Target="styles.xml"/></Relationships>' },
        { nama: "xl/styles.xml", isi: GAYA_EXCEL },
        { nama: "xl/worksheets/sheet1.xml", isi: xmlLembarExcel(baris, lebar) }
    ]);
}
