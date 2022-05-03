import * as THREE from "three";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";

const addFog = (scene, color, near, far) => {
  scene.fog = new THREE.Fog(color, near, far);
};

const setUpScene = (scene) => {
  addFog(scene, 0xe0e0e0, 20, 100);
};

const addGround = (scene, dimension, color) => {
  const mesh = new THREE.Mesh(
    new THREE.PlaneBufferGeometry(dimension, dimension),
    new THREE.MeshPhongMaterial({ color, depthWrite: false })
  );
  mesh.rotation.x = -Math.PI / 2;
  scene.add(mesh);
};

const addGrid = (scene, size, division, color1, color2) => {
  const grid = new THREE.GridHelper(size, division, color1, color2);
  grid.material.opacity = 0.2;
  grid.material.transparent = true;
  scene.add(grid);
};

const setupBasicLights = (scene) => {
  const ambientLight = new THREE.AmbientLight(0xffffff, 0.9);
  scene.add(ambientLight);

  const directionalLight = new THREE.DirectionalLight(0xffffff, 0.6);
  directionalLight.castShadow = true;
  directionalLight.shadow.mapSize.set(1024, 1024);
  directionalLight.shadow.camera.far = 15;
  directionalLight.shadow.camera.left = -7;
  directionalLight.shadow.camera.top = 7;
  directionalLight.shadow.camera.right = 7;
  directionalLight.shadow.camera.bottom = -7;
  directionalLight.position.set(5, 5, 5);
  scene.add(directionalLight);

  const pointLight = new THREE.PointLight(0xffffff, 1, 100);
  pointLight.position.set(-2, 3, 3);
  scene.add(pointLight);
};

const setUpCamera = (sizes) => {
  const camera = new THREE.PerspectiveCamera(
    75,
    sizes.width / sizes.height,
    0.1,
    100
  );
  camera.position.set(-5, 3, 10);
  camera.lookAt(new THREE.Vector3(0, 2, 0));

  return camera;
};

const setUpControls = (camera, canvas) => {
  const controls = new OrbitControls(camera, canvas);
  controls.target.set(0, 0.75, 0);
  controls.enableDamping = true;

  return controls;
};

const setUpRenderer = (canvas, sizes) => {
  const renderer = new THREE.WebGLRenderer({
    canvas: canvas,
    antialias: true,
  });
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  renderer.setSize(sizes.width, sizes.height);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.outputEncoding = THREE.sRGBEncoding;

  return renderer;
};

const setUpEventListners = (camera, renderer, sizes) => {
  window.addEventListener("resize", () => {
    // Update sizes
    sizes.width = window.innerWidth;
    sizes.height = window.innerHeight;

    // Update camera
    camera.aspect = sizes.width / sizes.height;
    camera.updateProjectionMatrix();

    // Update renderer
    renderer.setSize(sizes.width, sizes.height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  });
};

const loadModel = (scene, modelPath) => {
  console.log(modelPath);
  const gltfLoader = new GLTFLoader();

  gltfLoader.load(
    modelPath,
    (gltf) => {
      const model = gltf.scene;

      scene.add(model);
    },
    (progress) => {
      console.log("progress");
    },
    (error) => {
      console.log(error);
    }
  );
};

const utils = {
  setUpScene,
  addGround,
  addGrid,
  setupBasicLights,
  setUpCamera,
  setUpControls,
  setUpRenderer,
  setUpEventListners,
  loadModel,
};

export default utils;
