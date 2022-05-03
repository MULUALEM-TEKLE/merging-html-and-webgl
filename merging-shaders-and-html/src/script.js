import "./style.css";
// import utils from "./utils";
// import main from "./main";
import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls";
import imagesLoaded from "imagesloaded";
import FontFaceObserver from "fontfaceobserver";
// import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
// import { DRACOLoader } from "three/examples/jsm/loaders/DRACOLoader.js";
import * as dat from "dat.gui";

import gsap from "gsap";

import fragment from "./shader/fragment.glsl";
import vertex from "./shader/vertex.glsl";
import noise from "./shader/noise.glsl";
import { MeshMatcapMaterial } from "three";
import { BufferGeometry } from "three";
import Scroll from "./scroll";

import { EffectComposer } from "three/examples/jsm/postprocessing/EffectComposer.js";
import { RenderPass } from "three/examples/jsm/postprocessing/RenderPass.js";
import { ShaderPass } from "three/examples/jsm/postprocessing/ShaderPass.js";
import { UnrealBloomPass } from "three/examples/jsm/postprocessing/UnrealBloomPass.js";

export default class Sketch {
  constructor(options) {
    this.scene = new THREE.Scene();

    this.time = 0;

    this.container = options.dom;
    this.width = this.container.offsetWidth;
    this.height = this.container.offsetHeight;
    this.renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.setSize(this.width, this.height);
    // this.renderer.setClearColor(0xfff, 1);

    this.container.appendChild(this.renderer.domElement);

    this.camera = new THREE.PerspectiveCamera(
      70,
      window.innerWidth / window.innerHeight,
      100,
      2000
    );
    this.camera.position.z = 600;

    this.camera.fov = 2 * Math.atan(this.height / 2 / 600) * (180 / Math.PI);

    // var frustumSize = 10;
    // var aspect = window.innerWidth / window.innerHeight;
    // this.camera = new THREE.OrthographicCamera( frustumSize * aspect / - 2, frustumSize * aspect / 2, frustumSize / 2, frustumSize / - 2, -1000, 1000 );
    // this.camera.position.set(0, 0, 2);
    this.controls = new OrbitControls(this.camera, this.renderer.domElement);

    this.images = [...document.querySelectorAll("img")];

    /* 
    const fontOpen = new Promise((resolve) => {
      new FontFaceObserver("Open Sans").load().then(() => {
        resolve();
      });
    });

    const fontPlayfair = new Promise((resolve) => {
      new FontFaceObserver("Playfair Display").load().then(() => {
        resolve();
      });
    });

    // Preload images
    const preloadImages = new Promise((resolve, reject) => {
      imagesLoaded(
        document.querySelectorAll("img"),
        { background: true },
        resolve
      );
    });

    let allDone = [fontOpen, fontPlayfair, preloadImages];

    // Promise.all(allDone).then(() => {
    //   // this.scroll = new Scroll();
    //   this.addImages();
    //   this.setPosition();

    //   // this.mouseMovement()
    //   this.resize();
    //   this.setupResize();
    //   // this.addObjects();
    //   // this.composerPass()
    //   this.render();
    //   // window.addEventListener('scroll',()=>{
    //   //     this.currentScroll = window.scrollY;
    //   //     this.setPosition();
    //   // })
    // });

     */
    this.currentScroll = 0;

    this.raycaster = new THREE.Raycaster();
    this.mouse = new THREE.Vector2();

    this.isPlaying = true;

    this.scroll = new Scroll();

    this.addImages();
    this.setPosition();

    this.mouseMovement();
    this.addObjects();
    this.resize();
    this.composerPass();
    this.render();
    this.setupResize();
    this.settings();

    // window.addEventListener("scroll", () => {
    //   console.log(window.scrollY);
    //   this.currentScroll = window.scrollY;
    //   this.setPosition();
    // });
  }

  composerPass() {
    this.composer = new EffectComposer(this.renderer);
    this.renderPass = new RenderPass(this.scene, this.camera);
    this.composer.addPass(this.renderPass);

    //custom shader pass
    var counter = 0.0;
    this.myEffect = {
      uniforms: {
        tDiffuse: { value: null },
        scrollSpeed: { value: null },
        time: { value: null },
      },
      vertexShader: `
      varying vec2 vUv;
      void main() {
        vUv = uv;
        gl_Position = projectionMatrix 
          * modelViewMatrix 
          * vec4( position, 1.0 );
      }
      `,
      fragmentShader: `
      uniform sampler2D tDiffuse;
      varying vec2 vUv;
      uniform float scrollSpeed;
      uniform float time;

      ${noise}

      void main(){
        vec2 newUV = vUv;
        float area = smoothstep(1. , 0.8 , vUv.y) * 2. -1.;
        // area = pow(area , 4.);

        float noise = (cnoise(vec3(vUv *10. , time/5.)) + 1.)  * 0.5;
        float n = smoothstep(0.5 , 0.51 , noise + area);

        newUV.x -= (vUv.x - .5) * .05*area*scrollSpeed;
        // gl_FragColor = texture2D(tDiffuse , newUV);
        gl_FragColor = vec4(n , 0. , 0. , 1.);

        gl_FragColor = mix(vec4(1.) ,  texture2D(tDiffuse , newUV) , n);
      } 
      `,
    };

    this.customPass = new ShaderPass(this.myEffect);
    this.customPass.renderToScreen = true;

    this.composer.addPass(this.customPass);
  }

  mouseMovement() {
    window.addEventListener(
      "mousemove",
      (event) => {
        this.mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
        this.mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;

        this.raycaster.setFromCamera(this.mouse, this.camera);

        const intersects = this.raycaster.intersectObjects(this.scene.children);

        if (intersects.length > 0) {
          // console.log(intersects[0]);
          let obj = intersects[0].object;
          obj.material.uniforms.hover.value = intersects[0].uv;
        }
      },
      false
    );
  }

  settings() {
    let that = this;
    this.settings = {
      progress: 0,
    };
    this.gui = new dat.GUI();
    this.gui.add(this.settings, "progress", 0, 1, 0.01);
  }

  setupResize() {
    window.addEventListener("resize", this.resize.bind(this));
  }

  addImages() {
    this.material = new THREE.ShaderMaterial({
      extensions: {
        derivatives: "#extension GL_OES_standard_derivatives : enable",
      },
      side: THREE.DoubleSide,
      uniforms: {
        time: { value: 0 },
        uImage: {
          value: 0,
        },
        hover: { value: new THREE.Vector2(0.5, 0.5) },
        hoverState: { value: 0 },
        resolution: { value: new THREE.Vector4() },
      },
      // wireframe: true,
      // transparent: true,
      vertexShader: vertex,
      fragmentShader: fragment,
    });

    this.materials = [];

    this.imageStore = this.images.map((img) => {
      let bounds = img.getBoundingClientRect();

      let geometry = new THREE.PlaneBufferGeometry(
        bounds.width,
        bounds.height,
        10,
        10
      );

      let texture = new THREE.Texture(img);
      texture.needsUpdate = true;

      // let material = new THREE.MeshBasicMaterial({
      //   // color: 0xff0000,
      //   map: texture,
      // });

      let material = this.material.clone();

      img.addEventListener("mouseenter", () => {
        gsap.to(material.uniforms.hoverState, {
          value: 1,
          duration: 1,
        });
      });
      img.addEventListener("mouseleave", () => {
        gsap.to(material.uniforms.hoverState, {
          value: 0,
          duration: 1,
        });
      });

      this.materials.push(material);

      material.uniforms.uImage.value = texture;

      let mesh = new THREE.Mesh(geometry, material);

      this.scene.add(mesh);

      return {
        img: img,
        mesh,
        top: bounds.top,
        left: bounds.left,
        width: bounds.width,
        height: bounds.height,
      };
    });

    console.log(this.imageStore);
  }

  setPosition() {
    this.imageStore.forEach((o) => {
      o.mesh.position.y =
        this.currentScroll - o.top + this.height / 2 - o.height / 2;
      o.mesh.position.x = o.left - this.width / 2 + o.width / 2;
    });
  }

  resize() {
    this.width = this.container.offsetWidth;
    this.height = this.container.offsetHeight;
    this.renderer.setSize(this.width, this.height);
    this.camera.aspect = this.width / this.height;
    this.camera.updateProjectionMatrix();
  }

  addObjects() {
    let that = this;
    this.material = new THREE.ShaderMaterial({
      extensions: {
        derivatives: "#extension GL_OES_standard_derivatives : enable",
      },
      side: THREE.DoubleSide,
      uniforms: {
        time: { value: 0 },
        oceantexture: {
          value: new THREE.TextureLoader().load("/images/ocean.jpg"),
        },
        resolution: { value: new THREE.Vector4() },
      },
      wireframe: true,
      // transparent: true,
      vertexShader: vertex,
      fragmentShader: fragment,
    });

    // this.geometry = new THREE.PlaneBufferGeometry(200, 400, 10, 10);
    // this.geometry = new THREE.SphereBufferGeometry(0.4, 40, 40);
    // this.geometry = new THREE.BoxBufferGeometry(1, 1, 1, 40, 40);

    // this.plane = new THREE.Mesh(this.geometry, this.material);
    // this.scene.add(this.plane);
  }

  stop() {
    this.isPlaying = false;
  }

  play() {
    options;
    if (!this.isPlaying) {
      this.render();
      this.isPlaying = true;
    }
  }

  render() {
    if (!this.isPlaying) return;
    this.time += 0.075;
    this.scroll.render();
    this.currentScroll = this.scroll.scrollToRender;
    this.setPosition();

    this.customPass.uniforms.scrollSpeed.value = this.scroll.speedTarget;
    this.customPass.uniforms.time.value = this.time;

    this.materials.forEach((m) => {
      m.uniforms.time.value = this.time;
    });

    // this.material.uniforms.time.value = this.time;
    requestAnimationFrame(this.render.bind(this));
    // this.renderer.render(this.scene, this.camera);
    this.composer.render();
    // this.controls.update();

    // console.log(this.time);
  }
}

new Sketch({
  dom: document.getElementById("container"),
});
