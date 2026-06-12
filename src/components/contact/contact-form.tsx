"use client";

import { useState } from "react";
import { z } from "zod";
import { motion } from "framer-motion";
import { IconArrowUpRight, IconCheck } from "@tabler/icons-react";

const schema = z.object({
  name: z.string().min(2, "Please enter your name."),
  email: z.string().email("Enter a valid email address."),
  company: z.string().optional(),
  budget: z.string().min(1, "Please choose a range."),
  message: z.string().min(20, "Tell us a little more — 20+ characters."),
});

type Errors = Partial<Record<keyof z.infer<typeof schema>, string>>;

const budgets = ["< $5k / mo", "$5k–$10k / mo", "$10k–$20k / mo", "$20k+ / mo"];

export function ContactForm() {
  const [errors, setErrors] = useState<Errors>({});
  const [submitted, setSubmitted] = useState(false);
  const [budget, setBudget] = useState<string>("");

  function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const data = {
      name: String(fd.get("name") || ""),
      email: String(fd.get("email") || ""),
      company: String(fd.get("company") || ""),
      budget: String(fd.get("budget") || ""),
      message: String(fd.get("message") || ""),
    };
    const parsed = schema.safeParse(data);
    if (!parsed.success) {
      const errs: Errors = {};
      for (const issue of parsed.error.issues) {
        const key = issue.path[0] as keyof Errors;
        if (!errs[key]) errs[key] = issue.message;
      }
      setErrors(errs);
      return;
    }
    setErrors({});
    setSubmitted(true);
  }

  if (submitted) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.96 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
        className="glass-card flex flex-col items-center gap-4 rounded-3xl p-12 text-center"
      >
        <div className="grid h-14 w-14 place-items-center rounded-full bg-[#ff3131] text-white">
          <IconCheck size={22} stroke={2.5} />
        </div>
        <h3 className="text-display text-3xl font-medium">Message received.</h3>
        <p className="max-w-md text-muted">
          A senior partner will reply within one business day. In the meantime,
          if you'd like to book a slot directly, use the discovery call link.
        </p>
      </motion.div>
    );
  }

  return (
    <form
      onSubmit={onSubmit}
      className="glass-card flex flex-col gap-5 rounded-3xl p-7 md:p-10"
    >
      <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
        <Field
          name="name"
          label="Your name"
          placeholder="Jane Cooper"
          error={errors.name}
        />
        <Field
          name="email"
          type="email"
          label="Email"
          placeholder="jane@brand.com"
          error={errors.email}
        />
      </div>
      <Field
        name="company"
        label="Company"
        placeholder="Northwind Apparel"
        error={errors.company}
      />

      <div className="flex flex-col gap-2">
        <label className="text-xs uppercase tracking-[0.16em] text-muted">
          Monthly budget
        </label>
        <div className="flex flex-wrap gap-2">
          {budgets.map((b) => (
            <button
              type="button"
              key={b}
              onClick={() => setBudget(b)}
              className={`rounded-full border px-4 py-2 text-sm transition-all ${
                budget === b
                  ? "border-[#ff3131] bg-[#ff3131] text-white"
                  : "border-[color:var(--color-border)] bg-white text-foreground hover:border-foreground/30"
              }`}
            >
              {b}
            </button>
          ))}
        </div>
        <input type="hidden" name="budget" value={budget} />
        {errors.budget && (
          <span className="text-xs text-[#ff3131]">{errors.budget}</span>
        )}
      </div>

      <div className="flex flex-col gap-2">
        <label className="text-xs uppercase tracking-[0.16em] text-muted">
          Tell us about your brand
        </label>
        <textarea
          name="message"
          rows={5}
          placeholder="What's the moment you're in? What does success look like in 12 months?"
          className="rounded-2xl border border-[color:var(--color-border)] bg-white px-4 py-3.5 text-[15px] outline-none transition-colors focus:border-foreground/40"
        />
        {errors.message && (
          <span className="text-xs text-[#ff3131]">{errors.message}</span>
        )}
      </div>

      <button type="submit" className="btn-accent mt-2 self-start">
        Send message
        <IconArrowUpRight size={18} />
      </button>
    </form>
  );
}

function Field({
  name,
  label,
  type = "text",
  placeholder,
  error,
}: {
  name: string;
  label: string;
  type?: string;
  placeholder?: string;
  error?: string;
}) {
  return (
    <div className="flex flex-col gap-2">
      <label className="text-xs uppercase tracking-[0.16em] text-muted">
        {label}
      </label>
      <input
        name={name}
        type={type}
        placeholder={placeholder}
        className="rounded-2xl border border-[color:var(--color-border)] bg-white px-4 py-3.5 text-[15px] outline-none transition-colors focus:border-foreground/40"
      />
      {error && <span className="text-xs text-[#ff3131]">{error}</span>}
    </div>
  );
}
