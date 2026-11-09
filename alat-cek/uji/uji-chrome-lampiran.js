// Uji lampiran di Chrome asli: foto besar dikecilkan. Pemakaian: node uji-chrome-lampiran.js <chrome.exe> <menu.html> <folder-profil> <folder-png>
const { spawn } = require("child_process");
const fs = require("fs"), path = require("path"), zlib = require("zlib");
const [chromeExe, halaman, folderProfil, folderPng] = process.argv.slice(2);
const PORT = 9361;
const tunggu = (ms) => new Promise(r => setTimeout(r, ms));
const siapUji = require("./bantu-siap.js");   // tunggu sampai aplikasi siap sesudah muat ulang
let id = 0; const menunggu = new Map(); let ws;
const kirim = (m, p = {}) => new Promise((s, g) => { const n = ++id; menunggu.set(n, { s, g }); ws.send(JSON.stringify({ id: n, method: m, params: p })); });
const evalJs = async (e) => { const r = await kirim("Runtime.evaluate", { expression: e, returnByValue: true, awaitPromise: true }); if (r.exceptionDetails) throw new Error(JSON.stringify(r.exceptionDetails.exception.description)); return r.result.value; };
const hasil = []; const catat = (n, ok, r = "") => { hasil.push(ok); console.log((ok ? "LOLOS  " : "GAGAL  ") + n + (r ? " -> " + r : "")); };
const foto = async (nama) => { const r = await kirim("Page.captureScreenshot", { format: "png" }); fs.writeFileSync(path.join(folderPng, nama), Buffer.from(r.data, "base64")); };
const klik = async (sel) => { const j = JSON.parse(await evalJs(`(function(){var e=document.querySelector(${JSON.stringify(sel)}); e.scrollIntoView({block:'center'}); var r=e.getBoundingClientRect(); return JSON.stringify({x:r.left+r.width/2,y:r.top+r.height/2});})()`)); await kirim("Input.dispatchMouseEvent", { type: "mouseMoved", x: j.x, y: j.y }); await kirim("Input.dispatchMouseEvent", { type: "mousePressed", x: j.x, y: j.y, button: "left", clickCount: 1 }); await kirim("Input.dispatchMouseEvent", { type: "mouseReleased", x: j.x, y: j.y, button: "left", clickCount: 1 }); };
const danaUji = (p) => evalJs("(function(){var t=document.getElementById('" + p + "-terikat'), n=document.getElementById('" + p + "-tidak-terikat'); if(t&&n&&!t.checked&&!n.checked){n.checked=true;} var d=document.getElementById('" + p + "-divisi'); if(d&&d.value===''){var o=[].slice.call(d.options).find(function(x){return x.value;}); if(o){d.value=o.value; d.dispatchEvent(new Event('change',{bubbles:true}));}} return true;})()");   // Dana belum dipilih -> Tidak Terikat (arti lama, PRD 4.1); Divisi kosong -> divisi pertama (wajib, PRD 5.1)
// PNG 3000x2000 (gradasi + pola halus), dibuat tanpa pustaka
function buatPng(lebar, tinggi, berkasKeluar) {
  const crcT = []; for (let n = 0; n < 256; n++) { let c = n; for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1; crcT[n] = c >>> 0; }
  const crc = (b) => { let c = 0xffffffff; for (const x of b) c = crcT[(c ^ x) & 255] ^ (c >>> 8); return (c ^ 0xffffffff) >>> 0; };
  const potong = (tipe, data) => { const l = Buffer.alloc(4); l.writeUInt32BE(data.length); const td = Buffer.concat([Buffer.from(tipe), data]); const c = Buffer.alloc(4); c.writeUInt32BE(crc(td)); return Buffer.concat([l, td, c]); };
  const ihdr = Buffer.alloc(13); ihdr.writeUInt32BE(lebar, 0); ihdr.writeUInt32BE(tinggi, 4); ihdr[8] = 8; ihdr[9] = 2;
  const baris = Buffer.alloc((lebar * 3 + 1) * tinggi);
  for (let y = 0; y < tinggi; y++) { const o = y * (lebar * 3 + 1); baris[o] = 0; for (let x = 0; x < lebar; x++) { const p = o + 1 + x * 3; baris[p] = (x * 255 / lebar) | 0; baris[p + 1] = (y * 255 / tinggi) | 0; baris[p + 2] = ((x ^ y) & 31) * 4 + ((x * y) % 17); } }
  fs.writeFileSync(berkasKeluar, Buffer.concat([Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]), potong("IHDR", ihdr), potong("IDAT", zlib.deflateSync(baris)), potong("IEND", Buffer.alloc(0))]));
}
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
  const png = path.join(folderPng, "foto-besar.png"); buatPng(3000, 2000, png);
  const ukuranAsli = fs.statSync(png).size;
  const kecilTxt = path.join(folderPng, "catatan.txt"); fs.writeFileSync(kecilTxt, "halo lampiran");
  const chrome = spawn(chromeExe, ["--headless=new", "--disable-gpu", "--no-first-run", "--remote-debugging-port=" + PORT, "--user-data-dir=" + folderProfil, "--window-size=1366,900", "file:///" + halaman.replace(/\\/g, "/")], { stdio: "ignore" });
  try {
    let t = null;
    for (let i = 0; i < 60 && !t; i++) { await tunggu(250); try { t = (await (await fetch("http://127.0.0.1:" + PORT + "/json/list")).json()).find(x => x.type === "page" && x.url.startsWith("file:")); } catch (e) {} }
    ws = new WebSocket(t.webSocketDebuggerUrl); await new Promise((s, g) => { ws.onopen = s; ws.onerror = g; });
    ws.onmessage = (m) => { const d = JSON.parse(m.data); if (d.id && menunggu.has(d.id)) { const p = menunggu.get(d.id); menunggu.delete(d.id); d.error ? p.g(new Error(JSON.stringify(d.error))) : p.s(d.result); } };
    await kirim("Runtime.enable"); await kirim("Page.enable"); await require("./bantu-sesi.js").masukChrome(kirim, "file:///" + halaman.replace(/\\/g, "/")); /* masuk sebagai pengguna uji (J.25) */ await kirim("Page.addScriptToEvaluateOnNewDocument", { source: require("./bantu-pengguna.js") }); /* pengguna mengisi kepala Data Baru (PRD 5.3a) */ await kirim("Page.addScriptToEvaluateOnNewDocument", { source: PEMBUNGKUS_AKUN }); await kirim("Page.reload"); await siapUji(evalJs, tunggu); await kirim("DOM.enable");
    await kirim("Emulation.setDeviceMetricsOverride", { width: 1366, height: 900, deviceScaleFactor: 1, mobile: false });
    await tunggu(800);
    await evalJs("localStorage.clear(); true"); await kirim("Page.reload"); await siapUji(evalJs, tunggu);
    console.log("INFO  PNG asli: " + (ukuranAsli / 1048576).toFixed(1) + " MB");
    // Akun & aturan minimal supaya jurnal bisa disimpan
    await evalJs(`(function(){ localStorage.setItem('daftarAkun', JSON.stringify([{id:'a1',kode:'110101',nama:'Kas Kecil',tipe:'kas-bank',saldoAwal:0},{id:'a2',kode:'410101',nama:'Donasi',tipe:'pendapatan',saldoAwal:0}])); localStorage.setItem('daftarPenomoran', JSON.stringify([{id:'n1',nama:'Jurnal Umum',pembukuan:'yayasan',tipe:'jurnal',digit:4,komponen:[{jenis:'teks',nilai:'JU-'},{jenis:'counter'}]}])); localStorage.setItem('daftarDivisi', JSON.stringify([{id:'d1',nama:'Pendidikan'}])); bukaJurnalBaru(); return true; })()`);
    await tunggu(500);
    await klik("#jurnal-tombol-lampiran"); await tunggu(300);
    catat("Klik klip (mouse asli): dialog Lampiran terbuka", await evalJs("document.getElementById('dialog-lampiran').open"));
    await foto("lampiran-kosong.png");
    // Pilih file lewat input file asli
    const dok = await kirim("DOM.getDocument", { depth: 1 });
    const nod = await kirim("DOM.querySelector", { nodeId: dok.root.nodeId, selector: "#lampiran-berkas" });
    await kirim("DOM.setFileInputFiles", { files: [png, kecilTxt], nodeId: nod.nodeId });
    await tunggu(2500);
    const o = JSON.parse(await evalJs(`JSON.stringify({jumlah: document.querySelectorAll('#daftar-lampiran .butir-lampiran').length, teks:[...document.querySelectorAll('#daftar-lampiran .butir-lampiran')].map(x=>x.textContent), miniatur: document.querySelectorAll('#daftar-lampiran img').length, galat: document.getElementById('galat-lampiran').textContent, lencana: document.getElementById('jurnal-lencana-lampiran').textContent, ukuran: lampiranJurnal.kerja().map(function(f){return f.ukuran;}), nama: lampiranJurnal.kerja().map(function(f){return f.nama;}), tipe: lampiranJurnal.kerja().map(function(f){return f.tipe;})})`));
    console.log("INFO  " + JSON.stringify(o));
    catat("Foto 3000x2000 dan teks masuk daftar (2 file), tanpa pesan galat", o.jumlah === 2 && o.galat === "", JSON.stringify(o.galat));
    catat("Foto dikecilkan otomatis: ukuran akhir < 700 KB dan jauh lebih kecil dari aslinya, jadi JPEG (.jpg)", o.ukuran[0] < 700 * 1024 && o.ukuran[0] < ukuranAsli / 2 && o.tipe[0] === "image/jpeg" && /\.jpg$/.test(o.nama[0]), (o.ukuran[0] / 1024).toFixed(0) + " KB, " + o.nama[0]);
    catat("Miniatur foto tampil (1 gambar) dan lencana bernilai 2", o.miniatur === 1 && o.lencana === "2");
    const dim = await evalJs(`new Promise(function(r){var i=new Image(); i.onload=function(){r(i.width+'x'+i.height);}; i.src=lampiranJurnal.kerja()[0].isi;})`);
    catat("Ukuran gambar hasil = 1600x1067 (sisi terpanjang 1600, perbandingan tetap)", dim === "1600x1067", dim);
    await foto("lampiran-terisi.png");
    // Isi foto diperiksa: berawalan JPEG tetapi tidak bisa dibuka = ditolak; PNG asli bernama .jpg = diterima (jenisnya PNG)
    const cekFoto = JSON.parse(await evalJs(`(async function(){ var c=document.createElement('canvas'); c.width=40; c.height=30; c.getContext('2d').fillRect(0,0,40,30);
      var png=await new Promise(function(r){c.toBlob(r,'image/png');}); var rusak=new Uint8Array(300); rusak.set([0xFF,0xD8,0xFF,0xE0]);
      await lampiranJurnal.tambah([new File([rusak],'rusak.jpg',{type:'image/jpeg'}), new File([png],'foto-png.jpg',{type:'image/jpeg'})]);
      var k=lampiranJurnal.kerja(), akhir=k[k.length-1]; var hasil={galat:document.getElementById('galat-lampiran').textContent, jumlah:k.length, tipe:akhir.tipe, isi:akhir.isi.slice(0,15)};
      lampiranJurnal.atur(k.slice(0,2)); return JSON.stringify(hasil); })()`));
    catat("Foto rusak berawalan JPEG ditolak 'tidak bisa dibuka sebagai foto'; PNG asli bernama .jpg diterima sebagai PNG", /"rusak\.jpg": tidak bisa dibuka sebagai foto/.test(cekFoto.galat) && cekFoto.jumlah === 3 && /^image\/(png|jpeg)$/.test(cekFoto.tipe) && /^data:image\/(png|jpeg)/.test(cekFoto.isi), JSON.stringify(cekFoto));
    // Simpan jurnal lewat klik asli
    await klik("#selesai-lampiran"); await tunggu(300);
    await evalJs(`(function(){ var a=localStorage; return true; })()`);
    await evalJs(`(function(){ var e=document.getElementById('jurnal-cari-akun'); return true; })()`);
    const ketik = (x) => kirim("Input.insertText", { text: x });
    const tombol = async (key, code, vk) => { await kirim("Input.dispatchKeyEvent", { type: "keyDown", key, code, windowsVirtualKeyCode: vk }); await kirim("Input.dispatchKeyEvent", { type: "keyUp", key, code, windowsVirtualKeyCode: vk }); };
    for (const [kata, sisi] of [["kas kecil", "debit"], ["donasi", "kredit"]]) {
      await klik("#jurnal-cari-akun"); await ketik(kata); await tunggu(250);
      await tombol("ArrowDown", "ArrowDown", 40); await tombol("Enter", "Enter", 13); await tunggu(400);
      await klik('input[name="detail-sisi"][value="' + sisi + '"]'); await danaUji("detail"); await klik("#detail-nilai"); await ketik("25000"); await tombol("Enter", "Enter", 13); await tunggu(400);
      await tombol("Enter", "Enter", 13); await tunggu(400);
    }
    await klik("#jurnal-simpan"); await tunggu(700);
    const sj = JSON.parse(await evalJs(`JSON.stringify({jurnal: JSON.parse(localStorage.getItem('daftarJurnal')||'[]').map(function(j){return {lamp:(j.lampiranInfo||[]).length, tanpaIsi: JSON.stringify(j).indexOf('data:')===-1};}), isi: Object.keys(JSON.parse(localStorage.getItem('lampiranJurnal')||'{}')).length, galat: document.getElementById('jurnal-pesan-galat').hidden ? '' : document.getElementById('jurnal-pesan-galat').textContent})`));
    console.log("INFO  " + JSON.stringify(sj));
    catat("Simpan (klik asli): jurnal tersimpan dengan 2 lampiran, data jurnal bebas isi file, isi tersimpan terpisah", sj.jurnal.length === 1 && sj.jurnal[0].lamp === 2 && sj.jurnal[0].tanpaIsi && sj.isi === 1, JSON.stringify(sj));
    const pakai = await evalJs("(function(){var n=0; for (var i=0;i<localStorage.length;i++){ n+=localStorage.getItem(localStorage.key(i)).length; } return n;})()");
    console.log("INFO  pemakaian penyimpanan ±" + (pakai / 1024).toFixed(0) + " KB dari ±5000 KB");

    // Logo yayasan (Preferensi, Data; Temuan 46): isi file diperiksa, bukan hanya nama. Dipilih lewat input file asli.
    const logoAsli = path.join(folderPng, "logo-asli.png"); buatPng(60, 40, logoAsli);
    const logoPalsu = path.join(folderPng, "logo-palsu.png"); fs.writeFileSync(logoPalsu, Buffer.from([0x4D, 0x5A, 0x90, 0, 3, 0, 0, 0, 4, 0, 0, 0, 0xFF, 0xFF, 0, 0]));
    const logoRusak = path.join(folderPng, "logo-rusak.png"); fs.writeFileSync(logoRusak, Buffer.concat([Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]), Buffer.alloc(200, 7)]));
    const logoSvg = path.join(folderPng, "logo.svg"); fs.writeFileSync(logoSvg, '<svg xmlns="http://www.w3.org/2000/svg" width="10" height="10"><rect width="10" height="10"/></svg>');
    const pilihLogo = async (berkas) => {
      await evalJs("logoTersimpan=''; document.getElementById('area-notifikasi').textContent=''; true");
      const d2 = await kirim("DOM.getDocument", { depth: 1 });
      const n2 = await kirim("DOM.querySelector", { nodeId: d2.root.nodeId, selector: "#yayasan-logo" });
      await kirim("DOM.setFileInputFiles", { files: [berkas], nodeId: n2.nodeId }); await tunggu(800);
      return JSON.parse(await evalJs("JSON.stringify({logo: logoTersimpan.slice(0, 22), notif: document.getElementById('area-notifikasi').textContent, kolom: document.getElementById('yayasan-logo').value})"));
    };
    const lAsli = await pilihLogo(logoAsli), lPalsu = await pilihLogo(logoPalsu), lRusak = await pilihLogo(logoRusak), lSvg = await pilihLogo(logoSvg);
    catat("Logo PNG asli diterima (jenis dari isi: image/png)", lAsli.logo === "data:image/png;base64," && lAsli.notif === "", JSON.stringify(lAsli));
    catat("Logo: program bernama .png ditolak 'bukan gambar', pilihan file dikosongkan", lPalsu.logo === "" && /Isi file ini bukan gambar/.test(lPalsu.notif) && lPalsu.kolom === "", JSON.stringify(lPalsu));
    catat("Logo: berawalan PNG tetapi rusak ditolak 'tidak bisa dibuka sebagai gambar'", lRusak.logo === "" && /tidak bisa dibuka sebagai gambar/.test(lRusak.notif), JSON.stringify(lRusak));
    catat("Logo: SVG tidak diterima lagi", lSvg.logo === "" && /PNG, JPG, atau WEBP/.test(lSvg.notif), JSON.stringify(lSvg));
  } catch (e) { console.log("GALAT: " + e.stack); hasil.push(false); }
  try { ws.close(); } catch (e) {} chrome.kill();
  console.log("Lolos " + hasil.filter(Boolean).length + " dari " + hasil.length); process.exit(hasil.every(Boolean) ? 0 : 1);
})();
