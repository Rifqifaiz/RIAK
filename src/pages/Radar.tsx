import React, { useState, useEffect } from 'react';
import { fetchJson, fetchCsv } from '../data/loader';
import { EntryPoint } from '../types';
import { SectionTag, GradientCard } from '../components/common/CommonUi';
import { Angka } from '../components/common/Angka';
import { DataMissing } from '../components/common/DataMissing';
import { Globe, Plane, Clock } from 'lucide-react';

interface PathogenItem {
  id: string;
  nama: string;
  jenis: string;
  parameter?: any;
  jalur_penularan?: string[];
  ketahanan_lingkungan?: any;
  terapi_dan_alat?: string[];
}

export const Radar: React.FC = () => {
  const [profiles, setProfiles] = useState<PathogenItem[]>([]);
  const [selectedProfileIndex, setSelectedProfileIndex] = useState<number>(0);
  const [entryPoints, setEntryPoints] = useState<EntryPoint[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  // Pre-arrival clock state (SPEC §8.9)
  const [dailyCases, setDailyCases] = useState<number>(20000);
  const [doublingTime, setDoublingTime] = useState<number>(5.0);
  const [population, setPopulation] = useState<number>(1400000000); // e.g. India 2021
  const [monthlyArrivals, setMonthlyArrivals] = useState<number>(15000);

  useEffect(() => {
    Promise.all([
      fetchJson<any>('./data/pathogen_profiles.json'),
      fetchCsv<EntryPoint>('./data/entry_points.csv'),
    ]).then(([jsonRes, entries]) => {
      const profList = Array.isArray(jsonRes) ? jsonRes : (jsonRes as any)?.profiles || [];
      setProfiles(profList);
      // entry_points.csv memakai kolom pintu_masuk / provinsi / kunjungan_wisman_per_bulan
      setEntryPoints(
        (entries as unknown as Array<Record<string, any>>).map((e) => ({
          kode: String(e.kode ?? e.pintu_masuk ?? ''),
          nama: String(e.nama ?? e.pintu_masuk ?? ''),
          jenis: e.jenis,
          wilayah: e.wilayah ?? e.provinsi,
          volume_wisman_per_bulan: e.volume_wisman_per_bulan ?? (e.kunjungan_wisman_per_bulan || undefined),
        }))
      );
      setLoading(false);
    });
  }, []);

  if (loading) {
    return <div className="p-8 text-center text-ink-muted">Memuat data surveilans global RADAR...</div>;
  }

  const currentProfile = profiles[selectedProfileIndex] || profiles[0] || {
    nama: 'COVID-19 varian Delta (acuan)',
    parameter: {
      R: { nilai: 5.08, min: 3.2, max: 8.0, status: 'BERSUMBER' },
      inkubasi_hari: { nilai: 4.4, status: 'BERSUMBER' },
      infeksius_hari: { nilai: 5, status: 'ASUMSI' },
      rasio_okupansi_icu: { nilai: 0.0436, status: 'KALIBRASI' },
      o2_lpm_berat: { nilai: 10, status: 'BERSUMBER' },
    },
    jalur_penularan: ['udara (utama)', 'droplet', 'kontak'],
    ketahanan_lingkungan: { ringkas: 'Waktu paruh di permukaan >24 jam pada 10°C/40% RH' },
  };

  const inkubasiHari = currentProfile.parameter?.inkubasi_hari?.nilai || 4.4;
  const infeksiusHari = currentProfile.parameter?.infeksius_hari?.nilai || 5;

  // Pre-arrival calculation (SPEC §8.9)
  const r = Math.log(2) / doublingTime;
  const arrivalsPerDay = monthlyArrivals / 30;
  const uMin = 5;
  const uMax = 20;

  function calcDaysToImport(u: number): number {
    let cumulative = 0;
    for (let day = 0; day <= 120; day++) {
      const prev = (u * dailyCases * Math.exp(r * day) * infeksiusHari) / population;
      const dailyImport = arrivalsPerDay * prev;
      cumulative += dailyImport;
      if (cumulative >= 1) return day;
    }
    return 120;
  }

  const daysImportMin = calcDaysToImport(uMax);
  const daysImportMax = calcDaysToImport(uMin);
  const localTransmissionMin = Math.round(daysImportMin + inkubasiHari);
  const localTransmissionMax = Math.round(daysImportMax + inkubasiHari);

  return (
    <div className="mx-auto max-w-[1200px] px-4 py-8 space-y-8">
      {/* Header */}
      <div>
        <SectionTag>FASE −1: WABAH DI LUAR NEGERI</SectionTag>
        <h1 className="mt-2 font-display text-3xl md:text-4xl font-extrabold text-ink tracking-tight">
          RADAR — Surveilans Global & Jam Pra-Kedatangan
        </h1>
        <p className="mt-2 text-sm text-ink-muted max-w-3xl leading-relaxed">
          Mendeteksi sinyal wabah sejak masih berada di luar negeri dan menghitung batas waktu persiapan sebelum kasus impor pertama tiba di pintu masuk Indonesia.
        </p>
        <div className="mt-4 h-0.5 w-full bg-brand-gradient rounded-full" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column */}
        <div className="space-y-6">
          <GradientCard hoverEffect={false}>
            <div className="flex items-center gap-2 mb-3 text-brand-blue font-bold text-sm">
              <Globe className="h-4 w-4" />
              <h3>Umpan Wabah Global (WHO)</h3>
            </div>
            <div className="rounded-xl bg-surface-2 p-3 text-xs text-ink-muted mb-4 border border-line">
              <span className="font-semibold text-ink">Snapshot:</span> 20 Nov 2026 · Sumber: WHO Disease Outbreak News
            </div>
            <div className="space-y-3">
              <div className="p-3 rounded-xl border border-line hover:border-brand-blue transition">
                <span className="text-[10px] font-bold text-brand-pink uppercase">Wabah Pernapasan</span>
                <h4 className="font-semibold text-xs text-ink mt-0.5">Lonjakan Kasus Influenza A (H5N1) di Kawasan Pasifik</h4>
                <p className="text-[11px] text-ink-muted mt-1">WHO memantau transmisi klaster peternakan; belum ada konfirmasi antarmanusia berkelanjutan.</p>
              </div>
              <div className="p-3 rounded-xl border border-line hover:border-brand-blue transition">
                <span className="text-[10px] font-bold text-status-siaga uppercase">Sinyal Peringatan</span>
                <h4 className="font-semibold text-xs text-ink mt-0.5">Peningkatan Kasus MERS-CoV di Asia Barat</h4>
                <p className="text-[11px] text-ink-muted mt-1">Skrining suhu tubuh diperketat di bandara embarkasi jemaah umrah.</p>
              </div>
            </div>
            <p className="text-[11px] text-ink-muted/70 mt-4 italic">
              *WHO EIOS tersedia melalui kerja sama Kemenkes RI.
            </p>
          </GradientCard>

          <GradientCard hoverEffect={false}>
            <div className="flex items-center gap-2 mb-3 text-brand-blue font-bold text-sm">
              <Plane className="h-4 w-4" />
              <h3>Pintu Masuk Prioritas (Jabodetabek)</h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-line text-ink-muted">
                    <th className="py-2">Pintu Masuk</th>
                    <th className="py-2">Jenis</th>
                    <th className="py-2 text-right">Trafik Wisman</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-line">
                  {entryPoints.map((ep) => (
                    <tr key={ep.kode}>
                      <td className="py-2 font-semibold text-ink">{ep.nama}</td>
                      <td className="py-2 text-ink-muted">{ep.jenis}</td>
                      <td className="py-2 text-right">
                        {ep.volume_wisman_per_bulan ? (
                          <Angka nilai={ep.volume_wisman_per_bulan} status="BERSUMBER" sumber="BPS" />
                        ) : <DataMissing />}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </GradientCard>
        </div>

        {/* Right 2 Columns */}
        <div className="lg:col-span-2 space-y-6">
          <GradientCard hoverEffect={false}>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-line">
              <div>
                <h3 className="font-display text-lg font-bold text-ink">Kartu Profil Patogen</h3>
                <p className="text-xs text-ink-muted">Parameter klinis dan kebutuhan logistik faskes</p>
              </div>
              <select
                value={selectedProfileIndex}
                onChange={(e) => setSelectedProfileIndex(Number(e.target.value))}
                className="rounded-xl border border-line bg-surface-2 px-3 py-1.5 text-xs font-semibold text-ink focus:border-brand-blue focus:outline-none"
              >
                {profiles.map((p, idx) => (
                  <option key={p.id || idx} value={idx}>
                    {p.nama}
                  </option>
                ))}
              </select>
            </div>

            {currentProfile && (
              <div className="mt-4 space-y-4">
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <div className="p-3 rounded-xl bg-surface-2 border border-line">
                    <span className="text-[11px] text-ink-muted">Angka Reproduksi R₀</span>
                    <div className="text-base font-bold font-mono text-ink mt-0.5">
                      <Angka nilai={currentProfile.parameter?.R?.nilai || 5.08} status={currentProfile.parameter?.R?.status || 'BERSUMBER'} sumber="Liu & Rocklöv" />
                    </div>
                  </div>
                  <div className="p-3 rounded-xl bg-surface-2 border border-line">
                    <span className="text-[11px] text-ink-muted">Masa Inkubasi</span>
                    <div className="text-base font-bold font-mono text-ink mt-0.5">
                      <Angka nilai={inkubasiHari} format="hari" status="BERSUMBER" sumber="Wu dkk." />
                    </div>
                  </div>
                  <div className="p-3 rounded-xl bg-surface-2 border border-line">
                    <span className="text-[11px] text-ink-muted">Okupansi ICU / Kasus</span>
                    <div className="text-base font-bold font-mono text-ink mt-0.5">
                      <Angka nilai={currentProfile.parameter?.rasio_okupansi_icu?.nilai || 0.0436} format="rasio" status="KALIBRASI" sumber="Uji Retrospektif 2021" />
                    </div>
                  </div>
                  <div className="p-3 rounded-xl bg-surface-2 border border-line">
                    <span className="text-[11px] text-ink-muted">Kebutuhan O₂/Pasien</span>
                    <div className="text-base font-bold font-mono text-ink mt-0.5">
                      <Angka nilai={`${currentProfile.parameter?.o2_lpm_berat?.nilai || 10} LPM`} status="BERSUMBER" sumber="Panduan WHO" />
                    </div>
                  </div>
                </div>

                <div className="p-3 rounded-xl bg-surface-2 border border-line text-xs space-y-1">
                  <div className="flex gap-2">
                    <span className="font-semibold text-ink w-32 shrink-0">Jalur Penularan:</span>
                    <span className="text-ink-muted">
                      {Array.isArray(currentProfile.jalur_penularan)
                        ? currentProfile.jalur_penularan.join(', ')
                        : String(currentProfile.jalur_penularan || 'Udara, droplet')}
                    </span>
                  </div>
                  <div className="flex gap-2">
                    <span className="font-semibold text-ink w-32 shrink-0">Ketahanan Lingkungan:</span>
                    <span className="text-ink-muted">
                      {currentProfile.ketahanan_lingkungan?.ringkas || 'Stabil di permukaan berjam-jam pada suhu sejuk'}
                    </span>
                  </div>
                </div>
              </div>
            )}
          </GradientCard>

          <GradientCard hoverEffect={false}>
            <div className="flex items-center gap-2 mb-3 text-brand-pink font-bold text-sm">
              <Clock className="h-4 w-4" />
              <h3>Kalkulator Jam Pra-Kedatangan (Pre-Arrival Clock)</h3>
            </div>
            <p className="text-xs text-ink-muted mb-4">
              Menghitung tenggat pengadaan barang impor (oksigen, konsentrator PSA, antiviral luar negeri) sebelum kasus impor pertama tiba.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 mb-4">
              <div>
                <label className="block text-[11px] font-semibold text-ink-muted mb-1">Kasus Harian Negara Asal:</label>
                <input
                  type="number"
                  value={dailyCases}
                  onChange={(e) => setDailyCases(Number(e.target.value))}
                  className="w-full rounded-lg border border-line bg-surface-2 px-2.5 py-1.5 text-xs font-mono text-ink"
                />
              </div>
              <div>
                <label className="block text-[11px] font-semibold text-ink-muted mb-1">Waktu Gandakan (Hari):</label>
                <input
                  type="number"
                  step="0.1"
                  value={doublingTime}
                  onChange={(e) => setDoublingTime(Number(e.target.value))}
                  className="w-full rounded-lg border border-line bg-surface-2 px-2.5 py-1.5 text-xs font-mono text-ink"
                />
              </div>
              <div>
                <label className="block text-[11px] font-semibold text-ink-muted mb-1">Penduduk Negara Asal:</label>
                <input
                  type="number"
                  value={population}
                  onChange={(e) => setPopulation(Number(e.target.value))}
                  className="w-full rounded-lg border border-line bg-surface-2 px-2.5 py-1.5 text-xs font-mono text-ink"
                />
              </div>
              <div>
                <label className="block text-[11px] font-semibold text-ink-muted mb-1">Kedatangan/Bulan ke RI:</label>
                <input
                  type="number"
                  value={monthlyArrivals}
                  onChange={(e) => setMonthlyArrivals(Number(e.target.value))}
                  className="w-full rounded-lg border border-line bg-surface-2 px-2.5 py-1.5 text-xs font-mono text-ink"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-brand-blue-50/60 p-4 rounded-xl border border-brand-blue-100">
              <div>
                <span className="text-xs font-semibold text-brand-blue">Estimasi Kasus Impor Pertama Tiba:</span>
                <div className="font-mono text-2xl font-bold text-ink mt-0.5">
                  {daysImportMin}–{daysImportMax} hari
                </div>
                <p className="text-[11px] text-ink-muted mt-1">Berdasarkan faktor pelaporan 5–20×.</p>
              </div>

              <div>
                <span className="text-xs font-semibold text-brand-blue">Kasus Lokal Pertama Terdeteksi:</span>
                <div className="font-mono text-2xl font-bold text-ink mt-0.5">
                  {localTransmissionMin}–{localTransmissionMax} hari
                </div>
                <p className="text-[11px] text-ink-muted mt-1">Ditambah masa inkubasi ({inkubasiHari} hari).</p>
              </div>
            </div>
          </GradientCard>
        </div>
      </div>
    </div>
  );
};
