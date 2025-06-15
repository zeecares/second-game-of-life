
import { useEffect, useRef, useCallback } from 'react';

type Grid = boolean[][];

// Enhanced pentatonic scale with octave variations for better melody
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
  1046.50, // C6
  1174.66, // D6
];

// Drum sound frequencies for better rhythm section
const DRUM_FREQUENCIES = {
  kick: 60,
  snare: 200,
  hihat: 8000
};

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

  // Enhanced drum sounds
  const createDrumSound = useCallback((type: 'kick' | 'snare' | 'hihat') => {
    if (!audioContextRef.current || !audioEnabled) return;

    const ctx = audioContextRef.current;
    const now = ctx.currentTime;

    switch (type) {
      case 'kick': {
        const oscillator = ctx.createOscillator();
        const gainNode = ctx.createGain();
        const filterNode = ctx.createBiquadFilter();
        
        oscillator.connect(filterNode);
        filterNode.connect(gainNode);
        gainNode.connect(ctx.destination);
        
        oscillator.frequency.setValueAtTime(DRUM_FREQUENCIES.kick, now);
        oscillator.frequency.exponentialRampToValueAtTime(0.01, now + 0.5);
        oscillator.type = 'sine';
        
        filterNode.type = 'lowpass';
        filterNode.frequency.setValueAtTime(100, now);
        
        gainNode.gain.setValueAtTime(0.8, now);
        gainNode.gain.exponentialRampToValueAtTime(0.01, now + 0.5);
        
        oscillator.start(now);
        oscillator.stop(now + 0.5);
        break;
      }
      
      case 'snare': {
        // White noise for snare
        const bufferSize = ctx.sampleRate * 0.2;
        const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
        const output = buffer.getChannelData(0);
        
        for (let i = 0; i < bufferSize; i++) {
          output[i] = Math.random() * 2 - 1;
        }
        
        const noise = ctx.createBufferSource();
        const gainNode = ctx.createGain();
        const filterNode = ctx.createBiquadFilter();
        
        noise.buffer = buffer;
        noise.connect(filterNode);
        filterNode.connect(gainNode);
        gainNode.connect(ctx.destination);
        
        filterNode.type = 'highpass';
        filterNode.frequency.value = DRUM_FREQUENCIES.snare;
        gainNode.gain.setValueAtTime(0.6, now);
        gainNode.gain.exponentialRampToValueAtTime(0.01, now + 0.2);
        
        noise.start(now);
        break;
      }
      
      case 'hihat': {
        // High frequency noise for hi-hat
        const bufferSize = ctx.sampleRate * 0.1;
        const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
        const output = buffer.getChannelData(0);
        
        for (let i = 0; i < bufferSize; i++) {
          output[i] = Math.random() * 2 - 1;
        }
        
        const noise = ctx.createBufferSource();
        const gainNode = ctx.createGain();
        const filterNode = ctx.createBiquadFilter();
        
        noise.buffer = buffer;
        noise.connect(filterNode);
        filterNode.connect(gainNode);
        gainNode.connect(ctx.destination);
        
        filterNode.type = 'highpass';
        filterNode.frequency.value = DRUM_FREQUENCIES.hihat;
        gainNode.gain.setValueAtTime(0.3, now);
        gainNode.gain.exponentialRampToValueAtTime(0.01, now + 0.1);
        
        noise.start(now);
        break;
      }
    }
  }, [audioEnabled]);

  // Enhanced melodic note generation with better sound quality
  const playNote = useCallback((frequency: number, duration: number = 0.15) => {
    if (!audioContextRef.current || !audioEnabled) return;

    const ctx = audioContextRef.current;
    const now = ctx.currentTime;
    
    switch (soundStyle) {
      case 'chiptune': {
        const oscillator = ctx.createOscillator();
        const gainNode = ctx.createGain();
        
        oscillator.connect(gainNode);
        gainNode.connect(ctx.destination);
        
        oscillator.type = 'square';
        oscillator.frequency.setValueAtTime(frequency, now);
        
        gainNode.gain.setValueAtTime(0, now);
        gainNode.gain.linearRampToValueAtTime(0.25, now + 0.01);
        gainNode.gain.exponentialRampToValueAtTime(0.01, now + duration);
        
        oscillator.start(now);
        oscillator.stop(now + duration);
        break;
      }
        
      case '8bit': {
        // Classic 8-bit triangle wave with pulse width modulation effect
        const oscillator = ctx.createOscillator();
        const gainNode = ctx.createGain();
        const filterNode = ctx.createBiquadFilter();
        
        oscillator.connect(filterNode);
        filterNode.connect(gainNode);
        gainNode.connect(ctx.destination);
        
        oscillator.type = 'triangle';
        oscillator.frequency.setValueAtTime(frequency, now);
        
        filterNode.type = 'lowpass';
        filterNode.frequency.setValueAtTime(1200, now);
        filterNode.Q.setValueAtTime(2, now);
        
        gainNode.gain.setValueAtTime(0, now);
        gainNode.gain.linearRampToValueAtTime(0.3, now + 0.005);
        gainNode.gain.exponentialRampToValueAtTime(0.01, now + duration * 0.8);
        
        oscillator.start(now);
        oscillator.stop(now + duration);
        break;
      }
        
      case 'piano': {
        // Realistic piano-like sound with multiple harmonics
        const fundamental = ctx.createOscillator();
        const harmonic2 = ctx.createOscillator();
        const harmonic3 = ctx.createOscillator();
        
        const fundamentalGain = ctx.createGain();
        const harmonic2Gain = ctx.createGain();
        const harmonic3Gain = ctx.createGain();
        const masterGain = ctx.createGain();
        
        fundamental.connect(fundamentalGain);
        harmonic2.connect(harmonic2Gain);
        harmonic3.connect(harmonic3Gain);
        
        fundamentalGain.connect(masterGain);
        harmonic2Gain.connect(masterGain);
        harmonic3Gain.connect(masterGain);
        masterGain.connect(ctx.destination);
        
        fundamental.type = 'sine';
        harmonic2.type = 'sine';
        harmonic3.type = 'triangle';
        
        fundamental.frequency.setValueAtTime(frequency, now);
        harmonic2.frequency.setValueAtTime(frequency * 2, now);
        harmonic3.frequency.setValueAtTime(frequency * 3, now);
        
        fundamentalGain.gain.setValueAtTime(0.6, now);
        harmonic2Gain.gain.setValueAtTime(0.3, now);
        harmonic3Gain.gain.setValueAtTime(0.1, now);
        
        masterGain.gain.setValueAtTime(0, now);
        masterGain.gain.linearRampToValueAtTime(0.4, now + 0.02);
        masterGain.gain.exponentialRampToValueAtTime(0.1, now + duration);
        masterGain.gain.exponentialRampToValueAtTime(0.01, now + duration * 2);
        
        fundamental.start(now);
        harmonic2.start(now);
        harmonic3.start(now);
        
        fundamental.stop(now + duration * 2);
        harmonic2.stop(now + duration * 2);
        harmonic3.stop(now + duration * 2);
        break;
      }
        
      case 'trap': {
        // Modern trap-style synth with heavy filter automation
        const oscillator1 = ctx.createOscillator();
        const oscillator2 = ctx.createOscillator();
        const gainNode = ctx.createGain();
        const filterNode = ctx.createBiquadFilter();
        const distortion = ctx.createWaveShaper();
        
        oscillator1.connect(gainNode);
        oscillator2.connect(gainNode);
        gainNode.connect(filterNode);
        filterNode.connect(distortion);
        distortion.connect(ctx.destination);
        
        oscillator1.type = 'sawtooth';
        oscillator2.type = 'square';
        
        oscillator1.frequency.setValueAtTime(frequency, now);
        oscillator2.frequency.setValueAtTime(frequency * 0.99, now); // Slight detune for thickness
        
        // Heavy low-pass filter with resonance
        filterNode.type = 'lowpass';
        filterNode.frequency.setValueAtTime(2000, now);
        filterNode.frequency.exponentialRampToValueAtTime(400, now + duration * 0.3);
        filterNode.Q.setValueAtTime(12, now);
        
        // Soft saturation
        const curve = new Float32Array(65536);
        for (let i = 0; i < 65536; i++) {
          const x = (i - 32768) / 32768;
          curve[i] = Math.tanh(x * 2) * 0.7;
        }
        distortion.curve = curve;
        
        gainNode.gain.setValueAtTime(0, now);
        gainNode.gain.linearRampToValueAtTime(0.5, now + 0.008);
        gainNode.gain.exponentialRampToValueAtTime(0.01, now + duration * 0.6);
        
        oscillator1.start(now);
        oscillator2.start(now);
        oscillator1.stop(now + duration);
        oscillator2.stop(now + duration);
        break;
      }
    }
  }, [audioEnabled, soundStyle]);

  // Process current column for both drums and melody
  const processSequencerStep = useCallback(() => {
    if (!grid || !audioEnabled || !isRunning) return;

    const gridSize = grid.length;
    const column = currentColumnRef.current;
    
    // Calculate sections: bottom ~30% for drums, top 70% for melody
    const drumSectionStart = Math.floor(gridSize * 0.7);
    const drumSectionSize = Math.floor((gridSize - drumSectionStart) / 3);
    
    // Process drum section (bottom 30%)
    let kickTrigger = false;
    let snareTrigger = false;
    let hihatTrigger = false;
    
    // Kick drum - bottom section
    for (let row = drumSectionStart; row < drumSectionStart + drumSectionSize; row++) {
      if (grid[row] && grid[row][column]) {
        kickTrigger = true;
        break;
      }
    }
    
    // Snare drum - middle of drum section
    for (let row = drumSectionStart + drumSectionSize; row < drumSectionStart + drumSectionSize * 2; row++) {
      if (grid[row] && grid[row][column]) {
        snareTrigger = true;
        break;
      }
    }
    
    // Hi-hat - top of drum section
    for (let row = drumSectionStart + drumSectionSize * 2; row < gridSize; row++) {
      if (grid[row] && grid[row][column]) {
        hihatTrigger = true;
        break;
      }
    }
    
    // Trigger drum sounds
    if (kickTrigger) createDrumSound('kick');
    if (snareTrigger) createDrumSound('snare');
    if (hihatTrigger) createDrumSound('hihat');
    
    // Process melody section (top 70%)
    for (let row = 0; row < drumSectionStart; row++) {
      if (grid[row][column]) {
        // Map row to a note in the pentatonic scale
        const noteIndex = row % PENTATONIC_SCALE.length;
        const frequency = PENTATONIC_SCALE[noteIndex];
        playNote(frequency, 0.15);
      }
    }

    // Move to next column
    currentColumnRef.current = (currentColumnRef.current + 1) % gridSize;
  }, [grid, audioEnabled, isRunning, playNote, createDrumSound]);

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
