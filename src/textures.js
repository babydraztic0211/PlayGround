import * as THREE from 'three';
import { mulberry32, TAU } from './utils.js';

function hash2(x, y, seed) {
  let h = Math.imul(x, 374761393) + Math.imul(y, 668265263) + Math.imul(seed, 1442695041);
  h = Math.imul(h ^ (h >>> 13), 1274126177);
  h ^= h >>> 16;
  return (h >>> 0) / 4294967295;
}

function fade(t) {
  return t * t * (3 - 2 * t);
}

function tileNoise(x, y, period, seed) {
  const xi = Math.floor(x);
  const yi = Math.floor(y);
  const xf = x - xi;
  const yf = y - yi;
  const u = fade(xf);
  const v = fade(yf);
  const x0 = ((xi % period) + period) % period;
  const y0 = ((yi % period) + period) % period;
  const x1 = (x0 + 1) % period;
  const y1 = (y0 + 1) % period;
  const a = hash2(x0, y0, seed);
  const b = hash2(x1, y0, seed);
  const c = hash2(x0, y1, seed);
  const d = hash2(x1, y1, seed);
  return (a * (1 - u) + b * u) * (1 - v) + (c * (1 - u) + d * u) * v;
}

function fbm(x, y, seed, octaves = 5, period = 6) {
  let value = 0;
  let amp = 0.5;
  let freq = period;
  let norm = 0;
  for (let i = 0; i < octaves; i += 1) {
    value += tileNoise(x * freq, y * freq, freq, seed + i * 97) * amp;
    norm += amp;
    amp *= 0.5;
    freq *= 2;
  }
  return value / norm;
}

function canvas2d(size) {
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  return { canvas, ctx: canvas.getContext('2d', { willReadFrequently: true }) };
}

function makeTexture(canvas, { repeat = true, srgb = true } = {}) {
  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = repeat ? THREE.RepeatWrapping : THREE.ClampToEdgeWrapping;
  texture.wrapT = repeat ? THREE.RepeatWrapping : THREE.ClampToEdgeWrapping;
  texture.colorSpace = srgb ? THREE.SRGBColorSpace : THREE.NoColorSpace;
  texture.anisotropy = 4;
  texture.needsUpdate = true;
  return texture;
}

function drawCracks(ctx, rng, size, count, color, glow = false) {
  ctx.save();
  for (let c = 0; c < count; c += 1) {
    let x = rng() * size;
    let y = rng() * size;
    let angle = rng() * TAU;
    const segments = 5 + Math.floor(rng() * 9);
    const width = 0.7 + rng() * 1.5;
    ctx.beginPath();
    ctx.moveTo(x, y);
    for (let i = 0; i < segments; i += 1) {
      angle += (rng() - 0.5) * 1.15;
      const step = 7 + rng() * 23;
      x += Math.cos(angle) * step;
      y += Math.sin(angle) * step;
      ctx.lineTo(x, y);
      if (rng() > 0.7) {
        const bx = x;
        const by = y;
        const ba = angle + (rng() - 0.5) * 1.8;
        ctx.moveTo(x, y);
        for (let j = 0; j < 3; j += 1) {
          ctx.lineTo(bx + Math.cos(ba + j * 0.4) * (4 + rng() * 12), by + Math.sin(ba + j * 0.4) * (4 + rng() * 12));
        }
        ctx.moveTo(x, y);
      }
    }
    ctx.strokeStyle = color;
    ctx.lineWidth = width;
    ctx.lineCap = 'round';
    if (glow) {
      ctx.shadowBlur = 8;
      ctx.shadowColor = color;
    }
    ctx.stroke();
  }
  ctx.restore();
}

function buildRock(size, seed, baseValue, variation, cracks, tint) {
  const color = canvas2d(size);
  const bump = canvas2d(size);
  const rng = mulberry32(seed);
  const colorData = color.ctx.createImageData(size, size);
  const bumpData = bump.ctx.createImageData(size, size);

  for (let y = 0; y < size; y += 1) {
    for (let x = 0; x < size; x += 1) {
      const i = (y * size + x) * 4;
      const nx = x / size;
      const ny = y / size;
      const broad = fbm(nx, ny, seed, 5, 5);
      const detail = fbm(nx, ny, seed + 311, 4, 23);
      const grit = hash2(x, y, seed + 17);
      const n = broad * 0.68 + detail * 0.32;
      let value = baseValue + (n - 0.5) * variation + (grit - 0.5) * 17;
      value = Math.max(0, Math.min(255, value));
      colorData.data[i] = Math.min(255, value * tint[0]);
      colorData.data[i + 1] = Math.min(255, value * tint[1]);
      colorData.data[i + 2] = Math.min(255, value * tint[2]);
      colorData.data[i + 3] = 255;
      const b = Math.max(0, Math.min(255, 96 + (n - 0.5) * 230 + (grit - 0.5) * 40));
      bumpData.data[i] = b;
      bumpData.data[i + 1] = b;
      bumpData.data[i + 2] = b;
      bumpData.data[i + 3] = 255;
    }
  }
  color.ctx.putImageData(colorData, 0, 0);
  bump.ctx.putImageData(bumpData, 0, 0);

  drawCracks(color.ctx, rng, size, cracks, 'rgba(8, 7, 10, 0.62)');
  drawCracks(color.ctx, rng, size, Math.max(2, cracks - 3), 'rgba(210, 200, 190, 0.08)');
  drawCracks(bump.ctx, mulberry32(seed + 99), size, cracks, 'rgba(0, 0, 0, 0.85)');

  const speckRng = mulberry32(seed + 41);
  for (let i = 0; i < size * 2.2; i += 1) {
    const x = speckRng() * size;
    const y = speckRng() * size;
    const r = 0.4 + speckRng() * 1.7;
    const v = 120 + speckRng() * 90;
    color.ctx.fillStyle = `rgba(${v}, ${v * 0.97}, ${v * 0.9}, ${0.16 + speckRng() * 0.2})`;
    color.ctx.beginPath();
    color.ctx.arc(x, y, r, 0, TAU);
    color.ctx.fill();
  }

  return { color: color.canvas, bump: bump.canvas };
}

export function createRockTextures() {
  const rock = buildRock(512, 7, 148, 112, 16, [1.0, 0.98, 0.95]);
  const ground = buildRock(512, 23, 122, 96, 22, [0.97, 0.96, 0.94]);
  return {
    rock: makeTexture(rock.color),
    rockBump: makeTexture(rock.bump, { srgb: false }),
    ground: makeTexture(ground.color),
    groundBump: makeTexture(ground.bump, { srgb: false }),
  };
}

export function createGlowTexture(size = 128) {
  const { canvas, ctx } = canvas2d(size);
  const g = ctx.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2);
  g.addColorStop(0, 'rgba(255,255,255,1)');
  g.addColorStop(0.18, 'rgba(255,255,255,0.85)');
  g.addColorStop(0.45, 'rgba(255,255,255,0.28)');
  g.addColorStop(0.75, 'rgba(255,255,255,0.06)');
  g.addColorStop(1, 'rgba(255,255,255,0)');
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, size, size);
  return makeTexture(canvas, { repeat: false });
}

export function createSoftTexture(size = 64) {
  const { canvas, ctx } = canvas2d(size);
  const g = ctx.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2);
  g.addColorStop(0, 'rgba(255,255,255,0.95)');
  g.addColorStop(0.5, 'rgba(255,255,255,0.3)');
  g.addColorStop(1, 'rgba(255,255,255,0)');
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, size, size);
  return makeTexture(canvas, { repeat: false });
}

export function createRuneTexture(size = 512) {
  const { canvas, ctx } = canvas2d(size);
  const c = size / 2;
  ctx.clearRect(0, 0, size, size);

  const glow = ctx.createRadialGradient(c, c, 0, c, c, c);
  glow.addColorStop(0, 'rgba(255,255,255,0.5)');
  glow.addColorStop(0.44, 'rgba(255,255,255,0.16)');
  glow.addColorStop(0.72, 'rgba(255,255,255,0.05)');
  glow.addColorStop(1, 'rgba(255,255,255,0)');
  ctx.fillStyle = glow;
  ctx.fillRect(0, 0, size, size);

  ctx.strokeStyle = 'rgba(255,255,255,0.72)';
  ctx.lineWidth = 2;
  ctx.shadowBlur = 12;
  ctx.shadowColor = 'rgba(255,255,255,0.85)';
  for (const r of [0.94, 0.9, 0.66, 0.6]) {
    ctx.beginPath();
    ctx.arc(c, c, c * r, 0, TAU);
    ctx.stroke();
  }
  ctx.lineWidth = 1;
  ctx.strokeStyle = 'rgba(255,255,255,0.26)';
  for (let i = 0; i < 72; i += 1) {
    const a = (i / 72) * TAU;
    ctx.beginPath();
    ctx.moveTo(c + Math.cos(a) * c * 0.66, c + Math.sin(a) * c * 0.66);
    ctx.lineTo(c + Math.cos(a) * c * 0.9, c + Math.sin(a) * c * 0.9);
    ctx.stroke();
  }

  const rng = mulberry32(91);
  ctx.strokeStyle = 'rgba(255,255,255,0.9)';
  ctx.lineWidth = 2.2;
  ctx.shadowBlur = 10;
  ctx.shadowColor = 'rgba(255,255,255,0.9)';
  for (let i = 0; i < 18; i += 1) {
    const a = (i / 18) * TAU;
    ctx.save();
    ctx.translate(c + Math.cos(a) * c * 0.78, c + Math.sin(a) * c * 0.78);
    ctx.rotate(a + Math.PI / 2);
    ctx.beginPath();
    const glyph = Math.floor(rng() * 5);
    if (glyph === 0) {
      ctx.moveTo(-7, -9); ctx.lineTo(7, -9); ctx.lineTo(0, 9); ctx.closePath();
    } else if (glyph === 1) {
      ctx.moveTo(0, -10); ctx.lineTo(0, 10); ctx.moveTo(-7, -3); ctx.lineTo(7, 3);
    } else if (glyph === 2) {
      ctx.moveTo(-7, -8); ctx.lineTo(0, 0); ctx.lineTo(-7, 8); ctx.moveTo(1, -8); ctx.lineTo(8, 0); ctx.lineTo(1, 8);
    } else if (glyph === 3) {
      ctx.arc(0, 0, 7, 0, Math.PI * 1.4); ctx.moveTo(0, -10); ctx.lineTo(0, 10);
    } else {
      ctx.moveTo(-8, -8); ctx.lineTo(8, -8); ctx.moveTo(-8, 8); ctx.lineTo(8, 8); ctx.moveTo(0, -10); ctx.lineTo(0, 10);
    }
    ctx.stroke();
    ctx.restore();
  }

  const rng2 = mulberry32(52);
  for (let i = 0; i < 130; i += 1) {
    const a = rng2() * TAU;
    const r = Math.sqrt(rng2()) * c * 0.92;
    const s = 0.6 + rng2() * 2.2;
    ctx.fillStyle = `rgba(255,255,255,${0.15 + rng2() * 0.45})`;
    ctx.beginPath();
    ctx.arc(c + Math.cos(a) * r, c + Math.sin(a) * r, s, 0, TAU);
    ctx.fill();
  }
  return makeTexture(canvas, { repeat: false });
}

export function createCrackTexture(size = 256) {
  const { canvas, ctx } = canvas2d(size);
  const rng = mulberry32(77);
  ctx.clearRect(0, 0, size, size);
  ctx.strokeStyle = 'rgba(255,255,255,0.9)';
  ctx.lineCap = 'round';
  ctx.shadowBlur = 16;
  ctx.shadowColor = 'rgba(255,255,255,0.9)';
  for (let c = 0; c < 3; c += 1) {
    let x = rng() * size;
    let y = size * 0.5;
    let a = (rng() - 0.5) * 0.4;
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.lineWidth = 2.4;
    for (let i = 0; i < 16; i += 1) {
      a += (rng() - 0.5) * 0.8;
      x += Math.cos(a) * 11;
      y += (rng() - 0.5) * 16;
      ctx.lineTo(x, y);
      if (rng() > 0.78) {
        ctx.stroke();
        ctx.beginPath();
        ctx.lineWidth = 1;
        ctx.moveTo(x, y);
        ctx.lineTo(x + (rng() - 0.5) * 40, y + (rng() - 0.5) * 30);
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(x, y);
        ctx.lineWidth = 2.4;
      }
    }
    ctx.stroke();
  }
  return makeTexture(canvas, { repeat: false });
}

export function createWoodTexture(size = 256) {
  const { canvas, ctx } = canvas2d(size);
  const rng = mulberry32(5);
  ctx.fillStyle = '#2a211b';
  ctx.fillRect(0, 0, size, size);
  for (let i = 0; i < 110; i += 1) {
    const y = rng() * size;
    const v = 22 + rng() * 34;
    ctx.strokeStyle = `rgba(${v + 12}, ${v + 4}, ${v - 4}, ${0.15 + rng() * 0.3})`;
    ctx.lineWidth = 0.5 + rng() * 2;
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.bezierCurveTo(size * 0.3, y + (rng() - 0.5) * 8, size * 0.7, y + (rng() - 0.5) * 8, size, y + (rng() - 0.5) * 6);
    ctx.stroke();
  }
  return makeTexture(canvas, { repeat: true });
}

export function createTextures() {
  const rock = createRockTextures();
  return {
    ...rock,
    glow: createGlowTexture(128),
    soft: createSoftTexture(64),
    rune: createRuneTexture(512),
    crack: createCrackTexture(256),
    wood: createWoodTexture(256),
  };
}
