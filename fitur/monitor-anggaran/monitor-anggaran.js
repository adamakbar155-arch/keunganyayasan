// ==================== Monitor Anggaran ====================
// Membandingkan rencana dengan kenyataan per akun untuk satu bulan (PRD 6.5, dari foto Accurate). Hanya dilihat: tidak ada yang
// disimpan. Anggaran, Penggunaan, dan Sisa dihitung oleh fitur/anggaran/hitung.js, sama dengan angka Sisa di Transfer Anggaran.
// HTML: fitur/monitor-anggaran/tampilan.js. Gaya: fitur/monitor-anggaran/monitor-anggaran.css.

var pilihTipeMang = document.getElementById("mang-tipe");
var pilihBulanMang = document.getElementById("mang-bulan");
var pilihTahunMang = document.getElementById("mang-tahun");
var pilihAkunMang = document.getElementById("mang-akun");
var pilihKelompokMang = document.getElementById("mang-kelompok");

isiPilihanTipeAnggaran(pilihTipeMang);
isiPilihanBulanAnggaran(pilihBulanMang);
pilihBulanMang.value = String(Number(tanggalHariIni().slice(5, 7)));

// Pilihan Tahun: tahun yang punya data, ditambah tahun ini
function isiPilihanTahunMang() {
    var terpilih = pilihTahunMang.value || tanggalHariIni().slice(0, 4);
    var ada = {};
    ada[tanggalHariIni().slice(0, 4)] = true;
    ada[terpilih] = true;
    bacaDaftarTersimpan("daftarAnggaran").concat(bacaDaftarTersimpan("daftarTransferAnggaran")).forEach(function (d) {
        if (d && Number.isInteger(Number(d.tahun)) && Number(d.tahun) > 0) { ada[String(d.tahun)] = true; }
    });
    var tahun = Object.keys(ada).sort().reverse();
    isiPilihan(pilihTahunMang, tahun, { nilai: function (t) { return t; }, teks: function (t) { return t; }, terpilih: terpilih });
}

function isiPilihanAkunMang() {
    isiPilihan(pilihAkunMang, akunBolehDianggarkan().sort(urutKodeAkun), {
        kosong: "Cari/Pilih Akun Perkiraan...", terpilih: pilihAkunMang.value,
        teks: function (a) { return teksAman(a.kode) + " " + teksAman(a.nama); }
    });
}

// Tipe Umum tidak memakai Divisi/Program: kolomnya tetap tampil seperti foto, tetapi tidak bisa diisi
function isiPilihanKelompokMang(terpilih) {
    var tipe = pilihTipeMang.value;
    if (tipe === "umum") { isiPilihan(pilihKelompokMang, [], { kosong: "Cari/Pilih..." }); }
    isiPilihanKelompokAnggaran(pilihKelompokMang, tipe, terpilih, "Cari/Pilih...");
    pilihKelompokMang.disabled = tipe === "umum";
}

function gambarMonitorAnggaran() {
    var periode = {
        tipe: pilihTipeMang.value, bulan: Number(pilihBulanMang.value), tahun: Number(pilihTahunMang.value),
        kelompokId: pilihTipeMang.value === "umum" ? "" : pilihKelompokMang.value
    };
    var perId = petaAkunLaporan(bacaDaftarAkun());
    var dipilih = pilihAkunMang.value;
    var akunIni = Object.keys(akunPeriodeAnggaran(periode))
        .filter(function (id) { return perId[id] && (!dipilih || id === dipilih); })
        .map(function (id) { return perId[id]; })
        .sort(urutKodeAkun);

    var badan = document.getElementById("mang-rincian");
    badan.textContent = "";
    if (akunIni.length === 0) {
        var kosong = badan.insertRow().insertCell();
        kosong.colSpan = 5;
        kosong.className = "mang-kosong";
        kosong.textContent = "Belum ada data";
        return;
    }
    akunIni.forEach(function (a) {
        var pos = Object.assign({}, periode, { akunId: a.id });
        var rencana = rencanaPosAnggaran(pos);
        var penggunaan = penggunaanPosAnggaran(pos);
        var sisa = rencana - penggunaan;
        var tr = badan.insertRow();
        function sel(teks, kelas) {
            var td = tr.insertCell();
            td.className = kelas || "";
            td.textContent = teks;   // textContent: aman dari kode HTML
        }
        sel(teksAman(a.nama));
        sel(teksAman(a.kode));
        sel(formatAngka(rencana), "sel-kanan");
        sel(formatAngka(penggunaan), "sel-kanan");
        sel(formatAngka(sisa), sisa < 0 ? "sel-kanan angka-negatif" : "sel-kanan");
    });
}

[pilihBulanMang, pilihTahunMang, pilihAkunMang, pilihKelompokMang].forEach(function (s) {
    s.addEventListener("change", gambarMonitorAnggaran);
});
pilihTipeMang.addEventListener("change", function () {
    isiPilihanKelompokMang("");
    gambarMonitorAnggaran();
});

// Akun, Divisi, Program, anggaran, dan jurnal bisa berubah di halaman lain: muat ulang tiap tab dibuka dan saat Muat Ulang diklik
function segarkanMonitorAnggaran() {
    isiPilihanTahunMang();
    isiPilihanAkunMang();
    isiPilihanKelompokMang(pilihKelompokMang.value);
    gambarMonitorAnggaran();
}
document.getElementById("mang-muat").addEventListener("click", segarkanMonitorAnggaran);
saatTabDibuka["monitor-anggaran"] = segarkanMonitorAnggaran;

// Dipanggil dari popup Buku Besar, kotak Monitor Anggaran
function bukaMonitorAnggaran() {
    bukaTab("monitor-anggaran");
}
