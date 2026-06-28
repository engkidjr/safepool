import { useRef, useMemo, useState, useEffect, Component, type ReactNode } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import {
  Float,
  Environment,
  Stars,
  Sparkles,
} from "@react-three/drei";
import * as THREE from "three";
import { useApp } from "@/lib/store";
import Antigravity from "@/components/Antigravity";
import Galaxy from "@/components/Galaxy";
import LiquidEther from "@/components/LiquidEther";

/* ─── Crystal shard geometry ─── */
function CrystalShard({
  position,
  rotation,
  scale,
  color,
  delay = 0,
}: {
  position: [number, number, number];
  rotation: [number, number, number];
  scale: number;
  color: string;
  delay?: number;
}) {
  const ref = useRef<THREE.Mesh>(null!);
  const [grown, setGrown] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setGrown(true), delay);
    return () => clearTimeout(timer);
  }, [delay]);

  useFrame((state) => {
    if (!ref.current) return;
    const t = state.clock.elapsedTime;

    // Growth animation
    const targetScale = grown ? scale : 0.01;
    ref.current.scale.lerp(
      new THREE.Vector3(targetScale, targetScale * 1.8, targetScale),
      0.03
    );

    // Subtle breathing rotation
    ref.current.rotation.y = rotation[1] + Math.sin(t * 0.3 + delay) * 0.05;
    ref.current.rotation.z = rotation[2] + Math.cos(t * 0.2 + delay) * 0.03;
  });

  return (
    <mesh ref={ref} position={position} rotation={rotation} scale={0.01}>
      <octahedronGeometry args={[1, 0]} />
      <meshPhysicalMaterial
        color={color}
        roughness={0.1}
        metalness={0.1}
        transmission={0.9}
        ior={1.5}
        thickness={1.0}
        transparent
        opacity={0.9}
        clearcoat={1.0}
        clearcoatRoughness={0.1}
      />
    </mesh>
  );
}

/* ─── Growing crystal cluster with customizable palette ─── */
function CrystalCluster({ primaryColor }: { primaryColor: string }) {
  const groupRef = useRef<THREE.Group>(null!);

  // Generate crystal shard configurations
  const shards = useMemo(() => {
    const configs = [];
    const baseColor = new THREE.Color(primaryColor);
    
    // Generate a harmonious palette from the primary color
    const colors = [
      primaryColor,
      "#" + baseColor.clone().offsetHSL(0.05, 0.1, 0.1).getHexString(),  // slightly warmer
      "#" + baseColor.clone().offsetHSL(-0.05, -0.1, -0.05).getHexString(), // slightly cooler
      "#" + baseColor.clone().offsetHSL(0.1, 0.2, 0.0).getHexString(),    // more saturated accent
      "#" + baseColor.clone().offsetHSL(-0.1, 0.0, 0.15).getHexString(),  // pastel accent
      "#ffffff", // pure white reflection shard
    ];

    // Center large crystal
    configs.push({
      position: [0, 0, 0] as [number, number, number],
      rotation: [0, 0, 0] as [number, number, number],
      scale: 0.6,
      color: colors[0],
      delay: 200,
    });

    // Surrounding crystals in organic pattern
    for (let i = 0; i < 12; i++) {
      const angle = (i / 12) * Math.PI * 2 + Math.random() * 0.5;
      const radius = 0.8 + Math.random() * 1.2;
      const height = -0.3 + Math.random() * 0.8;
      const tilt = (Math.random() - 0.5) * 0.8;

      configs.push({
        position: [
          Math.cos(angle) * radius,
          height,
          Math.sin(angle) * radius,
        ] as [number, number, number],
        rotation: [
          tilt,
          angle + Math.PI * 0.5,
          (Math.random() - 0.5) * 0.4,
        ] as [number, number, number],
        scale: 0.15 + Math.random() * 0.35,
        color: colors[Math.floor(Math.random() * colors.length)],
        delay: 400 + i * 150,
      });
    }

    // Tiny accent crystals
    for (let i = 0; i < 8; i++) {
      const angle = Math.random() * Math.PI * 2;
      const radius = 1.5 + Math.random() * 0.8;
      configs.push({
        position: [
          Math.cos(angle) * radius,
          -0.2 + Math.random() * 0.3,
          Math.sin(angle) * radius,
        ] as [number, number, number],
        rotation: [
          Math.random() * 0.5,
          angle,
          Math.random() * 0.5,
        ] as [number, number, number],
        scale: 0.05 + Math.random() * 0.1,
        color: colors[Math.floor(Math.random() * colors.length)],
        delay: 1800 + i * 100,
      });
    }

    return configs;
  }, [primaryColor]);

  useFrame((state) => {
    if (!groupRef.current) return;
    const t = state.clock.elapsedTime;
    groupRef.current.rotation.y = t * 0.04;
  });

  return (
    <group ref={groupRef}>
      {shards.map((shard, i) => (
        <CrystalShard key={i} {...shard} />
      ))}
    </group>
  );
}

/* ─── Floating energy particles ─── */
function EnergyParticles() {
  const particlesRef = useRef<THREE.Points>(null!);
  const count = 80;

  const [positions, velocities] = useMemo(() => {
    const pos = new Float32Array(count * 3);
    const vel = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      const i3 = i * 3;
      // Start positions in a sphere around crystals
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.random() * Math.PI;
      const r = 1.5 + Math.random() * 2;
      pos[i3] = r * Math.sin(phi) * Math.cos(theta);
      pos[i3 + 1] = -1 + Math.random() * 3;
      pos[i3 + 2] = r * Math.sin(phi) * Math.sin(theta);
      // Upward drift velocities
      vel[i3] = (Math.random() - 0.5) * 0.003;
      vel[i3 + 1] = 0.002 + Math.random() * 0.008;
      vel[i3 + 2] = (Math.random() - 0.5) * 0.003;
    }
    return [pos, vel];
  }, []);

  useFrame(() => {
    if (!particlesRef.current) return;
    const posAttr = particlesRef.current.geometry.getAttribute(
      "position"
    ) as THREE.BufferAttribute;
    const arr = posAttr.array as Float32Array;

    for (let i = 0; i < count; i++) {
      const i3 = i * 3;
      arr[i3] += velocities[i3];
      arr[i3 + 1] += velocities[i3 + 1];
      arr[i3 + 2] += velocities[i3 + 2];

      // Reset particles that float too high
      if (arr[i3 + 1] > 3) {
        arr[i3 + 1] = -1;
        arr[i3] = (Math.random() - 0.5) * 4;
        arr[i3 + 2] = (Math.random() - 0.5) * 4;
      }
    }
    posAttr.needsUpdate = true;
  });

  return (
    <points ref={particlesRef}>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          count={count}
          array={positions}
          itemSize={3}
        />
      </bufferGeometry>
      <pointsMaterial
        size={0.03}
        color="#34d399"
        transparent
        opacity={0.6}
        sizeAttenuation
        blending={THREE.AdditiveBlending}
        depthWrite={false}
      />
    </points>
  );
}

/* ─── Ground glow plane ─── */
function GroundGlow() {
  const ref = useRef<THREE.Mesh>(null!);

  useFrame((state) => {
    if (!ref.current) return;
    const mat = ref.current.material as THREE.MeshBasicMaterial;
    mat.opacity = 0.12 + Math.sin(state.clock.elapsedTime * 0.5) * 0.04;
  });

  return (
    <mesh ref={ref} position={[0, -0.5, 0]} rotation={[-Math.PI / 2, 0, 0]}>
      <circleGeometry args={[3, 64]} />
      <meshBasicMaterial
        color="#34d399"
        transparent
        opacity={0.15}
        blending={THREE.AdditiveBlending}
        depthWrite={false}
      />
    </mesh>
  );
}

/* ─── Mouse-reactive camera ─── */
function CameraRig() {
  const { camera } = useThree();
  const mouseRef = useRef({ x: 0, y: 0 });

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      mouseRef.current.x = (e.clientX / window.innerWidth - 0.5) * 2;
      mouseRef.current.y = (e.clientY / window.innerHeight - 0.5) * 2;
    };
    window.addEventListener("mousemove", handler);
    return () => window.removeEventListener("mousemove", handler);
  }, []);

  useFrame(() => {
    const targetX = mouseRef.current.x * 0.5;
    const targetY = -mouseRef.current.y * 0.3 + 2;
    camera.position.x += (targetX - camera.position.x) * 0.02;
    camera.position.y += (targetY - camera.position.y) * 0.02;
    camera.lookAt(0, 0, 0);
  });

  return null;
}

class ThreeErrorBoundary extends Component<{ children: ReactNode }, { hasError: boolean }> {
  state = { hasError: false };
  static getDerivedStateFromError() {
    return { hasError: true };
  }
  componentDidCatch(error: any) {
    console.warn("ThreeErrorBoundary caught Drei asset loading issue:", error);
  }
  render() {
    if (this.state.hasError) return null;
    return this.props.children;
  }
}

/* ─── Main exported scene ─── */
export function HeroScene() {
  const crystalColor = useApp((s) => s.crystalColor);
  const bgAnimation = useApp((s) => s.bgAnimation);

  // Background Settings
  const bgAntigravityCount = useApp((s) => s.bgAntigravityCount);
  const bgAntigravityMagnetRadius = useApp((s) => s.bgAntigravityMagnetRadius);
  const bgAntigravityParticleSize = useApp((s) => s.bgAntigravityParticleSize);
  const bgAntigravityWaveSpeed = useApp((s) => s.bgAntigravityWaveSpeed);
  const bgAntigravityShape = useApp((s) => s.bgAntigravityShape);

  const bgGalaxyStarSpeed = useApp((s) => s.bgGalaxyStarSpeed);
  const bgGalaxyGlowIntensity = useApp((s) => s.bgGalaxyGlowIntensity);
  const bgGalaxyHueShift = useApp((s) => s.bgGalaxyHueShift);

  const bgLiquidEtherMouseForce = useApp((s) => s.bgLiquidEtherMouseForce);
  const bgLiquidEtherCursorSize = useApp((s) => s.bgLiquidEtherCursorSize);
  const bgLiquidEtherIsViscous = useApp((s) => s.bgLiquidEtherIsViscous);
  const bgLiquidEtherViscous = useApp((s) => s.bgLiquidEtherViscous);
  const bgLiquidEtherAutoSpeed = useApp((s) => s.bgLiquidEtherAutoSpeed);
  const bgLiquidEtherAutoIntensity = useApp((s) => s.bgLiquidEtherAutoIntensity);
  const bgLiquidEtherIsBounce = useApp((s) => s.bgLiquidEtherIsBounce);
  const bgLiquidEtherResolution = useApp((s) => s.bgLiquidEtherResolution);

  const liquidEtherColors = useMemo(() => {
    if (crystalColor === "#34d399") {
      return ["#5227FF", "#FF9FFC", "#B497CF"];
    }
    const base = new THREE.Color(crystalColor);
    return [
      crystalColor,
      "#" + base.clone().offsetHSL(0.15, 0.2, 0.1).getHexString(),
      "#" + base.clone().offsetHSL(-0.15, 0.2, 0.2).getHexString(),
    ];
  }, [crystalColor]);

  return (
    <div
      className="hero-scene-container"
      style={{
        position: "absolute",
        inset: 0,
        zIndex: 0,
        pointerEvents: "none",
      }}
    >
      {/* 2D/3D Backgrounds */}
      {bgAnimation === "antigravity" && (
        <div style={{ width: '100%', height: '100%', position: 'absolute', inset: 0, zIndex: -1, pointerEvents: "auto" }}>
          <Antigravity
            count={bgAntigravityCount}
            magnetRadius={bgAntigravityMagnetRadius}
            ringRadius={bgAntigravityMagnetRadius}
            waveSpeed={bgAntigravityWaveSpeed}
            waveAmplitude={1.8}
            particleSize={bgAntigravityParticleSize}
            lerpSpeed={0.32}
            color={crystalColor}
            autoAnimate={false}
            particleVariance={1}
            rotationSpeed={0}
            depthFactor={1}
            pulseSpeed={3}
            particleShape={bgAntigravityShape}
            fieldStrength={10}
          />
        </div>
      )}

      {bgAnimation === "galaxy" && (
        <div style={{ width: '100%', height: '100%', position: 'absolute', inset: 0, zIndex: -1, pointerEvents: "auto" }}>
          <Galaxy
            starSpeed={bgGalaxyStarSpeed}
            density={1}
            hueShift={bgGalaxyHueShift}
            speed={1}
            glowIntensity={bgGalaxyGlowIntensity}
            saturation={0.8}
            mouseRepulsion
            repulsionStrength={2}
            twinkleIntensity={0.3}
            rotationSpeed={0.1}
            transparent
          />
        </div>
      )}

      {bgAnimation === "liquidether" && (
        <div style={{ width: '100%', height: '100%', position: 'absolute', inset: 0, zIndex: -1, pointerEvents: "auto", display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ width: '1080px', height: '1080px', position: 'relative', maxWidth: '100%', maxHeight: '100%', aspectRatio: '1/1' }}>
            <LiquidEther
              mouseForce={bgLiquidEtherMouseForce}
              cursorSize={bgLiquidEtherCursorSize}
              isViscous={bgLiquidEtherIsViscous}
              viscous={bgLiquidEtherViscous}
              colors={liquidEtherColors}
              autoDemo
              autoSpeed={bgLiquidEtherAutoSpeed}
              autoIntensity={bgLiquidEtherAutoIntensity}
              isBounce={bgLiquidEtherIsBounce}
              resolution={bgLiquidEtherResolution}
            />
          </div>
        </div>
      )}

      {bgAnimation === "stars" && (
        <Canvas
          camera={{ position: [0, 2, 5], fov: 45 }}
          dpr={1}
          gl={{
            antialias: true,
            alpha: true,
            powerPreference: "high-performance",
          }}
          style={{ background: "transparent" }}
        >
          {/* Lighting */}
          <ambientLight intensity={0.3} />
          <directionalLight
            position={[5, 8, 5]}
            intensity={1.2}
            color="#ffffff"
          />
          <pointLight position={[0, 2, 0]} intensity={2} color={crystalColor} distance={8} />
          <pointLight position={[-2, 1, -2]} intensity={0.8} color="#22d3ee" distance={6} />
          <pointLight position={[2, 0, 2]} intensity={0.6} color="#a78bfa" distance={5} />

          {/* Environment for reflections */}
          <ThreeErrorBoundary>
            <Environment preset="night" />
          </ThreeErrorBoundary>

          {/* Crystal cluster — the star of the show */}
          <Float speed={1} rotationIntensity={0.1} floatIntensity={0.3}>
            <CrystalCluster primaryColor={crystalColor} />
          </Float>

          {/* Energy particles drifting up */}
          <EnergyParticles />

          {/* Ground emission */}
          <GroundGlow />

          {/* Background stars */}
          <Stars
            radius={50}
            depth={50}
            count={300}
            factor={3}
            saturation={0.5}
            fade
            speed={0.5}
          />

          {/* Sparkles around crystals */}
          <Sparkles
            count={25}
            scale={4}
            size={2}
            speed={0.3}
            opacity={0.4}
            color={crystalColor}
          />

          {/* Mouse parallax camera */}
          <CameraRig />
        </Canvas>
      )}

      {/* Vignette / Edge blending overlay */}
      <div 
        className="absolute inset-0 pointer-events-none z-10"
        style={{
          background: `
            radial-gradient(circle at center, transparent 35%, var(--background) 90%),
            linear-gradient(to bottom, var(--background) 0%, transparent 15%, transparent 85%, var(--background) 100%),
            linear-gradient(to right, var(--background) 0%, transparent 15%, transparent 85%, var(--background) 100%)
          `,
        }}
      />
    </div>
  );
}
