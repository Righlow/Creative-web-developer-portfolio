import { useMemo, useRef } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { Points, PointMaterial, Billboard } from "@react-three/drei";
import * as THREE from "three";

/**
 * Immersive mountain-range background. The `progress` ref (0..1) tracks
 * scroll through the page and drives a full dawn -> day -> golden hour -> dusk
 * cycle: the sun arcs across the sky, the sky/fog colors shift, and the three
 * ridgelines drift at different speeds for parallax depth.
 */
type Props = { progress: React.MutableRefObject<number> };

// ---- deterministic value-noise (no external deps, mirrors the hash()
// pattern already used in the fragment shaders elsewhere in this project) ----
function hash(x: number, z: number) {
  const s = Math.sin(x * 127.1 + z * 311.7) * 43758.5453;
  return s - Math.floor(s);
}
function noise2D(x: number, z: number) {
  const xi = Math.floor(x);
  const zi = Math.floor(z);
  const xf = x - xi;
  const zf = z - zi;
  const a = hash(xi, zi);
  const b = hash(xi + 1, zi);
  const c = hash(xi, zi + 1);
  const d = hash(xi + 1, zi + 1);
  const u = xf * xf * (3 - 2 * xf);
  const v = zf * zf * (3 - 2 * zf);
  return THREE.MathUtils.lerp(THREE.MathUtils.lerp(a, b, u), THREE.MathUtils.lerp(c, d, u), v);
}
// Ridged fractal noise — folds the noise so valleys become sharp peaks,
// giving a proper mountain-ridge silhouette instead of rolling hills.
function ridgedNoise(x: number, z: number, octaves: number) {
  let total = 0;
  let amp = 0.5;
  let freq = 1;
  let max = 0;
  for (let i = 0; i < octaves; i++) {
    let n = 1 - Math.abs(noise2D(x * freq, z * freq) * 2 - 1);
    n *= n;
    total += n * amp;
    max += amp;
    amp *= 0.5;
    freq *= 2;
  }
  return total / max;
}

// Sky palette stops: [top of sky, horizon glow] at each stage of the scroll.
const SKY_STOPS: [string, string][] = [
  ["#2c4372", "#f0a184"], // dawn — cool zenith, warm horizon
  ["#3a6ea8", "#bfe3ec"], // clear morning
  ["#5b9bd5", "#fbe0a6"], // midday haze
  ["#3d4f8a", "#f2955e"], // golden hour
  ["#232853", "#6b4372"], // dusk
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

type RidgeConfig = {
  z: number;
  width: number;
  depth: number;
  segments: number;
  seed: number;
  peakHeight: number;
  baseColorLow: string;
  baseColorHigh: string;
  snowLine?: number;
  parallax: number;
};

function Ridge({ progress, config }: { progress: React.MutableRefObject<number>; config: RidgeConfig }) {
  const groupRef = useRef<THREE.Group>(null);
  const { geometry, material } = useMemo(() => {
    const { width, depth, segments, seed, peakHeight, baseColorLow, baseColorHigh, snowLine } = config;
    const geo = new THREE.PlaneGeometry(width, depth, segments, Math.max(4, Math.floor(segments / 4)));
    const pos = geo.attributes.position as THREE.BufferAttribute;
    const colors = new Float32Array(pos.count * 3);
    const low = new THREE.Color(baseColorLow);
    const high = new THREE.Color(baseColorHigh);
    const snow = new THREE.Color("#f4f7fb");
    const tmp = new THREE.Color();

    for (let i = 0; i < pos.count; i++) {
      const x = pos.getX(i);
      const y = pos.getY(i); // pre-rotation, this becomes world Z (depth)
      // Ridge gets taller/sharper toward the front (y near depth/2) and settles
      // toward a flat horizon line at the back, so ranges recede naturally.
      const recede = THREE.MathUtils.smoothstep(y, -depth / 2, depth / 2 - depth * 0.15);
      const n = ridgedNoise((x + seed * 97) * 0.06, (y + seed * 53) * 0.09, 5);
      const height = n * peakHeight * (0.35 + 0.65 * recede);
      pos.setZ(i, height);

      const t = THREE.MathUtils.clamp(height / peakHeight, 0, 1);
      tmp.copy(low).lerp(high, t);
      if (snowLine && t > snowLine) {
        tmp.lerp(snow, THREE.MathUtils.smoothstep(t, snowLine, snowLine + 0.18));
      }
      colors[i * 3] = tmp.r;
      colors[i * 3 + 1] = tmp.g;
      colors[i * 3 + 2] = tmp.b;
    }
    geo.setAttribute("color", new THREE.BufferAttribute(colors, 3));
    geo.computeVertexNormals();

    const mat = new THREE.MeshStandardMaterial({
      vertexColors: true,
      flatShading: true,
      roughness: 1,
      metalness: 0,
    });
    return { geometry: geo, material: mat };
  }, [config]);

  useFrame(() => {
    if (!groupRef.current) return;
    groupRef.current.position.x = (progress.current - 0.5) * config.parallax;
  });

  return (
    <group ref={groupRef} position={[0, -1.6, config.z]}>
      <mesh geometry={geometry} material={material} rotation={[-Math.PI / 2, 0, 0]} />
    </group>
  );
}

const RIDGES: RidgeConfig[] = [
  {
    z: -26,
    width: 90,
    depth: 26,
    segments: 48,
    seed: 11,
    peakHeight: 6.5,
    baseColorLow: "#5b6f9e",
    baseColorHigh: "#c7d2ea",
    parallax: 3,
  },
  {
    z: -15,
    width: 80,
    depth: 22,
    segments: 64,
    seed: 42,
    peakHeight: 7.5,
    baseColorLow: "#3c4d70",
    baseColorHigh: "#8a9bc4",
    parallax: 6.5,
  },
  {
    z: -6,
    width: 70,
    depth: 20,
    segments: 96,
    seed: 7,
    peakHeight: 8.5,
    baseColorLow: "#232a3d",
    baseColorHigh: "#57607a",
    snowLine: 0.72,
    parallax: 11,
  },
];

// Lightweight procedural cloud — three overlapping soft billboarded discs.
// Avoids drei's <Cloud>, which needs a <Clouds> context and fetches its puff
// texture from an external CDN; everything else in this scene is procedural.
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

// Fills the gap below the ridge bases — the ridges only rise above their
// base line, so without this the sky's horizon glow shows through underneath.
function ValleyFloor() {
  return (
    <mesh position={[0, -1.65, 0]} rotation={[-Math.PI / 2, 0, 0]}>
      <planeGeometry args={[120, 70]} />
      <meshBasicMaterial color="#12141f" />
    </mesh>
  );
}

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
      <Sky progress={progress} />
      <StarField progress={progress} />
      <SunGlow progress={progress} />
      <CloudPuff progress={progress} position={[-6, 4.5, -18]} scale={1.4} drift={2} />
      <CloudPuff progress={progress} position={[7, 3, -24]} scale={1.8} drift={3.5} />
      <ValleyFloor />
      {RIDGES.map((cfg) => (
        <Ridge key={cfg.z} progress={progress} config={cfg} />
      ))}
    </Canvas>
  );
}
