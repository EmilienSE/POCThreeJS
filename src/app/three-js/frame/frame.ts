import { Injectable } from '@angular/core';
import * as THREE from 'three';
import { OpeningDirection } from '../../utils/opening-direction.enum';
import { Shapes } from '../../utils/shapes';
import { createRectangleFrame } from './shapes/rectangle-frame';
import { createCircleFrame } from './shapes/circle-frame';
import { createHalfMoonFrame } from './shapes/half-moon-frame';
import { createTrapezoidFrame } from './shapes/trapezoid-frame';
import { createPentagonFrame } from './shapes/pentagon-frame';
import { createTriangleFrame } from './shapes/triangle-frame';

@Injectable({
  providedIn: 'root'
})
export class Frame {

  frameGroup: THREE.Group = new THREE.Group();

  constructor() { }

  buildFrame(
    frameWidth: number,
    frameHeight: number,
    frameThickness: number,
    interiorGap: number,
    openingDirection: OpeningDirection,
    horGlazingBarsNumber: number = 0,
    verGlazingBarsNumber: number = 0,
    shape: Shapes
  ): THREE.Group {

    switch (shape) {
      case Shapes.Rectangle:
        this.frameGroup = createRectangleFrame(
          frameWidth,
          frameHeight,
          frameThickness,
          interiorGap,
          openingDirection,
          horGlazingBarsNumber,
          verGlazingBarsNumber
        )
        break;
      case Shapes.Circle:
        this.frameGroup = createCircleFrame(
          frameWidth,
          frameHeight,
          frameThickness,
          interiorGap,
          openingDirection,
          horGlazingBarsNumber,
          verGlazingBarsNumber
        )
        break;
      case Shapes.HalfMoon:
        this.frameGroup = createHalfMoonFrame(
          frameWidth,
          frameHeight,
          frameThickness,
          interiorGap,
          openingDirection,
          horGlazingBarsNumber,
          verGlazingBarsNumber
        );
        break;
      case Shapes.Trapezoid:
        this.frameGroup = createTrapezoidFrame(
          frameWidth,
          frameHeight,
          frameThickness,
          interiorGap,
          openingDirection,
          horGlazingBarsNumber,
          verGlazingBarsNumber,
          0.8 // ratio de la longueur du haut par rapport au bas
        );
        break;
      case Shapes.Pentagon:
        this.frameGroup = createPentagonFrame(
          frameWidth,
          frameHeight,
          frameThickness,
          interiorGap,
          openingDirection,
          horGlazingBarsNumber,
          verGlazingBarsNumber,
        );
        break;
      case Shapes.Triangle:
        this.frameGroup = createTriangleFrame(
          frameWidth,
          frameHeight,
          frameThickness,
          interiorGap,
          openingDirection,
          horGlazingBarsNumber,
          verGlazingBarsNumber
        );
        break;
    }

    return this.frameGroup;
  }
}
