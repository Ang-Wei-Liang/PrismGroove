// Setting up the scene, camera, and renderer
const container = document.getElementById('container');
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
container.appendChild(renderer.domElement);

// Creating the 3D sphere
const geometry = new THREE.SphereGeometry(10, 72, 72);
const material = new THREE.MeshBasicMaterial({ color: 0x0077ff, wireframe: true });
const sphere = new THREE.Mesh(geometry, material);
scene.add(sphere);

// Check if sphere is added to the scene
console.log('Sphere added:', sphere);

camera.position.z = 30;

// Audio processing setup
let audioContext, analyser, dataArray, audioBuffer, source;
const audioUpload = document.getElementById('audio-upload');
const playbackSlider = document.getElementById('playback-slider');
audioUpload.addEventListener('change', handleAudioUpload);
playbackSlider.addEventListener('input', handleSliderInput);

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
