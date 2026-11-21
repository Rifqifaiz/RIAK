import React, { useEffect, useMemo, useState } from 'react';
import { CircleMarker, Marker, TileLayer, Tooltip as LeafletTooltip, useMap, useMapEvents } from 'react-leaflet';
import L from 'leaflet';
import { Facility } from '../../types';
import { isValidJabodetabekCoord, uniqueFacilities } from '../../data/geo';

export interface Puskesmas {
  id: string;
  nama: string;
  lat: number;
  lon: number;
  alamat?: string | null;
  jam_buka?: string | null;
  telepon?: string | null;
}

export interface PuskesmasFile {
  sumber: string;
  lisensi: string;
  diambil: string;
  items: Puskesmas[];
}

export type MapSelection = { kind: 'rs'; f: Facility } | { kind: 'pkm'; p: Puskesmas };

/** Identitas unik penanda. Kode RS di facilities.csv bisa berulang, jadi digabung dengan koordinat. */
export const rsId = (f: Facility) => `rs:${f.kode_rs}@${f.lat},${f.lon}`;
export const selectionId = (s: MapSelection | null) => (!s ? null : s.kind === 'rs' ? rsId(s.f) : `pkm:${s.p.id}`);

/**
 * Ambang zoom:
 * - ZOOM_DOTS: titik RS & puskesmas mulai tampil (langsung terlihat saat peta dibuka)
 * - ZOOM_RS: gelembung wilayah disembunyikan, titik membesar
 * - ZOOM_PIN: titik berubah jadi pin; ZOOM_PIN+1: nama faskes tampil
 */
export const ZOOM_DOTS = 9;
export const ZOOM_RS = 12;
export const ZOOM_PKM = ZOOM_DOTS;
export const ZOOM_PIN = 15;

/** Ukuran titik menyesuaikan zoom: makin dekat makin besar & jelas. */
const rsRadius = (zoom: number, beds: number) =>
  zoom <= 10 ? 3.2 : zoom === 11 ? 4.2 : Math.min(11, 4.5 + Math.sqrt(beds || 0) / 2.5);
const pkmRadius = (zoom: number) => (zoom <= 10 ? 2.4 : zoom === 11 ? 3 : 4.2);

const esc = (t: string) => t.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/"/g, '&quot;');

const pinIcon = (kind: 'rs' | 'pkm', label: string, selected: boolean, showLabel: boolean) =>
  L.divIcon({
    className: '',
    iconSize: [26, 26],
    iconAnchor: [13, 26],
    html: `<div class="fac-pin fac-${kind}${selected ? ' is-selected' : ''}" title="${esc(label)}"><span>${kind === 'rs' ? 'H' : '+'}</span></div>${
      showLabel ? `<b class="fac-label">${esc(label)}</b>` : ''
    }`,
  });

/**
 * Lapisan dasar: peta jalan (digelapkan) atau satelit + label (gaya Google Earth).
 * Bila ubin OpenStreetMap gagal dimuat (diblokir/jaringan), otomatis pindah ke peta jalan Esri.
 */
export const BaseLayers: React.FC<{ mode: 'peta' | 'satelit'; darkStreets?: boolean }> = ({ mode, darkStreets = true }) => {
  const [osmFailed, setOsmFailed] = useState(false);
  const errors = React.useRef(0);
  if (mode === 'satelit') {
    return (
      <>
        <TileLayer
          key="sat"
          url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"
          attribution="Citra &copy; Esri, Maxar, Earthstar Geographics"
          maxNativeZoom={18}
          maxZoom={20}
        />
        <TileLayer
          key="sat-labels"
          url="https://server.arcgisonline.com/ArcGIS/rest/services/Reference/World_Boundaries_and_Places/MapServer/tile/{z}/{y}/{x}"
          maxNativeZoom={18}
          maxZoom={20}
        />
      </>
    );
  }
  return osmFailed ? (
    <TileLayer
      key={`esri-street-${darkStreets}`}
      url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Street_Map/MapServer/tile/{z}/{y}/{x}"
      attribution="Peta &copy; Esri, HERE, Garmin, &copy; OpenStreetMap"
      className={darkStreets ? 'riak-dark-tiles' : undefined}
      maxNativeZoom={19}
      maxZoom={20}
    />
  ) : (
    <TileLayer
      key={`osm-${darkStreets}`}
      attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
      url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      className={darkStreets ? 'riak-dark-tiles' : undefined}
      maxNativeZoom={19}
      maxZoom={20}
      eventHandlers={{
        tileerror: () => {
          errors.current += 1;
          if (errors.current >= 4) setOsmFailed(true);
        },
      }}
    />
  );
};

/** Scroll-zoom hanya aktif setelah peta diklik, agar scroll halaman tidak "tersangkut". */
export const ScrollZoomOnClick: React.FC<{ onActivate?: () => void }> = ({ onActivate }) => {
  const map = useMap();
  useEffect(() => {
    const on = () => {
      if (!map.scrollWheelZoom.enabled()) {
        map.scrollWheelZoom.enable();
        onActivate?.();
      }
    };
    const off = () => map.scrollWheelZoom.disable();
    map.on('click', on);
    map.on('mouseout', off);
    return () => {
      map.off('click', on);
      map.off('mouseout', off);
    };
  }, [map, onActivate]);
  return null;
};

interface FacilityLayerProps {
  facilities: Facility[];
  puskesmas: Puskesmas[];
  selected: MapSelection | null;
  onSelect: (s: MapSelection) => void;
  onZoomChange?: (z: number) => void;
}

export const FacilityLayer: React.FC<FacilityLayerProps> = ({ facilities, puskesmas, selected, onSelect, onZoomChange }) => {
  const map = useMap();
  const [view, setView] = useState(() => ({ zoom: map.getZoom(), bounds: map.getBounds().pad(0.25) }));

  useMapEvents({
    moveend: () => setView({ zoom: map.getZoom(), bounds: map.getBounds().pad(0.25) }),
  });
  useEffect(() => onZoomChange?.(view.zoom), [view.zoom, onZoomChange]);

  const validRs = useMemo(() => uniqueFacilities(facilities.filter((f) => isValidJabodetabekCoord(f.lat, f.lon))), [facilities]);
  const selId = selectionId(selected);
  const { zoom, bounds } = view;

  if (zoom < ZOOM_DOTS) return null;

  const rsInView = validRs.filter((f) => bounds.contains([f.lat, f.lon]));
  const pkmInView = puskesmas.filter((p) => bounds.contains([p.lat, p.lon]));
  const thin = zoom <= 11;
  const pins = zoom >= ZOOM_PIN;
  const labels = zoom >= ZOOM_PIN + 1;

  return (
    <>
      {pkmInView.map((p) => {
        const id = `pkm:${p.id}`;
        const isSel = id === selId;
        return pins ? (
          <Marker
            key={id}
            position={[p.lat, p.lon]}
            icon={pinIcon('pkm', p.nama, isSel, labels || isSel)}
            zIndexOffset={isSel ? 1000 : 0}
            eventHandlers={{ click: () => onSelect({ kind: 'pkm', p }) }}
          />
        ) : (
          <CircleMarker
            key={id}
            center={[p.lat, p.lon]}
            radius={isSel ? 7 : pkmRadius(zoom)}
            pathOptions={{ color: '#ffffff', weight: isSel ? 2.5 : thin ? 0.6 : 1, fillColor: '#34d399', fillOpacity: 0.95 }}
            eventHandlers={{ click: () => onSelect({ kind: 'pkm', p }) }}
          >
            <LeafletTooltip direction="top" offset={[0, -4]}>
              <span className="text-xs font-semibold">{p.nama}</span>
            </LeafletTooltip>
          </CircleMarker>
        );
      })}
      {rsInView.map((f) => {
        const id = rsId(f);
        const isSel = id === selId;
        return pins ? (
          <Marker
            key={id}
            position={[f.lat, f.lon]}
            icon={pinIcon('rs', f.nama, isSel, labels || isSel)}
            zIndexOffset={isSel ? 1000 : 500}
            eventHandlers={{ click: () => onSelect({ kind: 'rs', f }) }}
          />
        ) : (
          <CircleMarker
            key={id}
            center={[f.lat, f.lon]}
            radius={(isSel ? 3 : 0) + rsRadius(zoom, Number(f.tempat_tidur))}
            pathOptions={{ color: '#ffffff', weight: isSel ? 3 : thin ? 0.8 : 1.2, fillColor: '#f472b6', fillOpacity: 0.95 }}
            eventHandlers={{ click: () => onSelect({ kind: 'rs', f }) }}
          >
            <LeafletTooltip direction="top" offset={[0, -6]}>
              <span className="text-xs font-semibold">{f.nama}</span>
            </LeafletTooltip>
          </CircleMarker>
        );
      })}
    </>
  );
};
