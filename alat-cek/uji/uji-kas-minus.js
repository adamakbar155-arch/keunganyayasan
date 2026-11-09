// Uji D1.8: pengaman saldo Kas/Bank minus (PRD 5.6), alat bersama periksaKasMinus (umum/komponen-transaksi.js).
// Pemakaian: node uji-kas-minus.js <jalur-jsdom> <index.html>
const { JSDOM, VirtualConsole } = require(process.argv[2]);
const fs = require("fs"), path = require("path");
const html = fs.readFileSync(process.argv[3], "utf8").replace(/<script src="([^":]+\.js)"><\/script>/g, (m, p) => "<script>" + fs.readFileSync(path.join(path.dirname(process.argv[3]), p), "utf8") + "</script>").replace(/<link[^>]*>/g, "");
let lolos = 0, gagal = 0; const cek = (n, k, i) => { if (k) { lolos++; console.log("  ok    " + n); } else { gagal++; console.log("  GAGAL " + n + (i !== undefined ? " -> " + JSON.stringify(i) : "")); } };

// Data contoh (bukan data asli)
const akun = [
  { id: "k1", kode: "110101", nama: "Kas Masjid", tipe: "kas-bank", indukId: "", saldoAwal: 0 },
  { id: "k2", kode: "110102", nama: "Kas Lama Minus", tipe: "kas-bank", indukId: "", saldoAwal: 0 },
  { id: "p1", kode: "410101", nama: "Donasi", tipe: "pendapatan", indukId: "" },
  { id: "b1", kode: "610101", nama: "Beban", tipe: "beban", indukId: "" }
];
const r = (akunId, debit, kredit) => ({ akunId, debit, kredit });
const jurnal = [
  { id: "j1", nomor: "J1", tanggal: "2026-10-01", rincian: [r("k1", 100000, 0), r("p1", 0, 100000)] },   // kas masjid 100.000
  { id: "j2", nomor: "J2", tanggal: "2026-10-10", rincian: [r("b1", 60000, 0), r("k1", 0, 60000)] },      // 10 Okt: sisa 40.000
  { id: "j3", nomor: "J3", tanggal: "2026-10-01", rincian: [r("b1", 1000, 0), r("k2", 0, 1000)] },        // data lama: k2 sudah -1.000
  { id: "jr", tanggal: "2026-10-01", rincian: "rusak" }, null
];
function muat(pembatasan) {
  const kesalahan = []; const vc = new VirtualConsole();
  vc.on("jsdomError", e => kesalahan.push(String(e.detail && e.detail.stack || e.detail || e.message))); vc.on("warn", m => kesalahan.push("warn: " + m));
  const dom = new JSDOM(html, { runScripts: "dangerously", url: "https://uji.test/", virtualConsole: vc, pretendToBeVisual: true,
    beforeParse(w) { require("./bantu-sesi.js").pasang(w); /* masuk sebagai pengguna uji (J.25) */

      w.HTMLDialogElement.prototype.showModal = function () { this.open = true; }; w.HTMLDialogElement.prototype.close = function () { this.open = false; };
      w.sessionStorage.setItem("penggunaAktif", "uji");
      w.localStorage.setItem("daftarAkun", JSON.stringify(akun));
      w.localStorage.setItem("daftarJurnal", JSON.stringify(jurnal));
      if (pembatasan !== undefined) { w.localStorage.setItem("pembatasanYayasan", typeof pembatasan === "string" ? pembatasan : JSON.stringify(pembatasan)); }
    } });
  return { w: dom.window, d: dom.window.document, kesalahan };
}
const tanpaLama = () => false;

let { w, d, kesalahan } = muat();
const notif = () => d.getElementById("area-notifikasi").textContent;
const bersih = () => { d.getElementById("area-notifikasi").textContent = ""; };
const keluar = (tanggal, nilai, akunId) => ({ tanggal, rincian: [r("b1", nilai, 0), r(akunId || "k1", 0, nilai)] });

cek("Bawaan (belum pernah disimpan): Kas/Bank minus = 'tolak'", w.bacaPembatasan().kasMinus === "tolak");
cek("Preferensi > Pembatasan > Lainnya: pilihan 'Ditolak' (terpilih) dan 'Peringatan saja'", [...d.querySelectorAll("input[name='batas-kas-minus']")].map(x => x.value + ":" + x.checked).join("|") === "tolak:true|peringatan:false");
// 1) Kas cukup
bersih();
cek("Keluar 30.000 pada 5 Okt (saldo 100.000, lalu 10 Okt jadi 10.000): boleh, tanpa pesan", w.periksaKasMinus(keluar("2026-10-05", 30000), tanpaLama) === true && notif() === "", notif());
// 2) Kas kurang
bersih();
cek("Keluar 150.000 pada 5 Okt: ditolak", w.periksaKasMinus(keluar("2026-10-05", 150000), tanpaLama) === false);
cek("Pesan menyebut akun, tanggal minus terendah (10 Okt: -110.000), saldo tersedia per 5 Okt 100.000, dan 'Tidak disimpan'", /Saldo \[110101\] Kas Masjid jadi minus pada 10 Okt 2026: Rp -110\.000\. Saldo tersedia per 5 Okt 2026: Rp\s?100\.000\. Tidak disimpan/.test(notif()), notif());
// 3) Tanggal mundur: hari itu masih cukup, tetapi hari sesudahnya jadi minus
bersih();
cek("Keluar 50.000 pada 2 Okt: 2 Okt masih 50.000, tetapi 10 Okt jadi -10.000 -> ditolak, pesan menyebut 10 Okt", w.periksaKasMinus(keluar("2026-10-02", 50000), tanpaLama) === false && /minus pada 10 Okt 2026: Rp -10\.000/.test(notif()), notif());
// 4) Mengubah: jurnal lama diganti versi baru
bersih();
cek("Ubah J2 (60.000 -> 90.000) pada 10 Okt: sisa 10.000 -> boleh", w.periksaKasMinus(keluar("2026-10-10", 90000), j => j.id === "j2") === true && notif() === "", notif());
bersih();
cek("Ubah J2 jadi 120.000: -20.000 -> ditolak", w.periksaKasMinus(keluar("2026-10-10", 120000), j => j.id === "j2") === false && /-20\.000/.test(notif()), notif());
bersih();
cek("Ubah J1 (pemasukan) dari 1 Okt ke 15 Okt: antara 10-15 Okt kas jadi -60.000 -> ditolak (dihitung dari tanggal lama yang lebih awal)", w.periksaKasMinus({ tanggal: "2026-10-15", rincian: [r("k1", 100000, 0), r("p1", 0, 100000)] }, j => j.id === "j1") === false && /minus pada 10 Okt 2026: Rp -60\.000/.test(notif()), notif());
// 5) Data lama yang sudah minus
bersih();
cek("Kas lama sudah -1.000: penerimaan 500 (memperbaiki) tetap boleh", w.periksaKasMinus({ tanggal: "2026-10-05", rincian: [r("k2", 500, 0), r("p1", 0, 500)] }, tanpaLama) === true && notif() === "");
bersih();
cek("Kas lama sudah -1.000: pengeluaran 10 (memperburuk) ditolak", w.periksaKasMinus(keluar("2026-10-05", 10, "k2"), tanpaLama) === false && /Kas Lama Minus jadi minus/.test(notif()), notif());
// 6) Jurnal tanpa Kas/Bank
bersih();
cek("Jurnal tanpa akun Kas/Bank: selalu boleh", w.periksaKasMinus({ tanggal: "2026-10-05", rincian: [r("b1", 5, 0), r("p1", 0, 5)] }, tanpaLama) === true && notif() === "");
cek("tidak ada galat skrip (bagian 1-6)", kesalahan.length === 0, kesalahan.slice(0, 3));

// 7) Mode peringatan
({ w, d, kesalahan } = muat({ kasMinus: "peringatan" }));
cek("Mode 'Peringatan saja': pengeluaran 150.000 tetap boleh (true) dengan pesan 'Tetap disimpan'", w.periksaKasMinus(keluar("2026-10-05", 150000), tanpaLama) === true && /Tetap disimpan/.test(d.getElementById("area-notifikasi").textContent));
cek("Preferensi menampilkan 'Peringatan saja' terpilih", d.querySelector("input[name='batas-kas-minus'][value='peringatan']").checked);
// Simpan pilihan lewat formulir
d.querySelector("input[name='batas-kas-minus'][value='tolak']").checked = true;
d.querySelector("input[name='batas-kas-minus'][value='peringatan']").checked = false;
d.getElementById("form-pembatasan").dispatchEvent(new w.Event("submit", { cancelable: true }));
cek("Simpan Pembatasan dengan 'Ditolak': tersimpan kasMinus 'tolak'", JSON.parse(w.localStorage.getItem("pembatasanYayasan")).kasMinus === "tolak");
// 8) Data rusak
({ w, d, kesalahan } = muat({ kasMinus: "aneh" }));
cek("Isi kasMinus rusak: dianggap 'tolak' (paling aman)", w.bacaPembatasan().kasMinus === "tolak");
({ w, d, kesalahan } = muat("{bukan json"));
cek("Pembatasan rusak total: 'tolak', tanpa galat", w.bacaPembatasan().kasMinus === "tolak" && kesalahan.length === 0, kesalahan.slice(0, 3));

// 9) Alat bersama saldoTerendahSejak (umum/alat.js): yang dihitung saldo AKHIR HARI mulai tanggal transaksi (PRD 5.6)
({ w, d, kesalahan } = muat());
const ph = (o) => Object.assign(Object.create(null), o);
cek("saldoTerendahSejak: terendah akhir hari mulai 10 Okt (awal 0; +100 tgl 1, −60 tgl 10, −50 tgl 20) = −10 pada 20 Okt", JSON.stringify(w.saldoTerendahSejak(ph({ "2026-10-01": 100, "2026-10-10": -60, "2026-10-20": -50 }), 0, "2026-10-10")) === JSON.stringify({ saldo: -10, tanggal: "2026-10-20" }));
cek("saldoTerendahSejak: tanpa perubahan sesudah tanggal mulai -> saldo akhir hari tanggal itu", JSON.stringify(w.saldoTerendahSejak(ph({ "2026-10-01": 100 }), 5, "2026-10-15")) === JSON.stringify({ saldo: 105, tanggal: "2026-10-15" }));
cek("saldoTerendahSejak: mulai kosong -> saldo akhir semua hari", w.saldoTerendahSejak(ph({ "2026-10-01": 100, "2026-10-02": -30 }), 0, "").saldo === 70);
// Kas sudah minus SEBELUM hari transaksi (−1.000 sejak 1 Okt), lalu setoran 2.000 dan pengeluaran 1.500 di hari yang sama
// (5 Okt): akhir hari 5 Okt tetap −500. Saldo awal hari (−1.000) bukan saldo akhir hari, jadi tidak dipakai pembanding.
bersih();
const hariSama = { tanggal: "2026-10-05", rincian: [r("k2", 2000, 0), r("p1", 0, 2000), r("b1", 1500, 0), r("k2", 0, 1500)] };
cek("Kas minus sejak sebelumnya; transaksi hari yang sama berakhir −500 (lebih baik dari −1.000 sebelumnya): boleh", w.periksaKasMinus(hariSama, tanpaLama) === true, notif());
bersih();
cek("Kas minus sejak sebelumnya; pengeluaran 500 lagi tgl 5 Okt (akhir hari −1.500, lebih minus): ditolak", w.periksaKasMinus(keluar("2026-10-05", 500, "k2"), tanpaLama) === false && /jadi minus pada 5 Okt 2026/.test(notif()), notif());

console.log("\nLolos:", lolos, "Gagal:", gagal); process.exit(gagal ? 1 : 0);
