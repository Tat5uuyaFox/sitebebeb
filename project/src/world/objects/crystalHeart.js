import * as THREE from 'three';

/* =========================================================
   CRYSTAL HEART — гигантский светящийся кристалл
   =========================================================
   Заменяет портал. Растёт из скалы, пульсирует,
   освещает пещеру тёплым светом.
   ========================================================= */

export function createCrystalHeart(parent, options = {}) {
  const {
    position = { x: 0, y: 0, z: 0 },
    scale = 1.0,
    color = 0x7affc8,      // бирюзово-зелёный
    accentColor = 0xffd8a0, // тёплый акцент
  } = options;

  const group = new THREE.Group();
  group.position.set(position.x, position.y, position.z);
  parent.add(group);

  /* ==========================================================
     1. ОСНОВНОЙ КРИСТАЛЛ — вытянутый, гранёный
     ========================================================== */
  const crystalGeo = new THREE.ConeGeometry(0.8, 3.5, 6);
  // Искажаем вершины для естественности
  const positions = crystalGeo.attributes.position.array;
  for (let i = 0; i < positions.length; i += 3) {
    positions[i]     *= 0.8 + Math.random() * 0.4;
    positions[i + 1] *= 0.9 + Math.random() * 0.2;
    positions[i + 2] *= 0.8 + Math.random() * 0.4;
  }
  crystalGeo.computeVertexNormals();

  const crystalMat = new THREE.MeshPhysicalMaterial({
    color: 0x0a2a2a,
    emissive: color,
    emissiveIntensity: 0.6,
    roughness: 0.15,
    metalness: 0.3,
    transmission: 0.85,
    thickness: 0.5,
    ior: 2.0,
    iridescence: 0.4,
    clearcoat: 1.0,
    clearcoatRoughness: 0.05,
    transparent: true,
    opacity: 0.95,
    flatShading: true,
  });

  const crystal = new THREE.Mesh(crystalGeo, crystalMat);
  crystal.position.y = 1.75;
  crystal.scale.setScalar(scale);
  group.add(crystal);

  /* ==========================================================
     2. МАЛЫЕ КРИСТАЛЛЫ — растут вокруг
     ========================================================== */
  const smallCrystals = [];
  for (let i = 0; i < 8; i++) {
    const angle = (i / 8) * Math.PI * 2 + Math.random() * 0.5;
    const radius = 0.6 + Math.random() * 0.5;
    const size = 0.3 + Math.random() * 0.5;

    const geo = new THREE.ConeGeometry(size, size * 2.5, 5);
    const mat = new THREE.MeshStandardMaterial({
      color: 0x0a2a2a,
      emissive: color,
      emissiveIntensity: 0.4,
      roughness: 0.2,
      metalness: 0.4,
      flatShading: true,
    });
    const small = new THREE.Mesh(geo, mat);
    small.position.set(
      Math.cos(angle) * radius * scale,
      0.5 + Math.random() * 0.5,
      Math.sin(angle) * radius * scale
    );
    small.rotation.z = (Math.random() - 0.5) * 0.4;
    small.rotation.x = (Math.random() - 0.5) * 0.4;
    small.scale.setScalar(scale);
    group.add(small);
    smallCrystals.push(small);
  }

  /* ==========================================================
     3. ВНУТРЕННЕЕ СВЕЧЕНИЕ — пульсирующая сфера
     ========================================================== */
  const coreGeo = new THREE.SphereGeometry(0.6 * scale, 16, 16);
  const coreMat = new THREE.MeshBasicMaterial({
    color: accentColor,
    transparent: true,
    opacity: 0.6,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
  });
  const core = new THREE.Mesh(coreGeo, coreMat);
  core.position.y = 1.5 * scale;
  group.add(core);

  /* ==========================================================
     4. ОРЕОЛ — мягкое свечение
     ========================================================== */
  const glowTex = (() => {
    const size = 128;
    const cv = document.createElement('canvas');
    cv.width = cv.height = size;
    const ctx = cv.getContext('2d');
    const g = ctx.createRadialGradient(size/2, size/2, 0, size/2, size/2, size/2);
    g.addColorStop(0, 'rgba(255, 220, 160, 0.8)');
    g.addColorStop(0.3, 'rgba(255, 180, 100, 0.4)');
    g.addColorStop(1, 'rgba(255, 140, 60, 0)');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, size, size);
    return new THREE.CanvasTexture(cv);
  })();

  const halo = new THREE.Sprite(
    new THREE.SpriteMaterial({
      map: glowTex,
      color: accentColor,
      transparent: true,
      opacity: 0.8,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    })
  );
  halo.scale.set(4 * scale, 4 * scale, 1);
  halo.position.y = 1.5 * scale;
  group.add(halo);

  /* ==========================================================
     5. СВЕТ
     ========================================================== */
  const light = new THREE.PointLight(accentColor, 3, 15, 2);
  light.position.y = 1.5 * scale;
  light.castShadow = true;
  light.shadow.mapSize.set(1024, 1024);
  group.add(light);

  const secondaryLight = new THREE.PointLight(color, 1.5, 10, 2);
  secondaryLight.position.y = 1.0 * scale;
  group.add(secondaryLight);

  /* ==========================================================
     API
     ========================================================== */
  return {
    group,
    crystal,
    core,
    halo,
    light,

    update(time, dt) {
      // Пульсация
      const pulse = 0.8 + Math.sin(time * 1.5) * 0.2;

      // Основной кристалл дышит
      crystalMat.emissiveIntensity = 0.5 * pulse;
      crystal.scale.setScalar(scale * (0.98 + pulse * 0.04));

      // Ядро пульсирует
      core.scale.setScalar(0.8 + pulse * 0.3);
      coreMat.opacity = 0.4 + pulse * 0.3;

      // Ореол
      halo.scale.setScalar((3.5 + pulse * 0.8) * scale);
      halo.material.opacity = 0.6 + pulse * 0.3;

      // Свет
      light.intensity = 2.5 + pulse * 1.5;
      secondaryLight.intensity = 1.2 + pulse * 0.8;

      // Малые кристаллы мерцают
      smallCrystals.forEach((c, i) => {
        const flicker = 0.5 + Math.sin(time * 1.2 + i * 1.7) * 0.3;
        c.material.emissiveIntensity = 0.3 * flicker;
      });
    },

    dispose() {
      if (group.parent) group.parent.remove(group);
      group.traverse((obj) => {
        if (obj.geometry) obj.geometry.dispose();
        if (obj.material) {
          if (Array.isArray(obj.material)) obj.material.forEach((m) => m.dispose());
          else obj.material.dispose();
        }
      });
      glowTex.dispose();
    },
  };
}