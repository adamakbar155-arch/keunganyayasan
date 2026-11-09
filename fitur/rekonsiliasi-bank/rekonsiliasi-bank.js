// ==================== Rekonsiliasi Bank (Kas & Bank) ====================
// Mencocokkan transaksi Kas/Bank di aplikasi dengan rekening koran yang dilihat sendiri (PRD 6.3, dari foto Accurate).
// - Baris dan saldo diambil dari historiAkun (fitur/jurnal/jurnal.js), cara hitung yang sama dengan Histori Bank.
// - Tanda cocok disimpan lewat bacaTandaRekonsiliasi/simpanTandaRekonsiliasi (fitur/jurnal/jurnal.js), per jurnal + akun.
// - Transaksi yang sudah ditandai tidak bisa diubah/dihapus; penjaganya ada di formulir masing-masing
//   (galatSudahRekonsiliasi dan galatTransaksiSudahRekonsiliasi di fitur/jurnal/jurnal.js).
// HTML-nya: fitur/rekonsiliasi-bank/tampilan.js. Gaya: fitur/rekonsiliasi-bank/rekonsiliasi-bank.css.
// Dimuat sesudah fitur/jurnal/jurnal.js dan fitur/histori-bank/histori-bank.js.
// Semua nama (var dan function) di sini tetap bisa dipakai skrip lain, karena skrip biasa berbagi satu ruang nama.

var pilihKasRekon = document.getElementById("rekonsiliasi-kas");
var kolomDariRekon = document.getElementById("rekonsiliasi-dari");
var kolomSampaiRekon = document.getElementById("rekonsiliasi-sampai");
var centangTampilCocok = document.getElementById("rekonsiliasi-tampil-cocok");
var daftarRekon = document.getElementById("rekonsiliasi-daftar");
var petunjukRekon = document.getElementById("petunjuk-rekonsiliasi");
// Konfirmasi "Apakah transaksi ini ada tercetak..." hanya ditanyakan sekali setiap halaman dibuka (PRD 6.3)
var rekonSudahDikonfirmasi = false;

function tampilkanPetunjukRekon(teks) {
    petunjukRekon.textContent = teks;
    petunjukRekon.hidden = !teks;
}

// Nama akun lawan: akun lain di jurnal yang sama, misalnya "Beban Listrik" untuk pembayaran listrik
function akunLawanRekon(jurnal, idKas) {
    var nama = [];
    rincianAman(jurnal).forEach(function (r) {
        var n = teksAman(r.nama);
        if (r.akunId !== idKas && n && nama.indexOf(n) === -1) { nama.push(n); }
    });
    return nama.join(", ");
}

// Satu elemen teks kecil di kartu (textContent: aman dari kode HTML)
function teksKartuRekon(induk, tag, kelas, teks) {
    var el = document.createElement(tag);
    el.className = kelas;
    el.textContent = teks;
    induk.appendChild(el);
    return el;
}

// Satu baris: kartu transaksi di kiri, tombol di kanan
function barisRekon(b, idKas, tanda) {
    var baris = document.createElement("div");
    baris.className = "rekon-baris" + (tanda ? " rekon-cocok" : "");

    var kartu = document.createElement("div");
    kartu.className = "rekon-kartu baris-data";
    kartu.tabIndex = 0;
    kartu.title = "Klik untuk membuka transaksi asalnya";
    var atas = document.createElement("div");
    atas.className = "rekon-kartu-atas";
    teksKartuRekon(atas, "span", "rekon-tanggal", formatTanggal(b.tanggal));
    var lawan = akunLawanRekon(b.jurnal, idKas);
    teksKartuRekon(atas, "span", "rekon-tipe", b.tipe + (lawan ? " - " + lawan : ""));
    teksKartuRekon(atas, "span", "rekon-nilai" + (b.dk === "Cr" ? " angka-negatif" : ""), formatAngka(b.mutasi) + " (" + b.dk + ")");
    kartu.appendChild(atas);
    if (b.keterangan) { teksKartuRekon(kartu, "div", "rekon-keterangan", b.keterangan); }
    teksKartuRekon(kartu, "div", "rekon-nomor", b.nomor + (b.noCek ? " - No Cek " + b.noCek : ""));
    // Klik kartu membuka transaksi asalnya (sama seperti Histori Bank)
    function bukaAsal() {
        if (!bukaAsalJurnal(b.jurnal)) { tampilkanNotifikasi("Transaksi asal baris ini sudah tidak ada.", "peringatan"); }
    }
    kartu.addEventListener("click", bukaAsal);
    kartu.addEventListener("keydown", function (e) { if (e.key === "Enter") { e.preventDefault(); bukaAsal(); } });
    baris.appendChild(kartu);

    var tombol = document.createElement("button");
    tombol.type = "button";
    if (tanda) {
        tombol.className = "tombol tombol-garis";
        tombol.textContent = "Batalkan";
        tombol.title = "Ditandai cocok oleh " + teksAman(tanda.ditandaiOleh) + " pada " + teksAman(tanda.ditandaiPada).replace("T", " ");
        // Batalkan (unceklis): alat bersama di fitur/jurnal/jurnal.js, lalu gambar ulang daftar
        tombol.addEventListener("click", function () {
            if (batalkanTandaRekonsiliasi(tanda.id, b.nomor)) { gambarRekonsiliasiBank(); }
        });
    } else {
        tombol.className = "tombol tombol-utama";
        tombol.textContent = "Ada di Rekening Koran";
        tombol.addEventListener("click", function () { mintaTandaiRekon(b, idKas); });
    }
    baris.appendChild(tombol);
    daftarRekon.appendChild(baris);
}

// Menggambar ulang daftar dari pilihan Kas/Bank, rentang tanggal, dan centang "Tampilkan yang sudah cocok"
function gambarRekonsiliasiBank() {
    var kosong = document.getElementById("rekonsiliasi-kosong");
    var barisSaldo = document.getElementById("rekonsiliasi-saldo-baris");
    daftarRekon.textContent = "";
    kosong.hidden = true;
    barisSaldo.title = "";
    document.getElementById("rekonsiliasi-saldo").textContent = formatRupiah(0);
    document.getElementById("rekonsiliasi-belum").textContent = "";
    var idKas = pilihKasRekon.value, dari = kolomDariRekon.value, sampai = kolomSampaiRekon.value;
    if (!idKas) { tampilkanPetunjukRekon("Pilih Kas/Bank yang akan direkonsiliasi."); return; }
    if (!dari || !sampai) { tampilkanPetunjukRekon("Isi tanggal dari dan sampai."); return; }
    if (dari > sampai) { tampilkanPetunjukRekon("Tanggal dari tidak boleh sesudah tanggal sampai."); return; }
    tampilkanPetunjukRekon("");

    var hasil = historiAkun(idKas, dari, sampai);
    var tanda = bacaTandaRekonsiliasi();
    // Saldo per tanggal sampai = saldo baris terakhir (atau saldo awal kalau tidak ada transaksi)
    var saldo = hasil.baris.length ? hasil.baris[hasil.baris.length - 1].saldo : hasil.saldoAwal;
    barisSaldo.title = "Saldo per " + formatTanggal(sampai);
    document.getElementById("rekonsiliasi-saldo").textContent = formatRupiah(saldo);

    var belum = 0, tampil = 0;
    hasil.baris.forEach(function (b) {
        var t = tandaRekonsiliasiUntuk(tanda, b.jurnal.id, idKas);
        if (!t) { belum += 1; }
        // Yang sudah cocok hilang dari daftar, kecuali "Tampilkan yang sudah cocok" dicentang
        if (t && !centangTampilCocok.checked) { return; }
        tampil += 1;
        barisRekon(b, idKas, t);
    });
    document.getElementById("rekonsiliasi-belum").textContent = belum > 0 ? belum + " data belum cocok" : "";
    // Tidak ada yang perlu dicocokkan (rentang tanpa transaksi, atau semua sudah cocok): tampilan kosong seperti Accurate
    kosong.hidden = tampil > 0;
}

// Tombol "Ada di Rekening Koran": tanya sekali per halaman dibuka, lalu tandai
function mintaTandaiRekon(b, idKas) {
    if (rekonSudahDikonfirmasi) { tandaiRekon(b, idKas); return; }
    tanyaKonfirmasi({
        judul: "Rekonsiliasi Bank",
        pesan: "Apakah transaksi ini ada tercetak dalam rekening koran?",
        nama: b.nomor,
        labelYa: "Ya"
    }, function () {
        rekonSudahDikonfirmasi = true;
        tandaiRekon(b, idKas);
    });
}

function tandaiRekon(b, idKas) {
    var daftar = bacaTandaRekonsiliasi();
    // Sudah ditandai (misalnya dari tab lain): cukup gambar ulang, jangan dobel
    if (!tandaRekonsiliasiUntuk(daftar, b.jurnal.id, idKas)) {
        daftar.push({ id: buatId("rk"), jurnalId: b.jurnal.id, akunId: idKas, ditandaiOleh: penggunaAktif, ditandaiPada: waktuSekarang() });
        if (!simpanTandaRekonsiliasi(daftar)) { return; }
        catatLog({ tindakan: "Tandai cocok", tipe: "Rekonsiliasi Bank", referensi: b.nomor });
    }
    gambarRekonsiliasiBank();
}

[pilihKasRekon, kolomDariRekon, kolomSampaiRekon, centangTampilCocok].forEach(function (el) { el.addEventListener("change", gambarRekonsiliasiBank); });
document.getElementById("rekonsiliasi-segarkan").addEventListener("click", gambarRekonsiliasiBank);

// Setiap tab dibuka: muat ulang pilihan Kas/Bank (akun Kas & Bank tingkat 3, alat bersama isiPilihanKasBank;
// PRD 5.1); tanggal bawaan awal bulan ini s/d hari ini; gambar ulang
saatTabDibuka["rekonsiliasi-bank"] = function () {
    isiPilihanKasBank(pilihKasRekon, { kosongKalauTakAda: "Belum ada akun Kas/Bank tingkat 3", terpilih: pilihKasRekon.value });
    if (!kolomDariRekon.value) { kolomDariRekon.value = tanggalHariIni().slice(0, 8) + "01"; }
    if (!kolomSampaiRekon.value) { kolomSampaiRekon.value = tanggalHariIni(); }
    gambarRekonsiliasiBank();
};

// Dipanggil dari popup Kas & Bank, kotak Rekonsiliasi Bank. Halaman dibuka = konfirmasi ditanyakan lagi sekali.
function bukaRekonsiliasiBank() {
    rekonSudahDikonfirmasi = false;
    bukaTab("rekonsiliasi-bank");
}
