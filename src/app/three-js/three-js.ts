import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import * as THREE from 'three';
import { OpeningDirection } from '../utils/opening-direction.enum';
import { FRAME_THICKNESS, WINDOW_WIDTH, INTERIOR_GAP, TOP_FRAME_HEIGHT, BOTTOM_FRAME_HEIGHT, LOW_HEIGHT } from '../utils/consts';
import { Frame } from './frame/frame';
import { Shapes } from '../utils/shapes';

@Component({
  selector: 'app-three-js',
  imports: [CommonModule, FormsModule],
  templateUrl: './three-js.html',
  styleUrl: './three-js.scss'
})
export class ThreeJS {
  scene: any;
  camera: any;
  renderer: any;
  windowGroup: any;

  windowWidth = WINDOW_WIDTH;
  bottomFrameHeight = BOTTOM_FRAME_HEIGHT;
  topFrameHeight = TOP_FRAME_HEIGHT;
  lowHeight = LOW_HEIGHT;
  frameThickness = FRAME_THICKNESS;
  interiorGap = INTERIOR_GAP;

  bottomFrameNb = 1;
  hasTopFrame = false; 
  horizontalGlazingBarsNb = 2;
  verticalGlazingBarsNb = 1;
  railNb = 0;
  stileNb = 0;
  
  openingDirectionOptions = Object.values(OpeningDirection);
  openingDirection: OpeningDirection = OpeningDirection.Left;
  frameService: Frame;
  selectedTopShape: Shapes = Shapes.SegmentTopArch;
  selectedBottomShape: Shapes = Shapes.SegmentTopArch;
  shapeOptions = Object.values(Shapes);

  constructor(frameService: Frame) {
    this.frameService = frameService;
    this.init();
  }

  onDimensionChange() {
    this.windowGroup && this.scene.remove(this.windowGroup);
    this.buildWindow();
  }

  buildWindow() {
    const frames: THREE.Group[] = [];

    const totalWidth = this.windowWidth;
    const topHeight = this.topFrameHeight;
    const bottomHeight = this.bottomFrameHeight;
    const hasTop = this.hasTopFrame;

    for (let i = 0; i < this.bottomFrameNb; i++) {
      const frame = this.frameService.buildFrame(
        totalWidth / this.bottomFrameNb,
        bottomHeight,
        this.lowHeight,
        this.frameThickness,
        this.interiorGap,
        this.openingDirection,
        this.horizontalGlazingBarsNb,
        this.verticalGlazingBarsNb,
        this.selectedBottomShape,
        this.stileNb,
        this.railNb
      );

      frame.position.set(
        (i - (this.bottomFrameNb - 1) / 2) * (totalWidth / this.bottomFrameNb) - (i > 0 ? this.frameThickness * i : 0),
        bottomHeight / 2, // centre du cadre par rapport à la base
        0
      );

      frames.push(frame);
    }

    if (hasTop) {
      const topFrame = this.frameService.buildFrame(
        totalWidth - (this.bottomFrameNb - 1) * this.frameThickness,
        topHeight,
        this.lowHeight,
        this.frameThickness,
        this.interiorGap,
        this.openingDirection,
        this.horizontalGlazingBarsNb,
        this.verticalGlazingBarsNb,
        this.selectedTopShape
      );

      topFrame.position.set(
        -this.frameThickness / 2,
        bottomHeight + topHeight / 2 - this.frameThickness / 2, // centré par rapport à la base
        0
      );

      frames.push(topFrame);
    }

    this.windowGroup = new THREE.Group().add(...frames);
    this.scene.add(this.windowGroup);

    // Ajustement automatique du zoom de la caméra pour englober le groupe
    const box = new THREE.Box3().setFromObject(this.windowGroup);
    const size = new THREE.Vector3();
    box.getSize(size);
    const maxDim = Math.max(size.x, size.y);
    const margin = 3;
    const halfDim = (maxDim * margin) / 2;
    this.camera.left = -halfDim;
    this.camera.right = halfDim;
    this.camera.top = halfDim;
    this.camera.bottom = -halfDim;
    this.camera.updateProjectionMatrix();
  }

  init() {
    this.scene = new THREE.Scene();
    this.renderer = new THREE.WebGLRenderer({antialias: true});
    this.renderer.setPixelRatio(window.devicePixelRatio);
    this.renderer.setClearColor(0x000000, 0);

    const height = window.innerHeight;
    const width = height;
    this.renderer.setSize(width, height);
    document.body.appendChild(this.renderer.domElement);

    const viewSize = 5; 
    const left = -viewSize;
    const right = viewSize;
    const top = viewSize;
    const bottom = -viewSize;
    this.camera = new THREE.OrthographicCamera(left, right, top, bottom, 0.1, 1000);

    this.buildWindow();

    this.camera.position.z = 5;
    this.camera.lookAt(0, 0, 0);

    this.animate();
  }

  animate() {
    requestAnimationFrame(() => this.animate());

    this.renderer.render(this.scene, this.camera);
  }
}
