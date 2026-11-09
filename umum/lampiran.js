// ===== Alat bersama: lampiran file untuk formulir transaksi (PRD 5.4) =====
// Dulu hanya ada di Jurnal Umum (fitur/jurnal/jurnal.js). Sekarang dijadikan satu alat supaya Jurnal Umum, Pembayaran,
// Penerimaan, dan transaksi lain memakai aturan yang SAMA (jenis file, batas ukuran, foto dikecilkan, wajib menurut
// Preferensi) tanpa menulis kode yang sama berkali-kali.
//
// Cara menyimpan:
// - Data transaksi hanya menyimpan keterangan singkat tiap file: lampiranInfo [{ id, nama, tipe, ukuran }],
//   jumlahLampiran, ringkasanLampiran. Supaya data transaksi tetap ringan (saldo dihitung dari data itu berkali-kali).
// - ISI file (teks "data:...") disimpan terpisah di kunci "lampiranJurnal" = { idTransaksi: { idFile: "data:..." } }.
//   Nama kuncinya tetap "lampiranJurnal" (nama lama) supaya lampiran yang sudah ada dan Cadangan Data tetap jalan;
//   isinya sekarang lampiran SEMUA transaksi. Id transaksi selalu unik (buatId), jadi tidak bisa tertukar.
// - Penyimpanan browser hanya sekitar 5 MB untuk seluruh aplikasi, maka: foto dikecilkan otomatis, ada batas jumlah
//   dan ukuran file.
//
// Pemakaian di formulir:
//   var lampiranBayar = buatLampiranTransaksi({ jenis: "pembayaran", namaFitur: "Pembayaran",
//                                              tombol: elemenTombolKlip, lencana: elemenAngkaKecil });
//   isiForm:   lampiranBayar.muat(data)                 (data tersimpan; null = Data Baru, lampiran kosong)
//   simpan:    if (lampiranBayar.wajibKosong()) {...}   lalu Object.assign(data, lampiranBayar.infoData())
//              var hasil = lampiranBayar.simpanIsi(id); if (!hasil) {...pesan penuh...}; kalau data gagal disimpan: hasil.pulihkan()
//   hapus:     hapusIsiLampiran(id)
//   tab dokumen (PRD 6.10): lampiranBayar.kerja() untuk diingat, lampiranBayar.atur(daftar) untuk dipulihkan

var BATAS_JUMLAH_LAMPIRAN = 5;
var BATAS_UKURAN_LAMPIRAN = 700 * 1024;   // 700 KB per file, dihitung setelah foto dikecilkan
var KUNCI_ISI_LAMPIRAN = "lampiranJurnal";    // nama lama, lihat keterangan di atas
// Jenis file yang boleh (menurut akhiran nama file) dan jenis isinya
var jenisLampiranBoleh = {
    pdf: "application/pdf", jpg: "image/jpeg", jpeg: "image/jpeg", png: "image/png", webp: "image/webp",
    doc: "application/msword", docx: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    xls: "application/vnd.ms-excel", xlsx: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    csv: "text/csv", txt: "text/plain"
};

// Isi file lampiran semua transaksi: { idTransaksi: { idFile: "data:..." } }. Isi rusak dianggap kosong.
function bacaIsiLampiran() {
    return bacaPengaturan(KUNCI_ISI_LAMPIRAN, {});   // alat bersama di umum/preferensi.js
}
function tulisIsiLampiran(semua) {
    localStorage.setItem(KUNCI_ISI_LAMPIRAN, JSON.stringify(semua));   // bisa gagal kalau penyimpanan penuh; pemanggil yang menangani
}
// Menghapus isi file milik satu transaksi (dipanggil saat transaksinya dihapus). Gagal menulis tidak mengganggu.
function hapusIsiLampiran(idTransaksi) {
    var isi = bacaIsiLampiran();
    if (!isi[idTransaksi]) { return; }
    delete isi[idTransaksi];
    try { tulisIsiLampiran(isi); } catch (galat) { /* sisa file tidak mengganggu */ }
}

function akhiranBerkas(nama) {
    var titik = String(nama).lastIndexOf(".");
    return titik === -1 ? "" : String(nama).slice(titik + 1).toLowerCase();
}

// 512 -> "512 B", 153600 -> "150 KB", 1572864 -> "1,5 MB"
function teksUkuranBerkas(byte) {
    if (byte < 1024) { return byte + " B"; }
    if (byte < 1024 * 1024) { return Math.round(byte / 1024) + " KB"; }
    return (byte / 1048576).toFixed(1).replace(".", ",") + " MB";
}

// Hanya isi bertipe gambar/dokumen yang dikenal yang boleh dipakai sebagai alamat gambar atau unduhan.
// Data yang rusak atau diutak-atik (misalnya "javascript:...") ditolak.
function dataUrlLampiranAman(teks) {
    return /^data:(application\/pdf|image\/(jpeg|png|webp)|application\/msword|application\/vnd\.openxmlformats-officedocument\.(wordprocessingml\.document|spreadsheetml\.sheet)|application\/vnd\.ms-excel|text\/csv|text\/plain)[;,]/.test(teks || "");
}
function dataUrlGambarAman(teks) { return /^data:image\/(jpeg|png|webp)[;,]/.test(teks || ""); }

// ----- Pemeriksaan isi file (bukan hanya nama) -----
// Nama file mudah diganti (misalnya program.exe diganti nama menjadi nota.jpg), jadi beberapa bait awal isinya dibaca dan
// dicocokkan dengan ciri asli jenis file itu ("tanda tangan" file). Jenis yang diharapkan menurut akhiran nama:
var CIRI_ISI_LAMPIRAN = { jpg: "jpeg", jpeg: "jpeg", png: "png", webp: "webp", pdf: "pdf",
                          docx: "zip", xlsx: "zip", doc: "office-lama", xls: "office-lama", csv: "teks", txt: "teks" };

// Foto yang diterima menurut isinya (hasil jenisIsiBerkas) -> jenis isi yang disimpan. Dipakai lampiran dan logo (Preferensi).
var TIPE_FOTO_ISI = { jpeg: "image/jpeg", png: "image/png", webp: "image/webp" };

// Membaca n bait pertama file. Mengembalikan Promise<Uint8Array>.
function bacaAwalBerkas(berkas, n) {
    return new Promise(function (selesai, gagal) {
        var pembaca = new FileReader();
        pembaca.onload = function () { selesai(new Uint8Array(pembaca.result)); };
        pembaca.onerror = function () { gagal(new Error("gagal membaca")); };
        pembaca.readAsArrayBuffer(berkas.slice(0, n));
    });
}

// Jenis file menurut isinya: "jpeg", "png", "webp", "pdf", "zip" (DOCX/XLSX), "office-lama" (DOC/XLS), "teks", atau "" (tidak dikenal)
function jenisIsiBerkas(b) {
    function awalan(daftar, mulai) { return daftar.every(function (x, i) { return b[(mulai || 0) + i] === x; }); }
    if (awalan([0xFF, 0xD8, 0xFF])) { return "jpeg"; }
    if (awalan([0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A])) { return "png"; }
    if (awalan([0x52, 0x49, 0x46, 0x46]) && awalan([0x57, 0x45, 0x42, 0x50], 8)) { return "webp"; }   // "RIFF" .... "WEBP"
    if (awalan([0x25, 0x50, 0x44, 0x46, 0x2D])) { return "pdf"; }                                       // "%PDF-"
    if (awalan([0x50, 0x4B, 0x03, 0x04])) { return "zip"; }                                             // "PK"
    if (awalan([0xD0, 0xCF, 0x11, 0xE0, 0xA1, 0xB1, 0x1A, 0xE1])) { return "office-lama"; }
    // Teks (TXT/CSV): tidak ada bait nol dan bukan program Windows ("MZ"). File kosong juga dianggap teks.
    if (!awalan([0x4D, 0x5A]) && Array.prototype.indexOf.call(b, 0) === -1) { return "teks"; }
    return "";
}

// Foto besar dikecilkan (sisi terpanjang 1600 px, JPEG mutu 80%) supaya muat di penyimpanan browser.
// Kalau hasilnya tidak lebih kecil, file asli dipakai. Foto yang TIDAK BISA DIBUKA sebagai gambar menghasilkan null
// (ditolak: isinya bukan foto sungguhan atau rusak). Mengembalikan Promise<Blob, File, atau null>.
function kecilkanGambar(berkas) {
    return new Promise(function (selesai) {
        if (!/^image\/(jpeg|png|webp)$/.test(berkas.type)) { selesai(berkas); return; }
        var alamat = URL.createObjectURL(berkas);
        var gambar = new Image();
        gambar.onload = function () {
            try {
                var skala = Math.min(1, 1600 / Math.max(gambar.width, gambar.height));
                var lebar = Math.max(1, Math.round(gambar.width * skala)), tinggi = Math.max(1, Math.round(gambar.height * skala));
                var kanvas = document.createElement("canvas");
                kanvas.width = lebar;
                kanvas.height = tinggi;
                var pena = kanvas.getContext("2d");
                if (!pena) { URL.revokeObjectURL(alamat); selesai(berkas); return; }
                pena.fillStyle = "#ffffff";   // PNG bening menjadi berlatar putih saat jadi JPEG
                pena.fillRect(0, 0, lebar, tinggi);
                pena.drawImage(gambar, 0, 0, lebar, tinggi);
                kanvas.toBlob(function (hasil) {
                    URL.revokeObjectURL(alamat);
                    selesai(hasil && hasil.size < berkas.size ? hasil : berkas);
                }, "image/jpeg", 0.8);
            } catch (galat) { URL.revokeObjectURL(alamat); selesai(berkas); }
        };
        gambar.onerror = function () { URL.revokeObjectURL(alamat); selesai(null); };   // bukan gambar yang bisa dibuka
        gambar.src = alamat;
    });
}

function bacaSebagaiDataUrl(berkas) {
    return new Promise(function (selesai, gagal) {
        var pembaca = new FileReader();
        pembaca.onload = function () { selesai(String(pembaca.result)); };
        pembaca.onerror = function () { gagal(new Error("gagal membaca")); };
        pembaca.readAsDataURL(berkas);
    });
}

// Unduh sebuah lampiran sebagai file (variabel, bukan function, supaya bisa diganti saat pengujian)
var unduhLampiran = function (nama, isi) {
    var tautan = document.createElement("a");
    tautan.href = isi;
    tautan.download = nama;
    document.body.appendChild(tautan);
    tautan.click();
    tautan.remove();
};

// Lampiran milik transaksi tersimpan: keterangan dari data transaksi, isi dari penyimpanan terpisah.
// Data rusak (lampiranInfo bukan daftar, butir bukan objek) dianggap tanpa lampiran.
// semuaIsi (boleh tidak ada) = hasil bacaIsiLampiran() yang sudah dibaca, supaya laporan berisi banyak transaksi cukup membaca sekali.
function muatLampiranData(data, semuaIsi) {
    if (!data || !Array.isArray(data.lampiranInfo)) { return []; }
    var isi = (semuaIsi || bacaIsiLampiran())[data.id] || {};
    return data.lampiranInfo.filter(function (info) { return info && typeof info === "object"; }).map(function (info) {
        return { id: String(info.id), nama: teksAman(info.nama), tipe: teksAman(info.tipe), ukuran: Number(info.ukuran) || 0,
                 isi: typeof isi[info.id] === "string" ? isi[info.id] : "" };
    });
}

// ----- Popup Lampiran (satu popup dipakai bergantian oleh semua formulir) -----
var dialogLampiran = document.getElementById("dialog-lampiran");
var berkasLampiran = document.getElementById("lampiran-berkas");
var lampiranAktif = null;   // kotak lampiran milik formulir yang sedang membuka popup

function tampilkanGalatLampiran(pesan) {
    var kotak = document.getElementById("galat-lampiran");
    kotak.textContent = pesan;
    kotak.hidden = !pesan;
}

// Membuat kotak lampiran untuk satu formulir. opsi: { jenis (kunci Preferensi wajib lampiran), namaFitur, tombol, lencana }
function buatLampiranTransaksi(opsi) {
    var daftar = [];   // salinan kerja untuk data yang sedang dibuka: [{ id, nama, tipe, ukuran, isi }]
    var kotak = {};

    function wajib() { return lampiranWajib(opsi.jenis); }   // umum/preferensi.js

    // Angka kecil di tombol klip = jumlah lampiran; tombol diberi tanda merah kalau lampiran wajib tapi belum ada
    function perbaruiLencana() {
        var jumlah = daftar.length, harus = wajib();
        opsi.lencana.textContent = String(jumlah);
        opsi.lencana.hidden = (jumlah === 0);
        opsi.tombol.classList.toggle("lampiran-wajib-kosong", harus && jumlah === 0);
        opsi.tombol.setAttribute("aria-label", "Lampiran" + (jumlah ? " (" + jumlah + " file)" : "") + (harus ? ", wajib" : ""));
        opsi.tombol.title = "Lampiran" + (jumlah ? " (" + jumlah + " file)" : "") + (harus ? " - wajib" : "");
    }

    function gambarDaftar() {
        var ul = document.getElementById("daftar-lampiran");
        ul.textContent = "";
        document.getElementById("lampiran-kosong").hidden = daftar.length > 0;
        daftar.forEach(function (f) {
            var li = document.createElement("li");
            li.className = "butir-lampiran";
            var gambar = document.createElement("span");
            gambar.className = "butir-lampiran-gambar";
            if (dataUrlGambarAman(f.isi)) {
                var img = document.createElement("img");
                img.src = f.isi;
                img.alt = "";
                gambar.appendChild(img);
            } else {
                gambar.textContent = (akhiranBerkas(f.nama) || "file").toUpperCase().slice(0, 4);   // label jenis file
            }
            var teks = document.createElement("span");
            teks.className = "butir-lampiran-teks";
            var nama = document.createElement("strong");
            nama.textContent = f.nama;   // textContent: aman dari kode HTML
            var ukuran = document.createElement("small");
            ukuran.textContent = teksUkuranBerkas(f.ukuran);
            teks.appendChild(nama);
            teks.appendChild(ukuran);
            var unduh = document.createElement("button");
            unduh.type = "button";
            unduh.className = "tombol tombol-garis butir-lampiran-tombol";
            unduh.textContent = "Unduh";
            unduh.disabled = !dataUrlLampiranAman(f.isi);
            unduh.setAttribute("aria-label", "Unduh " + f.nama);
            unduh.addEventListener("click", function () { unduhLampiran(f.nama, f.isi); });
            var hapus = document.createElement("button");
            hapus.type = "button";
            hapus.className = "tombol tombol-garis tombol-garis-bahaya butir-lampiran-tombol";
            hapus.textContent = "Hapus";
            hapus.setAttribute("aria-label", "Hapus " + f.nama);
            hapus.addEventListener("click", function () {
                daftar = daftar.filter(function (x) { return x.id !== f.id; });
                tampilkanGalatLampiran("");
                gambarDaftar();
                perbaruiLencana();
            });
            li.appendChild(gambar);
            li.appendChild(teks);
            li.appendChild(unduh);
            li.appendChild(hapus);
            ul.appendChild(li);
        });
    }

    // Menambah file satu per satu. File yang tidak memenuhi syarat dilewati dengan pesan; yang lain tetap masuk.
    kotak.tambah = function (daftarBerkas) {
        var pesan = [];
        return Array.prototype.slice.call(daftarBerkas).reduce(function (rantai, berkas) {
            return rantai.then(function () {
                var akhiran = akhiranBerkas(berkas.name);
                if (!jenisLampiranBoleh[akhiran]) { pesan.push('"' + berkas.name + '": jenis file tidak diizinkan.'); return; }
                if (daftar.length >= BATAS_JUMLAH_LAMPIRAN) { pesan.push('"' + berkas.name + '": paling banyak ' + BATAS_JUMLAH_LAMPIRAN + ' lampiran.'); return; }
                // Isi file harus sesuai jenis menurut namanya. Foto: JPG, PNG, atau WEBP mana pun boleh (ponsel kadang
                // memberi akhiran yang tidak tepat), asal isinya memang foto. Jenis lain harus persis sama.
                return bacaAwalBerkas(berkas, 4096).then(function (awal) {

                    var jenis = jenisIsiBerkas(awal), harap = CIRI_ISI_LAMPIRAN[akhiran];
                    if (TIPE_FOTO_ISI[harap] ? !TIPE_FOTO_ISI[jenis] : jenis !== harap) {
                        pesan.push('"' + berkas.name + '": isinya bukan file ' + akhiran.toUpperCase() + ' sungguhan (hanya namanya). File ditolak.');
                        return;
                    }
                    // Jenis isi mengikuti hasil pemeriksaan, bukan keterangan dari browser (yang hanya menebak dari nama)
                    var tipe = TIPE_FOTO_ISI[jenis] || jenisLampiranBoleh[akhiran];
                    var asli = new Blob([berkas], { type: tipe });
                    return kecilkanGambar(asli).then(function (hasil) {
                        if (!hasil) { pesan.push('"' + berkas.name + '": tidak bisa dibuka sebagai foto (rusak atau bukan foto). File ditolak.'); return; }
                        if (hasil.size > BATAS_UKURAN_LAMPIRAN) {
                            pesan.push('"' + berkas.name + '": ukurannya ' + teksUkuranBerkas(hasil.size) + ', paling besar ' + teksUkuranBerkas(BATAS_UKURAN_LAMPIRAN) + (TIPE_FOTO_ISI[jenis] ? "." : ". Kompres file dulu."));
                            return;
                        }
                        return bacaSebagaiDataUrl(hasil).then(function (isi) {
                            // Foto yang dikecilkan berubah menjadi JPEG, jadi akhiran namanya ikut diganti
                            var nama = (hasil !== asli && hasil.type === "image/jpeg") ? berkas.name.replace(/\.[^.]*$/, "") + ".jpg" : berkas.name;
                            daftar.push({ id: buatId("f"), nama: nama, tipe: hasil.type || tipe, ukuran: hasil.size, isi: isi });
                        });
                    });
                }).catch(function () { pesan.push('"' + berkas.name + '": file tidak bisa dibaca.'); });
            });
        }, Promise.resolve()).then(function () {
            tampilkanGalatLampiran(pesan.join(" "));
            if (lampiranAktif === kotak) { gambarDaftar(); }
            perbaruiLencana();
        });
    };

    kotak.buka = function () {
        lampiranAktif = kotak;
        tampilkanGalatLampiran("");
        document.getElementById("lampiran-wajib-nama").textContent = opsi.namaFitur;
        document.getElementById("lampiran-wajib").hidden = !wajib();
        gambarDaftar();
        dialogLampiran.showModal();
    };
    kotak.kerja = function () { return daftar.slice(); };
    kotak.atur = function (baru) { daftar = (baru || []).slice(); perbaruiLencana(); };
    kotak.muat = function (data) { kotak.atur(muatLampiranData(data)); };
    kotak.perbaruiLencana = perbaruiLencana;
    // Preferensi, Lampiran: wajib berlampiran tapi belum ada file
    kotak.wajibKosong = function () { return wajib() && daftar.length === 0; };
    kotak.pesanWajib = "Lampiran wajib untuk " + opsi.namaFitur + ". Klik ikon klip lalu tambahkan minimal satu file.";
    kotak.pesanPenuh = "Lampiran tidak muat di penyimpanan browser (batasnya sekitar 5 MB untuk seluruh data). Hapus beberapa lampiran atau pakai file yang lebih kecil, lalu coba lagi.";
    // Keterangan singkat yang ikut disimpan di data transaksi (tanpa isi file)
    kotak.infoData = function () {
        return {
            lampiranInfo: daftar.map(function (f) { return { id: f.id, nama: f.nama, tipe: f.tipe, ukuran: f.ukuran }; }),
            jumlahLampiran: daftar.length,
            ringkasanLampiran: daftar.map(function (f) { return f.nama; }).join(", ")
        };
    };
    // Isi file disimpan LEBIH DULU daripada data transaksinya. Kalau penyimpanan penuh: mengembalikan null (data jangan
    // disimpan). Kalau berhasil: { pulihkan } untuk mengembalikan isi lama bila data transaksinya ternyata gagal disimpan.
    kotak.simpanIsi = function (idTransaksi) {
        var semua = bacaIsiLampiran(), isiLama = semua[idTransaksi];
        if (daftar.length) {
            semua[idTransaksi] = {};
            daftar.forEach(function (f) { semua[idTransaksi][f.id] = f.isi; });
        } else { delete semua[idTransaksi]; }
        try { tulisIsiLampiran(semua); } catch (galat) { return null; }
        return {
            pulihkan: function () {
                var pulih = bacaIsiLampiran();
                if (isiLama) { pulih[idTransaksi] = isiLama; } else { delete pulih[idTransaksi]; }
                try { tulisIsiLampiran(pulih); } catch (galat) { /* biarkan */ }
            }
        };
    };

    opsi.tombol.addEventListener("click", kotak.buka);
    perbaruiLencana();
    return kotak;
}

// Tombol dan isian di popup bekerja untuk kotak lampiran yang sedang aktif
document.getElementById("tombol-tambah-lampiran").addEventListener("click", function () { berkasLampiran.click(); });
berkasLampiran.addEventListener("change", function () {
    var terpilih = Array.prototype.slice.call(berkasLampiran.files || []);
    berkasLampiran.value = "";   // supaya file yang sama bisa dipilih lagi nanti
    if (terpilih.length && lampiranAktif) { lampiranAktif.tambah(terpilih); }
});
document.getElementById("tutup-lampiran").addEventListener("click", function () { dialogLampiran.close(); });
document.getElementById("selesai-lampiran").addEventListener("click", function () { dialogLampiran.close(); });
dialogLampiran.addEventListener("click", function (k) { if (k.target === dialogLampiran) { dialogLampiran.close(); } });
