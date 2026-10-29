/* =========================================================
   QUALITY — определяем возможности железа
   =========================================================
   Три уровня: low / medium / high.
   Определяем по:
   - User Agent (мобилка)
   - WebGL renderer string (какая GPU)
   - hardwareConcurrency (ядер CPU)
   - devicePixelRatio (Retina)
   ========================================================= */

export function detectQuality() {
  /* ==========================================================
     БАЗОВЫЕ МЕТРИКИ
     ========================================================== */
  const isMobile = /iPhone|iPad|Android|Mobile|Tablet/i.test(navigator.userAgent);
  const cores = navigator.hardwareConcurrency || 4;
  const memory = navigator.deviceMemory || 4;    // GB, только Chrome
  const dpr = window.devicePixelRatio || 1;

  /* ==========================================================
     ОПРЕДЕЛЯЕМ GPU
     ==========================================================
     Трюк: создаём временный canvas, спрашиваем драйвер.
     ========================================================== */
  let gpuTier = 'unknown';
  try {
    const canvas = document.createElement('canvas');
    const gl = canvas.getContext('webgl2') || canvas.getContext('webgl');
    if (gl) {
      const debugInfo = gl.getExtension('WEBGL_debug_renderer_info');
      if (debugInfo) {
        const renderer = gl.getParameter(debugInfo.UNMASKED_RENDERER_WEBGL) || '';
        const r = renderer.toLowerCase();

        if (r.includes('intel') && (r.includes('hd') || r.includes('uhd') || r.includes('iris'))) {
          gpuTier = 'integrated';
        } else if (r.includes('apple m')) {
          gpuTier = 'apple';
        } else if (r.includes('nvidia') || r.includes('geforce') || r.includes('radeon')) {
          gpuTier = 'discrete';
        } else if (r.includes('mali') || r.includes('adreno') || r.includes('powervr')) {
          gpuTier = 'mobile';
        } else if (r.includes('swiftshader') || r.includes('llvmpipe')) {
          gpuTier = 'software';   // ← совсем плохо
        }
      }
    }
  } catch (e) {
    // Игнорируем — будет по общим метрикам
  }

  /* ==========================================================
     РЕШАЕМ УРОВЕНЬ
     ========================================================== */
  let level = 'high';

  if (isMobile || gpuTier === 'mobile' || gpuTier === 'software') {
    level = 'low';
  } else if (
    gpuTier === 'integrated' ||
    cores <= 4 ||
    memory <= 4 ||
    dpr > 2.5
  ) {
    level = 'medium';
  }

  console.log(`[Quality] Определено: ${level} (GPU: ${gpuTier}, cores: ${cores}, RAM: ${memory}GB, mobile: ${isMobile})`);

  return {
    level,
    isMobile,
    dpr,
    cores,
    memory,
    gpuTier,
  };
}

/* =========================================================
   КОНФИГИ ПО УРОВНЯМ
   ========================================================= */
export const QUALITY_CONFIG = {
  high: {
    pixelRatio: 2,
    shadows: true,
    shadowMapSize: 1024,

    bloomEnabled: true,
    bloomStrength: 0.5,

    // Environment
    pebbleCount: 400,
    slabCount: 60,
    mossPads: 200,
    fungiSpotsMultiplier: 1.0,
    fernClustersMultiplier: 1.0,
    runnerCount: 200,
    grassCount: 150,
    crystalSmall: 50,
    vinesSpotsMultiplier: 1.0,
    stalactiteCount: 60,
    stalagmiteCount: 40,
    spikeCount: 100,
    dropCount: 50,
    fireflyCount: 80,
    dustCount: 500,
    glowwormCount: 120,
    lichenCount: 800,
    threadCount: 30,
    spiderWebCount: 15,
    foregroundCount: 10,
  },

  medium: {
    pixelRatio: 1.5,
    shadows: true,
    shadowMapSize: 512,

    bloomEnabled: true,
    bloomStrength: 0.4,

    pebbleCount: 200,
    slabCount: 30,
    mossPads: 100,
    fungiSpotsMultiplier: 0.7,
    fernClustersMultiplier: 0.6,
    runnerCount: 100,
    grassCount: 70,
    crystalSmall: 25,
    vinesSpotsMultiplier: 0.6,
    stalactiteCount: 30,
    stalagmiteCount: 20,
    spikeCount: 50,
    dropCount: 25,
    fireflyCount: 40,
    dustCount: 250,
    glowwormCount: 60,
    lichenCount: 400,
    threadCount: 15,
    spiderWebCount: 7,
    foregroundCount: 6,
  },

  low: {
    pixelRatio: 1,
    shadows: false,
    shadowMapSize: 512,

    bloomEnabled: true,
    bloomStrength: 0.3,

    pebbleCount: 80,
    slabCount: 10,
    mossPads: 40,
    fungiSpotsMultiplier: 0.4,
    fernClustersMultiplier: 0.3,
    runnerCount: 40,
    grassCount: 30,
    crystalSmall: 10,
    vinesSpotsMultiplier: 0.3,
    stalactiteCount: 15,
    stalagmiteCount: 10,
    spikeCount: 20,
    dropCount: 10,
    fireflyCount: 20,
    dustCount: 100,
    glowwormCount: 30,
    lichenCount: 150,
    threadCount: 8,
    spiderWebCount: 3,
    foregroundCount: 4,
  },
};

export function getQualityConfig(level) {
  return QUALITY_CONFIG[level] || QUALITY_CONFIG.high;
}