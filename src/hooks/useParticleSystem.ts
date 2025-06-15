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
    // Fewer, more stylized particles for cyberpunk aesthetic
    for (let i = 0; i < 4; i++) {
      const angle = (i / 4) * Math.PI * 2;
      particles.push({
        id: `birth-${Date.now()}-${i}`,
        x: x + 4,
        y: y + 4,
        vx: Math.cos(angle) * 1.5,
        vy: Math.sin(angle) * 1.5,
        life: 25,
        maxLife: 25,
        size: 1.5,
        color: `hsl(${180 + Math.random() * 60}, 100%, 70%)`, // Cyan to blue
        type: 'birth',
        glowIntensity: 15,
        trail: []
      });
    }
    particlesRef.current.push(...particles);
  }, []);

  const createDeathParticles = useCallback((x: number, y: number) => {
    const particles: Particle[] = [];
    // Create cyberpunk-style death particles
    for (let i = 0; i < 6; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = Math.random() * 2 + 0.5;
      particles.push({
        id: `death-${Date.now()}-${i}`,
        x: x + 4,
        y: y + 4,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        life: 30,
        maxLife: 30,
        size: Math.random() * 1.5 + 0.5,
        color: `hsl(${Math.random() < 0.5 ? 300 + Math.random() * 60 : Math.random() * 30}, 100%, 60%)`, // Pink/magenta or orange
        type: 'death',
        glowIntensity: 12,
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
      
      // Update trail for cyberpunk effect
      if (particle.trail) {
        particle.trail.unshift({ x: particle.x, y: particle.y, alpha: particle.life / particle.maxLife });
        if (particle.trail.length > 5) {
          particle.trail.pop();
        }
      }
      
      particle.x += particle.vx;
      particle.y += particle.vy;
      
      // Different physics for different types
      if (particle.type === 'death') {
        particle.vy += 0.05; // Lighter gravity
        particle.vx *= 0.99; // Less air resistance
      } else {
        particle.vx *= 0.95; // More friction for birth particles
        particle.vy *= 0.95;
      }
      
      return particle.life > 0;
    });

    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Render particles
    particlesRef.current.forEach(particle => {
      const alpha = particle.life / particle.maxLife;
      ctx.save();
      
      // Render trail first for cyberpunk effect
      if (particle.trail && particle.trail.length > 0) {
        particle.trail.forEach((point, index) => {
          const trailAlpha = point.alpha * 0.3 * (1 - index / particle.trail.length);
          ctx.globalAlpha = trailAlpha;
          ctx.fillStyle = particle.color;
          ctx.beginPath();
          ctx.arc(point.x, point.y, particle.size * 0.5, 0, Math.PI * 2);
          ctx.fill();
        });
      }
      
      // Enhanced cyberpunk particle rendering
      ctx.globalAlpha = alpha;
      
      if (particle.type === 'birth') {
        // Cyberpunk birth effect - sharp edges with strong glow
        ctx.shadowBlur = particle.glowIntensity || 15;
        ctx.shadowColor = particle.color;
        ctx.fillStyle = particle.color;
        
        // Draw main particle
        ctx.beginPath();
        ctx.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2);
        ctx.fill();
        
        // Add center bright spot
        ctx.shadowBlur = 5;
        ctx.fillStyle = '#ffffff';
        ctx.globalAlpha = alpha * 0.8;
        ctx.beginPath();
        ctx.arc(particle.x, particle.y, particle.size * 0.3, 0, Math.PI * 2);
        ctx.fill();
        
      } else {
        // Cyberpunk death effect - more angular with intense glow
        ctx.shadowBlur = particle.glowIntensity || 12;
        ctx.shadowColor = particle.color;
        ctx.fillStyle = particle.color;
        
        // Draw diamond shape for more cyberpunk feel
        ctx.beginPath();
        ctx.moveTo(particle.x, particle.y - particle.size);
        ctx.lineTo(particle.x + particle.size, particle.y);
        ctx.lineTo(particle.x, particle.y + particle.size);
        ctx.lineTo(particle.x - particle.size, particle.y);
        ctx.closePath();
        ctx.fill();
        
        // Add inner glow
        ctx.globalAlpha = alpha * 0.6;
        ctx.shadowBlur = 3;
        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.arc(particle.x, particle.y, particle.size * 0.2, 0, Math.PI * 2);
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