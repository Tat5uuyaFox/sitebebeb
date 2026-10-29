import * as THREE from 'three';
import { PALETTE, TEXTURES } from './shared.js';

export function createVegetation(parent, materials) {
  const group = new THREE.Group();
  parent.add(group);

  const leafGreen = TEXTURES.leaf('green');
  const leafCyan  = TEXTURES.leaf('cyan');
  const leafDark  = TEXTURES.leaf('dark');

  const ferns = [];

  /* ==========================================================
     ПАПОРОТНИКИ — 60 штук, 15 кластеров
     ========================================================== */
  const clusters = [
    { x: -3.5, z: 3.0, n: 5 }, { x: 3.7, z: 3.2, n: 5 },
    { x: -2.5, z: 5.5, n: 4 }, { x: 2.7, z: 5.7, n: 4 },
    { x: -5.5, z: 4.0, n: 3 }, { x: 5.7, z: 4.2, n: 3 },
    { x: -1.0, z: 4.5, n: 3 }, { x: 1.2, z: 4.7, n: 3 },
    { x: -4.5, z: -1.0, n: 4 }, { x: 4.7, z: -1.2, n: 4 },
    { x: -6.5, z: 1.0, n: 3 }, { x: 6.7, z: 1.2, n: 3 },
    { x: 0, z: 2.0, n: 2 },
    { x: -7.5, z: -2.0, n: 3 }, { x: 7.7, z: -2.2, n: 3 },
  ];

  clusters.forEach((cluster) => {
    for (let i = 0; i < cluster.n; i++) {
      const x = cluster.x + (Math.random() - 0.5) * 1.2;
      const z = cluster.z + (Math.random() - 0.5) * 1.2;

      const fg = new THREE.Group();
      fg.position.set(x, -5.5, z);
      fg.rotation.y = Math.random() * Math.PI * 2;
      fg.scale.setScalar(0.6 + Math.random() * 0.7);
      group.add(fg);

      const fronds = 6 + Math.floor(Math.random() * 3);
      for (let f = 0; f < fronds; f++) {
        const frondAngle = (f / fronds) * Math.PI * 2;
        const frondLength = 0.6 + Math.random() * 0.7;

        const curve = new THREE.CatmullRomCurve3([
          new THREE.Vector3(0, 0, 0),
          new THREE.Vector3(0.12, frondLength * 0.5, 0),
          new THREE.Vector3(0.08, frondLength, 0),
        ]);

        const stemGeo = new THREE.TubeGeometry(curve, 8, 0.012, 4, false);
        const stemMat = new THREE.MeshStandardMaterial({
          color: 0x1a4a2a,
          emissive: 0x0a2a1a,
          emissiveIntensity: 0.2,
        });
        const frond = new THREE.Mesh(stemGeo, stemMat);
        frond.rotation.y = frondAngle;
        fg.add(frond);

        // Листочки вдоль стебля — их много
        for (let l = 0; l < 7; l++) {
          const t = l / 7;
          const point = curve.getPoint(t);
          const leafTex = Math.random() < 0.7 ? leafGreen : leafCyan;

          const leafGeo = new THREE.PlaneGeometry(0.11, 0.1);
          const leafMat = new THREE.MeshStandardMaterial({
            map: leafTex,
            color: 0x1a5a3a,
            emissive: 0x1a5a3a,
            emissiveIntensity: 0.25,
            side: THREE.DoubleSide,
            transparent: true,
            alphaTest: 0.1,
            roughness: 0.85,
          });

          const leaf1 = new THREE.Mesh(leafGeo, leafMat);
          leaf1.position.copy(point);
          leaf1.rotation.y = frondAngle + Math.PI / 2;
          leaf1.rotation.x = Math.PI / 4;
          fg.add(leaf1);

          const leaf2 = leaf1.clone();
          leaf2.rotation.y = frondAngle - Math.PI / 2;
          leaf2.rotation.x = -Math.PI / 4;
          fg.add(leaf2);
        }
      }

      ferns.push({
        group: fg,
        phase: Math.random() * Math.PI * 2,
        speed: 0.3 + Math.random() * 0.4,
      });
    }
  });

  /* ==========================================================
     СТЕЛЮЩИЕСЯ ПОБЕГИ — ползут по полу (200 штук)
     ========================================================== */
  const runnerCount = 200;
  const runnerGeo = new THREE.PlaneGeometry(1, 0.15);
  const runnerMat = new THREE.MeshStandardMaterial({
    map: leafDark,
    color: 0x1a4a2a,
    emissive: 0x0a2a1a,
    emissiveIntensity: 0.25,
    side: THREE.DoubleSide,
    transparent: true,
    alphaTest: 0.1,
    roughness: 0.9,
  });
  const runners = new THREE.InstancedMesh(runnerGeo, runnerMat, runnerCount);
  const matrix = new THREE.Matrix4();
  const pos = new THREE.Vector3();
  const quat = new THREE.Quaternion();
  const scl = new THREE.Vector3();

  for (let i = 0; i < runnerCount; i++) {
    const angle = Math.random() * Math.PI * 2;
    const r = 1 + Math.random() * 13;
    pos.set(Math.cos(angle) * r, -5.42, Math.sin(angle) * r);
    quat.setFromEuler(new THREE.Euler(
      -Math.PI / 2 + (Math.random() - 0.5) * 0.3,
      Math.random() * Math.PI * 2,
      (Math.random() - 0.5) * 0.3
    ));
    const sc = 0.3 + Math.random() * 0.7;
    scl.set(sc, sc, sc);
    matrix.compose(pos, quat, scl);
    runners.setMatrixAt(i, matrix);
  }
  runners.instanceMatrix.needsUpdate = true;
  runners.receiveShadow = true;
  group.add(runners);

  /* ==========================================================
     ТРАВЯНЫЕ ПУЧКИ — 150 штук
     ========================================================== */
  const grassGeo = new THREE.PlaneGeometry(0.08, 0.4);
  grassGeo.translate(0, 0.2, 0);
  const grassMat = new THREE.MeshStandardMaterial({
    color: 0x1a4a2a,
    emissive: 0x1a5a3a,
    emissiveIntensity: 0.3,
    side: THREE.DoubleSide,
    transparent: true,
    alphaTest: 0.1,
    roughness: 0.9,
  });
  const grassCount = 150;
  const grasses = new THREE.InstancedMesh(grassGeo, grassMat, grassCount);

  for (let i = 0; i < grassCount; i++) {
    const angle = Math.random() * Math.PI * 2;
    const r = 1 + Math.random() * 12;
    pos.set(Math.cos(angle) * r, -5.5, Math.sin(angle) * r);
    quat.setFromEuler(new THREE.Euler(
      (Math.random() - 0.5) * 0.3,
      Math.random() * Math.PI * 2,
      (Math.random() - 0.5) * 0.3
    ));
    const sc = 0.5 + Math.random() * 1.0;
    scl.set(sc, sc, sc);
    matrix.compose(pos, quat, scl);
    grasses.setMatrixAt(i, matrix);
  }
  grasses.instanceMatrix.needsUpdate = true;
  group.add(grasses);

  return {
    group,
    update(time) {
      ferns.forEach((f) => {
        f.group.rotation.z = Math.sin(time * f.speed + f.phase) * 0.04;
      });
      grassMat.emissiveIntensity = 0.25 + Math.sin(time * 0.7) * 0.1;
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
      leafGreen.dispose();
      leafCyan.dispose();
      leafDark.dispose();
      runnerGeo.dispose();
      runnerMat.dispose();
      grassGeo.dispose();
      grassMat.dispose();
    },
  };
}