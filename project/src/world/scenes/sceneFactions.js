import * as THREE from 'three';
import { createMonolith } from '../objects/monolith.js';
import { createTribunes } from '../objects/tribunes.js';

/* =========================================================
   SCENE FACTIONS — «Зал Совета»
   =========================================================
   - 7 монолитов в кольце
   - Светящиеся нити между их вершинами (энергосеть)
   - Тёмный глянцевый пол с отражениями
   - Парящие осколки
   - Звёздная пыль
   ========================================================= */

const CAMERA_KEYS = [
  { t: 0.0, pos: { x: -9, y: 3,  z: 9 },  look: { x: 0, y: 1.5, z: 0 } },
  { t: 0.5, pos: { x: 0,  y: 5,  z: 11 }, look: { x: 0, y: 1.5, z: 0 } },
  { t: 1.0, pos: { x: 9,  y: -1, z: 9 },  look: { x: 0, y: 1.5, z: 0 } },
];

export function createSceneFactions({ scene, camera, postfx }) {
  const group = new THREE.Group();
  scene.add(group);

  const MONOLITH_COUNT = 7;
  const RING_RADIUS = 5.5;

  /* ==========================================================
     1. МОНОЛИТЫ
     ========================================================== */
  const monoliths = [];
  for (let i = 0; i < MONOLITH_COUNT; i++) {
    const angle = (i / MONOLITH_COUNT) * Math.PI * 2;

    const m = createMonolith(group, {
      position: {
        x: Math.cos(angle) * RING_RADIUS,
        y: -1.5,
        z: Math.sin(angle) * RING_RADIUS,
      },
      height: 5.5 + Math.random() * 2.5,
      width: 0.85 + Math.random() * 0.35,
      tilt: (Math.random() - 0.5) * 0.12,
      color: 0x7a3fd4,
      accentColor: 0xc99aff,
      seed: i * 1.7,
    });
    monoliths.push(m);
  }
  /*===========================================================
   1.1 Трибуны
    =========================================================== */
    const tribunes = createTribunes(group, {
      count: 5,
      radius: 9,
      baseY: -1.5,
      height: 1.2,
      color: 0xa866ee,
    });

  /* ==========================================================
     2. ЭНЕРГОСЕТЬ — светящиеся нити между вершинами
     ========================================================== */
  const connections = [];
  const connectionGroup = new THREE.Group();
  group.add(connectionGroup);

  // Соединяем каждый монолит с двумя соседями
  for (let i = 0; i < MONOLITH_COUNT; i++) {
    const next = (i + 1) % MONOLITH_COUNT;
    const a = monoliths[i];
    const b = monoliths[next];

    // Формируем кривую через промежуточную точку
    const mid = new THREE.Vector3()
      .addVectors(a.tipPosition, b.tipPosition)
      .multiplyScalar(0.5);
    // Поднимаем середину — нити провисают дугой (или наоборот вверх)
    mid.y += 1.2;

    const curve = new THREE.CatmullRomCurve3([
      a.tipPosition.clone(),
      mid,
      b.tipPosition.clone(),
    ]);

    const points = curve.getPoints(32);

    // Линия
    const geo = new THREE.BufferGeometry().setFromPoints(points);
    const mat = new THREE.LineBasicMaterial({
      color: 0xa866ee,
      transparent: true,
      opacity: 0.35,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });
    const line = new THREE.Line(geo, mat);
    connectionGroup.add(line);

    // Тонкий «луч» поверх — для свечения через bloom
    const glowMat = new THREE.LineBasicMaterial({
      color: 0xe0c8ff,
      transparent: true,
      opacity: 0.7,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });
    const glowLine = new THREE.Line(geo.clone(), glowMat);
    connectionGroup.add(glowLine);

    connections.push({
      line, glowLine, curve, points,
      phase: Math.random() * Math.PI * 2,
    });
  }

  /* ==========================================================
     3. БЕГУЩИЕ ИСКРЫ ПО НИТЯМ
     ========================================================== */
  const sparkCount = 3 * MONOLITH_COUNT;   // по 3 искры на нить
  const sparkGeo = new THREE.BufferGeometry();
  const sparkPositions = new Float32Array(sparkCount * 3);
  const sparks = [];

  for (let i = 0; i < sparkCount; i++) {
    const connIdx = Math.floor(i / 3);
    const speed = 0.15 + Math.random() * 0.25;
    sparks.push({
      connIdx,
      t: Math.random(),
      speed,
    });
  }
  sparkGeo.setAttribute('position', new THREE.BufferAttribute(sparkPositions, 3));

  const sparkTex = (() => {
    const size = 32;
    const cv = document.createElement('canvas');
    cv.width = cv.height = size;
    const ctx = cv.getContext('2d');
    const g = ctx.createRadialGradient(size/2, size/2, 0, size/2, size/2, size/2);
    g.addColorStop(0, 'rgba(255, 240, 255, 1)');
    g.addColorStop(0.4, 'rgba(224, 200, 255, 0.6)');
    g.addColorStop(1, 'rgba(168, 102, 238, 0)');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, size, size);
    const tex = new THREE.CanvasTexture(cv);
    tex.colorSpace = THREE.SRGBColorSpace;
    return tex;
  })();

  const sparkMat = new THREE.PointsMaterial({
    size: 0.3,
    map: sparkTex,
    color: 0xe0c8ff,
    transparent: true,
    opacity: 0.95,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
    sizeAttenuation: true,
  });
  const sparkPoints = new THREE.Points(sparkGeo, sparkMat);
  group.add(sparkPoints);

  /* ==========================================================
     4. ПОЛ — тёмная отражающая плоскость
     ========================================================== */
  const floorGeo = new THREE.CircleGeometry(18, 64);
  const floorMat = new THREE.MeshStandardMaterial({
    color: 0x0a0418,
    roughness: 0.25,
    metalness: 0.9,
    transparent: true,
    opacity: 0.85,
  });
  const floor = new THREE.Mesh(floorGeo, floorMat);
  floor.rotation.x = -Math.PI / 2;
  floor.position.y = -1.5;
  floor.receiveShadow = true;
  group.add(floor);

  // Светящиеся концентрические круги на полу — «магия»
  const ringShapes = [];
  for (let i = 0; i < 4; i++) {
    const r = 2 + i * 2.5;
    const ringGeo = new THREE.RingGeometry(r - 0.015, r + 0.015, 96);
    const ringMat = new THREE.MeshBasicMaterial({
      color: 0xa866ee,
      transparent: true,
      opacity: 0.25 - i * 0.05,
      blending: THREE.AdditiveBlending,
      side: THREE.DoubleSide,
      depthWrite: false,
    });
    const ring = new THREE.Mesh(ringGeo, ringMat);
    ring.rotation.x = -Math.PI / 2;
    ring.position.y = -1.48;
    group.add(ring);
    ringShapes.push({ mesh: ring, baseOpacity: 0.25 - i * 0.05, speed: 0.4 + i * 0.2 });
  }

  /* ==========================================================
     5. ПАРЯЩИЕ ОСКОЛКИ ВОКРУГ
     ========================================================== */
  const floatingShards = [];
  const shardGeos = [
    new THREE.TetrahedronGeometry(0.1, 0),
    new THREE.OctahedronGeometry(0.12, 0),
    new THREE.IcosahedronGeometry(0.08, 0),
  ];

  for (let i = 0; i < 40; i++) {
    const geo = shardGeos[i % shardGeos.length];
    const mat = new THREE.MeshStandardMaterial({
      color: 0x2a1252,
      emissive: 0x7a3fd4,
      emissiveIntensity: 0.4,
      roughness: 0.2,
      metalness: 0.8,
      flatShading: true,
    });
    const shard = new THREE.Mesh(geo, mat);

    const angle = Math.random() * Math.PI * 2;
    const r = 2 + Math.random() * 10;
    const y = -1 + Math.random() * 5;

    shard.position.set(
      Math.cos(angle) * r,
      y,
      Math.sin(angle) * r
    );
    shard.scale.setScalar(0.5 + Math.random() * 1.5);

    shard.userData = {
      angle,
      radius: r,
      baseY: y,
      phase: Math.random() * Math.PI * 2,
      orbitSpeed: (Math.random() * 0.2 + 0.05) * (Math.random() < 0.5 ? -1 : 1),
      rotSpeed: {
        x: (Math.random() - 0.5) * 0.5,
        y: (Math.random() - 0.5) * 0.5,
        z: (Math.random() - 0.5) * 0.5,
      },
    };

    group.add(shard);
    floatingShards.push(shard);
  }

  /* ==========================================================
     6. ЗВЁЗДНАЯ ПЫЛЬ
     ========================================================== */
  const dustCount = 600;
  const dustPositions = new Float32Array(dustCount * 3);
  for (let i = 0; i < dustCount; i++) {
    const r = 6 + Math.random() * 20;
    const theta = Math.random() * Math.PI * 2;
    const phi = Math.acos(2 * Math.random() - 1);
    dustPositions[i * 3]     = r * Math.sin(phi) * Math.cos(theta);
    dustPositions[i * 3 + 1] = r * Math.sin(phi) * Math.sin(theta) * 0.5 + 2;
    dustPositions[i * 3 + 2] = r * Math.cos(phi);
  }
  const dustGeo = new THREE.BufferGeometry();
  dustGeo.setAttribute('position', new THREE.BufferAttribute(dustPositions, 3));
  const dustMat = new THREE.PointsMaterial({
    size: 0.1,
    color: 0xc99aff,
    transparent: true,
    opacity: 0.6,
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
    name: 'factions',

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
      camera.rotateZ(Math.sin(smoothProgress * Math.PI) * 0.08);

      /* --- Монолиты --- */
      monoliths.forEach((m) => m.update(time, dt));
      tribunes.update(time, dt);

      /* --- НИТИ: пульсация --- */
      connections.forEach((c) => {
        const pulse = 0.3 + Math.sin(time * 1.2 + c.phase) * 0.25;
        c.line.material.opacity = pulse * 0.7;
        c.glowLine.material.opacity = 0.4 + pulse * 0.5;
      });

      /* --- ИСКРЫ, летящие по нитям --- */
      const posArr = sparkGeo.attributes.position.array;
      sparks.forEach((s, i) => {
        s.t += s.speed * dt;
        if (s.t > 1) s.t -= 1;

        const conn = connections[s.connIdx];
        const point = conn.curve.getPoint(s.t);
        posArr[i * 3]     = point.x;
        posArr[i * 3 + 1] = point.y;
        posArr[i * 3 + 2] = point.z;
      });
      sparkGeo.attributes.position.needsUpdate = true;

      /* --- Светящиеся круги на полу --- */
      ringShapes.forEach((r, i) => {
        const phase = (time * r.speed) % 1;
        r.mesh.material.opacity = r.baseOpacity * (0.4 + Math.sin(time * 1.5 + i) * 0.4);

        // Расширяющиеся пульсации — кольца растут и гаснут
        const expanding = (time * 0.15 + i * 0.25) % 1;
        r.mesh.scale.setScalar(0.8 + expanding * 0.4);
      });

      /* --- Парящие осколки --- */
      floatingShards.forEach((s) => {
        const d = s.userData;
        d.angle += d.orbitSpeed * dt;

        s.position.x = Math.cos(d.angle) * d.radius;
        s.position.z = Math.sin(d.angle) * d.radius;
        s.position.y = d.baseY + Math.sin(time * 0.6 + d.phase) * 0.4;

        s.rotation.x += d.rotSpeed.x * dt;
        s.rotation.y += d.rotSpeed.y * dt;
        s.rotation.z += d.rotSpeed.z * dt;
      });

      /* --- Пыль вращается --- */
      dustPoints.rotation.y = time * 0.02;

      /* --- Bloom --- */
      if (postfx) {
        postfx.setBloom({ strength: 0.6 });
      }
    },

    dispose() {
      tribunes.dispose();
      monoliths.forEach((m) => m.dispose());

      // Очистка нитей
      connections.forEach((c) => {
        c.line.geometry.dispose();
        c.line.material.dispose();
        c.glowLine.geometry.dispose();
        c.glowLine.material.dispose();
      });

      // Очистка искр
      sparkGeo.dispose();
      sparkMat.dispose();
      sparkTex.dispose();

      // Пол
      floorGeo.dispose();
      floorMat.dispose();

      // Круги
      ringShapes.forEach((r) => {
        r.mesh.geometry.dispose();
        r.mesh.material.dispose();
      });

      // Осколки
      floatingShards.forEach((s) => {
        s.material.dispose();
      });
      shardGeos.forEach((g) => g.dispose());

      // Пыль
      dustGeo.dispose();
      dustMat.dispose();

      scene.remove(group);
    },
  };
}