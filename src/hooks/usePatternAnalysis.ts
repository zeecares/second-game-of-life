import { useEffect, useState, useMemo } from 'react';

type Grid = boolean[][];

interface PatternMetrics {
  entropy: number;
  diversity: number;
  stability: number;
  growth: number;
  influence: number[][];
}

interface HistoricalPattern {
  name: string;
  similarity: number;
  description: string;
  discoveredBy?: string;
  year?: number;
}

const FAMOUS_PATTERNS = [
  {
    name: "Glider",
    signature: [5, 4, 3], // cell counts for 3 generations
    description: "The first discovered spaceship that travels diagonally",
    discoveredBy: "Richard K. Guy",
    year: 1970
  },
  {
    name: "Blinker",
    signature: [3, 3, 3], // oscillates
    description: "The simplest oscillator with period 2",
    discoveredBy: "John Conway",
    year: 1970
  },
  {
    name: "Toad",
    signature: [6, 6, 6],
    description: "A period-2 oscillator shaped like a toad",
    discoveredBy: "John Conway",
    year: 1970
  },
  {
    name: "Beacon",
    signature: [6, 8, 6],
    description: "A period-2 oscillator that flashes like a beacon",
    discoveredBy: "John Conway",
    year: 1970
  },
  {
    name: "Pulsar",
    signature: [48, 56, 48],
    description: "A period-3 oscillator discovered early in Game of Life research",
    discoveredBy: "John Conway",
    year: 1970
  }
];

export const usePatternAnalysis = (
  grid: Grid,
  generation: number,
  population: number
) => {
  const [history, setHistory] = useState<number[]>([]);
  const [gridHistory, setGridHistory] = useState<Grid[]>([]);
  const [metrics, setMetrics] = useState<PatternMetrics>({
    entropy: 0,
    diversity: 0,
    stability: 0,
    growth: 0,
    influence: []
  });
  const [historicalMatches, setHistoricalMatches] = useState<HistoricalPattern[]>([]);
  const [aiDescription, setAiDescription] = useState<string>('');
  const [generatedName, setGeneratedName] = useState<string>('');

  // Update history
  useEffect(() => {
    setHistory(prev => [...prev.slice(-19), population]);
    setGridHistory(prev => [...prev.slice(-5), grid]);
  }, [population, grid]);

  // Calculate entropy
  const calculateEntropy = useMemo(() => {
    if (!grid) return 0;
    
    const totalCells = grid.length * grid[0].length;
    const aliveCells = population;
    const deadCells = totalCells - aliveCells;
    
    if (aliveCells === 0 || deadCells === 0) return 0;
    
    const pAlive = aliveCells / totalCells;
    const pDead = deadCells / totalCells;
    
    return -(pAlive * Math.log2(pAlive) + pDead * Math.log2(pDead));
  }, [grid, population]);

  // Calculate pattern diversity
  const calculateDiversity = useMemo(() => {
    if (!grid) return 0;
    
    let clusters = 0;
    const visited = Array(grid.length).fill(null).map(() => Array(grid[0].length).fill(false));
    
    const dfs = (x: number, y: number) => {
      if (x < 0 || x >= grid.length || y < 0 || y >= grid[0].length || visited[x][y] || !grid[x][y]) {
        return;
      }
      visited[x][y] = true;
      dfs(x + 1, y);
      dfs(x - 1, y);
      dfs(x, y + 1);
      dfs(x, y - 1);
    };
    
    for (let x = 0; x < grid.length; x++) {
      for (let y = 0; y < grid[0].length; y++) {
        if (grid[x][y] && !visited[x][y]) {
          clusters++;
          dfs(x, y);
        }
      }
    }
    
    return Math.min(clusters / 10, 1); // Normalize to 0-1
  }, [grid]);

  // Calculate stability score
  const calculateStability = useMemo(() => {
    if (history.length < 10) return 0;
    
    const recent = history.slice(-10);
    const variance = recent.reduce((acc, val) => {
      const mean = recent.reduce((a, b) => a + b, 0) / recent.length;
      return acc + Math.pow(val - mean, 2);
    }, 0) / recent.length;
    
    return Math.max(0, 1 - variance / 100); // Higher stability = lower variance
  }, [history]);

  // Calculate growth trend
  const calculateGrowth = useMemo(() => {
    if (history.length < 5) return 0;
    
    const recent = history.slice(-5);
    const trend = (recent[recent.length - 1] - recent[0]) / recent.length;
    return Math.max(-1, Math.min(1, trend / 10)); // Normalize to -1 to 1
  }, [history]);

  // Calculate cell influence (heat map)
  const calculateInfluence = useMemo(() => {
    if (!grid) return [];
    
    const influence = Array(grid.length).fill(null).map(() => Array(grid[0].length).fill(0));
    
    for (let x = 0; x < grid.length; x++) {
      for (let y = 0; y < grid[0].length; y++) {
        if (grid[x][y]) {
          // Add influence to surrounding cells
          for (let dx = -2; dx <= 2; dx++) {
            for (let dy = -2; dy <= 2; dy++) {
              const nx = x + dx;
              const ny = y + dy;
              if (nx >= 0 && nx < grid.length && ny >= 0 && ny < grid[0].length) {
                const distance = Math.sqrt(dx * dx + dy * dy);
                influence[nx][ny] += Math.max(0, 1 - distance / 3);
              }
            }
          }
        }
      }
    }
    
    return influence;
  }, [grid]);

  // Analyze historical patterns
  useEffect(() => {
    if (gridHistory.length < 3) return;
    
    const recentSignature = gridHistory.slice(-3).map(g => 
      g.flat().filter(cell => cell).length
    );
    
    const matches = FAMOUS_PATTERNS.map(pattern => {
      const similarity = calculateSimilarity(recentSignature, pattern.signature);
      return {
        name: pattern.name,
        similarity,
        description: pattern.description,
        discoveredBy: pattern.discoveredBy,
        year: pattern.year
      };
    }).filter(match => match.similarity > 0.7).sort((a, b) => b.similarity - a.similarity);
    
    setHistoricalMatches(matches.slice(0, 3));
  }, [gridHistory]);

  const calculateSimilarity = (sig1: number[], sig2: number[]): number => {
    if (sig1.length !== sig2.length) return 0;
    
    const maxDiff = Math.max(...sig1.map((val, i) => Math.abs(val - sig2[i])));
    const avgVal = (sig1.reduce((a, b) => a + b, 0) + sig2.reduce((a, b) => a + b, 0)) / (sig1.length * 2);
    
    if (avgVal === 0) return maxDiff === 0 ? 1 : 0;
    return Math.max(0, 1 - maxDiff / avgVal);
  };

  // Update metrics
  useEffect(() => {
    setMetrics({
      entropy: calculateEntropy,
      diversity: calculateDiversity,
      stability: calculateStability,
      growth: calculateGrowth,
      influence: calculateInfluence
    });
  }, [calculateEntropy, calculateDiversity, calculateStability, calculateGrowth, calculateInfluence]);

  // Generate AI description and name
  useEffect(() => {
    if (generation < 5) return;
    
    const patterns = ['stable', 'oscillating', 'growing', 'declining', 'chaotic'];
    const behaviors = ['steady', 'pulsing', 'expanding', 'contracting', 'unpredictable'];
    const descriptors = ['elegant', 'complex', 'simple', 'intricate', 'balanced'];
    
    let behaviorType = '';
    let description = '';
    let name = '';
    
    if (metrics.stability > 0.8) {
      behaviorType = 'stable';
      description = `This ${descriptors[Math.floor(Math.random() * descriptors.length)]} pattern has achieved remarkable stability with ${(metrics.stability * 100).toFixed(0)}% consistency. The configuration maintains its structure across generations, suggesting a well-balanced ecosystem.`;
      name = `${['Stable', 'Steady', 'Balanced'][Math.floor(Math.random() * 3)]} Formation`;
    } else if (Math.abs(metrics.growth) > 0.3) {
      behaviorType = metrics.growth > 0 ? 'growing' : 'declining';
      const trend = metrics.growth > 0 ? 'expansion' : 'contraction';
      description = `An ${descriptors[Math.floor(Math.random() * descriptors.length)]} pattern showing ${trend} behavior. Population ${metrics.growth > 0 ? 'increases' : 'decreases'} by approximately ${Math.abs(metrics.growth * 100).toFixed(1)}% per generation, indicating ${metrics.growth > 0 ? 'favorable' : 'challenging'} conditions.`;
      name = `${metrics.growth > 0 ? 'Expanding' : 'Contracting'} ${['Colony', 'Cluster', 'Formation'][Math.floor(Math.random() * 3)]}`;
    } else if (metrics.diversity > 0.6) {
      behaviorType = 'complex';
      description = `A highly ${descriptors[Math.floor(Math.random() * descriptors.length)]} pattern with ${(metrics.diversity * 100).toFixed(0)}% structural diversity. Multiple distinct clusters interact dynamically, creating emergent behaviors typical of complex adaptive systems.`;
      name = `${['Complex', 'Diverse', 'Multi'][Math.floor(Math.random() * 3)]} ${['System', 'Network', 'Assembly'][Math.floor(Math.random() * 3)]}`;
    } else if (metrics.entropy > 0.7) {
      behaviorType = 'chaotic';
      description = `A ${descriptors[Math.floor(Math.random() * descriptors.length)]} chaotic pattern with high entropy (${metrics.entropy.toFixed(2)}). The unpredictable evolution suggests sensitivity to initial conditions, a hallmark of deterministic chaos.`;
      name = `${['Chaotic', 'Random', 'Turbulent'][Math.floor(Math.random() * 3)]} ${['Field', 'Storm', 'Flux'][Math.floor(Math.random() * 3)]}`;
    } else {
      description = `A ${descriptors[Math.floor(Math.random() * descriptors.length)]} pattern in transition. With moderate stability and growth rates, this configuration represents the dynamic equilibrium often seen in evolving systems.`;
      name = `${['Transitional', 'Evolving', 'Dynamic'][Math.floor(Math.random() * 3)]} ${['Pattern', 'Structure', 'Form'][Math.floor(Math.random() * 3)]}`;
    }
    
    setAiDescription(description);
    setGeneratedName(name);
  }, [metrics, generation]);

  return {
    metrics,
    historicalMatches,
    history: history.slice(-20),
    aiDescription,
    generatedName
  };
};