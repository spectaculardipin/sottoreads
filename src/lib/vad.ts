import type { VadOptions, VadUpdate } from './types';

type VadState = 'waiting' | 'speaking' | 'paused' | 'complete';

/**
 * Lightweight energy-based voice activity detection.
 *
 * It never records or uploads audio. Samples are read from an AnalyserNode in
 * memory only to estimate when the student is speaking and when they pause.
 */
export class MicMonitor {
  private stream: MediaStream | null = null;
  private context: AudioContext | null = null;
  private source: MediaStreamAudioSourceNode | null = null;
  private analyser: AnalyserNode | null = null;
  private buffer: Float32Array<ArrayBuffer> | null = null;
  private frequencyBuffer: Float32Array<ArrayBuffer> | null = null;
  private timer: number | null = null;
  private active = false;
  private state: VadState = 'waiting';

  private startedAt = 0;
  private lastVoiceAt = 0;
  private speechMs = 0;
  private lastTickAt = 0;
  private noiseFloor = 0.006;
  private silenceMs: number;
  private minSpeechMs: number;
  private expectedSpeechMs: number;
  private expectedWords: number;
  private onUpdate?: (update: VadUpdate) => void;
  private onComplete?: (reason: 'silence' | 'estimated') => void;

  constructor(options: VadOptions = {}) {
    this.silenceMs = options.silenceMs ?? 1200;
    this.minSpeechMs = options.minSpeechMs ?? 260;
    this.expectedSpeechMs = options.expectedSpeechMs ?? 2200;
    this.expectedWords = options.expectedWords ?? 3;
    this.onUpdate = options.onUpdate;
    this.onComplete = options.onComplete;
  }

  async start(): Promise<void> {
    if (this.active) {
      this.reset();
      return;
    }

    if (!navigator.mediaDevices?.getUserMedia) {
      throw new Error('Microphone access is not available in this browser.');
    }

    this.stream = await navigator.mediaDevices.getUserMedia({
      audio: {
        echoCancellation: true,
        noiseSuppression: true,
        autoGainControl: true,
        channelCount: 1,
      },
    });

    const AudioContextCtor =
      window.AudioContext ??
      (window as typeof window & { webkitAudioContext?: typeof AudioContext })
        .webkitAudioContext;

    if (!AudioContextCtor) {
      this.stop();
      throw new Error('Web Audio is not available in this browser.');
    }

    this.context = new AudioContextCtor();
    if (this.context.state === 'suspended') {
      await this.context.resume();
    }

    this.source = this.context.createMediaStreamSource(this.stream);
    this.analyser = this.context.createAnalyser();
    this.analyser.fftSize = 1024;
    this.analyser.smoothingTimeConstant = 0.65;
    this.source.connect(this.analyser);
    this.buffer = new Float32Array(this.analyser.fftSize);
    this.frequencyBuffer = new Float32Array(this.analyser.frequencyBinCount);

    this.active = true;
    this.reset();
    this.lastTickAt = performance.now();
    this.timer = window.setInterval(() => this.tick(), 90);
  }

  reset(): void {
    this.state = 'waiting';
    this.startedAt = performance.now();
    this.lastVoiceAt = 0;
    this.speechMs = 0;
    this.lastTickAt = performance.now();
    this.emit();
  }

  stop(): void {
    this.active = false;
    this.state = 'complete';
    if (this.timer !== null) {
      window.clearInterval(this.timer);
      this.timer = null;
    }
    this.analyser?.disconnect();
    this.source?.disconnect();
    this.stream?.getTracks().forEach((track) => track.stop());
    this.context?.close().catch(() => {});
    this.stream = null;
    this.source = null;
    this.analyser = null;
    this.context = null;
    this.buffer = null;
    this.frequencyBuffer = null;
  }

  get isActive(): boolean {
    return this.active;
  }

  private tick(): void {
    if (!this.active || !this.analyser || !this.buffer) return;

    this.analyser.getFloatTimeDomainData(this.buffer);

    let sum = 0;
    for (let i = 0; i < this.buffer.length; i += 1) {
      sum += this.buffer[i] * this.buffer[i];
    }
    const rms = Math.sqrt(sum / this.buffer.length);

    const now = performance.now();
    const dt = Math.min(250, now - this.lastTickAt);
    this.lastTickAt = now;

    if (this.state === 'waiting') {
      this.noiseFloor = this.noiseFloor * 0.92 + rms * 0.08;
    }

    const threshold = Math.max(0.012, this.noiseFloor * 2.6);
    // Spectral gate: page flips and rumble have energy outside the voice band.
    const speaking = rms > threshold && this.isVoiceBandDominant();

    if (speaking) {
      this.lastVoiceAt = now;
      if (this.state === 'waiting' || this.state === 'paused') {
        this.state = 'speaking';
      }
      if (this.state === 'speaking') {
        this.speechMs += dt;
      }
    } else if (this.state === 'speaking') {
      const silence = now - this.lastVoiceAt;
      if (silence >= Math.min(420, this.silenceMs)) {
        this.state = 'paused';
      }
    }

    const silence = this.lastVoiceAt > 0 ? now - this.lastVoiceAt : 0;
    const enoughSpeech = this.speechMs >= this.minSpeechMs;
    const estimatedEnough =
      this.speechMs >= this.expectedSpeechMs * 0.62 &&
      silence >= Math.min(850, this.silenceMs * 0.65);
    const longPause = enoughSpeech && silence >= this.silenceMs;
    const speechGoal = enoughSpeech && this.speechMs >= this.expectedSpeechMs * 1.1 && silence >= 520;

    if (this.state === 'paused' && (longPause || estimatedEnough || speechGoal)) {
      this.state = 'complete';
      this.emit();
      this.onComplete?.(longPause ? 'silence' : 'estimated');
      return;
    }

    this.emit(rms, threshold);
  }

  private emit(rms = 0, threshold = 0.02): void {
    if (!this.onUpdate) return;
    const level = Math.max(0, Math.min(1, (rms - this.noiseFloor) / Math.max(0.02, threshold * 2.2)));
    const silence = this.lastVoiceAt > 0 ? performance.now() - this.lastVoiceAt : 0;
    this.onUpdate({
      rms,
      level,
      state: this.state,
      speechMs: this.speechMs,
      silenceMs: silence,
      estimatedWords: Math.min(
        this.expectedWords,
        this.speechMs / Math.max(250, this.expectedSpeechMs / Math.max(1, this.expectedWords)),
      ),
    });
    if (this.startedAt === 0) this.startedAt = performance.now();
  }

  /** True when most energy sits in the 300–3400 Hz human voice band. */
  private isVoiceBandDominant(): boolean {
    if (!this.analyser || !this.frequencyBuffer) return true;
    this.analyser.getFloatFrequencyData(this.frequencyBuffer);
    const sampleRate = this.context?.sampleRate ?? 44100;
    const binHz = sampleRate / this.analyser.fftSize;
    const start = Math.max(1, Math.floor(300 / binHz));
    const end = Math.min(this.frequencyBuffer.length - 1, Math.ceil(3400 / binHz));

    let band = 0;
    let total = 0;
    for (let i = 1; i < this.frequencyBuffer.length; i += 1) {
      const power = 10 ** (this.frequencyBuffer[i] / 10);
      total += power;
      if (i >= start && i <= end) band += power;
    }
    if (total <= 0) return false;
    // -60 dB is the analyser floor; ignore frames that are effectively silent.
    if (total < 1e-6) return false;
    return band / total >= 0.35;
  }
}
