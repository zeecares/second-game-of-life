import { useEffect, useRef, useCallback } from 'react';

type Grid = boolean[][];

// Pentatonic scale frequencies for chiptune sound
const PENTATONIC_SCALE = [
  261.63, // C4
  293.66, // D4
  329.63, // E4
  392.00, // G4
  440.00, // A4
  523.25, // C5
  587.33, // D5
  659.25, // E5
  783.99, // G5
  880.00, // A5
];

export const useChiptuneSequencer = (
  grid: Grid,
  isRunning: boolean,
  speed: number,
  audioEnabled: boolean
) => {
  const audioContextRef = useRef<AudioContext | null>(null);
  const currentColumnRef = useRef(0);
  const sequencerIntervalRef = useRef<NodeJS.Timeout>();

  // Initialize audio context
  useEffect(() => {
    if (audioEnabled && !audioContextRef.current) {
      try {
        audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
      } catch (error) {
        console.warn('Audio not supported:', error);
      }
    }
  }, [audioEnabled]);

  // Create chiptune note sound
  const playChiptuneNote = useCallback((frequency: number, duration: number = 0.1) => {
    if (!audioContextRef.current || !audioEnabled) return;

    const oscillator = audioContextRef.current.createOscillator();
    const gainNode = audioContextRef.current.createGain();
    
    oscillator.connect(gainNode);
    gainNode.connect(audioContextRef.current.destination);
    
    // Square wave for chiptune sound
    oscillator.type = 'square';
    oscillator.frequency.setValueAtTime(frequency, audioContextRef.current.currentTime);
    
    // Quick attack and decay for chiptune effect
    gainNode.gain.setValueAtTime(0, audioContextRef.current.currentTime);
    gainNode.gain.linearRampToValueAtTime(0.3, audioContextRef.current.currentTime + 0.01);
    gainNode.gain.exponentialRampToValueAtTime(0.01, audioContextRef.current.currentTime + duration);
    
    oscillator.start(audioContextRef.current.currentTime);
    oscillator.stop(audioContextRef.current.currentTime + duration);
  }, [audioEnabled]);

  // Process current column for notes
  const processSequencerStep = useCallback(() => {
    if (!grid || !audioEnabled || !isRunning) return;

    const gridSize = grid.length;
    const column = currentColumnRef.current;

    // Check each row in the current column
    for (let row = 0; row < gridSize; row++) {
      if (grid[row][column]) {
        // Map row to a note in the pentatonic scale
        const noteIndex = row % PENTATONIC_SCALE.length;
        const frequency = PENTATONIC_SCALE[noteIndex];
        playChiptuneNote(frequency, 0.15);
      }
    }

    // Move to next column
    currentColumnRef.current = (currentColumnRef.current + 1) % gridSize;
  }, [grid, audioEnabled, isRunning, playChiptuneNote]);

  // Start/stop sequencer
  useEffect(() => {
    if (isRunning && audioEnabled) {
      // Use slightly faster tempo than game speed for musical timing
      const sequencerSpeed = Math.max(speed * 0.8, 100);
      sequencerIntervalRef.current = setInterval(processSequencerStep, sequencerSpeed);
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
  }, [isRunning, audioEnabled, speed, processSequencerStep]);

  // Reset column when stopped
  useEffect(() => {
    if (!isRunning) {
      currentColumnRef.current = 0;
    }
  }, [isRunning]);

  return {
    currentColumn: currentColumnRef.current,
    isSequencerActive: isRunning && audioEnabled
  };
};