// ==================== Kata sandi (PRD 5.9, 6.12) ====================
// Dipakai bersama oleh layar Masuk (login.js) dan halaman Pengguna (fitur/pengaturan/pengaturan.js), supaya cara mengacak dan
// mencocokkan kata sandi ditulis sekali saja.
// Kata sandi tidak pernah disimpan apa adanya: diacak dengan PBKDF2-SHA256 (garam acak 16 bait, 150.000 putaran).
// Yang disimpan: { garam, hash, iterasi } dalam bentuk heksa.

var ITERASI_SANDI = 150000;
var PANJANG_MIN_SANDI = 8;   // untuk kata sandi yang dibuat pengguna sendiri (akun pertama, Ganti Kata Sandi)

function ubahKeHeks(buffer) {
    return Array.from(new Uint8Array(buffer)).map(function (b) { return b.toString(16).padStart(2, "0"); }).join("");
}
function dariHeks(teks) {
    var bait = new Uint8Array(Math.floor(String(teks).length / 2));
    for (var i = 0; i < bait.length; i++) { bait[i] = parseInt(String(teks).substr(i * 2, 2), 16) || 0; }
    return bait;
}

// Hasil acakan PBKDF2 (heksa) dari kata sandi + garam. Mengembalikan Promise.
function turunkanSandi(sandi, garam, iterasi) {
    if (!window.crypto || !window.crypto.subtle) {
        return Promise.reject(new Error("Browser ini tidak mendukung pengacakan kata sandi."));
    }
    return window.crypto.subtle.importKey("raw", new TextEncoder().encode(sandi), "PBKDF2", false, ["deriveBits"])
        .then(function (kunci) {
            return window.crypto.subtle.deriveBits({ name: "PBKDF2", salt: garam, iterations: iterasi, hash: "SHA-256" }, kunci, 256);
        })
        .then(ubahKeHeks);
}

// Mengacak kata sandi baru dengan garam acak. Promise -> { garam, hash, iterasi }.
function acakKataSandi(sandi) {
    if (!window.crypto || !window.crypto.getRandomValues) {
        return Promise.reject(new Error("Browser ini tidak mendukung pengacakan kata sandi."));
    }
    var garam = window.crypto.getRandomValues(new Uint8Array(16));
    return turunkanSandi(sandi, garam, ITERASI_SANDI).then(function (hash) {
        return { garam: ubahKeHeks(garam), hash: hash, iterasi: ITERASI_SANDI };
    });
}

// Apakah kata sandi cocok dengan simpanan { garam, hash, iterasi }? Promise -> true/false.
// Simpanan rusak = tidak cocok. Perbandingan dilakukan sampai habis (tidak berhenti di huruf pertama yang beda).
function cocokKataSandi(sandi, simpanan) {
    if (!simpanan || typeof simpanan.hash !== "string" || typeof simpanan.garam !== "string" || !(Number(simpanan.iterasi) > 0)) {
        return Promise.resolve(false);
    }
    return turunkanSandi(sandi, dariHeks(simpanan.garam), Number(simpanan.iterasi)).then(function (hash) {
        if (hash.length !== simpanan.hash.length) { return false; }
        var beda = 0;
        for (var i = 0; i < hash.length; i++) { beda |= hash.charCodeAt(i) ^ simpanan.hash.charCodeAt(i); }
        return beda === 0;
    }).catch(function () { return false; });
}
