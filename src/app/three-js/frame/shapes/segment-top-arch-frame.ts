import * as THREE from 'three';
import { OpeningDirection } from '../../../utils/opening-direction.enum';
import { GLASS, LINE_COLOR } from '../../../utils/consts';

export function createSegmentTopArchFrame(
  frameWidth: number,
  frameHeight: number,
  frameThickness: number,
  interiorGap: number,
  openingDirection: OpeningDirection,
  horGlazingBarsNumber: number = 0,
  verGlazingBarsNumber: number = 0,
): THREE.Group {
  const frameGroup = new THREE.Group();

  // Angles fixes
  const startAngle = Math.PI / 3;
  const endAngle = Math.PI - startAngle;

  const outerRadiusX = frameWidth - frameThickness;
  const outerRadiusY = frameHeight;
  const innerRadiusX = outerRadiusX - interiorGap;
  const innerRadiusY = outerRadiusY - interiorGap;

  const frameMaterial = new THREE.MeshBasicMaterial({ color: 0x000000, side: THREE.DoubleSide });

  const bottomFrameWidth = frameWidth - 2 * frameThickness;
  const bottomFrame = new THREE.Mesh(
    new THREE.PlaneGeometry(bottomFrameWidth, frameThickness),
    frameMaterial
  );
  bottomFrame.position.set(0, -frameHeight / 2 + frameThickness / 2, 0.02);
  frameGroup.add(bottomFrame);

  const outerShape = new THREE.Shape();
  outerShape.absellipse(0, 0, outerRadiusX, outerRadiusY, startAngle, endAngle, false);
  outerShape.lineTo(outerRadiusX * Math.cos(endAngle), 0);
  outerShape.lineTo(outerRadiusX * Math.cos(startAngle), 0);
  outerShape.closePath();

  const holePath = new THREE.Path();
  holePath.absellipse(0, 0, innerRadiusX, innerRadiusY, startAngle, endAngle, false);
  holePath.lineTo(innerRadiusX * Math.cos(endAngle), 0);
  holePath.lineTo(innerRadiusX * Math.cos(startAngle), 0);
  holePath.closePath();
  outerShape.holes.push(holePath);

  const shapeGeometry = new THREE.ShapeGeometry(outerShape, 64);
  const archMesh = new THREE.Mesh(shapeGeometry, frameMaterial);
  archMesh.position.y = -frameHeight / 2;
  frameGroup.add(archMesh);

  if (openingDirection !== OpeningDirection.Fixed) {
    const points = [];
    for (let i = 0; i <= 64; i++) {
      const t = i / 64;
      const angle = startAngle + (endAngle - startAngle) * t;
      const x = innerRadiusX * Math.cos(angle);
      const y = innerRadiusY * Math.sin(angle);
      points.push(new THREE.Vector3(x, y, 0.1));
    }

    const curve = new THREE.CatmullRomCurve3(points);
    const tubeGeometry = new THREE.TubeGeometry(curve, 64, frameThickness / 2, 16, false);
    const tubeMaterial = new THREE.MeshBasicMaterial({ color: 0x000000 });
    const tube = new THREE.Mesh(tubeGeometry, tubeMaterial);
    tube.position.y = -frameHeight / 2;
    frameGroup.add(tube);
  }

  buildGlassSegmentTopArch(
    outerRadiusX,
    outerRadiusY,
    frameThickness,
    frameGroup,
    frameHeight,
    startAngle,
    endAngle
  );

  if (openingDirection !== OpeningDirection.Fixed) {
    buildOpeningSegmentTopArch(
      frameWidth,
      frameHeight,
      frameThickness,
      interiorGap,
      openingDirection,
      frameGroup,
      startAngle,
      endAngle
    );
  }

  return frameGroup;
}

function buildGlassSegmentTopArch(
  outerRadiusX: number,
  outerRadiusY: number,
  frameThickness: number,
  frameGroup: THREE.Group,
  frameHeight: number,
  startAngle: number,
  endAngle: number
) {
  const glassMaterial = GLASS;
  const shrinkX = outerRadiusX - frameThickness;
  const shrinkY = outerRadiusY - frameThickness;

  const shape = new THREE.Shape();
  shape.absellipse(0, 0, shrinkX, shrinkY, startAngle, endAngle, false);
  shape.lineTo(shrinkX * Math.cos(endAngle), 0);
  shape.lineTo(shrinkX * Math.cos(startAngle), 0);
  shape.closePath();

  const geometry = new THREE.ShapeGeometry(shape, 64);
  const mesh = new THREE.Mesh(geometry, glassMaterial);
  mesh.position.z = 0.01;
  mesh.position.y = -frameHeight / 2;
  frameGroup.add(mesh);
}

function buildOpeningSegmentTopArch(
  frameWidth: number,
  frameHeight: number,
  frameThickness: number,
  interiorGap: number,
  openingDirection: OpeningDirection,
  frameGroup: THREE.Group,
  startAngle: number,
  endAngle: number
) {
  const dashMaterial = new THREE.LineDashedMaterial({
    color: LINE_COLOR,
    dashSize: 0.1,
    gapSize: 0.1,
    linewidth: 1
  });

  const rInnerX = frameWidth / 2 - frameThickness - interiorGap;
  const rInnerY = frameHeight - frameThickness - interiorGap;
  const spread = (endAngle - startAngle) / 6;
  const angleConverge = (startAngle + endAngle) / 2;
  const angle1 = angleConverge - spread;
  const angle2 = angleConverge + spread;

  const baseY = -rInnerY / 1000;
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
