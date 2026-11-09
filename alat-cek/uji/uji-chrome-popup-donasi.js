// Uji popup menu Donasi (D1.1) di Chrome asli. Pemakaian: node uji-chrome-popup-donasi.js <chrome.exe> <index.html> <folder-profil> <folder-png>
const { spawn } = require("child_process");
const fs = require("fs"), path = require("path"), zlib = require("zlib");
const [chromeExe, halaman, folderProfil, folderPng] = process.argv.slice(2);
const PORT = 9378;
const tunggu = (ms) => new Promise(r => setTimeout(r, ms));
const siapUji = require("./bantu-siap.js");   // tunggu sampai aplikasi siap sesudah muat ulang
let id = 0; const menunggu = new Map(); let ws;
const kirim = (m, p = {}) => new Promise((s, g) => { const n = ++id; menunggu.set(n, { s, g }); ws.send(JSON.stringify({ id: n, method: m, params: p })); });
const evalJs = async (e) => { const r = await kirim("Runtime.evaluate", { expression: e, returnByValue: true, awaitPromise: true }); if (r.exceptionDetails) throw new Error(JSON.stringify(r.exceptionDetails.exception.description)); return r.result.value; };
const hasil = []; const catat = (n, ok, r = "") => { hasil.push(ok); console.log((ok ? "LOLOS  " : "GAGAL  ") + n + (r ? " -> " + r : "")); };
const foto = async (nama) => { const r = await kirim("Page.captureScreenshot", { format: "png" }); fs.writeFileSync(path.join(folderPng, nama), Buffer.from(r.data, "base64")); };
const klik = async (sel) => { const j = JSON.parse(await evalJs(`(function(){var e=document.querySelector(${JSON.stringify(sel)}); e.scrollIntoView({block:'center'}); var r=e.getBoundingClientRect(); return JSON.stringify({x:r.left+r.width/2,y:r.top+r.height/2});})()`)); await kirim("Input.dispatchMouseEvent", { type: "mouseMoved", x: j.x, y: j.y }); await kirim("Input.dispatchMouseEvent", { type: "mousePressed", x: j.x, y: j.y, button: "left", clickCount: 1 }); await kirim("Input.dispatchMouseEvent", { type: "mouseReleased", x: j.x, y: j.y, button: "left", clickCount: 1 }); };
const PEMBUNGKUS_AKUN = `(function(){
  // KHUSUS UJI: akun paling atas dibungkus Akar Uji > Grup Uji, supaya akun lama menjadi tingkat 3 (aturan baru pilihan akun).
  function bungkus(teks){ try { var a = JSON.parse(teks || "[]"); if (!Array.isArray(a)) return teks;
    a.forEach(function(x){ if (!x.indukId && x.id !== "uji-akar") x.indukId = "uji-g"; if (x.id === "uji-g") x.indukId = "uji-akar"; });
    if (!a.some(function(x){ return x.id === "uji-akar"; })) a.push({ id: "uji-akar", kode: "9", nama: "Akar Uji", tipe: "aset-lain", indukId: "", saldoAwal: 0 });
    if (!a.some(function(x){ return x.id === "uji-g"; })) a.push({ id: "uji-g", kode: "91", nama: "Grup Uji", tipe: "aset-lain", indukId: "uji-akar", saldoAwal: 0 });
    var akar = a.find(function(x){ return x.id === "uji-akar"; }); akar.indukId = "";
    return JSON.stringify(a); } catch (e) { return teks; } }
  var asli = Storage.prototype.setItem;
  Storage.prototype.setItem = function (k, v) { return asli.call(this, k, k === "daftarAkun" ? bungkus(v) : v); };
  try { var ada = localStorage.getItem("daftarAkun"); if (ada) asli.call(localStorage, "daftarAkun", bungkus(ada)); } catch (e) {}
})();`;
(async () => {
  fs.mkdirSync(folderPng, { recursive: true });
  const galat = [];
  const chrome = spawn(chromeExe, ["--headless=new", "--disable-gpu", "--no-first-run", "--remote-debugging-port=" + PORT, "--user-data-dir=" + folderProfil, "--window-size=1366,900", "file:///" + halaman.replace(/\\/g, "/")], { stdio: "ignore" });
  try {
    let t = null;
    for (let i = 0; i < 60 && !t; i++) { await tunggu(250); try { t = (await (await fetch("http://127.0.0.1:" + PORT + "/json/list")).json()).find(x => x.type === "page" && x.url.startsWith("file:")); } catch (e) {} }
    ws = new WebSocket(t.webSocketDebuggerUrl); await new Promise((s, g) => { ws.onopen = s; ws.onerror = g; });
    ws.onmessage = (m) => { const d = JSON.parse(m.data); if (d.method === "Runtime.exceptionThrown") galat.push(d.params.exceptionDetails.exception.description); if (d.method === "Runtime.consoleAPICalled" && ["error", "warning"].includes(d.params.type)) galat.push(d.params.args.map(a => a.value).join(" ")); if (d.id && menunggu.has(d.id)) { const p = menunggu.get(d.id); menunggu.delete(d.id); d.error ? p.g(new Error(JSON.stringify(d.error))) : p.s(d.result); } };
    await kirim("Runtime.enable"); await kirim("Page.enable"); await require("./bantu-sesi.js").masukChrome(kirim, "file:///" + halaman.replace(/\\/g, "/")); /* masuk sebagai pengguna uji (J.25) */ await kirim("Page.addScriptToEvaluateOnNewDocument", { source: PEMBUNGKUS_AKUN }); await kirim("Page.reload"); await siapUji(evalJs, tunggu);
    await kirim("Emulation.setDeviceMetricsOverride", { width: 1366, height: 900, deviceScaleFactor: 1, mobile: false });
    await tunggu(800);
    await evalJs(`(function(){ localStorage.clear();
      localStorage.setItem('daftarAkun', JSON.stringify([{id:'a1',kode:'110101',nama:'Kas Kecil',tipe:'kas-bank',saldoAwal:0},{id:'a3',kode:'210101',nama:'Utang Gaji',tipe:'liabilitas-pendek',saldoAwal:0},{id:'a4',kode:'610101',nama:'Beban Gaji',tipe:'beban',saldoAwal:0}]));
      localStorage.setItem('daftarPenomoran', JSON.stringify([{id:'g1',nama:'Pencatatan Gaji',pembukuan:'yayasan',tipe:'gaji',digit:4,komponen:[{jenis:'teks',nilai:'GJ-'},{jenis:'counter'}]}]));
      localStorage.setItem('daftarKaryawan', JSON.stringify([{id:'k1',nama:'Gunawan',nomor:'P-001',jabatan:'Ketua'},{id:'k2',nama:'Ani Lestari',nomor:'P-002',jabatan:'Guru'}]));
      localStorage.setItem('daftarDivisi', JSON.stringify([{id:'d1',nama:'Pendidikan'},{id:'d2',nama:'Umum'}]));
      localStorage.setItem('daftarProgram', JSON.stringify([{id:'p1',nama:'Donasi Gaji Guru',divisiId:'d1',sifat:'terikat',status:'aktif'}]));
      return true; })()`);
    await kirim("Page.reload"); await siapUji(evalJs, tunggu);
    const ketik = (x) => kirim("Input.insertText", { text: x });
    const tombol = async (key, code, vk) => { await kirim("Input.dispatchKeyEvent", { type: "keyDown", key, code, windowsVirtualKeyCode: vk }); await kirim("Input.dispatchKeyEvent", { type: "keyUp", key, code, windowsVirtualKeyCode: vk }); };

    const nilai = (id) => evalJs("document.getElementById('" + id + "').value");
    const gajiTersimpan = () => evalJs("JSON.parse(localStorage.getItem('daftarPencatatanGaji')||'[]')");
    const jurnalTersimpan = () => evalJs("JSON.parse(localStorage.getItem('daftarJurnal')||'[]')");
    const galatTeks = () => evalJs("document.getElementById('pgaji-pesan-galat').hidden ? '' : document.getElementById('pgaji-pesan-galat').textContent");
    async function tambahKaryawan(kata, angka) {
      await klik("#pgaji-cari-karyawan"); await ketik(kata); await tunggu(200); await tombol("Enter", "Enter", 13); await tunggu(400);
      await ketik(angka[0]);
      if (angka[1]) { await klik("#rgaji-iuran"); await ketik(angka[1]); }
      await klik("#lanjut-rincian-gaji"); await tunggu(400);
    }
    // ===== D1.1: popup menu Donasi (PRD 6.1) =====
    const kotakTampil = () => evalJs("[...document.querySelectorAll('#panel-donasi .kotak-menu')].filter(function(k){return !k.hidden && k.offsetParent!==null;}).map(function(k){return k.dataset.halaman + ':' + (k.classList.contains('kotak-hijau')?'hijau':k.classList.contains('kotak-oranye')?'oranye':'biru');}).join('|')");
    catat("Ikon Donasi di menu samping punya tombol popup (tombol-donasi, aria-haspopup)", await evalJs("(function(){var t=document.getElementById('tombol-donasi'); return !!t && t.getAttribute('data-tooltip')==='Donasi' && t.getAttribute('aria-haspopup')==='dialog';})()"));
    await klik("#tombol-donasi"); await tunggu(400);
    catat("Klik ikon Donasi: popup 'Donasi' terbuka", await evalJs("document.getElementById('panel-donasi').open && document.getElementById('judul-donasi').textContent==='Donasi'"));
    catat("5 kotak tampil (Penyaluran Bantuan dan Pengembalian Donasi dihilangkan 2026-10-29), urutan dan warna seperti PRD 6.1", (await kotakTampil()) === "Pencatatan Donasi:hijau|Pemindahan Dana:hijau|Kategori Donasi:biru|Donatur:biru|Target Donasi:oranye", await kotakTampil());
    catat("Warna kotak benar-benar berbeda (hijau, biru, oranye)", await evalJs("(function(){var w=function(h){return getComputedStyle(document.querySelector('#panel-donasi .kotak-menu[data-halaman=\"'+h+'\"]')).backgroundColor;}; var a=w('Pencatatan Donasi'), b=w('Donatur'), c=w('Target Donasi'); return a!==b && b!==c && a!==c;})()"));
    await foto("popup-donasi.png");
    await klik('#panel-donasi .kotak-menu[data-halaman="Pemindahan Dana"]'); await tunggu(400);
    catat("Semua kotak sudah dibuat: klik Pemindahan Dana membuka tab Pemindahan Dana, tanpa notifikasi 'belum tersedia'", await evalJs("!document.getElementById('panel-donasi').open && !document.getElementById('isi-pemindahan-dana').hidden && !/belum tersedia/.test(document.getElementById('area-notifikasi').textContent)"));
    // Preferensi > Fitur: saklar Pengembalian Donasi (dihapus 2026-10-29), Kategori Keuangan, dan Donatur tidak ada lagi
    catat("Preferensi > Fitur: tidak ada saklar Pengembalian Donasi, Kategori Keuangan, maupun Donatur", await evalJs("!document.querySelector('[data-fitur=\"pengembalianDonasi\"]') && !document.querySelector('[data-fitur=\"kategori\"]') && !document.querySelector('[data-fitur=\"donatur\"]')"));
    // Data lama yang masih menyimpan pengembalianDonasi: true tidak memunculkan kotak apa pun dan tidak membuat macet
    await evalJs("(function(){ var f=JSON.parse(localStorage.getItem('fiturYayasan')||'{}'); f.pengembalianDonasi=true; localStorage.setItem('fiturYayasan', JSON.stringify(f)); return true; })()");
    await klik("#tombol-donasi"); await tunggu(400);
    catat("Data lama dengan pengembalianDonasi: true: popup tetap 5 kotak yang sama", (await kotakTampil()) === "Pencatatan Donasi:hijau|Pemindahan Dana:hijau|Kategori Donasi:biru|Donatur:biru|Target Donasi:oranye", await kotakTampil());
    await klik("#tutup-donasi"); await tunggu(300);
    catat("Tombol X menutup popup", await evalJs("!document.getElementById('panel-donasi').open"));
    // Layar HP
    await kirim("Emulation.setDeviceMetricsOverride", { width: 390, height: 844, deviceScaleFactor: 1, mobile: true }); await tunggu(400);
    await klik("#tombol-donasi"); await tunggu(400);
    // Catatan: halaman Dashboard di 390 sendiri sudah melebar (masalah lama), jadi yang diukur popup-nya saja
    catat("Lebar HP 390: popup Donasi muat di layar (tepi kiri >= 0, kanan <= 390), sama dengan popup Kas & Bank", await evalJs("(function(){var r=document.getElementById('panel-donasi').getBoundingClientRect(); return r.left >= 0 && r.right <= 390;})()"));
    await foto("popup-donasi-390.png");
    catat("Tidak ada galat atau peringatan di Console", galat.length === 0, JSON.stringify(galat));
  } catch (e) { console.log("GALAT: " + e.stack); hasil.push(false); }
  try { ws.close(); } catch (e) {} chrome.kill();
  console.log("Lolos " + hasil.filter(Boolean).length + " dari " + hasil.length); process.exit(hasil.every(Boolean) ? 0 : 1);
})();
