// ==================== Tampilan: Buku Besar: Transfer Anggaran ====================
// HTML halaman Transfer Anggaran (PRD 6.5, dari foto Accurate): Tahun, Tipe, No Transfer, Tanggal di atas; tab Rincian (Transfer
// Dari Anggaran dan Ke Anggaran) dan Info lainnya. Memakai kelas Jurnal Umum (jurnal-*) supaya rupanya seragam.
// Logikanya: fitur/transfer-anggaran/transfer-anggaran.js.

pasangTampilan("tab-transfer-anggaran", /*html*/ `
                <div class="tab" id="tab-transfer-anggaran" hidden>
                    <button type="button" class="tab-judul" data-tab="transfer-anggaran">Transfer Anggaran</button>
                    <button type="button" class="tab-tutup" data-tutup="transfer-anggaran" aria-label="Tutup tab Transfer Anggaran">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" aria-hidden="true"><path d="M6 6l12 12M18 6L6 18"/></svg>
                    </button>
                </div>
`);

pasangTampilan("isi-transfer-anggaran", /*html*/ `
            <!-- ===== Isi tab Transfer Anggaran: memindah rencana, tidak membuat jurnal ===== -->
            <section id="isi-transfer-anggaran" class="isi-tab" hidden>
                <div class="modul-form">
                    <div class="modul-form-kiri">
                        <form id="form-transfer-anggaran" class="jurnal-form" novalidate>

                            <div class="jurnal-kepala pgaji-kepala">
                                <div class="jurnal-kepala-kolom">
                                    <div class="jurnal-baris">
                                        <label for="tang-tahun">Tahun <span class="wajib" aria-hidden="true">*</span></label>
                                        <input id="tang-tahun" type="number" min="2000" max="2100" step="1" aria-required="true">
                                    </div>
                                    <div class="jurnal-baris">
                                        <label for="tang-tipe">Tipe <span class="wajib" aria-hidden="true">*</span></label>
                                        <select id="tang-tipe" class="pilih-filter"></select>
                                    </div>
                                </div>
                                <div class="jurnal-kepala-kolom">
                                    <div class="jurnal-baris">
                                        <label for="tang-aturan-nomor">No Transfer # <span class="wajib" aria-hidden="true">*</span></label>
                                        <div>
                                            <!-- Otomatis: aturan penomoran bertipe Transfer Anggaran. Dimatikan: diketik sendiri. -->
                                            <div class="jurnal-nomor">
                                                <label class="saklar" title="Nomor dibuat otomatis"><input type="checkbox" id="tang-nomor-otomatis" checked aria-label="Nomor otomatis"> <span>Otomatis</span></label>
                                                <select id="tang-aturan-nomor" aria-label="Aturan penomoran"></select>
                                                <input id="tang-nomor" type="text" hidden placeholder="Ketik nomor" autocomplete="off">
                                            </div>
                                            <p id="tang-contoh-nomor" class="petunjuk jurnal-contoh-nomor"></p>
                                        </div>
                                    </div>
                                    <div class="jurnal-baris">
                                        <label for="tang-tanggal">Tanggal <span class="wajib" aria-hidden="true">*</span></label>
                                        <div class="grup-tanggal">
                                            <input id="tang-tanggal" type="date" aria-required="true">
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <p id="tang-pesan-galat" class="pesan-galat-kolom jurnal-pesan-galat" role="alert" hidden></p>

                            <div class="jurnal-badan">
                                <div class="jurnal-tab-samping" role="tablist" aria-label="Bagian transfer anggaran">
                                    <button type="button" class="jurnal-tab-ikon aktif" role="tab" aria-selected="true" aria-controls="tang-panel-rincian" data-tang-tab="rincian" title="Rincian Transfer" aria-label="Rincian Transfer">
                                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M6 3h9l4 4v14H6z"/><path d="M14 3v5h5"/><path d="M9 13h7M9 17h5"/></svg>
                                    </button>
                                    <button type="button" class="jurnal-tab-ikon" role="tab" aria-selected="false" aria-controls="tang-panel-info" data-tang-tab="info" title="Info lainnya" aria-label="Info lainnya">
                                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="9"/><path d="M12 11v6M12 7.5v.5"/></svg>
                                    </button>
                                </div>

                                <div class="jurnal-isi">
                                    <div id="tang-panel-rincian" class="jurnal-panel tang-dua" role="tabpanel">
                                        <div class="tang-sisi">
                                            <h2 class="tang-judul">Transfer Dari Anggaran</h2>
                                            <div class="baris-form tang-baris-kelompok" hidden>
                                                <label for="tang-kelompok-dari">Divisi/Program <span class="wajib" aria-hidden="true">*</span></label>
                                                <select id="tang-kelompok-dari"></select>
                                            </div>
                                            <div class="baris-form">
                                                <label for="tang-bulan-dari">Bulan <span class="wajib" aria-hidden="true">*</span></label>
                                                <select id="tang-bulan-dari" class="pilih-filter" aria-required="true"></select>
                                            </div>
                                            <div class="baris-form">
                                                <label for="tang-akun-dari">Anggaran <span class="wajib" aria-hidden="true">*</span></label>
                                                <select id="tang-akun-dari" aria-required="true"></select>
                                            </div>
                                            <div class="baris-form">
                                                <span class="label-kelompok">Sisa Anggaran</span>
                                                <strong id="tang-sisa" class="tang-sisa">-</strong>
                                            </div>
                                            <div class="baris-form">
                                                <label for="tang-nilai">Nilai Transfer <span class="wajib" aria-hidden="true">*</span></label>
                                                <div class="detail-rupiah tang-nilai">
                                                    <span aria-hidden="true">Rp</span>
                                                    <input id="tang-nilai" type="text" inputmode="numeric" autocomplete="off" placeholder="0" aria-required="true">
                                                </div>
                                            </div>
                                        </div>
                                        <div class="tang-sisi">
                                            <h2 class="tang-judul">Ke Anggaran</h2>
                                            <div class="baris-form tang-baris-kelompok" hidden>
                                                <label for="tang-kelompok-ke">Divisi/Program <span class="wajib" aria-hidden="true">*</span></label>
                                                <select id="tang-kelompok-ke"></select>
                                            </div>
                                            <div class="baris-form">
                                                <label for="tang-bulan-ke">Bulan <span class="wajib" aria-hidden="true">*</span></label>
                                                <select id="tang-bulan-ke" class="pilih-filter" aria-required="true"></select>
                                            </div>
                                            <div class="baris-form">
                                                <label for="tang-akun-ke">Anggaran <span class="wajib" aria-hidden="true">*</span></label>
                                                <select id="tang-akun-ke" aria-required="true"></select>
                                            </div>
                                        </div>
                                    </div>

                                    <div id="tang-panel-info" class="jurnal-panel" role="tabpanel" hidden>
                                        <h3 class="fitur-grup">Info lainnya</h3>
                                        <div class="baris-form">
                                            <label for="tang-catatan">Catatan</label>
                                            <textarea id="tang-catatan" rows="3"></textarea>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </form>
                    </div>

                    <div class="modul-form-aksi">
                        <button type="submit" form="form-transfer-anggaran" class="tombol-simpan-besar" id="tang-simpan" aria-label="Simpan" title="Simpan">
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M5 3h11l4 4v13a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1z"/><path d="M8 3v5h7V3"/><rect x="7" y="13" width="10" height="8" rx="1"/></svg>
                        </button>
                        <button type="button" class="tombol-hapus-besar" data-aksi="hapus" data-hanya-ubah hidden aria-label="Hapus" title="Hapus">
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M4 7h16M10 11v6M14 11v6M6 7l1 13h10l1-13M9 7V4h6v3"/></svg>
                        </button>
                    </div>
                </div>
            </section>
`);
