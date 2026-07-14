import { useEffect, useMemo, useRef } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { Points, PointMaterial, Billboard } from "@react-three/drei";
import * as THREE from "three";

/**
 * Immersive scroll-driven background — a journey in two stops, timed to a
 * shared dawn -> day -> golden hour -> dusk sky cycle:
 *   1) A rotating 3D globe with a looping flight path — South Africa ->
 *      Cyprus -> UK, tracing the real education journey (landing + crossing)
 *   2) Bath's Roman Baths (where the journey lands)
 * The `progress` ref (0..1) tracks scroll through the whole page; each zone
 * crossfades in/out as you scroll past its window.
 */
type Props = { progress: React.MutableRefObject<number> };

// ---- scroll zones ----
// [fadeInStart, fadeInEnd, fadeOutStart, fadeOutEnd] in progress (0..1).
// A zone with fadeInStart >= fadeInEnd is full-strength from p=0; a zone with
// fadeOutStart >= fadeOutEnd never fades out (stays full through p=1).
const ZONES = {
  rain: [0, 0, 0.16, 0.26] as const,
  globe: [0, 0, 0.64, 0.73] as const,
  romanBaths: [0.64, 0.73, 1, 1] as const,
};

function zoneWeight(p: number, inStart: number, inEnd: number, outStart: number, outEnd: number) {
  const fadeIn = inStart >= inEnd ? 1 : THREE.MathUtils.smoothstep(p, inStart, inEnd);
  const fadeOut = outStart >= outEnd ? 1 : 1 - THREE.MathUtils.smoothstep(p, outStart, outEnd);
  return THREE.MathUtils.clamp(fadeIn * fadeOut, 0, 1);
}

// Sky palette stops: [top of sky, horizon glow] at each stage of the scroll.
const SKY_STOPS: [string, string][] = [
  ["#2c4372", "#f0a184"], // crisp morning, behind the silk
  ["#3a6ea8", "#d9e8ea"], // clearing sky, descending toward open water
  ["#5b9bd5", "#fbe0a6"], // midday haze on the island
  ["#3d4f8a", "#f2955e"], // golden hour, approaching land
  ["#c98a4a", "#ffdca0"], // golden Bath stone at sunset
];

function skyColorsAt(p: number, top: THREE.Color, horizon: THREE.Color) {
  const f = p * (SKY_STOPS.length - 1);
  const i = Math.floor(f);
  const k = f - i;
  const a = SKY_STOPS[Math.min(i, SKY_STOPS.length - 1)];
  const b = SKY_STOPS[Math.min(i + 1, SKY_STOPS.length - 1)];
  top.set(a[0]).lerp(new THREE.Color(b[0]), k);
  horizon.set(a[1]).lerp(new THREE.Color(b[1]), k);
}

function Sky({ progress }: Props) {
  const matRef = useRef<THREE.ShaderMaterial>(null);
  const uniforms = useMemo(
    () => ({
      uTime: { value: 0 },
      uTop: { value: new THREE.Color(SKY_STOPS[0][0]) },
      uHorizon: { value: new THREE.Color(SKY_STOPS[0][1]) },
      uSunPos: { value: new THREE.Vector2(0, 0.3) },
      uSunColor: { value: new THREE.Color("#ffe3a3") },
    }),
    [],
  );

  useFrame((state) => {
    uniforms.uTime.value = state.clock.elapsedTime;
    skyColorsAt(progress.current, uniforms.uTop.value, uniforms.uHorizon.value);
    // Sun arcs left-to-right and rises/sets as you scroll through the page.
    uniforms.uSunPos.value.set(-0.7 + progress.current * 1.4, 0.05 + Math.sin(progress.current * Math.PI) * 0.55);
  });

  return (
    <mesh position={[0, 2, -22]} scale={[70, 40, 1]}>
      <planeGeometry args={[1, 1]} />
      <shaderMaterial
        ref={matRef}
        uniforms={uniforms}
        depthWrite={false}
        fragmentShader={`
          varying vec2 vUv;
          uniform float uTime;
          uniform vec3 uTop;
          uniform vec3 uHorizon;
          uniform vec2 uSunPos;
          uniform vec3 uSunColor;
          float hash(vec2 p){ return fract(sin(dot(p, vec2(127.1,311.7))) * 43758.5453); }
          void main(){
            vec3 col = mix(uHorizon, uTop, smoothstep(0.0, 0.75, vUv.y));
            // sun disc + glow
            vec2 sunUv = vec2(uSunPos.x * 0.5 + 0.5, uSunPos.y);
            float d = distance(vUv, sunUv);
            float glow = smoothstep(0.35, 0.0, d);
            float core = smoothstep(0.045, 0.03, d);
            col += uSunColor * glow * 0.55;
            col = mix(col, uSunColor, core);
            // faint drifting cloud noise near the horizon band
            float n = hash(floor(vUv * vec2(40.0, 14.0) + vec2(uTime * 0.4, 0.0)));
            col += (n - 0.5) * 0.015 * smoothstep(0.6, 0.15, vUv.y);
            gl_FragColor = vec4(col, 1.0);
          }
        `}
        vertexShader={`varying vec2 vUv; void main(){ vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }`}
      />
    </mesh>
  );
}

function SunGlow({ progress }: Props) {
  const ref = useRef<THREE.Group>(null);
  useFrame(() => {
    if (!ref.current) return;
    const p = progress.current;
    ref.current.position.set(-16 + p * 32, -2 + Math.sin(p * Math.PI) * 13, -20);
  });
  return (
    <group ref={ref}>
      <Billboard>
        <mesh>
          <circleGeometry args={[1.1, 32]} />
          <meshBasicMaterial color="#fff1c4" transparent opacity={0.9} />
        </mesh>
        <mesh>
          <circleGeometry args={[3.2, 32]} />
          <meshBasicMaterial color="#ffcf7a" transparent opacity={0.18} depthWrite={false} />
        </mesh>
      </Billboard>
    </group>
  );
}

// Lightweight procedural cloud — three overlapping soft billboarded discs.
function CloudPuff({
  progress,
  position,
  scale = 1,
  drift = 1.5,
}: Props & { position: [number, number, number]; scale?: number; drift?: number }) {
  const ref = useRef<THREE.Group>(null);
  const baseX = position[0];
  useFrame((state) => {
    if (!ref.current) return;
    const t = state.clock.elapsedTime;
    ref.current.position.x = baseX + Math.sin(t * 0.03) * 1.5 + (progress.current - 0.5) * drift;
  });
  return (
    <group ref={ref} position={position} scale={scale}>
      <Billboard>
        <mesh position={[-0.7, 0, 0]}>
          <circleGeometry args={[1.1, 20]} />
          <meshBasicMaterial color="#ffffff" transparent opacity={0.22} depthWrite={false} />
        </mesh>
        <mesh position={[0.6, 0.15, 0]}>
          <circleGeometry args={[0.9, 20]} />
          <meshBasicMaterial color="#ffffff" transparent opacity={0.2} depthWrite={false} />
        </mesh>
        <mesh position={[0, 0.35, 0]}>
          <circleGeometry args={[1.3, 20]} />
          <meshBasicMaterial color="#ffffff" transparent opacity={0.18} depthWrite={false} />
        </mesh>
      </Billboard>
    </group>
  );
}

function StarField({ progress, count = 1600 }: Props & { count?: number }) {
  const positions = useMemo(() => {
    const arr = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      const r = 30 + Math.random() * 20;
      const t = Math.random() * Math.PI * 2;
      const p = Math.acos(THREE.MathUtils.lerp(0.15, 1, Math.random()));
      arr[i * 3 + 0] = r * Math.sin(p) * Math.cos(t);
      arr[i * 3 + 1] = Math.abs(r * Math.cos(p)) * 0.6 + 4;
      arr[i * 3 + 2] = r * Math.sin(p) * Math.sin(t) - 20;
    }
    return arr;
  }, [count]);

  const matRef = useRef<THREE.PointsMaterial>(null);
  useFrame(() => {
    if (!matRef.current) return;
    // Stars fade in at dawn/dusk (progress near 0 or 1), fade out at midday
    // — inverse of the sun's height arc (sin(progress*PI)) used in Sky/SunGlow.
    const sunHeight = Math.sin(progress.current * Math.PI);
    matRef.current.opacity = THREE.MathUtils.clamp(0.55 - sunHeight * 0.65, 0, 0.55);
  });

  return (
    <Points positions={positions} stride={3} frustumCulled>
      <PointMaterial
        ref={matRef}
        transparent
        size={0.045}
        sizeAttenuation
        depthWrite={false}
        color="#ffffff"
        opacity={0.35}
      />
    </Points>
  );
}

// Shared flat ground plane — keeps the sky's horizon glow from showing
// through underneath whichever zone is active.
function Ground({
  weightRef,
  color = "#12141f",
  y = -1.65,
}: {
  weightRef: React.MutableRefObject<number>;
  color?: string;
  y?: number;
}) {
  const meshRef = useRef<THREE.Mesh>(null);
  const material = useMemo(
    () => new THREE.MeshBasicMaterial({ color, transparent: true, opacity: 0 }),
    [color],
  );
  useFrame(() => {
    const w = weightRef.current;
    material.opacity = w;
    if (meshRef.current) meshRef.current.visible = w > 0.015;
  });
  return (
    <mesh ref={meshRef} position={[0, y, 0]} rotation={[-Math.PI / 2, 0, 0]} material={material}>
      <planeGeometry args={[130, 70]} />
    </mesh>
  );
}

/* ──────────────────── LANDING: INTERACTIVE RAIN / MIST ─────────────────── */

// Tracks pointer position at the window level (not the canvas) so this still
// works even though the WebGL background has pointer-events:none — the site
// stays click-through everywhere except this one effect.
function useGlobalPointerNDC() {
  const ndc = useRef(new THREE.Vector2(0, 0));
  const active = useRef(false);
  useEffect(() => {
    const setFromClient = (x: number, y: number) => {
      ndc.current.x = (x / window.innerWidth) * 2 - 1;
      ndc.current.y = -(y / window.innerHeight) * 2 + 1;
    };
    const onMove = (e: PointerEvent) => {
      setFromClient(e.clientX, e.clientY);
      active.current = true;
    };
    const onLeave = () => {
      active.current = false;
    };
    const onTouchMove = (e: TouchEvent) => {
      if (e.touches.length > 0) {
        setFromClient(e.touches[0].clientX, e.touches[0].clientY);
        active.current = true;
      }
    };
    window.addEventListener("pointermove", onMove, { passive: true });
    window.addEventListener("pointerleave", onLeave, { passive: true });
    window.addEventListener("touchmove", onTouchMove, { passive: true });
    window.addEventListener("touchend", onLeave, { passive: true });
    window.addEventListener("touchcancel", onLeave, { passive: true });
    return () => {
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerleave", onLeave);
      window.removeEventListener("touchmove", onTouchMove);
      window.removeEventListener("touchend", onLeave);
      window.removeEventListener("touchcancel", onLeave);
    };
  }, []);
  return { ndc, active };
}

// A field of soft rain/mist motes over the hero — they sit still at rest and
// only drift when the pointer (mouse hover or an active touch) comes near,
// easing back to rest once it moves away.
const RAIN_COUNT = 240;

function RainParticles({ progress }: Props) {
  const { camera } = useThree();
  const { ndc, active } = useGlobalPointerNDC();
  const pointsRef = useRef<THREE.Points>(null);
  const materialRef = useRef<THREE.PointsMaterial>(null);

  const { rest, positions, offsets } = useMemo(() => {
    const rest = new Float32Array(RAIN_COUNT * 3);
    const positions = new Float32Array(RAIN_COUNT * 3);
    for (let i = 0; i < RAIN_COUNT; i++) {
      const x = (Math.random() - 0.5) * 24;
      const y = (Math.random() - 0.5) * 15 + 3;
      const z = -2 - Math.random() * 10;
      rest[i * 3] = x;
      rest[i * 3 + 1] = y;
      rest[i * 3 + 2] = z;
      positions[i * 3] = x;
      positions[i * 3 + 1] = y;
      positions[i * 3 + 2] = z;
    }
    return { rest, positions, offsets: new Float32Array(RAIN_COUNT * 2) };
  }, []);

  const raycaster = useMemo(() => new THREE.Raycaster(), []);
  const pointerPlane = useMemo(() => new THREE.Plane(new THREE.Vector3(0, 0, 1), 6), []);
  const hitPoint = useMemo(() => new THREE.Vector3(), []);

  const RADIUS = 2.3;
  const MAX_PUSH = 1.15;

  useFrame(() => {
    const w = zoneWeight(progress.current, ...ZONES.rain);
    if (pointsRef.current) pointsRef.current.visible = w > 0.015;
    if (materialRef.current) materialRef.current.opacity = w * 0.5;

    let hasPointer = false;
    if (active.current && w > 0.015) {
      raycaster.setFromCamera(ndc.current, camera);
      hasPointer = !!raycaster.ray.intersectPlane(pointerPlane, hitPoint);
    }

    const posAttr = pointsRef.current?.geometry.attributes.position as THREE.BufferAttribute | undefined;
    if (!posAttr) return;

    for (let i = 0; i < RAIN_COUNT; i++) {
      let targetX = 0;
      let targetY = 0;
      if (hasPointer) {
        const rx = rest[i * 3] - hitPoint.x;
        const ry = rest[i * 3 + 1] - hitPoint.y;
        const dist = Math.hypot(rx, ry);
        if (dist > 0.0001 && dist < RADIUS) {
          const push = (1 - dist / RADIUS) * MAX_PUSH;
          targetX = (rx / dist) * push;
          targetY = (ry / dist) * push;
        }
      }
      const ox = offsets[i * 2] + (targetX - offsets[i * 2]) * 0.12;
      const oy = offsets[i * 2 + 1] + (targetY - offsets[i * 2 + 1]) * 0.12;
      offsets[i * 2] = ox;
      offsets[i * 2 + 1] = oy;
      (posAttr.array as Float32Array)[i * 3] = rest[i * 3] + ox;
      (posAttr.array as Float32Array)[i * 3 + 1] = rest[i * 3 + 1] + oy;
    }
    posAttr.needsUpdate = true;
  });

  return (
    <points ref={pointsRef}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" count={RAIN_COUNT} array={positions} itemSize={3} />
      </bufferGeometry>
      <pointsMaterial
        ref={materialRef}
        transparent
        size={0.065}
        sizeAttenuation
        depthWrite={false}
        color="#dce8ff"
        opacity={0}
      />
    </points>
  );
}

/* ──────────────── ZONE 1: 3D GLOBE — SA → CYPRUS → UK FLIGHT ───────────── */

// Gentle camera bob + sway, active only while the globe zone is on screen —
// this is what sells the "floating" feeling as you scroll.
function CameraFloat({ progress }: Props) {
  const baseY = 0.6;
  useFrame((state) => {
    const w = zoneWeight(progress.current, ...ZONES.globe);
    const t = state.clock.elapsedTime;
    state.camera.position.y = baseY + Math.sin(t * 0.55) * 0.22 * w;
    state.camera.position.x = Math.sin(t * 0.32) * 0.16 * w;
    state.camera.rotation.z = Math.sin(t * 0.4) * 0.014 * w;
  });
  return null;
}

const GLOBE_RADIUS = 4.3;

// Real coordinates for the education journey this globe traces.
const CITIES = {
  sa: { lat: -29.55, lon: 30.28, color: "#CF2626" }, // Hilton, South Africa
  cy: { lat: 35.13, lon: 33.94, color: "#498C40" }, // Famagusta, Cyprus
  uk: { lat: 51.38, lon: -2.36, color: "#FFD700" }, // Bath, United Kingdom
} as const;

function latLonToVec3(lat: number, lon: number, radius: number) {
  const phi = (90 - lat) * (Math.PI / 180);
  const theta = (lon + 180) * (Math.PI / 180);
  return new THREE.Vector3(
    -radius * Math.sin(phi) * Math.cos(theta),
    radius * Math.cos(phi),
    radius * Math.sin(phi) * Math.sin(theta),
  );
}

// JS port of the globe shader's hash/noise/fbm — used once at build time to
// decide where to scatter the instanced "land" dots, so they line up with
// the shaded landmasses instead of scattering randomly over open ocean.
function hashJS(x: number, y: number) {
  const s = Math.sin(x * 127.1 + y * 311.7) * 43758.5453;
  return s - Math.floor(s);
}
function noiseJS(x: number, y: number) {
  const ix = Math.floor(x);
  const iy = Math.floor(y);
  const fx = x - ix;
  const fy = y - iy;
  const a = hashJS(ix, iy);
  const b = hashJS(ix + 1, iy);
  const c = hashJS(ix, iy + 1);
  const d = hashJS(ix + 1, iy + 1);
  const ux = fx * fx * (3 - 2 * fx);
  const uy = fy * fy * (3 - 2 * fy);
  return a * (1 - ux) * (1 - uy) + b * ux * (1 - uy) + c * (1 - ux) * uy + d * ux * uy;
}
function fbmJS(x: number, y: number) {
  let v = 0;
  let amp = 0.5;
  let px = x;
  let py = y;
  for (let i = 0; i < 5; i++) {
    v += amp * noiseJS(px, py);
    const nx = 0.8 * px + 0.6 * py;
    const ny = -0.6 * px + 0.8 * py;
    px = nx * 2 + 10;
    py = ny * 2 + 10;
    amp *= 0.5;
  }
  return v;
}

// Scatters a THREE.InstancedMesh of small glowing dots over the globe's
// landmasses (Fibonacci-sphere sampling + the same fbm mask as the shader).
function buildLandInstances(radius: number) {
  const N = 3400;
  const golden = Math.PI * (3 - Math.sqrt(5));
  const points: THREE.Vector3[] = [];
  for (let i = 0; i < N; i++) {
    const y = 1 - (i / (N - 1)) * 2;
    const r = Math.sqrt(Math.max(0, 1 - y * y));
    const theta = golden * i;
    const x = Math.cos(theta) * r;
    const z = Math.sin(theta) * r;
    const u = 0.5 + Math.atan2(z, x) / (2 * Math.PI);
    const v = 0.5 - Math.asin(THREE.MathUtils.clamp(y, -1, 1)) / Math.PI;
    if (fbmJS(u * 6, v * 3) > 0.52) {
      points.push(new THREE.Vector3(x, y, z).multiplyScalar(radius * 1.015));
    }
  }
  const capped = points.slice(0, 560);
  const geometry = new THREE.SphereGeometry(0.045, 6, 6);
  const material = new THREE.MeshBasicMaterial({
    color: "#ffe9a8",
    transparent: true,
    opacity: 0,
    depthWrite: false,
  });
  const mesh = new THREE.InstancedMesh(geometry, material, capped.length);
  mesh.frustumCulled = false;
  const dummy = new THREE.Object3D();
  capped.forEach((p, i) => {
    dummy.position.copy(p);
    dummy.scale.setScalar(0.6 + Math.random() * 0.9);
    dummy.updateMatrix();
    mesh.setMatrixAt(i, dummy.matrix);
  });
  mesh.instanceMatrix.needsUpdate = true;
  return mesh;
}

// Spherical-linear-interpolated great-circle arc between two points on the
// globe, lifted outward mid-arc so it reads as a flight path.
function greatCircleCurve(a: THREE.Vector3, b: THREE.Vector3, radius: number, arcHeight: number, segments = 48) {
  const an = a.clone().normalize();
  const bn = b.clone().normalize();
  const angle = an.angleTo(bn);
  const pts: THREE.Vector3[] = [];
  for (let i = 0; i <= segments; i++) {
    const t = i / segments;
    const sinAngle = Math.sin(angle);
    const w1 = sinAngle < 1e-6 ? 1 - t : Math.sin((1 - t) * angle) / sinAngle;
    const w2 = sinAngle < 1e-6 ? t : Math.sin(t * angle) / sinAngle;
    const dir = new THREE.Vector3(
      an.x * w1 + bn.x * w2,
      an.y * w1 + bn.y * w2,
      an.z * w1 + bn.z * w2,
    ).normalize();
    const h = radius + Math.sin(t * Math.PI) * arcHeight;
    pts.push(dir.multiplyScalar(h));
  }
  return new THREE.CatmullRomCurve3(pts);
}

const GLOBE_VERTEX_SHADER = `
  varying vec2 vUv;
  varying vec3 vViewNormal;
  void main(){
    vUv = uv;
    vViewNormal = normalize(normalMatrix * normal);
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

// Stylised globe: abstract fbm landmasses over a dark ocean, plus a fresnel
// rim glow — deliberately not a real map texture (no external asset risk).
const GLOBE_FRAGMENT_SHADER = `
  varying vec2 vUv;
  varying vec3 vViewNormal;
  uniform float uTime;
  uniform float uOpacity;
  uniform vec3 uOcean;
  uniform vec3 uLand;
  uniform vec3 uGlow;

  float hash(vec2 p){ return fract(sin(dot(p, vec2(127.1,311.7))) * 43758.5453); }
  float noise(vec2 p){
    vec2 i = floor(p);
    vec2 f = fract(p);
    float a = hash(i);
    float b = hash(i + vec2(1.0, 0.0));
    float c = hash(i + vec2(0.0, 1.0));
    float d = hash(i + vec2(1.0, 1.0));
    vec2 u = f * f * (3.0 - 2.0 * f);
    return mix(a, b, u.x) + (c - a) * u.y * (1.0 - u.x) + (d - b) * u.x * u.y;
  }
  float fbm(vec2 p){
    float v = 0.0;
    float a = 0.5;
    mat2 rot = mat2(0.8, 0.6, -0.6, 0.8);
    for (int i = 0; i < 5; i++) {
      v += a * noise(p);
      p = rot * p * 2.0 + 10.0;
      a *= 0.5;
    }
    return v;
  }

  void main(){
    vec2 p = vUv * vec2(6.0, 3.0);
    float land = fbm(p + uTime * 0.008);
    vec3 col = mix(uOcean, uLand, smoothstep(0.46, 0.58, land));
    float rim = pow(clamp(1.0 - abs(vViewNormal.z), 0.0, 1.0), 2.5);
    col += uGlow * rim * 0.65;
    gl_FragColor = vec4(col, uOpacity);
  }
`;

function GlobeZone({ progress }: Props) {
  const weightRef = useRef(0);
  const groupRef = useRef<THREE.Group>(null);
  const rotateRef = useRef<THREE.Group>(null);
  const planeRef = useRef<THREE.Group>(null);

  const globeMaterial = useMemo(
    () =>
      new THREE.ShaderMaterial({
        transparent: true,
        uniforms: {
          uTime: { value: 0 },
          uOpacity: { value: 0 },
          uOcean: { value: new THREE.Color("#0a1626") },
          uLand: { value: new THREE.Color("#3f7a38") },
          uGlow: { value: new THREE.Color("#ffd700") },
        },
        vertexShader: GLOBE_VERTEX_SHADER,
        fragmentShader: GLOBE_FRAGMENT_SHADER,
      }),
    [],
  );

  const gridMaterial = useMemo(
    () =>
      new THREE.MeshBasicMaterial({
        color: "#ffe9a8",
        wireframe: true,
        transparent: true,
        opacity: 0,
        depthWrite: false,
      }),
    [],
  );

  const pathMaterial = useMemo(
    () => new THREE.MeshBasicMaterial({ color: "#ffd700", transparent: true, opacity: 0, depthWrite: false }),
    [],
  );

  const landDots = useMemo(() => buildLandInstances(GLOBE_RADIUS), []);

  const pinPositions = useMemo(
    () => ({
      sa: latLonToVec3(CITIES.sa.lat, CITIES.sa.lon, GLOBE_RADIUS),
      cy: latLonToVec3(CITIES.cy.lat, CITIES.cy.lon, GLOBE_RADIUS),
      uk: latLonToVec3(CITIES.uk.lat, CITIES.uk.lon, GLOBE_RADIUS),
    }),
    [],
  );

  const legs = useMemo(
    () => [
      greatCircleCurve(pinPositions.sa, pinPositions.cy, GLOBE_RADIUS, 1.1),
      greatCircleCurve(pinPositions.cy, pinPositions.uk, GLOBE_RADIUS, 1.1),
    ],
    [pinPositions],
  );

  const tubeGeometries = useMemo(
    () => legs.map((curve) => new THREE.TubeGeometry(curve, 80, 0.09, 8, false)),
    [legs],
  );

  const pinMaterials = useMemo(
    () => ({
      sa: new THREE.MeshBasicMaterial({ color: CITIES.sa.color, transparent: true, opacity: 0, depthWrite: false }),
      cy: new THREE.MeshBasicMaterial({ color: CITIES.cy.color, transparent: true, opacity: 0, depthWrite: false }),
      uk: new THREE.MeshBasicMaterial({ color: CITIES.uk.color, transparent: true, opacity: 0, depthWrite: false }),
    }),
    [],
  );

  const planeMaterial = useMemo(
    () => new THREE.MeshBasicMaterial({ color: "#fff6d8", transparent: true, opacity: 0, depthWrite: false }),
    [],
  );
  const planeGlowMaterial = useMemo(
    () => new THREE.MeshBasicMaterial({ color: "#ffd700", transparent: true, opacity: 0, depthWrite: false }),
    [],
  );

  const LEG_DURATION = 6; // seconds per leg
  const GAP = 0.7; // pause (plane hidden) at the loop point
  const CYCLE = LEG_DURATION * 2 + GAP;

  useFrame((state) => {
    weightRef.current = zoneWeight(progress.current, ...ZONES.globe);
    const w = weightRef.current;
    if (groupRef.current) groupRef.current.visible = w > 0.015;
    if (rotateRef.current) rotateRef.current.rotation.y = state.clock.elapsedTime * 0.055;

    globeMaterial.uniforms.uTime.value = state.clock.elapsedTime;
    globeMaterial.uniforms.uOpacity.value = w;
    gridMaterial.opacity = w * 0.2;
    (landDots.material as THREE.MeshBasicMaterial).opacity = w * 0.85;
    landDots.visible = w > 0.015;
    pathMaterial.opacity = w;
    pinMaterials.sa.opacity = w;
    pinMaterials.cy.opacity = w;
    pinMaterials.uk.opacity = w;

    // continuous flight loop — SA -> Cyprus -> UK -> (fade) -> repeat
    const tCycle = state.clock.elapsedTime % CYCLE;
    let legIndex = -1;
    let legT = 0;
    if (tCycle < LEG_DURATION) {
      legIndex = 0;
      legT = tCycle / LEG_DURATION;
    } else if (tCycle < LEG_DURATION * 2) {
      legIndex = 1;
      legT = (tCycle - LEG_DURATION) / LEG_DURATION;
    }

    if (legIndex === -1) {
      planeMaterial.opacity = 0;
      planeGlowMaterial.opacity = 0;
    } else if (planeRef.current) {
      const curve = legs[legIndex];
      const clampedT = THREE.MathUtils.clamp(legT, 0, 1);
      const pos = curve.getPointAt(clampedT);
      const tangent = curve.getTangentAt(THREE.MathUtils.clamp(legT, 0.001, 0.999));
      planeRef.current.position.copy(pos);
      planeRef.current.quaternion.setFromUnitVectors(
        new THREE.Vector3(0, 1, 0),
        tangent.clone().normalize(),
      );
      const edgeFade = Math.min(1, legT / 0.06, (1 - legT) / 0.06);
      const fadeAmt = THREE.MathUtils.clamp(edgeFade, 0, 1);
      planeMaterial.opacity = w * fadeAmt;
      planeGlowMaterial.opacity = w * 0.55 * fadeAmt;
    }
  });

  return (
    <group ref={groupRef} position={[0, -0.1, -14]}>
      {/* the globe surface — rotates in place; texture only, so the flight
          path below never gets carried around to the back of the sphere */}
      <group ref={rotateRef}>
        <mesh material={globeMaterial}>
          <sphereGeometry args={[GLOBE_RADIUS, 48, 32]} />
        </mesh>
        {/* holographic lat/long grid */}
        <mesh material={gridMaterial} scale={1.01}>
          <sphereGeometry args={[GLOBE_RADIUS, 24, 16]} />
        </mesh>
        {/* instanced dot-matrix landmasses */}
        <primitive object={landDots} />
      </group>
      {/* flight path arcs — fixed, always front-facing */}
      {tubeGeometries.map((geo, i) => (
        <mesh key={i} geometry={geo} material={pathMaterial} />
      ))}
      {/* city markers */}
      {(Object.keys(CITIES) as (keyof typeof CITIES)[]).map((key) => (
        <mesh key={key} position={pinPositions[key]} material={pinMaterials[key]}>
          <sphereGeometry args={[0.3, 16, 16]} />
        </mesh>
      ))}
      {/* the plane */}
      <group ref={planeRef}>
        <mesh material={planeMaterial}>
          <coneGeometry args={[0.16, 0.55, 3]} />
        </mesh>
        <Billboard>
          <mesh material={planeGlowMaterial}>
            <circleGeometry args={[0.55, 16]} />
          </mesh>
        </Billboard>
      </group>
    </group>
  );
}

/* ────────────────────────── ZONE 3: ROMAN BATHS ────────────────────────── */

function RomanBathsZone({ progress }: Props) {
  const weightRef = useRef(0);
  const groupRef = useRef<THREE.Group>(null);

  const stoneMaterial = useMemo(
    () => new THREE.MeshStandardMaterial({ color: "#cba36c", roughness: 0.9, transparent: true, opacity: 0 }),
    [],
  );
  const terraceMaterial = useMemo(
    () => new THREE.MeshStandardMaterial({ color: "#a9814f", roughness: 1, transparent: true, opacity: 0 }),
    [],
  );

  const waterUniforms = useMemo(
    () => ({
      uTime: { value: 0 },
      uOpacity: { value: 0 },
      uColorDeep: { value: new THREE.Color("#1f5f52") },
      uColorShallow: { value: new THREE.Color("#5cab86") },
      uSunColor: { value: new THREE.Color("#ffe3a3") },
    }),
    [],
  );

  const columnXs = useMemo(() => {
    const arr: number[] = [];
    for (let i = -5; i <= 5; i++) arr.push(i * 2.7);
    return arr;
  }, []);

  useFrame((state) => {
    weightRef.current = zoneWeight(progress.current, ...ZONES.romanBaths);
    const w = weightRef.current;
    if (groupRef.current) groupRef.current.visible = w > 0.015;
    stoneMaterial.opacity = w;
    terraceMaterial.opacity = w;
    waterUniforms.uTime.value = state.clock.elapsedTime;
    waterUniforms.uOpacity.value = w * 0.94;
  });

  return (
    <group ref={groupRef} position={[0, -1.6, -13]}>
      {/* terrace floor */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.02, 4]} material={terraceMaterial}>
        <planeGeometry args={[60, 34]} />
      </mesh>
      {/* the Great Bath — still, warm, mineral-green water */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.02, 4]}>
        <planeGeometry args={[19, 8, 32, 16]} />
        <shaderMaterial
          transparent
          uniforms={waterUniforms}
          vertexShader={`
            varying vec2 vUv;
            varying float vHeight;
            uniform float uTime;
            void main(){
              vUv = uv;
              vec3 pos = position;
              float wave = sin(pos.x * 0.5 + uTime * 0.35) * 0.03
                         + sin(pos.y * 0.7 + uTime * 0.25) * 0.02;
              pos.z += wave;
              vHeight = wave;
              gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);
            }
          `}
          fragmentShader={`
            varying vec2 vUv;
            varying float vHeight;
            uniform float uTime;
            uniform float uOpacity;
            uniform vec3 uColorDeep;
            uniform vec3 uColorShallow;
            uniform vec3 uSunColor;
            float hash(vec2 p){ return fract(sin(dot(p, vec2(127.1,311.7))) * 43758.5453); }
            void main(){
              vec3 col = mix(uColorDeep, uColorShallow, smoothstep(-0.03, 0.05, vHeight));
              float shimmer = hash(floor(vUv * 220.0 + uTime * 1.5));
              float mask = smoothstep(0.98, 1.0, shimmer);
              col += uSunColor * mask * 0.9;
              gl_FragColor = vec4(col, uOpacity);
            }
          `}
        />
      </mesh>
      {/* colonnade */}
      {columnXs.map((x, i) => (
        <mesh key={i} position={[x, 3, -8]} material={stoneMaterial}>
          <cylinderGeometry args={[0.4, 0.48, 6, 12]} />
        </mesh>
      ))}
      {/* architrave beam */}
      <mesh position={[0, 6.1, -8]} material={stoneMaterial}>
        <boxGeometry args={[29.5, 0.5, 1.1]} />
      </mesh>
      {/* shallow pediment gable */}
      <mesh position={[0, 7.7, -8.2]} scale={[1, 1, 0.16]} material={stoneMaterial}>
        <coneGeometry args={[8.6, 2.6, 3]} />
      </mesh>
      <Ground weightRef={weightRef} color="#8a6a42" y={-1.6} />
    </group>
  );
}

/* ─────────────────────────────── SCENE ─────────────────────────────────── */

export function ImmersiveScene({ progress }: Props) {
  return (
    <Canvas
      dpr={[1, 1.6]}
      camera={{ position: [0, 0.6, 8], fov: 50 }}
      gl={{ antialias: true, powerPreference: "high-performance" }}
    >
      <fog attach="fog" args={["#7a8cb0", 14, 42]} />
      <ambientLight intensity={0.7} />
      <directionalLight position={[-6, 6, 4]} intensity={1.3} color="#ffe9c4" />
      <CameraFloat progress={progress} />
      <Sky progress={progress} />
      <StarField progress={progress} />
      <SunGlow progress={progress} />
      <CloudPuff progress={progress} position={[-6, 4.5, -18]} scale={1.4} drift={2} />
      <CloudPuff progress={progress} position={[7, 3, -24]} scale={1.8} drift={3.5} />
      <RainParticles progress={progress} />
      <GlobeZone progress={progress} />
      <RomanBathsZone progress={progress} />
    </Canvas>
  );
}
