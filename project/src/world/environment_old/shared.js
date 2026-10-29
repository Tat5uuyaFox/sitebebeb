import * as THREE from 'three';

/* =========================================================
   SHARED — палитра, текстуры, общие материалы
   ========================================================= */

export const PALETTE = {
  rock:      0x0a1218,
  rockDeep:  0x04080c,
  moss:      0x1a4a2a,
  mossLit:   0x3a8a5a,
  mossDark:  0x0a2a15,
  cyan:      0x4ac8d8,
  cyanDeep:  0x2a8a9a,
  warm:      0xffb060,
  warmDeep:  0xff8040,
  glow:      0xffd8a0,
  glowGreen: 0x7affc8,
};

/* =========================================================
   ТЕКСТУРЫ
   ========================================================= */

export const TEXTURES = {
  moss() {
    const size = 512;
    const cv = document.createElement('canvas');
    cv.width = cv.height = size;
    const ctx = cv.getContext('2d');
    ctx.fillStyle = '#050f08';
    ctx.fillRect(0, 0, size, size);
    for (let i = 0; i < 40000; i++) {
      const x = Math.random() * size;
      const y = Math.random() * size;
      const r = 0.5 + Math.random() * 2.5;
      const b = Math.random();
      ctx.fillStyle = `rgba(${10 + b * 40}, ${40 + b * 130}, ${20 + b * 40}, ${0.4 + Math.random() * 0.5})`;
      ctx.beginPath();
      ctx.arc(x, y, r, 0, Math.PI * 2);
      ctx.fill();
    }
    for (let i = 0; i < 250; i++) {
      const x = Math.random() * size;
      const y = Math.random() * size;
      const r = 15 + Math.random() * 70;
      const g = ctx.createRadialGradient(x, y, 0, x, y, r);
      g.addColorStop(0, 'rgba(0,0,0,0.4)');
      g.addColorStop(1, 'rgba(0,0,0,0)');
      ctx.fillStyle = g;
      ctx.fillRect(x - r, y - r, r * 2, r * 2);
    }
    const tex = new THREE.CanvasTexture(cv);
    tex.colorSpace = THREE.SRGBColorSpace;
    tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
    tex.anisotropy = 8;
    return tex;
  },

  glow() {
    const size = 128;
    const cv = document.createElement('canvas');
    cv.width = cv.height = size;
    const ctx = cv.getContext('2d');
    const g = ctx.createRadialGradient(size/2, size/2, 0, size/2, size/2, size/2);
    g.addColorStop(0.00, 'rgba(255, 240, 200, 1)');
    g.addColorStop(0.20, 'rgba(255, 200, 140, 0.7)');
    g.addColorStop(0.50, 'rgba(255, 150, 80, 0.2)');
    g.addColorStop(1.00, 'rgba(255, 120, 60, 0)');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, size, size);
    const tex = new THREE.CanvasTexture(cv);
    tex.colorSpace = THREE.SRGBColorSpace;
    return tex;
  },

  dot() {
    const size = 32;
    const cv = document.createElement('canvas');
    cv.width = cv.height = size;
    const ctx = cv.getContext('2d');
    const g = ctx.createRadialGradient(size/2, size/2, 0, size/2, size/2, size/2);
    g.addColorStop(0, 'rgba(255, 255, 240, 1)');
    g.addColorStop(0.4, 'rgba(200, 255, 200, 0.4)');
    g.addColorStop(1, 'rgba(100, 200, 150, 0)');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, size, size);
    const tex = new THREE.CanvasTexture(cv);
    tex.colorSpace = THREE.SRGBColorSpace;
    return tex;
  },

  leaf(hue = 'green') {
    const size = 128;
    const cv = document.createElement('canvas');
    cv.width = cv.height = size;
    const ctx = cv.getContext('2d');
    const colors = {
      green: { main: '#1a4a2a', vein: '#3a8a5a', edge: '#0a2a1a' },
      dark:  { main: '#0a2a15', vein: '#1a5a3a', edge: '#051208' },
      cyan:  { main: '#1a4a5a', vein: '#4ac8d8', edge: '#0a2a3a' },
      warm:  { main: '#4a3a1a', vein: '#8a6a3a', edge: '#2a1a0a' },
      red:   { main: '#4a1a1a', vein: '#8a3a3a', edge: '#2a0a0a' },
    };
    const c = colors[hue];

    // Форма листа
    ctx.fillStyle = c.main;
    ctx.beginPath();
    ctx.moveTo(size / 2, 4);
    ctx.quadraticCurveTo(size * 0.95, size * 0.5, size / 2, size - 4);
    ctx.quadraticCurveTo(size * 0.05, size * 0.5, size / 2, 4);
    ctx.fill();

    // Прожилки
    ctx.strokeStyle = c.vein;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(size / 2, 6);
    ctx.lineTo(size / 2, size - 6);
    ctx.stroke();
    ctx.lineWidth = 1;
    for (let i = 1; i < 8; i++) {
      const y = (i / 8) * size;
      const w = (size * 0.35) * (1 - y / size);
      ctx.beginPath();
      ctx.moveTo(size / 2, y);
      ctx.lineTo(size / 2 + w, y - 8);
      ctx.moveTo(size / 2, y);
      ctx.lineTo(size / 2 - w, y - 8);
      ctx.stroke();
    }
    ctx.strokeStyle = c.edge;
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(size / 2, 4);
    ctx.quadraticCurveTo(size * 0.95, size * 0.5, size / 2, size - 4);
    ctx.quadraticCurveTo(size * 0.05, size * 0.5, size / 2, 4);
    ctx.stroke();

    const tex = new THREE.CanvasTexture(cv);
    tex.colorSpace = THREE.SRGBColorSpace;
    return tex;
  },
};

/* =========================================================
   ОБЩИЕ МАТЕРИАЛЫ (создаются один раз)
   ========================================================= */

export function createSharedMaterials(mossTexture) {
  const mossClone = () => {
    const t = mossTexture.clone();
    t.needsUpdate = true;
    return t;
  };

  return {
    // --- Тёмный камень ---
    rockDark: new THREE.MeshStandardMaterial({
      color: PALETTE.rock,
      roughness: 0.95,
      metalness: 0.05,
      flatShading: true,
      emissive: 0x050a12,
      emissiveIntensity: 0.15,
    }),

    // --- Силуэт (передний план, чёрный) ---
    silhouette: new THREE.MeshBasicMaterial({
      color: 0x000000,
    }),

    // --- Мох на камнях ---
    moss: (() => {
      const m = new THREE.MeshStandardMaterial({
        color: PALETTE.mossDark,
        map: mossClone(),
        roughness: 0.95,
        emissive: PALETTE.moss,
        emissiveIntensity: 0.2,
        flatShading: true,
      });
      m.map.repeat.set(3, 3);
      return m;
    })(),

    // --- Мох для пола ---
    mossFloor: (() => {
      const m = new THREE.MeshStandardMaterial({
        color: 0x0a1a10,
        map: mossClone(),
        roughness: 1.0,
      });
      m.map.repeat.set(20, 20);
      return m;
    })(),

    // --- Каменная кора ---
    bark: new THREE.MeshStandardMaterial({
      color: 0x0a1512,
      roughness: 0.9,
      flatShading: true,
      emissive: 0x0a2015,
      emissiveIntensity: 0.15,
    }),

    // --- Сталактит ---
    stalactite: new THREE.MeshStandardMaterial({
      color: 0x08121a,
      roughness: 0.9,
      flatShading: true,
      emissive: 0x0a1a2a,
      emissiveIntensity: 0.1,
    }),

    // --- Лист (материал для листьев) ---
    leaf: (tex) => new THREE.MeshStandardMaterial({
      map: tex,
      color: 0x1a5a3a,
      emissive: 0x1a5a3a,
      emissiveIntensity: 0.2,
      side: THREE.DoubleSide,
      transparent: true,
      alphaTest: 0.1,
      roughness: 0.85,
    }),
  };
}