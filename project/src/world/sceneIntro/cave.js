import * as THREE from 'three';
import { PALETTE } from './shared.js';

/* =========================================================
   CAVE — каменные стены, потолок, выступы, мох
   =========================================================
   ПЕРЕПИСАНО С НУЛЯ.

   Концепция (по референсу):
   - Стены по бокам и сзади — массивные, неровные
   - Потолок-свод сверху
   - Каменные выступы на стенах (ярусы)
   - Мшистые пятна на горизонтальных участках
   - Тёмные ниши (пустоты в стенах)
   - НЕ плоские — все с vertex displacement

   Ключевое:
   - Стены БЛИЗКО (x = ±12)
   - Потолок на y = +10..+12
   - Задняя стена на z = -20
   - Всё вокруг сцены — замкнутость
   ========================================================= */

export function createCave(parent, materials, qualityLevel = 'high') {
  const group = new THREE.Group();
  parent.add(group);

  const isLow = qualityLevel === 'low';
  const isMedium = qualityLevel === 'medium';

  /* ==========================================================
     КОНФИГ
     ========================================================== */
  const q = {
    wallRocks:   isLow ? 12 : isMedium ? 20 : 32,    // отдельные выступы, не сплошные скопления
    mossPatches: isLow ? 12 : isMedium ? 22 : 36,    // редкие акценты мха на скале
    stalactites: isLow ? 20 : isMedium ? 40 : 60,    // сталактиты с потолка
  };

  /* ==========================================================
     МАТЕРИАЛ СКАЛЫ — базовый для стен
     ========================================================== */
  const rockWallMat = new THREE.MeshStandardMaterial({
    color: 0x171a28,
    map: materials.rockTex,
    bumpMap: materials.rockTex,
    bumpScale: 0.32,
    roughness: 0.98,
    metalness: 0.05,
    flatShading: true,
    emissive: 0x050711,
    emissiveIntensity: 0.08,
  });
  rockWallMat.map.repeat.set(10, 7);
  rockWallMat.bumpMap.repeat.set(10, 7);

  /* ==========================================================
     ФУНКЦИЯ ШУМА для искажения вершин
     ========================================================== */
  function displaceVertices(geo, strength, frequency) {
    const pos = geo.attributes.position.array;
    for (let i = 0; i < pos.length; i += 3) {
      const x = pos[i];
      const y = pos[i + 1];
      const z = pos[i + 2];

      const n1 = Math.sin(x * frequency) * Math.cos(y * frequency * 0.8);
      const n2 = Math.sin(y * frequency * 1.3 + z * frequency * 0.7) * 0.6;
      const n3 = Math.cos(z * frequency * 1.5 + x * frequency * 0.9) * 0.4;

      const totalNoise = (n1 + n2 + n3) * strength;

      // Смещаем по нормали — но грубо, по Z
      pos[i + 2] += totalNoise;
    }
    geo.computeVertexNormals();
    return geo;
  }

  /* ==========================================================
     1. ЛЕВАЯ СТЕНА
     ==========================================================
     Большая вертикальная поверхность.
     Смотрит вправо (к центру сцены).
     ========================================================== */
  const wallHeight = 24;
  const wallLength = 50;
  const wallSegsX = isLow ? 24 : isMedium ? 40 : 60;
  const wallSegsY = isLow ? 12 : isMedium ? 20 : 30;

  const leftWallGeo = new THREE.PlaneGeometry(
    wallLength,
    wallHeight,
    wallSegsX,
    wallSegsY
  );

  displaceVertices(leftWallGeo, 1.5, 0.4);

  const leftWall = new THREE.Mesh(leftWallGeo, rockWallMat);
  leftWall.position.set(-12, 4, -8);
  leftWall.rotation.y = Math.PI / 2;
  leftWall.receiveShadow = true;
  group.add(leftWall);

  /* ==========================================================
     2. ПРАВАЯ СТЕНА
     ========================================================== */
  const rightWallGeo = new THREE.PlaneGeometry(
    wallLength,
    wallHeight,
    wallSegsX,
    wallSegsY
  );

  displaceVertices(rightWallGeo, 1.5, 0.4);

  const rightWall = new THREE.Mesh(rightWallGeo, rockWallMat);
  rightWall.position.set(12, 4, -8);
  rightWall.rotation.y = -Math.PI / 2;
  rightWall.receiveShadow = true;
  group.add(rightWall);

  /* ==========================================================
     3. ЗАДНЯЯ СТЕНА
     ==========================================================
     Закрывает горизонт сзади. На z = -22.
     ========================================================== */
  const backWallGeo = new THREE.PlaneGeometry(
    30,
    wallHeight,
    wallSegsX,
    wallSegsY
  );

  displaceVertices(backWallGeo, 1.8, 0.35);

  const backWall = new THREE.Mesh(backWallGeo, rockWallMat);
  backWall.position.set(0, 4, -22);
  backWall.receiveShadow = true;
  group.add(backWall);

  /* ==========================================================
     4. ПОТОЛОК-СВОД
     ==========================================================
     Большая горизонтальная поверхность сверху.
     С искажением — не плоскость, а неровный свод.
     ========================================================== */
  const ceilingGeo = new THREE.PlaneGeometry(
    30,
    40,
    wallSegsX,
    wallSegsY
  );

  const cpos = ceilingGeo.attributes.position.array;
  for (let i = 0; i < cpos.length; i += 3) {
    const x = cpos[i];
    const y = cpos[i + 1];

    const noise = Math.sin(x * 0.3) * Math.cos(y * 0.25) * 1.2
                + Math.sin(x * 0.7 + y * 0.4) * 0.5;

    cpos[i + 2] = noise;
  }
  ceilingGeo.computeVertexNormals();

  const ceiling = new THREE.Mesh(ceilingGeo, rockWallMat);
  ceiling.rotation.x = Math.PI / 2;
  ceiling.position.set(0, 12, -5);
  ceiling.receiveShadow = true;
  group.add(ceiling);

  // Layered stone ribs frame the corridor and make the ceiling read as a
  // deep cavern arch instead of a flat sheet. Keep the center opening clear.
  const archMat = new THREE.MeshStandardMaterial({
    color: 0x202331,
    map: materials.rockTex,
    roughness: 0.98,
    flatShading: true,
    emissive: 0x080912,
    emissiveIntensity: 0.1,
  });
  const archZs = [-15, -7, 1];
  archZs.forEach((z, index) => {
    const archCurve = new THREE.CatmullRomCurve3([
      new THREE.Vector3(-11.5, -5.2, z),
      new THREE.Vector3(-10.2, 0, z),
      new THREE.Vector3(-7.7, 6.2, z),
      new THREE.Vector3(-3.8, 10.2, z),
      new THREE.Vector3(0, 11.1, z),
      new THREE.Vector3(3.8, 10.2, z),
      new THREE.Vector3(7.7, 6.2, z),
      new THREE.Vector3(10.2, 0, z),
      new THREE.Vector3(11.5, -5.2, z),
    ]);
    const archGeo = new THREE.TubeGeometry(archCurve, 48, index === 1 ? 0.62 : 0.42, 7, false);
    const arch = new THREE.Mesh(archGeo, archMat);
    arch.castShadow = true;
    arch.receiveShadow = true;
    group.add(arch);
  });

  /* ==========================================================
     5. КАМЕННЫЕ ВЫСТУПЫ НА СТЕНАХ
     ==========================================================
     Ярусы/платформы из камней на разной высоте.
     InstancedMesh.
     ========================================================== */
  const wallRockGeo = new THREE.IcosahedronGeometry(1, 1);

  // Искажаем форму
  const wrpos = wallRockGeo.attributes.position.array;
  for (let j = 0; j < wrpos.length; j += 3) {
    const n = Math.sin(wrpos[j] * 4.3) * Math.cos(wrpos[j + 1] * 3.7);
    const scale = 1 + n * 0.2;
    wrpos[j]     *= scale;
    wrpos[j + 1] *= 1 + n * 0.15;
    wrpos[j + 2] *= scale;
  }
  wallRockGeo.computeVertexNormals();

  const wallRockMat = new THREE.MeshStandardMaterial({
    color: 0x0a0a12,
    map: materials.rockTex,
    roughness: 0.95,
    metalness: 0.05,
    flatShading: true,
    emissive: 0x0a0510,
    emissiveIntensity: 0.1,
  });

  const wallRocks = new THREE.InstancedMesh(
    wallRockGeo,
    wallRockMat,
    q.wallRocks
  );

  const matrix = new THREE.Matrix4();
  const quat = new THREE.Quaternion();
  const pos = new THREE.Vector3();
  const scl = new THREE.Vector3();

  for (let i = 0; i < q.wallRocks; i++) {
    // По стороне
    const side = i % 4;

    let x, z, y;

    if (side === 0) {
      // левая стена
      x = -11 - Math.random() * 1.5;
      z = -15 + Math.random() * 20;
      y = -3 + Math.random() * 12;
    } else if (side === 1) {
      // правая стена
      x = 11 + Math.random() * 1.5;
      z = -15 + Math.random() * 20;
      y = -3 + Math.random() * 12;
    } else if (side === 2) {
      // Дальняя стена: выступы группируются по краям,
      // чтобы обрамить кристаллы и оставить проход видимым.
      const backSide = Math.random() < 0.5 ? -1 : 1;
      x = backSide * (5.5 + Math.random() * 6);
      z = -20 - Math.random() * 2;
      y = -1 + Math.random() * 10;
    } else {
      // возле потолка
      const ceilingSide = Math.random() < 0.5 ? -1 : 1;
      x = ceilingSide * (5 + Math.random() * 6);
      z = -15 + Math.random() * 15;
      y = 8 + Math.random() * 4;
    }

    pos.set(x, y, z);

    quat.setFromEuler(new THREE.Euler(
      Math.random() * Math.PI,
      Math.random() * Math.PI,
      Math.random() * Math.PI
    ));

    // Размер
    const size = side === 2
      ? 1.1 + Math.random() * 1.25
      : side === 3
        ? 0.9 + Math.random() * 1.4
        : 1.0 + Math.random() * 1.8;
    scl.set(
      size * (0.8 + Math.random() * 0.5),
      size * (0.6 + Math.random() * 0.4),
      size * (0.8 + Math.random() * 0.5)
    );

    matrix.compose(pos, quat, scl);
    wallRocks.setMatrixAt(i, matrix);
  }
  wallRocks.instanceMatrix.needsUpdate = true;
  wallRocks.castShadow = true;
  wallRocks.receiveShadow = true;
  group.add(wallRocks);

  /* ==========================================================
     6. МШИСТЫЕ ПЯТНА НА СТЕНАХ И ВЫСТУПАХ
     ==========================================================
     Где на горизонтальных поверхностях растёт мох.
     ========================================================== */
  const mossGeo = new THREE.SphereGeometry(1, 7, 5);

  const mossPatches = new THREE.InstancedMesh(
    mossGeo,
    materials.moss,
    q.mossPatches
  );

  for (let i = 0; i < q.mossPatches; i++) {
    const side = i % 3;

    let x, z, y;

    if (side === 0) {
      x = -10 - Math.random() * 2;
      z = -15 + Math.random() * 20;
      y = -3 + Math.random() * 10;
    } else if (side === 1) {
      x = 10 + Math.random() * 2;
      z = -15 + Math.random() * 20;
      y = -3 + Math.random() * 10;
    } else {
      x = (Math.random() - 0.5) * 18;
      z = -19 - Math.random() * 2;
      y = -3 + Math.random() * 10;
    }

    pos.set(x, y, z);

    quat.setFromEuler(new THREE.Euler(
      Math.random() * Math.PI,
      Math.random() * Math.PI,
      Math.random() * Math.PI
    ));

    const size = 0.25 + Math.random() * 0.6;
    scl.set(
      size * (1.1 + Math.random() * 0.3),
      size * (0.25 + Math.random() * 0.15),
      size * (1.1 + Math.random() * 0.3)
    );

    matrix.compose(pos, quat, scl);
    mossPatches.setMatrixAt(i, matrix);
  }
  mossPatches.instanceMatrix.needsUpdate = true;
  mossPatches.receiveShadow = true;
  group.add(mossPatches);

  /* ==========================================================
     7. СТАЛАКТИТЫ — свисают с потолка
     ==========================================================
     Тонкие конусы с правильным пивотом.
     ========================================================== */
  const stalGeo = new THREE.ConeGeometry(0.3, 2.5, 6);
  stalGeo.translate(0, 1.25, 0);    // пивот в основании
  stalGeo.rotateX(Math.PI);          // вершина вниз

  const stalMat = new THREE.MeshStandardMaterial({
    color: 0x0a0a12,
    map: materials.rockTex,
    roughness: 0.95,
    metalness: 0.05,
    flatShading: true,
    emissive: 0x0a0510,
    emissiveIntensity: 0.12,
  });

  const stalactites = new THREE.InstancedMesh(
    stalGeo,
    stalMat,
    q.stalactites
  );

  for (let i = 0; i < q.stalactites; i++) {
    // По потолку, НЕ в центре кадра
    const x = (Math.random() - 0.5) * 24;
    const z = -18 + Math.random() * 24;

    // Высота потолка в этой точке
    const noise = Math.sin(x * 0.3) * Math.cos(z * 0.25) * 1.2
                + Math.sin(x * 0.7 + z * 0.4) * 0.5;

    const y = 12 + noise - 0.3;   // чуть ниже потолка

    pos.set(x, y, z);

    quat.setFromEuler(new THREE.Euler(
      (Math.random() - 0.5) * 0.2,
      Math.random() * Math.PI * 2,
      (Math.random() - 0.5) * 0.2
    ));

    const size = 0.5 + Math.random() * 0.8;
    scl.set(size, size * (0.8 + Math.random() * 0.5), size);

    matrix.compose(pos, quat, scl);
    stalactites.setMatrixAt(i, matrix);
  }
  stalactites.instanceMatrix.needsUpdate = true;
  stalactites.castShadow = true;
  group.add(stalactites);

  /* ==========================================================
     8. ТЁМНЫЕ НИШИ — пустоты в стенах
     ==========================================================
     Куда потом можно поставить фонарики.
     ========================================================== */
  const nicheCount = isLow ? 4 : isMedium ? 8 : 12;
  const nicheGeo = new THREE.SphereGeometry(1, 8, 6);

  const nicheMat = new THREE.MeshBasicMaterial({
    color: 0x000000,
  });

  const niches = new THREE.InstancedMesh(
    nicheGeo,
    nicheMat,
    nicheCount
  );

  for (let i = 0; i < nicheCount; i++) {
    const side = i % 3;

    let x, z, y;

    if (side === 0) {
      x = -11;
      z = -15 + Math.random() * 20;
      y = -1 + Math.random() * 8;
    } else if (side === 1) {
      x = 11;
      z = -15 + Math.random() * 20;
      y = -1 + Math.random() * 8;
    } else {
      x = (Math.random() - 0.5) * 18;
      z = -21;
      y = -1 + Math.random() * 8;
    }

    pos.set(x, y, z);

    quat.setFromEuler(new THREE.Euler(
      Math.random() * Math.PI * 0.3,
      Math.random() * Math.PI,
      Math.random() * Math.PI * 0.3
    ));

    const size = 0.6 + Math.random() * 0.5;
    scl.set(size * 0.7, size * 0.5, size * 0.3);

    matrix.compose(pos, quat, scl);
    niches.setMatrixAt(i, matrix);
  }
  niches.instanceMatrix.needsUpdate = true;
  group.add(niches);

  /* ==========================================================
     9. МШИСТЫЕ ЛИАНЫ, СВИСАЮЩИЕ СО СТЕН
     ==========================================================
     Редкие тонкие лианы, растущие со стен.
     ========================================================== */
  const wallVineCount = isLow ? 8 : isMedium ? 15 : 25;

  for (let i = 0; i < wallVineCount; i++) {
    const side = i % 2;

    const x = side === 0 ? -11 : 11;
    const z = -15 + Math.random() * 20;
    const yStart = 4 + Math.random() * 6;

    const length = 1 + Math.random() * 2;

    const points = [];
    const segCount = 6;
    let curveX = 0;

    for (let p = 0; p <= segCount; p++) {
      const t = p / segCount;
      curveX += (Math.random() - 0.5) * 0.2;

      points.push(new THREE.Vector3(
        0,
        -t * length,
        curveX
      ));
    }

    const curve = new THREE.CatmullRomCurve3(points);

    const tubeGeo = new THREE.TubeGeometry(curve, 8, 0.02, 4, false);

    const vineMat = new THREE.MeshStandardMaterial({
      color: 0x0a1a10,
      roughness: 0.9,
      emissive: 0x1a3a1a,
      emissiveIntensity: 0.3,
    });

    const vine = new THREE.Mesh(tubeGeo, vineMat);
    vine.position.set(x, yStart, z);
    group.add(vine);
  }

  /* ==========================================================
     API
     ========================================================== */
  return {
    group,

    update() {
      // Статичная пещера — ничего не двигается
    },

    dispose() {
      if (group.parent) group.parent.remove(group);
      group.traverse((o) => {
        if (o.geometry) o.geometry.dispose();
        if (o.material &&
            o.material !== materials.rock &&
            o.material !== materials.moss &&
            o.material !== materials.rockTex) {
          if (Array.isArray(o.material)) o.material.forEach((m) => m.dispose());
          else o.material.dispose();
        }
      });
      rockWallMat.dispose();
      wallRockGeo.dispose();
      wallRockMat.dispose();
      mossGeo.dispose();
      stalGeo.dispose();
      stalMat.dispose();
      nicheGeo.dispose();
      nicheMat.dispose();
    },
  };
}
