// Uji D1.7 bagian 1: dasar Pemindahan Dana (PRD 4.2, 6.0, 6.1): kolom Aset Neto di Preferensi, sisa dana Program,
// tipe penomoran. Pemakaian: node uji-pemindahan-dasar.js <jalur-jsdom> <index.html>
const { JSDOM, VirtualConsole } = require(process.argv[2]);
const fs = require("fs"), path = require("path");
const html = fs.readFileSync(process.argv[3], "utf8").replace(/<script src="([^":]+\.js)"><\/script>/g, (m, p) => "<script>" + fs.readFileSync(path.join(path.dirname(process.argv[3]), p), "utf8") + "</script>").replace(/<link[^>]*>/g, "");
let lolos = 0, gagal = 0; const cek = (n, k, i) => { if (k) { lolos++; console.log("  ok    " + n); } else { gagal++; console.log("  GAGAL " + n + (i !== undefined ? " -> " + JSON.stringify(i) : "")); } };

// Data contoh (bukan data asli)
const akun = [
  { id: "k1", kode: "110101", nama: "Kas Kecil", tipe: "kas-bank", indukId: "" },
  // Seperti bagan bawaan: induk "Modal" (punya sub akun) dengan dua sub Aset Neto
  { id: "m0", kode: "3101", nama: "Modal", tipe: "modal", indukId: "" },
  { id: "m1", kode: "310101", nama: "Aset Neto Tidak Terikat", tipe: "modal", indukId: "m0" },
  { id: "m2", kode: "310102", nama: "Aset Neto Terikat", tipe: "modal", indukId: "m0" },
  { id: "p1", kode: "410101", nama: "Donasi", tipe: "pendapatan", indukId: "" },
  { id: "p2", kode: "420101", nama: "Bunga Bank", tipe: "pendapatan-lain", indukId: "" },
  { id: "b1", kode: "610101", nama: "Beban Kegiatan", tipe: "beban", indukId: "" },
  { id: "b2", kode: "710101", nama: "Beban Lain", tipe: "beban-lain", indukId: "" },
  { id: "u1", kode: "210101", nama: "Utang", tipe: "liabilitas-pendek", indukId: "" }
];
const r = (akunId, debit, kredit, programId) => ({ akunId, debit, kredit, programId: programId || "" });
const jurnal = [
  { id: "j1", nomor: "J1", tanggal: "2026-01-10", rincian: [r("k1", 1000000, 0), r("p1", 0, 1000000, "pr1")] },          // donasi +1.000.000
  { id: "j2", nomor: "J2", tanggal: "2026-02-10", rincian: [r("k1", 50000, 0), r("p2", 0, 50000, "pr1")] },              // pendapatan lain +50.000
  { id: "j3", nomor: "J3", tanggal: "2026-03-10", rincian: [r("b1", 300000, 0, "pr1"), r("k1", 0, 300000)] },            // beban -300.000
  { id: "j4", nomor: "J4", tanggal: "2026-04-10", rincian: [r("b2", 20000, 0, "pr1"), r("k1", 0, 20000)] },              // beban lain -20.000
  { id: "j5", nomor: "J5", tanggal: "2026-05-10", rincian: [r("m2", 100000, 0, "pr1"), r("m2", 0, 100000, "pr2")] },     // pindah pr1 -> pr2 100.000
  { id: "j6", nomor: "J6", tanggal: "2026-06-10", rincian: [r("u1", 0, 999, "pr1"), r("k1", 999, 0, "pr1")] },          // utang & kas bertanda Program: tidak dihitung
  { id: "j7", nomor: "J7", tanggal: "2026-12-31", rincian: [r("k1", 5000, 0), r("p1", 0, 5000, "pr1")] },                // sesudah batas tanggal uji
  { id: "j8", tanggal: "2026-01-01", rincian: "rusak" }, null, { id: "j9", tanggal: "2026-01-01", rincian: [null, r("p1", "x", "abc", "pr1")] }
];
function muat(preferensi) {
  const kesalahan = []; const vc = new VirtualConsole();
  vc.on("jsdomError", e => kesalahan.push(String(e.detail && e.detail.stack || e.detail || e.message))); vc.on("warn", m => kesalahan.push("warn: " + m));
  const dom = new JSDOM(html, { runScripts: "dangerously", url: "https://uji.test/", virtualConsole: vc, pretendToBeVisual: true,
    beforeParse(w) { require("./bantu-sesi.js").pasang(w); /* masuk sebagai pengguna uji (J.25) */

      w.HTMLDialogElement.prototype.showModal = function () { this.open = true; }; w.HTMLDialogElement.prototype.close = function () { this.open = false; };
      w.sessionStorage.setItem("penggunaAktif", "uji");
      w.localStorage.setItem("daftarAkun", JSON.stringify(akun));
      w.localStorage.setItem("daftarJurnal", JSON.stringify(jurnal));
      if (preferensi !== undefined) { w.localStorage.setItem("akunPerkiraanYayasan", typeof preferensi === "string" ? preferensi : JSON.stringify(preferensi)); }
    } });
  return { w: dom.window, d: dom.window.document, kesalahan };
}

// 1) Tab Aset Neto di Preferensi > Akun Perkiraan
let { w, d, kesalahan } = muat();
const tab = [...d.querySelectorAll('#pref-akun .sub-tab')].map(b => b.textContent.trim()).join("|");
cek("Akun Perkiraan punya tab kecil: Pendapatan, Kas dan Bank, Aset Neto, Lainnya", tab === "Pendapatan|Kas dan Bank|Aset Neto|Lainnya", tab);
cek("Tab Aset Neto berisi kolom 'Aset Neto Terikat' dan 'Aset Neto Tidak Terikat'", !!d.getElementById("cari-asetNetoTerikat") && !!d.getElementById("cari-asetNetoTidakTerikat") && /Aset Neto Terikat/.test(d.getElementById("sub-ap-aset-neto").textContent));
const pilihan = kol => { const k = d.getElementById("cari-" + kol); k.dispatchEvent(new w.Event("focus")); return [...d.querySelectorAll('.pemilih-akun[data-kolom="' + kol + '"] .pemilih-pilihan')]; };
const chip = kol => [...d.querySelectorAll('.pemilih-akun[data-kolom="' + kol + '"] .chip-akun')].map(c => c.firstChild.textContent);
let opsi = pilihan("asetNetoTerikat");
cek("Pilihan kolom Aset Neto Terikat hanya akun bertipe Modal TANPA sub akun (310101, 310102); induk [3101] Modal tidak ditawarkan", JSON.stringify(opsi.map(b => b.textContent)) === JSON.stringify(["[310101] Aset Neto Tidak Terikat", "[310102] Aset Neto Terikat"]), opsi.map(b => b.textContent));
cek("Kolom lain (misalnya Pendapatan Lainnya) tetap menawarkan semua akun", pilihan("pendapatanLain").length === akun.length);
opsi.find(b => /310102/.test(b.textContent)).click();
opsi = pilihan("asetNetoTerikat");
opsi.find(b => /310101/.test(b.textContent)).click();
cek("Hanya satu akun: memilih akun kedua menggantikan akun pertama", JSON.stringify(chip("asetNetoTerikat")) === '["[310101] Aset Neto Tidak Terikat"]', chip("asetNetoTerikat"));
opsi = pilihan("asetNetoTerikat");
opsi.find(b => /310102/.test(b.textContent)).click();
opsi = pilihan("asetNetoTidakTerikat");
cek("Kolom Tidak Terikat tidak menawarkan akun yang sudah di kolom Terikat (310102)", JSON.stringify(opsi.map(b => b.textContent)) === '["[310101] Aset Neto Tidak Terikat"]', opsi.map(b => b.textContent));
opsi[0].click();
d.getElementById("form-akun-perkiraan").dispatchEvent(new w.Event("submit", { cancelable: true }));
const tersimpan = JSON.parse(w.localStorage.getItem("akunPerkiraanYayasan"));
cek("Simpan: asetNetoTerikat ['310102'], asetNetoTidakTerikat ['310101']", JSON.stringify(tersimpan.asetNetoTerikat) === '["310102"]' && JSON.stringify(tersimpan.asetNetoTidakTerikat) === '["310101"]', tersimpan);
cek("akunAsetNeto('terikat') = 310102, akunAsetNeto('tidak-terikat') = 310101", w.akunAsetNeto("terikat").kode === "310102" && w.akunAsetNeto("tidak-terikat").kode === "310101");
// 310101 hanya dipakai di Preferensi (310102 juga dipakai jurnal contoh, jadi hasilnya "Jurnal Umum")
cek("Akun Aset Neto yang dipilih terlindungi dari hapus/ganti kode (dipakai di Preferensi)", w.tempatAkunDipakai("310101") === "Preferensi (Akun Perkiraan)", w.tempatAkunDipakai("310101"));

// 2) Sisa dana Program (PRD 6.0)
cek("Sisa dana pr1 per 30 Jun 2026: 1.000.000 + 50.000 − 300.000 − 20.000 − 100.000 = 630.000 (utang/kas bertanda Program dan data rusak tidak dihitung)", w.sisaDanaProgram("pr1", "2026-06-30") === 630000, w.sisaDanaProgram("pr1", "2026-06-30"));
cek("Sisa dana pr2 (tujuan pemindahan): 100.000", w.sisaDanaProgram("pr2", "2026-06-30") === 100000, w.sisaDanaProgram("pr2", "2026-06-30"));
// Temuan 28 (D1.10): hasilnya sisa akhir hari TERENDAH mulai tanggal itu ke depan, bukan sisa per tanggal itu saja
cek("Mulai 9 Mar 2026: sisa per 9 Mar 1.050.000, tetapi yang bisa dipakai = terendah ke depan 630.000", w.sisaDanaProgram("pr1", "2026-03-09") === 630000, w.sisaDanaProgram("pr1", "2026-03-09"));
cek("Mulai 10 Mar 2026 (tanggal yang sama ikut dihitung): terendah ke depan 630.000", w.sisaDanaProgram("pr1", "2026-03-10") === 630000, w.sisaDanaProgram("pr1", "2026-03-10"));
cek("Mulai 31 Des 2026 (tidak ada jurnal sesudahnya): sisa akhir hari itu 635.000", w.sisaDanaProgram("pr1", "2026-12-31") === 635000, w.sisaDanaProgram("pr1", "2026-12-31"));
cek("Mulai sesudah semua jurnal (2027-01-05): sisa akhir 635.000", w.sisaDanaProgram("pr1", "2027-01-05") === 635000, w.sisaDanaProgram("pr1", "2027-01-05"));
cek("Tanpa batas tanggal: semua jurnal (termasuk 31 Des) = 635.000", w.sisaDanaProgram("pr1", "") === 635000, w.sisaDanaProgram("pr1", ""));
cek("abaikan(j): melewati jurnal pemindahan J5 -> pr1 = 730.000", w.sisaDanaProgram("pr1", "2026-06-30", j => j.id === "j5") === 730000, w.sisaDanaProgram("pr1", "2026-06-30", j => j.id === "j5"));
cek("Program tanpa transaksi: 0", w.sisaDanaProgram("tidak-ada", "2026-12-31") === 0);

// 3) Tipe penomoran
cek("Tipe penomoran 'pemindahan' bernama 'Pemindahan Dana'", w.tipeTransaksi.pemindahan === "Pemindahan Dana" && [...d.querySelectorAll("option")].some(o => o.value === "pemindahan" && o.textContent === "Pemindahan Dana"));
cek("tidak ada galat skrip (bagian 1-3)", kesalahan.length === 0, kesalahan.slice(0, 3));

// 4) Data rusak
({ w, d, kesalahan } = muat({ asetNetoTerikat: "x", asetNetoTidakTerikat: ["410101"] }));
cek("Preferensi rusak: kolom bukan daftar jadi kosong -> akunAsetNeto('terikat') null", Array.isArray(w.bacaAkunPerkiraan().asetNetoTerikat) && w.akunAsetNeto("terikat") === null);
cek("Akun bukan bertipe Modal tersimpan di kolom Aset Neto (isi rusak): tidak dipakai (null)", w.akunAsetNeto("tidak-terikat") === null);
({ w, d, kesalahan } = muat({ asetNetoTerikat: ["3101"], asetNetoTidakTerikat: ["310101"] }));
cek("Akun induk [3101] Modal sempat tersimpan di kolom Terikat: tidak dipakai jurnal (null); kolom lain tetap jalan", w.akunAsetNeto("terikat") === null && w.akunAsetNeto("tidak-terikat").kode === "310101");
({ w, d, kesalahan } = muat("{bukan json"));
cek("Preferensi rusak total: akunAsetNeto null, tanpa galat", w.akunAsetNeto("terikat") === null && kesalahan.length === 0, kesalahan.slice(0, 3));

// Temuan 28 (D1.10): jurnal bertanggal rusak ("constructor", "__proto__", angka) tidak mengacaukan sisa dana
w.localStorage.setItem("daftarJurnal", JSON.stringify([
  { id: "r1", tanggal: "2026-01-01", rincian: [{ akunId: w.bacaDaftarAkun().find(a => a.tipe === "pendapatan").id, kredit: 100, programId: "prx" }] },
  { id: "r2", tanggal: "constructor", rincian: [{ akunId: w.bacaDaftarAkun().find(a => a.tipe === "pendapatan").id, kredit: 5, programId: "prx" }] },
  { id: "r3", tanggal: "__proto__", rincian: [{ akunId: w.bacaDaftarAkun().find(a => a.tipe === "pendapatan").id, kredit: 7, programId: "prx" }] },
  { id: "r4", tanggal: 12345, rincian: "rusak" }, null, "teks"]));
cek("Jurnal bertanggal rusak: sisa tetap angka (total 112; mulai 1 Jan = terendah 100, tanggal rusak terurut sesudahnya), tanpa galat", w.sisaDanaProgram("prx", "") === 112 && w.sisaDanaProgram("prx", "2026-01-01") === 100 && kesalahan.length === 0, [w.sisaDanaProgram("prx", ""), w.sisaDanaProgram("prx", "2026-01-01")]);
console.log("\nLolos:", lolos, "Gagal:", gagal); process.exit(gagal ? 1 : 0);
