// Rincian Jurnal di Chrome asli: keyboard dan mouse nyata. Pemakaian: node uji-chrome-rincian.js <chrome.exe> <menu.html> <folder-profil> <folder-png>
const { spawn } = require("child_process");
const fs = require("fs"), path = require("path");
const [chromeExe, halaman, folderProfil, folderPng] = process.argv.slice(2);
const PORT = 9355;
const tunggu = (ms) => new Promise(r => setTimeout(r, ms));
const siapUji = require("./bantu-siap.js");   // tunggu sampai aplikasi siap sesudah muat ulang
let id = 0; const menunggu = new Map(); let ws;
const kirim = (m, p = {}) => new Promise((s, g) => { const n = ++id; menunggu.set(n, { s, g }); ws.send(JSON.stringify({ id: n, method: m, params: p })); });
const evalJs = async (e) => { const r = await kirim("Runtime.evaluate", { expression: e, returnByValue: true }); if (r.exceptionDetails) throw new Error(JSON.stringify(r.exceptionDetails.exception.description)); return r.result.value; };
const danaUji = (p) => evalJs("(function(){var t=document.getElementById('" + p + "-terikat'), n=document.getElementById('" + p + "-tidak-terikat'); if(t&&n&&!t.checked&&!n.checked){n.checked=true;} var d=document.getElementById('" + p + "-divisi'); if(d&&d.value===''){var o=[].slice.call(d.options).find(function(x){return x.value;}); if(o){d.value=o.value; d.dispatchEvent(new Event('change',{bubbles:true}));}} return true;})()");   // Dana belum dipilih -> Tidak Terikat (arti lama, PRD 4.1); Divisi kosong -> divisi pertama (wajib, PRD 5.1)
async function klik(sel) { const j = JSON.parse(await evalJs(`(function(){var e=document.querySelector(${JSON.stringify(sel)}); e.scrollIntoView({block:'center'}); var r=e.getBoundingClientRect(); return JSON.stringify({x:r.left+r.width/2,y:r.top+r.height/2});})()`)); await kirim("Input.dispatchMouseEvent", { type: "mouseMoved", x: j.x, y: j.y }); await kirim("Input.dispatchMouseEvent", { type: "mousePressed", x: j.x, y: j.y, button: "left", clickCount: 1 }); await kirim("Input.dispatchMouseEvent", { type: "mouseReleased", x: j.x, y: j.y, button: "left", clickCount: 1 }); }
const ketik = async (teks) => { for (const ch of teks) { await kirim("Input.dispatchKeyEvent", { type: "char", text: ch, key: ch }); } };
const tombol = async (key, code, kode) => { await kirim("Input.dispatchKeyEvent", { type: "rawKeyDown", key, code, windowsVirtualKeyCode: kode }); await kirim("Input.dispatchKeyEvent", { type: "keyUp", key, code, windowsVirtualKeyCode: kode }); };
const hasil = []; const catat = (n, ok, r = "") => { hasil.push(ok); console.log((ok ? "LOLOS  " : "GAGAL  ") + n + (r ? " -> " + r : "")); };
const foto = async (nama) => { const r = await kirim("Page.captureScreenshot", { format: "png" }); fs.writeFileSync(path.join(folderPng, nama), Buffer.from(r.data, "base64")); };
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
  const chrome = spawn(chromeExe, ["--headless=new", "--disable-gpu", "--no-first-run", "--remote-debugging-port=" + PORT, "--user-data-dir=" + folderProfil, "--window-size=1850,900", "file:///" + halaman.replace(/\\/g, "/")], { stdio: "ignore" });
  try {
    let t = null;
    for (let i = 0; i < 60 && !t; i++) { await tunggu(250); try { t = (await (await fetch("http://127.0.0.1:" + PORT + "/json/list")).json()).find(x => x.type === "page" && x.url.startsWith("file:")); } catch (e) {} }
    ws = new WebSocket(t.webSocketDebuggerUrl); await new Promise((s, g) => { ws.onopen = s; ws.onerror = g; });
    ws.onmessage = (m) => { const d = JSON.parse(m.data); if (d.id && menunggu.has(d.id)) { const p = menunggu.get(d.id); menunggu.delete(d.id); d.error ? p.g(new Error(JSON.stringify(d.error))) : p.s(d.result); } };
    await kirim("Runtime.enable"); await kirim("Page.enable"); await require("./bantu-sesi.js").masukChrome(kirim, "file:///" + halaman.replace(/\\/g, "/")); /* masuk sebagai pengguna uji (J.25) */ await kirim("Page.addScriptToEvaluateOnNewDocument", { source: require("./bantu-pengguna.js") }); /* pengguna mengisi kepala Data Baru (PRD 5.3a) */ await kirim("Page.addScriptToEvaluateOnNewDocument", { source: PEMBUNGKUS_AKUN }); await kirim("Page.reload"); await siapUji(evalJs, tunggu);
    await kirim("Emulation.setDeviceMetricsOverride", { width: 1850, height: 900, deviceScaleFactor: 1, mobile: false });
    await tunggu(1000);
    await evalJs("localStorage.clear(); localStorage.setItem('daftarProgram', JSON.stringify([{id:'p1',nama:'Beasiswa',divisiId:'d1',sifat:'terikat',status:'aktif'}])); true");
    await kirim("Page.reload"); await siapUji(evalJs, tunggu);

    await evalJs("localStorage.setItem('daftarDivisi', JSON.stringify([{id:'d1',nama:'Pendidikan'},{id:'d2',nama:'Kesehatan'}])); true");
    await kirim("Page.reload"); await siapUji(evalJs, tunggu);
    await klik("#tombol-buku-besar"); await tunggu(250);
    await klik('#panel-buku-besar .kotak-menu[data-jurnal="x"], #panel-buku-besar .kotak-menu[data-halaman="Jurnal Umum"]'); await tunggu(500);
    // Baris 1: Beban Gaji dengan Program Beasiswa (diisi lewat tab Info Lainnya)
    await klik("#jurnal-cari-akun"); await ketik("beban gaji"); await tunggu(250);
    await tombol("Enter", "Enter", 13); await tunggu(300);
    await ketik("1000000");
    await klik('[data-detail-tab="info"]'); await tunggu(150);
    await evalJs("(function(){var s=document.getElementById('detail-program'); s.value='p1'; s.dispatchEvent(new Event('change',{bubbles:true})); return true;})()");
    catat("Baris 1: Program Beasiswa dipilih, Divisi diusulkan Pendidikan (tidak terkunci)", await evalJs("document.getElementById('detail-divisi').value==='d1' && !document.getElementById('detail-divisi').disabled"));
    await danaUji("detail"); await klik("#lanjut-detail-akun"); await tunggu(400);
    // Baris 2: popup mengikuti
    await klik("#jurnal-cari-akun"); await ketik("kas kecil"); await tunggu(250);
    await tombol("Enter", "Enter", 13); await tunggu(300);
    await klik('[data-detail-tab="info"]'); await tunggu(150);
    catat("Baris 2: popup langsung terisi Program Beasiswa dan Divisi Pendidikan (mengikuti baris sebelumnya)", await evalJs("document.getElementById('detail-program').value==='p1' && document.getElementById('detail-divisi').value==='d1'"));
    await foto("rincian-4-mengikuti.png");
    // Tetap bisa diubah: kosongkan Program, pilih Divisi Kesehatan
    await evalJs("(function(){var s=document.getElementById('detail-program'); s.value=''; s.dispatchEvent(new Event('change',{bubbles:true})); var d=document.getElementById('detail-divisi'); d.value='d2'; d.dispatchEvent(new Event('change',{bubbles:true})); return true;})()");
    catat("Isian otomatis bisa diubah: Program dikosongkan dan Divisi diganti Kesehatan", await evalJs("!document.getElementById('detail-divisi').disabled && document.getElementById('detail-divisi').value==='d2' && document.getElementById('detail-program').value===''"));
    await klik('[data-detail-tab="detail"]'); await tunggu(100);
    await danaUji("detail"); await klik("#detail-nilai"); await ketik("1000000"); await tombol("Enter", "Enter", 13); await tunggu(400);
    catat("Baris 2 tersimpan dengan Divisi Kesehatan tanpa Program", await evalJs("document.querySelectorAll('#jurnal-rincian tr.jurnal-baris-data').length===2"));
    // Baris 3 mengikuti baris 2 (bukan baris 1)
    await klik("#jurnal-cari-akun"); await ketik("bank"); await tunggu(250);
    await tombol("Enter", "Enter", 13); await tunggu(300);
    await klik('[data-detail-tab="info"]'); await tunggu(150);
    catat("Baris 3 mengikuti baris terakhir (Divisi Kesehatan, tanpa Program)", await evalJs("document.getElementById('detail-divisi').value==='d2' && document.getElementById('detail-program').value==='' && !document.getElementById('detail-divisi').disabled"));
    await klik("#tutup-detail-akun"); await tunggu(200);  } catch (e) { console.log("GALAT: " + e.stack); hasil.push(false); }
  try { ws.close(); } catch (e) {} chrome.kill();
  console.log("Lolos " + hasil.filter(Boolean).length + " dari " + hasil.length); process.exit(hasil.every(Boolean) ? 0 : 1);
})();



