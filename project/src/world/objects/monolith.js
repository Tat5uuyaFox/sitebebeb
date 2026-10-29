import * as THREE from 'three';

/* =========================================================
   MONOLITH — рваный кристаллический обелиск
   =========================================================
   - Многогранная форма (не цилиндр)
   - Рваный силуэт через разную длину рёбер
   - Жилы по граням, пульсируют
   - Светящаяся вершина
   - Аура вокруг
   ========================================================= */

export function createMonolith(parent, options = {}) {
  const {
    position = { x: 0, y: 0, z: 0 },
    height = 6,
    width = 1.0,
    tilt = 0,
    color = 0xa866ee,
    accentColor = 0xc99aff,
    seed = Math.random() * 100,
  } = options;

  const group = new THREE.Group();
  group.position.set(position.x, position.y, position.z);
  group.rotation.y = seed * 0.7;
  parent.add(group);

  /* ==========================================================
     1. ТЕЛО — многогранная рваная форма
     ==========================================================
     Строим LatheGeometry с неровным профилем — это даёт
     «кристаллический» силуэт с гранями.
     ========================================================== */
  const profile = [];
  const segments = 8;
  for (let i = 0; i <= segments; i++) {
    const t = i / segments;
    const y = t * height;

    // Радиус сужается к вершине
    let baseR = width * 0.5 * (1.0 - t * 0.55);

    // Рваность профиля — у каждой вершины свой сдвиг
    const wobble = Math.sin(seed + t * 12.7) * 0.08
                 + Math.cos(seed * 1.3 + t * 7.3) * 0.06;

    baseR *= (1.0 + wobble);

    profile.push(new THREE.Vector2(Math.max(0.05, baseR), y));
  }
  // Вершина — острая
  profile.push(new THREE.Vector2(0.02, height + 0.15));

  const bodyGeo = new THREE.LatheGeometry(profile, 6);
  const bodyMat = new THREE.MeshStandardMaterial({
    color: 0x0a0418,
    emissive: 0x1a0838,
    emissiveIntensity: 0.15,
    roughness: 0.25,
    metalness: 0.85,
    flatShading: true,
  });
  const body = new THREE.Mesh(bodyGeo, bodyMat);
  body.rotation.x = tilt;
  body.castShadow = true;
  body.receiveShadow = true;
  group.add(body);

  /* ==========================================================
     2. ЖИЛЫ — светящиеся рёбра
     ========================================================== */
  const veinMat = new THREE.MeshBasicMaterial({
    color: accentColor,
    transparent: true,
    opacity: 0.9,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
  });

  const veins = [];
  const veinCount = 5;
  for (let i = 0; i < veinCount; i++) {
    const angle = (i / veinCount) * Math.PI * 2 + seed * 0.3;
    const veinHeight = height * (0.3 + Math.random() * 0.45);
    const veinGeo = new THREE.BoxGeometry(0.015, veinHeight, 0.015);
    const vein = new THREE.Mesh(veinGeo, veinMat.clone());

    const radiusAtBase = width * 0.5;
    vein.position.set(
      Math.cos(angle) * radiusAtBase * 0.85,
      0.5 + veinHeight * 0.5,
      Math.sin(angle) * radiusAtBase * 0.85
    );
    vein.rotation.y = -angle;
    vein.rotation.x = tilt;

    vein.userData.phase = Math.random() * Math.PI * 2;
    vein.userData.baseOpacity = 0.5 + Math.random() * 0.4;

    group.add(vein);
    veins.push(vein);
  }

  /* ==========================================================
     3. ВЕРШИНА — светящийся осколок наверху
     ========================================================== */
  const tipGeo = new THREE.OctahedronGeometry(0.18, 0);
  const tipMat = new THREE.MeshBasicMaterial({
    color: accentColor,
    transparent: true,
    opacity: 0.95,
  });
  const tip = new THREE.Mesh(tipGeo, tipMat);
  tip.position.y = height + 0.15;
  tip.scale.set(0.6, 1.2, 0.6);
  group.add(tip);

  /* ==========================================================
     4. АУРА — мягкое свечение вокруг
     ========================================================== */
  const auraGeo = new THREE.SphereGeometry(width * 1.5, 16, 16);
  const auraMat = new THREE.MeshBasicMaterial({
    color: color,
    transparent: true,
    opacity: 0.03,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
  });
  const aura = new THREE.Mesh(auraGeo, auraMat);
  aura.scale.y = height / (width * 1.5);
  aura.position.y = height * 0.5;
  group.add(aura);

  /* ==========================================================
     5. ТОЧЕЧНЫЙ СВЕТ
     ========================================================== */
  const light = new THREE.PointLight(color, 0.8, 5, 2);
  light.position.y = height * 0.6;
  group.add(light);

  /* ==========================================================
     API
     ========================================================== */
  const baseY = position.y;

  return {
    group,
    height,
    tipPosition: new THREE.Vector3(position.x, position.y + height + 0.15, position.z),

    update(time, dt) {
      // Лёгкое парение
      group.position.y = baseY + Math.sin(time * 0.5 + seed) * 0.12;

      // Медленный поворот
      group.rotation.y += dt * 0.05;

      // Пульсация жил
      veins.forEach((v, i) => {
        const pulse = 0.5 + Math.sin(time * 1.5 + v.userData.phase) * 0.5;
        v.material.opacity = v.userData.baseOpacity * (0.4 + pulse * 0.6);
      });

      // Пульсация вершины
      const tipPulse = 0.7 + Math.sin(time * 2.0 + seed) * 0.3;
      tip.scale.set(0.6 * tipPulse, 1.2 * tipPulse, 0.6 * tipPulse);
      tip.material.opacity = 0.7 + tipPulse * 0.3;

      // Пульсация света
      light.intensity = 0.5 + Math.sin(time * 1.3 + seed) * 0.35;

      // Пульсация ауры
      aura.material.opacity = 0.02 + Math.sin(time * 0.8 + seed) * 0.015;
    },

    dispose() {
      if (group.parent) group.parent.remove(group);
      bodyGeo.dispose();
      bodyMat.dispose();
      veinMat.dispose();
      tipGeo.dispose();
      tipMat.dispose();
      auraGeo.dispose();
      auraMat.dispose();
      veins.forEach((v) => v.material.dispose());
    },
  };
}