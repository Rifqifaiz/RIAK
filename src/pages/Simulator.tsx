import React, { useState } from 'react';
import { SectionTag, GradientCard } from '../components/common/CommonUi';
import { Angka } from '../components/common/Angka';
import { Sliders, ShieldCheck, TrendingDown, Users, AlertCircle } from 'lucide-react';

export const Simulator: React.FC = () => {
  const [selectedOption, setSelectedOption] = useState<number>(2); // Default Opsi 2
  const [reductionPercentage, setReductionPercentage] = useState<number>(30);

  const options = [
    {
      id: 1,
      nama: 'Opsi 1: Protokol Ketat & Skrining Massal',
      kontakDefault: 10,
      pergeseranPuncak: '+5 hari',
      penurunanPuncak: '−12%',
      penghematanHariTempatTidur: '4.200 hari-pasien',
      catatanSosial: 'Dampak ekonomi minimal. Kepatuhan masyarakat memerlukan pengawasan lapangan ketat dan ketersediaan masker murah/subsidi.',
    },
    {
      id: 2,
      nama: 'Opsi 2: Pembatasan Keramaian & Kapasitas Publik (50%)',
      kontakDefault: 30,
      pergeseranPuncak: '+14 hari',
      penurunanPuncak: '−34%',
      penghematanHariTempatTidur: '18.500 hari-pasien',
      catatanSosial: 'Sektor ritel dan transportasi umum terdampak sedang. Membeli waktu 2 minggu berharga bagi faskes untuk melengkapi logistik oksigen dan ICU.',
    },
    {
      id: 3,
      nama: 'Opsi 3: Pembatasan Wilayah Aglomerasi / Pengetatan Penuh',
      kontakDefault: 50,
      pergeseranPuncak: '+26 hari',
      penurunanPuncak: '−58%',
      penghematanHariTempatTidur: '42.000 hari-pasien',
      catatanSosial: 'Dampak ekonomi & sosial berat. Memerlukan bantuan sosial tunai untuk pekerja harian dan kompensasi usaha mikro. Beban faskes tertekan signifikan.',
    },
  ];

  const currentOpt = options.find(o => o.id === selectedOption) || options[1];

  return (
    <div className="mx-auto max-w-[1200px] px-4 py-8 space-y-8">
      {/* Header */}
      <div>
        <SectionTag>INTERVENSI KEBIJAKAN</SectionTag>
        <h1 className="mt-2 font-display text-3xl md:text-4xl font-extrabold text-ink tracking-tight">
          Simulator Opsi Pembatasan & Penundaan Puncak
        </h1>
        <p className="mt-2 text-sm text-ink-muted max-w-3xl leading-relaxed">
          Uji dampak skenario pembatasan mobilitas terhadap pergeseran tanggal puncak kasus dan penghematan hari-pasien tanpa tempat tidur.
        </p>
        <div className="mt-4 h-0.5 w-full bg-brand-gradient rounded-full" />
      </div>

      {/* 3 Option Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {options.map((opt) => (
          <div
            key={opt.id}
            onClick={() => {
              setSelectedOption(opt.id);
              setReductionPercentage(opt.kontakDefault);
            }}
            className={`cursor-pointer rounded-2xl border-2 p-5 transition-all shadow-card ${
              selectedOption === opt.id
                ? 'border-brand-blue bg-brand-blue-50/40 ring-2 ring-brand-blue/20'
                : 'border-line bg-surface hover:border-brand-blue/40'
            }`}
          >
            <div className="flex items-center justify-between text-xs font-bold text-ink-muted mb-2">
              <span>SKENARIO INTERVENSI</span>
              <span className={`px-2 py-0.5 rounded-full text-[10px] ${
                selectedOption === opt.id ? 'bg-brand-blue text-white' : 'bg-surface-2 text-ink-muted'
              }`}>
                {opt.kontakDefault}% Reduksi
              </span>
            </div>
            <h3 className="font-display text-base font-bold text-ink mb-3 leading-snug">{opt.nama}</h3>
            <div className="space-y-2 text-xs border-t border-line/60 pt-3">
              <div className="flex justify-between">
                <span className="text-ink-muted">Pergeseran Puncak:</span>
                <span className="font-mono font-bold text-brand-blue">{opt.pergeseranPuncak}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-ink-muted">Tinggi Puncak:</span>
                <span className="font-mono font-bold text-status-aman">{opt.penurunanPuncak}</span>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Detailed Impact Breakdown */}
      <GradientCard hoverEffect={false}>
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-line">
          <div>
            <h3 className="font-display text-lg font-bold text-ink">
              Dampak Terpilih: {currentOpt.nama}
            </h3>
            <p className="text-xs text-ink-muted">
              Estimasi penghematan beban fasilitas kesehatan di seluruh aglomerasi Jabodetabek
            </p>
          </div>
          <div className="flex items-center gap-2 text-xs font-mono">
            <span className="text-ink-muted">Reduksi Kontak:</span>
            <input
              type="range"
              min="5"
              max="60"
              value={reductionPercentage}
              onChange={(e) => setReductionPercentage(Number(e.target.value))}
              className="accent-brand-blue"
            />
            <span className="font-bold text-brand-blue w-10 text-right">{reductionPercentage}%</span>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 my-6">
          <div className="p-4 rounded-xl bg-surface-2 border border-line">
            <span className="text-xs text-ink-muted">Penundaan Puncak Kasus</span>
            <div className="font-mono text-2xl font-bold text-brand-blue mt-1">
              {currentOpt.pergeseranPuncak}
            </div>
            <p className="text-[11px] text-ink-muted mt-1">Waktu tambahan faskes bersiap</p>
          </div>
          <div className="p-4 rounded-xl bg-surface-2 border border-line">
            <span className="text-xs text-ink-muted">Penurunan Beban Puncak</span>
            <div className="font-mono text-2xl font-bold text-status-aman mt-1">
              {currentOpt.penurunanPuncak}
            </div>
            <p className="text-[11px] text-ink-muted mt-1">Keterisian RS lebih terkendali</p>
          </div>
          <div className="p-4 rounded-xl bg-surface-2 border border-line">
            <span className="text-xs text-ink-muted">Hari-Pasien Terlindungi</span>
            <div className="font-mono text-2xl font-bold text-brand-pink mt-1">
              {currentOpt.penghematanHariTempatTidur}
            </div>
            <p className="text-[11px] text-ink-muted mt-1">Σ max(0, Kebutuhan − Kapasitas)</p>
          </div>
        </div>

        {/* Socioeconomic Notes Box */}
        <div className="rounded-xl border border-line bg-surface p-4 text-xs space-y-2">
          <h4 className="font-bold text-ink flex items-center gap-1.5">
            <Users className="h-4 w-4 text-brand-blue" />
            Catatan Dampak Sosial-Ekonomi & Keadilan Wilayah:
          </h4>
          <p className="text-ink-muted leading-relaxed">
            {currentOpt.catatanSosial}
          </p>
        </div>

        <div className="mt-4 flex items-center gap-2 rounded-xl bg-surface-2 p-3 text-xs text-ink-muted border border-line">
          <AlertCircle className="h-4 w-4 text-brand-blue shrink-0" />
          <span>
            <strong className="text-ink">Pemberitahuan Wajib:</strong> RIAK menampilkan kalkulasi dan dampak intervensi; keputusan akhir dan wewenang pembatasan sepenuhnya berada di tangan pejabat berwenang.
          </span>
        </div>
      </GradientCard>
    </div>
  );
};

