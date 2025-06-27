import * as THREE from 'three';
import { OpeningDirection } from '../../../utils/opening-direction.enum';
import { GLASS } from '../../../utils/consts';

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
  }
  
    frames.forEach(({ geometry, position }) => {
      const frame = new THREE.Mesh(geometry, frameMaterial);
      frame.position.set(...position);
      frameGroup.add(frame);
    });

    return frameGroup;
}

function   buildGlass(
    frameHeight: number,
    frameWidth: number,
    frameThickness: number,
    frameGroup: THREE.Group
  ) {
    // Vitre
    const glassMaterial = new THREE.ShaderMaterial(GLASS);
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
    const dashMaterial = new THREE.LineDashedMaterial({ color: 0x93807b, dashSize: 0.05, gapSize: 0.05, linewidth: 1 });

    // Diagonales pointillées pour le sens d'ouverture des vantaux
    // Gauche (diagonales vers le centre)
    const leftDiag1: THREE.BufferGeometry = new THREE.BufferGeometry();
    const leftDiag2: THREE.BufferGeometry = new THREE.BufferGeometry();

    switch (openingDirection) {
      case OpeningDirection.Fixed:
        // Pas de diagonales pour une fenêtre fixe
        return;
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
    }

    const leftLine1 = new THREE.Line(leftDiag1, dashMaterial);
    leftLine1.computeLineDistances();
    frameGroup.add(leftLine1);
    const leftLine2 = new THREE.Line(leftDiag2, dashMaterial);
    leftLine2.computeLineDistances();
    frameGroup.add(leftLine2);
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
    const dashMaterial = new THREE.LineBasicMaterial({ color: 0x93807b, linewidth: 1 });

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