// Uji J.22: laporan Bukti Pengeluaran per Divisi dan Program (PRD 5.4) di Chrome asli (tanpa jendela, headless).
// Data rekaan: satu Pembayaran dengan foto + PDF yang barisnya terbagi dua Program, satu Jurnal Umum dengan foto, satu tanpa bukti.
// Yang diuji: pengelompokan dan nilai bagian, gambar kecil, label jenis berkas, Belum ada bukti, popup Lihat Bukti (pindah bukti,
// Unduh, Buka transaksi), PDF Cetak memuat foto, PDF Lampiran audit (ringkasan, tanda tangan, blok bukti, nomor halaman),
// nama berkas berkode HTML, isi lampiran rusak, dan Console bersih.
// Pemakaian: node uji-chrome-bukti.js <chrome.exe> <index.html> <folder-profil> <folder-png>
const { spawn } = require("child_process");
const fs = require("fs"), path = require("path");
const [chromeExe, halaman, folderProfil, folderPng] = process.argv.slice(2);
const PORT = 9402;
const tunggu = (ms) => new Promise(r => setTimeout(r, ms));
const siapUji = require("./bantu-siap.js");
let id = 0; const menunggu = new Map(); let ws;
const kirim = (m, p = {}) => new Promise((s, g) => { const n = ++id; menunggu.set(n, { s, g }); ws.send(JSON.stringify({ id: n, method: m, params: p })); });
const evalJs = async (e) => { const r = await kirim("Runtime.evaluate", { expression: e, returnByValue: true, awaitPromise: true }); if (r.exceptionDetails) throw new Error(JSON.stringify(r.exceptionDetails.exception ? r.exceptionDetails.exception.description : r.exceptionDetails.text) + " <<< " + e.slice(0, 120)); return r.result.value; };
const hasil = []; const catat = (n, ok, r = "") => { hasil.push(ok); console.log((ok ? "LOLOS  " : "GAGAL  ") + n + (r && !ok ? " -> " + r : "")); };
const foto = async (nama) => { const r = await kirim("Page.captureScreenshot", { format: "png" }); fs.writeFileSync(path.join(folderPng, nama), Buffer.from(r.data, "base64")); };
const klik = async (sel) => { const j = JSON.parse(await evalJs(`(function(){var e=document.querySelector(${JSON.stringify(sel)}); e.scrollIntoView({block:'center'}); var r=e.getBoundingClientRect(); return JSON.stringify({x:r.left+r.width/2,y:r.top+r.height/2});})()`)); await kirim("Input.dispatchMouseEvent", { type: "mouseMoved", x: j.x, y: j.y }); await kirim("Input.dispatchMouseEvent", { type: "mousePressed", x: j.x, y: j.y, button: "left", clickCount: 1 }); await kirim("Input.dispatchMouseEvent", { type: "mouseReleased", x: j.x, y: j.y, button: "left", clickCount: 1 }); };
const simpan = (k, v) => "localStorage.setItem(" + JSON.stringify(k) + ", " + JSON.stringify(JSON.stringify(v)) + ");";
const dariHeksa = (h) => h.match(/../g).map(c => String.fromCharCode(parseInt(c, 16))).join("");
const teksPdf = (mentah) => [...mentah.matchAll(/<([0-9A-F]+)> Tj/g)].map(m => dariHeksa(m[1])).join("|");

// Data rekaan (bukan data asli)
const akun = (id, kode, nama, tipe, indukId) => ({ id, kode, nama, tipe, indukId: indukId || "", saldoAwal: 0 });
const AKUN = [akun("k0", "1101", "Kas & Bank", "kas-bank"), akun("k01", "110101", "Kas", "kas-bank", "k0"), akun("k1", "11010101", "Kas Kecil", "kas-bank", "k01"),
  akun("b0", "5101", "Beban", "beban"), akun("b1", "510101", "Beban Buku", "beban", "b0"), akun("b2", "510102", "Beban Seragam", "beban", "b0")];
const r = (akunId, debit, kredit, ekstra) => Object.assign({ akunId, debit, kredit, nama: (AKUN.find(a => a.id === akunId) || {}).nama }, ekstra || {});
const JURNAL = [
  { id: "j1", nomor: "BKK-001", nama: "BKK-001", tanggal: "2026-10-05", keterangan: "Belanja sekolah", sumber: { jenis: "pembayaran", id: "py1" },
    rincian: [r("b1", 300000, 0, { divisiId: "d1", programId: "pr1" }), r("b2", 200000, 0, { divisiId: "d1", programId: "pr2" }), r("k1", 0, 500000)] },
  { id: "j2", nomor: "JU-001", nama: "JU-001", tanggal: "2026-10-08", keterangan: "Obat posyandu", rincian: [r("b1", 100000, 0, { divisiId: "d2" }), r("k1", 0, 100000)],
    lampiranInfo: [{ id: "f3", nama: "nota-obat.png", tipe: "image/png", ukuran: 2000 }], jumlahLampiran: 1 },
  { id: "j3", nomor: "JU-002", nama: "JU-002", tanggal: "2026-10-09", keterangan: "Fotokopi", rincian: [r("b2", 50000, 0, { divisiId: "d2" }), r("k1", 0, 50000)] }
];
const BAYAR = [{ id: "py1", nomor: "BKK-001", nama: "BKK-001", tanggal: "2026-10-05", kasId: "k1", kas: "11010101 - Kas Kecil", catatan: "Belanja sekolah",
  rincian: [{ id: "x1", akunId: "b1", kode: "510101", nama: "Beban Buku", nilai: 300000, divisiId: "d1", programId: "pr1", terikat: false },
            { id: "x2", akunId: "b2", kode: "510102", nama: "Beban Seragam", nilai: 200000, divisiId: "d1", programId: "pr2", terikat: false }],
  total: 500000, lampiranInfo: [{ id: "f1", nama: "nota-toko.png", tipe: "image/png", ukuran: 3000 }, { id: "f2", nama: "faktur.pdf", tipe: "application/pdf", ukuran: 900 }], jumlahLampiran: 2 }];
const PDF_KECIL = "data:application/pdf;base64,JVBERi0xLjQKJSVFT0YK";

(async () => {
  fs.mkdirSync(folderPng, { recursive: true });
  const galat = [];
  const chrome = spawn(chromeExe, ["--headless=new", "--disable-gpu", "--no-first-run", "--remote-debugging-port=" + PORT, "--user-data-dir=" + folderProfil, "--window-size=1366,900", "file:///" + halaman.replace(/\\/g, "/")], { stdio: "ignore" });
  try {
    let t = null;
    for (let i = 0; i < 60 && !t; i++) { await tunggu(250); try { t = (await (await fetch("http://127.0.0.1:" + PORT + "/json/list")).json()).find(x => x.type === "page" && x.url.startsWith("file:")); } catch (e) { /* belum siap */ } }
    ws = new WebSocket(t.webSocketDebuggerUrl); await new Promise((s, g) => { ws.onopen = s; ws.onerror = g; });
    ws.onmessage = (m) => { const d = JSON.parse(m.data); if (d.method === "Runtime.exceptionThrown") { const x = d.params.exceptionDetails; galat.push(x.exception ? x.exception.description : x.text + " " + (x.url || "") + ":" + x.lineNumber); } if (d.method === "Runtime.consoleAPICalled" && ["error", "warning"].includes(d.params.type)) galat.push(d.params.args.map(a => a.value).join(" ")); if (d.id && menunggu.has(d.id)) { const p = menunggu.get(d.id); menunggu.delete(d.id); d.error ? p.g(new Error(JSON.stringify(d.error))) : p.s(d.result); } };
    await kirim("Runtime.enable"); await kirim("Page.enable"); await require("./bantu-sesi.js").masukChrome(kirim, "file:///" + halaman.replace(/\\/g, "/")); /* masuk sebagai pengguna uji (J.25) */
    await kirim("Emulation.setDeviceMetricsOverride", { width: 1366, height: 900, deviceScaleFactor: 1, mobile: false });
    await siapUji(evalJs, tunggu);
    // Foto nota rekaan dibuat di halaman (kanvas berwarna), lalu disimpan sebagai isi lampiran
    await evalJs("(function(){function f(w,h,warna){var c=document.createElement('canvas'); c.width=w; c.height=h; var x=c.getContext('2d'); x.fillStyle=warna; x.fillRect(0,0,w,h); x.fillStyle='#fff'; x.fillRect(20,20,w-40,30); return c.toDataURL('image/png');}" +
      " localStorage.clear(); " + simpan("daftarAkun", AKUN) + simpan("daftarJurnal", JURNAL) + simpan("daftarPembayaran", BAYAR) +
      simpan("daftarDivisi", [{ id: "d1", nama: "Pendidikan" }, { id: "d2", nama: "Kesehatan" }]) +
      simpan("daftarProgram", [{ id: "pr1", nama: "Buku Gratis", divisiId: "d1", status: "aktif" }, { id: "pr2", nama: "Seragam", divisiId: "d1", status: "aktif" }]) +
      simpan("dataYayasan", { nama: "Yayasan Contoh Peduli" }) +
      " localStorage.setItem('lampiranJurnal', JSON.stringify({ py1: { f1: f(600,800,'#2563eb'), f2: " + JSON.stringify(PDF_KECIL) + " }, j2: { f3: f(800,500,'#16a34a') } })); return true;})()");
    await kirim("Page.reload"); await siapUji(evalJs, tunggu);

    const PARAM = "{dari:'2026-10-01',sampai:'2026-10-31',divisi:[],program:[],akun:[],hanyaTotal:false,akunInduk:true,akunAnak:true}";
    const tampil = async () => {
      await evalJs("(function(){tampilkanLaporan(cariLaporanDaftar('bukti-pengeluaran').lap, " + PARAM + "); return true;})()");
      await evalJs("Promise.all([...document.querySelectorAll('#lap-k-isi img')].map(function(i){return i.decode().catch(function(){});})).then(function(){return true;})");
      await tunggu(100);
      return evalJs("[...document.querySelector('#lap-k-isi table').tBodies[0].rows].map(function(x){return [...x.cells].map(function(c){return c.textContent;}).join('|');})");
    };
    const baris = await tampil();
    catat("Kelompok Divisi (nama urut) > Program > transaksi; Pembayaran terbagi dua Program dengan nilai bagiannya; TOTAL", JSON.stringify(baris) === JSON.stringify([
      "Divisi: Kesehatan", "Program: Tanpa Program", "8 Okt 2026|JU-001|Jurnal Umum|Obat posyandu|100.000|1 foto", "9 Okt 2026|JU-002|Jurnal Umum|Fotokopi|50.000|Belum ada bukti",
      "Jumlah Tanpa Program|150.000|", "Jumlah Divisi Kesehatan|150.000|",
      "Divisi: Pendidikan", "Program: Buku Gratis", "5 Okt 2026|BKK-001|Pembayaran|Belanja sekolah|300.000|1 foto, 1 PDF", "Jumlah Buku Gratis|300.000|",
      "Program: Seragam", "5 Okt 2026|BKK-001|Pembayaran|Belanja sekolah|200.000|1 foto, 1 PDF", "Jumlah Seragam|200.000|", "Jumlah Divisi Pendidikan|500.000|", "TOTAL|650.000|"]), JSON.stringify(baris));
    const sel = JSON.parse(await evalJs("JSON.stringify({img:document.querySelectorAll('#lap-k-isi .lap-bukti-butir img').length, berkas:[...document.querySelectorAll('#lap-k-isi .lap-bukti-berkas')].map(function(b){return b.dataset.jenis;}), belum:document.querySelectorAll('#lap-k-isi .lap-bukti-belum').length, merah:document.querySelectorAll('#lap-k-isi .lap-bukti-kurang').length, termuat:[...document.querySelectorAll('#lap-k-isi .lap-bukti-butir img')].every(function(i){return i.complete && i.naturalWidth>0;})})"));
    catat("Sel Bukti: 3 gambar kecil termuat, label PDF untuk berkas, 1 'Belum ada bukti' dengan baris bertanda", sel.img === 3 && sel.termuat && JSON.stringify(sel.berkas) === '["PDF","PDF"]' && sel.belum === 1 && sel.merah === 1, JSON.stringify(sel));
    catat("Catatan di bawah: 1 transaksi belum ada bukti; tombol Lampiran audit tampil", /1 transaksi belum ada bukti/.test(await evalJs("document.getElementById('lap-k-catatan').textContent")) && await evalJs("!document.getElementById('lap-cetak-audit').hidden"));
    await foto("lap-bukti.png");

    // Popup Lihat Bukti
    await klik("#lap-k-isi tr:nth-child(9) .lap-bukti-butir"); await tunggu(250);
    const popup = JSON.parse(await evalJs("JSON.stringify({buka:document.getElementById('dialog-bukti-laporan').open, judul:document.getElementById('judul-bukti-laporan').textContent, trx:document.getElementById('bukti-laporan-transaksi').textContent, img:!!document.querySelector('#bukti-laporan-tampil img'), lain:document.querySelectorAll('#bukti-laporan-lain button').length, tab:!document.getElementById('isi-hasil-laporan').hidden})"));
    catat("Klik gambar kecil: popup Lihat Bukti dengan foto besar, nama, transaksi, dan 2 bukti lain; baris tidak ikut membuka transaksi", popup.buka && popup.judul === "nota-toko.png" && /BKK-001/.test(popup.trx) && /Rp\s?300\.000/.test(popup.trx) && popup.img && popup.lain === 2 && popup.tab, JSON.stringify(popup));
    await foto("lap-bukti-popup.png");
    await klik("#bukti-laporan-lain li:nth-child(2) button"); await tunggu(150);
    catat("Pindah ke faktur.pdf: tanpa gambar, pesan 'tidak bisa ditampilkan di sini', Unduh aktif", await evalJs("!document.querySelector('#bukti-laporan-tampil img') && /tidak bisa ditampilkan di sini/.test(document.getElementById('bukti-laporan-tampil').textContent) && !document.getElementById('bukti-laporan-unduh').disabled"));
    await evalJs("window.__unduh=null; unduhLampiran=function(n,i){window.__unduh={n:n,i:i.slice(0,30)};}; true");
    await klik("#bukti-laporan-unduh"); await tunggu(100);
    catat("Unduh memakai nama dan isi berkasnya", await evalJs("JSON.stringify(window.__unduh)") === JSON.stringify({ n: "faktur.pdf", i: PDF_KECIL.slice(0, 30) }), await evalJs("JSON.stringify(window.__unduh)"));
    await klik("#bukti-laporan-buka"); await tunggu(400);
    catat("Buka transaksi: popup tertutup, Pembayaran BKK-001 terbuka", await evalJs("!document.getElementById('dialog-bukti-laporan').open && !document.getElementById('isi-bayar').hidden && document.getElementById('bayar-nomor').value==='BKK-001'"), await evalJs("document.getElementById('bayar-nomor').value"));

    // PDF Cetak biasa: foto kecil ikut
    await tampil();
    const cetak = Buffer.from(await evalJs("susunPdfLaporan().blob().arrayBuffer().then(function(b){var u=new Uint8Array(b),s=''; for(var i=0;i<u.length;i++){s+=String.fromCharCode(u[i]);} return btoa(s);})"), "base64").toString("latin1");
    const teksCetak = teksPdf(cetak);
    catat("PDF Cetak: foto ikut tercetak (gambar JPEG), Belum ada bukti, ringkasan jenis, TOTAL", (cetak.match(/\/Subtype \/Image/g) || []).length >= 2 && /DCTDecode/.test(cetak) && /Belum ada bukti/.test(teksCetak) && /1 foto, 1 PDF/.test(teksCetak) && /TOTAL/.test(teksCetak), (cetak.match(/\/Subtype \/Image/g) || []).length + " gambar");

    // PDF Lampiran audit
    await evalJs("lepasDokumenCetak(); true");
    await klik("#lap-cetak-audit");
    for (let i = 0; i < 50 && !(await evalJs("!!dokumenCetak")); i++) { await tunggu(100); }
    const audit = Buffer.from(await evalJs("dokumenCetak.blob.arrayBuffer().then(function(b){var u=new Uint8Array(b),s=''; for(var i=0;i<u.length;i++){s+=String.fromCharCode(u[i]);} return btoa(s);})"), "base64").toString("latin1");
    fs.writeFileSync(path.join(folderPng, "lampiran-audit.pdf"), Buffer.from(audit, "latin1"));   // untuk dilihat manual
    const teksAudit = teksPdf(audit); const jumlahHal = (audit.match(/\/Type \/Page /g) || []).length;
    catat("Lampiran audit: Halaman Cetak terbuka dengan judulnya", await evalJs("!document.getElementById('halaman-cetak-bukti').hidden && document.getElementById('hcb-judul').textContent==='Lampiran Audit Bukti Pengeluaran'"));
    catat("Lampiran audit, ringkasan: kolom Hal., TOTAL 650.000, jumlah belum ada bukti, tanda tangan Disiapkan dan Diperiksa", /Hal\./.test(teksAudit) && /TOTAL/.test(teksAudit) && /650\.000/.test(teksAudit) && /3 transaksi; 1 transaksi belum ada bukti/.test(teksAudit) && /Disiapkan oleh/.test(teksAudit) && /Diperiksa oleh/.test(teksAudit), teksAudit.slice(0, 400));
    catat("Lampiran audit, blok: satu per transaksi, Pembayaran memuat dua bagian Program, PDF hanya nama berkas, kotak merah Belum ada bukti", /BKK-001/.test(teksAudit) && /Pendidikan \/ Buku Gratis: Rp\s?300\.000; Pendidikan \/ Seragam: Rp\s?200\.000/.test(teksAudit) && /\[PDF\] faktur\.pdf - buka atau unduh dari aplikasi/.test(teksAudit) && /Belum ada bukti/.test(teksAudit));
    catat("Lampiran audit: 2 foto besar (foto sama dipakai sekali), semua halaman bernomor", (audit.match(/\/Subtype \/Image/g) || []).length === 2 && jumlahHal >= 2 && Array.from({ length: jumlahHal }, (x, i) => teksAudit.includes("Halaman " + (i + 1) + " dari " + jumlahHal)).every(Boolean), jumlahHal + " halaman");
    // Nomor halaman di ringkasan menunjuk halaman blok sungguhan: baris ringkasan pertama (Kesehatan, JU-001) -> halaman 2
    catat("Ringkasan: nomor halaman blok terisi (bukan '-')", /\|8 Okt 2026\|100\.000\|1\|2\|/.test(teksAudit), (teksAudit.match(/8 Okt 2026[^]{0,40}/) || [""])[0]);
    await evalJs("tutupHalamanCetak(); true");

    // Jurnal tanpa Lampiran (Temuan 35): lampiran dicari di transaksi asal. BKK-001 (Pembayaran berlampiran) dan JU-001 tidak tampil.
    const tanpa = await evalJs("(function(){tampilkanLaporan(cariLaporanDaftar('jurnal-tanpa-lampiran').lap, " + PARAM + "); return [...document.querySelector('#lap-k-isi table').tBodies[0].rows].map(function(x){return x.cells[1] ? x.cells[1].textContent : x.textContent;});})()");
    catat("Jurnal tanpa Lampiran: Pembayaran yang lampirannya tersimpan di Pembayaran tidak ikut tampil; hanya JU-002", JSON.stringify(tanpa) === JSON.stringify(["JU-002", "50.000"]), JSON.stringify(tanpa));
    // Nama berkas berkode HTML dan isi lampiran rusak
    await evalJs("(function(){var b=JSON.parse(localStorage.getItem('daftarPembayaran')); b[0].lampiranInfo[1].nama='<img src=x onerror=alert(1)>.pdf'; localStorage.setItem('daftarPembayaran', JSON.stringify(b)); localStorage.setItem('lampiranJurnal','{rusak'); return true;})()");
    const rusak = await tampil();
    catat("Isi lampiran rusak + nama berkode HTML: laporan tetap tampil, tanpa gambar, tanpa elemen dari nama", rusak.length === 15 && await evalJs("document.querySelectorAll('#lap-k-isi img').length===0 && document.querySelectorAll('#lap-k-isi .lap-bukti-berkas').length===5"), JSON.stringify(rusak.slice(0, 3)));
    await klik("#lap-k-isi tr:nth-child(9) .lap-bukti-butir"); await tunggu(150);
    catat("Popup bukti yang isinya hilang: pesan tidak ditemukan, Unduh mati", await evalJs("/tidak ditemukan/.test(document.getElementById('bukti-laporan-tampil').textContent) && document.getElementById('bukti-laporan-unduh').disabled"));
    await evalJs("document.getElementById('dialog-bukti-laporan').close(); true");
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
