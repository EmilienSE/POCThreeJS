import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import * as THREE from 'three';
import { OpeningDirection } from '../utils/opening-direction.enum';
import { FRAME_HEIGHT, FRAME_THICKNESS, WINDOW_WIDTH, INTERIOR_GAP } from '../utils/consts';
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
  frameHeight = FRAME_HEIGHT;
  frameThickness = FRAME_THICKNESS;
  interiorGap = INTERIOR_GAP;

  frameNb = 1;
  horizontalGlazingBarsNb = 0;
  verticalGlazingBarsNb = 0;
  
  openingDirectionOptions = Object.values(OpeningDirection);
  openingDirection: OpeningDirection = OpeningDirection.Fixed; // Direction d'ouverture des vantaux
  frameService: Frame;
  selectedShape: Shapes = Shapes.Rectangle;
  shapeOptions = Object.values(Shapes);

  constructor(frameService: Frame) {
    this.frameService = frameService;
    this.init();
  }

  onDimensionChange() {
    this.windowGroup && this.scene.remove(this.windowGroup); // Remove the old window group if it exists
    this.buildWindow();
  }

  buildWindow() {
    const frames: THREE.Group[] = [];
    for (let i = 0; i < this.frameNb; i++) {
      const frame: THREE.Group = this.frameService.buildFrame(
        this.windowWidth / this.frameNb,
        this.frameHeight,
        this.frameThickness,
        this.interiorGap,
        this.openingDirection,
        this.horizontalGlazingBarsNb,
        this.verticalGlazingBarsNb,
        this.selectedShape
      );
      frame.position.set((i - (this.frameNb - 1) / 2) * (this.windowWidth / this.frameNb) - (i > 0 ? this.frameThickness * i : 0), 0, 0);
      frames.push(frame);
    }
    this.windowGroup = new THREE.Group().add(...frames);
    this.scene.add(this.windowGroup);
  } 

  init() {
    // Initialize the scene, camera, and renderer
    this.scene = new THREE.Scene();
    this.camera = new THREE.OrthographicCamera(
      window.innerWidth / -200, window.innerWidth / 200,
      window.innerHeight / 200, window.innerHeight / -200,
      0.1, 1000
    );
    this.renderer = new THREE.WebGLRenderer({antialias: true});
    
    this.renderer.setPixelRatio( window.devicePixelRatio );
    this.renderer.setClearColor(0x000000, 0); // Fond transparent

    // Set the size of the renderer
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    document.body.appendChild(this.renderer.domElement);

    this.buildWindow();

    // Position the camera
    this.camera.position.z = 5;
    this.camera.lookAt(0, 0, 0);

    // Start the animation loop
    this.animate();
  }

  animate() {
    requestAnimationFrame(() => this.animate());

    // Render the scene
    this.renderer.render(this.scene, this.camera);
  }
}
