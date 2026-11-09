// Bilah atas pada banyak lebar layar, dan lebar tiap halaman di layar HP, di Chrome asli.
// Pemakaian: node uji-chrome-bar.js <chrome.exe> <index.html> <folder-profil> <folder-png>
// Lebar halaman yang sudah tercatat sebagai Temuan (3: deretan tab melebar, 4: kartu Dashboard, 12: Daftar melebar)
// dilaporkan sebagai CATATAN, bukan GAGAL, sampai Temuan itu diputuskan dan diperbaiki.
const { spawn } = require("child_process");
const fs = require("fs"), path = require("path");
const [chromeExe, halaman, folderProfil, folderPng] = process.argv.slice(2);
const PORT = 9358;
const tunggu = (ms) => new Promise(r => setTimeout(r, ms));
const siapUji = require("./bantu-siap.js");   // tunggu sampai aplikasi siap sesudah muat ulang
let id = 0; const menunggu = new Map(); let ws;
const kirim = (m, p = {}) => new Promise((s, g) => { const n = ++id; menunggu.set(n, { s, g }); ws.send(JSON.stringify({ id: n, method: m, params: p })); });
const evalJs = async (e) => { const r = await kirim("Runtime.evaluate", { expression: e, returnByValue: true }); if (r.exceptionDetails) throw new Error(JSON.stringify(r.exceptionDetails.exception.description) + " <<< " + e.slice(0, 160)); return r.result.value; };
const hasil = []; const catat = (n, ok, r = "") => { hasil.push(ok); console.log((ok ? "LOLOS  " : "GAGAL  ") + n + (r ? " -> " + r : "")); };
const catatan = (n) => console.log("CATATAN " + n);
const foto = async (nama) => { const r = await kirim("Page.captureScreenshot", { format: "png" }); fs.writeFileSync(path.join(folderPng, nama), Buffer.from(r.data, "base64")); };
const klik = (sel) => evalJs("(function(){var e=document.querySelector(" + JSON.stringify(sel) + "); if(!e){throw new Error('tidak ada: '+" + JSON.stringify(sel) + ");} e.click(); return true;})()");
const ukuran = (lebar) => kirim("Emulation.setDeviceMetricsOverride", { width: lebar, height: 800, deviceScaleFactor: 1, mobile: false });
// Memuat ulang lalu menunggu aplikasi benar-benar siap (skrip terakhir dashboard.js sudah jalan), bukan menunggu waktu tetap:
// aplikasi makin besar, jadi waktu tetap kadang kurang dan uji gagal di tempat yang acak.
const muatUlang = async () => {
  await kirim("Page.reload"); await siapUji(evalJs, tunggu);
  for (let i = 0; i < 100; i++) {
    try { if (await evalJs("document.readyState==='complete' && typeof gambarDashboard==='function'")) { break; } } catch (e) { /* halaman masih berganti */ }
    await tunggu(100);
  }
  await tunggu(200);
};
(async () => {
  fs.mkdirSync(folderPng, { recursive: true });
  const chrome = spawn(chromeExe, ["--headless=new", "--disable-gpu", "--no-first-run", "--remote-debugging-port=" + PORT, "--user-data-dir=" + folderProfil, "--window-size=1366,800", "file:///" + halaman.replace(/\\/g, "/")], { stdio: "ignore" });
  try {
    let t = null;
    for (let i = 0; i < 60 && !t; i++) { await tunggu(250); try { t = (await (await fetch("http://127.0.0.1:" + PORT + "/json/list")).json()).find(x => x.type === "page" && x.url.startsWith("file:")); } catch (e) { /* belum siap */ } }
    ws = new WebSocket(t.webSocketDebuggerUrl); await new Promise((s, g) => { ws.onopen = s; ws.onerror = g; });
    const galat = [];
    ws.onmessage = (m) => { const d = JSON.parse(m.data); if (d.method === "Runtime.exceptionThrown") galat.push(d.params.exceptionDetails.exception.description); if (d.id && menunggu.has(d.id)) { const p = menunggu.get(d.id); menunggu.delete(d.id); d.error ? p.g(new Error(JSON.stringify(d.error))) : p.s(d.result); } };
    await kirim("Runtime.enable"); await kirim("Page.enable"); await require("./bantu-sesi.js").masukChrome(kirim, "file:///" + halaman.replace(/\\/g, "/")); /* masuk sebagai pengguna uji (J.25) */
    await ukuran(1366); await tunggu(800);
    await evalJs("localStorage.clear(); true"); await muatUlang();

    // 1) Bilah atas muat di layar pada berbagai lebar (avatar dan tombol pembukuan tidak keluar layar)
    for (const lebar of [1366, 900, 760, 641, 640, 600, 520, 480, 420, 390, 360, 320]) {
      await ukuran(lebar); await tunggu(250);
      const o = JSON.parse(await evalJs("JSON.stringify((function(){var k=document.querySelector('.bar-kanan').getBoundingClientRect(), a=document.querySelector('.avatar').getBoundingClientRect(); return {layar:window.innerWidth, kanan:Math.round(k.right), avatar:Math.round(a.right), halaman:document.documentElement.scrollWidth};})())"));
      catat("Lebar " + lebar + ": bilah atas muat di layar (avatar dan bagian kanan di dalam layar)", o.avatar <= o.layar && o.kanan <= o.layar, JSON.stringify(o));
      if (o.halaman > o.layar) { catatan("Lebar " + lebar + ": halaman Dashboard " + o.halaman + " px melebihi layar " + o.layar + " px (Temuan 4)"); }
      if ([1366, 390, 320].includes(lebar)) { await foto("bar-" + lebar + ".png"); }
    }
    await ukuran(390); await tunggu(250);
    catat("Lebar 390: nama aplikasi terbaca penuh, Notifikasi tampil, Cari dan Bantuan tersembunyi", await evalJs("(function(){var n=document.querySelector('.merek-nama'); return n.scrollWidth<=n.clientWidth && document.querySelector('.ikon-bar[aria-label=\"Notifikasi\"]').offsetParent!==null && document.querySelector('.ikon-bar[aria-label=\"Cari\"]').offsetParent===null && document.querySelector('#tombol-bantuan').offsetParent===null;})()"));
    await ukuran(1366); await tunggu(250);
    catat("Lebar 1366: 3 ikon tampil, nama aplikasi penuh", await evalJs("document.querySelectorAll('.ikon-bar').length===3 && [...document.querySelectorAll('.ikon-bar')].every(function(i){return i.offsetParent!==null;}) && (function(){var n=document.querySelector('.merek-nama'); return n.scrollWidth<=n.clientWidth;})()"));

    // 2) Pilihan pembukuan di layar sempit
    await ukuran(360); await tunggu(250);
    await klik("#tombol-pembukuan"); await tunggu(250);
    catat("Lebar 360: tombol pembukuan membuka daftar, daftar di dalam layar", await evalJs("(function(){var d=document.getElementById('daftar-pembukuan'); var r=d.getBoundingClientRect(); return !d.hidden && r.left>=0 && r.right<=window.innerWidth;})()"));
    await foto("bar-360-pembukuan.png");
    await klik("#daftar-pembukuan .pembukuan-pilihan[data-nama='Unit usaha']"); await tunggu(250);
    catat("Memilih 'Unit usaha': nama di tombol berganti, daftar menutup, avatar tetap di dalam layar", await evalJs("document.getElementById('nama-pembukuan').textContent==='Unit usaha' && document.getElementById('daftar-pembukuan').hidden && document.querySelector('.avatar').getBoundingClientRect().right<=window.innerWidth"));
    await klik("#tombol-pembukuan"); await tunggu(150); await klik("#daftar-pembukuan .pembukuan-pilihan[data-nama='Yayasan']"); await tunggu(150);
    catat("Kembali ke 'Yayasan'", await evalJs("document.getElementById('nama-pembukuan').textContent==='Yayasan'"));

    // 3) Setiap halaman dari menu dibuka sendiri-sendiri (muat ulang tiap kali) di lebar 390: tidak ada galat skrip.
    //    Lebar halaman dibandingkan dengan lebar Dashboard sendiri (Temuan 4), supaya yang dilaporkan hanya tambahan dari halaman itu.
    await ukuran(390); await tunggu(250);
    await muatUlang();
    const dasar = await evalJs("Math.max(window.innerWidth, document.documentElement.scrollWidth)");
    const menu = JSON.parse(await evalJs("JSON.stringify([...document.querySelectorAll('[id^=\"panel-\"]')].filter(function(p){return document.getElementById('tombol-'+p.id.replace('panel-',''));}).map(function(p){return {k:p.id.replace('panel-',''), hal:[...p.querySelectorAll('.kotak-menu[data-halaman]')].map(function(a){return a.getAttribute('data-halaman');})};}))"));
    let jumlahHalaman = 0;
    for (const m of menu) {
      for (const h of m.hal) {
        await muatUlang();
        const galatSebelum = galat.length;
        await klik("#tombol-" + m.k); await tunggu(250);
        await klik("#panel-" + m.k + " .kotak-menu[data-halaman=\"" + h + "\"]"); await tunggu(450);
        jumlahHalaman++;
        const lebarHal = await evalJs("document.documentElement.scrollWidth");
        catat("Halaman " + h + " dibuka di lebar 390 tanpa galat skrip", galat.length === galatSebelum, galat.slice(galatSebelum).join(" | "));
        if (lebarHal > dasar) { catatan("Halaman " + h + " di lebar 390: " + lebarHal + " px (Dashboard sendiri " + dasar + " px) — Temuan 12"); }
      }
    }
    catat("Semua halaman menu dicoba (" + jumlahHalaman + ")", jumlahHalaman > 20, String(jumlahHalaman));
  } catch (e) { console.log("GALAT: " + e.stack); hasil.push(false); }
  try { ws.close(); } catch (e) { /* abaikan */ } chrome.kill();
  console.log("Lolos " + hasil.filter(Boolean).length + " dari " + hasil.length); process.exit(hasil.every(Boolean) ? 0 : 1);
})();
