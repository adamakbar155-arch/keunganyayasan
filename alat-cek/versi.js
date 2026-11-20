// Tanda versi pada alamat file (Temuan 49, PLAN T.6). Bukan bagian aplikasi.
// Setiap <script src> dan <link href> ke file aplikasi di index.html dan login.html diberi "?v=" + 8 huruf sidik isi file itu,
// misalnya umum/sesi.js?v=3f2a9c1b. Kalau isi file berubah, alamatnya ikut berubah, jadi browser (dan GitHub Pages yang
// menyuruh browser menyimpan file 10 menit) langsung mengambil file baru tanpa Ctrl+Shift+R. File yang tidak berubah tetap
// diambil dari simpanan browser (cepat).
// Pemakaian:
//   node alat-cek/versi.js            -> menulis tanda versi terbaru (dijalankan sebelum dikirim ke GitHub)
//   node alat-cek/versi.js --periksa  -> hanya memeriksa; keluar dengan kode 1 kalau ada tanda yang belum sesuai (dipakai cek.ps1)
const fs = require("fs"), path = require("path"), crypto = require("crypto");
const akar = path.join(__dirname, "..");
const HALAMAN = ["index.html", "login.html"];
// Hanya alamat relatif ke file di folder aplikasi (tanpa ":" seperti https: atau data:)
const POLA = /(<(?:script|link)\b[^>]*?\b(?:src|href)=")([^"?#:]+\.(?:js|css|svg|png|ico))(?:\?v=[^"]*)?(")/g;
const periksaSaja = process.argv.includes("--periksa");

function sidik(berkas) {
  return crypto.createHash("sha256").update(fs.readFileSync(path.join(akar, berkas))).digest("hex").slice(0, 8);
}

let berbeda = 0, hilang = 0;
for (const nama of HALAMAN) {
  const f = path.join(akar, nama);
  const asli = fs.readFileSync(f, "utf8");
  const baru = asli.replace(POLA, (semua, awal, berkas, akhir) => {
    if (!fs.existsSync(path.join(akar, berkas))) { hilang++; console.log("TIDAK ADA: " + nama + " -> " + berkas); return semua; }
    return awal + berkas + "?v=" + sidik(berkas) + akhir;
  });
  if (baru !== asli) {
    berbeda++;
    if (periksaSaja) { console.log("BELUM SESUAI: tanda versi di " + nama + " (jalankan node alat-cek\\versi.js)"); }
    else { fs.writeFileSync(f, baru); console.log("Diperbarui: " + nama); }
  }
}
if (!berbeda && !hilang) { console.log("Tanda versi: sesuai"); }
process.exit(periksaSaja && (berbeda || hilang) ? 1 : (hilang ? 1 : 0));
