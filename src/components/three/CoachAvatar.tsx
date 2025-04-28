import { useRef } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import * as THREE from 'three';

interface AvatarProps {
  posture: number;
  gestures: number;
  eyeContact: number;
  voiceClarity: number;
}

function SimpleAvatar({ posture, gestures, eyeContact, voiceClarity }: AvatarProps) {
  const groupRef = useRef<THREE.Group>(null);
  const bodyRef = useRef<THREE.Mesh>(null);

  useFrame((state) => {
    if (groupRef.current && bodyRef.current) {
      // Smooth posture movement
      const targetRotation = THREE.MathUtils.degToRad((posture - 85) * 0.2);
      groupRef.current.rotation.x = THREE.MathUtils.lerp(
        groupRef.current.rotation.x,
        targetRotation,
        0.1
      );

      // Gesture movements
      const gestureIntensity = (gestures - 75) * 0.002;
      groupRef.current.position.y = Math.sin(state.clock.elapsedTime * 2) * gestureIntensity;

      // Voice clarity - subtle glow effect
      const glowIntensity = (voiceClarity / 100) * 0.5 + 0.5;
      if (bodyRef.current.material instanceof THREE.MeshStandardMaterial) {
        bodyRef.current.material.emissive.setRGB(
          0.1 * glowIntensity,
          0.2 * glowIntensity,
          0.4 * glowIntensity
        );
      }
    }
  });

  return (
    <group ref={groupRef}>
      {/* Body */}
      <mesh ref={bodyRef} position={[0, 0, 0]}>
        <cylinderGeometry args={[0.4, 0.4, 1.2, 32]} />
        <meshStandardMaterial
          color="#4a90e2"
          roughness={0.3}
          metalness={0.7}
          emissive="#1a4a8f"
        />
      </mesh>

      {/* Head */}
      <mesh position={[0, 0.8, 0]}>
        <sphereGeometry args={[0.3, 32, 32]} />
        <meshStandardMaterial
          color="#4a90e2"
          roughness={0.3}
          metalness={0.7}
          emissive="#1a4a8f"
        />
      </mesh>

      {/* Eyes */}
      <mesh position={[0.1, 0.85, 0.2]}>
        <sphereGeometry args={[0.05, 16, 16]} />
        <meshStandardMaterial color="white" emissive="white" emissiveIntensity={0.5} />
      </mesh>
      <mesh position={[-0.1, 0.85, 0.2]}>
        <sphereGeometry args={[0.05, 16, 16]} />
        <meshStandardMaterial color="white" emissive="white" emissiveIntensity={0.5} />
      </mesh>
    </group>
  );
}

export default function CoachAvatar({ metrics }: { metrics: AvatarProps }) {
  return (
    <div className="h-40 rounded-xl overflow-hidden bg-black/20">
      <Canvas camera={{ position: [0, 0, 3], fov: 50 }}>
        <ambientLight intensity={0.5} />
        <directionalLight position={[5, 5, 5]} intensity={1} />
        <directionalLight position={[-5, -5, -5]} intensity={0.2} />
        <SimpleAvatar {...metrics} />
        <OrbitControls
          enableZoom={false}
          enablePan={false}
          minPolarAngle={Math.PI / 2.5}
          maxPolarAngle={Math.PI / 1.5}
        />
      </Canvas>
    </div>
  );
}
