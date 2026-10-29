import * as THREE from 'three';

import { detectQuality }          from './core/quality.js';
import { createOptimizer }        from './core/optimizer.js';
import { createStage }            from './core/stage.js';
import { createScroll }           from './core/scroll.js';
import { createPostFX }           from './core/postfx.js';
import { createSceneTransition }  from './animations/sceneTransition.js';
import { createSceneManager }     from './world/scenes/sceneManager.js';
import { createSceneIntro }       from './world/scenes/sceneIntro.js';
import { createSceneFactions }    from './world/scenes/sceneFactions.js';
import { createSceneWorld }       from './world/scenes/sceneWorld.js';
import { createScrollScenes }     from './animations/scrollScenes.js';
import { createTextReveal }       from './animations/textReveal.js';
import { createIntro }            from './animations/intro.js';
import { createPolish }           from './ui/polish.js';

import { preloadArtAssets }       from './core/preload.js';

async function init() {
  const canvas = document.getElementById('stage');

  /* ============================================================
     0. ОПРЕДЕЛЯЕМ КАЧЕСТВО
     ============================================================ */
  const quality = detectQuality();

  /* ============================================================
     1. ЯДРО — с учётом качества
     ============================================================ */
  const { renderer, scene, camera, setQuality: setStageQuality } =
    createStage(canvas, quality.level);

  const postfx = createPostFX(renderer, scene, camera, quality.level);


  const scroll = createScroll();

  /* ============================================================
     2. ПЕРЕХОД + МЕНЕДЖЕР
     ============================================================ */
  const transition = createSceneTransition(renderer);
  transition.setProgress(1);

  const sceneManager = createSceneManager({ scene, camera, postfx, transition });

  /* ============================================================
     3. ПРЕДЗАГРУЗКА
     ============================================================ */
  let artTextures = {};
  try {
    artTextures = await preloadArtAssets();
  } catch (e) {
    console.warn('[Main] Арты не загрузились:', e);
  }

  /* ============================================================
     4. РЕГИСТРАЦИЯ СЦЕН — передаём quality
     ============================================================ */
  sceneManager.register('intro',    (ctx) => createSceneIntro({ ...ctx, artTextures, quality: quality.level }));
  sceneManager.register('factions', (ctx) => createSceneFactions({ ...ctx, artTextures, quality: quality.level }));
  sceneManager.register('world',    (ctx) => createSceneWorld({ ...ctx, artTextures, quality: quality.level }));

  await sceneManager.goTo('intro', { withTransition: false });

  /* ============================================================
     5. UI и остальное
     ============================================================ */
  const scrollScenes = createScrollScenes({ sceneManager, scroll, transition });
  createTextReveal({ scroll });
  const polish = createPolish();

  window.addEventListener('resize', () => postfx.resize());

  /* ============================================================
     6. ОПТИМИЗАТОР — следит за FPS и меняет качество
     ============================================================ */
  const optimizer = createOptimizer({
    initialLevel: quality.level,
    onDowngrade: (newLevel) => {
      console.log(`[Main] Даунгрейд до ${newLevel}`);
      setStageQuality(newLevel);
      postfx.setQuality(newLevel);
      renderer.setPixelRatio(Math.min(window.devicePixelRatio, newLevel === 'low' ? 1 : 1.5));
    },
    onUpgrade: (newLevel) => {
      console.log(`[Main] Апгрейд до ${newLevel}`);
      setStageQuality(newLevel);
      postfx.setQuality(newLevel);
      renderer.setPixelRatio(Math.min(window.devicePixelRatio, newLevel === 'high' ? 2 : 1.5));
    },
  });

  /* ============================================================
     7. ЦИКЛ
     ============================================================ */
  const clock = new THREE.Clock();

  function loop() {
    requestAnimationFrame(loop);

    const dt   = Math.min(clock.getDelta(), 0.05);
    const time = clock.elapsedTime;

    // Оптимизатор следит за FPS
    optimizer.update(dt);

    sceneManager.update(time, dt);
    postfx.update(time);

    postfx.composer.render();

    transition.update(time);
    transition.render();
  }
  loop();

  /* ============================================================
     8. ИНТРО
     ============================================================ */
  const intro = createIntro({ camera, sceneManager, scroll, transition, postfx, sound: polish });
  await intro.play(Promise.resolve());

}

init();
