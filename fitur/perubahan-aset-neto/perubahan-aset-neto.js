// ==================== Laporan Perubahan Aset Neto (Perubahan Modal) ====================
// PRD 7 (draf 2026-11-06, menunggu koreksi pengguna; tugas I.1c). Kolom Dengan | Tanpa pembatasan | Jumlah:
//   Saldo awal (sehari sebelum Dari), Surplus (Defisit), Pemindahan sisa program ke Dana Umum, Perubahan langsung aset
//   neto (Jurnal Umum ke akun modal), Saldo akhir. Dua baris tengah hanya tampil kalau ada angkanya.
// Saldo akhir sama dengan Aset Neto di Laporan Posisi Keuangan pada tanggal s/d.

function gambarPerubahanAsetNeto(param) {
    var perId = petaAkunLaporan(bacaDaftarAkun());
    function tigaKolom(n) { return [n.dengan, n.tanpa, n.dengan + n.tanpa]; }
    var awal = posisiAsetNeto(tanggalSehariSebelum(param.dari), perId);
    var akhir = posisiAsetNeto(param.sampai, perId);
    // Surplus dan pemindahan untuk seluruh yayasan (laporan ini tanpa filter)
    var h = angkaPenghasilanKomprehensif({ dari: param.dari, sampai: param.sampai, divisi: [], program: [], hanyaTotal: true }, "");
    // Akun modal yang berubah bukan lewat Pemindahan Dana
    var langsung = { dengan: 0, tanpa: 0 };
    telusuriJurnalLaporan({ perId: perId, dari: param.dari, sampai: param.sampai }, function (r, akun, j) {
        if (akun.tipe !== "modal" || (j.sumber && j.sumber.jenis === SUMBER_JURNAL_PEMINDAHAN)) { return; }
        if (r.terikat === true) { langsung.dengan += selisihKreditDebit(r); } else { langsung.tanpa += selisihKreditDebit(r); }
    });
    var baris = [{ jenis: "total", nama: "Saldo awal, " + formatTanggal(tanggalSehariSebelum(param.dari)), nilai: tigaKolom(awal) },
                 { jenis: "akun", tingkat: 0, nama: "Surplus (Defisit)", nilai: h.surplus }];
    if (h.pemindahan.some(function (n) { return n !== 0; })) {
        baris.push({ jenis: "akun", tingkat: 0, nama: "Pemindahan sisa program ke Dana Umum", nilai: h.pemindahan });
    }
    if (langsung.dengan !== 0 || langsung.tanpa !== 0) {
        baris.push({ jenis: "akun", tingkat: 0, nama: "Perubahan langsung aset neto", nilai: tigaKolom(langsung) });
    }
    baris.push({ jenis: "akhir", nama: "Saldo akhir, " + formatTanggal(param.sampai), nilai: tigaKolom(akhir) });
    var tanpaIsi = [tigaKolom(awal)[2], tigaKolom(akhir)[2]].every(function (n) { return Math.abs(n) < 0.005; }) && baris.length === 3
        && !h.surplus.some(function (n) { return n !== 0; });
    if (tanpaIsi) { return { isi: pesanKosongLaporan("Belum ada aset neto sampai tanggal ini.") }; }
    return { isi: buatTabelLaporan({ kolom: ["Dengan pembatasan", "Tanpa pembatasan", "Jumlah"], baris: baris }) };
}
