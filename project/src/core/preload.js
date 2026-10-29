import * as THREE from 'three';
import { ART_REGISTRY } from './assets.js';

/* =========================================================
   PRELOAD — предзагрузка артов перед стартом
   =========================================================
   Грузит все картинки из ART_REGISTRY параллельно.
   Возвращает объект { rift01: Texture, rift02: Texture, ... }
   ========================================================= */

const textureLoader = new THREE.TextureLoader();
const cache = new Map();

/**
 * Загрузить одну текстуру с настройками для арта.
 */
function loadOne(url) {
  if (cache.has(url)) {
    return Promise.resolve(cache.get(url));
  }

  return new Promise((resolve, reject) => {
    textureLoader.load(
      url,
      (texture) => {
        // Правильные настройки для арта
        texture.colorSpace = THREE.SRGBColorSpace;
        texture.minFilter  = THREE.LinearMipmapLinearFilter;
        texture.magFilter  = THREE.LinearFilter;
        texture.generateMipmaps = true;
        texture.anisotropy = 8;
        texture.needsUpdate = true;

        cache.set(url, texture);
        resolve(texture);
      },
      undefined,
      (err) => {
        console.error(`[Preload] Не удалось загрузить: ${url}`, err);
        reject(err);
      }
    );
  });
}

/**
 * Загрузить все арты из реестра.
 * Возвращает Promise<{ [key]: Texture }>
 */
export async function preloadArtAssets() {
  const keys = Object.keys(ART_REGISTRY);
  const urls = Object.values(ART_REGISTRY);

  if (urls.length === 0) {
    return {};
  }

  const textures = await Promise.all(urls.map((url) => loadOne(url)));

  const result = {};
  keys.forEach((key, i) => {
    result[key] = textures[i];
  });

  console.log(`[Preload] Загружено ${textures.length} артов`);
  return result;
}

/**
 * Очистить кэш — на случай перезагрузки.
 */
export function clearPreloadCache() {
  cache.forEach((tex) => tex.dispose());
  cache.clear();
}