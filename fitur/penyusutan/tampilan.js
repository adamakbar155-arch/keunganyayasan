// ==================== Tampilan: Aset Tetap: Proses Penyusutan ====================
// HTML halaman Proses Penyusutan (PRD 6.6): pilih bulan, lihat daftar aset dan jumlahnya, lalu Simpan membuat satu jurnal.
// Logikanya: fitur/penyusutan/penyusutan.js. Gaya: fitur/aset-tetap/aset-tetap.css.

pasangTampilan("tab-penyusutan", /*html*/ `
                <div class="tab" id="tab-penyusutan" hidden>
                    <button type="button" class="tab-judul" data-tab="penyusutan">Proses Penyusutan</button>
                    <button type="button" class="tab-tutup" data-tutup="penyusutan" aria-label="Tutup tab Proses Penyusutan">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" aria-hidden="true"><path d="M6 6l12 12M18 6L6 18"/></svg>
                    </button>
                </div>
`);

pasangTampilan("isi-penyusutan", /*html*/ `
            <section id="isi-penyusutan" class="isi-tab" hidden>
                <div class="modul-form">
                    <div class="modul-form-kiri">
                        <form id="form-penyusutan" class="jurnal-form" novalidate>
                            <div class="pny-periode">
                                <select id="pny-bulan" class="pilih-filter" aria-label="Bulan"></select>
                                <input id="pny-tahun" type="number" min="2000" max="2100" step="1" aria-label="Tahun">
                            </div>
                            <p id="pny-petunjuk" class="petunjuk"></p>
                            <p id="pny-pesan-galat" class="pesan-galat-kolom jurnal-pesan-galat" role="alert" hidden></p>
                            <div class="bungkus-tabel">
                                <table class="tabel-data pny-tabel" aria-label="Rincian penyusutan">
                                    <thead><tr><th scope="col">Kode</th><th scope="col">Nama Aset</th><th scope="col">Penyusutan</th></tr></thead>
                                    <tbody id="pny-rincian"></tbody>
                                </table>
                            </div>
                        </form>
                        <div class="jurnal-total" aria-live="polite">
                            <div class="jurnal-total-kotak"><span>Total Penyusutan</span><strong id="pny-total">Rp 0</strong></div>
                        </div>
                    </div>
                    <div class="modul-form-aksi">
                        <button type="submit" form="form-penyusutan" class="tombol-simpan-besar" id="pny-simpan" aria-label="Proses" title="Proses">
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M5 3h11l4 4v13a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1z"/><path d="M8 3v5h7V3"/><rect x="7" y="13" width="10" height="8" rx="1"/></svg>
                        </button>
                        <button type="button" class="tombol-hapus-besar" data-aksi="hapus" data-hanya-ubah hidden aria-label="Batalkan proses" title="Batalkan proses">
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M4 7h16M10 11v6M14 11v6M6 7l1 13h10l1-13M9 7V4h6v3"/></svg>
                        </button>
                    </div>
                </div>
            </section>
`);
