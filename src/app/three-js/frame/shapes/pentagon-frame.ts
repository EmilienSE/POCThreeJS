import * as THREE from 'three';
import { OpeningDirection } from '../../../utils/opening-direction.enum';
import { GLASS, LINE_COLOR } from '../../../utils/consts';

// Fonction utilitaire pour calculer les sommets d'un pentagone régulier centré
function getPentagonVertices(width: number, height: number, leftVerticalHeight: number): THREE.Vector2[] {
  const bottomY = -height / 2;
  const topY = height / 2;
  const halfWidth = width / 2;

  const leftX = -halfWidth;
  const rightX = halfWidth;

  const leftYTop = bottomY + leftVerticalHeight;

  const p1 = new THREE.Vector2(leftX, bottomY); 
  const p2 = new THREE.Vector2(rightX, bottomY);
  const p3 = new THREE.Vector2(rightX, 0);      
  const p4 = new THREE.Vector2(0, topY);        
  const p5 = new THREE.Vector2(leftX, leftYTop);

  return [p1, p2, p3, p4, p5];
}


export function createPentagonFrame(
  frameWidth: number,
  frameHeight: number,
  frameThickness: number,
  interiorGap: number,
  openingDirection: OpeningDirection,
  horGlazingBarsNumber: number = 0,
  verGlazingBarsNumber: number = 0,
  stileNb: number = 0,
  railNb: number = 0,
  lowHeight: number = 0
): THREE.Group {
  const frameGroup = new THREE.Group();
  const frameMaterial = new THREE.MeshBasicMaterial({ color: 0x000000 });

  // Sommets extérieurs du pentagone
  const outer = getPentagonVertices(frameWidth, frameHeight, lowHeight);
  // Sommets intérieurs (pour l'épaisseur du cadre)
  const inner = getPentagonVertices(frameWidth - 2 * frameThickness, frameHeight - 2 * frameThickness, lowHeight - 2 * frameThickness);

  // Création des 5 côtés du cadre
  for (let i = 0; i < 5; i++) {
    const next = (i + 1) % 5;
    const shape = new THREE.Shape([
      new THREE.Vector2(outer[i].x, outer[i].y),
      new THREE.Vector2(outer[next].x, outer[next].y),
      new THREE.Vector2(inner[next].x, inner[next].y),
      new THREE.Vector2(inner[i].x, inner[i].y),
    ]);
    const geometry = new THREE.ShapeGeometry(shape);
    const mesh = new THREE.Mesh(geometry, frameMaterial);
    frameGroup.add(mesh);
  }

  const interiorOuter = getPentagonVertices(frameWidth - interiorGap * 2, frameHeight - interiorGap * 2, lowHeight - interiorGap);
  const interiorInner = getPentagonVertices(frameWidth - 2 * frameThickness - interiorGap * 2, frameHeight - 2 * frameThickness - interiorGap * 2, lowHeight - 2 * frameThickness - interiorGap);
  if(openingDirection !== OpeningDirection.Fixed) {
    // Création du cadre intérieur
    for (let i = 0; i < 5; i++) {
      const next = (i + 1) % 5;
      const shape = new THREE.Shape([
        new THREE.Vector2(interiorOuter[i].x, interiorOuter[i].y),
        new THREE.Vector2(interiorOuter[next].x, interiorOuter[next].y),
        new THREE.Vector2(interiorInner[next].x, interiorInner[next].y),
        new THREE.Vector2(interiorInner[i].x, interiorInner[i].y),
      ]);
      const geometry = new THREE.ShapeGeometry(shape);
      const mesh = new THREE.Mesh(geometry, frameMaterial);
      mesh.position.z = 0.02; // Pour éviter le chevauchement avec la vitre
      frameGroup.add(mesh);
    }
  }

  // Ajout de la vitre
  const glassMaterial = GLASS;
  const glassShape = new THREE.Shape(inner);
  const glassGeometry = new THREE.ShapeGeometry(glassShape);
  const glass = new THREE.Mesh(glassGeometry, glassMaterial);
  glass.position.z = 0.01;
  frameGroup.add(glass);

  buildOpening(
    interiorInner,
    openingDirection,
    frameGroup
  );

  buildBars(
    outer,
    frameGroup,
    horGlazingBarsNumber,
    verGlazingBarsNumber,
    stileNb,
    railNb,
    frameThickness
  );

  return frameGroup;
}

function buildOpening(
  inner: THREE.Vector2[],
  openingDirection: OpeningDirection,
  frameGroup: THREE.Group
) {
  // Pour le trapèze, on relie les coins extérieurs selon le sens d'ouverture
  const dashMaterial = new THREE.LineDashedMaterial({ color: LINE_COLOR, dashSize: 0.05, gapSize: 0.05, linewidth: 1 });
  let lines: [THREE.Vector2, THREE.Vector2][] = [];
  const rightTopEdgeCenter = new THREE.Vector2(
    (inner[4].x + inner[0].x) / 2,
    (inner[4].y + inner[0].y) / 2
  );
  const leftTopEdgeCenter = new THREE.Vector2(
    (inner[1].x + inner[0].x) / 2,
    (inner[1].y + inner[0].y) / 2
  );
  const bottomEdgeCenter = new THREE.Vector2(
    (inner[3].x + inner[2].x) / 2,
    (inner[3].y + inner[2].y) / 2
  );
  const rightBottomEdgeCenter = new THREE.Vector2(
    (inner[3].x + inner[4].x) / 2,
    (inner[3].y + inner[4].y) / 2
  );
  switch (openingDirection) {
    case OpeningDirection.Left:
      const leftBottomEdgeCenter = new THREE.Vector2(
        (inner[1].x + inner[2].x) / 2,
        (inner[1].y + inner[2].y) / 2
      );
      lines = [
        [rightTopEdgeCenter, leftBottomEdgeCenter],
        [inner[3], leftBottomEdgeCenter]
      ];
      break;
    case OpeningDirection.Right:
      lines = [
        [leftTopEdgeCenter, rightBottomEdgeCenter],
        [inner[2], rightBottomEdgeCenter]
      ];
      break;
    case OpeningDirection.Down:
      lines = [
        [inner[2], inner[0]],
        [inner[0], inner[3]]
      ];
      break;
    case OpeningDirection.Up:
      lines = [
        [leftTopEdgeCenter, bottomEdgeCenter],
        [bottomEdgeCenter, rightTopEdgeCenter]
      ];
      break;
    case OpeningDirection.Oscillating:
      lines = [
        [inner[2], inner[0]],
        [inner[0], inner[3]],
        [leftTopEdgeCenter, rightBottomEdgeCenter],
        [inner[2], rightBottomEdgeCenter]
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

function buildBars(
  outer: THREE.Vector2[],
  frameGroup: THREE.Group,
  horGlazingBarsNumber: number,
  verGlazingBarsNumber: number,
  stileNb: number,
  railNb: number,
  frameThickness: number
) {
  const glazingBarMaterial = new THREE.LineBasicMaterial({ color: LINE_COLOR, linewidth: 1 });
  const barMaterial = new THREE.LineBasicMaterial({ color: 0x000000, linewidth: frameThickness });

  const [p1, p2, p3, p4, p5] = outer;
  const yMin = Math.min(...outer.map(v => v.y));
  const yMax = Math.max(...outer.map(v => v.y));
  const contourSegments = buildContourSegments(outer);

  function buildContourSegments(points: THREE.Vector2[]) {
    return points.map((a, i) => [a, points[(i + 1) % points.length]] as [THREE.Vector2, THREE.Vector2]);
  }

  function getIntersectionsAtY(y: number, segments: [THREE.Vector2, THREE.Vector2][]) {
    return segments
      .filter(([a, b]) => (a.y <= y && b.y >= y) || (a.y >= y && b.y <= y))
      .filter(([a, b]) => a.y !== b.y)
      .map(([a, b]) => {
        const t = (y - a.y) / (b.y - a.y);
        const x = a.x + (b.x - a.x) * t;
        return new THREE.Vector2(x, y);
      })
      .sort((p1, p2) => p1.x - p2.x);
  }

  function drawHorizontalBars(count: number, material: THREE.Material) {
    for (let i = 1; i <= count; i++) {
      const y = yMin + ((yMax - yMin) * i) / (count + 1);
      const intersections = getIntersectionsAtY(y, contourSegments);

      if (intersections.length >= 2) {
        const left = intersections[0];
        const right = intersections[intersections.length - 1];
        drawLine(left, right, material);
      }
    }
  }

  function drawVerticalBars(count: number, material: THREE.Material) {
    for (let i = 1; i <= count; i++) {
      const t = i / (count + 1);
      const base = p1.clone().lerp(p2, t);
      let top: THREE.Vector2;

      if (t < 0.5) {
        top = p5.clone().lerp(p4, t / 0.5);
      } else {
        top = p4.clone().lerp(p3, (t - 0.5) / 0.5);
      }

      drawLine(base, top, material);
    }
  }

  function drawLine(from: THREE.Vector2, to: THREE.Vector2, material: THREE.Material) {
    const geometry = new THREE.BufferGeometry().setFromPoints([
      new THREE.Vector3(from.x, from.y, 0.05),
      new THREE.Vector3(to.x, to.y, 0.05),
    ]);
    frameGroup.add(new THREE.Line(geometry, material));
  }

  if (railNb > 0) drawHorizontalBars(railNb, barMaterial);
  if (stileNb > 0) drawVerticalBars(stileNb, barMaterial);
  if (horGlazingBarsNumber > 0) drawHorizontalBars(horGlazingBarsNumber, glazingBarMaterial);
  if (verGlazingBarsNumber > 0) drawVerticalBars(verGlazingBarsNumber, glazingBarMaterial);
}
