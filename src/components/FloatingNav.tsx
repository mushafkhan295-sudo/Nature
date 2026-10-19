import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  X,
  Sparkles,
  Send,
  CheckCircle2,
  Leaf,
  Compass,
  ArrowUpRight,
  Dna,
  Box,
  MapPin,
  Bot,
  BookOpen,
  Volume2,
  VolumeX,
} from "lucide-react";
import { Botanical3DStudio } from "./Botanical3DStudio";
import { BioscienceExplorer } from "./BioscienceExplorer";
import { MediaGenerator } from "./MediaGenerator";
import { HabitatScout } from "./HabitatScout";
import { BotanicaChat } from "./BotanicaChat";
import { FieldJournal } from "./FieldJournal";
import { forestAudio } from "../lib/forestAudio";

export type NavSection =
  | "about"
  | "gallery"
  | "contact"
  | "3d-studio"
  | "bioscience"
  | "media"
  | "scout"
  | "chat"
  | "journal"
  | null;

export function FloatingNav() {
  const [activeSection, setActiveSection] = useState<NavSection>(null);
  const [contactSubmitted, setContactSubmitted] = useState(false);
  const [contactForm, setContactForm] = useState({ name: "", email: "", message: "" });
  const [isAudioPlaying, setIsAudioPlaying] = useState(false);

  const handleToggleAudio = async () => {
    const newState = await forestAudio.toggle();
    setIsAudioPlaying(newState);
  };

  // Handle ESC key to close modal
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setActiveSection(null);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  const handleNavClick = (section: NavSection) => {
    setActiveSection((prev) => (prev === section ? null : section));
  };

  const handleContactSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!contactForm.email || !contactForm.message) return;
    setContactSubmitted(true);
    setTimeout(() => {
      setContactSubmitted(false);
      setActiveSection(null);
      setContactForm({ name: "", email: "", message: "" });
    }, 2200);
  };

  return (
    <>
      {/* Floating Top Navigation with Framer Motion entrance */}
      <motion.header
        initial={{ opacity: 0, y: -16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 1, delay: 0.2, ease: [0.22, 1, 0.36, 1] }}
        className="fixed top-3 sm:top-5 inset-x-0 mx-auto w-fit z-40 px-2 sm:px-4 pointer-events-auto max-w-[98vw]"
      >
        <nav
          aria-label="Main Navigation"
          className="glass-nav rounded-full px-3 sm:px-4 py-1.5 sm:py-2 flex items-center gap-1 sm:gap-1.5 text-white/80 transition-all duration-300 hover:border-white/25 hover:shadow-[0_16px_40px_rgba(0,0,0,0.5)] overflow-x-auto max-w-full"
        >
          {/* Brand mark */}
          <button
            onClick={() => setActiveSection(null)}
            className="flex items-center gap-2 px-2.5 py-1 text-xs tracking-widest uppercase font-light text-white/90 hover:text-white transition-colors cursor-pointer mr-0.5 shrink-0"
          >
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
            </span>
            <span className="font-medium text-white">Sylva</span>
          </button>

          <div className="h-3.5 w-px bg-white/15 mx-0.5 shrink-0" aria-hidden="true" />

          {/* Primary Exploration Links */}
          <button
            onClick={() => handleNavClick("about")}
            className={`px-2.5 py-1 text-xs font-light tracking-wider rounded-full transition-all duration-200 cursor-pointer shrink-0 ${
              activeSection === "about"
                ? "bg-white/20 text-white font-normal shadow-[0_2px_10px_rgba(255,255,255,0.15)]"
                : "hover:bg-white/10 hover:text-white"
            }`}
          >
            About
          </button>

          <button
            onClick={() => handleNavClick("gallery")}
            className={`px-2.5 py-1 text-xs font-light tracking-wider rounded-full transition-all duration-200 cursor-pointer shrink-0 ${
              activeSection === "gallery"
                ? "bg-white/20 text-white font-normal shadow-[0_2px_10px_rgba(255,255,255,0.15)]"
                : "hover:bg-white/10 hover:text-white"
            }`}
          >
            Gallery
          </button>

          <button
            onClick={() => handleNavClick("contact")}
            className={`px-2.5 py-1 text-xs font-light tracking-wider rounded-full transition-all duration-200 cursor-pointer shrink-0 ${
              activeSection === "contact"
                ? "bg-white/20 text-white font-normal shadow-[0_2px_10px_rgba(255,255,255,0.15)]"
                : "hover:bg-white/10 hover:text-white"
            }`}
          >
            Contact
          </button>

          <div className="h-3.5 w-px bg-white/15 mx-0.5 shrink-0" aria-hidden="true" />

          {/* Feature Suite Buttons */}
          <button
            onClick={() => handleNavClick("3d-studio")}
            className={`flex items-center gap-1.5 px-2.5 py-1 text-xs font-light tracking-wider rounded-full transition-all duration-200 cursor-pointer shrink-0 ${
              activeSection === "3d-studio"
                ? "bg-emerald-500 text-zinc-950 font-medium shadow-md"
                : "hover:bg-white/10 hover:text-white"
            }`}
          >
            <Box className="w-3.5 h-3.5" />
            <span>3D Studio</span>
          </button>

          <button
            onClick={() => handleNavClick("bioscience")}
            className={`flex items-center gap-1.5 px-2.5 py-1 text-xs font-light tracking-wider rounded-full transition-all duration-200 cursor-pointer shrink-0 ${
              activeSection === "bioscience"
                ? "bg-emerald-500 text-zinc-950 font-medium shadow-md"
                : "hover:bg-white/10 hover:text-white"
            }`}
          >
            <Dna className="w-3.5 h-3.5" />
            <span>Bioscience</span>
          </button>

          <button
            onClick={() => handleNavClick("media")}
            className={`flex items-center gap-1.5 px-2.5 py-1 text-xs font-light tracking-wider rounded-full transition-all duration-200 cursor-pointer shrink-0 ${
              activeSection === "media"
                ? "bg-emerald-500 text-zinc-950 font-medium shadow-md"
                : "hover:bg-white/10 hover:text-white"
            }`}
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>AI Media</span>
          </button>

          <button
            onClick={() => handleNavClick("scout")}
            className={`flex items-center gap-1.5 px-2.5 py-1 text-xs font-light tracking-wider rounded-full transition-all duration-200 cursor-pointer shrink-0 ${
              activeSection === "scout"
                ? "bg-emerald-500 text-zinc-950 font-medium shadow-md"
                : "hover:bg-white/10 hover:text-white"
            }`}
          >
            <MapPin className="w-3.5 h-3.5" />
            <span>Scout</span>
          </button>

          <button
            onClick={() => handleNavClick("chat")}
            className={`flex items-center gap-1.5 px-2.5 py-1 text-xs font-light tracking-wider rounded-full transition-all duration-200 cursor-pointer shrink-0 ${
              activeSection === "chat"
                ? "bg-emerald-500 text-zinc-950 font-medium shadow-md"
                : "hover:bg-white/10 hover:text-white"
            }`}
          >
            <Bot className="w-3.5 h-3.5" />
            <span>Botanica</span>
          </button>

          <button
            onClick={() => handleNavClick("journal")}
            className={`flex items-center gap-1.5 px-2.5 py-1 text-xs font-light tracking-wider rounded-full transition-all duration-200 cursor-pointer shrink-0 ${
              activeSection === "journal"
                ? "bg-emerald-500 text-zinc-950 font-medium shadow-md"
                : "hover:bg-white/10 hover:text-white"
            }`}
          >
            <BookOpen className="w-3.5 h-3.5" />
            <span>Journal</span>
          </button>

          <div className="h-3.5 w-px bg-white/15 mx-0.5 shrink-0" aria-hidden="true" />

          {/* Web Audio Ambient Forest Soundscape Toggle */}
          <button
            onClick={handleToggleAudio}
            title={isAudioPlaying ? "Mute Ambient Forest Audio" : "Play Ambient Forest Audio"}
            className={`flex items-center gap-1.5 px-3 py-1 text-xs tracking-wider rounded-full transition-all duration-200 cursor-pointer shrink-0 ${
              isAudioPlaying
                ? "bg-emerald-500/25 border border-emerald-400/60 text-white shadow-[0_0_12px_rgba(76,175,80,0.35)]"
                : "hover:bg-white/10 text-white/60 hover:text-white border border-transparent"
            }`}
          >
            {isAudioPlaying ? (
              <>
                <Volume2 className="w-3.5 h-3.5 text-emerald-300" />
                <span className="text-[11px] font-medium text-emerald-200">Forest Audio</span>
                <span className="flex items-end gap-0.5 h-3 ml-0.5">
                  <span className="w-0.5 h-2 bg-emerald-400 rounded-full animate-pulse" />
                  <span className="w-0.5 h-3 bg-emerald-300 rounded-full animate-pulse [animation-delay:150ms]" />
                  <span className="w-0.5 h-1.5 bg-emerald-400 rounded-full animate-pulse [animation-delay:300ms]" />
                </span>
              </>
            ) : (
              <>
                <VolumeX className="w-3.5 h-3.5 text-white/40" />
                <span className="text-[11px] font-light">Soundscape</span>
              </>
            )}
          </button>
        </nav>
      </motion.header>

      {/* Feature Modals */}
      {activeSection === "3d-studio" && (
        <Botanical3DStudio onClose={() => setActiveSection(null)} />
      )}

      {activeSection === "bioscience" && (
        <BioscienceExplorer onClose={() => setActiveSection(null)} />
      )}

      {activeSection === "media" && (
        <MediaGenerator onClose={() => setActiveSection(null)} />
      )}

      {activeSection === "scout" && (
        <HabitatScout onClose={() => setActiveSection(null)} />
      )}

      {activeSection === "chat" && (
        <BotanicaChat onClose={() => setActiveSection(null)} />
      )}

      {activeSection === "journal" && (
        <FieldJournal onClose={() => setActiveSection(null)} />
      )}

      {/* Detail Modals for About, Gallery, Contact */}
      <AnimatePresence>
        {(activeSection === "about" || activeSection === "gallery" || activeSection === "contact") && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.25 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-md pointer-events-auto"
            onClick={() => setActiveSection(null)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
              className="glass-panel w-full max-w-2xl max-h-[85vh] overflow-y-auto rounded-3xl p-6 sm:p-8 text-white relative border border-white/20 shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Close Button */}
              <button
                onClick={() => setActiveSection(null)}
                className="absolute top-5 right-5 p-2 rounded-full text-white/60 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
                aria-label="Close dialog"
              >
                <X className="w-5 h-5" />
              </button>

              {/* About Section */}
              {activeSection === "about" && (
                <div className="space-y-6">
                  <div className="flex items-center gap-2 text-xs tracking-widest uppercase text-emerald-400/90 font-light">
                    <Leaf className="w-4 h-4" />
                    <span>Ambient Ecological World</span>
                  </div>
                  <h2 className="text-2xl sm:text-3xl font-light tracking-tight text-white">
                    Into the Living World
                  </h2>
                  <p className="text-white/70 text-sm sm:text-base font-light leading-relaxed">
                    Sylva is a living computational landscape modeled after old-growth moss forest floors.
                    Combining procedural Three.js depth meshes, ambient spore simulation, and real-time
                    flutter physics, the environment responds continuously to user presence.
                  </p>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
                    <div className="bg-white/[0.04] border border-white/10 rounded-2xl p-4">
                      <div className="text-xs text-white/50 font-light uppercase tracking-wider">Atmosphere</div>
                      <div className="text-base font-light text-white mt-1">Drifting Pollen</div>
                      <div className="text-xs text-emerald-400/80 mt-1">Real-time particle dynamics</div>
                    </div>
                    <div className="bg-white/[0.04] border border-white/10 rounded-2xl p-4">
                      <div className="text-xs text-white/50 font-light uppercase tracking-wider">Flora Flora</div>
                      <div className="text-base font-light text-white mt-1">Moss & Fern Roots</div>
                      <div className="text-xs text-emerald-400/80 mt-1">Procedural heightfields</div>
                    </div>
                    <div className="bg-white/[0.04] border border-white/10 rounded-2xl p-4">
                      <div className="text-xs text-white/50 font-light uppercase tracking-wider">Fauna</div>
                      <div className="text-base font-light text-white mt-1">Landing Butterfly</div>
                      <div className="text-xs text-emerald-400/80 mt-1">Kinematic landing algorithm</div>
                    </div>
                  </div>

                  <div className="border-t border-white/10 pt-4 flex items-center justify-between text-xs text-white/50 font-light">
                    <span>Engine: Three.js • Custom Glsl Shaders</span>
                    <button
                      onClick={() => setActiveSection("gallery")}
                      className="flex items-center gap-1 text-white hover:text-emerald-300 transition-colors cursor-pointer"
                    >
                      <span>View Flora Gallery</span>
                      <ArrowUpRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              )}

              {/* Gallery Section */}
              {activeSection === "gallery" && (
                <div className="space-y-6">
                  <div className="flex items-center gap-2 text-xs tracking-widest uppercase text-emerald-400/90 font-light">
                    <Compass className="w-4 h-4" />
                    <span>Habitat Visual Archive</span>
                  </div>
                  <h2 className="text-2xl sm:text-3xl font-light tracking-tight text-white">
                    Ecosystem Gallery
                  </h2>
                  <p className="text-white/70 text-sm font-light">
                    Close-up photographic studies and atmospheric captures from the field studies powering Sylva.
                  </p>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                    <div className="group relative overflow-hidden rounded-2xl border border-white/15 bg-black/40">
                      <img
                        src="/landing-pages/inner-green-assets/card-ethos.jpg"
                        alt="A cushion of moss grown over lichen-crusted stones"
                        className="w-full h-44 object-cover object-center group-hover:scale-105 transition-transform duration-500"
                      />
                      <div className="p-4 bg-gradient-to-t from-black/80 via-black/40 to-transparent">
                        <h3 className="text-sm font-medium text-white">Lichen & Velvet Moss Carpet</h3>
                        <p className="text-xs text-white/60 font-light mt-0.5">Microscopic groundcover detail</p>
                      </div>
                    </div>

                    <div className="group relative overflow-hidden rounded-2xl border border-white/15 bg-black/40">
                      <img
                        src="/landing-pages/inner-green-assets/card-ecostove.jpg"
                        alt="Moss-covered boulders in a misty grove"
                        className="w-full h-44 object-cover object-center group-hover:scale-105 transition-transform duration-500"
                      />
                      <div className="p-4 bg-gradient-to-t from-black/80 via-black/40 to-transparent">
                        <h3 className="text-sm font-medium text-white">Mist Grove & Boulder Terraces</h3>
                        <p className="text-xs text-white/60 font-light mt-0.5">High-humidity microclimate study</p>
                      </div>
                    </div>
                  </div>

                  <div className="border-t border-white/10 pt-4 flex items-center justify-between text-xs text-white/50 font-light">
                    <span>High-resolution capture assets rendered in-situ</span>
                    <button
                      onClick={() => setActiveSection("contact")}
                      className="flex items-center gap-1 text-white hover:text-emerald-300 transition-colors cursor-pointer"
                    >
                      <span>Commission a study</span>
                      <ArrowUpRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              )}

              {/* Contact Section */}
              {activeSection === "contact" && (
                <div className="space-y-6">
                  <div className="flex items-center gap-2 text-xs tracking-widest uppercase text-emerald-400/90 font-light">
                    <Sparkles className="w-4 h-4" />
                    <span>Inquiries & Field Collaborations</span>
                  </div>
                  <h2 className="text-2xl sm:text-3xl font-light tracking-tight text-white">
                    Connect with Sylva
                  </h2>
                  <p className="text-white/70 text-sm font-light">
                    For spatial botanical installations, bespoke shader landscapes, or environmental research partnerships.
                  </p>

                  {contactSubmitted ? (
                    <div className="py-10 text-center space-y-3 bg-white/[0.04] border border-white/10 rounded-2xl">
                      <CheckCircle2 className="w-10 h-10 text-emerald-400 mx-auto animate-bounce" />
                      <h3 className="text-lg font-light text-white">Transmission Received</h3>
                      <p className="text-xs text-white/60 max-w-sm mx-auto font-light">
                        Thank you. We will be in touch shortly regarding your botanical world inquiry.
                      </p>
                    </div>
                  ) : (
                    <form onSubmit={handleContactSubmit} className="space-y-4 pt-1">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-xs font-light text-white/70 mb-1.5 uppercase tracking-wider">
                            Name
                          </label>
                          <input
                            type="text"
                            required
                            value={contactForm.name}
                            onChange={(e) => setContactForm({ ...contactForm, name: e.target.value })}
                            placeholder="Your name"
                            className="w-full px-3.5 py-2.5 rounded-xl bg-white/[0.06] border border-white/15 text-white placeholder-white/30 text-sm focus:outline-none focus:border-emerald-400/80 transition-colors"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-light text-white/70 mb-1.5 uppercase tracking-wider">
                            Email
                          </label>
                          <input
                            type="email"
                            required
                            value={contactForm.email}
                            onChange={(e) => setContactForm({ ...contactForm, email: e.target.value })}
                            placeholder="your.email@domain.com"
                            className="w-full px-3.5 py-2.5 rounded-xl bg-white/[0.06] border border-white/15 text-white placeholder-white/30 text-sm focus:outline-none focus:border-emerald-400/80 transition-colors"
                          />
                        </div>
                      </div>

                      <div>
                        <label className="block text-xs font-light text-white/70 mb-1.5 uppercase tracking-wider">
                          Inquiry / Project Scope
                        </label>
                        <textarea
                          required
                          rows={3}
                          value={contactForm.message}
                          onChange={(e) => setContactForm({ ...contactForm, message: e.target.value })}
                          placeholder="Tell us about your installation or ecological landscape..."
                          className="w-full px-3.5 py-2.5 rounded-xl bg-white/[0.06] border border-white/15 text-white placeholder-white/30 text-sm focus:outline-none focus:border-emerald-400/80 transition-colors resize-none"
                        />
                      </div>

                      <div className="flex items-center justify-between pt-2">
                        <span className="text-xs text-white/40 font-light">Responses sent within 24 hours</span>
                        <button
                          type="submit"
                          className="flex items-center gap-2 px-5 py-2.5 rounded-full bg-white text-zinc-950 font-normal text-xs uppercase tracking-wider hover:bg-emerald-300 transition-colors shadow-lg cursor-pointer"
                        >
                          <Send className="w-3.5 h-3.5" />
                          <span>Send Message</span>
                        </button>
                      </div>
                    </form>
                  )}
                </div>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
