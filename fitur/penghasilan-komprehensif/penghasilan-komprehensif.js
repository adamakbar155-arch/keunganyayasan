// ==================== Laporan Penghasilan Komprehensif (Laba Rugi) ====================
// PRD 7 (gaya Yayasan BaKTI, disetujui 2026-11-02 dan 2026-11-03; tugas I.1b). Dihitung dari buku jurnal (termasuk
// jurnal otomatis) untuk periode Dari s/d di Parameter Laporan:
//   PENERIMAAN = akun Pendapatan dan Pendapatan Lainnya (kredit - debit)
//   BEBAN      = akun Beban dan Beban Lainnya (debit - kredit)
//   SURPLUS (DEFISIT) = JUMLAH PENERIMAAN - JUMLAH BEBAN
//   Pemindahan sisa program ke Dana Umum dan TOTAL PENGHASILAN KOMPREHENSIF, hanya kalau ada Pemindahan Dana
// Kolom: Dengan pembatasan (baris jurnal bertanda Terikat) | Tanpa pembatasan (Tidak Terikat; data lama tanpa tanda
// juga di sini) | Jumlah. Filter Divisi dan Program menyaring baris jurnal (kosong = semua).
// Bentuk per Divisi / per Program (dari foto Laba/Rugi Departemen Accurate): satu kolom per Divisi atau Program + Total,
// baris induk langsung berisi jumlahnya. Dipakai kartu Laporan Penghasilan per Divisi dan per Program, dan laporan ini
// kalau Divisi tertentu dipilih.
// Memakai alat bersama laporan: fitur/laporan/hitung.js, pohon.js. Kartunya di DAFTAR_LAPORAN (fitur/laporan/laporan.js).

var TIPE_PENERIMAAN_LPK = { "pendapatan": true, "pendapatan-lain": true };
var TIPE_BEBAN_LPK = { "beban": true, "beban-lain": true };

function akunPenghasilan(akun) {
    return !!(TIPE_PENERIMAAN_LPK[akun.tipe] || TIPE_BEBAN_LPK[akun.tipe]);
}

// Kolom per Divisi atau Program. Tanpa pilihan di Parameter: semua yang ada transaksinya pada periode itu, urut nama,
// "Tanpa ..." paling kanan.
function kolomPerKelompok(param, per, perId) {
    var kunci = per === "divisi" ? "divisiId" : "programId";
    var dipilih = per === "divisi" ? param.divisi : param.program;
    function nama(id) {
        if (per === "divisi") { return id ? namaDivisiLaporan(id) : "Tanpa Divisi"; }
        return id ? (namaProgramDari(id) || "(Program sudah dihapus)") : "Tanpa Program";
    }
    var ids = dipilih.slice();
    if (!ids.length) {
        telusuriJurnalLaporan({ perId: perId, dari: param.dari, sampai: param.sampai, divisi: param.divisi }, function (r, akun) {
            var id = teksAman(r[kunci]);
            if (akunPenghasilan(akun) && ids.indexOf(id) === -1) { ids.push(id); }
        });
        ids.sort(function (a, b) { return (a ? 0 : 1) - (b ? 0 : 1) || nama(a).localeCompare(nama(b), "id"); });
    }
    return {
        judul: ids.map(nama).concat(["Total"]),
        dari: function (r) { return ids.indexOf(teksAman(r[kunci])); }
    };
}

// Susunan kolom laporan: judul kolom dan cara menentukan kolom sebuah baris jurnal
function kolomPenghasilan(param, per, perId) {
    if (per) { return kolomPerKelompok(param, per, perId); }
    return {
        judul: ["Dengan pembatasan", "Tanpa pembatasan", "Jumlah"],
        dari: function (r) { return r.terikat === true ? 0 : 1; }   // PRD 4.1: Terikat = Dengan; selain itu Tanpa
    };
}

// Angka per akun untuk periode dan filter param: { akunId: [per kolom, jumlah] } milik akun itu sendiri.
// Penerimaan dihitung kredit - debit, beban debit - kredit, jadi keduanya bernilai positif dalam keadaan biasa.
function hitungPenghasilanKomprehensif(param, perId, kolom) {
    var hasil = Object.create(null);
    var terakhir = kolom.judul.length - 1;
    telusuriJurnalLaporan({ perId: perId, dari: param.dari, sampai: param.sampai, divisi: param.divisi, program: param.program }, function (r, akun) {
        var arah = TIPE_PENERIMAAN_LPK[akun.tipe] ? 1 : (TIPE_BEBAN_LPK[akun.tipe] ? -1 : 0);
        var k = kolom.dari(r);
        if (!arah || k === -1) { return; }   // akun lain (kas, aset neto, dst.) tidak masuk laporan ini
        var id = teksAman(akun.id);
        if (!hasil[id]) { hasil[id] = kolom.judul.map(function () { return 0; }); }
        hasil[id][k] += arah * selisihKreditDebit(r);
        hasil[id][terakhir] += arah * selisihKreditDebit(r);
    });
    return hasil;
}

// Hasil laporan yang juga dipakai Laporan Perubahan Aset Neto. per = "" | "divisi" | "program"
function angkaPenghasilanKomprehensif(param, per) {
    var daftarAkun = bacaDaftarAkun();
    var perId = petaAkunLaporan(daftarAkun);
    var kolom = kolomPenghasilan(param, per, perId);
    var angka = hitungPenghasilanKomprehensif(param, perId, kolom);
    function bagian(judul, tipe, namaTotal) {
        return bagianAkunLaporan({
            akun: daftarAkun, kolom: kolom.judul.length, param: param, lewati: akunTeratasSamaBagian, indukBerangka: !!per,
            tipe: tipe, judul: judul, namaTotal: namaTotal,
            nilai: function (id) { return angka[id] || []; }
        });
    }
    // Total bagian huruf besar, supaya tidak sama dengan "Jumlah <akun induk>" (Temuan 33)
    var penerimaan = bagian("PENERIMAAN", TIPE_PENERIMAAN_LPK, "JUMLAH PENERIMAAN");
    var beban = bagian("BEBAN", TIPE_BEBAN_LPK, "JUMLAH BEBAN");
    var surplus = penerimaan.total.map(function (n, i) { return n - beban.total[i]; });
    var pemindahan = jumlahPemindahanDana({ perId: perId, dari: param.dari, sampai: param.sampai, divisi: param.divisi, program: param.program },
        kolom.dari, kolom.judul.length);
    return { kolom: kolom, angka: angka, penerimaan: penerimaan, beban: beban, surplus: surplus, pemindahan: pemindahan };
}

function gambarPenghasilan(param, per, judul) {
    var h = angkaPenghasilanKomprehensif(param, per);
    var adaPemindahan = h.pemindahan.some(function (n) { return n !== 0; });
    if (Object.keys(h.angka).length === 0 && !adaPemindahan) {
        return { judul: judul, isi: pesanKosongLaporan("Belum ada transaksi penerimaan atau beban pada periode dan filter ini.") };
    }
    var baris = h.penerimaan.baris.concat(h.beban.baris);
    if (adaPemindahan) {
        // Kalau ada pemindahan, Surplus bukan baris akhir: angka akhirnya TOTAL PENGHASILAN KOMPREHENSIF
        baris.push({ jenis: "total", nama: "SURPLUS (DEFISIT)", nilai: h.surplus });
        baris.push({ jenis: "akun", tingkat: 0, nama: per ? "Pemindahan Dana" : "Pemindahan sisa program ke Dana Umum", nilai: h.pemindahan });
        baris.push({ jenis: "akhir", nama: "TOTAL PENGHASILAN KOMPREHENSIF", nilai: h.surplus.map(function (n, i) { return n + h.pemindahan[i]; }) });
    } else {
        baris.push({ jenis: "akhir", nama: "SURPLUS (DEFISIT)", nilai: h.surplus });
    }
    // Banyak Divisi = banyak kolom: kertas mendatar
    return { judul: judul, lebar: h.kolom.judul.length > 4, isi: buatTabelLaporan({ kolom: h.kolom.judul, baris: baris }) };
}

function gambarPenghasilanKomprehensif(param) {
    return param.divisi.length ? gambarPenghasilan(param, "divisi", "Laporan Penghasilan Komprehensif per Divisi") : gambarPenghasilan(param, "", "");
}
function gambarPenghasilanPerDivisi(param) { return gambarPenghasilan(param, "divisi", ""); }
function gambarPenghasilanPerProgram(param) { return gambarPenghasilan(param, "program", ""); }
