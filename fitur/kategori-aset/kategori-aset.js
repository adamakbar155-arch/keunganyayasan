// ==================== Kategori Aset ====================
// Menyimpan tiga akun dan umur aset, supaya formulir Aset Tetap cukup memilih kategori (PRD 6.6).
// Satu data (kunci daftarKategoriAset): { id, nama, tidakDisusutkan, akunAsetId, akunAkumulasiId, akunBebanId, umurTahun }
// HTML: fitur/kategori-aset/tampilan.js. Gaya: fitur/aset-tetap/aset-tetap.css.

var pilihAkunAsetKat = document.getElementById("kat-aset-akun");
var pilihAkumulasiKat = document.getElementById("kat-aset-akumulasi");
var pilihBebanKat = document.getElementById("kat-aset-beban");
var kolomUmurKat = document.getElementById("kat-aset-umur");
var centangTidakKat = document.getElementById("kat-aset-tidak");

function teksAkunKategoriAset(a) { return teksAman(a.kode) + " " + teksAman(a.nama); }

function namaAkunKategoriAset(id) {
    var a = bacaDaftarAkun().find(function (x) { return x && x.id === id; });
    return a ? teksAkunKategoriAset(a) : "";
}

// Pilihan akun menurut tipe (akun paling bawah, tidak Non Aktif); akun lama yang terpilih tetap tampil
function isiPilihanAkunKategori(select, tipe, terpilih) {
    var daftar = akunUntukJurnal().filter(function (a) { return a && tipe[a.tipe] && (!a.nonAktif || a.id === terpilih); }).sort(urutKodeAkun);
    isiPilihan(select, daftar, { kosong: "Cari/Pilih Akun Perkiraan...", kosongKalauTakAda: "Belum ada akun", terpilih: terpilih, teks: teksAkunKategoriAset });
}

function aturBarisSusutKategori() {
    document.querySelectorAll("#isi-kategori-aset .kat-aset-susut").forEach(function (b) { b.hidden = centangTidakKat.checked; });
}
centangTidakKat.addEventListener("change", aturBarisSusutKategori);

var modulKategoriAset = buatModulDaftar({
    id: "kategori-aset",
    judul: "Kategori Aset",
    kunci: "daftarKategoriAset",
    labelData: { nama: "Nama", umurTahun: "Umur (tahun)" },
    kolom: [
        { kunci: "nama", judul: "Nama" },
        { kunci: "akun", judul: "Akun Aset", tampil: function (k) { return namaAkunKategoriAset(k.akunAsetId); } },
        { kunci: "akumulasi", judul: "Akun Akumulasi", tampil: function (k) { return namaAkunKategoriAset(k.akunAkumulasiId); } },
        { kunci: "beban", judul: "Akun Beban", tampil: function (k) { return namaAkunKategoriAset(k.akunBebanId); } },
        { kunci: "umur", judul: "Umur", tampil: function (k) { return k.tidakDisusutkan === true ? "Tidak disusutkan" : teksAman(k.umurTahun) + " tahun"; } }
    ],
    pesanKosong: "Belum ada kategori aset. Klik tombol + untuk menambah.",
    alasanTolakHapus: function (k) {
        var jumlah = bacaAsetTetap().filter(function (a) { return a.kategoriId === k.id; }).length;
        return jumlah > 0 ? 'Kategori "' + teksAman(k.nama) + '" masih dipakai oleh ' + jumlah + " aset." : "";
    },
    isiForm: function (data) {
        document.getElementById("kat-aset-nama").value = data ? teksAman(data.nama) : "";
        centangTidakKat.checked = !!data && data.tidakDisusutkan === true;
        isiPilihanAkunKategori(pilihAkunAsetKat, { "aset-tetap": true }, data ? teksAman(data.akunAsetId) : "");
        isiPilihanAkunKategori(pilihAkumulasiKat, { "akumulasi-penyusutan": true }, data ? teksAman(data.akunAkumulasiId) : "");
        isiPilihanAkunKategori(pilihBebanKat, { "beban": true, "beban-lain": true }, data ? teksAman(data.akunBebanId) : "");
        kolomUmurKat.value = data && data.umurTahun ? String(data.umurTahun) : "";
        document.getElementById("kat-aset-pesan-galat").hidden = true;
        aturBarisSusutKategori();
    }
});

function tampilkanGalatKategoriAset(pesan, kolomFokus) {
    var kotak = document.getElementById("kat-aset-pesan-galat");
    kotak.textContent = pesan;   // textContent: aman dari kode HTML
    kotak.hidden = false;
    if (kolomFokus) { kolomFokus.focus(); }
}

document.getElementById("form-kategori-aset").addEventListener("submit", function (e) {
    e.preventDefault();
    document.getElementById("kat-aset-pesan-galat").hidden = true;
    var daftar = modulKategoriAset.ambil();
    var sedangMengubah = (modulKategoriAset.idDiubah !== null);
    var lama = sedangMengubah ? daftar.find(function (k) { return k.id === modulKategoriAset.idDiubah; }) : null;
    var kolomNama = document.getElementById("kat-aset-nama");
    var nama = kolomNama.value.trim();
    var tidak = centangTidakKat.checked;
    var umur = Number(kolomUmurKat.value);

    if (!nama) { tampilkanGalatKategoriAset("Nama wajib diisi.", kolomNama); return; }
    if (daftar.some(function (k) { return k.id !== (lama ? lama.id : "") && teksAman(k.nama).toLowerCase() === nama.toLowerCase(); })) {
        tampilkanGalatKategoriAset("Nama kategori sudah dipakai.", kolomNama);
        return;
    }
    if (!pilihAkunAsetKat.value) { tampilkanGalatKategoriAset("Akun Aset wajib dipilih.", pilihAkunAsetKat); return; }
    if (!tidak) {
        if (!pilihAkumulasiKat.value) { tampilkanGalatKategoriAset("Akun Akumulasi Penyusutan wajib dipilih.", pilihAkumulasiKat); return; }
        if (!pilihBebanKat.value) { tampilkanGalatKategoriAset("Akun Beban Penyusutan wajib dipilih.", pilihBebanKat); return; }
        if (!Number.isInteger(umur) || umur < 1) { tampilkanGalatKategoriAset("Umur Aset wajib diisi, minimal 1 tahun.", kolomUmurKat); return; }
    }
    var data = {
        id: lama ? lama.id : buatId("kas"), nama: nama, tidakDisusutkan: tidak, akunAsetId: pilihAkunAsetKat.value,
        akunAkumulasiId: tidak ? "" : pilihAkumulasiKat.value, akunBebanId: tidak ? "" : pilihBebanKat.value, umurTahun: tidak ? 0 : umur
    };
    var daftarBaru = lama ? daftar.map(function (k) { return k.id === lama.id ? data : k; }) : daftar.concat([data]);
    if (!modulKategoriAset.simpan(daftarBaru)) { return; }
    modulKategoriAset.selesaiSimpan(sedangMengubah, data, lama);
});

saatTabDibuka["kategori-aset"] = function () { modulKategoriAset.gambarTabel(); };

function bukaKategoriAsetBaru() { modulKategoriAset.bukaDariMenu(); }
