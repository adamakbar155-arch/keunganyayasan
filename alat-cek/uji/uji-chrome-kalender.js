// Rincian Jurnal di Chrome asli: keyboard dan mouse nyata. Pemakaian: node uji-chrome-rincian.js <chrome.exe> <menu.html> <folder-profil> <folder-png>
const { spawn } = require("child_process");
const fs = require("fs"), path = require("path");
const [chromeExe, halaman, folderProfil, folderPng] = process.argv.slice(2);
const PORT = 9356;
const tunggu = (ms) => new Promise(r => setTimeout(r, ms));
const siapUji = require("./bantu-siap.js");   // tunggu sampai aplikasi siap sesudah muat ulang
let id = 0; const menunggu = new Map(); let ws;
const kirim = (m, p = {}) => new Promise((s, g) => { const n = ++id; menunggu.set(n, { s, g }); ws.send(JSON.stringify({ id: n, method: m, params: p })); });
const evalJs = async (e) => { const r = await kirim("Runtime.evaluate", { expression: e, returnByValue: true }); if (r.exceptionDetails) throw new Error(JSON.stringify(r.exceptionDetails.exception.description)); return r.result.value; };
async function klik(sel) { const j = JSON.parse(await evalJs(`(function(){var e=document.querySelector(${JSON.stringify(sel)}); e.scrollIntoView({block:'center'}); var r=e.getBoundingClientRect(); return JSON.stringify({x:r.left+r.width/2,y:r.top+r.height/2});})()`)); await kirim("Input.dispatchMouseEvent", { type: "mouseMoved", x: j.x, y: j.y }); await kirim("Input.dispatchMouseEvent", { type: "mousePressed", x: j.x, y: j.y, button: "left", clickCount: 1 }); await kirim("Input.dispatchMouseEvent", { type: "mouseReleased", x: j.x, y: j.y, button: "left", clickCount: 1 }); }
const ketik = async (teks) => { for (const ch of teks) { await kirim("Input.dispatchKeyEvent", { type: "char", text: ch, key: ch }); } };
const tombol = async (key, code, kode) => { await kirim("Input.dispatchKeyEvent", { type: "rawKeyDown", key, code, windowsVirtualKeyCode: kode }); await kirim("Input.dispatchKeyEvent", { type: "keyUp", key, code, windowsVirtualKeyCode: kode }); };
const hasil = []; const catat = (n, ok, r = "") => { hasil.push(ok); console.log((ok ? "LOLOS  " : "GAGAL  ") + n + (r ? " -> " + r : "")); };
const foto = async (nama) => { const r = await kirim("Page.captureScreenshot", { format: "png" }); fs.writeFileSync(path.join(folderPng, nama), Buffer.from(r.data, "base64")); };
(async () => {
  fs.mkdirSync(folderPng, { recursive: true });
  const chrome = spawn(chromeExe, ["--headless=new", "--disable-gpu", "--no-first-run", "--remote-debugging-port=" + PORT, "--user-data-dir=" + folderProfil, "--window-size=1850,900", "file:///" + halaman.replace(/\\/g, "/")], { stdio: "ignore" });
  try {
    let t = null;
    for (let i = 0; i < 60 && !t; i++) { await tunggu(250); try { t = (await (await fetch("http://127.0.0.1:" + PORT + "/json/list")).json()).find(x => x.type === "page" && x.url.startsWith("file:")); } catch (e) {} }
    ws = new WebSocket(t.webSocketDebuggerUrl); await new Promise((s, g) => { ws.onopen = s; ws.onerror = g; });
    ws.onmessage = (m) => { const d = JSON.parse(m.data); if (d.id && menunggu.has(d.id)) { const p = menunggu.get(d.id); menunggu.delete(d.id); d.error ? p.g(new Error(JSON.stringify(d.error))) : p.s(d.result); } };
    await kirim("Runtime.enable"); await kirim("Page.enable"); await require("./bantu-sesi.js").masukChrome(kirim, "file:///" + halaman.replace(/\\/g, "/")); /* masuk sebagai pengguna uji (J.25) */ await kirim("Page.addScriptToEvaluateOnNewDocument", { source: require("./bantu-pengguna.js") }); /* pengguna mengisi kepala Data Baru (PRD 5.3a) */
    await kirim("Emulation.setDeviceMetricsOverride", { width: 1850, height: 900, deviceScaleFactor: 1, mobile: false });
    await tunggu(1000);
    await evalJs("localStorage.clear(); true"); await kirim("Page.reload"); await siapUji(evalJs, tunggu);
    await klik("#tombol-buku-besar"); await tunggu(250);
    await klik('#panel-buku-besar .kotak-menu[data-halaman="Jurnal Umum"]'); await tunggu(500);
    const hariIni = await evalJs("tanggalHariIni()");
    const tampilanHariIni = hariIni.split("-").reverse().join("/");
    catat("Kolom Tanggal Jurnal tampil dd/mm/yyyy dengan tombol kalender", await evalJs("document.getElementById('jurnal-tanggal-tampil').value") === tampilanHariIni);
    await klik("#jurnal-tanggal ~ .pemilih-tanggal .pt-ikon"); await tunggu(250);
    catat("Klik tombol kalender: kalender terbuka dengan judul bulan-tahun Indonesia dan tanggal hari ini hijau", await evalJs("(function(){var k=document.querySelector('#jurnal-tanggal ~ .pemilih-tanggal .pt-kalender'); return !k.hidden && /^(Januari|Februari|Maret|April|Mei|Juni|Juli|Agustus|September|Oktober|November|Desember) \\d{4}$/.test(k.querySelector('.pt-judul').textContent) && !!k.querySelector('.pt-hari.dipilih');})()"));
    const warna = JSON.parse(await evalJs("JSON.stringify({kepala:getComputedStyle(document.querySelector('.pt-kepala')).backgroundColor, dipilih:getComputedStyle(document.querySelector('.pt-hari.dipilih')).backgroundColor})"));
    catat("Warna sesuai contoh: judul biru muda, tanggal terpilih hijau", warna.kepala === "rgb(30, 161, 226)" && warna.dipilih === "rgb(163, 224, 90)", JSON.stringify(warna));
    await foto("kalender-1-jurnal.png");
    // Tanggal setelah hari ini tidak bisa diklik
    const masaDepan = await evalJs("(function(){var h=[...document.querySelectorAll('#jurnal-tanggal ~ .pemilih-tanggal .pt-hari')].filter(function(b){return b.dataset.iso > tanggalHariIni();}); return h.length===0 || h.every(function(b){return b.disabled;});})()");
    catat("Tanggal masa depan nonaktif (Preferensi melarang masa depan)", masaDepan);
    // Pilih tanggal 1 bulan ini dengan klik asli
    await klik("#jurnal-tanggal ~ .pemilih-tanggal .pt-hari[data-iso$='-01']"); await tunggu(250);
    const awalBulan = hariIni.slice(0, 8) + "01";
    catat("Klik tanggal 1: nilai berubah, kalender menutup, tampilan 01/mm/yyyy", await evalJs("document.getElementById('jurnal-tanggal').value") === awalBulan && await evalJs("document.querySelector('#jurnal-tanggal ~ .pemilih-tanggal .pt-kalender').hidden"));
    // Ketik tanggal dengan keyboard asli
    await klik("#jurnal-tanggal-tampil");
    await evalJs("(function(){var k=document.getElementById('jurnal-tanggal-tampil'); k.select(); return true;})()");
    await tombol("Backspace", "Backspace", 8);
    await ketik("05102026"); await tombol("Enter", "Enter", 13); await tunggu(200);
    catat("Ketik 05102026 + Enter: tampil 05/10/2026 dan nilai 2026-10-05", await evalJs("document.getElementById('jurnal-tanggal-tampil').value")  === "05/10/2026" && await evalJs("document.getElementById('jurnal-tanggal').value") === "2026-10-05");
    // Navigasi bulan dengan klik asli
    await klik("#jurnal-tanggal ~ .pemilih-tanggal .pt-ikon"); await tunggu(200);
    const judulAwal = await evalJs("document.querySelector('#jurnal-tanggal ~ .pemilih-tanggal .pt-judul').textContent");
    await klik('#jurnal-tanggal ~ .pemilih-tanggal .pt-nav[aria-label="Bulan sebelumnya"]'); await tunggu(150);
    const judulMundur = await evalJs("document.querySelector('#jurnal-tanggal ~ .pemilih-tanggal .pt-judul').textContent");
    catat("Tombol ‹ memundurkan bulan (dari Oktober 2026 ke September 2026)", judulAwal === "Oktober 2026" && judulMundur === "September 2026", judulAwal + " -> " + judulMundur);
    await klik('#jurnal-tanggal ~ .pemilih-tanggal .pt-nav[aria-label="Tahun berikutnya"]'); await tunggu(150);
    const judulMaju = await evalJs("document.querySelector('#jurnal-tanggal ~ .pemilih-tanggal .pt-judul').textContent"); catat("Tombol » memajukan satu tahun (September 2027)", judulMaju === "September 2027", judulMaju + " | kalender terbuka=" + await evalJs("!document.querySelector('#jurnal-tanggal ~ .pemilih-tanggal .pt-kalender').hidden") + " | rect nav=" + await evalJs("JSON.stringify(document.querySelector('#jurnal-tanggal ~ .pemilih-tanggal .pt-nav[aria-label=\"Tahun berikutnya\"]').getBoundingClientRect())") + " | lebar=" + await evalJs("window.innerWidth"));
    await foto("kalender-2-navigasi.png");
    // Esc menutup
    await tombol("Escape", "Escape", 27); await tunggu(150);
    catat("Esc menutup kalender", await evalJs("document.querySelector('#jurnal-tanggal ~ .pemilih-tanggal .pt-kalender').hidden"));
    // Kolom tanggal di halaman lain: Akun (tab Saldo)
    await evalJs("bukaAkunBaru(); true"); await tunggu(300);
    await klik('#isi-akun .sub-tab[data-subtab="akun-saldo"]'); await tunggu(200);
    await klik("#akun-tgl-saldo ~ .pemilih-tanggal .pt-ikon"); await tunggu(250);
    catat("Akun Perkiraan (tab Saldo, per Tgl): kalender yang sama terbuka", await evalJs("!document.querySelector('#akun-tgl-saldo ~ .pemilih-tanggal .pt-kalender').hidden && !document.querySelector('#akun-tgl-saldo ~ .pemilih-tanggal .pt-hari:disabled')"));
    await foto("kalender-3-akun.png");
    await tombol("Escape", "Escape", 27);
    // Preferensi dan Master Karyawan: kolom terlihat
    await evalJs("bukaTab('preferensi'); true"); await tunggu(300);
    await klik('.pref-item[data-bagian="data"], #pref-menu [data-bagian="data"]').catch(() => {});
    const adaPreferensi = await evalJs("!!document.querySelector('#yayasan-tgl-mulai ~ .pemilih-tanggal .pt-ikon')");
    catat("Preferensi (Tanggal mulai data) memakai kalender", adaPreferensi);
    catat("Seluruh 26 kolom tanggal (termasuk gaji, pembayaran, penerimaan, transfer, Histori Bank, Histori Akun, Rekonsiliasi Bank, Pencatatan Donasi, Target Donasi, Pemindahan Dana, Dari/s/d Parameter Laporan, Transfer Anggaran, dan Aset Tetap) memakai kalender, tidak ada kolom tanggal bawaan browser yang terlihat", await evalJs("[...document.querySelectorAll('input[type=date]')].length===26 && [...document.querySelectorAll('input[type=date]')].every(function(k){return k.hidden;}) && document.querySelectorAll('.pemilih-tanggal').length===26"));
    // HP
    await kirim("Emulation.setDeviceMetricsOverride", { width: 390, height: 800, deviceScaleFactor: 1, mobile: true }); await tunggu(300);
    await evalJs("bukaTab('jurnal'); true"); await tunggu(300);
    await klik("#jurnal-tanggal ~ .pemilih-tanggal .pt-ikon"); await tunggu(250);
    catat("Layar HP 390: kalender tetap di dalam layar", await evalJs("(function(){var r=document.querySelector('#jurnal-tanggal ~ .pemilih-tanggal .pt-kalender').getBoundingClientRect(); return r.left>=0 && r.right<=window.innerWidth+1;})()"));
    await foto("kalender-4-hp.png");  } catch (e) { console.log("GALAT: " + e.stack); hasil.push(false); }
  try { ws.close(); } catch (e) {} chrome.kill();
  console.log("Lolos " + hasil.filter(Boolean).length + " dari " + hasil.length); process.exit(hasil.every(Boolean) ? 0 : 1);
})();



