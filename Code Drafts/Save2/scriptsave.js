const container = document.getElementById('container');
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
container.appendChild(renderer.domElement);

let geometry, material, shape;


/*function getRandomInt(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

function createRandomGeometry() {
    const geometryTypes = ['sphere', 'cube', 'pyramid'];
    const selectedType = geometryTypes[Math.floor(Math.random() * geometryTypes.length)];

    let geometry;

    switch (selectedType) {
        case 'sphere':
            const sphereRadius = getRandomInt(5, 20);
            const widthSegments = getRandomInt(8, 64);
            const heightSegments = getRandomInt(6, 64);
            geometry = new THREE.SphereGeometry(sphereRadius, widthSegments, heightSegments);
            console.log(`Created Sphere: Radius = ${sphereRadius}, Width Segments = ${widthSegments}, Height Segments = ${heightSegments}`);
            break;
        case 'cube':
            const cubeWidth = getRandomInt(5, 20);
            const cubeHeight = getRandomInt(5, 20);
            const cubeDepth = getRandomInt(5, 20);
            const widthDivisions = getRandomInt(1, 64);
            const heightDivisions = getRandomInt(1, 64);
            const depthDivisions = getRandomInt(1, 64);
            geometry = new THREE.BoxGeometry(cubeWidth, cubeHeight, cubeDepth, widthDivisions, heightDivisions, depthDivisions);
            console.log(`Created Cube: Width = ${cubeWidth}, Height = ${cubeHeight}, Depth = ${cubeDepth}, Width Divisions = ${widthDivisions}, Height Divisions = ${heightDivisions}, Depth Divisions = ${depthDivisions}`);
            break;
        case 'pyramid':
            const pyramidRadius = getRandomInt(5, 20);
            const pyramidHeight = getRandomInt(5, 20);
            const radialSegments = getRandomInt(3, 12); // 3 for a triangular pyramid, 4 for a square base, etc.
            const heightSegmentsPyramid = getRandomInt(1, 64);
            geometry = new THREE.ConeGeometry(pyramidRadius, pyramidHeight, radialSegments, heightSegmentsPyramid);
            console.log(`Created Pyramid: Radius = ${pyramidRadius}, Height = ${pyramidHeight}, Radial Segments = ${radialSegments}, Height Segments = ${heightSegmentsPyramid}`);
            break;
    }

    return geometry;
}*/



// Example usage:
// const randomGeometry = createRandomGeometry();


/*function createRandomConeGeometry(radius, height, segments) {
    console.log("creating random cone")
    var vertices = [];
    var theta = (Math.PI * 2) / segments;

    // Randomize coordinates for each vertex
    for (var i = 0; i <= segments; i++) {
        var x = Math.random() * radius * Math.cos(theta * i);
        var y = Math.random() * height;
        var z = Math.random() * radius * Math.sin(theta * i);
        vertices.push(new THREE.Vector3(x, y, z));
    }

    // Create ConeGeometry
    var geometry = new THREE.ConeGeometry(radius, height, segments, 64);

    // Replace ConeGeometry vertices with random coordinates
    geometry.vertices = vertices;

    return geometry;
}*/



function createShape(type) {
    if (shape) {
        scene.remove(shape);
    }

    switch (type) {
        case 'sphere':
            //geometry = new THREE.SphereGeometry(10, 89, 64);
            //geometry = new THREE.SphereGeometry(10, 20, 4, 64);
            geometry = new THREE.SphereGeometry(10, 10, 10, 64, 64, 64);

            geometry = new THREE.SphereGeometry(5, 10, 15, 44, 64, 94);


            //geometry = new THREE.SphereGeometry();
            //const geometry = new THREE.BoxGeometry(10, 10)

            //geometry = new THREE.BoxGeometry(10, 20, 10, 10, 20);




            break;
        case 'cube':
            console.log("it is a cube")
            // geometry = new THREE.BoxGeometry(10, 10, 10, 64, 64, 64);

            geometry = new THREE.ConeGeometry(10, 20, 4, 64);

            break;
        case 'pyramid':
            console.log("it is a pyramid")
            //geometry = new THREE.ConeGeometry(10, 20, 4, 64);*/

            /*var radius = 10;
            var height = 20;
            var segments = 8; // Adjust the number of segments for desired complexity
            geometry = createRandomConeGeometry(radius, height, segments);
            
            break;*/
    }

    material = new THREE.MeshBasicMaterial({ color: 0x0077ff, wireframe: true });
    shape = new THREE.Mesh(geometry, material);
    scene.add(shape);
}
createShape('sphere'); // Default shape

camera.position.z = 30;

// Audio processing setup
let audioContext, analyser, dataArray, audioBuffer, source;
const audioUpload = document.getElementById('audio-upload');
const playbackSlider = document.getElementById('playback-slider');
const colorSelect = document.getElementById('color-select');
const shapeSelect = document.getElementById('shape-select');
audioUpload.addEventListener('change', handleAudioUpload);
playbackSlider.addEventListener('input', handleSliderInput);
colorSelect.addEventListener('change', handleColorChange);
shapeSelect.addEventListener('change', handleShapeChange);

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
        console.log("Not available yet");
    } else {
        shape.material.color.setHex(color);
    }
}

function handleShapeChange(event) {
    createShape(event.target.value);
}

// Animation loop
function animate() {
    requestAnimationFrame(animate);

    if (analyser) {
        analyser.getByteFrequencyData(dataArray);
        const avgFrequency = dataArray.reduce((sum, value) => sum + value, 0) / dataArray.length;
        const scaleFactor = 1 + avgFrequency / 256;
        shape.scale.set(scaleFactor, scaleFactor, scaleFactor);

        const positions = geometry.attributes.position;
        const vertex = new THREE.Vector3();
        const offset = geometry.parameters.radius || 10;
        const time = Date.now();

        for (let i = 0; i < positions.count; i++) {
            vertex.fromBufferAttribute(positions, i);
            const amp = dataArray[i % dataArray.length] / 256;
            vertex.normalize();
            const distance = offset + amp * Math.sin(i + time * 0.001);
            vertex.multiplyScalar(distance);
            positions.setXYZ(i, vertex.x, vertex.y, vertex.z);
        }
        positions.needsUpdate = true;
    }

    const time = Date.now() * 0.0005;
    const radius = 30;
    camera.position.x = Math.cos(time) * radius;
    camera.position.y = Math.sin(time) * radius;
    camera.position.z = 30;
    camera.lookAt(0, 0, 0);

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
