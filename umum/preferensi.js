// ==================== Preferensi ====================
// Berisi: tab Preferensi (Data Yayasan, Fitur, Pembatasan, Lampiran, Akun Perkiraan, Lain-lain/format),
// pemilih tanggal bergaya Accurate untuk semua kolom tanggal, dan fungsi format angka/tanggal
// (formatRupiah, formatAngka, formatTanggal, tanggalHariIni, tanggalTerkunci, lampiranWajib, dan lain-lain).
// Dimuat sesudah umum/inti.js dan sebelum semua halaman lain.
// Semua nama (var dan function) di sini tetap bisa dipakai skrip lain, karena skrip biasa berbagi satu ruang nama.

// Nama bulan singkat untuk tanggal "22 Okt 2026". Ditaruh paling atas karena formatTanggal sudah dipakai
// saat file ini dimuat (teks tanggal di Data Yayasan), sebelum baris-baris di bawah sempat dijalankan.
var NAMA_BULAN_SINGKAT = ["Jan", "Feb", "Mar", "Apr", "Mei", "Jun", "Jul", "Agu", "Sep", "Okt", "Nov", "Des"];

// ---------- Membaca dan menyimpan pengaturan ----------
// Semua bagian Preferensi menyimpan satu objek di localStorage dengan pola yang sama, jadi caranya ditulis sekali di sini.

// Baca objek pengaturan. Isian yang belum pernah disimpan memakai nilai bawaan. Kalau isi penyimpanan rusak atau bukan
// objek, nilai bawaan yang dipakai (try/catch dipakai karena localStorage bisa dinonaktifkan oleh browser).
function bacaPengaturan(kunci, bawaan) {
    var hasil = Object.assign({}, bawaan);
    try {
        var teks = localStorage.getItem(kunci);
        var data = teks ? JSON.parse(teks) : null;
        if (data && typeof data === "object" && !Array.isArray(data)) {
            Object.assign(hasil, data);
        }
    } catch (galat) {
        // Kalau gagal membaca, pakai nilai bawaan
    }
    return hasil;
}

// Simpan objek pengaturan, beri tahu hasilnya, dan catat di Log Aktivitas (referensiLog = nama bagian Preferensi).
// Mengembalikan true kalau berhasil.
function simpanPengaturan(kunci, data, pesanBerhasil, referensiLog) {
    if (hanyaLihat()) { tampilkanNotifikasi("Peran Pengawas hanya bisa melihat data.", "peringatan"); return false; }   // PRD 5.8, umum/sesi.js
    try {
        localStorage.setItem(kunci, JSON.stringify(data));
    } catch (galat) {
        tampilkanNotifikasi("Gagal menyimpan. Penyimpanan browser penuh atau diblokir.", "galat");
        return false;
    }
    tampilkanNotifikasi(pesanBerhasil);
    catatLog({ tindakan: "Ubah", tipe: "Preferensi", referensi: referensiLog });
    return true;
}

// ---------- Menu bagian di dalam tab Preferensi ----------
var daftarBagianPref = document.querySelectorAll(".pref-item");

// Klik satu bagian -> beri tanda aktif padanya, tampilkan isinya, sembunyikan yang lain
daftarBagianPref.forEach(function (tombol) {
    tombol.addEventListener("click", function () {
        daftarBagianPref.forEach(function (t) {
            t.classList.toggle("aktif", t === tombol);
            document.getElementById("pref-" + t.dataset.bagian).hidden = (t !== tombol);
        });
    });
});

// ---------- Formulir Data Yayasan ----------
// Nama kunci tempat data disimpan di localStorage (penyimpanan kecil di browser)
var KUNCI_YAYASAN = "dataYayasan";

// Pasangan: nama data -> id kolom di HTML
var kolomYayasan = {
    nama: "yayasan-nama",
    tglMulai: "yayasan-tgl-mulai",
    alamat: "yayasan-alamat",
    telepon: "yayasan-telepon",
    email: "yayasan-email",
    ketua: "yayasan-ketua",
    bendahara: "yayasan-bendahara"
};

var logoTersimpan = "";   // logo dalam bentuk teks (data URL), kosong kalau belum ada logo
var gambarLogo = document.getElementById("logo-pratinjau");
var tombolHapusLogo = document.getElementById("logo-hapus");

// Ubah "2024-09-30" (bentuk bawaan kolom tanggal) menjadi "30 Sep 2024", apa pun pengaturan format tanggalnya
// (dipakai untuk teks kecil di sebelah kolom tanggal)
function formatTanggalTeks(nilai) {
    return formatTanggal(nilai, { tanggal: "teks" });
}

// Tulis ulang tanggal dalam bentuk teks di sebelah kolom tanggal
function perbaruiTanggalTeks() {
    var nilai = document.getElementById(kolomYayasan.tglMulai).value;
    document.getElementById("yayasan-tgl-teks").textContent = formatTanggalTeks(nilai);
}
document.getElementById(kolomYayasan.tglMulai).addEventListener("change", perbaruiTanggalTeks);

// Tampilkan atau sembunyikan pratinjau logo sesuai isi logoTersimpan
function perbaruiLogo() {
    gambarLogo.src = logoTersimpan;
    gambarLogo.hidden = !logoTersimpan;
    tombolHapusLogo.hidden = !logoTersimpan;
}

// Logo hanya boleh berupa gambar (data URL gambar). Isi lain (misalnya data yang diutak-atik) diabaikan.
function logoAman(teks) {
    return /^data:image\/(png|jpeg|gif|webp|svg\+xml);/.test(teks || "") ? teks : "";
}

// Pilih file logo -> periksa ukuran dan ISI file (bukan hanya nama, Temuan 46), ubah jadi teks (data URL), lalu tampilkan.
// Pemeriksaan isi memakai alat bersama lampiran (umum/lampiran.js: bacaAwalBerkas, jenisIsiBerkas, TIPE_FOTO_ISI, bacaSebagaiDataUrl);
// alat itu dimuat sesudah file ini, tetapi baru dipakai saat pengguna memilih file, jadi sudah tersedia.
// Logo baru hanya PNG, JPG, atau WEBP. SVG tidak diterima lagi: isinya tulisan, tidak bisa dicek seperti gambar biasa.
// (Logo SVG lama yang sudah tersimpan tetap tampil lewat logoAman sampai diganti.)
document.getElementById("yayasan-logo").addEventListener("change", function (kejadian) {
    var kolom = kejadian.target, berkas = kolom.files[0];
    if (!berkas) { return; }
    function tolak(pesan) { tampilkanNotifikasi(pesan, "galat"); kolom.value = ""; }   // kosongkan pilihan file
    if (berkas.size > 500 * 1024) { tolak("Ukuran logo lebih dari 500 KB."); return; }
    bacaAwalBerkas(berkas, 16).then(function (awal) {
        var tipe = TIPE_FOTO_ISI[jenisIsiBerkas(awal)];   // umum/lampiran.js
        if (!tipe) { tolak("Logo harus berupa gambar PNG, JPG, atau WEBP sungguhan. Isi file ini bukan gambar (nama file saja tidak cukup)."); return; }
        // Jenis isi mengikuti hasil pemeriksaan, bukan tebakan browser dari nama file
        return bacaSebagaiDataUrl(new Blob([berkas], { type: tipe })).then(function (isi) {
            // Gambar juga harus benar-benar bisa dibuka; yang rusak ditolak
            var uji = new Image();
            uji.onload = function () { logoTersimpan = logoAman(isi); perbaruiLogo(); };
            uji.onerror = function () { tolak("Logo tidak bisa dibuka sebagai gambar (rusak atau bukan gambar)."); };
            uji.src = isi;
        });
    }).catch(function () { tolak("File logo tidak bisa dibaca."); });
});

// Tombol Hapus logo
tombolHapusLogo.addEventListener("click", function () {
    logoTersimpan = "";
    document.getElementById("yayasan-logo").value = "";
    perbaruiLogo();
});

// Saat halaman dibuka: isi formulir dari data yang pernah disimpan (kosong kalau belum ada)
var dataYayasanTersimpan = bacaPengaturan(KUNCI_YAYASAN, {});
Object.keys(kolomYayasan).forEach(function (nama) {
    document.getElementById(kolomYayasan[nama]).value = String(dataYayasanTersimpan[nama] || "");
});
logoTersimpan = logoAman(dataYayasanTersimpan.logo);
perbaruiTanggalTeks();
perbaruiLogo();

// Tombol Simpan: kumpulkan isi formulir lalu simpan ke localStorage.
// Tidak ada pemeriksaan "wajib diisi": data boleh disimpan walau ada yang kosong.
document.getElementById("form-yayasan").addEventListener("submit", function (kejadian) {
    kejadian.preventDefault();   // cegah halaman dimuat ulang
    var data = {};
    Object.keys(kolomYayasan).forEach(function (nama) {
        data[nama] = document.getElementById(kolomYayasan[nama]).value.trim();
    });
    data.logo = logoTersimpan;
    simpanPengaturan(KUNCI_YAYASAN, data, "Data telah berhasil disimpan", "Data");
});

// ---------- Saklar Fitur ----------
var KUNCI_FITUR = "fiturYayasan";

// Posisi awal saklar sebelum pernah disimpan
var fiturBawaan = {
    aset: false,
    anggaran: false,
    rekonsiliasi: true,
    program: true,
    divisi: true
    // kategori dan donatur dihapus (PRD Keputusan 6 dan 7, 2026-10-26), pengembalianDonasi dihapus 2026-10-29 (PRD 6.1).
    // Data lama yang masih menyimpannya diabaikan, dan hilang sendiri saat saklar Fitur disimpan lagi.
};

// Baca posisi saklar dari localStorage. Yang belum pernah disimpan memakai nilai bawaan.
function bacaFitur() {
    return bacaPengaturan(KUNCI_FITUR, fiturBawaan);
}

// Fungsi untuk halaman lain: fiturAktif("program") -> true kalau saklar Program nyala
function fiturAktif(nama) {
    return bacaFitur()[nama] === true;
}

// Tampilkan posisi saklar di formulir
var kotakFitur = document.querySelectorAll("[data-fitur]");
function isiFormulirFitur() {
    var fitur = bacaFitur();
    kotakFitur.forEach(function (kotak) {
        kotak.checked = (fitur[kotak.dataset.fitur] === true);
    });
}
isiFormulirFitur();

// Tombol Simpan: kumpulkan posisi semua saklar lalu simpan
document.getElementById("form-fitur").addEventListener("submit", function (kejadian) {
    kejadian.preventDefault();
    var data = {};
    kotakFitur.forEach(function (kotak) {
        data[kotak.dataset.fitur] = kotak.checked;
    });
    simpanPengaturan(KUNCI_FITUR, data, "Fitur telah berhasil disimpan", "Fitur");
});

// ---------- Pemilih tanggal (kalender) ----------
// SEMUA kolom <input type="date"> di aplikasi dipasangi kalender bergaya Accurate: kolom teks bertanggal "23/10/2026"
// dengan tombol kalender; klik tombol membuka kalender (judul biru, tombol « ‹ › » untuk tahun/bulan, nama hari,
// tanggal terpilih berwarna hijau dengan tanda centang).
//
// Kolom <input type="date"> aslinya TETAP ADA (disembunyikan) dan tetap menjadi sumber nilai: kode lain tetap
// membaca/menulis .value dalam bentuk "2026-10-23", memakai .max/.min, .disabled, .focus(), dan mendengarkan
// peristiwa "change" seperti biasa. Komponen ini hanya menyinkronkan tampilan di sebelahnya.
var namaBulanKalender = ["Januari", "Februari", "Maret", "April", "Mei", "Juni", "Juli", "Agustus", "September", "Oktober", "November", "Desember"];
var namaHariKalender = ["Mg", "Sn", "Sl", "Rb", "Km", "Jm", "Sb"];   // Minggu di kolom pertama
var kalenderTerbuka = null;   // kalender yang sedang terbuka; hanya satu pada satu waktu

function duaDigitKalender(n) { return String(n).padStart(2, "0"); }

// "2026-10-23" -> "23/10/2026" (kosong kalau bukan tanggal)
function isoKeTampilan(iso) {
    var b = /^(\d{4})-(\d{2})-(\d{2})$/.exec(iso || "");
    return b ? b[3] + "/" + b[2] + "/" + b[1] : "";
}

// "23/10/2026" (atau "23-10-2026", "23.10.2026") -> "2026-10-23"; null kalau bukan tanggal yang ada di kalender
function tampilanKeIso(teks) {
    var b = /^(\d{1,2})\D+(\d{1,2})\D+(\d{4})$/.exec(String(teks).trim());
    if (!b) { return null; }
    var hari = Number(b[1]), bulan = Number(b[2]), tahun = Number(b[3]);
    var uji = new Date(tahun, bulan - 1, hari);
    if (uji.getFullYear() !== tahun || uji.getMonth() !== bulan - 1 || uji.getDate() !== hari) { return null; }
    return tahun + "-" + duaDigitKalender(bulan) + "-" + duaDigitKalender(hari);
}

function pasangPemilihTanggal(asli) {
    var deskNilai = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, "value");
    var deskNonaktif = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, "disabled");
    var id = asli.id;

    // --- Tampilan: kolom teks + tombol kalender + kalender ---
    var bungkus = document.createElement("div");
    bungkus.className = "pemilih-tanggal";
    var tampil = document.createElement("input");
    tampil.type = "text";
    tampil.className = "pt-tampil";
    tampil.id = id + "-tampil";
    tampil.placeholder = "dd/mm/yyyy";
    tampil.inputMode = "numeric";
    tampil.maxLength = 10;
    tampil.autocomplete = "off";
    if (asli.getAttribute("aria-label")) { tampil.setAttribute("aria-label", asli.getAttribute("aria-label")); }
    if (asli.getAttribute("aria-required")) { tampil.setAttribute("aria-required", asli.getAttribute("aria-required")); }
    var tombol = document.createElement("button");
    tombol.type = "button";
    tombol.className = "pt-ikon";
    tombol.setAttribute("aria-label", "Pilih tanggal dari kalender");
    tombol.setAttribute("aria-haspopup", "dialog");
    tombol.setAttribute("aria-expanded", "false");
    tombol.innerHTML = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="3" y="5" width="18" height="16" rx="2"/><path d="M3 10h18M8 3v4M16 3v4M7 14h2M11 14h2M15 14h2M7 17.5h2M11 17.5h2"/></svg>';   // ikon tetap
    var kalender = document.createElement("div");
    kalender.className = "pt-kalender";
    kalender.setAttribute("role", "dialog");
    kalender.setAttribute("aria-label", "Kalender");
    kalender.hidden = true;
    bungkus.appendChild(tampil);
    bungkus.appendChild(tombol);
    bungkus.appendChild(kalender);
    asli.insertAdjacentElement("afterend", bungkus);
    asli.hidden = true;
    // Tulisan label ("Tanggal", "per Tgl", ...) sekarang mengarah ke kolom yang terlihat
    document.querySelectorAll('label[for="' + id + '"]').forEach(function (label) { label.htmlFor = tampil.id; });

    function nilaiAsli() { return deskNilai.get.call(asli); }
    function segarkanTampilan() { tampil.value = isoKeTampilan(nilaiAsli()); }

    // --- Sinkronisasi: kode lain yang mengubah nilai/status kolom asli ikut tercermin di tampilan ---
    Object.defineProperty(asli, "value", {
        configurable: true,
        get: function () { return deskNilai.get.call(asli); },
        set: function (v) { deskNilai.set.call(asli, v); segarkanTampilan(); }
    });
    Object.defineProperty(asli, "disabled", {
        configurable: true,
        get: function () { return deskNonaktif.get.call(asli); },
        set: function (v) { deskNonaktif.set.call(asli, v); tampil.disabled = !!v; tombol.disabled = !!v; if (v) { tutup(); } }
    });
    asli.focus = function (opsi) { tampil.focus(opsi); };   // kolom asli tersembunyi, jadi fokus dialihkan ke kolom yang terlihat
    segarkanTampilan();
    tampil.disabled = !!asli.disabled;
    tombol.disabled = !!asli.disabled;

    // Memilih tanggal dari pengguna: ubah nilai asli lalu beri tahu seperti kolom tanggal bawaan browser
    function tetapkan(iso) {
        if (nilaiAsli() === iso) { segarkanTampilan(); return; }
        asli.value = iso;
        asli.dispatchEvent(new Event("input", { bubbles: true }));
        asli.dispatchEvent(new Event("change", { bubbles: true }));
    }

    // --- Mengetik tanggal: garis miring ditambahkan otomatis ---
    tampil.addEventListener("input", function () {
        var angka = tampil.value.replace(/\D/g, "").slice(0, 8);
        var rapi = angka.slice(0, 2) + (angka.length > 2 ? "/" + angka.slice(2, 4) : "") + (angka.length > 4 ? "/" + angka.slice(4) : "");
        if (tampil.value !== rapi) { tampil.value = rapi; }
    });
    // Selesai mengetik (keluar kolom atau Enter): tanggal yang sah dipakai, yang tidak sah dikembalikan ke nilai sebelumnya
    function selesaiMengetik() {
        var teks = tampil.value.trim();
        if (teks === "") { tetapkan(""); return; }
        var iso = tampilanKeIso(teks);
        if (iso) { tetapkan(iso); }
        segarkanTampilan();   // tanggal sah ditulis rapi; tanggal tidak sah dikembalikan ke nilai sebelumnya
    }
    tampil.addEventListener("blur", selesaiMengetik);
    tampil.addEventListener("keydown", function (k) {
        if (k.key === "Enter") { selesaiMengetik(); }
        else if (k.key === "ArrowDown" && !kalenderTerbuka) { k.preventDefault(); buka(); }
    });

    // --- Kalender ---
    var tahunLihat = 0, bulanLihat = 0;

    function gambar() {
        kalender.textContent = "";
        var kepala = document.createElement("div");
        kepala.className = "pt-kepala";
        function navigasi(teks, label, selisihBulan) {
            var b = document.createElement("button");
            b.type = "button";
            b.className = "pt-nav";
            b.textContent = teks;
            b.setAttribute("aria-label", label);
            b.addEventListener("click", function () {
                var baru = new Date(tahunLihat, bulanLihat + selisihBulan, 1);
                tahunLihat = baru.getFullYear();
                bulanLihat = baru.getMonth();
                gambar();
                // fokus tetap di tombol yang sama setelah gambar ulang
                var lagi = kalender.querySelector('.pt-nav[aria-label="' + label + '"]');
                if (lagi) { lagi.focus(); }
            });
            return b;
        }
        var judul = document.createElement("div");
        judul.className = "pt-judul";
        judul.setAttribute("aria-live", "polite");
        judul.textContent = namaBulanKalender[bulanLihat] + " " + tahunLihat;
        kepala.appendChild(navigasi("«", "Tahun sebelumnya", -12));
        kepala.appendChild(navigasi("‹", "Bulan sebelumnya", -1));
        kepala.appendChild(judul);
        kepala.appendChild(navigasi("›", "Bulan berikutnya", 1));
        kepala.appendChild(navigasi("»", "Tahun berikutnya", 12));
        kalender.appendChild(kepala);

        var tabel = document.createElement("table");
        tabel.className = "pt-tabel";
        var kepalaTabel = document.createElement("tr");
        namaHariKalender.forEach(function (n) {
            var th = document.createElement("th");
            th.scope = "col";
            th.textContent = n;
            kepalaTabel.appendChild(th);
        });
        var thead = document.createElement("thead");
        thead.appendChild(kepalaTabel);
        tabel.appendChild(thead);

        var terpilih = nilaiAsli(), hariIniIso = tanggalHariIni();
        var batasAtas = asli.max || "", batasBawah = asli.min || "";
        var hariPertama = new Date(tahunLihat, bulanLihat, 1).getDay();      // 0 = Minggu
        var jumlahHari = new Date(tahunLihat, bulanLihat + 1, 0).getDate();
        var tbody = document.createElement("tbody");
        var hari = 1 - hariPertama;
        for (var minggu = 0; minggu < 6; minggu++) {
            if (hari > jumlahHari) { break; }
            var tr = document.createElement("tr");
            for (var kolom = 0; kolom < 7; kolom++, hari++) {
                var td = document.createElement("td");
                if (hari >= 1 && hari <= jumlahHari) {
                    var iso = tahunLihat + "-" + duaDigitKalender(bulanLihat + 1) + "-" + duaDigitKalender(hari);
                    var b = document.createElement("button");
                    b.type = "button";
                    b.className = "pt-hari" + (iso === terpilih ? " dipilih" : "") + (iso === hariIniIso ? " hari-ini" : "");
                    b.textContent = String(hari);
                    b.dataset.iso = iso;
                    b.setAttribute("aria-label", hari + " " + namaBulanKalender[bulanLihat] + " " + tahunLihat);
                    if (iso === terpilih) { b.setAttribute("aria-pressed", "true"); }
                    // Tanggal di luar batas (misalnya masa depan yang dilarang Preferensi) tidak bisa dipilih
                    if ((batasAtas && iso > batasAtas) || (batasBawah && iso < batasBawah)) { b.disabled = true; }
                    b.addEventListener("click", function (peristiwa) {
                        tetapkan(peristiwa.currentTarget.dataset.iso);
                        tutup();
                        tampil.focus();
                    });
                    td.appendChild(b);
                }
                tr.appendChild(td);
            }
            tbody.appendChild(tr);
        }
        tabel.appendChild(tbody);
        kalender.appendChild(tabel);
    }

    function buka() {
        if (kalenderTerbuka && kalenderTerbuka !== api) { kalenderTerbuka.tutup(); }
        var sekarang = new Date();
        var iso = nilaiAsli();
        var b = /^(\d{4})-(\d{2})-\d{2}$/.exec(iso);
        tahunLihat = b ? Number(b[1]) : sekarang.getFullYear();
        bulanLihat = b ? Number(b[2]) - 1 : sekarang.getMonth();
        gambar();
        kalender.hidden = false;
        tombol.setAttribute("aria-expanded", "true");
        kalenderTerbuka = api;
        // Kalau kalender melewati tepi layar, geser: ke atas kolom (bawah penuh) atau rata kanan (kanan penuh)
        kalender.classList.remove("di-atas", "rata-kanan");
        var ukuran = kalender.getBoundingClientRect();
        if (ukuran.bottom > window.innerHeight && bungkus.getBoundingClientRect().top > ukuran.height) { kalender.classList.add("di-atas"); }
        if (ukuran.right > window.innerWidth) { kalender.classList.add("rata-kanan"); }
    }

    function tutup() {
        if (kalender.hidden) { return; }
        kalender.hidden = true;
        tombol.setAttribute("aria-expanded", "false");
        if (kalenderTerbuka === api) { kalenderTerbuka = null; }
    }

    var api = { bungkus: bungkus, tutup: tutup, buka: buka };
    tombol.addEventListener("click", function () { if (kalender.hidden) { buka(); } else { tutup(); } });
    return api;
}

// Klik di luar kalender yang terbuka, atau Esc, menutupnya
document.addEventListener("click", function (k) {
    if (!kalenderTerbuka) { return; }
    // Pakai jalur peristiwa yang dicatat saat klik terjadi: tombol di dalam kalender (misalnya « ‹ › ») dibuang dan
    // digambar ulang oleh kalender itu sendiri, jadi k.target sudah tidak terpasang lagi saat sampai ke sini.
    var jalur = k.composedPath ? k.composedPath() : [];
    var didalam = jalur.indexOf(kalenderTerbuka.bungkus) !== -1 || kalenderTerbuka.bungkus.contains(k.target);
    if (!didalam) { kalenderTerbuka.tutup(); }
});
document.addEventListener("keydown", function (k) {
    if (k.key === "Escape" && kalenderTerbuka) {
        var bungkus = kalenderTerbuka.bungkus;
        kalenderTerbuka.tutup();
        var kolom = bungkus.querySelector(".pt-tampil");
        if (kolom) { kolom.focus(); }
    }
});

// Pasang pada semua kolom tanggal yang ada
document.querySelectorAll('input[type="date"]').forEach(pasangPemilihTanggal);

// ---------- Pembatasan ----------
var KUNCI_PEMBATASAN = "pembatasanYayasan";

// Posisi awal sebelum pernah disimpan
var pembatasanBawaan = {
    akses: "bebas",          // "bebas" atau "semua"
    tanggal: "bebas",        // "bebas" atau "tertentu"
    tanggalKunci: "",        // contoh: "2026-09-30"
    masaDepan: true,         // true = tanggal yang belum berlangsung tidak bisa dipilih
    kasMinus: "tolak"        // pengeluaran yang membuat Kas/Bank minus: "tolak" atau "peringatan" (PRD 5.6)
};

function bacaPembatasan() {
    var hasil = bacaPengaturan(KUNCI_PEMBATASAN, pembatasanBawaan);
    // Tanggal kunci hanya dipakai kalau bentuknya benar ("2026-09-30"); isi rusak dianggap kosong
    if (!/^\d{4}-\d{2}-\d{2}$/.test(String(hasil.tanggalKunci))) { hasil.tanggalKunci = ""; }
    // Isi rusak atau belum pernah disimpan: pakai yang paling aman (ditolak)
    if (hasil.kasMinus !== "peringatan") { hasil.kasMinus = "tolak"; }
    return hasil;
}

// Tanggal hari ini dalam bentuk "2026-10-22" (sesuai jam di komputer pengguna)
function tanggalHariIni() {
    var sekarang = new Date();
    var bulan = String(sekarang.getMonth() + 1).padStart(2, "0");
    var hari = String(sekarang.getDate()).padStart(2, "0");
    return sekarang.getFullYear() + "-" + bulan + "-" + hari;
}

// "Tanggal mulai data" di Preferensi > Data ("YYYY-MM-DD"), atau "" kalau belum diisi atau isinya rusak
function tanggalMulaiDiatur() {
    var tglMulai = teksAman(bacaPengaturan(KUNCI_YAYASAN, {}).tglMulai);
    return /^\d{4}-\d{2}-\d{2}$/.test(tglMulai) ? tglMulai : "";
}

// ---- Fungsi untuk halaman transaksi ----
// Pasang pada kolom tanggal transaksi: aturBatasTanggal(kolomTanggal)
// Kalau pembatasan masa depan nyala, hari setelah hari ini tidak bisa dipilih. Hari sebelum tanggal mulai pembukuan
// juga tidak bisa dipilih (PRD 5.3), kecuali kolom yang bukan tanggal transaksi (misalnya Tanggal Masuk Karyawan):
// aturBatasTanggal(kolom, { tanpaBatasBawah: true }).
function aturBatasTanggal(kolomTanggal, pilihan) {
    if (bacaPembatasan().masaDepan) {
        kolomTanggal.max = tanggalHariIni();
    } else {
        kolomTanggal.removeAttribute("max");
    }
    var mulai = (pilihan && pilihan.tanpaBatasBawah) ? "" : tanggalMulaiDiatur();
    if (mulai) {
        kolomTanggal.min = mulai;
    } else {
        kolomTanggal.removeAttribute("min");
    }
}

// Apakah transaksi di tanggal ini (bentuk "2026-09-30") terkunci?
// Membandingkan teks tanggal "YYYY-MM-DD" sudah benar karena urutannya sama dengan urutan waktu.
function tanggalTerkunci(tanggal) {
    var batas = bacaPembatasan();
    return batas.tanggal === "tertentu" && batas.tanggalKunci !== "" && tanggal <= batas.tanggalKunci;
}

var kolomKunci = document.getElementById("batas-tanggal-kunci");
var radioAkses = document.querySelectorAll("input[name='batas-akses']");
var radioTanggal = document.querySelectorAll("input[name='batas-tanggal']");
var radioKasMinus = document.querySelectorAll("input[name='batas-kas-minus']");

// Pilih radio yang nilainya sama dengan "nilai" pada sekelompok radio
function pilihRadio(daftar, nilai) {
    daftar.forEach(function (r) { r.checked = (r.value === nilai); });
}

// Nilai radio yang sedang terpilih
function nilaiRadio(daftar) {
    var terpilih = Array.prototype.find.call(daftar, function (r) { return r.checked; });
    return terpilih ? terpilih.value : "";
}

// Kolom tanggal kunci hanya aktif kalau "Berdasarkan tanggal tertentu" dipilih
function perbaruiKolomKunci() {
    kolomKunci.disabled = (nilaiRadio(radioTanggal) !== "tertentu");
    document.getElementById("batas-tanggal-teks").textContent = formatTanggalTeks(kolomKunci.value);
}
radioTanggal.forEach(function (r) { r.addEventListener("change", perbaruiKolomKunci); });
kolomKunci.addEventListener("change", perbaruiKolomKunci);

// Isi formulir dari data tersimpan
var batasTersimpan = bacaPembatasan();
pilihRadio(radioAkses, batasTersimpan.akses);
pilihRadio(radioTanggal, batasTersimpan.tanggal);
kolomKunci.value = batasTersimpan.tanggalKunci;
document.getElementById("batas-masa-depan").checked = batasTersimpan.masaDepan;
pilihRadio(radioKasMinus, batasTersimpan.kasMinus);
perbaruiKolomKunci();

// Tombol Simpan
document.getElementById("form-pembatasan").addEventListener("submit", function (kejadian) {
    kejadian.preventDefault();
    var data = {
        akses: nilaiRadio(radioAkses),
        tanggal: nilaiRadio(radioTanggal),
        tanggalKunci: kolomKunci.value,
        masaDepan: document.getElementById("batas-masa-depan").checked,
        kasMinus: nilaiRadio(radioKasMinus) === "peringatan" ? "peringatan" : "tolak"
    };
    // Kalau memilih "tanggal tertentu" tetapi tanggalnya belum diisi, beri peringatan
    if (data.tanggal === "tertentu" && data.tanggalKunci === "") {
        tampilkanNotifikasi("Tanggal penguncian belum diisi.", "peringatan");
        return;
    }
    simpanPengaturan(KUNCI_PEMBATASAN, data, "Pembatasan telah berhasil disimpan", "Pembatasan");
});

// ---------- Lampiran ----------
var KUNCI_LAMPIRAN = "lampiranYayasan";

// Semua transaksi awalnya tidak wajib lampiran
var lampiranBawaan = {
    jurnal: false, gaji: false, donasi: false, pembayaran: false, penerimaan: false, transfer: false, pemindahan: false,
    aset: false, asetUbah: false, asetDisposisi: false
};

function bacaLampiran() {
    return bacaPengaturan(KUNCI_LAMPIRAN, lampiranBawaan);
}

// Fungsi untuk halaman transaksi: lampiranWajib("jurnal") -> true kalau wajib ada lampiran
function lampiranWajib(jenis) {
    return bacaLampiran()[jenis] === true;
}

var kotakLampiran = document.querySelectorAll("[data-lampiran]");

// Isi formulir dari data tersimpan. Kelompok Aset Tetap hanya tampil kalau fitur Aset nyala.
function isiFormulirLampiran() {
    var lampiran = bacaLampiran();
    kotakLampiran.forEach(function (kotak) {
        kotak.checked = (lampiran[kotak.dataset.lampiran] === true);
    });
    document.getElementById("lampiran-kelompok-aset").hidden = !fiturAktif("aset");
}
isiFormulirLampiran();

// Setiap kali bagian Lampiran dibuka, periksa ulang saklar Aset (bisa saja baru diubah di Fitur)
document.querySelector("[data-bagian='lampiran']").addEventListener("click", isiFormulirLampiran);

document.getElementById("form-lampiran").addEventListener("submit", function (kejadian) {
    kejadian.preventDefault();
    var data = {};
    kotakLampiran.forEach(function (kotak) {
        data[kotak.dataset.lampiran] = kotak.checked;
    });
    simpanPengaturan(KUNCI_LAMPIRAN, data, "Lampiran telah berhasil disimpan", "Lampiran");
});

// ---------- Akun Perkiraan ----------
var KUNCI_AKUN_PERKIRAAN = "akunPerkiraanYayasan";

// Daftar akun dibaca dari localStorage (diisi oleh halaman Akun Perkiraan, fitur/akun).
// Fungsi ini ada di sini, bukan di fitur/akun, karena Preferensi sudah memakainya saat halaman dimuat.
// Bentuk tiap akun: { id, kode: "110101", nama: "Kas Kecil", tipe: "kas-bank", indukId, ... } (lihat fitur/akun/akun.js).
// Selalu mengembalikan daftar; isi rusak atau bukan daftar dianggap kosong.
function bacaDaftarAkun() {
    return bacaDaftarTersimpan("daftarAkun");   // alat bersama di umum/alat.js
}

// Akun yang boleh dipilih di Preferensi. Sekarang semua akun boleh dipilih;
// fungsi ini dipisah supaya aturan penyaringan (misalnya menyembunyikan akun Non Aktif) bisa ditambah di satu tempat.
function bacaAkunPilihan() {
    return bacaDaftarAkun();
}

// Akun yang boleh dipilih sebagai Akun Beban di Gaji/Tunjangan: hanya akun bertipe Beban atau Beban Lainnya
function bacaAkunBeban() {
    return bacaDaftarAkun().filter(function (akun) { return akun.tipe === "beban" || akun.tipe === "beban-lain"; });
}

// Posisi awal: belum ada akun yang dihubungkan. Isinya kode akun.
// Akun donasi dipecah dua (PRD 6.1): donasiTerikat dan donasiTidakTerikat (dulu satu kolom "pendapatanDonasi").
// asetNetoTerikat dan asetNetoTidakTerikat: akun jurnal otomatis Pemindahan Dana (PRD 4.2), masing-masing satu akun.
var akunPerkiraanBawaan = { donasiTerikat: [], donasiTidakTerikat: [], pendapatanLain: [], kasBank: [], saldoAwal: [], asetNetoTerikat: [], asetNetoTidakTerikat: [] };

// Setiap kolom berisi daftar kode akun. Isi yang rusak (bukan daftar) diganti daftar kosong.
// Isi kolom lama "pendapatanDonasi" (kalau masih ada) dipindah ke donasiTidakTerikat, supaya tidak ada akun yang hilang;
// kolom lamanya dibuang dan ikut terhapus saat Preferensi disimpan berikutnya.
function bacaAkunPerkiraan() {
    var hasil = bacaPengaturan(KUNCI_AKUN_PERKIRAAN, akunPerkiraanBawaan);
    Object.keys(akunPerkiraanBawaan).forEach(function (kolom) {
        if (!Array.isArray(hasil[kolom])) { hasil[kolom] = []; }
    });
    if (Array.isArray(hasil.pendapatanDonasi)) {
        hasil.pendapatanDonasi.forEach(function (kode) {
            var sudahAda = hasil.donasiTidakTerikat.indexOf(kode) !== -1 || hasil.donasiTerikat.indexOf(kode) !== -1;
            if (typeof kode === "string" && !sudahAda) { hasil.donasiTidakTerikat.push(kode); }
        });
    }
    delete hasil.pendapatanDonasi;
    return hasil;
}

// Daftar akun lengkap (kode, nama, ...) yang dihubungkan di satu kolom Preferensi, misalnya akunPerkiraan("pendapatanLain").
/* exported akunPerkiraan */
function akunPerkiraan(kolom) {
    var kodeTerpilih = bacaAkunPerkiraan()[kolom] || [];
    return bacaDaftarAkun().filter(function (akun) {
        return kodeTerpilih.indexOf(akun.kode) !== -1;
    });
}

// Akun donasi = gabungan kolom Donasi Terikat dan Donasi Tidak Terikat (PRD 6.1). Dipakai formulir Donasi nanti.
/* exported akunDonasi */
function akunDonasi() {
    return akunPerkiraan("donasiTerikat").concat(akunPerkiraan("donasiTidakTerikat"));
}

// Sifat sebuah akun donasi menurut kolom Preferensi tempat kodenya dimasukkan:
// "terikat", "tidak-terikat", atau "" (belum diatur). Dipakai daftar Kategori Donasi dan laporan nanti.
/* exported sifatAkunDonasi */
function sifatAkunDonasi(kode) {
    var pilihan = bacaAkunPerkiraan();
    if (pilihan.donasiTerikat.indexOf(kode) !== -1) { return "terikat"; }
    if (pilihan.donasiTidakTerikat.indexOf(kode) !== -1) { return "tidak-terikat"; }
    return "";
}

// Akun Aset Neto yang dipilih di Preferensi (PRD 4.2), untuk jurnal otomatis Pemindahan Dana:
// akunAsetNeto("terikat") atau akunAsetNeto("tidak-terikat") -> data akun, atau null kalau belum dipilih / akunnya
// sudah tidak ada / bukan bertipe modal (isi rusak tidak dipakai).
// Akun induk (punya sub akun) juga tidak dipakai, walaupun sempat tersimpan (misalnya sub akunnya dibuat belakangan):
// yang dipakai hanya akun untuk jurnal (alat bersama akunUntukJurnal, umum/komponen-transaksi.js; dipanggil saat
// dibutuhkan, sesudah semua skrip dimuat).
/* exported akunAsetNeto */
function akunAsetNeto(sifat) {
    var akun = akunPerkiraan(sifat === "terikat" ? "asetNetoTerikat" : "asetNetoTidakTerikat")[0];
    var bolehJurnal = !!akun && akunUntukJurnal().some(function (a) { return a.id === akun.id; });
    return bolehJurnal && akun.tipe === "modal" ? akun : null;
}

// Salinan kerja: perubahan baru disimpan ke localStorage saat tombol Simpan ditekan
var pilihanAkun = bacaAkunPerkiraan();
var penggambarChip = [];   // kumpulan fungsi penggambar ulang, satu per kolom

function teksAkun(akun) {
    return "[" + akun.kode + "] " + akun.nama;
}

// Keluarkan satu kode akun dari semua kolom Akun Perkiraan. Dipakai saat akunnya dihapus lewat Kategori Donasi
// (PRD 6.1: akun otomatis keluar dari Preferensi). Yang dibersihkan dua: data tersimpan DAN salinan kerja halaman ini
// (pilihanAkun), supaya kode akun yang sudah dihapus tidak tersimpan lagi saat tombol Simpan Preferensi ditekan.
// Kode akun lain tidak disentuh. Hasil: false kalau penyimpanan gagal.
/* exported keluarkanAkunDariPreferensi */
function keluarkanAkunDariPreferensi(kode) {
    function buang(data) {
        var ada = false;
        Object.keys(data).forEach(function (kolom) {
            if (Array.isArray(data[kolom]) && data[kolom].indexOf(kode) !== -1) {
                data[kolom] = data[kolom].filter(function (k) { return k !== kode; });
                ada = true;
            }
        });
        return ada;
    }
    var tersimpan = bacaAkunPerkiraan();
    if (buang(tersimpan)) {
        try {
            localStorage.setItem(KUNCI_AKUN_PERKIRAAN, JSON.stringify(tersimpan));
        } catch (galat) {
            tampilkanNotifikasi("Gagal mengeluarkan akun dari Preferensi. Penyimpanan browser penuh atau diblokir.", "galat");
            return false;
        }
        catatLog({ tindakan: "Ubah", tipe: "Preferensi", referensi: "Akun Perkiraan (akun " + kode + " dikeluarkan)" });
    }
    buang(pilihanAkun);
    penggambarChip.forEach(function (gambar) { gambar(); });
    return true;
}

// Setiap kolom akun diberi kemampuan: tampil label terpilih, cari, tambah, hapus
document.querySelectorAll(".pemilih-akun").forEach(function (pemilih) {
    var kolom = pemilih.dataset.kolom;
    var pasangan = pemilih.dataset.pasangan || "";   // kolom lain yang tidak boleh berisi akun yang sama (misalnya Donasi Terikat <-> Tidak Terikat)
    var maks = Number(pemilih.dataset.maks);   // 0 = tidak dibatasi
    // (boleh tidak ada) hanya akun bertipe ini yang ditawarkan, misalnya "modal". Kolom bertipe dipakai jurnal otomatis
    // (Aset Neto, PRD 4.2), jadi akun induk (yang punya sub akun) juga tidak ditawarkan: jurnal selalu di akun paling bawah.
    var tipeBoleh = pemilih.dataset.tipe || "";
    var wadahChip = pemilih.querySelector(".pemilih-chip");
    var kolomCari = pemilih.querySelector(".pemilih-cari");
    var daftar = pemilih.querySelector(".pemilih-daftar");

    // Gambar label (chip) akun yang sudah dipilih, masing-masing dengan tombol hapus
    function gambarChip() {
        wadahChip.textContent = "";
        var semuaAkun = bacaDaftarAkun();
        pilihanAkun[kolom].forEach(function (kode) {
            var akun = semuaAkun.find(function (a) { return a.kode === kode; });
            // Kalau akunnya sudah dihapus dari Daftar Akun, tetap tampil supaya bisa dibuang (alat bersama buatChip, umum/alat.js)
            var teks = akun ? teksAkun(akun) : "[" + kode + "] (akun tidak ditemukan)";
            wadahChip.appendChild(buatChip(teks, "Hapus akun " + kode, function () {
                pilihanAkun[kolom] = pilihanAkun[kolom].filter(function (k) { return k !== kode; });
                gambarChip();
            }));
        });
    }

    // Pilih satu akun. Kalau kolom hanya boleh satu akun, akun lama diganti.
    function tambahAkun(kode) {
        if (maks === 1) {
            pilihanAkun[kolom] = [kode];
        } else {
            pilihanAkun[kolom].push(kode);
        }
        kolomCari.value = "";
        daftar.hidden = true;
        gambarChip();
    }

    // Gambar daftar akun yang bisa dipilih, disaring dengan kata yang diketik
    function gambarDaftar() {
        var semuaAkun = bacaAkunPilihan();
        var kata = kolomCari.value.trim().toLowerCase();
        daftar.textContent = "";

        function barisInfo(teks) {
            var li = document.createElement("li");
            li.className = "pemilih-info";
            li.textContent = teks;
            daftar.appendChild(li);
        }

        if (semuaAkun.length === 0) {
            barisInfo("Belum ada akun. Tambahkan lewat Daftar Akun.");
        } else {
            // Akun yang sudah ada di kolom ini, atau di kolom pasangannya, tidak ditawarkan lagi
            var dipakaiPasangan = pasangan ? pilihanAkun[pasangan] : [];
            // Kolom bertipe: hanya akun tanpa sub akun (alat bersama akunUntukJurnal)
            var bolehJurnal = tipeBoleh ? akunUntukJurnal().map(function (a) { return a.id; }) : [];
            var cocok = semuaAkun.filter(function (akun) {
                return pilihanAkun[kolom].indexOf(akun.kode) === -1
                    && dipakaiPasangan.indexOf(akun.kode) === -1
                    && (!tipeBoleh || (akun.tipe === tipeBoleh && bolehJurnal.indexOf(akun.id) !== -1))
                    && teksAkun(akun).toLowerCase().indexOf(kata) !== -1;
            }).slice(0, 50);   // paling banyak 50 baris supaya daftar tidak terlalu panjang
            if (cocok.length === 0) {
                barisInfo("Tidak ada akun yang cocok.");
            }
            cocok.forEach(function (akun) {
                var li = document.createElement("li");
                var tombol = document.createElement("button");
                tombol.type = "button";
                tombol.className = "pemilih-pilihan";
                tombol.textContent = teksAkun(akun);
                tombol.addEventListener("click", function () { tambahAkun(akun.kode); });
                li.appendChild(tombol);
                daftar.appendChild(li);
            });
        }
        daftar.hidden = false;
    }

    kolomCari.addEventListener("focus", gambarDaftar);
    kolomCari.addEventListener("input", gambarDaftar);
    penggambarChip.push(gambarChip);
    gambarChip();
});

// Klik di luar sebuah kolom akun -> daftar pilihan di kolom itu menutup
document.addEventListener("click", function (kejadian) {
    document.querySelectorAll(".pemilih-daftar").forEach(function (daftar) {
        if (!daftar.parentElement.contains(kejadian.target)) {
            daftar.hidden = true;
        }
    });
});

// Tombol Esc menutup semua daftar pilihan
document.addEventListener("keydown", function (kejadian) {
    if (kejadian.key === "Escape") {
        document.querySelectorAll(".pemilih-daftar").forEach(function (daftar) {
            daftar.hidden = true;
        });
    }
});

// Setiap kali bagian Akun Perkiraan dibuka, gambar ulang label (akun bisa saja baru berubah di Daftar Akun)
document.querySelector("[data-bagian='akun']").addEventListener("click", function () {
    penggambarChip.forEach(function (gambar) { gambar(); });
});

// Tombol Simpan
document.getElementById("form-akun-perkiraan").addEventListener("submit", function (kejadian) {
    kejadian.preventDefault();
    simpanPengaturan(KUNCI_AKUN_PERKIRAAN, pilihanAkun, "Akun perkiraan telah berhasil disimpan", "Akun Perkiraan");
});

// ---------- Format angka dan tanggal (Lain-lain) ----------
var KUNCI_FORMAT = "formatYayasan";

// Posisi awal sesuai keputusan: Indonesia, tanpa desimal, tanggal berbentuk teks
var formatBawaan = {
    format: "indonesia",    // "indonesia" (9.999,9) atau "internasional" (9,999.9)
    desimal: 0,             // jumlah angka di belakang koma: 0, 1, atau 2
    mode: "jika-ada",       // "jika-ada" atau "selalu"
    tanggal: "teks"         // "teks", "angka", atau "iso"
};

// Nilai yang tidak dikenal (isi rusak) diganti nilai bawaan, supaya semua angka dan tanggal di aplikasi tetap tampil.
// Penting: desimal di luar 0-2 akan membuat toFixed() gagal dan semua angka Rupiah tidak tampil.
function bacaFormat() {
    var hasil = bacaPengaturan(KUNCI_FORMAT, formatBawaan);
    hasil.desimal = Number(hasil.desimal);
    if ([0, 1, 2].indexOf(hasil.desimal) === -1) { hasil.desimal = formatBawaan.desimal; }
    if (["indonesia", "internasional"].indexOf(hasil.format) === -1) { hasil.format = formatBawaan.format; }
    if (["jika-ada", "selalu"].indexOf(hasil.mode) === -1) { hasil.mode = formatBawaan.mode; }
    if (["teks", "angka", "iso"].indexOf(hasil.tanggal) === -1) { hasil.tanggal = formatBawaan.tanggal; }
    return hasil;
}

// ---- Fungsi untuk semua halaman: tampilkan angka dan tanggal sesuai pengaturan ----
// formatAngka(1234567.5)  -> "1.234.568" (sesuai pengaturan)
// formatRupiah(1234567)   -> "Rp 1.234.567"
// formatTanggal("2026-10-22") -> "22 Okt 2026"
function formatAngka(nilai, pengaturan) {
    var p = pengaturan || bacaFormat();
    var angka = Number(nilai) || 0;
    var teks = Math.abs(angka).toFixed(p.desimal);   // contoh: "1234567.50"
    // "Jika ada desimal": buang nol di belakang koma (1000.50 -> 1000.5, 1000.00 -> 1000)
    if (p.mode === "jika-ada" && p.desimal > 0) {
        teks = teks.replace(/\.?0+$/, "");
    }
    var bagian = teks.split(".");
    var pemisahRibuan = (p.format === "indonesia") ? "." : ",";
    var pemisahDesimal = (p.format === "indonesia") ? "," : ".";
    // Sisipkan pemisah ribuan setiap tiga angka dari belakang
    var bulat = bagian[0].replace(/\B(?=(\d{3})+(?!\d))/g, pemisahRibuan);
    var hasil = bagian.length > 1 ? bulat + pemisahDesimal + bagian[1] : bulat;
    return (angka < 0 ? "-" : "") + hasil;
}

function formatRupiah(nilai, pengaturan) {
    return "Rp " + formatAngka(nilai, pengaturan);
}

function formatTanggal(iso, pengaturan) {
    if (!iso) { return ""; }
    // Bukan bentuk "YYYY-MM-DD" (misalnya data rusak): tampilkan apa adanya, jangan "NaN undefined"
    if (!/^\d{4}-(0[1-9]|1[0-2])-\d{2}$/.test(String(iso))) { return String(iso); }
    var p = pengaturan || bacaFormat();
    var bagian = iso.split("-");   // [tahun, bulan, hari]
    var bulan = NAMA_BULAN_SINGKAT;
    if (p.tanggal === "angka") {
        return bagian[2] + "/" + bagian[1] + "/" + bagian[0];
    }
    if (p.tanggal === "iso") {
        return iso;
    }
    return Number(bagian[2]) + " " + bulan[Number(bagian[1]) - 1] + " " + bagian[0];
}

var pilihFormat = document.getElementById("format-desimal");
var pilihOpsiDesimal = document.getElementById("format-opsi-desimal");
var pilihModeDesimal = document.getElementById("format-mode-desimal");
var pilihFormatTanggal = document.getElementById("format-tanggal");

// Baca pilihan yang sedang tampil di formulir (belum tentu sudah disimpan)
function formatDariFormulir() {
    return {
        format: pilihFormat.value,
        desimal: Number(pilihOpsiDesimal.value),
        mode: pilihModeDesimal.value,
        tanggal: pilihFormatTanggal.value
    };
}

// Perbarui kotak contoh sesuai pilihan di formulir, sebelum disimpan
function perbaruiContohFormat() {
    var p = formatDariFormulir();
    document.getElementById("contoh-angka").textContent = formatRupiah(1234567.5, p);
    document.getElementById("contoh-tanggal").textContent = formatTanggal(tanggalHariIni(), p);
}

[pilihFormat, pilihOpsiDesimal, pilihModeDesimal, pilihFormatTanggal].forEach(function (pilih) {
    pilih.addEventListener("change", perbaruiContohFormat);
});

// Isi formulir dari data tersimpan
var formatTersimpan = bacaFormat();
pilihFormat.value = formatTersimpan.format;
pilihOpsiDesimal.value = String(formatTersimpan.desimal);
pilihModeDesimal.value = formatTersimpan.mode;
pilihFormatTanggal.value = formatTersimpan.tanggal;
perbaruiContohFormat();

document.getElementById("form-format").addEventListener("submit", function (kejadian) {
    kejadian.preventDefault();
    simpanPengaturan(KUNCI_FORMAT, formatDariFormulir(), "Format telah berhasil disimpan", "Lain-lain (Format)");
});
