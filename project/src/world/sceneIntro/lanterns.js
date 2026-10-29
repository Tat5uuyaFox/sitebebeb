import * as THREE from 'three';
import { PALETTE } from './shared.js';

/* =========================================================
   LANTERNS — маленькие фонарики в нишах стен
   =========================================================
   Концепция (по референсу):
   - Маленькие фонарики на стенах и выступах
   - Тёплый свет (как от свечи)
   - Мерцание — не ровное
   - Редкие, 15-25 штук
   - Не главный источник — декорация
   - Мотыльки вокруг некоторых

   Технически:
   - Простой корпус (цилиндр + конус)
   - Emissive стекло
   - Маленький PointLight (не 25 штук!)
   - Свет только у 40% фонариков
   ========================================================= */

export function createLanterns(parent, materials, qualityLevel = 'high') {
  const group = new THREE.Group();
  parent.add(group);

  const isLow = qualityLevel === 'low';
  const isMedium = qualityLevel === 'medium';

  /* ==========================================================
     КОНФИГ
     ========================================================== */
  const lanternCount = isLow ? 4 : isMedium ? 7 : 10;

  /* ==========================================================
     МАТЕРИАЛЫ
     ========================================================== */

  // Тёмный металл для корпуса
  const metalMat = new THREE.MeshStandardMaterial({
    color: 0x0a0806,
    roughness: 0.7,
    metalness: 0.8,
    flatShading: true,
  });

  // Стекло — светящееся тёплым
  const glassMat = new THREE.MeshStandardMaterial({
    color: 0x2a1000,
    emissive: 0xffa050,
    emissiveIntensity: 1.6,
    roughness: 0.3,
    metalness: 0.1,
    transparent: true,
    opacity: 0.9,
  });

  // Пламя
  const flameMat = new THREE.MeshBasicMaterial({
    color: 0xffe0a0,
    transparent: true,
    opacity: 0.95,
  });

  /* ==========================================================
     ГЕОМЕТРИИ
     ========================================================== */

  // Корпус — кубик или цилиндр
  const bodyGeo = new THREE.CylinderGeometry(0.08, 0.09, 0.18, 6);

  // Крышка — конус
  const capGeo = new THREE.ConeGeometry(0.09, 0.08, 6);

  // Дно — конус перевёрнутый
  const bottomGeo = new THREE.ConeGeometry(0.08, 0.05, 6);

  // Стекло
  const glassGeo = new THREE.CylinderGeometry(0.06, 0.06, 0.12, 8);

  // Пламя
  const flameGeo = new THREE.SphereGeometry(0.025, 6, 6);

  // Кронштейн — маленькая палочка
  const bracketGeo = new THREE.CylinderGeometry(0.015, 0.02, 0.15, 4);

  /* ==========================================================
     ТЕКСТУРА ОРЕОЛА
     ========================================================== */
  const glowTex = (() => {
    const size = 64;
    const cv = document.createElement('canvas');
    cv.width = cv.height = size;
    const ctx = cv.getContext('2d');

    const g = ctx.createRadialGradient(
      size / 2, size / 2, 0,
      size / 2, size / 2, size / 2
    );
    g.addColorStop(0.0, 'rgba(255, 220, 150, 1)');
    g.addColorStop(0.3, 'rgba(255, 180, 90, 0.6)');
    g.addColorStop(0.7, 'rgba(255, 140, 50, 0.15)');
    g.addColorStop(1.0, 'rgba(255, 120, 40, 0)');

    ctx.fillStyle = g;
    ctx.fillRect(0, 0, size, size);

    const tex = new THREE.CanvasTexture(cv);
    tex.colorSpace = THREE.SRGBColorSpace;
    return tex;
  })();

  /* ==========================================================
     СОЗДАНИЕ ФОНАРИКОВ
     ========================================================== */

  const lanterns = [];

  for (let i = 0; i < lanternCount; i++) {
    /* --- Позиция — на стенах или выступах --- */
    const side = i % 3;

    let x, y, z;
    let rotation = 0;

    if (side === 0) {
      // Левая стена
      x = -10.5 + Math.random() * 1;
      y = -2 + Math.random() * 8;
      z = -18 + Math.random() * 24;
      rotation = Math.PI / 2;   // смотрит вправо
    } else if (side === 1) {
      // Правая стена
      x = 10.5 - Math.random() * 1;
      y = -2 + Math.random() * 8;
      z = -18 + Math.random() * 24;
      rotation = -Math.PI / 2;  // смотрит влево
    } else {
      // Задняя стена
      x = (Math.random() - 0.5) * 16;
      y = -2 + Math.random() * 8;
      z = -20.5 + Math.random() * 1;
      rotation = 0;             // смотрит вперёд
    }

    /* --- Группа --- */
    const lanternGroup = new THREE.Group();
    lanternGroup.position.set(x, y, z);
    lanternGroup.rotation.y = rotation;
    group.add(lanternGroup);

    /* --- Кронштейн --- */
    const bracket = new THREE.Mesh(bracketGeo, metalMat);
    bracket.rotation.z = Math.PI / 2;
    bracket.position.set(-0.075, 0, 0);  // торчит из стены
    lanternGroup.add(bracket);

    /* --- Корпус --- */
    const bodyGroup = new THREE.Group();
    bodyGroup.position.x = -0.15;   // на конце кронштейна
    lanternGroup.add(bodyGroup);

    // Верхний конус
    const cap = new THREE.Mesh(capGeo, metalMat);
    cap.position.y = 0.1;
    bodyGroup.add(cap);

    // Основной корпус
    const body = new THREE.Mesh(bodyGeo, metalMat);
    bodyGroup.add(body);

    // Стекло внутри
    const glass = new THREE.Mesh(glassGeo, glassMat);
    glass.position.y = 0.0;
    bodyGroup.add(glass);

    // Пламя
    const flame = new THREE.Mesh(flameGeo, flameMat);
    flame.position.y = 0.0;
    flame.scale.set(1, 1.6, 1);
    bodyGroup.add(flame);

    // Дно
    const bottom = new THREE.Mesh(bottomGeo, metalMat);
    bottom.rotation.x = Math.PI;
    bottom.position.y = -0.12;
    bodyGroup.add(bottom);

    /* --- Ореол свечения --- */
    const halo = new THREE.Sprite(
      new THREE.SpriteMaterial({
        map: glowTex,
        color: 0xffa050,
        transparent: true,
        opacity: 0.7,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
      })
    );
    halo.scale.set(0.5, 0.5, 1);
    halo.position.y = 0.0;
    bodyGroup.add(halo);

    /* --- Свет — только у 40% фонариков --- */
    let light = null;
    if (Math.random() < 0.4) {
      light = new THREE.PointLight(
        0xffa050,
        0.7,
        3.5,
        2
      );
      light.position.y = 0.0;
      bodyGroup.add(light);
    }

    lanterns.push({
      group: bodyGroup,
      flame,
      flameMat: flameMat.clone(),
      halo,
      light,
      phase: Math.random() * Math.PI * 2,
      flickerSpeed: 0.5 + Math.random() * 0.5,
      baseIntensity: 0.7,
    });
  }

  /* ==========================================================
     МОТЫЛЬКИ вокруг некоторых фонариков
     ==========================================================
     Маленькие светящиеся точки, кружащие вокруг.
     ========================================================== */
  const mothCount = isLow ? 10 : isMedium ? 20 : 35;

  const mothGeo = new THREE.BufferGeometry();
  const mothPos = new Float32Array(mothCount * 3);
  const mothCol = new Float32Array(mothCount * 3);
  const mothData = [];

  for (let i = 0; i < mothCount; i++) {
    // Привязываем к случайному фонарику
    const lanternIdx = Math.floor(Math.random() * lanternCount);

    // Вокруг какой-то точки рядом с фонариком
    const angle = Math.random() * Math.PI * 2;
    const radius = 0.2 + Math.random() * 0.5;

    mothData.push({
      lanternIdx,
      radius,
      angle,
      speed: 0.5 + Math.random() * 1.2,
      yPhase: Math.random() * Math.PI * 2,
      ySpeed: 0.6 + Math.random() * 0.8,
      yAmp: 0.05 + Math.random() * 0.1,
    });

    // Цвет — золотой
    mothCol[i * 3]     = 1.0;
    mothCol[i * 3 + 1] = 0.85;
    mothCol[i * 3 + 2] = 0.55;
  }

  mothGeo.setAttribute('position', new THREE.BufferAttribute(mothPos, 3));
  mothGeo.setAttribute('color', new THREE.BufferAttribute(mothCol, 3));

  const mothMat = new THREE.PointsMaterial({
    size: 0.04,
    map: glowTex,
    vertexColors: true,
    transparent: true,
    opacity: 0.85,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
    sizeAttenuation: true,
  });

  const moths = new THREE.Points(mothGeo, mothMat);
  group.add(moths);

  /* ==========================================================
     API
     ========================================================== */
  return {
    group,

    update(time) {
      // Фонарики мерцают
      lanterns.forEach((l) => {
        const flicker = 0.85 + Math.sin(time * 12 + l.phase) * 0.08
                             + Math.sin(time * 7.3 + l.phase * 2) * 0.05;

        // Пламя
        l.flame.scale.set(1, 1.6 + flicker * 0.2, 1);
        l.flameMat.opacity = 0.85 + flicker * 0.15;

        // Ореол
        l.halo.material.opacity = 0.55 + flicker * 0.2;
        l.halo.scale.setScalar(0.45 + flicker * 0.1);

        // Свет
        if (l.light) {
          l.light.intensity = l.baseIntensity * flicker;
        }
      });

      // Мотыльки кружат вокруг фонариков
      const mPos = mothGeo.attributes.position.array;

      for (let i = 0; i < mothCount; i++) {
        const d = mothData[i];

        // Позиция фонарика
        const l = lanterns[d.lanternIdx];
        if (!l) continue;

        // Мировые координаты фонарика
        const wp = new THREE.Vector3();
        l.group.getWorldPosition(wp);

        // Орбита вокруг
        d.angle += d.speed * (1 / 60);

        mPos[i * 3]     = wp.x + Math.cos(d.angle) * d.radius;
        mPos[i * 3 + 1] = wp.y + Math.sin(time * d.ySpeed + d.yPhase) * d.yAmp;
        mPos[i * 3 + 2] = wp.z + Math.sin(d.angle) * d.radius;
      }
      mothGeo.attributes.position.needsUpdate = true;
    },

    dispose() {
      if (group.parent) group.parent.remove(group);
      group.traverse((o) => {
        if (o.geometry) o.geometry.dispose();
        if (o.material &&
            o.material !== materials.glowTex) {
          if (Array.isArray(o.material)) o.material.forEach((m) => m.dispose());
          else o.material.dispose();
        }
      });
      metalMat.dispose();
      glassMat.dispose();
      flameMat.dispose();
      bodyGeo.dispose();
      capGeo.dispose();
      bottomGeo.dispose();
      glassGeo.dispose();
      flameGeo.dispose();
      bracketGeo.dispose();
      glowTex.dispose();
      mothGeo.dispose();
      mothMat.dispose();
    },
  };
}
