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
    // Create 2-3 gentle particles for birth
    const count = Math.random() < 0.7 ? 2 : 3;
    
    for (let i = 0; i < count; i++) {
      const angle = (Math.PI * 2 * i) / count + Math.random() * 0.5;
      const speed = 0.2 + Math.random() * 0.3;
      
      const particle: Particle = {
        id: `birth-${Date.now()}-${i}`,
        x: x + 4 + Math.random() * 2,
        y: y + 4 + Math.random() * 2,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed - 0.1,
        life: 20 + Math.random() * 10,
        maxLife: 30,
        size: 0.6 + Math.random() * 0.4,
        color: `hsl(${160 + Math.random() * 40}, 40%, 75%)`, // Soft greens
        type: 'birth',
        glowIntensity: 1.5,
        trail: []
      };
      particlesRef.current.push(particle);
    }
  }, []);

  const createDeathParticles = useCallback((x: number, y: number) => {
    // Create 1-2 gentle fading particles for death
    const count = Math.random() < 0.6 ? 1 : 2;
    
    for (let i = 0; i < count; i++) {
      const particle: Particle = {
        id: `death-${Date.now()}-${i}`,
        x: x + 4 + Math.random() * 2,
        y: y + 4 + Math.random() * 2,
        vx: (Math.random() - 0.5) * 0.2,
        vy: 0.1 + Math.random() * 0.2,
        life: 18 + Math.random() * 8,
        maxLife: 26,
        size: 0.5 + Math.random() * 0.3,
        color: `hsl(${30 + Math.random() * 20}, 25%, 65%)`, // Soft warm tones
        type: 'death',
        glowIntensity: 1,
        trail: []
      };
      particlesRef.current.push(particle);
    }
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
      
      // Soft minimalist rendering with subtle glow
      ctx.globalAlpha = alpha * 0.7;
      ctx.shadowBlur = particle.glowIntensity || 0;
      ctx.shadowColor = particle.color;
      ctx.fillStyle = particle.color;
      
      // Render trail first (behind particle)
      if (particle.trail && particle.trail.length > 0) {
        particle.trail.forEach((point, index) => {
          const trailAlpha = point.alpha * 0.3 * (index / particle.trail!.length);
          ctx.globalAlpha = trailAlpha;
          ctx.beginPath();
          ctx.arc(point.x, point.y, particle.size * 0.5, 0, Math.PI * 2);
          ctx.fill();
        });
        ctx.globalAlpha = alpha * 0.7; // Reset for main particle
      }
      
      // Main particle - soft circle
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