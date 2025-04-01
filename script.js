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

// Teachable Machine model URL
const URL = "https://teachablemachine.withgoogle.com/models/1qaEGg823/"; // Replace with your model URL

// Load the Teachable Machine model on page load
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
        // Load the model and metadata
        model = await tmImage.load(modelURL, metadataURL);
        maxPredictions = model.getTotalClasses();
        console.log('Model loaded successfully:', model);

        // Prepare label container for predictions
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
    webcam.update(); // Update the webcam frame
    await predictFromWebcam();
    window.requestAnimationFrame(loop);
}

async function predictFromWebcam() {
    try {
        // Run the webcam image through the model
        const prediction = await model.predict(webcam.canvas);
        displayPredictions(prediction);
    } catch (error) {
        console.error('Error during webcam prediction:', error);
    }
}

async function takePhoto() {
    if (webcam && model) {
        // Capture the current frame from the webcam
        const imageCanvas = document.createElement('canvas');
        imageCanvas.width = webcam.canvas.width;
        imageCanvas.height = webcam.canvas.height;
        const ctx = imageCanvas.getContext('2d');

        // Draw the current frame onto the canvas
        ctx.drawImage(webcam.canvas, 0, 0, imageCanvas.width, imageCanvas.height);

        // Convert canvas to an image
        const capturedImage = document.createElement('img');
        capturedImage.src = imageCanvas.toDataURL();
        capturedImage.style.maxWidth = '100%';
        capturedImage.style.border = '2px solid #ddd';
        capturedImage.style.borderRadius = '10px';
        capturedImage.style.marginTop = '20px';

        // Display captured image
        imageDisplay.innerHTML = ''; // Clear previous content
        imageDisplay.appendChild(capturedImage);

        STATUS.innerText = 'Photo taken! Classifying...';

        // Wait for the image to load before classifying
        capturedImage.onload = async () => {
            try {
                // Classify the image using the canvas
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
            image.src = e.target.result; // Use the file's data URL
            image.onload = async () => {
                const prediction = await model.predict(image);
                displayPredictions(prediction);
            };

            // Display the uploaded image
            imageDisplay.innerHTML = '';
            imageDisplay.appendChild(image);
        };

        reader.readAsDataURL(file); // Read the file as a data URL
    }
}

function displayPredictions(predictions) {
    LABEL_CONTAINER.innerHTML = ''; // Clear previous predictions

    predictions.forEach(prediction => {
        // Create a container for each prediction
        const predictionContainer = document.createElement('div');
        predictionContainer.style.display = 'flex';
        predictionContainer.style.alignItems = 'center';
        predictionContainer.style.marginBottom = '8px';

        // Create a label for the class name
        const label = document.createElement('span');
        label.innerText = `${prediction.className}: `;
        label.style.width = '100px'; // Fixed width for alignment
        label.style.fontWeight = 'bold';

        // Create a bar to represent the percentage
        const bar = document.createElement('div');
        bar.style.height = '20px';
        bar.style.width = `${prediction.probability * 100}%`; // Scale probability to percentage
        bar.style.backgroundColor = '#4caf50'; // Green color for the bar
        bar.style.marginLeft = '10px';

        // Create a percentage label
        const percentage = document.createElement('span');
        percentage.innerText = `${(prediction.probability * 100).toFixed(2)}%`;
        percentage.style.marginLeft = '10px';

        // Append elements to the prediction container
        predictionContainer.appendChild(label);
        predictionContainer.appendChild(bar);
        predictionContainer.appendChild(percentage);

        // Append the prediction container to the label container
        LABEL_CONTAINER.appendChild(predictionContainer);
    });
}

function reset() {
    STATUS.innerText = 'Resetting...';
    setTimeout(() => {
        location.reload(); // Reload the webpage
    }, 500); // Optional delay for better user experience
}