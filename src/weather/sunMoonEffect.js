import * as THREE from 'three';

export class SunMoonEffect {
    constructor(scene, options = {}) {
        this.scene = scene;
        this.sun = this._createSunLight();
        this.sunMesh = this._createSunMesh();
        this.scene.add(this.sunMesh);

        this.moonMesh = this._createMoonMesh();
        this.scene.add(this.moonMesh);

        this.moonLight = this._createMoonLight();
    }

    // Sets whether it is currently raining
    setRainState(isRaining) {
        this.isRaining = isRaining;
    }

    // Helper to create or find the sun light
    _createSunLight() {
        let sun = this.scene.children.find(obj => obj.isDirectionalLight);
        if (!sun) {
            sun = new THREE.DirectionalLight(0xffffff, 1);
            sun.position.set(10, 20, 10);
            this.scene.add(sun);
        }
        return sun;
    }

    // Helper to create the sun mesh
    _createSunMesh() {
        const geometry = new THREE.SphereGeometry(20, 32, 32);
        const material = new THREE.MeshBasicMaterial({
            color: 0xffee88,
            emissive: 0xffee88,
            fog: false
        });
        const mesh = new THREE.Mesh(geometry, material);
        mesh.name = "sunMesh";
        return mesh;
    }

    // Helper to create the moon mesh
    _createMoonMesh() {
        const geometry = new THREE.SphereGeometry(16, 32, 32);
        const material = new THREE.MeshBasicMaterial({
            color: 0xbbeeff,
            emissive: 0xbbeeff,
            fog: false
        });
        const mesh = new THREE.Mesh(geometry, material);
        mesh.name = "moonMesh";
        return mesh;
    }

    // Helper to create or find the moon ambient light
    _createMoonLight() {
        let moonLight = this.scene.children.find(obj => obj.isAmbientLight && obj.name === "moonAmbient");
        if (!moonLight) {
            moonLight = new THREE.AmbientLight(0xbbeeff, 0.2);
            moonLight.name = "moonAmbient";
            this.scene.add(moonLight);
        }
        return moonLight;
    }

    // Updates the sun and moon positions based on sunAngle
    update(sunAngle, cameraPos) {
        if (this.scene.fog) {
            const fogDensity = this.scene.fog.density;
            const maxFog = 0.010; // match your night fog density
            const minFog = 0.005; // match your day fog density
            const fade = 1 - (fogDensity - minFog) / (maxFog - minFog);
            this.sunMesh.material.opacity = Math.max(0, Math.min(1, fade));
            this.sunMesh.material.transparent = true;
        }
        // Sun
        const sunDistance = 500;
        const sunY = Math.sin(sunAngle) * sunDistance * 0.5 + sunDistance * 0.25;
        const sunX = Math.cos(sunAngle) * sunDistance * 0.7;
        const sunZ = -sunDistance;
        const horizonY = 0;

        this.sunMesh.position.set(cameraPos.x + sunX, cameraPos.y + sunY, cameraPos.z + sunZ);
        this.sunMesh.visible = sunY > horizonY && !this.isRaining;
        this.sun.intensity = sunY > horizonY ? (0.2 + 0.8 * Math.max(0, sunY / sunDistance)) : 0;
        this.sun.position.set(sunX, sunY, sunZ);

        // Moon (opposite the sun)
        const moonAngle = sunAngle + Math.PI;
        const moonDistance = 500;
        const moonY = Math.sin(moonAngle) * moonDistance * 0.5 + moonDistance * 0.25;
        const moonX = Math.cos(moonAngle) * moonDistance * 0.7;
        const moonZ = -moonDistance;

        this.moonMesh.position.set(cameraPos.x + moonX, cameraPos.y + moonY, cameraPos.z + moonZ);
        const moonVisible = moonY > horizonY && Math.sin(sunAngle) < 0;
        this.moonMesh.visible = moonVisible && !this.isRaining;
        this.moonLight.intensity = 0.2 * Math.max(0, -Math.sin(sunAngle));
    }
}