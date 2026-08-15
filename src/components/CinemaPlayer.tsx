"use client";

import React, { useEffect, useRef, useState } from "react";
import Hls from "hls.js";
import { motion } from "framer-motion";
import {
  X,
  Play,
  Pause,
  Volume2,
  VolumeX,
  Maximize,
  Minimize,
  Download,
  Film,
  Sparkles,
  Zap,
  PictureInPicture2,
  Tv,
  ExternalLink,
  RefreshCw,
  ShieldCheck,
} from "lucide-react";

interface CinemaPlayerProps {
  streamUrl: string;
  pageUrl?: string;
  title: string;
  thumbnail?: string;
  onClose: () => void;
}

export default function CinemaPlayer({ streamUrl, pageUrl, title, thumbnail, onClose }: CinemaPlayerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const [mode, setMode] = useState<"hls" | "embed">("embed");

  const [isPlaying, setIsPlaying] = useState(true);
  const [isMuted, setIsMuted] = useState(false);
  const [playbackRate, setPlaybackRate] = useState(1);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [theaterMode, setTheaterMode] = useState(true);

  useEffect(() => {
    if (mode !== "hls") return;

    const video = videoRef.current;
    if (!video || !streamUrl) return;

    let hls: Hls | null = null;

    let finalUrl = streamUrl;
    if (!streamUrl.startsWith("/api/") && streamUrl.startsWith("http")) {
      finalUrl = `/api/stream-proxy?url=${encodeURIComponent(streamUrl)}`;
    }

    if (Hls.isSupported()) {
      hls = new Hls({
        enableWorker: true,
        lowLatencyMode: true,
      });

      hls.loadSource(finalUrl);
      hls.attachMedia(video);

      hls.on(Hls.Events.MANIFEST_PARSED, () => {
        video.play().catch((e) => console.log("Auto-play prevented:", e));
        setIsPlaying(true);
      });
    } else if (video.canPlayType("application/vnd.apple.mpegurl")) {
      video.src = finalUrl;
      video.addEventListener("loadedmetadata", () => {
        video.play().catch((e) => console.log("Auto-play prevented:", e));
        setIsPlaying(true);
      });
    }

    return () => {
      if (hls) {
        hls.destroy();
      }
    };
  }, [streamUrl, mode]);

  const togglePlay = () => {
    if (!videoRef.current) return;
    if (isPlaying) {
      videoRef.current.pause();
      setIsPlaying(false);
    } else {
      videoRef.current
        .play()
        .then(() => setIsPlaying(true))
        .catch(() => setIsPlaying(false));
    }
  };

  const toggleMute = () => {
    if (!videoRef.current) return;
    videoRef.current.muted = !isMuted;
    setIsMuted(!isMuted);
  };

  const changePlaybackRate = (rate: number) => {
    if (!videoRef.current) return;
    videoRef.current.playbackRate = rate;
    setPlaybackRate(rate);
  };

  const toggleFullscreen = () => {
    if (!containerRef.current) return;
    if (!document.fullscreenElement) {
      containerRef.current.requestFullscreen().catch((err) => console.error(err));
      setIsFullscreen(true);
    } else {
      document.exitFullscreen().catch((err) => console.error(err));
      setIsFullscreen(false);
    }
  };

  const embedProxyUrl = `/api/embed-proxy?url=${encodeURIComponent(streamUrl)}`;

  return (
    <div className="fixed inset-0 z-50 bg-black/95 backdrop-blur-2xl flex items-center justify-center p-2 md:p-6 overflow-y-auto">
      <motion.div
        ref={containerRef}
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.95, opacity: 0 }}
        className={`w-full max-w-5xl rounded-3xl bg-slate-950 border border-purple-500/30 overflow-hidden shadow-2xl relative flex flex-col ${
          theaterMode ? "shadow-[0_0_80px_rgba(168,85,247,0.25)]" : ""
        }`}
      >
        {/* Header Bar */}
        <div className="flex items-center justify-between p-4 bg-slate-900/80 border-b border-white/10 z-10">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-purple-600 to-cyan-500 flex items-center justify-center text-white">
              <Tv className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm md:text-base font-bold text-white line-clamp-1">{title}</h3>
              <div className="flex items-center gap-2 mt-0.5">
                <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 uppercase flex items-center gap-1">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                  Reklamsız Canlı Oynatıcı Koruması
                </span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setMode(mode === "embed" ? "hls" : "embed")}
              className="px-3 py-1.5 rounded-xl text-xs font-semibold bg-cyan-500/10 text-cyan-300 border border-cyan-500/30 hover:bg-cyan-500/20 transition-all flex items-center gap-1"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              {mode === "embed" ? "Gelişmiş HLS Modu" : "Temiz Web Oynatıcı Modu"}
            </button>

            <button
              onClick={() => setTheaterMode(!theaterMode)}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all ${
                theaterMode
                  ? "bg-purple-500/20 text-purple-300 border-purple-500/30"
                  : "bg-slate-800 text-slate-400 border-white/10"
              }`}
            >
              <Film className="w-3.5 h-3.5 inline mr-1" />
              Işıkları Kapat
            </button>

            <button
              onClick={onClose}
              className="w-9 h-9 rounded-full bg-slate-800 hover:bg-red-500/20 text-slate-300 hover:text-red-400 border border-white/10 flex items-center justify-center transition-all"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Player Screen */}
        <div className="relative bg-black aspect-video w-full flex items-center justify-center overflow-hidden">
          {mode === "embed" ? (
            <iframe
              src={embedProxyUrl}
              allowFullScreen
              className="w-full h-full border-0"
              allow="autoplay; encrypted-media; picture-in-picture"
              sandbox="allow-scripts allow-same-origin allow-presentation allow-forms"
            />
          ) : (
            <video
              ref={videoRef}
              poster={thumbnail}
              controls
              playsInline
              className="w-full h-full object-contain cursor-pointer"
            />
          )}
        </div>
      </motion.div>
    </div>
  );
}
