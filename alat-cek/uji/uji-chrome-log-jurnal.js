// Uji Log Aktifitas Jurnal (PRD 6.4) di Chrome asli: buka dari popup, urutan, Tipe Transaksi, cari, pilih kolom, unduh mengikuti
// kolom, klik baris, transaksi asal hilang, kode HTML sebagai teks, data rusak, tidak mengubah jurnal, layar HP.
// Pemakaian: node uji-chrome-log-jurnal.js <chrome.exe> <index.html> <folder-profil> <folder-png>
const { spawn } = require("child_process");
const fs = require("fs"), path = require("path");
const [chromeExe, halaman, folderProfil, folderPng] = process.argv.slice(2);
const PORT = 9395;
const tunggu = (ms) => new Promise(r => setTimeout(r, ms));
const siapUji = require("./bantu-siap.js");   // tunggu sampai aplikasi siap sesudah muat ulang
let id = 0; const menunggu = new Map(); let ws;
const kirim = (m, p = {}) => new Promise((s, g) => { const n = ++id; menunggu.set(n, { s, g }); ws.send(JSON.stringify({ id: n, method: m, params: p })); });
const evalJs = async (e) => { const r = await kirim("Runtime.evaluate", { expression: e, returnByValue: true, awaitPromise: true }); if (r.exceptionDetails) throw new Error(JSON.stringify(r.exceptionDetails.exception ? r.exceptionDetails.exception.description : r.exceptionDetails.text) + " <<< " + e.slice(0, 120)); return r.result.value; };
const hasil = []; const catat = (n, ok, r = "") => { hasil.push(ok); console.log((ok ? "LOLOS  " : "GAGAL  ") + n + (r && !ok ? " -> " + r : "")); };
const foto = async (nama) => { const r = await kirim("Page.captureScreenshot", { format: "png" }); fs.writeFileSync(path.join(folderPng, nama), Buffer.from(r.data, "base64")); };
const klik = async (sel) => { const j = JSON.parse(await evalJs(`(function(){var e=document.querySelector(${JSON.stringify(sel)}); e.scrollIntoView({block:'center'}); var r=e.getBoundingClientRect(); return JSON.stringify({x:r.left+r.width/2,y:r.top+r.height/2});})()`)); await kirim("Input.dispatchMouseEvent", { type: "mouseMoved", x: j.x, y: j.y }); await kirim("Input.dispatchMouseEvent", { type: "mousePressed", x: j.x, y: j.y, button: "left", clickCount: 1 }); await kirim("Input.dispatchMouseEvent", { type: "mouseReleased", x: j.x, y: j.y, button: "left", clickCount: 1 }); };

const JURNAL = [
  { id: "j1", nomor: "JV-001", tanggal: "2026-11-03", keterangan: "Manual", rincian: [] },
  { id: "j2", nomor: "BKK-7", tanggal: "2026-11-06", rincian: [], sumber: { jenis: "pembayaran", id: "b1" } },
  { id: "j3", nomor: "<b>DN-1</b>", tanggal: "2026-11-03", rincian: [], sumber: { jenis: "donasi", id: "tidak-ada" } },
  { id: "j4", nomor: "TF-1", tanggal: "2026-10-01", rincian: [], sumber: { jenis: "jenis-aneh", id: "x" } }
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
    const muatUlang = async () => { await kirim("Page.reload"); await siapUji(evalJs, tunggu); for (let i = 0; i < 100; i++) { if (await evalJs("document.readyState==='complete' && typeof bukaLogJurnal==='function'")) { break; } await tunggu(200); } await tunggu(200); };
    await tunggu(800);
    const simpan = (kunci, isi) => "localStorage.setItem('" + kunci + "', " + JSON.stringify(JSON.stringify(isi)) + ");";
    await evalJs("localStorage.clear();" + simpan("daftarJurnal", JURNAL) + simpan("daftarPembayaran", [{ id: "b1", nomor: "BKK-7", nama: "BKK-7", tanggal: "2026-11-06", rincian: [] }]) + "true");
    await muatUlang();
    const namaKunciBayar = await evalJs("asalJurnal.pembayaran ? 'ada' : Object.keys(asalJurnal).join()");
    const baris = () => evalJs("[...document.querySelectorAll('#isi-log-jurnal tbody tr')].map(function(x){return [...x.cells].filter(function(c){return !c.hidden;}).map(function(c){return c.textContent;}).join('|');})");
    const SEL = "#isi-log-jurnal";

    await klik("#tombol-buku-besar"); await tunggu(300);
    await klik('#panel-buku-besar .kotak-menu[data-halaman="Log Aktifitas Jurnal"]'); await tunggu(400);
    catat("Klik kotak: tab terbuka, tanpa tombol tambah", await evalJs("!document.getElementById('isi-log-jurnal').hidden && !document.querySelector('#isi-log-jurnal [data-alat=baru]')"));
    const awal = await baris();
    catat("Empat kolom, tanggal terbaru di atas, jurnal lama bernomor JV per bulan urut tanggal, kode HTML sebagai teks, jenis tak dikenal tetap tampil", awal.length === 4 && /^6 Nov 2026\|JV\.2026\.11\.00003\|BKK-7\|Pembayaran$/.test(awal[0]) && awal.some(x => /JV\.2026\.11\.00001\|JV-001\|Jurnal Umum$/.test(x)) && awal.some(x => x.includes("JV.2026.11.00002|<b>DN-1</b>|Pencatatan Donasi")) && /JV\.2026\.10\.00001\|TF-1\|transaksi lain$/.test(awal[3]) && await evalJs("!document.querySelector('#isi-log-jurnal tbody b')"), JSON.stringify(awal) + " asal: " + namaKunciBayar);
    const sebelumDilihat = await evalJs("localStorage.getItem('daftarJurnal')");
    catat("Jumlah data 4", await evalJs("document.querySelector('#isi-log-jurnal [data-jumlah]').textContent==='4'"));
    await foto("log-jurnal.png");
    await evalJs("(function(){var k=document.querySelector('#isi-log-jurnal .kolom-cari'); k.value='jurnal umum'; k.dispatchEvent(new Event('input',{bubbles:true})); return true;})()"); await tunggu(150);
    catat("Cari menurut Tipe Transaksi", (await baris()).length === 1 && await evalJs("document.querySelector('#isi-log-jurnal [data-jumlah]').textContent==='1'"));
    await evalJs("(function(){var k=document.querySelector('#isi-log-jurnal .kolom-cari'); k.value=''; k.dispatchEvent(new Event('input',{bubbles:true})); return true;})()"); await tunggu(150);
    // Pilih kolom
    await klik(SEL + " .pilih-kolom button"); await tunggu(150);
    catat("Roda gigi membuka menu berisi empat kolom", await evalJs("!document.querySelector('#isi-log-jurnal .pilih-kolom-menu').hidden && document.querySelectorAll('#isi-log-jurnal .pilih-kolom-menu input').length===4"));
    await foto("log-jurnal-kolom.png");
    await klik(SEL + " .pilih-kolom-menu label:nth-child(3) input"); await tunggu(150);
    catat("Sembunyikan No. Trans #: judul dan isi kolom hilang", await evalJs("document.querySelector('#isi-log-jurnal th[data-kolom=noTrans]').hidden && getComputedStyle(document.querySelector('#isi-log-jurnal tbody td:nth-child(3)')).display==='none'") && (await baris())[0].split("|").length === 3);
    await evalJs("(function(){window.__csv=null; var asli=unduhCsv; window.unduhCsvAsli=asli; unduhCsv=function(n,b){window.__csv=b; return true;}; document.querySelector('#isi-log-jurnal [data-alat=ekspor]').click(); unduhCsv=asli; return true;})()");
    catat("Unduh CSV mengikuti kolom yang tampil", await evalJs("window.__csv && window.__csv[0].join()==='Tanggal,Nomor #,Tipe Transaksi'"), await evalJs("JSON.stringify(window.__csv && window.__csv[0])"));
    // Klik langsung: notifikasi "telah diunduh" menutupi menu beberapa detik (Temuan 37)
    const centang = (n) => evalJs(`document.querySelector('#isi-log-jurnal .pilih-kolom-menu label:nth-child(${n}) input').click(); true`);
    for (const n of [1, 2, 4]) { await centang(n); await tunggu(80); }
    catat("Kolom terakhir tidak bisa disembunyikan", await evalJs("document.querySelector('#isi-log-jurnal .pilih-kolom-menu label:nth-child(4) input').checked && document.querySelectorAll('#isi-log-jurnal thead th:not([hidden])').length===1"));
    await centang(1); await centang(2); await centang(3); await tunggu(120);
    await evalJs("document.body.click(); true"); await tunggu(120);
    catat("Klik di luar menutup menu; semua kolom kembali", await evalJs("document.querySelector('#isi-log-jurnal .pilih-kolom-menu').hidden") && (await baris())[0].split("|").length === 4);
    await evalJs("(function(){var b=[...document.querySelectorAll('#isi-log-jurnal tbody tr')].find(function(x){return x.textContent.indexOf('JV-001')!==-1;}); b.click(); return true;})()"); await tunggu(300);
    catat("Klik baris Jurnal Umum membuka formulirnya", await evalJs("!document.getElementById('isi-jurnal').hidden && modulJurnal.idDiubah==='j1'"));
    await evalJs("bukaLogJurnal(); [...document.querySelectorAll('#isi-log-jurnal tbody tr')].find(function(x){return x.textContent.indexOf('BKK-7')!==-1;}).click(); true"); await tunggu(300);
    catat("Klik baris Pembayaran membuka transaksi asalnya", await evalJs("document.getElementById('tab-bayar') ? !document.getElementById('isi-bayar').hidden : false"), await evalJs("Object.keys(asalJurnal).join()"));
    await evalJs("bukaLogJurnal(); [...document.querySelectorAll('#isi-log-jurnal tbody tr')].find(function(x){return x.textContent.indexOf('DN-1')!==-1;}).click(); true"); await tunggu(250);
    catat("Transaksi asal sudah hilang: pesan, tidak macet", await evalJs("document.body.textContent.indexOf('Transaksi asal jurnal ini sudah tidak ada.')!==-1 && !document.getElementById('isi-log-jurnal').hidden"));
    catat("Halaman ini tidak mengubah data jurnal", (await evalJs("localStorage.getItem('daftarJurnal')")) === sebelumDilihat);
    // Nomor jurnal (PRD 6.4)
    const noDari = (idJ) => evalJs(`modulJurnal.ambil().find(function(j){return j.id==='${idJ}';}).noJurnal`);
    await evalJs("(function(){var d=modulJurnal.ambil(); d.push({id:'n1',nomor:'JV-002',tanggal:'2026-11-01',rincian:[]}); modulJurnal.simpan(d); return true;})()");
    catat("Jurnal baru bernomor urutan input walau tanggalnya lebih awal", await noDari("n1") === "JV.2026.11.00004", await noDari("n1"));
    await evalJs("modulJurnal.simpan(daftarJurnalDenganOtomatis({jenis:'pembayaran',id:'b1'}, {nomor:'BKK-8', tanggal:'2026-12-20', keterangan:'Ubah', rincian:[]})); true");
    catat("Ubah transaksi, walau pindah bulan: nomor jurnal tetap, No. Trans ikut berubah", await noDari("j2") === "JV.2026.11.00003" && await evalJs("modulJurnal.ambil().find(function(j){return j.id==='j2';}).nomor==='BKK-8'"), await noDari("j2"));
    await evalJs("(function(){var d=modulJurnal.ambil().filter(function(j){return j.id!=='n1';}); modulJurnal.simpan(d); d=modulJurnal.ambil(); d.push({id:'n2',nomor:'JV-003',tanggal:'2026-11-02',rincian:[]}); modulJurnal.simpan(d); return true;})()");
    catat("Nomor yang dihapus tidak dipakai lagi", await noDari("n2") === "JV.2026.11.00005", await noDari("n2"));
    await evalJs("(function(){var d=modulJurnal.ambil(); d.push({id:'n3',nomor:'OTO-1',tanggal:'2026-12-01',rincian:[],sumber:{jenis:'donasi',id:'x'}}); modulJurnal.simpan(d); return true;})()");
    catat("Bulan baru mulai dari 00001; jurnal otomatis ikut bernomor", await noDari("n3") === "JV.2026.12.00001", await noDari("n3"));
    catat("Hitungan ikut Cadangan Data", await evalJs("jenisKunciCadangan.hitunganNomorJurnal==='objek'"));
    catat("Nomor di data rusak diganti nomor sah", await evalJs("(function(){var d=[{id:'r',tanggal:'rusak',noJurnal:{a:1}}]; beriNomorJurnal(d); return /^JV\\.\\d{4}\\.\\d{2}\\.\\d{5}$/.test(d[0].noJurnal);})()"));
    // Data rusak
    await evalJs("localStorage.setItem('daftarJurnal', JSON.stringify([null, 5, {id:'r1', tanggal:7, nomor:{a:1}, sumber:'x'}, {id:'r2', sumber:{jenis:'constructor', id:null}}])); true");
    await muatUlang();
    await evalJs("bukaLogJurnal(); [...document.querySelectorAll('#isi-log-jurnal tbody tr')].forEach(function(x){x.click(); bukaLogJurnal();}); true"); await tunggu(300);
    catat("Data rusak tidak membuat macet", galat.length === 0, JSON.stringify(galat));
    await evalJs("localStorage.removeItem('daftarJurnal'); true"); await muatUlang();
    await evalJs("bukaLogJurnal(); true"); await tunggu(250);
    catat("Tanpa jurnal: pesan kosong", await evalJs("document.querySelector('#isi-log-jurnal .tabel-kosong').textContent==='Belum ada jurnal.'"));
    await kirim("Emulation.setDeviceMetricsOverride", { width: 390, height: 844, deviceScaleFactor: 1, mobile: false }); await tunggu(300);
    await evalJs("modulLogJurnal.gambarTabel(); true");
    catat("Lebar 390: alat di dalam layar", await evalJs("document.querySelector('#isi-log-jurnal .toolbar-kanan').getBoundingClientRect().right<=window.innerWidth"));
    await foto("log-jurnal-hp.png");
    catat("Tidak ada galat atau peringatan di Console", galat.length === 0, JSON.stringify(galat));
  } catch (e) { console.log("GALAT: " + e.stack + "\nGalat halaman: " + JSON.stringify(galat)); hasil.push(false); }
  try { ws.close(); } catch (e) { /* abaikan */ } chrome.kill();
  console.log("Lolos " + hasil.filter(Boolean).length + " dari " + hasil.length); process.exit(hasil.every(Boolean) ? 0 : 1);
})();
