import React, { useState } from 'react';
import { HashRouter, Routes, Route } from 'react-router-dom';
import { Navbar } from './components/layout/Navbar';
import { Banner } from './components/layout/Banner';
import { Footer } from './components/layout/Footer';

import { WaterDropSplash } from './components/interactive/WaterDropSplash';
import { InteractiveBackground } from './components/interactive/InteractiveBackground';
import { useAuth } from './components/common/auth';

import { Login } from './pages/Login';
import { Beranda } from './pages/Beranda';
import { Respons } from './pages/Respons';
import { StudiKasus } from './pages/StudiKasus';
import { Radar } from './pages/Radar';
import { PetaRiak } from './pages/PetaRiak';
import { Simulator } from './pages/Simulator';
import { Latihan } from './pages/Latihan';
import { Metodologi } from './pages/Metodologi';
import { Tentang } from './pages/Tentang';

type Splash = null | 'login' | 'replay';

export const App: React.FC = () => {
  const user = useAuth((s) => s.user);
  const [currentScenario, setCurrentScenario] = useState<string>('covid-delta');
  const [simulationDate, setSimulationDate] = useState<string>('2021-06-10');
  const [splash, setSplash] = useState<Splash>(null);
  // Setelah login, isi aplikasi baru dipasang saat animasi riak mulai memudar,
  // supaya tetes air & riak tidak tersendat oleh pemuatan halaman (globe, peta, dll.).
  const [holdContent, setHoldContent] = useState(false);

  // 1. Belum masuk → halaman login di depan
  if (!user) {
    return (
      <>
        <InteractiveBackground />
        <Login
          onSuccess={() => {
            setHoldContent(true);
            setSplash('login');
          }}
        />
      </>
    );
  }

  return (
    <HashRouter>
      {/* 2. Animasi tetes air riak setelah login (atau diputar ulang dari Beranda) */}
      {splash && (
        <WaterDropSplash
          greeting={splash === 'login' ? `Selamat datang, ${user.nama}` : undefined}
          autoCloseMs={splash === 'login' ? 2200 : undefined}
          onLeaving={() => setHoldContent(false)}
          onComplete={() => {
            setHoldContent(false);
            setSplash(null);
          }}
        />
      )}

      <InteractiveBackground />

      {!holdContent && (
      <div className="relative z-10 flex min-h-screen flex-col bg-transparent text-ink selection:bg-brand-pink-50 selection:text-brand-pink font-body">
        <Navbar
          currentScenario={currentScenario}
          onScenarioChange={setCurrentScenario}
          simulationDate={simulationDate}
          onDateChange={setSimulationDate}
        />
        <Banner />

        <main className="flex-1">
          <Routes>
            <Route path="/" element={<Beranda onReplaySplash={() => setSplash('replay')} introPlaying={splash !== null} />} />
            <Route path="/respons" element={<Respons />} />
            <Route path="/studi-kasus-2021" element={<StudiKasus />} />
            <Route path="/radar" element={<Radar />} />
            <Route path="/peta" element={<PetaRiak />} />
            <Route path="/simulator" element={<Simulator />} />
            <Route path="/latihan" element={<Latihan />} />
            <Route path="/metodologi" element={<Metodologi />} />
            <Route path="/tentang" element={<Tentang />} />
          </Routes>
        </main>

        <Footer />
      </div>
      )}
    </HashRouter>
  );
};
