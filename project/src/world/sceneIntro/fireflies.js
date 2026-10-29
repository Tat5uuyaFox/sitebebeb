import * as THREE from 'three';
import { PALETTE } from './shared.js';

/* =========================================================
   FIREFLIES — золотые светлячки
   =========================================================
   Композиция по референсу:

   ✨  ✨       ✨
       ✨  ✨           ✨   ← в воздухе, тёплые, золотые
   ✨          ✨   ✨
       ✨  ✨
   🌿   🏮   🌿  🌿  💧

   - Тёплый золотой цвет (не белый)
   - Летают по Lissajous-кривым (не синусоиды)
   - Мигают в своём ритме
   - 15-40 штук, не больше

   Никаких "200 частиц на весь экран" — только те,
   что видно и создают магию.
   ========================================================= */

export function createFireflies(parent, materials, qualityLevel = 'high') {
  const group = new THREE.Group();
  parent.add(group);

  // Количество — по качеству
  const count = qualityLevel === 'low' ? 12
              : qualityLevel === 'medium' ? 25
              : 40;

  /* ==========================================================
     ГЕОМЕТРИЯ
     ==========================================================
     Один Points — все светлячки в одном дравколле.
     ========================================================== */
  const geo = new THREE.BufferGeometry();
  const positions = new Float32Array(count * 3);
  const colors = new Float32Array(count * 3);

  // Данные каждого светлячка
  const data = [];

  /* ==========================================================
     ГЕНЕРАЦИЯ
     ==========================================================
     Lissajous-кривые:
     x = A₁ * sin(a·t + δ₁)
     y = A₂ * sin(b·t + δ₂)
     z = A₃ * sin(c·t + δ₃)

     С a, b, c — несоизмеримые числа (например, 1, √2, √3).
     Тогда кривая НЕ повторяется — движение не циклическое,
     а постоянно новое. Как настоящие светлячки.

     Плюс — каждый "привязан" к базовой точке в пространстве,
     вокруг которой летает по этой кривой.
     ========================================================== */

  for (let i = 0; i < count; i++) {
    // --- Базовая позиция: где-то в объёме сцены ---
    // Слева больше (там фонарь), справа меньше
    const side = Math.random() < 0.6 ? -1 : 1;
    const baseX = side * (1 + Math.random() * 4);

    // Высота: y ∈ [-4, 2] — над полом, до уровня глаз
    const baseY = -4 + Math.random() * 6;

    // Глубина: z ∈ [-8, 10] — от камеры до глубины
    const baseZ = -8 + Math.random() * 18;

    // --- Амплитуда Lissajous-кривой ---
    const ampX = 0.3 + Math.random() * 0.8;
    const ampY = 0.3 + Math.random() * 0.8;
    const ampZ = 0.3 + Math.random() * 0.8;

    // --- Частоты: несоизмеримые числа для уникальности ---
    // 1.0, 1.4142 (√2), 1.7320 (√3) — базовые
    // Каждый светлячок получает СВОЮ комбинацию
    const freqX = 0.5 + Math.random() * 1.5;
    const freqY = 0.5 + Math.random() * 1.5;
    const freqZ = 0.5 + Math.random() * 1.5;

    // --- Фазы: сдвигают движение по кривой ---
    const phaseX = Math.random() * Math.PI * 2;
    const phaseY = Math.random() * Math.PI * 2;
    const phaseZ = Math.random() * Math.PI * 2;

    // --- Скорость течения времени для этого светлячка ---
    const timeSpeed = 0.3 + Math.random() * 0.5;

    // --- Мигание ---
    const blinkSpeed = 1.5 + Math.random() * 3.0;
    const blinkPhase = Math.random() * Math.PI * 2;

    // --- Цвет: 80% тёплые золотые, 20% светлые-тёплые ---
    const isWarm = Math.random() < 0.8;
    const colR = 1.0;
    const colG = isWarm ? 0.85 + Math.random() * 0.1 : 0.95;
    const colB = isWarm ? 0.5 + Math.random() * 0.15 : 0.85;

    colors[i * 3]     = colR;
    colors[i * 3 + 1] = colG;
    colors[i * 3 + 2] = colB;

    // --- Начальная позиция — на кривой при t = 0 ---
    positions[i * 3]     = baseX + Math.sin(phaseX) * ampX;
    positions[i * 3 + 1] = baseY + Math.sin(phaseY) * ampY;
    positions[i * 3 + 2] = baseZ + Math.sin(phaseZ) * ampZ;

    data.push({
      baseX, baseY, baseZ,
      ampX, ampY, ampZ,
      freqX, freqY, freqZ,
      phaseX, phaseY, phaseZ,
      timeSpeed,
      blinkSpeed,
      blinkPhase,
      // Смещение времени — чтобы все не мигали синхронно
      timeOffset: Math.random() * 100,
    });
  }

  geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  geo.setAttribute('color', new THREE.BufferAttribute(colors, 3));

  /* ==========================================================
     МАТЕРИАЛ
     ==========================================================
     PointsMaterial с текстурой свечения.
     VertexColors — каждый светлячок со своим оттенком.
     ========================================================== */
  const mat = new THREE.PointsMaterial({
    size: 0.18,
    map: materials.glowTex,
    vertexColors: true,
    transparent: true,
    opacity: 0.9,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
    sizeAttenuation: true,
  });

  const points = new THREE.Points(geo, mat);
  group.add(points);

  /* ==========================================================
     МЕРЦАЮЩИЕ ОРЕОЛЫ
     ==========================================================
     Отдельные маленькие спрайты, которые мерцают резче,
     чем точки. Создают эффект "вспышек" — как у настоящих
     светлячков.
     ========================================================== */
  const haloCount = qualityLevel === 'low' ? 4 : 8;
  const halos = [];

  for (let i = 0; i < haloCount; i++) {
    const haloSprite = new THREE.Sprite(
      new THREE.SpriteMaterial({
        map: materials.glowTex,
        color: PALETTE.goldLight,
        transparent: true,
        opacity: 0.7,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
      })
    );
    haloSprite.scale.set(0.6, 0.6, 1);

    // Позиция — привязана к первым haloCount светлячкам
    const d = data[i];
    haloSprite.position.set(
      d.baseX + Math.sin(d.phaseX) * d.ampX,
      d.baseY + Math.sin(d.phaseY) * d.ampY,
      d.baseZ + Math.sin(d.phaseZ) * d.ampZ
    );

    group.add(haloSprite);

    halos.push({
      sprite: haloSprite,
      dataIndex: i,
      blinkOffset: Math.random() * Math.PI * 2,
    });
  }

  /* ==========================================================
     API
     ========================================================== */
  return {
    group,

    update(time) {
      const pos = geo.attributes.position.array;

      // Обновляем позиции всех светлячков
      for (let i = 0; i < count; i++) {
        const d = data[i];
        const t = (time + d.timeOffset) * d.timeSpeed;

        // Lissajous-кривая — 3 независимых синуса
        const x = d.baseX + Math.sin(t * d.freqX + d.phaseX) * d.ampX;
        const y = d.baseY + Math.sin(t * d.freqY + d.phaseY) * d.ampY;
        const z = d.baseZ + Math.sin(t * d.freqZ + d.phaseZ) * d.ampZ;

        pos[i * 3]     = x;
        pos[i * 3 + 1] = y;
        pos[i * 3 + 2] = z;
      }
      geo.attributes.position.needsUpdate = true;

      // Мигание — общая прозрачность слегка колеблется
      // (индивидуальное мигание делается через halos)
      mat.opacity = 0.7 + Math.sin(time * 1.5) * 0.2;

      // Мерцающие ореолы — каждый в своём ритме
      halos.forEach((h) => {
        const d = data[h.dataIndex];
        const t = (time + d.timeOffset) * d.timeSpeed;

        // Позиция — та же, что у светлячка
        h.sprite.position.set(
          d.baseX + Math.sin(t * d.freqX + d.phaseX) * d.ampX,
          d.baseY + Math.sin(t * d.freqY + d.phaseY) * d.ampY,
          d.baseZ + Math.sin(t * d.freqZ + d.phaseZ) * d.ampZ
        );

        // Мигание — острая функция для "вспышек"
        // pow(sin, 8) даёт узкий пик — короткая яркая вспышка
        const blinkRaw = Math.sin(time * d.blinkSpeed + d.blinkPhase) * 0.5 + 0.5;
        const blink = Math.pow(blinkRaw, 8);

        h.sprite.material.opacity = 0.15 + blink * 0.85;
        h.sprite.scale.setScalar(0.4 + blink * 0.8);
      });
    },

    dispose() {
      if (group.parent) group.parent.remove(group);
      geo.dispose();
      mat.dispose();
      halos.forEach((h) => h.sprite.material.dispose());
    },
  };
}