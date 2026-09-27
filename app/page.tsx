// SERVER COMPONENT - No "use client" = no hydration = immune to browser extensions
import { cn } from "@/lib/utils";
import { InstallPWA } from "@/components/shared/InstallPWA";

// Inline GlassCard as a server-compatible component
function Card({ children, className, ...props }: { children: React.ReactNode; className?: string; [k: string]: any }) {
  return (
    <div className={cn("glass-card p-6 glass-hover animate-slide-in-up", className)} {...props}>
      {children}
    </div>
  );
}

export default function LandingPage() {
  // Pre-compute the wave elements (no .map needed)
  const waveHeights = [32, 64, 40, 80, 48, 72, 24, 56];

  return (
    <div className="min-h-screen bg-[#020617] text-slate-300 relative overflow-hidden font-sans selection:bg-cyan-500/30 selection:text-cyan-200">
      
      {/* Dynamic Background Effects */}
      <div className="absolute inset-0 z-0 pointer-events-none">
        <div className="absolute inset-0 opacity-[0.015]" style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n' x='0' y='0'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E")` }} />
        <div className="absolute top-[-20%] left-[-10%] w-[60vw] h-[60vw] rounded-full bg-cyan-600/10 blur-[120px] animate-pulse-ring" />
        <div className="absolute bottom-[-20%] right-[-10%] w-[50vw] h-[50vw] rounded-full bg-indigo-600/10 blur-[100px] animate-pulse-ring" style={{ animationDelay: '2s' }} />
        <div className="absolute top-[40%] left-[60%] w-[30vw] h-[30vw] rounded-full bg-emerald-600/5 blur-[80px] animate-pulse-ring" style={{ animationDelay: '1s' }} />
      </div>

      {/* Navigation Bar */}
      <nav className="relative z-10 flex items-center justify-between px-6 py-4 lg:px-12 backdrop-blur-md border-b border-white/[0.02]">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-cyan-400 to-blue-600 flex items-center justify-center shadow-[0_0_15px_rgba(34,211,238,0.4)]">
            <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
          </div>
          <span className="font-extrabold text-xl tracking-tight text-white">IMED OS</span>
        </div>
        <div className="flex gap-4">
          <a href="/login" className="px-5 py-2 text-sm font-semibold text-slate-300 hover:text-white transition-colors">
            Sign In
          </a>
          <a href="/login" className="px-6 py-2 text-sm font-bold text-slate-900 bg-cyan-400 rounded-full hover:bg-cyan-300 transition-all shadow-[0_0_15px_rgba(34,211,238,0.3)] hover:shadow-[0_0_25px_rgba(34,211,238,0.5)]">
            Access Portal
          </a>
        </div>
      </nav>

      {/* Hero Section */}
      <main className="relative z-10 px-6 pt-24 pb-16 lg:px-12 mx-auto max-w-7xl animate-slide-in-up">
        <div className="text-center max-w-4xl mx-auto mb-20">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 text-xs font-bold uppercase tracking-widest mb-6">
            <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />
            AI-Powered Placement Engine
          </div>
          <h1 className="text-4xl sm:text-5xl lg:text-7xl font-black text-white leading-tight mb-6 tracking-tighter">
            Bridging the gap between <br className="hidden md:block"/>
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-blue-500 to-indigo-600">
              Campus &amp; Corporate.
            </span>
          </h1>
          <div className="mb-8">
            <p className="text-[10px] md:text-xs font-bold text-slate-500 tracking-widest uppercase">
              Designed and developed by <span className="text-cyan-400">Avadhut Gurav</span>
            </p>
          </div>
          <p className="text-base sm:text-lg text-slate-400 max-w-2xl mx-auto leading-relaxed mb-10 font-medium">
            IMED Placement OS leverages Gemini AI to evaluate student readiness, conduct real-time technical interviews, and match cohorts to ingested corporate requirements with extreme precision.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 w-full">
            <a 
              href="/login"
              className="inline-flex items-center justify-center px-8 py-4 bg-gradient-to-r from-cyan-500 to-blue-600 text-white rounded-full font-bold text-lg hover:from-cyan-400 hover:to-blue-500 transition-all shadow-[0_0_30px_rgba(34,211,238,0.4)] hover:shadow-[0_0_50px_rgba(34,211,238,0.6)] transform hover:-translate-y-1 w-full sm:w-auto"
            >
              Enter Platform Space
            </a>
            <InstallPWA 
              className="w-full sm:w-auto" 
              buttonClassName="w-full sm:w-auto px-8 py-4 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 rounded-full text-lg shadow-[0_0_30px_rgba(79,70,229,0.3)] hover:shadow-[0_0_50px_rgba(79,70,229,0.5)] transform hover:-translate-y-1" 
            />
          </div>
        </div>

        {/* Features: Bento Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 auto-rows-[250px]">
          
          {/* Feature 1: AI Gap Analyzer (Large) */}
          <div className="md:col-span-2 lg:col-span-2 row-span-2 relative group">
            <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/5 to-indigo-500/5 rounded-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />
            <Card className="h-full border-white/[0.04] hover:border-cyan-500/30 transition-all duration-500 flex flex-col justify-between overflow-hidden">
              <div className="p-4 z-10 relative">
                <div className="w-12 h-12 rounded-xl bg-cyan-500/10 flex items-center justify-center mb-6">
                  <svg className="w-6 h-6 text-cyan-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 002-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                  </svg>
                </div>
                <h3 className="text-2xl font-bold text-white mb-3">AI Gap Analyzer</h3>
                <p className="text-slate-400 max-w-sm">
                  Upload a PDF resume. The system vectorizes the text and scores it against real LinkedIn Job Descriptions using Gemini AI, generating a 48-hour remediation plan.
                </p>
              </div>
              <div className="absolute bottom-0 right-0 w-2/3 h-2/3 bg-gradient-to-tl from-cyan-900/40 to-transparent blur-xl rounded-tl-full -z-10" />
            </Card>
          </div>

          {/* Feature 2: Voice Interview (Tall) */}
          <div className="row-span-2 relative group">
            <Card className="h-full border-white/[0.04] hover:border-emerald-500/30 transition-all duration-500 flex flex-col justify-between bg-gradient-to-b from-slate-900/50 to-emerald-950/20">
              <div className="p-4 relative z-10">
                <div className="w-12 h-12 rounded-xl bg-emerald-500/10 flex items-center justify-center mb-6">
                  <svg className="w-6 h-6 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
                  </svg>
                </div>
                <h3 className="text-xl font-bold text-white mb-3">Live Voice Screening</h3>
                <p className="text-slate-400 text-sm">
                  Simulate technical HR rounds with a conversational AI agent. Uses Speech Recognition and Synthesis to evaluate domain knowledge dynamically.
                </p>
              </div>
              
              {/* Decorative Audio Waves - Static HTML, no .map() */}
              <div className="px-8 pb-8 flex items-end gap-1 opacity-50 group-hover:opacity-100 transition-opacity">
                <div className="w-full bg-emerald-500/30 rounded-t-sm" style={{ height: '32px', animation: 'pulse-ring 1s infinite alternate 0s' }} />
                <div className="w-full bg-emerald-500/30 rounded-t-sm" style={{ height: '64px', animation: 'pulse-ring 1s infinite alternate 0.1s' }} />
                <div className="w-full bg-emerald-500/30 rounded-t-sm" style={{ height: '40px', animation: 'pulse-ring 1s infinite alternate 0.2s' }} />
                <div className="w-full bg-emerald-500/30 rounded-t-sm" style={{ height: '80px', animation: 'pulse-ring 1s infinite alternate 0.3s' }} />
                <div className="w-full bg-emerald-500/30 rounded-t-sm" style={{ height: '48px', animation: 'pulse-ring 1s infinite alternate 0.4s' }} />
                <div className="w-full bg-emerald-500/30 rounded-t-sm" style={{ height: '72px', animation: 'pulse-ring 1s infinite alternate 0.5s' }} />
                <div className="w-full bg-emerald-500/30 rounded-t-sm" style={{ height: '24px', animation: 'pulse-ring 1s infinite alternate 0.6s' }} />
                <div className="w-full bg-emerald-500/30 rounded-t-sm" style={{ height: '56px', animation: 'pulse-ring 1s infinite alternate 0.7s' }} />
              </div>
            </Card>
          </div>

          {/* Feature 3: Corporate Roster */}
          <div className="relative group">
            <Card className="h-full border-white/[0.04] hover:border-indigo-500/30 transition-all duration-500">
              <div className="p-4">
                <div className="w-10 h-10 rounded-lg bg-indigo-500/10 flex items-center justify-center mb-4">
                  <svg className="w-5 h-5 text-indigo-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                  </svg>
                </div>
                <h3 className="text-lg font-bold text-white mb-2">Match Router</h3>
                <p className="text-slate-400 text-xs">
                  Admins query the database instantly for all students scoring &gt;75% on a specific Job Profile, generating an exportable NAAC/Corporate roster.
                </p>
              </div>
            </Card>
          </div>

          {/* Feature 4: Cohort Radar */}
          <div className="relative group">
            <Card className="h-full border-white/[0.04] hover:border-rose-500/30 transition-all duration-500">
              <div className="p-4">
                <div className="w-10 h-10 rounded-lg bg-rose-500/10 flex items-center justify-center mb-4">
                  <svg className="w-5 h-5 text-rose-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 3.055A9.001 9.001 0 1020.945 13H11V3.055z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.488 9H15V3.512A9.025 9.025 0 0120.488 9z" />
                  </svg>
                </div>
                <h3 className="text-lg font-bold text-white mb-2">Cohort Radar</h3>
                <p className="text-slate-400 text-xs">
                  Aggregates all &quot;missing skills&quot; from gap analyses across the entire student batch to prioritize institutional training workshops.
                </p>
              </div>
            </Card>
          </div>

          {/* Feature 5: Job Ingestion */}
          <div className="relative group">
            <Card className="h-full border-white/[0.04] hover:border-amber-500/30 transition-all duration-500">
              <div className="p-4">
                <div className="w-10 h-10 rounded-lg bg-amber-500/10 flex items-center justify-center mb-4">
                  <svg className="w-5 h-5 text-amber-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                </div>
                <h3 className="text-lg font-bold text-white mb-2">Job Engine</h3>
                <p className="text-slate-400 text-xs">
                  Automated scraping of live LinkedIn requirements. JDs are vectorized and stored for precise embedding-based comparison.
                </p>
              </div>
            </Card>
          </div>

        </div>
      </main>
      
      <footer className="border-t border-white/[0.02] py-8 text-center text-slate-500 text-sm relative z-10">
        IMED Placement OS © 2026. Built with Next.js &amp; Google Gemini.
      </footer>
    </div>
  );
}