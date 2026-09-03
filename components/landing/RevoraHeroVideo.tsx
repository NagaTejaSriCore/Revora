"use client";

import React, { useEffect, useRef, useState } from "react";

export default function RevoraHeroVideo() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [reducedMotion, setReducedMotion] = useState(false);

  useEffect(() => {
    const mediaQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
    setReducedMotion(mediaQuery.matches);

    const handleMotionChange = (e: MediaQueryListEvent) => {
      setReducedMotion(e.matches);
      if (videoRef.current) {
        if (e.matches) {
          videoRef.current.pause();
        } else {
          videoRef.current.play().catch(() => {});
        }
      }
    };

    mediaQuery.addEventListener("change", handleMotionChange);
    return () => mediaQuery.removeEventListener("change", handleMotionChange);
  }, []);

  // Multi-directional gradient mask to completely dissolve all 4 rectangular video edges
  const maskStyle: React.CSSProperties = {
    WebkitMaskImage:
      "radial-gradient(circle at 48% 50%, rgba(0,0,0,1) 36%, rgba(0,0,0,0) 84%), linear-gradient(to right, transparent 0%, black 10%, black 90%, transparent 100%), linear-gradient(to bottom, transparent 0%, black 8%, black 92%, transparent 100%)",
    maskImage:
      "radial-gradient(circle at 48% 50%, rgba(0,0,0,1) 36%, rgba(0,0,0,0) 84%), linear-gradient(to right, transparent 0%, black 10%, black 90%, transparent 100%), linear-gradient(to bottom, transparent 0%, black 8%, black 92%, transparent 100%)",
    WebkitMaskComposite: "source-in",
    maskComposite: "intersect",
  };

  return (
    <div className="relative w-full h-[480px] sm:h-[540px] flex items-center justify-center pointer-events-none select-none overflow-visible lg:-translate-x-4">
      {/* Background Soft Purple/Magenta Ambient Backlight */}
      <div className="absolute w-[68%] h-[68%] bg-purple-600/20 rounded-full blur-[90px] pointer-events-none" />

      {/* Video Container with Feathered Edge Mask */}
      <div className="w-full h-full pointer-events-none" style={maskStyle}>
        <video
          ref={videoRef}
          src="/videos/revora-engine.mp4"
          poster="/images/revora-engine-poster.jpg"
          autoPlay={!reducedMotion}
          muted
          loop
          playsInline
          controls={false}
          className="w-full h-full object-cover scale-[1.02] pointer-events-none mix-blend-screen"
        />
      </div>
    </div>
  );
}
