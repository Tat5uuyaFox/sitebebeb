import * as THREE from 'three';

/* =========================================================
   SHARED — палитра, текстуры, материалы
   =========================================================
   ПЕРЕПИСАНО С НУЛЯ.

   Что внутри:
   - PALETTE — все цвета
   - TEXTURES — процедурные текстуры (генерируются)
   - createMaterials() — единые материалы для всей сцены

   Принципы:
   - Тёмные базовые цвета
   - Умеренный emissive
   - Bump maps для рельефа
   - Общие материалы для всех модулей
   ========================================================= */

export const PALETTE = {
  // --- Фон и туман ---
  bgDeep:       0x03050a,   // почти чёрный, синий подтон
  fogDeep:      0x0a0a18,   // фиолетово-синий

  // --- Земля и мох ---
  mossDark:     0x0a1a10,   // тёмный мох
  mossMid:      0x1a3a1a,   // средний зелёный
  mossLight:    0x2a5a2a,   // освещённый мох
  dirt:         0x0a0806,   // земля, грязь

  // --- Камень ---
  rockDark:     0x0a0a14,   // тёмный камень
  rockMid:      0x1a1a24,   // средний

  // --- Дерево ---
  barkDark:     0x0a0806,   // тёмная кора
  barkMid:      0x1a1008,   // средняя

  // --- Свет ---
  gold:         0xffb060,   // тёплый свет фонаря
  goldLight:    0xffd890,   // яркий тёплый
  goldDeep:     0x8a5a20,   // тёмный тёплый

  // --- Кристаллы ---
  crystalDeep:  0x2a0f4a,   // база фиолет
  crystalMid:   0x6a2fcc,   // свечение
  crystalLight: 0x8a4acc,   // светлая лаванда
  crystalGlow:  0xb366ff,   // яркий
  crystalBlue:  0x3a6acc,   // синий

  // --- Вода ---
  waterDeep:    0x01040a,   // глубокая
  waterMid:     0x040c14,   // средняя
  waterShallow: 0x08141c,   // мелко
  waterBottom:  0x1a2a20,   // дно
  waterGold:    0xffb070,   // отражения

  // --- Частицы ---
  firefly:      0xffd8a0,   // золото светлячков
  fireflyCool:  0x6ad8ff,   // холодный светлячок
  spore:        0x7affc8,   // споры

  // --- Утилиты ---
  black:        0x000000,
  white:        0xffffff,
};

/* =========================================================
   ТЕКСТУРЫ — процедурные, генерируются при загрузке
   ========================================================= */

export const TEXTURES = {
  /* ==========================================================
     МОХ — неровная зелёная поверхность
     ========================================================== */
  moss() {
    const size = 512;
    const cv = document.createElement('canvas');
    cv.width = cv.height = size;
    const ctx = cv.getContext('2d');

    // База — ОЧЕНЬ тёмная зелень
    ctx.fillStyle = '#050a08';
    ctx.fillRect(0, 0, size, size);

    // Ворсинки мха — точки
    for (let i = 0; i < 25000; i++) {
      const x = Math.random() * size;
      const y = Math.random() * size;
      const r = 0.5 + Math.random() * 2.5;

      const b = Math.random();
      const g = 25 + b * 70;
      const rC = 8 + b * 25;
      const bC = 12 + b * 25;

      ctx.fillStyle = `rgba(${rC}, ${g}, ${bC}, ${0.35 + Math.random() * 0.5})`;
      ctx.beginPath();
      ctx.arc(x, y, r, 0, Math.PI * 2);
      ctx.fill();
    }

    // Тёмные пятна — глубина
    for (let i = 0; i < 100; i++) {
      const x = Math.random() * size;
      const y = Math.random() * size;
      const r = 20 + Math.random() * 60;

      const g = ctx.createRadialGradient(x, y, 0, x, y, r);
      g.addColorStop(0, 'rgba(0, 0, 0, 0.55)');
      g.addColorStop(1, 'rgba(0, 0, 0, 0)');

      ctx.fillStyle = g;
      ctx.fillRect(x - r, y - r, r * 2, r * 2);
    }

    // Светлые искры мха
    for (let i = 0; i < 3000; i++) {
      const x = Math.random() * size;
      const y = Math.random() * size;

      ctx.fillStyle = `rgba(${40 + Math.random() * 40}, ${80 + Math.random() * 60}, ${35 + Math.random() * 35}, ${0.15 + Math.random() * 0.25})`;
      ctx.fillRect(x, y, 1 + Math.random() * 2, 1 + Math.random() * 2);
    }

    const tex = new THREE.CanvasTexture(cv);
    tex.colorSpace = THREE.SRGBColorSpace;
    tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
    tex.anisotropy = 4;
    return tex;
  },

  /* ==========================================================
     МЯГКОЕ СВЕЧЕНИЕ (тёплое)
     ========================================================== */
  glow() {
    const size = 128;
    const cv = document.createElement('canvas');
    cv.width = cv.height = size;
    const ctx = cv.getContext('2d');

    const g = ctx.createRadialGradient(
      size / 2, size / 2, 0,
      size / 2, size / 2, size / 2
    );
    g.addColorStop(0.00, 'rgba(255, 240, 200, 1)');
    g.addColorStop(0.15, 'rgba(255, 210, 150, 0.75)');
    g.addColorStop(0.45, 'rgba(255, 160, 80, 0.25)');
    g.addColorStop(0.75, 'rgba(255, 140, 60, 0.08)');
    g.addColorStop(1.00, 'rgba(255, 120, 60, 0)');

    ctx.fillStyle = g;
    ctx.fillRect(0, 0, size, size);

    const tex = new THREE.CanvasTexture(cv);
    tex.colorSpace = THREE.SRGBColorSpace;
    return tex;
  },

  /* ==========================================================
     ФИОЛЕТОВОЕ СВЕЧЕНИЕ (для кристаллов)
     ========================================================== */
  glowPurple() {
    const size = 128;
    const cv = document.createElement('canvas');
    cv.width = cv.height = size;
    const ctx = cv.getContext('2d');

    const g = ctx.createRadialGradient(
      size / 2, size / 2, 0,
      size / 2, size / 2, size / 2
    );
    g.addColorStop(0.00, 'rgba(200, 140, 255, 1)');
    g.addColorStop(0.2, 'rgba(160, 100, 240, 0.55)');
    g.addColorStop(0.5, 'rgba(110, 70, 190, 0.15)');
    g.addColorStop(1.00, 'rgba(60, 30, 120, 0)');

    ctx.fillStyle = g;
    ctx.fillRect(0, 0, size, size);

    const tex = new THREE.CanvasTexture(cv);
    tex.colorSpace = THREE.SRGBColorSpace;
    return tex;
  },

  /* ==========================================================
     МАЛЕНЬКАЯ ТОЧКА (для частиц)
     ========================================================== */
  dot() {
    const size = 32;
    const cv = document.createElement('canvas');
    cv.width = cv.height = size;
    const ctx = cv.getContext('2d');

    const g = ctx.createRadialGradient(
      size / 2, size / 2, 0,
      size / 2, size / 2, size / 2
    );
    g.addColorStop(0.0, 'rgba(255, 255, 240, 1)');
    g.addColorStop(0.4, 'rgba(220, 255, 220, 0.35)');
    g.addColorStop(1.0, 'rgba(120, 200, 160, 0)');

    ctx.fillStyle = g;
    ctx.fillRect(0, 0, size, size);

    const tex = new THREE.CanvasTexture(cv);
    tex.colorSpace = THREE.SRGBColorSpace;
    return tex;
  },

  /* ==========================================================
     ЛИСТ — с формой и прожилками
     ========================================================== */
  leaf() {
    const size = 128;
    const cv = document.createElement('canvas');
    cv.width = cv.height = size;
    const ctx = cv.getContext('2d');

    // Форма листа — ТЁМНАЯ
    ctx.fillStyle = '#0a2a15';
    ctx.beginPath();
    ctx.moveTo(size / 2, 4);
    ctx.quadraticCurveTo(size * 0.95, size * 0.5, size / 2, size - 4);
    ctx.quadraticCurveTo(size * 0.05, size * 0.5, size / 2, 4);
    ctx.fill();

    // Центральная жилка
    ctx.strokeStyle = '#1a5a3a';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(size / 2, 6);
    ctx.lineTo(size / 2, size - 6);
    ctx.stroke();

    // Боковые жилки
    ctx.lineWidth = 1;
    for (let i = 1; i < 6; i++) {
      const y = (i / 6) * size;
      const w = (size * 0.3) * (1 - y / size);
      ctx.beginPath();
      ctx.moveTo(size / 2, y);
      ctx.lineTo(size / 2 + w, y - 6);
      ctx.moveTo(size / 2, y);
      ctx.lineTo(size / 2 - w, y - 6);
      ctx.stroke();
    }

    const tex = new THREE.CanvasTexture(cv);
    tex.colorSpace = THREE.SRGBColorSpace;
    return tex;
  },

  /* ==========================================================
     КОРА ДЕРЕВА — для стволов и веток
     ========================================================== */
  bark() {
    const size = 256;
    const cv = document.createElement('canvas');
    cv.width = cv.height = size;
    const ctx = cv.getContext('2d');

    // База — тёмное дерево
    ctx.fillStyle = '#0a0806';
    ctx.fillRect(0, 0, size, size);

    // Вертикальные трещины
    for (let i = 0; i < 60; i++) {
      const x = Math.random() * size;
      const w = 1 + Math.random() * 3;

      ctx.strokeStyle = `rgba(${30 + Math.random() * 20}, ${18 + Math.random() * 12}, ${8 + Math.random() * 8}, ${0.4 + Math.random() * 0.4})`;
      ctx.lineWidth = w;
      ctx.beginPath();
      ctx.moveTo(x, 0);
      for (let y = 0; y < size; y += 15) {
        ctx.lineTo(x + Math.sin(y * 0.1 + i) * 4, y);
      }
      ctx.stroke();
    }

    // Светлые пятна коры
    for (let i = 0; i < 200; i++) {
      const x = Math.random() * size;
      const y = Math.random() * size;
      const r = 2 + Math.random() * 5;

      ctx.fillStyle = `rgba(${40 + Math.random() * 20}, ${25 + Math.random() * 12}, ${15 + Math.random() * 8}, ${0.1 + Math.random() * 0.2})`;
      ctx.beginPath();
      ctx.arc(x, y, r, 0, Math.PI * 2);
      ctx.fill();
    }

    const tex = new THREE.CanvasTexture(cv);
    tex.colorSpace = THREE.SRGBColorSpace;
    tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
    return tex;
  },

  /* ==========================================================
     КАМЕНЬ — для крупных камней и сталактитов
     ========================================================== */
  rock() {
    const size = 256;
    const cv = document.createElement('canvas');
    cv.width = cv.height = size;
    const ctx = cv.getContext('2d');

    // База — тёмно-серо-синий
    ctx.fillStyle = '#0a0a14';
    ctx.fillRect(0, 0, size, size);

    // Шум — песчинки
    for (let i = 0; i < 15000; i++) {
      const x = Math.random() * size;
      const y = Math.random() * size;
      const r = 0.3 + Math.random() * 1.5;

      const b = Math.random();
      const v = 15 + b * 30;

      ctx.fillStyle = `rgba(${v}, ${v}, ${v + 5}, ${0.3 + Math.random() * 0.4})`;
      ctx.beginPath();
      ctx.arc(x, y, r, 0, Math.PI * 2);
      ctx.fill();
    }

    // Тёмные прожилки
    for (let i = 0; i < 40; i++) {
      const x = Math.random() * size;
      const y = Math.random() * size;
      const r = 15 + Math.random() * 40;

      const g = ctx.createRadialGradient(x, y, 0, x, y, r);
      g.addColorStop(0, 'rgba(0, 0, 0, 0.5)');
      g.addColorStop(1, 'rgba(0, 0, 0, 0)');

      ctx.fillStyle = g;
      ctx.fillRect(x - r, y - r, r * 2, r * 2);
    }

    const tex = new THREE.CanvasTexture(cv);
    tex.colorSpace = THREE.SRGBColorSpace;
    tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
    return tex;
  },
};

/* =========================================================
   МАТЕРИАЛЫ — единые для всей сцены
   ========================================================= */

export function createMaterials() {
  /* --- Создаём текстуры один раз --- */
  const mossTex = TEXTURES.moss();
  const glowTex = TEXTURES.glow();
  const glowPurpleTex = TEXTURES.glowPurple();
  const dotTex = TEXTURES.dot();
  const leafTex = TEXTURES.leaf();
  const barkTex = TEXTURES.bark();
  const rockTex = TEXTURES.rock();

  return {
    /* ==========================================================
       ТЕКСТУРЫ — для доступа извне
       ========================================================== */
    mossTex,
    glowTex,
    glowPurpleTex,
    dotTex,
    leafTex,
    barkTex,
    rockTex,

    /* ==========================================================
       ПОЛ — большой круг с мхом + bump
       ========================================================== */
    mossFloor: (() => {
      const m = new THREE.MeshStandardMaterial({
        color: 0x1a2a1a,
        map: mossTex.clone(),
        bumpMap: mossTex.clone(),
        bumpScale: 0.2,
        roughness: 1.0,
        metalness: 0.0,
        emissive: 0x1a3a1a,
        emissiveIntensity: 0.25,
      });
      m.map.repeat.set(20, 20);
      m.bumpMap.repeat.set(20, 20);
      m.map.needsUpdate = true;
      m.bumpMap.needsUpdate = true;
      return m;
    })(),

    /* ==========================================================
       МОХ на объектах (камни, деревья, лианы)
       ========================================================== */
    moss: (() => {
      const m = new THREE.MeshStandardMaterial({
        color: 0x0a1a10,
        map: mossTex.clone(),
        roughness: 0.95,
        emissive: 0x1a3a1a,
        emissiveIntensity: 0.3,
        flatShading: true,
      });
      m.map.repeat.set(2, 2);
      m.map.needsUpdate = true;
      return m;
    })(),

    /* ==========================================================
       КАМНИ — тёмные, с текстурой
       ========================================================== */
    rock: (() => {
      const m = new THREE.MeshStandardMaterial({
        color: 0x0a0a14,
        map: rockTex.clone(),
        roughness: 0.95,
        metalness: 0.05,
        flatShading: true,
        emissive: 0x05080a,
        emissiveIntensity: 0.1,
      });
      m.map.repeat.set(2, 2);
      m.map.needsUpdate = true;
      return m;
    })(),

    /* ==========================================================
       ДЕРЕВО — столбы, балки, корни
       ========================================================== */
    bark: (() => {
      const m = new THREE.MeshStandardMaterial({
        color: 0x0a0806,
        map: barkTex.clone(),
        roughness: 0.95,
        flatShading: true,
        emissive: 0x0a0604,
        emissiveIntensity: 0.05,
      });
      m.map.repeat.set(2, 3);
      m.map.needsUpdate = true;
      return m;
    })(),

    /* ==========================================================
       ЛИСТЬЯ — полупрозрачные, чуть светятся
       ========================================================== */
    leaf: (() => {
      return new THREE.MeshStandardMaterial({
        map: leafTex.clone(),
        color: 0x1a3a2a,
        emissive: 0x1a5a3a,
        emissiveIntensity: 0.5,
        side: THREE.DoubleSide,
        transparent: true,
        opacity: 0.92,
        alphaTest: 0.1,
        roughness: 0.85,
      });
    })(),

    /* ==========================================================
       ТЁМНЫЕ ЛИСТЬЯ — для размытых в foreground
       ==========================================================
       Важно: светлее и прозрачнее, чтобы НЕ закрывали сцену
       ========================================================== */
    leafDark: (() => {
      return new THREE.MeshBasicMaterial({
        map: leafTex.clone(),
        color: 0x1a2a1a,         // ← светлее (было 0x0a1a10)
        transparent: true,
        opacity: 0.45,            // ← прозрачнее (было 0.7)
        side: THREE.DoubleSide,
        depthWrite: false,
      });
    })(),

    /* ==========================================================
       СИЛУЭТ — чисто чёрный (для рамок кадра)
       ========================================================== */
    silhouette: new THREE.MeshBasicMaterial({
      color: 0x000000,
      transparent: true,
      opacity: 0.95,
    }),
  };
}