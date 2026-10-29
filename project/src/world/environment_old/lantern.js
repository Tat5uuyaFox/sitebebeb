import * as THREE from 'three';

/* =========================================================
   LANTERN — старый фонарь на столбе
   =========================================================
   Единственный след человека в пещере. Тёплый золотой
   свет, лампочка мерцает, вокруг летают мотыльки.
   ========================================================= */
export function createLantern(parent, position = { x: -3, y: -3, z: 4 }) {
  const group = new THREE.Group();
  group.position.set(position.x, position.y, position.z);
  parent.add(group);

  /* --- Столб --- */
  const poleMat = new THREE.MeshStandardMaterial({
    color: 0x1a1008,
    roughness: 0.9,
    metalness: 0.1,
    flatShading: true,
  });

  const pole = new THREE.Mesh(
    new THREE.CylinderGeometry(0.08, 0.12, 3.5, 6),
    poleMat
  );
  pole.position.y = -1.75;
  pole.castShadow = true;
  group.add(pole);

  /* --- Кронштейн --- */
  const arm = new THREE.Mesh(
    new THREE.BoxGeometry(0.8, 0.08, 0.08),
    poleMat
  );
  arm.position.set(0.4, 0, 0);
  arm.castShadow = true;
  group.add(arm);

  /* --- Стеклянный корпус фонаря --- */
  const housingMat = new THREE.MeshPhysicalMaterial({
    color: 0x3a2a1a,
    roughness: 0.4,
    metalness: 0.6,
    transmission: 0.3,
    thickness: 0.1,
    transparent: true,
    opacity: 0.85,
  });

  // Верх фонаря (крышка)
  const top = new THREE.Mesh(
    new THREE.ConeGeometry(0.22, 0.18, 6),
    housingMat
  );
  top.position.set(0.8, 0.15, 0);
  group.add(top);

  // Стекло
  const glassMat = new THREE.MeshPhysicalMaterial({
    color: 0xffd090,
    emissive: 0xffa860,
    emissiveIntensity: 1.5,
    roughness: 0.2,
    metalness: 0,
    transmission: 0.8,
    thickness: 0.05,
    ior: 1.5,
    transparent: true,
    opacity: 0.95,
  });
  const glass = new THREE.Mesh(
    new THREE.CylinderGeometry(0.18, 0.2, 0.35, 8),
    glassMat
  );
  glass.position.set(0.8, -0.05, 0);
  group.add(glass);

  // Дно
  const bottom = new THREE.Mesh(
    new THREE.CylinderGeometry(0.22, 0.15, 0.1, 6),
    housingMat
  );
  bottom.position.set(0.8, -0.28, 0);
  group.add(bottom);

  /* --- Пламя внутри --- */
  const flameMat = new THREE.MeshBasicMaterial({
    color: 0xffeeaa,
    transparent: true,
    opacity: 0.95,
  });
  const flame = new THREE.Mesh(
    new THREE.SphereGeometry(0.08, 10, 10),
    flameMat
  );
  flame.position.set(0.8, -0.05, 0);
  flame.scale.set(1, 1.6, 1);
  group.add(flame);

  /* --- Ореол — главный источник света --- */
  const haloCanvas = document.createElement('canvas');
  haloCanvas.width = haloCanvas.height = 128;
  const hctx = haloCanvas.getContext('2d');
  const hg = hctx.createRadialGradient(64, 64, 0, 64, 64, 64);
  hg.addColorStop(0, 'rgba(255, 220, 140, 0.9)');
  hg.addColorStop(0.3, 'rgba(255, 180, 80, 0.4)');
  hg.addColorStop(1, 'rgba(255, 140, 40, 0)');
  hctx.fillStyle = hg;
  hctx.fillRect(0, 0, 128, 128);
  const haloTex = new THREE.CanvasTexture(haloCanvas);

  const halo = new THREE.Sprite(
    new THREE.SpriteMaterial({
      map: haloTex,
      color: 0xffb060,
      transparent: true,
      opacity: 0.9,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    })
  );
  halo.scale.set(4, 4, 1);
  halo.position.set(0.8, -0.05, 0);
  group.add(halo);

  /* --- Основной свет --- */
  const light = new THREE.PointLight(0xffa860, 3.5, 12, 2);
  light.position.set(0.8, -0.05, 0);
  light.castShadow = true;
  light.shadow.mapSize.set(512, 512);
  light.shadow.bias = -0.001;
  group.add(light);

  /* --- Мотыльки вокруг фонаря --- */
  const mothCount = 12;
  const mothGeo = new THREE.BufferGeometry();
  const mothPos = new Float32Array(mothCount * 3);
  const mothData = [];

  for (let i = 0; i < mothCount; i++) {
    mothPos[i * 3]     = 0.8;
    mothPos[i * 3 + 1] = -0.05;
    mothPos[i * 3 + 2] = 0;

    mothData.push({
      radius: 0.3 + Math.random() * 0.4,
      angle: Math.random() * Math.PI * 2,
      speed: 0.5 + Math.random() * 1.5,
      yPhase: Math.random() * Math.PI * 2,
      ySpeed: 0.8 + Math.random() * 1.2,
      yAmp: 0.1 + Math.random() * 0.15,
    });
  }
  mothGeo.setAttribute('position', new THREE.BufferAttribute(mothPos, 3));

  const mothMat = new THREE.PointsMaterial({
    size: 0.04,
    color: 0xffd8a0,
    transparent: true,
    opacity: 0.9,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
  });
  const moths = new THREE.Points(mothGeo, mothMat);
  group.add(moths);

  return {
    group,
    update(time) {
      // Пламя мерцает
      const flicker = 0.85 + Math.sin(time * 12) * 0.08 + Math.sin(time * 7.3) * 0.07;
      light.intensity = 3.5 * flicker;
      flameMat.opacity = 0.85 + flicker * 0.15;
      flame.scale.set(1, 1.6 + flicker * 0.2, 1);
      halo.material.opacity = 0.75 + flicker * 0.2;

      // Мотыльки кружат вокруг пламени
      const pos = mothGeo.attributes.position.array;
      for (let i = 0; i < mothCount; i++) {
        const d = mothData[i];
        d.angle += d.speed * (1 / 60);
        pos[i * 3]     = 0.8 + Math.cos(d.angle) * d.radius;
        pos[i * 3 + 1] = -0.05 + Math.sin(time * d.ySpeed + d.yPhase) * d.yAmp;
        pos[i * 3 + 2] = Math.sin(d.angle) * d.radius;
      }
      mothGeo.attributes.position.needsUpdate = true;
    },
    dispose() {
      if (group.parent) group.parent.remove(group);
      group.traverse((o) => {
        if (o.geometry) o.geometry.dispose();
        if (o.material) {
          if (Array.isArray(o.material)) o.material.forEach((m) => m.dispose());
          else o.material.dispose();
        }
      });
      haloTex.dispose();
    },
  };
}