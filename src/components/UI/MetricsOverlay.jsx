import React from 'react';
import { Gauge, Sliders, Eye, Smile, Sparkles, MoveHorizontal, MoveVertical, RotateCcw } from 'lucide-react';

export default function MetricsOverlay({ poseData, manualOverride, setManualOverride }) {
  const pitch = Math.round(poseData?.pitch || 0);
  const yaw = Math.round(poseData?.yaw || 0);
  const roll = Math.round(poseData?.roll || 0);
  const ear = Math.round((poseData?.ear?.avgEAR || 0) * 100) / 100;
  const mar = Math.round((poseData?.mar?.mar || 0) * 100) / 100;

  const isBlinking = poseData?.ear?.isBlinking;
  const isMouthOpen = poseData?.mar?.isOpen;
  const isSmiling = poseData?.mar?.isSmiling;

  return (
    <div className="glass-panel p-4 flex flex-col gap-4">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-cyan-500/20 pb-2">
        <div className="flex items-center gap-2">
          <Gauge className="w-4 h-4 text-cyan-400" />
          <span className="font-heading text-xs tracking-wider uppercase text-cyan-400">
            Real-Time Head Pose Telemetry
          </span>
        </div>
        <span className="text-[10px] font-mono text-gray-400">
          60Hz Euler Matrix
        </span>
      </div>

      {/* Gauges Grid: Pitch, Yaw, Roll */}
      <div className="grid grid-cols-3 gap-2">
        {/* Pitch Gauge */}
        <div className="bg-black/50 p-2.5 rounded-lg border border-cyan-500/20 flex flex-col items-center">
          <div className="flex items-center gap-1 text-[10px] font-mono text-cyan-300 mb-1">
            <MoveVertical className="w-3 h-3 text-cyan-400" />
            <span>PITCH (X)</span>
          </div>
          <span className="font-heading text-lg font-bold glow-text-cyan">
            {pitch}°
          </span>
          <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden mt-1">
            <div 
              className="bg-cyan-400 h-full transition-all duration-75"
              style={{ width: `${Math.min(100, Math.max(0, ((pitch + 45) / 90) * 100))}%` }}
            />
          </div>
        </div>

        {/* Yaw Gauge */}
        <div className="bg-black/50 p-2.5 rounded-lg border border-cyan-500/20 flex flex-col items-center">
          <div className="flex items-center gap-1 text-[10px] font-mono text-purple-300 mb-1">
            <MoveHorizontal className="w-3 h-3 text-purple-400" />
            <span>YAW (Y)</span>
          </div>
          <span className="font-heading text-lg font-bold text-purple-300">
            {yaw}°
          </span>
          <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden mt-1">
            <div 
              className="bg-purple-400 h-full transition-all duration-75"
              style={{ width: `${Math.min(100, Math.max(0, ((yaw + 45) / 90) * 100))}%` }}
            />
          </div>
        </div>

        {/* Roll Gauge */}
        <div className="bg-black/50 p-2.5 rounded-lg border border-pink-500/20 flex flex-col items-center">
          <div className="flex items-center gap-1 text-[10px] font-mono text-pink-300 mb-1">
            <RotateCcw className="w-3 h-3 text-pink-400" />
            <span>ROLL (Z)</span>
          </div>
          <span className="font-heading text-lg font-bold glow-text-magenta">
            {roll}°
          </span>
          <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden mt-1">
            <div 
              className="bg-pink-500 h-full transition-all duration-75"
              style={{ width: `${Math.min(100, Math.max(0, ((roll + 45) / 90) * 100))}%` }}
            />
          </div>
        </div>
      </div>

      {/* Expression Signal Indicators */}
      <div className="grid grid-cols-2 gap-2">
        <div className="bg-black/40 p-2 rounded-lg border border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Eye className={`w-4 h-4 ${isBlinking ? 'text-pink-400 animate-pulse' : 'text-gray-400'}`} />
            <div>
              <div className="text-[10px] font-mono text-gray-400">Eye EAR Ratio</div>
              <div className="text-xs font-heading font-semibold text-cyan-300">{ear}</div>
            </div>
          </div>
          {isBlinking && (
            <span className="px-1.5 py-0.5 rounded bg-pink-500/20 text-pink-300 text-[9px] font-mono border border-pink-400">
              BLINK
            </span>
          )}
        </div>

        <div className="bg-black/40 p-2 rounded-lg border border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Smile className={`w-4 h-4 ${isMouthOpen || isSmiling ? 'text-emerald-400 animate-bounce' : 'text-gray-400'}`} />
            <div>
              <div className="text-[10px] font-mono text-gray-400">Mouth MAR Ratio</div>
              <div className="text-xs font-heading font-semibold text-emerald-300">{mar}</div>
            </div>
          </div>
          {isMouthOpen && (
            <span className="px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-300 text-[9px] font-mono border border-emerald-400">
              NITRO BOOST
            </span>
          )}
        </div>
      </div>

      {/* Manual Override Controls */}
      <div className="border-t border-cyan-500/20 pt-2 flex flex-col gap-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5 text-xs text-cyan-300 font-mono">
            <Sliders className="w-3.5 h-3.5 text-cyan-400" />
            <span>Manual Angle Slider Override</span>
          </div>
          <button 
            onClick={() => setManualOverride({ active: !manualOverride.active, pitch: 0, yaw: 0, roll: 0 })}
            className={`text-[10px] font-mono px-2 py-0.5 rounded border ${
              manualOverride.active ? 'bg-cyan-500/30 border-cyan-400 text-cyan-200' : 'bg-slate-800 border-slate-700 text-gray-400'
            }`}
          >
            {manualOverride.active ? 'Override ON' : 'Override OFF'}
          </button>
        </div>

        {manualOverride.active && (
          <div className="flex flex-col gap-2 bg-black/60 p-2 rounded-lg border border-cyan-500/30 text-xs font-mono">
            <div>
              <div className="flex justify-between text-[10px] text-gray-400">
                <span>Pitch (Tilt Up/Down): {manualOverride.pitch}°</span>
              </div>
              <input 
                type="range" min="-60" max="60" value={manualOverride.pitch}
                onChange={(e) => setManualOverride({ ...manualOverride, pitch: parseFloat(e.target.value) })}
              />
            </div>
            <div>
              <div className="flex justify-between text-[10px] text-gray-400">
                <span>Yaw (Turn Left/Right): {manualOverride.yaw}°</span>
              </div>
              <input 
                type="range" min="-60" max="60" value={manualOverride.yaw}
                onChange={(e) => setManualOverride({ ...manualOverride, yaw: parseFloat(e.target.value) })}
              />
            </div>
            <div>
              <div className="flex justify-between text-[10px] text-gray-400">
                <span>Roll (Tilt Left/Right): {manualOverride.roll}°</span>
              </div>
              <input 
                type="range" min="-60" max="60" value={manualOverride.roll}
                onChange={(e) => setManualOverride({ ...manualOverride, roll: parseFloat(e.target.value) })}
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
