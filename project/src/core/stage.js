import * as THREE from 'three';
import { getQualityConfig } from './quality.js';

/* =========================================================
   STAGE — рендерер, сцена, камера, свет
   =========================================================
   Фундамент всего проекта. Один файл — одна ответственность.

   Внутри:
   - WebGLRenderer с правильными настройками
   - Scene с фоном и туманом
   - Camera
   - 4 источника света (ambient, hemisphere, moon, deepHint)
   ========================================================= */

export function createStage(canvas, qualityLevel = 'high') {
  const q = getQualityConfig(qualityLevel);

  /* ==========================================================
     RENDERER
     ========================================================== */
  const renderer = new THREE.WebGLRenderer({
    canvas,
    antialias: false,                           // сглаживание даёт postfx
    powerPreference: qualityLevel === 'low' ? 'default' : 'high-performance',
    stencil: false,
    depth: true,
  });

  renderer.setPixelRatio(Math.min(window.devicePixelRatio, q.pixelRatio));
  renderer.setSize(window.innerWidth, window.innerHeight);

  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping      = THREE.ReinhardToneMapping;
  renderer.toneMappingExposure = 1.6;
  renderer.shadowMap.enabled = q.shadows;
  renderer.shadowMap.type    = THREE.PCFSoftShadowMap;

  /* ==========================================================
     SCENE
     ========================================================== */
  const scene = new THREE.Scene();
  scene.background = new THREE.Color(0x05100a);   // тёмно-зелёный
  scene.fog        = new THREE.FogExp2(0x05100a, 0.055);

  /* ==========================================================
     CAMERA
     ========================================================== */
  const camera = new THREE.PerspectiveCamera(
    55,
    window.innerWidth / window.innerHeight,
    0.3,
    120
  );
  camera.position.set(0, -3.5, 14);
  camera.lookAt(0, -4.5, 5);

  /* ==========================================================
     СВЕТ — 4 источника
     ==========================================================
     Здесь ЯВНО и ПРОСТО. Каждый свет добавляется в scene.
     Никаких групп, никакой путаницы.
     ========================================================== */

  // 1. AMBIENT — базовый свет для всей сцены
  //    Высокий, чтобы мох и камни были видны везде
  const ambient = new THREE.AmbientLight(0x4a6a5a, 1.3);
  scene.add(ambient);

  // 2. HEMISPHERE — мягкое заполнение сверху/снизу
  const hemi = new THREE.HemisphereLight(
    0x6a8a9a,   // sky — голубоватый
    0x1a3a20,   // ground — тёмно-зелёный
    1.0
  );
  scene.add(hemi);

  // 3. MOON — направленный свет сверху, для объёма
  const moon = new THREE.DirectionalLight(0x8aa8b0, 0.7);
  moon.position.set(3, 10, 4);
  scene.add(moon);

  // 4. DEEP HINT — фиолетовый свет из глубины
  const deepHint = new THREE.PointLight(0x5a2f9a, 0.8, 30, 2);
  deepHint.position.set(0, -3, -15);
  scene.add(deepHint);

  /* ==========================================================
     RESIZE
     ========================================================== */
  function handleResize() {
    const w = window.innerWidth;
    const h = window.innerHeight;

    camera.aspect = w / h;
    camera.updateProjectionMatrix();

    renderer.setPixelRatio(Math.min(window.devicePixelRatio, q.pixelRatio));
    renderer.setSize(w, h);
  }

  window.addEventListener('resize', handleResize);

  /* ==========================================================
     API
     ========================================================== */
  return {
    renderer,
    scene,
    camera,
    ambient,
    hemi,
    moon,
    deepHint,
    quality: q,

    // Меняем качество на лету
    setQuality(level) {
      const newQ = getQualityConfig(level);
      renderer.setPixelRatio(Math.min(window.devicePixelRatio, newQ.pixelRatio));
      renderer.shadowMap.enabled = newQ.shadows;
    },

    // Меняем цвет тумана (для перехода между мирами)
    setFogColor(hex) {
      scene.fog.color.setHex(hex);
      scene.background.setHex(hex);
    },

    // Меняем экспозицию
    setExposure(value) {
      renderer.toneMappingExposure = value;
    },

    destroy() {
      window.removeEventListener('resize', handleResize);
      renderer.dispose();
    },
  };
}