// Real-time Object Detection with Roboflow
(function() {
  'use strict';

  // ========================================
  // ROBOFLOW CONFIGURATION
  // ========================================
  const ROBOFLOW_CONFIG = {
    apiKey: 'MvAPSE6lMWD1bxEBRpJZ',
    workspaceId: 'objdetection-dtu2z',
    modelId: 'trial-sjo4y',
    version: '1',
    confidenceThreshold: 40, // 40% minimum confidence
    overlapThreshold: 30,
    maxObjects: 20,
    fps: 4, // Detection frames per second
    apiBase: 'https://detect.roboflow.com' // Hosted API base
  };

  const OBJECT_COLORS = {
    'people': '#FF0000',
    'person': '#FF0000',
    'stairs': '#FFA500',
    'stair': '#FFA500',
    'door': '#00FF00',
    'vehicle': '#0000FF', 
    'car': '#0000FF',
    'default': '#00FFFF'
  };

  const OBJECT_PRIORITY = {
    'stairs': 3,
    'stair': 3,
    'people': 2,
    'person': 2,
    'door': 1
  };

  const videoPreview = document.getElementById('videoPreview');
  const previewContainer = document.querySelector('.image-preview-container');
  
  const canvas = document.createElement('canvas');
  canvas.style.position = 'absolute';
  canvas.style.top = '0';
  canvas.style.left = '0';
  canvas.style.pointerEvents = 'none';
  canvas.style.zIndex = '10';
  
  let ctx = null;
  let isDetecting = false;
  let detectionInterval = null;
  let model = null;
  let lastAnnouncement = 0;
  let lastDetectedObjects = new Set();

  async function initializeRoboflow() {
    try {
      console.log('Roboflow Serverless API ready');
      model = { ready: true };
      return true;
    } catch (error) {
      console.error('Error initializing Roboflow:', error);
      showError('Failed to initialize detection system');
      return false;
    }
  }

  function setupCanvas() {
    if (!previewContainer.contains(canvas)) {
      previewContainer.appendChild(canvas);
    }
    const rect = videoPreview.getBoundingClientRect();
    canvas.width = videoPreview.videoWidth || rect.width;
    canvas.height = videoPreview.videoHeight || rect.height;
    canvas.style.width = rect.width + 'px';
    canvas.style.height = rect.height + 'px';
    ctx = canvas.getContext('2d');
  }

  async function startDetection() {
    if (isDetecting) return;
    if (!model || !model.ready) {
      const initialized = await initializeRoboflow();
      if (!initialized) return;
    }
    isDetecting = true;
    setupCanvas();
    const detectionDelay = 1000 / ROBOFLOW_CONFIG.fps;
    
    const runDetection = async () => {
      if (!isDetecting || !videoPreview.srcObject) return;
      try {
        await detectObjects();
      } catch (error) {
        console.error('Detection error:', error);
      }
      detectionInterval = setTimeout(runDetection, detectionDelay);
    };
    runDetection();
  }

  function stopDetection() {
    isDetecting = false;
    if (detectionInterval) {
      clearTimeout(detectionInterval);
      detectionInterval = null;
    }
    if (ctx) ctx.clearRect(0, 0, canvas.width, canvas.height);
    lastDetectedObjects.clear();
  }

  // ========================================
  // UPDATED: DETECT OBJECTS (FIXED API CALL)
  // ========================================
  async function detectObjects() {
    if (!videoPreview || !videoPreview.videoWidth) return;

    try {
      // 1) Get RAW base64 string (no prefix)
      const base64Data = await captureVideoFrameAsBase64();
      if (!base64Data) return;

      // 2) Build API URL with params
      const params = new URLSearchParams({
        api_key: ROBOFLOW_CONFIG.apiKey,
        confidence: ROBOFLOW_CONFIG.confidenceThreshold / 100
      });
      
      const apiUrl = `${ROBOFLOW_CONFIG.apiBase}/${ROBOFLOW_CONFIG.modelId}/${ROBOFLOW_CONFIG.version}?${params.toString()}`;

      // 3) POST request to Roboflow
      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded'
        },
        body: base64Data
      });

      if (!response.ok) throw new Error(`API Error: ${response.status}`);

      const data = await response.json();
      const predictions = data.predictions || [];

      drawDetections(predictions);
      announceDetections(predictions);

    } catch (error) {
      console.error('Error during detection:', error);
    }
  }

  // Helper: Captures frame and removes "data:image/jpeg;base64,"
  async function captureVideoFrameAsBase64() {
    try {
      const tempCanvas = document.createElement('canvas');
      tempCanvas.width = videoPreview.videoWidth;
      tempCanvas.height = videoPreview.videoHeight;
      const tempCtx = tempCanvas.getContext('2d');
      tempCtx.drawImage(videoPreview, 0, 0);
      
      const dataUrl = tempCanvas.toDataURL('image/jpeg', 0.8);
      return dataUrl.split(',')[1]; // Return only the raw base64
    } catch (err) {
      return null;
    }
  }

  function drawDetections(predictions) {
    if (!ctx) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    if (!predictions.length) return;

    const scaleX = canvas.width / videoPreview.videoWidth;
    const scaleY = canvas.height / videoPreview.videoHeight;

    predictions.forEach(prediction => {
      const label = prediction.class.toLowerCase();
      const color = OBJECT_COLORS[label] || OBJECT_COLORS['default'];
      const x = (prediction.x - prediction.width / 2) * scaleX;
      const y = (prediction.y - prediction.height / 2) * scaleY;
      const width = prediction.width * scaleX;
      const height = prediction.height * scaleY;

      ctx.strokeStyle = color;
      ctx.lineWidth = 3;
      ctx.strokeRect(x, y, width, height);

      ctx.fillStyle = color;
      ctx.font = 'bold 16px Arial';
      ctx.fillText(`${prediction.class}`, x, y > 20 ? y - 5 : y + 20);
      
      if (label.includes('stair')) flashBorder(color);
    });
  }

  function announceDetections(predictions) {
    if (!predictions.length) {
      lastDetectedObjects.clear();
      return;
    }
    const now = Date.now();
    if (now - lastAnnouncement < 3000) return;

    const currentObjects = new Set(predictions.map(p => p.class.toLowerCase()));
    const hasNew = Array.from(currentObjects).some(obj => !lastDetectedObjects.has(obj));

    if (!hasNew && lastDetectedObjects.size > 0) return;

    const sorted = Array.from(currentObjects).sort((a, b) => 
      (OBJECT_PRIORITY[b] || 0) - (OBJECT_PRIORITY[a] || 0)
    );

    if (sorted.length > 0) {
      const obj = sorted[0];
      let msg = obj.includes('stair') ? 'Warning! Stairs ahead' : `${obj} detected`;
      speak(msg);
      if (obj.includes('stair')) vibratePhone([200, 100, 200]);
      lastAnnouncement = now;
      lastDetectedObjects = currentObjects;
    }
  }

  function speak(text) {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = 'en-US';
      window.speechSynthesis.speak(utterance);
    }
  }

  function vibratePhone(pattern) {
    if ('vibrate' in navigator) navigator.vibrate(pattern);
  }

  function flashBorder(color) {
    previewContainer.style.border = `4px solid ${color}`;
    setTimeout(() => previewContainer.style.border = '', 300);
  }

  function showError(message) {
    const placeholder = document.getElementById('previewPlaceholder');
    if (placeholder) placeholder.textContent = message;
  }

  document.addEventListener('cameraStarted', () => setTimeout(startDetection, 1000));
  document.addEventListener('cameraStopped', stopDetection);
  videoPreview.addEventListener('loadedmetadata', setupCanvas);
  
  window.addEventListener('resize', () => {
    if (isDetecting) setupCanvas();
  });

  window.objectDetection = { start: startDetection, stop: stopDetection };
})();