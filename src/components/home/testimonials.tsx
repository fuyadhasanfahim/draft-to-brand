"use client";

import { motion, useAnimationFrame, useMotionValue } from "framer-motion";
import { useEffect, useRef, useState } from "react";
import { Container } from "../shared/container";
import { SectionHeader } from "../shared/section-header";
import { testimonials } from "@/lib/data";
import { IconQuote } from "@tabler/icons-react";

export function Testimonials() {
  const x = useMotionValue(0);
  const sectionRef = useRef<HTMLElement>(null);
  const trackRef = useRef<HTMLDivElement>(null);
  const [paused, setPaused] = useState(false);
  const [visible, setVisible] = useState(false);
  const items = [...testimonials, ...testimonials];

  // Only run the animation while the section is on-screen.
  useEffect(() => {
    const el = sectionRef.current;
    if (!el) return;
    const io = new IntersectionObserver(
      ([entry]) => setVisible(entry.isIntersecting),
      { threshold: 0.05 },
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  useAnimationFrame((_, delta) => {
    if (paused || !visible) return;
    const track = trackRef.current;
    if (!track) return;
    const half = track.scrollWidth / 2;
    const current = x.get();
    const next = current - (delta / 1000) * 40; // 40 px / s
    if (Math.abs(next) >= half) {
      x.set(0);
    } else {
      x.set(next);
    }
  });

  return (
    <section
      ref={sectionRef}
      className="overflow-hidden bg-[#282a2a] py-28 text-white md:py-36"
    >
      <Container>
        <SectionHeader
          eyebrow="What clients say"
          title={
            <span className="text-white">
              The people we partner with,
              <br />
              <span className="text-serif italic font-normal text-white/60">
                in their own words.
              </span>
            </span>
          }
        />
      </Container>

      <div
        className="relative mt-20 [mask-image:linear-gradient(90deg,transparent,black_8%,black_92%,transparent)]"
        onMouseEnter={() => setPaused(true)}
        onMouseLeave={() => setPaused(false)}
        onPointerDown={() => setPaused(true)}
        onPointerUp={() => setPaused(false)}
        onPointerCancel={() => setPaused(false)}
      >
        <motion.div
          ref={trackRef}
          style={{ x }}
          drag="x"
          dragConstraints={{ left: -10000, right: 10000 }}
          dragElastic={0.05}
          className="flex w-max cursor-grab gap-5 active:cursor-grabbing"
        >
          {items.map((t, i) => (
            <div
              key={i}
              className="w-[85vw] shrink-0 rounded-3xl border border-white/10 bg-white/[0.04] p-6 backdrop-blur sm:w-[420px] md:w-[480px] md:p-10"
            >
              <IconQuote
                size={28}
                className="text-[#ff3131]"
                stroke={1.5}
              />
              <p className="mt-6 text-lg leading-relaxed text-white/90 md:text-2xl">
                {t.quote}
              </p>
              <div className="mt-10 flex items-center gap-4 border-t border-white/10 pt-6">
                <div
                  className="grid h-12 w-12 place-items-center rounded-full bg-gradient-to-br from-[#ff3131] to-[#c62525] text-sm font-medium"
                >
                  {t.name
                    .split(" ")
                    .map((n) => n[0])
                    .join("")}
                </div>
                <div className="flex flex-col">
                  <span className="text-[15px] font-medium">{t.name}</span>
                  <span className="text-sm text-white/50">
                    {t.role} · {t.company}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}
