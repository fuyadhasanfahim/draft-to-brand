"use client";

import { useEffect, useRef } from "react";

const CLIENT = process.env.NEXT_PUBLIC_ADSENSE_CLIENT;
const DEFAULT_SLOT = process.env.NEXT_PUBLIC_ADSENSE_SLOT;

declare global {
  interface Window {
    adsbygoogle?: unknown[];
  }
}

/**
 * A Google AdSense in-article unit. Falls back to a labelled placeholder when
 * NEXT_PUBLIC_ADSENSE_CLIENT / NEXT_PUBLIC_ADSENSE_SLOT are not set (e.g. local
 * dev, or before the AdSense account is approved).
 */
export function AdSlot({ slot }: { slot?: string }) {
  const adSlot = slot ?? DEFAULT_SLOT;
  const pushed = useRef(false);

  useEffect(() => {
    if (!CLIENT || !adSlot || pushed.current) return;
    try {
      (window.adsbygoogle = window.adsbygoogle ?? []).push({});
      pushed.current = true;
    } catch {
      // Script not ready or blocked by an ad blocker — nothing to do.
    }
  }, [adSlot]);

  if (!CLIENT || !adSlot) {
    return (
      <div
        aria-hidden
        className="my-10 flex min-h-[120px] items-center justify-center rounded-2xl border border-dashed border-border text-[0.7rem] font-medium tracking-[0.18em] text-muted/60 uppercase"
      >
        Advertisement
      </div>
    );
  }

  return (
    <div className="my-10">
      <ins
        className="adsbygoogle"
        style={{ display: "block", textAlign: "center" }}
        data-ad-client={CLIENT}
        data-ad-slot={adSlot}
        data-ad-format="fluid"
        data-ad-layout="in-article"
      />
    </div>
  );
}
