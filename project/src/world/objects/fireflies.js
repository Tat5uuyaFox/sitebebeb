import * as THREE from 'three';

/* =========================================================
   FIREFLIES — светлячки в пещере
   =========================================================
   - Медленно летают группами
   - Мигают в разном ритме
   - Тёплый зелёный / холодный голубой
   ========================================================= */

export function createFireflies(parent, options = {}) {
  const {
    count = 40,
    area = 20,
    color1 = 0x3ad88a,   // зелёный
    color2 = 0x6ad8ff,   // голубой
  } = options;

  const group = new THREE.Group();
  parent.add(group);

  const fireflies = [];

  // Текстура свечения
  const glowTex = (() => {
    const size = 64;
    const cv = document.createElement('canvas');
    cv.width = cv.height = size;
    const ctx = cv.getContext('2d');
    const g = ctx.createRadialGradient(size/2, size/2, 0, size/2, size/2, size/2);
    g.addColorStop(0, 'rgba(255, 255, 220, 1)');
    g.addColorStop(0.3, 'rgba(200, 255, 180, 0.6)');
    g.addColorStop(1, 'rgba(58, 216, 138, 0)');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, size, size);
    const tex = new THREE.CanvasTexture(cv);
    tex.colorSpace = THREE.SRGBColorSpace;
    return tex;
  })();

  for (let i = 0; i < count; i++) {
    const isGreen = Math.random() < 0.6;
    const col = isGreen ? color1 : color2;

    const sprite = new THREE.Sprite(
      new THREE.SpriteMaterial({
        map: glowTex,
        color: col,
        transparent: true,
        opacity: 0.9,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
      })
    );
    const size = 0.15 + Math.random() * 0.25;
    sprite.scale.set(size, size, 1);

    // Стартовая позиция
    const angle = Math.random() * Math.PI * 2;
    const r = Math.random() * area * 0.7;
    sprite.position.set(
      Math.cos(angle) * r,
      -3 + Math.random() * 10,
      Math.sin(angle) * r
    );

    group.add(sprite);

    fireflies.push({
      sprite,
      mat: sprite.material,
      basePos: sprite.position.clone(),
      phase: Math.random() * Math.PI * 2,
      blinkSpeed: 1.5 + Math.random() * 2.5,
      driftSpeed: 0.2 + Math.random() * 0.5,
      driftRadius: 1 + Math.random() * 2,
      orbitAngle: Math.random() * Math.PI * 2,
      orbitSpeed: (Math.random() - 0.5) * 0.4,
    });
  }

  return {
    group,

    update(time, dt) {
      fireflies.forEach((f) => {
        // Орбита вокруг базовой точки
        f.orbitAngle += f.orbitSpeed * dt;
        const driftX = Math.cos(time * f.driftSpeed + f.phase) * f.driftRadius;
        const driftY = Math.sin(time * f.driftSpeed * 0.8 + f.phase) * 0.8;
        const driftZ = Math.sin(time * f.driftSpeed + f.phase * 2) * f.driftRadius;

        f.sprite.position.x = f.basePos.x + driftX + Math.cos(f.orbitAngle) * 0.5;
        f.sprite.position.y = f.basePos.y + driftY;
        f.sprite.position.z = f.basePos.z + driftZ + Math.sin(f.orbitAngle) * 0.5;

        // Мигание
        const blink = 0.5 + Math.sin(time * f.blinkSpeed + f.phase) * 0.5;
        const sharp = Math.pow(blink, 3); // резкие вспышки
        f.mat.opacity = 0.2 + sharp * 0.8;
        const scale = 0.8 + sharp * 0.5;
        f.sprite.scale.set(
          f.sprite.scale.x,
          f.sprite.scale.y,
          1
        ); // оставим постоянным
        f.sprite.scale.setScalar((f.sprite.userData?.baseSize || 0.2) * scale);
      });
    },

    dispose() {
      parent.remove(group);
      fireflies.forEach((f) => f.mat.dispose());
      glowTex.dispose();
    },
  };
}