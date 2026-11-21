import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { MapContainer, CircleMarker, Marker, GeoJSON, Tooltip as LeafletTooltip, useMap, useMapEvents } from 'react-leaflet';
import L from 'leaflet';
import { Globe2, ChevronRight, ArrowLeft, MapPin, Plane, Building2, X, ZoomIn, Plus, Minus, Map as MapIcon, Satellite, MousePointerClick, ShieldCheck, Ship } from 'lucide-react';
import { InteractiveGlobe, InteractiveGlobeHandle, GlobeHotspot } from './InteractiveGlobe';
import { fetchCsv, normalizeLeadTimes } from '../../data/loader';
import { normalizeRegions, normalizeFacilities, withRobustCentroids } from '../../data/geo';
import { Region, Facility, LeadTime } from '../../types';
import {
  BaseLayers, FacilityLayer, MapSelection, Puskesmas, PuskesmasFile, ScrollZoomOnClick, selectionId, ZOOM_PIN, ZOOM_PKM, ZOOM_RS,
} from '../map/FacilityLayer';
import { FacilityDetail } from '../map/FacilityDetail';
import { loadWorld50, INDONESIA_ID, INDONESIA_VIEW } from './worldData';
import { feature } from 'topojson-client';

type Stage = 'globe' | 'diving' | 'map' | 'leaving';

const JKT: [number, number] = [-6.2, 106.8];
const JABODETABEK_VIEW: [number, number] = [-6.33, 106.8];
const INDO: [number, number] = [INDONESIA_VIEW.lat, INDONESIA_VIEW.lon];
/** Di bawah zoom ini peta menampilkan level Indonesia; di atasnya level Jabodetabek. */
const ZOOM_INDO_MAX = 8;
/** Zoom keluar melewati ini → kembali ke globe. */
const ZOOM_TO_GLOBE = 4;

/** Pintu masuk prioritas (entry_points.csv); koordinat = lokasi publik bandara/pelabuhan. */
const ENTRY_POINTS: Array<{ nama: string; jenis: 'udara' | 'laut'; provinsi: string; lat: number; lon: number }> = [
  { nama: 'Bandara Soekarno-Hatta', jenis: 'udara', provinsi: 'Banten', lat: -6.1256, lon: 106.6559 },
  { nama: 'Bandara I Gusti Ngurah Rai', jenis: 'udara', provinsi: 'Bali', lat: -8.7482, lon: 115.167 },
  { nama: 'Batam', jenis: 'laut', provinsi: 'Kepulauan Riau', lat: 1.1301, lon: 104.053 },
  { nama: 'Bandara Kualanamu', jenis: 'udara', provinsi: 'Sumatera Utara', lat: 3.6422, lon: 98.8853 },
  { nama: 'Bandara Juanda', jenis: 'udara', provinsi: 'Jawa Timur', lat: -7.3798, lon: 112.7869 },
];

const targetIcon = L.divIcon({
  className: '',
  iconSize: [24, 24],
  iconAnchor: [12, 12],
  html: `<span class="riak-ping" style="--c:#22e5ff;width:24px;height:24px"><span></span><span></span><i></i></span><b class="riak-ping-label riak-ping-label-lg">Jabodetabek · 461 RS · klik untuk masuk</b>`,
});

/** Zoom keluar jauh di peta → kembali ke globe dari posisi yang sama. */
const ZoomOutWatcher: React.FC<{ active: boolean; onOut: (lat: number, lon: number, zoom: number) => void }> = ({ active, onOut }) => {
  const map = useMapEvents({
    zoomend: () => {
      if (!active) return;
      const z = map.getZoom();
      if (z < ZOOM_TO_GLOBE) {
        const c = map.getCenter();
        onOut(c.lat, c.lng, z);
      }
    },
  });
  return null;
};

type FlyCommand =
  | { type: 'enter'; ts: number }
  | { type: 'exit'; ts: number }
  | { type: 'to'; ts: number; lat: number; lon: number; zoom: number }
  | { type: 'overview'; ts: number };

const rippleIcon = (color: string, label?: string) =>
  L.divIcon({
    className: '',
    iconSize: [18, 18],
    iconAnchor: [9, 9],
    html: `<span class="riak-ping" style="--c:${color}"><span></span><span></span><i></i></span>${
      label ? `<b class="riak-ping-label">${label}</b>` : ''
    }`,
  });

const FlightController: React.FC<{ command: FlyCommand | null; onArrive: () => void; onLeft: () => void }> = ({
  command,
  onArrive,
  onLeft,
}) => {
  const map = useMap();
  useEffect(() => {
    if (!command) return;
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (command.type === 'enter') {
      // Globe berhenti tepat di skala yang setara zoom 5 → peta langsung menyambung tanpa loncatan
      map.invalidateSize();
      map.setView(INDO, INDONESIA_VIEW.zoom, { animate: false });
      onArrive();
    } else if (command.type === 'exit') {
      if (reduced) {
        onLeft();
        return;
      }
      map.once('moveend', onLeft);
      map.flyTo(INDO, INDONESIA_VIEW.zoom, { duration: 1.1, easeLinearity: 0.3 });
    } else if (command.type === 'to') {
      map.flyTo([command.lat, command.lon], command.zoom, { duration: reduced ? 0 : 1.4 });
    } else if (command.type === 'overview') {
      map.flyTo(JABODETABEK_VIEW, 10, { duration: reduced ? 0 : 1 });
    }
    return () => {
      map.off('moveend', onArrive);
      map.off('moveend', onLeft);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [command]);
  return null;
};

const zoomHint = (z: number) =>
  z < ZOOM_INDO_MAX
    ? 'Klik Jabodetabek (titik biru) untuk masuk · zoom keluar untuk kembali ke globe'
    : z < ZOOM_RS
    ? 'Titik pink = RS, hijau = puskesmas · klik titik untuk detail, atau klik wilayah untuk zoom'
    : z < ZOOM_PIN
    ? 'Zoom lagi untuk penanda & nama faskes · klik titik untuk detail'
    : 'Klik penanda H (RS) atau + (puskesmas) untuk foto, Street View & data';

export const GlobeToMap: React.FC<{ introPlaying?: boolean }> = ({ introPlaying = false }) => {
  const globeRef = useRef<InteractiveGlobeHandle>(null);
  const [globeKey, setGlobeKey] = useState(0);
  const [globeOk, setGlobeOk] = useState(true);
  const diveTimer = useRef<number>();
  const [map, setMap] = useState<L.Map | null>(null);
  const [stage, setStage] = useState<Stage>('globe');
  const stageRef = useRef<Stage>('globe');
  stageRef.current = stage;
  const [command, setCommand] = useState<FlyCommand | null>(null);
  const [arrived, setArrived] = useState(false);
  const [hotspot, setHotspot] = useState<GlobeHotspot | null>(null);
  const [regions, setRegions] = useState<Region[]>([]);
  const [facilities, setFacilities] = useState<Facility[]>([]);
  const [puskesmas, setPuskesmas] = useState<Puskesmas[]>([]);
  const [leadTimes, setLeadTimes] = useState<LeadTime[]>([]);
  const [casesDki, setCasesDki] = useState<Map<string, number>>(new Map());
  const [selected, setSelected] = useState<string | null>(null);
  const [mapSel, setMapSel] = useState<MapSelection | null>(null);
  const [basemap, setBasemap] = useState<'peta' | 'satelit'>('peta');
  const [zoom, setZoom] = useState(5);
  const [scrollOn, setScrollOn] = useState(false);
  const [indoGeo, setIndoGeo] = useState<any>(null);

  // Garis batas Indonesia (Natural Earth 1:50m) untuk level peta Indonesia
  useEffect(() => {
    loadWorld50()
      .then((w) => {
        const fc = feature(w, w.objects.countries) as any;
        setIndoGeo(fc.features.find((f: any) => String(f.id) === INDONESIA_ID) ?? null);
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    Promise.all([
      fetchCsv<Record<string, unknown>>('/data/regions.csv'),
      fetchCsv<Facility>('/data/facilities.csv'),
      fetchCsv<Record<string, any>>('/data/lead_times.csv').then(normalizeLeadTimes),
      fetchCsv<{ tanggal: string; kasus: number }>('/data/cases_2021_dki.csv'),
      fetch('/data/puskesmas_osm.json')
        .then((r) => (r.ok ? (r.json() as Promise<PuskesmasFile>) : null))
        .catch(() => null),
    ]).then(([r, f, lt, cs, pkm]) => {
      const facs = normalizeFacilities(f);
      setFacilities(facs);
      setRegions(withRobustCentroids(normalizeRegions(r), facs));
      setLeadTimes(lt);
      setCasesDki(new Map(cs.map((c) => [String(c.tanggal), Number(c.kasus)])));
      setPuskesmas(pkm?.items ?? []);
    });
  }, []);

  const facCount = useMemo(() => {
    const m = new Map<string, number>();
    facilities.forEach((f) => m.set(f.kode_wilayah, (m.get(f.kode_wilayah) ?? 0) + 1));
    return m;
  }, [facilities]);

  const sortedRegions = useMemo(() => [...regions].sort((a, b) => b.n_rs - a.n_rs), [regions]);
  const selectedRegion = regions.find((r) => r.kode_bps === selected) ?? null;

  const enterMap = () => {
    setHotspot(null);
    if (!globeOk) {
      onDiveComplete();
      return;
    }
    globeRef.current?.dive();
    // Pengaman: bila animasi globe tidak selesai (GPU sibuk), tetap buka peta
    window.clearTimeout(diveTimer.current);
    diveTimer.current = window.setTimeout(onDiveComplete, 3200);
  };

  const onDiveComplete = () => {
    window.clearTimeout(diveTimer.current);
    if (stageRef.current === 'map') return;
    setStage('map');
    setArrived(false);
    setCommand({ type: 'enter', ts: Date.now() });
    // Pengguna sedang menjelajah peta → scroll langsung meneruskan zoom (dimatikan lagi saat kursor keluar)
    map?.scrollWheelZoom.enable();
    setScrollOn(true);
  };

  const backToGlobe = () => {
    setArrived(false);
    setSelected(null);
    setMapSel(null);
    setBasemap('peta');
    setStage('leaving');
    setCommand({ type: 'exit', ts: Date.now() });
  };

  const onLeft = (from?: { lat: number; lon: number; zoom: number }) => {
    setStage('globe');
    globeRef.current?.reset(from ?? INDONESIA_VIEW);
  };

  /** Zoom keluar di peta sampai level benua → globe mengambil alih dari posisi yang sama. */
  const zoomOutToGlobe = (lat: number, lon: number, z: number) => {
    if (stageRef.current !== 'map') return;
    setArrived(false);
    setSelected(null);
    setMapSel(null);
    setBasemap('peta');
    onLeft({ lat, lon, zoom: z });
  };

  const goIndonesia = () => {
    setSelected(null);
    setMapSel(null);
    setBasemap('peta');
    setCommand({ type: 'to', ts: Date.now(), lat: INDO[0], lon: INDO[1], zoom: INDONESIA_VIEW.zoom });
  };

  const goJabodetabek = () => {
    setSelected(null);
    setMapSel(null);
    setCommand({ type: 'to', ts: Date.now(), lat: JABODETABEK_VIEW[0], lon: JABODETABEK_VIEW[1], zoom: 10 });
  };

  const pickRegion = (r: Region) => {
    setSelected(r.kode_bps);
    setMapSel(null);
    setCommand({ type: 'to', ts: Date.now(), lat: r.lat, lon: r.lon, zoom: 13 });
  };

  const pickFacility = useCallback((s: MapSelection) => {
    setMapSel(s);
    setBasemap('satelit');
    const lat = s.kind === 'rs' ? Number(s.f.lat) : s.p.lat;
    const lon = s.kind === 'rs' ? Number(s.f.lon) : s.p.lon;
    if (s.kind === 'rs') setSelected(String(s.f.kode_wilayah));
    setCommand({ type: 'to', ts: Date.now(), lat, lon, zoom: 17 });
  }, []);

  const onScrollActivate = useCallback(() => setScrollOn(true), []);

  const mapVisible = stage === 'map' || stage === 'leaving';
  const indoLevel = zoom < ZOOM_INDO_MAX;
  const crumbs: Array<{ label: string; active: boolean; go?: () => void }> = [
    { label: 'Dunia', active: !mapVisible, go: mapVisible ? backToGlobe : undefined },
    { label: 'Indonesia', active: mapVisible && indoLevel, go: mapVisible && !indoLevel ? goIndonesia : undefined },
    ...(mapVisible && !indoLevel ? [{ label: 'Jabodetabek', active: !selectedRegion && !mapSel, go: selectedRegion || mapSel ? goJabodetabek : undefined }] : []),
    ...(mapVisible && selectedRegion && !indoLevel
      ? [{ label: selectedRegion.nama, active: !mapSel, go: mapSel ? () => pickRegion(selectedRegion) : undefined }]
      : []),
    ...(mapSel ? [{ label: mapSel.kind === 'rs' ? mapSel.f.nama : mapSel.p.nama, active: true }] : []),
  ];

  const detail = mapSel && (
    <FacilityDetail
      selection={mapSel}
      regions={regions}
      facilities={facilities}
      puskesmas={puskesmas}
      leadTimes={leadTimes}
      casesDki={casesDki}
      onClose={() => setMapSel(null)}
      onSelect={pickFacility}
    />
  );

  return (
    <div className="relative isolate h-[600px] md:h-[680px] w-full overflow-hidden rounded-3xl border border-cyan-500/20 bg-gradient-to-b from-[#070B18] via-[#0B1226] to-[#070A14] shadow-[0_12px_48px_rgba(0,0,0,0.45)]">
      {/* Lapisan globe */}
      <div
        className="absolute inset-0 transition-opacity duration-500 ease-out"
        style={{ opacity: mapVisible ? 0 : 1, pointerEvents: mapVisible ? 'none' : 'auto' }}
      >
        <InteractiveGlobe
          key={globeKey}
          ref={globeRef}
          deferBuild={introPlaying}
          onUnavailable={() => setGlobeOk(false)}
          onContextLost={() => window.setTimeout(() => setGlobeKey((k) => k + 1), 300)}
          paused={mapVisible}
          onDiveStart={() => setStage('diving')}
          onDiveComplete={onDiveComplete}
          onSelectHotspot={setHotspot}
        />
      </div>

      {/* Lapisan peta */}
      <div
        className="absolute inset-0 transition-opacity duration-500 ease-out"
        style={{ opacity: mapVisible ? 1 : 0, pointerEvents: stage === 'map' ? 'auto' : 'none' }}
        aria-hidden={!mapVisible}
      >
        <MapContainer
          ref={setMap}
          center={JKT}
          zoom={5}
          minZoom={3}
          maxZoom={20}
          zoomControl={false}
          scrollWheelZoom={false}
          preferCanvas
          className="riak-dark-map h-full w-full bg-[#0b1226]"
        >
          <BaseLayers mode={basemap} />
          <FlightController command={command} onArrive={() => setArrived(true)} onLeft={() => onLeft()} />
          <ScrollZoomOnClick onActivate={onScrollActivate} />
          <ZoomOutWatcher active={stage === 'map' && arrived} onOut={zoomOutToGlobe} />

          {/* Level Indonesia: garis batas, pintu masuk, dan pintu ke Jabodetabek */}
          {mapVisible && indoLevel && indoGeo && (
            <GeoJSON
              key="indo"
              data={indoGeo}
              interactive={false}
              style={{ color: '#22e5ff', weight: 1.4, opacity: 0.9, fillColor: '#0e7490', fillOpacity: 0.18 }}
            />
          )}
          {mapVisible &&
            indoLevel &&
            ENTRY_POINTS.map((e) => (
              <Marker
                key={e.nama}
                position={[e.lat, e.lon]}
                icon={rippleIcon('#f472b6', e.nama.replace('Bandara ', ''))}
                eventHandlers={{ click: () => setCommand({ type: 'to', ts: Date.now(), lat: e.lat, lon: e.lon, zoom: 11 }) }}
              />
            ))}
          {mapVisible && indoLevel && <Marker position={JKT} icon={targetIcon} zIndexOffset={1000} eventHandlers={{ click: goJabodetabek }} />}
          {mapVisible && !indoLevel && zoom < ZOOM_RS && <Marker position={[ENTRY_POINTS[0].lat, ENTRY_POINTS[0].lon]} icon={rippleIcon('#22e5ff', 'Soekarno-Hatta')} />}

          {arrived &&
            !indoLevel &&
            zoom < ZOOM_RS &&
            regions.map((r) => {
              const isSel = r.kode_bps === selected;
              return (
                <CircleMarker
                  key={r.kode_bps}
                  center={[r.lat, r.lon]}
                  radius={6 + Math.sqrt(r.n_rs) * 2.2}
                  pathOptions={{
                    color: isSel ? '#ffffff' : '#7dd3fc',
                    weight: isSel ? 3 : 1.5,
                    fillColor: isSel ? '#BE185D' : '#3B82F6',
                    fillOpacity: isSel ? 0.3 : 0.14,
                    opacity: 0.8,
                  }}
                  eventHandlers={{ click: () => pickRegion(r) }}
                >
                  <LeafletTooltip direction="top" offset={[0, -8]} opacity={0.95}>
                    <div className="text-xs">
                      <div className="font-bold">{r.nama}</div>
                      <div className="font-mono">{r.n_rs} RS · klik untuk zoom</div>
                    </div>
                  </LeafletTooltip>
                </CircleMarker>
              );
            })}
          {arrived && (
            <FacilityLayer facilities={facilities} puskesmas={puskesmas} selected={mapSel} onSelect={pickFacility} onZoomChange={setZoom} />
          )}
        </MapContainer>
      </div>

      {/* Remah roti: Dunia → Indonesia → wilayah → faskes */}
      <div className="absolute left-4 top-4 z-[500] flex max-w-[calc(100%-2rem)] items-center gap-1 overflow-hidden rounded-full border border-white/15 bg-black/55 px-2 py-1 text-[11px] font-semibold text-white/70 backdrop-blur-md md:max-w-[calc(100%-25rem)]">
        {crumbs.map((c, i) => (
          <React.Fragment key={`${i}-${c.label}`}>
            {i > 0 && <ChevronRight className="h-3 w-3 shrink-0 text-white/30" />}
            <button
              type="button"
              disabled={!c.go}
              onClick={() => c.go?.()}
              className={`truncate rounded-full px-2 py-0.5 transition ${
                c.active ? 'bg-cyan-400/20 text-cyan-200' : c.go ? 'hover:bg-white/10 hover:text-white' : ''
              }`}
            >
              {i === 0 && <Globe2 className="mr-1 inline h-3 w-3 -mt-0.5" />}
              {c.label}
            </button>
          </React.Fragment>
        ))}
      </div>

      {/* Kontrol mode globe */}
      {!mapVisible && (
        <>
          {!globeOk && (
            <div className="absolute inset-0 z-[400] flex items-center justify-center">
              <div className="max-w-sm rounded-2xl border border-white/10 bg-black/50 p-5 text-center text-sm text-white/80 backdrop-blur">
                Globe 3D tidak dapat ditampilkan di browser ini (WebGL nonaktif). Peta Jabodetabek tetap bisa dibuka.
              </div>
            </div>
          )}
          <div className="pointer-events-none absolute left-4 top-14 z-[500] max-w-xs rounded-2xl border border-white/15 bg-black/40 p-3.5 shadow-lg backdrop-blur-md">
            <div className="flex items-center gap-2">
              <span className="h-2.5 w-2.5 animate-ping rounded-full bg-cyan-400" />
              <span className="font-display text-xs font-bold uppercase tracking-wider text-cyan-300">Radar Global</span>
            </div>
            <h3 className="mt-0.5 font-display text-lg font-bold text-white">Jalur Transmisi Wabah Luar Negeri</h3>
            <p className="mt-0.5 text-[11px] text-white/70">
              Geser globe untuk rotasi 360°. Klik <span className="font-semibold text-cyan-300">Indonesia</span> atau scroll untuk zoom sampai ke peta, wilayah, dan faskes.
            </p>
          </div>

          <button
            type="button"
            onClick={enterMap}
            disabled={stage === 'diving'}
            className="absolute bottom-5 left-1/2 z-[500] -translate-x-1/2 inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-cyan-500 to-blue-600 px-5 py-3 text-sm font-bold text-white shadow-[0_0_30px_rgba(34,229,255,0.35)] transition hover:scale-105 active:scale-95 disabled:opacity-70"
          >
            <ZoomIn className="h-4 w-4" />
            {stage === 'diving' ? 'Menuju Indonesia…' : 'Zoom ke Indonesia'}
          </button>

          <div className="pointer-events-none absolute bottom-5 right-4 z-[500] hidden md:flex flex-col gap-1.5 rounded-xl border border-white/10 bg-black/45 px-3 py-2 text-[11px] text-white/70 backdrop-blur-md">
            <span className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-[#ff4d7d]" />Sinyal global (acuan historis)</span>
            <span className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-cyan-300" />Episentrum RI · Jabodetabek</span>
            <span className="flex items-center gap-1.5"><span className="h-0.5 w-4 bg-[#ff5c9a]" />Alur impor</span>
          </div>

          {hotspot && !hotspot.isTarget && (
            <div className="absolute right-4 top-4 z-[500] w-72 rounded-2xl border border-pink-400/30 bg-[#0A1022]/90 p-4 text-white shadow-xl backdrop-blur-xl riak-fade-up">
              <div className="flex items-start justify-between">
                <div>
                  <div className="text-[10px] font-bold uppercase tracking-wider text-pink-300">{hotspot.sub}</div>
                  <div className="font-display text-lg font-bold">{hotspot.label}</div>
                </div>
                <button onClick={() => setHotspot(null)} className="rounded-lg p-1 text-white/50 hover:bg-white/10 hover:text-white" aria-label="Tutup">
                  <X className="h-4 w-4" />
                </button>
              </div>
              <p className="mt-2 text-xs leading-relaxed text-white/75">{hotspot.desc}</p>
              <div className="mt-3 flex gap-2">
                <Link to="/radar" className="flex-1 rounded-lg bg-white/10 px-3 py-2 text-center text-[11px] font-bold hover:bg-white/20">
                  Buka RADAR
                </Link>
                <button onClick={enterMap} className="flex-1 rounded-lg bg-cyan-500/80 px-3 py-2 text-[11px] font-bold hover:bg-cyan-500">
                  Lihat dampak di RI
                </button>
              </div>
            </div>
          )}
        </>
      )}

      {/* Panel & kontrol mode peta */}
      {mapVisible && (
        <>
          {/* Zoom & lapisan */}
          <div className={`absolute left-4 top-14 z-[500] flex flex-col gap-2 transition-opacity ${arrived ? 'opacity-100' : 'pointer-events-none opacity-0'}`}>
            <div className="flex flex-col overflow-hidden rounded-xl border border-white/15 bg-black/55 backdrop-blur-md">
              <button onClick={() => map?.zoomIn()} className="p-2.5 text-white hover:bg-white/10" aria-label="Perbesar">
                <Plus className="h-4 w-4" />
              </button>
              <span className="border-y border-white/10 py-1 text-center font-mono text-[10px] text-white/60">{zoom}</span>
              <button onClick={() => map?.zoomOut()} className="p-2.5 text-white hover:bg-white/10" aria-label="Perkecil">
                <Minus className="h-4 w-4" />
              </button>
            </div>
            <div className="flex flex-col overflow-hidden rounded-xl border border-white/15 bg-black/55 backdrop-blur-md">
              {([
                ['peta', MapIcon, 'Peta'],
                ['satelit', Satellite, 'Satelit'],
              ] as const).map(([m, Icon, label]) => (
                <button
                  key={m}
                  onClick={() => setBasemap(m)}
                  className={`flex flex-col items-center gap-0.5 px-2 py-2 text-[9px] font-bold transition ${
                    basemap === m ? 'bg-cyan-400/25 text-cyan-100' : 'text-white/70 hover:bg-white/10'
                  }`}
                  aria-pressed={basemap === m}
                >
                  <Icon className="h-4 w-4" />
                  {label}
                </button>
              ))}
            </div>
          </div>

          {/* Petunjuk zoom */}
          {arrived && (
            <div className="pointer-events-none absolute bottom-5 left-1/2 z-[500] hidden -translate-x-1/2 items-center gap-2 rounded-full border border-white/15 bg-black/60 px-3.5 py-2 text-[11px] text-white/80 backdrop-blur-md md:flex md:-ml-44">
              <MousePointerClick className="h-3.5 w-3.5 text-cyan-300" />
              {!scrollOn ? 'Klik peta, lalu scroll untuk zoom · ' : ''}
              {zoomHint(zoom)}
            </div>
          )}

          {/* Legenda faskes */}
          {arrived && (
            <div className="pointer-events-none absolute bottom-16 left-4 z-[500] flex flex-col gap-1 rounded-xl border border-white/10 bg-black/55 px-3 py-2 text-[11px] text-white/75 backdrop-blur-md">
              <span className="flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-full border border-white bg-[#f472b6]" />Rumah sakit ({facilities.length})</span>
              <span className="flex items-center gap-1.5">
                <span className="h-2.5 w-2.5 rounded-full border border-white bg-[#34d399]" />Puskesmas ({puskesmas.length})
              </span>
            </div>
          )}

          <button
            type="button"
            onClick={backToGlobe}
            className="absolute bottom-5 left-4 z-[500] inline-flex items-center gap-2 rounded-full border border-white/20 bg-black/55 px-4 py-2.5 text-xs font-bold text-white backdrop-blur-md transition hover:bg-black/70"
          >
            <ArrowLeft className="h-4 w-4" />
            Kembali ke globe
          </button>

          {/* Panel kanan (desktop). Kelas `dark` membuat token warna di dalamnya selalu gelap. */}
          <aside
            className={`dark absolute z-[500] right-3 top-3 bottom-3 hidden md:flex flex-col rounded-2xl border border-white/10 bg-surface/90 text-ink shadow-xl backdrop-blur-xl transition-all duration-500 ${
              mapSel ? 'w-[360px]' : 'w-72'
            } ${arrived ? 'opacity-100 translate-x-0' : 'pointer-events-none opacity-0 translate-x-6'}`}
          >
            {mapSel ? (
              <div key={selectionId(mapSel)} className="flex-1 overflow-y-auto p-4 riak-fade-up">{detail}</div>
            ) : indoLevel ? (
              <div className="flex-1 overflow-y-auto p-4 riak-fade-up">
                <div className="text-[10px] font-bold uppercase tracking-wider text-cyan-300">Peta Indonesia</div>
                <div className="font-display text-lg font-bold">Pilih wilayah</div>
                <button
                  onClick={goJabodetabek}
                  className="mt-3 w-full rounded-xl border border-cyan-400/40 bg-cyan-400/10 p-3 text-left transition hover:bg-cyan-400/20"
                >
                  <div className="flex items-center gap-2 text-sm font-bold text-ink">
                    <ShieldCheck className="h-4 w-4 text-cyan-300" /> Jabodetabek
                    <span className="ml-auto rounded-full bg-cyan-950 px-2 py-0.5 font-mono text-[10px] text-cyan-300">SIAGA AKTIF</span>
                  </div>
                  <div className="mt-1 text-[11px] text-ink-muted">
                    13 kab/kota · {facilities.length} RS · {puskesmas.length} puskesmas
                  </div>
                  <div className="mt-2 text-[11px] font-semibold text-cyan-200">Masuk & zoom ke faskes →</div>
                </button>

                <div className="mt-4 text-xs font-bold text-ink">Pintu masuk prioritas</div>
                <div className="mt-1.5 space-y-1">
                  {ENTRY_POINTS.map((e) => (
                    <button
                      key={e.nama}
                      onClick={() => setCommand({ type: 'to', ts: Date.now(), lat: e.lat, lon: e.lon, zoom: 11 })}
                      className="flex w-full items-center gap-2 rounded-lg px-2 py-1.5 text-left text-xs text-ink-muted transition hover:bg-surface-2 hover:text-ink"
                    >
                      {e.jenis === 'udara' ? <Plane className="h-3.5 w-3.5 text-pink-300" /> : <Ship className="h-3.5 w-3.5 text-pink-300" />}
                      <span className="flex-1 truncate">{e.nama}</span>
                      <span className="text-[10px]">{e.provinsi}</span>
                    </button>
                  ))}
                </div>
                <p className="mt-4 rounded-lg bg-surface-2 p-2.5 text-[11px] leading-relaxed text-ink-muted">
                  Data faskes, kapasitas, dan BWB di prototipe ini baru tersedia untuk Jabodetabek. Wilayah lain menyusul bila datanya dimasukkan.
                </p>
              </div>
            ) : (
              <>
                {selectedRegion ? (
                  <div className="border-b border-line p-4">
                    <button
                      onClick={() => {
                        setSelected(null);
                        setCommand({ type: 'overview', ts: Date.now() });
                      }}
                      className="mb-2 inline-flex items-center gap-1 text-[11px] text-cyan-300 hover:underline"
                    >
                      <ArrowLeft className="h-3 w-3" /> Semua wilayah
                    </button>
                    <div className="font-display text-lg font-bold">{selectedRegion.nama}</div>
                    <div className="text-[11px] text-ink-muted">{selectedRegion.provinsi} · Kode BPS {selectedRegion.kode_bps}</div>
                    <div className="mt-3 grid grid-cols-2 gap-2">
                      <div className="rounded-xl bg-surface-2 p-2.5">
                        <div className="text-[10px] text-ink-muted">RS terdaftar</div>
                        <div className="font-mono text-xl font-extrabold">{selectedRegion.n_rs}</div>
                      </div>
                      <div className="rounded-xl bg-surface-2 p-2.5">
                        <div className="text-[10px] text-ink-muted">Baris faskes</div>
                        <div className="font-mono text-xl font-extrabold">{facCount.get(selectedRegion.kode_bps) ?? 0}</div>
                      </div>
                    </div>
                    <p className="mt-3 rounded-lg bg-cyan-400/10 px-2.5 py-2 text-[11px] text-cyan-100">
                      Zoom in pada peta lalu klik penanda RS / puskesmas untuk melihat foto, citra satelit, kapasitas, dan BWB.
                    </p>
                    <div className="mt-3 flex gap-2">
                      <Link to="/peta" className="flex-1 rounded-lg bg-surface-2 px-2 py-2 text-center text-[11px] font-bold hover:bg-line">Peta Riak</Link>
                      <Link to="/respons" className="flex-1 rounded-lg bg-pink-600/90 px-2 py-2 text-center text-[11px] font-bold text-white hover:bg-pink-600">Hitung BWB</Link>
                    </div>
                  </div>
                ) : (
                  <div className="border-b border-line p-4">
                    <div className="text-[10px] font-bold uppercase tracking-wider text-cyan-300">Wilayah pantau</div>
                    <div className="font-display text-lg font-bold">13 kab/kota Jabodetabek</div>
                    <div className="mt-2 flex items-center gap-2 text-[11px] text-ink-muted">
                      <Plane className="h-3.5 w-3.5 text-cyan-300" /> Pintu masuk utama: Bandara Soekarno-Hatta
                    </div>
                  </div>
                )}
                <div className="flex-1 overflow-y-auto p-2">
                  {sortedRegions.map((r) => (
                    <button
                      key={r.kode_bps}
                      onClick={() => pickRegion(r)}
                      className={`flex w-full items-center justify-between rounded-lg px-2.5 py-2 text-left text-xs transition ${
                        r.kode_bps === selected ? 'bg-pink-600/30 text-ink' : 'text-ink-muted hover:bg-surface-2 hover:text-ink'
                      }`}
                    >
                      <span className="flex items-center gap-2 truncate">
                        <MapPin className="h-3 w-3 shrink-0 text-cyan-300" />
                        {r.nama}
                      </span>
                      <span className="flex items-center gap-1 font-mono text-[11px] text-ink-muted">
                        <Building2 className="h-3 w-3" />
                        {r.n_rs}
                      </span>
                    </button>
                  ))}
                </div>
                <p className="border-t border-line px-4 py-2 text-[10px] text-ink-muted">
                  Titik wilayah = median lokasi RS, bukan batas administratif. RS: facilities.csv · Puskesmas: OpenStreetMap.
                </p>
              </>
            )}
          </aside>

          {/* Ponsel: detail sebagai lembar bawah, atau chip wilayah */}
          {mapSel ? (
            <div key={selectionId(mapSel)} className="dark absolute inset-x-2 bottom-2 z-[600] max-h-[70%] overflow-y-auto rounded-2xl border border-white/10 bg-surface/95 p-4 text-ink shadow-xl backdrop-blur-xl md:hidden riak-fade-up">
              {detail}
            </div>
          ) : (
            <div className={`absolute bottom-20 left-0 right-0 z-[500] flex gap-2 overflow-x-auto px-4 md:hidden transition-opacity ${arrived ? 'opacity-100' : 'pointer-events-none opacity-0'}`}>
              {sortedRegions.map((r) => (
                <button
                  key={r.kode_bps}
                  onClick={() => pickRegion(r)}
                  className={`shrink-0 rounded-full border px-3 py-1.5 text-[11px] font-semibold backdrop-blur-md ${
                    r.kode_bps === selected ? 'border-pink-400 bg-pink-600/70 text-white' : 'border-white/20 bg-black/50 text-white/80'
                  }`}
                >
                  {r.nama} · {r.n_rs}
                </button>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
};
