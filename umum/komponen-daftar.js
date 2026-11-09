// ==================== Komponen daftar bersama ====================
// Berisi: daftar kunci data untuk Cadangan Data (jenisKunciCadangan) dan buatModulDaftar, komponen yang membuat
// tombol hijau, tab Data Baru, tampilan Daftar (cari, urut, unduh CSV, cetak), simpan, hapus, dan Log Aktivitas
// untuk hampir semua halaman (Divisi, Program, Karyawan, Akun, Jurnal, Gaji, Pembayaran, dan lain-lain).
// Dimuat sesudah umum/preferensi.js dan sebelum semua halaman yang memakainya.
// Semua nama (var dan function) di sini tetap bisa dipakai skrip lain, karena skrip biasa berbagi satu ruang nama.

// ---------- DAFTAR KUNCI DATA APLIKASI (untuk Cadangan Data) ----------
// Peta { kunciPenyimpanan: "daftar" | "objek" }. Hanya kunci di sini yang ikut dicadangkan dan dipulihkan.
// Halaman berdaftar (buatModulDaftar) mendaftarkan kuncinya sendiri secara otomatis.
// KALAU MENAMBAH PENYIMPANAN BARU DI LUAR buatModulDaftar, TAMBAHKAN KUNCINYA DI SINI, kalau tidak,
// datanya tidak ikut cadangan.
var jenisKunciCadangan = {
    dataYayasan: "objek",
    fiturYayasan: "objek",
    pembatasanYayasan: "objek",
    lampiranYayasan: "objek",
    akunPerkiraanYayasan: "objek",
    formatYayasan: "objek",
    hitunganPenomoran: "objek",
    logAktivitas: "daftar",
    lampiranJurnal: "objek",   // isi file lampiran jurnal: { idJurnal: { idFile: "data:..." } } (terpisah dari data jurnal)
    tandaRekonsiliasi: "daftar",   // baris jurnal Kas/Bank yang sudah cocok dengan rekening koran (fitur/jurnal/jurnal.js)
    daftarAkun: "daftar"
};

// ---------- SEL CSV YANG AMAN ----------
// Mengubah satu nilai menjadi sel CSV:
// - diapit tanda kutip, dan tanda kutip di dalamnya digandakan (aturan baku CSV), supaya ; dan baris baru tidak merusak kolom;
// - teks yang diawali = + - @ (atau tab / enter) diberi tanda petik ' di depannya. Tanpa ini, Excel bisa menjalankan
//   isi sel sebagai rumus (celah keamanan "CSV injection"), misalnya keterangan "=HYPERLINK(...)".
//   Angka biasa, termasuk angka negatif seperti -1.500.000, tetap dibiarkan supaya tetap terbaca sebagai angka.
function selCsvAman(nilai) {
    var teks = (nilai === null || nilai === undefined) ? "" : String(nilai);
    var angkaBiasa = /^-?[\d.,]+$/.test(teks);
    if (!angkaBiasa && /^[=+\-@\t\r]/.test(teks)) {
        teks = "'" + teks;
    }
    return '"' + teks.replace(/"/g, '""') + '"';
}

// Mengunduh tabel (daftar baris; baris pertama = judul kolom) sebagai file CSV yang aman (selCsvAman).
// Titik koma sebagai pemisah dan BOM di depan, supaya terbaca benar di Excel berbahasa Indonesia.
// Dipakai tampilan Daftar semua halaman dan laporan seperti Histori Bank.
function unduhCsv(namaBerkas, barisBaris) {
    var teks = barisBaris.map(function (b) { return b.map(selCsvAman).join(";"); }).join("\r\n");
    return unduhTeks(namaBerkas, "﻿" + teks, "text/csv;charset=utf-8");
}

// ---------- KOMPONEN MODUL DAFTAR ----------
// Dipakai ulang oleh setiap halaman yang punya "Data Baru" dan "Daftar" (Divisi, Program, dst.).
// Komponen ini membuat sendiri: tombol hijau, tab "Data Baru", dan tampilan daftar lengkap
// (tombol +, segarkan, ekspor, cetak, kolom cari, jumlah data, tabel yang bisa diurutkan).
// Halaman yang memakainya hanya perlu menyediakan tampilan formulir di dalam <section id="isi-NAMA">.
//
// Pengaturan (opsi). Yang wajib ditandai *:
//   id *             : nama modul, sama dengan id section "isi-NAMA" dan tab "tab-NAMA"
//   judul *          : judul dalam bahasa Indonesia, misalnya "Divisi" (dipakai di notifikasi dan Log Aktivitas)
//   kunci *          : nama kunci penyimpanan di localStorage (otomatis ikut Cadangan Data)
//   kolom *          : kolom tabel Daftar, misalnya [{ kunci: "nama", judul: "Nama" }]. Tiap kolom boleh punya:
//                        tampil(item)   -> teks yang tampil (misalnya nama divisi dari id-nya)
//                        urut(item)     -> kunci pengurutan, kalau berbeda dari teks yang tampil (misalnya tanggal)
//                        rata: "kanan"  -> rata kanan (angka)
//                        kelasSel(item) -> nama kelas CSS tambahan untuk sel itu (misalnya angka merah)
//                        gambarSel(sel, item) -> menggambar isi sel sendiri (misalnya bar Capaian atau label Status
//                                          berwarna). Teks dari tampil() tetap dipakai untuk cari, urut, dan unduh CSV.
//                                          Isi dari data pengguna wajib lewat textContent.
//   isiForm *      : function (item) mengisi formulir; item = data yang diubah, null = kosongkan (Data Baru)
//   labelData        : { namaIsian: "Label" } untuk rincian Log Aktivitas. Tanpa ini aktivitas tidak tercatat.
//   formatData       : { namaIsian: function (nilai) } cara menampilkan nilai di Log Aktivitas (misalnya Rupiah)
//   urutAwal         : { kolom: "tanggal", arah: -1 } urutan awal Daftar (1 = A ke Z, -1 = Z ke A)
//   pesanKosong      : teks ketika Daftar masih kosong
//   filter           : [{ judul, ambil(item), tampil(nilai), turun }] kotak pilihan penyaring di atas Daftar.
//                      Filter berpilihan tetap: { judul, pilihan: [{ nilai, teks }], awal, cocok(item, nilai) }
//                      -> pilihannya tidak diambil dari data dan tanpa "Semua" otomatis (tulis sendiri dengan nilai "");
//                         awal = pilihan saat halaman dibuka; cocok() menentukan data yang lolos untuk pilihan itu.
//   alasanTolakHapus : function (item) -> "" kalau boleh dihapus, atau kalimat alasan penolakan
//   saatDihapus      : function (item) membersihkan data pendukung setelah item terhapus (misalnya file lampiran)
//   saatTampil       : function (nama) dipanggil tiap pindah tampilan ("form" atau "daftar"), untuk memuat ulang pilihan
//   hanyaDaftar      : true = halaman tanpa formulir (misalnya Log Aktivitas)
//   tampilHanya      : function (item) -> true kalau item tampil di Daftar. Data lain tetap tersimpan dan tetap dipakai
//                      perhitungan (misalnya jurnal otomatis Pembayaran tidak tampil di daftar Jurnal Umum, PRD 3.1)
//   detail           : function (item) -> isi tampilan rincian hanya-baca (lihat renderDetail di bawah)
//   saatKlikBaris    : function (item) dijalankan saat baris halaman hanya-daftar diklik, sebagai ganti detail
//   pilihKolom       : true = ada tombol roda gigi untuk memilih kolom yang tampil (sementara, tidak disimpan)
//   keadaanTambahan  : { ambil, pakai } isi formulir di luar kolom isian (misalnya baris rincian), supaya ikut diingat per tab
// Hasilnya objek modul dengan: ambil, simpan, tampilkan, bukaBaru, bukaUbah, bukaDariMenu, bukaDariTemplat, selesaiSimpan,
// hapus, gambarTabel, segarkan, bukaDetail, tutupDetail, adaPerubahan, idTerakhirDisimpan, dan idDiubah
// (null = Data Baru, berisi id = data yang dibuka di tab aktif).
// Modul menurut id halamannya ("bayar" untuk <section id="isi-bayar">). Dipakai pintasan keyboard (umum/pintasan.js).
var modulPerHalaman = Object.create(null);

function buatModulDaftar(opsi) {
    var seksi = document.getElementById("isi-" + opsi.id);
    var tampilanForm = seksi.querySelector(".modul-form");
    jenisKunciCadangan[opsi.kunci] = "daftar";   // daftar ini otomatis ikut Cadangan Data
    // Pengingat untuk pembuat halaman: tanpa labelData, aktivitas Buat/Ubah/Hapus tidak masuk Log Aktivitas.
    // Peringatan ini muncul di Console browser (F12) supaya kelalaian tidak lolos tanpa tanda.
    if (!opsi.hanyaDaftar && !opsi.labelData) {
        console.warn("buatModulDaftar(" + opsi.id + "): opsi.labelData belum diisi, aktivitas halaman ini tidak akan tercatat di Log Aktivitas.");
    }
    var modul = { idDiubah: null, hanyaDaftar: opsi.hanyaDaftar === true };   // idDiubah kosong = Data Baru; berisi id = Ubah Data
    modulPerHalaman[opsi.id] = modul;
    // arah 1 = A ke Z, -1 = Z ke A. Halaman boleh menentukan urutan awal lewat opsi.urutAwal (misalnya terbaru di atas).
    var urutan = opsi.urutAwal
        ? { kolom: opsi.urutAwal.kolom, arah: opsi.urutAwal.arah }
        : { kolom: opsi.kolom[0].kunci, arah: 1 };
    var kataCari = "";
    var terakhirTampil = [];   // data yang sedang tampil di tabel (dipakai untuk ekspor)
    var selectFilter = [];     // kotak pilihan filter di atas tabel (kalau halaman memakai opsi.filter)
    var kolomSembunyi = {};    // { kunciKolom: true } kolom yang disembunyikan lewat tombol roda gigi (opsi.pilihKolom)

    // Nilai yang tampil di sebuah kolom. Kolom boleh punya fungsi "tampil" untuk nilai turunan,
    // misalnya nama divisi yang dicari dari id-nya. Tanpa itu, dipakai nilai apa adanya.
    function nilaiKolom(item, kolom) {
        var nilai = kolom.tampil ? kolom.tampil(item) : item[kolom.kunci];
        return nilai || "";
    }

    var ikon = {
        daftar: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" aria-hidden="true"><path d="M9 6h12M9 12h12M9 18h12"/><circle cx="4.5" cy="6" r="1.2"/><circle cx="4.5" cy="12" r="1.2"/><circle cx="4.5" cy="18" r="1.2"/></svg>',
        baru: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.8" stroke-linecap="round" aria-hidden="true"><path d="M12 5v14M5 12h14"/></svg>',
        segarkan: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M21 12a9 9 0 1 1-3-6.7L21 8"/><path d="M21 3v5h-5"/></svg>',
        ekspor: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 4v11M7 10l5 5 5-5M5 20h14"/></svg>',
        cetak: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M7 9V3h10v6"/><path d="M7 17H5a1 1 0 0 1-1-1v-6a1 1 0 0 1 1-1h14a1 1 0 0 1 1 1v6a1 1 0 0 1-1 1h-2"/><rect x="7" y="14" width="10" height="7"/></svg>'
    };

    // ----- Barisan atas: tombol hijau dan tab-tab dokumen (PRD 6.10) -----
    var bar = document.createElement("div");
    bar.className = "modul-bar";
    var tombolDaftar = document.createElement("button");
    tombolDaftar.type = "button";
    tombolDaftar.className = "tombol-daftar";
    tombolDaftar.setAttribute("aria-label", "Pindah antara formulir dan Daftar " + opsi.judul);
    tombolDaftar.title = "Daftar " + opsi.judul;
    tombolDaftar.innerHTML = ikon.daftar;   // ikon tetap, bukan dari pengguna
    var barisTabDokumen = document.createElement("div");
    barisTabDokumen.className = "tab-dokumen";
    bar.appendChild(tombolDaftar);
    bar.appendChild(barisTabDokumen);
    // Halaman "hanya daftar" (misalnya Log Aktivitas) tidak punya formulir, jadi tidak butuh tombol hijau dan tab
    if (!opsi.hanyaDaftar) {
        seksi.insertBefore(bar, tampilanForm);
    }

    // ----- Tampilan daftar -----
    var tampilanDaftar = document.createElement("div");
    tampilanDaftar.hidden = true;
    tampilanDaftar.innerHTML =
        '<div class="toolbar toolbar-daftar">' +
            '<div class="toolbar-kiri">' +
                '<button type="button" class="tombol tombol-utama" data-alat="baru" aria-label="Data baru" title="Data baru">' + ikon.baru + '</button>' +
                '<button type="button" class="tombol tombol-garis" data-alat="segarkan" aria-label="Segarkan" title="Segarkan">' + ikon.segarkan + '</button>' +
            '</div>' +
            '<div class="toolbar-kanan">' +
                '<button type="button" class="tombol tombol-garis" data-alat="ekspor" aria-label="Unduh sebagai file CSV" title="Unduh (CSV, bisa dibuka di Excel)">' + ikon.ekspor + '</button>' +
                '<button type="button" class="tombol tombol-garis" data-alat="cetak" aria-label="Cetak daftar" title="Cetak">' + ikon.cetak + '</button>' +
                '<input type="search" class="kolom-cari" placeholder="Cari..." aria-label="Cari di daftar" autocomplete="off">' +
                '<span class="kotak-jumlah" title="Jumlah data"><span data-jumlah>0</span></span>' +
            '</div>' +
        '</div>' +
        '<div class="bungkus-tabel">' +
            '<table class="tabel-data tabel-daftar"><thead><tr></tr></thead><tbody></tbody></table>' +
            '<p class="tabel-kosong" hidden></p>' +
        '</div>';
    seksi.appendChild(tampilanDaftar);

    // Halaman hanya daftar: tombol "+" (data baru) dibuang
    if (opsi.hanyaDaftar) {
        tampilanDaftar.querySelector("[data-alat='baru']").remove();
    }

    // Filter di atas tabel: satu kotak pilihan per filter. Isinya diisi di isiFilter().
    if (opsi.filter) {
        var barisFilter = document.createElement("div");
        barisFilter.className = "baris-filter";
        opsi.filter.forEach(function (f) {
            var pilih = document.createElement("select");
            pilih.className = "pilih-filter";
            pilih.setAttribute("aria-label", "Filter " + f.judul);
            pilih.addEventListener("change", function () { modul.gambarTabel(); });
            barisFilter.appendChild(pilih);
            selectFilter.push(pilih);
        });
        tampilanDaftar.insertBefore(barisFilter, tampilanDaftar.firstChild);
    }

    var kepalaTabel = tampilanDaftar.querySelector("thead tr");
    var badanTabel = tampilanDaftar.querySelector("tbody");
    var pesanKosong = tampilanDaftar.querySelector(".tabel-kosong");
    var kolomCari = tampilanDaftar.querySelector(".kolom-cari");

    // ----- Tampilan rincian (hanya baca), kalau halaman menyediakan opsi.detail -----
    // opsi.detail(item) mengembalikan:
    //   { judul: "Judul tab",
    //     tab: [ { nama: "Umum", baris: [{ label: "Pengguna", nilai: "..." }] },
    //            { nama: "Pemeriksaan", tabel: { kolom: ["A", "B"], baris: [["1", "2"]], kosong: "Tidak ada data" } } ] }
    var tampilanDetail = null;
    if (opsi.detail) {
        tampilanDetail = document.createElement("div");
        tampilanDetail.hidden = true;
        seksi.appendChild(tampilanDetail);
    }

    function renderDetail(data) {
        tampilanDetail.textContent = "";

        // Barisan atas: tombol hijau (kembali ke daftar) dan tab berisi judul dengan tombol tutup
        var barDetail = document.createElement("div");
        barDetail.className = "modul-bar";
        var tombolKembali = document.createElement("button");
        tombolKembali.type = "button";
        tombolKembali.className = "tombol-daftar";
        tombolKembali.setAttribute("aria-label", "Kembali ke daftar " + opsi.judul);
        tombolKembali.title = "Kembali ke daftar";
        tombolKembali.innerHTML = ikon.daftar;   // ikon tetap, bukan dari pengguna
        var tabDetail = document.createElement("div");
        tabDetail.className = "modul-tab aktif modul-tab-ganda";
        var judulDetail = document.createElement("span");
        judulDetail.textContent = data.judul;    // textContent: aman dari kode HTML
        var tombolTutup = document.createElement("button");
        tombolTutup.type = "button";
        tombolTutup.className = "tab-tutup";
        tombolTutup.setAttribute("aria-label", "Tutup rincian");
        tombolTutup.innerHTML = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" aria-hidden="true"><path d="M6 6l12 12M18 6L6 18"/></svg>';
        tabDetail.appendChild(judulDetail);
        tabDetail.appendChild(tombolTutup);
        barDetail.appendChild(tombolKembali);
        barDetail.appendChild(tabDetail);
        tombolKembali.addEventListener("click", modul.tutupDetail);
        tombolTutup.addEventListener("click", modul.tutupDetail);
        tampilanDetail.appendChild(barDetail);

        // Tab kecil di dalam rincian (misalnya Umum dan Pemeriksaan)
        var barisTab = document.createElement("div");
        barisTab.className = "sub-tab-baris";
        var kotak = document.createElement("div");
        kotak.className = "form-pref";
        var tombolTab = [];
        var panel = [];

        data.tab.forEach(function (t, nomor) {
            var tombol = document.createElement("button");
            tombol.type = "button";
            tombol.className = "sub-tab" + (nomor === 0 ? " aktif" : "");
            tombol.textContent = t.nama;
            tombolTab.push(tombol);
            barisTab.appendChild(tombol);

            var isiPanel = document.createElement("div");
            isiPanel.className = "sub-isi";
            isiPanel.hidden = (nomor !== 0);
            panel.push(isiPanel);

            if (t.baris) {
                // Isian hanya baca: label di kiri, kolom abu-abu di kanan
                t.baris.forEach(function (b) {
                    var baris = document.createElement("div");
                    baris.className = "baris-form";
                    var label = document.createElement("span");
                    label.className = "label-kelompok";
                    label.textContent = b.label;
                    var kolom = document.createElement("input");
                    kolom.type = "text";
                    kolom.readOnly = true;
                    kolom.value = b.nilai;
                    kolom.setAttribute("aria-label", b.label);
                    baris.appendChild(label);
                    baris.appendChild(kolom);
                    isiPanel.appendChild(baris);
                });
            }
            if (t.tabel) {
                var bungkus = document.createElement("div");
                bungkus.className = "bungkus-tabel";
                if (t.tabel.baris.length === 0) {
                    var kosong = document.createElement("p");
                    kosong.className = "tabel-kosong";
                    kosong.textContent = t.tabel.kosong || "Tidak ada data.";
                    bungkus.appendChild(kosong);
                } else {
                    var tabel = document.createElement("table");
                    tabel.className = "tabel-data tabel-daftar";
                    var kepala = document.createElement("thead");
                    var barisKepala = document.createElement("tr");
                    t.tabel.kolom.forEach(function (judul) {
                        var th = document.createElement("th");
                        th.scope = "col";
                        th.textContent = judul;
                        barisKepala.appendChild(th);
                    });
                    kepala.appendChild(barisKepala);
                    var badan = document.createElement("tbody");
                    t.tabel.baris.forEach(function (sel) {
                        var tr = document.createElement("tr");
                        sel.forEach(function (nilai) {
                            var td = document.createElement("td");
                            td.textContent = nilai;
                            tr.appendChild(td);
                        });
                        badan.appendChild(tr);
                    });
                    tabel.appendChild(kepala);
                    tabel.appendChild(badan);
                    bungkus.appendChild(tabel);
                }
                isiPanel.appendChild(bungkus);
            }
            kotak.appendChild(isiPanel);

            tombol.addEventListener("click", function () {
                tombolTab.forEach(function (x, i) {
                    x.classList.toggle("aktif", x === tombol);
                    panel[i].hidden = (x !== tombol);
                });
            });
        });

        tampilanDetail.appendChild(barisTab);
        tampilanDetail.appendChild(kotak);
    }

    // Buka rincian satu data; tombol hijau atau tombol X membawa kembali ke daftar
    modul.bukaDetail = function (item) {
        renderDetail(opsi.detail(item));
        tampilanDaftar.hidden = true;
        tampilanDetail.hidden = false;
    };
    modul.tutupDetail = function () {
        tampilanDetail.hidden = true;
        tampilanDaftar.hidden = false;
    };

    // Judul kolom berupa tombol: klik untuk mengurutkan, klik lagi untuk membalik
    opsi.kolom.forEach(function (kolom) {
        var th = document.createElement("th");
        th.scope = "col";
        var tombol = document.createElement("button");
        tombol.type = "button";
        tombol.className = "urut";
        tombol.textContent = kolom.judul;
        tombol.addEventListener("click", function () {
            if (urutan.kolom === kolom.kunci) {
                urutan.arah = -urutan.arah;
            } else {
                urutan.kolom = kolom.kunci;
                urutan.arah = 1;
            }
            modul.gambarTabel();
        });
        th.dataset.kolom = kolom.kunci;
        th.appendChild(tombol);
        kepalaTabel.appendChild(th);
    });

    function kolomTampilDaftar() {
        return opsi.kolom.filter(function (k) { return !kolomSembunyi[k.kunci]; });
    }

    // ----- Tombol roda gigi: memilih kolom yang tampil (opsi.pilihKolom) -----
    function pasangPilihKolom() {
        var bungkus = document.createElement("div");
        bungkus.className = "pilih-kolom";
        var tombol = document.createElement("button");
        tombol.type = "button";
        tombol.className = "tombol tombol-garis";
        tombol.title = "Pilih kolom";
        tombol.setAttribute("aria-label", "Pilih kolom yang tampil");
        tombol.setAttribute("aria-expanded", "false");
        tombol.innerHTML = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.7 1.7 0 0 0 .3 1.9l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-2.9 1.2V21a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-2.9-1.2l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0-1.2-2.9H3a2 2 0 1 1 0-4h.1a1.7 1.7 0 0 0 1.2-2.9l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 2.9-1.2V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 2.9 1.2l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0 1.2 2.9h.1a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1z"/></svg>';   // ikon tetap, bukan dari pengguna
        var menu = document.createElement("div");
        menu.className = "pilih-kolom-menu";
        menu.hidden = true;
        opsi.kolom.forEach(function (kolom) {
            var label = document.createElement("label");
            var kotak = document.createElement("input");
            kotak.type = "checkbox";
            kotak.checked = true;
            var teks = document.createElement("span");
            teks.textContent = kolom.judul;
            kotak.addEventListener("change", function () {
                // Minimal satu kolom tetap tampil, supaya tabel tidak kosong
                if (!kotak.checked && kolomTampilDaftar().length === 1) { kotak.checked = true; return; }
                kolomSembunyi[kolom.kunci] = !kotak.checked;
                modul.gambarTabel();
            });
            label.appendChild(kotak);
            label.appendChild(teks);
            menu.appendChild(label);
        });
        function aturMenu(buka) {
            menu.hidden = !buka;
            tombol.setAttribute("aria-expanded", String(buka));
        }
        tombol.addEventListener("click", function () { aturMenu(menu.hidden); });
        document.addEventListener("click", function (kejadian) {
            if (!bungkus.contains(kejadian.target)) { aturMenu(false); }
        });
        bungkus.addEventListener("keydown", function (kejadian) {
            if (kejadian.key === "Escape") { aturMenu(false); tombol.focus(); }
        });
        bungkus.appendChild(tombol);
        bungkus.appendChild(menu);
        var kanan = tampilanDaftar.querySelector(".toolbar-kanan");
        kanan.insertBefore(bungkus, kanan.firstChild);
    }
    if (opsi.pilihKolom) { pasangPilihKolom(); }

    // ----- Data -----
    // Selalu mengembalikan daftar (array). Kalau isi penyimpanan rusak atau bukan daftar (misalnya diubah lewat F12),
    // dianggap kosong, supaya halaman tidak macet. Butir yang bukan objek ikut dibuang.
    modul.ambil = function () {
        try {
            var teks = localStorage.getItem(opsi.kunci);
            if (teks) {
                var data = JSON.parse(teks);
                if (Array.isArray(data)) {
                    return data.filter(function (d) { return d !== null && typeof d === "object"; });
                }
            }
        } catch (galat) {
            // Kalau gagal membaca, anggap belum ada data
        }
        return [];
    };

    // Simpan seluruh daftar. Mengembalikan true kalau berhasil.
    modul.simpan = function (daftar) {
        // Hak akses (PRD 5.8, umum/sesi.js): Pengawas hanya melihat. Pengaman kedua di belakang tombol yang disembunyikan;
        // saat halaman baru dimuat (misalnya pengisian desain bawaan) ditolak tanpa pesan.
        if (hanyaLihat()) {
            if (document.readyState === "complete") { tampilkanNotifikasi("Peran Pengawas hanya bisa melihat data.", "peringatan"); }
            return false;
        }
        try {
            localStorage.setItem(opsi.kunci, JSON.stringify(daftar));
            return true;
        } catch (galat) {
            tampilkanNotifikasi("Gagal menyimpan. Penyimpanan browser penuh atau diblokir.", "galat");
            return false;
        }
    };

    // ----- Tab dokumen (PRD 6.10) -----
    // Setiap data yang dibuka punya tab sendiri: { kunci: "baru" atau id data, keadaan, sidikAwal, el }.
    //   keadaan  : isi formulir tab itu yang sedang tidak tampil (dicatat saat pindah ke tab lain)
    //   sidikAwal: isi formulir saat tab dibuka atau sesudah disimpan, untuk tahu apakah sudah diubah
    // Hanya satu formulir di layar. Saat pindah tab, isi tab lama dicatat, lalu isi tab baru dikembalikan.
    // Isian yang dicatat: semua input, select, dan textarea ber-id di formulir. Halaman dengan isi lain (misalnya baris
    // rincian di memori) menambah opsi.keadaanTambahan = { ambil: function () -> data, pakai: function (data) }.
    var BATAS_TAB_DOKUMEN = 10;
    var tabDokumen = [];
    var tabAktif = null;

    function isianForm() {
        return tampilanForm ? Array.prototype.filter.call(tampilanForm.querySelectorAll("input[id], select[id], textarea[id]"), function (el) {
            return el.type !== "file" && el.type !== "button" && el.type !== "submit";
        }) : [];
    }
    function ambilKeadaan() {
        var isian = {};
        isianForm().forEach(function (el) { isian[el.id] = (el.type === "checkbox" || el.type === "radio") ? el.checked : el.value; });
        return { isian: isian, tambahan: opsi.keadaanTambahan ? opsi.keadaanTambahan.ambil() : null };
    }
    // Mengembalikan isian yang berbeda, urut dari atas formulir, seperti diketik ulang: kejadian input dan change
    // dijalankan supaya bagian yang bergantung (misalnya pilihan induk mengikuti tipe) ikut tersusun.
    function pakaiKeadaan(k) {
        isianForm().forEach(function (el) {
            if (!Object.prototype.hasOwnProperty.call(k.isian, el.id)) { return; }
            var centang = el.type === "checkbox" || el.type === "radio";
            var sekarang = centang ? el.checked : el.value;
            if (sekarang === k.isian[el.id]) { return; }
            if (centang) { el.checked = k.isian[el.id]; } else { el.value = k.isian[el.id]; }
            el.dispatchEvent(new Event("input", { bubbles: true }));
            el.dispatchEvent(new Event("change", { bubbles: true }));
        });
        if (opsi.keadaanTambahan && k.tambahan !== null) { opsi.keadaanTambahan.pakai(k.tambahan); }
    }
    function sidikKeadaan(k) { return JSON.stringify(k); }

    function itemTab(t) {
        return t.kunci === "baru" ? null : modul.ambil().find(function (d) { return d.id === t.kunci; }) || null;
    }
    function judulTab(item) {
        return item ? teksAman(item.nama || item.nomor) || "Ubah Data" : "Data Baru";
    }
    function gambarTabDokumen(t, judul) {
        if (!t.el) {
            t.el = document.createElement("div");
            t.el.className = "modul-tab modul-tab-ganda";
            var tombolJudul = document.createElement("button");
            tombolJudul.type = "button";
            tombolJudul.className = "tab-judul";
            var tombolTutup = document.createElement("button");
            tombolTutup.type = "button";
            tombolTutup.className = "tab-tutup";
            tombolTutup.innerHTML = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" aria-hidden="true"><path d="M6 6l12 12M18 6L6 18"/></svg>';   // ikon tetap
            tombolJudul.addEventListener("click", function () { aktifkanTab(t); });
            tombolTutup.addEventListener("click", function () { tutupTab(t); });
            t.el.appendChild(tombolJudul);
            t.el.appendChild(tombolTutup);
            barisTabDokumen.appendChild(t.el);
        }
        t.el.firstChild.textContent = judul;   // textContent: aman dari kode HTML
        t.el.lastChild.setAttribute("aria-label", "Tutup " + judul);
    }

    // Apakah isi tab sudah diubah dan belum disimpan
    function tabDiubah(t) {
        if (t.sidikAwal === null) { return false; }
        return sidikKeadaan(t === tabAktif && tampilanForm ? ambilKeadaan() : t.keadaan) !== t.sidikAwal;
    }
    modul.adaPerubahan = function () { return !!tabAktif && tabDiubah(tabAktif); };

    // Isi formulir dari data tab (dan isi yang belum disimpan, kalau ada)
    function tampilkanIsiTab(t) {
        var item = itemTab(t);
        modul.idDiubah = item ? item.id : null;
        opsi.isiForm(t.awal || item);
        t.awal = null;
        if (t.sidikAwal === null) { t.sidikAwal = sidikKeadaan(ambilKeadaan()); }
        if (t.keadaan) { pakaiKeadaan(t.keadaan); t.keadaan = null; }
    }

    function aktifkanTab(t) {
        if (t !== tabAktif && tabAktif && tampilanForm) { tabAktif.keadaan = ambilKeadaan(); }
        if (t !== tabAktif || (tampilanForm && tampilanForm.hidden)) {
            // Data yang sudah dihapus dari tempat lain: tabnya ditutup
            if (t.kunci !== "baru" && !itemTab(t)) { buangTab(t); return; }
            if (t !== tabAktif) { tabAktif = t; tampilkanIsiTab(t); }
        }
        modul.tampilkan("form");
    }

    // Membuat tab baru, atau pindah ke tab yang sudah ada untuk data yang sama
    function bukaTabDokumen(kunci, item) {
        var ada = tabDokumen.find(function (t) { return t.kunci === kunci; });
        if (ada) { aktifkanTab(ada); return ada; }
        if (tabDokumen.length >= BATAS_TAB_DOKUMEN) {
            tampilkanNotifikasi("Paling banyak " + BATAS_TAB_DOKUMEN + " tab. Tutup salah satu tab dulu.", "peringatan");
            return null;
        }
        var t = { kunci: kunci, keadaan: null, sidikAwal: null, el: null, awal: null };
        tabDokumen.push(t);
        gambarTabDokumen(t, judulTab(item));
        aktifkanTab(t);
        return t;
    }

    // Membuang tab tanpa bertanya. Tab aktif dibuang: pindah ke tab sebelahnya, atau ke Daftar kalau tidak ada tab lagi.
    function buangTab(t) {
        var nomor = tabDokumen.indexOf(t);
        if (nomor === -1) { return; }
        tabDokumen.splice(nomor, 1);
        if (t.el) { t.el.remove(); }
        if (t !== tabAktif) { return; }
        tabAktif = null;
        var berikut = tabDokumen[Math.min(nomor, tabDokumen.length - 1)];
        if (berikut) {
            aktifkanTab(berikut);
        } else {
            modul.idDiubah = null;
            opsi.isiForm(null);
            modul.gambarTabel();
            modul.tampilkan("daftar");
        }
    }

    // Tombol x: kalau isinya sudah diubah, tanya dulu (seperti Accurate)
    function tutupTab(t) {
        if (!tabDiubah(t)) { buangTab(t); return; }
        tanyaKonfirmasi({ pesan: "Perubahan yang Anda lakukan akan dibatalkan, lanjutkan?", labelYa: "Ya" }, function () { buangTab(t); });
    }

    // ----- Pindah tampilan -----
    // Hijau = tombol selalu hijau. Klik: formulir -> daftar, daftar -> formulir.
    modul.tampilkan = function (nama) {
        var form = (nama === "form");
        // Halaman boleh memuat ulang isinya setiap kali tampilan berpindah (misalnya pilihan divisi di formulir)
        if (opsi.saatTampil) { opsi.saatTampil(nama); }
        if (tampilanForm) { tampilanForm.hidden = !form; }
        if (tampilanDetail) { tampilanDetail.hidden = true; }   // berpindah tampilan menutup rincian
        tampilanDaftar.hidden = form && !!tampilanForm;
        tabDokumen.forEach(function (t) { t.el.classList.toggle("aktif", form && t === tabAktif); });
        // Tombol yang hanya relevan saat mengubah data (misalnya Hapus)
        seksi.querySelectorAll("[data-hanya-ubah]").forEach(function (el) {
            el.hidden = (modul.idDiubah === null);
        });
    };

    // Tab Data Baru: pindah ke tab yang ada (isinya yang belum disimpan tetap), atau buat baru
    modul.bukaBaru = function () {
        if (opsi.hanyaDaftar) { return; }
        var ada = tabDokumen.find(function (t) { return t.kunci === "baru"; });
        // Data Baru yang belum diisi apa pun dikosongkan ulang (misalnya tanggal kembali ke hari ini)
        if (ada && ada === tabAktif && !tabDiubah(ada)) {
            modul.idDiubah = null;
            opsi.isiForm(null);
            ada.sidikAwal = sidikKeadaan(ambilKeadaan());
            modul.tampilkan("form");
            return;
        }
        bukaTabDokumen("baru", null);
    };

    // Data Baru yang benar-benar kosong, lalu lanjut() dijalankan. Dipakai fitur yang mengisi Data Baru dari halaman lain
    // (misalnya Proses > Gaji membuka Pembayaran). Kalau Data Baru masih berisi isian yang belum disimpan, ditanya dulu
    // dengan peringatan yang sama seperti tombol x; Batal = tidak terjadi apa-apa.
    modul.bukaBaruKosong = function (lanjut) {
        var ada = tabDokumen.find(function (t) { return t.kunci === "baru"; });
        function kosongkan() {
            if (ada) { buangTab(ada); }
            bukaTabDokumen("baru", null);
            if (lanjut) { lanjut(); }
        }
        if (ada && tabDiubah(ada)) {
            tanyaKonfirmasi({ pesan: "Data Baru " + opsi.judul + " masih berisi isian yang belum disimpan. Perubahan yang Anda lakukan akan dibatalkan, lanjutkan?", labelYa: "Ya" }, kosongkan);
            return;
        }
        kosongkan();
    };

    // Formulir Data Baru yang sudah terisi dari templat (Transaksi Favorit, PRD 6.8). Belum tersimpan sebelum tombol Simpan,
    // jadi tab Data Baru dianggap sudah diubah. Data Baru yang masih berisi isian belum disimpan ditanya dulu (seperti
    // tombol x), bukan ditimpa diam-diam. selesai (boleh tidak ada) dijalankan sesudah templat terisi; Batal = tidak terjadi apa-apa.
    modul.bukaDariTemplat = function (templat, selesai) {
        modul.bukaBaruKosong(function () {
            modul.idDiubah = null;
            opsi.isiForm(templat);
            modul.tampilkan("form");
            if (selesai) { selesai(); }
        });
    };

    modul.bukaUbah = function (item) {
        if (opsi.hanyaDaftar || !item) { return; }   // halaman tanpa formulir (misalnya Log Aktivitas) tidak bisa diubah
        bukaTabDokumen(item.id, item);
    };

    // Dipanggil dari menu (Master Data): buka tab modul, langsung ke formulir kosong
    modul.bukaDariMenu = function () {
        bukaTab(opsi.id);
        modul.bukaBaru();
    };

    // Dipanggil halaman setelah berhasil menyimpan (PRD 6.10): tab Data Baru kembali kosong; tab data lama tetap terbuka
    // berisi data terbaru, judulnya ikut nomor atau nama baru.
    //   itemBaru : data sesudah disimpan; itemLama : salinan data sebelum diubah (null kalau data baru).
    // Komponen sendiri yang memberi notifikasi "berhasil disimpan" dan mencatatnya di Log Aktivitas
    // (butuh opsi.labelData), jadi halaman baru tidak perlu memanggil catatLog sendiri.
    // modul.idTerakhirDisimpan: id data yang baru saja disimpan (dipakai tombol Cetak yang juga menyimpan).
    modul.selesaiSimpan = function (sedangMengubah, itemBaru, itemLama) {
        tampilkanNotifikasi(opsi.judul + " telah berhasil disimpan");
        if (opsi.labelData && itemBaru) {
            catatLog({
                tindakan: sedangMengubah ? "Ubah" : "Buat",
                tipe: opsi.judul,
                referensi: itemBaru.nama,
                rincian: buatRincian(itemLama || null, itemBaru, opsi.labelData, opsi.formatData)
            });
        }
        modul.idTerakhirDisimpan = sedangMengubah ? modul.idDiubah : (itemBaru && itemBaru.id) || null;
        modul.gambarTabel();
        if (sedangMengubah && tabAktif && tabAktif.kunci !== "baru") {
            var terbaru = itemTab(tabAktif);
            opsi.isiForm(terbaru);
            gambarTabDokumen(tabAktif, judulTab(terbaru));
        } else {
            modul.idDiubah = null;
            opsi.isiForm(null);
        }
        if (tabAktif) { tabAktif.sidikAwal = sidikKeadaan(ambilKeadaan()); }
        modul.tampilkan("form");
    };

    modul.hapus = function (item) {
        // Halaman boleh menolak penghapusan lewat opsi.alasanTolakHapus
        // (misalnya divisi yang masih dipakai program). Fungsinya mengembalikan alasan, atau "" kalau boleh.
        if (opsi.alasanTolakHapus) {
            var alasan = opsi.alasanTolakHapus(item);
            if (alasan) {
                tampilkanNotifikasi(alasan, "peringatan");
                return;
            }
        }
        // Tanya dulu lewat popup konfirmasi. Penghapusan baru berjalan kalau pengguna menekan "Ya, Hapus".
        tanyaKonfirmasi({
            pesan: "Apakah Anda yakin akan menghapus data " + opsi.judul.toLowerCase() + " berikut?",
            nama: item.nama,
            labelYa: "Ya, Hapus"
        }, function () {
            var sisa = modul.ambil().filter(function (d) { return d.id !== item.id; });
            if (modul.simpan(sisa)) {
                // Halaman boleh membersihkan data pendukung yang ikut terhapus (misalnya file lampiran jurnal)
                if (opsi.saatDihapus) { opsi.saatDihapus(item); }
                // Tab data itu ikut tertutup; tanpa tab lain, kembali ke Daftar
                var tabData = tabDokumen.find(function (t) { return t.kunci === item.id; });
                if (tabData && tabData === tabAktif) { tabAktif = null; }
                if (tabData) { buangTab(tabData); }
                modul.idDiubah = tabAktif ? modul.idDiubah : null;
                modul.gambarTabel();
                modul.tampilkan("daftar");
                tampilkanNotifikasi(opsi.judul + " telah dihapus");
                catatLog({
                    tindakan: "Hapus",
                    tipe: opsi.judul,
                    referensi: item.nama,
                    // Isi data yang dihapus dicatat sebagai nilai lama, supaya masih bisa diperiksa
                    rincian: opsi.labelData ? buatRincian(item, null, opsi.labelData, opsi.formatData) : null
                });
            }
        });
    };

    // ----- Filter -----
    // Isi pilihan tiap filter dari nilai-nilai yang ada di data, tanpa menghilangkan pilihan yang sedang dipakai.
    // Pilihan pertama selalu "Judul: Semua" (tanpa penyaringan).
    // Data yang boleh tampil di Daftar (semua data, kecuali halaman menyaringnya lewat opsi.tampilHanya)
    function dataDaftar() {
        return opsi.tampilHanya ? modul.ambil().filter(opsi.tampilHanya) : modul.ambil();
    }

    function isiFilter() {
        var semuaData = dataDaftar();
        opsi.filter.forEach(function (f, i) {
            var pilih = selectFilter[i];
            var sedangDipilih = pilih.value;
            // Filter berpilihan tetap (misalnya "Tampilkan: Yang masih berjalan / Semua"): pilihan dari pengaturan,
            // bukan dari data. Pertama kali diisi memakai pilihan awal; sesudahnya pilihan pengguna dipertahankan.
            if (f.pilihan) {
                var pertamaKali = (pilih.options.length === 0);
                pilih.textContent = "";
                f.pilihan.forEach(function (p) {
                    var o = document.createElement("option");
                    o.value = p.nilai;
                    o.textContent = f.judul + ": " + p.teks;
                    pilih.appendChild(o);
                });
                pilih.value = pertamaKali ? (f.awal || "") : sedangDipilih;
                return;
            }
            var nilaiUnik = [];
            semuaData.forEach(function (d) {
                var nilai = String(f.ambil(d));
                if (nilaiUnik.indexOf(nilai) === -1) { nilaiUnik.push(nilai); }
            });
            nilaiUnik.sort();
            if (f.turun) { nilaiUnik.reverse(); }   // misalnya tanggal: terbaru di atas

            pilih.textContent = "";
            var semua = document.createElement("option");
            semua.value = "";
            semua.textContent = f.judul + ": Semua";
            pilih.appendChild(semua);
            nilaiUnik.forEach(function (nilai) {
                var opsiNilai = document.createElement("option");
                opsiNilai.value = nilai;
                opsiNilai.textContent = f.judul + ": " + (f.tampil ? f.tampil(nilai) : nilai);
                pilih.appendChild(opsiNilai);
            });
            pilih.value = nilaiUnik.indexOf(sedangDipilih) !== -1 ? sedangDipilih : "";
        });
    }

    // ----- Tabel -----
    modul.gambarTabel = function () {
        var kata = kataCari.toLowerCase();
        if (opsi.filter) { isiFilter(); }
        var daftar = dataDaftar().filter(function (d) {
            return opsi.kolom.some(function (k) {
                return String(nilaiKolom(d, k)).toLowerCase().indexOf(kata) !== -1;
            });
        });
        // Penyaringan dengan filter: pilihan "Semua" (nilai kosong) meloloskan semua data
        if (opsi.filter) {
            opsi.filter.forEach(function (f, i) {
                var nilaiPilih = selectFilter[i].value;
                if (nilaiPilih !== "") {
                    daftar = daftar.filter(function (d) {
                        return f.cocok ? f.cocok(d, nilaiPilih) : String(f.ambil(d)) === nilaiPilih;
                    });
                }
            });
        }
        var k = urutan.kolom;
        var kolomUrut = opsi.kolom.find(function (c) { return c.kunci === k; });
        daftar.sort(function (a, b) {
            // Kolom boleh punya fungsi "urut" untuk kunci pengurutan yang berbeda dari teks yang tampil
            // (misalnya tanggal ditampilkan "22 Okt 2026" tetapi diurutkan menurut "2026-10-22")
            var kunciA = kolomUrut.urut ? kolomUrut.urut(a) : nilaiKolom(a, kolomUrut);
            var kunciB = kolomUrut.urut ? kolomUrut.urut(b) : nilaiKolom(b, kolomUrut);
            return String(kunciA).localeCompare(String(kunciB), "id") * urutan.arah;
        });
        terakhirTampil = daftar;

        tampilanDaftar.querySelector("[data-jumlah]").textContent = daftar.length;
        pesanKosong.hidden = daftar.length > 0;
        pesanKosong.textContent = (kata || (opsi.filter && daftar.length === 0 && dataDaftar().length > 0))
            ? "Tidak ada data yang cocok dengan pencarian atau filter."
            : (opsi.pesanKosong || "Belum ada data.");

        // Penanda urutan pada judul kolom (juga dibaca pembaca layar lewat aria-sort)
        kepalaTabel.querySelectorAll("th").forEach(function (th) {
            th.setAttribute("aria-sort", th.dataset.kolom === k
                ? (urutan.arah === 1 ? "ascending" : "descending") : "none");
            th.hidden = !!kolomSembunyi[th.dataset.kolom];
        });

        badanTabel.textContent = "";
        daftar.forEach(function (item) {
            var baris = document.createElement("tr");
            baris.tabIndex = 0;            // agar bisa dicapai dengan tombol Tab
            // Baris hanya bisa diklik (untuk dibuka di formulir) kalau halaman punya formulir
            var bisaDiklik = !opsi.hanyaDaftar || !!opsi.detail || !!opsi.saatKlikBaris;
            baris.className = bisaDiklik ? "baris-data" : "";
            baris.title = !bisaDiklik ? "" : (opsi.hanyaDaftar ? "Klik untuk melihat rincian" : "Klik untuk membuka dan mengubah");
            opsi.kolom.forEach(function (kolom) {
                var sel = document.createElement("td");
                sel.textContent = nilaiKolom(item, kolom);   // textContent: aman dari kode HTML
                sel.hidden = !!kolomSembunyi[kolom.kunci];
                // Kolom angka boleh rata kanan (rata: "kanan") dan menambah kelas gaya per baris
                // (kelasSel: fungsi yang mengembalikan nama kelas, misalnya "angka-negatif" untuk angka merah)
                if (kolom.rata === "kanan") { sel.classList.add("sel-kanan"); }
                if (kolom.kelasSel) {
                    var kelasTambahan = kolom.kelasSel(item);
                    if (kelasTambahan) { sel.classList.add(kelasTambahan); }
                }
                // Kolom boleh menggambar isinya sendiri (misalnya bar Capaian); teks di atas tetap jadi dasar cari/urut/CSV
                if (kolom.gambarSel) { kolom.gambarSel(sel, item); }
                baris.appendChild(sel);
            });
            // Klik baris: halaman berformulir membuka formulir; halaman hanya-daftar membuka rincian (kalau ada)
            var saatKlik = !opsi.hanyaDaftar
                ? function () { modul.bukaUbah(item); }
                : (opsi.saatKlikBaris ? function () { opsi.saatKlikBaris(item); }
                    : (opsi.detail ? function () { modul.bukaDetail(item); } : null));
            if (saatKlik) {
                baris.addEventListener("click", saatKlik);
            }
            baris.addEventListener("keydown", function (kejadian) {
                if (kejadian.key === "Enter" && saatKlik) { saatKlik(); }
            });
            badanTabel.appendChild(baris);
        });
    };

    // ----- Ekspor dan cetak -----
    function unduhDaftarCsv() {
        var kolom = kolomTampilDaftar();
        var baris = [kolom.map(function (k) { return k.judul; })];
        terakhirTampil.forEach(function (item) {
            baris.push(kolom.map(function (k) { return nilaiKolom(item, k); }));
        });
        unduhCsv(opsi.id + ".csv", baris);
        tampilkanNotifikasi("Daftar " + opsi.judul + " telah diunduh");
    }

    // Cetak: PDF berisi semua baris yang sedang tampil, seperti Unduh CSV (umum/pdf-tabel.js, umum/halaman-pdf.js)
    function cetakDaftar() {
        var judul = "Daftar " + opsi.judul;
        var kolom = kolomTampilDaftar();
        bukaPdfCetak(function () {
            return susunPdfDaftar(judul, kolom.map(function (k) { return k.judul; }), terakhirTampil.map(function (item) {
                return kolom.map(function (k) { return teksAman(nilaiKolom(item, k)); });
            }));
        }, judul, namaBerkasPdf(judul));
    }

    // ----- Sambungkan semua tombol -----
    tombolDaftar.addEventListener("click", function () {
        if (tampilanForm.hidden) {
            // Sedang di daftar -> kembali ke tab yang terakhir dibuka; tanpa tab, buka Data Baru
            var t = tabAktif || tabDokumen[0];
            if (t) { aktifkanTab(t); } else { modul.bukaBaru(); }
        } else {
            modul.gambarTabel();
            modul.tampilkan("daftar");  // sedang di formulir -> ke daftar
        }
    });

    var tombolBaru = tampilanDaftar.querySelector("[data-alat='baru']");
    if (tombolBaru) { tombolBaru.addEventListener("click", modul.bukaBaru); }
    // Segarkan: baca ulang data tabel, dan beri kesempatan halaman memuat ulang isinya sendiri
    modul.segarkan = function () {
        modul.gambarTabel();
        if (opsi.saatTampil) { opsi.saatTampil((tampilanForm && !tampilanForm.hidden) ? "form" : "daftar"); }
    };
    tampilanDaftar.querySelector("[data-alat='segarkan']").addEventListener("click", function () {
        modul.segarkan();
        tampilkanNotifikasi("Daftar " + opsi.judul + " telah disegarkan");
    });
    tampilanDaftar.querySelector("[data-alat='ekspor']").addEventListener("click", unduhDaftarCsv);
    tampilanDaftar.querySelector("[data-alat='cetak']").addEventListener("click", cetakDaftar);
    kolomCari.addEventListener("input", function () {
        kataCari = kolomCari.value.trim();
        modul.gambarTabel();
    });

    // Tombol Hapus di formulir (kalau ada): hapus data yang sedang diubah
    var tombolHapusForm = seksi.querySelector("[data-aksi='hapus']");
    if (tombolHapusForm) {
        tombolHapusForm.addEventListener("click", function () {
            var item = modul.ambil().find(function (d) { return d.id === modul.idDiubah; });
            if (item) { modul.hapus(item); }
        });
    }

    modul.gambarTabel();
    // Halaman berformulir dibuka dengan satu tab Data Baru. Isian awalnya BELUM dicatat (sidikAwal null = belum dianggap
    // berubah): isiForm halaman belum siap dipanggil di sini, dan isian lain (pilihan Kas/Bank, tanggal) baru disiapkan
    // skrip sesudahnya. Catatan dimulai saat formulir pertama kali dikosongkan lewat bukaBaru (misalnya dibuka dari menu).
    if (!opsi.hanyaDaftar) {
        var tabAwal = { kunci: "baru", keadaan: null, sidikAwal: null, el: null, awal: null };
        tabDokumen.push(tabAwal);
        gambarTabDokumen(tabAwal, "Data Baru");
        tabAktif = tabAwal;
    }
    modul.tampilkan(opsi.hanyaDaftar ? "daftar" : "form");
    return modul;
}
