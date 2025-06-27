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
  const frameRadius = Math.min(frameWidth, frameHeight) / 2 - frameThickness;
  // Cadre circulaire extérieur
  const frameMaterial = new THREE.MeshBasicMaterial({ color: 0x000000 });
  const outerGeometry = new THREE.RingGeometry(
    frameRadius - frameThickness,
    frameRadius,
    64
  );
  const outerFrame = new THREE.Mesh(outerGeometry, frameMaterial);
  frameGroup.add(outerFrame);

  if (openingDirection !== OpeningDirection.Fixed) {
    // Cadre circulaire intérieur (ouvrant)
    const innerGeometry = new THREE.RingGeometry(
      frameRadius - frameThickness - interiorGap,
      frameRadius - interiorGap,
      64
    );
    const innerFrame = new THREE.Mesh(innerGeometry, frameMaterial);
    innerFrame.position.z = 0.1;
    frameGroup.add(innerFrame);

    buildGlass(
      frameRadius,
      frameThickness,
      frameGroup
    );

    buildOpening(
      frameRadius,
      frameThickness,
      interiorGap,
      openingDirection,
      frameGroup
    );

    buildGlazingBars(
      frameRadius,
      frameThickness,
      interiorGap,
      horGlazingBarsNumber,
      verGlazingBarsNumber,
      frameGroup
    );
  } else {
    // Vitre pour fenêtre fixe
    buildGlass(
      frameRadius,
      frameThickness,
      frameGroup
    );
  }

  return frameGroup;
}

function buildGlass(
  frameRadius: number,
  frameThickness: number,
  frameGroup: THREE.Group
) {
  // Vitre circulaire
  const glassMaterial = new THREE.ShaderMaterial(GLASS);
  const glass = new THREE.Mesh(
    new THREE.CircleGeometry(frameRadius - frameThickness, 64),
    glassMaterial
  );
  glass.position.set(0, 0, 0.01);
  frameGroup.add(glass);
}

function buildOpening(
  frameRadius: number,
  frameThickness: number,
  interiorGap: number,
  openingDirection: OpeningDirection,
  frameGroup: THREE.Group
) {
  // Deux lignes pointillées à l'intérieur du innerFrame, convergence sur le bord opposé
  if (openingDirection === OpeningDirection.Fixed) return;
  const dashMaterial = new THREE.LineDashedMaterial({ color: 0x93807b, dashSize: 0.1, gapSize: 0.1, linewidth: 1 });
  const rInner = frameRadius - frameThickness - interiorGap;
  let angleConverge = 0, angle1 = 0, angle2 = 0;
  const spread = Math.PI / 6; // écart des lignes (30°)
  switch (openingDirection) {
    case OpeningDirection.Up:
      angleConverge = Math.PI * 1.5; // bas
      angle1 = Math.PI * 0.5 - spread; // haut gauche
      angle2 = Math.PI * 0.5 + spread; // haut droite
      break;
    case OpeningDirection.Down:
      angleConverge = Math.PI * 0.5; // haut
      angle1 = Math.PI * 1.5 - spread; // bas gauche
      angle2 = Math.PI * 1.5 + spread; // bas droite
      break;
    case OpeningDirection.Left:
      angleConverge = 0; // droite
      angle1 = Math.PI - spread; // gauche haut
      angle2 = Math.PI + spread; // gauche bas
      break;
    case OpeningDirection.Right:
      angleConverge = Math.PI; // gauche
      angle1 = 0 - spread; // droite haut
      angle2 = 0 + spread; // droite bas
      break;
  }
  drawLines(angle1, angle2, angleConverge);

  function drawLines(a1: number, a2: number, aConv: number) {
    // Les points de départ sont sur le innerFrame côté ouverture
    const start1 = new THREE.Vector3(rInner * Math.cos(a1), rInner * Math.sin(a1), 0.03);
    const start2 = new THREE.Vector3(rInner * Math.cos(a2), rInner * Math.sin(a2), 0.03);
    // Le point de convergence est sur le innerFrame, côté opposé
    const converge = new THREE.Vector3(rInner * Math.cos(aConv), rInner * Math.sin(aConv), 0.03);
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
  frameRadius: number,
  frameThickness: number,
  interiorGap: number,
  horGlazingBarsNumber: number,
  verGlazingBarsNumber: number,
  frameGroup: THREE.Group
) {
  const barRadius = frameRadius - frameThickness - interiorGap;
  const dashMaterial = new THREE.LineBasicMaterial({ color: 0x93807b, linewidth: 1 });
  // Petits bois radiaux (horizontaux)
  if (horGlazingBarsNumber > 0) {
    for (let i = 1; i <= horGlazingBarsNumber; i++) {
      const angle = (i / (horGlazingBarsNumber + 1)) * Math.PI;
      const geometry = new THREE.BufferGeometry().setFromPoints([
        new THREE.Vector3(-barRadius * Math.cos(angle), -barRadius * Math.sin(angle), 0.02),
        new THREE.Vector3(barRadius * Math.cos(angle), barRadius * Math.sin(angle), 0.02)
      ]);
      const line = new THREE.Line(geometry, dashMaterial);
      line.computeLineDistances();
      frameGroup.add(line);
    }
  }
  // Petits bois perpendiculaires (verticaux)
  if (verGlazingBarsNumber > 0) {
    for (let i = 1; i <= verGlazingBarsNumber; i++) {
      const angle = (i / (verGlazingBarsNumber + 1)) * Math.PI + Math.PI / 2;
      const geometry = new THREE.BufferGeometry().setFromPoints([
        new THREE.Vector3(barRadius * Math.cos(angle), barRadius * Math.sin(angle), 0.02),
        new THREE.Vector3(-barRadius * Math.cos(angle), -barRadius * Math.sin(angle), 0.02)
      ]);
      const line = new THREE.Line(geometry, dashMaterial);
      line.computeLineDistances();
      frameGroup.add(line);
    }
  }
}
