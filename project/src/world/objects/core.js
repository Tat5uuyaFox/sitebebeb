import * as THREE from 'three';

/* =========================================================
   CORE — центральное ядро сцены
   =========================================================
   - Многогранник с рваной поверхностью (искажение вершин)
   - Внутреннее свечение через шейдер
   - Лучи энергии из ядра
   - Пульсирует и вращается
   ========================================================= */

export function createCore(parent, options = {}) {
  const {
    position = { x: 0, y: 0, z: 0 },
    radius = 2.2,
    color = 0xa866ee,
    accentColor = 0xff9ad4,
  } = options;

  const group = new THREE.Group();
  group.position.set(position.x, position.y, position.z);
  parent.add(group);

  /* ==========================================================
     1. ЯДРО — рваный многогранник
     ========================================================== */
  const coreGeo = new THREE.IcosahedronGeometry(radius, 1);

  // Искажаем вершины — «рваная» поверхность
  const positions = coreGeo.attributes.position.array;
  for (let i = 0; i < positions.length; i += 3) {
    const x = positions[i];
    const y = positions[i + 1];
    const z = positions[i + 2];

    // Псевдослучайное искажение по каждой вершине
    const noise = Math.sin(x * 3.7 + y * 2.3 + z * 5.1) * 0.5 + 0.5;
    const scale = 1.0 + noise * 0.35;

    positions[i]     *= scale;
    positions[i + 1] *= scale;
    positions[i + 2] *= scale;
  }
  coreGeo.computeVertexNormals();

  const coreMat = new THREE.MeshStandardMaterial({
    color: 0x1a0838,
    emissive: color,
    emissiveIntensity: 0.5,
    roughness: 0.15,
    metalness: 0.85,
    flatShading: true,
    transparent: true,
    opacity: 0.95,
  });

  const coreMesh = new THREE.Mesh(coreGeo, coreMat);
  group.add(coreMesh);

  /* ==========================================================
     2. ВНУТРЕННЕЕ СВЕЧЕНИЕ — сфера внутри
     ========================================================== */
  const innerGeo = new THREE.SphereGeometry(radius * 0.7, 24, 24);

  // Шейдер: пылающее ядро
  const innerMat = new THREE.ShaderMaterial({
    uniforms: {
      uTime: { value: 0 },
      uColor: { value: new THREE.Color(color) },
      uAccent: { value: new THREE.Color(accentColor) },
    },
    vertexShader: /* glsl */`
      varying vec3 vPos;
      varying vec3 vNormal;
      void main() {
        vPos = position;
        vNormal = normal;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
      }
    `,
    fragmentShader: /* glsl */`
      uniform float uTime;
      uniform vec3 uColor;
      uniform vec3 uAccent;
      varying vec3 vPos;
      varying vec3 vNormal;

      float hash(vec3 p) {
        return fract(sin(dot(p, vec3(12.9898, 78.233, 45.164))) * 43758.5453);
      }

      void main() {
        float n = hash(floor(vPos * 8.0 + uTime * 2.0)) * 0.5 + 0.5;
        vec3 color = mix(uColor, uAccent, n);

        // Пульсация
        float pulse = 0.7 + sin(uTime * 2.5) * 0.3;
        color *= pulse;

        // Фейковый fresnel — ярче у краёв
        float fresnel = pow(1.0 - abs(dot(vNormal, vec3(0.0, 0.0, 1.0))), 2.0);
        color += uAccent * fresnel * 0.6;

        gl_FragColor = vec4(color, 0.8);
      }
    `,
    transparent: true,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
    side: THREE.BackSide,
  });

  const innerMesh = new THREE.Mesh(innerGeo, innerMat);
  group.add(innerMesh);

  /* ==========================================================
     3. ЛУЧИ — из ядра во все стороны
     ========================================================== */
  const raysGroup = new THREE.Group();
  group.add(raysGroup);

  const rayMat = new THREE.MeshBasicMaterial({
    color: accentColor,
    transparent: true,
    opacity: 0.4,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
    side: THREE.DoubleSide,
  });

  const rays = [];
  const rayCount = 16;
  for (let i = 0; i < rayCount; i++) {
    const angle = (i / rayCount) * Math.PI * 2;
    const rayLength = radius * (1.6 + Math.random() * 0.8);
    const rayWidth = 0.03 + Math.random() * 0.05;

    // Плоский треугольник — луч
    const rayGeo = new THREE.PlaneGeometry(rayWidth, rayLength);
    rayGeo.translate(0, rayLength * 0.5, 0);   // пивот у основания

    const ray = new THREE.Mesh(rayGeo, rayMat.clone());

    // Позиционируем: в плоскости XY, поворот по Z
    ray.position.set(0, 0, 0);
    ray.rotation.z = angle;
    // Наклоняем немного в Z, чтобы лучи шли в 3D-пространстве
    ray.rotation.x = (Math.random() - 0.5) * 0.6;

    ray.userData = {
      angle,
      baseLength: rayLength,
      phase: Math.random() * Math.PI * 2,
      pulseSpeed: 0.5 + Math.random() * 1.0,
    };

    raysGroup.add(ray);
    rays.push(ray);
  }

  /* ==========================================================
     4. СВЕТ ИЗ ЯДРА
     ========================================================== */
  const light = new THREE.PointLight(color, 2, 15, 2);
  group.add(light);

  const accentLight = new THREE.PointLight(accentColor, 1, 8, 2);
  accentLight.position.set(0, 0, 0.5);
  group.add(accentLight);

  /* ==========================================================
     API
     ========================================================== */
  return {
    group,
    coreMesh,
    rays,

    update(time, dt) {
      // Вращение ядра
      coreMesh.rotation.x = time * 0.15;
      coreMesh.rotation.y = time * 0.2;

      // Внутреннее свечение — время
      innerMat.uniforms.uTime.value = time;

      // Лучи вращаются и пульсируют
      raysGroup.rotation.z = time * 0.1;
      raysGroup.rotation.y = Math.sin(time * 0.2) * 0.3;

      rays.forEach((ray, i) => {
        const d = ray.userData;
        const pulse = 0.5 + Math.sin(time * d.pulseSpeed + d.phase) * 0.5;
        ray.material.opacity = 0.15 + pulse * 0.5;

        // Длина луча меняется
        const len = d.baseLength * (0.9 + pulse * 0.3);
        ray.scale.y = len / d.baseLength;
      });

      // Пульсация света
      light.intensity = 1.5 + Math.sin(time * 1.8) * 0.7;
      accentLight.intensity = 0.8 + Math.sin(time * 2.5) * 0.4;

      // Пульсация эмиссии ядра
      coreMat.emissiveIntensity = 0.4 + Math.sin(time * 1.2) * 0.25;
    },

    dispose() {
      if (group.parent) group.parent.remove(group);
      coreGeo.dispose();
      coreMat.dispose();
      innerGeo.dispose();
      innerMat.dispose();
      rayMat.dispose();
      rays.forEach((r) => {
        r.geometry.dispose();
        r.material.dispose();
      });
    },
  };
}