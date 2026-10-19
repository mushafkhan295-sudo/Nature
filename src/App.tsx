import { useRef } from "react";
import { motion, useScroll, useTransform } from "motion/react";
import { SylvaHero } from "@designcodeio/threeui";
import "@designcodeio/threeui/style.css";
import { FloatingNav } from "./components/FloatingNav";
import { LivingGreenCursor } from "./components/LivingGreenCursor";
import { AudioToggle } from "./components/AudioToggle";
import { Leaf, Compass, Dna, Box, Sparkles, ChevronDown } from "lucide-react";

export function Scene() {
  const containerRef = useRef<HTMLDivElement>(null);
  
  // Track page scroll position for the subtle parallax effect
  const { scrollY } = useScroll();

  // Subtle Framer Motion parallax transformations
  // Vertical displacement: glides gently as user scrolls down
  const heroY = useTransform(scrollY, [0, 1000], [0, 180]);
  // Subtle scaling: imparts a sense of organic physical depth
  const heroScale = useTransform(scrollY, [0, 1000], [1, 1.05]);
  // Soft atmospheric fade: creates depth separation between hero and foreground narrative
  const heroOpacity = useTransform(scrollY, [0, 900], [1, 0.45]);

  return (
    <div ref={containerRef} className="shader-frame relative">
      <LivingGreenCursor />
      <FloatingNav />
      <AudioToggle position="bottom-right" />

      {/* Sticky 3D Hero Viewport with subtle Framer Motion Parallax */}
      <div className="sticky top-0 w-full h-screen overflow-hidden">
        <motion.div
          style={{ y: heroY, scale: heroScale, opacity: heroOpacity }}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 1.5, ease: [0.22, 1, 0.36, 1] }}
          className="w-full h-full absolute inset-0"
        >
          <SylvaHero
            variant="living-green"
            headingFont="lexend"
            bodyFont="lexend"
            headingWeight="300"
            bodyWeight="300"
            primaryColor="#ffffff"
            headingSize={63}
            bodySize={16.5}
            headingLetterSpacing={-0.006}
          />
        </motion.div>

        {/* Scroll cue */}
        <motion.div
          style={{ opacity: useTransform(scrollY, [0, 150], [1, 0]) }}
          className="absolute bottom-6 left-1/2 -translate-x-1/2 flex flex-col items-center gap-1.5 pointer-events-none text-white/50 text-[11px] font-light tracking-widest uppercase"
        >
          <span>Scroll to Explore</span>
          <ChevronDown className="w-4 h-4 animate-bounce text-emerald-400" />
        </motion.div>
      </div>

      {/* Parallax Foreground Narrative Stream */}
      <section className="relative z-20 max-w-5xl mx-auto px-6 py-28 space-y-16 text-white pointer-events-auto">
        <div className="glass-panel p-8 sm:p-12 rounded-3xl border border-white/15 space-y-6 shadow-2xl">
          <div className="flex items-center gap-2 text-xs tracking-widest uppercase text-emerald-400 font-light">
            <Leaf className="w-4 h-4" />
            <span>Ecological Understory & Hydrology</span>
          </div>

          <h2 className="text-3xl sm:text-4xl font-light tracking-tight text-white leading-tight">
            The Living Architecture of Moss & Fern
          </h2>

          <p className="text-white/70 text-sm sm:text-base font-light leading-relaxed max-w-3xl">
            Beneath the canopy of ancient temperate forests, bryophytes and pteridophytes thrive without
            deep root systems. Capillary action channels moisture along cell wall margins, transforming
            mineral rock faces into lush velvet habitats that regulate local microclimates and shelter
            drifting pollinators.
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-4">
            <div className="p-5 rounded-2xl bg-white/[0.04] border border-white/10 space-y-2">
              <div className="text-xs uppercase tracking-wider text-emerald-300 font-mono">01 • Moisture</div>
              <h3 className="text-sm font-medium text-white">Capillary Leaflets</h3>
              <p className="text-xs text-white/60 font-light leading-relaxed">
                Water is transported directly across the leaf lamella via capillary cohesion, sustaining hydration through seasonal fog.
              </p>
            </div>

            <div className="p-5 rounded-2xl bg-white/[0.04] border border-white/10 space-y-2">
              <div className="text-xs uppercase tracking-wider text-emerald-300 font-mono">02 • Propulsion</div>
              <h3 className="text-sm font-medium text-white">Spore Catapults</h3>
              <p className="text-xs text-white/60 font-light leading-relaxed">
                Cavitation bubbles inside annulus cells release elastic tension, catapulting microscopic spores into canopy air currents.
              </p>
            </div>

            <div className="p-5 rounded-2xl bg-white/[0.04] border border-white/10 space-y-2">
              <div className="text-xs uppercase tracking-wider text-emerald-300 font-mono">03 • Symbiosis</div>
              <h3 className="text-sm font-medium text-white">Mycorrhizal Mesh</h3>
              <p className="text-xs text-white/60 font-light leading-relaxed">
                Sub-surface fungal hyphae weave through bryophyte rhizoids, distributing nitrogen and phosphorus across the forest floor.
              </p>
            </div>
          </div>
        </div>

        {/* Environmental Stewardship Seal */}
        <div className="text-center text-xs text-white/40 font-light space-y-2 pb-16">
          <p>Sylva Computational Ecosystem • Three.js WebGL & Bioscience Stewardship</p>
          <p className="font-mono text-[10px] text-emerald-400/60">LAT 47.8690° N, LONG 123.9317° W • TEMPERATE RAINFOREST BIOME</p>
        </div>
      </section>
    </div>
  );
}

export default function App() {
  return <Scene />;
}
