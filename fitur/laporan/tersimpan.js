// ==================== Laporan Tersimpan (Memorize) ====================
// PRD 7 (draf 2026-11-06, menunggu koreksi pengguna; tugas I.1f). Laporan + parameternya disimpan dengan nama sendiri.
// Satu data (kunci daftarLaporanTersimpan): { id, nama, laporanId, param, modifikasi, dibuatPada }
// modifikasi = isi jendela Modifikasi saat disimpan (null = tampilan bawaan); isinya diperiksa lagi saat dipakai (modifikasi.js).
// Tombol Ekspor mengunduh semuanya sebagai .json, tombol Impor membacanya lagi. Berkas impor dianggap tidak bisa
// dipercaya: dibatasi jenis dan ukurannya, dan setiap isinya diperiksa (laporanTersimpanAman) sebelum dipakai.

var KUNCI_LAPORAN_TERSIMPAN = "daftarLaporanTersimpan";
jenisKunciCadangan[KUNCI_LAPORAN_TERSIMPAN] = "daftar";   // ikut Cadangan Data (umum/komponen-daftar.js)
var UKURAN_IMPOR_LAPORAN = 1024 * 1024;   // 1 MB

var dialogSimpanLaporan = document.getElementById("dialog-simpan-laporan");
var kolomNamaSimpanLaporan = document.getElementById("simpan-laporan-nama");
var galatSimpanLaporan = document.getElementById("galat-simpan-laporan");

function cariLaporanDaftar(id) {
    var ketemu = null;
    DAFTAR_LAPORAN.forEach(function (k) {
        k.kelompok.forEach(function (kel) {
            kel.laporan.forEach(function (lap) { if (lap.id === id) { ketemu = { lap: lap, kategori: k }; } });
        });
    });
    return ketemu;
}

function daftarTeksAman(n) {
    return Array.isArray(n) ? n.filter(function (x, i, s) { return typeof x === "string" && x !== "" && s.indexOf(x) === i; }) : [];
}

// Satu data dari penyimpanan atau berkas impor: bentuk bersih, atau null kalau rusak
function laporanTersimpanAman(d) {
    var p = d && d.param;
    var tanggalBenar = /^\d{4}-\d{2}-\d{2}$/;
    if (!p || typeof p !== "object" || typeof d.nama !== "string" || d.nama.trim() === "" || !cariLaporanDaftar(d.laporanId)) { return null; }
    if (!tanggalBenar.test(p.dari) || !tanggalBenar.test(p.sampai) || p.dari > p.sampai) { return null; }
    return {
        id: typeof d.id === "string" && d.id ? d.id : buatId("lt"),
        nama: d.nama.trim().slice(0, 80), laporanId: d.laporanId, dibuatPada: teksAman(d.dibuatPada),
        modifikasi: d.modifikasi && typeof d.modifikasi === "object" ? d.modifikasi : null,
        param: { dari: p.dari, sampai: p.sampai, divisi: daftarTeksAman(p.divisi), program: daftarTeksAman(p.program), akun: daftarTeksAman(p.akun),
                 hanyaTotal: p.hanyaTotal === true, akunInduk: p.akunInduk !== false, akunAnak: p.akunAnak !== false }
    };
}

function bacaLaporanTersimpan() {
    return bacaDaftarTersimpan(KUNCI_LAPORAN_TERSIMPAN).map(laporanTersimpanAman).filter(Boolean);
}

function simpanDaftarLaporanTersimpan(daftar) {
    try {
        localStorage.setItem(KUNCI_LAPORAN_TERSIMPAN, JSON.stringify(daftar));
        return true;
    } catch (galat) {
        tampilkanNotifikasi("Gagal menyimpan. Penyimpanan browser penuh atau diblokir.", "galat");
        return false;
    }
}

// Kelompok untuk menu Laporan: { judul: nama kategori, laporan: [kartu] }. Kartu memakai data laporan aslinya.
function kelompokLaporanTersimpan() {
    var kelompok = [];
    bacaLaporanTersimpan().sort(function (a, b) { return a.nama.localeCompare(b.nama, "id"); }).forEach(function (d) {
        var asal = cariLaporanDaftar(d.laporanId);
        var kel = kelompok.find(function (k) { return k.judul === asal.kategori.nama; });
        if (!kel) { kel = { judul: asal.kategori.nama, laporan: [] }; kelompok.push(kel); }
        kel.laporan.push({ nama: d.nama, label: "", jenis: asal.lap.jenis, tersimpan: d, asal: asal.lap,
                           keterangan: asal.lap.nama + ", " + teksPeriodeLaporan(asal.lap, d.param) });
    });
    return kelompok;
}

function hapusLaporanTersimpan(d) {
    tanyaKonfirmasi({ pesan: "Apakah Anda yakin ingin menghapus laporan tersimpan ini?", nama: d.nama, labelYa: "Ya, Hapus" }, function () {
        if (simpanDaftarLaporanTersimpan(bacaLaporanTersimpan().filter(function (x) { return x.id !== d.id; }))) {
            catatLog({ tindakan: "Hapus", tipe: "Laporan Tersimpan", referensi: d.nama });
            tampilkanNotifikasi("Laporan tersimpan telah dihapus");
            gambarMenuLaporan();
        }
    });
}

// ----- Simpan dari kertas hasil laporan -----
document.getElementById("lap-simpan").addEventListener("click", function () {
    if (!kertasLaporanAktif) { return; }
    kolomNamaSimpanLaporan.value = kertasLaporanAktif.lap.nama;
    galatSimpanLaporan.hidden = true;
    dialogSimpanLaporan.showModal();
    kolomNamaSimpanLaporan.select();
});

function simpanLaporanBaru() {
    var nama = kolomNamaSimpanLaporan.value.trim();
    var daftar = bacaLaporanTersimpan();
    var pesan = !nama ? "Nama wajib diisi."
        : (daftar.some(function (d) { return d.nama.toLowerCase() === nama.toLowerCase(); }) ? "Nama ini sudah dipakai laporan tersimpan lain." : "");
    if (pesan) {
        galatSimpanLaporan.textContent = pesan;
        galatSimpanLaporan.hidden = false;
        kolomNamaSimpanLaporan.focus();
        return;
    }
    daftar.push({ id: buatId("lt"), nama: nama, laporanId: kertasLaporanAktif.lap.id, param: kertasLaporanAktif.param,
                  modifikasi: kertasLaporanAktif.modifikasi, dibuatPada: waktuSekarang() });
    if (simpanDaftarLaporanTersimpan(daftar)) {
        catatLog({ tindakan: "Buat", tipe: "Laporan Tersimpan", referensi: nama });
        dialogSimpanLaporan.close();
        tampilkanNotifikasi("Laporan telah tersimpan di Laporan Tersimpan");
    }
}
document.getElementById("oke-simpan-laporan").addEventListener("click", simpanLaporanBaru);
kolomNamaSimpanLaporan.addEventListener("keydown", function (k) {
    if (k.key === "Enter") { k.preventDefault(); simpanLaporanBaru(); }
});
document.getElementById("tutup-simpan-laporan").addEventListener("click", function () { dialogSimpanLaporan.close(); });
dialogSimpanLaporan.addEventListener("click", function (k) {
    if (k.target === dialogSimpanLaporan) { dialogSimpanLaporan.close(); }
});

// ----- Ekspor dan Impor -----
document.getElementById("lap-ekspor").addEventListener("click", function () {
    var daftar = bacaLaporanTersimpan();
    if (!daftar.length) { tampilkanNotifikasi("Belum ada laporan tersimpan untuk diekspor.", "peringatan"); return; }
    unduhTeks("laporan-tersimpan.json", JSON.stringify(daftar, null, 2), "application/json");
    tampilkanNotifikasi("Laporan tersimpan telah diekspor");
});
var kolomImporLaporan = document.getElementById("lap-impor-berkas");
document.getElementById("lap-impor").addEventListener("click", function () { kolomImporLaporan.click(); });
kolomImporLaporan.addEventListener("change", function () {
    var berkas = kolomImporLaporan.files[0];
    kolomImporLaporan.value = "";   // berkas yang sama bisa dipilih lagi
    if (!berkas) { return; }
    if (!/\.json$/i.test(berkas.name)) { tampilkanNotifikasi("Berkas harus berjenis .json.", "peringatan"); return; }
    if (berkas.size > UKURAN_IMPOR_LAPORAN) { tampilkanNotifikasi("Berkas terlalu besar. Paling besar 1 MB.", "peringatan"); return; }
    var pembaca = new FileReader();
    pembaca.onerror = function () { tampilkanNotifikasi("Berkas tidak bisa dibaca.", "galat"); };
    pembaca.onload = function () { imporLaporanTersimpan(pembaca.result); };
    pembaca.readAsText(berkas);
});

// Isi berkas yang rusak dilewati; nama yang sudah ada tidak ditimpa
function imporLaporanTersimpan(teks) {
    var isi;
    try { isi = JSON.parse(teks); } catch (galat) { isi = null; }
    if (!Array.isArray(isi)) { tampilkanNotifikasi("Isi berkas bukan daftar laporan tersimpan.", "galat"); return; }
    var daftar = bacaLaporanTersimpan();
    var masuk = 0;
    isi.forEach(function (d) {
        var aman = laporanTersimpanAman(d);
        if (!aman || daftar.some(function (x) { return x.nama.toLowerCase() === aman.nama.toLowerCase(); })) { return; }
        aman.id = buatId("lt");
        daftar.push(aman);
        masuk++;
    });
    if (masuk && simpanDaftarLaporanTersimpan(daftar)) { catatLog({ tindakan: "Buat", tipe: "Laporan Tersimpan", referensi: "Impor " + masuk + " laporan" }); }
    tampilkanNotifikasi(masuk + " dari " + isi.length + " laporan diimpor.", masuk ? undefined : "peringatan");
    gambarMenuLaporan();
}
