import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

/* =========================================================
   TEXT REVEAL — анимация текста глав
   =========================================================
   Что делает:
   1. Разбивает заголовки на буквы, текст на слова
   2. Оборачивает их в span-ы для анимации
   3. Через ScrollTrigger запускает GSAP-таймлайн,
      когда глава появляется в зоне видимости
   4. Разные эффекты для заголовка / текста / индекса
   ========================================================= */

/* ---------------------------------------------------------
   Хелперы: разбивка текста
   --------------------------------------------------------- */

/**
 * Разбивает текст элемента на буквы, оборачивает каждую в span.
 * Сохраняет пробелы как отдельные span-ы, чтобы не слипалось.
 */
function splitToChars(el) {
  const text = el.textContent.replace(/\s+/g, ' ').trim();
  el.textContent = '';

  const chars = [];
  for (const ch of text) {
    const span = document.createElement('span');
    span.className = 'text-reveal__char';
    span.style.display = 'inline-block';
    span.style.willChange = 'transform, opacity';

    if (ch === ' ') {
      span.innerHTML = '&nbsp;';
      span.style.whiteSpace = 'pre';
    } else {
      span.textContent = ch;
    }

    el.appendChild(span);
    chars.push(span);
  }
  return chars;
}

/**
 * Разбивает текст на слова, оборачивает каждое в span.
 * Внутри слова буквы остаются целыми — для скорости.
 */
function splitToWords(el) {
  const words = el.textContent.split(' ').filter((w) => w.length > 0);
  el.textContent = '';

  const wordEls = [];
  words.forEach((word, i) => {
    const wrapper = document.createElement('span');
    wrapper.style.display = 'inline-block';
    wrapper.style.willChange = 'transform, opacity, filter';

    const inner = document.createElement('span');
    inner.style.display = 'inline-block';
    inner.textContent = word;

    wrapper.appendChild(inner);
    el.appendChild(wrapper);
    wordEls.push(inner);

    // Пробел между словами
    if (i < words.length - 1) {
      const space = document.createElement('span');
      space.innerHTML = '&nbsp;';
      space.style.display = 'inline-block';
      el.appendChild(space);
    }
  });
  return wordEls;
}

/* ---------------------------------------------------------
   Главная функция
   --------------------------------------------------------- */
export function createTextReveal({ scroll }) {
  const chapters = [...document.querySelectorAll('.chapter')];

  /* ==========================================================
     1. ПОДГОТОВКА — разбиваем текст на части
     ========================================================== */
  chapters.forEach((chapter) => {
    // Заголовки — на буквы
    chapter.querySelectorAll('[data-anim="title"], [data-anim="chapterTitle"], [data-anim="finalTitle"]')
      .forEach((el) => {
        el.dataset.split = 'chars';
        el.__chars = splitToChars(el);
      });

    // Тексты — на слова
    chapter.querySelectorAll('[data-anim="subtitle"], [data-anim="chapterText"], [data-anim="finalSubtitle"]')
      .forEach((el) => {
        el.dataset.split = 'words';
        el.__words = splitToWords(el);
      });
  });

  /* ==========================================================
     2. СОЗДАЁМ ТАЙМЛАЙНЫ ДЛЯ КАЖДОЙ ГЛАВЫ
     ========================================================== */
  const timelines = [];

  chapters.forEach((chapter, index) => {
    const tl = gsap.timeline({
      paused: true,
      defaults: { ease: 'power3.out' },
    });

    /* --- Заголовок: финал собирается из разлетающихся букв --- */
    const titleEl = chapter.querySelector('[data-anim="title"], [data-anim="chapterTitle"], [data-anim="finalTitle"]');
    if (titleEl && titleEl.__chars) {
      gsap.set(titleEl, { opacity: 1, y: 0 });
      if (titleEl.matches('[data-anim="finalTitle"]')) {
        tl.fromTo(titleEl.__chars, {
          x: (i) => (i % 2 ? 1 : -1) * (42 + i * 8),
          y: (i) => (i % 2 ? -1 : 1) * (34 + i * 5),
          rotation: (i) => (i % 2 ? 1 : -1) * (12 + i * 2),
          scale: 0.72,
          opacity: 0,
          filter: 'blur(9px)',
        }, {
          x: 0,
          y: 0,
          rotation: 0,
          scale: 1,
          opacity: 1,
          filter: 'blur(0px)',
          duration: 1.15,
          stagger: { each: 0.075, from: 'edges' },
          ease: 'power4.out',
          clearProps: 'filter',
        }, 0);
      } else {
        gsap.set(titleEl.__chars, { yPercent: 120, opacity: 0 });
        tl.to(titleEl.__chars, {
          yPercent: 0,
          opacity: 1,
          duration: 1.0,
          stagger: { each: 0.035, from: 'start' },
          ease: 'power4.out',
        }, 0);
      }
    }

    /* --- Индекс главы --- */
    const indexEl = chapter.querySelector('.chapter__index');
    if (indexEl) {
      gsap.set(indexEl, { opacity: 0, x: -20 });
      tl.to(indexEl, {
        opacity: 1,
        x: 0,
        duration: 0.8,
        ease: 'power3.out',
      }, 0);
    }

    /* --- Подзаголовок (subtitle) --- */
    const subtitleEl = chapter.querySelector('[data-anim="subtitle"], [data-anim="finalSubtitle"]');
    if (subtitleEl && subtitleEl.__words) {
      gsap.set(subtitleEl, { opacity: 1, y: 0 });
      gsap.set(subtitleEl.__words, {
        opacity: 0,
        y: 20,
        filter: 'blur(6px)',
      });

      tl.to(subtitleEl.__words, {
        opacity: 1,
        y: 0,
        filter: 'blur(0px)',
        duration: 0.9,
        stagger: 0.08,
        ease: 'power3.out',
      }, 0.35);
    }

    /* --- Основной текст главы --- */
    const textEl = chapter.querySelector('[data-anim="chapterText"]');
    if (textEl && textEl.__words) {
      gsap.set(textEl, { opacity: 1, y: 0 });
      gsap.set(textEl.__words, {
        opacity: 0,
        y: 14,
        filter: 'blur(4px)',
      });

      tl.to(textEl.__words, {
        opacity: 1,
        y: 0,
        filter: 'blur(0px)',
        duration: 0.7,
        stagger: 0.025,
        ease: 'power2.out',
      }, 0.55);
    }

    /* --- CTA-кнопка (в финале) --- */
    const ctaEl = chapter.querySelector('[data-anim="cta"]');
    if (ctaEl) {
      gsap.set(ctaEl, { opacity: 0, y: 20 });
      tl.to(ctaEl, {
        opacity: 1,
        y: 0,
        duration: 0.9,
        ease: 'power3.out',
      }, 0.9);
    }

    /* --- Hint «Прокрути» --- */
    const hintEl = chapter.querySelector('[data-anim="hint"]');
    if (hintEl) {
      gsap.set(hintEl, { opacity: 0 });
      tl.to(hintEl, {
        opacity: 1,
        duration: 1.2,
        ease: 'power2.out',
      }, 1.2);
    }

    timelines.push(tl);

    /* ==========================================================
       3. SCROLLTRIGGER — запуск/откат появления
       ==========================================================
       Когда глава появляется в зоне видимости — играем.
       Когда уходит — откатываем, чтобы при возврате снова
       проигралось.
       ========================================================== */
    ScrollTrigger.create({
      trigger: chapter,
      start: 'top 80%',
      end: 'bottom 20%',
      onEnter:     () => tl.play(),
      onEnterBack: () => tl.play(),
      onLeave:     () => tl.reverse(),
      onLeaveBack: () => tl.reverse(),
    });
  });

  /* ==========================================================
     4. ФИНАЛЬНАЯ СЦЕНА — кнопка «Вернуться к вратам»
     ========================================================== */
  const restartBtn = document.getElementById('restartBtn');
  if (restartBtn) {
    restartBtn.addEventListener('click', () => {
      const first = document.querySelector('.chapter[data-chapter="intro"]');
      if (first && scroll) {
        scroll.scrollTo(first, { duration: 2.2 });
      }
    });
  }

  /* ==========================================================
     5. API
     ========================================================== */
  return {
    timelines,
    replay(chapterName) {
      const i = chapters.findIndex((c) => c.dataset.chapter === chapterName);
      if (i >= 0 && timelines[i]) {
        timelines[i].restart();
      }
    },
    destroy() {
      timelines.forEach((tl) => tl.kill());
    },
  };
}
