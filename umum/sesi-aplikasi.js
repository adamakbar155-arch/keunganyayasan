// ==================== Sesi di dalam aplikasi (PRD 6.12, 5.8) ====================
// Dimuat sesudah semua halaman (index.html). Pemeriksaan "sudah masuk atau belum" ada di umum/sesi.js (paling awal).
// Di sini:
//   - Menu pengguna (lingkaran inisial di kanan atas): nama, peran, Ganti Kata Sandi, Keluar
//   - Keluar otomatis: 40 menit tanpa aktivitas = langsung keluar tanpa peringatan (keputusan pengguna 2026-11-09)
//   - Log Aktivitas: Masuk dan Keluar
//   - Hak akses peran: Pengawas hanya melihat; Pengguna/Preferensi/Cadangan hanya Finance Yayasan; pilihan pembukuan per peran

var sesiAktif = bacaSesi();   // umum/sesi.js
var NAMA_PERAN_SESI = { "finance-yayasan": "Finance Yayasan", "finance-sekolah": "Finance Sekolah", "finance-unit-usaha": "Finance Unit usaha", "pengawas": "Pengawas" };

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

if (sesiAktif) {
    ["mousedown", "mousemove", "keydown", "wheel", "touchstart", "scroll"].forEach(function (nama) {
        document.addEventListener(nama, catatAktivitas, { passive: true, capture: true });
    });
    setInterval(periksaSesiBerkala, 20000);
    document.addEventListener("visibilitychange", function () { if (!document.hidden) { periksaSesiBerkala(); } });

    // Masuk dicatat sekali, pada halaman pertama sesudah layar Masuk
    if (sesiAktif.baruMasuk) {
        catatLog({ tindakan: "Masuk", tipe: "Pengguna", referensi: penggunaAktif });
        sesiAktif.baruMasuk = false;
        simpanSesi(sesiAktif);
    }
}

// ----- Menu pengguna -----
var tombolPengguna = document.getElementById("tombol-pengguna");
var menuPengguna = document.getElementById("daftar-menu-pengguna");
tombolPengguna.textContent = inisialNama(penggunaAktif);   // textContent: aman dari kode HTML
tombolPengguna.title = penggunaAktif;
document.getElementById("menu-pengguna-nama").textContent = penggunaAktif;
document.getElementById("menu-pengguna-peran").textContent = sesiAktif ? (NAMA_PERAN_SESI[sesiAktif.peran] || "") : "";
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

// ----- Ganti Kata Sandi (pengguna sendiri; Pengawas juga boleh, karena ini akunnya sendiri) -----
var dialogGantiSandi = document.getElementById("dialog-ganti-sandi");
function galatGantiSandi(pesan, kolom) {
    var kotak = document.getElementById("galat-ganti-sandi");
    kotak.textContent = pesan;
    kotak.hidden = !pesan;
    if (kolom) { kolom.focus(); }
}
document.getElementById("menu-ganti-sandi").addEventListener("click", function () {
    aturMenuPengguna(false);
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
    if (sedangGantiSandi || !sesiAktif) { return; }
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
            // Ditulis langsung (bukan lewat halaman Pengguna): akun sendiri, juga untuk Pengawas
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

// ----- Hak akses peran (PRD 5.8) -----
if (sesiAktif) {
    // Pengawas: tombol yang mengubah data disembunyikan lewat kelas ini (umum/sesi.css)
    document.body.classList.toggle("hanya-lihat", hanyaLihat());
    // Pengguna, Preferensi, Cadangan Data hanya untuk Finance Yayasan (kotak menunya disembunyikan; bukaTab juga menolak)
    document.body.classList.toggle("bukan-finance-yayasan", sesiAktif.peran !== "finance-yayasan");
    // Pilihan pembukuan di bilah atas: hanya yang diizinkan. Kalau yang aktif tidak diizinkan, pindah ke yang pertama diizinkan.
    var KUNCI_PEMBUKUAN_NAMA = { "Yayasan": "yayasan", "Sekolah": "sekolah", "Unit usaha": "unit-usaha" };
    var pilihanPembukuan = Array.prototype.slice.call(document.querySelectorAll(".pembukuan-pilihan"));
    var boleh = pilihanPembukuan.filter(function (p) { return sesiAktif.pembukuan.indexOf(KUNCI_PEMBUKUAN_NAMA[p.dataset.nama]) !== -1; });
    pilihanPembukuan.forEach(function (p) { p.closest("li").hidden = boleh.indexOf(p) === -1; });
    var aktif = pilihanPembukuan.find(function (p) { return p.classList.contains("aktif"); });
    if (boleh.length && boleh.indexOf(aktif) === -1) {
        pilihanPembukuan.forEach(function (p) { p.classList.toggle("aktif", p === boleh[0]); });
        document.getElementById("nama-pembukuan").textContent = boleh[0].dataset.nama;
    }
}
