// Uji Anggaran (PRD 6.5) di Chrome asli: buka dari popup Buku Besar, isi awal, Tipe dan Divisi/Program, pilih akun lewat kolom cari,
// popup nilai, ubah dan hapus baris, pemeriksaan Simpan, data kembar, daftar, ubah, hapus, tidak membuat jurnal, nama berkode HTML,
// data rusak, layar HP.
// Pemakaian: node uji-chrome-anggaran.js <chrome.exe> <index.html> <folder-profil> <folder-png>
const { spawn } = require("child_process");
const fs = require("fs"), path = require("path");
const [chromeExe, halaman, folderProfil, folderPng] = process.argv.slice(2);
const PORT = 9393;
const tunggu = (ms) => new Promise(r => setTimeout(r, ms));
const siapUji = require("./bantu-siap.js");   // tunggu sampai aplikasi siap sesudah muat ulang
let id = 0; const menunggu = new Map(); let ws;
const kirim = (m, p = {}) => new Promise((s, g) => { const n = ++id; menunggu.set(n, { s, g }); ws.send(JSON.stringify({ id: n, method: m, params: p })); });
const evalJs = async (e) => { const r = await kirim("Runtime.evaluate", { expression: e, returnByValue: true, awaitPromise: true }); if (r.exceptionDetails) throw new Error(JSON.stringify(r.exceptionDetails.exception ? r.exceptionDetails.exception.description : r.exceptionDetails.text) + " <<< " + e.slice(0, 120)); return r.result.value; };
const hasil = []; const catat = (n, ok, r = "") => { hasil.push(ok); console.log((ok ? "LOLOS  " : "GAGAL  ") + n + (r && !ok ? " -> " + r : "")); };
const foto = async (nama) => { const r = await kirim("Page.captureScreenshot", { format: "png" }); fs.writeFileSync(path.join(folderPng, nama), Buffer.from(r.data, "base64")); };
const klik = async (sel) => { const j = JSON.parse(await evalJs(`(function(){var e=document.querySelector(${JSON.stringify(sel)}); e.scrollIntoView({block:'center'}); var r=e.getBoundingClientRect(); return JSON.stringify({x:r.left+r.width/2,y:r.top+r.height/2});})()`)); await kirim("Input.dispatchMouseEvent", { type: "mouseMoved", x: j.x, y: j.y }); await kirim("Input.dispatchMouseEvent", { type: "mousePressed", x: j.x, y: j.y, button: "left", clickCount: 1 }); await kirim("Input.dispatchMouseEvent", { type: "mouseReleased", x: j.x, y: j.y, button: "left", clickCount: 1 }); };

const akun = (id, kode, nama, tipe, indukId, ekstra) => Object.assign({ id, kode, nama, tipe, indukId: indukId || "" }, ekstra || {});
const AKUN = [
  akun("k0", "1101", "Kas & Bank", "kas-bank"), akun("k1", "110101", "Kas Kecil", "kas-bank", "k0"),
  akun("p0", "4101", "Pendapatan", "pendapatan"), akun("p1", "410101", "Donasi <b>Makam</b>", "pendapatan", "p0"),
  akun("b0", "5101", "Beban", "beban"), akun("b1", "510101", "Beban Konsumsi", "beban", "b0"), akun("b2", "510102", "Beban Listrik", "beban", "b0"),
  akun("b3", "510103", "Beban Lama", "beban", "b0", { nonAktif: true })
];

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
    const muatUlang = async () => { await kirim("Page.reload"); await siapUji(evalJs, tunggu); for (let i = 0; i < 100; i++) { if (await evalJs("document.readyState==='complete' && typeof bukaAnggaranBaru==='function'")) { break; } await tunggu(200); } await tunggu(200); };
    await tunggu(800);
    await evalJs("localStorage.clear(); localStorage.setItem('daftarAkun', " + JSON.stringify(JSON.stringify(AKUN)) + "); localStorage.setItem('daftarDivisi', JSON.stringify([{id:'d1',nama:'Makam'}])); localStorage.setItem('daftarProgram', JSON.stringify([{id:'pr1',nama:'Beasiswa',divisiId:'d1',status:'aktif'}])); true");
    await muatUlang();
    const nilaiSel = (s) => evalJs("document.querySelector(" + JSON.stringify(s) + ").value");
    const barisTabel = () => evalJs("[...document.querySelectorAll('#ang-rincian tr')].map(function(x){return [...x.cells].slice(1,4).map(function(c){return c.textContent;}).join('|');})");
    const galatForm = () => evalJs("document.getElementById('ang-pesan-galat').hidden ? '' : document.getElementById('ang-pesan-galat').textContent");
    const pilihAkun = async (kata, nilai) => {
      await klik("#ang-cari-akun"); await tunggu(150);
      await kirim("Input.insertText", { text: kata }); await tunggu(200);
      await kirim("Input.dispatchKeyEvent", { type: "keyDown", key: "Enter", code: "Enter", windowsVirtualKeyCode: 13 }); await kirim("Input.dispatchKeyEvent", { type: "keyUp", key: "Enter", code: "Enter", windowsVirtualKeyCode: 13 }); await tunggu(250);
      await kirim("Input.insertText", { text: nilai }); await tunggu(120);
      await klik("#lanjut-rincian-anggaran"); await tunggu(300);
    };

    await klik("#tombol-buku-besar"); await tunggu(300);
    catat("Kotak Anggaran di popup Buku Besar berwarna oranye", await evalJs("document.querySelector('#panel-buku-besar .kotak-menu[data-halaman=\"Anggaran\"]').classList.contains('kotak-oranye')"));
    await klik('#panel-buku-besar .kotak-menu[data-halaman="Anggaran"]'); await tunggu(400);
    const bulanIni = await evalJs("String(Number(tanggalHariIni().slice(5,7)))"), tahunIni = await evalJs("tanggalHariIni().slice(0,4)");
    catat("Klik kotak Anggaran: tab terbuka, Data Baru kosong (PRD 5.3a): Bulan, Tahun, Tipe 'Silakan Pilih', kolom Divisi/Program tersembunyi", await evalJs("!document.getElementById('isi-anggaran').hidden") && await nilaiSel("#ang-bulan") === "" && await nilaiSel("#ang-tahun") === "" && await nilaiSel("#ang-tipe") === "" && await evalJs("document.getElementById('ang-kelompok').hidden"));
    catat("Pilihan Bulan 12 nama bulan, Tipe Umum / Per Divisi / Per Program", await evalJs("[...document.getElementById('ang-bulan').options].length===13 && document.getElementById('ang-bulan').options[1].textContent==='Januari' && [...document.getElementById('ang-tipe').options].slice(1).map(function(o){return o.textContent;}).join()==='Umum,Per Divisi,Per Program'"));
    catat("Tabel kosong: judul kolom selebar tabel, tidak ada kolom tanpa judul, Belum ada data di tengah", await evalJs("(function(){var t=document.querySelector('#isi-anggaran .jurnal-tabel'), h=t.tHead.rows[0], b=document.getElementById('ang-rincian').rows[0], jumlahSel=[...b.cells].reduce(function(n,c){return n+c.colSpan;},0), w=h.cells[h.cells.length-1].getBoundingClientRect().right, bungkus=document.querySelector('#isi-anggaran .jurnal-bungkus-tabel').getBoundingClientRect().right; return jumlahSel===h.cells.length && Math.abs(w-bungkus)<=2;})()"));
    await foto("anggaran-kosong.png");
    await klik("#ang-simpan"); await tunggu(200);
    catat("Simpan dengan Bulan kosong ditolak", /Bulan wajib dipilih/.test(await galatForm()), await galatForm());
    // Isi kepala seperti pengguna: Bulan dan Tahun sekarang, Tipe Umum
    await evalJs("(function(){[['ang-bulan','" + bulanIni + "'],['ang-tahun','" + tahunIni + "'],['ang-tipe','umum']].forEach(function(p){var s=document.getElementById(p[0]); s.value=p[1]; s.dispatchEvent(new Event('change',{bubbles:true}));}); return true;})()"); await tunggu(150);
    await klik("#ang-simpan"); await tunggu(200);
    catat("Simpan tanpa rincian ditolak", /minimal satu akun/.test(await galatForm()), await galatForm());
    await evalJs("(function(){var t=document.getElementById('ang-tipe'); t.value='divisi'; t.dispatchEvent(new Event('change',{bubbles:true})); return true;})()"); await tunggu(150);
    catat("Tipe Per Divisi: kolom pilihan Divisi muncul berisi Makam", await evalJs("!document.getElementById('ang-kelompok').hidden && [...document.getElementById('ang-kelompok').options].some(function(o){return o.textContent==='Makam';})"));

    await klik("#ang-cari-akun"); await tunggu(250);
    const ditawarkan = await evalJs("[...document.querySelectorAll('#ang-daftar-akun .jurnal-pilihan-nama')].map(function(l){return l.textContent;})");
    catat("Akun yang ditawarkan: pendapatan dan beban paling bawah; kas, induk, dan Non Aktif tidak; nama berkode HTML sebagai teks", JSON.stringify(ditawarkan) === JSON.stringify(["Donasi <b>Makam</b>", "Beban Konsumsi", "Beban Listrik"]) && await evalJs("!document.querySelector('#ang-daftar-akun b')"), JSON.stringify(ditawarkan));
    await kirim("Input.dispatchKeyEvent", { type: "keyDown", key: "Escape", code: "Escape", windowsVirtualKeyCode: 27 }); await kirim("Input.dispatchKeyEvent", { type: "keyUp", key: "Escape", code: "Escape", windowsVirtualKeyCode: 27 }); await tunggu(100);
    await pilihAkun("donasi", "10000000");
    catat("Pesan wajib diisi hilang setelah rincian ditambah", await galatForm() === "", await galatForm());
    await pilihAkun("konsumsi", "450000");
    const b1 = await barisTabel();
    catat("Pilih akun, isi popup, Lanjut: baris Beban/Pendapatan, Kode, Anggaran bertitik; Total dan jumlah rincian", JSON.stringify(b1) === JSON.stringify(["Donasi <b>Makam</b>|410101|10.000.000", "Beban Konsumsi|510101|450.000"]) && await evalJs("document.getElementById('ang-total').textContent==='Rp 10.450.000' && document.getElementById('ang-jumlah').textContent==='2 '"), JSON.stringify(b1));
    await foto("anggaran-form.png");
    await klik("#ang-cari-akun"); await tunggu(200);
    catat("Akun yang sudah dipakai tidak ditawarkan lagi", (await evalJs("document.getElementById('ang-daftar-akun').textContent")).indexOf("Konsumsi") === -1);
    await kirim("Input.dispatchKeyEvent", { type: "keyDown", key: "Escape", code: "Escape", windowsVirtualKeyCode: 27 }); await kirim("Input.dispatchKeyEvent", { type: "keyUp", key: "Escape", code: "Escape", windowsVirtualKeyCode: 27 }); await tunggu(100);
    await klik("#ang-rincian tr:nth-child(2) td:nth-child(1)"); await tunggu(250);
    await evalJs("document.getElementById('rang-nilai').value=''; true"); await klik("#lanjut-rincian-anggaran"); await tunggu(150);
    catat("Nilai kosong ditolak di popup", await evalJs("document.getElementById('dialog-rincian-anggaran').open && !document.getElementById('galat-rang-nilai').hidden"));
    await evalJs("document.getElementById('rang-nilai').value='500.000'; true"); await klik("#lanjut-rincian-anggaran"); await tunggu(200);
    catat("Klik baris lalu ubah nilai", (await barisTabel())[1] === "Beban Konsumsi|510101|500.000", JSON.stringify(await barisTabel()));

    await klik("#ang-simpan"); await tunggu(200);
    catat("Tipe Per Divisi tanpa Divisi ditolak", /Divisi wajib dipilih/.test(await galatForm()), await galatForm());
    await evalJs("(function(){var k=document.getElementById('ang-kelompok'); k.value='d1'; k.dispatchEvent(new Event('change',{bubbles:true})); document.getElementById('ang-bulan').value='1'; document.getElementById('ang-tahun').value='2026'; document.getElementById('ang-catatan').value='Rencana Januari'; document.getElementById('ang-penganalisa').value='Sari'; return true;})()");
    await klik("#ang-simpan"); await tunggu(300);
    const tersimpan = JSON.parse(await evalJs("localStorage.getItem('daftarAnggaran')"));
    const d = tersimpan[0] || {};
    catat("Simpan: data lengkap, formulir kosong lagi", tersimpan.length === 1 && d.bulan === 1 && d.tahun === 2026 && d.tipe === "divisi" && d.kelompokId === "d1" && d.total === 10500000 && d.nama === "Januari 2026, Makam" && d.catatan === "Rencana Januari" && d.penganalisa === "Sari" && d.rincian.length === 2 && (await barisTabel()).length === 1, JSON.stringify(d));
    catat("Anggaran tidak membuat jurnal", await evalJs("bacaJurnalMentah().length===0"));
    // Formulir kembar ditolak
    await evalJs("(function(){var t=document.getElementById('ang-tipe'); t.value='divisi'; t.dispatchEvent(new Event('change',{bubbles:true})); var k=document.getElementById('ang-kelompok'); k.value='d1'; document.getElementById('ang-bulan').value='1'; document.getElementById('ang-tahun').value='2026'; return true;})()");
    await pilihAkun("listrik", "100000");
    await klik("#ang-simpan"); await tunggu(250);
    catat("Bulan, tahun, tipe, dan Divisi sama ditolak", /Januari 2026, Makam sudah ada/.test(await galatForm()) && await evalJs("JSON.parse(localStorage.getItem('daftarAnggaran')).length===1"), await galatForm());
    await evalJs("modulAnggaran.tampilkan('daftar'); modulAnggaran.gambarTabel(); true"); await tunggu(250);
    const daftar = await evalJs("document.querySelector('#isi-anggaran .tabel-daftar tbody').textContent");
    catat("Daftar: Periode, Tipe, Divisi, Catatan, Total", /Januari 2026/.test(daftar) && /Per Divisi/.test(daftar) && /Makam/.test(daftar) && /10\.500\.000/.test(daftar), daftar);
    await foto("anggaran-daftar.png");
    await evalJs("modulAnggaran.bukaUbah(modulAnggaran.ambil()[0]); true"); await tunggu(250);
    catat("Buka dari Daftar: isian dan rincian kembali, nama Divisi terlihat di layar", await nilaiSel("#ang-kelompok") === "d1" && (await barisTabel()).length === 2 && await nilaiSel("#ang-penganalisa") === "Sari" && /Makam/.test(await evalJs("document.querySelector('.ang-kelompok').innerText")));
    await klik("#ang-simpan"); await tunggu(300);
    catat("Simpan ubahan tanpa perubahan periode tidak dianggap kembar", await evalJs("JSON.parse(localStorage.getItem('daftarAnggaran')).length===1 && document.getElementById('ang-pesan-galat').hidden"), await galatForm());
    catat("Ikut Cadangan Data", await evalJs("jenisKunciCadangan.daftarAnggaran==='daftar'"));
    await evalJs("modulAnggaran.bukaBaru(); (function(){var t=document.getElementById('ang-tipe'); t.value='divisi'; t.dispatchEvent(new Event('change',{bubbles:true})); t.value='umum'; t.dispatchEvent(new Event('change',{bubbles:true})); return true;})()"); await tunggu(150);
    catat("Kembali ke Tipe Umum: kolom Divisi/Program tidak terlihat di layar", await evalJs("document.querySelector('.ang-kelompok').getBoundingClientRect().height===0"), await evalJs("document.querySelector('.ang-kelompok').outerHTML.slice(0,300)"));
    // Data yang dipakai Anggaran tidak bisa dihapus (PRD 6.5). Program dipakai dulu lewat satu data contoh.
    await evalJs("(function(){var d=modulAnggaran.ambil(); d.push({id:'x1',bulan:2,tahun:2026,tipe:'program',kelompokId:'pr1',rincian:[]}); modulAnggaran.simpan(d); localStorage.setItem('daftarProgram', JSON.stringify([{id:'pr1',nama:'Beasiswa',divisiId:'',status:'aktif'}])); return true;})()");
    catat("Akun yang dipakai Anggaran tidak bisa dihapus", await evalJs("tempatAkunDipakai('510101')") === "Anggaran");
    catat("Akun yang tidak dipakai tetap boleh dihapus", await evalJs("tempatAkunDipakai('510102')") === "");
    catat("Divisi dan Program yang dipakai Anggaran terhitung", await evalJs("jumlahAnggaranMemakai('divisi','d1')===1 && jumlahAnggaranMemakai('program','pr1')===1"));
    // Data rusak
    await evalJs("localStorage.setItem('daftarAnggaran', JSON.stringify([null, 5, {id:'r1', bulan:'x', tahun:null, tipe:'aneh', rincian:'rusak'}, {id:'r2', bulan:13, tipe:'divisi', kelompokId:'hilang', rincian:[null]}])); true");
    await muatUlang();
    await evalJs("modulAnggaran.bukaDariMenu(); modulAnggaran.tampilkan('daftar'); modulAnggaran.gambarTabel(); modulAnggaran.bukaUbah(modulAnggaran.ambil()[0]); true"); await tunggu(200);
    catat("Data rusak di penyimpanan tidak membuat macet", galat.length === 0, JSON.stringify(galat));
    await kirim("Emulation.setDeviceMetricsOverride", { width: 390, height: 844, deviceScaleFactor: 1, mobile: false }); await tunggu(300);
    catat("Lebar 390: formulir di dalam layar", await evalJs("document.getElementById('form-anggaran').getBoundingClientRect().right<=window.innerWidth"));
    await foto("anggaran-hp.png");
    catat("Tidak ada galat atau peringatan di Console", galat.length === 0, JSON.stringify(galat));
  } catch (e) { console.log("GALAT: " + e.stack + "\nGalat halaman: " + JSON.stringify(galat)); hasil.push(false); }
  try { ws.close(); } catch (e) { /* abaikan */ } chrome.kill();
  console.log("Lolos " + hasil.filter(Boolean).length + " dari " + hasil.length); process.exit(hasil.every(Boolean) ? 0 : 1);
})();
