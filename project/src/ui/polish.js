import gsap from 'gsap';

/* =========================================================
   POLISH — финальные штрихи
   =========================================================
   1. Магнитные nav-точки
   2. Магнитная CTA-кнопка
   3. Кастомный курсор-кристалл
   4. Hover-звуки на интерактивах
   5. Тумблер звука
   ========================================================= */

export function createPolish() {

  /* =========================================================
     1. МАГНИТНЫЕ ЭЛЕМЕНТЫ
     =========================================================
     Элемент с data-magnetic="0.4" будет смещаться в сторону
     курсора на 40% от расстояния. Плавно через GSAP quickTo.
     ========================================================= */
  const magneticEls = [...document.querySelectorAll('[data-magnetic]')];

  const magneticCleanups = magneticEls.map((el) => {
    const strength = parseFloat(el.dataset.magnetic) || 0.4;

    // Быстрые сеттеры — для 60fps анимации
    const xTo = gsap.quickTo(el, 'x', { duration: 0.5, ease: 'power3.out' });
    const yTo = gsap.quickTo(el, 'y', { duration: 0.5, ease: 'power3.out' });

    function onMove(e) {
      const rect = el.getBoundingClientRect();
      const cx = rect.left + rect.width / 2;
      const cy = rect.top + rect.height / 2;
      const dx = e.clientX - cx;
      const dy = e.clientY - cy;

      xTo(dx * strength);
      yTo(dy * strength);
    }

    function onLeave() {
      xTo(0);
      yTo(0);
    }

    el.addEventListener('mousemove', onMove);
    el.addEventListener('mouseleave', onLeave);

    return () => {
      el.removeEventListener('mousemove', onMove);
      el.removeEventListener('mouseleave', onLeave);
    };
  });

  /* =========================================================
     2. КАСТОМНЫЙ КУРСОР
     =========================================================
     Маленький ромб, который «плывёт» за мышью с инерцией.
     При наведении на интерактив — увеличивается.
     ========================================================= */
  const cursor = document.createElement('div');
  cursor.className = 'cursor';
  cursor.innerHTML = `
    <div class="cursor__dot"></div>
    <div class="cursor__ring"></div>
  `;
  document.body.appendChild(cursor);

  const cursorDot  = cursor.querySelector('.cursor__dot');
  const cursorRing = cursor.querySelector('.cursor__ring');

  // Позиции — отдельно для точки и кольца (разная инерция)
  const mousePos = { x: window.innerWidth / 2, y: window.innerHeight / 2 };
  const dotPos   = { ...mousePos };
  const ringPos  = { ...mousePos };

  let cursorVisible = false;

  window.addEventListener('mousemove', (e) => {
    mousePos.x = e.clientX;
    mousePos.y = e.clientY;

    if (!cursorVisible) {
      cursorVisible = true;
      cursor.classList.add('is-visible');
      // Первый раз ставим всё в одну точку
      dotPos.x = ringPos.x = mousePos.x;
      dotPos.y = ringPos.y = mousePos.y;
    }
  });

  window.addEventListener('mouseleave', () => {
    cursorVisible = false;
    cursor.classList.remove('is-visible');
  });

  // Анимация через RAF (своя, не связанная с GSAP)
  function updateCursor() {
    // Точка догоняет быстро
    dotPos.x += (mousePos.x - dotPos.x) * 0.35;
    dotPos.y += (mousePos.y - dotPos.y) * 0.35;

    // Кольцо — медленнее, с большей инерцией
    ringPos.x += (mousePos.x - ringPos.x) * 0.15;
    ringPos.y += (mousePos.y - ringPos.y) * 0.15;

    cursorDot.style.transform  = `translate(${dotPos.x}px, ${dotPos.y}px) translate(-50%, -50%)`;
    cursorRing.style.transform = `translate(${ringPos.x}px, ${ringPos.y}px) translate(-50%, -50%)`;

    requestAnimationFrame(updateCursor);
  }
  updateCursor();

  // Реакция на интерактивные элементы
  const interactiveSelectors = 'a, button, [data-magnetic], .nav__dot, .cta, input, [role="button"]';

  document.addEventListener('mouseover', (e) => {
    if (e.target.closest(interactiveSelectors)) {
      cursor.classList.add('is-hover');
    }
  });

  document.addEventListener('mouseout', (e) => {
    if (e.target.closest(interactiveSelectors)) {
      cursor.classList.remove('is-hover');
    }
  });

  // Скрываем системный курсор
  document.documentElement.classList.add('has-custom-cursor');

  /* =========================================================
     3. HOVER-ЗВУКИ
     =========================================================
     Тихий «динь» при наведении на интерактив.
     Работает только если звук включён (см. пункт 4).
     ========================================================= */
  let audioCtx = null;
  let soundEnabled = true;

  function getCtx() {
    if (!audioCtx) {
      const AC = window.AudioContext || window.webkitAudioContext;
      audioCtx = new AC();
    }
    return audioCtx;
  }

  function playHoverSound() {
    if (!soundEnabled) return;
    try {
      const ctx = getCtx();
      if (ctx.state === 'suspended') return;

      const now = ctx.currentTime;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(660, now);
      osc.frequency.exponentialRampToValueAtTime(1320, now + 0.08);

      gain.gain.setValueAtTime(0.0001, now);
      gain.gain.exponentialRampToValueAtTime(0.035, now + 0.01);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.18);

      osc.connect(gain).connect(ctx.destination);
      osc.start(now);
      osc.stop(now + 0.2);
    } catch (e) { /* тихо */ }
  }

  function playClickSound() {
    if (!soundEnabled) return;
    try {
      const ctx = getCtx();
      if (ctx.state === 'suspended') return;

      const now = ctx.currentTime;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(880, now);
      osc.frequency.exponentialRampToValueAtTime(220, now + 0.15);

      gain.gain.setValueAtTime(0.0001, now);
      gain.gain.exponentialRampToValueAtTime(0.06, now + 0.005);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.22);

      osc.connect(gain).connect(ctx.destination);
      osc.start(now);
      osc.stop(now + 0.25);
    } catch (e) { /* тихо */ }
  }

  // Навешиваем hover-звуки
  const soundTriggers = [...document.querySelectorAll(
    '.nav__dot, .cta, .control-btn, a[href], button'
  )];

  const soundCleanups = soundTriggers.map((el) => {
    let lastHover = 0;

    function onEnter() {
      const now = performance.now();
      if (now - lastHover < 150) return;
      lastHover = now;
      playHoverSound();
    }

    function onClick() {
      playClickSound();
    }

    el.addEventListener('mouseenter', onEnter);
    el.addEventListener('click', onClick);

    return () => {
      el.removeEventListener('mouseenter', onEnter);
      el.removeEventListener('click', onClick);
    };
  });

  // Разблокировка контекста после первого клика
  document.addEventListener('click', () => {
    try {
      const ctx = getCtx();
      if (ctx.state === 'suspended') ctx.resume();
    } catch (e) {}
  }, { once: true });

  /* =========================================================
     4. ТУМБЛЕР ЗВУКА
     ========================================================= */
  const soundToggle = document.getElementById('soundToggle');
  let onToggleChange = null;

  if (soundToggle) {
    const icon = soundToggle.querySelector('.control-btn__icon');

    // Изначально звук включён
    if (icon) icon.textContent = '◉';

    soundToggle.addEventListener('click', () => {
      soundEnabled = !soundEnabled;
      soundToggle.classList.toggle('is-muted', !soundEnabled);
      soundToggle.setAttribute('aria-pressed', String(soundEnabled));
      soundToggle.setAttribute('aria-label', soundEnabled ? 'Выключить звук' : 'Включить звук');

      if (icon) {
        // Простая анимация «переворота»
        gsap.to(icon, {
          rotateY: 180,
          duration: 0.35,
          ease: 'power2.inOut',
          onComplete: () => {
            icon.textContent = soundEnabled ? '◉' : '◌';
            gsap.set(icon, { rotateY: 0 });
          },
        });
      }

      if (onToggleChange) onToggleChange(soundEnabled);
    });
  }

  /* =========================================================
     5. HOVER-КЛАСС ДЛЯ BODY
     =========================================================
     Помогает CSS понять, что мышь где-то есть (для анимаций)
     ========================================================= */
  let bodyHoverTimer = null;
  window.addEventListener('mousemove', () => {
    document.body.classList.add('has-pointer');

    clearTimeout(bodyHoverTimer);
    bodyHoverTimer = setTimeout(() => {
      document.body.classList.remove('has-pointer');
    }, 2000);
  }, { passive: true });

  /* =========================================================
     6. ВОЗВРАЩАЕМ API
     ========================================================= */
  return {
    /* Установить колбэк на переключение звука */
    onSoundToggle(cb) {
      onToggleChange = cb;
    },

    /* Проверить, включён ли звук */
    isSoundEnabled() {
      return soundEnabled;
    },

    /* Программно включить/выключить */
    setSoundEnabled(enabled) {
      soundEnabled = enabled;
      if (soundToggle) {
        soundToggle.classList.toggle('is-muted', !enabled);
        soundToggle.setAttribute('aria-pressed', String(enabled));
        soundToggle.setAttribute('aria-label', enabled ? 'Выключить звук' : 'Включить звук');
      }
    },

    /* Очистка */
    destroy() {
      magneticCleanups.forEach((fn) => fn());
      soundCleanups.forEach((fn) => fn());
      cursor.remove();
      document.documentElement.classList.remove('has-custom-cursor');
    },
  };
}
