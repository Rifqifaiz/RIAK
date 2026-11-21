import React, { useState } from 'react';
import { SectionTag, GradientCard } from '../components/common/CommonUi';
import { StatusBadge } from '../components/common/StatusBadge';
import { Play, AlertTriangle, FileText, CheckCircle2, RotateCcw } from 'lucide-react';

interface DecisionLogItem {
  id: number;
  waktu: string;
  sumberDaya: string;
  tindakan: string;
  sebelumBwb: boolean;
}

export const Latihan: React.FC = () => {
  const [skenario, setSkenario] = useState<string>('sedang');
  const [logs, setLogs] = useState<DecisionLogItem[]>([
    {
      id: 1,
      waktu: 'Hari ke-8',
      sumberDaya: 'Oksigen Likuid',
      tindakan: 'Kirim PO Darurat ke Pemasok Regional',
      sebelumBwb: true,
    },
    {
      id: 2,
      waktu: 'Hari ke-14',
      sumberDaya: 'TT ICU Tambahan',
      tindakan: 'Konversi Ruang Rawat Biasa menjadi HCU/ICU',
      sebelumBwb: true,
    },
  ]);

  const [activeInject, setActiveInject] = useState<string | null>(null);

  function addInject(msg: string) {
    setActiveInject(msg);
  }

  function addDecision(sumberDaya: string, tindakan: string) {
    setLogs((prev) => [
      ...prev,
      {
        id: prev.length + 1,
        waktu: 'Hari ke-18',
        sumberDaya,
        tindakan,
        sebelumBwb: true,
      },
    ]);
  }

  const tindakanSebelumBwbCount = logs.filter(l => l.sebelumBwb).length;
  const persenTepat = logs.length > 0 ? Math.round((tindakanSebelumBwbCount / logs.length) * 100) : 100;

  return (
    <div className="mx-auto max-w-[1200px] px-4 py-8 space-y-8">
      {/* Header */}
      <div>
        <SectionTag>MASA DAMAI: SIMULASI KESIAPSIAGAAN</SectionTag>
        <h1 className="mt-2 font-display text-3xl md:text-4xl font-extrabold text-ink tracking-tight">
          Mode Latihan — Tabletop Simulation Disease X
        </h1>
        <p className="mt-2 text-sm text-ink-muted max-w-3xl leading-relaxed">
          Simulasi latihan kesiapsiagaan meja (tabletop exercise) bagi jajaran pimpinan RS dan dinas kesehatan untuk menguji kecepatan pengambilan keputusan logistik sebelum krisis terjadi.
        </p>
        <div className="mt-4 h-0.5 w-full bg-brand-gradient rounded-full" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Facilitator Panel */}
        <div className="space-y-6">
          <GradientCard hoverEffect={false}>
            <div className="flex items-center gap-2 mb-3 text-brand-pink font-bold text-sm">
              <AlertTriangle className="h-4 w-4" />
              <h3>Panel Fasilitator (Injects)</h3>
            </div>
            <p className="text-xs text-ink-muted mb-4">
              Klik tombol untuk memunculkan disrupsi logistik tak terduga kepada peserta latihan:
            </p>

            <div className="space-y-2.5">
              <button
                onClick={() => addInject('Pengiriman pasokan oksigen tertunda 7 hari akibat gangguan rantai pasok pabrik.')}
                className="w-full text-left p-2.5 rounded-xl border border-line bg-surface-2 hover:border-brand-pink hover:bg-brand-pink-50/30 text-xs font-semibold text-ink transition"
              >
                + Pengiriman Oksigen Tertunda 7 Hari
              </button>
              <button
                onClick={() => addInject('RS Rujukan Utama menutup sementara 30% tempat tidur ICU untuk sterilisasi.')}
                className="w-full text-left p-2.5 rounded-xl border border-line bg-surface-2 hover:border-brand-pink hover:bg-brand-pink-50/30 text-xs font-semibold text-ink transition"
              >
                + RS Rujukan Menutup ICU Sementara
              </button>
              <button
                onClick={() => addInject('Lonjakan kepulangan jemaah/wisatawan: kasus impor awal melonjak 2× lipat.')}
                className="w-full text-left p-2.5 rounded-xl border border-line bg-surface-2 hover:border-brand-pink hover:bg-brand-pink-50/30 text-xs font-semibold text-ink transition"
              >
                + Lonjakan Kasus Impor Bandara (2×)
              </button>
              <button
                onClick={() => addInject('Klaster internal nakes: 15% perawat isolasi terkonfirmasi sakit.')}
                className="w-full text-left p-2.5 rounded-xl border border-line bg-surface-2 hover:border-brand-pink hover:bg-brand-pink-50/30 text-xs font-semibold text-ink transition"
              >
                + Tenaga Perawat Sakit 15%
              </button>
            </div>

            {activeInject && (
              <div className="mt-4 p-3 rounded-xl bg-status-terlewat-bg border border-status-terlewat/30 text-xs text-ink">
                <span className="font-bold text-status-terlewat block mb-1">INJECT AKTIF:</span>
                {activeInject}
              </div>
            )}
          </GradientCard>

          {/* Quick Metrics */}
          <GradientCard hoverEffect={false}>
            <h4 className="text-xs font-bold text-ink uppercase mb-2">Evaluasi Respons Peserta</h4>
            <div className="space-y-3">
              <div>
                <span className="text-xs text-ink-muted">Tindakan Sebelum BWB Terlewat:</span>
                <div className="font-mono text-2xl font-bold text-status-aman">{persenTepat}%</div>
              </div>
              <div>
                <span className="text-xs text-ink-muted">Total Keputusan Dicatat:</span>
                <div className="font-mono text-lg font-bold text-ink">{logs.length} keputusan</div>
              </div>
            </div>
          </GradientCard>
        </div>

        {/* Decision Log & Action */}
        <div className="lg:col-span-2 space-y-6">
          <GradientCard hoverEffect={false}>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-line">
              <div>
                <h3 className="font-display text-lg font-bold text-ink">Log Keputusan Peserta</h3>
                <p className="text-xs text-ink-muted">Pencatatan tindakan mitigasi yang diambil selama skenario berjalan</p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => addDecision('Obat Antiviral', 'Rilis Stok Penyangga Gudang Farmasi')}
                  className="rounded-xl bg-brand-blue px-3.5 py-2 text-xs font-bold text-white hover:bg-brand-blue/90 shadow transition"
                >
                  + Catat Keputusan
                </button>
              </div>
            </div>

            <div className="mt-4 overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-line bg-surface-2 text-ink-muted">
                    <th className="py-2.5 px-3">Waktu Simulasi</th>
                    <th className="py-2.5 px-3">Sumber Daya</th>
                    <th className="py-2.5 px-3">Tindakan Peserta</th>
                    <th className="py-2.5 px-3 text-center">Ketepatan Waktu</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-line">
                  {logs.map((l) => (
                    <tr key={l.id} className="hover:bg-surface-2/60 transition">
                      <td className="py-2.5 px-3 font-mono font-semibold text-ink">{l.waktu}</td>
                      <td className="py-2.5 px-3 font-medium text-ink">{l.sumberDaya}</td>
                      <td className="py-2.5 px-3 text-ink-muted">{l.tindakan}</td>
                      <td className="py-2.5 px-3 text-center">
                        <span className="inline-flex items-center gap-1 text-status-aman font-bold">
                          <CheckCircle2 className="h-3.5 w-3.5" /> Sebelum BWB
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="mt-6 border-t border-line pt-4 flex items-center justify-between text-xs text-ink-muted">
              <span>Disimpan secara lokal di browser (`localStorage`).</span>
              <button
                onClick={() => window.print()}
                className="font-semibold text-brand-blue hover:underline"
              >
                Cetak Ringkasan Latihan (PDF) →
              </button>
            </div>
          </GradientCard>
        </div>
      </div>
    </div>
  );
};

