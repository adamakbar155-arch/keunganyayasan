// Uji J.20 dan J.21: lampiran di Pembayaran, Penerimaan, Transfer Bank, Pencatatan Gaji, Pencatatan Donasi, dan Pemindahan Dana
// (alat bersama umum/lampiran.js, PRD 5.4).
// Pemakaian: node uji-lampiran-kas.js <jalur-jsdom> <index.html>
const { JSDOM, VirtualConsole } = require(process.argv[2]);
const fs = require("fs"), path = require("path");
const html = fs.readFileSync(process.argv[3], "utf8").replace(/<script src="([^":]+\.js)"><\/script>/g, (m, p) => "<script>" + fs.readFileSync(path.join(path.dirname(process.argv[3]), p), "utf8") + "</script>").replace(/<link[^>]*>/g, "");
let lolos = 0, gagal = 0; const cek = (n, k, i) => { if (k) { lolos++; console.log("  ok    " + n); } else { gagal++; console.log("  GAGAL " + n + (i !== undefined ? " -> " + JSON.stringify(i) : "")); } };

// Data contoh (bukan data asli)
const akun = [
  { id: "k0", kode: "1101", nama: "Kas & Bank", tipe: "kas-bank", indukId: "" },
  { id: "k01", kode: "110101", nama: "Kas Kecil", tipe: "kas-bank", indukId: "k0" },
  { id: "k1", kode: "11010101", nama: "Kas Kecil Masjid", tipe: "kas-bank", indukId: "k01" },
  { id: "k2", kode: "11010102", nama: "Kas Kecil Sekolah", tipe: "kas-bank", indukId: "k01" },
  { id: "p1", kode: "410101", nama: "Donasi Umum", tipe: "pendapatan", indukId: "" },
  { id: "b1", kode: "610101", nama: "Beban Listrik", tipe: "beban", indukId: "" }
];
const aturan = [
  { id: "nb", nama: "Pembayaran Umum", pembukuan: "yayasan", tipe: "pembayaran", digit: 4, komponen: [{ jenis: "teks", nilai: "BKK-" }, { jenis: "counter" }] },
  { id: "nt", nama: "Penerimaan Umum", pembukuan: "yayasan", tipe: "penerimaan", digit: 4, komponen: [{ jenis: "teks", nilai: "BKM-" }, { jenis: "counter" }] },
  { id: "ntf", nama: "Transfer Umum", pembukuan: "yayasan", tipe: "transfer", digit: 4, komponen: [{ jenis: "teks", nilai: "TF-" }, { jenis: "counter" }] }
];
const kesalahan = []; const vc = new VirtualConsole();
vc.on("jsdomError", e => kesalahan.push(String(e.detail && e.detail.stack || e.detail || e.message))); vc.on("warn", m => kesalahan.push("warn: " + m));
const dom = new JSDOM(html, { runScripts: "dangerously", url: "https://uji.test/", virtualConsole: vc, pretendToBeVisual: true,
  beforeParse(w) { require("./bantu-sesi.js").pasang(w); /* masuk sebagai pengguna uji (J.25) */

    w.HTMLDialogElement.prototype.showModal = function () { this.open = true; }; w.HTMLDialogElement.prototype.close = function () { this.open = false; };
    w.sessionStorage.setItem("penggunaAktif", "uji");
    w.localStorage.setItem("daftarAkun", JSON.stringify(akun));
    w.localStorage.setItem("daftarPenomoran", JSON.stringify(aturan));
    w.localStorage.setItem("daftarDivisi", JSON.stringify([{ id: "d1", nama: "Masjid" }]));
    w.localStorage.setItem("pembatasanYayasan", JSON.stringify({ kasMinus: "peringatan" }));   // saldo kas contoh 0
  } });
const w = dom.window, d = w.document, el = id => d.getElementById(id);
const ubah = (id, nilai) => { el(id).value = nilai; el(id).dispatchEvent(new w.Event("change", { bubbles: true })); };
const kirim = id => el(id).dispatchEvent(new w.Event("submit", { cancelable: true, bubbles: true }));
const berkas = (nama, isi, tipe) => new w.File([isi], nama, { type: tipe || "text/plain" });
const isiLamp = () => JSON.parse(w.localStorage.getItem("lampiranJurnal") || "{}");
const daftar = kunci => JSON.parse(w.localStorage.getItem(kunci) || "[]");
const butir = () => [...d.querySelectorAll("#daftar-lampiran .butir-lampiran")];
const wajib = obj => w.localStorage.setItem("lampiranYayasan", JSON.stringify(obj));
// Kepala dan satu baris rincian seperti diisi pengguna
function isiPembayaran(nilai) {
  w.trxBayar.modul.bukaBaruKosong(function () {});
  if (el("dialog-konfirmasi").open) { el("ya-konfirmasi").click(); }
  ubah("bayar-tanggal", "2026-10-05"); ubah("bayar-kas", "k1"); ubah("bayar-aturan-nomor", "nb");
  w.trxBayar.aturBaris([{ id: "rb1", akunId: "b1", kode: "610101", nama: "Beban Listrik", nilai: nilai || 50000, divisiId: "d1", programId: "", terikat: false, catatan: "" }]);
}
function isiPenerimaan() {
  w.trxTerima.modul.bukaBaruKosong(function () {});
  if (el("dialog-konfirmasi").open) { el("ya-konfirmasi").click(); }
  ubah("terima-tanggal", "2026-10-05"); ubah("terima-kas", "k1"); ubah("terima-aturan-nomor", "nt");
  w.trxTerima.aturBaris([{ id: "rt1", akunId: "p1", kode: "410101", nama: "Donasi Umum", nilai: 80000, divisiId: "d1", programId: "", terikat: false, catatan: "" }]);
}

(async () => {
  wajib({});
  // ---- Pembayaran ----
  w.bukaPembayaranBaru();
  cek("1) Pembayaran: tombol klip sungguhan (tidak lagi 'belum tersedia'), lencana tersembunyi", !!el("bayar-tombol-lampiran") && el("bayar-lencana-lampiran").hidden && !d.querySelector("[data-bayar-menyusul]"));
  el("bayar-tombol-lampiran").click();
  cek("   klik klip: popup Lampiran terbuka, 'Belum ada lampiran', catatan wajib tersembunyi", el("dialog-lampiran").open && !el("lampiran-kosong").hidden && el("lampiran-wajib").hidden);
  el("selesai-lampiran").click();
  isiPembayaran();
  el("bayar-tombol-lampiran").click();
  await w.lampiranAktif.tambah([berkas("nota-listrik.txt", "nota"), berkas("program.exe", "x", "application/x-msdownload")]);
  cek("2) tambah file: .txt masuk, .exe ditolak; lencana Pembayaran = 1", butir().length === 1 && /jenis file tidak diizinkan/.test(el("galat-lampiran").textContent) && el("bayar-lencana-lampiran").textContent === "1" && !el("bayar-lencana-lampiran").hidden);
  // Isi file diperiksa, bukan hanya namanya
  const mz = new Uint8Array([0x4D, 0x5A, 0x90, 0x00, 0x03, 0x00]);
  await w.lampiranAktif.tambah([new w.File([mz], "nota-palsu.jpg", { type: "image/jpeg" }), berkas("bukan.pdf", "ini hanya teks"),
                                new w.File([mz], "data.txt", { type: "text/plain" }), berkas("dokumen.docx", "teks biasa"),
                                berkas("faktur-asli.pdf", "%PDF-1.4\n%%EOF", "application/pdf")]);
  const galatIsi = el("galat-lampiran").textContent;
  cek("   isi diperiksa: program bernama .jpg, teks bernama .pdf, program bernama .txt, teks bernama .docx ditolak; PDF asli masuk", butir().length === 2 &&
    /"nota-palsu\.jpg": isinya bukan file JPG sungguhan/.test(galatIsi) && /"bukan\.pdf": isinya bukan file PDF sungguhan/.test(galatIsi) &&
    /"data\.txt": isinya bukan file TXT/.test(galatIsi) && /"dokumen\.docx": isinya bukan file DOCX/.test(galatIsi) && /faktur-asli\.pdf/.test(butir()[1].textContent), galatIsi);
  cek("   jenis isi yang disimpan mengikuti pemeriksaan (data:application/pdf)", /^data:application\/pdf/.test(w.lampiranAktif.kerja()[1].isi));
  butir()[1].querySelector("button.tombol-garis-bahaya").click();
  cek("   lencana Jurnal Umum dan Penerimaan tidak ikut berubah", el("jurnal-lencana-lampiran").hidden && el("terima-lencana-lampiran").hidden);
  el("selesai-lampiran").click();
  cek("   menambah lampiran = ada perubahan (tab Data Baru diberi tanda, PRD 6.10)", w.trxBayar.modul.adaPerubahan());
  kirim("form-bayar");
  const by = daftar("daftarPembayaran")[0];
  cek("3) simpan: Pembayaran punya lampiranInfo (tanpa isi), jumlah 1, ringkasan nama", by && by.lampiranInfo.length === 1 && by.jumlahLampiran === 1 && by.ringkasanLampiran === "nota-listrik.txt" && !JSON.stringify(by).includes("data:"), by);
  cek("   isi file tersimpan terpisah menurut id Pembayaran", by && Object.keys(isiLamp()[by.id] || {}).length === 1);
  w.trxBayar.modul.bukaUbah(by);
  cek("4) buka dari daftar: lampiran termuat lagi (lencana 1, tombol Unduh aktif)", el("bayar-lencana-lampiran").textContent === "1" && (el("bayar-tombol-lampiran").click(), !butir()[0].querySelector("button.tombol-garis").disabled));
  let diunduh = null; w.unduhLampiran = (n, i) => { diunduh = { n, i }; };
  butir()[0].querySelector("button.tombol-garis").click();
  cek("   Unduh memakai nama file dan isi data:text/plain", diunduh && diunduh.n === "nota-listrik.txt" && /^data:text\/plain/.test(diunduh.i), diunduh);
  el("selesai-lampiran").click();

  // ---- Wajib menurut Preferensi ----
  cek("5) Preferensi, Lampiran punya pilihan Pembayaran Kas dan Bank", !!d.querySelector('input[data-lampiran="pembayaran"]'));
  wajib({ pembayaran: true });
  isiPembayaran();
  cek("   wajib: tombol klip ditandai, aria-label menyebut wajib", el("bayar-tombol-lampiran").classList.contains("lampiran-wajib-kosong") && /wajib/.test(el("bayar-tombol-lampiran").getAttribute("aria-label")));
  const n0 = daftar("daftarPembayaran").length;
  kirim("form-bayar");
  cek("   simpan tanpa lampiran ditolak: 'Lampiran wajib untuk Pembayaran', tidak tersimpan", daftar("daftarPembayaran").length === n0 && /Lampiran wajib untuk Pembayaran/.test(el("bayar-pesan-galat").textContent), el("bayar-pesan-galat").textContent);
  el("bayar-tombol-lampiran").click();
  cek("   popup menyebut wajib untuk Pembayaran", !el("lampiran-wajib").hidden && el("lampiran-wajib-nama").textContent === "Pembayaran");
  el("selesai-lampiran").click();
  w.bukaPenerimaanBaru();
  cek("   Penerimaan tidak ikut wajib (pilihannya terpisah)", !el("terima-tombol-lampiran").classList.contains("lampiran-wajib-kosong"));
  wajib({});

  // ---- Penyimpanan penuh: transaksi tidak disimpan ----
  isiPembayaran();
  el("bayar-tombol-lampiran").click();
  await w.lampiranAktif.tambah([berkas("q.txt", "q")]);
  el("selesai-lampiran").click();
  const asliSet = w.Storage.prototype.setItem;
  w.Storage.prototype.setItem = function (k, v) { if (k === "lampiranJurnal") { throw new Error("QuotaExceeded"); } return asliSet.call(this, k, v); };
  const n1 = daftar("daftarPembayaran").length;
  kirim("form-bayar");
  w.Storage.prototype.setItem = asliSet;
  cek("6) penyimpanan penuh: Pembayaran tidak tersimpan, pesan 'tidak muat'", daftar("daftarPembayaran").length === n1 && /tidak muat/.test(el("bayar-pesan-galat").textContent), el("bayar-pesan-galat").textContent);

  // ---- Simpan gagal karena Kas/Bank minus: isi lampiran dikembalikan ----
  w.localStorage.setItem("pembatasanYayasan", JSON.stringify({ kasMinus: "tolak" }));
  const isiSebelum = JSON.stringify(isiLamp());
  kirim("form-bayar");
  cek("7) Kas/Bank minus ditolak: transaksi tidak tersimpan dan isi lampiran tidak tertinggal", daftar("daftarPembayaran").length === n1 && JSON.stringify(isiLamp()) === isiSebelum);
  w.localStorage.setItem("pembatasanYayasan", JSON.stringify({ kasMinus: "peringatan" }));

  // ---- Penerimaan ----
  isiPenerimaan();
  el("terima-tombol-lampiran").click();
  await w.lampiranAktif.tambah([berkas("kuitansi.txt", "kuitansi")]);
  el("selesai-lampiran").click();
  kirim("form-terima");
  const tr = daftar("daftarPenerimaan")[0];
  cek("8) Penerimaan: tersimpan dengan lampiran (info di data, isi terpisah)", tr && tr.jumlahLampiran === 1 && Object.keys(isiLamp()[tr.id] || {}).length === 1, tr);
  cek("   Log Aktivitas mencatat Jumlah Lampiran dan nama file", (() => { const l = JSON.parse(w.localStorage.getItem("logAktivitas") || "[]").filter(x => x.tipe === "Penerimaan").slice(-1)[0]; return !!l && JSON.stringify(l).includes("kuitansi.txt"); })());
  w.trxTerima.modul.hapus(tr); el("ya-konfirmasi").click();
  cek("9) Penerimaan dihapus: isi lampirannya ikut hilang", daftar("daftarPenerimaan").length === 0 && !isiLamp()[tr.id]);

  // ---- Data rusak ----
  // Data dibuat langsung di penyimpanan (seperti data lama atau diutak-atik), lalu dibuka dari daftar
  const rusak = Object.assign({}, daftar("daftarPembayaran")[0], { id: "rusak1", nomor: "R1", nama: "R1", lampiranInfo: [null, 5, { id: "x", nama: "<img src=x onerror=alert(1)>", ukuran: "abc" }] });
  const rusak2 = Object.assign({}, daftar("daftarPembayaran")[0], { id: "rusak2", nomor: "R2", nama: "R2" });   // lampiranInfo 1 file
  w.localStorage.setItem("daftarPembayaran", JSON.stringify(daftar("daftarPembayaran").concat([rusak, rusak2])));
  w.trxBayar.modul.bukaUbah(rusak);
  el("bayar-tombol-lampiran").click();
  cek("10) lampiranInfo rusak: butir rusak dilewati, nama berkode HTML tampil sebagai teks, isi hilang = Unduh mati", butir().length === 1 && !d.querySelector("#daftar-lampiran img") && /<img src=x/.test(butir()[0].textContent) && butir()[0].querySelector("button.tombol-garis").disabled, butir().map(b => b.textContent + "|" + b.querySelector("button.tombol-garis").disabled));
  el("selesai-lampiran").click();
  w.localStorage.setItem("lampiranJurnal", "{bukan json");
  w.trxBayar.modul.bukaUbah(rusak2);
  cek("   isi lampiran rusak total: tidak macet, Unduh mati", (el("bayar-tombol-lampiran").click(), butir().length === 1 && butir()[0].querySelector("button.tombol-garis").disabled));
  el("selesai-lampiran").click();
  w.localStorage.setItem("lampiranJurnal", "{}");

  // ====================== J.21 ======================
  // ---- Transfer Bank: simpan dengan lampiran, wajib, hapus ----
  wajib({});
  w.bukaTransferBaru();
  cek("12) Transfer: tombol klip sungguhan (bukan 'belum tersedia'), lencana tersembunyi", !!el("transfer-tombol-lampiran") && el("transfer-lencana-lampiran").hidden && !d.querySelector("[data-transfer-menyusul]"));
  ubah("transfer-tanggal", "2026-10-05"); ubah("transfer-aturan-nomor", "ntf"); ubah("transfer-dari", "k1"); ubah("transfer-ke", "k2");
  el("transfer-nilai").value = "10.000";
  el("transfer-tombol-lampiran").click();
  await w.lampiranAktif.tambah([berkas("slip-transfer.txt", "slip")]);
  el("selesai-lampiran").click();
  cek("   tambah file: lencana Transfer = 1", el("transfer-lencana-lampiran").textContent === "1");
  kirim("form-transfer");
  const tf = daftar("daftarTransfer")[0];
  cek("   simpan: Transfer punya lampiranInfo dan isi file terpisah", tf && tf.jumlahLampiran === 1 && Object.keys(isiLamp()[tf.id] || {}).length === 1, el("transfer-pesan-galat").textContent);
  wajib({ transfer: true });
  w.bukaTransferBaru();
  ubah("transfer-tanggal", "2026-10-06"); ubah("transfer-aturan-nomor", "ntf"); ubah("transfer-dari", "k1"); ubah("transfer-ke", "k2");
  el("transfer-nilai").value = "5.000";
  kirim("form-transfer");
  cek("   wajib (Preferensi Transfer Kas/Bank): simpan tanpa lampiran ditolak 'Lampiran wajib untuk Transfer Bank'", daftar("daftarTransfer").length === 1 && /Lampiran wajib untuk Transfer Bank/.test(el("transfer-pesan-galat").textContent), el("transfer-pesan-galat").textContent);
  wajib({});
  w.modulTransfer.hapus(tf); el("ya-konfirmasi").click();
  cek("   Transfer dihapus: isi lampirannya ikut hilang", daftar("daftarTransfer").length === 0 && !isiLamp()[tf.id]);

  // ---- Pencatatan Gaji, Pencatatan Donasi, Pemindahan Dana: tombol, lencana, wajib, Preferensi ----
  for (const [awalan, buka, jenis, nama, modul] of [["pgaji", "bukaPencatatanGajiBaru", "gaji", "Pencatatan Gaji", "modulPgaji"],
      ["dc", "bukaPencatatanDonasiBaru", "donasi", "Pencatatan Donasi", "modulDonasiCatat"], ["pd", "bukaPemindahanDanaBaru", "pemindahan", "Pemindahan Dana", "modulPemindahanDana"]]) {
    wajib({});
    w[modul].bukaBaruKosong(function () {}); if (el("dialog-konfirmasi").open) { el("ya-konfirmasi").click(); }
    w[buka]();
    const tombol = el(awalan + "-tombol-lampiran"), lencana = el(awalan + "-lencana-lampiran");
    cek("13) " + nama + ": tombol klip ada, lencana tersembunyi, Preferensi punya pilihan wajibnya", !!tombol && lencana.hidden && !!d.querySelector('input[data-lampiran="' + jenis + '"]'));
    tombol.click();
    await w.lampiranAktif.tambah([berkas("bukti-" + jenis + ".txt", "isi")]);
    el("selesai-lampiran").click();
    cek("   " + nama + ": tambah file -> lencana 1, formulir dianggap berubah (tab bertanda)", lencana.textContent === "1" && w[modul].adaPerubahan());
    wajib({ [jenis]: true });
    w[modul].bukaBaruKosong(function () {}); if (el("dialog-konfirmasi").open) { el("ya-konfirmasi").click(); }
    tombol.click();
    cek("   " + nama + ": wajib -> tombol bertanda merah, popup menyebut '" + nama + "'", tombol.classList.contains("lampiran-wajib-kosong") && !el("lampiran-wajib").hidden && el("lampiran-wajib-nama").textContent === nama);
    el("selesai-lampiran").click();
  }
  wajib({});
  cek("11) tidak ada galat skrip", kesalahan.length === 0, kesalahan.slice(0, 3));
  console.log("\nLolos:", lolos, "Gagal:", gagal); process.exit(gagal ? 1 : 0);
})();
