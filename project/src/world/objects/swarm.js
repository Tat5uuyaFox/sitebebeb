import * as THREE from 'three';

/* =========================================================
   SWARM — стая частиц, летающих вокруг центра
   ========================================================= */
export function createSwarm(scene, options = {}) {
  const {
    count = 800,
    radius = 12,
    particleSize = 0.15,
    color = 0xc99aff,
  } = options;

  const group = new THREE.Group();
  scene.add(group);

  /* --- Позиции и данные --- */
  const positions = new Float32Array(count * 3);
  const velocities = [];
  const phases = new Float32Array(count);

  for (let i = 0; i < count; i++) {
    // Случайная точка в сфере
    const theta = Math.random() * Math.PI * 2;
    const phi = Math.acos(2 * Math.random() - 1);
    const r = Math.pow(Math.random(), 0.5) * radius;

    positions[i * 3]     = r * Math.sin(phi) * Math.cos(theta);
    positions[i * 3 + 1] = r * Math.sin(phi) * Math.sin(theta);
    positions[i * 3 + 2] = r * Math.cos(phi);

    velocities.push({
      theta,
      phi,
      r,
      speed: 0.15 + Math.random() * 0.35,
      bob: 0.5 + Math.random() * 1.5,
    });

    phases[i] = Math.random() * Math.PI * 2;
  }

  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));

  /* --- Текстура искры --- */
  const tex = (() => {
    const size = 64;
    const cv = document.createElement('canvas');
    cv.width = cv.height = size;
    const ctx = cv.getContext('2d');
    const g = ctx.createRadialGradient(size/2, size/2, 0, size/2, size/2, size/2);
    g.addColorStop(0.0, 'rgba(255, 245, 255, 1)');
    g.addColorStop(0.3, 'rgba(201, 154, 255, 0.7)');
    g.addColorStop(1.0, 'rgba(122, 63, 212, 0)');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, size, size);
    const t = new THREE.CanvasTexture(cv);
    t.colorSpace = THREE.SRGBColorSpace;
    return t;
  })();

  const mat = new THREE.PointsMaterial({
    size: particleSize,
    map: tex,
    color,
    transparent: true,
    opacity: 0.9,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
    sizeAttenuation: true,
  });

  const points = new THREE.Points(geo, mat);
  group.add(points);

  /* --- Мягкий свет из центра --- */
  const light = new THREE.PointLight(0xa866ee, 2, 15, 2);
  group.add(light);

  return {
    group,
    update(time, dt) {
      const pos = geo.attributes.position.array;

      for (let i = 0; i < count; i++) {
        const v = velocities[i];

        // Орбитальное движение
        v.theta += v.speed * dt * 0.4;
        v.phi   += Math.sin(time * v.bob + phases[i]) * 0.15 * dt;

        // Радиальное «дыхание» — колеблется от 0.7 до 1.15 радиуса
        const rMod = v.r * (0.85 + Math.sin(time * 0.5 + phases[i]) * 0.15);

        pos[i * 3]     = rMod * Math.sin(v.phi) * Math.cos(v.theta);
        pos[i * 3 + 1] = rMod * Math.sin(v.phi) * Math.sin(v.theta);
        pos[i * 3 + 2] = rMod * Math.cos(v.phi);
      }

      geo.attributes.position.needsUpdate = true;

      // Вращение всей группы — медленное
      group.rotation.y = time * 0.03;

      // Пульсация света
      light.intensity = 1.8 + Math.sin(time * 1.2) * 0.6;
    },
    dispose() {
      scene.remove(group);
      geo.dispose();
      mat.dispose();
      tex.dispose();
    },
  };
}