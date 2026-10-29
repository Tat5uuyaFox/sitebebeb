import * as THREE from 'three';
import { PALETTE } from './shared.js';

/* =========================================================
   GROUND — земля без хаоса
   =========================================================
   КОНЦЕПЦИЯ:

   - Одна большая плоскость с ВЫСОКОДЕТАЛЬНОЙ геометрией
   - Неровности через vertex displacement (шум)
   - Текстура мха + bump-карта
   - Дорожка — крупные плиты
   - Немного гальки — крупной, читаемой
   - НИКАКИХ сотен instanced-подушек

   Было: круг + 180 подушек мха + 400 гальки + слои = каша
   Стало: ОДНА сетка с шумом + 24 плиты + 60 крупной гальки
   ========================================================= */

export function createGround(parent, materials, qualityLevel = 'high') {
  const group = new THREE.Group();
  parent.add(group);

  const isLow = qualityLevel === 'low';
  const isMedium = qualityLevel === 'medium';

  /* ==========================================================
     КОНФИГ
     ========================================================== */
  const SEGMENTS = isLow ? 64 : isMedium ? 96 : 128;
  const FLOOR_SIZE = 80;

  const q = {
    pathTiles:   isLow ? 18 : isMedium ? 26 : 34,
    pebbles:     isLow ? 12 : isMedium ? 20 : 28,
    darkPatches: isLow ? 3 : isMedium ? 5 : 7,
  };

  /* ==========================================================
     1. ЗЕМЛЯ — БОЛЬШАЯ ПЛОСКОСТЬ С ГЕОМЕТРИЕЙ
     ==========================================================
     Ключевое отличие от прошлой версии:
     - Много сегментов (128x128)
     - Каждая вершина смещена по Y через шум
     - Нет наложенных объектов, только одна сетка
     ========================================================== */
  const floorGeo = new THREE.PlaneGeometry(
    FLOOR_SIZE,
    FLOOR_SIZE,
    SEGMENTS,
    SEGMENTS
  );

  // Смещаем вершины — создаём бугры и ямки
  const pos = floorGeo.attributes.position.array;

  // Функция шума — простая сумма синусов
  function noiseAt(x, z) {
    // Крупные бугры
    const n1 = Math.sin(x * 0.15) * Math.cos(z * 0.18) * 0.35;
    // Средние
    const n2 = Math.sin(x * 0.42 + z * 0.31) * 0.15;
    // Мелкие
    const n3 = Math.sin(x * 0.9 + 1.7) * Math.cos(z * 1.1 + 0.5) * 0.08;

    // Плоская область вокруг дорожки (по центру)
    const centerDist = Math.sqrt(x * x + (z + 1) * (z + 1));
    const pathFlatness = smoothstep(2.0, 5.0, centerDist);

    return (n1 + n2 + n3) * pathFlatness;
  }

  function smoothstep(edge0, edge1, x) {
    const t = Math.max(0, Math.min(1, (x - edge0) / (edge1 - edge0)));
    return t * t * (3 - 2 * t);
  }

  for (let i = 0; i < pos.length; i += 3) {
    const x = pos[i];
    const z = pos[i + 1];   // в plane geometry Z лежит в Y-компоненте до поворота

    // Смещаем по третьей оси (которая станет Y после поворота)
    pos[i + 2] = noiseAt(x, z);
  }

  floorGeo.computeVertexNormals();

  const floor = new THREE.Mesh(floorGeo, materials.mossFloor);
  floor.rotation.x = -Math.PI / 2;
  floor.position.y = -5.5;
  floor.receiveShadow = true;
  group.add(floor);

  /* ==========================================================
     2. ДОРОЖКА — ПЛИТЫ (крупные, читаемые)
     ========================================================== */
  const tileCount = q.pathTiles;
  const pathLength = 18;
  const pathCurve = 1.25;
  const pathOffset = -1.6;
  const pathMat = materials.rock.clone();
  pathMat.color.set(0xb09060);
  pathMat.emissive.set(0x503014);
  pathMat.emissiveIntensity = 0.32;

  // Continuous earth ribbon under the stepping stones makes the route
  // read as a real trail instead of a string of disconnected discs.
  const pathRows = 72;
  const pathCols = 8;
  const pathPositions = [];
  const pathIndices = [];
  const pathUvs = [];
  for (let row = 0; row <= pathRows; row++) {
    const t = row / pathRows;
    const z = 8 - t * pathLength;
    const xCenter = pathOffset + Math.sin(t * Math.PI) * pathCurve;
    const width = 2.15 + Math.sin(t * Math.PI) * 0.5;
    for (let col = 0; col <= pathCols; col++) {
      const u = col / pathCols;
      const x = xCenter + (u - 0.5) * width;
      const edgeFade = Math.sin(u * Math.PI);
      const y = -5.46 + noiseAt(x, z) * 0.28 + edgeFade * 0.025;
      pathPositions.push(x, y, z);
      pathUvs.push(u, t * 4);
      if (row < pathRows && col < pathCols) {
        const a = row * (pathCols + 1) + col;
        const b = a + pathCols + 1;
        pathIndices.push(a, a + 1, b, b, a + 1, b + 1);
      }
    }
  }
  const pathGeo = new THREE.BufferGeometry();
  pathGeo.setAttribute('position', new THREE.Float32BufferAttribute(pathPositions, 3));
  pathGeo.setAttribute('uv', new THREE.Float32BufferAttribute(pathUvs, 2));
  pathGeo.setIndex(pathIndices);
  pathGeo.computeVertexNormals();
  const trailBedMat = new THREE.MeshStandardMaterial({
    color: 0x59452d,
    map: materials.rockTex.clone(),
    roughness: 1,
    flatShading: true,
    emissive: 0x160c04,
    emissiveIntensity: 0.18,
  });
  trailBedMat.map.repeat.set(3, 8);
  const trailBed = new THREE.Mesh(pathGeo, trailBedMat);
  trailBed.receiveShadow = true;
  group.add(trailBed);

  function getPathX(z) {
    const t = (8 - z) / pathLength;
    if (t < 0 || t > 1) return 0;
    return pathOffset + Math.sin(t * Math.PI) * pathCurve;
  }

  for (let i = 0; i < tileCount; i++) {
    const t = i / (tileCount - 1);
    const x = pathOffset + Math.sin(t * Math.PI) * pathCurve;
    const z = 8 - t * pathLength;

    const size = 0.58 + Math.random() * 0.16;

    // Форма плиты — гексагон с искажением (не идеально круглая)
    const tileGeo = new THREE.CylinderGeometry(size, size * 1.05, 0.18, 6);
    const tpos = tileGeo.attributes.position.array;
    for (let j = 0; j < tpos.length; j += 3) {
      tpos[j]     *= 0.9 + Math.random() * 0.2;
      tpos[j + 2] *= 0.9 + Math.random() * 0.2;
    }
    tileGeo.computeVertexNormals();

    const tile = new THREE.Mesh(tileGeo, pathMat);
    tile.position.set(x, -5.42, z);
    tile.rotation.y = Math.random() * Math.PI;
    tile.receiveShadow = true;
    tile.castShadow = true;
    group.add(tile);

    // Мох по краям плиты — тонкое кольцо
    if (Math.random() < 0.6) {
      const mossSize = size * 1.05;
      const mossGeo = new THREE.RingGeometry(
        mossSize * 0.85,
        mossSize * 1.15,
        8
      );
      const moss = new THREE.Mesh(mossGeo, materials.moss);
      moss.rotation.x = -Math.PI / 2;
      moss.position.set(x, -5.35, z);
      moss.rotation.z = Math.random() * Math.PI * 2;
      group.add(moss);
    }
  }

  // Небольшие тёплые отблески вдоль тропы, затухающие к глубине.
  const pathLights = [];
  [0.12, 0.38, 0.66, 0.9].forEach((t, i) => {
    const z = 8 - t * pathLength;
    const light = new THREE.PointLight(0xffb45e, 1.8 - i * 0.28, 7, 2);
    light.position.set(pathOffset + Math.sin(t * Math.PI) * pathCurve, -4.8, z);
    group.add(light);
    pathLights.push(light);
  });

  /* ==========================================================
     3. ГАЛЬКА — КРУПНАЯ, ЧИТАЕМАЯ
     ==========================================================
     Было: 400 мелких (шум)
     Стало: 60 крупных (детали)
     ========================================================== */
  const pebbleGeo = new THREE.DodecahedronGeometry(1, 1);

  // Искажаем плавно
  const pebPos = pebbleGeo.attributes.position.array;
  for (let j = 0; j < pebPos.length; j += 3) {
    const n = Math.sin(pebPos[j] * 4.2) * Math.cos(pebPos[j + 1] * 3.5);
    const scale = 1 + n * 0.15;
    pebPos[j]     *= scale;
    pebPos[j + 1] *= scale * 0.85;
    pebPos[j + 2] *= scale;
  }
  pebbleGeo.computeVertexNormals();

  const pebbleMat = new THREE.MeshStandardMaterial({
    color: 0x1a1a14,
    roughness: 0.95,
    flatShading: true,
    emissive: 0x0a0a06,
    emissiveIntensity: 0.1,
  });

  const pebbles = new THREE.InstancedMesh(pebbleGeo, pebbleMat, q.pebbles);

  const matrix = new THREE.Matrix4();
  const quat = new THREE.Quaternion();
  const pos3 = new THREE.Vector3();
  const scl = new THREE.Vector3();

  for (let i = 0; i < q.pebbles; i++) {
    const t = Math.random();
    const baseX = pathOffset + Math.sin(t * Math.PI) * pathCurve;
    const baseZ = 8 - t * pathLength;

    const side = Math.random() < 0.5 ? -1 : 1;
    const offsetX = side * (1.15 + Math.random() * 1.3);

    // Крупный размер
    const size = 0.15 + Math.random() * 0.15;

    pos3.set(
      baseX + offsetX,
      -5.5 + size * 0.3 + noiseAt(baseX + offsetX, baseZ) * 0.5,
      baseZ + (Math.random() - 0.5) * 0.8
    );
    quat.setFromEuler(new THREE.Euler(
      Math.random() * Math.PI,
      Math.random() * Math.PI,
      Math.random() * Math.PI
    ));
    scl.set(
      size * (0.85 + Math.random() * 0.3),
      size * 0.7,
      size * (0.85 + Math.random() * 0.3)
    );

    matrix.compose(pos3, quat, scl);
    pebbles.setMatrixAt(i, matrix);
  }
  pebbles.instanceMatrix.needsUpdate = true;
  pebbles.receiveShadow = true;
  pebbles.castShadow = true;
  group.add(pebbles);

  /* ==========================================================
     4. ТЁМНЫЕ ПЯТНА — МАЛО, КРУПНЫЕ
     ========================================================== */
  const patchGeo = new THREE.CircleGeometry(1, 16);
  const patchMat = new THREE.MeshBasicMaterial({
    color: 0x000000,
    transparent: true,
    opacity: 0.35,
    depthWrite: false,
  });
  const darkPatches = new THREE.InstancedMesh(patchGeo, patchMat, q.darkPatches);

  for (let i = 0; i < q.darkPatches; i++) {
    const angle = Math.random() * Math.PI * 2;
    const r = 6 + Math.random() * 10;

    pos3.set(
      Math.cos(angle) * r,
      -5.4,
      Math.sin(angle) * r
    );
    quat.setFromEuler(new THREE.Euler(-Math.PI / 2, 0, 0));
    const sc = 2 + Math.random() * 2.5;
    scl.set(sc, sc, sc);

    matrix.compose(pos3, quat, scl);
    darkPatches.setMatrixAt(i, matrix);
  }
  darkPatches.instanceMatrix.needsUpdate = true;
  group.add(darkPatches);

  /* ==========================================================
     API
     ========================================================== */
  return {
    group,

    update() {
      // Статичная земля — нечего обновлять
    },

    dispose() {
      if (group.parent) group.parent.remove(group);
      group.traverse((o) => {
        if (o.geometry) o.geometry.dispose();
        if (o.material &&
            o.material !== materials.rock &&
            o.material !== materials.moss &&
            o.material !== materials.mossFloor) {
          if (Array.isArray(o.material)) o.material.forEach((m) => m.dispose());
          else o.material.dispose();
        }
      });
      pebbleGeo.dispose();
      pebbleMat.dispose();
      pathMat.dispose();
      pathGeo.dispose();
      trailBedMat.map.dispose();
      trailBedMat.dispose();
      pathLights.forEach((light) => group.remove(light));
      patchGeo.dispose();
      patchMat.dispose();
    },
  };
}
