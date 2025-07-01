import * as THREE from 'three';
import { OpeningDirection } from '../../../utils/opening-direction.enum';
import { GLASS, LINE_COLOR } from '../../../utils/consts';

export function createTrapezoidFrame(
  frameWidth: number,
  frameHeight: number,
  frameThickness: number,
  interiorGap: number,
  openingDirection: OpeningDirection,
  horGlazingBarsNumber: number = 0,
  verGlazingBarsNumber: number = 0,
  topWidthRatio: number = 0.6
): THREE.Group {
  const frameGroup = new THREE.Group();
  const frameMaterial = new THREE.MeshBasicMaterial({ color: 0x000000 });

  const bottomWidth = frameWidth;
  const topWidth = frameWidth * topWidthRatio;
  const halfHeight = frameHeight / 2;
  const halfBottom = bottomWidth / 2;
  const halfTop = topWidth / 2;

  const A = new THREE.Vector2(-halfBottom, -halfHeight);
  const B = new THREE.Vector2(halfBottom, -halfHeight);
  const C = new THREE.Vector2(halfTop, halfHeight);
  const D = new THREE.Vector2(-halfTop, halfHeight);

  function offsetPoint(p: THREE.Vector2, prev: THREE.Vector2, next: THREE.Vector2, thickness: number): THREE.Vector2 {
    const v1 = new THREE.Vector2().subVectors(p, prev).normalize();
    const n1 = new THREE.Vector2(-v1.y, v1.x);
    const v2 = new THREE.Vector2().subVectors(next, p).normalize();
    const n2 = new THREE.Vector2(-v2.y, v2.x);
    const n = n1.add(n2).normalize();
    return p.clone().add(n.multiplyScalar(thickness));
  }

  const innerA = offsetPoint(A, D, B, frameThickness);
  const innerB = offsetPoint(B, A, C, frameThickness);
  const innerC = offsetPoint(C, B, D, frameThickness);
  const innerD = offsetPoint(D, C, A, frameThickness);

  const shapes = [
    // Bas
    [A, B, innerB, innerA],
    // Droite
    [B, C, innerC, innerB],
    // Haut
    [C, D, innerD, innerC],
    // Gauche
    [D, A, innerA, innerD]
  ];

  shapes.forEach(points => {
    const shape = new THREE.Shape(points);
    const geometry = new THREE.ShapeGeometry(shape);
    const mesh = new THREE.Mesh(geometry, frameMaterial);
    mesh.position.z = 0;
    frameGroup.add(mesh);
  });

  // Calcul du trapèze intérieur décalé de interiorGap
  const bottomWidthInner = bottomWidth - 2 * interiorGap;
  const topWidthInner = topWidth - 2 * interiorGap;
  const halfBottomInner = bottomWidthInner / 2;
  const halfTopInner = topWidthInner / 2;
  const halfHeightInner = halfHeight - interiorGap;
  const A2 = new THREE.Vector2(-halfBottomInner, -halfHeightInner);
  const B2 = new THREE.Vector2(halfBottomInner, -halfHeightInner);
  const C2 = new THREE.Vector2(halfTopInner, halfHeightInner);
  const D2 = new THREE.Vector2(-halfTopInner, halfHeightInner);

  // On applique le même offset pour l'épaisseur du cadre intérieur
  const innerA2 = offsetPoint(A2, D2, B2, frameThickness / 2);
  const innerB2 = offsetPoint(B2, A2, C2, frameThickness / 2);
  const innerC2 = offsetPoint(C2, B2, D2, frameThickness / 2);
  const innerD2 = offsetPoint(D2, C2, A2, frameThickness / 2);
  // Ajout du cadre intérieur si ouvrant non fixe
  if (openingDirection !== OpeningDirection.Fixed) {
    const shapesInner = [
      [A2, B2, innerB2, innerA2],
      [B2, C2, innerC2, innerB2],
      [C2, D2, innerD2, innerC2],
      [D2, A2, innerA2, innerD2]
    ];
    shapesInner.forEach(points => {
      const shape = new THREE.Shape(points);
      const geometry = new THREE.ShapeGeometry(shape);
      const mesh = new THREE.Mesh(geometry, frameMaterial);
      mesh.position.z = 0.1; // Décalage léger pour éviter le z-fighting
      frameGroup.add(mesh);
    });
  }

  const glassShape = new THREE.Shape([innerA, innerB, innerC, innerD]);
  const glassGeometry = new THREE.ShapeGeometry(glassShape);
  const glassMaterial = new THREE.ShaderMaterial(GLASS);
  const glass = new THREE.Mesh(glassGeometry, glassMaterial);
  glass.position.z = 0.01;
  frameGroup.add(glass);

  buildTrapezoidOpening(
    [innerA2, innerB2, innerC2, innerD2],
    openingDirection,
    frameGroup
  );

  buildTrapezoidGlazingBars(
    [innerA, innerB, innerC, innerD],
    horGlazingBarsNumber,
    verGlazingBarsNumber,
    frameGroup
  );

  return frameGroup;
}

function buildTrapezoidOpening(
  inner: THREE.Vector2[],
  openingDirection: OpeningDirection,
  frameGroup: THREE.Group
) {
  // Pour le trapèze, on relie les coins extérieurs selon le sens d'ouverture
  const dashMaterial = new THREE.LineDashedMaterial({ color: LINE_COLOR, dashSize: 0.05, gapSize: 0.05, linewidth: 1 });
  let lines: [THREE.Vector2, THREE.Vector2][] = [];
  switch (openingDirection) {
    case OpeningDirection.Left:
      const rightEdgeCenter = new THREE.Vector2(
        (inner[1].x + inner[2].x) / 2,
        (inner[1].y + inner[2].y) / 2
      );
      lines = [
        [inner[0], rightEdgeCenter],
        [inner[3], rightEdgeCenter]
      ];
      break;
    case OpeningDirection.Right:
      const leftEdgeCenter = new THREE.Vector2(
        (inner[0].x + inner[3].x) / 2,
        (inner[0].y + inner[3].y) / 2
      );
      lines = [
        [inner[1], leftEdgeCenter],
        [inner[2], leftEdgeCenter]
      ];
      break;
    case OpeningDirection.Up:
      const topEdgeCenter = new THREE.Vector2(
        (inner[2].x + inner[3].x) / 2,
        (inner[2].y + inner[3].y) / 2
      );
      lines = [
        [topEdgeCenter, inner[0]],
        [topEdgeCenter, inner[1]]
      ];
      break;
    case OpeningDirection.Down:
      const bottomEdgeCenter = new THREE.Vector2(
        (inner[0].x + inner[1].x) / 2,
        (inner[0].y + inner[1].y) / 2
      );
      lines = [
        [bottomEdgeCenter, inner[2]],
        [bottomEdgeCenter, inner[3]]
      ];
      break;
    case OpeningDirection.Oscillating:
      const topEdgeCenterOsc = new THREE.Vector2(
        (inner[2].x + inner[3].x) / 2,
        (inner[2].y + inner[3].y) / 2
      );
      const rightEdgeCenterOsc = new THREE.Vector2(
        (inner[1].x + inner[2].x) / 2,
        (inner[1].y + inner[2].y) / 2
      );
      lines = [
        [topEdgeCenterOsc, inner[0]],
        [topEdgeCenterOsc, inner[1]],
        [rightEdgeCenterOsc, inner[0]],
        [rightEdgeCenterOsc, inner[3]]
      ];
      break;
    default:
      return; 
  }
  lines.forEach(([start, end]) => {
    const geometry = new THREE.BufferGeometry().setFromPoints([
      new THREE.Vector3(start.x, start.y, 0.03),
      new THREE.Vector3(end.x, end.y, 0.03)
    ]);
    const line = new THREE.Line(geometry, dashMaterial);
    line.computeLineDistances();
    frameGroup.add(line);
  });
}

function buildTrapezoidGlazingBars(
  inner: THREE.Vector2[],
  horGlazingBarsNumber: number,
  verGlazingBarsNumber: number,
  frameGroup: THREE.Group
) {
  const dashMaterial = new THREE.LineBasicMaterial({ color: LINE_COLOR, linewidth: 1 });
  // Petits bois horizontaux (interpolation entre les côtés gauches et droits)
  if (horGlazingBarsNumber > 0) {
    for (let i = 1; i <= horGlazingBarsNumber; i++) {
      const t = i / (horGlazingBarsNumber + 1);
      const left = inner[0].clone().lerp(inner[3], t);
      const right = inner[1].clone().lerp(inner[2], t);
      const geometry = new THREE.BufferGeometry().setFromPoints([
        new THREE.Vector3(left.x, left.y, 0.02),
        new THREE.Vector3(right.x, right.y, 0.02)
      ]);
      const line = new THREE.Line(geometry, dashMaterial);
      line.computeLineDistances();
      frameGroup.add(line);
    }
  }
  // Petits bois verticaux (interpolation entre haut et bas)
  if (verGlazingBarsNumber > 0) {
    for (let i = 1; i <= verGlazingBarsNumber; i++) {
      const t = i / (verGlazingBarsNumber + 1);
      const bottom = inner[0].clone().lerp(inner[1], t);
      const top = inner[3].clone().lerp(inner[2], t);
      const geometry = new THREE.BufferGeometry().setFromPoints([
        new THREE.Vector3(bottom.x, bottom.y, 0.02),
        new THREE.Vector3(top.x, top.y, 0.02)
      ]);
      const line = new THREE.Line(geometry, dashMaterial);
      line.computeLineDistances();
      frameGroup.add(line);
    }
  }
}
