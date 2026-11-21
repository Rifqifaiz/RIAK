import React, { useEffect, useMemo, useState } from 'react';
import { CircleMarker, Marker, TileLayer, Tooltip as LeafletTooltip, useMap, useMapEvents } from 'react-leaflet';
import L from 'leaflet';
import { Facility } from '../../types';
import { isValidJabodetabekCoord } from '../../data/geo';

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

export const selectionId = (s: MapSelection | null) => (!s ? null : s.kind === 'rs' ? `rs:${s.f.kode_rs}` : `pkm:${s.p.id}`);

/** Ambang zoom: kapan RS / puskesmas / label nama mulai tampil. */
export const ZOOM_RS = 12;
export const ZOOM_PKM = 13;
export const ZOOM_PIN = 15;

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

/** Lapisan dasar: peta jalan (digelapkan) atau satelit + label (gaya Google Earth). */
export const BaseLayers: React.FC<{ mode: 'peta' | 'satelit'; darkStreets?: boolean }> = ({ mode, darkStreets = true }) =>
  mode === 'satelit' ? (
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
  ) : (
    <TileLayer
      key={`osm-${darkStreets}`}
      attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
      url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      className={darkStreets ? 'riak-dark-tiles' : undefined}
      maxNativeZoom={19}
      maxZoom={20}
    />
  );

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

  const validRs = useMemo(() => facilities.filter((f) => isValidJabodetabekCoord(f.lat, f.lon)), [facilities]);
  const selId = selectionId(selected);
  const { zoom, bounds } = view;

  if (zoom < ZOOM_RS) return null;

  const rsInView = validRs.filter((f) => bounds.contains([f.lat, f.lon]));
  const pkmInView = zoom >= ZOOM_PKM ? puskesmas.filter((p) => bounds.contains([p.lat, p.lon])) : [];
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
            radius={isSel ? 7 : 4}
            pathOptions={{ color: '#ffffff', weight: isSel ? 2.5 : 1, fillColor: '#34d399', fillOpacity: 0.9 }}
            eventHandlers={{ click: () => onSelect({ kind: 'pkm', p }) }}
          >
            <LeafletTooltip direction="top" offset={[0, -4]}>
              <span className="text-xs font-semibold">{p.nama}</span>
            </LeafletTooltip>
          </CircleMarker>
        );
      })}
      {rsInView.map((f) => {
        const id = `rs:${f.kode_rs}`;
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
            radius={(isSel ? 3 : 0) + Math.min(11, 4 + Math.sqrt(Number(f.tempat_tidur) || 0) / 2.5)}
            pathOptions={{ color: '#ffffff', weight: isSel ? 3 : 1.2, fillColor: '#f472b6', fillOpacity: 0.9 }}
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
