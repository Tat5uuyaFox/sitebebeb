/* =========================================================
   OPTIMIZER — следит за FPS и меняет качество на лету
   =========================================================
   Логика:
   - FPS < 40 в течение 3 секунд → понижаем уровень
   - FPS > 55 в течение 10 секунд → повышаем уровень
   - Кулдаун 15 секунд между изменениями
   ========================================================= */

export function createOptimizer({ onDowngrade, onUpgrade, initialLevel = 'high' }) {
  // Состояние
  let currentLevel = initialLevel;
  const fpsSamples = [];
  let lowFpsTimer = 0;
  let highFpsTimer = 0;
  let cooldown = 0;

  // Пороги
  const FPS_LOW = 40;
  const FPS_HIGH = 55;
  const LOW_TIME = 3;
  const HIGH_TIME = 10;
  const COOLDOWN_TIME = 15;

  const LEVELS = ['low', 'medium', 'high'];

  return {
    update(dt) {
      // Кулдаун
      if (cooldown > 0) cooldown -= dt;

      // Собираем FPS-сэмплы
      const fps = 1 / Math.max(dt, 0.0001);
      fpsSamples.push(fps);
      if (fpsSamples.length > 30) fpsSamples.shift();

      const avgFps = fpsSamples.reduce((a, b) => a + b, 0) / fpsSamples.length;

      // Проверка на даунгрейд
      if (avgFps < FPS_LOW) {
        lowFpsTimer += dt;
        highFpsTimer = 0;

        if (lowFpsTimer >= LOW_TIME && cooldown <= 0) {
          const idx = LEVELS.indexOf(currentLevel);
          if (idx > 0) {
            currentLevel = LEVELS[idx - 1];
            console.log(`[Optimizer] Снижаем качество до ${currentLevel} (FPS: ${avgFps.toFixed(1)})`);
            onDowngrade && onDowngrade(currentLevel);
            lowFpsTimer = 0;
            cooldown = COOLDOWN_TIME;
          }
        }
      } else {
        lowFpsTimer = 0;
      }

      // Проверка на апгрейд
      if (avgFps > FPS_HIGH && currentLevel !== 'high') {
        highFpsTimer += dt;

        if (highFpsTimer >= HIGH_TIME && cooldown <= 0) {
          const idx = LEVELS.indexOf(currentLevel);
          if (idx < LEVELS.length - 1) {
            currentLevel = LEVELS[idx + 1];
            console.log(`[Optimizer] Повышаем качество до ${currentLevel} (FPS: ${avgFps.toFixed(1)})`);
            onUpgrade && onUpgrade(currentLevel);
            highFpsTimer = 0;
            cooldown = COOLDOWN_TIME;
          }
        }
      } else {
        highFpsTimer = 0;
      }

      return {
        fps: avgFps,
        level: currentLevel,
      };
    },

    getLevel() {
      return currentLevel;
    },

    setLevel(level) {
      if (LEVELS.includes(level)) {
        currentLevel = level;
        cooldown = COOLDOWN_TIME;
      }
    },
  };
}