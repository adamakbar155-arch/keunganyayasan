// ==================== Penerimaan (Kas & Bank) ====================
// Penerimaan = uang masuk ke Kas/Bank selain donasi (PRD 6.3, dari foto Accurate). Kembaran Pembayaran dengan arah uang
// terbalik: jurnal otomatis Debit Kas/Bank, Kredit akun tiap baris (PRD 4.2). Pendapatan bertanda Program/Divisi ikut
// menambah sisa dana, tetapi dilaporkan sebagai pendapatan lain (PRD 6.0).
// Formulir, rincian, simpan/ubah/hapus, dan jurnalnya dibuat oleh komponen bersama umum/komponen-transaksi-kas.js;
// file ini hanya berisi pengaturan Penerimaan. HTML-nya: fitur/penerimaan/tampilan.js.
// Popup menu Kas & Bank (yang membuka halaman ini): fitur/kas-bank/kas-bank.js.
// Dimuat sesudah fitur/jurnal/jurnal.js.
// Semua nama (var dan function) di sini tetap bisa dipakai skrip lain, karena skrip biasa berbagi satu ruang nama.

var trxTerima = buatTransaksiKas({
    id: "terima", idPopup: "rterima",
    judul: "Penerimaan",
    kunci: "daftarPenerimaan",
    arah: "masuk",
    kunciPihak: "pemberi", labelPihak: "Pemberi", kataPihak: "dari",
    tipeNomor: "penerimaan",
    sumberJurnal: "penerimaan",   // sumber.jenis jurnalnya (komponen mendaftarkannya lewat daftarkanAsalJurnal)
    awalanId: "tm"
});

// Dipanggil dari popup Kas & Bank, kotak Penerimaan
function bukaPenerimaanBaru() {
    trxTerima.bukaBaru();
}
