// ==================== Pembayaran (Kas & Bank) ====================
// Pembayaran = uang keluar dari Kas/Bank. Formulir, rincian, simpan/ubah/hapus, dan jurnal otomatis (Debit akun tiap baris,
// Kredit Kas/Bank; PRD 4.2) dibuat oleh komponen bersama umum/komponen-transaksi-kas.js (dipakai juga oleh Penerimaan).
// File ini hanya berisi pengaturan Pembayaran dan bagian khusus gaji: baris Beban Gaji yang tertaut ke Pencatatan Gaji
// (PRD 3.3), pemeriksaan "tidak melebihi sisa gaji", dan Pembayaran gaji yang dibuka dari Proses > Gaji.
// HTML-nya: fitur/pembayaran/tampilan.js (memakai cetakan umum/tampilan-transaksi-kas.js). Gaya khusus gaji:
// fitur/pembayaran/pembayaran.css. Popup menu Kas & Bank (yang membuka halaman ini): fitur/kas-bank/kas-bank.js.
// Dimuat sesudah fitur/gaji/gaji.js (memakai modulPgaji) dan fitur/jurnal/jurnal.js.
// Semua nama (var dan function) di sini tetap bisa dipakai skrip lain, karena skrip biasa berbagi satu ruang nama.

// Baris gaji (PRD 3.3): pencatatannya harus masih ada, dan semua pembayaran untuk satu pencatatan tidak boleh melebihi
// gaji dibayarkan. idBayar = pembayaran yang sedang diubah (pembayarannya sendiri tidak dihitung dua kali).
// Mengembalikan pesan kesalahan, atau "" kalau benar.
function galatBarisGajiBayar(baris, idBayar) {
    var perGaji = {};
    baris.forEach(function (b) { if (b.gajiId) { perGaji[b.gajiId] = (perGaji[b.gajiId] || 0) + (Number(b.nilai) || 0); } });
    var pesan = "";
    Object.keys(perGaji).some(function (idGaji) {
        var gaji = modulPgaji.ambil().find(function (g) { return g.id === idGaji; });
        if (!gaji) { pesan = "Pencatatan Gaji untuk salah satu baris sudah dihapus. Hapus baris itu dulu."; return true; }
        var lain = 0;
        modulBayar.ambil().forEach(function (bayar) {
            if (bayar.id === idBayar) { return; }
            rincianAman(bayar).forEach(function (b) { if (b.gajiId === idGaji) { lain += Number(b.nilai) || 0; } });
        });
        var sisa = (Number(gaji.totalDibayarkan) || 0) - lain;
        if (perGaji[idGaji] > sisa) {
            pesan = "Pembayaran gaji " + teksAman(gaji.nomor) + " melebihi sisa yang belum dibayar (sisa Rp " + formatAngka(Math.max(0, sisa)) + ").";
            return true;
        }
        return false;
    });
    return pesan;
}

// Popup baris: kolom Pencatatan Gaji (hanya dibaca) tampil hanya untuk baris gaji
function isiInfoBarisGaji(baris) {
    var gajiAsal = (baris && baris.gajiId) ? modulPgaji.ambil().find(function (g) { return g.id === baris.gajiId; }) : null;
    document.getElementById("baris-rbayar-gaji").hidden = !(baris && baris.gajiId);
    document.getElementById("rbayar-gaji").value = gajiAsal ? gajiAsal.nomor + " (" + gajiAsal.periode + ")" : (baris && baris.gajiId ? "(pencatatan sudah dihapus)" : "");
}

var trxBayar = buatTransaksiKas({
    id: "bayar", idPopup: "rbayar",
    judul: "Pembayaran",
    kunci: "daftarPembayaran",
    arah: "keluar",
    kunciPihak: "penerima", labelPihak: "Penerima", kataPihak: "kepada",
    tipeNomor: "pembayaran",
    sumberJurnal: "pembayaran",   // sumber.jenis jurnalnya (komponen mendaftarkannya lewat daftarkanAsalJurnal)
    awalanId: "by",
    periksaRincian: galatBarisGajiBayar,
    isiInfoBaris: isiInfoBarisGaji
});
var modulBayar = trxBayar.modul;   // dipakai Pencatatan Gaji dan pemeriksaan di atas

// Dipanggil dari popup Kas & Bank, kotak Pembayaran
function bukaPembayaranBaru() {
    trxBayar.bukaBaru();
}

// Dipanggil tombol Proses > Gaji di Pencatatan Gaji (PRD 6.2, seperti Accurate): Pembayaran baru dengan Kas/Bank kosong,
// tanggal hari ini, No Bukti otomatis, dan satu baris berakun Beban Gaji senilai sisa gaji, tertaut ke pencatatannya.
// Divisi dan Program dipilih pengguna di Info lainnya popup baris; nilainya boleh diubah (bayar sebagian per Kas Divisi).
// Data Baru Pembayaran yang masih berisi isian lain tidak ditimpa diam-diam: pengguna ditanya dulu (PRD 6.10).
function bukaPembayaranGaji(gaji, akun, nilai) {
    bukaTab("bayar");
    modulBayar.bukaBaruKosong(function () {
        trxBayar.aturBaris([{
            id: buatId("rb"), akunId: akun.id, kode: akun.kode, nama: akun.nama, nilai: nilai,
            divisiId: "", programId: "", terikat: false,   // centang Terikat diisi di Info lainnya (PRD 4.1)
            catatan: "Gaji " + teksAman(gaji.periode) + " (" + teksAman(gaji.nomor) + ")",
            gajiId: gaji.id
        }]);
    });
}
