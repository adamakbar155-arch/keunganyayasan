// Menggabungkan semua skrip aplikasi (urutan sama dengan index.html) menjadi .sementara/gabung.js, menjalankan ESLint,
// lalu memetakan nomor baris kembali ke berkas aslinya. Pemakaian: node alat-cek/lint.js
const fs = require("fs"), path = require("path");
const { ESLint } = require("eslint");
const akar = path.join(__dirname, "..");
// Skrip index.html, lalu skrip login.html yang belum ada (umum/sesi.js dan umum/sandi.js dipakai keduanya, cukup sekali),
// supaya alat bersama yang hanya dipakai layar Masuk (misalnya mulaiSesi) tidak dianggap tidak terpakai
const skripDari = (nama) => [...fs.readFileSync(path.join(akar, nama), "utf8").matchAll(/<script src="([^"]+\.js)"><\/script>/g)].map(m => m[1]);
const berkas = skripDari("index.html");
skripDari("login.html").forEach(b => { if (berkas.indexOf(b) === -1) { berkas.push(b); } });
let teks = "";
const peta = [];
for (const b of berkas) {
  const isi = fs.readFileSync(path.join(akar, b), "utf8").replace(/^﻿/, "");
  peta.push({ b, awal: teks.split("\n").length });
  teks += isi + (isi.endsWith("\n") ? "" : "\n");
}
const folder = path.join(__dirname, ".sementara");
fs.mkdirSync(folder, { recursive: true });
fs.writeFileSync(path.join(folder, "gabung.js"), teks);
(async () => {
  const eslint = new ESLint({ cwd: __dirname, overrideConfigFile: path.join(__dirname, "eslint.config.js") });
  const [hasil] = await eslint.lintText(teks, { filePath: path.join(__dirname, "gabung.js") });
  const keluar = hasil.messages.map(m => {
    const p = peta.filter(x => x.awal <= m.line).pop() || { b: "?", awal: 1 };
    return (m.severity === 2 ? "GALAT " : "saran ") + m.ruleId + " | " + p.b + ":" + (m.line - p.awal + 1) + " | " + m.message;
  });
  console.log(keluar.length ? keluar.join("\n") : "ESLint: 0 temuan");
  console.log("Berkas diperiksa: " + berkas.length);
  process.exit(hasil.errorCount ? 1 : 0);
})();
