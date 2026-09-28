"use client";

import { useEffect } from "react";
import { GlassCard } from "@/components/shared/GlassCard";

export default function DashboardError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Log the error to an error reporting service in production
    console.error("Dashboard Error Boundary Caught:", error);
  }, [error]);

  return (
    <div className="flex flex-col items-center justify-center min-h-[50vh] p-8 text-center animate-fade-in">
      <GlassCard className="max-w-lg border-rose-500/20" glow="rose">
        <h2 className="text-2xl font-bold text-rose-400 mb-4">
          Widget Failed to Load
        </h2>
        <p className="text-slate-400 mb-6 text-sm">
          A portion of the dashboard encountered an unexpected error. 
          The rest of the system is unaffected.
          <br /><br />
          <span className="text-rose-500/80 font-mono text-xs break-words block bg-rose-500/10 p-2 rounded">
            {error.message || "Unknown rendering error"}
          </span>
        </p>
        <div className="flex gap-4 justify-center">
          <button
            onClick={() => reset()}
            className="px-6 py-2.5 bg-rose-500/20 hover:bg-rose-500/30 text-rose-400 border border-rose-500/50 rounded-xl transition-all font-semibold"
          >
            Try Again
          </button>
          <button
            onClick={() => window.location.reload()}
            className="px-6 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl transition-all font-semibold"
          >
            Reload Full Page
          </button>
        </div>
      </GlassCard>
    </div>
  );
}
