import * as THREE from 'three';
import { CameraControls } from './controls/CameraControls.js';
import { generateTrees } from './objects/tree.js';
import { generateLakes } from './objects/lake.js';
import { addGroundToScene } from './objects/ground.js';
import { DayNightCycle } from './weather/dayNightCycle.js';
import { FogEffect } from './weather/fogEffect.js';
import { StarEffect } from './weather/starEffect.js';
import { SunMoonEffect } from './weather/sunMoonEffect.js';
import { RainEffect } from './weather/rainEffect.js';

// Main environment class managing scene, camera, renderer, objects, and weather effects
export class Environment {
    // Configurable properties
    groundSize = 400;
    numTrees = 400;
    minTreeDistance = 10;
    numLakes = 40;
    lakeMinSize = 10;
    lakeMaxSize = 30;
    rainAreaSize = 200;

    constructor() {
        this.rainEnabled = true;
        this._setupScene();
        this._setupCamera();
        this._setupRenderer();
        addGroundToScene(this);
        this.lakeData = generateLakes(this);
        this.trees = generateTrees(this);
        this._addLights();

        // Weather and effects
        this.fogEffect = new FogEffect(this.scene);
        this.starEffect = new StarEffect(this.scene);
        this.sunMoonEffect = new SunMoonEffect(this.scene);
        this.rainEffect = new RainEffect(this.scene, { lakeData: this.lakeData, areaSize: this.rainAreaSize });
        // Day-night cycle, passing all effects
        this.dayNightCycle = new DayNightCycle(this.scene, {
            sunMoonEffect: this.sunMoonEffect,
            ambient: this._findAmbient(),
            fogEffect: this.fogEffect,
            starEffect: this.starEffect
        });

        this._setupControls();

        this.animate = this.animate.bind(this);
        this.onWindowResize = this.onWindowResize.bind(this);

        // Add rain toggle button logic
        const btn = document.getElementById('toggleRainBtn');
        if (btn) {
            btn.onclick = () => {
                this.rainEnabled = !this.rainEnabled;
                btn.textContent = this.rainEnabled ? "Turn Rain Off" : "Turn Rain On";
                if (!this.rainEnabled) {
                    this.rainEffect.clearRain(); // <-- clear all rain visuals
                }
                this.starEffect.setRainState(this.rainEnabled);
                this.dayNightCycle.setRainState(this.rainEnabled);
                this.sunMoonEffect.setRainState(this.rainEnabled);
            };
        }
        // Ensure rain state is set for all effects at startup
        this.starEffect.setRainState(this.rainEnabled);
        this.dayNightCycle.setRainState(this.rainEnabled);
        this.sunMoonEffect.setRainState(this.rainEnabled);

    }

    // Sets up the main scene
    _setupScene() {
        this.scene = new THREE.Scene();
        // Optionally set initial fog here if needed
        // this.scene.fog = new THREE.Fog(this.fogColor, 8, 60);
    }

    // Sets up the camera
    _setupCamera() {
        this.camera = new THREE.PerspectiveCamera(
            75, window.innerWidth / window.innerHeight, 0.1, 1000
        );
        this.camera.position.set(0, 2, 5);
        this.cameraHolder = new THREE.Object3D();
        this.cameraHolder.position.copy(this.camera.position);
        this.camera.position.set(0, 0, 0);
        this.cameraHolder.add(this.camera);
        this.scene.add(this.cameraHolder);
    }

    // Sets up the renderer
    _setupRenderer() {
        this.renderer = new THREE.WebGLRenderer({ antialias: true });
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        document.body.appendChild(this.renderer.domElement);
    }

    // Sets up camera controls
    _setupControls() {
        this.controls = new CameraControls(this.camera, this.cameraHolder, this.renderer.domElement);
    }

    // Adds basic lights to the scene
    _addLights() {
        // Add a low-intensity ambient light first
        const ambient = new THREE.AmbientLight(0xffffff, 0.2);
        this.scene.add(ambient);

        // Then add the directional light (sun)
        const light = new THREE.DirectionalLight(0xffffff, 1);
        light.position.set(10, 20, 10);
        this.scene.add(light);
    }

    // Finds the sun directional light
    _findSun() {
        return this.scene.children.find(obj => obj.isDirectionalLight);
    }

    // Finds the ambient light
    _findAmbient() {
        return this.scene.children.find(obj => obj.isAmbientLight);
    }

    // Main animation loop
    animate() {
        requestAnimationFrame(this.animate);
        this.controls.update();

        const delta = 1 / 60;
        this.dayNightCycle.update(delta);
        if (this.rainEnabled) {
            this.rainEffect.update(delta);
        }
        this.renderer.render(this.scene, this.camera);
    }

    // Starts the environment
    start() {
        window.addEventListener('resize', this.onWindowResize);
        this.animate();
    }

    // Handles window resize events
    onWindowResize() {
        this.camera.aspect = window.innerWidth / window.innerHeight;
        this.camera.updateProjectionMatrix();
        this.renderer.setSize(window.innerWidth, window.innerHeight);
    }
}