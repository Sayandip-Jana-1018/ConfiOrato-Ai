import React, { useEffect, useRef, useState } from 'react';
import { motion } from 'framer-motion';

type AssistantState = 'idle' | 'listening' | 'speaking' | 'processing' | 'thinking' | 'error' | 'navigating';

interface VoiceAssistantAnimationProps {
  state: AssistantState;
}

export const VoiceAssistantAnimation: React.FC<VoiceAssistantAnimationProps> = ({ state }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isHovered, setIsHovered] = useState(false);
  
  // Animation frame reference
  const animationFrameRef = useRef<number | null>(null);
  
  // Particles array
  const particlesRef = useRef<Array<{
    x: number;
    y: number;
    size: number;
    speedX: number;
    speedY: number;
    color: string;
    alpha: number;
  }>>([]);
  
  // Colors for the gradient
  const colors = [
    { r: 255, g: 0, b: 128 },    // Pink
    { r: 255, g: 0, b: 0 },      // Red
    { r: 0, g: 0, b: 255 },      // Blue
    { r: 0, g: 255, b: 0 },      // Green
    { r: 0, g: 255, b: 255 },    // Cyan
  ];
  
  // Initialize particles
  const initParticles = (count: number) => {
    const particles = [];
    for (let i = 0; i < count; i++) {
      const colorIndex = Math.floor(Math.random() * colors.length);
      const { r, g, b } = colors[colorIndex];
      
      particles.push({
        x: Math.random() * 2 - 1, // Position between -1 and 1
        y: Math.random() * 2 - 1,
        size: Math.random() * 3 + 1,
        speedX: (Math.random() - 0.5) * 0.02,
        speedY: (Math.random() - 0.5) * 0.02,
        color: `rgba(${r}, ${g}, ${b}, 0.8)`,
        alpha: Math.random() * 0.5 + 0.2
      });
    }
    return particles;
  };
  
  // Animation function
  const animate = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // Draw the main ball
    const centerX = canvas.width / 2;
    const centerY = canvas.height / 2;
    const radius = isHovered ? canvas.width * 0.4 : canvas.width * 0.35;
    
    // Create a radial gradient for the ball
    const gradient = ctx.createRadialGradient(
      centerX - radius * 0.3, centerY - radius * 0.3, radius * 0.1,
      centerX, centerY, radius
    );
    
    // Add color stops based on the assistant state
    if (state === 'listening' || state === 'speaking') {
      gradient.addColorStop(0, 'rgba(255, 255, 255, 0.9)');
      gradient.addColorStop(0.2, 'rgba(0, 150, 255, 0.8)');
      gradient.addColorStop(0.5, 'rgba(100, 0, 255, 0.7)');
      gradient.addColorStop(0.8, 'rgba(255, 0, 128, 0.6)');
      gradient.addColorStop(1, 'rgba(0, 255, 200, 0.5)');
    } else if (state === 'error') {
      gradient.addColorStop(0, 'rgba(255, 255, 255, 0.9)');
      gradient.addColorStop(0.3, 'rgba(255, 100, 100, 0.8)');
      gradient.addColorStop(0.7, 'rgba(255, 50, 50, 0.7)');
      gradient.addColorStop(1, 'rgba(200, 0, 0, 0.6)');
    } else if (state === 'navigating') {
      gradient.addColorStop(0, 'rgba(255, 255, 255, 0.9)');
      gradient.addColorStop(0.2, 'rgba(0, 255, 0, 0.8)');
      gradient.addColorStop(0.5, 'rgba(0, 200, 0, 0.7)');
      gradient.addColorStop(0.8, 'rgba(0, 150, 0, 0.6)');
      gradient.addColorStop(1, 'rgba(0, 100, 0, 0.5)');
    } else {
      gradient.addColorStop(0, 'rgba(255, 255, 255, 0.9)');
      gradient.addColorStop(0.3, 'rgba(100, 200, 255, 0.7)');
      gradient.addColorStop(0.6, 'rgba(100, 100, 255, 0.6)');
      gradient.addColorStop(1, 'rgba(50, 0, 100, 0.5)');
    }
    
    // Draw the ball
    ctx.beginPath();
    ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
    ctx.fillStyle = gradient;
    ctx.fill();
    
    // Add a shine effect
    const shineGradient = ctx.createRadialGradient(
      centerX - radius * 0.5, centerY - radius * 0.5, 0,
      centerX - radius * 0.3, centerY - radius * 0.3, radius * 0.8
    );
    shineGradient.addColorStop(0, 'rgba(255, 255, 255, 0.8)');
    shineGradient.addColorStop(0.5, 'rgba(255, 255, 255, 0.2)');
    shineGradient.addColorStop(1, 'rgba(255, 255, 255, 0)');
    
    ctx.beginPath();
    ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
    ctx.fillStyle = shineGradient;
    ctx.fill();
    
    // Update and draw particles
    particlesRef.current.forEach((particle, index) => {
      // Calculate distance from center
      const dx = particle.x;
      const dy = particle.y;
      const distance = Math.sqrt(dx * dx + dy * dy);
      
      // Update position
      particle.x += particle.speedX;
      particle.y += particle.speedY;
      
      // Bounce off the edges of the sphere
      if (distance > 0.9) {
        // Normalize the position to the edge of the sphere
        const angle = Math.atan2(particle.y, particle.x);
        particle.x = 0.9 * Math.cos(angle);
        particle.y = 0.9 * Math.sin(angle);
        
        // Reverse direction slightly
        particle.speedX = -particle.speedX * 0.8;
        particle.speedY = -particle.speedY * 0.8;
      }
      
      // Draw particle
      const particleX = centerX + particle.x * radius;
      const particleY = centerY + particle.y * radius;
      
      ctx.beginPath();
      ctx.arc(particleX, particleY, particle.size, 0, Math.PI * 2);
      ctx.fillStyle = particle.color;
      ctx.globalAlpha = particle.alpha;
      ctx.fill();
      ctx.globalAlpha = 1;
    });
    
    // Request next frame
    animationFrameRef.current = requestAnimationFrame(animate);
  };
  
  // Initialize canvas and animation
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    // Set canvas dimensions
    const size = 100;
    canvas.width = size;
    canvas.height = size;
    
    // Initialize particles
    particlesRef.current = initParticles(30);
    
    // Start animation
    animationFrameRef.current = requestAnimationFrame(animate);
    
    // Cleanup
    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [isHovered, state]);
  
  return (
    <motion.div
      className="relative w-10 h-10"
      onHoverStart={() => setIsHovered(true)}
      onHoverEnd={() => setIsHovered(false)}
      whileHover={{ scale: 1.1 }}
      transition={{ duration: 0.3 }}
    >
      <canvas 
        ref={canvasRef} 
        className="w-full h-full rounded-full"
        style={{ 
          filter: 'drop-shadow(0 0 8px rgba(100, 100, 255, 0.5))',
        }}
      />
    </motion.div>
  );
};
