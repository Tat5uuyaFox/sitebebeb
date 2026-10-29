import * as THREE from 'three';

/* =========================================================
   DEEP CRYSTALS — фиолетовые кристаллы в глубине пещеры
   =========================================================
   Не везде — только в зоне z = -12..-25.
   Именно они создают фиолетовое свечение в background.
   Пользователь сначала видит тёмный лес, а потом —
   эту фиолетовую полость.
   ========================================================= */
export function createDeepCrystals(parent, qualityLevel = 'high') {
  const group = new THREE.Group();
  parent.add(group);

  const count = qualityLevel === 'low' ? 8 : (qualityLevel === 'medium' ? 15 : 24);

  const crystals = [];

  // Зоны размещения — все в глубине
  const zones = [
    { zRange: [-25, -20], scaleRange: [2.5, 4.0], weight: 0.3 },  // гигантские
    { zRange: [-20, -15], scaleRange: [1.5, 2.5], weight: 0.4 },  // средние
    { zRange: [-15, -12], scaleRange: [0.8, 1.5], weight: 0.3 },  // мелкие
  ];

  for (let i = 0; i < count; i++) {
    // Выбираем зону по весу
    const r = Math.random();
    let acc = 0;
    let zone = zones[0];
    for (const z of zones) {
      acc += z.weight;
      if (r < acc) { zone = z; break; }
    }

    const z = zone.zRange[0] + Math.random() * (zone.zRange[1] - zone.zRange[0]);
    const x = (Math.random() - 0.5) * 14;
    const scale = zone.scaleRange[0] + Math.random() * (zone.scaleRange[1] - zone.scaleRange[0]);

    // Кристалл — конус с гранями
    const height = 2.5 * scale;
    const radius = 0.4 * scale;

    const cg = new THREE.Group();
    cg.position.set(x, -5.5, z);
    cg.rotation.y = Math.random() * Math.PI * 2;
    group.add(cg);

    const geo = new THREE.ConeGeometry(radius, height, 6);
    const pos = geo.attributes.position.array;
    for (let j = 0; j < pos.length; j += 3) {
      pos[j]     *= 0.85 + Math.random() * 0.3;
      pos[j + 2] *= 0.85 + Math.random() * 0.3;
    }
    geo.computeVertexNormals();

    const mat = new THREE.MeshPhysicalMaterial({
      color: 0x1a0a30,
      emissive: 0x8a3fff,
      emissiveIntensity: 1.2,
      roughness: 0.1,
      metalness: 0.3,
      transmission: 0.7,
      thickness: 0.6,
      ior: 2.2,
      iridescence: 0.5,
      iridescenceIOR: 1.8,
      clearcoat: 1.0,
      transparent: true,
      opacity: 0.92,
      flatShading: true,
    });

    const crystal = new THREE.Mesh(geo, mat);
    crystal.position.y = height / 2;
    crystal.rotation.z = (Math.random() - 0.5) * 0.2;
    crystal.rotation.x = (Math.random() - 0.5) * 0.2;
    cg.add(crystal);

    // Свет от кристалла
    const light = new THREE.PointLight(0x8a3fff, 1.5 * scale, 8 * scale, 2);
    light.position.y = height * 0.6;
    cg.add(light);

    // Ореол — большой и мягкий
    const canvas = document.createElement('canvas');
    canvas.width = canvas.height = 128;
    const ctx = canvas.getContext('2d');
    const hg = ctx.createRadialGradient(64, 64, 0, 64, 64, 64);
    hg.addColorStop(0, 'rgba(200, 140, 255, 0.9)');
    hg.addColorStop(0.3, 'rgba(140, 80, 220, 0.4)');
    hg.addColorStop(1, 'rgba(80, 40, 160, 0)');
    ctx.fillStyle = hg;
    ctx.fillRect(0, 0, 128, 128);
    const tex = new THREE.CanvasTexture(canvas);

    const halo = new THREE.Sprite(
      new THREE.SpriteMaterial({
        map: tex,
        color: 0xa866ff,
        transparent: true,
        opacity: 0.7,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
      })
    );
    halo.scale.set(6 * scale, 6 * scale, 1);
    halo.position.y = height * 0.5;
    cg.add(halo);

    crystals.push({
      group: cg,
      mat,
      light,
      halo,
      tex,
      phase: Math.random() * Math.PI * 2,
      pulseSpeed: 0.3 + Math.random() * 0.4,
      baseIntensity: 1.5 * scale,
    });
  }

  /* --- Общее фиолетовое свечение в глубине --- */
  const deepLight = new THREE.PointLight(0x8a3fff, 4, 30, 2);
  deepLight.position.set(0, -2, -20);
  group.add(deepLight);

  const deepLight2 = new THREE.PointLight(0xb366ff, 2, 20, 2);
  deepLight2.position.set(6, -3, -18);
  group.add(deepLight2);

  return {
    group,
    crystals,
    deepLight,

    update(time) {
      crystals.forEach((c) => {
        const pulse = 0.75 + Math.sin(time * c.pulseSpeed + c.phase) * 0.25;
        c.light.intensity = c.baseIntensity * pulse;
        c.halo.material.opacity = 0.5 + pulse * 0.3;
        c.mat.emissiveIntensity = 1.0 + pulse * 0.5;
      });

      // Общий свет в глубине пульсирует как «дыхание»
      const deepPulse = 0.85 + Math.sin(time * 0.4) * 0.15;
      deepLight.intensity = 4 * deepPulse;
      deepLight2.intensity = 2 * deepPulse;
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
    },
  };
}