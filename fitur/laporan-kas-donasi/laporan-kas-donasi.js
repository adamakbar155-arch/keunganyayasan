// ==================== Laporan Kas/Bank dan Donasi ====================
// PRD 7 (draf 2026-11-06, menunggu koreksi pengguna; tugas I.6):
//   Daftar Kas dan Bank         : akun Kas & Bank paling bawah beserta saldonya per tanggal s/d
//   Penerimaan Donasi per Divisi: Terikat | Tidak Terikat | Jumlah dari jurnal Pencatatan Donasi
//   Rincian per Donasi          : daftar donasi dikelompokkan per Kategori Donasi (dari foto Accurate)
//   Rincian Donasi per Donatur  : daftar donasi dikelompokkan per donatur

function gambarDaftarKasBank(param) {
    var daftarAkun = bacaDaftarAkun();
    var perId = petaAkunLaporan(daftarAkun);
    var saldo = saldoAkunPer(param.sampai, perId);
    var punyaAnak = Object.create(null);
    daftarAkun.forEach(function (a) { if (a && a.indukId) { punyaAnak[teksAman(a.indukId)] = true; } });
    var kas = daftarAkun.filter(function (a) { return a && a.tipe === "kas-bank" && perId[teksAman(a.id)] === a && !punyaAnak[teksAman(a.id)]; }).sort(urutKodeAkun);
    if (!kas.length) { return { isi: pesanKosongLaporan("Belum ada akun Kas & Bank.") }; }
    var total = 0;
    var baris = kas.map(function (a) {
        var s = saldo[teksAman(a.id)];
        total += s;
        return { saatKlik: function () { bukaRincianBaris(teksAman(a.nama), saringSatuAkun(a)); },
                 sel: [teksAman(a.kode), teksAman(a.nama), teksAman(a.namaBank), teksAman(a.noRekening), s] };
    });
    baris.push({ jenis: "akhir", sel: ["Total", "", "", "", total] });
    return { isi: buatTabelRincian({
        kolom: [{ judul: "Kode", lebar: 84, rapat: true }, { judul: "Nama", lebar: 220 }, { judul: "Bank", lebar: 100 }, { judul: "No Rekening", lebar: 110, rapat: true },
                { judul: "Saldo", lebar: 118, angka: true }],
        baris: baris
    }) };
}

function gambarDonasiPerDivisi(param) {
    var perDivisi = Object.create(null);
    telusuriJurnalLaporan({ perId: petaAkunLaporan(bacaDaftarAkun()), dari: param.dari, sampai: param.sampai, divisi: param.divisi, program: param.program }, function (r, akun, j) {
        if (!j.sumber || j.sumber.jenis !== SUMBER_JURNAL_DONASI || akun.tipe === "kas-bank") { return; }
        var id = teksAman(r.divisiId);
        var n = perDivisi[id] || (perDivisi[id] = [0, 0, 0]);
        n[r.terikat === true ? 0 : 1] += selisihKreditDebit(r);
        n[2] += selisihKreditDebit(r);
    });
    var ids = Object.keys(perDivisi);
    if (!ids.length) { return { isi: pesanKosongLaporan("Belum ada donasi pada periode dan filter ini.") }; }
    var baris = ids.map(function (id) { return { id: id, nama: id ? namaDivisiLaporan(id) : "Tanpa Divisi", nilai: perDivisi[id] }; })
        .sort(function (a, b) { return a.nama.localeCompare(b.nama, "id"); })
        .map(function (b) {
            return { jenis: "akun", tingkat: 0, nama: b.nama, nilai: b.nilai, saring: function (r, akun, j) {
                return !!j.sumber && j.sumber.jenis === SUMBER_JURNAL_DONASI && akun.tipe !== "kas-bank" && teksAman(r.divisiId) === b.id;
            } };
        });
    var total = [0, 0, 0];
    ids.forEach(function (id) { perDivisi[id].forEach(function (n, i) { total[i] += n; }); });
    baris.push({ jenis: "akhir", nama: "JUMLAH DONASI", nilai: total });
    return { isi: buatTabelLaporan({ kolom: ["Terikat", "Tidak Terikat", "Jumlah"], baris: baris }) };
}

// Semua baris Pencatatan Donasi pada periode dan filter, sudah urut tanggal lalu nomor. Klik baris membuka donasinya.
function barisDonasiLaporan(param) {
    var hasil = [];
    modulDonasiCatat.ambil().forEach(function (d) {
        var tanggal = teksAman(d.tanggal);
        if (!tanggalDalamRentang(tanggal, param.dari, param.sampai)) { return; }
        rincianAman(d).forEach(function (b) {
            if (param.divisi.length && param.divisi.indexOf(teksAman(b.divisiId)) === -1) { return; }
            if (param.program.length && param.program.indexOf(teksAman(b.programId)) === -1) { return; }
            hasil.push({
                tanggal: tanggal, nomor: teksAman(d.nomor), kode: teksAman(b.kode), kategori: teksAman(b.nama),
                donatur: namaDonaturDariId(teksAman(d.donaturId)) || "(tanpa donatur)", nilai: Number(b.nilai) || 0, baris: b,
                saatKlik: function () { bukaAsalJurnal({ sumber: { jenis: SUMBER_JURNAL_DONASI, id: d.id } }); }
            });
        });
    });
    return hasil.sort(urutTanggalNomor);
}

// Rincian per Donasi (dari foto Rincian Penjualan per Barang Accurate): kelompok Kategori Donasi urut kode
function gambarRincianPerDonasi(param) {
    var data = barisDonasiLaporan(param);
    if (!data.length) { return { isi: pesanKosongLaporan("Belum ada donasi pada periode dan filter ini.") }; }
    var kelompok = Object.create(null);
    data.forEach(function (b) { (kelompok[b.kategori] = kelompok[b.kategori] || []).push(b); });
    var baris = [], total = 0;
    Object.keys(kelompok).sort(function (a, b) {
        return (kelompok[a][0].kode + " " + a).localeCompare(kelompok[b][0].kode + " " + b, "id", { numeric: true });
    }).forEach(function (k) {
        var jumlah = 0;
        baris.push({ jenis: "grup", sel: [k] });
        kelompok[k].forEach(function (b) {
            jumlah += b.nilai;
            baris.push({ saatKlik: b.saatKlik, sel: [formatTanggal(b.tanggal), b.nilai, b.donatur] });
        });
        baris.push({ jenis: "jumlah", sel: ["", jumlah, ""] });
        total += jumlah;
    });
    baris.push({ jenis: "akhir", sel: ["Total", total, ""] });
    return { isi: buatTabelRincian({ kolom: [{ judul: "Tanggal", lebar: 130, rapat: true }, { judul: "Nilai", lebar: 140, angka: true }, { judul: "Nama Donatur", lebar: 230 }], baris: baris }) };
}

function gambarDonasiPerDonatur(param) {
    var perDonatur = Object.create(null);
    barisDonasiLaporan(param).forEach(function (b) {
        (perDonatur[b.donatur] = perDonatur[b.donatur] || []).push({
            tanggal: b.tanggal, nomor: b.nomor, saatKlik: b.saatKlik,
            sel: [formatTanggal(b.tanggal), b.nomor, b.kategori, teksAman(namaDivisiDari(teksAman(b.baris.divisiId))),
                  namaProgramDari(teksAman(b.baris.programId)), b.nilai]
        });
    });
    var nama = Object.keys(perDonatur).sort(function (a, b) { return a.localeCompare(b, "id"); });
    if (!nama.length) { return { isi: pesanKosongLaporan("Belum ada donasi pada periode dan filter ini.") }; }
    var baris = [], total = 0;
    nama.forEach(function (n) {
        var isi = perDonatur[n];
        var jumlah = isi.reduce(function (t, b) { return t + b.sel[5]; }, 0);
        total += jumlah;
        baris.push({ jenis: "grup", sel: [n] });
        baris = baris.concat(isi);
        baris.push({ jenis: "jumlah", sel: ["Jumlah " + n, "", "", "", "", jumlah] });
    });
    baris.push({ jenis: "akhir", sel: ["Total", "", "", "", "", total] });
    return { isi: buatTabelRincian({
        kolom: [{ judul: "Tanggal", lebar: 92, rapat: true }, { judul: "No Bukti", lebar: 92, rapat: true }, { judul: "Kategori" }, { judul: "Divisi", lebar: 100 },
                { judul: "Program", lebar: 100 }, { judul: "Nilai", lebar: 104, angka: true }],
        baris: baris
    }) };
}
