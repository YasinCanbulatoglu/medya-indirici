"use client";

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import confetti from "canvas-confetti";
import CinemaPlayer from "@/components/CinemaPlayer";
import QRCodeModal from "@/components/QRCodeModal";
import AudioPlayerBar from "@/components/AudioPlayerBar";
import {
  Download,
  Music,
  Video,
  Sparkles,
  Link2,
  Clipboard,
  AlertCircle,
  Loader2,
  Play,
  Trash2,
  History,
  HardDrive,
  Globe,
  X,
  Film,
  Zap,
  Check,
  Layers,
  ListPlus,
  Tv,
  QrCode,
  Smartphone,
} from "lucide-react";

// SVG Brand Icons
const YoutubeIcon = (props: any) => (
  <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor" {...props}>
    <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
  </svg>
);

const InstagramIcon = (props: any) => (
  <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor" {...props}>
    <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
  </svg>
);

const TwitterIcon = (props: any) => (
  <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor" {...props}>
    <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
  </svg>
);

interface MediaMetadata {
  url: string;
  streamUrl?: string;
  title: string;
  thumbnail: string;
  durationFormatted: string;
  uploader: string;
  extractor: string;
  defaultVideoFormats: { quality: string; label: string }[];
  defaultAudioFormats: { quality: string; label: string }[];
}

interface BatchItem {
  id: string;
  url: string;
  metadata?: MediaMetadata;
  error?: string;
  loading: boolean;
  selectedFormat: "mp4" | "mp3";
  selectedQuality: string;
  job?: ActiveJob;
}

interface ActiveJob {
  id: string;
  url: string;
  title: string;
  thumbnail: string;
  format: "mp3" | "mp4";
  quality: string;
  progress: number;
  status: "starting" | "downloading" | "converting" | "completed" | "error";
  speed?: string;
  eta?: string;
  downloadUrl?: string;
  filename?: string;
  filesize?: string;
  error?: string;
}

const SUPPORTED_PLATFORMS = [
  { name: "YouTube", icon: YoutubeIcon, color: "text-red-500", bg: "bg-red-500/10 border-red-500/20" },
  { name: "Instagram", icon: InstagramIcon, color: "text-pink-500", bg: "bg-pink-500/10 border-pink-500/20" },
  { name: "TikTok", icon: Zap, color: "text-cyan-400", bg: "bg-cyan-500/10 border-cyan-500/20" },
  { name: "Twitter / X", icon: TwitterIcon, color: "text-sky-400", bg: "bg-sky-500/10 border-sky-500/20" },
  { name: "Film & Dizi Sitemiz", icon: Film, color: "text-purple-400", bg: "bg-purple-500/10 border-purple-500/20" },
  { name: "Diğer Tüm Siteler", icon: Globe, color: "text-emerald-400", bg: "bg-emerald-500/10 border-emerald-500/20" },
];

export default function Home() {
  const [isMounted, setIsMounted] = useState(false);
  const [inputText, setInputText] = useState("");
  const [isBulkMode, setIsBulkMode] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  const [analyzing, setAnalyzing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Batch items state
  const [batchItems, setBatchItems] = useState<BatchItem[]>([]);

  // Active Download Jobs & History
  const [activeJobsList, setActiveJobsList] = useState<ActiveJob[]>([]);
  const [history, setHistory] = useState<ActiveJob[]>([]);
  const [activeTab, setActiveTab] = useState<"downloader" | "history">("downloader");

  // Local file audio/video player modal
  const [playingItem, setPlayingItem] = useState<{ url: string; title: string; type: "audio" | "video" } | null>(null);

  // QR Code share modal state
  const [qrCodeItem, setQrCodeItem] = useState<{ url: string; title: string } | null>(null);

  // Background Audio Playlist Index
  const [activePlaylistTrackIndex, setActivePlaylistTrackIndex] = useState<number | null>(null);

  // Ad-Free Cinema Live Streaming Player Modal
  const [cinemaItem, setCinemaItem] = useState<{ streamUrl: string; title: string; thumbnail?: string } | null>(null);

  useEffect(() => {
    fetchHistory();
  }, []);

  const fetchHistory = async () => {
    try {
      const res = await fetch("/api/history");
      if (res.ok) {
        const data = await res.json();
        setHistory(data);
      }
    } catch (err) {
      console.error("Failed to fetch history:", err);
    }
  };

  // Poll progress for all active jobs
  useEffect(() => {
    let interval: NodeJS.Timeout;

    const hasActive = activeJobsList.some(
      (j) => j.status !== "completed" && j.status !== "error"
    );

    if (hasActive) {
      interval = setInterval(async () => {
        let hasCompletedAny = false;

        const updatedJobs = await Promise.all(
          activeJobsList.map(async (job) => {
            if (job.status === "completed" || job.status === "error") return job;

            try {
              const res = await fetch(`/api/progress?id=${job.id}`);
              if (res.ok) {
                const updated: ActiveJob = await res.json();
                if (updated.status === "completed") {
                  hasCompletedAny = true;
                }
                return updated;
              }
            } catch (e) {
              console.error("Progress poll error:", e);
            }
            return job;
          })
        );

        setActiveJobsList(updatedJobs);

        if (hasCompletedAny) {
          confetti({ particleCount: 100, spread: 80, origin: { y: 0.6 } });
          fetchHistory();
        }
      }, 1000);
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [activeJobsList]);

  // Paste from clipboard handler
  const handlePaste = async () => {
    try {
      const text = await navigator.clipboard.readText();
      if (text) {
        setInputText(text);
        handleAnalyze(text);
      }
    } catch (e) {
      setError("Panodan okuma izni verilemedi. Lütfen adresi elle yapıştırın.");
    }
  };

  // Handle URL analyze (Single or Batch)
  const handleAnalyze = async (overrideText?: string) => {
    const rawContent = overrideText !== undefined ? overrideText : inputText;
    if (!rawContent.trim()) {
      setError("Lütfen geçerli bir video, müzik veya film bağlantısı girin.");
      return;
    }

    setError(null);
    setAnalyzing(true);

    const extractedUrls = Array.from(
      new Set(
        rawContent
          .split(/[\n,\s]+/)
          .map((u) => u.trim())
          .filter((u) => u.startsWith("http://") || u.startsWith("https://"))
      )
    );

    if (extractedUrls.length === 0) {
      setError("Geçerli bir http:// veya https:// bağlantısı bulunamadı.");
      setAnalyzing(false);
      return;
    }

    const initialBatch: BatchItem[] = extractedUrls.map((url, idx) => ({
      id: `item_${Date.now()}_${idx}`,
      url,
      loading: true,
      selectedFormat: "mp4",
      selectedQuality: "best",
    }));

    setBatchItems(initialBatch);

    const analyzedResults = await Promise.all(
      initialBatch.map(async (item) => {
        try {
          const res = await fetch("/api/analyze", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ url: item.url }),
          });

          const data = await res.json();
          if (!res.ok) {
            throw new Error(data.error || "Medya analizi başarısız oldu.");
          }

          return {
            ...item,
            loading: false,
            metadata: data,
            selectedQuality: data.defaultVideoFormats?.[0]?.quality || "best",
          };
        } catch (err: any) {
          return {
            ...item,
            loading: false,
            error: err.message || "Analiz hatası oluştu.",
          };
        }
      })
    );

    setBatchItems(analyzedResults);
    setAnalyzing(false);
  };

  // Start single or batch download
  const handleStartBatchDownload = async () => {
    const validItems = batchItems.filter((i) => i.metadata && !i.loading);
    if (validItems.length === 0) return;

    setError(null);

    try {
      const startedJobs: ActiveJob[] = [];

      for (const item of validItems) {
        if (!item.metadata) continue;

        const res = await fetch("/api/download", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            url: item.metadata.url,
            format: item.selectedFormat,
            quality: item.selectedQuality,
            title: item.metadata.title,
            thumbnail: item.metadata.thumbnail,
          }),
        });

        const data = await res.json();
        if (res.ok) {
          startedJobs.push(data);
        }
      }

      setActiveJobsList((prev) => [...startedJobs, ...prev]);
    } catch (err: any) {
      setError(err.message || "İndirme başlatılırken hata oluştu.");
    }
  };

  const handleDeleteHistoryItem = async (filename?: string) => {
    try {
      await fetch(`/api/history?filename=${encodeURIComponent(filename || "")}`, { method: "DELETE" });
      fetchHistory();
    } catch (e) {
      console.error("Delete error:", e);
    }
  };

  const handleClearHistory = async () => {
    if (confirm("Tüm indirme geçmişini silmek istediğinize emin misiniz?")) {
      try {
        await fetch("/api/history", { method: "DELETE" });
        fetchHistory();
      } catch (e) {
        console.error("Clear error:", e);
      }
    }
  };

  return (
    <main className="min-h-screen pb-20 pt-6 px-4 max-w-5xl mx-auto flex flex-col items-center">
      {/* Header Bar */}
      <header className="w-full flex flex-col md:flex-row items-center justify-between gap-4 mb-8 py-3 px-6 glass-card rounded-2xl border border-white/10">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-tr from-purple-600 via-indigo-500 to-cyan-400 p-0.5 flex items-center justify-center shadow-lg shadow-purple-500/30">
            <div className="w-full h-full bg-slate-950 rounded-[10px] flex items-center justify-center">
              <Download className="w-6 h-6 text-cyan-400 animate-pulse" />
            </div>
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-bold text-gradient">StreamPulse</h1>
              <span className="text-[11px] font-semibold tracking-wider px-2 py-0.5 rounded-full bg-purple-500/20 text-purple-300 border border-purple-500/30 uppercase">
                Bana Özel
              </span>
            </div>
            <p className="text-xs text-slate-400">Tekli & Toplu İndirme + Reklamsız Canlı İzleme Portalı</p>
          </div>
        </div>

        {/* Tab Switcher */}
        <div className="flex flex-col sm:flex-row w-full md:w-auto items-stretch sm:items-center gap-1 bg-slate-900/80 p-1.5 rounded-xl border border-white/5">
          <button
            onClick={() => setActiveTab("downloader")}
            className={`flex justify-center items-center gap-2 px-4 py-2 rounded-lg text-xs font-medium transition-all ${
              activeTab === "downloader"
                ? "bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow-md shadow-purple-500/20"
                : "text-slate-400 hover:text-white"
            }`}
          >
            <Sparkles className="w-4 h-4" />
            İndirici & Canlı İzleme
          </button>
          <button
            onClick={() => setActiveTab("history")}
            className={`flex justify-center items-center gap-2 px-4 py-2 rounded-lg text-xs font-medium transition-all ${
              activeTab === "history"
                ? "bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow-md shadow-purple-500/20"
                : "text-slate-400 hover:text-white"
            }`}
          >
            <History className="w-4 h-4" />
            İndirilenler ({history.length})
          </button>
        </div>
      </header>

      {activeTab === "downloader" ? (
        <div className="w-full flex flex-col items-center gap-6">
          {/* Hero Section */}
          <div className="text-center max-w-2xl my-2">
            <motion.h2
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-3xl md:text-5xl font-extrabold tracking-tight mb-3"
            >
              Her Siteden <span className="text-gradient">Reklamsız İzle & İndir</span>
            </motion.h2>
            <p className="text-sm md:text-base text-slate-400">
              Reklamlarla uğraşmadan tüm film, dizi ve videoları <span className="text-cyan-300 font-semibold">kendi sitenizde reklamsız canlı izleyin</span> veya tekli/toplu olarak anında indirin.
            </p>
          </div>

          {/* Search / Input Box */}
          <div className="w-full glass-card p-4 md:p-6 rounded-3xl border border-white/10 shadow-2xl relative overflow-hidden">
            <div className="absolute top-0 right-0 w-64 h-64 bg-purple-600/10 rounded-full blur-3xl pointer-events-none" />
            <div className="absolute bottom-0 left-0 w-64 h-64 bg-cyan-600/10 rounded-full blur-3xl pointer-events-none" />

            {/* Single vs Bulk Mode Toggle */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-3 px-1 gap-2">
              <span className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
                <Link2 className="w-4 h-4 text-cyan-400" />
                {isBulkMode ? "Toplu İndirme Modu (Her satıra bir link)" : "Tekli İndirme & İzleme Modu"}
              </span>
              <button
                onClick={() => setIsBulkMode(!isBulkMode)}
                className="text-xs font-semibold text-purple-300 hover:text-purple-200 flex items-center gap-1 bg-purple-500/10 px-3 py-1 rounded-lg border border-purple-500/20 transition-all"
              >
                <Layers className="w-3.5 h-3.5" />
                {isBulkMode ? "Tekli Mod" : "⚡ Toplu İndirme Modu"}
              </button>
            </div>

            <div className="flex flex-col md:flex-row gap-3 relative z-10">
              <div className="relative flex-1">
                {isBulkMode ? (
                  <textarea
                    rows={4}
                    value={inputText}
                    onChange={(e) => {
                      setInputText(e.target.value);
                      if (error) setError(null);
                    }}
                    placeholder="İndirmek istediğiniz bağlantıları her satıra bir tane gelecek şekilde ekleyin:&#10;https://www.youtube.com/watch?v=...&#10;https://yabancidizi.news/film/supergirl&#10;https://www.instagram.com/reel/..."
                    className="w-full p-4 rounded-2xl glass-input text-xs md:text-sm placeholder-slate-500 resize-none font-mono"
                  />
                ) : (
                  <input
                    type="url"
                    value={inputText}
                    onChange={(e) => {
                      setInputText(e.target.value);
                      if (error) setError(null);
                    }}
                    onKeyDown={(e) => e.key === "Enter" && handleAnalyze()}
                    placeholder="Link yapıştırın (YouTube, Insta vb.)"
                    className="w-full pl-3 pr-24 py-3 md:pl-4 md:py-4 rounded-2xl glass-input text-sm md:text-base placeholder-slate-500"
                  />
                )}

                {inputText ? (
                  <button
                    onClick={() => {
                      setInputText("");
                      setBatchItems([]);
                    }}
                    className="absolute top-3 right-3 text-slate-400 hover:text-white p-1"
                  >
                    <X className="w-5 h-5" />
                  </button>
                ) : (
                  !isBulkMode && (
                    <button
                      onClick={handlePaste}
                      className="absolute inset-y-0 right-3 my-auto h-9 px-3 flex items-center gap-1.5 text-xs font-semibold rounded-xl bg-purple-500/20 text-purple-300 border border-purple-500/30 hover:bg-purple-500/30 transition-all"
                    >
                      <Clipboard className="w-3.5 h-3.5" />
                      Yapıştır
                    </button>
                  )
                )}
              </div>

              <button
                onClick={() => handleAnalyze()}
                disabled={isMounted ? analyzing || !inputText.trim() : false}
                className="w-full md:w-auto px-6 py-3 md:px-8 md:py-4 rounded-2xl bg-gradient-to-r from-purple-600 via-indigo-600 to-cyan-500 hover:opacity-90 disabled:opacity-50 text-white font-semibold text-sm md:text-base flex items-center justify-center gap-2 shadow-lg shadow-purple-600/30 transition-all active:scale-[0.98] shrink-0"
              >
                {analyzing ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Analiz Ediliyor...
                  </>
                ) : (
                  <>
                    <Sparkles className="w-5 h-5" />
                    {isBulkMode ? "Toplu Analiz Et" : "Analiz Et"}
                  </>
                )}
              </button>
            </div>

            {/* Platform Quick Badges */}
            <div className="mt-4 pt-4 border-t border-white/5 flex flex-wrap items-center gap-2">
              <span className="text-xs text-slate-400 mr-2 flex items-center gap-1">
                <Globe className="w-3.5 h-3.5 text-cyan-400" />
                Desteklenen Platformlar:
              </span>
              {SUPPORTED_PLATFORMS.map((plat, idx) => {
                const Icon = plat.icon;
                return (
                  <span
                    key={idx}
                    className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium border ${plat.bg} ${plat.color}`}
                  >
                    <Icon className="w-3.5 h-3.5" />
                    {plat.name}
                  </span>
                );
              })}
            </div>
          </div>

          {/* Error Message */}
          <AnimatePresence>
            {error && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className="w-full p-4 rounded-2xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm flex items-start gap-3"
              >
                <AlertCircle className="w-5 h-5 text-red-400 shrink-0 mt-0.5" />
                <div className="flex-1">
                  <p className="font-semibold">Hata Oluştu</p>
                  <p className="text-xs text-red-300/80 mt-0.5 whitespace-pre-line">{error}</p>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Active Downloading Progress Cards */}
          <AnimatePresence>
            {activeJobsList.length > 0 && (
              <div className="w-full flex flex-col gap-3">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-bold text-white flex items-center gap-2">
                    <Download className="w-4 h-4 text-cyan-400 animate-bounce" />
                    Devam Eden İndirmeler ({activeJobsList.filter((j) => j.status !== "completed").length})
                  </h3>
                </div>

                <div className="grid grid-cols-1 gap-3">
                  {activeJobsList.map((job) => (
                    <motion.div
                      key={job.id}
                      initial={{ opacity: 0, scale: 0.98 }}
                      animate={{ opacity: 1, scale: 1 }}
                      className="glass-card p-4 rounded-2xl border border-purple-500/30 relative overflow-hidden shadow-xl"
                    >
                      <div className="flex flex-col sm:flex-row gap-4 items-center">
                        {job.thumbnail ? (
                          <img
                            src={job.thumbnail}
                            alt={job.title}
                            className="w-full sm:w-20 h-40 sm:h-20 object-cover rounded-xl border border-white/10 shadow-md shrink-0"
                          />
                        ) : (
                          <div className="w-full sm:w-20 h-40 sm:h-20 rounded-xl bg-gradient-to-tr from-purple-900/50 to-slate-900 border border-white/10 flex items-center justify-center text-purple-400 shrink-0">
                            {job.format === "mp3" ? <Music className="w-8 h-8" /> : <Film className="w-8 h-8" />}
                          </div>
                        )}

                        <div className="flex-1 w-full min-w-0">
                          <div className="flex items-center justify-between mb-1">
                            <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">
                              {job.format.toUpperCase()} • {job.quality}
                            </span>
                            <span className="text-xs text-slate-400">
                              {job.status === "completed"
                                ? "✓ Tamamlandı"
                                : job.status === "converting"
                                ? "⚙️ Dönüştürülüyor..."
                                : job.status === "error"
                                ? "❌ Hata"
                                : `${Math.round(job.progress)}%`}
                            </span>
                          </div>

                          <h4 className="text-xs font-semibold text-white truncate mb-2">{job.title}</h4>

                          <div className="w-full h-2.5 bg-slate-900 rounded-full overflow-hidden p-0.5 border border-white/10 mb-2">
                            <motion.div
                              className="h-full bg-gradient-to-r from-purple-500 via-cyan-400 to-emerald-400 rounded-full"
                              initial={{ width: "0%" }}
                              animate={{ width: `${job.progress}%` }}
                              transition={{ duration: 0.4 }}
                            />
                          </div>

                          <div className="flex items-center justify-between text-[11px] text-slate-400">
                            <span>{job.speed ? `Hız: ${job.speed}` : "İndiriliyor..."}</span>
                            <span>{job.eta ? `Kalan: ${job.eta}` : ""}</span>
                          </div>

                          {job.status === "completed" && job.downloadUrl && (
                            <div className="mt-3 flex gap-2 pt-2 border-t border-white/10">
                              <a
                                href={job.downloadUrl}
                                download
                                className="flex-1 py-2 px-3 rounded-lg bg-gradient-to-r from-emerald-500 to-teal-600 text-white font-semibold text-xs flex items-center justify-center gap-1.5 shadow-md hover:opacity-95 transition-all"
                              >
                                <Download className="w-3.5 h-3.5" />
                                Kaydet ({job.filesize || "İndir"})
                              </a>
                              <button
                                onClick={() =>
                                  setPlayingItem({
                                    url: job.downloadUrl!,
                                    title: job.title,
                                    type: job.format === "mp3" ? "audio" : "video",
                                  })
                                }
                                className="py-2 px-3 rounded-lg bg-purple-500/20 text-purple-300 border border-purple-500/30 text-xs font-semibold flex items-center gap-1 hover:bg-purple-500/30 transition-all"
                              >
                                <Play className="w-3.5 h-3.5" />
                                Oynat
                              </button>
                            </div>
                          )}
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </div>
            )}
          </AnimatePresence>

          {/* Analyzed Batch / Single Items List */}
          <AnimatePresence>
            {batchItems.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 20 }}
                className="w-full flex flex-col gap-4"
              >
                <div className="flex items-center justify-between">
                  <h3 className="text-base font-bold text-white flex items-center gap-2">
                    <ListPlus className="w-5 h-5 text-purple-400" />
                    Analiz Edilen Medyalar ({batchItems.filter((i) => i.metadata).length}/{batchItems.length})
                  </h3>
                  {batchItems.filter((i) => i.metadata).length > 0 && (
                    <button
                      onClick={handleStartBatchDownload}
                      className="py-2.5 px-6 rounded-xl bg-gradient-to-r from-emerald-500 via-teal-500 to-cyan-500 text-white font-bold text-xs md:text-sm flex items-center gap-2 shadow-lg shadow-emerald-500/20 hover:opacity-95 transition-all"
                    >
                      <Zap className="w-4 h-4" />
                      Tümünü İndir ({batchItems.filter((i) => i.metadata).length} Medya)
                    </button>
                  )}
                </div>

                <div className="grid grid-cols-1 gap-4">
                  {batchItems.map((item, idx) => (
                    <div
                      key={item.id}
                      className="glass-card p-4 md:p-6 rounded-3xl border border-white/10 shadow-2xl relative overflow-hidden"
                    >
                      {item.loading ? (
                        <div className="flex items-center justify-center py-8 gap-3 text-slate-400">
                          <Loader2 className="w-6 h-6 animate-spin text-purple-400" />
                          <span className="text-sm">Medya #{idx + 1} Analiz Ediliyor... ({item.url})</span>
                        </div>
                      ) : item.error ? (
                        <div className="p-4 rounded-2xl bg-red-500/10 border border-red-500/20 text-red-300 text-xs">
                          <p className="font-bold">Analiz Edilemedi (#{idx + 1})</p>
                          <p className="mt-1">{item.error}</p>
                          <p className="text-[10px] text-slate-500 mt-1 truncate">{item.url}</p>
                        </div>
                      ) : item.metadata ? (
                        <div className="flex flex-col md:flex-row gap-6">
                          {/* Thumbnail / Poster Image */}
                          <div className="relative rounded-2xl overflow-hidden aspect-video md:w-72 shrink-0 border border-white/10 shadow-xl bg-slate-950 flex items-center justify-center group">
                            {item.metadata.thumbnail ? (
                              <img
                                src={item.metadata.thumbnail}
                                alt={item.metadata.title}
                                className="w-full h-full object-cover group-hover:scale-105 transition-all duration-300"
                                onError={(e) => {
                                  (e.target as HTMLElement).style.display = "none";
                                }}
                              />
                            ) : (
                              <div className="w-full h-full bg-gradient-to-tr from-purple-900/40 via-slate-900 to-cyan-900/40 flex flex-col items-center justify-center text-purple-300 p-4 text-center">
                                <Film className="w-10 h-10 mb-2 opacity-80" />
                                <span className="text-xs font-semibold">{item.metadata.title}</span>
                              </div>
                            )}
                            <span className="absolute bottom-2 right-2 px-2 py-0.5 rounded bg-black/80 backdrop-blur-md text-[11px] font-mono text-cyan-300 border border-white/10">
                              {item.metadata.durationFormatted}
                            </span>
                            <span className="absolute top-2 left-2 px-2 py-0.5 rounded bg-purple-600/80 backdrop-blur-md text-[10px] font-semibold text-white uppercase">
                              {item.metadata.extractor}
                            </span>
                          </div>

                          {/* Options & Action Buttons */}
                          <div className="flex-1 flex flex-col justify-between">
                            <div>
                              <h4 className="text-base font-bold text-white mb-1 line-clamp-2">{item.metadata.title}</h4>
                              <p className="text-xs text-slate-400 mb-3">Yayıncı: {item.metadata.uploader}</p>

                              <div className="flex flex-wrap items-center gap-3 mb-4">
                                <div className="flex w-full sm:w-auto bg-slate-900/80 p-1 rounded-xl border border-white/10">
                                  <button
                                    onClick={() => {
                                      const updated = [...batchItems];
                                      updated[idx].selectedFormat = "mp4";
                                      setBatchItems(updated);
                                    }}
                                    className={`flex-1 justify-center px-3 py-1.5 rounded-lg text-xs font-medium flex items-center gap-1.5 transition-all ${
                                      item.selectedFormat === "mp4"
                                        ? "bg-purple-600 text-white shadow-md"
                                        : "text-slate-400 hover:text-white"
                                    }`}
                                  >
                                    <Video className="w-3.5 h-3.5" />
                                    MP4 (Video)
                                  </button>
                                  <button
                                    onClick={() => {
                                      const updated = [...batchItems];
                                      updated[idx].selectedFormat = "mp3";
                                      setBatchItems(updated);
                                    }}
                                    className={`flex-1 justify-center px-3 py-1.5 rounded-lg text-xs font-medium flex items-center gap-1.5 transition-all ${
                                      item.selectedFormat === "mp3"
                                        ? "bg-cyan-600 text-white shadow-md"
                                        : "text-slate-400 hover:text-white"
                                    }`}
                                  >
                                    <Music className="w-3.5 h-3.5" />
                                    MP3 (Ses)
                                  </button>
                                </div>

                                <select
                                  value={item.selectedQuality}
                                  onChange={(e) => {
                                    const updated = [...batchItems];
                                    updated[idx].selectedQuality = e.target.value;
                                    setBatchItems(updated);
                                  }}
                                  className="w-full sm:w-auto py-1.5 px-3 rounded-xl bg-slate-900 border border-white/10 text-xs font-medium text-purple-200 outline-none focus:border-purple-500"
                                >
                                  {(item.selectedFormat === "mp4"
                                    ? item.metadata.defaultVideoFormats
                                    : item.metadata.defaultAudioFormats
                                  ).map((q) => (
                                    <option key={q.quality} value={q.quality}>
                                      {q.label}
                                    </option>
                                  ))}
                                </select>
                              </div>
                            </div>

                            {/* Dual Action Buttons: Live Ad-Free Stream VS Download */}
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                              <button
                                onClick={() =>
                                  setCinemaItem({
                                    streamUrl: item.metadata!.streamUrl || item.metadata!.url,
                                    title: item.metadata!.title,
                                    thumbnail: item.metadata!.thumbnail,
                                  })
                                }
                                className="py-3 rounded-xl bg-gradient-to-r from-cyan-600 to-emerald-600 hover:opacity-95 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-lg shadow-cyan-600/20 transition-all active:scale-[0.98]"
                              >
                                <Tv className="w-4 h-4 text-emerald-300" />
                                🎬 Canlı İzle (Reklamsız)
                              </button>

                              <button
                                onClick={async () => {
                                  const res = await fetch("/api/download", {
                                    method: "POST",
                                    headers: { "Content-Type": "application/json" },
                                    body: JSON.stringify({
                                      url: item.metadata!.url,
                                      format: item.selectedFormat,
                                      quality: item.selectedQuality,
                                      title: item.metadata!.title,
                                      thumbnail: item.metadata!.thumbnail,
                                    }),
                                  });
                                  const data = await res.json();
                                  if (res.ok) {
                                    setActiveJobsList((prev) => [data, ...prev]);
                                  }
                                }}
                                className="py-3 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:opacity-95 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-lg shadow-purple-600/20 transition-all active:scale-[0.98]"
                              >
                                <Download className="w-4 h-4" />
                                Medyayı İndir
                              </button>
                            </div>
                          </div>
                        </div>
                      ) : null}
                    </div>
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      ) : (
        /* History Tab */
        <div className="w-full flex flex-col gap-4">
          <div className="flex items-center justify-between mb-2">
            <div>
              <h2 className="text-2xl font-bold text-white">İndirme Geçmişim</h2>
              <p className="text-xs text-slate-400">İndirdiğiniz tüm medya dosyaları burada saklanır</p>
            </div>
            {history.length > 0 && (
              <button
                onClick={handleClearHistory}
                className="px-3 py-1.5 rounded-xl bg-red-500/10 text-red-400 border border-red-500/20 text-xs font-semibold hover:bg-red-500/20 transition-all flex items-center gap-1.5"
              >
                <Trash2 className="w-3.5 h-3.5" />
                Geçmişi Temizle
              </button>
            )}
          </div>

          {history.length === 0 ? (
            <div className="w-full glass-card p-12 rounded-3xl border border-white/10 text-center flex flex-col items-center justify-center">
              <HardDrive className="w-12 h-12 text-slate-600 mb-3" />
              <p className="text-base font-semibold text-slate-300">Henüz İndirilmiş Medya Yok</p>
              <p className="text-xs text-slate-500 mt-1 max-w-xs">
                İndirici sekmesinden video veya müzik bağlantısı girerek indirmeye başlayın.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {history.map((item) => (
                <div key={item.id} className="glass-card p-4 rounded-2xl border border-white/10 flex flex-col sm:flex-row gap-4 items-start sm:items-center">
                  {item.thumbnail ? (
                    <img src={item.thumbnail} alt={item.title} className="w-full sm:w-20 h-40 sm:h-20 object-cover rounded-xl border border-white/10 shrink-0" />
                  ) : (
                    <div className="w-full sm:w-20 h-40 sm:h-20 rounded-xl bg-slate-900 border border-white/10 flex items-center justify-center text-slate-500 shrink-0">
                      {item.format === "mp3" ? <Music className="w-8 h-8 text-cyan-400" /> : <Video className="w-8 h-8 text-purple-400" />}
                    </div>
                  )}

                  <div className="flex-1 min-w-0 w-full">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded bg-purple-500/20 text-purple-300 border border-purple-500/30">
                        {item.format}
                      </span>
                      <span className="text-xs text-slate-400">{item.filesize || ""}</span>
                    </div>
                    <h4 className="text-xs font-semibold text-white truncate mb-2">{item.title}</h4>

                    <div className="flex flex-wrap items-center gap-2">
                      {item.downloadUrl && (
                        <>
                          <a
                            href={item.downloadUrl}
                            download
                            className="p-2 rounded-lg bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-xs font-medium flex items-center justify-center flex-1 sm:flex-none gap-1 hover:bg-emerald-500/30 transition-all"
                          >
                            <Download className="w-3.5 h-3.5" />
                            <span className="sm:hidden">İndir</span>
                          </a>
                          <button
                            onClick={() =>
                              setPlayingItem({
                                url: item.downloadUrl!,
                                title: item.title,
                                type: item.format === "mp3" ? "audio" : "video",
                              })
                            }
                            className="p-2 rounded-lg bg-purple-500/20 text-purple-300 border border-purple-500/30 text-xs font-medium flex items-center justify-center flex-1 sm:flex-none gap-1 hover:bg-purple-500/30 transition-all"
                          >
                            <Play className="w-3.5 h-3.5" />
                            <span className="sm:hidden">Oynat</span>
                          </button>
                          <button
                            onClick={() =>
                              setQrCodeItem({
                                url: item.downloadUrl!,
                                title: item.title,
                              })
                            }
                            className="p-2 rounded-lg bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 text-xs font-medium flex items-center justify-center gap-1 hover:bg-cyan-500/30 transition-all"
                            title="Telefona QR Kod ile Aktar"
                          >
                            <QrCode className="w-3.5 h-3.5" />
                          </button>
                        </>
                      )}
                      <button
                        onClick={() => handleDeleteHistoryItem(item.filename)}
                        className="p-2 rounded-lg bg-slate-800 text-slate-400 hover:text-red-400 hover:bg-red-500/10 transition-all sm:ml-auto"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Built-in Media Player Modal for downloaded items */}
      <AnimatePresence>
        {playingItem && (
          <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-xl flex items-center justify-center p-4">
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="w-full max-w-2xl glass-card p-6 rounded-3xl border border-white/20 relative shadow-2xl"
            >
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-bold text-white line-clamp-1 pr-4">{playingItem.title}</h3>
                <button onClick={() => setPlayingItem(null)} className="p-1.5 rounded-full bg-slate-800 text-slate-400 hover:text-white">
                  <X className="w-5 h-5" />
                </button>
              </div>

              {playingItem.type === "video" ? (
                <video src={`${playingItem.url}?inline=true`} controls autoPlay className="w-full rounded-2xl max-h-[60vh] bg-black" />
              ) : (
                <div className="py-8 flex flex-col items-center justify-center gap-4 bg-slate-950/80 rounded-2xl border border-white/10">
                  <div className="w-16 h-16 rounded-full bg-purple-500/20 text-purple-400 flex items-center justify-center animate-pulse">
                    <Music className="w-8 h-8" />
                  </div>
                  <audio src={`${playingItem.url}?inline=true`} controls autoPlay className="w-full px-6" />
                </div>
              )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* QRCode Modal Share */}
      <AnimatePresence>
        {qrCodeItem && (
          <QRCodeModal
            url={qrCodeItem.url}
            title={qrCodeItem.title}
            onClose={() => setQrCodeItem(null)}
          />
        )}
      </AnimatePresence>

      {/* Background Audio Player Bar */}
      <AnimatePresence>
        {activePlaylistTrackIndex !== null && history.filter((i) => i.format === "mp3").length > 0 && (
          <AudioPlayerBar
            playlist={history.filter((i) => i.format === "mp3" && i.downloadUrl).map((i) => ({
              id: i.id,
              title: i.title,
              downloadUrl: i.downloadUrl!,
              thumbnail: i.thumbnail,
            }))}
            currentIndex={activePlaylistTrackIndex}
            onSelectTrack={(idx) => setActivePlaylistTrackIndex(idx)}
            onClose={() => setActivePlaylistTrackIndex(null)}
          />
        )}
      </AnimatePresence>

      {/* Ad-Free Live Streaming Cinema Player Modal */}
      <AnimatePresence>
        {cinemaItem && (
          <CinemaPlayer
            streamUrl={cinemaItem.streamUrl}
            title={cinemaItem.title}
            thumbnail={cinemaItem.thumbnail}
            onClose={() => setCinemaItem(null)}
          />
        )}
      </AnimatePresence>
    </main>
  );
}
