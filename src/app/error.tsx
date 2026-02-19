"use client";

import { Compass, RefreshCw } from "lucide-react";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background px-4">
      <Compass className="h-16 w-16 text-destructive mb-6" />
      <h1 className="text-2xl font-bold text-text-main mb-2">
        Ein Fehler ist aufgetreten
      </h1>
      <p className="text-muted-foreground text-center max-w-md mb-6">
        {error.message || "Etwas ist schiefgelaufen. Bitte versuchen Sie es erneut."}
      </p>
      <button
        onClick={reset}
        className="inline-flex items-center gap-2 rounded-xl bg-primary px-6 py-3 text-sm font-medium text-white hover:bg-primary/90 transition-colors"
      >
        <RefreshCw className="h-4 w-4" />
        Erneut versuchen
      </button>
    </div>
  );
}
