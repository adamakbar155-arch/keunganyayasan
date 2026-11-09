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
    await evalJs("localStorage.clear(); localStorage.setItem('daftarPenomoran', JSON.stringify([{id:'n1',nama:'Jurnal Umum',pembukuan:'yayasan',tipe:'jurnal',digit:5,komponen:[{jenis:'teks',nilai:'JU/'},{jenis:'tahun'},{jenis:'bulan'},{jenis:'counter'}]}])); localStorage.setItem('daftarDivisi', JSON.stringify([{id:'d1',nama:'Pendidikan'}])); true");   // Divisi wajib (PRD 5.1)
    await kirim("Page.reload"); await siapUji(evalJs, tunggu);
    await klik("#tombol-buku-besar"); await tunggu(250);
    await klik('#panel-buku-besar .kotak-menu[data-halaman="Jurnal Umum"]'); await tunggu(500);
    catat("Jurnal Umum terbuka dengan nomor otomatis: aturan 'Jurnal Umum' terpilih dan contoh nomor tampil", await evalJs("document.getElementById('jurnal-aturan-nomor').value==='n1' && /Nomor berikutnya: JU\\//.test(document.getElementById('jurnal-contoh-nomor').textContent)"));
    // Baris 1: Kas Kecil, Debit 1.500.000
    await klik("#jurnal-cari-akun"); await ketik("kas kecil"); await tunggu(250);
    await tombol("Enter", "Enter", 13); await tunggu(300);
    await ketik("1500000"); await tombol("Enter", "Enter", 13); await tunggu(400);
    // Baris 2: Donasi, Kredit 1.000.000 (sengaja kurang)
    await klik("#jurnal-cari-akun"); await ketik("donasi"); await tunggu(250);
    await tombol("Enter", "Enter", 13); await tunggu(300);
    await klik('input[name="detail-sisi"][value="kredit"]'); await danaUji("detail"); await klik("#detail-nilai"); await ketik("1000000"); await tombol("Enter", "Enter", 13); await tunggu(400);
    catat("Sesudah Lanjut (lewat Enter): daftar akun TIDAK terbuka sendiri, kursor ada di kolom cari", await evalJs("document.getElementById('jurnal-daftar-akun').hidden && document.activeElement.id==='jurnal-cari-akun'"));
    const status1 = await evalJs("document.getElementById('jurnal-status').textContent");
    catat("Debit 1.500.000, Kredit 1.000.000: status 'Belum seimbang: selisih Rp 500.000 (debit lebih besar).' dan Simpan abu-abu", status1 === "Belum seimbang: selisih Rp 500.000 (debit lebih besar)." && await evalJs("document.getElementById('jurnal-simpan').disabled"), status1);
    await foto("simpan-1-belum-seimbang.png");
    // Perbaiki: klik baris 2, ubah nilai jadi 1.500.000
    await klik("#jurnal-rincian tr.jurnal-baris-data:nth-child(2)"); await tunggu(300);
    await evalJs("document.getElementById('detail-nilai').value=''; true");
    await danaUji("detail"); await klik("#detail-nilai"); await ketik("1500000"); await tombol("Enter", "Enter", 13); await tunggu(400);
    catat("Setelah dibetulkan jadi seimbang: status kosong dan Simpan menyala", await evalJs("document.getElementById('jurnal-status').textContent==='' && !document.getElementById('jurnal-simpan').disabled"));
    // Keterangan lewat tab Info
    await klik('[data-jurnal-tab="info"]'); await tunggu(150);
    await klik("#jurnal-keterangan"); await ketik("Sumbangan tunai Oktober");
    await klik('[data-jurnal-tab="rincian"]'); await tunggu(150);
    await foto("simpan-2-siap.png");
    // Simpan dengan klik asli
    await klik("#jurnal-simpan"); await tunggu(500);
    const sesudah = JSON.parse(await evalJs("JSON.stringify({n:JSON.parse(localStorage.getItem('daftarJurnal')||'[]').length, nomor:(JSON.parse(localStorage.getItem('daftarJurnal')||'[]')[0]||{}).nomor, hitungan:localStorage.getItem('hitunganPenomoran'), notif:document.getElementById('area-notifikasi').textContent, baris:document.querySelectorAll('#jurnal-rincian tr.jurnal-baris-data').length, contoh:document.getElementById('jurnal-contoh-nomor').textContent})"));
    catat("Klik Simpan: 1 jurnal tersimpan dengan nomor JU/..., notifikasi sukses, formulir kosong untuk jurnal berikutnya", sesudah.n === 1 && /^JU\/\d+00001$/.test(sesudah.nomor) && /berhasil disimpan/.test(sesudah.notif) && sesudah.baris === 0, JSON.stringify(sesudah));
    catat("Hitungan nomor naik, contoh berikutnya urut 2", /00002$/.test(sesudah.contoh) && /"n1\|\d{4}-\d{2}":1/.test(sesudah.hitungan), sesudah.contoh);
    await foto("simpan-3-setelah-simpan.png");
    // Saldo akun mengikuti jurnal
    const saldo = await evalJs("(function(){var p=petaAkun(); var kk=bacaDaftarAkun().find(function(a){return a.kode==='110101';}); var dn=bacaDaftarAkun().find(function(a){return a.kode==='410101';}); return p.total[kk.id]+'|'+p.total[dn.id];})()");
    catat("Saldo akun mengikuti jurnal: Kas Kecil 1.500.000 dan Donasi 1.500.000", saldo === "1500000|1500000", saldo);
    // Daftar
    await klik("#isi-jurnal .tombol-daftar"); await tunggu(300);
    const barisDaftar = await evalJs("[...document.querySelectorAll('#isi-jurnal .tabel-daftar tbody tr')].map(function(tr){return [...tr.children].map(function(td){return td.textContent;}).join(' | ');}).join('\\n')");
    catat("Daftar jurnal menampilkan baris jurnal tadi (nomor, tanggal, keterangan, total 1.500.000)", /JU\/\d+00001 \| .+ \| Sumbangan tunai Oktober \| 1\.500\.000/.test(barisDaftar), barisDaftar);
    await foto("simpan-4-daftar.png");
    // Buka lalu hapus
    await klik("#isi-jurnal .tabel-daftar tbody tr"); await tunggu(400);
    catat("Klik baris di daftar: jurnal terbuka di formulir dengan 2 baris rincian dan tombol hapus", await evalJs("document.querySelectorAll('#jurnal-rincian tr.jurnal-baris-data').length===2 && !document.querySelector('#isi-jurnal [data-aksi=\"hapus\"]').hidden"));
    await foto("simpan-5-dibuka.png");
    await klik('#isi-jurnal [data-aksi="hapus"]'); await tunggu(300);
    catat("Klik tombol hapus: popup konfirmasi muncul", await evalJs("document.getElementById('dialog-konfirmasi').open"));
    await klik("#ya-konfirmasi"); await tunggu(400);
    catat("Setelah Ya: jurnal terhapus, saldo kembali 0", await evalJs("JSON.parse(localStorage.getItem('daftarJurnal')).length===0 && (function(){var p=petaAkun(); var kk=bacaDaftarAkun().find(function(a){return a.kode==='110101';}); return p.total[kk.id]===0;})()"));  } catch (e) { console.log("GALAT: " + e.stack); hasil.push(false); }
  try { ws.close(); } catch (e) {} chrome.kill();
  console.log("Lolos " + hasil.filter(Boolean).length + " dari " + hasil.length); process.exit(hasil.every(Boolean) ? 0 : 1);
})();



