// Audio buffer pool for mobile optimization - sound effects only, intervals preserved
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