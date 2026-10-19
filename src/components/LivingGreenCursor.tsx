import { useEffect, useRef, useState } from "react";

interface ParticleTrail {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  alpha: number;
}

export function LivingGreenCursor() {
  const [isVisible, setIsVisible] = useState(false);
  const [isHoveringInteractive, setIsHoveringInteractive] = useState(false);
  const [isPressed, setIsPressed] = useState(false);

  // Position state (interpolated with spring physics)
  const targetPos = useRef({ x: -100, y: -100 });
  const currentPos = useRef({ x: -100, y: -100 });
  const trails = useRef<ParticleTrail[]>([
    { x: -100, y: -100, vx: 0, vy: 0, size: 4.5, alpha: 0.65 },
    { x: -100, y: -100, vx: 0, vy: 0, size: 3.5, alpha: 0.5 },
    { x: -100, y: -100, vx: 0, vy: 0, size: 2.8, alpha: 0.4 },
    { x: -100, y: -100, vx: 0, vy: 0, size: 2.0, alpha: 0.25 },
  ]);

  const mainPollenRef = useRef<HTMLDivElement>(null);
  const haloRef = useRef<HTMLDivElement>(null);
  const trailRefs = useRef<(HTMLDivElement | null)[]>([]);

  useEffect(() => {
    let animId = 0;
    let time = 0;

    const handlePointerMove = (e: MouseEvent) => {
      targetPos.current = { x: e.clientX, y: e.clientY };
      setIsVisible(true);

      // Check if hovering over clickable/interactive elements
      const target = e.target as HTMLElement | null;
      if (
        target &&
        (target.tagName === "BUTTON" ||
          target.tagName === "A" ||
          target.tagName === "INPUT" ||
          target.tagName === "TEXTAREA" ||
          target.closest("button") ||
          target.closest("a") ||
          target.getAttribute("role") === "button")
      ) {
        setIsHoveringInteractive(true);
      } else {
        setIsHoveringInteractive(false);
      }
    };

    const handlePointerEnter = () => setIsVisible(true);
    const handlePointerLeave = () => setIsVisible(false);
    const handlePointerDown = () => setIsPressed(true);
    const handlePointerUp = () => setIsPressed(false);

    // Attach to parent window
    window.addEventListener("mousemove", handlePointerMove);
    document.addEventListener("mouseenter", handlePointerEnter);
    document.addEventListener("mouseleave", handlePointerLeave);
    window.addEventListener("mousedown", handlePointerDown);
    window.addEventListener("mouseup", handlePointerUp);

    // Attach to iframe if present (same-origin iframe in SylvaHero)
    const attachToIframe = () => {
      const iframe = document.querySelector("iframe");
      if (!iframe) return;
      try {
        const iWin = iframe.contentWindow;
        if (iWin) {
          iWin.addEventListener("mousemove", (e: MouseEvent) => {
            const rect = iframe.getBoundingClientRect();
            handlePointerMove({
              ...e,
              clientX: e.clientX + rect.left,
              clientY: e.clientY + rect.top,
              target: e.target,
            } as MouseEvent);
          });
          iWin.addEventListener("mouseenter", handlePointerEnter);
          iWin.addEventListener("mouseleave", handlePointerLeave);
          iWin.addEventListener("mousedown", handlePointerDown);
          iWin.addEventListener("mouseup", handlePointerUp);
        }
      } catch (err) {
        // Cross-origin fallback
      }
    };

    const iframe = document.querySelector("iframe");
    if (iframe) {
      iframe.addEventListener("load", attachToIframe);
      attachToIframe();
    }

    // Animation frame for organic floating pollen drift
    const animate = () => {
      time += 0.04;
      animId = requestAnimationFrame(animate);

      // Organic pollen drift wobble
      const wobbleX = Math.sin(time * 1.8) * 3.5;
      const wobbleY = Math.cos(time * 1.4) * 3.5;

      // Smooth exponential inertia to cursor target
      const lerpFactor = 0.22;
      currentPos.current.x += (targetPos.current.x + wobbleX - currentPos.current.x) * lerpFactor;
      currentPos.current.y += (targetPos.current.y + wobbleY - currentPos.current.y) * lerpFactor;

      const px = currentPos.current.x;
      const py = currentPos.current.y;

      // Update main pollen element
      if (mainPollenRef.current) {
        mainPollenRef.current.style.transform = `translate3d(${px}px, ${py}px, 0)`;
      }

      // Update halo element
      if (haloRef.current) {
        haloRef.current.style.transform = `translate3d(${px}px, ${py}px, 0)`;
      }

      // Update trailing micro-spores
      let prevX = px;
      let prevY = py;

      trails.current.forEach((trail, idx) => {
        const trailLerp = 0.28 - idx * 0.04;
        trail.x += (prevX - trail.x) * trailLerp;
        trail.y += (prevY - trail.y) * trailLerp;

        const trailEl = trailRefs.current[idx];
        if (trailEl) {
          trailEl.style.transform = `translate3d(${trail.x}px, ${trail.y}px, 0)`;
        }

        prevX = trail.x;
        prevY = trail.y;
      });
    };

    animate();

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener("mousemove", handlePointerMove);
      document.removeEventListener("mouseenter", handlePointerEnter);
      document.removeEventListener("mouseleave", handlePointerLeave);
      window.removeEventListener("mousedown", handlePointerDown);
      window.removeEventListener("mouseup", handlePointerUp);
    };
  }, []);

  return (
    <div
      className={`fixed inset-0 pointer-events-none z-50 transition-opacity duration-300 ${
        isVisible ? "opacity-100" : "opacity-0"
      }`}
      aria-hidden="true"
    >
      {/* Soft Bio-Luminescent Pollen Halo */}
      <div
        ref={haloRef}
        className={`absolute top-0 left-0 -ml-8 -mt-8 rounded-full pointer-events-none transition-all duration-300 ${
          isPressed
            ? "w-20 h-20 -ml-10 -mt-10 bg-[radial-gradient(circle,rgba(212,247,121,0.55)_0%,rgba(124,230,109,0.25)_45%,transparent_70%)]"
            : isHoveringInteractive
            ? "w-20 h-20 -ml-10 -mt-10 bg-[radial-gradient(circle,rgba(168,247,109,0.45)_0%,rgba(76,175,80,0.2)_50%,transparent_75%)]"
            : "w-16 h-16 bg-[radial-gradient(circle,rgba(212,247,121,0.35)_0%,rgba(76,175,80,0.12)_45%,transparent_70%)]"
        }`}
      />

      {/* Trailing Micro-Spores */}
      {trails.current.map((trail, idx) => (
        <div
          key={idx}
          ref={(el) => {
            trailRefs.current[idx] = el;
          }}
          className="absolute top-0 left-0 rounded-full pointer-events-none bg-[#e8fcc2] shadow-[0_0_8px_rgba(212,247,121,0.8)]"
          style={{
            width: `${trail.size}px`,
            height: `${trail.size}px`,
            marginLeft: `-${trail.size / 2}px`,
            marginTop: `-${trail.size / 2}px`,
            opacity: trail.alpha,
          }}
        />
      ))}

      {/* Main Living Green Pollen Particle Core */}
      <div
        ref={mainPollenRef}
        className={`absolute top-0 left-0 rounded-full pointer-events-none transition-transform duration-150 ${
          isPressed
            ? "w-4 h-4 -ml-2 -mt-2 scale-75 bg-[#faffd0] shadow-[0_0_16px_#d4f779,0_0_30px_#7ce66d]"
            : isHoveringInteractive
            ? "w-4 h-4 -ml-2 -mt-2 scale-125 bg-[#e4ffa8] border border-white/60 shadow-[0_0_14px_#a8f76d,0_0_24px_#4caf50]"
            : "w-3 h-3 -ml-1.5 -mt-1.5 bg-[#d4f779] shadow-[0_0_10px_#d4f779,0_0_20px_#7ce66d]"
        }`}
      >
        {/* Core highlight seed */}
        <div className="absolute inset-0.5 rounded-full bg-white/90 blur-[0.5px]" />
      </div>
    </div>
  );
}
