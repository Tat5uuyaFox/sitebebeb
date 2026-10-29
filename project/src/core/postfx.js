import * as THREE from 'three';

/* =========================================================
   POST-FX — SOP Color Grading (Slope/Offset/Power)
   =========================================================
   Профессиональный подход:
   - Slope → света
   - Offset → тени
   - Power → средние тона
   - Saturation
   - Exposure
   + Reinhard tone mapping

   Порядок:
   1. Linear (HDR)
   2. Exposure
   3. SOP
   4. Saturation
   5. Reinhard
   6. Vignette
   7. Grain
   8. sRGB
   ========================================================= */

const CaveShader = {
  uniforms: {
    tDiffuse:        { value: null },
    uTime:           { value: 0 },
    uResolution:     { value: new THREE.Vector2(1, 1) },

    // === SOP ===
    // Slope — управляет СВЕТАМИ
    // 1.0 — нейтрально. Меньше 1 → темнее света. Больше 1 → светлее.
    uSlope:          { value: new THREE.Vector3(1.0, 1.0, 1.0) },

    // Offset — управляет ТЕНЯМИ (сдвиг)
    // 0.0 — нейтрально. Больше 0 → светлее тени. Меньше 0 → чернее.
    uOffset:         { value: new THREE.Vector3(0.0, 0.0, 0.0) },

    // Power — управляет СРЕДНИМИ ТОНАМИ (гамма)
    // 1.0 — нейтрально. Меньше 1 → светлее средние. Больше 1 → темнее.
    uPower:          { value: new THREE.Vector3(1.0, 1.0, 1.0) },

    // === Грейдинг ===
    uExposure:       { value: 3.5 },   // HDR-exposure
    uSaturation:     { value: 1.15 },

    // === Reinhard ===
    uReinhard:       { value: 1.0 },

    // === Виньетка ===
    uVignette:       { value: 0.45 },
    uVignetteRadius: { value: 0.95 },

    // === Зерно ===
    uGrain:          { value: 0.008 },

    // === Пульс ===
    uPulse:          { value: 0.0 },
  },

  vertexShader: `
    varying vec2 vUv;
    void main() {
      vUv = uv;
      gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    }
  `,

  fragmentShader: `
    uniform sampler2D tDiffuse;
    uniform float uTime;
    uniform vec2  uResolution;

    uniform vec3  uSlope;
    uniform vec3  uOffset;
    uniform vec3  uPower;

    uniform float uExposure;
    uniform float uSaturation;
    uniform float uReinhard;

    uniform float uVignette;
    uniform float uVignetteRadius;

    uniform float uGrain;
    uniform float uPulse;

    varying vec2 vUv;

    // --- Утилиты ---
    float hash(vec2 p) {
      return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453);
    }
    float noise(vec2 p) {
      vec2 i = floor(p);
      vec2 f = fract(p);
      vec2 u = f * f * (3.0 - 2.0 * f);
      return mix(mix(hash(i), hash(i + vec2(1.0, 0.0)), u.x),
                 mix(hash(i + vec2(0.0, 1.0)), hash(i + vec2(1.0, 1.0)), u.x), u.y);
    }

    // --- SOP: slope, offset, power ---
    vec3 applySOP(vec3 color) {
      vec3 c = color * uSlope + uOffset;
      c = max(c, vec3(0.0));
      c = pow(c, uPower);
      return c;
    }

    // --- Reinhard tone mapping ---
    vec3 reinhard(vec3 x) {
      return x / (x + uReinhard);
    }

    // --- Linear → sRGB ---
    vec3 linearToSRGB(vec3 c) {
      return mix(
        1.055 * pow(c, vec3(1.0 / 2.4)) - 0.055,
        c * 12.92,
        step(c, vec3(0.0031308))
      );
    }

    void main() {
      vec2 uv = vUv;
      vec2 aspect = vec2(uResolution.x / uResolution.y, 1.0);

      // 1. LINEAR — читаем
      vec3 color = texture2D(tDiffuse, uv).rgb;

      // 2. ЭКСПОЗИЦИЯ (HDR)
      color *= uExposure;

      // 3. SOP ГРЕЙДИНГ
      color = applySOP(color);

      // 4. НАСЫЩЕННОСТЬ
      float lum = dot(color, vec3(0.2126, 0.7152, 0.0722));
      color = mix(vec3(lum), color, uSaturation);

      // 5. REINHARD
      color = reinhard(color);

      // 6. ВИНЬЕТКА
      vec2 vigUv = (uv - 0.5) * aspect;
      float vig = smoothstep(uVignetteRadius, uVignetteRadius * 0.35, length(vigUv));
      vig = pow(vig, uVignette);
      color *= mix(0.55, 1.0, vig);

      // 7. ЗЕРНО — мягкое, только в тенях
      vec2 grainUv = uv * uResolution / 2.0 + vec2(uTime * 40.0, uTime * 30.0);
      float grain = noise(grainUv) - 0.5;
      float shadowMask = 1.0 - smoothstep(0.0, 0.5, lum);
      color += grain * uGrain * (0.2 + shadowMask * 0.3);

      // 8. ПУЛЬС
      if (uPulse > 0.01) {
        vec3 warmGlow = vec3(1.0, 0.8, 0.5);
        color += warmGlow * uPulse * 0.08 * (1.0 - length(uv - 0.5));
      }

      // 9. sRGB
      color = linearToSRGB(color);
      color = max(color, 0.0);

      gl_FragColor = vec4(color, 1.0);
    }
  `,
};

export function createPostFX(renderer, scene, camera, qualityLevel = 'high') {
  const size = new THREE.Vector2(window.innerWidth, window.innerHeight);
  const pixelRatio = Math.min(window.devicePixelRatio, 1.25);

  const rtA = new THREE.WebGLRenderTarget(
    Math.floor(size.x * pixelRatio),
    Math.floor(size.y * pixelRatio),
    {
      minFilter: THREE.LinearFilter,
      magFilter: THREE.LinearFilter,
      format: THREE.RGBAFormat,
      type: THREE.UnsignedByteType,
      depthBuffer: true,
      stencilBuffer: false,
    }
  );

  const quadScene = new THREE.Scene();
  const quadCamera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);
  const quadGeometry = new THREE.PlaneGeometry(2, 2);

  const shaderMaterial = new THREE.ShaderMaterial({
    uniforms: CaveShader.uniforms,
    vertexShader: CaveShader.vertexShader,
    fragmentShader: CaveShader.fragmentShader,
    depthTest: false,
    depthWrite: false,
  });

  const quad = new THREE.Mesh(quadGeometry, shaderMaterial);
  quadScene.add(quad);

  shaderMaterial.uniforms.tDiffuse.value = rtA.texture;
  shaderMaterial.uniforms.uResolution.value.set(size.x, size.y);

  return {
    composer: {
      render() {
        const prevAutoClear = renderer.autoClear;
        const prevToneMapping = renderer.toneMapping;
        const prevOutputColorSpace = renderer.outputColorSpace;

        renderer.toneMapping = THREE.NoToneMapping;
        renderer.outputColorSpace = THREE.LinearSRGBColorSpace;

        renderer.autoClear = true;
        renderer.setRenderTarget(rtA);
        renderer.render(scene, camera);

        renderer.toneMapping = prevToneMapping;
        renderer.outputColorSpace = prevOutputColorSpace;

        renderer.autoClear = false;
        renderer.setRenderTarget(null);
        renderer.render(quadScene, quadCamera);

        renderer.autoClear = prevAutoClear;
      },
    },

    bloom: { strength: 0, radius: 0, threshold: 0 },
    cave: { uniforms: shaderMaterial.uniforms },

    update(time, dt) {
      shaderMaterial.uniforms.uTime.value = time;
      if (shaderMaterial.uniforms.uPulse.value > 0) {
        shaderMaterial.uniforms.uPulse.value = Math.max(
          0, shaderMaterial.uniforms.uPulse.value - dt * 2.0
        );
      }
    },

    resize() {
      const w = window.innerWidth;
      const h = window.innerHeight;
      rtA.setSize(Math.floor(w * pixelRatio), Math.floor(h * pixelRatio));
      shaderMaterial.uniforms.uResolution.value.set(w, h);
    },

    /* =========================================================
       ПУБЛИЧНЫЕ РУЧКИ — для тюнинга
       ========================================================= */

    setExposure(v)   { shaderMaterial.uniforms.uExposure.value = v; },
    setSaturation(v) { shaderMaterial.uniforms.uSaturation.value = v; },
    setReinhard(v)   { shaderMaterial.uniforms.uReinhard.value = v; },
    setVignette(v)   { shaderMaterial.uniforms.uVignette.value = v; },
    setGrain(v)      { shaderMaterial.uniforms.uGrain.value = v; },

    // SOP — три вектора
    setSlope(x, y, z)  { shaderMaterial.uniforms.uSlope.value.set(x, y, z); },
    setOffset(x, y, z) { shaderMaterial.uniforms.uOffset.value.set(x, y, z); },
    setPower(x, y, z)  { shaderMaterial.uniforms.uPower.value.set(x, y, z); },

    setBloom() {},
    pulse(a = 1.0) { shaderMaterial.uniforms.uPulse.value = Math.min(1.0, a); },
    setLanternScreenPos() {},
    setDepthScreenPos() {},
    setProgress() {},
    setQuality() {},

    destroy() {
      rtA.dispose();
      quadGeometry.dispose();
      shaderMaterial.dispose();
    },
  };
}