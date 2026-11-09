// ==================== Laporan: hitungan bersama ====================
// Dipakai laporan-laporan di fitur/<laporan>/ (PRD 7), supaya aturan yang sama tidak ditulis dua kali. Semua dihitung dari
// buku jurnal dan saldo awal di data akun, tidak ada yang disimpan terpisah. Data rusak dilewati, tidak membuat macet.

var TIPE_ASET_NETO_LAPORAN = { "modal": true, "pendapatan": true, "pendapatan-lain": true, "beban": true, "beban-lain": true };

// Akun menurut id. Tanpa prototipe: id rusak seperti "constructor" tetap kunci biasa.
function petaAkunLaporan(daftarAkun) {
    var peta = Object.create(null);
    daftarAkun.forEach(function (a) { if (a && teksAman(a.id) !== "") { peta[teksAman(a.id)] = a; } });
    return peta;
}

// Apakah tanggal jurnal masuk rentang. dari/sampai kosong = tidak dibatasi. Tanggal rusak tidak pernah masuk.
function tanggalDalamRentang(tanggal, dari, sampai) {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(tanggal)) { return false; }
    return (!dari || tanggal >= dari) && (!sampai || tanggal <= sampai);
}

// Menjalankan tiap(baris, akun, jurnal, tanggal) untuk setiap baris jurnal yang akunnya ada dan cocok dengan saringan:
//   o = { perId, dari, sampai, divisi: [id], program: [id], akun: [id] } (semua saringan boleh kosong)
function telusuriJurnalLaporan(o, tiap) {
    bacaJurnalMentah().forEach(function (j) {
        var tanggal = teksAman(j.tanggal);
        if (!tanggalDalamRentang(tanggal, o.dari, o.sampai)) { return; }
        rincianAman(j).forEach(function (r) {
            var id = teksAman(r.akunId);
            var akun = o.perId[id];
            if (!akun) { return; }
            if (o.divisi && o.divisi.length && o.divisi.indexOf(teksAman(r.divisiId)) === -1) { return; }
            if (o.program && o.program.length && o.program.indexOf(teksAman(r.programId)) === -1) { return; }
            if (o.akun && o.akun.length && o.akun.indexOf(id) === -1) { return; }
            tiap(r, akun, j, tanggal);
        });
    });
}

function selisihKreditDebit(r) {
    return (Number(r.kredit) || 0) - (Number(r.debit) || 0);
}

// Saldo tiap akun sampai suatu tanggal menurut sisi normalnya: { idAkun: saldo } = saldo awal + jurnal (PRD 7; sama dengan
// Histori Akun). Hanya saldo akun itu sendiri, tanpa sub akunnya.
function saldoAkunPer(tanggal, perId) {
    var saldo = Object.create(null);
    Object.keys(perId).forEach(function (id) { saldo[id] = Number(perId[id].saldoAwal) || 0; });
    telusuriJurnalLaporan({ perId: perId, sampai: tanggal }, function (r, akun) {
        var nilai = selisihKreditDebit(r);
        saldo[teksAman(akun.id)] += tipeSaldoDebit[akun.tipe] ? -nilai : nilai;
    });
    return saldo;
}

// Lawan saldo awal (PRD 4.2, 7): saldo awal aset dan beban dikurangi saldo awal akun bersisi kredit.
function ekuitasSaldoAwal(perId) {
    return Object.keys(perId).reduce(function (n, id) {
        var a = perId[id];
        return n + (tipeSaldoDebit[a.tipe] ? 1 : -1) * (Number(a.saldoAwal) || 0);
    }, 0);
}

// Aset neto sampai suatu tanggal: { dengan, tanpa, ekuitas }. Tanpa Tutup Buku, aset neto = semua baris akun modal,
// pendapatan, dan beban sampai tanggal itu, dipilah menurut tanda Terikat. Saldo awal akun modal mengikuti akun Aset Neto
// di Preferensi; Ekuitas Saldo Awal masuk Tanpa pembatasan.
function posisiAsetNeto(tanggal, perId) {
    var hasil = { dengan: 0, tanpa: 0, ekuitas: ekuitasSaldoAwal(perId) };
    var terikat = akunAsetNeto("terikat");
    Object.keys(perId).forEach(function (id) {
        var a = perId[id], awal = Number(a.saldoAwal) || 0;
        if (!TIPE_ASET_NETO_LAPORAN[a.tipe] || !awal) { return; }
        var nilai = tipeSaldoDebit[a.tipe] ? -awal : awal;
        if (terikat && terikat.id === id) { hasil.dengan += nilai; } else { hasil.tanpa += nilai; }
    });
    telusuriJurnalLaporan({ perId: perId, sampai: tanggal }, function (r, akun) {
        if (!TIPE_ASET_NETO_LAPORAN[akun.tipe]) { return; }
        if (r.terikat === true) { hasil.dengan += selisihKreditDebit(r); } else { hasil.tanpa += selisihKreditDebit(r); }
    });
    hasil.tanpa += hasil.ekuitas;
    return hasil;
}

// Jumlah Pemindahan Dana pada periode: [angka per kolom] + kolom terakhir = jumlah semua.
//   kolomDari(baris) -> nomor kolom, atau -1 kalau baris itu tidak masuk kolom mana pun
// Hanya baris akun modal jurnal Pemindahan Dana; baris Kas/Bank-nya bukan perubahan kepemilikan dana.
function jumlahPemindahanDana(o, kolomDari, jumlahKolom) {
    var hasil = [];
    for (var i = 0; i < jumlahKolom; i++) { hasil.push(0); }
    telusuriJurnalLaporan(o, function (r, akun, j) {
        if (akun.tipe !== "modal" || !j.sumber || j.sumber.jenis !== SUMBER_JURNAL_PEMINDAHAN) { return; }
        var k = kolomDari(r);
        if (k === -1) { return; }
        hasil[k] += selisihKreditDebit(r);
        hasil[jumlahKolom - 1] += selisihKreditDebit(r);
    });
    return hasil;
}

// Akun teratas bertipe Pendapatan dan Beban tidak ditulis karena sama dengan judul bagian (PRD 7, Pilihan 1)
function akunTeratasSamaBagian(a) {
    return a.tipe === "pendapatan" || a.tipe === "beban";
}

// Satu bagian laporan berakun: judul bagian, baris akun, dan baris total. Hasil { baris, total: [per kolom] }.
//   o = { akun, param, kolom, tipe: { tipeAkun: true }, nilai, lewati, judul, namaTotal } (lihat susunBarisAkun)
// Judul bagian hanya kalau ada baris akun di bawahnya (Hanya Tampilkan Total: tinggal baris totalnya).
function bagianAkunLaporan(o) {
    var h = susunBarisAkun({
        akun: o.akun, kolom: o.kolom, param: o.param, lewati: o.lewati, nilai: o.nilai, indukBerangka: o.indukBerangka,
        masuk: function (a) { return !!o.tipe[a.tipe]; }
    });
    var baris = h.baris.length ? [{ jenis: "bagian", nama: o.judul }].concat(h.baris) : [];
    return { baris: baris.concat([{ jenis: "total", nama: o.namaTotal, nilai: h.total, akunIds: h.akunIds }]), total: h.total };
}

// Pilihan kelompok: nama Divisi dari id; yang sudah dihapus tetap tampil
function namaDivisiLaporan(id) {
    return teksAman(namaDivisiDari(id)) || "(Divisi sudah dihapus)";
}

// Saringan klik baris untuk satu akun (fitur/laporan/rincian-baris.js)
function saringSatuAkun(a) {
    return function (r) { return teksAman(r.akunId) === teksAman(a.id); };
}

// Kolom: nama akun dengan kode, untuk laporan rincian
function namaAkunLaporan(akun) {
    return teksAman(akun.kode) + " " + teksAman(akun.nama);
}

// Baris jurnal diurutkan tanggal lalu nomor, untuk laporan rincian
function urutTanggalNomor(a, b) {
    return (a.tanggal + a.nomor).localeCompare(b.tanggal + b.nomor, "id", { numeric: true });
}
