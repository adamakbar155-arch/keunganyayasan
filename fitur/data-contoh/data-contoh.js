// ==================== Isi Data Contoh dan Hapus Data Contoh (PRD 6.13, tugas J.27) ====================
// Mengisi aplikasi yang masih KOSONG dengan data rekaan 3 bulan terakhir, supaya Dashboard, laporan, dan cetak bisa dilihat dan
// sistemnya sekaligus teruji. Semua nama, nomor, dan angka di sini REKAAN, bukan data asli yayasan.
//
// Prinsip:
//   - Transaksi dibuat lewat alat milik fiturnya sendiri: nomor dari aturan penomoran (nomorBerikutnya), jurnal dari penyusun jurnal
//     formulirnya (isiJurnalData Pembayaran/Penerimaan, isiJurnalDonasi, isiJurnalTransfer, isiJurnalPemindahan, isiJurnalPenyusutan),
//     dan disimpan lewat modul masing-masing. Jadi laporan yang tampil menguji aturan yang sama dengan pemakaian sehari-hari.
//   - Semua-atau-tidak-sama-sekali: keadaan awal dicatat dulu; kalau ada yang gagal, semuanya dikembalikan.
//   - Keadaan awal disimpan di kunci "dataContoh", supaya Hapus Data Contoh bisa mengembalikan aplikasi persis seperti sebelum diisi
//     (akun pengguna dan Log Aktivitas tidak ikut dikembalikan).
// Tombolnya ada di Pengaturan, Cadangan Data (fitur/cadangan/tampilan.js).

var KUNCI_DATA_CONTOH = "dataContoh";
jenisKunciCadangan[KUNCI_DATA_CONTOH] = "objek";   // ikut Cadangan Data, supaya Hapus Data Contoh tetap bisa sesudah dipulihkan
// Kunci yang TIDAK dikembalikan oleh Hapus Data Contoh
var KUNCI_TETAP_DATA_CONTOH = ["daftarPengguna", "logAktivitas", KUNCI_DATA_CONTOH];

// ----- Kosong atau belum -----
// "Kosong" = belum ada transaksi dan master data yang dibuat pengguna. Bagan akun awal, donatur bawaan Hamba Allah, desain cetakan
// bawaan, dan Preferensi tidak dihitung, karena memang selalu ada sejak awal.
var KUNCI_HARUS_KOSONG = ["daftarJurnal", "daftarDonasi", "daftarPembayaran", "daftarPenerimaan", "daftarTransfer", "daftarPemindahanDana",
    "daftarPencatatanGaji", "daftarAnggaran", "daftarTransferAnggaran", "daftarAsetTetap", "daftarKategoriAset", "daftarPenyusutan",
    "daftarLepasAset", "daftarTargetDonasi", "daftarKategoriDonasi", "daftarDivisi", "daftarProgram", "daftarKaryawan"];
function alasanTidakKosong() {
    var terisi = KUNCI_HARUS_KOSONG.filter(function (k) { return bacaDaftarTersimpan(k).length > 0; });
    if (bacaDonatur().some(function (d) { return d && !d.bawaan; })) { terisi.push("daftarDonatur"); }
    return terisi.length ? "Aplikasi sudah berisi data (" + terisi.length + " jenis data), jadi data contoh tidak diisi supaya tidak tercampur dengan data asli." : "";
}
function dataContohTerisi() { return !!bacaPengaturan(KUNCI_DATA_CONTOH, {}).diisiPada; }

// Keadaan semua kunci data aplikasi saat ini (teks mentah; null = belum ada)
function potretDataAplikasi() {
    var hasil = {};
    Object.keys(jenisKunciCadangan).forEach(function (k) { if (KUNCI_TETAP_DATA_CONTOH.indexOf(k) === -1) { hasil[k] = localStorage.getItem(k); } });
    return hasil;
}
function kembalikanPotret(potret) {
    Object.keys(potret).forEach(function (k) {
        try { if (potret[k] === null) { localStorage.removeItem(k); } else { localStorage.setItem(k, potret[k]); } } catch (galat) { /* usaha terbaik */ }
    });
}

// ----- Alat tanggal -----
// Bulan ke-0 = dua bulan lalu, ke-2 = bulan ini. Tanggal yang belum tiba (sesudah hari ini) dilewati.
function bulanContoh(ke) {
    var hari = tanggalHariIni(), t = Number(hari.slice(0, 4)), b = Number(hari.slice(5, 7)) - 2 + ke;
    while (b < 1) { b += 12; t -= 1; }
    return t + "-" + String(b).padStart(2, "0");
}
function tanggalContoh(ke, hari) {
    var bulan = bulanContoh(ke);
    var akhir = new Date(Number(bulan.slice(0, 4)), Number(bulan.slice(5, 7)), 0).getDate();
    return bulan + "-" + String(Math.min(hari, akhir)).padStart(2, "0");
}
function sudahTiba(tanggal) { return tanggal <= tanggalHariIni(); }

// ----- Lampiran rekaan -----
// Foto nota: digambar di kanvas (tanpa gambar dari luar). Kalau kanvas tidak tersedia, foto dilewati.
function fotoNotaContoh(judul, nilai, warna) {
    try {
        var k = document.createElement("canvas");
        k.width = 480; k.height = 640;
        var c = k.getContext("2d");
        if (!c) { return ""; }
        c.fillStyle = "#f4f1ea"; c.fillRect(0, 0, 480, 640);
        c.fillStyle = "#ffffff"; c.fillRect(30, 30, 420, 580);
        c.fillStyle = warna || "#1f6feb"; c.fillRect(30, 30, 420, 70);
        c.fillStyle = "#ffffff"; c.font = "bold 26px sans-serif"; c.fillText("NOTA (CONTOH)", 60, 76);
        c.fillStyle = "#222222"; c.font = "20px sans-serif";
        c.fillText(String(judul).slice(0, 30), 60, 150);
        for (var i = 0; i < 6; i++) { c.fillStyle = "#d0d4da"; c.fillRect(60, 200 + i * 45, 360, 3); }
        c.fillStyle = "#111111"; c.font = "bold 24px sans-serif"; c.fillText("Rp " + formatAngka(nilai), 60, 520);
        c.font = "14px sans-serif"; c.fillStyle = "#666666"; c.fillText("Data rekaan untuk percobaan aplikasi", 60, 580);
        return k.toDataURL("image/jpeg", 0.7);
    } catch (galat) { return ""; }
}
// Faktur PDF kecil memakai pembuat PDF aplikasi sendiri (umum/buat-pdf.js). Promise -> data URL, atau "" kalau gagal.
function fakturPdfContoh(judul, nilai) {
    try {
        var pdf = buatPdf();
        pdf.halamanBaru(148, 105);
        pdf.kotak(10, 10, 128, 12, { latar: "#0b2a5b" });
        pdf.teks("FAKTUR (CONTOH)", 14, 18, { ukuran: 11, tebal: true, warna: "#ffffff" });
        pdf.teks(judul, 14, 34, { ukuran: 10 });
        pdf.teks("Jumlah: Rp " + formatAngka(nilai), 14, 46, { ukuran: 12, tebal: true });
        pdf.teks("Data rekaan untuk percobaan aplikasi", 14, 92, { ukuran: 8, warna: "#666666" });
        return bacaSebagaiDataUrl(pdf.blob()).catch(function () { return ""; });
    } catch (galat) { return Promise.resolve(""); }
}

// ----- Penyusun data contoh -----
// Mengembalikan Promise. Kalau gagal: ditolak (reject) dengan pesan; data sudah dikembalikan seperti semula oleh pemanggil.
function susunDataContoh() {
    var cat = {};            // id penting yang dipakai lagi (akun, divisi, program, ...)
    var semuaIsiLampiran = bacaIsiLampiran();
    var waktuAsli = waktuSekarang;   // dibuatPada mengikuti tanggal transaksi, bukan jam sekarang
    var jam = 8;
    function pakaiWaktu(tanggal) {
        jam = jam >= 16 ? 8 : jam + 1;
        var teks = tanggal + "T" + String(jam).padStart(2, "0") + ":15:00";
        waktuSekarang = function () { return teks; };
        return teks;
    }
    function wajib(benar, pesan) { if (!benar) { throw new Error(pesan); } }
    function simpan(modul, daftar, nama) { wajib(modul.simpan(daftar), "Gagal menyimpan " + nama + "."); }
    function akunKode(kode) { return bacaDaftarAkun().find(function (a) { return a.kode === kode; }); }

    // 1) Data yayasan dan akun ----------------------------------------------------------------------------------------
    var awal = tanggalContoh(0, 1);
    var yayasan = bacaPengaturan(KUNCI_YAYASAN, {});
    if (!yayasan.nama) { yayasan.nama = "Yayasan Contoh Peduli"; }
    if (!yayasan.alamat) { yayasan.alamat = "Jl. Contoh No. 1, Kota Contoh"; }
    if (!yayasan.tglMulai || yayasan.tglMulai > awal) { yayasan.tglMulai = awal; }
    localStorage.setItem(KUNCI_YAYASAN, JSON.stringify(yayasan));

    ["110101", "110102", "130104", "140103", "310101", "310102", "410101", "510101", "510102", "510103", "510104", "510105", "610101", "710101"].forEach(function (kode) {
        wajib(akunKode(kode), "Bagan akun awal tidak lengkap (akun " + kode + " tidak ada). Pasang Bagan Akun Awal dulu di Akun Perkiraan.");
    });
    var akun = modulAkun.ambil();
    function akunBaru(kode, nama, indukKode, saldo) {
        var induk = akun.find(function (a) { return a.kode === indukKode; });
        var a = { id: buatId("a"), kode: kode, nama: nama, tipe: induk.tipe, indukId: induk.id, catatan: "Data contoh.", nonAktif: false,
                  namaBank: "", noRekening: "", atasNamaRekening: "", saldoAwal: saldo, tanggalSaldo: awal };
        akun.push(a);
        return a;
    }
    // Kas & Bank tingkat 3 (yang bisa dipilih di transaksi), dengan saldo awal; Aset Neto Tidak Terikat menyeimbangkannya
    cat.kasKecil = akunBaru("11010101", "Kas Kecil Kantor", "110101", 5000000);
    cat.bankOps = akunBaru("11010201", "Bank Contoh - Operasional", "110102", 60000000);
    cat.bankProg = akunBaru("11010202", "Bank Contoh - Program", "110102", 20000000);
    akun.forEach(function (a) { if (a.kode === "310101") { a.saldoAwal = 85000000; a.tanggalSaldo = awal; } });
    simpan(modulAkun, akun, "akun");

    // Preferensi akun: Aset Neto untuk Pemindahan Dana (diisi hanya kalau masih kosong)
    var pref = bacaAkunPerkiraan();
    if (!pref.asetNetoTerikat.length) { pref.asetNetoTerikat = ["310102"]; }
    if (!pref.asetNetoTidakTerikat.length) { pref.asetNetoTidakTerikat = ["310101"]; }

    // 2) Master data -------------------------------------------------------------------------------------------------
    var divisi = ["Pendidikan", "Kesehatan", "Dakwah", "Umum dan Kantor"].map(function (nama) { return { id: buatId("d"), nama: nama, keterangan: "Data contoh." }; });
    simpan(modulDivisi, divisi, "Divisi");
    cat.divPend = divisi[0].id; cat.divKes = divisi[1].id; cat.divDak = divisi[2].id; cat.divUmum = divisi[3].id;
    var program = [
        { id: buatId("p"), nama: "Beasiswa Yatim", divisiId: cat.divPend, status: "aktif", keterangan: "Data contoh." },
        { id: buatId("p"), nama: "Renovasi Ruang Belajar", divisiId: cat.divPend, status: "aktif", keterangan: "Data contoh." },
        { id: buatId("p"), nama: "Posyandu Balita", divisiId: cat.divKes, status: "aktif", keterangan: "Data contoh." },
        { id: buatId("p"), nama: "Kajian Rutin", divisiId: cat.divDak, status: "aktif", keterangan: "Data contoh." }
    ];
    simpan(modulProgram, program, "Program");
    cat.prBea = program[0].id; cat.prRen = program[1].id; cat.prPos = program[2].id; cat.prKaj = program[3].id;

    var karyawan = [["Ahmad Contoh", "Kepala Kantor"], ["Siti Contoh", "Bendahara"], ["Budi Contoh", "Staf Program"], ["Rina Contoh", "Staf Administrasi"]]
        .map(function (k, i) {
            return { id: buatId("k"), nama: k[0], jabatan: k[1], nomor: "PG-" + String(i + 1).padStart(3, "0"), ktp: "", email: "", hp: "", wa: "",
                     tglMulai: "", tglMasuk: awal, catatan: "Data contoh.", jalan: "", kota: "", kodePos: "", provinsi: "", bank: "", noRek: "", atasNama: "" };
        });
    simpan(modulKaryawan, karyawan, "Karyawan");

    var donatur = bacaDonatur();
    ["Bapak Contoh Satu", "Ibu Contoh Dua", "CV Contoh Makmur", "Keluarga Contoh Tiga", "Ibu Contoh Empat", "PT Contoh Sejahtera"].forEach(function (nama, i) {
        donatur.push({ id: buatId("dn"), idDonatur: "D." + String(donatur.length + 1).padStart(5, "0"), nama: nama,
                       kategori: i === 2 || i === 5 ? "Perusahaan" : "Perorangan", telepon: "", hp: "", wa: "", email: "", jalan: "", kota: "Kota Contoh",
                       catatan: "Data contoh.", nonAktif: false });
    });
    simpan(modulDonatur, donatur, "Donatur");
    cat.donatur = donatur.map(function (d) { return d.id; });

    // Kategori Donasi: tiap kategori membuat akun pendapatan sendiri di bawah 410101 Donasi (aturan sama dengan halaman Kategori Donasi)
    var induk = akunKode("410101");
    var kategori = [];
    [["Infaq Umum", "Infaq", false], ["Zakat Mal", "Zakat", true], ["Donasi Beasiswa", "Program", true], ["Donasi Posyandu", "Program", true],
     ["Wakaf Renovasi", "Program", true], ["Donasi Kajian", "Program", true]].forEach(function (k) {
        var daftarAkun = modulAkun.ambil();
        var idKategori = buatId("kd");
        var kode = buatKodeAkun("pendapatan", induk.id, null);
        wajib(kode, "Kode akun Kategori Donasi tidak bisa dibuat.");
        var a = { id: buatId("a"), kode: kode, nama: k[0], tipe: "pendapatan", indukId: induk.id, catatan: "Dibuat otomatis oleh Kategori Donasi.",
                  nonAktif: false, namaBank: "", noRekening: "", atasNamaRekening: "", saldoAwal: 0, tanggalSaldo: awal, kategoriDonasiId: idKategori };
        daftarAkun.push(a);
        simpan(modulAkun, daftarAkun, "akun Kategori Donasi");
        kategori.push({ id: idKategori, nama: k[0], indukId: induk.id, akunId: a.id, kode: kode, kelompok: k[1], catatan: "Data contoh." });
        (k[2] ? pref.donasiTerikat : pref.donasiTidakTerikat).push(kode);
    });
    simpan(modulKategoriDonasi, kategori, "Kategori Donasi");
    localStorage.setItem(KUNCI_AKUN_PERKIRAAN, JSON.stringify(pref));
    cat.kd = {};
    kategori.forEach(function (k) { cat.kd[k.nama] = k; });

    // Aturan penomoran: satu per tipe (dipakai kalau belum ada aturan untuk tipe itu)
    var aturan = modulPenomoran.ambil();
    cat.aturan = {};
    [["donasi", "DN-"], ["pembayaran", "BKK-"], ["penerimaan", "BKM-"], ["transfer", "TF-"], ["jurnal", "JU-"], ["gaji", "GJ-"], ["pemindahan", "PD-"]].forEach(function (t) {
        var ada = aturan.find(function (a) { return a.tipe === t[0] && !a.kasId; });
        if (!ada) {
            ada = { id: buatId("n"), nama: "Contoh " + t[1].replace("-", ""), pembukuan: "yayasan", tipe: t[0], kasId: "", digit: 4,
                    komponen: [{ jenis: "teks", nilai: t[1] }, { jenis: "tahun-singkat" }, { jenis: "bulan" }, { jenis: "teks", nilai: "-" }, { jenis: "counter" }] };
            aturan.push(ada);
        }
        cat.aturan[t[0]] = ada.id;
    });
    simpan(modulPenomoran, aturan, "Penomoran");
    function nomor(tipe, tanggal) { var n = nomorBerikutnya(cat.aturan[tipe], tanggal); wajib(n, "Nomor " + tipe + " tidak bisa dibuat."); return n; }

    // Aset tetap: kategori Peralatan Kantor
    var katAset = { id: buatId("kas"), nama: "Peralatan Kantor", tidakDisusutkan: false, akunAsetId: akunKode("130104").id,
                    akunAkumulasiId: akunKode("140103").id, akunBebanId: akunKode("510105").id, umurTahun: 4 };
    simpan(modulKategoriAset, [katAset], "Kategori Aset");

    // 3) Transaksi -------------------------------------------------------------------------------------------------------
    // Semua transaksi dikumpulkan dulu lalu disimpan urut tanggal, supaya Nomor JV per bulan urut seperti pencatatan biasa.
    var rencana = [];
    function rencanakan(tanggal, buat) { if (sudahTiba(tanggal)) { rencana.push({ tanggal: tanggal, buat: buat }); } }
    function baris(kode, nilai, divisiId, programId, terikat, catatan, ekstra) {
        var a = typeof kode === "string" ? akunKode(kode) : kode;
        return Object.assign({ id: buatId("rb"), akunId: a.id, kode: a.kode, nama: a.nama, nilai: nilai, divisiId: divisiId, programId: programId || "",
                               terikat: terikat === true, catatan: catatan || "" }, ekstra || {});
    }
    function simpanDenganJurnal(modul, kunci, data, sumber, isi) {
        var daftar = modul.ambil();
        daftar.push(data);
        simpan(modul, daftar, kunci);
        simpan(modulJurnal, daftarJurnalDenganOtomatis({ jenis: sumber, id: data.id }, isi), "jurnal");
    }
    var lampiranTertunda = [];   // [{ trx, berkas: [{ nama, isi|janji }] }] dipasang di akhir (PDF dibuat tidak langsung)
    function infoLampiran(daftarBerkas) {
        var info = daftarBerkas.map(function (b) { return { id: buatId("f"), nama: b.nama, tipe: b.tipe, ukuran: 0, janji: b.janji, isi: b.isi }; });
        return info;
    }
    function pasangInfoLampiran(data, berkas) {
        var info = infoLampiran(berkas);
        data.lampiranInfo = info.map(function (f) { return { id: f.id, nama: f.nama, tipe: f.tipe, ukuran: 0 }; });
        data.jumlahLampiran = info.length;
        data.ringkasanLampiran = info.map(function (f) { return f.nama; }).join(", ");
        lampiranTertunda.push({ data: data, info: info });
    }
    function foto(nama, judul, nilai, warna) { var isi = fotoNotaContoh(judul, nilai, warna); return isi ? { nama: nama, tipe: "image/jpeg", isi: isi } : null; }
    function pdfFaktur(nama, judul, nilai) { return { nama: nama, tipe: "application/pdf", janji: fakturPdfContoh(judul, nilai) }; }

    // Pembayaran / Penerimaan (komponen bersama transaksi Kas/Bank)
    function pembayaran(tanggal, kas, penerima, catatan, rincian, berkas) {
        rencanakan(tanggal, function () {
            var data = { id: buatId("by"), nomor: nomor("pembayaran", tanggal), aturanId: cat.aturan.pembayaran, tanggal: tanggal, kasId: kas.id,
                         kas: kas.kode + " - " + kas.nama, noCek: "", catatan: catatan, penerima: penerima,
                         rincian: rincian(), dibuatOleh: penggunaAktif, dibuatPada: pakaiWaktu(tanggal) };
            data.nama = data.nomor;
            data.jumlahBaris = data.rincian.length;
            data.total = data.rincian.reduce(function (n, b) { return n + b.nilai; }, 0);
            data.ringkasanRincian = data.rincian.map(function (b) { return b.kode + " " + b.nama + " " + formatAngka(b.nilai); }).join("; ");
            var b = (berkas || []).filter(Boolean);
            if (b.length) { pasangInfoLampiran(data, b); } else { data.lampiranInfo = []; data.jumlahLampiran = 0; data.ringkasanLampiran = ""; }
            simpanDenganJurnal(modulBayar, "Pembayaran", data, "pembayaran", trxBayar.isiJurnalData(data));
            return data;
        });
    }
    function penerimaan(tanggal, kas, pemberi, catatan, rincian) {
        rencanakan(tanggal, function () {
            var data = { id: buatId("tr"), nomor: nomor("penerimaan", tanggal), aturanId: cat.aturan.penerimaan, tanggal: tanggal, kasId: kas.id,
                         kas: kas.kode + " - " + kas.nama, noCek: "", catatan: catatan, pemberi: pemberi, rincian: rincian(),
                         lampiranInfo: [], jumlahLampiran: 0, ringkasanLampiran: "", dibuatOleh: penggunaAktif, dibuatPada: pakaiWaktu(tanggal) };
            data.nama = data.nomor;
            data.jumlahBaris = data.rincian.length;
            data.total = data.rincian.reduce(function (n, b) { return n + b.nilai; }, 0);
            data.ringkasanRincian = data.rincian.map(function (b) { return b.kode + " " + b.nama + " " + formatAngka(b.nilai); }).join("; ");
            simpanDenganJurnal(trxTerima.modul, "Penerimaan", data, "penerimaan", trxTerima.isiJurnalData(data));
        });
    }
    // Pencatatan Donasi
    function donasi(tanggal, donaturKe, kas, caraBayar, keterangan, baris2) {
        rencanakan(tanggal, function () {
            var rincian = baris2.map(function (r) {
                var k = cat.kd[r[0]];
                return { id: buatId("rd"), kategoriId: k.id, akunId: k.akunId, kode: k.kode, nama: k.nama, nilai: r[1], divisiId: r[2], programId: r[3] || "", keterangan: "" };
            });
            var data = { id: buatId("dc"), nomor: nomor("donasi", tanggal), aturanId: cat.aturan.donasi, tanggal: tanggal,
                         donaturId: cat.donatur[donaturKe % cat.donatur.length], kasId: kas.id, kas: kas.kode + " - " + kas.nama, caraBayar: caraBayar,
                         keterangan: keterangan, rincian: rincian, jumlahBaris: rincian.length, total: rincian.reduce(function (n, b) { return n + b.nilai; }, 0),
                         lampiranInfo: [], jumlahLampiran: 0, ringkasanLampiran: "", dibuatOleh: penggunaAktif, dibuatPada: pakaiWaktu(tanggal) };
            data.nama = data.nomor;
            data.ringkasanRincian = ringkasanRincianDc(rincian);
            simpanDenganJurnal(modulDonasiCatat, "Pencatatan Donasi", data, SUMBER_JURNAL_DONASI, isiJurnalDonasi(data, kas));
        });
    }
    // Transfer Bank
    function transfer(tanggal, dari, ke, nilai, catatan) {
        rencanakan(tanggal, function () {
            var data = { id: buatId("tf"), nomor: nomor("transfer", tanggal), aturanId: cat.aturan.transfer, tanggal: tanggal,
                         dariId: dari.id, dari: dari.kode + " - " + dari.nama, keId: ke.id, ke: ke.kode + " - " + ke.nama, nilai: nilai, catatan: catatan,
                         lampiranInfo: [], jumlahLampiran: 0, ringkasanLampiran: "", dibuatOleh: penggunaAktif, dibuatPada: pakaiWaktu(tanggal) };
            data.nama = data.nomor;
            simpanDenganJurnal(modulTransfer, "Transfer Bank", data, SUMBER_JURNAL_TRANSFER, isiJurnalTransfer(data, dari, ke));
        });
    }
    // Jurnal Umum (diketik sendiri, tanpa sumber)
    function jurnalUmum(tanggal, keterangan, rincian, berkas) {
        rencanakan(tanggal, function () {
            var r = rincian().map(function (x) { return Object.assign({ id: buatId("r"), penanggung: "", programId: "", terikat: false, keterangan: "" }, x); });
            var data = { id: buatId("j"), nomor: nomor("jurnal", tanggal), aturanId: cat.aturan.jurnal, tanggal: tanggal, keterangan: keterangan,
                         rincian: r, jumlahBaris: r.length, totalDebit: r.reduce(function (n, x) { return n + (x.debit || 0); }, 0),
                         ringkasanRincian: ringkasanRincianJurnal(r), dibuatOleh: penggunaAktif, dibuatPada: pakaiWaktu(tanggal) };
            data.nama = data.nomor;
            var b = (berkas || []).filter(Boolean);
            if (b.length) { pasangInfoLampiran(data, b); } else { data.lampiranInfo = []; data.jumlahLampiran = 0; data.ringkasanLampiran = ""; }
            var daftar = modulJurnal.ambil();
            daftar.push(data);
            simpan(modulJurnal, daftar, "Jurnal Umum");
        });
    }
    function sisiJurnal(kode, debit, kredit, divisiId, keterangan) {
        var a = typeof kode === "string" ? akunKode(kode) : kode;
        return { akunId: a.id, kode: a.kode, nama: a.nama, debit: debit, kredit: kredit, divisiId: divisiId || "", keterangan: keterangan || "" };
    }

    // ---- Susunan 3 bulan ----
    var warna = ["#1f6feb", "#16a34a", "#d97706"];
    for (var ke = 0; ke < 3; ke++) {
        var bln = namaBulanKalender[Number(bulanContoh(ke).slice(5, 7)) - 1];
        // Donasi
        donasi(tanggalContoh(ke, 2), 0, cat.bankOps, "Transfer", "Infaq bulanan " + bln, [["Infaq Umum", 5000000, cat.divUmum]]);
        donasi(tanggalContoh(ke, 4), 1, cat.bankProg, "Transfer", "", [["Donasi Beasiswa", 6000000, cat.divPend, cat.prBea]]);
        donasi(tanggalContoh(ke, 6), 2, cat.bankProg, "Transfer", "Donasi perusahaan", [["Wakaf Renovasi", 8000000, cat.divPend, cat.prRen], ["Donasi Beasiswa", 2000000, cat.divPend, cat.prBea]]);
        donasi(tanggalContoh(ke, 8), 3, cat.kasKecil, "Tunai", "", [["Donasi Kajian", 1500000, cat.divDak, cat.prKaj]]);
        donasi(tanggalContoh(ke, 10), 4, cat.bankProg, "QRIS", "", [["Donasi Posyandu", 2500000, cat.divKes, cat.prPos]]);
        donasi(tanggalContoh(ke, 12), 5, cat.bankOps, "Transfer", "Zakat perusahaan", [["Zakat Mal", 4000000, cat.divUmum]]);
        donasi(tanggalContoh(ke, 15), ke + 1, cat.kasKecil, "Tunai", "Kotak infaq kajian", [["Infaq Umum", 750000, cat.divDak]]);
        donasi(tanggalContoh(ke, 18), ke + 2, cat.bankOps, "Transfer", "", [["Infaq Umum", 3500000, cat.divUmum]]);

        // Pembayaran operasional dan program (sebagian berlampiran, sebagian sengaja belum ada bukti)
        pembayaran(tanggalContoh(ke, 5), cat.bankOps, "PLN (contoh)", "Listrik kantor " + bln,
            function () { return [baris("510102", 850000, cat.divUmum, "", false, "Listrik " + bln)]; },
            [foto("nota-listrik-" + (ke + 1) + ".jpg", "Listrik kantor", 850000, warna[ke])]);
        pembayaran(tanggalContoh(ke, 9), cat.kasKecil, "Toko Contoh ATK", "Alat tulis kantor",
            function () { return [baris("510104", 425000, cat.divUmum, "", false, "ATK")]; },
            ke === 1 ? [] : [foto("nota-atk-" + (ke + 1) + ".jpg", "Alat tulis kantor", 425000, warna[ke])]);
        pembayaran(tanggalContoh(ke, 11), cat.bankProg, "Penerima beasiswa (contoh)", "Beasiswa yatim " + bln,
            function () { return [baris("510103", 5000000, cat.divPend, cat.prBea, true, "Beasiswa 10 anak")]; },
            [pdfFaktur("tanda-terima-beasiswa-" + (ke + 1) + ".pdf", "Tanda terima beasiswa " + bln, 5000000)]);
        pembayaran(tanggalContoh(ke, 13), cat.bankProg, "Apotek Contoh", "Obat dan vitamin posyandu",
            function () { return [baris("510103", 1800000, cat.divKes, cat.prPos, true, "Obat posyandu")]; },
            ke === 0 ? [foto("nota-obat-1.jpg", "Obat posyandu", 1800000, warna[ke])] : []);
        pembayaran(tanggalContoh(ke, 16), cat.kasKecil, "Katering Contoh", "Konsumsi kajian rutin",
            function () { return [baris("510103", 1200000, cat.divDak, cat.prKaj, true, "Konsumsi kajian"), baris("510102", 150000, cat.divDak, "", false, "Air minum")]; },
            [foto("nota-konsumsi-" + (ke + 1) + ".jpg", "Konsumsi kajian", 1350000, warna[ke])]);
        if (ke >= 1) {
            pembayaran(tanggalContoh(ke, 20), cat.bankProg, "Toko Bangunan Contoh", "Material renovasi ruang belajar",
                function () { return [baris("510103", 7000000, cat.divPend, cat.prRen, true, "Semen, cat, keramik")]; },
                [foto("nota-material-" + ke + ".jpg", "Material renovasi", 7000000, warna[ke]), pdfFaktur("faktur-material-" + ke + ".pdf", "Material renovasi", 7000000)]);
        }
        // Penerimaan dan Transfer
        penerimaan(tanggalContoh(ke, 28), cat.bankOps, "Bank Contoh", "Bunga bank " + bln,
            function () { return [baris("710101", 125000, cat.divUmum, "", false, "Bunga " + bln)]; });
        transfer(tanggalContoh(ke, 3), cat.bankOps, cat.kasKecil, 3000000, "Isi ulang kas kecil " + bln);
        // Jurnal Umum: biaya administrasi bank (dari rekening koran)
        jurnalUmum(tanggalContoh(ke, 27), "Biaya administrasi bank " + bln,
            function () { return [sisiJurnal("610101", 15000, 0, cat.divUmum, "Admin bank"), sisiJurnal(cat.bankOps, 0, 15000, "", "Admin bank")]; },
            ke === 2 ? [foto("rekening-koran-" + (ke + 1) + ".jpg", "Admin bank", 15000, warna[ke])] : []);
    }

    // Pembelian aset (laptop) lewat Pembayaran, lalu dicatat di Aset Tetap (cek kecocokan harus Cocok)
    var tglLaptop = tanggalContoh(0, 7);
    pembayaran(tglLaptop, cat.bankOps, "Toko Komputer Contoh", "Pembelian laptop kantor",
        function () { return [baris("130104", 9600000, cat.divUmum, "", false, "Laptop 1 unit")]; },
        [foto("nota-laptop.jpg", "Laptop kantor", 9600000, "#7c3aed")]);

    // Pemindahan Dana: sisa Program Kajian Rutin ke Dana Umum, dan Dana Umum ke Divisi Kesehatan
    function pemindahan(tanggal, jenis, nilai, alasan, kasAsal, kasTujuan, dariProgramId, keDivisiId) {
        rencanakan(tanggal, function () {
            var data = { id: buatId("pd"), nomor: nomor("pemindahan", tanggal), aturanId: cat.aturan.pemindahan, tanggal: tanggal, jenis: jenis,
                         dariProgramId: dariProgramId || "", keDivisiId: keDivisiId || "", kasAsalId: kasAsal.id, kasAsal: kasAsal.kode + " - " + kasAsal.nama,
                         kasTujuanId: kasTujuan.id, kasTujuan: kasTujuan.kode + " - " + kasTujuan.nama, nilai: nilai, total: nilai, alasan: alasan,
                         lampiranInfo: [], jumlahLampiran: 0, ringkasanLampiran: "", dibuatOleh: penggunaAktif, dibuatPada: pakaiWaktu(tanggal) };
            data.nama = data.nomor;
            var akunPd = { terikat: akunAsetNeto("terikat"), tidakTerikat: akunAsetNeto("tidak-terikat"), kasAsal: kasAsal, kasTujuan: kasTujuan };
            wajib(akunPd.terikat && akunPd.tidakTerikat, "Akun Aset Neto di Preferensi belum lengkap.");
            simpanDenganJurnal(modulPemindahanDana, "Pemindahan Dana", data, SUMBER_JURNAL_PEMINDAHAN, isiJurnalPemindahan(data, akunPd));
        });
    }
    pemindahan(tanggalContoh(1, 25), "ke-umum", 500000, "Sisa dana kajian bulan lalu", cat.kasKecil, cat.kasKecil, cat.prKaj, "");
    pemindahan(tanggalContoh(2, 5), "ke-divisi", 1000000, "Tambahan dana operasional Kesehatan", cat.bankOps, cat.bankOps, "", cat.divKes);

    // Gaji: Pencatatan Gaji tanggal 25 lalu dibayar lewat Pembayaran tanggal 26 (bulan yang belum sampai tanggal 25 dilewati)
    var komponenKaryawan = [[4000000, 1000000, 500000, 300000], [3500000, 750000, 500000, 300000], [3000000, 0, 500000, 300000], [2800000, 0, 500000, 300000]];
    function gaji(ke) {
        var tanggal = tanggalContoh(ke, 25);
        rencanakan(tanggal, function () {
            var bulan = Number(bulanContoh(ke).slice(5, 7)), tahun = Number(bulanContoh(ke).slice(0, 4));
            var rincian = karyawan.map(function (k, i) {
                var n = komponenKaryawan[i];
                return { id: buatId("bg"), karyawanId: k.id, nama: k.nama, jabatan: k.jabatan, gajiPokok: n[0], tunjJabatan: n[1], tunjMakan: n[2],
                         tunjTransport: n[3], pengurangan: 0, iuran: 100000, catatan: "" };
            });
            var hitung = rincian.map(hitungBarisGaji);
            var data = { id: buatId("pg"), nomor: nomor("gaji", tanggal), aturanId: cat.aturan.gaji, tipe: "bulanan", bulan: bulan, tahun: tahun,
                         periode: namaBulan[bulan - 1] + " " + tahun, tanggal: tanggal, jatuhTempo: tanggalContoh(ke, 28), akunBebanId: akunKode("510101").id,
                         catatan: "Gaji " + namaBulan[bulan - 1] + " (data contoh)", rincian: rincian, jumlahKaryawan: rincian.length,
                         totalBruto: hitung.reduce(function (s, h) { return s + h.bruto; }, 0), totalPotongan: hitung.reduce(function (s, h) { return s + h.potongan; }, 0),
                         totalDibayarkan: hitung.reduce(function (s, h) { return s + h.dibayarkan; }, 0), ringkasanRincian: ringkasanRincianGaji(rincian),
                         lampiranInfo: [], jumlahLampiran: 0, ringkasanLampiran: "", dibuatOleh: penggunaAktif, dibuatPada: pakaiWaktu(tanggal) };
            data.nama = data.nomor;
            var daftar = modulPgaji.ambil();
            daftar.push(data);
            simpan(modulPgaji, daftar, "Pencatatan Gaji");
            cat["gaji" + ke] = data;
        });
        pembayaran(tanggalContoh(ke, 26), cat.bankOps, "Karyawan (gaji)", "Gaji " + namaBulanKalender[Number(bulanContoh(ke).slice(5, 7)) - 1],
            function () {
                var g = cat["gaji" + ke];
                return [baris("510101", g.totalDibayarkan, cat.divUmum, "", false, "Gaji " + g.periode + " (" + g.nomor + ")", { gajiId: g.id })];
            });
    }
    for (var kg = 0; kg < 3; kg++) { gaji(kg); }

    // Simpan semua transaksi urut tanggal (urutan masuk dipertahankan untuk tanggal yang sama)
    rencana.map(function (r, i) { r.i = i; return r; }).sort(function (a, b) { return a.tanggal.localeCompare(b.tanggal) || a.i - b.i; })
        .forEach(function (r) { r.buat(); });

    // 4) Aset Tetap, Proses Penyusutan, Anggaran, Target Donasi ---------------------------------------------------------
    simpan(modulAsetTetap, [{ id: buatId("at"), kode: kodeAsetBerikut([]), nama: "Laptop Kantor (contoh)", tanggalBeli: tglLaptop, tanggalPakai: tglLaptop,
        kategoriId: katAset.id, nilai: 9600000, umurBulan: 48, nilaiSisa: 0, tidakDisusutkan: false, sudahDisusutkan: 0, lokasi: "Kantor", catatan: "Data contoh." }], "Aset Tetap");
    // Penyusutan untuk bulan yang sudah lewat seluruhnya (bulan ini belum selesai, jadi tidak diproses)
    [bulanContoh(0), bulanContoh(1)].forEach(function (bulan) {
        var rincian = barisPenyusutanBulan(bulan);
        if (!rincian.length) { return; }
        var tanggal = akhirBulanAset(bulan);
        var p = { id: buatId("pny"), nomor: "PNY." + bulan.replace("-", "."), bulan: bulan, tanggal: tanggal, rincian: rincian,
                  total: rincian.reduce(function (n, b) { return n + b.nilai; }, 0), dibuatOleh: penggunaAktif, dibuatPada: pakaiWaktu(tanggal) };
        p.nama = p.nomor;
        simpanDenganJurnal(modulPenyusutan, "Proses Penyusutan", p, SUMBER_JURNAL_PENYUSUTAN, isiJurnalPenyusutan(p));
    });

    var anggaran = [];
    for (var ka = 0; ka < 3; ka++) {
        var b = Number(bulanContoh(ka).slice(5, 7)), t = Number(bulanContoh(ka).slice(0, 4));
        var rinci = [["510101", 13500000], ["510102", 1100000], ["510103", 9000000], ["510104", 500000], [cat.kd["Infaq Umum"].kode, 9000000]].map(function (x) {
            var a = akunKode(x[0]);
            return { id: buatId("ra"), akunId: a.id, kode: a.kode, nama: a.nama, nilai: x[1] };
        });
        anggaran.push({ id: buatId("ang"), nama: namaBulanKalender[b - 1] + " " + t, bulan: b, tahun: t, tipe: "umum", kelompokId: "", catatan: "Anggaran contoh",
                        penganalisa: "", rincian: rinci, ringkasanRincian: rinci.map(function (x) { return x.kode + " " + x.nama + " " + formatAngka(x.nilai); }).join("; "),
                        total: rinci.reduce(function (n, x) { return n + x.nilai; }, 0) });
    }
    simpan(modulAnggaran, anggaran, "Anggaran");
    simpan(modulTargetDonasi, [
        { id: buatId("td"), nama: "Target Beasiswa (contoh)", programId: cat.prBea, mulai: tanggalContoh(0, 1), selesai: tanggalContoh(2, 28), nilai: 30000000, catatan: "Data contoh." },
        { id: buatId("td"), nama: "Target Renovasi (contoh)", programId: cat.prRen, mulai: tanggalContoh(0, 1), selesai: tanggalContoh(2, 28), nilai: 50000000, catatan: "Data contoh." }
    ], "Target Donasi");

    waktuSekarang = waktuAsli;

    // 5) Isi file lampiran (PDF dibuat tidak langsung, jadi ditunggu dulu) ------------------------------------------------
    var janji = [];
    lampiranTertunda.forEach(function (l) {
        l.info.forEach(function (f) { if (f.janji) { janji.push(f.janji.then(function (isi) { f.isi = isi; })); } });
    });
    return Promise.all(janji).then(function () {
        lampiranTertunda.forEach(function (l) {
            var berhasil = l.info.filter(function (f) { return dataUrlLampiranAman(f.isi); });
            semuaIsiLampiran[l.data.id] = {};
            berhasil.forEach(function (f) { semuaIsiLampiran[l.data.id][f.id] = f.isi; });
        });
        // Ukuran lampiran ikut ditulis di keterangannya (untuk tampilan "15 KB"). File yang gagal dibuat (isi kosong) dibuang
        // dari keterangannya, supaya tidak tampil sebagai lampiran rusak.
        var ukuran = {};
        lampiranTertunda.forEach(function (l) {
            l.info.forEach(function (f) { if (dataUrlLampiranAman(f.isi)) { ukuran[f.id] = Math.round(f.isi.length * 0.75); } });
        });
        [modulBayar, modulJurnal].forEach(function (modul) {
            var daftar = modul.ambil();
            daftar.forEach(function (d) {
                if (!Array.isArray(d.lampiranInfo) || !d.lampiranInfo.length) { return; }
                d.lampiranInfo = d.lampiranInfo.filter(function (f) { return ukuran[f.id]; });
                d.lampiranInfo.forEach(function (f) { f.ukuran = ukuran[f.id]; });
                d.jumlahLampiran = d.lampiranInfo.length;
                d.ringkasanLampiran = d.lampiranInfo.map(function (f) { return f.nama; }).join(", ");
            });
            simpan(modul, daftar, "keterangan lampiran");
        });
        tulisIsiLampiran(semuaIsiLampiran);
        periksaHasilDataContoh();
    }, function (galat) { throw galat; });
}

// Pemeriksaan sesudah diisi: setiap jurnal seimbang, dan saldo Kas/Bank tidak pernah minus pada akhir hari mana pun
function periksaHasilDataContoh() {
    var jurnal = bacaJurnalMentah();
    var timpang = jurnal.find(function (j) {
        var d = 0, k = 0;
        rincianAman(j).forEach(function (r) { d += Number(r.debit) || 0; k += Number(r.kredit) || 0; });
        return Math.round(d) !== Math.round(k);
    });
    if (timpang) { throw new Error("Jurnal " + teksAman(timpang.nomor) + " tidak seimbang."); }
    bacaDaftarAkun().filter(function (a) { return a.tipe === "kas-bank"; }).forEach(function (a) {
        var perHari = Object.create(null);
        jurnal.forEach(function (j) {
            rincianAman(j).forEach(function (r) {
                if (r.akunId === a.id) { perHari[j.tanggal] = (perHari[j.tanggal] || 0) + (Number(r.debit) || 0) - (Number(r.kredit) || 0); }
            });
        });
        var saldo = Number(a.saldoAwal) || 0;
        Object.keys(perHari).sort().forEach(function (t) {
            saldo += perHari[t];
            if (saldo < 0) { throw new Error("Saldo " + a.kode + " " + a.nama + " minus pada " + t + "."); }
        });
    });
}

// ----- Dipanggil tombol -----
// Isi: Promise -> { ok, pesan }
function isiDataContoh() {
    var alasan = alasanTidakKosong();
    if (alasan) { return Promise.resolve({ ok: false, pesan: alasan }); }
    var potret = potretDataAplikasi();
    var waktuAsli = waktuSekarang;
    var hasil;
    try { hasil = susunDataContoh(); } catch (galat) { hasil = Promise.reject(galat); }
    return hasil.then(function () {
        localStorage.setItem(KUNCI_DATA_CONTOH, JSON.stringify({ diisiPada: waktuAsli(), sebelum: potret }));
        catatLog({ tindakan: "Isi", tipe: "Data Contoh", referensi: "Data rekaan 3 bulan terakhir" });
        return { ok: true, pesan: "Data contoh telah diisi. Lihat Dashboard dan menu Laporan." };
    }).catch(function (galat) {
        waktuSekarang = waktuAsli;
        kembalikanPotret(potret);
        return { ok: false, pesan: "Data contoh gagal diisi, semua dikembalikan seperti semula. " + (galat && galat.message ? galat.message : "") };
    });
}

// Hapus: kembali persis ke keadaan sebelum data contoh diisi (termasuk data yang ditambahkan sesudahnya). -> { ok, pesan }
function hapusDataContoh() {
    var catatan = bacaPengaturan(KUNCI_DATA_CONTOH, {});
    if (!catatan.diisiPada || !catatan.sebelum || typeof catatan.sebelum !== "object") {
        return { ok: false, pesan: "Data contoh belum pernah diisi di aplikasi ini." };
    }
    var cadangan = potretDataAplikasi();
    try {
        Object.keys(jenisKunciCadangan).forEach(function (k) {
            if (KUNCI_TETAP_DATA_CONTOH.indexOf(k) !== -1) { return; }
            var lama = Object.prototype.hasOwnProperty.call(catatan.sebelum, k) ? catatan.sebelum[k] : null;
            if (lama === null || typeof lama !== "string") { localStorage.removeItem(k); } else { localStorage.setItem(k, lama); }
        });
        localStorage.removeItem(KUNCI_DATA_CONTOH);
    } catch (galat) {
        kembalikanPotret(cadangan);
        return { ok: false, pesan: "Penyimpanan browser penuh atau diblokir. Data tidak diubah." };
    }
    catatLog({ tindakan: "Hapus", tipe: "Data Contoh", referensi: "Aplikasi dikembalikan seperti sebelum data contoh diisi" });
    return { ok: true, pesan: "Data contoh telah dihapus. Aplikasi kembali kosong." };
}

// ----- Tombol di Cadangan Data -----
var tombolIsiContoh = document.getElementById("tombol-isi-contoh");
var tombolHapusContoh = document.getElementById("tombol-hapus-contoh");
function perbaruiTombolDataContoh() {
    var terisi = dataContohTerisi();
    tombolHapusContoh.hidden = !terisi;
    tombolIsiContoh.hidden = terisi;
    document.getElementById("status-data-contoh").textContent = terisi
        ? "Data contoh sedang terpasang. Hapus Data Contoh mengembalikan aplikasi kosong seperti sebelumnya."
        : "Belum ada data contoh.";
}
// Sesudah diisi atau dihapus, halaman dimuat ulang supaya semua halaman membaca data terbaru (seperti Pulihkan)
function selesaiDataContoh(hasil) {
    if (!hasil.ok) { tampilkanNotifikasi(hasil.pesan, "peringatan"); return; }
    try { sessionStorage.setItem("pesanPemulihan", hasil.pesan); } catch (galat) { /* pesan tidak tampil, tidak fatal */ }
    muatUlangHalaman();   // fitur/cadangan/cadangan.js
}
tombolIsiContoh.addEventListener("click", function () {
    var alasan = alasanTidakKosong();
    if (alasan) { tampilkanNotifikasi(alasan, "peringatan"); return; }
    tanyaKonfirmasi({ judul: "Isi Data Contoh", pesan: "Aplikasi akan diisi data REKAAN 3 bulan terakhir untuk mencoba laporan. Lanjutkan?", labelYa: "Ya, Isi" }, function () {
        tombolIsiContoh.disabled = true;
        isiDataContoh().then(function (hasil) { tombolIsiContoh.disabled = false; selesaiDataContoh(hasil); });
    });
});
tombolHapusContoh.addEventListener("click", function () {
    tanyaKonfirmasi({ judul: "Hapus Data Contoh", pesan: "SEMUA data akan dikembalikan seperti sebelum data contoh diisi, termasuk data yang Anda tambahkan sesudahnya. Akun pengguna tetap. Lanjutkan?", labelYa: "Ya, Hapus" }, function () {
        selesaiDataContoh(hapusDataContoh());
    });
});
perbaruiTombolDataContoh();
var saatTabCadanganAsli = saatTabDibuka.cadangan;
saatTabDibuka.cadangan = function () { if (saatTabCadanganAsli) { saatTabCadanganAsli(); } perbaruiTombolDataContoh(); };
