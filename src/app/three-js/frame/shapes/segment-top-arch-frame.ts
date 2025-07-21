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
  stileNb: number = 0,
  railNb: number = 0
): THREE.Group {
  const frameGroup = new THREE.Group();

  // Angles fixes
  const startAngle = Math.PI / 3;
  const endAngle = Math.PI - startAngle;

  const outerRadiusX = frameWidth - frameThickness;
  const outerRadiusY = frameHeight;

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

  const shapeGeometry = new THREE.ShapeGeometry(outerShape, 64);
  const archMesh = new THREE.Mesh(shapeGeometry, frameMaterial);
  archMesh.position.y = -frameHeight / 2;
  frameGroup.add(archMesh);

  if (openingDirection !== OpeningDirection.Fixed) {
    const points: THREE.Vector3[] = [];
    const innerRadiusX = outerRadiusX - interiorGap;
    const innerRadiusY = outerRadiusY - interiorGap;
    const innerStartAngle = startAngle + frameThickness / 2;
    const innerEndAngle = endAngle - frameThickness / 2;

    for (let i = 0; i <= 64; i++) {
      const t = i / 64;
      const angle = innerStartAngle + (innerEndAngle - innerStartAngle) * t;
      const x = innerRadiusX * Math.cos(angle);
      const y = innerRadiusY * Math.sin(angle);
      points.push(new THREE.Vector3(x, y, 0.1));
    }

    const curve = new THREE.CatmullRomCurve3(points);
    const tubeGeometry = new THREE.TubeGeometry(curve, 64, frameThickness / 2, 16, false);
    const tubeMaterial = new THREE.MeshBasicMaterial({ color: 0x000000 });
    const tube = new THREE.Mesh(tubeGeometry, tubeMaterial);
    tube.position.y = -frameHeight / 2;

    const bottomFrameWidth = frameWidth - interiorGap * 2 + frameThickness;
    const innerBottomFrame = new THREE.Mesh(
      new THREE.PlaneGeometry(bottomFrameWidth, frameThickness),
      frameMaterial
    );
    innerBottomFrame.position.set(0, -frameHeight / 2 + frameThickness / 2 + interiorGap, 0.02);

    const verticalFrameHeight = tubeGeometry.parameters.path.getPoint(0).y - interiorGap;
    const innerLeftFrame = new THREE.Mesh(
      new THREE.PlaneGeometry(frameThickness, verticalFrameHeight),
      frameMaterial
    );
    innerLeftFrame.position.set(-frameWidth / 2 + interiorGap, -frameHeight / 2 + interiorGap + verticalFrameHeight / 2 + frameThickness / 2, 0.02);

    const innerRightFrame = new THREE.Mesh(
      new THREE.PlaneGeometry(frameThickness, verticalFrameHeight),
      frameMaterial
    );
    innerRightFrame.position.set(frameWidth / 2 - interiorGap, -frameHeight / 2 + interiorGap + verticalFrameHeight / 2 + frameThickness / 2, 0.02);

    frameGroup.add(tube, innerBottomFrame, innerLeftFrame, innerRightFrame);
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

  buildBars(
    frameWidth,
    frameHeight,
    frameThickness,
    horGlazingBarsNumber,
    verGlazingBarsNumber,
    stileNb,
    railNb,
    frameGroup,
    startAngle,
    endAngle
  )

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
  const spread = (endAngle - startAngle) / 2;
  const angleConverge = (startAngle + endAngle) / 2;
  const angle1 = angleConverge - spread;
  const angle2 = angleConverge + spread;

  const baseY = -rInnerY / 1000 + interiorGap;
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

function buildBars(
  frameWidth: number,
  frameHeight: number,
  frameThickness: number,
  horGlazingBarsNumber: number,
  verGlazingBarsNumber: number,
  stileNb: number,
  railNb: number,
  frameGroup: THREE.Group,
  startAngle: number,
  endAngle: number
) {
  const baseY = -frameHeight / 2;
  const usableWidth = frameWidth - 2 * frameThickness;
  const outerPoints = getSegmentTopArchPoints(
    frameWidth - frameThickness,
    frameHeight,
    startAngle,
    endAngle
  );
  const yMax = Math.max(...outerPoints.map(p => p.y));

  const BAR_Z = 0.05;
  const GLAZING_Z = 0.04;

  const defaultMaterial = new THREE.LineBasicMaterial({ color: 0x000000 });
  const glazingMaterial = new THREE.LineBasicMaterial({ color: LINE_COLOR });

  function findXAtY(yTarget: number) {
    let xLeft: number | null = null;
    let xRight: number | null = null;

    for (let i = 0; i < outerPoints.length - 1; i++) {
      const [p1, p2] = [outerPoints[i], outerPoints[i + 1]];
      if ((p1.y <= yTarget && yTarget <= p2.y) || (p2.y <= yTarget && yTarget <= p1.y)) {
        const ratio = (yTarget - p1.y) / (p2.y - p1.y);
        const x = p1.x + ratio * (p2.x - p1.x);
        if (x < 0) xLeft = x;
        else xRight = x;
        if (xLeft !== null && xRight !== null) break;
      }
    }

    if (xLeft === null) xLeft = -usableWidth / 2;
    if (xRight === null) xRight = usableWidth / 2;

    return { xLeft, xRight };
  }

  function findYAtX(xTarget: number): number | null {
    for (let i = 0; i < outerPoints.length - 1; i++) {
      const [p1, p2] = [outerPoints[i], outerPoints[i + 1]];
      if ((p1.x <= xTarget && xTarget <= p2.x) || (p2.x <= xTarget && xTarget <= p1.x)) {
        const ratio = (xTarget - p1.x) / (p2.x - p1.x);
        return p1.y + ratio * (p2.y - p1.y);
      }
    }
    return null;
  }

  function addHorizontalBars(count: number, material: THREE.Material, z: number) {
    for (let i = 1; i <= count; i++) {
      const t = i / (count + 1);
      const yLocal = t * yMax;
      const yGlobal = baseY + yLocal;
      const { xLeft, xRight } = findXAtY(yLocal);

      const geometry = new THREE.BufferGeometry().setFromPoints([
        new THREE.Vector3(xLeft, yGlobal, z),
        new THREE.Vector3(xRight, yGlobal, z),
      ]);
      frameGroup.add(new THREE.Line(geometry, material));
    }
  }

  function addVerticalBars(count: number, material: THREE.Material, z: number) {
    for (let i = 1; i <= count; i++) {
      const t = i / (count + 1);
      const x = -usableWidth / 2 + t * usableWidth;
      const yTop = findYAtX(x);
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

  if (railNb > 0) addHorizontalBars(railNb, defaultMaterial, BAR_Z);
  if (stileNb > 0) addVerticalBars(stileNb, defaultMaterial, BAR_Z);
  if (horGlazingBarsNumber > 0) addHorizontalBars(horGlazingBarsNumber, glazingMaterial, GLAZING_Z);
  if (verGlazingBarsNumber > 0) addVerticalBars(verGlazingBarsNumber, glazingMaterial, GLAZING_Z);

  function getSegmentTopArchPoints(rx: number, ry: number, start: number, end: number): THREE.Vector2[] {
    const points: THREE.Vector2[] = [];
    for (let t = 0; t <= 64; t++) {
      const angle = start + (end - start) * (t / 64);
      points.push(new THREE.Vector2(rx * Math.cos(angle), ry * Math.sin(angle)));
    }
    return points;
  }
}
