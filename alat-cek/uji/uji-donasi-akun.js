// Uji D1.2: Preferensi > Akun Perkiraan, kolom Donasi Terikat / Donasi Tidak Terikat (PRD 6.1).
// Pemakaian: node uji-donasi-akun.js <jalur-jsdom> <index.html>
const { JSDOM, VirtualConsole } = require(process.argv[2]);
const fs = require("fs"), path = require("path");
const html = fs.readFileSync(process.argv[3], "utf8").replace(/<script src="([^":]+\.js)"><\/script>/g, (m, p) => "<script>" + fs.readFileSync(path.join(path.dirname(process.argv[3]), p), "utf8") + "</script>").replace(/<link[^>]*>/g, "");
let lolos = 0, gagal = 0; const cek = (n, k, i) => { if (k) { lolos++; console.log("  ok    " + n); } else { gagal++; console.log("  GAGAL " + n + (i !== undefined ? " -> " + JSON.stringify(i) : "")); } };

// Data contoh (bukan data asli): tiga akun pendapatan tanpa sub
const akun = [
  { id: "i1", kode: "4101", nama: "Pendapatan", tipe: "pendapatan", indukId: "" },
  { id: "i2", kode: "410101", nama: "Donasi", tipe: "pendapatan", indukId: "i1" },
  { id: "a1", kode: "41010101", nama: "Infaq Umum", tipe: "pendapatan", indukId: "i2" },
  { id: "a2", kode: "41010102", nama: "Donasi Masjid", tipe: "pendapatan", indukId: "i2" },
  { id: "a3", kode: "41010103", nama: "Donasi Yatim", tipe: "pendapatan", indukId: "i2" }
];
function muat(preferensi) {
  const kesalahan = []; const vc = new VirtualConsole();
  vc.on("jsdomError", e => kesalahan.push(String(e.detail && e.detail.stack || e.detail || e.message))); vc.on("warn", m => kesalahan.push("warn: " + m));
  const dom = new JSDOM(html, { runScripts: "dangerously", url: "https://uji.test/", virtualConsole: vc, pretendToBeVisual: true,
    beforeParse(w) { require("./bantu-sesi.js").pasang(w); /* masuk sebagai pengguna uji (J.25) */

      w.HTMLDialogElement.prototype.showModal = function () { this.open = true; }; w.HTMLDialogElement.prototype.close = function () { this.open = false; };
      w.sessionStorage.setItem("penggunaAktif", "uji");
      w.localStorage.setItem("daftarAkun", JSON.stringify(akun));
      if (preferensi !== undefined) { w.localStorage.setItem("akunPerkiraanYayasan", typeof preferensi === "string" ? preferensi : JSON.stringify(preferensi)); }
    } });
  return { w: dom.window, d: dom.window.document, kesalahan };
}

// 1) Isi kolom lama "pendapatanDonasi" pindah ke Donasi Tidak Terikat
let { w, d, kesalahan } = muat({ pendapatanDonasi: ["41010101"], pendapatanLain: [] });
let p = w.bacaAkunPerkiraan();
cek("isi lama pendapatanDonasi pindah ke donasiTidakTerikat, kolom lama dibuang", JSON.stringify(p.donasiTidakTerikat) === '["41010101"]' && p.donasiTerikat.length === 0 && !("pendapatanDonasi" in p), p);
cek("sifatAkunDonasi: 41010101 tidak-terikat, 41010102 belum diatur ('')", w.sifatAkunDonasi("41010101") === "tidak-terikat" && w.sifatAkunDonasi("41010102") === "");
cek("akunDonasi() = gabungan kedua kolom (1 akun: Infaq Umum)", w.akunDonasi().length === 1 && w.akunDonasi()[0].nama === "Infaq Umum");
// 2) Tampilan: dua kotak, kotak lama hilang
cek("Preferensi: kotak 'Donasi Terikat' dan 'Donasi Tidak Terikat' ada, kotak lama 'Pendapatan Donasi' tidak ada", !!d.getElementById("cari-donasiTerikat") && !!d.getElementById("cari-donasiTidakTerikat") && !d.getElementById("cari-pendapatanDonasi") && !/Pendapatan Donasi/.test(d.getElementById("sub-ap-pendapatan").textContent));
const chip = kol => [...d.querySelectorAll('.pemilih-akun[data-kolom="' + kol + '"] .chip-akun')].map(c => c.firstChild.textContent);
cek("label akun lama tampil di kotak Donasi Tidak Terikat", JSON.stringify(chip("donasiTidakTerikat")) === '["[41010101] Infaq Umum"]', chip("donasiTidakTerikat"));
// 3) Satu akun hanya boleh di salah satu kotak
const pilihan = kol => { const k = d.getElementById("cari-" + kol); k.dispatchEvent(new w.Event("focus")); return [...d.querySelectorAll('.pemilih-akun[data-kolom="' + kol + '"] .pemilih-pilihan')]; };
let opsi = pilihan("donasiTerikat");
cek("pilihan di kotak Terikat TIDAK menawarkan Infaq Umum (sudah di Tidak Terikat)", !opsi.some(b => /Infaq Umum/.test(b.textContent)) && opsi.some(b => /Donasi Masjid/.test(b.textContent)), opsi.map(b => b.textContent));
opsi.find(b => /Donasi Masjid/.test(b.textContent)).click();
cek("pilih Donasi Masjid di kotak Terikat: labelnya tampil", JSON.stringify(chip("donasiTerikat")) === '["[41010102] Donasi Masjid"]', chip("donasiTerikat"));
opsi = pilihan("donasiTidakTerikat");
cek("pilihan di kotak Tidak Terikat TIDAK menawarkan Donasi Masjid (sudah di Terikat)", !opsi.some(b => /Donasi Masjid/.test(b.textContent)) && opsi.some(b => /Donasi Yatim/.test(b.textContent)), opsi.map(b => b.textContent));
// 4) Simpan
d.getElementById("form-akun-perkiraan").dispatchEvent(new w.Event("submit", { cancelable: true }));
const tersimpan = JSON.parse(w.localStorage.getItem("akunPerkiraanYayasan"));
cek("Simpan: donasiTerikat [41010102], donasiTidakTerikat [41010101], kolom lama pendapatanDonasi hilang", JSON.stringify(tersimpan.donasiTerikat) === '["41010102"]' && JSON.stringify(tersimpan.donasiTidakTerikat) === '["41010101"]' && !("pendapatanDonasi" in tersimpan), tersimpan);
cek("sifatAkunDonasi sesudah simpan: 41010102 terikat", w.sifatAkunDonasi("41010102") === "terikat");
// 5) Akun yang dipakai di kotak baru tetap terlindungi dari hapus/ganti kode
cek("tempatAkunDipakai: akun di kotak Terikat dan Tidak Terikat = 'Preferensi (Akun Perkiraan)'", w.tempatAkunDipakai("41010102") === "Preferensi (Akun Perkiraan)" && w.tempatAkunDipakai("41010101") === "Preferensi (Akun Perkiraan)" && w.tempatAkunDipakai("41010103") === "");
cek("tidak ada galat skrip (bagian 1-5)", kesalahan.length === 0, kesalahan.slice(0, 3));

// 6) Data rusak dan Preferensi kosong
({ w, d, kesalahan } = muat({ donasiTerikat: "x", donasiTidakTerikat: [5, "41010103"], pendapatanDonasi: [null, "41010103", "41010101"] }));
p = w.bacaAkunPerkiraan();
cek("data rusak: kolom bukan daftar jadi kosong; isi lama yang bukan teks dibuang; tidak dobel", Array.isArray(p.donasiTerikat) && p.donasiTerikat.length === 0 && JSON.stringify(p.donasiTidakTerikat) === '[5,"41010103","41010101"]', p);
cek("data rusak: sifatAkunDonasi dan akunDonasi tetap jalan", w.sifatAkunDonasi("41010101") === "tidak-terikat" && w.akunDonasi().length === 2);
({ w, d, kesalahan } = muat("{bukan json"));
cek("Preferensi rusak total: dua kotak kosong, tanpa galat", w.bacaAkunPerkiraan().donasiTerikat.length === 0 && w.akunDonasi().length === 0 && kesalahan.length === 0, kesalahan.slice(0, 3));
({ w, d, kesalahan } = muat());
cek("Preferensi belum pernah disimpan: dua kotak kosong, tanpa galat", w.bacaAkunPerkiraan().donasiTidakTerikat.length === 0 && kesalahan.length === 0, kesalahan.slice(0, 3));

console.log("\nLolos:", lolos, "Gagal:", gagal); process.exit(gagal ? 1 : 0);
