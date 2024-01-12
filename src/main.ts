import * as THREE from 'three';
import { DragControls } from 'three/examples/jsm/controls/DragControls';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';

class CubeScene {
  private scene: THREE.Scene;
  private camera: THREE.PerspectiveCamera;
  private renderer: THREE.WebGLRenderer;
  private cube: THREE.Mesh;
  private dragControls: DragControls | null = null;
  private scaleControls: THREE.Mesh[] = [];
  private orbitControls: OrbitControls;
  private originalColor: THREE.Color;
  private highlightedColor: THREE.Color;
  private outline: THREE.LineSegments | null = null;
  private isCubeActive: boolean = false;
  private animationStartTime: number = 0;
  private animationDuration: number = 500;
  private initialControlPositions: { [key: string]: THREE.Vector3 } = {};

  constructor() {
    this.scene = new THREE.Scene();
    this.camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    this.renderer = new THREE.WebGLRenderer();
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    document.body.appendChild(this.renderer.domElement);

    const geometry = new THREE.BoxGeometry();
    this.originalColor = new THREE.Color(0x808080);
    const material = new THREE.MeshBasicMaterial({ color: this.originalColor });
    this.cube = new THREE.Mesh(geometry, material);
    this.cube.name = "cube_1";
    this.scene.add(this.cube);

    this.highlightedColor = new THREE.Color(0xa0a0a0);

    this.camera.position.z = 5;

    this.orbitControls = new OrbitControls(this.camera, this.renderer.domElement);
    this.orbitControls.enableDamping = true;
    this.orbitControls.dampingFactor = 0.05;
    this.orbitControls.rotateSpeed = 0.5;
    this.addEventListeners();
    this.animate();
  }

  private createScaleControls() {
    const controlScale = 0.5;
    const scaleControlGeometry = new THREE.SphereGeometry(0.1, 32, 32);
    const scaleControlMaterialX = new THREE.MeshBasicMaterial({ color: 0xff0000 });
    const scaleControlMaterialY = new THREE.MeshBasicMaterial({ color: 0x00ff00 });
    const scaleControlMaterialZ = new THREE.MeshBasicMaterial({ color: 0x0000ff });

    const controlX = new THREE.Mesh(scaleControlGeometry, scaleControlMaterialX);
    const controlY = new THREE.Mesh(scaleControlGeometry, scaleControlMaterialY);
    const controlZ = new THREE.Mesh(scaleControlGeometry, scaleControlMaterialZ);
    controlX.name = "control_X";
    controlY.name = "control_Y";
    controlZ.name = "control_Z";

    this.initialControlPositions[controlX.name] = controlX.position.clone();
    this.initialControlPositions[controlY.name] = controlY.position.clone();
    this.initialControlPositions[controlZ.name] = controlZ.position.clone();
    controlX.position.x = 1.5;
    controlY.position.y = 1.5;
    controlZ.position.z = 1.5;

    this.scaleControls.push(controlX, controlY, controlZ);
    this.scene.add(...this.scaleControls);
  }

  private addEventListeners() {
    window.addEventListener('resize', () => this.onWindowResize(), false);
    window.addEventListener('mousedown', (event) => this.onMouseDown(event), false);
  }

  private onMouseDown(event: MouseEvent): void {
    const raycaster = new THREE.Raycaster();
    const mouse = new THREE.Vector2();

    mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
    mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;

    raycaster.setFromCamera(mouse, this.camera);
    const intersects = raycaster.intersectObjects(this.scene.children);

    if (intersects.length > 0) {
      const clickedObject = intersects[0].object;

      if (clickedObject.name === "cube_1" || clickedObject.type == "LineSegments" || clickedObject.name === "control_X" || clickedObject.name === "control_Y" || clickedObject.name === "control_Z") {
        if (!this.isCubeActive) {
          this.activateCube();
        }
      } else {
        if (this.isCubeActive) {
          this.deactivateCube();
        }
      }
    } else {
      if (this.isCubeActive) {
        this.deactivateCube();
      }
    }
  }



  private activateCube() {
    this.isCubeActive = true;

    this.createScaleControls();
    this.enableDragControls();

    this.animateColor(this.cube.material.color, this.highlightedColor);
    const edges = new THREE.EdgesGeometry(new THREE.BoxGeometry(this.cube.scale.x, this.cube.scale.y, this.cube.scale.z));
    this.outline = new THREE.LineSegments(
      edges,
      new THREE.LineBasicMaterial({ color: 0x00FF00, linewidth: 2 })
    );
    this.scene.add(this.outline);
  }

  private deactivateCube() {
    this.isCubeActive = false;
    this.orbitControls.rotateSpeed = 0.5;
    this.removeScaleControls();
    this.disableDragControls();
    this.resetControlPositions();
    this.animateColor(this.cube.material.color, this.originalColor);
    this.removeOutline();
  }

  private resetControlPositions() {
    for (const control of this.scaleControls) {
      const initialPosition = this.initialControlPositions[control.name];
      control.position.copy(initialPosition);
    }
  }

  private removeScaleControls() {
    this.scene.remove(...this.scaleControls);
    this.scaleControls = [];
  }

  private enableDragControls() {
    this.dragControls = new DragControls(this.scaleControls, this.camera, this.renderer.domElement);

    this.dragControls.addEventListener('drag', (event) => {
      const control = event.object;
      this.orbitControls.rotateSpeed = 0;

      if (control === this.scaleControls[0]) {
        control.position.y = this.cube.position.y;
        control.position.z = this.cube.position.z;
      } else if (control === this.scaleControls[1]) {
        control.position.x = this.cube.position.x;
        control.position.z = this.cube.position.z;
      } else if (control === this.scaleControls[2]) {
        control.position.x = this.cube.position.x;
        control.position.y = this.cube.position.y;
      }

      this.updateCubeScale();
    });
  }

  private disableDragControls() {
    if (this.dragControls) {
      this.dragControls.dispose();
      this.dragControls = null;
    }
  }

  private animateColor(targetColor: THREE.Color, finalColor: THREE.Color) {
    this.animationStartTime = performance.now();
    const startColor = new THREE.Color().copy(this.cube.material.color);

    const updateColor = () => {
      const now = performance.now();
      const progress = (now - this.animationStartTime) / this.animationDuration;

      if (progress < 1) {
        const easedProgress = this.easeInOutCubic(progress);
        const newColor = startColor.clone().lerp(finalColor, easedProgress);
        this.cube.material.color.copy(newColor);
        requestAnimationFrame(updateColor);
      } else {
        this.cube.material.color.copy(finalColor);
      }
    };

    updateColor();
  }

  private easeInOutCubic(t: number) {
    return t < 0.5 ? 4 * t * t * t : (t - 1) * (2 * t - 2) * (2 * t - 2) + 1;
  }

  private updateCubeScale() {
    console.log(Math.abs(this.scaleControls[2].position.z - this.cube.position.z));

    this.cube.scale.x = Math.abs(this.scaleControls[0].position.x - this.cube.position.x) / 1.5;
    this.cube.scale.y = Math.abs(this.scaleControls[1].position.y - this.cube.position.y) / 1.5;
    this.cube.scale.z = Math.abs(this.scaleControls[2].position.z - this.cube.position.z) / 1.5;

    this.removeOutline();
    const edges = new THREE.EdgesGeometry(new THREE.BoxGeometry(this.cube.scale.x, this.cube.scale.y, this.cube.scale.z));
    this.outline = new THREE.LineSegments(
      edges,
      new THREE.LineBasicMaterial({ color: 0x00FF00, linewidth: 2 })
    );
    this.scene.add(this.outline);
  }

  private removeOutline() {
    if (this.outline) {
      this.scene.remove(this.outline);
      this.outline = null;
    }
  }

  private onWindowResize() {
    this.camera.aspect = window.innerWidth / window.innerHeight;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(window.innerWidth, window.innerHeight);
  }

  private animate() {
    requestAnimationFrame(() => this.animate());
    this.orbitControls.update();
    this.renderer.render(this.scene, this.camera);
  }
}

new CubeScene();
