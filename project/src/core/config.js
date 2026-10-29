/* =========================================================
   CONFIG — общие настройки проекта
   ========================================================= */

export const CONFIG = {
  /* ---- Книга (старая архитектура, может использоваться) ---- */
  BOOK: {
    width: 1.4,
    height: 2.0,
    coverThickness: 0.07,
    pagesHeight: 0.22,
  },

  /* ---- Пыль / частицы ---- */
  DUST: {
    count: 900,
    area: 14,
    top: 5.5,
    bottom: -0.3,
  },

  /* ---- Туман пещеры ---- */
  FOG: {
    color: 0x050810,
    initialDensity: 0.06,
    openDensity: 0.03,
  },

  /* ---- Камера ---- */
  CAMERA: {
    initial:  { x: 0, y: 0, z: 6 },
    opened:   { x: 0, y: 0, z: 4 },
    target:   { x: 0, y: 0, z: 0 },
    parallax: { x: 0.65, y: 0.35, lerp: 0.04 },
  },

  /* ---- Свеча (старая архитектура) ---- */
  CANDLE: {
    position: { x: 2, y: -0.3, z: -0.6 },
    baseIntensity: 2.2,
    openIntensity: 4,
    flickerInterval: 0.045,
  },

  /* ---- Рендер ---- */
  RENDERER: {
    exposure: 1.0,
    openExposure: 1.0,
  },
};