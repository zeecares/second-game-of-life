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
  audioEnabled: boolean,
  soundStyle: 'chiptune' | '8bit' | 'piano' | 'trap' = 'chiptune'
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

  // Create note sound with different styles
  const playNote = useCallback((frequency: number, duration: number = 0.15) => {
    if (!audioContextRef.current || !audioEnabled) return;

    const oscillator = audioContextRef.current.createOscillator();
    const gainNode = audioContextRef.current.createGain();
    const filterNode = audioContextRef.current.createBiquadFilter();
    
    oscillator.connect(filterNode);
    filterNode.connect(gainNode);
    gainNode.connect(audioContextRef.current.destination);
    
    switch (soundStyle) {
      case 'chiptune':
        oscillator.type = 'square';
        gainNode.gain.setValueAtTime(0, audioContextRef.current.currentTime);
        gainNode.gain.linearRampToValueAtTime(0.3, audioContextRef.current.currentTime + 0.01);
        gainNode.gain.exponentialRampToValueAtTime(0.01, audioContextRef.current.currentTime + duration);
        break;
        
      case '8bit':
        oscillator.type = 'triangle';
        filterNode.type = 'lowpass';
        filterNode.frequency.setValueAtTime(800, audioContextRef.current.currentTime);
        gainNode.gain.setValueAtTime(0, audioContextRef.current.currentTime);
        gainNode.gain.linearRampToValueAtTime(0.4, audioContextRef.current.currentTime + 0.005);
        gainNode.gain.exponentialRampToValueAtTime(0.01, audioContextRef.current.currentTime + duration * 0.8);
        break;
        
      case 'piano':
        oscillator.type = 'sine';
        // Create piano-like harmonic overtones
        const harmonic2 = audioContextRef.current.createOscillator();
        const harmonic3 = audioContextRef.current.createOscillator();
        const harmonicGain2 = audioContextRef.current.createGain();
        const harmonicGain3 = audioContextRef.current.createGain();
        
        harmonic2.connect(harmonicGain2);
        harmonic3.connect(harmonicGain3);
        harmonicGain2.connect(gainNode);
        harmonicGain3.connect(gainNode);
        
        // Piano harmonics
        harmonic2.frequency.setValueAtTime(frequency * 2, audioContextRef.current.currentTime);
        harmonic3.frequency.setValueAtTime(frequency * 3, audioContextRef.current.currentTime);
        harmonic2.type = 'sine';
        harmonic3.type = 'sine';
        harmonicGain2.gain.setValueAtTime(0.15, audioContextRef.current.currentTime);
        harmonicGain3.gain.setValueAtTime(0.08, audioContextRef.current.currentTime);
        
        // Piano-like envelope - quick attack, slow decay
        gainNode.gain.setValueAtTime(0, audioContextRef.current.currentTime);
        gainNode.gain.linearRampToValueAtTime(0.4, audioContextRef.current.currentTime + 0.01);
        gainNode.gain.exponentialRampToValueAtTime(0.01, audioContextRef.current.currentTime + duration * 3);
        
        harmonic2.start(audioContextRef.current.currentTime);
        harmonic3.start(audioContextRef.current.currentTime);
        harmonic2.stop(audioContextRef.current.currentTime + duration * 3);
        harmonic3.stop(audioContextRef.current.currentTime + duration * 3);
        break;
        
      case 'trap':
        oscillator.type = 'sawtooth';
        filterNode.type = 'lowpass';
        filterNode.frequency.setValueAtTime(1200, audioContextRef.current.currentTime);
        filterNode.Q.setValueAtTime(8, audioContextRef.current.currentTime);
        
        gainNode.gain.setValueAtTime(0, audioContextRef.current.currentTime);
        gainNode.gain.linearRampToValueAtTime(0.6, audioContextRef.current.currentTime + 0.008);
        gainNode.gain.exponentialRampToValueAtTime(0.01, audioContextRef.current.currentTime + duration * 0.6);
        break;
    }
    
    oscillator.frequency.setValueAtTime(frequency, audioContextRef.current.currentTime);
    oscillator.start(audioContextRef.current.currentTime);
    oscillator.stop(audioContextRef.current.currentTime + duration * (soundStyle === 'piano' ? 2 : 1));
  }, [audioEnabled, soundStyle]);

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
        playNote(frequency, 0.15);
      }
    }

    // Move to next column
    currentColumnRef.current = (currentColumnRef.current + 1) % gridSize;
  }, [grid, audioEnabled, isRunning, playNote]);

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