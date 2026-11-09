// ==================== Tampilan: Buku Besar: Anggaran ====================
// HTML halaman Anggaran (PRD 6.5; dari foto Anggaran Accurate). Memakai kelas gaya Jurnal Umum (jurnal-*, dialog-detail-*)
// supaya serupa dengan formulir lain. Atas: Bulan, Tahun, Tipe, dan Divisi/Program sesuai Tipe. Tab samping: Rincian Anggaran
// dan Info lainnya ("i"). Daftar (tombol hijau) dibuat otomatis oleh buatModulDaftar. Logikanya: fitur/anggaran/anggaran.js.

pasangTampilan("tab-anggaran", /*html*/ `
                <div class="tab" id="tab-anggaran" hidden>
                    <button type="button" class="tab-judul" data-tab="anggaran">Anggaran</button>
                    <button type="button" class="tab-tutup" data-tutup="anggaran" aria-label="Tutup tab Anggaran">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" aria-hidden="true"><path d="M6 6l12 12M18 6L6 18"/></svg>
                    </button>
                </div>
`);

pasangTampilan("isi-anggaran", /*html*/ `
            <!-- ===== Isi tab Anggaran (rencana, tidak membuat jurnal) ===== -->
            <section id="isi-anggaran" class="isi-tab" hidden>
                <div class="modul-form">
                    <div class="modul-form-kiri">
                        <form id="form-anggaran" class="jurnal-form" novalidate>

                            <div class="ang-kepala">
                                <label for="ang-bulan">Bulan <span class="wajib" aria-hidden="true">*</span></label>
                                <div class="ang-kolom">
                                    <!-- pilih-filter: kotak pilihan biasa seperti foto, bukan kolom cari berlabel (umum/pemilih-opsi.js) -->
                                    <select id="ang-bulan" class="pilih-filter" aria-required="true"></select>
                                    <input id="ang-tahun" type="number" min="2000" max="2100" step="1" aria-label="Tahun" aria-required="true">
                                </div>
                                <label for="ang-tipe">Tipe <span class="wajib" aria-hidden="true">*</span></label>
                                <div class="ang-kolom">
                                    <select id="ang-tipe" class="pilih-filter"></select>
                                    <!-- Divisi atau Program, sesuai Tipe; Tipe Umum: disembunyikan -->
                                    <div class="ang-kelompok"><select id="ang-kelompok" aria-label="Divisi atau Program"></select></div>
                                </div>
                            </div>

                            <p id="ang-pesan-galat" class="pesan-galat-kolom jurnal-pesan-galat" role="alert" hidden></p>

                            <div class="jurnal-badan">
                                <div class="jurnal-tab-samping" role="tablist" aria-label="Bagian anggaran">
                                    <button type="button" class="jurnal-tab-ikon aktif" role="tab" aria-selected="true" aria-controls="ang-panel-rincian" data-ang-tab="rincian" title="Rincian Anggaran" aria-label="Rincian Anggaran">
                                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M6 3h9l4 4v14H6z"/><path d="M14 3v5h5"/><path d="M9 13h7M9 17h5"/></svg>
                                    </button>
                                    <button type="button" class="jurnal-tab-ikon" role="tab" aria-selected="false" aria-controls="ang-panel-info" data-ang-tab="info" title="Info lainnya" aria-label="Info lainnya">
                                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="9"/><path d="M12 11v6M12 7.5v.5"/></svg>
                                    </button>
                                </div>

                                <div class="jurnal-isi">
                                    <div id="ang-panel-rincian" class="jurnal-panel" role="tabpanel">
                                        <div class="jurnal-alat">
                                            <div class="jurnal-cari">
                                                <input id="ang-cari-akun" type="text" placeholder="Cari/Pilih Akun Perkiraan..." autocomplete="off" role="combobox" aria-expanded="false" aria-controls="ang-daftar-akun" aria-autocomplete="list" aria-label="Cari atau pilih akun beban atau pendapatan">
                                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" aria-hidden="true"><circle cx="11" cy="11" r="6.5"/><path d="M20 20l-4.2-4.2"/></svg>
                                                <ul id="ang-daftar-akun" class="jurnal-daftar-akun" role="listbox" hidden></ul>
                                            </div>
                                            <button type="button" class="tombol tombol-garis ang-ambil" id="ang-ambil">Ambil</button>
                                            <div class="jurnal-judul-rincian">
                                                <h2><span id="ang-jumlah"></span>Rincian Anggaran <span class="wajib" aria-hidden="true">*</span></h2>
                                            </div>
                                        </div>

                                        <div class="bungkus-tabel jurnal-bungkus-tabel">
                                            <table class="tabel-data jurnal-tabel" aria-label="Rincian anggaran">
                                                <thead>
                                                    <tr>
                                                        <th scope="col" class="jurnal-kol-geser"><span class="sembunyi-visual">Urutan</span></th>
                                                        <th scope="col">Beban/Pendapatan</th>
                                                        <th scope="col" class="jurnal-kol-kode">Kode #</th>
                                                        <th scope="col" class="jurnal-kol-angka">Anggaran</th>
                                                        <th scope="col" class="jurnal-kol-hapus"><span class="sembunyi-visual">Hapus baris</span></th>
                                                    </tr>
                                                </thead>
                                                <!-- Baris digambar oleh JavaScript; kosong = "Belum ada data" -->
                                                <tbody id="ang-rincian"></tbody>
                                            </table>
                                        </div>
                                    </div>

                                    <div id="ang-panel-info" class="jurnal-panel" role="tabpanel" hidden>
                                        <h3 class="fitur-grup">Info lainnya</h3>
                                        <div class="baris-form">
                                            <label for="ang-catatan">Catatan</label>
                                            <textarea id="ang-catatan" rows="3"></textarea>
                                        </div>
                                        <div class="baris-form">
                                            <label for="ang-penganalisa">Penganalisa</label>
                                            <input id="ang-penganalisa" type="text" autocomplete="off">
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </form>

                        <div class="jurnal-total" aria-live="polite">
                            <div class="jurnal-total-kotak">
                                <span>Total</span>
                                <strong id="ang-total">Rp 0</strong>
                            </div>
                        </div>
                    </div>

                    <div class="modul-form-aksi">
                        <button type="submit" form="form-anggaran" class="tombol-simpan-besar" id="ang-simpan" aria-label="Simpan" title="Simpan">
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M5 3h11l4 4v13a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1z"/><path d="M8 3v5h7V3"/><rect x="7" y="13" width="10" height="8" rx="1"/></svg>
                        </button>
                        <button type="button" class="tombol-hapus-besar" data-aksi="hapus" data-hanya-ubah hidden aria-label="Hapus" title="Hapus">
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M4 7h16M10 11v6M14 11v6M6 7l1 13h10l1-13M9 7V4h6v3"/></svg>
                        </button>
                    </div>
                </div>
            </section>
`);

pasangTampilan("dialog-rincian-anggaran", /*html*/ `
    <!-- ===== Popup Anggaran: muncul setelah akun dipilih, dan saat sebuah baris diklik ===== -->
    <dialog id="dialog-rincian-anggaran" class="dialog-detail dialog-rincian-anggaran" aria-labelledby="judul-rincian-anggaran">
        <header class="dialog-detail-kepala">
            <h2 id="judul-rincian-anggaran">Anggaran</h2>
            <button type="button" id="tutup-rincian-anggaran" class="dialog-detail-tutup" aria-label="Tutup">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" aria-hidden="true"><path d="M6 6l12 12M18 6L6 18"/></svg>
            </button>
        </header>
        <div class="dialog-detail-isi">
            <div class="baris-form">
                <label for="rang-nama">Beban/Pendapatan</label>
                <input id="rang-nama" type="text" readonly>
            </div>
            <div class="baris-form">
                <span class="label-kelompok">Anggaran <span class="wajib" aria-hidden="true">*</span></span>
                <div>
                    <div class="detail-rupiah">
                        <span aria-hidden="true">Rp</span>
                        <input id="rang-nilai" type="text" inputmode="numeric" autocomplete="off" placeholder="0" aria-label="Nilai anggaran dalam Rupiah" aria-required="true">
                    </div>
                    <p id="galat-rang-nilai" class="pesan-galat-kolom" role="alert" hidden></p>
                </div>
            </div>
        </div>
        <footer class="dialog-detail-kaki dialog-kaki-dua">
            <button type="button" id="hapus-rincian-anggaran" class="tombol tombol-garis" hidden>Hapus</button>
            <button type="button" id="lanjut-rincian-anggaran" class="tombol tombol-utama">Lanjut</button>
        </footer>
    </dialog>
`);
