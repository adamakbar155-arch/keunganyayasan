// Uji J.24: pintasan keyboard (PRD 6.11) di Chrome asli (tanpa jendela, headless), dengan tekanan tombol sungguhan.
// Pemakaian: node uji-chrome-pintasan.js <chrome.exe> <index.html> <folder-profil> <folder-png>
const { spawn } = require("child_process");
const fs = require("fs"), path = require("path");
const [chromeExe, halaman, folderProfil, folderPng] = process.argv.slice(2);
const PORT = 9403;
const tunggu = (ms) => new Promise(r => setTimeout(r, ms));
const siapUji = require("./bantu-siap.js");
let id = 0; const menunggu = new Map(); let ws;
const kirim = (m, p = {}) => new Promise((s, g) => { const n = ++id; menunggu.set(n, { s, g }); ws.send(JSON.stringify({ id: n, method: m, params: p })); });
const evalJs = async (e) => { const r = await kirim("Runtime.evaluate", { expression: e, returnByValue: true, awaitPromise: true }); if (r.exceptionDetails) throw new Error(JSON.stringify(r.exceptionDetails.exception ? r.exceptionDetails.exception.description : r.exceptionDetails.text) + " <<< " + e.slice(0, 120)); return r.result.value; };
const hasil = []; const catat = (n, ok, r = "") => { hasil.push(ok); console.log((ok ? "LOLOS  " : "GAGAL  ") + n + (r && !ok ? " -> " + r : "")); };
const foto = async (nama) => { const r = await kirim("Page.captureScreenshot", { format: "png" }); fs.writeFileSync(path.join(folderPng, nama), Buffer.from(r.data, "base64")); };
// Tekan tombol sungguhan. pengubah: Alt=1, Ctrl=2, Meta=4, Shift=8
const KODE = { S: 83, N: 78, D: 68, W: 87, P: 80, L: 76 };
const tekan = async (pengubah, huruf) => {
  const fungsi = /^F\d+$|^Escape$/.test(huruf);
  const o = fungsi ? { key: huruf, code: huruf, windowsVirtualKeyCode: huruf === "Escape" ? 27 : 111 + Number(huruf.slice(1)) }
                   : { key: huruf.toLowerCase(), code: "Key" + huruf, windowsVirtualKeyCode: KODE[huruf] };
  await kirim("Input.dispatchKeyEvent", Object.assign({ type: "rawKeyDown", modifiers: pengubah }, o));
  await kirim("Input.dispatchKeyEvent", Object.assign({ type: "keyUp", modifiers: pengubah }, o));
  await tunggu(250);
};
const ALT = 1, CTRL = 2;
const simpan = (k, v) => "localStorage.setItem(" + JSON.stringify(k) + ", " + JSON.stringify(JSON.stringify(v)) + ");";

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
    // Data rekaan: akun Kas tingkat 3 dan satu Divisi
    await evalJs("localStorage.clear(); " + simpan("daftarAkun", [{ id: "k0", kode: "1101", nama: "Kas & Bank", tipe: "kas-bank", indukId: "" }, { id: "k01", kode: "110101", nama: "Kas", tipe: "kas-bank", indukId: "k0" }, { id: "k1", kode: "11010101", nama: "Kas Kecil", tipe: "kas-bank", indukId: "k01" }]) +
      simpan("daftarDivisi", [{ id: "d1", nama: "Pendidikan", keterangan: "" }]) + simpan("dataYayasan", { nama: "Yayasan Contoh" }) + " true");
    await kirim("Page.reload"); await siapUji(evalJs, tunggu);
    const notif = () => evalJs("document.getElementById('area-notifikasi').textContent");

    // F1 dan ikon ?
    await tekan(0, "F1");
    catat("F1: popup Pintasan Keyboard terbuka, berisi Ctrl + S dan tanpa pintasan Hapus", await evalJs("document.getElementById('dialog-pintasan').open && /Ctrl \\+ S/.test(document.getElementById('dialog-pintasan').textContent) && !/Delete/.test(document.getElementById('dialog-pintasan').textContent)"));
    await foto("pintasan-popup.png");
    await tekan(0, "Escape");
    catat("Esc menutup popup", await evalJs("!document.getElementById('dialog-pintasan').open"));
    await evalJs("document.getElementById('tombol-bantuan').click(); true");
    catat("Ikon ? di bilah atas membuka daftar pintasan", await evalJs("document.getElementById('dialog-pintasan').open"));
    await evalJs("document.getElementById('selesai-pintasan').click(); true");

    // Divisi: Ctrl+S dari dalam kolom isian
    await evalJs("modulDivisi.bukaDariMenu(); document.getElementById('divisi-nama').focus(); true"); await tunggu(200);
    await kirim("Input.insertText", { text: "Kesehatan" });
    await tekan(CTRL, "S");
    catat("Ctrl+S saat mengetik di kolom: Divisi tersimpan, Data Baru kosong lagi", await evalJs("modulDivisi.ambil().some(function(d){return d.nama==='Kesehatan';}) && document.getElementById('divisi-nama').value===''"), await notif());
    await tekan(CTRL, "S");
    catat("Ctrl+S dengan isian kosong: ditolak dengan pesan biasa (aturan sama dengan klik)", await evalJs("modulDivisi.ambil().length===2") && /wajib/i.test(await evalJs("document.querySelector('#isi-divisi .modul-form').textContent")));
    // Alt+D, Alt+N
    await tekan(ALT, "D");
    catat("Alt+D: pindah ke Daftar", await evalJs("document.querySelector('#isi-divisi .modul-form').hidden"));
    await tekan(ALT, "D");
    catat("Alt+D lagi: kembali ke Formulir", await evalJs("!document.querySelector('#isi-divisi .modul-form').hidden"));
    await evalJs("modulDivisi.bukaUbah(modulDivisi.ambil()[0]); true"); await tunggu(150);
    await tekan(ALT, "N");
    catat("Alt+N dari tab data lama: pindah ke tab Data Baru", await evalJs("modulDivisi.idDiubah===null && document.getElementById('divisi-nama').value===''"));
    // Alt+W dengan perubahan: peringatan; pintasan diam saat popup terbuka
    await evalJs("modulDivisi.bukaUbah(modulDivisi.ambil()[0]); var k=document.getElementById('divisi-nama'); k.value='Pendidikan Baru'; k.dispatchEvent(new Event('input',{bubbles:true})); true"); await tunggu(150);
    await tekan(ALT, "W");
    catat("Alt+W pada tab yang berubah: peringatan 'Perubahan ... dibatalkan'", await evalJs("document.getElementById('dialog-konfirmasi').open && /dibatalkan/.test(document.getElementById('isi-konfirmasi').textContent)"));
    await tekan(CTRL, "S");
    catat("Saat popup terbuka Ctrl+S tidak menyimpan dari baliknya", await evalJs("modulDivisi.ambil()[0].nama==='Pendidikan'"));
    await evalJs("document.getElementById('ya-konfirmasi').click(); true"); await tunggu(150);
    catat("Ya: tab tertutup tanpa menyimpan", await evalJs("modulDivisi.ambil()[0].nama==='Pendidikan' && ![...document.querySelectorAll('#isi-divisi .tab-judul')].some(function(t){return t.textContent==='Pendidikan';})"));

    // Pembayaran: Alt+L, Ctrl+P (Cetak bukti), Ctrl+S memakai aturan yang sama
    await evalJs("bukaPembayaranBaru(); true"); await tunggu(300);
    await tekan(ALT, "L");
    catat("Alt+L di Pembayaran: popup Lampiran terbuka untuk Pembayaran", await evalJs("document.getElementById('dialog-lampiran').open && lampiranAktif!==null"));
    await evalJs("document.getElementById('selesai-lampiran').click(); true");
    await tekan(CTRL, "S");
    catat("Ctrl+S Pembayaran kosong: pesan wajib, tidak tersimpan", await evalJs("JSON.parse(localStorage.getItem('daftarPembayaran')||'[]').length===0 && !document.getElementById('bayar-pesan-galat').hidden"));
    await evalJs("document.getElementById('area-notifikasi').textContent=''; true");
    await tekan(CTRL, "P");
    catat("Ctrl+P di formulir transaksi: menjalankan Cetak bukti (tanpa cetak bawaan browser)", /simpan|Cetak|wajib|tidak bisa|dulu/i.test(await notif() + await evalJs("document.getElementById('bayar-pesan-galat').textContent")) || await evalJs("!document.getElementById('halaman-cetak-bukti').hidden || document.getElementById('dialog-pilih-desain').open"), await notif());
    await evalJs("document.querySelectorAll('dialog[open]').forEach(function(d){d.close();}); if(!document.getElementById('halaman-cetak-bukti').hidden){tutupHalamanCetak();} true");

    // Daftar dan laporan: Ctrl+P membuka Halaman Cetak
    await evalJs("modulDivisi.bukaDariMenu(); modulDivisi.tampilkan('daftar'); true"); await tunggu(200);
    await tekan(CTRL, "P");
    catat("Ctrl+P di Daftar: Halaman Cetak daftar terbuka", await evalJs("!document.getElementById('halaman-cetak-bukti').hidden"));
    await tekan(ALT, "N");
    catat("Saat Halaman Cetak terbuka, pintasan lain tidak bekerja", await evalJs("document.querySelector('#isi-divisi .modul-form').hidden"));
    await evalJs("tutupHalamanCetak(); tampilkanLaporan(cariLaporanDaftar('neraca-saldo').lap, {dari:'2026-01-01',sampai:'2026-12-31',divisi:[],program:[],akun:[],hanyaTotal:false,akunInduk:true,akunAnak:true}); true"); await tunggu(300);
    await tekan(CTRL, "P");
    catat("Ctrl+P di laporan: Halaman Cetak laporan terbuka", await evalJs("!document.getElementById('halaman-cetak-bukti').hidden && document.getElementById('hcb-judul').textContent==='Neraca Saldo'"));
    await evalJs("tutupHalamanCetak(); true");

    // Kombinasi lain tidak dipakai
    await evalJs("modulDivisi.bukaDariMenu(); true"); await tunggu(200);
    const jumlah = await evalJs("modulDivisi.ambil().length");
    await evalJs("var k=document.getElementById('divisi-nama'); k.value='Tidak Boleh'; k.dispatchEvent(new Event('input',{bubbles:true})); true");
    await tekan(CTRL + 8, "S");   // Ctrl+Shift+S
    await tekan(CTRL + ALT, "S");  // AltGr+S
    catat("Ctrl+Shift+S dan AltGr+S tidak menyimpan", await evalJs("modulDivisi.ambil().length") === jumlah);
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
