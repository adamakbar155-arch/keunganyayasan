// ==================== Tampilan: Buku Besar: Monitor Anggaran ====================
// HTML halaman Monitor Anggaran (PRD 6.5, dari foto Accurate): hanya dilihat, tanpa formulir. Baris atas: Tipe, Bulan, Tahun,
// cari Akun, cari Divisi/Program, Muat Ulang. Logikanya: fitur/monitor-anggaran/monitor-anggaran.js.

pasangTampilan("tab-monitor-anggaran", /*html*/ `
                <div class="tab" id="tab-monitor-anggaran" hidden>
                    <button type="button" class="tab-judul" data-tab="monitor-anggaran">Monitor Anggaran</button>
                    <button type="button" class="tab-tutup" data-tutup="monitor-anggaran" aria-label="Tutup tab Monitor Anggaran">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" aria-hidden="true"><path d="M6 6l12 12M18 6L6 18"/></svg>
                    </button>
                </div>
`);

pasangTampilan("isi-monitor-anggaran", /*html*/ `
            <!-- ===== Isi tab Monitor Anggaran: Anggaran, Penggunaan (dari jurnal), dan Sisa per akun ===== -->
            <section id="isi-monitor-anggaran" class="isi-tab" hidden>
                <div class="mang-saring">
                    <select id="mang-tipe" class="pilih-filter" aria-label="Tipe"></select>
                    <select id="mang-bulan" class="pilih-filter" aria-label="Bulan"></select>
                    <select id="mang-tahun" class="pilih-filter" aria-label="Tahun"></select>
                    <div class="mang-cari"><select id="mang-akun" aria-label="Akun"></select></div>
                    <!-- Divisi/Program; Tipe Umum: tidak dipakai -->
                    <div class="mang-cari mang-cari-kecil"><select id="mang-kelompok" aria-label="Divisi atau Program"></select></div>
                    <button type="button" class="tombol tombol-garis mang-muat" id="mang-muat" aria-label="Muat Ulang" title="Muat Ulang">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M20 11a8 8 0 0 0-14-4.5L4 8.5M4 4v4.5h4.5M4 13a8 8 0 0 0 14 4.5l2-2M20 20v-4.5h-4.5"/></svg>
                    </button>
                </div>

                <div class="bungkus-tabel">
                    <table class="tabel-data mang-tabel" aria-label="Monitor anggaran">
                        <thead>
                            <tr>
                                <th scope="col">Nama Akun</th>
                                <th scope="col">Kode #</th>
                                <th scope="col">Anggaran</th>
                                <th scope="col">Penggunaan Anggaran</th>
                                <th scope="col">Sisa Anggaran</th>
                            </tr>
                        </thead>
                        <!-- Baris digambar oleh JavaScript -->
                        <tbody id="mang-rincian"></tbody>
                    </table>
                </div>
            </section>
`);
