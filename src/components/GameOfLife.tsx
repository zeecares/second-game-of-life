import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Slider } from '@/components/ui/slider';
import { Badge } from '@/components/ui/badge';
import { Play, Pause, RotateCcw, Zap, Brain, MessageSquare, Volume2, VolumeX, Music } from 'lucide-react';
import { useChiptuneSequencer } from '@/hooks/useChiptuneSequencer';

const GRID_SIZE = 50;

type Grid = boolean[][];

const createEmptyGrid = (): Grid => {
  return Array(GRID_SIZE).fill(null).map(() => Array(GRID_SIZE).fill(false));
};

const createRandomGrid = (): Grid => {
  return Array(GRID_SIZE).fill(null).map(() => 
    Array(GRID_SIZE).fill(null).map(() => Math.random() > 0.7)
  );
};

const countNeighbors = (grid: Grid, x: number, y: number): number => {
  let count = 0;
  for (let i = -1; i <= 1; i++) {
    for (let j = -1; j <= 1; j++) {
      if (i === 0 && j === 0) continue;
      const newX = x + i;
      const newY = y + j;
      if (newX >= 0 && newX < GRID_SIZE && newY >= 0 && newY < GRID_SIZE) {
        if (grid[newX][newY]) count++;
      }
    }
  }
  return count;
};

const getNextGeneration = (grid: Grid, rules: Rules): Grid => {
  const newGrid = createEmptyGrid();
  for (let x = 0; x < GRID_SIZE; x++) {
    for (let y = 0; y < GRID_SIZE; y++) {
      const neighbors = countNeighbors(grid, x, y);
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

// Drum machine sounds using Web Audio API
const createDrumSounds = () => {
  const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
  
  const createKick = () => {
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();
    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);
    
    oscillator.frequency.setValueAtTime(60, audioContext.currentTime);
    oscillator.frequency.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.5);
    
    gainNode.gain.setValueAtTime(1, audioContext.currentTime);
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
    gainNode.gain.setValueAtTime(0.7, audioContext.currentTime);
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
    gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.1);
    
    noise.start(audioContext.currentTime);
  };
  
  return { createKick, createSnare, createHiHat };
};

export const GameOfLife = () => {
  const [grid, setGrid] = useState<Grid>(createEmptyGrid);
  const [isRunning, setIsRunning] = useState(false);
  const [generation, setGeneration] = useState(0);
  const [speed, setSpeed] = useState([200]);
  const [population, setPopulation] = useState(0);
  const [draggedPattern, setDraggedPattern] = useState<string | null>(null);
  const [rules, setRules] = useState<Rules>(defaultRules);
  const [audioEnabled, setAudioEnabled] = useState(false);
  const [soundStyle, setSoundStyle] = useState<'chiptune' | '8bit' | 'piano' | 'trap'>('chiptune');
  const intervalRef = useRef<NodeJS.Timeout>();
  const drumSoundsRef = useRef<ReturnType<typeof createDrumSounds> | null>(null);

  // Chiptune sequencer hook
  const { currentColumn, isSequencerActive } = useChiptuneSequencer(
    grid,
    isRunning,
    speed[0],
    audioEnabled,
    soundStyle
  );

  const runSimulation = useCallback(() => {
    if (!isRunning) return;
    
    setGrid(currentGrid => {
      const newGrid = getNextGeneration(currentGrid, rules);
      return newGrid;
    });
    setGeneration(gen => gen + 1);
  }, [isRunning, rules]);

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
    const newGrid = createEmptyGrid();
    presets[preset].pattern.forEach(([x, y]) => {
      newGrid[x][y] = true;
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
      
      if (newX >= 0 && newX < GRID_SIZE && newY >= 0 && newY < GRID_SIZE) {
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
    setGrid(createEmptyGrid());
    setGeneration(0);
  };

  const randomize = () => {
    if (isRunning) return;
    setGrid(createRandomGrid());
    setGeneration(0);
  };

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-6">
      <div className="text-center space-y-4">
        <h1 className="text-4xl font-bold text-foreground">Conway's Game of Life</h1>
        <p className="text-xl text-muted-foreground">
          Discover how simple rules create complex behaviors - just like in AI systems
        </p>
      </div>

      <div className="flex gap-6">
        {/* Classic Patterns Sidebar */}
        <div className="w-64 flex-shrink-0">
          <Card>
            <CardHeader>
              <CardTitle>Classic Patterns</CardTitle>
              <CardDescription>
                Drag patterns to place them on the grid
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3 max-h-96 overflow-y-auto">
              {Object.entries(presets).map(([key, preset]) => (
                <div key={key} className="space-y-2">
                  <Button
                    onClick={() => loadPreset(key as keyof typeof presets)}
                    variant="outline"
                    className="w-full cursor-grab active:cursor-grabbing"
                    disabled={isRunning}
                    draggable={!isRunning}
                    onDragStart={() => handleDragStart(key)}
                  >
                    {preset.name}
                  </Button>
                  <p className="text-xs text-muted-foreground">
                    {preset.description}
                  </p>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>

        {/* Game Grid */}
        <div className="flex-1">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Brain className="h-5 w-5" />
                The Game Grid
              </CardTitle>
               <CardDescription>
                 Click cells to toggle them, or drag patterns from the sidebar to place them anywhere on the grid
               </CardDescription>
            </CardHeader>
            <CardContent>
               <div className="flex justify-center mb-4 relative">
                 <div 
                   className="grid gap-[1px] bg-border p-2 rounded-lg"
                   style={{ 
                     gridTemplateColumns: `repeat(${GRID_SIZE}, 8px)`,
                     gridTemplateRows: `repeat(${GRID_SIZE}, 8px)`,
                     width: 'fit-content'
                   }}
                   onDragOver={handleDragOver}
                   onDrop={(e) => {
                     e.preventDefault();
                     const rect = e.currentTarget.getBoundingClientRect();
                     const x = Math.floor((e.clientY - rect.top - 8) / 9);
                     const y = Math.floor((e.clientX - rect.left - 8) / 9);
                     dropPattern(x, y);
                   }}
                 >
                    {grid.map((row, x) =>
                      row.map((cell, y) => (
                        <div
                          key={`${x}-${y}`}
                          className={`w-2 h-2 cursor-pointer transition-colors ${
                            cell 
                              ? 'bg-primary hover:bg-primary/80' 
                              : 'bg-background hover:bg-muted border border-border/20'
                          } ${
                            isSequencerActive && y === currentColumn
                              ? 'ring-2 ring-accent ring-offset-1'
                              : ''
                          }`}
                          onClick={() => toggleCell(x, y)}
                        />
                      ))
                    )}
                 </div>
               </div>

              <div className="flex flex-wrap gap-2 justify-center">
                <Button
                  onClick={() => setIsRunning(!isRunning)}
                  variant={isRunning ? "destructive" : "default"}
                  className="flex items-center gap-2"
                >
                  {isRunning ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
                  {isRunning ? 'Pause' : 'Play'}
                </Button>
                <Button onClick={reset} variant="outline" className="flex items-center gap-2">
                  <RotateCcw className="h-4 w-4" />
                  Reset
                </Button>
                <Button onClick={randomize} variant="outline" className="flex items-center gap-2">
                  <Zap className="h-4 w-4" />
                  Random
                </Button>
                 <Button
                   onClick={() => setAudioEnabled(!audioEnabled)}
                   variant="outline"
                   className="flex items-center gap-2"
                 >
                   {audioEnabled ? <Volume2 className="h-4 w-4" /> : <VolumeX className="h-4 w-4" />}
                   {audioEnabled ? 'Audio On' : 'Audio Off'}
                 </Button>
              </div>

              <div className="mt-4 space-y-2">
                <label className="text-sm font-medium">Speed Control</label>
                <Slider
                  value={speed}
                  onValueChange={setSpeed}
                  max={500}
                  min={50}
                  step={50}
                  className="w-full"
                />
                <p className="text-xs text-muted-foreground">
                  {speed[0]}ms per generation
                </p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Controls and Info */}
        <div className="w-64 flex-shrink-0 space-y-6">
          {/* Stats */}
          <Card>
            <CardHeader>
              <CardTitle>Statistics</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex justify-between">
                <span>Generation:</span>
                <Badge variant="secondary">{generation}</Badge>
              </div>
              <div className="flex justify-between">
                <span>Population:</span>
                <Badge variant="secondary">{population}</Badge>
              </div>
            </CardContent>
          </Card>

           {/* Chiptune Sequencer */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Music className="h-5 w-5" />
                Chiptune Sequencer
              </CardTitle>
              <CardDescription>
                Each column plays chiptune notes as the sequencer moves left to right
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="space-y-2">
                <label className="text-sm font-medium">Sound Style</label>
                <div className="grid grid-cols-2 gap-2">
                  {(['chiptune', '8bit', 'piano', 'trap'] as const).map((style) => (
                    <Button
                      key={style}
                      onClick={() => setSoundStyle(style)}
                      variant={soundStyle === style ? "default" : "outline"}
                      size="sm"
                      className="text-xs"
                    >
                      {style === '8bit' ? '8-Bit' : style.charAt(0).toUpperCase() + style.slice(1)}
                    </Button>
                  ))}
                </div>
              </div>
              <div className="text-xs text-muted-foreground space-y-1">
                <div className="flex justify-between">
                  <span>Active Column:</span>
                  <Badge variant="outline">{currentColumn + 1}</Badge>
                </div>
                <div className="flex justify-between">
                  <span>Status:</span>
                  <Badge variant={isSequencerActive ? "default" : "secondary"}>
                    {isSequencerActive ? "Playing" : "Stopped"}
                  </Badge>
                </div>
                <p className="text-xs pt-2">
                  Each row maps to a different note in a pentatonic scale. 
                  Living cells trigger their assigned notes as the sequencer cursor moves across columns.
                </p>
              </div>
            </CardContent>
          </Card>

           {/* Sound Trigger Logic */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                {audioEnabled ? <Volume2 className="h-5 w-5" /> : <VolumeX className="h-5 w-5" />}
                Sound Logic
              </CardTitle>
              <CardDescription>
                How the grid triggers audio
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
               <div className="text-xs text-muted-foreground space-y-2">
                 <div>
                   <strong>Chiptune:</strong> Pure melodic sequencer with square wave chiptune sounds
                 </div>
                 <div>
                   <strong>8-Bit:</strong> Super Mario style 8-bit sounds with frequency sweeps and drums every 4th beat
                 </div>
                 <div>
                   <strong>Piano:</strong> Piano with harmonics - pure melody, no drums
                 </div>
                 <div>
                   <strong>Trap:</strong> Heavy bass notes with 808 drums every 4th beat when cells are active
                 </div>
                 <div className="pt-2">
                   Each row maps to a pentatonic scale note. Living cells trigger notes as the sequencer cursor moves left to right across columns.
                 </div>
               </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>Custom Rules</CardTitle>
              <CardDescription>
                Experiment with different rules to see how they affect evolution
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Survival Range</label>
                <div className="flex gap-2 items-center">
                  <input
                    type="number"
                    min="0"
                    max="8"
                    value={rules.survivalMin}
                    onChange={(e) => setRules(prev => ({ ...prev, survivalMin: parseInt(e.target.value) || 0 }))}
                    className="w-16 px-2 py-1 text-sm border rounded"
                    disabled={isRunning}
                  />
                  <span className="text-sm">to</span>
                  <input
                    type="number"
                    min="0"
                    max="8"
                    value={rules.survivalMax}
                    onChange={(e) => setRules(prev => ({ ...prev, survivalMax: parseInt(e.target.value) || 0 }))}
                    className="w-16 px-2 py-1 text-sm border rounded"
                    disabled={isRunning}
                  />
                </div>
                <p className="text-xs text-muted-foreground">
                  Living cells survive with this many neighbors
                </p>
              </div>
              
              <div className="space-y-2">
                <label className="text-sm font-medium">Birth Count</label>
                <input
                  type="number"
                  min="0"
                  max="8"
                  value={rules.birthCount}
                  onChange={(e) => setRules(prev => ({ ...prev, birthCount: parseInt(e.target.value) || 0 }))}
                  className="w-16 px-2 py-1 text-sm border rounded"
                  disabled={isRunning}
                />
                <p className="text-xs text-muted-foreground">
                  Dead cells become alive with exactly this many neighbors
                </p>
              </div>

              <Button
                onClick={() => setRules(defaultRules)}
                variant="outline"
                size="sm"
                className="w-full"
                disabled={isRunning}
              >
                Reset to Conway's Rules
              </Button>
            </CardContent>
          </Card>

        </div>
      </div>

      {/* Rules */}
      <Card>
        <CardHeader>
          <CardTitle>The Rules (Conway's Laws)</CardTitle>
          <CardDescription>
            These simple rules create all the complexity you see
          </CardDescription>
        </CardHeader>
        <CardContent>
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
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MessageSquare className="h-5 w-5" />
            AI Connection
          </CardTitle>
          <CardDescription>
            How Conway's Game of Life relates to artificial intelligence
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
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
    </div>
  );
};