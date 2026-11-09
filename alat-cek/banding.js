// Banding tangkapan layar: membuka dashboard, setiap popup menu, dan setiap halaman dari popup itu di Chrome asli
// (lebar 1366 dan 390 px, data awal kosong, tanggal dibuat tetap 2 Nov 2026 supaya hasil tidak berubah karena hari
// berganti), lalu membandingkan piksel dengan foto acuan di alat-cek/acuan/.
// Pemakaian: node alat-cek/banding.js          -> bandingkan dengan acuan
//            node alat-cek/banding.js acuan    -> jadikan foto sekarang sebagai acuan baru (setelah tampilan dicek)
const { spawn } = require("child_process");
const fs = require("fs"), path = require("path"), os = require("os");
const CHROME = "C:/Program Files/Google/Chrome/Application/chrome.exe";
const PORT = 9399;
const akar = path.join(__dirname, "..");
const folderAcuan = path.join(__dirname, "acuan");
const folderBaru = path.join(__dirname, ".sementara", "banding");
const modeAcuan = process.argv[2] === "acuan";
const tunggu = (ms) => new Promise(r => setTimeout(r, ms));
let id = 0, ws;
const menunggu = new Map();
const kirim = (m, p = {}) => new Promise((s, g) => { const n = ++id; menunggu.set(n, { s, g }); ws.send(JSON.stringify({ id: n, method: m, params: p })); });
const evalJs = async (e) => {
  const r = await kirim("Runtime.evaluate", { expression: e, returnByValue: true, awaitPromise: true });
  if (r.exceptionDetails) { throw new Error(r.exceptionDetails.exception ? r.exceptionDetails.exception.description : r.exceptionDetails.text); }
  return r.result.value;
};
const klik = (sel) => evalJs("(function(){var e=document.querySelector(" + JSON.stringify(sel) + "); if(!e){return false;} e.click(); return true;})()");
// Tanggal tetap: new Date() tanpa isian dan Date.now() memakai 2 Nov 2026 pukul 09.00
const TANGGAL_TETAP = "(function(){var T=new Date(2026,10,2,9,0,0).getTime(); var D=Date; function F(){ if(!(this instanceof F)){return new D(T).toString();} var a=[].slice.call(arguments); return a.length?new (Function.prototype.bind.apply(D,[null].concat(a)))():new D(T);} F.prototype=D.prototype; F.now=function(){return T;}; F.parse=D.parse; F.UTC=D.UTC; window.Date=F;})();";

(async () => {
  fs.mkdirSync(folderBaru, { recursive: true });
  fs.mkdirSync(folderAcuan, { recursive: true });
  const profil = fs.mkdtempSync(path.join(os.tmpdir(), "banding-keuangan-"));
  const chrome = spawn(CHROME, ["--headless=new", "--disable-gpu", "--no-first-run", "--hide-scrollbars", "--force-color-profile=srgb",
    "--remote-debugging-port=" + PORT, "--user-data-dir=" + profil, "about:blank"], { stdio: "ignore" });
  let keluar = 0;
  try {
    let t = null;
    for (let i = 0; i < 60 && !t; i++) { await tunggu(250); try { t = (await (await fetch("http://127.0.0.1:" + PORT + "/json/list")).json()).find(x => x.type === "page"); } catch (e) { /* Chrome belum siap */ } }
    ws = new WebSocket(t.webSocketDebuggerUrl);
    await new Promise((s, g) => { ws.onopen = s; ws.onerror = g; });
    const galat = [];
    ws.onmessage = (m) => {
      const d = JSON.parse(m.data);
      if (d.method === "Runtime.exceptionThrown") { galat.push(d.params.exceptionDetails.exception ? d.params.exceptionDetails.exception.description : d.params.exceptionDetails.text); }
      if (d.id && menunggu.has(d.id)) { const p = menunggu.get(d.id); menunggu.delete(d.id); if (d.error) { p.g(new Error(JSON.stringify(d.error))); } else { p.s(d.result); } }
    };
    await kirim("Runtime.enable"); await kirim("Page.enable");
    await kirim("Page.addScriptToEvaluateOnNewDocument", { source: require("./uji/bantu-sesi.js").SKRIP }); /* masuk sebagai pengguna uji (J.25) */
    await kirim("Page.addScriptToEvaluateOnNewDocument", { source: TANGGAL_TETAP });
    // Animasi, transisi, dan kursor berkedip dimatikan supaya foto tidak tertangkap di tengah gerakan
    await kirim("Page.addScriptToEvaluateOnNewDocument", { source: "document.addEventListener('DOMContentLoaded',function(){var s=document.createElement('style'); s.textContent='*,*::before,*::after{animation:none!important;transition:none!important;caret-color:transparent!important}'; document.head.appendChild(s);});" });
    const url = "file:///" + path.join(akar, "index.html").replace(/\\/g, "/");

    // Daftar pemandangan diambil dari menu yang ada: popup = panel-xxx (dibuka #tombol-xxx), halaman = .kotak-menu di dalamnya
    const daftar = [{ nama: "dashboard" }];
    const ukuran = async (lebar) => { await kirim("Emulation.setDeviceMetricsOverride", { width: lebar, height: lebar > 600 ? 800 : 844, deviceScaleFactor: 1, mobile: false }); };
    // Menunggu halaman benar-benar siap (bukan waktu tetap): di komputer yang sibuk skrip lebih lambat dimuat
    const bukaSiap = async () => {
      await kirim("Page.navigate", { url }); await tunggu(300);
      for (let i = 0; i < 100; i++) { if (await evalJs("document.readyState==='complete'")) { break; } await tunggu(200); }
      await tunggu(500);
    };
    const mulaiBersih = async (lebar) => {
      await ukuran(lebar);
      await bukaSiap();
      await evalJs("localStorage.clear(); sessionStorage.clear(); true");
      await bukaSiap();
    };
    await mulaiBersih(1366);
    const menu = JSON.parse(await evalJs("JSON.stringify([...document.querySelectorAll('[id^=\"panel-\"]')].map(function(p){var k=p.id.replace('panel-',''); return {k:k, ada:!!document.getElementById('tombol-'+k), hal:[...p.querySelectorAll('.kotak-menu[data-halaman]')].map(function(a){return a.getAttribute('data-halaman');})};}))"));
    // Ikon menu samping yang langsung membuka halaman (tanpa popup), misalnya Laporan
    const langsung = JSON.parse(await evalJs("JSON.stringify([...document.querySelectorAll('.menu-samping .menu-item[id^=\"tombol-\"]')].map(function(a){return a.id.replace('tombol-','');}).filter(function(k){return !document.getElementById('panel-'+k);}))"));
    langsung.forEach(k => daftar.push({ nama: "halaman-" + k, tombol: "#tombol-" + k }));
    menu.filter(m => m.ada).forEach(m => {
      daftar.push({ nama: "popup-" + m.k, tombol: "#tombol-" + m.k });
      m.hal.forEach(h => daftar.push({ nama: m.k + "-" + h.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, ""), tombol: "#tombol-" + m.k, kotak: "#panel-" + m.k + " .kotak-menu[data-halaman=\"" + h + "\"]" }));
    });

    const hasil = [];
    for (const lebar of [1366, 390]) {
      for (const p of daftar) {
        await mulaiBersih(lebar);
        if (p.tombol) { await klik(p.tombol); await tunggu(350); }
        if (p.kotak) { await klik(p.kotak); await tunggu(600); await evalJs("document.querySelectorAll('.notifikasi').forEach(function(n){n.remove();}); true"); }
        await evalJs("document.activeElement && document.activeElement.blur && document.activeElement.blur(); true");
        const nama = p.nama + "-" + lebar + ".png";
        const r = await kirim("Page.captureScreenshot", { format: "png" });
        fs.writeFileSync(path.join(folderBaru, nama), Buffer.from(r.data, "base64"));
        hasil.push(nama);
      }
    }
    if (galat.length) { console.log("GALAT skrip saat memotret: " + galat.slice(0, 3).join(" | ")); keluar = 1; }

    if (modeAcuan) {
      fs.readdirSync(folderAcuan).filter(n => n.endsWith(".png")).forEach(n => fs.unlinkSync(path.join(folderAcuan, n)));
      hasil.forEach(n => fs.copyFileSync(path.join(folderBaru, n), path.join(folderAcuan, n)));
      console.log("Acuan baru disimpan: " + hasil.length + " foto (" + daftar.length + " pemandangan x 2 lebar)");
    } else {
      // Bandingkan piksel di dalam Chrome (gambar dimuat ke canvas), supaya tidak perlu pustaka PNG tambahan
      let beda = 0, sama = 0;
      for (const n of hasil) {
        const fAcuan = path.join(folderAcuan, n);
        if (!fs.existsSync(fAcuan)) { console.log("BARU   " + n + " (belum ada acuan)"); beda++; continue; }
        const a = fs.readFileSync(fAcuan).toString("base64"), b = fs.readFileSync(path.join(folderBaru, n)).toString("base64");
        if (a === b) { sama++; continue; }
        const hitung = await evalJs("(async function(){function muat(s){return new Promise(function(ok){var i=new Image(); i.onload=function(){ok(i);}; i.src='data:image/png;base64,'+s;});} var x=await muat(" + JSON.stringify(a) + "), y=await muat(" + JSON.stringify(b) + "); if(x.width!==y.width||x.height!==y.height){return 'ukuran '+x.width+'x'+x.height+' -> '+y.width+'x'+y.height;} function data(i){var c=document.createElement('canvas'); c.width=i.width; c.height=i.height; var g=c.getContext('2d'); g.drawImage(i,0,0); return g.getImageData(0,0,i.width,i.height).data;} var p=data(x), q=data(y), n=0; for(var k=0;k<p.length;k+=4){ if(p[k]!==q[k]||p[k+1]!==q[k+1]||p[k+2]!==q[k+2]){n++;} } return n;})()");
        if (hitung === 0) { sama++; continue; }
        beda++;
        console.log("BEDA   " + n + " -> " + (typeof hitung === "number" ? hitung + " piksel" : hitung));
      }
      daftar.length && fs.readdirSync(folderAcuan).filter(n => n.endsWith(".png") && !hasil.includes(n)).forEach(n => { console.log("HILANG " + n + " (ada di acuan, tidak ada sekarang)"); beda++; });
      console.log("Banding: " + sama + " sama, " + beda + " berbeda (dari " + hasil.length + " foto). Foto sekarang: " + folderBaru);
      if (beda) { keluar = 1; }
    }
  } catch (e) {
    console.log("GALAT banding: " + e.message); keluar = 1;
  } finally {
    try { ws && ws.close(); } catch (e) { /* abaikan */ }
    chrome.kill();
    await tunggu(500);
    try { fs.rmSync(profil, { recursive: true, force: true }); } catch (e) { /* profil Chrome kadang masih terkunci sebentar */ }
  }
  process.exit(keluar);
})();
