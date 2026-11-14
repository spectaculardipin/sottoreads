/**
 * Local fake Fish/OpenRouter upstream for integration testing.
 *
 *   npx tsx scripts/fake-upstream.ts
 *   FISH_API_KEY=fake FISH_API_BASE=http://127.0.0.1:5199 npm run dev
 *
 * It returns a valid WAV plus word alignment segments so the real provider
 * adapter, SSE parser, padding, and highlight mapping can be exercised without
 * spending a cloud key.
 */
import { createServer } from 'node:http';

const PORT = Number(process.env.FAKE_UPSTREAM_PORT || 5199);

function makeWav(words: string[]): {
  buffer: Buffer;
  segments: Array<{ text: string; start: number; end: number }>;
  splitByte: number;
  splitSeconds: number;
} {
  const sampleRate = 22050;
  const wordSeconds = 0.5;
  const frames = Math.ceil(words.length * wordSeconds * sampleRate);
  const samples = new Int16Array(frames);
  const segments = words.map((word, index) => ({
    text: word,
    start: index * wordSeconds,
    end: (index + 1) * wordSeconds,
  }));

  words.forEach((_, index) => {
    const start = Math.floor(index * wordSeconds * sampleRate);
    const end = Math.floor((index + 1) * wordSeconds * sampleRate);
    const frequency = 220 + index * 35;
    for (let frame = start; frame < end; frame += 1) {
      const value = Math.sin(((frame - start) / sampleRate) * frequency * Math.PI * 2) * 0.25;
      samples[frame] = Math.round(value * 32767);
    }
  });

  const header = Buffer.alloc(44);
  header.write('RIFF', 0);
  header.writeUInt32LE(36 + samples.byteLength, 4);
  header.write('WAVE', 8);
  header.write('fmt ', 12);
  header.writeUInt32LE(16, 16);
  header.writeUInt16LE(1, 20);
  header.writeUInt16LE(1, 22);
  header.writeUInt32LE(sampleRate, 24);
  header.writeUInt32LE(sampleRate * 2, 28);
  header.writeUInt16LE(2, 32);
  header.writeUInt16LE(16, 34);
  header.write('data', 36);
  header.writeUInt32LE(samples.byteLength, 40);

  const audio = Buffer.concat([header, Buffer.from(samples.buffer)]);
  const splitIndex = Math.max(1, Math.floor(words.length / 2));
  const splitByte = 44 + Math.floor(splitIndex * wordSeconds * sampleRate) * 2;
  return {
    buffer: audio,
    segments,
    splitByte,
    splitSeconds: splitIndex * wordSeconds,
  };
}

function readJson(req: import('node:http').IncomingMessage): Promise<Record<string, unknown>> {
  return new Promise((resolve, reject) => {
    let raw = '';
    req.on('data', (chunk) => {
      raw += String(chunk);
    });
    req.on('end', () => {
      try {
        resolve(JSON.parse(raw || '{}') as Record<string, unknown>);
      } catch (error) {
        reject(error);
      }
    });
    req.on('error', reject);
  });
}

const server = createServer(async (req, res) => {
  const url = new URL(req.url ?? '/', `http://${req.headers.host || '127.0.0.1'}`);
  console.log(req.method, url.pathname);

  if (req.method !== 'POST') {
    res.statusCode = 404;
    res.end('not found');
    return;
  }

  const body = await readJson(req);
  const text = String(body.text || body.input || 'Alpha beta gamma delta');
  const words = text.split(/\s+/).filter(Boolean).slice(0, 8);
  const wav = makeWav(words.length > 0 ? words : ['Alpha', 'beta', 'gamma', 'delta']);

  if (url.pathname === '/v1/tts/stream/with-timestamp') {
    res.statusCode = 200;
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.flushHeaders();

    const first = wav.buffer.subarray(0, wav.splitByte);
    const second = wav.buffer.subarray(wav.splitByte);
    const splitIndex = Math.floor(words.length / 2);

    const writeEvent = (payload: unknown) => {
      res.write(`data: ${JSON.stringify(payload)}\n\n`);
    };

    writeEvent({
      audio_base64: first.toString('base64'),
      content: words.slice(0, splitIndex).join(' '),
      chunk_seq: 0,
      chunk_audio_offset_sec: 0,
      alignment: {
        audio_duration: wav.splitSeconds,
        segments: wav.segments.slice(0, splitIndex),
      },
    });

    setTimeout(() => {
      writeEvent({
        audio_base64: second.toString('base64'),
        content: words.slice(splitIndex).join(' '),
        chunk_seq: 1,
        chunk_audio_offset_sec: wav.splitSeconds,
        alignment: {
          audio_duration: words.length * 0.5 - wav.splitSeconds,
          segments: wav.segments.slice(splitIndex).map((segment) => ({
            text: segment.text,
            start: segment.start - wav.splitSeconds,
            end: segment.end - wav.splitSeconds,
          })),
        },
      });
      res.end();
    }, 260);
    return;
  }

  if (url.pathname === '/v1/tts' || url.pathname === '/api/v1/audio/speech') {
    res.statusCode = 200;
    res.setHeader('Content-Type', 'audio/wav');
    res.end(wav.buffer);
    return;
  }

  res.statusCode = 404;
  res.end('not found');
});

server.listen(PORT, '127.0.0.1', () => {
  console.log(`fake upstream listening on http://127.0.0.1:${PORT}`);
});
