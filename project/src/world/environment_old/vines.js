import * as THREE from 'three';
import { PALETTE, TEXTURES } from './shared.js';

/* =========================================================
   VINES — корни и лианы, свисающие с потолка
   =========================================================
   Каждая лиана — это цепочка сегментов, которая качается.
   Как лианы в джунглях, только светятся и в пещере.
   Тарзан бы тут повесился, если бы был в этом билде.
   ========================================================= */
export function createVines(parent, materials) {
  const group = new THREE.Group();
  parent.add(group);

  const leafGreen = TEXTURES.leaf('green');
  const leafCyan  = TEXTURES.leaf('cyan');
  const leafWarm  = TEXTURES.leaf('warm');

  const vines = [];

  // Координаты корней. Чем больше — тем гуще лес, тем дольше грузится.
  // Хочешь 20 секунд загрузки — поставь 100. Хочешь 60 FPS — оставь 20.
  const rootSpots = [
    { x: -2.5, z: 6.5, length: 8,  thick: 0.12 },
    { x: 2.8,  z: 6.8, length: 9,  thick: 0.13 },
    { x: -5.0, z: 5.0, length: 7,  thick: 0.10 },
    { x: 5.2,  z: 5.2, length: 7.5,thick: 0.11 },
    { x: 0,    z: 7.5, length: 6,  thick: 0.09 },
    { x: -7.0, z: 4.0, length: 6.5,thick: 0.10 },
    { x: 7.2,  z: 4.2, length: 7,  thick: 0.11 },
    { x: -3.5, z: 3.0, length: 9,  thick: 0.14 },
    { x: 3.7,  z: 3.2, length: 9.5,thick: 0.14 },
    { x: -1.5, z: 1.0, length: 8,  thick: 0.12 },
    { x: 1.7,  z: 1.2, length: 8.5,thick: 0.12 },
    { x: -6.0, z: 0.5, length: 7,  thick: 0.10 },
    { x: 6.2,  z: 0.7, length: 7.5,thick: 0.10 },
    { x: -4.5, z: -2.0,length: 8,  thick: 0.12 },
    { x: 4.7,  z: -2.2,length: 8.5,thick: 0.12 },
    { x: -8.0, z: -1.0,length: 7,  thick: 0.09 },
    { x: 8.2,  z: -1.2,length: 7,  thick: 0.09 },
    { x: 0,    z: -3.0,length: 8,  thick: 0.11 },
    { x: -2.8, z: -5.0,length: 6.5,thick: 0.10 },
    { x: 3.0,  z: -5.2,length: 6.5,thick: 0.10 },
  ];

  rootSpots.forEach((spot) => {
    const rootGroup = new THREE.Group();
    rootGroup.position.set(spot.x, 10, spot.z);  // Старт — с потолка
    group.add(rootGroup);

    const segments = Math.floor(spot.length);
    let prevY = 0;
    let angleX = 0;
    let angleZ = 0;

    for (let s = 0; s < segments; s++) {
      const segH = 1;
      const radius = spot.thick - (s / segments) * spot.thick * 0.5;

      // Наклон — лиана как будто живая, качается
      angleX += (Math.random() - 0.5) * 0.15;
      angleZ += (Math.random() - 0.5) * 0.1;

      const geo = new THREE.CylinderGeometry(radius * 0.9, radius, segH, 6);
      const seg = new THREE.Mesh(geo, materials.bark);
      seg.position.y = prevY - segH / 2;
      seg.rotation.x = angleX;
      seg.rotation.z = angleZ;
      rootGroup.add(seg);

      // Мох на корне — природа везде пролезет
      if (Math.random() < 0.5) {
        const mossGeo = new THREE.SphereGeometry(radius * 2, 6, 4);
        const mossMat = new THREE.MeshStandardMaterial({
          color: PALETTE.moss,
          emissive: PALETTE.mossLit,
          emissiveIntensity: 0.3,
          flatShading: true,
        });
        const moss = new THREE.Mesh(mossGeo, mossMat);
        moss.position.set(
          (Math.random() - 0.5) * 0.15,
          -segH / 2,
          (Math.random() - 0.5) * 0.15
        );
        moss.scale.set(1, 0.5, 1);
        seg.add(moss);
      }

      // Листья — джунгли же, тут всё растёт
      const leafCount = Math.random() < 0.7 ? 1 : 2;
      for (let l = 0; l < leafCount; l++) {
        const roll = Math.random();
        const tex = roll < 0.6 ? leafGreen : (roll < 0.85 ? leafCyan : leafWarm);

        const leafGeo = new THREE.PlaneGeometry(0.22, 0.35);
        const leafMat = new THREE.MeshStandardMaterial({
          map: tex,
          color: 0x1a5a3a,
          emissive: 0x2a6a3a,
          emissiveIntensity: 0.25,
          side: THREE.DoubleSide,
          transparent: true,
          alphaTest: 0.1,
          roughness: 0.85,
        });
        const leaf = new THREE.Mesh(leafGeo, leafMat);
        leaf.position.set(
          (Math.random() - 0.5) * 0.15,
          -segH / 2 + (Math.random() - 0.5) * 0.4,
          (Math.random() - 0.5) * 0.15
        );
        leaf.rotation.set(
          (Math.random() - 0.5) * 0.8,
          Math.random() * Math.PI * 2,
          (Math.random() - 0.5) * 0.8 + Math.PI / 2
        );
        seg.add(leaf);
      }

      // Светящийся листок — вау-эффект
      if (Math.random() < 0.25) {
        const glowingMat = new THREE.MeshBasicMaterial({
          color: Math.random() < 0.5 ? PALETTE.cyan : PALETTE.glowGreen,
          transparent: true,
          opacity: 0.9,
          side: THREE.DoubleSide,
        });
        const gLeaf = new THREE.Mesh(
          new THREE.PlaneGeometry(0.08, 0.12),
          glowingMat
        );
        gLeaf.position.set(
          (Math.random() - 0.5) * 0.2,
          -segH / 2,
          (Math.random() - 0.5) * 0.2
        );
        gLeaf.rotation.set(
          Math.random() * Math.PI,
          Math.random() * Math.PI,
          Math.random() * Math.PI
        );
        seg.add(gLeaf);
      }

      prevY -= segH;
    }

    vines.push({
      group: rootGroup,
      phase: Math.random() * Math.PI * 2,
      swingSpeed: 0.3 + Math.random() * 0.3,
      swingAmount: 0.015 + Math.random() * 0.025,
      // базовая позиция — чтобы update не улетел в космос
      baseY: 10,
    });
  });

  return {
    group,
    update(time) {
      // Лианы качаются как будто от сквозняка
      // В пещере откуда сквозняк — загадка, но пусть будет
      vines.forEach((v) => {
        v.group.rotation.z = Math.sin(time * v.swingSpeed + v.phase) * v.swingAmount;
        v.group.rotation.x = Math.cos(time * v.swingSpeed * 0.7 + v.phase)
          * v.swingAmount * 0.6;
      });
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
      leafWarm.dispose();
    },
  };
}