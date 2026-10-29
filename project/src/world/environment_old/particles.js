import * as THREE from 'three';
import { PALETTE, TEXTURES } from './shared.js';

/* =========================================================
   PARTICLES — светлячки, пыль, glowworms, лишайники
   =========================================================
   Всё то, что создаёт атмосферу и не видно в каждом кадре,
   но без чего картинка мёртвая.
   ========================================================= */
export function createParticles(parent, materials) {
  const group = new THREE.Group();
  parent.add(group);

  const glowTex = TEXTURES.glow();
  const dotTex  = TEXTURES.dot();

  /* ==========================================================
     1. СВЕТЛЯЧКИ — 80 штук, тёплые и холодные
     ========================================================== */
  const ffCount = 80;
  const ffGeo = new THREE.BufferGeometry();
  const ffPos = new Float32Array(ffCount * 3);
  const ffCol = new Float32Array(ffCount * 3);
  const ffData = [];

  for (let i = 0; i < ffCount; i++) {
    const a = Math.random() * Math.PI * 2;
    const r = 2 + Math.random() * 12;
    const y = -3 + Math.random() * 10;
    ffPos[i * 3]     = Math.cos(a) * r;
    ffPos[i * 3 + 1] = y;
    ffPos[i * 3 + 2] = Math.sin(a) * r;

    const warm = Math.random() < 0.7;
    ffCol[i * 3]     = warm ? 1.0 : 0.3;
    ffCol[i * 3 + 1] = warm ? 0.85 : 0.8;
    ffCol[i * 3 + 2] = warm ? 0.55 : 1.0;

    ffData.push({
      baseX: ffPos[i * 3],
      baseY: y,
      baseZ: ffPos[i * 3 + 2],
      phase: Math.random() * Math.PI * 2,
      driftSpeed: 0.15 + Math.random() * 0.35,
      driftRadius: 0.4 + Math.random() * 0.8,
      blinkSpeed: 0.5 + Math.random() * 1.5,
    });
  }
  ffGeo.setAttribute('position', new THREE.BufferAttribute(ffPos, 3));
  ffGeo.setAttribute('color', new THREE.BufferAttribute(ffCol, 3));

  const ffMat = new THREE.PointsMaterial({
    size: 0.22,
    map: glowTex,
    vertexColors: true,
    transparent: true,
    opacity: 0.9,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
    sizeAttenuation: true,
  });
  const fireflies = new THREE.Points(ffGeo, ffMat);
  group.add(fireflies);

  /* ==========================================================
     2. ПАРЯЩАЯ ПЫЛЬ — 500 штук
     ========================================================== */
  const dustCount = 500;
  const dustGeo = new THREE.BufferGeometry();
  const dustPos = new Float32Array(dustCount * 3);
  const dustData = [];

  for (let i = 0; i < dustCount; i++) {
    const a = Math.random() * Math.PI * 2;
    const r = 1 + Math.random() * 14;
    const y = -4 + Math.random() * 14;
    dustPos[i * 3]     = Math.cos(a) * r;
    dustPos[i * 3 + 1] = y;
    dustPos[i * 3 + 2] = Math.sin(a) * r;

    dustData.push({
      baseY: y,
      phase: Math.random() * Math.PI * 2,
      speed: 0.1 + Math.random() * 0.3,
    });
  }
  dustGeo.setAttribute('position', new THREE.BufferAttribute(dustPos, 3));

  const dustMat = new THREE.PointsMaterial({
    size: 0.05,
    map: dotTex,
    color: PALETTE.glow,
    transparent: true,
    opacity: 0.4,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
    sizeAttenuation: true,
  });
  const dust = new THREE.Points(dustGeo, dustMat);
  group.add(dust);

  /* ==========================================================
     3. GLOWWORMS — светящиеся личинки на потолке
     ==========================================================
     В реальности новозеландские светлячки в пещерах
     выглядят именно так — синие точки на потолке.
     Живут 1 день. Светятся чтобы привлечь еду.
     У нас — просто для красоты.
     ========================================================== */
  const wormCount = 120;
  const wormGeo = new THREE.BufferGeometry();
  const wormPos = new Float32Array(wormCount * 3);
  const wormData = [];

  for (let i = 0; i < wormCount; i++) {
    const a = Math.random() * Math.PI * 2;
    const r = 2 + Math.random() * 16;
    const x = Math.cos(a) * r;
    const z = Math.sin(a) * r;
    const y = 8 + Math.random() * 3;

    wormPos[i * 3]     = x;
    wormPos[i * 3 + 1] = y;
    wormPos[i * 3 + 2] = z;

    wormData.push({
      baseY: y,
      phase: Math.random() * Math.PI * 2,
      blinkSpeed: 0.8 + Math.random() * 1.5,
    });
  }
  wormGeo.setAttribute('position', new THREE.BufferAttribute(wormPos, 3));

  const wormMat = new THREE.PointsMaterial({
    size: 0.14,
    map: glowTex,
    color: 0x4ac8ff,
    transparent: true,
    opacity: 0.9,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
    sizeAttenuation: true,
  });
  const glowworms = new THREE.Points(wormGeo, wormMat);
  group.add(glowworms);

  /* ==========================================================
     4. ЛИШАЙНИКИ — 800 светящихся точек на полу
     ========================================================== */
  const lichCount = 800;
  const lichGeo = new THREE.BufferGeometry();
  const lichPos = new Float32Array(lichCount * 3);
  const lichCol = new Float32Array(lichCount * 3);

  for (let i = 0; i < lichCount; i++) {
    const a = Math.random() * Math.PI * 2;
    const r = 1 + Math.random() * 16;
    lichPos[i * 3]     = Math.cos(a) * r;
    lichPos[i * 3 + 1] = -5.48;
    lichPos[i * 3 + 2] = Math.sin(a) * r;

    const green = Math.random() < 0.7;
    lichCol[i * 3]     = 0.3;
    lichCol[i * 3 + 1] = green ? 0.9 : 0.8;
    lichCol[i * 3 + 2] = green ? 0.5 : 1.0;
  }
  lichGeo.setAttribute('position', new THREE.BufferAttribute(lichPos, 3));
  lichGeo.setAttribute('color', new THREE.BufferAttribute(lichCol, 3));

  const lichMat = new THREE.PointsMaterial({
    size: 0.08,
    map: dotTex,
    vertexColors: true,
    transparent: true,
    opacity: 0.75,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
    sizeAttenuation: true,
  });
  const lichens = new THREE.Points(lichGeo, lichMat);
  group.add(lichens);

  return {
    group,
    update(time) {
      // Светлячки летают по кругу и мигают
      const fp = ffGeo.attributes.position.array;
      for (let i = 0; i < ffCount; i++) {
        const d = ffData[i];
        fp[i * 3]     = d.baseX + Math.sin(time * d.driftSpeed + d.phase) * d.driftRadius;
        fp[i * 3 + 1] = d.baseY + Math.sin(time * d.driftSpeed * 0.8 + d.phase * 2) * d.driftRadius * 0.7;
        fp[i * 3 + 2] = d.baseZ + Math.cos(time * d.driftSpeed * 0.9 + d.phase) * d.driftRadius;
      }
      ffGeo.attributes.position.needsUpdate = true;
      ffMat.opacity = 0.75 + Math.sin(time * 1.2) * 0.15;

      // Пыль медленно парит
      const dp = dustGeo.attributes.position.array;
      for (let i = 0; i < dustCount; i++) {
        const d = dustData[i];
        dp[i * 3 + 1] = d.baseY + Math.sin(time * d.speed + d.phase) * 0.4;
      }
      dustGeo.attributes.position.needsUpdate = true;

      // Glowworms мерцают
      const wp = wormGeo.attributes.position.array;
      for (let i = 0; i < wormCount; i++) {
        const d = wormData[i];
        wp[i * 3 + 1] = d.baseY + Math.sin(time * 0.5 + d.phase) * 0.05;
      }
      wormGeo.attributes.position.needsUpdate = true;
      wormMat.opacity = 0.7 + Math.sin(time * 1.5) * 0.2;

      // Лишайники дышат
      lichMat.opacity = 0.6 + Math.sin(time * 0.8) * 0.15;
    },
    dispose() {
      if (group.parent) group.parent.remove(group);
      glowTex.dispose();
      dotTex.dispose();
      ffGeo.dispose(); ffMat.dispose();
      dustGeo.dispose(); dustMat.dispose();
      wormGeo.dispose(); wormMat.dispose();
      lichGeo.dispose(); lichMat.dispose();
    },
  };
}