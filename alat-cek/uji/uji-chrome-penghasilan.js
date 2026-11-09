// Uji Laporan Penghasilan Komprehensif (PRD 7, tugas I.1b-1) di Chrome asli, dengan akun dan jurnal rekaan yang
// angkanya dihitung manual: periode, kolom Dengan/Tanpa/Jumlah dari tanda Terikat, koreksi debit di akun pendapatan,
// akun Aset Neto dan jurnal di luar periode tidak ikut, data lama tanpa tanda Terikat = Tanpa, data rusak tidak macet,
// filter Divisi dan Program, Hanya Induk, Hanya Tampilkan Total, periode kosong.
// Pemakaian: node uji-chrome-penghasilan.js <chrome.exe> <index.html> <folder-profil> <folder-png>
const { spawn } = require("child_process");
const fs = require("fs"), path = require("path");
const [chromeExe, halaman, folderProfil, folderPng] = process.argv.slice(2);
const PORT = 9391;
const tunggu = (ms) => new Promise(r => setTimeout(r, ms));
const siapUji = require("./bantu-siap.js");   // tunggu sampai aplikasi siap sesudah muat ulang
let id = 0; const menunggu = new Map(); let ws;
const kirim = (m, p = {}) => new Promise((s, g) => { const n = ++id; menunggu.set(n, { s, g }); ws.send(JSON.stringify({ id: n, method: m, params: p })); });
const evalJs = async (e) => { const r = await kirim("Runtime.evaluate", { expression: e, returnByValue: true, awaitPromise: true }); if (r.exceptionDetails) throw new Error(JSON.stringify(r.exceptionDetails.exception.description) + " <<< " + e.slice(0, 120)); return r.result.value; };
const hasil = []; const catat = (n, ok, r = "") => { hasil.push(ok); console.log((ok ? "LOLOS  " : "GAGAL  ") + n + (r ? " -> " + r : "")); };
const foto = async (nama) => { const r = await kirim("Page.captureScreenshot", { format: "png" }); fs.writeFileSync(path.join(folderPng, nama), Buffer.from(r.data, "base64")); };
const klik = async (sel) => { const j = JSON.parse(await evalJs(`(function(){var e=document.querySelector(${JSON.stringify(sel)}); e.scrollIntoView({block:'center'}); var r=e.getBoundingClientRect(); return JSON.stringify({x:r.left+r.width/2,y:r.top+r.height/2});})()`)); await kirim("Input.dispatchMouseEvent", { type: "mouseMoved", x: j.x, y: j.y }); await kirim("Input.dispatchMouseEvent", { type: "mousePressed", x: j.x, y: j.y, button: "left", clickCount: 1 }); await kirim("Input.dispatchMouseEvent", { type: "mouseReleased", x: j.x, y: j.y, button: "left", clickCount: 1 }); };

// Akun rekaan (bertingkat) dan jurnal Oktober 2026
const AKUN = [
  { id: "k1", kode: "110101", nama: "Kas Kecil", tipe: "kas-bank", indukId: "" },
  { id: "p0", kode: "4101", nama: "Pendapatan", tipe: "pendapatan", indukId: "" },
  { id: "p1", kode: "410101", nama: "Donasi Pendidikan", tipe: "pendapatan", indukId: "p0" },
  { id: "p2", kode: "410102", nama: "Donasi Umum", tipe: "pendapatan", indukId: "p0" },
  // kelompok berisi satu akun: tidak ada baris "Jumlah Donasi Air"
  { id: "p3", kode: "410103", nama: "Donasi Air", tipe: "pendapatan", indukId: "p0" },
  { id: "p4", kode: "41010301", nama: "Donasi air bersih", tipe: "pendapatan", indukId: "p3" },
  { id: "q0", kode: "7101", nama: "Pendapatan Lainnya", tipe: "pendapatan-lain", indukId: "" },
  { id: "q1", kode: "710101", nama: "Jasa Giro", tipe: "pendapatan-lain", indukId: "q0" },
  { id: "b0", kode: "5101", nama: "Beban", tipe: "beban", indukId: "" },
  // kelompok berisi dua akun: ada baris "Jumlah Beban Operasional"
  { id: "b3", kode: "510101", nama: "Beban Operasional", tipe: "beban", indukId: "b0" },
  { id: "b1", kode: "51010101", nama: "Beban Program Pendidikan", tipe: "beban", indukId: "b3" },
  { id: "b2", kode: "51010102", nama: "Beban Gaji", tipe: "beban", indukId: "b3" },
  { id: "c0", kode: "6101", nama: "Beban Lainnya", tipe: "beban-lain", indukId: "" },
  { id: "c1", kode: "610101", nama: "Beban Administrasi Bank", tipe: "beban-lain", indukId: "c0" },
  { id: "m0", kode: "3101", nama: "Modal", tipe: "modal", indukId: "" },
  { id: "m1", kode: "310101", nama: "Aset Neto Tidak Terikat", tipe: "modal", indukId: "m0" }
];
const r = (akunId, debit, kredit, divisiId, programId, terikat) => ({ akunId, debit, kredit, divisiId, programId, terikat });
const JURNAL = [
  { id: "j1", nomor: "J1", tanggal: "2026-10-05", rincian: [r("k1", 25000000, 0, "", "", false), r("p1", 0, 25000000, "d1", "pr1", true)] },
  { id: "j2", nomor: "J2", tanggal: "2026-10-06", rincian: [r("k1", 8750000, 0, "", "", false), r("p2", 0, 8750000, "d2", "", false)] },
  // data lama: tanpa tanda terikat -> Tanpa pembatasan
  { id: "j13", nomor: "J13", tanggal: "2026-10-08", rincian: [r("k1", 100000, 0, "", "", false), r("p4", 0, 100000, "d2", "", true)] },
  { id: "j3", nomor: "J3", tanggal: "2026-10-10", rincian: [{ akunId: "k1", debit: 125000, kredit: 0 }, { akunId: "q1", debit: 0, kredit: 125000, divisiId: "d1" }] },
  { id: "j4", nomor: "J4", tanggal: "2026-10-15", rincian: [r("b1", 18200000, 0, "d1", "pr1", true), r("k1", 0, 18200000, "", "", false)] },
  { id: "j5", nomor: "J5", tanggal: "2026-10-20", rincian: [r("b2", 4500000, 0, "d2", "", false), r("k1", 0, 4500000, "", "", false)] },
  { id: "j6", nomor: "J6", tanggal: "2026-10-25", rincian: [r("c1", 15000, 0, "d1", "", false), r("k1", 0, 15000, "", "", false)] },
  // koreksi: donasi dikembalikan sebagian (debit di akun pendapatan mengurangi penerimaan)
  { id: "j7", nomor: "J7", tanggal: "2026-10-26", rincian: [r("p2", 250000, 0, "d2", "", false), r("k1", 0, 250000, "", "", false)] },
  // di luar periode Oktober: tidak ikut
  { id: "j8", nomor: "J8", tanggal: "2026-11-02", rincian: [r("k1", 1000000, 0, "", "", false), r("p2", 0, 1000000, "d2", "", false)] },
  { id: "j9", nomor: "J9", tanggal: "2026-09-30", rincian: [r("b1", 500000, 0, "d1", "pr1", true), r("k1", 0, 500000, "", "", false)] },
  // akun Aset Neto (modal): bukan penerimaan/beban, tidak ikut
  { id: "j10", nomor: "J10", tanggal: "2026-10-12", rincian: [r("k1", 3000000, 0, "", "", false), r("m1", 0, 3000000, "", "", false)] },
  // data rusak
  null,
  { id: "j11", nomor: "J11", tanggal: "rusak", rincian: [r("p2", 0, 999, "d2", "", false)] },
  { id: "j12", nomor: "J12", tanggal: "2026-10-28", rincian: [null, "x", { akunId: "tidak-ada", kredit: 77 }] }
];

(async () => {
  fs.mkdirSync(folderPng, { recursive: true });
  const galat = [];
  const chrome = spawn(chromeExe, ["--headless=new", "--disable-gpu", "--no-first-run", "--remote-debugging-port=" + PORT, "--user-data-dir=" + folderProfil, "--window-size=1366,900", "file:///" + halaman.replace(/\\/g, "/")], { stdio: "ignore" });
  try {
    let t = null;
    for (let i = 0; i < 60 && !t; i++) { await tunggu(250); try { t = (await (await fetch("http://127.0.0.1:" + PORT + "/json/list")).json()).find(x => x.type === "page" && x.url.startsWith("file:")); } catch (e) { /* belum siap */ } }
    ws = new WebSocket(t.webSocketDebuggerUrl); await new Promise((s, g) => { ws.onopen = s; ws.onerror = g; });
    ws.onmessage = (m) => { const d = JSON.parse(m.data); if (d.method === "Runtime.exceptionThrown") { const x = d.params.exceptionDetails; galat.push(x.exception ? x.exception.description : x.text + " " + (x.url || "") + ":" + x.lineNumber); } if (d.method === "Runtime.consoleAPICalled" && ["error", "warning"].includes(d.params.type)) galat.push(d.params.args.map(a => a.value).join(" ")); if (d.id && menunggu.has(d.id)) { const p = menunggu.get(d.id); menunggu.delete(d.id); d.error ? p.g(new Error(JSON.stringify(d.error))) : p.s(d.result); } };
    await kirim("Runtime.enable"); await kirim("Page.enable"); await require("./bantu-sesi.js").masukChrome(kirim, "file:///" + halaman.replace(/\\/g, "/")); /* masuk sebagai pengguna uji (J.25) */
    await kirim("Emulation.setDeviceMetricsOverride", { width: 1366, height: 900, deviceScaleFactor: 1, mobile: false });
    await tunggu(800);
    await evalJs("localStorage.clear(); localStorage.setItem('daftarAkun', " + JSON.stringify(JSON.stringify(AKUN)) + "); localStorage.setItem('daftarJurnal', " + JSON.stringify(JSON.stringify(JURNAL)) + "); localStorage.setItem('daftarDivisi', JSON.stringify([{id:'d1',nama:'Pendidikan'},{id:'d2',nama:'Kesehatan'}])); localStorage.setItem('daftarProgram', JSON.stringify([{id:'pr1',nama:'Beasiswa',divisiId:'d1',status:'aktif'}])); localStorage.setItem('dataYayasan', JSON.stringify({nama:'Yayasan Contoh Peduli'})); true");
    await kirim("Page.reload"); await siapUji(evalJs, tunggu);

    // Buka laporan dengan pengaturan tertentu lewat jendela Parameter, lalu baca baris tabel di kertas
    const tampilkan = async (atur) => {
      await klik("#tombol-laporan"); await tunggu(300);
      await evalJs("document.querySelectorAll('.notifikasi').forEach(function(n){n.remove();}); true");
      const i = await evalJs("[...document.querySelectorAll('#lap-kategori .lap-kat')].findIndex(function(b){return b.textContent.trim()==='Keuangan';})");
      await klik("#lap-kategori .lap-kat:nth-child(" + (i + 1) + ")"); await tunggu(200);
      await klik("#lap-isi .lap-kartu:nth-child(2)"); await tunggu(300);
      await evalJs("(function(){var d=document.getElementById('param-dari'), s=document.getElementById('param-sampai'); d.value='2026-10-01'; s.value='2026-10-31'; " + (atur || "") + " return true;})()");
      await klik("#tampilkan-parameter-laporan"); await tunggu(300);
      return evalJs("(function(){var t=document.querySelector('#lap-k-isi .lap-tabel'); if(!t){return [document.getElementById('lap-k-isi').textContent];} return [...t.tBodies[0].rows].map(function(x){return [...x.cells].map(function(c){return c.textContent;}).join('|');});})()");
    };

    // 1) Semua Divisi, Induk + Anak
    const semua = await tampilkan("");
    // Susunan ringkas bertingkat (PRD 7, Pilihan 1): akun teratas "Pendapatan" dan "Beban" tidak ditulis; "Jumlah <kelompok>"
    // hanya untuk kelompok berisi 2 baris atau lebih; total bagian huruf besar
    const harap = [
      "PENERIMAAN|||",
      "Donasi Pendidikan|25.000.000|-|25.000.000", "Donasi Umum|-|8.500.000|8.500.000",
      "Donasi Air|||", "Donasi air bersih|100.000|-|100.000",
      "Pendapatan Lainnya|||", "Jasa Giro|-|125.000|125.000",
      "JUMLAH PENERIMAAN|25.100.000|8.625.000|33.725.000",
      "BEBAN|||",
      "Beban Operasional|||", "Beban Program Pendidikan|18.200.000|-|18.200.000", "Beban Gaji|-|4.500.000|4.500.000", "Jumlah Beban Operasional|18.200.000|4.500.000|22.700.000",
      "Beban Lainnya|||", "Beban Administrasi Bank|-|15.000|15.000",
      "JUMLAH BEBAN|18.200.000|4.515.000|22.715.000",
      "SURPLUS (DEFISIT)|6.900.000|4.110.000|11.010.000"
    ];
    catat("Oktober 2026, Semua Divisi: angka sama dengan hitungan manual (koreksi debit mengurangi Donasi Umum; data lama = Tanpa; Aset Neto, jurnal di luar periode, dan data rusak tidak ikut)", JSON.stringify(semua) === JSON.stringify(harap), JSON.stringify(semua));
    catat("Susunan ringkas: tanpa baris akun teratas 'Pendapatan'/'Beban', tanpa 'Jumlah' untuk kelompok berisi satu akun, tidak ada nama baris yang ganda", !semua.some(b => /^(Pendapatan|Beban)\|/.test(b)) && !semua.some(b => /^Jumlah (Donasi Air|Pendapatan Lainnya|Beban Lainnya)\|/.test(b)) && new Set(semua.map(b => b.split("|")[0])).size === semua.length);
    catat("Kepala tabel: Keterangan | Dengan pembatasan | Tanpa pembatasan | Jumlah", JSON.stringify(await evalJs("[...document.querySelectorAll('#lap-k-isi .lap-tabel thead th')].map(function(c){return c.textContent;})")) === JSON.stringify(["Keterangan", "Dengan pembatasan", "Tanpa pembatasan", "Jumlah"]));
    catat("Kertas: judul, periode Oktober, filter Semua Divisi", await evalJs("document.getElementById('lap-k-judul').textContent==='Laporan Penghasilan Komprehensif' && document.getElementById('lap-k-periode').textContent==='Untuk periode 1 Okt 2026 sampai 31 Okt 2026' && document.getElementById('lap-k-filter').textContent==='Divisi: Semua Divisi · Program: Semua'"));
    await foto("penghasilan-semua.png");
    const bacaPdfLaporan = async () => Buffer.from(await evalJs("susunPdfLaporan().blob().arrayBuffer().then(function(b){var u=new Uint8Array(b),s=''; for(var i=0;i<u.length;i++){s+=String.fromCharCode(u[i]);} return btoa(s);})"), "base64");
    fs.writeFileSync(path.join(folderPng, "penghasilan-semua.pdf"), await bacaPdfLaporan());

    // 2) Filter Divisi Pendidikan
    const d1 = await tampilkan("pemilihDivisiParam.tetapkan(['d1']);");
    catat("Divisi Pendidikan: versi per Divisi (kolom Pendidikan + Total), hanya baris jurnal Divisi itu", JSON.stringify(d1) === JSON.stringify([
      "PENERIMAAN||", "Donasi Pendidikan|25.000.000|25.000.000",
      "Pendapatan Lainnya|125.000|125.000", "Jasa Giro|125.000|125.000",
      "JUMLAH PENERIMAAN|25.125.000|25.125.000",
      "BEBAN||", "Beban Operasional|18.200.000|18.200.000", "Beban Program Pendidikan|18.200.000|18.200.000",
      "Beban Lainnya|15.000|15.000", "Beban Administrasi Bank|15.000|15.000",
      "JUMLAH BEBAN|18.215.000|18.215.000", "SURPLUS (DEFISIT)|6.910.000|6.910.000"]) && await evalJs("document.getElementById('lap-k-judul').textContent") === "Laporan Penghasilan Komprehensif per Divisi", JSON.stringify(d1));

    // 3) Filter Program Beasiswa, Hanya Induk
    const pr = await tampilkan("pemilihProgramParam.tetapkan(['pr1']); document.getElementById('param-akun-anak').checked=false;");
    catat("Program Beasiswa + Hanya Induk: satu baris per kelompok teratas berisi jumlahnya", JSON.stringify(pr) === JSON.stringify([
      "PENERIMAAN|||", "Donasi Pendidikan|25.000.000|-|25.000.000", "JUMLAH PENERIMAAN|25.000.000|-|25.000.000",
      "BEBAN|||", "Beban Operasional|18.200.000|-|18.200.000", "JUMLAH BEBAN|18.200.000|-|18.200.000", "SURPLUS (DEFISIT)|6.800.000|-|6.800.000"]), JSON.stringify(pr));

    // 4) Hanya Tampilkan Total
    const ht = await tampilkan("document.getElementById('param-hanya-total').checked=true;");
    catat("Hanya Tampilkan Total: JUMLAH PENERIMAAN, JUMLAH BEBAN, Surplus saja", JSON.stringify(ht) === JSON.stringify(["JUMLAH PENERIMAAN|25.100.000|8.625.000|33.725.000", "JUMLAH BEBAN|18.200.000|4.515.000|22.715.000", "SURPLUS (DEFISIT)|6.900.000|4.110.000|11.010.000"]), JSON.stringify(ht));

    // 5) Periode tanpa transaksi
    const kosong = await tampilkan("document.getElementById('param-dari').value='2025-01-01'; document.getElementById('param-sampai').value='2025-01-31';");
    catat("Periode tanpa transaksi: pesan ramah, tanpa tabel", JSON.stringify(kosong) === JSON.stringify(["Belum ada transaksi penerimaan atau beban pada periode dan filter ini."]), JSON.stringify(kosong));

    // 6) Ubah Parameter dari hasil laporan menggambar ulang laporan yang sama
    await klik("#lap-ubah-parameter"); await tunggu(300);
    await evalJs("(function(){document.getElementById('param-dari').value='2026-10-01'; document.getElementById('param-sampai').value='2026-10-31'; return true;})()");
    await klik("#tampilkan-parameter-laporan"); await tunggu(300);
    catat("Ubah Parameter ke Oktober: laporan digambar ulang dengan angka Oktober", await evalJs("[...document.querySelectorAll('#lap-k-isi .lap-tabel tbody tr')].pop().textContent") === "SURPLUS (DEFISIT)6.900.0004.110.00011.010.000");

    // 7) Layar HP: kertas di dalam layar; tabel yang lebih lebar digeser di dalam kertas (tidak melebarkan isi halaman).
    // Deretan tab di atas (judul tab panjang) masih melebar: masalah lama Temuan 3 (Tahap K), dicatat sebagai CATATAN.
    await kirim("Emulation.setDeviceMetricsOverride", { width: 390, height: 844, deviceScaleFactor: 1, mobile: false }); await tunggu(300);
    const hp = JSON.parse(await evalJs("JSON.stringify((function(){var isi=document.getElementById('lap-k-isi'); return {layar:window.innerWidth, kertas:Math.round(document.getElementById('lap-kertas').getBoundingClientRect().right), isiKanan:Math.round(isi.getBoundingClientRect().right), geser:getComputedStyle(isi).overflowX, isiTab:document.getElementById('isi-hasil-laporan').scrollWidth<=document.getElementById('isi-hasil-laporan').clientWidth, tabBaris:document.querySelector('.tab-baris').scrollWidth};})())"));
    catat("Lebar 390: kertas di dalam layar, tabel digeser di dalam kertas, isi halaman laporan tidak melebar", hp.kertas <= hp.layar && hp.isiKanan <= hp.layar && hp.geser === "auto" && hp.isiTab, JSON.stringify(hp));
    if (hp.tabBaris > hp.layar) { console.log("CATATAN deretan tab melebar " + hp.tabBaris + " px di layar " + hp.layar + " px (Temuan 3, Tahap K)"); }
    await foto("penghasilan-hp.png");
    catat("Tidak ada galat atau peringatan di Console", galat.length === 0, JSON.stringify(galat));
  } catch (e) { console.log("GALAT: " + e.stack + "\nGalat halaman: " + JSON.stringify(galat)); hasil.push(false); }
  try { ws.close(); } catch (e) { /* abaikan */ } chrome.kill();
  console.log("Lolos " + hasil.filter(Boolean).length + " dari " + hasil.length); process.exit(hasil.every(Boolean) ? 0 : 1);
})();


