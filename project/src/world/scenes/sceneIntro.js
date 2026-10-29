import * as THREE from 'three';
import { createSceneIntroWorld } from '../sceneIntro/index.js';

/* =========================================================
   SCENE INTRO — камера и обвязка
   =========================================================
   ПЕРЕПИСАНО:

   Было:
   - Камера на z=14 — вплотную к лианам
   - Смотрит вниз — верх кадра пустой
   - FOV 55° — узко

   Стало:
   - Камера на z=18 — есть пространство
   - Смотрит прямо/чуть вверх
   - FOV 60° — видно больше
   - 5 ключевых кадров для плавного полёта

   Ключевые кадры:
   0.0 → общий план входа (z=18)
   0.25 → медленный проезд (z=14)
   0.5 → смотрим в центр (z=10)
   0.75 → вглубь сцены (z=5)
   1.0 → в кристальной полости (z=1)
   ========================================================= */

/* =========================================================
   КЛЮЧЕВЫЕ КАДРЫ
   =========================================================
   Каждый кадр задаёт позицию камеры и куда она смотрит.

   pos — где стоит камера
   look — куда смотрит

   Траектория: от z=18 (снаружи) вглубь до z=1 (в полости)
   ========================================================= */
const CAMERA_KEYS = [
  // 0.0 — общий план входа
  {
    pos:  { x: 0,    y: -2.5, z: 18 },
    look: { x: 0,    y: -2.0, z: 10 },
  },
  // 0.25 — проезд внутрь
  {
    pos:  { x: 0.2,  y: -2.4, z: 14 },
    look: { x: 0,    y: -2.0, z: 6 },
  },
  // 0.5 — центр сцены
  {
    pos:  { x: 0.4,  y: -2.3, z: 10 },
    look: { x: 0,    y: -2.0, z: 2 },
  },
  // 0.75 — смотрим вглубь
  {
    pos:  { x: 0.3,  y: -2.2, z: 5 },
    look: { x: 0,    y: -2.0, z: -6 },
  },
  // 1.0 — в кристальной полости
  {
    pos:  { x: 0,    y: -2.0, z: 1 },
    look: { x: 0,    y: -2.0, z: -15 },
  },
];

export function createSceneIntro({ scene, camera, postfx, quality, artTextures }) {
  /* ==========================================================
     МИР — все модули
     ========================================================== */
  const world = createSceneIntroWorld(scene, quality);

  /* ==========================================================
     НАСТРОЙКИ КАМЕРЫ
     ==========================================================
     FOV 60° — шире чем 55°, видно больше по краям
     ========================================================== */
  camera.fov = 60;
  camera.updateProjectionMatrix();

  /* ==========================================================
     КРИВЫЕ КАМЕРЫ
     ==========================================================
     CatmullRom — плавный полёт через 5 точек.
     tension 0.5 — естественное движение без изгибов.
     ========================================================== */
  const posCurve = new THREE.CatmullRomCurve3(
    CAMERA_KEYS.map((k) => new THREE.Vector3(k.pos.x, k.pos.y, k.pos.z)),
    false,
    'catmullrom',
    0.5
  );

  const lookCurve = new THREE.CatmullRomCurve3(
    CAMERA_KEYS.map((k) => new THREE.Vector3(k.look.x, k.look.y, k.look.z)),
    false,
    'catmullrom',
    0.5
  );

  /* ==========================================================
     СОСТОЯНИЕ
     ========================================================== */
  let smoothProgress = 0;
  let targetProgress = 0;

  const prevPos = new THREE.Vector3().copy(posCurve.getPoint(0));

  /* ==========================================================
     API
     ========================================================== */
  return {
    group: world.group,
    name: 'intro',

    setProgress(p) {
      targetProgress = Math.max(0, Math.min(1, p));
    },

    update(time, dt) {
      /* --- Сглаживание прогресса --- */
      const lambda = 3.5;
      smoothProgress += (targetProgress - smoothProgress)
                     * (1 - Math.exp(-lambda * dt));

      /* --- Позиция и цель взгляда --- */
      const pos  = posCurve.getPoint(smoothProgress);
      const look = lookCurve.getPoint(smoothProgress);

      /* --- Лёгкий крен при движении --- */
      const dx = pos.x - prevPos.x;
      let targetRoll = -dx * 0.6;
      targetRoll = Math.max(-0.05, Math.min(0.05, targetRoll));
      prevPos.copy(pos);

      /* --- Применяем к камере --- */
      camera.position.copy(pos);
      camera.up.set(0, 1, 0);
      camera.lookAt(look);
      camera.rotateZ(targetRoll);

      /* --- Обновляем мир --- */
      world.update(time, dt);
      // Camera progress is also the scene progress, driven by scrollScenes.
      world.setProgress(smoothProgress);

      /* --- Bloom --- */
      if (postfx) {
        postfx.setBloom({ strength: 0.3 + smoothProgress * 0.3 });
        postfx.setProgress(smoothProgress);
      }
    },

    dispose() {
      world.dispose();
    },
  };
}
