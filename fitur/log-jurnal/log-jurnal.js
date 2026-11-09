// ==================== Log Aktifitas Jurnal (Buku Besar) ====================
// Daftar semua jurnal, baik Jurnal Umum maupun jurnal otomatis, hanya untuk dilihat (PRD 6.4, dari foto Accurate).
// Membaca kunci yang sama dengan Jurnal Umum; halaman ini tidak pernah menyimpan. Klik baris membuka transaksi asalnya.
// Memakai buatModulDaftar (cari, urut, jumlah data, unduh, cetak, pilih kolom), asalJurnalOtomatis, dan bukaAsalJurnal.
// HTML: fitur/log-jurnal/tampilan.js. Dimuat sesudah fitur/jurnal/jurnal.js.

var modulLogJurnal = buatModulDaftar({
    id: "log-jurnal",
    judul: "Log Aktifitas Jurnal",
    kunci: "daftarJurnal",
    hanyaDaftar: true,
    pilihKolom: true,
    urutAwal: { kolom: "tanggal", arah: -1 },
    pesanKosong: "Belum ada jurnal.",
    kolom: [
        { kunci: "tanggal", judul: "Tanggal", tampil: function (j) { return formatTanggal(teksAman(j.tanggal)); },
          // Urut menurut tanggal sebenarnya; nomor jurnal menjadi pembeda jurnal bertanggal sama
          urut: function (j) { return teksAman(j.tanggal) + "|" + teksAman(j.noJurnal); } },
        { kunci: "nomor", judul: "Nomor #", tampil: function (j) { return teksAman(j.noJurnal); } },   // nomor jurnal JV (PRD 6.4)
        { kunci: "noTrans", judul: "No. Trans #", tampil: function (j) { return teksAman(j.nomor); } },
        { kunci: "tipe", judul: "Tipe Transaksi", tampil: function (j) { return asalJurnalOtomatis(j) || "Jurnal Umum"; } }
    ],
    saatKlikBaris: function (j) {
        if (!bukaAsalJurnal(j)) { tampilkanNotifikasi("Transaksi asal jurnal ini sudah tidak ada.", "peringatan"); }
    }
});

// Jurnal berubah di halaman lain, jadi muat ulang setiap kali tab ini dibuka
saatTabDibuka["log-jurnal"] = function () {
    lengkapiNomorJurnal();
    modulLogJurnal.gambarTabel();
};

// Dipanggil dari popup Buku Besar, kotak Log Aktifitas Jurnal
function bukaLogJurnal() {
    bukaTab("log-jurnal");
}
