import * as THREE from 'three';

/* =========================================================
   RIFT — кристаллический разлом с артом внутри
   =========================================================
   Финальная версия:
   - Арт заполняет весь разлом (не обрезан)
   - Трещины — тонкие тёмные линии между осколками
   - Кайма — узкая светящаяся линия снаружи
   - Осколки вокруг — тёмное стекло (не светятся)
   ========================================================= */

export function createRift(parent, options = {}) {
  const {
    position   = { x: 0, y: 0, z: 0 },
    rotation   = { x: 0, y: 0, z: 0 },
    width      = 3.6,
    height     = 4.8,
    artTexture = null,
    color      = 0xc99aff,
    aspect     = 'portrait',
  } = options;

  const group = new THREE.Group();
  group.position.set(position.x, position.y, position.z);
  group.rotation.set(rotation.x, rotation.y, rotation.z);
  parent.add(group);

  const finalArtTex = artTexture || makePlaceholderArt(aspect);

  /* ==========================================================
     ПЛОСКОСТЬ
     ========================================================== */
  const PLANE_SCALE = 2.5;
  const planeW = width * PLANE_SCALE;
  const planeH = height * PLANE_SCALE;

  const geo = new THREE.PlaneGeometry(planeW, planeH, 64, 96);

  const material = new THREE.ShaderMaterial({
    uniforms: {
      uTime:     { value: 0 },
      uProgress: { value: 0 },
      uArt:      { value: finalArtTex },
      uColor:    { value: new THREE.Color(color) },
      uSeed:     { value: Math.random() * 100 },
      uAspect:   { value: planeW / planeH },
    },
    vertexShader: /* glsl */`
      uniform float uTime;
      uniform float uProgress;
      uniform float uSeed;
      varying vec2 vUv;

      void main() {
        vUv = uv;
        vec3 pos = position;

        // Очень лёгкая дрожь — не искажает арт
        float t = uTime * 0.5 + uSeed;
        pos.z += sin(pos.x * 1.5 + t) * 0.02 * uProgress;

        gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);
      }
    `,
    fragmentShader: /* glsl */`
      uniform float uTime;
      uniform float uProgress;
      uniform sampler2D uArt;
      uniform vec3 uColor;
      uniform float uSeed;
      uniform float uAspect;

      varying vec2 vUv;

      #define SECTORS 8.0
      #define BASE_RADIUS 0.75

      float hash1(float n) {
        return fract(sin(n * 91.3458) * 47453.5453);
      }
      float hash2(vec2 p) {
        return fract(sin(dot(p, vec2(12.9898, 78.233))) * 43758.5453);
      }
      float noise(vec2 p) {
        vec2 i = floor(p);
        vec2 f = fract(p);
        vec2 u = f * f * (3.0 - 2.0 * f);
        return mix(
          mix(hash2(i), hash2(i + vec2(1.0, 0.0)), u.x),
          mix(hash2(i + vec2(0.0, 1.0)), hash2(i + vec2(1.0, 1.0)), u.x),
          u.y
        );
      }

      void main() {
        vec2 uv = vUv;

        // ============================================
        // ПОЛЯРНЫЕ КООРДИНАТЫ
        // ============================================
        vec2 p = uv - 0.5;
        p.x *= uAspect;
        float r = length(p) * 2.0;
        float angle = atan(p.y, p.x);

        // ============================================
        // СЕКТОРА
        // ============================================
        float sectorF      = (angle + 3.14159265) / 6.28318530 * SECTORS;
        float sectorId     = floor(sectorF);
        float sectorLocal  = fract(sectorF);
        float sectorCenter = abs(sectorLocal - 0.5) * 2.0;

        float seedA = hash1(sectorId + uSeed);
        float seedB = hash1(sectorId + uSeed + 7.0);

        // ============================================
        // РАДИУС РАСКРЫТИЯ
        // ============================================
        float fragLength = BASE_RADIUS * (0.75 + seedA * 0.25);
        float edgeNoise  = noise(vec2(angle * 4.0 + uSeed, r * 3.0)) - 0.5;
        float currentRadius = uProgress * (fragLength + edgeNoise * 0.04);

        // Каскад открытия
        float openThreshold = seedB * 0.25;
        float openSmooth = smoothstep(openThreshold, openThreshold + 0.1, uProgress);
        currentRadius *= openSmooth;

        // ============================================
        // МАСКА РАЗЛОМА
        // ============================================
        float fragment = 1.0 - smoothstep(currentRadius - 0.012, currentRadius, r);

        // ============================================
        // АРТ — ЗАПОЛНЯЕТ ВЕСЬ РАЗЛОМ
        // ============================================
        // Разлом имеет радиус BASE_RADIUS в r-пространстве.
        // Переводим это в UV с учётом аспекта плоскости.
        vec2 span = vec2(BASE_RADIUS / uAspect, BASE_RADIUS);
        vec2 artUv = (uv - 0.5) / span + 0.5;
        artUv = clamp(artUv, 0.001, 0.999);
        vec3 artRgb = texture2D(uArt, artUv).rgb;

        // ============================================
        // ТЁМНЫЕ ТРЕЩИНЫ между осколками
        // ============================================
        float crackLine = smoothstep(0.96, 1.0, sectorCenter);
        float crackMask = crackLine * fragment;
        vec3 crackDark = vec3(0.01, 0.005, 0.02);

        vec3 finalColor = mix(artRgb, crackDark, crackMask * 0.9);

        // ============================================
        // КАЙМА — только внешняя тонкая линия
        // ============================================
        float outerLine = smoothstep(currentRadius, currentRadius + 0.006, r)
                        * (1.0 - smoothstep(currentRadius + 0.006, currentRadius + 0.018, r));

        // Внутренняя еле заметная подсветка граней
        float innerEdge = (1.0 - smoothstep(currentRadius - 0.008, currentRadius, r)) * fragment;

        finalColor = mix(finalColor, uColor, innerEdge * 0.1);
        finalColor += uColor * outerLine * 0.9;

        // ============================================
        // АЛЬФА
        // ============================================
        float alpha = fragment * 0.98 + outerLine * 0.9;
        alpha *= smoothstep(0.0, 0.05, uProgress);
        if (alpha < 0.02) discard;

        gl_FragColor = vec4(finalColor, alpha);
      }
    `,
    transparent: true,
    depthWrite: false,
    blending: THREE.NormalBlending,
    side: THREE.DoubleSide,
  });

  const plane = new THREE.Mesh(geo, material);
  group.add(plane);

  /* ==========================================================
     СВЕТ — минимальный
     ========================================================== */
  const light = new THREE.PointLight(color, 0, 4, 2);
  light.position.set(0, 0, 0.6);
  group.add(light);

  /* ==========================================================
     ОСКОЛКИ ВОКРУГ — ТЁМНОЕ СТЕКЛО
     ========================================================== */
  const shardGeo = new THREE.TetrahedronGeometry(0.06, 0);
  const shards = [];
  const shardCount = 10;

  for (let i = 0; i < shardCount; i++) {
    // Тёмный фиолет, почти чёрный. Не светится.
    const mat = new THREE.MeshStandardMaterial({
      color: 0x1a0a2e,
      emissive: 0x0a0418,
      emissiveIntensity: 0.1,
      roughness: 0.15,
      metalness: 0.85,
      transparent: true,
      opacity: 0,
      flatShading: true,
    });
    const shard = new THREE.Mesh(shardGeo, mat);

    const angle = (i / shardCount) * Math.PI * 2;
    const radiusX = width * 0.75;
    const radiusY = height * 0.75;

    shard.userData = {
      angle,
      radiusX,
      radiusY,
      phase: Math.random() * Math.PI * 2,
      rotSpeed: 0.4 + Math.random() * 0.7,
      baseScale: 0.35 + Math.random() * 0.5,
    };

    shard.position.set(Math.cos(angle) * radiusX, Math.sin(angle) * radiusY, 0);
    shard.scale.setScalar(0.001);

    group.add(shard);
    shards.push(shard);
  }

  /* ==========================================================
     СОСТОЯНИЕ
     ========================================================== */
  const state = {
    progress: 0,
    targetProgress: 0,
    revealSpeed: 2.5,
  };

  /* ==========================================================
     API
     ========================================================== */
  return {
    group,
    material,
    light,

    setProgress(p) {
      state.targetProgress = Math.max(0, Math.min(1, p));
    },

    update(time, dt) {
      state.progress += (state.targetProgress - state.progress) *
                       (1 - Math.exp(-state.revealSpeed * dt));

      material.uniforms.uTime.value = time;
      material.uniforms.uProgress.value = state.progress;

      // Свет практически отключён — арт сам себя освещает
      light.intensity = state.progress * 0.05;

      shards.forEach((s) => {
        const d = s.userData;
        const wobble = Math.sin(time * 0.6 + d.phase) * 0.1;
        s.position.x = Math.cos(d.angle + time * 0.15) * (d.radiusX + wobble);
        s.position.y = Math.sin(d.angle + time * 0.15) * (d.radiusY + wobble);
        s.position.z = Math.sin(time * 0.4 + d.phase) * 0.2;

        s.rotation.x = time * d.rotSpeed;
        s.rotation.y = time * d.rotSpeed * 0.8;
        s.rotation.z = time * d.rotSpeed * 0.6;

        const scale = d.baseScale * (0.15 + state.progress * 0.85);
        s.scale.setScalar(scale);
        s.material.opacity = state.progress * 0.85;
      });
    },

    dispose() {
      if (group.parent) group.parent.remove(group);
      if (!artTexture && finalArtTex && finalArtTex.dispose) finalArtTex.dispose();
      geo.dispose();
      material.dispose();
      shardGeo.dispose();
      shards.forEach((s) => s.material?.dispose?.());
    },
  };
}

/* =========================================================
   ЗАГЛУШКА АРТА
   ========================================================= */
function makePlaceholderArt(aspect = 'portrait') {
  const size = 1024;
  const w = aspect === 'portrait' ? size * 0.7 : size;
  const h = aspect === 'portrait' ? size : size * 0.7;

  const cv = document.createElement('canvas');
  cv.width = w;
  cv.height = h;
  const ctx = cv.getContext('2d');

  const grad = ctx.createRadialGradient(w / 2, h / 2, 50, w / 2, h / 2, Math.max(w, h) / 1.5);
  grad.addColorStop(0, '#3a1568');
  grad.addColorStop(0.5, '#1a0b35');
  grad.addColorStop(1, '#08040f');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, w, h);

  for (let i = 0; i < 60; i++) {
    ctx.strokeStyle = `rgba(${180 + Math.random() * 75}, ${120 + Math.random() * 100}, 255, ${0.05 + Math.random() * 0.2})`;
    ctx.lineWidth = 0.5 + Math.random() * 2;
    ctx.beginPath();
    const x = Math.random() * w;
    const y = Math.random() * h;
    ctx.moveTo(x, y);
    const len = 100 + Math.random() * 300;
    const a = Math.random() * Math.PI * 2;
    ctx.lineTo(x + Math.cos(a) * len, y + Math.sin(a) * len);
    ctx.stroke();
  }

  for (let i = 0; i < 12; i++) {
    const x = Math.random() * w;
    const y = Math.random() * h;
    const r = 50 + Math.random() * 150;
    const g2 = ctx.createRadialGradient(x, y, 0, x, y, r);
    g2.addColorStop(0, `rgba(201, 154, 255, ${0.15 + Math.random() * 0.25})`);
    g2.addColorStop(1, 'rgba(201, 154, 255, 0)');
    ctx.fillStyle = g2;
    ctx.fillRect(x - r, y - r, r * 2, r * 2);
  }

  ctx.strokeStyle = 'rgba(255, 154, 212, 0.4)';
  ctx.lineWidth = 3;
  ctx.strokeRect(20, 20, w - 40, h - 40);

  ctx.fillStyle = 'rgba(224, 200, 255, 0.85)';
  ctx.font = 'bold 42px serif';
  ctx.textAlign = 'center';
  ctx.fillText('АРТ', w / 2, h / 2 - 10);
  ctx.font = '24px monospace';
  ctx.fillStyle = 'rgba(168, 102, 238, 0.7)';
  ctx.fillText('[ЗАГЛУШКА]', w / 2, h / 2 + 40);

  const tex = new THREE.CanvasTexture(cv);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.minFilter = THREE.LinearMipmapLinearFilter;
  tex.magFilter = THREE.LinearFilter;
  tex.needsUpdate = true;
  return tex;
}