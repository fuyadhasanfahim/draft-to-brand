"use client";

import { motion, useScroll, useTransform } from "framer-motion";
import { useRef } from "react";
import Link from "next/link";
import {
  IconArrowUpRight,
  IconSparkles,
  IconBolt,
  IconTarget,
} from "@tabler/icons-react";
import { Container } from "../shared/container";
import { Badge } from "../shared/badge";

export function Hero() {
  const ref = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start start", "end start"],
  });
  const y = useTransform(scrollYProgress, [0, 1], [0, 140]);
  const opacity = useTransform(scrollYProgress, [0, 0.7], [1, 0]);

  return (
    <section
      ref={ref}
      className="relative isolate overflow-hidden pt-36 pb-24 md:pt-44 md:pb-32"
    >
      {/* Background layers */}
      <div className="absolute inset-0 -z-10">
        <div className="absolute inset-0 bg-grid [mask-image:radial-gradient(ellipse_at_top,black_20%,transparent_70%)]" />
        <div className="absolute -top-32 left-1/2 h-[520px] w-[820px] -translate-x-1/2 rounded-full bg-[#ff3131]/15 blur-[160px]" />
        <div className="absolute top-40 -left-32 h-[360px] w-[360px] rounded-full bg-[#ff3131]/8 blur-[120px]" />
      </div>

      <Container>
        <motion.div style={{ y, opacity }} className="flex flex-col items-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
          >
            <Badge tone="default" className="bg-white/80">
              <span className="grid h-1.5 w-1.5 place-items-center rounded-full bg-[#ff3131]" />
              Now booking Q3 partnerships
            </Badge>
          </motion.div>

          <h1 className="text-display mt-8 max-w-5xl text-center text-[14vw] font-medium leading-[0.92] text-foreground sm:text-7xl md:text-[88px] lg:text-[112px]">
            <AnimatedLine delay={0.1}>From Draft</AnimatedLine>
            <AnimatedLine delay={0.18}>
              <span className="text-serif italic font-normal text-muted">
                to{" "}
              </span>
              <span className="gradient-accent-text">Brand.</span>
            </AnimatedLine>
          </h1>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{
              duration: 0.7,
              delay: 0.4,
              ease: [0.16, 1, 0.3, 1],
            }}
            className="mt-10 max-w-2xl text-center text-lg leading-relaxed text-muted md:text-xl"
          >
            A full-service digital marketing and brand management agency helping
            ambitious businesses grow through branding, SEO, paid advertising,
            content, web design and growth systems.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{
              duration: 0.7,
              delay: 0.55,
              ease: [0.16, 1, 0.3, 1],
            }}
            className="mt-12 flex flex-col items-center gap-4 sm:flex-row"
          >
            <Link href="/contact" className="btn-accent group">
              Book Discovery Call
              <IconArrowUpRight
                size={18}
                className="transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5"
              />
            </Link>
            <Link href="/work" className="btn-secondary">
              View Our Work
            </Link>
          </motion.div>
        </motion.div>

        <HeroCanvas />

        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.9, duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
          className="mt-20 grid grid-cols-2 gap-4 md:grid-cols-4"
        >
          {stats.map((s) => (
            <div
              key={s.label}
              className="glass-card flex flex-col gap-2 rounded-2xl p-5"
            >
              <div className="text-display text-3xl font-medium text-foreground md:text-4xl">
                {s.value}
              </div>
              <div className="text-xs uppercase tracking-[0.16em] text-muted">
                {s.label}
              </div>
            </div>
          ))}
        </motion.div>
      </Container>
    </section>
  );
}

function AnimatedLine({
  children,
  delay,
}: {
  children: React.ReactNode;
  delay: number;
}) {
  return (
    <span className="block overflow-hidden">
      <motion.span
        className="block"
        initial={{ y: "110%", opacity: 0 }}
        animate={{ y: "0%", opacity: 1 }}
        transition={{ duration: 1.05, delay, ease: [0.16, 1, 0.3, 1] }}
      >
        {children}
      </motion.span>
    </span>
  );
}

const stats = [
  { value: "120+", label: "Brands launched" },
  { value: "4.6×", label: "Avg ROAS" },
  { value: "$240M", label: "Revenue moved" },
  { value: "98%", label: "Client retention" },
];

function HeroCanvas() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 60 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 1, delay: 0.7, ease: [0.16, 1, 0.3, 1] }}
      className="relative mt-24 grid grid-cols-12 gap-4"
    >
      {/* Editorial card 1 */}
      <FloatingCard
        className="col-span-12 md:col-span-5 row-span-2"
        delay={0.1}
      >
        <div className="relative h-full overflow-hidden rounded-3xl bg-gradient-to-br from-[#282a2a] to-[#3a3c3c] p-8 text-white">
          <div className="flex items-center gap-2 text-xs uppercase tracking-[0.18em] text-white/50">
            <IconSparkles size={14} /> Brand · Strategy
          </div>
          <p className="text-display mt-12 text-4xl font-medium leading-[1] md:text-5xl">
            We don't make
            <br />
            <span className="text-serif italic font-normal text-white/60">
              ordinary
            </span>{" "}
            brands.
          </p>
          <div className="mt-12 flex items-end justify-between">
            <div>
              <div className="text-3xl font-medium">04</div>
              <div className="text-xs uppercase tracking-[0.18em] text-white/40">
                Pillars
              </div>
            </div>
            <div className="text-right text-xs text-white/40">
              Studio · 2026
            </div>
          </div>
          <div
            aria-hidden
            className="pointer-events-none absolute -right-16 -bottom-20 h-64 w-64 rounded-full bg-[#ff3131]/40 blur-3xl"
          />
        </div>
      </FloatingCard>

      <FloatingCard
        className="col-span-6 md:col-span-4"
        delay={0.2}
      >
        <div className="glass-card flex h-full flex-col justify-between rounded-3xl p-6">
          <div className="text-xs uppercase tracking-[0.18em] text-muted">
            <span className="inline-flex items-center gap-1.5">
              <IconBolt size={13} className="text-[#ff3131]" /> Growth
            </span>
          </div>
          <div>
            <div className="text-display text-5xl font-medium leading-none md:text-6xl">
              +218%
            </div>
            <div className="mt-2 text-sm text-muted">
              Avg revenue lift in 6 months
            </div>
          </div>
        </div>
      </FloatingCard>

      <FloatingCard
        className="col-span-6 md:col-span-3"
        delay={0.28}
      >
        <div className="relative h-full overflow-hidden rounded-3xl bg-[#ff3131] p-6 text-white">
          <div className="text-xs uppercase tracking-[0.18em] text-white/70">
            <span className="inline-flex items-center gap-1.5">
              <IconTarget size={13} /> Focus
            </span>
          </div>
          <p className="text-display mt-8 text-2xl font-medium leading-tight">
            Editorial brands.<br />
            <span className="text-serif italic font-normal text-white/80">
              Built to compound.
            </span>
          </p>
          <div className="mt-6 flex items-center gap-1">
            <span className="h-1.5 w-1.5 rounded-full bg-white" />
            <span className="h-1.5 w-1.5 rounded-full bg-white/40" />
            <span className="h-1.5 w-1.5 rounded-full bg-white/40" />
          </div>
        </div>
      </FloatingCard>

      <FloatingCard
        className="col-span-12 md:col-span-7"
        delay={0.36}
      >
        <div className="glass-card flex h-full items-center justify-between rounded-3xl p-6">
          <div className="flex flex-col gap-1">
            <div className="text-xs uppercase tracking-[0.18em] text-muted">
              Currently scaling
            </div>
            <div className="text-display text-2xl font-medium md:text-3xl">
              12 brands in 4 categories.
            </div>
          </div>
          <div className="hidden items-center -space-x-3 md:flex">
            {[
              "#ff3131",
              "#282a2a",
              "#a78bfa",
              "#22c55e",
              "#f59e0b",
            ].map((c, i) => (
              <div
                key={i}
                style={{ background: c }}
                className="grid h-12 w-12 place-items-center rounded-full border-2 border-white text-xs font-medium text-white"
              >
                {String.fromCharCode(65 + i)}
              </div>
            ))}
          </div>
        </div>
      </FloatingCard>
    </motion.div>
  );
}

function FloatingCard({
  children,
  className,
  delay = 0,
}: {
  children: React.ReactNode;
  className?: string;
  delay?: number;
}) {
  return (
    <motion.div
      className={className}
      initial={{ opacity: 0, y: 40 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.7 + delay, duration: 0.9, ease: [0.16, 1, 0.3, 1] }}
    >
      {children}
    </motion.div>
  );
}
