// ==================== Tampilan bersama: halaman Histori (Histori Bank, Histori Akun) ====================
// HTML halaman riwayat satu akun dengan saldo berjalan (PRD 6.3 Histori Bank, 6.4 Histori Akun; dari foto Accurate):
// pilih akun dan rentang tanggal, lalu tabel transaksi. Kedua halaman bentuknya sama, jadi HTML-nya ditulis sekali di sini.
// Pemakaian (dari tampilan.js di folder fitur):
//   pasangTampilanHistori({ id: "histori-bank", judul: "Histori Bank", noCek: true, ceklis: true });
//     id     : nama tab; semua id elemen diturunkan darinya (histori-bank-kas, petunjuk-histori-bank, histori-bank-badan, ...)
//     noCek  : true = ada kolom No Cek #
//     ceklis : true = ada kolom # (ceklis rekonsiliasi bank)
// Logikanya: umum/komponen-histori.js (buatHalamanHistori). Gaya: umum/histori.css (kelas halaman-histori).
// Gaya tabel memakai gaya bersama (tabel-data, sel-kanan, angka-negatif, baris-data).
// Tanda /*html*/ membantu editor (misalnya ekstensi VS Code "es6-string-html") mewarnai teks sebagai HTML.

function pasangTampilanHistori(t) {
    pasangTampilan("tab-" + t.id, /*html*/ `
                <div class="tab" id="tab-${t.id}" hidden>
                    <button type="button" class="tab-judul" data-tab="${t.id}">${t.judul}</button>
                    <button type="button" class="tab-tutup" data-tutup="${t.id}" aria-label="Tutup tab ${t.judul}">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" aria-hidden="true"><path d="M6 6l12 12M18 6L6 18"/></svg>
                    </button>
                </div>
`);

    pasangTampilan("isi-" + t.id, /*html*/ `
            <!-- ===== Isi tab ${t.judul}: riwayat satu akun dengan saldo berjalan, seperti Accurate ===== -->
            <section id="isi-${t.id}" class="isi-tab halaman-histori" hidden>
                <!-- Atas: akun, tanggal dari s/d sampai, segarkan, ekspor.
                     Kelas jurnal-form: kolom tanggal memakai gaya isian yang sama dengan formulir transaksi (fitur/jurnal/jurnal.css). -->
                <div class="histori-alat jurnal-form">
                    <select id="${t.id}-kas" aria-label="Pilih Kas/Bank"></select>
                    <div class="grup-tanggal">
                        <input id="${t.id}-dari" type="date" aria-label="Dari tanggal">
                    </div>
                    <span class="histori-sd">s/d</span>
                    <div class="grup-tanggal">
                        <input id="${t.id}-sampai" type="date" aria-label="Sampai tanggal">
                    </div>
                    <button type="button" id="${t.id}-segarkan" class="tombol tombol-garis" aria-label="Segarkan" title="Segarkan">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M20 12a8 8 0 1 1-2.3-5.7"/><path d="M20 4v5h-5"/></svg>
                    </button>
                    <button type="button" id="${t.id}-ekspor" class="tombol tombol-garis" aria-label="Unduh CSV" title="Unduh CSV">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 4v11M7 10l5 5 5-5"/><path d="M5 20h14"/></svg>
                    </button>
                    <!-- Tombol ⇄ di ujung kanan (dari foto Accurate): ganti tampilan Mutasi + Tipe <-> Debit + Kredit -->
                    <button type="button" id="${t.id}-ganti-tampilan" class="tombol tombol-garis histori-ganti" aria-pressed="false" aria-label="Tampilkan kolom Debit dan Kredit" title="Tampilkan kolom Debit dan Kredit">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M4 8h15M15 4l4 4-4 4"/><path d="M20 16H5M9 12l-4 4 4 4"/></svg>
                    </button>
                </div>
                <p id="petunjuk-${t.id}" class="petunjuk" hidden></p>

                <div class="bungkus-tabel">
                    <table class="tabel-data" aria-label="${t.judul}">
                        <thead>
                            <tr>
                                <th scope="col">Tanggal</th>
                                <th scope="col">No. Sumber #</th>
                                ${t.noCek ? '<th scope="col">No Cek #</th>' : ""}
                                <th scope="col">Tipe Transaksi</th>
                                <th scope="col">Keterangan</th>
                                <!-- Dua kolom ini berganti judul lewat tombol ⇄: Mutasi + Tipe, atau Debit + Kredit -->
                                <th scope="col" class="sel-kanan" data-kolom-nilai="1">Mutasi</th>
                                <th scope="col" data-kolom-nilai="2">Tipe</th>
                                <th scope="col" class="sel-kanan">Saldo</th>
                                ${t.ceklis ? '<th scope="col" class="histori-kol-cek"><span aria-hidden="true">#</span><span class="sembunyi-visual">Sudah direkonsiliasi</span></th>' : ""}
                            </tr>
                        </thead>
                        <!-- Baris digambar oleh JavaScript (umum/komponen-histori.js): Saldo Awal, transaksi, Total -->
                        <tbody id="${t.id}-badan"></tbody>
                    </table>
                </div>
            </section>
`);
}
