import * as THREE from 'three';
import { OpeningDirection } from '../../../utils/opening-direction.enum';
import { GLASS, LINE_COLOR } from '../../../utils/consts';

export function createHalfMoonFrame(
  frameWidth: number,
  frameHeight: number,
  frameThickness: number,
  interiorGap: number,
  openingDirection: OpeningDirection,
  horGlazingBarsNumber: number = 0,
  verGlazingBarsNumber: number = 0,
  stileNb: number = 0,
  railNb: number = 0,
): THREE.Group {
  const frameGroup = new THREE.Group();

  const outerRadiusX = frameWidth / 2;
  const outerRadiusY = frameHeight - frameThickness;
  const innerRadiusX = outerRadiusX - interiorGap;
  const innerRadiusY = outerRadiusY - interiorGap;

  const frameMaterial = new THREE.MeshBasicMaterial({ color: 0x000000, side: THREE.DoubleSide });
  const bottomFrameWidth = frameWidth - 2 * frameThickness;
  const bottomFrame = new THREE.Mesh(
    new THREE.PlaneGeometry(bottomFrameWidth, frameThickness),
    new THREE.MeshBasicMaterial({ color: 0x000000 })
  );
  bottomFrame.position.set(0, frameThickness / 2, 0.02);
  bottomFrame.position.y = -frameHeight / 2;
  frameGroup.add(bottomFrame);

  // Forme demi-ellipse extérieure
  const outerShape = new THREE.Shape();
  outerShape.absellipse(0, 0, outerRadiusX, outerRadiusY, 0, Math.PI, false); // demi-cercle haut
  outerShape.lineTo(outerRadiusX, 0);
  outerShape.lineTo(-outerRadiusX, 0);
  outerShape.closePath();

  // Trou intérieur
  const holePath = new THREE.Path();
  holePath.absellipse(0, 0, innerRadiusX, innerRadiusY, 0, Math.PI, false);
  holePath.lineTo(innerRadiusX, 0);
  holePath.lineTo(-innerRadiusX, 0);
  holePath.closePath();

  outerShape.holes.push(holePath);

  const geometry = new THREE.ShapeGeometry(outerShape, 64);
  const mesh = new THREE.Mesh(geometry, frameMaterial);
  mesh.position.y = -frameHeight / 2;
  frameGroup.add(mesh);


  // Contour intérieur pour menuiserie ouvrante (épais avec TubeGeometry)
  if (openingDirection !== OpeningDirection.Fixed) {
    const rIntX = outerRadiusX - interiorGap;
    const rIntY = outerRadiusY - interiorGap;
    const points = [];
    for (let t = 0; t <= 64; t++) {
      const angle = Math.PI * (t / 64);
      points.push(new THREE.Vector3(
        rIntX * Math.cos(angle),
        rIntY * Math.sin(angle),
        0.1
      ));
    }
    const curve = new THREE.CatmullRomCurve3(points);
    const tubeGeometry = new THREE.TubeGeometry(curve, 64, frameThickness / 2, 16, false);
    const tubeMaterial = new THREE.MeshBasicMaterial({ color: 0x000000 });
    const tube = new THREE.Mesh(tubeGeometry, tubeMaterial);
    tube.position.y = -frameHeight / 2;
    frameGroup.add(tube);
  }

  // Vitre
  buildGlassHalfMoon(outerRadiusX, outerRadiusY, frameThickness, frameGroup, frameHeight);

  // Ouverture
  if (openingDirection !== OpeningDirection.Fixed) {
    buildOpeningHalfMoon(
      frameWidth,
      frameHeight,
      frameThickness,
      interiorGap,
      openingDirection,
      frameGroup
    );
  }

  // Petits bois
  buildBarsHalfMoon(
    frameWidth,
    frameHeight,
    frameThickness,
    interiorGap,
    stileNb,
    railNb,
    horGlazingBarsNumber,
    verGlazingBarsNumber,
    frameGroup
  );

  return frameGroup;
}

function buildGlassHalfMoon(
  outerRadiusX: number,
  outerRadiusY: number,
  frameThickness: number,
  frameGroup: THREE.Group,
  frameHeight: number
) {
  const glassMaterial = GLASS;

  const shape = new THREE.Shape();
  shape.absellipse(0, 0, outerRadiusX - frameThickness, outerRadiusY - frameThickness, 0, Math.PI, false);
  shape.lineTo(outerRadiusX - frameThickness, 0);
  shape.lineTo(-outerRadiusX + frameThickness, 0);
  shape.closePath();

  const geometry = new THREE.ShapeGeometry(shape, 64);
  const mesh = new THREE.Mesh(geometry, glassMaterial);
  mesh.position.z = 0.01;
  mesh.position.y = -frameHeight / 2;
  frameGroup.add(mesh);
}

function buildOpeningHalfMoon(
  frameWidth: number,
  frameHeight: number,
  frameThickness: number,
  interiorGap: number,
  openingDirection: OpeningDirection,
  frameGroup: THREE.Group
) {
  const dashMaterial = new THREE.LineDashedMaterial({ color: LINE_COLOR, dashSize: 0.1, gapSize: 0.1, linewidth: 1 });
  const rInnerX = frameWidth / 2 - frameThickness - interiorGap;
  const rInnerY = frameHeight - frameThickness - interiorGap;
  const spread = Math.PI / 6;

  let angleConverge = Math.PI / 2; // vers le haut
  let angle1 = angleConverge - spread;
  let angle2 = angleConverge + spread;

  switch (openingDirection) {
    case OpeningDirection.Up:
    case OpeningDirection.Left:
    case OpeningDirection.Right:
      case OpeningDirection.Down:
      break;
  }

  const baseY = -rInnerY/1000;
  const start1 = new THREE.Vector3(rInnerX * Math.cos(angle1), baseY, 0.03);
  const start2 = new THREE.Vector3(rInnerX * Math.cos(angle2), baseY, 0.03);

  const converge = new THREE.Vector3(rInnerX * Math.cos(angleConverge), rInnerY * Math.sin(angleConverge), 0.03);

  [start1, start2].forEach(start => {
    const geo = new THREE.BufferGeometry().setFromPoints([start, converge]);
    const line = new THREE.Line(geo, dashMaterial);
    line.computeLineDistances();
    line.position.y = -frameHeight / 2;
    frameGroup.add(line);
  });
}

function buildBarsHalfMoon(
  frameWidth: number,
  frameHeight: number,
  frameThickness: number,
  interiorGap: number,
  stileNb: number,
  railNb: number,
  horGlazingBarsNumber: number,
  verGlazingBarsNumber: number,
  frameGroup: THREE.Group
) {
  const baseY = -frameHeight / 2;
  const usableWidth = frameWidth - 2 * frameThickness;
  
  const BAR_Z = 0.05;
  const GLAZING_Z = 0.04; // petits bois en dessous

  function getHalfMoonPoints(rx: number, ry: number): THREE.Vector2[] {
    return Array.from({ length: 65 }, (_, t) => {
      const angle = Math.PI * (t / 64);
      return new THREE.Vector2(rx * Math.cos(angle), ry * Math.sin(angle));
    });
  }

  function findXAtY(points: THREE.Vector2[], yTarget: number): { xLeft: number; xRight: number } {
    let xLeft: number | null = null;
    let xRight: number | null = null;

    for (let i = 0; i < points.length - 1; i++) {
      const [p1, p2] = [points[i], points[i + 1]];
      if ((p1.y <= yTarget && yTarget <= p2.y) || (p2.y <= yTarget && yTarget <= p1.y)) {
        const ratio = (yTarget - p1.y) / (p2.y - p1.y);
        const xAtY = p1.x + ratio * (p2.x - p1.x);
        if (xAtY < 0) xLeft = xAtY;
        else xRight = xAtY;
        if (xLeft !== null && xRight !== null) break;
      }
    }

    const defaultX = frameWidth / 2 - frameThickness;
    return {
      xLeft: xLeft ?? -defaultX,
      xRight: xRight ?? defaultX,
    };
  }

  function findYAtX(points: THREE.Vector2[], xTarget: number): number | null {
    for (let i = 0; i < points.length - 1; i++) {
      const [p1, p2] = [points[i], points[i + 1]];
      if ((p1.x <= xTarget && xTarget <= p2.x) || (p2.x <= xTarget && xTarget <= p1.x)) {
        const ratio = (xTarget - p1.x) / (p2.x - p1.x);
        return p1.y + ratio * (p2.y - p1.y);
      }
    }
    return null;
  }

  function createHorizontalBars(count: number, points: THREE.Vector2[], material: THREE.Material, z: number) {
    const yMax = Math.max(...points.map(p => p.y));
    for (let i = 1; i <= count; i++) {
      const t = i / (count + 1);
      const yLocal = t * yMax;
      const yWorld = baseY + yLocal;
      const { xLeft, xRight } = findXAtY(points, yLocal);
      const geometry = new THREE.BufferGeometry().setFromPoints([
        new THREE.Vector3(xLeft, yWorld, z),
        new THREE.Vector3(xRight, yWorld, z),
      ]);
      frameGroup.add(new THREE.Line(geometry, material));
    }
  }

  function createVerticalBars(count: number, points: THREE.Vector2[], material: THREE.Material, z: number) {
    for (let i = 1; i <= count; i++) {
      const t = i / (count + 1);
      const x = -usableWidth / 2 + t * usableWidth;
      const yTop = findYAtX(points, x);
      if (yTop !== null) {
        const geometry = new THREE.BufferGeometry().setFromPoints([
          new THREE.Vector3(x, baseY, z),
          new THREE.Vector3(x, baseY + yTop, z),
        ]);
        frameGroup.add(new THREE.Line(geometry, material));
      } else {
        console.warn(`x=${x.toFixed(2)} not found on curve`);
      }
    }
  }

  const outerPoints = getHalfMoonPoints(
    frameWidth / 2 - frameThickness,
    frameHeight - frameThickness
  );

  if (railNb > 0) {
    createHorizontalBars(railNb, outerPoints, new THREE.LineBasicMaterial({ color: 0x000000 }), BAR_Z);
  }

  if (stileNb > 0) {
    createVerticalBars(stileNb, outerPoints, new THREE.LineBasicMaterial({ color: 0x000000 }), BAR_Z);
  }

  if (horGlazingBarsNumber > 0) {
    createHorizontalBars(horGlazingBarsNumber, outerPoints, new THREE.LineBasicMaterial({ color: LINE_COLOR }), GLAZING_Z);
  }

  if (verGlazingBarsNumber > 0) {
    createVerticalBars(verGlazingBarsNumber, outerPoints, new THREE.LineBasicMaterial({ color: LINE_COLOR }), GLAZING_Z);
  }
}
