// ==================== Petunjuk Penggunaan (lampu) ====================
// PRD 6.16 (Temuan 55, dari foto Accurate): setiap halaman punya tombol lampu jingga di kanan atas, tulisan saat disentuh
// "Petunjuk Penggunaan". Klik = popup berisi daftar topik di kiri dan isi topik di kanan.
//
// Teks petunjuk ditulis PER FITUR di fitur/<nama>/bantuan.js, lalu didaftarkan dengan:
//   daftarkanBantuan("divisi", {
//       judul: "Divisi",
//       topik: [
//           { judul: "Tentang Divisi", isi: [ "Paragraf biasa, boleh **tebal**.", { langkah: ["...", "..."] }, ... ] },
//           ...
//       ]
//   });
// Bentuk isi (blok) yang dikenal:
//   "teks"                                   -> paragraf; **kata** dicetak tebal
//   { langkah: ["...", "..."] }              -> langkah bernomor
//   { poin: ["...", "..."] }                 -> daftar berbutir
//   { tabel: { kolom: [...], baris: [[...], ...] } } -> tabel (misalnya Isian | Wajib | Penjelasan)
//   { catatan: "..." }                       -> kotak catatan penting (kuning)
// Semua teks dipasang lewat textContent (aman dari kode HTML).
// Lampu dipasang saat petunjuk didaftarkan: di baris tombol hijau Daftar (.modul-bar) kalau ada, atau di tempat lain lewat
// pilihan "tempat" (pemilih CSS di dalam halaman). Halaman tanpa petunjuk tidak menampilkan lampu.
// Dimuat sesudah semua halaman (HTML dan modul daftarnya sudah ada) dan SEBELUM file fitur/<nama>/bantuan.js.

var DAFTAR_BANTUAN = Object.create(null);
var dialogBantuan = document.getElementById("dialog-bantuan");
var wadahTopikBantuan = document.getElementById("bantuan-topik");
var wadahIsiBantuan = document.getElementById("bantuan-isi");

// Ikon lampu (gambar tetap buatan sendiri, bukan isian pengguna)
var IKON_LAMPU = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' +
    '<path d="M9 18h6M10 21h4"/><path d="M12 3a6 6 0 0 0-3.6 10.8c.6.5 1 1.2 1.1 2V16h5v-.2c.1-.8.5-1.5 1.1-2A6 6 0 0 0 12 3z"/><path d="M12 7v3"/></svg>';

// Teks dengan **tebal**: dipecah menjadi teks biasa dan <strong>, semuanya lewat textContent
function tulisTeksBantuan(induk, teks) {
    String(teks).split(/\*\*(.+?)\*\*/).forEach(function (bagian, i) {
        if (!bagian) { return; }
        if (i % 2) {
            var tebal = document.createElement("strong");
            tebal.textContent = bagian;
            induk.appendChild(tebal);
        } else {
            induk.appendChild(document.createTextNode(bagian));
        }
    });
}

// Satu blok isi topik menjadi elemen
function buatBlokBantuan(blok) {
    var el;
    if (typeof blok === "string") {
        el = document.createElement("p");
        tulisTeksBantuan(el, blok);
    } else if (blok.langkah || blok.poin) {
        el = document.createElement(blok.langkah ? "ol" : "ul");
        (blok.langkah || blok.poin).forEach(function (teks) {
            var li = document.createElement("li");
            tulisTeksBantuan(li, teks);
            el.appendChild(li);
        });
    } else if (blok.tabel) {
        el = document.createElement("table");
        el.className = "tabel-bantuan";
        var kepala = el.createTHead().insertRow();
        blok.tabel.kolom.forEach(function (judul) {
            var th = document.createElement("th");
            th.textContent = judul;
            kepala.appendChild(th);
        });
        var badan = el.createTBody();
        blok.tabel.baris.forEach(function (baris) {
            var tr = badan.insertRow();
            baris.forEach(function (sel) { tulisTeksBantuan(tr.insertCell(), sel); });
        });
    } else if (blok.catatan) {
        el = document.createElement("p");
        el.className = "catatan-bantuan";
        tulisTeksBantuan(el, blok.catatan);
    } else {
        el = document.createElement("p");
    }
    return el;
}

// Menampilkan satu topik di kanan dan menandai tombolnya di kiri
function tampilkanTopikBantuan(bantuan, nomor) {
    var topik = bantuan.topik[nomor];
    wadahIsiBantuan.textContent = "";
    var judul = document.createElement("h3");
    judul.textContent = topik.judul;
    wadahIsiBantuan.appendChild(judul);
    topik.isi.forEach(function (blok) { wadahIsiBantuan.appendChild(buatBlokBantuan(blok)); });
    wadahIsiBantuan.scrollTop = 0;
    Array.prototype.forEach.call(wadahTopikBantuan.children, function (tombol, i) {
        tombol.setAttribute("aria-current", i === nomor ? "true" : "false");
    });
}

// Membuka popup Petunjuk Penggunaan untuk satu halaman
function bukaBantuan(kunci) {
    var bantuan = DAFTAR_BANTUAN[kunci];
    if (!bantuan) { return; }
    document.getElementById("judul-bantuan").textContent = "Petunjuk Penggunaan · " + bantuan.judul;
    wadahTopikBantuan.textContent = "";
    bantuan.topik.forEach(function (topik, i) {
        var tombol = document.createElement("button");
        tombol.type = "button";
        tombol.textContent = topik.judul;
        tombol.addEventListener("click", function () { tampilkanTopikBantuan(bantuan, i); });
        wadahTopikBantuan.appendChild(tombol);
    });
    tampilkanTopikBantuan(bantuan, 0);
    dialogBantuan.showModal();
    wadahTopikBantuan.firstChild.focus();
}

// Mendaftarkan petunjuk satu halaman dan memasang tombol lampunya.
//   kunci   : id halaman (sama dengan <section id="isi-KUNCI">)
//   bantuan : { judul, topik: [...], tempat: (boleh kosong) pemilih CSS tempat lampu di dalam halaman }
function daftarkanBantuan(kunci, bantuan) {
    DAFTAR_BANTUAN[kunci] = bantuan;
    var seksi = document.getElementById("isi-" + kunci);
    var wadah = seksi && (bantuan.tempat ? seksi.querySelector(bantuan.tempat) : seksi.querySelector(".modul-bar"));
    if (!wadah) { return; }
    var tombol = document.createElement("button");
    tombol.type = "button";
    tombol.className = "tombol-lampu";
    tombol.title = "Petunjuk Penggunaan";
    tombol.setAttribute("aria-label", "Petunjuk Penggunaan " + bantuan.judul);
    tombol.innerHTML = IKON_LAMPU;   // ikon tetap, bukan isian pengguna
    tombol.addEventListener("click", function () { bukaBantuan(kunci); });
    wadah.appendChild(tombol);
}

document.getElementById("tutup-bantuan").addEventListener("click", function () { dialogBantuan.close(); });
document.getElementById("selesai-bantuan").addEventListener("click", function () { dialogBantuan.close(); });
// Klik di latar gelap = tutup
dialogBantuan.addEventListener("click", function (k) { if (k.target === dialogBantuan) { dialogBantuan.close(); } });
