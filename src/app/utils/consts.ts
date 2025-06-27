import * as THREE from 'three';

export const WINDOW_WIDTH = 3;
export const FRAME_HEIGHT = 6;
export const FRAME_THICKNESS = 0.03;
export const INTERIOR_GAP = 0.1; // Espace pour les cadres intérieurs

export const GLASS = {
      uniforms: {
        color1: { value: new THREE.Color(0xe5f4fd) },
        color2: { value: new THREE.Color(0xf5fbff) }
      },
      vertexShader: `
        varying vec2 vUv;
        void main() {
          vUv = uv;
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
      `,
      fragmentShader: `
        uniform vec3 color1;
        uniform vec3 color2;
        varying vec2 vUv;
        void main() {
          vec3 color = mix(color1, color2, vUv.y); // dégradé vertical
          gl_FragColor = vec4(color, 1.0);
        }
      `,
      transparent: false
    }