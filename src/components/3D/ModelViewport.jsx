import React, { Suspense } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, PerspectiveCamera, Stars, Float } from '@react-three/drei';
import { Layers, Bot, Plane, Globe, RotateCcw } from 'lucide-react';
import AvatarHead from './AvatarHead.jsx';
import JetSimulator from './JetSimulator.jsx';
import SpatialHologram from './SpatialHologram.jsx';

export default function ModelViewport({ 
  poseData, 
  activeModelMode, 
  setActiveModelMode,
  enableOrbitControls,
  setEnableOrbitControls 
}) {
  return (
    <div className="glass-panel p-4 flex flex-col h-full relative overflow-hidden scanline-effect">
      {/* Viewport Top Toolbar */}
      <div className="w-full flex items-center justify-between mb-3 border-b border-cyan-500/20 pb-2 z-10">
        <div className="flex items-center gap-2">
          <Layers className="w-4 h-4 text-cyan-400" />
          <span className="font-heading text-xs tracking-wider uppercase text-cyan-400">
            3D Control Viewport
          </span>
        </div>

        {/* 3D Model Selector Buttons */}
        <div className="flex items-center gap-1 bg-black/40 p-1 rounded-lg border border-cyan-500/20">
          <button
            onClick={() => setActiveModelMode('avatar')}
            className={`cyber-button-secondary text-[11px] px-2 py-1 flex items-center gap-1 ${
              activeModelMode === 'avatar' ? '!bg-cyan-500/20 !border-cyan-400 !text-cyan-300' : ''
            }`}
          >
            <Bot className="w-3.5 h-3.5" />
            <span>Cyber Head</span>
          </button>

          <button
            onClick={() => setActiveModelMode('jet')}
            className={`cyber-button-secondary text-[11px] px-2 py-1 flex items-center gap-1 ${
              activeModelMode === 'jet' ? '!bg-cyan-500/20 !border-cyan-400 !text-cyan-300' : ''
            }`}
          >
            <Plane className="w-3.5 h-3.5" />
            <span>Jet Simulator</span>
          </button>

          <button
            onClick={() => setActiveModelMode('hologram')}
            className={`cyber-button-secondary text-[11px] px-2 py-1 flex items-center gap-1 ${
              activeModelMode === 'hologram' ? '!bg-cyan-500/20 !border-cyan-400 !text-cyan-300' : ''
            }`}
          >
            <Globe className="w-3.5 h-3.5" />
            <span>Spatial Core</span>
          </button>
        </div>
      </div>

      {/* 3D Canvas Viewport */}
      <div className="relative w-full h-[460px] rounded-lg overflow-hidden bg-gradient-to-b from-slate-950 via-slate-900 to-black border border-cyan-500/30">
        <Canvas>
          <PerspectiveCamera makeDefault position={[0, 0, 6.5]} fov={50} />
          
          {/* Ambient & Studio Cyber Lights */}
          <ambientLight intensity={0.6} />
          <directionalLight position={[5, 10, 7]} intensity={1.5} color="#00f3ff" />
          <directionalLight position={[-5, -10, -5]} intensity={1.2} color="#ff0055" />
          <pointLight position={[0, 0, 3]} intensity={1.0} color="#8a2be2" />

          {/* Background Starfield */}
          <Stars radius={100} depth={50} count={2500} factor={4} saturation={0} fade speed={1} />

          {/* Optional Free Camera Orbit Controls */}
          {enableOrbitControls && <OrbitControls enableZoom={true} enablePan={true} />}

          {/* 3D Model Modes */}
          <Suspense fallback={null}>
            {activeModelMode === 'avatar' && (
              <Float speed={2} rotationIntensity={0.1} floatIntensity={0.2}>
                <AvatarHead poseData={poseData} />
              </Float>
            )}

            {activeModelMode === 'jet' && (
              <JetSimulator poseData={poseData} />
            )}

            {activeModelMode === 'hologram' && (
              <Float speed={1.5} rotationIntensity={0.2} floatIntensity={0.3}>
                <SpatialHologram poseData={poseData} />
              </Float>
            )}
          </Suspense>
        </Canvas>

        {/* Viewport Overlay Controls Corner */}
        <div className="absolute bottom-3 right-3 z-10 flex items-center gap-2">
          <button
            onClick={() => setEnableOrbitControls(!enableOrbitControls)}
            className={`cyber-button-secondary text-[10px] px-2.5 py-1 flex items-center gap-1.5 backdrop-blur-md bg-black/60 ${
              enableOrbitControls ? 'border-cyan-400 text-cyan-400' : ''
            }`}
            title="Toggle Free Orbit Camera Controls"
          >
            <RotateCcw className="w-3 h-3" />
            <span>{enableOrbitControls ? 'Free Orbit On' : 'Head Track Lock'}</span>
          </button>
        </div>
      </div>
    </div>
  );
}
