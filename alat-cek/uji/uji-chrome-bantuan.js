// Petunjuk Penggunaan (lampu, J.35, PRD 6.16) di Chrome asli: tombol lampu di halaman yang punya petunjuk, popup topik kiri/isi kanan,
// pindah topik, isi aman sebagai teks, tutup dengan tombol dan Esc, tampilan HP. Halaman tanpa petunjuk tidak punya lampu.
// Pemakaian: node uji-chrome-bantuan.js <chrome.exe> <index.html> <folder-profil> <folder-png>
const { spawn } = require("child_process");
const fs = require("fs"), path = require("path");
const [chromeExe, halaman, folderProfil, folderPng] = process.argv.slice(2);
const PORT = 9418;
const tunggu = (ms) => new Promise(r => setTimeout(r, ms));
const siapUji = require("./bantu-siap.js");
let id = 0; const menunggu = new Map(); let ws;
const kirim = (m, p = {}) => new Promise((s, g) => { const n = ++id; menunggu.set(n, { s, g }); ws.send(JSON.stringify({ id: n, method: m, params: p })); });
const evalJs = async (e) => { const r = await kirim("Runtime.evaluate", { expression: e, returnByValue: true }); if (r.exceptionDetails) throw new Error(JSON.stringify(r.exceptionDetails.exception.description) + " <<< " + e.slice(0, 160)); return r.result.value; };
const hasil = []; const catat = (n, ok, r = "") => { hasil.push(!!ok); console.log((ok ? "LOLOS  " : "GAGAL  ") + n + (r ? " -> " + r : "")); };
const foto = async (nama) => { const r = await kirim("Page.captureScreenshot", { format: "png" }); fs.writeFileSync(path.join(folderPng, nama), Buffer.from(r.data, "base64")); };
const muatUlang = async () => { await kirim("Page.reload"); await siapUji(evalJs, tunggu); };

(async () => {
  fs.mkdirSync(folderPng, { recursive: true });
  const chrome = spawn(chromeExe, ["--headless=new", "--disable-gpu", "--no-first-run", "--remote-debugging-port=" + PORT, "--user-data-dir=" + folderProfil, "--window-size=1366,900", "file:///" + halaman.replace(/\\/g, "/")], { stdio: "ignore" });
  try {
    let t = null;
    for (let i = 0; i < 60 && !t; i++) { await tunggu(250); try { t = (await (await fetch("http://127.0.0.1:" + PORT + "/json/list")).json()).find(x => x.type === "page" && x.url.startsWith("file:")); } catch (e) { /* belum siap */ } }
    ws = new WebSocket(t.webSocketDebuggerUrl); await new Promise((s, g) => { ws.onopen = s; ws.onerror = g; });
    const galat = [];
    ws.onmessage = (m) => { const d = JSON.parse(m.data); if (d.method === "Runtime.exceptionThrown") galat.push(d.params.exceptionDetails.exception.description); if (d.id && menunggu.has(d.id)) { const p = menunggu.get(d.id); menunggu.delete(d.id); d.error ? p.g(new Error(JSON.stringify(d.error))) : p.s(d.result); } };
    await kirim("Runtime.enable"); await kirim("Page.enable");
    await kirim("Emulation.setDeviceMetricsOverride", { width: 1366, height: 900, deviceScaleFactor: 1, mobile: false });
    await require("./bantu-sesi.js").masukChrome(kirim, "file:///" + halaman.replace(/\\/g, "/"));
    await evalJs("localStorage.clear(); true"); await muatUlang();

    // 1) Lampu di halaman Divisi, di kanan baris tombol hijau
    await evalJs("bukaDivisiBaru(); true"); await tunggu(250);
    const lampu = JSON.parse(await evalJs("JSON.stringify((function(){var l=document.querySelector('#isi-divisi .modul-bar .tombol-lampu'); if(!l){return null;} var b=l.getBoundingClientRect(), bar=l.parentElement.getBoundingClientRect(); return {title:l.title, label:l.getAttribute('aria-label'), kanan:Math.round(bar.right-b.right), terlihat:b.width>0};})())"));
    catat("Divisi: tombol lampu ada di baris tombol hijau, menempel di kanan, tulisan 'Petunjuk Penggunaan'",
      lampu && lampu.terlihat && lampu.kanan <= 2 && lampu.title === "Petunjuk Penggunaan" && lampu.label === "Petunjuk Penggunaan Divisi", JSON.stringify(lampu));
    catat("Halaman tanpa petunjuk (Akun Perkiraan, untuk sementara) tidak punya lampu", await evalJs("!document.querySelector('#isi-akun .tombol-lampu')"));
    // J.36: Program, Karyawan, Gaji/Tunjangan, Dashboard punya lampu dan petunjuknya terbuka dengan judul yang benar
    for (const [kunci, judul] of [["program", "Program"], ["karyawan", "Karyawan"], ["gaji", "Gaji/Tunjangan"], ["dashboard", "Dashboard"]]) {
      const ok = await evalJs("(function(){var l=document.querySelector('#isi-" + kunci + " .tombol-lampu'); if(!l){return false;} l.click(); var d=document.getElementById('dialog-bantuan'); var hasil=d.open && document.getElementById('judul-bantuan').textContent==='Petunjuk Penggunaan · " + judul + "' && document.querySelectorAll('#bantuan-topik button').length>=5 && document.querySelector('#bantuan-isi h3').textContent.length>0; d.close(); return hasil;})()");
      catat("Petunjuk " + judul + ": lampu ada dan popup terbuka dengan topik", ok);
    }
    catat("Dashboard: lampu di baris atas sesudah tombol + Widget", await evalJs("(function(){var l=document.querySelector('#isi-dashboard .dash-atas .tombol-lampu'); return !!l && l.previousElementSibling && l.previousElementSibling.id==='tombol-widget';})()"));
    await foto("bantuan-lampu.png");

    // 2) Popup: judul, topik kiri, isi kanan (topik pertama)
    await evalJs("document.querySelector('#isi-divisi .tombol-lampu').click(); true"); await tunggu(200);
    const p = JSON.parse(await evalJs("JSON.stringify({buka: document.getElementById('dialog-bantuan').open, judul: document.getElementById('judul-bantuan').textContent, topik: [...document.querySelectorAll('#bantuan-topik button')].map(function(b){return b.textContent;}), aktif: document.querySelector('#bantuan-topik [aria-current=\"true\"]').textContent, h3: document.querySelector('#bantuan-isi h3').textContent, fokus: document.activeElement.textContent})"));
    catat("Klik lampu: popup 'Petunjuk Penggunaan · Divisi' terbuka di topik pertama", p.buka && p.judul === "Petunjuk Penggunaan · Divisi" && p.aktif === "Tentang Divisi" && p.h3 === "Tentang Divisi", JSON.stringify(p));
    catat("Topik: Tentang, Membuat, Isian, Daftar, Mengubah, Menghapus, Tombol, Hal Penting (8)", p.topik.length === 8, JSON.stringify(p.topik));
    catat("Teks **tebal** menjadi huruf tebal, bukan tanda bintang", await evalJs("document.querySelector('#bantuan-isi strong').textContent==='Divisi' && document.getElementById('bantuan-isi').textContent.indexOf('**')===-1"));
    await foto("bantuan-tentang.png");
    await evalJs("[...document.querySelectorAll('#bantuan-topik button')].find(function(b){return b.textContent==='Isian';}).click(); true"); await tunggu(100);
    catat("Pindah ke topik Isian: tabel Isian | Wajib | Penjelasan dengan Nama dan Keterangan", await evalJs("(function(){var t=document.querySelector('#bantuan-isi .tabel-bantuan'); return !!t && [...t.tHead.rows[0].cells].map(function(c){return c.textContent;}).join('|')==='Isian|Wajib|Penjelasan' && t.tBodies[0].rows.length===2 && document.querySelector('#bantuan-topik [aria-current=\"true\"]').textContent==='Isian';})()"));
    await foto("bantuan-isian.png");

    // 3) Isi dipasang sebagai teks (kode HTML di dalam teks petunjuk tidak dijalankan)
    await evalJs("document.getElementById('dialog-bantuan').close(); daftarkanBantuan('uji-aman', { judul: 'Uji', topik: [{ judul: 'A', isi: ['<img src=x onerror=window.__jahat=1>'] }] }); DAFTAR_BANTUAN['uji-aman'] && bukaBantuan('uji-aman'); true"); await tunggu(150);
    catat("Teks berisi kode HTML tampil sebagai teks, tidak dijalankan", await evalJs("!window.__jahat && !document.querySelector('#bantuan-isi img') && document.getElementById('bantuan-isi').textContent.indexOf('<img')!==-1"));
    await evalJs("delete DAFTAR_BANTUAN['uji-aman']; true");

    // 4) Tutup: tombol Tutup, ×, dan Esc
    await evalJs("document.getElementById('selesai-bantuan').click(); true");
    catat("Tombol Tutup menutup popup", !(await evalJs("document.getElementById('dialog-bantuan').open")));
    await evalJs("bukaBantuan('divisi'); true"); await tunggu(100);
    await kirim("Input.dispatchKeyEvent", { type: "keyDown", key: "Escape", code: "Escape", windowsVirtualKeyCode: 27 });
    await kirim("Input.dispatchKeyEvent", { type: "keyUp", key: "Escape", code: "Escape", windowsVirtualKeyCode: 27 }); await tunggu(150);
    catat("Esc menutup popup", !(await evalJs("document.getElementById('dialog-bantuan').open")));

    // 5) Layar HP: topik berderet di atas, popup di dalam layar
    await kirim("Emulation.setDeviceMetricsOverride", { width: 390, height: 800, deviceScaleFactor: 1, mobile: false }); await tunggu(250);
    await evalJs("bukaBantuan('divisi'); true"); await tunggu(150);
    catat("Lebar 390: popup dan lampu di dalam layar", await evalJs("document.getElementById('dialog-bantuan').getBoundingClientRect().right<=window.innerWidth && document.querySelector('#isi-divisi .tombol-lampu').getBoundingClientRect().right<=window.innerWidth"));
    await foto("bantuan-390.png");

    catat("Tidak ada galat skrip", galat.length === 0, galat.join(" | "));
  } catch (e) { console.log("GALAT: " + e.stack); hasil.push(false); }
  try { ws.close(); } catch (e) { /* abaikan */ } chrome.kill();
  console.log("Lolos " + hasil.filter(Boolean).length + " dari " + hasil.length); process.exit(hasil.every(Boolean) ? 0 : 1);
})();
