import React, { useState, useEffect } from 'react';
import { fetchCsv, normalizeLeadTimes } from '../data/loader';
import { LeadTime } from '../types';
import { SectionTag, GradientCard } from '../components/common/CommonUi';
import { Angka } from '../components/common/Angka';
import { BookOpen, SlidersHorizontal, Database, AlertCircle } from 'lucide-react';

export const Metodologi: React.FC = () => {
  const [leadTimes, setLeadTimes] = useState<LeadTime[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    fetchCsv<Record<string, any>>('./data/lead_times.csv').then(normalizeLeadTimes).then((data) => {
      setLeadTimes(data);
      setLoading(false);
    });
  }, []);

  return (
    <div className="mx-auto max-w-[1200px] px-4 py-8 space-y-8">
      {/* Header */}
      <div>
        <SectionTag>TRANSPARANSI & FORMULA</SectionTag>
        <h1 className="mt-2 font-display text-3xl md:text-4xl font-extrabold text-ink tracking-tight">
          Metodologi, Asumsi, & Parameter Model
        </h1>
        <p className="mt-2 text-sm text-ink-muted max-w-3xl leading-relaxed">
          Dokumentasi terbuka mengenai seluruh formulasi matematis, nilai parameter, batas ketidakpastian, dan waktu tunggu logistik yang digunakan mesin RIAK.
        </p>
        <div className="mt-4 h-0.5 w-full bg-brand-gradient rounded-full" />
      </div>

      {/* Model Equations Explanation */}
      <GradientCard hoverEffect={false}>
        <div className="flex items-center gap-2 mb-3 text-brand-blue font-bold text-sm">
          <BookOpen className="h-4 w-4" />
          <h3>Rumus Inti: Batas Waktu Bertindak (BWB)</h3>
        </div>

        <div className="rounded-xl bg-surface-2 p-4 border border-line font-mono text-sm font-bold text-ink mb-4">
          BWB = T_penuh − Waktu_tunggu − Cadangan_aman
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs text-ink leading-relaxed">
          <div className="p-3 rounded-lg border border-line bg-surface">
            <span className="font-bold text-brand-blue block mb-1">1. T_penuh (Kapan Penuh)</span>
            Hari pertama ketika proyeksi kebutuhan sumber daya melampaui kapasitas fasilitas kesehatan:
            <span className="font-mono block text-ink-muted mt-1">L(t) · k_sumberdaya &gt; Kapasitas_faskes</span>
          </div>

          <div className="p-3 rounded-lg border border-line bg-surface">
            <span className="font-bold text-brand-pink block mb-1">2. Waktu Tunggu (Lead Time)</span>
            Lama waktu yang dibutuhkan dari penerbitan PO / instruksi sampai sumber daya tiba dan siap digunakan:
            <span className="font-mono block text-ink-muted mt-1">[LT_min, LT_max] hari</span>
          </div>

          <div className="p-3 rounded-lg border border-line bg-surface">
            <span className="font-bold text-status-aman block mb-1">3. Cadangan Aman (Safety Buffer)</span>
            Jeda hari tambahan untuk mengantisipasi keterlambatan logistik tak terduga (default = 0 hari).
          </div>
        </div>
      </GradientCard>

      {/* Editable Lead Times Table */}
      <GradientCard hoverEffect={false}>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4 pb-3 border-b border-line">
          <div>
            <h3 className="font-display text-lg font-bold text-ink">
              Tabel Waktu Tunggu Logistik (Lead Times)
            </h3>
            <p className="text-xs text-ink-muted">
              Waktu tunggu dapat disesuaikan untuk menguji sensitivitas terhadap pergeseran BWB
            </p>
          </div>
          <span className="text-[11px] font-mono text-ink-muted bg-surface-2 px-2.5 py-1 rounded-lg border border-line">
            Sumber: lead_times.csv
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-line bg-surface-2 text-ink-muted">
                <th className="py-2.5 px-3">Jenis Persiapan</th>
                <th className="py-2.5 px-3 font-mono">Waktu Tunggu Min (Hari)</th>
                <th className="py-2.5 px-3 font-mono">Waktu Tunggu Max (Hari)</th>
                <th className="py-2.5 px-3">Dasar & Referensi</th>
                <th className="py-2.5 px-3 text-center">Status Data</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {leadTimes.map((lt, idx) => (
                <tr key={idx} className="hover:bg-surface-2/60 transition">
                  <td className="py-2.5 px-3 font-semibold text-ink">{lt.persiapan}</td>
                  <td className="py-2.5 px-3 font-mono">
                    <input
                      type="number"
                      value={lt.lead_time_min_hari}
                      onChange={(e) => {
                        const val = Number(e.target.value);
                        setLeadTimes((prev) =>
                          prev.map((item, i) => (i === idx ? { ...item, lead_time_min_hari: val } : item))
                        );
                      }}
                      className="w-16 rounded border border-line bg-surface-2 px-2 py-1 text-xs font-mono font-bold text-ink"
                    />
                  </td>
                  <td className="py-2.5 px-3 font-mono">
                    <input
                      type="number"
                      value={lt.lead_time_max_hari}
                      onChange={(e) => {
                        const val = Number(e.target.value);
                        setLeadTimes((prev) =>
                          prev.map((item, i) => (i === idx ? { ...item, lead_time_max_hari: val } : item))
                        );
                      }}
                      className="w-16 rounded border border-line bg-surface-2 px-2 py-1 text-xs font-mono font-bold text-ink"
                    />
                  </td>
                  <td className="py-2.5 px-3 text-ink-muted max-w-sm">{lt.dasar}</td>
                  <td className="py-2.5 px-3 text-center">
                    <span className="font-mono text-[11px] font-bold px-2 py-0.5 rounded bg-surface-2 border border-line text-ink">
                      {lt.status_data}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </GradientCard>

      {/* Sources & Access Matrix */}
      <GradientCard hoverEffect={false}>
        <div className="flex items-center gap-2 mb-3 text-brand-blue font-bold text-sm">
          <Database className="h-4 w-4" />
          <h3>Matriks Akses & Sumber Data Riil</h3>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-line bg-surface-2 text-ink-muted">
                <th className="py-2 px-3">Sumber Data</th>
                <th className="py-2 px-3">Data yang Digunakan</th>
                <th className="py-2 px-3">Kategori Akses</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              <tr>
                <td className="py-2.5 px-3 font-semibold text-ink">WHO Disease Outbreak News</td>
                <td className="py-2.5 px-3 text-ink-muted">Laporan resmi wabah internasional</td>
                <td className="py-2.5 px-3 font-semibold text-status-aman">Publik (API Terbuka)</td>
              </tr>
              <tr>
                <td className="py-2.5 px-3 font-semibold text-ink">INACOVID (Eri Airlangga)</td>
                <td className="py-2.5 px-3 text-ink-muted">Daftar RS terbuka, kasus DKI 2021, BOR 2021</td>
                <td className="py-2.5 px-3 font-semibold text-status-aman">Publik (Lisensi MIT)</td>
              </tr>
              <tr>
                <td className="py-2.5 px-3 font-semibold text-ink">BPS (Badan Pusat Statistik)</td>
                <td className="py-2.5 px-3 text-ink-muted">Statistik Komuter Jabodetabek, penduduk, wisman pintu masuk</td>
                <td className="py-2.5 px-3 font-semibold text-status-aman">Publik</td>
              </tr>
              <tr>
                <td className="py-2.5 px-3 font-semibold text-ink">SIRANAP / SIRS Kemenkes</td>
                <td className="py-2.5 px-3 text-ink-muted">Ketersediaan tempat tidur RS harian</td>
                <td className="py-2.5 px-3 font-semibold text-status-siaga">Publik / Kerja Sama Kemenkes</td>
              </tr>
              <tr>
                <td className="py-2.5 px-3 font-semibold text-ink">WHO EIOS 2.0 / SKDR</td>
                <td className="py-2.5 px-3 text-ink-muted">Intelijen epidemiologi berbasis sinyal sindrom</td>
                <td className="py-2.5 px-3 font-semibold text-brand-blue">Melalui Kemenkes RI</td>
              </tr>
            </tbody>
          </table>
        </div>
      </GradientCard>
    </div>
  );
};

