// ==================== Tampilan: Kas & Bank: Penerimaan (halaman, popup Rincian Penerimaan) ====================
// HTML Penerimaan dibuat dari cetakan bersama transaksi Kas/Bank (umum/tampilan-transaksi-kas.js), yang juga dipakai
// Pembayaran. Di sini hanya pengaturannya (dari foto Accurate, PRD 6.3). Logikanya: fitur/penerimaan/penerimaan.js.

pasangTampilanTransaksiKas({
    id: "terima", idPopup: "rterima",
    judul: "Penerimaan",
    arahUang: "uang masuk ke Kas/Bank selain donasi",
    labelPihak: "Pemberi", kunciPihak: "pemberi",
    labelUntuk: "Atas Penerimaan",
    barisGaji: false
});
