import * as THREE from 'three';
import { PALETTE } from './shared.js';

/* =========================================================
   THREADS — светящиеся нити и паутина
   =========================================================
   Тонкие светящиеся линии. Как будто магия кристаллов
   утекает в воздух. Или просто паук накурился.
   ========================================================= */
export function createThreads(parent, materials) {
  const group = new THREE.Group();
  parent.add(group);

  const threads = [];

  /* ==========================================================
     1. СВИСАЮЩИЕ СВЕТЯЩИЕСЯ НИТИ — 30 штук
     ========================================================== */
  for (let i = 0; i < 30; i++) {
    const x = (Math.random() - 0.5) * 18;
    const z = 2 + Math.random() * 9;
    const length = 2 + Math.random() * 5;

    const points = [];
    const segCount = 8;
    for (let s = 0; s <= segCount; s++) {
      const t = s / segCount;
      points.push(new THREE.Vector3(
        x + Math.sin(t * 3) * 0.25,
        8 - t * length,
        z + Math.cos(t * 2) * 0.2
      ));
    }

    const curve = new THREE.CatmullRomCurve3(points);
    const geo = new THREE.TubeGeometry(curve, 12, 0.006, 3, false);
    const mat = new THREE.MeshBasicMaterial({
      color: Math.random() < 0.7 ? PALETTE.cyan : PALETTE.glowGreen,
      transparent: true,
      opacity: 0.5,
    });
    const thread = new THREE.Mesh(geo, mat);
    group.add(thread);

    threads.push({
      mesh: thread,
      mat,
      phase: Math.random() * Math.PI * 2,
      pulseSpeed: 0.5 + Math.random() * 0.8,
    });
  }

  /* ==========================================================
     2. ПАУТИНА МЕЖДУ КАМНЯМИ — 15 треугольных сетей
     ========================================================== */
  for (let i = 0; i < 15; i++) {
    const cx = (Math.random() - 0.5) * 14;
    const cy = -3 + Math.random() * 8;
    const cz = -2 + Math.random() * 8;

    const webGroup = new THREE.Group();
    webGroup.position.set(cx, cy, cz);
    webGroup.rotation.y = Math.random() * Math.PI * 2;
    group.add(webGroup);

    const radius = 0.3 + Math.random() * 0.7;
    const spokes = 5 + Math.floor(Math.random() * 3);
    const webMat = new THREE.MeshBasicMaterial({
      color: 0xaaccff,
      transparent: true,
      opacity: 0.15,
      side: THREE.DoubleSide,
    });

    // Радиальные нити
    for (let s = 0; s < spokes; s++) {
      const angle = (s / spokes) * Math.PI * 2;
      const points = [];
      const steps = 6;
      for (let p = 0; p <= steps; p++) {
        const t = p / steps;
        points.push(new THREE.Vector3(
          Math.cos(angle) * radius * t,
          Math.sin(angle) * radius * t,
          0
        ));
      }
      const geo = new THREE.TubeGeometry(
        new THREE.CatmullRomCurve3(points), 6, 0.003, 3, false
      );
      webGroup.add(new THREE.Mesh(geo, webMat));
    }

    // Кольцевые нити
    for (let ring = 1; ring <= 3; ring++) {
      const r = (ring / 3) * radius;
      const ringPoints = [];
      for (let s = 0; s <= spokes; s++) {
        const angle = (s / spokes) * Math.PI * 2;
        ringPoints.push(new THREE.Vector3(
          Math.cos(angle) * r,
          Math.sin(angle) * r,
          0
        ));
      }
      const geo = new THREE.BufferGeometry().setFromPoints(ringPoints);
      const line = new THREE.Line(geo, new THREE.LineBasicMaterial({
        color: 0xaaccff,
        transparent: true,
        opacity: 0.15,
      }));
      webGroup.add(line);
    }
  }

  return {
    group,
    update(time) {
      // Нити пульсируют — магия, хуле
      threads.forEach((t) => {
        const pulse = 0.4 + Math.sin(time * t.pulseSpeed + t.phase) * 0.2;
        t.mat.opacity = pulse;
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
    },
  };
}