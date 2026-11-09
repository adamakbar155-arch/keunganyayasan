// ==================== Pemilih opsi: kotak pilihan berlabel yang bisa dicari ====================
// Semua kotak pilihan (<select>) isian formulir dan popup tampil sebagai kolom cari/pilih: pilihan terpilih menjadi
// label "[kode] Nama ×" di dalam kolom, dan klik kolom membuka daftar pilihan yang bisa disaring dengan mengetik
// (PRD 5.1, keputusan pengguna 2026-10-28; seperti Accurate).
// Polanya sama dengan kalender (pasangPemilihTanggal di umum/preferensi.js): kotak pilihan ASLI tetap ada di halaman
// (disembunyikan), jadi kode fitur tetap membaca/menulis .value, .selectedIndex, .disabled, mengisi <option> lewat
// isiPilihan, memanggil .focus(), dan mendengarkan "change" seperti biasa. Komponen ini hanya menyinkronkan tampilannya.
// Memakai alat bersama buatKolomCari dan buatChipPilihan (umum/komponen-transaksi.js), dan buatChip (umum/alat.js).
// Dimuat sesudah umum/komponen-transaksi.js dan SEBELUM skrip fitur, saat semua HTML tampilan sudah terpasang.
//
// Aturan label:
//   - Pilihan bernilai "" (misalnya "Pilih Divisi...", "(Tanpa Program)") menjadi tulisan petunjuk saat tidak ada label.
//   - Tombol × hanya ada kalau kotak pilihan punya pilihan kosong itu; × mengembalikan ke pilihan kosong.
//     Kotak pilihan tanpa pilihan kosong (misalnya Cara Bayar, Tipe Akun) selalu berisi, jadi labelnya tanpa ×.
//   - Tulisan pilihan "11010101 - Kas Kecil" atau "410101 Donasi" menjadi label "[11010101] Kas Kecil" / "[410101] Donasi";
//     tanda "- " penunjuk tingkat di depan (misalnya Sub dari Kategori Donasi) dibuang dari label.
//   - Mengetik hanya menyaring daftar; pilihan lama tetap dipakai kalau kolom ditinggalkan tanpa memilih.
// Tidak diubah (PRD 5.1): filter di atas daftar dan pilihan di editor Desain Cetakan.

var PEMILIH_OPSI_DIKECUALIKAN = ".pilih-filter, #ec-penanda, #ec-kertas-pilih, #ec-orientasi";

// Kotak pilihan yang sudah diubah: kotak asli -> { segarkan, nonaktif(v), fokus(opsi) }
var pemilihOpsiTerdaftar = new WeakMap();
// Nilai asli (bawaan browser) dari .value, .selectedIndex, .disabled pada <select>
var deskSelect = {};

// Penyinkron dipasang SEKALI di prototipe <select> (bukan pada tiap elemen seperti kalender), karena sebagian browser dan
// alat uji membungkus <select> dengan objek khusus yang mengabaikan penimpa yang dipasang langsung pada elemennya.
// <select> yang tidak terdaftar (misalnya filter daftar) tetap bekerja persis seperti bawaan.
(function () {
    var proto = HTMLSelectElement.prototype;
    ["value", "selectedIndex", "disabled"].forEach(function (nama) {
        var desk = Object.getOwnPropertyDescriptor(proto, nama);
        deskSelect[nama] = desk;
        Object.defineProperty(proto, nama, {
            configurable: true,
            enumerable: desk.enumerable,
            get: desk.get,
            set: function (v) {
                desk.set.call(this, v);
                var api = pemilihOpsiTerdaftar.get(this);
                if (!api) { return; }
                if (nama === "disabled") { api.nonaktif(!!v); } else { api.segarkan(); }
            }
        });
    });
    var fokusAsli = proto.focus;
    // Kotak asli tersembunyi: fokus dialihkan ke kolom yang terlihat
    proto.focus = function (opsi) {
        var api = pemilihOpsiTerdaftar.get(this);
        if (api) { api.fokus(opsi); } else { fokusAsli.call(this, opsi); }
    };
})();

// "11010101 - Kas Kecil" -> "[11010101] Kas Kecil"; "- 410101 Donasi" -> "[410101] Donasi"; teks lain apa adanya
function teksLabelOpsi(teks) {
    var t = String(teks).replace(/^(-\s)+/, "").trim();
    var cocok = /^(\d[\d.]*)\s+(?:-\s+)?(.+)$/.exec(t);
    return cocok ? "[" + cocok[1] + "] " + cocok[2] : t;
}

function pasangPemilihOpsi(asli) {
    var deskNilai = deskSelect.value;
    var deskIndeks = deskSelect.selectedIndex;
    var deskNonaktif = deskSelect.disabled;
    var id = asli.id || buatId("po");

    // --- Tampilan: kolom cari + ikon panah + daftar pilihan (gaya kolom cari Jurnal Umum, .jurnal-cari) ---
    var bungkus = document.createElement("div");
    bungkus.className = "jurnal-cari pemilih-opsi";
    var kolom = document.createElement("input");
    kolom.type = "text";
    kolom.id = id + "-cari";
    kolom.autocomplete = "off";
    kolom.setAttribute("role", "combobox");
    kolom.setAttribute("aria-autocomplete", "list");
    kolom.setAttribute("aria-expanded", "false");
    kolom.setAttribute("aria-controls", id + "-opsi");
    ["aria-label", "aria-required"].forEach(function (a) {
        if (asli.getAttribute(a)) { kolom.setAttribute(a, asli.getAttribute(a)); }
    });
    var daftar = document.createElement("ul");
    daftar.id = id + "-opsi";
    daftar.className = "jurnal-daftar-akun";
    daftar.setAttribute("role", "listbox");
    daftar.hidden = true;
    bungkus.appendChild(kolom);
    bungkus.insertAdjacentHTML("beforeend", '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M6 9l6 6 6-6"/></svg>');   // ikon tetap
    bungkus.appendChild(daftar);
    asli.insertAdjacentElement("afterend", bungkus);
    // Kotak asli selalu tak terlihat lewat display:none (juga mengalahkan gaya halaman yang menulis display pada <select>).
    // Atribut hidden-nya TIDAK dipakai komponen ini, supaya tetap menjadi tanda dari kode fitur: kode yang menyembunyikan
    // kotak pilihan (misalnya aturan No Bukti saat saklar Otomatis dimatikan) ikut menyembunyikan kolom penggantinya.
    asli.style.display = "none";
    bungkus.hidden = asli.hidden;
    // Tulisan label isian ("Divisi", "Kas/Bank", ...) sekarang mengarah ke kolom yang terlihat
    if (asli.id) {
        document.querySelectorAll('label[for="' + asli.id + '"]').forEach(function (label) { label.htmlFor = kolom.id; });
    }

    function opsiKosong() {
        return Array.prototype.find.call(asli.options, function (o) { return o.value === ""; }) || null;
    }
    // Pilihan yang bisa dipilih di daftar: semua kecuali pilihan kosong dan yang dinonaktifkan
    function pilihanData() {
        return Array.prototype.filter.call(asli.options, function (o) { return o.value !== "" && !o.disabled; })
            .map(function (o) { return { nilai: o.value, teks: o.textContent }; });
    }

    // --- Sinkronisasi tampilan dari kotak pilihan asli ---
    var chip = buatChipPilihan({
        kolom: kolom,
        pertahankanSaatMengetik: true,
        petunjuk: function () { var k = opsiKosong(); return k ? k.textContent : ""; },
        saatLepas: function () { tetapkan(""); }
    });
    function segarkan() {
        // Sedang mengetik untuk mencari: jangan timpa ketikan (label dipasang lagi saat kolom ditinggalkan)
        if (document.activeElement === kolom && kolom.value !== "") { return; }
        var o = asli.options[deskIndeks.get.call(asli)];
        if (o && o.value !== "") {
            chip.tampilkan(teksLabelOpsi(o.textContent), !opsiKosong());
        } else {
            chip.kosongkan();
            kolom.value = "";
        }
    }

    // Kode fitur mengubah .value/.selectedIndex/.disabled atau memanggil .focus(): lewat penyinkron di prototipe (atas)
    pemilihOpsiTerdaftar.set(asli, {
        segarkan: segarkan,
        nonaktif: function (v) { kolom.disabled = v; if (v) { cari.tutup(); } },
        fokus: function (opsi) { kolom.focus(opsi); }
    });
    // Isi pilihan diganti (isiPilihan, atau tulisan pilihan berubah): tampilan disegarkan
    new MutationObserver(segarkan).observe(asli, { childList: true, subtree: true, characterData: true });
    // Kode fitur menyembunyikan/menampilkan kotak asli (atribut hidden): kolom pengganti ikut
    new MutationObserver(function () {
        bungkus.hidden = asli.hidden;
        if (asli.hidden) { cari.tutup(); }
    }).observe(asli, { attributes: true, attributeFilter: ["hidden"] });

    // Memilih dari pengguna: ubah nilai asli lalu beri tahu seperti kotak pilihan bawaan browser
    function tetapkan(nilai) {
        if (deskNilai.get.call(asli) === nilai) { segarkan(); return; }
        deskNilai.set.call(asli, nilai);
        segarkan();
        asli.dispatchEvent(new Event("input", { bubbles: true }));
        asli.dispatchEvent(new Event("change", { bubbles: true }));
    }

    // --- Daftar pilihan (alat bersama kolom cari) ---
    var cari = buatKolomCari({
        kolom: kolom,
        daftar: daftar,
        ambilData: pilihanData,
        cocok: function (o, kata) { return kata === "" || o.teks.toLowerCase().indexOf(kata) !== -1; },
        gambarButir: function (li, o, kata) {
            var nama = document.createElement("div");
            nama.className = "jurnal-pilihan-nama";
            tulisDenganSorot(nama, o.teks, kata);
            li.appendChild(nama);
        },
        teksKosong: function (adaData) {
            if (adaData) { return "Tidak ada pilihan yang cocok."; }
            var k = opsiKosong();
            return k ? k.textContent : "Belum ada pilihan.";
        },
        saatPilih: function (o) { tetapkan(o.nilai); },
        bolehBuka: function () { return !asli.disabled; }
    });
    // Kolom ditinggalkan tanpa memilih: ketikan dibuang, label pilihan lama dipasang lagi
    kolom.addEventListener("blur", function () { kolom.value = ""; segarkan(); });

    segarkan();
    kolom.disabled = !!deskNonaktif.get.call(asli);
    return { bungkus: bungkus, kolom: kolom, segarkan: segarkan };
}

// Pasang pada semua kotak pilihan isian yang ada (HTML tampilan sudah terpasang sebelum file ini dimuat)
document.querySelectorAll("select").forEach(function (s) {
    if (!s.matches(PEMILIH_OPSI_DIKECUALIKAN)) { pasangPemilihOpsi(s); }
});
