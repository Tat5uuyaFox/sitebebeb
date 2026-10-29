import * as THREE from 'three';
import { createCore } from '../objects/core.js';
import { createRings } from '../objects/rings.js';

/* =========================================================
   SCENE WORLD — «Ядро вселенной»
   =========================================================
   Структура:
   - Центральное ядро (гигантский пульсирующий кристалл)
   - Лучи энергии из ядра
   - 3 слоя осколков на орбитах
   - Спиральный поток искр
   - Туманности на фоне
   - Камера закручивается вокруг ядра
   ========================================================= */

// Камера: закручивается по спирали, приближаясь
const CAMERA_KEYS = [
  { t: 0.0, pos: { x: 0,  y: 2,  z: 28 }, look: { x: 0, y: 0, z: 0 } },
  { t: 0.35, pos: { x: 12, y: 4,  z: 16 }, look: { x: 0, y: 0, z: 0 } },
  { t: 0.7, pos: { x: -8, y: -3, z: 10 }, look: { x: 0, y: 0, z: 0 } },
  { t: 1.0, pos: { x: 0,  y: 1,  z: 6 },  look: { x: 0, y: 0, z: 0 } },
];

export function createSceneWorld({ scene, camera, postfx }) {
  const group = new THREE.Group();
  scene.add(group);

  /* ==========================================================
     1. ЯДРО
     ========================================================== */
  const core = createCore(group, {
    position: { x: 0, y: 0, z: 0 },
    radius: 2.2,
    color: 0xa866ee,
    accentColor: 0xff9ad4,
  });

  const rings = createRings(group, {
    radius: 3.5,
    color: 0xa866ee,
    accentColor: 0xff9ad4,
  });

  /* ==========================================================
     2. ТРИ СЛОЯ ОСКОЛКОВ НА ОРБИТАХ
     ========================================================== */
  const layers = [];

  const LAYER_CONFIGS = [
    {
      count: 40,
      radiusMin: 4.5,
      radiusMax: 6,
      sizeMin: 0.08,
      sizeMax: 0.2,
      color: 0xc99aff,
      emissive: 0xa866ee,
      orbitSpeed: 0.15,
      ySpread: 1.5,
    },
    {
      count: 60,
      radiusMin: 7,
      radiusMax: 9,
      sizeMin: 0.1,
      sizeMax: 0.28,
      color: 0xa866ee,
      emissive: 0x7a3fd4,
      orbitSpeed: -0.1,
      ySpread: 3,
    },
    {
      count: 30,
      radiusMin: 11,
      radiusMax: 14,
      sizeMin: 0.15,
      sizeMax: 0.4,
      color: 0xff9ad4,
      emissive: 0x9a4a7a,
      orbitSpeed: 0.06,
      ySpread: 5,
    },
  ];

  const shardGeometries = [
    new THREE.TetrahedronGeometry(1, 0),
    new THREE.OctahedronGeometry(1, 0),
    new THREE.IcosahedronGeometry(1, 0),
    new THREE.DodecahedronGeometry(1, 0),
  ];

  LAYER_CONFIGS.forEach((cfg, layerIdx) => {
    const layerGroup = new THREE.Group();
    group.add(layerGroup);

    const shards = [];
    for (let i = 0; i < cfg.count; i++) {
      const geo = shardGeometries[i % shardGeometries.length];

      const mat = new THREE.MeshStandardMaterial({
        color: cfg.color,
        emissive: cfg.emissive,
        emissiveIntensity: 0.4 + Math.random() * 0.3,
        roughness: 0.2,
        metalness: 0.85,
        flatShading: true,
      });

      const shard = new THREE.Mesh(geo, mat);

      const size = cfg.sizeMin + Math.random() * (cfg.sizeMax - cfg.sizeMin);
      shard.scale.setScalar(size);

      const angle = Math.random() * Math.PI * 2;
      const radius = cfg.radiusMin + Math.random() * (cfg.radiusMax - cfg.radiusMin);
      const y = (Math.random() - 0.5) * cfg.ySpread;

      shard.position.set(
        Math.cos(angle) * radius,
        y,
        Math.sin(angle) * radius
      );

      shard.rotation.set(
        Math.random() * Math.PI,
        Math.random() * Math.PI,
        Math.random() * Math.PI
      );

      shard.userData = {
        angle,
        radius,
        baseY: y,
        phase: Math.random() * Math.PI * 2,
        rotSpeed: {
          x: (Math.random() - 0.5) * 0.5,
          y: (Math.random() - 0.5) * 0.5,
          z: (Math.random() - 0.5) * 0.5,
        },
        baseEmissive: mat.emissiveIntensity,
      };

      layerGroup.add(shard);
      shards.push(shard);
    }

    layers.push({
      group: layerGroup,
      shards,
      config: cfg,
      rotationZ: 0,
    });
  });

  /* ==========================================================
     3. СПИРАЛЬНЫЙ ПОТОК ИСКР
     ==========================================================
     Частицы летят по спирали от ядра наружу.
     ========================================================== */
  const spiralCount = 500;
  const spiralGeo = new THREE.BufferGeometry();
  const spiralPositions = new Float32Array(spiralCount * 3);
  const spiralData = [];

  for (let i = 0; i < spiralCount; i++) {
    spiralData.push({
      // t: 0 у ядра, 1 на выходе
      t: Math.random(),
      angleOffset: Math.random() * Math.PI * 2,
      speed: 0.05 + Math.random() * 0.1,
      yOffset: (Math.random() - 0.5) * 2,
      radiusScale: 0.8 + Math.random() * 0.4,
    });
  }
  spiralGeo.setAttribute('position', new THREE.BufferAttribute(spiralPositions, 3));

  const spiralTex = (() => {
    const size = 32;
    const cv = document.createElement('canvas');
    cv.width = cv.height = size;
    const ctx = cv.getContext('2d');
    const g = ctx.createRadialGradient(size/2, size/2, 0, size/2, size/2, size/2);
    g.addColorStop(0, 'rgba(255, 240, 255, 1)');
    g.addColorStop(0.5, 'rgba(224, 200, 255, 0.5)');
    g.addColorStop(1, 'rgba(168, 102, 238, 0)');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, size, size);
    const tex = new THREE.CanvasTexture(cv);
    tex.colorSpace = THREE.SRGBColorSpace;
    return tex;
  })();

  const spiralMat = new THREE.PointsMaterial({
    size: 0.15,
    map: spiralTex,
    color: 0xe0c8ff,
    transparent: true,
    opacity: 0.9,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
    sizeAttenuation: true,
  });

  const spiralPoints = new THREE.Points(spiralGeo, spiralMat);
  group.add(spiralPoints);

  /* ==========================================================
     4. ТУМАННОСТИ — дальний фон
     ========================================================== */
  const nebulaTex = (() => {
    const size = 256;
    const cv = document.createElement('canvas');
    cv.width = cv.height = size;
    const ctx = cv.getContext('2d');
    const g = ctx.createRadialGradient(size/2, size/2, 0, size/2, size/2, size/2);
    g.addColorStop(0, 'rgba(168, 102, 238, 0.5)');
    g.addColorStop(0.5, 'rgba(122, 63, 212, 0.2)');
    g.addColorStop(1, 'rgba(74, 31, 138, 0)');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, size, size);
    const tex = new THREE.CanvasTexture(cv);
    tex.colorSpace = THREE.SRGBColorSpace;
    return tex;
  })();

  const nebulae = [];
  for (let i = 0; i < 5; i++) {
    const sprite = new THREE.Sprite(
      new THREE.SpriteMaterial({
        map: nebulaTex,
        transparent: true,
        opacity: 0.4,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
        color: i % 2 === 0 ? 0xa866ee : 0xff9ad4,
      })
    );
    sprite.position.set(
      (Math.random() - 0.5) * 60,
      (Math.random() - 0.5) * 40,
      -25 - Math.random() * 40
    );
    sprite.scale.set(50, 50, 1);
    group.add(sprite);
    nebulae.push(sprite);
  }

  /* ==========================================================
     5. ЗВЁЗДНАЯ ПЫЛЬ
     ========================================================== */
  const dustCount = 800;
  const dustPositions = new Float32Array(dustCount * 3);
  for (let i = 0; i < dustCount; i++) {
    const r = 15 + Math.random() * 30;
    const theta = Math.random() * Math.PI * 2;
    const phi = Math.acos(2 * Math.random() - 1);
    dustPositions[i * 3]     = r * Math.sin(phi) * Math.cos(theta);
    dustPositions[i * 3 + 1] = r * Math.sin(phi) * Math.sin(theta);
    dustPositions[i * 3 + 2] = r * Math.cos(phi);
  }
  const dustGeo = new THREE.BufferGeometry();
  dustGeo.setAttribute('position', new THREE.BufferAttribute(dustPositions, 3));
  const dustMat = new THREE.PointsMaterial({
    size: 0.1,
    color: 0xc99aff,
    transparent: true,
    opacity: 0.5,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
  });
  const dustPoints = new THREE.Points(dustGeo, dustMat);
  group.add(dustPoints);

  /* ==========================================================
     КРИВАЯ КАМЕРЫ
     ========================================================== */
  const posCurve = new THREE.CatmullRomCurve3(
    CAMERA_KEYS.map((k) => new THREE.Vector3(k.pos.x, k.pos.y, k.pos.z))
  );
  const lookCurve = new THREE.CatmullRomCurve3(
    CAMERA_KEYS.map((k) => new THREE.Vector3(k.look.x, k.look.y, k.look.z))
  );

  let smoothProgress = 0;
  let targetProgress = 0;

  return {
    group,
    name: 'world',

    setProgress(p) {
      targetProgress = Math.max(0, Math.min(1, p));
    },

    update(time, dt) {
      const lambda = 3.5;
      smoothProgress += (targetProgress - smoothProgress) * (1 - Math.exp(-lambda * dt));

      /* --- Камера --- */
      const pos = posCurve.getPoint(smoothProgress);
      const look = lookCurve.getPoint(smoothProgress);
      camera.position.copy(pos);
      camera.lookAt(look);

      // Небольшой крен камеры при движении по спирали
      camera.rotateZ(Math.sin(smoothProgress * Math.PI * 1.5) * 0.12);

      /* --- Ядро --- */
      core.update(time, dt);
      rings.update(time, dt);

      /* --- Слои осколков --- */
      layers.forEach((layer, idx) => {
        const cfg = layer.config;

        // Вращаем весь слой
        layer.group.rotation.y += cfg.orbitSpeed * dt;

        // Осколки крутятся сами
        layer.shards.forEach((s) => {
          const d = s.userData;
          s.rotation.x += d.rotSpeed.x * dt;
          s.rotation.y += d.rotSpeed.y * dt;
          s.rotation.z += d.rotSpeed.z * dt;

          // Лёгкое покачивание по Y
          s.position.y = d.baseY + Math.sin(time * 0.5 + d.phase) * 0.3;

          // Пульсация свечения
          const pulse = 0.7 + Math.sin(time * 1.2 + d.phase) * 0.3;
          s.material.emissiveIntensity = d.baseEmissive * pulse;
        });
      });

      /* --- Спиральный поток искр --- */
      const posArr = spiralGeo.attributes.position.array;
      spiralData.forEach((d, i) => {
        // Двигаем вдоль спирали
        d.t += d.speed * dt;
        if (d.t > 1) {
          d.t -= 1;
          d.angleOffset = Math.random() * Math.PI * 2;
        }

        // Радиус растёт от 2.5 до 18
        const radius = (2.5 + d.t * 16) * d.radiusScale;
        // Угол закручивается
        const angle = d.angleOffset + d.t * Math.PI * 6;

        posArr[i * 3]     = Math.cos(angle) * radius;
        posArr[i * 3 + 1] = d.yOffset + Math.sin(d.t * Math.PI) * 2;
        posArr[i * 3 + 2] = Math.sin(angle) * radius;
      });
      spiralGeo.attributes.position.needsUpdate = true;

      /* --- Туманности --- */
      nebulae.forEach((n, i) => {
        n.material.opacity = 0.3 + Math.sin(time * 0.4 + i) * 0.15;
      });

      /* --- Пыль --- */
      dustPoints.rotation.y = time * 0.03;

      /* --- Bloom --- */
      if (postfx) {
        postfx.setBloom({ strength: 0.75 });
      }
    },

    dispose() {
      core.dispose();
      rings.dispose();
      layers.forEach((layer) => {
        layer.shards.forEach((s) => s.material.dispose());
      });
      shardGeometries.forEach((g) => g.dispose());

      spiralGeo.dispose();
      spiralMat.dispose();
      spiralTex.dispose();

      nebulae.forEach((n) => n.material.dispose());
      nebulaTex.dispose();

      dustGeo.dispose();
      dustMat.dispose();

      scene.remove(group);
    },
  };
}