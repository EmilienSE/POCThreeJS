import * as THREE from 'three';
import { OpeningDirection } from '../../../utils/opening-direction.enum';
import { GLASS, LINE_COLOR } from '../../../utils/consts';

// Fonction utilitaire pour calculer les sommets d'un pentagone régulier centré
function getPentagonVertices(width: number, height: number): THREE.Vector2[] {
  const angleOffset = Math.PI / 2; // Pour que la pointe soit en haut
  const r = height / 2;
  const cx = 0, cy = 0;
  return Array.from({ length: 5 }, (_, i) => {
    const angle = angleOffset + i * (2 * Math.PI / 5);
    return new THREE.Vector2(
      cx + r * Math.cos(angle) * (width / height),
      cy + r * Math.sin(angle)
    );
  });
}

export function createPentagonFrame(
  frameWidth: number,
  frameHeight: number,
  frameThickness: number,
  interiorGap: number,
  openingDirection: OpeningDirection,
  horGlazingBarsNumber: number = 0,
  verGlazingBarsNumber: number = 0,
): THREE.Group {
  const frameGroup = new THREE.Group();
  const frameMaterial = new THREE.MeshBasicMaterial({ color: 0x000000 });

  // Sommets extérieurs du pentagone
  const outer = getPentagonVertices(frameWidth, frameHeight);
  // Sommets intérieurs (pour l'épaisseur du cadre)
  const inner = getPentagonVertices(frameWidth - 2 * frameThickness, frameHeight - 2 * frameThickness);

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

  const interiorOuter = getPentagonVertices(frameWidth - interiorGap * 2, frameHeight - interiorGap * 2);
  const interiorInner = getPentagonVertices(frameWidth - 2 * frameThickness - interiorGap * 2, frameHeight - 2 * frameThickness - interiorGap * 2);
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
  const glassMaterial = new THREE.ShaderMaterial(GLASS);
  const glassShape = new THREE.Shape(inner);
  const glassGeometry = new THREE.ShapeGeometry(glassShape);
  const glass = new THREE.Mesh(glassGeometry, glassMaterial);
  glass.position.z = 0.01;
  frameGroup.add(glass);

  buildTrapezoidOpening(
    interiorInner,
    openingDirection,
    frameGroup
  );

  // TODO: Ajout petits bois

  return frameGroup;
}

function buildTrapezoidOpening(
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