import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import * as THREE from 'three';
import { OpeningDirection } from '../utils/opening-direction.enum';
import { FRAME_HEIGHT, FRAME_THICKNESS, WINDOW_WIDTH, INTERIOR_GAP, TOP_FRAME_HEIGHT } from '../utils/consts';
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
  topFrameHeight = TOP_FRAME_HEIGHT;
  frameThickness = FRAME_THICKNESS;
  interiorGap = INTERIOR_GAP;

  bottomFrameNb = 2;
  hasTopFrame = true; 
  horizontalGlazingBarsNb = 0;
  verticalGlazingBarsNb = 0;
  
  openingDirectionOptions = Object.values(OpeningDirection);
  openingDirection: OpeningDirection = OpeningDirection.Fixed;
  frameService: Frame;
  selectedTopShape: Shapes = Shapes.Rectangle;
  selectedBottomShape: Shapes = Shapes.Rectangle;
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
    const bottomHeight = this.frameHeight;
    const hasTop = this.hasTopFrame;

    for (let i = 0; i < this.bottomFrameNb; i++) {
      const frame = this.frameService.buildFrame(
        totalWidth / this.bottomFrameNb,
        bottomHeight,
        this.frameThickness,
        this.interiorGap,
        this.openingDirection,
        this.horizontalGlazingBarsNb,
        this.verticalGlazingBarsNb,
        this.selectedBottomShape
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
    this.fitCameraToObject(this.windowGroup);
  }


  fitCameraToObject(object: THREE.Object3D) {
    const box = new THREE.Box3().setFromObject(object);
    const size = box.getSize(new THREE.Vector3());
    const center = box.getCenter(new THREE.Vector3());

    const margin = 1.3; // 30% de marge
    const width = size.x * margin;
    const height = size.y * margin;

    const aspect = window.innerWidth / window.innerHeight;
    let camWidth = width;
    let camHeight = height;
    if (width / height > aspect) {
      camHeight = width / aspect;
    } else {
      camWidth = height * aspect;
    }
    this.camera.left = -camWidth / 2;
    this.camera.right = camWidth / 2;
    this.camera.top = camHeight;
    this.camera.bottom = -camHeight;
    this.camera.position.set(center.x, center.y, this.camera.position.z);
    this.camera.updateProjectionMatrix();
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
