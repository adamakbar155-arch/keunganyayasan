// ==================== Akun Perkiraan (Buku Besar) ====================
// Berisi: halaman Akun Perkiraan (kode otomatis, induk/sub akun maks 3 tingkat, tab Saldo, Akun Anak, info bank),
// perhitungan saldo dari jurnal (petaAkun), tempat akun dipakai, dan bagan akun awal (Pasang Bagan Akun Awal).
// HTML-nya ada di fitur/akun/tampilan.js. Dipanggil dari index.html sesudah umum/ dan master data, dan SEBELUM fitur/jurnal/jurnal.js (jurnal memakai petaAkun, tipeAkun, dll.).
// Semua nama (var dan function) di sini tetap bisa dipakai skrip lain, karena skrip biasa berbagi satu ruang nama.

// ---------- Halaman Akun Perkiraan (Buku Besar) ----------
// Satu akun: { id, kode, nama, tipe, indukId, catatan, nonAktif, namaBank, noRekening, atasNamaRekening,
//              saldoAwal, tanggalSaldo }. Kode dan nama dibaca juga oleh Preferensi dan Gaji/Tunjangan (lewat bacaDaftarAkun).
// Akun bisa bertingkat: indukId = id akun induknya ("" kalau akun paling atas).

// Tipe akun untuk yayasan (urutan = urutan di pilihan). Persediaan, Beban Pokok Penjualan, Piutang dan Utang Usaha
// sengaja tidak ada karena tidak dipakai yayasan.
var tipeAkun = {
    "kas-bank": "Kas & Bank",
    "aset-lancar-lain": "Aset Lancar Lainnya",
    "aset-tetap": "Aset Tetap",
    "akumulasi-penyusutan": "Akumulasi Penyusutan",
    "aset-lain": "Aset Lainnya",
    "liabilitas-pendek": "Liabilitas Jangka Pendek",
    "liabilitas-panjang": "Liabilitas Jangka Panjang",
    "modal": "Modal",
    "pendapatan": "Pendapatan",
    "beban": "Beban",
    "beban-lain": "Beban Lainnya",
    "pendapatan-lain": "Pendapatan Lainnya"
};

// Awalan kode untuk akun paling atas (induk) tiap tipe: awalan + nomor urut 2 digit, contoh Kas & Bank = 1101, 1102, ...
var awalanKodeAkun = {
    "kas-bank": "11", "aset-lancar-lain": "12", "aset-tetap": "13", "akumulasi-penyusutan": "14", "aset-lain": "15",
    "liabilitas-pendek": "21", "liabilitas-panjang": "22", "modal": "31",
    "pendapatan": "41", "beban": "51", "beban-lain": "61", "pendapatan-lain": "71"
};

var kolomTipeAkun = document.getElementById("akun-tipe");
var peringatanDonasiAkun = document.getElementById("akun-peringatan-donasi");
var kotakSubAkun = document.getElementById("akun-sub");
var barisIndukAkun = document.getElementById("akun-induk-baris");   // kolom Cari/Pilih induk (muncul kalau Sub Akun dicentang)
var pilihIndukAkun = document.getElementById("akun-induk");   // kolom tersembunyi berisi id akun induk terpilih
var kolomCariIndukAkun = document.getElementById("akun-induk-cari");
var daftarIndukAkun = document.getElementById("akun-induk-daftar");
var calonIndukAkun = [];   // akun yang boleh dipilih sebagai induk (diisi isiPilihanIndukAkun)
var kolomKodeAkun = document.getElementById("akun-kode");
var kolomNamaAkun = document.getElementById("akun-nama");
var kolomCatatanAkun = document.getElementById("akun-catatan");
var kotakNonAktifAkun = document.getElementById("akun-nonaktif");
var blokBankAkun = document.getElementById("akun-bank");
var kolomNamaBankAkun = document.getElementById("akun-nama-bank");
var kolomNoRekAkun = document.getElementById("akun-no-rekening");
var kolomAtasNamaAkun = document.getElementById("akun-atas-nama");
var kolomSaldoAkun = document.getElementById("akun-saldo");
var kolomTglSaldoAkun = document.getElementById("akun-tgl-saldo");
var galatAkun = {
    tipe: document.getElementById("galat-akun-tipe"),
    induk: document.getElementById("galat-akun-induk"),
    kode: document.getElementById("galat-akun-kode"),
    nama: document.getElementById("galat-akun-nama"),
    saldo: document.getElementById("galat-akun-saldo"),
    tgl: document.getElementById("galat-akun-tgl")
};

// Isi pilihan Tipe Akun sekali saja (daftarnya tetap). Data Baru mulai dari "Silakan Pilih" (PRD 5.3a).
isiPilihan(kolomTipeAkun, Object.keys(tipeAkun), {
    nilai: function (kunci) { return kunci; },
    teks: function (kunci) { return tipeAkun[kunci]; },
    kosong: "Silakan Pilih"
});

// Jurnal Umum dibaca langsung dari penyimpanan (tanpa lewat modulJurnal, yang dimuat sesudah file ini)
// supaya bisa dipakai di mana saja. Isian yang rusak (bukan objek) dibuang.
function bacaJurnalMentah() {
    return bacaDaftarTersimpan("daftarJurnal");
}

// Berapa jurnal yang memakai sebuah Divisi/Program/akun (menurut isi barisnya). kunciBaris: "divisiId", "programId", atau "akunId".
function jumlahJurnalMemakai(kunciBaris, nilai) {
    return bacaJurnalMentah().filter(function (j) {
        return rincianAman(j).some(function (r) { return r[kunciBaris] === nilai; });
    }).length;
}

// Sisa dana satu Program yang BISA DIPAKAI mulai tanggal tertentu (PRD 6.0, 6.1), dihitung dari buku jurnal (tidak
// disimpan terpisah): jumlah (Kredit − Debit) semua baris bertanda Program itu pada akun pendapatan, pendapatan lain,
// beban, beban lain, dan modal/aset neto. Jadi donasi dan pendapatan menambah, pengeluaran mengurangi, Pemindahan Dana
// memindah. Baris Kas/Bank tidak bertanda Program (PRD 4.2), dan akun jenis lain tidak dihitung.
//   programId    : id Program
//   mulaiTanggal : "YYYY-MM-DD"; hasilnya sisa akhir hari TERENDAH mulai tanggal itu sampai tanggal terakhir di buku
//                  jurnal, supaya uang yang sudah dipakai/dipindah di tanggal sesudahnya tidak dipakai dua kali
//                  (Temuan 28). Kosong = sisa akhir seluruh jurnal.
//   abaikan(j)   : (boleh tidak ada) true untuk jurnal yang dilewati, misalnya jurnal milik Pemindahan Dana yang
//                  sedang diubah, supaya pemindahan itu sendiri tidak ikut mengurangi sisa
var TIPE_AKUN_SISA_DANA = { "pendapatan": true, "pendapatan-lain": true, "beban": true, "beban-lain": true, "modal": true };
/* exported sisaDanaProgram */
function sisaDanaProgram(programId, mulaiTanggal, abaikan) {
    return jumlahDanaJurnal(function (r, tipe) { return r.programId === programId && TIPE_AKUN_SISA_DANA[tipe]; }, mulaiTanggal, abaikan);
}

// Sisa Dana Umum yang bisa dipakai mulai tanggal tertentu (PRD 6.1): Dana Umum = baris akun Aset Neto Tidak Terikat
// (Preferensi) yang TANPA Divisi dan TANPA Program (milik yayasan, bukan milik Divisi mana pun). Jumlah (Kredit − Debit):
// sisa Program yang dipindah ke Dana Umum menambah, Dana Umum yang diberikan ke Divisi mengurangi.
// Akun Aset Neto belum dipilih di Preferensi = belum ada Dana Umum (0). mulaiTanggal dan abaikan sama dengan di atas.
/* exported sisaDanaUmum */
function sisaDanaUmum(mulaiTanggal, abaikan) {
    var akun = akunAsetNeto("tidak-terikat");
    if (!akun) { return 0; }
    return jumlahDanaJurnal(function (r) { return r.akunId === akun.id && !r.programId && !r.divisiId; }, mulaiTanggal, abaikan);
}

// Penjumlahan bersama sisa dana: (Kredit − Debit) baris jurnal yang cocok(baris, tipeAkun) dikumpulkan per tanggal,
// melewati jurnal yang abaikan(j). Hasilnya sisa akhir hari terendah mulai mulaiTanggal (alat bersama
// saldoTerendahSejak, umum/alat.js), atau sisa akhir seluruh jurnal kalau mulaiTanggal kosong.
// Data rusak (jurnal atau baris tanpa angka) dilewati, tidak membuat macet.
function jumlahDanaJurnal(cocok, mulaiTanggal, abaikan) {
    var tipePerAkun = {};
    bacaDaftarAkun().forEach(function (a) { if (a && a.id) { tipePerAkun[a.id] = a.tipe; } });
    // Tanpa prototipe: tanggal rusak seperti "constructor" atau "__proto__" tetap jadi kunci biasa, tidak mengacaukan hitungan
    var perHari = Object.create(null);
    bacaJurnalMentah().forEach(function (j) {
        if (!j || (abaikan && abaikan(j))) { return; }
        var t = teksAman(j.tanggal);
        rincianAman(j).forEach(function (r) {
            if (r && cocok(r, tipePerAkun[r.akunId])) {
                perHari[t] = (perHari[t] || 0) + (Number(r.kredit) || 0) - (Number(r.debit) || 0);
            }
        });
    });
    return saldoTerendahSejak(perHari, 0, teksAman(mulaiTanggal)).saldo;
}

// Sisi normal tiap tipe akun: aset dan beban bertambah di DEBIT; liabilitas, modal, pendapatan, dan akumulasi
// penyusutan bertambah di KREDIT. Dipakai untuk menghitung saldo saat ini dari jurnal.
var tipeSaldoDebit = { "kas-bank": true, "aset-lancar-lain": true, "aset-tetap": true, "aset-lain": true, "beban": true, "beban-lain": true };

// Peta bantu untuk daftar bertingkat: induk-anak, kedalaman, jalur kode, dan saldo total (akun + semua sub akunnya).
// Dihitung sekali untuk satu isi penyimpanan, supaya menggambar ratusan baris tidak menghitung berulang-ulang.
var cachePetaAkun = { teks: null, peta: null };
function petaAkun() {
    // Cache berlaku selama daftar akun DAN jurnal tidak berubah (saldo bergantung pada keduanya)
    var teks = (localStorage.getItem("daftarAkun") || "[]") + "|" + (localStorage.getItem("daftarJurnal") || "[]");
    if (cachePetaAkun.teks === teks) { return cachePetaAkun.peta; }
    var semua = bacaDaftarAkun();
    var peta = { semua: semua, perId: {}, anak: {}, dalam: {}, jalur: {}, total: {}, gerak: {} };
    semua.forEach(function (a) {
        peta.perId[a.id] = a;
        var induk = a.indukId || "";
        (peta.anak[induk] = peta.anak[induk] || []).push(a);
    });
    // Kedalaman dan jalur kode dihitung dengan menelusuri induk ke atas (dengan batas, kalau-kalau data rusak berputar)
    semua.forEach(function (a) {
        var dalam = 0, jalur = [a.kode], atas = peta.perId[a.indukId];
        while (atas && dalam < 20) { dalam++; jalur.unshift(atas.kode); atas = peta.perId[atas.indukId]; }
        peta.dalam[a.id] = dalam;
        peta.jalur[a.id] = jalur.join(" ");
    });
    // Pergerakan dari jurnal: debit - kredit untuk tipe bersisi debit, kredit - debit untuk tipe bersisi kredit
    var selisihJurnal = {};
    bacaJurnalMentah().forEach(function (j) {
        rincianAman(j).forEach(function (r) { selisihJurnal[r.akunId] = (selisihJurnal[r.akunId] || 0) + (Number(r.debit) || 0) - (Number(r.kredit) || 0); });
    });
    semua.forEach(function (a) {
        var bersih = selisihJurnal[a.id] || 0;
        peta.gerak[a.id] = tipeSaldoDebit[a.tipe] ? bersih : -bersih;
    });
    function hitungTotal(a, jaga) {
        if (peta.total[a.id] !== undefined) { return peta.total[a.id]; }
        var jumlah = (Number(a.saldoAwal) || 0) + (peta.gerak[a.id] || 0);   // saldo awal + pergerakan jurnal
        if (jaga < 20) {
            (peta.anak[a.id] || []).forEach(function (anak) { jumlah += hitungTotal(anak, jaga + 1); });
        }
        peta.total[a.id] = jumlah;
        return jumlah;
    }
    semua.forEach(function (a) { hitungTotal(a, 0); });
    cachePetaAkun = { teks: teks, peta: peta };
    return peta;
}

// Semua id keturunan sebuah akun (anak, cucu, dst.)
function keturunanAkun(id) {
    var peta = petaAkun(), hasil = [], antre = (peta.anak[id] || []).slice();
    while (antre.length && hasil.length < 5000) {
        var a = antre.shift();
        hasil.push(a.id);
        (peta.anak[a.id] || []).forEach(function (x) { antre.push(x); });
    }
    return hasil;
}

// Kalau akun dipakai di tempat lain, kembalikan nama tempatnya; kosong kalau bebas. Yang diperiksa:
//  - buku jurnal (Jurnal Umum dan semua jurnal otomatis), lewat id akun di baris jurnal;
//  - Pencatatan Gaji (akun Beban Gaji di Info lainnya) dan Anggaran (rincian), lewat id akun;
//  - Penomoran (aturan No Bukti yang ditautkan ke akun Kas/Bank), lewat id akun;
//  - Gaji/Tunjangan dan Preferensi (Akun Perkiraan), yang menyimpan akun lewat KODE-nya.
// Preferensi diperiksa PALING AKHIR, jadi hasil TEMPAT_PREFERENSI_AKUN berarti akun hanya dipakai di Preferensi
// (Kategori Donasi memakainya: akun seperti itu boleh dihapus lalu dikeluarkan dari Preferensi).
var TEMPAT_PREFERENSI_AKUN = "Preferensi (Akun Perkiraan)";
function tempatAkunDipakai(kode) {
    var akunIni = bacaDaftarAkun().find(function (a) { return a.kode === kode; });
    if (akunIni && bacaJurnalMentah().some(function (j) { return rincianAman(j).some(function (r) { return r.akunId === akunIni.id; }); })) { return "Jurnal Umum"; }
    if (akunIni && bacaDaftarTersimpan("daftarPencatatanGaji").some(function (g) { return g.akunBebanId === akunIni.id; })) { return "Pencatatan Gaji"; }
    if (akunIni && bacaDaftarTersimpan("daftarPenomoran").some(function (a) { return a.kasId === akunIni.id; })) { return "Pengaturan, Penomoran (aturan No Bukti Kas/Bank)"; }
    if (modulGaji.ambil().some(function (g) { return g.akunBeban === kode; })) { return "Gaji/Tunjangan"; }
    if (akunIni && bacaDaftarTersimpan("daftarAnggaran").some(function (d) { return rincianAman(d).some(function (r) { return r.akunId === akunIni.id; }); })) { return "Anggaran"; }
    if (akunIni && bacaDaftarTersimpan("daftarTransferAnggaran").some(function (t) { return t && (t.akunDariId === akunIni.id || t.akunKeId === akunIni.id); })) { return "Transfer Anggaran"; }
    if (akunIni && kategoriAsetMemakaiAkun(akunIni.id)) { return "Kategori Aset"; }
    var pilihan = bacaAkunPerkiraan();
    var dipilih = Object.keys(pilihan).some(function (k) { return Array.isArray(pilihan[k]) && pilihan[k].indexOf(kode) !== -1; });
    return dipilih ? TEMPAT_PREFERENSI_AKUN : "";
}

// Akun yang dibuat oleh Kategori Donasi dikunci di sini: diubah atau dihapus hanya lewat Kategori Donasi,
// supaya nama dan kode akun selalu sama dengan kategorinya. Yang dicek adalah kategorinya (akunId di Kategori Donasi),
// jadi kunci hanya berlaku selama kategorinya masih ada (kalau data kategorinya hilang, akun tidak terkunci selamanya).
var pesanAkunKategoriDonasi = "Akun ini dibuat oleh Kategori Donasi. Ubah atau hapus lewat Donasi → Kategori Donasi.";
function akunMilikKategoriDonasi(akun) {
    if (!akun) { return false; }
    return bacaDaftarTersimpan("daftarKategoriDonasi").some(function (k) { return k.akunId === akun.id; });
}

// Pilihan "Sub Akun dari": akun bertipe sama, kecuali akun ini sendiri dan sub akunnya (mencegah putaran)
function isiPilihanIndukAkun(idDipilih) {
    var peta = petaAkun();
    var dilarang = modulAkun.idDiubah ? [modulAkun.idDiubah].concat(keturunanAkun(modulAkun.idDiubah)) : [];
    // Susunan akun paling dalam TIGA tingkat (induk, sub pertama, sub kedua), seperti di Accurate.
    // Jadi akun yang sudah di tingkat ketiga tidak bisa menjadi induk. Kalau akun yang diubah sendiri punya sub akun,
    // tinggi cabangnya ikut dihitung supaya cabang itu tidak melewati tingkat ketiga setelah dipindah.
    var tinggiCabang = 0;
    if (modulAkun.idDiubah) {
        keturunanAkun(modulAkun.idDiubah).forEach(function (id) {
            tinggiCabang = Math.max(tinggiCabang, peta.dalam[id] - peta.dalam[modulAkun.idDiubah]);
        });
    }
    var calon = peta.semua.filter(function (a) {
        if (a.tipe !== kolomTipeAkun.value || dilarang.indexOf(a.id) !== -1) { return false; }
        // Akun milik Kategori Donasi tidak boleh punya sub akun (kodenya bisa berganti saat kategorinya diubah)
        if (akunMilikKategoriDonasi(a)) { return false; }
        // Induk yang sekarang dipakai akun ini tetap boleh tampil walau data lama sudah lebih dalam dari tiga tingkat
        return a.id === idDipilih || (peta.dalam[a.id] || 0) + 1 + tinggiCabang <= 2;
    }).sort(function (a, b) { return peta.jalur[a.id].localeCompare(peta.jalur[b.id], "id"); });
    calonIndukAkun = calon;
    // Kolom induk kosong sampai pengguna memilih (kecuali sedang mengubah akun yang sudah punya induk)
    var terpilih = calon.find(function (a) { return a.id === idDipilih; });
    pilihIndukAkun.value = terpilih ? terpilih.id : "";
    kolomCariIndukAkun.value = terpilih ? terpilih.nama : "";
    daftarIndukAkun.hidden = true;
}

// Daftar pilihan induk yang melayang di bawah kolom pencarian: tiap baris memuat nama (dengan "- " per tingkat)
// dan kodenya di kanan, seperti di Accurate. Disaring dengan kata yang diketik (di nama atau kode).
function gambarDaftarIndukAkun() {
    var peta = petaAkun();
    // Kalau sudah ada induk terpilih, isi kolom hanyalah namanya: semua pilihan tetap ditampilkan (bukan disaring).
    // Penyaringan baru berlaku saat pengguna mengetik (mengetik mengosongkan pilihan lebih dulu).
    var kata = pilihIndukAkun.value !== "" ? "" : kolomCariIndukAkun.value.trim().toLowerCase();
    daftarIndukAkun.textContent = "";
    var cocok = calonIndukAkun.filter(function (a) {
        return kata === "" || (a.nama + " " + a.kode).toLowerCase().indexOf(kata) !== -1;
    });
    function barisInfo(teks) {
        var li = document.createElement("li");
        li.className = "pemilih-info";
        li.textContent = teks;
        daftarIndukAkun.appendChild(li);
    }
    if (calonIndukAkun.length === 0) {
        barisInfo("Belum ada akun bertipe ini yang bisa dijadikan induk.");
    } else if (cocok.length === 0) {
        barisInfo("Tidak ada akun yang cocok.");
    }
    cocok.forEach(function (a) {
        var li = document.createElement("li");
        var tombol = document.createElement("button");
        tombol.type = "button";
        tombol.className = "pemilih-pilihan pilihan-induk";
        tombol.setAttribute("role", "option");
        var nama = document.createElement("span");
        nama.textContent = "- ".repeat(peta.dalam[a.id]) + a.nama;   // textContent: aman dari kode HTML
        var kode = document.createElement("span");
        kode.className = "kode-pilihan";
        kode.textContent = a.kode;
        tombol.appendChild(nama);
        tombol.appendChild(kode);
        tombol.addEventListener("click", function () {
            pilihIndukAkun.value = a.id;
            pilihIndukAkun.dispatchEvent(new Event("change", { bubbles: true }));
        });
        li.appendChild(tombol);
        daftarIndukAkun.appendChild(li);
    });
    daftarIndukAkun.hidden = false;
    kolomCariIndukAkun.setAttribute("aria-expanded", "true");
}

// Membuat kode otomatis.
//   Akun induk (tanpa Sub Akun): awalan tipe + nomor urut 2 digit (1101, 1102, ...)
//   Sub akun                   : kode induk + nomor urut 2 digit (110101, 110102, ...)
// Nomor urut = yang terbesar sekarang + 1 (kode akun yang sudah dihapus tidak dipakai ulang kalau masih ada ruang);
// kalau sudah sampai 99, dicari nomor kosong paling kecil. Mengembalikan "" kalau tidak bisa dibuat.
// idDiabaikan = akun yang sedang diubah (kodenya sendiri tidak dihitung sebagai terpakai).
function buatKodeAkun(tipe, indukId, idDiabaikan) {
    var peta = petaAkun();
    var awalan;
    if (indukId) {
        var induk = peta.perId[indukId];
        if (!induk) { return ""; }
        awalan = induk.kode;
    } else {
        awalan = awalanKodeAkun[tipe];
        if (!awalan) { return ""; }
    }
    var terpakai = {};
    var terbesar = 0;
    peta.semua.forEach(function (a) {
        if (a.id === idDiabaikan) { return; }
        var kodeA = teksAman(a.kode);
        terpakai[kodeA] = true;
        // Hanya kode yang tepat "awalan + 2 digit" menentukan nomor terbesar
        if (kodeA.length === awalan.length + 2 && kodeA.indexOf(awalan) === 0 && /^\d\d$/.test(kodeA.slice(awalan.length))) {
            terbesar = Math.max(terbesar, Number(kodeA.slice(awalan.length)));
        }
    });
    function kodeDari(n) { return awalan + String(n).padStart(2, "0"); }
    for (var n = terbesar + 1; n <= 99; n++) { if (!terpakai[kodeDari(n)]) { return kodeDari(n); } }
    for (var m = 1; m <= 99; m++) { if (!terpakai[kodeDari(m)]) { return kodeDari(m); } }
    return "";
}

// Isi kolom kode sesuai tipe/induk yang sedang dipilih.
// Saat mengubah akun lama yang tipe dan induknya tidak berubah, kodenya tetap seperti semula.
function perbaruiKodeAkun() {
    var indukId = kotakSubAkun.checked ? pilihIndukAkun.value : "";
    var lama = akunSedangDiubah();
    if (lama && lama.tipe === kolomTipeAkun.value && (lama.indukId || "") === indukId) {
        kolomKodeAkun.value = lama.kode;
    } else if (kolomTipeAkun.value === "") {
        kolomKodeAkun.value = "";   // Tipe belum dipilih: kode baru muncul sesudah Tipe dipilih (PRD 5.3a)
    } else if (kotakSubAkun.checked && indukId === "") {
        kolomKodeAkun.value = "";   // Sub Akun dicentang tetapi induk belum dipilih
    } else {
        kolomKodeAkun.value = buatKodeAkun(kolomTipeAkun.value, indukId, lama ? lama.id : null);
    }
}

// Akun yang sedang diubah, atau null kalau sedang membuat akun baru
function akunSedangDiubah() {
    return modulAkun.idDiubah ? modulAkun.ambil().find(function (a) { return a.id === modulAkun.idDiubah; }) : null;
}

// Tampilan mengikuti isian: kolom induk hanya kalau Sub Akun dicentang, blok bank hanya untuk Kas & Bank.
// Membuat akun baru bertipe Pendapatan: muncul peringatan bahwa akun donasi dibuat lewat Kategori Donasi (Temuan 42).
function perbaruiTampilanFormAkun() {
    barisIndukAkun.hidden = !kotakSubAkun.checked;
    blokBankAkun.hidden = (kolomTipeAkun.value !== "kas-bank");
    peringatanDonasiAkun.hidden = !(kolomTipeAkun.value === "pendapatan" && !modulAkun.idDiubah);
}

function sembunyikanGalatAkun() {
    Object.keys(galatAkun).forEach(function (n) { galatAkun[n].hidden = true; });
}
function tampilkanGalatAkun(nama, pesan, kolomFokus, tabId) {
    // Kalau kolom yang salah ada di tab lain, pindah ke tab itu dulu
    if (tabId) { document.querySelector('#isi-akun .sub-tab[data-subtab="' + tabId + '"]').click(); }
    galatAkun[nama].textContent = pesan;
    galatAkun[nama].hidden = false;
    kolomFokus.focus();
}

function perbaruiTglSaldoTeks() {
    document.getElementById("akun-tgl-saldo-teks").textContent = formatTanggalTeks(kolomTglSaldoAkun.value);
}

// Tanggal saldo awal bawaan = "Tanggal mulai data" di Preferensi (tanggalMulaiDiatur), kalau belum diisi hari ini
function tanggalMulaiPembukuan() {
    return tanggalMulaiDiatur() || tanggalHariIni();
}

// Saldo untuk tampilan daftar: negatif ditulis dalam kurung, contoh -417000 -> "(417.000)"
function teksSaldoAkun(nilai) {
    return nilai < 0 ? "(" + formatAngka(Math.abs(nilai)) + ")" : formatAngka(nilai);
}

// Bagian yang hanya muncul untuk akun yang sudah ada: kotak "Saldo Saat ini" dan tab "Akun Anak".
//   akun = akun yang sedang dibuka, atau null untuk data baru (keduanya disembunyikan).
function perbaruiAkunLama(akun) {
    var tabAnak = document.getElementById("tab-akun-anak");
    var kotakSaldo = document.getElementById("akun-saldo-kini");
    var badanAnak = document.getElementById("akun-anak-isi");
    var peta = petaAkun();
    // Tab Akun Anak hanya untuk akun induk (tingkat 0) dan sub pertamanya (tingkat 1), seperti di Accurate.
    // Akun di tingkat berikutnya tidak menampilkan tab ini. Kotak Saldo Saat ini tetap tampil untuk semua akun lama.
    var bisaPunyaAnak = !!akun && (peta.dalam[akun.id] || 0) <= 1;
    tabAnak.hidden = !bisaPunyaAnak;
    kotakSaldo.hidden = !akun;
    badanAnak.textContent = "";
    document.getElementById("akun-anak-kosong").hidden = true;
    if (!akun) { return; }
    var total = peta.total[akun.id] || 0;
    var nilai = document.getElementById("akun-saldo-kini-nilai");
    nilai.textContent = "Rp " + teksSaldoAkun(total);
    nilai.classList.toggle("angka-negatif", total < 0);

    // Akun ini sendiri di baris pertama, lalu semua turunannya menurut urutan pohon; menjorok sesuai tingkat
    var ids = [akun.id].concat(keturunanAkun(akun.id)).sort(function (a, b) {
        return peta.jalur[a].localeCompare(peta.jalur[b], "id");
    });
    ids.forEach(function (id) {
        var item = peta.perId[id];
        var tr = document.createElement("tr");
        tr.className = "baris-data";
        tr.tabIndex = 0;
        tr.title = "Klik untuk membuka";
        var tdNama = document.createElement("td");
        tdNama.textContent = tabAkunBerjorok.repeat(peta.dalam[id] - peta.dalam[akun.id]) + item.nama;   // textContent: aman dari kode HTML
        var tdKode = document.createElement("td");
        tdKode.textContent = item.kode;
        tr.appendChild(tdNama);
        tr.appendChild(tdKode);
        function buka() { if (id !== akun.id) { modulAkun.bukaUbah(item); } }
        tr.addEventListener("click", buka);
        tr.addEventListener("keydown", function (k) { if (k.key === "Enter") { buka(); } });
        badanAnak.appendChild(tr);
    });
    document.getElementById("akun-anak-kosong").hidden = ids.length > 1;
}

var tabAkunBerjorok = "    ";   // 4 spasi tak terputus (U+00A0) per tingkat, supaya tidak dipadatkan browser
function jorokAkun(a) { return tabAkunBerjorok.repeat(petaAkun().dalam[a.id] || 0); }

// Rincian log (tab Pemeriksaan): nama isian dan cara menampilkan nilainya
var labelAkun = {
    kode: "Kode Perkiraan", nama: "Nama", tipe: "Tipe Akun", indukId: "Sub Akun dari", catatan: "Catatan",
    nonAktif: "Non Aktif", namaBank: "Nama Bank", noRekening: "No Rekening", atasNamaRekening: "Atas Nama Rekening",
    saldoAwal: "Saldo Awal", tanggalSaldo: "Saldo per Tgl"
};
var formatAkun = {
    tipe: function (n) { return tipeAkun[n] || n; },
    indukId: function (id) { var a = petaAkun().perId[id]; return a ? teksAkun(a) : ""; },
    nonAktif: function (n) { return n ? "Ya" : "Tidak"; },
    saldoAwal: function (n) { return formatRupiah(n || 0); },
    tanggalSaldo: function (t) { return t ? formatTanggal(t) : ""; }
};

var modulAkun = buatModulDaftar({
    id: "akun",
    judul: "Akun Perkiraan",
    kunci: "daftarAkun",
    labelData: labelAkun,
    formatData: formatAkun,
    urutAwal: { kolom: "kode", arah: 1 },
    filter: [
        { judul: "Tipe Akun", ambil: function (a) { return a.tipe; }, tampil: function (n) { return tipeAkun[n] || n; } },
        { judul: "Non Aktif", ambil: function (a) { return a.nonAktif ? "Ya" : "Tidak"; } }
    ],
    kolom: [
        // urut = kunci pengurutan: kode diurutkan menurut jalur induk-anak supaya sub akun berada tepat di bawah induknya
        { kunci: "kode", judul: "Kode Perkiraan", tampil: function (a) { return jorokAkun(a) + a.kode; }, urut: function (a) { return petaAkun().jalur[a.id] || a.kode; } },
        { kunci: "nama", judul: "Nama", tampil: function (a) { return jorokAkun(a) + a.nama; }, urut: function (a) { return a.nama; } },
        { kunci: "tipe", judul: "Tipe Akun", tampil: function (a) { return tipeAkun[a.tipe] || ""; } },
        // Saldo induk = saldo sendiri + semua sub akunnya
        // Saldo rata kanan; saldo negatif ditulis merah dalam kurung, misalnya (417.000)
        { kunci: "saldo", judul: "Saldo", rata: "kanan",
          tampil: function (a) { return teksSaldoAkun(petaAkun().total[a.id] || 0); },
          kelasSel: function (a) { return (petaAkun().total[a.id] || 0) < 0 ? "angka-negatif" : ""; },
          // Kunci urut: angka dibuat selebar sama; negatif diberi awalan "-" agar jatuh sebelum nol
          urut: function (a) {
              var n = petaAkun().total[a.id] || 0;
              return n < 0 ? "-" + String(Math.abs(n)).padStart(18, "0") : "0" + String(n).padStart(18, "0");
          } }
    ],
    pesanKosong: "Belum ada akun. Klik tombol + untuk menambah akun.",
    isiForm: function (akun) {
        kolomTipeAkun.value = akun ? akun.tipe : "";   // Data Baru dibuka kosong (PRD 5.3a)
        kotakSubAkun.checked = akun ? !!akun.indukId : false;
        kolomNamaAkun.value = akun ? akun.nama : "";
        kolomCatatanAkun.value = akun ? (akun.catatan || "") : "";
        kotakNonAktifAkun.checked = akun ? !!akun.nonAktif : false;
        kolomNamaBankAkun.value = akun ? (akun.namaBank || "") : "";
        kolomNoRekAkun.value = akun ? (akun.noRekening || "") : "";
        kolomAtasNamaAkun.value = akun ? (akun.atasNamaRekening || "") : "";
        kolomSaldoAkun.value = akun ? teksAngkaIsian(Number(akun.saldoAwal) || 0) : "";   // ditulis bertitik: 1.500.000
        kolomTglSaldoAkun.value = akun && akun.tanggalSaldo ? akun.tanggalSaldo : "";   // wajib hanya kalau ada saldo awal
        perbaruiTglSaldoTeks();
        // idDiubah sudah terisi di sini, jadi akun ini dan sub akunnya tidak muncul sebagai pilihan induk
        isiPilihanIndukAkun(akun ? akun.indukId : "");
        perbaruiTampilanFormAkun();
        perbaruiKodeAkun();   // akun baru: kode dibuat otomatis; akun lama: kode apa adanya
        perbaruiAkunLama(akun);   // saldo saat ini dan tab Akun Anak, hanya untuk akun yang sudah ada
        sembunyikanGalatAkun();
        document.querySelector('#isi-akun .sub-tab[data-subtab="akun-umum"]').click();   // selalu mulai di Informasi Umum
    },
    // Akun yang masih punya sub akun atau sudah dipakai tempat lain tidak boleh dihapus
    alasanTolakHapus: function (akun) {
        if (akunMilikKategoriDonasi(akun)) { return pesanAkunKategoriDonasi; }
        var jumlahAnak = (petaAkun().anak[akun.id] || []).length;
        if (jumlahAnak > 0) { return 'Akun "' + akun.nama + '" masih punya ' + jumlahAnak + ' sub akun.'; }
        var tempat = tempatAkunDipakai(akun.kode);
        return tempat ? 'Akun "' + akun.nama + '" masih dipakai di ' + tempat + '.' : "";
    }
});

// Pembersihan satu kali: versi sebelumnya sempat memasang 12 akun induk bawaan (ditandai sistem: true).
// Sekarang tidak ada lagi induk bawaan (induk dibuat sendiri, seperti di Accurate), jadi sisanya dibereskan:
//  - induk bawaan yang masih kosong (tanpa sub akun, saldo 0, belum dipakai) dihapus,
//  - induk bawaan yang sudah dipakai (punya sub akun, saldo, atau dipakai Gaji/Preferensi) dipertahankan sebagai akun biasa.
// Dijalankan diam-diam (tanpa notifikasi dan tanpa Log Aktivitas), dan aman dijalankan berulang kali.
function bereskanIndukBawaanLama() {
    var daftar = modulAkun.ambil();
    if (!daftar.some(function (a) { return a.sistem; })) { return; }
    var peta = petaAkun();
    var hasil = [];
    daftar.forEach(function (a) {
        if (!a.sistem) { hasil.push(a); return; }
        var kosong = (peta.anak[a.id] || []).length === 0 && !(Number(a.saldoAwal) > 0) && !tempatAkunDipakai(a.kode);
        if (kosong) { return; }   // dibuang
        delete a.sistem;
        if (a.catatan === "Akun induk bawaan.") { a.catatan = ""; }
        hasil.push(a);
    });
    if (modulAkun.simpan(hasil)) { modulAkun.gambarTabel(); }
}
bereskanIndukBawaanLama();

// ---------- Akun awal ----------
// Bagan akun awal yayasan: tiap tipe punya satu akun induk (kode 4 digit) beserta sub akun bawaannya
// (kode induk + nomor urut 2 digit). Isinya akun biasa: boleh diubah, diberi saldo, dihapus, dan ditambah sub lagi.
var baganAkunAwal = [
    { kode: "1101", nama: "Kas & Bank", tipe: "kas-bank", anak: ["Kas Kecil", "Bank", "Setara Kas"] },
    { kode: "1201", nama: "Aset Lancar Lainnya", tipe: "aset-lancar-lain", anak: ["Piutang Lain-lain", "Uang Muka", "Biaya Dibayar di Muka"] },
    { kode: "1301", nama: "Aset Tetap", tipe: "aset-tetap", anak: ["Tanah", "Bangunan", "Kendaraan", "Peralatan dan Inventaris"] },
    { kode: "1401", nama: "Akumulasi Penyusutan", tipe: "akumulasi-penyusutan", anak: ["Akum. Penyusutan Bangunan", "Akum. Penyusutan Kendaraan", "Akum. Penyusutan Peralatan"] },
    { kode: "1501", nama: "Aset Lainnya", tipe: "aset-lain", anak: ["Aset Lain-lain"] },
    { kode: "2101", nama: "Liabilitas Jangka Pendek", tipe: "liabilitas-pendek", anak: ["Utang Gaji", "Utang Operasional", "Dana Titipan"] },
    { kode: "2201", nama: "Liabilitas Jangka Panjang", tipe: "liabilitas-panjang", anak: ["Utang Bank Jangka Panjang"] },
    { kode: "3101", nama: "Modal", tipe: "modal", anak: ["Aset Neto Tidak Terikat", "Aset Neto Terikat"] },
    { kode: "4101", nama: "Pendapatan", tipe: "pendapatan", anak: ["Donasi", "Hibah", "Pendapatan Program"] },
    { kode: "5101", nama: "Beban", tipe: "beban", anak: ["Beban Gaji", "Beban Operasional", "Beban Program", "Beban Administrasi", "Beban Penyusutan"] },
    { kode: "6101", nama: "Beban Lainnya", tipe: "beban-lain", anak: ["Beban Administrasi Bank", "Beban Lain-lain"] },
    { kode: "7101", nama: "Pendapatan Lainnya", tipe: "pendapatan-lain", anak: ["Bunga Bank", "Pendapatan Lain-lain"] }
];

// Nomor versi bagan (sekarang 3). Akun yang dipasang bagan ini diberi tanda bagan: 3, supaya pembetulan satu kali
// di bawah tidak diulang. Versi 1: 4 akun Kas & Bank saja. Versi 2: Donasi dipecah dua (dibatalkan). Versi 3: sekarang.
var VERSI_BAGAN_AWAL = 3;

// Menyusun daftar akun lengkap dari bagan di atas. Id tetap: "awal-" + kode.
function susunAkunAwal() {
    var tanggal = tanggalMulaiPembukuan();
    var hasil = [];
    function akunAwal(kode, nama, tipe, indukId) {
        return { id: "awal-" + kode, kode: kode, nama: nama, tipe: tipe, indukId: indukId, catatan: "", nonAktif: false,
                 namaBank: "", noRekening: "", atasNamaRekening: "", saldoAwal: 0, tanggalSaldo: tanggal, bagan: VERSI_BAGAN_AWAL };
    }
    // Sub akun ditulis sebagai teks (nama saja) atau { nama, anak: [...] } kalau punya sub lagi.
    function tambahAnak(kodeInduk, daftarAnak, tipe) {
        daftarAnak.forEach(function (butir, i) {
            var nama = typeof butir === "string" ? butir : butir.nama;
            var kode = kodeInduk + String(i + 1).padStart(2, "0");
            hasil.push(akunAwal(kode, nama, tipe, "awal-" + kodeInduk));
            if (typeof butir !== "string" && butir.anak) { tambahAnak(kode, butir.anak, tipe); }
        });
    }
    baganAkunAwal.forEach(function (induk) {
        hasil.push(akunAwal(induk.kode, induk.nama, induk.tipe, ""));
        tambahAnak(induk.kode, induk.anak, induk.tipe);
    });
    return hasil;
}

// Dipasang sekali: saat daftar akun belum pernah disimpan sama sekali (kunci belum ada). Begitu daftar pernah
// disimpan (walau kosong setelah semua dihapus), tidak dipasang lagi. Tidak dicatat di Log Aktivitas.
//
// Peningkatan dari versi sebelumnya: dulu hanya 4 akun (Kas & Bank, Kas Kecil, Bank, Setara Kas) yang dipasang.
// Kalau isi daftar masih persis keempat akun itu dan belum diubah sama sekali, diganti dengan bagan lengkap.
function pasangAkunAwal() {
    var tersimpan = localStorage.getItem("daftarAkun");
    if (tersimpan !== null) {
        var daftar = modulAkun.ambil();
        var empat = ["1101 Kas & Bank", "110101 Kas Kecil", "110102 Bank", "110103 Setara Kas"];
        var belumDiubah = daftar.length === 4 && daftar.every(function (a, i) {
            return a.kode + " " + a.nama === empat[i] && a.id.indexOf("awal-") === 0 && !(Number(a.saldoAwal) > 0) && !a.nonAktif && !a.catatan && !a.namaBank && !a.noRekening && !a.atasNamaRekening;
        });
        if (!belumDiubah) { tingkatkanBaganAwal(daftar); return; }
    }
    if (modulAkun.simpan(susunAkunAwal())) { modulAkun.gambarTabel(); }
}

// Pembetulan satu kali: sempat ada versi bagan (2) yang memecah Donasi menjadi dua sub akun, Donasi Terikat dan
// Donasi Tidak Terikat. Pemisahan terikat/tidak terikat sekarang lewat Program (bukan lewat akun), jadi Donasi
// dikembalikan menjadi satu akun. Hanya untuk daftar yang bertanda bagan: 2 pada akun Donasi.
// Kedua sub akun dihapus kalau masih asli: nama asli, saldo 0, belum diubah, tanpa sub akun, belum dipakai Gaji/Preferensi.
// Yang sudah diubah atau dipakai dibiarkan. Donasi lalu ditandai bagan: 3 supaya tidak diulang.
function tingkatkanBaganAwal(daftar) {
    var donasi = daftar.find(function (a) { return a.id === "awal-410101"; });
    if (!donasi || donasi.bagan !== 2) { return; }
    var asli = { "awal-41010101": ["41010101", "Donasi Terikat"], "awal-41010102": ["41010102", "Donasi Tidak Terikat"] };
    var hasil = daftar.filter(function (a) {
        var ciri = asli[a.id];
        if (!ciri || a.indukId !== donasi.id) { return true; }                       // bukan sub akun yang dimaksud: dipertahankan
        var utuh = a.kode === ciri[0] && a.nama === ciri[1] && !(Number(a.saldoAwal) > 0) && !a.nonAktif && !a.catatan
            && !daftar.some(function (x) { return x.indukId === a.id; }) && !tempatAkunDipakai(a.kode);
        return !utuh;                                                                  // yang masih asli dibuang
    });
    donasi.bagan = VERSI_BAGAN_AWAL;
    if (modulAkun.simpan(hasil)) { modulAkun.gambarTabel(); }
}
pasangAkunAwal();

// Daftar akun kosong (misalnya semua akun sudah dihapus): tampilkan tombol "Pasang Bagan Akun Awal"
// di bawah tulisan "Belum ada akun", supaya bagan awal bisa dipasang lagi tanpa teknik khusus.
var tombolBaganAwal = document.createElement("button");
tombolBaganAwal.type = "button";
tombolBaganAwal.className = "tombol tombol-utama";
tombolBaganAwal.textContent = "Pasang Bagan Akun Awal";
tombolBaganAwal.hidden = true;
var wadahBaganAwal = document.createElement("div");
wadahBaganAwal.className = "aksi-kosong";
wadahBaganAwal.hidden = true;
wadahBaganAwal.appendChild(tombolBaganAwal);
document.querySelector("#isi-akun .bungkus-tabel").appendChild(wadahBaganAwal);

function perbaruiTombolBaganAwal() {
    var kosong = modulAkun.ambil().length === 0;
    wadahBaganAwal.hidden = !kosong;
    tombolBaganAwal.hidden = !kosong;
}
// Setiap tabel digambar ulang (simpan, hapus, segarkan, pindah tab), tombol ikut diperiksa
(function () {
    var gambarAsli = modulAkun.gambarTabel;
    modulAkun.gambarTabel = function () { gambarAsli(); perbaruiTombolBaganAwal(); };
})();
tombolBaganAwal.addEventListener("click", function () {
    if (modulAkun.ambil().length !== 0) { return; }   // hanya untuk daftar yang benar-benar kosong
    if (modulAkun.simpan(susunAkunAwal())) {
        modulAkun.gambarTabel();
        tampilkanNotifikasi("Bagan akun awal telah dipasang");
    }
});
modulAkun.gambarTabel();   // tampilkan tombol kalau daftar sedang kosong

saatTabDibuka.akun = function () { bereskanIndukBawaanLama(); modulAkun.gambarTabel(); };

function bukaAkunBaru() {
    modulAkun.bukaDariMenu();
    kolomKodeAkun.focus();
}

// Berubah tipe / centang Sub Akun -> tampilan ikut berubah
kolomTipeAkun.addEventListener("change", function () {
    isiPilihanIndukAkun("");   // induk harus bertipe sama, jadi pilihan lama dilepas
    perbaruiTampilanFormAkun();
    perbaruiKodeAkun();
    galatAkun.tipe.hidden = true;
    galatAkun.kode.hidden = true;
});
// Sub Akun dicentang: kolom Cari/Pilih induk muncul dan siap dipakai; tidak dicentang: akun menjadi induk
kotakSubAkun.addEventListener("change", function () {
    perbaruiTampilanFormAkun();
    if (kotakSubAkun.checked) {
        kolomCariIndukAkun.focus();   // langsung membuka daftar induk
    } else {
        galatAkun.induk.hidden = true;
        daftarIndukAkun.hidden = true;
        kolomCariIndukAkun.setAttribute("aria-expanded", "false");
    }
    perbaruiKodeAkun();
});
kolomTglSaldoAkun.addEventListener("change", perbaruiTglSaldoTeks);
kolomNamaAkun.addEventListener("input", function () { galatAkun.nama.hidden = true; });
pasangKolomRupiah(kolomSaldoAkun);   // titik ribuan langsung saat mengetik (umum/komponen-transaksi.js)
kolomSaldoAkun.addEventListener("input", function () { galatAkun.saldo.hidden = true; });
// Induk dipilih (lewat klik di daftar): tulis namanya di kolom, tutup daftar, dan hitung kode baru
pilihIndukAkun.addEventListener("change", function () {
    var akun = petaAkun().perId[pilihIndukAkun.value];
    kolomCariIndukAkun.value = akun ? akun.nama : "";
    daftarIndukAkun.hidden = true;
    kolomCariIndukAkun.setAttribute("aria-expanded", "false");
    galatAkun.induk.hidden = true;
    perbaruiKodeAkun();
});
kolomCariIndukAkun.addEventListener("focus", gambarDaftarIndukAkun);
kolomCariIndukAkun.addEventListener("click", gambarDaftarIndukAkun);
kolomCariIndukAkun.addEventListener("input", function () {
    // Mengetik membatalkan pilihan sebelumnya sampai pengguna memilih lagi dari daftar
    if (pilihIndukAkun.value !== "") {
        pilihIndukAkun.value = "";
        perbaruiKodeAkun();
    }
    gambarDaftarIndukAkun();
});
// Kolom ditinggalkan tanpa memilih: teks pencarian yang menggantung dibersihkan
kolomCariIndukAkun.addEventListener("blur", function () {
    setTimeout(function () {
        if (pilihIndukAkun.value === "") { kolomCariIndukAkun.value = ""; }
    }, 200);
});

document.getElementById("form-akun").addEventListener("submit", function (kejadian) {
    kejadian.preventDefault();
    sembunyikanGalatAkun();
    var daftar = modulAkun.ambil();
    var sedangMengubah = (modulAkun.idDiubah !== null);
    var lama = sedangMengubah ? daftar.find(function (a) { return a.id === modulAkun.idDiubah; }) : null;
    var nama = kolomNamaAkun.value.trim();
    var tipe = kolomTipeAkun.value;

    // Pemeriksaan satu per satu; berhenti di kesalahan pertama
    if (akunMilikKategoriDonasi(lama)) {
        tampilkanGalatAkun("nama", pesanAkunKategoriDonasi, kolomNamaAkun, "akun-umum");
        return;
    }
    if (tipe === "") {
        tampilkanGalatAkun("tipe", "Tipe Akun wajib dipilih.", kolomTipeAkun, "akun-umum");
        return;
    }
    if (nama === "") {
        tampilkanGalatAkun("nama", "Nama wajib diisi.", kolomNamaAkun, "akun-umum");
        return;
    }
    // Kalau Sub Akun dicentang, induknya wajib dipilih
    if (kotakSubAkun.checked && pilihIndukAkun.value === "") {
        tampilkanGalatAkun("induk", "Pilih akun induknya.", kolomCariIndukAkun, "akun-umum");
        return;
    }
    // Kode dihitung ulang saat disimpan (bukan hanya dibaca dari kolom), supaya pasti sesuai tipe dan induk
    perbaruiKodeAkun();
    var kode = kolomKodeAkun.value;
    if (kode === "") {
        tampilkanGalatAkun("kode", "Kode otomatis tidak bisa dibuat (nomor urut sudah penuh sampai 99).", kolomKodeAkun, "akun-umum");
        return;
    }
    var kembar = daftar.some(function (a) { return a.id !== modulAkun.idDiubah && a.kode === kode; });
    if (kembar) {
        tampilkanGalatAkun("kode", "Kode perkiraan sudah dipakai.", kolomKodeAkun, "akun-umum");
        return;
    }
    // Kode akun lama ikut berubah kalau tipe atau induknya diganti. Itu tidak boleh kalau:
    //  - akun punya sub akun (kode sub akun menempel pada kode induknya), atau
    //  - akun dipakai tempat lain (lihat tempatAkunDipakai; Gaji/Tunjangan dan Preferensi menyimpan akun lewat kodenya).
    if (lama && lama.kode !== kode) {
        if ((petaAkun().anak[lama.id] || []).length > 0) {
            tampilkanGalatAkun("tipe", "Tipe atau induk tidak bisa diubah karena akun ini punya sub akun.", kolomTipeAkun, "akun-umum");
            return;
        }
        var tempat = tempatAkunDipakai(lama.kode);
        if (tempat) {
            tampilkanGalatAkun("tipe", "Tipe atau induk tidak bisa diubah karena kodenya ikut berubah dan akun ini dipakai di " + tempat + ".", kolomTipeAkun, "akun-umum");
            return;
        }
    }
    // Saldo awal: kosong dianggap 0; titik pemisah ribuan boleh diketik
    var teksSaldo = kolomSaldoAkun.value.replace(/[.\s]/g, "");
    if (teksSaldo !== "" && !/^\d{1,15}$/.test(teksSaldo)) {
        tampilkanGalatAkun("saldo", "Saldo hanya boleh berisi angka, tanpa koma atau huruf.", kolomSaldoAkun, "akun-saldo");
        return;
    }
    // Tanggal saldo wajib hanya kalau ada saldo awal (keputusan pengguna 2026-11-09, PRD 5.3a)
    if (teksSaldo !== "" && Number(teksSaldo) !== 0 && kolomTglSaldoAkun.value === "") {
        tampilkanGalatAkun("tgl", "Tanggal saldo wajib diisi karena ada saldo awal.", kolomTglSaldoAkun, "akun-saldo");
        return;
    }

    var adaBank = (tipe === "kas-bank");   // info bank hanya disimpan untuk Kas & Bank
    var data = {
        kode: kode,
        nama: nama,
        tipe: tipe,
        indukId: kotakSubAkun.checked ? pilihIndukAkun.value : "",
        catatan: kolomCatatanAkun.value.trim(),
        nonAktif: kotakNonAktifAkun.checked,
        namaBank: adaBank ? kolomNamaBankAkun.value.trim() : "",
        noRekening: adaBank ? kolomNoRekAkun.value.trim() : "",
        atasNamaRekening: adaBank ? kolomAtasNamaAkun.value.trim() : "",
        saldoAwal: teksSaldo === "" ? 0 : Number(teksSaldo),
        tanggalSaldo: kolomTglSaldoAkun.value
    };
    var salinanLama = lama ? Object.assign({}, lama) : null;
    if (sedangMengubah) {
        Object.assign(lama, data);   // timpa nilai lama dengan yang baru
    } else {
        data.id = buatId("a");
        daftar.push(data);
    }
    if (modulAkun.simpan(daftar)) {
        modulAkun.selesaiSimpan(sedangMengubah, sedangMengubah ? lama : data, salinanLama);
        if (!sedangMengubah) { kolomKodeAkun.focus(); }
    }
});
