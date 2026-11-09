// ==================== Laporan per Program ====================
// PRD 7 (draf 2026-11-06, menunggu koreksi pengguna; tugas I.1e dan I.4):
//   Laporan Donasi per Program : Sisa Awal | Pemasukan | Pengeluaran | Pemindahan | Sisa Akhir untuk periode
//   Sisa Dana per Program      : Dengan | Tanpa pembatasan | Jumlah per tanggal s/d
// Dari baris jurnal akun pendapatan, beban, dan modal (rumus sisa dana PRD 6.0). Dikelompokkan per Divisi; baris ber-Divisi
// tanpa Program menjadi "Tanpa Program", baris tanpa Divisi dan tanpa Program menjadi kelompok "Dana Umum".

// Tempat satu baris jurnal: { kelompok (kunci urut), namaKelompok, kunci, nama }, atau null kalau tersaring
function tempatProgramLaporan(r, param, programPerId) {
    var programId = teksAman(r.programId);
    var program = programId ? programPerId[programId] : null;
    var divisiId = (program && teksAman(program.divisiId)) || teksAman(r.divisiId);
    if (param.divisi.length && param.divisi.indexOf(divisiId) === -1) { return null; }
    if (param.program.length && param.program.indexOf(programId) === -1) { return null; }
    if (!divisiId && !programId) { return { kelompok: "~umum", namaKelompok: "Dana Umum", kunci: "umum", nama: "Dana Umum" }; }
    var nama = programId ? (program ? teksAman(program.nama) : "(Program sudah dihapus)") : "Tanpa Program";
    var namaKelompok = divisiId ? namaDivisiLaporan(divisiId) : "Tanpa Divisi";
    return { kelompok: namaKelompok, namaKelompok: namaKelompok, kunci: divisiId + "|" + programId, nama: nama };
}

// Mengumpulkan angka per tempat: tambah(n, baris, akun, tanggal) mengubah n (daftar angka sepanjang jumlahKolom)
function kumpulkanProgramLaporan(param, jumlahKolom, tambah) {
    var perId = petaAkunLaporan(bacaDaftarAkun());
    var programPerId = Object.create(null);
    bacaProgram().forEach(function (p) { if (p && teksAman(p.id)) { programPerId[teksAman(p.id)] = p; } });
    var tempat = Object.create(null);
    telusuriJurnalLaporan({ perId: perId, sampai: param.sampai }, function (r, akun, j, tanggal) {
        if (!TIPE_AKUN_SISA_DANA[akun.tipe]) { return; }
        var t = tempatProgramLaporan(r, param, programPerId);
        if (!t) { return; }
        var isi = tempat[t.kunci] || (tempat[t.kunci] = Object.assign(t, { nilai: new Array(jumlahKolom).fill(0) }));
        // Klik baris: transaksi yang masuk ke tempat ini (fitur/laporan/rincian-baris.js)
        isi.saring = function (b, a) {
            var x = TIPE_AKUN_SISA_DANA[a.tipe] ? tempatProgramLaporan(b, param, programPerId) : null;
            return !!x && x.kunci === isi.kunci;
        };
        tambah(isi.nilai, r, akun, tanggal);
    });
    return Object.keys(tempat).map(function (k) { return tempat[k]; });
}

// Baris tabel: kelompok Divisi (Dana Umum paling bawah), Program urut nama, "Jumlah <kelompok>" kalau isinya 2 atau lebih
function barisKelompokProgram(tempat, jumlahKolom, namaAkhir) {
    var kelompok = Object.create(null);
    tempat.forEach(function (t) {
        if (!t.nilai.some(function (n) { return Math.abs(n) >= 0.005; })) { return; }
        (kelompok[t.kelompok] = kelompok[t.kelompok] || []).push(t);
    });
    var baris = [], total = new Array(jumlahKolom).fill(0);
    Object.keys(kelompok).sort(function (a, b) {
        if (a === "~umum" || b === "~umum") { return a === b ? 0 : (a === "~umum" ? 1 : -1); }   // Dana Umum paling bawah
        return a.localeCompare(b, "id");
    }).forEach(function (k) {
        var isi = kelompok[k].sort(function (a, b) { return a.nama.localeCompare(b.nama, "id"); });
        var jumlah = new Array(jumlahKolom).fill(0);
        var umum = k === "~umum";   // Dana Umum cukup satu baris, tanpa judul kelompok bernama sama
        if (!umum) { baris.push({ jenis: "judul", tingkat: 0, nama: isi[0].namaKelompok }); }
        isi.forEach(function (t) {
            baris.push({ jenis: "akun", tingkat: umum ? 0 : 1, nama: t.nama, nilai: t.nilai, saring: t.saring });
            t.nilai.forEach(function (n, i) { jumlah[i] += n; total[i] += n; });
        });
        if (isi.length >= 2) { baris.push({ jenis: "jumlah", tingkat: 0, nama: "Jumlah " + isi[0].namaKelompok, nilai: jumlah }); }
    });
    if (baris.length) { baris.push({ jenis: "akhir", nama: namaAkhir, nilai: total }); }
    return baris;
}

function gambarDonasiPerProgram(param) {
    var tempat = kumpulkanProgramLaporan(param, 5, function (n, r, akun, tanggal) {
        var nilai = selisihKreditDebit(r);
        if (tanggal < param.dari) { n[0] += nilai; }
        else if (akun.tipe === "modal") { n[3] += nilai; }
        else if (akun.tipe === "beban" || akun.tipe === "beban-lain") { n[2] -= nilai; }
        else { n[1] += nilai; }
        n[4] = n[0] + n[1] - n[2] + n[3];
    });
    var baris = barisKelompokProgram(tempat, 5, "TOTAL");
    if (!baris.length) { return { isi: pesanKosongLaporan("Belum ada transaksi Program pada periode dan filter ini.") }; }
    return { isi: buatTabelLaporan({ kolom: ["Sisa Awal", "Pemasukan", "Pengeluaran", "Pemindahan", "Sisa Akhir"], baris: baris }) };
}

function gambarSisaDanaProgram(param) {
    var tempat = kumpulkanProgramLaporan(param, 3, function (n, r) {
        var nilai = selisihKreditDebit(r);
        n[r.terikat === true ? 0 : 1] += nilai;
        n[2] += nilai;
    });
    var baris = barisKelompokProgram(tempat, 3, "TOTAL");
    if (!baris.length) { return { isi: pesanKosongLaporan("Belum ada sisa dana sampai tanggal ini.") }; }
    return { isi: buatTabelLaporan({ kolom: ["Dengan pembatasan", "Tanpa pembatasan", "Jumlah"], baris: baris }) };
}
