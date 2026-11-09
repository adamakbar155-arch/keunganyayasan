// ==================== Laporan rincian transaksi ====================
// PRD 7 (draf 2026-11-06, menunggu koreksi pengguna; tugas I.2, I.3, I.6):
//   Rincian Pengeluaran      : segala pembelian dan pengeluaran dari Jurnal Umum dan Pembayaran
//   Rincian Beban Pembayaran : baris selain Kas/Bank dari Pembayaran
//   Jurnal tanpa Lampiran    : jurnal pada periode yang transaksi asalnya belum berlampiran (Temuan 35)
// Klik baris membuka transaksi asalnya (bukaAsalJurnal, fitur/jurnal/jurnal.js).

// Jumlah lampiran sebuah data (jurnal atau transaksi). Data rusak = 0.
function jumlahLampiranData(d) {
    var n = Number(d.jumlahLampiran);
    return n > 0 ? n : (Array.isArray(d.lampiranInfo) ? d.lampiranInfo.length : 0);
}

// Baris data rincian dengan baris Total di bawahnya; kolomNilai = nomor kolom Nilai
function denganTotalRincian(data, jumlahKolom, kolomNilai) {
    data.sort(urutTanggalNomor);
    var total = data.reduce(function (n, b) { return n + b.sel[kolomNilai]; }, 0);
    var sel = new Array(jumlahKolom).fill("");
    sel[0] = "Total";
    sel[kolomNilai] = total;
    return data.concat([{ sel: sel, jenis: "akhir" }]);
}

// Segala pembelian dan pengeluaran dari rincian Jurnal Umum dan Pembayaran (PRD 7, keputusan pengguna 2026-11-06).
// Baris Debit selain Kas/Bank; baris Kredit akun beban ikut sebagai koreksi (minus), supaya beban yang dibetulkan tidak tampil lebih besar.
function barisPengeluaranLaporan(r, akun, j) {
    var dariFormulir = !j.sumber || j.sumber.jenis === "pembayaran";
    if (!dariFormulir || akun.tipe === "kas-bank") { return false; }
    return (Number(r.debit) || 0) > 0 || akun.tipe === "beban" || akun.tipe === "beban-lain";
}

function gambarRincianPengeluaran(param) {
    var data = [];
    telusuriJurnalLaporan({ perId: petaAkunLaporan(bacaDaftarAkun()), dari: param.dari, sampai: param.sampai,
                            divisi: param.divisi, program: param.program, akun: param.akun }, function (r, akun, j, tanggal) {
        if (!barisPengeluaranLaporan(r, akun, j)) { return; }
        data.push({
            tanggal: tanggal, nomor: teksAman(j.nomor), saatKlik: function () { bukaAsalJurnal(j); },
            sel: [formatTanggal(tanggal), teksAman(j.nomor), asalJurnalOtomatis(j) || "Jurnal Umum", namaAkunLaporan(akun),
                  teksAman(r.keterangan) || teksAman(j.keterangan), namaProgramDari(teksAman(r.programId)),
                  teksAman(namaDivisiDari(teksAman(r.divisiId))), teksAman(r.penanggung), -selisihKreditDebit(r)]
        });
    });
    if (!data.length) { return { isi: pesanKosongLaporan("Belum ada pengeluaran pada periode dan filter ini.") }; }
    return { isi: buatTabelRincian({
        kolom: [{ judul: "Tanggal", lebar: 88, rapat: true }, { judul: "No Bukti", lebar: 88, rapat: true }, { judul: "Sumber", lebar: 84 }, { judul: "Akun", lebar: 150 },
                { judul: "Keterangan" }, { judul: "Program", lebar: 92 }, { judul: "Divisi", lebar: 92 }, { judul: "Penanggung Jawab", lebar: 80 },
                { judul: "Nilai", lebar: 100, angka: true }],
        baris: denganTotalRincian(data, 9, 8)
    }) };
}

function gambarRincianBebanPembayaran(param) {
    var perId = petaAkunLaporan(bacaDaftarAkun());
    var data = [];
    telusuriJurnalLaporan({ perId: perId, dari: param.dari, sampai: param.sampai, divisi: param.divisi, program: param.program, akun: param.akun }, function (r, akun, j, tanggal) {
        if (akun.tipe === "kas-bank" || !j.sumber || j.sumber.jenis !== "pembayaran") { return; }
        var sisiKas = rincianAman(j).find(function (b) { var a = perId[teksAman(b.akunId)]; return a && a.tipe === "kas-bank"; });
        data.push({
            tanggal: tanggal, nomor: teksAman(j.nomor), saatKlik: function () { bukaAsalJurnal(j); },
            sel: [formatTanggal(tanggal), teksAman(j.nomor), sisiKas ? teksAman(sisiKas.nama) : "", namaAkunLaporan(akun),
                  teksAman(r.keterangan) || teksAman(j.keterangan), teksAman(namaDivisiDari(teksAman(r.divisiId))),
                  namaProgramDari(teksAman(r.programId)), -selisihKreditDebit(r)]
        });
    });
    if (!data.length) { return { isi: pesanKosongLaporan("Belum ada Pembayaran pada periode dan filter ini.") }; }
    return { isi: buatTabelRincian({
        kolom: [{ judul: "Tanggal", lebar: 84, rapat: true }, { judul: "No Bukti", lebar: 92, rapat: true }, { judul: "Kas/Bank", lebar: 120 }, { judul: "Akun" },
                { judul: "Keterangan" }, { judul: "Divisi", lebar: 110 }, { judul: "Program", lebar: 110 }, { judul: "Nilai", lebar: 100, angka: true }],
        baris: denganTotalRincian(data, 8, 7)
    }) };
}

// Lampiran dicari di transaksi asalnya (Temuan 35): Pembayaran, Transfer, Donasi, dan seterusnya menyimpan lampirannya
// sendiri sejak J.20/J.21; Jurnal Umum di jurnalnya. Jurnal otomatis yang transaksi asalnya sudah hilang tetap tampil.
function gambarJurnalTanpaLampiran(param) {
    var data = [];
    var cariAsal = pembacaAsalJurnal();   // fitur/jurnal/jurnal.js; daftar asal dibaca sekali
    bacaJurnalMentah().forEach(function (j) {
        var tanggal = teksAman(j.tanggal);
        var asal = cariAsal(j);
        if (!tanggalDalamRentang(tanggal, param.dari, param.sampai) || jumlahLampiranData(asal ? asal.data : j) > 0) { return; }
        var nilai = rincianAman(j).reduce(function (n, r) { return n + (Number(r.debit) || 0); }, 0);
        data.push({
            tanggal: tanggal, nomor: teksAman(j.nomor), saatKlik: function () { bukaAsalJurnal(j); },
            sel: [formatTanggal(tanggal), teksAman(j.nomor), asalJurnalOtomatis(j) || "Jurnal Umum", teksAman(j.keterangan), nilai]
        });
    });
    if (!data.length) { return { isi: pesanKosongLaporan("Tidak ada jurnal tanpa lampiran pada periode ini.") }; }
    return { isi: buatTabelRincian({
        kolom: [{ judul: "Tanggal", lebar: 84, rapat: true }, { judul: "No Bukti", lebar: 92, rapat: true }, { judul: "Sumber", lebar: 124 }, { judul: "Keterangan" },
                { judul: "Nilai", lebar: 100, angka: true }],
        baris: denganTotalRincian(data, 5, 4)
    }) };
}
