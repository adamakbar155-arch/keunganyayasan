// ==================== Daftar menu Hak Akses (PRD 6.14) ====================
// Satu daftar menu dan centang yang berlaku untuk tiap menu, dipakai bersama oleh:
//   - halaman Akses Grup (fitur/akses-grup/akses-grup.js): tabel Hak Akses | Aktif | Buat | Ubah | Hapus | Lihat;
//   - penerapan hak (J.31): menu, tombol, dan Daftar mengikuti hak grup pengguna.
// Kunci menu = id halamannya (tab "tab-KUNCI"), supaya penerapan hak mudah mencocokkannya. Laporan diberi awalan "laporan-".
// Satu grup tersimpan (kunci daftarAksesGrup): { id, nama, pembatasan: "preferensi", hak: { kunciMenu: ["aktif", "buat", ...] } }.
// Semua nama (var dan function) di sini tetap bisa dipakai skrip lain, karena skrip biasa berbagi satu ruang nama.

var JENIS_HAK = ["aktif", "buat", "ubah", "hapus", "lihat"];
var NAMA_HAK = { aktif: "Aktif", buat: "Buat", ubah: "Ubah", hapus: "Hapus", lihat: "Lihat" };

// Kelompok menu (kiri di tab Hak Akses) dan menunya, persis PRD 6.14
var KELOMPOK_HAK_MENU = (function () {
    var SEMUA = JENIS_HAK;
    var AKTIF = ["aktif"];
    function m(kunci, nama, hak) { return { kunci: kunci, nama: nama, hak: hak }; }
    return [
        { nama: "Master Data", menu: [
            m("divisi", "Divisi", SEMUA), m("program", "Program", SEMUA), m("karyawan", "Karyawan", SEMUA), m("gaji", "Gaji/Tunjangan", SEMUA)
        ] },
        { nama: "Buku Besar", menu: [
            m("akun", "Akun Perkiraan", SEMUA), m("jurnal", "Jurnal Umum", SEMUA), m("pgaji", "Pencatatan Gaji", SEMUA),
            m("anggaran", "Anggaran", SEMUA), m("transfer-anggaran", "Transfer Anggaran", SEMUA),
            m("monitor-anggaran", "Monitor Anggaran", AKTIF), m("histori-akun", "Histori Akun", AKTIF), m("log-jurnal", "Log Aktifitas Jurnal", AKTIF)
        ] },
        { nama: "Kas & Bank", menu: [
            m("bayar", "Pembayaran", SEMUA), m("terima", "Penerimaan", SEMUA), m("transfer", "Transfer Bank", SEMUA),
            m("histori-bank", "Histori Bank", AKTIF), m("rekonsiliasi-bank", "Rekonsiliasi Bank", ["aktif", "ubah"])
        ] },
        { nama: "Donasi", menu: [
            m("kategori-donasi", "Kategori Donasi", SEMUA), m("donatur", "Donatur", SEMUA), m("donasi-catat", "Pencatatan Donasi", SEMUA),
            m("target-donasi", "Target Donasi", SEMUA), m("pemindahan-dana", "Pemindahan Dana", SEMUA)
        ] },
        { nama: "Aset Tetap", menu: [
            m("kategori-aset", "Kategori Aset", SEMUA), m("aset-tetap", "Aset Tetap", SEMUA), m("lepas-aset", "Lepas Aset", SEMUA),
            m("penyusutan", "Proses Penyusutan", ["aktif", "buat", "hapus", "lihat"])
        ] },
        { nama: "Laporan", menu: [
            m("laporan-keuangan", "Keuangan", AKTIF), m("laporan-divisi-program", "Divisi & Program", AKTIF), m("laporan-kas-bank", "Kas & Bank", AKTIF),
            m("laporan-donasi", "Donasi", AKTIF), m("laporan-buku-besar", "Buku Besar", AKTIF), m("laporan-aset-tetap", "Aset Tetap", AKTIF),
            m("laporan-tersimpan", "Laporan Tersimpan", ["aktif", "buat", "hapus"])
        ] },
        { nama: "Lainnya", menu: [
            m("penomoran", "Penomoran", ["aktif", "buat", "ubah", "hapus"]), m("cetakan", "Desain Cetakan", ["aktif", "buat", "ubah", "hapus"]),
            m("favorit", "Transaksi Favorit", ["aktif", "buat", "ubah", "hapus"]), m("log", "Log Aktivitas", AKTIF)
        ] }
    ];
})();

// Peta { kunciMenu: { kunci, nama, hak, kelompok } } supaya mudah dicari
var MENU_HAK = {};
KELOMPOK_HAK_MENU.forEach(function (k) {
    k.menu.forEach(function (m) { MENU_HAK[m.kunci] = { kunci: m.kunci, nama: m.nama, hak: m.hak, kelompok: k.nama }; });
});

// Membersihkan hak grup dari penyimpanan atau formulir: hanya menu dan centang yang dikenal, tanpa kembar, dan
// Buat/Ubah/Hapus/Lihat hanya berlaku kalau Aktif dicentang (PRD 6.14). Data rusak menjadi hak kosong.
// Hasil: { kunciMenu: ["aktif", ...] } (menu tanpa centang tidak ditulis), urutan centang mengikuti JENIS_HAK.
function bersihkanHakGrup(hak) {
    var hasil = {};
    if (!hak || typeof hak !== "object" || Array.isArray(hak)) { return hasil; }
    Object.keys(MENU_HAK).forEach(function (kunci) {
        var daftar = Array.isArray(hak[kunci]) ? hak[kunci] : [];
        if (daftar.indexOf("aktif") === -1) { return; }
        hasil[kunci] = JENIS_HAK.filter(function (j) { return MENU_HAK[kunci].hak.indexOf(j) !== -1 && daftar.indexOf(j) !== -1; });
    });
    return hasil;
}

// Hak grup sebagai teks untuk Log Aktivitas, misalnya "Divisi (Aktif, Buat); Program (Aktif)"
function teksHakGrup(hak) {
    var bersih = bersihkanHakGrup(hak);
    var bagian = Object.keys(bersih).map(function (kunci) {
        return MENU_HAK[kunci].kelompok + " - " + MENU_HAK[kunci].nama + " (" + bersih[kunci].map(function (j) { return NAMA_HAK[j]; }).join(", ") + ")";
    });
    return bagian.length ? bagian.join("; ") : "Tidak ada";
}

// Daftar Akses Grup langsung dari penyimpanan (halaman Akses Grup belum tentu dimuat)
function bacaAksesGrup() {
    return bacaDaftarTersimpan("daftarAksesGrup").filter(function (g) { return g && typeof g.id === "string"; });
}

// Nama grup dari id-nya ("" kalau tidak ada / sudah dihapus)
function namaAksesGrup(id) {
    var g = id ? bacaAksesGrup().find(function (x) { return x.id === id; }) : null;
    return g ? teksAman(g.nama) : "";
}
