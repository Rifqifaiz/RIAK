import React, { useEffect, useRef, useState, forwardRef, useImperativeHandle } from 'react';
import * as THREE from 'three';
import { ZoomIn, RotateCcw, ShieldCheck } from 'lucide-react';

export interface GlobeHotspot {
  id: string;
  label: string;
  sub: string;
  desc: string;
  lat: number;
  lon: number;
  color: number;
  isTarget?: boolean;
}

export interface InteractiveGlobeHandle {
  dive: () => void;
  reset: () => void;
}

interface InteractiveGlobeProps {
  onFocusRegion?: () => void;
  deferBuild?: boolean;
  onUnavailable?: () => void;
  onContextLost?: () => void;
  onDiveStart?: () => void;
  onDiveComplete?: () => void;
  onSelectHotspot?: (h: GlobeHotspot | null) => void;
  paused?: boolean;
}

export const InteractiveGlobe = forwardRef<InteractiveGlobeHandle, InteractiveGlobeProps>(({ onFocusRegion }, ref) => {
  const mountRef = useRef<HTMLDivElement | null>(null);
  const [isZoomed, setIsZoomed] = useState<boolean>(false);
  const isZoomedRef = useRef<boolean>(false);

  useImperativeHandle(ref, () => ({
    dive: () => {
      setIsZoomed(true);
      isZoomedRef.current = true;
    },
    reset: () => {
      setIsZoomed(false);
      isZoomedRef.current = false;
    },
  }));

  useEffect(() => {
    const mount = mountRef.current;
    if (!mount) return;

    const width = mount.clientWidth || 600;
    const height = mount.clientHeight || 500;

    // 1. Scene, Camera, Renderer
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 1000);
    camera.position.z = 240;

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    mount.appendChild(renderer.domElement);

    // 2. Globe Group
    const globeGroup = new THREE.Group();
    scene.add(globeGroup);

    // Main Sphere
    const globeRadius = 75;
    const sphereGeo = new THREE.SphereGeometry(globeRadius, 48, 48);
    const sphereMat = new THREE.MeshPhongMaterial({
      color: 0x0c152e,
      emissive: 0x060b18,
      specular: 0x1e3a8a,
      shininess: 25,
      transparent: true,
      opacity: 0.95,
    });
    const globeMesh = new THREE.Mesh(sphereGeo, sphereMat);
    globeGroup.add(globeMesh);

    // Atmosphere Glow
    const atmosGeo = new THREE.SphereGeometry(globeRadius * 1.08, 48, 48);
    const atmosMat = new THREE.MeshBasicMaterial({
      color: 0x00f2fe,
      transparent: true,
      opacity: 0.15,
      side: THREE.BackSide,
    });
    const atmosMesh = new THREE.Mesh(atmosGeo, atmosMat);
    globeGroup.add(atmosMesh);

    // Outer Glow Ring
    const outerGlowGeo = new THREE.SphereGeometry(globeRadius * 1.15, 32, 32);
    const outerGlowMat = new THREE.MeshBasicMaterial({
      color: 0xbe185d,
      transparent: true,
      opacity: 0.08,
      side: THREE.BackSide,
    });
    globeGroup.add(new THREE.Mesh(outerGlowGeo, outerGlowMat));

    // Lat/Long Wireframe Rings
    const wireGeo = new THREE.SphereGeometry(globeRadius * 1.002, 24, 16);
    const wireMat = new THREE.MeshBasicMaterial({
      color: 0x1e3a8a,
      wireframe: true,
      transparent: true,
      opacity: 0.25,
    });
    globeGroup.add(new THREE.Mesh(wireGeo, wireMat));

    // Coordinates conversion
    function latLonToVector3(lat: number, lon: number, radius: number): THREE.Vector3 {
      const phi = (90 - lat) * (Math.PI / 180);
      const theta = (lon + 180) * (Math.PI / 180);
      const x = -(radius * Math.sin(phi) * Math.cos(theta));
      const z = radius * Math.sin(phi) * Math.sin(theta);
      const y = radius * Math.cos(phi);
      return new THREE.Vector3(x, y, z);
    }

    // World Land Points Generator
    const dotCount = 1800;
    const dotGeo = new THREE.BufferGeometry();
    const dotPositions: number[] = [];
    const dotColors: number[] = [];

    for (let i = 0; i < dotCount; i++) {
      const lat = (Math.random() - 0.5) * 150;
      const lon = (Math.random() - 0.5) * 360;
      const pos = latLonToVector3(lat, lon, globeRadius + 0.5);
      dotPositions.push(pos.x, pos.y, pos.z);

      // Cyan to blue dots
      const isAsia = lat > -15 && lat < 45 && lon > 90 && lon < 145;
      if (isAsia) {
        dotColors.push(0, 0.95, 1); // bright cyan
      } else {
        dotColors.push(0.12, 0.23, 0.54); // brand blue
      }
    }
    dotGeo.setAttribute('position', new THREE.Float32BufferAttribute(dotPositions, 3));
    dotGeo.setAttribute('color', new THREE.Float32BufferAttribute(dotColors, 3));

    const dotMat = new THREE.PointsMaterial({
      size: 1.8,
      vertexColors: true,
      transparent: true,
      opacity: 0.75,
    });
    globeGroup.add(new THREE.Points(dotGeo, dotMat));

    // Outbreak Hotspot Signals
    const hotspots = [
      { name: 'India (Episentrum Delta 2021)', lat: 20.59, lon: 78.96, severity: 'Tinggi', color: 0xff3366 },
      { name: 'Inggris / Eropa (Alpha/Delta)', lat: 51.5, lon: -0.12, severity: 'Sedang', color: 0xffaa00 },
      { name: 'Afrika Selatan (Beta)', lat: -30.55, lon: 22.93, severity: 'Tinggi', color: 0xff3366 },
      { name: 'DKI Jakarta & Jabodetabek (Target)', lat: -6.2, lon: 106.8, severity: 'Siaga Radar', color: 0x00f2fe },
    ];

    const beaconGroup = new THREE.Group();
    globeGroup.add(beaconGroup);

    hotspots.forEach((h) => {
      const pos = latLonToVector3(h.lat, h.lon, globeRadius + 1);

      // Core Marker
      const pinGeo = new THREE.SphereGeometry(h.name.includes('Jakarta') ? 2.8 : 1.8, 16, 16);
      const pinMat = new THREE.MeshBasicMaterial({ color: h.color });
      const pinMesh = new THREE.Mesh(pinGeo, pinMat);
      pinMesh.position.copy(pos);
      beaconGroup.add(pinMesh);

      // Pulsing Ring for Jakarta
      if (h.name.includes('Jakarta')) {
        const ringGeo = new THREE.RingGeometry(2.5, 4.5, 32);
        const ringMat = new THREE.MeshBasicMaterial({
          color: 0x00f2fe,
          side: THREE.DoubleSide,
          transparent: true,
          opacity: 0.9,
        });
        const ringMesh = new THREE.Mesh(ringGeo, ringMat);
        ringMesh.position.copy(pos.clone().multiplyScalar(1.02));
        ringMesh.lookAt(new THREE.Vector3(0, 0, 0));
        beaconGroup.add(ringMesh);
      }
    });

    // Transmission Arcs into Jakarta
    const jakartaPos = latLonToVector3(-6.2, 106.8, globeRadius);
    const origins = [
      latLonToVector3(20.59, 78.96, globeRadius),
      latLonToVector3(51.5, -0.12, globeRadius),
      latLonToVector3(-30.55, 22.93, globeRadius),
    ];

    origins.forEach((orig) => {
      const mid = orig.clone().add(jakartaPos).multiplyScalar(0.5);
      mid.normalize().multiplyScalar(globeRadius * 1.35); // arc height

      const curve = new THREE.QuadraticBezierCurve3(orig, mid, jakartaPos);
      const points = curve.getPoints(50);
      const arcGeo = new THREE.BufferGeometry().setFromPoints(points);
      const arcMat = new THREE.LineBasicMaterial({
        color: 0xbe185d,
        transparent: true,
        opacity: 0.65,
      });
      globeGroup.add(new THREE.Line(arcGeo, arcMat));
    });

    // Lighting
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.7);
    scene.add(ambientLight);

    const dirLight = new THREE.DirectionalLight(0x00f2fe, 1.2);
    dirLight.position.set(150, 100, 150);
    scene.add(dirLight);

    const pinkLight = new THREE.PointLight(0xbe185d, 2.5, 300);
    pinkLight.position.set(-120, -50, 80);
    scene.add(pinkLight);

    // Initial orientation: aim towards Southeast Asia / Indonesia
    globeGroup.rotation.y = -2.2;
    globeGroup.rotation.x = 0.2;

    // Interaction / Drag Controls
    let isDragging = false;
    let prevMouseX = 0;
    let prevMouseY = 0;

    const onPointerDown = (e: MouseEvent | TouchEvent) => {
      isDragging = true;
      const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
      const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;
      prevMouseX = clientX;
      prevMouseY = clientY;
    };

    const onPointerMove = (e: MouseEvent | TouchEvent) => {
      if (!isDragging) return;
      const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
      const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;

      const deltaX = clientX - prevMouseX;
      const deltaY = clientY - prevMouseY;

      globeGroup.rotation.y += deltaX * 0.006;
      globeGroup.rotation.x += deltaY * 0.006;

      prevMouseX = clientX;
      prevMouseY = clientY;
    };

    const onPointerUp = () => {
      isDragging = false;
    };

    const domElem = renderer.domElement;
    domElem.addEventListener('mousedown', onPointerDown);
    window.addEventListener('mousemove', onPointerMove);
    window.addEventListener('mouseup', onPointerUp);
    domElem.addEventListener('touchstart', onPointerDown);
    window.addEventListener('touchmove', onPointerMove);
    window.addEventListener('touchend', onPointerUp);

    // Animation Loop
    let animId: number;
    let targetCameraZ = 240;
    let targetRotY = -2.2;
    let targetRotX = 0.15;

    const animate = () => {
      animId = requestAnimationFrame(animate);

      if (isZoomedRef.current) {
        // Zoomed in targeting Indonesia
        targetCameraZ = 125;
        targetRotY = -2.4;
        targetRotX = 0.12;

        globeGroup.rotation.y += (targetRotY - globeGroup.rotation.y) * 0.05;
        globeGroup.rotation.x += (targetRotX - globeGroup.rotation.x) * 0.05;
      } else {
        // Normal rotating globe
        targetCameraZ = 240;
        if (!isDragging) {
          globeGroup.rotation.y += 0.0025; // idle spin
        }
      }

      // Smooth camera lerp
      camera.position.z += (targetCameraZ - camera.position.z) * 0.06;

      renderer.render(scene, camera);
    };
    animate();

    // Window resize
    const onResize = () => {
      if (!mount) return;
      const newW = mount.clientWidth;
      const newH = mount.clientHeight;
      camera.aspect = newW / newH;
      camera.updateProjectionMatrix();
      renderer.setSize(newW, newH);
    };
    window.addEventListener('resize', onResize);

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener('resize', onResize);
      window.removeEventListener('mousemove', onPointerMove);
      window.removeEventListener('mouseup', onPointerUp);
      window.removeEventListener('touchmove', onPointerMove);
      window.removeEventListener('touchend', onPointerUp);
      if (mount && domElem) {
        mount.removeChild(domElem);
      }
      renderer.dispose();
    };
  }, []);

  const toggleZoom = () => {
    const nextState = !isZoomed;
    setIsZoomed(nextState);
    isZoomedRef.current = nextState;
    if (nextState && onFocusRegion) {
      onFocusRegion();
    }
  };

  return (
    <div className="relative w-full h-[460px] md:h-[540px] rounded-3xl bg-gradient-to-b from-[#090D1A] via-[#0E1528] to-[#080B14] border border-cyan-500/20 overflow-hidden shadow-[0_12px_48px_rgba(0,0,0,0.5)]">
      {/* Three.js Canvas Container */}
      <div
        ref={mountRef}
        onClick={toggleZoom}
        className="h-full w-full cursor-grab active:cursor-grabbing"
      />

      {/* Floating Header UI */}
      <div className="pointer-events-none absolute top-5 left-5 right-5 flex items-start justify-between">
        <div className="rounded-2xl border border-white/15 bg-black/40 backdrop-blur-md p-3.5 shadow-lg">
          <div className="flex items-center gap-2">
            <span className="h-2.5 w-2.5 rounded-full bg-cyan-400 animate-ping" />
            <span className="font-display text-xs font-bold uppercase tracking-wider text-cyan-300">
              RADAR GLOBAL 3D
            </span>
          </div>
          <h3 className="font-display text-lg font-bold text-white mt-0.5">
            Jalur Transmisi Wabah Luar Negeri
          </h3>
          <p className="text-[11px] text-white/70 max-w-xs mt-0.5">
            Geser globe untuk rotasi 360°, atau klik untuk zoom ke episentrum Indonesia.
          </p>
        </div>

        {/* Zoom Controls */}
        <div className="pointer-events-auto flex items-center gap-2">
          <button
            onClick={toggleZoom}
            className={`inline-flex items-center gap-2 rounded-xl px-4 py-2.5 text-xs font-bold transition-all backdrop-blur-md shadow-lg ${
              isZoomed
                ? 'bg-pink-600 text-white shadow-[0_0_20px_rgba(190,24,93,0.4)]'
                : 'bg-cyan-500/20 border border-cyan-400/40 text-cyan-200 hover:bg-cyan-500/30'
            }`}
          >
            {isZoomed ? (
              <>
                <RotateCcw className="h-3.5 w-3.5" />
                <span>Reset Tampilan Global</span>
              </>
            ) : (
              <>
                <ZoomIn className="h-3.5 w-3.5 text-cyan-300" />
                <span>Tekan untuk Zoom ke Indonesia</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Zoom In Focus Card (Bottom Left) */}
      {isZoomed && (
        <div className="absolute bottom-5 left-5 right-5 md:right-auto md:max-w-md rounded-2xl border border-cyan-400/40 bg-[#0A1022]/90 backdrop-blur-xl p-4 shadow-[0_0_30px_rgba(0,242,254,0.25)] animate-in fade-in slide-in-from-bottom-4 duration-300">
          <div className="flex items-center justify-between border-b border-white/10 pb-2 mb-2">
            <span className="flex items-center gap-1.5 text-xs font-bold text-cyan-300">
              <ShieldCheck className="h-4 w-4 text-cyan-400" />
              FOKUS: EPISENTRUM JABODETABEK
            </span>
            <span className="rounded-full bg-cyan-950 px-2 py-0.5 text-[10px] font-mono font-bold text-cyan-300 border border-cyan-800">
              SIAGA AKTIF
            </span>
          </div>
          <p className="text-xs text-white/90 leading-relaxed">
            Pintu masuk utama: <strong className="text-cyan-300">Bandara Soekarno-Hatta (Tangerang)</strong>. Terhubung dengan mobilitas 13 kabupaten/kota dan 461 fasilitas kesehatan rujukan.
          </p>
          <div className="mt-3 flex items-center justify-between text-[11px] font-mono text-white/70 pt-2 border-t border-white/10">
            <span>Koordinat: -6.2° S, 106.8° E</span>
            <span className="text-cyan-400 font-bold">13 Wilayah Aglomerasi</span>
          </div>
        </div>
      )}

      {/* Legend & Instructions (Bottom Right) */}
      <div className="pointer-events-none absolute bottom-4 right-5 hidden md:flex items-center gap-4 rounded-xl bg-black/50 backdrop-blur-md px-3.5 py-2 text-[11px] text-white/70 border border-white/10">
        <div className="flex items-center gap-1.5">
          <span className="h-2 w-2 rounded-full bg-pink-500" />
          <span>Sinyal Global</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="h-2 w-2 rounded-full bg-cyan-400" />
          <span>Episentrum RI</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="h-0.5 w-4 bg-pink-500" />
          <span>Alur Impor</span>
        </div>
      </div>
    </div>
  );
});
