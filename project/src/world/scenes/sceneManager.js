import gsap from 'gsap';

/* =========================================================
   SCENE MANAGER — «дирижёр» сцен
   =========================================================
   Что делает:
   1. Хранит реестр зарегистрированных сцен
   2. Переключает активную сцену (с переходом или без)
   3. Обновляет активную сцену каждый кадр
   4. Прокидывает локальный прогресс скролла в активную сцену
   5. Даёт API: goTo(name), update(), setSceneProgress(), getCurrent()

   Сцена = модуль с методами:
   - setProgress(p)   → опционально, локальный прогресс 0..1
   - update(time, dt) → обязательно, вызывается каждый кадр
   - dispose()        → обязательно, удаляет объекты из сцены

   Каждая сцена создаётся через factory({ scene, camera, postfx })
   и возвращает объект с полями:
   - group            → THREE.Group со всеми объектами
   - name             → имя сцены (для отладки)
   - setProgress(p)   → опционально
   - update(time, dt) → обязательно
   - dispose()        → обязательно
   ========================================================= */

export function createSceneManager({ scene, camera, postfx, transition }) {
  /* ---------------------------------------------------------
     ВНУТРЕННЕЕ СОСТОЯНИЕ
     --------------------------------------------------------- */
  const scenes = new Map();   // name → { name, factory, instance }
  let currentName = null;     // имя активной сцены
  let currentScene = null;    // активный экземпляр сцены
  let isTransitioning = false;

  /* =========================================================
     РЕГИСТРАЦИЯ СЦЕНЫ
     =========================================================
     register('intro', createSceneIntro)
     ─ сохраняет фабрику в реестре, но НЕ создаёт сцену.
     Сцена будет создана при первом goTo().
     ========================================================= */
  function register(name, factory) {
    if (typeof factory !== 'function') {
      console.warn(`[SceneManager] Фабрика для "${name}" не является функцией`);
      return;
    }
    scenes.set(name, {
      name,
      factory,
      instance: null,
    });
  }

  /* =========================================================
     ПЕРЕКЛЮЧЕНИЕ СЦЕНЫ
     =========================================================
     goTo('factions', { withTransition: true, duration: 1.1 })
     ─ асинхронная: ждёт закрытия оверлея, подменяет сцену,
       ждёт открытия оверлея. Защищена флагом isTransitioning.
     ========================================================= */
  async function goTo(name, options = {}) {
    // Уже в процессе — игнорируем
    if (isTransitioning) return;

    // Уже там — ничего не делаем (если не force)
    if (currentName === name && !options.force) return;

    const entry = scenes.get(name);
    if (!entry) {
      console.warn(`[SceneManager] Сцена "${name}" не зарегистрирована`);
      return;
    }

    isTransitioning = true;

    const {
      withTransition = true,
      duration = 1.0,
    } = options;

    try {
      /* --- 1. Закрываем экран (если нужно) --- */
      if (withTransition && transition) {
        await transition.cover({ duration: duration * 0.5 });
      }

      /* --- 2. Удаляем старую сцену --- */
      if (currentScene) {
        if (typeof currentScene.dispose === 'function') {
          try { currentScene.dispose(); } catch (e) { console.warn(e); }
        }
        if (currentScene.group && currentScene.group.parent) {
          currentScene.group.parent.remove(currentScene.group);
        }
        currentScene = null;
      }

      /* --- 3. Создаём новую сцену --- */
      const context = { scene, camera, postfx };
      const instance = entry.factory(context);

      entry.instance = instance;
      currentScene = instance;
      currentName = name;

      /* --- 4. Открываем экран (если нужно) --- */
      if (withTransition && transition) {
        await transition.reveal({ duration: duration * 0.5 });
      }
    } catch (err) {
      console.error(`[SceneManager] Ошибка при переходе на "${name}":`, err);
    } finally {
      isTransitioning = false;
    }
  }

  /* =========================================================
     ОБНОВЛЕНИЕ АКТИВНОЙ СЦЕНЫ
     =========================================================
     Вызывается каждый кадр из loop.
     Прокидывает time и dt в update() активной сцены.
     ========================================================= */
  function update(time, dt) {
    if (currentScene && typeof currentScene.update === 'function') {
      currentScene.update(time, dt);
    }
  }

  /* =========================================================
     ПРОКИДКА ЛОКАЛЬНОГО ПРОГРЕССА
     =========================================================
     Вызывается из scrollScenes.js.
     p — локальный прогресс внутри текущей сцены, 0..1.
     Например: если глобальный прогресс 0.45, а сцена занимает
     диапазон 0.33..0.66 — локальный будет (0.45 - 0.33)/0.33 ≈ 0.36.
     ========================================================= */
  function setSceneProgress(p) {
    if (currentScene && typeof currentScene.setProgress === 'function') {
      currentScene.setProgress(p);
    }
  }

  /* =========================================================
     ПУБЛИЧНЫЙ API
     ========================================================= */
  return {
    register,
    goTo,
    update,
    setSceneProgress,

    /* Получить имя активной сцены */
    getCurrent() {
      return currentName;
    },

    /* Идёт ли сейчас переход */
    isTransitioning() {
      return isTransitioning;
    },

    /* Проверить, зарегистрирована ли сцена */
    has(name) {
      return scenes.has(name);
    },

    /* Список зарегистрированных сцен */
    list() {
      return [...scenes.keys()];
    },
  };
}