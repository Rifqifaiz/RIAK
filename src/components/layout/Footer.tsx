import React from 'react';
import { Link } from 'react-router-dom';
import { Logo } from '../common/CommonUi';

export const Footer: React.FC = () => {
  return (
    <footer className="mt-20 border-t border-line bg-surface py-12 text-ink-muted">
      <div className="mx-auto max-w-[1200px] px-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
          <div className="md:col-span-2">
            <h3 className="mb-3"><Logo size="md" tagline={false} /><span className="sr-only">RIAK</span></h3>
            <p className="text-xs text-ink-muted leading-relaxed max-w-md">
              Radar Indikasi Awal Kedaruratan — Sistem pendukung keputusan yang menghitung Batas Waktu Bertindak (BWB) setiap fasilitas kesehatan, sejak wabah masih di luar negeri.
            </p>
            <div className="mt-4 text-xs font-medium text-ink">
              The 10th Open Innovation 2026 · IMERI FKUI
            </div>
            <p className="text-[11px] text-ink-muted/80 mt-1">
              Prototipe, bukan sistem resmi pemerintah. RIAK memberi tenggat, opsi, dan dampak; keputusan ada pada pejabat berwenang.
            </p>
          </div>

          <div>
            <h4 className="text-xs font-bold text-ink uppercase tracking-wider mb-3">Tim Pengembang</h4>
            <ul className="space-y-1 text-xs">
              <li><span className="font-semibold text-ink">Mohammad Rifqi Faiz</span> — Fakultas Farmasi (Ketua)</li>
              <li><span className="font-semibold text-ink">Kelvin Ricardo</span> — Fakultas Farmasi</li>
              <li><span className="font-semibold text-ink">Alfie Vere Likhie</span> — Fakultas Kedokteran</li>
              <li><span className="font-semibold text-ink">Yuda Ardianysah</span> — Fakultas Ekonomi & Bisnis</li>
              <li><span className="font-semibold text-ink">Harman Hakim</span> — Fakultas Ilmu Komputer</li>
            </ul>
            <p className="text-[11px] text-ink-muted/80 mt-2">Universitas Indonesia</p>
          </div>

          <div>
            <h4 className="text-xs font-bold text-ink uppercase tracking-wider mb-3">Tautan & Sumber Data</h4>
            <ul className="space-y-1.5 text-xs">
              <li>
                <Link to="/studi-kasus-2021" className="hover:text-brand-blue">
                  Studi Kasus Delta 2021
                </Link>
              </li>
              <li>
                <Link to="/metodologi" className="hover:text-brand-blue">
                  Metodologi & Parameter
                </Link>
              </li>
              <li>
                <Link to="/tentang" className="hover:text-brand-blue">
                  Prinsip Etika & Regulasi
                </Link>
              </li>
              <li className="pt-2 text-[11px] text-ink-muted/80">
                Data RS & Kasus 2021: INACOVID (lisensi MIT), bersumber data resmi Kemenkes RI, SIRANAP, BPS.
              </li>
            </ul>
          </div>
        </div>

        <div className="border-t border-line pt-6 flex flex-col md:flex-row items-center justify-between text-xs text-ink-muted/70 gap-2">
          <div>© 2026 Tim RIAK — Universitas Indonesia. Dilindungi lisensi riset akademik.</div>
          <div>Bukan pengganti sistem peringatan dini resmi Kementerian Kesehatan RI.</div>
        </div>
      </div>
    </footer>
  );
};

