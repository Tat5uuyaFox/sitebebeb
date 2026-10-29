import Lenis from 'lenis';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

/* =========================================================
   SCROLL — плавный скролл через Lenis + GSAP ScrollTrigger
   ========================================================= */

export function createScroll() {
  const lenis = new Lenis({
    duration: 1.4,
    easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
    smoothWheel: true,
    syncTouch: false,
    wheelMultiplier: 1.0,
    touchMultiplier: 2.0,
    anchors: true,
  });

  lenis.on('scroll', ScrollTrigger.update);

  function update(time) {
    lenis.raf(time * 1000);
  }

  gsap.ticker.add(update);
  gsap.ticker.lagSmoothing(0);

  /* ---------------------------------------------------------
     ДИНАМИЧЕСКИЙ МНОЖИТЕЛЬ СКОРОСТИ
     ---------------------------------------------------------
     Меняем чувствительность скролла в зависимости от позиции.
     --------------------------------------------------------- */
  let currentMultiplier = 1.0;

  function setWheelMultiplier(m) {
    // Не дёргаем, если разница мала
    if (Math.abs(m - currentMultiplier) < 0.01) return;
    currentMultiplier = m;
    lenis.options.wheelMultiplier = m;
    lenis.options.touchMultiplier = m * 2;
  }

  return {
    lenis,

    setWheelMultiplier,

    scrollTo(target, options = {}) {
      lenis.scrollTo(target, {
        duration: 1.8,
        easing: (t) => 1 - Math.pow(1 - t, 4),
        ...options,
      });
    },

    stop() { lenis.stop(); },
    start() { lenis.start(); },

    destroy() {
      gsap.ticker.remove(update);
      lenis.destroy();
    },
  };
}