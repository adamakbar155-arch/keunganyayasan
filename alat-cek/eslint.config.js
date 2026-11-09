// Aturan ESLint untuk kode aplikasi. Semua skrip aplikasi berbagi satu ruang nama global (dimuat berurutan oleh
// index.html), jadi skrip diperiksa sebagai SATU berkas gabungan (lihat lint.js). Dengan begitu:
//   no-redeclare      -> nama global/fungsi yang sama ditulis di dua berkas ketahuan (pemeriksaan kode ganda)
//   no-undef          -> memakai nama yang tidak ada di berkas mana pun ketahuan
//   no-unused-vars    -> fungsi/variabel yang tidak dipakai lagi (kode mati) ketahuan
const globals = require("globals");

module.exports = [
  {
    files: ["gabung.js"],
    languageOptions: {
      ecmaVersion: 2020,
      sourceType: "script",
      globals: globals.browser
    },
    rules: {
      "no-redeclare": "error",
      "no-undef": "error",
      // vars "all": fungsi global yang tidak dipakai di mana pun ikut ketahuan; yang sengaja dipakai dari luar
      // (uji, konsol) ditandai /* exported namaFungsi */ di kodenya. catch (galat) yang tidak dipakai dibiarkan.
      "no-unused-vars": ["warn", { vars: "all", args: "none", caughtErrors: "none" }],
      "no-dupe-keys": "error",
      "no-unreachable": "error",
      "no-eval": "error",
      "no-implied-eval": "error",
      "eqeqeq": ["warn", "smart"]
    }
  }
];
