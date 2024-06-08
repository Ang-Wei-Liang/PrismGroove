const container = document.getElementById('container');
        const scene = new THREE.Scene();
        const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
        const renderer = new THREE.WebGLRenderer({ antialias: true });
        renderer.setSize(window.innerWidth, window.innerHeight);
        container.appendChild(renderer.domElement);

        const controls = new THREE.OrbitControls(camera, renderer.domElement);
        controls.enableDamping = true; // an animation loop is required when either damping or auto-rotation is enabled
        controls.dampingFactor = 0.25;
        controls.screenSpacePanning = false;

        let geometry, material, shape;

        function createStarGeometry() {
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

        function createShape(type) {
            if (shape) {
                scene.remove(shape);
            }

            switch (type) {
                case 'sphere':
                    geometry = new THREE.SphereGeometry(10, 32, 32);
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

            material = new THREE.MeshBasicMaterial({ color: 0x0077ff, wireframe: true });
            shape = new THREE.Mesh(geometry, material);
            scene.add(shape);
        }
        createShape('sphere'); // Default shape

        camera.position.z = 30;

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
                    localStorage.setItem('audioData', audioData);
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
            startSliderUpdate();
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

        function startSliderUpdate() {
            setInterval(() => {
                if (source && !source.paused) {
                    playbackSlider.value = audioContext.currentTime;
                }
            }, 1000);
        }

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

            /*const time = Date.now() * 0.0005;
            const radius = 30;
            camera.position.x = Math.cos(time) * radius;
            camera.position.y = Math.sin(time) * radius;
            camera.position.z = 30;
            camera.lookAt(0, 0, 0);*/

            controls.update();

            renderer.render(scene, camera);
        }

        window.addEventListener('resize', () => {
            camera.aspect = window.innerWidth / window.innerHeight;
            camera.updateProjectionMatrix();
            renderer.setSize(window.innerWidth, window.innerHeight);
        });

        // Load audio from local storage if available
        const storedAudioData = localStorage.getItem('audioData');
        if (storedAudioData) {
            setupAudio(storedAudioData);
        } else {
            animate(); // Start animation even without audio
        }

        renderer.render(scene, camera);
 