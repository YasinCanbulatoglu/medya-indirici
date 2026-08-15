"use client";

import React from "react";
import { QRCodeSVG } from "qrcode.react";
import { X, Smartphone, Download, Share2 } from "lucide-react";
import { motion } from "framer-motion";

interface QRCodeModalProps {
  url: string;
  title: string;
  onClose: () => void;
}

export default function QRCodeModal({ url, title, onClose }: QRCodeModalProps) {
  // Absolute download URL accessible from mobile on local Wi-Fi or domain
  const absoluteUrl = typeof window !== "undefined" ? new URL(url, window.location.origin).href : url;

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-xl flex items-center justify-center p-4">
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        className="w-full max-w-sm glass-card p-6 rounded-3xl border border-purple-500/30 text-center relative shadow-2xl flex flex-col items-center"
      >
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 rounded-full bg-slate-800 text-slate-400 hover:text-white transition-all"
        >
          <X className="w-4 h-4" />
        </button>

        <div className="w-12 h-12 rounded-2xl bg-purple-600/20 text-purple-400 flex items-center justify-center mb-3 border border-purple-500/30">
          <Smartphone className="w-6 h-6 animate-bounce" />
        </div>

        <h3 className="text-base font-bold text-white mb-1">Telefona Anında Aktar</h3>
        <p className="text-xs text-slate-400 mb-4 line-clamp-1">{title}</p>

        <div className="p-4 bg-white rounded-2xl shadow-xl border border-white/20 mb-4 flex items-center justify-center">
          <QRCodeSVG value={absoluteUrl} size={180} level="H" />
        </div>

        <p className="text-[11px] text-cyan-300 font-medium mb-3">
          📱 Telefonunuzun kamerasını okutarak filmi/müziği anında cep telefonunuza indirin!
        </p>

        <div className="w-full p-2.5 rounded-xl bg-slate-900 border border-white/10 text-[10px] font-mono text-slate-400 truncate">
          {absoluteUrl}
        </div>
      </motion.div>
    </div>
  );
}
