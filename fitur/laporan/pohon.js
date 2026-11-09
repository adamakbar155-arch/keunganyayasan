// ==================== Laporan: pohon akun dan tabel laporan ====================
// Alat bersama laporan ringkasan (PRD 7; tugas I.1g-3):
//   angkaLaporan(n)     : angka gaya laporan keuangan: 0 ditulis "-", minus dalam kurung, ribuan sesuai Preferensi
//   susunBarisAkun(o)   : baris akun bertingkat satu bagian (misalnya PENERIMAAN), mengikuti kotak centang Parameter
//   buatTabelLaporan(o) : tabel kertas laporan dengan garis akuntansi baku
// Dipakai laporannya masing-masing (Penghasilan Komprehensif, Posisi Keuangan, ...), lalu hasil tabelnya dipasang di
// kertas (tampilkanKertasLaporan, fitur/laporan/kertas.js). Gaya: fitur/laporan/laporan.css (.lap-tabel).

// 1234567 -> "1.234.567"; -1500000 -> "(1.500.000)"; 0 -> "-"
function angkaLaporan(n) {
    var angka = Number(n) || 0;
    if (Math.abs(angka) < 0.005) { return "-"; }   // nol (juga -0 dan sisa pecahan sangat kecil) ditulis "-"
    return angka < 0 ? "(" + formatAngka(-angka) + ")" : formatAngka(angka);
}

// Baris akun satu bagian laporan (PRD 7, arti kotak centang disetujui 2026-11-03):
//   o.akun   : semua akun (bacaDaftarAkun())
//   o.masuk  : function (akun) -> true kalau akun itu termasuk bagian ini (misalnya tipe pendapatan)
//   o.nilai  : function (akunId) -> [angka per kolom] milik akun itu sendiri (tanpa sub akunnya)
//   o.kolom  : jumlah kolom angka
//   o.param  : { hanyaTotal, akunInduk, akunAnak } dari Parameter Laporan
//   o.lewati : (boleh kosong) function (akun) -> true kalau akun TERATAS itu tidak ditulis karena sama dengan judul
//              bagian (misalnya akun "Pendapatan" di bagian PENERIMAAN); isinya langsung tampil sebagai kelompok teratas
//   o.indukBerangka : (boleh kosong) true = baris induk langsung berisi jumlahnya, tanpa baris "Jumlah <induk>"
//              (seperti foto Laba/Rugi Departemen Accurate)
// Mengembalikan { baris, total }:
//   baris : [{ jenis: "judul" (nama induk, tanpa angka) | "akun" | "jumlah", nama, tingkat, nilai }]
//   total : [angka per kolom] jumlah seluruh bagian (selalu dihitung, juga kalau barisnya disembunyikan)
// Akun yang 0 di semua kolom disembunyikan (beserta induk yang seluruh isinya 0). Baris "Jumlah <induk>" hanya kalau
// isi induk itu 2 baris atau lebih, supaya angka yang sama tidak diulang (PRD 7, "Pilihan 1 ringkas bertingkat").
function susunBarisAkun(o) {
    var dalamBagian = o.akun.filter(function (a) { return a && o.masuk(a); });
    var perId = {};
    dalamBagian.forEach(function (a) { perId[a.id] = a; });
    var anakDari = {};
    dalamBagian.forEach(function (a) {
        var induk = perId[a.indukId] ? a.indukId : "";   // induk di luar bagian ini = akun teratas bagian ini
        (anakDari[induk] = anakDari[induk] || []).push(a);
    });
    Object.keys(anakDari).forEach(function (k) { anakDari[k].sort(urutKodeAkun); });

    function nol() { var n = []; for (var i = 0; i < o.kolom; i++) { n.push(0); } return n; }
    function tambah(a, b) { return a.map(function (x, i) { return x + (Number(b[i]) || 0); }); }
    function adaAngka(n) { return n.some(function (x) { return Math.abs(x) >= 0.005; }); }
    function milik(a) { var n = o.nilai(a.id); return tambah(nol(), Array.isArray(n) ? n : []); }

    // Simpul pohon: akun, nilai miliknya, jumlah (miliknya + semua sub akun), dan anak. Batas kedalaman dan tanda
    // "sudah dikunjungi" menjaga data rusak (induk berputar) tidak membuat macet.
    var dikunjungi = {};
    function simpul(a, dalam) {
        dikunjungi[a.id] = true;
        var anak = dalam < 20 ? (anakDari[a.id] || []).filter(function (x) { return !dikunjungi[x.id]; }).map(function (x) { return simpul(x, dalam + 1); }) : [];
        var sendiri = milik(a);
        var jumlah = anak.reduce(function (t, s) { return tambah(t, s.jumlah); }, sendiri);
        return { akun: a, sendiri: sendiri, jumlah: jumlah, anak: anak };
    }
    var akar = (anakDari[""] || []).map(function (a) { return simpul(a, 0); });
    var total = akar.reduce(function (t, s) { return tambah(t, s.jumlah); }, nol());

    // Kelompok teratas yang ditulis: akun teratas yang dilewati diganti isinya (angka miliknya sendiri, kalau ada,
    // tetap tampil sebagai satu baris supaya total tetap terbaca dari baris-barisnya)
    var teratas = [];
    akar.forEach(function (s) {
        if (!(o.lewati && o.lewati(s.akun))) { teratas.push(s); return; }
        if (adaAngka(s.sendiri)) { teratas.push({ akun: s.akun, sendiri: s.sendiri, jumlah: s.sendiri, anak: [] }); }
        teratas = teratas.concat(s.anak);
    });

    var baris = [];
    var p = o.param || {};
    var induk = p.akunInduk !== false, anak = p.akunAnak !== false;
    // akunIds pada baris: id akun di balik angka itu, untuk klik baris (fitur/laporan/rincian-baris.js)
    function idSimpul(s) {
        return s.anak.reduce(function (d, c) { return d.concat(idSimpul(c)); }, [teksAman(s.akun.id)]);
    }
    var semuaId = akar.reduce(function (d, s) { return d.concat(idSimpul(s)); }, []);
    if (p.hanyaTotal === true || (!induk && !anak)) { return { baris: baris, total: total, akunIds: semuaId }; }

    function namaAkun(a) { return teksAman(a.nama); }
    // Induk + Anak: judul induk, isi menjorok, lalu "Jumlah <induk>" (hanya kalau isinya 2 baris atau lebih)
    function lengkap(s, tingkat) {
        if (!adaAngka(s.jumlah)) { return; }
        var id = idSimpul(s);
        if (s.anak.length === 0) { baris.push({ jenis: "akun", nama: namaAkun(s.akun), tingkat: tingkat, nilai: s.jumlah, akunIds: id }); return; }
        baris.push({ jenis: "judul", nama: namaAkun(s.akun), tingkat: tingkat, nilai: o.indukBerangka ? s.jumlah : null, akunIds: id });
        var isi = 0;
        // Akun induk yang punya angka sendiri (data lama, sebelum ia punya sub akun) tampil sebagai baris pertamanya
        if (adaAngka(s.sendiri)) { baris.push({ jenis: "akun", nama: namaAkun(s.akun), tingkat: tingkat + 1, nilai: s.sendiri, akunIds: [teksAman(s.akun.id)] }); isi++; }
        s.anak.forEach(function (c) { if (adaAngka(c.jumlah)) { isi++; } lengkap(c, tingkat + 1); });
        if (isi >= 2 && !o.indukBerangka) { baris.push({ jenis: "jumlah", nama: "Jumlah " + namaAkun(s.akun), tingkat: tingkat, nilai: s.jumlah, akunIds: id }); }
    }
    // Hanya Anak: akun paling bawah (dan angka milik induk), rata kiri tanpa judul dan Jumlah
    function datar(s) {
        if (!adaAngka(s.jumlah)) { return; }
        if (s.anak.length === 0 || adaAngka(s.sendiri)) {
            baris.push({ jenis: "akun", nama: namaAkun(s.akun), tingkat: 0, nilai: s.anak.length ? s.sendiri : s.jumlah, akunIds: [teksAman(s.akun.id)] });
        }
        s.anak.forEach(datar);
    }
    teratas.forEach(function (s) {
        if (induk && anak) { lengkap(s, 0); }
        else if (induk) { if (adaAngka(s.jumlah)) { baris.push({ jenis: "akun", nama: namaAkun(s.akun), tingkat: 0, nilai: s.jumlah, akunIds: idSimpul(s) }); } }
        else { datar(s); }
    });
    return { baris: baris, total: total, akunIds: semuaId };
}

// Kolom Data di jendela Modifikasi (fitur/laporan/modifikasi.js). kolomSembunyiLaporan diisi kertas.js sebelum laporan
// digambar; kedua pembuat tabel mencatat semua kolomnya dan membuang kolom yang disembunyikan. Kolom pertama tidak ikut
// dibuang, supaya tulisan Total punya tempat.
var kolomSembunyiLaporan = [];   // judul kolom yang disembunyikan pada laporan ini
var kolomLengkapLaporan = [];    // [{ judul, kunci }] semua kolom laporan yang terakhir digambar; kunci = selalu tampil

// Nomor kolom yang tetap tampil dari daftar judul
function nomorKolomTampil(judul, mulai) {
    var hasil = [];
    judul.forEach(function (j, i) { if (i < mulai || kolomSembunyiLaporan.indexOf(j) === -1) { hasil.push(i); } });
    return hasil;
}

// Baris tabel yang bisa diklik dan dibuka dengan Enter
function pasangKlikBarisLaporan(tr, aksi) {
    tr.classList.add("lap-klik");
    tr.tabIndex = 0;
    tr.addEventListener("click", aksi);
    tr.addEventListener("keydown", function (k) { if (k.key === "Enter") { aksi(); } });
}

function kelasKolomRincian(k) {
    return k.angka ? "lap-n" : (k.rapat ? "lap-rapat" : "");
}

// Lebar kolom tetap supaya tabel rapi seperti Accurate. lebar = [piksel per kolom yang tampil].
// Tabel selebar jumlah kolomnya dan berada di tengah kertas, jadi kalau kolom dikurangi (Kolom Data) tabel ikut menyempit.
// Lebar kolom ditulis dalam persen supaya tetap sebanding kalau kertasnya lebih sempit (max-width di laporan.css).
var JARAK_KOLOM_LAPORAN = 12;   // sama dengan border-spacing .lap-tabel di laporan.css
function aturLebarTabel(tabel, lebar) {
    var jumlah = lebar.reduce(function (n, x) { return n + x; }, 0);
    var kolom = document.createElement("colgroup");
    lebar.forEach(function (x) {
        var c = document.createElement("col");
        c.style.width = (x / jumlah * 100) + "%";
        kolom.appendChild(c);
    });
    tabel.insertBefore(kolom, tabel.firstChild);
    tabel.style.setProperty("--lebar-tabel", (jumlah + (lebar.length + 1) * JARAK_KOLOM_LAPORAN) + "px");
}

// Lebar kolom teks panjang (tanpa lebar sendiri, misalnya Keterangan): makin sedikit kolom yang tampil, makin lega,
// tetapi tidak melar sampai tepi kertas
function lebarKolomLentur(jumlahTampil) {
    return jumlahTampil <= 4 ? 320 : (jumlahTampil <= 6 ? 260 : 190);
}

// Tabel rincian (laporan berisi daftar transaksi atau daftar akun).
//   o.kolom : [{ judul, lebar: piksel (kosong = kolom teks panjang, lihat lebarKolomLentur), angka: true kalau kolom angka (rata kanan),
//               rapat: true kalau isinya tidak boleh terlipat (Tanggal, No Bukti, Kode) }]
//   o.baris : [{ sel: [teks atau angka per kolom], jenis: (boleh kosong) "grup" | "jumlah" | "akhir", saatKlik: (boleh kosong) fungsi }]
//             Kolom angka diisi angka biasa (ditulis lewat angkaLaporan). Baris "grup": satu sel merentang semua kolom.
//             Baris "jumlah"/"akhir": tulisan di sel pertama merentang di atas sel kosong sesudahnya, supaya tulisan
//             seperti "Jumlah Hamba Allah" tidak melebarkan kolom Tanggal.
// Baris yang punya saatKlik bisa diklik dan dibuka dengan Enter. Semua teks lewat textContent.
function buatTabelRincian(pilihan) {
    // Tabel di popup (tanpaKolomData) tidak ikut Kolom Data milik laporan
    if (!pilihan.tanpaKolomData) { kolomLengkapLaporan = pilihan.kolom.map(function (k, i) { return { judul: k.judul, kunci: i === 0 }; }); }
    var judulKolom = pilihan.kolom.map(function (k) { return k.judul; });
    var tampil = pilihan.tanpaKolomData ? judulKolom.map(function (j, i) { return i; }) : nomorKolomTampil(judulKolom, 1);
    var o = {
        kolom: tampil.map(function (i) { return pilihan.kolom[i]; }),
        baris: pilihan.baris.map(function (b) {
            if (b.jenis === "grup") { return b; }
            return Object.assign({}, b, { sel: tampil.map(function (i) { return b.sel[i]; }) });
        })
    };
    var tabel = document.createElement("table");
    var berkelompok = o.baris.some(function (b) { return b.jenis === "grup"; });
    tabel.className = "lap-tabel lap-rincian" + (berkelompok ? " lap-berkelompok" : "");
    var kepala = tabel.createTHead().insertRow();
    o.kolom.forEach(function (k) {
        var th = document.createElement("th");
        th.scope = "col";
        th.textContent = k.judul;
        th.className = kelasKolomRincian(k);
        kepala.appendChild(th);
    });
    var badan = tabel.createTBody();
    o.baris.forEach(function (b) {
        var tr = badan.insertRow();
        if (b.jenis) { tr.className = "lap-b-" + (b.jenis === "grup" ? "bagian" : b.jenis); }
        if (b.jenis === "grup") {
            var sel = tr.insertCell();
            sel.colSpan = o.kolom.length;
            sel.textContent = b.sel[0];
            return;
        }
        var rentang = 1;
        if ((b.jenis === "jumlah" || b.jenis === "akhir") && b.sel[0] !== "") {
            while (rentang < o.kolom.length && (b.sel[rentang] === "" || b.sel[rentang] === undefined)) { rentang++; }
        }
        o.kolom.forEach(function (k, i) {
            if (i > 0 && i < rentang) { return; }   // sudah tercakup sel pertama yang merentang
            var td = tr.insertCell();
            var nilai = b.sel[i];
            td.className = kelasKolomRincian(k);
            if (i === 0 && rentang > 1) { td.colSpan = rentang; td.className = ""; }
            var adaAngka = k.angka && nilai !== "" && nilai !== undefined;
            td.textContent = adaAngka ? angkaLaporan(nilai) : teksAman(nilai);
            if (adaAngka) { td.dataset.angka = Number(nilai) || 0; }   // angka asli untuk unduhan Excel
        });
        if (b.saatKlik) { pasangKlikBarisLaporan(tr, b.saatKlik); }
    });
    aturLebarTabel(tabel, o.kolom.map(function (k) { return k.lebar || lebarKolomLentur(o.kolom.length); }));
    return tabel;
}

// Tabel kertas laporan.
//   o.kolom : judul kolom angka, misalnya ["Dengan pembatasan", "Tanpa pembatasan", "Jumlah"]
//   o.baris : [{ jenis, nama, tingkat, nilai }]. jenis:
//             "bagian" (judul bagian, huruf besar, tanpa angka) | "judul" | "akun" | "jumlah" (garis tipis di atas angka) |
//             "total" (garis tegas di atas angka, tebal) | "akhir" (garis di atas + garis dobel di bawah, tebal)
// Semua teks lewat textContent (nama akun adalah isian pengguna).
function buatTabelLaporan(pilihan) {
    kolomLengkapLaporan = [{ judul: "Keterangan", kunci: true }].concat(pilihan.kolom.map(function (j) { return { judul: j, kunci: false }; }));
    var tampil = nomorKolomTampil(pilihan.kolom, 0);
    var o = {
        kolom: tampil.map(function (i) { return pilihan.kolom[i]; }),
        baris: pilihan.baris.map(function (b) {
            return b.nilai ? Object.assign({}, b, { nilai: tampil.map(function (i) { return b.nilai[i]; }) }) : b;
        })
    };
    var tabel = document.createElement("table");
    tabel.className = "lap-tabel";
    var kepala = tabel.createTHead().insertRow();
    ["Keterangan"].concat(o.kolom).forEach(function (judul, i) {
        var th = document.createElement("th");
        th.scope = "col";
        th.textContent = judul;
        if (i > 0) { th.className = "lap-n lap-n-judul"; }   // judul kolom angka rata kanan, sejajar angkanya
        kepala.appendChild(th);
    });
    var badan = tabel.createTBody();
    o.baris.forEach(function (b) {
        var tr = badan.insertRow();
        tr.className = "lap-b-" + b.jenis;
        var nama = tr.insertCell();
        nama.textContent = b.nama;
        // Baris akun menjorok dari judul bagian, makin dalam makin menjorok (style lewat JavaScript diizinkan CSP;
        // atribut style di HTML tidak). Bagian, total, dan akhir rata kiri.
        if (b.jenis === "judul" || b.jenis === "akun" || b.jenis === "jumlah") { nama.style.paddingLeft = (14 + (b.tingkat || 0) * 16) + "px"; }
        o.kolom.forEach(function (k, i) {
            var td = tr.insertCell();
            td.className = "lap-n";
            // formatKolom (boleh kosong): { nomor kolom: function (angka) -> teks }, untuk kolom selain Rupiah
            var format = (pilihan.formatKolom && pilihan.formatKolom[tampil[i]]) || angkaLaporan;
            td.textContent = b.nilai ? format(b.nilai[i]) : "";
            if (b.nilai) { td.dataset.angka = Number(b.nilai[i]) || 0; }   // angka asli untuk unduhan Excel
        });
        // Baris akun (akunIds) atau baris bersaringan sendiri (saring): klik menampilkan transaksinya (rincian-baris.js)
        var saring = b.saring || (b.akunIds ? function (r) { return b.akunIds.indexOf(teksAman(r.akunId)) !== -1; } : null);
        if (saring) { pasangKlikBarisLaporan(tr, function () { bukaRincianBaris(b.nama, saring); }); }
    });
    // Kolom Keterangan lebih lebar kalau kolom angkanya sedikit, supaya tabel tetap sebanding di kertas
    var n = o.kolom.length;
    aturLebarTabel(tabel, [n <= 1 ? 420 : (n === 2 ? 360 : 290)].concat(o.kolom.map(function () { return 118; })));
    return tabel;
}
