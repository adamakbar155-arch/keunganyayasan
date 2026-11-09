// ==================== Anggaran: alat dan hitungan bersama ====================
// Dipakai Anggaran, Monitor Anggaran, dan Transfer Anggaran (PRD 6.5), supaya angka Sisa di Monitor dan di Transfer selalu sama.
// Satu pos anggaran = satu akun dalam satu bulan: { tipe, kelompokId, bulan, tahun, akunId }.
// kelompokId = id Divisi/Program; kosong pada Per Divisi/Per Program = semua Divisi/Program tipe itu dijumlah (dipakai Monitor).
// Semua dihitung dari data tersimpan. Data rusak dilewati, tidak membuat macet.

var TIPE_AKUN_ANGGARAN = { "pendapatan": true, "pendapatan-lain": true, "beban": true, "beban-lain": true };
var NAMA_TIPE_ANGGARAN = { "umum": "Umum", "divisi": "Per Divisi", "program": "Per Program" };

// kosong (boleh tidak diisi): tulisan pilihan kosong di awal, misalnya "Silakan Pilih" untuk formulir Data Baru (PRD 5.3a).
// Penyaring laporan (Monitor Anggaran) dan Proses Penyusutan memanggil tanpa kosong, jadi selalu berisi.
function isiPilihanBulanAnggaran(select, kosong) {
    isiPilihan(select, namaBulanKalender, { nilai: function (n) { return String(namaBulanKalender.indexOf(n) + 1); }, teks: function (n) { return n; }, kosong: kosong });
}
function isiPilihanTipeAnggaran(select, kosong) {
    isiPilihan(select, Object.keys(NAMA_TIPE_ANGGARAN), { nilai: function (k) { return k; }, teks: function (k) { return NAMA_TIPE_ANGGARAN[k]; }, kosong: kosong });
}

// Isi pilihan Divisi/Program sesuai Tipe. Program: yang Aktif ditambah Program yang sedang terpilih.
function isiPilihanKelompokAnggaran(select, tipe, terpilih, teksKosong) {
    if (tipe === "divisi") { isiPilihan(select, bacaDivisi(), { kosong: teksKosong || "Pilih Divisi...", terpilih: terpilih }); }
    if (tipe === "program") { isiPilihan(select, daftarProgramPilihan(terpilih), { kosong: teksKosong || "Pilih Program...", terpilih: terpilih }); }
}

// Nama Divisi/Program dari { tipe, kelompokId }; kosong untuk Umum
function namaKelompokAnggaran(d) {
    if (d.tipe === "divisi") { return teksAman(namaDivisiDari(d.kelompokId)) || "(Divisi sudah dihapus)"; }
    if (d.tipe === "program") { return namaProgramDari(d.kelompokId) || "(Program sudah dihapus)"; }
    return "";
}

// Akun yang bisa dianggarkan: akun paling bawah bertipe pendapatan atau beban, tidak Non Aktif
function akunBolehDianggarkan() {
    return akunUntukJurnal().filter(function (a) { return a && TIPE_AKUN_ANGGARAN[a.tipe] && !a.nonAktif; });
}

// Bagian (bulan, tahun, tipe, Divisi/Program) sebuah data cocok dengan pos?
function cocokPeriodeAnggaran(pos, tipe, kelompokId, bulan, tahun) {
    return tipe === pos.tipe && Number(bulan) === Number(pos.bulan) && Number(tahun) === Number(pos.tahun)
        && (pos.tipe === "umum" || !pos.kelompokId || kelompokId === pos.kelompokId);
}

// Anggaran per akun = nilai formulir Anggaran + Transfer masuk - Transfer keluar: { akunId: nilai }.
// cocok = function (tipe, kelompokId, bulan, tahun) -> true kalau bagian itu dihitung. Dipakai Monitor, Transfer, dan laporan.
// idTransferDilewati: transfer yang sedang diubah, supaya nilainya sendiri tidak ikut mengurangi sisa.
function rencanaPerAkunAnggaran(cocok, idTransferDilewati) {
    var hasil = Object.create(null);
    function tambah(akunId, nilai) { hasil[akunId] = (hasil[akunId] || 0) + (Number(nilai) || 0); }
    bacaDaftarTersimpan("daftarAnggaran").forEach(function (d) {
        if (!d || !cocok(d.tipe, d.kelompokId, d.bulan, d.tahun)) { return; }
        rincianAman(d).forEach(function (r) { tambah(r.akunId, r.nilai); });
    });
    bacaDaftarTersimpan("daftarTransferAnggaran").forEach(function (t) {
        if (!t || t.id === idTransferDilewati) { return; }
        if (cocok(t.tipe, t.kelompokKeId, t.bulanKe, t.tahun)) { tambah(t.akunKeId, t.nilai); }
        if (cocok(t.tipe, t.kelompokDariId, t.bulanDari, t.tahun)) { tambah(t.akunDariId, -(Number(t.nilai) || 0)); }
    });
    return hasil;
}

function rencanaPosAnggaran(pos, idTransferDilewati) {
    return rencanaPerAkunAnggaran(function (tipe, kelompokId, bulan, tahun) {
        return cocokPeriodeAnggaran(pos, tipe, kelompokId, bulan, tahun);
    }, idTransferDilewati)[pos.akunId] || 0;
}

// Penggunaan satu pos dari jurnal bulan itu. Akun beban: debit - kredit. Akun pendapatan: kredit - debit.
// Umum menghitung semua jurnal akun itu; Per Divisi dan Per Program hanya jurnal Divisi atau Program itu.
function penggunaanPosAnggaran(pos) {
    var perId = petaAkunLaporan(bacaDaftarAkun());
    var awalBulan = pos.tahun + "-" + String(pos.bulan).padStart(2, "0") + "-";
    var kunci = pos.tipe === "divisi" ? "divisiId" : "programId";
    var total = 0;
    telusuriJurnalLaporan({ perId: perId, dari: awalBulan + "01", sampai: awalBulan + "31", akun: [pos.akunId] }, function (r, akun) {
        if (pos.tipe !== "umum") {
            var milik = teksAman(r[kunci]);
            if (pos.kelompokId ? milik !== pos.kelompokId : milik === "") { return; }
        }
        total += tipeSaldoDebit[akun.tipe] ? -selisihKreditDebit(r) : selisihKreditDebit(r);
    });
    return total;
}

function sisaPosAnggaran(pos, idTransferDilewati) {
    return rencanaPosAnggaran(pos, idTransferDilewati) - penggunaanPosAnggaran(pos);
}

// Id akun yang punya anggaran atau transfer pada satu periode: { tipe, kelompokId, bulan, tahun }
function akunPeriodeAnggaran(periode) {
    var ada = Object.create(null);
    bacaDaftarTersimpan("daftarAnggaran").forEach(function (d) {
        if (!d || !cocokPeriodeAnggaran(periode, d.tipe, d.kelompokId, d.bulan, d.tahun)) { return; }
        rincianAman(d).forEach(function (r) { ada[r.akunId] = true; });
    });
    bacaDaftarTersimpan("daftarTransferAnggaran").forEach(function (t) {
        if (!t) { return; }
        if (cocokPeriodeAnggaran(periode, t.tipe, t.kelompokKeId, t.bulanKe, t.tahun)) { ada[t.akunKeId] = true; }
        if (cocokPeriodeAnggaran(periode, t.tipe, t.kelompokDariId, t.bulanDari, t.tahun)) { ada[t.akunDariId] = true; }
    });
    return ada;
}

// Transfer yang asalnya memakai akun di formulir Anggaran ini (PRD 6.5: formulirnya dijaga supaya Monitor tidak kacau)
function transferAsalAnggaran(d) {
    return bacaDaftarTersimpan("daftarTransferAnggaran").filter(function (t) {
        return t && cocokPeriodeAnggaran({ tipe: d.tipe, kelompokId: d.tipe === "umum" ? "" : d.kelompokId, bulan: d.bulan, tahun: d.tahun }, t.tipe, t.kelompokDariId, t.bulanDari, t.tahun)
            && rincianAman(d).some(function (r) { return r.akunId === t.akunDariId; });
    });
}

// Berapa Anggaran dan Transfer Anggaran memakai Divisi/Program ini
function jumlahAnggaranMemakai(tipe, id) {
    var anggaran = bacaDaftarTersimpan("daftarAnggaran").filter(function (d) { return d && d.tipe === tipe && d.kelompokId === id; }).length;
    var transfer = bacaDaftarTersimpan("daftarTransferAnggaran").filter(function (t) {
        return t && t.tipe === tipe && (t.kelompokDariId === id || t.kelompokKeId === id);
    }).length;
    return anggaran + transfer;
}
