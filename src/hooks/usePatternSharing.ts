import { useState, useEffect } from 'react';
import { useToast } from '@/hooks/use-toast';

type Grid = boolean[][];

interface PatternData {
  name: string;
  description: string;
  grid: Grid;
  gridSize: number;
  generation: number;
  population: number;
  rules: {
    survivalMin: number;
    survivalMax: number;
    birthCount: number;
  };
  timestamp: number;
}

interface ShareablePattern {
  hasPattern: boolean;
  patternData: PatternData | null;
  loadPattern: (onLoad: (data: PatternData) => void) => void;
  generateShareableUrl: (data: PatternData) => string;
}

export const usePatternSharing = (): ShareablePattern => {
  const [patternData, setPatternData] = useState<PatternData | null>(null);
  const [hasPattern, setHasPattern] = useState(false);
  const { toast } = useToast();

  // Check for shared pattern in URL on mount
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const patternParam = urlParams.get('pattern');
    
    if (patternParam) {
      try {
        const decodedData = JSON.parse(atob(patternParam));
        setPatternData(decodedData);
        setHasPattern(true);
        
        // Clean URL after loading
        const url = new URL(window.location.href);
        url.searchParams.delete('pattern');
        window.history.replaceState({}, '', url.toString());
        
        toast({
          title: "Pattern Loaded!",
          description: `"${decodedData.name}" has been loaded from shared link`,
        });
      } catch (error) {
        console.warn('Failed to parse shared pattern:', error);
        toast({
          title: "Invalid Pattern",
          description: "The shared pattern link appears to be corrupted",
          variant: "destructive",
        });
      }
    }
  }, [toast]);

  const loadPattern = (onLoad: (data: PatternData) => void) => {
    if (patternData) {
      onLoad(patternData);
      setHasPattern(false);
      setPatternData(null);
    }
  };

  const generateShareableUrl = (data: PatternData): string => {
    const encodedData = btoa(JSON.stringify(data));
    const url = new URL(window.location.href);
    url.searchParams.set('pattern', encodedData);
    return url.toString();
  };

  return {
    hasPattern,
    patternData,
    loadPattern,
    generateShareableUrl
  };
};