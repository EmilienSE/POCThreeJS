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
): THREE.Group {
  const frameGroup = new THREE.Group();

  const outerRadiusX = frameWidth / 2 - frameThickness;
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
    frameGroup.add(tube);
  }

  // Vitre
  buildGlassHalfMoon(outerRadiusX, outerRadiusY, frameThickness, frameGroup);

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
  buildGlazingBarsHalfMoon(
    frameWidth,
    frameHeight,
    frameThickness,
    interiorGap,
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
  frameGroup: THREE.Group
) {
  const glassMaterial = new THREE.ShaderMaterial(GLASS);

  const shape = new THREE.Shape();
  shape.absellipse(0, 0, outerRadiusX - frameThickness, outerRadiusY - frameThickness, 0, Math.PI, false);
  shape.lineTo(outerRadiusX - frameThickness, 0);
  shape.lineTo(-outerRadiusX + frameThickness, 0);
  shape.closePath();

  const geometry = new THREE.ShapeGeometry(shape, 64);
  const mesh = new THREE.Mesh(geometry, glassMaterial);
  mesh.position.z = 0.01;
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
    frameGroup.add(line);
  });
}

function buildGlazingBarsHalfMoon(
  frameWidth: number,
  frameHeight: number,
  frameThickness: number,
  interiorGap: number,
  horGlazingBarsNumber: number,
  verGlazingBarsNumber: number,
  frameGroup: THREE.Group
) {
  
}
