import React from 'react';
import { Scan, Volume2, VolumeX, ShieldCheck, Zap, Cpu } from 'lucide-react';
import { soundSynth } from '../../utils/audioSynth.js';

export default function Header({ isMuted, setIsMuted, isDetected }) {
  const toggleAudio = () => {
    const nextMuted = !isMuted;
    setIsMuted(nextMuted);
    soundSynth.setMuted(nextMuted);
    if (!nextMuted) soundSynth.playClick();
  };

  return (
    <header className="glass-panel p-4 mb-4 flex items-center justify-between border-b border-cyan-500/30">
      {/* Brand Title */}
      <div className="flex items-center gap-3">
        <div className="p-2.5 rounded-xl bg-gradient-to-tr from-cyan-500/20 to-purple-600/30 border border-cyan-400/40 shadow-lg shadow-cyan-500/10">
          <Scan className="w-6 h-6 text-cyan-400 animate-pulse" />
        </div>
        <div>
          <h1 className="font-heading text-lg font-bold tracking-wider bg-gradient-to-r from-cyan-400 via-purple-300 to-pink-500 bg-clip-text text-transparent">
            CYBERMESH AI
          </h1>
          <p className="text-[11px] text-gray-400 font-mono tracking-wide">
            Face Recognition & Real-Time 3D Model Control
          </p>
        </div>
      </div>

      {/* System Status Badges & Controls */}
      <div className="flex items-center gap-3">
        {/* Detection Status Pill */}
        <div className={`px-3 py-1 rounded-full border text-xs font-mono flex items-center gap-2 ${
          isDetected 
            ? 'bg-emerald-950/60 border-emerald-500/50 text-emerald-400' 
            : 'bg-amber-950/60 border-amber-500/50 text-amber-400'
        }`}>
          <span className={`w-2 h-2 rounded-full ${isDetected ? 'bg-emerald-400 animate-ping' : 'bg-amber-400'}`} />
          <span>{isDetected ? 'AI LOCKED' : 'SEARCHING FACE'}</span>
        </div>

        {/* Neural Engine Badge */}
        <div className="hidden sm:flex items-center gap-1.5 px-3 py-1 rounded-full bg-cyan-950/40 border border-cyan-500/30 text-xs font-mono text-cyan-300">
          <Cpu className="w-3.5 h-3.5 text-cyan-400" />
          <span>MediaPipe 60FPS</span>
        </div>

        {/* Audio FX Toggle */}
        <button
          onClick={toggleAudio}
          className="cyber-button-secondary p-2 rounded-lg"
          title={isMuted ? 'Unmute Audio FX' : 'Mute Audio FX'}
        >
          {isMuted ? <VolumeX className="w-4 h-4 text-gray-400" /> : <Volume2 className="w-4 h-4 text-cyan-400" />}
        </button>
      </div>
    </header>
  );
}
