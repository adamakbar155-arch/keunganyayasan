// ==================== Pintasan keyboard (PRD 6.11, tugas J.24) ====================
// Disetujui pengguna 2026-11-09 (tidak ada foto Accurate, dirancang bersama):
//   Ctrl+S Simpan · Alt+N Data Baru · Alt+D Daftar/Formulir · Alt+W tutup tab kecil · Ctrl+P Cetak · Alt+L Lampiran
//   Esc tutup popup (bawaan popup) · F1 daftar pintasan. Tidak ada pintasan Hapus (supaya tidak terhapus tidak sengaja).
// Ctrl+N, Ctrl+T, Ctrl+W dikunci browser, jadi fungsi serupa memakai Alt.
// Cara kerja: pintasan hanya "menekan" tombol yang sudah ada di halaman yang sedang tampil, jadi aturannya (pemeriksaan,
// peringatan, konfirmasi) tetap sama persis dengan klik mouse. Tombol yang tidak ada atau tidak aktif: tidak terjadi apa-apa.
// Saat popup, Halaman Cetak, atau editor Desain Cetakan terbuka, pintasan tidak bekerja (editor punya pintasan sendiri;
// di sana Ctrl+S menekan tombol Simpan editor).

var dialogPintasan = document.getElementById("dialog-pintasan");

// Halaman (bagian isi) yang sedang tampil, misalnya <section id="isi-bayar">
function halamanAktifPintasan() {
    return document.querySelector("main.isi > section.isi-tab:not([hidden])");
}

// Tombol yang benar-benar terlihat dan aktif di dalam wadah
function tombolTerlihat(wadah, pemilih) {
    if (!wadah) { return null; }
    return Array.prototype.find.call(wadah.querySelectorAll(pemilih), function (t) {
        return !t.disabled && !t.hidden && t.getClientRects().length > 0;
    }) || null;
}

// Seperti klik mouse: kolom yang sedang diketik dilepas dulu, supaya isiannya "selesai" (kejadian change berjalan),
// baru tombolnya ditekan
function tekanTombol(tombol) {
    if (!tombol) { return; }
    if (document.activeElement && document.activeElement !== document.body && document.activeElement.blur) { document.activeElement.blur(); }
    tombol.click();
}

function bukaDaftarPintasan() { if (!dialogPintasan.open) { dialogPintasan.showModal(); } }

// Satu pintasan dari kejadian keyboard: "simpan", "baru", "daftar", "tutup-tab", "cetak", "lampiran", "bantuan", atau ""
function namaPintasan(k) {
    if (k.code === "F1" && !k.ctrlKey && !k.altKey && !k.metaKey) { return "bantuan"; }
    var ctrl = (k.ctrlKey || k.metaKey) && !k.altKey && !k.shiftKey;
    var alt = k.altKey && !k.ctrlKey && !k.metaKey && !k.shiftKey;   // AltGr (Ctrl+Alt) tidak dihitung
    if (ctrl && k.code === "KeyS") { return "simpan"; }
    if (ctrl && k.code === "KeyP") { return "cetak"; }
    if (alt) { return ({ KeyN: "baru", KeyD: "daftar", KeyW: "tutup-tab", KeyL: "lampiran" })[k.code] || ""; }
    return "";
}

function jalankanPintasan(nama) {
    var halaman = halamanAktifPintasan();
    if (nama === "bantuan") { bukaDaftarPintasan(); return; }
    if (!halaman) { return; }
    var form = tombolTerlihat(halaman, ".modul-form");   // formulir yang sedang tampil, atau null (sedang di Daftar)
    var modul = modulPerHalaman[halaman.id.replace(/^isi-/, "")];   // umum/komponen-daftar.js
    if (nama === "simpan") { tekanTombol(tombolTerlihat(halaman, ".tombol-simpan-besar")); return; }
    if (nama === "baru") { if (modul && !modul.hanyaDaftar) { modul.bukaBaru(); } return; }
    if (nama === "daftar") { tekanTombol(tombolTerlihat(halaman, ".tombol-daftar")); return; }
    if (nama === "tutup-tab") { tekanTombol(tombolTerlihat(halaman, ".tab-dokumen .modul-tab.aktif .tab-tutup")); return; }
    if (nama === "lampiran") { if (form) { tekanTombol(tombolTerlihat(form, '[id$="-tombol-lampiran"]')); } return; }
    if (nama === "cetak") {
        // Laporan: Cetak laporan. Formulir transaksi: Cetak bukti. Daftar: Cetak daftar.
        tekanTombol(tombolTerlihat(halaman, "#lap-cetak") || (form ? tombolTerlihat(form, "[data-cetak-bukti]") : null) ||
                    tombolTerlihat(halaman, "[data-alat='cetak']"));
    }
}

document.addEventListener("keydown", function (k) {
    var nama = namaPintasan(k);
    if (!nama) { return; }
    // Ctrl+S dan Ctrl+P milik aplikasi, bukan "simpan halaman" atau "cetak" bawaan browser
    k.preventDefault();
    // Editor Desain Cetakan: hanya Ctrl+S (tombol Simpan editor); pintasan lain milik editor
    var editor = document.getElementById("editor-cetakan");
    if (editor && !editor.hidden) {
        if (nama === "simpan") { tekanTombol(tombolTerlihat(editor, "#ec-simpan")); }
        return;
    }
    // Popup atau Halaman Cetak terbuka: tidak bekerja (Esc tetap menutup popup lewat bawaan browser)
    if (document.querySelector("dialog[open]") || !document.getElementById("halaman-cetak-bukti").hidden) { return; }
    jalankanPintasan(nama);
});

document.getElementById("tombol-bantuan").addEventListener("click", bukaDaftarPintasan);
document.getElementById("tutup-pintasan").addEventListener("click", function () { dialogPintasan.close(); });
document.getElementById("selesai-pintasan").addEventListener("click", function () { dialogPintasan.close(); });
dialogPintasan.addEventListener("click", function (k) { if (k.target === dialogPintasan) { dialogPintasan.close(); } });
