import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';

// --- Application State ---
const state = {
  color: '#222222',
  fabricType: 'cotton',
  graphicTexture: null,
  graphicScale: 1.0,
  graphicOffsetY: 0.0
};

// --- Scene Setup ---
const container = document.getElementById('canvas-container');
const scene = new THREE.Scene();
scene.background = new THREE.Color(0x0f172a);

const camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 0.1, 100);
camera.position.set(0, 0, 3.5);

const renderer = new THREE.WebGLRenderer({ antialias: true, preserveDrawingBuffer: true });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.2;
container.appendChild(renderer.domElement);

const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;
controls.minDistance = 1.5;
controls.maxDistance = 6;

// --- Lighting ---
const ambientLight = new THREE.AmbientLight(0xffffff, 0.8);
scene.add(ambientLight);

const keyLight = new THREE.DirectionalLight(0xffffff, 1.5);
keyLight.position.set(3, 4, 3);
scene.add(keyLight);

const fillLight = new THREE.DirectionalLight(0x88bbff, 0.6);
fillLight.position.set(-3, -1, -2);
scene.add(fillLight);

// --- Procedural Texture Generators ---
function createProceduralFabricNormalMap({ type = 'cotton', size = 512, scale = 40 }) {
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d');
  const imgData = ctx.createImageData(size, size);
  const data = imgData.data;

  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const u = (x / size) * scale * Math.PI * 2;
      const v = (y / size) * scale * Math.PI * 2;
      let dx = 0, dy = 0;

      if (type === 'cotton') {
        dx = Math.cos(u) * Math.sin(v) * 0.7;
        dy = Math.sin(u) * Math.cos(v) * 0.7;
      } else { // fleece
        const noise = (Math.random() - 0.5) * 0.6;
        dx = (Math.sin(u * 0.4) + noise) * 0.5;
        dy = (Math.cos(v * 0.4) + noise) * 0.5;
      }

      const nx = Math.max(-1, Math.min(1, dx));
      const ny = Math.max(-1, Math.min(1, dy));
      const nz = Math.sqrt(Math.max(0, 1 - nx * nx - ny * ny));

      const idx = (y * size + x) * 4;
      data[idx]     = Math.floor((nx * 0.5 + 0.5) * 255);
      data[idx + 1] = Math.floor((ny * 0.5 + 0.5) * 255);
      data[idx + 2] = Math.floor((nz * 0.5 + 0.5) * 255);
      data[idx + 3] = 255;
    }
  }

  ctx.putImageData(imgData, 0, 0);
  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  return texture;
}

const cottonNormal = createProceduralFabricNormalMap({ type: 'cotton', scale: 60 });
cottonNormal.repeat.set(3, 3);

const fleeceNormal = createProceduralFabricNormalMap({ type: 'fleece', scale: 20 });
fleeceNormal.repeat.set(2, 2);

// --- Material Setup ---
const garmentMaterial = new THREE.MeshPhysicalMaterial({
  color: new THREE.Color(state.color),
  roughness: 0.85,
  metalness: 0.0,
  normalMap: cottonNormal,
  normalScale: new THREE.Vector2(0.5, 0.5),
  sheen: 0.5,
  sheenRoughness: 0.8,
  sheenColor: new THREE.Color(0xffffff)
});

// --- Dynamic Graphic Compositing Canvas ---
const compositeCanvas = document.createElement('canvas');
compositeCanvas.width = 1024;
compositeCanvas.height = 1024;
const compositeCtx = compositeCanvas.getContext('2d');
const textureMap = new THREE.CanvasTexture(compositeCanvas);
garmentMaterial.map = textureMap;

function updateCompositeTexture() {
  compositeCtx.clearRect(0, 0, 1024, 1024);

  if (state.graphicTexture && state.graphicTexture.image) {
    const img = state.graphicTexture.image;
    const aspect = img.width / img.height;
    
    const baseWidth = 300 * state.graphicScale;
    const baseHeight = baseWidth / aspect;
    
    const x = (1024 - baseWidth) / 2;
    const y = (1024 - baseHeight) / 2 - (state.graphicOffsetY * 500);

    compositeCtx.drawImage(img, x, y, baseWidth, baseHeight);
  }

  textureMap.needsUpdate = true;
}

// --- Procedural Garment Geometry (T-Shirt Body) ---
const garmentGroup = new THREE.Group();

const torsoGeo = new THREE.CylinderGeometry(0.5, 0.52, 1.2, 32, 1, true);
const torso = new THREE.Mesh(torsoGeo, garmentMaterial);
garmentGroup.add(torso);

const sleeveLeftGeo = new THREE.CylinderGeometry(0.18, 0.2, 0.45, 16);
const sleeveLeft = new THREE.Mesh(sleeveLeftGeo, garmentMaterial);
sleeveLeft.position.set(-0.62, 0.35, 0);
sleeveLeft.rotation.z = Math.PI / 3.5;
garmentGroup.add(sleeveLeft);

const sleeveRight = sleeveLeft.clone();
sleeveRight.position.x = 0.62;
sleeveRight.rotation.z = -Math.PI / 3.5;
garmentGroup.add(sleeveRight);

scene.add(garmentGroup);

// --- Event Handlers & UI Controls ---
document.getElementById('color-picker').addEventListener('input', (e) => {
  state.color = e.target.value;
  garmentMaterial.color.set(state.color);
});

document.getElementById('fabric-select').addEventListener('change', (e) => {
  state.fabricType = e.target.value;
  if (state.fabricType === 'cotton') {
    garmentMaterial.normalMap = cottonNormal;
    garmentMaterial.normalScale.set(0.5, 0.5);
    garmentMaterial.roughness = 0.85;
    garmentMaterial.sheen = 0.4;
  } else {
    garmentMaterial.normalMap = fleeceNormal;
    garmentMaterial.normalScale.set(1.2, 1.2);
    garmentMaterial.roughness = 0.95;
    garmentMaterial.sheen = 0.9;
  }
  garmentMaterial.needsUpdate = true;
});

document.getElementById('graphic-upload').addEventListener('change', (e) => {
  const file = e.target.files[0];
  if (file) {
    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        state.graphicTexture = { image: img };
        updateCompositeTexture();
      };
      img.src = event.target.result;
    };
    reader.readAsDataURL(file);
  }
});

document.getElementById('graphic-scale').addEventListener('input', (e) => {
  state.graphicScale = parseFloat(e.target.value);
  updateCompositeTexture();
});

document.getElementById('graphic-offset-y').addEventListener('input', (e) => {
  state.graphicOffsetY = parseFloat(e.target.value);
  updateCompositeTexture();
});

document.getElementById('export-btn').addEventListener('click', () => {
  renderer.render(scene, camera);
  const dataURL = renderer.domElement.toDataURL('image/png');
  const link = document.createElement('a');
  link.download = 'apparel-mockup.png';
  link.href = dataURL;
  link.click();
});

window.addEventListener('resize', () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});

// --- Animation Loop ---
function animate() {
  requestAnimationFrame(animate);
  controls.update();
  renderer.render(scene, camera);
}

updateCompositeTexture();
animate();
