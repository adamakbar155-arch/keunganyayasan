// Uji Formulir Data Baru bersih (PRD 5.3a): dibuka kosong, tidak ada isian yang terisi sendiri, simpan kosong ditolak dengan pesan.
// Kelompok 1 dan 2 J.23: Pencatatan Gaji, Gaji/Tunjangan, Jurnal Umum, Pembayaran, Penerimaan, Transfer Bank,
// Pencatatan Donasi, Pemindahan Dana. Pemakaian: node uji-formulir-bersih.js <jalur-jsdom> <jalur-index.html>
const { JSDOM, VirtualConsole } = require(process.argv[2]);
const fs = require("fs"), path = require("path");
const html = fs.readFileSync(process.argv[3], "utf8").replace(/<script src="([^":]+\.js)"><\/script>/g, (m, p) => "<script>" + fs.readFileSync(path.join(path.dirname(process.argv[3]), p), "utf8") + "</script>").replace(/<link[^>]*>/g, "");
const kesalahan = [];
const vc = new VirtualConsole();
vc.on("jsdomError", (e) => kesalahan.push("jsdomError: " + (e.detail || e.message)));
const dom = new JSDOM(html, { runScripts: "dangerously", url: "https://uji.test/", virtualConsole: vc, pretendToBeVisual: true, beforeParse: require("./bantu-sesi.js").pasang }); /* masuk sebagai pengguna uji (J.25) */
const w = dom.window, d = w.document;
w.addEventListener("error", (e) => kesalahan.push("window.error: " + e.message));
w.HTMLDialogElement.prototype.showModal = function () { this.open = true; };
w.HTMLDialogElement.prototype.close = function () { this.open = false; };
let lolos = 0, gagal = 0;
const cek = (n, k, info) => { if (k) { lolos++; console.log("  ok    " + n); } else { gagal++; console.log("  GAGAL " + n + (info !== undefined ? "  -> " + JSON.stringify(info) : "")); } };
const el = (id) => d.getElementById(id);
const nilai = (ids) => ids.map(id => el(id) ? el(id).value : "(tidak ada)");
const kosongSemua = (ids) => nilai(ids).every(v => v === "");

setTimeout(() => {
  try {
    // Ada aturan penomoran untuk semua tipe, supaya terlihat bahwa aturan TIDAK dipilihkan sendiri
    const tipe = ["jurnal", "pembayaran", "penerimaan", "transfer", "donasi", "pemindahan", "gaji"];
    w.localStorage.setItem("daftarPenomoran", JSON.stringify(tipe.map((t, i) => ({ id: "n" + i, nama: "Aturan " + t, tipe: t, digit: 3, komponen: [{ jenis: "counter" }] }))));
    w.localStorage.setItem("daftarAkun", JSON.stringify([
      { id: "a0", kode: "1", nama: "Aset", tipe: "kas-bank", indukId: "" }, { id: "a1", kode: "11", nama: "Kas", tipe: "kas-bank", indukId: "a0" },
      { id: "a2", kode: "111", nama: "Kas Kecil", tipe: "kas-bank", indukId: "a1" }, { id: "b1", kode: "51", nama: "Beban Gaji", tipe: "beban", indukId: "" }
    ]));
    w.localStorage.setItem("daftarPencatatanGaji", JSON.stringify([{ id: "g0", nomor: "GJ-LAMA", nama: "GJ-LAMA", akunBebanId: "b1", tipe: "bulanan", bulan: 1, tahun: 2026, tanggal: "2026-01-31", jatuhTempo: "2026-01-31", rincian: [] }]));

    const halaman = [
      { nama: "Pencatatan Gaji", buka: () => w.modulPgaji.bukaDariMenu(), isian: ["pgaji-tipe", "pgaji-bulan", "pgaji-tahun", "pgaji-tanggal", "pgaji-jatuh-tempo", "pgaji-aturan-nomor", "pgaji-beban"], form: "form-pgaji", pesan: "pgaji-pesan-galat" },
      { nama: "Gaji/Tunjangan", buka: () => w.bukaGajiBaru(), isian: ["gaji-tipe", "gaji-bayar-potong"] },
      { nama: "Jurnal Umum", buka: () => w.modulJurnal.bukaDariMenu(), isian: ["jurnal-tanggal", "jurnal-aturan-nomor"] },
      { nama: "Pembayaran", buka: () => w.bukaPembayaranBaru(), isian: ["bayar-tanggal", "bayar-aturan-nomor", "bayar-kas"] },
      { nama: "Penerimaan", buka: () => w.trxTerima.bukaBaru(), isian: ["terima-tanggal", "terima-aturan-nomor", "terima-kas"] },
      { nama: "Transfer Bank", buka: () => w.modulTransfer.bukaDariMenu(), isian: ["transfer-tanggal", "transfer-aturan-nomor", "transfer-dari", "transfer-ke"] },
      { nama: "Pencatatan Donasi", buka: () => w.modulDonasiCatat.bukaDariMenu(), isian: ["dc-tanggal", "dc-aturan-nomor", "dc-kas", "dc-cara-bayar", "dc-donatur"] },
      { nama: "Pemindahan Dana", buka: () => w.modulPemindahanDana.bukaDariMenu(), isian: ["pd-tanggal", "pd-aturan-nomor", "pd-dari", "pd-kas-asal"] }
    ];
    halaman.forEach((h) => {
      h.buka();
      cek(h.nama + ": Data Baru dibuka kosong", kosongSemua(h.isian), nilai(h.isian));
    });
    cek("Pemindahan Dana: Jenis belum dipilih", !d.querySelector('#isi-pemindahan-dana input[name="pd-jenis"]:checked'));
    cek("Saklar Otomatis tetap menyala, contoh nomor meminta memilih aturan", el("jurnal-nomor-otomatis").checked && el("jurnal-contoh-nomor").textContent === "Pilih aturan penomoran.", el("jurnal-contoh-nomor").textContent);
    cek("Pencatatan Gaji: Akun Beban tidak mengikuti pencatatan terakhir", (w.modulPgaji.bukaDariMenu(), el("pgaji-beban").value === ""));

    // Simpan kosong ditolak dengan pesan
    const kirim = (id) => el(id).dispatchEvent(new w.Event("submit", { cancelable: true, bubbles: true }));
    w.modulPgaji.bukaDariMenu(); kirim("form-pgaji");
    cek("Pencatatan Gaji: simpan kosong ditolak 'Tipe Pembayaran wajib dipilih.'", el("pgaji-pesan-galat").textContent === "Tipe Pembayaran wajib dipilih." && JSON.parse(w.localStorage.getItem("daftarPencatatanGaji")).length === 1, el("pgaji-pesan-galat").textContent);
    w.bukaGajiBaru(); el("gaji-nama").value = "Tunjangan Uji"; kirim("form-gaji");
    cek("Gaji/Tunjangan: tanpa Tipe ditolak 'Tipe Gaji/Tunjangan wajib dipilih.'", !el("galat-gaji-tipe").hidden && el("galat-gaji-tipe").textContent === "Tipe Gaji/Tunjangan wajib dipilih." && !(JSON.parse(w.localStorage.getItem("daftarGaji") || "[]")).some(g => g.nama === "Tunjangan Uji"));
    w.modulPemindahanDana.bukaDariMenu(); kirim("form-pemindahan-dana");
    cek("Pemindahan Dana: tanpa Jenis ditolak 'Jenis pemindahan wajib dipilih.'", el("pd-pesan-galat").textContent === "Jenis pemindahan wajib dipilih.", el("pd-pesan-galat").textContent);
    w.modulJurnal.bukaDariMenu(); kirim("form-jurnal");
    cek("Jurnal Umum: simpan kosong tidak menyimpan apa pun", JSON.parse(w.localStorage.getItem("daftarJurnal") || "[]").length === 0);

    // Data yang dibuka dari daftar tetap menampilkan isinya sendiri
    w.modulPgaji.bukaUbah(JSON.parse(w.localStorage.getItem("daftarPencatatanGaji"))[0]);
    cek("Data tersimpan dibuka: isinya sendiri (tipe, bulan, tahun, tanggal, akun beban)", JSON.stringify(nilai(["pgaji-tipe", "pgaji-bulan", "pgaji-tahun", "pgaji-tanggal", "pgaji-beban"])) === JSON.stringify(["bulanan", "1", "2026", "2026-01-31", "b1"]), nilai(["pgaji-tipe", "pgaji-bulan", "pgaji-tahun", "pgaji-tanggal", "pgaji-beban"]));

    // ---- Kelompok 3: data dasar ----
    const kelompok3 = [
      { nama: "Akun Perkiraan", buka: () => w.bukaAkunBaru(), isian: ["akun-tipe", "akun-kode", "akun-tgl-saldo"] },
      { nama: "Program", buka: () => w.bukaProgramBaru(), isian: ["program-status"] },
      { nama: "Karyawan", buka: () => w.bukaKaryawanBaru(), isian: ["kar-tgl-masuk"] },
      { nama: "Target Donasi", buka: () => w.bukaTargetDonasiBaru(), isian: ["td-mulai", "td-selesai"] }
    ];
    kelompok3.forEach((h) => {
      h.buka();
      cek(h.nama + ": Data Baru dibuka kosong", kosongSemua(h.isian), nilai(h.isian));
    });
    w.bukaDonaturBaru && w.bukaDonaturBaru();
    cek("Donatur: ID Otomatis tetap tampil (dibuat aplikasi, keputusan 2026-11-09)", !!el("dn-id-otomatis") ? el("dn-id-otomatis").checked && el("dn-id").value !== "" : true, el("dn-id") && el("dn-id").value);
    const pilih = (id, v) => { el(id).value = v; el(id).dispatchEvent(new w.Event("change", { bubbles: true })); };
    const ketik = (id, v) => { el(id).value = v; el(id).dispatchEvent(new w.Event("input", { bubbles: true })); };
    const jumlahAkun = () => JSON.parse(w.localStorage.getItem("daftarAkun")).length;
    const akunAwal = jumlahAkun();
    w.bukaAkunBaru(); ketik("akun-nama", "Akun Uji"); kirim("form-akun");
    cek("Akun Perkiraan: tanpa Tipe ditolak 'Tipe Akun wajib dipilih.'", !el("galat-akun-tipe").hidden && el("galat-akun-tipe").textContent === "Tipe Akun wajib dipilih." && jumlahAkun() === akunAwal, el("galat-akun-tipe").textContent);
    pilih("akun-tipe", "beban");
    cek("Akun Perkiraan: Kode Perkiraan muncul sesudah Tipe dipilih", el("akun-kode").value !== "", el("akun-kode").value);
    ketik("akun-saldo", "1.000"); kirim("form-akun");
    cek("Akun Perkiraan: ada saldo awal tanpa tanggal ditolak", !el("galat-akun-tgl").hidden && /Tanggal saldo wajib diisi/.test(el("galat-akun-tgl").textContent) && jumlahAkun() === akunAwal, el("galat-akun-tgl").textContent);
    ketik("akun-saldo", ""); kirim("form-akun");
    cek("Akun Perkiraan: tanpa saldo awal, tanggal boleh kosong dan akun tersimpan", jumlahAkun() === akunAwal + 1);
    w.localStorage.setItem("daftarDivisi", JSON.stringify([{ id: "d1", nama: "Pendidikan" }]));
    w.bukaProgramBaru(); ketik("program-nama", "Program Uji"); pilih("program-divisi", "d1"); kirim("form-program");
    cek("Program: tanpa Status ditolak 'Status wajib dipilih.'", !el("galat-program-status").hidden && el("galat-program-status").textContent === "Status wajib dipilih." && !(JSON.parse(w.localStorage.getItem("daftarProgram") || "[]")).some(p => p.nama === "Program Uji"), el("galat-program-status").textContent + " | " + el("galat-program-divisi").textContent);
    pilih("program-status", "aktif"); kirim("form-program");
    cek("Program: Status dipilih lalu tersimpan", (JSON.parse(w.localStorage.getItem("daftarProgram") || "[]")).some(p => p.nama === "Program Uji" && p.status === "aktif"));

    // ---- Kelompok 4: aset, anggaran, pengaturan ----
    const kelompok4 = [
      { nama: "Aset Tetap", buka: () => w.modulAsetTetap.bukaDariMenu(), isian: ["aset-tanggal-beli", "aset-tanggal-pakai"] },
      { nama: "Lepas Aset", buka: () => w.modulLepasAset.bukaDariMenu(), isian: ["lepas-tanggal", "lepas-alasan"] },
      { nama: "Anggaran", buka: () => w.modulAnggaran.bukaDariMenu(), isian: ["ang-bulan", "ang-tahun", "ang-tipe"] },
      { nama: "Transfer Anggaran", buka: () => w.modulTransferAnggaran.bukaDariMenu(), isian: ["tang-tanggal", "tang-tahun", "tang-tipe", "tang-bulan-dari", "tang-bulan-ke"] },
      { nama: "Penomoran", buka: () => w.bukaPenomoranBaru(), isian: ["pn-tipe", "pn-digit", "pn-jenis"] }
    ];
    kelompok4.forEach((h) => {
      h.buka();
      cek(h.nama + ": Data Baru dibuka kosong", kosongSemua(h.isian), nilai(h.isian));
    });
    w.modulAsetTetap.bukaDariMenu();
    cek("Aset Tetap: Kode tetap dibuat aplikasi", el("aset-kode").value !== "", el("aset-kode").value);
    w.modulAnggaran.bukaDariMenu(); pilih("ang-bulan", "1"); ketik("ang-tahun", "2026"); kirim("form-anggaran");
    cek("Anggaran: tanpa Tipe ditolak 'Tipe wajib dipilih.'", el("ang-pesan-galat").textContent === "Tipe wajib dipilih.", el("ang-pesan-galat").textContent);
    w.modulTransferAnggaran.bukaDariMenu(); ketik("tang-tahun", "2026"); pilih("tang-tanggal", w.tanggalHariIni()); kirim("form-transfer-anggaran");
    cek("Transfer Anggaran: tanpa Tipe ditolak 'Tipe wajib dipilih.'", el("tang-pesan-galat").textContent === "Tipe wajib dipilih.", el("tang-pesan-galat").textContent);
    w.bukaPenomoranBaru(); ketik("pn-nama", "Aturan Uji Baru"); kirim("form-penomoran");
    cek("Penomoran: tanpa Tipe ditolak 'Tipe Transaksi wajib dipilih.'", !el("galat-pn-tipe").hidden && el("galat-pn-tipe").textContent === "Tipe Transaksi wajib dipilih.", el("galat-pn-tipe").textContent);
    el("pn-tambah").click();
    cek("Penomoran: tombol + tanpa memilih jenis komponen ditolak dengan pesan", !el("galat-pn-komponen").hidden && el("galat-pn-komponen").textContent === "Pilih jenis komponen dulu.", el("galat-pn-komponen").textContent);
    cek("Monitor Anggaran (penyaring laporan) tidak ikut kosong: Tipe dan Bulan tetap berisi", el("mang-tipe") ? el("mang-tipe").value !== "" && el("mang-bulan").value !== "" : true, el("mang-tipe") && [el("mang-tipe").value, el("mang-bulan").value]);

    cek("Tidak ada galat skrip", kesalahan.length === 0, kesalahan);
  } catch (e) { kesalahan.push("uji: " + e.stack); }
  console.log("\nLolos:", lolos, "Gagal:", gagal, "| Kesalahan skrip:", kesalahan.length ? kesalahan : "tidak ada");
  process.exit(gagal || kesalahan.length ? 1 : 0);
}, 50);
