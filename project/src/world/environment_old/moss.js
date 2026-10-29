import * as THREE from 'three';
import { PALETTE, TEXTURES } from './shared.js';

export function createMoss(parent, materials) {
  const group = new THREE.Group();
  parent.add(group);

  // Мох-подушки: 200 штук instanced
  const count = 200;
  const geo = new THREE.SphereGeometry(1, 8, 6);
  const mat = new THREE.MeshStandardMaterial({
    color: PALETTE.mossDark,
    map: materials.moss.map,
    roughness: 0.95,
    emissive: PALETTE.moss,
    emissiveIntensity: 0.25,
    flatShading: true,
  });

  const meshes = new THREE.InstancedMesh(geo, mat, count);
  const matrix = new THREE.Matrix4();
  const pos = new THREE.Vector3();
  const quat = new THREE.Quaternion();
  const scl = new THREE.Vector3();

  for (let i = 0; i < count; i++) {
    const angle = Math.random() * Math.PI * 2;
    const r = 1 + Math.random() * 12;
    const size = 0.15 + Math.random() * 0.5;

    pos.set(Math.cos(angle) * r, -5.5 + size * 0.4, Math.sin(angle) * r);
    quat.setFromEuler(new THREE.Euler(0, Math.random() * Math.PI * 2, 0));
    scl.set(size * 1.4, size * 0.5, size * 1.4);

    matrix.compose(pos, quat, scl);
    meshes.setMatrixAt(i, matrix);
  }
  meshes.instanceMatrix.needsUpdate = true;
  meshes.castShadow = true;
  meshes.receiveShadow = true;
  group.add(meshes);

  return {
    group,
    update(time) {
      mat.emissiveIntensity = 0.2 + Math.sin(time * 0.6) * 0.08;
    },
    dispose() {
      geo.dispose();
      mat.dispose();
      if (group.parent) group.parent.remove(group);
    },
  };
}