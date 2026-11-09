// ==================== Laporan Perbandingan Anggaran ====================
// PRD 7, dari foto Laba/Rugi Departemen (Perbandingan Anggaran) Accurate. Tiga kartu berisi sama: per Divisi, per Program, dan Umum.
// Kolom: Aktual (dari jurnal) | Anggaran (sudah termasuk Transfer Anggaran) | Selisih (Aktual - Anggaran) | % Selisih.
// Periode dihitung per bulan penuh (kolom perBulan di DAFTAR_LAPORAN, fitur/laporan/kertas.js), karena anggaran dibuat per bulan.
// Aktual mengikuti aturan Penggunaan di Monitor: Umum menghitung semua jurnal, Per Divisi/Program hanya jurnal Divisi/Program itu.
// Memakai alat bersama: fitur/laporan/hitung.js, pohon.js, fitur/anggaran/hitung.js, dan aturan tipe akun Penghasilan Komprehensif.

var KOLOM_PERBANDINGAN_ANGGARAN = ["Aktual", "Anggaran", "Selisih", "% Selisih"];

// Selisih dibagi Anggaran, dibulatkan. Anggaran 0: 100 % kalau ada Aktual, 0 % kalau tidak ada (seperti foto).
// n = [aktual, anggaran, selisih]
function persenSelisihAnggaran(n) {
    // Dibulatkan dari nilai mutlaknya, supaya -12,5 menjadi -13 sama seperti 12,5 menjadi 13
    if (Math.abs(n[1]) >= 0.005) { return Math.sign(n[2]) * Math.round(Math.abs(n[2]) / Math.abs(n[1]) * 100); }
    return Math.abs(n[0]) >= 0.005 ? 100 : 0;
}

function teksPersenSelisih(n) {
    return (n < 0 ? "-" : "") + formatAngka(Math.abs(n)) + " %";
}

// per = "" (Umum) | "divisi" | "program"
function angkaPerbandinganAnggaran(param, per, perId) {
    var dipilih = per === "divisi" ? param.divisi : (per === "program" ? param.program : []);
    var tipe = per || "umum";
    var kunci = per === "divisi" ? "divisiId" : "programId";
    var awal = param.dari.slice(0, 7), akhir = param.sampai.slice(0, 7);
    var rencana = rencanaPerAkunAnggaran(function (tipeData, kelompokId, bulan, tahun) {
        var bulanData = tahun + "-" + String(bulan).padStart(2, "0");
        return tipeData === tipe && bulanData >= awal && bulanData <= akhir
            && (tipe === "umum" || !dipilih.length || dipilih.indexOf(kelompokId) !== -1);
    });
    var aktual = Object.create(null);
    telusuriJurnalLaporan({ perId: perId, dari: param.dari, sampai: param.sampai }, function (r, akun) {
        if (!akunPenghasilan(akun)) { return; }
        if (per) {
            var milik = teksAman(r[kunci]);
            if (dipilih.length ? dipilih.indexOf(milik) === -1 : milik === "") { return; }
        }
        var id = teksAman(akun.id);
        aktual[id] = (aktual[id] || 0) + (TIPE_PENERIMAAN_LPK[akun.tipe] ? 1 : -1) * selisihKreditDebit(r);
    });
    return { rencana: rencana, aktual: aktual };
}

function gambarPerbandinganAnggaran(param, per) {
    var daftarAkun = bacaDaftarAkun();
    var perId = petaAkunLaporan(daftarAkun);
    var h = angkaPerbandinganAnggaran(param, per, perId);
    if (Object.keys(h.rencana).length === 0 && Object.keys(h.aktual).length === 0) {
        return { isi: pesanKosongLaporan("Belum ada transaksi atau anggaran pada periode dan filter ini.") };
    }
    function bagian(judul, tipe, namaTotal) {
        return bagianAkunLaporan({
            akun: daftarAkun, kolom: 3, param: param, lewati: akunTeratasSamaBagian, indukBerangka: true,
            tipe: tipe, judul: judul, namaTotal: namaTotal,
            nilai: function (id) {
                var aktual = h.aktual[id] || 0, rencana = h.rencana[id] || 0;
                return [aktual, rencana, aktual - rencana];
            }
        });
    }
    var penerimaan = bagian("PENERIMAAN", TIPE_PENERIMAAN_LPK, "JUMLAH PENERIMAAN");
    var beban = bagian("BEBAN", TIPE_BEBAN_LPK, "JUMLAH BEBAN");
    var surplus = penerimaan.total.map(function (n, i) { return n - beban.total[i]; });
    // % Selisih tidak bisa dijumlahkan, jadi dihitung sesudah pohon akun menjumlahkan tiga kolom pertama
    var baris = penerimaan.baris.concat(beban.baris, [{ jenis: "akhir", nama: "SURPLUS (DEFISIT)", nilai: surplus }]).map(function (b) {
        return b.nilai ? Object.assign({}, b, { nilai: b.nilai.concat([persenSelisihAnggaran(b.nilai)]) }) : b;
    });
    return { isi: buatTabelLaporan({ kolom: KOLOM_PERBANDINGAN_ANGGARAN, baris: baris, formatKolom: { 3: teksPersenSelisih } }) };
}
