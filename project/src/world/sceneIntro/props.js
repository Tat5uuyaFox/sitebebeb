import * as THREE from 'three';
import { PALETTE } from './shared.js';

/* =========================================================
   PROPS — деревья, фонарь, камни, грибы
   =========================================================
   ФИНАЛЬНАЯ ВЕРСИЯ.

   Концепция (по референсу):
   - Деревья — массивные стволы из переплетённых корней
   - Корни у основания: главные + ветвления + мелкие + мох + камни
   - Крона — поток листвы, не шары
   - Фонарь висит на балке между стволами
   - Крупные валуны с мхом
   - Светящиеся грибы

   Убрано:
   - Плоские "шары" как крона
   - Одинокие палки-столбы
   - Пустые доски, висящие в воздухе
   - Слишком много грибов
   ========================================================= */

export function createProps(parent, materials, qualityLevel = 'high') {
  const group = new THREE.Group();
  parent.add(group);

  const isLow = qualityLevel === 'low';
  const isMedium = qualityLevel === 'medium';

  /* ==========================================================
     МАТЕРИАЛЫ
     ========================================================== */

  // Кора — тёмная, с bump
  const barkMat = new THREE.MeshStandardMaterial({
    color: 0x0a0806,
    map: materials.barkTex,
    bumpMap: materials.barkTex,
    bumpScale: 0.08,
    roughness: 0.95,
    flatShading: true,
    emissive: 0x0a0604,
    emissiveIntensity: 0.05,
  });

  // Листва — поток
  const leafDarkMat = new THREE.MeshStandardMaterial({
    map: materials.leafTex,
    color: 0x0a1a10,
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

  const leafPinkMat = new THREE.MeshStandardMaterial({
    map: materials.leafTex,
    color: 0x4a1a3a,
    emissive: 0xaa3a8a,
    emissiveIntensity: 0.6,
    side: THREE.DoubleSide,
    transparent: true,
    alphaTest: 0.1,
    opacity: 0.95,
    roughness: 0.75,
  });

  // Ягоды — тёплые
  const berryMat = new THREE.MeshStandardMaterial({
    color: 0x2a1000,
    emissive: 0xffa050,
    emissiveIntensity: 1.3,
    roughness: 0.4,
    metalness: 0.1,
    flatShading: true,
  });

  // Металл
  const ironMat = new THREE.MeshStandardMaterial({
    color: 0x0a0a0a,
    roughness: 0.7,
    metalness: 0.85,
    flatShading: true,
  });

  // Стекло фонаря
  const glassMat = new THREE.MeshStandardMaterial({
    color: 0x2a1000,
    emissive: PALETTE.gold,
    emissiveIntensity: 1.8,
    roughness: 0.2,
    metalness: 0.1,
    transparent: true,
    opacity: 0.9,
  });

  // Пламя
  const flameMat = new THREE.MeshBasicMaterial({
    color: 0xffeeaa,
    transparent: true,
    opacity: 0.95,
  });

  // Гриб — ножка
  const stemMat = new THREE.MeshStandardMaterial({
    color: 0x1a2028,
    roughness: 0.9,
  });

  /* ==========================================================
     ГЕОМЕТРИИ — общие
     ========================================================== */

  // Лист
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

  // Ягода
  const berryGeo = new THREE.IcosahedronGeometry(0.05, 1);

  /* ==========================================================
     ФУНКЦИЯ СОЗДАНИЯ ДЕРЕВА
     ========================================================== */
  function createTree(position, rotation, height, mirrored = false) {
    const treeGroup = new THREE.Group();
    treeGroup.position.set(position.x, position.y, position.z);
    treeGroup.rotation.y = rotation;
    group.add(treeGroup);

    const dir = mirrored ? -1 : 1;

    /* ============================================================
       КОРНИ У ОСНОВАНИЯ
       ============================================================ */
    const rootCount = isLow ? 5 : isMedium ? 7 : 9;
    const mainRootCurves = [];

    for (let r = 0; r < rootCount; r++) {
      const angle = (r / rootCount) * Math.PI * 2 + Math.random() * 0.4;
      const length = 1.8 + Math.random() * 1.2;
      const groundY = -0.3;

      // Кривая корня
      const points = [
        new THREE.Vector3(
          Math.cos(angle) * (length + 0.5),
          groundY - 0.4,
          Math.sin(angle) * (length + 0.5)
        ),
        new THREE.Vector3(
          Math.cos(angle) * (length * 0.8),
          groundY,
          Math.sin(angle) * (length * 0.8)
        ),
        new THREE.Vector3(
          Math.cos(angle + (Math.random() - 0.5) * 0.4) * (length * 0.5),
          groundY + 0.3,
          Math.sin(angle + (Math.random() - 0.5) * 0.4) * (length * 0.5)
        ),
        new THREE.Vector3(
          Math.cos(angle + (Math.random() - 0.5) * 0.3) * (length * 0.25),
          groundY + 0.9,
          Math.sin(angle + (Math.random() - 0.5) * 0.3) * (length * 0.25)
        ),
        new THREE.Vector3(0, 2.0, 0),
      ];

      const curve = new THREE.CatmullRomCurve3(points);
      const radius = 0.18 + Math.random() * 0.08;

      const tubeGeo = new THREE.TubeGeometry(curve, 16, radius, 6, false);

      const root = new THREE.Mesh(tubeGeo, barkMat);
      root.castShadow = true;
      root.receiveShadow = true;
      treeGroup.add(root);

      mainRootCurves.push({ curve, angle, length });

      // Ветвления
      const branchCount = 2 + Math.floor(Math.random() * 2);

      for (let b = 0; b < branchCount; b++) {
        const t = 0.3 + Math.random() * 0.4;
        const branchStart = curve.getPoint(t);

        const branchAngle = angle + (Math.random() - 0.5) * 1.8;
        const branchLength = 0.6 + Math.random() * 0.7;

        const branchPoints = [
          branchStart.clone(),
          new THREE.Vector3(
            branchStart.x + Math.cos(branchAngle) * branchLength * 0.5,
            branchStart.y + 0.1,
            branchStart.z + Math.sin(branchAngle) * branchLength * 0.5
          ),
          new THREE.Vector3(
            branchStart.x + Math.cos(branchAngle) * branchLength,
            branchStart.y - 0.1,
            branchStart.z + Math.sin(branchAngle) * branchLength
          ),
        ];

        const branchCurve = new THREE.CatmullRomCurve3(branchPoints);
        const branchGeo = new THREE.TubeGeometry(
          branchCurve, 8, radius * 0.5, 5, false
        );

        const branch = new THREE.Mesh(branchGeo, barkMat);
        branch.castShadow = true;
        treeGroup.add(branch);
      }
    }

    // Мелкие корешки
    const smallRootCount = isLow ? 10 : isMedium ? 18 : 26;

    for (let i = 0; i < smallRootCount; i++) {
      const angle = Math.random() * Math.PI * 2;
      const length = 0.5 + Math.random() * 1.0;

      const points = [
        new THREE.Vector3(0, 0.6 + Math.random() * 0.3, 0),
        new THREE.Vector3(
          Math.cos(angle + (Math.random() - 0.5) * 0.5) * length * 0.5,
          -0.1,
          Math.sin(angle + (Math.random() - 0.5) * 0.5) * length * 0.5
        ),
        new THREE.Vector3(
          Math.cos(angle) * length,
          -0.3 - Math.random() * 0.2,
          Math.sin(angle) * length
        ),
      ];

      const curve = new THREE.CatmullRomCurve3(points);
      const geo = new THREE.TubeGeometry(
        curve, 8, 0.04 + Math.random() * 0.02, 4, false
      );

      const root = new THREE.Mesh(geo, barkMat);
      root.castShadow = true;
      treeGroup.add(root);
    }

    // Мох на корнях
    const rootMossCount = isLow ? 6 : isMedium ? 12 : 20;

    for (let i = 0; i < rootMossCount; i++) {
      const root = mainRootCurves[Math.floor(Math.random() * mainRootCurves.length)];
      if (!root) continue;

      const t = 0.2 + Math.random() * 0.5;
      const point = root.curve.getPoint(t);

      const mossSize = 0.12 + Math.random() * 0.12;
      const mossGeo = new THREE.SphereGeometry(mossSize, 6, 5);
      const moss = new THREE.Mesh(mossGeo, materials.moss);

      const angleOffset = Math.random() * Math.PI * 2;
      moss.position.set(
        point.x + Math.cos(angleOffset) * 0.1,
        point.y + 0.08,
        point.z + Math.sin(angleOffset) * 0.1
      );

      moss.scale.set(1.4, 0.5, 1.4);
      moss.rotation.set(
        Math.random() * Math.PI,
        Math.random() * Math.PI,
        Math.random() * Math.PI
      );

      treeGroup.add(moss);
    }

    // Камни у основания
    const baseRockCount = isLow ? 2 : isMedium ? 4 : 6;

    for (let i = 0; i < baseRockCount; i++) {
      const angle = (i / baseRockCount) * Math.PI * 2 + Math.random() * 0.5;
      const dist = 1.2 + Math.random() * 0.8;

      const rockSize = 0.25 + Math.random() * 0.35;
      const rockGeo = new THREE.IcosahedronGeometry(rockSize, 1);

      const rpos = rockGeo.attributes.position.array;
      for (let j = 0; j < rpos.length; j += 3) {
        const n = Math.sin(rpos[j] * 4.5) * Math.cos(rpos[j+1] * 3.8);
        const scale = 1 + n * 0.2;
        rpos[j]     *= scale;
        rpos[j + 1] *= 1 + n * 0.1;
        rpos[j + 2] *= scale;
      }
      rockGeo.computeVertexNormals();

      const rock = new THREE.Mesh(rockGeo, materials.rock);
      rock.position.set(
        Math.cos(angle) * dist,
        -0.2,
        Math.sin(angle) * dist
      );
      rock.rotation.set(
        Math.random() * Math.PI,
        Math.random() * Math.PI,
        Math.random() * Math.PI
      );
      rock.castShadow = true;
      rock.receiveShadow = true;
      treeGroup.add(rock);
    }

    /* ============================================================
       СТВОЛ — массивный
       ============================================================ */
    const trunkGeo = new THREE.CylinderGeometry(0.38, 0.58, height, 10, 6);

    const tpos = trunkGeo.attributes.position.array;
    for (let i = 0; i < tpos.length; i += 3) {
      const y = tpos[i + 1];
      const noise = Math.sin(y * 1.5) * 0.08 + Math.cos(y * 2.3) * 0.05;

      tpos[i]     *= 1 + noise;
      tpos[i + 2] *= 1 + noise;
    }
    trunkGeo.computeVertexNormals();

    const trunk = new THREE.Mesh(trunkGeo, barkMat);
    trunk.position.y = height / 2;
    trunk.castShadow = true;
    trunk.receiveShadow = true;
    treeGroup.add(trunk);

    // Второй ствол — тоньше
    const trunk2Geo = new THREE.CylinderGeometry(0.2, 0.32, height * 0.9, 6, 4);
    const trunk2 = new THREE.Mesh(trunk2Geo, barkMat);
    trunk2.position.set(0.5 * dir, height * 0.45, 0.2);
    trunk2.rotation.z = -0.08 * dir;
    trunk2.castShadow = true;
    treeGroup.add(trunk2);

    /* ============================================================
       ДУПЛО в стволе
       ============================================================ */
    if (!isLow) {
      const hollowGeo = new THREE.SphereGeometry(0.4, 8, 6);
      const hollowMat = new THREE.MeshBasicMaterial({ color: 0x000000 });
      const hollow = new THREE.Mesh(hollowGeo, hollowMat);
      hollow.position.set(0.3 * dir, height * 0.4, 0.3);
      hollow.scale.set(0.7, 1.6, 0.5);
      treeGroup.add(hollow);
    }

    /* ============================================================
       МОХ по стволу
       ============================================================ */
    const stemMossCount = isLow ? 8 : isMedium ? 15 : 22;

    for (let i = 0; i < stemMossCount; i++) {
      const mossGeo = new THREE.SphereGeometry(0.1 + Math.random() * 0.15, 6, 5);
      const moss = new THREE.Mesh(mossGeo, materials.moss);

      const angle = Math.random() * Math.PI * 2;
      const y = Math.random() * height;
      const trunkRadius = 0.5 - (y / height) * 0.1;

      moss.position.set(
        Math.cos(angle) * trunkRadius,
        y,
        Math.sin(angle) * trunkRadius
      );

      moss.scale.set(1.5, 0.5, 1.5);
      moss.rotation.set(
        Math.random() * Math.PI,
        Math.random() * Math.PI,
        Math.random() * Math.PI
      );

      treeGroup.add(moss);
    }

    /* ============================================================
       КРОНА — поток листвы
       ============================================================ */
    const crownCount = isLow ? 18 : isMedium ? 28 : 42;

    for (let i = 0; i < crownCount; i++) {
      const angle = Math.random() * Math.PI * 2;
      const r = 0.25 + Math.random() * 1.25;
      const y = height - 0.6 + Math.random() * 1.6;

      const leaf = new THREE.Mesh(
        leafGeo,
        Math.random() < 0.7 ? leafDarkMat : leafMidMat
      );
      leaf.position.set(
        Math.cos(angle) * r + 0.5 * dir,
        y,
        Math.sin(angle) * r
      );
      leaf.rotation.set(
        Math.random() * Math.PI,
        Math.random() * Math.PI,
        Math.random() * Math.PI
      );

      const size = 0.45 + Math.random() * 0.45;
      leaf.scale.set(size, size, 1);

      treeGroup.add(leaf);
    }

    // Розовые листья — редкие акценты
    if (!isLow && Math.random() < 0.2) {
      for (let i = 0; i < 3; i++) {
        const angle = Math.random() * Math.PI * 2;
        const r = 0.5 + Math.random() * 1.5;
        const y = height - 0.5 + Math.random() * 1.8;

        const leaf = new THREE.Mesh(leafGeo, leafPinkMat);
        leaf.position.set(
          Math.cos(angle) * r + 0.5 * dir,
          y,
          Math.sin(angle) * r
        );
        leaf.rotation.set(
          Math.random() * Math.PI,
          Math.random() * Math.PI,
          Math.random() * Math.PI
        );
        const size = 0.6 + Math.random() * 0.5;
        leaf.scale.set(size, size, 1);
        treeGroup.add(leaf);
      }
    }

    // Ягоды в кроне
    if (Math.random() < 0.5) {
      const berryCount = 3 + Math.floor(Math.random() * 4);

      for (let i = 0; i < berryCount; i++) {
        const angle = Math.random() * Math.PI * 2;
        const r = 0.5 + Math.random() * 1.5;
        const y = height + Math.random() * 1;

        const berry = new THREE.Mesh(berryGeo, berryMat);
        berry.position.set(
          Math.cos(angle) * r + 0.5 * dir,
          y,
          Math.sin(angle) * r
        );
        treeGroup.add(berry);
      }
    }

    return { group: treeGroup, height, dir };
  }

  /* ==========================================================
     ЛЕВОЕ ДЕРЕВО — большое, с фонарём
     ========================================================== */
  const leftTree = createTree(
    { x: -9.5, y: -5.5, z: 5 },
    0.2,
    8,
    false
  );

  /* ==========================================================
     ПРАВОЕ ДЕРЕВО — дальше, меньше
     ========================================================== */
  const rightTree = createTree(
    { x: 7.5, y: -5.5, z: -3 },
    -0.3,
    6.5,
    true
  );

  /* ==========================================================
     ФОНАРЬ на балке
     ========================================================== */
  const lanternGroup = new THREE.Group();
  lanternGroup.position.set(3.0, 5.5, 0);
  leftTree.group.add(lanternGroup);

  // Timber entrance frame: a warm, readable left-side foreground landmark.
  const entranceFrame = new THREE.Group();
  entranceFrame.position.set(-7.7, -5.5, 4.7);
  group.add(entranceFrame);
  const postGeo = new THREE.BoxGeometry(0.24, 4.8, 0.28);
  [-1.45, 1.45].forEach((x) => {
    const post = new THREE.Mesh(postGeo, barkMat);
    post.position.set(x, 2.4, 0);
    post.rotation.z = x < 0 ? -0.035 : 0.035;
    post.castShadow = true;
    entranceFrame.add(post);
  });
  const lintel = new THREE.Mesh(new THREE.BoxGeometry(3.25, 0.32, 0.34), barkMat);
  lintel.position.set(0, 4.65, 0);
  lintel.castShadow = true;
  entranceFrame.add(lintel);
  [-1, 1].forEach((side) => {
    const brace = new THREE.Mesh(new THREE.BoxGeometry(0.18, 1.45, 0.22), barkMat);
    brace.position.set(side * 1.1, 3.95, 0);
    brace.rotation.z = -side * 0.55;
    entranceFrame.add(brace);
  });

  // Балка
  const beamGeo = new THREE.BoxGeometry(2.2, 0.15, 0.15);
  const beam = new THREE.Mesh(beamGeo, barkMat);
  beam.position.set(-0.8, 0.5, 0);
  beam.castShadow = true;
  lanternGroup.add(beam);

  // Цепь
  for (let i = 0; i < 6; i++) {
    const ringGeo = new THREE.TorusGeometry(0.025, 0.008, 4, 8);
    const ring = new THREE.Mesh(ringGeo, ironMat);
    ring.position.y = 0.4 - i * 0.06;
    ring.rotation.x = Math.PI / 2;
    if (i % 2 === 0) ring.rotation.z = Math.PI / 2;
    lanternGroup.add(ring);
  }

  // Верхний конус
  const topConeGeo = new THREE.ConeGeometry(0.18, 0.22, 8);
  const topCone = new THREE.Mesh(topConeGeo, ironMat);
  topCone.position.y = 0.0;
  topCone.castShadow = true;
  lanternGroup.add(topCone);

  // Кольцо подвеса
  const topRingGeo = new THREE.TorusGeometry(0.04, 0.012, 6, 12);
  const topRing = new THREE.Mesh(topRingGeo, ironMat);
  topRing.rotation.x = Math.PI / 2;
  topRing.position.y = 0.13;
  lanternGroup.add(topRing);

  // 8 рёбер
  for (let i = 0; i < 8; i++) {
    const angle = (i / 8) * Math.PI * 2;
    const ribGeo = new THREE.BoxGeometry(0.015, 0.4, 0.015);
    const rib = new THREE.Mesh(ribGeo, ironMat);
    rib.position.set(
      Math.cos(angle) * 0.14,
      -0.2,
      Math.sin(angle) * 0.14
    );
    rib.rotation.y = angle;
    lanternGroup.add(rib);
  }

  // Обручи
  const bandGeo = new THREE.TorusGeometry(0.15, 0.008, 4, 12);
  const band1 = new THREE.Mesh(bandGeo, ironMat);
  band1.rotation.x = Math.PI / 2;
  band1.position.y = -0.4;
  lanternGroup.add(band1);

  const band2 = new THREE.Mesh(bandGeo, ironMat);
  band2.rotation.x = Math.PI / 2;
  band2.position.y = 0.0;
  lanternGroup.add(band2);

  // Стекло
  const glassGeo = new THREE.CylinderGeometry(0.13, 0.13, 0.4, 12);
  const glass = new THREE.Mesh(glassGeo, glassMat);
  glass.position.y = -0.2;
  lanternGroup.add(glass);

  // Нижняя крышка
  const bottomGeo = new THREE.ConeGeometry(0.16, 0.1, 8);
  const bottom = new THREE.Mesh(bottomGeo, ironMat);
  bottom.rotation.x = Math.PI;
  bottom.position.y = -0.45;
  lanternGroup.add(bottom);

  // Пламя
  const flame = new THREE.Mesh(
    new THREE.SphereGeometry(0.05, 8, 8),
    flameMat
  );
  flame.position.y = -0.2;
  flame.scale.set(1, 1.6, 1);
  lanternGroup.add(flame);

  // Свет
  const light = new THREE.PointLight(PALETTE.gold, 5.6, 10, 1.6);
  light.position.y = -0.2;
  // Point-light cube shadows produced harsh, blocky shadow patches in the cave.
  // Keep the lantern as a warm local fill and let the scene's ambient occlusion read from geometry.
  light.castShadow = false;
  lanternGroup.add(light);

  // Ореолы
  const halo = new THREE.Sprite(
    new THREE.SpriteMaterial({
      map: materials.glowTex,
      color: PALETTE.gold,
      transparent: true,
      opacity: 0.4,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    })
  );
  halo.scale.set(1.8, 1.8, 1);
  halo.position.y = -0.2;
  lanternGroup.add(halo);

  const innerHalo = new THREE.Sprite(
    new THREE.SpriteMaterial({
      map: materials.glowTex,
      color: PALETTE.goldLight,
      transparent: true,
      opacity: 0.5,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    })
  );
  innerHalo.scale.set(1.0, 1.0, 1);
  innerHalo.position.y = -0.2;
  lanternGroup.add(innerHalo);

  // Мотыльки
  const mothCount = isLow ? 3 : isMedium ? 6 : 10;
  const mothGeo = new THREE.BufferGeometry();
  const mothPos = new Float32Array(mothCount * 3);
  const mothData = [];

  for (let i = 0; i < mothCount; i++) {
    mothData.push({
      radius: 0.2 + Math.random() * 0.3,
      angle: Math.random() * Math.PI * 2,
      speed: 0.6 + Math.random() * 1.2,
      yPhase: Math.random() * Math.PI * 2,
      ySpeed: 0.8 + Math.random() * 1.0,
      yAmp: 0.05 + Math.random() * 0.08,
    });
  }
  mothGeo.setAttribute('position', new THREE.BufferAttribute(mothPos, 3));

  const mothMat = new THREE.PointsMaterial({
    size: 0.04,
    map: materials.glowTex,
    color: PALETTE.goldLight,
    transparent: true,
    opacity: 0.9,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
  });
  const moths = new THREE.Points(mothGeo, mothMat);
  moths.position.y = -0.2;
  lanternGroup.add(moths);

  /* ==========================================================
     БОЛЬШИЕ ВАЛУНЫ
     ========================================================== */
  const rockPositions = [
    { x: -3.2, z: 2.5, size: 1.6, mossAmount: 'many' },
    { x: 3.4,  z: 1.0, size: 1.4, mossAmount: 'medium' },
    { x: -3.8, z: -1.0, size: 1.7, mossAmount: 'many' },
    { x: 4.2,  z: -2.5, size: 1.5, mossAmount: 'medium' },
  ].slice(0, isLow ? 2 : isMedium ? 3 : 4);

  const rocks = [];

  rockPositions.forEach((spot) => {
    const rockGroup = new THREE.Group();
    rockGroup.position.set(spot.x, -5.5, spot.z);
    rockGroup.rotation.y = Math.random() * Math.PI * 2;
    group.add(rockGroup);

    const geo = new THREE.IcosahedronGeometry(spot.size, 2);
    const pos = geo.attributes.position.array;

    for (let j = 0; j < pos.length; j += 3) {
      const n = Math.sin(pos[j] * 3.7) * Math.cos(pos[j+1] * 2.9) * Math.sin(pos[j+2] * 4.1);
      const scale = 1 + n * 0.2;

      pos[j]     *= scale;
      pos[j + 1] *= 1 + n * 0.15;
      pos[j + 2] *= scale;
    }
    geo.computeVertexNormals();

    const rock = new THREE.Mesh(geo, materials.rock);
    rock.position.y = spot.size * 0.4;
    rock.rotation.set(
      Math.random() * Math.PI,
      Math.random() * Math.PI,
      Math.random() * Math.PI
    );
    rock.castShadow = true;
    rock.receiveShadow = true;
    rockGroup.add(rock);

    const mossCount = spot.mossAmount === 'many' ? 8 : 4;
    for (let m = 0; m < mossCount; m++) {
      const mossSize = spot.size * (0.25 + Math.random() * 0.2);
      const mossGeo = new THREE.SphereGeometry(mossSize, 6, 5);
      const moss = new THREE.Mesh(mossGeo, materials.moss);

      const angle = Math.random() * Math.PI * 2;
      const r = spot.size * 0.5 * Math.random();

      moss.position.set(
        Math.cos(angle) * r,
        spot.size * (0.7 + Math.random() * 0.4),
        Math.sin(angle) * r
      );
      moss.scale.set(1, 0.5, 1);
      moss.rotation.set(
        Math.random() * Math.PI,
        Math.random() * Math.PI,
        Math.random() * Math.PI
      );
      rockGroup.add(moss);
    }

    rocks.push(rockGroup);
  });

  /* ==========================================================
     ГРИБЫ
     ========================================================== */
  const mushroomCount = isLow ? 3 : isMedium ? 5 : 8;
  const mushrooms = [];

  // Fixed little colonies frame the trail without spilling into its center:
  // warm caps sit by the lantern and stream; the cooler ones lead the eye back.
  const mushroomSpots = [
    { x: -4.65, z: 3.0, scale: 0.72, warm: true },
    { x: -4.05, z: 2.25, scale: 0.54, warm: true },
    { x: -4.75, z: 1.55, scale: 0.43, warm: false },
    { x: 4.15, z: 0.65, scale: 0.76, warm: true },
    { x: 4.85, z: -0.05, scale: 0.58, warm: true },
    { x: 3.75, z: -0.65, scale: 0.42, warm: false },
    { x: -2.85, z: -5.9, scale: 0.46, warm: false },
    { x: 2.65, z: -7.0, scale: 0.4, warm: true },
  ];

  for (let i = 0; i < mushroomCount; i++) {
    const spot = mushroomSpots[i];
    const { x, z, scale } = spot;
    const isWarm = spot.warm;
    const color = isWarm ? PALETTE.gold : 0x6affc8;

    const mg = new THREE.Group();
    mg.position.set(x, -5.5, z);
    mg.rotation.y = i * 0.83;
    mg.scale.setScalar(scale);
    group.add(mg);

    const stemGeo = new THREE.CylinderGeometry(0.05, 0.08, 0.5, 6);
    const stem = new THREE.Mesh(stemGeo, stemMat);
    stem.position.y = 0.25;
    mg.add(stem);

    const capGeo = new THREE.SphereGeometry(
      0.25, 12, 10, 0, Math.PI * 2, 0, Math.PI * 0.6
    );
    const capMat = new THREE.MeshStandardMaterial({
      color: isWarm ? 0x5a3a2a : 0x2a4a4a,
      emissive: color,
      emissiveIntensity: 0.6,
      roughness: 0.6,
    });
    const cap = new THREE.Mesh(capGeo, capMat);
    cap.position.y = 0.5;
    mg.add(cap);

    const gillsGeo = new THREE.CircleGeometry(0.23, 16);
    const gillsMat = new THREE.MeshBasicMaterial({
      color,
      transparent: true,
      opacity: 0.8,
      side: THREE.DoubleSide,
    });
    const gills = new THREE.Mesh(gillsGeo, gillsMat);
    gills.rotation.x = -Math.PI / 2;
    gills.position.y = 0.47;
    mg.add(gills);

    const mgLight = new THREE.PointLight(color, 0.2, 1.5, 2);
    mgLight.position.y = 0.5;
    mg.add(mgLight);

    mushrooms.push({
      group: mg,
      light: mgLight,
      gillsMat,
      capMat,
      phase: Math.random() * Math.PI * 2,
      pulseSpeed: 0.5 + Math.random() * 0.6,
    });
  }

  /* ==========================================================
     API
     ========================================================== */
  return {
    group,

    update(time) {
      const flicker = 0.9 + Math.sin(time * 13.0) * 0.05
                            + Math.sin(time * 7.3) * 0.05;

      light.intensity = 5.6 * flicker;
      flameMat.opacity = 0.85 + flicker * 0.15;
      flame.scale.set(1, 1.6 + flicker * 0.25, 1);

      halo.material.opacity = 0.35 + flicker * 0.1;
      halo.scale.setScalar(1.7 + flicker * 0.12);
      innerHalo.material.opacity = 0.45 + flicker * 0.15;
      innerHalo.scale.setScalar(0.95 + flicker * 0.1);

      glassMat.emissiveIntensity = 1.6 + flicker * 0.4;

      // Мотыльки
      const pos = mothGeo.attributes.position.array;
      for (let i = 0; i < mothCount; i++) {
        const d = mothData[i];
        d.angle += d.speed * (1 / 60);
        pos[i * 3]     = Math.cos(d.angle) * d.radius;
        pos[i * 3 + 1] = Math.sin(time * d.ySpeed + d.yPhase) * d.yAmp;
        pos[i * 3 + 2] = Math.sin(d.angle) * d.radius;
      }
      mothGeo.attributes.position.needsUpdate = true;

      // Грибы
      mushrooms.forEach((m) => {
        const pulse = 0.7 + Math.sin(time * m.pulseSpeed + m.phase) * 0.3;
        m.light.intensity = 0.2 * pulse;
        m.gillsMat.opacity = 0.6 + pulse * 0.3;
        m.capMat.emissiveIntensity = 0.5 + pulse * 0.3;
      });
    },

    dispose() {
      if (group.parent) group.parent.remove(group);
      group.traverse((o) => {
        if (o.geometry) o.geometry.dispose();
        if (o.material &&
            o.material !== materials.bark &&
            o.material !== materials.moss &&
            o.material !== materials.rock &&
            o.material !== materials.leaf) {
          if (Array.isArray(o.material)) o.material.forEach((m) => m.dispose());
          else o.material.dispose();
        }
      });
      mothGeo.dispose();
      mothMat.dispose();
    },
  };
}
