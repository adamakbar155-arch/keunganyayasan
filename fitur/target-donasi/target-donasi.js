// ==================== Target Donasi (Donasi) ====================
// Angka tujuan pengumpulan donasi untuk satu Program dalam satu rentang tanggal (PRD 6.1, disetujui 2026-10-29).
// Hanya alat pantau: tidak membuat jurnal. Bagian 1: formulir, simpan/ubah/hapus, daftar dasar.
// Bagian 2: Terkumpul, Sisa, Capaian, filter Tampilkan/Program/Status (kunci hapus Program ada di Master Data).
// HTML-nya: fitur/target-donasi/tampilan.js.
// Satu data tersimpan (kunci daftarTargetDonasi):
//   { id, nama, programId, mulai ("YYYY-MM-DD"), selesai ("YYYY-MM-DD"), nilai, catatan }
// Semua nama (var dan function) di sini tetap bisa dipakai skrip lain, karena skrip biasa berbagi satu ruang nama.

var kolomNamaTd = document.getElementById("td-nama");
var pilihProgramTd = document.getElementById("td-program");
var kolomMulaiTd = document.getElementById("td-mulai");
var kolomSelesaiTd = document.getElementById("td-selesai");
var kolomNilaiTd = document.getElementById("td-nilai");
var kolomCatatanTd = document.getElementById("td-catatan");
var galatTd = {
    nama: document.getElementById("galat-td-nama"),
    program: document.getElementById("galat-td-program"),
    periode: document.getElementById("galat-td-periode"),
    nilai: document.getElementById("galat-td-nilai")
};
pasangKolomRupiah(kolomNilaiTd);   // titik ribuan langsung saat mengetik (alat bersama)

// Status menurut tanggal hari ini (PRD 6.1): Belum Mulai, Berjalan, atau Selesai.
// Tanggal disimpan "YYYY-MM-DD", jadi bisa dibandingkan sebagai teks.
function statusTargetTd(target) {
    var hariIni = tanggalHariIni();
    if (teksAman(target.mulai) > hariIni) { return "Belum Mulai"; }
    if (teksAman(target.selesai) < hariIni) { return "Selesai"; }
    return "Berjalan";
}

// Periode di daftar: "1 Jan 2026 - 31 Des 2026"
function periodeTargetTd(target) {
    return formatTanggal(teksAman(target.mulai)) + " - " + formatTanggal(teksAman(target.selesai));
}

// ----- Terkumpul, Sisa, Capaian (PRD 6.1, bagian 2) -----
// Terkumpul = jumlah NILAI BARIS rincian Pencatatan Donasi yang Program-nya sama dengan Program target dan tanggal
// donasinya di antara Tanggal Mulai dan Tanggal Selesai (keduanya ikut). Per baris, karena satu donasi bisa berisi
// beberapa baris dengan Program berbeda. Data donasi dibaca langsung dari penyimpanan (kunci daftarDonasi).
// Baris-baris donasi { programId, tanggal, nilai } dikumpulkan ulang hanya kalau isi daftarDonasi berubah, supaya
// daftar yang diurutkan (banyak panggilan) tidak membaca semua donasi berulang-ulang (cara yang sama dengan Donatur).
var barisDonasiTd = { mentah: undefined, baris: [] };
function barisDonasiBerProgramTd() {
    var mentah = null;
    try { mentah = localStorage.getItem("daftarDonasi"); } catch (galat) { mentah = null; }   // penyimpanan diblokir
    if (mentah === barisDonasiTd.mentah) { return barisDonasiTd.baris; }
    var baris = [];
    // bacaDaftarTersimpan: isi rusak dianggap daftar kosong; butir dan baris rusak dilewati
    bacaDaftarTersimpan("daftarDonasi").forEach(function (donasi) {
        if (!donasi || !Array.isArray(donasi.rincian)) { return; }
        var tanggal = teksAman(donasi.tanggal);
        donasi.rincian.forEach(function (b) {
            if (b && typeof b.programId === "string" && b.programId !== "") {
                baris.push({ programId: b.programId, tanggal: tanggal, nilai: Number(b.nilai) || 0 });
            }
        });
    });
    barisDonasiTd = { mentah: mentah, baris: baris };
    return baris;
}

function terkumpulTargetTd(target) {
    var mulai = teksAman(target.mulai), selesai = teksAman(target.selesai);
    return barisDonasiBerProgramTd().reduce(function (jumlah, b) {
        var cocok = b.programId === target.programId && b.tanggal >= mulai && b.tanggal <= selesai;
        return cocok ? jumlah + b.nilai : jumlah;
    }, 0);
}

// Sisa tidak pernah minus: kalau terkumpul melebihi target, Sisa 0
function sisaTargetTd(target) {
    return Math.max(0, (Number(target.nilai) || 0) - terkumpulTargetTd(target));
}

// Capaian berhenti di 100% (keputusan pengguna 2026-10-29). Dibulatkan ke bawah, supaya 100% hanya tampil kalau
// target benar-benar tercapai (99,6% tetap 99%).
function persenCapaianTd(target) {
    var nilai = Number(target.nilai) || 0;
    if (nilai <= 0) { return 0; }
    return Math.min(100, Math.floor(terkumpulTargetTd(target) / nilai * 100));
}

function tercapaiTd(target) {
    var nilai = Number(target.nilai) || 0;
    return nilai > 0 && terkumpulTargetTd(target) >= nilai;
}

// "Yang masih berjalan" di pilihan Tampilkan: Program-nya belum Selesai dan periodenya belum lewat (PRD 6.1).
// Program yang sudah dihapus dianggap tidak berjalan.
function masihBerjalanTd(target) {
    var program = bacaProgram().find(function (p) { return p.id === target.programId; });
    return !!program && program.status !== "selesai" && statusTargetTd(target) !== "Selesai";
}

// Isi sel Capaian: bar dan persen (teks persennya tetap dari kolom tampil, untuk cari dan CSV)
function gambarCapaianTd(sel, target) {
    var persen = persenCapaianTd(target);
    sel.textContent = "";
    var bungkus = document.createElement("div");
    bungkus.className = "capaian-td" + (tercapaiTd(target) ? " tercapai" : "");
    var bar = document.createElement("div");
    bar.className = "capaian-td-bar";
    var isiBar = document.createElement("span");
    isiBar.style.width = persen + "%";
    bar.appendChild(isiBar);
    var teks = document.createElement("span");
    teks.className = "capaian-td-persen";
    teks.textContent = persen + "%" + (tercapaiTd(target) ? " ✓" : "");
    bungkus.appendChild(bar);
    bungkus.appendChild(teks);
    sel.appendChild(bungkus);
}

// Isi sel Status: label kecil berwarna (Belum Mulai kuning, Berjalan biru, Selesai abu-abu)
var KELAS_STATUS_TD = { "Belum Mulai": "status-td-belum", "Berjalan": "status-td-berjalan", "Selesai": "status-td-selesai" };
function gambarStatusTd(sel, target) {
    var status = statusTargetTd(target);
    sel.textContent = "";
    var label = document.createElement("span");
    label.className = "status-td " + KELAS_STATUS_TD[status];
    label.textContent = status;
    sel.appendChild(label);
}

function sembunyikanGalatTd() {
    Object.keys(galatTd).forEach(function (nama) { galatTd[nama].hidden = true; });
}

// Pilihan Program: hanya yang Aktif, ditambah Program lama target ini (alat bersama di umum/komponen-transaksi.js)
function isiPilihanProgramTd(terpilih) {
    isiPilihan(pilihProgramTd, daftarProgramPilihan(terpilih), {
        kosong: "Pilih Program...", kosongKalauTakAda: "Belum ada Program yang berjalan", terpilih: terpilih
    });
}

var modulTargetDonasi = buatModulDaftar({
    id: "target-donasi",
    judul: "Target Donasi",
    kunci: "daftarTargetDonasi",
    labelData: { nama: "Nama Target", programId: "Program", mulai: "Tanggal Mulai", selesai: "Tanggal Selesai", nilai: "Nilai Target", catatan: "Catatan" },
    formatData: {
        programId: function (id) { return namaProgramDari(id); },
        mulai: function (t) { return formatTanggal(t); },
        selesai: function (t) { return formatTanggal(t); },
        nilai: function (n) { return formatRupiah(n); }
    },
    kolom: [
        { kunci: "nama", judul: "Nama Target" },
        { kunci: "program", judul: "Program", tampil: function (t) { return namaProgramDari(t.programId); } },
        { kunci: "periode", judul: "Periode", tampil: periodeTargetTd, urut: function (t) { return teksAman(t.mulai) + teksAman(t.selesai); },
          kelasSel: function () { return "sel-satu-baris-td"; } },   // periode tidak dipotong jadi dua baris
        { kunci: "status", judul: "Status", tampil: statusTargetTd, gambarSel: gambarStatusTd },
        // Pengurutan daftar membandingkan teks, jadi angka diberi nol di depan (seperti kolom Nilai di Pencatatan Donasi)
        { kunci: "nilai", judul: "Target", rata: "kanan", tampil: function (t) { return formatAngka(Number(t.nilai) || 0); },
          urut: function (t) { return String(Number(t.nilai) || 0).padStart(18, "0"); } },
        { kunci: "terkumpul", judul: "Terkumpul", rata: "kanan", tampil: function (t) { return formatAngka(terkumpulTargetTd(t)); },
          urut: function (t) { return String(terkumpulTargetTd(t)).padStart(18, "0"); } },
        { kunci: "sisa", judul: "Sisa", rata: "kanan", tampil: function (t) { return formatAngka(sisaTargetTd(t)); },
          urut: function (t) { return String(sisaTargetTd(t)).padStart(18, "0"); } },
        { kunci: "capaian", judul: "Capaian", tampil: function (t) { return persenCapaianTd(t) + "%"; },
          urut: function (t) { return String(persenCapaianTd(t)).padStart(3, "0"); }, gambarSel: gambarCapaianTd }
    ],
    filter: [
        // Tampilkan (permintaan pengguna 2026-10-29): awalnya hanya yang masih berjalan; Semua = tanpa penyaring
        { judul: "Tampilkan", pilihan: [{ nilai: "berjalan", teks: "Yang masih berjalan" }, { nilai: "", teks: "Semua" }],
          awal: "berjalan", cocok: function (t) { return masihBerjalanTd(t); } },
        { judul: "Program", ambil: function (t) { return namaProgramDari(t.programId); } },
        { judul: "Status", ambil: statusTargetTd }
    ],
    pesanKosong: "Belum ada target donasi. Klik tombol + untuk menambah.",
    isiForm: function (target) {
        kolomNamaTd.value = target ? teksAman(target.nama) : "";
        isiPilihanProgramTd(target ? target.programId : "");
        // Data Baru: tanggal mulai dan selesai diisi sendiri (PRD 5.3a)
        kolomMulaiTd.value = target ? teksAman(target.mulai) : "";
        kolomSelesaiTd.value = target ? teksAman(target.selesai) : "";
        kolomNilaiTd.value = target ? teksAngkaIsian(Number(target.nilai) || 0) : "";
        kolomCatatanTd.value = target ? teksAman(target.catatan) : "";
        sembunyikanGalatTd();
    }
    // Hapus: semua target boleh dihapus (tidak ada jurnal); popup konfirmasi dan Log dari buatModulDaftar
});

function tampilkanGalatTd(nama, pesan, kolomFokus) {
    galatTd[nama].textContent = pesan;
    galatTd[nama].hidden = false;
    if (kolomFokus) { kolomFokus.focus(); }
}
kolomNamaTd.addEventListener("input", function () { galatTd.nama.hidden = true; });
pilihProgramTd.addEventListener("change", function () { galatTd.program.hidden = true; });
kolomMulaiTd.addEventListener("change", function () { galatTd.periode.hidden = true; });
kolomSelesaiTd.addEventListener("change", function () { galatTd.periode.hidden = true; });
kolomNilaiTd.addEventListener("input", function () { galatTd.nilai.hidden = true; });

// ----- Simpan: Data Baru dan Ubah (PRD 6.1) -----
// Pemeriksaan satu per satu, berhenti di kesalahan pertama: Nama, Program (masih ada; Program Selesai hanya boleh
// kalau memang Program lama target ini), Periode (keduanya diisi, selesai tidak sebelum mulai), Nilai > 0.
document.getElementById("form-target-donasi").addEventListener("submit", function (kejadian) {
    kejadian.preventDefault();
    sembunyikanGalatTd();
    var daftar = modulTargetDonasi.ambil();
    var sedangMengubah = (modulTargetDonasi.idDiubah !== null);
    var lama = sedangMengubah ? daftar.find(function (t) { return t.id === modulTargetDonasi.idDiubah; }) : null;

    var nama = kolomNamaTd.value.trim();
    if (nama === "") {
        tampilkanGalatTd("nama", "Nama Target wajib diisi.", kolomNamaTd);
        return;
    }
    var programId = pilihProgramTd.value;
    var bolehDipilih = daftarProgramPilihan(lama ? lama.programId : "").some(function (p) { return p.id === programId; });
    if (!bolehDipilih) {
        tampilkanGalatTd("program", programId === "" ? "Program wajib dipilih." : "Program ini sudah tidak berjalan. Pilih Program lain.", pilihProgramTd);
        return;
    }
    var mulai = kolomMulaiTd.value, selesai = kolomSelesaiTd.value;
    if (mulai === "" || selesai === "") {
        tampilkanGalatTd("periode", "Tanggal mulai dan tanggal selesai wajib diisi.", mulai === "" ? kolomMulaiTd : kolomSelesaiTd);
        return;
    }
    if (selesai < mulai) {
        tampilkanGalatTd("periode", "Tanggal selesai tidak boleh sebelum tanggal mulai.", kolomSelesaiTd);
        return;
    }
    var nilai = angkaDariTeks(kolomNilaiTd.value);
    if (!(nilai > 0)) {
        tampilkanGalatTd("nilai", "Nilai Target wajib diisi dan lebih dari 0.", kolomNilaiTd);
        return;
    }

    var data = {
        id: lama ? lama.id : buatId("td"),
        nama: nama,
        programId: programId,
        mulai: mulai,
        selesai: selesai,
        nilai: nilai,
        catatan: kolomCatatanTd.value.trim()
    };
    var daftarBaru = lama
        ? daftar.map(function (t) { return t.id === lama.id ? data : t; })
        : daftar.concat([data]);
    if (!modulTargetDonasi.simpan(daftarBaru)) { return; }
    modulTargetDonasi.selesaiSimpan(sedangMengubah, data, lama);   // notifikasi, Log Aktivitas, formulir kosong / kembali ke daftar
    if (!sedangMengubah) { kolomNamaTd.focus(); }
});

// Setiap tab Target Donasi dibuka: daftar digambar ulang (nama Program dan Status bisa berubah), dan pilihan Program
// di formulir dimuat ulang (Program mungkin baru ditambah atau diselesaikan di Master Data)
saatTabDibuka["target-donasi"] = function () {
    var lama = modulTargetDonasi.idDiubah !== null
        ? modulTargetDonasi.ambil().find(function (t) { return t.id === modulTargetDonasi.idDiubah; }) : null;
    // Pilihan yang sedang terisi dipertahankan (daftarProgramPilihan ikut memuat Program itu walaupun sudah Selesai;
    // kalau ternyata tidak boleh lagi, pemeriksaan saat Simpan yang menolaknya)
    isiPilihanProgramTd(pilihProgramTd.value || (lama ? lama.programId : ""));
    modulTargetDonasi.gambarTabel();
};

// Dipanggil dari popup Donasi, kotak Target Donasi
function bukaTargetDonasiBaru() {
    modulTargetDonasi.bukaDariMenu();
    kolomNamaTd.focus();
}
