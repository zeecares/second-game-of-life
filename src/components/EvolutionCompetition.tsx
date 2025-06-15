
import React, { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Trophy, Play, Pause, RotateCcw, Zap } from 'lucide-react';

type Grid = boolean[][];
type Rules = {
  survivalMin: number;
  survivalMax: number;
  birthCount: number;
  name: string;
  color: string;
};

interface CompetitorState {
  grid: Grid;
  population: number;
  generation: number;
  maxPopulation: number;
  stability: number;
  rules: Rules;
}

const predefinedRules: Rules[] = [
  { survivalMin: 2, survivalMax: 3, birthCount: 3, name: "Conway's Classic", color: "#22c55e" },
  { survivalMin: 1, survivalMax: 1, birthCount: 1, name: "Replicator", color: "#3b82f6" },
  { survivalMin: 2, survivalMax: 2, birthCount: 3, name: "Seeds", color: "#f59e0b" },
  { survivalMin: 1, survivalMax: 2, birthCount: 3, name: "Flock", color: "#ef4444" },
  { survivalMin: 3, survivalMax: 4, birthCount: 3, name: "Maze", color: "#8b5cf6" },
  { survivalMin: 2, survivalMax: 3, birthCount: 6, name: "HighLife", color: "#06b6d4" }
];

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
        newGrid[x][y] = neighbors >= rules.survivalMin && neighbors <= rules.survivalMax;
      } else {
        newGrid[x][y] = neighbors === rules.birthCount;
      }
    }
  }
  return newGrid;
};

export const EvolutionCompetition = () => {
  const [competitors, setCompetitors] = useState<CompetitorState[]>([]);
  const [isRunning, setIsRunning] = useState(false);
  const [winner, setWinner] = useState<CompetitorState | null>(null);
  const [raceComplete, setRaceComplete] = useState(false);
  const intervalRef = useRef<NodeJS.Timeout>();
  const gridSize = 20;
  const maxGenerations = 100;

  const initializeCompetition = () => {
    const initialCompetitors = predefinedRules.map(rules => ({
      grid: createRandomGrid(gridSize),
      population: 0,
      generation: 0,
      maxPopulation: 0,
      stability: 0,
      rules
    }));
    
    // Calculate initial populations
    const competitorsWithPop = initialCompetitors.map(comp => {
      const pop = comp.grid.flat().filter(cell => cell).length;
      return {
        ...comp,
        population: pop,
        maxPopulation: pop
      };
    });
    
    setCompetitors(competitorsWithPop);
    setWinner(null);
    setRaceComplete(false);
  };

  const runGeneration = () => {
    setCompetitors(prev => {
      const newCompetitors = prev.map(comp => {
        if (comp.generation >= maxGenerations) return comp;
        
        const newGrid = getNextGeneration(comp.grid, comp.rules, gridSize);
        const newPop = newGrid.flat().filter(cell => cell).length;
        const newMaxPop = Math.max(comp.maxPopulation, newPop);
        
        // Calculate stability (how much population changed)
        const popChange = Math.abs(newPop - comp.population);
        const newStability = comp.stability + (popChange < 5 ? 1 : -2);
        
        return {
          ...comp,
          grid: newGrid,
          population: newPop,
          generation: comp.generation + 1,
          maxPopulation: newMaxPop,
          stability: Math.max(0, newStability)
        };
      });
      
      // Check if race is complete
      const allComplete = newCompetitors.every(comp => comp.generation >= maxGenerations);
      if (allComplete && !raceComplete) {
        setRaceComplete(true);
        setIsRunning(false);
        
        // Determine winner based on a combination of factors
        const winner = newCompetitors.reduce((best, current) => {
          const currentScore = current.maxPopulation + current.stability * 2 + (current.population > 0 ? 50 : 0);
          const bestScore = best.maxPopulation + best.stability * 2 + (best.population > 0 ? 50 : 0);
          return currentScore > bestScore ? current : best;
        });
        
        setWinner(winner);
      }
      
      return newCompetitors;
    });
  };

  useEffect(() => {
    if (isRunning && !raceComplete) {
      intervalRef.current = setInterval(runGeneration, 200);
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
  }, [isRunning, raceComplete]);

  useEffect(() => {
    initializeCompetition();
  }, []);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Trophy className="h-5 w-5 text-yellow-500" />
          Evolution Competition
        </CardTitle>
        <CardDescription>
          Watch different rule sets compete to see which creates the most successful life forms!
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex gap-2 justify-center">
          <Button
            onClick={() => setIsRunning(!isRunning)}
            disabled={raceComplete}
            variant={isRunning ? "destructive" : "default"}
            className="flex items-center gap-2"
          >
            {isRunning ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
            {isRunning ? 'Pause Race' : 'Start Race'}
          </Button>
          <Button
            onClick={initializeCompetition}
            variant="outline"
            className="flex items-center gap-2"
          >
            <RotateCcw className="h-4 w-4" />
            New Race
          </Button>
        </div>

        {winner && raceComplete && (
          <div className="text-center p-4 bg-gradient-to-r from-yellow-50 to-yellow-100 dark:from-yellow-900/20 dark:to-yellow-800/20 rounded-lg border border-yellow-200 dark:border-yellow-800">
            <div className="flex items-center justify-center gap-2 mb-2">
              <Trophy className="h-6 w-6 text-yellow-500" />
              <h3 className="text-lg font-bold">Winner!</h3>
            </div>
            <p className="text-sm text-muted-foreground">
              <span className="font-semibold" style={{ color: winner.rules.color }}>
                {winner.rules.name}
              </span>
              {' '}dominated with {winner.maxPopulation} max population and {winner.stability} stability points!
            </p>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {competitors.map((comp, index) => (
            <div key={index} className="p-4 border rounded-lg bg-muted/50">
              <div className="flex items-center justify-between mb-2">
                <h4 className="font-semibold text-sm" style={{ color: comp.rules.color }}>
                  {comp.rules.name}
                </h4>
                {winner === comp && (
                  <Trophy className="h-4 w-4 text-yellow-500" />
                )}
              </div>
              
              <div className="space-y-2">
                <div className="flex justify-between text-xs">
                  <span>Generation:</span>
                  <Badge variant="secondary">{comp.generation}/{maxGenerations}</Badge>
                </div>
                
                <div className="flex justify-between text-xs">
                  <span>Population:</span>
                  <Badge variant="secondary">{comp.population}</Badge>
                </div>
                
                <div className="flex justify-between text-xs">
                  <span>Max Pop:</span>
                  <Badge variant="secondary">{comp.maxPopulation}</Badge>
                </div>
                
                <div className="flex justify-between text-xs">
                  <span>Stability:</span>
                  <Badge variant="secondary">{comp.stability}</Badge>
                </div>
                
                <div className="space-y-1">
                  <div className="flex justify-between text-xs">
                    <span>Progress:</span>
                    <span>{Math.round((comp.generation / maxGenerations) * 100)}%</span>
                  </div>
                  <Progress value={(comp.generation / maxGenerations) * 100} className="h-2" />
                </div>
                
                {/* Mini grid visualization */}
                <div className="mt-2">
                  <div 
                    className="grid gap-px bg-border rounded"
                    style={{ 
                      gridTemplateColumns: `repeat(${gridSize}, 3px)`,
                      gridTemplateRows: `repeat(${gridSize}, 3px)`,
                    }}
                  >
                    {comp.grid.map((row, x) =>
                      row.map((cell, y) => (
                        <div
                          key={`${x}-${y}`}
                          className="w-[3px] h-[3px]"
                          style={{
                            backgroundColor: cell ? comp.rules.color : '#1f1f1f'
                          }}
                        />
                      ))
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};
