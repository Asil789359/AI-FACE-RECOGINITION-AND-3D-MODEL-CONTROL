import React, { useState } from 'react';
import Header from './components/UI/Header.jsx';
import FaceTracker from './components/Vision/FaceTracker.jsx';
import ModelViewport from './components/3D/ModelViewport.jsx';
import BiometricPanel from './components/UI/BiometricPanel.jsx';
import MetricsOverlay from './components/UI/MetricsOverlay.jsx';

export default function App() {
  const [poseData, setPoseData] = useState({
    pitch: 0,
    yaw: 0,
    roll: 0,
    transX: 0,
    transY: 0,
    ear: { leftEAR: 0.3, rightEAR: 0.3, avgEAR: 0.3, isBlinking: false },
    mar: { mar: 0, isOpen: false, isSmiling: false },
    biometricVec: null,
    fps: 60,
    detected: false
  });

  const [isCameraActive, setIsCameraActive] = useState(true);
  const [showMeshOverlay, setShowMeshOverlay] = useState(true);
  const [demoMode, setDemoMode] = useState(true); // Default to synthetic demo mode for instant 60 FPS experience
  const [activeModelMode, setActiveModelMode] = useState('avatar'); // 'avatar' | 'jet' | 'hologram'
  const [enableOrbitControls, setEnableOrbitControls] = useState(false);
  const [isMuted, setIsMuted] = useState(false);

  const [manualOverride, setManualOverride] = useState({
    active: false,
    pitch: 0,
    yaw: 0,
    roll: 0
  });

  // Effective pose sent to 3D canvas (combines AI face pose or manual slider override)
  const effectivePose = manualOverride.active ? {
    ...poseData,
    pitch: manualOverride.pitch,
    yaw: manualOverride.yaw,
    roll: manualOverride.roll,
    detected: true
  } : poseData;

  return (
    <div className="min-h-screen p-4 md:p-6 max-w-7xl mx-auto flex flex-col">
      {/* Header Bar */}
      <Header 
        isMuted={isMuted} 
        setIsMuted={setIsMuted} 
        isDetected={effectivePose.detected} 
      />

      {/* Main Grid Workspace */}
      <main className="grid grid-cols-1 lg:grid-cols-12 gap-5 flex-1">
        {/* Left Column: AI Camera HUD & Telemetry Metrics (5 Cols) */}
        <div className="lg:col-span-5 flex flex-col gap-5">
          <FaceTracker 
            onPoseUpdate={setPoseData}
            isCameraActive={isCameraActive}
            setIsCameraActive={setIsCameraActive}
            showMeshOverlay={showMeshOverlay}
            setShowMeshOverlay={setShowMeshOverlay}
            demoMode={demoMode}
            setDemoMode={setDemoMode}
          />

          <MetricsOverlay 
            poseData={effectivePose}
            manualOverride={manualOverride}
            setManualOverride={setManualOverride}
          />
        </div>

        {/* Right Column: 3D Control Viewport & Biometric Verification (7 Cols) */}
        <div className="lg:col-span-7 flex flex-col gap-5">
          <ModelViewport 
            poseData={effectivePose}
            activeModelMode={activeModelMode}
            setActiveModelMode={setActiveModelMode}
            enableOrbitControls={enableOrbitControls}
            setEnableOrbitControls={setEnableOrbitControls}
          />

          <BiometricPanel 
            currentBiometricVec={effectivePose.biometricVec}
            isDetected={effectivePose.detected}
          />
        </div>
      </main>

      {/* Footer Info */}
      <footer className="mt-6 border-t border-cyan-500/20 pt-3 flex items-center justify-between text-[11px] font-mono text-gray-500">
        <span>CYBERMESH AI 3D ENGINE v1.0.0</span>
        <span>WebGL • MediaPipe FaceMesh • Three.js • React 18</span>
      </footer>
    </div>
  );
}
