"use client";

import React, { useState } from "react";
import { Play, Pause, SkipBack, SkipForward, Volume2, VolumeX, Music, Repeat, Shuffle, X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface AudioPlayerBarProps {
  playlist: { id: string; title: string; downloadUrl: string; thumbnail?: string }[];
  currentIndex: number;
  onSelectTrack: (index: number) => void;
  onClose: () => void;
}

export default function AudioPlayerBar({ playlist, currentIndex, onSelectTrack, onClose }: AudioPlayerBarProps) {
  const currentTrack = playlist[currentIndex];
  const audioRef = React.useRef<HTMLAudioElement>(null);

  const [isPlaying, setIsPlaying] = useState(true);
  const [isMuted, setIsMuted] = useState(false);
  const [progress, setProgress] = useState(0);

  const togglePlay = () => {
    if (!audioRef.current) return;
    if (isPlaying) {
      audioRef.current.pause();
      setIsPlaying(false);
    } else {
      audioRef.current.play();
      setIsPlaying(true);
    }
  };

  const handleNext = () => {
    if (currentIndex < playlist.length - 1) {
      onSelectTrack(currentIndex + 1);
    } else {
      onSelectTrack(0);
    }
  };

  const handlePrev = () => {
    if (currentIndex > 0) {
      onSelectTrack(currentIndex - 1);
    } else {
      onSelectTrack(playlist.length - 1);
    }
  };

  if (!currentTrack) return null;

  return (
    <motion.div
      initial={{ y: 100, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      exit={{ y: 100, opacity: 0 }}
      className="fixed bottom-4 left-4 right-4 max-w-4xl mx-auto z-40 glass-card p-3 rounded-2xl border border-purple-500/30 shadow-2xl flex items-center justify-between gap-4"
    >
      <audio
        ref={audioRef}
        src={`${currentTrack.downloadUrl}?inline=true`}
        autoPlay
        onTimeUpdate={() => {
          if (audioRef.current) {
            const p = (audioRef.current.currentTime / audioRef.current.duration) * 100;
            setProgress(p || 0);
          }
        }}
        onEnded={handleNext}
      />

      <div className="flex items-center gap-3 min-w-0 flex-1">
        {currentTrack.thumbnail ? (
          <img src={currentTrack.thumbnail} alt={currentTrack.title} className="w-12 h-12 object-cover rounded-xl border border-white/10 shrink-0" />
        ) : (
          <div className="w-12 h-12 rounded-xl bg-purple-600/20 border border-purple-500/30 flex items-center justify-center text-purple-300 shrink-0">
            <Music className="w-6 h-6 animate-pulse" />
          </div>
        )}

        <div className="min-w-0 flex-1">
          <h4 className="text-xs font-bold text-white truncate">{currentTrack.title}</h4>
          <span className="text-[10px] text-cyan-300 font-medium">StreamPulse Dahili Müzik Çalar</span>
        </div>
      </div>

      <div className="flex items-center gap-2">
        <button onClick={handlePrev} className="p-2 text-slate-400 hover:text-white transition-all">
          <SkipBack className="w-4 h-4" />
        </button>

        <button onClick={togglePlay} className="p-2.5 rounded-xl bg-purple-600 text-white hover:bg-purple-500 shadow-md transition-all">
          {isPlaying ? <Pause className="w-4 h-4 fill-current" /> : <Play className="w-4 h-4 fill-current" />}
        </button>

        <button onClick={handleNext} className="p-2 text-slate-400 hover:text-white transition-all">
          <SkipForward className="w-4 h-4" />
        </button>
      </div>

      <button onClick={onClose} className="p-1.5 rounded-full bg-slate-800 text-slate-400 hover:text-white ml-2">
        <X className="w-4 h-4" />
      </button>
    </motion.div>
  );
}
