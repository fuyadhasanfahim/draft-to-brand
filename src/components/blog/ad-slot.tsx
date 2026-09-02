"use client";

import { useEffect, useRef } from "react";

type AdNetwork = "adsense" | "adsterra";

const ADSENSE_CLIENT = process.env.NEXT_PUBLIC_ADSENSE_CLIENT;
const ADSENSE_SLOT = process.env.NEXT_PUBLIC_ADSENSE_SLOT;
const ADSTERRA_SRC = process.env.NEXT_PUBLIC_ADSTERRA_SRC;
const ADSTERRA_KEY = process.env.NEXT_PUBLIC_ADSTERRA_KEY;
const DEFAULT_NETWORK: AdNetwork =
  process.env.NEXT_PUBLIC_DEFAULT_AD_NETWORK === "adsterra"
    ? "adsterra"
    : "adsense";

declare global {
  interface Window {
    adsbygoogle?: unknown[];
  }
}

function Placeholder({ label }: { label: string }) {
  return (
    <div
      aria-hidden
      className="my-10 flex min-h-[120px] items-center justify-center rounded-2xl border border-dashed border-border text-[0.7rem] font-medium tracking-[0.18em] text-muted/60 uppercase"
    >
      {label}
    </div>
  );
}

function AdsenseUnit({ slot }: { slot?: string }) {
  const adSlot = slot ?? ADSENSE_SLOT;
  const pushed = useRef(false);

  useEffect(() => {
    if (!ADSENSE_CLIENT || !adSlot || pushed.current) return;
    try {
      (window.adsbygoogle = window.adsbygoogle ?? []).push({});
      pushed.current = true;
    } catch {
      // script not ready / blocked
    }
  }, [adSlot]);

  if (!ADSENSE_CLIENT || !adSlot) return <Placeholder label="Advertisement" />;

  return (
    <div className="my-10">
      <ins
        className="adsbygoogle"
        style={{ display: "block", textAlign: "center" }}
        data-ad-client={ADSENSE_CLIENT}
        data-ad-slot={adSlot}
        data-ad-format="fluid"
        data-ad-layout="in-article"
      />
    </div>
  );
}

function AdsterraUnit() {
  const containerRef = useRef<HTMLDivElement>(null);
  const injected = useRef(false);

  useEffect(() => {
    if (!ADSTERRA_SRC || !ADSTERRA_KEY || injected.current || !containerRef.current)
      return;
    injected.current = true;

    const script = document.createElement("script");
    script.async = true;
    script.setAttribute("data-cfasync", "false");
    script.src = ADSTERRA_SRC.startsWith("//")
      ? `https:${ADSTERRA_SRC}`
      : ADSTERRA_SRC;
    containerRef.current.appendChild(script);
  }, []);

  if (!ADSTERRA_SRC || !ADSTERRA_KEY) {
    return <Placeholder label="Advertisement" />;
  }

  return (
    <div className="my-10 flex justify-center" ref={containerRef}>
      <div id={`container-${ADSTERRA_KEY}`} />
    </div>
  );
}

/**
 * In-article ad slot. `network` (or the `[[ad:adsterra]]` token) picks the
 * provider; a plain `[[ad]]` uses NEXT_PUBLIC_DEFAULT_AD_NETWORK. Each provider
 * falls back to a labelled placeholder until its env vars are set.
 */
export function AdSlot({ network }: { network?: AdNetwork }) {
  const resolved = network ?? DEFAULT_NETWORK;
  return resolved === "adsterra" ? <AdsterraUnit /> : <AdsenseUnit />;
}
