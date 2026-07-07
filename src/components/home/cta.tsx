"use client";

import Link from "next/link";
import { motion, useScroll, useTransform } from "framer-motion";
import { useRef } from "react";
import { Container } from "../shared/container";
import { IconArrowUpRight } from "@tabler/icons-react";

export function HomeCta() {
  const ref = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start end", "end start"],
  });
  const y = useTransform(scrollYProgress, [0, 1], [50, -50]);

  return (
    <section ref={ref} className="relative isolate py-28 md:py-36">
      <Container>
        <motion.div
          style={{ y }}
          className="relative overflow-hidden rounded-[28px] bg-gradient-to-br from-[#ff3131] via-[#e62828] to-[#a01818] p-7 text-white md:rounded-[40px] md:p-20"
        >
          <div
            aria-hidden
            className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(255,255,255,0.18),transparent_50%)]"
          />
          <div
            aria-hidden
            className="pointer-events-none absolute -bottom-32 -right-20 h-[420px] w-[420px] rounded-full bg-white/10 blur-3xl"
          />
          <div className="relative flex flex-col gap-12 md:flex-row md:items-end md:justify-between">
            <div className="max-w-2xl">
              <span className="inline-flex items-center gap-2 text-xs uppercase tracking-[0.2em] text-white/70">
                <span className="grid h-1.5 w-1.5 rounded-full bg-white" />
                Let's begin
              </span>
              <h2 className="text-display mt-6 text-4xl font-medium leading-[0.95] sm:text-5xl md:text-7xl">
                Your brand,<br />
                <span className="text-serif italic font-normal text-white/80">
                  on the cover.
                </span>
              </h2>
              <p className="mt-8 max-w-md text-lg text-white/80">
                Book a 30-minute discovery call. We'll tell you honestly if
                there's a fit, and what your first 90 days could look like.
              </p>
            </div>
            <div className="flex flex-col gap-3 md:items-end">
              <Link
                href="/contact"
                className="group inline-flex items-center gap-3 rounded-full bg-white px-7 py-4 text-[15px] font-medium text-[#282a2a] transition-transform hover:-translate-y-0.5"
              >
                Book Discovery Call
                <IconArrowUpRight
                  size={18}
                  className="transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5"
                />
              </Link>
              <Link
                href="/work"
                className="inline-flex items-center gap-2 text-sm text-white/70 transition-colors hover:text-white"
              >
                or view our work →
              </Link>
            </div>
          </div>
        </motion.div>
      </Container>
    </section>
  );
}
