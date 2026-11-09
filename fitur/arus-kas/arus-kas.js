// ==================== Laporan Arus Kas (metode langsung) ====================
// PRD 7 (draf 2026-11-06, menunggu koreksi pengguna; tugas I.1d). Satu kolom Jumlah.
// Hanya jurnal yang mengubah total Kas/Bank. Untuk jurnal seimbang, jumlah baris lawannya sama dengan perubahan kas, jadi
// setiap baris lawan (kredit - debit) masuk bagian menurut tipe akunnya. Transfer antar Kas/Bank dan pasangan kas pada
// Pemindahan Dana tidak mengubah total kas, jadi tidak ikut. Tanpa filter Divisi/Program (PRD 4.1: Kas/Bank tanpa tanda).

var BAGIAN_ARUS_KAS = [
    { judul: "AKTIVITAS OPERASI", total: "Kas bersih dari aktivitas operasi",
      tipe: { "pendapatan": true, "pendapatan-lain": true, "beban": true, "beban-lain": true, "aset-lancar-lain": true, "liabilitas-pendek": true } },
    { judul: "AKTIVITAS INVESTASI", total: "Kas bersih dari aktivitas investasi",
      tipe: { "aset-tetap": true, "akumulasi-penyusutan": true, "aset-lain": true } },
    { judul: "AKTIVITAS PENDANAAN", total: "Kas bersih dari aktivitas pendanaan",
      tipe: { "liabilitas-panjang": true, "modal": true } }
];

// Arus per akun lawan pada periode: { idAkun: [kas masuk bersih] }
function hitungArusKas(param, perId) {
    var perJurnal = Object.create(null);
    telusuriJurnalLaporan({ perId: perId, dari: param.dari, sampai: param.sampai }, function (r, akun, j) {
        var kunci = teksAman(j.id) || teksAman(j.nomor) + "|" + teksAman(j.tanggal);
        var isi = perJurnal[kunci] || (perJurnal[kunci] = { kas: 0, lawan: [] });
        if (akun.tipe === "kas-bank") { isi.kas -= selisihKreditDebit(r); } else { isi.lawan.push({ id: teksAman(akun.id), nilai: selisihKreditDebit(r) }); }
    });
    var hasil = Object.create(null);
    Object.keys(perJurnal).forEach(function (k) {
        if (Math.abs(perJurnal[k].kas) < 0.005) { return; }
        perJurnal[k].lawan.forEach(function (b) { hasil[b.id] = [(hasil[b.id] ? hasil[b.id][0] : 0) + b.nilai]; });
    });
    return hasil;
}

function jumlahKasPer(tanggal, perId) {
    var saldo = saldoAkunPer(tanggal, perId);
    return Object.keys(perId).reduce(function (n, id) { return n + (perId[id].tipe === "kas-bank" ? saldo[id] : 0); }, 0);
}

function gambarArusKas(param) {
    var daftarAkun = bacaDaftarAkun();
    var perId = petaAkunLaporan(daftarAkun);
    var arus = hitungArusKas(param, perId);
    var baris = [], jumlah = 0;
    BAGIAN_ARUS_KAS.forEach(function (b) {
        var h = bagianAkunLaporan({
            akun: daftarAkun, kolom: 1, param: param, lewati: akunTeratasSamaBagian,
            tipe: b.tipe, judul: b.judul, namaTotal: b.total,
            nilai: function (id) { return arus[id] || []; }
        });
        baris = baris.concat(h.baris);
        jumlah += h.total[0];
    });
    var awal = jumlahKasPer(tanggalSehariSebelum(param.dari), perId);
    var akhir = jumlahKasPer(param.sampai, perId);
    if (Object.keys(arus).length === 0 && Math.abs(awal) < 0.005 && Math.abs(akhir) < 0.005) {
        return { isi: pesanKosongLaporan("Belum ada saldo atau transaksi Kas/Bank pada periode ini.") };
    }
    baris.push({ jenis: "total", nama: "KENAIKAN (PENURUNAN) KAS", nilai: [jumlah] });
    baris.push({ jenis: "akun", tingkat: 0, nama: "Kas awal periode", nilai: [awal] });
    baris.push({ jenis: "akhir", nama: "KAS AKHIR PERIODE", nilai: [akhir] });
    var catatan = [];
    if (Math.abs(awal + jumlah - akhir) >= 0.005) {
        catatan.push("Perhatian: Kas awal + kenaikan kas tidak sama dengan Kas akhir, selisih " + angkaLaporan(akhir - awal - jumlah) + ". Periksa jurnal yang total debit dan kreditnya tidak sama.");
    }
    return { isi: buatTabelLaporan({ kolom: ["Jumlah"], baris: baris }), catatan: catatan };
}
