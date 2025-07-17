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

  if (railNb > 0) {
    const railMaterial = new THREE.LineBasicMaterial({ color: 0x000000 });
    const baseY = -frameHeight / 2;
    const outerPoints = getSegmentTopArchPoints(
      frameWidth - frameThickness,
      frameHeight,
      startAngle,
      endAngle
    );

    const yMax = Math.max(...outerPoints.map(p => p.y));

    function findXAtY(yTarget: number) {
      let xLeft: number | null = null;
      let xRight: number | null = null;

      for (let i = 0; i < outerPoints.length - 1; i++) {
        const p1 = outerPoints[i];
        const p2 = outerPoints[i + 1];

        if ((p1.y <= yTarget && yTarget <= p2.y) || (p2.y <= yTarget && yTarget <= p1.y)) {
          const ratio = (yTarget - p1.y) / (p2.y - p1.y);
          const xAtY = p1.x + ratio * (p2.x - p1.x);

          if (xAtY < 0) xLeft = xAtY;
          else xRight = xAtY;

          if (xLeft !== null && xRight !== null) break;
        }
      }

      if (xLeft === null) xLeft = - (frameWidth / 2 - frameThickness);
      if (xRight === null) xRight = (frameWidth / 2 - frameThickness);

      return { xLeft, xRight };
    }

    for (let i = 1; i <= railNb; i++) {
      const t = i / (railNb + 1);
      const yLocal = t * yMax;
      const yGlobal = baseY + yLocal;

      const { xLeft, xRight } = findXAtY(yLocal);

      const geometry = new THREE.BufferGeometry().setFromPoints([
        new THREE.Vector3(xLeft, yGlobal, 0.05),
        new THREE.Vector3(xRight, yGlobal, 0.05),
      ]);
      const line = new THREE.Line(geometry, railMaterial);
      frameGroup.add(line);
    }
  }

  // Ajout des montants internes (interpolation entre la base et la courbe)
  if (stileNb > 0) {
    const stileMaterial = new THREE.LineBasicMaterial({ color: 0x000000 });
    const baseY = -frameHeight / 2;
    const usableWidth = frameWidth - 2 * frameThickness;

    const outerPoints = getSegmentTopArchPoints(
      frameWidth - frameThickness,
      frameHeight,
      startAngle,
      endAngle
    );

    for (let i = 1; i <= stileNb; i++) {
      const t = i / (stileNb + 1);
      const xBase = -usableWidth / 2 + t * usableWidth;

      let yTop: number | null = null;
      for (let j = 0; j < outerPoints.length - 1; j++) {
        const p1 = outerPoints[j];
        const p2 = outerPoints[j + 1];

        if ((p1.x <= xBase && xBase <= p2.x) || (p2.x <= xBase && xBase <= p1.x)) {
          const ratio = (xBase - p1.x) / (p2.x - p1.x);
          yTop = p1.y + ratio * (p2.y - p1.y);
          break;
        }
      }

      if (yTop !== null) {
        const geometry = new THREE.BufferGeometry().setFromPoints([
          new THREE.Vector3(xBase, baseY, 0.05),
          new THREE.Vector3(xBase, baseY + yTop, 0.05),
        ]);
        const line = new THREE.Line(geometry, stileMaterial);
        frameGroup.add(line);
      } else {
        console.warn(`xBase=${xBase.toFixed(2)} pas trouvé sur la courbe`);
      }
    }
  }

  function getSegmentTopArchPoints(rx: number, ry: number, startAngle: number, endAngle: number): THREE.Vector2[] {
    const points: THREE.Vector2[] = [];
    for (let t = 0; t <= 64; t++) {
      const angle = startAngle + (endAngle - startAngle) * (t / 64);
      points.push(new THREE.Vector2(
        rx * Math.cos(angle),
        ry * Math.sin(angle)
      ));
    }
    return points;
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
