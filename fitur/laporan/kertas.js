// ==================== Laporan: kertas hasil laporan ====================
// Tab hasil laporan bergaya profesional khas aplikasi (PRD 7, keputusan pengguna 2026-11-03; tugas I.1g-2), dipakai
// bersama semua laporan. Kertas putih, garis biru tua + potongan oranye di atas, kepala di tengah:
//   NAMA YAYASAN (Preferensi > Data), judul laporan, "Untuk periode ... sampai ..." (atau "Per ..."),
//   "(Dinyatakan dalam Rupiah)", keterangan filter (Divisi, Program) kecil di kanan atas isi, dan kaki "Dicetak ...".
// Saat dicetak, nomor "Halaman x dari y" dan tulisan "Dicetak ..." ada di bawah SETIAP halaman PDF (fitur/laporan/pdf-laporan.js).
// Pemakaian:
//   bukaLaporan(lap, paramSebelumnya) : jendela Parameter dulu, lalu laporannya (kartu di menu, tombol Ubah Parameter)
//   tampilkanLaporan(lap, param)      : langsung menggambar laporan (juga dari Laporan Tersimpan)
// lap = data dari DAFTAR_LAPORAN. lap.gambar(param) mengembalikan:
//   { isi: elemen tabel atau pesan kosong, judul: (boleh kosong) pengganti judul, catatan: (boleh kosong) [teks],
//     lebar: (boleh kosong) true kalau kali ini kolomnya banyak, bawaan kertasnya mendatar }
// HTML: fitur/laporan/tampilan.js. Gaya: fitur/laporan/laporan.css.

var kertasLaporanAktif = null;   // { lap, param } laporan yang sedang tampil (untuk Ubah Parameter dan Simpan Laporan)

// Nama dari daftar id terpilih; data yang sudah dihapus tetap disebut supaya pembaca tahu ada filter
function namaPilihanLaporan(ids, daftar) {
    return ids.map(function (id) {
        var b = daftar.find(function (x) { return x && teksAman(x.id) === id; });
        return b ? teksAman(b.nama) : "(sudah dihapus)";
    }).join(", ");
}

// "Divisi: Semua Divisi · Program: Semua" atau nama-nama yang dipilih. Hanya isian yang berlaku untuk laporan itu.
function teksFilterLaporan(lap, param) {
    var p = lap.parameter || {};
    var bagian = [];
    if (p.filter !== false && p.filter !== "program") {
        bagian.push("Divisi: " + (param.divisi.length ? namaPilihanLaporan(param.divisi, bacaDivisi()) : "Semua Divisi"));
    }
    if (p.filter !== false && p.filter !== "divisi") {
        bagian.push("Program: " + (param.program.length ? namaPilihanLaporan(param.program, bacaProgram()) : "Semua"));
    }
    if (p.akun === true) {
        bagian.push("Akun: " + (param.akun.length ? namaPilihanLaporan(param.akun, bacaDaftarAkun()) : "Semua"));
    }
    return bagian.join(" · ");
}

// Waktu dibuat: "3 Nov 2026, 13.12" (tanggal mengikuti format Preferensi)
function teksWaktuDicetak() {
    var j = new Date();
    return formatTanggal(tanggalHariIni()) + ", " + String(j.getHours()).padStart(2, "0") + "." + String(j.getMinutes()).padStart(2, "0");
}

// Laporan perBulan: tanggal Dari menjadi awal bulan dan s/d menjadi akhir bulan (PRD 7, laporan Perbandingan Anggaran)
function paramBulanPenuh(param) {
    var s = param.sampai.split("-");
    var hariAkhir = new Date(Number(s[0]), Number(s[1]), 0).getDate();
    return Object.assign({}, param, { dari: param.dari.slice(0, 8) + "01", sampai: param.sampai.slice(0, 8) + String(hariAkhir).padStart(2, "0") });
}

// "2026-01-15" -> "Januari 2026"
function teksBulanPanjang(tanggal) {
    return (namaBulanKalender[Number(tanggal.slice(5, 7)) - 1] || "") + " " + tanggal.slice(0, 4);
}

function teksPeriodeLaporan(lap, param) {
    if (lap.perBulan === true) { return "Dari periode " + teksBulanPanjang(param.dari) + " s/d " + teksBulanPanjang(param.sampai); }
    return lap.perTanggal === true
        ? "Per " + formatTanggal(param.sampai)
        : "Untuk periode " + formatTanggal(param.dari) + " sampai " + formatTanggal(param.sampai);
}

// modifikasi = (boleh kosong) isi jendela Modifikasi; kosong = tampilan bawaan
function tampilkanLaporan(lap, paramAwal, modifikasi) {
    var param = lap.perBulan === true ? paramBulanPenuh(paramAwal) : paramAwal;
    kolomLengkapLaporan = [];   // laporan tanpa tabel (pesan kosong) tidak punya kolom
    kolomSembunyiLaporan = kolomSembunyiDari(modifikasi);   // Kolom Data; dipakai pembuat tabel (pohon.js)
    // Rentang untuk klik baris (rincian-baris.js). Laporan per tanggal: semua transaksi sampai tanggal itu.
    rentangRincianLaporan = { dari: lap.perTanggal === true ? "" : param.dari, sampai: param.sampai, divisi: param.divisi, program: param.program };
    var hasil = lap.gambar(param);
    var namaYayasan = teksAman(bacaPengaturan(KUNCI_YAYASAN, {}).nama).trim();   // data rusak tetap aman (teksAman)
    // Semua teks lewat textContent: aman dari kode HTML
    document.getElementById("judul-tab-hasil-laporan").textContent = hasil.judul || lap.nama;
    document.getElementById("lap-k-yayasan").textContent = namaYayasan || "Nama yayasan belum diisi (Preferensi, Data)";
    document.getElementById("lap-k-judul").textContent = hasil.judul || lap.nama;
    document.getElementById("lap-k-periode").textContent = teksPeriodeLaporan(lap, param);
    document.getElementById("lap-k-filter").textContent = teksFilterLaporan(lap, param);
    var isi = document.getElementById("lap-k-isi");
    isi.textContent = "";
    isi.appendChild(hasil.isi);
    var catatan = document.getElementById("lap-k-catatan");
    catatan.textContent = "";
    (hasil.catatan || []).forEach(function (teks) {
        var p = document.createElement("p");
        p.textContent = teks;
        catatan.appendChild(p);
    });
    document.getElementById("lap-k-dicetak").textContent = "Dicetak " + teksWaktuDicetak();
    // Ukuran kertas dan margin laporan ini (fitur/laporan/modifikasi.js); berkolom banyak = mendatar kecuali diatur lain
    var halaman = pengaturanHalamanLaporan(modifikasi, lap.lebar === true || hasil.lebar === true);
    // paramAwal: jendela Parameter tetap menampilkan tanggal yang dipilih pengguna, bukan tanggal yang sudah dibulatkan
    kertasLaporanAktif = { lap: lap, param: paramAwal, halaman: halaman, modifikasi: modifikasi || null };
    document.getElementById("lap-cetak-audit").hidden = typeof lap.cetakAudit !== "function";
    bukaTab("hasil-laporan");
    terapkanHalamanLaporan(halaman);   // sesudah tab terbuka: tinggi kertas baru bisa diukur
}

function bukaLaporan(lap, awal, modifikasi) {
    bukaParameterLaporan(lap, function (param) { tampilkanLaporan(lap, param, modifikasi); }, awal);
}

// Parameter: buka lagi jendela Parameter dengan isian yang sedang dipakai; Tampilkan menggambar ulang laporannya.
// Laporan yang sama masih dikerjakan, jadi modifikasinya tetap dipakai.
document.getElementById("lap-ubah-parameter").addEventListener("click", function () {
    if (kertasLaporanAktif) { bukaLaporan(kertasLaporanAktif.lap, kertasLaporanAktif.param, kertasLaporanAktif.modifikasi); }
});

// Isi kertas sebagai baris CSV (umum/komponen-daftar.js menjaga selnya aman). Angka dikembalikan ke bentuk yang dibaca Excel: "-" jadi 0, "(1.500)" jadi -1.500.
function barisCsvLaporan() {
    var baris = [[document.getElementById("lap-k-yayasan").textContent], [document.getElementById("lap-k-judul").textContent],
                 [document.getElementById("lap-k-periode").textContent]];
    var filter = document.getElementById("lap-k-filter").textContent;
    if (filter) { baris.push([filter]); }
    baris.push([]);
    function teksSel(sel) {
        var t = sel.textContent;
        if (!sel.classList.contains("lap-n")) { return t; }
        var kurung = /^\((.+)\)$/.exec(t);
        return t === "-" ? "0" : (kurung ? "-" + kurung[1] : t);
    }
    document.querySelectorAll("#lap-k-isi tr").forEach(function (tr) {
        var isi = [];
        Array.prototype.forEach.call(tr.cells, function (sel) {
            isi.push(teksSel(sel));
            for (var i = 1; i < sel.colSpan; i++) { isi.push(""); }   // sel merentang: kolom berikutnya tetap sejajar di CSV
        });
        baris.push(isi);
    });
    document.querySelectorAll("#lap-k-catatan p").forEach(function (p) { baris.push([p.textContent]); });
    return baris;
}

// Isi kertas untuk Excel: kepala tebal; angka tetap angka (data-angka di tabel) supaya bisa dijumlah di Excel.
// Baris kelompok dan baris jumlah tebal. Lebar kolom menurut isi terpanjang, paling lebar 45 huruf.
function isiExcelLaporan() {
    function kepala(id, tebal) { return [{ nilai: document.getElementById(id).textContent, tebal: tebal }]; }
    var baris = [kepala("lap-k-yayasan", true), kepala("lap-k-judul", true), kepala("lap-k-periode", false)];
    if (document.getElementById("lap-k-filter").textContent) { baris.push(kepala("lap-k-filter", false)); }
    baris.push([]);
    var lebar = [];
    document.querySelectorAll("#lap-k-isi tr").forEach(function (tr) {
        var tebal = !!tr.closest("thead") || /lap-b-(bagian|judul|jumlah|total|akhir)/.test(tr.className);
        var isi = [];
        Array.prototype.forEach.call(tr.cells, function (sel) {
            var angka = sel.dataset.angka;
            isi.push({ nilai: angka === undefined ? sel.textContent : Number(angka), tebal: tebal });
            // Sel yang merentang tidak menentukan lebar kolom pertamanya
            if (sel.colSpan === 1) { lebar[isi.length - 1] = Math.max(lebar[isi.length - 1] || 10, Math.min(45, sel.textContent.length + 2)); }
            for (var i = 1; i < sel.colSpan; i++) { isi.push(null); }
        });
        baris.push(isi);
    });
    document.querySelectorAll("#lap-k-catatan p").forEach(function (p) { baris.push([{ nilai: p.textContent }]); });
    return { baris: baris, lebar: lebar };
}

function namaBerkasLaporan(judul) {
    return judul.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
}

// Unduh PDF, Excel, CSV. Cetak dan PDF: fitur/laporan/pdf-laporan.js.
var aksiUnduhLaporan = {
    pdf: function () { unduhPdfLaporan(); },
    excel: function () {
        var judul = document.getElementById("lap-k-judul").textContent;
        var isi = isiExcelLaporan();
        unduhTeks(namaBerkasLaporan(judul) + ".xlsx", buatBerkasExcel(judul, isi.baris, isi.lebar), TIPE_BERKAS_EXCEL);
        tampilkanNotifikasi(judul + " telah diunduh");
    },
    csv: function () {
        var judul = document.getElementById("lap-k-judul").textContent;
        unduhCsv(namaBerkasLaporan(judul) + ".csv", barisCsvLaporan());   // sel CSV aman: umum/komponen-daftar.js
        tampilkanNotifikasi(judul + " telah diunduh");
    }
};
var tombolUnduhLaporan = document.getElementById("lap-unduh");
var menuUnduhLaporan = document.getElementById("lap-menu-unduh");
function aturMenuUnduhLaporan(buka) {
    menuUnduhLaporan.hidden = !buka;
    tombolUnduhLaporan.setAttribute("aria-expanded", buka ? "true" : "false");
}
tombolUnduhLaporan.addEventListener("click", function () {
    aturMenuUnduhLaporan(menuUnduhLaporan.hidden);
    if (!menuUnduhLaporan.hidden) { menuUnduhLaporan.querySelector("button").focus(); }
});
menuUnduhLaporan.addEventListener("click", function (k) {
    var jenis = k.target.dataset ? k.target.dataset.unduh : "";
    if (!aksiUnduhLaporan[jenis]) { return; }
    aturMenuUnduhLaporan(false);
    aksiUnduhLaporan[jenis]();
});
// Klik di luar menu atau tombol Esc menutup menu
document.addEventListener("click", function (k) {
    if (!menuUnduhLaporan.hidden && !k.target.closest(".lap-alat-bungkus")) { aturMenuUnduhLaporan(false); }
});
menuUnduhLaporan.addEventListener("keydown", function (k) {
    if (k.key === "Escape") { aturMenuUnduhLaporan(false); tombolUnduhLaporan.focus(); }
});
