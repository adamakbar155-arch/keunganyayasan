// Uji H2.7c: No Bukti mengikuti Kas/Bank (PRD 6.3). Pemakaian: node uji-nomor-kas.js <jalur-jsdom> <index.html>
const { JSDOM, VirtualConsole } = require(process.argv[2]);
const fs = require("fs"), path = require("path");
const html = fs.readFileSync(process.argv[3], "utf8").replace(/<script src="([^":]+\.js)"><\/script>/g, (m, p) => "<script>" + fs.readFileSync(path.join(path.dirname(process.argv[3]), p), "utf8") + "</script>").replace(/<link[^>]*>/g, "");
const kesalahan = []; const vc = new VirtualConsole();
vc.on("jsdomError", e => kesalahan.push(String(e.detail && e.detail.stack || e.detail || e.message)));
const akun = [
  { id: "k1", kode: "1101", nama: "Kas & Bank", tipe: "kas-bank", indukId: "" },
  { id: "k11", kode: "110101", nama: "Kas Kecil", tipe: "kas-bank", indukId: "k1" },
  { id: "k111", kode: "11010101", nama: "Kas Kecil Masjid", tipe: "kas-bank", indukId: "k11" },
  { id: "k112", kode: "11010102", nama: "Kas Kecil Manajemen", tipe: "kas-bank", indukId: "k11" }
];
const aturan = [
  { id: "nb", nama: "Pembayaran Umum", pembukuan: "yayasan", tipe: "pembayaran", digit: 4, komponen: [{ jenis: "teks", nilai: "BKK-" }, { jenis: "counter" }] },
  { id: "nt", nama: "Penerimaan Umum", pembukuan: "yayasan", tipe: "penerimaan", digit: 4, komponen: [{ jenis: "teks", nilai: "BKM-" }, { jenis: "counter" }] }
];
const dom = new JSDOM(html, { runScripts: "dangerously", url: "https://uji.test/", virtualConsole: vc, pretendToBeVisual: true,
  beforeParse(w) { require("./bantu-sesi.js").pasang(w); /* masuk sebagai pengguna uji (J.25) */

    w.HTMLDialogElement.prototype.showModal = function () { this.open = true; }; w.HTMLDialogElement.prototype.close = function () { this.open = false; };
    w.localStorage.setItem("daftarAkun", JSON.stringify(akun));
    w.localStorage.setItem("daftarPenomoran", JSON.stringify(aturan));
  } });
const w = dom.window, d = w.document, el = id => d.getElementById(id);
let lolos = 0, gagal = 0; const cek = (n, k, i) => { if (k) { lolos++; console.log("  ok    " + n); } else { gagal++; console.log("  GAGAL " + n + (i !== undefined ? " -> " + JSON.stringify(i) : "")); } };
const ubah = (id, nilai) => { el(id).value = nilai; el(id).dispatchEvent(new w.Event("change", { bubbles: true })); };
const kirim = id => el(id).dispatchEvent(new w.Event("submit", { cancelable: true, bubbles: true }));

// 1) Formulir Penomoran
w.bukaPenomoranBaru();
cek("Data Baru kosong (PRD 5.3a): Tipe 'Silakan Pilih', Jumlah digit kosong, isian Kas/Bank tersembunyi", el("pn-tipe").value === "" && el("pn-digit").value === "" && el("baris-pn-kas").hidden);
ubah("pn-tipe", "donasi");
cek("Tipe Donasi: isian Kas/Bank tampil (No Bukti donasi mengikuti Kas/Bank seperti Pembayaran, PRD 6.1)", !el("baris-pn-kas").hidden);
ubah("pn-tipe", "pembayaran");
const opsiKas = [...el("pn-kas").options].map(o => o.textContent);
cek("Tipe Pembayaran: isian Kas/Bank tampil, pilihan (Semua Kas/Bank) + Kas tingkat 3 saja", !el("baris-pn-kas").hidden && JSON.stringify(opsiKas) === JSON.stringify(["(Semua Kas/Bank)", "11010101 - Kas Kecil Masjid", "11010102 - Kas Kecil Manajemen"]), opsiKas);
el("pn-nama").value = "BKK Masjid"; el("pn-digit").value = "5";
ubah("pn-kas", "k111");
w.komponenSaatIni = [{ jenis: "teks", nilai: "MSJ-" }, { jenis: "counter" }]; w.gambarKomponen();
kirim("form-penomoran");
let tersimpan = JSON.parse(w.localStorage.getItem("daftarPenomoran"));
cek("Simpan aturan 'BKK Masjid' tertaut ke Kas Kecil Masjid (kasId k111)", tersimpan.some(a => a.nama === "BKK Masjid" && a.kasId === "k111" && a.tipe === "pembayaran"), tersimpan.map(a => a.nama + ":" + (a.kasId || "")));
w.modulPenomoran.bukaBaru(); ubah("pn-tipe", "pembayaran"); el("pn-nama").value = "BKK Masjid 2"; el("pn-digit").value = "5"; ubah("pn-kas", "k111");
w.komponenSaatIni = [{ jenis: "teks", nilai: "X-" }, { jenis: "counter" }]; w.gambarKomponen();
kirim("form-penomoran");
cek("Aturan kedua untuk Kas & tipe yang sama: ditolak, pesan di bawah isian Kas/Bank", !el("galat-pn-kas").hidden && /sudah punya aturan "BKK Masjid"/.test(el("galat-pn-kas").textContent) && JSON.parse(w.localStorage.getItem("daftarPenomoran")).length === 3, el("galat-pn-kas").textContent);
w.modulPenomoran.tampilkan("daftar");
cek("Daftar Penomoran punya kolom Kas/Bank berisi '11010101 - Kas Kecil Masjid'", /11010101 - Kas Kecil Masjid/.test(d.querySelector("#isi-penomoran tbody").textContent));

// 2) Pembayaran: aturan ikut Kas/Bank
w.bukaPembayaranBaru();
cek("Pembayaran baru (Kas belum dipilih): aturan belum dipilih (PRD 5.3a)", el("bayar-aturan-nomor").value === "" && el("bayar-contoh-nomor").textContent === "Pilih aturan penomoran.", el("bayar-contoh-nomor").textContent);
ubah("bayar-kas", "k111");
cek("Pilih Kas Kecil Masjid: aturan 'BKK Masjid' terpilih otomatis, contoh MSJ-00001", el("bayar-aturan-nomor").options[el("bayar-aturan-nomor").selectedIndex].textContent === "BKK Masjid" && /MSJ-/.test(el("bayar-contoh-nomor").textContent), el("bayar-contoh-nomor").textContent);
ubah("bayar-kas", "k112");
cek("Pilih Kas Kecil Manajemen (tanpa aturan sendiri): kembali ke 'Pembayaran Umum'", el("bayar-aturan-nomor").value === "nb" && /BKK-/.test(el("bayar-contoh-nomor").textContent));
ubah("bayar-kas", "k111"); ubah("bayar-aturan-nomor", "nb");
cek("Pengguna tetap bisa memilih aturan lain secara manual", el("bayar-aturan-nomor").value === "nb");
el("bayar-nomor-otomatis").checked = false; el("bayar-nomor-otomatis").dispatchEvent(new w.Event("change")); el("bayar-nomor").value = "MANUAL-1";
ubah("bayar-kas", "k112");
cek("Otomatis dimatikan + nomor diketik: mengganti Kas/Bank tidak mengubah apa pun", el("bayar-nomor").value === "MANUAL-1" && !el("bayar-nomor").hidden);

// 3) Penerimaan juga ikut (aturan dibuat lewat data)
const a2 = JSON.parse(w.localStorage.getItem("daftarPenomoran")); a2.push({ id: "nt2", nama: "BKM Manajemen", pembukuan: "yayasan", tipe: "penerimaan", kasId: "k112", digit: 3, komponen: [{ jenis: "teks", nilai: "MNJ-" }, { jenis: "counter" }] });
w.localStorage.setItem("daftarPenomoran", JSON.stringify(a2));
w.bukaPenerimaanBaru(); ubah("terima-kas", "k112");
cek("Penerimaan: pilih Kas Kecil Manajemen -> aturan 'BKM Manajemen' (MNJ-001)", el("terima-contoh-nomor").textContent === "Nomor berikutnya: MNJ-001", el("terima-contoh-nomor").textContent);

// 4) Akun Kas yang tertaut ke aturan tidak bisa dihapus
cek("Akun Kas Kecil Masjid tertaut ke aturan Penomoran: tidak bisa dihapus", /Penomoran/.test(w.tempatAkunDipakai("11010101")), w.tempatAkunDipakai("11010101"));
cek("tidak ada galat skrip", kesalahan.length === 0, kesalahan);
console.log("\nLolos:", lolos, "Gagal:", gagal); process.exit(gagal ? 1 : 0);
