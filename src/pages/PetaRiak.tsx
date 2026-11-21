import React, { useState, useEffect, useCallback } from 'react';
import { MapContainer, CircleMarker, Tooltip as LeafletTooltip } from 'react-leaflet';
import L from 'leaflet';
import { BaseLayers, FacilityLayer, MapSelection, Puskesmas, PuskesmasFile, ScrollZoomOnClick, ZOOM_RS } from '../components/map/FacilityLayer';
import { FacilityDetail } from '../components/map/FacilityDetail';
import { useTheme } from '../components/common/theme';
import { fetchCsv, normalizeLeadTimes } from '../data/loader';
import { normalizeRegions, normalizeFacilities, withRobustCentroids } from '../data/geo';
import { Region, Facility, LeadTime } from '../types';
import { SectionTag, GradientCard } from '../components/common/CommonUi';
import { Angka } from '../components/common/Angka';
import { Link } from 'react-router-dom';
import { Play, Pause, RotateCcw, Building2, Map as MapIcon, Satellite } from 'lucide-react';

export const PetaRiak: React.FC = () => {
  const [regions, setRegions] = useState<Region[]>([]);
  const [facilities, setFacilities] = useState<Facility[]>([]);
  const [selectedRegionCode, setSelectedRegionCode] = useState<string>('3171');
  const [simulationDay, setSimulationDay] = useState<number>(20);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [uncertaintyBound, setUncertaintyBound] = useState<'P10' | 'P50' | 'P90'>('P50');
  const [loading, setLoading] = useState<boolean>(true);
  const [map, setMap] = useState<L.Map | null>(null);
  const [puskesmas, setPuskesmas] = useState<Puskesmas[]>([]);
  const [leadTimes, setLeadTimes] = useState<LeadTime[]>([]);
  const [casesDki, setCasesDki] = useState<Map<string, number>>(new Map());
  const [mapSel, setMapSel] = useState<MapSelection | null>(null);
  const [basemap, setBasemap] = useState<'peta' | 'satelit'>('peta');
  const [zoom, setZoom] = useState(10);
  const { theme } = useTheme();

  const pickFacility = useCallback(
    (sel: MapSelection) => {
      setMapSel(sel);
      setBasemap('satelit');
      if (sel.kind === 'rs') setSelectedRegionCode(String(sel.f.kode_wilayah));
      const lat = sel.kind === 'rs' ? Number(sel.f.lat) : sel.p.lat;
      const lon = sel.kind === 'rs' ? Number(sel.f.lon) : sel.p.lon;
      map?.flyTo([lat, lon], 17, { duration: 1.2 });
    },
    [map]
  );

  useEffect(() => {
    Promise.all([
      fetchCsv<Record<string, unknown>>('/data/regions.csv'),
      fetchCsv<Facility>('/data/facilities.csv'),
      fetchCsv<Record<string, any>>('/data/lead_times.csv').then(normalizeLeadTimes),
      fetchCsv<{ tanggal: string; kasus: number }>('/data/cases_2021_dki.csv'),
      fetch('/data/puskesmas_osm.json')
        .then((r) => (r.ok ? (r.json() as Promise<PuskesmasFile>) : null))
        .catch(() => null),
    ]).then(([regsRaw, facsRaw, lts, cs, pkm]) => {
      const facs = normalizeFacilities(facsRaw);
      setLeadTimes(lts);
      setCasesDki(new Map(cs.map((c) => [String(c.tanggal), Number(c.kasus)])));
      setPuskesmas(pkm?.items ?? []);
      setRegions(withRobustCentroids(normalizeRegions(regsRaw), facs));
      setFacilities(facs);
      setLoading(false);
    });
  }, []);

  // Animation timer for day slider
  useEffect(() => {
    let timer: any = null;
    if (isPlaying) {
      timer = setInterval(() => {
        setSimulationDay((prev) => (prev >= 120 ? 0 : prev + 1));
      }, 300);
    }
    return () => clearInterval(timer);
  }, [isPlaying]);

  if (loading) {
    return <div className="p-8 text-center text-ink-muted">Memuat peta transmisi Jabodetabek...</div>;
  }

  const selectedRegion = regions.find((r) => r.kode_bps === selectedRegionCode) || regions[0];
  const regionFacilities = facilities.filter((f) => f.kode_wilayah === selectedRegionCode);

  // Simulation proxy: cases based on simulation day & distance from epicenter (Jakarta Pusat)
  function getSimulatedCases(r: Region, day: number): number {
    const mult = uncertaintyBound === 'P10' ? 0.75 : uncertaintyBound === 'P90' ? 1.35 : 1.0;
    // Growth curve with peak around day 45-60
    const peak = 50;
    const dist = Math.sqrt(Math.pow(r.lat - (-6.2), 2) + Math.pow(r.lon - 106.8, 2));
    const delay = dist * 25; // wave delay in days
    const effectiveDay = Math.max(0, day - delay);
    const growth = Math.exp(-Math.pow((effectiveDay - peak) / 20, 2));
    return Math.round(growth * 850 * r.n_rs * mult);
  }

  return (
    <div className="mx-auto max-w-[1240px] px-4 py-8 space-y-6">
      {/* Header */}
      <div>
        <SectionTag>FASE 0–2: TRANSMISI ANTARWILAYAH</SectionTag>
        <h1 className="mt-2 font-display text-3xl md:text-4xl font-extrabold text-ink tracking-tight">
          Peta Riak — Proyeksi Penyebaran 13 Kab/Kota
        </h1>
        <p className="mt-2 text-sm text-ink-muted max-w-3xl leading-relaxed">
          Visualisasi penyebaran penyakit dan beban faskes per wilayah dengan slider proyeksi hari ke-0 sampai 120.
        </p>
        <div className="mt-4 h-0.5 w-full bg-brand-gradient rounded-full" />
      </div>

      {/* Control Panel */}
      <div className="bg-surface rounded-2xl border border-line p-4 shadow-sm flex flex-col md:flex-row items-center justify-between gap-4">
        {/* Play/Pause & Slider */}
        <div className="flex items-center gap-3 w-full md:w-auto flex-1">
          <button
            onClick={() => setIsPlaying(!isPlaying)}
            className="flex h-9 w-9 items-center justify-center rounded-xl bg-brand-blue text-white shadow hover:bg-brand-blue/90"
            aria-label={isPlaying ? 'Jeda simulasi' : 'Putar simulasi'}
          >
            {isPlaying ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4 ml-0.5" />}
          </button>
          <button
            onClick={() => { setIsPlaying(false); setSimulationDay(0); }}
            className="flex h-9 w-9 items-center justify-center rounded-xl border border-line bg-surface-2 text-ink-muted hover:text-ink"
            aria-label="Reset simulasi"
          >
            <RotateCcw className="h-4 w-4" />
          </button>

          <div className="flex-1 px-2">
            <div className="flex items-center justify-between text-xs font-mono font-bold text-ink mb-1">
              <span>Hari ke-{simulationDay}</span>
              <span className="text-ink-muted font-normal">Maks 120 hari</span>
            </div>
            <input
              type="range"
              min="0"
              max="120"
              value={simulationDay}
              onChange={(e) => setSimulationDay(Number(e.target.value))}
              className="w-full accent-brand-blue cursor-pointer"
            />
          </div>
        </div>

        {/* Uncertainty Toggle */}
        <div className="flex items-center gap-1.5 border-t md:border-t-0 md:border-l border-line pt-3 md:pt-0 md:pl-4">
          <span className="text-xs font-semibold text-ink-muted mr-1">Ketidakpastian:</span>
          {(['P10', 'P50', 'P90'] as const).map((b) => (
            <button
              key={b}
              onClick={() => setUncertaintyBound(b)}
              className={`rounded-lg px-2.5 py-1 text-xs font-mono font-bold transition ${
                uncertaintyBound === b
                  ? 'bg-brand-blue text-white shadow-sm'
                  : 'bg-surface-2 text-ink-muted hover:bg-line'
              }`}
            >
              {b}
            </button>
          ))}
        </div>
      </div>

      {/* Main Map & Detail Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Leaflet Map */}
        <div className="lg:col-span-2 rounded-2xl border border-line overflow-hidden shadow-card h-[520px] bg-surface relative isolate">
          <MapContainer
            ref={setMap}
            center={[-6.25, 106.85]}
            zoom={10}
            maxZoom={20}
            scrollWheelZoom={false}
            preferCanvas
            className="h-full w-full"
          >
            <BaseLayers mode={basemap} darkStreets={theme === 'dark'} />
            <ScrollZoomOnClick />
            <FacilityLayer facilities={facilities} puskesmas={puskesmas} selected={mapSel} onSelect={pickFacility} onZoomChange={setZoom} />
            {zoom < ZOOM_RS && regions.map((reg) => {
              const casesCount = getSimulatedCases(reg, simulationDay);
              const isSelected = reg.kode_bps === selectedRegionCode;
              const radius = Math.max(8, Math.min(32, Math.sqrt(casesCount) * 0.8));

              return (
                <CircleMarker
                  key={reg.kode_bps}
                  center={[reg.lat, reg.lon]}
                  radius={radius}
                  pathOptions={{
                    color: isSelected ? '#BE185D' : '#1E3A8A',
                    fillColor: casesCount > 3000 ? '#BE185D' : casesCount > 1000 ? '#B45309' : '#1E3A8A',
                    fillOpacity: 0.4,
                    weight: isSelected ? 3 : 1.5,
                  }}
                  eventHandlers={{
                    click: () => {
                      setSelectedRegionCode(reg.kode_bps);
                      map?.flyTo([reg.lat, reg.lon], 13, { duration: 1.2 });
                    },
                  }}
                >
                  <LeafletTooltip direction="top" offset={[0, -10]} opacity={0.95}>
                    <div className="font-sans text-xs">
                      <div className="font-bold text-ink">{reg.nama}</div>
                      <div className="font-mono text-brand-blue">Kasus: {casesCount.toLocaleString('id-ID')}</div>
                      <div className="text-[10px] text-ink-muted">Klik untuk zoom ke RS & puskesmas</div>
                    </div>
                  </LeafletTooltip>
                </CircleMarker>
              );
            })}
          </MapContainer>

          <div className="absolute right-3 top-3 z-[1000] flex overflow-hidden rounded-xl border border-line bg-surface/95 shadow-sm backdrop-blur">
            {([
              ['peta', MapIcon, 'Peta'],
              ['satelit', Satellite, 'Satelit'],
            ] as const).map(([m, Icon, label]) => (
              <button
                key={m}
                onClick={() => setBasemap(m)}
                aria-pressed={basemap === m}
                className={`inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold transition ${
                  basemap === m ? 'bg-brand-blue text-white' : 'text-ink-muted hover:bg-surface-2 hover:text-ink'
                }`}
              >
                <Icon className="h-3.5 w-3.5" /> {label}
              </button>
            ))}
          </div>

          <div className="absolute bottom-3 left-3 z-[1000] max-w-[80%] rounded-xl bg-surface/90 backdrop-blur p-2.5 text-[11px] text-ink-muted border border-line shadow-sm pointer-events-none">
            {zoom < ZOOM_RS ? (
              <>
                <span className="inline-block h-2 w-2 rounded-full bg-[#f472b6]" /> RS · <span className="inline-block h-2 w-2 rounded-full bg-[#34d399]" /> Puskesmas — klik titik untuk detail, atau klik wilayah untuk zoom.
              </>
            ) : (
              <>
                <span className="inline-block h-2 w-2 rounded-full bg-[#f472b6]" /> RS · <span className="inline-block h-2 w-2 rounded-full bg-[#34d399]" /> Puskesmas · klik penanda untuk detail
              </>
            )}
          </div>
        </div>

        {/* Region Detail Sidebar */}
        <div className="space-y-4">
          {mapSel && (
            <GradientCard hoverEffect={false} className="!p-4">
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
            </GradientCard>
          )}
          {selectedRegion && !mapSel && (
            <GradientCard hoverEffect={false}>
              <div className="border-b border-line pb-3 mb-3">
                <span className="text-[10px] font-bold text-brand-blue uppercase">Wilayah Terpilih</span>
                <h3 className="font-display text-xl font-bold text-ink">{selectedRegion.nama}</h3>
                <p className="text-xs text-ink-muted">Provinsi: {selectedRegion.provinsi} · Kode BPS: {selectedRegion.kode_bps}</p>
              </div>

              <div className="space-y-3">
                <div className="flex justify-between items-center text-xs">
                  <span className="text-ink-muted">Proyeksi Kasus Aktif (Hari {simulationDay}):</span>
                  <span className="font-mono font-bold text-brand-blue text-sm">
                    {getSimulatedCases(selectedRegion, simulationDay).toLocaleString('id-ID')}
                  </span>
                </div>
                <div className="flex justify-between items-center text-xs">
                  <span className="text-ink-muted">Jumlah RS Terdaftar:</span>
                  <span className="font-mono font-bold text-ink">{selectedRegion.n_rs} RS</span>
                </div>
              </div>

              {/* Facilities List in Region */}
              <div className="mt-5 pt-4 border-t border-line">
                <div className="flex items-center justify-between mb-2">
                  <h4 className="text-xs font-bold text-ink flex items-center gap-1.5">
                    <Building2 className="h-3.5 w-3.5 text-brand-blue" />
                    Fasilitas Kesehatan ({regionFacilities.length}):
                  </h4>
                  <Link to="/respons" className="text-[11px] font-semibold text-brand-blue hover:underline">
                    Buka di RESPONS →
                  </Link>
                </div>

                <div className="max-h-48 overflow-y-auto space-y-1.5 pr-1">
                  {regionFacilities.slice(0, 15).map((f) => (
                    <div key={f.kode_rs} className="flex items-center justify-between text-xs p-2 rounded-lg bg-surface-2 border border-line">
                      <span className="font-medium text-ink truncate max-w-[170px]">{f.nama}</span>
                      <span className="font-mono text-[11px] text-ink-muted shrink-0">Tipe {f.tipe}</span>
                    </div>
                  ))}
                  {regionFacilities.length > 15 && (
                    <div className="text-center text-[11px] text-ink-muted pt-1">
                      + {regionFacilities.length - 15} faskes lainnya
                    </div>
                  )}
                </div>
              </div>
            </GradientCard>
          )}
        </div>
      </div>
    </div>
  );
};

