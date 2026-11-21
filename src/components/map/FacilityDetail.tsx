import React, { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { X, MapPin, ExternalLink, Image as ImageIcon, Satellite, Building2, Clock, Phone, Navigation, Loader2 } from 'lucide-react';
import { Facility, LeadTime, Region } from '../../types';
import { calculateBwb } from '../../engine/bwb';
import { Angka } from '../common/Angka';
import { DataMissing } from '../common/DataMissing';
import { StatusBadge } from '../common/StatusBadge';
import { aerialImageUrl, ESRI_ATTRIBUTION, fetchWikiPhoto, googleLinks, WikiPhoto } from '../../data/media';
import { haversineKm, isValidJabodetabekCoord } from '../../data/geo';
import { MapSelection, Puskesmas } from './FacilityLayer';

const ACUAN = '2021-06-10';
const BULAN = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'];
const tgl = (iso: string) => {
  const [y, m, d] = iso.split('-').map(Number);
  return y && m && d ? `${d} ${BULAN[m - 1]} ${y}` : iso;
};
const km = (v: number) => `${v.toLocaleString('id-ID', { maximumFractionDigits: 1 })} km`;

interface Props {
  selection: MapSelection;
  regions: Region[];
  facilities: Facility[];
  puskesmas: Puskesmas[];
  leadTimes: LeadTime[];
  casesDki: Map<string, number>;
  onClose: () => void;
  onSelect: (s: MapSelection) => void;
}

/** Foto asli (Wikipedia bila cocok) + citra satelit lokasi. */
const MediaHeader: React.FC<{ nama: string; lat: number; lon: number }> = ({ nama, lat, lon }) => {
  const [photo, setPhoto] = useState<WikiPhoto | null | undefined>(undefined);
  const [tab, setTab] = useState<'foto' | 'satelit'>('satelit');
  const [imgLoaded, setImgLoaded] = useState(false);

  useEffect(() => {
    let alive = true;
    setPhoto(undefined);
    setTab('satelit');
    fetchWikiPhoto(nama, lat, lon).then((p) => {
      if (!alive) return;
      setPhoto(p);
      if (p) setTab('foto');
    });
    return () => {
      alive = false;
    };
  }, [nama, lat, lon]);

  useEffect(() => setImgLoaded(false), [tab, nama]);

  const src = tab === 'foto' && photo ? photo.thumb : aerialImageUrl(lat, lon);

  return (
    <div>
      <div className="relative aspect-[16/9] overflow-hidden rounded-xl bg-surface-2">
        {!imgLoaded && <div className="absolute inset-0 animate-pulse bg-gradient-to-br from-brand-blue-50 to-brand-pink-50" />}
        <img
          key={src}
          src={src}
          alt={tab === 'foto' ? `Foto ${nama}` : `Citra satelit lokasi ${nama}`}
          onLoad={() => setImgLoaded(true)}
          className={`h-full w-full object-cover transition-opacity duration-500 ${imgLoaded ? 'opacity-100' : 'opacity-0'}`}
        />
        {tab === 'satelit' && (
          <span className="pointer-events-none absolute left-1/2 top-1/2 h-6 w-6 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-white shadow-[0_0_0_4px_rgba(244,114,182,0.6)]" />
        )}
        <div className="absolute left-2 top-2 flex gap-1 rounded-lg bg-black/55 p-0.5 backdrop-blur">
          <button
            type="button"
            onClick={() => setTab('foto')}
            disabled={!photo}
            className={`inline-flex items-center gap-1 rounded-md px-2 py-1 text-[10px] font-bold transition disabled:opacity-40 ${
              tab === 'foto' ? 'bg-white text-[#14213D]' : 'text-white/80 hover:text-white'
            }`}
            title={photo === null ? 'Foto tidak ditemukan di Wikipedia' : undefined}
          >
            {photo === undefined ? <Loader2 className="h-3 w-3 animate-spin" /> : <ImageIcon className="h-3 w-3" />} Foto
          </button>
          <button
            type="button"
            onClick={() => setTab('satelit')}
            className={`inline-flex items-center gap-1 rounded-md px-2 py-1 text-[10px] font-bold transition ${
              tab === 'satelit' ? 'bg-white text-[#14213D]' : 'text-white/80 hover:text-white'
            }`}
          >
            <Satellite className="h-3 w-3" /> Satelit
          </button>
        </div>
      </div>
      <p className="mt-1 text-[10px] leading-snug text-ink-muted">
        {tab === 'foto' && photo ? (
          <>
            Foto:{' '}
            <a href={photo.fileUrl ?? photo.articleUrl} target="_blank" rel="noreferrer" className="underline hover:text-ink">
              Wikipedia — {photo.title}
            </a>{' '}
            (lisensi di halaman berkas)
          </>
        ) : (
          <>
            {ESRI_ATTRIBUTION}
            {photo === null && ' · foto asli belum ditemukan, lihat di Google Maps'}
          </>
        )}
      </p>
    </div>
  );
};

const GoogleButtons: React.FC<{ lat: number; lon: number; nama: string }> = ({ lat, lon, nama }) => {
  const g = googleLinks(lat, lon, nama);
  const cls =
    'inline-flex flex-1 items-center justify-center gap-1 rounded-lg border border-line bg-surface-2 px-2 py-2 text-[11px] font-semibold text-ink transition hover:border-brand-blue/40';
  return (
    <div className="flex gap-1.5">
      <a href={g.maps} target="_blank" rel="noreferrer" className={cls}>
        <MapPin className="h-3 w-3" /> Google Maps
      </a>
      <a href={g.streetView} target="_blank" rel="noreferrer" className={cls}>
        <Navigation className="h-3 w-3" /> Street View
      </a>
      <a href={g.earth} target="_blank" rel="noreferrer" className={cls}>
        <ExternalLink className="h-3 w-3" /> Earth
      </a>
    </div>
  );
};

const Stat: React.FC<{ label: string; children: React.ReactNode }> = ({ label, children }) => (
  <div className="rounded-xl border border-line bg-surface-2 p-2.5">
    <div className="text-[10px] font-medium text-ink-muted">{label}</div>
    <div className="mt-0.5 font-mono text-base font-extrabold text-ink">{children}</div>
  </div>
);

const capacity = (v: unknown, label: string) => {
  const n = Number(v);
  return Number.isFinite(n) && n > 0 ? (
    <Angka nilai={n} status="ASUMSI" sumber={`${label}: alokasi 2021 (ASUMSI_ALOKASI_2021)`} />
  ) : (
    <DataMissing label="Belum ada" showLink={false} />
  );
};

export const FacilityDetail: React.FC<Props> = ({ selection, regions, facilities, puskesmas, leadTimes, casesDki, onClose, onSelect }) => {
  const lat = selection.kind === 'rs' ? Number(selection.f.lat) : selection.p.lat;
  const lon = selection.kind === 'rs' ? Number(selection.f.lon) : selection.p.lon;
  const nama = selection.kind === 'rs' ? selection.f.nama : selection.p.nama;

  const validRs = useMemo(() => facilities.filter((f) => isValidJabodetabekCoord(f.lat, f.lon)), [facilities]);

  // Konteks sekitar (dihitung dari koordinat data)
  const nearestRs = useMemo(() => {
    const others = validRs
      .filter((f) => selection.kind !== 'rs' || f.kode_rs !== selection.f.kode_rs)
      .map((f) => ({ f, d: haversineKm(lat, lon, f.lat, f.lon) }))
      .sort((a, b) => a.d - b.d);
    return others.slice(0, 3);
  }, [validRs, selection, lat, lon]);
  const pkmNearby = useMemo(() => puskesmas.filter((p) => haversineKm(lat, lon, p.lat, p.lon) <= 3).length, [puskesmas, lat, lon]);

  const header = (
    <div className="flex items-start justify-between gap-2">
      <div className="min-w-0">
        <span
          className={`inline-block rounded-full px-2 py-0.5 text-[10px] font-bold ${
            selection.kind === 'rs' ? 'bg-brand-pink-50 text-brand-pink' : 'bg-status-aman-bg text-status-aman'
          }`}
        >
          {selection.kind === 'rs' ? 'RUMAH SAKIT' : 'PUSKESMAS'}
        </span>
        <h3 className="mt-1 font-display text-lg font-bold leading-tight text-ink">{nama}</h3>
      </div>
      <button onClick={onClose} className="rounded-lg p-1 text-ink-muted hover:bg-surface-2 hover:text-ink" aria-label="Tutup detail">
        <X className="h-4 w-4" />
      </button>
    </div>
  );

  if (selection.kind === 'pkm') {
    const p = selection.p;
    return (
      <div className="space-y-3">
        {header}
        <MediaHeader nama={nama} lat={lat} lon={lon} />
        <div className="space-y-1.5 text-xs text-ink-muted">
          <div className="flex gap-2"><MapPin className="mt-0.5 h-3.5 w-3.5 shrink-0" />{p.alamat || <DataMissing label="Alamat belum tercatat di OSM" showLink={false} />}</div>
          {p.jam_buka && <div className="flex gap-2"><Clock className="mt-0.5 h-3.5 w-3.5 shrink-0" />{p.jam_buka}</div>}
          {p.telepon && <div className="flex gap-2"><Phone className="mt-0.5 h-3.5 w-3.5 shrink-0" />{p.telepon}</div>}
        </div>
        <div className="rounded-xl border border-line bg-surface-2 p-3 text-xs">
          <div className="font-semibold text-ink">Kapasitas & stok</div>
          <div className="mt-1"><DataMissing label="Data kapasitas puskesmas belum tersedia" /></div>
        </div>
        {nearestRs[0] && (
          <div className="rounded-xl border border-line p-3 text-xs">
            <div className="mb-1.5 font-semibold text-ink">RS rujukan terdekat</div>
            {nearestRs.map(({ f, d }) => (
              <button
                key={f.kode_rs}
                onClick={() => onSelect({ kind: 'rs', f })}
                className="flex w-full items-center justify-between rounded-lg px-2 py-1.5 text-left text-ink-muted hover:bg-surface-2 hover:text-ink"
              >
                <span className="truncate">{f.nama}</span>
                <span className="shrink-0 font-mono">{km(d)}</span>
              </button>
            ))}
          </div>
        )}
        <GoogleButtons lat={lat} lon={lon} nama={nama} />
        <p className="text-[10px] text-ink-muted">Lokasi: OpenStreetMap (ODbL). Jarak = garis lurus.</p>
      </div>
    );
  }

  const f = selection.f;
  const region = regions.find((r) => r.kode_bps === String(f.kode_wilayah));
  const isDki = String(f.kode_wilayah).startsWith('31');
  const kasus = casesDki.get(ACUAN);
  const bwb = calculateBwb(f, leadTimes, ACUAN, 0)
    .filter((b) => b.adaData)
    .sort((a, b) => a.bwbMin.localeCompare(b.bwbMin))
    .slice(0, 3);

  return (
    <div className="space-y-3">
      {header}
      <p className="-mt-1 text-xs text-ink-muted">
        {region?.nama ?? f.kode_wilayah}
        {f.tipe ? ` · ${String(f.tipe).replace(/_/g, ' ').toLowerCase()}` : ''} · kode {f.kode_rs}
      </p>
      <MediaHeader nama={nama} lat={lat} lon={lon} />

      <div>
        <div className="mb-1.5 flex items-center gap-1.5 text-xs font-semibold text-ink">
          <Building2 className="h-3.5 w-3.5 text-brand-blue" /> Kapasitas
        </div>
        <div className="grid grid-cols-3 gap-2">
          <Stat label="Tempat tidur">{capacity(f.tempat_tidur, 'Tempat tidur')}</Stat>
          <Stat label="TT isolasi">{capacity(f.tt_isolasi, 'TT isolasi')}</Stat>
          <Stat label="TT ICU">{capacity(f.tt_icu, 'TT ICU')}</Stat>
        </div>
        <div className="mt-2 grid grid-cols-3 gap-2 text-[10px]">
          {['Oksigen', 'APD N95', 'Perawat'].map((l) => (
            <div key={l} className="rounded-lg border border-dashed border-line px-2 py-1.5">
              <div className="text-ink-muted">{l}</div>
              <DataMissing label="Belum ada" showLink={false} />
            </div>
          ))}
        </div>
      </div>

      <div className="rounded-xl border border-line p-3">
        <div className="mb-2 flex items-center justify-between text-xs">
          <span className="font-semibold text-ink">Batas Waktu Bertindak</span>
          <span className="font-mono text-[10px] text-ink-muted">acuan {tgl(ACUAN)}</span>
        </div>
        {bwb.length === 0 ? (
          <DataMissing label="Kapasitas belum cukup untuk menghitung BWB" />
        ) : (
          <div className="space-y-2">
            {bwb.map((b) => (
              <div key={b.sumberDaya} className="flex items-center justify-between gap-2 text-xs">
                <div className="min-w-0">
                  <div className="truncate font-semibold text-ink">{b.sumberDaya}</div>
                  <div className="font-mono text-[10px] text-ink-muted">
                    BWB {tgl(b.bwbMin)} – {tgl(b.bwbMax)}
                  </div>
                </div>
                <StatusBadge status={b.status} customLabel={b.status === 'AMAN' ? 'Aman' : b.status === 'TERLEWAT' ? 'Terlewat' : 'Siaga'} />
              </div>
            ))}
          </div>
        )}
        <Link
          to={`/respons?faskes=${encodeURIComponent(f.kode_rs)}`}
          className="mt-3 inline-flex w-full items-center justify-center gap-1 rounded-lg bg-brand-blue px-3 py-2 text-xs font-bold text-white hover:bg-brand-blue/90"
        >
          Hitung lengkap di RESPONS →
        </Link>
      </div>

      <div className="grid grid-cols-2 gap-2">
        <Stat label={isDki ? `Kasus harian DKI · ${tgl(ACUAN)}` : 'Kasus kab/kota'}>
          {isDki && kasus !== undefined ? (
            <Angka nilai={kasus} status="BERSUMBER" sumber="Kasus harian DKI Jakarta (tingkat provinsi, bukan per RS) — cases_2021_dki.csv" />
          ) : (
            <DataMissing label="Belum ada" showLink={false} />
          )}
        </Stat>
        <Stat label="Puskesmas ≤ 3 km">
          <Angka nilai={pkmNearby} status="BERSUMBER" sumber="Hitungan lokasi OpenStreetMap dalam radius 3 km" />
        </Stat>
      </div>

      {nearestRs[0] && (
        <div className="rounded-xl border border-line p-3 text-xs">
          <div className="mb-1.5 font-semibold text-ink">RS terdekat (opsi pinjam antarfaskes)</div>
          {nearestRs.map(({ f: o, d }) => (
            <button
              key={o.kode_rs}
              onClick={() => onSelect({ kind: 'rs', f: o })}
              className="flex w-full items-center justify-between rounded-lg px-2 py-1.5 text-left text-ink-muted hover:bg-surface-2 hover:text-ink"
            >
              <span className="truncate">{o.nama}</span>
              <span className="shrink-0 font-mono">{km(d)}</span>
            </button>
          ))}
        </div>
      )}

      <GoogleButtons lat={lat} lon={lon} nama={nama} />
    </div>
  );
};
