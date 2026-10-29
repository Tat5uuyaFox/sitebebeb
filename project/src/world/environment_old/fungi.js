import * as THREE from 'three';
import { PALETTE } from './shared.js';

/* =========================================================
   FUNGI — грибы 6 видов + споры
   =========================================================
   Виды:
   1. Классический круглый
   2. Высокий с тонкой ножкой
   3. Веерный (несколько шляпок)
   4. Крошечный (десятки)
   5. Трубчатый (полый цилиндр)
   6. Плоский (лепёшка)
   ========================================================= */
export function createFungi(parent, materials) {
  const group = new THREE.Group();
  parent.add(group);

  const mushrooms = [];

  // === Виды грибов ===
  const species = [
    // { type, scale, weight, warm }
    { type: 'classic', scale: 1.0, warm: 0.3 },
    { type: 'tall',    scale: 1.3, warm: 0.4 },
    { type: 'fan',     scale: 0.9, warm: 0.5 },
    { type: 'tiny',    scale: 0.35, warm: 0.6 },
    { type: 'tube',    scale: 0.8, warm: 0.2 },
    { type: 'flat',    scale: 0.7, warm: 0.5 },
  ];

  // === Точки размещения ===
  const spots = [
    // Передний план
    { x: -3.5, z: 3.5, count: 8, small: true },
    { x: 4.0, z: 3.8, count: 8, small: true },
    { x: -5.5, z: 2.0, count: 6, small: false },
    { x: 5.8, z: 2.2, count: 6, small: false },
    // Средний
    { x: -1.5, z: 5.5, count: 5, small: true },
    { x: 2.0, z: 5.8, count: 5, small: true },
    { x: -2.5, z: 1.5, count: 4, small: false },
    { x: 2.7, z: 1.8, count: 4, small: false },
    { x: -4.5, z: -1.5, count: 3, small: false },
    { x: 4.7, z: -1.8, count: 3, small: false },
    // Дальний
    { x: -6.5, z: -3.5, count: 4, small: true },
    { x: 6.7, z: -3.8, count: 4, small: true },
    { x: 0, z: 4.0, count: 3, small: false },
    { x: -7.5, z: 1.0, count: 3, small: true },
    { x: 7.7, z: 1.2, count: 3, small: true },
  ];

  function buildMushroom(type, scale, warm) {
    const m = new THREE.Group();

    const capColor = warm ? 0xffa860 : 0x4ac8d8;
    const capBody = warm ? 0x5a3a2a : 0x2a4a5a;
    const glowColor = warm ? 0xffb060 : 0x4ac8d8;

    // Общий "голос" материала
    const stemMat = new THREE.MeshStandardMaterial({
      color: 0x1a2530,
      roughness: 0.9,
      emissive: 0x0a1520,
      emissiveIntensity: 0.3,
    });

    const capMat = new THREE.MeshStandardMaterial({
      color: capBody,
      roughness: 0.6,
      emissive: capColor,
      emissiveIntensity: 0.3,
    });

    const gillsMat = new THREE.MeshBasicMaterial({
      color: capColor,
      transparent: true,
      opacity: 0.95,
      side: THREE.DoubleSide,
    });

    if (type === 'classic') {
      const stem = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.12, 1.0, 10), stemMat);
      stem.position.y = 0.5;
      stem.castShadow = true;
      m.add(stem);

      const skirt = new THREE.Mesh(
        new THREE.ConeGeometry(0.2, 0.15, 12, 1, true),
        new THREE.MeshStandardMaterial({ color: 0x2a3a4a, side: THREE.DoubleSide, roughness: 0.8 })
      );
      skirt.position.y = 0.85;
      m.add(skirt);

      const cap = new THREE.Mesh(
        new THREE.SphereGeometry(0.42, 20, 14, 0, Math.PI * 2, 0, Math.PI * 0.55),
        capMat
      );
      cap.position.y = 0.95;
      cap.castShadow = true;
      m.add(cap);

      const gills = new THREE.Mesh(new THREE.CircleGeometry(0.4, 24), gillsMat);
      gills.rotation.x = -Math.PI / 2;
      gills.position.y = 0.92;
      m.add(gills);
    }

    if (type === 'tall') {
      const stem = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.08, 1.6, 8), stemMat);
      stem.position.y = 0.8;
      stem.castShadow = true;
      m.add(stem);

      const cap = new THREE.Mesh(
        new THREE.SphereGeometry(0.3, 16, 10, 0, Math.PI * 2, 0, Math.PI * 0.55),
        capMat
      );
      cap.position.y = 1.55;
      cap.castShadow = true;
      m.add(cap);

      const gills = new THREE.Mesh(new THREE.CircleGeometry(0.28, 16), gillsMat);
      gills.rotation.x = -Math.PI / 2;
      gills.position.y = 1.52;
      m.add(gills);
    }

    if (type === 'fan') {
      const stem = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.06, 0.4, 6), stemMat);
      stem.position.y = 0.2;
      m.add(stem);

      // 3 шляпки веером
      for (let i = 0; i < 3; i++) {
        const a = (i / 3) * Math.PI * 2;
        const cap = new THREE.Mesh(
          new THREE.SphereGeometry(0.25, 12, 8, 0, Math.PI * 2, 0, Math.PI * 0.5),
          capMat
        );
        cap.position.set(Math.cos(a) * 0.15, 0.45, Math.sin(a) * 0.15);
        cap.rotation.z = Math.cos(a) * 0.3;
        cap.rotation.x = Math.sin(a) * 0.3;
        cap.castShadow = true;
        m.add(cap);

        const gills = new THREE.Mesh(new THREE.CircleGeometry(0.22, 12), gillsMat);
        gills.rotation.x = -Math.PI / 2;
        gills.position.copy(cap.position);
        gills.position.y -= 0.02;
        m.add(gills);
      }
    }

    if (type === 'tiny') {
      const stem = new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.04, 0.25, 6), stemMat);
      stem.position.y = 0.125;
      m.add(stem);

      const cap = new THREE.Mesh(
        new THREE.SphereGeometry(0.1, 10, 8, 0, Math.PI * 2, 0, Math.PI * 0.55),
        capMat
      );
      cap.position.y = 0.22;
      m.add(cap);

      const gills = new THREE.Mesh(new THREE.CircleGeometry(0.09, 10), gillsMat);
      gills.rotation.x = -Math.PI / 2;
      gills.position.y = 0.2;
      m.add(gills);
    }

    if (type === 'tube') {
      const stem = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.14, 1.1, 12), stemMat);
      stem.position.y = 0.55;
      stem.castShadow = true;
      m.add(stem);

      // Трубчатая шляпка — открытый цилиндр сверху
      const cap = new THREE.Mesh(
        new THREE.CylinderGeometry(0.3, 0.22, 0.35, 12, 1, true),
        new THREE.MeshStandardMaterial({
          color: capBody,
          emissive: capColor,
          emissiveIntensity: 0.4,
          side: THREE.DoubleSide,
          roughness: 0.6,
        })
      );
      cap.position.y = 1.2;
      m.add(cap);

      const inside = new THREE.Mesh(
        new THREE.CircleGeometry(0.28, 16),
        gillsMat
      );
      inside.rotation.x = -Math.PI / 2;
      inside.position.y = 1.15;
      m.add(inside);
    }

    if (type === 'flat') {
      const stem = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.08, 0.3, 8), stemMat);
      stem.position.y = 0.15;
      m.add(stem);

      // Плоская лепёшка
      const cap = new THREE.Mesh(
        new THREE.SphereGeometry(0.35, 20, 8, 0, Math.PI * 2, 0, Math.PI * 0.3),
        capMat
      );
      cap.position.y = 0.32;
      cap.castShadow = true;
      m.add(cap);

      const gills = new THREE.Mesh(new THREE.CircleGeometry(0.34, 20), gillsMat);
      gills.rotation.x = -Math.PI / 2;
      gills.position.y = 0.3;
      m.add(gills);
    }

    // Свет и ореол — у каждого гриба
    const light = new THREE.PointLight(glowColor, 0.5, 2.2, 2);
    light.position.y = scale * 0.7;
    m.add(light);

    // Ореол
    const haloMat = new THREE.SpriteMaterial({
      map: materials.moss.map,  // заглушка, заменится в update через glow
      color: glowColor,
      transparent: true,
      opacity: 0.3,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });
    // Используем простой круглый спрайт через canvas
    const cv = document.createElement('canvas');
    cv.width = cv.height = 64;
    const ctx = cv.getContext('2d');
    const g = ctx.createRadialGradient(32, 32, 0, 32, 32, 32);
    g.addColorStop(0, 'rgba(255, 240, 200, 0.8)');
    g.addColorStop(0.5, 'rgba(255, 180, 100, 0.3)');
    g.addColorStop(1, 'rgba(255, 120, 60, 0)');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, 64, 64);
    const haloMap = new THREE.CanvasTexture(cv);
    haloMat.map = haloMap;

    const halo = new THREE.Sprite(haloMat);
    halo.scale.set(scale * 1.5, scale * 1.5, 1);
    halo.position.y = scale * 0.8;
    m.add(halo);

    m.userData = {
      light,
      halo,
      gillsMat,
      capMat,
      baseLight: 0.5,
      phase: Math.random() * Math.PI * 2,
      pulseSpeed: 0.4 + Math.random() * 0.6,
      haloMap,
    };

    return m;
  }

  // === Размещаем все грибы ===
  spots.forEach((spot) => {
    for (let i = 0; i < spot.count; i++) {
      const speciesPick = species[Math.floor(Math.random() * species.length)];
      const isWarm = Math.random() < speciesPick.warm;
      const sc = speciesPick.scale * (0.8 + Math.random() * 0.4);

      const x = spot.x + (Math.random() - 0.5) * 1.5;
      const z = spot.z + (Math.random() - 0.5) * 1.5;

      const mushroom = buildMushroom(speciesPick.type, sc, isWarm);
      mushroom.position.set(x, -5.5, z);
      mushroom.rotation.y = Math.random() * Math.PI * 2;
      mushroom.scale.setScalar(sc);

      group.add(mushroom);
      mushrooms.push(mushroom);
    }
  });

  /* ==========================================================
     СПОРЫ ВОКРУГ ГРИБОВ
     ========================================================== */
  const sporeCount = 300;
  const sporeGeo = new THREE.BufferGeometry();
  const sporePos = new Float32Array(sporeCount * 3);
  const sporeCol = new Float32Array(sporeCount * 3);
  const sporeData = [];

  for (let i = 0; i < sporeCount; i++) {
    const angle = Math.random() * Math.PI * 2;
    const r = 2 + Math.random() * 12;
    const y = -4.5 + Math.random() * 3;
    sporePos[i * 3]     = Math.cos(angle) * r;
    sporePos[i * 3 + 1] = y;
    sporePos[i * 3 + 2] = Math.sin(angle) * r;

    const warm = Math.random() < 0.5;
    sporeCol[i * 3]     = warm ? 1.0 : 0.3;
    sporeCol[i * 3 + 1] = warm ? 0.85 : 0.8;
    sporeCol[i * 3 + 2] = warm ? 0.55 : 1.0;

    sporeData.push({
      baseY: y,
      phase: Math.random() * Math.PI * 2,
      speed: 0.1 + Math.random() * 0.3,
    });
  }
  sporeGeo.setAttribute('position', new THREE.BufferAttribute(sporePos, 3));
  sporeGeo.setAttribute('color', new THREE.BufferAttribute(sporeCol, 3));

  const sporeMat = new THREE.PointsMaterial({
    size: 0.06,
    vertexColors: true,
    transparent: true,
    opacity: 0.7,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
    sizeAttenuation: true,
  });

  const spores = new THREE.Points(sporeGeo, sporeMat);
  group.add(spores);

  return {
    group,
    update(time) {
      mushrooms.forEach((m) => {
        const d = m.userData;
        const pulse = 0.7 + Math.sin(time * d.pulseSpeed + d.phase) * 0.3;
        d.light.intensity = d.baseLight * pulse;
        d.gillsMat.opacity = 0.75 + pulse * 0.25;
        d.halo.material.opacity = 0.2 + pulse * 0.15;
      });

      // Споры парят
      const pos = sporeGeo.attributes.position.array;
      for (let i = 0; i < sporeCount; i++) {
        const d = sporeData[i];
        pos[i * 3 + 1] = d.baseY + Math.sin(time * d.speed + d.phase) * 0.3;
      }
      sporeGeo.attributes.position.needsUpdate = true;
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
      sporeGeo.dispose();
      sporeMat.dispose();
    },
  };
}