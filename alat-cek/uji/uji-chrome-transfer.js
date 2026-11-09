// Uji Pencatatan Gaji di Chrome asli. Pemakaian: node uji-chrome-gaji.js <chrome.exe> <menu.html> <folder-profil> <folder-png>
const { spawn } = require("child_process");
const fs = require("fs"), path = require("path"), zlib = require("zlib");
const [chromeExe, halaman, folderProfil, folderPng] = process.argv.slice(2);
const PORT = 9364;
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
    await kirim("Runtime.enable"); await kirim("Page.enable"); await require("./bantu-sesi.js").masukChrome(kirim, "file:///" + halaman.replace(/\\/g, "/")); /* masuk sebagai pengguna uji (J.25) */ await kirim("Page.addScriptToEvaluateOnNewDocument", { source: require("./bantu-pengguna.js") }); /* pengguna mengisi kepala Data Baru (PRD 5.3a) */ await kirim("Page.addScriptToEvaluateOnNewDocument", { source: PEMBUNGKUS_AKUN }); await kirim("Page.reload"); await siapUji(evalJs, tunggu);
    await kirim("Emulation.setDeviceMetricsOverride", { width: 1366, height: 900, deviceScaleFactor: 1, mobile: false });
    await tunggu(800);
    await evalJs(`(function(){ localStorage.clear(); /* uji fitur lain: kas boleh minus dengan peringatan (aturan Ditolak diuji di uji-kas-minus.js) */ localStorage.setItem('pembatasanYayasan', JSON.stringify({kasMinus:'peringatan'}));
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
    // Tambahan data: akun Bank kedua (tingkat 3 lewat pembungkus uji) dan aturan penomoran Transfer
    await evalJs("(function(){var a=JSON.parse(localStorage.getItem('daftarAkun')); a.push({id:'a6',kode:'110201',nama:'Bank BSI',tipe:'kas-bank',saldoAwal:0}); localStorage.setItem('daftarAkun', JSON.stringify(a)); var p=JSON.parse(localStorage.getItem('daftarPenomoran')||'[]'); p.push({id:'nf',nama:'Transfer Bank',pembukuan:'yayasan',tipe:'transfer',digit:4,komponen:[{jenis:'teks',nilai:'TF-'},{jenis:'counter'}]}); localStorage.setItem('daftarPenomoran', JSON.stringify(p)); return true;})()");
    await kirim("Page.reload"); await siapUji(evalJs, tunggu);
    const bersihNotif = () => evalJs("document.getElementById('area-notifikasi').textContent=''; true");
    const notif = () => evalJs("document.getElementById('area-notifikasi').textContent");
    const galatTf = () => evalJs("document.getElementById('transfer-pesan-galat').hidden ? '' : document.getElementById('transfer-pesan-galat').textContent");
    const transfer = () => evalJs("JSON.parse(localStorage.getItem('daftarTransfer')||'[]')");
    // Kursor dilepas dulu: pemilih yang sedang difokus mengembalikan pilihan lamanya saat ditinggal tanpa memilih
    const atur = (id, nilai) => evalJs("(function(){if(document.activeElement){document.activeElement.blur();} var k=document.getElementById('" + id + "'); k.value='" + nilai + "'; k.dispatchEvent(new Event('change')); k.dispatchEvent(new Event('input')); return true;})()");
    // 1) Popup Kas & Bank seperti Accurate, lalu buka Transfer Bank
    await klik("#tombol-kas"); await tunggu(300);
    catat("Popup Kas & Bank: Pembayaran, Penerimaan, Transfer Bank, Histori Bank, Rekonsiliasi Bank", await evalJs("[...document.querySelectorAll('#panel-kas .kotak-label-menu')].map(function(x){return x.textContent;}).join('|')==='Pembayaran|Penerimaan|Transfer Bank|Histori Bank|Rekonsiliasi Bank'"));
    await klik('#panel-kas .kotak-menu[data-halaman="Transfer Bank"]'); await tunggu(500);
    catat("Transfer Bank terbuka: tab 'Transfer Bank', judul 'Transfer Uang', Nomor berikutnya TF-0001, Total Rp 0", await evalJs("!document.getElementById('isi-transfer').hidden && document.querySelector('#tab-transfer .tab-judul').textContent==='Transfer Bank' && document.querySelector('.transfer-judul').textContent==='Transfer Uang' && document.getElementById('transfer-contoh-nomor').textContent==='Nomor berikutnya: TF-0001' && document.getElementById('transfer-total').textContent==='Rp 0'"));
    await foto("transfer-kosong.png");
    // 2) Pemeriksaan
    await bersihNotif(); await klik("#transfer-simpan"); await tunggu(300);
    catat("Simpan kosong: 'Dari Kas/Bank wajib dipilih'", /Dari Kas\/Bank wajib dipilih/.test(await galatTf()), await galatTf());
    await atur("transfer-dari", "a1"); await atur("transfer-ke", "a1");
    await klik("#transfer-simpan"); await tunggu(300);
    catat("Dari dan Ke sama: ditolak", /tidak boleh sama/.test(await galatTf()), await galatTf());
    await atur("transfer-ke", "a6");
    await klik("#transfer-simpan"); await tunggu(300);
    catat("Nilai kosong: ditolak 'Nilai Transfer wajib diisi'", /Nilai Transfer wajib diisi/.test(await galatTf()), await galatTf());
    await klik("#transfer-nilai"); await ketik("250000"); await tunggu(150);
    catat("Total ikut nilai: Rp 250.000", (await evalJs("document.getElementById('transfer-total').textContent")) === "Rp 250.000");
    // 3) Simpan
    await bersihNotif(); await klik("#transfer-simpan"); await tunggu(600);
    const t1 = await transfer(), j1 = (await jurnalTersimpan()).find(j => j.sumber && j.sumber.jenis === "transfer") || {};
    catat("Simpan: Transfer TF-0001 tersimpan (dari a1 ke a6, 250.000) + notifikasi", t1.length === 1 && t1[0].nomor === "TF-0001" && t1[0].dariId === "a1" && t1[0].keId === "a6" && t1[0].nilai === 250000 && /Transfer Bank telah berhasil disimpan/.test(await notif()), await galatTf());
    catat("Jurnal: Debit Bank BSI 250.000, Kredit Kas Kecil 250.000, tanpa Divisi/Program", j1.nomor === "TF-0001" && j1.rincian && j1.rincian[0].akunId === "a6" && j1.rincian[0].debit === 250000 && j1.rincian[1].akunId === "a1" && j1.rincian[1].kredit === 250000 && !j1.rincian.some(r => r.programId || r.divisiId), JSON.stringify(j1.rincian && j1.rincian.map(r => r.kode + ":" + r.debit + "/" + r.kredit)));
    catat("Saldo: Kas Kecil -250.000, Bank BSI +250.000", await evalJs("petaAkun().total['a1']===-250000 && petaAkun().total['a6']===250000"), await evalJs("JSON.stringify([petaAkun().total['a1'], petaAkun().total['a6']])"));
    // 4) Daftar seperti Accurate
    await evalJs("(function(){var b=document.querySelector('#isi-transfer .tombol-daftar'); b.click(); return true;})()"); await tunggu(400);
    const kepala = await evalJs("[...document.querySelectorAll('#isi-transfer table thead th')].map(function(t){return t.textContent.trim();})");
    const filter = await evalJs("[...document.querySelectorAll('#isi-transfer .pilih-filter')].map(function(s){return s.options[0].textContent;})");
    catat("Daftar: kolom Nomor #, Tanggal, Bank (Keluar), Bank (Masuk), Keterangan, Total; filter Tanggal, Dari Kas/Bank, Ke Kas/Bank", JSON.stringify(kepala) === JSON.stringify(["Nomor #", "Tanggal", "Bank (Keluar)", "Bank (Masuk)", "Keterangan", "Total"]) && JSON.stringify(filter) === JSON.stringify(["Tanggal: Semua", "Dari Kas/Bank: Semua", "Ke Kas/Bank: Semua"]), JSON.stringify([kepala, filter]));
    catat("Keterangan tanpa catatan: 'Transfer dari 110101 - Kas Kecil ke 110201 - Bank BSI'", /Transfer dari 110101 - Kas Kecil ke 110201 - Bank BSI/.test(await evalJs("document.querySelector('#isi-transfer table tbody').textContent")));
    await foto("transfer-daftar.png");
    // 5) Ubah: jurnal yang sama dibuat ulang
    await evalJs("modulTransfer.bukaUbah(JSON.parse(localStorage.getItem('daftarTransfer'))[0]); true"); await tunggu(300);
    await evalJs("document.getElementById('transfer-nilai').value='300.000'; true");
    await bersihNotif(); await klik("#transfer-simpan"); await tunggu(600);
    const j2 = (await jurnalTersimpan()).filter(j => j.sumber && j.sumber.jenis === "transfer");
    catat("Ubah nilai jadi 300.000: tetap 1 transfer dan 1 jurnal (id sama), jurnal 300.000", (await transfer()).length === 1 && j2.length === 1 && j2[0].id === j1.id && j2[0].totalDebit === 300000, JSON.stringify(j2.map(j => j.totalDebit)));
    // 6) Jurnal Umum: tidak tampil di daftar, tidak bisa dihapus dari sana
    await bersihNotif(); await evalJs("modulJurnal.hapus(JSON.parse(localStorage.getItem('daftarJurnal')).find(function(j){return j.sumber && j.sumber.jenis==='transfer';})); true"); await tunggu(300);
    catat("Jurnal Transfer tidak bisa dihapus dari Jurnal Umum ('Hapus lewat halaman Transfer Bank')", /Hapus lewat halaman Transfer Bank/.test(await notif()), await notif());
    // 7) Hapus transfer: jurnal ikut hilang
    await evalJs("modulTransfer.hapus(JSON.parse(localStorage.getItem('daftarTransfer'))[0]); true"); await tunggu(300); await klik("#ya-konfirmasi"); await tunggu(400);
    catat("Hapus Transfer: data dan jurnalnya hilang; saldo kembali 0", (await transfer()).length === 0 && !(await jurnalTersimpan()).some(j => j.sumber && j.sumber.jenis === "transfer") && await evalJs("(petaAkun().total['a1']||0)===0 && (petaAkun().total['a6']||0)===0"));
    await kirim("Emulation.setDeviceMetricsOverride", { width: 390, height: 844, deviceScaleFactor: 1, mobile: false }); await tunggu(400);
    await evalJs("modulTransfer.bukaBaru(); true"); await tunggu(300);
    await foto("transfer-hp.png");
    catat("Tidak ada galat atau peringatan di Console", galat.length === 0, JSON.stringify(galat));
  } catch (e) { console.log("GALAT: " + e.stack); hasil.push(false); }
  try { ws.close(); } catch (e) {} chrome.kill();
  console.log("Lolos " + hasil.filter(Boolean).length + " dari " + hasil.length); process.exit(hasil.every(Boolean) ? 0 : 1);
})();
