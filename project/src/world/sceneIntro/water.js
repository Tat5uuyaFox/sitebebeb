import * as THREE from 'three';
import { PALETTE } from './shared.js';

/* =========================================================
   WATER — ручей по камням
   =========================================================
   ПЕРЕПИСАНО С НУЛЯ.

   Концепция (по референсу):
   - Ручей течёт по каменному дну
   - Крупные камни торчат из воды
   - Мелкие камни на дне просвечивают
   - Тёмная вода с отражениями фонаря
   - Лёгкое течение (не волны, а поток)
   - Пена у камней

   Технически:
   - Ручей = плоскость с прозрачностью
   - Дно = отдельные камни под водой
   - Камни над водой = торчат
   - Шейдер воды с потоком и отражениями
   ========================================================= */

export function createWater(parent, materials, qualityLevel = 'high') {
  const group = new THREE.Group();
  parent.add(group);

  const isLow = qualityLevel === 'low';
  const isMedium = qualityLevel === 'medium';

  /* ==========================================================
     КОНФИГ
     ========================================================== */
  const q = {
    bottomRocks:  isLow ? 10 : isMedium ? 18 : 28,
    topRocks:     isLow ? 5  : isMedium ? 9 : 14,
    mistCount:    isLow ? 15 : isMedium ? 30 : 50,
  };

  // Параметры ручья
  const RIVER_X = 3.4;      // справа от дорожки
  const RIVER_Z = -1;       // центр по Z
  const RIVER_W = 5.0;      // широкий ручей как второй композиционный план
  const RIVER_L = 17;
  const RIVER_Y = -5.35;    // уровень воды

  /* ==========================================================
     1. ДНО РУЧЬЯ — тёмная поверхность под водой
     ========================================================== */
  const bottomGeo = new THREE.PlaneGeometry(RIVER_W - 0.3, RIVER_L - 0.3, 20, 30);

  // Искажаем — дно неровное
  const bpos = bottomGeo.attributes.position.array;
  for (let i = 0; i < bpos.length; i += 3) {
    const x = bpos[i];
    const y = bpos[i + 1];
    const noise = Math.sin(x * 2.3) * Math.cos(y * 1.7) * 0.15
                + Math.sin(x * 5.1 + y * 3.4) * 0.08;
    bpos[i + 2] = noise;
  }
  bottomGeo.computeVertexNormals();

  const bottomMat = new THREE.MeshStandardMaterial({
    color: 0x03080c,
    roughness: 1.0,
    metalness: 0.0,
    emissive: 0x0a1a20,
    emissiveIntensity: 0.15,
  });

  const bottom = new THREE.Mesh(bottomGeo, bottomMat);
  bottom.rotation.x = -Math.PI / 2;
  bottom.position.set(RIVER_X, RIVER_Y - 0.15, RIVER_Z);
  bottom.receiveShadow = true;
  group.add(bottom);

  /* ==========================================================
     2. КАМНИ НА ДНЕ — видны через воду
     ========================================================== */
  const rockGeo = new THREE.IcosahedronGeometry(1, 1);

  // Искажаем форму
  const rpos = rockGeo.attributes.position.array;
  for (let j = 0; j < rpos.length; j += 3) {
    const n = Math.sin(rpos[j] * 4.5) * Math.cos(rpos[j + 1] * 3.8);
    const scale = 1 + n * 0.2;
    rpos[j]     *= scale;
    rpos[j + 1] *= 1 + n * 0.1;
    rpos[j + 2] *= scale;
  }
  rockGeo.computeVertexNormals();

  const bottomRockMat = new THREE.MeshStandardMaterial({
    color: 0x0a0a14,
    map: materials.rockTex,
    roughness: 0.95,
    metalness: 0.05,
    flatShading: true,
    emissive: 0x05080a,
    emissiveIntensity: 0.1,
  });

  const bottomRocks = new THREE.InstancedMesh(
    rockGeo,
    bottomRockMat,
    q.bottomRocks
  );

  const matrix = new THREE.Matrix4();
  const quat = new THREE.Quaternion();
  const pos = new THREE.Vector3();
  const scl = new THREE.Vector3();

  for (let i = 0; i < q.bottomRocks; i++) {
    const x = RIVER_X + (Math.random() - 0.5) * (RIVER_W - 0.8);
    const z = RIVER_Z + (Math.random() - 0.5) * (RIVER_L - 0.8);

    pos.set(x, RIVER_Y - 0.3 + Math.random() * 0.15, z);

    quat.setFromEuler(new THREE.Euler(
      Math.random() * Math.PI,
      Math.random() * Math.PI,
      Math.random() * Math.PI
    ));

    // Размер — разный
    const size = 0.1 + Math.random() * 0.35;
    scl.set(
      size * (0.8 + Math.random() * 0.4),
      size * (0.4 + Math.random() * 0.3),
      size * (0.8 + Math.random() * 0.4)
    );

    matrix.compose(pos, quat, scl);
    bottomRocks.setMatrixAt(i, matrix);
  }
  bottomRocks.instanceMatrix.needsUpdate = true;
  bottomRocks.castShadow = false;
  bottomRocks.receiveShadow = true;
  group.add(bottomRocks);

  /* ==========================================================
     3. КАМНИ НАД ВОДОЙ — торчат из ручья
     ==========================================================
     Меньше по количеству, но крупнее.
     ========================================================== */
  const topRockMat = new THREE.MeshStandardMaterial({
    color: 0x0a0a14,
    map: materials.rockTex,
    roughness: 0.95,
    metalness: 0.05,
    flatShading: true,
    emissive: 0x0a0510,
    emissiveIntensity: 0.1,
  });

  const topRocks = new THREE.InstancedMesh(
    rockGeo,
    topRockMat,
    q.topRocks
  );

  for (let i = 0; i < q.topRocks; i++) {
    const x = RIVER_X + (Math.random() - 0.5) * (RIVER_W - 1);
    const z = RIVER_Z + (Math.random() - 0.5) * (RIVER_L - 1);

    // Высота — торчат над водой
    const size = 0.2 + Math.random() * 0.4;

    pos.set(
      x,
      RIVER_Y - 0.15 + size * 0.6,
      z
    );

    quat.setFromEuler(new THREE.Euler(
      Math.random() * Math.PI,
      Math.random() * Math.PI,
      Math.random() * Math.PI
    ));

    scl.set(
      size * (0.9 + Math.random() * 0.4),
      size * (0.6 + Math.random() * 0.4),
      size * (0.9 + Math.random() * 0.4)
    );

    matrix.compose(pos, quat, scl);
    topRocks.setMatrixAt(i, matrix);
  }
  topRocks.instanceMatrix.needsUpdate = true;
  topRocks.castShadow = true;
  topRocks.receiveShadow = true;
  group.add(topRocks);

  /* ==========================================================
     4. ВОДА — прозрачная плоскость с шейдером
     ==========================================================
     Плоскость на уровне RIVER_Y.
     Шейдер:
     - Течение (движение UV по Z)
     - Отражения фонаря
     - Прозрачность (видно дно)
     - Пена у камней
     ========================================================== */
  const waterGeo = new THREE.PlaneGeometry(RIVER_W, RIVER_L, 1, 1);

  const waterMat = new THREE.ShaderMaterial({
    uniforms: {
      uTime:         { value: 0 },
      uLanternPos:   { value: new THREE.Vector2(0.15, 0.3) },
      uProgress:     { value: 0.0 },

      // Цвета воды
      uColorDeep:    { value: new THREE.Color(0x02060a) },   // почти чёрный
      uColorMid:     { value: new THREE.Color(0x051218) },   // средний
      uColorShallow: { value: new THREE.Color(0x0a1a28) },   // мелкий
      uColorGold:    { value: new THREE.Color(0xffb070) },   // отражения
      uColorFoam:    { value: new THREE.Color(0x3a4a4a) },   // пена
    },
    vertexShader: /* glsl */`
      varying vec2 vUv;
      void main() {
        vUv = uv;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
      }
    `,
    fragmentShader: /* glsl */`
      uniform float uTime;
      uniform vec2  uLanternPos;
      uniform float uProgress;
      uniform vec3  uColorDeep;
      uniform vec3  uColorMid;
      uniform vec3  uColorShallow;
      uniform vec3  uColorGold;
      uniform vec3  uColorFoam;
      varying vec2 vUv;

      // Шум
      float hash(vec2 p) {
        return fract(sin(dot(p, vec2(12.9898, 78.233))) * 43758.5453);
      }
      float noise(vec2 p) {
        vec2 i = floor(p);
        vec2 f = fract(p);
        vec2 u = f * f * (3.0 - 2.0 * f);
        return mix(
          mix(hash(i), hash(i + vec2(1.0, 0.0)), u.x),
          mix(hash(i + vec2(0.0, 1.0)), hash(i + vec2(1.0, 1.0)), u.x),
          u.y
        );
      }

      void main() {
        vec2 uv = vUv;

        // ============================================
        // ТЕЧЕНИЕ — движется по Z (вдоль ручья)
        // ============================================
        float flow = uTime * 0.4;

        // Смещение UV по потоку
        vec2 flowUv = uv + vec2(0.0, -flow * 0.3);

        // Лёгкая рябь — шум
        float ripple1 = noise(flowUv * vec2(6.0, 20.0));
        float ripple2 = noise(flowUv * vec2(12.0, 40.0) + 42.0);

        // Общая активность
        float activity = ripple1 * 0.6 + ripple2 * 0.4;

        // ============================================
        // БАЗОВЫЙ ЦВЕТ — прозрачность к берегам
        // ============================================
        // Чем ближе к краю — тем прозрачнее
        float edgeDist = min(
          abs(uv.x - 0.5) * 2.0,
          1.0
        );

        // Цвет — тёмная вода по центру
        vec3 color = mix(uColorShallow, uColorMid, edgeDist);
        color = mix(color, uColorDeep, edgeDist * 0.5);

        // ============================================
        // ОТРАЖЕНИЯ ФОНАРЯ
        // ============================================
        vec2 toLantern = uv - uLanternPos;
        float lanternDist = length(toLantern);

        // Полосы отражений — на гребнях
        float reflection1 = smoothstep(0.65, 0.95, activity);
        float reflection2 = smoothstep(0.8, 0.98, ripple1);

        float reflection = reflection1 * 0.6 + reflection2 * 0.4;

        // Затухание по расстоянию
        float falloff = 1.0 / (1.0 + lanternDist * lanternDist * 3.0);

        // Мерцание
        float flicker = 0.9 + sin(uTime * 11.0) * 0.05 + sin(uTime * 7.3) * 0.03;

        // Не рисуем движущиеся золотые пятна: источник тёплого света
        // расположен на берегу, вода остаётся холодной и спокойной.

        // ============================================
        // ПЕНА у гребней
        // ============================================
        float foam = smoothstep(0.88, 1.0, activity);
        color += uColorFoam * foam * 0.08;

        // ============================================
        // БЛИКИ
        // ============================================
        vec2 sparkleGrid = floor(uv * vec2(50.0, 100.0));
        float sparkleRand = hash(sparkleGrid + floor(uTime * 2.0));
        float sparkle = step(0.995, sparkleRand) * smoothstep(0.82, 0.95, activity);
        color += vec3(0.18, 0.32, 0.52) * sparkle * 0.12;

        // ============================================
        // ПРОЗРАЧНОСТЬ
        // ============================================
        // У берегов — прозрачнее, чтобы видеть камни дна
        float alpha = 0.6 + (1.0 - edgeDist) * 0.35;

        // Небольшое колебание
        alpha *= 0.9 + activity * 0.1;

        gl_FragColor = vec4(color, alpha);
      }
    `,
    transparent: true,
    depthWrite: false,
    polygonOffset: true,
    polygonOffsetFactor: -1,
    polygonOffsetUnits: -1,
  });

  const water = new THREE.Mesh(waterGeo, waterMat);
  water.rotation.x = -Math.PI / 2;
  water.position.set(RIVER_X, RIVER_Y, RIVER_Z);
  water.renderOrder = 1;
  group.add(water);

  /* ==========================================================
     5. ПЕНА у камней над водой — маленькие спрайты
     ========================================================== */
  const foamCount = isLow ? 2 : isMedium ? 4 : 6;
  const foams = [];

  // Текстура пены
  const foamTex = (() => {
    const size = 64;
    const cv = document.createElement('canvas');
    cv.width = cv.height = size;
    const ctx = cv.getContext('2d');
    const g = ctx.createRadialGradient(
      size / 2, size / 2, 0,
      size / 2, size / 2, size / 2
    );
    g.addColorStop(0.0, 'rgba(180, 200, 200, 0.6)');
    g.addColorStop(0.5, 'rgba(140, 170, 170, 0.3)');
    g.addColorStop(1.0, 'rgba(100, 130, 130, 0)');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, size, size);
    const tex = new THREE.CanvasTexture(cv);
    tex.colorSpace = THREE.SRGBColorSpace;
    return tex;
  })();

  for (let i = 0; i < foamCount; i++) {
    const foamSprite = new THREE.Sprite(
      new THREE.SpriteMaterial({
        map: foamTex,
        color: 0x6a8a8a,
        transparent: true,
        opacity: 0.12,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
      })
    );

    // У случайных камней над водой
    const x = RIVER_X + (Math.random() - 0.5) * (RIVER_W - 1);
    const z = RIVER_Z + (Math.random() - 0.5) * (RIVER_L - 1);

    foamSprite.position.set(x, RIVER_Y + 0.05, z);
    foamSprite.scale.set(0.4 + Math.random() * 0.4, 0.15, 1);

    group.add(foamSprite);

    foams.push({
      sprite: foamSprite,
      baseOpacity: 0.06 + Math.random() * 0.05,
      phase: Math.random() * Math.PI * 2,
    });
  }

  /* ==========================================================
     6. ТУМАН над водой
     ========================================================== */
  const mistGeo = new THREE.BufferGeometry();
  const mistPos = new Float32Array(q.mistCount * 3);
  const mistData = [];

  for (let i = 0; i < q.mistCount; i++) {
    const x = RIVER_X + (Math.random() - 0.5) * (RIVER_W + 1);
    const y = RIVER_Y + 0.1 + Math.random() * 0.6;
    const z = RIVER_Z + (Math.random() - 0.5) * RIVER_L;

    mistPos[i * 3]     = x;
    mistPos[i * 3 + 1] = y;
    mistPos[i * 3 + 2] = z;

    mistData.push({
      baseX: x,
      baseY: y,
      baseZ: z,
      phase: Math.random() * Math.PI * 2,
      driftSpeed: 0.1 + Math.random() * 0.2,
      driftRadius: 0.3 + Math.random() * 0.5,
    });
  }
  mistGeo.setAttribute('position', new THREE.BufferAttribute(mistPos, 3));

  const mistMat = new THREE.PointsMaterial({
    size: 0.8,
    map: materials.glowTex,
    color: 0x3a5a5a,
    transparent: true,
    opacity: 0.1,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
    sizeAttenuation: true,
  });

  const mist = new THREE.Points(mistGeo, mistMat);
  group.add(mist);

  /* ==========================================================
     7. СВЕТ ОТ ВОДЫ
     ========================================================== */
  const waterLight = new THREE.PointLight(0x526bff, 0.45, 8, 2);
  waterLight.position.set(RIVER_X, RIVER_Y + 0.3, RIVER_Z);
  group.add(waterLight);

  /* ==========================================================
     API
     ========================================================== */
  return {
    group,

    setProgress(p) {
      waterMat.uniforms.uProgress.value = p;

      // Позиция фонаря в отражениях
      waterMat.uniforms.uLanternPos.value.set(
        0.15 + p * 0.1,
        0.3 + p * 0.05
      );
    },

    update(time) {
      waterMat.uniforms.uTime.value = time;

      // Пена мерцает
      foams.forEach((f) => {
        const pulse = 0.5 + Math.sin(time * 1.2 + f.phase) * 0.5;
        f.sprite.material.opacity = f.baseOpacity * (0.6 + pulse * 0.4);
        f.sprite.scale.x = 0.35 + pulse * 0.2;
      });

      // Туман дрейфует
      const mPos = mistGeo.attributes.position.array;
      for (let i = 0; i < q.mistCount; i++) {
        const d = mistData[i];
        mPos[i * 3]     = d.baseX + Math.sin(time * d.driftSpeed + d.phase) * d.driftRadius;
        mPos[i * 3 + 1] = d.baseY + Math.sin(time * d.driftSpeed * 0.5 + d.phase) * 0.08;
        mPos[i * 3 + 2] = d.baseZ + Math.cos(time * d.driftSpeed * 0.8 + d.phase) * d.driftRadius;
      }
      mistGeo.attributes.position.needsUpdate = true;

      // Свет воды
      waterLight.intensity = 0.4;
    },

    dispose() {
      if (group.parent) group.parent.remove(group);
      bottomGeo.dispose();
      bottomMat.dispose();
      rockGeo.dispose();
      bottomRockMat.dispose();
      topRockMat.dispose();
      waterGeo.dispose();
      waterMat.dispose();
      foamTex.dispose();
      foams.forEach((f) => f.sprite.material.dispose());
      mistGeo.dispose();
      mistMat.dispose();
    },
  };
}
