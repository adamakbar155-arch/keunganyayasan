// ==================== Donasi: popup menu ====================
// Berisi: popup Donasi (ikon Donasi di menu samping; PRD 6.1, pemilahan dari popup Penjualan Accurate).
// Kotak: Pencatatan Donasi, Pemindahan Dana, Kategori Donasi, Donatur, Target Donasi.
// (Penyaluran Bantuan dan Pengembalian Donasi dihilangkan 2026-10-29: uang keluar dicatat lewat Kas & Bank > Pembayaran.
//  Saklar Pengembalian Donasi di Preferensi > Fitur ikut dihapus, jadi popup ini tidak lagi memeriksa saklar apa pun.)
// Kotak yang fiturnya belum dibuat memberi tahu "belum tersedia" (perilaku bawaan pasangPopupMenu untuk kotak yang
// tidak ada di daftar tujuan). Setiap fitur dibuat di foldernya sendiri, lalu ditambahkan ke daftar tujuan di bawah.
// HTML popup ada di umum/tampilan-popup.js.
// Semua nama (var dan function) di sini tetap bisa dipakai skrip lain, karena skrip biasa berbagi satu ruang nama.

var panelDonasi = document.getElementById("panel-donasi");

pasangPopupMenu(panelDonasi, "tombol-donasi", "tutup-donasi", {
    "Pencatatan Donasi": function () { bukaPencatatanDonasiBaru(); },   // fitur/pencatatan-donasi/pencatatan-donasi.js
    "Kategori Donasi": function () { bukaKategoriDonasiBaru(); },   // fitur/kategori-donasi/kategori-donasi.js
    "Donatur": function () { bukaDonaturBaru(); },                   // fitur/donatur/donatur.js
    "Target Donasi": function () { bukaTargetDonasiBaru(); },       // fitur/target-donasi/target-donasi.js
    "Pemindahan Dana": function () { bukaPemindahanDanaBaru(); }    // fitur/pemindahan-dana/pemindahan-dana.js
});
