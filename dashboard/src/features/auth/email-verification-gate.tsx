"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import { IconMailCheck, IconRefresh, IconShieldCheck } from "@tabler/icons-react";
import {
  getVerificationCooldownAction,
  sendVerificationOtpAction,
  verifyEmailOtpAction,
} from "@/actions/verification";
import { Button, Field, Input, useToast } from "@/components/ui";
import { BRAND } from "@/lib/constants/brand";

export interface EmailVerificationGateProps {
  email: string;
  name?: string | null;
}

type CooldownState = {
  /** Server-authoritative cooldown — seconds until the resend button is allowed. */
  cooldownSecondsRemaining: number;
  /** Server-authoritative quota — how many more sends are allowed in the current 1-hour window. */
  sendsRemainingInWindow: number;
  /** Server-authoritative lockout from failed attempts. */
  locked: boolean;
  lockRetryAfterSeconds: number;
};

/**
 * Blocking email-verification gate.
 *
 *   - Cooldown + window cap + failure lockout all hydrate from the server on
 *     mount, so refresh / restart / new tab / new device cannot bypass them.
 *   - Local ticker only animates the *display* countdown between server
 *     refreshes; every send re-fetches authoritative state. This way the
 *     UI feels responsive without ever drifting from the DB.
 *   - The dialog cannot be closed by ESC or backdrop click. Server-side
 *     `requireVerifiedSession` is the actual gate; this is its UX surface.
 */
export function EmailVerificationGate({ email, name }: EmailVerificationGateProps) {
  const router = useRouter();
  const { toast } = useToast();
  const [code, setCode] = React.useState("");
  const [submitting, setSubmitting] = React.useState(false);
  const [resending, setResending] = React.useState(false);
  const [state, setState] = React.useState<CooldownState | null>(null);

  // Lock the underlying page.
  React.useEffect(() => {
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = "";
    };
  }, []);

  // Hydrate from server on mount + whenever the tab regains focus
  // (catches the "left the tab for an hour, came back" case).
  const refresh = React.useCallback(async () => {
    try {
      const s = await getVerificationCooldownAction(email);
      setState({
        cooldownSecondsRemaining: s.cooldownSecondsRemaining,
        sendsRemainingInWindow: s.sendsRemainingInWindow,
        locked: s.locked,
        lockRetryAfterSeconds: s.lockRetryAfterSeconds,
      });
    } catch {
      // Fall back to a "no cooldown known" state — the server will still
      // block abusive sends; we just won't show an accurate timer.
      setState({
        cooldownSecondsRemaining: 0,
        sendsRemainingInWindow: 5,
        locked: false,
        lockRetryAfterSeconds: 0,
      });
    }
  }, [email]);

  React.useEffect(() => {
    refresh();
    const onFocus = () => refresh();
    window.addEventListener("focus", onFocus);
    return () => window.removeEventListener("focus", onFocus);
  }, [refresh]);

  // Local 1s tick — purely cosmetic. Anchors stay server-driven.
  React.useEffect(() => {
    if (!state) return;
    if (state.cooldownSecondsRemaining <= 0 && state.lockRetryAfterSeconds <= 0) return;
    const id = setInterval(() => {
      setState((s) => {
        if (!s) return s;
        return {
          ...s,
          cooldownSecondsRemaining: Math.max(0, s.cooldownSecondsRemaining - 1),
          lockRetryAfterSeconds: Math.max(0, s.lockRetryAfterSeconds - 1),
          locked: s.lockRetryAfterSeconds - 1 > 0 ? s.locked : false,
        };
      });
    }, 1000);
    return () => clearInterval(id);
  }, [state]);

  const sendCode = async () => {
    if (state?.cooldownSecondsRemaining ?? 0 > 0) return;
    setResending(true);
    const result = await sendVerificationOtpAction(email);
    setResending(false);
    if (!result.ok) {
      toast({ variant: "error", title: "Couldn't send code", description: result.error });
      // Even on failure refresh — the server may have moved us into
      // WINDOW_EXCEEDED or LOCKED, and the UI should reflect that.
      await refresh();
      return;
    }
    toast({
      variant: "success",
      title: "New code sent",
      description: `Check ${email} for a 6-digit code.`,
    });
    await refresh();
  };

  const verify = async (e: React.FormEvent) => {
    e.preventDefault();
    if (code.length !== 6) {
      toast({ variant: "error", title: "Enter the 6-digit code" });
      return;
    }
    setSubmitting(true);
    const result = await verifyEmailOtpAction({ email, otp: code });
    setSubmitting(false);
    if (!result.ok) {
      toast({ variant: "error", title: "Verification failed", description: result.error });
      // Re-fetch in case this failure tipped us into LOCKED.
      await refresh();
      setCode("");
      return;
    }
    toast({ variant: "success", title: "Email verified" });
    router.refresh(); // dashboard layout re-runs → gate unmounts
  };

  const firstName = name?.split(" ")[0] ?? "";
  const greeting = firstName ? `Hi ${firstName}, ` : "";
  const descriptionLine1 = `${greeting}we sent a 6-digit code to ${email}.`;
  const descriptionLine2 = `Enter it below to unlock your workspace. Click Resend code if you don’t see one yet.`;
  const footnote = `The code expires in 10 minutes. ${BRAND.name} will never ask you to share this code with anyone.`;

  const cooldown = state?.cooldownSecondsRemaining ?? 0;
  const locked = state?.locked ?? false;
  const lockSecs = state?.lockRetryAfterSeconds ?? 0;
  const sendsLeft = state?.sendsRemainingInWindow ?? 0;

  const resendLabel = locked
    ? `Locked · ${formatMs(lockSecs)}`
    : cooldown > 0
      ? `Resend in ${cooldown}s`
      : sendsLeft === 0
        ? "Resend limit reached"
        : "Resend code";

  const resendDisabled = locked || cooldown > 0 || sendsLeft === 0;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="absolute inset-0 bg-[var(--color-dark)]/55 backdrop-blur-[2px]"
        />
        <motion.div
          role="dialog"
          aria-modal="true"
          aria-labelledby="verify-title"
          initial={{ opacity: 0, scale: 0.96, y: 8 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
          className="relative w-full max-w-md rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-[var(--color-surface)] shadow-[var(--shadow-xl)]"
        >
          <div className="px-6 pt-6">
            <div className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-[var(--color-primary)]/10 text-[var(--color-primary)]">
              <IconShieldCheck size={20} />
            </div>
            <h2
              id="verify-title"
              className="mt-4 text-lg font-semibold tracking-tight text-[var(--color-foreground)]"
            >
              Verify your email to continue
            </h2>
            <p className="mt-1 text-sm text-[var(--color-muted-foreground)]">
              {descriptionLine1}
            </p>
            <p className="mt-1 text-sm text-[var(--color-muted-foreground)]">
              {descriptionLine2}
            </p>
          </div>

          <form onSubmit={verify} className="px-6 pb-6 pt-5 flex flex-col gap-4">
            <Field label="Verification code" required>
              <Input
                inputMode="numeric"
                pattern="\d{6}"
                maxLength={6}
                autoComplete="one-time-code"
                placeholder="123456"
                value={code}
                onChange={(e) => setCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
                className="text-center tracking-[0.4em] font-semibold text-base"
                autoFocus
                disabled={locked}
              />
            </Field>

            <div className="flex items-center gap-2">
              <Button
                type="submit"
                variant="accent"
                loading={submitting}
                disabled={locked}
                className="flex-1"
              >
                <IconMailCheck size={16} />
                Verify
              </Button>
              <Button
                type="button"
                variant="secondary"
                onClick={sendCode}
                loading={resending}
                disabled={resendDisabled}
              >
                <IconRefresh size={14} />
                {resendLabel}
              </Button>
            </div>

            <p className="text-[11px] leading-relaxed text-[var(--color-muted)]">
              {footnote}
            </p>
          </form>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}

function formatMs(seconds: number): string {
  if (seconds <= 0) return "0s";
  if (seconds < 60) return `${seconds}s`;
  const m = Math.ceil(seconds / 60);
  return `${m}m`;
}
