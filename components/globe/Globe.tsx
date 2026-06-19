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
const DOT = 0xb9c1cc;
const GRID = 0x46505f;
const BG = 0x05070a;

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

/** Soft round sprite for the land dots. */
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

/** Latitude/longitude graticule as thin line loops. */
function makeGraticule() {
  const group = new THREE.Group();
  const mat = new THREE.LineBasicMaterial({
    color: GRID,
    transparent: true,
    opacity: 0.85,
  });
  const seg = 128;
  // Parallels (latitude circles)
  for (let lat = -75; lat <= 75; lat += 15) {
    const pts: THREE.Vector3[] = [];
    for (let i = 0; i <= seg; i++)
      pts.push(latLngToVec3(lat, -180 + (360 * i) / seg, 1));
    group.add(new THREE.Line(new THREE.BufferGeometry().setFromPoints(pts), mat));
  }
  // Meridians (longitude half-circles)
  for (let lng = -180; lng < 180; lng += 15) {
    const pts: THREE.Vector3[] = [];
    for (let i = 0; i <= seg; i++)
      pts.push(latLngToVec3(-90 + (180 * i) / seg, lng, 1));
    group.add(new THREE.Line(new THREE.BufferGeometry().setFromPoints(pts), mat));
  }
  return group;
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
    let disposed = false;

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(36, 1, 0.1, 100);
    camera.position.set(0, 0.15, 4.4);

    const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setClearColor(0x000000, 0);
    mount.appendChild(renderer.domElement);

    // Rotating world (dots + grid + pins + occluder all spin together).
    const world = new THREE.Group();
    world.rotation.z = (12 * Math.PI) / 180;
    scene.add(world);

    // Occluder: a near-black sphere just under the dots so the far hemisphere
    // is hidden, giving a solid globe.
    const occluder = new THREE.Mesh(
      new THREE.SphereGeometry(0.985, 48, 48),
      new THREE.MeshBasicMaterial({ color: BG }),
    );
    world.add(occluder);

    // Faint rim/atmosphere for the silhouette edge.
    const rim = new THREE.Mesh(
      new THREE.SphereGeometry(1.13, 48, 48),
      new THREE.ShaderMaterial({
        uniforms: { glowColor: { value: new THREE.Color(0x3b4a63) } },
        vertexShader: `
          varying float intensity;
          void main(){
            vec3 n = normalize(normalMatrix * normal);
            vec3 v = normalize(normalMatrix * vec3(0.0,0.0,1.0));
            intensity = pow(0.55 - dot(n, v), 3.0);
            gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0);
          }`,
        fragmentShader: `
          uniform vec3 glowColor; varying float intensity;
          void main(){ gl_FragColor = vec4(glowColor,1.0) * clamp(intensity,0.0,1.0); }`,
        side: THREE.BackSide,
        blending: THREE.AdditiveBlending,
        transparent: true,
      }),
    );
    scene.add(rim);

    world.add(makeGraticule());

    // Pins (added immediately; dots come after the land mask loads).
    const pinMeshes: THREE.Mesh[] = [];
    const pulses: THREE.Mesh[] = [];
    const dotGeo = new THREE.SphereGeometry(0.02, 16, 16);
    const pinMat = new THREE.MeshBasicMaterial({ color: ACCENT });
    const ringGeo = new THREE.RingGeometry(0.032, 0.046, 24);
    for (const pin of pins) {
      if (pin.lat == null || pin.lng == null) continue;
      if (pin.lat === 0 && pin.lng === 0) continue;
      const p = latLngToVec3(pin.lat, pin.lng, 1.01);
      const normal = p.clone().normalize();
      const dot = new THREE.Mesh(dotGeo, pinMat);
      dot.position.copy(p);
      dot.userData.pin = pin;
      world.add(dot);
      pinMeshes.push(dot);
      const ring = new THREE.Mesh(
        ringGeo,
        new THREE.MeshBasicMaterial({
          color: ACCENT,
          transparent: true,
          opacity: 0.7,
          side: THREE.DoubleSide,
          blending: THREE.AdditiveBlending,
        }),
      );
      ring.position.copy(p);
      ring.lookAt(normal.clone().multiplyScalar(2));
      world.add(ring);
      pulses.push(ring);
    }

    // ── Build land dots by sampling the Earth texture ───────
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
        const u = (lng + 180) / 360;
        const v = (90 - lat) / 180;
        const x = Math.min(cv.width - 1, Math.floor(u * cv.width));
        const y = Math.min(cv.height - 1, Math.floor(v * cv.height));
        const i = (y * cv.width + x) * 4;
        const r = data[i];
        const g = data[i + 1];
        const b = data[i + 2];
        const lum = 0.299 * r + 0.587 * g + 0.114 * b;
        // land = bright enough and not deep blue ocean
        return lum > 58 && !(b > r + 16 && lum < 95);
      };

      const positions: number[] = [];
      const step = 1.7;
      for (let lat = -85; lat <= 85; lat += step) {
        for (let lng = -180; lng < 180; lng += step) {
          if (isLand(lat, lng)) {
            const p = latLngToVec3(lat, lng, 1.0);
            positions.push(p.x, p.y, p.z);
          }
        }
      }

      const geo = new THREE.BufferGeometry();
      geo.setAttribute(
        "position",
        new THREE.Float32BufferAttribute(positions, 3),
      );
      const mat = new THREE.PointsMaterial({
        map: dotTex,
        color: DOT,
        size: 0.02,
        sizeAttenuation: true,
        transparent: true,
        depthWrite: false,
        opacity: 0.95,
      });
      world.add(new THREE.Points(geo, mat));
    };

    // ── Controls ────────────────────────────────────────────
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enablePan = false;
    controls.enableDamping = true;
    controls.dampingFactor = 0.08;
    controls.rotateSpeed = 0.5;
    controls.minDistance = 3;
    controls.maxDistance = 7;

    // ── Tap → pin hit test ──────────────────────────────────
    const raycaster = new THREE.Raycaster();
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
      if (hit) tapRef.current?.(hit.object.userData.pin as GlobePin);
    };
    renderer.domElement.addEventListener("pointerdown", onDown);
    renderer.domElement.addEventListener("pointerup", onUp);

    // ── Resize ──────────────────────────────────────────────
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

    // ── Animate ─────────────────────────────────────────────
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
      controls.update();
      renderer.render(scene, camera);
    };
    tick();

    return () => {
      disposed = true;
      cancelAnimationFrame(raf);
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
