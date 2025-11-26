import { BGM_URL } from "../constants";

class AudioManager {
  private audioCtx: AudioContext | null = null;
  private bgmElement: HTMLAudioElement | null = null;
  private isMuted: boolean = false;
  private isInitialized: boolean = false;

  constructor() {
    // We defer AudioContext creation until user interaction to adhere to browser policies
  }

  public init() {
    if (this.isInitialized) return;

    // 1. Setup Web Audio API for SFX
    const AudioContextClass = (window.AudioContext || (window as any).webkitAudioContext);
    if (AudioContextClass) {
      this.audioCtx = new AudioContextClass();
    }

    // 2. Setup BGM
    this.bgmElement = new Audio(BGM_URL);
    this.bgmElement.loop = true;
    this.bgmElement.volume = 0.3; // Gentle background level

    this.isInitialized = true;
    
    // Attempt to play BGM if not muted
    if (!this.isMuted) {
      this.bgmElement.play().catch(() => {
        // Auto-play blocked, will retry on next user interaction
      });
    }
  }

  public toggleMute() {
    this.isMuted = !this.isMuted;
    
    if (this.bgmElement) {
      if (this.isMuted) {
        this.bgmElement.pause();
      } else {
        this.bgmElement.play().catch(e => console.error("BGM play failed", e));
      }
    }
    
    return this.isMuted;
  }

  public getMuteStatus() {
    return this.isMuted;
  }

  // --- SYNTHESIZED SOUND EFFECTS ---
  // Using oscillators avoids loading external files for simple UI sounds, ensuring zero latency

  public playClick() {
    if (this.isMuted || !this.audioCtx) return;

    // Short, high-pitched "blip"
    const osc = this.audioCtx.createOscillator();
    const gain = this.audioCtx.createGain();

    osc.connect(gain);
    gain.connect(this.audioCtx.destination);

    osc.type = 'sine';
    osc.frequency.setValueAtTime(800, this.audioCtx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(1200, this.audioCtx.currentTime + 0.1);

    gain.gain.setValueAtTime(0.1, this.audioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, this.audioCtx.currentTime + 0.1);

    osc.start();
    osc.stop(this.audioCtx.currentTime + 0.1);
  }

  public playPop() {
    if (this.isMuted || !this.audioCtx) return;

    // "Bubble pop" sound
    const osc = this.audioCtx.createOscillator();
    const gain = this.audioCtx.createGain();

    osc.connect(gain);
    gain.connect(this.audioCtx.destination);

    osc.type = 'sine';
    osc.frequency.setValueAtTime(400, this.audioCtx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(100, this.audioCtx.currentTime + 0.15);

    gain.gain.setValueAtTime(0.1, this.audioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, this.audioCtx.currentTime + 0.15);

    osc.start();
    osc.stop(this.audioCtx.currentTime + 0.15);
  }

  public playSuccess() {
    if (this.isMuted || !this.audioCtx) return;

    // Simple Arpeggio (Major chord)
    const now = this.audioCtx.currentTime;
    const notes = [523.25, 659.25, 783.99, 1046.50]; // C Major
    
    notes.forEach((freq, i) => {
      const osc = this.audioCtx!.createOscillator();
      const gain = this.audioCtx!.createGain();
      
      osc.connect(gain);
      gain.connect(this.audioCtx!.destination);
      
      osc.type = 'triangle';
      osc.frequency.value = freq;
      
      const startTime = now + (i * 0.1);
      gain.gain.setValueAtTime(0, startTime);
      gain.gain.linearRampToValueAtTime(0.1, startTime + 0.05);
      gain.gain.exponentialRampToValueAtTime(0.01, startTime + 0.4);
      
      osc.start(startTime);
      osc.stop(startTime + 0.4);
    });
  }

  public playPencilScratch() {
    if (this.isMuted || !this.audioCtx) return;
    
    // Noise burst for pencil sound
    const bufferSize = this.audioCtx.sampleRate * 0.1; // 0.1 seconds
    const buffer = this.audioCtx.createBuffer(1, bufferSize, this.audioCtx.sampleRate);
    const data = buffer.getChannelData(0);

    for (let i = 0; i < bufferSize; i++) {
        data[i] = Math.random() * 2 - 1;
    }

    const noise = this.audioCtx.createBufferSource();
    noise.buffer = buffer;

    const gain = this.audioCtx.createGain();
    // Low pass filter to make it sound duller like graphite
    const filter = this.audioCtx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.value = 1000;

    noise.connect(filter);
    filter.connect(gain);
    gain.connect(this.audioCtx.destination);

    gain.gain.setValueAtTime(0.05, this.audioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, this.audioCtx.currentTime + 0.1);

    noise.start();
  }
}

export const audioManager = new AudioManager();
