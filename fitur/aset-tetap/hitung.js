// ==================== Aset Tetap: alat dan hitungan bersama ====================
// Dipakai Aset Tetap, Kategori Aset, Proses Penyusutan, Lepas Aset, dan Laporan Aset Tetap (PRD 6.6), supaya angka penyusutan dan
// Nilai Buku selalu sama di semua halaman. Dihitung dari data tersimpan; data rusak dilewati, tidak membuat macet.

function bacaAsetTetap() { return bacaDaftarTersimpan("daftarAsetTetap").filter(Boolean); }
function bacaKategoriAset() { return bacaDaftarTersimpan("daftarKategoriAset").filter(Boolean); }
function bacaPenyusutan() { return bacaDaftarTersimpan("daftarPenyusutan").filter(Boolean); }
function bacaLepasAset() { return bacaDaftarTersimpan("daftarLepasAset").filter(Boolean); }

function kategoriAsetDari(id) {
    return bacaKategoriAset().find(function (k) { return k.id === id; }) || null;
}
function namaKategoriAset(id) {
    var k = kategoriAsetDari(id);
    return k ? teksAman(k.nama) : "(Kategori sudah dihapus)";
}
function lepasDariAset(asetId) {
    return bacaLepasAset().find(function (l) { return l.asetId === asetId; }) || null;
}
function teksRupiahAwal(n) { return formatRupiah(Number(n) || 0); }

// Penyusutan satu aset: nilai sudah disusutkan sebelum memakai aplikasi + proses penyusutan.
// sampaiBulan ("2026-10", boleh kosong) = hanya sampai bulan itu.
function penyusutanSampai(aset, sampaiBulan) {
    return bacaPenyusutan().reduce(function (total, p) {
        if (sampaiBulan && teksAman(p.bulan) > sampaiBulan) { return total; }
        return rincianAman(p).reduce(function (n, r) { return r.asetId === aset.id ? n + (Number(r.nilai) || 0) : n; }, total);
    }, Number(aset.sudahDisusutkan) || 0);
}

// Akhir bulan yang tanggalnya valid untuk jurnal: "2026-02" -> "2026-02-28"
function akhirBulanAset(bulan) {
    var b = bulan.split("-");
    return bulan + "-" + String(new Date(Number(b[0]), Number(b[1]), 0).getDate()).padStart(2, "0");
}

// Penyusutan per bulan: garis lurus, dibulatkan ke atas supaya habis tepat pada akhir umurnya
function penyusutanPerBulan(aset) {
    var umur = Number(aset.umurBulan) || 0;
    if (aset.tidakDisusutkan === true || umur <= 0) { return 0; }
    return Math.ceil(Math.max((Number(aset.nilai) || 0) - (Number(aset.nilaiSisa) || 0), 0) / umur);
}

// Sisa yang masih bisa disusutkan
function sisaBisaDisusutkan(aset) {
    return Math.max((Number(aset.nilai) || 0) - (Number(aset.nilaiSisa) || 0) - penyusutanSampai(aset), 0);
}

function statusAset(aset) {
    if (lepasDariAset(aset.id)) { return "Dilepas"; }
    if (aset.tidakDisusutkan === true) { return "Tidak disusutkan"; }
    return sisaBisaDisusutkan(aset) <= 0 ? "Habis disusutkan" : "Aktif";
}

// Baris penyusutan satu bulan: aset yang sudah dipakai, belum dilepas, dan masih punya sisa
function barisPenyusutanBulan(bulan) {
    var baris = [];
    bacaAsetTetap().forEach(function (a) {
        if (teksAman(a.tanggalPakai).slice(0, 7) > bulan || !teksAman(a.tanggalPakai)) { return; }
        var lepas = lepasDariAset(a.id);
        if (lepas && teksAman(lepas.tanggal).slice(0, 7) <= bulan) { return; }
        var nilai = Math.min(penyusutanPerBulan(a), sisaBisaDisusutkan(a));
        if (nilai > 0) { baris.push({ asetId: a.id, kode: teksAman(a.kode), nama: teksAman(a.nama), kategoriId: teksAman(a.kategoriId), nilai: nilai }); }
    });
    return baris.sort(function (x, y) { return x.kode.localeCompare(y.kode, "id", { numeric: true }); });
}

function asetSudahDisusutkanProses(asetId) {
    return bacaPenyusutan().some(function (p) { return rincianAman(p).some(function (r) { return r.asetId === asetId; }); });
}

// Berapa kategori memakai akun ini (Akun Perkiraan menolak penghapusannya)
function kategoriAsetMemakaiAkun(akunId) {
    return bacaKategoriAset().some(function (k) { return k.akunAsetId === akunId || k.akunAkumulasiId === akunId || k.akunBebanId === akunId; });
}

// Cek kecocokan dengan Neraca (PRD 6.6): { daftar, saldo } atau null kalau belum ada kategori
function cekKecocokanAset() {
    var kategori = bacaKategoriAset();
    if (kategori.length === 0) { return null; }
    var perId = petaAkunLaporan(bacaDaftarAkun());
    var saldo = saldoAkunPer(tanggalHariIni(), perId);
    var sudah = Object.create(null), jumlahSaldo = 0;
    kategori.forEach(function (k) {
        var id = teksAman(k.akunAsetId);
        if (perId[id] && !sudah[id]) { sudah[id] = true; jumlahSaldo += saldo[id] || 0; }
    });
    var jumlahDaftar = bacaAsetTetap().reduce(function (n, a) { return lepasDariAset(a.id) ? n : n + (Number(a.nilai) || 0); }, 0);
    return { daftar: jumlahDaftar, saldo: jumlahSaldo };
}
