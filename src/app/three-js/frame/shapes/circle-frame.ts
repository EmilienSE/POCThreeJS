import * as THREE from 'three';
import { OpeningDirection } from '../../../utils/opening-direction.enum';
import { GLASS } from '../../../utils/consts';

export function createCircleFrame(
  frameWidth: number,
  frameHeight: number,
  frameThickness: number,
  interiorGap: number,
  openingDirection: OpeningDirection,
  horGlazingBarsNumber: number = 0,
  verGlazingBarsNumber: number = 0,
): THREE.Group {
  const frameGroup = new THREE.Group();
  // Rayons pour ellipse
  const outerRadiusX = frameWidth / 2 - frameThickness;
  const outerRadiusY = frameHeight / 2 - frameThickness;
  const innerRadiusX = frameWidth / 2 - frameThickness - interiorGap;
  const innerRadiusY = frameHeight / 2 - frameThickness - interiorGap;
  // Cadre extérieur (ellipse)
  const frameMaterial = new THREE.MeshBasicMaterial({ color: 0x000000 });
  const outerGeometry = new THREE.RingGeometry(1 - frameThickness / outerRadiusX, 1, 64);
  const outerFrame = new THREE.Mesh(outerGeometry, frameMaterial);
  outerFrame.scale.set(outerRadiusX, outerRadiusY, 1);
  frameGroup.add(outerFrame);

  if (openingDirection !== OpeningDirection.Fixed) {
    // Cadre intérieur (ellipse)
    const innerGeometry = new THREE.RingGeometry(
      1 - frameThickness / innerRadiusX,
      1,
      64
    );
    const innerFrame = new THREE.Mesh(innerGeometry, frameMaterial);
    innerFrame.position.z = 0.1;
    innerFrame.scale.set(innerRadiusX, innerRadiusY, 1);
    frameGroup.add(innerFrame);
  }

  // Vitre
  buildGlass(
    outerRadiusX,
    outerRadiusY,
    frameThickness,
    frameGroup
  );

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
  buildGlazingBars(
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

function buildGlass(
  outerRadiusX: number,
  outerRadiusY: number,
  frameThickness: number,
  frameGroup: THREE.Group
) {
  // Vitre elliptique
  const glassMaterial = new THREE.ShaderMaterial(GLASS);
  const glass = new THREE.Mesh(
    new THREE.CircleGeometry(1, 64),
    glassMaterial
  );
  glass.position.set(0, 0, 0.01);
  glass.scale.set(outerRadiusX - frameThickness, outerRadiusY - frameThickness, 1);
  frameGroup.add(glass);
}

function buildOpening(
  frameWidth: number,
  frameHeight: number,
  frameThickness: number,
  interiorGap: number,
  openingDirection: OpeningDirection,
  frameGroup: THREE.Group
) {
  if (openingDirection === OpeningDirection.Fixed) return;
  const dashMaterial = new THREE.LineDashedMaterial({ color: 0x93807b, dashSize: 0.1, gapSize: 0.1, linewidth: 1 });
  const rInnerX = frameWidth / 2 - frameThickness - interiorGap;
  const rInnerY = frameHeight / 2 - frameThickness - interiorGap;
  let angleConverge = 0, angle1 = 0, angle2 = 0;
  const spread = Math.PI / 6;
  switch (openingDirection) {
    case OpeningDirection.Up:
      angleConverge = Math.PI * 1.5;
      angle1 = Math.PI * 0.5 - spread;
      angle2 = Math.PI * 0.5 + spread;
      break;
    case OpeningDirection.Down:
      angleConverge = Math.PI * 0.5;
      angle1 = Math.PI * 1.5 - spread;
      angle2 = Math.PI * 1.5 + spread;
      break;
    case OpeningDirection.Left:
      angleConverge = 0;
      angle1 = Math.PI - spread;
      angle2 = Math.PI + spread;
      break;
    case OpeningDirection.Right:
      angleConverge = Math.PI;
      angle1 = 0 - spread;
      angle2 = 0 + spread;
      break;
  }
  drawLines(angle1, angle2, angleConverge);

  function drawLines(a1: number, a2: number, aConv: number) {
    const start1 = new THREE.Vector3(rInnerX * Math.cos(a1), rInnerY * Math.sin(a1), 0.03);
    const start2 = new THREE.Vector3(rInnerX * Math.cos(a2), rInnerY * Math.sin(a2), 0.03);
    const converge = new THREE.Vector3(rInnerX * Math.cos(aConv), rInnerY * Math.sin(aConv), 0.03);
    const geo1 = new THREE.BufferGeometry().setFromPoints([start1, converge]);
    const geo2 = new THREE.BufferGeometry().setFromPoints([start2, converge]);
    [geo1, geo2].forEach(geo => {
      const line = new THREE.Line(geo, dashMaterial);
      line.computeLineDistances();
      frameGroup.add(line);
    });
  }
}

function buildGlazingBars(
  frameWidth: number,
  frameHeight: number,
  frameThickness: number,
  interiorGap: number,
  horGlazingBarsNumber: number,
  verGlazingBarsNumber: number,
  frameGroup: THREE.Group
) {
  const barRadiusX = frameWidth / 2 - frameThickness - interiorGap;
  const barRadiusY = frameHeight / 2 - frameThickness - interiorGap;
  const dashMaterial = new THREE.LineBasicMaterial({ color: 0x93807b, linewidth: 1 });
  if (horGlazingBarsNumber > 0) {
    for (let i = 1; i <= horGlazingBarsNumber; i++) {
      const angle = (i / (horGlazingBarsNumber + 1)) * Math.PI;
      const geometry = new THREE.BufferGeometry().setFromPoints([
        new THREE.Vector3(-barRadiusX * Math.cos(angle), -barRadiusY * Math.sin(angle), 0.02),
        new THREE.Vector3(barRadiusX * Math.cos(angle), barRadiusY * Math.sin(angle), 0.02)
      ]);
      const line = new THREE.Line(geometry, dashMaterial);
      line.computeLineDistances();
      frameGroup.add(line);
    }
  }
  if (verGlazingBarsNumber > 0) {
    for (let i = 1; i <= verGlazingBarsNumber; i++) {
      const angle = (i / (verGlazingBarsNumber + 1)) * Math.PI + Math.PI / 2;
      const geometry = new THREE.BufferGeometry().setFromPoints([
        new THREE.Vector3(barRadiusX * Math.cos(angle), barRadiusY * Math.sin(angle), 0.02),
        new THREE.Vector3(-barRadiusX * Math.cos(angle), -barRadiusY * Math.sin(angle), 0.02)
      ]);
      const line = new THREE.Line(geometry, dashMaterial);
      line.computeLineDistances();
      frameGroup.add(line);
    }
  }
}
