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

//var color = "0x0077ff"

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
removeButton.addEventListener('click', handleRemove);
slideModeToggle.addEventListener('change', handleSlideModeToggle);

const controlsDiv = document.getElementById('controls');
const controlsDisable = controlsDiv.querySelectorAll('select, button');

const currentColor = localStorage.getItem("color");

var seekTime = 0

if (currentColor) {
setSelectedColorOption(currentColor)
}

const currentShape = localStorage.getItem("shape");
if (currentShape){
setSelectedShapeOption(currentColor)
}


function setSelectedColorOption(value) {
    const selectElement = document.getElementById('color-select');
    selectElement.value = value;
}

function setSelectedShapeOption(value) {
    const selectElementShape = document.getElementById('shape-select');
    selectElementShape.value = value;
}

/*function createStarGeometry() {
    const starShape = new THREE.Shape();
    const outerRadius = 10;
    const innerRadius = 5;
    const points = 5;
    const angle = Math.PI / points;

    for (let i = 0; i < 2 * points; i++) {
        const radius = i % 2 === 0 ? outerRadius : innerRadius;
        const x = radius * Math.sin(i * angle);
        const y = radius * Math.cos(i * angle);
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
}*/

function createStarGeometry() {
    const starShape = new THREE.Shape();
    const outerRadius = 10;
    const innerRadius = 5;
    const points = 5;
    const angleStep = Math.PI / points; // Angle step for each point

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
    // Generate a random color code
    const randomColorCode = '#' + Math.floor(Math.random() * 16777215).toString(16).padStart(6, '0');
    
    // Convert the color code to a hexadecimal integer
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
            //geometry = createStarGeometry();

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
            //geometry = createStarGeometry();

    }


    const colorSelect = document.getElementById('color-select');
    const selectedColor = colorSelect.value;


    if (selectedColor){

        if (selectedColor == "random"){
            const { randomColorCode, colorValue } = getRandomColor();
            material = new THREE.MeshBasicMaterial({ color: colorValue, wireframe: true });

        } else {
            const colorValue = parseInt(selectedColor); // Convert the string to a hexadecimal integer
            material = new THREE.MeshBasicMaterial({ color: colorValue, wireframe: true });
        }
    } else {
    material = new THREE.MeshBasicMaterial({ color: 0x0077ff, wireframe: true });
    }


    /*if (color) {
        //material = new THREE.MeshBasicMaterial({ color: color, wireframe: true });
    } else {
        material = new THREE.MeshBasicMaterial({ color: 0x0077ff, wireframe: true });
    }*/
    shape = new THREE.Mesh(geometry, material);
    scene.add(shape);
}

const selectElementShape = document.getElementById('shape-select');
if (selectElementShape) {
    createShape(selectElementShape);
} else {
    createShape('sphere'); // Default shape
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

        //createSourceNode();
        animate();

        playbackSlider.max = buffer.duration;
        
        updateCurrentTimeDisplay(0);
        setControlsDisabled(false);

        playbackSlider.value = 0;
    }, (e) => {
        console.error("Error decoding audio data", e);
    });
}

function createSourceNode(seekTime) {
    //if seekTime
    if (source) {
        source.stop();
        source.disconnect();
    }
    source = audioContext.createBufferSource();
    source.buffer = audioBuffer;

    source.connect(analyser);
    analyser.connect(audioContext.destination);

    source.start(0, seekTime);
    //startSliderUpdate();
}

function startSliderUpdate() {
    if (isPlaying) {
        const intervalId = setInterval(() => {
            if (!isPlaying) {
                clearInterval(intervalId);
                return;
            }

            seekTime++;
            console.log("startSliderUpdate, seektime is " + seekTime);

            updateCurrentTimeDisplay(seekTime);
        }, 1000);
    }
}


function handleSliderInput(event) {
    if (audioBuffer) {
        const seekTime = parseFloat(event.target.value);
        createSourceNode(seekTime);
    }
}

function handleSliderChange(event) {

    if (pauseButton.textContent == 'Play'){
    pauseButton.textContent = 'Pause'
    isPlaying = true
    startSliderUpdate();
    }

    
    if (audioBuffer) {
        seekTime = parseFloat(event.target.value);

       
        createSourceNode(seekTime);
        

        console.log("handle Slider Change, seektime is " + seekTime)
        updateCurrentTimeDisplay(seekTime); // Update the time display
        
    }


}


function handleColorChange(event) {

    const color = event.target.value;

    if (color == "random"){
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

/*function handlePause() {
    if (isPlaying) {
        source.stop();
        pauseButton.textContent = 'Play';
        isPlaying = false;

        playbackSlider.value = 0;
        updateCurrentTimeDisplay(0);
        if (audioBuffer) {
            createSourceNode(0);
            pauseButton.textContent = 'Pause';
            isPlaying = true;
        }
    } else {
        createSourceNode(playbackSlider.value);
        pauseButton.textContent = 'Restart';
        isPlaying = true;
    }
}*/

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

function handleRemove() {
    if (source) {
        source.stop();
        source.disconnect();
    }
    deleteAudioFromIndexedDB().then(() => {
        playbackSlider.value = 0;
        currentTimeDisplay.textContent = '0:00/0:00';
        pauseButton.textContent = 'Play';
        isPlaying = false;
    }).catch((error) => {
        console.error("Error deleting audio data from IndexedDB", error);
    });
    location.reload();
}

function handleSlideModeToggle(event) {
    slideMode = event.target.checked;
    controls.enabled = slideMode;
}

function updateCurrentTimeDisplay(time) {
    playbackSlider.value = time;

    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);

    const minutesTotal = Math.floor(audioBuffer.duration / 60);
    const secondsTotal = Math.floor(audioBuffer.duration % 60);


    currentTimeDisplay.textContent = `${minutes}:${seconds.toString().padStart(2, '0')}/` + `${minutesTotal}:${secondsTotal.toString().padStart(2, '0')}`;
}

function openDatabase() {
    return new Promise((resolve, reject) => {
        const request = indexedDB.open('audioDB', 1);
        request.onupgradeneeded = (event) => {
            const db = event.target.result;
            db.createObjectStore('audioStore');
        };
        request.onsuccess = (event) => {
            resolve(event.target.result);
        };
        request.onerror = (event) => {
            reject(event.target.error);
        };
    });
}

function saveAudioToIndexedDB(data) {
    return openDatabase().then((db) => {
        return new Promise((resolve, reject) => {
            const transaction = db.transaction(['audioStore'], "readwrite");
            const store = transaction.objectStore('audioStore');
            const request = store.put(data, "audioData");
            request.onsuccess = () => {
                resolve();
            };
            request.onerror = (event) => {
                reject(event.target.error);
            };
        });
    });
}

function getAudioFromIndexedDB() {
    return openDatabase().then((db) => {
        return new Promise((resolve, reject) => {
            const transaction = db.transaction(['audioStore'], "readonly");
            const store = transaction.objectStore('audioStore');
            const request = store.get("audioData");
            request.onsuccess = (event) => {
                resolve(event.target.result);
            };
            request.onerror = (event) => {
                reject(event.target.error);
            };
        });
    });
}

function deleteAudioFromIndexedDB() {
    return openDatabase().then((db) => {
        return new Promise((resolve, reject) => {
            const transaction = db.transaction(['audioStore'], "readwrite");
            const store = transaction.objectStore('audioStore');
            const request = store.delete("audioData");
            request.onsuccess = () => {
                resolve();
            };
            request.onerror = (event) => {
                reject(event.target.error);
            };
        });
    });
}



function setControlsDisabled(disabled) {
    controlsDisable.forEach(control => {
        control.disabled = disabled;
    });
}

// Load audio from IndexedDB if available
getAudioFromIndexedDB().then((audioData) => {
    if (audioData) {
        setupAudio(audioData);
        //animate();
    } else {
        animate(); // Start animation even without audio
    }
    

    // Disable controls initially
    setControlsDisabled(true);

    

}).catch((error) => {
    console.error("Error retrieving audio data from IndexedDB", error);
    animate(); // Start animation even without audio
});

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

    if (!slideMode) {
        const time = Date.now() * 0.0005;
        const radius = 10;
        camera.position.x = Math.cos(time) * radius;
        camera.position.y = Math.sin(time) * radius;
        camera.position.z = 30;
        camera.lookAt(0, 0, 0);
    }
    controls.update();
    analyser && analyser.getByteFrequencyData(dataArray);
    renderer.render(scene, camera);
}


