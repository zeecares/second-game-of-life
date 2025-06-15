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
    // Ultra-minimal: single subtle particle
    const particle: Particle = {
      id: `birth-${Date.now()}`,
      x: x + 4,
      y: y + 4,
      vx: 0,
      vy: -0.3,
      life: 15,
      maxLife: 15,
      size: 0.8,
      color: 'hsl(200, 30%, 85%)', // Very subtle light blue
      type: 'birth',
      glowIntensity: 2,
      trail: []
    };
    particlesRef.current.push(particle);
  }, []);

  const createDeathParticles = useCallback((x: number, y: number) => {
    // Ultra-minimal: single fading particle
    const particle: Particle = {
      id: `death-${Date.now()}`,
      x: x + 4,
      y: y + 4,
      vx: 0,
      vy: 0.2,
      life: 12,
      maxLife: 12,
      size: 0.6,
      color: 'hsl(0, 20%, 70%)', // Very subtle warm gray
      type: 'death',
      glowIntensity: 1,
      trail: []
    };
    particlesRef.current.push(particle);
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
      
      // Ultra-minimalist rendering - pure simplicity
      ctx.globalAlpha = alpha * 0.6;
      ctx.shadowBlur = 0; // No glow for pure minimalism
      ctx.fillStyle = particle.color;
      
      // Tiny simple dot
      ctx.beginPath();
      ctx.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2);
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