// ==================== Laporan: jendela Modifikasi ====================
// PRD 7 (dari foto Modifikasi Accurate). Baru dua tab:
//   Kolom Data : menampilkan atau menyembunyikan kolom laporan (kolomSembunyi: [judul kolom]; penerapannya di pohon.js)
//   Halaman    : ukuran kertas, orientasi, tinggi kertas fleksibel, dan margin
// Bersifat SEMENTARA (keputusan pengguna 2026-11-06): berlaku pada laporan yang sedang dibuka (kertasLaporanAktif.modifikasi).
// Dibuka lagi tanpa disimpan = kembali ke bawaan; Simpan Laporan menyimpannya bersama laporan (fitur/laporan/tersimpan.js).
// Di layar, kertas mengikuti ukuran dan margin ini lewat variabel CSS (--lap-lebar, --lap-atas, ...; laporan.css).

// Lebar x tinggi dalam mm pada kedudukan tegak
var UKURAN_KERTAS_LAPORAN = { "A4": [210, 297], "A5": [148, 210], "F4": [215, 330], "Letter": [216, 279], "Legal": [216, 356] };
var PIKSEL_PER_MM = 96 / 25.4;
var MARGIN_BAWAAN_LAPORAN = 10;   // seperti foto Accurate

var dialogModifikasi = document.getElementById("dialog-modifikasi-laporan");
var pilihKertasMod = document.getElementById("mod-kertas");
var galatModifikasi = document.getElementById("galat-modifikasi");
var kolomMarginMod = { kiri: document.getElementById("mod-kiri"), kanan: document.getElementById("mod-kanan"),
                       atas: document.getElementById("mod-atas"), bawah: document.getElementById("mod-bawah") };

isiPilihan(pilihKertasMod, Object.keys(UKURAN_KERTAS_LAPORAN), {
    nilai: function (k) { return k; },
    teks: function (k) { return k; }
});

// Margin yang sah: bilangan bulat 0 sampai 50
function marginLaporanSah(n) {
    return Number.isInteger(n) && n >= 0 && n <= 50;
}

// Judul kolom yang disembunyikan (hanya teks). m = modifikasi laporan, boleh kosong atau rusak (Laporan Tersimpan, berkas impor).
function kolomSembunyiDari(m) {
    var k = m && typeof m === "object" ? m.kolomSembunyi : null;
    return Array.isArray(k) ? k.filter(function (j) { return typeof j === "string"; }) : [];
}

// Pengaturan kertas. Data rusak diganti bawaan, satu per satu.
//   mendatarBawaan: laporan berkolom banyak (lap.lebar atau hasil.lebar)
function pengaturanHalamanLaporan(m, mendatarBawaan) {
    var s = m && typeof m === "object" ? m : {};
    var hasil = {
        kertas: UKURAN_KERTAS_LAPORAN[s.kertas] && Object.prototype.hasOwnProperty.call(UKURAN_KERTAS_LAPORAN, s.kertas) ? s.kertas : "A4",
        orientasi: (s.orientasi === "tegak" || s.orientasi === "mendatar") ? s.orientasi : (mendatarBawaan ? "mendatar" : "tegak"),
        fleksibel: s.fleksibel === true
    };
    ["kiri", "kanan", "atas", "bawah"].forEach(function (k) { hasil[k] = marginLaporanSah(s[k]) ? s[k] : MARGIN_BAWAAN_LAPORAN; });
    return hasil;
}

// Lebar x tinggi kertas menurut orientasi, dalam mm
function ukuranHalamanLaporan(p) {
    var u = UKURAN_KERTAS_LAPORAN[p.kertas];
    return p.orientasi === "mendatar" ? [u[1], u[0]] : [u[0], u[1]];
}

// Menerapkan pengaturan ke kertas di layar. Layar sempit diatur laporan.css. PDF membaca pengaturan yang sama (pdf-laporan.js).
function terapkanHalamanLaporan(p) {
    var gaya = document.getElementById("lap-kertas").style;
    gaya.setProperty("--lap-lebar", Math.round(ukuranHalamanLaporan(p)[0] * PIKSEL_PER_MM) + "px");
    ["kiri", "kanan", "atas", "bawah"].forEach(function (k) {
        gaya.setProperty("--lap-" + k, Math.round(p[k] * PIKSEL_PER_MM) + "px");
    });
}

var pilihTabModifikasi = buatPengalihTab(dialogModifikasi.querySelectorAll("[data-mod-tab]"), "modTab",
    { kolom: "mod-panel-kolom", halaman: "mod-panel-halaman" });

// Daftar Kolom Digunakan untuk laporan yang sedang tampil. Judul kolom ditulis lewat textContent (nama Divisi bisa jadi judul kolom).
function gambarDaftarKolomModifikasi() {
    var wadah = document.getElementById("mod-daftar-kolom");
    wadah.textContent = "";
    if (!kolomLengkapLaporan.length) {
        wadah.appendChild(pesanKosongLaporan("Kolom tampil di sini setelah laporan berisi data."));
        return;
    }
    kolomLengkapLaporan.forEach(function (k) {
        var label = document.createElement("label");
        var kotak = document.createElement("input");
        kotak.type = "checkbox";
        kotak.dataset.judul = k.judul;
        kotak.checked = k.kunci || kolomSembunyiLaporan.indexOf(k.judul) === -1;
        kotak.disabled = k.kunci;   // kolom pertama selalu tampil
        label.appendChild(kotak);
        label.appendChild(document.createTextNode(k.judul));
        wadah.appendChild(label);
    });
}

document.getElementById("lap-modifikasi").addEventListener("click", function () {
    if (!kertasLaporanAktif) { return; }
    var p = kertasLaporanAktif.halaman;
    pilihTabModifikasi("kolom");
    gambarDaftarKolomModifikasi();
    pilihKertasMod.value = p.kertas;
    document.querySelectorAll('input[name="mod-orientasi"]').forEach(function (r) { r.checked = r.value === p.orientasi; });
    document.getElementById("mod-fleksibel").checked = p.fleksibel;
    Object.keys(kolomMarginMod).forEach(function (k) { kolomMarginMod[k].value = p[k]; });
    galatModifikasi.hidden = true;
    dialogModifikasi.showModal();
});

document.getElementById("simpan-modifikasi-laporan").addEventListener("click", function () {
    var baru = {
        kertas: pilihKertasMod.value,
        orientasi: document.querySelector('input[name="mod-orientasi"]:checked').value,
        fleksibel: document.getElementById("mod-fleksibel").checked
    };
    var salah = Object.keys(kolomMarginMod).find(function (k) {
        baru[k] = kolomMarginMod[k].value === "" ? NaN : Number(kolomMarginMod[k].value);
        return !marginLaporanSah(baru[k]);
    });
    if (salah) {
        pilihTabModifikasi("halaman");
        galatModifikasi.textContent = "Margin harus bilangan bulat dari 0 sampai 50 mm.";
        galatModifikasi.hidden = false;
        kolomMarginMod[salah].focus();
        return;
    }
    // Kolom yang centangnya dilepas. Laporan tanpa tabel: pilihan kolom lama tetap dipakai.
    var kotakKolom = document.querySelectorAll("#mod-daftar-kolom input");
    baru.kolomSembunyi = kotakKolom.length ? Array.prototype.filter.call(kotakKolom, function (k) { return !k.checked; }).map(function (k) { return k.dataset.judul; })
        : kolomSembunyiLaporan;
    dialogModifikasi.close();
    // Gambar ulang dengan kolom dan kertas baru. Belum tersimpan: hanya untuk laporan yang sedang dibuka.
    tampilkanLaporan(kertasLaporanAktif.lap, kertasLaporanAktif.param, baru);
});

document.getElementById("tutup-modifikasi-laporan").addEventListener("click", function () { dialogModifikasi.close(); });
dialogModifikasi.addEventListener("click", function (k) {
    if (k.target === dialogModifikasi) { dialogModifikasi.close(); }
});
