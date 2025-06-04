console.log("Game script loading...");

// Wait for DOM and Three.js to be fully loaded before initializing
window.addEventListener('load', () => {
    console.log("Window loaded, initializing game...");
    initGame();
});

// Helper functions for loading animation
function showLoadingAnimation() {
    try {
        const loadingContainer = document.getElementById('loading-container');
        if (!loadingContainer) {
            console.error("Loading container not found");
            return;
        }
        
        // Set display to flex for proper centering
        loadingContainer.style.display = 'flex';
        
        // Force a reflow to ensure the animation displays immediately
        loadingContainer.offsetHeight;
        
        // Additional adjustments for mobile
        if (isMobileDevice()) {
            // Ensure the animation is positioned at the crosshair height
            const loadingAnimation = document.getElementById('loading-animation');
            if (loadingAnimation) {
                loadingAnimation.style.position = 'relative';
                loadingAnimation.style.transform = 'none';
                loadingAnimation.style.top = 'auto';
                loadingAnimation.style.left = 'auto';
                loadingAnimation.style.margin = '35vh auto auto auto'; // Position higher - at 35% from the top
                
                // Adjust the container alignment
                loadingContainer.style.alignItems = 'flex-start';
            }
        }
        
        console.log("Loading animation shown successfully");
    } catch (error) {
        console.error("Error showing loading animation:", error);
    }
}

function hideLoadingAnimation() {
    try {
        const loadingContainer = document.getElementById('loading-container');
        if (!loadingContainer) {
            console.error("Loading container not found");
            return;
        }
        
        // Hide the container
        loadingContainer.style.display = 'none';
        
        console.log("Loading animation hidden successfully");
    } catch (error) {
        console.error("Error hiding loading animation:", error);
    }
}

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
        
        // Hide loading animation if there was an error
        hideLoadingAnimation();
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
    
    // Apply mobile optimizations for better performance
    const isMobile = isMobileDevice();
    if (isMobile) {
        window.config.mazeSize = 50; // Smaller maze on mobile
        window.config.enemyDistance = 20; // Reduced detection distance
        window.config.moveSpeed = 35.0; // Slower movement for better control
        window.config.gridSize = 300; // Smaller grid
        window.config.projectileSpeed = 25; // Slightly slower projectiles
        window.config.enemyMoveSpeed = 1.5; // Slower enemy movement
        window.config.skyRadius = 500; // Smaller sky radius
        console.log("Applied mobile performance optimizations to game config");
    }
    
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
    
    // Add audio unlock for mobile devices
    setupMobileAudioUnlock();
}

// Add a global audio unlock function for mobile devices 
function setupMobileAudioUnlock() {
    if (!isMobileDevice()) return;
    
    console.log("Setting up mobile audio unlock on first touch");
    
    // Create a listener that will unlock audio on the first interaction
    const unlockAudio = function() {
        // Only run once
        document.body.removeEventListener('touchstart', unlockAudio);
        document.body.removeEventListener('touchend', unlockAudio);
        document.body.removeEventListener('click', unlockAudio);
        
        // Try to resume audio context if suspended
        if (window.audioContext && window.audioContext.state === 'suspended') {
            window.audioContext.resume().then(() => {
                console.log("Audio context resumed from global touch handler");
            }).catch(err => {
                console.warn("Could not resume audio context:", err);
            });
        }
        
        // Use our comprehensive audio unlock function
        forceAudioUnlock();
        
        // Check if we're on iOS and might need the button
        const isIOS = /iPhone|iPad|iPod/.test(navigator.userAgent);
        if (isIOS) {
            // Check if we need to create the manual button for iOS
            if (window.audioContext && window.audioContext.state !== 'running') {
                console.log("iOS audio context still not running after unlock, creating button");
                createIOSMusicButton();
            } else if (window.backgroundMusicElement && window.backgroundMusicElement.paused) {
                console.log("iOS music still paused after unlock, creating button");
                createIOSMusicButton();
            }
        }
        
        console.log("Global audio unlock triggered");
    };
    
    // Add multiple listeners to catch any user interaction
    document.body.addEventListener('touchstart', unlockAudio, false);
    document.body.addEventListener('touchend', unlockAudio, false);
    document.body.addEventListener('click', unlockAudio, false);
    
    // Special handling for iOS
    const isIOS = /iPhone|iPad|iPod/.test(navigator.userAgent);
    if (isIOS) {
        // iOS often needs a button due to strict audiovisual policies
        // We'll create it after a short delay if no interaction occurs
        setTimeout(() => {
            if (!window.audioUnlockAttempted) {
                console.log("No user interaction detected, adding iOS button");
                createIOSMusicButton();
            }
        }, 1000);
    }
}

// Initialize audio context
function initAudio() {
    console.log("Initializing audio");
    
    try {
        window.audioContext = new (window.AudioContext || window.webkitAudioContext)();
        console.log("Audio context created");
        
        // Initialize audio buffer pool for sound effects (NOT intervals)
        initAudioBufferPool();
        
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
        
        // Check if we should play music immediately (used when playBackgroundMusic was called before music was loaded)
        if (window.shouldPlayMusicAfterLoad && window.gameState.started) {
            console.log("Playing music now that it's loaded (delayed start)");
            setTimeout(() => playBackgroundMusic(), 100);
        } else {
            console.log("Background music ready but waiting for countdown to play");
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
function playBackgroundMusic(immediate = false) {
    console.log("Playing background music" + (immediate ? " (immediate mode)" : ""));
    
    // Skip if music is already playing to avoid duplicate music
    if (window.gameState.backgroundMusicPlaying && window.backgroundMusicElement && !window.backgroundMusicElement.paused) {
        console.log("Music already playing, not starting again");
        return;
    }
    
    // In immediate mode, we skip most checks since audio was just prepared
    if (!immediate) {
        // Make sure audio is unlocked first on mobile
        if (isMobileDevice()) {
            console.log("Trying to force unlock audio before playing music");
            forceAudioUnlock();
        }
        
        // Ensure audio context is running (needed due to browser autoplay policies)
        if (window.audioContext && window.audioContext.state === 'suspended') {
            window.audioContext.resume().catch(err => {
                console.warn("Failed to resume audio context:", err);
            });
        }
        
        // Play the music if we have a valid audio element
        if (window.backgroundMusicElement) {
            // First, make sure we properly stop any existing playback
            if (window.backgroundMusicElement.paused === false) {
                window.backgroundMusicElement.pause();
            }
            
            // Reset audio to beginning
            window.backgroundMusicElement.currentTime = 0;
            
            // Ensure volume is set correctly
            if (window.backgroundMusicGain) {
                window.backgroundMusicGain.gain.value = window.config.backgroundMusicVolume;
            }
            
            // Set volume directly on the element too
            window.backgroundMusicElement.volume = window.config.backgroundMusicVolume;
            window.backgroundMusicElement.muted = false;
            
            // Set playback attributes that help with mobile
            window.backgroundMusicElement.setAttribute('playsinline', '');
            window.backgroundMusicElement.setAttribute('webkit-playsinline', '');
        }
    }
    
    console.log("Attempting to play background music now...");
    
    // Play music now
    if (window.backgroundMusicElement) {
        // For iOS, we need to be extra aggressive
        const isIOS = /iPhone|iPad|iPod/.test(navigator.userAgent);
        const isAndroid = /Android/.test(navigator.userAgent);
        
        if (isIOS) {
            // First attempt with standard play
            window.backgroundMusicElement.play()
                .then(() => {
                    window.gameState.backgroundMusicPlaying = true;
                    console.log("iOS background music started successfully");
                })
                .catch(err => {
                    console.warn("iOS background music play failed:", err);
                    
                    // Second attempt with a timeout
                    setTimeout(() => {
                        console.log("Trying iOS music play again after timeout");
                        window.backgroundMusicElement.play()
                            .then(() => {
                                window.gameState.backgroundMusicPlaying = true;
                                console.log("iOS background music started on second attempt");
                            })
                            .catch(finalErr => {
                                console.error("iOS final music play attempt failed:", finalErr);
                            });
                    }, 50);  // Reduced from 500ms to 50ms for faster retry
                });
        } else if (isAndroid) {
            // Android-specific optimizations for faster play start
            try {
                // On Android, direct play with try/catch can be faster than promise handling
                window.backgroundMusicElement.play();
                window.gameState.backgroundMusicPlaying = true;
                console.log("Android background music started with direct play");
            } catch (err) {
                console.warn("Android direct play failed, trying promise-based approach:", err);
                
                // Fallback to promise-based approach
                window.backgroundMusicElement.play()
                    .then(() => {
                        window.gameState.backgroundMusicPlaying = true;
                        console.log("Android background music started with promise");
                    })
                    .catch(finalErr => {
                        console.error("Android final play attempt failed:", finalErr);
                    });
            }
        } else {
            // Try to play with normal promise-based approach for other browsers
            const playPromise = window.backgroundMusicElement.play();
            
            if (playPromise !== undefined) {
                playPromise
                    .then(() => {
                        window.gameState.backgroundMusicPlaying = true;
                        console.log("Background music started successfully");
                    })
                    .catch(err => {
                        console.warn("Background music autoplay failed:", err);
                        
                        // Don't create buttons on mobile - we're handling this through the Start Game button
                        if (!isMobileDevice()) {
                            // Create play button for desktop only
                            createPlayMusicButton();
                        } else {
                            // For mobile, try one more time after a short delay
                            setTimeout(() => {
                                console.log("Trying mobile music play again after timeout");
                                window.backgroundMusicElement.play()
                                    .then(() => {
                                        window.gameState.backgroundMusicPlaying = true;
                                        console.log("Mobile background music started on second attempt");
                                    })
                                    .catch(e => console.error("Mobile final play attempt failed:", e));
                            }, 50);  // Reduced from 300ms to 50ms for faster retry
                        }
                    });
            } else {
                // For older browsers that don't return a promise
                window.gameState.backgroundMusicPlaying = true;
                console.log("Background music started (legacy browser)");
            }
        }
    } else {
        console.error("No background music element available");
        
        // Try to load music if not available
        loadBackgroundMusic();
        
        // Set a flag to retry playback after loading
        window.shouldPlayMusicAfterLoad = true;
    }
}

// New function to handle mobile audio play
function handleMobileAudioPlay() {
    console.log("Handling mobile audio play - unlocking only");
    
    // Just unlock audio systems without playing music
    forceAudioUnlock();
    
    // Additional iOS-specific handling
    const isIOS = /iPhone|iPad|iPod/.test(navigator.userAgent);
    if (isIOS) {
        console.log("iOS device detected, preparing audio system");
        
        try {
            // Make sure we're prepared for later playback
            if (window.backgroundMusicElement) {
                window.backgroundMusicElement.muted = false;
                window.backgroundMusicElement.volume = window.config.backgroundMusicVolume;
                
                // Set explicit attributes for iOS
                window.backgroundMusicElement.setAttribute('playsinline', '');
                window.backgroundMusicElement.setAttribute('webkit-playsinline', '');
                
                console.log("iOS audio system prepared, music will play during gameplay");
                
                // If we have a special iOS button, hide it
                const iosButton = document.getElementById('ios-music-button');
                if (iosButton) {
                    iosButton.style.display = 'none';
                }
            } else {
                console.warn("Background music element not available yet");
                
                // Load background music if not loaded
                loadBackgroundMusic();
                
                // Still need iOS button for future interactions
                createIOSMusicButton();
            }
        } catch (e) {
            console.error("iOS special audio handling failed:", e);
            createIOSMusicButton(); // Fallback to button
        }
    } else {
        // Standard approach for non-iOS mobile devices
        console.log("Non-iOS mobile device, audio system prepared for later playback");
    }
}

// Create a special play button for iOS if absolutely needed
function createIOSMusicButton() {
    // Skip button if not on iOS
    if (!(/iPhone|iPad|iPod/.test(navigator.userAgent))) {
        return;
    }
    
    // Check if button already exists
    if (document.getElementById('ios-music-button')) return;
    
    const button = document.createElement('button');
    button.id = 'ios-music-button';
    button.textContent = '🔊 Tap to Enable Audio';
    button.style.cssText = `
        position: fixed;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        padding: 20px 30px;
        background: linear-gradient(to right, #ff00ff, #00ffff);
        color: white;
        border: none;
        border-radius: 10px;
        cursor: pointer;
        z-index: 10000;
        font-size: 18px;
        font-weight: bold;
        box-shadow: 0 0 30px rgba(255, 0, 255, 0.7);
        animation: pulse 2s infinite;
    `;
    
    // Add pulsing animation to catch user attention
    const style = document.createElement('style');
    style.textContent = `
        @keyframes pulse {
            0% { transform: translate(-50%, -50%) scale(1); }
            50% { transform: translate(-50%, -50%) scale(1.1); }
            100% { transform: translate(-50%, -50%) scale(1); }
        }
    `;
    document.head.appendChild(style);
    
    button.addEventListener('click', () => {
        // Comprehensive audio unlocking
        forceAudioUnlock();
        
        // Try to resume audio context
        if (window.audioContext) {
            window.audioContext.resume().then(() => {
                console.log("Audio context resumed from iOS button");
            }).catch(err => {
                console.warn("Could not resume audio context from button:", err);
            });
        }
        
        // Test audio with a short beep sound to ensure iOS recognizes user interaction
        try {
            // Create and play a short beep to verify audio is working
            const oscillator = window.audioContext.createOscillator();
            const gainNode = window.audioContext.createGain();
            oscillator.type = 'sine';
            oscillator.frequency.value = 440; // A4 note
            gainNode.gain.value = 0.1; // Quiet
            oscillator.connect(gainNode);
            gainNode.connect(window.audioContext.destination);
            oscillator.start();
            setTimeout(() => {
                oscillator.stop();
                console.log("Test beep played - audio should be unlocked");
            }, 200);
        } catch (e) {
            console.warn("Failed to play test beep:", e);
        }
        
        // Setup audio for gameplay
        if (window.backgroundMusicElement) {
            window.backgroundMusicElement.muted = false;
            window.backgroundMusicElement.volume = window.config && window.config.backgroundMusicVolume ? window.config.backgroundMusicVolume : 0.5;
            
            // Play a tiny bit of audio to unlock iOS, but immediately pause it
            window.backgroundMusicElement.play()
                .then(() => {
                    setTimeout(() => {
                        window.backgroundMusicElement.pause();
                        window.backgroundMusicElement.currentTime = 0;
                        console.log("iOS audio fully unlocked for gameplay");
                    }, 50);
                })
                .catch(error => {
                    console.error("Failed initial iOS audio unlock:", error);
                });
        }
        
        // Hide the button
        button.style.display = 'none';
        
        // Mark audio as fully prepared for gameplay
        window.audioFullyUnlocked = true;
    });
    
    document.body.appendChild(button);
    console.log("iOS music button created");
}

// Create a button to manually start music (for browsers with restrictive autoplay policies)
// Only used on desktop now
function createPlayMusicButton() {
    // Skip on mobile devices, we don't want the button there
    if (isMobileDevice()) return;
    
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
        // Remove any existing event listeners by creating a new button
        const newStartButton = startButton.cloneNode(true);
        startButton.parentNode.replaceChild(newStartButton, startButton);
        
        // Add event listener for start button with immediate loading animation
        newStartButton.addEventListener('click', function(event) {
            event.preventDefault();
            console.log("Start button clicked from main menu");
            
            // CRITICAL: Direct audio unlock immediately on click for mobile
            if (isMobileDevice()) {
                console.log("Mobile device detected, starting aggressive audio unlock");
                
                // Create and immediately play a silent sound - MUST happen directly in click handler
                if (window.audioContext) {
                    // Force resume audio context first
                    window.audioContext.resume();
                    
                    // Create silent buffer
                    const buffer = window.audioContext.createBuffer(1, 1, 22050);
                    const source = window.audioContext.createBufferSource();
                    source.buffer = buffer;
                    source.connect(window.audioContext.destination);
                    source.start(0);
                    console.log("Silent buffer played in click handler");
                } else {
                    // Create audio context if it doesn't exist
                    try {
                        window.audioContext = new (window.AudioContext || window.webkitAudioContext)();
                        const buffer = window.audioContext.createBuffer(1, 1, 22050);
                        const source = window.audioContext.createBufferSource();
                        source.buffer = buffer;
                        source.connect(window.audioContext.destination);
                        source.start(0);
                        console.log("Created audio context and played silent buffer");
                    } catch (e) {
                        console.error("Failed to create audio context:", e);
                    }
                }
                
                // For iOS, also trigger HTML Audio element
                if (/iPhone|iPad|iPod/.test(navigator.userAgent)) {
                    console.log("iOS device detected, using HTML Audio unlock");
                    // Create and play a silent HTML audio element
                    const silentAudio = document.createElement('audio');
                    silentAudio.src = 'data:audio/mp3;base64,SUQzAwAAAAABEVRYWFgAAAAXAAAARW5jb2RlZCBieQBMYXZmNTguMjkuMTAwAEFQSUMAAAASAAAAAGNvdmVyAHVuZGVmaW5lZAAA//tQxAADB5g7F0EQACw2vH731zdXZtUlb3P19+82zH//RVe1faqnflW3/y/+oGj/zgOf/r335j8Z/5/xf//8Z9fr3/r9/Tw+fP44eehnnI+b/ogASQAkkipH///rb////5X9///8pccwgCuQHVTIfH4ICBAQZT//WRIz//q+r////0YYE//+MYm9a///nk9tE////6tdqJjq//////9BkUaHBOJQgKCR0huK//K6//1qBkbm//bUdnqXhlHsEYb0Gk0AAAAAAAAAA';
                    silentAudio.autoplay = true;
                    silentAudio.loop = false;
                    silentAudio.volume = 0.001;
                    silentAudio.play().then(() => {
                        console.log("iOS silent audio played");
                        silentAudio.remove();
                    }).catch(e => console.warn("iOS silent audio failed:", e));
                }
                
                // Only after direct audio unlock, also call our comprehensive unlock function
                forceAudioUnlock();
            }
            
            // Show loading animation
            showLoadingAnimation();
            
            // Now start the game with appropriate delay
            if (isMobileDevice()) {
                setTimeout(() => {
                    startGame();
                }, 500); // Longer delay for mobile
            } else {
                setTimeout(() => {
                    startGame();
                }, 300);
            }
        });
    } else {
        console.error("Start button not found");
    }
    
    // Create crosshair for aiming
    createCrosshair();
    
    // Create health display
    createHealthDisplay();
    
    // Level selection to instructions
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
            console.log("Main menu button clicked from pause menu");
            
            // Show loading animation immediately
            showLoadingAnimation();
            
            togglePauseMenu(); // Close pause menu
            returnToMainMenu(); // Return to main menu
        });
    }
    
    // Setup mobile detail toggles
    setupMobileDetailToggles();
}

// Function to play a beep sound for countdown
function playCountdownBeep(isGo = false) {
    if (!window.audioContext) {
        console.error("Cannot play countdown beep - audio context missing");
        return;
    }
    
    // Make sure audio context is resumed before playing
    if (window.audioContext.state === 'suspended') {
        console.log("Resuming audio context before playing countdown beep");
        window.audioContext.resume().catch(err => {
            console.warn("Failed to resume audio context for beep:", err);
        });
        
        // For iOS, play a silent buffer first to unlock audio
        if (/iPhone|iPad|iPod/.test(navigator.userAgent)) {
            try {
                const buffer = window.audioContext.createBuffer(1, 1, 22050);
                const source = window.audioContext.createBufferSource();
                source.buffer = buffer;
                source.connect(window.audioContext.destination);
                source.start(0);
                console.log("Silent buffer played before countdown beep on iOS");
            } catch (e) {
                console.warn("Error playing silent buffer before beep:", e);
            }
        }
    }
    
    try {
        // Create oscillator and gain node
        const oscillator = window.audioContext.createOscillator();
        const gainNode = window.audioContext.createGain();
        
        // Connect the nodes
        oscillator.connect(gainNode);
        gainNode.connect(window.audioContext.destination);
        
        // Configure sound (different for numbers vs GO)
        if (isGo) {
            // Higher pitched, brighter sound for GO
            oscillator.type = 'square';
            oscillator.frequency.value = 880; // A5 - higher pitch for GO
            gainNode.gain.value = 0.15;
            
            // Start with attack
            oscillator.start();
            
            // Add a slight pitch bend up for excitement
            oscillator.frequency.exponentialRampToValueAtTime(1200, window.audioContext.currentTime + 0.2);
            
            // Envelope - longer for GO
            gainNode.gain.setValueAtTime(0.15, window.audioContext.currentTime);
            gainNode.gain.exponentialRampToValueAtTime(0.001, window.audioContext.currentTime + 0.5);
            
            // Stop after effect is done
            setTimeout(() => {
                try {
                    oscillator.stop();
                    oscillator.disconnect();
                    gainNode.disconnect();
                } catch (e) {
                    // Ignore errors if already stopped
                }
            }, 500);
            
            console.log("GO beep played successfully");
        } else {
            // Regular countdown beep (3, 2, 1)
            oscillator.type = 'sine';
            oscillator.frequency.value = 440; // A4
            gainNode.gain.value = 0.1;
            
            // Start oscillator
            oscillator.start();
            
            // Envelope
            gainNode.gain.setValueAtTime(0.1, window.audioContext.currentTime);
            gainNode.gain.exponentialRampToValueAtTime(0.001, window.audioContext.currentTime + 0.2);
            
            // Stop after effect is done
            setTimeout(() => {
                try {
                    oscillator.stop();
                    oscillator.disconnect();
                    gainNode.disconnect();
                } catch (e) {
                    // Ignore errors if already stopped
                }
            }, 200);
            
            console.log("Countdown beep played successfully");
        }
    } catch (error) {
        console.error("Error playing countdown beep:", error);
    }
}

// Function to display countdown timer before game starts
function startCountdown() {
    const countdownEl = document.getElementById('countdown-timer');
    if (!countdownEl) return;
    
    // Hide loading animation now that we're starting the countdown
    hideLoadingAnimation();
    
    // Ensure player can't move during countdown
    window.gameState.canMove = false;
    
    // Make countdown element visible
    countdownEl.classList.add('show');
    
    // For mobile devices, ensure audio is unlocked before starting countdown
    const ensureAudioUnlocked = () => {
        if (isMobileDevice()) {
            // Make sure audio context is resumed
            if (window.audioContext && window.audioContext.state === 'suspended') {
                console.log("Resuming audio context before countdown");
                window.audioContext.resume().then(() => {
                    console.log("Audio context resumed before countdown");
                }).catch(err => {
                    console.warn("Could not resume audio context before countdown:", err);
                });
            }
            
            // Make sure we've tried to unlock audio
            if (!window.audioUnlockAttempted) {
                console.log("Forcing audio unlock before countdown");
                forceAudioUnlock();
            }
            
            // Make sure music is ready for mobile
            if (window.backgroundMusicElement) {
                // Reset music element
                if (window.gameState.backgroundMusicPlaying) {
                    window.backgroundMusicElement.pause();
                    window.gameState.backgroundMusicPlaying = false;
                }
                window.backgroundMusicElement.currentTime = 0;
            }
        }
    };
    
    // Ensure audio is ready before countdown
    ensureAudioUnlocked();
    
    // Start with 3 and play first beep
    countdownEl.textContent = '3';
    playCountdownBeep();
    
    // Start pre-preparing audio systems right away for mobile
    if (isMobileDevice()) {
        forceAudioUnlock();
        
        // Ensure audio context is ready
        if (window.audioContext && window.audioContext.state === 'suspended') {
            window.audioContext.resume();
        }
    }
    
    // After 1 second, show 2 and play beep
    setTimeout(() => {
        countdownEl.textContent = '2';
        playCountdownBeep();
        
        // Continue audio preparation for mobile
        if (isMobileDevice() && window.backgroundMusicElement) {
            // Get the audio system ready
            window.backgroundMusicElement.volume = window.config.backgroundMusicVolume;
            window.backgroundMusicElement.muted = false;
            window.backgroundMusicElement.currentTime = 0;
            
            // Set playback attributes that help with mobile
            window.backgroundMusicElement.setAttribute('playsinline', '');
            window.backgroundMusicElement.setAttribute('webkit-playsinline', '');
        }
        
        // After another second, show 1 and play beep
        setTimeout(() => {
            countdownEl.textContent = '1';
            playCountdownBeep();
            
            // Final audio preparation during the "1" phase
            if (isMobileDevice()) {
                // Extra attempt for iOS specifically
                if (/iPhone|iPad|iPod/.test(navigator.userAgent)) {
                    // Force an extra unlock attempt for iOS
                    forceAudioUnlock();
                    
                    // iOS needs explicit resume
                    if (window.audioContext) {
                        window.audioContext.resume();
                    }
                    
                    // For iOS, pre-load audio with a silent play/pause
                    if (window.backgroundMusicElement) {
                        window.backgroundMusicElement.play().then(() => {
                            setTimeout(() => {
                                window.backgroundMusicElement.pause();
                                window.backgroundMusicElement.currentTime = 0;
                            }, 10);
                        }).catch(() => {});
                    }
                }
                
                // Make sure background music element is fully prepared
                if (window.backgroundMusicElement) {
                    // Reset and prepare the element
                    window.backgroundMusicElement.currentTime = 0;
                    window.backgroundMusicElement.volume = window.config.backgroundMusicVolume;
                    window.backgroundMusicElement.muted = false;
                }
                
                // On Android specifically, prepare the audio buffer
                if (!(/iPhone|iPad|iPod/.test(navigator.userAgent)) && window.backgroundMusicElement) {
                    // Android-specific optimization: attempt to prebuffer
                    window.backgroundMusicElement.load();
                }
            }
            
            // After another second, show GO! without beep sound
            setTimeout(() => {
                // Create a local variable to track our GO state
                const goDisplayed = false;
                
                // Pre-trigger audio just before updating the DOM
                if (window.backgroundMusicElement) {
                    const audioPromise = window.backgroundMusicElement.play();
                    window.gameState.backgroundMusicPlaying = true;
                    console.log("Pre-triggered audio for perfect sync with GO");
                    
                    // If the audio fails to play, try again after GO appears
                    if (audioPromise) {
                        audioPromise.catch(() => {
                            if (window.backgroundMusicElement) {
                                window.backgroundMusicElement.play().catch(() => {});
                            }
                        });
                    }
                }
                
                // Then immediately update the DOM with GO text
                requestAnimationFrame(() => {
                    countdownEl.innerHTML = '<span class="go">GO!</span>';
                    console.log("GO text displayed");
                    
                    // Enable player movement
                    window.gameState.canMove = true; showCrosshair();
                    
                    // Initialize game timer only when GO appears
                    initializeGameTimer();
                    
                    // Start tracking score time
                    window.gameState.startTime = Date.now();
                });
                
                // Hide countdown after a delay
                setTimeout(() => {
                    countdownEl.classList.remove('show');
                    countdownEl.textContent = '';
                }, 1000);
                
                // Backup audio check 50ms after GO appears
                setTimeout(() => {
                    if (!window.gameState.backgroundMusicPlaying || 
                        (window.backgroundMusicElement && window.backgroundMusicElement.paused)) {
                        console.log("Backup audio trigger");
                        playBackgroundMusic(true);
                    }
                }, 50);
            }, 1000);
        }, 1000);
    }, 1000);
}

// Start the game
function startGame() {
    try {
        // Ensure loading animation is visible
        showLoadingAnimation();
        
        // Make sure audio is unlocked for mobile devices
        forceAudioUnlock();
        
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
            const parent = canvas.parentNode;
            if (parent.firstChild !== canvas) {
                parent.insertBefore(canvas, parent.firstChild);
            }
        } else {
            console.error("Canvas element not found");
        }
        
        // Hide instruction panel
        const instructions = document.getElementById('instructions');
        if (instructions) {
            instructions.style.display = 'none';
        }
        
        // Set game as started in gameState - although actual gameplay starts after countdown
        window.gameState.started = true;
        window.gameState.gameOver = false;
        window.gameState.gameWon = false;
        
        clearGameElements();
        
        // Final audio context check - CRITICAL for mobile
        if (isMobileDevice()) {
            console.log("Final audio check before starting countdown");
            
            // Forcefully try to unlock audio again
            if (window.audioContext && window.audioContext.state === 'suspended') {
                window.audioContext.resume();
                
                // Play a silent tone immediately
                try {
                    const buffer = window.audioContext.createBuffer(1, 1, 22050);
                    const source = window.audioContext.createBufferSource();
                    source.buffer = buffer;
                    source.connect(window.audioContext.destination);
                    source.start(0);
                } catch (e) {
                    console.warn("Final silent buffer failed:", e);
                }
            }
            
            // If we somehow lost the audio context, try to recreate it
            if (!window.audioContext) {
                try {
                    window.audioContext = new (window.AudioContext || window.webkitAudioContext)();
                    console.log("Created new audio context during game start");
                } catch (e) {
                    console.error("Failed to create audio context during game start:", e);
                }
            }
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
        
        // Hide loading animation before starting countdown
        hideLoadingAnimation();
        
        // Start the countdown timer
        startCountdown();
        
        // Make sure z-index layering is correct
        fixZIndexLayers();
        
        // Lock controls for gameplay, with special handling for mobile
        try {
            if (window.controls) {
                // Check if we're on a mobile device
                if (isMobileDevice()) {
                    console.log("Mobile device detected - using mobile camera controls");
                    
                    // On mobile, we're not using Pointer Lock API due to limited support
                    // Instead, we'll use our own touch controls for camera movement
                    // We'll simulate the locked state to make other code work
                    
                    // Set a fake lock state for our game's logic
                    window.controls.isLocked = true;
                } else {
                    // On desktop, use normal Pointer Lock API
                    window.controls.lock();
                }
            }
        } catch (e) {
            console.error("Error locking controls:", e);
        }
        
        console.log("Game started successfully. Player position:", 
                  window.controls ? window.controls.getObject().position.toArray() : "Controls not initialized");
    } catch (error) {
        console.error("Error starting game:", error);
        alert("Failed to start game: " + error.message);
        
        // Hide loading animation if there was an error
        hideLoadingAnimation();
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

// Create walls based on maze grid - optimized for mobile performance
function createWalls() {
    console.log("Creating maze walls");
    
    const size = window.config.mazeSize;
    const corridorWidth = window.config.corridorWidth;
    const wallHeight = window.config.corridorHeight;
    const isMobile = isMobileDevice();
    
    // Create optimized wall materials based on device
    let wallMaterial, edgeMaterial;
    
    if (isMobile) {
        // Simpler materials on mobile without expensive effects
        wallMaterial = new THREE.MeshBasicMaterial({
            color: 0x220033, // Deep purple base
            fog: true
        });
        
        edgeMaterial = new THREE.MeshBasicMaterial({
            color: 0xff00ff, // Hot pink
            transparent: true,
            opacity: 0.7
        });
    } else {
        // Full material complexity on desktop
        wallMaterial = new THREE.MeshStandardMaterial({
            color: 0x220033, // Deep purple base
            emissive: 0x110022,
            metalness: 0.7,
            roughness: 0.3
        });
        
        edgeMaterial = new THREE.MeshBasicMaterial({
            color: 0xff00ff, // Hot pink
            emissive: 0xff00ff,
            transparent: true,
            opacity: 0.9
        });
    }
    
    // Pre-create shared grid texture for desktop (avoid creating multiple textures)
    let sharedGridTexture = null;
    if (!isMobile) {
        sharedGridTexture = createSharedGridTexture();
    }
    
    // Clear existing walls
    window.walls = [];
    
    // Create walls based on maze grid
    for (let i = 0; i < size; i++) {
        for (let j = 0; j < size; j++) {
            if (window.mazeGrid[i][j] === 1) {
                // Create main wall geometry
                const wallGeometry = new THREE.BoxGeometry(corridorWidth, wallHeight, corridorWidth);
                const wall = new THREE.Mesh(wallGeometry, wallMaterial.clone());
                
                // Position wall in world space
                const x = (i - size/2) * corridorWidth;
                const z = (j - size/2) * corridorWidth;
                wall.position.set(x, wallHeight/2, z);
                
                // Add grid pattern texture only on desktop
                if (!isMobile && sharedGridTexture) {
                    wall.material.map = sharedGridTexture;
                    wall.material.needsUpdate = true;
                }
                
                // Add glowing edges with reduced complexity on mobile
                if (isMobile) {
                    addSimpleGlowingEdges(wall, corridorWidth, wallHeight, edgeMaterial);
                } else {
                    addGlowingEdges(wall, x, z, corridorWidth, wallHeight);
                }
                
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
    
    console.log(`Created ${window.walls.length} walls for ${isMobile ? "mobile" : "desktop"}`);
}

// Create a shared grid texture to avoid multiple canvas operations
function createSharedGridTexture() {
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
    
    return texture;
}

// Simplified glowing edges for mobile
function addSimpleGlowingEdges(wall, width, height, edgeMaterial) {
    // Only add top edge on mobile to reduce geometry count
    const topEdgeGeometry = new THREE.BoxGeometry(width, 0.1, width);
    const topEdge = new THREE.Mesh(topEdgeGeometry, edgeMaterial);
    topEdge.position.set(0, height/2 + 0.05, 0);
    wall.add(topEdge);
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
    // Use simpler geometry on mobile for better performance
    const isMobile = isMobileDevice();
    
    let enemyGeometry;
    if (isMobile) {
        // Use a simple octahedron on mobile (8 faces vs 20 for icosahedron)
        enemyGeometry = new THREE.OctahedronGeometry(1.0, 0);
    } else {
        // Use an icosahedron for a more complex geometric shape on desktop
        enemyGeometry = new THREE.IcosahedronGeometry(1.0, 0);
    }
    
    const enemyMaterial = new THREE.MeshBasicMaterial({
        color: 0xffff00, // Yellow
        transparent: false,
        opacity: 1.0
    });
    
    const enemy = new THREE.Mesh(enemyGeometry, enemyMaterial);
    
    // Position the enemy
    enemy.position.set(x, 1.5, z);
    
    // Add outline only on desktop for performance
    if (!isMobile) {
        addOutlineToEnemy(enemy);
    }
    
    // Add light to make it visible in the dark - reduced intensity on mobile
    const lightIntensity = isMobile ? 1.0 : 1.5;
    const lightRange = isMobile ? 4 : 6;
    const light = new THREE.PointLight(0xffff00, lightIntensity, lightRange);
    light.position.set(0, 0, 0);
    enemy.add(light);
    
    // Set up enemy data
    enemy.userData = {
        active: false,
        defeated: false,
        interval: null,
        chasing: false,
        originalPosition: {x, z},
        isMobile: isMobile // Store for later reference
    };
    
    // Add optimized animation based on device
    animateEnemy(enemy);
    
    window.scene.add(enemy);
    window.enemies.push(enemy);
}

// Optimized animation for enemy - simpler on mobile
function animateEnemy(enemy) {
    const isMobile = enemy.userData.isMobile || isMobileDevice();
    
    // Create rotation animation with reduced complexity on mobile
    const rotate = () => {
        if (enemy && !enemy.userData.defeated) {
            if (isMobile) {
                // Simpler animation on mobile - only rotate on Y axis
                enemy.rotation.y += 0.02;
            } else {
                // Full 3D rotation on desktop
                enemy.rotation.x += 0.01;
                enemy.rotation.y += 0.02;
            }
            
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
    // Number of particles in explosion - significantly reduced for mobile
    const isMobile = isMobileDevice();
    const baseParticleCount = isMobile ? 8 : 30; // Reduce particles by 75% on mobile
    
    // Further reduce particles based on battery level and performance
    let particleCount = baseParticleCount;
    if (isMobile && window.performanceMonitor) {
        if (window.performanceMonitor.batteryLevel < 0.3) {
            particleCount = Math.floor(baseParticleCount * 0.5); // Even fewer particles on low battery
        } else if (window.performanceMonitor.adaptiveQuality < 0.7) {
            particleCount = Math.floor(baseParticleCount * 0.7); // Reduce based on adaptive quality
        }
    }
    
    // Green color variations for the explosion
    const colors = [
        0x00ff00, // Bright green
        0x33ff33, // Light green
        0x00cc00, // Medium green
        0x99ff99  // Pale green
    ];
    
    // Create particle group
    const particles = [];
    
    // Pre-create shared geometries for mobile to reduce object creation
    let sharedBoxGeometry, sharedOctaGeometry;
    if (isMobile) {
        sharedBoxGeometry = new THREE.BoxGeometry(0.1, 0.1, 0.1); // Smaller size
        sharedOctaGeometry = new THREE.OctahedronGeometry(0.08, 0); // Smaller and no subdivisions
    }
    
    // Create particles
    for (let i = 0; i < particleCount; i++) {
        // Use shared geometries on mobile for better performance
        let geometry;
        if (isMobile) {
            // Use shared geometries to reduce memory allocation
            geometry = (i % 2 === 0) ? sharedBoxGeometry : sharedOctaGeometry;
        } else {
            // Desktop can use more complex geometries
            const geometryType = Math.floor(Math.random() * 3);
            switch(geometryType) {
                case 0:
                    geometry = new THREE.TetrahedronGeometry(0.2, 0);
                    break;
                case 1:
                    geometry = new THREE.BoxGeometry(0.2, 0.2, 0.2);
                    break;
                case 2:
                    geometry = new THREE.OctahedronGeometry(0.15, 0);
                    break;
            }
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
        
        // Add random velocity in all directions - reduced speed on mobile for better performance
        const baseSpeed = isMobile ? 1.2 : 2;
        const speed = baseSpeed + Math.random() * (isMobile ? 2 : 5);
        const angle1 = Math.random() * Math.PI * 2;
        const angle2 = Math.random() * Math.PI * 2;
        
        particle.userData = {
            velocity: new THREE.Vector3(
                speed * Math.sin(angle1) * Math.cos(angle2),
                speed * Math.sin(angle1) * Math.sin(angle2),
                speed * Math.cos(angle1)
            ),
            rotation: new THREE.Vector3(
                Math.random() * (isMobile ? 0.05 : 0.2), // Much slower rotation on mobile
                Math.random() * (isMobile ? 0.05 : 0.2), 
                Math.random() * (isMobile ? 0.05 : 0.2)
            ),
            lifetime: isMobile ? 0.6 + Math.random() * 0.3 : 1 + Math.random() // Shorter lifetime on mobile
        };
        
        // Add to scene and tracking array
        window.scene.add(particle);
        particles.push(particle);
    }
    
    // Store for update in animation loop
    window.explosionParticles = window.explosionParticles || [];
    window.explosionParticles.push(...particles);
    
    // Add a flash of light - green to match particles, reduced intensity on mobile
    const lightIntensity = isMobile ? 1.5 : 3;
    const lightDistance = isMobile ? 6 : 10;
    const explosionLight = new THREE.PointLight(0x00ff00, lightIntensity, lightDistance);
    explosionLight.position.copy(position);
    window.scene.add(explosionLight);
    
    // Remove light after a shorter time on mobile to save battery
    const lightDuration = isMobile ? 150 : 300;
    setTimeout(() => {
        window.scene.remove(explosionLight);
    }, lightDuration);
    
    // Play explosion sound
    playExplosionSound();
}

// Play explosion sound
function playExplosionSound() {
    if (!window.audioContext) return;
    
    // Try to use buffer pool first on mobile for better performance
    const bufferUsed = playBufferedSound(
        window.audioBufferPool?.explosionBuffers, 
        0.1, 
        () => {
            // Fallback to original real-time generation
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
                
                // Stop after effect is done and clean up resources
                setTimeout(() => {
                    try {
                        osc.stop();
                        osc.disconnect();
                        gain.disconnect();
                    } catch (e) {
                        // Ignore errors if already stopped/disconnected
                    }
                }, 600);
            } catch (error) {
                console.error("Error playing explosion sound:", error);
            }
        }
    );
    
    // If buffer pool wasn't used and no fallback was called, use original method
    if (!bufferUsed) {
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
            
            // Stop after effect is done and clean up resources
            setTimeout(() => {
                try {
                    osc.stop();
                    osc.disconnect();
                    gain.disconnect();
                } catch (e) {
                    // Ignore errors if already stopped/disconnected
                }
            }, 600);
        } catch (error) {
            console.error("Error playing explosion sound:", error);
        }
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
    
    // Check if we're on mobile
    const isMobile = document.body.classList.contains('mobile-device');
    let correct = false;
    let selectedIntervalName = "Unknown";
    
    if (isMobile) {
        // On mobile, check the attack buttons
        const leftAttackBtn = document.getElementById('left-attack');
        const rightAttackBtn = document.getElementById('right-attack');
        
        if (leftAttackBtn && rightAttackBtn) {
            // Check the correct value from button's dataset
            correct = isLeftClick 
                ? (leftAttackBtn.dataset.correct === "true")
                : (rightAttackBtn.dataset.correct === "true");
                
            // Get selected interval name from button's dataset
            selectedIntervalName = isLeftClick 
                ? (leftAttackBtn.dataset.interval || "Unknown")
                : (rightAttackBtn.dataset.interval || "Unknown");
        } else if (window.leftOption && window.rightOption) {
            // Fallback to option elements if buttons aren't available
            correct = isLeftClick 
                ? window.leftOption.dataset.correct === "true"
                : window.rightOption.dataset.correct === "true";
                
            try {
                selectedIntervalName = isLeftClick 
                    ? window.leftOption.querySelector('div:last-child').textContent.trim() 
                    : window.rightOption.querySelector('div:last-child').textContent.trim();
            } catch (error) {
                console.error("Error getting interval names:", error);
            }
        }
    } else {
        // On desktop, check the option elements
        if (!window.leftOption || !window.rightOption) {
            console.error("Option elements not found during projectile hit");
            return;
        }
        
        correct = isLeftClick 
            ? window.leftOption.dataset.correct === "true"
            : window.rightOption.dataset.correct === "true";
        
        try {
            selectedIntervalName = isLeftClick 
                ? window.leftOption.querySelector('div:last-child').textContent.trim() 
                : window.rightOption.querySelector('div:last-child').textContent.trim();
        } catch (error) {
            console.error("Error getting interval names:", error);
        }
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
    
    // Initialize mobile controls if on a mobile device
    if (isMobileDevice()) {
        initMobileControls();
    }
    
    console.log("Player controls initialized");
}

// Mobile device detection
function isMobileDevice() {
    // Use multiple detection methods for better reliability
    
    // Method 1: User agent detection
    const userAgent = navigator.userAgent.toLowerCase();
    const mobileUserAgent = /iphone|ipad|ipod|android|blackberry|windows phone|opera mini|silk|mobile|phone|samsung|nokia|webos|iemobile|kindle|psp|nintendo/i.test(userAgent);
    
    // Method 2: Touch events and screen size
    const hasTouch = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
    const isSmallScreen = window.innerWidth <= 1024;
    
    // Method 3: Media queries (most reliable)
    const mobileMediaQuery = window.matchMedia("(max-width: 1024px), (pointer: coarse)");
    const isMobileByMedia = mobileMediaQuery.matches;
    
    // Method 4: Platform detection
    const mobileOS = /android|iphone|ipad|ipod/i.test(navigator.platform);
    
    // Log detection results
    console.log("Mobile detection:", { 
        userAgent: mobileUserAgent, 
        touch: hasTouch, 
        smallScreen: isSmallScreen,
        mediaQuery: isMobileByMedia,
        mobileOS: mobileOS
    });
    
    // Combine all detection methods
    const isDetectedAsMobile = mobileUserAgent || (hasTouch && isSmallScreen) || isMobileByMedia || mobileOS;
    
    // Cache the result to avoid recalculating
    if (window.cachedMobileDetection === undefined) {
        window.cachedMobileDetection = isDetectedAsMobile;
        console.log("Device detected as:", isDetectedAsMobile ? "MOBILE" : "DESKTOP");
    }
    
    return window.cachedMobileDetection;
}

// Initialize mobile controls (joystick and attack buttons)
function initMobileControls() {
    console.log("Initializing mobile controls");
    
    try {
        // Show mobile controls
        const mobileControls = document.getElementById('mobile-controls');
        if (mobileControls) {
            mobileControls.style.display = 'block';
            mobileControls.style.zIndex = '5'; // Lower z-index to be behind menus
            mobileControls.style.position = 'fixed'; // Make sure it uses fixed positioning
        } else {
            console.error("Mobile controls element not found - creating it");
            // Create the mobile controls container if it doesn't exist
            const newMobileControls = document.createElement('div');
            newMobileControls.id = 'mobile-controls';
            newMobileControls.style.display = 'block';
            newMobileControls.style.position = 'fixed';
            newMobileControls.style.bottom = '0';
            newMobileControls.style.left = '0';
            newMobileControls.style.width = '100%';
            newMobileControls.style.height = '150px';
            newMobileControls.style.zIndex = '5';
            
            // Create joystick zone
            const joystickZone = document.createElement('div');
            joystickZone.id = 'joystick-zone';
            joystickZone.style.position = 'absolute';
            joystickZone.style.bottom = '20px';
            joystickZone.style.left = '100px';
            joystickZone.style.width = '100px';
            joystickZone.style.height = '100px';
            newMobileControls.appendChild(joystickZone);
            
            // Create left attack button
            const leftAttack = document.createElement('div');
            leftAttack.id = 'left-attack';
            leftAttack.textContent = 'L';
            leftAttack.style.position = 'absolute';
            leftAttack.style.bottom = '40px';
            leftAttack.style.right = '120px';
            leftAttack.style.width = '60px';
            leftAttack.style.height = '60px';
            leftAttack.style.borderRadius = '50%';
            leftAttack.style.background = 'rgba(0, 255, 255, 0.5)';
            leftAttack.style.border = '2px solid #00ffff';
            leftAttack.style.textAlign = 'center';
            leftAttack.style.lineHeight = '60px';
            leftAttack.style.color = '#ffffff';
            leftAttack.style.fontSize = '24px';
            newMobileControls.appendChild(leftAttack);
            
            // Create right attack button
            const rightAttack = document.createElement('div');
            rightAttack.id = 'right-attack';
            rightAttack.textContent = 'R';
            rightAttack.style.position = 'absolute';
            rightAttack.style.bottom = '40px';
            rightAttack.style.right = '40px';
            rightAttack.style.width = '60px';
            rightAttack.style.height = '60px';
            rightAttack.style.borderRadius = '50%';
            rightAttack.style.background = 'rgba(255, 0, 255, 0.5)';
            rightAttack.style.border = '2px solid #ff00ff';
            rightAttack.style.textAlign = 'center';
            rightAttack.style.lineHeight = '60px';
            rightAttack.style.color = '#ffffff';
            rightAttack.style.fontSize = '24px';
            newMobileControls.appendChild(rightAttack);
            
            document.body.appendChild(newMobileControls);
        }
        
        // Initialize the joystick
        initJoystick();
        
        // Initialize attack buttons
        initAttackButtons();
        
        // Initialize touch camera controls
        initTouchCameraControls();
        
        // Add some additional mobile-specific styles
        const canvas = document.querySelector('canvas');
        if (canvas) {
            // Make sure canvas fills the screen
            canvas.style.width = '100%';
            canvas.style.height = '100%';
        }
        
        console.log("Mobile controls initialized successfully");
    } catch (error) {
        console.error("Error initializing mobile controls:", error);
    }
}

// Initialize touch camera controls for mobile devices
function initTouchCameraControls() {
    console.log("Initializing touch camera controls with correct rotation axes");
    
    // Get canvas element (where touches will be detected)
    const canvas = document.querySelector('canvas');
    if (!canvas) {
        console.error("Canvas not found for touch camera controls");
        return;
    }
    
    // Variables to track touch movement
    let touchStartX = 0;
    let touchStartY = 0;
    let isMovingCamera = false;
    let touchSensitivityX = 0.003; // Horizontal sensitivity 
    let touchSensitivityY = 0.003; // Vertical sensitivity
    
    // Store Euler angles for proper rotation tracking
    let currentPitch = 0; // Up/down rotation (around X axis)
    let currentYaw = 0;   // Left/right rotation (around Y axis)
    
    // Initialize the Euler angles from camera's current rotation
    if (window.camera) {
        const euler = new THREE.Euler().setFromQuaternion(window.camera.quaternion, 'YXZ');
        currentYaw = euler.y;
        currentPitch = euler.x;
    }
    
    // We need to track touches that are NOT on control elements
    canvas.addEventListener('touchstart', function(e) {
        // Skip if touching control elements or if look joystick is active
        if (e.target.id === 'joystick-zone' || 
            e.target.id === 'left-attack' || 
            e.target.id === 'right-attack' ||
            e.target.id === 'look-joystick-zone' ||
            e.target.closest('#mobile-controls') ||
            e.target.closest('#attack-container') ||
            (window.lookJoystickState && window.lookJoystickState.active)) {
            return;
        }
        
        // Skip if game is not running
        if (!window.gameState.started || window.gameState.paused || 
            window.gameState.gameOver || !window.gameState.canMove) {
            return;
        }
        
        // Get the first touch
        if (e.touches.length > 0) {
            touchStartX = e.touches[0].clientX;
            touchStartY = e.touches[0].clientY;
            isMovingCamera = true;
            
            // Update current Euler angles from camera's rotation
            if (window.camera) {
                const euler = new THREE.Euler().setFromQuaternion(window.camera.quaternion, 'YXZ');
                currentYaw = euler.y;
                currentPitch = euler.x;
            }
            
            // Prevent default to avoid scrolling
            e.preventDefault();
        }
    }, { passive: false });
    
    // Track touch movement to rotate camera
    canvas.addEventListener('touchmove', function(e) {
        // Skip if not currently moving camera or if look joystick is active
        if (!isMovingCamera || (window.lookJoystickState && window.lookJoystickState.active)) return;
        
        // Skip if game is not running
        if (!window.gameState.started || window.gameState.paused || 
            window.gameState.gameOver || !window.gameState.canMove) {
            return;
        }
        
        // Skip if no camera
        if (!window.camera) return;
        
        // Get current touch position
        if (e.touches.length > 0) {
            const touchX = e.touches[0].clientX;
            const touchY = e.touches[0].clientY;
            
            // Calculate movement since touch start
            const deltaX = touchX - touchStartX;
            const deltaY = touchY - touchStartY;
            
            // Update the Euler angles
            // Horizontal movement (deltaX) changes yaw (left/right rotation)
            currentYaw -= deltaX * touchSensitivityX;
            
            // Vertical movement (deltaY) changes pitch (up/down rotation)
            // IMPORTANT: Negate deltaY so that moving up looks up
            currentPitch -= deltaY * touchSensitivityY;
            
            // Clamp the pitch to avoid gimbal lock
            currentPitch = Math.max(-Math.PI/2 + 0.01, Math.min(Math.PI/2 - 0.01, currentPitch));
            
            // Apply the rotation using the proper order (YXZ)
            // This ensures we're rotating in the expected world space
            window.camera.quaternion.setFromEuler(new THREE.Euler(currentPitch, currentYaw, 0, 'YXZ'));
            
            // Update for next move event
            touchStartX = touchX;
            touchStartY = touchY;
            
            // Prevent default to avoid scrolling
            e.preventDefault();
        }
    }, { passive: false });
    
    // End camera movement on touch end
    canvas.addEventListener('touchend', function(e) {
        isMovingCamera = false;
    });
    
    // Also handle touch cancel
    canvas.addEventListener('touchcancel', function(e) {
        isMovingCamera = false;
    });
    
    console.log("Touch camera controls initialized with correct rotation axes");
}

// Add a simple touch instruction overlay for first-time users
function addTouchInstructions() {
    // Function intentionally left empty - mobile instructions overlay removed
    return;
}

// Initialize nipplejs joystick
function initJoystick() {
    console.log("Initializing virtual joysticks");
    
    // Make sure we have nipplejs available
    if (typeof nipplejs === 'undefined') {
        console.error("nipplejs not found! Loading it dynamically");
        
        // Try to load nipplejs dynamically
        const script = document.createElement('script');
        script.src = 'https://cdn.jsdelivr.net/npm/nipplejs@0.10.1/dist/nipplejs.min.js';
        script.onload = function() {
            console.log("nipplejs loaded dynamically, now creating joysticks");
            createJoystick();
            createLookJoystick();
        };
        script.onerror = function() {
            console.error("Failed to load nipplejs dynamically");
        };
        document.head.appendChild(script);
        return;
    }
    
    createJoystick();
    createLookJoystick();
}

// Separate function to create the joystick (called either directly or after dynamic loading)
function createJoystick() {
    try {
        // Ensure the joystick zone element exists
        let joystickZone = document.getElementById('joystick-zone');
        
        if (!joystickZone) {
            console.log("Joystick zone not found, creating it");
            joystickZone = document.createElement('div');
            joystickZone.id = 'joystick-zone';
            joystickZone.style.position = 'fixed';
            joystickZone.style.bottom = '20px';
            joystickZone.style.left = '100px';
            joystickZone.style.width = '120px';
            joystickZone.style.height = '120px';
            joystickZone.style.zIndex = '1000';
            joystickZone.style.background = 'rgba(255,255,255,0.1)';
            joystickZone.style.borderRadius = '50%';
            joystickZone.style.border = '1px solid rgba(0,255,255,0.3)';
            
            // Add to mobileControls container or directly to body
            const mobileControls = document.getElementById('mobile-controls');
            if (mobileControls) {
                mobileControls.appendChild(joystickZone);
            } else {
                document.body.appendChild(joystickZone);
            }
        }
        
        // Create the joystick with improved options
        const joystickOptions = {
            zone: joystickZone,
            mode: 'static',
            position: { left: '50%', top: '50%' },
            color: 'rgba(0, 255, 255, 0.8)',
            size: 100,
            lockX: false,
            lockY: false,
            dynamicPage: true
        };
        
        // Destroy any existing joystick
        if (window.joystick) {
            try {
                window.joystick.destroy();
            } catch (e) {
                console.error("Error destroying existing joystick:", e);
            }
        }
        
        // Create the joystick
        window.joystick = nipplejs.create(joystickOptions);
        
        // Track joystick state for movement
        window.joystickState = {
            forward: 0,
            right: 0,
            active: false
        };
        
        // Add joystick event listeners
        window.joystick.on('start move', function(evt, data) {
            // Mark joystick as active
            window.joystickState.active = true;
            
            // Update movement values based on joystick position
            if (data.vector) {
                // Forward/backward (y-axis)
                // FIXED: Removed the negation to make up = forward
                window.joystickState.forward = data.vector.y;
                
                // Left/right (x-axis)
                window.joystickState.right = data.vector.x;
                
                // Update movement flags based on joystick position
                // Only if above certain threshold to avoid minor movements
                const threshold = 0.3;
                
                // Forward/backward - FIXED: Corrected direction mapping
                window.moveForward = window.joystickState.forward > threshold;
                window.moveBackward = window.joystickState.forward < -threshold;
                
                // Left/right
                window.moveRight = window.joystickState.right > threshold;
                window.moveLeft = window.joystickState.right < -threshold;
            }
        });
        
        // Reset joystick state when released
        window.joystick.on('end', function() {
            window.joystickState.active = false;
            window.joystickState.forward = 0;
            window.joystickState.right = 0;
            
            // Reset movement flags
            window.moveForward = false;
            window.moveBackward = false;
            window.moveLeft = false;
            window.moveRight = false;
        });
        
        console.log("Joystick initialized successfully with non-inverted controls");
    } catch (error) {
        console.error("Error initializing joystick:", error);
    }
}

// Function to create the look joystick for camera control
function createLookJoystick() {
    try {
        // Ensure the look joystick zone element exists
        let lookJoystickZone = document.getElementById('look-joystick-zone');
        
        if (!lookJoystickZone) {
            console.log("Look joystick zone not found, creating it");
            lookJoystickZone = document.createElement('div');
            lookJoystickZone.id = 'look-joystick-zone';
            lookJoystickZone.style.position = 'fixed';
            lookJoystickZone.style.bottom = '20px';
            lookJoystickZone.style.right = '20px';
            lookJoystickZone.style.width = '120px';
            lookJoystickZone.style.height = '120px';
            lookJoystickZone.style.zIndex = '10'; // Lower z-index to be consistent with mobile controls
            lookJoystickZone.style.background = 'rgba(255,255,255,0.1)';
            lookJoystickZone.style.borderRadius = '50%';
            lookJoystickZone.style.border = '1px solid rgba(255,0,255,0.3)';
            
            // Add to mobileControls container or directly to body
            const mobileControls = document.getElementById('mobile-controls');
            if (mobileControls) {
                mobileControls.appendChild(lookJoystickZone);
            } else {
                document.body.appendChild(lookJoystickZone);
            }
        }
        
        // Create the look joystick with improved options
        const lookJoystickOptions = {
            zone: lookJoystickZone,
            mode: 'static',
            position: { left: '50%', top: '50%' },
            color: 'rgba(255, 0, 255, 0.8)',
            size: 100,
            lockX: false,
            lockY: false,
            dynamicPage: true
        };
        
        // Destroy any existing look joystick
        if (window.lookJoystick) {
            try {
                window.lookJoystick.destroy();
            } catch (e) {
                console.error("Error destroying existing look joystick:", e);
            }
        }
        
        // Create the look joystick
        window.lookJoystick = nipplejs.create(lookJoystickOptions);
        
        // Track look joystick state for camera movement
        window.lookJoystickState = {
            yaw: 0,
            pitch: 0,
            active: false
        };
        
        // Add look joystick event listeners - simplified to just store position
        window.lookJoystick.on('start move', function(evt, data) {
            // Skip if game is not running
            if (!window.gameState.started || window.gameState.paused || 
                window.gameState.gameOver || !window.gameState.canMove) {
                return;
            }
            
            // Mark look joystick as active
            window.lookJoystickState.active = true;
            
            // Update camera values based on joystick position
            if (data.vector) {
                // Store vector for use in animation loop
                window.lookJoystickState.yaw = data.vector.x;
                window.lookJoystickState.pitch = data.vector.y;  // Removed negation to make up motion look up
            }
        });
        
        // Reset look joystick state when released
        window.lookJoystick.on('end', function() {
            window.lookJoystickState.active = false;
            window.lookJoystickState.yaw = 0;
            window.lookJoystickState.pitch = 0;
        });
        
        console.log("Look joystick initialized successfully");
    } catch (error) {
        console.error("Error initializing look joystick:", error);
    }
}

// Initialize attack buttons
function initAttackButtons() {
    console.log("Initializing attack buttons");
    
    // Remove any existing buttons first to prevent duplicates
    const oldLeftAttack = document.getElementById('left-attack');
    if (oldLeftAttack) oldLeftAttack.remove();
    
    const oldRightAttack = document.getElementById('right-attack');
    if (oldRightAttack) oldRightAttack.remove();
    
    // Create attack buttons container if it doesn't exist
    let attackContainer = document.getElementById('attack-container');
    if (!attackContainer) {
        attackContainer = document.createElement('div');
        attackContainer.id = 'attack-container';
        attackContainer.style.cssText = `
            position: fixed;
            bottom: 180px;
            right: 30px;
            z-index: 5;
            display: flex;
            gap: 20px;
        `;
        document.body.appendChild(attackContainer);
    } else {
        // Update position even if container exists
        attackContainer.style.bottom = '180px';
        attackContainer.style.right = '30px';
        attackContainer.style.zIndex = '5';
    }
    
    // Create left attack button
    const leftAttackBtn = document.createElement('div');
    leftAttackBtn.id = 'left-attack';
    leftAttackBtn.style.cssText = `
        width: 70px;
        height: 70px;
        border-radius: 50%;
        background: rgba(0, 255, 255, 0.5);
        border: 3px solid #00ffff;
        box-shadow: 0 0 15px rgba(0, 255, 255, 0.7);
        display: flex;
        justify-content: center;
        align-items: center;
        font-size: 24px;
        color: white;
        font-weight: bold;
        user-select: none;
        -webkit-tap-highlight-color: transparent;
    `;
    leftAttackBtn.innerText = 'L';
    
    // Create right attack button
    const rightAttackBtn = document.createElement('div');
    rightAttackBtn.id = 'right-attack';
    rightAttackBtn.style.cssText = `
        width: 70px;
        height: 70px;
        border-radius: 50%;
        background: rgba(255, 0, 255, 0.5);
        border: 3px solid #ff00ff;
        box-shadow: 0 0 15px rgba(255, 0, 255, 0.7);
        display: flex;
        justify-content: center;
        align-items: center;
        font-size: 24px;
        color: white;
        font-weight: bold;
        user-select: none;
        -webkit-tap-highlight-color: transparent;
    `;
    rightAttackBtn.innerText = 'R';
    
    // Add buttons to container
    attackContainer.appendChild(leftAttackBtn);
    attackContainer.appendChild(rightAttackBtn);
    
    // Left attack button
    leftAttackBtn.addEventListener('touchstart', function(e) {
        e.preventDefault(); // Prevent default touch behavior
        
        // Add visual feedback
        this.style.transform = 'scale(0.9)';
        this.style.opacity = '1';
        
        // Make sure the game is active
        if (!window.gameState.activeEnemy || !window.gameState.started || 
            window.gameState.paused || !window.controls) {
            return;
        }
        
        console.log("Left attack button touched");
        
        // Create projectile with left click equivalent
        createProjectile(true);
    });
    
    leftAttackBtn.addEventListener('touchend', function(e) {
        e.preventDefault();
        // Reset visual feedback
        this.style.transform = 'scale(1)';
        this.style.opacity = '0.8';
    });
    
    // Right attack button
    rightAttackBtn.addEventListener('touchstart', function(e) {
        e.preventDefault(); // Prevent default touch behavior
        
        // Add visual feedback
        this.style.transform = 'scale(0.9)';
        this.style.opacity = '1';
        
        // Make sure the game is active
        if (!window.gameState.activeEnemy || !window.gameState.started || 
            window.gameState.paused || !window.controls) {
            return;
        }
        
        console.log("Right attack button touched");
        
        // Create projectile with right click equivalent
        createProjectile(false);
    });
    
    rightAttackBtn.addEventListener('touchend', function(e) {
        e.preventDefault();
        // Reset visual feedback
        this.style.transform = 'scale(1)';
        this.style.opacity = '0.8';
    });
    
    console.log("Attack buttons initialized");
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
    
    // Show health display if game has started
    if (window.gameState && window.gameState.started && window.healthDisplay) {
        window.healthDisplay.style.display = 'block';
    }
    
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
        min-width: 300px; max-width: 90%; max-height: 90vh; overflow-y: auto;
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
            
            // Show loading animation immediately
            showLoadingAnimation();
            
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
            console.log("Main menu button clicked from game over screen");
            
            // Show loading animation immediately
            showLoadingAnimation();
            
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
        if (window.backgroundMusicElement) { window.backgroundMusicElement.pause(); window.backgroundMusicElement.currentTime = 0; window.gameState.backgroundMusicPlaying = false; }
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
        // Show loading animation
        showLoadingAnimation();
        
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
        if (window.backgroundMusicElement) { window.backgroundMusicElement.pause(); window.backgroundMusicElement.currentTime = 0; window.gameState.backgroundMusicPlaying = false; }
        
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
        if (window.enemies && window.enemies.length > 0) {
            window.enemies.forEach(enemy => {
                if (enemy && window.scene) {
                    window.scene.remove(enemy);
                }
            });
        }
        window.enemies = [];
        
        // Clear projectiles
        if (window.projectiles && window.projectiles.length > 0) {
            window.projectiles.forEach(projectile => {
                if (projectile && window.scene) {
                    window.scene.remove(projectile);
                }
            });
        }
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
        
        // Reset game state variables
        window.gameState.gameOver = false;
        window.gameState.gameWon = false;
        window.gameState.started = true;
        window.gameState.paused = false;
        window.gameState.score = 0;
        window.gameState.enemiesDefeated = 0;
        window.gameState.playerHealth = window.config.playerHealth;
        window.gameState.damageTaken = 0;
        window.gameState.missedIntervals = {};
        window.gameState.missedProjectiles = 0;
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
        
        // Reset game clock
        window.gameState.startTime = null; // Will be set when countdown finishes
        window.gameState.completionTime = 0;
        
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
        
        // Reset velocity to prevent leftover momentum
        if (window.velocity) {
            window.velocity.set(0, 0, 0);
        }
        
        // Reset movement keys
        window.moveForward = false;
        window.moveBackward = false;
        window.moveLeft = false;
        window.moveRight = false;
        
        // Hide loading animation before starting countdown
        hideLoadingAnimation();
        
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
        
        // Remove background music start with delay since it's now started in the countdown
        
        console.log("Game restarted successfully");
    } catch (error) {
        console.error("Error restarting game:", error);
        alert("There was an error restarting the game. Please refresh the page.");
        
        // Hide loading animation if there was an error
        hideLoadingAnimation();
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
    
    // Reduce logging frequency for better performance - only log every 120 frames (2 seconds at 60fps)
    const isMobile = isMobileDevice();
    const logFrequency = isMobile ? 240 : 120; // Log less frequently on mobile
    
    if (window.frameCounter % logFrequency === 0) {
        console.log("Animation frame:", window.frameCounter, "Game state:", 
                    window.gameState.started ? "Started" : "Not started",
                    window.gameState.paused ? "Paused" : "Running");
        
        // Check canvas visibility
        const canvas = document.querySelector('canvas');
        if (canvas) {
            // Only log detailed canvas info on desktop to reduce mobile overhead
            if (!isMobile) {
                console.log("Canvas display:", canvas.style.display, "Canvas z-index:", canvas.style.zIndex);
            }
            
            // Fix z-index layering occasionally to ensure everything stays visible
            // Do this less frequently on mobile
            const fixFrequency = isMobile ? 600 : 300; // Every 10 seconds on mobile vs 5 seconds on desktop
            if (window.frameCounter % fixFrequency === 0) {
                fixZIndexLayers();
            }
        } else {
            console.error("Canvas not found in animation loop");
        }
        
        // Run audio resource cleanup less frequently on mobile to save battery
        const cleanupFrequency = isMobile ? 900 : 300; // Every 15 seconds on mobile vs 5 seconds on desktop
        // Run audio resource cleanup periodically 
        if (window.frameCounter % cleanupFrequency === 0) {
            cleanupAudioResources();
        }
    }
    
    // Update explosion particles if any exist
    if (window.explosionParticles && window.explosionParticles.length > 0) {
        updateExplosionParticles();
    }
    
    // Process look joystick for camera rotation (mobile look controls)
    if (window.lookJoystickState && window.lookJoystickState.active && 
        window.gameState.started && !window.gameState.gameOver && !window.gameState.paused && 
        window.gameState.canMove && window.camera) {
        
        // Get current camera rotation
        const euler = new THREE.Euler().setFromQuaternion(window.camera.quaternion, 'YXZ');
        
        // Calculate rotation based on joystick position and make it frame-rate independent
        const yawSensitivity = 1.0;   // Higher sensitivity for left/right turning (horizontal)
        const pitchSensitivity = 0.5;  // Lower sensitivity for up/down looking (vertical)
        
        // Calculate rotations with different sensitivity values
        const deltaYaw = window.lookJoystickState.yaw * yawSensitivity * window.delta;
        const deltaPitch = window.lookJoystickState.pitch * pitchSensitivity * window.delta;
        
        // Apply rotation
        euler.y -= deltaYaw; // Left/right rotation
        
        // Clamp vertical rotation to prevent flipping
        euler.x = Math.max(-Math.PI / 2 + 0.01, Math.min(Math.PI / 2 - 0.01, euler.x + deltaPitch));
        
        // Apply the rotation to the camera
        window.camera.quaternion.setFromEuler(euler);
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
        
        // Detect if we're on mobile for performance optimizations
        const isMobile = isMobileDevice();
        
        // Add fog for atmosphere but with increased visibility range
        // Use less expensive linear fog on mobile
        if (isMobile) {
            window.scene.fog = new THREE.Fog(0x000033, 30, 300); // Shorter range on mobile
        } else {
            window.scene.fog = new THREE.Fog(0x000033, 20, 500); // Full range on desktop
        }
        
        // Create camera with optimized settings
        window.camera = new THREE.PerspectiveCamera(
            isMobile ? 70 : 75, // Slightly lower FOV on mobile for better performance
            window.innerWidth / window.innerHeight, // Aspect ratio
            0.1, // Near clipping plane
            isMobile ? 3000 : 6000 // Reduced far clipping plane on mobile
        );
        window.camera.position.y = 1.6; // Average eye height
        
        // Create renderer with mobile-optimized settings
        const rendererOptions = {
            antialias: !isMobile, // Disable antialiasing on mobile for better performance
            alpha: true,
            powerPreference: isMobile ? "low-power" : "high-performance", // Battery optimization
            precision: isMobile ? "mediump" : "highp" // Lower precision on mobile
        };
        
        window.renderer = new THREE.WebGLRenderer(rendererOptions);
        window.renderer.setSize(window.innerWidth, window.innerHeight);
        window.renderer.setClearColor(0x000033, 1); // Set clear color to dark blue
        
        // Disable expensive shadow features on mobile
        if (!isMobile) {
            window.renderer.shadowMap.enabled = true;
            window.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
        }
        
        // Set pixel ratio for device compatibility, but cap it for performance
        const pixelRatio = Math.min(window.devicePixelRatio, isMobile ? 1.25 : 3);
        window.renderer.setPixelRatio(pixelRatio);
        
        // Additional mobile performance optimizations
        if (isMobile) {
            // Disable expensive WebGL features for better performance
            window.renderer.sortObjects = false; // Disable object sorting
            window.renderer.autoClear = true;
        }
        
        // Style and position the canvas properly
        const canvas = window.renderer.domElement;
        canvas.style.position = 'absolute';
        canvas.style.left = '0';
        canvas.style.top = '0';
        canvas.style.zIndex = '1'; // Lower z-index to keep it behind UI
        
        // Add renderer to document - insert as first element for proper z-index
        document.body.insertBefore(canvas, document.body.firstChild);
        
        // Add lighting - reduced complexity on mobile
        // Ambient light for overall scene illumination
        const ambientIntensity = isMobile ? 0.6 : 0.8;
        const ambientLight = new THREE.AmbientLight(0x444444, ambientIntensity);
        window.scene.add(ambientLight);
        
        // Add a hemispheric light for better color distribution (only on desktop)
        if (!isMobile) {
            const hemisphereLight = new THREE.HemisphereLight(0xffffff, 0x444444, 0.6);
            window.scene.add(hemisphereLight);
        }
        
        // Point light attached to player for better visibility - reduced range on mobile
        const playerLightRange = isMobile ? 15 : 20;
        const playerLightIntensity = isMobile ? 1.2 : 1.5;
        const playerLight = new THREE.PointLight(0x6688cc, playerLightIntensity, playerLightRange);
        playerLight.position.set(0, 1.8, 0); // Positioned at head level
        window.camera.add(playerLight);
        window.scene.add(window.camera);
        
        console.log("Three.js initialized successfully for", isMobile ? "mobile" : "desktop");
        return true;
    } catch (error) {
        console.error("Error initializing Three.js:", error);
        return false;
    }
}

// Create synthwave style sky - simplified for better performance
function createSynthwaveSky() {
    console.log("Creating minimalist synthwave sky");
    
    // Set a darker base color for the scene
    window.renderer.setClearColor(new THREE.Color(0x050023)); // Deep purple-blue base color
    window.scene.fog = new THREE.FogExp2(0x110038, 0.0015); // Reduced fog density for better visibility
    
    // Create a single backdrop for the sky instead of a box
    createSimpleSkyBackdrop();
    
    // Ground plane with grid
    const groundSize = 2000;
    const groundGeometry = new THREE.PlaneGeometry(groundSize, groundSize);
    const groundMaterial = new THREE.MeshBasicMaterial({
        color: 0x000000,
        wireframe: false
    });
    
    const ground = new THREE.Mesh(groundGeometry, groundMaterial);
    ground.rotation.x = -Math.PI / 2;
    ground.position.y = -0.5;
    window.scene.add(ground);
    
    // Create enhanced grid with perspective effect
    const gridHelper = new THREE.GridHelper(groundSize, 100, 0xff00ff, 0x00ffff);
    gridHelper.position.y = -0.48; // Slightly above ground
    window.scene.add(gridHelper);
    
    console.log("Minimalist synthwave sky created");
}

// Create a simple backdrop with gradient and sun
function createSimpleSkyBackdrop() {
    // Detect mobile for performance optimizations
    const isMobile = isMobileDevice();
    
    // Create a smaller, more optimized sky sphere for mobile
    const skyRadius = isMobile ? 500 : 1000; // Smaller radius on mobile
    const skySegments = isMobile ? 16 : 32;  // Fewer segments on mobile
    const skyRings = isMobile ? 8 : 16;      // Fewer rings on mobile
    
    const skyGeometry = new THREE.SphereGeometry(skyRadius, skySegments, skyRings);
    
    // Create a canvas for the sky texture with reduced resolution on mobile
    const canvas = document.createElement('canvas');
    canvas.width = isMobile ? 1024 : 2048;   // Half resolution on mobile
    canvas.height = isMobile ? 512 : 1024;   // Half resolution on mobile
    const ctx = canvas.getContext('2d');
    
    // Create vibrant synthwave sunset gradient with higher contrast
    const bgGradient = ctx.createLinearGradient(0, 0, 0, canvas.height);
    bgGradient.addColorStop(0, '#090425'); // Deep purple-blue at top
    bgGradient.addColorStop(0.2, '#170245'); // Rich purple
    bgGradient.addColorStop(0.4, '#3b0069'); // Medium purple
    bgGradient.addColorStop(0.6, '#5d0066'); // Fuchsia
    bgGradient.addColorStop(0.7, '#840048'); // Deep pink
    bgGradient.addColorStop(0.8, '#ff1c51'); // Bright pink
    bgGradient.addColorStop(0.9, '#ff6c20'); // Bright orange 
    bgGradient.addColorStop(1, '#ffb200'); // Golden yellow at bottom
    
    // Fill background
    ctx.fillStyle = bgGradient;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    // Add fewer stars on mobile to reduce texture complexity
    const starCount = isMobile ? 150 : 350;
    for (let i = 0; i < starCount; i++) {
        const x = Math.random() * canvas.width;
        const y = Math.random() * (canvas.height * 0.6); // Stars in top 60%
        const size = Math.random() * 1.5 + 0.5;
        
        // Vary star brightness
        const brightness = Math.random() * 80 + 175; // 175-255
        ctx.fillStyle = `rgb(${brightness},${brightness},${brightness})`;
        ctx.globalAlpha = Math.random() * 0.7 + 0.3;
        ctx.fillRect(x, y, size, size);
    }
    
    // Draw sun and grid directly on the sky texture (simplified on mobile)
    drawSunAndGridOnSky(ctx, canvas.width, canvas.height, isMobile);
    
    // Reset alpha
    ctx.globalAlpha = 1.0;
    
    // Create texture from canvas 
    const skyTexture = new THREE.CanvasTexture(canvas);
    
    // Optimize texture settings for mobile
        if (isMobile) {
        skyTexture.generateMipmaps = false; // Disable mipmaps on mobile for memory savings
        skyTexture.minFilter = THREE.LinearFilter;
        skyTexture.magFilter = THREE.LinearFilter;
    }
    
    // Create sky material
    const skyMaterial = new THREE.MeshBasicMaterial({
        map: skyTexture,
        side: THREE.BackSide, // Show from inside
        fog: false, // Don't apply fog to the sky
        depthWrite: false // Ensure it's always visible
    });
    
    // Create sky sphere
    const sky = new THREE.Mesh(skyGeometry, skyMaterial);
    window.scene.add(sky);
    
    console.log("Sky created with radius:", skyRadius, "for", isMobile ? "mobile" : "desktop");
    
    // Force a render to ensure everything is visible
    if (window.renderer && window.scene && window.camera) {
        window.renderer.render(window.scene, window.camera);
    }
}

// Draw sun and grid directly on the sky texture
function drawSunAndGridOnSky(ctx, width, height, isMobile = false) {
    // Simplify grid on mobile for better performance
    const gridComplexity = isMobile ? 0.5 : 1.0;
    
    // Draw the horizon line
    const horizonY = height * 0.62; // Set horizon a bit lower (62% down)
    
    // Set the sun Y position slightly higher than the horizon
    const sunY = horizonY - 40; // 40 pixels above horizon
    const centerX = width / 2;
    
    // Draw sun glow first (behind the solid sun) - smaller on mobile
    const glowRadius = isMobile ? 200 : 400;
    const sunGlowGradient = ctx.createRadialGradient(
        centerX, sunY, 0,
        centerX, sunY, glowRadius
    );
    sunGlowGradient.addColorStop(0, 'rgba(255, 155, 50, 0.9)');
    sunGlowGradient.addColorStop(0.4, 'rgba(255, 100, 30, 0.5)');
    sunGlowGradient.addColorStop(0.7, 'rgba(255, 50, 30, 0.2)');
    sunGlowGradient.addColorStop(1, 'rgba(255, 0, 50, 0)');
    
    ctx.fillStyle = sunGlowGradient;
    ctx.beginPath();
    ctx.arc(centerX, sunY, glowRadius, 0, Math.PI * 2);
    ctx.fill();
    
    // Draw solid sun with no transparency - smaller on mobile
    const sunSize = isMobile ? 100 : 150;
    ctx.beginPath();
    ctx.arc(centerX, sunY, sunSize, 0, Math.PI * 2);
    
    // Create a vibrant sun gradient with solid colors (no transparency)
    const sunGradient = ctx.createLinearGradient(centerX - sunSize, sunY, centerX + sunSize, sunY);
    sunGradient.addColorStop(0, '#ff5500');  // Orange at left edge
    sunGradient.addColorStop(0.25, '#ff8800'); // Light orange
    sunGradient.addColorStop(0.5, '#ffdd00');  // Bright yellow in center
    sunGradient.addColorStop(0.75, '#ff8800'); // Light orange
    sunGradient.addColorStop(1, '#ff5500');  // Orange at right edge
    
    // Fill the sun with the solid gradient
    ctx.fillStyle = sunGradient;
    ctx.globalAlpha = 1.0; // Ensure full opacity
    ctx.fill();
    
    // Add a solid highlight in the center (no transparency)
    ctx.beginPath();
    ctx.arc(centerX, sunY, sunSize * 0.5, 0, Math.PI * 2);
    
    // Create a solid highlight gradient
    const highlightGradient = ctx.createRadialGradient(
        centerX, sunY, 0,
        centerX, sunY, sunSize * 0.5
    );
    highlightGradient.addColorStop(0, '#ffffcc'); // Solid light yellow center
    highlightGradient.addColorStop(1, '#ffdd00'); // Fade to match the sun's center color
    
    ctx.fillStyle = highlightGradient;
    ctx.globalAlpha = 0.7; // Still mostly opaque but slightly blended
    ctx.fill();
    
    // Reset alpha for the rest of the drawing
    ctx.globalAlpha = 1.0;
    
    // Draw the horizon line (after sun so it's visible)
    ctx.strokeStyle = '#00ffff'; // Bright cyan for horizon
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(0, horizonY);
    ctx.lineTo(width, horizonY);
    ctx.stroke();
    
    // Add grid lines below horizon - reduced complexity on mobile
    // Horizontal lines (cyan)
    ctx.strokeStyle = '#00ffff';
    ctx.lineWidth = 2;
    
    // Reduce grid complexity on mobile
    const maxHorizontalLines = isMobile ? 20 : 40;
    for (let i = 1; i <= maxHorizontalLines; i++) {
        const spacing = 8 + i * 1.5; // Closer spacing
        const y = horizonY + i * spacing;
        
        if (y >= height) continue;
        
        // Reduce opacity with distance
        ctx.globalAlpha = 1 - (i / maxHorizontalLines) * 0.8;
        
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(width, y);
        ctx.stroke();
    }
    
    // Vertical lines (magenta) - reduced complexity on mobile
    ctx.strokeStyle = '#ff00ff';
    ctx.lineWidth = 2;
    const vertLineCount = isMobile ? 20 : 40;
    
    for (let i = -vertLineCount; i <= vertLineCount; i++) {
        // Skip the center line
        if (i === 0) continue;
        
        // Calculate x position with wider spacing further from center
        const x = centerX + (i * (width / (vertLineCount * 2.5)) * (Math.abs(i) * 0.08 + 1));
        
        // Reduce opacity for lines further from center
        const normalizedDist = Math.abs(i) / vertLineCount;
        ctx.globalAlpha = 1 - normalizedDist * 0.75;
        
        ctx.beginPath();
        ctx.moveTo(x, horizonY);
        ctx.lineTo(x, height);
        ctx.stroke();
    }
    
    // Reset alpha
    ctx.globalAlpha = 1.0;
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
        z-index: 1400;
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
    
    // Detect if mobile
    const isMobile = document.body.classList.contains('mobile-device');
    
    // Set initial content based on device type
    if (isMobile) {
        // Compact format for mobile
        leftOption.innerHTML = `<div class="interval-compact">↑ P5</div>`;
        rightOption.innerHTML = `<div class="interval-compact">↑ m3</div>`;
    } else {
        // Standard format for desktop
        leftOption.innerHTML = `
            <span style="display:block;font-size:16px;opacity:0.9;margin-bottom:8px;color:#aaffff">LEFT CLICK</span>
            <div class="direction-arrow">↑</div>
            <div class="interval-text">Interval</div>
        `;
        
        rightOption.innerHTML = `
            <span style="display:block;font-size:16px;opacity:0.9;margin-bottom:8px;color:#ffaaff">RIGHT CLICK</span>
            <div class="direction-arrow">↑</div>
            <div class="interval-text">Interval</div>
        `;
    }
    
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
    console.log("Creating crosshair");
    
    // Remove existing crosshair if any
    if (window.crosshair) {
        document.body.removeChild(window.crosshair);
    }
    
    // Create container div and center it
    const crosshair = document.createElement('div');
    crosshair.id = 'game-crosshair';
    crosshair.className = 'game-crosshair';
    crosshair.style.cssText = `
        position: fixed;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        z-index: 15;
        pointer-events: none;
        display: none;
        justify-content: center;
        align-items: center;
    `;
    
    // Create cyan circle with exact dimensions
    const circle = document.createElement('div');
    circle.style.cssText = `
        position: absolute;
        width: 16px;
        height: 16px;
        border: 2px solid #00ffff;
        border-radius: 50%;
        box-shadow: 0 0 5px #00ffff;
    `;
    
    // Create pink dot with exact positioning
    const dot = document.createElement('div');
    dot.style.cssText = `
        position: absolute;
        width: 4px;
        height: 4px;
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
        // Create audio nodes
        const gainNode = window.audioContext.createGain();
        
        // Create a noise source for non-tonal sound that contrasts with interval sounds
        const bufferSize = window.audioContext.sampleRate * 0.4; // 0.4 second buffer
        const noiseBuffer = window.audioContext.createBuffer(1, bufferSize, window.audioContext.sampleRate);
        const output = noiseBuffer.getChannelData(0);
        
        // Fill with noise but shape it for an explosive character
        for (let i = 0; i < bufferSize; i++) {
            // Create a decay curve for the noise amplitude
            const decay = 1.0 - (i / bufferSize);
            // Sharper attack at the beginning
            const envelope = i < 2000 ? Math.min(1.0, i / 2000) * decay * decay : decay * decay;
            // Add randomness but with some spectral shaping
            output[i] = (Math.random() * 2 - 1) * envelope;
        }
        
        // Create noise source
        const noiseSource = window.audioContext.createBufferSource();
        noiseSource.buffer = noiseBuffer;
        
        // Create a bandpass filter to shape the noise into a "whoosh" sound
        const bandpass = window.audioContext.createBiquadFilter();
        bandpass.type = 'bandpass';
        bandpass.frequency.value = 1600; // Mid-high frequency focus
        bandpass.Q.value = 0.8; // Wider bandwidth
        
        // Create a highpass filter to remove low rumble
        const highpass = window.audioContext.createBiquadFilter();
        highpass.type = 'highpass';
        highpass.frequency.value = 600;
        
        // Create a small reverb-like effect for a more "explosive" character
        const delay = window.audioContext.createDelay(0.1);
        delay.delayTime.value = 0.04;
        
        const delayGain = window.audioContext.createGain();
        delayGain.gain.value = 0.15;
        
        // Connect the chain
        noiseSource.connect(bandpass);
        bandpass.connect(highpass);
        
        // Main signal path
        highpass.connect(gainNode);
        
        // Delay path for reverb effect
        highpass.connect(delay);
        delay.connect(delayGain);
        delayGain.connect(gainNode);
        
        gainNode.connect(window.audioContext.destination);
        
        // Set gain envelope with a sharp attack
        const now = window.audioContext.currentTime;
        gainNode.gain.setValueAtTime(0.01, now);
        gainNode.gain.exponentialRampToValueAtTime(0.6, now + 0.03); // Very sharp attack
        gainNode.gain.exponentialRampToValueAtTime(0.01, now + 0.4); // Longer decay
        
        // Play the sound
        noiseSource.start();
        noiseSource.stop(now + 0.5);
        
        // Clean up resources
        setTimeout(() => {
            try {
                noiseSource.disconnect();
                bandpass.disconnect();
                highpass.disconnect();
                delay.disconnect();
                delayGain.disconnect();
                gainNode.disconnect();
            } catch (e) {
                // Ignore errors if nodes are already disconnected
            }
        }, 600);
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
    
    // Get abbreviated interval names for mobile
    const leftIntervalName = isLeftCorrect ? correctInterval : incorrectInterval;
    const rightIntervalName = isLeftCorrect ? incorrectInterval : correctInterval;
    
    // Use abbreviated interval names for mobile
    const leftIntervalDisplay = getAbbreviatedInterval(leftIntervalName);
    const rightIntervalDisplay = getAbbreviatedInterval(rightIntervalName);
    
    // Detect if mobile
    const isMobile = document.body.classList.contains('mobile-device');
    
    if (isMobile) {
        // For mobile: show intervals on attack buttons instead of on-screen
        const leftAttackBtn = document.getElementById('left-attack');
        const rightAttackBtn = document.getElementById('right-attack');
        
        if (leftAttackBtn && rightAttackBtn) {
            // Update the attack buttons with interval names - without LEFT/RIGHT labels
            leftAttackBtn.innerHTML = `<span>${direction} ${leftIntervalDisplay}</span>`;
            rightAttackBtn.innerHTML = `<span>${direction} ${rightIntervalDisplay}</span>`;
            
            // Store interval data on buttons for hit detection
            leftAttackBtn.dataset.interval = leftIntervalName;
            rightAttackBtn.dataset.interval = rightIntervalName;
            leftAttackBtn.dataset.correct = leftOption.dataset.correct;
            rightAttackBtn.dataset.correct = rightOption.dataset.correct;
            
            // Hide the interval option boxes since we're showing on buttons
            leftOption.style.display = 'none';
            rightOption.style.display = 'none';
        } else {
            // Fallback if buttons not found: show compact format
            leftOption.innerHTML = `<div class="interval-compact">${direction}&nbsp;&nbsp;${leftIntervalDisplay}</div>`;
            rightOption.innerHTML = `<div class="interval-compact">${direction}&nbsp;&nbsp;${rightIntervalDisplay}</div>`;
            leftOption.style.display = 'block';
            rightOption.style.display = 'block';
        }
    } else {
        // For desktop: standard format with labels
        const leftLabel = "LEFT CLICK";
        const rightLabel = "RIGHT CLICK";
        
        // Add direction indicator to interval names
        const leftIntervalWithDirection = `<div class="direction-arrow">${direction}</div><div class="interval-text">${leftIntervalDisplay}</div>`;
        const rightIntervalWithDirection = `<div class="direction-arrow">${direction}</div><div class="interval-text">${rightIntervalDisplay}</div>`;
        
        // Update content
        leftOption.innerHTML = `<span style="display:block;font-size:18px;opacity:0.9;margin-bottom:10px">${leftLabel}</span>${leftIntervalWithDirection}`;
        rightOption.innerHTML = `<span style="display:block;font-size:18px;opacity:0.9;margin-bottom:10px">${rightLabel}</span>${rightIntervalWithDirection}`;
        
        // Show the options
        leftOption.style.display = 'block';
        rightOption.style.display = 'block';
    }
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
    
    // Style container - moved to top right
    healthDisplay.style.cssText = `
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
        display: none; /* Initially hidden until game starts */
        text-align: right;
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
        text-align: left;
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
    
    // Safety check for game state
    if (window.gameState.gameOver) {
        // If game is over, don't update the score
        return score;
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
    
    // Check if we're in mobile mode
    const isMobile = isMobileDevice();
    
    if (isMobile) {
        // Mobile-specific level selection UI - cleaner and more compact
        const categories = [
            { title: "Basics", startLevel: 1, endLevel: 10, color: "#00ffff" },
            { title: "Advanced", startLevel: 11, endLevel: 20, color: "#ff00ff" },
            { title: "Challenge", startLevel: 21, endLevel: 30, color: "#ffaa00" }
        ];
        
        // Create a single description area that will show the selected level info
        const levelInfoDisplay = document.createElement('div');
        levelInfoDisplay.classList.add('level-description');
        levelInfoDisplay.classList.add('visible');
        levelInfoDisplay.id = 'mobile-level-info';
        
        // Default to level 1 description
        if (window.intervalLevels && window.intervalLevels[1]) {
            const levelInfo = window.intervalLevels[1];
            const intervals = levelInfo.intervals.join(', ');
            const directionSymbol = levelInfo.direction === "ascending" ? "↑" : 
                                   levelInfo.direction === "descending" ? "↓" : "↕";
            levelInfoDisplay.textContent = `Level 1: ${directionSymbol} intervals - ${intervals}`;
        } else {
            levelInfoDisplay.textContent = "Select a level to see details";
        }
        
        // Add the info display at the top so it's visible while scrolling
        levelContainer.appendChild(levelInfoDisplay);
        
        categories.forEach((category, idx) => {
            // Create category section
            const categorySection = document.createElement('div');
            categorySection.classList.add('category-section');
            
            // Create category header with toggle button
            const categoryHeader = document.createElement('div');
            categoryHeader.classList.add('category-header');
            
            // Create category heading
            const categoryHeading = document.createElement('h3');
            categoryHeading.textContent = category.title;
            categoryHeading.style.cssText = `
                color: ${category.color};
                margin: 0;
                text-shadow: 0 0 5px ${category.color};
            `;
            
            // Create toggle button
            const toggleButton = document.createElement('button');
            toggleButton.classList.add('category-toggle');
            toggleButton.textContent = idx === 0 ? '−' : '+'; // First category expanded by default
            toggleButton.setAttribute('aria-label', 'Toggle category');
            
            // Add heading and toggle to header
            categoryHeader.appendChild(categoryHeading);
            categoryHeader.appendChild(toggleButton);
            
            // Add header to section
            categorySection.appendChild(categoryHeader);
            
            // Create content container
            const categoryContent = document.createElement('div');
            categoryContent.classList.add('category-content');
            categoryContent.style.display = idx === 0 ? 'block' : 'none'; // First category expanded by default
            
            // Create grid for this category's levels
            const levelGrid = document.createElement('div');
            levelGrid.classList.add('level-grid');
            
            // Add level buttons for this category
            for (let level = category.startLevel; level <= category.endLevel; level++) {
                // Check if level is defined
                if (!window.intervalLevels || !window.intervalLevels[level]) {
                    console.error(`Level ${level} not defined`);
                    continue;
                }
                
                // Create the level button - just numbers for mobile
                const levelButton = document.createElement('button');
                levelButton.textContent = level;
                levelButton.dataset.level = level;
                levelButton.classList.add('level-button');
                
                // Make level 1 active by default
                if (level === 1) {
                    levelButton.classList.add('active');
                }
                
                // Add click handler
                levelButton.addEventListener('click', function() {
                    // Try to unlock audio on mobile
    if (isMobileDevice()) {
                        try {
                            forceAudioUnlock();
                        } catch (e) {
                            console.warn("Audio unlock attempt failed:", e);
                        }
                    }
                    
                    // Remove active class from all buttons
                    document.querySelectorAll('.level-button').forEach(btn => {
                        btn.classList.remove('active');
                    });
                    
                    // Add active class to selected button
                    this.classList.add('active');
                    
                    // Update selected level
                    const selectedLevel = parseInt(this.dataset.level);
                    window.gameState.selectedLevel = selectedLevel;
                    console.log("Selected level: " + selectedLevel);
                    
                    // Update the level info display
                    if (window.intervalLevels && window.intervalLevels[selectedLevel]) {
                        const levelInfo = window.intervalLevels[selectedLevel];
                        const intervals = levelInfo.intervals.join(', ');
                        const directionSymbol = levelInfo.direction === "ascending" ? "↑" : 
                                              levelInfo.direction === "descending" ? "↓" : "↕";
                        levelInfoDisplay.textContent = `Level ${selectedLevel}: ${directionSymbol} intervals - ${intervals}`;
                    }
                });
                
                levelGrid.appendChild(levelButton);
            }
            
            categoryContent.appendChild(levelGrid);
            categorySection.appendChild(categoryContent);
            
            // Add toggle functionality
            toggleButton.addEventListener('click', function() {
                if (categoryContent.style.display === 'none') {
                    categoryContent.style.display = 'block';
                    this.textContent = '−';
                } else {
                    categoryContent.style.display = 'none';
                    this.textContent = '+';
                }
            });
            
            // Add the complete category section to the container
            levelContainer.appendChild(categorySection);
        });
    } else {
        // Desktop-specific level selection UI (existing layout)
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
                // Check if level is defined
                if (!window.intervalLevels || !window.intervalLevels[level]) {
                    console.error(`Level ${level} not defined`);
                    continue;
                }
                
                // Create the level button
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
                
                // Add click handler with audio unlock attempt
                levelButton.addEventListener('click', function() {
                    // Try to unlock audio on mobile - each user interaction is a chance to unlock
    if (isMobileDevice()) {
                        console.log("Level button clicked, attempting audio unlock");
                        try {
                            // Force audio unlock with each level click
                            forceAudioUnlock();
                            
                            // On iOS, try to play a silent sound to help with unlocking
                            if (/iPhone|iPad|iPod/.test(navigator.userAgent)) {
                                const audioContext = window.audioContext || new (window.AudioContext || window.webkitAudioContext)();
                                const oscillator = audioContext.createOscillator();
                                const gainNode = audioContext.createGain();
                                gainNode.gain.value = 0.01; // Nearly silent
                                oscillator.connect(gainNode);
                                gainNode.connect(audioContext.destination);
                                oscillator.start(0);
                                oscillator.stop(0.1); // Very short sound
                            }
                        } catch (e) {
                            console.warn("Audio unlock attempt from level button failed:", e);
                        }
                    }
                    
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
        
        // Create level description element for desktop
        const levelDescription = document.createElement('p');
        levelDescription.id = 'level-description';
        levelDescription.style.fontSize = '14px';
        levelDescription.style.margin = '10px 0';
        
        // Set initial level description
        updateLevelDescription(1);
        
        levelContainer.appendChild(levelDescription);
    }
    
    // Insert level selection before start button
    instructions.insertBefore(levelContainer, document.getElementById('start-button'));
    
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
    
    // Hide crosshair when leaving gameplay
    hideCrosshair();
    
    // Reset any ongoing timers or intervals
    if (window.gameTimerInterval) {
        clearInterval(window.gameTimerInterval);
        window.gameTimerInterval = null;
    }
    
    // Properly stop background music
    if (window.backgroundMusicElement) { window.backgroundMusicElement.pause(); window.backgroundMusicElement.currentTime = 0; window.gameState.backgroundMusicPlaying = false; }
    
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
    
    // Clear existing game elements
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
        // Force unlock pointer controls
        if (document.pointerLockElement || document.mozPointerLockElement || document.webkitPointerLockElement) {
            console.log("Explicitly releasing pointer lock for main menu");
            window.controls.unlock();
            
            // As a fallback, try to directly exit pointer lock through the document API
            if (document.exitPointerLock) {
                document.exitPointerLock();
            } else if (document.mozExitPointerLock) {
                document.mozExitPointerLock();
            } else if (document.webkitExitPointerLock) {
                document.webkitExitPointerLock();
            }
        }
    }
    
    // Double-check that pointer lock is released after a short delay
            setTimeout(() => {
        if (document.pointerLockElement || document.mozPointerLockElement || document.webkitPointerLockElement) {
            console.log("Pointer still locked after delay, forcing exit again");
            if (document.exitPointerLock) {
                document.exitPointerLock();
            } else if (document.mozExitPointerLock) {
                document.mozExitPointerLock();
            } else if (document.webkitExitPointerLock) {
                document.webkitExitPointerLock();
            }
        }
        
        // Hide loading animation if it's visible
        hideLoadingAnimation();
    }, 100);
    
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
        
        // Handle controls differently for mobile vs desktop
        if (isMobileDevice()) {
            // On mobile, we don't use pointer lock API the same way
            // Just set our internal locked state to false
            if (window.controls) {
                window.controls.isLocked = false;
            }
        } else {
            // On desktop, unlock pointer to allow menu interaction
            if (window.controls && window.controls.isLocked) {
                window.controls.unlock();
            }
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
        
        // Handle controls differently for mobile vs desktop
        if (isMobileDevice()) {
            // On mobile, just set our internal locked state back to true
            if (window.controls) {
                window.controls.isLocked = true;
            }
        } else {
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
        uiContainer.style.zIndex = '5';
        uiContainer.style.position = 'absolute';
    }
    
    // Ensure mobile controls are above the canvas but below menus
    const mobileControls = document.getElementById('mobile-controls');
    if (mobileControls) {
        mobileControls.style.zIndex = '10';
    }
    
    // Attack buttons should be just above the mobile controls
    const attackButtons = document.getElementById('attack-buttons');
    if (attackButtons) {
        attackButtons.style.zIndex = '4'; // Changed from 15 to 4 to be below the menu (1500)
    }
    
    // Also ensure attack-container has the correct z-index
    const attackContainer = document.getElementById('attack-container');
    if (attackContainer) {
        attackContainer.style.zIndex = '4'; // Changed from 15 to 4 to match
    }
    
    // Ensure crosshair is above controls but below menus
    if (window.crosshair) {
        window.crosshair.style.zIndex = '15';
    }
    
    // Interval options during gameplay
    const intervalOptions = document.querySelectorAll('.interval-option');
    intervalOptions.forEach(option => {
        option.style.zIndex = '1400';
    });
    
    // UI elements like the crosshair, health display, etc.
    const gameOverlays = document.querySelectorAll('.game-overlay');
    gameOverlays.forEach(overlay => {
        overlay.style.zIndex = '1000';
    });
    
    // Ensure instructions is visible above mobile controls
    const instructions = document.getElementById('instructions');
    if (instructions) {
        instructions.style.zIndex = '1500';
    }
    
    // Countdown timer should be above instructions
    const countdownTimer = document.getElementById('countdown-timer');
    if (countdownTimer) {
        countdownTimer.style.zIndex = '2000';
    }
    
    // Ensure pause menu is highest except for loading screen
    const pauseMenu = document.getElementById('pause-menu');
    if (pauseMenu) {
        pauseMenu.style.zIndex = '2500';
    }
    
    // Loading container should be at the very top
    const loadingContainer = document.getElementById('loading-container');
    if (loadingContainer) {
        loadingContainer.style.zIndex = '3000';
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

// Handle goal reached (victory)
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
    const missedProjectilesPenalty = (window.gameState.missedProjectiles || 0) * 100;
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
        min-width: 300px; max-width: 90%; max-height: 90vh; overflow-y: auto;
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
            
            // Show loading animation immediately
            showLoadingAnimation();
            
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
            console.log("Main menu button clicked from victory screen");
            
            // Show loading animation immediately
            showLoadingAnimation();
            
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

// New function to force audio unlock
function forceAudioUnlock() {
    console.log("Force unlocking audio with direct user interaction");
    
    // Create audio context if it doesn't exist
    if (!window.audioContext) {
        try {
            window.audioContext = new (window.AudioContext || window.webkitAudioContext)();
            console.log("Created new audio context during forced unlock");
        } catch (e) {
            console.error("Failed to create audio context for unlock:", e);
        }
    }
    
    // Resume audio context if it's suspended - with multiple attempts
    if (window.audioContext && window.audioContext.state === 'suspended') {
        // First attempt with standard resume
        window.audioContext.resume()
            .then(() => console.log("Audio context resumed during forced unlock"))
            .catch(err => console.error("Failed to resume audio context:", err));
        
        // Second attempt with timeout
        setTimeout(() => {
            if (window.audioContext.state === 'suspended') {
                window.audioContext.resume()
                    .then(() => console.log("Audio context resumed on second attempt"))
                    .catch(err => console.warn("Second resume attempt failed:", err));
            }
        }, 100);
    }
    
    // Device-specific optimizations
    const isIOS = /iPhone|iPad|iPod/.test(navigator.userAgent);
    const isAndroid = /Android/.test(navigator.userAgent);
    
    // Create and play a short silent sound (crucial for both iOS and Android)
    try {
        // Create a silent buffer
        const buffer = window.audioContext.createBuffer(1, 1, 22050);
        const source = window.audioContext.createBufferSource();
        source.buffer = buffer;
        source.connect(window.audioContext.destination);
        source.start(0);
        console.log("Silent buffer played to unlock audio");
        
        // Also create a second source with a slight delay
        setTimeout(() => {
            try {
                const buffer2 = window.audioContext.createBuffer(1, 1, 22050);
                const source2 = window.audioContext.createBufferSource();
                source2.buffer = buffer2;
                source2.connect(window.audioContext.destination);
                source2.start(0);
                console.log("Second silent buffer played for mobile");
            } catch (e) {
                console.warn("Failed to play second silent buffer:", e);
            }
        }, 50); // Reduced from 200ms to 50ms for faster initialization
        
        // For Android, add an oscillator to fully activate audio
        if (isAndroid) {
            try {
                // Create a very short beep at low volume (inaudible)
                const oscillator = window.audioContext.createOscillator();
                const gainNode = window.audioContext.createGain();
                oscillator.type = 'sine';
                oscillator.frequency.value = 440;
                gainNode.gain.value = 0.01; // Very quiet
                oscillator.connect(gainNode);
                gainNode.connect(window.audioContext.destination);
                oscillator.start();
                setTimeout(() => {
                    oscillator.stop();
                    oscillator.disconnect();
                    gainNode.disconnect();
                }, 5); // Just 5ms is enough to kickstart the audio system
                console.log("Android audio system fully activated");
            } catch (e) {
                console.warn("Failed to create oscillator for Android:", e);
            }
        }
    } catch (e) {
        console.error("Failed to play silent buffer:", e);
    }
    
    // Also try using an HTMLAudioElement for iOS (belt and suspenders approach)
    try {
        const silentAudio = document.createElement('audio');
        silentAudio.src = 'data:audio/mp3;base64,SUQzBAAAAAAAI1RTU0UAAAAPAAADTGF2ZjU4LjI5LjEwMAAAAAAAAAAAAAAA//tQwAAAAAAAAAAAAAAAAAAAAAAASW5mbwAAAA8AAAABAAADQgD///////////////////////////////////////////////8AAAA5TEFNRTMuMTAwAaUAAAAALAAAACQAAANCAAABggAA/f/rAwv/+5/+8/9NcAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAE1UYWdzAAAAHAAAADEAA//+TE1UVDIwMjEwMTAzADAwMDAwMDAwAA==';  // 0.1s empty MP3
        silentAudio.setAttribute('playsinline', '');
        silentAudio.setAttribute('webkit-playsinline', '');
        silentAudio.volume = 0.001;
        silentAudio.play().catch(e => console.warn("Silent HTML5 audio playback failed:", e));
    } catch (e) {
        console.warn("Failed to create silent HTML5 audio:", e);
    }
    
    // If we have a background music element, pre-warm it for faster playback later
    if (window.backgroundMusicElement) {
        try {
            // Set key attributes that help with mobile playback
            window.backgroundMusicElement.muted = false;
            window.backgroundMusicElement.volume = window.config ? window.config.backgroundMusicVolume : 0.5;
            window.backgroundMusicElement.setAttribute('playsinline', '');
            window.backgroundMusicElement.setAttribute('webkit-playsinline', '');
            
            // For Android, actually load the audio buffer
            if (isAndroid) {
                window.backgroundMusicElement.load();
            }
        } catch (e) {
            console.warn("Failed to prepare background music element:", e);
        }
    }
    
    window.audioUnlockAttempted = true;
}

// Force mobile mode for testing
function forceMobileMode() {
    console.log("Forcing mobile mode");
    document.body.classList.add('mobile-device');
    mobileControls.style.display = 'block';
    document.querySelector('.desktop-controls').style.display = 'none';
    document.querySelector('.mobile-controls-info').style.display = 'block';
    
    // Update instruction UI for mobile
    const toggleContainer = document.getElementById('toggle-mobile-container');
    if (toggleContainer) {
        toggleContainer.style.display = 'block';
    }
    
    // Show mobile-only elements
    const mobileOnlyElements = document.querySelectorAll('.mobile-only');
    mobileOnlyElements.forEach(el => {
        el.style.display = 'block';
    });
    
    document.querySelector('#left-option span').textContent = 'LEFT TAP';
    document.querySelector('#right-option span').textContent = 'RIGHT TAP';
    
    // Add mobile indicator
    if (!document.getElementById('mobile-indicator')) {
        const mobileIndicator = document.createElement('div');
        mobileIndicator.id = 'mobile-indicator';
        mobileIndicator.style.position = 'fixed';
        mobileIndicator.style.top = '10px';
        mobileIndicator.style.right = '10px';
        mobileIndicator.style.background = 'rgba(255,0,255,0.8)';
        mobileIndicator.style.color = 'white';
        mobileIndicator.style.padding = '5px 10px';
        mobileIndicator.style.borderRadius = '5px';
        mobileIndicator.style.zIndex = '10000';
        mobileIndicator.style.fontSize = '12px';
        mobileIndicator.textContent = 'Mobile Mode Active';
        document.body.appendChild(mobileIndicator);
    }
}

// Force desktop mode
function forceDesktopMode() {
    console.log("Forcing desktop mode");
    document.body.classList.remove('mobile-device');
    mobileControls.style.display = 'none';
    document.querySelector('.desktop-controls').style.display = 'block';
    document.querySelector('.mobile-controls-info').style.display = 'none';
    
    // Hide toggle button in desktop mode
    const toggleContainer = document.getElementById('toggle-mobile-container');
    if (toggleContainer) {
        toggleContainer.style.display = 'none';
    }
    
    // Hide mobile-only elements
    const mobileOnlyElements = document.querySelectorAll('.mobile-only');
    mobileOnlyElements.forEach(el => {
        el.style.display = 'none';
    });
    
    document.querySelector('#left-option span').textContent = 'LEFT CLICK';
    document.querySelector('#right-option span').textContent = 'RIGHT CLICK';
    
    // Remove mobile indicator if exists
    const mobileIndicator = document.getElementById('mobile-indicator');
    if (mobileIndicator) {
        mobileIndicator.remove();
    }
}

// Add function to handle mobile UI detail toggles
function setupMobileDetailToggles() {
    const detailToggles = document.querySelectorAll('.detail-toggle');
    
    detailToggles.forEach(toggle => {
        toggle.addEventListener('click', function() {
            // Find the next element (the details container)
            const detailsContainer = this.nextElementSibling;
            
            // Toggle visibility
            if (detailsContainer.classList.contains('visible')) {
                detailsContainer.classList.remove('visible');
                this.textContent = this.textContent.replace('▲', '▼');
            } else {
                detailsContainer.classList.add('visible');
                this.textContent = this.textContent.replace('▼', '▲');
            }
        });
    });
}

// Convert interval names to abbreviated form for mobile
function getAbbreviatedInterval(intervalName) {
    // Check if we're on mobile
    const isMobile = document.body.classList.contains('mobile-device');
    
    // Return the full name if not on mobile
    if (!isMobile) return intervalName;
    
    // Convert to abbreviation for mobile
    if (intervalName === "Minor 2nd") return "m2";
    if (intervalName === "Major 2nd") return "M2";
    if (intervalName === "Minor 3rd") return "m3";
    if (intervalName === "Major 3rd") return "M3";
    if (intervalName === "Perfect 4th") return "P4";
    if (intervalName === "Perfect 5th") return "P5";
    if (intervalName === "Tritone") return "TT";
    if (intervalName === "Minor 6th") return "m6";
    if (intervalName === "Major 6th") return "M6";
    if (intervalName === "Minor 7th") return "m7";
    if (intervalName === "Major 7th") return "M7";
    if (intervalName === "Octave") return "P8";
    
    // Return the original if no match (fallback)
    return intervalName;
}// Audio buffer pool for mobile optimization - sound effects only, intervals preserved
window.audioBufferPool = {
    explosionBuffers: [],
    successBuffers: [],
    errorBuffers: [],
    initialized: false
};

// Initialize audio buffer pool for sound effects
function initAudioBufferPool() {
    if (!window.audioBufferPool || window.audioBufferPool.initialized) return;
    
    console.log("Initializing audio buffer pool for sound effects...");
    
    // Only initialize on mobile devices for performance optimization
    if (!isMobileDevice()) {
        console.log("Skipping buffer pool on desktop - using real-time generation");
        return;
    }
    
    // Wait for audio context to be available
    const initBuffers = () => {
        if (!window.audioContext) return;
        
        try {
            // Pre-generate explosion sound buffers (3 variations)
            for (let i = 0; i < 3; i++) {
                const buffer = createExplosionSoundBuffer();
                if (buffer) window.audioBufferPool.explosionBuffers.push(buffer);
            }
            
            // Pre-generate success sound buffers (2 variations)
            for (let i = 0; i < 2; i++) {
                const buffer = createSuccessSoundBuffer();
                if (buffer) window.audioBufferPool.successBuffers.push(buffer);
            }
            
            // Pre-generate error sound buffers (2 variations)
            for (let i = 0; i < 2; i++) {
                const buffer = createErrorSoundBuffer();
                if (buffer) window.audioBufferPool.errorBuffers.push(buffer);
            }
            
            window.audioBufferPool.initialized = true;
            console.log("Audio buffer pool initialized successfully with", 
                       window.audioBufferPool.explosionBuffers.length, "explosion buffers,",
                       window.audioBufferPool.successBuffers.length, "success buffers,",
                       window.audioBufferPool.errorBuffers.length, "error buffers");
        } catch (error) {
            console.error("Error initializing audio buffer pool:", error);
        }
    };
    
    // Try to initialize buffers with delay
        if (window.audioContext) {
        setTimeout(initBuffers, 500);
    } else {
        const checkAudioContext = setInterval(() => {
            if (window.audioContext) {
                clearInterval(checkAudioContext);
                setTimeout(initBuffers, 500);
            }
        }, 100);
    }
}

// Create pre-generated explosion sound buffer
function createExplosionSoundBuffer() {
    try {
        if (!window.audioContext) return null;
        
        const sampleRate = window.audioContext.sampleRate;
        const duration = 0.6;
        const buffer = window.audioContext.createBuffer(1, sampleRate * duration, sampleRate);
        const data = buffer.getChannelData(0);
        
        // Generate explosion sound with slight variation
        const variation = Math.random() * 0.3 + 0.85;
        
        for (let i = 0; i < data.length; i++) {
            const t = i / sampleRate;
            const frequency = 120 * Math.exp(-t * 3) * variation;
            const amplitude = Math.exp(-t * 2.5) * 0.1;
            data[i] = amplitude * (Math.random() * 2 - 1) * Math.sin(2 * Math.PI * frequency * t);
        }
        
        return buffer;
    } catch (error) {
        console.error("Error creating explosion buffer:", error);
        return null;
    }
}

// Create pre-generated success sound buffer
function createSuccessSoundBuffer() {
    try {
        if (!window.audioContext) return null;
        
        const sampleRate = window.audioContext.sampleRate;
        const duration = 0.5;
        const buffer = window.audioContext.createBuffer(1, sampleRate * duration, sampleRate);
        const data = buffer.getChannelData(0);
        
        // Success sound: ascending notes C5, E5, G5
        const frequencies = [523, 659, 784];
        const noteDuration = duration / frequencies.length;
        
        for (let i = 0; i < data.length; i++) {
            const t = i / sampleRate;
            const noteIndex = Math.floor(t / noteDuration);
            const noteTime = t - (noteIndex * noteDuration);
            
            if (noteIndex < frequencies.length) {
                const envelope = Math.exp(-noteTime * 8);
                const frequency = frequencies[noteIndex];
                data[i] = envelope * 0.1 * Math.sin(2 * Math.PI * frequency * noteTime);
            }
        }
        
        return buffer;
    } catch (error) {
        console.error("Error creating success buffer:", error);
        return null;
    }
}

// Create pre-generated error sound buffer
function createErrorSoundBuffer() {
    try {
        if (!window.audioContext) return null;
        
        const sampleRate = window.audioContext.sampleRate;
        const duration = 0.3;
        const buffer = window.audioContext.createBuffer(1, sampleRate * duration, sampleRate);
        const data = buffer.getChannelData(0);
        
        // Error sound: descending buzz
        for (let i = 0; i < data.length; i++) {
            const t = i / sampleRate;
            const envelope = Math.exp(-t * 5);
            const frequency = 200 * (1 - t * 0.7);
            const buzz = Math.sin(2 * Math.PI * frequency * t) + 0.3 * Math.sin(2 * Math.PI * frequency * 3 * t);
            data[i] = envelope * 0.1 * buzz;
        }
        
        return buffer;
    } catch (error) {
        console.error("Error creating error buffer:", error);
        return null;
    }
}

// Play sound from buffer pool with fallback to real-time generation
function playBufferedSound(bufferArray, volume = 0.1, fallbackFunction = null) {
    if (!window.audioContext) return false;
    
    // Try to use buffer pool first (mobile optimization)
    if (isMobileDevice() && bufferArray && bufferArray.length > 0) {
        try {
            const buffer = bufferArray[Math.floor(Math.random() * bufferArray.length)];
            const source = window.audioContext.createBufferSource();
            const gain = window.audioContext.createGain();
            
            source.buffer = buffer;
            source.connect(gain);
            gain.connect(window.audioContext.destination);
            
            gain.gain.value = volume;
            source.start();
            
            source.onended = () => {
                try {
                    source.disconnect();
                    gain.disconnect();
                } catch (e) {
                    // Ignore cleanup errors
                }
            };
            
            return true;
        } catch (error) {
            console.error("Error playing buffered sound:", error);
        }
    }
    
    // Fallback to real-time generation (desktop or if buffer pool failed)
    if (fallbackFunction && typeof fallbackFunction === "function") {
        try {
            fallbackFunction();
            return true;
        } catch (error) {
            console.error("Error with fallback sound function:", error);
        }
    }
    
    return false;
} 
// Function to show crosshair (only during gameplay)
function showCrosshair() {
    if (window.crosshair) {
        window.crosshair.style.display = "flex";
        console.log("Crosshair shown for gameplay");
    } else {
        console.warn("Crosshair not found - cannot show");
    }
}

// Function to hide crosshair (during menus/overlays)
function hideCrosshair() {
    if (window.crosshair) {
        window.crosshair.style.display = "none";
        console.log("Crosshair hidden");
    } else {
        console.warn("Crosshair not found - cannot hide");
    }
}
