import * as THREE from 'three';
import gsap from 'gsap';

/* =========================================================
   INTRO — полёт камеры при загрузке
   =========================================================
   Что делает:
   1. Заполняет лоадер реальным прогрессом загрузки
   2. Растворяет шторку (transition 1 → 0)
   3. Запускает полёт камеры из глубины к первой сцене
   4. Разжигает портал и окружение
   5. Разблокирует скролл
   6. Играет вступительный звук
   ========================================================= */

export function createIntro({ camera, sceneManager, scroll, transition, postfx, portal, environment, sound }) {
  const loader       = document.getElementById('loader');
  const loaderBar    = document.getElementById('loaderBar');
  const loaderStatus = document.getElementById('loaderStatus');

  const STATUSES = [
    'ИНИЦИАЛИЗАЦИЯ⋯',
    'ЗАГРУЗКА АРТОВ⋯',
    'СБОРКА СЦЕН⋯',
    'КАЛИБРОВКА СВЕТА⋯',
    'ГОТОВО',
  ];

  /* =========================================================
     ПОДГОТОВКА — ставим сцену в «нулевое» состояние
     ========================================================= */
  function prepareInitialState() {
    // Шторка полностью закрыта
    transition.setProgress(1);

    // Скролл заблокирован
    scroll.stop();

    // Лоадер виден
    if (loader) loader.classList.remove('is-hidden');
    if (loaderBar) loaderBar.style.width = '0%';
    if (loaderStatus) loaderStatus.textContent = STATUSES[0];

    // Камера в глубине
    camera.position.set(0, 0, 60);
    camera.lookAt(0, 0, 0);

    // Post-processing — bloom выключен, виньетка сильная
    if (postfx) {
      postfx.setBloom({ strength: 0 });
      postfx.setVignette(1.5);
    }
  }

  /* =========================================================
     ПРОГРЕСС ЛОАДЕРА
     ========================================================= */
  function setProgress(p) {
    const clamped = Math.max(0, Math.min(1, p));
    if (loaderBar) loaderBar.style.width = `${clamped * 100}%`;

    if (loaderStatus) {
      const idx = Math.min(STATUSES.length - 1, Math.floor(clamped * STATUSES.length));
      loaderStatus.textContent = STATUSES[idx];
    }
  }

  /* =========================================================
     ЗВУК — «вдох вселенной»
     ========================================================= */
  function playIntroSound() {
    if (sound && !sound.isSoundEnabled()) return;
    try {
      const AC = window.AudioContext || window.webkitAudioContext;
      const ctx = new AC();
      const now = ctx.currentTime;

      // Низкий гул
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(50, now);
      osc.frequency.exponentialRampToValueAtTime(28, now + 3);
      gain.gain.setValueAtTime(0.001, now);
      gain.gain.linearRampToValueAtTime(0.12, now + 1.2);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 3.5);
      osc.connect(gain).connect(ctx.destination);
      osc.start(now);
      osc.stop(now + 3.5);

      // Шумовой пролёт
      const sr = ctx.sampleRate;
      const dur = 3;
      const buf = ctx.createBuffer(1, dur * sr, sr);
      const data = buf.getChannelData(0);
      for (let i = 0; i < data.length; i++) {
        const t = i / data.length;
        const env = Math.sin(Math.PI * Math.pow(t, 0.6)) * (1 - t * 0.4);
        data[i] = (Math.random() * 2 - 1) * env;
      }
      const noise = ctx.createBufferSource();
      noise.buffer = buf;
      const filter = ctx.createBiquadFilter();
      filter.type = 'bandpass';
      filter.frequency.setValueAtTime(400, now);
      filter.frequency.linearRampToValueAtTime(2400, now + 1.5);
      filter.frequency.linearRampToValueAtTime(800, now + 3);
      filter.Q.value = 1.2;
      const noiseGain = ctx.createGain();
      noiseGain.gain.value = 0.07;
      noise.connect(filter).connect(noiseGain).connect(ctx.destination);
      noise.start(now);

      // Вспышка-«динь»
      const ping = ctx.createOscillator();
      c


      const pingGain = ctx.createGain();
      ping.type = 'triangle';
      ping.frequency.setValueAtTime(880, now + 1.5);
      ping.frequency.exponentialRampToValueAtTime(1760, now + 1.8);
      pingGain.gain.setValueAtTime(0, now + 1.5);
      pingGain.gain.linearRampToValueAtTime(0.1, now + 1.55);
      pingGain.gain.exponentialRampToValueAtTime(0.001, now + 2.7);
      ping.connect(pingGain).connect(ctx.destination);
      ping.start(now + 1.5);
      ping.stop(now + 2.7);

      setTimeout(() => { try { ctx.close(); } catch (e) {} }, 5000);
    } catch (e) {}
  }

  /* =========================================================
     ГЛАВНАЯ АНИМАЦИЯ
     ========================================================= */
  function playReveal() {
    return new Promise((resolve) => {
      const tl = gsap.timeline({
        onComplete: () => {
          scroll.start();
          if (postfx) postfx.setVignette(0.75);
          resolve();
        },
      });

      /* 1. Лоадер растворяется */
      tl.to(loader, {
        opacity: 0,
        duration: 0.8,
        ease: 'power2.in',
        onComplete: () => {
          if (loader) loader.classList.add('is-hidden');
        },
      }, 0);

      /* 2. Шторка открывается (1 → 0) */
      tl.to(transition, {
        _progress: 0,
        duration: 1.6,
        ease: 'power3.inOut',
        onUpdate: function () {
          // transition — объект с методом setProgress
          transition.setProgress(this.targets()[0]._progress);
        },
      }, 0.2);

      /* 3. Камера летит из глубины к первой сцене */
      tl.to(camera.position, {
        x: 0,
        y: 0.2,
        z: 9,
        duration: 4.5,
        ease: 'power2.inOut',
        onUpdate: () => camera.lookAt(0, 0, 0),
      }, 0.4);

      /* 4. Лёгкий крен при подлёте */
      tl.fromTo(camera.rotation, {
        z: -0.3,
      }, {
        z: 0,
        duration: 4.5,
        ease: 'power2.inOut',
      }, 0.4);

      /* 5. Bloom разгорается */
      if (postfx && postfx.bloom) {
        tl.to(postfx.bloom, {
          strength: 0.55,
          duration: 3,
          ease: 'power2.out',
        }, 1.5);
      }

      /* 6. Микро-«выдох» в конце — камера чуть отходит и возвращается */
      tl.to(camera.position, {
        z: 9.5,
        duration: 1,
        ease: 'power2.out',
      }, 4.5);
      tl.to(camera.position, {
        z: 9,
        duration: 1.2,
        ease: 'power2.inOut',
      }, 5.5);
    });
  }

  /* =========================================================
     ПУБЛИЧНЫЙ API
     ========================================================= */
  return {
    /**
     * Основной запуск — вызывается из main.js
     * @param {Promise} preloadPromise — промис предзагрузки, из него берём прогресс
     */
    async play(preloadPromise) {
      prepareInitialState();

      // Если передан промис предзагрузки — привязываем его прогресс
      if (preloadPromise && typeof preloadPromise.then === 'function') {
        try {
          // Пока грузим — двигаем лоадер до 70%
          setProgress(0.1);
          await new Promise((r) => setTimeout(r, 200));
          setProgress(0.4);

          await preloadPromise;
          setProgress(0.7);
        } catch (e) {
          console.warn('[Intro] Ошибка предзагрузки:', e);
        }
      } else {
        // Иначе — имитируем загрузку для эффекта
        for (let i = 1; i <= 7; i++) {
          setProgress(i / 10);
          await new Promise((r) => setTimeout(r, 120));
        }
      }

      // Финальные 100%
      setProgress(1.0);
      await new Promise((r) => setTimeout(r, 300));

      // Звук
      playIntroSound();

      // Главная анимация
      return playReveal();
    },

    /**
     * Быстрый replay — для кнопки «Вернуться к вратам»
     */
    replay() {
      transition.setProgress(0);
      camera.position.set(0, 0.2, 9);
      camera.rotation.z = 0;
      camera.lookAt(0, 0, 0);

      const tl = gsap.timeline();

      tl.fromTo(camera.position, {
        x: 0, y: 0.2, z: 30,
      }, {
        x: 0, y: 0.2, z: 9,
        duration: 2.5,
        ease: 'power2.inOut',
        onUpdate: () => camera.lookAt(0, 0, 0),
      }, 0);

      playIntroSound();
      return tl;
    },
  };
}
