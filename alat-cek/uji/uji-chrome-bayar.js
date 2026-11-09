// Uji Pencatatan Gaji di Chrome asli. Pemakaian: node uji-chrome-gaji.js <chrome.exe> <menu.html> <folder-profil> <folder-png>
const { spawn } = require("child_process");
const fs = require("fs"), path = require("path"), zlib = require("zlib");
const [chromeExe, halaman, folderProfil, folderPng] = process.argv.slice(2);
const PORT = 9366;
const tunggu = (ms) => new Promise(r => setTimeout(r, ms));
const siapUji = require("./bantu-siap.js");   // tunggu sampai aplikasi siap sesudah muat ulang
let id = 0; const menunggu = new Map(); let ws;
const kirim = (m, p = {}) => new Promise((s, g) => { const n = ++id; menunggu.set(n, { s, g }); ws.send(JSON.stringify({ id: n, method: m, params: p })); });
const evalJs = async (e) => { const r = await kirim("Runtime.evaluate", { expression: e, returnByValue: true, awaitPromise: true }); if (r.exceptionDetails) throw new Error(JSON.stringify(r.exceptionDetails.exception.description)); return r.result.value; };
const hasil = []; const catat = (n, ok, r = "") => { hasil.push(ok); console.log((ok ? "LOLOS  " : "GAGAL  ") + n + (r ? " -> " + r : "")); };
const foto = async (nama) => { const r = await kirim("Page.captureScreenshot", { format: "png" }); fs.writeFileSync(path.join(folderPng, nama), Buffer.from(r.data, "base64")); };
const klik = async (sel) => { const j = JSON.parse(await evalJs(`(function(){var e=document.querySelector(${JSON.stringify(sel)}); e.scrollIntoView({block:'center'}); var r=e.getBoundingClientRect(); return JSON.stringify({x:r.left+r.width/2,y:r.top+r.height/2});})()`)); await kirim("Input.dispatchMouseEvent", { type: "mouseMoved", x: j.x, y: j.y }); await kirim("Input.dispatchMouseEvent", { type: "mousePressed", x: j.x, y: j.y, button: "left", clickCount: 1 }); await kirim("Input.dispatchMouseEvent", { type: "mouseReleased", x: j.x, y: j.y, button: "left", clickCount: 1 }); };
const danaUji = (p) => evalJs("(function(){var t=document.getElementById('" + p + "-terikat'), n=document.getElementById('" + p + "-tidak-terikat'); if(t&&n&&!t.checked&&!n.checked){n.checked=true;} var d=document.getElementById('" + p + "-divisi'); if(d&&d.value===''){var o=[].slice.call(d.options).find(function(x){return x.value;}); if(o){d.value=o.value; d.dispatchEvent(new Event('change',{bubbles:true}));}} return true;})()");   // Dana belum dipilih -> Tidak Terikat (arti lama, PRD 4.1); Divisi kosong -> divisi pertama (wajib, PRD 5.1)
(async () => {
  fs.mkdirSync(folderPng, { recursive: true });
  const galat = [];
  const chrome = spawn(chromeExe, ["--headless=new", "--disable-gpu", "--no-first-run", "--remote-debugging-port=" + PORT, "--user-data-dir=" + folderProfil, "--window-size=1366,900", "file:///" + halaman.replace(/\\/g, "/")], { stdio: "ignore" });
  try {
    let t = null;
    for (let i = 0; i < 60 && !t; i++) { await tunggu(250); try { t = (await (await fetch("http://127.0.0.1:" + PORT + "/json/list")).json()).find(x => x.type === "page" && x.url.startsWith("file:")); } catch (e) {} }
    ws = new WebSocket(t.webSocketDebuggerUrl); await new Promise((s, g) => { ws.onopen = s; ws.onerror = g; });
    ws.onmessage = (m) => { const d = JSON.parse(m.data); if (d.method === "Runtime.exceptionThrown") galat.push(d.params.exceptionDetails.exception.description); if (d.method === "Runtime.consoleAPICalled" && ["error", "warning"].includes(d.params.type)) galat.push(d.params.args.map(a => a.value).join(" ")); if (d.id && menunggu.has(d.id)) { const p = menunggu.get(d.id); menunggu.delete(d.id); d.error ? p.g(new Error(JSON.stringify(d.error))) : p.s(d.result); } };
    await kirim("Runtime.enable"); await kirim("Page.enable"); await require("./bantu-sesi.js").masukChrome(kirim, "file:///" + halaman.replace(/\\/g, "/")); /* masuk sebagai pengguna uji (J.25) */ await kirim("Page.addScriptToEvaluateOnNewDocument", { source: require("./bantu-pengguna.js") }); /* pengguna mengisi kepala Data Baru (PRD 5.3a) */
    await kirim("Emulation.setDeviceMetricsOverride", { width: 1366, height: 900, deviceScaleFactor: 1, mobile: false });
    await tunggu(800);
    await evalJs(`(function(){ localStorage.clear(); /* uji fitur lain: kas boleh minus dengan peringatan (aturan Ditolak diuji di uji-kas-minus.js) */ localStorage.setItem('pembatasanYayasan', JSON.stringify({kasMinus:'peringatan'}));
      localStorage.setItem('daftarAkun', JSON.stringify([{id:'a1',kode:'110101',nama:'Kas Kecil',tipe:'kas-bank',saldoAwal:0},{id:'a3',kode:'210101',nama:'Utang Gaji',tipe:'liabilitas-pendek',saldoAwal:0},{id:'a4',kode:'610101',nama:'Beban Gaji',tipe:'beban',saldoAwal:0}]));
      localStorage.setItem('daftarPenomoran', JSON.stringify([{id:'g1',nama:'Pencatatan Gaji',pembukuan:'yayasan',tipe:'gaji',digit:4,komponen:[{jenis:'teks',nilai:'GJ-'},{jenis:'counter'}]},{id:'n1',nama:'Jurnal Umum',pembukuan:'yayasan',tipe:'jurnal',digit:4,komponen:[{jenis:'teks',nilai:'JU-'},{jenis:'counter'}]}]));
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
    await klik("#tombol-buku-besar"); await tunggu(300);
    await klik('#panel-buku-besar .kotak-menu[data-halaman="Pencatatan Gaji"]'); await tunggu(500);

    const bersihNotif = () => evalJs("document.getElementById('area-notifikasi').textContent=''; true");
    await evalJs("(function(){var a=JSON.parse(localStorage.getItem('daftarAkun')); a.forEach(function(x){ if(!x.indukId) x.indukId='g1'; }); a.push({id:'k0',kode:'1',nama:'Grup Atas',tipe:'aset-lain',indukId:'',saldoAwal:0},{id:'g1',kode:'11',nama:'Grup Uji',tipe:'aset-lain',indukId:'k0',saldoAwal:0},{id:'a5',kode:'110201',nama:'Bank BSI',tipe:'kas-bank',indukId:'g1',saldoAwal:0},{id:'kd2',kode:'12',nama:'Kas Induk Uji',tipe:'kas-bank',indukId:'k0',saldoAwal:0},{id:'kd3',kode:'1201',nama:'Kas Anak Uji',tipe:'kas-bank',indukId:'kd2',saldoAwal:0},{id:'i6',kode:'6102',nama:'Beban Operasional',tipe:'beban',saldoAwal:0},{id:'s6',kode:'610201',nama:'Beban Utilitas',tipe:'beban',indukId:'i6',saldoAwal:0},{id:'a6',kode:'61020101',nama:'Beban Listrik',tipe:'beban',indukId:'s6',saldoAwal:0},{id:'a7',kode:'61020102',nama:'Beban Air',tipe:'beban',indukId:'s6',saldoAwal:0},{id:'s7',kode:'610202',nama:'Beban Kebersihan',tipe:'beban',indukId:'i6',saldoAwal:0}); localStorage.setItem('daftarAkun', JSON.stringify(a)); var p=JSON.parse(localStorage.getItem('daftarPenomoran')); p.push({id:'b1',nama:'Pembayaran',pembukuan:'yayasan',tipe:'pembayaran',digit:4,komponen:[{jenis:'teks',nilai:'BKK-'},{jenis:'counter'}]}); localStorage.setItem('daftarPenomoran', JSON.stringify(p)); return true;})()");
    await kirim("Page.reload"); await siapUji(evalJs, tunggu);
    await klik("#tombol-kas"); await tunggu(300);
    catat("Ikon Kas: popup 'Kas & Bank' terbuka berisi 5 kotak seperti Accurate: Pembayaran, Penerimaan, Transfer Bank, Histori Bank, Rekonsiliasi Bank", await evalJs("document.getElementById('panel-kas').open && [...document.querySelectorAll('#panel-kas .kotak-label-menu')].map(function(x){return x.textContent;}).join('|')==='Pembayaran|Penerimaan|Transfer Bank|Histori Bank|Rekonsiliasi Bank'"));
    await foto("kas-panel.png");
    await klik('#panel-kas .kotak-menu[data-halaman="Penerimaan"]'); await tunggu(300);
    catat("Penerimaan: halaman Penerimaan terbuka, popup tertutup", await evalJs("!document.getElementById('isi-terima').hidden && !document.getElementById('panel-kas').open"));
    await klik("#tombol-kas"); await tunggu(300);
    await klik('#panel-kas .kotak-menu[data-halaman="Pembayaran"]'); await tunggu(500);
    const atas = JSON.parse(await evalJs("JSON.stringify({buka: !document.getElementById('isi-pembayaran') && !document.getElementById('isi-bayar').hidden && !document.getElementById('tab-bayar').hidden, kas: [...document.getElementById('bayar-kas').options].map(function(o){return o.textContent;}), tgl: document.getElementById('bayar-tanggal').value===tanggalHariIni(), kal: !!document.getElementById('bayar-tanggal-tampil'), contoh: document.getElementById('bayar-contoh-nomor').textContent, total: document.getElementById('bayar-total').textContent})"));
    catat("Pembayaran terbuka: pilihan Kas/Bank hanya akun Kas & Bank tanpa sub (Kas Anak Uji, Kas Kecil, Bank BSI; 'Kas Induk Uji' yang punya sub tidak tampil), tanggal hari ini (kalender), No Bukti BKK-0001, Nilai Rp 0", atas.buka && JSON.stringify(atas.kas) === JSON.stringify(["Pilih Kas/Bank...", "1201 - Kas Anak Uji", "110101 - Kas Kecil", "110201 - Bank BSI"]) && atas.tgl && atas.kal && atas.contoh === "Nomor berikutnya: BKK-0001" && atas.total === "Rp 0", JSON.stringify(atas));
    await foto("bayar-kosong.png");
    // Kas/Bank belum dipilih: daftar akun tidak bisa dibuka
    await bersihNotif(); await klik("#bayar-cari-akun"); await tunggu(300);
    catat("Kas/Bank belum dipilih: klik cari akun -> daftar TIDAK terbuka, peringatan 'Pilih Kas/Bank dulu' (sekali), kursor pindah ke Kas/Bank", await evalJs("document.getElementById('bayar-daftar-akun').hidden && document.activeElement.id==='bayar-kas-cari' && (document.getElementById('area-notifikasi').textContent.match(/Pilih Kas\\/Bank dulu/g)||[]).length===1"), await evalJs("document.getElementById('area-notifikasi').textContent"));
    await foto("bayar-peringatan-kas.png");
    await evalJs("(function(){var k=document.getElementById('bayar-kas'); k.value='a5'; k.dispatchEvent(new Event('change')); return true;})()");
    // Tambah baris lewat cari akun
    await klik("#bayar-cari-akun"); await tunggu(250);
    const pilihan = await evalJs("[...document.querySelectorAll('#bayar-daftar-akun .jurnal-pilihan-nama')].map(function(x){return x.textContent;})");
    catat("Setelah Kas/Bank dipilih: daftar terbuka; akun yang punya sub (Beban Operasional, Beban Utilitas, Grup Atas, Grup Uji, Kas Induk Uji) TIDAK tampil; akun tanpa sub (Beban Listrik, Beban Air, Beban Kebersihan, Kas Kecil, dll.) tampil", ["Beban Listrik", "Beban Air", "Beban Kebersihan", "Kas Kecil", "Beban Gaji"].every(function (n) { return pilihan.includes(n); }) && !["Beban Operasional", "Beban Utilitas", "Grup Atas", "Grup Uji", "Kas Induk Uji"].some(function (n) { return pilihan.includes(n); }), JSON.stringify(pilihan));
    await ketik("listrik"); await tunggu(250);
    catat("Cari 'listrik': muncul Beban Listrik", await evalJs("document.querySelectorAll('#bayar-daftar-akun .jurnal-pilihan-akun').length===1 && /Beban Listrik/.test(document.getElementById('bayar-daftar-akun').textContent)"));
    await tombol("Enter", "Enter", 13); await tunggu(400);
    catat("Popup Rincian Pembayaran: Akun 61020101, Untuk Pembayaran 'Beban Listrik', kursor di Nilai, tombol Hapus tersembunyi (baris baru)", await evalJs("document.getElementById('dialog-rincian-bayar').open && document.getElementById('rbayar-kode').textContent==='61020101' && document.getElementById('rbayar-nama').value==='Beban Listrik' && document.activeElement.id==='rbayar-nilai' && document.getElementById('hapus-rincian-bayar').hidden"));
    await danaUji("rbayar"); await klik("#lanjut-rincian-bayar"); await tunggu(200);
    catat("Lanjut tanpa nilai: pesan 'Nilai wajib diisi'", await evalJs("!document.getElementById('galat-rbayar-nilai').hidden"));
    await ketik("750000");
    await klik('[data-rbayar-tab="info"]'); await tunggu(150);
    catat("Tab Info lainnya: Divisi, Program, Catatan; kolom Pencatatan Gaji tersembunyi (bukan baris gaji)", await evalJs("!document.getElementById('rbayar-panel-info').hidden && !!document.getElementById('rbayar-divisi') && !!document.getElementById('rbayar-program') && !!document.getElementById('rbayar-catatan') && document.getElementById('baris-rbayar-gaji').hidden"));
    await evalJs("(function(){var p=document.getElementById('rbayar-program'); p.value='p1'; p.dispatchEvent(new Event('change')); return true;})()");
    catat("Pilih Program: Divisi terisi otomatis dari Program", await evalJs("document.getElementById('rbayar-divisi').value==='d1'"));
    await foto("bayar-popup.png");
    await danaUji("rbayar"); await klik("#lanjut-rincian-bayar"); await tunggu(400);
    catat("Baris masuk tabel: 61020101 | Beban Listrik | 750.000; judul '1 Rincian Pembayaran'; Nilai Rp 750.000", await evalJs("(function(){var r=document.querySelector('#bayar-rincian tr.jurnal-baris-data'); var c=r?[...r.cells].map(function(x){return x.textContent;}):[]; return c[1]==='61020101' && c[2]==='Beban Listrik' && c[3]==='750.000' && /^1 Rincian Pembayaran/.test(document.querySelector('#bayar-panel-rincian h2').textContent) && document.getElementById('bayar-total').textContent==='Rp 750.000';})()"));
    // Baris kedua mengikuti program baris terakhir
    await klik("#bayar-cari-akun"); await ketik("air"); await tunggu(250); await tombol("Enter", "Enter", 13); await tunggu(400);
    catat("Baris berikutnya mengikuti Divisi/Program baris terakhir", await evalJs("document.getElementById('rbayar-program').value==='p1' && document.getElementById('rbayar-divisi').value==='d1'"));
    await ketik("250000"); await tombol("Enter", "Enter", 13); await tunggu(400);
    catat("Dua baris: judul '2 Rincian Pembayaran', Nilai Rp 1.000.000", await evalJs("/^2 Rincian Pembayaran/.test(document.querySelector('#bayar-panel-rincian h2').textContent) && document.getElementById('bayar-total').textContent==='Rp 1.000.000'"));
    // Ubah dan hapus lewat popup
    await klik("#bayar-rincian tr.jurnal-baris-data"); await tunggu(400);
    catat("Klik baris: popup berisi nilai lama 750.000, tombol Hapus tampil", await evalJs("document.getElementById('rbayar-nilai').value==='750.000' && !document.getElementById('hapus-rincian-bayar').hidden"));
    await foto("bayar-popup-ubah.png");
    await klik("#hapus-rincian-bayar"); await tunggu(300);
    catat("Hapus di popup: baris hilang, Nilai Rp 250.000", await evalJs("document.querySelectorAll('#bayar-rincian tr.jurnal-baris-data').length===1 && document.getElementById('bayar-total').textContent==='Rp 250.000'"));
    // Info lainnya halaman
    await klik('#isi-bayar [data-bayar-tab="info"]'); await tunggu(200);
    catat("Tab Info lainnya halaman: No Cek #, Penerima, Catatan", await evalJs("(function(){var p=document.getElementById('bayar-panel-info'); return !p.hidden && /No Cek #/.test(p.textContent) && /Penerima/.test(p.textContent) && /Catatan/.test(p.textContent);})()"));
    await foto("bayar-info.png");
    await klik('#isi-bayar [data-bayar-tab="rincian"]'); await tunggu(150);
    await bersihNotif(); await klik("#bayar-simpan"); await tunggu(600);
    const by = await evalJs("JSON.parse(localStorage.getItem('daftarPembayaran')||'[]')"), jl = await jurnalTersimpan();
    const b0 = by[0] || {}, j0 = jl.find(j => j.sumber && j.sumber.jenis === "pembayaran") || {};
    catat("Simpan: 1 Pembayaran BKK-0001 tersimpan (Kas a5, total 250.000, 1 baris) + notifikasi berhasil", by.length === 1 && b0.nomor === "BKK-0001" && b0.kasId === "a5" && b0.total === 250000 && b0.rincian.length === 1 && /Pembayaran telah berhasil disimpan/.test(await evalJs("document.getElementById('area-notifikasi').textContent")), JSON.stringify({ n: b0.nomor, t: b0.total }));
    catat("Jurnal otomatis: nomor BKK-0001, Debit Beban Air 250.000 [Program p1, Divisi d1], Kredit Kas/Bank 250.000 tanpa Program, bertanda sumber pembayaran", j0.nomor === "BKK-0001" && j0.rincian.length === 2 && j0.rincian[0].debit === 250000 && j0.rincian[0].programId === "p1" && j0.rincian[0].divisiId === "d1" && j0.rincian[1].akunId === "a5" && j0.rincian[1].kredit === 250000 && !j0.rincian[1].programId && j0.sumber.id === b0.id, JSON.stringify(j0.rincian && j0.rincian.map(r => r.kode + ":" + r.debit + "/" + r.kredit)));
    catat("Tercatat di Log Aktivitas (Buat, Pembayaran, BKK-0001)", await evalJs("JSON.parse(localStorage.getItem('logAktivitas')||'[]').some(function(l){return l.tipe==='Pembayaran' && l.tindakan==='Buat' && l.referensi==='BKK-0001';})"));
    // Ubah: nilai jadi 300.000 -> jurnal yang SAMA dibuat ulang
    await evalJs("modulBayar.bukaUbah(JSON.parse(localStorage.getItem('daftarPembayaran'))[0]); true"); await tunggu(400);
    await klik("#bayar-rincian tr.jurnal-baris-data"); await tunggu(300);
    await evalJs("(function(){var n=document.getElementById('rbayar-nilai'); n.value='300000'; n.dispatchEvent(new Event('input')); return true;})()"); await danaUji("rbayar"); await klik("#lanjut-rincian-bayar"); await tunggu(300);
    await bersihNotif(); await klik("#bayar-simpan"); await tunggu(600);
    const jl2 = (await jurnalTersimpan()).filter(j => j.sumber && j.sumber.jenis === "pembayaran");
    catat("Ubah nilai jadi 300.000: tetap 1 Pembayaran dan 1 jurnal (id sama), jurnal ikut 300.000", (await evalJs("JSON.parse(localStorage.getItem('daftarPembayaran')).length")) === 1 && jl2.length === 1 && jl2[0].id === j0.id && jl2[0].totalDebit === 300000, JSON.stringify(jl2.map(j => j.totalDebit)));
    // Simpan tanpa Kas/Bank dan tanpa rincian ditolak
    await evalJs("modulBayar.bukaBaru(); true"); await tunggu(300);
    await bersihNotif(); await klik("#bayar-simpan"); await tunggu(300);
    catat("Data Baru tanpa Kas/Bank: ditolak 'Kas/Bank wajib dipilih'", /Kas\/Bank wajib dipilih/.test(await evalJs("document.getElementById('bayar-pesan-galat').textContent")));
    await evalJs("(function(){var k=document.getElementById('bayar-kas'); k.value='a5'; return true;})()");
    await bersihNotif(); await klik("#bayar-simpan"); await tunggu(300);
    catat("Tanpa rincian: ditolak 'Rincian Pembayaran masih kosong'", /Rincian Pembayaran masih kosong/.test(await evalJs("document.getElementById('bayar-pesan-galat').textContent")));
    // Hapus: jurnalnya ikut hilang
    await evalJs("modulBayar.hapus(JSON.parse(localStorage.getItem('daftarPembayaran'))[0]); true"); await tunggu(300); await klik("#ya-konfirmasi"); await tunggu(400);
    catat("Hapus Pembayaran: data dan jurnal otomatisnya hilang", (await evalJs("JSON.parse(localStorage.getItem('daftarPembayaran')).length")) === 0 && !(await jurnalTersimpan()).some(j => j.sumber && j.sumber.jenis === "pembayaran"));
    await foto("bayar-isi.png");
    for (const m of ["modulBayar"]) { await evalJs(m + ".bukaDariMenu(); true"); await tunggu(300); await evalJs("(function(){var b=document.querySelector('.isi-tab:not([hidden]) .tombol-daftar'); b.click(); return true;})()"); await tunggu(300); console.log("INFO  lebar daftar " + m + " di 390: " + await evalJs("document.documentElement.scrollWidth")); }
    // HP
    await kirim("Emulation.setDeviceMetricsOverride", { width: 390, height: 844, deviceScaleFactor: 1, mobile: false }); await tunggu(400);
    console.log("INFO  lebar halaman di 390: " + await evalJs("document.documentElement.scrollWidth"));
    await foto("gaji-hp.png");
    catat("Tidak ada galat atau peringatan di Console", galat.length === 0, JSON.stringify(galat));
  } catch (e) { console.log("GALAT: " + e.stack); hasil.push(false); }
  try { ws.close(); } catch (e) {} chrome.kill();
  console.log("Lolos " + hasil.filter(Boolean).length + " dari " + hasil.length); process.exit(hasil.every(Boolean) ? 0 : 1);
})();
