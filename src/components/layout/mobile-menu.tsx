"use client";

import { AnimatePresence, motion } from "framer-motion";
import Link from "next/link";
import { IconX, IconArrowUpRight } from "@tabler/icons-react";
import { navLinks, siteConfig } from "@/lib/site";
import { useEffect } from "react";

export function MobileMenu({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  useEffect(() => {
    if (open) document.body.style.overflow = "hidden";
    else document.body.style.overflow = "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  // Close on Escape
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          role="dialog"
          aria-modal="true"
          aria-label="Main navigation"
          className="fixed inset-0 z-[100] md:hidden"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.3 }}
        >
          <div
            className="absolute inset-0 bg-[#282a2a]/30 backdrop-blur-xl"
            onClick={onClose}
          />
          <motion.div
            className="absolute inset-x-3 top-3 bottom-3 glass-floating rounded-[28px] overflow-hidden"
            initial={{ y: -16, opacity: 0, scale: 0.98 }}
            animate={{ y: 0, opacity: 1, scale: 1 }}
            exit={{ y: -16, opacity: 0, scale: 0.98 }}
            transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
          >
            <div className="flex items-center justify-between border-b border-[color:var(--color-border)] px-5 py-4">
              <span className="text-sm font-medium tracking-tight">Menu</span>
              <button
                onClick={onClose}
                aria-label="Close menu"
                className="grid h-9 w-9 place-items-center rounded-full bg-[#282a2a] text-white"
              >
                <IconX size={18} />
              </button>
            </div>
            <nav className="flex flex-col p-5">
              {navLinks.map((link, i) => (
                <motion.div
                  key={link.href}
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{
                    delay: 0.1 + i * 0.06,
                    duration: 0.5,
                    ease: [0.16, 1, 0.3, 1],
                  }}
                >
                  <Link
                    href={link.href}
                    onClick={onClose}
                    className="group flex items-center justify-between border-b border-[color:var(--color-border)] py-5 text-3xl font-medium tracking-tight"
                  >
                    {link.label}
                    <IconArrowUpRight
                      size={22}
                      className="text-muted transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5"
                    />
                  </Link>
                </motion.div>
              ))}
            </nav>
            <div className="absolute inset-x-5 bottom-5 flex flex-col gap-3">
              <Link
                href="/contact"
                onClick={onClose}
                className="btn-accent w-full justify-center"
              >
                Book Discovery Call
              </Link>
              <a
                href={`mailto:${siteConfig.email}`}
                className="text-center text-sm text-muted"
              >
                {siteConfig.email}
              </a>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
