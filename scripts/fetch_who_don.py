"""
Mengambil Disease Outbreak News (DON) terbaru dari API publik WHO dan menyimpannya
sebagai snapshot statis untuk website (tidak di-fetch dari browser, supaya tidak kena CORS
dan website tetap jalan saat API lambat).

Pakai:
  python scripts/fetch_who_don.py public/data/who_don.json

Catatan:
- Endpoint OData WHO: https://www.who.int/api/news/diseaseoutbreaknews
  Nama kolom bisa berubah; skrip ini menyimpan field yang dikenali dan tetap menyimpan
  'raw_keys' supaya mudah disesuaikan. Cek ulang saat pertama dijalankan.
- Jangan mengarang isi wabah. Bila gagal, file lama dibiarkan dan UI menampilkan
  tanggal snapshot terakhir.
"""
import json, sys, datetime, urllib.request, urllib.parse

OUT = sys.argv[1] if len(sys.argv) > 1 else "public/data/who_don.json"
BASE = "https://www.who.int/api/news/diseaseoutbreaknews"
params = {"$orderby": "PublicationDate desc", "$top": "30"}
url = BASE + "?" + urllib.parse.urlencode(params, safe="$ ")

def pick(d, *keys):
    for k in keys:
        if k in d and d[k]:
            return d[k]
    return None

try:
    with urllib.request.urlopen(urllib.request.Request(url, headers={"User-Agent": "RIAK-prototype"}), timeout=30) as r:
        data = json.load(r)
except Exception as e:
    print("Gagal mengambil WHO DON:", e)
    sys.exit(1)

items = data.get("value", data if isinstance(data, list) else [])
out = []
for it in items:
    url_name = pick(it, "UrlName", "ItemDefaultUrl")
    out.append({
        "judul": pick(it, "Title", "OverrideTitle"),
        "tanggal": (pick(it, "PublicationDate", "DateCreated") or "")[:10],
        "ringkasan": pick(it, "Summary", "Overview"),
        "url": f"https://www.who.int/emergencies/disease-outbreak-news/item/{url_name.strip('/')}" if url_name else None,
        "raw_keys": sorted(it.keys())[:40],
    })

json.dump({"sumber": "WHO Disease Outbreak News (API publik)", "diambil": datetime.datetime.utcnow().isoformat() + "Z",
           "item": out}, open(OUT, "w", encoding="utf-8"), ensure_ascii=False, indent=2)
print(f"{len(out)} item disimpan ke {OUT}")
