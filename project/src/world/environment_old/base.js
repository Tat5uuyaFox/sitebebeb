import * as THREE from 'three';
import { PALETTE, TEXTURES } from './shared.js';

/* =========================================================
   BASE — пол и стены пещеры
   ========================================================= */
export function createBase(parent, materials) {
  const group = new THREE.Group();
  parent.add(group);

  /* ---------- ПОЛ ---------- */
  const floorGeo = new THREE.CircleGeometry(40, 64);
  const floor = new THREE.Mesh(floorGeo, materials.mossFloor);
  floor.rotation.x = -Math.PI / 2;
  floor.position.y = -5.5;
  floor.receiveShadow = true;
  group.add(floor);

  /* ---------- СТЕНЫ-КУПОЛ ---------- */
  const wallGeo = new THREE.CylinderGeometry(26, 30, 45, 40, 14, true);
  const pos = wallGeo.attributes.position.array;
  for (let i = 0; i < pos.length; i += 3) {
    const x = pos[i], y = pos[i + 1], z = pos[i + 2];
    const angle = Math.atan2(z, x);
    const noise =
      Math.sin(angle * 3 + y * 0.4) * 1.5 +
      Math.cos(angle * 8 - y * 0.3) * 0.7 +
      Math.sin(angle * 17 + y * 1.3) * 0.35 +
      Math.cos(angle * 23 + y * 2.1) * 0.2;
    pos[i]     += noise * 1.5;
    pos[i + 2] += noise * 1.5;
    if (y > 5) {
      const shrink = 1 - (y - 5) / 30 * 0.6;
      pos[i]     *= shrink;
      pos[i + 2] *= shrink;
    }
  }
  wallGeo.computeVertexNormals();

  const wallMat = new THREE.MeshStandardMaterial({
    color: 0x060e14,
    map: materials.moss.map,
    roughness: 1.0,
    side: THREE.BackSide,
    flatShading: true,
    emissive: 0x0a1020,
    emissiveIntensity: 0.08,
  });
  const wall = new THREE.Mesh(wallGeo, wallMat);
  wall.position.y = -5;
  wall.receiveShadow = true;
  group.add(wall);

  return {
    group,
    floor,
    wall,
    update() {},  // статичные
    dispose() {
      floorGeo.dispose();
      wallGeo.dispose();
      wallMat.dispose();
      if (group.parent) group.parent.remove(group);
    },
  };
}