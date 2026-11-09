// ==================== Laporan Posisi Keuangan (Neraca) ====================
// PRD 7 (draf 2026-11-06, menunggu koreksi pengguna; tugas I.1a). Satu kolom Jumlah, per tanggal s/d:
//   ASET -> JUMLAH ASET; LIABILITAS -> JUMLAH LIABILITAS;
//   ASET NETO (Tanpa dan Dengan pembatasan) -> JUMLAH ASET NETO -> JUMLAH LIABILITAS DAN ASET NETO.
// Saldo = saldo awal + jurnal sampai tanggal itu. Akumulasi Penyusutan tampil sebagai pengurang aset.
// Tanpa filter Divisi/Program, karena baris Kas/Bank tidak bertanda Divisi dan Program (PRD 4.1).

var TIPE_ASET_POSISI = { "kas-bank": true, "aset-lancar-lain": true, "aset-tetap": true, "akumulasi-penyusutan": true, "aset-lain": true };
var TIPE_LIABILITAS_POSISI = { "liabilitas-pendek": true, "liabilitas-panjang": true };

function gambarPosisiKeuangan(param) {
    var daftarAkun = bacaDaftarAkun();
    var perId = petaAkunLaporan(daftarAkun);
    var saldo = saldoAkunPer(param.sampai, perId);
    function bagian(judul, tipe, namaTotal) {
        var h = bagianAkunLaporan({
            akun: daftarAkun, kolom: 1, param: param, tipe: tipe, judul: judul, namaTotal: namaTotal,
            nilai: function (id) {
                var a = perId[id];
                return [a && a.tipe === "akumulasi-penyusutan" ? -saldo[id] : saldo[id]];   // pengurang aset
            }
        });
        return { baris: h.baris, total: h.total[0] };
    }
    var aset = bagian("ASET", TIPE_ASET_POSISI, "JUMLAH ASET");
    var liabilitas = bagian("LIABILITAS", TIPE_LIABILITAS_POSISI, "JUMLAH LIABILITAS");
    var neto = posisiAsetNeto(param.sampai, perId);
    var jumlahNeto = neto.dengan + neto.tanpa;
    var akhir = liabilitas.total + jumlahNeto;
    if (Math.abs(aset.total) < 0.005 && Math.abs(akhir) < 0.005) {
        return { isi: pesanKosongLaporan("Belum ada saldo akun sampai tanggal ini.") };
    }
    var baris = aset.baris.concat(liabilitas.baris, [
        { jenis: "bagian", nama: "ASET NETO" },
        { jenis: "akun", tingkat: 0, nama: "Tanpa pembatasan", nilai: [neto.tanpa] },
        { jenis: "akun", tingkat: 0, nama: "Dengan pembatasan", nilai: [neto.dengan] },
        { jenis: "total", nama: "JUMLAH ASET NETO", nilai: [jumlahNeto] },
        { jenis: "akhir", nama: "JUMLAH LIABILITAS DAN ASET NETO", nilai: [akhir] }
    ]);
    var catatan = [];
    if (Math.abs(neto.ekuitas) >= 0.005) {
        catatan.push("Aset neto tanpa pembatasan termasuk Ekuitas Saldo Awal " + angkaLaporan(neto.ekuitas) + " (lawan saldo awal akun).");
    }
    if (Math.abs(aset.total - akhir) >= 0.005) {
        catatan.push("Perhatian: laporan tidak seimbang, selisih " + angkaLaporan(aset.total - akhir) + ". Periksa jurnal yang total debit dan kreditnya tidak sama.");
    }
    return { isi: buatTabelLaporan({ kolom: ["Jumlah"], baris: baris }), catatan: catatan };
}
