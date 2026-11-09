// ==================== Tampilan: Donasi: Pencatatan Donasi ====================
// HTML halaman Pencatatan Donasi (PRD 6.1; dari foto Faktur Penjualan, popup Rincian Barang, dan tab Info lainnya
// Penerimaan Penjualan Accurate, digabung jadi SATU formulir). Komponen sendiri (keputusan pengguna 2026-10-28), tetapi
// memakai kelas gaya Jurnal Umum dan transaksi Kas/Bank (jurnal-*, dialog-detail-*) supaya tampilannya serupa.
// Bagian atas: kiri Donatur, Kas/Bank, Nilai Pembayaran; kanan No Bukti, Tanggal. Tab samping: Rincian Donasi dan Info lainnya ("i").
// Daftar (tombol hijau) dibuat otomatis oleh buatModulDaftar. Logikanya: fitur/pencatatan-donasi/pencatatan-donasi.js.

pasangTampilan("tab-donasi-catat", /*html*/ `
                <div class="tab" id="tab-donasi-catat" hidden>
                    <button type="button" class="tab-judul" data-tab="donasi-catat">Pencatatan Donasi</button>
                    <button type="button" class="tab-tutup" data-tutup="donasi-catat" aria-label="Tutup tab Pencatatan Donasi">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" aria-hidden="true"><path d="M6 6l12 12M18 6L6 18"/></svg>
                    </button>
                </div>
`);

pasangTampilan("isi-donasi-catat", /*html*/ `
            <!-- ===== Isi tab Pencatatan Donasi (uang donasi masuk ke Kas/Bank) ===== -->
            <section id="isi-donasi-catat" class="isi-tab" hidden>
                <div class="modul-form">
                    <div class="modul-form-kiri">
                        <form id="form-donasi-catat" class="jurnal-form" novalidate>

                            <!-- Bagian atas kiri: Donatur, Kas/Bank, Nilai Pembayaran; kanan: No Bukti dan Tanggal
                                 (susunan permintaan pengguna 2026-10-28, PRD 6.1) -->
                            <div class="jurnal-kepala pgaji-kepala">
                                <div class="jurnal-kepala-kolom">
                                    <div class="jurnal-baris">
                                        <label for="dc-cari-donatur">Donatur <span class="wajib" aria-hidden="true">*</span></label>
                                        <div>
                                            <!-- Donatur terpilih disimpan lewat id-nya (dc-donatur); nama di kolom hanya tampilan -->
                                            <div class="jurnal-cari">
                                                <input id="dc-cari-donatur" type="text" placeholder="Cari/Pilih Donatur..." autocomplete="off" role="combobox" aria-expanded="false" aria-controls="dc-daftar-donatur" aria-autocomplete="list" aria-required="true">
                                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" aria-hidden="true"><circle cx="11" cy="11" r="6.5"/><path d="M20 20l-4.2-4.2"/></svg>
                                                <ul id="dc-daftar-donatur" class="jurnal-daftar-akun" role="listbox" hidden></ul>
                                            </div>
                                            <input id="dc-donatur" type="hidden">
                                        </div>
                                    </div>
                                    <div class="jurnal-baris">
                                        <label for="dc-kas">Kas/Bank <span class="wajib" aria-hidden="true">*</span></label>
                                        <div>
                                            <select id="dc-kas" aria-required="true"></select>
                                            <p id="petunjuk-dc-kas" class="petunjuk" hidden>Belum ada akun Kas &amp; Bank tingkat 3. Buat dulu di Buku Besar, Akun Perkiraan.</p>
                                        </div>
                                    </div>
                                    <!-- Nilai Pembayaran: hanya dibaca, otomatis = jumlah nilai rincian (sama dengan Total di bawah) -->
                                    <div class="jurnal-baris">
                                        <label for="dc-nilai-bayar">Nilai Pembayaran</label>
                                        <div class="detail-rupiah">
                                            <span aria-hidden="true">Rp</span>
                                            <input id="dc-nilai-bayar" type="text" readonly aria-readonly="true" value="0">
                                        </div>
                                    </div>
                                </div>
                                <div class="jurnal-kepala-kolom">
                                    <div class="jurnal-baris">
                                        <label for="dc-aturan-nomor">No Bukti # <span class="wajib" aria-hidden="true">*</span></label>
                                        <div>
                                            <!-- Otomatis: pilih aturan penomoran bertipe Donasi (Pengaturan, Penomoran). Dimatikan: diketik sendiri. -->
                                            <div class="jurnal-nomor">
                                                <label class="saklar" title="Nomor dibuat otomatis"><input type="checkbox" id="dc-nomor-otomatis" checked aria-label="Nomor otomatis"> <span>Otomatis</span></label>
                                                <select id="dc-aturan-nomor" aria-label="Aturan penomoran"></select>
                                                <input id="dc-nomor" type="text" hidden placeholder="Ketik nomor bukti" autocomplete="off">
                                            </div>
                                            <p id="dc-contoh-nomor" class="petunjuk jurnal-contoh-nomor"></p>
                                        </div>
                                    </div>
                                    <div class="jurnal-baris">
                                        <label for="dc-tanggal">Tanggal <span class="wajib" aria-hidden="true">*</span></label>
                                        <div class="grup-tanggal">
                                            <input id="dc-tanggal" type="date" aria-required="true">
                                        </div>
                                    </div>
                                    <div class="jurnal-baris jurnal-baris-kanan">
                                        <button type="button" class="tombol tombol-garis" data-favorit-ambil="Pencatatan Donasi">
                                            Ambil
                                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M6 9l6 6 6-6"/></svg>
                                        </button>
                                    </div>
                                </div>
                            </div>

                            <p id="dc-pesan-galat" class="pesan-galat-kolom jurnal-pesan-galat" role="alert" hidden></p>

                            <!-- Badan: tab samping (Rincian Donasi, Info lainnya) dan isinya -->
                            <div class="jurnal-badan">
                                <div class="jurnal-tab-samping" role="tablist" aria-label="Bagian pencatatan donasi">
                                    <button type="button" class="jurnal-tab-ikon aktif" role="tab" aria-selected="true" aria-controls="dc-panel-rincian" data-dc-tab="rincian" title="Rincian Donasi" aria-label="Rincian Donasi">
                                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M6 3h9l4 4v14H6z"/><path d="M14 3v5h5"/><path d="M9 13h7M9 17h5"/></svg>
                                    </button>
                                    <button type="button" class="jurnal-tab-ikon" role="tab" aria-selected="false" aria-controls="dc-panel-info" data-dc-tab="info" title="Info lainnya" aria-label="Info lainnya">
                                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="9"/><path d="M12 11v6M12 7.5v.5"/></svg>
                                    </button>
                                </div>

                                <div class="jurnal-isi">
                                    <!-- Panel Rincian Donasi: cari Kategori Donasi, tabel Kode, Nama Donasi, Nilai -->
                                    <div id="dc-panel-rincian" class="jurnal-panel" role="tabpanel">
                                        <div class="jurnal-alat">
                                            <div class="jurnal-cari">
                                                <input id="dc-cari-kategori" type="text" placeholder="Cari/Pilih Kategori Donasi..." autocomplete="off" role="combobox" aria-expanded="false" aria-controls="dc-daftar-kategori" aria-autocomplete="list" aria-label="Cari atau pilih kategori donasi">
                                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" aria-hidden="true"><circle cx="11" cy="11" r="6.5"/><path d="M20 20l-4.2-4.2"/></svg>
                                                <ul id="dc-daftar-kategori" class="jurnal-daftar-akun" role="listbox" hidden></ul>
                                            </div>
                                            <div class="jurnal-judul-rincian">
                                                <h2><span id="dc-jumlah"></span>Rincian Donasi <span class="wajib" aria-hidden="true">*</span></h2>
                                            </div>
                                        </div>

                                        <div class="bungkus-tabel jurnal-bungkus-tabel">
                                            <table class="tabel-data jurnal-tabel" aria-label="Rincian donasi">
                                                <thead>
                                                    <tr>
                                                        <th scope="col" class="jurnal-kol-geser"><span class="sembunyi-visual">Urutan</span></th>
                                                        <th scope="col" class="jurnal-kol-kode">Kode</th>
                                                        <th scope="col">Nama Donasi</th>
                                                        <th scope="col" class="jurnal-kol-angka">Nilai</th>
                                                        <th scope="col" class="jurnal-kol-hapus"><span class="sembunyi-visual">Hapus baris</span></th>
                                                    </tr>
                                                </thead>
                                                <!-- Baris digambar oleh JavaScript; kosong = "Belum ada data" -->
                                                <tbody id="dc-rincian"></tbody>
                                            </table>
                                        </div>
                                    </div>

                                    <!-- Panel Info lainnya (tab "i"): Cara Bayar, Keterangan, status rekonsiliasi -->
                                    <div id="dc-panel-info" class="jurnal-panel" role="tabpanel" hidden>
                                        <h3 class="fitur-grup">Info lainnya</h3>
                                        <div class="baris-form">
                                            <label for="dc-cara-bayar">Cara Bayar</label>
                                            <select id="dc-cara-bayar"></select>
                                        </div>
                                        <div class="baris-form">
                                            <label for="dc-keterangan">Keterangan</label>
                                            <textarea id="dc-keterangan" rows="3" placeholder="Pesan donatur atau catatan"></textarea>
                                        </div>
                                        <div class="baris-form">
                                            <span class="label-kelompok">Terekonsiliasi</span>
                                            <span id="dc-rekonsiliasi">Belum</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </form>

                        <!-- Total donasi -->
                        <div class="jurnal-total" aria-live="polite">
                            <div class="jurnal-total-kotak">
                                <span>Total</span>
                                <strong id="dc-total">Rp 0</strong>
                            </div>
                        </div>
                    </div>

                    <!-- Tombol di kanan: simpan dan hapus (saat mengubah). Cetak dan Lampiran ditunda (PRD 6.1). -->
                    <div class="modul-form-aksi">
                        <button type="submit" form="form-donasi-catat" class="tombol-simpan-besar" id="dc-simpan" aria-label="Simpan" title="Simpan">
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M5 3h11l4 4v13a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1z"/><path d="M8 3v5h7V3"/><rect x="7" y="13" width="10" height="8" rx="1"/></svg>
                        </button>
                        <button type="button" class="tombol-aksi-samping tombol-aksi-biru" data-cetak-bukti="Pencatatan Donasi" aria-label="Cetak Tanda Terima" title="Cetak Tanda Terima">
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M6 3h9l4 4v14H6z"/><path d="M14 3v5h5"/><path d="M9 13h7M9 17h5"/></svg>
                        </button>
                        <!-- Lampiran (alat bersama umum/lampiran.js). Angka kecil = jumlah lampiran. -->
                        <button type="button" id="dc-tombol-lampiran" class="tombol-aksi-samping tombol-aksi-biru" aria-label="Lampiran" title="Lampiran">
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M20 11.5l-8 8a5 5 0 0 1-7-7l9-9a3.3 3.3 0 0 1 4.7 4.7l-9 9a1.7 1.7 0 0 1-2.4-2.4l8-8"/></svg>
                            <span id="dc-lencana-lampiran" class="lencana-aksi" hidden>0</span>
                        </button>
                        <button type="button" class="tombol-aksi-samping tombol-aksi-hijau" data-favorit-lain="Pencatatan Donasi" aria-label="Menu lainnya" title="Lainnya">
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

pasangTampilan("dialog-rincian-donasi-catat", /*html*/ `
    <!-- ===== Popup Rincian Donasi (padanan popup Rincian Barang): muncul setelah Kategori Donasi dipilih, dan saat
         sebuah baris diklik. Tab "Rincian Donasi": kode, nama, nilai. Tab "Info lainnya": Divisi, Program, Keterangan. ===== -->
    <dialog id="dialog-rincian-donasi-catat" class="dialog-detail" aria-labelledby="judul-rincian-donasi-catat">
        <header class="dialog-detail-kepala">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M4 20h4L19 9l-4-4L4 16z"/><path d="M13.5 6.5l4 4"/></svg>
            <h2 id="judul-rincian-donasi-catat">Rincian Donasi</h2>
            <button type="button" id="tutup-rincian-donasi-catat" class="dialog-detail-tutup" aria-label="Tutup">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" aria-hidden="true"><path d="M6 6l12 12M18 6L6 18"/></svg>
            </button>
        </header>

        <div class="dialog-detail-isi">
            <div class="dialog-detail-tab" role="tablist">
                <button type="button" class="aktif" role="tab" aria-selected="true" aria-controls="rdc-panel-rincian" data-rdc-tab="rincian">Rincian Donasi</button>
                <button type="button" role="tab" aria-selected="false" aria-controls="rdc-panel-info" data-rdc-tab="info">Info lainnya</button>
            </div>

            <!-- Tab Rincian Donasi -->
            <div id="rdc-panel-rincian" class="dialog-detail-panel" role="tabpanel">
                <div class="baris-form">
                    <span class="label-kelompok">Kode #</span>
                    <span id="rdc-kode" class="detail-kode"></span>
                </div>
                <div class="baris-form">
                    <label for="rdc-nama">Nama Donasi</label>
                    <input id="rdc-nama" type="text" readonly>
                </div>
                <div class="baris-form">
                    <span class="label-kelompok">Nilai <span class="wajib" aria-hidden="true">*</span></span>
                    <div>
                        <div class="detail-rupiah">
                            <span aria-hidden="true">Rp</span>
                            <input id="rdc-nilai" type="text" inputmode="numeric" autocomplete="off" placeholder="0" aria-label="Nilai dalam Rupiah" aria-required="true">
                        </div>
                        <p id="galat-rdc-nilai" class="pesan-galat-kolom" role="alert" hidden></p>
                    </div>
                </div>
            </div>

            <!-- Tab Info lainnya: Divisi wajib, Program boleh kosong (PRD 6.1) -->
            <div id="rdc-panel-info" class="dialog-detail-panel" role="tabpanel" hidden>
                <div class="baris-form">
                    <label for="rdc-divisi">Divisi <span class="wajib" aria-hidden="true">*</span></label>
                    <select id="rdc-divisi" aria-required="true"></select>
                </div>
                <div class="baris-form">
                    <label for="rdc-program">Program</label>
                    <select id="rdc-program"></select>
                </div>
                <div class="baris-form">
                    <label for="rdc-keterangan">Keterangan</label>
                    <textarea id="rdc-keterangan" rows="3"></textarea>
                </div>
            </div>
        </div>

        <footer class="dialog-detail-kaki dialog-kaki-dua">
            <!-- Hapus hanya tampil saat mengubah baris yang sudah ada -->
            <button type="button" id="hapus-rincian-donasi-catat" class="tombol tombol-garis" hidden>Hapus</button>
            <button type="button" id="lanjut-rincian-donasi-catat" class="tombol tombol-utama">Lanjut</button>
        </footer>
    </dialog>
`);
