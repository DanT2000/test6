import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';

const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
camera.position.z = 5;
const renderer = new THREE.WebGLRenderer();
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);

// Окружение
const environmentTexture = new THREE.TextureLoader().load('background.jpg');
scene.background = environmentTexture;

// Освещение
const mainLight = new THREE.PointLight(0xffffff, 100);
mainLight.position.set(0, 20, 0);
scene.add(mainLight);

const sideLight = new THREE.DirectionalLight(0xffffff, 1);
sideLight.position.set(5, 4, 14); // Направление бокового света
scene.add(sideLight);

// Настройка теней
mainLight.castShadow = true;
mainLight.shadow.mapSize.width = 4096;
mainLight.shadow.mapSize.height = 4096;
renderer.shadowMap.enabled = true;

// Создание геометрических фигур
const boxGeometry = new THREE.BoxGeometry();
const sphereGeometry = new THREE.SphereGeometry();

// Создание материалов
const boxMaterial = new THREE.MeshStandardMaterial({
  color: 0x00ff00, // Зеленый цвет
  metalness: 0.5,
  roughness: 0.5
});

const sphereMaterial = new THREE.MeshStandardMaterial({
  color: 0xff0000, // Красный цвет
  metalness: 0.8,
  roughness: 0.2
});


const doorTexture = new THREE.TextureLoader().load('door.png');
const platformTexture = new THREE.TextureLoader().load('floor.png');
const platformBumpMap = new THREE.TextureLoader().load('floor_bump.png');
const doorMaterial = new THREE.MeshStandardMaterial({
  color: 0xffffff,
  metalness: 0,
  roughness: 0.5,
  map: doorTexture,
  bumpScale: 0.1 
});


// Создание объектов
const boxMesh = new THREE.Mesh(boxGeometry, boxMaterial);
const sphereMesh = new THREE.Mesh(sphereGeometry, sphereMaterial);
boxMesh.position.x = -2;
sphereMesh.position.x = 2;

boxMesh.castShadow = true;
sphereMesh.castShadow = true;

// Создание платформы
const platformGeometry = new THREE.BoxGeometry(10, 0.1, 10);
const platformMaterial = new THREE.MeshStandardMaterial({
  color: 0xCCCCCC,
  metalness: 0,
  roughness: 0.5,
  map: platformTexture,
  bumpMap: platformBumpMap,
  bumpScale: 1 
});
const platform = new THREE.Mesh(platformGeometry, platformMaterial);
platform.position.y = -2;
platform.receiveShadow = true;

scene.add(platform);
scene.add(boxMesh);
scene.add(sphereMesh);


// Создание двери
const doorGeometry = new THREE.BoxGeometry(1, 2, 0.1);
const door = new THREE.Mesh(doorGeometry, doorMaterial);
door.position.y = -1; // Высота половины двери
door.castShadow = true;
scene.add(door);

// Камера
const controls = new OrbitControls(camera, renderer.domElement);

// Ползунки
const doorWidthSlider: HTMLInputElement = document.createElement('input');
doorWidthSlider.type = 'range';
doorWidthSlider.min = '1';
doorWidthSlider.max = '5';
doorWidthSlider.value = '1';
doorWidthSlider.addEventListener('input', () => {
  door.scale.x = parseFloat(doorWidthSlider.value);
});

const doorHeightSlider: HTMLInputElement = document.createElement('input');
doorHeightSlider.type = 'range';
doorHeightSlider.min = '1';
doorHeightSlider.max = '10';
doorHeightSlider.value = '1';
doorHeightSlider.addEventListener('input', () => {
  door.scale.y = parseFloat(doorHeightSlider.value);
});

// GUI ползунков
const gui: HTMLDivElement = document.createElement('div');
gui.id = 'gui';
gui.appendChild(doorWidthSlider);
gui.appendChild(doorHeightSlider);
document.body.appendChild(gui);

// Рендеринг
function animate() {
  requestAnimationFrame(animate);
  window.addEventListener('resize', () => {
    const newWidth = window.innerWidth;
    const newHeight = window.innerHeight;

    camera.aspect = newWidth / newHeight;
    camera.updateProjectionMatrix();

    renderer.setSize(newWidth, newHeight);
  });

  // Вращение двери
  door.rotation.y += 0.01;

  controls.update();
  renderer.render(scene, camera);
}

animate();
