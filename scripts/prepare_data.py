"""
Menyiapkan data awal prototipe RIAK dari repositori INACOVID (lisensi MIT).

Pakai:
  python scripts/prepare_data.py <folder_inacovid>/data/csv data

Keluaran (ke folder data/):
  regions.csv          13 kab/kota Jabodetabek; penduduk & luas WAJIB diisi dari BPS
  facilities.csv       RS di 13 kab/kota (daftar RS terbuka); tt_isolasi & tt_icu = ASUMSI alokasi
  cases_2021_dki.csv   kasus harian DKI Jakarta 1 Mar - 30 Sep 2021
"""
import sys
import pandas as pd

src, out = sys.argv[1], sys.argv[2]

REGIONS = [
    # kode_bps, nama, provinsi, label wilayah di INACOVID
    ("3171", "Jakarta Selatan", "DKI Jakarta", ["JAKARTA SELATAN, DKI JAKARTA"]),
    ("3172", "Jakarta Timur", "DKI Jakarta", ["JAKARTA TIMUR, DKI JAKARTA", "KOTA JAKARTA TIMUR, DKI JAKARTA"]),
    ("3173", "Jakarta Pusat", "DKI Jakarta", ["JAKARTA PUSAT, DKI JAKARTA"]),
    ("3174", "Jakarta Barat", "DKI Jakarta", ["JAKARTA BARAT, DKI JAKARTA"]),
    ("3175", "Jakarta Utara", "DKI Jakarta", ["JAKARTA UTARA, DKI JAKARTA"]),
    ("3201", "Kabupaten Bogor", "Jawa Barat", ["BOGOR, JAWA BARAT"]),
    ("3216", "Kabupaten Bekasi", "Jawa Barat", ["BEKASI, JAWA BARAT"]),
    ("3271", "Kota Bogor", "Jawa Barat", ["KOTA BOGOR, JAWA BARAT"]),
    ("3275", "Kota Bekasi", "Jawa Barat", ["KOTA BEKASI, JAWA BARAT"]),
    ("3276", "Kota Depok", "Jawa Barat", ["KOTA DEPOK, JAWA BARAT"]),
    ("3603", "Kabupaten Tangerang", "Banten", ["TANGERANG, BANTEN"]),
    ("3671", "Kota Tangerang", "Banten", ["KOTA TANGERANG, BANTEN"]),
    ("3674", "Kota Tangerang Selatan", "Banten", ["KOTA TANGERANG SELATAN, BANTEN"]),
]

h = pd.read_csv(f"{src}/hospitals.csv", dtype={"kode_rs": str})
lab2kode = {lab: k for k, _, _, labs in REGIONS for lab in labs}
h = h[h.wilayah.isin(lab2kode)].copy()
h["kode_wilayah"] = h.wilayah.map(lab2kode)
h = h.dropna(subset=["lat", "lon"])

# --- regions.csv: koordinat = rata-rata koordinat RS (pusat faskes), BUKAN centroid administratif
rows = []
for k, nama, prov, _ in REGIONS:
    sub = h[h.kode_wilayah == k]
    rows.append(dict(kode=k, nama=nama, provinsi=prov, penduduk="", luas_km2="",
                     lat=round(sub.lat.mean(), 5), lon=round(sub.lon.mean(), 5), n_rs=len(sub),
                     catatan="ISI penduduk & luas_km2 dari BPS (Dalam Angka terbaru); lat/lon = rata-rata lokasi RS"))
pd.DataFrame(rows).to_csv(f"{out}/regions.csv", index=False)

# --- facilities.csv
# ASUMSI: kapasitas COVID DKI 31 Mei 2021 (isolasi 6.621, ICU 1.014; rilis Pemprov DKI)
# dialokasikan proporsional terhadap tempat_tidur seluruh RS DKI di daftar ini.
# Rasio yang sama dipakai untuk kab/kota lain. Nilai ini HANYA untuk prototipe.
h["tempat_tidur"] = pd.to_numeric(h.tempat_tidur, errors="coerce").fillna(0).astype(int)
dki = h[h.kode_wilayah.str.startswith("31")]
tot = dki.tempat_tidur.sum()
r_iso, r_icu = 6621 / tot, 1014 / tot
h["tt_isolasi"] = (h.tempat_tidur * r_iso).round().astype(int)
h["tt_icu"] = (h.tempat_tidur * r_icu).round().astype(int)
for col in ["o2_liter_hari", "apd_n95_stok", "obat_suportif_stok_hari", "perawat"]:
    h[col] = ""
h["label_kapasitas"] = "ASUMSI_ALOKASI_2021"
fac = h[["kode_rs", "nama", "kode_wilayah", "tipe", "lat", "lon", "tempat_tidur", "tt_isolasi", "tt_icu",
         "o2_liter_hari", "apd_n95_stok", "obat_suportif_stok_hari", "perawat", "label_kapasitas"]]
fac.to_csv(f"{out}/facilities.csv", index=False)

# --- cases_2021_dki.csv
d = pd.read_csv(f"{src}/ext.prov.csv", parse_dates=["Date"])
j = d[d.Location == "DKI JAKARTA"].set_index("Date").sort_index()["KASUS"].asfreq("D").fillna(0).astype(int)
j = j["2021-03-01":"2021-09-30"]
j.rename("kasus").rename_axis("tanggal").reset_index().to_csv(f"{out}/cases_2021_dki.csv", index=False)

print(f"regions: {len(rows)} | facilities: {len(fac)} (DKI {len(dki)}, total TT DKI {tot}; "
      f"rasio isolasi {r_iso:.4f}, ICU {r_icu:.4f}) | cases: {len(j)} hari")
