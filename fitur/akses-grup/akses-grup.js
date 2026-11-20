// ==================== Akses Grup (Pengaturan) ====================
// Halaman Akses Grup (PRD 6.14, seperti Accurate): kumpulan hak menu untuk pengguna Operator. Hanya Administrator yang
// membukanya (HALAMAN_ADMINISTRATOR, umum/sesi.js). Di J.30 hak baru DISIMPAN; penerapannya ke menu dan tombol di J.31.
//   - Tab Umum: Nama Grup (wajib, unik), Pembatasan Akses, Daftar Pengguna (Operator; satu pengguna satu grup).
//   - Tab Hak Akses: kelompok menu di kiri; Cari, Salin Hak, dan tabel centang Aktif/Buat/Ubah/Hapus/Lihat.
// Anggota grup disimpan di data PENGGUNA (isian aksesGrupId), bukan di grup, supaya satu pengguna pasti hanya punya satu grup.
// Menyimpan grup = menyimpan daftar Pengguna (anggota) lalu daftar Akses Grup; kalau yang kedua gagal, yang pertama dikembalikan.
// Daftar menu dan pembersih hak: umum/hak-akses.js. HTML: fitur/akses-grup/tampilan.js.
// Dimuat sesudah fitur/pengaturan/pengaturan.js (memakai modulPengguna, catatLog).
// Semua nama (var dan function) di sini tetap bisa dipakai skrip lain, karena skrip biasa berbagi satu ruang nama.

var kolomNamaAg = document.getElementById("ag-nama");
var galatNamaAg = document.getElementById("galat-ag-nama");
var kolomCariAg = document.getElementById("ag-cari");
var pilihSalinAg = document.getElementById("ag-salin-dari");
var badanHakAg = document.getElementById("ag-badan-hak");
var barisSemuaAg = document.getElementById("ag-baris-semua");
var wadahKelompokAg = document.getElementById("ag-kelompok");
var kelompokAktifAg = KELOMPOK_HAK_MENU[0].nama;   // kelompok menu yang sedang tampil di tab Hak Akses

// ----- Bagian 1: tabel Hak Akses (dibuat sekali dari daftar menu) -----
// Id kotak centang: ag-hak-KUNCIMENU-JENISHAK. Karena ber-id, isinya ikut diingat per tab dokumen oleh buatModulDaftar.
function idCentangHakAg(kunci, jenis) { return "ag-hak-" + kunci + "-" + jenis; }

function buatCentangAg(label) {
    var c = document.createElement("input");
    c.type = "checkbox";
    c.setAttribute("aria-label", label);
    return c;
}

(function gambarTabelHakAg() {
    // Baris "Pilih semua": satu centang per kolom, TANPA id (tidak boleh ikut dikembalikan per tab, karena
    // mengembalikannya akan mencentang ulang semua baris)
    var judulSemua = document.createElement("th");
    judulSemua.scope = "row";
    judulSemua.textContent = "Pilih semua";
    barisSemuaAg.appendChild(judulSemua);
    JENIS_HAK.forEach(function (jenis) {
        var sel = document.createElement("th");
        var c = buatCentangAg("Pilih semua " + NAMA_HAK[jenis]);
        c.dataset.semua = jenis;
        sel.appendChild(c);
        barisSemuaAg.appendChild(sel);
    });

    KELOMPOK_HAK_MENU.forEach(function (kelompok) {
        // Tombol kelompok di kiri
        var tombol = document.createElement("button");
        tombol.type = "button";
        tombol.textContent = kelompok.nama;
        tombol.dataset.kelompok = kelompok.nama;
        tombol.setAttribute("aria-pressed", "false");
        wadahKelompokAg.appendChild(tombol);

        // Judul kelompok di tabel: hanya tampil saat mencari (hasil cari bisa dari beberapa kelompok)
        var judul = document.createElement("tr");
        judul.className = "hak-judul-kelompok";
        judul.dataset.judulKelompok = kelompok.nama;
        var selJudul = document.createElement("th");
        selJudul.colSpan = 6;
        selJudul.textContent = kelompok.nama;
        judul.appendChild(selJudul);
        badanHakAg.appendChild(judul);

        kelompok.menu.forEach(function (menu) {
            var tr = document.createElement("tr");
            tr.dataset.menu = menu.kunci;
            tr.dataset.kelompok = kelompok.nama;
            var nama = document.createElement("th");
            nama.scope = "row";
            nama.textContent = menu.nama;
            tr.appendChild(nama);
            // Tiap menu hanya menampilkan centang yang berlaku untuknya (PRD 6.14)
            JENIS_HAK.forEach(function (jenis) {
                var sel = document.createElement("td");
                if (menu.hak.indexOf(jenis) !== -1) {
                    var c = buatCentangAg(menu.nama + ": " + NAMA_HAK[jenis]);
                    c.id = idCentangHakAg(menu.kunci, jenis);
                    c.dataset.menu = menu.kunci;
                    c.dataset.hak = jenis;
                    sel.appendChild(c);
                }
                tr.appendChild(sel);
            });
            badanHakAg.appendChild(tr);
        });
    });
})();

// Kotak centang hak di satu baris menu (yang ada saja)
function centangBarisAg(tr) { return Array.prototype.slice.call(tr.querySelectorAll("input[data-hak]")); }

// Aturan satu baris (PRD 6.14): Buat/Ubah/Hapus/Lihat hanya berlaku kalau Aktif dicentang.
// Mencentang salah satunya ikut mencentang Aktif; melepas Aktif ikut melepas semuanya.
function rapikanBarisAg(tr, jenisDiubah) {
    var aktif = tr.querySelector("input[data-hak='aktif']");
    var lain = centangBarisAg(tr).filter(function (c) { return c.dataset.hak !== "aktif"; });
    if (jenisDiubah === "aktif") {
        if (!aktif.checked) { lain.forEach(function (c) { c.checked = false; }); }
    } else if (lain.some(function (c) { return c.checked; })) {
        aktif.checked = true;
    }
}

// Baris menu yang sedang tampil
function barisTampilAg() {
    return Array.prototype.filter.call(badanHakAg.querySelectorAll("tr[data-menu]"), function (tr) { return !tr.hidden; });
}

// Centang "Pilih semua" mengikuti baris yang tampil: penuh, sebagian (strip), atau kosong; mati kalau kolom itu tidak berlaku
function perbaruiPilihSemuaAg() {
    var tampil = barisTampilAg();
    barisSemuaAg.querySelectorAll("input[data-semua]").forEach(function (semua) {
        var kotak = [];
        tampil.forEach(function (tr) {
            var c = tr.querySelector("input[data-hak='" + semua.dataset.semua + "']");
            if (c) { kotak.push(c); }
        });
        var jumlahCentang = kotak.filter(function (c) { return c.checked; }).length;
        semua.disabled = kotak.length === 0;
        semua.checked = kotak.length > 0 && jumlahCentang === kotak.length;
        semua.indeterminate = jumlahCentang > 0 && jumlahCentang < kotak.length;
    });
}

// Menampilkan baris: tanpa kata cari = menu kelompok yang dipilih; dengan kata cari = menu yang namanya cocok dari semua kelompok
function tampilkanBarisHakAg() {
    var kata = kolomCariAg.value.trim().toLowerCase();
    var adaPerKelompok = {};
    badanHakAg.querySelectorAll("tr[data-menu]").forEach(function (tr) {
        var nama = MENU_HAK[tr.dataset.menu].nama.toLowerCase();
        var tampil = kata ? nama.indexOf(kata) !== -1 : tr.dataset.kelompok === kelompokAktifAg;
        tr.hidden = !tampil;
        if (tampil) { adaPerKelompok[tr.dataset.kelompok] = true; }
    });
    badanHakAg.querySelectorAll("tr[data-judul-kelompok]").forEach(function (tr) {
        tr.hidden = !(kata && adaPerKelompok[tr.dataset.judulKelompok]);
    });
    wadahKelompokAg.querySelectorAll("button").forEach(function (b) {
        b.setAttribute("aria-pressed", !kata && b.dataset.kelompok === kelompokAktifAg ? "true" : "false");
    });
    document.getElementById("ag-hak-kosong").hidden = Object.keys(adaPerKelompok).length > 0;
    perbaruiPilihSemuaAg();
}

wadahKelompokAg.addEventListener("click", function (k) {
    var tombol = k.target.closest("button[data-kelompok]");
    if (!tombol) { return; }
    kelompokAktifAg = tombol.dataset.kelompok;
    kolomCariAg.value = "";   // memilih kelompok = berhenti mencari
    tampilkanBarisHakAg();
});
kolomCariAg.addEventListener("input", tampilkanBarisHakAg);
// Enter di kotak Cari tidak boleh menyimpan formulir
kolomCariAg.addEventListener("keydown", function (k) { if (k.key === "Enter") { k.preventDefault(); } });

badanHakAg.addEventListener("change", function (k) {
    var c = k.target;
    if (!c.dataset || !c.dataset.hak) { return; }
    rapikanBarisAg(c.closest("tr"), c.dataset.hak);
    perbaruiPilihSemuaAg();
});

// Pilih semua: berlaku untuk baris yang sedang tampil saja
barisSemuaAg.addEventListener("change", function (k) {
    var semua = k.target;
    if (!semua.dataset || !semua.dataset.semua) { return; }
    barisTampilAg().forEach(function (tr) {
        var c = tr.querySelector("input[data-hak='" + semua.dataset.semua + "']");
        if (!c) { return; }
        c.checked = semua.checked;
        rapikanBarisAg(tr, semua.dataset.semua);
    });
    perbaruiPilihSemuaAg();
});

// Hak dari isi tabel (sudah dibersihkan)
function hakDariFormAg() {
    var hak = {};
    badanHakAg.querySelectorAll("input[data-hak]").forEach(function (c) {
        if (!c.checked) { return; }
        (hak[c.dataset.menu] = hak[c.dataset.menu] || []).push(c.dataset.hak);
    });
    return bersihkanHakGrup(hak);
}

// Mengisi tabel dari hak tersimpan (data rusak dibersihkan lebih dulu)
function tetapkanHakFormAg(hak) {
    var bersih = bersihkanHakGrup(hak);
    badanHakAg.querySelectorAll("input[data-hak]").forEach(function (c) {
        c.checked = !!bersih[c.dataset.menu] && bersih[c.dataset.menu].indexOf(c.dataset.hak) !== -1;
    });
    perbaruiPilihSemuaAg();
}

// ----- Bagian 2: Daftar Pengguna (anggota grup) -----
// Pengguna Operator yang bisa dipilih (Administrator memiliki semua akses, jadi tidak memakai grup)
function operatorAg() {
    return bacaPenggunaTersimpan().filter(function (p) { return p && typeof p.id === "string" && jenisAksesPengguna(p) === "operator"; });
}

// Anggota satu grup (id pengguna)
function anggotaGrupAg(idGrup) {
    return operatorAg().filter(function (p) { return p.aksesGrupId === idGrup; }).map(function (p) { return p.id; });
}

// Nama anggota satu grup untuk kolom Daftar Pengguna dan Log Aktivitas
function namaAnggotaGrupAg(idGrup, daftarPengguna) {
    return (daftarPengguna || operatorAg()).filter(function (p) { return p.aksesGrupId === idGrup && jenisAksesPengguna(p) === "operator"; })
        .map(function (p) { return teksAman(p.nama); }).sort(function (a, b) { return a.localeCompare(b, "id"); }).join(", ");
}

var pemilihPenggunaAg = buatPemilihBanyak({
    wadah: document.getElementById("ag-pengguna"),
    ambilData: function () {
        var idSaatIni = typeof modulAksesGrup === "undefined" ? null : modulAksesGrup.idDiubah;
        return operatorAg().map(function (p) {
            var teks = teksAman(p.nama) + " (" + teksAman(p.username) + ")";
            if (p.nonAktif) { teks += " - Non Aktif"; }
            // Pengguna di grup lain ditandai, supaya jelas bahwa memilihnya memindahkan dari grup lamanya
            var grupLain = p.aksesGrupId && p.aksesGrupId !== idSaatIni ? namaAksesGrup(p.aksesGrupId) : "";
            if (grupLain) { teks += " - sekarang di grup " + grupLain; }
            return { nilai: p.id, teks: teks };
        });
    }
});

// ----- Bagian 3: Salin Hak dari grup lain -----
function isiPilihanSalinAg() {
    var idSaatIni = typeof modulAksesGrup === "undefined" ? null : modulAksesGrup.idDiubah;
    var lain = bacaAksesGrup().filter(function (g) { return g.id !== idSaatIni; })
        .sort(function (a, b) { return teksAman(a.nama).localeCompare(teksAman(b.nama), "id"); });
    isiPilihan(pilihSalinAg, lain, {
        teks: function (g) { return teksAman(g.nama); },
        kosong: "Salin hak dari grup...",
        kosongKalauTakAda: "Belum ada grup lain",
        terpilih: pilihSalinAg.value,
        nonaktifKalauKosong: true
    });
    document.getElementById("ag-salin").disabled = lain.length === 0;
}

document.getElementById("ag-salin").addEventListener("click", function () {
    var sumber = bacaAksesGrup().find(function (g) { return g.id === pilihSalinAg.value; });
    if (!sumber) {
        tampilkanNotifikasi("Pilih dulu grup yang haknya akan disalin.", "peringatan");
        pilihSalinAg.focus();
        return;
    }
    // Hanya mengisi tabel; baru tersimpan saat tombol Simpan diklik
    tetapkanHakFormAg(sumber.hak);
    tampilkanNotifikasi("Hak Akses dari grup " + teksAman(sumber.nama) + " sudah disalin. Klik Simpan untuk menyimpannya.");
});

// ----- Bagian 4: modul daftar -----
var labelAksesGrup = { nama: "Nama Grup", pengguna: "Daftar Pengguna", hak: "Hak Akses" };

var modulAksesGrup = buatModulDaftar({
    id: "akses-grup",
    judul: "Akses Grup",
    kunci: "daftarAksesGrup",
    labelData: labelAksesGrup,
    formatData: { hak: teksHakGrup },
    kolom: [
        { kunci: "nama", judul: "Nama Grup" },
        { kunci: "pengguna", judul: "Daftar Pengguna", tampil: function (g) { return namaAnggotaGrupAg(g.id) || "-"; } }
    ],
    pesanKosong: "Belum ada akses grup. Klik tombol + untuk membuat.",
    // Isi tabel dan anggota yang belum disimpan ikut diingat per tab dokumen (anggota tersimpan di memori pemilih)
    keadaanTambahan: {
        ambil: function () { return pemilihPenggunaAg.nilai(); },
        pakai: function (nilai) { pemilihPenggunaAg.tetapkan(nilai); }
    },
    saatTampil: function () { isiPilihanSalinAg(); },
    isiForm: function (grup) {
        kolomNamaAg.value = grup ? teksAman(grup.nama) : "";
        document.getElementById("ag-pembatasan-preferensi").checked = true;
        pemilihPenggunaAg.tetapkan(grup ? anggotaGrupAg(grup.id) : []);
        tetapkanHakFormAg(grup ? grup.hak : {});
        kolomCariAg.value = "";
        pilihSalinAg.value = "";
        isiPilihanSalinAg();
        tampilkanBarisHakAg();
        galatNamaAg.hidden = true;
        document.querySelector("#isi-akses-grup [data-subtab='ag-umum']").click();   // selalu mulai di tab Umum
    },
    // Grup yang masih punya anggota tidak bisa dihapus, supaya pengguna tidak tiba-tiba kehilangan haknya
    alasanTolakHapus: function (grup) {
        var jumlah = anggotaGrupAg(grup.id).length;
        return jumlah ? 'Grup "' + teksAman(grup.nama) + '" masih dipakai ' + jumlah + " pengguna. Keluarkan dulu penggunanya di tab Umum." : "";
    }
});

kolomNamaAg.addEventListener("input", function () { galatNamaAg.hidden = true; });

// ----- Bagian 5: Simpan -----
document.getElementById("form-akses-grup").addEventListener("submit", function (kejadian) {
    kejadian.preventDefault();
    galatNamaAg.hidden = true;
    var idLama = modulAksesGrup.idDiubah;
    var daftarGrup = modulAksesGrup.ambil();
    var lama = idLama ? daftarGrup.find(function (g) { return g.id === idLama; }) || null : null;
    var nama = kolomNamaAg.value.trim();

    function galatNama(pesan) {
        galatNamaAg.textContent = pesan;
        galatNamaAg.hidden = false;
        document.querySelector("#isi-akses-grup [data-subtab='ag-umum']").click();
        kolomNamaAg.focus();
    }
    if (nama === "") { galatNama("Nama Grup wajib diisi."); return; }
    if (daftarGrup.some(function (g) { return g.id !== idLama && teksAman(g.nama).toLowerCase() === nama.toLowerCase(); })) {
        galatNama("Nama Grup sudah dipakai grup lain.");
        return;
    }

    var grup = { id: idLama || buatId("ag"), nama: nama, pembatasan: "preferensi", hak: hakDariFormAg() };

    // Anggota: hanya Operator yang masih ada. Yang dipilih masuk grup ini (pindah dari grup lamanya); anggota lama yang
    // dilepas menjadi tanpa grup.
    var daftarPengguna = modulPengguna.ambil();
    var awalPengguna = JSON.stringify(daftarPengguna);
    var namaAnggotaLama = lama ? namaAnggotaGrupAg(lama.id, daftarPengguna) : "";
    var dipilih = pemilihPenggunaAg.nilai();
    var penggunaBerubah = false;
    daftarPengguna.forEach(function (p) {
        var masuk = dipilih.indexOf(p.id) !== -1 && jenisAksesPengguna(p) === "operator";
        if (masuk && p.aksesGrupId !== grup.id) { p.aksesGrupId = grup.id; penggunaBerubah = true; }
        if (!masuk && p.aksesGrupId === grup.id) { delete p.aksesGrupId; penggunaBerubah = true; }
    });

    if (penggunaBerubah && !modulPengguna.simpan(daftarPengguna)) { return; }
    var daftarBaru = lama ? daftarGrup.map(function (g) { return g.id === lama.id ? grup : g; }) : daftarGrup.concat([grup]);
    if (!modulAksesGrup.simpan(daftarBaru)) {
        // Grup gagal disimpan: anggota dikembalikan seperti semula, supaya pengguna tidak menunjuk ke grup yang tidak ada
        if (penggunaBerubah) { try { localStorage.setItem("daftarPengguna", awalPengguna); } catch (galat) { /* pesan gagal sudah tampil */ } }
        return;
    }
    modulPengguna.gambarTabel();
    // Log Aktivitas: Daftar Pengguna ditulis sebagai nama, supaya perubahan anggota terlihat di tab Pemeriksaan
    var untukLog = Object.assign({}, grup, { pengguna: namaAnggotaGrupAg(grup.id, daftarPengguna) });
    var lamaUntukLog = lama ? Object.assign({}, lama, { pengguna: namaAnggotaLama }) : null;
    modulAksesGrup.selesaiSimpan(!!lama, untukLog, lamaUntukLog);
    if (!lama) { kolomNamaAg.focus(); }
});

// Setiap tab dibuka: kolom Daftar Pengguna dan pilihan Salin Hak mengikuti data terbaru (pengguna bisa berubah di halaman Pengguna)
saatTabDibuka["akses-grup"] = function () {
    isiPilihanSalinAg();
    modulAksesGrup.gambarTabel();
};

// Dipanggil dari popup Pengaturan, kotak Akses Grup
function bukaAksesGrupBaru() {
    modulAksesGrup.bukaDariMenu();
    kolomNamaAg.focus();
}
