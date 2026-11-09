// ==================== Inti aplikasi ====================
// Berisi: notifikasi (tampilkanNotifikasi), popup konfirmasi (tanyaKonfirmasi), popup menu di menu samping
// (Pengaturan, Master Data, Buku Besar; popup Kas & Bank memakai fungsi yang sama dari fitur/kas-bank),
// dan sistem tab (bukaTab, tampilkanTab, tutupTab, saatTabDibuka).
// Dimuat sesudah semua file tampilan (HTML sudah terpasang) dan SEBELUM skrip logika lain, karena hampir
// semua file lain memakai fungsi di sini.
// Semua nama (var dan function) di sini tetap bisa dipakai skrip lain, karena skrip biasa berbagi satu ruang nama.

// ---------- Notifikasi popup ----------
// Dipakai untuk memberi tahu hasil setiap aktivitas, dengan cara:
//   tampilkanNotifikasi("Data berhasil disimpan");                     -> biru (informasi)
//   tampilkanNotifikasi("Ukuran logo terlalu besar", "galat");         -> merah (gagal)
//   tampilkanNotifikasi("Periksa kembali isian Anda", "peringatan");   -> amber
// Notifikasi hilang sendiri setelah 4 detik, atau saat tombol X diklik.
var JUDUL_NOTIFIKASI = { info: "Informasi", galat: "Gagal", peringatan: "Peringatan" };

function tampilkanNotifikasi(pesan, jenis) {
    if (!JUDUL_NOTIFIKASI[jenis]) { jenis = "info"; }   // jenis kosong atau salah ketik -> informasi

    var kotak = document.createElement("div");
    kotak.className = "notifikasi notifikasi-" + jenis;

    var kepala = document.createElement("div");
    kepala.className = "notifikasi-kepala";

    // textContent dipakai (bukan innerHTML) agar isi pesan tidak dibaca sebagai kode HTML
    var teksJudul = document.createElement("strong");
    teksJudul.textContent = JUDUL_NOTIFIKASI[jenis];

    var tombolTutup = document.createElement("button");
    tombolTutup.type = "button";
    tombolTutup.className = "notifikasi-tutup";
    tombolTutup.setAttribute("aria-label", "Tutup notifikasi");
    // Ikon lingkaran dengan tanda X (teks tetap, bukan dari pengguna)
    tombolTutup.innerHTML = '<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="10"/><path d="M8.5 8.5l7 7M15.5 8.5l-7 7"/></svg>';

    var isi = document.createElement("p");
    isi.textContent = pesan;

    kepala.appendChild(teksJudul);
    kepala.appendChild(tombolTutup);
    kotak.appendChild(kepala);
    kotak.appendChild(isi);

    // Tutup: beri kelas "keluar" (animasi memudar), lalu buang elemen setelah 0,25 detik
    function tutup() {
        kotak.classList.add("keluar");
        setTimeout(function () { kotak.remove(); }, 250);
    }
    tombolTutup.addEventListener("click", tutup);
    setTimeout(tutup, 4000);

    var area = document.getElementById("area-notifikasi");
    tempatkanAreaNotifikasi(area);
    area.appendChild(kotak);
}

// Popup modal (misalnya popup baris Detail Akun) berada di lapisan teratas browser dan membuat bagian halaman lain tidak
// bisa diklik, jadi notifikasi di luar popup tertutup dan tombol × -nya tidak bisa dipakai. Karena itu, selama ada popup
// modal terbuka, area notifikasi dipindah ke DALAM popup itu (posisinya tetap pojok kanan atas layar, position: fixed),
// supaya peringatan saat klik Lanjut terlihat dan bisa ditutup (PRD 5.1). Tanpa popup, area kembali ke halaman.
function tempatkanAreaNotifikasi(area) {
    var terbuka = Array.prototype.slice.call(document.querySelectorAll("dialog[open]"));
    var modal = terbuka.filter(function (d) {
        try { return d.matches(":modal"); } catch (galat) { return true; }   // browser lama/alat uji: anggap modal
    });
    var tujuan = modal.length ? modal[modal.length - 1] : document.body;
    if (area.parentElement !== tujuan) { tujuan.appendChild(area); }
}

// ---------- Popup menu (ikon di menu samping) ----------
// Satu cara untuk semua popup menu: ikon membuka popup, tombol X dan klik di latar gelap menutupnya
// (tombol Esc sudah ditangani <dialog> sendiri), dan klik kotak menu membuka halamannya.
//   panel      : elemen <dialog> popup
//   idTombol   : id ikon di menu samping yang membuka popup
//   idTutup    : id tombol X di popup
//   tujuan     : { "Nama di data-halaman": function () { ...buka halamannya... } }
//                Kotak yang tidak ada di tujuan berarti halamannya belum dibuat: muncul pemberitahuan.
//   saatBuka   : (boleh kosong) dijalankan sebelum popup tampil, misalnya menyembunyikan kotak fitur yang dimatikan
// Isi "tujuan" sengaja berupa function () { bukaX(); } (bukan bukaX langsung): fungsi bukaX baru dibuat oleh
// file fitur yang dimuat SESUDAH file ini, jadi baru boleh dipanggil saat kotak diklik.
function pasangPopupMenu(panel, idTombol, idTutup, tujuan, saatBuka) {
    // preventDefault() mencegah tautan href="#" menggulir halaman ke atas
    document.getElementById(idTombol).addEventListener("click", function (kejadian) {
        kejadian.preventDefault();
        if (saatBuka) { saatBuka(); }
        panel.showModal();
    });
    document.getElementById(idTutup).addEventListener("click", function () {
        panel.close();
    });
    // Kalau yang diklik adalah <dialog> itu sendiri, berarti kliknya di latar gelap (di luar kotak putih)
    panel.addEventListener("click", function (kejadian) {
        if (kejadian.target === panel) { panel.close(); }
    });
    panel.querySelectorAll(".kotak-menu").forEach(function (kotak) {
        kotak.addEventListener("click", function (kejadian) {
            kejadian.preventDefault();
            panel.close();
            var buka = tujuan[kotak.dataset.halaman];
            if (buka) {
                buka();
            } else {
                tampilkanNotifikasi("Halaman " + kotak.dataset.halaman + " belum tersedia.", "peringatan");
            }
        });
    });
}

var panelPengaturan = document.getElementById("panel-pengaturan");
pasangPopupMenu(panelPengaturan, "tombol-pengaturan", "tutup-pengaturan", {
    "Preferensi": function () { bukaTab("preferensi"); },
    "Pengguna": function () { bukaPenggunaBaru(); },
    "Penomoran": function () { bukaPenomoranBaru(); },
    "Desain Cetakan": function () { bukaCetakanBaru(); },
    "Cadangan Data": function () { bukaCadangan(); },
    "Transaksi Favorit": function () { bukaFavorit(); }   // fitur/favorit/favorit.js
});

var panelMaster = document.getElementById("panel-master");
pasangPopupMenu(panelMaster, "tombol-master", "tutup-master", {
    "Divisi": function () { bukaDivisiBaru(); },
    "Program": function () { bukaProgramBaru(); },
    "Karyawan": function () { bukaKaryawanBaru(); },
    "Gaji/Tunjangan": function () { bukaGajiBaru(); },
    "Log Aktivitas": function () { bukaLog(); }
}, function () { perbaruiKotakMaster(); });   // sembunyikan kotak yang fiturnya dimatikan

var panelBukuBesar = document.getElementById("panel-buku-besar");
pasangPopupMenu(panelBukuBesar, "tombol-buku-besar", "tutup-buku-besar", {
    "Akun Perkiraan": function () { bukaAkunBaru(); },
    "Pencatatan Gaji": function () { bukaPencatatanGajiBaru(); },
    "Jurnal Umum": function () { bukaJurnalBaru(); },
    "Anggaran": function () { bukaAnggaranBaru(); },     // fitur/anggaran/anggaran.js
    "Monitor Anggaran": function () { bukaMonitorAnggaran(); },        // fitur/monitor-anggaran/monitor-anggaran.js
    "Transfer Anggaran": function () { bukaTransferAnggaranBaru(); },  // fitur/transfer-anggaran/transfer-anggaran.js
    "Histori Akun": function () { bukaHistoriAkun(); },  // fitur/histori-akun/histori-akun.js
    "Log Aktifitas Jurnal": function () { bukaLogJurnal(); }   // fitur/log-jurnal/log-jurnal.js
});

// ---------- Popup konfirmasi ----------
// Pemakaian:
//   tanyaKonfirmasi({ pesan: "Apakah Anda yakin...?", nama: "Nama data", labelYa: "Ya, Hapus" }, function () { ...dijalankan kalau Ya... });
var dialogKonfirmasi = document.getElementById("dialog-konfirmasi");
var tindakanKonfirmasi = null;   // fungsi yang dijalankan kalau pengguna menekan Ya

function tanyaKonfirmasi(opsi, saatYa) {
    document.getElementById("judul-konfirmasi").textContent = opsi.judul || "Konfirmasi";
    document.getElementById("isi-konfirmasi").textContent = opsi.pesan;        // textContent: aman dari kode HTML
    document.getElementById("nama-konfirmasi").textContent = opsi.nama || "";
    document.getElementById("ya-konfirmasi").textContent = opsi.labelYa || "Ya";
    tindakanKonfirmasi = saatYa;
    dialogKonfirmasi.showModal();
    // Fokus awal di "Batal": menekan Enter secara tidak sengaja tidak akan menghapus apa pun
    document.getElementById("batal-konfirmasi").focus();
}

document.getElementById("ya-konfirmasi").addEventListener("click", function () {
    var tindakan = tindakanKonfirmasi;   // simpan dulu, karena penutupan popup akan mengosongkannya
    dialogKonfirmasi.close();
    if (tindakan) { tindakan(); }
});
document.getElementById("batal-konfirmasi").addEventListener("click", function () {
    dialogKonfirmasi.close();
});
// Popup tertutup dengan cara apa pun (Batal, Esc, klik latar, atau Ya): tindakan dikosongkan
dialogKonfirmasi.addEventListener("close", function () { tindakanKonfirmasi = null; });
// Klik di latar gelap = batal
dialogKonfirmasi.addEventListener("click", function (kejadian) {
    if (kejadian.target === dialogKonfirmasi) { dialogKonfirmasi.close(); }
});

// ---------- Sistem tab ----------
// Setiap tab punya dua elemen: "tab-NAMA" (tombol di deretan atas) dan "isi-NAMA" (isi halamannya).
// Daftar nama tab dibaca otomatis dari deretan tab di halaman, jadi fitur baru cukup menambah HTML tab-nya
// (lewat tampilan.js) tanpa perlu mengubah file ini.
var daftarTab = Array.prototype.map.call(document.querySelectorAll(".tab-baris > .tab[id^='tab-']"), function (tab) {
    return tab.id.slice(4);   // "tab-jurnal" -> "jurnal"
});

// Fungsi yang dijalankan setiap kali sebuah tab dibuka (diisi oleh halaman yang butuh),
// misalnya Program memuat ulang pilihan divisi karena divisi bisa saja baru ditambah.
var saatTabDibuka = {};

// Tampilkan satu tab: tab itu diberi tanda aktif, isinya ditampilkan, dan isi tab lain disembunyikan.
function tampilkanTab(nama) {
    if (saatTabDibuka[nama]) { saatTabDibuka[nama](); }
    daftarTab.forEach(function (n) {
        document.getElementById("tab-" + n).classList.toggle("aktif", n === nama);
        document.getElementById("isi-" + n).hidden = (n !== nama);
    });
}

// Buka tab: munculkan tombol tabnya (kalau masih tersembunyi), lalu tampilkan
function bukaTab(nama) {
    // Hak akses (PRD 5.8, umum/sesi.js): Pengguna, Preferensi, Cadangan Data hanya untuk Finance Yayasan
    if (!bolehBukaHalaman(nama)) { tampilkanNotifikasi("Halaman ini hanya untuk Finance Yayasan.", "peringatan"); return; }
    var tab = document.getElementById("tab-" + nama);
    if (tab.hidden) {
        tab.hidden = false;
        tab.parentElement.appendChild(tab);   // tab baru dipindah ke ujung kanan
    }
    tampilkanTab(nama);
}

// Tutup tab: sembunyikan tombol dan isinya, lalu kembali ke Dashboard
function tutupTab(nama) {
    document.getElementById("tab-" + nama).hidden = true;
    document.getElementById("isi-" + nama).hidden = true;
    tampilkanTab("dashboard");
}

// Klik judul tab -> pindah ke tab itu
document.querySelectorAll(".tab-judul").forEach(function (tombol) {
    tombol.addEventListener("click", function () {
        tampilkanTab(tombol.dataset.tab);
    });
});

// Klik tombol X di tab -> tutup tab itu
document.querySelectorAll(".tab-tutup").forEach(function (tombol) {
    tombol.addEventListener("click", function () {
        tutupTab(tombol.dataset.tutup);
    });
});

// ---------- Tab kecil di dalam halaman ----------
// Contoh: Info / Kontak dan Alamat / Penanda Tangan di Preferensi, Data / Alamat / Rekening di Karyawan.
// Tombol tab kecil: <button class="sub-tab" data-subtab="NAMA">, isinya: elemen dengan id "sub-NAMA".
// Yang diatur hanya tab sekelompok (satu baris tab yang sama), karena tiap halaman punya kelompok sendiri.
document.querySelectorAll(".sub-tab").forEach(function (tombol) {
    tombol.addEventListener("click", function () {
        // Tab kecil tunggal (misalnya "Divisi" di formulir) tidak punya tujuan, jadi tidak perlu diatur
        if (!tombol.dataset.subtab) { return; }
        tombol.parentElement.querySelectorAll(".sub-tab").forEach(function (t) {
            t.classList.toggle("aktif", t === tombol);
            document.getElementById("sub-" + t.dataset.subtab).hidden = (t !== tombol);
        });
    });
});
