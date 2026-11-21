// Lingkaran akun di kanan atas memakai logo yayasan dari Preferensi (J.34, Temuan 54, PRD 6.15), di Chrome asli:
// tanpa logo = inisial; dengan logo = gambar; isi rusak diabaikan; menyimpan Preferensi langsung mengganti lingkaran.
// Pemakaian: node uji-chrome-avatar.js <chrome.exe> <index.html> <folder-profil> <folder-png>
const { spawn } = require("child_process");
const fs = require("fs"), path = require("path");
const [chromeExe, halaman, folderProfil, folderPng] = process.argv.slice(2);
const PORT = 9417;
const tunggu = (ms) => new Promise(r => setTimeout(r, ms));
const siapUji = require("./bantu-siap.js");
let id = 0; const menunggu = new Map(); let ws;
const kirim = (m, p = {}) => new Promise((s, g) => { const n = ++id; menunggu.set(n, { s, g }); ws.send(JSON.stringify({ id: n, method: m, params: p })); });
const evalJs = async (e) => { const r = await kirim("Runtime.evaluate", { expression: e, returnByValue: true }); if (r.exceptionDetails) throw new Error(JSON.stringify(r.exceptionDetails.exception.description) + " <<< " + e.slice(0, 160)); return r.result.value; };
const hasil = []; const catat = (n, ok, r = "") => { hasil.push(!!ok); console.log((ok ? "LOLOS  " : "GAGAL  ") + n + (r ? " -> " + r : "")); };
const foto = async (nama) => { const r = await kirim("Page.captureScreenshot", { format: "png", clip: { x: 1180, y: 0, width: 186, height: 60, scale: 2 } }); fs.writeFileSync(path.join(folderPng, nama), Buffer.from(r.data, "base64")); };
const muatUlang = async () => { await kirim("Page.reload"); await siapUji(evalJs, tunggu); };
// Gambar PNG rekaan 2x2 piksel (bukan logo asli)
const PNG = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAIAAAACCAIAAAD91JpzAAAAFklEQVR4nGP8z8DAwMDAxMDAwMDAAAANHQEDasKb6QAAAABJRU5ErkJggg==";
const keadaan = () => evalJs("JSON.stringify({teks: document.getElementById('tombol-pengguna').textContent, gambar: !!document.querySelector('#tombol-pengguna img'), kelas: document.getElementById('tombol-pengguna').classList.contains('avatar-logo'), title: document.getElementById('tombol-pengguna').title})").then(JSON.parse);

(async () => {
  fs.mkdirSync(folderPng, { recursive: true });
  const chrome = spawn(chromeExe, ["--headless=new", "--disable-gpu", "--no-first-run", "--remote-debugging-port=" + PORT, "--user-data-dir=" + folderProfil, "--window-size=1366,800", "file:///" + halaman.replace(/\\/g, "/")], { stdio: "ignore" });
  try {
    let t = null;
    for (let i = 0; i < 60 && !t; i++) { await tunggu(250); try { t = (await (await fetch("http://127.0.0.1:" + PORT + "/json/list")).json()).find(x => x.type === "page" && x.url.startsWith("file:")); } catch (e) { /* belum siap */ } }
    ws = new WebSocket(t.webSocketDebuggerUrl); await new Promise((s, g) => { ws.onopen = s; ws.onerror = g; });
    const galat = [];
    ws.onmessage = (m) => { const d = JSON.parse(m.data); if (d.method === "Runtime.exceptionThrown") galat.push(d.params.exceptionDetails.exception.description); if (d.id && menunggu.has(d.id)) { const p = menunggu.get(d.id); menunggu.delete(d.id); d.error ? p.g(new Error(JSON.stringify(d.error))) : p.s(d.result); } };
    await kirim("Runtime.enable"); await kirim("Page.enable");
    await kirim("Emulation.setDeviceMetricsOverride", { width: 1366, height: 800, deviceScaleFactor: 1, mobile: false });
    await require("./bantu-sesi.js").masukChrome(kirim, "file:///" + halaman.replace(/\\/g, "/"));
    await evalJs("localStorage.clear(); true"); await muatUlang();

    // 1) Tanpa logo: inisial nama pengguna ("Pengguna" -> "P")
    let k = await keadaan();
    catat("Tanpa logo di Preferensi: lingkaran berisi inisial, tanpa gambar", !k.gambar && !k.kelas && k.teks.length >= 1 && k.title === "Pengguna", JSON.stringify(k));
    await foto("avatar-inisial.png");

    // 2) Logo tersimpan di Preferensi: lingkaran berisi gambar logo
    await evalJs("localStorage.setItem('dataYayasan', JSON.stringify({ nama: 'Yayasan Uji', logo: '" + PNG + "' })); true"); await muatUlang();
    k = await keadaan();
    catat("Dengan logo: lingkaran berisi gambar logo (bukan inisial), nama tetap di title", k.gambar && k.kelas && k.teks === "" && k.title === "Pengguna", JSON.stringify(k));
    catat("Gambar logo benar-benar termuat", await evalJs("(function(){var g=document.querySelector('#tombol-pengguna img'); return g.complete && g.naturalWidth===2;})()"));
    await foto("avatar-logo.png");
    catat("Menu pengguna tetap terbuka saat lingkaran logo diklik", await evalJs("document.getElementById('tombol-pengguna').click(); !document.getElementById('daftar-menu-pengguna').hidden"));

    // 3) Isi rusak (bukan data gambar) diabaikan: kembali ke inisial
    await evalJs("localStorage.setItem('dataYayasan', JSON.stringify({ nama: 'Yayasan Uji', logo: 'javascript:alert(1)' })); true"); await muatUlang();
    k = await keadaan();
    catat("Logo rusak/bukan gambar diabaikan: inisial", !k.gambar && !k.kelas && k.teks.length >= 1, JSON.stringify(k));

    // 4) Menyimpan Data di Preferensi langsung mengganti lingkaran (tanpa muat ulang)
    await evalJs("bukaTab('preferensi'); logoTersimpan='" + PNG + "'; document.getElementById('form-yayasan').requestSubmit(); true"); await tunggu(300);
    k = await keadaan();
    catat("Sesudah Simpan di Preferensi: lingkaran langsung memakai logo", k.gambar && k.kelas, JSON.stringify(k));
    await evalJs("logoTersimpan=''; document.getElementById('form-yayasan').requestSubmit(); true"); await tunggu(300);
    k = await keadaan();
    catat("Logo dihapus lalu disimpan: lingkaran kembali ke inisial", !k.gambar && k.teks.length >= 1, JSON.stringify(k));

    catat("Tidak ada galat skrip", galat.length === 0, galat.join(" | "));
  } catch (e) { console.log("GALAT: " + e.stack); hasil.push(false); }
  try { ws.close(); } catch (e) { /* abaikan */ } chrome.kill();
  console.log("Lolos " + hasil.filter(Boolean).length + " dari " + hasil.length); process.exit(hasil.every(Boolean) ? 0 : 1);
})();
