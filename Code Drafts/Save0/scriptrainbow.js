// Setting up the scene, camera, and renderer
const container = document.getElementById('container');
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
container.appendChild(renderer.domElement);

// Creating the 3D sphere
const geometry = new THREE.SphereGeometry(10, 64, 64);
const material = new THREE.MeshBasicMaterial({ color: 0x0077ff, wireframe: true });
let sphere = new THREE.Mesh(geometry, material);
scene.add(sphere);

// OrbitControls for drag and drop functionality
const controls = new THREE.OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;
controls.dampingFactor = 0.25;
controls.enableZoom = false;

// Check if sphere is added to the scene
console.log('Sphere added:', sphere);

camera.position.z = 30;

// Audio processing setup
let audioContext, analyser, dataArray, audioBuffer, source;
const audioUpload = document.getElementById('audio-upload');
const playbackSlider = document.getElementById('playback-slider');
const colorSelect = document.getElementById('color-select');
audioUpload.addEventListener('change', handleAudioUpload);
playbackSlider.addEventListener('input', handleSliderInput);
colorSelect.addEventListener('change', handleColorChange);

function handleAudioUpload(event) {
    const file = event.target.files[0];
    if (file) {
        const reader = new FileReader();
        reader.onload = function(e) {
            const audioData = e.target.result;
            setupAudio(audioData);
        };
        reader.readAsArrayBuffer(file);
    }
}

function setupAudio(audioData) {
    audioContext = new (window.AudioContext || window.webkitAudioContext)();
    audioContext.decodeAudioData(audioData, (buffer) => {
        audioBuffer = buffer;

        analyser = audioContext.createAnalyser();
        analyser.fftSize = 256;
        const bufferLength = analyser.frequencyBinCount;
        dataArray = new Uint8Array(bufferLength);

        createSourceNode();
        animate();

        // Update the slider's max value based on audio duration
        playbackSlider.max = buffer.duration;
    });
}

function createSourceNode(startTime = 0) {
    if (source) {
        source.stop();
        source.disconnect();
    }
    source = audioContext.createBufferSource();
    source.buffer = audioBuffer;

    source.connect(analyser);
    analyser.connect(audioContext.destination);

    source.start(0, startTime);
}

function handleSliderInput(event) {
    const newTime = parseFloat(event.target.value);
    createSourceNode(newTime);
}

function handleColorChange(event) {
    const color = event.target.value;
    if (color === 'rainbow') {
        createRainbowSphere();
    } else {
        sphere.material.color.setHex(color);
    }
}

function createRainbowSphere() {
    /*scene.remove(sphere);
    const rainbowMaterial = new THREE.MeshBasicMaterial({
        vertexColors: THREE.VertexColors,
        wireframe: true
    });

    geometry.faces.forEach(face => {
        const color = new THREE.Color();
        color.setRGB(Math.random(), Math.random(), Math.random());
        face.vertexColors[0] = color;
        face.vertexColors[1] = color;
        face.vertexColors[2] = color;
    });

    sphere = new THREE.Mesh(geometry, rainbowMaterial);
    scene.add(sphere);*/
}

// Animation loop
function animate() {
    requestAnimationFrame(animate);

    if (analyser) {
        analyser.getByteFrequencyData(dataArray);
        const avgFrequency = dataArray.reduce((sum, value) => sum + value, 0) / dataArray.length;

        // Modifying the sphere geometry based on the audio frequency data
        const scaleFactor = 1 + avgFrequency / 256; // Reduced the factor to keep the sphere within a pleasing size
        sphere.scale.set(scaleFactor, scaleFactor, scaleFactor);

        // Check if sphere is being scaled
        console.log('Sphere scale factor:', scaleFactor);

        // Modifying vertices for a more dynamic effect
        const positions = geometry.attributes.position;
        const vertex = new THREE.Vector3();
        const offset = geometry.parameters.radius;
        const time = Date.now();

        for (let i = 0; i < positions.count; i++) {
            vertex.fromBufferAttribute(positions, i);
            const amp = dataArray[i % dataArray.length] / 256; // Adjusted to keep the sphere's vertex movements subtle
            vertex.normalize();
            const distance = offset + amp * Math.sin(i + time * 0.001);
            vertex.multiplyScalar(distance);
            positions.setXYZ(i, vertex.x, vertex.y, vertex.z);
        }
        positions.needsUpdate = true;
    }

    /*if (analyser) {
        analyser.getByteFrequencyData(dataArray);
        const avgFrequency = dataArray.reduce((sum, value) => sum + value, 0) / dataArray.length;
        const scaleFactor = 1 + avgFrequency / 256;
        shape.scale.set(scaleFactor, scaleFactor, scaleFactor);

        const positions = geometry.attributes.position;
        const vertex = new THREE.Vector3();
        const offset = geometry.parameters.radius || 10;
        const time = Date.now();

        const points = 5; // Number of points in the star
        const angle = Math.PI / points;
        const outerRadius = 10; // Define outer radius
        const innerRadius = 5; // Define inner radius

        for (let i = 0; i < positions.count; i++) {
            vertex.fromBufferAttribute(positions, i);

            // Calculate amplitude based on frequency data
            const amp = dataArray[i % dataArray.length] / 256;

            // Calculate distance based on offset and amplitude-dependent sine wave
            const distance = offset + amp * Math.sin(i + time * 0.001);

            // Calculate the angle for the vertex
            const currentAngle = i * angle;

            // Calculate the x and y positions based on the original star shape
            const radius = i % 2 === 0 ? outerRadius : innerRadius;
            const x = radius * Math.sin(currentAngle);
            const y = radius * Math.cos(currentAngle);

            // Set the new position of the vertex
            vertex.set(x * distance, y * distance, vertex.z);

            // Update the position in the geometry
            positions.setXYZ(i, vertex.x, vertex.y, vertex.z);
        }
        positions.needsUpdate = true;
    }*/

    /*if (analyser) {
        analyser.getByteFrequencyData(dataArray);
        const avgFrequency = dataArray.reduce((sum, value) => sum + value, 0) / dataArray.length;
        const scaleFactor = 1 + avgFrequency / 256;
        shape.scale.set(scaleFactor, scaleFactor, scaleFactor);
    
        const positions = geometry.attributes.position;
        const vertex = new THREE.Vector3();
        const offset = geometry.parameters.radius || 10;
        const time = Date.now();
    
        const points = 5; // Number of points in the star
        const angle = Math.PI / points;
    
        for (let i = 0; i < positions.count; i++) {
            vertex.fromBufferAttribute(positions, i);
    
            // Calculate amplitude based on frequency data
            const amp = dataArray[i % dataArray.length] / 256;
    
            // Calculate distance based on offset and amplitude-dependent sine wave
            const distance = offset + amp * Math.sin(i + time * 0.001);
    
            // Calculate the angle for the vertex
            const currentAngle = i * angle;
    
            // Calculate the x and y positions based on the original star shape
            const radius = i % 2 === 0 ? outerRadius : innerRadius;
            const x = radius * Math.sin(currentAngle);
            const y = radius * Math.cos(currentAngle);
    
            // Set the new position of the vertex
            vertex.set(x * distance, y * distance, vertex.z);
    
            // Update the position in the geometry
            positions.setXYZ(i, vertex.x, vertex.y, vertex.z);
        }
        positions.needsUpdate = true;
    }*/

    controls.update();
    renderer.render(scene, camera);
}

// Handling window resize
window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
});

// Initial render to check if everything is set up correctly
renderer.render(scene, camera);
