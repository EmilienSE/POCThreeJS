import * as THREE from 'three';
import { OpeningDirection } from '../../../utils/opening-direction.enum';
import { GLASS, LINE_COLOR } from '../../../utils/consts';

export function createBasketHandleArchFrame(
  frameWidth: number,
  frameHeight: number,
  frameThickness: number,
  interiorGap: number,
  openingDirection: OpeningDirection,
  horGlazingBarsNumber: number = 0,
  verGlazingBarsNumber: number = 0,
): THREE.Group {
  const frameGroup = new THREE.Group();

  const outerW = frameWidth / 2;
  const outerH = frameHeight;
  const innerW = outerW - interiorGap;
  const innerH = outerH - interiorGap;

  const frameMaterial = new THREE.MeshBasicMaterial({ color: 0x000000, side: THREE.DoubleSide });

  const bottomFrameWidth = frameWidth - 2 * frameThickness;
  const bottomFrame = new THREE.Mesh(
    new THREE.PlaneGeometry(bottomFrameWidth, frameThickness),
    frameMaterial
  );
  bottomFrame.position.set(0, frameThickness / 2, 0.02);
  bottomFrame.position.y = -frameHeight / 2;
  frameGroup.add(bottomFrame);

  const outerShape = new THREE.Shape();
  const outerPoints = getBasketHandlePoints(outerW, outerH);
  outerShape.moveTo(outerPoints[0].x, outerPoints[0].y);
  outerPoints.forEach(p => outerShape.lineTo(p.x, p.y));
  outerShape.lineTo(-outerW, 0);
  outerShape.closePath();

  const innerPoints = getBasketHandlePoints(innerW, innerH);
  const holePath = new THREE.Path();
  holePath.moveTo(innerPoints[0].x, innerPoints[0].y);
  innerPoints.forEach(p => holePath.lineTo(p.x, p.y));
  holePath.lineTo(-innerW, 0);
  holePath.closePath();

  outerShape.holes.push(holePath);

  const geometry = new THREE.ShapeGeometry(outerShape, 64);
  const mesh = new THREE.Mesh(geometry, frameMaterial);
  // Correction : décalage du mesh principal vers le bas
  mesh.position.y = -frameHeight / 2;
  frameGroup.add(mesh);

  if (openingDirection !== OpeningDirection.Fixed) {
    const curvePoints = getBasketHandlePoints(innerW, innerH);
    const curve = new THREE.CatmullRomCurve3(curvePoints.map(p => new THREE.Vector3(p.x, p.y, 0.1)));
    const tubeGeometry = new THREE.TubeGeometry(curve, 64, frameThickness / 2, 16, false);
    const tubeMaterial = new THREE.MeshBasicMaterial({ color: 0x000000 });
    const tube = new THREE.Mesh(tubeGeometry, tubeMaterial);
    tube.position.y = -frameHeight / 2;
    frameGroup.add(tube);
  }

  buildGlassBasketHandle(outerW, outerH, frameThickness, frameGroup, frameHeight);

  if (openingDirection !== OpeningDirection.Fixed) {
    buildOpening(
      frameWidth,
      frameHeight,
      frameThickness,
      interiorGap,
      openingDirection,
      frameGroup
    );
  }

  // buildGlazingBarsHalfMoon(
  //   frameWidth,
  //   frameHeight,
  //   frameThickness,
  //   interiorGap,
  //   horGlazingBarsNumber,
  //   verGlazingBarsNumber,
  //   frameGroup
  // );

  return frameGroup;
}

function getBasketHandlePoints(rx: number, ry: number): THREE.Vector2[] {
  const points: THREE.Vector2[] = [];

  const startAngle = Math.PI; 
  const endAngle = 0;         
  const segments = 64;

  for (let i = 0; i <= segments; i++) {
    const t = i / segments;
    const angle = startAngle + t * (endAngle - startAngle);

    const x = rx * Math.cos(angle);
    const y = ry * Math.pow(Math.sin(angle), 0.8);
    points.push(new THREE.Vector2(x, y));
  }

  return points;
}

function buildGlassBasketHandle(
  outerRadiusX: number,
  outerRadiusY: number,
  frameThickness: number,
  frameGroup: THREE.Group,
  frameHeight: number
) {
  const glassMaterial = new THREE.ShaderMaterial(GLASS);
  const points = getBasketHandlePoints(outerRadiusX - frameThickness, outerRadiusY - frameThickness);
  const shape = new THREE.Shape();
  shape.moveTo(points[0].x, points[0].y);
  points.forEach(p => shape.lineTo(p.x, p.y));
  shape.lineTo(-outerRadiusX + frameThickness, 0);
  shape.closePath();

  const geometry = new THREE.ShapeGeometry(shape, 64);
  const mesh = new THREE.Mesh(geometry, glassMaterial);
  mesh.position.z = 0.01;
  mesh.position.y = -frameHeight / 2;
  frameGroup.add(mesh);
}
function buildOpening(
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

