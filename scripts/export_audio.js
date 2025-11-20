const fs = require('fs');
const path = require('path');

const SAMPLE_RATE = 44100;

function createWaveBuffer(samples) {
  const dataSize = samples.length * 2;
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
  samples.forEach(sample => {
    const intSample = Math.max(-32767, Math.min(32767, Math.floor(sample * 32767)));
    buffer.writeInt16LE(intSample, offset);
    offset += 2;
  });
  return buffer;
}

function generateSweep(startFreq, endFreq, durationSec, volume = 0.3, harmonics = 1) {
  const totalSamples = Math.floor(durationSec * SAMPLE_RATE);
  const samples = new Array(totalSamples);

  for (let i = 0; i < totalSamples; i++) {
    const t = i / SAMPLE_RATE;
    const progress = t / durationSec;
    const freq = startFreq + (endFreq - startFreq) * progress;
    let sample = 0;
    for (let h = 1; h <= harmonics; h++) {
      sample += Math.sin(2 * Math.PI * freq * h * t) / h;
    }
    const envelope = Math.pow(Math.sin(Math.PI * progress), 1.5);
    samples[i] = sample * volume * envelope;
  }
  return createWaveBuffer(samples);
}

function generateChirp() {
  const totalSamples = Math.floor(0.3 * SAMPLE_RATE);
  const samples = new Array(totalSamples);
  for (let i = 0; i < totalSamples; i++) {
    const t = i / SAMPLE_RATE;
    const progress = t / 0.3;
    const freq = 1800 + 800 * Math.sin(progress * Math.PI);
    const sample =
      Math.sin(2 * Math.PI * freq * t) * 0.3 +
      Math.sin(2 * Math.PI * (freq / 2) * t) * 0.15 +
      (Math.random() * 2 - 1) * 0.05;
    const envelope = Math.pow(Math.sin(Math.PI * progress), 1.2);
    samples[i] = sample * envelope;
  }
  return createWaveBuffer(samples);
}

function generatePluck() {
  const totalSamples = Math.floor(0.18 * SAMPLE_RATE);
  const samples = new Array(totalSamples);
  for (let i = 0; i < totalSamples; i++) {
    const t = i / SAMPLE_RATE;
    const decay = Math.exp(-20 * t);
    const freq = 600 + 200 * Math.sin(t * 30);
    const sample =
      (Math.sin(2 * Math.PI * freq * t) * decay * 0.4) +
      (Math.random() * 2 - 1) * 0.08 * decay;
    samples[i] = sample;
  }
  return createWaveBuffer(samples);
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
    lay: generateSweep(550, 320, 0.2, 0.25, 2),
    hatch: generatePluck(),
    chirp: generateChirp()
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
