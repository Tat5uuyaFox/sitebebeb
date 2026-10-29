import * as THREE from 'three';
import { PALETTE } from './shared.js';
import { getQualityConfig } from '../../core/quality.js';

export function createRocks(parent, materials, qualityLevel = 'high') {
  const q = getQualityConfig(qualityLevel);
  const group = new THREE.Group();
  parent.add(group);

  /* --- Крупные формации (одинаково для всех) --- */
  const bigSpots = [
    { x: -3.8, z: 3.5, s: 1.6 }, { x: 3.9, z: 3.8, s: 1.7 },
    { x: -5.5, z: 2.0, s: 1.5 }, { x: 5.7, z: 2.2, s: 1.6 },
    { x: -2.0, z: 5.0, s: 1.2 }, { x: 2.2, z: 5.2, s: 1.3 },
    { x: -7.0, z: 4.0, s: 1.7 }, { x: 7.2, z: 4.2, s: 1.6 },
    { x: -6.5, z: -1.5, s: 2.0 }, { x: 6.7, z: -1.8, s: 2.1 },
    { x: -4.0, z: -4.0, s: 1.8 }, { x: 4.2, z: -4.2, s: 1.9 },
    { x: 0, z: -5.0, s: 2.2 }, { x: -8.5, z: 0.5, s: 2.5 },
    { x: 8.6, z: 0.5, s: 2.4 }, { x: -7.5, z: -3.5, s: 2.0 },
    { x: 7.7, z: -3.8, s: 1.9 },
  ];

  // На low — оставляем только половину
  const activeBig = qualityLevel === 'low' ? bigSpots.slice(0, 8) : bigSpots;

  activeBig.forEach((spot) => {
    const fg = new THREE.Group();
    fg.position.set(spot.x, -5.5, spot.z);
    fg.rotation.y = Math.random() * Math.PI * 2;
    group.add(fg);

    const rockCount = qualityLevel === 'low' ? 1 : (2 + Math.floor(Math.random() * 3));
    for (let r = 0; r < rockCount; r++) {
      const size = spot.s * (0.5 + Math.random() * 0.5);
      const geo = new THREE.DodecahedronGeometry(size, 0);
      const pos = geo.attributes.position.array;
      for (let j = 0; j < pos.length; j += 3) {
        pos[j]     *= 0.9 + Math.random() * 0.25;
        pos[j + 1] *= 0.9 + Math.random() * 0.25;
        pos[j + 2] *= 0.9 + Math.random() * 0.25;
      }
      geo.computeVertexNormals();

      const rock = new THREE.Mesh(geo, materials.rockDark);
      rock.position.set(
        (Math.random() - 0.5) * spot.s * 0.7,
        size * 0.4 + Math.random() * 0.3,
        (Math.random() - 0.5) * spot.s * 0.7
      );
      rock.rotation.set(
        Math.random() * Math.PI, Math.random() * Math.PI, Math.random() * Math.PI
      );
      rock.castShadow = q.shadows;
      rock.receiveShadow = q.shadows;
      fg.add(rock);
    }
  });

  /* --- Дальние силуэты --- */
  const farSpots = [
    { x: -10, z: -7, s: 3.0 }, { x: 10, z: -7.2, s: 2.9 },
    { x: 0, z: -10, s: 3.4 }, { x: -7, z: -9, s: 2.6 },
    { x: 7, z: -9.2, s: 2.5 }, { x: -11, z: -2, s: 2.4 },
    { x: 11, z: -2.2, s: 2.3 }, { x: -12, z: 2, s: 2.2 },
  ];

  farSpots.forEach((spot) => {
    const geo = new THREE.DodecahedronGeometry(spot.s, 0);
    const rock = new THREE.Mesh(geo, materials.rockDark);
    rock.position.set(spot.x, -5.5 + spot.s * 0.4, spot.z);
    rock.rotation.set(Math.random() * Math.PI, Math.random() * Math.PI, Math.random() * Math.PI);
    group.add(rock);
  });

  /* --- Галька — количество из конфига качества --- */
  const pebbleCount = q.pebbleCount;
  const pebbleGeo = new THREE.DodecahedronGeometry(1, 0);
  const pebbleMat = new THREE.MeshStandardMaterial({
    color: PALETTE.rock,
    roughness: 0.95,
    flatShading: true,
    emissive: 0x050a12,
    emissiveIntensity: 0.15,
  });

  const pebbles = new THREE.InstancedMesh(pebbleGeo, pebbleMat, pebbleCount);
  const matrix = new THREE.Matrix4();
  const quat = new THREE.Quaternion();
  const pos3 = new THREE.Vector3();
  const scl = new THREE.Vector3();

  for (let i = 0; i < pebbleCount; i++) {
    const angle = Math.random() * Math.PI * 2;
    const r = 1 + Math.random() * 14;
    const size = 0.04 + Math.random() * 0.18;
    pos3.set(Math.cos(angle) * r, -5.5 + size * 0.3, Math.sin(angle) * r);
    quat.setFromEuler(new THREE.Euler(
      Math.random() * Math.PI, Math.random() * Math.PI, Math.random() * Math.PI
    ));
    scl.set(size * (0.8 + Math.random() * 0.5), size * (0.5 + Math.random() * 0.5), size * (0.8 + Math.random() * 0.5));
    matrix.compose(pos3, quat, scl);
    pebbles.setMatrixAt(i, matrix);
  }
  pebbles.instanceMatrix.needsUpdate = true;
  pebbles.castShadow = q.shadows;
  pebbles.receiveShadow = q.shadows;
  group.add(pebbles);

  /* --- Плиты --- */
  const slabCount = q.slabCount;
  if (slabCount > 0) {
    const slabGeo = new THREE.CylinderGeometry(1, 1.1, 0.5, 8);
    const slabs = new THREE.InstancedMesh(slabGeo, pebbleMat.clone(), slabCount);
    for (let i = 0; i < slabCount; i++) {
      const angle = Math.random() * Math.PI * 2;
      const r = Math.random() * 12;
      const size = 0.3 + Math.random() * 0.6;
      pos3.set(Math.cos(angle) * r, -5.45, Math.sin(angle) * r);
      quat.setFromEuler(new THREE.Euler(0, Math.random() * Math.PI * 2, 0));
      scl.set(size, 0.1, size);
      matrix.compose(pos3, quat, scl);
      slabs.setMatrixAt(i, matrix);
    }
    slabs.instanceMatrix.needsUpdate = true;
    slabs.receiveShadow = q.shadows;
    group.add(slabs);
  }

  return {
    group,
    update() {},
    dispose() {
      pebbleGeo.dispose();
      pebbleMat.dispose();
      if (group.parent) group.parent.remove(group);
      group.traverse((o) => {
        if (o.geometry) o.geometry.dispose();
        if (o.material && o.material !== pebbleMat) {
          if (Array.isArray(o.material)) o.material.forEach((x) => x.dispose());
          else o.material.dispose();
        }
      });
    },
  };
}