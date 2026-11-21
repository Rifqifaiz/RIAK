import React from 'react';
import { SectionTag, GradientCard } from '../components/common/CommonUi';
import { Shield, Users, Award, BookCheck, FileText } from 'lucide-react';

export const Tentang: React.FC = () => {
  return (
    <div className="mx-auto max-w-[1200px] px-4 py-8 space-y-8">
      {/* Header */}
      <div>
        <SectionTag>PROFIL & ETIKA RISET</SectionTag>
        <h1 className="mt-2 font-display text-3xl md:text-4xl font-extrabold text-ink tracking-tight">
          Tentang RIAK & Tim Pengembang
        </h1>
        <p className="mt-2 text-sm text-ink-muted max-w-3xl leading-relaxed">
          Karya inovasi kesiapsiagaan pandemi untuk The 10th Open Innovation 2026, IMERI Fakultas Kedokteran Universitas Indonesia.
        </p>
        <div className="mt-4 h-0.5 w-full bg-brand-gradient rounded-full" />
      </div>

      {/* Team Members Grid */}
      <GradientCard hoverEffect={false}>
        <div className="flex items-center gap-2 mb-4 text-brand-blue font-bold text-sm">
          <Users className="h-4 w-4" />
          <h3>Tim Multidisiplin Universitas Indonesia</h3>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
          <div className="p-4 rounded-xl bg-surface-2 border border-line">
            <span className="text-[10px] font-bold text-brand-pink uppercase">Ketua Tim</span>
            <h4 className="font-display font-bold text-sm text-ink mt-0.5">Mohammad Rifqi Faiz</h4>
            <p className="text-xs text-ink-muted mt-1">Fakultas Farmasi</p>
            <p className="text-[11px] text-ink-muted/80 mt-2">Logistik farmasi, model BWB, arsitektur sistem.</p>
          </div>

          <div className="p-4 rounded-xl bg-surface-2 border border-line">
            <span className="text-[10px] font-bold text-brand-blue uppercase">Anggota</span>
            <h4 className="font-display font-bold text-sm text-ink mt-0.5">Kelvin Ricardo</h4>
            <p className="text-xs text-ink-muted mt-1">Fakultas Farmasi</p>
            <p className="text-[11px] text-ink-muted/80 mt-2">Kajian rantai pasok obat dan waktu tunggu pengadaan.</p>
          </div>

          <div className="p-4 rounded-xl bg-surface-2 border border-line">
            <span className="text-[10px] font-bold text-brand-blue uppercase">Anggota</span>
            <h4 className="font-display font-bold text-sm text-ink mt-0.5">Alfie Vere Likhie</h4>
            <p className="text-xs text-ink-muted mt-1">Fakultas Kedokteran</p>
            <p className="text-[11px] text-ink-muted/80 mt-2">Validasi klinis, parameter patogen, kebutuhan isolasi & ICU.</p>
          </div>

          <div className="p-4 rounded-xl bg-surface-2 border border-line">
            <span className="text-[10px] font-bold text-brand-blue uppercase">Anggota</span>
            <h4 className="font-display font-bold text-sm text-ink mt-0.5">Yuda Ardianysah</h4>
            <p className="text-xs text-ink-muted mt-1">Fakultas Ekonomi & Bisnis</p>
            <p className="text-[11px] text-ink-muted/80 mt-2">Analisis dampak sosial-ekonomi intervensi dan pembiayaan.</p>
          </div>

          <div className="p-4 rounded-xl bg-surface-2 border border-line">
            <span className="text-[10px] font-bold text-brand-blue uppercase">Anggota</span>
            <h4 className="font-display font-bold text-sm text-ink mt-0.5">Harman Hakim</h4>
            <p className="text-xs text-ink-muted mt-1">Fakultas Ilmu Komputer</p>
            <p className="text-[11px] text-ink-muted/80 mt-2">Pemrosesan data BPS/INACOVID, komputasi model, dan deployment.</p>
          </div>
        </div>
      </GradientCard>

      {/* Ethical Framework & Claims (SPEC §11) */}
      <GradientCard hoverEffect={false}>
        <div className="flex items-center gap-2 mb-3 text-status-aman font-bold text-sm">
          <Shield className="h-4 w-4" />
          <h3>Etika, Batasan Klaim, & Kebaruan yang Jujur</h3>
        </div>

        <div className="space-y-4 text-xs text-ink leading-relaxed">
          <div className="p-3.5 rounded-xl bg-surface-2 border border-line">
            <h4 className="font-bold text-ink mb-1">Klaim Kebaruan:</h4>
            <p className="text-ink-muted">
              "Dalam penelusuran tim, belum ditemukan sistem yang menyambungkan sinyal wabah luar negeri, penyebaran antarwilayah, dan kapasitas tiap fasilitas kesehatan menjadi tenggat keputusan yang terkuantifikasi. Preseden tenggat berbasis waktu tunggu ada di tingkat satu rumah sakit tunggal; RIAK membawanya ke lintas wilayah dan memulainya sejak fase luar negeri."
            </p>
          </div>

          <div className="p-3.5 rounded-xl bg-surface-2 border border-line">
            <h4 className="font-bold text-ink mb-1">Jalur Dampak & Nyawa Manusia:</h4>
            <p className="text-ink-muted">
              "Persiapan tepat waktu → tempat tidur, oksigen, dan tenaga kesehatan tersedia saat lonjakan tiba → pasien tidak terlambat mendapatkan penanganan darurat → kematian yang dapat dicegah berkurang. Kami tidak mengklaim jumlah nyawa yang diselamatkan; yang diukur secara objektif adalah ketepatan waktu dimulainya persiapan."
            </p>
          </div>

          <div className="p-3.5 rounded-xl bg-surface-2 border border-line">
            <h4 className="font-bold text-ink mb-1">Kepatuhan Privasi:</h4>
            <p className="text-ink-muted">
              Sistem ini murni menggunakan data agregat dan bersifat statis di sisi klien tanpa pengumpulan data pribadi pasien, pelacak lokasi pengguna, atau cookie pihak ketiga. Sesuai prinsip UU No. 27 Tahun 2022 tentang Pelindungan Data Pribadi.
            </p>
          </div>
        </div>
      </GradientCard>

      {/* Regulatory Alignment */}
      <GradientCard hoverEffect={false}>
        <div className="flex items-center gap-2 mb-3 text-brand-blue font-bold text-sm">
          <BookCheck className="h-4 w-4" />
          <h3>Dukungan Terhadap Regulasi Nasional</h3>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
          <div className="p-3 rounded-xl bg-surface-2 border border-line">
            <span className="font-bold text-ink block">UU No. 17 Tahun 2023 tentang Kesehatan</span>
            <span className="text-ink-muted">Mendukung penguatan sistem kesiapsiagaan dan ketahanan kesehatan nasional menghadapi kedaruratan kesehatan masyarakat.</span>
          </div>
          <div className="p-3 rounded-xl bg-surface-2 border border-line">
            <span className="font-bold text-ink block">Permenkes No. 1 Tahun 2026</span>
            <span className="text-ink-muted">Mendukung protokol penanggulangan Kejadian Luar Biasa (KLB), Wabah, dan Krisis Kesehatan dengan pedoman aksi cepat berbasis tenggat.</span>
          </div>
        </div>
      </GradientCard>
    </div>
  );
};

