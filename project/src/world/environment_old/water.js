import * as THREE from 'three';
import { PALETTE } from './shared.js';

/* =========================================================
   WATER — водоём, ручейки, капли
   =========================================================
   Светящаяся вода из шейдера. И капли сверху вниз.
   Как в референсе с ручьём, только без звука.
   ========================================================= */
export function createWater(parent, materials) {
  const group = new THREE.Group();
  parent.add(group);

  /* ==========================================================
     ОСНОВНОЙ ВОДОЁМ — шейдер
     ========================================================== */
  const poolGeo = new THREE.CircleGeometry(4.5, 64);
  const poolMat = new THREE.ShaderMaterial({
    uniforms: {
      uTime: { value: 0 },
      uColorDeep:    { value: new THREE.Color(0x051218) },
      uColorShallow: { value: new THREE.Color(0x2a8a9a) },
      uColorGlow:    { value: new THREE.Color(0x6ad8f0) },
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
      uniform vec3 uColorDeep;
      uniform vec3 uColorShallow;
      uniform vec3 uColorGlow;
      varying vec2 vUv;

      // Простой шум — нам не нужен Perlin, хватит и этого
      float hash(vec2 p){ return fract(sin(dot(p,vec2(12.9898,78.233)))*43758.5453); }
      float noise(vec2 p){
        vec2 i = floor(p); vec2 f = fract(p); vec2 u = f*f*(3.0-2.0*f);
        return mix(mix(hash(i), hash(i+vec2(1.0,0.0)), u.x),
                   mix(hash(i+vec2(0.0,1.0)), hash(i+vec2(1.0,1.0)), u.x), u.y);
      }

      void main(){
        vec2 uv = vUv;
        vec2 c = uv - 0.5;
        float d = length(c) * 2.0;

        // Две волны от центра — как от брошенного камня
        float w1 = sin(d * 10.0 - uTime * 1.2) * 0.5 + 0.5;
        float w2 = sin(d * 18.0 + uTime * 1.8 + 1.7) * 0.5 + 0.5;

        // Рябь — два слоя шума
        float n1 = noise(uv * 8.0 + vec2(uTime * 0.2, uTime * 0.1));
        float n2 = noise(uv * 16.0 + vec2(-uTime * 0.15, uTime * 0.2));

        // Градиент глубины
        float depthMix = smoothstep(0.0, 1.0, d);
        vec3 col = mix(uColorShallow, uColorDeep, depthMix);

        // Волновая подсветка
        col += uColorGlow * w1 * 0.18 * (1.0 - d);
        col += uColorGlow * w2 * 0.08;
        col += uColorGlow * n1 * 0.12;
        col += uColorShallow * n2 * 0.08;

        // Яркий центр — там типа сердце озера
        col += uColorGlow * pow(1.0 - d, 3.5) * 0.9;

        gl_FragColor = vec4(col, smoothstep(1.0, 0.75, d) * 0.9);
      }
    `,
    transparent: true,
    depthWrite: false,
  });

  const pool = new THREE.Mesh(poolGeo, poolMat);
  pool.rotation.x = -Math.PI / 2;
  pool.position.set(0, -5.44, -2);
  group.add(pool);

  /* Свет от воды — пещера подсвечивается снизу */
  const poolLight = new THREE.PointLight(PALETTE.cyan, 1.5, 7, 2);
  poolLight.position.set(0, -5, -2);
  group.add(poolLight);

  /* ==========================================================
     РУЧЕЙКИ — 3 маленьких струйки, уходят от водоёма
     ========================================================== */
  const streams = [];
  for (let i = 0; i < 3; i++) {
    const angle = (i / 3) * Math.PI * 2 + 0.5;
    const streamGroup = new THREE.Group();
    streamGroup.position.set(
      Math.cos(angle) * 4,
      -5.42,
      Math.sin(angle) * 4 - 2
    );
    streamGroup.rotation.y = angle;
    group.add(streamGroup);

    // Основа — плоский прямоугольник
    const streamGeo = new THREE.PlaneGeometry(0.4, 5, 8, 16);
    const streamMat = new THREE.ShaderMaterial({
      uniforms: {
        uTime: { value: 0 },
        uColor: { value: new THREE.Color(PALETTE.cyan) },
      },
      vertexShader: /* glsl */`
        uniform float uTime;
        varying vec2 vUv;
        void main(){
          vUv = uv;
          vec3 p = position;
          // Лёгкая волна вдоль ручья
          p.z += sin(uv.y * 10.0 + uTime * 3.0) * 0.03;
          gl_Position = projectionMatrix * modelViewMatrix * vec4(p, 1.0);
        }
      `,
      fragmentShader: /* glsl */`
        uniform float uTime;
        uniform vec3 uColor;
        varying vec2 vUv;
        void main(){
          // Струйки вдоль ручья
          float flow = sin(vUv.y * 40.0 - uTime * 6.0) * 0.5 + 0.5;
          float edge = smoothstep(0.5, 0.0, abs(vUv.x - 0.5) * 2.0);
          float alpha = edge * (0.3 + flow * 0.4);
          vec3 col = uColor * (0.6 + flow * 0.6);
          gl_FragColor = vec4(col, alpha);
        }
      `,
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
    });

    const stream = new THREE.Mesh(streamGeo, streamMat);
    stream.rotation.x = -Math.PI / 2;
    stream.position.z = 2.5;
    streamGroup.add(stream);
    streams.push(streamMat);
  }

  /* ==========================================================
     КАПЛИ С ПОТОЛКА — 50 штук
     ==========================================================
     Падают вниз. Анимированы в update — простой параллакс.
     ========================================================== */
  const dropCount = 50;
  const dropGeo = new THREE.BufferGeometry();
  const dropPos = new Float32Array(dropCount * 3);
  const dropData = [];

  for (let i = 0; i < dropCount; i++) {
    const a = Math.random() * Math.PI * 2;
    const r = 2 + Math.random() * 10;
    const x = Math.cos(a) * r;
    const z = Math.sin(a) * r;
    const startY = 5 + Math.random() * 4;

    dropPos[i * 3]     = x;
    dropPos[i * 3 + 1] = startY;
    dropPos[i * 3 + 2] = z;

    dropData.push({
      x, z,
      startY,
      speed: 3 + Math.random() * 4,
      offset: Math.random() * 10,
    });
  }
  dropGeo.setAttribute('position', new THREE.BufferAttribute(dropPos, 3));

  const dropMat = new THREE.PointsMaterial({
    size: 0.08,
    color: PALETTE.cyan,
    transparent: true,
    opacity: 0.8,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
    sizeAttenuation: true,
  });

  const drops = new THREE.Points(dropGeo, dropMat);
  group.add(drops);

  return {
    group,
    update(time) {
      poolMat.uniforms.uTime.value = time;
      poolLight.intensity = 1.5 + Math.sin(time * 0.7) * 0.4;

      streams.forEach((m) => { m.uniforms.uTime.value = time; });

      // Капли падают
      const pos = dropGeo.attributes.position.array;
      for (let i = 0; i < dropCount; i++) {
        const d = dropData[i];
        // Формула полёта — линейная, но с циклическим сбросом
        const cycle = (time * d.speed + d.offset) % 12;
        pos[i * 3 + 1] = d.startY - cycle;
      }
      dropGeo.attributes.position.needsUpdate = true;
    },
    dispose() {
      if (group.parent) group.parent.remove(group);
      poolGeo.dispose();
      poolMat.dispose();
      dropGeo.dispose();
      dropMat.dispose();
      streams.forEach((m) => m.dispose());
    },
  };
}