let audioContext: AudioContext | null = null;
let warmed = false;

export function getAudioContext(): AudioContext {
  if (!audioContext) {
    audioContext = new AudioContext({ latencyHint: 'interactive' });
  }
  return audioContext;
}

export function isAudioWarm(): boolean {
  return warmed && audioContext?.state === 'running';
}

function playSilentWarmup(ctx: AudioContext): void {
  const frames = Math.max(1, Math.round(ctx.sampleRate * 0.1));
  const buffer = ctx.createBuffer(1, frames, ctx.sampleRate);
  const source = ctx.createBufferSource();
  const gain = ctx.createGain();
  gain.gain.value = 0;
  source.buffer = buffer;
  source.connect(gain).connect(ctx.destination);
  source.start();
  source.onended = () => {
    source.disconnect();
    gain.disconnect();
  };
}

/**
 * Must be called from a user gesture the first time. It resumes the context and
 * pushes one silent buffer through the graph so the first real phrase never
 * pays the device/output warm-up cost.
 */
export async function primeAudio(): Promise<AudioContext> {
  const ctx = getAudioContext();
  if (ctx.state === 'suspended') {
    await ctx.resume();
  }
  if (!warmed) {
    playSilentWarmup(ctx);
    warmed = true;
    await new Promise<void>((resolve) => window.setTimeout(resolve, 40));
  }
  return ctx;
}

export function base64ToBytes(base64: string): Uint8Array {
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let index = 0; index < binary.length; index += 1) {
    bytes[index] = binary.charCodeAt(index);
  }
  return bytes;
}

export async function decodeAudioBase64(base64: string, _mimeType: string): Promise<AudioBuffer> {
  const ctx = getAudioContext();
  const bytes = base64ToBytes(base64);
  const data = bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength);
  return ctx.decodeAudioData(data as ArrayBuffer);
}

export async function decodeAudioArrayBuffer(data: ArrayBuffer): Promise<AudioBuffer> {
  const ctx = getAudioContext();
  return ctx.decodeAudioData(data);
}

/**
 * Add silence to both ends of the generated audio. A small lead-in is the
 * single most effective defence against a clipped first phoneme, and the tail
 * stops the final consonant from being cut when a new batch begins.
 */
export function padAudioBuffer(
  buffer: AudioBuffer,
  leadSec = 0.12,
  trailSec = 0.08,
): AudioBuffer {
  const ctx = getAudioContext();
  const rate = buffer.sampleRate;
  const leadFrames = Math.round(leadSec * rate);
  const trailFrames = Math.round(trailSec * rate);
  const output = ctx.createBuffer(
    buffer.numberOfChannels,
    leadFrames + buffer.length + trailFrames,
    rate,
  );

  for (let channel = 0; channel < buffer.numberOfChannels; channel += 1) {
    const source = buffer.getChannelData(channel);
    const target = output.getChannelData(channel);
    target.set(source, leadFrames);

    // 3 ms fade-in on the real audio edge, in case the provider starts on a
    // non-zero sample. The lead-in itself stays perfectly silent.
    const fadeFrames = Math.min(Math.round(0.003 * rate), source.length);
    for (let index = 0; index < fadeFrames; index += 1) {
      target[leadFrames + index] *= index / fadeFrames;
    }
  }

  return output;
}

export function disconnectNode(node: AudioNode | null): void {
  if (!node) return;
  try {
    node.disconnect();
  } catch {
    // Already disconnected.
  }
}
