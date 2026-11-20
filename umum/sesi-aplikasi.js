// ==================== Sesi di dalam aplikasi (PRD 6.12, 6.14) ====================
// Dimuat sesudah semua halaman (index.html). Pemeriksaan "sudah masuk atau belum" ada di umum/sesi.js (paling awal).
// Di sini:
//   - Menu pengguna (lingkaran inisial di kanan atas): nama, Jenis Akses, Ganti Kata Sandi, Buat Kode Pemulihan, Keluar
//   - Keluar otomatis: 40 menit tanpa aktivitas = langsung keluar tanpa peringatan (keputusan pengguna 2026-11-09)
//   - Log Aktivitas: Masuk dan Keluar
//   - Hak Jenis Akses: Operator hanya melihat (sampai J.31); Pengguna/Preferensi/Cadangan hanya Administrator
//   - Pemindahan sekali jalan: peran lama (sebelum J.29) diganti Jenis Akses

var sesiAktif = bacaSesi();   // umum/sesi.js

// ----- Pemindahan peran lama ke Jenis Akses (PRD 6.14) -----
// Finance Yayasan -> Administrator; Pengawas, Finance Sekolah, Finance Unit usaha -> Operator (jenisAksesPengguna, umum/sesi.js).
// Isian lama "peran" dan "pembukuan" dibuang. Berjalan setiap aplikasi dibuka, tetapi hanya mengubah sesuatu kalau masih ada
// data lama (misalnya sesudah memulihkan cadangan lama). Data rusak dibiarkan apa adanya.
function pindahkanPeranLama() {
    var daftar;
    try { daftar = JSON.parse(localStorage.getItem("daftarPengguna") || "[]"); } catch (galat) { return; }
    if (!Array.isArray(daftar)) { return; }
    var jumlah = 0;
    daftar.forEach(function (p) {
        if (!p || typeof p !== "object" || (p.jenisAkses && !("peran" in p) && !("pembukuan" in p))) { return; }
        p.jenisAkses = jenisAksesPengguna(p);
        delete p.peran;
        delete p.pembukuan;
        jumlah += 1;
    });
    if (!jumlah) { return; }
    try { localStorage.setItem("daftarPengguna", JSON.stringify(daftar)); } catch (galat) { return; }
    catatLog({ tindakan: "Ubah", tipe: "Pengguna", referensi: "Peran lama diganti Jenis Akses (" + jumlah + " pengguna): Finance Yayasan menjadi Administrator, lainnya Operator" });
}
if (sesiAktif) { pindahkanPeranLama(); }

// "Siti Aminah" -> "SA"; satu kata -> dua huruf pertama
function inisialNama(nama) {
    var kata = String(nama || "").trim().split(/\s+/).filter(Boolean);
    if (!kata.length) { return "?"; }
    return (kata.length === 1 ? kata[0].slice(0, 2) : kata[0][0] + kata[kata.length - 1][0]).toUpperCase();
}

// ----- Keluar -----
function keluarAplikasi(otomatis) {
    catatLog({ tindakan: "Keluar", tipe: "Pengguna", referensi: otomatis ? "Keluar otomatis (40 menit tanpa aktivitas)" : penggunaAktif });
    keLayarMasuk(otomatis ? "diam" : "keluar");   // umum/sesi.js
}

// Diperiksa berkala dan saat jendela kembali dibuka: 40 menit tanpa aktivitas, atau akun dihapus/Non Aktif/wajib ganti sandi
function periksaSesiBerkala() {
    var alasan = alasanSesiTidakSah();
    if (!alasan) { return; }
    if (alasan === "diam") { keluarAplikasi(true); } else { keLayarMasuk(""); }
}

// Aktivitas pengguna memperpanjang sesi. Dicatat paling sering tiap 15 detik (cukup untuk batas 40 menit).
// Kalau sesudah komputer tidur sudah lewat 40 menit, gerakan pertama tidak lagi memperpanjang: langsung keluar.
var aktivitasTerakhirDicatat = 0;
function catatAktivitas() {
    var sekarang = Date.now();
    if (sekarang - aktivitasTerakhirDicatat < 15000) { return; }
    var s = bacaSesi();
    if (!s) { return; }
    if (sekarang - Number(s.terakhirAktif) >= BATAS_DIAM_MS) { periksaSesiBerkala(); return; }
    aktivitasTerakhirDicatat = sekarang;
    s.terakhirAktif = sekarang;
    simpanSesi(s);
}

// Pemberitahuan permintaan atur ulang kata sandi untuk Administrator (umum/sesi.js). Juga dipanggil saat halaman Pengguna dibuka.
function beriTahuPermintaanAturUlang() {
    var minta = permintaanAturUlangAktif();
    if (!minta.length || !adalahAdministrator()) { return; }
    var nama = minta.map(function (m) { return teksAman(m.pengguna.nama) + " (" + teksAman(m.pengguna.username) + ")"; }).join(", ");
    tampilkanNotifikasi("Permintaan atur ulang kata sandi dari: " + nama + ". Atur ulang di Pengaturan, Pengguna.", "peringatan");
}

if (sesiAktif) {
    ["mousedown", "mousemove", "keydown", "wheel", "touchstart", "scroll"].forEach(function (nama) {
        document.addEventListener(nama, catatAktivitas, { passive: true, capture: true });
    });
    setInterval(periksaSesiBerkala, 20000);
    document.addEventListener("visibilitychange", function () { if (!document.hidden) { periksaSesiBerkala(); } });

    // Masuk dicatat sekali, pada halaman pertama sesudah layar Masuk
    if (sesiAktif.baruMasuk) {
        if (sesiAktif.lewatKodePemulihan) {
            catatLog({ tindakan: "Ubah", tipe: "Pengguna", referensi: penggunaAktif + " (atur ulang kata sandi dengan kode pemulihan)" });
        }
        catatLog({ tindakan: "Masuk", tipe: "Pengguna", referensi: penggunaAktif });
        sesiAktif.baruMasuk = false;
        sesiAktif.lewatKodePemulihan = false;
        simpanSesi(sesiAktif);
        // Administrator yang belum punya kode pemulihan diingatkan (tanpa kode, lupa kata sandi = tidak bisa masuk lagi)
        var sayaMasuk = penggunaSesi();
        if (sayaMasuk && jenisAksesPengguna(sayaMasuk) === "administrator" && !sayaMasuk.kodePemulihan) {
            tampilkanNotifikasi("Anda belum punya kode pemulihan. Buat lewat menu pengguna (inisial di kanan atas), Buat Kode Pemulihan.", "peringatan");
        }
        // Permintaan atur ulang kata sandi dari Operator (PRD 6.14, Temuan 52): Administrator diberi tahu saat masuk
        if (sayaMasuk && jenisAksesPengguna(sayaMasuk) === "administrator") { beriTahuPermintaanAturUlang(); }
        // Operator tanpa Akses Grup (atau grupnya sudah dihapus) hanya bisa membuka Dashboard (PRD 6.14): diberi tahu sekali
        if (sayaMasuk && jenisAksesPengguna(sayaMasuk) === "operator" && !namaAksesGrup(sayaMasuk.aksesGrupId)) {
            tampilkanNotifikasi("Akun Anda belum punya Akses Grup, jadi hanya Dashboard yang bisa dibuka. Hubungi Administrator.", "peringatan");
        }
    }
}

// ----- Menu pengguna -----
var tombolPengguna = document.getElementById("tombol-pengguna");
var menuPengguna = document.getElementById("daftar-menu-pengguna");
tombolPengguna.textContent = inisialNama(penggunaAktif);   // textContent: aman dari kode HTML
tombolPengguna.title = penggunaAktif;
document.getElementById("menu-pengguna-nama").textContent = penggunaAktif;
document.getElementById("menu-pengguna-peran").textContent = penggunaSesi() ? NAMA_JENIS_AKSES[jenisAksesPengguna(penggunaSesi())] : "";
document.getElementById("menu-kode-pemulihan").hidden = !adalahAdministrator();
// Kata sandi Operator hanya diatur Administrator (PRD 6.14, Temuan 52): Ganti Kata Sandi hanya untuk Administrator
document.getElementById("menu-ganti-sandi").hidden = !adalahAdministrator();
function aturMenuPengguna(buka) {
    menuPengguna.hidden = !buka;
    tombolPengguna.setAttribute("aria-expanded", buka ? "true" : "false");
}
tombolPengguna.addEventListener("click", function () { aturMenuPengguna(menuPengguna.hidden); });
document.addEventListener("click", function (k) {
    if (!menuPengguna.hidden && !(k.target.closest && k.target.closest(".menu-pengguna"))) { aturMenuPengguna(false); }
});
document.addEventListener("keydown", function (k) { if (k.key === "Escape") { aturMenuPengguna(false); } });
document.getElementById("menu-keluar").addEventListener("click", function () { keluarAplikasi(false); });

// ----- Ganti Kata Sandi (pengguna sendiri; Operator juga boleh, karena ini akunnya sendiri) -----
var dialogGantiSandi = document.getElementById("dialog-ganti-sandi");
function galatGantiSandi(pesan, kolom) {
    var kotak = document.getElementById("galat-ganti-sandi");
    kotak.textContent = pesan;
    kotak.hidden = !pesan;
    if (kolom) { kolom.focus(); }
}
document.getElementById("menu-ganti-sandi").addEventListener("click", function () {
    aturMenuPengguna(false);
    if (!adalahAdministrator()) { return; }
    ["gsa-lama", "gsa-baru", "gsa-ulang"].forEach(function (id) { document.getElementById(id).value = ""; });
    galatGantiSandi("");
    dialogGantiSandi.showModal();
    document.getElementById("gsa-lama").focus();
});
function tutupGantiSandi() { dialogGantiSandi.close(); }
document.getElementById("tutup-ganti-sandi").addEventListener("click", tutupGantiSandi);
document.getElementById("batal-ganti-sandi").addEventListener("click", tutupGantiSandi);
var sedangGantiSandi = false;
document.getElementById("form-ganti-sandi-app").addEventListener("submit", function (k) {
    k.preventDefault();
    // Pengaman kedua: Operator tidak boleh mengganti kata sandinya sendiri (PRD 6.14)
    if (sedangGantiSandi || !sesiAktif || !adalahAdministrator()) { return; }
    var lama = document.getElementById("gsa-lama"), baru = document.getElementById("gsa-baru"), ulang = document.getElementById("gsa-ulang");
    galatGantiSandi("");
    if (lama.value === "") { galatGantiSandi("Kata sandi sekarang wajib diisi.", lama); return; }
    if (baru.value.length < PANJANG_MIN_SANDI) { galatGantiSandi("Kata sandi baru minimal " + PANJANG_MIN_SANDI + " karakter.", baru); return; }
    if (baru.value !== ulang.value) { galatGantiSandi("Ulangi kata sandi baru dengan tepat sama.", ulang); return; }
    if (baru.value === lama.value) { galatGantiSandi("Kata sandi baru tidak boleh sama dengan yang sekarang.", baru); return; }
    var saya = bacaPenggunaTersimpan().find(function (p) { return p.id === sesiAktif.penggunaId; });
    if (!saya) { keLayarMasuk(""); return; }
    sedangGantiSandi = true;
    cocokKataSandi(lama.value, saya.sandi).then(function (cocok) {
        if (!cocok) { sedangGantiSandi = false; galatGantiSandi("Kata sandi sekarang salah.", lama); return null; }
        return acakKataSandi(baru.value).then(function (simpanan) {
            sedangGantiSandi = false;
            // Ditulis langsung (bukan lewat halaman Pengguna): akun Administrator sendiri
            var daftar = bacaPenggunaTersimpan();
            var p = daftar.find(function (x) { return x.id === sesiAktif.penggunaId; });
            if (!p) { keLayarMasuk(""); return; }
            p.sandi = simpanan;
            p.wajibGantiSandi = false;
            p.sandiDiatur = waktuSekarang();
            try { localStorage.setItem("daftarPengguna", JSON.stringify(daftar)); }
            catch (galat) { galatGantiSandi("Gagal menyimpan. Penyimpanan browser penuh atau diblokir."); return; }
            catatLog({ tindakan: "Ubah", tipe: "Pengguna", referensi: penggunaAktif + " (ganti kata sandi sendiri)" });
            tutupGantiSandi();
            tampilkanNotifikasi("Kata sandi telah diganti");
        });
    }).catch(function (galat) { sedangGantiSandi = false; galatGantiSandi(galat.message); });
});

// ----- Buat Kode Pemulihan (khusus Administrator, PRD 6.14) -----
// Langkah 1: kata sandi sekarang dicocokkan dulu (orang lain yang kebetulan memakai komputer yang sedang terbuka tidak bisa
// membuat kode untuk akun ini). Langkah 2: kode baru ditampilkan sekali; yang disimpan hanya acakannya.
var dialogKodePemulihan = document.getElementById("dialog-kode-pemulihan");
var sedangBuatKode = false;
function langkahKodePemulihan(tampilKode) {
    document.getElementById("kp-langkah-sandi").hidden = tampilKode;
    document.getElementById("kp-langkah-kode").hidden = !tampilKode;
    document.getElementById("batal-kode-pemulihan").hidden = tampilKode;
    document.getElementById("buat-kode-pemulihan").hidden = tampilKode;
    document.getElementById("selesai-kode-pemulihan").hidden = !tampilKode;
    document.getElementById("tutup-kode-pemulihan").hidden = tampilKode;   // kode harus dicatat dulu, ditutup lewat "Sudah Saya Catat"
}
function galatKodePemulihan(pesan) {
    var kotak = document.getElementById("galat-kode-pemulihan");
    kotak.textContent = pesan;
    kotak.hidden = !pesan;
}
document.getElementById("menu-kode-pemulihan").addEventListener("click", function () {
    aturMenuPengguna(false);
    if (!adalahAdministrator()) { return; }
    document.getElementById("kp-sandi").value = "";
    document.getElementById("kp-kode").textContent = "";
    galatKodePemulihan("");
    langkahKodePemulihan(false);
    dialogKodePemulihan.showModal();
    document.getElementById("kp-sandi").focus();
});
function tutupKodePemulihan() {
    document.getElementById("kp-kode").textContent = "";   // kode tidak dibiarkan tertinggal di halaman
    dialogKodePemulihan.close();
}
document.getElementById("tutup-kode-pemulihan").addEventListener("click", tutupKodePemulihan);
document.getElementById("batal-kode-pemulihan").addEventListener("click", tutupKodePemulihan);
document.getElementById("selesai-kode-pemulihan").addEventListener("click", tutupKodePemulihan);
// Tombol Esc saat kode sedang tampil: sebisa mungkin tidak menutup, supaya kode tidak hilang sebelum dicatat
// (browser boleh tetap menutup, misalnya Esc ditekan dua kali; kodenya tetap tersimpan, dan bisa dibuat kode baru lagi)
dialogKodePemulihan.addEventListener("cancel", function (k) {
    if (!document.getElementById("kp-langkah-kode").hidden) { k.preventDefault(); }
});
// Tertutup dengan cara apa pun: kode dihapus dari halaman
dialogKodePemulihan.addEventListener("close", function () { document.getElementById("kp-kode").textContent = ""; });
document.getElementById("form-kode-pemulihan").addEventListener("submit", function (k) {
    k.preventDefault();
    if (sedangBuatKode || !sesiAktif || !adalahAdministrator()) { return; }
    var kolom = document.getElementById("kp-sandi");
    galatKodePemulihan("");
    if (kolom.value === "") { galatKodePemulihan("Kata sandi sekarang wajib diisi."); kolom.focus(); return; }
    var saya = penggunaSesi();
    if (!saya) { keLayarMasuk(""); return; }
    var kode = buatKodePemulihan();   // umum/sandi.js
    sedangBuatKode = true;
    cocokKataSandi(kolom.value, saya.sandi).then(function (cocok) {
        if (!cocok) { sedangBuatKode = false; galatKodePemulihan("Kata sandi sekarang salah."); kolom.focus(); return null; }
        return acakKataSandi(bakukanKodePemulihan(kode)).then(function (simpanan) {
            sedangBuatKode = false;
            var daftar = bacaPenggunaTersimpan();
            var p = daftar.find(function (x) { return x.id === sesiAktif.penggunaId; });
            if (!p) { keLayarMasuk(""); return; }
            p.kodePemulihan = simpanan;
            p.kodePemulihanDibuat = waktuSekarang();
            try { localStorage.setItem("daftarPengguna", JSON.stringify(daftar)); }
            catch (galat) { galatKodePemulihan("Gagal menyimpan. Penyimpanan browser penuh atau diblokir."); return; }
            catatLog({ tindakan: "Ubah", tipe: "Pengguna", referensi: penggunaAktif + " (buat kode pemulihan baru)" });
            kolom.value = "";
            document.getElementById("kp-kode").textContent = kode;
            langkahKodePemulihan(true);
            document.getElementById("selesai-kode-pemulihan").focus();
        });
    }).catch(function (galat) { sedangBuatKode = false; galatKodePemulihan(galat.message); });
});

// ----- Hak Jenis Akses dan Akses Grup (PRD 6.14) -----
if (sesiAktif) {
    // Selain Administrator: tombol yang mengubah data disembunyikan lewat kelas ini (umum/sesi.css)
    document.body.classList.toggle("hanya-lihat", hanyaLihat());
    // Pengguna, Preferensi, Cadangan Data hanya untuk Administrator (kotak menunya disembunyikan; bukaTab juga menolak)
    document.body.classList.toggle("bukan-administrator", !adalahAdministrator());
    // Operator: menu mengikuti centang Aktif di Akses Grup (umum/hak-akses.js). Diterapkan ulang kalau Administrator mengubah
    // Pengguna atau Akses Grup di tab lain pada browser yang sama (kejadian "storage" hanya datang dari tab lain).
    terapkanHakMenu();
    window.addEventListener("storage", function (k) {
        if (k.key === "daftarPengguna" || k.key === "daftarAksesGrup") { terapkanHakMenu(); }
    });
}
