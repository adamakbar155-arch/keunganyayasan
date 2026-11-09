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
    await evalJs("localStorage.clear(); localStorage.setItem('daftarProgram', JSON.stringify([{id:'p1',nama:'Beasiswa',divisiId:'d1',sifat:'terikat',status:'aktif'}])); localStorage.setItem('daftarDivisi', JSON.stringify([{id:'d1',nama:'Pendidikan'}])); true");   // Divisi wajib (PRD 5.1): harus ada pilihan
    await kirim("Page.reload"); await siapUji(evalJs, tunggu);

    await klik("#tombol-buku-besar"); await tunggu(250);
    await klik('#panel-buku-besar .kotak-menu[data-halaman="Jurnal Umum"]'); await tunggu(500);
    // 1) Klik kolom cari, ketik "beban"
    await klik("#jurnal-cari-akun"); await tunggu(200);
    catat("Klik kolom cari: daftar terbuka berisi 32 akun (akun induk tidak ikut)", await evalJs("!document.getElementById('jurnal-daftar-akun').hidden && document.querySelectorAll('.jurnal-pilihan-akun').length===32 && ![...document.querySelectorAll('.jurnal-pilihan-bawah span')].some(function(s){return s.textContent==='1101';})"));
    await ketik("beban"); await tunggu(250);
    const info = JSON.parse(await evalJs("JSON.stringify({n:document.querySelectorAll('.jurnal-pilihan-akun').length, tanda:document.querySelectorAll('.jurnal-pilihan-akun mark').length, warna:getComputedStyle(document.querySelector('.jurnal-pilihan-akun mark')).backgroundColor, tipe:document.querySelector('.jurnal-pilihan-tipe').textContent})"));
    catat("Ketik 'beban': hasil tersaring, bagian cocok disorot kuning, tipe akun di kanan bawah", info.n >= 7 && info.tanda >= info.n && info.warna === "rgb(255, 255, 0)" && info.tipe.length > 0, JSON.stringify(info));
    await foto("rincian-1-pencarian.png");
    // 2) panah bawah dua kali lalu Enter -> popup Detail Akun
    await tombol("ArrowDown", "ArrowDown", 40); await tombol("ArrowDown", "ArrowDown", 40); await tunggu(100);
    const yangDisorot = await evalJs("(function(){var l=[...document.querySelectorAll('.jurnal-pilihan-akun')]; var i=l.findIndex(function(x){return x.classList.contains('disorot');}); return i + '|' + l[i].querySelector('.jurnal-pilihan-bawah span').textContent;})()");
    catat("Panah bawah dua kali: sorotan pindah ke pilihan ketiga", /^2\|/.test(yangDisorot), yangDisorot);
    await tombol("Enter", "Enter", 13); await tunggu(300);
    catat("Enter: popup Detail Akun terbuka (belum ada baris), kursor di kolom Nilai", await evalJs("document.getElementById('dialog-detail-akun').open && document.querySelectorAll('#jurnal-rincian tr.jurnal-baris-data').length===0 && document.activeElement.id==='detail-nilai'"), await evalJs("document.getElementById('detail-kode').textContent + ' ' + document.getElementById('detail-nama').value"));
    await foto("rincian-1b-popup.png");
    // 3) Lanjut dengan nilai kosong ditolak, lalu isi lewat keyboard asli
    await danaUji("detail"); await klik("#lanjut-detail-akun"); await tunggu(150);
    catat("Klik Lanjut dengan Nilai kosong: ditolak dengan pesan, popup tetap", await evalJs("document.getElementById('dialog-detail-akun').open && !document.getElementById('galat-detail-nilai').hidden"));
    await ketik("1500000"); await tombol("Tab", "Tab", 9); await tunggu(100);
    catat("Nilai diketik 1500000: setelah keluar kolom tampil 1.500.000", await evalJs("document.getElementById('detail-nilai').value==='1.500.000'"));
    await klik("#detail-penanggung"); await ketik("Budi Santoso");
    await klik('[data-detail-tab="info"]'); await tunggu(150);
    await foto("rincian-1c-info.png");
    catat("Tab Info Lainnya: Divisi, Program, Keterangan (bukan Departemen/Proyek)", await evalJs("!document.getElementById('detail-panel-info').hidden && !/Proyek|Departemen/.test(document.getElementById('dialog-detail-akun').textContent)"));
    await klik('[data-detail-tab="detail"]'); await tunggu(100);
    await danaUji("detail"); await klik("#lanjut-detail-akun"); await tunggu(300);
    catat("Klik Lanjut: popup tertutup, baris pertama bertambah dengan Debit 1.500.000 dan penanggung jawab", await evalJs("!document.getElementById('dialog-detail-akun').open && document.querySelectorAll('#jurnal-rincian tr.jurnal-baris-data').length===1 && /1\\.500\\.000/.test(document.querySelector('#jurnal-rincian tr.jurnal-baris-data').textContent) && /Budi Santoso/.test(document.querySelector('#jurnal-rincian tr.jurnal-baris-data').textContent)"));
    catat("Total Debit Rp 1.500.000 dan merah (belum seimbang)", await evalJs("document.getElementById('jurnal-total-debit').textContent==='Rp 1.500.000' && document.querySelector('.jurnal-total').classList.contains('tidak-seimbang')"));
    catat("Setelah Lanjut kursor kembali ke kolom cari, daftar tidak langsung terbuka", await evalJs("document.activeElement.id==='jurnal-cari-akun' && document.getElementById('jurnal-daftar-akun').hidden"));
    // 4) akun kedua: klik asli, pilih Kredit lewat klik asli, Lanjut dengan Enter
    await ketik("kas kecil"); await tunggu(250);
    await klik(".jurnal-pilihan-akun"); await tunggu(300);
    await klik('input[name="detail-sisi"][value="kredit"]'); await danaUji("detail"); await klik("#detail-nilai"); await ketik("1.500.000");
    await tombol("Enter", "Enter", 13); await tunggu(300);
    catat("Baris kedua Kas Kecil dengan Kredit 1.500.000 lewat klik, radio Kredit, dan Enter; total seimbang", await evalJs("document.querySelectorAll('#jurnal-rincian tr.jurnal-baris-data').length===2 && document.getElementById('jurnal-total-kredit').textContent==='Rp 1.500.000' && !document.querySelector('.jurnal-total').classList.contains('tidak-seimbang')"));
    await foto("rincian-2-terisi.png");
    // 5) klik baris pertama -> popup ubah
    await klik("#jurnal-rincian tr.jurnal-baris-data:nth-child(1)"); await tunggu(300);
    catat("Klik baris: popup terbuka untuk mengubah dengan isian lama", await evalJs("document.getElementById('dialog-detail-akun').open && document.getElementById('detail-nilai').value==='1.500.000' && document.getElementById('detail-penanggung').value==='Budi Santoso'"));
    await foto("rincian-2b-ubah.png");
    await klik("#tutup-detail-akun"); await tunggu(200);
    // 6) hapus baris dengan klik
    await klik("#jurnal-rincian tr.jurnal-baris-data:nth-child(2) .jurnal-hapus-baris"); await tunggu(200);
    catat("Klik tombol hapus baris 2: tinggal 1 baris, popup tidak terbuka, Total Kredit Rp 0", await evalJs("document.querySelectorAll('#jurnal-rincian tr.jurnal-baris-data').length===1 && !document.getElementById('dialog-detail-akun').open && document.getElementById('jurnal-total-kredit').textContent==='Rp 0'"));    // 7) Esc menutup daftar; klik di luar menutup
    await klik("#jurnal-cari-akun"); await tunggu(150);
    await tombol("Escape", "Escape", 27); await tunggu(100);
    catat("Esc menutup daftar", await evalJs("document.getElementById('jurnal-daftar-akun').hidden"));
    await klik("#jurnal-cari-akun"); await tunggu(150);
    await klik("#jurnal-tipe"); await tunggu(150);
    catat("Klik di tempat lain menutup daftar", await evalJs("document.getElementById('jurnal-daftar-akun').hidden"));
    // 8) layar sempit
    await kirim("Emulation.setDeviceMetricsOverride", { width: 420, height: 900, deviceScaleFactor: 1, mobile: true }); await tunggu(400);
    await klik("#jurnal-cari-akun"); await ketik("kas"); await tunggu(250);
    const dalamLayar = await evalJs("(function(){var d=document.getElementById('jurnal-daftar-akun').getBoundingClientRect(); return d.left>=0 && d.right<=window.innerWidth+1 && document.documentElement.scrollWidth<=window.innerWidth+1;})()");
    catat("HP 420: daftar hasil tetap di dalam layar dan halaman tidak melebar", dalamLayar);
    await foto("rincian-3-hp.png");
  } catch (e) { console.log("GALAT: " + e.stack); hasil.push(false); }
  try { ws.close(); } catch (e) {} chrome.kill();
  console.log("Lolos " + hasil.filter(Boolean).length + " dari " + hasil.length); process.exit(hasil.every(Boolean) ? 0 : 1);
})();

