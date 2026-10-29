import * as THREE from 'three';
import { PALETTE } from './shared.js';

/* =========================================================
   DEPTH — фиолетовые кристаллы в глубине пещеры
   =========================================================
   ПЕРЕПИСАНО С НУЛЯ.

   Концепция (по референсу):
   - Кристаллы ТОЛЬКО в глубине (z < -14)
   - Друзы — группы по 4-8 кристаллов
   - Свечение приглушённое, не кислотное
   - Мягкое фиолетовое облако вдали
   - Прогресс раскрывает кристаллы постепенно
   - НЕ видны на переднем плане
   - Маленькие кристаллы на стенах вокруг

   Технически:
   - OctahedronGeometry растянутый по Y
   - 3 материала (фиолет/лаванда/синий)
   - InstancedMesh для мелких
   - Мягкий свет от нескольких точек
   ========================================================= */

export function createDepth(parent, materials, qualityLevel = 'high') {
  const group = new THREE.Group();
  parent.add(group);

  const isLow = qualityLevel === 'low';
  const isMedium = qualityLevel === 'medium';

  /* ==========================================================
     КОНФИГ
     ========================================================== */
  const q = {
    druzes:        isLow ? 4  : isMedium ? 6 : 8,
    smallCrystals: isLow ? 14 : isMedium ? 24 : 36,
  };

  /* ==========================================================
     МАТЕРИАЛЫ КРИСТАЛЛОВ
     ==========================================================
     Три оттенка:
     - Фиолетовый (основной)
     - Лаванда (светлый)
     - Синий (редкий)
     ========================================================== */

  const matPurple = new THREE.MeshStandardMaterial({
    color: 0x2a0f4a,
    emissive: 0x6a2fcc,
    emissiveIntensity: 0.9,
    roughness: 0.15,
    metalness: 0.5,
    flatShading: true,
    transparent: true,
    opacity: 0.92,
  });

  const matLavender = new THREE.MeshStandardMaterial({
    color: 0x3a1a5a,
    emissive: 0x8a4acc,
    emissiveIntensity: 1.0,
    roughness: 0.1,
    metalness: 0.4,
    flatShading: true,
    transparent: true,
    opacity: 0.92,
  });

  const matBlue = new THREE.MeshStandardMaterial({
    color: 0x0a1a3a,
    emissive: 0x3a6acc,
    emissiveIntensity: 0.8,
    roughness: 0.2,
    metalness: 0.5,
    flatShading: true,
    transparent: true,
    opacity: 0.92,
  });

  const crystalMats = [matPurple, matLavender, matBlue];

  /* ==========================================================
     ГЕОМЕТРИЯ КРИСТАЛЛА
     ==========================================================
     Octahedron, растянутый по Y.
     ========================================================== */
  function makeCrystalGeo(radius, height) {
    const geo = new THREE.OctahedronGeometry(radius, 0);
    const pos = geo.attributes.position.array;
    for (let i = 0; i < pos.length; i += 3) {
      pos[i + 1] *= height / radius;
    }
    geo.computeVertexNormals();
    return geo;
  }

  /* ==========================================================
     ДРУЗЫ — группы кристаллов
     ==========================================================
     Каждая друза = 1 большой + 4-7 мелких вокруг.
     ========================================================== */

  const druzes = [];

  // Зоны размещения — все в глубине (z < -14)
  const zones = [
    // Гигантские — далеко
    { zMin: -24, zMax: -21, scaleMin: 2.7, scaleMax: 3.5, weight: 0.55, xRange: 8 },
    // Крупные
    { zMin: -21, zMax: -18, scaleMin: 1.6, scaleMax: 2.2, weight: 0.35, xRange: 10 },
    // Средние — переходные
    { zMin: -18, zMax: -15, scaleMin: 1.0, scaleMax: 1.5, weight: 0.15, xRange: 12 },
  ];

  function pickZone() {
    const r = Math.random();
    let acc = 0;
    for (const z of zones) {
      acc += z.weight;
      if (r < acc) return z;
    }
    return zones[zones.length - 1];
  }

  for (let i = 0; i < q.druzes; i++) {
    const zone = pickZone();

    const z = zone.zMin + Math.random() * (zone.zMax - zone.zMin);
    const side = Math.random() < 0.5 ? -1 : 1;
    const x = side * (3.2 + Math.random() * (zone.xRange * 0.5 - 3.2));
    const baseScale = zone.scaleMin + Math.random() * (zone.scaleMax - zone.scaleMin);

    const druzeGroup = new THREE.Group();
    druzeGroup.position.set(x, -5.5, z);
    druzeGroup.rotation.y = Math.random() * Math.PI * 2;
    group.add(druzeGroup);

    /* --- Основной кристалл --- */
    const mainRadius = 0.15 * baseScale;
    const mainHeight = 2.5 * baseScale;

    const mainGeo = makeCrystalGeo(mainRadius, mainHeight);
    const mainMat = crystalMats[Math.floor(Math.random() * crystalMats.length)];

    const mainCrystal = new THREE.Mesh(mainGeo, mainMat);
    mainCrystal.position.y = mainHeight / 2;
    mainCrystal.rotation.z = (Math.random() - 0.5) * 0.2;
    mainCrystal.rotation.x = (Math.random() - 0.5) * 0.2;
    mainCrystal.castShadow = true;
    druzeGroup.add(mainCrystal);

    /* --- Кристаллы-спутники (4-7 штук) --- */
    const satelliteCount = 4 + Math.floor(Math.random() * 4);

    for (let s = 0; s < satelliteCount; s++) {
      const sScale = baseScale * (0.3 + Math.random() * 0.5);
      const sRadius = 0.3 * sScale;
      const sHeight = 1.9 * sScale;

      const satGeo = makeCrystalGeo(sRadius, sHeight);
      const satMat = crystalMats[Math.floor(Math.random() * crystalMats.length)];

      const satellite = new THREE.Mesh(satGeo, satMat);

      const angle = Math.random() * Math.PI * 2;
      const dist = mainRadius * (1.4 + Math.random() * 1.8);

      satellite.position.set(
        Math.cos(angle) * dist,
        sHeight / 2,
        Math.sin(angle) * dist
      );
      satellite.rotation.set(
        (Math.random() - 0.5) * 0.4,
        Math.random() * Math.PI,
        (Math.random() - 0.5) * 0.4
      );
      satellite.castShadow = true;
      druzeGroup.add(satellite);
    }

    /* --- Свет от друзы — приглушённый --- */
    const lightIntensity = 0.6 * baseScale;
    const light = new THREE.PointLight(
      PALETTE.crystalLight,
      lightIntensity,
      5 * baseScale,
      2
    );
    light.position.y = mainHeight * 0.6;
    druzeGroup.add(light);

    /* --- Ореол — мягкий --- */
    const halo = new THREE.Sprite(
      new THREE.SpriteMaterial({
        map: materials.glowPurpleTex,
        color: PALETTE.crystalGlow,
        transparent: true,
        opacity: 0.25,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
      })
    );
    halo.scale.setScalar(2.5 * baseScale);
    halo.position.y = mainHeight * 0.5;
    druzeGroup.add(halo);

    druzes.push({
      group: druzeGroup,
      mainCrystal,
      mainMat,
      light,
      halo,
      baseLightIntensity: lightIntensity,
      baseHaloOpacity: 0.25,
      phase: Math.random() * Math.PI * 2,
      pulseSpeed: 0.3 + Math.random() * 0.4,
      scale: baseScale,
    });
  }

  /* ==========================================================
     МЕЛКИЕ КРИСТАЛЛЫ НА ПОЛУ
     ==========================================================
     InstancedMesh — 50 штук одним вызовом.
     ========================================================== */
  const smallGeo = makeCrystalGeo(0.15, 0.9);

  const smallCrystals = new THREE.InstancedMesh(
    smallGeo,
    matPurple,
    q.smallCrystals
  );

  const matrix = new THREE.Matrix4();
  const quat = new THREE.Quaternion();
  const pos = new THREE.Vector3();
  const scl = new THREE.Vector3();

  for (let i = 0; i < q.smallCrystals; i++) {
    const side = Math.random() < 0.5 ? -1 : 1;
    const x = side * (2.8 + Math.random() * 6.5);
    const z = -12 - Math.random() * 12;

    const size = 0.55 + Math.random() * 0.9;

    pos.set(x, -5.5 + size * 0.3, z);

    quat.setFromEuler(new THREE.Euler(
      (Math.random() - 0.5) * 0.4,
      Math.random() * Math.PI * 2,
      (Math.random() - 0.5) * 0.4
    ));

    scl.set(size, size * (0.8 + Math.random() * 0.5), size);

    matrix.compose(pos, quat, scl);
    smallCrystals.setMatrixAt(i, matrix);
  }
  smallCrystals.instanceMatrix.needsUpdate = true;
  smallCrystals.castShadow = true;
  group.add(smallCrystals);

  /* ==========================================================
     ОБЩЕЕ СВЕЧЕНИЕ В ГЛУБИНЕ
     ==========================================================
     Большие источники — создают фиолетовое облако вдали.
     ========================================================== */
  const glow1 = new THREE.PointLight(PALETTE.crystalLight, 2.5, 30, 2);
  glow1.position.set(-4, -2, -24);
  group.add(glow1);

  const glow2 = new THREE.PointLight(PALETTE.crystalGlow, 1.8, 25, 2);
  glow2.position.set(5, -3, -26);
  group.add(glow2);

  const glow3 = new THREE.PointLight(PALETTE.crystalMid, 1.5, 20, 2);
  glow3.position.set(0, -1, -22);
  group.add(glow3);

  /* ==========================================================
     СВЕЧЕНИЕ НА ЗАДНЕЙ СТЕНЕ
     ==========================================================
     Плоскости с аддитивным свечением — имитация отражений.
     ========================================================== */
  const wallGlowCount = isLow ? 2 : isMedium ? 3 : 5;

  for (let i = 0; i < wallGlowCount; i++) {
    const x = (Math.random() - 0.5) * 20;
    const y = -3 + Math.random() * 8;
    const z = -21 - Math.random() * 2;

    const size = 3 + Math.random() * 4;

    const glowMat = new THREE.MeshBasicMaterial({
      map: materials.glowPurpleTex,
      color: PALETTE.crystalGlow,
      transparent: true,
      opacity: 0.2,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
      side: THREE.DoubleSide,
    });

    const glow = new THREE.Mesh(
      new THREE.PlaneGeometry(size, size),
      glowMat
    );
    glow.position.set(x, y, z);
    glow.lookAt(0, y, 0);
    group.add(glow);
  }

  /* ==========================================================
     ПРОГРЕСС
     ========================================================== */
  let currentProgress = 0;
  let targetProgress = 0;

  /* ==========================================================
     API
     ========================================================== */
  return {
    group,

    setProgress(p) {
      targetProgress = Math.max(0, Math.min(1, p));
    },

    update(time, dt) {
      // Сглаживаем
      currentProgress += (targetProgress - currentProgress) * (1 - Math.exp(-3 * dt));

      // Видимость — 30% в начале, 100% в конце
      const visibility = 0.3 + currentProgress * 0.7;

      // Пульсация друзов
      druzes.forEach((d) => {
        const pulse = 0.75 + Math.sin(time * d.pulseSpeed + d.phase) * 0.25;

        d.light.intensity = d.baseLightIntensity * pulse * visibility;
        d.halo.material.opacity = d.baseHaloOpacity * pulse * visibility;
      });

      // Общее свечение
      const deepPulse = 0.85 + Math.sin(time * 0.4) * 0.15;
      glow1.intensity = 2.5 * deepPulse * visibility;
      glow2.intensity = 1.8 * deepPulse * visibility;
      glow3.intensity = 1.5 * deepPulse * visibility;
    },

    dispose() {
      if (group.parent) group.parent.remove(group);

      matPurple.dispose();
      matLavender.dispose();
      matBlue.dispose();

      group.traverse((o) => {
        if (o.geometry) o.geometry.dispose();
        if (o.material &&
            !crystalMats.includes(o.material) &&
            o.material !== materials.glowPurpleTex) {
          if (Array.isArray(o.material)) o.material.forEach((m) => m.dispose());
          else o.material.dispose();
        }
      });
      smallGeo.dispose();
    },
  };
}
