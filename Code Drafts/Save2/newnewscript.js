const container = document.getElementById('container');
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
container.appendChild(renderer.domElement);

// Correctly initialize OrbitControls
const controls = new THREE.OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;
controls.dampingFactor = 0.25;
controls.screenSpacePanning = false;
controls.enabled = true;

let geometry, material, shape;
let isPlaying = false;
let slideMode = true;
let audioContext, analyser, dataArray, audioBuffer, source;

const audioUpload = document.getElementById('audio-upload');
const playbackSlider = document.getElementById('playback-slider');
const currentTimeDisplay = document.getElementById('current-time');
const colorSelect = document.getElementById('color-select');
const shapeSelect = document.getElementById('shape-select');
const pauseButton = document.getElementById('pause-button');
const removeButton = document.getElementById('remove-button');
const slideModeToggle = document.getElementById('slide-mode-toggle');

audioUpload.addEventListener('change', handleAudioUpload);
playbackSlider.addEventListener('input', handleSliderInput);
playbackSlider.addEventListener('change', handleSliderChange);
colorSelect.addEventListener('change', handleColorChange);
shapeSelect.addEventListener('change', handleShapeChange);
pauseButton.addEventListener('click', handlePause);
slideModeToggle.addEventListener('change', handleSlideModeToggle);

const currentColor = localStorage.getItem("color");

if (currentColor) {
    setSelectedColorOption(currentColor);
}

const currentShape = localStorage.getItem("shape");
if (currentShape) {
    setSelectedShapeOption(currentShape);
}

function setSelectedColorOption(value) {
    const selectElement = document.getElementById('color-select');
    selectElement.value = value;
}

function setSelectedShapeOption(value) {
    const selectElementShape = document.getElementById('shape-select');
    selectElementShape.value = value;
}

function createStarGeometry() {
    const starShape = new THREE.Shape();
    const outerRadius = 10;
    const innerRadius = 5;
    const points = 5;
    const angleStep = Math.PI / points;

    for (let i = 0; i < 2 * points; i++) {
        const angle = i * angleStep;
        const radius = i % 2 === 0 ? outerRadius : innerRadius;
        const x = radius * Math.sin(angle);
        const y = radius * Math.cos(angle);
        if (i === 0) {
            starShape.moveTo(x, y);
        } else {
            starShape.lineTo(x, y);
        }
    }
    starShape.closePath();

    const extrudeSettings = {
        depth: 2,
        bevelEnabled: true,
        bevelThickness: 1,
        bevelSize: 1,
        bevelOffset: 0,
        bevelSegments: 1
    };

    return new THREE.ExtrudeGeometry(starShape, extrudeSettings);
}

function createPentagonGeometry() {
    const pentagonShape = new THREE.Shape();
    const outerRadius = 10;
    const points = 5;
    const angle = Math.PI / points * 2;

    for (let i = 0; i < points; i++) {
        const x = outerRadius * Math.sin(i * angle);
        const y = outerRadius * Math.cos(i * angle);
        if (i === 0) {
            pentagonShape.moveTo(x, y);
        } else {
            pentagonShape.lineTo(x, y);
        }
    }
    pentagonShape.closePath();

    const extrudeSettings = {
        depth: 20,
        bevelEnabled: false
    };

    return new THREE.ExtrudeGeometry(pentagonShape, extrudeSettings);
}

function getRandomColor() {
    const randomColorCode = '#' + Math.floor(Math.random() * 16777215).toString(16).padStart(6, '0');
    const colorValue = parseInt(randomColorCode.replace('#', ''), 16);
    return { randomColorCode, colorValue };
}

function createShape(type) {
    if (shape) {
        scene.remove(shape);
    }

    switch (type) {
        case 'sphere':
            geometry = new THREE.SphereGeometry(10, 64, 64);
            break;
        case 'cube':
            geometry = new THREE.BoxGeometry(10, 10, 10);
            break;
        case 'pyramid':
            geometry = new THREE.ConeGeometry(10, 20, 4);
            break;
        case 'star':
            geometry = createStarGeometry();
            break;
        case 'pentagon':
            geometry = createPentagonGeometry();
            break;
        default:
            geometry = new THREE.SphereGeometry(10, 32, 32);
    }

    const colorSelect = document.getElementById('color-select');
    const selectedColor = colorSelect.value;

    if (selectedColor) {
        if (selectedColor == "random") {
            const { randomColorCode, colorValue } = getRandomColor();
            material = new THREE.MeshBasicMaterial({ color: colorValue, wireframe: true });
        } else {
            const colorValue = parseInt(selectedColor);
            material = new THREE.MeshBasicMaterial({ color: colorValue, wireframe: true });
        }
    } else {
        material = new THREE.MeshBasicMaterial({ color: 0x0077ff, wireframe: true });
    }

    shape = new THREE.Mesh(geometry, material);
    scene.add(shape);
}

const selectElementShape = document.getElementById('shape-select');
if (selectElementShape) {
    createShape(selectElementShape);
} else {
    createShape('sphere');
}
camera.position.z = 30;

function handleAudioUpload(event) {
    const file = event.target.files[0];
    if (file) {
        const reader = new FileReader();
        reader.onload = function (e) {
            const audioData = e.target.result;
            saveAudioToIndexedDB(audioData).then(() => {
                setupAudio(audioData);
            }).catch((error) => {
                console.error("Error saving audio data to IndexedDB", error);
            });
        };
        reader.readAsArrayBuffer(file);
    }
}

function setupAudio(audioData) {
    isPlaying = false;
    audioContext = new (window.AudioContext || window.webkitAudioContext)();
    audioContext.decodeAudioData(audioData, (buffer) => {
        audioBuffer = buffer;

        analyser = audioContext.createAnalyser();
        analyser.fftSize = 256;
        const bufferLength = analyser.frequencyBinCount;
        dataArray = new Uint8Array(bufferLength);

        animate();

        playbackSlider.max = buffer.duration;
        
        updateCurrentTimeDisplay(0);
        playbackSlider.value = 0;
    }, (e) => {
        console.error("Error decoding audio data", e);
    });
}

function createSourceNode(seekTime) {
    if (source) {
        source.stop();
        source.disconnect();
    }
    source = audioContext.createBufferSource();
    source.buffer = audioBuffer;

    source.connect(analyser);
    analyser.connect(audioContext.destination);

    source.start(0, seekTime);
    startSliderUpdate();
}

function startSliderUpdate() {
    if (isPlaying) {
        setTimeout(() => {
            if (isPlaying) {
                const currentTime = audioContext.currentTime % audioBuffer.duration;
                playbackSlider.value = currentTime;
                updateCurrentTimeDisplay(currentTime);
                startSliderUpdate();
            }
        }, 1000);
    }
}

function handleSliderInput(event) {
    if (audioBuffer) {
        const seekTime = parseFloat(event.target.value);
        createSourceNode(seekTime);
        updateCurrentTimeDisplay(seekTime); // Update the time display
    }
}

function handleSliderChange(event) {
    if (audioBuffer) {
        const seekTime = parseFloat(event.target.value);
        createSourceNode(seekTime);
        updateCurrentTimeDisplay(seekTime); // Update the time display
    }
}

function handleColorChange(event) {
    const color = event.target.value;
    if (color == "random") {
        const { randomColorCode, colorValue } = getRandomColor();
        shape.material.color.setHex(colorValue);
        localStorage.setItem('color', "random");
    } else {
        shape.material.color.setHex(color);
        localStorage.setItem('color', color);
    }
}

function handleShapeChange(event) {
    const shapeType = event.target.value;
    createShape(shapeType);
}

function handlePause() {
    if (isPlaying) {
        source.stop();
        pauseButton.textContent = 'Play';
        isPlaying = false;
    } else {
        createSourceNode(parseFloat(playbackSlider.value));
        pauseButton.textContent = 'Pause';
        isPlaying = true;
        startSliderUpdate();
    }
}

function handleSlideModeToggle(event) {
    slideMode = event.target.checked;
    controls.enabled = slideMode;
}

function updateCurrentTimeDisplay(time) {
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    currentTimeDisplay.textContent = `${minutes}:${seconds.toString().padStart(2, '0')}`;
}

const restartButton = document.createElement('button');
restartButton.textContent = 'Restart';
restartButton.addEventListener('click', handleRestart);
document.body.appendChild(restartButton);

function handleRestart() {
    if (isPlaying) {
        source.stop();
    }
    playbackSlider.value = 0;
    updateCurrentTimeDisplay(0);
    if (audioBuffer) {
        createSourceNode(0);
        pauseButton.textContent = 'Pause';
        isPlaying = true;
    }
}



function saveAudioToIndexedDB(audioData) {
    return new Promise((resolve, reject) => {
        const request = indexedDB.open("AudioDatabase", 1);

        request.onupgradeneeded = (event) => {
            const db = event.target.result;
            const objectStore = db.createObjectStore("AudioStore", { keyPath: "id" });
            objectStore.createIndex("audio", "audio", { unique: false });
        };

        request.onsuccess = (event) => {
            const db = event.target.result;
            const transaction = db.transaction(["AudioStore"], "readwrite");
            const objectStore = transaction.objectStore("AudioStore");
            const putRequest = objectStore.put({ id: 1, audio: audioData });

            putRequest.onsuccess = () => {
                resolve();
            };

            putRequest.onerror = (e) => {
                reject(e);
            };
        };

        request.onerror = (e) => {
            reject(e);
        };
    });
}

function loadAudioFromIndexedDB() {
    return new Promise((resolve, reject) => {
        const request = indexedDB.open("AudioDatabase", 1);

        request.onsuccess = (event) => {
            const db = event.target.result;
            const transaction = db.transaction(["AudioStore"]);
            const objectStore = transaction.objectStore("AudioStore");
            const getRequest = objectStore.get(1);

            getRequest.onsuccess = (event) => {
                if (getRequest.result) {
                    resolve(getRequest.result.audio);
                } else {
                    reject(new Error("No audio data found in IndexedDB"));
                }
            };

            getRequest.onerror = (e) => {
                reject(e);
            };
        };

        request.onerror = (e) => {
            reject(e);
        };
    });
}

loadAudioFromIndexedDB().then((audioData) => {
    setupAudio(audioData);
}).catch((error) => {
    console.error("Error loading audio data from IndexedDB", error);
});

function animate() {
    requestAnimationFrame(animate);

    if (isPlaying) {
        analyser.getByteFrequencyData(dataArray);
        const avgFrequency = dataArray.reduce((a, b) => a + b) / dataArray.length;

        shape.rotation.x += 0.01;
        shape.rotation.y += 0.01;
    }

    controls.update();
    renderer.render(scene, camera);
}
