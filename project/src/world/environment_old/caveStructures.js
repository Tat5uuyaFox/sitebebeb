import * as THREE from 'three';
import { PALETTE } from './shared.js';

/* =========================================================
   CAVE STRUCTURES — сталактиты, сталагмиты, арки, колонны
   =========================================================
   Всё что торчит из пола или свисает с потолка.
   В реальной пещере такие штуки растут по 1000 лет.
   У нас — за 16 миллисекунд. Прогресс.
   ========================================================= */
export function createCaveStructures(parent, materials) {
  const group = new THREE.Group();
  parent.add(group);

  const stalactites = [];

  /* ==========================================================
     СТАЛАКТИТЫ (сверху свисают) — 60 штук
     ========================================================== */
  for (let i = 0; i < 60; i++) {
    const angle = Math.random() * Math.PI * 2;
    const r = 2 + Math.random() * 20;
    const x = Math.cos(angle) * r;
    const z = Math.sin(angle) * r;
    const h = 0.6 + Math.random() * 4.5;
    const w = 0.12 + Math.random() * 0.5;

    const geo = new THREE.ConeGeometry(w, h, 6);
    const cone = new THREE.Mesh(geo, materials.stalactite);
    cone.position.set(x, 9 + Math.random() * 2, z);
    cone.rotation.y = Math.random() * Math.PI;
    cone.rotation.z = (Math.random() - 0.5) * 0.15;
    cone.castShadow = true;

    // Мелкая дрожь в анимации (см. update)
    cone.userData = {
      baseY: cone.position.y,
      phase: Math.random() * Math.PI * 2,
    };

    group.add(cone);
    stalactites.push(cone);
  }

  /* ==========================================================
     СТАЛАГМИТЫ (снизу растут) — 40 штук
     ========================================================== */
  for (let i = 0; i < 40; i++) {
    const angle = Math.random() * Math.PI * 2;
    const r = 3 + Math.random() * 15;
    const x = Math.cos(angle) * r;
    const z = Math.sin(angle) * r;
    const h = 0.5 + Math.random() * 3.5;
    const w = 0.15 + Math.random() * 0.6;

    const geo = new THREE.ConeGeometry(w, h, 6);
    const cone = new THREE.Mesh(geo, materials.stalactite);
    cone.position.set(x, -5.5 + h / 2, z);
    cone.rotation.y = Math.random() * Math.PI;
    cone.rotation.x = (Math.random() - 0.5) * 0.2;
    cone.rotation.z = (Math.random() - 0.5) * 0.2;
    cone.castShadow = true;
    cone.receiveShadow = true;
    group.add(cone);
  }

  /* ==========================================================
     КАМЕННЫЕ КОЛОННЫ — 4 штуки
     ==========================================================
     Соединяют пол и потолок. Как в Skyrim, только темнее
     и без драконов.
     ========================================================== */
  const columns = [];

  for (let i = 0; i < 4; i++) {
    const angle = (i / 4) * Math.PI * 2 + 0.7;
    const r = 8 + Math.random() * 2;
    const x = Math.cos(angle) * r;
    const z = Math.sin(angle) * r;

    const colGroup = new THREE.Group();
    colGroup.position.set(x, -5.5, z);
    colGroup.rotation.y = Math.random() * Math.PI;
    group.add(colGroup);

    // Сегменты колонны — неровные
    const totalH = 14 + Math.random() * 3;
    const segCount = 8;
    for (let s = 0; s < segCount; s++) {
      const segH = totalH / segCount;
      const radius = 0.5 + Math.random() * 0.3;

      const geo = new THREE.CylinderGeometry(
        radius * (0.9 + Math.random() * 0.2),
        radius * (0.9 + Math.random() * 0.2),
        segH,
        7
      );
      // Искажаем вершины для органичности
      const pos = geo.attributes.position.array;
      for (let j = 0; j < pos.length; j += 3) {
        pos[j]     *= 0.9 + Math.random() * 0.2;
        pos[j + 2] *= 0.9 + Math.random() * 0.2;
      }
      geo.computeVertexNormals();

      const seg = new THREE.Mesh(geo, materials.rockDark);
      seg.position.y = s * segH + segH / 2;
      seg.rotation.z = (Math.random() - 0.5) * 0.05;
      seg.rotation.x = (Math.random() - 0.5) * 0.05;
      seg.castShadow = true;
      seg.receiveShadow = true;
      colGroup.add(seg);

      // Мох на сегменте
      if (Math.random() < 0.6) {
        const mossGeo = new THREE.SphereGeometry(radius * 1.6, 7, 5);
        const moss = new THREE.Mesh(mossGeo, materials.moss);
        moss.position.set(
          (Math.random() - 0.5) * radius,
          s * segH + segH * 0.5,
          (Math.random() - 0.5) * radius
        );
        moss.scale.set(1, 0.4, 1);
        colGroup.add(moss);
      }
    }

    columns.push(colGroup);
  }

  /* ==========================================================
     КАМЕННЫЕ АРКИ на дальнем плане — 3 штуки
     ========================================================== */
  for (let i = 0; i < 3; i++) {
    const archGroup = new THREE.Group();
    archGroup.position.set((i - 1) * 7, -5.5, -9 - Math.random() * 3);
    archGroup.rotation.y = (Math.random() - 0.5) * 0.3;
    group.add(archGroup);

    const archHeight = 3 + Math.random() * 1.5;
    const archWidth = 2 + Math.random() * 0.8;

    // Левая колонна
    const leftGeo = new THREE.CylinderGeometry(0.5, 0.7, archHeight, 6);
    const left = new THREE.Mesh(leftGeo, materials.rockDark);
    left.position.set(-archWidth / 2, archHeight / 2, 0);
    left.castShadow = true;
    archGroup.add(left);

    // Правая колонна
    const right = left.clone();
    right.position.x = archWidth / 2;
    archGroup.add(right);

    // Перемычка — рваная
    const topGeo = new THREE.BoxGeometry(archWidth + 0.8, 0.6, 0.6);
    const top = new THREE.Mesh(topGeo, materials.rockDark);
    top.position.set(0, archHeight + 0.3, 0);
    top.rotation.z = (Math.random() - 0.5) * 0.1;
    archGroup.add(top);
  }

  /* ==========================================================
     МЕЛКИЕ ШИПЫ ПО СТЕНАМ — 100 штук instanced
     ==========================================================
     Торчат из стен и потолка. Просто чтобы было ещё детальнее.
     ========================================================== */
  const spikeCount = 100;
  const spikeGeo = new THREE.ConeGeometry(0.08, 0.5, 5);
  spikeGeo.translate(0, 0.25, 0); // пивот в основании
  const spikes = new THREE.InstancedMesh(spikeGeo, materials.stalactite, spikeCount);
  const matrix = new THREE.Matrix4();
  const pos = new THREE.Vector3();
  const quat = new THREE.Quaternion();
  const scl = new THREE.Vector3();

  for (let i = 0; i < spikeCount; i++) {
    const angle = Math.random() * Math.PI * 2;
    const r = 5 + Math.random() * 18;
    pos.set(Math.cos(angle) * r, -5.5 + Math.random() * 14, Math.sin(angle) * r);

    // Поворачиваем в случайную сторону
    quat.setFromEuler(new THREE.Euler(
      Math.random() * Math.PI,
      Math.random() * Math.PI,
      Math.random() * Math.PI
    ));

    const sc = 0.5 + Math.random() * 1.5;
    scl.set(sc, sc, sc);
    matrix.compose(pos, quat, scl);
    spikes.setMatrixAt(i, matrix);
  }
  spikes.instanceMatrix.needsUpdate = true;
  group.add(spikes);

  return {
    group,
    update(time) {
      // Сталактиты дышат — едва заметно
      // Реальные бы так не делали, но нам можно
      stalactites.forEach((s) => {
        s.position.y = s.userData.baseY + Math.sin(time * 0.3 + s.userData.phase) * 0.05;
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
      spikeGeo.dispose();
    },
  };
}