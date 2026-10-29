import * as THREE from 'three';

/* =========================================================
   SCENE TRANSITION v3 — управление извне
   =========================================================
   Больше нет собственных таймлайнов — прогресс шторки
   приходит снаружи (от scrollScenes), привязан к скроллу.
   ========================================================= */

export function createSceneTransition(renderer) {
  const overlayScene  = new THREE.Scene();
  const overlayCamera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);

  const geometry = new THREE.PlaneGeometry(2, 2);

  const material = new THREE.ShaderMaterial({
    uniforms: {
      uProgress:   { value: 0 },
      uTime:       { value: 0 },
      uColorDark:  { value: new THREE.Color(0x0a0320) },
      uColorMid:   { value: new THREE.Color(0x3a1568) },
      uColorLight: { value: new THREE.Color(0xc99aff) },
    },
    vertexShader: /* glsl */`
      varying vec2 vUv;
      void main() {
        vUv = uv;
        gl_Position = vec4(position, 1.0);
      }
    `,
    fragmentShader: /* glsl */`
      uniform float uProgress;
      uniform float uTime;
      uniform vec3 uColorDark;
      uniform vec3 uColorMid;
      uniform vec3 uColorLight;

      varying vec2 vUv;

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
      float fbm(vec2 p) {
        float v = 0.0;
        float a = 0.5;
        for (int i = 0; i < 3; i++) {
          v += a * noise(p);
          p *= 2.03;
          a *= 0.5;
        }
        return v;
      }

      void main() {
        vec2 uv = vUv;
        vec2 p = uv - 0.5;

        // Domain warping — «чернила»
        vec2 q = vec2(
          fbm(uv * 3.0 + vec2(uTime * 0.12, 0.0)),
          fbm(uv * 3.0 + vec2(5.2, 1.3) + uTime * 0.08)
        );
        vec2 r = vec2(
          fbm(uv * 3.0 + q * 2.0 + vec2(uTime * 0.1, 0.0)),
          fbm(uv * 3.0 + q * 2.0 + vec2(9.7, 4.3) - uTime * 0.1)
        );
        float inkNoise = fbm(uv * 3.0 + r * 2.5);

        float d = length(p) * 1.5;
        float spread = uProgress * 1.6;
        float inkValue = spread - d + inkNoise * 0.45;

        float mask = smoothstep(-0.03, 0.06, inkValue);

        float crackNoise = fbm(uv * 8.0 + r * 1.5);
        float cracks = smoothstep(0.48, 0.5, crackNoise)
                     * smoothstep(0.52, 0.5, crackNoise);
        cracks *= mask * 0.35;

        float rim = smoothstep(0.06, 0.0, abs(inkValue));
        float rimActivity = smoothstep(0.0, 0.15, uProgress)
                          * smoothstep(1.0, 0.85, uProgress);
        rim *= rimActivity * 0.9;

        float rimWide = smoothstep(0.18, 0.0, abs(inkValue)) * rimActivity * 0.25;

        vec3 color = mix(uColorDark, uColorMid, inkNoise * 1.2);
        color += uColorLight * cracks * 0.6;
        color += uColorLight * rim * 1.2;
        color += uColorLight * rimWide * 0.4;

        float alpha = mask * 0.98 + rim * 0.9;
        alpha *= smoothstep(0.0, 0.02, uProgress);

        if (alpha < 0.01) discard;

        gl_FragColor = vec4(color, alpha);
      }
    `,
    transparent: true,
    depthTest: false,
    depthWrite: false,
  });

  const overlayMesh = new THREE.Mesh(geometry, material);
  overlayScene.add(overlayMesh);

  /* ---------------------------------------------------------
     API
     --------------------------------------------------------- */
  return {
    /* Прямое управление прогрессом: 0 = открыто, 1 = закрыто */
  setProgress(p) {
    const clamped = Math.max(0, Math.min(1, p));
    this._progress = clamped;
    material.uniforms.uProgress.value = clamped;

  // Вспышка при приближении к пику перехода
  // Чем ближе к 0.5 — тем сильнее
    const distFromPeak = Math.abs(clamped - 0.5) * 2;
    const intensity = Math.max(0, 1 - distFromPeak);
    if (this._onPulse) {
      this._onPulse(intensity);
    }
  },

/* Установить колбэк для пульса */
onPulse(cb) {
  this._onPulse = cb;
},

    getProgress() {
      return material.uniforms.uProgress.value;
    },

    /* Переход активен, если прогресс > 0 */
    isActive() {
      return material.uniforms.uProgress.value > 0.005;
    },

    update(time) {
      material.uniforms.uTime.value = time;
    },

    render() {
      if (!this.isActive()) return;

      const prevAutoClear = renderer.autoClear;
      renderer.autoClear = false;
      renderer.render(overlayScene, overlayCamera);
      renderer.autoClear = prevAutoClear;
    },
  };
}