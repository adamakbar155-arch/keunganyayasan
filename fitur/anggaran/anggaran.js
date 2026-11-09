// ==================== Anggaran ====================
// Rencana nilai akun pendapatan dan beban untuk satu bulan (PRD 6.5, mengikuti Accurate). Hanya rencana: tidak membuat jurnal
// dan tidak mengubah saldo (PRD 4.3). Realisasinya nanti dibaca dari jurnal oleh Monitor Anggaran.
// Satu data tersimpan (kunci daftarAnggaran):
//   { id, nama (label periode, dipakai notifikasi dan Log), bulan (1-12), tahun, tipe ("umum" | "divisi" | "program"),
//     kelompokId (id Divisi/Program; "" untuk Umum), catatan, penganalisa, rincian[baris], ringkasanRincian, total }
// Satu baris: { id, akunId, kode, nama, nilai }
// Memakai alat bersama: buatModulDaftar, buatKolomCari, buatPengalihTab, barisKosongTabel, tombolHapusBaris, pasangKolomRupiah,
// dan alat Anggaran di fitur/anggaran/hitung.js.
// HTML: fitur/anggaran/tampilan.js. Gaya: fitur/anggaran/anggaran.css.

var pilihBulanAng = document.getElementById("ang-bulan");
var kolomTahunAng = document.getElementById("ang-tahun");
var pilihTipeAng = document.getElementById("ang-tipe");
var pilihKelompokAng = document.getElementById("ang-kelompok");
var badanRincianAng = document.getElementById("ang-rincian");
var barisAng = [];   // salinan kerja baris anggaran yang sedang dibuka

isiPilihanBulanAnggaran(pilihBulanAng, "Silakan Pilih");   // Data Baru dibuka kosong (PRD 5.3a)
isiPilihanTipeAnggaran(pilihTipeAng, "Silakan Pilih");

function teksPeriodeAng(d) {
    return (namaBulanKalender[Number(d.bulan) - 1] || "") + " " + teksAman(d.tahun);
}

var modulAnggaran = buatModulDaftar({
    id: "anggaran",
    judul: "Anggaran",
    kunci: "daftarAnggaran",
    urutAwal: { kolom: "periode", arah: -1 },
    labelData: { nama: "Periode", tipe: "Tipe", catatan: "Catatan", penganalisa: "Penganalisa", ringkasanRincian: "Rincian", total: "Total (Rp)" },
    formatData: {
        tipe: function (t) { return NAMA_TIPE_ANGGARAN[t] || ""; },
        total: function (n) { return formatRupiah(n); }
    },
    kolom: [
        { kunci: "periode", judul: "Periode", tampil: teksPeriodeAng,
          urut: function (d) { return teksAman(d.tahun) + String(Number(d.bulan) || 0).padStart(2, "0"); } },
        { kunci: "tipe", judul: "Tipe", tampil: function (d) { return NAMA_TIPE_ANGGARAN[d.tipe] || ""; } },
        { kunci: "kelompok", judul: "Divisi/Program", tampil: namaKelompokAnggaran },
        { kunci: "catatan", judul: "Catatan" },
        // Pengurutan daftar membandingkan teks, jadi angka diberi nol di depan (seperti kolom Nilai di Pencatatan Donasi)
        { kunci: "total", judul: "Total", rata: "kanan", tampil: function (d) { return formatAngka(d.total || 0); },
          urut: function (d) { return String(d.total || 0).padStart(18, "0"); } }
    ],
    filter: [
        { judul: "Tahun", ambil: function (d) { return teksAman(d.tahun); }, turun: true },
        { judul: "Tipe", ambil: function (d) { return NAMA_TIPE_ANGGARAN[d.tipe] || ""; } }
    ],
    pesanKosong: "Belum ada anggaran. Klik tombol + untuk menambah.",
    // Akun yang sudah menjadi asal Transfer Anggaran: hapus Transfer-nya dulu (PRD 6.5)
    alasanTolakHapus: function (d) {
        var jumlah = transferAsalAnggaran(d).length;
        return jumlah > 0 ? 'Anggaran "' + teksAman(d.nama) + '" sudah dipakai di ' + jumlah + " Transfer Anggaran. Hapus Transfer-nya dulu." : "";
    },
    isiForm: function (data) {
        // Data Baru dibuka kosong (PRD 5.3a): bulan, tahun, dan tipe dipilih sendiri
        pilihBulanAng.value = data ? String(data.bulan) : "";
        kolomTahunAng.value = data ? teksAman(data.tahun) : "";
        pilihTipeAng.value = data && NAMA_TIPE_ANGGARAN[data.tipe] ? data.tipe : "";
        isiPilihanKelompokAng(data ? teksAman(data.kelompokId) : "");
        document.getElementById("ang-catatan").value = data ? teksAman(data.catatan) : "";
        document.getElementById("ang-penganalisa").value = data ? teksAman(data.penganalisa) : "";
        barisAng = rincianAman(data).map(function (b) { return Object.assign({}, b); });
        cariAkunAng.tutup();
        document.getElementById("ang-cari-akun").value = "";
        gambarRincianAng();
        document.getElementById("ang-pesan-galat").hidden = true;
        pilihTabAng("rincian");
    },
    // Baris anggaran ikut diingat per tab (PRD 6.10)
    keadaanTambahan: {
        ambil: function () { return barisAng.map(function (b) { return Object.assign({}, b); }); },
        pakai: function (simpanan) { barisAng = simpanan.map(function (b) { return Object.assign({}, b); }); gambarRincianAng(); }
    }
});

var pilihTabAng = buatPengalihTab(document.querySelectorAll("#isi-anggaran [data-ang-tab]"), "angTab",
    { rincian: "ang-panel-rincian", info: "ang-panel-info" });

// Kolom Divisi/Program mengikuti Tipe; Tipe Umum: disembunyikan
function isiPilihanKelompokAng(terpilih) {
    pilihKelompokAng.hidden = pilihTipeAng.value !== "divisi" && pilihTipeAng.value !== "program";   // Umum atau belum dipilih
    isiPilihanKelompokAnggaran(pilihKelompokAng, pilihTipeAng.value, terpilih);
}
pilihTipeAng.addEventListener("change", function () { isiPilihanKelompokAng(""); });

// ----- Tabel rincian dan total -----
function gambarRincianAng() {
    badanRincianAng.textContent = "";
    var total = 0;
    if (barisAng.length === 0) { badanRincianAng.appendChild(barisKosongTabel(4)); }
    barisAng.forEach(function (b) {
        total += Number(b.nilai) || 0;
        var tr = document.createElement("tr");
        tr.className = "jurnal-baris-data";
        tr.tabIndex = 0;
        tr.title = "Klik untuk mengubah";
        function sel(teks, kelas) {
            var td = document.createElement("td");
            td.className = kelas;
            td.textContent = teks;   // textContent: aman dari kode HTML
            tr.appendChild(td);
            return td;
        }
        var tdGeser = sel("", "jurnal-kol-geser");   // kolom ikon, sama seperti formulir lain dan foto Accurate
        tdGeser.setAttribute("aria-hidden", "true");
        tdGeser.innerHTML = IKON_GESER;   // ikon tetap
        sel(teksAman(b.nama), "jurnal-sel-teks");
        sel(teksAman(b.kode), "jurnal-sel-teks jurnal-sel-kode");
        sel(formatAngka(b.nilai), "jurnal-sel-angka");
        tr.appendChild(tombolHapusBaris("Hapus baris " + teksAman(b.kode) + " " + teksAman(b.nama), function () {
            barisAng = barisAng.filter(function (x) { return x.id !== b.id; });
            gambarRincianAng();
        }));
        tr.addEventListener("click", function () { bukaRincianAng(null, b); });
        tr.addEventListener("keydown", function (e) { if (e.key === "Enter" && e.target === tr) { e.preventDefault(); bukaRincianAng(null, b); } });
        badanRincianAng.appendChild(tr);
    });
    document.getElementById("ang-jumlah").textContent = barisAng.length ? barisAng.length + " " : "";   // seperti Accurate: "2 Rincian Anggaran"
    document.getElementById("ang-total").textContent = formatRupiah(total);
}

// ----- Cari/Pilih akun -----
// Akun yang bisa dianggarkan dan belum ada di rincian ini
function akunPilihanAng() {
    var dipakai = barisAng.map(function (b) { return b.akunId; });
    return akunBolehDianggarkan().filter(function (a) { return dipakai.indexOf(a.id) === -1; });
}
var cariAkunAng = buatKolomCari({
    kolom: document.getElementById("ang-cari-akun"),
    daftar: document.getElementById("ang-daftar-akun"),
    ambilData: akunPilihanAng,
    cocok: function (a, kata) { return kata === "" || (teksAman(a.nama) + " " + teksAman(a.kode)).toLowerCase().indexOf(kata) !== -1; },
    urut: urutKodeAkun,
    gambarButir: function (li, a, kata) {
        var nama = document.createElement("div");
        nama.className = "jurnal-pilihan-nama";
        tulisDenganSorot(nama, teksAman(a.nama), kata);
        var bawah = document.createElement("div");
        bawah.className = "jurnal-pilihan-bawah";
        var kode = document.createElement("span");
        tulisDenganSorot(kode, teksAman(a.kode), kata);
        var tipe = document.createElement("span");
        tipe.className = "jurnal-pilihan-tipe";
        tipe.textContent = tipeAkun[a.tipe] || "";
        bawah.appendChild(kode);
        bawah.appendChild(tipe);
        li.appendChild(nama);
        li.appendChild(bawah);
    },
    teksKosong: function (adaData) {
        return adaData ? "Tidak ada akun yang cocok." : "Belum ada akun pendapatan atau beban yang bisa dipilih. Buat di Buku Besar, Akun Perkiraan.";
    },
    saatPilih: function (a) { bukaRincianAng(a, null); }
});

document.getElementById("ang-ambil").addEventListener("click", function () {
    tampilkanNotifikasi("Ambil belum tersedia.", "peringatan");   // fungsinya menunggu penjelasan (PRD 6.5)
});

// ----- Popup Anggaran -----
var dialogRincianAng = document.getElementById("dialog-rincian-anggaran");
var kolomNilaiRang = document.getElementById("rang-nilai");
var galatNilaiRang = document.getElementById("galat-rang-nilai");
var rincianDibukaAng = null;   // { akun, baris } yang sedang diisi

// akun = akun baru dipilih (baris baru); b = baris yang sudah ada (diubah)
function bukaRincianAng(akun, b) {
    rincianDibukaAng = { akun: akun, baris: b };
    document.getElementById("rang-nama").value = teksAman(b ? b.nama : akun.nama);
    kolomNilaiRang.value = b ? teksAngkaIsian(b.nilai) : "";
    document.getElementById("hapus-rincian-anggaran").hidden = !b;
    galatNilaiRang.hidden = true;
    dialogRincianAng.showModal();
    kolomNilaiRang.focus();
}

function tutupRincianAng() {
    rincianDibukaAng = null;
    cariAkunAng.abaikanFokusSebentar();   // fokus yang kembali ke kolom cari tidak langsung membuka daftar
    dialogRincianAng.close();
}

function simpanRincianAng() {
    if (!rincianDibukaAng) { return; }
    var nilai = angkaDariTeks(kolomNilaiRang.value);
    if (!(nilai > 0)) {
        galatNilaiRang.textContent = "Anggaran wajib diisi dan lebih dari 0.";
        galatNilaiRang.hidden = false;
        kolomNilaiRang.focus();
        return;
    }
    var baru = !rincianDibukaAng.baris;
    if (baru) {
        var a = rincianDibukaAng.akun;
        barisAng.push({ id: buatId("ra"), akunId: a.id, kode: teksAman(a.kode), nama: teksAman(a.nama), nilai: nilai });
    } else {
        rincianDibukaAng.baris.nilai = nilai;
    }
    tutupRincianAng();
    gambarRincianAng();
    document.getElementById("ang-pesan-galat").hidden = true;   // pesan "wajib diisi" tidak berlaku lagi
    if (baru) { cariAkunAng.fokusUlang(); }   // siap memilih akun berikutnya
}
pasangKolomRupiah(kolomNilaiRang);   // titik ribuan langsung saat mengetik
kolomNilaiRang.addEventListener("input", function () { galatNilaiRang.hidden = true; });
kolomNilaiRang.addEventListener("keydown", function (e) { if (e.key === "Enter") { e.preventDefault(); simpanRincianAng(); } });
document.getElementById("lanjut-rincian-anggaran").addEventListener("click", simpanRincianAng);
document.getElementById("tutup-rincian-anggaran").addEventListener("click", tutupRincianAng);
document.getElementById("hapus-rincian-anggaran").addEventListener("click", function () {
    if (!rincianDibukaAng || !rincianDibukaAng.baris) { return; }
    var id = rincianDibukaAng.baris.id;
    barisAng = barisAng.filter(function (x) { return x.id !== id; });
    tutupRincianAng();
    gambarRincianAng();
});
// Esc: peristiwa "cancel" datang SEBELUM popup tertutup
dialogRincianAng.addEventListener("cancel", function () { rincianDibukaAng = null; cariAkunAng.abaikanFokusSebentar(); });

// ----- Menyimpan (PRD 6.5) -----
function tampilkanGalatAng(pesan, kolomFokus) {
    var kotak = document.getElementById("ang-pesan-galat");
    kotak.textContent = pesan;   // textContent: aman dari kode HTML
    kotak.hidden = false;
    if (kolomFokus) { kolomFokus.focus(); }
}

document.getElementById("form-anggaran").addEventListener("submit", function (kejadian) {
    kejadian.preventDefault();
    document.getElementById("ang-pesan-galat").hidden = true;
    var daftar = modulAnggaran.ambil();
    var sedangMengubah = (modulAnggaran.idDiubah !== null);
    var lama = sedangMengubah ? daftar.find(function (d) { return d.id === modulAnggaran.idDiubah; }) : null;

    // Bulan bisa kosong kalau data lama di penyimpanan rusak
    var bulan = Number(pilihBulanAng.value);
    if (!bulan) {
        tampilkanGalatAng("Bulan wajib dipilih.", pilihBulanAng);
        return;
    }
    var tahun = Number(kolomTahunAng.value);
    if (!Number.isInteger(tahun) || tahun < 2000 || tahun > 2100) {
        tampilkanGalatAng("Tahun wajib diisi, dari 2000 sampai 2100.", kolomTahunAng);
        return;
    }
    var tipe = pilihTipeAng.value;
    if (!NAMA_TIPE_ANGGARAN[tipe]) {
        tampilkanGalatAng("Tipe wajib dipilih.", pilihTipeAng);
        return;
    }
    var kelompokId = tipe === "umum" ? "" : pilihKelompokAng.value;
    if (tipe !== "umum" && kelompokId === "") {
        tampilkanGalatAng((tipe === "divisi" ? "Divisi" : "Program") + " wajib dipilih.", pilihKelompokAng);
        return;
    }
    if (barisAng.length === 0) {
        pilihTabAng("rincian");
        tampilkanGalatAng("Rincian Anggaran wajib diisi, minimal satu akun.", document.getElementById("ang-cari-akun"));
        return;
    }
    // Periode dan kelompok yang sama hanya satu formulir, supaya rencana tidak terhitung dua kali
    var kembar = daftar.some(function (d) {
        return d.id !== (lama ? lama.id : "") && Number(d.bulan) === bulan && Number(d.tahun) === tahun && d.tipe === tipe && teksAman(d.kelompokId) === kelompokId;
    });
    var dataPeriode = { bulan: bulan, tahun: tahun, tipe: tipe, kelompokId: kelompokId };
    if (kembar) {
        var keKelompok = namaKelompokAnggaran(dataPeriode);
        tampilkanGalatAng("Anggaran " + teksPeriodeAng(dataPeriode) + (keKelompok ? ", " + keKelompok : ", Umum") + " sudah ada. Buka dari Daftar untuk mengubahnya.");
        return;
    }
    // Akun asal Transfer Anggaran tidak boleh hilang dari anggaran ini (PRD 6.5)
    if (lama) {
        var masihAda = transferAsalAnggaran(Object.assign({}, dataPeriode, { rincian: barisAng })).map(function (t) { return t.id; });
        var terlepas = transferAsalAnggaran(lama).filter(function (t) { return masihAda.indexOf(t.id) === -1; });
        if (terlepas.length > 0) {
            tampilkanGalatAng('Akun asal Transfer Anggaran "' + teksAman(terlepas[0].nomor) + '" tidak boleh dibuang atau dipindah periodenya. Hapus Transfer-nya dulu.');
            return;
        }
    }

    var kelompok = namaKelompokAnggaran(dataPeriode);
    var data = Object.assign({}, dataPeriode, {
        id: lama ? lama.id : buatId("ang"),
        nama: teksPeriodeAng(dataPeriode) + ", " + (kelompok || "Umum"),
        catatan: document.getElementById("ang-catatan").value.trim(),
        penganalisa: document.getElementById("ang-penganalisa").value.trim(),
        rincian: barisAng.map(function (b) { return Object.assign({}, b); }),
        ringkasanRincian: barisAng.map(function (b) { return teksAman(b.kode) + " " + teksAman(b.nama) + " " + formatAngka(b.nilai); }).join("; "),
        total: barisAng.reduce(function (n, b) { return n + (Number(b.nilai) || 0); }, 0)
    });
    var daftarBaru = lama
        ? daftar.map(function (d) { return d.id === lama.id ? data : d; })
        : daftar.concat([data]);
    if (!modulAnggaran.simpan(daftarBaru)) { return; }
    modulAnggaran.selesaiSimpan(sedangMengubah, data, lama);   // notifikasi, Log Aktivitas, formulir kosong / kembali ke daftar
});

// Dipanggil dari kotak Anggaran di popup Buku Besar (umum/inti.js)
function bukaAnggaranBaru() {
    modulAnggaran.bukaDariMenu();
}
// Setiap tab dibuka: nama Divisi/Program di daftar dan pilihan bisa berubah
saatTabDibuka.anggaran = function () { modulAnggaran.gambarTabel(); };
