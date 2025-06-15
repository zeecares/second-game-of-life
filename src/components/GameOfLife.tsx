import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Slider } from '@/components/ui/slider';
import { Badge } from '@/components/ui/badge';
import { Play, Pause, RotateCcw, Zap, Brain, MessageSquare } from 'lucide-react';

const GRID_SIZE = 30;

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

const getNextGeneration = (grid: Grid): Grid => {
  const newGrid = createEmptyGrid();
  for (let x = 0; x < GRID_SIZE; x++) {
    for (let y = 0; y < GRID_SIZE; y++) {
      const neighbors = countNeighbors(grid, x, y);
      if (grid[x][y]) {
        // Cell is alive
        newGrid[x][y] = neighbors === 2 || neighbors === 3;
      } else {
        // Cell is dead
        newGrid[x][y] = neighbors === 3;
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
  }
};

export const GameOfLife = () => {
  const [grid, setGrid] = useState<Grid>(createEmptyGrid);
  const [isRunning, setIsRunning] = useState(false);
  const [generation, setGeneration] = useState(0);
  const [speed, setSpeed] = useState([200]);
  const [population, setPopulation] = useState(0);
  const intervalRef = useRef<NodeJS.Timeout>();

  const runSimulation = useCallback(() => {
    if (!isRunning) return;
    
    setGrid(currentGrid => {
      const newGrid = getNextGeneration(currentGrid);
      return newGrid;
    });
    setGeneration(gen => gen + 1);
  }, [isRunning]);

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

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Game Grid */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Brain className="h-5 w-5" />
                The Game Grid
              </CardTitle>
              <CardDescription>
                Click cells to toggle them, then press play to see evolution
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex justify-center mb-4">
                <div 
                  className="grid gap-px bg-border p-2 rounded-lg"
                  style={{ 
                    gridTemplateColumns: `repeat(${GRID_SIZE}, minmax(0, 1fr))`,
                    width: 'fit-content'
                  }}
                >
                  {grid.map((row, x) =>
                    row.map((cell, y) => (
                      <div
                        key={`${x}-${y}`}
                        className={`w-4 h-4 cursor-pointer transition-colors ${
                          cell 
                            ? 'bg-primary hover:bg-primary/80' 
                            : 'bg-background hover:bg-muted'
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
        <div className="space-y-6">
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

          {/* Presets */}
          <Card>
            <CardHeader>
              <CardTitle>Classic Patterns</CardTitle>
              <CardDescription>
                Load famous patterns to see different behaviors
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {Object.entries(presets).map(([key, preset]) => (
                <div key={key} className="space-y-2">
                  <Button
                    onClick={() => loadPreset(key as keyof typeof presets)}
                    variant="outline"
                    className="w-full"
                    disabled={isRunning}
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

          {/* AI Connection */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MessageSquare className="h-5 w-5" />
                AI Connection
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <div className="p-3 bg-muted rounded-lg">
                <h4 className="font-semibold mb-2">Emergence</h4>
                <p className="text-muted-foreground">
                  Complex patterns emerge from simple rules - just like how LLMs generate 
                  sophisticated responses from basic mathematical operations.
                </p>
              </div>
              <div className="p-3 bg-muted rounded-lg">
                <h4 className="font-semibold mb-2">Transfer Learning</h4>
                <p className="text-muted-foreground">
                  Patterns like gliders "transfer" their behavior across the grid, 
                  similar to how AI models transfer learned patterns to new contexts.
                </p>
              </div>
              <div className="p-3 bg-muted rounded-lg">
                <h4 className="font-semibold mb-2">Prompt Engineering</h4>
                <p className="text-muted-foreground">
                  The initial configuration is like a "prompt" - small changes can 
                  lead to completely different evolutionary paths.
                </p>
              </div>
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
                Living cell with &lt; 2 neighbors dies
              </p>
            </div>
            <div className="p-4 bg-muted rounded-lg">
              <h4 className="font-semibold mb-2">Survival</h4>
              <p className="text-sm text-muted-foreground">
                Living cell with 2-3 neighbors survives
              </p>
            </div>
            <div className="p-4 bg-muted rounded-lg">
              <h4 className="font-semibold mb-2">Overpopulation</h4>
              <p className="text-sm text-muted-foreground">
                Living cell with &gt; 3 neighbors dies
              </p>
            </div>
            <div className="p-4 bg-muted rounded-lg">
              <h4 className="font-semibold mb-2">Reproduction</h4>
              <p className="text-sm text-muted-foreground">
                Dead cell with exactly 3 neighbors becomes alive
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};