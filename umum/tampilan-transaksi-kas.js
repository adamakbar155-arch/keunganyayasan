// ==================== Tampilan bersama: transaksi Kas/Bank (Pembayaran, Penerimaan) ====================
// Pembayaran dan Penerimaan berbentuk kembar (PRD 6.3), jadi HTML-nya dibuat dari SATU cetakan ini. Setiap fitur hanya
// memanggil pasangTampilanTransaksiKas dengan pengaturannya di fitur/<nama>/tampilan.js. Perbaikan tampilan cukup di sini.
// Logikanya: umum/komponen-transaksi-kas.js. Gayanya: umum/transaksi-kas.css (ditambah gaya Jurnal Umum, jurnal-*).
// Dimuat sesudah umum/pasang-tampilan.js dan SEBELUM tampilan.js fitur yang memakainya.
//
// t (pengaturan):
//   id          : awalan id halaman, misalnya "bayar"  -> tab-bayar, isi-bayar, form-bayar, bayar-kas, ...
//   idPopup     : awalan id popup rincian, misalnya "rbayar" -> rbayar-nilai, rbayar-divisi, ...
//   judul       : "Pembayaran"           (judul tab, halaman, dan popup)
//   arahUang    : "uang keluar dari Kas/Bank" (keterangan di komentar HTML)
//   labelPihak  : "Penerima"             (isian Info lainnya halaman)
//   kunciPihak  : "penerima"             (id isian: <id>-<kunciPihak>, sama dengan nama data yang disimpan)
//   labelUntuk  : "Untuk Pembayaran"     (label nama akun di popup)
//   barisGaji   : true = popup punya kolom Pencatatan Gaji (hanya Pembayaran)
//   centangTerikat : true = popup punya bagian Dana (centang Terikat / Tidak Terikat) di Info lainnya (hanya Pembayaran;
//                    PRD 4.1, Keputusan 9)
function pasangTampilanTransaksiKas(t) {
    var kecil = t.judul.toLowerCase();
    var p = t.idPopup;

    pasangTampilan("tab-" + t.id, /*html*/ `
                <div class="tab" id="tab-${t.id}" hidden>
                    <button type="button" class="tab-judul" data-tab="${t.id}">${t.judul}</button>
                    <button type="button" class="tab-tutup" data-tutup="${t.id}" aria-label="Tutup tab ${t.judul}">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" aria-hidden="true"><path d="M6 6l12 12M18 6L6 18"/></svg>
                    </button>
                </div>
`);

    pasangTampilan("isi-" + t.id, /*html*/ `
            <!-- ===== Isi tab ${t.judul} (${t.arahUang}), mirip Accurate. Dibuat dari cetakan umum/tampilan-transaksi-kas.js.
                 Tombol hijau, tab "Data Baru", dan Daftar dibuat otomatis oleh buatModulDaftar. Memakai kelas Jurnal Umum (jurnal-*). ===== -->
            <section id="isi-${t.id}" class="isi-tab" hidden>
                <div class="modul-form">
                    <div class="modul-form-kiri">
                        <form id="form-${t.id}" class="jurnal-form" novalidate>

                            <!-- Bagian atas kiri: Kas/Bank dan tanggal; kanan: nomor bukti dan Ambil -->
                            <div class="jurnal-kepala pgaji-kepala">
                                <div class="jurnal-kepala-kolom">
                                    <div class="jurnal-baris">
                                        <label for="${t.id}-kas">Kas/Bank <span class="wajib" aria-hidden="true">*</span></label>
                                        <div>
                                            <select id="${t.id}-kas" aria-required="true"></select>
                                            <p id="petunjuk-${t.id}-kas" class="petunjuk" hidden>Belum ada akun Kas &amp; Bank tingkat 3 (sub dari sub akun, misalnya Kas &amp; Bank &gt; Kas Kecil &gt; Kas Kecil Masjid). Buat dulu di Buku Besar, Akun Perkiraan.</p>
                                        </div>
                                    </div>
                                    <div class="jurnal-baris">
                                        <label for="${t.id}-tanggal">Tanggal <span class="wajib" aria-hidden="true">*</span></label>
                                        <div class="grup-tanggal">
                                            <input id="${t.id}-tanggal" type="date" aria-required="true">
                                        </div>
                                    </div>
                                </div>
                                <div class="jurnal-kepala-kolom">
                                    <div class="jurnal-baris">
                                        <label for="${t.id}-aturan-nomor">No Bukti # <span class="wajib" aria-hidden="true">*</span></label>
                                        <div>
                                            <!-- Otomatis: pilih aturan penomoran bertipe ${t.judul} (Pengaturan, Penomoran). Dimatikan: diketik sendiri. -->
                                            <div class="jurnal-nomor">
                                                <label class="saklar" title="Nomor dibuat otomatis"><input type="checkbox" id="${t.id}-nomor-otomatis" checked aria-label="Nomor otomatis"> <span>Otomatis</span></label>
                                                <select id="${t.id}-aturan-nomor" aria-label="Aturan penomoran"></select>
                                                <input id="${t.id}-nomor" type="text" hidden placeholder="Ketik nomor bukti" autocomplete="off">
                                            </div>
                                            <p id="${t.id}-contoh-nomor" class="petunjuk jurnal-contoh-nomor"></p>
                                        </div>
                                    </div>
                                    <div class="jurnal-baris jurnal-baris-kanan">
                                        <button type="button" class="tombol tombol-garis" data-favorit-ambil="${t.judul}">
                                            Ambil
                                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M6 9l6 6 6-6"/></svg>
                                        </button>
                                    </div>
                                </div>
                            </div>

                            <p id="${t.id}-pesan-galat" class="pesan-galat-kolom jurnal-pesan-galat" role="alert" hidden></p>

                            <!-- Badan: tab samping (Rincian ${t.judul}, Info lainnya) dan isinya -->
                            <div class="jurnal-badan">
                                <div class="jurnal-tab-samping" role="tablist" aria-label="Bagian ${kecil}">
                                    <button type="button" class="jurnal-tab-ikon aktif" role="tab" aria-selected="true" aria-controls="${t.id}-panel-rincian" data-${t.id}-tab="rincian" title="Rincian ${t.judul}" aria-label="Rincian ${t.judul}">
                                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M6 3h9l4 4v14H6z"/><path d="M14 3v5h5"/><path d="M9 13h7M9 17h5"/></svg>
                                    </button>
                                    <button type="button" class="jurnal-tab-ikon" role="tab" aria-selected="false" aria-controls="${t.id}-panel-info" data-${t.id}-tab="info" title="Info lainnya" aria-label="Info lainnya">
                                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="9"/><path d="M12 11v6M12 7.5v.5"/></svg>
                                    </button>
                                </div>

                                <div class="jurnal-isi">
                                    <!-- Panel Rincian ${t.judul} -->
                                    <div id="${t.id}-panel-rincian" class="jurnal-panel" role="tabpanel">
                                        <div class="jurnal-alat">
                                            <div class="jurnal-cari">
                                                <input id="${t.id}-cari-akun" type="text" placeholder="Cari/Pilih Akun Perkiraan..." autocomplete="off" role="combobox" aria-expanded="false" aria-controls="${t.id}-daftar-akun" aria-autocomplete="list" aria-label="Cari atau pilih akun perkiraan">
                                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" aria-hidden="true"><circle cx="11" cy="11" r="6.5"/><path d="M20 20l-4.2-4.2"/></svg>
                                                <ul id="${t.id}-daftar-akun" class="jurnal-daftar-akun" role="listbox" hidden></ul>
                                            </div>
                                            <div class="jurnal-judul-rincian">
                                                <h2><span id="${t.id}-jumlah"></span>Rincian ${t.judul} <span class="wajib" aria-hidden="true">*</span></h2>
                                            </div>
                                        </div>

                                        <div class="bungkus-tabel jurnal-bungkus-tabel">
                                            <table class="tabel-data jurnal-tabel" aria-label="Rincian ${kecil}">
                                                <thead>
                                                    <tr>
                                                        <th scope="col" class="jurnal-kol-geser"><span class="sembunyi-visual">Urutan</span></th>
                                                        <th scope="col" class="jurnal-kol-kode">Akun</th>
                                                        <th scope="col">Nama Akun</th>
                                                        <th scope="col" class="jurnal-kol-angka">Nilai</th>
                                                        <th scope="col" class="jurnal-kol-hapus"><span class="sembunyi-visual">Hapus baris</span></th>
                                                    </tr>
                                                </thead>
                                                <!-- Baris digambar oleh JavaScript (umum/komponen-transaksi-kas.js); kosong = "Belum ada data" -->
                                                <tbody id="${t.id}-rincian"></tbody>
                                            </table>
                                        </div>
                                    </div>

                                    <!-- Panel Info lainnya: no cek, ${t.labelPihak.toLowerCase()}, catatan -->
                                    <div id="${t.id}-panel-info" class="jurnal-panel" role="tabpanel" hidden>
                                        <h3 class="fitur-grup">Info lainnya</h3>
                                        <div class="baris-form">
                                            <label for="${t.id}-no-cek">No Cek #</label>
                                            <input id="${t.id}-no-cek" type="text" autocomplete="off" class="kas-no-cek">
                                        </div>
                                        <div class="baris-form">
                                            <label for="${t.id}-${t.kunciPihak}">${t.labelPihak}</label>
                                            <textarea id="${t.id}-${t.kunciPihak}" rows="3"></textarea>
                                        </div>
                                        <div class="baris-form">
                                            <label for="${t.id}-catatan">Catatan</label>
                                            <textarea id="${t.id}-catatan" rows="3"></textarea>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </form>

                        <!-- Total ${kecil} -->
                        <div class="jurnal-total" aria-live="polite">
                            <div class="jurnal-total-kotak">
                                <span>Nilai</span>
                                <strong id="${t.id}-total">Rp 0</strong>
                            </div>
                        </div>
                    </div>

                    <!-- Tombol di kanan: simpan, cetak, lampiran, menu lain, hapus (saat mengubah) -->
                    <div class="modul-form-aksi">
                        <button type="submit" form="form-${t.id}" class="tombol-simpan-besar" id="${t.id}-simpan" aria-label="Simpan" title="Simpan">
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M5 3h11l4 4v13a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1z"/><path d="M8 3v5h7V3"/><rect x="7" y="13" width="10" height="8" rx="1"/></svg>
                        </button>
                        <button type="button" class="tombol-aksi-samping tombol-aksi-biru" data-cetak-bukti="${t.judul}" aria-label="Cetak" title="Cetak">
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M6 3h9l4 4v14H6z"/><path d="M14 3v5h5"/><path d="M9 13h7M9 17h5"/></svg>
                            <svg class="panah" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M6 9l6 6 6-6"/></svg>
                        </button>
                        <!-- Lampiran (alat bersama umum/lampiran.js): membuka popup file. Angka kecil = jumlah lampiran. -->
                        <button type="button" id="${t.id}-tombol-lampiran" class="tombol-aksi-samping tombol-aksi-biru" aria-label="Lampiran" title="Lampiran">
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M20 11.5l-8 8a5 5 0 0 1-7-7l9-9a3.3 3.3 0 0 1 4.7 4.7l-9 9a1.7 1.7 0 0 1-2.4-2.4l8-8"/></svg>
                            <span id="${t.id}-lencana-lampiran" class="lencana-aksi" hidden>0</span>
                        </button>
                        <button type="button" class="tombol-aksi-samping tombol-aksi-hijau" data-favorit-lain="${t.judul}" aria-label="Menu lainnya" title="Lainnya">
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="9"/><path d="M8 12h.01M12 12h.01M16 12h.01"/></svg>
                            <svg class="panah" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M6 9l6 6 6-6"/></svg>
                        </button>
                        <button type="button" class="tombol-hapus-besar" data-aksi="hapus" data-hanya-ubah hidden aria-label="Hapus" title="Hapus">
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M4 7h16M10 11v6M14 11v6M6 7l1 13h10l1-13M9 7V4h6v3"/></svg>
                        </button>
                    </div>
                </div>
            </section>
`);

    // Kolom Pencatatan Gaji hanya untuk Pembayaran (baris gaji yang dibuka lewat Proses di Pencatatan Gaji)
    var barisGaji = t.barisGaji ? /*html*/ `
                <!-- Hanya tampil di baris pembayaran gaji (dibuat lewat Proses di Pencatatan Gaji) -->
                <div id="baris-${p}-gaji" class="baris-form" hidden>
                    <label for="${p}-gaji">Pencatatan Gaji</label>
                    <input id="${p}-gaji" type="text" class="kolom-tautan-gaji" readonly>
                </div>` : "";

    // Dana hanya untuk Pembayaran (PRD 4.1): pilih salah satu, Terikat atau Tidak Terikat (wajib); baris baru mengikuti
    // baris terakhir. Penerimaan tidak memakainya (terikat atau tidak cukup dilihat dari Divisinya, PRD Keputusan 9).
    var centangTerikat = t.centangTerikat ? /*html*/ `
                <div class="baris-form">
                    <span class="label-kelompok">Dana</span>
                    <div class="pilihan-dana">
                        <label class="saklar"><input type="checkbox" id="${p}-terikat"> <span>Terikat</span></label>
                        <label class="saklar"><input type="checkbox" id="${p}-tidak-terikat"> <span>Tidak Terikat</span></label>
                    </div>
                </div>` : "";

    pasangTampilan("dialog-rincian-" + t.id, /*html*/ `
    <!-- ===== Popup Rincian ${t.judul}: muncul setelah akun dipilih, dan saat sebuah baris diklik.
         Tab "Rincian ${t.judul}": akun dan nilai. Tab "Info lainnya": divisi, program, catatan. ===== -->
    <dialog id="dialog-rincian-${t.id}" class="dialog-detail" aria-labelledby="judul-rincian-${t.id}">
        <header class="dialog-detail-kepala">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M4 20h4L19 9l-4-4L4 16z"/><path d="M13.5 6.5l4 4"/></svg>
            <h2 id="judul-rincian-${t.id}">Rincian ${t.judul}</h2>
            <button type="button" id="tutup-rincian-${t.id}" class="dialog-detail-tutup" aria-label="Tutup">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" aria-hidden="true"><path d="M6 6l12 12M18 6L6 18"/></svg>
            </button>
        </header>

        <div class="dialog-detail-isi">
            <div class="dialog-detail-tab" role="tablist">
                <button type="button" class="aktif" role="tab" aria-selected="true" aria-controls="${p}-panel-rincian" data-${p}-tab="rincian">Rincian ${t.judul}</button>
                <button type="button" role="tab" aria-selected="false" aria-controls="${p}-panel-info" data-${p}-tab="info">Info lainnya</button>
            </div>

            <!-- Tab Rincian ${t.judul} -->
            <div id="${p}-panel-rincian" class="dialog-detail-panel" role="tabpanel">
                <div class="baris-form">
                    <span class="label-kelompok">Akun</span>
                    <span id="${p}-kode" class="detail-kode"></span>
                </div>
                <div class="baris-form">
                    <label for="${p}-nama">${t.labelUntuk}</label>
                    <input id="${p}-nama" type="text" readonly>
                </div>
                <div class="baris-form">
                    <span class="label-kelompok">Nilai <span class="wajib" aria-hidden="true">*</span></span>
                    <div>
                        <div class="detail-rupiah">
                            <span aria-hidden="true">Rp</span>
                            <input id="${p}-nilai" type="text" inputmode="numeric" autocomplete="off" placeholder="0" aria-label="Nilai dalam Rupiah" aria-required="true">
                        </div>
                        <p id="galat-${p}-nilai" class="pesan-galat-kolom" role="alert" hidden></p>
                    </div>
                </div>
            </div>

            <!-- Tab Info lainnya -->
            <div id="${p}-panel-info" class="dialog-detail-panel" role="tabpanel" hidden>
                <div class="baris-form">
                    <label for="${p}-divisi">Divisi</label>
                    <select id="${p}-divisi"></select>
                </div>
                <div class="baris-form">
                    <label for="${p}-program">Program</label>
                    <select id="${p}-program"></select>
                </div>${centangTerikat}
                <div class="baris-form">
                    <label for="${p}-catatan">Catatan</label>
                    <textarea id="${p}-catatan" rows="3"></textarea>
                </div>${barisGaji}
            </div>
        </div>

        <footer class="dialog-detail-kaki dialog-kaki-dua">
            <!-- Hapus hanya tampil saat mengubah baris yang sudah ada -->
            <button type="button" id="hapus-rincian-${t.id}" class="tombol tombol-garis" hidden>Hapus</button>
            <button type="button" id="lanjut-rincian-${t.id}" class="tombol tombol-utama">Lanjut</button>
        </footer>
    </dialog>
`);
}
