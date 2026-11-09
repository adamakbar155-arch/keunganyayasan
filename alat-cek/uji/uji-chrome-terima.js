// Uji Penerimaan (Kas & Bank) di Chrome asli: buka dari popup, pengaman urutan isian, popup rincian (tanpa bagian Dana),
// simpan + jurnal otomatis (Debit Kas/Bank, Kredit akun baris), ubah (jurnal dibuat ulang), hapus, dan tolak isian kurang.
// Pemakaian: node uji-chrome-terima.js <chrome.exe> <index.html> <folder-profil> <folder-png>
const { spawn } = require("child_process");
const fs = require("fs"), path = require("path");
const [chromeExe, halaman, folderProfil, folderPng] = process.argv.slice(2);
const PORT = 9368;
const tunggu = (ms) => new Promise(r => setTimeout(r, ms));
const siapUji = require("./bantu-siap.js");   // tunggu sampai aplikasi siap sesudah muat ulang
let id = 0; const menunggu = new Map(); let ws;
const kirim = (m, p = {}) => new Promise((s, g) => { const n = ++id; menunggu.set(n, { s, g }); ws.send(JSON.stringify({ id: n, method: m, params: p })); });
const evalJs = async (e) => { const r = await kirim("Runtime.evaluate", { expression: e, returnByValue: true, awaitPromise: true }); if (r.exceptionDetails) throw new Error(JSON.stringify(r.exceptionDetails.exception.description) + " <<< " + e.slice(0, 120)); return r.result.value; };
const hasil = []; const catat = (n, ok, r = "") => { hasil.push(ok); console.log((ok ? "LOLOS  " : "GAGAL  ") + n + (r ? " -> " + r : "")); };
const foto = async (nama) => { const r = await kirim("Page.captureScreenshot", { format: "png" }); fs.writeFileSync(path.join(folderPng, nama), Buffer.from(r.data, "base64")); };
const klik = async (sel) => { const j = JSON.parse(await evalJs(`(function(){var e=document.querySelector(${JSON.stringify(sel)}); e.scrollIntoView({block:'center'}); var r=e.getBoundingClientRect(); return JSON.stringify({x:r.left+r.width/2,y:r.top+r.height/2});})()`)); await kirim("Input.dispatchMouseEvent", { type: "mouseMoved", x: j.x, y: j.y }); await kirim("Input.dispatchMouseEvent", { type: "mousePressed", x: j.x, y: j.y, button: "left", clickCount: 1 }); await kirim("Input.dispatchMouseEvent", { type: "mouseReleased", x: j.x, y: j.y, button: "left", clickCount: 1 }); };
(async () => {
  fs.mkdirSync(folderPng, { recursive: true });
  const galat = [];
  const chrome = spawn(chromeExe, ["--headless=new", "--disable-gpu", "--no-first-run", "--remote-debugging-port=" + PORT, "--user-data-dir=" + folderProfil, "--window-size=1366,900", "file:///" + halaman.replace(/\\/g, "/")], { stdio: "ignore" });
  try {
    let t = null;
    for (let i = 0; i < 60 && !t; i++) { await tunggu(250); try { t = (await (await fetch("http://127.0.0.1:" + PORT + "/json/list")).json()).find(x => x.type === "page" && x.url.startsWith("file:")); } catch (e) { /* belum siap */ } }
    ws = new WebSocket(t.webSocketDebuggerUrl); await new Promise((s, g) => { ws.onopen = s; ws.onerror = g; });
    ws.onmessage = (m) => { const d = JSON.parse(m.data); if (d.method === "Runtime.exceptionThrown") galat.push(d.params.exceptionDetails.exception.description); if (d.method === "Runtime.consoleAPICalled" && ["error", "warning"].includes(d.params.type)) galat.push(d.params.args.map(a => a.value).join(" ")); if (d.id && menunggu.has(d.id)) { const p = menunggu.get(d.id); menunggu.delete(d.id); d.error ? p.g(new Error(JSON.stringify(d.error))) : p.s(d.result); } };
    await kirim("Runtime.enable"); await kirim("Page.enable"); await require("./bantu-sesi.js").masukChrome(kirim, "file:///" + halaman.replace(/\\/g, "/")); /* masuk sebagai pengguna uji (J.25) */ await kirim("Page.addScriptToEvaluateOnNewDocument", { source: require("./bantu-pengguna.js") }); /* pengguna mengisi kepala Data Baru (PRD 5.3a) */
    await kirim("Emulation.setDeviceMetricsOverride", { width: 1366, height: 900, deviceScaleFactor: 1, mobile: false });
    await tunggu(800);
    // Data contoh (bukan data asli): Kas tingkat 3, akun pendapatan lain, Divisi/Program, aturan nomor BKM-
    await evalJs(`(function(){ localStorage.clear();
      localStorage.setItem('daftarAkun', JSON.stringify([
        {id:'i1',kode:'11',nama:'Aset Lancar',tipe:'kas-bank',indukId:'',saldoAwal:0},
        {id:'i2',kode:'1101',nama:'Kas & Bank',tipe:'kas-bank',indukId:'i1',saldoAwal:0},
        {id:'k1',kode:'110101',nama:'Kas Kecil',tipe:'kas-bank',indukId:'i2',saldoAwal:0},
        {id:'k2',kode:'110102',nama:'Bank BSI',tipe:'kas-bank',indukId:'i2',saldoAwal:0},
        {id:'p0',kode:'42',nama:'Pendapatan Lain',tipe:'pendapatan-lain',indukId:'',saldoAwal:0},
        {id:'p1',kode:'4201',nama:'Pendapatan Jasa Giro',tipe:'pendapatan-lain',indukId:'p0',saldoAwal:0},
        {id:'p2',kode:'4202',nama:'Hibah Peralatan',tipe:'pendapatan-lain',indukId:'p0',saldoAwal:0}]));
      localStorage.setItem('daftarDivisi', JSON.stringify([{id:'d1',nama:'Pendidikan'},{id:'d2',nama:'Sosial'}]));
      localStorage.setItem('daftarProgram', JSON.stringify([{id:'pr1',nama:'Beasiswa',divisiId:'d1',status:'aktif'}]));
      localStorage.setItem('daftarPenomoran', JSON.stringify([{id:'n1',nama:'Penerimaan',pembukuan:'yayasan',tipe:'penerimaan',digit:4,komponen:[{jenis:'teks',nilai:'BKM-'},{jenis:'counter'}]}]));
      return true; })()`);
    await kirim("Page.reload"); await siapUji(evalJs, tunggu);
    const ketik = (x) => kirim("Input.insertText", { text: x });
    const tombol = async (key, code, vk) => { await kirim("Input.dispatchKeyEvent", { type: "keyDown", key, code, windowsVirtualKeyCode: vk }); await kirim("Input.dispatchKeyEvent", { type: "keyUp", key, code, windowsVirtualKeyCode: vk }); };
    const bersihNotif = () => evalJs("document.querySelectorAll('.notifikasi').forEach(function(n){n.remove();}); document.getElementById('area-notifikasi').textContent=''; true");
    const notif = () => evalJs("document.getElementById('area-notifikasi').textContent");
    const penerimaan = () => evalJs("JSON.parse(localStorage.getItem('daftarPenerimaan')||'[]')");
    const jurnalTerima = () => evalJs("JSON.parse(localStorage.getItem('daftarJurnal')||'[]').filter(function(j){return j.sumber && j.sumber.jenis==='penerimaan';})");
    const pilihKas = (v) => evalJs("(function(){var k=document.getElementById('terima-kas'); k.value='" + v + "'; k.dispatchEvent(new Event('change',{bubbles:true})); return true;})()");
    const pilihDivisi = (v) => evalJs("(function(){var d=document.getElementById('rterima-divisi'); d.value='" + v + "'; d.dispatchEvent(new Event('change',{bubbles:true})); return true;})()");

    // 1) Buka dari popup Kas & Bank
    await klik("#tombol-kas"); await tunggu(300);
    await klik('#panel-kas .kotak-menu[data-halaman="Penerimaan"]'); await tunggu(500);
    const atas = JSON.parse(await evalJs("JSON.stringify({buka:!document.getElementById('isi-terima').hidden, kas:[...document.getElementById('terima-kas').options].map(function(o){return o.textContent;}), tgl:document.getElementById('terima-tanggal').value===tanggalHariIni(), contoh:document.getElementById('terima-contoh-nomor').textContent, total:document.getElementById('terima-total').textContent})"));
    catat("Penerimaan terbuka: Kas/Bank hanya akun tanpa sub (Kas Kecil, Bank BSI), tanggal hari ini, nomor berikutnya BKM-0001, Nilai Rp 0", atas.buka && JSON.stringify(atas.kas) === JSON.stringify(["Pilih Kas/Bank...", "110101 - Kas Kecil", "110102 - Bank BSI"]) && atas.tgl && atas.contoh === "Nomor berikutnya: BKM-0001" && atas.total === "Rp 0", JSON.stringify(atas));
    // 2) Pengaman urutan isian (PRD 5.1): cari akun sebelum Kas/Bank dipilih
    await bersihNotif(); await klik("#terima-cari-akun"); await tunggu(300);
    catat("Kas/Bank belum dipilih: daftar akun tidak terbuka, peringatan 'Pilih Kas/Bank dulu'", await evalJs("document.getElementById('terima-daftar-akun').hidden") && /Pilih Kas\/Bank dulu/.test(await notif()), await notif());
    await tunggu(1100); await pilihKas("k2"); await bersihNotif();
    // 3) Pilih akun, popup rincian
    await klik("#terima-cari-akun"); await tunggu(250);
    const pilihan = await evalJs("[...document.querySelectorAll('#terima-daftar-akun .jurnal-pilihan-nama')].map(function(x){return x.textContent;})");
    catat("Daftar akun: akun tanpa sub tampil (Pendapatan Jasa Giro, Hibah Peralatan), induk 'Pendapatan Lain' tidak", pilihan.includes("Pendapatan Jasa Giro") && pilihan.includes("Hibah Peralatan") && !pilihan.includes("Pendapatan Lain"), JSON.stringify(pilihan));
    await ketik("giro"); await tunggu(250); await tombol("Enter", "Enter", 13); await tunggu(400);
    catat("Popup Rincian Penerimaan: akun 4201, kursor di Nilai, tanpa bagian Dana (Penerimaan selalu Tidak Terikat, PRD Keputusan 9)", await evalJs("document.getElementById('dialog-rincian-terima').open && document.getElementById('rterima-kode').textContent==='4201' && document.activeElement.id==='rterima-nilai' && !document.getElementById('rterima-terikat')"));
    await klik("#lanjut-rincian-terima"); await tunggu(200);
    catat("Lanjut tanpa Nilai: pesan 'Nilai wajib diisi'", await evalJs("!document.getElementById('galat-rterima-nilai').hidden"));
    await ketik("500000");
    await klik('[data-rterima-tab="info"]'); await tunggu(150);
    catat("Tab Info lainnya popup: Divisi, Program, Catatan", await evalJs("!document.getElementById('rterima-panel-info').hidden && !!document.getElementById('rterima-divisi') && !!document.getElementById('rterima-program') && !!document.getElementById('rterima-catatan')"));
    await pilihDivisi("d2"); await klik("#lanjut-rincian-terima"); await tunggu(400);
    catat("Baris masuk tabel: 4201 | Pendapatan Jasa Giro | 500.000; Nilai Rp 500.000", await evalJs("(function(){var r=document.querySelector('#terima-rincian tr.jurnal-baris-data'); var c=r?[...r.cells].map(function(x){return x.textContent;}):[]; return c[1]==='4201' && c[2]==='Pendapatan Jasa Giro' && c[3]==='500.000' && document.getElementById('terima-total').textContent==='Rp 500.000';})()"));
    await foto("terima-isi.png");
    // 4) Info lainnya halaman: Pemberi
    await klik('#isi-terima [data-terima-tab="info"]'); await tunggu(150);
    catat("Tab Info lainnya halaman berisi Pemberi", await evalJs("!document.getElementById('terima-panel-info').hidden && !!document.getElementById('terima-pemberi')"));
    await evalJs("(function(){var p=document.getElementById('terima-pemberi'); p.value='Bank Syariah'; p.dispatchEvent(new Event('input')); return true;})()");
    await klik('#isi-terima [data-terima-tab="rincian"]'); await tunggu(150);
    // 5) Simpan + jurnal otomatis
    await bersihNotif(); await klik("#terima-simpan"); await tunggu(600);
    const tm = await penerimaan(), jr = await jurnalTerima();
    const t0 = tm[0] || {}, j0 = jr[0] || {};
    catat("Simpan: 1 Penerimaan BKM-0001 (Kas Bank BSI, total 500.000, Pemberi 'Bank Syariah') + notifikasi berhasil", tm.length === 1 && t0.nomor === "BKM-0001" && t0.kasId === "k2" && t0.total === 500000 && t0.pemberi === "Bank Syariah" && /Penerimaan telah berhasil disimpan/.test(await notif()), JSON.stringify({ n: t0.nomor, k: t0.kasId, t: t0.total, p: t0.pemberi }));
    catat("Jurnal otomatis: Debit Bank BSI 500.000 tanpa Divisi; Kredit Pendapatan Jasa Giro 500.000 [Divisi Sosial]", jr.length === 1 && j0.nomor === "BKM-0001" && j0.rincian.some(r => r.akunId === "k2" && r.debit === 500000 && !r.divisiId && !r.programId) && j0.rincian.some(r => r.akunId === "p1" && r.kredit === 500000 && r.divisiId === "d2"), JSON.stringify(j0.rincian));
    catat("Log Aktivitas: Buat Penerimaan BKM-0001", await evalJs("JSON.parse(localStorage.getItem('logAktivitas')||'[]').some(function(l){return l.tipe==='Penerimaan' && l.tindakan==='Buat' && l.referensi==='BKM-0001';})"));
    // 6) Ubah nilai: jurnal yang sama dibuat ulang
    await evalJs("trxTerima.modul.bukaUbah(JSON.parse(localStorage.getItem('daftarPenerimaan'))[0]); true"); await tunggu(400);
    await klik("#terima-rincian tr.jurnal-baris-data"); await tunggu(300);
    await evalJs("(function(){var n=document.getElementById('rterima-nilai'); n.value='650000'; n.dispatchEvent(new Event('input')); return true;})()");
    await klik("#lanjut-rincian-terima"); await tunggu(300);
    await bersihNotif(); await klik("#terima-simpan"); await tunggu(600);
    const jr2 = await jurnalTerima();
    catat("Ubah jadi 650.000: tetap 1 Penerimaan dan 1 jurnal (id sama) bernilai 650.000", (await penerimaan()).length === 1 && jr2.length === 1 && jr2[0].id === j0.id && jr2[0].rincian.some(r => r.akunId === "k2" && r.debit === 650000), JSON.stringify(jr2.map(j => j.rincian)));
    // 7) Isian kurang ditolak
    await evalJs("trxTerima.modul.bukaBaru(); true"); await tunggu(300);
    await bersihNotif(); await klik("#terima-simpan"); await tunggu(300);
    catat("Data Baru tanpa Kas/Bank: ditolak 'Kas/Bank wajib dipilih'", /Kas\/Bank wajib dipilih/.test(await evalJs("document.getElementById('terima-pesan-galat').textContent")));
    await pilihKas("k1"); await bersihNotif(); await klik("#terima-simpan"); await tunggu(300);
    catat("Tanpa rincian: ditolak 'Rincian Penerimaan masih kosong'", /Rincian Penerimaan masih kosong/.test(await evalJs("document.getElementById('terima-pesan-galat').textContent")));
    // 8) Hapus: jurnalnya ikut hilang
    await evalJs("trxTerima.modul.hapus(JSON.parse(localStorage.getItem('daftarPenerimaan'))[0]); true"); await tunggu(300); await klik("#ya-konfirmasi"); await tunggu(400);
    catat("Hapus Penerimaan: data dan jurnal otomatisnya hilang; Log 'Hapus'", (await penerimaan()).length === 0 && (await jurnalTerima()).length === 0 && await evalJs("JSON.parse(localStorage.getItem('logAktivitas')||'[]').some(function(l){return l.tipe==='Penerimaan' && l.tindakan==='Hapus';})"));
    // 9) Data rusak tidak membuat macet
    await evalJs("localStorage.setItem('daftarPenerimaan','{rusak'); true"); await kirim("Page.reload"); await siapUji(evalJs, tunggu);
    await klik("#tombol-kas"); await tunggu(300); await klik('#panel-kas .kotak-menu[data-halaman="Penerimaan"]'); await tunggu(400);
    await klik("#isi-terima .tombol-daftar"); await tunggu(300);
    catat("Data Penerimaan rusak: halaman dan daftar tetap terbuka", await evalJs("!document.getElementById('isi-terima').hidden"));
    catat("Tidak ada galat atau peringatan di Console", galat.length === 0, JSON.stringify(galat));
  } catch (e) { console.log("GALAT: " + e.stack); hasil.push(false); }
  try { ws.close(); } catch (e) { /* abaikan */ } chrome.kill();
  console.log("Lolos " + hasil.filter(Boolean).length + " dari " + hasil.length); process.exit(hasil.every(Boolean) ? 0 : 1);
})();
