import * as THREE from 'three';
import { OpeningDirection } from '../../../utils/opening-direction.enum';
import { GLASS, LINE_COLOR } from '../../../utils/consts';

export function createRectangleFrame(
  frameWidth: number,
  frameHeight: number,
  frameThickness: number,
  interiorGap: number,
  openingDirection: OpeningDirection,
  horGlazingBarsNumber: number = 0,
  verGlazingBarsNumber: number = 0,
): THREE.Group {
    
  const frameGroup = new THREE.Group();
  // Cadre (4 côtés) avec une boucle
  const frameMaterial = new THREE.MeshBasicMaterial({ color: 0x000000 });
  let frames: { geometry: THREE.PlaneGeometry, position: [number, number, number] }[] = [
    {
      // Haut
      geometry: new THREE.PlaneGeometry(frameWidth, frameThickness),
      position: [0, frameHeight / 2 - frameThickness / 2, 0]
    },
    {
      // Bas
      geometry: new THREE.PlaneGeometry(frameWidth, frameThickness),
      position: [0, -frameHeight / 2 + frameThickness / 2, 0]
    },
    {
      // Gauche
      geometry: new THREE.PlaneGeometry(frameThickness, frameHeight),
      position: [-frameWidth / 2 + frameThickness / 2, 0, 0]
    },
    {
      // Droite
      geometry: new THREE.PlaneGeometry(frameThickness, frameHeight),
      position: [frameWidth / 2 - frameThickness / 2, 0, 0]
    }
  ];

  if(openingDirection !== OpeningDirection.Fixed) {
    // Cadres intérieurs pour menuiserie ouvrante
    frames = frames.concat([
      {
        // Haut intérieur
        geometry: new THREE.PlaneGeometry(frameWidth - interiorGap * 2, frameThickness / 2),
        position: [0, frameHeight / 2 - frameThickness / 2 - interiorGap, 0.1]
      },
      {
        // Bas intérieur
        geometry: new THREE.PlaneGeometry(frameWidth - interiorGap * 2, frameThickness / 2),
        position: [0, -frameHeight / 2 + frameThickness / 2 + interiorGap, 0.1]
      },
      {
        // Gauche intérieur
        geometry: new THREE.PlaneGeometry(frameThickness - 0.01, frameHeight - interiorGap * 2),
        position: [-frameWidth / 2 + frameThickness / 2 + 0.1, 0, 0.1]
      },
      {
        // Droite intérieur
        geometry: new THREE.PlaneGeometry(frameThickness - 0.01, frameHeight - 0.2),
        position: [frameWidth / 2  - 0.1 - frameThickness / 2, 0, 0.1]
      }
    ]);
  }

  buildGlass(
    frameHeight,
    frameWidth,
    frameThickness,
    frameGroup
  );
      
  buildOpening(
    frameHeight,
    frameWidth,
    frameThickness,
    interiorGap,
    openingDirection,
    frameGroup
  );

  buildGlazingBars(
    frameHeight,
    frameWidth,
    frameThickness,
    interiorGap,
    horGlazingBarsNumber,
    verGlazingBarsNumber,
    frameGroup
  );
  
  frames.forEach(({ geometry, position }) => {
    const frame = new THREE.Mesh(geometry, frameMaterial);
    frame.position.set(...position);
    frameGroup.add(frame);
  });

  return frameGroup;
}

function buildGlass(
    frameHeight: number,
    frameWidth: number,
    frameThickness: number,
    frameGroup: THREE.Group
  ) {
    // Vitre
    const glassMaterial = GLASS;
    const glass = new THREE.Mesh(
      new THREE.PlaneGeometry(frameWidth - 2 * frameThickness, frameHeight - 2 * frameThickness),
      glassMaterial
    );
    glass.position.set(0, 0, 0.01);
    frameGroup.add(glass);    
}

function buildOpening(
    frameHeight: number,
    frameWidth: number,
    frameThickness: number,
    interiorGap: number,
    openingDirection: OpeningDirection,
    frameGroup: THREE.Group
  ) {
    frameWidth = frameWidth - interiorGap * 2;
    frameHeight = frameHeight - interiorGap * 2;
    frameThickness = frameThickness;
    // Pointillés en triangle pour le sens d'ouverture des vantaux
    const dashMaterial = new THREE.LineDashedMaterial({ color: LINE_COLOR, dashSize: 0.05, gapSize: 0.05, linewidth: 1 });
    const solidMaterial = new THREE.LineBasicMaterial({ color: LINE_COLOR });

    // Diagonales pointillées pour le sens d'ouverture des vantaux
    // Gauche (diagonales vers le centre)
    const leftDiag1: THREE.BufferGeometry = new THREE.BufferGeometry();
    const leftDiag2: THREE.BufferGeometry = new THREE.BufferGeometry();

    switch (openingDirection) {
      case OpeningDirection.Left:
        leftDiag1.setFromPoints([
          new THREE.Vector3(-frameWidth/2 + frameThickness, frameHeight/2 - frameThickness, 0.03),
          new THREE.Vector3(frameWidth/2, 0, 0.03)
        ]);
        leftDiag2.setFromPoints([
          new THREE.Vector3(-frameWidth/2 + frameThickness, -frameHeight/2 + frameThickness, 0.03),
          new THREE.Vector3(frameWidth/2, 0, 0.03)
        ]);
        break;
      case OpeningDirection.Right:
        leftDiag1.setFromPoints([
          new THREE.Vector3(frameWidth/2 - frameThickness, frameHeight/2 - frameThickness, 0.03),
          new THREE.Vector3(-frameWidth/2, 0, 0.03)
        ]);
        leftDiag2.setFromPoints([
          new THREE.Vector3(frameWidth/2 - frameThickness, -frameHeight/2 + frameThickness, 0.03),
          new THREE.Vector3(-frameWidth/2, 0, 0.03)
        ]);
        break;
      case OpeningDirection.Up:
        leftDiag1.setFromPoints([
          new THREE.Vector3(-frameWidth/2 + frameThickness, frameHeight/2 - frameThickness, 0.03),
          new THREE.Vector3(0, -frameHeight/2 + frameThickness, 0.03)
        ]);
        leftDiag2.setFromPoints([
          new THREE.Vector3(frameWidth/2 - frameThickness, frameHeight/2 - frameThickness, 0.03),
          new THREE.Vector3(0, -frameHeight/2 + frameThickness, 0.03)
        ]);
        break;
      case OpeningDirection.Down:
        leftDiag1.setFromPoints([
          new THREE.Vector3(-frameWidth/2 + frameThickness, -frameHeight/2 + frameThickness, 0.03),
          new THREE.Vector3(0, frameHeight/2 - frameThickness, 0.03)
        ]);
        leftDiag2.setFromPoints([
          new THREE.Vector3(frameWidth/2 - frameThickness, -frameHeight/2 + frameThickness, 0.03),
          new THREE.Vector3(0, frameHeight/2 - frameThickness, 0.03)
        ]);
        break;
      case OpeningDirection.Oscillating:
        leftDiag1.setFromPoints([
          new THREE.Vector3(-frameWidth/2 + frameThickness, -frameHeight/2 + frameThickness, 0.03),
          new THREE.Vector3(0, frameHeight/2 - frameThickness, 0.03)
        ]);
        leftDiag2.setFromPoints([
          new THREE.Vector3(frameWidth/2 - frameThickness, -frameHeight/2 + frameThickness, 0.03),
          new THREE.Vector3(0, frameHeight/2 - frameThickness, 0.03)
        ]);
        const leftDiag3: THREE.BufferGeometry = new THREE.BufferGeometry().setFromPoints([
          new THREE.Vector3(-frameWidth/2 + frameThickness, frameHeight/2 - frameThickness, 0.03),
          new THREE.Vector3(frameWidth/2, 0, 0.03)
        ]);
        const leftDiag4: THREE.BufferGeometry = new THREE.BufferGeometry().setFromPoints([
          new THREE.Vector3(-frameWidth/2 + frameThickness, -frameHeight/2 + frameThickness, 0.03),
          new THREE.Vector3(frameWidth/2, 0, 0.03)
        ]);
        const leftLine3 = new THREE.Line(leftDiag3, dashMaterial);
        leftLine3.computeLineDistances();
        frameGroup.add(leftLine3);
        const leftLine4 = new THREE.Line(leftDiag4, dashMaterial);
        leftLine4.computeLineDistances();
        frameGroup.add(leftLine4);
        break;
      case OpeningDirection.Accordion:
        const topLeft = new THREE.Vector3(-frameWidth / 2 + frameThickness, frameHeight / 2 - frameThickness, 0.03);
        const topRight = new THREE.Vector3(frameWidth / 2 - frameThickness, frameHeight / 2 - frameThickness, 0.03);
        const topMid = new THREE.Vector3(0, frameHeight / 2 - frameThickness - (frameHeight / 6), 0.03);

        const bottomLeft = new THREE.Vector3(-frameWidth / 2 + frameThickness, -frameHeight / 2 + frameThickness, 0.03);
        const bottomRight = new THREE.Vector3(frameWidth / 2 - frameThickness, -frameHeight / 2 + frameThickness, 0.03);
        const bottomMid = new THREE.Vector3(0, -frameHeight / 2 + frameThickness + (frameHeight / 6), 0.03);

        const vertical = new THREE.BufferGeometry().setFromPoints([
          topMid,
          bottomMid
        ]);
        const verticalLine = new THREE.Line(vertical, dashMaterial);
        verticalLine.computeLineDistances();
        frameGroup.add(verticalLine);

        // Top triangle left
        leftDiag1.setFromPoints([topLeft, topMid]);
        leftDiag2.setFromPoints([topRight, topMid]);
        // Bottom triangle left
        const bottomTriangleLeft = new THREE.BufferGeometry().setFromPoints([bottomLeft, bottomMid]);
        const bottomTriangleRight = new THREE.BufferGeometry().setFromPoints([bottomRight, bottomMid]);

        const topLine1 = new THREE.Line(leftDiag1, dashMaterial);
        topLine1.computeLineDistances();
        frameGroup.add(topLine1);

        const topLine2 = new THREE.Line(leftDiag2, dashMaterial);
        topLine2.computeLineDistances();
        frameGroup.add(topLine2);

        const bottomLine1 = new THREE.Line(bottomTriangleLeft, dashMaterial);
        bottomLine1.computeLineDistances();
        frameGroup.add(bottomLine1);

        const bottomLine2 = new THREE.Line(bottomTriangleRight, dashMaterial);
        bottomLine2.computeLineDistances();
        frameGroup.add(bottomLine2);
        break;
      case OpeningDirection.Rotating:
        const diamondPoints = [
          new THREE.Vector3(0, frameHeight / 2 - frameThickness, 0.03), // haut
          new THREE.Vector3(frameWidth / 2 - frameThickness, 0, 0.03),  // droite
          new THREE.Vector3(0, -frameHeight / 2 + frameThickness, 0.03), // bas
          new THREE.Vector3(-frameWidth / 2 + frameThickness, 0, 0.03), // gauche
          new THREE.Vector3(0, frameHeight / 2 - frameThickness, 0.03), // retour au haut
        ];

        // Ligne pointillée pour tout le losange
        const diamondGeometry = new THREE.BufferGeometry().setFromPoints(diamondPoints);
        const diamondLine = new THREE.Line(diamondGeometry, dashMaterial);
        diamondLine.computeLineDistances();
        frameGroup.add(diamondLine);

        const rightLines = [
          // haut -> droite
          [diamondPoints[0], diamondPoints[1]],
          // droite -> bas
          [diamondPoints[1], diamondPoints[2]],
        ];

        for (const [start, end] of rightLines) {
          const geometry = new THREE.BufferGeometry().setFromPoints([start, end]);
          const solidLine = new THREE.Line(geometry, solidMaterial);
          frameGroup.add(solidLine);
        }
        break;
      case OpeningDirection.Tilting:
        const diamondPointsTilting = [
          new THREE.Vector3(0, frameHeight / 2 - frameThickness, 0.03),           // haut
          new THREE.Vector3(frameWidth / 2 - frameThickness, 0, 0.03),           // droite
          new THREE.Vector3(0, -frameHeight / 2 + frameThickness, 0.03),         // bas
          new THREE.Vector3(-frameWidth / 2 + frameThickness, 0, 0.03),          // gauche
          new THREE.Vector3(0, frameHeight / 2 - frameThickness, 0.03),          // retour au haut
        ];

        // Ligne pointillée pour tout le losange
        const diamondGeometryTilting = new THREE.BufferGeometry().setFromPoints(diamondPointsTilting);
        const diamondLineTilting = new THREE.Line(diamondGeometryTilting, dashMaterial);
        diamondLineTilting.computeLineDistances();
        frameGroup.add(diamondLineTilting);

        // Droites du haut (pleines) : segments 0 (haut → droite) et 3 (gauche → haut)

        const topLines = [
          // gauche -> haut
          [diamondPointsTilting[3], diamondPointsTilting[0]],
          // haut -> droite
          [diamondPointsTilting[0], diamondPointsTilting[1]],
        ];

        for (const [start, end] of topLines) {
          const geometry = new THREE.BufferGeometry().setFromPoints([start, end]);
          const solidLine = new THREE.Line(geometry, solidMaterial);
          frameGroup.add(solidLine);
        }
        break;
      case OpeningDirection.Sliding:
      case OpeningDirection.Pocket:
        const arrowLength = frameWidth / 3;
        const arrowHeadSize = frameHeight / 20;
        const z = 0.03;

        // Points de la flèche : ligne principale (gauche → droite)
        const shaftPoints = [
          new THREE.Vector3(-arrowLength / 2, 0, z), // début de la flèche
          new THREE.Vector3(arrowLength / 2, 0, z),  // fin de la flèche
        ];

        // Pointes de la flèche (en triangle)
        const arrowHeadLeft = new THREE.Vector3(arrowLength / 2 - arrowHeadSize, arrowHeadSize, z);
        const arrowHeadRight = new THREE.Vector3(arrowLength / 2 - arrowHeadSize, -arrowHeadSize, z);
        const arrowTip = new THREE.Vector3(arrowLength / 2, 0, z);

        // Ligne principale
        const shaftGeometry = new THREE.BufferGeometry().setFromPoints(shaftPoints);
        const shaftLine = new THREE.Line(shaftGeometry, solidMaterial);
        frameGroup.add(shaftLine);

        // Triangle de la pointe (deux segments)
        const arrowHeadLines = [
          [arrowHeadLeft, arrowTip],
          [arrowHeadRight, arrowTip],
        ];

        for (const [start, end] of arrowHeadLines) {
          const geometry = new THREE.BufferGeometry().setFromPoints([start, end]);
          const headLine = new THREE.Line(geometry, solidMaterial);
          frameGroup.add(headLine);
        }

        break;
      default:
        return; // Pas de diagonales pour une fenêtre fixe
    }

    if(leftDiag1.hasAttribute('position')) {
      const leftLine1 = new THREE.Line(leftDiag1, dashMaterial);
      leftLine1.computeLineDistances();
      frameGroup.add(leftLine1);
    }
    if(leftDiag2.hasAttribute('position')){
      const leftLine2 = new THREE.Line(leftDiag2, dashMaterial);
      leftLine2.computeLineDistances();
      frameGroup.add(leftLine2);
    }
  }

function buildGlazingBars(
    frameHeight: number,
    frameWidth: number,
    frameThickness: number,
    interiorGap: number,
    horGlazingBarsNumber: number,
    verGlazingBarsNumber: number,
    frameGroup: THREE.Group
  ) {
    frameWidth = frameWidth - interiorGap * 2;
    frameHeight = frameHeight - interiorGap * 2;
    frameThickness = frameThickness;
    const dashMaterial = new THREE.LineBasicMaterial({ color: LINE_COLOR, linewidth: 1 });

    // Ajout des petits bois horizontaux
    if (horGlazingBarsNumber > 0) {
      const spacing = frameHeight / (horGlazingBarsNumber + 1);
      for (let i = 1; i <= horGlazingBarsNumber; i++) {
        const y = -frameHeight / 2 + i * spacing;
        const geometry = new THREE.BufferGeometry().setFromPoints([
          new THREE.Vector3(-frameWidth / 2, y, 0.02),
          new THREE.Vector3(frameWidth / 2, y, 0.02)
        ]);
        const line = new THREE.Line(geometry, dashMaterial);
        line.computeLineDistances();
        frameGroup.add(line);
      }
    }

    // Ajout des petits bois verticaux
    if (verGlazingBarsNumber > 0) {
      const spacing = frameWidth / (verGlazingBarsNumber + 1);
      for (let i = 1; i <= verGlazingBarsNumber; i++) {
        const x = -frameWidth / 2 + i * spacing;
        const geometry = new THREE.BufferGeometry().setFromPoints([
          new THREE.Vector3(x, -frameHeight / 2, 0.02),
          new THREE.Vector3(x, frameHeight / 2, 0.02)
        ]);
        const line = new THREE.Line(geometry, dashMaterial);
        line.computeLineDistances();
        frameGroup.add(line);
      }
    }
  }