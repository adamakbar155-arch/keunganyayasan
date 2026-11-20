// Uji J.27 di Chrome asli (tanpa jendela, headless): tombol Isi Data Contoh dan Hapus Data Contoh di Cadangan Data, foto nota
// rekaan (kanvas), Dashboard dan laporan terisi. Pemakaian: node uji-chrome-data-contoh.js <chrome.exe> <index.html> <folder-profil> <folder-png>
const { spawn } = require("child_process");
const fs = require("fs"), path = require("path");
const [chromeExe, halaman, folderProfil, folderPng] = process.argv.slice(2);
const PORT = 9407;
const tunggu = (ms) => new Promise(r => setTimeout(r, ms));
const siapUji = require("./bantu-siap.js");
let id = 0; const menunggu = new Map(); let ws;
const kirim = (m, p = {}) => new Promise((s, g) => { const n = ++id; menunggu.set(n, { s, g }); ws.send(JSON.stringify({ id: n, method: m, params: p })); });
const evalJs = async (e) => { const r = await kirim("Runtime.evaluate", { expression: e, returnByValue: true, awaitPromise: true }); if (r.exceptionDetails) throw new Error(JSON.stringify(r.exceptionDetails.exception ? r.exceptionDetails.exception.description : r.exceptionDetails.text) + " <<< " + e.slice(0, 120)); return r.result.value; };
const hasil = []; const catat = (n, ok, r = "") => { hasil.push(ok); console.log((ok ? "LOLOS  " : "GAGAL  ") + n + (r && !ok ? " -> " + r : "")); };
const foto = async (nama) => { const r = await kirim("Page.captureScreenshot", { format: "png" }); fs.writeFileSync(path.join(folderPng, nama), Buffer.from(r.data, "base64")); };
const klik = async (sel) => { const j = JSON.parse(await evalJs(`(function(){var e=document.querySelector(${JSON.stringify(sel)}); e.scrollIntoView({block:'center'}); var r=e.getBoundingClientRect(); return JSON.stringify({x:r.left+r.width/2,y:r.top+r.height/2});})()`)); await kirim("Input.dispatchMouseEvent", { type: "mouseMoved", x: j.x, y: j.y }); await kirim("Input.dispatchMouseEvent", { type: "mousePressed", x: j.x, y: j.y, button: "left", clickCount: 1 }); await kirim("Input.dispatchMouseEvent", { type: "mouseReleased", x: j.x, y: j.y, button: "left", clickCount: 1 }); };
const tungguMuatUlang = async () => { await tunggu(1500); for (let i = 0; i < 100; i++) { try { if (await evalJs("document.readyState==='complete' && typeof gambarDashboard==='function'")) { break; } } catch (e) { /* sedang memuat */ } await tunggu(200); } await tunggu(500); };

(async () => {
  fs.mkdirSync(folderPng, { recursive: true });
  const galat = [];
  const chrome = spawn(chromeExe, ["--headless=new", "--disable-gpu", "--no-first-run", "--remote-debugging-port=" + PORT, "--user-data-dir=" + folderProfil, "--window-size=1366,900", "file:///" + halaman.replace(/\\/g, "/")], { stdio: "ignore" });
  try {
    let t = null;
    for (let i = 0; i < 60 && !t; i++) { await tunggu(250); try { t = (await (await fetch("http://127.0.0.1:" + PORT + "/json/list")).json()).find(x => x.type === "page" && x.url.startsWith("file:")); } catch (e) { /* belum siap */ } }
    ws = new WebSocket(t.webSocketDebuggerUrl); await new Promise((s, g) => { ws.onopen = s; ws.onerror = g; });
    ws.onmessage = (m) => { const d = JSON.parse(m.data); if (d.method === "Runtime.exceptionThrown") { const x = d.params.exceptionDetails; galat.push(x.exception ? x.exception.description : x.text); } if (d.method === "Runtime.consoleAPICalled" && ["error", "warning"].includes(d.params.type)) galat.push(d.params.args.map(a => a.value).join(" ")); if (d.id && menunggu.has(d.id)) { const p = menunggu.get(d.id); menunggu.delete(d.id); d.error ? p.g(new Error(JSON.stringify(d.error))) : p.s(d.result); } };
    await kirim("Runtime.enable"); await kirim("Page.enable"); await require("./bantu-sesi.js").masukChrome(kirim, "file:///" + halaman.replace(/\\/g, "/")); /* masuk sebagai pengguna uji (J.25) */
    await kirim("Emulation.setDeviceMetricsOverride", { width: 1366, height: 900, deviceScaleFactor: 1, mobile: false });
    await siapUji(evalJs, tunggu);
    await evalJs("localStorage.clear(); true");
    await kirim("Page.reload"); await tungguMuatUlang();

    // Isi lewat tombol di Cadangan Data
    await evalJs("bukaCadangan(); true"); await tunggu(300);
    catat("Cadangan Data: kartu Data Contoh dengan tombol Isi Data Contoh", await evalJs("!document.getElementById('tombol-isi-contoh').hidden && document.getElementById('tombol-hapus-contoh').hidden && /Belum ada data contoh/.test(document.getElementById('status-data-contoh').textContent)"));
    await foto("data-contoh-cadangan.png");
    await klik("#tombol-isi-contoh"); await tunggu(300);
    catat("Klik Isi: konfirmasi muncul dulu", await evalJs("document.getElementById('dialog-konfirmasi').open && /REKAAN/.test(document.getElementById('isi-konfirmasi').textContent)"));
    await klik("#ya-konfirmasi");
    await tungguMuatUlang();
    // Saat komputer sibuk, pengisian (foto kanvas, PDF) bisa lebih lama dari waktu tunggu awal: tunggu pesannya, paling lama 15 detik
    let pesanIsi = "";
    for (let i = 0; i < 75 && !/Data contoh telah diisi/.test(pesanIsi); i++) { try { pesanIsi = await evalJs("document.getElementById('area-notifikasi').textContent"); } catch (e) { /* sedang memuat ulang */ } if (!/Data contoh telah diisi/.test(pesanIsi)) { await tunggu(200); } }
    await tungguMuatUlang();
    catat("Sesudah diisi halaman dimuat ulang dengan pesan berhasil", /Data contoh telah diisi/.test(pesanIsi), pesanIsi);
    const isi = JSON.parse(await evalJs(`(function(){ var l=JSON.parse(localStorage.getItem('lampiranJurnal')||'{}'), foto=0, pdf=0;
      Object.keys(l).forEach(function(k){ Object.keys(l[k]).forEach(function(f){ if(/^data:image\\/jpeg/.test(l[k][f])) foto++; if(/^data:application\\/pdf/.test(l[k][f])) pdf++; }); });
      return JSON.stringify({foto:foto, pdf:pdf, donasi:JSON.parse(localStorage.getItem('daftarDonasi')).length, bayar:JSON.parse(localStorage.getItem('daftarPembayaran')).length}); })()`));
    catat("Foto nota rekaan (kanvas) dan PDF faktur tersimpan sebagai lampiran", isi.foto >= 8 && isi.pdf >= 3 && isi.donasi >= 16 && isi.bayar >= 10, JSON.stringify(isi));
    // Dashboard terisi
    await evalJs("tampilkanTab('dashboard'); gambarDashboard(); true"); await tunggu(500);
    const dash = await evalJs("document.getElementById('isi-dashboard').textContent");
    catat("Dashboard terisi angka (bukan 'Belum ada donasi')", !/Belum ada donasi atau pengeluaran bulan ini/.test(dash) && /Rp\s?[1-9]/.test(dash));
    await foto("data-contoh-dashboard.png");
    // Laporan
    const PARAM = "{dari:tanggalContoh(0,1),sampai:tanggalHariIni(),divisi:[],program:[],akun:[],hanyaTotal:false,akunInduk:true,akunAnak:true}";
    await evalJs("tampilkanLaporan(cariLaporanDaftar('penghasilan-komprehensif').lap, " + PARAM + "); true"); await tunggu(500);
    catat("Laporan Penghasilan Komprehensif berisi penerimaan dan beban", /JUMLAH PENERIMAAN/.test(await evalJs("document.getElementById('lap-k-isi').textContent")));
    await foto("data-contoh-laporan.png");
    await evalJs("tampilkanLaporan(cariLaporanDaftar('bukti-pengeluaran').lap, " + PARAM + "); Promise.all([...document.querySelectorAll('#lap-k-isi img')].map(function(i){return i.decode().catch(function(){});})).then(function(){return true;})"); await tunggu(400);
    catat("Laporan Bukti Pengeluaran: foto nota tampil kecil dan ada 'Belum ada bukti'", await evalJs("document.querySelectorAll('#lap-k-isi .lap-bukti-butir img').length>=5 && document.querySelectorAll('#lap-k-isi .lap-bukti-belum').length>=1"));
    await foto("data-contoh-bukti.png");
    // Hapus
    await evalJs("bukaCadangan(); true"); await tunggu(300);
    catat("Cadangan Data: sekarang tombol Hapus Data Contoh", await evalJs("document.getElementById('tombol-isi-contoh').hidden && !document.getElementById('tombol-hapus-contoh').hidden"));
    await klik("#tombol-hapus-contoh"); await tunggu(300);
    await klik("#ya-konfirmasi");
    await tungguMuatUlang();
    catat("Sesudah Hapus: aplikasi kosong lagi, pengguna tetap", await evalJs("JSON.parse(localStorage.getItem('daftarDonasi')||'[]').length===0 && JSON.parse(localStorage.getItem('daftarDivisi')||'[]').length===0 && JSON.parse(localStorage.getItem('daftarPengguna')||'[]').length>0 && /Data contoh telah dihapus/.test(document.getElementById('area-notifikasi').textContent)"));
    catat("Tidak ada galat atau peringatan di Console", galat.length === 0, JSON.stringify(galat.slice(0, 3)));
  } catch (e) {
    console.log("GALAT: " + e.message); hasil.push(false);
  } finally {
    try { ws.close(); } catch (e) { /* abaikan */ }
    chrome.kill();
  }
  const lolos = hasil.filter(Boolean).length;
  console.log("Lolos " + lolos + " dari " + hasil.length);
  process.exit(lolos === hasil.length ? 0 : 1);
})();
