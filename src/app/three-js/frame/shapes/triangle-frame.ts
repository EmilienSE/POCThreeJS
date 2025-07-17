import * as THREE from 'three';
import { OpeningDirection } from '../../../utils/opening-direction.enum';
import { GLASS, LINE_COLOR } from '../../../utils/consts';

function getTriangleVertices(width: number, height: number): THREE.Vector2[] {
  const bottomY = -height / 2;
  const halfWidth = width / 2;

  const leftX = -halfWidth;
  const rightX = halfWidth;
  const leftYTop = bottomY + height;

    const p1 = new THREE.Vector2(leftX, bottomY); 
    const p2 = new THREE.Vector2(leftX, leftYTop);
    const p3 = new THREE.Vector2(rightX, bottomY);
  return [p1, p2, p3];
}

function offsetTriangle(vertices: THREE.Vector2[], thickness: number): THREE.Vector2[] {
  // On va créer des lignes parallèles aux côtés du triangle, décalées vers l'intérieur
  function getOffsetLine(p1: THREE.Vector2, p2: THREE.Vector2, offset: number): [THREE.Vector2, THREE.Vector2] {
    const dir = new THREE.Vector2().subVectors(p2, p1).normalize();
    const normal = new THREE.Vector2(-dir.y, dir.x);
    const offsetP1 = p1.clone().add(normal.clone().multiplyScalar(offset));
    const offsetP2 = p2.clone().add(normal.clone().multiplyScalar(offset));
    return [offsetP1, offsetP2];
  }

  // Obtenir les 3 côtés décalés
  const [p0, p1, p2] = vertices;
  const [a1, a2] = getOffsetLine(p0, p1, -thickness);
  const [b1, b2] = getOffsetLine(p1, p2, -thickness);
  const [c1, c2] = getOffsetLine(p2, p0, -thickness);

  // Calculer les intersections pour retrouver les nouveaux sommets du triangle intérieur
  function intersect(p1: THREE.Vector2, p2: THREE.Vector2, p3: THREE.Vector2, p4: THREE.Vector2): THREE.Vector2 {
    const a1 = p2.y - p1.y;
    const b1 = p1.x - p2.x;
    const c1 = a1 * p1.x + b1 * p1.y;

    const a2 = p4.y - p3.y;
    const b2 = p3.x - p4.x;
    const c2 = a2 * p3.x + b2 * p3.y;

    const denominator = a1 * b2 - a2 * b1;

    if (denominator === 0) {
      return p1.clone(); // Parallel lines, fallback
    }

    const x = (b2 * c1 - b1 * c2) / denominator;
    const y = (a1 * c2 - a2 * c1) / denominator;

    return new THREE.Vector2(x, y);
  }

  const i0 = intersect(a1, a2, c1, c2); // sommet entre côté 0-1 et 2-0
  const i1 = intersect(a1, a2, b1, b2); // sommet entre côté 0-1 et 1-2
  const i2 = intersect(b1, b2, c1, c2); // sommet entre côté 1-2 et 2-0

  return [i0, i1, i2];
}

export function createTriangleFrame(
  frameWidth: number,
  frameHeight: number,
  frameThickness: number,
  interiorGap: number,
  openingDirection: OpeningDirection,
  horGlazingBarsNumber: number = 0,
  verGlazingBarsNumber: number = 0,
  stileNb: number = 0,
  railNb: number = 0
): THREE.Group {
  const frameGroup = new THREE.Group();
  const frameMaterial = new THREE.MeshBasicMaterial({ color: 0x000000 });

    // Sommets extérieurs
  const outer = getTriangleVertices(frameWidth, frameHeight);
  // Sommets intérieurs
  const inner = offsetTriangle(outer, frameThickness);

  // Création du cadre intérieur
  const innerFrame = offsetTriangle(inner, interiorGap);

  // Création d'un seul shape avec trou
  const frameShape = new THREE.Shape(outer);
  frameShape.holes.push(new THREE.Path(inner.slice().reverse())); // inversion !

  const frameGeometry = new THREE.ShapeGeometry(frameShape);
  const frameMesh = new THREE.Mesh(frameGeometry, frameMaterial);
  frameGroup.add(frameMesh);

  // Ajout de la vitre
  const glassMaterial = GLASS;
  const glassShape = new THREE.Shape(inner);
  const glassGeometry = new THREE.ShapeGeometry(glassShape);
  const glass = new THREE.Mesh(glassGeometry, glassMaterial);
  glass.position.z = 0.00;
  frameGroup.add(glass);

  // Ajout des traverses horizontales
  if (railNb > 0) {
    const railMaterial = new THREE.LineBasicMaterial({ color: 0x000000 });
    const [A, B, C] = inner; // A = bas-gauche, B = haut, C = bas-droit
    for (let i = 1; i <= railNb; i++) {
      const t = i / (railNb + 1);
      // Interpolation entre les côtés gauche (A-B) et droit (C-B)
      const leftPoint = A.clone().lerp(B, t);
      const rightPoint = C.clone().lerp(B, t);
      const geometry = new THREE.BufferGeometry().setFromPoints([
        new THREE.Vector3(leftPoint.x, leftPoint.y, 0.05),
        new THREE.Vector3(rightPoint.x, rightPoint.y, 0.05)
      ]);
      const line = new THREE.Line(geometry, railMaterial);
      frameGroup.add(line);
    }
  }

  // Ajout des montants verticaux
    if (stileNb > 0) {
    const montantMaterial = new THREE.LineBasicMaterial({ color: 0x000000 });
    const [p1, p2, p3] = inner; // p1: bas gauche, p2: sommet, p3: bas droit

    for (let i = 1; i <= stileNb; i++) {
      const t = i / (stileNb + 1);
      const x = THREE.MathUtils.lerp(p1.x, p3.x, t);
      const yBottom = p1.y;

      // Intersection avec l’hypoténuse (p2 → p3)
      const m = (p3.y - p2.y) / (p3.x - p2.x);
      const yTop = m * (x - p2.x) + p2.y;

      const geometry = new THREE.BufferGeometry().setFromPoints([
        new THREE.Vector3(x, yBottom, 0.05),
        new THREE.Vector3(x, yTop, 0.05)
      ]);
      const line = new THREE.Line(geometry, montantMaterial);
      frameGroup.add(line);
    }
  }
  if(openingDirection !== OpeningDirection.Fixed) {
    buildOpening(
      innerFrame,
      openingDirection,
      frameGroup,
      frameHeight
    );
  }

  return frameGroup;
}

function buildOpening(
  inner: THREE.Vector2[],
  openingDirection: OpeningDirection,
  frameGroup: THREE.Group,
  frameHeight: number
) {
  const dashMaterial = new THREE.LineDashedMaterial({ color: LINE_COLOR, dashSize: 0.05, gapSize: 0.05 });
  const solidMaterial = new THREE.LineBasicMaterial({ color: 0x000000 });

  const [A, B, C] = inner;

  const border1 = new THREE.BufferGeometry().setFromPoints([
    new THREE.Vector2(A.x, A.y),
    new THREE.Vector2(B.x, B.y)
  ]);
  const border2 = new THREE.BufferGeometry().setFromPoints([
    new THREE.Vector2(B.x, B.y),
    new THREE.Vector2(C.x, C.y)
  ]);
  const border3 = new THREE.BufferGeometry().setFromPoints([
    new THREE.Vector2(C.x, C.y),
    new THREE.Vector2(A.x, A.y)
  ]);
  const b1 = new THREE.Line(border1, solidMaterial);
  const b2 = new THREE.Line(border2, solidMaterial);
  const b3 = new THREE.Line(border3, solidMaterial);
  b1.computeLineDistances();
  b2.computeLineDistances();
  b3.computeLineDistances();
  frameGroup.add(b1, b2, b3);

  switch (openingDirection) {
    case OpeningDirection.Left: {
      const diag1 = new THREE.BufferGeometry().setFromPoints([
        new THREE.Vector2(
          B.x + 0.25 * (C.x - B.x),
          B.y + 0.25 * (C.y - B.y)
        ),
        new THREE.Vector2(
          (A.x + B.x) / 2, 
          (A.y + B.y) / 2
        )
      ]);
      const diag2 = new THREE.BufferGeometry().setFromPoints([
        new THREE.Vector2(
          (A.x + B.x) / 2, 
          (A.y + B.y) / 2
        ),
        new THREE.Vector2(
          C.x, 
          C.y
        )
      ]);
      const l1 = new THREE.Line(diag1, dashMaterial);
      const l2 = new THREE.Line(diag2, dashMaterial);
      l1.computeLineDistances();
      l2.computeLineDistances();
      frameGroup.add(l1, l2);
      break;
    }
    case OpeningDirection.Right: {
      const diag1 = new THREE.BufferGeometry().setFromPoints([
        new THREE.Vector2(
          (B.x + C.x) / 2, 
          (B.y + C.y) / 2
        ),
        new THREE.Vector2(
          B.x + 0.25 * (A.x - B.x),
          B.y + 0.25 * (A.y - B.y)
        )
      ]);
      const diag2 = new THREE.BufferGeometry().setFromPoints([
        new THREE.Vector2(
          (B.x + C.x) / 2, 
          (B.y + C.y) / 2
        ),
        new THREE.Vector2(
          A.x, 
          A.y
        )
      ]);
      const l1 = new THREE.Line(diag1, dashMaterial);
      const l2 = new THREE.Line(diag2, dashMaterial);
      l1.computeLineDistances();
      l2.computeLineDistances();
      frameGroup.add(l1, l2);
      break;
    }
    case OpeningDirection.Up: {
      const diag1 = new THREE.BufferGeometry().setFromPoints([
        new THREE.Vector2(
          A.x + 0.2 * (C.x - A.x),
          A.y + 0.2 * (C.y - A.y)
        ),
        new THREE.Vector2(
          (B.x + C.x) / 2, 
          (B.y + C.y) / 2
        )
      ]);
      const diag2 = new THREE.BufferGeometry().setFromPoints([
        new THREE.Vector2(
          (B.x + C.x) / 2, 
          (B.y + C.y) / 2
        ),
        new THREE.Vector2(
          A.x + 0.8 * (C.x - A.x),
          A.y + 0.8 * (C.y - A.y)
        )
      ]);
      const l1 = new THREE.Line(diag1, dashMaterial);
      const l2 = new THREE.Line(diag2, dashMaterial);
      l1.computeLineDistances();
      l2.computeLineDistances();
      frameGroup.add(l1, l2);
      break;
    }
    default:
      return;
  }
}

