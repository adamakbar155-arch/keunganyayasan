// ==================== Layar Masuk (login.html, PRD 6.12) ====================
// Tiga keadaan di satu kotak:
//   - Masuk                : nama pengguna + kata sandi, dicocokkan dengan data Pengguna (kata sandi teracak, umum/sandi.js)
//   - Buat akun pertama    : hanya saat belum ada pengguna sama sekali; akun Finance Yayasan
//   - Ganti kata sandi     : wajib sesudah akun dibuat/diatur ulang di Pengaturan, Pengguna
// Sesudah berhasil, sesi dibuat (umum/sesi.js) lalu pindah ke index.html. Semua pesan lewat textContent.
// CATATAN: tanpa server, ini kunci layar dan pencatat siapa yang bekerja, bukan pengaman penuh (PRD 6.12, Batasan).

var BATAS_GAGAL_MASUK = 5;          // lima kali salah berturut-turut ...
var LAMA_KUNCI_MASUK_MS = 60 * 1000; // ... tunggu 1 menit
var KUNCI_GAGAL_MASUK = "gagalMasuk";

function el(id) { return document.getElementById(id); }
function tampilkanLayar(nama) {
    ["layar-masuk", "layar-akun-pertama", "layar-ganti-sandi"].forEach(function (id) { el(id).hidden = (id !== nama); });
}
function tampilkanPesan(idKotak, pesan) {
    el(idKotak).textContent = pesan;   // textContent: aman dari kode HTML
    el(idKotak).hidden = !pesan;
}

// Waktu sekarang "2026-11-09T09:40:37" (sama dengan waktuSekarang di aplikasi)
function waktuSekarangLogin() {
    var d = new Date(), dua = function (n) { return String(n).padStart(2, "0"); };
    return d.getFullYear() + "-" + dua(d.getMonth() + 1) + "-" + dua(d.getDate()) + "T" + dua(d.getHours()) + ":" + dua(d.getMinutes()) + ":" + dua(d.getSeconds());
}
function idAcak() {
    var b = window.crypto.getRandomValues(new Uint8Array(6));
    return "u" + Date.now().toString(36) + Array.from(b).map(function (x) { return x.toString(16).padStart(2, "0"); }).join("");
}
// Menyimpan daftar pengguna. Gagal (penyimpanan penuh atau diblokir) = false.
function simpanDaftarPengguna(daftar) {
    try { localStorage.setItem("daftarPengguna", JSON.stringify(daftar)); return true; } catch (galat) { return false; }
}
function masukKeAplikasi(pengguna) {
    mulaiSesi(pengguna);   // umum/sesi.js
    location.replace("index.html");
}

// ----- Pembatas percobaan salah -----
function bacaGagal() {
    try { var g = JSON.parse(localStorage.getItem(KUNCI_GAGAL_MASUK) || "{}"); return { jumlah: Number(g.jumlah) || 0, sampai: Number(g.sampai) || 0 }; }
    catch (galat) { return { jumlah: 0, sampai: 0 }; }
}
function tulisGagal(g) { try { localStorage.setItem(KUNCI_GAGAL_MASUK, JSON.stringify(g)); } catch (galat) { /* biarkan */ } }

// ----- Mulai -----
(function mulai() {
    // Sudah masuk (misalnya tombol Kembali browser): langsung ke aplikasi
    if (alasanSesiTidakSah() === "") { location.replace("index.html"); return; }
    var alasan = new URLSearchParams(location.search).get("alasan");
    var info = { diam: "Anda keluar otomatis karena tidak ada aktivitas selama 40 menit.", keluar: "Anda sudah keluar." }[alasan] || "";
    tampilkanPesan("pesan-info", info);
    if (bacaPenggunaTersimpan().length === 0) { tampilkanLayar("layar-akun-pertama"); el("ap-nama").focus(); return; }
    tampilkanLayar("layar-masuk");
    el("username").focus();
})();

// ----- Masuk -----
var penggunaWajibGanti = null;   // { pengguna, sandiLama } saat harus ganti kata sandi dulu
var sedangMemeriksa = false;
el("form-login").addEventListener("submit", function (k) {
    k.preventDefault();
    if (sedangMemeriksa) { return; }
    tampilkanPesan("pesan-error", "");
    var nama = el("username").value.trim(), sandi = el("password").value;
    if (nama === "") { tampilkanPesan("pesan-error", "Nama pengguna belum diisi."); el("username").focus(); return; }
    if (sandi === "") { tampilkanPesan("pesan-error", "Kata sandi belum diisi."); el("password").focus(); return; }
    var gagal = bacaGagal();
    if (gagal.sampai > Date.now()) {
        tampilkanPesan("pesan-error", "Terlalu banyak percobaan. Coba lagi dalam " + Math.ceil((gagal.sampai - Date.now()) / 1000) + " detik.");
        return;
    }
    var pengguna = bacaPenggunaTersimpan().find(function (p) { return String(p.username || "").toLowerCase() === nama.toLowerCase(); });
    sedangMemeriksa = true;
    el("tombol-masuk").disabled = true;
    // Nama yang tidak ada tetap diperiksa dengan kerja yang sama beratnya (simpanan tiruan), supaya pesan dan lamanya
    // sama, sehingga tidak ketahuan nama mana yang terdaftar
    var simpananTiruan = { garam: "00000000000000000000000000000000", hash: "", iterasi: ITERASI_SANDI };
    cocokKataSandi(sandi, pengguna ? pengguna.sandi : simpananTiruan).then(function (cocok) {
        sedangMemeriksa = false;
        el("tombol-masuk").disabled = false;
        if (!pengguna || !cocok) {
            gagal.jumlah += 1;
            if (gagal.jumlah >= BATAS_GAGAL_MASUK) { gagal = { jumlah: 0, sampai: Date.now() + LAMA_KUNCI_MASUK_MS }; }
            tulisGagal(gagal);
            tampilkanPesan("pesan-error", gagal.sampai > Date.now() ? "Terlalu banyak percobaan. Coba lagi dalam 1 menit." : "Nama pengguna atau kata sandi salah.");
            el("password").value = "";
            el("password").focus();
            return;
        }
        tulisGagal({ jumlah: 0, sampai: 0 });
        if (pengguna.nonAktif) { tampilkanPesan("pesan-error", "Akun ini Non Aktif. Hubungi Finance Yayasan."); return; }
        if (pengguna.wajibGantiSandi) {
            penggunaWajibGanti = { pengguna: pengguna, sandiLama: sandi };
            tampilkanLayar("layar-ganti-sandi");
            el("gs-baru").focus();
            return;
        }
        masukKeAplikasi(pengguna);
    });
});

// ----- Ganti kata sandi (wajib) -----
el("form-ganti-sandi").addEventListener("submit", function (k) {
    k.preventDefault();
    if (!penggunaWajibGanti || sedangMemeriksa) { return; }
    tampilkanPesan("pesan-error-ganti", "");
    var baru = el("gs-baru").value, ulang = el("gs-ulang").value;
    if (baru.length < PANJANG_MIN_SANDI) { tampilkanPesan("pesan-error-ganti", "Kata sandi baru minimal " + PANJANG_MIN_SANDI + " karakter."); el("gs-baru").focus(); return; }
    if (baru !== ulang) { tampilkanPesan("pesan-error-ganti", "Ulangi kata sandi baru dengan tepat sama."); el("gs-ulang").focus(); return; }
    if (baru === penggunaWajibGanti.sandiLama) { tampilkanPesan("pesan-error-ganti", "Kata sandi baru tidak boleh sama dengan yang lama."); el("gs-baru").focus(); return; }
    sedangMemeriksa = true;
    acakKataSandi(baru).then(function (simpanan) {
        sedangMemeriksa = false;
        var daftar = bacaPenggunaTersimpan();
        var p = daftar.find(function (x) { return x.id === penggunaWajibGanti.pengguna.id; });
        if (!p) { tampilkanPesan("pesan-error-ganti", "Akun ini sudah tidak ada."); return; }
        p.sandi = simpanan;
        p.wajibGantiSandi = false;
        p.sandiDiatur = waktuSekarangLogin();
        if (!simpanDaftarPengguna(daftar)) { tampilkanPesan("pesan-error-ganti", "Gagal menyimpan. Penyimpanan browser penuh atau diblokir."); return; }
        masukKeAplikasi(p);
    }).catch(function (galat) { sedangMemeriksa = false; tampilkanPesan("pesan-error-ganti", galat.message); });
});

// ----- Akun pertama -----
el("form-akun-pertama").addEventListener("submit", function (k) {
    k.preventDefault();
    if (sedangMemeriksa) { return; }
    tampilkanPesan("pesan-error-akun", "");
    var nama = el("ap-nama").value.trim(), username = el("ap-username").value.trim(), sandi = el("ap-sandi").value, ulang = el("ap-ulang").value;
    if (nama === "") { tampilkanPesan("pesan-error-akun", "Nama lengkap wajib diisi."); el("ap-nama").focus(); return; }
    if (username === "") { tampilkanPesan("pesan-error-akun", "Nama pengguna wajib diisi."); el("ap-username").focus(); return; }
    if (sandi.length < PANJANG_MIN_SANDI) { tampilkanPesan("pesan-error-akun", "Kata sandi minimal " + PANJANG_MIN_SANDI + " karakter."); el("ap-sandi").focus(); return; }
    if (sandi !== ulang) { tampilkanPesan("pesan-error-akun", "Ulangi kata sandi dengan tepat sama."); el("ap-ulang").focus(); return; }
    sedangMemeriksa = true;
    acakKataSandi(sandi).then(function (simpanan) {
        sedangMemeriksa = false;
        // Diperiksa lagi: selama mengacak, akun bisa saja sudah dibuat di jendela lain
        if (bacaPenggunaTersimpan().length > 0) { location.replace("login.html"); return; }
        var pengguna = { id: idAcak(), nama: nama, username: username, kontak: "", peran: "finance-yayasan",
                         pembukuan: ["yayasan", "sekolah", "unit-usaha"], nonAktif: false, sandi: simpanan, wajibGantiSandi: false,
                         sandiDiatur: waktuSekarangLogin() };
        if (!simpanDaftarPengguna([pengguna])) { tampilkanPesan("pesan-error-akun", "Gagal menyimpan. Penyimpanan browser penuh atau diblokir."); return; }
        masukKeAplikasi(pengguna);
    }).catch(function (galat) { sedangMemeriksa = false; tampilkanPesan("pesan-error-akun", galat.message); });
});

// ----- Bantuan kecil -----
el("lupa-sandi").addEventListener("click", function (k) { k.preventDefault(); el("petunjuk-lupa").hidden = false; });

// Tombol mata: tukar kata sandi tersembunyi <-> terlihat
el("tombol-lihat").addEventListener("click", function () {
    var tersembunyi = el("password").type === "password";
    el("password").type = tersembunyi ? "text" : "password";
    // Ikon SVG tidak punya sifat .hidden seperti elemen HTML biasa, jadi atributnya diatur langsung
    el("ikon-mata").toggleAttribute("hidden", tersembunyi);
    el("ikon-mata-coret").toggleAttribute("hidden", !tersembunyi);
    el("tombol-lihat").setAttribute("aria-label", tersembunyi ? "Sembunyikan kata sandi" : "Lihat kata sandi");
    el("tombol-lihat").setAttribute("aria-pressed", tersembunyi ? "true" : "false");
});

// Peringatan Caps Lock di kolom kata sandi
function cekCapsLock(k) { el("peringatan-caps").hidden = !(k.getModifierState && k.getModifierState("CapsLock")); }
el("password").addEventListener("keydown", cekCapsLock);
el("password").addEventListener("keyup", cekCapsLock);
el("password").addEventListener("blur", function () { el("peringatan-caps").hidden = true; });
