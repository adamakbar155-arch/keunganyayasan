// ==================== Aset Tetap ====================
// Data aset untuk menghitung penyusutan (PRD 6.6). Aset milik yayasan, jadi tanpa Divisi dan Program. Formulir ini TIDAK membuat
// jurnal: pembelian dicatat sekali lewat Pembayaran atau Jurnal Umum ke akun aset, supaya tidak dobel. Cek kecocokan di atas
// daftar membandingkan daftar aset dengan saldo akun asetnya.
// Satu data (kunci daftarAsetTetap): { id, kode, nama(=nama aset), tanggalBeli, tanggalPakai, kategoriId, nilai, umurBulan, nilaiSisa,
//   tidakDisusutkan, sudahDisusutkan, lokasi, catatan }
// Alat bersama: fitur/aset-tetap/hitung.js. HTML: fitur/aset-tetap/tampilan.js. Gaya: fitur/aset-tetap/aset-tetap.css.

var pilihKategoriAsetForm = document.getElementById("aset-kategori");
var kolomNilaiAset = document.getElementById("aset-nilai");
var kolomNilaiSisaAset = document.getElementById("aset-nilai-sisa");
var kolomSudahAset = document.getElementById("aset-sudah");
var kolomUmurAset = document.getElementById("aset-umur");
var centangTidakSusut = document.getElementById("aset-tidak-disusutkan");
var TANDA_KUNCI_ASET = ["aset-nilai", "aset-nilai-sisa", "aset-umur", "aset-kategori", "aset-tanggal-pakai", "aset-tidak-disusutkan", "aset-sudah"];

function kodeAsetBerikut(daftar) {
    var terbesar = daftar.reduce(function (n, a) {
        var cocok = /^AT-(\d+)$/.exec(teksAman(a.kode));
        return cocok ? Math.max(n, Number(cocok[1])) : n;
    }, 0);
    return "AT-" + String(terbesar + 1).padStart(5, "0");
}

var modulAsetTetap = buatModulDaftar({
    id: "aset-tetap",
    judul: "Aset Tetap",
    kunci: "daftarAsetTetap",
    urutAwal: { kolom: "kode", arah: -1 },
    labelData: { kode: "Kode Aset", nama: "Nama", tanggalBeli: "Tanggal Beli", tanggalPakai: "Tanggal Pakai", nilai: "Nilai Aset (Rp)", umurBulan: "Umur (bulan)", nilaiSisa: "Nilai Sisa (Rp)", sudahDisusutkan: "Sudah Disusutkan (Rp)", lokasi: "Lokasi", catatan: "Catatan" },
    formatData: {
        tanggalBeli: function (t) { return formatTanggal(t); }, tanggalPakai: function (t) { return formatTanggal(t); },
        nilai: teksRupiahAwal, nilaiSisa: teksRupiahAwal, sudahDisusutkan: teksRupiahAwal
    },
    kolom: [
        { kunci: "kode", judul: "Kode" },
        { kunci: "nama", judul: "Nama" },
        { kunci: "kategori", judul: "Kategori", tampil: function (a) { return namaKategoriAset(a.kategoriId); } },
        { kunci: "lokasi", judul: "Lokasi" },
        { kunci: "nilai", judul: "Nilai Aset", rata: "kanan", tampil: function (a) { return formatAngka(a.nilai || 0); }, urut: function (a) { return String(a.nilai || 0).padStart(18, "0"); } },
        { kunci: "susut", judul: "Sudah Disusutkan", rata: "kanan", tampil: function (a) { return formatAngka(penyusutanSampai(a)); } },
        { kunci: "buku", judul: "Nilai Buku", rata: "kanan", tampil: function (a) { return formatAngka(lepasDariAset(a.id) ? 0 : (Number(a.nilai) || 0) - penyusutanSampai(a)); } },
        { kunci: "status", judul: "Status", tampil: statusAset }
    ],
    filter: [
        { judul: "Kategori", ambil: function (a) { return namaKategoriAset(a.kategoriId); } },
        { judul: "Status", ambil: statusAset }
    ],
    pesanKosong: "Belum ada aset tetap. Klik tombol + untuk menambah.",
    alasanTolakHapus: function (a) {
        if (lepasDariAset(a.id)) { return 'Aset "' + teksAman(a.nama) + '" sudah dilepas. Hapus dulu data Lepas Aset-nya.'; }
        return asetSudahDisusutkanProses(a.id) ? 'Aset "' + teksAman(a.nama) + '" sudah masuk Proses Penyusutan, jadi tidak bisa dihapus.' : "";
    },
    isiForm: function (data) {
        document.getElementById("aset-nama").value = data ? teksAman(data.nama) : "";
        // Kode dibuat aplikasi (seperti ID Donatur); tanggal Data Baru diisi sendiri (PRD 5.3a)
        document.getElementById("aset-kode").value = data ? teksAman(data.kode) : kodeAsetBerikut(modulAsetTetap.ambil());
        document.getElementById("aset-tanggal-beli").value = data ? teksAman(data.tanggalBeli) : "";
        document.getElementById("aset-tanggal-pakai").value = data ? teksAman(data.tanggalPakai) : "";
        isiPilihanKategoriAset(data ? teksAman(data.kategoriId) : "");
        kolomNilaiAset.value = data ? teksAngkaIsian(data.nilai) : "";
        kolomNilaiSisaAset.value = data && data.nilaiSisa ? teksAngkaIsian(data.nilaiSisa) : "";
        kolomSudahAset.value = data && data.sudahDisusutkan ? teksAngkaIsian(data.sudahDisusutkan) : "";
        kolomUmurAset.value = data && Number(data.umurBulan) ? String(Math.round(Number(data.umurBulan) / 12)) : "";
        centangTidakSusut.checked = !!data && data.tidakDisusutkan === true;
        document.getElementById("aset-lokasi").value = data ? teksAman(data.lokasi) : "";
        document.getElementById("aset-catatan").value = data ? teksAman(data.catatan) : "";
        document.getElementById("aset-pesan-galat").hidden = true;
        // Aset yang sudah disusutkan: angka dasarnya dikunci, supaya riwayat penyusutan tidak berubah (PRD 6.6)
        var terkunci = !!data && (asetSudahDisusutkanProses(data.id) || !!lepasDariAset(data.id));
        TANDA_KUNCI_ASET.forEach(function (id) { document.getElementById(id).disabled = terkunci; });
        perbaruiRingkasanAset();
    }
});

function isiPilihanKategoriAset(terpilih) {
    isiPilihan(pilihKategoriAsetForm, bacaKategoriAset(), { kosong: "Pilih Kategori...", kosongKalauTakAda: "Belum ada kategori", terpilih: terpilih });
}

// Ringkasan di bawah formulir mengikuti isian
function dataAsetDariForm() {
    var tidak = centangTidakSusut.checked;
    return {
        id: modulAsetTetap.idDiubah, nilai: angkaDariTeks(kolomNilaiAset.value), nilaiSisa: angkaDariTeks(kolomNilaiSisaAset.value),
        sudahDisusutkan: angkaDariTeks(kolomSudahAset.value), umurBulan: tidak ? 0 : (Number(kolomUmurAset.value) || 0) * 12, tidakDisusutkan: tidak
    };
}
function perbaruiRingkasanAset() {
    var a = dataAsetDariForm();
    document.querySelector("#isi-aset-tetap .baris-umur-aset").hidden = a.tidakDisusutkan;
    document.getElementById("aset-per-bulan").textContent = formatRupiah(penyusutanPerBulan(a));
    document.getElementById("aset-total-nilai").textContent = formatRupiah(a.nilai);
    document.getElementById("aset-nilai-buku").textContent = formatRupiah(a.nilai - penyusutanSampai(a));
}

[kolomNilaiAset, kolomNilaiSisaAset, kolomSudahAset].forEach(function (kolom) {
    pasangKolomRupiah(kolom);   // titik ribuan langsung saat mengetik
    kolom.addEventListener("input", perbaruiRingkasanAset);
});
kolomUmurAset.addEventListener("input", perbaruiRingkasanAset);
centangTidakSusut.addEventListener("change", perbaruiRingkasanAset);

// Memilih kategori mengisi umur dan tanda Tidak disusutkan dari kategorinya
pilihKategoriAsetForm.addEventListener("change", function () {
    var k = kategoriAsetDari(pilihKategoriAsetForm.value);
    if (!k) { return; }
    centangTidakSusut.checked = k.tidakDisusutkan === true;
    kolomUmurAset.value = k.umurTahun ? String(k.umurTahun) : "";
    perbaruiRingkasanAset();
});

function tampilkanGalatAset(pesan, kolomFokus) {
    var kotak = document.getElementById("aset-pesan-galat");
    kotak.textContent = pesan;   // textContent: aman dari kode HTML
    kotak.hidden = false;
    if (kolomFokus) { kolomFokus.focus(); }
}

document.getElementById("form-aset-tetap").addEventListener("submit", function (e) {
    e.preventDefault();
    document.getElementById("aset-pesan-galat").hidden = true;
    var daftar = modulAsetTetap.ambil();
    var sedangMengubah = (modulAsetTetap.idDiubah !== null);
    var lama = sedangMengubah ? daftar.find(function (a) { return a.id === modulAsetTetap.idDiubah; }) : null;
    var kolomNama = document.getElementById("aset-nama");
    var kolomBeli = document.getElementById("aset-tanggal-beli");
    var kolomPakai = document.getElementById("aset-tanggal-pakai");
    var nama = kolomNama.value.trim();
    var f = dataAsetDariForm();

    if (!nama) { tampilkanGalatAset("Nama wajib diisi.", kolomNama); return; }
    if (!kolomBeli.value) { tampilkanGalatAset("Tanggal Beli wajib diisi.", kolomBeli); return; }
    if (!kolomPakai.value) { tampilkanGalatAset("Tanggal Pakai wajib diisi.", kolomPakai); return; }
    if (kolomPakai.value < kolomBeli.value) { tampilkanGalatAset("Tanggal Pakai tidak boleh sebelum Tanggal Beli.", kolomPakai); return; }
    if (!kategoriAsetDari(pilihKategoriAsetForm.value)) { tampilkanGalatAset("Kategori Aset wajib dipilih. Buat dulu di Kategori Aset kalau belum ada.", pilihKategoriAsetForm); return; }
    if (!(f.nilai > 0)) { tampilkanGalatAset("Nilai Aset wajib diisi dan lebih dari 0.", kolomNilaiAset); return; }
    if (!f.tidakDisusutkan && !(Number(kolomUmurAset.value) > 0)) { tampilkanGalatAset("Umur Aset wajib diisi.", kolomUmurAset); return; }
    if (f.nilaiSisa >= f.nilai) { tampilkanGalatAset("Nilai Sisa harus lebih kecil dari Nilai Aset.", kolomNilaiSisaAset); return; }
    if (f.sudahDisusutkan > f.nilai - f.nilaiSisa) { tampilkanGalatAset("Sudah disusutkan tidak boleh melebihi Nilai Aset dikurangi Nilai Sisa.", kolomSudahAset); return; }

    var data = Object.assign({}, lama || {}, f, {
        id: lama ? lama.id : buatId("aset"),
        kode: lama ? teksAman(lama.kode) : kodeAsetBerikut(daftar),
        nama: nama, tanggalBeli: kolomBeli.value, tanggalPakai: kolomPakai.value, kategoriId: pilihKategoriAsetForm.value,
        lokasi: document.getElementById("aset-lokasi").value.trim(), catatan: document.getElementById("aset-catatan").value.trim()
    });
    // Pengaman kedua sesudah kolom dikunci di isiForm: angka dasar aset yang sudah disusutkan tetap memakai nilai lama
    if (lama && (asetSudahDisusutkanProses(lama.id) || lepasDariAset(lama.id))) {
        ["nilai", "nilaiSisa", "umurBulan", "kategoriId", "tanggalPakai", "tidakDisusutkan", "sudahDisusutkan"].forEach(function (k) { data[k] = lama[k]; });
    }
    var daftarBaru = lama ? daftar.map(function (a) { return a.id === lama.id ? data : a; }) : daftar.concat([data]);
    if (!modulAsetTetap.simpan(daftarBaru)) { return; }
    modulAsetTetap.selesaiSimpan(sedangMengubah, data, lama);
});

// ----- Cek kecocokan dengan Neraca (PRD 6.6), di atas daftar -----
var kotakCocokAset = document.createElement("p");
kotakCocokAset.className = "aset-cocok";
kotakCocokAset.setAttribute("role", "status");
var toolbarDaftarAset = document.querySelector("#isi-aset-tetap .toolbar-daftar");
toolbarDaftarAset.parentNode.insertBefore(kotakCocokAset, toolbarDaftarAset);

function gambarCekKecocokanAset() {
    var h = cekKecocokanAset();
    kotakCocokAset.hidden = !h;
    if (!h) { return; }
    var cocok = Math.abs(h.daftar - h.saldo) < 0.005;
    kotakCocokAset.classList.toggle("aset-beda", !cocok);
    kotakCocokAset.textContent = "Cek kecocokan dengan Neraca: Daftar aset " + formatRupiah(h.daftar) + (cocok ? " = " : " berbeda dengan ") + "saldo akun aset " + formatRupiah(h.saldo)
        + (cocok ? ". Cocok." : ". Periksa aset yang belum didaftarkan, atau pembelian yang belum dicatat ke akun aset.");
}
var gambarTabelAsetDasar = modulAsetTetap.gambarTabel;
modulAsetTetap.gambarTabel = function () {
    gambarTabelAsetDasar();
    gambarCekKecocokanAset();
};

// Kategori dan penyusutan bisa berubah di halaman lain: muat ulang tiap tab dibuka
saatTabDibuka["aset-tetap"] = function () {
    modulAsetTetap.gambarTabel();
    isiPilihanKategoriAset(pilihKategoriAsetForm.value);
};

function bukaAsetTetapBaru() { modulAsetTetap.bukaDariMenu(); }

// Membuka satu aset di formulirnya (dipakai Laporan Aset Tetap)
function bukaAsetTetap(aset) {
    bukaTab("aset-tetap");
    modulAsetTetap.bukaUbah(aset);
}

// Kotak Proses Penyusutan dan Lepas Aset dimuat sesudah file ini, jadi fungsinya baru dipanggil saat kotak diklik
pasangPopupMenu(document.getElementById("panel-aset"), "tombol-aset", "tutup-aset", {
    "Aset Tetap": function () { bukaAsetTetapBaru(); },
    "Kategori Aset": function () { bukaKategoriAsetBaru(); },
    "Proses Penyusutan": function () { bukaPenyusutanBaru(); },
    "Lepas Aset": function () { bukaLepasAsetBaru(); }
});
