import * as THREE from 'three';
import { PALETTE } from './shared.js';

export function createCrystals(parent, materials) {
  const group = new THREE.Group();
  parent.add(group);

  const crystals = [];

  /* ==========================================================
     БОЛЬШИЕ КРИСТАЛЛЫ (12) — герои
     ========================================================== */
  const bigSpots = [
    { x: -4.5, z: 2.0, h: 1.8 },
    { x: 4.8, z: 2.2, h: 1.7 },
    { x: -2.5, z: 4.0, h: 1.2 },
    { x: 2.7, z: 4.2, h: 1.3 },
    { x: -6.5, z: 0.5, h: 1.5 },
    { x: 6.7, z: 0.7, h: 1.4 },
    { x: -3.0, z: -2.0, h: 1.6 },
    { x: 3.2, z: -2.2, h: 1.5 },
    { x: 0, z: 5.5, h: 1.0 },
    { x: -5.5, z: -3.5, h: 1.4 },
    { x: 5.7, z: -3.8, h: 1.3 },
    { x: 0, z: -4.0, h: 1.8 },
  ];

  bigSpots.forEach((spot, idx) => {
    const warm = idx % 4 === 0;
    const col = warm ? PALETTE.warm : (Math.random() < 0.5 ? PALETTE.cyan : PALETTE.glowGreen);

    const cg = new THREE.Group();
    cg.position.set(spot.x, -5.5, spot.z);
    cg.rotation.y = Math.random() * Math.PI * 2;
    group.add(cg);

    // Основной кристалл
    const geo = new THREE.ConeGeometry(0.15 + Math.random() * 0.1, spot.h, 5);
    const pos = geo.attributes.position.array;
    for (let j = 0; j < pos.length; j += 3) {
      pos[j]     *= 0.8 + Math.random() * 0.4;
      pos[j + 2] *= 0.8 + Math.random() * 0.4;
    }
    geo.computeVertexNormals();

    const mat = new THREE.MeshPhysicalMaterial({
      color: 0x0a2020,
      emissive: col,
      emissiveIntensity: 0.8,
      roughness: 0.15,
      metalness: 0.3,
      transmission: 0.7,
      thickness: 0.3,
      ior: 2.0,
      clearcoat: 1.0,
      transparent: true,
      opacity: 0.9,
      flatShading: true,
    });

    const crystal = new THREE.Mesh(geo, mat);
    crystal.position.y = spot.h / 2;
    crystal.rotation.z = (Math.random() - 0.5) * 0.3;
    crystal.rotation.x = (Math.random() - 0.5) * 0.3;
    crystal.castShadow = true;
    cg.add(crystal);

    // 3-5 маленьких вокруг
    const smallCount = 3 + Math.floor(Math.random() * 3);
    for (let s = 0; s < smallCount; s++) {
      const sh = spot.h * (0.3 + Math.random() * 0.4);
      const sg = new THREE.ConeGeometry(0.05 + Math.random() * 0.05, sh, 4);
      const sm = mat.clone();
      const smMesh = new THREE.Mesh(sg, sm);
      const a = Math.random() * Math.PI * 2;
      const r = 0.15 + Math.random() * 0.3;
      smMesh.position.set(Math.cos(a) * r, sh / 2, Math.sin(a) * r);
      smMesh.rotation.set(
        (Math.random() - 0.5) * 0.4,
        Math.random() * Math.PI,
        (Math.random() - 0.5) * 0.4
      );
      smMesh.castShadow = true;
      cg.add(smMesh);
    }

    // Свет и ореол
    const light = new THREE.PointLight(col, 0.6, 3, 2);
    light.position.y = spot.h * 0.6;
    cg.add(light);

    crystals.push({
      group: cg,
      mat,
      light,
      phase: Math.random() * Math.PI * 2,
      pulseSpeed: 0.5 + Math.random() * 0.6,
    });
  });

  /* ==========================================================
     МЕЛКИЕ КРИСТАЛЛЫ — друзы (50 штук instanced)
     ========================================================== */
  const druzeCount = 50;
  const druzeGeo = new THREE.ConeGeometry(0.06, 0.35, 4);
  const druzeMat = new THREE.MeshPhysicalMaterial({
    color: 0x0a2020,
    emissive: PALETTE.cyan,
    emissiveIntensity: 0.5,
    roughness: 0.2,
    metalness: 0.3,
    transmission: 0.6,
    thickness: 0.1,
    ior: 2.0,
    transparent: true,
    opacity: 0.85,
    flatShading: true,
  });
  const druzes = new THREE.InstancedMesh(druzeGeo, druzeMat, druzeCount);
  const matrix = new THREE.Matrix4();
  const pos3 = new THREE.Vector3();
  const quat = new THREE.Quaternion();
  const scl = new THREE.Vector3();

  for (let i = 0; i < druzeCount; i++) {
    const angle = Math.random() * Math.PI * 2;
    const r = 1 + Math.random() * 12;
    pos3.set(Math.cos(angle) * r, -5.35, Math.sin(angle) * r);
    quat.setFromEuler(new THREE.Euler(
      (Math.random() - 0.5) * 0.5,
      Math.random() * Math.PI * 2,
      (Math.random() - 0.5) * 0.5
    ));
    const sc = 0.5 + Math.random() * 1.2;
    scl.set(sc, sc, sc);
    matrix.compose(pos3, quat, scl);
    druzes.setMatrixAt(i, matrix);
  }
  druzes.instanceMatrix.needsUpdate = true;
  group.add(druzes);

  return {
    group,
    update(time) {
      crystals.forEach((c) => {
        const pulse = 0.7 + Math.sin(time * c.pulseSpeed + c.phase) * 0.3;
        c.light.intensity = 0.6 * pulse;
        c.mat.emissiveIntensity = 0.6 + pulse * 0.4;
      });
      druzeMat.emissiveIntensity = 0.35 + Math.sin(time * 0.8) * 0.15;
    },
    dispose() {
      if (group.parent) group.parent.remove(group);
      group.traverse((o) => {
        if (o.geometry) o.geometry.dispose();
        if (o.material) {
          if (Array.isArray(o.material)) o.material.forEach((x) => x.dispose());
          else o.material.dispose();
        }
      });
      druzeGeo.dispose();
      druzeMat.dispose();
    },
  };
}