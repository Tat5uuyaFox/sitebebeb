import * as THREE from 'three';

const loader = new THREE.TextureLoader();
const cache  = new Map();
/** 
@param {string}
@returnns {Promise<THREE.Texture>}
*/
export function loadTexture(url) {
    if (cache.has(url)) {
        return Promise.resolve(cache.get(url));
    }
    return new Promise((resolve, reject) => {
        loader.load(
            url,
            (texture) => {
                texture.colorSpace  = THREE.SRGBColorSpace;
                texture.minFilter   = THREE.LinearMipmapLinearFilter;
                texture.magFilter   = THREE.LinearFilter;
                texture.generateMipmaps = true;
                texture.anisotropy = 8;
                texture.needsUpdate = true;

                cache.set(url, texture);
                resolve(texture);
            },
            undefined, 
            (err) => {
                console.error(`[Assets] Не удалось загрузить: ${url}`, err)
                reject(err);
            }
        );
    });
}


/**
 * @param {string[]}
 * @returns {Promise<Map<string, THREE.Texture>>}
 */
export function loadTextures(urls) {
    return Promise.all(urls.map((url) => loadTexture(url)))
        .then((textures) => {
            const map = new Map();
            urls.ForEach((url, i) => map.set(url, textures[i]));
            return map;
        });
}
export const ART_REGISTRY = {
    rift01: `/project/assets/arts/rift-01.jpg`
};