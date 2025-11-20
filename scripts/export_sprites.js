const fs = require('fs');
const path = require('path');
const { createCanvas } = require('canvas');

function drawMother(ctx, w, h, phase = 0) {
  ctx.translate(w / 2, h / 2 + 5);
  ctx.fillStyle = '#FFF';
  ctx.beginPath();
  ctx.ellipse(0, 0, 25, 30, 0, 0, Math.PI * 2);
  ctx.fill();

  const wingAngle = phase === 0 ? 0 : (phase === 1 ? -Math.PI / 8 : Math.PI / 8);
  ctx.save();
  ctx.rotate(wingAngle);
  ctx.fillStyle = '#EEE';
  ctx.beginPath();
  ctx.ellipse(-10, 5, 12, 8, -0.5, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();
  ctx.restore();

  ctx.fillStyle = '#F00';
  ctx.beginPath();
  ctx.arc(0, -25, 8, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = '#FFA000';
  ctx.beginPath();
  ctx.moveTo(15, -10);
  ctx.lineTo(25, -5);
  ctx.lineTo(15, 0);
  ctx.fill();

  ctx.fillStyle = '#000';
  ctx.beginPath();
  ctx.arc(10, -15, 3, 0, Math.PI * 2);
  ctx.fill();
}

function drawChick(ctx, w, h, phase = 0) {
  ctx.translate(w / 2, h / 2 + 2);
  ctx.fillStyle = '#FFD700';
  ctx.beginPath();
  ctx.arc(0, 0, 10, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = '#F57F17';
  ctx.beginPath();
  ctx.moveTo(6, -2 + phase);
  ctx.lineTo(12, phase);
  ctx.lineTo(6, 2 + phase);
  ctx.fill();

  ctx.fillStyle = '#000';
  ctx.beginPath();
  ctx.arc(3, -3 + phase * 0.2, 2, 0, Math.PI * 2);
  ctx.fill();
}

function drawBackground(ctx, w, h) {
  const gradient = ctx.createLinearGradient(0, 0, 0, h);
  gradient.addColorStop(0, '#9CCC65');
  gradient.addColorStop(1, '#558B2F');
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, w, h);

  ctx.fillStyle = 'rgba(255,255,255,0.2)';
  for (let i = 0; i < 200; i++) {
    const x = Math.random() * w;
    const y = Math.random() * h;
    const size = Math.random() * 3 + 1;
    ctx.beginPath();
    ctx.arc(x, y, size, 0, Math.PI * 2);
    ctx.fill();
  }
}

function savePNG(canvas, filePath) {
  const buffer = canvas.toBuffer('image/png');
  fs.writeFileSync(filePath, buffer);
}

function ensureDir(dir) {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
}

function main() {
  const outDirs = [
    path.join('public', 'free-chicken', 'images'),
    path.join('tv-app', 'app', 'src', 'main', 'assets', 'images'),
  ];
  outDirs.forEach(ensureDir);

  const motherFrames = [0, 1, 2].map((phase) => {
    const canvas = createCanvas(80, 80);
    drawMother(canvas.getContext('2d'), 80, 80, phase);
    return canvas;
  });

  const chickFrames = [0, 1].map((phase) => {
    const canvas = createCanvas(40, 40);
    drawChick(canvas.getContext('2d'), 40, 40, phase === 0 ? 0 : 2);
    return canvas;
  });

  const bgCanvas = createCanvas(1024, 576);
  drawBackground(bgCanvas.getContext('2d'), 1024, 576);

  outDirs.forEach((dir) => {
    motherFrames.forEach((canvas, idx) => {
      savePNG(canvas, path.join(dir, `mother_${idx}.png`));
    });
    chickFrames.forEach((canvas, idx) => {
      savePNG(canvas, path.join(dir, `chick_${idx}.png`));
    });
    savePNG(bgCanvas, path.join(dir, 'background.png'));
  });

  console.log('Sprites exported to:');
  outDirs.forEach((dir) => console.log(' -', dir));
}

main();

