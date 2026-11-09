// ==================== Desain Cetakan dan editornya ====================
// Berisi: halaman Desain Cetakan (daftar cetakan) dan editor cetakan: memilih, menggeser, mengubah ukuran,
// menambah elemen, gaya teks, penanda isian, urungkan/ulangi, salin/tempel/duplikat.
// HTML-nya ada di fitur/cetakan/tampilan.js. Dipanggil dari index.html sesudah fitur/pengaturan/pengaturan.js.
// Semua nama (var dan function) di sini tetap bisa dipakai skrip lain, karena skrip biasa berbagi satu ruang nama.

// ---------- Halaman Desain Cetakan ----------
// Daftar desain cetak untuk dokumen-dokumen aplikasi. Isi desainnya (kertas, margin, arah, dan elemen)
// diatur di editor cetakan (bagian "Editor Desain Cetakan" di bawah).
// Daftar tipe dokumen ini bisa ditambah kapan saja: cukup tambah satu baris di bawah.
// Kunci "kuitansi-donasi" tetap (data lama memakainya), walaupun namanya kini Tanda Terima Donasi (PRD 6.9).
var tipeCetakan = {
    "kuitansi-donasi": "Tanda Terima Donasi",
    "bukti-pembayaran": "Bukti Pembayaran",
    "bukti-penerimaan": "Bukti Penerimaan",
    "bukti-transfer": "Bukti Transfer",
    "jurnal-umum": "Bukti Jurnal"
};

// Kolom elemen Tabel Rincian tiap tipe. lebar = bagian dari lebar tabel (%), kanan = angka rata kanan.
var KOLOM_TABEL_CETAK = {
    "kuitansi-donasi": [{ judul: "Kategori Donasi", lebar: 45 }, { judul: "Program", lebar: 35 }, { judul: "Nilai", lebar: 20, kanan: true }],
    "bukti-pembayaran": [{ judul: "Akun", lebar: 34 }, { judul: "Keterangan", lebar: 30 }, { judul: "Divisi / Program", lebar: 20 }, { judul: "Nilai", lebar: 16, kanan: true }],
    "bukti-penerimaan": null,
    "bukti-transfer": [{ judul: "Dari Kas/Bank", lebar: 40 }, { judul: "Ke Kas/Bank", lebar: 40 }, { judul: "Nilai", lebar: 20, kanan: true }],
    "jurnal-umum": [{ judul: "Akun", lebar: 34 }, { judul: "Keterangan", lebar: 30 }, { judul: "Debit", lebar: 18, kanan: true }, { judul: "Kredit", lebar: 18, kanan: true }]
};
KOLOM_TABEL_CETAK["bukti-penerimaan"] = KOLOM_TABEL_CETAK["bukti-pembayaran"];

// Baris contoh untuk kertas di editor; saat dicetak diganti baris transaksi
function tabelContohCetakan(tipe) {
    var kolom = KOLOM_TABEL_CETAK[tipe] || KOLOM_TABEL_CETAK["bukti-pembayaran"];
    var nilai = formatAngka(1000000);
    return {
        kolom: kolom,
        baris: [kolom.map(function (k, i) { return k.kanan ? nilai : (i === 0 ? "Contoh isi" : "Contoh"); })],
        total: tipe === "kuitansi-donasi" ? null : kolom.map(function (k, i) { return k.kanan ? nilai : (i === 0 ? "Total" : ""); })
    };
}

// Pengaturan kertas awal setiap desain baru (sama dengan Accurate: A4, tegak, margin dalam mm)
var kertasAwalCetakan = {
    kertas: "A4",
    orientasi: "portrait",
    margin: { kiri: 12, kanan: 12, atas: 14, bawah: 11 }
};

var kolomNamaCetakan = document.getElementById("ct-nama");
var pilihTipeCetakan = document.getElementById("ct-tipe");
var galatCetakan = {
    nama: document.getElementById("galat-ct-nama"),
    tipe: document.getElementById("galat-ct-tipe")
};

// Isi pilihan tipe dari tabel di atas, dengan pilihan kosong di awal (memakai alat bersama isiPilihan)
isiPilihan(pilihTipeCetakan, Object.keys(tipeCetakan), {
    nilai: function (kunci) { return kunci; },
    teks: function (kunci) { return tipeCetakan[kunci]; },
    kosong: "Silakan Pilih"
});

function sembunyikanGalatCetakan() {
    Object.keys(galatCetakan).forEach(function (nama) { galatCetakan[nama].hidden = true; });
}

function tampilkanGalatCetakan(nama, pesan, kolomFokus) {
    galatCetakan[nama].textContent = pesan;
    galatCetakan[nama].hidden = false;
    kolomFokus.focus();
}

// Nama isian dan cara menampilkan nilainya di rincian log
var labelCetakan = { nama: "Nama Desain", tipe: "Tipe" };
var formatCetakan = { tipe: function (kunci) { return tipeCetakan[kunci] || kunci; } };

var modulCetakan = buatModulDaftar({
    id: "cetakan",
    judul: "Desain Cetakan",
    kunci: "daftarCetakan",
    labelData: labelCetakan,
    formatData: formatCetakan,
    kolom: [
        { kunci: "nama", judul: "Nama Desain" },
        { kunci: "tipe", judul: "Tipe Transaksi", tampil: function (c) { return tipeCetakan[c.tipe] || ""; } }
    ],
    filter: [
        { judul: "Tipe Transaksi", ambil: function (c) { return tipeCetakan[c.tipe] || ""; } }
    ],
    isiForm: function (desain) {
        kolomNamaCetakan.value = desain ? desain.nama : "";
        pilihTipeCetakan.value = desain ? desain.tipe : "";
        sembunyikanGalatCetakan();
    }
});

// Daftar desain cetakan. Dipakai halaman transaksi nanti untuk memilih desain saat mencetak.
function bacaCetakan() {
    return modulCetakan.ambil();
}

// Dipanggil saat kotak Desain Cetakan di Pengaturan diklik
function bukaCetakanBaru() {
    modulCetakan.bukaDariMenu();
    kolomNamaCetakan.focus();
}

// Tombol simpan di formulir
document.getElementById("form-cetakan").addEventListener("submit", function (kejadian) {
    kejadian.preventDefault();
    sembunyikanGalatCetakan();
    var nama = kolomNamaCetakan.value.trim();
    var daftar = bacaCetakan();

    // Pemeriksaan satu per satu; berhenti di kesalahan pertama
    if (nama === "") {
        tampilkanGalatCetakan("nama", "Nama desain wajib diisi.", kolomNamaCetakan);
        return;
    }
    if (daftar.some(function (c) { return c.id !== modulCetakan.idDiubah && teksAman(c.nama).toLowerCase() === nama.toLowerCase(); })) {
        tampilkanGalatCetakan("nama", "Nama desain sudah dipakai.", kolomNamaCetakan);
        return;
    }
    if (pilihTipeCetakan.value === "") {
        tampilkanGalatCetakan("tipe", "Tipe wajib dipilih.", pilihTipeCetakan);
        return;
    }

    var sedangMengubah = (modulCetakan.idDiubah !== null);
    var lama = sedangMengubah
        ? Object.assign({}, daftar.find(function (c) { return c.id === modulCetakan.idDiubah; })) : null;
    var data = { nama: nama, tipe: pilihTipeCetakan.value };
    if (sedangMengubah) {
        daftar.forEach(function (c) {
            if (c.id === modulCetakan.idDiubah) {
                Object.assign(c, data);   // pengaturan kertas dan isi desain yang sudah ada tidak ikut terhapus
            }
        });
    } else {
        // Desain baru memakai pengaturan kertas awal; html kosong sampai ada file yang diimpor
        data.id = buatId("c");   // id unik bersama (umum/alat.js)
        data.kertas = kertasAwalCetakan.kertas;
        data.orientasi = kertasAwalCetakan.orientasi;
        data.margin = Object.assign({}, kertasAwalCetakan.margin);
        data.html = "";
        daftar.push(data);
    }
    if (modulCetakan.simpan(daftar)) {
        modulCetakan.selesaiSimpan(sedangMengubah, data, lama);
        if (!sedangMengubah) {
            kolomNamaCetakan.focus();
        }
    }
});

kolomNamaCetakan.addEventListener("input", function () { galatCetakan.nama.hidden = true; });
pilihTipeCetakan.addEventListener("change", function () { galatCetakan.tipe.hidden = true; });

// ---------- Editor Desain Cetakan ----------
// Isi kertas disimpan sebagai DAFTAR ELEMEN: setiap elemen punya jenis (teks, kotak, garis, logo),
// posisi dan ukuran dalam milimeter dari pojok kiri atas kertas, isi, dan gaya.
// Contoh satu elemen: { id, jenis: "teks", x: 12, y: 14, w: 100, h: 8, isi: "{{judul}}", gaya: { ukuran: 15, tebal: true } }
// Penanda seperti {{nama_yayasan}} diganti data asli saat dicetak (di editor: data contoh).
var ukuranKertas = {
    "A4":     { label: "A4 - 210 x 297 mm",        lebar: 210,   tinggi: 297 },
    "A5":     { label: "A5 - 148 x 210 mm",        lebar: 148,   tinggi: 210 },
    "Slip":   { label: "Slip - 99 x 210 mm (1/3 A4)", lebar: 99,  tinggi: 210 },
    "A3":     { label: "A3 - 297 x 420 mm",        lebar: 297,   tinggi: 420 },
    "Letter": { label: "Letter - 215,9 x 279,4 mm", lebar: 215.9, tinggi: 279.4 },
    "F4":     { label: "F4/Folio - 215 x 330 mm",  lebar: 215,   tinggi: 330 }
};

var editorCetakanEl = document.getElementById("editor-cetakan");
var halamanCetak = document.getElementById("ec-halaman");
var kertasPilihEditor = document.getElementById("ec-kertas-pilih");
var orientasiEditor = document.getElementById("ec-orientasi");
var marginEditor = {
    kiri: document.getElementById("ec-margin-kiri"),
    kanan: document.getElementById("ec-margin-kanan"),
    atas: document.getElementById("ec-margin-atas"),
    bawah: document.getElementById("ec-margin-bawah")
};
var galatEditorCetakan = document.getElementById("ec-galat");
var desainDiEditor = null;       // desain yang sedang dibuka (data tersimpan)
var elemenKerja = [];            // elemen yang sedang diedit (salinan; baru disimpan saat tombol Simpan)
var keadaanAwalEditor = "";      // keadaan saat editor dibuka, untuk mendeteksi perubahan yang belum disimpan
var zoomEditor = 0.8;
var nomorElemen = 0;

isiPilihan(kertasPilihEditor, Object.keys(ukuranKertas), {
    nilai: function (kunci) { return kunci; },
    teks: function (kunci) { return ukuranKertas[kunci].label; }
});

// Data untuk mengisi penanda di kanvas. Data yayasan diambil dari Preferensi → Data
// lewat bacaPengaturan (aman kalau data rusak) dan logoAman (hanya gambar yang diterima sebagai logo).
function dataContohCetakan() {
    var yayasan = bacaPengaturan(KUNCI_YAYASAN, {});
    return {
        nama_yayasan: teksAman(yayasan.nama) || "Nama Yayasan",
        alamat: teksAman(yayasan.alamat) || "Alamat yayasan",
        telepon: teksAman(yayasan.telepon) || "(021) 000-0000",
        email: teksAman(yayasan.email) || "yayasan@contoh.id",
        ketua: teksAman(yayasan.ketua) || "Nama Ketua",
        bendahara: teksAman(yayasan.bendahara) || "Nama Bendahara",
        logoData: logoAman(typeof yayasan.logo === "string" ? yayasan.logo : ""),
        judul: "Judul Dokumen",
        nomor: "DON/2026/X/00001",
        tanggal: formatTanggal(tanggalHariIni()),
        donatur: "Hamba Allah",
        program: "Beasiswa Santri",
        keterangan: "Contoh keterangan transaksi",
        jumlah: formatRupiah(1000000),
        terbilang: "Satu juta rupiah",
        dibuat_oleh: penggunaAktif,
        kas: "Kas Kecil",
        pihak: "Nama Pihak",
        no_cek: "-",
        cara_bayar: "Transfer",
        id_donatur: "D.00001",
        dari_kas: "Kas Kecil",
        ke_kas: "Bank Operasional",
        no_jurnal: "JV.2026.11.00001",
        dicetak: "Dicetak " + formatTanggal(tanggalHariIni()),
        tabel: tabelContohCetakan(desainDiEditor ? desainDiEditor.tipe : "")
    };
}

// Isi elemen Tabel Rincian. Semua sel lewat textContent, karena isinya data pengguna.
function buatTabelCetakan(tabel, g) {
    var t = document.createElement("table");
    t.className = "tabel-cetak";
    t.style.fontSize = (g.ukuran || 9) + "pt";
    t.style.color = g.warna || "#111111";
    function baris(induk, nilai, tagSel) {
        var tr = document.createElement("tr");
        tabel.kolom.forEach(function (k, i) {
            var sel = document.createElement(tagSel);
            sel.textContent = teksAman(nilai[i]);
            sel.style.width = k.lebar + "%";
            if (k.kanan) { sel.classList.add("kanan"); }
            tr.appendChild(sel);
        });
        induk.appendChild(tr);
    }
    baris(t.createTHead(), tabel.kolom.map(function (k) { return k.judul; }), "th");
    var badan = t.createTBody();
    tabel.baris.forEach(function (b) { baris(badan, b, "td"); });
    if (tabel.total) { baris(t.createTFoot(), tabel.total, "td"); }
    return t;
}

// Mengganti {{penanda}} dengan data. Hasilnya TEKS BIASA (dipasang lewat textContent),
// jadi tidak ada risiko kode HTML. Penanda yang tidak dikenal dibiarkan, supaya salah ketik terlihat.
function gantiPenanda(teks, data) {
    return teksAman(teks).replace(/\{\{\s*([a-z_]+)\s*\}\}/g, function (semua, kunci) {
        return (kunci !== "logoData" && Object.prototype.hasOwnProperty.call(data, kunci)) ? String(data[kunci]) : semua;
    });
}

// Id elemen: buatId sudah acak, nomor urut tetap ditambahkan supaya elemen yang dibuat
// dalam milidetik yang sama (misalnya desain bawaan) pasti berbeda
function idElemenBaru() {
    nomorElemen++;
    return buatId("e") + "-" + nomorElemen;
}

// Desain bawaan, dibuat dari tipe dokumen dan pengaturan kertas saat ini.
// Donasi mendapat desain lengkap (donatur, program, tabel rincian). Tipe lain mendapat kerangka umum
// (kop, judul, nomor dan tanggal, tanda tangan) sampai desain khasnya dibuat.
// Baris kepala tiap dokumen: [label kiri, isi kiri, label kanan, isi kanan] per baris (PRD 6.9)
var KEPALA_BUKTI = {
    "kuitansi-donasi": [["Telah terima dari", "{{donatur}}", "Tanggal", "{{tanggal}}"], ["ID Donatur", "{{id_donatur}}", "Cara Bayar", "{{cara_bayar}} ke {{kas}}"]],
    "bukti-pembayaran": [["Dibayar dari", "{{kas}}", "Tanggal", "{{tanggal}}"], ["Dibayar kepada", "{{pihak}}", "No Cek", "{{no_cek}}"]],
    "bukti-penerimaan": [["Diterima di", "{{kas}}", "Tanggal", "{{tanggal}}"], ["Diterima dari", "{{pihak}}", "No Cek", "{{no_cek}}"]],
    "bukti-transfer": [["Dari", "{{dari_kas}}", "Tanggal", "{{tanggal}}"], ["Ke", "{{ke_kas}}", "", ""]],
    "jurnal-umum": [["Keterangan", "{{keterangan}}", "Tanggal", "{{tanggal}}"]]
};
var TANDA_TANGAN_BUKTI = {
    "kuitansi-donasi": ["Penerima"],
    "bukti-pembayaran": ["Dibuat", "Diperiksa", "Disetujui", "Penerima"],
    "bukti-penerimaan": ["Dibuat", "Diperiksa", "Disetujui", "Penyetor"],
    "bukti-transfer": ["Dibuat", "Diperiksa", "Disetujui"],
    "jurnal-umum": ["Dibuat", "Diperiksa", "Disetujui"]
};

function elemenBawaan(tipe, pengaturan) {
    var kertas = ukuranKertas[pengaturan.kertas] || ukuranKertas.A4;
    var mendatar = pengaturan.orientasi === "landscape";
    var lebarKertas = mendatar ? kertas.tinggi : kertas.lebar;
    var tinggiKertas = mendatar ? kertas.lebar : kertas.tinggi;
    var m = pengaturan.margin;
    var kiri = m.kiri, atas = m.atas;
    var lebar = Math.max(40, lebarKertas - m.kiri - m.kanan);   // lebar area isi
    var BIRU = "#0b2a5b";
    var ringkas = tinggiKertas < 120;   // kertas pendek seperti Slip: susunan lebih rapat
    var hasil = [];

    function teks(x, y, w, h, isi, gaya) {
        hasil.push({ id: idElemenBaru(), jenis: "teks", x: x, y: y, w: w, h: h, isi: isi,
            gaya: Object.assign({ ukuran: 9, tebal: false, miring: false, rata: "kiri", warna: "#111111" }, gaya || {}) });
    }
    function kotak(x, y, w, h, gaya) {
        hasil.push({ id: idElemenBaru(), jenis: "kotak", x: x, y: y, w: w, h: h, isi: "",
            gaya: Object.assign({ tebalGaris: 0, warnaGaris: BIRU, warnaLatar: "" }, gaya || {}) });
    }
    function garis(x, y, w, tebal, warna) {
        hasil.push({ id: idElemenBaru(), jenis: "garis", x: x, y: y, w: w, h: tebal, isi: "",
            gaya: { tebalGaris: tebal, warnaGaris: warna || "#cfd8e4" } });
    }

    // Garis atas khas kertas laporan aplikasi: biru tua dengan potongan oranye
    kotak(0, 0, lebarKertas, 1.4, { warnaLatar: BIRU });
    kotak(0, 0, 32, 1.4, { warnaLatar: "#f7a823" });

    // Kop: logo, nama yayasan, judul dan nomor di kanan
    // PENTING: angka untuk kertas biasa jangan diubah. Tanda Terima A5 lama dikenali dari angka-angka ini
    // (perbaruiTandaTerimaLama di fitur/cetak-bukti/cetak-bukti.js).
    var tinggiKop = ringkas ? 12 : 14;
    hasil.push({ id: idElemenBaru(), jenis: "logo", x: kiri, y: atas, w: tinggiKop, h: tinggiKop, isi: "", gaya: {} });
    teks(kiri + tinggiKop + 2, atas, lebar * 0.55, ringkas ? 5 : 6, "{{nama_yayasan}}", { ukuran: ringkas ? 10 : 11, tebal: true, warna: BIRU });
    // Kotak alamat cukup untuk dua baris: alamat dan telepon
    teks(kiri + tinggiKop + 2, atas + (ringkas ? 4.8 : 6), lebar * 0.55, ringkas ? 7.2 : 8, "{{alamat}}\n{{telepon}}", { ukuran: ringkas ? 7 : 8, warna: "#4b5870" });
    teks(kiri + lebar * 0.55, atas, lebar * 0.45, 7, "{{judul}}", { ukuran: ringkas ? 11 : 12, tebal: true, rata: "kanan", warna: BIRU });
    teks(kiri + lebar * 0.55, atas + 7, lebar * 0.45, 5, "No. {{nomor}}", { ukuran: ringkas ? 8 : 9, tebal: true, rata: "kanan" });
    garis(kiri, atas + (ringkas ? 13 : 15.5), lebar, 0.3);

    // Kepala: dua kolom label dan isi
    var y = atas + (ringkas ? 15 : 18);
    var tinggiBaris = ringkas ? 4.2 : 5;
    var ukuranKepala = ringkas ? 8 : 9;
    var lebarLabel = ringkas ? 24 : 26, lebarKolom = lebar / 2;
    (KEPALA_BUKTI[tipe] || KEPALA_BUKTI["bukti-pembayaran"]).forEach(function (b) {
        [0, 1].forEach(function (i) {
            var x = kiri + i * lebarKolom;
            if (b[i * 2]) {
                teks(x, y, lebarLabel, tinggiBaris, b[i * 2], { warna: "#4b5870", ukuran: ukuranKepala });
                teks(x + lebarLabel, y, lebarKolom - lebarLabel, tinggiBaris, b[i * 2 + 1], { tebal: true, ukuran: ukuranKepala });
            }
        });
        y += tinggiBaris;
    });
    y += ringkas ? 1 : 2;

    // Jumlah besar pada Tanda Terima Donasi
    if (tipe === "kuitansi-donasi") {
        var tinggiJumlah = ringkas ? 8 : 11;
        kotak(kiri, y, lebar, tinggiJumlah, { warnaLatar: BIRU });
        teks(kiri + 4, y + (ringkas ? 1.5 : 2.6), 50, ringkas ? 5 : 6, "Jumlah donasi", { warna: "#ffffff", ukuran: ukuranKepala });
        teks(kiri + lebar / 2, y + (ringkas ? 0.5 : 1.2), lebar / 2 - 4, ringkas ? 7 : 8.5, "{{jumlah}}", { ukuran: ringkas ? 13 : 15, tebal: true, rata: "kanan", warna: "#ffffff" });
        y += tinggiJumlah + (ringkas ? 1 : 2);
    }

    // Tabel Rincian: jumlah barisnya mengikuti transaksi saat dicetak. Ruangnya memakai sisa kertas (paling besar 70 mm), supaya
    // transaksi biasa muat satu halaman; di bawahnya masih ada Terbilang, ucapan, tanda tangan, dan kaki.
    var yKaki = tinggiKertas - m.bawah - 4;
    // Slip: ruang tabel dibatasi supaya Terbilang tepat di bawah rincian, tanpa ruang kosong di tengah
    var ruangBawah = ringkas ? 1 + 6.5 + 1 + 16 : 2 + 8 + (tipe === "kuitansi-donasi" ? 6 : 0) + 24 + 1;
    var tinggiTabel = Math.max(ringkas ? 12 : 16, Math.min(70, yKaki - y - ruangBawah));
    hasil.push({ id: idElemenBaru(), jenis: "tabel", x: kiri, y: y, w: lebar, h: tinggiTabel, isi: "", gaya: { ukuran: 8.5, warna: "#111111" } });
    y += tinggiTabel + (ringkas ? 1 : 2);

    kotak(kiri, y, 1.2, 6.5, { warnaLatar: "#f7a823" });
    kotak(kiri + 1.2, y, lebar - 1.2, 6.5, { warnaLatar: "#f3f6fc" });
    teks(kiri + 3, y + 1, lebar - 6, 5, "Terbilang: {{terbilang}}", { miring: true, ukuran: ringkas ? 8 : 8.5 });
    y += ringkas ? 7.5 : 8;
    if (tipe === "kuitansi-donasi") {
        // Slip: ucapan di sebelah kiri tanda tangan, supaya tidak memakan baris sendiri
        var UCAPAN = "Terima kasih atas donasi Anda. Semoga menjadi kebaikan yang terus mengalir.";
        if (ringkas) {
            teks(kiri, y + 2, lebar * 0.6, 10, UCAPAN, { miring: true, ukuran: 8, warna: BIRU });
        } else {
            teks(kiri, y, lebar, 5, UCAPAN, { miring: true, rata: "tengah", ukuran: 8.5, warna: BIRU });
            y += 6;
        }
    }

    // Tanda tangan: sama lebar; satu kolom (Tanda Terima) di sisi kanan. Tingginya mengikuti sisa kertas.
    var nama = TANDA_TANGAN_BUKTI[tipe] || TANDA_TANGAN_BUKTI["bukti-pembayaran"];
    var tinggiTtd = Math.max(ringkas ? 13 : 16, Math.min(24, yKaki - y - 1));
    var jarak = 6, lebarTtd = nama.length === 1 ? lebar / 3 : (lebar - jarak * (nama.length - 1)) / nama.length;
    nama.forEach(function (n, i) {
        var x = nama.length === 1 ? kiri + lebar - lebarTtd : kiri + i * (lebarTtd + jarak);
        teks(x, y, lebarTtd, 5, n, { rata: "tengah", warna: "#4b5870", ukuran: 8.5 });
        garis(x, y + tinggiTtd - 5, lebarTtd, 0.2, "#111111");
    });

    // Kaki
    teks(kiri, yKaki, lebar * 0.65, 4, "{{dicetak}}", { ukuran: 7, warna: "#6b7789" });
    teks(kiri + lebar * 0.65, yKaki, lebar * 0.35, 4, "{{no_jurnal}}", { ukuran: 7, rata: "kanan", warna: "#6b7789" });
    return hasil;
}

// Pengaturan kertas dari kolom-kolom di panel kanan
function pengaturanDariEditor() {
    return {
        kertas: kertasPilihEditor.value,
        orientasi: orientasiEditor.value,
        margin: {
            kiri: Number(marginEditor.kiri.value),
            kanan: Number(marginEditor.kanan.value),
            atas: Number(marginEditor.atas.value),
            bawah: Number(marginEditor.bawah.value)
        }
    };
}

function pengaturanValid(p) {
    return ["kiri", "kanan", "atas", "bawah"].every(function (sisi) {
        return Number.isFinite(p.margin[sisi]) && p.margin[sisi] >= 0 && p.margin[sisi] <= 50;
    });
}

// Membuat satu elemen di kanvas. Isi teks dipasang lewat textContent (aman dari kode HTML).
function buatElemenDom(e, data) {
    var el = document.createElement("div");
    el.className = "el-cetak el-" + e.jenis;
    el.dataset.id = e.id;
    el.style.left = e.x + "mm";
    el.style.top = e.y + "mm";
    el.style.width = e.w + "mm";
    el.style.height = e.h + "mm";
    var g = e.gaya || {};
    if (e.id === elemenTerpilihId) { el.classList.add("terpilih"); }
    if (e.jenis === "teks") {
        el.textContent = gantiPenanda(e.isi || "", data);
        el.style.fontSize = (g.ukuran || 11) + "pt";
        el.style.fontWeight = g.tebal ? "700" : "400";
        el.style.fontStyle = g.miring ? "italic" : "normal";
        el.style.textAlign = ({ kiri: "left", tengah: "center", kanan: "right" })[g.rata] || "left";
        el.style.color = g.warna || "#111111";
    } else if (e.jenis === "kotak") {
        // typeof dipakai (bukan "||") supaya tebal 0 betul-betul tanpa garis, bukan jatuh ke nilai awal
        el.style.border = (typeof g.tebalGaris === "number" ? g.tebalGaris : 0.3) + "mm solid " + (g.warnaGaris || "#333333");
        if (g.warnaLatar) { el.style.backgroundColor = g.warnaLatar; }
    } else if (e.jenis === "garis") {
        el.style.backgroundColor = g.warnaGaris || "#111111";
    } else if (e.jenis === "tabel") {
        if (data.tabel) { el.appendChild(buatTabelCetakan(data.tabel, g)); }
    } else if (e.jenis === "logo") {
        if (data.logoData) {
            var gambar = document.createElement("img");
            gambar.alt = "Logo";
            gambar.src = data.logoData;   // sudah dipastikan berupa data gambar
            el.appendChild(gambar);
        } else {
            el.classList.add("el-logo-kosong");
            el.textContent = "LOGO";
        }
    }
    return el;
}

// Menggambar ulang seluruh kertas dari elemen dan pengaturan saat ini
function renderKanvasCetakan() {
    var p = pengaturanDariEditor();
    galatEditorCetakan.hidden = true;
    if (!pengaturanValid(p)) {
        galatEditorCetakan.textContent = "Margin harus angka 0 sampai 50 mm.";
        galatEditorCetakan.hidden = false;
        return;   // kertas tetap menampilkan keadaan sebelumnya
    }
    var kertas = ukuranKertas[p.kertas];
    var lebar = p.orientasi === "landscape" ? kertas.tinggi : kertas.lebar;
    var tinggi = p.orientasi === "landscape" ? kertas.lebar : kertas.tinggi;
    halamanCetak.style.width = lebar + "mm";
    halamanCetak.style.height = tinggi + "mm";
    halamanCetak.textContent = "";

    var data = dataContohCetakan();
    elemenKerja.forEach(function (e) { halamanCetak.appendChild(buatElemenDom(e, data)); });

    // Garis putus-putus penanda batas margin (hanya di editor, tidak ikut dicetak)
    var panduan = document.createElement("div");
    panduan.className = "panduan-margin";
    panduan.style.left = p.margin.kiri + "mm";
    panduan.style.top = p.margin.atas + "mm";
    panduan.style.right = p.margin.kanan + "mm";
    panduan.style.bottom = p.margin.bawah + "mm";
    halamanCetak.appendChild(panduan);

    // Pasang kembali bingkai pilihan kalau ada elemen yang sedang dipilih
    gambarPilihanCetakan();
}

function aturZoomEditor(nilai) {
    zoomEditor = Math.min(2, Math.max(0.2, Math.round(nilai * 100) / 100));
    document.getElementById("ec-kertas").style.zoom = zoomEditor;
    document.getElementById("ec-zoom-teks").textContent = Math.round(zoomEditor * 100) + "%";
}

// Zoom otomatis "pas": seluruh kertas muat di layar tanpa menggulir.
// Begitu pengguna memperbesar atau memperkecil sendiri (zoomManual), pengepasan otomatis berhenti
// sampai tombol "Pas" ditekan lagi.
var zoomManual = false;

function aturZoomPas() {
    var kanvas = document.getElementById("ec-kanvas");
    var halaman = ukuranHalamanMm();
    var lebarPx = halaman.lebar * 96 / 25.4;      // 1 mm = 96/25,4 piksel
    var tinggiPx = halaman.tinggi * 96 / 25.4;
    var tersedia = { lebar: kanvas.clientWidth - 40, tinggi: kanvas.clientHeight - 40 };   // dikurangi padding kanvas
    if (tersedia.lebar <= 0 || tersedia.tinggi <= 0) {
        aturZoomEditor(zoomEditor);   // ukuran layar belum bisa dibaca: pakai zoom sekarang
        return;
    }
    aturZoomEditor(Math.min(tersedia.lebar / lebarPx, tersedia.tinggi / tinggiPx));
}

[kertasPilihEditor, orientasiEditor, marginEditor.kiri, marginEditor.kanan, marginEditor.atas, marginEditor.bawah].forEach(function (el) {
    el.addEventListener("input", function () {
        renderKanvasCetakan();
        // Kertas atau arah berubah = ukuran kertas berubah, jadi pas-kan ulang (kalau belum diatur manual)
        if ((el === kertasPilihEditor || el === orientasiEditor) && !zoomManual) { aturZoomPas(); }
    });
});
document.getElementById("ec-zoom-kurang").addEventListener("click", function () { zoomManual = true; aturZoomEditor(zoomEditor - 0.1); });
document.getElementById("ec-zoom-tambah").addEventListener("click", function () { zoomManual = true; aturZoomEditor(zoomEditor + 0.1); });
document.getElementById("ec-zoom-pas").addEventListener("click", function () { zoomManual = false; aturZoomPas(); });
// Jendela diubah ukurannya: kertas ikut menyesuaikan (kalau tidak diatur manual)
window.addEventListener("resize", function () {
    if (!editorCetakanEl.hidden && !zoomManual) { aturZoomPas(); }
});

// Keadaan editor sekarang (pengaturan + elemen) dalam bentuk teks, untuk mendeteksi perubahan
function keadaanEditor() {
    return JSON.stringify({ p: pengaturanDariEditor(), e: elemenKerja });
}

// Bagian-bagian halaman yang disembunyikan selama editor terbuka (barisan tombol hijau, formulir, daftar)
function bagianHalamanCetak() {
    var seksi = document.getElementById("isi-cetakan");
    return [seksi.querySelector(".modul-bar"), seksi.querySelector(".modul-form")];
}

// Keterangan di panel untuk desain yang sudah tersimpan (dipakai saat editor dibuka dan sesudah Simpan)
var TEKS_ISI_ELEMEN = "Isi kertas tersusun dari elemen. Klik elemen untuk memilih, lalu geser atau ubah ukurannya.";

// Buka editor untuk satu desain
function bukaEditorCetakan(desain) {
    desainDiEditor = desain;
    document.getElementById("ec-judul").textContent = desain.nama;
    document.getElementById("ec-nama").textContent = desain.nama;
    var kertasAwal = desain.kertas || kertasAwalCetakan.kertas;
    var margin = (desain.margin && typeof desain.margin === "object") ? desain.margin : {};
    kertasPilihEditor.value = ukuranKertas[kertasAwal] ? kertasAwal : "A4";
    orientasiEditor.value = desain.orientasi === "landscape" ? "landscape" : "portrait";
    // Tiap sisi margin diperiksa sendiri: kalau data tersimpan rusak (bukan angka), pakai margin awal
    Object.keys(marginEditor).forEach(function (sisi) {
        var nilai = Number(margin[sisi]);
        marginEditor[sisi].value = (margin[sisi] !== "" && Number.isFinite(nilai)) ? nilai : kertasAwalCetakan.margin[sisi];
    });

    // Desain yang sudah punya elemen dibuka apa adanya (salinan); desain baru memakai desain bawaan sesuai tipe.
    // Elemen yang rusak (bukan objek, atau tanpa id) dibuang supaya editor tidak macet.
    var adaElemen = Array.isArray(desain.elemen);
    elemenKerja = adaElemen
        ? JSON.parse(JSON.stringify(desain.elemen)).filter(function (e) {
            return e && typeof e === "object" && typeof e.id === "string" && namaJenisElemen[e.jenis];
        })
        : elemenBawaan(desain.tipe, pengaturanDariEditor());
    document.getElementById("ec-keterangan-isi").textContent = adaElemen
        ? TEKS_ISI_ELEMEN
        : "Memakai desain bawaan untuk tipe ini. Klik Simpan untuk menyimpannya sebagai desain Anda.";
    keadaanAwalEditor = adaElemen ? keadaanEditor() : "";   // desain bawaan yang belum disimpan dianggap "ada perubahan"

    bagianHalamanCetak().forEach(function (el) { el.hidden = true; });
    elemenTerpilihId = null;   // editor baru dibuka: belum ada elemen yang dipilih
    mulaiRiwayat();            // riwayat urungkan dimulai dari keadaan saat dibuka
    // Daftar (dibuat komponen) ikut disembunyikan
    document.querySelectorAll("#isi-cetakan > div").forEach(function (el) {
        if (el !== editorCetakanEl && !el.classList.contains("modul-form") && !el.classList.contains("modul-bar")) { el.hidden = true; }
    });
    editorCetakanEl.hidden = false;
    document.body.classList.add("editor-terbuka");   // kunci gulir halaman di belakang editor
    zoomManual = false;
    aturZoomPas();                                   // seluruh kertas langsung terlihat, tanpa menggulir
    renderKanvasCetakan();
}

// Tutup editor dan kembali ke formulir desain yang sama
function tutupEditorCetakan() {
    editorCetakanEl.hidden = true;
    document.body.classList.remove("editor-terbuka");
    bagianHalamanCetak().forEach(function (el) { el.hidden = false; });
    var desain = bacaCetakan().find(function (c) { return c.id === desainDiEditor.id; });
    if (desain) { modulCetakan.bukaUbah(desain); } else { modulCetakan.tampilkan("daftar"); }
    desainDiEditor = null;
}

document.getElementById("ec-tutup").addEventListener("click", function () {
    // Ada perubahan yang belum disimpan? Tanya dulu.
    if (keadaanEditor() !== keadaanAwalEditor) {
        tanyaKonfirmasi({
            pesan: "Perubahan belum disimpan. Tutup editor tanpa menyimpan?",
            nama: desainDiEditor.nama,
            labelYa: "Ya, Tutup"
        }, tutupEditorCetakan);
    } else {
        tutupEditorCetakan();
    }
});

// Kembalikan elemen ke desain bawaan sesuai tipe dan pengaturan kertas saat ini
document.getElementById("ec-bawaan").addEventListener("click", function () {
    tanyaKonfirmasi({
        pesan: "Semua elemen akan dikembalikan ke desain bawaan untuk tipe ini. Lanjutkan?",
        nama: desainDiEditor.nama,
        labelYa: "Ya, Kembalikan"
    }, function () {
        if (!pengaturanValid(pengaturanDariEditor())) {
            tampilkanNotifikasi("Perbaiki margin dulu.", "peringatan");
            return;
        }
        elemenKerja = elemenBawaan(desainDiEditor.tipe, pengaturanDariEditor());
        renderKanvasCetakan();
        catatRiwayat();   // "Kembalikan ke Desain Bawaan" juga bisa diurungkan
    });
});

document.getElementById("ec-simpan").addEventListener("click", function () {
    var baru = pengaturanDariEditor();
    if (!pengaturanValid(baru)) {
        tampilkanNotifikasi("Margin harus angka 0 sampai 50 mm.", "galat");
        return;
    }
    var daftar = bacaCetakan();
    var lama = daftar.find(function (c) { return c.id === desainDiEditor.id; });
    if (!lama) { return; }
    var lamaSalinan = Object.assign({}, lama);
    lama.kertas = baru.kertas;
    lama.orientasi = baru.orientasi;
    lama.margin = baru.margin;
    lama.elemen = JSON.parse(JSON.stringify(elemenKerja));
    if (modulCetakan.simpan(daftar)) {
        desainDiEditor = lama;
        keadaanAwalEditor = keadaanEditor();
        document.getElementById("ec-keterangan-isi").textContent = TEKS_ISI_ELEMEN;
        tampilkanNotifikasi("Desain cetakan telah berhasil disimpan");
        // Dicatat di Log Aktivitas dengan rincian pengaturan yang berubah
        function teksMargin(m) { return "Kiri " + m.kiri + ", Kanan " + m.kanan + ", Atas " + m.atas + ", Bawah " + m.bawah + " mm"; }
        catatLog({
            tindakan: "Ubah", tipe: "Desain Cetakan", referensi: lama.nama,
            rincian: buatRincian(
                { kertas: lamaSalinan.kertas, orientasi: lamaSalinan.orientasi, margin: teksMargin(lamaSalinan.margin || kertasAwalCetakan.margin) },
                { kertas: baru.kertas, orientasi: baru.orientasi, margin: teksMargin(baru.margin) },
                { kertas: "Kertas", orientasi: "Orientasi", margin: "Margin" },
                { orientasi: function (nilai) { return nilai === "landscape" ? "Landscape" : "Portrait"; } }
            )
        });
    }
});

// Tombol "Edit Desain" di formulir (muncul saat mengubah desain yang sudah ada)
document.getElementById("tombol-edit-cetakan").addEventListener("click", function () {
    var desain = bacaCetakan().find(function (c) { return c.id === modulCetakan.idDiubah; });
    if (desain) { bukaEditorCetakan(desain); }
});

// ---------- Editor Desain Cetakan: memilih, menggeser, mengubah ukuran, menghapus ----------
// Elemen dipilih dengan klik. Elemen terpilih diberi bingkai biru dengan 8 gagang di sudut dan sisinya.
// Satuan semua posisi dan ukuran adalah milimeter. Hasil geseran dibulatkan ke kelipatan 0,5 mm.
var elemenTerpilihId = null;
var seretan = null;   // keadaan saat sedang menggeser atau mengubah ukuran: { mode, arah, awalX, awalY, asli }
var KOTAK_PILIHAN = "kotak-pilihan";
var daftarGagang = ["nw", "n", "ne", "e", "se", "s", "sw", "w"];
var inputPosisiEl = {
    x: document.getElementById("ec-el-x"),
    y: document.getElementById("ec-el-y"),
    w: document.getElementById("ec-el-w"),
    h: document.getElementById("ec-el-h")
};
var namaJenisElemen = { teks: "Teks", kotak: "Kotak", garis: "Garis", logo: "Logo", tabel: "Tabel Rincian" };

function elemenTerpilih() {
    return elemenKerja.find(function (e) { return e.id === elemenTerpilihId; }) || null;
}

// Ukuran kertas saat ini dalam milimeter, sesuai kertas dan orientasi yang dipilih di panel
function ukuranHalamanMm() {
    var p = pengaturanDariEditor();
    var kertas = ukuranKertas[p.kertas] || ukuranKertas.A4;
    return p.orientasi === "landscape"
        ? { lebar: kertas.tinggi, tinggi: kertas.lebar }
        : { lebar: kertas.lebar, tinggi: kertas.tinggi };
}

// Berapa piksel layar untuk satu milimeter kertas (memperhitungkan zoom)
function pikselPerMm() {
    var kotak = halamanCetak.getBoundingClientRect();
    if (kotak.width > 0) { return kotak.width / ukuranHalamanMm().lebar; }
    return zoomEditor * 96 / 25.4;   // cadangan kalau ukuran layar belum bisa dibaca
}

function bulatkan(nilai) {
    return Math.round(nilai * 2) / 2;   // kelipatan 0,5 mm
}

function batasi(nilai, kecil, besar) {
    return Math.min(Math.max(nilai, kecil), Math.max(kecil, besar));
}

// Isi kolom posisi dan ukuran di panel dari elemen terpilih
function isiPanelElemen() {
    var e = elemenTerpilih();
    document.getElementById("ec-bagian-elemen").hidden = !e;
    if (!e) { return; }
    document.getElementById("ec-jenis-elemen").textContent = namaJenisElemen[e.jenis] || e.jenis;
    Object.keys(inputPosisiEl).forEach(function (k) { inputPosisiEl[k].value = e[k]; });
    // Kolom Isi Teks hanya untuk elemen teks
    document.getElementById("ec-bagian-isi").hidden = (e.jenis !== "teks");
    if (e.jenis === "teks") { document.getElementById("ec-el-isi").value = e.isi || ""; }
    isiPanelGaya(e);   // kolom gaya sesuai jenis elemen (teks, kotak, atau garis)
}

// Pasang bingkai pilihan dan gagang di atas elemen terpilih (dipanggil setiap kanvas digambar ulang)
function gambarPilihanCetakan() {
    var lama = halamanCetak.querySelector("." + KOTAK_PILIHAN);
    if (lama) { lama.remove(); }
    var e = elemenTerpilih();
    if (!e) {
        elemenTerpilihId = null;   // elemen yang dipilih sudah tidak ada (misalnya setelah "Kembalikan ke Desain Bawaan")
        isiPanelElemen();
        if (typeof perbaruiAlatEdit === "function") { perbaruiAlatEdit(); }
        return;
    }
    var kotak = document.createElement("div");
    kotak.className = KOTAK_PILIHAN;
    daftarGagang.forEach(function (arah) {
        var gagang = document.createElement("div");
        gagang.className = "gagang-elemen";
        gagang.dataset.arah = arah;
        kotak.appendChild(gagang);
    });
    halamanCetak.appendChild(kotak);
    letakkanPilihan(e);
    isiPanelElemen();
    if (typeof perbaruiAlatEdit === "function") { perbaruiAlatEdit(); }   // tombol Salin menyala saat ada yang terpilih
}

function letakkanPilihan(e) {
    var kotak = halamanCetak.querySelector("." + KOTAK_PILIHAN);
    if (!kotak) { return; }
    kotak.style.left = e.x + "mm";
    kotak.style.top = e.y + "mm";
    kotak.style.width = e.w + "mm";
    kotak.style.height = e.h + "mm";
}

// Memilih elemen (id) atau membatalkan pilihan (null)
function pilihElemenCetakan(id) {
    elemenTerpilihId = id;
    halamanCetak.querySelectorAll(".el-cetak").forEach(function (el) {
        el.classList.toggle("terpilih", el.dataset.id === id);
    });
    gambarPilihanCetakan();
}

// Simpan nilai baru ke elemen dan perbarui tampilannya langsung (tanpa menggambar ulang semuanya, supaya mulus)
function terapkanGeometri(e) {
    var el = halamanCetak.querySelector('.el-cetak[data-id="' + e.id + '"]');
    if (el) {
        el.style.left = e.x + "mm";
        el.style.top = e.y + "mm";
        el.style.width = e.w + "mm";
        el.style.height = e.h + "mm";
    }
    letakkanPilihan(e);
    isiPanelElemen();
}

// Ukuran terkecil sebuah elemen: garis boleh sangat tipis, yang lain minimal 2 mm
function ukuranMinimum(e, sumbu) {
    if (e.jenis === "garis") { return sumbu === "w" ? 2 : 0.2; }
    return 2;
}

// ----- Menggeser dan mengubah ukuran dengan mouse (atau jari) -----
halamanCetak.addEventListener("pointerdown", function (kejadian) {
    fokuskanKanvas();   // supaya tombol Delete dan panah berlaku untuk elemen, bukan untuk kolom panel

    var gagang = kejadian.target.closest ? kejadian.target.closest(".gagang-elemen") : null;
    var elemenDom = kejadian.target.closest ? kejadian.target.closest(".el-cetak") : null;
    var mode = null, arah = null, e = null;

    if (gagang && elemenTerpilih()) {
        mode = "ubah-ukuran";
        arah = gagang.dataset.arah;
        e = elemenTerpilih();
    } else if (elemenDom) {
        pilihElemenCetakan(elemenDom.dataset.id);
        mode = "geser";
        e = elemenTerpilih();
    } else {
        pilihElemenCetakan(null);   // klik di bagian kertas yang kosong
        return;
    }
    kejadian.preventDefault();   // mencegah teks ikut terpilih saat menggeser
    seretan = {
        mode: mode, arah: arah,
        awalX: kejadian.clientX, awalY: kejadian.clientY,
        asli: { x: e.x, y: e.y, w: e.w, h: e.h },
        pikselPerMm: pikselPerMm()
    };
});

document.addEventListener("pointermove", function (kejadian) {
    var e = elemenTerpilih();
    if (!seretan || !e) { return; }
    var dx = (kejadian.clientX - seretan.awalX) / seretan.pikselPerMm;
    var dy = (kejadian.clientY - seretan.awalY) / seretan.pikselPerMm;
    var a = seretan.asli;
    var halaman = ukuranHalamanMm();

    if (seretan.mode === "geser") {
        // Elemen tidak boleh keluar dari tepi kertas
        e.x = batasi(bulatkan(a.x + dx), 0, halaman.lebar - a.w);
        e.y = batasi(bulatkan(a.y + dy), 0, halaman.tinggi - a.h);
    } else {
        var kiri = a.x, atas = a.y, kanan = a.x + a.w, bawah = a.y + a.h;
        var arah = seretan.arah;
        if (arah.indexOf("w") !== -1) { kiri = batasi(bulatkan(a.x + dx), 0, kanan - ukuranMinimum(e, "w")); }
        if (arah.indexOf("e") !== -1) { kanan = batasi(bulatkan(kanan + dx), kiri + ukuranMinimum(e, "w"), halaman.lebar); }
        if (arah.indexOf("n") !== -1) { atas = batasi(bulatkan(a.y + dy), 0, bawah - ukuranMinimum(e, "h")); }
        if (arah.indexOf("s") !== -1) { bawah = batasi(bulatkan(bawah + dy), atas + ukuranMinimum(e, "h"), halaman.tinggi); }
        e.x = kiri; e.y = atas; e.w = Math.round((kanan - kiri) * 10) / 10; e.h = Math.round((bawah - atas) * 10) / 10;
    }
    terapkanGeometri(e);
});

// Selesai menggeser atau mengubah ukuran = satu langkah riwayat
document.addEventListener("pointerup", function () {
    if (seretan) {
        seretan = null;
        catatRiwayat();
    }
});

// Klik di area abu-abu di luar kertas membatalkan pilihan
document.getElementById("ec-kanvas").addEventListener("pointerdown", function (kejadian) {
    if (!halamanCetak.contains(kejadian.target)) { fokuskanKanvas(); pilihElemenCetakan(null); }
});

// ----- Posisi dan ukuran lewat kolom angka di panel (untuk ketepatan) -----
Object.keys(inputPosisiEl).forEach(function (kunci) {
    inputPosisiEl[kunci].addEventListener("input", function () {
        var e = elemenTerpilih();
        var nilai = Number(inputPosisiEl[kunci].value);
        if (!e || !Number.isFinite(nilai) || inputPosisiEl[kunci].value === "") { return; }
        var halaman = ukuranHalamanMm();
        if (kunci === "x") { e.x = batasi(nilai, 0, halaman.lebar - e.w); }
        if (kunci === "y") { e.y = batasi(nilai, 0, halaman.tinggi - e.h); }
        if (kunci === "w") { e.w = batasi(nilai, ukuranMinimum(e, "w"), halaman.lebar - e.x); }
        if (kunci === "h") { e.h = batasi(nilai, ukuranMinimum(e, "h"), halaman.tinggi - e.y); }
        jadwalkanRiwayat();
        // Kolom yang sedang diketik tidak ditimpa ulang (supaya tidak melompat); yang lain disegarkan
        var el = halamanCetak.querySelector('.el-cetak[data-id="' + e.id + '"]');
        if (el) { el.style.left = e.x + "mm"; el.style.top = e.y + "mm"; el.style.width = e.w + "mm"; el.style.height = e.h + "mm"; }
        letakkanPilihan(e);
    });
});

// ----- Menghapus elemen -----
function hapusElemenTerpilih() {
    var e = elemenTerpilih();
    if (!e) { return; }
    elemenKerja = elemenKerja.filter(function (x) { return x.id !== e.id; });
    elemenTerpilihId = null;
    renderKanvasCetakan();
    catatRiwayat();   // penghapusan sekarang bisa diurungkan (Ctrl+Z)
}
document.getElementById("ec-hapus-elemen").addEventListener("click", hapusElemenTerpilih);

// ----- Keyboard: panah menggeser (Shift = 5 mm), Delete menghapus, Esc membatalkan pilihan -----
document.addEventListener("keydown", function (kejadian) {
    if (editorCetakanEl.hidden) { return; }
    // Jangan mengganggu pengetikan di kolom isian
    var sasaran = kejadian.target && kejadian.target.tagName;
    if (sasaran === "INPUT" || sasaran === "SELECT" || sasaran === "TEXTAREA") { return; }
    // Pintasan dengan Ctrl (atau Cmd di Mac): urungkan, ulangi, salin, tempel, duplikat.
    // Di kolom isian dilewati lebih dulu (di atas), jadi Ctrl+Z di dalam kolom tetap mengurungkan ketikan.
    if (kejadian.ctrlKey || kejadian.metaKey) {
        var huruf = String(kejadian.key).toLowerCase();
        if (huruf === "z" && !kejadian.shiftKey) { kejadian.preventDefault(); urungkanEditor(); return; }
        if (huruf === "y" || (huruf === "z" && kejadian.shiftKey)) { kejadian.preventDefault(); ulangiEditor(); return; }
        if (huruf === "c") { kejadian.preventDefault(); salinElemen(); return; }
        if (huruf === "v") { kejadian.preventDefault(); tempelElemen(); return; }
        if (huruf === "d") { kejadian.preventDefault(); duplikatElemen(); return; }
        return;
    }
    var e = elemenTerpilih();
    if (!e) { return; }
    var langkah = kejadian.shiftKey ? 5 : 0.5;
    var halaman = ukuranHalamanMm();
    var geser = { ArrowLeft: [-langkah, 0], ArrowRight: [langkah, 0], ArrowUp: [0, -langkah], ArrowDown: [0, langkah] }[kejadian.key];
    if (geser) {
        kejadian.preventDefault();
        e.x = batasi(Math.round((e.x + geser[0]) * 10) / 10, 0, halaman.lebar - e.w);
        e.y = batasi(Math.round((e.y + geser[1]) * 10) / 10, 0, halaman.tinggi - e.h);
        terapkanGeometri(e);
        jadwalkanRiwayat();   // beberapa tekanan panah beruntun menjadi satu langkah
    } else if (kejadian.key === "Delete" || kejadian.key === "Backspace") {
        kejadian.preventDefault();
        hapusElemenTerpilih();
    } else if (kejadian.key === "Escape") {
        pilihElemenCetakan(null);
    }
});

// ---------- Editor Desain Cetakan: menambah elemen dan mengubah isi teks ----------
var jumlahDitambah = 0;   // dipakai untuk menggeser sedikit tiap elemen baru supaya tidak bertumpuk persis

// Menambah satu elemen baru di dekat pojok kiri atas area isi, lalu langsung memilihnya.
// jenis: "teks", "garis", "kotak", atau "logo"
function tambahElemenCetakan(jenis) {
    var p = pengaturanDariEditor();
    var halaman = ukuranHalamanMm();
    // Kalau margin di panel sedang tidak valid (misalnya kosong), pakai margin awal
    var kiri = Number.isFinite(p.margin.kiri) ? p.margin.kiri : kertasAwalCetakan.margin.kiri;
    var atas = Number.isFinite(p.margin.atas) ? p.margin.atas : kertasAwalCetakan.margin.atas;
    var geseran = (jumlahDitambah % 8) * 4;   // 0, 4, 8, ... 28 mm, lalu mulai dari awal lagi
    jumlahDitambah++;

    var baru = {
        id: idElemenBaru(), jenis: jenis,
        x: kiri + 10 + geseran, y: atas + 10 + geseran,
        w: 60, h: 8, isi: "", gaya: {}
    };
    if (jenis === "teks") {
        baru.isi = "Teks baru";
        baru.gaya = { ukuran: 11, tebal: false, miring: false, rata: "kiri", warna: "#111111" };
    } else if (jenis === "garis") {
        baru.w = 80; baru.h = 0.5;
        baru.gaya = { tebalGaris: 0.5, warnaGaris: "#111111" };
    } else if (jenis === "kotak") {
        baru.w = 60; baru.h = 30;
        baru.gaya = { tebalGaris: 0.3, warnaGaris: "#333333", warnaLatar: "" };
    } else if (jenis === "logo") {
        baru.w = 22; baru.h = 22;
    } else if (jenis === "tabel") {
        baru.w = 150; baru.h = 20;
        baru.gaya = { ukuran: 8.5, warna: "#111111" };
    }
    // Pastikan elemen baru berada seluruhnya di dalam kertas
    baru.w = Math.min(baru.w, halaman.lebar);
    baru.h = Math.min(baru.h, halaman.tinggi);
    baru.x = batasi(baru.x, 0, halaman.lebar - baru.w);
    baru.y = batasi(baru.y, 0, halaman.tinggi - baru.h);

    elemenKerja.push(baru);          // elemen terakhir digambar paling atas
    elemenTerpilihId = baru.id;      // langsung terpilih, siap digeser atau diubah
    renderKanvasCetakan();
    catatRiwayat();
    // Fokus dibiarkan di kanvas (bukan di kolom isi teks), supaya tombol Delete dan panah langsung
    // berlaku untuk elemen baru ini. Untuk mengetik isinya, klik kolom Isi Teks di panel.
    fokuskanKanvas();
}

document.querySelectorAll("[data-tambah]").forEach(function (tombol) {
    tombol.addEventListener("click", function () { tambahElemenCetakan(tombol.dataset.tambah); });
});

// Mengubah isi teks elemen terpilih lewat kolom di panel. Tampilan di kertas ikut berubah langsung.
document.getElementById("ec-el-isi").addEventListener("input", function (kejadian) {
    var e = elemenTerpilih();
    if (!e || e.jenis !== "teks") { return; }
    e.isi = kejadian.target.value;
    var el = halamanCetak.querySelector('.el-cetak[data-id="' + e.id + '"]');
    if (el) { el.textContent = gantiPenanda(e.isi, dataContohCetakan()); }   // textContent: aman dari kode HTML
    jadwalkanRiwayat();
});

// ---------- Editor Desain Cetakan: gaya elemen dan penyisip penanda ----------
// Penanda isian yang tersedia. Daftar ini dipakai penyisip di panel (dan nanti untuk contoh yang bisa diunduh).
// Penanda khas tiap transaksi ditambahkan di sini setelah formulir transaksinya ada.
var penandaCetakan = [
    { kunci: "nama_yayasan", label: "Nama Yayasan" },
    { kunci: "alamat", label: "Alamat Yayasan" },
    { kunci: "telepon", label: "Telepon Yayasan" },
    { kunci: "email", label: "Email Yayasan" },
    { kunci: "ketua", label: "Nama Ketua" },
    { kunci: "bendahara", label: "Nama Bendahara" },
    { kunci: "judul", label: "Judul Dokumen" },
    { kunci: "nomor", label: "Nomor" },
    { kunci: "tanggal", label: "Tanggal" },
    { kunci: "donatur", label: "Donatur" },
    { kunci: "program", label: "Program" },
    { kunci: "keterangan", label: "Keterangan" },
    { kunci: "jumlah", label: "Jumlah (Rp)" },
    { kunci: "terbilang", label: "Terbilang" },
    { kunci: "dibuat_oleh", label: "Dibuat oleh" },
    { kunci: "kas", label: "Kas/Bank" },
    { kunci: "pihak", label: "Dibayar Kepada / Diterima Dari" },
    { kunci: "no_cek", label: "No Cek" },
    { kunci: "cara_bayar", label: "Cara Bayar" },
    { kunci: "id_donatur", label: "ID Donatur" },
    { kunci: "dari_kas", label: "Dari Kas/Bank" },
    { kunci: "ke_kas", label: "Ke Kas/Bank" },
    { kunci: "no_jurnal", label: "Nomor Jurnal" },
    { kunci: "dicetak", label: "Waktu Cetak" }
];

var pilihPenanda = document.getElementById("ec-penanda");
penandaCetakan.forEach(function (p) {
    var opsiPenanda = document.createElement("option");
    opsiPenanda.value = p.kunci;
    opsiPenanda.textContent = p.label;
    opsiPenanda.title = "{{" + p.kunci + "}}";   // bentuk penanda terlihat saat kursor diarahkan, tanpa memanjangkan pilihan
    pilihPenanda.appendChild(opsiPenanda);
});

var kotakGaya = {
    ukuran: document.getElementById("ec-gaya-ukuran"),
    warna: document.getElementById("ec-gaya-warna"),
    tebal: document.getElementById("ec-gaya-tebal"),
    miring: document.getElementById("ec-gaya-miring"),
    kotakTebal: document.getElementById("ec-kotak-tebal"),
    kotakWarna: document.getElementById("ec-kotak-warna"),
    kotakLatar: document.getElementById("ec-kotak-latar"),
    kotakTanpaLatar: document.getElementById("ec-kotak-tanpa-latar"),
    garisWarna: document.getElementById("ec-garis-warna")
};
var tombolRata = document.querySelectorAll("[data-rata]");

// Menggambar ulang SATU elemen di kanvas (setelah gayanya berubah), tanpa menggambar ulang seluruh kertas.
// Letaknya di susunan tumpukan tetap sama, dan tanda "terpilih" ikut terbawa.
function segarkanElemenDom(e) {
    var lama = halamanCetak.querySelector('.el-cetak[data-id="' + e.id + '"]');
    if (lama) { lama.replaceWith(buatElemenDom(e, dataContohCetakan())); }
}

// Mengisi kolom-kolom gaya di panel dari elemen terpilih, dan menampilkan hanya kelompok yang sesuai jenisnya
function isiPanelGaya(e) {
    var g = e.gaya || {};
    // Tabel Rincian memakai kolom Huruf yang sama: ukuran dan warna tulisan
    document.getElementById("ec-gaya-teks").hidden = (e.jenis !== "teks" && e.jenis !== "tabel");
    document.getElementById("ec-gaya-kotak").hidden = (e.jenis !== "kotak");
    document.getElementById("ec-gaya-garis").hidden = (e.jenis !== "garis");

    if (e.jenis === "teks" || e.jenis === "tabel") {
        kotakGaya.ukuran.value = g.ukuran || 11;
        kotakGaya.warna.value = g.warna || "#111111";
        kotakGaya.tebal.setAttribute("aria-pressed", g.tebal ? "true" : "false");
        kotakGaya.miring.setAttribute("aria-pressed", g.miring ? "true" : "false");
        tombolRata.forEach(function (t) {
            t.setAttribute("aria-pressed", (g.rata || "kiri") === t.dataset.rata ? "true" : "false");
        });
    } else if (e.jenis === "kotak") {
        kotakGaya.kotakTebal.value = (typeof g.tebalGaris === "number") ? g.tebalGaris : 0.3;
        kotakGaya.kotakWarna.value = g.warnaGaris || "#333333";
        kotakGaya.kotakLatar.value = g.warnaLatar || "#e8ecf2";   // nilai awal pemilih warna kalau latar dinyalakan
        kotakGaya.kotakTanpaLatar.checked = !g.warnaLatar;
    } else if (e.jenis === "garis") {
        kotakGaya.garisWarna.value = g.warnaGaris || "#111111";
    }
}

// Mengubah gaya elemen terpilih lewat fungsi "ubah", lalu menggambar ulang elemen itu
function ubahGayaElemen(ubah) {
    var e = elemenTerpilih();
    if (!e) { return; }
    e.gaya = e.gaya || {};
    ubah(e.gaya, e);
    segarkanElemenDom(e);
    jadwalkanRiwayat();
}

// ----- Huruf -----
kotakGaya.ukuran.addEventListener("input", function () {
    var nilai = Number(kotakGaya.ukuran.value);
    if (kotakGaya.ukuran.value === "" || !Number.isFinite(nilai) || nilai < 4 || nilai > 96) { return; }
    ubahGayaElemen(function (g) { g.ukuran = nilai; });
});
kotakGaya.warna.addEventListener("input", function () {
    ubahGayaElemen(function (g) { g.warna = kotakGaya.warna.value; });
});
[["tebal", kotakGaya.tebal], ["miring", kotakGaya.miring]].forEach(function (pasangan) {
    pasangan[1].addEventListener("click", function () {
        var menyala = pasangan[1].getAttribute("aria-pressed") !== "true";   // kebalikan dari keadaan sekarang
        pasangan[1].setAttribute("aria-pressed", menyala ? "true" : "false");
        ubahGayaElemen(function (g) { g[pasangan[0]] = menyala; });
    });
});
tombolRata.forEach(function (tombol) {
    tombol.addEventListener("click", function () {
        tombolRata.forEach(function (t) { t.setAttribute("aria-pressed", t === tombol ? "true" : "false"); });
        ubahGayaElemen(function (g) { g.rata = tombol.dataset.rata; });
    });
});

// ----- Kotak -----
kotakGaya.kotakTebal.addEventListener("input", function () {
    var nilai = Number(kotakGaya.kotakTebal.value);
    if (kotakGaya.kotakTebal.value === "" || !Number.isFinite(nilai) || nilai < 0 || nilai > 5) { return; }
    ubahGayaElemen(function (g) { g.tebalGaris = nilai; });
});
kotakGaya.kotakWarna.addEventListener("input", function () {
    ubahGayaElemen(function (g) { g.warnaGaris = kotakGaya.kotakWarna.value; });
});
// Memilih warna latar otomatis menyalakan latar (mencabut centang "Tanpa warna latar")
kotakGaya.kotakLatar.addEventListener("input", function () {
    kotakGaya.kotakTanpaLatar.checked = false;
    ubahGayaElemen(function (g) { g.warnaLatar = kotakGaya.kotakLatar.value; });
});
kotakGaya.kotakTanpaLatar.addEventListener("change", function () {
    ubahGayaElemen(function (g) {
        g.warnaLatar = kotakGaya.kotakTanpaLatar.checked ? "" : kotakGaya.kotakLatar.value;
    });
});

// ----- Garis -----
kotakGaya.garisWarna.addEventListener("input", function () {
    ubahGayaElemen(function (g) { g.warnaGaris = kotakGaya.garisWarna.value; });
});

// ----- Penyisip penanda: memasukkan {{penanda}} di tempat kursor pada kolom Isi Teks -----
document.getElementById("ec-sisip").addEventListener("click", function () {
    var e = elemenTerpilih();
    if (!e || e.jenis !== "teks") { return; }
    var kolom = document.getElementById("ec-el-isi");
    var teksSisip = "{{" + pilihPenanda.value + "}}";
    var mulai = kolom.selectionStart, akhir = kolom.selectionEnd;
    if (typeof mulai !== "number") { mulai = akhir = kolom.value.length; }   // cadangan: taruh di akhir
    kolom.value = kolom.value.slice(0, mulai) + teksSisip + kolom.value.slice(akhir);
    kolom.selectionStart = kolom.selectionEnd = mulai + teksSisip.length;     // kursor sesudah penanda
    kolom.dispatchEvent(new Event("input", { bubbles: true }));               // memakai pembaruan yang sama dengan mengetik
    kolom.focus();
});

// ---------- Editor Desain Cetakan: urungkan, ulangi, salin, tempel, duplikat ----------
// Riwayat berupa daftar "potret" (salinan seluruh daftar elemen dalam bentuk teks JSON).
// Setiap tindakan yang selesai (selesai menggeser, menambah, menghapus, menempel) mencatat satu potret.
// Perubahan yang beruntun cepat (mengetik, menggeser dengan panah, memutar angka) digabung jadi satu
// potret kalau jeda 0,4 detik, supaya satu kali "urungkan" tidak hanya membatalkan satu huruf.
var BATAS_RIWAYAT = 100;
var riwayatEditor = [];
var indeksRiwayat = -1;
var penundaRiwayat = null;
var papanKlipElemen = null;   // elemen yang disalin (teks JSON), kosong kalau belum ada
var jumlahTempel = 0;         // berapa kali elemen yang sama ditempel, untuk menggeser tiap tempelan

var tombolEdit = {
    urungkan: document.querySelector('[data-edit="urungkan"]'),
    ulangi: document.querySelector('[data-edit="ulangi"]'),
    salin: document.querySelector('[data-edit="salin"]'),
    tempel: document.querySelector('[data-edit="tempel"]')
};

// Menyalakan atau menonaktifkan tombol sesuai keadaan: tidak ada yang bisa diurungkan, dan seterusnya
function perbaruiAlatEdit() {
    tombolEdit.urungkan.disabled = !(indeksRiwayat > 0 || penundaRiwayat !== null);
    tombolEdit.ulangi.disabled = !(indeksRiwayat < riwayatEditor.length - 1);
    tombolEdit.salin.disabled = !elemenTerpilih();
    tombolEdit.tempel.disabled = (papanKlipElemen === null);
}

// Dipanggil saat editor dibuka: riwayat dimulai dari keadaan sekarang
function mulaiRiwayat() {
    clearTimeout(penundaRiwayat);
    penundaRiwayat = null;
    riwayatEditor = [JSON.stringify(elemenKerja)];
    indeksRiwayat = 0;
    jumlahTempel = 0;
    perbaruiAlatEdit();
}

// Mencatat keadaan sekarang sebagai potret baru, kalau berbeda dari potret terakhir.
// Kalau pengguna sudah pernah mengurungkan, potret "masa depan" dibuang (seperti editor pada umumnya).
function catatRiwayat() {
    clearTimeout(penundaRiwayat);
    penundaRiwayat = null;
    var potret = JSON.stringify(elemenKerja);
    if (potret === riwayatEditor[indeksRiwayat]) { perbaruiAlatEdit(); return; }
    riwayatEditor.length = indeksRiwayat + 1;
    riwayatEditor.push(potret);
    if (riwayatEditor.length > BATAS_RIWAYAT) { riwayatEditor.shift(); }
    indeksRiwayat = riwayatEditor.length - 1;
    perbaruiAlatEdit();
}

// Untuk perubahan beruntun cepat: dicatat setelah 0,4 detik tanpa perubahan lagi
function jadwalkanRiwayat() {
    clearTimeout(penundaRiwayat);
    penundaRiwayat = setTimeout(catatRiwayat, 400);
    perbaruiAlatEdit();
}

function pulihkanPotret(indeks) {
    elemenKerja = JSON.parse(riwayatEditor[indeks]);
    indeksRiwayat = indeks;
    renderKanvasCetakan();   // pilihan dipertahankan kalau elemennya masih ada, dilepas kalau tidak
    perbaruiAlatEdit();
}

function urungkanEditor() {
    catatRiwayat();   // perubahan yang masih menunggu dicatat dulu, supaya ikut bisa diurungkan
    if (indeksRiwayat > 0) { pulihkanPotret(indeksRiwayat - 1); }
}

function ulangiEditor() {
    catatRiwayat();
    if (indeksRiwayat < riwayatEditor.length - 1) { pulihkanPotret(indeksRiwayat + 1); }
}

// ----- Salin, tempel, duplikat -----
function salinElemen() {
    var e = elemenTerpilih();
    if (!e) { return; }
    papanKlipElemen = JSON.stringify(e);
    jumlahTempel = 0;
    perbaruiAlatEdit();
}

// Menempel salinan di posisi bergeser 5 mm ke kanan-bawah (bertambah untuk tiap tempelan berikutnya),
// tetap di dalam kertas, lalu langsung terpilih
function tempelElemen() {
    if (papanKlipElemen === null) { return; }
    var baru = JSON.parse(papanKlipElemen);
    var halaman = ukuranHalamanMm();
    jumlahTempel++;
    baru.id = idElemenBaru();
    baru.x = batasi(Math.round((baru.x + 5 * jumlahTempel) * 10) / 10, 0, halaman.lebar - baru.w);
    baru.y = batasi(Math.round((baru.y + 5 * jumlahTempel) * 10) / 10, 0, halaman.tinggi - baru.h);
    elemenKerja.push(baru);
    elemenTerpilihId = baru.id;
    renderKanvasCetakan();
    catatRiwayat();
}

function duplikatElemen() {
    if (!elemenTerpilih()) { return; }
    salinElemen();
    tempelElemen();
}

var aksiEdit = { urungkan: urungkanEditor, ulangi: ulangiEditor, salin: salinElemen, tempel: tempelElemen };
Object.keys(tombolEdit).forEach(function (kunci) {
    tombolEdit[kunci].addEventListener("click", aksiEdit[kunci]);
});

// ----- Fokus keyboard -----
// Setelah mengklik kertas, kursor ketik harus meninggalkan kolom panel (X, Y, isi teks, dan lain-lain).
// Kalau tidak, tombol Delete dan panah dianggap untuk kolom itu, bukan untuk elemen yang terpilih.
function fokuskanKanvas() {
    var aktif = document.activeElement;
    if (aktif && /^(INPUT|SELECT|TEXTAREA)$/.test(aktif.tagName)) { aktif.blur(); }
    var kanvas = document.getElementById("ec-kanvas");
    kanvas.setAttribute("tabindex", "-1");   // supaya kanvas bisa menerima fokus
    kanvas.focus({ preventScroll: true });
}

