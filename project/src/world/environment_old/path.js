import * as THREE from 'three';

/* =========================================================
   PATH — каменная дорожка через сцену
   =========================================================
   Не просто плиты — а неровная тропинка из плит, гальки
   и мха. Ведёт взгляд пользователя вглубь пещеры.
   Заменяет «playable area» из композиции.
   ========================================================= */
export function createPath(parent, materials, qualityLevel = 'high') {
  const group = new THREE.Group();
  parent.add(group);

  const tileCount = qualityLevel === 'low' ? 10 : 18;
  const pathLength = 16;   // от z=8 до z=-8
  const curves = 0.6;      // амплитуда изгиба

  /* --- Основные плиты --- */
  const tiles = [];
  for (let i = 0; i < tileCount; i++) {
    const t = i / (tileCount - 1);

    // Изгиб дорожки — синусоида
    const x = Math.sin(t * Math.PI * 1.5) * curves;
    const z = 8 - t * pathLength;

    const size = 0.35 + Math.random() * 0.25;

    // Неровная плита — берём цилиндр и искажаем
    const geo = new THREE.CylinderGeometry(size, size * 1.05, 0.12, 8);
    const pos = geo.attributes.position.array;
    for (let j = 0; j < pos.length; j += 3) {
      // Лёгкое искажение вершины
      pos[j]     *= 0.85 + Math.random() * 0.3;
      pos[j + 2] *= 0.85 + Math.random() * 0.3;
    }
    geo.computeVertexNormals();

    const tileMat = new THREE.MeshStandardMaterial({
      color: 0x1a1a14,
      roughness: 0.92,
      metalness: 0.08,
      flatShading: true,
      emissive: 0x0a0a06,
      emissiveIntensity: 0.15,
    });

    const tile = new THREE.Mesh(geo, tileMat);
    tile.position.set(x, -5.45, z);
    tile.rotation.y = Math.random() * Math.PI;
    tile.receiveShadow = true;
    group.add(tile);

    // Мох по краям плиты
    if (Math.random() < 0.7) {
      const mossSize = size * (1.0 + Math.random() * 0.4);
      const mossGeo = new THREE.RingGeometry(mossSize * 0.9, mossSize * 1.15, 12);
      const mossMat = new THREE.MeshStandardMaterial({
        color: 0x0a2a15,
        roughness: 0.95,
        emissive: 0x1a5a3a,
        emissiveIntensity: 0.25,
        side: THREE.DoubleSide,
      });
      const moss = new THREE.Mesh(mossGeo, mossMat);
      moss.rotation.x = -Math.PI / 2;
      moss.position.set(x, -5.42, z);
      group.add(moss);
    }

    tiles.push({ x, z, size });
  }

  /* --- Мелкая галька вокруг плит --- */
  const pebbleCount = qualityLevel === 'low' ? 60 : 200;
  const pebbleGeo = new THREE.DodecahedronGeometry(1, 0);
  const pebbleMat = new THREE.MeshStandardMaterial({
    color: 0x14140c,
    roughness: 0.95,
    flatShading: true,
  });
  const pebbles = new THREE.InstancedMesh(pebbleGeo, pebbleMat, pebbleCount);
  const matrix = new THREE.Matrix4();
  const quat = new THREE.Quaternion();
  const pos3 = new THREE.Vector3();
  const scl = new THREE.Vector3();

  for (let i = 0; i < pebbleCount; i++) {
    // Скалы вокруг тропинки
    const t = Math.random();
    const curveX = Math.sin(t * Math.PI * 1.5) * curves;
    const baseZ = 8 - t * pathLength;

    const offsetX = (Math.random() - 0.5) * 1.5;
    const offsetZ = (Math.random() - 0.5) * 0.5;

    const size = 0.04 + Math.random() * 0.12;
    pos3.set(curveX + offsetX, -5.5 + size * 0.3, baseZ + offsetZ);
    quat.setFromEuler(new THREE.Euler(
      Math.random() * Math.PI, Math.random() * Math.PI, Math.random() * Math.PI
    ));
    scl.set(size, size * 0.7, size);
    matrix.compose(pos3, quat, scl);
    pebbles.setMatrixAt(i, matrix);
  }
  pebbles.instanceMatrix.needsUpdate = true;
  group.add(pebbles);

  /* --- Мелкие грибы вдоль дорожки --- */
  const mushroomCount = qualityLevel === 'low' ? 8 : 20;
  for (let i = 0; i < mushroomCount; i++) {
    const t = Math.random();
    const curveX = Math.sin(t * Math.PI * 1.5) * curves;
    const baseZ = 8 - t * pathLength;

    const side = Math.random() < 0.5 ? -1 : 1;
    const offsetX = side * (0.4 + Math.random() * 0.6);

    const x = curveX + offsetX;
    const z = baseZ + (Math.random() - 0.5) * 0.5;

    // Мелкий светящийся гриб
    const mgGroup = new THREE.Group();
    mgGroup.position.set(x, -5.5, z);
    mgGroup.scale.setScalar(0.4 + Math.random() * 0.4);
    group.add(mgGroup);

    const isWarm = Math.random() < 0.6;
    const color = isWarm ? 0xffa860 : 0x6affc8;

    const stem = new THREE.Mesh(
      new THREE.CylinderGeometry(0.06, 0.1, 0.5, 8),
      new THREE.MeshStandardMaterial({
        color: 0x1a2028,
        roughness: 0.9,
        emissive: 0x0a1018,
        emissiveIntensity: 0.3,
      })
    );
    stem.position.y = 0.25;
    mgGroup.add(stem);

    const cap = new THREE.Mesh(
      new THREE.SphereGeometry(0.3, 14, 10, 0, Math.PI * 2, 0, Math.PI * 0.55),
      new THREE.MeshStandardMaterial({
        color: isWarm ? 0x5a3a2a : 0x2a4a4a,
        emissive: color,
        emissiveIntensity: 0.6,
        roughness: 0.6,
      })
    );
    cap.position.y = 0.55;
    mgGroup.add(cap);

    const gills = new THREE.Mesh(
      new THREE.CircleGeometry(0.28, 16),
      new THREE.MeshBasicMaterial({
        color,
        transparent: true,
        opacity: 0.95,
        side: THREE.DoubleSide,
      })
    );
    gills.rotation.x = -Math.PI / 2;
    gills.position.y = 0.52;
    mgGroup.add(gills);

    const light = new THREE.PointLight(color, 0.4, 1.8, 2);
    light.position.y = 0.5;
    mgGroup.add(light);
  }

  return {
    group,
    update() {},
    dispose() {
      if (group.parent) group.parent.remove(group);
      group.traverse((o) => {
        if (o.geometry) o.geometry.dispose();
        if (o.material) {
          if (Array.isArray(o.material)) o.material.forEach((m) => m.dispose());
          else o.material.dispose();
        }
      });
    },
  };
}