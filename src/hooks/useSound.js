import { useState, useEffect } from 'react';

// Single AudioContext instance shared across the app
let audioCtx = null;
let bgmInterval = null;
let isMuted = false;
let isBgmPlaying = false;

function getAudioContext() {
  if (!audioCtx) {
    audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  }
  if (audioCtx.state === 'suspended') {
    audioCtx.resume();
  }
  return audioCtx;
}

export const soundService = {
  toggleMute() {
    isMuted = !isMuted;
    if (isMuted) {
      this.stopBGM();
    } else if (isBgmPlaying) {
      this.startBGM();
    }
    return isMuted;
  },

  getMuted() {
    return isMuted;
  },

  // 1. POP Sound (Balloon Game)
  playPop() {
    if (isMuted) return;
    try {
      const ctx = getAudioContext();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.type = 'sine';
      osc.frequency.setValueAtTime(150, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(800, ctx.currentTime + 0.1);

      gain.gain.setValueAtTime(0.3, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.1);

      osc.start();
      osc.stop(ctx.currentTime + 0.1);
    } catch (e) {
      console.warn('Audio play failed', e);
    }
  },

  // 2. COIN Sound (Clicker/Math success)
  playCoin() {
    if (isMuted) return;
    try {
      const ctx = getAudioContext();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.type = 'sine';
      // Retro double note chime
      osc.frequency.setValueAtTime(523.25, ctx.currentTime); // C5
      osc.frequency.setValueAtTime(659.25, ctx.currentTime + 0.08); // E5

      gain.gain.setValueAtTime(0.2, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.35);

      osc.start();
      osc.stop(ctx.currentTime + 0.35);
    } catch (e) {
      console.warn(e);
    }
  },

  // 3. KEYPRESS Sound (Typing Game)
  playKeypress() {
    if (isMuted) return;
    try {
      const ctx = getAudioContext();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(1200, ctx.currentTime);
      osc.frequency.setValueAtTime(800, ctx.currentTime + 0.02);

      gain.gain.setValueAtTime(0.15, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.05);

      osc.start();
      osc.stop(ctx.currentTime + 0.05);
    } catch (e) {
      console.warn(e);
    }
  },

  // 4. BUZZER Sound (Errors / Bomb Pop)
  playBuzzer() {
    if (isMuted) return;
    try {
      const ctx = getAudioContext();
      const osc1 = ctx.createOscillator();
      const osc2 = ctx.createOscillator();
      const gain = ctx.createGain();

      osc1.connect(gain);
      osc2.connect(gain);
      gain.connect(ctx.destination);

      osc1.type = 'sawtooth';
      osc2.type = 'square';
      osc1.frequency.setValueAtTime(130, ctx.currentTime);
      osc2.frequency.setValueAtTime(132, ctx.currentTime);

      gain.gain.setValueAtTime(0.2, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.4);

      osc1.start();
      osc2.start();
      osc1.stop(ctx.currentTime + 0.4);
      osc2.stop(ctx.currentTime + 0.4);
    } catch (e) {
      console.warn(e);
    }
  },

  // 5. TICK Sound (Clock ticking)
  playTick() {
    if (isMuted) return;
    try {
      const ctx = getAudioContext();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.type = 'square';
      osc.frequency.setValueAtTime(2000, ctx.currentTime);

      gain.gain.setValueAtTime(0.08, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.03);

      osc.start();
      osc.stop(ctx.currentTime + 0.03);
    } catch (e) {
      console.warn(e);
    }
  },

  // 6. SYNTH DRUM BEAT (Continuous bgm tension loop)
  startBGM() {
    isBgmPlaying = true;
    if (isMuted) return;
    this.stopBGM();

    try {
      const ctx = getAudioContext();
      let step = 0;
      // Fast, high-energy 8-bit techno bassline notes (frequency in Hz)
      const bassline = [
        110, 110, 147, 110,
        130, 130, 165, 130,
        110, 110, 147, 110,
        196, 175, 165, 147
      ];

      bgmInterval = setInterval(() => {
        if (isMuted) return;
        const currentNote = bassline[step % bassline.length];

        // Synthesize Bass Note
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.connect(gain);
        gain.connect(ctx.destination);

        osc.type = 'triangle';
        osc.frequency.setValueAtTime(currentNote, ctx.currentTime);
        
        gain.gain.setValueAtTime(0.12, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.18);

        osc.start();
        osc.stop(ctx.currentTime + 0.2);

        // Add a high-hat click on offbeats
        if (step % 2 === 1) {
          const hhOsc = ctx.createOscillator();
          const hhGain = ctx.createGain();
          hhOsc.connect(hhGain);
          hhGain.connect(ctx.destination);
          
          hhOsc.type = 'sawtooth';
          hhOsc.frequency.setValueAtTime(5000, ctx.currentTime);
          
          hhGain.gain.setValueAtTime(0.02, ctx.currentTime);
          hhGain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.04);
          
          hhOsc.start();
          hhOsc.stop(ctx.currentTime + 0.05);
        }

        step++;
      }, 150); // fast tempo (150ms per sixteenth note/beat)

    } catch (e) {
      console.warn('BGM start failed', e);
    }
  },

  stopBGM() {
    if (bgmInterval) {
      clearInterval(bgmInterval);
      bgmInterval = null;
    }
  },

  playWinFanfare() {
    if (isMuted) return;
    try {
      const ctx = getAudioContext();
      const notes = [261.63, 329.63, 392.00, 523.25, 659.25, 783.99, 1046.50]; // Arpeggio up
      notes.forEach((freq, idx) => {
        setTimeout(() => {
          if (isMuted) return;
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          osc.connect(gain);
          gain.connect(ctx.destination);
          osc.type = 'sine';
          osc.frequency.setValueAtTime(freq, ctx.currentTime);
          gain.gain.setValueAtTime(0.15, ctx.currentTime);
          gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.4);
          osc.start();
          osc.stop(ctx.currentTime + 0.4);
        }, idx * 100);
      });
    } catch (e) {
      console.warn(e);
    }
  }
};

export function useSound() {
  const [muted, setMuted] = useState(soundService.getMuted());

  const handleToggle = () => {
    const nextMute = soundService.toggleMute();
    setMuted(nextMute);
  };

  return {
    muted,
    toggleMute: handleToggle,
    playPop: () => soundService.playPop(),
    playCoin: () => soundService.playCoin(),
    playKeypress: () => soundService.playKeypress(),
    playBuzzer: () => soundService.playBuzzer(),
    playTick: () => soundService.playTick(),
    startBGM: () => soundService.startBGM(),
    stopBGM: () => soundService.stopBGM(),
    playWinFanfare: () => soundService.playWinFanfare()
  };
}
