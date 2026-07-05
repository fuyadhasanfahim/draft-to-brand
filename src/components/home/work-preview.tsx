"use client";

import { motion } from "framer-motion";
import Image from "next/image";
import Link from "next/link";
import { Container } from "../shared/container";
import { SectionHeader } from "../shared/section-header";
import { caseStudies } from "@/lib/data";
import { IconArrowUpRight } from "@tabler/icons-react";

export function WorkPreview() {
  return (
    <section className="bg-surface py-28 md:py-36">
      <Container>
        <div className="flex flex-col gap-12 md:flex-row md:items-end md:justify-between">
          <SectionHeader
            eyebrow="Selected work"
            title={
              <>
                Brands we've shaped
                <br />
                <span className="text-serif italic font-normal text-muted">
                  from draft to category leader.
                </span>
              </>
            }
          />
          <Link href="/work" className="btn-ghost text-base">
            View all work <IconArrowUpRight size={16} />
          </Link>
        </div>

        <div className="mt-16 grid grid-cols-1 gap-6 lg:grid-cols-2">
          {caseStudies.slice(0, 4).map((c, i) => (
            <motion.div
              key={c.slug}
              initial={{ opacity: 0, y: 40 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-80px" }}
              transition={{
                delay: i * 0.08,
                duration: 0.8,
                ease: [0.16, 1, 0.3, 1],
              }}
            >
              <Link
                href={`/work#${c.slug}`}
                className="group relative block overflow-hidden rounded-3xl"
              >
                <div
                  className="relative aspect-[16/11] w-full overflow-hidden p-8 md:p-10"
                  style={{
                    background:
                      c.accent === "#ff3131"
                        ? "linear-gradient(135deg, #ff3131 0%, #c62525 100%)"
                        : "linear-gradient(135deg, #282a2a 0%, #1a1c1c 100%)",
                  }}
                >
                  {c.image && (
                    <Image
                      src={c.image}
                      alt={c.title || `${c.industry} brand work`}
                      fill
                      sizes="(min-width: 1024px) 50vw, 100vw"
                      className="object-cover transition-transform duration-700 ease-out group-hover:scale-105"
                      preload={i === 0}
                    />
                  )}
                  <div
                    aria-hidden
                    className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-black/10 opacity-0 transition-opacity duration-500 ease-out group-hover:opacity-100 group-focus-within:opacity-100"
                  />
                  <div
                    aria-hidden
                    className="absolute inset-0 bg-[url('data:image/svg+xml;utf8,<svg xmlns=%22http://www.w3.org/2000/svg%22 width=%2220%22 height=%2220%22><circle cx=%221%22 cy=%221%22 r=%221%22 fill=%22white%22 opacity=%220.07%22/></svg>')]"
                  />
                  <div className="relative flex h-full flex-col justify-between text-white opacity-0 transition-all duration-500 ease-out group-hover:opacity-100 group-focus-within:opacity-100 [transform:translateY(10px)] group-hover:[transform:translateY(0)] group-focus-within:[transform:translateY(0)]">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-2 text-xs uppercase tracking-[0.18em] text-white/60">
                        <span>{c.industry}</span>
                        <span>·</span>
                        <span>{c.year}</span>
                      </div>
                      <div className="grid h-12 w-12 place-items-center rounded-full bg-white/15 backdrop-blur transition-transform group-hover:rotate-45">
                        <IconArrowUpRight size={20} stroke={1.6} />
                      </div>
                    </div>
                    <h3 className="text-display max-w-md text-2xl font-medium leading-[1.05] sm:text-3xl md:text-4xl">
                      {c.title}
                    </h3>
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-3 border border-t-0 border-[color:var(--color-border)] bg-white px-5 py-5 md:px-10">
                  {c.metrics.map((m) => (
                    <div key={m.label} className="flex flex-col">
                      <div className="text-display text-lg font-medium md:text-xl">
                        {m.value}
                      </div>
                      <div className="text-[10px] uppercase tracking-[0.14em] text-muted md:text-[11px] md:tracking-[0.16em]">
                        {m.label}
                      </div>
                    </div>
                  ))}
                </div>
              </Link>
            </motion.div>
          ))}
        </div>
      </Container>
    </section>
  );
}
