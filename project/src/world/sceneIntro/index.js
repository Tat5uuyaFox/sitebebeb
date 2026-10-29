import * as THREE from 'three';
import { createMaterials }   from './shared.js';
import { createAtmosphere }  from './atmosphere.js';
import { createEntrance }    from './entrance.js';
import { createGround }      from './ground.js';
import { createWater }       from './water.js';
import { createProps }       from './props.js';
import { createDepth }       from './depth.js';
import { createParticles }   from './particles.js';
import { createCave }        from './cave.js';
import { createLanterns }    from './lanterns.js';

/* =========================================================
   SCENE INTRO BUILDER — сборка всех модулей
   =========================================================
   ФИНАЛЬНАЯ ВЕРСИЯ.

   Что здесь:
   - Создание общих материалов
   - Создание всех модулей в правильном порядке
   - Передача scene в atmosphere (свет идёт в scene)
   - Передача group в остальные модули
   - Прогресс через setProgress

   Порядок модулей:
   1. atmosphere    — туман, фон, свет (в scene)
   2. cave          — стены, потолок, сталактиты
   3. ground        — земля, дорожка, галька
   4. water         — ручей по камням
   5. entrance      — лианы, ягоды, споры
   6. props         — деревья, фонарь, валуны, грибы
   7. lanterns      — маленькие фонарики на стенах
   8. depth         — кристаллы в глубине
   9. particles     — светлячки, пыль, glowworms
   ========================================================= */

export function createSceneIntroWorld(scene, qualityLevel = 'high') {
  // Keep procedural dressing reproducible: the cave should have the same
  // balanced silhouette every time the page is loaded.
  const nativeRandom = Math.random;
  let randomState = 0x51f15e;
  Math.random = () => {
    randomState = (randomState * 1664525 + 1013904223) >>> 0;
    return randomState / 0x100000000;
  };
  /* ==========================================================
     ГРУППА ДЛЯ ВСЕХ ОБЪЕКТОВ
     ==========================================================
     Все объекты сцены — в одной группе.
     Свет и туман — напрямую в scene (через atmosphere).
     ========================================================== */
  const group = new THREE.Group();
  scene.add(group);

  /* ==========================================================
     ОБЩИЕ МАТЕРИАЛЫ
     ==========================================================
     Создаются один раз — используются всеми модулями.
     ========================================================== */
  const materials = createMaterials();

  /* ==========================================================
     МОДУЛИ — В ПОРЯДКЕ РЕНДЕРА
     ========================================================== */

  // 1. АТМОСФЕРА — туман, фон, базовый свет
  //    ⚠️ Принимает SCENE, не group — свет идёт в сцену
  let atmosphere;

  // 2. CAVE — стены, потолок, сталактиты, мшистые пятна
  //    Принимает group — объекты в группу
  let cave;

  // 3. GROUND — земля с шумом, дорожка, галька
  let ground;

  // 4. WATER — ручей с камнями и шейдером
  let water;

  // 5. ENTRANCE — лианы, ягоды на нитях, споры
  let entrance;

  // 6. PROPS — деревья с корнями, фонарь, валуны, грибы
  let props;

  // 7. LANTERNS — маленькие фонарики на стенах
  let lanterns;

  // 8. DEPTH — фиолетовые кристаллы в глубине
  let depth;

  // 9. PARTICLES — светлячки, пыль, glowworms, лишайники
  let particles;

  try {
    atmosphere = createAtmosphere(scene, qualityLevel);
    cave = createCave(group, materials, qualityLevel);
    ground = createGround(group, materials, qualityLevel);
    water = createWater(group, materials, qualityLevel);
    entrance = createEntrance(group, materials, qualityLevel);
    props = createProps(group, materials, qualityLevel);
    lanterns = createLanterns(group, materials, qualityLevel);
    depth = createDepth(group, materials, qualityLevel);
    particles = createParticles(group, materials, qualityLevel);
  } finally {
    Math.random = nativeRandom;
  }

  /* ==========================================================
     UPDATABLE МОДУЛИ
     ==========================================================
     Только те, у которых есть метод update().
     ========================================================== */
  const updatables = [
    atmosphere,
    cave,
    ground,
    water,
    entrance,
    props,
    lanterns,
    depth,
    particles,
  ].filter((m) => typeof m.update === 'function');

  /* ==========================================================
     API
     ========================================================== */
  return {
    group,
    materials,

    /* Ссылки на модули — для доступа извне */
    modules: {
      atmosphere,
      cave,
      ground,
      water,
      entrance,
      props,
      lanterns,
      depth,
      particles,
    },

    /* ---------------------------------------------------------
       UPDATE — каждый кадр из loop
       --------------------------------------------------------- */
    update(time, dt) {
      for (let i = 0; i < updatables.length; i++) {
        updatables[i].update(time, dt);
      }
    },

    /* ---------------------------------------------------------
       PROGRESS — 0..1 из scrollScenes
       ---------------------------------------------------------
       Что происходит:
       - depth: кристаллы раскрываются
       - water: фонарь в отражениях смещается
       - atmosphere: туман меняет цвет синий → фиолетовый
       --------------------------------------------------------- */
    setProgress(p) {
      const clamped = Math.max(0, Math.min(1, p));

      // Кристаллы
      if (depth.setProgress) depth.setProgress(clamped);

      // Вода
      if (water.setProgress) water.setProgress(clamped);

      /* --- Туман: синий → фиолетовый --- */
      const forestHex  = 0x080a15;
      const crystalHex = 0x0a0520;

      let fogHex;
      if (clamped <= 0.5) {
        fogHex = forestHex;
      } else if (clamped >= 0.7) {
        fogHex = crystalHex;
      } else {
        const t = (clamped - 0.5) / 0.2;

        const fr = (forestHex  >> 16) & 0xff;
        const fg = (forestHex  >> 8)  & 0xff;
        const fb = forestHex          & 0xff;

        const cr = (crystalHex >> 16) & 0xff;
        const cg = (crystalHex >> 8)  & 0xff;
        const cb = crystalHex         & 0xff;

        const r = Math.round(fr + (cr - fr) * t);
        const g = Math.round(fg + (cg - fg) * t);
        const b = Math.round(fb + (cb - fb) * t);

        fogHex = (r << 16) | (g << 8) | b;
      }

      atmosphere.setFogColor(fogHex);
    },

    /* ---------------------------------------------------------
       DISPOSE — очистка всей сцены
       --------------------------------------------------------- */
    dispose() {
      // Модули
      updatables.forEach((m) => {
        if (typeof m.dispose === 'function') m.dispose();
      });

      // Общие текстуры
      materials.mossTex?.dispose();
      materials.glowTex?.dispose();
      materials.glowPurpleTex?.dispose();
      materials.dotTex?.dispose();
      materials.leafTex?.dispose();
      materials.barkTex?.dispose();
      materials.rockTex?.dispose();

      // Текстуры внутри материалов
      materials.mossFloor?.map?.dispose();
      materials.mossFloor?.bumpMap?.dispose();
      materials.moss?.map?.dispose();
      materials.rock?.map?.dispose();
      materials.bark?.map?.dispose();
      materials.bark?.bumpMap?.dispose();
      materials.leaf?.map?.dispose();
      materials.leafDark?.map?.dispose();

      // Материалы
      materials.mossFloor?.dispose();
      materials.moss?.dispose();
      materials.rock?.dispose();
      materials.silhouette?.dispose();
      materials.bark?.dispose();
      materials.leaf?.dispose();
      materials.leafDark?.dispose();

      // Убираем группу из scene
      if (group.parent) group.parent.remove(group);
    },
  };
}
