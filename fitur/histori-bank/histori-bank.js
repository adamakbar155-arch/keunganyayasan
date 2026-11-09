// ==================== Histori Bank (Kas & Bank) ====================
// Riwayat transaksi satu akun Kas/Bank dengan saldo berjalan (PRD 6.3, dari foto Accurate).
// Cara kerjanya memakai komponen bersama halaman histori (umum/komponen-histori.js), yang juga dipakai Histori Akun.
// Histori Bank menyalakan kolom No Cek dan kolom # (ceklis rekonsiliasi bank).
// HTML-nya: fitur/histori-bank/tampilan.js. Gaya: umum/histori.css. Dimuat sesudah fitur/jurnal/jurnal.js.
// Semua nama (var dan function) di sini tetap bisa dipakai skrip lain, karena skrip biasa berbagi satu ruang nama.

buatHalamanHistori({
    id: "histori-bank", judul: "Histori Bank", noCek: true, ceklis: true, namaBerkas: "histori-bank.csv"
});

// Dipanggil dari popup Kas & Bank, kotak Histori Bank
function bukaHistoriBank() {
    bukaTab("histori-bank");
}
