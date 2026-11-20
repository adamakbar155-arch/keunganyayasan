// Penerapan hak Akses Grup, langkah 3 (J.31, PRD 6.14): data menyimpan pembuatnya, Daftar mengikuti hak Lihat, data buatan
// pengguna lain tidak bisa dibuka tanpa Lihat, pembuat lama tetap saat data diubah, di Chrome asli.
// Pemakaian: node uji-chrome-hak-lihat.js <chrome.exe> <index.html> <folder-profil> <folder-png>
const { spawn } = require("child_process");
const fs = require("fs"), path = require("path");
const [chromeExe, halaman, folderProfil, folderPng] = process.argv.slice(2);
const PORT = 9413;
const tunggu = (ms) => new Promise(r => setTimeout(r, ms));
const siapUji = require("./bantu-siap.js");
let id = 0; const menunggu = new Map(); let ws;
const kirim = (m, p = {}) => new Promise((s, g) => { const n = ++id; menunggu.set(n, { s, g }); ws.send(JSON.stringify({ id: n, method: m, params: p })); });
const evalJs = async (e) => { const r = await kirim("Runtime.evaluate", { expression: e, returnByValue: true }); if (r.exceptionDetails) throw new Error(JSON.stringify(r.exceptionDetails.exception.description) + " <<< " + e.slice(0, 160)); return r.result.value; };
const hasil = []; const catat = (n, ok, r = "") => { hasil.push(!!ok); console.log((ok ? "LOLOS  " : "GAGAL  ") + n + (r ? " -> " + r : "")); };
const foto = async (nama) => { const r = await kirim("Page.captureScreenshot", { format: "png" }); fs.writeFileSync(path.join(folderPng, nama), Buffer.from(r.data, "base64")); };
const muatUlang = async () => { await kirim("Page.reload"); await siapUji(evalJs, tunggu); };
const pesanNotif = () => evalJs("[...document.querySelectorAll('.notifikasi p')].map(function(p){return p.textContent;}).join(' | ')");
const bersihkanNotif = () => evalJs("document.querySelectorAll('.notifikasi').forEach(function(n){n.remove();}); true");
const masukSebagai = (idPengguna) => evalJs("sessionStorage.setItem('sesiMasuk', JSON.stringify({ penggunaId: '" + idPengguna + "', nama: 'Uji', terakhirAktif: Date.now(), baruMasuk: false })); true");
const daftar = (kunci) => evalJs("localStorage.getItem('" + kunci + "')").then(t => JSON.parse(t || "[]"));
// Nama di baris tabel Daftar yang sedang tampil di satu halaman
const barisDaftar = (hal) => evalJs("JSON.stringify([...document.querySelectorAll('#isi-" + hal + " .tabel-daftar tbody tr')].map(function(tr){return tr.cells[0] ? tr.cells[0].textContent.trim() : '';}).filter(Boolean).sort())").then(JSON.parse);

(async () => {
  fs.mkdirSync(folderPng, { recursive: true });
  const chrome = spawn(chromeExe, ["--headless=new", "--disable-gpu", "--no-first-run", "--remote-debugging-port=" + PORT, "--user-data-dir=" + folderProfil, "--window-size=1366,900", "file:///" + halaman.replace(/\\/g, "/")], { stdio: "ignore" });
  try {
    let t = null;
    for (let i = 0; i < 60 && !t; i++) { await tunggu(250); try { t = (await (await fetch("http://127.0.0.1:" + PORT + "/json/list")).json()).find(x => x.type === "page" && x.url.startsWith("file:")); } catch (e) { /* belum siap */ } }
    ws = new WebSocket(t.webSocketDebuggerUrl); await new Promise((s, g) => { ws.onopen = s; ws.onerror = g; });
    const galat = [];
    ws.onmessage = (m) => { const d = JSON.parse(m.data); if (d.method === "Runtime.exceptionThrown") galat.push(d.params.exceptionDetails.exception.description); if (d.id && menunggu.has(d.id)) { const p = menunggu.get(d.id); menunggu.delete(d.id); d.error ? p.g(new Error(JSON.stringify(d.error))) : p.s(d.result); } };
    await kirim("Runtime.enable"); await kirim("Page.enable");
    await kirim("Emulation.setDeviceMetricsOverride", { width: 1366, height: 900, deviceScaleFactor: 1, mobile: false });
    await require("./bantu-sesi.js").masukChrome(kirim, "file:///" + halaman.replace(/\\/g, "/"));
    // Grup Staf: Divisi Buat + Ubah TANPA Lihat; Program Buat + Lihat. Data rekaan: satu Divisi tanpa pembuat (data lama),
    // satu buatan Administrator, satu Program tanpa pembuat.
    await evalJs(`localStorage.clear();
      localStorage.setItem("daftarAksesGrup", JSON.stringify([{ id: "ag-1", nama: "Staf", pembatasan: "preferensi", hak: {
        divisi: ["aktif", "buat", "ubah"], program: ["aktif", "buat", "lihat"] } }]));
      localStorage.setItem("daftarPengguna", JSON.stringify([
        { id: "u-staf", nama: "Staf Satu", username: "staf", kontak: "", jenisAkses: "operator", aksesGrupId: "ag-1", nonAktif: false, sandi: { garam: "00", hash: "00", iterasi: 1 } }
      ]));
      localStorage.setItem("daftarDivisi", JSON.stringify([
        { id: "d-lama", nama: "Divisi Lama", keterangan: "" },
        { id: "d-admin", nama: "Divisi Admin", keterangan: "", dibuatOlehId: "u-uji" }
      ]));
      localStorage.setItem("daftarProgram", JSON.stringify([{ id: "p-lama", nama: "Program Lama", divisiId: "d-lama", status: "aktif", keterangan: "" }]));
      true`);
    await muatUlang();

    // 1) Administrator: membuat data = pembuat tercatat; mengubah data yang disusun ulang (Kategori Donasi) = pembuat tetap
    await evalJs("bukaDivisiBaru(); document.getElementById('divisi-nama').value='Divisi Admin Dua'; document.getElementById('form-divisi').requestSubmit(); true"); await tunggu(250);
    catat("Data baru menyimpan pembuatnya (id pengguna yang masuk)", (await daftar("daftarDivisi")).find(d => d.nama === "Divisi Admin Dua").dibuatOlehId === "u-uji");
    await evalJs("bukaKategoriDonasiBaru(); document.getElementById('kd-nama').value='Infaq Lihat'; var s=document.getElementById('kd-induk'); s.value=[...s.options].find(function(o){return o.value;}).value; s.dispatchEvent(new Event('change',{bubbles:true})); document.getElementById('form-kategori-donasi').requestSubmit(); true"); await tunggu(300);
    await evalJs("modulKategoriDonasi.bukaUbah(modulKategoriDonasi.ambil()[0]); document.getElementById('kd-catatan').value='diubah'; document.getElementById('form-kategori-donasi').requestSubmit(); true"); await tunggu(300);
    const kd = (await daftar("daftarKategoriDonasi"))[0];
    catat("Data yang disusun ulang saat diubah (Kategori Donasi) tetap menyimpan pembuat lamanya", kd && kd.catatan === "diubah" && kd.dibuatOlehId === "u-uji", JSON.stringify(kd && { c: kd.catatan, p: kd.dibuatOlehId }));
    catat("Akun ikutan Kategori Donasi juga mencatat pembuat", (await daftar("daftarAkun")).some(a => a.nama === "Infaq Lihat" && a.dibuatOlehId === "u-uji"));

    // 2) Operator tanpa Lihat di Divisi: hanya data buatan sendiri
    await masukSebagai("u-staf"); await muatUlang();
    await evalJs("bukaDivisiBaru(); document.getElementById('divisi-nama').value='Divisi Saya'; document.getElementById('form-divisi').requestSubmit(); true"); await tunggu(250);
    catat("Operator: data baru tercatat atas namanya", (await daftar("daftarDivisi")).find(d => d.nama === "Divisi Saya").dibuatOlehId === "u-staf");
    await evalJs("document.querySelector('#isi-divisi .tombol-daftar').click(); true"); await tunggu(250);
    const bDivisi = await barisDaftar("divisi");
    catat("Daftar Divisi (tanpa Lihat): hanya Divisi Saya; data lama tanpa pembuat dan buatan Administrator tidak tampil", JSON.stringify(bDivisi) === JSON.stringify(["Divisi Saya"]), JSON.stringify(bDivisi));
    catat("Jumlah data di Daftar ikut tersaring (1)", await evalJs("document.querySelector('#isi-divisi [data-jumlah]').textContent.trim()==='1'"));
    await foto("hak-lihat-divisi.png");
    await bersihkanNotif();
    await evalJs("modulDivisi.bukaUbah(modulDivisi.ambil().find(function(d){return d.id==='d-admin';})); true"); await tunggu(200);
    catat("Membuka data buatan pengguna lain lewat kode (misalnya klik baris laporan) ditolak", (await pesanNotif()).indexOf("dibuat pengguna lain") !== -1 && !(await evalJs("modulDivisi.idDiubah==='d-admin'")));
    await evalJs("modulDivisi.bukaUbah(modulDivisi.ambil().find(function(d){return d.nama==='Divisi Saya';})); true"); await tunggu(200);
    await evalJs("document.getElementById('divisi-keterangan').value='punya saya'; document.getElementById('form-divisi').requestSubmit(); true"); await tunggu(250);
    const saya = (await daftar("daftarDivisi")).find(d => d.nama === "Divisi Saya");
    catat("Data sendiri tetap bisa dibuka dan diubah (hak Ubah), pembuat tetap", saya.keterangan === "punya saya" && saya.dibuatOlehId === "u-staf");
    catat("Pilihan Divisi di formulir Program tetap berisi semua Divisi", await evalJs("bukaProgramBaru(); [...document.getElementById('program-divisi').options].filter(function(o){return o.value;}).length===4"));

    // 3) Operator dengan Lihat di Program: semua data tampil
    await evalJs("document.querySelector('#isi-program .tombol-daftar').click(); true"); await tunggu(250);
    catat("Daftar Program (dengan Lihat): data lama tanpa pembuat tetap tampil", JSON.stringify(await barisDaftar("program")) === JSON.stringify(["Program Lama"]));

    // 4) Administrator melihat semua
    await masukSebagai("u-uji"); await muatUlang();
    await evalJs("bukaDivisiBaru(); document.querySelector('#isi-divisi .tombol-daftar').click(); true"); await tunggu(250);
    const bAdmin = await barisDaftar("divisi");
    catat("Administrator: semua Divisi tampil (4)", bAdmin.length === 4, JSON.stringify(bAdmin));

    catat("Tidak ada galat skrip", galat.length === 0, galat.join(" | "));
  } catch (e) { console.log("GALAT: " + e.stack); hasil.push(false); }
  try { ws.close(); } catch (e) { /* abaikan */ } chrome.kill();
  console.log("Lolos " + hasil.filter(Boolean).length + " dari " + hasil.length); process.exit(hasil.every(Boolean) ? 0 : 1);
})();
