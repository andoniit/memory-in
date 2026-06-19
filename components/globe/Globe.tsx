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

function makeStars(count: number) {
  const geo = new THREE.BufferGeometry();
  const pos = new Float32Array(count * 3);
  for (let i = 0; i < count; i++) {
    // Distribute on a large shell so stars sit behind the Earth.
    const r = 18 + Math.random() * 22;
    const u = Math.random() * 2 - 1;
    const t = Math.random() * Math.PI * 2;
    const s = Math.sqrt(1 - u * u);
    pos[i * 3] = r * s * Math.cos(t);
    pos[i * 3 + 1] = r * u;
    pos[i * 3 + 2] = r * s * Math.sin(t);
  }
  geo.setAttribute("position", new THREE.BufferAttribute(pos, 3));
  const mat = new THREE.PointsMaterial({
    color: 0xffffff,
    size: 0.08,
    sizeAttenuation: true,
    transparent: true,
    opacity: 0.8,
  });
  return new THREE.Points(geo, mat);
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
    const camera = new THREE.PerspectiveCamera(38, 1, 0.1, 100);
    camera.position.set(0, 0.6, 3.2);

    const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setClearColor(0x000000, 0);
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.05;
    mount.appendChild(renderer.domElement);

    // ── Textures ────────────────────────────────────────────
    const loader = new THREE.TextureLoader();
    const dayMap = loader.load("/textures/earth_atmos_2048.jpg");
    dayMap.colorSpace = THREE.SRGBColorSpace;
    dayMap.anisotropy = renderer.capabilities.getMaxAnisotropy();
    const specMap = loader.load("/textures/earth_specular_2048.jpg");
    const normalMap = loader.load("/textures/earth_normal_2048.jpg");
    const cloudMap = loader.load("/textures/earth_clouds_1024.png");

    // ── Lights ──────────────────────────────────────────────
    scene.add(new THREE.AmbientLight(0xffffff, 0.22));
    const sun = new THREE.DirectionalLight(0xfff3e6, 1.35);
    sun.position.set(-3, 1.2, 1.4);
    scene.add(sun);

    // ── Earth (tilted group, self-rotating) ─────────────────
    const earthGroup = new THREE.Group();
    earthGroup.rotation.z = (23.4 * Math.PI) / 180;
    scene.add(earthGroup);

    const earth = new THREE.Mesh(
      new THREE.SphereGeometry(1, 64, 64),
      new THREE.MeshPhongMaterial({
        map: dayMap,
        specularMap: specMap,
        normalMap: normalMap,
        normalScale: new THREE.Vector2(0.7, 0.7),
        specular: new THREE.Color(0x2a3a55),
        shininess: 14,
      }),
    );
    earthGroup.add(earth);

    const clouds = new THREE.Mesh(
      new THREE.SphereGeometry(1.012, 64, 64),
      new THREE.MeshPhongMaterial({
        alphaMap: cloudMap,
        transparent: true,
        depthWrite: false,
        opacity: 0.5,
      }),
    );
    earthGroup.add(clouds);

    // ── Atmosphere glow (fresnel rim) ───────────────────────
    const atmosphere = new THREE.Mesh(
      new THREE.SphereGeometry(1.18, 64, 64),
      new THREE.ShaderMaterial({
        uniforms: {
          glowColor: { value: new THREE.Color(0x5a8bff) },
          viewVector: { value: camera.position },
        },
        vertexShader: `
          uniform vec3 viewVector;
          varying float intensity;
          void main() {
            vec3 vNormal = normalize(normalMatrix * normal);
            vec3 vView = normalize(normalMatrix * viewVector);
            intensity = pow(0.62 - dot(vNormal, vView), 4.0);
            gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
          }`,
        fragmentShader: `
          uniform vec3 glowColor;
          varying float intensity;
          void main() {
            gl_FragColor = vec4(glowColor, 1.0) * clamp(intensity, 0.0, 1.0);
          }`,
        side: THREE.BackSide,
        blending: THREE.AdditiveBlending,
        transparent: true,
      }),
    );
    scene.add(atmosphere);

    // ── Stars ───────────────────────────────────────────────
    const stars = makeStars(900);
    scene.add(stars);

    // ── Pins (attached to the Earth so they spin with it) ───
    const pinMeshes: THREE.Mesh[] = [];
    const pulses: THREE.Mesh[] = [];
    const dotGeo = new THREE.SphereGeometry(0.022, 16, 16);
    const dotMat = new THREE.MeshBasicMaterial({ color: ACCENT });
    const stickMat = new THREE.MeshBasicMaterial({ color: ACCENT });
    const ringGeo = new THREE.RingGeometry(0.035, 0.05, 24);

    for (const pin of pins) {
      if (pin.lat == null || pin.lng == null) continue;
      if (pin.lat === 0 && pin.lng === 0) continue;
      const surface = latLngToVec3(pin.lat, pin.lng, 1.0);
      const outer = latLngToVec3(pin.lat, pin.lng, 1.06);
      const normal = surface.clone().normalize();

      // little stalk from the surface
      const stick = new THREE.Mesh(
        new THREE.CylinderGeometry(0.004, 0.004, 0.06, 6),
        stickMat,
      );
      stick.position.copy(surface.clone().lerp(outer, 0.5));
      stick.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), normal);
      earthGroup.add(stick);

      const dot = new THREE.Mesh(dotGeo, dotMat);
      dot.position.copy(outer);
      dot.userData.pin = pin;
      earthGroup.add(dot);
      pinMeshes.push(dot);

      const ring = new THREE.Mesh(
        ringGeo,
        new THREE.MeshBasicMaterial({
          color: ACCENT,
          transparent: true,
          opacity: 0.6,
          side: THREE.DoubleSide,
          blending: THREE.AdditiveBlending,
        }),
      );
      ring.position.copy(outer);
      ring.lookAt(normal.clone().multiplyScalar(2));
      earthGroup.add(ring);
      pulses.push(ring);
    }

    // ── Controls ────────────────────────────────────────────
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enablePan = false;
    controls.enableDamping = true;
    controls.dampingFactor = 0.08;
    controls.rotateSpeed = 0.5;
    controls.minDistance = 2.2;
    controls.maxDistance = 5;

    // ── Tap detection → pin hit test ────────────────────────
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
      renderer.setSize(w, h, false);
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
      earthGroup.rotation.y += dt * 0.05;
      clouds.rotation.y += dt * 0.012;
      stars.rotation.y += dt * 0.005;
      const s = 1 + Math.sin(t * 2) * 0.4;
      for (const ring of pulses) {
        ring.scale.setScalar(s);
        (ring.material as THREE.MeshBasicMaterial).opacity = 0.55 - (s - 1) * 0.7;
      }
      controls.update();
      renderer.render(scene, camera);
    };
    tick();

    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
      controls.dispose();
      renderer.domElement.removeEventListener("pointerdown", onDown);
      renderer.domElement.removeEventListener("pointerup", onUp);
      [dayMap, specMap, normalMap, cloudMap].forEach((t) => t.dispose());
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
