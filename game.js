console.log("Game script loading...");

// Wait for DOM and Three.js to be fully loaded before initializing
window.addEventListener('load', () => {
    console.log("Window loaded, initializing game...");
    initGame();
});

// Main initialization function
function initGame() {
    try {
        console.log("Starting game initialization");
        
        // Initialize variables first
        initVariables();
        
        // Initialize Three.js first to have rendering available
        initThreeJS();
        
        // Set up DOM event handlers
        setupEventHandlers();
        
        // Create the default scene (synthwave sky) so there's something visible
        createSynthwaveSky();
        
        // Do an initial render to show something
        if (window.scene && window.camera && window.renderer) {
            console.log("Performing initial render");
            window.renderer.render(window.scene, window.camera);
        } else {
            console.error("Scene, camera, or renderer not initialized properly");
        }
        
        // Then initialize the rest of the game
        initAudio();
        initControls();
        
        // Initialize UI elements
        initUI();
        
        // Fix z-index layering to ensure proper visibility
        fixZIndexLayers();
        
        // Initialize time tracking for animation loop
        window.prevTime = performance.now();
        
        // Start animation loop
        console.log("Starting animation loop");
        window.animationFrameId = requestAnimationFrame(animate);
        
        console.log("Game initialization complete");
        document.getElementById('loading-message').style.display = 'none';
    } catch (error) {
        console.error("Game initialization failed:", error);
        alert("Game initialization failed: " + error.message);
    }
}

// Set up DOM event handlers
function setupEventHandlers() {
    console.log("Setting up DOM event handlers");
    
    // Handle window resize
    window.addEventListener('resize', () => {
        if (window.camera && window.renderer) {
            // Update camera
            window.camera.aspect = window.innerWidth / window.innerHeight;
            window.camera.updateProjectionMatrix();
            
            // Update renderer
            window.renderer.setSize(window.innerWidth, window.innerHeight);
            
            // Force a render
            if (window.scene) {
                window.renderer.render(window.scene, window.camera);
            }
        }
    });
    
    // Handle visibility change to pause game when tab is not visible
    document.addEventListener('visibilitychange', () => {
        if (document.hidden) {
            // Page is not visible, pause game if it's running
            if (window.gameState && window.gameState.started && 
                !window.gameState.paused && !window.gameState.gameOver) {
                console.log("Auto-pausing game due to tab visibility change");
                togglePauseMenu();
            }
        }
    });
}

// Initialize all variables
function initVariables() {
    console.log("Initializing variables");
    
    // Game configuration
    window.config = {
        corridorWidth: 5, // Doubled from 5 to make the course physically twice as long
        corridorHeight: 3,
        mazeSize: 70, // Keep the same number of cells
        enemyDistance: 25, // Increased from 10 to detect enemies from further away
        moveSpeed: 50.0, 
        gridSize: 400, // Doubled to ensure grid covers the larger course
        projectileSpeed: 30,
        projectileLifetime: 2,
        enemyMoveSpeed: 2.0,
        playerHealth: 100,
        enemyDamage: 25,
        goalDistance: 10, // Increased from 5 to match new corridor width
        skyRadius: 1000, // New parameter for sky sphere size
        backgroundMusicVolume: 0.6, // Default volume for background music
        missedProjectilePenalty: 25 // Penalty for missing a projectile - same as wrong answer
    };
    
    // Define interval levels
    window.intervalLevels = {
        1: {
            name: "Level 1: Minor 2nd vs. Major 2nd",
            intervals: ["Minor 2nd", "Major 2nd"],
            direction: "ascending"
        },
        2: {
            name: "Level 2: Minor 3rd vs. Major 3rd",
            intervals: ["Minor 3rd", "Major 3rd"],
            direction: "ascending"
        },
        3: {
            name: "Level 3: Perfect 4th vs. Perfect 5th", 
            intervals: ["Perfect 4th", "Perfect 5th"],
            direction: "ascending"
        },
        4: {
            name: "Level 4: Octave vs. Perfect 5th",
            intervals: ["Octave", "Perfect 5th"],
            direction: "ascending"
        },
        5: {
            name: "Level 5: Review (m2, M2, m3, M3, P4, P5, P8)",
            intervals: ["Minor 2nd", "Major 2nd", "Minor 3rd", "Major 3rd", "Perfect 4th", "Perfect 5th", "Octave"],
            direction: "ascending"
        },
        6: {
            name: "Level 6: Tritone vs. P4 / P5",
            intervals: ["Tritone", "Perfect 4th", "Perfect 5th"],
            direction: "ascending"
        },
        7: {
            name: "Level 7: Minor 6th vs. Major 6th",
            intervals: ["Minor 6th", "Major 6th"],
            direction: "ascending"
        },
        8: {
            name: "Level 8: Minor 7th vs. Major 7th",
            intervals: ["Minor 7th", "Major 7th"],
            direction: "ascending"
        },
        9: {
            name: "Level 9: Review (P4, Tritone, P5, m6, M6, m7, M7)",
            intervals: ["Perfect 4th", "Tritone", "Perfect 5th", "Minor 6th", "Major 6th", "Minor 7th", "Major 7th"],
            direction: "ascending"
        },
        10: {
            name: "Level 10: All Intervals",
            intervals: ["Minor 2nd", "Major 2nd", "Minor 3rd", "Major 3rd", "Perfect 4th", "Tritone", 
                     "Perfect 5th", "Minor 6th", "Major 6th", "Minor 7th", "Major 7th", "Octave"],
            direction: "ascending"
        },
        // Descending Intervals (11-20)
        11: {
            name: "Level 11: Descending Minor 2nd vs. Major 2nd",
            intervals: ["Minor 2nd", "Major 2nd"],
            direction: "descending"
        },
        12: {
            name: "Level 12: Descending Minor 3rd vs. Major 3rd",
            intervals: ["Minor 3rd", "Major 3rd"],
            direction: "descending"
        },
        13: {
            name: "Level 13: Descending Perfect 4th vs. Perfect 5th", 
            intervals: ["Perfect 4th", "Perfect 5th"],
            direction: "descending"
        },
        14: {
            name: "Level 14: Descending Octave vs. Perfect 5th",
            intervals: ["Octave", "Perfect 5th"],
            direction: "descending"
        },
        15: {
            name: "Level 15: Descending Review (m2, M2, m3, M3, P4, P5, P8)",
            intervals: ["Minor 2nd", "Major 2nd", "Minor 3rd", "Major 3rd", "Perfect 4th", "Perfect 5th", "Octave"],
            direction: "descending"
        },
        16: {
            name: "Level 16: Descending Tritone vs. P4 / P5",
            intervals: ["Tritone", "Perfect 4th", "Perfect 5th"],
            direction: "descending"
        },
        17: {
            name: "Level 17: Descending Minor 6th vs. Major 6th",
            intervals: ["Minor 6th", "Major 6th"],
            direction: "descending"
        },
        18: {
            name: "Level 18: Descending Minor 7th vs. Major 7th",
            intervals: ["Minor 7th", "Major 7th"],
            direction: "descending"
        },
        19: {
            name: "Level 19: Descending Review (P4, Tritone, P5, m6, M6, m7, M7)",
            intervals: ["Perfect 4th", "Tritone", "Perfect 5th", "Minor 6th", "Major 6th", "Minor 7th", "Major 7th"],
            direction: "descending"
        },
        20: {
            name: "Level 20: All Descending Intervals",
            intervals: ["Minor 2nd", "Major 2nd", "Minor 3rd", "Major 3rd", "Perfect 4th", "Tritone", 
                     "Perfect 5th", "Minor 6th", "Major 6th", "Minor 7th", "Major 7th", "Octave"],
            direction: "descending"
        },
        // Mixed Ascending and Descending Intervals (21-30)
        21: {
            name: "Level 21: Mixed Minor 2nd vs. Major 2nd",
            intervals: ["Minor 2nd", "Major 2nd"],
            direction: "mixed"
        },
        22: {
            name: "Level 22: Mixed Minor 3rd vs. Major 3rd",
            intervals: ["Minor 3rd", "Major 3rd"],
            direction: "mixed"
        },
        23: {
            name: "Level 23: Mixed Perfect 4th vs. Perfect 5th", 
            intervals: ["Perfect 4th", "Perfect 5th"],
            direction: "mixed"
        },
        24: {
            name: "Level 24: Mixed Octave vs. Perfect 5th",
            intervals: ["Octave", "Perfect 5th"],
            direction: "mixed"
        },
        25: {
            name: "Level 25: Mixed Review (m2, M2, m3, M3, P4, P5, P8)",
            intervals: ["Minor 2nd", "Major 2nd", "Minor 3rd", "Major 3rd", "Perfect 4th", "Perfect 5th", "Octave"],
            direction: "mixed"
        },
        26: {
            name: "Level 26: Mixed Tritone vs. P4 / P5",
            intervals: ["Tritone", "Perfect 4th", "Perfect 5th"],
            direction: "mixed"
        },
        27: {
            name: "Level 27: Mixed Minor 6th vs. Major 6th",
            intervals: ["Minor 6th", "Major 6th"],
            direction: "mixed"
        },
        28: {
            name: "Level 28: Mixed Minor 7th vs. Major 7th",
            intervals: ["Minor 7th", "Major 7th"],
            direction: "mixed"
        },
        29: {
            name: "Level 29: Mixed Review (P4, Tritone, P5, m6, M6, m7, M7)",
            intervals: ["Perfect 4th", "Tritone", "Perfect 5th", "Minor 6th", "Major 6th", "Minor 7th", "Major 7th"],
            direction: "mixed"
        },
        30: {
            name: "Level 30: All Mixed Intervals",
            intervals: ["Minor 2nd", "Major 2nd", "Minor 3rd", "Major 3rd", "Perfect 4th", "Tritone", 
                     "Perfect 5th", "Minor 6th", "Major 6th", "Minor 7th", "Major 7th", "Octave"],
            direction: "mixed"
        }
    };
    
    // Game state
    window.gameState = {
        started: false,
        score: 0,
        activeEnemy: null,
        intervalPlaying: false,
        playerStartPosition: { x: 0, y: 1.6, z: 0 },
        playerHealth: window.config.playerHealth,
        goalPosition: { x: 0, y: 0, z: 0 }, // Will be set during maze creation
        gameOver: false,
        gameWon: false,
        backgroundMusicPlaying: false,
        startTime: null,
        completionTime: null,
        initialHealth: window.config.playerHealth,
        enemiesDefeated: 0,
        damageTaken: 0,
        missedProjectiles: 0, // Counter for missed projectiles
        selectedLevel: 1, // Default to level 1
        paused: false, // Flag to track pause state
        canMove: false, // Flag to control player movement during countdown
    };
    
    // Movement variables
    window.moveForward = false;
    window.moveBackward = false;
    window.moveLeft = false;
    window.moveRight = false;
    window.canJump = true;
    
    // Physics
    window.velocity = new THREE.Vector3();
    window.direction = new THREE.Vector3();
    
    // Game objects
    window.walls = [];
    window.enemies = [];
    window.projectiles = [];
    
    // Intervals (musical)
    window.intervals = {
        "Minor 2nd": 1,
        "Major 2nd": 2,
        "Minor 3rd": 3,
        "Major 3rd": 4,
        "Perfect 4th": 5,
        "Tritone": 6,
        "Perfect 5th": 7,
        "Minor 6th": 8,
        "Major 6th": 9,
        "Minor 7th": 10,
        "Major 7th": 11,
        "Octave": 12
    };
    
    // Note frequencies
    window.noteFrequencies = {
        'C4': 261.63,
        'C#4': 277.18,
        'D4': 293.66,
        'D#4': 311.13,
        'E4': 329.63,
        'F4': 349.23,
        'F#4': 369.99,
        'G4': 392.00,
        'G#4': 415.30,
        'A4': 440.00,
        'A#4': 466.16,
        'B4': 493.88,
        'C5': 523.25
    };
    
    console.log("Variables initialized");
}

// Initialize audio context
function initAudio() {
    console.log("Initializing audio");
    
    try {
        window.audioContext = new (window.AudioContext || window.webkitAudioContext)();
        console.log("Audio context created");
        
        // Initialize background music
        loadBackgroundMusic();
    } catch (error) {
        console.error("Failed to create audio context:", error);
    }
}

// Load and prepare background music
function loadBackgroundMusic() {
    console.log("Loading background music");
    
    // URL to the background music file (synthwave style)
    const musicUrl = 'assets/music/background-synthwave.mp3';
    
    // Create audio element for simpler handling of music
    const audioElement = new Audio();
    audioElement.src = musicUrl;
    audioElement.loop = true; // Enable looping
    
    // When audio is loaded, set up audio nodes
    audioElement.addEventListener('canplaythrough', () => {
        console.log("Background music loaded");
        
        // Create media element source and gain node
        window.backgroundMusicSource = window.audioContext.createMediaElementSource(audioElement);
        window.backgroundMusicGain = window.audioContext.createGain();
        
        // Set initial volume
        window.backgroundMusicGain.gain.value = window.config.backgroundMusicVolume;
        
        // Connect nodes
        window.backgroundMusicSource.connect(window.backgroundMusicGain);
        window.backgroundMusicGain.connect(window.audioContext.destination);
        
        // Store reference to audio element
        window.backgroundMusicElement = audioElement;
        
        // If game has already started, begin playing
        if (window.gameState.started) {
            playBackgroundMusic();
        }
    });
    
    // Handle loading errors
    audioElement.addEventListener('error', (e) => {
        console.error("Error loading background music:", e);
        // Create a fallback notification
        createMusicErrorNotification();
    });
    
    // Start loading the audio file
    audioElement.load();
}

// Play background music
function playBackgroundMusic() {
    console.log("Playing background music");
    
    // Ensure audio context is running (needed due to browser autoplay policies)
    if (window.audioContext && window.audioContext.state === 'suspended') {
        window.audioContext.resume();
    }
    
    // Play the music if we have a valid audio element
    if (window.backgroundMusicElement) {
        // First, make sure we properly stop any existing playback
        if (window.gameState.backgroundMusicPlaying) {
            window.backgroundMusicElement.pause();
            window.gameState.backgroundMusicPlaying = false;
        }
        
        // Reset audio to beginning
        window.backgroundMusicElement.currentTime = 0;
        
        // Ensure volume is set correctly
        if (window.backgroundMusicGain) {
            window.backgroundMusicGain.gain.value = window.config.backgroundMusicVolume;
        }
        
        // Play the audio
        const playPromise = window.backgroundMusicElement.play();
        if (playPromise !== undefined) {
            playPromise
                .then(() => {
                    window.gameState.backgroundMusicPlaying = true;
                    console.log("Background music started successfully");
                })
                .catch(error => {
                    console.error("Error playing background music:", error);
                    // This usually happens due to browser autoplay policies
                    createPlayMusicButton();
                });
        }
    } else {
        console.warn("Background music element not available, trying to reload");
        loadBackgroundMusic();
    }
}

// Stop background music
function stopBackgroundMusic() {
    console.log("Stopping background music");
    
    try {
        // Check if we have a valid audio element
        if (window.backgroundMusicElement) {
            // Pause the audio
            window.backgroundMusicElement.pause();
            
            // Reset to beginning
            window.backgroundMusicElement.currentTime = 0;
            
            // Update flag
            window.gameState.backgroundMusicPlaying = false;
            
            // Reset gain if available
            if (window.backgroundMusicGain) {
                window.backgroundMusicGain.gain.cancelScheduledValues(window.audioContext.currentTime);
                window.backgroundMusicGain.gain.value = window.config.backgroundMusicVolume;
            }
            
            console.log("Background music stopped successfully");
        } else {
            console.warn("No background music element found to stop");
        }
    } catch (error) {
        console.error("Error stopping background music:", error);
    }
}

// Create a button to manually start music (for browsers with restrictive autoplay policies)
function createPlayMusicButton() {
    // Check if button already exists
    if (document.getElementById('play-music-button')) return;
    
    const button = document.createElement('button');
    button.id = 'play-music-button';
    button.textContent = ' Play Music';
    button.style.cssText = `
        position: fixed;
        bottom: 20px;
        right: 20px;
        padding: 10px 15px;
        background: rgba(0, 255, 255, 0.3);
        color: white;
        border: 1px solid #00ffff;
        border-radius: 5px;
        cursor: pointer;
        z-index: 1000;
        font-weight: bold;
        box-shadow: 0 0 10px rgba(0, 255, 255, 0.5);
    `;
    
    button.addEventListener('click', () => {
        // Try to play music
        if (window.backgroundMusicElement) {
            window.audioContext.resume().then(() => {
                window.backgroundMusicElement.play()
                    .then(() => {
                        window.gameState.backgroundMusicPlaying = true;
                        button.remove();
                    })
                    .catch(error => {
                        console.error("Still couldn't play music:", error);
                    });
            });
        }
    });
    
    document.body.appendChild(button);
}

// Create notification for music loading error
function createMusicErrorNotification() {
    const notification = document.createElement('div');
    notification.textContent = 'Background music file could not be loaded.';
    notification.style.cssText = `
        position: fixed;
        bottom: 20px;
        left: 20px;
        padding: 10px 15px;
        background: rgba(255, 0, 0, 0.3);
        color: white;
        border: 1px solid #ff0000;
        border-radius: 5px;
        z-index: 1000;
    `;
    
    document.body.appendChild(notification);
    
    // Remove notification after 5 seconds
    setTimeout(() => {
        notification.remove();
    }, 5000);
}

// Create volume control for background music
function createVolumeControl() {
    // Check if control already exists
    if (document.getElementById('volume-control')) return;
    
    const volumeControl = document.createElement('div');
    volumeControl.id = 'volume-control';
    volumeControl.style.cssText = `
        position: fixed;
        bottom: 20px;
        left: 20px;
        background: rgba(0, 0, 0, 0.7);
        padding: 10px;
        border-radius: 5px;
        z-index: 999;
        color: white;
        font-family: Arial, sans-serif;
        font-size: 12px;
        border: 1px solid #00ffff;
        box-shadow: 0 0 10px rgba(0, 255, 255, 0.5);
        display: flex;
        align-items: center;
    `;
    
    volumeControl.innerHTML = `
        <span style="margin-right: 10px;">🔊</span>
        <input type="range" min="0" max="100" value="${window.config.backgroundMusicVolume * 100}" id="volume-slider" 
        style="width: 80px; cursor: pointer;">
    `;
    
    document.body.appendChild(volumeControl);
    
    // Add event listener to slider
    const slider = document.getElementById('volume-slider');
    slider.addEventListener('input', (e) => {
        if (window.backgroundMusicGain) {
            const volume = parseFloat(e.target.value) / 100;
            window.backgroundMusicGain.gain.value = volume;
            window.config.backgroundMusicVolume = volume;
        }
    });
}

// Initialize UI elements
function initUI() {
    console.log("Initializing UI");
    
    // Ensure UI container has proper z-index
    const uiContainer = document.getElementById('ui-container');
    if (uiContainer) {
        uiContainer.style.zIndex = '10'; // Ensure UI is above canvas
        uiContainer.style.position = 'absolute';
    }
    
    // Create interval options UI
    createIntervalOptionsUI();
    
    // Set up start button
    const startButton = document.getElementById('start-button');
    if (startButton) {
        startButton.addEventListener('click', startGame);
    } else {
        console.error("Start button not found");
    }
    
    // Create crosshair for aiming
    createCrosshair();
    
    // Create health display
    createHealthDisplay();
    
    // Add music controls to instructions if needed
    addMusicNoteToInstructions();
    
    // Add level selection to instructions
    addLevelSelectionToInstructions();
    
    // Add event listeners for pause menu buttons with improved handling
    const continueButton = document.getElementById('pause-continue-button');
    if (continueButton) {
        // Remove any existing event listeners
        const newContinueButton = continueButton.cloneNode(true);
        continueButton.parentNode.replaceChild(newContinueButton, continueButton);
        
        // Add fresh event listener
        newContinueButton.addEventListener('click', function(event) {
            event.preventDefault();
            console.log("Continue button clicked");
            togglePauseMenu(); // Resume game
        });
    }
    
    const mainMenuButton = document.getElementById('pause-main-menu-button');
    if (mainMenuButton) {
        // Remove any existing event listeners
        const newMainMenuButton = mainMenuButton.cloneNode(true);
        mainMenuButton.parentNode.replaceChild(newMainMenuButton, mainMenuButton);
        
        // Add fresh event listener
        newMainMenuButton.addEventListener('click', function(event) {
            event.preventDefault();
            console.log("Main menu button clicked");
            togglePauseMenu(); // Close pause menu
            returnToMainMenu(); // Return to main menu
        });
    }
}

// Function to display countdown timer before game starts
function startCountdown() {
    const countdownEl = document.getElementById('countdown-timer');
    if (!countdownEl) return;
    
    // Ensure player can't move during countdown
    window.gameState.canMove = false;
    
    // Make countdown element visible
    countdownEl.classList.add('show');
    
    // Start with 3
    countdownEl.textContent = '3';
    
    // After 1 second, show 2
    setTimeout(() => {
        countdownEl.textContent = '2';
        
        // After another second, show 1
        setTimeout(() => {
            countdownEl.textContent = '1';
            
            // After another second, show GO!
            setTimeout(() => {
                countdownEl.innerHTML = '<span class="go">GO!</span>';
                
                // Enable player movement
                window.gameState.canMove = true;
                
                // Initialize game timer only when GO appears
                // This ensures the countdown time isn't counted against the player
                initializeGameTimer();
                
                // After a short delay, hide the countdown
                setTimeout(() => {
                    countdownEl.classList.remove('show');
                    countdownEl.textContent = '';
                }, 1000);
            }, 1000);
        }, 1000);
    }, 1000);
}

// Start the game
function startGame() {
    console.log("Starting game");
    
    try {
        // Make sure pause menu is hidden first
        const pauseMenu = document.getElementById('pause-menu');
        if (pauseMenu) {
            pauseMenu.style.display = 'none';
        }
        
        // Fix z-index layering to ensure canvas is visible
        fixZIndexLayers();
        
        // Ensure canvas is visible and properly positioned
        const canvas = document.querySelector('canvas');
        if (canvas) {
            canvas.style.display = 'block';
            canvas.style.zIndex = '1';
            
            // Make sure it's the first child
            const parent = canvas.parentElement;
            if (parent && parent.firstChild !== canvas) {
                parent.insertBefore(canvas, parent.firstChild);
            }
        } else {
            console.error("Canvas not found - game rendering will not work");
        }
        
        // Make sure UI container is above canvas
        const uiContainer = document.getElementById('ui-container');
        if (uiContainer) {
            uiContainer.style.zIndex = '10';
        }
        
        // Set game as started first to ensure the animation loop updates
        window.gameState.started = true;
        window.gameState.gameOver = false;
        window.gameState.gameWon = false;
        window.gameState.paused = false; // Explicitly set paused to false
        
        // Clear any existing timers or intervals first
        if (window.gameTimerInterval) {
            clearInterval(window.gameTimerInterval);
            window.gameTimerInterval = null;
        }
        
        // Hide the instructions panel
        const instructions = document.getElementById('instructions');
        if (instructions) {
            console.log("Hiding instructions panel");
            instructions.style.display = 'none';
        }
        
        // Clear any existing game elements first
        console.log("Clearing existing game elements");
        clearGameElements();
        
        // Ensure audio context is ready
        if (window.audioContext && window.audioContext.state === 'suspended') {
            window.audioContext.resume().then(() => {
                console.log("Audio context resumed successfully");
            }).catch(err => {
                console.error("Failed to resume audio context:", err);
            });
        }
        
        // Reset velocity
        if (window.velocity) {
            window.velocity.set(0, 0, 0);
        }
        
        console.log("Creating game world...");
        
        // Create the maze first - this sets playerStartPosition
        createMaze();
        
        // Create enemies
        createEnemies();
        
        // Position player at start
        positionPlayerAtStart();
        
        // Force an immediate render to show the new scene
        if (window.scene && window.camera && window.renderer) {
            console.log("Rendering initial game scene");
            window.renderer.render(window.scene, window.camera);
        } else {
            console.error("Cannot render scene - missing required components");
        }
        
        // Create UI elements
        createTimeAndScoreDisplay();
        createHealthDisplay();
        updateEnemiesDisplay();
        
        // Reset timer display to show 00:00 during countdown
        if (window.timeValue) {
            window.timeValue.textContent = '00:00';
        }
        
        // Timer is now initialized after countdown completes instead of here
        // Removed: initializeGameTimer();
        
        // Hide loading message if still visible
        const loadingMessage = document.getElementById('loading-message');
        if (loadingMessage) {
            loadingMessage.style.display = 'none';
        }
        
        // Update score display immediately, but don't update time until GO
        updateScoreDisplay();
        
        // Reset movement flag to prevent movement before countdown completes
        window.gameState.canMove = false;
        
        // Start the countdown timer
        startCountdown();
        
        // Start background music with a slight delay to ensure proper initialization
        setTimeout(() => {
            playBackgroundMusic();
        }, 300);
        
        // Make sure z-index layering is correct
        fixZIndexLayers();
        
        // Lock controls for gameplay (wrapped in try/catch to prevent errors)
        try {
            if (window.controls) {
                window.controls.lock();
            }
        } catch (e) {
            console.error("Error locking controls:", e);
        }
        
        console.log("Game started successfully. Player position:", 
                  window.controls ? window.controls.getObject().position.toArray() : "Controls not initialized");
    } catch (error) {
        console.error("Error starting game:", error);
        alert("Failed to start game: " + error.message);
    }
}

// Clear existing game elements
function clearGameElements() {
    if (!window.scene) {
        console.log("No scene to clear");
        return;
    }
    
    // Remove enemies
    if (window.enemies && window.enemies.length > 0) {
        console.log("Clearing", window.enemies.length, "enemies");
        window.enemies.forEach(enemy => {
            if (enemy) {
                window.scene.remove(enemy);
            }
        });
        window.enemies = [];
    }
    
    // Remove projectiles
    if (window.projectiles && window.projectiles.length > 0) {
        console.log("Clearing", window.projectiles.length, "projectiles");
        window.projectiles.forEach(projectile => {
            if (projectile) {
                window.scene.remove(projectile);
            }
        });
        window.projectiles = [];
    }
    
    // Clear other game objects
    console.log("Clearing walls and other game objects");
    const objectsToRemove = [];
    window.scene.traverse(object => {
        if (object.userData && (object.userData.type === 'wall' || 
            object.userData.type === 'start' || 
            object.userData.type === 'goal')) {
            objectsToRemove.push(object);
        }
    });
    
    console.log("Removing", objectsToRemove.length, "objects from scene");
    objectsToRemove.forEach(object => {
        window.scene.remove(object);
    });
}

// Add new function to properly position the player at the start
function positionPlayerAtStart() {
    console.log("Positioning player at start");
    
    if (!window.controls) {
        console.error("Controls not initialized, cannot position player");
        return;
    }
    
    if (!window.gameState || !window.gameState.playerStartPosition) {
        console.error("Player start position not defined");
        return;
    }
    
    const startPos = window.gameState.playerStartPosition;
    console.log("Setting player to start position:", startPos);
    
    try {
        // Set player position
        window.controls.getObject().position.set(
            startPos.x,
            startPos.y,
            startPos.z
        );
        
        // Set initial direction (looking down the first hallway)
        const euler = new THREE.Euler(0, -Math.PI/2, 0, 'YXZ');
        window.controls.getObject().quaternion.setFromEuler(euler);
        
        // Reset velocity
        if (window.velocity) {
            window.velocity.x = 0;
            window.velocity.y = 0;
            window.velocity.z = 0;
        }
        
        // Force an immediate render to reflect the new position
        if (window.renderer && window.scene && window.camera) {
            window.renderer.render(window.scene, window.camera);
        }
        
        console.log("Player successfully positioned at:", window.controls.getObject().position.toArray());
    } catch (error) {
        console.error("Error positioning player:", error);
    }
}

// Create the maze environment
function createMaze() {
    console.log("Creating maze environment");
    
    // Ensure we have a default player start position in case something goes wrong
    if (!window.gameState.playerStartPosition) {
        window.gameState.playerStartPosition = { x: 0, y: 1.6, z: 0 };
        console.log("Set default player start position");
    }
    
    // Create floor first
    createFloor();
    
    // Generate maze layout - this sets player start position
    generateMazeLayout();
    
    // Create maze walls based on layout
    createWalls();
    
    // Create start and goal markers
    createStartAndGoal();
    
    // Add some ambient light to ensure the level is visible
    const ambientLight = new THREE.AmbientLight(0x404040, 1); // Increase the intensity
    window.scene.add(ambientLight);
    
    // Add a directional light to improve visibility
    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
    directionalLight.position.set(5, 10, 7);
    window.scene.add(directionalLight);
    
    // Force a render to show the maze
    if (window.renderer && window.scene && window.camera) {
        window.renderer.render(window.scene, window.camera);
    }
    
    console.log("Maze creation complete. Player start position:", window.gameState.playerStartPosition);
}

// Generate a winding corridor layout instead of a maze
function generateMazeLayout() {
    console.log("Generating winding corridor layout");
    
    const size = window.config.mazeSize;
    
    // Initialize maze grid (2D array)
    window.mazeGrid = [];
    for (let i = 0; i < size; i++) {
        window.mazeGrid[i] = [];
        for (let j = 0; j < size; j++) {
            // 1 = wall, 0 = path
            window.mazeGrid[i][j] = 1;
        }
    }
    
    // Set player start position near one edge
    const startX = 1;
    const startY = Math.floor(size / 2);
    
    // Set player start position in world coordinates
    window.gameState.playerStartPosition = {
        x: (startX - size/2) * window.config.corridorWidth,
        y: 1.6,
        z: (startY - size/2) * window.config.corridorWidth
    };
    
    // Create winding path
    const path = createWindingPath(startX, startY, size);
    
    // Set goal position at the end of the path
    const endPoint = path[path.length - 1];
    window.gameState.goalPosition = {
        x: (endPoint.x - size/2) * window.config.corridorWidth,
        y: 0,
        z: (endPoint.y - size/2) * window.config.corridorWidth
    };
    
    // Apply path to maze grid
    for (const point of path) {
        window.mazeGrid[point.x][point.y] = 0;
    }
    
    console.log("Winding corridor layout generated");
}

// Create a winding path from start to end
function createWindingPath(startX, startY, size) {
    console.log("Creating winding path");
    
    const path = [{x: startX, y: startY}];
    const visited = new Set();
    visited.add(`${startX},${startY}`);
    
    // Target end position on the opposite side
    const endX = size - 2;
    
    let currentX = startX;
    let currentY = startY;
    let reachedEnd = false;
    
    // Ensure we're making progress toward the end
    while (!reachedEnd) {
        // Possible directions (right, down, left, up)
        const directions = [
            {dx: 1, dy: 0},  // right
            {dx: 0, dy: 1},  // down
            {dx: 0, dy: -1}, // up
            {dx: -1, dy: 0}  // left
        ];
        
        // Bias toward moving right (toward end)
        if (currentX < endX) {
            directions.sort(() => 0.5 - Math.random());
            // Move the "right" direction to the front with higher probability
            if (Math.random() < 0.7) {
                directions.sort((a, b) => b.dx - a.dx);
            }
        }
        
        let moved = false;
        
        // Try each direction
        for (const {dx, dy} of directions) {
            const nextX = currentX + dx;
            const nextY = currentY + dy;
            const key = `${nextX},${nextY}`;
            
            // Check if position is valid and not visited
            if (
                nextX > 0 && nextX < size - 1 && 
                nextY > 0 && nextY < size - 1 && 
                !visited.has(key)
            ) {
                // Add to path
                path.push({x: nextX, y: nextY});
                visited.add(key);
                
                // Update current position
                currentX = nextX;
                currentY = nextY;
                moved = true;
                
                // Check if we've reached the target end column
                if (currentX === endX) {
                    reachedEnd = true;
                }
                
                break;
            }
        }
        
        // If we can't move, backtrack
        if (!moved && path.length > 1) {
            path.pop();
            const previous = path[path.length - 1];
            currentX = previous.x;
            currentY = previous.y;
        }
        
        // Safety check to prevent infinite loops
        if (path.length > size * size) {
            console.warn("Path generation taking too long, forcing end");
            reachedEnd = true;
        }
    }
    
    console.log(`Created winding path with ${path.length} segments`);
    return path;
}

// Create maze walls based on layout
function createWalls() {
    console.log("Creating maze walls");
    
    const size = window.config.mazeSize;
    const corridorWidth = window.config.corridorWidth;
    const wallHeight = window.config.corridorHeight;
    
    // Create wall materials with synthwave aesthetics
    // Main wall material with grid pattern
    const wallMaterial = new THREE.MeshStandardMaterial({
        color: 0x220033, // Deep purple base
        emissive: 0x110022,
        metalness: 0.7,
        roughness: 0.3
    });
    
    // Glowing edge material for neon effect
    const edgeMaterial = new THREE.MeshBasicMaterial({
        color: 0xff00ff, // Hot pink
        emissive: 0xff00ff,
        transparent: true,
        opacity: 0.9
    });
    
    // Clear existing walls
    window.walls = [];
    
    // Create walls based on maze grid
    for (let i = 0; i < size; i++) {
        for (let j = 0; j < size; j++) {
            if (window.mazeGrid[i][j] === 1) {
                // Create main wall geometry
                const wallGeometry = new THREE.BoxGeometry(corridorWidth, wallHeight, corridorWidth);
                const wall = new THREE.Mesh(wallGeometry, wallMaterial);
                
                // Position wall in world space
                const x = (i - size/2) * corridorWidth;
                const z = (j - size/2) * corridorWidth;
                wall.position.set(x, wallHeight/2, z);
                
                // Add grid pattern texture
                addGridPatternToWall(wall);
                
                // Add glowing edges to each wall
                addGlowingEdges(wall, x, z, corridorWidth, wallHeight);
                
                // Make sure walls are properly tagged
                wall.userData = { 
                    type: 'wall',
                    isWall: true 
                };
                
                window.scene.add(wall);
                window.walls.push(wall);
            }
        }
    }
    
    console.log(`Created ${window.walls.length} walls`);
}

// Add grid pattern to wall
function addGridPatternToWall(wall) {
    // Create canvas for dynamic texture
    const canvas = document.createElement('canvas');
    canvas.width = 256;
    canvas.height = 256;
    const ctx = canvas.getContext('2d');
    
    // Fill background
    ctx.fillStyle = '#220033';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    // Draw grid lines
    ctx.strokeStyle = '#ff00ff';
    ctx.lineWidth = 1;
    ctx.globalAlpha = 0.3;
    
    // Horizontal lines
    const gridSize = 32;
    for (let y = 0; y <= canvas.height; y += gridSize) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(canvas.width, y);
        ctx.stroke();
    }
    
    // Vertical lines
    for (let x = 0; x <= canvas.width; x += gridSize) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, canvas.height);
        ctx.stroke();
    }
    
    // Create texture from canvas
    const texture = new THREE.CanvasTexture(canvas);
    texture.wrapS = THREE.RepeatWrapping;
    texture.wrapT = THREE.RepeatWrapping;
    texture.repeat.set(1, 1);
    
    // Apply texture to wall material
    wall.material.map = texture;
    wall.material.needsUpdate = true;
}

// Add glowing neon edges to wall
function addGlowingEdges(wall, x, z, width, height) {
    // Top edge (cyan)
    const topEdgeGeometry = new THREE.BoxGeometry(width, 0.1, width);
    const topEdgeMaterial = new THREE.MeshBasicMaterial({ 
        color: 0x00ffff,
        transparent: true,
        opacity: 0.9
    });
    const topEdge = new THREE.Mesh(topEdgeGeometry, topEdgeMaterial);
    topEdge.position.set(0, height/2 + 0.05, 0);
    wall.add(topEdge);
    
    // Bottom edge (magenta)
    const bottomEdgeGeometry = new THREE.BoxGeometry(width, 0.1, width);
    const bottomEdgeMaterial = new THREE.MeshBasicMaterial({ 
        color: 0xff00ff,
        transparent: true,
        opacity: 0.9
    });
    const bottomEdge = new THREE.Mesh(bottomEdgeGeometry, bottomEdgeMaterial);
    bottomEdge.position.set(0, -height/2 - 0.05, 0);
    wall.add(bottomEdge);
    
    // Create a point light at the center of the wall for additional glow effect
    if (Math.random() < 0.1) { // Only add lights to some walls to avoid performance issues
        const light = new THREE.PointLight(0xff00ff, 0.5, width);
        light.position.set(0, 0, 0);
        wall.add(light);
    }
}

// Create start and goal markers
function createStartAndGoal() {
    console.log("Creating start and goal markers");
    
    // Create start marker (green cylinder)
    const startGeometry = new THREE.CylinderGeometry(1, 1, 0.2, 32);
    const startMaterial = new THREE.MeshStandardMaterial({
        color: 0x00ff00,
        emissive: 0x003300,
        metalness: 0.3,
        roughness: 0.7
    });
    
    const startMarker = new THREE.Mesh(startGeometry, startMaterial);
    startMarker.position.set(
        window.gameState.playerStartPosition.x,
        0.1,
        window.gameState.playerStartPosition.z
    );
    window.scene.add(startMarker);
    
    // Create goal marker (red cylinder)
    const goalGeometry = new THREE.CylinderGeometry(1, 1, 0.2, 32);
    const goalMaterial = new THREE.MeshStandardMaterial({
        color: 0xff0000,
        emissive: 0x330000,
        metalness: 0.3,
        roughness: 0.7
    });
    
    const goalMarker = new THREE.Mesh(goalGeometry, goalMaterial);
    goalMarker.position.set(
        window.gameState.goalPosition.x,
        0.1,
        window.gameState.goalPosition.z
    );
    window.scene.add(goalMarker);
    
    // Add a light to the goal to make it more visible
    const goalLight = new THREE.PointLight(0xff0000, 1, 10);
    goalLight.position.set(0, 2, 0);
    goalMarker.add(goalLight);
    
    // Store references
    window.startMarker = startMarker;
    window.goalMarker = goalMarker;
    
    startMarker.userData = { type: 'start' };
    goalMarker.userData = { type: 'goal' };
    
    console.log("Start and goal markers created");
}

// Create enemies at strategic positions in the maze
function createEnemies() {
    console.log("Creating enemies");
    
    // Clear existing enemies
    window.enemies.forEach(enemy => {
        window.scene.remove(enemy);
    });
    window.enemies = [];
    
    // Get path cells from the maze
    const size = window.config.mazeSize;
    const pathCells = [];
    
    for (let i = 0; i < size; i++) {
        for (let j = 0; j < size; j++) {
            if (window.mazeGrid[i][j] === 0) {
                pathCells.push({x: i, y: j});
            }
        }
    }
    
    // Sort path by distance from start to better place enemies along the path
    const startX = Math.floor(window.gameState.playerStartPosition.x / window.config.corridorWidth + size/2);
    const startZ = Math.floor(window.gameState.playerStartPosition.z / window.config.corridorWidth + size/2);
    
    pathCells.sort((a, b) => {
        const distA = Math.sqrt(Math.pow(a.x - startX, 2) + Math.pow(a.y - startZ, 2));
        const distB = Math.sqrt(Math.pow(b.x - startX, 2) + Math.pow(b.y - startZ, 2));
        return distA - distB;
    });
    
    // Place enemies at intervals along the path
    const skipStart = 10; // Safe distance from start to prevent immediate activation
    const skipEnd = 1; // Only skip the very last cell to ensure enemies are positioned almost to the end
    const enemyCount = 20; // Increased to 20 as requested
    
    // Calculate usable path - from safe starting distance to almost the end
    const usablePath = pathCells.slice(skipStart, pathCells.length - skipEnd);
    
    // Calculate spacing to distribute enemies evenly across the full path
    const enemySpacing = Math.floor(usablePath.length / enemyCount);
    
    // Ensure we're placing enemies along the full path
    console.log(`Path length: ${pathCells.length}, Usable path: ${usablePath.length}, Spacing: ${enemySpacing}`);
    
    // Create enemies at calculated positions
    for (let i = 0; i < enemyCount; i++) {
        // Use fractional distribution to ensure we cover the full range
        const progress = i / (enemyCount - 1); // 0 to 1 range
        const cellIndex = Math.floor(progress * (usablePath.length - 1));
        
        if (cellIndex < usablePath.length) {
            const cell = usablePath[cellIndex];
            
            // Calculate position in world coordinates
            const x = (cell.x - size/2) * window.config.corridorWidth;
            const z = (cell.y - size/2) * window.config.corridorWidth;
            
            createEnemy(x, z);
        }
    }
    
    console.log(`Created ${window.enemies.length} enemies along a path of ${pathCells.length} cells`);
}

// Create enemy at a given position
function createEnemy(x, z) {
    // Use an icosahedron for a more complex geometric shape
    const enemyGeometry = new THREE.IcosahedronGeometry(1.0, 0);
    const enemyMaterial = new THREE.MeshBasicMaterial({
        color: 0xffff00, // Yellow
        transparent: false,
        opacity: 1.0
    });
    
    const enemy = new THREE.Mesh(enemyGeometry, enemyMaterial);
    
    // Position the enemy
    enemy.position.set(x, 1.5, z);
    
    // Add outline
    addOutlineToEnemy(enemy);
    
    // Add light to make it visible in the dark
    const light = new THREE.PointLight(0xffff00, 1.5, 6); // Updated to match yellow color
    light.position.set(0, 0, 0);
    enemy.add(light);
    
    // Set up enemy data
    enemy.userData = {
        active: false,
        defeated: false,
        interval: null,
        chasing: false,
        originalPosition: {x, z}
    };
    
    // Add simple rotation animation
    animateEnemy(enemy);
    
    window.scene.add(enemy);
    window.enemies.push(enemy);
}

// Simplified animation for single shape enemy
function animateEnemy(enemy) {
    // Create rotation animation
    const rotate = () => {
        if (enemy && !enemy.userData.defeated) {
            // Simple consistent rotation
            enemy.rotation.x += 0.01;
            enemy.rotation.y += 0.02;
            
            // Next frame
            enemy.userData.animationId = requestAnimationFrame(rotate);
        }
    };
    
    // Start animation
    enemy.userData.animationId = requestAnimationFrame(rotate);
}

// Add outline to the complex enemy shape
function addOutlineToEnemy(enemy) {
    // Create a sphere outline that encapsulates the whole enemy
    const outlineGeometry = new THREE.SphereGeometry(1.3, 16, 16);
    const outlineMaterial = new THREE.MeshBasicMaterial({
        color: 0x00ffff,
        side: THREE.BackSide,
        transparent: true,
        opacity: 0.3
    });
    
    const outline = new THREE.Mesh(outlineGeometry, outlineMaterial);
    enemy.add(outline);
}

// Create explosion effect for defeated enemies
function createExplosionEffect(position) {
    // Number of particles in explosion
    const particleCount = 30;
    
    // Green color variations for the explosion
    const colors = [
        0x00ff00, // Bright green
        0x33ff33, // Light green
        0x00cc00, // Medium green
        0x99ff99  // Pale green
    ];
    
    // Create particle group
    const particles = [];
    
    // Create particles
    for (let i = 0; i < particleCount; i++) {
        // Random geometry for each particle
        let geometry;
        const geometryType = Math.floor(Math.random() * 3);
        
        switch(geometryType) {
            case 0:
                geometry = new THREE.TetrahedronGeometry(0.2, 0);
                break;
            case 1:
                geometry = new THREE.BoxGeometry(0.2, 0.2, 0.2);
                break;
            case 2:
                geometry = new THREE.OctahedronGeometry(0.15, 0); // Changed to match enemy geometry
                break;
        }
        
        // Random green color from color array
        const color = colors[Math.floor(Math.random() * colors.length)];
        
        const material = new THREE.MeshBasicMaterial({
            color: color,
            transparent: true,
            opacity: 1
        });
        
        const particle = new THREE.Mesh(geometry, material);
        
        // Position at explosion center
        particle.position.copy(position);
        
        // Add random velocity in all directions
        const speed = 2 + Math.random() * 5;
        const angle1 = Math.random() * Math.PI * 2;
        const angle2 = Math.random() * Math.PI * 2;
        
        particle.userData = {
            velocity: new THREE.Vector3(
                speed * Math.sin(angle1) * Math.cos(angle2),
                speed * Math.sin(angle1) * Math.sin(angle2),
                speed * Math.cos(angle1)
            ),
            rotation: new THREE.Vector3(
                Math.random() * 0.2, 
                Math.random() * 0.2, 
                Math.random() * 0.2
            ),
            lifetime: 1 + Math.random()
        };
        
        // Add to scene and tracking array
        window.scene.add(particle);
        particles.push(particle);
    }
    
    // Store for update in animation loop
    window.explosionParticles = window.explosionParticles || [];
    window.explosionParticles.push(...particles);
    
    // Add a flash of light - green to match particles
    const explosionLight = new THREE.PointLight(0x00ff00, 3, 10);
    explosionLight.position.copy(position);
    window.scene.add(explosionLight);
    
    // Remove light after a short time
    setTimeout(() => {
        window.scene.remove(explosionLight);
    }, 300);
    
    // Play explosion sound
    playExplosionSound();
}

// Play explosion sound
function playExplosionSound() {
    if (!window.audioContext) return;
    
    try {
        // Create oscillator and gain node
        const osc = window.audioContext.createOscillator();
        const gain = window.audioContext.createGain();
        
        // Connect nodes
        osc.connect(gain);
        gain.connect(window.audioContext.destination);
        
        // Configure sound
        osc.type = 'sawtooth';
        osc.frequency.value = 120;
        gain.gain.value = 0.1;
        
        // Start oscillator
        osc.start();
        
        // Frequency sweep down
        osc.frequency.exponentialRampToValueAtTime(20, window.audioContext.currentTime + 0.6);
        
        // Envelope
        gain.gain.exponentialRampToValueAtTime(0.001, window.audioContext.currentTime + 0.6);
        
        // Stop after effect is done
        setTimeout(() => {
            osc.stop();
        }, 600);
    } catch (error) {
        console.error("Error playing explosion sound:", error);
    }
}

// Handle projectile hit - replaced to properly destroy enemies
function handleProjectileHit(isLeftClick) {
    if (!window.gameState.activeEnemy) return;
    
    const enemy = window.gameState.activeEnemy;
    
    // Make sure interval is fully played before processing the hit
    if (enemy.userData.playingInterval) {
        // Wait until interval is finished playing to process the hit
        const projectileType = isLeftClick ? "left" : "right";
        console.log(`Queuing ${projectileType} projectile hit until interval finishes playing`);
        
        // Store the hit to process after the interval completes
        if (!window.queuedProjectileHits) {
            window.queuedProjectileHits = [];
        }
        
        window.queuedProjectileHits.push({
            isLeftClick: isLeftClick,
            enemy: enemy,
            timestamp: Date.now()
        });
        
        // In case the interval is stuck, check how long it's been playing
        const intervalStartTime = enemy.userData.intervalStartTime || Date.now();
        const intervalDuration = Date.now() - intervalStartTime;
        
        if (intervalDuration > 1200) { // Increased from 1000 to give more time
            console.log(`Interval has been playing for ${intervalDuration}ms, forcing completion`);
            enemy.userData.playingInterval = false;
            
            // Process this hit immediately
            processQueuedProjectileHits();
        }
        
        return;
    }
    
    // Clean up any lingering audio from the interval playback
    if (window.activeIntervalTimeouts) {
        window.activeIntervalTimeouts.forEach(timeoutId => clearTimeout(timeoutId));
        window.activeIntervalTimeouts = [];
    }
    
    if (window.activeOscillators) {
        window.activeOscillators.forEach(osc => {
            try {
                osc.stop();
                osc.disconnect();
            } catch (e) {
                // Ignore errors if already stopped
            }
        });
        window.activeOscillators = [];
    }
    
    // Get the correct interval from the enemy's userData
    const correctIntervalName = enemy.userData.correctInterval;
    
    // Ensure we have a valid interval name
    if (!correctIntervalName) {
        console.error("Missing correctInterval on enemy userData");
        return;
    }
    
    // Check if the option elements exist
    if (!window.leftOption || !window.rightOption) {
        console.error("Option elements not found during projectile hit");
        return;
    }
    
    const correct = isLeftClick 
        ? window.leftOption.dataset.correct === "true"
        : window.rightOption.dataset.correct === "true";
    
    // Get the selected interval name for tracking
    let selectedIntervalName;
    
    try {
        selectedIntervalName = isLeftClick 
            ? window.leftOption.querySelector('div:last-child').textContent.trim() 
            : window.rightOption.querySelector('div:last-child').textContent.trim();
    } catch (error) {
        console.error("Error getting interval names:", error);
        // Set default values if there's an error
        selectedIntervalName = "Unknown";
    }
    
    if (correct) {
        // Correct interval selected
        playSuccessSound();
        
        // Mark as defeated (do this first to prevent multiple hits)
        enemy.userData.defeated = true;
        
        // Hide interval options immediately
        if (window.leftOption) window.leftOption.style.display = 'none';
        if (window.rightOption) window.rightOption.style.display = 'none';
        
        // Reset active enemy
        window.gameState.activeEnemy = null;
        
        // Cancel any ongoing animations
        if (enemy.userData.animationId) {
            cancelAnimationFrame(enemy.userData.animationId);
        }
        
        // Store position for explosion
        const explosionPosition = enemy.position.clone();
        
        // Create explosion effect
        createExplosionEffect(explosionPosition);
        
        // Remove enemy from scene and array
        window.scene.remove(enemy);
        const index = window.enemies.indexOf(enemy);
        if (index > -1) {
            window.enemies.splice(index, 1);
        }
        
        // Update score with the new scoring system and force UI refresh
        updateScore(true);
    } else {
        // Wrong interval - play error sound
        playErrorSound();
        
        // Get the direction symbol
        const directionSymbol = enemy.userData.intervalDirection === "ascending" ? "↑" : "↓";
        
        // Create a combined key with interval name and direction
        const intervalWithDirection = `${correctIntervalName} ${directionSymbol}`;
        
        // Track the missed interval
        if (!window.gameState.missedIntervals) {
            window.gameState.missedIntervals = {};
        }
        
        if (!window.gameState.missedIntervals[intervalWithDirection]) {
            window.gameState.missedIntervals[intervalWithDirection] = 0;
        }
        window.gameState.missedIntervals[intervalWithDirection]++;
        
        console.log(`Missed interval: ${intervalWithDirection} (selected: ${selectedIntervalName})`);
        
        // Apply damage to player (wrong interval penalty)
        const wrongAnswerDamage = 25;
        window.gameState.playerHealth -= wrongAnswerDamage;
        
        // Create damage flash effect
        createDamageFlash();
        
        // Update health display
        updateHealthDisplay(window.gameState.playerHealth);
        
        // Force UI updates to stay in sync
        updateScoreDisplay();
        updateTimeDisplay();
        
        // Check if player is dead
        if (window.gameState.playerHealth <= 0) {
            handleGameOver();
        }
        
        // Track damage taken for scoring
        window.gameState.damageTaken += wrongAnswerDamage;
    }
}

// Function to update explosion particles in the main animation loop - enhance to improve particle behavior
function updateExplosionParticles() {
    if (!window.explosionParticles || window.explosionParticles.length === 0) return;
    
    for (let i = window.explosionParticles.length - 1; i >= 0; i--) {
        const particle = window.explosionParticles[i];
        
        // Update lifetime
        particle.userData.lifetime -= window.delta;
        
        if (particle.userData.lifetime <= 0) {
            // Remove expired particle
            window.scene.remove(particle);
            window.explosionParticles.splice(i, 1);
        } else {
            // Move particle based on velocity
            particle.position.add(
                particle.userData.velocity.clone().multiplyScalar(window.delta)
            );
            
            // Rotate particle
            particle.rotation.x += particle.userData.rotation.x;
            particle.rotation.y += particle.userData.rotation.y;
            particle.rotation.z += particle.userData.rotation.z;
            
            // Apply gravity effect
            particle.userData.velocity.y -= 9.8 * window.delta;
            
            // Fade out particle
            if (particle.material.opacity > 0) {
                particle.material.opacity = particle.userData.lifetime;
            }
        }
    }
}

// Initialize controls (pointer lock and keyboard input)
function initControls() {
    console.log("Initializing player controls");
    
    // Create pointer lock controls for camera
    window.controls = new THREE.PointerLockControls(window.camera, document.body);
    
    // Track when the game started to avoid auto-pausing right after start
    window.lastLockTime = 0;
    
    // Add pointer lock event listeners
    document.addEventListener('click', function() {
        // Only lock if game is started and not paused or over
        if (!window.controls.isLocked && window.gameState.started && 
            !window.gameState.gameOver && !window.gameState.paused) {
            window.controls.lock();
            window.lastLockTime = performance.now();
            console.log("Requesting pointer lock on click, time:", window.lastLockTime);
        }
    });
    
    // Handle pointer lock state changes
    window.controls.addEventListener('lock', function() {
        console.log("Pointer locked - controls enabled");
        window.lastLockTime = performance.now();
        
        // If we got lock after game start, make sure player is positioned correctly
        if (window.gameState.started && window.gameState.playerStartPosition) {
            // Make sure player is at the correct position
            positionPlayerAtStart();
        }
    });
    
    window.controls.addEventListener('unlock', function() {
        console.log("Pointer unlocked - controls disabled");
        
        // Get current time to compare with last lock time
        const currentTime = performance.now();
        const timeSinceLastLock = currentTime - window.lastLockTime;
        
        // Only auto-pause if it's been more than 500ms since last lock
        // This prevents pause menu from appearing right after game start
        if (window.gameState.started && !window.gameState.paused && 
            !window.gameState.gameOver && !window.gameState.gameWon && 
            timeSinceLastLock > 500) {
            console.log("Auto-pausing game due to pointer unlock");
            togglePauseMenu();
        } else {
            console.log("Skipping auto-pause, time since lock:", timeSinceLastLock);
        }
    });
    
    // Add keyboard event listeners for WASD movement
    document.addEventListener('keydown', onKeyDown);
    document.addEventListener('keyup', onKeyUp);
    
    // Add mouse event listeners for shooting
    document.addEventListener('mousedown', onMouseDown);
    
    console.log("Player controls initialized");
}

// Handle keydown events
function onKeyDown(event) {
    // Handle escape key for pause menu separately
    if (event.code === 'Escape' && window.gameState.started) {
        // Prevent multiple rapid toggles
        if (window.lastPauseTime && (Date.now() - window.lastPauseTime < 300)) {
            return;
        }
        window.lastPauseTime = Date.now();
        
        togglePauseMenu();
        return;
    }
    
    // If controls aren't locked or game is paused, don't process movement keys
    if (!window.controls.isLocked || window.gameState.paused) return;
    
    // Don't allow movement during countdown
    if (!window.gameState.canMove) return;
    
    switch(event.code) {
        case 'KeyW':
            window.moveForward = true;
            break;
        case 'KeyS':
            window.moveBackward = true;
            break;
        case 'KeyA':
            window.moveLeft = true;
            break;
        case 'KeyD':
            window.moveRight = true;
            break;
    }
}

// Handle keyup events
function onKeyUp(event) {
    // If controls aren't locked or game is paused, don't process movement keys
    if (!window.controls.isLocked || window.gameState.paused) return;
    
    // Don't allow movement during countdown
    if (!window.gameState.canMove) return;
    
    switch(event.code) {
        case 'KeyW':
            window.moveForward = false;
            break;
        case 'KeyS':
            window.moveBackward = false;
            break;
        case 'KeyA':
            window.moveLeft = false;
            break;
        case 'KeyD':
            window.moveRight = false;
            break;
    }
}

// Handle mouse down events for shooting
function onMouseDown(event) {
    // Don't process mouse clicks if game is paused
    if (!window.controls.isLocked || !window.gameState.activeEnemy || window.gameState.paused) return;
    
    // Check which mouse button was pressed
    const isLeftClick = event.button === 0;
    
    // Create projectile
    createProjectile(isLeftClick);
}

// Create a projectile
function createProjectile(isLeftClick) {
    // Create projectile geometry and material
    const projectileGeometry = new THREE.SphereGeometry(0.2, 8, 8);
    const projectileMaterial = new THREE.MeshBasicMaterial({
        color: isLeftClick ? 0x00ffff : 0xff00ff,
        transparent: true,
        opacity: 0.8
    });
    
    // Create projectile mesh
    const projectile = new THREE.Mesh(projectileGeometry, projectileMaterial);
    
    // Position at camera position - offset forward slightly to avoid immediate collisions
    projectile.position.copy(window.camera.position);
    // Get forward direction from camera
    const direction = new THREE.Vector3(0, 0, -1);
    direction.applyQuaternion(window.camera.quaternion);
    // Move projectile forward a bit to avoid immediate collisions
    projectile.position.add(direction.multiplyScalar(1.0));
    
    // Set direction to camera direction
    projectile.quaternion.copy(window.camera.quaternion);
    
    // Add user data
    projectile.userData = {
        isLeftClick: isLeftClick,
        lifetime: window.config.projectileLifetime,
        initialFrame: true // Flag first frame to prevent immediate collision
    };
    
    // Add to scene and projectiles array
    window.scene.add(projectile);
    window.projectiles.push(projectile);
    
    // Play shooting sound
    playShootSound(isLeftClick);
}

// Play shooting sound - updated to play harmonic intervals
function playShootSound(isLeftClick) {
    if (!window.audioContext || !window.gameState.activeEnemy) return;
    
    try {
        // Check if the option elements exist
        if (!window.leftOption || !window.rightOption) {
            console.error("Option elements not found when playing shoot sound");
            return;
        }
        
        // Get the interval name based on which option was selected
        let intervalOption;
        let lastDivElement;
        
        if (isLeftClick) {
            // Get interval name from left option's last div
            lastDivElement = window.leftOption.querySelector('div:last-child');
            if (!lastDivElement) {
                console.error("Left option's interval element not found");
                return;
            }
            intervalOption = lastDivElement.textContent;
        } else {
            // Get interval name from right option's last div
            lastDivElement = window.rightOption.querySelector('div:last-child');
            if (!lastDivElement) {
                console.error("Right option's interval element not found");
                return;
            }
            intervalOption = lastDivElement.textContent;
        }
        
        // Get base note and semitones for this interval
        const baseNote = 'C5'; // One octave higher than the interval demos (C4)
        const baseFrequency = window.noteFrequencies[baseNote] || window.noteFrequencies['C4'] * 2;
        const semitones = window.intervals[intervalOption];
        
        // Get the interval direction from the active enemy
        let direction = "ascending"; // Default to ascending
        if (window.gameState.activeEnemy && window.gameState.activeEnemy.userData.intervalDirection) {
            direction = window.gameState.activeEnemy.userData.intervalDirection;
        }
        
        // Calculate interval note frequency based on direction
        // For both directions, keep both notes in the octave higher range
        const intervalFrequency = direction === "ascending"
            ? baseFrequency * Math.pow(2, semitones/12)
            : baseFrequency * Math.pow(2, -semitones/12);
        
        // Create oscillators for both notes (to play simultaneously)
        const rootOsc = window.audioContext.createOscillator();
        const intervalOsc = window.audioContext.createOscillator();
        const gainNode = window.audioContext.createGain();
        
        // Configure oscillators
        rootOsc.type = 'sine';
        rootOsc.frequency.value = baseFrequency;
        
        intervalOsc.type = 'sine';
        intervalOsc.frequency.value = intervalFrequency;
        
        // Connect to audio output
        rootOsc.connect(gainNode);
        intervalOsc.connect(gainNode);
        gainNode.connect(window.audioContext.destination);
        
        // Set volume
        gainNode.gain.value = 0.15;
        
        // Start playing both notes together (harmonic interval)
        rootOsc.start();
        intervalOsc.start();
        
        // Fade out and stop after a short time
        setTimeout(() => {
            gainNode.gain.exponentialRampToValueAtTime(0.001, window.audioContext.currentTime + 0.1);
            setTimeout(() => {
                rootOsc.stop();
                intervalOsc.stop();
            }, 100);
        }, 200);
        
        console.log(`Played harmonic interval: ${intervalOption} (${baseFrequency.toFixed(2)}Hz + ${intervalFrequency.toFixed(2)}Hz)`);
    } catch (error) {
        console.error("Error playing shoot sound:", error);
    }
}

// Update player movement based on input
function updatePlayerMovement(delta) {
    // Early exit if pointer is not locked, game not started, or game is paused
    if (!window.controls.isLocked || !window.gameState.started) return;
    
    // Don't allow movement during countdown
    if (!window.gameState.canMove) return;
    
    // Apply friction to slow down movement
    window.velocity.x -= window.velocity.x * 10.0 * delta;
    window.velocity.z -= window.velocity.z * 10.0 * delta;
    
    // Determine movement direction
    window.direction.z = Number(window.moveForward) - Number(window.moveBackward);
    window.direction.x = Number(window.moveRight) - Number(window.moveLeft);
    window.direction.normalize(); // Ensures consistent movement speed in all directions
    
    // Calculate movement speed
    const moveSpeed = window.config.moveSpeed;
    
    // Apply movement input to velocity
    if (window.moveForward || window.moveBackward) {
        window.velocity.z -= window.direction.z * moveSpeed * delta;
    }
    
    if (window.moveLeft || window.moveRight) {
        window.velocity.x -= window.direction.x * moveSpeed * delta;
    }
    
    // Apply velocity to camera position (player movement)
    window.controls.moveRight(-window.velocity.x * delta);
    window.controls.moveForward(-window.velocity.z * delta);
    
    // Keep player at constant y-position to prevent wall climbing
    window.controls.getObject().position.y = window.gameState.playerStartPosition.y;
    
    // Apply collision detection
    handleCollisions();
}

// Handle collisions with walls
function handleCollisions() {
    // Get player position
    const playerPosition = new THREE.Vector3();
    window.camera.getWorldPosition(playerPosition);
    
    // Player collision radius
    const playerRadius = 0.5;
    
    // Check collision with each wall
    for (const wall of window.walls) {
        // Get wall bounding box
        const wallBox = new THREE.Box3().setFromObject(wall);
        
        // Expand box by player radius (simple approximation)
        wallBox.min.x -= playerRadius;
        wallBox.min.y -= playerRadius;
        wallBox.min.z -= playerRadius;
        wallBox.max.x += playerRadius;
        wallBox.max.y += playerRadius;
        wallBox.max.z += playerRadius;
        
        // Check if player intersects with expanded box
        if (wallBox.containsPoint(playerPosition)) {
            // Collision detected - calculate push direction
            const wallCenter = new THREE.Vector3();
            wallBox.getCenter(wallCenter);
            
            const pushDirection = new THREE.Vector3()
                .subVectors(playerPosition, wallCenter)
                .normalize();
                
            // Ensure we only push in the XZ plane (horizontally)
            pushDirection.y = 0;
            
            // Push player away from wall
            window.camera.position.add(
                pushDirection.multiplyScalar(0.1) // Small push to resolve collision
            );
            
            // Reset velocity in this direction
            window.velocity.set(0, 0, 0);
            
            // Ensure player Y position stays constant
            window.camera.position.y = window.gameState.playerStartPosition.y;
        }
    }
}

// Check enemy proximity and trigger interaction
function checkEnemyProximity() {
    if (!window.gameState.started || window.gameState.gameOver) return;
    
    // Get player position
    const playerPosition = new THREE.Vector3();
    window.camera.getWorldPosition(playerPosition);
    
    // Activation distance
    const activationDistance = window.config.enemyDistance;
    
    // Check each enemy
    for (const enemy of window.enemies) {
        if (enemy.userData.defeated) continue;
        
        const distance = playerPosition.distanceTo(enemy.position);
        
        // If close to an enemy
        if (distance < activationDistance) {
            // If no active enemy currently, activate this one
            if (!window.gameState.activeEnemy && !enemy.userData.active) {
                activateEnemy(enemy);
            }
            
            // Start chasing if not already chasing
            if (!enemy.userData.chasing) {
                enemy.userData.chasing = true;
            }
        } else {
            // If this was the active enemy but player moved away, deactivate
            if (enemy === window.gameState.activeEnemy) {
                deactivateEnemy(enemy);
            }
            
            // Stop chasing if too far away
            if (enemy.userData.chasing && distance > activationDistance * 1.5) {
                enemy.userData.chasing = false;
            }
        }
        
        // Update enemy movement
        updateEnemyMovement(enemy, playerPosition, distance);
    }
    
    // Check if player reached the goal
    const goalDistance = playerPosition.distanceTo(
        new THREE.Vector3(
            window.gameState.goalPosition.x,
            playerPosition.y,
            window.gameState.goalPosition.z
        )
    );
    
    if (goalDistance < window.config.goalDistance) {
        handleGoalReached();
    }
}

// Update enemy movement
function updateEnemyMovement(enemy, playerPosition, distance) {
    if (enemy.userData.defeated || !enemy.userData.chasing) {
        // If not chasing, move back to original position
        if (!enemy.userData.defeated) {
            const originalPos = enemy.userData.originalPosition;
            const currentPos = enemy.position;
            
            const direction = new THREE.Vector3(
                originalPos.x - currentPos.x,
                0,
                originalPos.z - currentPos.z
            );
            
            // Only move if not already at original position
            if (direction.length() > 0.5) {
                direction.normalize();
                
                // Calculate new position
                const newPosition = new THREE.Vector3(
                    currentPos.x + direction.x * window.config.enemyMoveSpeed * 0.5 * window.delta,
                    currentPos.y,
                    currentPos.z + direction.z * window.config.enemyMoveSpeed * 0.5 * window.delta
                );
                
                // Check for wall collisions before moving
                if (!checkEnemyWallCollision(enemy, newPosition)) {
                    // No collision, safe to move
                    enemy.position.copy(newPosition);
                }
            }
        }
        return;
    }
    
    // Calculate direction to player
    const direction = new THREE.Vector3(
        playerPosition.x - enemy.position.x,
        0, // Keep y-position constant
        playerPosition.z - enemy.position.z
    );
    
    // Normalize direction
    direction.normalize();
    
    // Calculate new position
    const newPosition = new THREE.Vector3(
        enemy.position.x + direction.x * window.config.enemyMoveSpeed * window.delta,
        enemy.position.y,
        enemy.position.z + direction.z * window.config.enemyMoveSpeed * window.delta
    );
    
    // Check for wall collisions before moving
    if (!checkEnemyWallCollision(enemy, newPosition)) {
        // No collision, safe to move
        enemy.position.copy(newPosition);
    }
    
    // Check for collision with player
    if (distance < 1) {
        handleEnemyCollision(enemy);
    }
}

// New function to check if an enemy position collides with walls
function checkEnemyWallCollision(enemy, newPosition) {
    // Enemy collision radius
    const enemyRadius = 0.5;
    
    // Check collision with each wall
    for (const wall of window.walls) {
        // Get wall bounding box
        const wallBox = new THREE.Box3().setFromObject(wall);
        
        // Expand box by enemy radius (simple approximation)
        wallBox.min.x -= enemyRadius;
        wallBox.min.y -= enemyRadius;
        wallBox.min.z -= enemyRadius;
        wallBox.max.x += enemyRadius;
        wallBox.max.y += enemyRadius;
        wallBox.max.z += enemyRadius;
        
        // Check if new position intersects with expanded box
        if (wallBox.containsPoint(newPosition)) {
            // Collision detected
            return true;
        }
    }
    
    // No collision detected
    return false;
}

// Handle enemy collision with player
function handleEnemyCollision(enemy) {
    // Only damage player if enemy is not defeated
    if (!enemy.userData.defeated) {
        // Reduce player health
        window.gameState.playerHealth -= window.config.enemyDamage;
        
        // Update health display
        updateHealthDisplay(window.gameState.playerHealth);
        
        // Play damage sound
        playDamageSound();
        
        // Create damage flash effect
        createDamageFlash();
        
        // Check if player is dead
        if (window.gameState.playerHealth <= 0) {
            handleGameOver();
        }
        
        // Push enemy away slightly to prevent continuous damage
        const playerPosition = new THREE.Vector3();
        window.camera.getWorldPosition(playerPosition);
        
        const pushDirection = new THREE.Vector3(
            enemy.position.x - playerPosition.x,
            0,
            enemy.position.z - playerPosition.z
        ).normalize();
        
        enemy.position.x += pushDirection.x * 2;
        enemy.position.z += pushDirection.z * 2;
        
        // Track damage taken for scoring
        window.gameState.damageTaken += window.config.enemyDamage;
    }
}

// Play damage sound
function playDamageSound() {
    if (!window.audioContext) return;
    
    try {
        const osc = window.audioContext.createOscillator();
        const gain = window.audioContext.createGain();
        
        osc.type = 'sawtooth';
        osc.frequency.value = 100;
        osc.connect(gain);
        
        gain.connect(window.audioContext.destination);
        gain.gain.value = 0.2;
        
        osc.start();
        osc.frequency.exponentialRampToValueAtTime(
            20, 
            window.audioContext.currentTime + 0.2
        );
        
        setTimeout(() => {
            gain.gain.exponentialRampToValueAtTime(0.001, window.audioContext.currentTime + 0.1);
            setTimeout(() => {
                osc.stop();
            }, 100);
        }, 200);
    } catch (error) {
        console.error("Error playing damage sound:", error);
    }
}

// Update health display
function updateHealthDisplay(health) {
    if (!window.healthBar || !window.healthValue) return;
    
    // Update health bar width
    window.healthBar.style.width = `${health}%`;
    
    // Update health text
    window.healthValue.textContent = `${health}%`;
    
    // Change color based on health level
    if (health <= 25) {
        window.healthBar.style.opacity = 0.7 + 0.3 * Math.sin(Date.now() * 0.01); // Pulsing effect at low health
    } else {
        window.healthBar.style.opacity = 1;
    }
}

// Handle game over
function handleGameOver() {
    console.log("Game over");
    
    window.gameState.gameOver = true;
    
    // Calculate the final score components
    const baseScore = window.gameState.score;
    const completionTime = window.gameState.completionTime || 
        ((Date.now() - window.gameState.startTime) / 1000);
    const timePenalty = Math.floor(completionTime * 10);
    const healthPercentage = window.gameState.playerHealth / window.config.playerHealth;
    const healthBonus = Math.floor(5000 * healthPercentage);
    const damagePenalty = window.gameState.damageTaken * 50;
    const missedProjectilesPenalty = window.gameState.missedProjectiles * 100;
    const finalScore = calculateFinalScore();
    
    // Create missed intervals HTML
    let missedIntervalsHTML = '';
    if (window.gameState.missedIntervals && Object.keys(window.gameState.missedIntervals).length > 0) {
        missedIntervalsHTML = `
            <div style="text-align: left; margin-top: 15px; margin-bottom: 15px; font-size: 14px; border: 1px solid rgba(255,0,85,0.5); padding: 10px; border-radius: 5px;">
                <div style="color: #ff7755; font-weight: bold; margin-bottom: 5px;">Missed Intervals:</div>
        `;
        
        for (const interval in window.gameState.missedIntervals) {
            const count = window.gameState.missedIntervals[interval];
            // Format interval name and direction
            const formattedInterval = interval.replace(/([A-Za-z0-9 ]+) (↑|↓)/, '<span style="color: #ff7755;">$1</span> <span style="font-size: 18px;">$2</span>');
            missedIntervalsHTML += `<div>${formattedInterval}: ${count} time${count > 1 ? 's' : ''}</div>`;
        }
        
        missedIntervalsHTML += '</div>';
    } else {
        missedIntervalsHTML = '<div style="margin: 15px 0;">Great job! You didn\'t miss any intervals.</div>';
    }
    
    // Add missed projectiles information
    const missedProjectilesHTML = window.gameState.missedProjectiles > 0 ? 
        `<div style="margin: 15px 0; color: #ff7755;">Missed Projectiles: ${window.gameState.missedProjectiles}</div>` : 
        '<div style="margin: 15px 0;">Perfect aim! No projectiles missed.</div>';
    
    // Create game over message
    const gameOverMsg = document.createElement('div');
    gameOverMsg.id = 'game-over-message';
    gameOverMsg.style.cssText = `
        position: absolute;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        background: rgba(0,0,0,0.8);
        color: #ff3366;
        padding: 30px;
        border-radius: 10px;
        text-align: center;
        font-family: Arial, sans-serif;
        border: 2px solid #ff3366;
        box-shadow: 0 0 20px #ff3366;
        z-index: 1000;
        min-width: 300px;
    `;
    
    gameOverMsg.innerHTML = `
        <h1 style="color: #ff3366; text-shadow: 0 0 10px #ff3366; margin-bottom: 15px;">Game Over</h1>
        <div style="font-size: 18px; margin-bottom: 20px;">You were defeated!</div>
        <div style="text-align: left; margin: 20px 0; border: 1px solid rgba(255,255,255,0.2); padding: 15px; border-radius: 5px;">
            <div><span style="color: #cccccc;">Base Score:</span> <span style="float: right;">${baseScore}</span></div>
            <div><span style="color: #cccccc;">Time:</span> <span style="float: right;">${completionTime.toFixed(1)}s</span></div>
            <div><span style="color: #cccccc;">Time Penalty:</span> <span style="float: right; color: #ff7777;">-${timePenalty}</span></div>
            <div><span style="color: #cccccc;">Health Bonus:</span> <span style="float: right; color: #77ff77;">+${healthBonus}</span></div>
            <div><span style="color: #cccccc;">Damage Penalty:</span> <span style="float: right; color: #ff7777;">-${damagePenalty}</span></div>
            <div><span style="color: #cccccc;">Missed Projectiles Penalty:</span> <span style="float: right; color: #ff7777;">-${missedProjectilesPenalty}</span></div>
            <div style="border-top: 1px solid rgba(255,255,255,0.2); margin-top: 10px; padding-top: 10px;"><span style="color: white; font-weight: bold;">Final Score:</span> <span style="float: right; font-weight: bold; color: #ffff77;">${finalScore}</span></div>
        </div>
        ${missedIntervalsHTML}
        ${missedProjectilesHTML}
        <div style="margin-top: 20px; display: flex; justify-content: center; gap: 10px;">
            <button id="try-again-button" style="background: linear-gradient(to right, #ff3366, #00ffff); border: none; color: white; padding: 10px 20px; cursor: pointer; border-radius: 5px; text-shadow: 0 0 5px rgba(255,255,255,0.5); box-shadow: 0 0 10px rgba(255,0,255,0.5);">Try Again</button>
            <button id="main-menu-button" style="background: rgba(100,100,150,0.5); border: 1px solid rgba(255,255,255,0.3); color: white; padding: 10px 20px; cursor: pointer; border-radius: 5px;">Main Menu</button>
        </div>
    `;
    
    document.body.appendChild(gameOverMsg);
    
    // Add event listeners to buttons
    const tryAgainButton = document.getElementById('try-again-button');
    if (tryAgainButton) {
        tryAgainButton.addEventListener('click', function() {
            console.log("Try again button clicked");
            // First remove the game over message
            const gameOverMsg = document.getElementById('game-over-message');
            if (gameOverMsg) {
                gameOverMsg.remove();
            }
            // Call restartGame with a short delay to ensure cleanup
            setTimeout(() => {
                restartGame();
            }, 100);
        });
    } else {
        console.error("Could not find try again button");
    }
    
    const mainMenuButton = document.getElementById('main-menu-button');
    if (mainMenuButton) {
        mainMenuButton.addEventListener('click', function() {
            console.log("Main menu button clicked");
            // First remove the game over message
            const gameOverMsg = document.getElementById('game-over-message');
            if (gameOverMsg) {
                gameOverMsg.remove();
            }
            
            // Ensure we're setting the game as not started BEFORE calling returnToMainMenu
            window.gameState.started = false;
            window.gameState.gameOver = false;
            
            // Return to main menu
            returnToMainMenu();
            
            // Double-check that the instructions are visible
            const instructions = document.getElementById('instructions');
            if (instructions) {
                console.log("Making sure instructions panel is visible");
                instructions.style.display = 'block';
            }
            
            // Ensure controls are unlocked
            if (window.controls) {
                window.controls.unlock();
            }
        });
    } else {
        console.error("Could not find main menu button");
    }
    
    // Release pointer lock
    if (window.controls && window.controls.isLocked) {
        console.log("Releasing pointer lock for game over");
        window.controls.unlock();
    }
    
    // Fade out background music
    fadeOutBackgroundMusic();
}

// Handle reaching the goal
function handleGoalReached() {
    console.log("Goal reached");
    
    window.gameState.gameWon = true;
    window.gameState.gameOver = true;
    
    // Calculate final score
    window.gameState.completionTime = (Date.now() - window.gameState.startTime) / 1000; // Convert to seconds
    
    // Calculate the final score components
    const baseScore = window.gameState.score;
    const timePenalty = Math.floor(window.gameState.completionTime * 10);
    const healthPercentage = window.gameState.playerHealth / window.config.playerHealth;
    const healthBonus = Math.floor(5000 * healthPercentage);
    const damagePenalty = window.gameState.damageTaken * 50;
    const finalScore = calculateFinalScore();
    
    // Create missed intervals HTML
    let missedIntervalsHTML = '';
    if (window.gameState.missedIntervals && Object.keys(window.gameState.missedIntervals).length > 0) {
        missedIntervalsHTML = `
            <div style="text-align: left; margin-top: 15px; margin-bottom: 15px; font-size: 14px; border: 1px solid rgba(0,255,255,0.5); padding: 10px; border-radius: 5px;">
                <div style="color: #00ffaa; font-weight: bold; margin-bottom: 5px;">Intervals to Practice:</div>
        `;
        
        for (const interval in window.gameState.missedIntervals) {
            const count = window.gameState.missedIntervals[interval];
            // Format interval name and direction
            const formattedInterval = interval.replace(/([A-Za-z0-9 ]+) (↑|↓)/, '<span style="color: #00ffaa;">$1</span> <span style="font-size: 18px;">$2</span>');
            missedIntervalsHTML += `<div>${formattedInterval}: ${count} time${count > 1 ? 's' : ''}</div>`;
        }
        
        missedIntervalsHTML += '</div>';
    } else {
        missedIntervalsHTML = '<div style="margin: 15px 0; color: #00ffaa;">Perfect interval recognition! No mistakes made.</div>';
    }
    
    // Add missed projectiles information
    const missedProjectilesHTML = window.gameState.missedProjectiles > 0 ? 
        `<div style="margin: 15px 0; color: #00ffaa;">Missed Projectiles: ${window.gameState.missedProjectiles}</div>` : 
        '<div style="margin: 15px 0; color: #00ffaa;">Perfect aim! No projectiles missed.</div>';
    
    // Create victory message
    const victoryMsg = document.createElement('div');
    victoryMsg.id = 'victory-message';
    victoryMsg.style.cssText = `
        position: absolute;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        background: rgba(0,0,0,0.8);
        color: #00ffff;
        padding: 30px;
        border-radius: 10px;
        text-align: center;
        font-family: Arial, sans-serif;
        border: 2px solid #00ffff;
        box-shadow: 0 0 20px #00ffff;
        z-index: 1000;
        min-width: 300px;
    `;
    
    // Set content
    victoryMsg.innerHTML = `
        <h1 style="color: #00ffff; text-shadow: 0 0 10px #00ffff; margin-bottom: 15px;">Level Complete!</h1>
        <div style="font-size: 18px; margin-bottom: 20px;">You reached the goal!</div>
        <div style="text-align: left; margin: 20px 0; border: 1px solid rgba(255,255,255,0.2); padding: 15px; border-radius: 5px;">
            <div><span style="color: #cccccc;">Base Score:</span> <span style="float: right;">${baseScore}</span></div>
            <div><span style="color: #cccccc;">Time:</span> <span style="float: right;">${window.gameState.completionTime.toFixed(1)}s</span></div>
            <div><span style="color: #cccccc;">Time Penalty:</span> <span style="float: right; color: #ff7777;">-${timePenalty}</span></div>
            <div><span style="color: #cccccc;">Health Bonus:</span> <span style="float: right; color: #77ff77;">+${healthBonus}</span></div>
            <div><span style="color: #cccccc;">Damage Penalty:</span> <span style="float: right; color: #ff7777;">-${damagePenalty}</span></div>
            <div><span style="color: #cccccc;">Missed Projectiles Penalty:</span> <span style="float: right; color: #ff7777;">-${missedProjectilesPenalty}</span></div>
            <div style="border-top: 1px solid rgba(255,255,255,0.2); margin-top: 10px; padding-top: 10px;"><span style="color: white; font-weight: bold;">Final Score:</span> <span style="float: right; font-weight: bold; color: #ffff77;">${finalScore}</span></div>
        </div>
        ${missedIntervalsHTML}
        ${missedProjectilesHTML}
        <div style="margin-top: 20px; display: flex; justify-content: center; gap: 10px;">
            <button id="play-again-button" style="background: linear-gradient(to right, #00ffff, #ff00ff); border: none; color: white; padding: 10px 20px; cursor: pointer; border-radius: 5px; text-shadow: 0 0 5px rgba(255,255,255,0.5); box-shadow: 0 0 10px rgba(0,255,255,0.5);">Play Again</button>
            <button id="victory-main-menu-button" style="background: rgba(30,30,60,0.8); border: 1px solid #ff00ff; color: #ff00ff; padding: 10px 20px; cursor: pointer; border-radius: 5px; text-shadow: 0 0 5px rgba(255,0,255,0.5);">Main Menu</button>
        </div>
    `;
    
    document.body.appendChild(victoryMsg);
    
    // Add event listeners to buttons
    const playAgainButton = document.getElementById('play-again-button');
    if (playAgainButton) {
        playAgainButton.addEventListener('click', function() {
            console.log("Play again button clicked");
            // First remove the victory message
            const victoryMsg = document.getElementById('victory-message');
            if (victoryMsg) {
                victoryMsg.remove();
            }
            // Call restartGame with a short delay to ensure cleanup
            setTimeout(() => {
                restartGame();
            }, 100);
        });
    } else {
        console.error("Could not find play again button");
    }
    
    const mainMenuButton = document.getElementById('victory-main-menu-button');
    if (mainMenuButton) {
        mainMenuButton.addEventListener('click', function() {
            console.log("Main menu button clicked");
            // First remove the victory message
            const victoryMsg = document.getElementById('victory-message');
            if (victoryMsg) {
                victoryMsg.remove();
            }
            
            // Ensure we're setting the game as not started BEFORE calling returnToMainMenu
            window.gameState.started = false;
            window.gameState.gameWon = false;
            window.gameState.gameOver = false;
            
            // Return to main menu
            returnToMainMenu();
            
            // Double-check that the instructions are visible
            const instructions = document.getElementById('instructions');
            if (instructions) {
                console.log("Making sure instructions panel is visible");
                instructions.style.display = 'block';
            }
            
            // Ensure controls are unlocked
            if (window.controls) {
                window.controls.unlock();
            }
        });
    } else {
        console.error("Could not find main menu button");
    }
    
    // Release pointer lock
    if (window.controls && window.controls.isLocked) {
        console.log("Releasing pointer lock for victory");
        window.controls.unlock();
    }
    
    // Fade out background music
    fadeOutBackgroundMusic();
}

// Function to smoothly fade out the background music
function fadeOutBackgroundMusic() {
    if (!window.backgroundMusicGain || !window.gameState.backgroundMusicPlaying) return;
    
    console.log("Fading out background music");
    
    try {
        const fadeTime = 3.0; // Time in seconds to fade out
        const currentTime = window.audioContext.currentTime;
        const currentVolume = window.backgroundMusicGain.gain.value;
        
        // Schedule a gradual decrease in volume
        window.backgroundMusicGain.gain.setValueAtTime(currentVolume, currentTime);
        window.backgroundMusicGain.gain.linearRampToValueAtTime(0.001, currentTime + fadeTime);
        
        // Stop the music after fade out - wrapping this in try/catch to prevent freeze
        setTimeout(() => {
            try {
                // Directly set to false before attempting to stop to prevent loops
                window.gameState.backgroundMusicPlaying = false;
                
                if (window.backgroundMusicElement) {
                    window.backgroundMusicElement.pause();
                    window.backgroundMusicElement.currentTime = 0;
                }
                
                // Reset gain to original value for next time
                if (window.backgroundMusicGain) {
                    window.backgroundMusicGain.gain.cancelScheduledValues(window.audioContext.currentTime);
                    window.backgroundMusicGain.gain.value = window.config.backgroundMusicVolume;
                }
            } catch (error) {
                console.error("Error stopping background music after fade:", error);
            }
        }, fadeTime * 1000);
    } catch (error) {
        console.error("Error in fadeOutBackgroundMusic:", error);
        // Fallback to direct stop if fading fails
        stopBackgroundMusic();
    }
}

// Pause background music when window is not visible
document.addEventListener('visibilitychange', () => {
    if (document.hidden) {
        // Page is not visible, pause music
        if (window.gameState.backgroundMusicPlaying) {
            window.backgroundMusicElement.pause();
        }
    } else {
        // Page is visible again, resume music if game is started
        if (window.gameState.started && !window.gameState.gameOver && window.backgroundMusicElement) {
            window.backgroundMusicElement.play()
                .then(() => {
                    window.gameState.backgroundMusicPlaying = true;
                })
                .catch(error => {
                    console.error("Error resuming background music:", error);
                });
        }
    }
});

// Restart the game
function restartGame() {
    console.log("Restarting game");
    
    try {
        // Ensure we're not in a game over state
        window.gameState.gameOver = false;
        window.gameState.gameWon = false;
        
        // Clean up any audio resources
        if (window.activeIntervalTimeouts) {
            window.activeIntervalTimeouts.forEach(timeoutId => clearTimeout(timeoutId));
            window.activeIntervalTimeouts = [];
        }
        
        if (window.activeOscillators) {
            window.activeOscillators.forEach(osc => {
                try {
                    osc.stop();
                    osc.disconnect();
                } catch (e) {
                    // Ignore errors if already stopped
                }
            });
            window.activeOscillators = [];
        }
        
        // Reset any ongoing timers or intervals
        if (window.gameTimerInterval) {
            clearInterval(window.gameTimerInterval);
            window.gameTimerInterval = null;
        }
        
        // Make sure background music is properly stopped
        stopBackgroundMusic();
        
        // Ensure audio context is valid and running
        if (window.audioContext) {
            if (window.audioContext.state === 'suspended') {
                window.audioContext.resume().catch(err => {
                    console.error("Failed to resume audio context:", err);
                });
            }
        } else {
            // If audioContext was somehow lost, recreate it
            try {
                window.audioContext = new (window.AudioContext || window.webkitAudioContext)();
                console.log("Created new audio context during restart");
            } catch(e) {
                console.error("Failed to create audio context during restart:", e);
            }
        }
        
        // Clean up any existing game elements
        // Remove enemies from scene
        window.enemies.forEach(enemy => {
            if (enemy && window.scene) {
                window.scene.remove(enemy);
            }
        });
        window.enemies = [];
        
        // Clear projectiles
        window.projectiles.forEach(projectile => {
            if (projectile && window.scene) {
                window.scene.remove(projectile);
            }
        });
        window.projectiles = [];
        
        // Reset active enemy
        window.gameState.activeEnemy = null;
        
        // Remove interval options
        if (window.leftOption) window.leftOption.style.display = 'none';
        if (window.rightOption) window.rightOption.style.display = 'none';
        
        // Hide victory message if present
        const victoryMessage = document.getElementById('victory-message');
        if (victoryMessage) {
            victoryMessage.remove();
        }
        
        // Hide game over message if present
        const gameOverMessage = document.getElementById('game-over-message');
        if (gameOverMessage) {
            gameOverMessage.remove();
        }
        
        // Explicitly reset all game state flags
        window.gameState.gameOver = false;
        window.gameState.gameWon = false;
        window.gameState.started = true;  // This is critical!
        window.gameState.paused = false;
        window.gameState.score = 0;
        window.gameState.enemiesDefeated = 0;
        window.gameState.playerHealth = window.config.playerHealth;
        window.gameState.damageTaken = 0;
        window.gameState.missedIntervals = {};
        window.gameState.backgroundMusicPlaying = false;
        window.gameState.canMove = false; // Reset movement restriction flag
        
        // Clean up existing UI displays
        const timeDisplay = document.getElementById('time-display');
        if (timeDisplay) timeDisplay.remove();
        
        const scoreDisplay = document.getElementById('score-display');
        if (scoreDisplay) scoreDisplay.remove();
        
        const healthDisplay = document.getElementById('health-display');
        if (healthDisplay) healthDisplay.remove();
        
        const enemiesDisplay = document.getElementById('enemies-display');
        if (enemiesDisplay) enemiesDisplay.remove();
        
        const existingStatsDisplay = document.getElementById('stats-display');
        if (existingStatsDisplay) {
            existingStatsDisplay.remove();
        }
        
        // Clear existing maze elements
        console.log("Clearing existing game elements");
        clearGameElements();
        
        // Fix z-index layering to ensure canvas is visible
        fixZIndexLayers();
        
        // Ensure audio context is in running state one more time before continuing
        if (window.audioContext && window.audioContext.state === 'suspended') {
            window.audioContext.resume();
        }
        
        // Make sure to recreate the maze and walls
        createMaze();
        
        // Create new enemies
        console.log("Creating new enemies for restart");
        createEnemies();
        
        // Other initialization functions
        positionPlayerAtStart();
        
        // Initialize UI elements but not the timer yet
        createTimeAndScoreDisplay();
        createHealthDisplay();
        updateEnemiesDisplay();
        
        // Reset timer display to show 00:00 during countdown
        if (window.timeValue) {
            window.timeValue.textContent = '00:00';
        }
        
        // Update score display immediately, but don't update time until GO
        updateScoreDisplay();
        
        // Reset movement flag to prevent movement before countdown completes
        window.gameState.canMove = false;
        
        // Start the countdown timer - timer will be initialized in the countdown function
        startCountdown();
        
        // Make sure z-index layering is correct
        fixZIndexLayers();
        
        // Lock controls for gameplay (wrapped in try/catch to prevent errors)
        try {
            if (window.controls) {
                window.controls.lock();
            }
        } catch (e) {
            console.error("Error locking controls:", e);
        }
        
        // Start background music with a slight delay to ensure proper setup
        setTimeout(() => {
            try {
                playBackgroundMusic();
            } catch (e) {
                console.error("Error playing background music:", e);
            }
        }, 500); // Slightly longer delay to ensure everything is ready
        
        console.log("Game restarted successfully");
    } catch (error) {
        console.error("Error restarting game:", error);
        alert("There was an error restarting the game. Please refresh the page.");
    }
}

// Cleanup resources that weren't properly released
function cleanupAudioResources() {
    // Clean up any active interval timeouts
    if (window.activeIntervalTimeouts && window.activeIntervalTimeouts.length > 0) {
        console.log(`Cleaning up ${window.activeIntervalTimeouts.length} lingering interval timeouts`);
        window.activeIntervalTimeouts.forEach(timeoutId => clearTimeout(timeoutId));
        window.activeIntervalTimeouts = [];
    }
    
    // Clean up any active oscillators
    if (window.activeOscillators && window.activeOscillators.length > 0) {
        console.log(`Cleaning up ${window.activeOscillators.length} lingering oscillators`);
        window.activeOscillators.forEach(osc => {
            try {
                osc.stop();
                osc.disconnect();
            } catch (e) {
                // Ignore errors from already stopped oscillators
            }
        });
        window.activeOscillators = [];
    }
}

// Animation loop
function animate() {
    // Schedule next frame first to ensure continuous animation
    window.animationFrameId = requestAnimationFrame(animate);
    
    // Calculate time delta for smooth movement
    const time = performance.now();
    window.delta = (time - window.prevTime) / 1000; // Convert to seconds
    
    // Debug counter
    if (!window.frameCounter) window.frameCounter = 0;
    window.frameCounter++;
    
    // Only log every 60 frames to avoid console spam
    if (window.frameCounter % 60 === 0) {
        console.log("Animation frame:", window.frameCounter, "Game state:", 
                    window.gameState.started ? "Started" : "Not started",
                    window.gameState.paused ? "Paused" : "Running");
        
        // Check canvas visibility
        const canvas = document.querySelector('canvas');
        if (canvas) {
            console.log("Canvas display:", canvas.style.display, "Canvas z-index:", canvas.style.zIndex);
            
            // Fix z-index layering occasionally to ensure everything stays visible
            if (window.frameCounter % 300 === 0) {
                fixZIndexLayers();
            }
        } else {
            console.error("Canvas not found in animation loop");
        }
        
        // Run audio resource cleanup periodically 
        if (window.frameCounter % 300 === 0) {
            cleanupAudioResources();
        }
    }
    
    // Update explosion particles if any exist
    if (window.explosionParticles && window.explosionParticles.length > 0) {
        updateExplosionParticles();
    }
    
    // Always render scene to ensure visuals are up to date
    if (window.scene && window.camera) {
        try {
            // Ensure canvas is visible
            const canvas = window.renderer.domElement;
            if (canvas.style.display === 'none') {
                console.warn("Canvas was hidden, making it visible");
                canvas.style.display = 'block';
            }
            
            // Render scene
            window.renderer.render(window.scene, window.camera);
            
            // Only log successful renders every 60 frames
            if (window.frameCounter % 60 === 0) {
                console.log("Scene rendered successfully");
            }
        } catch (err) {
            console.error("Error rendering scene:", err);
        }
    } else {
        console.warn("Scene or camera not available for rendering");
    }
    
    // Skip game logic updates if game is not started, over or paused
    if (window.gameState.started && !window.gameState.gameOver && !window.gameState.paused) {
        // Update player movement
        updatePlayerMovement(window.delta);
        
        // Check for nearby enemies
        checkEnemyProximity();
        
        // Process any queued projectile hits
        processQueuedProjectileHits();
        
        // Check for stuck enemies every second
        if (window.frameCounter % 60 === 0) {
            checkForStuckEnemies();
        }
        
        // Update projectiles
        updateProjectiles(window.delta);
        
        // Update game status displays
        updateTimeDisplay();
        updateScoreDisplay();
        updateEnemiesDisplay();
    }
    
    // Store time for next frame
    window.prevTime = time;
}

// Update all projectiles in the scene
function updateProjectiles(delta) {
    // Early exit if no projectiles
    if (!window.projectiles || window.projectiles.length === 0) return;
    
    // Loop through projectiles backward so we can safely remove them
    for (let i = window.projectiles.length - 1; i >= 0; i--) {
        const projectile = window.projectiles[i];
        
        // Update lifetime
        projectile.userData.lifetime -= delta;
        
        // Remove if lifetime expired
        if (projectile.userData.lifetime <= 0) {
            // Only count as a miss if the game has started and isn't over
            if (window.gameState.started && !window.gameState.gameOver && !window.gameState.gameWon) {
                // Count as a missed projectile
                window.gameState.missedProjectiles++;
                
                // Apply damage penalty for missing (same as a wrong answer)
                window.gameState.playerHealth -= window.config.missedProjectilePenalty;
                
                // Create damage flash to provide visual feedback
                createDamageFlash();
                
                // Update health display
                updateHealthDisplay(window.gameState.playerHealth);
                
                // Update damage taken for score calculation
                window.gameState.damageTaken += window.config.missedProjectilePenalty;
                
                // Update score display
                updateScoreDisplay();
                
                // Check if player is dead
                if (window.gameState.playerHealth <= 0) {
                    handleGameOver();
                }
                
                console.log("Missed projectile! Penalty applied. Total missed:", window.gameState.missedProjectiles);
            }
            
            window.scene.remove(projectile);
            window.projectiles.splice(i, 1);
            continue;
        }
        
        // Store current position for ray casting
        const oldPosition = projectile.position.clone();
        
        // Move projectile forward
        const moveDistance = window.config.projectileSpeed * delta;
        projectile.translateZ(-moveDistance);
        const newPosition = projectile.position.clone();
        
        // Clear the initial frame flag if this is the first update
        if (projectile.userData.initialFrame) {
            projectile.userData.initialFrame = false;
            continue; // Skip collision detection on first frame
        }
        
        // Check for hits on active enemies
        if (window.gameState.activeEnemy && !window.gameState.activeEnemy.userData.defeated) {
            const enemy = window.gameState.activeEnemy;
            
            // Calculate direct distance to enemy
            const directDistance = newPosition.distanceTo(enemy.position);
            
            // Only perform detailed collision check if we're within a reasonable distance
            if (directDistance < 5) {
                // Create a ray from the old position to the new position
                const direction = new THREE.Vector3().subVectors(newPosition, oldPosition).normalize();
                const rayLength = oldPosition.distanceTo(newPosition);
                const ray = new THREE.Raycaster(oldPosition, direction, 0, rayLength);
                
                // Create a sphere for better collision detection
                const enemyRadius = 1.2; // Slightly larger than visual size for better hit detection
                const enemySphere = new THREE.Sphere(enemy.position, enemyRadius);
                
                // Check if ray intersects enemy sphere
                const hitDistance = ray.ray.distanceToPoint(enemy.position);
                const hit = hitDistance < enemyRadius;
                
                // Simple distance check as fallback (for very close hits)
                const directHit = directDistance < enemyRadius;
                
                if (hit || directHit) {
                    console.log("Projectile hit enemy at distance:", directDistance);
                    
                    // Handle hit - if enemy is playing interval, the hit will be queued
                    const isLeftClick = projectile.userData.isLeftClick;
                    handleProjectileHit(isLeftClick);
                    
                    // Visual feedback for hits even if they're queued
                    // Create a small flash at the hit point
                    createHitFlash(projectile.position.clone());
                    
                    // Remove projectile regardless
                    window.scene.remove(projectile);
                    window.projectiles.splice(i, 1);
                }
            }
        }
    }
}

// Initialize Three.js scene, camera, renderer, and lighting
function initThreeJS() {
    console.log("Initializing Three.js");
    
    try {
        // Remove any existing canvas first
        const existingCanvas = document.querySelector('canvas');
        if (existingCanvas) {
            console.log("Removing existing canvas");
            existingCanvas.remove();
        }
        
        // Create scene
        window.scene = new THREE.Scene();
        
        // Add fog for atmosphere but with increased visibility range
        window.scene.fog = new THREE.Fog(0x000033, 20, 70); // Increased visibility range
        
        // Create camera
        window.camera = new THREE.PerspectiveCamera(
            75, // Field of view
            window.innerWidth / window.innerHeight, // Aspect ratio
            0.1, // Near clipping plane
            1000 // Far clipping plane
        );
        window.camera.position.y = 1.6; // Average eye height
        
        // Create renderer
        window.renderer = new THREE.WebGLRenderer({ 
            antialias: true,
            alpha: true 
        });
        window.renderer.setSize(window.innerWidth, window.innerHeight);
        window.renderer.setClearColor(0x000033, 1); // Set clear color to dark blue
        window.renderer.shadowMap.enabled = true;
        window.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
        
        // Style and position the canvas properly
        const canvas = window.renderer.domElement;
        canvas.style.position = 'absolute';
        canvas.style.left = '0';
        canvas.style.top = '0';
        canvas.style.zIndex = '1'; // Lower z-index to keep it behind UI
        
        // Add renderer to document - insert as first element for proper z-index
        document.body.insertBefore(canvas, document.body.firstChild);
        
        // Add lighting
        // Ambient light for overall scene illumination - increase brightness
        const ambientLight = new THREE.AmbientLight(0x444444, 0.8); // Increased intensity
        window.scene.add(ambientLight);
        
        // Add a hemispheric light for better color distribution
        const hemisphereLight = new THREE.HemisphereLight(0xffffff, 0x444444, 0.6);
        window.scene.add(hemisphereLight);
        
        // Point light attached to player for better visibility
        const playerLight = new THREE.PointLight(0x6688cc, 1.5, 20); // Increased intensity and range
        playerLight.position.set(0, 1.8, 0); // Positioned at head level
        window.camera.add(playerLight);
        window.scene.add(window.camera);
        
        console.log("Three.js initialized successfully");
        return true;
    } catch (error) {
        console.error("Error initializing Three.js:", error);
        return false;
    }
}

// Create synthwave style sky - simplified for better performance
function createSynthwaveSky() {
    console.log("Creating simplified synthwave sky");
    
    // Simple gradient background with fog
    window.renderer.setClearColor(new THREE.Color(0x0a005a)); // Deep purple base color
    window.scene.fog = new THREE.FogExp2(0x110038, 0.0025); // Fog for atmosphere
    
    // Single ground plane with simpler grid
    const groundSize = 2000;
    const groundGeometry = new THREE.PlaneGeometry(groundSize, groundSize);
    const groundMaterial = new THREE.MeshBasicMaterial({
        color: 0x000000,
        wireframe: false
    });
    
    const ground = new THREE.Mesh(groundGeometry, groundMaterial);
    ground.rotation.x = -Math.PI / 2;
    ground.position.y = -20;
    window.scene.add(ground);
    
    // Single grid - simpler than before
    const gridHelper = new THREE.GridHelper(groundSize, 50, 0xff00ff, 0x00ffff);
    gridHelper.position.y = -19.9;
    window.scene.add(gridHelper);
    
    // Simple static sun (no animation needed)
    const sunGeometry = new THREE.CircleGeometry(200, 32);
    const sunMaterial = new THREE.MeshBasicMaterial({
        color: 0xff5500,
        transparent: true,
        opacity: 0.8
    });
    
    const sun = new THREE.Mesh(sunGeometry, sunMaterial);
    sun.position.set(0, 200, -1000);
    sun.lookAt(0, 200, 0);
    window.scene.add(sun);
    
    console.log("Simplified synthwave sky created");
}

// Create or recreate interval options UI elements
function createIntervalOptionsUI() {
    console.log("Creating interval option UI elements");
    
    // Remove any existing options first to prevent duplicates
    const existingLeft = document.getElementById('left-option');
    const existingRight = document.getElementById('right-option');
    
    if (existingLeft && existingLeft.parentNode) {
        existingLeft.parentNode.removeChild(existingLeft);
    }
    
    if (existingRight && existingRight.parentNode) {
        existingRight.parentNode.removeChild(existingRight);
    }
    
    // Create new option elements
    const leftOption = document.createElement('div');
    leftOption.id = 'left-option';
    leftOption.className = 'interval-option';
    
    const rightOption = document.createElement('div');
    rightOption.id = 'right-option';
    rightOption.className = 'interval-option';
    
    // Apply styles directly
    const commonStyles = `
        position: fixed;
        z-index: 9999;
        background: rgba(10,10,40,0.95);
        color: white;
        padding: 25px 40px;
        border-radius: 10px;
        font-size: 24px;
        font-weight: bold;
        pointer-events: auto;
        display: none;
        text-align: center;
        border: 3px solid;
        text-shadow: 0 0 10px;
        box-shadow: 0 0 20px;
    `;
    
    leftOption.style.cssText = commonStyles;
    leftOption.style.top = '50%';
    leftOption.style.left = '25%';
    leftOption.style.transform = 'translate(-50%, -50%)';
    leftOption.style.borderColor = '#00ffff';
    leftOption.style.boxShadow = '0 0 20px #00ffff';
    
    rightOption.style.cssText = commonStyles;
    rightOption.style.top = '50%';
    rightOption.style.right = '25%';
    rightOption.style.transform = 'translate(50%, -50%)';
    rightOption.style.borderColor = '#ff00ff';
    rightOption.style.boxShadow = '0 0 20px #ff00ff';
    
    // Set initial content
    leftOption.innerHTML = `
        <div style="font-size:16px;opacity:0.9;margin-bottom:8px;color:#aaffff">LEFT CLICK</div>
        <div>Interval</div>
    `;
    
    rightOption.innerHTML = `
        <div style="font-size:16px;opacity:0.9;margin-bottom:8px;color:#ffaaff">RIGHT CLICK</div>
        <div>Interval</div>
    `;
    
    // Add click handlers
    leftOption.addEventListener('click', function() {
        console.log("Left option clicked directly");
        if (window.gameState.activeEnemy) {
            handleProjectileHit(true); // true = left click
        }
    });
    
    rightOption.addEventListener('click', function() {
        console.log("Right option clicked directly");
        if (window.gameState.activeEnemy) {
            handleProjectileHit(false); // false = right click
        }
    });
    
    // Add to document
    document.body.appendChild(leftOption);
    document.body.appendChild(rightOption);
    
    // Store references in global scope
    window.leftOption = leftOption;
    window.rightOption = rightOption;
    
    console.log("Interval options UI created");
    return { leftOption, rightOption };
}

// Create a perfectly centered crosshair
function createCrosshair() {
    console.log("Creating centered crosshair");
    
    // Check if crosshair already exists
    const existingCrosshair = document.getElementById('crosshair');
    if (existingCrosshair) {
        existingCrosshair.remove();
    }
    
    // Create crosshair container
    const crosshair = document.createElement('div');
    crosshair.id = 'crosshair';
    
    // Style the crosshair container with exact centering
    crosshair.style.cssText = `
        position: fixed;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        width: 22px;
        height: 22px;
        z-index: 5; /* Lower z-index to place it behind menus and UI */
        pointer-events: none;
        display: flex;
        justify-content: center;
        align-items: center;
    `;
    
    // Create cyan circle with exact dimensions
    const circle = document.createElement('div');
    circle.style.cssText = `
        position: absolute;
        width: 20px;
        height: 20px;
        border: 2px solid #00ffff;
        border-radius: 50%;
        box-shadow: 0 0 5px #00ffff;
    `;
    
    // Create pink dot with exact positioning
    const dot = document.createElement('div');
    dot.style.cssText = `
        position: absolute;
        width: 6px;
        height: 6px;
        background-color: #ff00ff;
        border-radius: 50%;
        box-shadow: 0 0 5px #ff00ff;
    `;
    
    // Add elements to crosshair
    crosshair.appendChild(circle);
    crosshair.appendChild(dot);
    
    // Add to document
    document.body.appendChild(crosshair);
    
    // Store reference
    window.crosshair = crosshair;
    
    console.log("Centered crosshair created");
    return crosshair;
}

// Play success sound
function playSuccessSound() {
    if (!window.audioContext) return;
    
    try {
        const osc1 = window.audioContext.createOscillator();
        const osc2 = window.audioContext.createOscillator();
        const gain = window.audioContext.createGain();
        
        osc1.type = 'triangle';
        osc1.frequency.value = 440;
        osc1.connect(gain);
        
        osc2.type = 'sine';
        osc2.frequency.value = 880;
        osc2.connect(gain);
        
        gain.connect(window.audioContext.destination);
        gain.gain.value = 0.2;
        
        osc1.start();
        osc2.start();
        osc1.frequency.linearRampToValueAtTime(880, window.audioContext.currentTime + 0.2);
        osc2.frequency.linearRampToValueAtTime(1760, window.audioContext.currentTime + 0.2);
        
        setTimeout(() => {
            osc1.stop();
            osc2.stop();
        }, 300);
    } catch (error) {
        console.error("Error playing success sound:", error);
    }
}

// Play error sound
function playErrorSound() {
    if (!window.audioContext) return;
    
    try {
        const osc1 = window.audioContext.createOscillator();
        const osc2 = window.audioContext.createOscillator();
        const gain = window.audioContext.createGain();
        
        osc1.type = 'sawtooth';
        osc1.frequency.value = 220;
        osc1.connect(gain);
        
        osc2.type = 'sawtooth';
        osc2.frequency.value = 233;
        osc2.connect(gain);
        
        gain.connect(window.audioContext.destination);
        gain.gain.value = 0.1;
        
        osc1.start();
        osc2.start();
        
        setTimeout(() => {
            osc1.stop();
            osc2.stop();
        }, 300);
    } catch (error) {
        console.error("Error playing error sound:", error);
    }
}

// Enhanced damage flash effect
function createDamageFlash() {
    // Remove any existing flash
    const existingFlash = document.getElementById('damage-flash');
    if (existingFlash) {
        existingFlash.remove();
    }
    
    // Create flash element
    const flash = document.createElement('div');
    flash.id = 'damage-flash';
    flash.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background-color: rgba(255, 0, 0, 0.3);
        pointer-events: none;
        z-index: 9998;
        transition: opacity 0.5s ease-out;
    `;
    
    // Add to document
    document.body.appendChild(flash);
    
    // Add pulsing animation
    let opacity = 0.3;
    let fadeIn = false;
    
    const pulse = () => {
        if (fadeIn) {
            opacity += 0.05;
            if (opacity >= 0.3) {
                opacity = 0.3;
                fadeIn = false;
            }
        } else {
            opacity -= 0.05;
            if (opacity <= 0) {
                opacity = 0;
                fadeIn = true;
            }
        }
        
        flash.style.backgroundColor = `rgba(255, 0, 0, ${opacity})`;
    };
    
    // Pulse a few times
    let pulseCount = 0;
    const pulseInterval = setInterval(() => {
        pulse();
        pulseCount++;
        
        if (pulseCount > 8) {
            clearInterval(pulseInterval);
            
            // Final fade out
            flash.style.opacity = '0';
            
            // Remove after transition
            setTimeout(() => {
                if (flash.parentNode) {
                    flash.parentNode.removeChild(flash);
                }
            }, 500);
        }
    }, 50);
}

// Activate an enemy
function activateEnemy(enemy) {
    console.log("Activating enemy");
    
    // Ensure audio context is running
    if (window.audioContext && window.audioContext.state === 'suspended') {
        window.audioContext.resume();
    }
    
    // Set as active
    enemy.userData.active = true;
    window.gameState.activeEnemy = enemy;
    
    // Select a random interval from the current level
    const levelIntervals = window.intervalLevels[window.gameState.selectedLevel].intervals;
    const correctInterval = levelIntervals[Math.floor(Math.random() * levelIntervals.length)];
    
    // Get the interval direction for this level
    const levelDirection = window.intervalLevels[window.gameState.selectedLevel].direction || "ascending";
    
    // For mixed intervals, randomly choose between ascending and descending
    const intervalDirection = levelDirection === "mixed" 
        ? (Math.random() < 0.5 ? "ascending" : "descending") 
        : levelDirection;
    
    // Store the direction in the enemy's userData for later reference
    enemy.userData.intervalDirection = intervalDirection;
    
    // Store the correct interval in the enemy's userData for later reference
    enemy.userData.correctInterval = correctInterval;
    
    // Play the interval
    playMelodicInterval(correctInterval);
    
    // Show the interval options - let showIntervalOptions handle the incorrect interval selection
    showIntervalOptions(correctInterval);
    
    // Make enemy pulse/glow
    const originalScale = enemy.scale.clone();
    enemy.userData.pulseAnimation = setInterval(() => {
        enemy.scale.set(
            originalScale.x * (1 + 0.2 * Math.sin(Date.now() * 0.005)),
            originalScale.y * (1 + 0.2 * Math.sin(Date.now() * 0.005)),
            originalScale.z * (1 + 0.2 * Math.sin(Date.now() * 0.005))
        );
    }, 16);
}

// Show interval options when approaching an enemy
function showIntervalOptions(correctInterval, incorrectInterval = null) {
    // Get intervals for the current level
    const levelIntervals = window.intervalLevels[window.gameState.selectedLevel].intervals;
    
    // If the provided intervals aren't from the selected level, 
    // replace them with appropriate ones from the level
    if (!levelIntervals.includes(correctInterval)) {
        // Pick a random interval from the level
        correctInterval = levelIntervals[Math.floor(Math.random() * levelIntervals.length)];
    }
    
    // Define all intervals in semitone order for proximity comparison
    const allIntervals = [
        "Minor 2nd", "Major 2nd", "Minor 3rd", "Major 3rd", 
        "Perfect 4th", "Tritone", "Perfect 5th", "Minor 6th", 
        "Major 6th", "Minor 7th", "Major 7th", "Octave"
    ];
    
    // Find index of correctInterval in the ordered array
    const correctIndex = allIntervals.indexOf(correctInterval);
    
    if (correctIndex === -1) {
        console.error(`Unknown interval: ${correctInterval}`);
        // Fall back to random selection from level
        incorrectInterval = levelIntervals.filter(interval => interval !== correctInterval)[0];
    } else {
        // Calculate possible indices within 2 intervals above or below
        const possibleIndices = [];
        
        // Check up to 2 intervals below
        for (let i = 1; i <= 2; i++) {
            if (correctIndex - i >= 0) {
                possibleIndices.push(correctIndex - i);
            }
        }
        
        // Check up to 2 intervals above
        for (let i = 1; i <= 2; i++) {
            if (correctIndex + i < allIntervals.length) {
                possibleIndices.push(correctIndex + i);
            }
        }
        
        // Filter to only include indices that match intervals in the current level
        const validIndices = possibleIndices.filter(i => 
            levelIntervals.includes(allIntervals[i]));
        
        if (validIndices.length > 0) {
            // Pick a random nearby interval from valid options
            const randomIndex = Math.floor(Math.random() * validIndices.length);
            incorrectInterval = allIntervals[validIndices[randomIndex]];
        } else {
            // If no valid nearby intervals, fall back to random selection from level
            incorrectInterval = levelIntervals.filter(interval => interval !== correctInterval)[0];
        }
    }
    
    // Randomly choose which option is correct (left or right)
    const isLeftCorrect = Math.random() < 0.5;
    
    // Get the interval direction from the active enemy and replace with arrows
    let direction = "↑"; // Default to ascending (up arrow)
    if (window.gameState.activeEnemy && window.gameState.activeEnemy.userData.intervalDirection) {
        // Use arrows instead of words
        direction = window.gameState.activeEnemy.userData.intervalDirection === "ascending" ? "↑" : "↓";
    }
    
    // Set up options
    const leftOption = document.getElementById('left-option');
    const rightOption = document.getElementById('right-option');
    
    // Check if the option elements exist
    if (!leftOption || !rightOption) {
        console.error("Interval option elements not found in the DOM");
        return; // Exit the function if elements don't exist
    }
    
    // Store references in window object
    window.leftOption = leftOption;
    window.rightOption = rightOption;
    
    // Set data attributes for interval names and correctness
    leftOption.dataset.interval = isLeftCorrect ? correctInterval : incorrectInterval;
    rightOption.dataset.interval = isLeftCorrect ? incorrectInterval : correctInterval;
    leftOption.dataset.correct = isLeftCorrect ? "true" : "false";
    rightOption.dataset.correct = isLeftCorrect ? "false" : "true";
    
    // Ensure the enemy userData has the correct interval stored
    if (window.gameState.activeEnemy) {
        window.gameState.activeEnemy.userData.correctInterval = correctInterval;
    }
    
    // Add direction indicator to interval names
    const leftIntervalWithDirection = `<div>${direction}</div><div>${isLeftCorrect ? correctInterval : incorrectInterval}</div>`;
    const rightIntervalWithDirection = `<div>${direction}</div><div>${isLeftCorrect ? incorrectInterval : correctInterval}</div>`;
    
    // Update content
    leftOption.innerHTML = `<span style="display:block;font-size:18px;opacity:0.9;margin-bottom:10px">LEFT CLICK</span>${leftIntervalWithDirection}`;
    rightOption.innerHTML = `<span style="display:block;font-size:18px;opacity:0.9;margin-bottom:10px">RIGHT CLICK</span>${rightIntervalWithDirection}`;
    
    // Display options
    leftOption.style.display = 'block';
    rightOption.style.display = 'block';
}

// Deactivate enemy
function deactivateEnemy(enemy) {
    console.log("Deactivating enemy");
    
    // Check if the enemy is currently playing an interval
    if (enemy.userData.playingInterval) {
        console.log("Cannot deactivate enemy while interval is playing");
        return; // Don't deactivate while interval is playing
    }
    
    // Clear any active interval playback
    if (window.activeIntervalTimeouts) {
        window.activeIntervalTimeouts.forEach(timeoutId => clearTimeout(timeoutId));
        window.activeIntervalTimeouts = [];
    }
    
    // Stop any playing oscillators
    if (window.activeOscillators) {
        window.activeOscillators.forEach(osc => {
            try {
                osc.stop();
                osc.disconnect();
            } catch (e) {
                // Ignore errors from already stopped oscillators
            }
        });
        window.activeOscillators = [];
    }
    
    // Set as inactive
    enemy.userData.active = false;
    
    // Clear the active enemy reference
    window.gameState.activeEnemy = null;
    
    // Stop the pulsing animation
    if (enemy.userData.pulseAnimation) {
        clearInterval(enemy.userData.pulseAnimation);
        enemy.userData.pulseAnimation = null;
    }
    
    // Hide interval options
    if (window.leftOption) window.leftOption.style.display = 'none';
    if (window.rightOption) window.rightOption.style.display = 'none';
}

// Play clear melodic interval 
function playMelodicInterval(intervalName) {
    console.log(`Playing melodic interval: ${intervalName}`);
    
    // Ensure we have a valid audio context
    if (!window.audioContext) {
        try {
            window.audioContext = new (window.AudioContext || window.webkitAudioContext)();
        } catch (error) {
            console.error("Failed to create audio context:", error);
            
            // Ensure enemy is still hittable even if audio context creation fails
            if (window.gameState.activeEnemy) {
                window.gameState.activeEnemy.userData.playingInterval = false;
            }
            return;
        }
    }
    
    // Make sure audio context is running
    if (window.audioContext.state === 'suspended') {
        console.log("Audio context suspended, attempting to resume...");
        try {
            // Try to resume immediately
            window.audioContext.resume();
            
            // Set a very short timer and try to play the interval
            setTimeout(() => {
                if (window.audioContext.state === 'running') {
                    playMelodicInterval(intervalName);
                } else {
                    console.error("Could not resume audio context");
                    // Ensure enemy is hittable even if audio context fails
                    if (window.gameState.activeEnemy) {
                        window.gameState.activeEnemy.userData.playingInterval = false;
                        processQueuedProjectileHits();
                    }
                }
            }, 50);
        } catch (error) {
            console.error("Error resuming audio context:", error);
            // Ensure enemy is hittable if audio fails
            if (window.gameState.activeEnemy) {
                window.gameState.activeEnemy.userData.playingInterval = false;
                processQueuedProjectileHits();
            }
        }
        return;
    }
    
    // If no specific interval was requested, pick a random one from the current level
    if (!intervalName) {
        const levelIntervals = window.intervalLevels[window.gameState.selectedLevel].intervals;
        intervalName = levelIntervals[Math.floor(Math.random() * levelIntervals.length)];
    }
    
    // Get the semitone value for the requested interval
    const semitones = window.intervals[intervalName];
    if (semitones === undefined) {
        console.error(`Unknown interval: ${intervalName}`);
        // Ensure enemy is still hittable if interval is invalid
        if (window.gameState.activeEnemy) {
            window.gameState.activeEnemy.userData.playingInterval = false;
        }
        return;
    }
    
    // Get the interval direction from the active enemy
    let direction = "ascending"; // Default to ascending
    if (window.gameState.activeEnemy && window.gameState.activeEnemy.userData.intervalDirection) {
        direction = window.gameState.activeEnemy.userData.intervalDirection;
    }
    
    // Cancel any previous interval playback that might still be active
    if (window.activeIntervalTimeouts) {
        window.activeIntervalTimeouts.forEach(timeoutId => clearTimeout(timeoutId));
        window.activeIntervalTimeouts = [];
    } else {
        window.activeIntervalTimeouts = [];
    }
    
    // Stop any previously playing oscillators
    if (window.activeOscillators) {
        window.activeOscillators.forEach(osc => {
            try {
                osc.stop();
                osc.disconnect();
            } catch (e) {
                // Ignore errors from already stopped oscillators
            }
        });
        window.activeOscillators = [];
    } else {
        window.activeOscillators = [];
    }
    
    // Store the enemy to ensure we don't allow deactivation until interval completes
    const activeEnemy = window.gameState.activeEnemy;
    if (activeEnemy) {
        // Set a flag to prevent deactivation during interval playback
        activeEnemy.userData.playingInterval = true;
        
        // Record the start time immediately for tracking stuck enemies
        activeEnemy.userData.intervalStartTime = Date.now();
    }
    
    // Track if we've played both notes for failsafe purposes
    let firstNotePlayed = false;
    let secondNotePlayed = false;
    
    try {
        // Use a single audio buffer for both notes to ensure smooth playback
        const audioBuffer = createIntervalBuffer(
            window.noteFrequencies['C5'], 
            direction === "ascending" 
                ? window.noteFrequencies['C5'] * Math.pow(2, semitones/12) 
                : window.noteFrequencies['C5'] * Math.pow(2, -semitones/12)
        );
        
        if (!audioBuffer) {
            console.error("Failed to create audio buffer for interval");
            if (activeEnemy) {
                activeEnemy.userData.playingInterval = false;
            }
            return;
        }
        
        // Create a buffer source node
        const bufferSource = window.audioContext.createBufferSource();
        bufferSource.buffer = audioBuffer;
        
        // Create a gain node for volume control
        const gainNode = window.audioContext.createGain();
        gainNode.gain.value = 0.3;
        
        // Connect nodes
        bufferSource.connect(gainNode);
        gainNode.connect(window.audioContext.destination);
        
        // Start playing the interval
        bufferSource.start();
        firstNotePlayed = true;
        secondNotePlayed = true;
        
        console.log(`Playing complete ${direction} interval: ${intervalName}`);
        
        // Set timeout to mark interval as complete
        const intervalDuration = 1000; // Total duration of our interval buffer
        const completionTimeout = setTimeout(function() {
            // Clear the playingInterval flag once the interval is complete
            if (activeEnemy) {
                activeEnemy.userData.playingInterval = false;
                
                // Process any queued hits
                processQueuedProjectileHits();
                
                console.log(`Interval playback complete: ${intervalName}`);
            }
        }, intervalDuration);
        
        window.activeIntervalTimeouts.push(completionTimeout);
        
        // Add failsafe to ensure the playingInterval flag gets reset
        const finalFailsafe = setTimeout(function() {
            if (activeEnemy && activeEnemy.userData.playingInterval) {
                console.log("Final Failsafe: Resetting playingInterval flag after timeout");
                activeEnemy.userData.playingInterval = false;
                processQueuedProjectileHits();
            }
        }, intervalDuration + 200); // Add a little buffer to ensure interval is definitely done
        
        window.activeIntervalTimeouts.push(finalFailsafe);
        
    } catch (error) {
        console.error("Error playing interval:", error);
        // Clear the flag in case of error
        if (activeEnemy) {
            activeEnemy.userData.playingInterval = false;
            processQueuedProjectileHits();
        }
    }
}

// New function to create a complete interval buffer with both notes
function createIntervalBuffer(frequency1, frequency2) {
    try {
        // Create audio context if it doesn't exist
        if (!window.audioContext) {
            window.audioContext = new (window.AudioContext || window.webkitAudioContext)();
        }
        
        // Create a stereo buffer (2 channels)
        const sampleRate = window.audioContext.sampleRate;
        const duration = 1; // 1 second total (first note, gap, second note)
        const bufferSize = sampleRate * duration;
        const buffer = window.audioContext.createBuffer(2, bufferSize, sampleRate);
        
        // Get channel data
        const leftChannel = buffer.getChannelData(0);
        const rightChannel = buffer.getChannelData(1);
        
        // First note duration and parameters
        const firstNoteDuration = 0.4; // 400ms
        const noteGap = 0.1; // 100ms gap between notes
        const secondNoteDuration = 0.5; // 500ms (rest of the buffer)
        
        // First note (0 to 400ms)
        for (let i = 0; i < sampleRate * firstNoteDuration; i++) {
            // Sine wave formula: Math.sin(2 * Math.PI * frequency * time)
            const sample = Math.sin(2 * Math.PI * frequency1 * i / sampleRate);
            
            // Apply simple amplitude envelope (fade in/out)
            let amplitude = 1;
            if (i < 0.05 * sampleRate) { // Fade in during first 50ms
                amplitude = i / (0.05 * sampleRate);
            } else if (i > (firstNoteDuration - 0.05) * sampleRate) { // Fade out during last 50ms
                amplitude = (firstNoteDuration * sampleRate - i) / (0.05 * sampleRate);
            }
            
            // Apply the sample to both channels
            leftChannel[i] = sample * amplitude;
            rightChannel[i] = sample * amplitude;
        }
        
        // Gap (400ms to 500ms) - silence
        
        // Second note (500ms to 1000ms)
        const secondNoteStart = sampleRate * (firstNoteDuration + noteGap);
        for (let i = 0; i < sampleRate * secondNoteDuration; i++) {
            const bufferIndex = secondNoteStart + i;
            if (bufferIndex < bufferSize) {
                // Sine wave formula for second note
                const sample = Math.sin(2 * Math.PI * frequency2 * i / sampleRate);
                
                // Apply simple amplitude envelope
                let amplitude = 1;
                if (i < 0.05 * sampleRate) { // Fade in
                    amplitude = i / (0.05 * sampleRate);
                } else if (i > (secondNoteDuration - 0.05) * sampleRate) { // Fade out
                    amplitude = (secondNoteDuration * sampleRate - i) / (0.05 * sampleRate);
                }
                
                // Apply the sample to both channels
                leftChannel[bufferIndex] = sample * amplitude;
                rightChannel[bufferIndex] = sample * amplitude;
            }
        }
        
        return buffer;
    } catch (error) {
        console.error("Error creating interval buffer:", error);
        return null;
    }
}

// Create floor grid for the maze
function createFloor() {
    console.log("Creating floor");
    
    const gridSize = window.config.gridSize;
    const gridDivisions = gridSize;
    
    // Create a grid helper for the floor
    const grid = new THREE.GridHelper(gridSize, gridDivisions, 0x00ffff, 0xff00ff);
    grid.position.y = 0;
    window.scene.add(grid);
    
    // Add a floor plane
    const floorGeometry = new THREE.PlaneGeometry(gridSize, gridSize);
    const floorMaterial = new THREE.MeshStandardMaterial({ 
        color: 0x0b0b2a, 
        side: THREE.DoubleSide,
        roughness: 0.8,
        metalness: 0.2
    });
    const floor = new THREE.Mesh(floorGeometry, floorMaterial);
    floor.rotation.x = Math.PI / 2;
    floor.position.y = -0.01; // Slightly below grid to avoid z-fighting
    floor.receiveShadow = true;
    window.scene.add(floor);
    
    console.log("Floor created");
}

// Create health display UI element
function createHealthDisplay() {
    console.log("Creating health display");
    
    // Check if health display already exists
    const existingHealthDisplay = document.getElementById('health-display');
    if (existingHealthDisplay) {
        existingHealthDisplay.remove();
    }
    
    // Create container
    const healthDisplay = document.createElement('div');
    healthDisplay.id = 'health-display';
    
    // Style container - moved to top left
    healthDisplay.style.cssText = `
        position: fixed;
        top: 20px;
        left: 20px;
        background: rgba(0, 0, 0, 0.7);
        padding: 10px;
        border-radius: 5px;
        z-index: 999;
        color: white;
        font-family: Arial, sans-serif;
        font-size: 14px;
        border: 1px solid #00ffff;
        box-shadow: 0 0 10px rgba(0, 255, 255, 0.5);
    `;
    
    // Create label
    const healthLabel = document.createElement('div');
    healthLabel.textContent = "HEALTH:";
    healthLabel.style.marginBottom = "5px";
    healthLabel.style.fontSize = "12px";
    healthLabel.style.opacity = "0.8";
    
    // Create health bar container
    const healthBarContainer = document.createElement('div');
    healthBarContainer.style.cssText = `
        width: 150px;
        height: 15px;
        background: rgba(50, 50, 50, 0.5);
        border-radius: 3px;
        overflow: hidden;
        border: 1px solid rgba(255, 255, 255, 0.2);
    `;
    
    // Create health bar
    const healthBar = document.createElement('div');
    healthBar.id = 'health-bar';
    healthBar.style.cssText = `
        width: 100%;
        height: 100%;
        background: linear-gradient(to right, #ff0000, #ffff00, #00ff00);
        border-radius: 2px;
        transition: width 0.3s ease-in-out;
    `;
    
    // Create health value text
    const healthValue = document.createElement('div');
    healthValue.id = 'health-value';
    healthValue.textContent = `${window.gameState.playerHealth}%`;
    healthValue.style.cssText = `
        position: absolute;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        font-weight: bold;
        text-shadow: 0 0 3px rgba(0, 0, 0, 0.9);
        font-size: 12px;
    `;
    
    // Assemble components
    healthBarContainer.appendChild(healthBar);
    healthBarContainer.appendChild(healthValue);
    healthDisplay.appendChild(healthLabel);
    healthDisplay.appendChild(healthBarContainer);
    
    // Add to document
    document.body.appendChild(healthDisplay);
    
    // Store reference
    window.healthDisplay = healthDisplay;
    window.healthBar = healthBar;
    window.healthValue = healthValue;
    
    // Update health display for initial value
    updateHealthDisplay(window.gameState.playerHealth);
    
    console.log("Health display created");
    return healthDisplay;
}

// Make sure that the health bar is updated when damage is taken
function takeDamage(amount) {
    // Update health value
    window.gameState.playerHealth = Math.max(0, window.gameState.playerHealth - amount);
    
    // Update health display
    updateHealthDisplay(window.gameState.playerHealth);
    
    // Check for game over
    if (window.gameState.playerHealth <= 0) {
        gameOver(false); // false = lost
    }
    
    // Create screen flash effect
    createDamageFlash();
}

// Modify checkEnemyDistance to further increase engagement range
function checkEnemyDistance() {
    if (!window.camera || !window.enemies.length || window.gameState.activeEnemy) return;
    
    const playerPosition = window.camera.position.clone();
    const detectionRange = 15; // Increased from 15 to 25, allowing intervals to be heard much earlier
    
    for (const enemy of window.enemies) {
        // Skip destroyed or already active enemies
        if (enemy.userData.destroyed || enemy.userData.active) continue;
        
        const enemyPosition = enemy.position.clone();
        const distance = playerPosition.distanceTo(enemyPosition);
        
        // Check if player is within detection range
        if (distance < detectionRange) {
            // Activate enemy when player is within range
            activateEnemy(enemy);
            break;
        }
    }
}

// Make sure this function is called in the animation loop
function updateGame(time) {
    // ... existing code ...
    
    // Check for enemy in range
    checkEnemyDistance();
    
    // ... existing code ...
}

// Add a note about music to the instructions
function addMusicNoteToInstructions() {
    // Function intentionally left empty to remove music notification text
}

// Add after handleProjectileHit function
function updateScore(isCorrect) {
    if (isCorrect) {
        // Base score for defeating an enemy
        window.gameState.score += 100;
        window.gameState.enemiesDefeated++;
        
        // Force immediate UI updates for all displays
        updateScoreDisplay();
        updateTimeDisplay();
        updateEnemiesDisplay();
        updateHealthDisplay(window.gameState.playerHealth);
        
        // Schedule another update in the next frame to ensure consistency
        requestAnimationFrame(() => {
            updateScoreDisplay();
            updateTimeDisplay();
            updateEnemiesDisplay();
        });
    }
}

// Add after startGame function
function initializeGameTimer() {
    console.log("Initializing game timer and resetting score variables");
    
    // Clear any existing timer interval
    if (window.gameTimerInterval) {
        clearInterval(window.gameTimerInterval);
        window.gameTimerInterval = null;
    }
    
    // Reset timer variables
    window.gameState.startTime = Date.now();
    window.gameState.completionTime = null;
    
    // Reset score variables
    window.gameState.score = 0;
    window.gameState.enemiesDefeated = 0;
    window.gameState.damageTaken = 0;
    window.gameState.missedProjectiles = 0; // Reset missed projectiles counter
    
    // Reset the timer display to exactly 00:00 at the moment the game starts
    if (window.timeValue) {
        window.timeValue.textContent = '00:00';
    }
    
    // Track intervals that were incorrectly identified
    window.gameState.missedIntervals = {};
    
    // Reset health to initial value
    window.gameState.playerHealth = window.config.playerHealth;
    
    // Set game as started
    window.gameState.started = true;
    
    // Update UI displays
    if (window.healthBar && window.healthValue) {
        updateHealthDisplay(window.gameState.playerHealth);
    }
    
    if (window.scoreValue) {
        window.scoreValue.textContent = '0';
    }
    
    if (window.enemiesValue) {
        window.enemiesValue.textContent = '0';
    }
    
    // Set up a timer interval for consistent UI updates
    window.gameTimerInterval = setInterval(() => {
        if (!window.gameState.paused && !window.gameState.gameOver && !window.gameState.gameWon) {
            updateTimeDisplay();
            updateScoreDisplay();
        }
    }, 1000);
    
    console.log("Game state reset: health=" + window.gameState.playerHealth + 
                ", score=" + window.gameState.score + 
                ", enemies=" + window.gameState.enemiesDefeated);
}

// Add new function to calculate final score
function calculateFinalScore() {
    // Base score from enemies defeated
    let score = window.gameState.score;
    
    // Time penalty (longer completion = lower score)
    const completionTime = window.gameState.completionTime || 
        ((Date.now() - window.gameState.startTime) / 1000);
    const timePenalty = Math.floor(completionTime * 10);
    score = Math.max(0, score - timePenalty);
    
    // Health bonus (more health = higher score)
    const healthPercentage = window.gameState.playerHealth / window.config.playerHealth;
    const healthBonus = Math.floor(5000 * healthPercentage);
    score += healthBonus;
    
    // Penalty for damage taken
    const damagePenalty = window.gameState.damageTaken * 50;
    score = Math.max(0, score - damagePenalty);
    
    // Penalty for missed projectiles
    const missedProjectilesPenalty = window.gameState.missedProjectiles * 100;
    score = Math.max(0, score - missedProjectilesPenalty);
    
    return Math.floor(score);
}

// Add after createHealthDisplay function
function createTimeAndScoreDisplay() {
    console.log("Creating time and score display");
    
    // Create container
    const statsDisplay = document.createElement('div');
    statsDisplay.id = 'stats-display';
    
    // Style container
    statsDisplay.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: rgba(0, 0, 0, 0.7);
        padding: 10px;
        border-radius: 5px;
        z-index: 999;
        color: white;
        font-family: Arial, sans-serif;
        font-size: 14px;
        border: 1px solid #00ffff;
        box-shadow: 0 0 10px rgba(0, 255, 255, 0.5);
        text-align: right;
    `;
    
    // Create time display
    const timeDisplay = document.createElement('div');
    timeDisplay.id = 'time-display';
    timeDisplay.innerHTML = `
        <div style="font-size: 12px; opacity: 0.8; margin-bottom: 5px;">TIME</div>
        <div id="time-value" style="font-size: 16px; font-weight: bold;">00:00</div>
    `;
    
    // Create score display
    const scoreDisplay = document.createElement('div');
    scoreDisplay.id = 'score-display';
    scoreDisplay.innerHTML = `
        <div style="font-size: 12px; opacity: 0.8; margin-top: 10px; margin-bottom: 5px;">SCORE</div>
        <div id="score-value" style="font-size: 16px; font-weight: bold;">0</div>
    `;
    
    // Create enemies defeated display
    const enemiesDisplay = document.createElement('div');
    enemiesDisplay.id = 'enemies-display';
    enemiesDisplay.innerHTML = `
        <div style="font-size: 12px; opacity: 0.8; margin-top: 10px; margin-bottom: 5px;">ENEMIES</div>
        <div id="enemies-value" style="font-size: 16px; font-weight: bold;">0</div>
    `;
    
    // Assemble components
    statsDisplay.appendChild(timeDisplay);
    statsDisplay.appendChild(scoreDisplay);
    statsDisplay.appendChild(enemiesDisplay);
    
    // Add to document
    document.body.appendChild(statsDisplay);
    
    // Store references
    window.timeValue = document.getElementById('time-value');
    window.scoreValue = document.getElementById('score-value');
    window.enemiesValue = document.getElementById('enemies-value');
    
    console.log("Time and score display created");
}

// Add function to update the time display
function updateTimeDisplay() {
    if (!window.timeValue) return;
    
    // Don't update time if we're still in countdown or game hasn't fully started
    if (!window.gameState || !window.gameState.canMove) {
        return;
    }
    
    // Make sure we have a valid start time
    if (!window.gameState.startTime) {
        window.gameState.startTime = Date.now();
    }
    
    // Safety check for game state
    if (window.gameState.gameOver) {
        // If game is over, don't update the timer
        return;
    }
    
    const currentTime = Date.now();
    const elapsedSeconds = Math.floor((currentTime - window.gameState.startTime) / 1000);
    const minutes = Math.floor(elapsedSeconds / 60);
    const seconds = elapsedSeconds % 60;
    
    // Format and update the display
    const timeString = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    window.timeValue.textContent = timeString;
}

// Add function to update score display
function updateScoreDisplay() {
    if (!window.scoreValue) return;
    
    // Calculate current score
    const currentScore = calculateCurrentScore();
    window.scoreValue.textContent = currentScore.toString();
}

// Add function to calculate current score during gameplay
function calculateCurrentScore() {
    // Ensure base score exists
    let score = window.gameState.score || 0;
    
    // Make sure time variables are initialized
    if (!window.gameState.startTime) {
        window.gameState.startTime = Date.now();
        return score; // Return just the base score on first calculation
    }
    
    // Time penalty (longer play time = lower score)
    const elapsedTime = (Date.now() - window.gameState.startTime) / 1000;
    const timePenalty = Math.floor(elapsedTime * 10);
    score = Math.max(0, score - timePenalty);
    
    // Health bonus - check if player health exists
    if (window.gameState.playerHealth !== undefined && window.config && window.config.playerHealth) {
        const healthPercentage = window.gameState.playerHealth / window.config.playerHealth;
        const healthBonus = Math.floor(2500 * healthPercentage);
        score += healthBonus;
    }
    
    // Damage penalty - ensure damage taken variable exists
    const damageTaken = window.gameState.damageTaken || 0;
    const damagePenalty = damageTaken * 25;
    score = Math.max(0, score - damagePenalty);
    
    // Missed projectiles penalty
    const missedProjectiles = window.gameState.missedProjectiles || 0;
    const missedProjectilesPenalty = missedProjectiles * 50;
    score = Math.max(0, score - missedProjectilesPenalty);
    
    return Math.floor(score);
}

// Update enemies defeated display
function updateEnemiesDisplay() {
    if (!window.enemiesValue) return;
    window.enemiesValue.textContent = window.gameState.enemiesDefeated;
}

// Modify the existing instructions to include level selection
function addLevelSelectionToInstructions() {
    console.log("Adding level selection to instructions");
    
    const instructions = document.getElementById('instructions');
    if (!instructions) return;
    
    // Check if level selection already exists to prevent duplicates
    if (document.getElementById('level-selection')) {
        console.log("Level selection already exists, skipping creation");
        return;
    }
    
    // Check if level heading already exists to prevent duplicates
    const existingLevelHeading = document.querySelector('#instructions h2');
    if (existingLevelHeading && existingLevelHeading.textContent === "Select a Level") {
        console.log("Level heading already exists, skipping creation");
        return;
    }
    
    // Add level selection heading
    const levelHeading = document.createElement('h2');
    levelHeading.textContent = "Select a Level";
    levelHeading.style.marginTop = "20px";
    levelHeading.style.color = "#00ffff";
    instructions.insertBefore(levelHeading, document.getElementById('start-button'));
    
    // Create level selection container
    const levelContainer = document.createElement('div');
    levelContainer.id = 'level-selection';
    levelContainer.style.cssText = `
        display: flex;
        flex-direction: column;
        gap: 15px;
        margin: 15px 0;
        max-height: 250px;
        overflow-y: auto;
        padding-right: 5px;
    `;
    
    // Create level category sections
    const categories = [
        { title: "Ascending Intervals", startLevel: 1, endLevel: 10, color: "#00ffff" },
        { title: "Descending Intervals", startLevel: 11, endLevel: 20, color: "#ff00ff" },
        { title: "Mixed Intervals", startLevel: 21, endLevel: 30, color: "#ffaa00" }
    ];
    
    categories.forEach(category => {
        // Create category heading
        const categoryHeading = document.createElement('h3');
        categoryHeading.textContent = category.title;
        categoryHeading.style.cssText = `
            color: ${category.color};
            margin: 5px 0;
            font-size: 16px;
            text-shadow: 0 0 5px ${category.color};
        `;
        levelContainer.appendChild(categoryHeading);
        
        // Create grid for this category's levels
        const levelGrid = document.createElement('div');
        levelGrid.style.cssText = `
            display: grid;
            grid-template-columns: repeat(2, 1fr);
            gap: 10px;
        `;
        
        // Add level buttons for this category
        for (let level = category.startLevel; level <= category.endLevel; level++) {
            const levelButton = document.createElement('button');
            levelButton.textContent = window.intervalLevels[level].name;
            levelButton.dataset.level = level;
            levelButton.classList.add('level-button');
            
            // Style the level button
            levelButton.style.cssText = `
                background: ${level === 1 ? 'linear-gradient(to right, #ff00ff, #00ffff)' : 'rgba(10,10,40,0.8)'};
                border: 1px solid ${level === 1 ? '#00ffff' : '#333'};
                color: white;
                padding: 8px;
                text-align: left;
                font-size: 13px;
                cursor: pointer;
                border-radius: 5px;
                transition: all 0.2s;
            `;
            
            // Add click handler
            levelButton.addEventListener('click', function() {
                // Remove highlight from all buttons
                document.querySelectorAll('.level-button').forEach(btn => {
                    btn.style.background = 'rgba(10,10,40,0.8)';
                    btn.style.border = '1px solid #333';
                });
                
                // Highlight selected button
                this.style.background = 'linear-gradient(to right, #ff00ff, #00ffff)';
                this.style.border = '1px solid #00ffff';
                
                // Update selected level
                window.gameState.selectedLevel = parseInt(this.dataset.level);
                console.log("Selected level: " + window.gameState.selectedLevel);
                
                // Update level description
                updateLevelDescription(window.gameState.selectedLevel);
            });
            
            levelGrid.appendChild(levelButton);
        }
        
        levelContainer.appendChild(levelGrid);
    });
    
    // Insert level selection before start button
    instructions.insertBefore(levelContainer, document.getElementById('start-button'));
    
    // Check if level description already exists
    if (document.getElementById('level-description')) {
        console.log("Level description already exists, updating it");
        updateLevelDescription(1);
    } else {
        // Create level description element
        const levelDescription = document.createElement('p');
        levelDescription.id = 'level-description';
        levelDescription.style.fontSize = '14px';
        levelDescription.style.margin = '10px 0';
        
        // Set initial level description
        updateLevelDescription(1);
        
        instructions.insertBefore(levelDescription, document.getElementById('start-button'));
    }
    
    console.log("Level selection added to instructions");
}

// Function to update level description
function updateLevelDescription(level) {
    const levelDescElement = document.getElementById('level-description');
    if (!levelDescElement) return; // Don't proceed if the element doesn't exist
    
    const levelInfo = window.intervalLevels[level];
    const intervals = levelInfo.intervals.join(', ');
    
    // Replace direction words with arrows
    let directionSymbol;
    switch (levelInfo.direction) {
        case "ascending":
            directionSymbol = "↑";
            break;
        case "descending":
            directionSymbol = "↓";
            break;
        case "mixed":
            directionSymbol = "↕";
            break;
        default:
            directionSymbol = "↑";
    }
    
    // Update level description with arrow symbol
    levelDescElement.textContent = `Level ${level}: ${directionSymbol} intervals - ${intervals}`;
}

// Return to the main menu
function returnToMainMenu() {
    console.log("Returning to main menu");
    
    // Reset any ongoing timers or intervals
    if (window.gameTimerInterval) {
        clearInterval(window.gameTimerInterval);
        window.gameTimerInterval = null;
    }
    
    // Properly stop background music
    stopBackgroundMusic();
    
    // Clean up any audio resources
    if (window.activeIntervalTimeouts) {
        window.activeIntervalTimeouts.forEach(timeoutId => clearTimeout(timeoutId));
        window.activeIntervalTimeouts = [];
    }
    
    if (window.activeOscillators) {
        window.activeOscillators.forEach(osc => {
            try {
                osc.stop();
                osc.disconnect();
            } catch (e) {
                // Ignore errors if already stopped
            }
        });
        window.activeOscillators = [];
    }
    
    // Clean up any existing game elements (similar to restartGame)
    // Remove enemies from scene
    window.enemies.forEach(enemy => {
        if (enemy && window.scene) {
            window.scene.remove(enemy);
        }
    });
    window.enemies = [];
    
    // Clear projectiles
    window.projectiles.forEach(projectile => {
        if (projectile && window.scene) {
            window.scene.remove(projectile);
        }
    });
    window.projectiles = [];
    
    // Reset active enemy
    window.gameState.activeEnemy = null;
    
    // Remove interval options
    if (window.leftOption) window.leftOption.style.display = 'none';
    if (window.rightOption) window.rightOption.style.display = 'none';
    
    // Hide victory message if present
    const victoryMessage = document.getElementById('victory-message');
    if (victoryMessage) {
        victoryMessage.remove();
    }
    
    // Hide game over message if present
    const gameOverMessage = document.getElementById('game-over-message');
    if (gameOverMessage) {
        gameOverMessage.remove();
    }
    
    // Remove UI displays
    const timeDisplay = document.getElementById('time-display');
    if (timeDisplay) timeDisplay.remove();
    
    const scoreDisplay = document.getElementById('score-display');
    if (scoreDisplay) scoreDisplay.remove();
    
    const healthDisplay = document.getElementById('health-display');
    if (healthDisplay) healthDisplay.remove();
    
    const enemiesDisplay = document.getElementById('enemies-display');
    if (enemiesDisplay) enemiesDisplay.remove();
    
    const statsDisplay = document.getElementById('stats-display');
    if (statsDisplay) statsDisplay.remove();
    
    // Clear any explosion particles
    if (window.explosionParticles && window.explosionParticles.length > 0) {
        window.explosionParticles.forEach(particle => {
            if (particle && window.scene) {
                window.scene.remove(particle);
            }
        });
        window.explosionParticles = [];
    }
    
    // Clear existing maze elements first
    const objectsToRemove = [];
    window.scene.traverse(object => {
        if (object.userData && (object.userData.type === 'wall' || 
            object.userData.type === 'start' || 
            object.userData.type === 'goal')) {
            objectsToRemove.push(object);
        }
    });
    
    objectsToRemove.forEach(object => {
        window.scene.remove(object);
    });
    
    // Reset game state
    window.gameState.gameOver = false;
    window.gameState.gameWon = false;
    window.gameState.started = false; // Set to false for main menu
    window.gameState.paused = false;
    window.gameState.score = 0;
    window.gameState.enemiesDefeated = 0;
    window.gameState.playerHealth = window.config.playerHealth;
    window.gameState.damageTaken = 0;
    window.gameState.missedIntervals = {};
    window.gameState.backgroundMusicPlaying = false;
    window.gameState.canMove = false; // Reset movement restriction flag
    
    // Clean up existing UI displays
    const existingStatsDisplay = document.getElementById('stats-display');
    if (existingStatsDisplay) {
        existingStatsDisplay.remove();
    }
    
    // Clear existing maze elements
    console.log("Clearing existing game elements");
    clearGameElements();
    
    // Ensure audio context is in running state
    if (window.audioContext && window.audioContext.state === 'suspended') {
        window.audioContext.resume();
    }
    
    // Show the instructions panel (main menu)
    const instructions = document.getElementById('instructions');
    if (instructions) {
        console.log("Showing instructions panel (main menu)");
        instructions.style.display = 'block';
    } else {
        console.error("Instructions panel not found - cannot display main menu");
        
        // If instructions panel is missing, try to recreate UI
        console.log("Attempting to recreate UI");
        initUI();
    }
    
    // Unlock controls for menu interaction
    if (window.controls) {
        window.controls.unlock();
    }
    
    console.log("Returned to main menu successfully");
}

// Toggle pause menu
function togglePauseMenu() {
    console.log("Toggling pause menu, current state:", window.gameState.paused);
    
    const pauseMenu = document.getElementById('pause-menu');
    if (!pauseMenu) {
        console.error("Pause menu element not found");
        return;
    }
    
    // Toggle pause state
    window.gameState.paused = !window.gameState.paused;
    
    if (window.gameState.paused) {
        // Show pause menu
        pauseMenu.style.display = 'block';
        
        // Unlock pointer to allow menu interaction
        if (window.controls && window.controls.isLocked) {
            window.controls.unlock();
        }
        
        // Pause game mechanics as needed
        if (window.backgroundMusicElement && window.gameState.backgroundMusicPlaying) {
            // Reduce volume while paused but don't stop completely
            window.backgroundMusicElement.volume = window.config.backgroundMusicVolume * 0.3;
        }
    } else {
        // Hide pause menu
        pauseMenu.style.display = 'none';
        
        // Reset movement flags to prevent stuck movement
        window.moveForward = false;
        window.moveBackward = false;
        window.moveLeft = false;
        window.moveRight = false;
        
        // Reset velocity to prevent drift
        if (window.velocity) {
            window.velocity.x = 0;
            window.velocity.y = 0;
            window.velocity.z = 0;
        }
        
        // Resume game mechanics
        if (window.backgroundMusicElement && window.gameState.backgroundMusicPlaying) {
            // Restore normal volume
            window.backgroundMusicElement.volume = window.config.backgroundMusicVolume;
        }
        
        // Force render a frame to update the scene
        if (window.renderer && window.scene && window.camera) {
            window.renderer.render(window.scene, window.camera);
        }
        
        // Wait a short time before locking controls to prevent immediate unlock
        setTimeout(() => {
            // Lock pointer to resume gameplay
            if (window.controls && !window.controls.isLocked) {
                window.controls.lock();
                console.log("Pointer locked after unpausing game");
                
                // Force another render for good measure
                if (window.renderer && window.scene && window.camera) {
                    window.renderer.render(window.scene, window.camera);
                }
            }
        }, 100);
    }
    
    console.log("Pause state toggled to:", window.gameState.paused);
}

// Function to fix UI element layering
function fixZIndexLayers() {
    console.log("Fixing z-index layering");
    
    // Make sure canvas is at the bottom
    const canvas = document.querySelector('canvas');
    if (canvas) {
        canvas.style.zIndex = '1';
        canvas.style.position = 'absolute';
        canvas.style.display = 'block';
        
        // Make sure it's the first child for proper rendering
        document.body.insertBefore(canvas, document.body.firstChild);
    } else {
        console.error("Canvas not found - can't fix z-index");
    }
    
    // Make sure UI container is above the canvas
    const uiContainer = document.getElementById('ui-container');
    if (uiContainer) {
        uiContainer.style.zIndex = '10';
        uiContainer.style.position = 'absolute';
    }
    
    // UI elements like the crosshair, health display, etc.
    const gameOverlays = document.querySelectorAll('.game-overlay');
    gameOverlays.forEach(overlay => {
        overlay.style.zIndex = '20';
    });
    
    // Ensure pause menu is highest
    const pauseMenu = document.getElementById('pause-menu');
    if (pauseMenu) {
        pauseMenu.style.zIndex = '30';
    }
    
    // Ensure instructions is visible in menu
    const instructions = document.getElementById('instructions');
    if (instructions) {
        instructions.style.zIndex = '30';
    }
    
    console.log("Z-index layering fixed");
}

// Process any queued projectile hits once intervals finish playing
function processQueuedProjectileHits() {
    if (!window.queuedProjectileHits || window.queuedProjectileHits.length === 0) {
        return;
    }
    
    // Get the current active enemy
    const activeEnemy = window.gameState.activeEnemy;
    
    // Only process hits if there's an active enemy and it's not playing an interval
    if (activeEnemy && !activeEnemy.userData.playingInterval) {
        // Check if we have a queued hit for this enemy
        for (let i = 0; i < window.queuedProjectileHits.length; i++) {
            const hit = window.queuedProjectileHits[i];
            
            // Process hits that match the current active enemy
            if (hit.enemy === activeEnemy) {
                console.log(`Processing queued projectile hit from ${Date.now() - hit.timestamp}ms ago`);
                
                // Process the hit
                handleProjectileHit(hit.isLeftClick);
                
                // Remove this hit from the queue
                window.queuedProjectileHits.splice(i, 1);
                
                // Only process one hit per frame to avoid multiple rapid hits
                break;
            }
        }
    } else if (activeEnemy && activeEnemy.userData.playingInterval) {
        // Log that we're waiting for the interval to complete
        console.log("Waiting for interval to complete before processing hits");
    }
    
    // Clean up old queued hits (older than 5 seconds)
    if (window.queuedProjectileHits.length > 0) {
        const currentTime = Date.now();
        window.queuedProjectileHits = window.queuedProjectileHits.filter(hit => {
            const age = currentTime - hit.timestamp;
            if (age >= 5000) {
                console.log(`Removing stale projectile hit (${age}ms old)`);
                return false;
            }
            return true;
        });
    }
}

// Add this new function to periodically check for and fix stuck enemies
function checkForStuckEnemies() {
    if (window.gameState.activeEnemy && window.gameState.activeEnemy.userData.playingInterval) {
        // Check how long this enemy has been in playing state
        const now = Date.now();
        if (!window.gameState.activeEnemy.userData.intervalStartTime) {
            // If no start time recorded, set it now
            window.gameState.activeEnemy.userData.intervalStartTime = now;
        } else {
            // Check if it's been stuck for more than 2 seconds (reduced from 3)
            const elapsed = now - window.gameState.activeEnemy.userData.intervalStartTime;
            if (elapsed > 2000) {
                console.log(`Found stuck enemy playing interval for ${elapsed}ms, resetting state`);
                
                // Force reset the state
                window.gameState.activeEnemy.userData.playingInterval = false;
                
                // Process any queued hits
                processQueuedProjectileHits();
                
                // Reset the timer
                window.gameState.activeEnemy.userData.intervalStartTime = null;
            }
        }
    }
}

// Add a visual feedback function for hits
function createHitFlash(position) {
    // Create a small sphere for the hit flash
    const flashGeometry = new THREE.SphereGeometry(0.5, 8, 8);
    const flashMaterial = new THREE.MeshBasicMaterial({
        color: 0xffffff,
        transparent: true,
        opacity: 0.8
    });
    
    const flash = new THREE.Mesh(flashGeometry, flashMaterial);
    flash.position.copy(position);
    
    // Add to scene
    window.scene.add(flash);
    
    // Animate the flash (expand and fade)
    let scale = 1;
    let opacity = 0.8;
    
    const animateFlash = () => {
        scale += 0.1;
        opacity -= 0.05;
        
        flash.scale.set(scale, scale, scale);
        flashMaterial.opacity = opacity;
        
        if (opacity > 0) {
            requestAnimationFrame(animateFlash);
        } else {
            window.scene.remove(flash);
        }
    };
    
    requestAnimationFrame(animateFlash);
}