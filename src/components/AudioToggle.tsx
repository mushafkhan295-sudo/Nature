import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Volume2, VolumeX, SlidersHorizontal } from "lucide-react";
import { forestAudio } from "../lib/forestAudio";

interface AudioToggleProps {
  position?: "bottom-right" | "bottom-left" | "top-right" | "top-left";
  className?: string;
}

export function AudioToggle({ position = "bottom-right", className = "" }: AudioToggleProps) {
  const [isPlaying, setIsPlaying] = useState(forestAudio.getStatus());
  const [volume, setVolume] = useState(forestAudio.getVolume());
  const [showVolumeSlider, setShowVolumeSlider] = useState(false);

  useEffect(() => {
    // Subscribe to global audio engine state changes
    const unsub = forestAudio.subscribe((playing) => {
      setIsPlaying(playing);
    });
    return () => unsub();
  }, []);

  const handleToggle = async () => {
    await forestAudio.toggle();
  };

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newVol = parseFloat(e.target.value);
    setVolume(newVol);
    forestAudio.setVolume(newVol);
  };

  const positionClasses = {
    "bottom-right": "bottom-6 right-6",
    "bottom-left": "bottom-6 left-6",
    "top-right": "top-20 right-6",
    "top-left": "top-20 left-6",
  }[position];

  return (
    <motion.aside
      initial={{ opacity: 0, scale: 0.85, y: 10 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      transition={{ duration: 0.8, delay: 0.6, ease: [0.22, 1, 0.36, 1] }}
      aria-label="Ambient Audio Controls"
      className={`fixed ${positionClasses} z-40 pointer-events-auto flex items-center gap-2 ${className}`}
    >
      {/* Volume Slider Drawer */}
      <AnimatePresence>
        {showVolumeSlider && isPlaying && (
          <motion.div
            initial={{ opacity: 0, width: 0, scale: 0.9 }}
            animate={{ opacity: 1, width: "auto", scale: 1 }}
            exit={{ opacity: 0, width: 0, scale: 0.9 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="glass-panel px-3.5 py-2 rounded-full flex items-center gap-2.5 shadow-2xl border border-white/20">
              <SlidersHorizontal className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
              <input
                type="range"
                min="0"
                max="1"
                step="0.02"
                value={volume}
                onChange={handleVolumeChange}
                aria-label="Forest soundscape volume"
                className="w-20 accent-emerald-400 cursor-pointer h-1.5"
              />
              <span className="text-[11px] font-mono text-white/70 w-7 text-right">
                {Math.round(volume * 100)}%
              </span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main Glassmorphic Audio Toggle Button */}
      <button
        onClick={handleToggle}
        onContextMenu={(e) => {
          e.preventDefault();
          setShowVolumeSlider(!showVolumeSlider);
        }}
        onMouseEnter={() => isPlaying && setShowVolumeSlider(true)}
        aria-label={isPlaying ? "Mute ambient forest soundscape" : "Play ambient forest soundscape"}
        className={`group relative flex items-center gap-2.5 px-4 py-2.5 rounded-full transition-all duration-300 shadow-2xl cursor-pointer ${
          isPlaying
            ? "glass-panel bg-emerald-950/50 border-emerald-400/50 text-white shadow-[0_0_24px_rgba(76,175,80,0.35)]"
            : "glass-nav text-white/70 hover:text-white hover:border-white/30"
        }`}
      >
        {/* Glow halo when active */}
        {isPlaying && (
          <span
            className="absolute -inset-0.5 rounded-full bg-gradient-to-r from-emerald-500/20 to-teal-500/20 blur-sm pointer-events-none"
            aria-hidden="true"
          />
        )}

        {/* Audio Icon with Dynamic Equalizer Animation */}
        <div className="relative flex items-center gap-2">
          {isPlaying ? (
            <>
              <Volume2 className="w-4 h-4 text-emerald-300 transition-transform group-hover:scale-110" />
              <span className="flex items-end gap-0.5 h-3">
                <span className="w-0.5 h-2 bg-emerald-400 rounded-full animate-pulse" />
                <span className="w-0.5 h-3 bg-emerald-300 rounded-full animate-pulse [animation-delay:150ms]" />
                <span className="w-0.5 h-1.5 bg-emerald-400 rounded-full animate-pulse [animation-delay:300ms]" />
              </span>
            </>
          ) : (
            <VolumeX className="w-4 h-4 text-white/50 transition-transform group-hover:scale-110" />
          )}
        </div>

        {/* Text Label */}
        <div className="flex flex-col text-left">
          <span className="text-xs font-light tracking-wide text-white leading-tight">
            {isPlaying ? "Forest Audio" : "Ambient Audio"}
          </span>
          <span className="text-[10px] text-white/40 tracking-wider font-light leading-none">
            {isPlaying ? "Birds & Wind" : "Web Audio"}
          </span>
        </div>
      </button>
    </motion.aside>
  );
}
