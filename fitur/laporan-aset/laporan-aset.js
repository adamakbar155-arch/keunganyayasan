// ==================== Laporan Aset Tetap ====================
// PRD 7: Daftar Aset Tetap (per tanggal s/d), Penyusutan Aset Tetap, dan Aset yang Dilepas (dalam periode). Dihitung dari data aset lewat
// alat bersama fitur/aset-tetap/hitung.js, sama dengan angka di halaman Aset Tetap. Klik baris membuka asetnya.
// Kartunya di DAFTAR_LAPORAN (fitur/laporan/laporan.js).

function urutKodeAset(a, b) {
    return teksAman(a.kode).localeCompare(teksAman(b.kode), "id", { numeric: true });
}

// Aset per nama kategori, urut nama kategori: [{ nama, isi: [...] }]
function kelompokKategoriAsetLaporan(daftar) {
    var perNama = Object.create(null);
    daftar.forEach(function (a) {
        var nama = namaKategoriAset(a.kategoriId);
        (perNama[nama] = perNama[nama] || []).push(a);
    });
    return Object.keys(perNama).sort(function (x, y) { return x.localeCompare(y, "id"); }).map(function (nama) {
        return { nama: nama, isi: perNama[nama].sort(urutKodeAset) };
    });
}

function gambarDaftarAsetTetap(param) {
    // Aset yang sudah dibeli dan belum dilepas pada tanggal s/d
    var daftar = bacaAsetTetap().filter(function (a) {
        var lepas = lepasDariAset(a.id);
        return teksAman(a.tanggalBeli) && teksAman(a.tanggalBeli) <= param.sampai && !(lepas && teksAman(lepas.tanggal) <= param.sampai);
    });
    if (!daftar.length) { return { isi: pesanKosongLaporan("Belum ada aset tetap pada tanggal ini.") }; }
    var bulan = param.sampai.slice(0, 7);
    var baris = [], total = [0, 0, 0];
    kelompokKategoriAsetLaporan(daftar).forEach(function (k) {
        var jumlah = [0, 0, 0];
        baris.push({ jenis: "grup", sel: [k.nama] });
        k.isi.forEach(function (a) {
            var nilai = Number(a.nilai) || 0, susut = penyusutanSampai(a, bulan);
            jumlah[0] += nilai; jumlah[1] += susut; jumlah[2] += nilai - susut;
            baris.push({ saatKlik: function () { bukaAsetTetap(a); }, sel: [teksAman(a.kode), teksAman(a.nama), formatTanggal(teksAman(a.tanggalBeli)), nilai, susut, nilai - susut] });
        });
        baris.push({ jenis: "jumlah", sel: ["Jumlah " + k.nama, "", ""].concat(jumlah) });
        jumlah.forEach(function (n, i) { total[i] += n; });
    });
    baris.push({ jenis: "akhir", sel: ["Total", "", ""].concat(total) });
    return { isi: buatTabelRincian({
        kolom: [{ judul: "Kode", lebar: 90, rapat: true }, { judul: "Nama" }, { judul: "Tanggal Beli", lebar: 100, rapat: true }, { judul: "Nilai Aset", lebar: 118, angka: true },
                { judul: "Sudah Disusutkan", lebar: 118, angka: true }, { judul: "Nilai Buku", lebar: 118, angka: true }],
        baris: baris
    }) };
}

function gambarPenyusutanAsetTetap(param) {
    var awal = param.dari.slice(0, 7), akhir = param.sampai.slice(0, 7);
    var perAset = Object.create(null);
    bacaPenyusutan().forEach(function (p) {
        var bulan = teksAman(p.bulan);
        if (bulan < awal || bulan > akhir) { return; }
        rincianAman(p).forEach(function (r) { perAset[r.asetId] = (perAset[r.asetId] || 0) + (Number(r.nilai) || 0); });
    });
    var daftar = bacaAsetTetap().filter(function (a) { return perAset[a.id]; });
    if (!daftar.length) { return { isi: pesanKosongLaporan("Belum ada penyusutan pada periode ini.") }; }
    var baris = [], total = 0;
    kelompokKategoriAsetLaporan(daftar).forEach(function (k) {
        var jumlah = 0;
        baris.push({ jenis: "grup", sel: [k.nama] });
        k.isi.forEach(function (a) {
            jumlah += perAset[a.id];
            baris.push({ saatKlik: function () { bukaAsetTetap(a); }, sel: [teksAman(a.kode), teksAman(a.nama), perAset[a.id]] });
        });
        baris.push({ jenis: "jumlah", sel: ["Jumlah " + k.nama, "", jumlah] });
        total += jumlah;
    });
    baris.push({ jenis: "akhir", sel: ["Total", "", total] });
    return { isi: buatTabelRincian({
        kolom: [{ judul: "Kode", lebar: 90, rapat: true }, { judul: "Nama" }, { judul: "Penyusutan", lebar: 130, angka: true }],
        baris: baris
    }) };
}

function gambarAsetDilepas(param) {
    var daftar = bacaLepasAset().filter(function (l) { return tanggalDalamRentang(teksAman(l.tanggal), param.dari, param.sampai); })
        .sort(function (a, b) { return teksAman(a.tanggal).localeCompare(teksAman(b.tanggal)); });
    if (!daftar.length) { return { isi: pesanKosongLaporan("Belum ada aset yang dilepas pada periode ini.") }; }
    var total = [0, 0, 0, 0, 0];
    var baris = daftar.map(function (l) {
        var angka = [l.nilaiAset, l.sudahDisusutkan, l.nilaiBuku, l.nilaiJual, l.selisih].map(function (n) { return Number(n) || 0; });
        angka.forEach(function (n, i) { total[i] += n; });
        return { sel: [formatTanggal(teksAman(l.tanggal)), teksAman(l.kodeAset), teksAman(l.namaAset), teksAman(l.alasan)].concat(angka) };
    });
    baris.push({ jenis: "akhir", sel: ["Total", "", "", ""].concat(total) });
    return { isi: buatTabelRincian({
        kolom: [{ judul: "Tanggal", lebar: 92, rapat: true }, { judul: "Kode", lebar: 84, rapat: true }, { judul: "Nama" }, { judul: "Alasan", lebar: 84 },
                { judul: "Nilai Aset", lebar: 104, angka: true }, { judul: "Sudah Disusutkan", lebar: 104, angka: true }, { judul: "Nilai Buku", lebar: 104, angka: true },
                { judul: "Nilai Jual", lebar: 104, angka: true }, { judul: "Untung/Rugi", lebar: 104, angka: true }],
        baris: baris
    }) };
}
