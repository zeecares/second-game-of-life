
import React, { useEffect, useRef } from 'react';

interface HeatMapOverlayProps {
  influence: number[][];
  gridSize: number;
  cellSize: number;
  enabled: boolean;
  totalGridSize: number;
}

export const HeatMapOverlay: React.FC<HeatMapOverlayProps> = ({
  influence,
  gridSize,
  cellSize,
  enabled,
  totalGridSize
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (!enabled || !influence.length || !canvasRef.current) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Find max influence for normalization
    const maxInfluence = Math.max(...influence.flat());
    if (maxInfluence === 0) return;

    // Draw heat map
    for (let x = 0; x < influence.length; x++) {
      for (let y = 0; y < influence[0].length; y++) {
        const normalizedInfluence = influence[x][y] / maxInfluence;
        
        if (normalizedInfluence > 0.1) { // Only show significant influence
          const alpha = normalizedInfluence * 0.6; // Max 60% opacity
          
          // Color gradient from blue (low) to red (high)
          let r, g, b;
          if (normalizedInfluence < 0.5) {
            // Blue to yellow
            r = Math.round(normalizedInfluence * 2 * 255);
            g = Math.round(normalizedInfluence * 2 * 255);
            b = 255;
          } else {
            // Yellow to red
            r = 255;
            g = Math.round((1 - normalizedInfluence) * 2 * 255);
            b = 0;
          }

          ctx.fillStyle = `rgba(${r}, ${g}, ${b}, ${alpha})`;
          ctx.fillRect(
            y * (cellSize + 1),
            x * (cellSize + 1),
            cellSize,
            cellSize
          );
        }
      }
    }
  }, [influence, enabled, cellSize, gridSize, totalGridSize]);

  if (!enabled) return null;

  // Calculate the total grid dimensions including gaps and padding
  const totalGridWidth = totalGridSize + 16; // Add padding
  const totalGridHeight = totalGridSize + 16; // Add padding

  return (
    <canvas
      ref={canvasRef}
      width={totalGridWidth}
      height={totalGridHeight}
      className="pointer-events-none absolute"
      style={{ 
        mixBlendMode: 'multiply',
        top: '0px',
        left: '0px'
      }}
    />
  );
};
