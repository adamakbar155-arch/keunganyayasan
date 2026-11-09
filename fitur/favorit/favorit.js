// ==================== Transaksi Favorit ====================
// Templat dari transaksi tersimpan, supaya transaksi rutin tidak diketik ulang (PRD 6.8, dari foto Accurate). Tanpa jadwal: favorit hanya mengisi
// formulir Data Baru, dan tidak ada yang tersimpan sebelum tombol Simpan, jadi semua pemeriksaan Simpan tetap berlaku. Favorit tidak menyentuh jurnal.
// Satu data (kunci daftarFavorit): { id, nama, tipe (nama formulir), isi (salinan transaksi tanpa isian khusus), total, dibuatOleh, dibuatPada }
// Tombol di formulir ditandai data-favorit-ambil="<tipe>" dan data-favorit-lain="<tipe>". Dimuat sesudah semua formulir transaksi.
// HTML: fitur/favorit/tampilan.js. Gaya: fitur/favorit/favorit.css.

// Tipe Transaksi: modul formulirnya. Berupa fungsi, karena modul Kas/Bank hanya bisa diambil lewat daftar asal jurnal.
var TIPE_FAVORIT = {
    "Pembayaran": function () { return asalJurnal.pembayaran; },
    "Penerimaan": function () { return asalJurnal.penerimaan; },
    "Jurnal Umum": function () { return { modul: modulJurnal, tab: "jurnal" }; },
    "Pencatatan Donasi": function () { return asalJurnal[SUMBER_JURNAL_DONASI]; }
};
// Isian yang tidak ikut ke templat: selalu baru (tanggal, nomor), atau milik transaksi aslinya. Lampiran tetap milik jurnal aslinya.
var ISIAN_BUKAN_TEMPLAT = ["id", "nomor", "nama", "noJurnal", "aturanId", "tanggal", "noCek", "dibuatOleh", "dibuatPada", "diubahPada", "sumber", "lampiranInfo", "jumlahLampiran"];

function totalTemplat(isi) {
    if (Number(isi.total) > 0) { return Number(isi.total); }
    return rincianAman(isi).reduce(function (n, r) { return n + (Number(r.debit) || 0); }, 0);
}

function buatTemplat(data) {
    var isi = Object.assign({}, data);
    ISIAN_BUKAN_TEMPLAT.forEach(function (k) { delete isi[k]; });
    isi.rincian = rincianAman(data).map(function (r) { return Object.assign({}, r); });
    return isi;
}

var modulFavorit = buatModulDaftar({
    id: "favorit",
    judul: "Transaksi Favorit",
    kunci: "daftarFavorit",
    hanyaDaftar: true,
    labelData: { nama: "Nama Favorit", tipe: "Tipe Transaksi" },
    urutAwal: { kolom: "nama", arah: 1 },
    pesanKosong: "Belum ada favorit. Buka transaksi tersimpan, lalu klik Lainnya, Tambah ke Favorit.",
    kolom: [
        { kunci: "nama", judul: "Nama Favorit", tampil: function (f) { return teksAman(f.nama); } },
        { kunci: "tipe", judul: "Tipe Transaksi", tampil: function (f) { return teksAman(f.tipe); } },
        { kunci: "total", judul: "Nilai", rata: "kanan", tampil: function (f) { return formatAngka(f.total || 0); }, urut: function (f) { return String(f.total || 0).padStart(18, "0"); } }
    ],
    filter: [{ judul: "Tipe Transaksi", ambil: function (f) { return teksAman(f.tipe); } }],
    isiForm: function () { /* halaman ini tanpa formulir */ },
    saatKlikBaris: function (f) { bukaUbahFavorit(f); }
});

// ----- Menu tombol Lainnya -----
var menuLainnya = document.getElementById("menu-lainnya");
var tipeMenuLainnya = "";

function tutupMenuLainnya() { menuLainnya.hidden = true; }

document.querySelectorAll("[data-favorit-lain]").forEach(function (tombol) {
    tombol.addEventListener("click", function (e) {
        e.stopPropagation();
        var buka = menuLainnya.hidden || tipeMenuLainnya !== tombol.dataset.favoritLain;
        tipeMenuLainnya = tombol.dataset.favoritLain;
        menuLainnya.hidden = !buka;
        if (buka) {
            var r = tombol.getBoundingClientRect();
            menuLainnya.style.top = (r.bottom + 6) + "px";
            menuLainnya.style.right = Math.max(window.innerWidth - r.right, 8) + "px";
        }
    });
});
document.addEventListener("click", tutupMenuLainnya);
document.addEventListener("keydown", function (e) { if (e.key === "Escape") { tutupMenuLainnya(); } });

// ----- Popup Favorit -----
var dialogFavorit = document.getElementById("dialog-favorit");
var kolomNamaFavorit = document.getElementById("favorit-nama");
var galatNamaFavorit = document.getElementById("galat-favorit-nama");
var favoritDibuka = null;   // { baru: { tipe, isi, total } } saat menambah, atau { lama: favorit } saat mengubah

function aturPopupFavorit(judul, info, ubah, nama) {
    document.getElementById("judul-dialog-favorit").textContent = judul;
    document.getElementById("favorit-info").textContent = info;
    document.getElementById("hapus-favorit").hidden = !ubah;
    document.getElementById("pakai-favorit").hidden = !ubah;
    kolomNamaFavorit.value = nama;
    galatNamaFavorit.hidden = true;
    dialogFavorit.showModal();
    kolomNamaFavorit.select();
}

document.getElementById("menu-tambah-favorit").addEventListener("click", function () {
    var tipe = tipeMenuLainnya, asal = TIPE_FAVORIT[tipe]();
    if (asal.modul.idDiubah === null) {
        tampilkanNotifikasi("Simpan transaksi dulu, lalu buka dari Daftar untuk dijadikan favorit.", "peringatan");
        return;
    }
    // Yang dijadikan favorit adalah data tersimpan; perubahan di tab yang belum disimpan tidak ikut, jadi diberi tahu dulu
    if (asal.modul.adaPerubahan()) {
        tampilkanNotifikasi("Ada perubahan yang belum disimpan. Simpan dulu, lalu jadikan favorit.", "peringatan");
        return;
    }
    var data = asal.modul.ambil().find(function (d) { return d.id === asal.modul.idDiubah; });
    if (!data) { return; }
    // Gaji hanya boleh dibayar sekali (PRD 6.2), jadi transaksinya tidak boleh diulang lewat templat
    if (rincianAman(data).some(function (r) { return r.gajiId; })) {
        tampilkanNotifikasi("Pembayaran gaji tidak bisa dijadikan favorit, supaya gaji tidak terbayar dua kali.", "peringatan");
        return;
    }
    var isi = buatTemplat(data);
    favoritDibuka = { baru: { tipe: tipe, isi: isi, total: totalTemplat(isi) } };
    aturPopupFavorit("Tambah ke Favorit", tipe + ": " + formatRupiah(favoritDibuka.baru.total), false, teksAman(data.catatan || data.keterangan));
});

function bukaUbahFavorit(f) {
    favoritDibuka = { lama: f };
    aturPopupFavorit("Ubah Favorit", teksAman(f.tipe) + ": " + formatRupiah(f.total || 0), true, teksAman(f.nama));
}

function namaFavoritDipakai(nama, tipe, idSendiri) {
    return modulFavorit.ambil().some(function (f) {
        return f.id !== idSendiri && teksAman(f.tipe) === tipe && teksAman(f.nama).toLowerCase() === nama.toLowerCase();
    });
}

function galatFavorit(pesan) {
    galatNamaFavorit.textContent = pesan;   // textContent: aman dari kode HTML
    galatNamaFavorit.hidden = false;
    kolomNamaFavorit.focus();
}

function simpanFavorit() {
    if (!favoritDibuka) { return; }
    var nama = kolomNamaFavorit.value.trim();
    var lama = favoritDibuka.lama;
    var tipe = lama ? teksAman(lama.tipe) : favoritDibuka.baru.tipe;
    if (!nama) { galatFavorit("Nama Favorit wajib diisi."); return; }
    if (namaFavoritDipakai(nama, tipe, lama ? lama.id : "")) { galatFavorit("Nama ini sudah dipakai favorit " + tipe + " lain."); return; }
    var daftar = modulFavorit.ambil();
    var data = lama
        ? Object.assign({}, lama, { nama: nama })
        : { id: buatId("fav"), nama: nama, tipe: tipe, isi: favoritDibuka.baru.isi, total: favoritDibuka.baru.total, dibuatOleh: penggunaAktif, dibuatPada: waktuSekarang() };
    var daftarBaru = lama ? daftar.map(function (f) { return f.id === lama.id ? data : f; }) : daftar.concat([data]);
    if (!modulFavorit.simpan(daftarBaru)) { return; }
    dialogFavorit.close();
    modulFavorit.selesaiSimpan(!!lama, data, lama || null);
    favoritDibuka = null;
}
document.getElementById("simpan-favorit").addEventListener("click", simpanFavorit);
kolomNamaFavorit.addEventListener("keydown", function (e) { if (e.key === "Enter") { e.preventDefault(); simpanFavorit(); } });
kolomNamaFavorit.addEventListener("input", function () { galatNamaFavorit.hidden = true; });
document.getElementById("tutup-dialog-favorit").addEventListener("click", function () { dialogFavorit.close(); });
document.getElementById("hapus-favorit").addEventListener("click", function () {
    var f = favoritDibuka && favoritDibuka.lama;
    dialogFavorit.close();
    if (f) { modulFavorit.hapus(f); }
});
document.getElementById("pakai-favorit").addEventListener("click", function () {
    var f = favoritDibuka && favoritDibuka.lama;
    dialogFavorit.close();
    if (f) { pakaiFavorit(f); }
});

// ----- Mengambil favorit -----
// Tanggal hari ini; nomor kosong berarti otomatis. Baris mendapat id baru, supaya tidak sama dengan baris transaksi aslinya.
function pakaiFavorit(f) {
    // hasOwnProperty: tipe rusak seperti "constructor" tidak salah terbaca sebagai formulir
    var ambilAsal = Object.prototype.hasOwnProperty.call(TIPE_FAVORIT, teksAman(f.tipe)) ? TIPE_FAVORIT[f.tipe] : null;
    var asal = ambilAsal ? ambilAsal() : null;
    if (!asal || !f.isi || typeof f.isi !== "object") { tampilkanNotifikasi("Favorit ini rusak dan tidak bisa dipakai.", "peringatan"); return; }
    var templat = Object.assign({}, f.isi, { tanggal: tanggalHariIni() });
    templat.rincian = rincianAman(f.isi).map(function (r) { return Object.assign({}, r, { id: buatId("r") }); });
    bukaTab(asal.tab);
    asal.modul.bukaDariTemplat(templat, function () {
        tampilkanNotifikasi('Favorit "' + teksAman(f.nama) + '" terisi. Periksa, lalu Simpan.');
    });
}

var dialogAmbilFavorit = document.getElementById("dialog-ambil-favorit");

document.querySelectorAll("[data-favorit-ambil]").forEach(function (tombol) {
    tombol.addEventListener("click", function () {
        var tipe = tombol.dataset.favoritAmbil;
        if (TIPE_FAVORIT[tipe]().modul.idDiubah !== null) {
            tampilkanNotifikasi("Ambil hanya untuk Data Baru.", "peringatan");
            return;
        }
        var wadah = document.getElementById("daftar-ambil-favorit");
        var daftar = modulFavorit.ambil().filter(function (f) { return teksAman(f.tipe) === tipe; });
        wadah.textContent = "";
        document.getElementById("judul-ambil-favorit").textContent = "Ambil dari Favorit: " + tipe;
        if (!daftar.length) {
            var kosong = document.createElement("p");
            kosong.className = "petunjuk";
            kosong.textContent = "Belum ada favorit " + tipe + ". Buka transaksi tersimpan, lalu klik Lainnya, Tambah ke Favorit.";
            wadah.appendChild(kosong);
        }
        daftar.sort(function (a, b) { return teksAman(a.nama).localeCompare(teksAman(b.nama), "id"); }).forEach(function (f) {
            var b = document.createElement("button");
            b.type = "button";
            var nama = document.createElement("span");
            nama.textContent = teksAman(f.nama);   // textContent: aman dari kode HTML
            var nilai = document.createElement("span");
            nilai.textContent = formatRupiah(f.total || 0);
            b.appendChild(nama);
            b.appendChild(nilai);
            b.addEventListener("click", function () {
                dialogAmbilFavorit.close();
                pakaiFavorit(f);
            });
            wadah.appendChild(b);
        });
        dialogAmbilFavorit.showModal();
    });
});
document.getElementById("tutup-ambil-favorit").addEventListener("click", function () { dialogAmbilFavorit.close(); });

saatTabDibuka.favorit = function () { modulFavorit.gambarTabel(); };

function bukaFavorit() { bukaTab("favorit"); }
