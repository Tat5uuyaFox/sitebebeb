import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

/* =========================================================
   SCROLL SCENES v4 — плавные переходы + магнитный скролл
   =========================================================
   Как работает:

   1. Сцены разбиты по глобальному прогрессу:
        0.00 – 0.33  → intro
        0.33 – 0.66  → factions
        0.66 – 1.00  → world

   2. Вокруг каждой границы есть ЗОНА ПЕРЕХОДА ± 0.04
        Пример для границы 0.33: 0.29 – 0.37
      В этой зоне шторка плавно закрывается (0 → 1) на первой
      половине и открывается (1 → 0) на второй. Сцена
      меняется точно в середине зоны (P = 0.33).

   3. Прогресс шторки привязан к скроллу напрямую — если
      остановить скролл, шторка застынет на полпути.

   4. Магнитный скролл: Lenis wheelMultiplier меняется
      динамически. В центре сцены — медленно (0.4×),
      у границы — быстро (1.6×).
   ========================================================= */

const SCENES = [
  { name: 'intro',    start: 0.00, end: 0.33, center: 0.165 },   // Пещера
  { name: 'factions', start: 0.33, end: 0.66, center: 0.495 },   // Зал Совета
  { name: 'world',    start: 0.66, end: 1.00, center: 0.830 },   // Сердце Глубин
];

const TRANSITION_WIDTH = 0.04;   // ± ширина зоны перехода
const MULT_SLOW = 0.45;          // скорость у центра сцены
const MULT_FAST = 1.65;          // скорость у границы

export function createScrollScenes({ sceneManager, scroll, transition }) {
  const navDots     = [...document.querySelectorAll('.nav__dot')];
  const progressBar = document.getElementById('progressBar');
  const chapters    = [...document.querySelectorAll('.chapter')];
  const chapterLabel = document.getElementById('chapterLabel');
  const chapterCount = document.getElementById('chapterCount');

  let currentSceneName = null;
  let sceneChangeLocked = false;   // блокирует повторные вызовы goTo

  /* =========================================================
     ОПРЕДЕЛЯЕМ АКТИВНУЮ СЦЕНУ ПО ПРОГРЕССУ
     ========================================================= */
  function getSceneAt(p) {
    for (const s of SCENES) {
      if (p >= s.start && p < s.end) return s;
    }
    return SCENES[SCENES.length - 1];
  }

  /* =========================================================
     ОПРЕДЕЛЯЕМ, В КАКОЙ ЗОНЕ ПЕРЕХОДА МЫ НАХОДИМСЯ
     =========================================================
     Возвращает { from, to, progress } или null, если мы в
     «спокойной» зоне сцены.
     ========================================================= */
  function getTransitionState(p) {
    for (let i = 0; i < SCENES.length - 1; i++) {
      const boundary = SCENES[i].end;
      const zoneStart = boundary - TRANSITION_WIDTH;
      const zoneEnd   = boundary + TRANSITION_WIDTH;

      if (p >= zoneStart && p <= zoneEnd) {
        // Прогресс перехода 0..1
        const t = (p - zoneStart) / (zoneEnd - zoneStart);
        return {
          from: SCENES[i].name,
          to:   SCENES[i + 1].name,
          progress: t,
          boundary,
        };
      }
    }
    return null;
  }

  /* =========================================================
     МАГНИТНЫЙ СКРОЛЛ — динамический множитель
     =========================================================
     Чем ближе к центру сцены — тем медленнее.
     В зоне перехода — тоже замедляем, чтобы шторка успела
     проиграть красиво.
     ========================================================= */
  function updateScrollSpeed(p) {
    if (!scroll.setWheelMultiplier) return;

    // В зоне перехода — средняя скорость
    const inTransition = getTransitionState(p) !== null;
    if (inTransition) {
      // Плавно: чем ближе к середине зоны, тем медленнее
      const t = getTransitionState(p).progress;
      const distFromMid = Math.abs(t - 0.5) * 2; // 0 в середине, 1 на краях
      const mult = MULT_SLOW + distFromMid * (MULT_FAST - MULT_SLOW) * 0.5;
      scroll.setWheelMultiplier(mult);
      return;
    }

    // Внутри сцены — считаем расстояние до её центра
    const scene = getSceneAt(p);
    const distFromCenter = Math.abs(p - scene.center);

    // Максимальное расстояние от центра до границы сцены
    const halfSpan = (scene.end - scene.start) / 2;
    const t = Math.min(1, distFromCenter / halfSpan);

    // В центре: 0.45. На границе: 1.65
    const mult = MULT_SLOW + t * (MULT_FAST - MULT_SLOW);
    scroll.setWheelMultiplier(mult);
  }

  /* =========================================================
     ГЛАВНЫЙ ТРИГГЕР — обновляется на каждый скролл
     ========================================================= */
  ScrollTrigger.create({
    trigger: document.body,
    start: 'top top',
    end: 'bottom bottom',
    onUpdate: (self) => {
      const p = self.progress;

      // 1. Прогресс-бар сверху
      if (progressBar) progressBar.style.width = `${p * 100}%`;

      // 2. Магнитный множитель скролла
      updateScrollSpeed(p);

      // 3. Шторка
      const tState = getTransitionState(p);
      if (tState) {
        // МЫ В ЗОНЕ ПЕРЕХОДА
        // Прогресс шторки: 0 → 1 → 0 (пик в середине)
        // Точнее: сначала закрываемся (0 → 1), потом открываемся (1 → 0).
        // Пик закрытия — точно в середине зоны.
        const rawT = tState.progress;
        let curtainProgress;
        if (rawT < 0.5) {
          // Закрываемся: 0 → 1
          curtainProgress = rawT * 2;
        } else {
          // Открываемся: 1 → 0
          curtainProgress = (1 - rawT) * 2;
        }
        transition.setProgress(curtainProgress);

        // 4. СМЕНА СЦЕНЫ — точно в середине зоны
        if (rawT >= 0.5 && currentSceneName !== tState.to && !sceneChangeLocked) {
          sceneChangeLocked = true;
          currentSceneName = tState.to;

          sceneManager.goTo(tState.to, { withTransition: false }).then(() => {
            sceneChangeLocked = false;
          });
        }
      } else {
        // В «спокойной» зоне — шторка закрыта
        transition.setProgress(0);

        // 5. Определяем активную сцену (для случаев, когда мы
        //    попали сюда без прохождения через зону перехода —
        //    например, при клике по nav-точке)
        const scene = getSceneAt(p);
        if (scene.name !== currentSceneName && !sceneChangeLocked) {
          sceneChangeLocked = true;
          currentSceneName = scene.name;
          sceneManager.goTo(scene.name, { withTransition: false }).then(() => {
            sceneChangeLocked = false;
          });
        }

        // 6. Прокидываем локальный прогресс в активную сцену
        const span = scene.end - scene.start;
        const localP = span > 0 ? (p - scene.start) / span : 0;
        sceneManager.setSceneProgress(localP);
      }
    },
  });

  /* =========================================================
     АКТИВНАЯ ГЛАВА (для nav-точек)
     ========================================================= */
  chapters.forEach((chapter, i) => {
    ScrollTrigger.create({
      trigger: chapter,
      start: 'top center',
      end: 'bottom center',
      onToggle: (self) => {
        if (self.isActive) {
          chapter.classList.add('is-active');
          navDots.forEach((dot, j) => dot.classList.toggle('is-active', j === i));
          if (chapterLabel) {
            const activeDot = navDots.find((dot) => dot.dataset.target === chapter.dataset.chapter);
            chapterLabel.textContent = activeDot?.dataset.label || 'ВХОД';
          }
          if (chapterCount) chapterCount.textContent = `${String(i + 1).padStart(2, '0')} — ${String(chapters.length).padStart(2, '0')}`;
        } else {
          chapter.classList.remove('is-active');
        }
      },
    });
  });

  /* =========================================================
     КЛИКИ ПО NAV-ТОЧКАМ
     ========================================================= */
  navDots.forEach((dot) => {
    dot.addEventListener('click', () => {
      const target = dot.dataset.target;
      const chapter = document.querySelector(`.chapter[data-chapter="${target}"]`);
      if (chapter) {
        scroll.scrollTo(chapter, {
          duration: 2.2,
          easing: (t) => 1 - Math.pow(1 - t, 4),
        });
      }
    });
  });

  return {
    getCurrentScene: () => currentSceneName,
  };
}
