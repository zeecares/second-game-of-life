import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { TrendingUp, TrendingDown, Minus, Brain, History, Target } from 'lucide-react';

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

interface PatternMetricsProps {
  metrics: PatternMetrics;
  historicalMatches: HistoricalPattern[];
  history: number[];
}

export const PatternMetrics: React.FC<PatternMetricsProps> = ({
  metrics,
  historicalMatches,
  history
}) => {
  const getGrowthIcon = (growth: number) => {
    if (growth > 0.1) return <TrendingUp className="h-4 w-4 text-green-500" />;
    if (growth < -0.1) return <TrendingDown className="h-4 w-4 text-red-500" />;
    return <Minus className="h-4 w-4 text-muted-foreground" />;
  };

  const getConfidenceColor = (value: number) => {
    if (value > 0.8) return 'text-green-600';
    if (value > 0.6) return 'text-yellow-600';
    return 'text-red-600';
  };

  const formatPercentage = (value: number) => `${Math.round(value * 100)}%`;

  return (
    <>
      {/* Complexity Metrics */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Brain className="h-5 w-5" />
            Complexity Analysis
          </CardTitle>
          <CardDescription>
            Real-time pattern complexity and behavior metrics
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-sm font-medium">Entropy</span>
              <Badge variant="outline">{metrics.entropy.toFixed(3)}</Badge>
            </div>
            <Progress value={metrics.entropy * 100} className="h-2" />
            <p className="text-xs text-muted-foreground">
              Measures information content and randomness
            </p>
          </div>

          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-sm font-medium">Pattern Diversity</span>
              <Badge variant="outline">{formatPercentage(metrics.diversity)}</Badge>
            </div>
            <Progress value={metrics.diversity * 100} className="h-2" />
            <p className="text-xs text-muted-foreground">
              Number of distinct pattern clusters
            </p>
          </div>

          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-sm font-medium">Stability Score</span>
              <Badge variant="outline" className={getConfidenceColor(metrics.stability)}>
                {formatPercentage(metrics.stability)}
              </Badge>
            </div>
            <Progress value={metrics.stability * 100} className="h-2" />
            <p className="text-xs text-muted-foreground">
              How stable the pattern is over time
            </p>
          </div>

          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-sm font-medium">Growth Trend</span>
              <div className="flex items-center gap-2">
                {getGrowthIcon(metrics.growth)}
                <Badge variant="outline">
                  {metrics.growth > 0 ? '+' : ''}{(metrics.growth * 100).toFixed(1)}%
                </Badge>
              </div>
            </div>
            <Progress 
              value={Math.abs(metrics.growth) * 100} 
              className="h-2" 
            />
            <p className="text-xs text-muted-foreground">
              Population change trajectory
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Historical Pattern Analysis */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <History className="h-5 w-5" />
            Pattern Recognition
          </CardTitle>
          <CardDescription>
            AI analysis of pattern similarities to famous discoveries
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {historicalMatches.length > 0 ? (
            historicalMatches.map((match, index) => (
              <div key={index} className="p-3 bg-muted rounded-lg space-y-2">
                <div className="flex justify-between items-center">
                  <h4 className="font-semibold text-sm">{match.name}</h4>
                  <Badge variant="secondary" className={getConfidenceColor(match.similarity)}>
                    {formatPercentage(match.similarity)} match
                  </Badge>
                </div>
                <p className="text-xs text-muted-foreground">
                  {match.description}
                </p>
                {match.discoveredBy && (
                  <p className="text-xs text-muted-foreground">
                    Discovered by {match.discoveredBy} {match.year && `(${match.year})`}
                  </p>
                )}
              </div>
            ))
          ) : (
            <div className="text-center text-muted-foreground text-sm py-4">
              <p>No historical patterns detected yet.</p>
              <p className="text-xs mt-1">Try running different configurations to see pattern matches!</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Confidence Scores */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Target className="h-5 w-5" />
            AI Predictions
          </CardTitle>
          <CardDescription>
            Confidence scores for pattern behavior
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex justify-between items-center">
            <span className="text-sm">Will stabilize</span>
            <Badge variant="outline" className={getConfidenceColor(metrics.stability)}>
              {formatPercentage(metrics.stability)}
            </Badge>
          </div>
          
          <div className="flex justify-between items-center">
            <span className="text-sm">Will continue growing</span>
            <Badge variant="outline" className={getConfidenceColor(Math.max(0, metrics.growth))}>
              {formatPercentage(Math.max(0, metrics.growth))}
            </Badge>
          </div>
          
          <div className="flex justify-between items-center">
            <span className="text-sm">Pattern complexity</span>
            <Badge variant="outline" className={getConfidenceColor(metrics.diversity)}>
              {formatPercentage(metrics.diversity)}
            </Badge>
          </div>

          <div className="pt-2 border-t border-border">
            <p className="text-xs text-muted-foreground">
              Based on {history.length} generations of data analysis
            </p>
          </div>
        </CardContent>
      </Card>
    </>
  );
};