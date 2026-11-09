// ==================== Dashboard ====================
// Widget berwarna dari data asli (PRD 6.7), memakai alat yang sama dengan laporan supaya angkanya sama. Pengguna memilih widget dan
// urutannya lewat tombol + Widget, dan memilih bulan lewat tombol ‹ ›. Dimuat PALING AKHIR, karena memakai alat dari hampir semua fitur.
// Satu widget di WIDGET_DASHBOARD: { id (tetap, tersimpan), judul, keterangan (di popup), lebar (1 | 2 | 3), bawaan (tampil awal), kartu (tanpa bingkai),
//   gambar(wadah): mengisi widget, buka(): (boleh kosong) halaman yang dibuka saat judul diklik }
// Pengaturan (kunci widgetDashboard): { urutan: [id], tampil: { id: true/false } }. Isian pengguna selalu lewat textContent.
// Warna grafik lolos uji buta warna dengan urutan WARNA_GRAFIK; warna tidak berdiri sendiri, nama dan angka selalu tertulis.
// HTML: fitur/dashboard/tampilan.js. Gaya: fitur/dashboard/dashboard.css.

var KUNCI_WIDGET_DASHBOARD = "widgetDashboard";
jenisKunciCadangan[KUNCI_WIDGET_DASHBOARD] = "objek";   // ikut Cadangan Data
var NAMA_BULAN_GRAFIK = ["Jan", "Feb", "Mar", "Apr", "Mei", "Jun", "Jul", "Agu", "Sep", "Okt", "Nov", "Des"];
var WARNA_GRAFIK = ["#0d9488", "#d97706", "#2563eb", "#e11d74"];
var WARNA_DONASI = "#0d9488", WARNA_KELUAR = "#e11d74", WARNA_LAINNYA = "#94a3b8", WARNA_DASAR = "#edf1f7", WARNA_GARIS = "#e8edf4", WARNA_TEKS = "#0b2a5b", WARNA_REDUP = "#5b687c";
var NS_SVG = "http://www.w3.org/2000/svg";
var geserBulanDashboard = 0;   // 0 = bulan ini, -1 = bulan lalu, dan seterusnya. Tidak disimpan.

function buatEl(tag, kelas, teks) {
    var el = document.createElement(tag);
    if (kelas) { el.className = kelas; }
    if (teks !== undefined) { el.textContent = teks; }   // textContent: aman dari kode HTML
    return el;
}

function buatSvg(tag, atribut, teks) {
    var el = document.createElementNS(NS_SVG, tag);
    Object.keys(atribut || {}).forEach(function (k) { el.setAttribute(k, atribut[k]); });
    if (teks !== undefined) { el.textContent = teks; }
    return el;
}

// "1,2 jt": angka pendek untuk ruang sempit; nilai lengkapnya ada di laporan
function angkaRingkas(n) {
    var m = Math.abs(Number(n) || 0), tanda = n < 0 ? "-" : "";
    function satuDesimal(x) { return String(Math.round(x * 10) / 10).replace(".", ","); }
    if (m >= 1e9) { return tanda + satuDesimal(m / 1e9) + " M"; }
    if (m >= 1e6) { return tanda + satuDesimal(m / 1e6) + " jt"; }
    if (m >= 1e3) { return tanda + satuDesimal(m / 1e3) + " rb"; }
    return tanda + m;
}
function rupiahRingkas(n) { return "Rp " + angkaRingkas(n); }

function pesanWidget(wadah, teks) {
    wadah.classList.add("widget-kosong");
    wadah.appendChild(buatEl("p", "isi-menyusul", teks));
}

function barisTeksWidget(wadah, kiri, kanan, kelasKanan) {
    var b = buatEl("div", "widget-baris");
    b.appendChild(buatEl("span", "", kiri));
    b.appendChild(buatEl("span", kelasKanan || "", kanan));
    wadah.appendChild(b);
}

// Lingkaran. segmen = [{ persen, warna }]; pusat dan sub = tulisan di tengah
function buatLingkaran(segmen, ukuran, pusat, sub, tebal) {
    var r = ukuran / 2 - tebal / 2 - 2, keliling = 2 * Math.PI * r, tengah = ukuran / 2, awal = 0;
    var svg = buatSvg("svg", { width: ukuran, height: ukuran, viewBox: "0 0 " + ukuran + " " + ukuran, role: "img", "aria-label": pusat + (sub ? " " + sub : "") });
    svg.appendChild(buatSvg("circle", { cx: tengah, cy: tengah, r: r, fill: "none", stroke: WARNA_DASAR, "stroke-width": tebal }));
    segmen.forEach(function (s) {
        var panjang = Math.max(0, Math.min(100, s.persen)) / 100 * keliling;
        svg.appendChild(buatSvg("circle", {
            cx: tengah, cy: tengah, r: r, fill: "none", stroke: s.warna, "stroke-width": tebal,
            "stroke-dasharray": Math.max(panjang - (segmen.length > 1 ? 2 : 0), 0) + " " + keliling, "stroke-dashoffset": -awal,
            transform: "rotate(-90 " + tengah + " " + tengah + ")"
        }));
        awal += panjang;
    });
    var besar = ukuran > 100;
    svg.appendChild(buatSvg("text", { x: "50%", y: sub ? "47%" : "54%", "text-anchor": "middle", "font-size": besar ? 20 : 14, "font-weight": 700, fill: WARNA_TEKS }, pusat));
    if (sub) { svg.appendChild(buatSvg("text", { x: "50%", y: "63%", "text-anchor": "middle", "font-size": 10.5, fill: WARNA_REDUP }, sub)); }
    return svg;
}

// Garis melengkung lewat titik-titik, tanpa melewati nilai puncaknya
function jalurHalus(titik) {
    return titik.reduce(function (d, t, i) {
        if (i === 0) { return "M" + t[0] + " " + t[1]; }
        var p = titik[i - 1], c = (p[0] + t[0]) / 2;
        return d + " C" + c + " " + p[1] + " " + c + " " + t[1] + " " + t[0] + " " + t[1];
    }, "");
}

// ----- Periode dan angka bersama -----
function teksBulanIso(tahun, bulan) { return tahun + "-" + String(bulan).padStart(2, "0"); }

function geserBulanIso(iso, jumlah) {
    var d = new Date(Number(iso.slice(0, 4)), Number(iso.slice(5, 7)) - 1 + jumlah, 1);
    return teksBulanIso(d.getFullYear(), d.getMonth() + 1);
}

// Bulan yang dipilih dengan tombol ‹ ›. akhir = hari ini kalau bulan berjalan, selain itu akhir bulan.
function periodeDashboard() {
    var hari = tanggalHariIni();
    var bulan = geserBulanIso(hari.slice(0, 7), geserBulanDashboard);
    return { bulan: bulan, tahun: bulan.slice(0, 4), nomorBulan: Number(bulan.slice(5, 7)), akhir: geserBulanDashboard === 0 ? hari : akhirBulanAset(bulan) };
}

// { "2026-11": { donasi, keluar } } dari semua jurnal. Donasi = pendapatan, keluar = beban (PRD 6.7).
function ringkasanPerBulan() {
    var peta = Object.create(null);
    telusuriJurnalLaporan({ perId: petaAkunLaporan(bacaDaftarAkun()) }, function (r, akun, j, tanggal) {
        var kunci = tanggal.slice(0, 7);
        if (!peta[kunci]) { peta[kunci] = { donasi: 0, keluar: 0 }; }
        if (TIPE_PENERIMAAN_LPK[akun.tipe]) { peta[kunci].donasi += selisihKreditDebit(r); }
        if (TIPE_BEBAN_LPK[akun.tipe]) { peta[kunci].keluar -= selisihKreditDebit(r); }
    });
    return peta;
}
function angkaBulan(peta, bulan) { return peta[bulan] || { donasi: 0, keluar: 0 }; }

// Saldo semua akun Kas & Bank sampai tanggal itu
function saldoKasBankPer(tanggal) {
    var perId = petaAkunLaporan(bacaDaftarAkun());
    var saldo = saldoAkunPer(tanggal, perId);
    return Object.keys(perId).reduce(function (n, id) { return perId[id].tipe === "kas-bank" ? n + (saldo[id] || 0) : n; }, 0);
}

function barisDonasiTahunIni() {
    var tahun = periodeDashboard().tahun;
    return barisDonasiLaporan({ dari: tahun + "-01-01", sampai: tahun + "-12-31", divisi: [], program: [] });
}

// Hari-hari menjelang tanggal akhir: ["2026-11-01", ...]
function daftarHariSampai(akhir, jumlah) {
    var hasil = [], b = akhir.split("-");
    for (var i = jumlah - 1; i >= 0; i--) {
        var d = new Date(Number(b[0]), Number(b[1]) - 1, Number(b[2]) - i);
        hasil.push(d.getFullYear() + "-" + String(d.getMonth() + 1).padStart(2, "0") + "-" + String(d.getDate()).padStart(2, "0"));
    }
    return hasil;
}
function teksHariPendek(iso) { return Number(iso.slice(8, 10)) + " " + NAMA_BULAN_GRAFIK[Number(iso.slice(5, 7)) - 1]; }

// ----- Kartu warna di atas -----
function gelombangKartu(nilai) {
    var terbesar = Math.max.apply(null, nilai.concat([1])), terkecil = Math.min.apply(null, nilai.concat([0]));
    var rentang = terbesar - terkecil || 1;
    var titik = nilai.map(function (v, i) { return [i / (nilai.length - 1) * 300, 56 - (v - terkecil) / rentang * 46]; });
    var svg = buatSvg("svg", { viewBox: "0 0 300 60", preserveAspectRatio: "none", "aria-hidden": "true" });
    svg.appendChild(buatSvg("path", { d: jalurHalus(titik) + " L300 60 L0 60Z", fill: "#fff", "fill-opacity": 0.28 }));
    svg.appendChild(buatSvg("path", { d: jalurHalus(titik), fill: "none", stroke: "#fff", "stroke-width": 2 }));
    return svg;
}

function teksBanding(sekarang, lalu, namaBulanLalu) {
    if (!(lalu > 0)) { return "Belum ada pembanding"; }
    var persen = Math.round(Math.abs(sekarang - lalu) / lalu * 100);
    return (sekarang >= lalu ? "▲ " : "▼ ") + persen + "% dari " + namaBulanLalu;
}

function gambarRingkasanDashboard(wadah) {
    var p = periodeDashboard(), peta = ringkasanPerBulan();
    var ini = angkaBulan(peta, p.bulan), lalu = angkaBulan(peta, geserBulanIso(p.bulan, -1));
    var namaLalu = namaBulanKalender[Number(geserBulanIso(p.bulan, -1).slice(5, 7)) - 1];
    var bulanTren = [];
    for (var i = 7; i >= 0; i--) { bulanTren.push(geserBulanIso(p.bulan, -i)); }
    var selisih = ini.donasi - ini.keluar;
    var rekening = akunKasBankPilihan().length;
    [
        { kelas: "dash-biru", judul: "Kas dan Bank", nilai: saldoKasBankPer(p.akhir), catatan: rekening + " rekening",
          tren: bulanTren.map(function (b) { return saldoKasBankPer(akhirBulanAset(b)); }) },
        { kelas: "dash-hijau", judul: "Donasi bulan ini", nilai: ini.donasi, catatan: teksBanding(ini.donasi, lalu.donasi, namaLalu),
          tren: bulanTren.map(function (b) { return angkaBulan(peta, b).donasi; }) },
        { kelas: "dash-merah", judul: "Pengeluaran bulan ini", nilai: ini.keluar, catatan: teksBanding(ini.keluar, lalu.keluar, namaLalu),
          tren: bulanTren.map(function (b) { return angkaBulan(peta, b).keluar; }) },
        { kelas: "dash-oranye", judul: "Selisih bulan ini", nilai: selisih, catatan: selisih < 0 ? "Defisit" : (selisih > 0 ? "Surplus" : "Seimbang"),
          tren: bulanTren.map(function (b) { var a = angkaBulan(peta, b); return a.donasi - a.keluar; }) }
    ].forEach(function (d) {
        var k = buatEl("div", "dash-kartu " + d.kelas);
        k.appendChild(buatEl("span", "dash-kartu-judul", d.judul));
        k.appendChild(buatEl("strong", "dash-kartu-angka", formatRupiah(d.nilai)));
        k.appendChild(buatEl("em", "dash-kartu-catatan", d.catatan));
        k.appendChild(gelombangKartu(d.tren));
        wadah.appendChild(k);
    });
}

// ----- Widget grafik -----
function barisLegenda(wadah, warna, nama, nilai, lencana, kelasLencana) {
    var b = buatEl("div", "dash-legenda");
    var titik = buatEl("i");
    titik.style.backgroundColor = warna;
    b.appendChild(titik);
    b.appendChild(buatEl("span", "", nama));
    b.appendChild(buatEl("b", "", nilai));
    if (lencana) { b.appendChild(buatEl("em", "dash-lencana " + kelasLencana, lencana)); }
    wadah.appendChild(b);
}

function gambarBandingDashboard(wadah) {
    var p = periodeDashboard(), peta = ringkasanPerBulan();
    var ini = angkaBulan(peta, p.bulan), lalu = angkaBulan(peta, geserBulanIso(p.bulan, -1));
    var jumlah = Math.max(ini.donasi, 0) + Math.max(ini.keluar, 0);
    if (!(jumlah > 0)) { pesanWidget(wadah, "Belum ada donasi atau pengeluaran bulan ini."); return; }
    var kiri = ini.donasi > 0 ? Math.round(ini.keluar / ini.donasi * 100) + "%" : "-";
    var baris = buatEl("div", "dash-susun");
    baris.appendChild(buatLingkaran([
        { persen: Math.max(ini.donasi, 0) / jumlah * 100, warna: WARNA_DONASI },
        { persen: Math.max(ini.keluar, 0) / jumlah * 100, warna: WARNA_KELUAR }
    ], 118, kiri, "terpakai", 13));
    var kanan = buatEl("div", "dash-susun-isi");
    function lencana(n, l) { return l > 0 ? (n >= l ? "▲ " : "▼ ") + Math.round(Math.abs(n - l) / l * 100) + "%" : ""; }
    barisLegenda(kanan, WARNA_DONASI, "Donasi", angkaRingkas(ini.donasi), lencana(ini.donasi, lalu.donasi), ini.donasi >= lalu.donasi ? "baik" : "buruk");
    barisLegenda(kanan, WARNA_KELUAR, "Pengeluaran", angkaRingkas(ini.keluar), lencana(ini.keluar, lalu.keluar), ini.keluar <= lalu.keluar ? "baik" : "buruk");
    var hasil = buatEl("div", "dash-hasil");
    var selisih = ini.donasi - ini.keluar;
    hasil.appendChild(buatEl("span", "", "Selisih"));
    hasil.appendChild(buatEl("b", selisih < 0 ? "teks-lewat" : "", rupiahRingkas(selisih)));
    kanan.appendChild(hasil);
    baris.appendChild(kanan);
    wadah.appendChild(baris);
}

// Perubahan Kas & Bank per hari: { masuk: {tanggal: n}, keluar: {tanggal: n} }. Dihitung per jurnal, jadi Transfer Bank (masuk dan keluar
// dalam satu jurnal) tidak terhitung sebagai uang masuk atau keluar.
function perubahanKasPerHari() {
    var hasil = { masuk: Object.create(null), keluar: Object.create(null) };
    var perId = petaAkunLaporan(bacaDaftarAkun());
    bacaJurnalMentah().forEach(function (j) {
        if (!j) { return; }
        var t = teksAman(j.tanggal);
        var bersih = rincianAman(j).reduce(function (n, r) {
            var a = perId[teksAman(r.akunId)];
            return a && a.tipe === "kas-bank" ? n - selisihKreditDebit(r) : n;
        }, 0);
        if (bersih > 0) { hasil.masuk[t] = (hasil.masuk[t] || 0) + bersih; }
        if (bersih < 0) { hasil.keluar[t] = (hasil.keluar[t] || 0) - bersih; }
    });
    return hasil;
}

function gambarArusDashboard(wadah) {
    var hari = daftarHariSampai(periodeDashboard().akhir, 7), kas = perubahanKasPerHari();
    var masuk = hari.map(function (t) { return kas.masuk[t] || 0; }), keluar = hari.map(function (t) { return kas.keluar[t] || 0; });
    var puncak = Math.max.apply(null, masuk.concat(keluar));
    if (!(puncak > 0)) { pesanWidget(wadah, "Tidak ada uang masuk atau keluar 7 hari ini."); return; }
    var leg = buatEl("div", "grafik-legenda");
    [["Masuk", "#14b8a6"], ["Keluar", "#f472b6"], ["Selisih harian", "#2563eb"]].forEach(function (d) {
        var s = buatEl("span"), i = buatEl("i");
        i.style.backgroundColor = d[1];
        s.appendChild(i);
        s.appendChild(document.createTextNode(d[0]));
        leg.appendChild(s);
    });
    wadah.appendChild(leg);
    var L = 340, T = 158, dasar = 74, tinggi = 62;
    function y(n) { return dasar - n / puncak * tinggi; }
    var svg = buatSvg("svg", { viewBox: "0 0 " + L + " " + T, width: "100%", role: "img", "aria-label": hari.map(function (t, i) { return teksHariPendek(t) + ": masuk " + rupiahRingkas(masuk[i]) + ", keluar " + rupiahRingkas(keluar[i]); }).join("; ") });
    [puncak, 0, -puncak].forEach(function (g) {
        svg.appendChild(buatSvg("line", { x1: 44, x2: L, y1: y(g), y2: y(g), stroke: WARNA_GARIS }));
        svg.appendChild(buatSvg("text", { x: 38, y: y(g) + 4, "text-anchor": "end", "font-size": 10, fill: WARNA_REDUP }, angkaRingkas(g)));
    });
    var titik = [];
    hari.forEach(function (t, i) {
        var x = 62 + i * 43;
        svg.appendChild(buatSvg("rect", { x: x - 11, y: y(masuk[i]), width: 22, height: Math.max(dasar - y(masuk[i]), 0), rx: 4, fill: "#99e6d8" }));
        svg.appendChild(buatSvg("rect", { x: x - 11, y: dasar, width: 22, height: Math.max(y(-keluar[i]) - dasar, 0), rx: 4, fill: "#fbb6d4" }));
        titik.push([x, y(masuk[i] - keluar[i])]);
        svg.appendChild(buatSvg("text", { x: x, y: T - 2, "text-anchor": "middle", "font-size": 10, fill: WARNA_REDUP }, teksHariPendek(t)));
    });
    svg.appendChild(buatSvg("path", { d: jalurHalus(titik), fill: "none", stroke: "#2563eb", "stroke-width": 2.4 }));
    titik.forEach(function (p, i) {
        svg.appendChild(buatSvg("circle", { cx: p[0], cy: p[1], r: 4, fill: "#2563eb", stroke: "#fff", "stroke-width": 2 }));
        // Sasaran kursor lebih besar dari titiknya; tooltip dari elemen title
        var sasaran = buatSvg("rect", { x: p[0] - 22, y: 0, width: 44, height: T, fill: "transparent" });
        sasaran.appendChild(buatSvg("title", {}, teksHariPendek(hari[i]) + "\nMasuk " + formatRupiah(masuk[i]) + "\nKeluar " + formatRupiah(keluar[i])));
        svg.appendChild(sasaran);
    });
    wadah.appendChild(svg);
}

function gambarTrenDashboard(wadah) {
    var hari = daftarHariSampai(periodeDashboard().akhir, 30);
    var perHari = Object.create(null);
    telusuriJurnalLaporan({ perId: petaAkunLaporan(bacaDaftarAkun()), dari: hari[0], sampai: hari[29] }, function (r, akun, j, tanggal) {
        if (TIPE_PENERIMAAN_LPK[akun.tipe]) { perHari[tanggal] = (perHari[tanggal] || 0) + selisihKreditDebit(r); }
    });
    var nilai = hari.map(function (t) { return Math.max(perHari[t] || 0, 0); });
    var puncak = Math.max.apply(null, nilai);
    if (!(puncak > 0)) { pesanWidget(wadah, "Belum ada donasi 30 hari ini."); return; }
    var L = 340, T = 158, bawah = 132, atas = 18, kiri = 34;
    function y(n) { return bawah - n / puncak * (bawah - atas); }
    var titik = nilai.map(function (n, i) { return [kiri + i * (L - kiri - 4) / 29, y(n)]; });
    var svg = buatSvg("svg", { viewBox: "0 0 " + L + " " + T, width: "100%", role: "img", "aria-label": "Donasi 30 hari. Tertinggi " + rupiahRingkas(puncak) });
    var defs = buatSvg("defs"), gradasi = buatSvg("linearGradient", { id: "dash-gradasi-tren", x1: 0, y1: 0, x2: 0, y2: 1 });
    gradasi.appendChild(buatSvg("stop", { offset: 0, "stop-color": WARNA_DONASI, "stop-opacity": 0.32 }));
    gradasi.appendChild(buatSvg("stop", { offset: 1, "stop-color": WARNA_DONASI, "stop-opacity": 0 }));
    defs.appendChild(gradasi);
    svg.appendChild(defs);
    [0, puncak / 2, puncak].forEach(function (g) {
        svg.appendChild(buatSvg("line", { x1: kiri, x2: L, y1: y(g), y2: y(g), stroke: WARNA_GARIS }));
        svg.appendChild(buatSvg("text", { x: kiri - 5, y: y(g) + 4, "text-anchor": "end", "font-size": 10, fill: WARNA_REDUP }, angkaRingkas(g)));
    });
    svg.appendChild(buatSvg("path", { d: jalurHalus(titik) + " L" + titik[29][0] + " " + bawah + " L" + kiri + " " + bawah + "Z", fill: "url(#dash-gradasi-tren)" }));
    svg.appendChild(buatSvg("path", { d: jalurHalus(titik), fill: "none", stroke: WARNA_DONASI, "stroke-width": 2.4 }));
    var iPuncak = nilai.indexOf(puncak);
    svg.appendChild(buatSvg("circle", { cx: titik[iPuncak][0], cy: titik[iPuncak][1], r: 5, fill: WARNA_DONASI, stroke: "#fff", "stroke-width": 2 }));
    svg.appendChild(buatSvg("text", { x: Math.min(Math.max(titik[iPuncak][0], 50), L - 24), y: titik[iPuncak][1] - 8, "text-anchor": "middle", "font-size": 10.5, "font-weight": 700, fill: WARNA_TEKS }, angkaRingkas(puncak)));
    [0, 10, 20, 29].forEach(function (i, n) {
        svg.appendChild(buatSvg("text", { x: titik[i][0], y: T - 4, "text-anchor": n === 0 ? "start" : (n === 3 ? "end" : "middle"), "font-size": 10, fill: WARNA_REDUP }, teksHariPendek(hari[i])));
    });
    titik.forEach(function (p, i) {
        var sasaran = buatSvg("rect", { x: p[0] - 5, y: 0, width: 10, height: bawah, fill: "transparent" });
        sasaran.appendChild(buatSvg("title", {}, teksHariPendek(hari[i]) + ": " + formatRupiah(nilai[i])));
        svg.appendChild(sasaran);
    });
    wadah.appendChild(svg);
}

function gambarGrafikTahun(wadah) {
    var p = periodeDashboard(), peta = ringkasanPerBulan();
    var bulan = NAMA_BULAN_GRAFIK.map(function (n, i) { return angkaBulan(peta, teksBulanIso(p.tahun, i + 1)); });
    var terbesar = bulan.reduce(function (n, b) { return Math.max(n, b.donasi, b.keluar); }, 0);
    if (!(terbesar > 0)) { pesanWidget(wadah, "Belum ada donasi atau pengeluaran tahun ini."); return; }
    var legenda = buatEl("div", "grafik-legenda");
    [["Donasi", WARNA_DONASI], ["Pengeluaran", WARNA_KELUAR]].forEach(function (d) {
        var s = buatEl("span"), i = buatEl("i");
        i.style.backgroundColor = d[1];
        s.appendChild(i);
        s.appendChild(document.createTextNode(d[0]));
        legenda.appendChild(s);
    });
    wadah.appendChild(legenda);
    var grafik = buatEl("div", "grafik-bulan"), sumbu = buatEl("div", "grafik-sumbu");
    grafik.setAttribute("role", "img");
    grafik.setAttribute("aria-label", "Donasi dan pengeluaran per bulan. " + NAMA_BULAN_GRAFIK.map(function (n, i) {
        return n + ": donasi " + rupiahRingkas(bulan[i].donasi) + ", pengeluaran " + rupiahRingkas(bulan[i].keluar);
    }).join("; "));
    NAMA_BULAN_GRAFIK.forEach(function (nama, i) {
        var kolom = buatEl("div", "grafik-kolom");
        kolom.title = nama + "\nDonasi " + formatRupiah(bulan[i].donasi) + "\nPengeluaran " + formatRupiah(bulan[i].keluar);   // tooltip saat kursor di atasnya
        [[bulan[i].donasi, WARNA_DONASI], [bulan[i].keluar, WARNA_KELUAR]].forEach(function (d) {
            var batang = buatEl("b");
            batang.style.height = Math.max(0, d[0]) / terbesar * 100 + "%";
            batang.style.backgroundColor = d[1];
            kolom.appendChild(batang);
        });
        grafik.appendChild(kolom);
        sumbu.appendChild(buatEl("span", "", nama));
    });
    wadah.appendChild(grafik);
    wadah.appendChild(sumbu);
}

// ----- Anggaran dan Perlu Perhatian -----
// Akun beban anggaran Umum satu bulan: [{ akun, rencana, pakai }]
function anggaranBebanBulan(tahun, nomorBulan) {
    var periode = { tipe: "umum", kelompokId: "", bulan: nomorBulan, tahun: Number(tahun) };
    var perId = petaAkunLaporan(bacaDaftarAkun());
    return Object.keys(akunPeriodeAnggaran(periode)).filter(function (id) { return perId[id] && TIPE_BEBAN_LPK[perId[id].tipe]; }).map(function (id) {
        var pos = Object.assign({}, periode, { akunId: id });
        return { akun: perId[id], rencana: rencanaPosAnggaran(pos), pakai: penggunaanPosAnggaran(pos) };
    });
}

// Tiga lingkaran kecil berdampingan. item = { nama, persen, warna, sub }
function barisLingkaran(wadah, item) {
    var grid = buatEl("div", "dash-cincin");
    item.forEach(function (d) {
        var k = buatEl("div");
        k.appendChild(buatLingkaran([{ persen: d.persen, warna: d.warna }], 88, d.persen + "%", "", 11));
        k.appendChild(buatEl("p", "", d.nama));
        k.appendChild(buatEl("small", "", d.sub));
        grid.appendChild(k);
    });
    wadah.appendChild(grid);
}

function gambarAnggaranDashboard(wadah) {
    var p = periodeDashboard();
    var daftar = anggaranBebanBulan(p.tahun, p.nomorBulan).sort(function (a, b) { return b.pakai / (b.rencana || 1) - a.pakai / (a.rencana || 1); });
    if (!daftar.length) { pesanWidget(wadah, "Belum ada anggaran bulan ini."); return; }
    barisLingkaran(wadah, daftar.slice(0, 3).map(function (d) {
        var lewat = d.pakai > d.rencana;
        return {
            nama: teksAman(d.akun.nama), persen: d.rencana > 0 ? Math.round(d.pakai / d.rencana * 100) : 100, warna: lewat ? "#e11d74" : "#2563eb",
            sub: lewat ? "Lewat " + angkaRingkas(d.pakai - d.rencana) : angkaRingkas(d.pakai) + " / " + angkaRingkas(d.rencana)
        };
    }));
}

function gambarTargetDashboard(wadah) {
    var hari = tanggalHariIni();
    var daftar = bacaDaftarTersimpan("daftarTargetDonasi").filter(function (t) { return t && teksAman(t.mulai) <= hari && teksAman(t.selesai) >= hari; });
    if (!daftar.length) { pesanWidget(wadah, "Belum ada target yang sedang berjalan."); return; }
    barisLingkaran(wadah, daftar.slice(0, 3).map(function (t) {
        return { nama: teksAman(t.nama), persen: persenCapaianTd(t), warna: WARNA_DONASI, sub: tercapaiTd(t) ? "Tercapai" : angkaRingkas(terkumpulTargetTd(t)) + " / " + angkaRingkas(t.nilai) };
    }));
}

// Daftar hal yang perlu ditindak, menurut keadaan HARI INI (bukan bulan yang dipilih): [{ teks, warna, ok, buka }]
function daftarPerluPerhatian() {
    var hari = tanggalHariIni(), bulanLalu = geserBulanIso(hari.slice(0, 7), -1), hasil = [];
    var sudahProses = bacaPenyusutan().some(function (x) { return teksAman(x.bulan) === bulanLalu; });
    if (!sudahProses && barisPenyusutanBulan(bulanLalu).length > 0) {
        hasil.push({ teks: "Penyusutan " + teksBulanPny(bulanLalu) + " belum diproses", warna: "kuning", buka: bukaPenyusutanBaru });
    }
    var gajiBelum = modulPgaji.ambil().filter(function (g) { return statusBayarGaji(g).teks !== "Lunas"; }).length;
    if (gajiBelum > 0) { hasil.push({ teks: "Gaji belum lunas: " + gajiBelum + " pencatatan", warna: "kuning", buka: function () { bukaPencatatanGajiBaru(); } }); }
    anggaranBebanBulan(hari.slice(0, 4), Number(hari.slice(5, 7))).forEach(function (d) {
        if (d.pakai > d.rencana) { hasil.push({ teks: "Anggaran " + teksAman(d.akun.nama) + " terlewati " + formatRupiah(d.pakai - d.rencana), warna: "merah", buka: bukaMonitorAnggaran }); }
    });
    var batasMs = 30 * 24 * 3600 * 1000, hariIniMs = new Date(hari).getTime();
    bacaDaftarTersimpan("daftarTargetDonasi").forEach(function (t) {
        if (!t || teksAman(t.mulai) > hari || teksAman(t.selesai) < hari || tercapaiTd(t)) { return; }
        var sisaMs = new Date(teksAman(t.selesai)).getTime() - hariIniMs;
        if (sisaMs <= batasMs) {
            hasil.push({ teks: "Target " + teksAman(t.nama) + " berakhir " + Math.round(sisaMs / 86400000) + " hari lagi, baru " + persenCapaianTd(t) + "%", warna: "biru", buka: function () { bukaTargetDonasiBaru(); } });
        }
    });
    var minus = bacaProgram().filter(function (x) { return sisaDanaProgram(x.id) < 0; }).length;
    if (minus > 0) { hasil.push({ teks: "Program dengan sisa dana minus: " + minus, warna: "merah", buka: function () { bukaLaporanDashboard("sisa-dana-program"); } }); }
    var cocok = cekKecocokanAset();
    if (cocok) {
        var sama = Math.abs(cocok.daftar - cocok.saldo) < 0.005;
        hasil.push({ teks: sama ? "Daftar aset cocok dengan Neraca" : "Daftar aset tidak cocok dengan Neraca", ok: sama, warna: sama ? "hijau" : "kuning", buka: bukaAsetTetapBaru });
    }
    return hasil;
}

function gambarPerhatianDashboard(wadah) {
    var daftar = daftarPerluPerhatian();
    var lencana = wadah.parentNode ? wadah.parentNode.querySelector(".widget-lencana") : null;
    var jumlah = daftar.filter(function (d) { return !d.ok; }).length;
    if (lencana) {
        lencana.hidden = jumlah === 0;
        lencana.textContent = jumlah + " hal";
    }
    if (!daftar.length) { pesanWidget(wadah, "Tidak ada yang perlu ditindak."); return; }
    daftar.forEach(function (d) {
        var b = buatEl("button", "dash-perhatian " + d.warna);
        b.type = "button";
        b.appendChild(buatEl("b", "", d.ok ? "✓" : "!"));
        b.appendChild(buatEl("span", "", d.teks));
        b.addEventListener("click", function () { d.buka(); });
        wadah.appendChild(b);
    });
}

function gambarAktivitasDashboard(wadah) {
    var log = bacaDaftarTersimpan(KUNCI_LOG).filter(function (l) { return l && teksAman(l.waktu); }).sort(function (a, b) {
        return (teksAman(b.waktu) + teksAman(b.id)).localeCompare(teksAman(a.waktu) + teksAman(a.id));
    }).slice(0, 4);
    if (!log.length) { pesanWidget(wadah, "Belum ada aktivitas yang tercatat."); return; }
    var terbaru = teksAman(log[0].waktu).slice(0, 10);
    var grid = buatEl("div", "dash-waktu");
    var tanggal = buatEl("div", "dash-tanggal");
    tanggal.appendChild(buatEl("span", "", NAMA_BULAN_GRAFIK[Number(terbaru.slice(5, 7)) - 1] || ""));
    tanggal.appendChild(buatEl("b", "", terbaru.slice(8, 10)));
    tanggal.appendChild(buatEl("span", "", terbaru.slice(0, 4)));
    grid.appendChild(tanggal);
    var daftar = buatEl("div", "dash-jalur");
    log.forEach(function (l, i) {
        var b = buatEl("div");
        var titik = buatEl("i");
        titik.style.borderColor = WARNA_GRAFIK[i % WARNA_GRAFIK.length];
        b.appendChild(titik);
        var isi = buatEl("span", "", [teksAman(l.tindakan), teksAman(l.tipe), teksAman(l.referensi)].filter(Boolean).join(" "));
        isi.appendChild(buatEl("small", "", teksWaktuLog(l.waktu) + (teksAman(l.pengguna) ? ", " + teksAman(l.pengguna) : "")));
        b.appendChild(isi);
        daftar.appendChild(b);
    });
    grid.appendChild(daftar);
    wadah.appendChild(grid);
}

// Daftar { nama, nilai } terbesar di atas; sisanya digabung "Lainnya", supaya warna dan kotak tidak terlalu banyak
function teratasDenganLainnya(daftar, batas, satuan) {
    var urut = daftar.filter(function (d) { return d.nilai > 0; }).sort(function (a, b) { return b.nilai - a.nilai; });
    if (urut.length <= batas + 1) { return urut; }
    var sisa = urut.slice(batas);
    return urut.slice(0, batas).concat([{ nama: "Lainnya (" + sisa.length + " " + satuan + ")", nilai: sisa.reduce(function (n, d) { return n + d.nilai; }, 0), lainnya: true }]);
}

function gambarPengeluaranDashboard(wadah) {
    var p = periodeDashboard(), perId = petaAkunLaporan(bacaDaftarAkun()), perAkun = Object.create(null);
    telusuriJurnalLaporan({ perId: perId, dari: p.bulan + "-01", sampai: p.bulan + "-31" }, function (r, akun) {
        if (TIPE_BEBAN_LPK[akun.tipe]) { perAkun[teksAman(akun.id)] = (perAkun[teksAman(akun.id)] || 0) - selisihKreditDebit(r); }
    });
    var daftar = teratasDenganLainnya(Object.keys(perAkun).map(function (id) { return { nama: teksAman(perId[id].nama), nilai: perAkun[id] }; }), 4, "akun");
    if (!daftar.length) { pesanWidget(wadah, "Belum ada pengeluaran bulan ini."); return; }
    var total = daftar.reduce(function (n, d) { return n + d.nilai; }, 0);
    var baris = buatEl("div", "dash-susun"), kanan = buatEl("div", "dash-susun-isi");
    function warna(d, i) { return d.lainnya ? WARNA_LAINNYA : WARNA_GRAFIK[i % WARNA_GRAFIK.length]; }
    baris.appendChild(buatLingkaran(daftar.map(function (d, i) { return { persen: d.nilai / total * 100, warna: warna(d, i) }; }), 118, angkaRingkas(total), "bulan ini", 13));
    daftar.forEach(function (d, i) { barisLegenda(kanan, warna(d, i), d.nama, angkaRingkas(d.nilai)); });
    baris.appendChild(kanan);
    wadah.appendChild(baris);
}

function gambarProgramDashboard(wadah) {
    var tahun = periodeDashboard().tahun, peta = Object.create(null);
    telusuriJurnalLaporan({ perId: petaAkunLaporan(bacaDaftarAkun()), dari: tahun + "-01-01", sampai: tahun + "-12-31" }, function (r, akun) {
        if (TIPE_PENERIMAAN_LPK[akun.tipe]) { peta[teksAman(r.programId)] = (peta[teksAman(r.programId)] || 0) + selisihKreditDebit(r); }
    });
    var daftar = teratasDenganLainnya(Object.keys(peta).map(function (id) {
        return { nama: id ? (namaProgramDari(id) || "(Program sudah dihapus)") : "Tanpa Program", nilai: peta[id] };
    }), 3, "program");
    if (!daftar.length) { pesanWidget(wadah, "Belum ada donasi tahun ini."); return; }
    var terbesar = daftar.reduce(function (n, d) { return Math.max(n, d.nilai); }, 0);
    daftar.forEach(function (d, i) {
        var b = buatEl("div", "dash-peringkat");
        b.appendChild(buatEl("u", d.lainnya ? "lain" : "ke-" + (i + 1), d.lainnya ? "+" : String(i + 1)));
        var isi = buatEl("div");
        var atas = buatEl("p");
        atas.appendChild(buatEl("span", "", d.nama));
        atas.appendChild(buatEl("span", "", rupiahRingkas(d.nilai)));
        var jalur = buatEl("div", "widget-jalur"), batang = buatEl("div", "widget-jalur-isi");
        batang.style.width = d.nilai / terbesar * 100 + "%";
        batang.style.backgroundColor = d.lainnya ? WARNA_LAINNYA : WARNA_DONASI;
        jalur.appendChild(batang);
        isi.appendChild(atas);
        isi.appendChild(jalur);
        b.appendChild(isi);
        wadah.appendChild(b);
    });
}

// ----- Widget tambahan -----
function gambarRekeningDashboard(wadah) {
    var perId = petaAkunLaporan(bacaDaftarAkun()), saldo = saldoAkunPer(periodeDashboard().akhir, perId);
    var daftar = akunKasBankPilihan();
    if (!daftar.length) { pesanWidget(wadah, "Belum ada akun Kas dan Bank."); return; }
    daftar.slice(0, 6).forEach(function (a) { barisTeksWidget(wadah, teksAman(a.nama), formatRupiah(saldo[a.id] || 0)); });
}

function gambarKomposisiDashboard(wadah) {
    var h = posisiAsetNeto(periodeDashboard().akhir, petaAkunLaporan(bacaDaftarAkun()));
    var dengan = Math.max(h.dengan, 0), tanpa = Math.max(h.tanpa, 0);
    if (!(dengan + tanpa > 0)) { pesanWidget(wadah, "Belum ada aset neto."); return; }
    var bar = buatEl("div", "widget-komposisi");
    [[dengan, WARNA_GRAFIK[0]], [tanpa, WARNA_GRAFIK[1]]].forEach(function (d) {
        var isi = buatEl("div");
        isi.style.width = d[0] / (dengan + tanpa) * 100 + "%";
        isi.style.backgroundColor = d[1];
        bar.appendChild(isi);
    });
    wadah.appendChild(bar);
    barisTeksWidget(wadah, "Dengan pembatasan", formatRupiah(h.dengan));
    barisTeksWidget(wadah, "Tanpa pembatasan", formatRupiah(h.tanpa));
}

function jumlahkanPerNama(baris, ambilNama) {
    var peta = Object.create(null);
    baris.forEach(function (b) { peta[ambilNama(b)] = (peta[ambilNama(b)] || 0) + b.nilai; });
    return Object.keys(peta).map(function (nama) { return { nama: nama, nilai: peta[nama] }; });
}

function gambarKategoriDashboard(wadah) {
    var daftar = teratasDenganLainnya(jumlahkanPerNama(barisDonasiTahunIni(), function (b) { return b.kategori; }), 4, "kategori");
    if (!daftar.length) { pesanWidget(wadah, "Belum ada donasi tahun ini."); return; }
    var total = daftar.reduce(function (n, d) { return n + d.nilai; }, 0);
    var baris = buatEl("div", "dash-susun"), kanan = buatEl("div", "dash-susun-isi");
    function warna(d, i) { return d.lainnya ? WARNA_LAINNYA : WARNA_GRAFIK[i % WARNA_GRAFIK.length]; }
    baris.appendChild(buatLingkaran(daftar.map(function (d, i) { return { persen: d.nilai / total * 100, warna: warna(d, i) }; }), 118, angkaRingkas(total), "tahun ini", 13));
    daftar.forEach(function (d, i) { barisLegenda(kanan, warna(d, i), d.nama, angkaRingkas(d.nilai)); });
    baris.appendChild(kanan);
    wadah.appendChild(baris);
}

function gambarDonaturDashboard(wadah) {
    var baris = barisDonasiTahunIni();
    if (!baris.length) { pesanWidget(wadah, "Belum ada donasi tahun ini."); return; }
    jumlahkanPerNama(baris, function (b) { return b.donatur; }).sort(function (a, b) { return b.nilai - a.nilai; }).slice(0, 5).forEach(function (d) {
        barisTeksWidget(wadah, d.nama, formatRupiah(d.nilai));
    });
}

function gambarDonasiTerbaruDashboard(wadah) {
    var baris = barisDonasiTahunIni().sort(function (a, b) { return b.tanggal.localeCompare(a.tanggal); });
    if (!baris.length) { pesanWidget(wadah, "Belum ada donasi tahun ini."); return; }
    baris.slice(0, 5).forEach(function (b) { barisTeksWidget(wadah, b.donatur + ", " + b.kategori, formatRupiah(b.nilai)); });
}

function gambarSisaDanaDashboard(wadah) {
    var daftar = bacaProgram().filter(function (x) { return x.status === "aktif"; }).map(function (x) { return { nama: teksAman(x.nama), sisa: sisaDanaProgram(x.id) }; });
    if (!daftar.length) { pesanWidget(wadah, "Belum ada Program aktif."); return; }
    daftar.sort(function (a, b) { return b.sisa - a.sisa; }).slice(0, 6).forEach(function (d) {
        barisTeksWidget(wadah, d.nama, formatRupiah(d.sisa), d.sisa < 0 ? "teks-lewat" : "");
    });
}

function gambarAsetDashboard(wadah) {
    var daftar = bacaAsetTetap().filter(function (a) { return !lepasDariAset(a.id); });
    if (!daftar.length) { pesanWidget(wadah, "Belum ada aset tetap."); return; }
    var nilai = daftar.reduce(function (n, a) { return n + (Number(a.nilai) || 0); }, 0);
    var susut = daftar.reduce(function (n, a) { return n + penyusutanSampai(a); }, 0);
    barisTeksWidget(wadah, "Jumlah aset", String(daftar.length));
    barisTeksWidget(wadah, "Nilai Aset", formatRupiah(nilai));
    barisTeksWidget(wadah, "Sudah Disusutkan", formatRupiah(susut));
    barisTeksWidget(wadah, "Nilai Buku", formatRupiah(nilai - susut));
}

function bukaLaporanDashboard(id) {
    var ketemu = cariLaporanDaftar(id);
    if (ketemu) { bukaLaporan(ketemu.lap); }
}

var WIDGET_DASHBOARD = [
    { id: "ringkasan", judul: "Kartu Ringkasan", keterangan: "Kas dan Bank, Donasi, Pengeluaran, Selisih", lebar: 3, bawaan: true, kartu: true, gambar: gambarRingkasanDashboard },
    { id: "banding", judul: "Donasi dan Pengeluaran", keterangan: "Lingkaran bulan ini, dibanding bulan lalu", lebar: 1, bawaan: true, gambar: gambarBandingDashboard, buka: function () { bukaLaporanDashboard("penghasilan-komprehensif"); } },
    { id: "arus", judul: "Arus Kas", keterangan: "Uang masuk dan keluar 7 hari", lebar: 1, bawaan: true, gambar: gambarArusDashboard, buka: function () { bukaLaporanDashboard("arus-kas"); } },
    { id: "tren", judul: "Tren Donasi", keterangan: "Garis 30 hari", lebar: 1, bawaan: true, gambar: gambarTrenDashboard, buka: function () { bukaLaporanDashboard("rincian-per-donasi"); } },
    { id: "aktivitas", judul: "Aktivitas Terakhir", keterangan: "Garis waktu kegiatan terakhir", lebar: 1, bawaan: true, gambar: gambarAktivitasDashboard, buka: function () { bukaLog(); } },
    { id: "pengeluaran", judul: "Beban Terbesar", keterangan: "Lingkaran akun beban bulan ini", lebar: 1, bawaan: true, gambar: gambarPengeluaranDashboard, buka: function () { bukaLaporanDashboard("rincian-pengeluaran"); } },
    { id: "program", judul: "Program Terbaik Tahun Ini", keterangan: "Peringkat donasi per Program", lebar: 1, bawaan: true, gambar: gambarProgramDashboard, buka: function () { bukaLaporanDashboard("donasi-per-program"); } },
    { id: "perhatian", judul: "Perlu Perhatian", keterangan: "Hal yang perlu ditindak hari ini", lebar: 1, bawaan: true, gambar: gambarPerhatianDashboard },
    { id: "anggaran", judul: "Anggaran Bulan Ini", keterangan: "Lingkaran pemakaian anggaran", lebar: 1, bawaan: true, gambar: gambarAnggaranDashboard, buka: function () { bukaMonitorAnggaran(); } },
    { id: "target", judul: "Target Donasi", keterangan: "Capaian target yang berjalan", lebar: 1, bawaan: true, gambar: gambarTargetDashboard, buka: function () { bukaTargetDonasiBaru(); } },
    { id: "rekening", judul: "Saldo per Rekening", keterangan: "Saldo tiap Kas dan Bank", lebar: 1, bawaan: false, gambar: gambarRekeningDashboard, buka: function () { bukaLaporanDashboard("daftar-kas-bank"); } },
    { id: "tahun", judul: "Donasi dan Pengeluaran Tahun Ini", keterangan: "Grafik batang per bulan", lebar: 2, bawaan: false, gambar: gambarGrafikTahun, buka: function () { bukaLaporanDashboard("penghasilan-komprehensif"); } },
    { id: "komposisi", judul: "Komposisi Dana", keterangan: "Dengan dan tanpa pembatasan", lebar: 1, bawaan: false, gambar: gambarKomposisiDashboard, buka: function () { bukaLaporanDashboard("posisi-keuangan"); } },
    { id: "kategori", judul: "Donasi per Kategori", keterangan: "Lingkaran kategori tahun ini", lebar: 1, bawaan: false, gambar: gambarKategoriDashboard, buka: function () { bukaLaporanDashboard("rincian-per-donasi"); } },
    { id: "donatur", judul: "Donatur Terbesar", keterangan: "Lima donatur terbesar tahun ini", lebar: 1, bawaan: false, gambar: gambarDonaturDashboard, buka: function () { bukaLaporanDashboard("donasi-per-donatur"); } },
    { id: "terbaru", judul: "Donasi Terbaru", keterangan: "Lima donasi terakhir", lebar: 1, bawaan: false, gambar: gambarDonasiTerbaruDashboard },
    { id: "sisa-dana", judul: "Sisa Dana per Program", keterangan: "Sisa dana Program aktif", lebar: 1, bawaan: false, gambar: gambarSisaDanaDashboard, buka: function () { bukaLaporanDashboard("sisa-dana-program"); } },
    { id: "aset", judul: "Aset Tetap", keterangan: "Nilai Aset dan Nilai Buku", lebar: 1, bawaan: false, gambar: gambarAsetDashboard, buka: function () { bukaLaporanDashboard("daftar-aset-tetap"); } }
];

// ----- Pengaturan: data rusak dibersihkan; widget baru di versi mendatang otomatis masuk menurut urutan daftar -----
function bacaPengaturanWidget() {
    var data = bacaPengaturan(KUNCI_WIDGET_DASHBOARD, {});
    var urutan = (Array.isArray(data.urutan) ? data.urutan : []).filter(function (id, i, semua) {
        return semua.indexOf(id) === i && WIDGET_DASHBOARD.some(function (w) { return w.id === id; });
    });
    WIDGET_DASHBOARD.forEach(function (w) { if (urutan.indexOf(w.id) === -1) { urutan.push(w.id); } });
    var simpanan = data.tampil && typeof data.tampil === "object" ? data.tampil : {};
    var tampil = {};
    WIDGET_DASHBOARD.forEach(function (w) { tampil[w.id] = typeof simpanan[w.id] === "boolean" ? simpanan[w.id] : w.bawaan; });
    return { urutan: urutan, tampil: tampil };
}
function simpanPengaturanWidget(data) {
    try { localStorage.setItem(KUNCI_WIDGET_DASHBOARD, JSON.stringify(data)); } catch (galat) { tampilkanNotifikasi("Pengaturan widget gagal disimpan.", "galat"); }
    gambarDashboard();
}
function widgetDari(id) { return WIDGET_DASHBOARD.find(function (w) { return w.id === id; }); }

// ----- Menggambar -----
var IKON_SEGARKAN_WIDGET = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M21 12a9 9 0 1 1-3-6.7L21 8"/><path d="M21 3v5h-5"/></svg>';
var IKON_SEMBUNYI_WIDGET = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" aria-hidden="true"><path d="M6 6l12 12M18 6L6 18"/></svg>';

function tombolAksiWidget(label, ikon, saatKlik) {
    var t = buatEl("button", "tombol-ikon");
    t.type = "button";
    t.title = label;
    t.setAttribute("aria-label", label);
    t.innerHTML = ikon;   // ikon tetap, bukan dari pengguna
    t.addEventListener("click", saatKlik);
    return t;
}

function sembunyikanWidget(id) {
    var data = bacaPengaturanWidget();
    data.tampil[id] = false;
    simpanPengaturanWidget(data);
}

function isiWidget(w, wadah) {
    wadah.textContent = "";
    wadah.classList.remove("widget-kosong");
    try {
        w.gambar(wadah);
    } catch (galat) {
        // Data rusak di satu widget tidak boleh mematikan seluruh Dashboard
        wadah.textContent = "";
        pesanWidget(wadah, "Data widget ini belum bisa ditampilkan.");
    }
}

function buatWidget(w) {
    if (w.kartu) {
        var kartu = buatEl("section", "dash-kartu-baris");
        kartu.dataset.widget = w.id;
        kartu.setAttribute("aria-label", w.judul);
        isiWidget(w, kartu);
        return kartu;
    }
    var el = buatEl("article", "widget" + (w.lebar > 1 ? " lebar-" + w.lebar : ""));
    el.dataset.widget = w.id;
    var kepala = buatEl("header", "widget-kepala");
    var judul = buatEl("h2");
    if (w.buka) {
        var tombol = buatEl("button", "widget-judul", w.judul);
        tombol.type = "button";
        tombol.addEventListener("click", function () { w.buka(); });
        judul.appendChild(tombol);
    } else {
        judul.textContent = w.judul;
    }
    var lencana = buatEl("em", "widget-lencana dash-lencana buruk");
    lencana.hidden = true;
    var isi = buatEl("div", "widget-isi");
    var aksi = buatEl("div", "widget-aksi");
    aksi.appendChild(tombolAksiWidget("Segarkan " + w.judul, IKON_SEGARKAN_WIDGET, function () { isiWidget(w, isi); }));
    aksi.appendChild(tombolAksiWidget("Sembunyikan " + w.judul, IKON_SEMBUNYI_WIDGET, function () { sembunyikanWidget(w.id); }));
    kepala.appendChild(judul);
    kepala.appendChild(lencana);
    kepala.appendChild(aksi);
    el.appendChild(kepala);
    el.appendChild(isi);
    isiWidget(w, isi);
    return el;
}

function gambarKepalaDashboard() {
    var jam = new Date().getHours();
    var waktu = jam < 11 ? "pagi" : (jam < 15 ? "siang" : (jam < 18 ? "sore" : "malam"));
    document.getElementById("dash-salam").textContent = "Selamat " + waktu + ", " + penggunaAktif;
    var p = periodeDashboard();
    document.getElementById("dash-bulan").textContent = namaBulanKalender[p.nomorBulan - 1] + " " + p.tahun;
    document.getElementById("dash-bulan-maju").disabled = geserBulanDashboard >= 0;   // bulan yang belum tiba tidak bisa dipilih
}

function gambarDashboard() {
    var grid = document.getElementById("grid-widget");
    var data = bacaPengaturanWidget();
    gambarKepalaDashboard();
    grid.textContent = "";
    data.urutan.forEach(function (id) { if (data.tampil[id]) { grid.appendChild(buatWidget(widgetDari(id))); } });
    if (!grid.children.length) { grid.appendChild(buatEl("p", "isi-menyusul", "Semua widget disembunyikan. Klik + Widget untuk menampilkannya.")); }
}

document.getElementById("dash-bulan-mundur").addEventListener("click", function () { geserBulanDashboard--; gambarDashboard(); });
document.getElementById("dash-bulan-maju").addEventListener("click", function () {
    if (geserBulanDashboard < 0) { geserBulanDashboard++; gambarDashboard(); }
});

// ----- Popup + Widget -----
var dialogWidget = document.getElementById("dialog-widget");

function geserWidget(id, arah) {
    var data = bacaPengaturanWidget();
    var i = data.urutan.indexOf(id), tujuan = i + arah;
    if (tujuan < 0 || tujuan >= data.urutan.length) { return; }
    data.urutan[i] = data.urutan[tujuan];
    data.urutan[tujuan] = id;
    simpanPengaturanWidget(data);
    gambarDaftarAturWidget();
}

function gambarDaftarAturWidget() {
    var daftar = document.getElementById("daftar-atur-widget");
    var data = bacaPengaturanWidget();
    daftar.textContent = "";
    data.urutan.forEach(function (id, i) {
        var w = widgetDari(id);
        var li = buatEl("li");
        var label = buatEl("label");
        var centang = buatEl("input");
        centang.type = "checkbox";
        centang.checked = data.tampil[id];
        centang.addEventListener("change", function () {
            var baru = bacaPengaturanWidget();
            baru.tampil[id] = centang.checked;
            simpanPengaturanWidget(baru);
        });
        var teks = buatEl("span");
        teks.appendChild(buatEl("strong", "", w.judul));
        teks.appendChild(buatEl("small", "", w.keterangan));
        label.appendChild(centang);
        label.appendChild(teks);
        li.appendChild(label);
        [["Naik", -1, "▲", i === 0], ["Turun", 1, "▼", i === data.urutan.length - 1]].forEach(function (a) {
            var t = buatEl("button", "tombol-ikon", a[2]);
            t.type = "button";
            t.title = a[0];
            t.setAttribute("aria-label", a[0] + " " + w.judul);
            t.disabled = a[3];
            t.addEventListener("click", function () { geserWidget(id, a[1]); });
            li.appendChild(t);
        });
        daftar.appendChild(li);
    });
}

document.getElementById("tombol-widget").addEventListener("click", function () {
    gambarDaftarAturWidget();
    dialogWidget.showModal();
});
document.getElementById("tutup-dialog-widget").addEventListener("click", function () { dialogWidget.close(); });
document.getElementById("selesai-widget").addEventListener("click", function () { dialogWidget.close(); });
document.getElementById("bawaan-widget").addEventListener("click", function () {
    try { localStorage.removeItem(KUNCI_WIDGET_DASHBOARD); } catch (galat) { /* biarkan */ }
    gambarDaftarAturWidget();
    gambarDashboard();
});

// Data berubah di halaman lain: digambar ulang tiap tab Dashboard dibuka
saatTabDibuka.dashboard = gambarDashboard;
gambarDashboard();
