import { useRef, useEffect, useCallback } from 'react';

export type Particle = {
  id: string;
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  maxLife: number;
  size: number;
  color: string;
  type: 'birth' | 'death';
};

export const useParticleSystem = (canvasRef: React.RefObject<HTMLCanvasElement>) => {
  const particlesRef = useRef<Particle[]>([]);
  const animationFrameRef = useRef<number>();

  const createBirthParticles = useCallback((x: number, y: number) => {
    const particles: Particle[] = [];
    for (let i = 0; i < 8; i++) {
      const angle = (i / 8) * Math.PI * 2;
      particles.push({
        id: `birth-${Date.now()}-${i}`,
        x: x + 4, // Center of 8px cell
        y: y + 4,
        vx: Math.cos(angle) * 2,
        vy: Math.sin(angle) * 2,
        life: 30,
        maxLife: 30,
        size: 2,
        color: 'hsl(120, 80%, 60%)', // Green sparkles
        type: 'birth'
      });
    }
    particlesRef.current.push(...particles);
  }, []);

  const createDeathParticles = useCallback((x: number, y: number) => {
    const particles: Particle[] = [];
    for (let i = 0; i < 12; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = Math.random() * 3 + 1;
      particles.push({
        id: `death-${Date.now()}-${i}`,
        x: x + 4,
        y: y + 4,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        life: 40,
        maxLife: 40,
        size: Math.random() * 2 + 1,
        color: `hsl(${Math.random() * 60}, 80%, 60%)`, // Orange/red explosion
        type: 'death'
      });
    }
    particlesRef.current.push(...particles);
  }, []);

  const updateAndRenderParticles = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Update particles
    particlesRef.current = particlesRef.current.filter(particle => {
      particle.life--;
      particle.x += particle.vx;
      particle.y += particle.vy;
      
      // Add gravity for death particles
      if (particle.type === 'death') {
        particle.vy += 0.1;
        particle.vx *= 0.98; // Air resistance
      }
      
      return particle.life > 0;
    });

    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Render particles
    particlesRef.current.forEach(particle => {
      const alpha = particle.life / particle.maxLife;
      ctx.save();
      
      if (particle.type === 'birth') {
        // Sparkle effect
        ctx.globalAlpha = alpha;
        ctx.fillStyle = particle.color;
        ctx.beginPath();
        ctx.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2);
        ctx.fill();
        
        // Add glow
        ctx.shadowBlur = 10;
        ctx.shadowColor = particle.color;
        ctx.beginPath();
        ctx.arc(particle.x, particle.y, particle.size * 0.5, 0, Math.PI * 2);
        ctx.fill();
      } else {
        // Explosion effect
        ctx.globalAlpha = alpha;
        ctx.fillStyle = particle.color;
        ctx.beginPath();
        ctx.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2);
        ctx.fill();
      }
      
      ctx.restore();
    });

    animationFrameRef.current = requestAnimationFrame(updateAndRenderParticles);
  }, [canvasRef]);

  useEffect(() => {
    updateAndRenderParticles();
    
    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [updateAndRenderParticles]);

  const clearParticles = useCallback(() => {
    particlesRef.current = [];
  }, []);

  return {
    createBirthParticles,
    createDeathParticles,
    clearParticles
  };
};