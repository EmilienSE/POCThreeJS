import { CommonModule } from '@angular/common';
import { AfterViewInit, Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import * as THREE from 'three';
import { OpeningDirection } from '../utils/opening-direction.enum';
import { FRAME_THICKNESS, WINDOW_WIDTH, INTERIOR_GAP, TOP_FRAME_HEIGHT, BOTTOM_FRAME_HEIGHT, LOW_HEIGHT } from '../utils/consts';
import { Frame } from './frame/frame';
import { Shapes } from '../utils/shapes';
import { FrameConfig } from '../utils/frame-config';
import { ElementRef, ViewChild } from '@angular/core';


@Component({
  selector: 'app-three-js',
  imports: [CommonModule, FormsModule],
  templateUrl: './three-js.html',
  styleUrl: './three-js.scss'
})
export class ThreeJS implements AfterViewInit {
  scene: any;
  camera: any;
  renderer: any;
  windowGroup: any;
  @ViewChild('previewContainer', { static: true }) previewContainerRef!: ElementRef;

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
  selectedBottomShape: Shapes = Shapes.BasketHandleArch;
  bottomFrameConfigs: FrameConfig[] = [];

  topFrameConfig: FrameConfig = {
    width: this.windowWidth,
    height: this.topFrameHeight,
    lowHeight: this.lowHeight,
    shape: this.selectedTopShape,
    horizontalGlazingBarsNb: 0,
    verticalGlazingBarsNb: 0,
    stileNb: 0,
    railNb: 0,
    openingDirection: OpeningDirection.Fixed
  };


  shapeOptions = Object.values(Shapes);

  constructor(frameService: Frame) {
    this.frameService = frameService;
  }

  ngAfterViewInit(): void {
    this.init();
  }

  onDimensionChange() {
    this.windowGroup && this.scene.remove(this.windowGroup);
    this.buildWindow();
  }

  updateConfigs() {
    while (this.bottomFrameConfigs.length < this.bottomFrameNb) {
      this.bottomFrameConfigs.push(this.createDefaultConfig());
    }
    this.bottomFrameConfigs = this.bottomFrameConfigs.slice(0, this.bottomFrameNb);
  }

  createDefaultConfig(): FrameConfig {
    return {
      openingDirection: OpeningDirection.Fixed,
      width: this.windowWidth, // valeur par défaut, ou un tiers, etc.
      height: this.bottomFrameHeight,
      shape: Shapes.Rectangle,
      horizontalGlazingBarsNb: 0,
      verticalGlazingBarsNb: 0,
      railNb: 0,
      stileNb: 0
    };
  }

  buildWindow() {
    this.updateConfigs();
    const frames: THREE.Group[] = [];
    const bottomFramesGroup = new THREE.Group();
    const topFrameGroup = new THREE.Group();

    let currentX = -this.windowWidth / 2;

    for (let i = 0; i < this.bottomFrameConfigs.length; i++) {
      const config = this.bottomFrameConfigs[i];
      const frameWidth = config.width;

      const frame = this.frameService.buildFrame(
        frameWidth,
        config.height,
        config.lowHeight ?? 1,
        this.frameThickness,
        this.interiorGap,
        config.openingDirection,
        config.horizontalGlazingBarsNb,
        config.verticalGlazingBarsNb,
        config.shape,
        config.stileNb,
        config.railNb
      );

      // 🔁 Vérifie si c’est le premier frame et qu’il est un triangle
      //     et si le deuxième est un rectangle
      if (
        i === 0 &&
        this.bottomFrameConfigs.length > 1 &&
        (config.shape === Shapes.Triangle || config.shape === Shapes.Trapezoid) &&
        this.bottomFrameConfigs[1].shape === Shapes.Rectangle
      ) {
        frame.scale.x *= -1; // 🔁 miroir horizontal
      }


      frame.position.set(
        currentX + frameWidth / 2,
        this.getMaxBottomHeight() / 2,
        0
      );

      currentX += frameWidth - this.frameThickness;

      frames.push(frame);
      bottomFramesGroup.add(frame);
    }

    
    const bottomBox = new THREE.Box3().setFromObject(bottomFramesGroup);
    const bottomCenter = new THREE.Vector3();
    bottomBox.getCenter(bottomCenter);


    if (this.hasTopFrame) {
      const topWidth = this.getTotalBottomFramesWidth() - (this.frameThickness *2);

      const topFrame = this.frameService.buildFrame(
        topWidth,
        this.topFrameConfig.height,
        this.topFrameConfig.lowHeight ?? 0,
        this.frameThickness,
        this.interiorGap,
        this.topFrameConfig.openingDirection,
        this.topFrameConfig.horizontalGlazingBarsNb,
        this.topFrameConfig.verticalGlazingBarsNb,
        this.topFrameConfig.shape,
        this.topFrameConfig.stileNb,
        this.topFrameConfig.railNb
      );

      topFrame.position.set(
        bottomCenter.x,
        this.getMaxBottomHeight() + this.topFrameConfig.height / 2 - this.frameThickness / 2,
        0
      );

      frames.push(topFrame);
      topFrameGroup.add(topFrame);
    }


    this.windowGroup = new THREE.Group();
    this.windowGroup.add(bottomFramesGroup);

    if (this.hasTopFrame) {
      this.windowGroup.add(topFrameGroup);
    }

    // 🧲 Recentrer tout le groupe final autour de (0,0)
    const fullBox = new THREE.Box3().setFromObject(this.windowGroup);
    const fullCenter = new THREE.Vector3();
    fullBox.getCenter(fullCenter);
    this.windowGroup.position.x -= fullCenter.x;
    this.windowGroup.position.y -= fullCenter.y;

    this.scene.add(this.windowGroup);

    const size = new THREE.Vector3();
    fullBox.getSize(size);
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
    this.renderer.setPixelRatio(this.previewContainerRef.nativeElement.devicePixelRatio);
    this.renderer.setClearColor(0x000000, 0);

    const height = window.innerHeight;
    const width = height;
    this.renderer.setSize(width, height);
    this.previewContainerRef.nativeElement.appendChild(this.renderer.domElement);

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

  toggleTopFrame() {
    this.hasTopFrame = !this.hasTopFrame;
    this.onDimensionChange();
  }

  addBottomFrame() {
    this.bottomFrameConfigs.push(this.createDefaultConfig());
    this.bottomFrameNb = this.bottomFrameConfigs.length;
    this.onDimensionChange();
  }

  removeBottomFrame(index: number) {
    if (this.bottomFrameConfigs.length > 1) {
      this.bottomFrameConfigs.splice(index, 1);
      this.bottomFrameNb = this.bottomFrameConfigs.length;
      this.onDimensionChange();
    }
  }

  getTotalBottomFramesWidth(): number {
    const frameCount = this.bottomFrameConfigs.length;
    const widthsSum = this.bottomFrameConfigs.reduce((sum, config) => sum + config.width, 0);
    const spacing = (frameCount - 1) * this.frameThickness;
    return widthsSum + spacing;
  }

  getMaxBottomHeight(): number {
    return Math.max(...this.bottomFrameConfigs.map(cfg => cfg.height));
  }

}
