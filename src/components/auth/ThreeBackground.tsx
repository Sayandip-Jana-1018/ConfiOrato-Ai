import { useRef, useMemo } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { Sphere } from '@react-three/drei';
import * as THREE from 'three';
import { useTheme } from '@/context/ThemeContext';

// Animated sphere component with subtle movement
function AnimatedSphere({ position, size, color, gradient = false, gradientColor = '#FFD700' }: { 
  position: [number, number, number], 
  size: number, 
  color: string,
  gradient?: boolean,
  gradientColor?: string
}) {
  const meshRef = useRef<THREE.Mesh>(null);
  
  // Create a shader material for gradient effect
  const material = useMemo(() => {
    if (gradient) {
      // Convert hex colors to THREE.Color objects
      const baseColor = new THREE.Color(color);
      const secondColor = new THREE.Color(gradientColor);
      
      // Create a custom shader material with gradient
      return new THREE.MeshPhysicalMaterial({
        color: baseColor,
        metalness: 1.0,
        roughness: 0.05,
        clearcoat: 1.0,
        clearcoatRoughness: 0.1,
        envMapIntensity: 1.5,
        reflectivity: 1,
        emissive: secondColor,
        emissiveIntensity: 0.2
      });
    } else {
      // Regular material without gradient
      return new THREE.MeshPhysicalMaterial({
        color: color,
        metalness: 1.0,
        roughness: 0.05,
        clearcoat: 1.0,
        clearcoatRoughness: 0.1,
        envMapIntensity: 1.5,
        reflectivity: 1
      });
    }
  }, [color, gradient, gradientColor]);
  
  // Very subtle animation
  useFrame((state) => {
    if (!meshRef.current) return;
    
    // Almost imperceptible movement
    const time = state.clock.elapsedTime * 0.05;
    meshRef.current.position.y += Math.sin(time) * 0.0005;
  });

  return (
    <Sphere ref={meshRef} args={[size, 128, 128]} position={position} material={material} />
  );
}

// Scene component with strategically placed spheres
function Scene() {
  const { themeColor } = useTheme();
  
  // Define colors - using exact gold tones from the image and theme color
  const goldColor = '#D4AF37';      // Standard gold
  const lightGoldColor = '#FFD700'; // Bright gold
  const darkGoldColor = '#996515';  // Dark gold
  
  // Generate spheres with strategic positioning to match the image
  const spheres = useMemo(() => [
    // Large sphere in top center
    {
      position: [5, 3, -5] as [number, number, number],
      size: 3.5,
      color: goldColor,
      gradient: true,
      gradientColor: themeColor,
      key: 'large-top'
    },
    // Medium sphere top right
    {
      position: [12, 4, -8] as [number, number, number],
      size: 2.0,
      color: lightGoldColor,
      key: 'medium-topright'
    },
    // Large sphere bottom left
    {
      position: [-6, -6, -6] as [number, number, number],
      size: 4.0,
      color: goldColor,
      gradient: true,
      gradientColor: themeColor,
      key: 'large-bottomleft'
    },
    // Large sphere bottom right
    {
      position: [15, -10, -5] as [number, number, number],
      size: 7.0,
      color: goldColor,
      key: 'large-bottomright'
    },
    // Medium sphere center left
    {
      position: [-15, 0, -10] as [number, number, number],
      size: 3.5,
      color: darkGoldColor,
      key: 'medium-centerleft'
    },
    // Small sphere top left
    {
      position: [-8, 12, -16] as [number, number, number],
      size:2.8,
      color: lightGoldColor,
      gradient: true,
      gradientColor: themeColor,
      key: 'small-topleft'
    },
    // Small sphere center right
    {
      position: [8, -2, -8] as [number, number, number],
      size: 1.5,
      color: lightGoldColor,
      key: 'small-centerright'
    },
    // Extra small spheres for depth
    {
      position: [5, 10, -15] as [number, number, number],
      size: 1.2,
      color: themeColor,
      key: 'xsmall-1'
    },
    {
      position: [-5, -5, -12] as [number, number, number],
      size: 1.0,
      color: themeColor,
      key: 'xsmall-2'
    },
    {
      position: [18, 5, -20] as [number, number, number],
      size: 1.5,
      color: themeColor,
      key: 'xsmall-3'
    }
  ], [themeColor]);

  return (
    <>
      {/* Ambient light */}
      <ambientLight intensity={0.4} />
      
      {/* Directional lights to create the gold shine */}
      <directionalLight position={[10, 10, 5]} intensity={0.8} color="#ffffff" />
      <directionalLight position={[-10, -10, -5]} intensity={0.4} color="#fffaf0" />
      
      {/* Point light for highlights */}
      <pointLight position={[0, 0, 10]} intensity={1.2} color="#fff8e0" distance={50} decay={2} />
      
      {/* Environment map for realistic reflections */}
      <mesh>
        <sphereGeometry args={[50, 32, 32]} />
        <meshBasicMaterial color="#000000" side={THREE.BackSide} />
      </mesh>
      
      {/* Render all spheres */}
      {spheres.map((sphere) => (
        <AnimatedSphere
          key={sphere.key}
          position={sphere.position}
          size={sphere.size}
          color={sphere.color}
          gradient={sphere.gradient}
          gradientColor={sphere.gradientColor}
        />
      ))}
    </>
  );
}

export default function ThreeBackground() {
  const { themeColor } = useTheme();
  
  // Create a dark gradient background with theme color
  const gradientStyle = {
    background: `radial-gradient(circle at center, rgba(0,0,0,0.7) 0%, rgba(0,0,0,0.9) 70%, rgba(0,0,0,1) 100%)`,
    boxShadow: `inset 0 0 100px 20px ${themeColor}22`
  };
  
  return (
    <div className="fixed inset-0 -z-10" style={gradientStyle}>
      <Canvas camera={{ position: [0, 0, 20], fov: 60 }}>
        <Scene />
      </Canvas>
    </div>
  );
}