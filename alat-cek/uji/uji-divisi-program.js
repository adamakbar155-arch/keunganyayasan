// Uji singkat Divisi dan Program (Master Data). Pemakaian: node uji-divisi-program.js <jalur-jsdom> <menu.html>
const { JSDOM, VirtualConsole } = require(process.argv[2]);
const fs = require("fs"), path = require("path");
const html = fs.readFileSync(process.argv[3], "utf8").replace(/<script src="([^":]+\.js)"><\/script>/g, (m, p) => "<script>" + fs.readFileSync(path.join(path.dirname(process.argv[3]), p), "utf8") + "</script>").replace(/<link[^>]*>/g, "");
const kesalahan = []; const vc = new VirtualConsole();
vc.on("jsdomError", e => kesalahan.push(String(e.detail || e.message))); vc.on("warn", m => kesalahan.push("warn: " + m));
const dom = new JSDOM(html, { runScripts: "dangerously", url: "https://uji.test/", virtualConsole: vc, pretendToBeVisual: true, beforeParse: require("./bantu-sesi.js").pasang }); /* masuk sebagai pengguna uji (J.25) */
const w = dom.window, d = w.document;
w.HTMLDialogElement.prototype.showModal = function () { this.open = true; }; w.HTMLDialogElement.prototype.close = function () { this.open = false; };
let lolos = 0, gagal = 0; const cek = (n, k, i) => { if (k) { lolos++; console.log("  ok    " + n); } else { gagal++; console.log("  GAGAL " + n + (i !== undefined ? " -> " + JSON.stringify(i) : "")); } };
const el = id => d.getElementById(id);
const kirim = id => el(id).dispatchEvent(new w.Event("submit", { cancelable: true, bubbles: true }));
// Divisi lewat Master Data
el("tombol-master-data") ? el("tombol-master-data").click() : null;
w.bukaDivisiBaru();
cek("halaman Divisi terbuka", !el("isi-divisi").hidden);
el("divisi-nama").value = "Pendidikan"; kirim("form-divisi");
const div = JSON.parse(w.localStorage.getItem("daftarDivisi") || "[]");
cek("simpan Divisi 'Pendidikan': tersimpan 1", div.length === 1 && div[0].nama === "Pendidikan", div);
kirim("form-divisi");
cek("simpan Divisi kosong: ditolak (pesan nama wajib)", !el("galat-divisi-nama").hidden && JSON.parse(w.localStorage.getItem("daftarDivisi")).length === 1);
// Program memilih Divisi tadi
w.modulProgram.bukaDariMenu();
cek("halaman Program terbuka; pilihan Divisi memuat 'Pendidikan'", !el("isi-program").hidden && [...el("program-divisi").options].some(o => o.textContent === "Pendidikan"));
el("program-nama").value = "Beasiswa";
el("program-divisi").value = div[0].id;
el("program-status").value = "aktif";   // Status dipilih sendiri (Data Baru dibuka kosong, PRD 5.3a)
const r =d.querySelector('input[name="program-sifat"][value="terikat"]'); if (r) { r.checked = true; }
kirim("form-program");
const prog = JSON.parse(w.localStorage.getItem("daftarProgram") || "[]");
cek("simpan Program 'Beasiswa' (Pendidikan) tanpa isian Sifat Dana, formulir tidak punya radio sifat (PRD Keputusan 8a)", prog.length === 1 && prog[0].nama === "Beasiswa" && prog[0].divisiId === div[0].id && !("sifat" in prog[0]) && !d.querySelector('input[name="program-sifat"]') && !d.getElementById("galat-program-sifat"), prog);
cek("daftar Program tanpa kolom Sifat Dana", ![...d.querySelectorAll("#isi-program th")].some(th => /Sifat/.test(th.textContent)), [...d.querySelectorAll("#isi-program th")].map(th => th.textContent));
cek("bacaProgram dan namaProgramDari dipakai halaman lain tetap jalan", w.bacaProgram().length === 1 && w.namaProgramDari(prog[0].id) === "Beasiswa");
cek("tidak ada galat skrip", kesalahan.length === 0, kesalahan);
console.log("\nLolos:", lolos, "Gagal:", gagal); process.exit(gagal ? 1 : 0);
