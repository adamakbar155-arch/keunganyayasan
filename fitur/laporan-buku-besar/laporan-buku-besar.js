// ==================== Laporan Buku Besar ====================
// PRD 7 (draf 2026-11-06, menunggu koreksi pengguna; tugas I.5, I.6):
//   Neraca Saldo       : saldo debit dan kredit tiap akun per tanggal s/d, ditambah Ekuitas Saldo Awal kalau ada
//   Buku Besar per Akun: Saldo Awal, baris transaksi, dan Saldo Akhir tiap akun (hitungan historiAkun, sama dengan Histori Akun)

function gambarNeracaSaldo(param) {
    var daftarAkun = bacaDaftarAkun();
    var perId = petaAkunLaporan(daftarAkun);
    var saldo = saldoAkunPer(param.sampai, perId);
    var totalDebit = 0, totalKredit = 0;
    var baris = [];
    function tambah(kode, nama, debit, kredit, akun) {
        totalDebit += debit;
        totalKredit += kredit;
        baris.push({ sel: [kode, nama, debit, kredit], saatKlik: akun ? function () { bukaRincianBaris(nama, saringSatuAkun(akun)); } : undefined });
    }
    Object.keys(perId).map(function (id) { return perId[id]; }).sort(urutKodeAkun).forEach(function (a) {
        var s = saldo[teksAman(a.id)];
        if (Math.abs(s) < 0.005) { return; }
        var diDebit = tipeSaldoDebit[a.tipe] ? s > 0 : s < 0;   // saldo minus pindah ke sisi lawannya
        tambah(teksAman(a.kode), teksAman(a.nama), diDebit ? Math.abs(s) : 0, diDebit ? 0 : Math.abs(s), a);
    });
    var ekuitas = ekuitasSaldoAwal(perId);
    if (Math.abs(ekuitas) >= 0.005) { tambah("", "Ekuitas Saldo Awal", ekuitas < 0 ? -ekuitas : 0, ekuitas > 0 ? ekuitas : 0); }
    if (!baris.length) { return { isi: pesanKosongLaporan("Belum ada saldo akun sampai tanggal ini.") }; }
    baris.push({ jenis: "akhir", sel: ["Total", "", totalDebit, totalKredit] });
    var catatan = Math.abs(totalDebit - totalKredit) >= 0.005
        ? ["Perhatian: total Debit dan Kredit tidak sama, selisih " + angkaLaporan(totalDebit - totalKredit) + ". Periksa jurnal yang tidak seimbang."] : [];
    return { catatan: catatan, isi: buatTabelRincian({
        kolom: [{ judul: "Kode", lebar: 84, rapat: true }, { judul: "Nama", lebar: 270 }, { judul: "Debit", lebar: 124, angka: true }, { judul: "Kredit", lebar: 124, angka: true }],
        baris: baris
    }) };
}

function gambarBukuBesar(param) {
    var perId = petaAkunLaporan(bacaDaftarAkun());
    var dipakai = Object.create(null);
    telusuriJurnalLaporan({ perId: perId, sampai: param.sampai }, function (r) { dipakai[teksAman(r.akunId)] = true; });
    Object.keys(perId).forEach(function (id) { if (Number(perId[id].saldoAwal)) { dipakai[id] = true; } });
    // Akun yang dipilih tampil walaupun kosong; tanpa pilihan: semua akun yang punya saldo awal atau transaksi
    var ids = param.akun.length ? param.akun.filter(function (id) { return perId[id]; }) : Object.keys(dipakai);
    var akun = ids.map(function (id) { return perId[id]; }).sort(urutKodeAkun);
    if (!akun.length) { return { isi: pesanKosongLaporan("Belum ada transaksi pada periode ini.") }; }
    var baris = [];
    akun.forEach(function (a) {
        var h = historiAkun(a.id, param.dari, param.sampai);
        baris.push({ jenis: "grup", sel: [namaAkunLaporan(a)] });
        baris.push({ sel: ["", "", "", "Saldo Awal", "", "", h.saldoAwal] });
        var saldo = h.saldoAwal;
        h.baris.forEach(function (b) {
            saldo = b.saldo;
            baris.push({ saatKlik: function () { bukaAsalJurnal(b.jurnal); },
                         sel: [formatTanggal(b.tanggal), b.nomor, b.tipe, b.keterangan, b.dk === "Dr" ? b.mutasi : 0, b.dk === "Cr" ? b.mutasi : 0, b.saldo] });
        });
        baris.push({ jenis: "jumlah", sel: ["", "", "", "Saldo Akhir", "", "", saldo] });
    });
    return { isi: buatTabelRincian({
        kolom: [{ judul: "Tanggal", lebar: 92, rapat: true }, { judul: "No Bukti", lebar: 96, rapat: true }, { judul: "Tipe", lebar: 124 }, { judul: "Keterangan" },
                { judul: "Debit", lebar: 108, angka: true }, { judul: "Kredit", lebar: 108, angka: true }, { judul: "Saldo", lebar: 112, angka: true }],
        baris: baris
    }) };
}
