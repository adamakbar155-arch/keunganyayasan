// ==================== Tampilan: Donasi: Pemindahan Dana ====================
// HTML halaman Pemindahan Dana (PRD 6.1; di Accurate tidak ada contoh, dirancang bersama pengguna; rancangan baru
// rancangan dua arah disetujui 2026-10-30): ① sisa Program → Dana Umum, ② Dana Umum → Divisi; kepemilikan dan uangnya
// pindah sekaligus. Memakai kelas gaya Jurnal Umum dan Pencatatan Donasi (jurnal-*, dialog-detail-*) supaya tampilan dan
// cara mengisinya sama.
// Bagian atas (satu kotak): kiri Jenis, Dari + sisa dana, Ambil dari, Nilai Pemindahan; kanan No Bukti, Tanggal.
// Badan: tab Tujuan (cari Kas/Bank → popup) dan tab "i" (Alasan). Gaya khusus: fitur/pemindahan-dana/pemindahan-dana.css.
// Daftar (tombol hijau) dibuat otomatis oleh buatModulDaftar. Logikanya: fitur/pemindahan-dana/pemindahan-dana.js.

pasangTampilan("tab-pemindahan-dana", /*html*/ `
                <div class="tab" id="tab-pemindahan-dana" hidden>
                    <button type="button" class="tab-judul" data-tab="pemindahan-dana">Pemindahan Dana</button>
                    <button type="button" class="tab-tutup" data-tutup="pemindahan-dana" aria-label="Tutup tab Pemindahan Dana">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" aria-hidden="true"><path d="M6 6l12 12M18 6L6 18"/></svg>
                    </button>
                </div>
`);

pasangTampilan("isi-pemindahan-dana", /*html*/ `
            <!-- ===== Isi tab Pemindahan Dana (sisa dana Program ke Dana Umum, uangnya ikut pindah) ===== -->
            <section id="isi-pemindahan-dana" class="isi-tab" hidden>
                <div class="modul-form">
                    <div class="modul-form-kiri">
                        <form id="form-pemindahan-dana" class="jurnal-form" novalidate>

                            <!-- Bagian atas dalam satu kotak (permintaan pengguna 2026-10-29: dirapikan).
                                 Kiri berurutan: Dari Program + sisa dana, Ambil dari, Nilai Pemindahan; kanan: No Bukti, Tanggal. -->
                            <div class="jurnal-kepala kepala-pd">
                                <div class="jurnal-kepala-kolom">
                                    <!-- Jenis Pemindahan (PRD 6.1, 2026-10-30): dua arah lewat Dana Umum; isian di bawahnya menyesuaikan -->
                                    <div class="jurnal-baris">
                                        <label id="label-pd-jenis">Jenis <span class="wajib" aria-hidden="true">*</span></label>
                                        <div class="jenis-pd" role="radiogroup" aria-labelledby="label-pd-jenis">
                                            <label><input type="radio" id="pd-jenis-umum" name="pd-jenis" value="ke-umum" checked> <span>Sisa Program → Dana Umum</span></label>
                                            <label><input type="radio" id="pd-jenis-divisi" name="pd-jenis" value="ke-divisi"> <span>Dana Umum → Divisi</span></label>
                                        </div>
                                    </div>
                                    <div class="jurnal-baris">
                                        <label for="pd-dari" id="label-pd-dari">Dari Program <span class="wajib" aria-hidden="true">*</span></label>
                                        <div>
                                            <!-- Arah ①: Program Aktif maupun Selesai (sisa Program yang sudah selesai biasanya yang dipindah).
                                                 Arah ②: asalnya selalu Dana Umum (hanya dibaca). -->
                                            <select id="pd-dari" aria-required="true" aria-describedby="pd-sisa"></select>
                                            <input id="pd-dari-umum" type="text" value="Dana Umum" readonly aria-readonly="true" aria-label="Dari Dana Umum" hidden>
                                            <p id="pd-sisa" class="sisa-dana-pd" aria-live="polite" hidden></p>
                                        </div>
                                    </div>
                                    <!-- Ambil dari: rekening tempat uang sisa Program itu sekarang berada -->
                                    <div class="jurnal-baris">
                                        <label for="pd-kas-asal">Ambil dari <span class="wajib" aria-hidden="true">*</span></label>
                                        <div>
                                            <select id="pd-kas-asal" aria-required="true"></select>
                                            <p id="petunjuk-pd-kas" class="petunjuk" hidden>Belum ada akun Kas &amp; Bank tingkat 3. Buat dulu di Buku Besar, Akun Perkiraan.</p>
                                        </div>
                                    </div>
                                    <!-- Nilai Pemindahan: hanya dibaca, muncul otomatis setelah nominal diisi di popup tujuan (= Total) -->
                                    <div class="jurnal-baris">
                                        <label for="pd-nilai">Nilai Pemindahan</label>
                                        <div class="detail-rupiah">
                                            <span aria-hidden="true">Rp</span>
                                            <input id="pd-nilai" type="text" readonly aria-readonly="true" value="0">
                                        </div>
                                    </div>
                                </div>
                                <div class="jurnal-kepala-kolom">
                                    <div class="jurnal-baris">
                                        <label for="pd-aturan-nomor">No Bukti # <span class="wajib" aria-hidden="true">*</span></label>
                                        <div>
                                            <!-- Otomatis: aturan penomoran bertipe Pemindahan Dana (Pengaturan, Penomoran). Dimatikan: diketik sendiri. -->
                                            <div class="jurnal-nomor">
                                                <label class="saklar" title="Nomor dibuat otomatis"><input type="checkbox" id="pd-nomor-otomatis" checked aria-label="Nomor otomatis"> <span>Otomatis</span></label>
                                                <select id="pd-aturan-nomor" aria-label="Aturan penomoran"></select>
                                                <input id="pd-nomor" type="text" hidden placeholder="Ketik nomor bukti" autocomplete="off">
                                            </div>
                                            <p id="pd-contoh-nomor" class="petunjuk jurnal-contoh-nomor"></p>
                                        </div>
                                    </div>
                                    <div class="jurnal-baris">
                                        <label for="pd-tanggal">Tanggal <span class="wajib" aria-hidden="true">*</span></label>
                                        <div class="grup-tanggal">
                                            <input id="pd-tanggal" type="date" aria-required="true">
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <p id="pd-pesan-galat" class="pesan-galat-kolom jurnal-pesan-galat" role="alert" hidden></p>

                            <!-- Badan: tab samping (Tujuan, Info lainnya "i") dan isinya, seperti Pencatatan Donasi -->
                            <div class="jurnal-badan">
                                <div class="jurnal-tab-samping" role="tablist" aria-label="Bagian pemindahan dana">
                                    <button type="button" class="jurnal-tab-ikon aktif" role="tab" aria-selected="true" aria-controls="pd-panel-tujuan" data-pd-tab="tujuan" title="Tujuan" aria-label="Tujuan">
                                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M6 3h9l4 4v14H6z"/><path d="M14 3v5h5"/><path d="M9 13h7M9 17h5"/></svg>
                                    </button>
                                    <button type="button" class="jurnal-tab-ikon" role="tab" aria-selected="false" aria-controls="pd-panel-info" data-pd-tab="info" title="Info lainnya" aria-label="Info lainnya">
                                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="9"/><path d="M12 11v6M12 7.5v.5"/></svg>
                                    </button>
                                </div>

                                <div class="jurnal-isi">
                                    <!-- Panel Tujuan: cari/pilih Kas/Bank Dana Umum, satu baris tujuan -->
                                    <div id="pd-panel-tujuan" class="jurnal-panel" role="tabpanel">
                                        <div class="jurnal-alat">
                                            <div class="jurnal-cari">
                                                <input id="pd-cari-tujuan" type="text" placeholder="Cari/Pilih Kas/Bank tujuan..." autocomplete="off" role="combobox" aria-expanded="false" aria-controls="pd-daftar-tujuan" aria-autocomplete="list" aria-label="Cari atau pilih Kas/Bank tujuan">
                                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" aria-hidden="true"><circle cx="11" cy="11" r="6.5"/><path d="M20 20l-4.2-4.2"/></svg>
                                                <ul id="pd-daftar-tujuan" class="jurnal-daftar-akun" role="listbox" hidden></ul>
                                            </div>
                                            <div class="jurnal-judul-rincian">
                                                <h2>Tujuan <span class="wajib" aria-hidden="true">*</span></h2>
                                            </div>
                                        </div>

                                        <div class="bungkus-tabel jurnal-bungkus-tabel">
                                            <table class="tabel-data jurnal-tabel" aria-label="Tujuan pemindahan dana">
                                                <thead>
                                                    <tr>
                                                        <th scope="col" class="jurnal-kol-geser"><span class="sembunyi-visual">Urutan</span></th>
                                                        <th scope="col">Ke</th>
                                                        <th scope="col">Kas/Bank</th>
                                                        <th scope="col" class="jurnal-kol-angka">Nilai</th>
                                                        <th scope="col" class="jurnal-kol-hapus"><span class="sembunyi-visual">Hapus baris</span></th>
                                                    </tr>
                                                </thead>
                                                <!-- Baris digambar oleh JavaScript; kosong = "Belum ada data" -->
                                                <tbody id="pd-rincian"></tbody>
                                            </table>
                                        </div>
                                    </div>

                                    <!-- Panel Info lainnya (tab "i"): Alasan wajib (PRD 6.1); lampiran menyusul bersama H2.11 -->
                                    <div id="pd-panel-info" class="jurnal-panel" role="tabpanel" hidden>
                                        <h3 class="fitur-grup">Info lainnya</h3>
                                        <div class="baris-form">
                                            <label for="pd-alasan">Alasan <span class="wajib" aria-hidden="true">*</span></label>
                                            <textarea id="pd-alasan" rows="4" aria-required="true" placeholder="Misalnya keputusan rapat pengurus"></textarea>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </form>

                        <!-- Total pemindahan (= Nilai Pemindahan) -->
                        <div class="jurnal-total" aria-live="polite">
                            <div class="jurnal-total-kotak">
                                <span>Total</span>
                                <strong id="pd-total">Rp 0</strong>
                            </div>
                        </div>
                    </div>

                    <!-- Tombol di kanan: simpan, lampiran, dan hapus (saat mengubah) -->
                    <div class="modul-form-aksi">
                        <button type="submit" form="form-pemindahan-dana" class="tombol-simpan-besar" id="pd-simpan" aria-label="Simpan" title="Simpan">
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M5 3h11l4 4v13a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1z"/><path d="M8 3v5h7V3"/><rect x="7" y="13" width="10" height="8" rx="1"/></svg>
                        </button>
                        <!-- Lampiran (alat bersama umum/lampiran.js). Angka kecil = jumlah lampiran. -->
                        <button type="button" id="pd-tombol-lampiran" class="tombol-aksi-samping tombol-aksi-biru" aria-label="Lampiran" title="Lampiran">
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M20 11.5l-8 8a5 5 0 0 1-7-7l9-9a3.3 3.3 0 0 1 4.7 4.7l-9 9a1.7 1.7 0 0 1-2.4-2.4l8-8"/></svg>
                            <span id="pd-lencana-lampiran" class="lencana-aksi" hidden>0</span>
                        </button>
                        <button type="button" class="tombol-hapus-besar" data-aksi="hapus" data-hanya-ubah hidden aria-label="Hapus" title="Hapus">
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M4 7h16M10 11v6M14 11v6M6 7l1 13h10l1-13M9 7V4h6v3"/></svg>
                        </button>
                    </div>
                </div>
            </section>
`);

pasangTampilan("dialog-tujuan-pemindahan", /*html*/ `
    <!-- ===== Popup Tujuan Pemindahan: muncul setelah Kas/Bank tujuan dipilih, dan saat baris tujuan diklik.
         Arah ①: Ke = Dana Umum (hanya dibaca). Arah ②: Ke Divisi dipilih (wajib). Kas/Bank hanya dibaca;
         Nilai wajib > 0 dengan tombol Semua sisa. ===== -->
    <dialog id="dialog-tujuan-pemindahan" class="dialog-detail" aria-labelledby="judul-tujuan-pemindahan">
        <header class="dialog-detail-kepala">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M4 20h4L19 9l-4-4L4 16z"/><path d="M13.5 6.5l4 4"/></svg>
            <h2 id="judul-tujuan-pemindahan">Tujuan Pemindahan</h2>
            <button type="button" id="tutup-tujuan-pemindahan" class="dialog-detail-tutup" aria-label="Tutup">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" aria-hidden="true"><path d="M6 6l12 12M18 6L6 18"/></svg>
            </button>
        </header>

        <div class="dialog-detail-isi">
            <div class="dialog-detail-panel">
                <div class="baris-form" id="baris-tpd-ke">
                    <label for="tpd-ke">Ke</label>
                    <input id="tpd-ke" type="text" readonly value="Dana Umum">
                </div>
                <div class="baris-form" id="baris-tpd-divisi" hidden>
                    <label for="tpd-divisi">Ke Divisi <span class="wajib" aria-hidden="true">*</span></label>
                    <div>
                        <select id="tpd-divisi" aria-required="true"></select>
                        <p id="galat-tpd-divisi" class="pesan-galat-kolom" role="alert" hidden></p>
                    </div>
                </div>
                <div class="baris-form">
                    <label for="tpd-kas">Kas/Bank</label>
                    <input id="tpd-kas" type="text" readonly>
                </div>
                <div class="baris-form">
                    <span class="label-kelompok">Nilai <span class="wajib" aria-hidden="true">*</span></span>
                    <div>
                        <div class="nilai-tpd">
                            <div class="detail-rupiah">
                                <span aria-hidden="true">Rp</span>
                                <input id="tpd-nilai" type="text" inputmode="numeric" autocomplete="off" placeholder="0" aria-label="Nilai dalam Rupiah" aria-required="true">
                            </div>
                            <!-- Semua sisa: isi Nilai dengan seluruh sisa dana Program asal (tetap bisa diubah) -->
                            <button type="button" id="tpd-semua-sisa" class="tombol tombol-garis">Semua sisa</button>
                        </div>
                        <p id="galat-tpd-nilai" class="pesan-galat-kolom" role="alert" hidden></p>
                    </div>
                </div>
            </div>
        </div>

        <footer class="dialog-detail-kaki dialog-kaki-dua">
            <!-- Hapus hanya tampil saat mengubah baris yang sudah ada -->
            <button type="button" id="hapus-tujuan-pemindahan" class="tombol tombol-garis" hidden>Hapus</button>
            <button type="button" id="lanjut-tujuan-pemindahan" class="tombol tombol-utama">Lanjut</button>
        </footer>
    </dialog>
`);
