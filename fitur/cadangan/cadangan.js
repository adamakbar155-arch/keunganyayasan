// ==================== Cadangan Data ====================
// Berisi: mengunduh semua data aplikasi ke satu file cadangan dan memulihkannya (memakai daftar jenisKunciCadangan).
// HTML-nya ada di fitur/cadangan/tampilan.js. Dipanggil dari index.html sesudah fitur/cetakan/cetakan.js, supaya semua halaman sudah mendaftarkan kunci datanya.
// Semua nama (var dan function) di sini tetap bisa dipakai skrip lain, karena skrip biasa berbagi satu ruang nama.

// ---------- Cadangan Data ----------
// Cadangan = satu file JSON berisi semua data aplikasi. Pulihkan = mengganti semua data dengan isi file.
// Yang disentuh HANYA kunci milik aplikasi ini (daftar di jenisKunciCadangan), supaya proyek lain
// yang kebetulan memakai penyimpanan browser yang sama (alamat 127.0.0.1:5500) tidak ikut terbaca atau terhapus.
var FORMAT_CADANGAN = { aplikasi: "Aplikasi Keuangan", versi: 1 };
var KUNCI_CADANGAN_TERAKHIR = "cadanganTerakhirDibuat";   // catatan kapan cadangan terakhir dibuat (bukan bagian cadangan)

// Nama yang tampil untuk tiap kunci di tabel ringkasan. Kunci yang tidak disebut di sini tetap ikut
// dicadangkan dan dipulihkan, hanya tidak tampil di tabel. Halaman berdaftar baru sebaiknya ditambahkan di sini.
var labelRingkasanCadangan = [
    { kunci: "dataYayasan", label: "Data yayasan (Preferensi)", jenis: "ada" },
    { kunci: "daftarDivisi", label: "Divisi" },
    { kunci: "daftarProgram", label: "Program" },
    { kunci: "daftarKaryawan", label: "Karyawan" },
    { kunci: "daftarGaji", label: "Gaji/Tunjangan" },
    { kunci: "daftarPengguna", label: "Pengguna" },
    { kunci: "daftarPenomoran", label: "Aturan penomoran" },
    { kunci: "daftarCetakan", label: "Desain cetakan" },
    { kunci: "daftarJurnal", label: "Jurnal Umum" },
    { kunci: "daftarPencatatanGaji", label: "Pencatatan Gaji" },
    { kunci: "daftarPembayaran", label: "Pembayaran" },
    { kunci: "daftarPenerimaan", label: "Penerimaan" },
    { kunci: "daftarTransfer", label: "Transfer Bank" },
    { kunci: "tandaRekonsiliasi", label: "Tanda rekonsiliasi bank" },
    { kunci: "daftarAkun", label: "Akun" },
    { kunci: "logAktivitas", label: "Catatan Log Aktivitas" }
];
var kunciPengaturanPreferensi = ["fiturYayasan", "pembatasanYayasan", "lampiranYayasan", "akunPerkiraanYayasan", "formatYayasan"];

// Mengambil semua data aplikasi dari penyimpanan browser sebagai objek { kunci: nilai }.
// Nilai disimpan sebagai data (bukan teks), supaya file cadangan mudah dibaca dan diperiksa.
function ambilDataAplikasi() {
    var hasil = {};
    Object.keys(jenisKunciCadangan).forEach(function (kunci) {
        try {
            var teks = localStorage.getItem(kunci);
            if (teks !== null) { hasil[kunci] = JSON.parse(teks); }
        } catch (galat) {
            // Nilai yang rusak dilewati; tidak boleh menggagalkan seluruh cadangan
        }
    });
    return hasil;
}

function waktuBerkas() {
    return waktuSekarang().replace("T", "_").replace(/:/g, "-");   // contoh: 2026-10-23_09-40-37
}

// Menyusun isi file cadangan (teks JSON dengan lekukan supaya bisa dibaca manusia)
function susunIsiCadangan() {
    return JSON.stringify({
        aplikasi: FORMAT_CADANGAN.aplikasi,
        versiFormat: FORMAT_CADANGAN.versi,
        dibuatPada: waktuSekarang(),
        data: ambilDataAplikasi()
    }, null, 2);
}

// Mengunduh file cadangan (JSON) lewat alat bersama unduhTeks (umum/alat.js). Mengembalikan true kalau berhasil dimulai.
function unduhBerkas(namaBerkas, isi) {
    return unduhTeks(namaBerkas, isi, "application/json");
}

// Jumlah isi sebuah nilai: panjang daftar, atau 1 / 0 untuk objek yang ada / tidak ada
function jumlahIsi(data, kunci) {
    if (!(kunci in data)) { return 0; }
    return Array.isArray(data[kunci]) ? data[kunci].length : 1;
}

// Ringkasan untuk ditampilkan: [{ label, nilai }] dari objek data. Baris "Akun" hanya tampil kalau ada isinya.
function ringkasanCadangan(data) {
    var baris = [];
    labelRingkasanCadangan.forEach(function (r) {
        var jumlah = jumlahIsi(data, r.kunci);
        if (r.kunci === "daftarAkun" && jumlah === 0) { return; }
        baris.push({ label: r.label, nilai: r.jenis === "ada" ? (jumlah ? "Ada" : "Belum ada") : String(jumlah), jumlah: jumlah });
    });
    var adaPengaturan = kunciPengaturanPreferensi.filter(function (k) { return k in data; }).length;
    baris.push({ label: "Pengaturan Preferensi", nilai: adaPengaturan + " dari " + kunciPengaturanPreferensi.length + " bagian", jumlah: adaPengaturan });
    return baris;
}

// Memeriksa teks isi file cadangan. Hasil: { ok: true, isi } atau { ok: false, galat: "pesan" }.
// Tidak mengubah apa pun; hanya membaca dan memeriksa.
function periksaIsiCadangan(teks) {
    var isi;
    try { isi = JSON.parse(teks); } catch (galat) {
        return { ok: false, galat: "File ini bukan file cadangan yang benar (isinya bukan JSON)." };
    }
    if (!isi || typeof isi !== "object" || Array.isArray(isi) || isi.aplikasi !== FORMAT_CADANGAN.aplikasi) {
        return { ok: false, galat: "File ini bukan cadangan Aplikasi Keuangan." };
    }
    if (isi.versiFormat !== FORMAT_CADANGAN.versi) {
        return { ok: false, galat: "Versi file cadangan (" + isi.versiFormat + ") tidak dikenali oleh aplikasi ini." };
    }
    if (!isi.data || typeof isi.data !== "object" || Array.isArray(isi.data)) {
        return { ok: false, galat: "File cadangan rusak: bagian data tidak ditemukan." };
    }
    // Setiap kunci yang dikenal harus berbentuk benar (daftar atau objek). Kunci yang tidak dikenal diabaikan.
    var salah = Object.keys(isi.data).filter(function (kunci) {
        var jenis = jenisKunciCadangan[kunci];
        if (!jenis) { return false; }
        var nilai = isi.data[kunci];
        return jenis === "daftar" ? !Array.isArray(nilai) : (nilai === null || typeof nilai !== "object" || Array.isArray(nilai));
    });
    if (salah.length) {
        return { ok: false, galat: "File cadangan rusak: bentuk data \"" + salah[0] + "\" tidak benar." };
    }
    return { ok: true, isi: isi };
}

// Mengganti semua data aplikasi dengan isi cadangan. Semua-atau-tidak-sama-sekali:
// kalau ada kegagalan di tengah jalan (misalnya penyimpanan penuh), keadaan awal dikembalikan.
// Kunci yang tidak ada di file dihapus, supaya hasilnya sama persis dengan isi file.
function terapkanCadangan(data) {
    var keadaanAwal = {};
    Object.keys(jenisKunciCadangan).forEach(function (kunci) { keadaanAwal[kunci] = localStorage.getItem(kunci); });
    try {
        Object.keys(jenisKunciCadangan).forEach(function (kunci) {
            if (kunci in data) {
                localStorage.setItem(kunci, JSON.stringify(data[kunci]));
            } else {
                localStorage.removeItem(kunci);
            }
        });
        return { ok: true };
    } catch (galat) {
        // Kembalikan semuanya seperti semula
        Object.keys(keadaanAwal).forEach(function (kunci) {
            try {
                if (keadaanAwal[kunci] === null) { localStorage.removeItem(kunci); } else { localStorage.setItem(kunci, keadaanAwal[kunci]); }
            } catch (galat2) { /* abaikan: sudah usaha terbaik */ }
        });
        return { ok: false, galat: "Penyimpanan browser penuh atau diblokir. Data tidak diubah." };
    }
}

// Dipisah supaya bisa diganti saat pengujian
var muatUlangHalaman = function () { window.location.reload(); };

// ----- Tampilan -----
var infoCadanganTerakhir = document.getElementById("cadangan-terakhir");
var galatCadangan = document.getElementById("galat-cadangan");
var hasilPeriksa = document.getElementById("hasil-periksa");
var berkasCadangan = document.getElementById("berkas-cadangan");
var isiCadanganTerpilih = null;     // hasil pemeriksaan file yang sedang dipilih
var namaBerkasTerpilih = "";

function isiTabelRingkasan(badan, kolom) {
    badan.textContent = "";
    kolom.forEach(function (baris) {
        var tr = document.createElement("tr");
        baris.forEach(function (sel, i) {
            var td = document.createElement("td");
            td.textContent = sel;              // textContent: aman dari kode HTML
            if (i > 0) { td.className = "kanan"; }
            tr.appendChild(td);
        });
        badan.appendChild(tr);
    });
}

function perbaruiHalamanCadangan() {
    var terakhir = null;
    try { terakhir = localStorage.getItem(KUNCI_CADANGAN_TERAKHIR); } catch (galat) { terakhir = null; }
    infoCadanganTerakhir.textContent = terakhir
        ? formatTanggal(terakhir.slice(0, 10)) + " " + terakhir.slice(11)
        : "belum pernah";
    isiTabelRingkasan(document.getElementById("ringkasan-sekarang"),
        ringkasanCadangan(ambilDataAplikasi()).map(function (r) { return [r.label, r.nilai]; }));
}

saatTabDibuka.cadangan = perbaruiHalamanCadangan;

// Tombol Buat Cadangan
document.getElementById("tombol-buat-cadangan").addEventListener("click", function () {
    var namaBerkas = "cadangan-aplikasi-keuangan-" + waktuBerkas() + ".json";
    if (!unduhBerkas(namaBerkas, susunIsiCadangan())) {
        tampilkanNotifikasi("Cadangan gagal dibuat.", "galat");
        return;
    }
    try { localStorage.setItem(KUNCI_CADANGAN_TERAKHIR, waktuSekarang()); } catch (galat) { /* tidak fatal */ }
    catatLog({ tindakan: "Buat", tipe: "Cadangan Data", referensi: namaBerkas });
    perbaruiHalamanCadangan();
    tampilkanNotifikasi("Cadangan telah dibuat. Simpan file di tempat aman.");
});

// Memilih file: dibaca dan diperiksa dulu, belum ada yang diubah
function tampilkanGalatCadangan(pesan) {
    galatCadangan.textContent = pesan;
    galatCadangan.hidden = false;
    hasilPeriksa.hidden = true;
    isiCadanganTerpilih = null;
}

berkasCadangan.addEventListener("change", function () {
    galatCadangan.hidden = true;
    hasilPeriksa.hidden = true;
    isiCadanganTerpilih = null;
    var berkas = berkasCadangan.files && berkasCadangan.files[0];
    if (!berkas) { return; }
    if (berkas.size > 20 * 1024 * 1024) {
        tampilkanGalatCadangan("File terlalu besar (lebih dari 20 MB) untuk sebuah cadangan.");
        return;
    }
    var pembaca = new FileReader();
    pembaca.onerror = function () { tampilkanGalatCadangan("File tidak bisa dibaca."); };
    pembaca.onload = function () {
        var hasil = periksaIsiCadangan(String(pembaca.result));
        if (!hasil.ok) { tampilkanGalatCadangan(hasil.galat); return; }
        isiCadanganTerpilih = hasil.isi;
        namaBerkasTerpilih = berkas.name;
        document.getElementById("file-dibuat").textContent = hasil.isi.dibuatPada
            ? formatTanggal(String(hasil.isi.dibuatPada).slice(0, 10)) + " " + String(hasil.isi.dibuatPada).slice(11)
            : "tidak diketahui";
        // Tabel perbandingan: data sekarang di kiri, isi file di kanan
        var sekarang = ringkasanCadangan(ambilDataAplikasi());
        var difile = ringkasanCadangan(hasil.isi.data);
        isiTabelRingkasan(document.getElementById("ringkasan-perbandingan"),
            sekarang.map(function (r, i) { return [r.label, r.nilai, difile[i].nilai]; }));
        hasilPeriksa.hidden = false;
    };
    pembaca.readAsText(berkas);
});

// Tombol Pulihkan: konfirmasi, cadangkan data sekarang, ganti semua, lalu muat ulang halaman
document.getElementById("tombol-pulihkan").addEventListener("click", function () {
    if (!isiCadanganTerpilih) { return; }
    var isi = isiCadanganTerpilih, namaBerkas = namaBerkasTerpilih;
    tanyaKonfirmasi({
        judul: "Pulihkan Data",
        pesan: "SEMUA data di aplikasi ini akan diganti dengan isi file. Data yang sekarang diunduh dulu sebagai cadangan. Lanjutkan?",
        nama: namaBerkas,
        labelYa: "Ya, Pulihkan"
    }, function () {
        // 1) Cadangkan keadaan sekarang. Kalau gagal diunduh, pemulihan dibatalkan.
        var namaPengaman = "cadangan-sebelum-pemulihan-" + waktuBerkas() + ".json";
        if (!unduhBerkas(namaPengaman, susunIsiCadangan())) {
            tampilkanNotifikasi("Cadangan pengaman gagal dibuat, jadi pemulihan dibatalkan. Data tidak diubah.", "galat");
            return;
        }
        // 2) Beri waktu browser memulai unduhan, lalu ganti semua data
        setTimeout(function () {
            var hasil = terapkanCadangan(isi.data);
            if (!hasil.ok) {
                tampilkanNotifikasi(hasil.galat, "galat");
                return;
            }
            // Dicatat di log yang sudah berisi data hasil pemulihan
            catatLog({ tindakan: "Pulihkan", tipe: "Cadangan Data", referensi: namaBerkas });
            try {
                sessionStorage.setItem("pesanPemulihan", "Data telah dipulihkan dari file " + namaBerkas + ".");
            } catch (galat) { /* pesan tidak tampil, tidak fatal */ }
            // 3) Muat ulang supaya semua halaman membaca data yang baru
            muatUlangHalaman();
        }, 900);
    });
});

// Setelah halaman dimuat ulang oleh pemulihan: tampilkan pesan berhasil
try {
    var pesanPemulihan = sessionStorage.getItem("pesanPemulihan");
    if (pesanPemulihan) {
        sessionStorage.removeItem("pesanPemulihan");
        tampilkanNotifikasi(pesanPemulihan);
    }
} catch (galat) { /* abaikan */ }

function bukaCadangan() {
    bukaTab("cadangan");
}

