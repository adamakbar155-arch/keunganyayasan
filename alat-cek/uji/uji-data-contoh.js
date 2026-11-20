// Uji J.27: Isi Data Contoh dan Hapus Data Contoh (PRD 6.13). Pemakaian: node uji-data-contoh.js <jalur-jsdom> <index.html>
const { JSDOM, VirtualConsole } = require(process.argv[2]);
const fs = require("fs"), path = require("path");
const html = fs.readFileSync(process.argv[3], "utf8").replace(/<script src="([^":]+\.js)"><\/script>/g, (m, p) => "<script>" + fs.readFileSync(path.join(path.dirname(process.argv[3]), p), "utf8") + "</script>").replace(/<link[^>]*>/g, "");
let lolos = 0, gagal = 0; const cek = (n, k, i) => { if (k) { lolos++; console.log("  ok    " + n); } else { gagal++; console.log("  GAGAL " + n + (i !== undefined ? " -> " + JSON.stringify(i) : "")); } };
const kesalahan = []; const vc = new VirtualConsole();
// jsdom tidak punya kanvas gambar: foto nota rekaan memang dilewati di sini (diuji di Chrome), jadi keluhan itu bukan galat aplikasi
vc.on("jsdomError", e => { const t = String(e.detail && e.detail.stack || e.detail || e.message); if (!/Not implemented: HTMLCanvasElement/.test(t)) { kesalahan.push(t); } }); vc.on("warn", m => kesalahan.push("warn: " + m));
const dom = new JSDOM(html, { runScripts: "dangerously", url: "https://uji.test/", virtualConsole: vc, pretendToBeVisual: true,
  beforeParse(w) {
    require("./bantu-sesi.js").pasang(w); /* masuk sebagai pengguna uji (J.25) */
    w.HTMLDialogElement.prototype.showModal = function () { this.open = true; }; w.HTMLDialogElement.prototype.close = function () { this.open = false; };
  } });
const w = dom.window, d = w.document, el = id => d.getElementById(id);
const daftar = k => { try { const x = JSON.parse(w.localStorage.getItem(k) || "[]"); return Array.isArray(x) ? x : []; } catch (e) { return []; } };
// Keadaan semua kunci data (selain pengguna, log, dan catatan data contoh) untuk dibandingkan sesudah Hapus
const potret = () => { const h = {}; Object.keys(w.jenisKunciCadangan).forEach(k => { if (!["daftarPengguna", "logAktivitas", "dataContoh"].includes(k)) { h[k] = w.localStorage.getItem(k); } }); return h; };

(async () => {
  try {
    const hari = w.tanggalHariIni();
    // 1) Aplikasi kosong
    cek("1) aplikasi baru: dianggap kosong, data contoh belum terisi, tombol Isi tampil", w.alasanTidakKosong() === "" && !w.dataContohTerisi() && !el("tombol-isi-contoh").hidden && el("tombol-hapus-contoh").hidden);
    const sebelum = potret();
    const hasil = await w.isiDataContoh();
    cek("2) Isi Data Contoh berhasil", hasil.ok === true, hasil.pesan);
    // 3) Jumlah data tiap fitur
    const bulanGaji = [0, 1, 2].filter(ke => w.tanggalContoh(ke, 25) <= hari).length;
    const jumlah = {
      divisi: daftar("daftarDivisi").length, program: daftar("daftarProgram").length, karyawan: daftar("daftarKaryawan").length,
      donatur: daftar("daftarDonatur").length, kategori: daftar("daftarKategoriDonasi").length, donasi: daftar("daftarDonasi").length,
      bayar: daftar("daftarPembayaran").length, terima: daftar("daftarPenerimaan").length, transfer: daftar("daftarTransfer").length,
      pindah: daftar("daftarPemindahanDana").length, gaji: daftar("daftarPencatatanGaji").length, aset: daftar("daftarAsetTetap").length,
      susut: daftar("daftarPenyusutan").length, anggaran: daftar("daftarAnggaran").length, target: daftar("daftarTargetDonasi").length,
      jurnal: daftar("daftarJurnal").length
    };
    cek("3) master: 4 Divisi, 4 Program, 4 Karyawan, 6 Donatur + Hamba Allah, 6 Kategori Donasi", jumlah.divisi === 4 && jumlah.program === 4 && jumlah.karyawan === 4 && jumlah.donatur === 7 && jumlah.kategori === 6, jumlah);
    cek("   transaksi ada di semua fitur; Pencatatan Gaji = bulan yang sudah lewat tgl 25; 2 Proses Penyusutan; 3 Anggaran; 2 Target", jumlah.donasi >= 16 && jumlah.bayar >= 10 && jumlah.terima >= 2 && jumlah.transfer >= 3 && jumlah.pindah >= 1 && jumlah.gaji === bulanGaji && jumlah.aset === 1 && jumlah.susut === 2 && jumlah.anggaran === 3 && jumlah.target === 2, jumlah);
    cek("   tidak ada transaksi bertanggal sesudah hari ini", ["daftarDonasi", "daftarPembayaran", "daftarPenerimaan", "daftarTransfer", "daftarPemindahanDana", "daftarJurnal"].every(k => daftar(k).every(x => x.tanggal <= hari)));
    // 4) Jurnal
    const jurnal = daftar("daftarJurnal");
    const seimbang = jurnal.every(j => Math.round(j.rincian.reduce((n, r) => n + (r.debit || 0), 0)) === Math.round(j.rincian.reduce((n, r) => n + (r.kredit || 0), 0)));
    cek("4) semua jurnal seimbang dan bernomor JV", seimbang && jurnal.every(j => /^JV\.\d{4}\.\d{2}\.\d{5}$/.test(j.noJurnal)));
    const punyaJurnal = (kunci, jenis) => daftar(kunci).every(x => jurnal.some(j => j.sumber && j.sumber.jenis === jenis && j.sumber.id === x.id));
    cek("   setiap transaksi punya jurnal otomatisnya (Donasi, Pembayaran, Penerimaan, Transfer, Pemindahan, Penyusutan)", punyaJurnal("daftarDonasi", "donasi") && punyaJurnal("daftarPembayaran", "pembayaran") && punyaJurnal("daftarPenerimaan", "penerimaan") && punyaJurnal("daftarTransfer", "transfer") && punyaJurnal("daftarPemindahanDana", "pemindahan") && punyaJurnal("daftarPenyusutan", "penyusutan"));
    const urutJv = jurnal.slice().sort((a, b) => a.noJurnal.localeCompare(b.noJurnal)).every((j, i, s) => i === 0 || j.noJurnal.slice(0, 10) !== s[i - 1].noJurnal.slice(0, 10) || j.tanggal >= s[i - 1].tanggal);
    cek("   Nomor JV dalam satu bulan urut menurut tanggal", urutJv);
    cek("   nomor transaksi dari aturan penomoran (contoh BKK-yymm-0001)", daftar("daftarPembayaran").every(b => /^BKK-\d{4}-\d{4}$/.test(b.nomor)), daftar("daftarPembayaran")[0].nomor);
    // 5) Saldo kas tidak minus, neraca seimbang
    let minus = "";
    w.bacaDaftarAkun().filter(a => a.tipe === "kas-bank").forEach(a => {
      const per = {}; jurnal.forEach(j => j.rincian.forEach(r => { if (r.akunId === a.id) { per[j.tanggal] = (per[j.tanggal] || 0) + (r.debit || 0) - (r.kredit || 0); } }));
      let s = Number(a.saldoAwal) || 0; Object.keys(per).sort().forEach(t => { s += per[t]; if (s < 0 && !minus) { minus = a.nama + " " + t; } });
    });
    cek("5) saldo Kas/Bank tidak pernah minus", minus === "", minus);
    const akunSaldo = w.bacaDaftarAkun().reduce((n, a) => n + (w.tipeSaldoDebit[a.tipe] ? 1 : -1) * (Number(a.saldoAwal) || 0), 0);
    cek("   saldo awal seimbang (Kas & Bank = Aset Neto Tidak Terikat)", akunSaldo === 0, akunSaldo);
    const cocok = w.cekKecocokanAset();
    cek("   Aset Tetap: cek kecocokan daftar aset = saldo akun aset", cocok && cocok.daftar === cocok.saldo, cocok);
    // 6) Gaji, lampiran, laporan Bukti Pengeluaran
    const gaji = daftar("daftarPencatatanGaji");
    cek("6) gaji yang sudah dibayar berstatus Lunas", gaji.every(g => w.statusBayarGaji(g).teks === "Lunas"), gaji.map(g => w.statusBayarGaji(g).teks));
    const isiLamp = JSON.parse(w.localStorage.getItem("lampiranJurnal") || "{}");
    const berlampiran = daftar("daftarPembayaran").filter(b => b.jumlahLampiran > 0);
    cek("   ada Pembayaran berlampiran (PDF tanda terima), isi file tersimpan, dan ada yang sengaja tanpa bukti", berlampiran.length >= 3 && berlampiran.every(b => b.lampiranInfo.every(f => /^data:application\/pdf|^data:image\/jpeg/.test((isiLamp[b.id] || {})[f.id] || ""))) && daftar("daftarPembayaran").some(b => !b.jumlahLampiran), berlampiran.length);
    const kelompok = w.kumpulkanBuktiPengeluaran({ dari: w.tanggalContoh(0, 1), sampai: hari, divisi: [], program: [] });
    const semuaT = kelompok.flatMap(g => g.transaksi);
    cek("   laporan Bukti Pengeluaran: beberapa Divisi/Program, ada bukti dan ada Belum ada bukti", kelompok.length >= 4 && semuaT.some(t => t.lampiran.length) && semuaT.some(t => !t.lampiran.length), kelompok.length);
    cek("   Dashboard dan menu Laporan bisa digambar tanpa galat", (w.gambarDashboard(), true) && (w.tampilkanLaporan(w.cariLaporanDaftar("posisi-keuangan").lap, { dari: w.tanggalContoh(0, 1), sampai: hari, divisi: [], program: [], akun: [], hanyaTotal: false, akunInduk: true, akunAnak: true }), true));
    const neraca = d.querySelector("#lap-k-isi").textContent;
    cek("   Laporan Posisi Keuangan tidak menampilkan peringatan tidak seimbang", !/tidak seimbang/i.test(neraca + d.getElementById("lap-k-catatan").textContent));
    // 7) Dicatat, dan tidak bisa diisi dua kali
    cek("7) tercatat di Log Aktivitas; tombol sekarang Hapus Data Contoh", JSON.parse(w.localStorage.getItem("logAktivitas")).some(l => l.tipe === "Data Contoh" && l.tindakan === "Isi") && (w.perbaruiTombolDataContoh(), el("tombol-isi-contoh").hidden && !el("tombol-hapus-contoh").hidden));
    const lagi = await w.isiDataContoh();
    cek("   Isi lagi saat sudah berisi: ditolak dengan pesan", lagi.ok === false && /sudah berisi data/.test(lagi.pesan), lagi.pesan);
    // 8) Hapus mengembalikan keadaan persis seperti sebelum diisi
    const hapus = w.hapusDataContoh();
    const sesudah = potret();
    const beda = Object.keys(sebelum).filter(k => sebelum[k] !== sesudah[k]);
    cek("8) Hapus Data Contoh: semua data kembali persis seperti sebelum diisi, aplikasi kosong lagi", hapus.ok && beda.length === 0 && w.alasanTidakKosong() === "" && !w.dataContohTerisi(), beda);
    cek("   pengguna tidak ikut terhapus; Hapus tercatat di Log", daftar("daftarPengguna").length > 0 && JSON.parse(w.localStorage.getItem("logAktivitas")).some(l => l.tipe === "Data Contoh" && l.tindakan === "Hapus"));
    cek("   Hapus saat data contoh tidak ada: ditolak dengan pesan", w.hapusDataContoh().ok === false);
    // 9) Data sudah berisi (data asli): ditolak; data rusak tidak membuat macet
    w.localStorage.setItem("daftarDivisi", JSON.stringify([{ id: "dx", nama: "Divisi Asli" }]));
    const tolak = await w.isiDataContoh();
    cek("9) ada Divisi buatan pengguna: Isi ditolak, data tidak berubah", tolak.ok === false && daftar("daftarDivisi").length === 1);
    w.localStorage.setItem("daftarDivisi", "[]");
    w.localStorage.setItem("dataContoh", "{rusak");
    cek("   catatan data contoh rusak: Hapus menolak dengan pesan, tidak macet", w.hapusDataContoh().ok === false && !w.dataContohTerisi());
    // 10) Gagal di tengah jalan: semua dikembalikan
    w.localStorage.removeItem("dataContoh");
    const awal2 = potret();
    const asli = w.isiJurnalTransfer;
    w.isiJurnalTransfer = () => { throw new Error("uji gagal"); };
    const gagalTengah = await w.isiDataContoh();
    w.isiJurnalTransfer = asli;
    const sesudah2 = potret();
    cek("10) gagal di tengah jalan: pesan jelas dan SEMUA data kembali seperti semula", gagalTengah.ok === false && /gagal/.test(gagalTengah.pesan) && Object.keys(awal2).every(k => awal2[k] === sesudah2[k]), Object.keys(awal2).filter(k => awal2[k] !== sesudah2[k]));
    cek("   waktu sistem kembali normal sesudah gagal", /^\d{4}-\d{2}-\d{2}T/.test(w.waktuSekarang()) && w.waktuSekarang().slice(0, 10) === hari);
  } catch (e) { kesalahan.push("uji: " + e.stack); }
  cek("11) tidak ada galat skrip", kesalahan.length === 0, kesalahan.slice(0, 3));
  console.log("\nLolos:", lolos, "Gagal:", gagal);
  dom.window.close();
  process.exit(gagal ? 1 : 0);
})();
