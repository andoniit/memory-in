"use client";

import { useEffect, useRef } from "react";
import * as THREE from "three";

// Light, non-interactive variant of the dot globe for the landing hero:
// gray continents on white, auto-rotating, no controls.
const ACCENT = 0xf25623;
const DOT = 0xaab0b9;
const GRID = 0xd6dae0;
const BG = 0xf4f4f4; // page background → occluder hides the far hemisphere

const CITIES = [
  [48.8566, 2.3522],
  [40.7128, -74.006],
  [35.6762, 139.6503],
  [-33.8688, 151.2093],
];

function latLngToVec3(lat: number, lng: number, r: number) {
  const phi = (90 - lat) * (Math.PI / 180);
  const theta = (lng + 180) * (Math.PI / 180);
  return new THREE.Vector3(
    -r * Math.sin(phi) * Math.cos(theta),
    r * Math.cos(phi),
    r * Math.sin(phi) * Math.sin(theta),
  );
}

function makeDotTexture() {
  const s = 64;
  const c = document.createElement("canvas");
  c.width = c.height = s;
  const ctx = c.getContext("2d")!;
  const g = ctx.createRadialGradient(s / 2, s / 2, 0, s / 2, s / 2, s / 2);
  g.addColorStop(0, "rgba(255,255,255,1)");
  g.addColorStop(0.55, "rgba(255,255,255,0.85)");
  g.addColorStop(1, "rgba(255,255,255,0)");
  ctx.fillStyle = g;
  ctx.beginPath();
  ctx.arc(s / 2, s / 2, s / 2, 0, Math.PI * 2);
  ctx.fill();
  return new THREE.CanvasTexture(c);
}

function makeGraticule() {
  const group = new THREE.Group();
  const mat = new THREE.LineBasicMaterial({
    color: GRID,
    transparent: true,
    opacity: 0.9,
  });
  const seg = 100;
  for (let lat = -75; lat <= 75; lat += 15) {
    const pts: THREE.Vector3[] = [];
    for (let i = 0; i <= seg; i++)
      pts.push(latLngToVec3(lat, -180 + (360 * i) / seg, 1));
    group.add(new THREE.Line(new THREE.BufferGeometry().setFromPoints(pts), mat));
  }
  for (let lng = -180; lng < 180; lng += 15) {
    const pts: THREE.Vector3[] = [];
    for (let i = 0; i <= seg; i++)
      pts.push(latLngToVec3(-90 + (180 * i) / seg, lng, 1));
    group.add(new THREE.Line(new THREE.BufferGeometry().setFromPoints(pts), mat));
  }
  return group;
}

export default function LandingGlobeImpl() {
  const mountRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const mount = mountRef.current;
    if (!mount) return;
    let disposed = false;

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(36, 1, 0.1, 100);
    camera.position.set(0, 0.15, 4.4);
    camera.lookAt(0, 0, 0);

    const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setClearColor(0x000000, 0);
    mount.appendChild(renderer.domElement);

    const world = new THREE.Group();
    world.rotation.z = (12 * Math.PI) / 180;
    scene.add(world);

    // Occluder hides the far side so it reads as a solid globe.
    world.add(
      new THREE.Mesh(
        new THREE.SphereGeometry(0.985, 48, 48),
        new THREE.MeshBasicMaterial({ color: BG }),
      ),
    );
    world.add(makeGraticule());

    // Decorative orange markers + pulse rings.
    const pulses: THREE.Mesh[] = [];
    const dotGeo = new THREE.SphereGeometry(0.02, 16, 16);
    const dotMat = new THREE.MeshBasicMaterial({ color: ACCENT });
    const ringGeo = new THREE.RingGeometry(0.032, 0.046, 24);
    for (const [lat, lng] of CITIES) {
      const p = latLngToVec3(lat, lng, 1.01);
      const normal = p.clone().normalize();
      const dot = new THREE.Mesh(dotGeo, dotMat);
      dot.position.copy(p);
      world.add(dot);
      const ring = new THREE.Mesh(
        ringGeo,
        new THREE.MeshBasicMaterial({
          color: ACCENT,
          transparent: true,
          opacity: 0.6,
          side: THREE.DoubleSide,
        }),
      );
      ring.position.copy(p);
      ring.lookAt(normal.clone().multiplyScalar(2));
      world.add(ring);
      pulses.push(ring);
    }

    // Land dots from the Earth texture.
    const dotTex = makeDotTexture();
    const img = new Image();
    img.src = "/textures/earth_atmos_2048.jpg";
    img.onload = () => {
      if (disposed) return;
      const cv = document.createElement("canvas");
      cv.width = img.width;
      cv.height = img.height;
      const ctx = cv.getContext("2d")!;
      ctx.drawImage(img, 0, 0);
      const data = ctx.getImageData(0, 0, cv.width, cv.height).data;
      const isLand = (lat: number, lng: number) => {
        const x = Math.min(cv.width - 1, Math.floor(((lng + 180) / 360) * cv.width));
        const y = Math.min(cv.height - 1, Math.floor(((90 - lat) / 180) * cv.height));
        const i = (y * cv.width + x) * 4;
        const r = data[i];
        const g = data[i + 1];
        const b = data[i + 2];
        const isOcean = b > Math.max(r, g) + 10 && b > 45;
        return !isOcean;
      };
      const positions: number[] = [];
      const step = 1.4;
      for (let lat = -85; lat <= 85; lat += step)
        for (let lng = -180; lng < 180; lng += step)
          if (isLand(lat, lng)) {
            const p = latLngToVec3(lat, lng, 1.0);
            positions.push(p.x, p.y, p.z);
          }
      const geo = new THREE.BufferGeometry();
      geo.setAttribute("position", new THREE.Float32BufferAttribute(positions, 3));
      world.add(
        new THREE.Points(
          geo,
          new THREE.PointsMaterial({
            map: dotTex,
            color: DOT,
            size: 0.02,
            sizeAttenuation: true,
            transparent: true,
            depthWrite: false,
            opacity: 1,
          }),
        ),
      );
    };

    const resize = () => {
      const w = mount.clientWidth;
      const h = mount.clientHeight;
      if (!w || !h) return;
      renderer.setSize(w, h);
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
    };
    resize();
    const ro = new ResizeObserver(resize);
    ro.observe(mount);

    let raf = 0;
    const clock = new THREE.Clock();
    const tick = () => {
      raf = requestAnimationFrame(tick);
      const dt = clock.getDelta();
      const t = clock.elapsedTime;
      world.rotation.y += dt * 0.06;
      const s = 1 + Math.sin(t * 2) * 0.4;
      for (const ring of pulses) {
        ring.scale.setScalar(s);
        (ring.material as THREE.MeshBasicMaterial).opacity = 0.6 - (s - 1) * 0.7;
      }
      renderer.render(scene, camera);
    };
    tick();

    return () => {
      disposed = true;
      cancelAnimationFrame(raf);
      ro.disconnect();
      dotTex.dispose();
      scene.traverse((o) => {
        const m = o as THREE.Mesh & THREE.Points;
        m.geometry?.dispose?.();
        const mat = (m as THREE.Mesh).material;
        if (Array.isArray(mat)) mat.forEach((x) => x.dispose());
        else mat?.dispose?.();
      });
      renderer.dispose();
      if (renderer.domElement.parentNode === mount)
        mount.removeChild(renderer.domElement);
    };
  }, []);

  // pointer-events-none → no drag/zoom, and the page scrolls over it.
  return <div ref={mountRef} className="pointer-events-none h-full w-full" />;
}
