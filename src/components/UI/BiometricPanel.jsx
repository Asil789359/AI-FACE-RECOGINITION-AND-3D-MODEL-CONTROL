import React, { useState, useEffect } from 'react';
import { UserCheck, UserPlus, ShieldAlert, ShieldCheck, CheckCircle2, Lock, Sparkles, Trash2 } from 'lucide-react';
import confetti from 'canvas-confetti';
import { matchBiometricVector } from '../../utils/faceMath.js';
import { soundSynth } from '../../utils/audioSynth.js';

export default function BiometricPanel({ currentBiometricVec, isDetected }) {
  const [newProfileName, setNewProfileName] = useState('');
  const [enrolledProfiles, setEnrolledProfiles] = useState([
    { id: '1', name: 'Commander Alex', vector: [1.2, 0.8, 0.8, 0.9, 1.4, 0.7, 0.3, 0.3, 0.4, 0.5], role: 'Alpha Lead' },
    { id: '2', name: 'Dr. Elena Vance', vector: [1.1, 0.85, 0.82, 0.95, 1.35, 0.68, 0.32, 0.31, 0.42, 0.48], role: 'Cybernetics' }
  ]);

  const [activeMatch, setActiveMatch] = useState(null);
  const [lastGrantedId, setLastGrantedId] = useState(null);

  // Real-time similarity check loop against enrolled database
  useEffect(() => {
    if (!currentBiometricVec || !isDetected) {
      setActiveMatch(null);
      return;
    }

    let bestMatch = null;
    let maxConfidence = 0;

    enrolledProfiles.forEach((profile) => {
      const conf = matchBiometricVector(currentBiometricVec, profile.vector);
      if (conf > maxConfidence) {
        maxConfidence = conf;
        bestMatch = { ...profile, confidence: conf };
      }
    });

    if (bestMatch && maxConfidence >= 72) {
      setActiveMatch(bestMatch);

      // Trigger Access Granted celebration chime & confetti once per match
      if (lastGrantedId !== bestMatch.id) {
        setLastGrantedId(bestMatch.id);
        soundSynth.playAccessGranted();
        try {
          confetti({
            particleCount: 40,
            spread: 60,
            origin: { y: 0.8 }
          });
        } catch (e) {}
      }
    } else {
      setActiveMatch(null);
    }
  }, [currentBiometricVec, isDetected, enrolledProfiles, lastGrantedId]);

  // Enroll new face profile
  const handleEnroll = (e) => {
    e.preventDefault();
    if (!newProfileName.trim()) return;
    if (!currentBiometricVec) {
      alert("No face detected! Look at camera or enable demo mode first.");
      return;
    }

    const newProfile = {
      id: Date.now().toString(),
      name: newProfileName.trim(),
      vector: [...currentBiometricVec],
      role: 'Registered Operative'
    };

    setEnrolledProfiles([...enrolledProfiles, newProfile]);
    setNewProfileName('');
    soundSynth.playClick();
  };

  // Delete enrolled profile
  const handleDelete = (id) => {
    setEnrolledProfiles(enrolledProfiles.filter(p => p.id !== id));
    soundSynth.playClick();
  };

  return (
    <div className="glass-panel p-4 flex flex-col gap-4">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-cyan-500/20 pb-2">
        <div className="flex items-center gap-2">
          <UserCheck className="w-4 h-4 text-cyan-400" />
          <span className="font-heading text-xs tracking-wider uppercase text-cyan-400">
            Biometric Recognition System
          </span>
        </div>
        
        {activeMatch ? (
          <span className="px-2 py-0.5 rounded bg-emerald-500/20 border border-emerald-400 text-emerald-300 font-mono text-[10px] flex items-center gap-1">
            <ShieldCheck className="w-3 h-3 text-emerald-400" />
            <span>MATCH: {activeMatch.confidence}%</span>
          </span>
        ) : (
          <span className="px-2 py-0.5 rounded bg-pink-500/20 border border-pink-400 text-pink-300 font-mono text-[10px] flex items-center gap-1">
            <ShieldAlert className="w-3 h-3 text-pink-400" />
            <span>UNRECOGNIZED</span>
          </span>
        )}
      </div>

      {/* Access Verification Banner */}
      <div className={`p-3 rounded-lg border flex items-center justify-between transition-all ${
        activeMatch 
          ? 'bg-emerald-950/40 border-emerald-500/50 text-emerald-200 shadow-lg shadow-emerald-500/10' 
          : 'bg-slate-900/60 border-slate-700/50 text-gray-400'
      }`}>
        <div className="flex items-center gap-3">
          <div className={`p-2 rounded-lg ${activeMatch ? 'bg-emerald-500/20 text-emerald-400' : 'bg-slate-800 text-gray-500'}`}>
            {activeMatch ? <CheckCircle2 className="w-5 h-5" /> : <Lock className="w-5 h-5" />}
          </div>
          <div>
            <div className="font-heading text-xs font-semibold">
              {activeMatch ? `ACCESS GRANTED: ${activeMatch.name}` : 'BIOMETRIC LOCK ACTIVE'}
            </div>
            <div className="text-[10px] font-mono opacity-80">
              {activeMatch ? `Role: ${activeMatch.role} (${activeMatch.confidence}% match)` : 'Position face in frame to authorize identity'}
            </div>
          </div>
        </div>

        {activeMatch && (
          <div className="glow-text-green font-heading text-xs font-bold uppercase">
            VERIFIED
          </div>
        )}
      </div>

      {/* Profile Enrollment Form */}
      <form onSubmit={handleEnroll} className="flex gap-2">
        <input 
          type="text" 
          value={newProfileName}
          onChange={(e) => setNewProfileName(e.target.value)}
          placeholder="Enter profile name to enroll..." 
          className="flex-1 bg-black/50 border border-cyan-500/30 rounded-lg px-3 py-1.5 text-xs text-cyan-200 placeholder:text-gray-600 focus:outline-none focus:border-cyan-400 font-mono"
        />
        <button 
          type="submit" 
          className="cyber-button text-xs py-1.5 px-3 whitespace-nowrap"
        >
          <UserPlus className="w-3.5 h-3.5" />
          <span>Enroll Face</span>
        </button>
      </form>

      {/* Enrolled Profiles List */}
      <div className="flex flex-col gap-2 max-h-36 overflow-y-auto pr-1">
        <span className="text-[10px] font-mono text-gray-400 uppercase tracking-wider">
          Enrolled Database ({enrolledProfiles.length})
        </span>
        {enrolledProfiles.map((p) => {
          const isCurrentMatch = activeMatch?.id === p.id;
          return (
            <div 
              key={p.id}
              className={`p-2 rounded-md border flex items-center justify-between text-xs transition-all ${
                isCurrentMatch 
                  ? 'bg-emerald-900/30 border-emerald-400/60 text-emerald-200' 
                  : 'bg-black/40 border-slate-800 text-gray-300'
              }`}
            >
              <div className="flex items-center gap-2">
                <span className={`w-2 h-2 rounded-full ${isCurrentMatch ? 'bg-emerald-400 animate-pulse' : 'bg-gray-600'}`} />
                <div>
                  <span className="font-heading text-xs">{p.name}</span>
                  <span className="ml-2 text-[10px] font-mono text-gray-400">[{p.role}]</span>
                </div>
              </div>

              <div className="flex items-center gap-2">
                {isCurrentMatch && (
                  <span className="text-[10px] font-mono text-emerald-400 font-bold">
                    {activeMatch.confidence}%
                  </span>
                )}
                <button 
                  onClick={() => handleDelete(p.id)}
                  className="text-gray-500 hover:text-pink-400 transition-colors p-1"
                  title="Remove Profile"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
