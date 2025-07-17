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

  const material = new THREE.LineBasicMaterial({ color: 0x000000 });

  const [p1, p2, p3, p4, p5] = outer;

  if (railNb > 0) {
    // Déterminer les bornes verticales
    const yMin = Math.min(...outer.map(v => v.y));
    const yMax = Math.max(...outer.map(v => v.y));

    // Construire les segments du contour (chaîne fermée)
    const segments = [];
    for (let i = 0; i < outer.length; i++) {
      const a = outer[i];
      const b = outer[(i + 1) % outer.length];
      segments.push([a, b]);
    }

    // Générer les rails
    for (let i = 1; i <= railNb; i++) {
      const t = i / (railNb + 1);
      const y = yMin + (yMax - yMin) * t;

      const intersections: THREE.Vector2[] = [];

      for (const [a, b] of segments) {
        // Si le segment croise la ligne y
        if ((a.y <= y && b.y >= y) || (a.y >= y && b.y <= y)) {
          if (a.y === b.y) continue; // horizontal => ignorer

          const tSeg = (y - a.y) / (b.y - a.y);
          const x = a.x + (b.x - a.x) * tSeg;
          intersections.push(new THREE.Vector2(x, y));
        }
      }

      if (intersections.length >= 2) {
        // Trier pour avoir le segment le plus long dans la forme
        intersections.sort((p1, p2) => p1.x - p2.x);
        const left = intersections[0];
        const right = intersections[intersections.length - 1];

        const geometry = new THREE.BufferGeometry().setFromPoints([
          new THREE.Vector3(left.x, left.y, 0.05),
          new THREE.Vector3(right.x, right.y, 0.05)
        ]);
        const line = new THREE.Line(geometry, material);
        frameGroup.add(line);
      }
    }
  }

  if (stileNb > 0) {
    for (let i = 1; i <= stileNb; i++) {
      const t = i / (stileNb + 1);
      const base = p1.clone().lerp(p2, t); // base horizontale

      // Interpoler dans le haut en 2 segments : p5 -> p4 et p4 -> p3
      let top: THREE.Vector2;
      if (t < 0.5) {
        const tTop = t / 0.5;
        top = p5.clone().lerp(p4, tTop);
      } else {
        const tTop = (t - 0.5) / 0.5;
        top = p4.clone().lerp(p3, tTop);
      }

      const geometry = new THREE.BufferGeometry().setFromPoints([
        new THREE.Vector3(base.x, base.y, 0.05),
        new THREE.Vector3(top.x, top.y, 0.05),
      ]);
      const line = new THREE.Line(geometry, material);
      frameGroup.add(line);
    }
  }

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