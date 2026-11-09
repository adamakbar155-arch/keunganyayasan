// ==================== Transfer Bank (Kas & Bank) ====================
// Memindah uang antar Kas/Bank milik yayasan sendiri (PRD 6.3, dari foto Accurate). Jurnal otomatis: Debit Kas/Bank
// tujuan, Kredit Kas/Bank asal, tanpa Divisi/Program (PRD 4.2). Transfer HANYA memindah uang: sisa dana Divisi/Program
// tidak berubah (peruntukan dana dipindah lewat Pemindahan Dana). Biaya admin bank dicatat lewat Pembayaran biasa.
// Bentuknya berbeda dari Pembayaran/Penerimaan (tanpa rincian akun), jadi tidak memakai komponen transaksi Kas/Bank,
// tetapi tetap memakai alat bersama: buatModulDaftar, buatNomorOtomatis, galatTanggalTransaksi, nomorTransaksiTerpakai,
// simpanTransaksiDenganJurnal, akunKasBankPilihan (umum/), dan daftarJurnalTanpaOtomatis (fitur/jurnal/jurnal.js).
// HTML-nya: fitur/transfer/tampilan.js. Gaya: fitur/transfer/transfer.css. Dimuat sesudah fitur/jurnal/jurnal.js.
// Semua nama (var dan function) di sini tetap bisa dipakai skrip lain, karena skrip biasa berbagi satu ruang nama.

// Satu transfer: { id, nomor, nama(=nomor), aturanId, tanggal, dariId, dari ("kode - nama"), keId, ke, nilai, catatan,
//   lampiranInfo, jumlahLampiran, ringkasanLampiran (umum/lampiran.js), dibuatOleh, dibuatPada, diubahPada }
var SUMBER_JURNAL_TRANSFER = "transfer";   // sumber.jenis jurnal milik Transfer (didaftarkan di bawah lewat daftarkanAsalJurnal)
var kolomTanggalTransfer = document.getElementById("transfer-tanggal");
var pilihDariTransfer = document.getElementById("transfer-dari");
var pilihKeTransfer = document.getElementById("transfer-ke");
var kolomNilaiTransfer = document.getElementById("transfer-nilai");
// Lampiran file (PRD 5.4): alat bersama umum/lampiran.js; wajib atau tidak menurut Preferensi, Lampiran (Transfer Kas/Bank)
var tombolLampiranTransfer = document.getElementById("transfer-tombol-lampiran");
var lampiranTransfer = buatLampiranTransaksi({ jenis: "transfer", namaFitur: "Transfer Bank", tombol: tombolLampiranTransfer,
                                               lencana: document.getElementById("transfer-lencana-lampiran") });

// Keterangan di daftar dan jurnal: catatan, atau "Transfer dari ... ke ..."
function keteranganTransfer(t) {
    return t.catatan || ("Transfer dari " + teksAman(t.dari) + " ke " + teksAman(t.ke));
}

var modulTransfer = buatModulDaftar({
    id: "transfer",
    judul: "Transfer Bank",
    kunci: "daftarTransfer",
    labelData: { nomor: "Nomor", tanggal: "Tanggal", dari: "Dari Kas/Bank", ke: "Ke Kas/Bank", nilai: "Nilai Transfer (Rp)", catatan: "Catatan",
                 jumlahLampiran: "Jumlah Lampiran", ringkasanLampiran: "Lampiran" },
    formatData: { tanggal: function (t) { return formatTanggal(t); }, nilai: function (n) { return formatRupiah(n); } },
    urutAwal: { kolom: "tanggal", arah: -1 },
    // Kolom dan filter seperti foto Accurate
    kolom: [
        { kunci: "nomor", judul: "Nomor #" },
        { kunci: "tanggal", judul: "Tanggal", tampil: function (t) { return formatTanggal(t.tanggal); }, urut: function (t) { return t.tanggal || ""; } },
        { kunci: "dari", judul: "Bank (Keluar)" },
        { kunci: "ke", judul: "Bank (Masuk)" },
        { kunci: "keterangan", judul: "Keterangan", tampil: keteranganTransfer },
        { kunci: "nilai", judul: "Total", rata: "kanan", tampil: function (t) { return formatAngka(t.nilai || 0); }, urut: function (t) { return String(t.nilai || 0).padStart(18, "0"); } }
    ],
    filter: [
        { judul: "Tanggal", ambil: function (t) { return teksAman(t.tanggal).slice(0, 7); }, tampil: teksBulanTahun, turun: true },
        { judul: "Dari Kas/Bank", ambil: function (t) { return teksAman(t.dari); } },
        { judul: "Ke Kas/Bank", ambil: function (t) { return teksAman(t.ke); } }
    ],
    pesanKosong: "Belum ada transfer bank. Klik tombol + untuk membuat.",
    // Transfer yang sudah direkonsiliasi (PRD 6.3) atau bertanggal terkunci (PRD 5.3) tidak boleh dihapus
    alasanTolakHapus: function (t) {
        var rekonsiliasi = galatTransaksiSudahRekonsiliasi(SUMBER_JURNAL_TRANSFER, t.id, "Transfer");
        if (rekonsiliasi) { return rekonsiliasi; }
        return tanggalTerkunci(t.tanggal)
            ? 'Transfer "' + t.nomor + '" bertanggal ' + formatTanggal(t.tanggal) + ' yang sudah terkunci (Preferensi, Pembatasan), jadi tidak bisa dihapus.'
            : "";
    },
    // Menghapus transfer ikut menghapus jurnal otomatisnya (PRD 3.1 butir 3) dan isi file lampirannya
    saatDihapus: function (t) {
        modulJurnal.simpan(daftarJurnalTanpaOtomatis({ jenis: SUMBER_JURNAL_TRANSFER, id: t.id }));
        hapusIsiLampiran(t.id);
    },
    isiForm: function (data) {
        kolomTanggalTransfer.value = data ? teksAman(data.tanggal) : "";   // Data Baru dibuka kosong (PRD 5.3a)
        aturBatasTanggal(kolomTanggalTransfer);
        nomorTransfer.mulai(data ? data.nomor : "");
        isiPilihanKasTransfer(data ? data.dariId : "", data ? data.keId : "");
        kolomNilaiTransfer.value = data ? teksAngkaIsian(data.nilai) : "";
        document.getElementById("transfer-catatan").value = data ? teksAman(data.catatan) : "";
        perbaruiTotalTransfer();
        lampiranTransfer.muat(data);   // Data Baru: kosong; data tersimpan: lampirannya
        document.getElementById("transfer-pesan-galat").hidden = true;
        pilihTabTransfer("uang");
    },
    // Lampiran ikut diingat per tab (PRD 6.10)
    keadaanTambahan: {
        ambil: function () { return lampiranTransfer.kerja(); },
        pakai: function (simpanan) { lampiranTransfer.atur(simpanan); }
    }
});

// Jurnal otomatis Transfer bisa ditelusuri balik (pesan "ubah lewat halaman ...", Histori Bank)
daftarkanAsalJurnal(SUMBER_JURNAL_TRANSFER, { nama: "Transfer Bank", modul: modulTransfer, tab: "transfer" });

// Tab samping: Transfer Uang dan Info lainnya
var pilihTabTransfer = buatPengalihTab(document.querySelectorAll("#isi-transfer [data-transfer-tab]"), "transferTab",
    { uang: "transfer-panel-uang", info: "transfer-panel-info" });

// Dari dan Ke = akun Kas & Bank tingkat 3 (alat bersama isiPilihanKasBank, umum/komponen-transaksi.js; PRD 5.1)
function isiPilihanKasTransfer(idDari, idKe) {
    var atur = function (select, terpilih) {
        return isiPilihanKasBank(select, { terpilih: terpilih, nonaktifKalauKosong: true });   // hasil: jumlah akun Kas/Bank
    };
    var jumlahAkun = atur(pilihDariTransfer, idDari);
    atur(pilihKeTransfer, idKe);
    // Petunjuk "buat dulu akun Kas/Bank" hanya tampil kalau belum ada akunnya
    document.getElementById("petunjuk-transfer-kas").hidden = jumlahAkun > 0;
}

// Nomor: otomatis dari aturan penomoran bertipe Transfer (Pengaturan, Penomoran), atau diketik sendiri
var nomorTransfer = buatNomorOtomatis({
    saklar: document.getElementById("transfer-nomor-otomatis"),
    pilihan: document.getElementById("transfer-aturan-nomor"),
    kolom: document.getElementById("transfer-nomor"),
    contoh: document.getElementById("transfer-contoh-nomor"),
    tanggal: kolomTanggalTransfer,
    tipe: "transfer",
    namaTipe: "Transfer Kas/Bank"
});

// Total di bawah = nilai transfer
function perbaruiTotalTransfer() {
    document.getElementById("transfer-total").textContent = formatRupiah(angkaDariTeks(kolomNilaiTransfer.value));
}
kolomNilaiTransfer.addEventListener("input", perbaruiTotalTransfer);
pasangKolomRupiah(kolomNilaiTransfer);   // titik ribuan langsung saat mengetik

// ----- Menyimpan (PRD 3.1, 4.2, 5.2, 5.3) -----
function tampilkanGalatTransfer(pesan, kolomFokus) {
    var kotak = document.getElementById("transfer-pesan-galat");
    kotak.textContent = pesan;
    kotak.hidden = false;
    if (kolomFokus) { kolomFokus.focus(); }
}

// Jurnal: Debit Kas/Bank tujuan, Kredit Kas/Bank asal (tanpa Divisi/Program)
function isiJurnalTransfer(t, dari, ke) {
    return {
        nomor: t.nomor, tanggal: t.tanggal, keterangan: keteranganTransfer(t),
        rincian: [
            { akunId: ke.id, kode: ke.kode, nama: ke.nama, debit: t.nilai, kredit: 0, keterangan: "Transfer masuk " + t.nomor },
            { akunId: dari.id, kode: dari.kode, nama: dari.nama, debit: 0, kredit: t.nilai, keterangan: "Transfer keluar " + t.nomor }
        ]
    };
}

document.getElementById("form-transfer").addEventListener("submit", function (e) {
    e.preventDefault();
    document.getElementById("transfer-pesan-galat").hidden = true;
    var daftar = modulTransfer.ambil();
    var sedangMengubah = (modulTransfer.idDiubah !== null);
    var lama = sedangMengubah ? daftar.find(function (t) { return t.id === modulTransfer.idDiubah; }) : null;
    var tanggal = kolomTanggalTransfer.value;

    // Pemeriksaan satu per satu; berhenti di kesalahan pertama.
    // Transfer yang sudah direkonsiliasi tidak bisa diubah sebelum tandanya dibatalkan (PRD 6.3)
    var rekonsiliasi = lama ? galatTransaksiSudahRekonsiliasi(SUMBER_JURNAL_TRANSFER, lama.id, "Transfer") : "";
    if (rekonsiliasi) { tampilkanGalatTransfer(rekonsiliasi); return; }
    var galatTanggal = galatTanggalTransaksi(tanggal, lama, { catat: "transfer", ini: "Transfer ini" });
    if (galatTanggal) { tampilkanGalatTransfer(galatTanggal.pesan, galatTanggal.diKolom ? kolomTanggalTransfer : null); return; }
    var akun = akunKasBankPilihan();
    var dari = akun.find(function (a) { return a.id === pilihDariTransfer.value; });
    var ke = akun.find(function (a) { return a.id === pilihKeTransfer.value; });
    pilihTabTransfer("uang");
    if (!dari) { tampilkanGalatTransfer("Dari Kas/Bank wajib dipilih.", pilihDariTransfer); return; }
    if (!ke) { tampilkanGalatTransfer("Ke Kas/Bank wajib dipilih.", pilihKeTransfer); return; }
    if (dari.id === ke.id) { tampilkanGalatTransfer("Dari Kas/Bank dan Ke Kas/Bank tidak boleh sama.", pilihKeTransfer); return; }
    var nilai = angkaDariTeks(kolomNilaiTransfer.value);
    if (nilai <= 0) { tampilkanGalatTransfer("Nilai Transfer wajib diisi dan lebih dari 0.", kolomNilaiTransfer); return; }
    // Preferensi, Lampiran: bila Transfer wajib berlampiran, minimal satu file harus ada
    if (lampiranTransfer.wajibKosong()) { tampilkanGalatTransfer(lampiranTransfer.pesanWajib, tombolLampiranTransfer); return; }

    // Nomor: otomatis atau diketik; unik di antara Transfer dan di buku jurnal
    var infoNomor = nomorTransfer.ambil(tanggal);
    if (infoNomor.galat) { tampilkanGalatTransfer(infoNomor.galat, infoNomor.kolomFokus); return; }
    if (nomorTransaksiTerpakai(infoNomor.nomor, daftar, modulTransfer.idDiubah, SUMBER_JURNAL_TRANSFER)) {
        tampilkanGalatTransfer('Nomor "' + infoNomor.nomor + '" sudah dipakai (di Transfer Bank atau Jurnal Umum).' + (infoNomor.otomatis ? " Matikan Otomatis dan ketik nomor lain." : ""), nomorTransfer.kolomNomorKembar());
        return;
    }

    var data = {
        nomor: infoNomor.nomor, nama: infoNomor.nomor, aturanId: infoNomor.aturanId, tanggal: tanggal,
        dariId: dari.id, dari: dari.kode + " - " + dari.nama, keId: ke.id, ke: ke.kode + " - " + ke.nama,
        nilai: nilai, catatan: document.getElementById("transfer-catatan").value.trim()
    };
    Object.assign(data, lampiranTransfer.infoData());   // hanya keterangan file; isinya disimpan terpisah (umum/lampiran.js)
    var salinanLama = lama ? Object.assign({}, lama) : null;
    var transfer;
    if (sedangMengubah) {
        data.diubahPada = waktuSekarang();
        Object.assign(lama, data);
        transfer = lama;
    } else {
        data.id = buatId("tf");
        data.dibuatOleh = penggunaAktif;
        data.dibuatPada = waktuSekarang();
        daftar.push(data);
        transfer = data;
    }
    simpanTransaksiDenganJurnal({
        modul: modulTransfer, kunci: "daftarTransfer", daftar: daftar, trx: transfer, sedangMengubah: sedangMengubah, salinanLama: salinanLama,
        sumberJurnal: SUMBER_JURNAL_TRANSFER, isiJurnal: function (t) { return isiJurnalTransfer(t, dari, ke); },
        nomor: nomorTransfer, infoNomor: infoNomor, tanggal: tanggal,
        lampiran: lampiranTransfer, galatLampiran: function (pesan) { tampilkanGalatTransfer(pesan, tombolLampiranTransfer); }
    });
});

// Akun dan aturan nomor bisa berubah di halaman lain: muat ulang tiap tab dibuka
saatTabDibuka.transfer = function () {
    modulTransfer.gambarTabel();
    nomorTransfer.segarkan();
    isiPilihanKasTransfer(pilihDariTransfer.value, pilihKeTransfer.value);
    lampiranTransfer.perbaruiLencana();   // tanda wajib mengikuti Preferensi terbaru
};

// Dipanggil dari popup Kas & Bank, kotak Transfer Bank
function bukaTransferBaru() {
    modulTransfer.bukaDariMenu();
}
