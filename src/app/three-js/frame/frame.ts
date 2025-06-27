import { Injectable } from '@angular/core';
import * as THREE from 'three';
import { OpeningDirection } from '../../utils/opening-direction.enum';
import { Shapes } from '../../utils/shapes';
import { createRectangleFrame } from './shapes/rectangle-frame';

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
    }

    return this.frameGroup;
  }
}
