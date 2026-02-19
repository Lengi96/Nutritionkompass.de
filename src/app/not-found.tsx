import Link from "next/link";
import { Compass } from "lucide-react";

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background px-4">
      <Compass className="h-16 w-16 text-primary mb-6" />
      <h1 className="text-6xl font-bold text-text-main mb-2">404</h1>
      <h2 className="text-xl font-semibold text-text-main mb-2">
        Seite nicht gefunden
      </h2>
      <p className="text-muted-foreground text-center max-w-md mb-8">
        Die angeforderte Seite existiert nicht oder wurde verschoben.
      </p>
      <div className="flex gap-4">
        <Link
          href="/"
          className="inline-flex items-center justify-center rounded-xl bg-primary px-6 py-3 text-sm font-medium text-white hover:bg-primary/90 transition-colors"
        >
          Zur Startseite
        </Link>
        <Link
          href="/dashboard"
          className="inline-flex items-center justify-center rounded-xl border border-input bg-background px-6 py-3 text-sm font-medium hover:bg-accent transition-colors"
        >
          Zum Dashboard
        </Link>
      </div>
    </div>
  );
}
