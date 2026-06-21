"use client";

import { useEffect, useRef } from "react";
import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";

export interface GlobePin {
  id: string;
  lat: number;
  lng: number;
  emoji: string;
}

const ACCENT = 0xf25623;
const DOT = 0xaab0b9;
const GRID = 0xccd1d8;
const BG = 0xf4f4f4;

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

export default function InteractiveGlobe({
  pins,
  onPinTap,
  highlightId,
}: {
  pins: GlobePin[];
  onPinTap?: (id: string) => void;
  highlightId?: string | null;
}) {
  const mountRef = useRef<HTMLDivElement>(null);
  const tapRef = useRef(onPinTap);
  tapRef.current = onPinTap;
  const highlightRef = useRef<string | null | undefined>(highlightId);
  highlightRef.current = highlightId;

  useEffect(() => {
    const mount = mountRef.current;
    if (!mount) return;
    let disposed = false;

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(38, 1, 0.1, 100);
    camera.position.set(0, 0.3, 3.6);

    const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setClearColor(0x000000, 0);
    mount.appendChild(renderer.domElement);

    const world = new THREE.Group();
    world.rotation.z = (12 * Math.PI) / 180;
    scene.add(world);

    world.add(
      new THREE.Mesh(
        new THREE.SphereGeometry(0.985, 48, 48),
        new THREE.MeshBasicMaterial({ color: BG }),
      ),
    );
    world.add(makeGraticule());

    // Pins (clickable).
    const pinMeshes: THREE.Mesh[] = [];
    const pulses: THREE.Mesh[] = [];
    const dotGeo = new THREE.SphereGeometry(0.016, 16, 16);
    const dotMat = new THREE.MeshBasicMaterial({ color: ACCENT });
    const ringGeo = new THREE.RingGeometry(0.026, 0.036, 24);
    for (const pin of pins) {
      const p = latLngToVec3(pin.lat, pin.lng, 1.02);
      const normal = p.clone().normalize();
      const dot = new THREE.Mesh(dotGeo, dotMat);
      dot.position.copy(p);
      dot.userData.id = pin.id;
      dot.userData.base = p.clone();
      world.add(dot);
      pinMeshes.push(dot);
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

    // Land dots.
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
        const lum = 0.299 * r + 0.587 * g + 0.114 * b;
        return lum > 58 && !(b > r + 16 && lum < 95);
      };
      const positions: number[] = [];
      const step = 1.8;
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
          }),
        ),
      );
    };

    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enablePan = false;
    controls.enableDamping = true;
    controls.dampingFactor = 0.08;
    controls.rotateSpeed = 0.5;
    controls.minDistance = 2.6;
    controls.maxDistance = 5.5;
    // The world self-rotates; pause it while the user is dragging.
    let interacting = false;
    let resumeTimer: ReturnType<typeof setTimeout>;
    controls.addEventListener("start", () => {
      interacting = true;
      clearTimeout(resumeTimer);
    });
    controls.addEventListener("end", () => {
      clearTimeout(resumeTimer);
      resumeTimer = setTimeout(() => (interacting = false), 2500);
    });

    // Tap → pin hit test.
    const raycaster = new THREE.Raycaster();
    raycaster.params.Points = { threshold: 0.04 };
    const ndc = new THREE.Vector2();
    let down: { x: number; y: number } | null = null;
    const onDown = (e: PointerEvent) => (down = { x: e.clientX, y: e.clientY });
    const onUp = (e: PointerEvent) => {
      if (!down) return;
      const moved = Math.hypot(e.clientX - down.x, e.clientY - down.y);
      down = null;
      if (moved > 8) return;
      const rect = renderer.domElement.getBoundingClientRect();
      ndc.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      ndc.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;
      raycaster.setFromCamera(ndc, camera);
      const hit = raycaster.intersectObjects(pinMeshes)[0];
      if (hit) tapRef.current?.(hit.object.userData.id as string);
    };
    renderer.domElement.addEventListener("pointerdown", onDown);
    renderer.domElement.addEventListener("pointerup", onUp);

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
      const hid = highlightRef.current ?? null;

      // Spin, or rotate the highlighted pin to the front ("locate it").
      if (hid) {
        const m = pinMeshes.find((pm) => pm.userData.id === hid);
        if (m) {
          const base = m.userData.base as THREE.Vector3;
          const target = -Math.atan2(base.x, base.z);
          let d = target - world.rotation.y;
          d = Math.atan2(Math.sin(d), Math.cos(d));
          world.rotation.y += d * 0.08;
        }
      } else if (!interacting) {
        world.rotation.y += dt * 0.08;
      }

      const pulse = 1 + Math.sin(t * 2) * 0.4;
      for (let i = 0; i < pinMeshes.length; i++) {
        const hl = pinMeshes[i].userData.id === hid;
        const ds = THREE.MathUtils.lerp(pinMeshes[i].scale.x, hl ? 2.4 : 1, 0.2);
        pinMeshes[i].scale.setScalar(ds);
        pulses[i].scale.setScalar(pulse * (hl ? 1.8 : 1));
        (pulses[i].material as THREE.MeshBasicMaterial).opacity =
          (hl ? 0.85 : 0.6) - (pulse - 1) * 0.7;
      }

      controls.update();
      renderer.render(scene, camera);
    };
    tick();

    return () => {
      disposed = true;
      cancelAnimationFrame(raf);
      clearTimeout(resumeTimer);
      ro.disconnect();
      controls.dispose();
      renderer.domElement.removeEventListener("pointerdown", onDown);
      renderer.domElement.removeEventListener("pointerup", onUp);
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
  }, [pins]);

  return <div ref={mountRef} className="h-full w-full touch-none" />;
}
