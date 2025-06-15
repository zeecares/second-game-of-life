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
  glowIntensity?: number;
  trail?: Array<{x: number, y: number, alpha: number}>;
};

export const useParticleSystem = (canvasRef: React.RefObject<HTMLCanvasElement>) => {
  const particlesRef = useRef<Particle[]>([]);
  const animationFrameRef = useRef<number>();

  const createBirthParticles = useCallback((x: number, y: number) => {
    const particles: Particle[] = [];
    // Minimal zen particles for smooth performance
    for (let i = 0; i < 2; i++) {
      const angle = (i / 2) * Math.PI * 2 + Math.random() * 0.5;
      particles.push({
        id: `birth-${Date.now()}-${i}`,
        x: x + 4,
        y: y + 4,
        vx: Math.cos(angle) * 0.8,
        vy: Math.sin(angle) * 0.8,
        life: 20,
        maxLife: 20,
        size: 1.2,
        color: `hsl(${160 + Math.random() * 40}, 60%, 75%)`, // Soft teal to blue
        type: 'birth',
        glowIntensity: 8,
        trail: []
      });
    }
    particlesRef.current.push(...particles);
  }, []);

  const createDeathParticles = useCallback((x: number, y: number) => {
    const particles: Particle[] = [];
    // Minimal zen death particles
    for (let i = 0; i < 3; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = Math.random() * 1.2 + 0.3;
      particles.push({
        id: `death-${Date.now()}-${i}`,
        x: x + 4,
        y: y + 4,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        life: 25,
        maxLife: 25,
        size: Math.random() * 1 + 0.8,
        color: `hsl(${Math.random() < 0.7 ? 280 + Math.random() * 40 : 40 + Math.random() * 20}, 50%, 70%)`, // Soft purple or warm orange
        type: 'death',
        glowIntensity: 6,
        trail: []
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
      
      // Update trail for zen effect (shorter trails for performance)
      if (particle.trail) {
        particle.trail.unshift({ x: particle.x, y: particle.y, alpha: particle.life / particle.maxLife });
        if (particle.trail.length > 3) {
          particle.trail.pop();
        }
      }
      
      particle.x += particle.vx;
      particle.y += particle.vy;
      
      // Zen physics - gentle movement
      if (particle.type === 'death') {
        particle.vy += 0.02; // Very light gravity
        particle.vx *= 0.98;
      } else {
        particle.vx *= 0.96; // Gentle friction
        particle.vy *= 0.96;
      }
      
      return particle.life > 0;
    });

    // Clear canvas efficiently
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Batch render particles for performance
    particlesRef.current.forEach(particle => {
      const alpha = particle.life / particle.maxLife;
      ctx.save();
      
      // Minimal trail for zen aesthetic
      if (particle.trail && particle.trail.length > 0) {
        particle.trail.forEach((point, index) => {
          const trailAlpha = point.alpha * 0.2 * (1 - index / particle.trail.length);
          ctx.globalAlpha = trailAlpha;
          ctx.fillStyle = particle.color;
          ctx.beginPath();
          ctx.arc(point.x, point.y, particle.size * 0.3, 0, Math.PI * 2);
          ctx.fill();
        });
      }
      
      // Zen particle rendering - soft and minimal
      ctx.globalAlpha = alpha;
      ctx.shadowBlur = particle.glowIntensity || 6;
      ctx.shadowColor = particle.color;
      ctx.fillStyle = particle.color;
      
      // Simple circle for all particles - zen simplicity
      ctx.beginPath();
      ctx.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2);
      ctx.fill();
      
      // Subtle center highlight
      ctx.globalAlpha = alpha * 0.4;
      ctx.shadowBlur = 2;
      ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
      ctx.beginPath();
      ctx.arc(particle.x, particle.y, particle.size * 0.4, 0, Math.PI * 2);
      ctx.fill();
      
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