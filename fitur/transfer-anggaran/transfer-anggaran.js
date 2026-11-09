// ==================== Transfer Anggaran ====================
// Memindah rencana dari satu pos anggaran ke pos lain: akun lain, bulan lain, atau Divisi/Program lain (PRD 6.5, dari foto Accurate).
// Hanya rencana: tidak membuat jurnal dan tidak mengubah saldo. Nilai tidak boleh melebihi Sisa Anggaran (keputusan pengguna).
// Satu data tersimpan (kunci daftarTransferAnggaran):
//   { id, nomor, nama(=nomor), aturanId, tanggal, tahun, tipe, catatan, nilai,
//     bulanDari, kelompokDariId, akunDariId, akunDari ("kode nama"), bulanKe, kelompokKeId, akunKeId, akunKe,
//     dibuatOleh, dibuatPada, diubahPada }
// Memakai alat bersama: buatModulDaftar, buatNomorOtomatis, galatTanggalTransaksi, nomorTransaksiTerpakai, buatPengalihTab,
// dan fitur/anggaran/hitung.js. HTML: fitur/transfer-anggaran/tampilan.js. Gaya: fitur/transfer-anggaran/transfer-anggaran.css.

var kolomTahunTang = document.getElementById("tang-tahun");
var kolomTanggalTang = document.getElementById("tang-tanggal");
var pilihTipeTang = document.getElementById("tang-tipe");
var pilihBulanDariTang = document.getElementById("tang-bulan-dari");
var pilihBulanKeTang = document.getElementById("tang-bulan-ke");
var pilihKelompokDariTang = document.getElementById("tang-kelompok-dari");
var pilihKelompokKeTang = document.getElementById("tang-kelompok-ke");
var pilihAkunDariTang = document.getElementById("tang-akun-dari");
var pilihAkunKeTang = document.getElementById("tang-akun-ke");
var kolomNilaiTang = document.getElementById("tang-nilai");

isiPilihanTipeAnggaran(pilihTipeTang, "Silakan Pilih");   // Data Baru dibuka kosong (PRD 5.3a)
isiPilihanBulanAnggaran(pilihBulanDariTang, "Silakan Pilih");
isiPilihanBulanAnggaran(pilihBulanKeTang, "Silakan Pilih");

// "Januari 2026, 510101 Beban Listrik, Makam": asal atau tujuan di daftar
function teksPosTransferAng(t, bulan, akun, kelompokId) {
    var kelompok = namaKelompokAnggaran({ tipe: t.tipe, kelompokId: kelompokId });
    return (namaBulanKalender[Number(bulan) - 1] || "") + ", " + teksAman(akun) + (kelompok ? ", " + kelompok : "");
}

var modulTransferAnggaran = buatModulDaftar({
    id: "transfer-anggaran",
    judul: "Transfer Anggaran",
    kunci: "daftarTransferAnggaran",
    urutAwal: { kolom: "tanggal", arah: -1 },
    labelData: { nomor: "No Transfer", tanggal: "Tanggal", tahun: "Tahun", tipe: "Tipe", akunDari: "Dari Anggaran", akunKe: "Ke Anggaran", nilai: "Nilai Transfer (Rp)", catatan: "Catatan" },
    formatData: {
        tanggal: function (t) { return formatTanggal(t); },
        tipe: function (t) { return NAMA_TIPE_ANGGARAN[t] || ""; },
        nilai: function (n) { return formatRupiah(n); }
    },
    kolom: [
        { kunci: "nomor", judul: "No Transfer #" },
        { kunci: "tanggal", judul: "Tanggal", tampil: function (t) { return formatTanggal(t.tanggal); }, urut: function (t) { return t.tanggal || ""; } },
        { kunci: "tipe", judul: "Tipe", tampil: function (t) { return NAMA_TIPE_ANGGARAN[t.tipe] || ""; } },
        { kunci: "dari", judul: "Dari", tampil: function (t) { return teksPosTransferAng(t, t.bulanDari, t.akunDari, t.kelompokDariId); } },
        { kunci: "ke", judul: "Ke", tampil: function (t) { return teksPosTransferAng(t, t.bulanKe, t.akunKe, t.kelompokKeId); } },
        { kunci: "nilai", judul: "Nilai", rata: "kanan", tampil: function (t) { return formatAngka(t.nilai || 0); }, urut: function (t) { return String(t.nilai || 0).padStart(18, "0"); } }
    ],
    filter: [
        { judul: "Tahun", ambil: function (t) { return teksAman(t.tahun); }, turun: true },
        { judul: "Tipe", ambil: function (t) { return NAMA_TIPE_ANGGARAN[t.tipe] || ""; } }
    ],
    pesanKosong: "Belum ada transfer anggaran. Klik tombol + untuk membuat.",
    isiForm: function (data) {
        // Data Baru dibuka kosong (PRD 5.3a): tanggal, tahun, tipe, dan bulan dipilih sendiri
        kolomTanggalTang.value = data ? teksAman(data.tanggal) : "";
        aturBatasTanggal(kolomTanggalTang);
        kolomTahunTang.value = data ? teksAman(data.tahun) : "";
        pilihTipeTang.value = data && NAMA_TIPE_ANGGARAN[data.tipe] ? data.tipe : "";
        pilihBulanDariTang.value = data ? String(data.bulanDari) : "";
        pilihBulanKeTang.value = data ? String(data.bulanKe) : "";
        nomorTransferAng.mulai(data ? data.nomor : "");
        isiPilihanKelompokTang(data ? teksAman(data.kelompokDariId) : "", data ? teksAman(data.kelompokKeId) : "");
        isiPilihanAkunTang(data ? teksAman(data.akunDariId) : "", data ? teksAman(data.akunKeId) : "");
        kolomNilaiTang.value = data ? teksAngkaIsian(data.nilai) : "";
        document.getElementById("tang-catatan").value = data ? teksAman(data.catatan) : "";
        document.getElementById("tang-pesan-galat").hidden = true;
        pilihTabTang("rincian");
        perbaruiSisaTang();
    }
});

var pilihTabTang = buatPengalihTab(document.querySelectorAll("#isi-transfer-anggaran [data-tang-tab]"), "tangTab",
    { rincian: "tang-panel-rincian", info: "tang-panel-info" });

// Nomor: otomatis dari aturan penomoran bertipe Transfer Anggaran, atau diketik sendiri
var nomorTransferAng = buatNomorOtomatis({
    saklar: document.getElementById("tang-nomor-otomatis"),
    pilihan: document.getElementById("tang-aturan-nomor"),
    kolom: document.getElementById("tang-nomor"),
    contoh: document.getElementById("tang-contoh-nomor"),
    tanggal: kolomTanggalTang,
    tipe: "transfer-anggaran",
    namaTipe: "Transfer Anggaran"
});

// Pos asal atau tujuan sesuai isian formulir
function posDariTang() {
    return { tipe: pilihTipeTang.value, tahun: Number(kolomTahunTang.value), bulan: Number(pilihBulanDariTang.value),
             kelompokId: pilihTipeTang.value === "umum" ? "" : pilihKelompokDariTang.value, akunId: pilihAkunDariTang.value };
}
function posKeTang() {
    return { tipe: pilihTipeTang.value, tahun: Number(kolomTahunTang.value), bulan: Number(pilihBulanKeTang.value),
             kelompokId: pilihTipeTang.value === "umum" ? "" : pilihKelompokKeTang.value, akunId: pilihAkunKeTang.value };
}

// Divisi/Program asal dan tujuan mengikuti Tipe dan boleh berbeda; Tipe Umum: disembunyikan
function isiPilihanKelompokTang(dari, ke) {
    var tipe = pilihTipeTang.value;
    document.querySelectorAll("#isi-transfer-anggaran .tang-baris-kelompok").forEach(function (b) { b.hidden = tipe !== "divisi" && tipe !== "program"; });   // Umum atau belum dipilih
    isiPilihanKelompokAnggaran(pilihKelompokDariTang, tipe, dari);
    isiPilihanKelompokAnggaran(pilihKelompokKeTang, tipe, ke);
}

// Akun asal: yang punya anggaran di bulan asal. Akun tujuan: akun pendapatan atau beban mana pun (keputusan pengguna).
function isiPilihanAkunTang(dari, ke) {
    var opsi = function (terpilih) {
        return { kosong: "Cari/Pilih Akun Perkiraan...", terpilih: terpilih, teks: function (a) { return teksAman(a.kode) + " " + teksAman(a.nama); } };
    };
    var punyaAnggaran = akunPeriodeAnggaran(posDariTang());
    isiPilihan(pilihAkunDariTang, akunBolehDianggarkan().filter(function (a) { return punyaAnggaran[a.id] || a.id === dari; }).sort(urutKodeAkun), opsi(dari));
    isiPilihan(pilihAkunKeTang, akunBolehDianggarkan().sort(urutKodeAkun), opsi(ke));
}

// Sisa Anggaran akun asal, angka yang sama dengan Monitor. Saat mengubah, transfer ini sendiri tidak dihitung.
function perbaruiSisaTang() {
    var teks = document.getElementById("tang-sisa");
    var pos = posDariTang();
    teks.textContent = pos.akunId ? formatRupiah(sisaPosAnggaran(pos, modulTransferAnggaran.idDiubah)) : "-";
}

pilihTipeTang.addEventListener("change", function () {
    isiPilihanKelompokTang("", "");
    isiPilihanAkunTang("", pilihAkunKeTang.value);
    perbaruiSisaTang();
});
[kolomTahunTang, pilihBulanDariTang, pilihKelompokDariTang].forEach(function (kolom) {
    kolom.addEventListener("change", function () {
        isiPilihanAkunTang(pilihAkunDariTang.value, pilihAkunKeTang.value);
        perbaruiSisaTang();
    });
});
pilihAkunDariTang.addEventListener("change", perbaruiSisaTang);
pasangKolomRupiah(kolomNilaiTang);   // titik ribuan langsung saat mengetik

// ----- Menyimpan (PRD 6.5) -----
function tampilkanGalatTang(pesan, kolomFokus) {
    var kotak = document.getElementById("tang-pesan-galat");
    kotak.textContent = pesan;   // textContent: aman dari kode HTML
    kotak.hidden = false;
    if (kolomFokus) { kolomFokus.focus(); }
}

document.getElementById("form-transfer-anggaran").addEventListener("submit", function (e) {
    e.preventDefault();
    document.getElementById("tang-pesan-galat").hidden = true;
    var daftar = modulTransferAnggaran.ambil();
    var sedangMengubah = (modulTransferAnggaran.idDiubah !== null);
    var lama = sedangMengubah ? daftar.find(function (t) { return t.id === modulTransferAnggaran.idDiubah; }) : null;
    var tanggal = kolomTanggalTang.value;

    // Pemeriksaan satu per satu; berhenti di kesalahan pertama
    var tahun = Number(kolomTahunTang.value);
    if (!Number.isInteger(tahun) || tahun < 2000 || tahun > 2100) { tampilkanGalatTang("Tahun wajib diisi, dari 2000 sampai 2100.", kolomTahunTang); return; }
    var galatTanggal = galatTanggalTransaksi(tanggal, lama, { catat: "transfer anggaran", ini: "Transfer ini" });
    if (galatTanggal) { tampilkanGalatTang(galatTanggal.pesan, galatTanggal.diKolom ? kolomTanggalTang : null); return; }
    pilihTabTang("rincian");
    if (!NAMA_TIPE_ANGGARAN[pilihTipeTang.value]) { tampilkanGalatTang("Tipe wajib dipilih.", pilihTipeTang); return; }
    var dari = posDariTang(), ke = posKeTang();
    var namaKelompok = dari.tipe === "divisi" ? "Divisi" : "Program";
    if (dari.tipe !== "umum" && !dari.kelompokId) { tampilkanGalatTang(namaKelompok + " asal wajib dipilih.", pilihKelompokDariTang); return; }
    if (!dari.bulan) { tampilkanGalatTang("Bulan asal wajib dipilih.", pilihBulanDariTang); return; }
    var perId = petaAkunLaporan(bacaDaftarAkun());
    if (!dari.akunId || !perId[dari.akunId]) { tampilkanGalatTang("Anggaran asal wajib dipilih.", pilihAkunDariTang); return; }
    if (dari.tipe !== "umum" && !ke.kelompokId) { tampilkanGalatTang(namaKelompok + " tujuan wajib dipilih.", pilihKelompokKeTang); return; }
    if (!ke.bulan) { tampilkanGalatTang("Bulan tujuan wajib dipilih.", pilihBulanKeTang); return; }
    if (!ke.akunId || !perId[ke.akunId]) { tampilkanGalatTang("Anggaran tujuan wajib dipilih.", pilihAkunKeTang); return; }
    if (dari.akunId === ke.akunId && dari.bulan === ke.bulan && dari.kelompokId === ke.kelompokId) {
        tampilkanGalatTang("Anggaran asal dan tujuan tidak boleh sama.", pilihAkunKeTang);
        return;
    }
    var nilai = angkaDariTeks(kolomNilaiTang.value);
    if (!(nilai > 0)) { tampilkanGalatTang("Nilai Transfer wajib diisi dan lebih dari 0.", kolomNilaiTang); return; }
    var sisa = sisaPosAnggaran(dari, lama ? lama.id : null);
    if (nilai > sisa) { tampilkanGalatTang("Nilai Transfer melebihi Sisa Anggaran (" + formatRupiah(sisa) + ").", kolomNilaiTang); return; }

    var infoNomor = nomorTransferAng.ambil(tanggal);
    if (infoNomor.galat) { tampilkanGalatTang(infoNomor.galat, infoNomor.kolomFokus); return; }
    if (nomorTransaksiTerpakai(infoNomor.nomor, daftar, modulTransferAnggaran.idDiubah, null)) {
        tampilkanGalatTang('No Transfer "' + infoNomor.nomor + '" sudah dipakai.' + (infoNomor.otomatis ? " Matikan Otomatis dan ketik nomor lain." : ""), nomorTransferAng.kolomNomorKembar());
        return;
    }

    function teksAkun(a) { return teksAman(a.kode) + " " + teksAman(a.nama); }
    var data = Object.assign({}, lama || {}, {
        id: lama ? lama.id : buatId("tang"),
        nomor: infoNomor.nomor, nama: infoNomor.nomor, aturanId: infoNomor.aturanId, tanggal: tanggal, tahun: tahun, tipe: dari.tipe,
        bulanDari: dari.bulan, kelompokDariId: dari.kelompokId, akunDariId: dari.akunId, akunDari: teksAkun(perId[dari.akunId]),
        bulanKe: ke.bulan, kelompokKeId: ke.kelompokId, akunKeId: ke.akunId, akunKe: teksAkun(perId[ke.akunId]),
        nilai: nilai, catatan: document.getElementById("tang-catatan").value.trim()
    });
    if (lama) { data.diubahPada = waktuSekarang(); } else { data.dibuatOleh = penggunaAktif; data.dibuatPada = waktuSekarang(); }
    var daftarBaru = lama
        ? daftar.map(function (t) { return t.id === lama.id ? data : t; })
        : daftar.concat([data]);
    if (!modulTransferAnggaran.simpan(daftarBaru)) { return; }
    // Hitungan nomor baru naik setelah data tersimpan; nomornya bisa berubah kalau aturan dipakai di tempat lain
    var nomorDipakai = nomorTransferAng.pakai(infoNomor, tanggal);
    if (nomorDipakai !== data.nomor) {
        data.nomor = nomorDipakai;
        data.nama = nomorDipakai;
        modulTransferAnggaran.simpan(daftarBaru);
    }
    modulTransferAnggaran.selesaiSimpan(sedangMengubah, data, lama);   // notifikasi, Log Aktivitas, formulir kosong / kembali ke daftar
});

// Akun, anggaran, dan aturan nomor bisa berubah di halaman lain: muat ulang tiap tab dibuka
saatTabDibuka["transfer-anggaran"] = function () {
    modulTransferAnggaran.gambarTabel();
    nomorTransferAng.segarkan();
    isiPilihanKelompokTang(pilihKelompokDariTang.value, pilihKelompokKeTang.value);
    isiPilihanAkunTang(pilihAkunDariTang.value, pilihAkunKeTang.value);
    perbaruiSisaTang();
};

// Dipanggil dari popup Buku Besar, kotak Transfer Anggaran
function bukaTransferAnggaranBaru() {
    modulTransferAnggaran.bukaDariMenu();
}
