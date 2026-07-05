"use client";

import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { IconBrandWhatsapp, IconX } from "@tabler/icons-react";
import { siteConfig } from "@/lib/site";

export function WhatsAppFloat() {
  const [showBubble, setShowBubble] = useState(false);

  useEffect(() => {
    const showTimer = setTimeout(() => setShowBubble(true), 3000);
    const hideTimer = setTimeout(() => setShowBubble(false), 3000 + 7000);
    return () => {
      clearTimeout(showTimer);
      clearTimeout(hideTimer);
    };
  }, []);

  return (
    <div className="fixed right-5 bottom-5 z-50 flex flex-col items-end gap-3 md:right-8 md:bottom-8">
      <AnimatePresence>
        {showBubble && (
          <motion.div
            initial={{ opacity: 0, y: 14, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 8, scale: 0.92 }}
            transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
            className="glass-card relative flex items-center gap-2 rounded-2xl py-3 pr-3 pl-4 text-sm font-medium text-foreground shadow-xl"
          >
            <a
              href={siteConfig.whatsappUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="whitespace-nowrap"
            >
              Chat with us
            </a>
            <button
              type="button"
              onClick={() => setShowBubble(false)}
              aria-label="Dismiss"
              className="grid h-5 w-5 shrink-0 place-items-center rounded-full text-muted transition-colors hover:bg-black/5 hover:text-foreground"
            >
              <IconX size={12} stroke={2.5} />
            </button>
            <span
              aria-hidden
              className="absolute right-7 -bottom-1.5 h-3 w-3 rotate-45 rounded-[2px] bg-white"
            />
          </motion.div>
        )}
      </AnimatePresence>

      <motion.a
        href={siteConfig.whatsappUrl}
        target="_blank"
        rel="noopener noreferrer"
        aria-label="Chat with us on WhatsApp"
        initial={{ opacity: 0, scale: 0.6 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.6, delay: 0.3, ease: [0.16, 1, 0.3, 1] }}
        className="group relative grid h-16 w-16 place-items-center rounded-full bg-[#25D366] text-white shadow-[0_10px_30px_-8px_rgba(37,211,102,0.65)] transition-transform hover:scale-105"
      >
        <span
          aria-hidden
          className="animate-ping-slow absolute inset-0 rounded-full bg-[#25D366]"
        />
        <span
          aria-hidden
          className="absolute inset-0 rounded-full bg-[#25D366]"
        />
        <IconBrandWhatsapp
          size={30}
          stroke={1.6}
          className="animate-heartbeat relative"
        />
      </motion.a>
    </div>
  );
}
