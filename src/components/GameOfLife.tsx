import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Slider } from '@/components/ui/slider';
import { Badge } from '@/components/ui/badge';
import { Play, Pause, RotateCcw, Zap, Brain, MessageSquare, Volume2, VolumeX, Music, Thermometer, Share2 } from 'lucide-react';
import { useChiptuneSequencer } from '@/hooks/useChiptuneSequencer';
import { usePatternAnalysis } from '@/hooks/usePatternAnalysis';
import { usePatternSharing } from '@/hooks/usePatternSharing';
import { PatternMetrics } from '@/components/PatternMetrics';
import { HeatMapOverlay } from '@/components/HeatMapOverlay';
import { ShareModal } from '@/components/ShareModal';
import { Grid3D } from '@/components/Grid3D';
import { EvolutionCompetition } from '@/components/EvolutionCompetition';

const DEFAULT_GRID_SIZE = 25;

type Grid = boolean[][];

const createEmptyGrid = (size: number): Grid => {
  return Array(size).fill(null).map(() => Array(size).fill(false));
};

const createRandomGrid = (size: number): Grid => {
  return Array(size).fill(null).map(() => 
    Array(size).fill(null).map(() => Math.random() > 0.7)
  );
};

const countNeighbors = (grid: Grid, x: number, y: number, gridSize: number): number => {
  let count = 0;
  for (let i = -1; i <= 1; i++) {
    for (let j = -1; j <= 1; j++) {
      if (i === 0 && j === 0) continue;
      const newX = x + i;
      const newY = y + j;
      if (newX >= 0 && newX < gridSize && newY >= 0 && newY < gridSize) {
        if (grid[newX][newY]) count++;
      }
    }
  }
  return count;
};

const getNextGeneration = (grid: Grid, rules: Rules, gridSize: number): Grid => {
  const newGrid = createEmptyGrid(gridSize);
  for (let x = 0; x < gridSize; x++) {
    for (let y = 0; y < gridSize; y++) {
      const neighbors = countNeighbors(grid, x, y, gridSize);
      if (grid[x][y]) {
        // Cell is alive
        newGrid[x][y] = neighbors >= rules.survivalMin && neighbors <= rules.survivalMax;
      } else {
        // Cell is dead
        newGrid[x][y] = neighbors === rules.birthCount;
      }
    }
  }
  return newGrid;
};

const presets = {
  glider: {
    name: "Glider",
    description: "A simple pattern that moves across the grid",
    pattern: [[1, 2], [2, 3], [3, 1], [3, 2], [3, 3]]
  },
  oscillator: {
    name: "Blinker",
    description: "Oscillates between two states",
    pattern: [[15, 14], [15, 15], [15, 16]]
  },
  stillLife: {
    name: "Block",
    description: "A stable pattern that never changes",
    pattern: [[14, 14], [14, 15], [15, 14], [15, 15]]
  },
  toad: {
    name: "Toad",
    description: "A 2-period oscillator",
    pattern: [[14, 15], [14, 16], [14, 17], [15, 14], [15, 15], [15, 16]]
  },
  beacon: {
    name: "Beacon",
    description: "Another 2-period oscillator",
    pattern: [[12, 12], [12, 13], [13, 12], [13, 13], [14, 14], [14, 15], [15, 14], [15, 15]]
  },
  pulsar: {
    name: "Pulsar",
    description: "A 3-period oscillator",
    pattern: [
      [10, 12], [10, 13], [10, 14], [10, 18], [10, 19], [10, 20],
      [12, 10], [12, 15], [12, 17], [12, 22],
      [13, 10], [13, 15], [13, 17], [13, 22],
      [14, 10], [14, 15], [14, 17], [14, 22],
      [15, 12], [15, 13], [15, 14], [15, 18], [15, 19], [15, 20],
      [17, 12], [17, 13], [17, 14], [17, 18], [17, 19], [17, 20],
      [18, 10], [18, 15], [18, 17], [18, 22],
      [19, 10], [19, 15], [19, 17], [19, 22],
      [20, 10], [20, 15], [20, 17], [20, 22],
      [22, 12], [22, 13], [22, 14], [22, 18], [22, 19], [22, 20]
    ]
  },
  gliderGun: {
    name: "Glider Gun",
    description: "Creates gliders infinitely",
    pattern: [
      [5, 1], [5, 2], [6, 1], [6, 2],
      [5, 11], [6, 11], [7, 11], [4, 12], [8, 12], [3, 13], [9, 13],
      [3, 14], [9, 14], [6, 15], [4, 16], [8, 16], [5, 17], [6, 17], [7, 17], [6, 18],
      [3, 21], [4, 21], [5, 21], [3, 22], [4, 22], [5, 22], [2, 23], [6, 23],
      [1, 25], [2, 25], [6, 25], [7, 25],
      [3, 35], [4, 35], [3, 36], [4, 36]
    ]
  },
  lightweight: {
    name: "Lightweight Spaceship",
    description: "Travels diagonally across the grid",
    pattern: [[10, 11], [10, 14], [11, 15], [12, 11], [12, 15], [13, 12], [13, 13], [13, 14], [13, 15]]
  },
  pentadecathlon: {
    name: "Pentadecathlon",
    description: "A 15-period oscillator",
    pattern: [[20, 23], [21, 23], [22, 22], [22, 24], [23, 23], [24, 23], [25, 23], [26, 23], [27, 22], [27, 24], [28, 23], [29, 23]]
  },
  diehard: {
    name: "Diehard",
    description: "Dies after 130 generations",
    pattern: [[20, 25], [21, 19], [21, 20], [22, 20], [22, 24], [22, 25], [22, 26]]
  },
  acorn: {
    name: "Acorn",
    description: "Takes 5206 generations to stabilize",
    pattern: [[20, 21], [22, 22], [23, 19], [23, 20], [23, 23], [23, 24], [23, 25]]
  },
  rPentomino: {
    name: "R-Pentomino",
    description: "Chaotic growth pattern",
    pattern: [[24, 25], [24, 26], [25, 24], [25, 25], [26, 25]]
  },
  copperhead: {
    name: "Copperhead",
    description: "Period-12 spaceship",
    pattern: [
      [20, 23], [20, 26], [21, 22], [21, 27], [22, 22], [22, 27],
      [23, 22], [23, 23], [23, 26], [23, 27], [24, 24], [24, 25]
    ]
  },
  gospel: {
    name: "Gospel Glider Gun",
    description: "Produces gliders continuously",
    pattern: [
      [10, 20], [10, 21], [11, 20], [11, 21], [18, 20], [18, 21], [18, 22],
      [19, 19], [19, 23], [20, 18], [20, 24], [21, 18], [21, 24], [22, 21],
      [23, 19], [23, 23], [24, 20], [24, 21], [24, 22], [25, 21]
    ]
  },
  weekender: {
    name: "Weekender",
    description: "Period-2 oscillator",
    pattern: [
      [15, 20], [15, 22], [16, 23], [17, 23], [18, 22], [18, 20], [18, 19],
      [19, 19], [20, 20], [20, 21], [20, 22], [21, 19], [22, 19], [22, 20]
    ]
  }
};

type Rules = {
  survivalMin: number;
  survivalMax: number;
  birthCount: number;
};

const defaultRules: Rules = {
  survivalMin: 2,
  survivalMax: 3,
  birthCount: 3
};

// Enhanced drum machine sounds using Web Audio API
const createDrumSounds = () => {
  const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
  
  const createKick = () => {
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();
    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);
    
    oscillator.frequency.setValueAtTime(60, audioContext.currentTime);
    oscillator.frequency.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.5);
    
    gainNode.gain.setValueAtTime(0.8, audioContext.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.5);
    
    oscillator.start(audioContext.currentTime);
    oscillator.stop(audioContext.currentTime + 0.5);
  };
  
  const createSnare = () => {
    const bufferSize = audioContext.sampleRate * 0.2;
    const buffer = audioContext.createBuffer(1, bufferSize, audioContext.sampleRate);
    const output = buffer.getChannelData(0);
    
    for (let i = 0; i < bufferSize; i++) {
      output[i] = Math.random() * 2 - 1;
    }
    
    const noise = audioContext.createBufferSource();
    const gainNode = audioContext.createGain();
    const filterNode = audioContext.createBiquadFilter();
    
    noise.buffer = buffer;
    noise.connect(filterNode);
    filterNode.connect(gainNode);
    gainNode.connect(audioContext.destination);
    
    filterNode.frequency.value = 1000;
    gainNode.gain.setValueAtTime(0.6, audioContext.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.2);
    
    noise.start(audioContext.currentTime);
  };
  
  const createHiHat = () => {
    const bufferSize = audioContext.sampleRate * 0.1;
    const buffer = audioContext.createBuffer(1, bufferSize, audioContext.sampleRate);
    const output = buffer.getChannelData(0);
    
    for (let i = 0; i < bufferSize; i++) {
      output[i] = Math.random() * 2 - 1;
    }
    
    const noise = audioContext.createBufferSource();
    const gainNode = audioContext.createGain();
    const filterNode = audioContext.createBiquadFilter();
    
    noise.buffer = buffer;
    noise.connect(filterNode);
    filterNode.connect(gainNode);
    gainNode.connect(audioContext.destination);
    
    filterNode.frequency.value = 8000;
    gainNode.gain.setValueAtTime(0.4, audioContext.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.1);
    
    noise.start(audioContext.currentTime);
  };
  
  return { createKick, createSnare, createHiHat };
};

export const GameOfLife = () => {
  const [gridSize, setGridSize] = useState(DEFAULT_GRID_SIZE);
  const [grid, setGrid] = useState<Grid>(() => createEmptyGrid(DEFAULT_GRID_SIZE));
  const [isRunning, setIsRunning] = useState(false);
  const [generation, setGeneration] = useState(0);
  const [speed, setSpeed] = useState([300]); // Changed default to middle value
  const [population, setPopulation] = useState(0);
  const [draggedPattern, setDraggedPattern] = useState<string | null>(null);
  const [rules, setRules] = useState<Rules>(defaultRules);
  const [audioEnabled, setAudioEnabled] = useState(false);
  const [soundStyle, setSoundStyle] = useState<'chiptune' | '8bit' | 'piano' | 'trap'>('chiptune');
  const [heatMapEnabled, setHeatMapEnabled] = useState(false);
  const [shareModalOpen, setShareModalOpen] = useState(false);
  const [view3D, setView3D] = useState(false);
  const [currentSequencerColumn, setCurrentSequencerColumn] = useState(0);
  const intervalRef = useRef<NodeJS.Timeout>();
  const sequencerIntervalRef = useRef<NodeJS.Timeout>();
  const drumSoundsRef = useRef<ReturnType<typeof createDrumSounds> | null>(null);

  // Pattern sharing hook
  const { hasPattern, patternData, loadPattern } = usePatternSharing();

  // Chiptune sequencer hook - using inverted speed (higher value = faster)
  const { currentColumn, isSequencerActive } = useChiptuneSequencer(
    grid,
    isRunning,
    600 - speed[0], // Invert speed: slider left (50) = slow (550), slider right (550) = fast (50)
    audioEnabled,
    soundStyle
  );

  // Pattern analysis hook
  const { metrics, historicalMatches, history, aiDescription, generatedName } = usePatternAnalysis(
    grid,
    generation,
    population
  );

  // Drum sequencer logic - scans grid column by column
  const processDrumSequencer = useCallback(() => {
    if (!audioEnabled || !drumSoundsRef.current || !isRunning) return;

    const column = currentSequencerColumn;
    
    // Divide grid into 3 sections for different drum sounds
    const sectionSize = Math.floor(gridSize / 3);
    
    // Check each section of the current column
    let kickTrigger = false;
    let snareTrigger = false;
    let hihatTrigger = false;
    
    // Top section - Kick drum
    for (let row = 0; row < sectionSize; row++) {
      if (grid[row] && grid[row][column]) {
        kickTrigger = true;
        break;
      }
    }
    
    // Middle section - Snare drum
    for (let row = sectionSize; row < sectionSize * 2; row++) {
      if (grid[row] && grid[row][column]) {
        snareTrigger = true;
        break;
      }
    }
    
    // Bottom section - Hi-hat
    for (let row = sectionSize * 2; row < gridSize; row++) {
      if (grid[row] && grid[row][column]) {
        hihatTrigger = true;
        break;
      }
    }
    
    // Trigger sounds based on cell states
    if (kickTrigger) {
      drumSoundsRef.current.createKick();
    }
    if (snareTrigger) {
      drumSoundsRef.current.createSnare();
    }
    if (hihatTrigger) {
      drumSoundsRef.current.createHiHat();
    }
    
    // Move to next column
    setCurrentSequencerColumn(prev => (prev + 1) % gridSize);
  }, [audioEnabled, isRunning, currentSequencerColumn, grid, gridSize]);

  const runSimulation = useCallback(() => {
    if (!isRunning) return;
    
    setGrid(currentGrid => {
      const newGrid = getNextGeneration(currentGrid, rules, gridSize);
      return newGrid;
    });
    setGeneration(gen => gen + 1);
  }, [isRunning, rules, gridSize]);

  // Initialize audio context when enabled
  useEffect(() => {
    if (audioEnabled && !drumSoundsRef.current) {
      try {
        drumSoundsRef.current = createDrumSounds();
      } catch (error) {
        console.warn('Audio not supported:', error);
        setAudioEnabled(false);
      }
    }
  }, [audioEnabled]);

  // Game simulation interval
  useEffect(() => {
    if (isRunning) {
      intervalRef.current = setInterval(runSimulation, speed[0]);
    } else {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    }
    
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [isRunning, runSimulation, speed]);

  // Drum sequencer interval - synchronized with main speed
  useEffect(() => {
    if (isRunning && audioEnabled) {
      const drumSpeed = Math.max(speed[0] * 0.5, 25); // Scale speed for drum machine
      sequencerIntervalRef.current = setInterval(processDrumSequencer, drumSpeed);
    } else {
      if (sequencerIntervalRef.current) {
        clearInterval(sequencerIntervalRef.current);
      }
    }

    return () => {
      if (sequencerIntervalRef.current) {
        clearInterval(sequencerIntervalRef.current);
      }
    };
  }, [isRunning, audioEnabled, speed, processDrumSequencer]);

  // Reset sequencer when stopped
  useEffect(() => {
    if (!isRunning) {
      setCurrentSequencerColumn(0);
    }
  }, [isRunning]);

  // Load shared pattern on mount
  useEffect(() => {
    if (hasPattern && patternData) {
      loadPattern((data) => {
        setGridSize(data.gridSize);
        setGrid(data.grid);
        setGeneration(data.generation);
        setRules(data.rules);
      });
    }
  }, [hasPattern, patternData, loadPattern]);

  useEffect(() => {
    const count = grid.flat().filter(cell => cell).length;
    setPopulation(count);
  }, [grid]);

  const toggleCell = (x: number, y: number) => {
    if (isRunning) return;
    const newGrid = [...grid];
    newGrid[x][y] = !newGrid[x][y];
    setGrid(newGrid);
  };

  const loadPreset = (preset: keyof typeof presets) => {
    if (isRunning) return;
    const newGrid = createEmptyGrid(gridSize);
    presets[preset].pattern.forEach(([x, y]) => {
      if (x < gridSize && y < gridSize) {
        newGrid[x][y] = true;
      }
    });
    setGrid(newGrid);
    setGeneration(0);
  };

  const dropPattern = (x: number, y: number) => {
    if (isRunning || !draggedPattern) return;
    
    const newGrid = [...grid];
    const pattern = presets[draggedPattern as keyof typeof presets].pattern;
    
    pattern.forEach(([px, py]) => {
      const newX = x + px - Math.min(...pattern.map(p => p[0]));
      const newY = y + py - Math.min(...pattern.map(p => p[1]));
      
      if (newX >= 0 && newX < gridSize && newY >= 0 && newY < gridSize) {
        newGrid[newX][newY] = true;
      }
    });
    
    setGrid(newGrid);
    setDraggedPattern(null);
  };

  const handleDragStart = (patternKey: string) => {
    if (isRunning) return;
    setDraggedPattern(patternKey);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const reset = () => {
    setIsRunning(false);
    setGrid(createEmptyGrid(gridSize));
    setGeneration(0);
  };

  const randomize = () => {
    if (isRunning) return;
    setGrid(createRandomGrid(gridSize));
    setGeneration(0);
  };

  const changeGridSize = (newSize: number) => {
    if (isRunning) return;
    setGridSize(newSize);
    setGrid(createEmptyGrid(newSize));
    setGeneration(0);
  };

  // Calculate dynamic cell size to maintain consistent overall dimensions
  const TOTAL_GRID_SIZE = 600; // Pixels for larger grid
  const cellSize = Math.floor(TOTAL_GRID_SIZE / gridSize) - 1; // Subtract 1 for gap

  return (
    <div className="w-full mx-auto p-2 sm:p-4 lg:p-6 space-y-4 lg:space-y-6">
      <div className="text-center space-y-2 lg:space-y-4">
        <h1 className="text-xl sm:text-2xl lg:text-4xl font-bold text-foreground">Conway's Game of Life</h1>
        <p className="text-sm sm:text-lg lg:text-xl text-muted-foreground">
          Discover how simple rules create complex behaviors - just like in AI systems
        </p>
      </div>

      {/* Mobile-first responsive layout */}
      <div className="flex flex-col lg:flex-row gap-3 lg:gap-6">
        {/* Game Grid - Always first on mobile, 70% width on desktop */}
        <div className="w-full lg:w-[70%] order-1">
          <Card>
            <CardHeader className="p-3 sm:p-6">
              <CardTitle className="flex items-center gap-2 text-base sm:text-lg lg:text-xl">
                <Brain className="h-4 w-4 lg:h-5 lg:w-5" />
                The Game Grid
              </CardTitle>
               <CardDescription className="text-xs sm:text-sm">
                 Click cells to toggle them, or drag patterns from the sidebar to place them anywhere on the grid
               </CardDescription>
            </CardHeader>
            <CardContent className="p-3 sm:p-6">
              <div className="mb-3 sm:mb-4 flex justify-center">
                <Button
                  onClick={() => setView3D(!view3D)}
                  variant="outline"
                  className="flex items-center gap-2 text-xs sm:text-sm h-7 sm:h-8 lg:h-10"
                >
                  <Zap className="h-3 w-3 lg:h-4 lg:w-4" />
                  {view3D ? '2D View' : '3D View'}
                </Button>
              </div>

              {view3D ? (
                <Grid3D 
                  grid={grid} 
                  gridSize={gridSize} 
                  isRunning={isRunning} 
                  generation={generation} 
                />
              ) : (
                <div className="flex justify-center mb-3 sm:mb-4 overflow-x-auto">
                  <div className="relative min-w-fit">
                    <div 
                      className="grid gap-[1px] bg-border p-2 rounded-lg"
                      style={{ 
                        gridTemplateColumns: `repeat(${gridSize}, ${cellSize}px)`,
                        gridTemplateRows: `repeat(${gridSize}, ${cellSize}px)`,
                        width: 'fit-content'
                      }}
                      onDragOver={handleDragOver}
                      onDrop={(e) => {
                        e.preventDefault();
                        const rect = e.currentTarget.getBoundingClientRect();
                        const x = Math.floor((e.clientY - rect.top - 8) / (cellSize + 1));
                        const y = Math.floor((e.clientX - rect.left - 8) / (cellSize + 1));
                        dropPattern(x, y);
                      }}
                    >
                       {grid.map((row, x) =>
                         row.map((cell, y) => (
                           <div
                             key={`${x}-${y}`}
                             className={`cursor-pointer transition-all duration-300 ${
                               cell 
                                 ? 'bg-primary hover:bg-primary/80' 
                                 : 'bg-background hover:bg-muted border border-border/20'
                             } ${
                               audioEnabled && isRunning && y === currentSequencerColumn
                                 ? 'ring-4 ring-blue-400/60 ring-offset-2 shadow-lg shadow-blue-400/30 bg-gradient-to-br from-blue-400/20 to-cyan-400/20 backdrop-blur-sm border-blue-300/50'
                                 : ''
                             }`}
                             style={{ 
                               width: `${cellSize}px`, 
                               height: `${cellSize}px`,
                               ...(audioEnabled && isRunning && y === currentSequencerColumn ? {
                                 background: cell 
                                   ? 'linear-gradient(135deg, rgba(59, 130, 246, 0.8), rgba(6, 182, 212, 0.8))'
                                   : 'linear-gradient(135deg, rgba(59, 130, 246, 0.1), rgba(6, 182, 212, 0.1))',
                                 backdropFilter: 'blur(4px)',
                                 boxShadow: '0 8px 32px rgba(59, 130, 246, 0.2), inset 0 1px 0 rgba(255, 255, 255, 0.2)'
                               } : {})
                             }}
                             onClick={() => toggleCell(x, y)}
                           />
                         ))
                       )}
                    </div>
                    <HeatMapOverlay
                      influence={metrics.influence}
                      gridSize={gridSize}
                      cellSize={cellSize}
                      enabled={heatMapEnabled}
                      totalGridSize={TOTAL_GRID_SIZE}
                    />
                  </div>
                </div>
              )}
              
              <div className="flex flex-wrap gap-1 sm:gap-2 justify-center mb-3 sm:mb-4">
                <Button
                  onClick={() => setIsRunning(!isRunning)}
                  variant={isRunning ? "destructive" : "default"}
                  className="flex items-center gap-1 sm:gap-2 text-xs sm:text-sm h-7 sm:h-8 lg:h-10 px-2 sm:px-4"
                >
                  {isRunning ? <Pause className="h-3 w-3 lg:h-4 lg:w-4" /> : <Play className="h-3 w-3 lg:h-4 lg:w-4" />}
                  <span className="hidden sm:inline">{isRunning ? 'Pause' : 'Play'}</span>
                </Button>
                <Button onClick={reset} variant="outline" className="flex items-center gap-1 sm:gap-2 text-xs sm:text-sm h-7 sm:h-8 lg:h-10 px-2 sm:px-4">
                  <RotateCcw className="h-3 w-3 lg:h-4 lg:w-4" />
                  <span className="hidden sm:inline">Reset</span>
                </Button>
                <Button onClick={randomize} variant="outline" className="flex items-center gap-1 sm:gap-2 text-xs sm:text-sm h-7 sm:h-8 lg:h-10 px-2 sm:px-4">
                  <Zap className="h-3 w-3 lg:h-4 lg:w-4" />
                  <span className="hidden sm:inline">Random</span>
                </Button>
                  <Button
                    onClick={() => setAudioEnabled(!audioEnabled)}
                    variant="outline"
                    className="flex items-center gap-1 sm:gap-2 text-xs sm:text-sm h-7 sm:h-8 lg:h-10 px-2 sm:px-4"
                  >
                    {audioEnabled ? <Volume2 className="h-3 w-3 lg:h-4 lg:w-4" /> : <VolumeX className="h-3 w-3 lg:h-4 lg:w-4" />}
                    <span className="hidden sm:inline">{audioEnabled ? 'Audio On' : 'Audio Off'}</span>
                  </Button>
                   <Button
                     onClick={() => setHeatMapEnabled(!heatMapEnabled)}
                     variant="outline"
                     className="flex items-center gap-1 sm:gap-2 text-xs sm:text-sm h-7 sm:h-8 lg:h-10 px-2 sm:px-4"
                   >
                     <Thermometer className="h-3 w-3 lg:h-4 lg:w-4" />
                     <span className="hidden sm:inline">{heatMapEnabled ? 'Heat Map On' : 'Heat Map Off'}</span>
                   </Button>
                   <Button
                     onClick={() => setShareModalOpen(true)}
                     variant="default"
                     className="flex items-center gap-1 sm:gap-2 text-xs sm:text-sm h-7 sm:h-8 lg:h-10 px-2 sm:px-4"
                     disabled={population === 0}
                   >
                     <Share2 className="h-3 w-3 lg:h-4 lg:w-4" />
                     <span className="hidden sm:inline">Share</span>
                   </Button>
                 </div>

              <div className="mt-3 sm:mt-4 space-y-3 sm:space-y-4">
                <div className="space-y-2">
                  <label className="text-xs sm:text-sm font-medium">Grid Size</label>
                  <div className="flex gap-1 sm:gap-2">
                    {[15, 25, 35, 50].map((size) => (
                      <Button
                        key={size}
                        onClick={() => changeGridSize(size)}
                        variant={gridSize === size ? "default" : "outline"}
                        size="sm"
                        disabled={isRunning}
                        className="text-xs h-6 sm:h-7 px-2 sm:px-3"
                      >
                        {size}×{size}
                      </Button>
                    ))}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Current: {gridSize}×{gridSize} grid
                  </p>
                </div>
                
                <div className="space-y-2">
                  <label className="text-xs sm:text-sm font-medium">Speed Control</label>
                  <Slider
                    value={speed}
                    onValueChange={setSpeed}
                    max={550}
                    min={50}
                    step={50}
                    className="w-full"
                  />
                  <p className="text-xs text-muted-foreground">
                    Slower ← {Math.round((speed[0] - 50) / 5)}% → Faster
                  </p>
                </div>

              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right sidebar - Controls and Patterns */}
        <div className="w-full lg:w-[30%] flex flex-col gap-3 lg:gap-4 order-2">
          {/* Stats & Audio Controls */}
          <Card>
            <CardHeader className="p-3 sm:pb-3">
              <CardTitle className="text-sm lg:text-base">Statistics & Audio</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 p-3">
              <div className="grid grid-cols-2 gap-2">
                <div className="text-center">
                  <div className="text-xs text-muted-foreground">Generation</div>
                  <Badge variant="secondary" className="text-xs">{generation}</Badge>
                </div>
                <div className="text-center">
                  <div className="text-xs text-muted-foreground">Population</div>
                  <Badge variant="secondary" className="text-xs">{population}</Badge>
                </div>
              </div>
              
              <div className="space-y-2">
                <div className="grid grid-cols-2 gap-1">
                  {(['chiptune', '8bit', 'piano', 'trap'] as const).map((style) => (
                    <Button
                      key={style}
                      onClick={() => setSoundStyle(style)}
                      variant={soundStyle === style ? "default" : "outline"}
                      size="sm"
                      className="text-xs h-6 sm:h-7"
                    >
                      {style === '8bit' ? '8-Bit' : style.charAt(0).toUpperCase() + style.slice(1)}
                    </Button>
                  ))}
                </div>
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>Sequencer Col: {currentSequencerColumn + 1}</span>
                  <Badge variant={audioEnabled && isRunning ? "default" : "secondary"} className="text-xs">
                    {audioEnabled && isRunning ? "Playing" : "Stopped"}
                  </Badge>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Custom Rules */}
          <Card>
            <CardHeader className="p-3 sm:pb-3">
              <CardTitle className="text-sm lg:text-base">Custom Rules</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 p-3">
              <div className="space-y-2">
                <label className="text-xs font-medium">Survival Range</label>
                <div className="flex gap-2 items-center">
                  <input
                    type="number"
                    min="0"
                    max="8"
                    value={rules.survivalMin}
                    onChange={(e) => setRules(prev => ({ ...prev, survivalMin: parseInt(e.target.value) || 0 }))}
                    className="w-12 px-1 py-1 text-xs border rounded"
                    disabled={isRunning}
                  />
                  <span className="text-xs">to</span>
                  <input
                    type="number"
                    min="0"
                    max="8"
                    value={rules.survivalMax}
                    onChange={(e) => setRules(prev => ({ ...prev, survivalMax: parseInt(e.target.value) || 0 }))}
                    className="w-12 px-1 py-1 text-xs border rounded"
                    disabled={isRunning}
                  />
                </div>
              </div>
              
              <div className="space-y-2">
                <label className="text-xs font-medium">Birth Count</label>
                <input
                  type="number"
                  min="0"
                  max="8"
                  value={rules.birthCount}
                  onChange={(e) => setRules(prev => ({ ...prev, birthCount: parseInt(e.target.value) || 0 }))}
                  className="w-12 px-1 py-1 text-xs border rounded"
                  disabled={isRunning}
                />
              </div>

              <Button
                onClick={() => setRules(defaultRules)}
                variant="outline"
                size="sm"
                className="w-full h-7 text-xs"
                disabled={isRunning}
              >
                Reset Rules
              </Button>
            </CardContent>
          </Card>

          {/* Classic Patterns - Collapsible on mobile */}
          <Card>
            <CardHeader className="p-3">
              <CardTitle className="text-sm lg:text-base">Classic Patterns</CardTitle>
              <CardDescription className="text-xs lg:text-sm">
                Drag patterns to place them on the grid
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-2 lg:space-y-3 max-h-[300px] lg:max-h-[400px] overflow-y-auto p-3">
              <div className="grid grid-cols-2 lg:grid-cols-1 gap-1 sm:gap-2">
                {Object.entries(presets).map(([key, preset]) => (
                  <div key={key} className="space-y-1">
                    <Button
                      onClick={() => loadPreset(key as keyof typeof presets)}
                      variant="outline"
                      className="w-full cursor-grab active:cursor-grabbing text-xs h-7 sm:h-8"
                      disabled={isRunning}
                      draggable={!isRunning}
                      onDragStart={() => handleDragStart(key)}
                    >
                      {preset.name}
                    </Button>
                    <p className="text-xs text-muted-foreground hidden lg:block">
                      {preset.description}
                    </p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Evolution Competition */}
      <EvolutionCompetition />

      {/* Pattern Analysis Panel */}
      <Card>
        <CardHeader className="p-3 sm:p-6">
          <CardTitle className="flex items-center gap-2">
            <Brain className="h-5 w-5" />
            Pattern Analysis & AI Insights
          </CardTitle>
          <CardDescription>
            Real-time analysis of complexity, pattern recognition, and AI predictions
          </CardDescription>
        </CardHeader>
        <CardContent className="p-3 sm:p-6">
          <PatternMetrics 
            metrics={metrics}
            historicalMatches={historicalMatches}
            history={history}
          />
        </CardContent>
      </Card>

      {/* Rules */}
      <Card>
        <CardHeader className="p-3 sm:p-6">
          <CardTitle>The Rules (Conway's Laws)</CardTitle>
          <CardDescription>
            These simple rules create all the complexity you see
          </CardDescription>
        </CardHeader>
        <CardContent className="p-3 sm:p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="p-4 bg-muted rounded-lg">
              <h4 className="font-semibold mb-2">Underpopulation</h4>
              <p className="text-sm text-muted-foreground">
                Living cell with &lt; {rules.survivalMin} neighbors dies
              </p>
            </div>
            <div className="p-4 bg-muted rounded-lg">
              <h4 className="font-semibold mb-2">Survival</h4>
              <p className="text-sm text-muted-foreground">
                Living cell with {rules.survivalMin}-{rules.survivalMax} neighbors survives
              </p>
            </div>
            <div className="p-4 bg-muted rounded-lg">
              <h4 className="font-semibold mb-2">Overpopulation</h4>
              <p className="text-sm text-muted-foreground">
                Living cell with &gt; {rules.survivalMax} neighbors dies
              </p>
            </div>
            <div className="p-4 bg-muted rounded-lg">
              <h4 className="font-semibold mb-2">Reproduction</h4>
              <p className="text-sm text-muted-foreground">
                Dead cell with exactly {rules.birthCount} neighbors becomes alive
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* AI Connection */}
      <Card>
        <CardHeader className="p-3 sm:p-6">
          <CardTitle className="flex items-center gap-2">
            <MessageSquare className="h-5 w-5" />
            AI Connection
          </CardTitle>
          <CardDescription>
            How Conway's Game of Life relates to artificial intelligence
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4 p-3 sm:p-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-3 bg-muted rounded-lg">
              <h4 className="font-semibold mb-2">Emergence</h4>
              <p className="text-sm text-muted-foreground">
                Complex patterns emerge from simple rules - just like how LLMs generate 
                sophisticated responses from basic mathematical operations.
              </p>
            </div>
            <div className="p-3 bg-muted rounded-lg">
              <h4 className="font-semibold mb-2">Transfer Learning</h4>
              <p className="text-sm text-muted-foreground">
                Patterns like gliders "transfer" their behavior across the grid, 
                similar to how AI models transfer learned patterns to new contexts.
              </p>
            </div>
            <div className="p-3 bg-muted rounded-lg">
              <h4 className="font-semibold mb-2">Prompt Engineering</h4>
              <p className="text-sm text-muted-foreground">
                The initial configuration is like a "prompt" - small changes can 
                lead to completely different evolutionary paths.
              </p>
            </div>
          </div>
          
          <div className="pt-4 border-t border-border">
            <p className="text-sm text-muted-foreground">
              Inspired by <a 
                href="https://github.com/lamm-mit/LifeGPT" 
                target="_blank" 
                rel="noopener noreferrer" 
                className="text-primary hover:underline font-medium"
              >
                LifeGPT
              </a> - An AI system that uses Game of Life patterns to demonstrate emergent intelligence.
            </p>
          </div>
        </CardContent>
      </Card>
      
      {/* Share Modal */}
      <ShareModal
        isOpen={shareModalOpen}
        onClose={() => setShareModalOpen(false)}
        grid={grid}
        gridSize={gridSize}
        generation={generation}
        population={population}
        rules={rules}
        generatedName={generatedName}
        aiDescription={aiDescription}
      />
    </div>
  );
};
