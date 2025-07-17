import * as THREE from 'three';

export const WINDOW_WIDTH = 3;
export const BOTTOM_FRAME_HEIGHT = 4.5;
export const TOP_FRAME_HEIGHT = 1.5;
export const LOW_HEIGHT = 1.5;
export const FRAME_THICKNESS = 0.03;
export const INTERIOR_GAP = 0.1;

export const GLASS = new THREE.ShaderMaterial({
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
});

export const LINE_COLOR = 0x93807b;