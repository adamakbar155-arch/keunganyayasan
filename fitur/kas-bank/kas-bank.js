// ==================== Kas & Bank: popup menu ====================
// Berisi: popup Kas & Bank (ikon Kas di menu samping). Setiap kotak di popup membuka fitur di foldernya sendiri:
//   Pembayaran -> fitur/pembayaran/pembayaran.js (bukaPembayaranBaru)
//   Penerimaan -> fitur/penerimaan/penerimaan.js (bukaPenerimaanBaru)
//   Transfer Bank -> fitur/transfer/transfer.js (bukaTransferBaru)
//   Histori Bank -> fitur/histori-bank/histori-bank.js (bukaHistoriBank)
//   Rekonsiliasi Bank -> fitur/rekonsiliasi-bank/rekonsiliasi-bank.js (bukaRekonsiliasiBank)
// Fitur baru ditambahkan di daftar bawah ini setelah dibuat di folder sendiri. Kotak yang belum ada di daftar ini
// memberi tahu "belum tersedia".
// HTML popup ada di umum/tampilan-popup.js. Fungsi tujuan baru dipanggil saat kotak diklik, jadi file ini boleh
// dimuat sebelum atau sesudah file fiturnya.
// Semua nama (var dan function) di sini tetap bisa dipakai skrip lain, karena skrip biasa berbagi satu ruang nama.

// ---------- Popup Kas & Bank (ikon Kas di menu samping) ----------
pasangPopupMenu(document.getElementById("panel-kas"), "tombol-kas", "tutup-kas", {
    "Pembayaran": function () { bukaPembayaranBaru(); },
    "Penerimaan": function () { bukaPenerimaanBaru(); },
    "Transfer Bank": function () { bukaTransferBaru(); },
    "Histori Bank": function () { bukaHistoriBank(); },
    "Rekonsiliasi Bank": function () { bukaRekonsiliasiBank(); }
});
