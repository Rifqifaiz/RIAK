"""Ambil lokasi puskesmas Jabodetabek dari OpenStreetMap (Overpass API).

Pemakaian:
    python scripts/fetch_puskesmas_osm.py public/data/puskesmas_osm.json
    python scripts/fetch_puskesmas_osm.py public/data/puskesmas_osm.json --from-file mentah.json

Hasil hanya berisi LOKASI dan atribut publik OSM (nama, alamat, jam buka, telepon).
OSM tidak memuat kapasitas/stok, jadi kolom itu sengaja tidak ada — UI menampilkan
DataMissing. Lisensi data: ODbL (c) kontributor OpenStreetMap.
"""
import json
import sys
import urllib.parse
import urllib.request
from datetime import datetime, timezone

BBOX = (-6.9, 106.3, -5.9, 107.4)  # selatan, barat, utara, timur
QUERY = (
    '[out:json][timeout:100];'
    f'nwr["name"~"puskesmas",i]({BBOX[0]},{BBOX[1]},{BBOX[2]},{BBOX[3]});'
    'out center tags;'
)
SKIP_WORDS = ('apotek', 'apotik', 'farmasi', 'parkir', 'gudang', 'ambulan')


def fetch() -> dict:
    url = 'https://overpass-api.de/api/interpreter?' + urllib.parse.urlencode({'data': QUERY})
    req = urllib.request.Request(url, headers={'User-Agent': 'riak-prototype/0.1', 'Accept': 'application/json'})
    with urllib.request.urlopen(req, timeout=120) as r:
        return json.load(r)


def clean(raw: dict) -> dict:
    items = []
    seen = set()
    for el in raw.get('elements', []):
        tags = el.get('tags', {})
        name = (tags.get('name') or '').strip()
        if not name or any(w in name.lower() for w in SKIP_WORDS):
            continue
        if tags.get('amenity') in ('pharmacy', 'parking'):
            continue
        lat = el.get('lat', el.get('center', {}).get('lat'))
        lon = el.get('lon', el.get('center', {}).get('lon'))
        if lat is None or lon is None:
            continue
        key = (name.lower(), round(lat, 3), round(lon, 3))
        if key in seen:
            continue
        seen.add(key)
        alamat = ', '.join(
            v for v in (
                tags.get('addr:street'),
                tags.get('addr:subdistrict') or tags.get('addr:village'),
                tags.get('addr:district'),
                tags.get('addr:city'),
            ) if v
        )
        items.append({
            'id': f"{el['type']}/{el['id']}",
            'nama': name,
            'lat': round(lat, 6),
            'lon': round(lon, 6),
            'alamat': alamat or None,
            'jam_buka': tags.get('opening_hours'),
            'telepon': tags.get('phone') or tags.get('contact:phone'),
        })
    items.sort(key=lambda x: x['nama'])
    return {
        'sumber': 'OpenStreetMap via Overpass API',
        'lisensi': 'ODbL — (c) kontributor OpenStreetMap',
        'diambil': raw.get('osm3s', {}).get('timestamp_osm_base') or datetime.now(timezone.utc).isoformat(),
        'catatan': 'Hanya lokasi & atribut publik. Kapasitas/stok puskesmas tidak tersedia di OSM.',
        'items': items,
    }


def main() -> None:
    if len(sys.argv) < 2:
        sys.exit(__doc__)
    out = sys.argv[1]
    if '--from-file' in sys.argv:
        with open(sys.argv[sys.argv.index('--from-file') + 1], encoding='utf-8') as f:
            raw = json.load(f)
    else:
        raw = fetch()
    data = clean(raw)
    with open(out, 'w', encoding='utf-8') as f:
        json.dump(data, f, ensure_ascii=False, separators=(',', ':'))
    print(f"{len(data['items'])} puskesmas -> {out}")


if __name__ == '__main__':
    main()
