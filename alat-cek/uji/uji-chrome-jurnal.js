// Tampilan Jurnal Umum di Chrome asli (klik nyata) pada tiga lebar layar. Pemakaian: node uji-chrome-jurnal.js <chrome.exe> <menu.html> <folder-profil> <folder-png>
const { spawn } = require("child_process");
const fs = require("fs"), path = require("path");
const [chromeExe, halaman, folderProfil, folderPng] = process.argv.slice(2);
const PORT = 9353;
const tunggu = (ms) => new Promise(r => setTimeout(r, ms));
const siapUji = require("./bantu-siap.js");   // tunggu sampai aplikasi siap sesudah muat ulang
let id = 0; const menunggu = new Map(); let ws;
const kirim = (m, p = {}) => new Promise((s, g) => { const n = ++id; menunggu.set(n, { s, g }); ws.send(JSON.stringify({ id: n, method: m, params: p })); });
const evalJs = async (e) => { const r = await kirim("Runtime.evaluate", { expression: e, returnByValue: true }); if (r.exceptionDetails) throw new Error(JSON.stringify(r.exceptionDetails.exception.description)); return r.result.value; };
async function klik(sel) { const j = JSON.parse(await evalJs(`(function(){var e=document.querySelector(${JSON.stringify(sel)}); e.scrollIntoView({block:'center'}); var r=e.getBoundingClientRect(); return JSON.stringify({x:r.left+r.width/2,y:r.top+r.height/2});})()`)); await kirim("Input.dispatchMouseEvent", { type: "mouseMoved", x: j.x, y: j.y }); await kirim("Input.dispatchMouseEvent", { type: "mousePressed", x: j.x, y: j.y, button: "left", clickCount: 1 }); await kirim("Input.dispatchMouseEvent", { type: "mouseReleased", x: j.x, y: j.y, button: "left", clickCount: 1 }); }
const hasil = []; const catat = (n, ok, r = "") => { hasil.push(ok); console.log((ok ? "LOLOS  " : "GAGAL  ") + n + (r ? " -> " + r : "")); };
const foto = async (nama) => { const r = await kirim("Page.captureScreenshot", { format: "png" }); fs.writeFileSync(path.join(folderPng, nama), Buffer.from(r.data, "base64")); };
const ukuran = (w, h, mobile) => kirim("Emulation.setDeviceMetricsOverride", { width: w, height: h, deviceScaleFactor: 1, mobile: !!mobile });
const rect = (sel) => evalJs(`(function(){var e=document.querySelector(${JSON.stringify(sel)}); if(!e) return null; var r=e.getBoundingClientRect(); return JSON.stringify({x:r.left,y:r.top,w:r.width,h:r.height,kanan:r.right,bawah:r.bottom});})()`).then(j => j && JSON.parse(j));
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
  const chrome = spawn(chromeExe, ["--headless=new", "--disable-gpu", "--no-first-run", "--remote-debugging-port=" + PORT, "--user-data-dir=" + folderProfil, "--window-size=1850,820", "file:///" + halaman.replace(/\\/g, "/")], { stdio: "ignore" });
  try {
    let t = null;
    for (let i = 0; i < 60 && !t; i++) { await tunggu(250); try { t = (await (await fetch("http://127.0.0.1:" + PORT + "/json/list")).json()).find(x => x.type === "page" && x.url.startsWith("file:")); } catch (e) {} }
    ws = new WebSocket(t.webSocketDebuggerUrl); await new Promise((s, g) => { ws.onopen = s; ws.onerror = g; });
    ws.onmessage = (m) => { const d = JSON.parse(m.data); if (d.id && menunggu.has(d.id)) { const p = menunggu.get(d.id); menunggu.delete(d.id); d.error ? p.g(new Error(JSON.stringify(d.error))) : p.s(d.result); } };
    await kirim("Runtime.enable"); await kirim("Page.enable"); await require("./bantu-sesi.js").masukChrome(kirim, "file:///" + halaman.replace(/\\/g, "/")); /* masuk sebagai pengguna uji (J.25) */ await kirim("Page.addScriptToEvaluateOnNewDocument", { source: require("./bantu-pengguna.js") }); /* pengguna mengisi kepala Data Baru (PRD 5.3a) */ await kirim("Page.addScriptToEvaluateOnNewDocument", { source: PEMBUNGKUS_AKUN }); await kirim("Page.reload"); await siapUji(evalJs, tunggu);
    await ukuran(1850, 820);
    await tunggu(1000);
    await evalJs("localStorage.clear(); localStorage.setItem('daftarPenomoran', JSON.stringify([{id:'n1',nama:'Jurnal Umum',pembukuan:'yayasan',tipe:'jurnal',digit:5,komponen:[{jenis:'teks',nilai:'JU/'},{jenis:'tahun'},{jenis:'bulan'},{jenis:'counter'}]},{id:'n2',nama:'Kas Kecil',pembukuan:'yayasan',tipe:'jurnal',digit:4,komponen:[{jenis:'teks',nilai:'KK-'},{jenis:'counter'}]},{id:'n3',nama:'Bank',pembukuan:'yayasan',tipe:'jurnal',digit:4,komponen:[{jenis:'teks',nilai:'BK-'},{jenis:'counter'}]}])); true"); await kirim("Page.reload"); await siapUji(evalJs, tunggu);

    await klik("#tombol-buku-besar"); await tunggu(250);
    await klik('#panel-buku-besar .kotak-menu[data-halaman="Jurnal Umum"]'); await tunggu(500);
    catat("Klik asli: Buku besar -> Jurnal Umum membuka formulir", await evalJs("!document.getElementById('isi-jurnal').hidden"));
    await foto("jurnal-1-lebar.png");
    // Susunan: tanggal & nomor sebaris, tabel di bawah, total di kanan bawah, tombol aksi di kanan
    const tgl = await rect("#jurnal-tanggal-tampil"), nomor = await rect("#jurnal-aturan-nomor-cari"), tabel = await rect(".jurnal-tabel"), total = await rect(".jurnal-total"), simpan = await rect("#jurnal-simpan"), tabIkon = await rect(".jurnal-tab-ikon");
    catat("Lebar 1850: Tanggal di kiri dan Nomor di kanan pada baris yang sama", Math.abs(tgl.y - nomor.y) < 12 && nomor.x > tgl.x + tgl.w, JSON.stringify({ tgl: tgl.x, nomor: nomor.x }));
    catat("Tombol Simpan di kanan atas formulir; tab ikon di kiri tabel; tabel di bawah kepala", simpan.x > tabel.kanan && tabIkon.x < tabel.x && tabel.y > tgl.y + tgl.h);
    catat("Kotak Total Debit/Kredit rata kanan di bawah tabel", total.y > tabel.bawah && Math.abs(total.kanan - tabel.kanan) < 40, JSON.stringify({ totalKanan: total.kanan, tabelKanan: tabel.kanan }));
    catat("Tidak ada gulir ke samping pada halaman", await evalJs("document.documentElement.scrollWidth <= window.innerWidth"));

    catat("Pilihan aturan nomor memuat 3 aturan Jurnal Umum dan contoh nomor tampil", await evalJs("document.querySelectorAll('#jurnal-aturan-nomor option').length===4 && /Nomor berikutnya: JU\\//.test(document.getElementById('jurnal-contoh-nomor').textContent)"), await evalJs("document.getElementById('jurnal-contoh-nomor').textContent"));
    await evalJs("(function(){var s=document.getElementById('jurnal-aturan-nomor'); s.value='n3'; s.dispatchEvent(new Event('change',{bubbles:true})); return true;})()"); await tunggu(150);
    catat("Pilih aturan 'Bank': contoh berganti BK-0001", await evalJs("document.getElementById('jurnal-contoh-nomor').textContent==='Nomor berikutnya: BK-0001'"));
    await evalJs("(function(){var s=document.getElementById('jurnal-aturan-nomor'); s.value='n1'; s.dispatchEvent(new Event('change',{bubbles:true})); return true;})()");
    await foto("jurnal-0-nomor.png");
    await klik('[data-jurnal-tab="info"]'); await tunggu(200);
    await foto("jurnal-2-info.png");
    await klik('[data-jurnal-tab="rincian"]'); await tunggu(200);
    await klik("#jurnal-simpan");   // disabled: tidak terjadi apa-apa
    await klik('#jurnal-tombol-lampiran'); await tunggu(250);
    catat("Klik tombol Lampiran (klip): popup Lampiran terbuka", await evalJs("document.getElementById('dialog-lampiran').open"));
    await evalJs("document.getElementById('dialog-lampiran').close(); true");

    await ukuran(1366, 768);
    await tunggu(300);
    await foto("jurnal-3-laptop.png");
    catat("Lebar 1366: tidak ada gulir ke samping", await evalJs("document.documentElement.scrollWidth <= window.innerWidth"));

    await ukuran(420, 900, false);   // tanpa emulasi HP agar lebar layar tidak ikut melebar mengikuti isi
    await tunggu(400);
    await foto("jurnal-4-hp.png");
    const tglH = await rect("#jurnal-tanggal-tampil"), nomorH = await rect("#jurnal-aturan-nomor-cari");
    catat("Lebar HP 420: kepala bertumpuk (Nomor di bawah Tanggal); isi Jurnal tidak melebarkan halaman melebihi bilah atas", nomorH.y > tglH.y && await evalJs("document.documentElement.scrollWidth <= document.body.scrollWidth + 1"), await evalJs("document.documentElement.scrollWidth + ' / ' + window.innerWidth"));
    catat("Tabel rincian bisa digulir ke samping di dalam kotaknya (bukan melebarkan halaman)", await evalJs("(function(){var b=document.querySelector('.jurnal-bungkus-tabel'); return b.scrollWidth > b.clientWidth && getComputedStyle(b).overflowX!=='visible';})()"));
  } catch (e) { console.log("GALAT: " + e.stack); hasil.push(false); }
  try { ws.close(); } catch (e) {} chrome.kill();
  console.log("Lolos " + hasil.filter(Boolean).length + " dari " + hasil.length); process.exit(hasil.every(Boolean) ? 0 : 1);
})();



