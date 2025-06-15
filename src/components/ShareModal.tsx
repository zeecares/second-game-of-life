import React, { useState, useRef } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Copy, Download, Share2, Twitter, Facebook, Instagram, Linkedin } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

type Grid = boolean[][];

interface ShareModalProps {
  isOpen: boolean;
  onClose: () => void;
  grid: Grid;
  gridSize: number;
  generation: number;
  population: number;
  rules: {
    survivalMin: number;
    survivalMax: number;
    birthCount: number;
  };
  generatedName: string;
  aiDescription: string;
}

export const ShareModal: React.FC<ShareModalProps> = ({
  isOpen,
  onClose,
  grid,
  gridSize,
  generation,
  population,
  rules,
  generatedName,
  aiDescription
}) => {
  const { toast } = useToast();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [customMessage, setCustomMessage] = useState('');

  // Generate shareable image
  const generateImage = () => {
    const canvas = canvasRef.current;
    if (!canvas) return null;

    const ctx = canvas.getContext('2d');
    if (!ctx) return null;

    // Set canvas size
    const cellSize = 8;
    const padding = 40;
    const headerHeight = 120;
    const footerHeight = 80;
    
    canvas.width = gridSize * cellSize + padding * 2;
    canvas.height = gridSize * cellSize + padding * 2 + headerHeight + footerHeight;

    // Background
    ctx.fillStyle = '#0a0a0a';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Header
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 24px Arial';
    ctx.textAlign = 'center';
    ctx.fillText(generatedName || 'Game of Life Pattern', canvas.width / 2, 40);
    
    ctx.font = '14px Arial';
    ctx.fillStyle = '#888888';
    ctx.fillText(`Gen: ${generation} | Pop: ${population} | Rules: ${rules.survivalMin}-${rules.survivalMax}/${rules.birthCount}`, canvas.width / 2, 65);
    
    if (aiDescription) {
      ctx.font = '12px Arial';
      const maxWidth = canvas.width - 40;
      const words = aiDescription.split(' ');
      let line = '';
      let y = 85;
      
      for (let i = 0; i < words.length; i++) {
        const testLine = line + words[i] + ' ';
        const metrics = ctx.measureText(testLine);
        const testWidth = metrics.width;
        
        if (testWidth > maxWidth && i > 0) {
          ctx.fillText(line, canvas.width / 2, y);
          line = words[i] + ' ';
          y += 16;
          if (y > headerHeight - 10) break; // Prevent overflow
        } else {
          line = testLine;
        }
      }
      if (line && y <= headerHeight - 10) {
        ctx.fillText(line, canvas.width / 2, y);
      }
    }

    // Grid
    const gridY = headerHeight + padding;
    for (let x = 0; x < gridSize; x++) {
      for (let y = 0; y < gridSize; y++) {
        const cellX = padding + y * cellSize;
        const cellY = gridY + x * cellSize;
        
        if (grid[x] && grid[x][y]) {
          ctx.fillStyle = '#3b82f6'; // Blue for living cells
        } else {
          ctx.fillStyle = '#1a1a1a'; // Dark for dead cells
        }
        
        ctx.fillRect(cellX, cellY, cellSize - 1, cellSize - 1);
      }
    }

    // Footer
    ctx.fillStyle = '#888888';
    ctx.font = '12px Arial';
    ctx.textAlign = 'center';
    ctx.fillText('Created with Conway\'s Game of Life', canvas.width / 2, canvas.height - 30);
    ctx.fillText('lovable.dev', canvas.width / 2, canvas.height - 15);

    return canvas.toDataURL('image/png');
  };

  // Generate shareable text
  const generateShareText = () => {
    const baseText = `🧬 ${generatedName || 'Amazing Game of Life Pattern'}!\n\n${aiDescription ? aiDescription + '\n\n' : ''}📊 Stats: Generation ${generation}, Population ${population}\n🔬 Rules: Survive ${rules.survivalMin}-${rules.survivalMax}, Born ${rules.birthCount}\n\n${customMessage ? customMessage + '\n\n' : ''}#GameOfLife #Cellular #Automata #Science #Math #AI`;
    
    return baseText;
  };

  // Generate pattern data for sharing
  const generatePatternData = () => {
    const patternData = {
      name: generatedName,
      description: aiDescription,
      grid: grid,
      gridSize: gridSize,
      generation: generation,
      population: population,
      rules: rules,
      timestamp: Date.now()
    };
    
    return btoa(JSON.stringify(patternData));
  };

  // Share functions
  const shareToTwitter = () => {
    const text = generateShareText();
    const url = `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}`;
    window.open(url, '_blank');
  };

  const shareToFacebook = () => {
    const text = generateShareText();
    const url = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(window.location.href)}&quote=${encodeURIComponent(text)}`;
    window.open(url, '_blank');
  };

  const shareToLinkedIn = () => {
    const text = generateShareText();
    const url = `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(window.location.href)}&summary=${encodeURIComponent(text)}`;
    window.open(url, '_blank');
  };

  const copyToClipboard = async () => {
    try {
      const text = generateShareText();
      await navigator.clipboard.writeText(text);
      toast({
        title: "Copied!",
        description: "Share text copied to clipboard",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to copy to clipboard",
        variant: "destructive",
      });
    }
  };

  const downloadImage = () => {
    const dataUrl = generateImage();
    if (!dataUrl) return;

    const link = document.createElement('a');
    link.download = `${generatedName || 'game-of-life-pattern'}.png`;
    link.href = dataUrl;
    link.click();
  };

  const copyPatternData = async () => {
    try {
      const patternData = generatePatternData();
      const shareUrl = `${window.location.origin}${window.location.pathname}?pattern=${patternData}`;
      await navigator.clipboard.writeText(shareUrl);
      toast({
        title: "Pattern Link Copied!",
        description: "Anyone can use this link to load your exact pattern",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to copy pattern link",
        variant: "destructive",
      });
    }
  };

  const shareNatively = async () => {
    if (navigator.share) {
      try {
        const text = generateShareText();
        await navigator.share({
          title: generatedName || 'Game of Life Pattern',
          text: text,
          url: window.location.href,
        });
      } catch (error) {
        // User cancelled or error occurred
      }
    } else {
      copyToClipboard();
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Share2 className="h-5 w-5" />
            Share Your Pattern
          </DialogTitle>
          <DialogDescription>
            Share your amazing Game of Life discovery with the world!
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Pattern Preview */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">{generatedName || 'Unnamed Pattern'}</CardTitle>
              <div className="flex gap-2 flex-wrap">
                <Badge variant="secondary">Gen {generation}</Badge>
                <Badge variant="secondary">Pop {population}</Badge>
                <Badge variant="outline">Rules: {rules.survivalMin}-{rules.survivalMax}/{rules.birthCount}</Badge>
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-sm text-muted-foreground mb-4">
                {aiDescription || 'A fascinating cellular automaton pattern'}
              </div>
              
              {/* Visual preview */}
              <div className="bg-background border rounded-lg p-4 mb-4">
                <div 
                  className="grid gap-[1px] mx-auto"
                  style={{ 
                    gridTemplateColumns: `repeat(${Math.min(gridSize, 32)}, 6px)`,
                    gridTemplateRows: `repeat(${Math.min(gridSize, 32)}, 6px)`,
                    width: 'fit-content'
                  }}
                >
                  {grid.slice(0, Math.min(gridSize, 32)).map((row, x) =>
                    row.slice(0, Math.min(gridSize, 32)).map((cell, y) => (
                      <div
                        key={`${x}-${y}`}
                        className={`w-[6px] h-[6px] ${
                          cell ? 'bg-primary' : 'bg-muted'
                        }`}
                      />
                    ))
                  )}
                </div>
                {gridSize > 32 && (
                  <p className="text-xs text-muted-foreground text-center mt-2">
                    Preview shows {Math.min(gridSize, 32)}×{Math.min(gridSize, 32)} of {gridSize}×{gridSize} grid
                  </p>
                )}
              </div>

              {/* Custom message */}
              <div className="space-y-2">
                <label className="text-sm font-medium">Add your message (optional)</label>
                <Textarea
                  placeholder="Tell people what makes this pattern special..."
                  value={customMessage}
                  onChange={(e) => setCustomMessage(e.target.value)}
                  className="min-h-[60px]"
                />
              </div>
            </CardContent>
          </Card>

          {/* Share options */}
          <div className="grid grid-cols-2 gap-4">
            <Button onClick={shareToTwitter} className="flex items-center gap-2">
              <Twitter className="h-4 w-4" />
              Twitter
            </Button>
            <Button onClick={shareToFacebook} variant="outline" className="flex items-center gap-2">
              <Facebook className="h-4 w-4" />
              Facebook
            </Button>
            <Button onClick={shareToLinkedIn} variant="outline" className="flex items-center gap-2">
              <Linkedin className="h-4 w-4" />
              LinkedIn
            </Button>
            <Button onClick={shareNatively} variant="outline" className="flex items-center gap-2">
              <Share2 className="h-4 w-4" />
              More...
            </Button>
          </div>

          {/* Advanced options */}
          <div className="grid grid-cols-1 gap-2">
            <Button onClick={copyToClipboard} variant="outline" className="flex items-center gap-2">
              <Copy className="h-4 w-4" />
              Copy Share Text
            </Button>
            <Button onClick={downloadImage} variant="outline" className="flex items-center gap-2">
              <Download className="h-4 w-4" />
              Download Image
            </Button>
            <Button onClick={copyPatternData} variant="outline" className="flex items-center gap-2">
              <Copy className="h-4 w-4" />
              Copy Pattern Link
            </Button>
          </div>

          {/* Hidden canvas for image generation */}
          <canvas ref={canvasRef} style={{ display: 'none' }} />
        </div>
      </DialogContent>
    </Dialog>
  );
};