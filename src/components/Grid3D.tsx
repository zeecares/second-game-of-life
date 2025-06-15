
import React, { useRef, useMemo } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, Text } from '@react-three/drei';
import { Mesh, InstancedMesh, Object3D, Color } from 'three';

type Grid = boolean[][];

interface Grid3DProps {
  grid: Grid;
  gridSize: number;
  isRunning: boolean;
  generation: number;
}

const Cell3D = ({ position, isAlive, generation }: { position: [number, number, number], isAlive: boolean, generation: number }) => {
  const meshRef = useRef<Mesh>(null);
  
  useFrame((state) => {
    if (meshRef.current && isAlive) {
      meshRef.current.rotation.x += 0.01;
      meshRef.current.rotation.y += 0.01;
      // Pulse effect based on generation
      const scale = 0.8 + 0.2 * Math.sin(state.clock.elapsedTime * 2 + generation * 0.1);
      meshRef.current.scale.setScalar(scale);
    }
  });

  return (
    <mesh ref={meshRef} position={position}>
      <boxGeometry args={[0.8, 0.8, 0.8]} />
      <meshStandardMaterial 
        color={isAlive ? new Color().setHSL((generation * 0.01) % 1, 0.8, 0.6) : '#333333'}
        emissive={isAlive ? new Color().setHSL((generation * 0.01) % 1, 0.3, 0.1) : '#000000'}
        transparent
        opacity={isAlive ? 1 : 0.1}
      />
    </mesh>
  );
};

const Grid3DContent = ({ grid, gridSize, isRunning, generation }: Grid3DProps) => {
  const cells = useMemo(() => {
    const cellArray = [];
    for (let x = 0; x < gridSize; x++) {
      for (let y = 0; y < gridSize; y++) {
        const position: [number, number, number] = [
          x - gridSize / 2,
          0,
          y - gridSize / 2
        ];
        cellArray.push({
          position,
          isAlive: grid[x][y],
          key: `${x}-${y}`
        });
      }
    }
    return cellArray;
  }, [grid, gridSize]);

  return (
    <>
      <ambientLight intensity={0.4} />
      <pointLight position={[10, 10, 10]} intensity={1} />
      <pointLight position={[-10, -10, -10]} intensity={0.5} color="#4f46e5" />
      
      {cells.map((cell) => (
        <Cell3D
          key={cell.key}
          position={cell.position}
          isAlive={cell.isAlive}
          generation={generation}
        />
      ))}
      
      <Text
        position={[0, gridSize / 2 + 2, 0]}
        fontSize={2}
        color="white"
        anchorX="center"
        anchorY="middle"
      >
        Generation: {generation}
      </Text>
      
      <OrbitControls enablePan={true} enableZoom={true} enableRotate={true} />
    </>
  );
};

export const Grid3D = ({ grid, gridSize, isRunning, generation }: Grid3DProps) => {
  return (
    <div className="w-full h-96 bg-gray-900 rounded-lg overflow-hidden">
      <Canvas camera={{ position: [15, 15, 15], fov: 60 }}>
        <Grid3DContent 
          grid={grid} 
          gridSize={gridSize} 
          isRunning={isRunning} 
          generation={generation} 
        />
      </Canvas>
    </div>
  );
};
