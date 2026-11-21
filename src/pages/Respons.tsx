import React, { useState, useEffect } from 'react';
import { fetchCsv, normalizeLeadTimes } from '../data/loader';
import { normalizeRegions, normalizeFacilities } from '../data/geo';
import { Facility, Region, LeadTime, BwbItemResult } from '../types';
import { calculateBwb } from '../engine/bwb';
import { SectionTag, GradientCard, TimelineBwb } from '../components/common/CommonUi';
import { StatusBadge } from '../components/common/StatusBadge';
import { DataMissing } from '../components/common/DataMissing';
import { Angka } from '../components/common/Angka';
import { Building2, Search, SlidersHorizontal, ArrowUpDown, ShieldAlert, Sparkles } from 'lucide-react';
import { Link, useSearchParams } from 'react-router-dom';

export const Respons: React.FC = () => {
  const [facilities, setFacilities] = useState<Facility[]>([]);
  const [regions, setRegions] = useState<Region[]>([]);
  const [leadTimes, setLeadTimes] = useState<LeadTime[]>([]);
  const [selectedRegion, setSelectedRegion] = useState<string>('3171'); // Default: Jakarta Selatan
  const [selectedFacilityCode, setSelectedFacilityCode] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(true);
  const [searchParams] = useSearchParams();
  const faskesParam = searchParams.get('faskes');

  useEffect(() => {
    Promise.all([
      fetchCsv<Facility>('/data/facilities.csv'),
      fetchCsv<Record<string, unknown>>('/data/regions.csv'),
      fetchCsv<Record<string, any>>('/data/lead_times.csv').then(normalizeLeadTimes),
    ]).then(([facsRaw, regsRaw, lts]) => {
      const facs = normalizeFacilities(facsRaw);
      setFacilities(facs);
      setRegions(normalizeRegions(regsRaw));
      setLeadTimes(lts);
      if (facs.length > 0) {
        // Faskes dari tautan peta (?faskes=kode), atau bawaan: Jakarta Selatan
        const fromLink = faskesParam ? facs.find(f => f.kode_rs === faskesParam) : undefined;
        if (fromLink) setSelectedRegion(fromLink.kode_wilayah);
        const def = fromLink || facs.find(f => f.kode_wilayah === '3171') || facs[0];
        setSelectedFacilityCode(def.kode_rs);
      }
      setLoading(false);
    });
  }, [faskesParam]);

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center text-ink-muted">
        Memuat data 461 fasilitas kesehatan dan waktu tunggu logistik...
      </div>
    );
  }

  // Filter facilities
  const filteredFacilities = facilities.filter(f => {
    const matchRegion = !selectedRegion || f.kode_wilayah === selectedRegion;
    const matchSearch = !searchQuery || f.nama.toLowerCase().includes(searchQuery.toLowerCase());
    return matchRegion && matchSearch;
  });

  const selectedFacility = facilities.find(f => f.kode_rs === selectedFacilityCode) || facilities[0];
  const bwbItems: BwbItemResult[] = selectedFacility
    ? calculateBwb(selectedFacility, leadTimes, '2021-06-10', 0)
    : [];

  return (
    <div className="mx-auto max-w-[1200px] px-4 py-8 space-y-8">
      {/* Header */}
      <div>
        <SectionTag>MODUL INTI OPERASIONAL</SectionTag>
        <h1 className="mt-2 font-display text-3xl md:text-4xl font-extrabold text-ink tracking-tight">
          RESPONS — Hitung Mundur & Batas Waktu Bertindak
        </h1>
        <p className="mt-2 text-sm text-ink-muted max-w-3xl leading-relaxed">
          Pilih fasilitas kesehatan untuk melihat kapan kapasitas akan terlampaui dan batas waktu paling lambat persiapan harus dimulai agar selesai tepat waktu.
        </p>
        <div className="mt-4 h-0.5 w-full bg-brand-gradient rounded-full" />
      </div>

      {/* Selector Controls */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 bg-surface p-4 rounded-2xl border border-line shadow-sm">
        <div>
          <label className="block text-xs font-bold text-ink-muted mb-1.5">Wilayah (Kabupaten / Kota):</label>
          <select
            value={selectedRegion}
            onChange={(e) => {
              setSelectedRegion(e.target.value);
              const firstInRegion = facilities.find(f => f.kode_wilayah === e.target.value);
              if (firstInRegion) setSelectedFacilityCode(firstInRegion.kode_rs);
            }}
            className="w-full rounded-xl border border-line bg-surface-2 px-3 py-2 text-xs font-semibold text-ink focus:border-brand-blue focus:outline-none"
          >
            <option value="">Semua Wilayah Jabodetabek</option>
            {regions.map(r => (
              <option key={r.kode_bps} value={r.kode_bps}>
                {r.nama} ({r.provinsi})
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-xs font-bold text-ink-muted mb-1.5">Cari Fasilitas Kesehatan:</label>
          <div className="relative">
            <Search className="absolute left-3 top-2.5 h-3.5 w-3.5 text-ink-muted" />
            <input
              type="text"
              placeholder="Ketik nama rumah sakit..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full rounded-xl border border-line bg-surface-2 pl-9 pr-3 py-2 text-xs text-ink focus:border-brand-blue focus:outline-none"
            />
          </div>
        </div>

        <div>
          <label className="block text-xs font-bold text-ink-muted mb-1.5">Pilih Rumah Sakit ({filteredFacilities.length} ditemukan):</label>
          <select
            value={selectedFacilityCode}
            onChange={(e) => setSelectedFacilityCode(e.target.value)}
            className="w-full rounded-xl border border-line bg-surface-2 px-3 py-2 text-xs font-semibold text-ink focus:border-brand-blue focus:outline-none"
          >
            {filteredFacilities.map(f => (
              <option key={f.kode_rs} value={f.kode_rs}>
                {f.nama} ({f.tipe})
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Selected Facility Summary Card */}
      {selectedFacility && (
        <GradientCard hoverEffect={false}>
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-line">
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-brand-blue-50 text-brand-blue">
                <Building2 className="h-6 w-6" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="font-display text-xl font-bold text-ink">{selectedFacility.nama}</h2>
                  <span className="rounded-full bg-surface-2 px-2.5 py-0.5 text-[11px] font-bold text-ink-muted border border-line">
                    Tipe {selectedFacility.tipe}
                  </span>
                </div>
                <p className="text-xs text-ink-muted mt-0.5">
                  Kode RS: <span className="font-mono font-medium">{selectedFacility.kode_rs}</span> · Wilayah: {regions.find(r => r.kode_bps === selectedFacility.kode_wilayah)?.nama || selectedFacility.kode_wilayah}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Link
                to="/metodologi"
                className="inline-flex items-center gap-1.5 rounded-xl border border-line bg-surface-2 px-3.5 py-2 text-xs font-semibold text-ink hover:bg-line transition"
              >
                <SlidersHorizontal className="h-3.5 w-3.5 text-brand-blue" />
                Ubah Waktu Tunggu
              </Link>
            </div>
          </div>

          {/* Quick Capacity Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-3 mt-4">
            <div className="p-3 rounded-xl bg-surface-2 border border-line">
              <div className="text-[11px] text-ink-muted">Total Tempat Tidur</div>
              <div className="text-lg font-bold font-mono text-ink mt-0.5">
                <Angka nilai={selectedFacility.tempat_tidur} status="BERSUMBER" sumber="Daftar RS Terbuka INACOVID" />
              </div>
            </div>
            <div className="p-3 rounded-xl bg-surface-2 border border-line">
              <div className="text-[11px] text-ink-muted">Alokasi TT Isolasi</div>
              <div className="text-lg font-bold font-mono text-ink mt-0.5">
                {selectedFacility.tt_isolasi ? (
                  <Angka nilai={selectedFacility.tt_isolasi} status="ASUMSI" sumber="Alokasi Proporsional DKI 2021" />
                ) : <DataMissing />}
              </div>
            </div>
            <div className="p-3 rounded-xl bg-surface-2 border border-line">
              <div className="text-[11px] text-ink-muted">Alokasi TT ICU</div>
              <div className="text-lg font-bold font-mono text-ink mt-0.5">
                {selectedFacility.tt_icu ? (
                  <Angka nilai={selectedFacility.tt_icu} status="ASUMSI" sumber="Alokasi Proporsional DKI 2021" />
                ) : <DataMissing />}
              </div>
            </div>
            <div className="p-3 rounded-xl bg-surface-2 border border-line">
              <div className="text-[11px] text-ink-muted">Kapasitas Oksigen</div>
              <div className="text-xs font-mono text-ink mt-2">
                <DataMissing />
              </div>
            </div>
            <div className="p-3 rounded-xl bg-surface-2 border border-line">
              <div className="text-[11px] text-ink-muted">Stok APD N95</div>
              <div className="text-xs font-mono text-ink mt-2">
                <DataMissing />
              </div>
            </div>
            <div className="p-3 rounded-xl bg-surface-2 border border-line">
              <div className="text-[11px] text-ink-muted">Tenaga Perawat</div>
              <div className="text-xs font-mono text-ink mt-2">
                <DataMissing />
              </div>
            </div>
          </div>
        </GradientCard>
      )}

      {/* Main Countdown & BWB Table */}
      <GradientCard hoverEffect={false}>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4">
          <div>
            <h3 className="font-display text-lg font-bold text-ink">
              Tabel Hitung Mundur & Batas Waktu Bertindak (BWB)
            </h3>
            <p className="text-xs text-ink-muted">
              Diurutkan dari BWB paling mendesak. Formula: <span className="font-mono font-semibold">BWB = Tanggal Faskes Penuh − Waktu Tunggu</span>
            </p>
          </div>
          <div className="text-xs font-mono text-ink-muted">
            Acuan Hari Simulasi: <span className="font-bold text-brand-blue">10 Juni 2021</span>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-line bg-surface-2 text-ink-muted">
                <th className="py-3 px-3">Sumber Daya</th>
                <th className="py-3 px-3 font-mono">Penuh/Habis Dalam</th>
                <th className="py-3 px-3 font-mono">Waktu Tunggu (LT)</th>
                <th className="py-3 px-3 font-mono">Batas Waktu Bertindak (BWB)</th>
                <th className="py-3 px-3">Status</th>
                <th className="py-3 px-3">Tindakan Disarankan</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {bwbItems.map((item, idx) => (
                <tr key={idx} className="hover:bg-surface-2/60 transition">
                  <td className="py-3 px-3 font-semibold text-ink">
                    {item.sumberDaya}
                    {!item.adaData && <span className="block text-[10px] text-ink-muted font-normal">Estimasi model</span>}
                  </td>
                  <td className="py-3 px-3 font-mono">
                    <span className="font-bold text-ink">{item.penuhDalamMinHari}–{item.penuhDalamMaxHari}</span> hari
                    <span className="block text-[10px] text-ink-muted">{item.tanggalPenuhMin} s/d {item.tanggalPenuhMax}</span>
                  </td>
                  <td className="py-3 px-3 font-mono">
                    {item.leadTimeMinHari}–{item.leadTimeMaxHari} hari
                  </td>
                  <td className="py-3 px-3 font-mono">
                    <span className="font-bold text-brand-blue">{item.bwbMin}</span> s/d <span className="font-bold text-brand-blue">{item.bwbMax}</span>
                  </td>
                  <td className="py-3 px-3">
                    <StatusBadge status={item.status} />
                  </td>
                  <td className="py-3 px-3 text-ink-muted leading-snug max-w-xs">
                    {item.tindakanDisarankan}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </GradientCard>

      {/* Visual BWB Timeline */}
      <GradientCard hoverEffect={false}>
        <h3 className="font-display text-base font-bold text-ink mb-3">
          Garis Waktu Keputusan Logistik (Contoh: Tempat Tidur Isolasi RS)
        </h3>
        <TimelineBwb
          tanggalHariIni="10 Jun 2021"
          tanggalBwb="12–21 Jun 2021"
          tanggalPenuh="23–26 Jun 2021"
        />
      </GradientCard>
    </div>
  );
};

