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
