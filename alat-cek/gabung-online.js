// Menyusun SALINAN situs untuk versi online (Temuan 49, PLAN T.7). Bukan bagian aplikasi.
// Masalahnya: index.html memuat sekitar 150 file kecil; di GitHub Pages file itu terunduh hampir satu per satu, sehingga
// pembukaan pertama bisa 20-50 detik. Di sini semua gaya (CSS) digabung menjadi aplikasi.css dan semua skrip di <body>
// menjadi aplikasi.js, dengan urutan PERSIS sama dengan index.html (urutan menentukan aturan CSS mana yang menang dan
// skrip mana yang sudah ada). umum/sesi.js tetap terpisah di <head> karena harus berjalan paling awal.
// Kode di folder proyek TIDAK diubah; hasilnya ditulis ke folder tujuan (dipakai GitHub Actions, .github/workflows/situs.yml).
// Pemakaian: node alat-cek/gabung-online.js <folder-tujuan>
const fs = require("fs"), path = require("path"), crypto = require("crypto");
const akar = path.join(__dirname, "..");
const tujuan = path.resolve(process.argv[2] || path.join(__dirname, ".sementara", "situs"));
if (tujuan === akar || akar.startsWith(tujuan + path.sep)) { throw new Error("Folder tujuan tidak boleh folder proyek atau induknya: " + tujuan); }

// 1) Salin semua file proyek kecuali yang bukan bagian situs
const LEWATI = new Set([".git", ".github", "alat-cek", "node_modules", path.basename(tujuan)]);
fs.rmSync(tujuan, { recursive: true, force: true });
function salin(dari, ke) {
  fs.mkdirSync(ke, { recursive: true });
  for (const isi of fs.readdirSync(dari, { withFileTypes: true })) {
    if (LEWATI.has(isi.name)) { continue; }
    const a = path.join(dari, isi.name), b = path.join(ke, isi.name);
    if (isi.isDirectory()) { salin(a, b); } else if (isi.isFile()) { fs.copyFileSync(a, b); }
  }
}
salin(akar, tujuan);

const sidik = (teks) => crypto.createHash("sha256").update(teks).digest("hex").slice(0, 8);
const bacaTeks = (berkas) => fs.readFileSync(path.join(akar, berkas), "utf8").replace(/^﻿/, "");
let html = fs.readFileSync(path.join(akar, "index.html"), "utf8");

// 2) Gaya: semua <link rel="stylesheet"> berurutan. Alamat url() relatif (misalnya huruf di umum/huruf.css) diubah supaya
//    tetap benar dari tempat aplikasi.css (folder akar situs).
const POLA_CSS = /<link rel="stylesheet" href="([^"?:]+\.css)(?:\?v=[^"]*)?">/g;
const berkasCss = [...html.matchAll(POLA_CSS)].map(m => m[1]);
let css = "";
for (const b of berkasCss) {
  const folder = path.posix.dirname(b);
  const isi = bacaTeks(b).replace(/url\(\s*(["']?)([^"')]+)\1\s*\)/g, (semua, kutip, alamat) => {
    if (/^(data:|https?:|\/|#)/.test(alamat)) { return semua; }
    return "url(" + kutip + path.posix.normalize(path.posix.join(folder, alamat)) + kutip + ")";
  });
  css += "/* ===== " + b + " ===== */\n" + isi + "\n";
}
fs.writeFileSync(path.join(tujuan, "aplikasi.css"), css);

// 3) Skrip di <body>: semua <script src> sesudah <body>, berurutan. Pemisah ";" mencegah dua file menyatu menjadi satu
//    pernyataan kalau sebuah file tidak diakhiri titik koma.
const POLA_JS = /<script src="([^"?:]+\.js)(?:\?v=[^"]*)?"><\/script>/g;
const awalBody = html.indexOf("<body");
const bagianBody = html.slice(awalBody);
const berkasJs = [...bagianBody.matchAll(POLA_JS)].map(m => m[1]);
let js = "";
for (const b of berkasJs) { js += "/* ===== " + b + " ===== */\n" + bacaTeks(b) + "\n;\n"; }
fs.writeFileSync(path.join(tujuan, "aplikasi.js"), js);

// 4) index.html situs: link gaya pertama diganti satu link aplikasi.css, sisanya dibuang; skrip <body> pertama diganti satu
//    skrip aplikasi.js, sisanya dibuang. Komentar dan <template> tetap.
let cssDipasang = false, jsDipasang = false;
html = html.replace(POLA_CSS, () => {
  if (cssDipasang) { return ""; }
  cssDipasang = true;
  return '<link rel="stylesheet" href="aplikasi.css?v=' + sidik(css) + '">';
});
const kepala = html.slice(0, html.indexOf("<body"));
let badan = html.slice(html.indexOf("<body"));
badan = badan.replace(POLA_JS, () => {
  if (jsDipasang) { return ""; }
  jsDipasang = true;
  return '<script src="aplikasi.js?v=' + sidik(js) + '"></script>';
});
// Baris yang tinggal spasi (bekas tag yang dibuang) dirapikan
html = (kepala + badan).replace(/\n[ \t]+\n/g, "\n");
fs.writeFileSync(path.join(tujuan, "index.html"), html);

console.log("Situs online disusun di " + tujuan + ": " + berkasCss.length + " file CSS -> aplikasi.css (" + Math.round(css.length / 1024) +
  " KB), " + berkasJs.length + " file JS -> aplikasi.js (" + Math.round(js.length / 1024) + " KB)");
