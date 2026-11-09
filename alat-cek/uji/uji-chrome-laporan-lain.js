// Uji semua laporan selain menu (PRD 7, draf 2026-11-06) di Chrome asli, dengan akun, saldo awal, dan jurnal rekaan yang
// angkanya dihitung manual: Penghasilan Komprehensif (Pemindahan, per Divisi), Posisi Keuangan (seimbang, Ekuitas Saldo
// Awal), Perubahan Aset Neto, Arus Kas, Donasi per Program, Sisa Dana, Rincian Pengeluaran, Rincian Beban Pembayaran,
// Jurnal tanpa Lampiran, Daftar Kas dan Bank, Donasi per Divisi dan per Donatur, Neraca Saldo, Buku Besar, Laporan
// Tersimpan (simpan, buka, hapus, impor), Unduh CSV, cetak mendatar, data rusak, dan semua laporan tanpa data.
// Pemakaian: node uji-chrome-laporan-lain.js <chrome.exe> <index.html> <folder-profil> <folder-png>
const { spawn } = require("child_process");
const fs = require("fs"), path = require("path");
const [chromeExe, halaman, folderProfil, folderPng] = process.argv.slice(2);
const PORT = 9392;
const tunggu = (ms) => new Promise(r => setTimeout(r, ms));
const siapUji = require("./bantu-siap.js");   // tunggu sampai aplikasi siap sesudah muat ulang
let id = 0; const menunggu = new Map(); let ws;
const kirim = (m, p = {}) => new Promise((s, g) => { const n = ++id; menunggu.set(n, { s, g }); ws.send(JSON.stringify({ id: n, method: m, params: p })); });
const evalJs = async (e) => { const r = await kirim("Runtime.evaluate", { expression: e, returnByValue: true, awaitPromise: true }); if (r.exceptionDetails) throw new Error(JSON.stringify(r.exceptionDetails.exception ? r.exceptionDetails.exception.description : r.exceptionDetails.text) + " <<< " + e.slice(0, 120)); return r.result.value; };
const hasil = []; const catat = (n, ok, r = "") => { hasil.push(ok); console.log((ok ? "LOLOS  " : "GAGAL  ") + n + (r && !ok ? " -> " + r : "")); };
const foto = async (nama) => { const r = await kirim("Page.captureScreenshot", { format: "png" }); fs.writeFileSync(path.join(folderPng, nama), Buffer.from(r.data, "base64")); };
const klik = async (sel) => { const j = JSON.parse(await evalJs(`(function(){var e=document.querySelector(${JSON.stringify(sel)}); e.scrollIntoView({block:'center'}); var r=e.getBoundingClientRect(); return JSON.stringify({x:r.left+r.width/2,y:r.top+r.height/2});})()`)); await kirim("Input.dispatchMouseEvent", { type: "mouseMoved", x: j.x, y: j.y }); await kirim("Input.dispatchMouseEvent", { type: "mousePressed", x: j.x, y: j.y, button: "left", clickCount: 1 }); await kirim("Input.dispatchMouseEvent", { type: "mouseReleased", x: j.x, y: j.y, button: "left", clickCount: 1 }); };

const akun = (id, kode, nama, tipe, indukId, saldoAwal) => ({ id, kode, nama, tipe, indukId: indukId || "", saldoAwal: saldoAwal || 0 });
const AKUN = [
  akun("k0", "1101", "Kas & Bank", "kas-bank"),
  akun("k1", "110101", "Kas Kecil", "kas-bank", "k0", 1000000),
  Object.assign(akun("k2", "110102", "Bank BSI", "kas-bank", "k0", 4000000), { namaBank: "BSI", noRekening: "123" }),
  akun("a0", "1301", "Aset Tetap", "aset-tetap"), akun("a1", "130101", "Peralatan", "aset-tetap", "a0", 2000000),
  akun("ap0", "1401", "Akumulasi Penyusutan", "akumulasi-penyusutan"), akun("ap1", "140101", "Akum Peralatan", "akumulasi-penyusutan", "ap0", 500000),
  akun("l0", "2101", "Liabilitas Jangka Pendek", "liabilitas-pendek"), akun("l1", "210101", "Utang Gaji", "liabilitas-pendek", "l0", 300000),
  akun("lp0", "2201", "Liabilitas Jangka Panjang", "liabilitas-panjang"), akun("lp1", "220101", "Utang Bank", "liabilitas-panjang", "lp0"),
  akun("m0", "3101", "Modal", "modal"), akun("m1", "310101", "Aset Neto Tidak Terikat", "modal", "m0", 1000000), akun("m2", "310102", "Aset Neto Terikat", "modal", "m0", 200000),
  akun("p0", "4101", "Pendapatan", "pendapatan"), akun("p1", "410101", "Donasi Terikat", "pendapatan", "p0"), akun("p2", "410102", "Donasi Umum", "pendapatan", "p0"),
  akun("b0", "5101", "Beban", "beban"), akun("b1", "510101", "Beban Program", "beban", "b0"), akun("b2", "510102", "Beban Gaji", "beban", "b0")
];
const r = (akunId, debit, kredit, ekstra) => Object.assign({ akunId, debit, kredit, nama: (AKUN.find(a => a.id === akunId) || {}).nama }, ekstra || {});
const j = (id, tanggal, sumber, rincian, ekstra) => Object.assign({ id, nomor: id.toUpperCase(), nama: id.toUpperCase(), tanggal, keterangan: "Jurnal " + id, sumber, rincian, dibuatPada: tanggal + "T08:00:00", jumlahLampiran: 0 }, ekstra || {});
const JURNAL = [
  j("j0", "2026-09-20", { jenis: "donasi", id: "dn0" }, [r("k1", 400000, 0), r("p2", 0, 400000, { divisiId: "d2", terikat: false })]),
  j("j1", "2026-10-05", { jenis: "donasi", id: "dn1" }, [r("k2", 10000000, 0), r("p1", 0, 10000000, { divisiId: "d1", programId: "pr1", terikat: true })]),
  j("j2", "2026-10-06", { jenis: "donasi", id: "dn2" }, [r("k1", 2000000, 0), r("p2", 0, 2000000, { divisiId: "d2", terikat: false })]),
  j("j3", "2026-10-10", { jenis: "pembayaran", id: "py1" }, [r("b1", 6000000, 0, { divisiId: "d1", programId: "pr1", terikat: true, keterangan: "Beli buku", penanggung: "Budi" }), r("k2", 0, 6000000)]),
  j("j4", "2026-10-12", undefined, [r("b2", 500000, 0, { divisiId: "d2", terikat: false, keterangan: "Gaji Oktober" }), r("k1", 0, 500000)], { jumlahLampiran: 1 }),
  j("j5", "2026-10-15", { jenis: "transfer", id: "tf1" }, [r("k2", 100000, 0), r("k1", 0, 100000)]),
  j("j6", "2026-10-20", { jenis: "pemindahan", id: "pd1" }, [r("m2", 1000000, 0, { divisiId: "d1", programId: "pr1", terikat: true }), r("m1", 0, 1000000, { terikat: false }), r("k1", 1000000, 0), r("k2", 0, 1000000)]),
  j("j7", "2026-10-22", undefined, [r("k2", 3000000, 0), r("lp1", 0, 3000000)]),
  j("j8", "2026-10-25", { jenis: "pembayaran", id: "py2" }, [r("a1", 700000, 0, { keterangan: "Beli printer" }), r("k2", 0, 700000)]),
  j("j9", "2026-10-28", undefined, [r("k1", 50000, 0), r("m1", 0, 50000, { terikat: false })]),
  j("j10", "2026-11-02", { jenis: "donasi", id: "dn3" }, [r("k1", 999, 0), r("p2", 0, 999, { divisiId: "d2" })]),
  // data rusak
  null, j("j11", "rusak", undefined, [r("p2", 0, 777)]), j("j12", "2026-10-28", undefined, [null, "x", { akunId: "tidak-ada", kredit: 77 }])
];
const DONASI = [
  { id: "dn1", nomor: "DN1", tanggal: "2026-10-05", donaturId: "dt1", rincian: [{ nama: "Donasi Terikat", nilai: 10000000, divisiId: "d1", programId: "pr1" }] },
  { id: "dn2", nomor: "DN2", tanggal: "2026-10-06", donaturId: "dt2", rincian: [{ nama: "Donasi Umum", nilai: 2000000, divisiId: "d2" }] },
  { id: "dn3", nomor: "DN3", tanggal: "2026-11-02", donaturId: "dt2", rincian: [{ nama: "Donasi Umum", nilai: 999, divisiId: "d2" }] },
  { id: "dn9", nomor: "DN9", tanggal: "2026-10-07", donaturId: "dt2", rincian: "rusak" }
];
const simpan = (k, v) => "localStorage.setItem(" + JSON.stringify(k) + ", " + JSON.stringify(JSON.stringify(v)) + ");";

(async () => {
  fs.mkdirSync(folderPng, { recursive: true });
  const galat = [];
  const chrome = spawn(chromeExe, ["--headless=new", "--disable-gpu", "--no-first-run", "--remote-debugging-port=" + PORT, "--user-data-dir=" + folderProfil, "--window-size=1366,900", "file:///" + halaman.replace(/\\/g, "/")], { stdio: "ignore" });
  try {
    let t = null;
    for (let i = 0; i < 60 && !t; i++) { await tunggu(250); try { t = (await (await fetch("http://127.0.0.1:" + PORT + "/json/list")).json()).find(x => x.type === "page" && x.url.startsWith("file:")); } catch (e) { /* belum siap */ } }
    ws = new WebSocket(t.webSocketDebuggerUrl); await new Promise((s, g) => { ws.onopen = s; ws.onerror = g; });
    ws.onmessage = (m) => { const d = JSON.parse(m.data); if (d.method === "Runtime.exceptionThrown") { const x = d.params.exceptionDetails; galat.push(x.exception ? x.exception.description : x.text + " " + (x.url || "") + ":" + x.lineNumber); } if (d.method === "Runtime.consoleAPICalled" && ["error", "warning"].includes(d.params.type)) galat.push(d.params.args.map(a => a.value).join(" ")); if (d.id && menunggu.has(d.id)) { const p = menunggu.get(d.id); menunggu.delete(d.id); d.error ? p.g(new Error(JSON.stringify(d.error))) : p.s(d.result); } };
    await kirim("Runtime.enable"); await kirim("Page.enable"); await require("./bantu-sesi.js").masukChrome(kirim, "file:///" + halaman.replace(/\\/g, "/")); /* masuk sebagai pengguna uji (J.25) */ await kirim("DOM.enable");
    await kirim("Emulation.setDeviceMetricsOverride", { width: 1366, height: 900, deviceScaleFactor: 1, mobile: false });
    await tunggu(800);
    await evalJs("localStorage.clear(); " + simpan("daftarAkun", AKUN) + simpan("daftarJurnal", JURNAL) + simpan("daftarDonasi", DONASI) +
      simpan("daftarDonatur", [{ id: "dt1", nama: "Budi" }, { id: "dt2", nama: "Ani" }]) + simpan("daftarDivisi", [{ id: "d1", nama: "Pendidikan" }, { id: "d2", nama: "Kesehatan" }]) +
      simpan("daftarProgram", [{ id: "pr1", nama: "Beasiswa", divisiId: "d1", status: "aktif" }]) + simpan("dataYayasan", { nama: "Yayasan Contoh Peduli" }) +
      simpan("akunPerkiraanYayasan", { asetNetoTerikat: ["310102"], asetNetoTidakTerikat: ["310101"] }) + simpan("daftarLaporanTersimpan", [null, { nama: "rusak" }, { nama: "x", laporanId: "tidak-ada", param: {} }]) + " true");
    // Menunggu sampai halaman benar-benar siap, bukan waktu tetap: di komputer yang sedang sibuk skrip lebih lambat dimuat
    const muatUlang = async () => { await kirim("Page.reload"); await siapUji(evalJs, tunggu); for (let i = 0; i < 100; i++) { if (await evalJs("document.readyState==='complete' && typeof tampilkanLaporan==='function'")) { break; } await tunggu(200); } await tunggu(200); };
    await muatUlang();

    // Gambar laporan langsung dari daftarnya; hasilnya baris-baris tabel di kertas
    const PARAM = "{dari:'2026-10-01',sampai:'2026-10-31',divisi:[],program:[],akun:[],hanyaTotal:false,akunInduk:true,akunAnak:true}";
    const bacaPdfLaporan = async () => Buffer.from(await evalJs("susunPdfLaporan().blob().arrayBuffer().then(function(b){var u=new Uint8Array(b),s=''; for(var i=0;i<u.length;i++){s+=String.fromCharCode(u[i]);} return btoa(s);})"), "base64");
    const laporan = async (idLap, ubah) => {
      await evalJs("(function(){var p=" + PARAM + "; " + (ubah || "") + " tampilkanLaporan(cariLaporanDaftar(" + JSON.stringify(idLap) + ").lap, p); return true;})()"); await tunggu(120);
      return evalJs("(function(){var t=document.querySelector('#lap-k-isi table'); if(!t){return [document.getElementById('lap-k-isi').textContent];} return [...t.tBodies[0].rows].map(function(x){return [...x.cells].map(function(c){return c.textContent;}).join('|');});})()");
    };
    const sama = (nama, a, b) => catat(nama, JSON.stringify(a) === JSON.stringify(b), JSON.stringify(a));
    const kepala = () => evalJs("[...document.querySelectorAll('#lap-k-isi thead th')].map(function(c){return c.textContent;}).join('|')");
    const catatan = () => evalJs("document.getElementById('lap-k-catatan').textContent");

    sama("Penghasilan Komprehensif: Surplus, baris Pemindahan, TOTAL PENGHASILAN KOMPREHENSIF", await laporan("penghasilan-komprehensif"), [
      "PENERIMAAN|||", "Donasi Terikat|10.000.000|-|10.000.000", "Donasi Umum|-|2.000.000|2.000.000", "JUMLAH PENERIMAAN|10.000.000|2.000.000|12.000.000",
      "BEBAN|||", "Beban Program|6.000.000|-|6.000.000", "Beban Gaji|-|500.000|500.000", "JUMLAH BEBAN|6.000.000|500.000|6.500.000",
      "SURPLUS (DEFISIT)|4.000.000|1.500.000|5.500.000", "Pemindahan sisa program ke Dana Umum|(1.000.000)|1.000.000|-", "TOTAL PENGHASILAN KOMPREHENSIF|3.000.000|2.500.000|5.500.000"]);
    await foto("lap-penghasilan.png");
    sama("Penghasilan Komprehensif per Divisi: kolom per Divisi + Total, Pemindahan Dana mengurangi Divisi asal", await laporan("penghasilan-komprehensif", "p.divisi=['d1','d2'];"), [
      "PENERIMAAN|||", "Donasi Terikat|10.000.000|-|10.000.000", "Donasi Umum|-|2.000.000|2.000.000", "JUMLAH PENERIMAAN|10.000.000|2.000.000|12.000.000",
      "BEBAN|||", "Beban Program|6.000.000|-|6.000.000", "Beban Gaji|-|500.000|500.000", "JUMLAH BEBAN|6.000.000|500.000|6.500.000",
      "SURPLUS (DEFISIT)|4.000.000|1.500.000|5.500.000", "Pemindahan Dana|(1.000.000)|-|(1.000.000)", "TOTAL PENGHASILAN KOMPREHENSIF|3.000.000|1.500.000|4.500.000"]);
    catat("Per Divisi: judul kolom nama Divisi + Total", await kepala() === "Keterangan|Pendidikan|Kesehatan|Total", await kepala());

    sama("Penghasilan per Divisi tanpa pilihan: semua Divisi yang ada transaksinya jadi kolom", await laporan("penghasilan-per-divisi"), [
      "PENERIMAAN|||", "Donasi Terikat|-|10.000.000|10.000.000", "Donasi Umum|2.000.000|-|2.000.000", "JUMLAH PENERIMAAN|2.000.000|10.000.000|12.000.000",
      "BEBAN|||", "Beban Program|-|6.000.000|6.000.000", "Beban Gaji|500.000|-|500.000", "JUMLAH BEBAN|500.000|6.000.000|6.500.000",
      "SURPLUS (DEFISIT)|1.500.000|4.000.000|5.500.000", "Pemindahan Dana|-|(1.000.000)|(1.000.000)", "TOTAL PENGHASILAN KOMPREHENSIF|1.500.000|3.000.000|4.500.000"]);
    catat("Penghasilan per Divisi: judul kolom urut nama + Total", await kepala() === "Keterangan|Kesehatan|Pendidikan|Total", await kepala());
    sama("Penghasilan per Program: kolom Program, Tanpa Program paling kanan, + Total", await laporan("penghasilan-per-program"), [
      "PENERIMAAN|||", "Donasi Terikat|10.000.000|-|10.000.000", "Donasi Umum|-|2.000.000|2.000.000", "JUMLAH PENERIMAAN|10.000.000|2.000.000|12.000.000",
      "BEBAN|||", "Beban Program|6.000.000|-|6.000.000", "Beban Gaji|-|500.000|500.000", "JUMLAH BEBAN|6.000.000|500.000|6.500.000",
      "SURPLUS (DEFISIT)|4.000.000|1.500.000|5.500.000", "Pemindahan Dana|(1.000.000)|1.000.000|-", "TOTAL PENGHASILAN KOMPREHENSIF|3.000.000|2.500.000|5.500.000"]);
    catat("Penghasilan per Program: judul kolom", await kepala() === "Keterangan|Beasiswa|Tanpa Program|Total", await kepala());
    await foto("lap-per-program.png");
    catat("Baris induk berisi jumlah, tanpa baris Jumlah induk", await evalJs("(function(){var h=susunBarisAkun({akun:[{id:'i',kode:'51',nama:'Induk',tipe:'beban',indukId:''},{id:'a',kode:'5101',nama:'A',tipe:'beban',indukId:'i'},{id:'b',kode:'5102',nama:'B',tipe:'beban',indukId:'i'}], kolom:1, indukBerangka:true, masuk:function(){return true;}, nilai:function(id){return id==='i'?[]:[5];}, param:{}}); return h.baris.map(function(b){return b.nama+'='+(b.nilai?b.nilai[0]:'');}).join();})()") === "Induk=10,A=5,B=5");
    const pk = ["ASET|", "Kas & Bank|", "Kas Kecil|3.850.000", "Bank BSI|9.400.000", "Jumlah Kas & Bank|13.250.000", "Aset Tetap|", "Peralatan|2.700.000", "Akumulasi Penyusutan|", "Akum Peralatan|(500.000)", "JUMLAH ASET|15.450.000",
      "LIABILITAS|", "Liabilitas Jangka Pendek|", "Utang Gaji|300.000", "Liabilitas Jangka Panjang|", "Utang Bank|3.000.000", "JUMLAH LIABILITAS|3.300.000",
      "ASET NETO|", "Tanpa pembatasan|8.950.000", "Dengan pembatasan|3.200.000", "JUMLAH ASET NETO|12.150.000", "JUMLAH LIABILITAS DAN ASET NETO|15.450.000"];
    sama("Posisi Keuangan: seimbang (Aset = Liabilitas + Aset Neto), Akumulasi Penyusutan sebagai pengurang", await laporan("posisi-keuangan"), pk);
    catat("Posisi Keuangan: Ekuitas Saldo Awal disebut, tanpa peringatan tidak seimbang", /Ekuitas Saldo Awal 5\.000\.000/.test(await catatan()) && !/tidak seimbang/.test(await catatan()), await catatan());
    await foto("lap-posisi.png");
    sama("Posisi Keuangan: tanggal Dari tidak mengubah angka", await laporan("posisi-keuangan", "p.dari='2026-10-30';"), pk);

    sama("Perubahan Aset Neto: Saldo akhir sama dengan Aset Neto di Posisi Keuangan", await laporan("perubahan-aset-neto"), [
      "Saldo awal, 30 Sep 2026|200.000|6.400.000|6.600.000", "Surplus (Defisit)|4.000.000|1.500.000|5.500.000", "Pemindahan sisa program ke Dana Umum|(1.000.000)|1.000.000|-",
      "Perubahan langsung aset neto|-|50.000|50.000", "Saldo akhir, 31 Okt 2026|3.200.000|8.950.000|12.150.000"]);
    sama("Arus Kas: tiga aktivitas; transfer dan pasangan kas Pemindahan Dana tidak ikut; Kas akhir = Daftar Kas dan Bank", await laporan("arus-kas"), [
      "AKTIVITAS OPERASI|", "Donasi Terikat|10.000.000", "Donasi Umum|2.000.000", "Beban Program|(6.000.000)", "Beban Gaji|(500.000)", "Kas bersih dari aktivitas operasi|5.500.000",
      "AKTIVITAS INVESTASI|", "Aset Tetap|", "Peralatan|(700.000)", "Kas bersih dari aktivitas investasi|(700.000)",
      "AKTIVITAS PENDANAAN|", "Liabilitas Jangka Panjang|", "Utang Bank|3.000.000", "Modal|", "Aset Neto Tidak Terikat|50.000", "Kas bersih dari aktivitas pendanaan|3.050.000",
      "KENAIKAN (PENURUNAN) KAS|7.850.000", "Kas awal periode|5.400.000", "KAS AKHIR PERIODE|13.250.000"]);
    catat("Arus Kas: tanpa peringatan selisih", await catatan() === "", await catatan());
    await foto("lap-arus-kas.png");

    sama("Donasi per Program: dikelompokkan per Divisi, Tanpa Program, Dana Umum paling bawah, TOTAL", await laporan("donasi-per-program"), [
      "Kesehatan|||||", "Tanpa Program|400.000|2.000.000|500.000|-|1.900.000", "Pendidikan|||||", "Beasiswa|-|10.000.000|6.000.000|(1.000.000)|3.000.000",
      "Dana Umum|-|-|-|1.050.000|1.050.000", "TOTAL|400.000|12.000.000|6.500.000|50.000|5.950.000"]);
    await foto("lap-donasi-program.png");
    sama("Donasi per Program, filter Program Beasiswa", await laporan("donasi-per-program", "p.program=['pr1'];"), ["Pendidikan|||||", "Beasiswa|-|10.000.000|6.000.000|(1.000.000)|3.000.000", "TOTAL|-|10.000.000|6.000.000|(1.000.000)|3.000.000"]);
    sama("Sisa Dana per Program per 31 Okt: Dengan, Tanpa, Jumlah", await laporan("sisa-dana-program"), ["Kesehatan|||", "Tanpa Program|-|1.900.000|1.900.000", "Pendidikan|||", "Beasiswa|3.000.000|-|3.000.000", "Dana Umum|-|1.050.000|1.050.000", "TOTAL|3.000.000|2.950.000|5.950.000"]);

    sama("Rincian Pengeluaran: pembelian dan pengeluaran dari Jurnal Umum dan Pembayaran (beban dan beli aset), urut tanggal, Sumber, Keterangan; donasi, transfer, dan pemindahan tidak ikut", await laporan("rincian-pengeluaran"), [
      "10 Okt 2026|J3|Pembayaran|510101 Beban Program|Beli buku|Beasiswa|Pendidikan|Budi|6.000.000", "12 Okt 2026|J4|Jurnal Umum|510102 Beban Gaji|Gaji Oktober||Kesehatan||500.000",
      "25 Okt 2026|J8|Pembayaran|130101 Peralatan|Beli printer||||700.000", "Total|7.200.000"]);
    catat("Rincian Pengeluaran: Kredit akun beban = koreksi minus; Debit Kas/Bank dan Kredit akun lain tidak ikut; keterangan kosong memakai keterangan umum", await evalJs("(function(){var j={keterangan:'Umum'}; return barisPengeluaranLaporan({debit:0,kredit:5},{tipe:'beban'},j) && !barisPengeluaranLaporan({debit:5,kredit:0},{tipe:'kas-bank'},j) && !barisPengeluaranLaporan({debit:0,kredit:5},{tipe:'liabilitas-panjang'},j) && barisPengeluaranLaporan({debit:5,kredit:0},{tipe:'liabilitas-pendek'},j) && !barisPengeluaranLaporan({debit:5,kredit:0},{tipe:'beban'},{sumber:{jenis:'donasi'}});})()"));
    await foto("lap-rincian.png");
    const pdf = await bacaPdfLaporan();
    const kotak = /\/MediaBox\s*\[\s*0 0 ([\d.]+) ([\d.]+)/.exec(pdf.toString("latin1"));
    catat("Rincian Pengeluaran dicetak mendatar (lebar kertas lebih besar dari tingginya)", !!kotak && Number(kotak[1]) > Number(kotak[2]), kotak ? kotak[0] : "tidak terbaca");
    sama("Rincian Pengeluaran, filter Akun Beban Gaji", (await laporan("rincian-pengeluaran", "p.akun=['b2'];")).length, 2);
    sama("Rincian Beban Pembayaran: baris selain Kas/Bank dari Pembayaran dengan Kas/Bank-nya", await laporan("rincian-beban-pembayaran"), [
      "10 Okt 2026|J3|Bank BSI|510101 Beban Program|Beli buku|Pendidikan|Beasiswa|6.000.000", "25 Okt 2026|J8|Bank BSI|130101 Peralatan|Beli printer|||700.000", "Total|6.700.000"]);
    const jl = await laporan("jurnal-tanpa-lampiran");
    // J12 barisnya rusak tetapi tanggalnya sah: tetap tampil supaya kelihatan, nilainya "-"; J11 bertanggal rusak tidak ikut
    catat("Jurnal tanpa Lampiran: 9 jurnal Oktober + Total, J4 yang berlampiran dan J11 bertanggal rusak tidak ikut", jl.length === 10 && !jl.some(b => /\|J(4|11)\|/.test(b)) && jl[9] === "Total|23.850.000", JSON.stringify(jl));
    catat("Jurnal tanpa Lampiran: Sumber menyebut formulir asal", jl[0] === "5 Okt 2026|J1|Pencatatan Donasi|Jurnal j1|10.000.000" && jl.some(b => /\|Jurnal Umum\|/.test(b)), JSON.stringify(jl));

    sama("Daftar Kas dan Bank per 31 Okt", await laporan("daftar-kas-bank"), ["110101|Kas Kecil|||3.850.000", "110102|Bank BSI|BSI|123|9.400.000", "Total|13.250.000"]);
    sama("Penerimaan Donasi per Divisi", await laporan("donasi-per-divisi"), ["Kesehatan|-|2.000.000|2.000.000", "Pendidikan|10.000.000|-|10.000.000", "JUMLAH DONASI|10.000.000|2.000.000|12.000.000"]);
    sama("Rincian per Donasi (seperti foto Accurate): kelompok Kategori Donasi, Tanggal, Nilai, Nama Donatur, jumlah tiap kelompok, Total", await laporan("rincian-per-donasi"), [
      "Donasi Terikat", "5 Okt 2026|10.000.000|Budi", "|10.000.000|", "Donasi Umum", "6 Okt 2026|2.000.000|Ani", "|2.000.000|", "Total|12.000.000|"]);
    await foto("lap-rincian-donasi.png");
    sama("Rincian Donasi per Donatur: per donatur, Jumlah, Total; data rusak dilewati", await laporan("donasi-per-donatur"), [
      "Ani", "6 Okt 2026|DN2|Donasi Umum|Kesehatan||2.000.000", "Jumlah Ani|2.000.000", "Budi", "5 Okt 2026|DN1|Donasi Terikat|Pendidikan|Beasiswa|10.000.000", "Jumlah Budi|10.000.000", "Total|12.000.000"]);
    sama("Neraca Saldo: total Debit = Kredit, saldo minus pindah sisi, Ekuitas Saldo Awal", await laporan("neraca-saldo"), [
      "110101|Kas Kecil|3.850.000|-", "110102|Bank BSI|9.400.000|-", "130101|Peralatan|2.700.000|-", "140101|Akum Peralatan|-|500.000", "210101|Utang Gaji|-|300.000", "220101|Utang Bank|-|3.000.000",
      "310101|Aset Neto Tidak Terikat|-|2.050.000", "310102|Aset Neto Terikat|800.000|-", "410101|Donasi Terikat|-|10.000.000", "410102|Donasi Umum|-|2.400.000", "510101|Beban Program|6.000.000|-", "510102|Beban Gaji|500.000|-",
      "|Ekuitas Saldo Awal|-|5.000.000", "Total|23.250.000|23.250.000"]);
    sama("Buku Besar akun Kas Kecil: Saldo Awal, transaksi, Saldo Akhir", await laporan("buku-besar-akun", "p.akun=['k1'];"), [
      "110101 Kas Kecil", "|||Saldo Awal|||1.400.000", "6 Okt 2026|J2|Pencatatan Donasi|Jurnal j2|2.000.000|-|3.400.000", "12 Okt 2026|J4|Jurnal Umum|Jurnal j4|-|500.000|2.900.000",
      "15 Okt 2026|J5|Transfer Bank|Jurnal j5|-|100.000|2.800.000", "20 Okt 2026|J6|Pemindahan Dana|Jurnal j6|1.000.000|-|3.800.000", "28 Okt 2026|J9|Jurnal Umum|Jurnal j9|50.000|-|3.850.000", "|||Saldo Akhir|||3.850.000"]);
    // Bukti Pengeluaran (PRD 5.4): definisi sama dengan Rincian Pengeluaran, dikelompokkan Divisi lalu Program; tanpa lampiran = Belum ada bukti
    sama("Bukti Pengeluaran: Divisi > Program > transaksi, Jumlah per Program/Divisi, TOTAL, 'Tanpa Divisi' paling bawah", await laporan("bukti-pengeluaran"), [
      "Divisi: Kesehatan", "Program: Tanpa Program", "12 Okt 2026|J4|Jurnal Umum|Jurnal j4|500.000|Belum ada bukti", "Jumlah Tanpa Program|500.000|", "Jumlah Divisi Kesehatan|500.000|",
      "Divisi: Pendidikan", "Program: Beasiswa", "10 Okt 2026|J3|Pembayaran|Jurnal j3|6.000.000|Belum ada bukti", "Jumlah Beasiswa|6.000.000|", "Jumlah Divisi Pendidikan|6.000.000|",
      "Divisi: Tanpa Divisi", "Program: Tanpa Program", "25 Okt 2026|J8|Pembayaran|Jurnal j8|700.000|Belum ada bukti", "Jumlah Tanpa Program|700.000|", "Jumlah Divisi Tanpa Divisi|700.000|", "TOTAL|7.200.000|"]);
    catat("Bukti Pengeluaran: tombol Lampiran audit tampil; catatan jumlah yang belum ada bukti", await evalJs("!document.getElementById('lap-cetak-audit').hidden") && /3 transaksi belum ada bukti/.test(await catatan()), await catatan());
    await laporan("rincian-pengeluaran");
    catat("Laporan lain: tombol Lampiran audit tersembunyi", await evalJs("document.getElementById('lap-cetak-audit').hidden"));
    const semuaBb = await laporan("buku-besar-akun");
    catat("Buku Besar tanpa pilihan: semua akun yang punya saldo awal atau transaksi", semuaBb.filter(b => !b.includes("|")).length === 12 && !semuaBb.includes("1101 Kas & Bank"), semuaBb.filter(b => !b.includes("|")).join(", "));

    // Ikon Parameter di semua laporan: jendela terbuka dengan nama laporan dan isian yang sedang dipakai
    const semuaId = await evalJs("(function(){var k=[]; DAFTAR_LAPORAN.forEach(function(x){x.kelompok.forEach(function(g){g.laporan.forEach(function(l){k.push(l.id);});});}); return k;})()");
    let parameterBaik = 0;
    for (const idLap of semuaId) {
      await laporan(idLap, "p.dari='2026-09-15';");
      await klik("#lap-ubah-parameter"); await tunggu(120);
      if (await evalJs("document.getElementById('dialog-parameter-laporan').open && document.getElementById('param-nama-laporan').textContent===cariLaporanDaftar(" + JSON.stringify(idLap) + ").lap.nama && document.getElementById('param-dari').value==='2026-09-15'")) { parameterBaik++; }
      await evalJs("document.getElementById('dialog-parameter-laporan').close(); true");
    }
    catat("Ikon Parameter membuka jendela di ke-24 laporan, dengan nama laporan dan tanggal yang sedang dipakai", semuaId.length === 24 && parameterBaik === 24, parameterBaik + " dari " + semuaId.length);
    // Ke-24 laporan: setiap teks di tabel layar ada di PDF, dan setiap halaman punya kaki
    const dariHeksa = (h) => h.match(/../g).map(c => String.fromCharCode(parseInt(c, 16))).join("");
    let pdfUtuh = 0, kurang = "";
    for (const id of semuaId) {
      await laporan(id);
      const sel = await evalJs("[...document.querySelectorAll('#lap-k-isi td, #lap-k-isi th')].map(function(c){return c.textContent.trim();}).filter(Boolean)");
      const mentah = (await bacaPdfLaporan()).toString("latin1");
      const teks = [...mentah.matchAll(/<([0-9A-F]+)> Tj/g)].map(m => dariHeksa(m[1])).join("").replace(/\s/g, "");
      const tiada = sel.filter(s => !teks.includes(s.replace(/\s/g, "")));
      const halaman = (mentah.match(/\/Type \/Page /g) || []).length;
      const nomorLengkap = Array.from({ length: halaman }, (x, i) => teks.includes("Halaman" + (i + 1) + "dari" + halaman)).every(Boolean);
      if (!tiada.length && nomorLengkap) { pdfUtuh++; } else if (!kurang) { kurang = id + ": " + JSON.stringify(tiada.slice(0, 4)) + " nomor " + nomorLengkap; }
    }
    catat("PDF ke-24 laporan: semua isi tabel ada, tiap halaman bernomor", pdfUtuh === 24, pdfUtuh + " dari 24. " + kurang);
    catat("Bilah ikon: nama muncul saat disentuh; Parameter, Modifikasi, Cetak, Simpan Laporan, Unduh (Lampiran audit hanya untuk Bukti Pengeluaran)", await evalJs("[...document.querySelectorAll('.lap-hasil-alat .lap-alat')].filter(function(b){return !b.hidden;}).map(function(b){return b.dataset.tooltip;}).join('|')") === "Parameter|Modifikasi|Cetak|Simpan Laporan|Unduh");

    // Modifikasi, tab Halaman: bawaan, simpan per laporan, berlaku di layar dan cetak
    const buatPdf = async () => { const b = await bacaPdfLaporan(); const k = /\/MediaBox\s*\[\s*0 0 ([\d.]+) ([\d.]+)/.exec(b.toString("latin1")); return { lebarMm: Math.round(Number(k[1]) * 25.4 / 72), tinggiMm: Math.round(Number(k[2]) * 25.4 / 72), halaman: (b.toString("latin1").match(/\/Type\s*\/Page[^s]/g) || []).length }; };
    await laporan("arus-kas");
    await klik("#lap-modifikasi"); await tunggu(200);
    catat("Modifikasi: bawaan A4, Tegak, tidak fleksibel, margin 10 mm", await evalJs("document.getElementById('dialog-modifikasi-laporan').open && document.getElementById('mod-kertas').value==='A4' && document.querySelector('input[name=mod-orientasi]:checked').value==='tegak' && !document.getElementById('mod-fleksibel').checked && document.getElementById('mod-kiri').value==='10' && document.getElementById('mod-bawah').value==='10'"));
    await foto("lap-modifikasi.png");
    const pdfA4 = await buatPdf();
    catat("Cetak bawaan: A4 tegak", pdfA4.lebarMm === 210 && pdfA4.tinggiMm === 297, JSON.stringify(pdfA4));
    await evalJs("document.getElementById('mod-kiri').value='99'; true"); await klik("#simpan-modifikasi-laporan"); await tunggu(150);
    catat("Modifikasi: margin di luar 0 sampai 50 ditolak", await evalJs("document.getElementById('dialog-modifikasi-laporan').open && !document.getElementById('galat-modifikasi').hidden"));
    await evalJs("document.getElementById('mod-kertas').value='F4'; document.querySelector('input[name=mod-orientasi][value=mendatar]').checked=true; document.getElementById('mod-kiri').value='20'; true");
    await klik("#simpan-modifikasi-laporan"); await tunggu(200);
    const layarF4 = JSON.parse(await evalJs("JSON.stringify({lebar:Math.round(document.getElementById('lap-kertas').getBoundingClientRect().width), kiri:getComputedStyle(document.getElementById('lap-kertas')).paddingLeft, simpan:kertasLaporanAktif.modifikasi})"));
    catat("Modifikasi F4 mendatar, kiri 20: kertas di layar berubah (lebar 330 mm dibatasi layar), tidak menulis ke penyimpanan", layarF4.kiri === "76px" && layarF4.simpan.kertas === "F4" && layarF4.lebar > 1000, JSON.stringify(layarF4));
    const pdfF4 = await buatPdf();
    catat("Cetak mengikuti Modifikasi: F4 mendatar 330 x 215 mm", pdfF4.lebarMm === 330 && pdfF4.tinggiMm === 215, JSON.stringify(pdfF4));
    await laporan("posisi-keuangan");
    catat("Laporan lain tidak ikut berubah: A4", await evalJs("kertasLaporanAktif.halaman.kertas==='A4' && kertasLaporanAktif.halaman.kiri===10"));
    await klik("#lap-modifikasi"); await tunggu(200);
    await evalJs("document.getElementById('mod-fleksibel').checked=true; true"); await klik("#simpan-modifikasi-laporan"); await tunggu(200);
    const pdfFleks = await buatPdf();
    catat("Tinggi kertas fleksibel: satu halaman setinggi isi", pdfFleks.halaman === 1 && pdfFleks.tinggiMm !== 297 && pdfFleks.lebarMm === 210, JSON.stringify(pdfFleks));
    await laporan("arus-kas");
    catat("Dibuka lagi tanpa Simpan Laporan: Modifikasi kembali ke bawaan A4 tegak, margin 10", await evalJs("kertasLaporanAktif.halaman.kertas==='A4' && kertasLaporanAktif.halaman.orientasi==='tegak' && kertasLaporanAktif.halaman.kiri===10 && kertasLaporanAktif.modifikasi===null"));
    catat("Modifikasi tidak menulis ke penyimpanan browser", await evalJs("localStorage.getItem('pengaturanHalamanLaporan')===null"));
    await evalJs("(function(){tampilkanLaporan(cariLaporanDaftar('arus-kas').lap, " + PARAM + ", {kertas:'constructor', orientasi:'miring', kiri:'<b>', kanan:999, fleksibel:'ya', kolomSembunyi:[5,null,'Jumlah']}); return true;})()"); await tunggu(120);
    catat("Modifikasi rusak (dari berkas impor) diganti bawaan, hanya teks yang dipakai, tidak macet", await evalJs("(function(){var h=kertasLaporanAktif.halaman; return h.kertas==='A4' && h.orientasi==='tegak' && h.kiri===10 && h.kanan===10 && h.fleksibel===false && kolomSembunyiLaporan.join()==='Jumlah';})()"));

    // Modifikasi, tab Kolom Data: menyembunyikan dan menampilkan kolom, berlaku per laporan
    await laporan("penghasilan-komprehensif");
    await klik("#lap-modifikasi"); await tunggu(200);
    const kolomMod = JSON.parse(await evalJs("JSON.stringify([...document.querySelectorAll('#mod-daftar-kolom label')].map(function(l){return l.textContent+(l.querySelector('input').disabled?'*':'')+(l.querySelector('input').checked?'+':'-');}))"));
    catat("Kolom Data: daftar kolom laporan, kolom pertama terkunci, semua tercentang, tab Kolom Data terbuka lebih dulu", JSON.stringify(kolomMod) === JSON.stringify(["Keterangan*+", "Dengan pembatasan+", "Tanpa pembatasan+", "Jumlah+"]) && await evalJs("!document.getElementById('mod-panel-kolom').hidden && document.getElementById('mod-panel-halaman').hidden"), JSON.stringify(kolomMod));
    await foto("lap-kolom-data.png");
    await evalJs("document.querySelector('#mod-daftar-kolom input[data-judul=\"Tanpa pembatasan\"]').checked=false; true");
    await klik("#simpan-modifikasi-laporan"); await tunggu(250);
    catat("Sembunyikan Tanpa pembatasan: kolom hilang dari tabel, angka kolom lain tetap", await kepala() === "Keterangan|Dengan pembatasan|Jumlah" && (await evalJs("[...document.querySelectorAll('#lap-k-isi tbody tr')].map(function(x){return x.textContent;}).join(';')")).includes("JUMLAH BEBAN6.000.0006.500.000"), await kepala());
    catat("Kolom yang disembunyikan ikut hilang dari unduhan", !(await evalJs("barisCsvLaporan().map(function(b){return b.join('|');}).join('\\n')")).includes("Tanpa pembatasan"));
    // Parameter pada laporan yang sama: modifikasi tetap dipakai
    await klik("#lap-ubah-parameter"); await tunggu(200); await klik("#tampilkan-parameter-laporan"); await tunggu(250);
    catat("Ubah Parameter pada laporan yang sama: kolom tetap tersembunyi", await kepala() === "Keterangan|Dengan pembatasan|Jumlah", await kepala());
    // Simpan Laporan: modifikasi ikut tersimpan dan dipakai lagi saat dibuka dari Laporan Tersimpan
    await klik("#lap-simpan"); await tunggu(200);
    await evalJs("document.getElementById('simpan-laporan-nama').value='Tanpa kolom Tanpa'; true"); await klik("#oke-simpan-laporan"); await tunggu(250);
    await evalJs("document.querySelectorAll('.notifikasi').forEach(function(n){n.remove();}); true");
    await laporan("penghasilan-komprehensif");
    catat("Dibuka lagi dari menu tanpa Simpan: semua kolom kembali tampil", await kepala() === "Keterangan|Dengan pembatasan|Tanpa pembatasan|Jumlah", await kepala());
    await evalJs("(function(){var d=bacaLaporanTersimpan().find(function(x){return x.nama==='Tanpa kolom Tanpa';}); tampilkanLaporan(cariLaporanDaftar(d.laporanId).lap, d.param, d.modifikasi); return true;})()"); await tunggu(150);
    catat("Dibuka dari Laporan Tersimpan: kolom yang disembunyikan ikut kembali", await kepala() === "Keterangan|Dengan pembatasan|Jumlah", await kepala());
    await evalJs(simpan("daftarLaporanTersimpan", []) + " true");
    await klik("#lap-modifikasi"); await tunggu(200);
    await evalJs("document.querySelector('#mod-daftar-kolom input[data-judul=\"Tanpa pembatasan\"]').checked=true; true");
    await klik("#simpan-modifikasi-laporan"); await tunggu(250);
    catat("Centang lagi: kolom kembali tampil", await kepala() === "Keterangan|Dengan pembatasan|Tanpa pembatasan|Jumlah", await kepala());
    await laporan("rincian-pengeluaran");
    await klik("#lap-modifikasi"); await tunggu(200);
    await evalJs("document.querySelector('#mod-daftar-kolom input[data-judul=\"Penanggung Jawab\"]').checked=false; document.querySelector('#mod-daftar-kolom input[data-judul=\"Nilai\"]').checked=true; true");
    catat("Tabel rincian: kolom pertama Tanggal terkunci", await evalJs("document.querySelector('#mod-daftar-kolom input[data-judul=\"Tanggal\"]').disabled"));
    await klik("#simpan-modifikasi-laporan"); await tunggu(250);
    catat("Tabel rincian: Penanggung Jawab hilang, baris Total tetap rapi", await kepala() === "Tanggal|No Bukti|Sumber|Akun|Keterangan|Program|Divisi|Nilai" && (await evalJs("[...document.querySelectorAll('#lap-k-isi tbody tr')].pop().textContent")) === "Total7.200.000", await kepala());
    // Kolom dikurangi: tabel menyempit dan tetap di tengah kertas, Nilai tidak terlempar ke tepi
    const lebarPenuh = await evalJs("Math.round(document.querySelector('#lap-k-isi table').getBoundingClientRect().width)");
    await klik("#lap-modifikasi"); await tunggu(200);
    await evalJs("['No Bukti','Sumber','Akun','Program','Divisi'].forEach(function(j){document.querySelector('#mod-daftar-kolom input[data-judul=\"'+j+'\"]').checked=false;}); true");
    await klik("#simpan-modifikasi-laporan"); await tunggu(250);
    const lebarKecil = JSON.parse(await evalJs("JSON.stringify((function(){var t=document.querySelector('#lap-k-isi table').getBoundingClientRect(), k=document.getElementById('lap-k-isi').getBoundingClientRect(); return {lebar:Math.round(t.width), kiri:Math.round(t.left-k.left), kanan:Math.round(k.right-t.right)};})())"));
    await foto("lap-kolom-sedikit.png");
    catat("Kolom dikurangi: tabel menyempit dan tetap di tengah kertas", await kepala() === "Tanggal|Keterangan|Nilai" && lebarKecil.lebar < lebarPenuh * 0.7 && Math.abs(lebarKecil.kiri - lebarKecil.kanan) <= 1, JSON.stringify({ lebarPenuh, lebarKecil }));

    // Menu Unduh: PDF, Excel, CSV
    await laporan("penghasilan-komprehensif");
    await klik("#lap-unduh"); await tunggu(150);
    catat("Klik ikon Unduh: menu berisi PDF, Excel, CSV", await evalJs("!document.getElementById('lap-menu-unduh').hidden && [...document.querySelectorAll('#lap-menu-unduh button')].map(function(b){return b.textContent;}).join('|')==='PDF|Excel|CSV'"));
    await foto("lap-menu-unduh.png");
    await kirim("Input.dispatchKeyEvent", { type: "keyDown", key: "Escape", code: "Escape", windowsVirtualKeyCode: 27 }); await kirim("Input.dispatchKeyEvent", { type: "keyUp", key: "Escape", code: "Escape", windowsVirtualKeyCode: 27 }); await tunggu(100);
    catat("Esc menutup menu Unduh", await evalJs("document.getElementById('lap-menu-unduh').hidden"));
    // Unduh PDF langsung menjadi berkas, tanpa jendela cetak browser dan tanpa Halaman Cetak
    await evalJs("window.__unduh=[]; window.__asliUnduh=unduhTeks; unduhTeks=function(n,i,t){window.__unduh.push(n+'|'+t); return true;}; window.__print=0; window.print=function(){window.__print++;}; true");
    await klik("#lap-unduh"); await tunggu(120); await klik('[data-unduh="pdf"]'); await tunggu(150);
    catat("Unduh PDF: berkas langsung diunduh, nama mengikuti laporan, tanpa jendela browser", await evalJs("window.__unduh.join()") === "laporan-penghasilan-komprehensif.pdf|application/pdf" && await evalJs("window.__print===0 && document.getElementById('halaman-cetak-bukti').hidden"), await evalJs("window.__unduh.join()"));
    await evalJs("unduhTeks=window.__asliUnduh; document.querySelectorAll('.notifikasi').forEach(function(n){n.remove();}); true");
    // Tombol Cetak membuka Halaman Cetak yang sama dengan bukti
    await klik("#lap-cetak"); await tunggu(200);
    catat("Cetak laporan: Halaman Cetak terbuka berisi PDF, tanpa jendela browser", await evalJs("!document.getElementById('halaman-cetak-bukti').hidden && document.getElementById('hcb-pdf').src.indexOf('blob:')===0 && document.getElementById('hcb-judul').textContent===document.getElementById('lap-k-judul').textContent && window.__print===0"));
    await klik("#hcb-tutup"); await tunggu(150);
    catat("Tutup: kembali ke laporan", await evalJs("document.getElementById('halaman-cetak-bukti').hidden && !!document.getElementById('lap-kertas').offsetParent"));
    // Excel: berkas .xlsx asli; disimpan supaya bisa dibuka alat lain, angka tetap angka, teks berisi rumus tetap teks
    await evalJs("window.__xlsx=null; var asli=unduhTeks; unduhTeks=function(n,isi,t){window.__xlsx={n:n,t:t,b:Array.from(isi)}; return true;}; true");
    await klik("#lap-unduh"); await tunggu(120); await klik('[data-unduh="excel"]'); await tunggu(200);
    const xl = JSON.parse(await evalJs("JSON.stringify(window.__xlsx)"));
    fs.writeFileSync(path.join(folderPng, "laporan.xlsx"), Buffer.from(xl.b));
    const teksXl = Buffer.from(xl.b).toString("utf8");
    catat("Unduh Excel: berkas .xlsx (arsip ZIP) bernama laporan, angka asli dan minus tersimpan sebagai angka", xl.n === "laporan-penghasilan-komprehensif.xlsx" && teksXl.startsWith("PK") && /<v>-1000000<\/v>/.test(teksXl) && /<v>5500000<\/v>/.test(teksXl) && /Yayasan Contoh Peduli/.test(teksXl), xl.n);
    catat("Excel: XML lembar sah dan isi berbahaya tetap teks", await evalJs("(function(){var xml=xmlLembarExcel([[{nilai:'=HYPERLINK(\"x\") <b>&'},{nilai:12,tebal:true}]],[20,10]); var d=new DOMParser().parseFromString(xml,'application/xml'); return !d.querySelector('parsererror') && d.querySelector('c').getAttribute('t')==='inlineStr' && d.querySelector('t').textContent==='=HYPERLINK(\"x\") <b>&' && !d.querySelector('f');})()"));
    catat("Excel: kolom huruf benar (A, Z, AA)", await evalJs("hurufKolomExcel(0)+hurufKolomExcel(25)+hurufKolomExcel(26)") === "AZAA");
    await evalJs("document.querySelectorAll('.notifikasi').forEach(function(n){n.remove();}); true");

    // Klik baris: daftar transaksi di balik angka, lalu formulir asal
    const barisDialog = () => evalJs("[...document.querySelectorAll('#rincian-baris-isi tbody tr')].map(function(x){return [...x.cells].map(function(c){return c.textContent;}).join('|');})");
    const klikBaris = async (awalan) => { const i = await evalJs("[...document.querySelectorAll('#lap-k-isi tbody tr')].findIndex(function(t){return t.cells[0].textContent===" + JSON.stringify(awalan) + ";})"); await klik("#lap-k-isi tbody tr:nth-child(" + (i + 1) + ")"); await tunggu(200); };
    await laporan("penghasilan-komprehensif");
    await klikBaris("Beban Gaji");
    sama("Penghasilan: klik Beban Gaji menampilkan transaksinya", await barisDialog(), ["12 Okt 2026|J4|Jurnal Umum|510102 Beban Gaji|Gaji Oktober|500.000|-", "Total|500.000|-"]);
    catat("Jendela berjudul nama barisnya", await evalJs("document.getElementById('judul-rincian-baris').textContent") === "Beban Gaji");
    await foto("lap-rincian-baris.png");
    await klik("#rincian-baris-isi tbody tr:nth-child(1)"); await tunggu(400);
    catat("Klik transaksi membuka formulir asal (Jurnal Umum), jendela tertutup", await evalJs("!document.getElementById('isi-jurnal').hidden && !document.getElementById('dialog-rincian-baris').open"));
    await laporan("penghasilan-komprehensif");
    await klikBaris("JUMLAH BEBAN");
    catat("Klik JUMLAH BEBAN: semua transaksi beban pada periode", (await barisDialog()).length === 3, JSON.stringify(await barisDialog()));
    await evalJs("document.getElementById('dialog-rincian-baris').close(); true");
    catat("Baris hasil (Surplus) tidak bisa diklik", await evalJs("![...document.querySelectorAll('#lap-k-isi tbody tr')].find(function(t){return t.cells[0].textContent==='SURPLUS (DEFISIT)';}).classList.contains('lap-klik')"));
    await laporan("posisi-keuangan");
    await klikBaris("Peralatan");
    sama("Posisi Keuangan: klik akun, transaksi sampai tanggal laporan", await barisDialog(), ["25 Okt 2026|J8|Pembayaran|130101 Peralatan|Beli printer|700.000|-", "Total|700.000|-"]);
    await evalJs("document.getElementById('dialog-rincian-baris').close(); true");
    await klikBaris("Akum Peralatan");
    catat("Akun yang hanya punya saldo awal: pesan, bukan daftar kosong", /berasal dari saldo awal/.test(await evalJs("document.getElementById('rincian-baris-isi').textContent")));
    await evalJs("document.getElementById('dialog-rincian-baris').close(); true");
    await laporan("donasi-per-program");
    await klikBaris("Beasiswa");
    catat("Donasi per Program: klik Program menampilkan transaksi Program itu", (await barisDialog()).join().includes("J1|Pencatatan Donasi") && (await barisDialog()).join().includes("J6|Pemindahan Dana") && !(await barisDialog()).join().includes("J2"), JSON.stringify(await barisDialog()));
    await evalJs("document.getElementById('dialog-rincian-baris').close(); true");
    await laporan("donasi-per-divisi");
    await klikBaris("Kesehatan");
    catat("Donasi per Divisi: klik Divisi menampilkan donasinya", (await barisDialog()).join().includes("J2|Pencatatan Donasi") && (await barisDialog()).length === 2, JSON.stringify(await barisDialog()));
    await evalJs("document.getElementById('dialog-rincian-baris').close(); true");
    await laporan("neraca-saldo");
    await klik("#lap-k-isi tbody tr:nth-child(3)"); await tunggu(200);
    catat("Neraca Saldo: klik akun menampilkan transaksinya", await evalJs("document.getElementById('dialog-rincian-baris').open && document.getElementById('judul-rincian-baris').textContent==='Peralatan'"));
    await evalJs("document.getElementById('dialog-rincian-baris').close(); true");
    await laporan("daftar-kas-bank");
    await klik("#lap-k-isi tbody tr:nth-child(1)"); await tunggu(200);
    catat("Daftar Kas dan Bank: klik akun menampilkan transaksinya", await evalJs("document.getElementById('dialog-rincian-baris').open && document.getElementById('judul-rincian-baris').textContent==='Kas Kecil'"));
    await evalJs("document.getElementById('dialog-rincian-baris').close(); true");

    // Unduh CSV: isi baris yang sama, angka dalam bentuk yang dibaca Excel
    await laporan("penghasilan-komprehensif");
    const csv = await evalJs("barisCsvLaporan().map(function(b){return b.join('|');})");
    catat("CSV: kepala kertas ikut, '-' jadi 0, kurung jadi minus", csv[0] === "Yayasan Contoh Peduli" && csv.includes("Pemindahan sisa program ke Dana Umum|-1.000.000|1.000.000|0"), JSON.stringify(csv));

    // Klik baris rincian membuka transaksi asal
    await laporan("rincian-pengeluaran");
    await klik("#lap-k-isi tbody tr:nth-child(2)"); await tunggu(400);
    catat("Klik baris Rincian Pengeluaran membuka jurnal asal di Jurnal Umum", await evalJs("!document.getElementById('isi-jurnal').hidden"));

    // Laporan Tersimpan: simpan, buka, hapus, impor
    await laporan("posisi-keuangan", "p.dari='2026-09-01'; p.sampai='2026-09-30';");
    await klik("#tab-hasil-laporan .tab-judul"); await tunggu(200);
    await klik("#lap-simpan"); await tunggu(200);
    await evalJs("document.getElementById('simpan-laporan-nama').value='  '; true"); await klik("#oke-simpan-laporan"); await tunggu(150);
    catat("Simpan Laporan: nama kosong ditolak", await evalJs("document.getElementById('dialog-simpan-laporan').open && !document.getElementById('galat-simpan-laporan').hidden"));
    await evalJs("document.getElementById('simpan-laporan-nama').value='Neraca <b>September</b>'; true"); await klik("#oke-simpan-laporan"); await tunggu(200);
    catat("Simpan Laporan: tersimpan dengan parameternya; data rusak lama dibuang", await evalJs("bacaLaporanTersimpan().length===1 && bacaLaporanTersimpan()[0].param.sampai==='2026-09-30' && bacaLaporanTersimpan()[0].laporanId==='posisi-keuangan'"));
    await klik("#tombol-laporan"); await tunggu(300);
    await evalJs("kategoriLaporanAktif='tersimpan'; gambarMenuLaporan(); true"); await tunggu(150);
    catat("Kartu Laporan Tersimpan tampil di kelompok kategorinya, nama berkode HTML sebagai teks", await evalJs("document.querySelector('#lap-isi .lap-kelompok h3').textContent==='Keuangan' && document.querySelector('#lap-isi .lap-kartu-nama').textContent==='Neraca <b>September</b>' && !document.querySelector('#lap-isi .lap-kartu-nama b')"));
    await foto("lap-tersimpan.png");
    await klik("#lap-isi .lap-kartu"); await tunggu(300);
    catat("Klik kartu tersimpan: laporan langsung tampil dengan parameternya, tanpa jendela Parameter", await evalJs("!document.getElementById('dialog-parameter-laporan').open && document.getElementById('lap-k-periode').textContent==='Per 30 Sep 2026'"));
    // Impor: berkas rekaan berisi satu laporan sah, satu nama sama, dan isi rusak
    const berkas = path.join(folderPng, "impor.json");
    fs.writeFileSync(berkas, JSON.stringify([{ nama: "Arus Oktober", laporanId: "arus-kas", param: { dari: "2026-10-01", sampai: "2026-10-31" } }, { nama: "neraca <B>september</B>", laporanId: "posisi-keuangan", param: { dari: "2026-09-01", sampai: "2026-09-30" } }, { nama: "Jahat", laporanId: "arus-kas", param: { dari: "<script>", sampai: "x" } }, 5]));
    await klik("#tombol-laporan"); await tunggu(300);
    const dok = await kirim("DOM.getDocument"); const simpul = await kirim("DOM.querySelector", { nodeId: dok.root.nodeId, selector: "#lap-impor-berkas" });
    await kirim("DOM.setFileInputFiles", { files: [berkas], nodeId: simpul.nodeId }); await tunggu(400);
    catat("Impor: yang sah masuk; nama yang sudah ada dan isi rusak dilewati; pesan menyebut jumlahnya", await evalJs("bacaLaporanTersimpan().length===2 && /1 dari 4 laporan diimpor/.test(document.getElementById('area-notifikasi').textContent)"), await evalJs("document.getElementById('area-notifikasi').textContent"));
    await evalJs("document.querySelectorAll('.notifikasi').forEach(function(n){n.remove();}); true");
    await klik(".lap-tersimpan-hapus"); await tunggu(200); await klik("#ya-konfirmasi"); await tunggu(250);
    catat("Hapus kartu tersimpan lewat konfirmasi", await evalJs("bacaLaporanTersimpan().length===1"));
    catat("Laporan Tersimpan ikut Cadangan Data", await evalJs("jenisKunciCadangan.daftarLaporanTersimpan==='daftar'"));

    // Layar HP: kertas lebar tetap di dalam layar, tabel digeser di dalam kertas
    await laporan("rincian-pengeluaran");
    await kirim("Emulation.setDeviceMetricsOverride", { width: 390, height: 844, deviceScaleFactor: 1, mobile: false }); await tunggu(300);
    catat("Lebar 390: kertas rincian di dalam layar, isi halaman tidak melebar", await evalJs("document.getElementById('lap-kertas').getBoundingClientRect().right<=window.innerWidth && document.getElementById('isi-hasil-laporan').scrollWidth<=document.getElementById('isi-hasil-laporan').clientWidth"));
    await foto("lap-rincian-hp.png");
    await kirim("Emulation.setDeviceMetricsOverride", { width: 1366, height: 900, deviceScaleFactor: 1, mobile: false });

    // Tanpa data sama sekali: setiap laporan menampilkan pesan, bukan galat
    await evalJs("localStorage.clear(); true"); await muatUlang();
    const kosong =await evalJs("(function(){var keluar=[]; DAFTAR_LAPORAN.forEach(function(k){k.kelompok.forEach(function(kel){kel.laporan.forEach(function(lap){var h=lap.gambar(" + PARAM + "); keluar.push(lap.id+':'+(h.isi.className==='lap-kosong'));});});}); return keluar;})()");
    // Daftar Kas dan Bank tetap berupa tabel: akun bawaan sudah ada, saldonya "-"
    catat("Tanpa data: 24 laporan tidak galat; semuanya pesan kosong yang ramah, kecuali Daftar Kas dan Bank (akun bawaan)", kosong.length === 24 && kosong.every(k => k.endsWith(":true") || k === "daftar-kas-bank:false"), JSON.stringify(kosong));
    catat("Tidak ada galat atau peringatan di Console", galat.length === 0, JSON.stringify(galat));
  } catch (e) { console.log("GALAT: " + e.stack + "\nGalat halaman: " + JSON.stringify(galat)); hasil.push(false); }
  try { ws.close(); } catch (e) { /* abaikan */ } chrome.kill();
  console.log("Lolos " + hasil.filter(Boolean).length + " dari " + hasil.length); process.exit(hasil.every(Boolean) ? 0 : 1);
})();
