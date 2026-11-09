// Uji Temuan 29 (PRD 5.3): transaksi bertanggal sebelum tanggal mulai pembukuan (Preferensi > Data) ditolak, lewat
// pemeriksa bersama galatTanggalTransaksi dan batas bawah kalender aturBatasTanggal (umum/).
// Pemakaian: node uji-tanggal-mulai.js <jalur-jsdom> <index.html>
const { JSDOM, VirtualConsole } = require(process.argv[2]);
const fs = require("fs"), path = require("path");
const html = fs.readFileSync(process.argv[3], "utf8").replace(/<script src="([^":]+\.js)"><\/script>/g, (m, p) => "<script>" + fs.readFileSync(path.join(path.dirname(process.argv[3]), p), "utf8") + "</script>").replace(/<link[^>]*>/g, "");
let lolos = 0, gagal = 0; const cek = (n, k, i) => { if (k) { lolos++; console.log("  ok    " + n); } else { gagal++; console.log("  GAGAL " + n + (i !== undefined ? " -> " + JSON.stringify(i) : "")); } };

// dataYayasan: objek (data contoh, bukan data asli), teks rusak, atau undefined (belum diisi)
function muat(dataYayasan) {
  const kesalahan = []; const vc = new VirtualConsole();
  vc.on("jsdomError", e => kesalahan.push(String(e.detail && e.detail.stack || e.detail || e.message))); vc.on("warn", m => kesalahan.push("warn: " + m));
  const dom = new JSDOM(html, { runScripts: "dangerously", url: "https://uji.test/", virtualConsole: vc, pretendToBeVisual: true,
    beforeParse(w) { require("./bantu-sesi.js").pasang(w); /* masuk sebagai pengguna uji (J.25) */

      w.HTMLDialogElement.prototype.showModal = function () { this.open = true; }; w.HTMLDialogElement.prototype.close = function () { this.open = false; };
      w.sessionStorage.setItem("penggunaAktif", "uji");
      if (dataYayasan !== undefined) { w.localStorage.setItem("dataYayasan", typeof dataYayasan === "string" ? dataYayasan : JSON.stringify(dataYayasan)); }
    } });
  return { w: dom.window, d: dom.window.document, kesalahan };
}
const kata = { catat: "jurnal", ini: "Jurnal ini" };

// 1) Tanggal mulai diisi 1 Jan 2026
let { w, d, kesalahan } = muat({ nama: "Yayasan Contoh", tglMulai: "2026-01-01" });
cek("tanggalMulaiDiatur: '2026-01-01'", w.tanggalMulaiDiatur() === "2026-01-01");
const g1 = w.galatTanggalTransaksi("2025-12-31", null, kata);
cek("31 Des 2025 (sebelum mulai): ditolak 'Tanggal tidak boleh sebelum tanggal mulai pembukuan, 01 Jan 2026 ...', kursor di kolom tanggal", !!g1 && /tidak boleh sebelum tanggal mulai pembukuan/.test(g1.pesan) && /Preferensi, Data/.test(g1.pesan) && g1.diKolom === true, g1);
cek("1 Jan 2026 (tepat tanggal mulai): boleh", w.galatTanggalTransaksi("2026-01-01", null, kata) === null);
cek("15 Mar 2026: boleh", w.galatTanggalTransaksi("2026-03-15", null, kata) === null);
cek("Mengubah transaksi lama ke tanggal sebelum mulai: tetap ditolak (yang diperiksa tanggal barunya)", !!w.galatTanggalTransaksi("2025-06-01", { tanggal: "2026-02-01" }, kata));
cek("Tanggal kosong tetap 'Tanggal wajib diisi.'", w.galatTanggalTransaksi("", null, kata).pesan === "Tanggal wajib diisi.");
// Kalender: kolom transaksi diberi batas bawah, kolom Tanggal Masuk Karyawan tidak
const kolom = d.createElement("input"); d.body.appendChild(kolom);
w.aturBatasTanggal(kolom);
cek("aturBatasTanggal (kolom transaksi): min = 2026-01-01", kolom.min === "2026-01-01", kolom.min);
const kolomKaryawan = d.createElement("input"); kolomKaryawan.min = "2000-01-01"; d.body.appendChild(kolomKaryawan);
w.aturBatasTanggal(kolomKaryawan, { tanpaBatasBawah: true });
cek("aturBatasTanggal tanpaBatasBawah (Tanggal Masuk Karyawan): tidak ada min", !kolomKaryawan.hasAttribute("min"));
cek("Kolom tanggal Jurnal Umum (dibuka sebagai Data Baru): min = 2026-01-01", (function () { w.modulJurnal.bukaBaru(); return d.getElementById("jurnal-tanggal").min === "2026-01-01"; })(), d.getElementById("jurnal-tanggal") && d.getElementById("jurnal-tanggal").min);
cek("tanggalMulaiPembukuan (saldo awal akun) tetap memakai tanggal mulai", w.tanggalMulaiPembukuan() === "2026-01-01");
cek("tidak ada galat skrip (bagian 1)", kesalahan.length === 0, kesalahan.slice(0, 3));

// 2) Belum diisi: tidak ada batas bawah
({ w, d, kesalahan } = muat());
cek("Tanggal mulai belum diisi: tanggal lama (2020) boleh, kalender tanpa min", w.tanggalMulaiDiatur() === "" && w.galatTanggalTransaksi("2020-05-05", null, kata) === null && (function () { const k = d.createElement("input"); w.aturBatasTanggal(k); return !k.hasAttribute("min"); })());
cek("Tanggal mulai belum diisi: saldo awal akun memakai hari ini", w.tanggalMulaiPembukuan() === w.tanggalHariIni());

// 3) Data rusak
for (const rusak of ["{bukan json", { tglMulai: "1/1/2026" }, { tglMulai: 20260101 }, { tglMulai: null }, []]) {
  ({ w, d, kesalahan } = muat(rusak));
  cek("dataYayasan rusak " + JSON.stringify(rusak) + ": dianggap belum diisi, tanpa galat", w.tanggalMulaiDiatur() === "" && w.galatTanggalTransaksi("2020-05-05", null, kata) === null && kesalahan.length === 0, kesalahan.slice(0, 2));
}

console.log("\nLolos:", lolos, "Gagal:", gagal); process.exit(gagal ? 1 : 0);
