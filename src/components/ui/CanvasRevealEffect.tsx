"use client";

import { useEffect, useRef } from 'react';
import confetti from 'canvas-confetti';

interface CanvasRevealEffectProps {
  animationSpeed?: number;
  colors?: number[][];
  containerClassName?: string;
  active?: boolean;
}

type Shape = 'star' | 'circle' | 'square';

interface Particle {
  x: number
  y: number
  radius: number
  color: string
  speedX: number
  speedY: number
  alpha: number
}

export const CanvasRevealEffect = ({ 
  animationSpeed = 1, 
  colors = [[255, 215, 0], [255, 165, 0], [255, 140, 0]], 
  containerClassName = "",
  active = true 
}: CanvasRevealEffectProps) => {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const particlesRef = useRef<Particle[]>([])
  const animationFrameRef = useRef<number>(0)

  const colorPalette = colors.map(color => 
    `rgb(${color[0]}, ${color[1]}, ${color[2]})`
  );
  
  const alternateColors = [
    '#FF3366',
    '#36FF33',
    '#3366FF',
    '#FF33FF',
    '#33FFFF',
    '#FFFF33'
  ];

  const createParticle = (x: number, y: number): Particle => ({
    x,
    y,
    radius: Math.random() * 3 + 2,
    color: alternateColors[Math.floor(Math.random() * alternateColors.length)],
    speedX: Math.random() * 6 - 3 * animationSpeed,
    speedY: Math.random() * 6 - 3 * animationSpeed,
    alpha: 1
  })

  const initParticles = (x: number, y: number) => {
    for (let i = 0; i < 30; i++) {
      particlesRef.current.push(createParticle(x, y))
    }
  }

  const animate = () => {
    const canvas = canvasRef.current
    const ctx = canvas?.getContext('2d')
    if (!canvas || !ctx) return

    ctx.clearRect(0, 0, canvas.width, canvas.height)

    particlesRef.current = particlesRef.current.filter(particle => {
      particle.x += particle.speedX
      particle.y += particle.speedY
      particle.alpha -= 0.01 * animationSpeed

      ctx.beginPath()
      ctx.arc(particle.x, particle.y, particle.radius, 0, Math.PI * 2)
      ctx.fillStyle = `${particle.color}${Math.floor(particle.alpha * 255).toString(16).padStart(2, '0')}`
      ctx.fill()

      return particle.alpha > 0
    })

    if (particlesRef.current.length > 0) {
      animationFrameRef.current = requestAnimationFrame(animate)
    }
  }

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const handleResize = () => {
      canvas.width = canvas.clientWidth
      canvas.height = canvas.clientHeight
    }

    handleResize()
    window.addEventListener('resize', handleResize)

    return () => {
      window.removeEventListener('resize', handleResize)
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current)
      }
    }
  }, [])

  const startEffect = (e: React.MouseEvent) => {
    const canvas = canvasRef.current
    if (!canvas) return

    const rect = canvas.getBoundingClientRect()
    const x = e.clientX - rect.left
    const y = e.clientY - rect.top

    particlesRef.current = []
    initParticles(x, y)
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current)
    }
    animate()
  }

  useEffect(() => {
    if (active) {
      const launchConfetti = () => {
        const end = Date.now() + 2000;

        // Function to create random shapes
        const getRandomShape = (): Shape => {
          const shapes: Shape[] = ['star', 'circle', 'square'];
          return shapes[Math.floor(Math.random() * shapes.length)];
        };

        // Immediately launch initial confetti burst
        const launchInitialBurst = () => {
          // Center burst
          confetti({
            particleCount: 100,
            spread: 70,
            origin: { x: 0.5, y: 0.5 },
            colors: colorPalette,
            startVelocity: 30,
            gravity: 0.8,
            scalar: 1.2,
            ticks: 200
          });
          
          // Side bursts
          confetti({
            particleCount: 50,
            angle: 60,
            spread: 55,
            origin: { x: 0, y: 0.5 },
            colors: colorPalette
          });
          
          confetti({
            particleCount: 50,
            angle: 120,
            spread: 55,
            origin: { x: 1, y: 0.5 },
            colors: colorPalette
          });
        };

        // Ribbon effect
        const launchRibbons = () => {
          confetti({
            particleCount: 10,
            angle: 60,
            spread: 55,
            origin: { x: 0, y: 0.9 },
            colors: colorPalette,
            startVelocity: 45,
            scalar: 0.7,
            gravity: 0.6,
            drift: 0.5,
            ticks: 200
          });
          confetti({
            particleCount: 10,
            angle: 120,
            spread: 55,
            origin: { x: 1, y: 0.9 },
            colors: colorPalette,
            startVelocity: 45,
            scalar: 0.7,
            gravity: 0.6,
            drift: -0.5,
            ticks: 200
          });
        };
        
        // Launch initial burst immediately
        launchInitialBurst();
        
        // Continue with interval-based effects
        const interval = setInterval(() => {
          if (Date.now() > end) {
            return clearInterval(interval);
          }

          // Multiple burst points with different shapes
          [0.2, 0.4, 0.6, 0.8].forEach(x => {
            // Stars and circles burst
            confetti({
              particleCount: 8,
              spread: 45,
              origin: { x, y: 0.7 },
              colors: colorPalette,
              shapes: [getRandomShape()],
              scalar: 0.75,
              ticks: 150,
              startVelocity: 25,
              gravity: 0.9,
              drift: Math.random() - 0.5,
              disableForReducedMotion: true
            });

            // Balloon-like floating particles
            confetti({
              particleCount: 3,
              spread: 30,
              origin: { x: x - 0.1, y: 0.8 },
              colors: colorPalette,
              shapes: ['circle'],
              scalar: 1.2,
              ticks: 200,
              startVelocity: 15,
              gravity: 0.4,
              drift: Math.random() * 2 - 1,
              disableForReducedMotion: true
            });
          });

          // Launch ribbons every few bursts
          if (Math.random() > 0.7) {
            launchRibbons();
          }
        }, 100);

        return () => clearInterval(interval);
      };

      launchConfetti();
    }
  }, [active, colorPalette]);

  return (
    <div className={containerClassName || "h-full w-full relative overflow-hidden"}>
      <canvas
        ref={canvasRef}
        className="absolute inset-0 w-full h-full pointer-events-none"
        style={{ mixBlendMode: 'screen' }}
        onClick={startEffect}
      />
    </div>
  )
};

// Also export as default for backward compatibility
export default CanvasRevealEffect;
