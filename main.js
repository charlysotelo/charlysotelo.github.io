// Scene setup
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
const renderer = new THREE.WebGLRenderer();
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);

// Point cloud
const particleCount = 14400;
const geometry = new THREE.BufferGeometry();
const positions = new Float32Array(particleCount * 3);
const colors = new Float32Array(particleCount * 3);
const basePositions = new Float32Array(particleCount * 3); // To store original animated positions

const gridSize = Math.sqrt(particleCount);
const scale = 70;

// Function definitions
const functions = {
    doubleSine: {
        init: (x, z) => (Math.sin(x) + Math.sin(z)) * 1,
        animate: (x, z, time) => (Math.sin(x + time) + Math.sin(z + time)) * 1
    },
    interference: {
        init: (x, z) => Math.sin(x * 0.5) * Math.cos(z * 0.5) * 1,
        animate: (x, z, time) => Math.sin(x * 0.5 + time) * Math.cos(z * 0.5 + time) * 1
    },
    radial: {
        init: (x, z) => Math.sin(Math.sqrt(x * x + z * z)) * 1,
        animate: (x, z, time) => Math.sin(Math.sqrt(x * x + z * z) + time) * 1
    },
    saddleTwist: {
        init: (x, z) => (x * x - z * z) * 0.05 + Math.sin(x + z) * 0.4,
        animate: (x, z, time) => (x * x - z * z) * 0.05 + Math.sin(x + z + time) * 0.4
    }
};

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

        basePositions[idx * 3] = x;
        basePositions[idx * 3 + 1] = y;
        basePositions[idx * 3 + 2] = z;

        colors[idx * 3] = 0;
        colors[idx * 3 + 1] = 1;
        colors[idx * 3 + 2] = 0;
    }
}

geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));

const material = new THREE.PointsMaterial({
    size: 0.1,
    map: circleTexture,
    transparent: true,
    vertexColors: true
});
const points = new THREE.Points(geometry, material);
scene.add(points);

// Camera and raycaster
camera.position.set(0, 4, 4);
camera.lookAt(0, 0, 0);
const raycaster = new THREE.Raycaster();
const mouse = new THREE.Vector2();

// Mouse event handler
document.addEventListener('mousemove', (event) => {
    mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
    mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;
});

// Function to reset positions
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
    
    // Update base positions with animation
    for (let i = 0; i < particleCount; i++) {
        const x = positions[i * 3];
        const z = positions[i * 3 + 2];
        basePositions[i * 3 + 1] = currentFunction.animate(x, z, time);
        positions[i * 3 + 1] = basePositions[i * 3 + 1]; // Default to base position
    }

    // Apply displacement based on mouse position
    raycaster.setFromCamera(mouse, camera);
    const intersects = raycaster.intersectObject(points);
    if (intersects.length > 0) {
        const mousePos = intersects[0].point;
        
        for (let i = 0; i < particleCount; i++) {
            const idx = i * 3;
            const x = positions[idx];
            const z = positions[idx + 2];
            
            // Calculate distance from mouse position
            const dx = x - mousePos.x;
            const dz = z - mousePos.z;
            const distance = Math.sqrt(dx * dx + dz * dz);
            
            // Apply displacement if within range
            const maxDistance = 10; // Radius of effect
            const maxDisplacement = -2; // Maximum downward displacement
            if (distance < maxDistance) {
                const strength = (1 - distance / maxDistance); // 1 at center, 0 at edge
                positions[idx + 1] = basePositions[idx + 1] + maxDisplacement * strength;
            }
        }
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
