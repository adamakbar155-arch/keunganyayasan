// Uji Tab Dokumen (PRD 6.10): tab kecil per data, isi yang belum disimpan tetap di tabnya (termasuk baris rincian),
// data sama pindah ke tab yang ada, tombol x dengan peringatan, batas 10 tab, sesudah simpan, sesudah hapus.
// Pemakaian: node uji-tab-dokumen.js <jalur-jsdom> <jalur-index.html>
const { JSDOM, VirtualConsole } = require(process.argv[2]);
const fs = require("fs"), path = require("path");
const html = fs.readFileSync(process.argv[3], "utf8").replace(/<script src="([^":]+\.js)"><\/script>/g, (m, p) => "<script>" + fs.readFileSync(path.join(path.dirname(process.argv[3]), p), "utf8") + "</script>").replace(/<link[^>]*>/g, "");
const kesalahan = [];
const vc = new VirtualConsole();
vc.on("jsdomError", (e) => kesalahan.push("jsdomError: " + (e.detail || e.message)));
vc.on("warn", (m) => kesalahan.push("console.warn: " + m));
const dom = new JSDOM(html, { runScripts: "dangerously", url: "https://uji.test/", virtualConsole: vc, pretendToBeVisual: true, beforeParse: require("./bantu-sesi.js").pasang }); /* masuk sebagai pengguna uji (J.25) */
const w = dom.window, d = w.document;
w.addEventListener("error", (e) => kesalahan.push("window.error: " + e.message));
w.HTMLDialogElement.prototype.showModal = function () { this.open = true; };
w.HTMLDialogElement.prototype.close = function () { this.open = false; };
let lolos = 0, gagal = 0;
const cek = (n, k, info) => { if (k) { lolos++; console.log("  ok    " + n); } else { gagal++; console.log("  GAGAL " + n + (info !== undefined ? "  -> " + JSON.stringify(info) : "")); } };
const el = (id) => d.getElementById(id);

const tab = (modul) => [...d.querySelectorAll("#isi-" + modul + " .tab-dokumen .modul-tab")];
const judul = (modul) => tab(modul).map(t => t.querySelector(".tab-judul").textContent);
const aktif = (modul) => { const t = d.querySelector("#isi-" + modul + " .tab-dokumen .modul-tab.aktif"); return t ? t.querySelector(".tab-judul").textContent : ""; };
const klikTab = (modul, teks) => tab(modul).find(t => t.querySelector(".tab-judul").textContent === teks).querySelector(".tab-judul").click();
const tutupTab = (modul, teks) => tab(modul).find(t => t.querySelector(".tab-judul").textContent === teks).querySelector(".tab-tutup").click();
const isi = (id, v) => { el(id).value = v; el(id).dispatchEvent(new w.Event("input", { bubbles: true })); };

setTimeout(() => {
  try {
    // ---- Formulir biasa: Divisi ----
    const divisi = Array.from({ length: 11 }, (x, i) => ({ id: "d" + i, nama: "Divisi " + i, keterangan: "" }));
    w.modulDivisi.simpan(divisi);
    w.modulDivisi.bukaDariMenu();
    cek("1) halaman dibuka dengan satu tab Data Baru yang punya tombol x", JSON.stringify(judul("divisi")) === '["Data Baru"]' && !!tab("divisi")[0].querySelector(".tab-tutup"), judul("divisi"));
    isi("divisi-nama", "Draf baru");
    w.modulDivisi.bukaUbah(divisi[0]);
    w.modulDivisi.bukaUbah(divisi[1]);
    cek("2) dua data dibuka dari daftar: masing-masing tab sendiri, Data Baru tetap", JSON.stringify(judul("divisi")) === '["Data Baru","Divisi 0","Divisi 1"]' && aktif("divisi") === "Divisi 1" && el("divisi-nama").value === "Divisi 1", judul("divisi"));
    isi("divisi-nama", "Divisi 1 diubah");
    klikTab("divisi", "Divisi 0");
    cek("3) pindah tab: isi tab Divisi 0 dari data tersimpan", el("divisi-nama").value === "Divisi 0" && w.modulDivisi.idDiubah === "d0");
    klikTab("divisi", "Divisi 1");
    cek("   kembali ke tab Divisi 1: perubahan yang belum disimpan masih ada", el("divisi-nama").value === "Divisi 1 diubah" && w.modulDivisi.adaPerubahan());
    klikTab("divisi", "Data Baru");
    cek("   tab Data Baru: draf yang belum disimpan masih ada, idDiubah kosong", el("divisi-nama").value === "Draf baru" && w.modulDivisi.idDiubah === null);
    w.modulDivisi.bukaUbah(divisi[0]);
    cek("4) data yang sama dibuka lagi: pindah ke tabnya, tidak ada tab ganda", judul("divisi").length === 3 && aktif("divisi") === "Divisi 0");
    tutupTab("divisi", "Divisi 0");
    cek("5) tutup tab tanpa perubahan: langsung tertutup tanpa peringatan", !el("dialog-konfirmasi").open && JSON.stringify(judul("divisi")) === '["Data Baru","Divisi 1"]', judul("divisi"));
    tutupTab("divisi", "Divisi 1");
    cek("6) tutup tab yang berubah: peringatan Accurate muncul", el("dialog-konfirmasi").open && /Perubahan yang Anda lakukan akan dibatalkan, lanjutkan\?/.test(el("isi-konfirmasi").textContent));
    el("batal-konfirmasi").click();
    cek("   Batal: tab tetap ada dengan perubahannya", judul("divisi").includes("Divisi 1") && (klikTab("divisi", "Divisi 1"), el("divisi-nama").value === "Divisi 1 diubah"));
    tutupTab("divisi", "Divisi 1"); el("ya-konfirmasi").click();
    cek("   Ya: tab tertutup, data tersimpan tidak berubah", !judul("divisi").includes("Divisi 1") && w.modulDivisi.ambil().find(x => x.id === "d1").nama === "Divisi 1");
    // Batas 10
    for (let i = 0; i < 11; i++) { w.modulDivisi.bukaUbah(divisi[i]); }
    cek("7) paling banyak 10 tab; tab ke-11 ditolak dengan pesan", tab("divisi").length === 10 && /Paling banyak 10 tab/.test(el("area-notifikasi").textContent), tab("divisi").length);
    // Sesudah simpan: tab data lama tetap terbuka, judulnya ikut nama baru
    klikTab("divisi", "Divisi 2"); isi("divisi-nama", "Divisi Dua"); el("form-divisi").requestSubmit ? el("form-divisi").dispatchEvent(new w.Event("submit", { cancelable: true, bubbles: true })) : null;
    cek("8) sesudah simpan data lama: tab tetap terbuka, judul ikut nama baru, tidak dianggap berubah", aktif("divisi") === "Divisi Dua" && el("divisi-nama").value === "Divisi Dua" && !w.modulDivisi.adaPerubahan() && w.modulDivisi.ambil().find(x => x.id === "d2").nama === "Divisi Dua", aktif("divisi"));
    klikTab("divisi", "Data Baru"); isi("divisi-nama", "Divisi Baru"); el("form-divisi").dispatchEvent(new w.Event("submit", { cancelable: true, bubbles: true }));
    cek("   sesudah simpan Data Baru: tab Data Baru kosong lagi, data baru tersimpan", aktif("divisi") === "Data Baru" && el("divisi-nama").value === "" && w.modulDivisi.ambil().some(x => x.nama === "Divisi Baru") && !w.modulDivisi.adaPerubahan());
    // Sesudah hapus: tabnya tertutup
    klikTab("divisi", "Divisi 3");
    d.querySelector("#isi-divisi [data-aksi='hapus']").click(); el("ya-konfirmasi").click();
    cek("9) sesudah hapus: tab data itu tertutup dan kembali ke Daftar", !judul("divisi").includes("Divisi 3") && d.querySelector("#isi-divisi .modul-form").hidden);
    // Tutup semua tab: kembali ke Daftar
    judul("divisi").forEach(j => { tutupTab("divisi", j); if (el("dialog-konfirmasi").open) { el("ya-konfirmasi").click(); } });
    cek("10) semua tab ditutup: tampilan Daftar", tab("divisi").length === 0 && d.querySelector("#isi-divisi .modul-form").hidden && w.modulDivisi.idDiubah === null);
    d.querySelector("#isi-divisi .tombol-daftar").click();
    cek("    tombol hijau tanpa tab: membuka Data Baru", JSON.stringify(judul("divisi")) === '["Data Baru"]' && !d.querySelector("#isi-divisi .modul-form").hidden);
    cek("11) judul tab memakai textContent (nama berkode HTML tetap teks)", (w.modulDivisi.simpan(w.modulDivisi.ambil().concat([{ id: "dx", nama: "<b>Tebal</b>" }])), w.modulDivisi.bukaUbah({ id: "dx", nama: "<b>Tebal</b>" }), aktif("divisi") === "<b>Tebal</b>" && !d.querySelector("#isi-divisi .tab-dokumen b")));

    // ---- Formulir dengan baris rincian: Jurnal Umum ----
    w.localStorage.setItem("daftarAkun", JSON.stringify([
      { id: "k1", kode: "110101", nama: "Kas Kecil", tipe: "kas-bank", indukId: "" },
      { id: "b1", kode: "510101", nama: "Beban Listrik", tipe: "beban", indukId: "" }
    ]));
    const baris = (akunId, kode, nama, debit, kredit) => ({ id: "r" + kode + debit, akunId, kode, nama, debit, kredit, keterangan: "", divisiId: "", programId: "", terikat: false });
    const j1 = { id: "j1", nomor: "JU-1", nama: "JU-1", tanggal: w.tanggalHariIni(), keterangan: "Satu", rincian: [baris("b1", "510101", "Beban Listrik", 1000, 0), baris("k1", "110101", "Kas Kecil", 0, 1000)], totalDebit: 1000 };
    w.modulJurnal.simpan([j1]);
    w.bukaTab("jurnal");
    w.modulJurnal.bukaUbah(j1);
    const jumlahBaris = () => d.querySelectorAll("#isi-jurnal .jurnal-baris-data").length;
    cek("12) Jurnal dibuka di tab sendiri berisi 2 baris", aktif("jurnal") === "JU-1" && jumlahBaris() === 2);
    w.barisJurnal.push(baris("b1", "510101", "Beban Listrik", 500, 0)); w.gambarRincianJurnal();
    cek("   menambah baris: tab dianggap berubah", jumlahBaris() === 3 && w.modulJurnal.adaPerubahan());
    klikTab("jurnal", "Data Baru");
    cek("   pindah ke Data Baru: rincian kosong", jumlahBaris() === 0);
    klikTab("jurnal", "JU-1");
    cek("   kembali ke JU-1: 3 baris yang belum disimpan masih ada, total ikut", jumlahBaris() === 3 && /1\.500/.test(el("jurnal-total-debit").textContent), el("jurnal-total-debit").textContent);
    tutupTab("jurnal", "JU-1");
    cek("   tutup JU-1 yang barisnya berubah: peringatan muncul", el("dialog-konfirmasi").open);
    el("ya-konfirmasi").click();
    cek("   Ya: jurnal tersimpan tetap 2 baris", w.modulJurnal.ambil()[0].rincian.length === 2);

    // ---- J.19: Penomoran (susunan komponen di memori) ----
    const a1 = { id: "a1", nama: "Aturan A", pembukuan: "yayasan", tipe: "jurnal", digit: 3, komponen: [{ jenis: "teks", nilai: "A-" }, { jenis: "counter" }] };
    w.modulPenomoran.simpan([a1]);
    w.bukaTab("penomoran");
    w.modulPenomoran.bukaUbah(a1);
    w.komponenSaatIni.push({ jenis: "teks", nilai: "-X" }); w.gambarKomponen();
    klikTab("penomoran", "Data Baru");
    cek("14) Penomoran: pindah ke Data Baru, komponen kosong", w.komponenSaatIni.length === 0);
    klikTab("penomoran", "Aturan A");
    cek("    kembali ke Aturan A: 3 komponen yang belum disimpan masih ada, tab dianggap berubah", w.komponenSaatIni.length === 3 && w.komponenSaatIni[2].nilai === "-X" && w.modulPenomoran.adaPerubahan(), w.komponenSaatIni);

    // ---- J.19: Pemindahan Dana (pilihan Jenis dan baris Tujuan) ----
    w.localStorage.setItem("daftarAkun", JSON.stringify([
      { id: "k0", kode: "1101", nama: "Kas & Bank", tipe: "kas-bank", indukId: "" },
      { id: "k01", kode: "110101", nama: "Kas", tipe: "kas-bank", indukId: "k0" },
      { id: "k1", kode: "11010101", nama: "Kas Masjid", tipe: "kas-bank", indukId: "k01" },
      { id: "k2", kode: "11010102", nama: "Kas Sekolah", tipe: "kas-bank", indukId: "k01" }
    ]));
    const pd1 = { id: "pd1", nomor: "PD-1", nama: "PD-1", tanggal: w.tanggalHariIni(), jenis: "ke-umum", dariProgramId: "", kasAsalId: "k1", kasAsal: "11010101 - Kas Masjid",
                  kasTujuanId: "k2", kasTujuan: "11010102 - Kas Sekolah", nilai: 5000, total: 5000, alasan: "Sisa" };
    w.modulPemindahanDana.simpan([pd1]);
    w.bukaTab("pemindahan-dana");
    w.modulPemindahanDana.bukaBaruKosong(function () {}); if (el("dialog-konfirmasi").open) { el("ya-konfirmasi").click(); }
    const radioDivisi = el("pd-jenis-divisi"); radioDivisi.checked = true; radioDivisi.dispatchEvent(new w.Event("change", { bubbles: true }));
    w.tujuanPd = { kasId: "k1", nilai: 7000, divisiId: "d4" }; w.gambarTujuanPd();
    w.modulPemindahanDana.bukaUbah(pd1);
    cek("15) Pemindahan Dana: tab PD-1 berisi Jenis dan Tujuan miliknya", el("pd-jenis-umum").checked && w.tujuanPd && w.tujuanPd.kasId === "k2" && w.tujuanPd.nilai === 5000, w.tujuanPd);
    klikTab("pemindahan-dana", "Data Baru");
    cek("    kembali ke Data Baru: Jenis 'Dana Umum -> Divisi' dan Tujuan (Kas Masjid 7.000, Divisi) yang belum disimpan masih ada", el("pd-jenis-divisi").checked && w.tujuanPd && w.tujuanPd.kasId === "k1" && w.tujuanPd.nilai === 7000 && w.tujuanPd.divisiId === "d4" && /7\.000/.test(el("isi-pemindahan-dana").textContent), w.tujuanPd);

    // ---- J.19: Ambil favorit tidak menimpa Data Baru yang belum disimpan ----
    w.bukaTab("jurnal");
    w.modulJurnal.bukaBaruKosong(function () {}); if (el("dialog-konfirmasi").open) { el("ya-konfirmasi").click(); }
    isi("jurnal-keterangan", "Draf jurnal penting");
    w.modulJurnal.bukaDariTemplat({ keterangan: "Dari favorit", rincian: [] });
    cek("16) Ambil favorit saat Data Baru berisi draf: peringatan muncul dulu", el("dialog-konfirmasi").open && /belum disimpan/.test(el("isi-konfirmasi").textContent));
    el("batal-konfirmasi").click();
    cek("    Batal: draf tetap utuh", el("jurnal-keterangan").value === "Draf jurnal penting");
    let sudahTerisi = false;
    w.modulJurnal.bukaDariTemplat({ keterangan: "Dari favorit", rincian: [] }, function () { sudahTerisi = true; });
    el("ya-konfirmasi").click();
    cek("    Ya: Data Baru terisi dari favorit, lalu pesan 'terisi' baru dijalankan", el("jurnal-keterangan").value === "Dari favorit" && sudahTerisi && aktif("jurnal") === "Data Baru");

    // ---- J.19: Tambah ke Favorit dari tab yang belum disimpan ----
    w.modulJurnal.simpan([j1]);
    w.modulJurnal.bukaUbah(j1);
    isi("jurnal-keterangan", "Diubah belum disimpan");
    el("area-notifikasi").textContent = "";
    w.tipeMenuLainnya = "Jurnal Umum";
    el("menu-tambah-favorit").click();
    cek("17) Tambah ke Favorit dari tab yang berubah: ditolak 'Simpan dulu'", /belum disimpan\. Simpan dulu/.test(el("area-notifikasi").textContent) && !el("dialog-favorit").open, el("area-notifikasi").textContent);

    cek("13) tidak ada galat skrip", kesalahan.length === 0, kesalahan);
  } catch (e) { kesalahan.push("uji: " + e.stack); }
  console.log("\nLolos:", lolos, "Gagal:", gagal, "| Kesalahan skrip:", kesalahan.length ? kesalahan : "tidak ada");
  process.exit(gagal || kesalahan.length ? 1 : 0);
}, 50);
