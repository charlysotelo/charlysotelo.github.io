// Scene setup
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
const renderer = new THREE.WebGLRenderer();
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);

// Point cloud
const particleCount = 10000;
const geometry = new THREE.BufferGeometry();
const positions = new Float32Array(particleCount * 3);
const colors = new Float32Array(particleCount * 3);

const gridSize = Math.sqrt(particleCount);
const scale = 60; // Large grid to fill screen

// Function definitions with amplitude reduced by factor of 5
const functions = {
    doubleSine: { // Default
        init: (x, z) => (Math.sin(x) + Math.sin(z)) * 1, // Was * 5, now * 1
        animate: (x, z, time) => (Math.sin(x + time) + Math.sin(z + time)) * 1
    },
    interference: { // GitHub hover
        init: (x, z) => Math.sin(x * 0.5) * Math.cos(z * 0.5) * 1,
        animate: (x, z, time) => Math.sin(x * 0.5 + time) * Math.cos(z * 0.5 + time) * 1
    },
    radial: { // LinkedIn hover
        init: (x, z) => Math.sin(Math.sqrt(x * x + z * z)) * 1,
        animate: (x, z, time) => Math.sin(Math.sqrt(x * x + z * z) + time) * 1
    },
    saddleTwist: { // Steam hover
        init: (x, z) => (x * x - z * z) * 0.05 + Math.sin(x + z) * 0.4, // Adjusted: * 2 / 5 = * 0.4
        animate: (x, z, time) => (x * x - z * z) * 0.05 + Math.sin(x + z + time) * 0.4
    }
};

// Initialize with Double Sine Wave as default
let currentFunction = functions.interference;

for (let i = 0; i < gridSize; i++) {
    for (let j = 0; j < gridSize; j++) {
        const idx = (i * gridSize + j);
        if (idx >= particleCount) break;

        const x = (i / (gridSize - 1) - 0.5) * scale;
        const z = (j / (gridSize - 1) - 0.5) * scale;
        const y = currentFunction.init(x, z);

        positions[idx * 3] = x;
        positions[idx * 3 + 1] = y;
        positions[idx * 3 + 2] = z;

        colors[idx * 3] = 1;
        colors[idx * 3 + 1] = 1;
        colors[idx * 3 + 2] = 1;
    }
}

geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));

const material = new THREE.PointsMaterial({ size: 0.005, vertexColors: true });
const points = new THREE.Points(geometry, material);
scene.add(points);

// Camera position
camera.position.set(0, 4, 4);
camera.lookAt(0, 0, 0);

// Hover interactions
const githubLink = document.getElementById('githubLink');
const linkedinLink = document.getElementById('linkedinLink');
const steamLink = document.getElementById('steamLink');

// Function to reset positions to initial state of current function
function resetPositions() {
    const positions = points.geometry.attributes.position.array;
    for (let i = 0; i < particleCount; i++) {
        const x = positions[i * 3];
        const z = positions[i * 3 + 2];
        positions[i * 3 + 1] = currentFunction.init(x, z);
    }
    points.geometry.attributes.position.needsUpdate = true;
}

// Animation
let time = 0;
function animate() {
    requestAnimationFrame(animate);

    const positions = points.geometry.attributes.position.array;
    for (let i = 0; i < particleCount; i++) {
        const x = positions[i * 3];
        const z = positions[i * 3 + 2];
        positions[i * 3 + 1] = currentFunction.animate(x, z, time);
    }
    points.geometry.attributes.position.needsUpdate = true;

    points.rotation.y += 0.001;

    time += 0.02;
    renderer.render(scene, camera);
}
animate();

// Resize handler
window.addEventListener('resize', () => {
    renderer.setSize(window.innerWidth, window.innerHeight);
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
});
