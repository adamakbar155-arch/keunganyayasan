// ==================== Sesi masuk (PRD 6.12, 6.14) ====================
// Dimuat PALING AWAL di index.html (di <head>) dan juga oleh login.html. Belum masuk, sesinya rusak, penggunanya sudah
// dihapus/Non Aktif, atau 40 menit tanpa aktivitas = pindah ke layar Masuk (login.html), sebelum aplikasi sempat tampil.
// Sesi disimpan di sessionStorage: berlaku per jendela/tab browser dan hilang saat browser ditutup.
// Bentuk sesi: { penggunaId, nama, terakhirAktif: angka waktu (ms), baruMasuk: true/false, lewatKodePemulihan: true/false }
// Jenis Akses TIDAK disimpan di sesi: selalu dibaca dari data Pengguna, supaya perubahan oleh Administrator langsung berlaku.
// CATATAN: tanpa server, sesi ini kunci layar dan pencatat siapa yang bekerja, bukan pengaman penuh (PRD 6.12, Batasan).

var KUNCI_SESI = "sesiMasuk";
var BATAS_DIAM_MS = 40 * 60 * 1000;   // 40 menit tanpa aktivitas = keluar otomatis (keputusan pengguna 2026-11-09)

// Daftar pengguna langsung dari penyimpanan (halaman Pengguna belum tentu dimuat). Data rusak = daftar kosong.
function bacaPenggunaTersimpan() {
    try {
        var daftar = JSON.parse(localStorage.getItem("daftarPengguna") || "[]");
        return Array.isArray(daftar) ? daftar.filter(function (p) { return p && typeof p === "object" && typeof p.id === "string"; }) : [];
    } catch (galat) { return []; }
}

// Jenis Akses pengguna (PRD 6.14): "administrator" atau "operator".
// Data lama yang masih memakai peran (sebelum J.29, misalnya dari cadangan lama): Finance Yayasan = Administrator,
// peran lain (Pengawas, Finance Sekolah, Finance Unit usaha) = Operator.
function jenisAksesPengguna(p) {
    if (p && (p.jenisAkses === "administrator" || p.jenisAkses === "operator")) { return p.jenisAkses; }
    return p && p.peran === "finance-yayasan" ? "administrator" : "operator";
}
var NAMA_JENIS_AKSES = { administrator: "Administrator", operator: "Operator" };

function bacaSesi() {
    try {
        var s = JSON.parse(sessionStorage.getItem(KUNCI_SESI) || "null");
        return s && typeof s === "object" && typeof s.penggunaId === "string" ? s : null;
    } catch (galat) { return null; }
}
function simpanSesi(s) {
    try { sessionStorage.setItem(KUNCI_SESI, JSON.stringify(s)); } catch (galat) { /* sesi tetap di memori halaman ini */ }
}
function hapusSesi() {
    try { sessionStorage.removeItem(KUNCI_SESI); } catch (galat) { /* biarkan */ }
}

// Membuat sesi untuk pengguna yang baru masuk (dipanggil layar Masuk).
// lewatKodePemulihan: masuk sesudah mengatur ulang kata sandi dengan kode pemulihan (dicatat di Log Aktivitas)
function mulaiSesi(pengguna, lewatKodePemulihan) {
    simpanSesi({ penggunaId: pengguna.id, nama: String(pengguna.nama || pengguna.username || ""),
                 terakhirAktif: Date.now(), baruMasuk: true, lewatKodePemulihan: !!lewatKodePemulihan });
}

// Sesi yang sah: ada, penggunanya masih ada dan aktif, belum wajib ganti sandi, dan belum 40 menit tanpa aktivitas.
// Mengembalikan "" kalau sah, atau alasan: "belum", "diam", "akun".
function alasanSesiTidakSah() {
    var s = bacaSesi();
    if (!s) { return "belum"; }
    if (!(Date.now() - Number(s.terakhirAktif) < BATAS_DIAM_MS)) { return "diam"; }
    var p = bacaPenggunaTersimpan().find(function (x) { return x.id === s.penggunaId; });
    if (!p || p.nonAktif || p.wajibGantiSandi) { return "akun"; }
    return "";
}

// Pindah ke layar Masuk; alasan ditulis di alamat supaya layar Masuk bisa menjelaskannya
function keLayarMasuk(alasan) {
    hapusSesi();
    location.replace("login.html" + (alasan ? "?alasan=" + encodeURIComponent(alasan) : ""));
}

// Data pengguna yang sedang masuk (null kalau belum masuk atau akunnya sudah tidak ada)
function penggunaSesi() {
    var s = bacaSesi();
    return s ? (bacaPenggunaTersimpan().find(function (x) { return x.id === s.penggunaId; }) || null) : null;
}
function adalahAdministrator() {
    var p = penggunaSesi();
    return !!p && jenisAksesPengguna(p) === "administrator";
}
// Hanya Administrator yang boleh mengubah data. Operator sementara hanya melihat, sampai hak Akses Grup berlaku (J.31).
// Belum masuk atau akun tidak dikenal juga hanya melihat (aman).
function hanyaLihat() { return !adalahAdministrator(); }
// Halaman yang hanya boleh dibuka Administrator (PRD 6.14): id tab "pengguna", "preferensi", "cadangan"
var HALAMAN_ADMINISTRATOR = ["pengguna", "preferensi", "cadangan"];
function bolehBukaHalaman(nama) { return HALAMAN_ADMINISTRATOR.indexOf(nama) === -1 || adalahAdministrator(); }

// Di index.html: periksa sesi sebelum apa pun tampil. Halaman disembunyikan dulu (kelas belum-masuk, umum/dasar.css)
// supaya isi aplikasi tidak sempat terlihat sebelum pindah.
if (!/login\.html$/i.test(location.pathname)) {
    var alasanTolakSesi = alasanSesiTidakSah();
    if (alasanTolakSesi) {
        document.documentElement.classList.add("belum-masuk");
        keLayarMasuk(alasanTolakSesi === "diam" ? "diam" : "");
    }
}
