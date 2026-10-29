import * as THREE from 'three';

/* =========================================================
   TRIBUNES — трибуны с фигурами советников
   =========================================================
   - Возвышения по кругу
   - На каждом — тёмная фигура в мантии
   - Светящиеся глаза
   - Фигуры слегка колышутся
   ========================================================= */

export function createTribunes(parent, options = {}) {
  const {
    count = 5,
    radius = 9,
    baseY = -1.5,
    height = 1.2,
    color = 0xa866ee,
  } = options;

  const group = new THREE.Group();
  parent.add(group);

  const tribunes = [];

  for (let i = 0; i < count; i++) {
    const angle = (i / count) * Math.PI * 2 - Math.PI / 2;
    const x = Math.cos(angle) * radius;
    const z = Math.sin(angle) * radius;

    const tribuneGroup = new THREE.Group();
    tribuneGroup.position.set(x, baseY, z);
    tribuneGroup.lookAt(0, baseY, 0);
    group.add(tribuneGroup);

    /* ---------- 1. Платформа ---------- */
    const platformGeo = new THREE.CylinderGeometry(1.3, 1.5, height, 6);
    const platformMat = new THREE.MeshStandardMaterial({
      color: 0x0a0418,
      emissive: 0x1a0838,
      emissiveIntensity: 0.1,
      roughness: 0.3,
      metalness: 0.85,
      flatShading: true,
    });
    const platform = new THREE.Mesh(platformGeo, platformMat);
    platform.position.y = height / 2;
    platform.receiveShadow = true;
    tribuneGroup.add(platform);

    /* ---------- 2. Обводка платформы — светящаяся ---------- */
    const rimGeo = new THREE.TorusGeometry(1.4, 0.02, 8, 6);
    const rimMat = new THREE.MeshBasicMaterial({
      color: color,
      transparent: true,
      opacity: 0.6,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });
    const rim = new THREE.Mesh(rimGeo, rimMat);
    rim.rotation.x = Math.PI / 2;
    rim.position.y = height + 0.01;
    tribuneGroup.add(rim);

    /* ---------- 3. Фигура — конус-мантия ---------- */
    const figureGroup = new THREE.Group();
    figureGroup.position.y = height;
    tribuneGroup.add(figureGroup);

    const robeGeo = new THREE.ConeGeometry(0.55, 1.6, 8);
    const robeMat = new THREE.MeshStandardMaterial({
      color: 0x05020f,
      emissive: 0x0a0420,
      emissiveIntensity: 0.15,
      roughness: 0.9,
      metalness: 0.1,
      flatShading: true,
    });
    const robe = new THREE.Mesh(robeGeo, robeMat);
    robe.position.y = 0.8;
    figureGroup.add(robe);

    /* ---------- 4. Капюшон — сфера ---------- */
    const hoodGeo = new THREE.SphereGeometry(0.32, 12, 12);
    const hoodMat = new THREE.MeshStandardMaterial({
      color: 0x05020f,
      roughness: 0.9,
      metalness: 0.1,
    });
    const hood = new THREE.Mesh(hoodGeo, hoodMat);
    hood.position.y = 1.65;
    hood.scale.set(1, 0.95, 1);
    figureGroup.add(hood);

    /* ---------- 5. Глаза — две светящиеся точки ---------- */
    const eyeMat = new THREE.MeshBasicMaterial({
      color: color,
      transparent: true,
      opacity: 0.95,
    });

    const eyeGeo = new THREE.SphereGeometry(0.045, 8, 8);

    const eyeL = new THREE.Mesh(eyeGeo, eyeMat);
    eyeL.position.set(-0.09, 1.7, 0.28);
    figureGroup.add(eyeL);

    const eyeR = new THREE.Mesh(eyeGeo, eyeMat);
    eyeR.position.set(0.09, 1.7, 0.28);
    figureGroup.add(eyeR);

    /* ---------- 6. Аура фигуры ---------- */
    const auraMat = new THREE.SpriteMaterial({
      color: color,
      transparent: true,
      opacity: 0.08,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });
    const aura = new THREE.Sprite(auraMat);
    aura.scale.set(2.5, 2.5, 1);
    aura.position.y = 1.2;
    figureGroup.add(aura);

    /* ---------- 7. Точечный свет ---------- */
    const light = new THREE.PointLight(color, 0.4, 3, 2);
    light.position.y = 1.7;
    figureGroup.add(light);

    tribunes.push({
      group: tribuneGroup,
      figure: figureGroup,
      eyes: [eyeL, eyeR],
      eyeMat,
      light,
      aura,
      rim,
      angle,
      baseY: figureGroup.position.y,
      phase: Math.random() * Math.PI * 2,
      breatheSpeed: 0.8 + Math.random() * 0.4,
    });
  }

  /* --- API --- */
  return {
    group,

    update(time, dt) {
      tribunes.forEach((t) => {
        // Фигура дышит — колышется вверх-вниз
        t.figure.position.y = t.baseY + Math.sin(time * t.breatheSpeed + t.phase) * 0.05;

        // Фигура слегка покачивается
        t.figure.rotation.z = Math.sin(time * 0.6 + t.phase) * 0.04;
        t.figure.rotation.x = Math.cos(time * 0.5 + t.phase) * 0.03;

        // Глаза мигают
        const flicker = 0.7 + Math.sin(time * 3 + t.phase * 2) * 0.3;
        t.eyeMat.opacity = flicker * 0.95;

        // Пульсация света
        t.light.intensity = 0.3 + flicker * 0.3;

        // Пульсация ауры
        t.aura.material.opacity = 0.05 + flicker * 0.08;

        // Обводка мигает
        t.rim.material.opacity = 0.4 + Math.sin(time * 1.5 + t.phase) * 0.3;

        // Обводка вращается
        t.rim.rotation.z += dt * 0.2;
      });
    },

    dispose() {
      parent.remove(group);
      tribunes.forEach((t) => {
        t.group.traverse((obj) => {
          if (obj.geometry) obj.geometry.dispose();
          if (obj.material) {
            if (Array.isArray(obj.material)) obj.material.forEach((m) => m.dispose());
            else obj.material.dispose();
          }
        });
      });
    },
  };
}