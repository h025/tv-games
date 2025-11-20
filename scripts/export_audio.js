const fs = require('fs');
const path = require('path');

const SAMPLE_RATE = 44100;

function generateSineWave(freq, durationSec, volume = 0.3) {
  const samples = Math.floor(durationSec * SAMPLE_RATE);
  const dataSize = samples * 2;
  const buffer = Buffer.alloc(44 + dataSize);

  buffer.write('RIFF', 0, 'ascii');
  buffer.writeUInt32LE(36 + dataSize, 4);
  buffer.write('WAVE', 8, 'ascii');
  buffer.write('fmt ', 12, 'ascii');
  buffer.writeUInt32LE(16, 16);
  buffer.writeUInt16LE(1, 20);
  buffer.writeUInt16LE(1, 22);
  buffer.writeUInt32LE(SAMPLE_RATE, 24);
  buffer.writeUInt32LE(SAMPLE_RATE * 2, 28);
  buffer.writeUInt16LE(2, 32);
  buffer.writeUInt16LE(16, 34);
  buffer.write('data', 36, 'ascii');
  buffer.writeUInt32LE(dataSize, 40);

  let offset = 44;
  for (let i = 0; i < samples; i++) {
    const t = i / SAMPLE_RATE;
    const envelope = Math.min(1, Math.min(t * 10, (durationSec - t) * 10));
    const sample = Math.sin(2 * Math.PI * freq * t) * volume * envelope;
    const intSample = Math.max(-32767, Math.min(32767, Math.floor(sample * 32767)));
    buffer.writeInt16LE(intSample, offset);
    offset += 2;
  }

  return buffer;
}

function saveWave(buffer, filePath) {
  fs.writeFileSync(filePath, buffer);
}

function ensureDir(dir) {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
}

function main() {
  const outputs = [
    path.join('public', 'free-chicken', 'audio'),
    path.join('tv-app', 'app', 'src', 'main', 'assets', 'audio')
  ];
  outputs.forEach(ensureDir);

  const sounds = {
    lay: generateSineWave(420, 0.18, 0.35),
    hatch: generateSineWave(900, 0.12, 0.3),
    chirp: generateSineWave(1400, 0.25, 0.25)
  };

  outputs.forEach((dir) => {
    Object.entries(sounds).forEach(([name, buffer]) => {
      saveWave(buffer, path.join(dir, `${name}.wav`));
    });
  });

  console.log('Audio exported to:');
  outputs.forEach((dir) => console.log(' -', dir));
}

main();
