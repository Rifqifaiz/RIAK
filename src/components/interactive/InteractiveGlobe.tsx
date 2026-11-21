import React, { forwardRef, useEffect, useImperativeHandle, useRef, useState } from 'react';
import * as THREE from 'three';
import { geoEquirectangular, geoPath } from 'd3-geo';
import { feature, mesh } from 'topojson-client';
import { Loader2 } from 'lucide-react';

/** Titik acuan historis yang tampil di globe (bukan umpan wabah langsung). */
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

export const GLOBE_HOTSPOTS: GlobeHotspot[] = [
  {
    id: 'india',
    label: 'India',
    sub: 'Varian Delta (B.1.617.2)',
    desc: 'Acuan historis: varian Delta pertama teridentifikasi di India akhir 2020, lalu memicu gelombang Jabodetabek Juni–Juli 2021.',
    lat: 20.59,
    lon: 78.96,
    color: 0xff4d7d,
  },
  {
    id: 'inggris',
    label: 'Inggris',
    sub: 'Varian Alpha (B.1.1.7)',
    desc: 'Acuan historis: varian Alpha teridentifikasi di Inggris pada akhir 2020 dan menyebar lewat jalur penerbangan internasional.',
    lat: 51.5,
    lon: -0.12,
    color: 0xffb020,
  },
  {
    id: 'afsel',
    label: 'Afrika Selatan',
    sub: 'Varian Beta (B.1.351)',
    desc: 'Acuan historis: varian Beta teridentifikasi di Afrika Selatan pada akhir 2020.',
    lat: -30.55,
    lon: 22.93,
    color: 0xff4d7d,
  },
  {
    id: 'jakarta',
    label: 'Jabodetabek',
    sub: 'Wilayah pantau RIAK',
    desc: '13 kab/kota, 461 RS. Pintu masuk utama: Bandara Soekarno-Hatta. Klik untuk masuk ke peta wilayah.',
    lat: -6.2,
    lon: 106.8,
    color: 0x22e5ff,
    isTarget: true,
  },
];

export interface InteractiveGlobeHandle {
  /** Putar ke Jakarta, zoom masuk, lalu panggil onDiveComplete. */
  dive: () => void;
  /** Kembali dari posisi dekat ke tampilan global. */
  reset: () => void;
}

interface InteractiveGlobeProps {
  onDiveStart?: () => void;
  onDiveComplete?: () => void;
  onSelectHotspot?: (h: GlobeHotspot | null) => void;
  paused?: boolean;
}

const R = 75;
const CAM_FAR = 240;
const CAM_FOCUS = 205;
const CAM_DIVE = 96;
const INDONESIA_ID = '360';

function latLonToVector3(lat: number, lon: number, radius: number): THREE.Vector3 {
  const phi = (90 - lat) * (Math.PI / 180);
  const theta = (lon + 180) * (Math.PI / 180);
  return new THREE.Vector3(
    -(radius * Math.sin(phi) * Math.cos(theta)),
    radius * Math.cos(phi),
    radius * Math.sin(phi) * Math.sin(theta)
  );
}

/** Rotasi grup globe agar titik lat/lon menghadap kamera (+z). */
function rotationFor(lat: number, lon: number) {
  const v = latLonToVector3(lat, lon, 1);
  return { y: -Math.atan2(v.x, v.z), x: (lat * Math.PI) / 180 };
}

/** Sudut target terdekat dari sudut saat ini (hindari putaran memutar penuh). */
function nearestAngle(current: number, target: number) {
  const twoPi = Math.PI * 2;
  let d = (target - current) % twoPi;
  if (d > Math.PI) d -= twoPi;
  if (d < -Math.PI) d += twoPi;
  return current + d;
}

/** Jarak kamera agar globe muat juga di layar sempit (potret). */
const farFor = (aspect: number) => Math.max(CAM_FAR, 100 / (Math.tan((22.5 * Math.PI) / 180) * aspect));

const easeInOut = (t: number) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);

export const InteractiveGlobe = forwardRef<InteractiveGlobeHandle, InteractiveGlobeProps>(
  ({ onDiveStart, onDiveComplete, onSelectHotspot, paused = false }, ref) => {
    const mountRef = useRef<HTMLDivElement | null>(null);
    const tooltipRef = useRef<HTMLDivElement | null>(null);
    const [ready, setReady] = useState(false);
    const apiRef = useRef<InteractiveGlobeHandle>({ dive: () => {}, reset: () => {} });
    const pausedRef = useRef(paused);
    const cbRef = useRef({ onDiveStart, onDiveComplete, onSelectHotspot });

    pausedRef.current = paused;
    cbRef.current = { onDiveStart, onDiveComplete, onSelectHotspot };

    useImperativeHandle(ref, () => ({
      dive: () => apiRef.current.dive(),
      reset: () => apiRef.current.reset(),
    }));

    useEffect(() => {
      const mount = mountRef.current;
      if (!mount) return;
      let disposed = false;
      let animId = 0;
      const cleanups: Array<() => void> = [];
      const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

      const width = mount.clientWidth || 800;
      const height = mount.clientHeight || 540;

      const scene = new THREE.Scene();
      const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 1000);
      let camFar = farFor(width / height);
      camera.position.z = camFar;

      const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
      renderer.setSize(width, height);
      renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
      mount.appendChild(renderer.domElement);
      renderer.domElement.style.touchAction = 'pan-y';

      const globe = new THREE.Group();
      scene.add(globe);

      const start = rotationFor(-2.5, 112);
      globe.rotation.set(start.x * 0.6, start.y, 0);

      // ---------- Atmosfer ----------
      const atmos = new THREE.Mesh(
        new THREE.SphereGeometry(R * 1.12, 48, 48),
        new THREE.ShaderMaterial({
          transparent: true,
          side: THREE.BackSide,
          depthWrite: false,
          vertexShader: `varying vec3 vN; void main(){ vN = normalize(normalMatrix * normal); gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0); }`,
          fragmentShader: `varying vec3 vN; void main(){ float i = pow(0.72 - dot(vN, vec3(0.0,0.0,1.0)), 3.0); gl_FragColor = vec4(0.25,0.75,1.0,1.0) * i * 1.6; }`,
        })
      );
      scene.add(atmos);

      // ---------- Data peta dunia (dimuat terpisah agar bundle awal ringan) ----------
      const maskW = 1024;
      const maskH = 512;
      let maskData: Uint8ClampedArray | null = null;
      let globeMesh: THREE.Mesh | null = null;

      const sampleMask = (lat: number, lon: number) => {
        if (!maskData) return { land: false, indo: false };
        const x = Math.min(maskW - 1, Math.max(0, Math.floor(((lon + 180) / 360) * maskW)));
        const y = Math.min(maskH - 1, Math.max(0, Math.floor(((90 - lat) / 180) * maskH)));
        const i = (y * maskW + x) * 4;
        return { land: maskData[i] > 127, indo: maskData[i + 1] > 127 };
      };

      import('world-atlas/countries-50m.json').then((mod) => {
        if (disposed) return;
        const world = (mod as any).default ?? mod;
        const countries = feature(world, world.objects.countries) as any;
        const indonesia = countries.features.find((f: any) => String(f.id) === INDONESIA_ID);

        // Tekstur warna (permukaan globe)
        const texW = 4096;
        const texH = 2048;
        const tex = document.createElement('canvas');
        tex.width = texW;
        tex.height = texH;
        const tctx = tex.getContext('2d')!;
        const tProj = geoEquirectangular().scale(texW / (2 * Math.PI)).translate([texW / 2, texH / 2]);
        const tPath = geoPath(tProj, tctx);
        const ocean = tctx.createLinearGradient(0, 0, 0, texH);
        ocean.addColorStop(0, '#0a1430');
        ocean.addColorStop(0.5, '#0b1838');
        ocean.addColorStop(1, '#0a1430');
        tctx.fillStyle = ocean;
        tctx.fillRect(0, 0, texW, texH);
        tctx.fillStyle = '#18306e';
        tctx.beginPath();
        tPath(countries);
        tctx.fill();
        tctx.strokeStyle = 'rgba(120,160,255,0.35)';
        tctx.lineWidth = 1.4;
        tctx.beginPath();
        tPath(mesh(world, world.objects.countries, (a: any, b: any) => a !== b) as any);
        tctx.stroke();
        if (indonesia) {
          tctx.fillStyle = '#0f5f86';
          tctx.beginPath();
          tPath(indonesia);
          tctx.fill();
          tctx.strokeStyle = 'rgba(34,229,255,0.9)';
          tctx.lineWidth = 2.2;
          tctx.stroke();
        }

        const texture = new THREE.CanvasTexture(tex);
        texture.colorSpace = THREE.SRGBColorSpace;
        texture.anisotropy = renderer.capabilities.getMaxAnisotropy();
        globeMesh = new THREE.Mesh(
          new THREE.SphereGeometry(R, 96, 96),
          new THREE.MeshPhongMaterial({ map: texture, shininess: 12, specular: new THREE.Color(0x1e3a8a) })
        );
        globe.add(globeMesh);

        // Masker untuk sampling titik daratan (R = darat, G = Indonesia)
        const mask = document.createElement('canvas');
        mask.width = maskW;
        mask.height = maskH;
        const mctx = mask.getContext('2d', { willReadFrequently: true })!;
        const mProj = geoEquirectangular().scale(maskW / (2 * Math.PI)).translate([maskW / 2, maskH / 2]);
        const mPath = geoPath(mProj, mctx);
        mctx.fillStyle = '#000';
        mctx.fillRect(0, 0, maskW, maskH);
        mctx.fillStyle = '#f00';
        mctx.beginPath();
        mPath(countries);
        mctx.fill();
        if (indonesia) {
          mctx.fillStyle = '#ff0';
          mctx.beginPath();
          mPath(indonesia);
          mctx.fill();
        }
        maskData = mctx.getImageData(0, 0, maskW, maskH).data;

        // Titik-titik daratan (gaya "dot globe")
        const N = 26000;
        const pos: number[] = [];
        const col: number[] = [];
        const golden = Math.PI * (3 - Math.sqrt(5));
        for (let i = 0; i < N; i++) {
          const y = 1 - (i / (N - 1)) * 2;
          const lat = (Math.asin(y) * 180) / Math.PI;
          const lon = ((((i * golden * 180) / Math.PI) % 360) + 360) % 360 - 180;
          const m = sampleMask(lat, lon);
          if (!m.land) continue;
          const p = latLonToVector3(lat, lon, R + 0.35);
          pos.push(p.x, p.y, p.z);
          if (m.indo) col.push(0.13, 0.9, 1);
          else col.push(0.45, 0.6, 1);
        }
        const dotGeo = new THREE.BufferGeometry();
        dotGeo.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
        dotGeo.setAttribute('color', new THREE.Float32BufferAttribute(col, 3));
        globe.add(
          new THREE.Points(
            dotGeo,
            new THREE.PointsMaterial({ size: 0.75, vertexColors: true, transparent: true, opacity: 0.85 })
          )
        );

        setReady(true);
      });

      // ---------- Hotspot & jalur ----------
      const hitTargets: THREE.Mesh[] = [];
      const rings: THREE.Mesh[] = [];
      GLOBE_HOTSPOTS.forEach((h) => {
        const p = latLonToVector3(h.lat, h.lon, R + 0.8);
        const core = new THREE.Mesh(
          new THREE.SphereGeometry(h.isTarget ? 1.9 : 1.4, 16, 16),
          new THREE.MeshBasicMaterial({ color: h.color })
        );
        core.position.copy(p);
        globe.add(core);

        const ring = new THREE.Mesh(
          new THREE.RingGeometry(2.2, 2.9, 40),
          new THREE.MeshBasicMaterial({ color: h.color, side: THREE.DoubleSide, transparent: true, opacity: 0.8 })
        );
        ring.position.copy(latLonToVector3(h.lat, h.lon, R + 0.9));
        ring.lookAt(new THREE.Vector3(0, 0, 0));
        ring.userData.phase = Math.random();
        globe.add(ring);
        rings.push(ring);

        const hit = new THREE.Mesh(
          new THREE.SphereGeometry(5, 8, 8),
          new THREE.MeshBasicMaterial({ visible: false })
        );
        hit.position.copy(p);
        hit.userData.hotspot = h;
        globe.add(hit);
        hitTargets.push(hit);
      });

      const target = GLOBE_HOTSPOTS.find((h) => h.isTarget)!;
      const targetPos = latLonToVector3(target.lat, target.lon, R + 0.8);
      const pulses: Array<{ curve: THREE.QuadraticBezierCurve3; mesh: THREE.Mesh; offset: number }> = [];
      GLOBE_HOTSPOTS.filter((h) => !h.isTarget).forEach((h) => {
        const o = latLonToVector3(h.lat, h.lon, R + 0.8);
        const mid = o.clone().add(targetPos).multiplyScalar(0.5);
        mid.normalize().multiplyScalar(R * 1.32);
        const curve = new THREE.QuadraticBezierCurve3(o, mid, targetPos);
        const line = new THREE.Line(
          new THREE.BufferGeometry().setFromPoints(curve.getPoints(80)),
          new THREE.LineBasicMaterial({ color: 0xff5c9a, transparent: true, opacity: 0.5 })
        );
        globe.add(line);
        for (let k = 0; k < 3; k++) {
          const m = new THREE.Mesh(
            new THREE.SphereGeometry(0.75, 10, 10),
            new THREE.MeshBasicMaterial({ color: 0xffd1e3, transparent: true, opacity: 0.95 })
          );
          globe.add(m);
          pulses.push({ curve, mesh: m, offset: k / 3 });
        }
      });

      // ---------- Cahaya ----------
      scene.add(new THREE.AmbientLight(0xffffff, 1.1));
      const key = new THREE.DirectionalLight(0x9fdcff, 1.4);
      key.position.set(120, 90, 160);
      scene.add(key);
      const rim = new THREE.PointLight(0xbe185d, 3, 400);
      rim.position.set(-160, -60, 60);
      scene.add(rim);

      // ---------- Kontrol & state animasi ----------
      type Mode = 'idle' | 'focus' | 'diving' | 'dived' | 'returning';
      let mode: Mode = 'idle';
      let rotTarget = { x: globe.rotation.x, y: globe.rotation.y };
      let camTarget = camFar;
      let diveT = 0;
      let diveFrom = { x: 0, y: 0, z: CAM_FAR };
      let diveTo = { x: 0, y: 0 };
      let isDragging = false;
      let dragMoved = 0;
      let prev = { x: 0, y: 0 };
      let velocity = { x: 0, y: 0 };
      let hovered: { kind: 'hotspot'; h: GlobeHotspot } | { kind: 'indo' } | null = null;
      const raycaster = new THREE.Raycaster();
      const ndc = new THREE.Vector2();

      const startDive = () => {
        if (mode === 'diving' || mode === 'dived') return;
        const r = rotationFor(target.lat, target.lon);
        diveFrom = { x: globe.rotation.x, y: globe.rotation.y, z: camera.position.z };
        diveTo = { x: r.x, y: nearestAngle(globe.rotation.y, r.y) };
        diveT = 0;
        mode = 'diving';
        cbRef.current.onDiveStart?.();
      };

      apiRef.current = {
        dive: startDive,
        reset: () => {
          mode = 'returning';
          camTarget = camFar;
          rotTarget = { x: globe.rotation.x * 0.5, y: globe.rotation.y };
        },
      };

      const pick = (clientX: number, clientY: number) => {
        const rect = renderer.domElement.getBoundingClientRect();
        ndc.set(((clientX - rect.left) / rect.width) * 2 - 1, -((clientY - rect.top) / rect.height) * 2 + 1);
        raycaster.setFromCamera(ndc, camera);
        const objs: THREE.Object3D[] = [...hitTargets];
        if (globeMesh) objs.push(globeMesh);
        const hits = raycaster.intersectObjects(objs, false);
        if (!hits.length) return null;
        const first = hits[0];
        if (first.object.userData.hotspot) return { kind: 'hotspot' as const, h: first.object.userData.hotspot as GlobeHotspot };
        // Titik di permukaan globe → lat/lon → cek apakah Indonesia
        const local = globe.worldToLocal(first.point.clone()).normalize();
        const lat = (Math.asin(local.y) * 180) / Math.PI;
        const lon = ((Math.atan2(local.z, -local.x) * 180) / Math.PI) - 180;
        const normLon = ((lon + 540) % 360) - 180;
        if (sampleMask(lat, normLon).indo) return { kind: 'indo' as const };
        return null;
      };

      const showTooltip = (clientX: number, clientY: number) => {
        const el = tooltipRef.current;
        if (!el) return;
        if (!hovered || isDragging) {
          el.style.opacity = '0';
          return;
        }
        const rect = mount.getBoundingClientRect();
        el.style.transform = `translate(${clientX - rect.left + 14}px, ${clientY - rect.top + 14}px)`;
        el.style.opacity = '1';
        if (hovered.kind === 'hotspot') {
          el.innerHTML = `<div class="font-bold text-white">${hovered.h.label}</div><div class="text-[10px] text-cyan-200">${hovered.h.sub}</div><div class="mt-1 text-[10px] text-white/60">${hovered.h.isTarget ? 'Klik untuk masuk ke peta' : 'Klik untuk detail'}</div>`;
        } else {
          el.innerHTML = `<div class="font-bold text-white">Indonesia</div><div class="mt-1 text-[10px] text-white/60">Klik untuk masuk ke peta Jabodetabek</div>`;
        }
      };

      const getXY = (e: PointerEvent) => ({ x: e.clientX, y: e.clientY });

      const onDown = (e: PointerEvent) => {
        if (mode === 'diving' || mode === 'dived') return;
        isDragging = true;
        dragMoved = 0;
        prev = getXY(e);
        velocity = { x: 0, y: 0 };
        renderer.domElement.setPointerCapture(e.pointerId);
      };
      const onMove = (e: PointerEvent) => {
        const p = getXY(e);
        if (isDragging) {
          const dx = p.x - prev.x;
          const dy = p.y - prev.y;
          dragMoved += Math.abs(dx) + Math.abs(dy);
          if (mode === 'focus' && dragMoved > 6) mode = 'idle';
          globe.rotation.y += dx * 0.005;
          globe.rotation.x = Math.max(-1.1, Math.min(1.1, globe.rotation.x + dy * 0.004));
          velocity = { x: dx * 0.005, y: dy * 0.004 };
          prev = p;
        } else if (mode !== 'diving' && mode !== 'dived') {
          hovered = pick(p.x, p.y);
          renderer.domElement.style.cursor = hovered ? 'pointer' : 'grab';
        }
        showTooltip(p.x, p.y);
      };
      const onUp = (e: PointerEvent) => {
        if (!isDragging) return;
        isDragging = false;
        if (dragMoved < 6) {
          const hit = pick(e.clientX, e.clientY);
          if (hit?.kind === 'indo' || (hit?.kind === 'hotspot' && hit.h.isTarget)) {
            startDive();
          } else if (hit?.kind === 'hotspot') {
            const r = rotationFor(hit.h.lat, hit.h.lon);
            rotTarget = { x: r.x * 0.8, y: nearestAngle(globe.rotation.y, r.y) };
            camTarget = camFar * (CAM_FOCUS / CAM_FAR);
            mode = 'focus';
            cbRef.current.onSelectHotspot?.(hit.h);
          } else if (mode === 'focus') {
            mode = 'idle';
            camTarget = camFar;
            cbRef.current.onSelectHotspot?.(null);
          }
        }
      };
      const onLeave = () => {
        hovered = null;
        if (tooltipRef.current) tooltipRef.current.style.opacity = '0';
      };

      const dom = renderer.domElement;
      dom.style.cursor = 'grab';
      dom.addEventListener('pointerdown', onDown);
      dom.addEventListener('pointermove', onMove);
      dom.addEventListener('pointerup', onUp);
      dom.addEventListener('pointerleave', onLeave);
      cleanups.push(() => {
        dom.removeEventListener('pointerdown', onDown);
        dom.removeEventListener('pointermove', onMove);
        dom.removeEventListener('pointerup', onUp);
        dom.removeEventListener('pointerleave', onLeave);
      });

      // Hanya render saat terlihat di layar
      let visible = true;
      const io = new IntersectionObserver(([entry]) => (visible = entry.isIntersecting));
      io.observe(mount);
      cleanups.push(() => io.disconnect());

      const clock = new THREE.Clock();
      const animate = () => {
        animId = requestAnimationFrame(animate);
        const dt = Math.min(clock.getDelta(), 0.05);
        const t = clock.elapsedTime;
        if (!visible || (pausedRef.current && mode === 'dived')) return;

        if (mode === 'diving') {
          diveT = Math.min(1, diveT + dt / 1.8);
          const e = easeInOut(diveT);
          globe.rotation.x = diveFrom.x + (diveTo.x - diveFrom.x) * Math.min(1, e * 1.3);
          globe.rotation.y = diveFrom.y + (diveTo.y - diveFrom.y) * Math.min(1, e * 1.3);
          camera.position.z = diveFrom.z + (CAM_DIVE - diveFrom.z) * e;
          if (diveT >= 1) {
            mode = 'dived';
            cbRef.current.onDiveComplete?.();
          }
        } else if (mode === 'dived') {
          // tahan posisi
        } else {
          if (mode === 'focus' || mode === 'returning') {
            globe.rotation.x += (rotTarget.x - globe.rotation.x) * 0.06;
            globe.rotation.y += (rotTarget.y - globe.rotation.y) * 0.06;
          } else if (!isDragging) {
            // inersia setelah drag, lalu putar pelan
            globe.rotation.y += velocity.x;
            globe.rotation.x = Math.max(-1.1, Math.min(1.1, globe.rotation.x + velocity.y));
            velocity.x *= 0.94;
            velocity.y *= 0.94;
            if (!reducedMotion && !hovered) globe.rotation.y += 0.0012;
          }
          camera.position.z += (camTarget - camera.position.z) * 0.06;
          if (mode === 'returning' && Math.abs(camera.position.z - camTarget) < 0.5) mode = 'idle';
        }

        rings.forEach((r) => {
          const k = (t * 0.6 + r.userData.phase) % 1;
          const s = 1 + k * 1.8;
          r.scale.set(s, s, s);
          (r.material as THREE.MeshBasicMaterial).opacity = 0.85 * (1 - k);
        });
        pulses.forEach((p) => {
          const k = (t * 0.22 + p.offset) % 1;
          p.mesh.position.copy(p.curve.getPoint(k));
        });

        renderer.render(scene, camera);
      };
      animate();

      const onResize = () => {
        const w = mount.clientWidth;
        const h = mount.clientHeight;
        if (!w || !h) return;
        const wasFar = Math.abs(camTarget - camFar) < 1;
        camFar = farFor(w / h);
        if (wasFar) camTarget = camFar;
        camera.aspect = w / h;
        camera.updateProjectionMatrix();
        renderer.setSize(w, h);
      };
      const ro = new ResizeObserver(onResize);
      ro.observe(mount);
      cleanups.push(() => ro.disconnect());

      return () => {
        disposed = true;
        cancelAnimationFrame(animId);
        cleanups.forEach((c) => c());
        scene.traverse((o: any) => {
          o.geometry?.dispose?.();
          if (o.material) {
            o.material.map?.dispose?.();
            o.material.dispose?.();
          }
        });
        renderer.dispose();
        if (dom.parentNode === mount) mount.removeChild(dom);
      };
    }, []);

    return (
      <div className="relative h-full w-full">
        <div ref={mountRef} className="h-full w-full" />
        <div
          ref={tooltipRef}
          className="pointer-events-none absolute left-0 top-0 rounded-xl border border-white/15 bg-[#0A1022]/90 px-3 py-2 text-xs shadow-lg backdrop-blur-md transition-opacity duration-150"
          style={{ opacity: 0 }}
        />
        {!ready && (
          <div className="pointer-events-none absolute inset-0 flex items-center justify-center gap-2 text-xs text-cyan-200/80">
            <Loader2 className="h-4 w-4 animate-spin" />
            Memuat peta dunia…
          </div>
        )}
      </div>
    );
  }
);
InteractiveGlobe.displayName = 'InteractiveGlobe';
