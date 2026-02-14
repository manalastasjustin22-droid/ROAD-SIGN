// Camera Control Script - Updated for YOLO AI Streaming
(function() {
  'use strict';

  // Get DOM elements
  const useCameraBtn = document.getElementById('useCameraBtn');
  const stopCameraBtn = document.getElementById('stopCameraBtn');
  const yoloStream = document.getElementById('yoloStream'); // Siguraduhin na pinalitan mo ang <video> ng <img> sa HTML
  const placeholder = document.getElementById('previewPlaceholder');
  const loadingSpinner = document.getElementById('loadingSpinner');

  // Request AI Camera Stream
  function startAICamera() {
    try {
      showLoading(true);
      
      // I-set ang source sa iyong Python Backend
      // Ang Python ang humahawak sa camera hardware, hindi ang browser JS
     // Sa loob ng camera.js
useCameraBtn.addEventListener('click', () => {
    // Gamitin ang Wi-Fi IP mo
    yoloStream.src = "http://192.168.100.41:5000/video_feed"; 
    yoloStream.style.display = "block";
    placeholder.style.display = "none";
});
      yoloStream.onload = function() {
        showLoading(false);
        yoloStream.style.display = 'block';
        placeholder.style.display = 'none';
        
        // Update button states
        useCameraBtn.style.display = 'none';
        stopCameraBtn.style.display = 'inline-flex';
      };

      yoloStream.onerror = function() {
        showLoading(false);
        showError('Cannot connect to AI Server. Make sure app.py is running.');
      };

    } catch (error) {
      console.error('Error connecting to AI stream:', error);
      showError('Failed to connect to backend.');
      showLoading(false);
    }
  }

  // Stop AI Camera
  function stopAICamera() {
    // Putulin ang koneksyon sa stream
    yoloStream.src = "";
    yoloStream.style.display = 'none';
    
    // Reset UI
    placeholder.style.display = 'block';
    placeholder.textContent = 'Click "Use Camera" to start detection';
    placeholder.style.color = '';

    // Update button states
    useCameraBtn.style.display = 'inline-flex';
    stopCameraBtn.style.display = 'none';
    useCameraBtn.disabled = false;
  }

  // Show loading state
  function showLoading(show) {
    if (show) {
      loadingSpinner.style.display = 'flex';
      placeholder.style.display = 'none';
    } else {
      loadingSpinner.style.display = 'none';
    }
  }

  // Show error message
  function showError(message) {
    placeholder.textContent = message;
    placeholder.style.display = 'block';
    placeholder.style.color = '#dc3545';
  }

  // Event Listeners
  useCameraBtn.addEventListener('click', startAICamera);
  stopCameraBtn.addEventListener('click', stopAICamera);

  // Clean up on page unload
  window.addEventListener('beforeunload', stopAICamera);

})();