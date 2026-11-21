# SPEC — Website Prototipe RIAK (Radar Indikasi Awal Kedaruratan)

> Dokumen ini adalah sumber kebenaran tunggal untuk membangun website prototipe RIAK.
> Agen (Claude Code / Antigravity) WAJIB membaca seluruh dokumen ini sebelum menulis kode,
> dan mengikuti aturan di bagian 11 (Etika & Klaim) tanpa pengecualian.
> Isi mengikuti Proposal RIAK dan Pitch Deck RIAK (The 10th Open Innovation 2026, IMERI FKUI).

---

## 0. Ringkasan satu layar

| Hal | Isi |
|---|---|
| Nama | **RIAK — Radar Indikasi Awal Kedaruratan** |
| Tagline | "Lihat riaknya, cegah gelombangnya." |
| One-liner | Sistem pendukung keputusan yang menghitung **Batas Waktu Bertindak (BWB)** setiap fasilitas kesehatan, sejak wabah masih di luar negeri. |
| Kompetisi | The 10th Open Innovation 2026, IMERI FKUI. Sub-tema *Pandemic Preparedness*. Grand Final 12–13 Desember 2026. |
| Pengguna | Gugus tugas pandemi, Dinas Kesehatan provinsi/kab/kota, direktur & manajemen RS, instalasi farmasi (IFK/IFRS), Balai Kekarantinaan Kesehatan. **Bukan publik.** |
| Keluaran utama | Tanggal paling lambat sebuah persiapan harus dimulai agar selesai sebelum faskes penuh: `BWB = Tanggal faskes penuh − Waktu tunggu persiapan − Cadangan aman` |
| Wilayah prototipe | 13 kabupaten/kota Jabodetabek; penyakit pernapasan dengan parameter COVID-19 (Delta) sebagai acuan |
| Bukti kelayakan | Uji retrospektif DKI Jakarta 2021 (bagian 9): BWB tambah tempat tidur 11–20 Juni 2021, 15–24 hari sebelum konversi RS darurat dimulai (5 Juli 2021) |
| Bentuk website | Aplikasi web statis (tanpa backend, tanpa login, tanpa data pribadi), bisa dibuka dari tautan/QR di pitch deck |
| TRL | Sekarang TRL 3 → target TRL 3–4 untuk Grand Final |

---

## 1. Masalah yang diselesaikan (untuk konteks agen)

Gelombang Delta 2021 di DKI Jakarta:
- Keterisian **isolasi** RS rujukan COVID-19: 33% (2.176/6.621) pada 31 Mei → 78% (5.752/7.341) pada 14 Juni → 90% (8.874/9.852) pada 23 Juni → 93% pada 6 Juli 2021.
- Keterisian **ICU**: 36% (362/1.014) pada 31 Mei → 71% pada 14 Juni → 86% (1.048/1.218) pada 23 Juni → 94% pada 6 Juli 2021.
- 3–4 Juli 2021: 63 pasien COVID-19 meninggal di RSUP Dr. Sardjito saat pasokan oksigen menipis.
- 4 Juli: Pemprov DKI membuka Posko Oxygen Rescue di Monas. 5 Juli: konversi Asrama Haji Pondok Gede menjadi RS darurat dimulai; beroperasi 10 Juli.
- Kebutuhan oksigen nasional naik dari ~400 menjadi ~2.000 ton/hari; kapasitas produksi ~1.700 ton/hari.
- Obat terapi COVID-19 kosong di 3.114 apotek jaringan Kimia Farma meski stok nasional dinilai cukup.
- Sinyal luar negeri sudah ada 4–8 minggu sebelumnya: WHO menetapkan Delta sebagai VOI 4 April 2021; Delta terdeteksi di Indonesia 3 Mei 2021; India puncak ~391 ribu kasus/hari 9 Mei 2021.

**Insight:** masalah utama bukan ketiadaan data, melainkan ketiadaan alat yang menerjemahkan data menjadi **tenggat keputusan**. Pertanyaan pengguna: *"Kapan paling lambat kami harus mulai bersiap?"*

**Celah:** alat yang ada (WHO EIOS, BlueDot, WHO ESFT/Adaptt, CHIME, model Northeastern, asesmen level PPKM, latihan tabletop) belum menyambungkan *sinyal wabah luar negeri → penyebaran antarwilayah → kapasitas tiap faskes* menjadi tenggat keputusan. Preseden tenggat berbasis waktu tunggu ada di **tingkat satu RS** (Northeastern; Safavi dkk., 2021). RIAK membawanya ke **lintas wilayah** dan memulainya **sejak fase luar negeri**.

---

## 2. Kriteria juri → implikasi desain website

| Kriteria | Yang harus terlihat di website |
|---|---|
| **Feasibility** | Berjalan dengan data publik nyata (daftar 461 RS, kasus DKI 2021). Halaman Studi Kasus 2021 mereproduksi angka proposal secara persis. Tanpa backend & biaya server minimal. |
| **Applicability** | Alur kerja Dinkes/RS/IFK: pilih faskes → lihat BWB per sumber daya → tindakan. Satu angka utama per keputusan. Bahasa Indonesia. Mode Latihan untuk tabletop. |
| **Acceptability** | Data agregat saja. Banner "untuk pejabat & manajemen faskes". Setiap angka berlabel sumber/asumsi. Keputusan pembatasan oleh pejabat + catatan dampak sosial-ekonomi. Aksesibel (WCAG AA). |
| **Impactful** | Metrik ditampilkan: kesenjangan keputusan (baseline 15–24 hari), waktu peringatan (11–15 hari), hari-pasien tanpa tempat tidur antaropsi, % tindakan sebelum BWB (Mode Latihan). |

---

## 3. Ruang lingkup

### 3.1 MVP wajib (untuk demo / tautan di deck)
1. **Beranda** (cerita masalah → solusi → CTA demo).
2. **Studi Kasus 2021** — reproduksi uji retrospektif, angka harus sama dengan bagian 9.
3. **RESPONS** — hitung mundur kapasitas & **Batas Waktu Bertindak** per faskes dan per sumber daya, diurutkan dari BWB terdekat.
4. **Peta Riak** — proyeksi per kab/kota dengan slider hari dan rentang ketidakpastian.
5. **Simulator Opsi Pembatasan** — 3 opsi bertingkat, pergeseran puncak & BWB.
6. **RADAR** — umpan wabah WHO (snapshot), Kartu Profil Patogen, Jam Pra-Kedatangan, Pintu Masuk Prioritas.
7. **Metodologi & Asumsi** — panel transparansi: semua parameter, sumber, label, tabel waktu tunggu yang dapat diedit.

### 3.2 Sebaiknya ada (Grand Final)
8. **Mode Latihan** (skenario Disease X + panel fasilitator + log keputusan + ringkasan).
9. **Saran Pinjam Antarfaskes**.
10. **Daftar Kesiapsiagaan** dari profil patogen.
11. **Penggabung model versi awal** (Fase 2, lihat 8.8).

### 3.3 Bukan ruang lingkup (jangan dibuat)
- Login, akun, database server, formulir yang mengumpulkan data pribadi.
- Data pasien atau pergerakan individu; pelacakan lokasi pengguna.
- Fitur publik/notifikasi masyarakat.
- Klaim "AI memprediksi pandemi" atau model AI yang dilatih tanpa data.

---

## 4. Arsitektur & stack

```
Browser (SPA statis)
 ├── UI (React + TypeScript + Tailwind)
 ├── Mesin RIAK (TypeScript murni, di src/engine, teruji Vitest)
 │     seir.ts · burden.ts · bwb.ts · ensemble.ts · calibrate.ts · radar.ts · options.ts · backtest2021.ts
 └── Data statis (public/data/*.csv|json) ← disiapkan oleh scripts/*.py
```

| Komponen | Pilihan | Alasan |
|---|---|---|
| Build | **Vite + React 18 + TypeScript** | Cepat, statis, mudah deploy |
| Styling | **Tailwind CSS** + CSS variables (token bagian 5) | Konsisten dengan design system |
| Routing | react-router (hash atau browser routing; set rewrite di Vercel) | |
| Grafik | **Recharts** | Area band ketidakpastian, garis kapasitas |
| Peta | **Leaflet + react-leaflet**, ubin OpenStreetMap (atribusi wajib) | Lingkaran per kab/kota di koordinat `regions.csv`; GeoJSON batas wilayah opsional |
| State | Zustand (skenario aktif, tanggal "hari ini", parameter) | |
| Data | papaparse (CSV), date-fns (tanggal, locale `id`) | |
| Tes | **Vitest** | Mesin + uji penerimaan Studi Kasus 2021 |
| Deploy | **Vercel** (static) | Tautan + QR untuk slide "Terima kasih" |
| Penyimpanan lokal | `localStorage` dibungkus try/catch, hanya untuk preferensi & log Mode Latihan | Tidak ada data pribadi |

### 4.1 Struktur repo

```
riak-web/
├── CLAUDE.md
├── docs/SPEC.md                 ← dokumen ini
├── public/data/                 ← salin isi folder data/ dari starter pack
│   ├── regions.csv  facilities.csv  commute.csv  lead_times.csv
│   ├── cases_2021_dki.csv  bor_obs_2021_dki.csv  events_2021.json
│   ├── pathogen_profiles.json  entry_points.csv  who_don.json (hasil skrip)
├── scripts/                     ← Python: prepare_data.py, backtest_2021.py, fetch_who_don.py
├── src/
│   ├── engine/                  ← logika murni, tanpa React
│   ├── data/                    ← loader & tipe data
│   ├── components/              ← UI kit (bagian 5.5)
│   ├── pages/                   ← Beranda, Radar, Peta, Respons, Simulator, Latihan, StudiKasus, Metodologi, Tentang
│   ├── store/
│   └── styles/tokens.css
└── tests/
```

---

## 5. Design system (tema brand)

Arah visual diambil dari slide referensi tim: **gradien diagonal biru → magenta**, lingkaran besar transparan (cocok dengan metafora riak air), pill kaca, kartu putih dengan border gradien yang memudar, judul sangat tebal dengan spasi huruf rapat.

### 5.1 Warna

```css
:root {
  /* Brand */
  --brand-blue: #1E3A8A;      /* utama */
  --brand-pink: #BE185D;      /* aksen */
  --brand-gradient: linear-gradient(135deg, #1E3A8A 0%, #5B2C7A 50%, #BE185D 100%);
  --brand-blue-50: #EEF2FB;
  --brand-blue-100: #DCE4F5;
  --brand-pink-50: #FCEEF4;
  --brand-pink-100: #F9D9E7;

  /* Netral */
  --ink: #14213D;             /* teks utama & judul (navy gelap seperti di slide) */
  --ink-muted: #5B6475;
  --line: #E3E7EF;
  --surface: #FFFFFF;
  --surface-2: #F7F8FC;

  /* Status BWB (fungsional, BUKAN warna brand) */
  --aman: #0F766E;    --aman-bg: #E6F4F1;
  --siaga: #B45309;   --siaga-bg: #FEF3C7;
  --terlewat: #B91C1C; --terlewat-bg: #FEE2E2;

  /* Label transparansi */
  --lbl-bersumber: #1E3A8A;
  --lbl-kalibrasi: #0F766E;
  --lbl-asumsi: #B45309;
  --lbl-ilustrasi: #7C3AED;
  --lbl-fiktif: #5B6475;
}
```

Aturan warna:
- **Magenta brand tidak boleh dipakai sebagai warna status** (supaya tidak tertukar dengan "Terlewat"). Status selalu memakai teks + ikon + warna, tidak hanya warna.
- Seri grafik: 1 `#1E3A8A` (proyeksi), 2 `#BE185D` (data nyata), 3 `#0F766E`, 4 `#B45309`; band ketidakpastian = biru brand 20% opacity; garis kapasitas = `--terlewat` putus-putus.
- Kontras teks minimal 4.5:1 (putih di atas `#1E3A8A` dan `#BE185D` aman).

### 5.2 Tipografi

Slide referensi memakai sans-serif geometris: judul sangat tebal dengan tracking rapat, isi ringan. **Nama font persisnya belum dipastikan** — Rifqi akan mengecek di Canva (klik teks → nama font terlihat di toolbar) lalu mengganti variabel di bawah. Sampai itu, pakai padanan gratis dari Google Fonts:

```css
--font-display: "Inter Tight", "Inter", system-ui, sans-serif;  /* judul: 800, letter-spacing -0.035em */
--font-body: "Inter", system-ui, sans-serif;                     /* isi: 400; subjudul besar: 300 */
--font-mono: "JetBrains Mono", ui-monospace, monospace;          /* angka tabel opsional */
```

Skala (desktop): Display 72/76 (hero "RIAK", 800) · H1 44/48 (800) · H2 30/36 (700) · H3 20/28 (700) · Body 16/26 · Small 14/22 · Caption 12/18. Angka besar (BWB, stat) 40–56, 800, `font-variant-numeric: tabular-nums`.

### 5.3 Elemen dari slide referensi → komponen web

| Elemen slide | Komponen web |
|---|---|
| Latar gradien diagonal + lingkaran besar putih transparan (opacity 6–10%) | `HeroGradient` di Beranda, header Mode Latihan, layar "Terima kasih"; lingkaran = animasi riak pelan (CSS, `prefers-reduced-motion` dimatikan) |
| Logo kecil + teks "RIAK" kiri atas | `Logo` (ikon riak: titik + 2 cincin) di navbar |
| Pill kaca kanan atas "OI IMERI ● ●" | `GlassPill` (border putih 40%, latar putih 10%, blur 8px) untuk label konteks: "Prototipe · OI IMERI 2026" |
| Bar kaca bawah "Presented by … 2026" | `GlassBar` untuk footer hero / CTA "Coba demo" |
| Garis tipis magenta di bawah header halaman | `Rule` gradien 2px |
| Pill gradien "PROGRES PROTOTIPE" (teks putih kapital tebal) | `SectionTag` di atas setiap judul halaman |
| Kartu dengan border gradien memudar | `GradientCard` (border 1.5px, mask gradien dari transparan ke biru/magenta), radius 24px |
| Daftar bernomor besar | `NumberedList` untuk alur demo & langkah metode |

### 5.4 Layout
- Lebar konten maks 1200px; grid 12 kolom; gutter 24px; radius kartu 20–24px; bayangan lembut `0 8px 24px rgba(20,33,61,.06)`.
- Navbar putih tipis: Logo · RADAR · Peta Riak · RESPONS · Simulator · Latihan · Studi Kasus 2021 · Metodologi. Pemilih skenario + tanggal "hari ini simulasi" di kanan.
- Banner tetap di bawah navbar (tipis, `--surface-2`): **"Prototipe · data agregat · untuk pejabat dan manajemen faskes, bukan informasi publik."**
- Responsif: desktop utama (demo layar laptop/proyektor), tablet & ponsel tetap terbaca (tabel menjadi kartu).

### 5.5 UI kit wajib
`Logo`, `SectionTag`, `GlassPill`, `GradientCard`, `StatTile`, `StatusBadge` (Aman/Siaga/Terlewat + ikon), `BwbCountdown`, `Angka` (lihat 5.6), `SourceBadge`, `RangeBar`, `TimelineBwb` (Hari ini → BWB → Faskes penuh), `ProjectionChart`, `RegionMap`, `OptionCard`, `DataMissing` (abu-abu: "Data belum tersedia — isi di Metodologi").

### 5.6 Komponen `Angka` (panel transparansi — wajib dipakai untuk setiap angka model)
```tsx
<Angka nilai={0.0436} format="rasio" status="KALIBRASI"
       sumber="Pasien ICU / kasus 14 hari, DKI 31 Mei 2021" />
```
Menampilkan angka + titik label berwarna; hover/fokus → tooltip berisi status, sumber, rentang. Status: `BERSUMBER | KALIBRASI | ASUMSI | ILUSTRASI | FIKTIF`.

---

## 6. Peta halaman & spesifikasi tiap halaman

Semua teks UI berbahasa Indonesia baku yang ringkas. Format tanggal `21 Jun 2021`; angka `1.014`, desimal `0,26`.

### 6.1 Beranda `/`
1. **Hero** (gradien brand, lingkaran riak): `SectionTag` "THE 10TH OPEN INNOVATION 2026 · IMERI FKUI"; display "RIAK"; subjudul "Radar Indikasi Awal Kedaruratan"; one-liner; tagline; tombol **"Coba demo"** (→ `/respons`) dan **"Lihat bukti 2021"** (→ `/studi-kasus-2021`); `GlassBar`: "Tim Universitas Indonesia · 2026".
2. **Masalah**: 3 `StatTile` (63 pasien · ~2.000 ton/hari · 3.114 apotek) + grafik keterisian isolasi & ICU DKI 2021 dari `bor_obs_2021_dki.csv` + garis waktu `events_2021.json`.
3. **Insight**: kutipan "Kapan paling lambat kami harus mulai bersiap?" + catatan kecil "Disusun dari peran kelembagaan yang terdokumentasi; wawancara pengguna masuk rencana validasi."
4. **Cara kerja**: 4 kartu modul (RADAR · RIAK · RESPONS · LATIHAN) dengan pertanyaan masing-masing (bagian 7) + rumus BWB + `TimelineBwb`.
5. **Bukti**: 3 angka uji 2021 (1–4 hari · 11–15 hari · 15–24 hari) → tautan Studi Kasus.
6. **Prinsip**: Penghubung, bukan pengganti · Data agregat saja · Keputusan oleh pejabat · Setiap angka bersumber.
7. **Footer**: tim (Mohammad Rifqi Faiz – FF, ketua; Kelvin Ricardo – FF; Alfie Vere Likhie – FK; Yuda Ardianysah – FEB; Harman Hakim – Fasilkom), sumber data, lisensi, "Prototipe, bukan sistem resmi pemerintah".

### 6.2 RADAR `/radar` (Fase −1: wabah masih di luar negeri)
- **Umpan Wabah Global**: daftar dari `who_don.json` (judul, tanggal, tautan ke WHO). Tampilkan "Snapshot diambil: {tanggal}". Bila file kosong → `DataMissing`. **Jangan mengarang item wabah.** Catatan: "WHO EIOS tersedia melalui Kemenkes (kerja sama)."
- **Kartu Profil Patogen**: pilih profil dari `pathogen_profiles.json` (acuan COVID-19 Delta; skenario Disease X berlabel FIKTIF). Tampilkan R (rentang), inkubasi, masa infeksius, rasio okupansi isolasi/ICU, kebutuhan O₂, jalur penularan, ketahanan di lingkungan + implikasi persiapan, terapi & alat. Setiap nilai pakai `Angka`.
  - Catatan wajib: "Ketahanan di lingkungan dipakai untuk memilih jenis persiapan, bukan untuk memprediksi kecepatan penyebaran."
- **Jam Pra-Kedatangan** (rumus 8.9): formulir input dari laporan WHO (negara, kasus harian terlapor, laju gandakan, penduduk negara, kedatangan per bulan dari negara itu). Keluaran: rentang perkiraan kasus impor pertama, rentang perkiraan faskes Jabodetabek penuh, dan **BWB barang berwaktu tunggu panjang** (oksigen impor, PSA, antiviral impor, APD) beserta status.
- **Pintu Masuk Prioritas**: urutan pintu masuk dari `entry_points.csv` (volume kunjungan wisman). Label "Sederhana". Bila kolom kosong → `DataMissing`.

### 6.3 Peta Riak `/peta` (Fase 0–2)
- Kontrol: profil/skenario, kab/kota & jumlah kasus awal (Fase 0) atau "gunakan data harian" (Fase 1), slider hari ke-0…120, toggle P10/P50/P90.
- Peta: lingkaran di tiap kab/kota, ukuran = kasus aktif, warna = tingkat keterisian proyeksi (skala biru → magenta; legenda jelas). Klik wilayah → panel kanan: grafik proyeksi kasus & beban (band P10–P90), hari sampai penuh, daftar faskes di wilayah itu (link ke RESPONS).
- Indikator fase: "Fase 0 — parameter literatur, ketidakpastian lebar" / "Fase 1 — dikalibrasi harian" / "Fase 2 — penggabung model aktif".
- Catatan: "Koordinat = rata-rata lokasi RS di wilayah, bukan batas administratif."

### 6.4 RESPONS `/respons` (inti demo)
1. Pilih wilayah → pilih faskes (daftar dari `facilities.csv`, bisa dicari).
2. **Kartu ringkas faskes**: nama, wilayah, kapasitas (berlabel ASUMSI_ALOKASI_2021 bila dari alokasi).
3. **Tabel Hitung Mundur & BWB** (diurutkan dari BWB terdekat), satu baris per sumber daya:
   `Sumber daya | Penuh/habis dalam (rentang hari) | Waktu tunggu | BWB (rentang tanggal) | Status | Tindakan disarankan`
   Sumber daya: TT isolasi · TT ICU · Oksigen · APD (N95) · Obat suportif · Tenaga kesehatan (perawat). Bila data kapasitas/stok kosong → baris `DataMissing`, bukan angka karangan.
4. **Tindakan disarankan** per status:
   - Aman (BWB > 14 hari): "Pantau; siapkan dokumen pengadaan."
   - Siaga (BWB 0–14 hari): "Mulai persiapan; dahulukan sumber daya dengan BWB terdekat."
   - Terlewat (BWB < 0): "Pinjam antarfaskes, rujuk ke faskes longgar, pertimbangkan opsi pembatasan."
   - Bila BWB_awal sudah lewat tetapi BWB_akhir belum: tampilkan "Siaga → sebagian rentang sudah lewat".
5. **Saran Pinjam Antarfaskes** (8.10).
6. **Daftar Kesiapsiagaan** (8.11).
7. Tombol "Ubah waktu tunggu" → membuka tabel waktu tunggu (Metodologi) yang dapat diedit; perubahan langsung menggeser BWB.

### 6.5 Simulator Opsi Pembatasan `/simulator`
- 3 `OptionCard`: **Opsi 1 Protokol + tes**, **Opsi 2 Batasi keramaian**, **Opsi 3 Batasi wilayah** + pembanding "Tanpa opsi". Input: tanggal mulai, pengurangan kontak (default ASUMSI 10% / 30% / 50%, dapat diubah), wilayah yang dikenai (semua / pilih).
- Keluaran per opsi: pergeseran tanggal puncak, perubahan tinggi puncak (%), pergeseran BWB per sumber daya, **hari-pasien tanpa tempat tidur** = Σ max(0, kebutuhan − kapasitas).
- Setiap opsi punya kotak **"Catatan dampak sosial-ekonomi & keadilan wilayah"** (teks dari tim; placeholder `[DIISI TIM]`).
- Kalimat tetap: "RIAK menampilkan dampak; keputusan ada pada pejabat berwenang."

### 6.6 Mode Latihan `/latihan` (masa damai)
- Pilih skenario Disease X (ringan/sedang/berat, label FIKTIF), wilayah, durasi.
- **Panel fasilitator**: tombol munculkan kejadian (inject): "Pengiriman oksigen tertunda 7 hari" (+7 ke LT oksigen), "RS {X} menutup ICU sementara" (kapasitas ICU = 0), "Lonjakan kedatangan dari negara terjangkit" (kasus awal ×2), "Tenaga kesehatan sakit 15%" (perawat −15%).
- **Log keputusan peserta**: tombol "Catat keputusan" (sumber daya, tindakan, waktu). Hitung metrik: **waktu sampai keputusan**, **% tindakan sebelum BWB**.
- **Ringkasan latihan**: halaman siap cetak (print CSS). Disimpan di localStorage (try/catch).

### 6.7 Studi Kasus 2021 `/studi-kasus-2021`
- Pemilih tanggal data terakhir: 7 / **10** (default) / 14 / 17 Juni 2021.
- Grafik pasien ICU (dan tab isolasi): band proyeksi (lambat/tengah/cepat), titik data nyata `bor_obs`, garis kapasitas 31 Mei (ICU 1.014; isolasi 6.621), pita BWB, garis kejadian (21 Jun ICU melewati kapasitas, 5 Jul konversi RS darurat dimulai).
- Tabel hasil 4 tanggal (bagian 9.3) dan tabel BWB contoh (9.4).
- 3 angka kunci: 1–4 hari · 11–15 hari · **15–24 hari**.
- Kotak keterbatasan (teks 9.5) — wajib tampil.
- Tombol unduh `backtest_2021.py` dan sumber data.

### 6.8 Metodologi & Asumsi `/metodologi`
- Penjelasan model (bagian 8) dalam bahasa awam + rumus.
- **Tabel parameter** (semua dari `pathogen_profiles.json` dan konstanta mesin) dengan status & sumber.
- **Tabel waktu tunggu** (`lead_times.csv`) yang dapat diedit (disimpan di state + localStorage); kolom label BERSUMBER/ASUMSI.
- Daftar sumber data + akses (Publik / Publik-kerja sama / Melalui Kemenkes).
- Keterbatasan & rencana validasi.

### 6.9 Tentang `/tentang`
Tim & peran, prinsip etika (bagian 11), regulasi yang didukung (UU 17/2023 tentang Kesehatan, PP 28/2024, Permenkes 1/2026 tentang KLB, Wabah, dan Krisis Kesehatan; UU 27/2022 tentang Pelindungan Data Pribadi — "pasal diverifikasi tim"), kontak `[EMAIL TIM]`.

---

## 7. Modul dan fase

| Modul | Fase | Pertanyaan yang dijawab | Fitur |
|---|---|---|---|
| RADAR | Fase −1 (wabah di luar negeri) | Kapan & lewat mana penyakit masuk? | Umpan Wabah Global, Kartu Profil Patogen, Pintu Masuk Prioritas, Jam Pra-Kedatangan |
| RIAK | Fase 0 (kasus pertama), Fase 1 (minggu 1–2), Fase 2 (minggu 3+) | Ke mana & secepat apa menyebar? | Peta Riak, Kalibrasi Harian, Penggabung model / AI 7–14 hari |
| RESPONS | Semua fase | Apa yang disiapkan, di mana, sampai kapan? | Hitung Mundur, **BWB**, Pinjam Antarfaskes, Simulator Opsi, Daftar Kesiapsiagaan |
| LATIHAN | Masa damai | Seberapa siap kita sebelum terjadi? | Mode Latihan |

Status fitur (tampilkan di Metodologi): Prototipe = Umpan Wabah, Profil Patogen, Jam Pra-Kedatangan, Peta Riak, Kalibrasi Harian, Hitung Mundur, BWB (inti), Simulator · Sederhana = Pintu Masuk, Pinjam Antarfaskes, Daftar Kesiapsiagaan, Mode Latihan · Rancangan = Prediksi AI 7–14 hari.

---

## 8. Mesin model (src/engine) — spesifikasi matematis

Semua fungsi **murni** (input → output), tanpa akses DOM, dengan tes unit. Satuan waktu 1 hari.

### 8.1 Notasi
Wilayah `i ∈ {13 kab/kota}`, faskes `f`, sumber daya `r ∈ {tt_isolasi, tt_icu, o2, apd, obat, nakes}`, hari `t`.
`N_i` penduduk, `ρ_i = N_i / luas_i` kepadatan.

### 8.2 Pencampuran komuter
`c_ij` = komuter dari i yang beraktivitas di j per hari / `N_i` (dari `commute.csv`).
`m_ij = c_ij` untuk j ≠ i; `m_ii = 1 − Σ_{j≠i} c_ij`.
Bila `commute.csv` kosong → **model gravitasi berlabel ASUMSI**: `c_ij ∝ N_j / d_ij²` (d = jarak haversine antar koordinat wilayah, km), dinormalkan sehingga `Σ_{j≠i} c_ij = φ_i` dengan `φ_i` = persentase komuter wilayah i (default ASUMSI 0,15 untuk semua bila tidak diisi). Tampilkan banner di Peta Riak: "Arus komuter memakai model gravitasi (asumsi) sampai tabel BPS dimasukkan."

### 8.3 Laju kontak dan kepadatan
`γ = 1 / infeksius_hari`, `σ = 1 / inkubasi_hari`.
`β_i = R · γ · (ρ_i^κ) / ρ̄_κ`, dengan `ρ̄_κ = Σ_k N_k ρ_k^κ / Σ_k N_k` (rata-rata tertimbang penduduk = 1, sehingga R rata-rata tetap R).
`κ` = besar pengaruh kepadatan: default **0,15 (ASUMSI)**, rentang 0–0,5, **dikalibrasi dari data** di Fase 1. **Jangan pernah memakai pengali tetap seperti "2,9×".**

### 8.4 SEIR metapopulasi (diskret harian)
```
N*_j = Σ_k m_kj N_k            (penduduk yang berada di j pada siang hari)
I*_j = Σ_k m_kj I_k
λ_i  = Σ_j m_ij · β_j · (1 − u_j(t)) · I*_j / N*_j        u_j = pengurangan kontak dari opsi pembatasan
infeksi_baru_i = S_i · (1 − e^(−λ_i))
E→I: σ·E_i      I→R: γ·I_i
S_i -= infeksi_baru_i;  E_i += infeksi_baru_i − σE_i;  I_i += σE_i − γI_i;  R_i += γI_i
```
Gunakan 4 sub-langkah per hari (dt = 0,25) agar stabil. Inisialisasi: semua S kecuali kasus awal di wilayah terpilih (Fase 0) atau dari data (Fase 1).

### 8.5 Dari infeksi ke beban faskes
- Kasus terkonfirmasi harian: `C_i(t) = rasio_terkonfirmasi · σ·E_i(t)`.
- Beban: `L_i(t) = Σ_{s=t−W+1..t} C_i(s)`, W = `jendela_beban_hari` (14).
- Kebutuhan isolasi `D_iso,i = k_iso · L_i`; ICU `D_icu,i = k_icu · L_i` (k dari profil; COVID acuan 0,262 & 0,0436 = KALIBRASI 2021).
- Alokasi ke faskes: `D_r,f = D_r,i · tt_r,f / Σ_{f∈i} tt_r,f` (proporsional kapasitas di wilayahnya; limpahan antarwilayah tidak dimodelkan di MVP — ditangani lewat Saran Pinjam).
- Oksigen (L/hari): `O2_f = 1440 · (30 · D_icu,f + 10 · p_o2 · D_iso,f)`, `p_o2` = proporsi pasien isolasi yang butuh O₂, default **0,3 (ASUMSI)**. 30 dan 10 L/menit = panduan WHO.
- APD N95 (buah/hari) = `n95_per_pasien_hari · (D_iso,f + D_icu,f)`, default ASUMSI 4 — dapat diedit.
- Obat suportif: stok dalam "hari pemakaian normal"; pemakaian berlipat sebanding `(D_iso,f + D_icu,f) / pasien_baseline` — bila `pasien_baseline` tidak ada → `DataMissing`.
- Perawat dibutuhkan = `D_iso,f / 6 + D_icu,f / 2` (rasio ASUMSI 1:6 dan 1:2, dapat diedit).
- Sumber daya tanpa data kapasitas/stok di `facilities.csv` → `DataMissing` (jangan mengisi angka).

### 8.6 Tanggal penuh / habis
- Kapasitas (TT, O₂ harian, perawat): `T_penuh(f,r)` = hari pertama `D_r,f(t) > Kapasitas_r,f + Masuk_r,f(t)` (Masuk = barang/kapasitas yang sedang dalam pengiriman, default 0).
- Stok (APD, obat): `T_habis` = hari pertama `Σ pemakaian > stok + Σ masuk`.
- Ensemble memberi rentang: `T_penuh_awal` dari kurva P90 (paling cepat), `T_penuh_akhir` dari kurva P10 (paling lambat). Bila tidak penuh dalam horizon (120 hari) → "tidak penuh dalam 120 hari".

### 8.7 Batas Waktu Bertindak & status
```
BWB_awal  = T_penuh_awal  − LT_max(r) − C
BWB_akhir = T_penuh_akhir − LT_min(r) − C
sisa = BWB_akhir − hari_ini
status = sisa > 14 ? "AMAN" : sisa >= 0 ? "SIAGA" : "TERLEWAT"
peringatan_sebagian = BWB_awal < hari_ini <= BWB_akhir
```
- `C` = cadangan aman ditetapkan Dinkes, default **3 hari** (dapat diubah). Di Studi Kasus 2021 **C = 0** agar sama dengan tabel proposal (tampilkan catatan ini).
- Bila satu sumber daya punya beberapa persiapan di `lead_times.csv` (mis. oksigen), tampilkan setiap persiapan sebagai sub-baris; persiapan dengan BWB terdekat menentukan urutan.
- Urutkan tabel RESPONS berdasarkan `BWB_akhir` naik.

### 8.8 Ketidakpastian, kalibrasi, dan penggabung model
- **Ensemble**: 200 run (seed tetap untuk reprodusibilitas); sampel R (segitiga min–nilai–max), inkubasi, infeksius, rasio_terkonfirmasi (uniform min–max), κ (0–0,5 pada Fase 0; posterior sempit pada Fase 1). Keluaran P10/P50/P90. Jalankan di Web Worker bila > 50 ms.
- **Fase 1 – Kalibrasi harian** (≥ 7 hari data): cari pengali `θ` pada β (grid 0,3–3,0) dan `κ` (grid 0–0,5) yang meminimalkan Σ_i Σ_{14 hari terakhir} (log(1+C_obs) − log(1+C_model))². Tampilkan "Dikalibrasi dengan data sampai {tanggal}".
- **Fase 2 – Penggabung model** (≥ 21 hari data), status "versi awal":
  Model A = SEIR terkalibrasi; Model B = regresi log-linear kasus 14 hari terakhir per wilayah (statistik sederhana).
  Bobot `w_A ∝ 1/MAE_A(7 hari terakhir)`, `w_B ∝ 1/MAE_B`; proyeksi 7–14 hari = `w_A·A + w_B·B`.
  **Fallback**: bila data terputus > 3 hari atau MAE gabungan > MAE A → pakai Model A saja + banner "Penggabung dinonaktifkan; kembali ke model epidemiologis."
  Label UI: "Prediksi AI 7–14 hari (rancangan). Versi awal ini memakai penggabung statistik; model AI dilatih setelah data wabah tersedia." **Jangan menyebut model B sebagai AI.**

### 8.9 Jam Pra-Kedatangan (RADAR)
Input per negara terjangkit `c`: kasus harian terlapor `Y_c(t0)`, laju gandakan `T2` (hari) → `r = ln2/T2`, penduduk `P_c`, kedatangan ke Indonesia per hari `V_c` (wisman per bulan / 30; catatan: belum termasuk WNI yang pulang → perkiraan bawah), faktor kurang lapor `u` (ASUMSI 5–20).
```
prevalensi_infeksius(t) = u · Y_c(t0) · e^(r(t−t0)) · infeksius_hari / P_c
impor_harian(t) = V_c · prevalensi_infeksius(t)
T_impor = hari pertama Σ impor_harian ≥ 1   (dihitung untuk u_min dan u_max → rentang)
T_kasus_lokal_pertama = T_impor + inkubasi_hari
```
Lalu jalankan model lokal dengan kasus awal di wilayah pintu masuk prioritas (default Kota Tangerang untuk Bandara Soekarno-Hatta) mulai `T_kasus_lokal_pertama` → `T_penuh` → BWB untuk persiapan berwaktu tunggu panjang (oksigen impor 4–6 minggu, PSA ~12 minggu, antiviral impor 2–8 minggu, APD 2–6 minggu).
Label: "Metode sederhana. Model risiko impor berbasis jaringan penerbangan (Klamser dkk., 2024) adalah pengembangan berikutnya."

### 8.10 Saran Pinjam Antarfaskes
Untuk faskes f dengan status SIAGA/TERLEWAT pada sumber daya r: daftar 5 faskes terdekat (haversine) dengan `sisa_kapasitas_r(T_penuh_f) > 0`, urut jarak; tampilkan jarak (km), sisa kapasitas, status faskes tersebut.

### 8.11 Daftar Kesiapsiagaan
Dari profil patogen: jalur udara → "Ventilasi & N95"; tahan di permukaan → "Disinfeksi"; daftar `terapi_dan_alat` → item pengadaan; ditambah semua persiapan dari `lead_times.csv` yang berstatus SIAGA/TERLEWAT, diurutkan BWB.

### 8.12 Opsi pembatasan
`u_j(t) = u_opsi` untuk t ≥ tanggal_mulai pada wilayah terpilih. Metrik: tanggal & tinggi puncak `D_iso` total, pergeseran BWB, hari-pasien tanpa tempat tidur `Σ_t Σ_f max(0, D_r,f − Kap_r,f)` untuk r ∈ {tt_isolasi, tt_icu}.

---

## 9. Studi Kasus 2021 — algoritma & angka penerimaan

Implementasi TypeScript `engine/backtest2021.ts` harus mereproduksi `scripts/backtest_2021.py` (port langsung).

### 9.1 Data
`cases_2021_dki.csv` (kasus harian DKI dari INACOVID, bersumber data resmi), `bor_obs_2021_dki.csv`, `events_2021.json`.

### 9.2 Prosedur
1. `k7` = rata-rata bergerak 7 hari kasus harian. Beban `L(t)` = jumlah kasus 14 hari terakhir.
2. Kalibrasi pada 31 Mei 2021: `kIso = 2176 / L(31 Mei)`, `kICU = 362 / L(31 Mei)` (hasil: L = 8.306; kIso ≈ 0,262; kICU ≈ 0,0436).
3. Pada tanggal data terakhir `c`: `g = (k7(c) / k7(c−7))^(1/7)`; rentang `g^0,85`, `g`, `g^1,15`.
4. Proyeksi 60 hari: kasus(c+h) = `k7(c) · g^h`; gabungkan dengan data historis sampai c; hitung L.
5. Tanggal penuh = hari pertama setelah c ketika `L·kIso > 6.621` (isolasi) atau `L·kICU > 1.014` (ICU).
6. Tanggal nyata = interpolasi linear rilis 14 & 23 Juni: isolasi ~16 Juni, ICU ~21 Juni.
7. BWB dengan `lead_times.csv`, C = 0.

### 9.3 Angka penerimaan (tes WAJIB lulus, toleransi ±1 hari untuk tanggal; ±0,1 untuk waktu gandakan)

| Data sampai | Waktu gandakan | ICU penuh (cepat–lambat) | Isolasi penuh (cepat–lambat) | Kenyataan |
|---|---|---|---|---|
| 7 Juni | 26,6 hari | 12–22 Juli | 15–26 Juli | ICU ~21 Jun; isolasi ~16 Jun |
| **10 Juni** | 9,4 hari | **22–25 Juni** | 23–26 Juni | idem |
| 14 Juni | 5,9 hari | 18–19 Juni | 19–20 Juni | idem |
| 17 Juni | 6,5 hari | 19 Juni | 20 Juni | idem |

### 9.4 Contoh BWB (data sampai 10 Juni, C = 0)

| Persiapan | Perkiraan penuh | Waktu tunggu | BWB | Status 10 Jun |
|---|---|---|---|---|
| TT isolasi tambahan (RS darurat) | 23–26 Jun | 5–11 hari | 12–21 Jun | SIAGA |
| TT ICU tambahan | 22–25 Jun | 14–30 hari* | 23 Mei–11 Jun | SIAGA → sebagian lewat |
| Oksigen dari pemasok internasional | 22–25 Jun** | 4–6 minggu | 11–28 Mei | TERLEWAT |

\* Asumsi yang perlu divalidasi. \*\* Penyederhanaan: kebutuhan oksigen diasumsikan melampaui pasokan rutin bersamaan dengan penuhnya tempat tidur.

Narasi wajib: "Dengan data sampai 10 Juni, proyeksi ICU penuh (22–25 Juni) berselisih 1–4 hari dari kenyataan (~21 Juni), memberi peringatan 11–15 hari. BWB penambahan tempat tidur jatuh pada 11–20 Juni, sedangkan konversi RS darurat dimulai 5 Juli: kesenjangan keputusan 15–24 hari. Oksigen impor sudah terlewat pada 10 Juni, sehingga harus dipicu dari RADAR (Delta di Indonesia sejak 3 Mei)."
> Catatan: "11–20 Juni" = tanggal ICU penuh (22–25 Juni) dikurangi waktu tunggu tempat tidur RS darurat (5–11 hari); inilah pita BWB pada grafik Studi Kasus. Tabel 9.4 memakai tanggal penuh dan waktu tunggu masing-masing sumber daya. Tampilkan keduanya apa adanya.

### 9.5 Keterbatasan (teks wajib tampil)
"Uji ini memakai satu wilayah, proksi beban sederhana (kasus 14 hari), empat titik data keterisian, dan dilakukan setelah kejadian. Data sampai 7 Juni menghasilkan proyeksi terlalu lambat; tempat tidur isolasi diremehkan sekitar seminggu. Ini bukti kelayakan konsep, bukan validasi akhir."

---

## 10. Data

### 10.1 File di starter pack (`data/` → salin ke `public/data/`)

| File | Isi | Status |
|---|---|---|
| `regions.csv` | kode BPS, nama, provinsi, **penduduk (KOSONG)**, **luas_km2 (KOSONG)**, lat/lon (rata-rata lokasi RS), n_rs | Wajib diisi dari BPS sebelum demo |
| `facilities.csv` | 461 RS di 13 kab/kota (daftar RS terbuka INACOVID, lisensi MIT): kode_rs, nama, kode_wilayah, tipe, lat, lon, tempat_tidur, **tt_isolasi & tt_icu (ASUMSI_ALOKASI_2021)**, kolom O₂/APD/obat/perawat kosong | Kapasitas isolasi/ICU = kapasitas COVID DKI 31 Mei 2021 (6.621 & 1.014) dialokasikan proporsional tempat tidur (rasio 0,2724 dan 0,0417); rasio sama untuk kab/kota lain |
| `commute.csv` | header saja (asal, tujuan, komuter_per_hari, sumber) | Isi dari BPS *Statistik Komuter Jabodetabek 2023*; sementara model gravitasi |
| `lead_times.csv` | 9 persiapan, LT min/max (hari), dasar, label BERSUMBER/ASUMSI | Kelvin konfirmasi yang ASUMSI |
| `cases_2021_dki.csv` | kasus harian DKI 1 Mar–30 Sep 2021 | Dari INACOVID |
| `bor_obs_2021_dki.csv` | keterisian isolasi & ICU 31 Mei, 14 Jun, 23 Jun, 6 Jul, 18 Jul 2021 + sumber | Bersumber |
| `events_2021.json` | 12 kejadian garis waktu 2021 | Bersumber |
| `pathogen_profiles.json` | profil COVID-19 Delta (acuan) + 3 skenario Disease X (FIKTIF) | Nilai klinis diverifikasi Alfie |
| `entry_points.csv` | 5 pintu masuk utama, kolom volume kosong | Isi dari tabel BPS wisman per pintu masuk |

`who_don.json` dibuat oleh `scripts/fetch_who_don.py` (jalankan di komputer lokal; endpoint WHO mungkin tidak dapat diakses dari sandbox).

### 10.2 Aturan data
- Tidak ada data individu. Tidak ada angka karangan: kolom kosong → `DataMissing` dan halaman Metodologi menampilkan daftar "Data yang belum tersedia".
- Setiap nilai yang ditampilkan memiliki status (5.6). Data demo yang sengaja dibuat untuk ilustrasi disimpan di file terpisah `demo_*.json` dan berlabel **ILUSTRASI**.
- Atribusi: "Daftar RS & kasus 2021: INACOVID (Eri Airlangga, lisensi MIT), bersumber data resmi"; "© kontributor OpenStreetMap"; BPS; WHO.

### 10.3 Sumber data sistem nyata (untuk halaman Metodologi)
| Sumber | Isi | Akses |
|---|---|---|
| WHO Disease Outbreak News | Laporan wabah resmi | Publik (API) |
| WHO EIOS 2.0 | Intelijen epidemi sumber terbuka | Melalui Kemenkes |
| BPS | Penduduk; Statistik Komuter Jabodetabek 2023; wisman per pintu masuk & kebangsaan | Publik |
| Daftar RS terbuka | RS, tempat tidur, koordinat | Publik |
| SIRANAP / SIRS RS Online | Ketersediaan tempat tidur | Publik / kerja sama |
| SKDR, SATUSEHAT | Sinyal sindrom & layanan agregat | Kerja sama Kemenkes |
| e-Katalog, laporan logistik | Pemasok & waktu kirim | Publik / kerja sama |

---

## 11. Etika, klaim, dan bahasa (ATURAN KERAS)

**Dilarang ditulis di mana pun di website:**
- "pertama di dunia", "satu-satunya", "AI memprediksi pandemi", "menyelamatkan X nyawa", "akurasi X%" tanpa uji.
- Pengali kepadatan tetap (mis. "2,9× lebih cepat").
- Data wabah, angka kapasitas, atau stok yang dikarang.

**Wajib:**
- Banner akses: "Prototipe · data agregat · untuk pejabat dan manajemen faskes, bukan informasi publik."
- Kalimat keputusan: "RIAK memberi tenggat, opsi, dan dampak; keputusan ada pada pejabat berwenang."
- Klaim kebaruan yang jujur: "Dalam penelusuran tim, belum ditemukan sistem yang menyambungkan sinyal wabah luar negeri, penyebaran antarwilayah, dan kapasitas tiap faskes menjadi tenggat keputusan." + sebut preseden tingkat satu RS.
- Jalur dampak: "Persiapan tepat waktu → tempat tidur, oksigen, dan tenaga kesehatan tersedia saat lonjakan → pasien tidak menunggu perawatan → kematian yang dapat dicegah berkurang. Kami tidak mengklaim jumlah nyawa; yang diukur adalah ketepatan waktu persiapan."
- Komunikasi risiko: BWB adalah alat kerja internal; pesan publik melalui kanal resmi pemerintah.
- Privasi: tanpa cookie pelacak, tanpa analitik pihak ketiga, tanpa formulir data pribadi.

**Glosarium UI:** Batas Waktu Bertindak (BWB) · Waktu tunggu (lead time) · Cadangan aman · Hitung mundur · Faskes · TT isolasi · TT ICU · Kalibrasi · Rentang ketidakpastian · Opsi pembatasan · Latihan tabletop.

---

## 12. Aksesibilitas & performa
- WCAG 2.1 AA: kontras, fokus terlihat, navigasi keyboard, label ARIA pada grafik (ringkasan teks di bawah setiap grafik), status tidak hanya warna.
- `prefers-reduced-motion`: matikan animasi riak.
- Lighthouse ≥ 90 (Performance, Accessibility, Best Practices). Bundle awal < 400 KB gzip (lazy-load peta & grafik).
- Ensemble 200 run untuk 13 wilayah × 120 hari < 1 detik di laptop (Web Worker).

---

## 13. Kriteria penerimaan (Definition of Done)
1. `npm run test` lulus, termasuk tes 9.3 dan 9.4 (tanggal ±1 hari).
2. Tes mesin: konservasi populasi SEIR (S+E+I+R konstan ±1e-6), BWB & status sesuai 8.7 untuk kasus batas (sisa = 15, 14, 0, −1), `DataMissing` muncul bila kapasitas kosong.
3. Halaman RESPONS menampilkan tabel BWB untuk faskes mana pun di `facilities.csv` dan mengurutkannya dari BWB terdekat.
4. Mengubah waktu tunggu di Metodologi langsung menggeser BWB di RESPONS.
5. Simulator menampilkan 3 opsi + pembanding dengan metrik 8.12.
6. Setiap angka model memakai `Angka` dengan status; tidak ada angka tanpa label.
7. Tidak ada teks terlarang (bagian 11) — tambahkan tes grep sederhana di CI.
8. Deploy Vercel berhasil; tautan dapat dibuka di ponsel; QR dibuat dari tautan final.

---

## 14. Urutan pengerjaan

| # | Tugas | Keluaran |
|---|---|---|
| 1 | Scaffold Vite+React+TS+Tailwind, token 5.1–5.2, layout, navbar, banner, UI kit inti | Kerangka berjalan |
| 2 | Loader data + tipe (`src/data`) | Semua file terbaca, `DataMissing` bekerja |
| 3 | `backtest2021.ts` + tes 9.3/9.4 + halaman Studi Kasus | Bukti feasibility siap demo |
| 4 | `seir.ts`, `burden.ts`, `bwb.ts`, `ensemble.ts` + tes | Mesin inti |
| 5 | Halaman RESPONS (inti demo) | Tabel BWB per faskes |
| 6 | Peta Riak | Peta + panel wilayah |
| 7 | Simulator Opsi | 3 opsi |
| 8 | Beranda | Cerita lengkap |
| 9 | RADAR (profil patogen, Jam Pra-Kedatangan, umpan WHO, pintu masuk) | Fase −1 |
| 10 | Metodologi & Tentang | Panel transparansi |
| 11 | Deploy Vercel + QR | Tautan untuk deck |
| 12 | (Grand Final) Kalibrasi harian, penggabung model, Mode Latihan, pinjam antarfaskes, daftar kesiapsiagaan | TRL 3–4 |

---

## 15. Data yang masih harus diisi tim (jangan diisi agen dengan tebakan)
- [ ] `regions.csv`: penduduk & luas 13 kab/kota (BPS, Dalam Angka terbaru) — **Rifqi/Harman**
- [ ] `commute.csv`: tabel asal–tujuan Statistik Komuter Jabodetabek 2023 — **Harman**
- [ ] `entry_points.csv`: volume wisman per pintu masuk — **Harman**
- [ ] `lead_times.csv`: konfirmasi baris ASUMSI ke apoteker IFK/RS/PBF — **Kelvin**
- [ ] `pathogen_profiles.json`: verifikasi R, inkubasi, masa infeksius, proporsi — **Alfie**
- [ ] Konstanta ASUMSI (p_o2 0,3; N95 4/pasien/hari; rasio perawat 1:6 & 1:2; κ 0,15; komuter 0,15) — **Alfie + Kelvin**
- [ ] Catatan dampak sosial-ekonomi tiap opsi pembatasan — **Ardi + Alfie**
- [ ] `[EMAIL TIM]`, nama lengkap anggota — **Rifqi**
- [ ] Nama font persis dari Canva → ganti `--font-display`/`--font-body` — **Rifqi**

---

## 16. Referensi utama (tampilkan di Metodologi)
AHRQ – Northeastern Hospital Surge Capacity Planning Model · BPS (2024) Statistik Komuter Jabodetabek 2023 · BPS kunjungan wisman menurut pintu masuk · Bushmaker dkk. (2023) Emerg Infect Dis 29(5) · CNN Indonesia (6 Juli 2021) · INACOVID (Eri Airlangga, MIT) · Kemenkes (5 Juli 2021; 1 Oktober 2025; 3 September 2026) · Klamser dkk. (2024) PLOS Comput Biol 20(1) · Liu & Rocklöv (2021) J Travel Med · Morris dkk. (2021) eLife 10 · Pemprov DKI siaran pers PPID (31 Mei, 14 & 23 Juni 2021) · Permenkes 1/2026 · PP 28/2024 · Safavi dkk. (2021) Disaster Med Public Health Prep · Setkab (12 Juli 2021) · Soegiantoro dkk. (2022) JMKI 10(1) · The Jakarta Post/Reuters (14 Juli 2021) · UU 17/2023 · UU 27/2022 · VOI (2021) · Weissman dkk. (2020) Ann Intern Med 173(1) · WHO EIOS 2.0 (13 Oktober 2025) · WHO ESFT v4.1 & Adaptt · WHO AFRO (2021) · Wu dkk. (2022) JAMA Netw Open · Zakianis dkk. (2021) One Health 13.
