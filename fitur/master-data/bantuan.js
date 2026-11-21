// ==================== Petunjuk Penggunaan: Master Data ====================
// Teks untuk tombol lampu (PRD 6.16; komponen umum/bantuan.js). Ditulis dari isian dan aturan yang benar-benar ada
// di fitur/master-data/tampilan.js dan master-data.js. KALAU HALAMANNYA BERUBAH (isian, tombol, aturan), TEKS INI IKUT DIPERBARUI.
// Bahasa sederhana, tanpa data asli.

daftarkanBantuan("divisi", {
    judul: "Divisi",
    topik: [
        {
            judul: "Tentang Divisi",
            isi: [
                "**Divisi** adalah bagian atau unit kerja di yayasan, misalnya Pendidikan, Sosial, atau Kesehatan. Divisi dipakai untuk " +
                "mengelompokkan kegiatan dan uang yayasan, supaya pemasukan, pengeluaran, dan anggaran bisa dilihat per bagian.",
                "Divisi yang dibuat di sini dipakai di:",
                {
                    poin: [
                        "**Program**: setiap Program berada di bawah satu Divisi.",
                        "**Transaksi**: Jurnal Umum, Pembayaran, Penerimaan, Pencatatan Donasi, dan Pemindahan Dana boleh diberi Divisi.",
                        "**Anggaran**: rencana biaya bisa dibuat per Divisi.",
                        "**Laporan**: kelompok laporan Divisi & Program, dan pilihan Divisi di jendela Parameter Laporan."
                    ]
                },
                { catatan: "Menu Divisi hanya tampil kalau fitur Divisi dinyalakan di Pengaturan → Preferensi → Fitur." }
            ]
        },
        {
            judul: "Membuat Divisi",
            isi: [
                {
                    langkah: [
                        "Klik ikon **Master Data** di menu samping kiri, lalu klik kotak **Divisi**. Formulir **Data Baru** terbuka.",
                        "Isi **Nama**, misalnya \"Pendidikan\".",
                        "Isi **Keterangan** kalau perlu (boleh dikosongkan).",
                        "Klik tombol **Simpan** (ikon disket kuning di kanan), atau tekan **Ctrl + S**.",
                        "Muncul pesan \"Divisi telah berhasil disimpan\". Formulir kosong lagi dan siap untuk Divisi berikutnya."
                    ]
                },
                "Divisi baru langsung bisa dipilih di Program, transaksi, dan Anggaran."
            ]
        },
        {
            judul: "Isian",
            isi: [
                {
                    tabel: {
                        kolom: ["Isian", "Wajib", "Penjelasan"],
                        baris: [
                            ["Nama", "Ya", "Nama Divisi. Tidak boleh sama dengan Divisi lain. Huruf besar dan kecil dianggap sama, jadi \"Pendidikan\" dan \"pendidikan\" dianggap kembar."],
                            ["Keterangan", "Tidak", "Catatan bebas, misalnya tujuan divisi atau nama penanggung jawabnya."]
                        ]
                    }
                },
                { catatan: "Kalau Nama kosong atau sudah dipakai, muncul pesan merah di bawah kolom Nama dan data tidak disimpan. Pesan hilang begitu Anda mulai mengetik lagi." }
            ]
        },
        {
            judul: "Melihat Daftar",
            isi: [
                "Klik **tombol hijau** (ikon daftar) di kiri atas untuk berpindah antara formulir dan **Daftar Divisi**. Di Daftar ada:",
                {
                    poin: [
                        "Tombol **+**: membuka formulir Data Baru.",
                        "Tombol **Segarkan** (panah melingkar): memuat ulang daftar.",
                        "Tombol **Unduh** (panah ke bawah): menyimpan daftar sebagai file CSV yang bisa dibuka di Excel.",
                        "Tombol **Cetak** (printer): mencetak daftar.",
                        "Kolom **Cari**: menyaring daftar dengan kata yang diketik.",
                        "Angka di paling kanan: jumlah Divisi yang sedang tampil.",
                        "Klik **judul kolom** (Nama, Keterangan) untuk mengurutkan; klik sekali lagi untuk urutan terbalik.",
                        "Klik **satu baris** untuk membuka Divisi itu."
                    ]
                }
            ]
        },
        {
            judul: "Mengubah Divisi",
            isi: [
                {
                    langkah: [
                        "Buka **Daftar Divisi** (tombol hijau).",
                        "Klik Divisi yang ingin diubah. Divisi itu terbuka di **tab kecil** bernama Divisi tersebut.",
                        "Ubah Nama atau Keterangan.",
                        "Klik **Simpan** (atau Ctrl + S)."
                    ]
                },
                "Transaksi menyimpan Divisi lewat kodenya, bukan namanya. Jadi kalau nama Divisi diganti, nama baru langsung terlihat di " +
                "semua transaksi dan laporan lama.",
                "Anda bisa membuka sampai 10 tab sekaligus (misalnya beberapa Divisi). Kalau tab yang isinya sudah diubah ditutup dengan " +
                "tombol ×, aplikasi bertanya dulu supaya perubahan tidak hilang tanpa sengaja."
            ]
        },
        {
            judul: "Menghapus Divisi",
            isi: [
                {
                    langkah: [
                        "Buka Divisi dari **Daftar Divisi**.",
                        "Klik tombol **Hapus** (ikon tempat sampah merah) di bawah tombol Simpan. Tombol ini hanya ada saat membuka Divisi lama.",
                        "Pada pertanyaan konfirmasi, klik **Ya, Hapus**. Klik Batal kalau tidak jadi."
                    ]
                },
                {
                    catatan: "Divisi TIDAK bisa dihapus kalau masih dipakai Program, sudah dipakai di jurnal atau transaksi, atau sudah dipakai " +
                        "di Anggaran. Aplikasi menolak dengan pesan yang menyebut tempat pemakaiannya. Ini menjaga supaya riwayat transaksi " +
                        "tidak kehilangan Divisinya. Divisi yang sudah pernah dipakai sebaiknya dibiarkan saja."
                }
            ]
        },
        {
            judul: "Tombol dan Pintasan",
            isi: [
                {
                    tabel: {
                        kolom: ["Tombol", "Pintasan", "Fungsi"],
                        baris: [
                            ["Simpan (disket kuning)", "Ctrl + S", "Menyimpan formulir."],
                            ["Hapus (tempat sampah merah)", "-", "Menghapus Divisi yang sedang dibuka (ada konfirmasi)."],
                            ["Tombol hijau", "Alt + D", "Pindah antara formulir dan Daftar."],
                            ["Data Baru / +", "Alt + N", "Membuka formulir kosong."],
                            ["× pada tab kecil", "Alt + W", "Menutup tab yang aktif."],
                            ["Lampu jingga", "-", "Membuka petunjuk ini."]
                        ]
                    }
                },
                "Daftar semua pintasan bisa dilihat dengan tombol **?** di bilah atas atau tombol **F1**."
            ]
        },
        {
            judul: "Hal Penting",
            isi: [
                {
                    poin: [
                        "Setiap Divisi yang dibuat, diubah, atau dihapus tercatat di **Log Aktivitas** (Master Data → Log Aktivitas), " +
                        "lengkap dengan siapa, kapan, dan isian apa yang berubah.",
                        "Untuk pengguna **Operator**, tombol mengikuti **Akses Grup**-nya: tanpa hak Buat tidak ada Data Baru, tanpa hak Ubah " +
                        "perubahan tidak bisa disimpan, tanpa hak Hapus tidak ada tombol Hapus, dan tanpa hak Lihat Daftar hanya berisi Divisi " +
                        "buatan sendiri.",
                        "Data tersimpan di browser komputer ini. Gunakan **Pengaturan → Cadangan Data** untuk menyimpan salinan atau " +
                        "memindahkannya ke komputer lain."
                    ]
                }
            ]
        }
    ]
});

// Bagian umum yang sama untuk halaman berdaftar di Master Data (tombol dan pintasan, hal penting)
function topikTombolMasterData(nama) {
    return {
        judul: "Tombol dan Pintasan",
        isi: [
            {
                tabel: {
                    kolom: ["Tombol", "Pintasan", "Fungsi"],
                    baris: [
                        ["Simpan (disket kuning)", "Ctrl + S", "Menyimpan formulir."],
                        ["Hapus (tempat sampah merah)", "-", "Menghapus " + nama + " yang sedang dibuka (ada konfirmasi)."],
                        ["Tombol hijau", "Alt + D", "Pindah antara formulir dan Daftar."],
                        ["Data Baru / +", "Alt + N", "Membuka formulir kosong."],
                        ["× pada tab kecil", "Alt + W", "Menutup tab yang aktif."],
                        ["Lampu jingga", "-", "Membuka petunjuk ini."]
                    ]
                }
            },
            "Di Daftar juga ada tombol **Segarkan**, **Unduh** (file CSV untuk Excel), **Cetak**, kolom **Cari**, dan judul kolom yang bisa " +
            "diklik untuk mengurutkan. Klik satu baris untuk membuka datanya di tab kecil (sampai 10 tab sekaligus)."
        ]
    };
}
function topikPentingMasterData(nama) {
    return {
        judul: "Hal Penting",
        isi: [
            {
                poin: [
                    "Setiap " + nama + " yang dibuat, diubah, atau dihapus tercatat di **Log Aktivitas** (Master Data → Log Aktivitas).",
                    "Untuk pengguna **Operator**, tombol mengikuti **Akses Grup**-nya (Buat, Ubah, Hapus, Lihat). Tanpa hak Lihat, Daftar hanya " +
                    "berisi data buatan sendiri.",
                    "Data tersimpan di browser komputer ini. Gunakan **Pengaturan → Cadangan Data** untuk menyimpan salinan."
                ]
            }
        ]
    };
}

daftarkanBantuan("program", {
    judul: "Program",
    topik: [
        {
            judul: "Tentang Program",
            isi: [
                "**Program** adalah kegiatan atau bidang di bawah satu Divisi, misalnya Divisi Pendidikan punya Program Beasiswa dan " +
                "Program Renovasi Kelas. Program dipakai untuk melihat dari mana dana datang dan ke mana dana dipakai, per kegiatan.",
                "Program dipakai di:",
                {
                    poin: [
                        "**Transaksi**: Jurnal Umum, Pembayaran, Penerimaan, Pencatatan Donasi, dan Pemindahan Dana boleh diberi Program.",
                        "**Target Donasi**: target pengumpulan dana dibuat per Program.",
                        "**Anggaran**: rencana biaya bisa dibuat per Program.",
                        "**Laporan**: Donasi per Program, Sisa Dana per Program, laporan Divisi & Program, dan widget Dashboard."
                    ]
                },
                { catatan: "Menu Program hanya tampil kalau fitur Program dinyalakan di Pengaturan → Preferensi → Fitur. Program bukan penanda dana terikat: terikat atau tidak ditentukan oleh akun donasi dan centang Terikat di transaksi." }
            ]
        },
        {
            judul: "Membuat Program",
            isi: [
                {
                    langkah: [
                        "Klik ikon **Master Data** di menu samping kiri, lalu klik kotak **Program**. Formulir **Data Baru** terbuka.",
                        "Isi **Nama**, misalnya \"Beasiswa Yatim\".",
                        "Pilih **Divisi** tempat Program ini berada. Kalau pilihan kosong, buat Divisi dulu di Master Data → Divisi.",
                        "Pilih **Status**: Aktif untuk Program yang sedang berjalan.",
                        "Isi **Keterangan** kalau perlu, lalu klik **Simpan** (atau Ctrl + S)."
                    ]
                }
            ]
        },
        {
            judul: "Isian",
            isi: [
                {
                    tabel: {
                        kolom: ["Isian", "Wajib", "Penjelasan"],
                        baris: [
                            ["Nama", "Ya", "Nama Program. Tidak boleh sama dengan Program lain di Divisi yang sama (huruf besar dan kecil dianggap sama). Nama yang sama boleh dipakai di Divisi berbeda."],
                            ["Divisi", "Ya", "Divisi tempat Program berada. Baris ini hanya tampil kalau fitur Divisi dinyalakan di Preferensi → Fitur."],
                            ["Status", "Ya", "**Aktif** = Program berjalan dan bisa dipilih di transaksi. **Selesai** = Program sudah berakhir (lihat topik Status Selesai). Data Baru dimulai dari \"Silakan Pilih\" supaya status dipilih dengan sadar."],
                            ["Keterangan", "Tidak", "Catatan bebas, misalnya tujuan atau masa berlaku Program."]
                        ]
                    }
                },
                { catatan: "Kalau isian wajib kosong atau Nama kembar, muncul pesan merah di bawah kolomnya dan data tidak disimpan." }
            ]
        },
        {
            judul: "Status Selesai",
            isi: [
                "Program yang sudah berakhir sebaiknya diubah statusnya menjadi **Selesai**, bukan dihapus. Akibatnya:",
                {
                    poin: [
                        "Program tidak muncul lagi di pilihan Program untuk transaksi baru.",
                        "Transaksi lama yang memakai Program itu tetap menampilkan Programnya.",
                        "Program tidak lagi dihitung di widget Dashboard \"Sisa Dana per Program\", dan Target Donasinya tidak dianggap berjalan.",
                        "Semua laporan lama tetap utuh."
                    ]
                },
                "Kalau Program dijalankan lagi, cukup ubah statusnya kembali ke Aktif."
            ]
        },
        {
            judul: "Mengubah dan Menghapus",
            isi: [
                "**Mengubah:** buka Daftar (tombol hijau), klik Program yang ingin diubah, ubah isiannya, lalu klik Simpan. Nama baru langsung " +
                "terlihat di transaksi dan laporan lama, karena transaksi menyimpan Program lewat kodenya.",
                "**Menghapus:** buka Program dari Daftar, klik tombol **Hapus** (tempat sampah merah), lalu **Ya, Hapus**.",
                { catatan: "Program TIDAK bisa dihapus kalau sudah dipakai di jurnal atau transaksi, di Target Donasi, atau di Anggaran. Untuk Program yang sudah berakhir, pakai status Selesai." }
            ]
        },
        topikTombolMasterData("Program"),
        topikPentingMasterData("Program")
    ]
});

daftarkanBantuan("karyawan", {
    judul: "Karyawan",
    topik: [
        {
            judul: "Tentang Karyawan",
            isi: [
                "Halaman **Karyawan** menyimpan data pegawai yayasan: data pribadi, data kepegawaian, alamat, dan rekening gaji.",
                "Data Karyawan dipakai di **Pencatatan Gaji** (Buku Besar): karyawan dipilih lewat pencarian, lalu rincian gajinya diisi per orang.",
                { catatan: "Data Karyawan berisi data pribadi (No. KTP, nomor rekening). Simpan file Cadangan Data di tempat aman dan jangan dibagikan sembarangan." }
            ]
        },
        {
            judul: "Membuat Karyawan",
            isi: [
                {
                    langkah: [
                        "Klik ikon **Master Data** di menu samping kiri, lalu klik kotak **Karyawan**. Formulir **Data Baru** terbuka di tab kecil **Karyawan**.",
                        "Isi **Nama Lengkap** dan **Nomor Pegawai** (keduanya wajib), lalu isian lain yang diketahui.",
                        "Kalau perlu, buka tab kecil **Alamat** dan **Rekening Gaji** di atas formulir untuk mengisi bagian itu.",
                        "Klik **Simpan** (atau Ctrl + S). Isian di ketiga tab tersimpan bersamaan."
                    ]
                }
            ]
        },
        {
            judul: "Isian Tab Karyawan",
            isi: [
                "Tab ini terbagi dua kolom: **Data Pribadi** (kiri) dan **Data Karyawan** (kanan).",
                {
                    tabel: {
                        kolom: ["Isian", "Wajib", "Penjelasan"],
                        baris: [
                            ["Nama Lengkap", "Ya", "Nama karyawan sesuai identitas."],
                            ["No. KTP", "Tidak", "Nomor Induk Kependudukan."],
                            ["Email", "Tidak", "Alamat email. Kalau diisi, bentuknya harus benar (misalnya nama@contoh.com)."],
                            ["Handphone", "Tidak", "Nomor telepon genggam."],
                            ["No. WhatsApp", "Tidak", "Nomor WhatsApp, kalau berbeda dari Handphone."],
                            ["Nomor Pegawai", "Ya", "Nomor induk pegawai. Tidak boleh sama dengan karyawan lain."],
                            ["Posisi Jabatan", "Tidak", "Jabatan, misalnya Guru atau Staf Administrasi. Tampil di kolom Jabatan pada Daftar."],
                            ["Tgl Masuk", "Tidak", "Tanggal mulai bekerja. Tulisan tanggal lengkap tampil di sebelah kolom."],
                            ["Catatan", "Tidak", "Catatan bebas."]
                        ]
                    }
                }
            ]
        },
        {
            judul: "Isian Tab Alamat dan Rekening",
            isi: [
                "**Tab Alamat:**",
                {
                    tabel: {
                        kolom: ["Isian", "Wajib", "Penjelasan"],
                        baris: [
                            ["Alamat", "Tidak", "Nama jalan, nomor rumah, RT/RW."],
                            ["Kota", "Tidak", "Kota atau kabupaten."],
                            ["Kode Pos", "Tidak", "Lima angka kode pos."],
                            ["Provinsi", "Tidak", "Nama provinsi."]
                        ]
                    }
                },
                "**Tab Rekening Gaji:**",
                {
                    tabel: {
                        kolom: ["Isian", "Wajib", "Penjelasan"],
                        baris: [
                            ["Nama Bank", "Tidak", "Ketik atau pilih dari saran (BCA, BRI, BNI, Bank Mandiri, BSI, dan lain-lain). Nama bank lain boleh diketik sendiri."],
                            ["No Rekening", "Tidak", "Nomor rekening tujuan gaji."],
                            ["Atas Nama Rekening", "Tidak", "Nama pemilik rekening, sesuai buku tabungan."]
                        ]
                    }
                }
            ]
        },
        {
            judul: "Mengubah dan Menghapus",
            isi: [
                "**Mengubah:** buka Daftar (tombol hijau), klik karyawan, ubah isiannya di tab mana pun, lalu klik Simpan.",
                "**Menghapus:** buka karyawan dari Daftar, klik tombol **Hapus** (tempat sampah merah), lalu **Ya, Hapus**.",
                { catatan: "Karyawan yang sudah tercatat di Pencatatan Gaji TIDAK bisa dihapus, supaya riwayat gajinya tetap utuh. Biarkan saja datanya." },
                "Daftar Karyawan menampilkan kolom Nomor Pegawai, Nama, Jabatan, dan Handphone."
            ]
        },
        topikTombolMasterData("Karyawan"),
        topikPentingMasterData("Karyawan")
    ]
});

daftarkanBantuan("gaji", {
    judul: "Gaji/Tunjangan",
    topik: [
        {
            judul: "Tentang Gaji/Tunjangan",
            isi: [
                "Halaman **Gaji/Tunjangan** mencatat jenis-jenis penghasilan dan potongan pegawai, misalnya Gaji Pokok, Tunjangan Makan, " +
                "atau Potongan Kasbon, beserta **akun beban** yang dipakai untuk mencatat biayanya.",
                {
                    catatan: "Saat ini Pencatatan Gaji masih memakai enam komponen tetap (Gaji Pokok, Tunjangan Jabatan, Tunjangan Makan, " +
                        "Tunjangan Transportasi, Pengurangan Gaji, Iuran). Daftar di halaman ini belum otomatis menjadi kolom di Pencatatan Gaji; " +
                        "kemampuan itu direncanakan menyusul. Daftar ini tetap berguna sebagai catatan jenis gaji dan akun bebannya."
                }
            ]
        },
        {
            judul: "Membuat Gaji/Tunjangan",
            isi: [
                {
                    langkah: [
                        "Klik ikon **Master Data** di menu samping kiri, lalu klik kotak **Gaji/Tunjangan**.",
                        "Isi **Nama**, misalnya \"Tunjangan Makan\".",
                        "Pilih **Tipe Gaji/Tunjangan**. Kolom **Bayar/Potong** terisi sendiri mengikuti tipe.",
                        "Pilih **Akun Beban** tempat biaya ini dicatat.",
                        "Klik **Simpan** (atau Ctrl + S)."
                    ]
                }
            ]
        },
        {
            judul: "Isian",
            isi: [
                {
                    tabel: {
                        kolom: ["Isian", "Wajib", "Penjelasan"],
                        baris: [
                            ["Nama", "Ya", "Nama jenis gaji atau tunjangan. Tidak boleh sama dengan yang lain."],
                            ["Tipe Gaji/Tunjangan", "Ya", "Pilih salah satu: Gaji Pokok, Tunjangan Tetap, Tunjangan Tidak Tetap (dibayar bulanan); Lembur dan Insentif, Bonus dan THR (sewaktu-waktu); Potongan Iuran, Potongan Cicilan atau Kasbon (dipotong bulanan)."],
                            ["Bayar/Potong", "-", "Terisi sendiri dari Tipe: **Bayar** = menambah gaji, **Potong** = mengurangi gaji. Tidak bisa diubah."],
                            ["Akun Beban", "Ya*", "Akun bertipe Beban di Akun Perkiraan, misalnya Beban Gaji. *Wajib kalau sudah ada akun Beban; kalau belum ada sama sekali, muncul petunjuk untuk membuatnya dulu di Akun Perkiraan."],
                            ["Non Aktif", "Tidak", "Centang **Ya** untuk jenis yang tidak dipakai lagi. Datanya tetap tersimpan dan tampil di Daftar dengan tanda Non Aktif."]
                        ]
                    }
                }
            ]
        },
        {
            judul: "Mengubah dan Menghapus",
            isi: [
                "**Mengubah:** buka Daftar (tombol hijau), klik jenis gaji, ubah isiannya, lalu klik Simpan.",
                "**Menghapus:** buka dari Daftar, klik tombol **Hapus** (tempat sampah merah), lalu **Ya, Hapus**.",
                "Akun Beban yang sedang dipakai di halaman ini tidak bisa dihapus di Akun Perkiraan, supaya pilihan akunnya tidak hilang.",
                "Daftar menampilkan kolom Nama, Tipe Gaji/Tunjangan, Bayar/Potong, Akun Beban, dan Non Aktif."
            ]
        },
        topikTombolMasterData("Gaji/Tunjangan"),
        topikPentingMasterData("Gaji/Tunjangan")
    ]
});
