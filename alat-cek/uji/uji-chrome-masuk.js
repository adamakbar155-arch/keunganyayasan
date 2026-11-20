// Uji J.25, J.26, J.29: Masuk, Keluar, keluar otomatis 40 menit, wajib ganti kata sandi, Jenis Akses Administrator/Operator,
// pemindahan peran lama, dan kode pemulihan (PRD 6.12, 6.14)
// di Chrome asli (tanpa jendela, headless). Uji ini SENGAJA tidak memakai alat bantu bantu-sesi.js: semuanya lewat layar Masuk.
// Data rekaan; kata sandi uji hanya contoh.
// Pemakaian: node uji-chrome-masuk.js <chrome.exe> <index.html> <folder-profil> <folder-png>
const { spawn } = require("child_process");
const fs = require("fs"), path = require("path");
const [chromeExe, halaman, folderProfil, folderPng] = process.argv.slice(2);
const PORT = 9404;
const tunggu = (ms) => new Promise(r => setTimeout(r, ms));
let id = 0; const menunggu = new Map(); let ws;
const kirim = (m, p = {}) => new Promise((s, g) => { const n = ++id; menunggu.set(n, { s, g }); ws.send(JSON.stringify({ id: n, method: m, params: p })); });
const evalJs = async (e) => { const r = await kirim("Runtime.evaluate", { expression: e, returnByValue: true, awaitPromise: true }); if (r.exceptionDetails) throw new Error(JSON.stringify(r.exceptionDetails.exception ? r.exceptionDetails.exception.description : r.exceptionDetails.text) + " <<< " + e.slice(0, 120)); return r.result.value; };
const hasil = []; const catat = (n, ok, r = "") => { hasil.push(ok); console.log((ok ? "LOLOS  " : "GAGAL  ") + n + (r && !ok ? " -> " + r : "")); };
const foto = async (nama) => { const r = await kirim("Page.captureScreenshot", { format: "png" }); fs.writeFileSync(path.join(folderPng, nama), Buffer.from(r.data, "base64")); };
const INDEX = "file:///" + halaman.replace(/\\/g, "/");
const LOGIN = INDEX.replace(/index\.html$/, "login.html");
// Menunggu sampai halaman tertentu selesai dimuat (alamat cocok dan dokumen lengkap)
const tungguHalaman = async (pola) => {
  for (let i = 0; i < 80; i++) {
    try { if (await evalJs("document.readyState==='complete' && " + pola.toString() + ".test(location.pathname)")) { await tunggu(300); return true; } } catch (e) { /* sedang pindah */ }
    await tunggu(150);
  }
  return false;
};
const buka = async (url) => { await kirim("Page.navigate", { url }); await tunggu(300); };
const isi = (nilai) => evalJs("(function(){var n=" + JSON.stringify(nilai) + "; Object.keys(n).forEach(function(k){document.getElementById(k).value=n[k];}); return true;})()");
const kirimForm = (idForm) => evalJs("document.getElementById(" + JSON.stringify(idForm) + ").requestSubmit(); true");
const pesan = (idKotak) => evalJs("document.getElementById(" + JSON.stringify(idKotak) + ").hidden ? '' : document.getElementById(" + JSON.stringify(idKotak) + ").textContent");
// Menunggu sampai layar Masuk selesai memeriksa kata sandi (variabel sedangMemeriksa di login.js), paling lama 10 detik.
// Kalau halaman sudah pindah (masuk berhasil), langsung selesai.
const tungguPeriksa = async () => {
  await tunggu(100);
  for (let i = 0; i < 100; i++) {
    try { if (!(await evalJs("typeof sedangMemeriksa !== 'undefined' && sedangMemeriksa"))) { await tunggu(100); return; } } catch (e) { /* sedang pindah halaman */ }
    await tunggu(100);
  }
};
// Sama untuk Ganti Kata Sandi di dalam aplikasi (variabel sedangGantiSandi di umum/sesi-aplikasi.js)
const tungguGantiSandi = async () => {
  await tunggu(100);
  for (let i = 0; i < 100; i++) { if (!(await evalJs("sedangGantiSandi"))) { await tunggu(100); return; } await tunggu(100); }
};
const masuk = async (nama, sandi) => { await isi({ username: nama, password: sandi }); await kirimForm("form-login"); };

(async () => {
  fs.mkdirSync(folderPng, { recursive: true });
  const galat = [];
  const chrome = spawn(chromeExe, ["--headless=new", "--disable-gpu", "--no-first-run", "--remote-debugging-port=" + PORT, "--user-data-dir=" + folderProfil, "--window-size=1366,900", INDEX], { stdio: "ignore" });
  try {
    let t = null;
    for (let i = 0; i < 60 && !t; i++) { await tunggu(250); try { t = (await (await fetch("http://127.0.0.1:" + PORT + "/json/list")).json()).find(x => x.type === "page" && x.url.startsWith("file:")); } catch (e) { /* belum siap */ } }
    ws = new WebSocket(t.webSocketDebuggerUrl); await new Promise((s, g) => { ws.onopen = s; ws.onerror = g; });
    ws.onmessage = (m) => { const d = JSON.parse(m.data); if (d.method === "Runtime.exceptionThrown") { const x = d.params.exceptionDetails; galat.push(x.exception ? x.exception.description : x.text); } if (d.method === "Runtime.consoleAPICalled" && ["error", "warning"].includes(d.params.type)) galat.push(d.params.args.map(a => a.value).join(" ")); if (d.id && menunggu.has(d.id)) { const p = menunggu.get(d.id); menunggu.delete(d.id); d.error ? p.g(new Error(JSON.stringify(d.error))) : p.s(d.result); } };
    await kirim("Runtime.enable"); await kirim("Page.enable");
    await kirim("Emulation.setDeviceMetricsOverride", { width: 1366, height: 900, deviceScaleFactor: 1, mobile: false });
    await tunggu(800);
    await evalJs("localStorage.clear(); sessionStorage.clear(); true");

    // ---- 1. Pertama kali: akun Administrator pertama + kode pemulihan ----
    await buka(INDEX);
    catat("Belum masuk: index.html langsung pindah ke layar Masuk", await tungguHalaman(/login\.html$/));
    catat("Belum ada pengguna: layar 'Buat akun pertama' tampil", await evalJs("!document.getElementById('layar-akun-pertama').hidden && document.getElementById('layar-masuk').hidden"));
    await foto("masuk-akun-pertama.png");
    await isi({ "ap-nama": "Siti Aminah", "ap-username": "siti", "ap-sandi": "pendek", "ap-ulang": "pendek" }); await kirimForm("form-akun-pertama"); await tunggu(150);
    catat("Kata sandi kurang dari 8 karakter ditolak", /minimal 8/.test(await pesan("pesan-error-akun")), await pesan("pesan-error-akun"));
    await isi({ "ap-sandi": "rahasia-123", "ap-ulang": "rahasia-124" }); await kirimForm("form-akun-pertama"); await tunggu(150);
    catat("Ulangi kata sandi berbeda ditolak", /tepat sama/.test(await pesan("pesan-error-akun")));
    await isi({ "ap-ulang": "rahasia-123" }); await kirimForm("form-akun-pertama"); await tungguPeriksa();
    const kodeAwal = await evalJs("document.getElementById('layar-kode-pemulihan').hidden ? '' : document.getElementById('kode-pemulihan-baru').textContent");
    catat("Akun pertama dibuat: kode pemulihan ditampilkan sekali (XXXX-XXXX-XXXX-XXXX) sebelum masuk", /^[A-HJ-NP-Z2-9]{4}(-[A-HJ-NP-Z2-9]{4}){3}$/.test(kodeAwal) && (await evalJs("location.pathname")).endsWith("login.html"), kodeAwal);
    await foto("masuk-kode-pemulihan.png");
    const akun = JSON.parse(await evalJs("localStorage.getItem('daftarPengguna')"));
    catat("Akun tersimpan sebagai Administrator; kata sandi dan kode pemulihan teracak (tidak tersimpan apa adanya)", akun.length === 1 && akun[0].jenisAkses === "administrator" && !("peran" in akun[0]) && akun[0].sandi.hash.length === 64 && akun[0].kodePemulihan.hash.length === 64 && !JSON.stringify(akun).includes("rahasia-123") && !JSON.stringify(akun).includes(kodeAwal.replace(/-/g, "")));
    await evalJs("document.getElementById('lanjut-sesudah-kode').click(); true");
    catat("Klik 'Sudah saya catat': masuk ke aplikasi", await tungguHalaman(/index\.html$/));
    catat("Inisial di kanan atas 'SA'; Log Aktivitas mencatat Masuk atas nama Siti Aminah", await evalJs("document.getElementById('tombol-pengguna').textContent==='SA' && JSON.parse(localStorage.getItem('logAktivitas')).some(function(l){return l.tindakan==='Masuk' && l.pengguna==='Siti Aminah';})"));
    await evalJs("document.getElementById('tombol-pengguna').click(); true"); await tunggu(150);
    catat("Menu pengguna: nama, Administrator, Ganti Kata Sandi, Buat Kode Pemulihan, Keluar", await evalJs("!document.getElementById('daftar-menu-pengguna').hidden && document.getElementById('menu-pengguna-nama').textContent==='Siti Aminah' && document.getElementById('menu-pengguna-peran').textContent==='Administrator' && !document.getElementById('menu-kode-pemulihan').hidden"));
    await foto("masuk-menu-pengguna.png");

    // ---- 2. Keluar dan Masuk ----
    await evalJs("document.getElementById('menu-keluar').click(); true");
    catat("Keluar: kembali ke layar Masuk dengan pesan 'Anda sudah keluar.'", await tungguHalaman(/login\.html$/) && await pesan("pesan-info") === "Anda sudah keluar.");
    await buka(INDEX);
    catat("Sesudah keluar, membuka index.html langsung kembali ke layar Masuk", await tungguHalaman(/login\.html$/));
    await masuk("siti", "salah-sekali"); await tungguPeriksa();
    catat("Kata sandi salah: 'Nama pengguna atau kata sandi salah.'", await pesan("pesan-error") === "Nama pengguna atau kata sandi salah.", await pesan("pesan-error"));
    await masuk("tidak-ada", "rahasia-123"); await tungguPeriksa();
    catat("Nama tidak terdaftar: pesan yang sama (tidak membocorkan nama mana yang ada)", await pesan("pesan-error") === "Nama pengguna atau kata sandi salah.");
    await masuk("SITI", "rahasia-123");
    catat("Masuk berhasil (nama pengguna tidak membedakan huruf besar/kecil)", await tungguHalaman(/index\.html$/));
    await foto("masuk-aplikasi.png");

    // ---- 3. Tambah pengguna lewat data dengan PERAN LAMA (sebelum J.29): wajib ganti sandi, Non Aktif, Pengawas, Finance Sekolah ----
    await evalJs(`(async function(){ var d=JSON.parse(localStorage.getItem('daftarPengguna'));
      var s=await acakKataSandi('awal-1234');
      d.push({id:'u2', nama:'Budi Pengawas', username:'budi', peran:'pengawas', nonAktif:false, sandi:s, wajibGantiSandi:true});
      d.push({id:'u3', nama:'Rina', username:'rina', peran:'finance-sekolah', nonAktif:false, sandi:s, wajibGantiSandi:false});
      d.push({id:'u4', nama:'Lama', username:'lama', peran:'finance-yayasan', nonAktif:true, sandi:s, wajibGantiSandi:false});
      localStorage.setItem('daftarPengguna', JSON.stringify(d)); return true; })()`);
    // Pengaman akun sendiri
    await evalJs("bukaTab('pengguna'); modulPengguna.hapus(modulPengguna.ambil()[0]); true"); await tunggu(150);
    catat("Akun yang sedang dipakai tidak bisa dihapus", /sedang Anda pakai tidak bisa dihapus/.test(await evalJs("document.getElementById('area-notifikasi').textContent")) && !(await evalJs("document.getElementById('dialog-konfirmasi').open")));
    await evalJs("modulPengguna.bukaUbah(modulPengguna.ambil()[0]); document.getElementById('pg-nonaktif').checked=true; document.getElementById('form-pengguna').requestSubmit(); true"); await tunggu(300);
    catat("Akun yang sedang dipakai tidak bisa dijadikan Non Aktif", /tidak bisa dijadikan Non Aktif/.test(await evalJs("document.getElementById('area-notifikasi').textContent")) && !JSON.parse(await evalJs("localStorage.getItem('daftarPengguna')"))[0].nonAktif);
    await evalJs("document.getElementById('area-notifikasi').textContent=''; modulPengguna.bukaUbah(modulPengguna.ambil()[0]); document.getElementById('pg-nonaktif').checked=false; document.getElementById('pg-jenis-operator').click(); document.getElementById('form-pengguna').requestSubmit(); true"); await tunggu(300);
    catat("Akun yang sedang dipakai tidak bisa diturunkan menjadi Operator", /tidak bisa diturunkan menjadi Operator/.test(await evalJs("document.getElementById('area-notifikasi').textContent")) && JSON.parse(await evalJs("localStorage.getItem('daftarPengguna')"))[0].jenisAkses === "administrator");
    await evalJs("modulPengguna.bukaDariMenu(); true"); await tunggu(200);
    catat("Data Baru: Jenis Akses Operator terpilih, dengan keterangan Akses Grup", await evalJs("document.getElementById('pg-jenis-operator').checked && /Akses Grup/.test(document.getElementById('petunjuk-pg-jenis-akses').textContent) && !document.getElementById('pg-peran')"));
    await foto("masuk-pengguna-jenis-akses.png");
    await evalJs("document.getElementById('menu-keluar').click(); true"); await tungguHalaman(/login\.html$/);

    await masuk("lama", "awal-1234"); await tungguPeriksa();
    catat("Akun Non Aktif ditolak", /Non Aktif/.test(await pesan("pesan-error")), await pesan("pesan-error"));
    await masuk("budi", "awal-1234"); await tungguPeriksa();
    catat("Kata sandi baru dibuat/diatur ulang: wajib ganti dulu sebelum masuk", await evalJs("!document.getElementById('layar-ganti-sandi').hidden") && (await evalJs("location.pathname")).endsWith("login.html"));
    await isi({ "gs-baru": "awal-1234", "gs-ulang": "awal-1234" }); await kirimForm("form-ganti-sandi"); await tungguPeriksa();
    catat("Kata sandi baru tidak boleh sama dengan yang lama", /tidak boleh sama/.test(await pesan("pesan-error-ganti")));
    await isi({ "gs-baru": "baru-budi-99", "gs-ulang": "baru-budi-99" }); await kirimForm("form-ganti-sandi");
    catat("Sesudah ganti kata sandi langsung masuk", await tungguHalaman(/index\.html$/));
    const pindah = JSON.parse(await evalJs("localStorage.getItem('daftarPengguna')"));
    catat("Peran lama dipindahkan: Pengawas dan Finance Sekolah jadi Operator, Finance Yayasan jadi Administrator, isian peran dibuang",
      pindah.find(p => p.id === "u2").jenisAkses === "operator" && pindah.find(p => p.id === "u3").jenisAkses === "operator" && pindah.find(p => p.id === "u4").jenisAkses === "administrator" && pindah.every(p => !("peran" in p)), JSON.stringify(pindah.map(p => [p.id, p.jenisAkses, p.peran])));
    catat("Pemindahan dicatat di Log Aktivitas", await evalJs("JSON.parse(localStorage.getItem('logAktivitas')).some(function(l){return /Peran lama diganti Jenis Akses \\(3 pengguna\\)/.test(l.referensi);})"));

    // ---- 4. Operator (dulu Pengawas): hanya melihat, sampai hak Akses Grup berlaku (J.31) ----
    const pengawas = JSON.parse(await evalJs(`JSON.stringify({kelas: document.body.classList.contains('hanya-lihat'),
      simpanTerlihat: [...document.querySelectorAll('.tombol-simpan-besar')].some(function(b){return b.getClientRects().length>0;}),
      kotakPengguna: (function(){ var k=document.querySelector('.kotak-menu[data-halaman="Pengguna"]'); return getComputedStyle(k).display; })(),
      simpan: modulDivisi.simpan([{id:'x',nama:'Coba'}]), divisi: localStorage.getItem('daftarDivisi')})`).catch(() => "{}"));
    catat("Operator: kelas hanya-lihat, tombol Simpan tidak terlihat, penyimpanan ditolak (pengaman kedua)", pengawas.kelas && !pengawas.simpanTerlihat && pengawas.simpan === false && pengawas.divisi === null, JSON.stringify(pengawas));
    catat("Operator: kotak Pengguna tidak tampil di Pengaturan; menu tanpa Buat Kode Pemulihan", pengawas.kotakPengguna === "none" && await evalJs("document.getElementById('menu-kode-pemulihan').hidden && document.getElementById('menu-pengguna-peran').textContent==='Operator'"), pengawas.kotakPengguna);
    await evalJs("document.getElementById('area-notifikasi').textContent=''; bukaTab('preferensi'); true"); await tunggu(150);
    catat("Operator membuka Preferensi lewat kode: ditolak 'hanya untuk Administrator'", /hanya untuk Administrator/.test(await evalJs("document.getElementById('area-notifikasi').textContent")) && await evalJs("document.getElementById('isi-preferensi').hidden"));
    await evalJs("modulDivisi.bukaDariMenu(); true"); await tunggu(200);
    await foto("masuk-pengawas.png");
    // Ganti Kata Sandi sendiri tetap boleh untuk Operator
    await evalJs("document.getElementById('tombol-pengguna').click(); document.getElementById('menu-ganti-sandi').click(); true"); await tunggu(150);
    await isi({ "gsa-lama": "salah-salah", "gsa-baru": "budi-baru-77", "gsa-ulang": "budi-baru-77" }); await kirimForm("form-ganti-sandi-app"); await tungguGantiSandi();
    catat("Ganti Kata Sandi: kata sandi sekarang salah ditolak", /salah/.test(await evalJs("document.getElementById('galat-ganti-sandi').textContent")));
    await isi({ "gsa-lama": "baru-budi-99" }); await kirimForm("form-ganti-sandi-app"); await tungguGantiSandi();
    catat("Ganti Kata Sandi berhasil (juga untuk Operator)", await evalJs("!document.getElementById('dialog-ganti-sandi').open && /diganti/.test(document.getElementById('area-notifikasi').textContent)"));

    // ---- 5. Keluar otomatis 40 menit ----
    await evalJs("var s=JSON.parse(sessionStorage.getItem('sesiMasuk')); s.terakhirAktif=Date.now()-41*60*1000; sessionStorage.setItem('sesiMasuk', JSON.stringify(s)); document.dispatchEvent(new MouseEvent('mousemove')); true");
    catat("Komputer 'tidur' 41 menit lalu mouse digerakkan: langsung keluar, tidak diperpanjang", await tungguHalaman(/login\.html$/) && await pesan("pesan-info") === "Anda keluar otomatis karena tidak ada aktivitas selama 40 menit.", await pesan("pesan-info"));
    catat("Keluar otomatis tercatat di Log Aktivitas", await evalJs("JSON.parse(localStorage.getItem('logAktivitas')).some(function(l){return l.tindakan==='Keluar' && /40 menit/.test(l.referensi) && l.pengguna==='Budi Pengawas';})"));
    await foto("masuk-keluar-otomatis.png");
    catat("Tombol mata: hanya satu ikon yang tampil, dan bertukar saat diklik", await evalJs("(function(){var a=document.getElementById('ikon-mata'), b=document.getElementById('ikon-mata-coret'); var awal=a.getBoundingClientRect().width>0 && b.getBoundingClientRect().width===0; document.getElementById('tombol-lihat').click(); var sesudah=a.getBoundingClientRect().width===0 && b.getBoundingClientRect().width>0 && document.getElementById('password').type==='text'; document.getElementById('tombol-lihat').click(); return awal && sesudah;})()"), await evalJs("JSON.stringify([document.getElementById('ikon-mata').getBoundingClientRect().width, document.getElementById('ikon-mata-coret').getBoundingClientRect().width, getComputedStyle(document.getElementById('ikon-mata-coret')).display, document.getElementById('layar-masuk').hidden])"));
    await masuk("budi", "budi-baru-77");
    catat("Masuk dengan kata sandi yang baru diganti", await tungguHalaman(/index\.html$/));
    await evalJs("var s=JSON.parse(sessionStorage.getItem('sesiMasuk')); s.terakhirAktif=Date.now()-40*60*1000-1000; sessionStorage.setItem('sesiMasuk', JSON.stringify(s)); periksaSesiBerkala(); true").catch(() => true);
    catat("Pemeriksa berkala: lewat 40 menit tanpa aktivitas = keluar", await tungguHalaman(/login\.html$/));
    await masuk("budi", "budi-baru-77"); await tungguHalaman(/index\.html$/);
    await evalJs("var s=JSON.parse(sessionStorage.getItem('sesiMasuk')); s.terakhirAktif=Date.now()-39*60*1000; sessionStorage.setItem('sesiMasuk', JSON.stringify(s)); periksaSesiBerkala(); true");
    await tunggu(500);
    catat("39 menit tanpa aktivitas: masih masuk", (await evalJs("location.pathname")).endsWith("index.html"));
    await evalJs("var s=JSON.parse(sessionStorage.getItem('sesiMasuk')); s.terakhirAktif=Date.now()-41*60*1000; sessionStorage.setItem('sesiMasuk', JSON.stringify(s)); true");
    await buka(INDEX);
    catat("Membuka ulang aplikasi dengan sesi yang sudah lewat 40 menit: ke layar Masuk", await tungguHalaman(/login\.html$/));

    // ---- 6. Akun lama Finance Sekolah, sekarang Operator: tetap bisa masuk, hanya melihat ----
    await masuk("rina", "awal-1234");
    await tungguHalaman(/index\.html$/);
    const sekolah = JSON.parse(await evalJs("JSON.stringify({pilihan: !!document.querySelector('.pembukuan'), lihat: document.body.classList.contains('hanya-lihat'), kelas: document.body.classList.contains('bukan-administrator'), peran: document.getElementById('menu-pengguna-peran').textContent})"));
    catat("Akun lama Finance Sekolah: Operator, hanya melihat, menu Pengguna/Preferensi/Cadangan tersembunyi", !sekolah.pilihan && sekolah.lihat && sekolah.kelas && sekolah.peran === "Operator", JSON.stringify(sekolah));
    await evalJs("document.getElementById('menu-keluar').click(); true"); await tungguHalaman(/login\.html$/);

    // ---- 6b. Lupa kata sandi dengan kode pemulihan (khusus Administrator) ----
    await evalJs("document.getElementById('lupa-sandi').click(); true"); await tunggu(150);
    catat("Lupa kata sandi?: layar pemulihan tampil", await evalJs("!document.getElementById('layar-lupa-sandi').hidden && document.getElementById('layar-masuk').hidden"));
    await foto("masuk-lupa-sandi.png");
    const pulih = async (nama, kode, sandi) => { await isi({ "ls-username": nama, "ls-kode": kode, "ls-baru": sandi, "ls-ulang": sandi }); await kirimForm("form-lupa-sandi"); await tungguPeriksa(); };
    await pulih("siti", "AAAA-BBBB-CCCC-DDDD", "siti-baru-123");
    catat("Kode salah: 'Nama pengguna atau kode pemulihan salah.'", await pesan("pesan-error-lupa") === "Nama pengguna atau kode pemulihan salah.", await pesan("pesan-error-lupa"));
    await pulih("rina", kodeAwal, "rina-baru-123");
    catat("Operator (tanpa kode): pesan yang sama, tidak bisa memakai pemulihan", await pesan("pesan-error-lupa") === "Nama pengguna atau kode pemulihan salah.");
    await pulih("SITI", kodeAwal.toLowerCase().replace(/-/g, " "), "siti-baru-123");
    const kodeKedua = await evalJs("document.getElementById('layar-kode-pemulihan').hidden ? '' : document.getElementById('kode-pemulihan-baru').textContent");
    catat("Kode benar (huruf kecil/spasi boleh): kata sandi baru disimpan, kode BARU ditampilkan (kode lama tidak berlaku)", /^[A-HJ-NP-Z2-9]{4}(-[A-HJ-NP-Z2-9]{4}){3}$/.test(kodeKedua) && kodeKedua !== kodeAwal, kodeKedua);
    await evalJs("document.getElementById('lanjut-sesudah-kode').click(); true");
    catat("Lanjut: masuk ke aplikasi; Log Aktivitas mencatat atur ulang dengan kode pemulihan", await tungguHalaman(/index\.html$/) && await evalJs("JSON.parse(localStorage.getItem('logAktivitas')).some(function(l){return /kode pemulihan/.test(l.referensi) && l.pengguna==='Siti Aminah';})"));
    // Buat Kode Pemulihan dari menu pengguna
    await evalJs("document.getElementById('tombol-pengguna').click(); document.getElementById('menu-kode-pemulihan').click(); true"); await tunggu(150);
    await isi({ "kp-sandi": "salah-salah" }); await kirimForm("form-kode-pemulihan"); await tungguGantiSandi().catch(() => true);
    for (let i = 0; i < 60 && await evalJs("sedangBuatKode"); i++) { await tunggu(100); }
    catat("Buat Kode Pemulihan: kata sandi salah ditolak", /salah/.test(await evalJs("document.getElementById('galat-kode-pemulihan').textContent")) && await evalJs("document.getElementById('kp-langkah-kode').hidden"));
    const hashSebelum = await evalJs("JSON.parse(localStorage.getItem('daftarPengguna'))[0].kodePemulihan.hash");
    await isi({ "kp-sandi": "siti-baru-123" }); await kirimForm("form-kode-pemulihan");
    await tunggu(100); for (let i = 0; i < 100 && await evalJs("sedangBuatKode"); i++) { await tunggu(100); }
    const kodeKetiga = await evalJs("document.getElementById('kp-kode').textContent");
    catat("Buat Kode Pemulihan: kode baru tampil, simpanan berganti", /^[A-HJ-NP-Z2-9]{4}(-[A-HJ-NP-Z2-9]{4}){3}$/.test(kodeKetiga) && hashSebelum !== await evalJs("JSON.parse(localStorage.getItem('daftarPengguna'))[0].kodePemulihan.hash"), kodeKetiga);
    await foto("masuk-buat-kode-pemulihan.png");
    catat("Saat kode tampil hanya ada tombol 'Sudah Saya Catat'; tombol itu menutup dan menghapus kode dari halaman", await evalJs("document.getElementById('batal-kode-pemulihan').hidden && document.getElementById('buat-kode-pemulihan').hidden && document.getElementById('tutup-kode-pemulihan').hidden") && await evalJs("document.getElementById('selesai-kode-pemulihan').click(); !document.getElementById('dialog-kode-pemulihan').open && document.getElementById('kp-kode').textContent===''"));
    await evalJs("document.getElementById('menu-keluar').click(); true"); await tungguHalaman(/login\.html$/);
    await evalJs("document.getElementById('lupa-sandi').click(); true"); await tunggu(150);
    await pulih("siti", kodeKedua, "siti-lagi-123");
    catat("Kode yang sudah diganti tidak berlaku lagi", await pesan("pesan-error-lupa") === "Nama pengguna atau kode pemulihan salah.");
    await evalJs("document.getElementById('kembali-masuk').click(); true"); await tunggu(150);

    // ---- 7. Lima kali salah: tunggu 1 menit ----
    for (let i = 0; i < 5; i++) { await masuk("siti", "salah-" + i); await tunggu(700); }
    catat("Lima kali salah: 'Terlalu banyak percobaan'", /Terlalu banyak percobaan/.test(await pesan("pesan-error")), await pesan("pesan-error"));
    await masuk("siti", "siti-baru-123"); await tunggu(400);
    catat("Selama ditahan, kata sandi benar pun belum bisa masuk", /Terlalu banyak percobaan/.test(await pesan("pesan-error")) && (await evalJs("location.pathname")).endsWith("login.html"));
    catat("Tidak ada galat skrip di Console", galat.filter(x => !/favicon/i.test(x)).length === 0, JSON.stringify(galat.slice(0, 3)));
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
