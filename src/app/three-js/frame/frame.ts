import { Injectable } from '@angular/core';
import * as THREE from 'three';
import { OpeningDirection } from '../utils/opening-direction.enum';
import { Shapes } from '../utils/shapes';
import { createRectangleFrame } from './shapes/rectangle-frame';
import { createCircleFrame } from './shapes/circle-frame';
import { createHalfMoonFrame } from './shapes/half-moon-frame';
import { createTrapezoidFrame } from './shapes/trapezoid-frame';
import { createPentagonFrame } from './shapes/pentagon-frame';
import { createTriangleFrame } from './shapes/triangle-frame';
import { createBasketHandleArchFrame } from './shapes/basket-handle-arch-frame';
import { createSegmentTopArchFrame } from './shapes/segment-top-arch-frame';

@Injectable({
  providedIn: 'root'
})
export class Frame {

  frameGroup: THREE.Group = new THREE.Group();

  constructor() { }

  buildFrame(
    frameWidth: number,
    frameHeight: number,
    lowHeight: number,
    frameThickness: number,
    interiorGap: number,
    openingDirection: OpeningDirection,
    horGlazingBarsNumber: number = 0,
    verGlazingBarsNumber: number = 0,
    shape: Shapes,
    stileNb: number = 0,
    railNb: number = 0
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
          verGlazingBarsNumber,
          stileNb,
          railNb
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
          verGlazingBarsNumber,
          stileNb,
          railNb
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
          verGlazingBarsNumber,
          stileNb,
          railNb
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
          lowHeight, // ratio de la longueur du haut par rapport au bas
          stileNb,
          railNb
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
          stileNb,
          railNb,
          lowHeight
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
          verGlazingBarsNumber,
          stileNb,
          railNb
        );
        break;
      case Shapes.BasketHandleArch:
        this.frameGroup = createBasketHandleArchFrame(
          frameWidth,
          frameHeight,
          frameThickness,
          interiorGap,
          openingDirection,
          horGlazingBarsNumber,
          verGlazingBarsNumber,
          stileNb,
          railNb
        );
        break;
      case Shapes.SegmentTopArch:
        this.frameGroup = createSegmentTopArchFrame(
          frameWidth,
          frameHeight,
          frameThickness,
          interiorGap,
          openingDirection,
          horGlazingBarsNumber,
          verGlazingBarsNumber,
          stileNb,
          railNb
        );
        break;
    }

    return this.frameGroup;
  }
}
