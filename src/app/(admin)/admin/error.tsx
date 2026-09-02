"use client";

import { useEffect } from "react";

export default function AdminError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="glass-card mx-auto max-w-lg rounded-3xl px-6 py-14 text-center">
      <p className="text-display text-lg font-medium">Something broke</p>
      <p className="mx-auto mt-1 max-w-sm text-sm text-muted">
        {error.message || "An unexpected error occurred in the dashboard."}
      </p>
      <button
        type="button"
        onClick={reset}
        className="btn-primary mx-auto mt-6 px-4 py-2 text-sm"
      >
        Try again
      </button>
    </div>
  );
}
