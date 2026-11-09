// ==================== Histori Akun (Buku Besar) ====================
// Riwayat transaksi satu akun dengan saldo berjalan (PRD 6.4, dari foto Accurate). Pilihan akunnya Kas & Bank tingkat 3
// (keputusan 2026-10-26), sama dengan Histori Bank. Cara kerjanya memakai komponen bersama halaman histori
// (umum/komponen-histori.js): Saldo Awal, Total, tombol ⇄ Mutasi/Debit-Kredit, klik baris membuka transaksi asal, ekspor CSV.
// Bedanya dengan Histori Bank: tanpa kolom No Cek dan tanpa ceklis rekonsiliasi.
// HTML-nya: fitur/histori-akun/tampilan.js. Gaya: umum/histori.css. Dimuat sesudah fitur/jurnal/jurnal.js.
// Semua nama (var dan function) di sini tetap bisa dipakai skrip lain, karena skrip biasa berbagi satu ruang nama.

buatHalamanHistori({
    id: "histori-akun", judul: "Histori Akun", noCek: false, ceklis: false, namaBerkas: "histori-akun.csv"
});

// Dipanggil dari popup Buku Besar, kotak Histori Akun
function bukaHistoriAkun() {
    bukaTab("histori-akun");
}
