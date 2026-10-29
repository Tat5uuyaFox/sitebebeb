import * as THREE from 'three';

/* =========================================================
   PORTAL — центральный объект вселенной
   =========================================================
   Состав:
   1. Внутренний диск с шейдером (энергия, искажение)
   2. Кольцо из кристаллических сегментов (вращается)
   3. Внешнее кольцо поменьше (вращается в обратную сторону)
   4. Парящие осколки вокруг (орбита)
   5. Ядро-свет из центра

   Принимает parent (Group или Scene) — куда добавить группу.
   ========================================================= */

export function createPortal(parent) {
  const group = new THREE.Group();
  group.position.set(0, 0, 0);
  parent.add(group);

  /* ==========================================================
     1. ВНУТРЕННИЙ ДИСК — шейдер «энергии»
     ========================================================== */
  const discGeo = new THREE.CircleGeometry(1.5, 96);

  const discMat = new THREE.ShaderMaterial({
    uniforms: {
      uTime:      { value: 0 },
      uColor1:    { value: new THREE.Color(0x1a4a8a) },  // ← синий
      uColor2:    { value: new THREE.Color(0x3ad88a) },  // ← изумруд
      uColor3:    { value: new THREE.Color(0x7a3fd4) },  // ← фиолет
      uIntensity: { value: 1.0 },
    },
    vertexShader: /* glsl */`
      varying vec2 vUv;
      varying vec3 vPos;
      void main() {
        vUv = uv;
        vPos = position;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
      }
    `,
    fragmentShader: /* glsl */`
      uniform float uTime;
      uniform vec3 uColor1;
      uniform vec3 uColor2;
      uniform vec3 uColor3;
      uniform float uIntensity;

      varying vec2 vUv;
      varying vec3 vPos;

      // 2D-шум
      float hash(vec2 p) {
        return fract(sin(dot(p, vec2(12.9898, 78.233))) * 43758.5453);
      }
      float noise(vec2 p) {
        vec2 i = floor(p);
        vec2 f = fract(p);
        vec2 u = f * f * (3.0 - 2.0 * f);
        return mix(
          mix(hash(i + vec2(0.0, 0.0)), hash(i + vec2(1.0, 0.0)), u.x),
          mix(hash(i + vec2(0.0, 1.0)), hash(i + vec2(1.0, 1.0)), u.x),
          u.y
        );
      }

      void main() {
        vec2 uv = vUv - 0.5;
        float r = length(uv) * 2.0;         // 0 в центре, 1 по краю
        float angle = atan(uv.y, uv.x);

        // Спиральные вихри, вращающиеся вокруг центра
        float swirl1 = noise(vec2(angle * 3.0 + uTime * 0.6, r * 4.0 - uTime * 0.3));
        float swirl2 = noise(vec2(angle * 5.0 - uTime * 0.4, r * 6.0 + uTime * 0.2));

        // Центр — ярче. Край — тусклее.
        float core = smoothstep(0.0, 1.0, 1.0 - r);
        core = pow(core, 1.4);

        // Гравитационный градиент — ярко у центра
        float edge = smoothstep(1.0, 0.7, r);

        // Пульсация
        float pulse = 0.85 + sin(uTime * 1.4) * 0.15;

        // Смешение цветов по спирали
        vec3 colorA = mix(uColor1, uColor2, swirl1);
        vec3 colorB = mix(uColor2, uColor3, swirl2);
        vec3 color = mix(colorA, colorB, 0.5 + 0.5 * sin(angle + uTime * 0.5));

        // Финальная интенсивность
        color *= core * edge * pulse * uIntensity * 1.8;

        // Мягкое затухание к краю — нет жёсткого круга
        float alpha = edge;
        // Яркая кайма в самом центре
        alpha += smoothstep(0.3, 0.0, r) * 0.6;

        gl_FragColor = vec4(color, alpha);
      }
    `,
    transparent: true,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
    side: THREE.DoubleSide,
  });

  const disc = new THREE.Mesh(discGeo, discMat);
  group.add(disc);

  /* ==========================================================
     2. ВНУТРЕННЕЕ КОЛЬЦО — кристаллические сегменты
     ========================================================== */
  const ring1 = new THREE.Group();
  group.add(ring1);

  const crystalMat = new THREE.MeshPhysicalMaterial({
    color: 0x7a3fd4,
    emissive: 0x4a1f8a,
    emissiveIntensity: 0.8,
    roughness: 0.1,
    metalness: 0.3,
    transmission: 0.7,
    thickness: 0.3,
    ior: 2.2,
    iridescence: 0.6,
    iridescenceIOR: 1.8,
    clearcoat: 1.0,
    clearcoatRoughness: 0.05,
    transparent: true,
    opacity: 0.95,
    side: THREE.DoubleSide,
  });

  const crystalMatAlt = new THREE.MeshPhysicalMaterial({
    color: 0xc99aff,
    emissive: 0x7a3fd4,
    emissiveIntensity: 0.6,
    roughness: 0.1,
    metalness: 0.3,
    transmission: 0.7,
    thickness: 0.3,
    ior: 2.2,
    iridescence: 0.6,
    iridescenceIOR: 1.8,
    clearcoat: 1.0,
    clearcoatRoughness: 0.05,
    transparent: true,
    opacity: 0.95,
    side: THREE.DoubleSide,
  });

  const RING1_RADIUS = 1.85;
  const RING1_SEGMENTS = 12;
  const innerCrystals = [];

  for (let i = 0; i < RING1_SEGMENTS; i++) {
    const angle = (i / RING1_SEGMENTS) * Math.PI * 2;

    // Каждый сегмент — вытянутый октаэдр, как лезвие кристалла
    const segGeo = new THREE.OctahedronGeometry(0.32, 0);
    const mat = i % 2 === 0 ? crystalMat : crystalMatAlt;
    const seg = new THREE.Mesh(segGeo, mat);

    seg.position.set(
      Math.cos(angle) * RING1_RADIUS,
      Math.sin(angle) * RING1_RADIUS,
      0
    );

    // Ориентируем лезвие так, чтобы оно «смотрело» от центра
    seg.rotation.z = angle + Math.PI / 2;
    // Вытягиваем по длине
    seg.scale.set(0.5, 1.6, 0.5);
    seg.castShadow = false;
    seg.receiveShadow = false;

    seg.userData = {
      angle,
      baseRadius: RING1_RADIUS,
      phase: Math.random() * Math.PI * 2,
      mat,
      baseEmissive: 0.8,
    };

    ring1.add(seg);
    innerCrystals.push(seg);
  }

  /* ==========================================================
     3. ВНЕШНЕЕ КОЛЬЦО — мелкие осколки
     ========================================================== */
  const ring2 = new THREE.Group();
  group.add(ring2);

  const shardPalette = [
  { color: 0x3ad88a, emissive: 0x1a7a5a },   // зелёный
  { color: 0x6ad8ff, emissive: 0x1a4a8a },   // голубой
  { color: 0xa866ee, emissive: 0x4a1f8a },   // фиолет
  { color: 0x7aff9a, emissive: 0x3ad88a },   // ядовитый
  { color: 0x1a7a5a, emissive: 0x0a3a2a },   // тёмно-зелёный
];

  const shardMat = new THREE.MeshStandardMaterial({
    color: 0xa866ee,
    emissive: 0x7a3fd4,
    emissiveIntensity: 1.2,
    roughness: 0.2,
    metalness: 0.4,
  });

  const RING2_RADIUS = 2.4;
  const RING2_SEGMENTS = 24;
  const outerShards = [];

  for (let i = 0; i < RING2_SEGMENTS; i++) {
    const angle = (i / RING2_SEGMENTS) * Math.PI * 2;
    const size = 0.06 + Math.random() * 0.08;

    const shardGeo = new THREE.TetrahedronGeometry(size, 0);
    const shard = new THREE.Mesh(shardGeo, shardMat.clone());

    shard.position.set(
      Math.cos(angle) * RING2_RADIUS,
      Math.sin(angle) * RING2_RADIUS,
      (Math.random() - 0.5) * 0.15
    );
    shard.rotation.set(
      Math.random() * Math.PI,
      Math.random() * Math.PI,
      Math.random() * Math.PI
    );

    shard.userData = {
      angle,
      baseRadius: RING2_RADIUS,
      phase: Math.random() * Math.PI * 2,
      rotSpeed: {
        x: (Math.random() - 0.5) * 1.5,
        y: (Math.random() - 0.5) * 1.5,
        z: (Math.random() - 0.5) * 1.5,
      },
    };

    ring2.add(shard);
    outerShards.push(shard);
  }

  /* ==========================================================
     4. ЯДРО — свет из центра
     ========================================================== */
  const coreLight = new THREE.PointLight(0x3ad88a, 2.0, 7, 2);
  coreLight.position.set(0, 0, 0);
  group.add(coreLight);

  // Дополнительный слабый свет со смещением — для объёма
  const secondaryLight = new THREE.PointLight(0x6ad8ff, 0.4, 4, 2);
  secondaryLight.position.set(0, 0, 0.5);
  group.add(secondaryLight);

  /* ==========================================================
     5. ЗАДНЯЯ ПОДСВЕТКА — точечные «искры» вокруг
     ========================================================== */
  const sparkGeo = new THREE.BufferGeometry();
  const sparkCount = 60;
  const sparkPositions = new Float32Array(sparkCount * 3);
  const sparkSpeeds = new Float32Array(sparkCount);
  const sparkPhases = new Float32Array(sparkCount);

  for (let i = 0; i < sparkCount; i++) {
    const angle = Math.random() * Math.PI * 2;
    const radius = 1.8 + Math.random() * 1.2;
    sparkPositions[i * 3]     = Math.cos(angle) * radius;
    sparkPositions[i * 3 + 1] = Math.sin(angle) * radius;
    sparkPositions[i * 3 + 2] = (Math.random() - 0.5) * 1.5;
    sparkSpeeds[i] = 0.15 + Math.random() * 0.3;
    sparkPhases[i] = Math.random() * Math.PI * 2;
  }
  sparkGeo.setAttribute('position', new THREE.BufferAttribute(sparkPositions, 3));

  // Процедурная текстура искры
  const sparkTex = (() => {
    const size = 64;
    const cv = document.createElement('canvas');
    cv.width = cv.height = size;
    const ctx = cv.getContext('2d');
    const g = ctx.createRadialGradient(
      size / 2, size / 2, 0,
      size / 2, size / 2, size / 2
    );
    g.addColorStop(0.0, 'rgba(255, 240, 255, 1)');
    g.addColorStop(0.3, 'rgba(201, 154, 255, 0.7)');
    g.addColorStop(0.7, 'rgba(122, 63, 212, 0.2)');
    g.addColorStop(1.0, 'rgba(74, 31, 138, 0)');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, size, size);

    const tex = new THREE.CanvasTexture(cv);
    tex.colorSpace = THREE.SRGBColorSpace;
    return tex;
  })();

  const sparkMat = new THREE.PointsMaterial({
    size: 0.12,
    map: sparkTex,
    transparent: true,
    opacity: 0.9,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
    color: 0xc99aff,
    sizeAttenuation: true,
  });

  const sparks = new THREE.Points(sparkGeo, sparkMat);
  group.add(sparks);

  /* ==========================================================
     6. API
     ========================================================== */
  return {
    group,
    disc,
    discMat,
    ring1,
    ring2,
    innerCrystals,
    outerShards,
    sparks,
    sparkGeo,
    sparkSpeeds,
    sparkPhases,
    coreLight,
    secondaryLight,

    /* Вызывается из loop.js каждый кадр */
    update(time, dt, state = {}) {
      const {
        scale = 1.0,
        discIntensity = 1.0,
        spinSpeed = 1.0,
        coreIntensity = 1.0,
      } = state;

      // Диск — время и интенсивность
      discMat.uniforms.uTime.value = time;
      discMat.uniforms.uIntensity.value = discIntensity;

      // Внутреннее кольцо вращается медленно
      ring1.rotation.z = time * 0.15 * spinSpeed;

      // Внешнее кольцо — в обратную сторону, быстрее
      ring2.rotation.z = -time * 0.22 * spinSpeed;

      // Кристаллы внутреннего кольца «дышат»
      innerCrystals.forEach((c) => {
        const d = c.userData;

        // Пульсация свечения
        const pulse = 0.7 + Math.sin(time * 1.8 + d.phase) * 0.5;
        if (d.mat.emissiveIntensity !== undefined) {
          d.mat.emissiveIntensity = d.baseEmissive * pulse;
        }

        // Лёгкое покачивание вдоль луча от центра
        const r = d.baseRadius + Math.sin(time * 1.2 + d.phase) * 0.06;
        c.position.x = Math.cos(d.angle) * r;
        c.position.y = Math.sin(d.angle) * r;

        // Медленное покачивание лезвия
        c.rotation.z = d.angle + Math.PI / 2 + Math.sin(time * 0.8 + d.phase) * 0.15;
      });

      // Осколки внешнего кольца вращаются сами
      outerShards.forEach((s) => {
        const d = s.userData;

        s.rotation.x += d.rotSpeed.x * dt;
        s.rotation.y += d.rotSpeed.y * dt;
        s.rotation.z += d.rotSpeed.z * dt;

        // Колебание радиуса — они «дышат» наружу-внутрь
        const r = d.baseRadius + Math.sin(time * 0.9 + d.phase) * 0.12;
        s.position.x = Math.cos(d.angle) * r;
        s.position.y = Math.sin(d.angle) * r;
      });

      // Искры вращаются вокруг портала
      const pos = sparkGeo.attributes.position.array;
      for (let i = 0; i < sparkCount; i++) {
        const angle = Math.atan2(pos[i * 3 + 1], pos[i * 3]);
        const radius = Math.hypot(pos[i * 3], pos[i * 3 + 1]);
        const newAngle = angle + sparkSpeeds[i] * dt * 0.4;
        pos[i * 3]     = Math.cos(newAngle) * radius;
        pos[i * 3 + 1] = Math.sin(newAngle) * radius;
        // Лёгкое покачивание по Z
        pos[i * 3 + 2] += Math.sin(time * 0.5 + sparkPhases[i]) * 0.003;
      }
      sparkGeo.attributes.position.needsUpdate = true;

      // Масштаб группы — из состояния
      group.scale.setScalar(scale);

      // Свет пульсирует
      const basePulse = 2 + Math.sin(time * 1.2) * 0.5;
      coreLight.intensity = basePulse * coreIntensity;
      secondaryLight.intensity = (2.5 + Math.sin(time * 2.4) * 0.8) * coreIntensity;
    },

    /* Очистка при смене сцены */
    dispose() {
      if (group.parent) group.parent.remove(group);

      group.traverse((obj) => {
        if (obj.geometry) obj.geometry.dispose();
        if (obj.material) {
          if (Array.isArray(obj.material)) {
            obj.material.forEach((m) => m.dispose());
          } else {
            obj.material.dispose();
          }
        }
      });

      // Отдельно чистим текстуру искр
      if (sparkTex && sparkTex.dispose) sparkTex.dispose();
    },
  };
}