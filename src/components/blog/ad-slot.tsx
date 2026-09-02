"use client";

import { useEffect, useRef } from "react";
import { ADSTERRA_BANNER_SIZES } from "@/lib/ad-config";

const ADSENSE_CLIENT = process.env.NEXT_PUBLIC_ADSENSE_CLIENT;
const ADSENSE_SLOT = process.env.NEXT_PUBLIC_ADSENSE_SLOT;

const ADSTERRA_NATIVE_SRC = process.env.NEXT_PUBLIC_ADSTERRA_NATIVE_SRC;
const ADSTERRA_NATIVE_KEY = process.env.NEXT_PUBLIC_ADSTERRA_NATIVE_KEY;

// Next.js only inlines literal process.env.NEXT_PUBLIC_* references, so each
// banner key is read by name here and mapped by size.
const ADSTERRA_BANNER_KEYS: Record<string, string | undefined> = {
  "300x250": process.env.NEXT_PUBLIC_ADSTERRA_BANNER_300X250,
  "468x60": process.env.NEXT_PUBLIC_ADSTERRA_BANNER_468X60,
  "728x90": process.env.NEXT_PUBLIC_ADSTERRA_BANNER_728X90,
  "320x50": process.env.NEXT_PUBLIC_ADSTERRA_BANNER_320X50,
  "160x300": process.env.NEXT_PUBLIC_ADSTERRA_BANNER_160X300,
  "160x600": process.env.NEXT_PUBLIC_ADSTERRA_BANNER_160X600,
};
const ADSTERRA_BANNER_HOST =
  process.env.NEXT_PUBLIC_ADSTERRA_BANNER_HOST || "//www.highrevenueformat.com";

const DEFAULT_NETWORK =
  process.env.NEXT_PUBLIC_DEFAULT_AD_NETWORK === "adsterra"
    ? "adsterra:native"
    : "adsense";

declare global {
  interface Window {
    adsbygoogle?: unknown[];
  }
}

function Placeholder({ label = "Advertisement" }: { label?: string }) {
  return (
    <div
      aria-hidden
      className="my-10 flex min-h-[120px] items-center justify-center rounded-2xl border border-dashed border-border text-[0.7rem] font-medium tracking-[0.18em] text-muted/60 uppercase"
    >
      {label}
    </div>
  );
}

function AdsenseUnit() {
  const insRef = useRef<HTMLModElement>(null);
  const pushed = useRef(false);

  useEffect(() => {
    if (!ADSENSE_CLIENT || !ADSENSE_SLOT || pushed.current) return;
    let frame = 0;
    let tries = 0;
    const tryPush = () => {
      const el = insRef.current;
      if (!el) return;
      if (el.offsetWidth === 0 && tries < 20) {
        tries += 1;
        frame = requestAnimationFrame(tryPush);
        return;
      }
      try {
        (window.adsbygoogle = window.adsbygoogle ?? []).push({});
        pushed.current = true;
      } catch {
        // script not ready / blocked
      }
    };
    tryPush();
    return () => cancelAnimationFrame(frame);
  }, []);

  if (!ADSENSE_CLIENT || !ADSENSE_SLOT) return <Placeholder />;

  return (
    <div className="my-10">
      <ins
        ref={insRef}
        className="adsbygoogle"
        style={{ display: "block", textAlign: "center" }}
        data-ad-client={ADSENSE_CLIENT}
        data-ad-slot={ADSENSE_SLOT}
        data-ad-format="fluid"
        data-ad-layout="in-article"
      />
    </div>
  );
}

function AdsterraNative() {
  const hostRef = useRef<HTMLDivElement>(null);
  const injected = useRef(false);

  useEffect(() => {
    if (
      !ADSTERRA_NATIVE_SRC ||
      !ADSTERRA_NATIVE_KEY ||
      injected.current ||
      !hostRef.current
    )
      return;
    injected.current = true;

    const script = document.createElement("script");
    script.async = true;
    script.setAttribute("data-cfasync", "false");
    script.src = ADSTERRA_NATIVE_SRC.startsWith("//")
      ? `https:${ADSTERRA_NATIVE_SRC}`
      : ADSTERRA_NATIVE_SRC;
    hostRef.current.appendChild(script);
  }, []);

  if (!ADSTERRA_NATIVE_SRC || !ADSTERRA_NATIVE_KEY) return <Placeholder />;

  return (
    <div className="my-10" ref={hostRef}>
      <div id={`container-${ADSTERRA_NATIVE_KEY}`} className="w-full" />
    </div>
  );
}

function AdsterraBanner({ size }: { size: string }) {
  const dims = ADSTERRA_BANNER_SIZES[size as keyof typeof ADSTERRA_BANNER_SIZES];
  const key = ADSTERRA_BANNER_KEYS[size];

  if (!dims || !key) return <Placeholder />;

  const host = ADSTERRA_BANNER_HOST.startsWith("//")
    ? `https:${ADSTERRA_BANNER_HOST}`
    : ADSTERRA_BANNER_HOST;

  // Each banner runs in its own srcdoc iframe so multiple banners on one page
  // don't clobber the shared `window.atOptions` global Adsterra relies on.
  const srcDoc =
    `<!doctype html><html><head><meta charset="utf-8">` +
    `<style>html,body{margin:0;padding:0;overflow:hidden}</style></head><body>` +
    `<script>atOptions={key:${JSON.stringify(key)},format:'iframe',height:${dims.h},width:${dims.w},params:{}};<\/script>` +
    `<script src=${JSON.stringify(`${host}/${key}/invoke.js`)}><\/script>` +
    `</body></html>`;

  return (
    <div className="my-10 flex justify-center overflow-x-auto">
      <iframe
        title="Advertisement"
        srcDoc={srcDoc}
        width={dims.w}
        height={dims.h}
        scrolling="no"
        loading="lazy"
        className="border-0"
        style={{ width: dims.w, height: dims.h }}
      />
    </div>
  );
}

/**
 * In-article ad slot. `token` comes from the content marker:
 * "adsense" | "adsterra" | "adsterra:native" | "adsterra:<size>".
 */
export function AdSlot({ token }: { token?: string }) {
  const t = token && token.length > 0 ? token : DEFAULT_NETWORK;

  if (t === "adsense") return <AdsenseUnit />;
  if (t === "adsterra" || t === "adsterra:native") return <AdsterraNative />;
  if (t.startsWith("adsterra:")) {
    return <AdsterraBanner size={t.slice("adsterra:".length)} />;
  }
  return <AdsenseUnit />;
}
