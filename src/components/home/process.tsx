"use client";

import { motion, useScroll, useTransform } from "framer-motion";
import { useRef } from "react";
import { Container } from "../shared/container";
import { SectionHeader } from "../shared/section-header";
import { processSteps } from "@/lib/data";

export function Process() {
  const ref = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start end", "end start"],
  });
  const lineHeight = useTransform(scrollYProgress, [0.1, 0.85], ["0%", "100%"]);

  return (
    <section ref={ref} className="py-28 md:py-36">
      <Container>
        <SectionHeader
          eyebrow="Our process"
          title={
            <>
              Five movements,
              <br />
              <span className="text-serif italic font-normal text-muted">
                one compounding system.
              </span>
            </>
          }
        />

        <div className="relative mt-20 grid grid-cols-1 gap-2 md:grid-cols-12">
          <div className="relative md:col-span-1">
            <div className="absolute left-4 top-0 h-full w-px bg-[color:var(--color-border)]" />
            <motion.div
              style={{ height: lineHeight }}
              className="absolute left-4 top-0 w-px bg-[#ff3131]"
            />
          </div>

          <div className="flex flex-col gap-2 md:col-span-11">
            {processSteps.map((step, i) => (
              <motion.div
                key={step.number}
                initial={{ opacity: 0, x: 24 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true, margin: "-100px" }}
                transition={{
                  delay: i * 0.06,
                  duration: 0.8,
                  ease: [0.16, 1, 0.3, 1],
                }}
                className="group relative grid grid-cols-1 items-start gap-4 border-b border-[color:var(--color-border)] py-8 transition-colors hover:bg-surface md:grid-cols-12 md:gap-8 md:py-10"
              >
                <div className="md:col-span-2">
                  <span className="text-display text-5xl font-medium text-muted/40 md:text-6xl">
                    {step.number}
                  </span>
                </div>
                <div className="md:col-span-4">
                  <h3 className="text-display text-3xl font-medium leading-tight md:text-4xl">
                    {step.title}
                  </h3>
                </div>
                <p className="text-lg leading-relaxed text-muted md:col-span-6 md:text-xl">
                  {step.description}
                </p>
              </motion.div>
            ))}
          </div>
        </div>
      </Container>
    </section>
  );
}
