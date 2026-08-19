import React, { useEffect, useRef, useState } from 'react';
import { Camera, VideoOff, RefreshCw, Eye, Sparkles, Activity } from 'lucide-react';
import { calculateHeadPose, calculateEAR, calculateMAR, extractBiometricVector } from '../../utils/faceMath.js';

export default function FaceTracker({ 
  onPoseUpdate, 
  isCameraActive, 
  setIsCameraActive, 
  showMeshOverlay, 
  setShowMeshOverlay,
  demoMode,
  setDemoMode
}) {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const animFrameIdRef = useRef(null);
  const faceMeshRef = useRef(null);
  const cameraUtilsRef = useRef(null);
  const [fps, setFps] = useState(60);
  const [cameraError, setCameraError] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const lastTimeRef = useRef(performance.now());
  const frameCountRef = useRef(0);

  // Synthetic simulation generator for demo mode or fallback
  const demoTimeRef = useRef(0);

  // Setup MediaPipe or Synthetic Fallback Loop
  useEffect(() => {
    let active = true;

    async function initMediaPipe() {
      setIsLoading(true);
      setCameraError(null);

      if (demoMode) {
        setIsLoading(false);
        return;
      }

      try {
        const { FaceMesh } = await import('@mediapipe/face_mesh');
        const { Camera } = await import('@mediapipe/camera_utils');

        if (!active) return;

        const faceMesh = new FaceMesh({
          locateFile: (file) => `https://cdn.jsdelivr.net/npm/@mediapipe/face_mesh/${file}`
        });

        faceMesh.setOptions({
          maxNumFaces: 1,
          refineLandmarks: true,
          minDetectionConfidence: 0.5,
          minTrackingConfidence: 0.5
        });

        faceMesh.onResults(onMediaPipeResults);
        faceMeshRef.current = faceMesh;

        if (videoRef.current && isCameraActive) {
          const camera = new Camera(videoRef.current, {
            onFrame: async () => {
              if (faceMeshRef.current && videoRef.current && isCameraActive && !demoMode) {
                await faceMeshRef.current.send({ image: videoRef.current });
              }
            },
            width: 640,
            height: 480
          });
          camera.start();
          cameraUtilsRef.current = camera;
        }
        setIsLoading(false);
      } catch (err) {
        console.warn("MediaPipe webcam load fallback to demo mode:", err);
        setCameraError("Camera unavailable. Activated Synthetic Demo Mode.");
        setDemoMode(true);
        setIsLoading(false);
      }
    }

    if (!demoMode && isCameraActive) {
      initMediaPipe();
    }

    return () => {
      active = false;
      if (cameraUtilsRef.current) {
        try { cameraUtilsRef.current.stop(); } catch (e) {}
      }
    };
  }, [isCameraActive, demoMode]);

  // Handle MediaPipe Results callback
  const onMediaPipeResults = (results) => {
    // Measure FPS
    const now = performance.now();
    frameCountRef.current++;
    if (now - lastTimeRef.current >= 1000) {
      setFps(frameCountRef.current);
      frameCountRef.current = 0;
      lastTimeRef.current = now;
    }

    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    if (results.multiFaceLandmarks && results.multiFaceLandmarks.length > 0) {
      const landmarks = results.multiFaceLandmarks[0];

      // Calculate math metrics
      const pose = calculateHeadPose(landmarks);
      const ear = calculateEAR(landmarks);
      const mar = calculateMAR(landmarks);
      const biometricVec = extractBiometricVector(landmarks);

      // Draw Sci-Fi HUD face mesh overlay
      if (showMeshOverlay) {
        drawSciFiMesh(ctx, landmarks, canvas.width, canvas.height, ear, mar);
      }

      onPoseUpdate({
        ...pose,
        ear,
        mar,
        landmarks,
        biometricVec,
        fps,
        detected: true
      });
    } else {
      onPoseUpdate({
        pitch: 0, yaw: 0, roll: 0, transX: 0, transY: 0,
        ear: { leftEAR: 0.3, rightEAR: 0.3, avgEAR: 0.3, isBlinking: false },
        mar: { mar: 0, isOpen: false, isSmiling: false },
        landmarks: null,
        biometricVec: null,
        fps,
        detected: false
      });
    }
  };

  // Synthetic Demo Simulation Loop (Smooth Oscillations for interactive testing)
  useEffect(() => {
    let animId;

    if (demoMode) {
      const runDemoLoop = () => {
        demoTimeRef.current += 0.03;
        const t = demoTimeRef.current;

        // Smooth sinusoidal head rotation
        const yaw = Math.sin(t * 0.8) * 32;
        const pitch = Math.cos(t * 0.5) * 18;
        const roll = Math.sin(t * 0.6) * 12;

        // Dynamic expressions
        const blinkCycle = Math.sin(t * 1.5);
        const isBlinking = blinkCycle > 0.92;
        const earVal = isBlinking ? 0.08 : 0.28;

        const mouthCycle = Math.cos(t * 0.4);
        const isMouthOpen = mouthCycle > 0.75;
        const marVal = isMouthOpen ? 0.62 : 0.12;
        const isSmiling = mouthCycle < -0.6;

        // Generate synthetic landmarks for overlay
        const canvas = canvasRef.current;
        if (canvas && showMeshOverlay) {
          const ctx = canvas.getContext('2d');
          ctx.clearRect(0, 0, canvas.width, canvas.height);
          drawSyntheticDemoHUD(ctx, canvas.width, canvas.height, yaw, pitch, roll, earVal, marVal);
        }

        // Generate synthetic biometric vector
        const synthBiometricVec = [1.2, 0.8, 0.8, 0.9, 1.4, 0.7, 0.3, 0.3, 0.4, 0.5];

        onPoseUpdate({
          pitch,
          yaw,
          roll,
          transX: Math.sin(t * 0.7) * 0.3,
          transY: Math.cos(t * 0.4) * 0.2,
          ear: {
            leftEAR: earVal,
            rightEAR: earVal,
            avgEAR: earVal,
            isBlinking,
            isWinkingLeft: blinkCycle > 0.85 && blinkCycle <= 0.92,
            isWinkingRight: false
          },
          mar: {
            mar: marVal,
            isOpen: isMouthOpen,
            isSmiling
          },
          biometricVec: synthBiometricVec,
          fps: 60,
          detected: true,
          isDemo: true
        });

        animId = requestAnimationFrame(runDemoLoop);
      };

      animId = requestAnimationFrame(runDemoLoop);
    }

    return () => {
      if (animId) cancelAnimationFrame(animId);
    };
  }, [demoMode, showMeshOverlay]);

  // Draw Sci-Fi HUD Mesh on canvas
  const drawSciFiMesh = (ctx, landmarks, w, h, ear, mar) => {
    // 1. Draw connecting mesh contours (Eye, Eyebrows, Lips, Face Oval)
    ctx.strokeStyle = 'rgba(0, 243, 255, 0.4)';
    ctx.lineWidth = 1;

    // Face contour landmark indices sample
    const ovalIndices = [10, 338, 297, 332, 284, 251, 389, 356, 454, 323, 361, 288, 397, 365, 379, 378, 400, 377, 152, 148, 176, 149, 150, 136, 172, 58, 132, 93, 234, 127, 162, 21, 54, 103, 67, 109, 10];
    
    ctx.beginPath();
    ovalIndices.forEach((idx, i) => {
      const pt = landmarks[idx];
      if (pt) {
        const x = (1 - pt.x) * w; // Mirror mode
        const y = pt.y * h;
        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
    });
    ctx.closePath();
    ctx.stroke();

    // 2. Draw Eye Irises & Bounding Lock
    const leftEyePt = landmarks[468] || landmarks[33];
    const rightEyePt = landmarks[473] || landmarks[263];
    
    [leftEyePt, rightEyePt].forEach((eye) => {
      if (eye) {
        const ex = (1 - eye.x) * w;
        const ey = eye.y * h;
        ctx.fillStyle = ear.isBlinking ? '#ff0055' : '#00f3ff';
        ctx.beginPath();
        ctx.arc(ex, ey, 4, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = '#00f3ff';
        ctx.beginPath();
        ctx.arc(ex, ey, 8, 0, Math.PI * 2);
        ctx.stroke();
      }
    });

    // 3. Draw Mouth Oval
    const mouthIndices = [61, 185, 40, 39, 37, 0, 267, 269, 270, 409, 291, 375, 321, 405, 314, 17, 84, 181, 91, 146, 61];
    ctx.strokeStyle = mar.isOpen ? '#ff0055' : 'rgba(0, 255, 136, 0.6)';
    ctx.beginPath();
    mouthIndices.forEach((idx, i) => {
      const pt = landmarks[idx];
      if (pt) {
        const x = (1 - pt.x) * w;
        const y = pt.y * h;
        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
    });
    ctx.closePath();
    ctx.stroke();

    // 4. Target Bounding Box
    const nose = landmarks[1];
    if (nose) {
      const nx = (1 - nose.x) * w;
      const ny = nose.y * h;
      const boxSize = 140;

      ctx.strokeStyle = 'rgba(0, 243, 255, 0.6)';
      ctx.lineWidth = 1.5;
      
      // Corner brackets
      const len = 15;
      // Top Left
      ctx.beginPath(); ctx.moveTo(nx - boxSize/2, ny - boxSize/2 + len); ctx.lineTo(nx - boxSize/2, ny - boxSize/2); ctx.lineTo(nx - boxSize/2 + len, ny - boxSize/2); ctx.stroke();
      // Top Right
      ctx.beginPath(); ctx.moveTo(nx + boxSize/2 - len, ny - boxSize/2); ctx.lineTo(nx + boxSize/2, ny - boxSize/2); ctx.lineTo(nx + boxSize/2, ny - boxSize/2 + len); ctx.stroke();
      // Bottom Left
      ctx.beginPath(); ctx.moveTo(nx - boxSize/2, ny + boxSize/2 - len); ctx.lineTo(nx - boxSize/2, ny + boxSize/2); ctx.lineTo(nx - boxSize/2 + len, ny + boxSize/2); ctx.stroke();
      // Bottom Right
      ctx.beginPath(); ctx.moveTo(nx + boxSize/2 - len, ny + boxSize/2); ctx.lineTo(nx + boxSize/2, ny + boxSize/2); ctx.lineTo(nx + boxSize/2, ny + boxSize/2 - len); ctx.stroke();
    }
  };

  // Draw Synthetic Sci-Fi Wireframe HUD during Demo Mode
  const drawSyntheticDemoHUD = (ctx, w, h, yaw, pitch, roll, earVal, marVal) => {
    const cx = w / 2 + (yaw * 1.5);
    const cy = h / 2 + (pitch * 1.5);

    // Glowing face lock box
    ctx.save();
    ctx.translate(cx, cy);
    ctx.rotate((roll * Math.PI) / 180);

    ctx.strokeStyle = 'rgba(0, 243, 255, 0.8)';
    ctx.lineWidth = 2;
    ctx.strokeRect(-60, -75, 120, 150);

    // Eye target crosshairs
    const eyeY = -25;
    const eyeSpacing = 35;
    
    // Left eye
    ctx.fillStyle = earVal < 0.15 ? '#ff0055' : '#00f3ff';
    ctx.beginPath(); ctx.arc(-eyeSpacing, eyeY, 6, 0, Math.PI * 2); ctx.fill();
    // Right eye
    ctx.beginPath(); ctx.arc(eyeSpacing, eyeY, 6, 0, Math.PI * 2); ctx.fill();

    // Mouth indicator
    const mouthY = 35;
    const mouthW = 40;
    const mouthH = marVal > 0.4 ? 20 : 4;
    ctx.fillStyle = marVal > 0.4 ? 'rgba(255, 0, 85, 0.8)' : 'rgba(0, 255, 136, 0.8)';
    ctx.fillRect(-mouthW / 2, mouthY - mouthH / 2, mouthW, mouthH);

    ctx.restore();
  };

  return (
    <div className="glass-panel p-4 flex flex-col items-center relative overflow-hidden scanline-effect">
      {/* HUD Title & Controls */}
      <div className="w-full flex items-center justify-between mb-3 border-b border-cyan-500/20 pb-2">
        <div className="flex items-center gap-2">
          <Activity className="w-4 h-4 text-cyan-400 animate-pulse" />
          <span className="font-heading text-xs tracking-wider uppercase text-cyan-400">
            AI Vision Engine {demoMode ? '(Demo Mode)' : '(Live Camera)'}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <button 
            onClick={() => setShowMeshOverlay(!showMeshOverlay)}
            className={`cyber-button-secondary text-[10px] px-2 py-1 flex items-center gap-1 ${showMeshOverlay ? 'border-cyan-400 text-cyan-400' : ''}`}
            title="Toggle Face Mesh Overlay"
          >
            <Eye className="w-3 h-3" />
            <span>HUD</span>
          </button>
          
          <button 
            onClick={() => setDemoMode(!demoMode)}
            className={`cyber-button text-[10px] px-2 py-1 flex items-center gap-1 ${demoMode ? 'border-magenta-400 text-pink-400' : ''}`}
            title="Toggle Demo Simulation Mode"
          >
            <Sparkles className="w-3 h-3" />
            <span>{demoMode ? 'Demo Active' : 'Switch Demo'}</span>
          </button>
        </div>
      </div>

      {/* Video & Canvas HUD Container */}
      <div className="relative w-full aspect-video rounded-lg overflow-hidden bg-black/60 border border-cyan-500/30 flex items-center justify-center">
        {/* Hidden video element used by MediaPipe */}
        <video 
          ref={videoRef} 
          className="absolute inset-0 w-full h-full object-cover transform -scale-x-100 opacity-60"
          playsInline 
          muted 
        />
        
        {/* 2D Canvas for Sci-Fi HUD Landmark Drawing */}
        <canvas 
          ref={canvasRef} 
          width={640} 
          height={480} 
          className="absolute inset-0 w-full h-full object-cover pointer-events-none z-10"
        />

        {isLoading && (
          <div className="absolute inset-0 bg-black/80 flex flex-col items-center justify-center gap-2 z-20">
            <RefreshCw className="w-6 h-6 text-cyan-400 animate-spin" />
            <span className="font-heading text-xs text-cyan-300">Initializing MediaPipe Neural Mesh...</span>
          </div>
        )}

        {cameraError && (
          <div className="absolute top-2 left-2 right-2 bg-red-950/80 border border-red-500 text-red-200 text-[11px] p-2 rounded z-20 flex items-center gap-2">
            <VideoOff className="w-4 h-4 text-red-400 shrink-0" />
            <span>{cameraError}</span>
          </div>
        )}

        {/* Live HUD Status Corner */}
        <div className="absolute bottom-2 left-2 z-20 bg-black/70 px-2 py-1 rounded border border-cyan-500/20 text-[10px] font-mono text-cyan-400 flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
          <span>FPS: {fps}</span>
          <span className="text-gray-500">|</span>
          <span>POINTS: 468</span>
        </div>
      </div>
    </div>
  );
}
