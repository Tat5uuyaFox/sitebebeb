import * as THREE from 'three';
import { TEXTURES, createSharedMaterials } from './shared.js';
import { createBase }            from './base.js';
import { createRocks }           from './rocks.js';
import { createMoss }            from './moss.js';
import { createFungi }           from './fungi.js';
import { createVegetation }      from './vegetation.js';
import { createCrystals }        from './crystals.js';
import { createVines }           from './vines.js';
import { createCaveStructures }  from './caveStructures.js';
import { createWater }           from './water.js';
import { createParticles }       from './particles.js';
import { createForeground }      from './foreground.js';
import { createThreads }         from './threads.js';

export function createEnvironment(parent, qualityLevel = 'high') {
  const group = new THREE.Group();
  parent.add(group);

  const mossTexture = TEXTURES.moss();
  const materials = createSharedMaterials(mossTexture);

  // Передаём qualityLevel каждому модулю — они решают, сколько объектов
  const modules = [
    createBase(group, materials),
    createRocks(group, materials, qualityLevel),
    createMoss(group, materials, qualityLevel),
    createFungi(group, materials, qualityLevel),
    createVegetation(group, materials, qualityLevel),
    createCrystals(group, materials, qualityLevel),
    createVines(group, materials, qualityLevel),
    createCaveStructures(group, materials, qualityLevel),
    createWater(group, materials, qualityLevel),
    createParticles(group, materials, qualityLevel),
    createThreads(group, materials, qualityLevel),
    createForeground(group, materials, qualityLevel),
  ];

  return {
    group,

    update(time, dt) {
      modules.forEach((m) => m.update && m.update(time, dt));
    },

    dispose() {
      modules.forEach((m) => m.dispose && m.dispose());
      mossTexture.dispose();
      if (group.parent) group.parent.remove(group);
    },
  };
}