// ==================== Tampilan: Kas & Bank: Pembayaran (halaman, popup Rincian Pembayaran) ====================
// HTML Pembayaran dibuat dari cetakan bersama transaksi Kas/Bank (umum/tampilan-transaksi-kas.js), yang juga dipakai
// Penerimaan. Di sini hanya pengaturannya. Logikanya: fitur/pembayaran/pembayaran.js.

pasangTampilanTransaksiKas({
    id: "bayar", idPopup: "rbayar",
    judul: "Pembayaran",
    arahUang: "uang keluar dari Kas/Bank",
    labelPihak: "Penerima", kunciPihak: "penerima",
    labelUntuk: "Untuk Pembayaran",
    barisGaji: true,   // popup punya kolom Pencatatan Gaji (baris gaji dari Proses > Gaji)
    centangTerikat: true   // popup punya bagian Dana (Terikat / Tidak Terikat) di Info lainnya (PRD 4.1)
});
