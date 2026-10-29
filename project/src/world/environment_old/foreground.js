import * as THREE from 'three';
import { TEXTURES } from './shared.js';

/* =========================================================
   FOREGROUND — размытые листья и лианы в фокусе
   =========================================================
   Слой 1 из композиции. Пользователь находится ВНУТРИ
   леса — вокруг него листья, ветки, лианы.
   Эти объекты большие, полупрозрачные и «размытые».
   ========================================================= */
export function createForeground(parent, materials, qualityLevel = 'high') {
  const group = new THREE.Group();
  parent.add(group);

  const leafGreen = TEXTURES.leaf('green');
  const leafDark  = TEXTURES.leaf('dark');

  // Размытый лист — большая плоскость с полупрозрачностью
  function makeBlurryLeaf(texture, size, rotation, position, opacity) {
    const leafMat = new THREE.MeshBasicMaterial({
      map: texture,
      transparent: true,
      opacity,
      side: THREE.DoubleSide,
      depthWrite: false,
      // Размытие имитируем полупрозрачностью + тёмным оттенком
      color: 0x2a3a2a,
    });
    const leaf = new THREE.Mesh(new THREE.PlaneGeometry(size, size * 1.3), leafMat);
    leaf.position.set(position.x, position.y, position.z);
    leaf.rotation.set(rotation.x, rotation.y, rotation.z);
    return leaf;
  }

  /* ==========================================================
     БОЛЬШИЕ ЛИСТЬЯ ПО КРАЯМ КАДРА
     ==========================================================
     Они висят между камерой и сценой на z = 10-12.
     Камера при движении будет «пролетать» между ними.
     ========================================================== */

  const leafCount = qualityLevel === 'low' ? 8 : 16;
  const leaves = [];

  for (let i = 0; i < leafCount; i++) {
    // По краям кадра — не по центру
    const side = i % 2 === 0 ? -1 : 1;
    const xPos = side * (2.5 + Math.random() * 3);
    const yPos = -3 + Math.random() * 6;
    const zPos = 10 + Math.random() * 2.5;

    const size = 1.5 + Math.random() * 2.5;
    const tex = Math.random() < 0.7 ? leafGreen : leafDark;

    const leaf = makeBlurryLeaf(
      tex,
      size,
      {
        x: (Math.random() - 0.5) * 0.5,
        y: Math.random() * Math.PI * 2,
        z: (Math.random() - 0.5) * 0.5,
      },
      { x: xPos, y: yPos, z: zPos },
      0.4 + Math.random() * 0.3
    );

    // Листья в foreground не отбрасывают тени и не ловят свет
    leaf.renderOrder = 999;
    group.add(leaf);

    leaves.push({
      mesh: leaf,
      phase: Math.random() * Math.PI * 2,
      swaySpeed: 0.3 + Math.random() * 0.4,
      baseRotY: leaf.rotation.y,
    });
  }

  /* ==========================================================
     ТЁМНЫЕ ВЕТКИ И ЛИАНЫ СБОКУ
     ==========================================================
     Толстые тёмные ветки идут сверху вниз по краям.
     ========================================================== */
  const branchCount = qualityLevel === 'low' ? 4 : 8;

  for (let i = 0; i < branchCount; i++) {
    const side = i % 2 === 0 ? -1 : 1;
    const xPos = side * (3.5 + Math.random() * 2);
    const zPos = 9.5 + Math.random() * 2;

    const branchGroup = new THREE.Group();
    branchGroup.position.set(xPos, 5, zPos);
    group.add(branchGroup);

    // Ветка — цепочка сегментов
    let prevY = 0;
    const segments = 4 + Math.floor(Math.random() * 3);
    for (let s = 0; s < segments; s++) {
      const segH = 1 + Math.random() * 0.5;
      const geo = new THREE.CylinderGeometry(0.08, 0.12, segH, 5);
      const mat = new THREE.MeshBasicMaterial({ color: 0x0a0a0a });
      const seg = new THREE.Mesh(geo, mat);
      seg.position.y = prevY - segH / 2;
      seg.rotation.z = (Math.random() - 0.5) * 0.3;
      seg.rotation.x = (Math.random() - 0.5) * 0.2;
      branchGroup.add(seg);
      prevY -= segH;
    }

    branchGroup.renderOrder = 998;
  }

  return {
    group,
    update(time) {
      // Листья покачиваются — очень медленно
      leaves.forEach((l) => {
        l.mesh.rotation.y = l.baseRotY + Math.sin(time * l.swaySpeed + l.phase) * 0.08;
        l.mesh.rotation.x = Math.cos(time * l.swaySpeed * 0.7 + l.phase) * 0.05;
      });
    },
    dispose() {
      if (group.parent) group.parent.remove(group);
      group.traverse((o) => {
        if (o.geometry) o.geometry.dispose();
        if (o.material) {
          if (Array.isArray(o.material)) o.material.forEach((m) => m.dispose());
          else o.material.dispose();
        }
      });
      leafGreen.dispose();
      leafDark.dispose();
    },
  };
}