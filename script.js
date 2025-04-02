const ENABLE_CAM_BUTTON = document.getElementById('enableCam');
const TAKE_PHOTO_BUTTON = document.getElementById('takePhoto');
const RESET_BUTTON = document.getElementById('reset');
const IMAGE_UPLOAD = document.getElementById('imageUpload');
const LABEL_CONTAINER = document.getElementById('label-container');
const VIDEO = document.getElementById('webcam');
const STATUS = document.getElementById('status');
const WEBCAM_CONTAINER = document.getElementById('webcam-container');
const imageDisplay = document.getElementById('image-display');

let model, webcam, maxPredictions;

const URL = "https://teachablemachine.withgoogle.com/models/1qaEGg823/"; 

loadModel();

ENABLE_CAM_BUTTON.addEventListener('click', enableCam);
TAKE_PHOTO_BUTTON.addEventListener('click', takePhoto);
RESET_BUTTON.addEventListener('click', reset);
IMAGE_UPLOAD.addEventListener('change', classifyUploadedImage);

async function loadModel() {
    STATUS.innerText = 'Loading model...';
    console.log('Attempting to load model...');
    const modelURL = URL + "model.json";
    const metadataURL = URL + "metadata.json";

    try {
        model = await tmImage.load(modelURL, metadataURL);
        maxPredictions = model.getTotalClasses();
        console.log('Model loaded successfully:', model);
        for (let i = 0; i < maxPredictions; i++) {
            LABEL_CONTAINER.appendChild(document.createElement("div"));
        }

        STATUS.innerText = 'Model loaded. Ready to classify!';
    } catch (error) {
        console.error('Error loading model:', error);
        STATUS.innerText = 'Error loading model. Check console for details.';
    }
}

async function enableCam() {
    try {
        console.log("Requesting webcam access...");
        const flip = true; 
        webcam = new tmImage.Webcam(200, 200, flip);
        await webcam.setup();
        await webcam.play();
        WEBCAM_CONTAINER.appendChild(webcam.canvas);
        STATUS.innerText = 'Webcam enabled. Start predicting!';
        window.requestAnimationFrame(loop);
    } catch (error) {
        console.error("Error accessing webcam:", error);
        STATUS.innerText = `Error accessing webcam: ${error.message}`;
    }
}


async function loop() {
    webcam.update();
    await predictFromWebcam();
    window.requestAnimationFrame(loop);
}

async function predictFromWebcam() {
    try {
        const prediction = await model.predict(webcam.canvas);
        displayPredictions(prediction);
    } catch (error) {
        console.error('Error during webcam prediction:', error);
    }
}

async function takePhoto() {
    if (webcam && model) {
        const imageCanvas = document.createElement('canvas');
        imageCanvas.width = webcam.canvas.width;
        imageCanvas.height = webcam.canvas.height;
        const ctx = imageCanvas.getContext('2d');
        ctx.drawImage(webcam.canvas, 0, 0, imageCanvas.width, imageCanvas.height);
        const capturedImage = document.createElement('img');
        capturedImage.src = imageCanvas.toDataURL();
        capturedImage.style.maxWidth = '100%';
        capturedImage.style.border = '2px solid #ddd';
        capturedImage.style.borderRadius = '10px';
        capturedImage.style.marginTop = '20px';
        imageDisplay.innerHTML = ''; 
        imageDisplay.appendChild(capturedImage);
        STATUS.innerText = 'Photo taken! Classifying...';
        capturedImage.onload = async () => {
            try {
                const prediction = await model.predict(imageCanvas);
                displayPredictions(prediction);
            } catch (error) {
                console.error('Error during photo classification:', error);
                STATUS.innerText = 'Error during photo classification. Check console for details.';
            }
        };
    } else {
        STATUS.innerText = 'Webcam or model is not ready. Please enable the webcam and load the model.';
    }
}


async function classifyUploadedImage(event) {
    const file = event.target.files[0];
    if (file && model) {
        const image = document.createElement('img');
        const reader = new FileReader();

        reader.onload = async (e) => {
            image.src = e.target.result; 
            image.onload = async () => {
                const prediction = await model.predict(image);
                displayPredictions(prediction);
            };
            imageDisplay.innerHTML = '';
            imageDisplay.appendChild(image);
        };
        reader.readAsDataURL(file); 
    }
}

function displayPredictions(predictions) {
    LABEL_CONTAINER.innerHTML = ''; 
    predictions.forEach(prediction => {
        const predictionContainer = document.createElement('div');
        predictionContainer.style.display = 'flex';
        predictionContainer.style.alignItems = 'center';
        predictionContainer.style.marginBottom = '8px';
        const label = document.createElement('span');
        label.innerText = `${prediction.className}: `;
        label.style.width = '100px'; 
        label.style.fontWeight = 'bold';
        const bar = document.createElement('div');
        bar.style.height = '20px';
        bar.style.width = `${prediction.probability * 100}%`; 
        bar.style.backgroundColor = '#4caf50'; 
        bar.style.marginLeft = '10px';
        const percentage = document.createElement('span');
        percentage.innerText = `${(prediction.probability * 100).toFixed(2)}%`;
        percentage.style.marginLeft = '10px';
        predictionContainer.appendChild(label);
        predictionContainer.appendChild(bar);
        predictionContainer.appendChild(percentage);
        LABEL_CONTAINER.appendChild(predictionContainer);
    });
}

function reset() {
    STATUS.innerText = 'Resetting...';
    setTimeout(() => {
        location.reload();
    }, 500);
}
