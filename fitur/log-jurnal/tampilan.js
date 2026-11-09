// ==================== Tampilan: Buku Besar: Log Aktifitas Jurnal ====================
// HTML halaman Log Aktifitas Jurnal (PRD 6.4, dari foto Accurate). Isinya dibuat otomatis oleh buatModulDaftar.
// Logikanya: fitur/log-jurnal/log-jurnal.js.

pasangTampilan("tab-log-jurnal", /*html*/ `
                <div class="tab" id="tab-log-jurnal" hidden>
                    <button type="button" class="tab-judul" data-tab="log-jurnal">Log Aktifitas Jurnal</button>
                    <button type="button" class="tab-tutup" data-tutup="log-jurnal" aria-label="Tutup tab Log Aktifitas Jurnal">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" aria-hidden="true"><path d="M6 6l12 12M18 6L6 18"/></svg>
                    </button>
                </div>
`);

pasangTampilan("isi-log-jurnal", /*html*/ `
            <!-- ===== Isi tab Log Aktifitas Jurnal: hanya daftar, seluruh tampilannya dibuat otomatis oleh buatModulDaftar ===== -->
            <section id="isi-log-jurnal" class="isi-tab" hidden></section>
`);
