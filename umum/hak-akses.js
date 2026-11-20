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

// ==================== Penerapan hak (J.31) ====================
// Hak SELALU dibaca langsung dari penyimpanan (bukan disimpan di sesi), supaya perubahan oleh Administrator langsung berlaku.
// Administrator = semua hak. Operator = hak grupnya; tanpa grup (atau grupnya sudah dihapus) = tidak ada hak, hanya Dashboard.

// Hak pengguna yang sedang masuk: null = Administrator (semua boleh), atau { kunciMenu: ["aktif", ...] }
function hakSaya() {
    if (adalahAdministrator()) { return null; }
    var p = penggunaSesi();
    var grup = p && p.aksesGrupId ? bacaAksesGrup().find(function (g) { return g.id === p.aksesGrupId; }) : null;
    return grup ? bersihkanHakGrup(grup.hak) : {};
}

// Apakah pengguna yang sedang masuk punya hak ini, misalnya punyaHak("divisi", "buat"). Jenis bawaan: "aktif".
function punyaHak(kunciMenu, jenis) {
    var hak = hakSaya();
    if (hak === null) { return true; }
    return !!hak[kunciMenu] && hak[kunciMenu].indexOf(jenis || "aktif") !== -1;
}

// Kategori laporan (id di DAFTAR_LAPORAN, fitur/laporan/laporan.js) boleh dibuka: centang Aktif menu "laporan-<id>"
function bolehKategoriLaporan(idKategori) { return punyaHak("laporan-" + idKategori, "aktif"); }
function adaLaporanBoleh() {
    return KELOMPOK_HAK_MENU.some(function (k) {
        return k.menu.some(function (m) { return m.kunci.indexOf("laporan-") === 0 && punyaHak(m.kunci, "aktif"); });
    });
}

// Halaman (id tab) yang boleh dibuka Operator. Dipanggil bolehBukaHalaman (umum/sesi.js) sesudah pemeriksaan Administrator.
// Dashboard selalu boleh. Halaman yang tidak ada di daftar menu tidak boleh (aman kalau ada halaman baru yang lupa didaftarkan).
function bolehHalamanOperator(nama) {
    if (nama === "dashboard") { return true; }
    if (nama === "laporan" || nama === "hasil-laporan") { return adaLaporanBoleh(); }
    return !!MENU_HAK[nama] && punyaHak(nama, "aktif");
}

// ----- Buat / Ubah / Hapus (J.31 langkah 2) -----
// Boleh membuat/mengubah/menghapus di satu halaman (kunci menu = id halaman). Centang yang tidak berlaku untuk menu itu
// (misalnya Ubah di Proses Penyusutan) berarti tidak boleh, kecuali Administrator.
function bolehHakHalaman(kunci, jenis) {
    if (adalahAdministrator()) { return true; }
    return !!MENU_HAK[kunci] && MENU_HAK[kunci].hak.indexOf(jenis) !== -1 && punyaHak(kunci, jenis);
}
var PESAN_JENIS_HAK = { buat: "membuat data baru", ubah: "mengubah data", hapus: "menghapus data" };
// Memeriksa hak; kalau tidak boleh, pesan ditampilkan. Hasil true/false.
function periksaHak(kunci, jenis) {
    if (bolehHakHalaman(kunci, jenis)) { return true; }
    tampilkanNotifikasi("Akses Grup Anda tidak mengizinkan " + PESAN_JENIS_HAK[jenis] + " di sini. Hubungi Administrator.", "peringatan");
    return false;
}

// Halaman (id tab) yang sedang tampil; diisi tampilkanTab (umum/inti.js)
var halamanAktif = "dashboard";
// Pengaman kedua untuk SEMUA penyimpanan daftar (modul.simpan, umum/komponen-daftar.js): selain Administrator, menyimpan hanya
// boleh dari halaman yang punya salah satu hak Buat, Ubah, atau Hapus. Penyimpanan ikutan (misalnya jurnal otomatis dari
// Pembayaran, atau akun dari Kategori Donasi) tetap boleh, karena terjadi di halaman yang berhak.
function bolehMenulisSekarang() {
    if (adalahAdministrator()) { return true; }
    return ["buat", "ubah", "hapus"].some(function (j) { return bolehHakHalaman(halamanAktif, j); });
}

// Nama kotak menu di popup (data-halaman) -> kunci menu. Laporan tidak punya kotak menu, jadi tidak ikut
// (namanya juga bisa sama, misalnya "Aset Tetap").
var KUNCI_MENU_DARI_NAMA = {};
Object.keys(MENU_HAK).forEach(function (kunci) {
    if (kunci.indexOf("laporan-") !== 0) { KUNCI_MENU_DARI_NAMA[MENU_HAK[kunci].nama] = kunci; }
});

// Menyembunyikan kotak menu dan ikon menu samping yang tidak boleh dibuka (kelas tanpa-hak, umum/sesi.css).
// Ikon menu samping disembunyikan kalau popupnya tidak berisi satu pun kotak yang boleh. Dipanggil saat aplikasi dimuat,
// setiap popup menu dibuka (umum/inti.js), dan saat data Pengguna/Akses Grup berubah di tab lain (umum/sesi-aplikasi.js).
function terapkanHakMenu() {
    var admin = adalahAdministrator();
    document.querySelectorAll(".kotak-menu[data-halaman]").forEach(function (kotak) {
        var kunci = KUNCI_MENU_DARI_NAMA[kotak.dataset.halaman];
        kotak.classList.toggle("tanpa-hak", !admin && !(kunci && punyaHak(kunci, "aktif")));
    });
    document.querySelectorAll("dialog[id^='panel-']").forEach(function (panel) {
        var tombol = document.getElementById("tombol-" + panel.id.slice(6));
        if (!tombol) { return; }
        tombol.classList.toggle("tanpa-hak", !panel.querySelector(".kotak-menu[data-halaman]:not(.tanpa-hak)"));
    });
    var tombolLaporan = document.getElementById("tombol-laporan");
    if (tombolLaporan) { tombolLaporan.classList.toggle("tanpa-hak", !admin && !adaLaporanBoleh()); }

    // Tombol Buat/Ubah/Hapus (umum/sesi.css):
    //  - tiap halaman <section id="isi-KUNCI"> diberi kelas tanpa-buat / tanpa-ubah / tanpa-hapus;
    //  - <body data-tanpa-hak="buat:favorit hapus:laporan-tersimpan ..."> untuk tombol yang ada di halaman lain
    //    (Simpan Laporan, Tambah ke Favorit, Simpan di editor Desain Cetakan).
    var hak = hakSaya();
    function ada(kunci, jenis) { return hak === null || (!!hak[kunci] && hak[kunci].indexOf(jenis) !== -1); }
    var tanpa = [];
    if (!admin) {
        Object.keys(MENU_HAK).forEach(function (kunci) {
            JENIS_HAK.forEach(function (jenis) { if (!ada(kunci, jenis)) { tanpa.push(jenis + ":" + kunci); } });
        });
    }
    document.body.dataset.tanpaHak = tanpa.join(" ");
    document.querySelectorAll("section.isi-tab[id^='isi-']").forEach(function (seksi) {
        var kunci = seksi.id.slice(4);
        ["buat", "ubah", "hapus"].forEach(function (jenis) {
            var boleh = admin || (!!MENU_HAK[kunci] && MENU_HAK[kunci].hak.indexOf(jenis) !== -1 && ada(kunci, jenis));
            seksi.classList.toggle("tanpa-" + jenis, !boleh);
        });
    });
}
