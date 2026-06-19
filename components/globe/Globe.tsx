"use client";

import { useEffect, useRef } from "react";
import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";

export interface GlobePin {
  id: string;
  lat: number | null;
  lng: number | null;
  title: string;
  city: string | null;
  emoji: string;
}

const ACCENT = 0xf25623;
const LINE = 0xdedede;
const GLOBE = 0xededed;

/** lat/lng (degrees) → point on a sphere of the given radius. */
function latLngToVec3(lat: number, lng: number, r: number) {
  const phi = (90 - lat) * (Math.PI / 180);
  const theta = (lng + 180) * (Math.PI / 180);
  return new THREE.Vector3(
    -r * Math.sin(phi) * Math.cos(theta),
    r * Math.cos(phi),
    r * Math.sin(phi) * Math.sin(theta),
  );
}

/** Decorative tilted ring of line segments. */
function makeRing(radius: number, tilt: number, dashed: boolean) {
  const pts: THREE.Vector3[] = [];
  const seg = 128;
  for (let i = 0; i <= seg; i++) {
    const a = (i / seg) * Math.PI * 2;
    pts.push(new THREE.Vector3(Math.cos(a) * radius, 0, Math.sin(a) * radius));
  }
  const geo = new THREE.BufferGeometry().setFromPoints(pts);
  const mat = dashed
    ? new THREE.LineDashedMaterial({
        color: LINE,
        dashSize: 0.06,
        gapSize: 0.06,
        transparent: true,
        opacity: 0.9,
      })
    : new THREE.LineBasicMaterial({ color: LINE, transparent: true, opacity: 0.9 });
  const line = new THREE.Line(geo, mat);
  if (dashed) line.computeLineDistances();
  line.rotation.x = tilt;
  return line;
}

export default function Globe({
  pins,
  onPinTap,
}: {
  pins: GlobePin[];
  onPinTap?: (pin: GlobePin) => void;
}) {
  const mountRef = useRef<HTMLDivElement>(null);
  const tapRef = useRef(onPinTap);
  tapRef.current = onPinTap;

  useEffect(() => {
    const mount = mountRef.current;
    if (!mount) return;

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(42, 1, 0.1, 100);
    camera.position.set(0, 0.4, 3.4);

    const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setClearColor(0x000000, 0);
    mount.appendChild(renderer.domElement);

    // Lights — soft, for a faint sphere shade.
    scene.add(new THREE.AmbientLight(0xffffff, 0.9));
    const dir = new THREE.DirectionalLight(0xffffff, 0.5);
    dir.position.set(2, 1.5, 2);
    scene.add(dir);

    // Globe + graticule.
    const globe = new THREE.Mesh(
      new THREE.SphereGeometry(1, 48, 48),
      new THREE.MeshStandardMaterial({
        color: GLOBE,
        roughness: 1,
        metalness: 0,
      }),
    );
    scene.add(globe);

    const graticule = new THREE.Mesh(
      new THREE.SphereGeometry(1.002, 24, 16),
      new THREE.MeshBasicMaterial({
        color: LINE,
        wireframe: true,
        transparent: true,
        opacity: 0.55,
      }),
    );
    scene.add(graticule);

    // Orbital rings.
    scene.add(makeRing(1.45, Math.PI / 2.3, false));
    scene.add(makeRing(1.72, Math.PI / 1.9, true));

    // Pins.
    const pinMeshes: THREE.Mesh[] = [];
    const pulses: THREE.Mesh[] = [];
    const dotGeo = new THREE.SphereGeometry(0.028, 16, 16);
    const dotMat = new THREE.MeshBasicMaterial({ color: ACCENT });
    const ringGeo = new THREE.RingGeometry(0.04, 0.052, 24);
    const ringMat = new THREE.MeshBasicMaterial({
      color: ACCENT,
      transparent: true,
      opacity: 0.6,
      side: THREE.DoubleSide,
    });

    for (const pin of pins) {
      if (pin.lat == null || pin.lng == null) continue;
      if (pin.lat === 0 && pin.lng === 0) continue; // unset coords
      const pos = latLngToVec3(pin.lat, pin.lng, 1.02);
      const normal = pos.clone().normalize();

      const dot = new THREE.Mesh(dotGeo, dotMat);
      dot.position.copy(pos);
      dot.userData.pin = pin;
      scene.add(dot);
      pinMeshes.push(dot);

      const ring = new THREE.Mesh(ringGeo, ringMat.clone());
      ring.position.copy(pos);
      ring.lookAt(normal.clone().multiplyScalar(2)); // face outward
      ring.userData.base = pos.clone();
      scene.add(ring);
      pulses.push(ring);
    }

    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableZoom = false;
    controls.enablePan = false;
    controls.enableDamping = true;
    controls.dampingFactor = 0.08;
    controls.autoRotate = true;
    controls.autoRotateSpeed = 0.45;
    controls.rotateSpeed = 0.5;

    // Pause auto-rotate while interacting.
    controls.addEventListener("start", () => (controls.autoRotate = false));
    let resumeTimer: ReturnType<typeof setTimeout>;
    controls.addEventListener("end", () => {
      clearTimeout(resumeTimer);
      resumeTimer = setTimeout(() => (controls.autoRotate = true), 2500);
    });

    // Tap detection → pin hit test.
    const raycaster = new THREE.Raycaster();
    const ndc = new THREE.Vector2();
    let down: { x: number; y: number } | null = null;

    const onDown = (e: PointerEvent) => (down = { x: e.clientX, y: e.clientY });
    const onUp = (e: PointerEvent) => {
      if (!down) return;
      const moved = Math.hypot(e.clientX - down.x, e.clientY - down.y);
      down = null;
      if (moved > 8) return; // was a drag
      const rect = renderer.domElement.getBoundingClientRect();
      ndc.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      ndc.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;
      raycaster.setFromCamera(ndc, camera);
      const hit = raycaster.intersectObjects(pinMeshes)[0];
      if (hit) tapRef.current?.(hit.object.userData.pin as GlobePin);
    };
    renderer.domElement.addEventListener("pointerdown", onDown);
    renderer.domElement.addEventListener("pointerup", onUp);

    // Size to container.
    const resize = () => {
      const w = mount.clientWidth;
      const h = mount.clientHeight;
      if (!w || !h) return;
      renderer.setSize(w, h, false);
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
    };
    resize();
    const ro = new ResizeObserver(resize);
    ro.observe(mount);

    // Animate.
    let raf = 0;
    const clock = new THREE.Clock();
    const tick = () => {
      raf = requestAnimationFrame(tick);
      const t = clock.getElapsedTime();
      const s = 1 + Math.sin(t * 2) * 0.35;
      for (const ring of pulses) {
        ring.scale.setScalar(s);
        (ring.material as THREE.MeshBasicMaterial).opacity =
          0.5 - (s - 1) * 0.6;
      }
      controls.update();
      renderer.render(scene, camera);
    };
    tick();

    return () => {
      cancelAnimationFrame(raf);
      clearTimeout(resumeTimer);
      ro.disconnect();
      controls.dispose();
      renderer.domElement.removeEventListener("pointerdown", onDown);
      renderer.domElement.removeEventListener("pointerup", onUp);
      renderer.dispose();
      scene.traverse((o) => {
        const m = o as THREE.Mesh;
        m.geometry?.dispose?.();
        const mat = m.material;
        if (Array.isArray(mat)) mat.forEach((x) => x.dispose());
        else mat?.dispose?.();
      });
      if (renderer.domElement.parentNode === mount)
        mount.removeChild(renderer.domElement);
    };
  }, [pins]);

  return <div ref={mountRef} className="h-full w-full touch-none" />;
}
