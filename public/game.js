const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const video = document.getElementById('playerVideo');
const overlay = document.getElementById('overlay');
const message = document.getElementById('message');
const replayButton = document.getElementById('replayButton');
const quitButton = document.getElementById('quitButton');
const loadingMessage = document.getElementById('loadingMessage');

// Initial ball position
let ballX = canvas.width / 2;
let ballY = canvas.height / 2;
const ballRadius = 20; // Increase ball radius

// Ball movement direction
let ballDX = 0;

// Variables to store avgX
let avgX = 0;
let initialAvgX = null;

// Score variables
let yourScore = 0;
let opponentScore = 0;
let gameActive = true; // Flag to check if the game is active

let goalMessageTimeout;

// Load the football image
const footballImage = new Image();
footballImage.src = 'football.png'; // Path to your football image

// Load the Face Mesh model
let model;
async function loadModel() {
    model = await facemesh.load();
    startVideo();
}

async function startVideo() {
    navigator.mediaDevices.getUserMedia({ video: { facingMode: 'user' } })
        .then(stream => {
            video.srcObject = stream;
            loadingMessage.style.display = 'none';
        })
        .catch(err => console.error('Error accessing media devices.', err));

    video.addEventListener('play', () => {
        setInterval(detectFace, 100);
    });
}

async function detectFace() {
    if (!gameActive) return;

    const predictions = await model.estimateFaces(video);

    if (predictions.length > 0) {
        const keypoints = predictions[0].scaledMesh;

        // Get the coordinates of the eyes
        const leftEye = keypoints[33]; // Coordinates for the left eye
        const rightEye = keypoints[263]; // Coordinates for the right eye
        avgX = (leftEye[0] + rightEye[0]) / 2;

        // Set initial eye position if not already set
        if (initialAvgX === null) {
            initialAvgX = avgX;
        }

        // Adjust ball direction based on movement relative to the initial position
        ballDX = -(avgX - initialAvgX) / 10; // Adjusted divisor to change the speed
    }
}

// Function to draw goals
function drawGoals() {
    ctx.save();
    ctx.fillStyle = 'white';

    // Draw the 'Opponent' goal
    ctx.fillRect(canvas.width - 10, canvas.height / 2 - 50, 10, 100);
    ctx.translate(canvas.width - 5, canvas.height / 2);
    ctx.rotate(Math.PI / 2);
    ctx.fillText('Opponent', -50, 50); // Move label closer to the center

    ctx.restore();
    ctx.save();

    // Draw the 'You' goal
    ctx.fillRect(0, canvas.height / 2 - 50, 10, 100);
    ctx.translate(5, canvas.height / 2);
    ctx.rotate(-Math.PI / 2);
    ctx.fillText('You', -25, 50); // Move label closer to the center

    ctx.restore();
}

// Function to draw ball (football image)
function drawBall() {
    const aspectRatio = footballImage.width / footballImage.height;
    const ballWidth = ballRadius * 2 * aspectRatio;
    const ballHeight = ballRadius * 2;
    ctx.drawImage(footballImage, ballX - ballWidth / 2, ballY - ballHeight / 2, ballWidth, ballHeight);
}

// Function to draw scores
function drawScores() {
    ctx.fillStyle = 'white';
    ctx.font = '24px Arial'; // Make the scoreboard bigger
    const scoreText = `You: ${yourScore} - Opponent: ${opponentScore}`;
    const textWidth = ctx.measureText(scoreText).width;
    ctx.fillText(scoreText, canvas.width - textWidth - 10, 40); // Display scores slightly down
}

// Function to display goal message
function displayGoalMessage() {
    clearTimeout(goalMessageTimeout);
    ctx.save();
    ctx.fillStyle = 'yellow';
    ctx.font = '48px Arial';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('GOAL!', canvas.width / 2, canvas.height / 2);
    ctx.restore();
    
    goalMessageTimeout = setTimeout(() => {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        gameLoop(); // Restart the game loop to clear the message
    }, 1000);
}

// Function to update ball position and check for goals
function updateBallPosition() {
    ballX += ballDX;

    // Check for collisions with walls
    if (ballX - ballRadius < 0) {
        // Ball reached your goal
        opponentScore++;
        resetBall();
    } else if (ballX + ballRadius > canvas.width) {
        // Ball reached opponent's goal
        yourScore++;
        displayGoalMessage();
        resetBall();
    }

    // Check if either player has reached 5 goals
    if (yourScore === 5 || opponentScore === 5) {
        gameActive = false;
        overlay.style.display = 'block';
        message.textContent = yourScore === 5 ? 'You win!' : 'Opponent wins!';
    }
}

// Function to reset ball position to the center with a delay
function resetBall() {
    gameActive = false;
    ballX = canvas.width / 2;
    ballY = canvas.height / 2;
    initialAvgX = null; // Reset the initial eye position
    setTimeout(() => {
        gameActive = true;
    }, 1000); // 1-second delay
}

// Function to replay the game
function replayGame() {
    yourScore = 0;
    opponentScore = 0;
    gameActive = true;
    overlay.style.display = 'none';
    resetBall();
}

// Function to quit the game
function quitGame() {
    overlay.style.display = 'none';
    ctx.clearRect(0, 0, canvas.width, canvas.height);
}

// Game loop
function gameLoop() {
    if (gameActive) {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        drawGoals();
        drawBall();
        drawScores(); // Draw scores
        updateBallPosition();
    }
    requestAnimationFrame(gameLoop);
}

// Start the game loop
gameLoop();
loadModel();

// Add event listeners for replay and quit buttons
replayButton.addEventListener('click', () => {
    yourScore = 0;
    opponentScore = 0;
    gameActive = true;
    overlay.style.display = 'none';
    resetBall();
    gameLoop(); // Restart the game loop
});

quitButton.addEventListener('click', quitGame);
