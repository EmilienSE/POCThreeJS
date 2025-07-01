import * as THREE from 'three';
import { OpeningDirection } from '../../../utils/opening-direction.enum';
import { GLASS } from '../../../utils/consts';

function getTriangleVertices(width: number, height: number): THREE.Vector2[] {
  const halfWidth = width / 2;
  return [
    new THREE.Vector2(0, height / 2), // sommet haut
    new THREE.Vector2(-halfWidth, -height / 2), // bas gauche
    new THREE.Vector2(halfWidth, -height / 2), // bas droit
  ];
}

export function createTriangleFrame(
  frameWidth: number,
  frameHeight: number,
  frameThickness: number,
  interiorGap: number,
  openingDirection: OpeningDirection,
  horGlazingBarsNumber: number = 0,
  verGlazingBarsNumber: number = 0,
): THREE.Group {
  const frameGroup = new THREE.Group();
  const frameMaterial = new THREE.MeshBasicMaterial({ color: 0x000000 });

  // Sommets extérieurs du triangle
  const outer = getTriangleVertices(frameWidth, frameHeight);
  // Sommets intérieurs (pour l'épaisseur du cadre)
  const inner = getTriangleVertices(frameWidth - 2 * frameThickness, frameHeight - 2 * frameThickness);

  // Création des 3 côtés du cadre
  for (let i = 0; i < 3; i++) {
    const next = (i + 1) % 3;
    const shape = new THREE.Shape([
      new THREE.Vector2(outer[i].x, outer[i].y),
      new THREE.Vector2(outer[next].x, outer[next].y),
      new THREE.Vector2(inner[next].x, inner[next].y),
      new THREE.Vector2(inner[i].x, inner[i].y),
    ]);
    const geometry = new THREE.ShapeGeometry(shape);
    const mesh = new THREE.Mesh(geometry, frameMaterial);
    frameGroup.add(mesh);
  }

  // Ajout de la vitre
  const glassMaterial = new THREE.ShaderMaterial(GLASS);
  const glassShape = new THREE.Shape(inner);
  const glassGeometry = new THREE.ShapeGeometry(glassShape);
  const glass = new THREE.Mesh(glassGeometry, glassMaterial);
  glass.position.z = 0.00;
  frameGroup.add(glass);

  return frameGroup;
}
