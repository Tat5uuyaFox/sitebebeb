import * as THREE from 'three';
import { PALETTE } from './shared.js';

/* =========================================================
   ENTRANCE — лианы + висящие ягоды
   =========================================================
   Добавлено:
   - Одиночные ягоды на тонких нитях
   - Как в Minecraft — glow berries свисают отдельно
   - Редкие, одиночные — не гирлянда
   - Разная длина нитей (0.5-2 единицы)
   - Мягкое мерцание света

   Сохранено:
   - Поток листвы на основных лианах
   - 4 оттенка листьев
   - Грозди ягод внутри листвы
   ========================================================= */

export function createEntrance(parent, materials, qualityLevel = 'high') {
  const group = new THREE.Group();
  parent.add(group);

  const isLow = qualityLevel === 'low';
  const isMedium = qualityLevel === 'medium';

  /* ==========================================================
     КОНФИГ
     ========================================================== */
  const q = {
    vineCount:        isLow ? 9 : isMedium ? 14 : 18,
    hangingBerryCount: isLow ? 3 : isMedium ? 5 : 7,
  };

  /* ==========================================================
     МАТЕРИАЛЫ ЛИСТЬЕВ — 4 оттенка
     ========================================================== */

  const leafDarkMat = new THREE.MeshStandardMaterial({
    map: materials.leafTex,
    color: 0x10251a,
    emissive: 0x1a3a2a,
    emissiveIntensity: 0.4,
    side: THREE.DoubleSide,
    transparent: true,
    alphaTest: 0.1,
    opacity: 0.95,
    roughness: 0.85,
  });

  const leafMidMat = new THREE.MeshStandardMaterial({
    map: materials.leafTex,
    color: 0x1a3a20,
    emissive: 0x2a5a30,
    emissiveIntensity: 0.5,
    side: THREE.DoubleSide,
    transparent: true,
    alphaTest: 0.1,
    opacity: 0.95,
    roughness: 0.8,
  });

  const leafLightMat = new THREE.MeshStandardMaterial({
    map: materials.leafTex,
    color: 0x2a5a30,
    emissive: 0x3a7a40,
    emissiveIntensity: 0.6,
    side: THREE.DoubleSide,
    transparent: true,
    alphaTest: 0.1,
    opacity: 0.95,
    roughness: 0.75,
  });

  const leafPinkMat = new THREE.MeshStandardMaterial({
    map: materials.leafTex,
    color: 0x49365f,
    emissive: 0x7545b5,
    emissiveIntensity: 0.55,
    side: THREE.DoubleSide,
    transparent: true,
    alphaTest: 0.1,
    opacity: 0.95,
    roughness: 0.7,
  });

  /* ==========================================================
     МАТЕРИАЛ СТЕБЛЯ
     ========================================================== */
  const stemMat = new THREE.MeshStandardMaterial({
    color: 0x0a1a10,
    roughness: 0.95,
    flatShading: true,
    emissive: 0x0a2a1a,
    emissiveIntensity: 0.2,
  });

  /* ==========================================================
     МАТЕРИАЛ ТОНКОЙ НИТИ (для висящих ягод)
     ========================================================== */
  const threadMat = new THREE.MeshStandardMaterial({
    color: 0x0a1a10,
    roughness: 0.95,
    flatShading: true,
    emissive: 0x294a32,
    emissiveIntensity: 0.42,
  });

  /* ==========================================================
     МАТЕРИАЛ ЯГОД — тёплые
     ========================================================== */
  const berryMat = new THREE.MeshStandardMaterial({
    color: 0x2a1000,
    emissive: 0xffa050,
    emissiveIntensity: 1.3,
    roughness: 0.4,
    metalness: 0.1,
    flatShading: true,
  });

  /* ==========================================================
     ГЕОМЕТРИИ
     ========================================================== */

  // Лист — с лёгким изгибом
  const leafGeo = new THREE.PlaneGeometry(0.28, 0.4, 3, 4);
  {
    const lpos = leafGeo.attributes.position.array;
    for (let j = 0; j < lpos.length; j += 3) {
      const lx = lpos[j];
      const ly = lpos[j + 1];
      lpos[j + 2] = -Math.abs(lx) * 0.35 + Math.sin(ly * 2.5) * 0.04;
    }
    leafGeo.computeVertexNormals();
  }

  const leafSmallGeo = new THREE.PlaneGeometry(0.18, 0.28, 3, 4);
  {
    const lpos = leafSmallGeo.attributes.position.array;
    for (let j = 0; j < lpos.length; j += 3) {
      const lx = lpos[j];
      const ly = lpos[j + 1];
      lpos[j + 2] = -Math.abs(lx) * 0.35 + Math.sin(ly * 2.5) * 0.04;
    }
    leafSmallGeo.computeVertexNormals();
  }

  // Ягода
  const berryGeo = new THREE.IcosahedronGeometry(0.05, 1);

  // Ниточка — тонкий цилиндр, пивот наверху
  const threadBaseGeo = new THREE.CylinderGeometry(0.016, 0.012, 1, 5);
  threadBaseGeo.translate(0, -0.5, 0);   // пивот сверху

  /* ==========================================================
     ТЕКСТУРА СВЕЧЕНИЯ ЯГОД
     ========================================================== */
  const berryGlowTex = (() => {
    const size = 64;
    const cv = document.createElement('canvas');
    cv.width = cv.height = size;
    const ctx = cv.getContext('2d');
    const g = ctx.createRadialGradient(
      size / 2, size / 2, 0,
      size / 2, size / 2, size / 2
    );
    g.addColorStop(0.0, 'rgba(255, 200, 130, 1)');
    g.addColorStop(0.3, 'rgba(255, 160, 80, 0.5)');
    g.addColorStop(1.0, 'rgba(255, 120, 40, 0)');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, size, size);
    const tex = new THREE.CanvasTexture(cv);
    tex.colorSpace = THREE.SRGBColorSpace;
    return tex;
  })();

  /* ==========================================================
     СБОР ДАННЫХ
     ========================================================== */

  const berryInstances = [];
  const berryLights = [];

  // === НОВОЕ: висящие ягоды на нитях ===
  const hangingBerries = [];   // для анимации

  const vines = [];

  const matrix = new THREE.Matrix4();
  const makeVineLeaves = (list, geometry, material, parent) => {
    if (!list.length) return;
    const mesh = new THREE.InstancedMesh(geometry, material, list.length);
    list.forEach((leaf, index) => {
      matrix.compose(leaf.position, leaf.quaternion, leaf.scale);
      mesh.setMatrixAt(index, matrix);
    });
    mesh.instanceMatrix.needsUpdate = true;
    parent.add(mesh);
  };

  /* ==========================================================
     СОЗДАНИЕ ЛИАН (поток листвы)
     ========================================================== */
  for (let i = 0; i < q.vineCount; i++) {
    let x;
    const side = Math.random() < 0.5 ? -1 : 1;
    x = side * (4.5 + Math.random() * 5.5);

    const z = -10 + Math.random() * 20;
    const yStart = 8 + Math.random() * 2;

    let length;
    const lenRoll = Math.random();
    if (lenRoll < 0.3) {
      length = 3 + Math.random() * 2;
    } else if (lenRoll < 0.8) {
      length = 5 + Math.random() * 4;
    } else {
      length = 9 + Math.random() * 5;
    }

    const isPink = z < -1 && Math.random() < 0.5;

    // --- КРИВАЯ ---
    const points = [];
    const pointCount = Math.max(6, Math.floor(length * 1.2));
    const curvePhase = Math.random() * Math.PI * 2;

    for (let p = 0; p <= pointCount; p++) {
      const t = p / pointCount;
      const curveX = Math.sin(t * Math.PI * 1.35 + curvePhase) * 0.22
                   + Math.sin(t * Math.PI * 2.4 + curvePhase * 0.7) * 0.06;
      const curveZ = Math.cos(t * Math.PI * 1.1 + curvePhase) * 0.12;

      points.push(new THREE.Vector3(
        curveX,
        -t * length,
        curveZ
      ));
    }

    const curve = new THREE.CatmullRomCurve3(points);

    // --- ГРУППА ---
    const vineGroup = new THREE.Group();
    vineGroup.position.set(x, yStart, z);
    group.add(vineGroup);
    const vineLeaves = { dark: [], mid: [], light: [], pink: [] };

    // --- СТЕБЕЛЬ ---
    const radius = 0.04 + Math.random() * 0.03;

    const tubeGeo = new THREE.TubeGeometry(
      curve,
      pointCount * 2,
      radius,
      5,
      false
    );

    const stem = new THREE.Mesh(tubeGeo, stemMat);
    stem.castShadow = false;
    vineGroup.add(stem);

    // --- ЛИСТЬЯ ---
    const leafCount = Math.floor(length * (2.5 + Math.random() * 1.2));

    for (let l = 0; l < leafCount; l++) {
      const t = (l / leafCount) * 0.95 + 0.02;
      const point = curve.getPoint(t);
      const angle = Math.random() * Math.PI * 2;
      const offset = radius * 2 + Math.random() * 0.05;

      const position = new THREE.Vector3(
        point.x + Math.cos(angle) * offset,
        point.y,
        point.z + Math.sin(angle) * offset
      );

      const quaternion = new THREE.Quaternion().setFromEuler(
        new THREE.Euler(
          (Math.random() - 0.5) * 1.2,
          angle + (Math.random() - 0.5) * 0.8,
          (Math.random() - 0.5) * 0.8
        )
      );

      const size = isPink ? 0.62 + Math.random() * 0.42 : 0.48 + Math.random() * 0.35;
      const scale = new THREE.Vector3(size, size, 1);

      let leafType;
      if (isPink && Math.random() < 0.7) {
        leafType = 'pink';
      } else {
        const roll = Math.random();
        if (roll < 0.5) leafType = 'dark';
        else if (roll < 0.85) leafType = 'mid';
        else leafType = 'light';
      }

      vineLeaves[leafType].push({
        position,
        quaternion,
        scale,
      });
    }

    makeVineLeaves(vineLeaves.dark, leafGeo, leafDarkMat, vineGroup);
    makeVineLeaves(vineLeaves.mid, leafGeo, leafMidMat, vineGroup);
    makeVineLeaves(vineLeaves.light, leafSmallGeo, leafLightMat, vineGroup);
    makeVineLeaves(vineLeaves.pink, leafSmallGeo, leafPinkMat, vineGroup);

    // --- ГРОЗДИ ЯГОД внутри листвы ---
    if (Math.random() < 0.3) {
      const clusterT = 0.4 + Math.random() * 0.3;
      const clusterPoint = curve.getPoint(clusterT);

      const clusterSize = 2 + Math.floor(Math.random() * 3);

      for (let b = 0; b < clusterSize; b++) {
        const angle = Math.random() * Math.PI * 2;
        const dist = Math.random() * 0.15;

        const berryPos = new THREE.Vector3(
          x + clusterPoint.x + Math.cos(angle) * dist,
          yStart + clusterPoint.y + (Math.random() - 0.5) * 0.15,
          z + clusterPoint.z + Math.sin(angle) * dist
        );

        berryInstances.push({
          position: berryPos,
          scale: 0.8 + Math.random() * 0.4,
        });

        if (Math.random() < 0.4) {
          berryLights.push({
            position: berryPos.clone(),
          });
        }
      }
    }

    vines.push({
      group: vineGroup,
      phase: Math.random() * Math.PI * 2,
      swaySpeed: 0.22 + Math.random() * 0.28,
      swayAmount: 0.025 + Math.random() * 0.035,
    });
  }

  /* ==========================================================
     НОВОЕ: ВИСЯЩИЕ ОДИНОЧНЫЕ ЯГОДЫ НА НИТЯХ
     ==========================================================
     Между лианами — тонкие нити с 1 ягодой на конце.
     Как в Minecraft glow berries.
     ========================================================== */
  for (let i = 0; i < q.hangingBerryCount; i++) {
    // Позиция — по всей сцене, но не у самого потолка
    const side = Math.random() < 0.5 ? -1 : 1;
    const x = side * (5.5 + Math.random() * 4.5);
    const z = -8 + Math.random() * 16;
    const yStart = 7.5 + Math.random() * 2.5;

    // Длина нити — короткая
    const threadLength = 1.0 + Math.random() * 1.8;

    // --- Группа ---
    const hangingGroup = new THREE.Group();
    hangingGroup.position.set(x, yStart, z);
    group.add(hangingGroup);

    // --- Нить ---
    const thread = new THREE.Mesh(
      threadBaseGeo,
      threadMat
    );
    thread.scale.set(1, threadLength, 1);
    hangingGroup.add(thread);

    // --- Ягода на конце ---
    const berry = new THREE.Mesh(berryGeo, berryMat);
    const berryScale = 0.9 + Math.random() * 0.5;
    berry.scale.setScalar(berryScale);
    berry.position.y = -threadLength;
    hangingGroup.add(berry);

    // --- Ореол вокруг ягоды ---
    const halo = new THREE.Sprite(
      new THREE.SpriteMaterial({
        map: berryGlowTex,
        color: 0xffa050,
        transparent: true,
        opacity: 0.75,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
      })
    );
    halo.scale.setScalar(0.4 * berryScale);
    halo.position.y = -threadLength;
    hangingGroup.add(halo);

    // --- Свет ---
    const light = new THREE.PointLight(0xffa050, 0.32, 1.8, 2);
    light.position.y = -threadLength;
    hangingGroup.add(light);

    hangingBerries.push({
      group: hangingGroup,
      berry,
      halo,
      light,
      baseHalo: 0.75,
      baseScale: berryScale,
      phase: Math.random() * Math.PI * 2,
      swaySpeed: 0.4 + Math.random() * 0.5,
      swayAmount: 0.03 + Math.random() * 0.04,
    });
  }

  /* ==========================================================
     INSTANCED MESH — листья
     ========================================================== */

  // Leaves are instanced per vine so their sway follows the stem.

  /* ==========================================================
     INSTANCED MESH — ягоды внутри листвы
     ========================================================== */
  if (berryInstances.length > 0) {
    const berryInst = new THREE.InstancedMesh(
      berryGeo,
      berryMat,
      berryInstances.length
    );

    const berryQuat = new THREE.Quaternion();
    const berryScale = new THREE.Vector3();

    berryInstances.forEach((b, i) => {
      berryScale.setScalar(b.scale);
      matrix.compose(b.position, berryQuat, berryScale);
      berryInst.setMatrixAt(i, matrix);
    });
    berryInst.instanceMatrix.needsUpdate = true;
    group.add(berryInst);
  }

  /* ==========================================================
     СВЕТ ОТ ЯГОД В ЛИСТВЕ
     ========================================================== */
  const lights = [];

  berryLights.forEach((b) => {
    const light = new THREE.PointLight(0xffa050, 0.6, 2.5, 2);
    light.position.copy(b.position);
    group.add(light);
    lights.push(light);
  });

  /* ==========================================================
     API
     ========================================================== */
  return {
    group,

    update(time) {
      // Лианы качаются
      vines.forEach((v) => {
        v.group.rotation.z = Math.sin(time * v.swaySpeed + v.phase) * v.swayAmount;
        v.group.rotation.x = Math.cos(time * v.swaySpeed * 0.7 + v.phase) * v.swayAmount * 0.6;
      });

      // Висящие ягоды качаются на нитях
      hangingBerries.forEach((h) => {
        h.group.rotation.z = Math.sin(time * h.swaySpeed + h.phase) * h.swayAmount;
        h.group.rotation.x = Math.cos(time * h.swaySpeed * 0.7 + h.phase) * h.swayAmount * 0.5;
      });

      // Мерцание света ягод в листве
      lights.forEach((l, i) => {
        l.intensity = 0.5 + Math.sin(time * 0.8 + i * 0.5) * 0.1;
      });
    },

    dispose() {
      if (group.parent) group.parent.remove(group);
      group.traverse((o) => {
        if (o.geometry) o.geometry.dispose();
        if (o.material &&
            o.material !== materials.leaf) {
          if (Array.isArray(o.material)) o.material.forEach((m) => m.dispose());
          else o.material.dispose();
        }
      });
      stemMat.dispose();
      threadMat.dispose();
      leafDarkMat.dispose();
      leafMidMat.dispose();
      leafLightMat.dispose();
      leafPinkMat.dispose();
      berryMat.dispose();
      leafGeo.dispose();
      leafSmallGeo.dispose();
      berryGeo.dispose();
      threadBaseGeo.dispose();
      berryGlowTex.dispose();
    },
  };
}
