import * as THREE from 'three';

/* =========================================================
   RINGS — планетарные кольца вокруг ядра
   =========================================================
   - Несколько плоских колец с разными наклонами
   - Частицы внутри кольца (как у Сатурна)
   - Медленно вращаются вокруг ядра
   ========================================================= */

export function createRings(parent, options = {}) {
  const {
    radius = 3.5,
    color = 0xa866ee,
    accentColor = 0xff9ad4,
  } = options;

  const group = new THREE.Group();
  parent.add(group);

  /* ==========================================================
     1. ТОНКИЕ ЯРКИЕ КОЛЬЦА (границы)
     ========================================================== */
  const RING_CONFIGS = [
    { inner: 3.5, outer: 3.7, tilt: { x: 0.2, z: 0.15 }, color: accentColor, speed: 0.15 },
    { inner: 4.3, outer: 4.5, tilt: { x: -0.15, z: 0.3 }, color: color, speed: -0.1 },
    { inner: 5.5, outer: 5.7, tilt: { x: 0.35, z: -0.2 }, color: accentColor, speed: 0.08 },
    { inner: 7.0, outer: 7.2, tilt: { x: -0.25, z: 0.1 }, color: color, speed: -0.06 },
  ];

  const rings = [];

  RING_CONFIGS.forEach((cfg) => {
    const ringGroup = new THREE.Group();
    ringGroup.rotation.x = Math.PI / 2 + cfg.tilt.x;
    ringGroup.rotation.z = cfg.tilt.z;
    group.add(ringGroup);

    // Тонкое кольцо
    const ringGeo = new THREE.RingGeometry(cfg.inner, cfg.outer, 128);
    const ringMat = new THREE.MeshBasicMaterial({
      color: cfg.color,
      transparent: true,
      opacity: 0.5,
      blending: THREE.AdditiveBlending,
      side: THREE.DoubleSide,
      depthWrite: false,
    });
    const ring = new THREE.Mesh(ringGeo, ringMat);
    ringGroup.add(ring);

    rings.push({
      group: ringGroup,
      mesh: ring,
      mat: ringMat,
      speed: cfg.speed,
      pulsePhase: Math.random() * Math.PI * 2,
    });
  });

  /* ==========================================================
     2. ЧАСТИЦЫ ВНУТРИ КОЛЕЦ
     ==========================================================
     Создают эффект «пыли» внутри кольца.
     ========================================================== */
  const particleCount = 800;
  const particleGeo = new THREE.BufferGeometry();
  const particlePositions = new Float32Array(particleCount * 3);
  const particleData = [];

  for (let i = 0; i < particleCount; i++) {
    // Случайное кольцо из конфига
    const ringIdx = i % RING_CONFIGS.length;
    const cfg = RING_CONFIGS[ringIdx];

    // Радиус внутри диапазона кольца
    const r = cfg.inner + Math.random() * (cfg.outer - cfg.inner) + 0.15;
    const angle = Math.random() * Math.PI * 2;
    const tilt = cfg.tilt;

    // Позиция в плоскости кольца, потом поворот
    let x = Math.cos(angle) * r;
    let z = Math.sin(angle) * r;
    let y = 0;

    // Применяем наклон (упрощённо — просто добавляем наклон по Z)
    const tiltedY = z * Math.sin(tilt.x);
    z = z * Math.cos(tilt.x);
    y += tiltedY;

    // Дополнительный наклон по X (поворот всей системы вокруг Z-оси)
    const finalX = x * Math.cos(tilt.z) - y * Math.sin(tilt.z);
    const finalY = x * Math.sin(tilt.z) + y * Math.cos(tilt.z);

    particlePositions[i * 3]     = finalX;
    particlePositions[i * 3 + 1] = finalY;
    particlePositions[i * 3 + 2] = z;

    particleData.push({
      angle,
      radius: r,
      ringIdx,
      tilt,
      speed: cfg.speed * 0.5 + (Math.random() - 0.5) * 0.05,
      phase: Math.random() * Math.PI * 2,
    });
  }

  particleGeo.setAttribute('position', new THREE.BufferAttribute(particlePositions, 3));

  const particleTex = (() => {
    const size = 32;
    const cv = document.createElement('canvas');
    cv.width = cv.height = size;
    const ctx = cv.getContext('2d');
    const g = ctx.createRadialGradient(size/2, size/2, 0, size/2, size/2, size/2);
    g.addColorStop(0, 'rgba(255, 240, 255, 1)');
    g.addColorStop(0.4, 'rgba(201, 154, 255, 0.5)');
    g.addColorStop(1, 'rgba(122, 63, 212, 0)');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, size, size);
    const tex = new THREE.CanvasTexture(cv);
    tex.colorSpace = THREE.SRGBColorSpace;
    return tex;
  })();

  const particleMat = new THREE.PointsMaterial({
    size: 0.12,
    map: particleTex,
    color: 0xe0c8ff,
    transparent: true,
    opacity: 0.75,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
    sizeAttenuation: true,
  });

  const particles = new THREE.Points(particleGeo, particleMat);
  group.add(particles);

  /* --- API --- */
  return {
    group,

    update(time, dt) {
      // Вращаем кольца
      rings.forEach((r) => {
        r.group.rotation.y += r.speed * dt;

        // Пульсация яркости
        const pulse = 0.4 + Math.sin(time * 1.2 + r.pulsePhase) * 0.2;
        r.mat.opacity = 0.3 + pulse * 0.4;
      });

      // Обновляем частицы — они движутся внутри своих колец
      const pos = particleGeo.attributes.position.array;
      for (let i = 0; i < particleCount; i++) {
        const d = particleData[i];
        d.angle += d.speed * dt;

        const x = Math.cos(d.angle) * d.radius;
        const z = Math.sin(d.angle) * d.radius;
        let y = 0;

        // Наклон как в создании
        const tiltedY = z * Math.sin(d.tilt.x);
        const cosX = z * Math.cos(d.tilt.x);

        const finalX = x * Math.cos(d.tilt.z) - (y + tiltedY) * Math.sin(d.tilt.z);
        const finalY = x * Math.sin(d.tilt.z) + (y + tiltedY) * Math.cos(d.tilt.z);

        pos[i * 3]     = finalX;
        pos[i * 3 + 1] = finalY;
        pos[i * 3 + 2] = cosX;
      }
      particleGeo.attributes.position.needsUpdate = true;

      // Лёгкое мерцание всей системы
      particleMat.opacity = 0.65 + Math.sin(time * 0.8) * 0.15;
    },

    dispose() {
      parent.remove(group);
      rings.forEach((r) => {
        r.mesh.geometry.dispose();
        r.mat.dispose();
      });
      particleGeo.dispose();
      particleMat.dispose();
      particleTex.dispose();
    },
  };
}