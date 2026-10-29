import * as THREE from 'three';
import { PALETTE } from './shared.js';

/* =========================================================
   PARTICLES — светлячки, пыль, glowworms, лишайники
   =========================================================
   ПЕРЕПИСАНО С НУЛЯ.

   Концепция (по референсу):
   - Светлячки — тёплые точки, летают по Lissajous
   - Пыль — мелкая, везде, медленно дрейфует
   - Glowworms — синие точки на потолке (как в NZ пещерах)
   - Лишайники — светящиеся точки на полу
   - Споры — мягкие, вокруг ягод в лианах

   Убрано:
   - Слишком много света от ягод
   - Пульсация всего подряд

   Оптимизация:
   - 4 Points = 4 draw call
   - Никаких PointLight
   ========================================================= */

export function createParticles(parent, materials, qualityLevel = 'high') {
  const group = new THREE.Group();
  parent.add(group);

  const isLow = qualityLevel === 'low';
  const isMedium = qualityLevel === 'medium';

  /* ==========================================================
     КОНФИГ
     ========================================================== */
  const q = {
    fireflies:  isLow ? 15 : isMedium ? 30 : 50,   // тёплые светлячки
    dust:       isLow ? 100 : isMedium ? 250 : 500, // пыль
    glowworms:  isLow ? 30 : isMedium ? 60 : 100,   // синие личинки на потолке
    lichens:    isLow ? 200 : isMedium ? 400 : 800, // лишайники на полу
  };

  /* ==========================================================
     ТЕКСТУРЫ
     ========================================================== */
  const glowTex = materials.glowTex;
  const dotTex = materials.dotTex;

  /* ==========================================================
     1. СВЕТЛЯЧКИ — Lissajous-траектории
     ==========================================================
     Тёплые золотые точки. Летают по сложным кривым.
     Много вокруг сцены, но не в кадре перед камерой.
     ========================================================== */
  const fireflyGeo = new THREE.BufferGeometry();
  const ffPos = new Float32Array(q.fireflies * 3);
  const ffCol = new Float32Array(q.fireflies * 3);
  const ffData = [];

  for (let i = 0; i < q.fireflies; i++) {
    // Базовая позиция
    // 60% — в глубине (z=-5..-15)
    // 40% — по всей сцене
    let baseX, baseY, baseZ;

    if (Math.random() < 0.6) {
      baseX = (Math.random() - 0.5) * 16;
      baseY = -3 + Math.random() * 8;
      baseZ = -15 + Math.random() * 10;
    } else {
      baseX = (Math.random() - 0.5) * 20;
      baseY = -3 + Math.random() * 10;
      baseZ = -5 + Math.random() * 15;
    }

    // Амплитуды
    const ampX = 0.4 + Math.random() * 1.2;
    const ampY = 0.3 + Math.random() * 0.8;
    const ampZ = 0.4 + Math.random() * 1.2;

    // Частоты — несоизмеримые
    const freqX = 0.3 + Math.random() * 0.7;
    const freqY = 0.5 + Math.random() * 0.9;
    const freqZ = 0.3 + Math.random() * 0.7;

    // Фазы
    const phaseX = Math.random() * Math.PI * 2;
    const phaseY = Math.random() * Math.PI * 2;
    const phaseZ = Math.random() * Math.PI * 2;

    const timeSpeed = 0.4 + Math.random() * 0.7;

    // Цвет — 75% тёплые, 25% холодные
    const isWarm = Math.random() < 0.75;
    ffCol[i * 3]     = isWarm ? 1.0 : 0.3;
    ffCol[i * 3 + 1] = isWarm ? 0.85 : 0.75;
    ffCol[i * 3 + 2] = isWarm ? 0.5 : 1.0;

    ffData.push({
      baseX, baseY, baseZ,
      ampX, ampY, ampZ,
      freqX, freqY, freqZ,
      phaseX, phaseY, phaseZ,
      timeSpeed,
      timeOffset: Math.random() * 100,
    });
  }

  fireflyGeo.setAttribute('position', new THREE.BufferAttribute(ffPos, 3));
  fireflyGeo.setAttribute('color', new THREE.BufferAttribute(ffCol, 3));

  const ffMat = new THREE.PointsMaterial({
    size: 0.12,
    map: glowTex,
    vertexColors: true,
    transparent: true,
    opacity: 0.9,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
    sizeAttenuation: true,
  });

  const fireflies = new THREE.Points(fireflyGeo, ffMat);
  group.add(fireflies);

  /* ==========================================================
     2. ПЫЛЬ — мелкая, дрейфует
     ==========================================================
     Тёплая, едва заметная. Плавает в воздухе.
     ========================================================== */
  const dustGeo = new THREE.BufferGeometry();
  const dustPos = new Float32Array(q.dust * 3);
  const dustData = [];

  for (let i = 0; i < q.dust; i++) {
    const x = (Math.random() - 0.5) * 24;
    const y = -5 + Math.random() * 14;
    const z = (Math.random() - 0.5) * 30;

    dustPos[i * 3]     = x;
    dustPos[i * 3 + 1] = y;
    dustPos[i * 3 + 2] = z;

    dustData.push({
      baseX: x,
      baseY: y,
      baseZ: z,
      phase: Math.random() * Math.PI * 2,
      driftSpeed: 0.05 + Math.random() * 0.15,
      driftRadius: 0.3 + Math.random() * 0.7,
    });
  }

  dustGeo.setAttribute('position', new THREE.BufferAttribute(dustPos, 3));

  const dustMat = new THREE.PointsMaterial({
    size: 0.04,
    map: dotTex,
    color: 0xffd0a0,
    transparent: true,
    opacity: 0.35,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
    sizeAttenuation: true,
  });

  const dust = new THREE.Points(dustGeo, dustMat);
  group.add(dust);

  /* ==========================================================
     3. GLOWWORMS — синие личинки на потолке
     ==========================================================
     Висят сверху, светятся холодным синим.
     Как в пещерах Новой Зеландии.
     ========================================================== */
  const wormGeo = new THREE.BufferGeometry();
  const wormPos = new Float32Array(q.glowworms * 3);
  const wormData = [];

  for (let i = 0; i < q.glowworms; i++) {
    // По потолку
    const x = (Math.random() - 0.5) * 26;
    const z = -20 + Math.random() * 28;
    const y = 9 + Math.random() * 3;

    wormPos[i * 3]     = x;
    wormPos[i * 3 + 1] = y;
    wormPos[i * 3 + 2] = z;

    wormData.push({
      baseY: y,
      phase: Math.random() * Math.PI * 2,
      blinkSpeed: 0.4 + Math.random() * 1.0,
    });
  }

  wormGeo.setAttribute('position', new THREE.BufferAttribute(wormPos, 3));

  const wormMat = new THREE.PointsMaterial({
    size: 0.08,
    map: glowTex,
    color: 0x4ac8ff,
    transparent: true,
    opacity: 0.85,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
    sizeAttenuation: true,
  });

  const glowworms = new THREE.Points(wormGeo, wormMat);
  group.add(glowworms);

  /* ==========================================================
     4. ЛИШАЙНИКИ — светящиеся точки на полу
     ==========================================================
     Мелкие, зелёные и циановые. На полу.
     ========================================================== */
  const lichGeo = new THREE.BufferGeometry();
  const lichPos = new Float32Array(q.lichens * 3);
  const lichCol = new Float32Array(q.lichens * 3);

  for (let i = 0; i < q.lichens; i++) {
    const angle = Math.random() * Math.PI * 2;
    const r = 1 + Math.random() * 20;

    lichPos[i * 3]     = Math.cos(angle) * r;
    lichPos[i * 3 + 1] = -5.48;
    lichPos[i * 3 + 2] = Math.sin(angle) * r;

    // 70% зелёные, 30% циан
    const isGreen = Math.random() < 0.7;
    lichCol[i * 3]     = isGreen ? 0.3 : 0.2;
    lichCol[i * 3 + 1] = isGreen ? 0.9 : 0.8;
    lichCol[i * 3 + 2] = isGreen ? 0.5 : 1.0;
  }

  lichGeo.setAttribute('position', new THREE.BufferAttribute(lichPos, 3));
  lichGeo.setAttribute('color', new THREE.BufferAttribute(lichCol, 3));

  const lichMat = new THREE.PointsMaterial({
    size: 0.07,
    map: dotTex,
    vertexColors: true,
    transparent: true,
    opacity: 0.65,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
    sizeAttenuation: true,
  });

  const lichens = new THREE.Points(lichGeo, lichMat);
  group.add(lichens);

  /* ==========================================================
     API
     ========================================================== */
  return {
    group,

    update(time) {
      // ============================================
      // СВЕТЛЯЧКИ на Lissajous-траекториях
      // ============================================
      const ffArr = fireflyGeo.attributes.position.array;

      for (let i = 0; i < q.fireflies; i++) {
        const d = ffData[i];
        const t = (time + d.timeOffset) * d.timeSpeed;

        ffArr[i * 3]     = d.baseX + Math.sin(t * d.freqX + d.phaseX) * d.ampX;
        ffArr[i * 3 + 1] = d.baseY + Math.sin(t * d.freqY + d.phaseY) * d.ampY;
        ffArr[i * 3 + 2] = d.baseZ + Math.sin(t * d.freqZ + d.phaseZ) * d.ampZ;
      }
      fireflyGeo.attributes.position.needsUpdate = true;

      // Лёгкое мерцание
      ffMat.opacity = 0.75 + Math.sin(time * 1.2) * 0.15;

      // ============================================
      // ПЫЛЬ — медленный дрейф
      // ============================================
      const dPos = dustGeo.attributes.position.array;
      for (let i = 0; i < q.dust; i++) {
        const d = dustData[i];
        dPos[i * 3]     = d.baseX + Math.sin(time * d.driftSpeed + d.phase) * d.driftRadius;
        dPos[i * 3 + 1] = d.baseY + Math.sin(time * d.driftSpeed * 0.6 + d.phase * 2) * d.driftRadius * 0.5;
        dPos[i * 3 + 2] = d.baseZ + Math.cos(time * d.driftSpeed * 0.8 + d.phase) * d.driftRadius;
      }
      dustGeo.attributes.position.needsUpdate = true;

      // ============================================
      // GLOWWORMS — мерцают
      // ============================================
      const wPos = wormGeo.attributes.position.array;
      for (let i = 0; i < q.glowworms; i++) {
        const d = wormData[i];
        wPos[i * 3 + 1] = d.baseY + Math.sin(time * 0.4 + d.phase) * 0.08;
      }
      wormGeo.attributes.position.needsUpdate = true;

      wormMat.opacity = 0.65 + Math.sin(time * 1.5) * 0.2;

      // ============================================
      // ЛИШАЙНИКИ — дышат
      // ============================================
      lichMat.opacity = 0.55 + Math.sin(time * 0.8) * 0.15;
    },

    dispose() {
      if (group.parent) group.parent.remove(group);
      fireflyGeo.dispose();
      ffMat.dispose();
      dustGeo.dispose();
      dustMat.dispose();
      wormGeo.dispose();
      wormMat.dispose();
      lichGeo.dispose();
      lichMat.dispose();
    },
  };
}