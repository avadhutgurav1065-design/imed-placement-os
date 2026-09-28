"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { GlassCard } from "@/components/shared/GlassCard";
import { StatCard } from "@/components/shared/StatCard";
import { ReadinessGauge } from "@/components/shared/ReadinessGauge";
import Link from "next/link";

const supabase = createClient();

export default function StudentHome() {
  const [stats, setStats] = useState({
    totalScans: 0,
    avgScore: 0,
    bestScore: 0,
    recentScans: [] as any[],
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadStats() {
      try {
        const {
          data: { user },
        } = await supabase.auth.getUser();

        if (user) {
          const { data: analyses, error: err1 } = await supabase
            .from("gap_analyses")
            .select("*")
            .eq("student_id", user.id);

          const { data: stdTests, error: err2 } = await supabase
            .from("student_assessments")
            .select("*")
            .eq("student_id", user.id);

          const { data: psychTests, error: err3 } = await supabase
            .from("psychometric_assessments")
            .select("*")
            .eq("user_id", user.id);

          if (err1) console.error(err1);
          if (err2) console.error(err2);
          if (err3) console.error(err3);

          const allActivity = [
            ...(analyses || []).map((a: any) => ({
               ...a,
               type: 'gap_analysis',
               score: a.match_score || 0,
               title: `Resume Match - ${a.job_role || 'General'}`,
               date: a.created_at
            })),
            ...(stdTests || []).map((t: any) => ({
               ...t,
               type: 'assessment',
               score: t.assessment_type === 'technical' ? t.score : Math.round((t.score / t.total_questions) * 100) || 0,
               title: `${t.assessment_type === 'technical' ? 'Technical' : 'Aptitude'} Test - ${t.job_role}`,
               date: t.created_at
            })),
            ...(psychTests || []).map((pt: any) => ({
               ...pt,
               type: 'psychometric',
               score: Math.round(((pt.analytical_ability || 0) + (pt.execution_delivery || 0) + (pt.interpersonal_skills || 0) + (pt.team_collaboration || 0) + (pt.leadership_potential || 0) + (pt.stress_tolerance || 0) + (pt.adaptability || 0) + (pt.detail_orientation || 0)) / 8) || 0,
               title: `Psychometric Test - ${pt.target_role}`,
               date: pt.created_at
            }))
          ].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

          const totalScans = allActivity.length;
          const avgScore =
            totalScans > 0
              ? Math.round(allActivity.reduce((s: any, a: any) => s + (a.score || 0), 0) / totalScans)
              : 0;
          const bestScore =
            totalScans > 0
              ? Math.max(...allActivity.map((a: any) => a.score || 0))
              : 0;

          setStats({
            totalScans,
            avgScore,
            bestScore,
            recentScans: allActivity.slice(0, 5),
          });
        }
      } catch (err) {
        console.error("Failed to load student stats:", err);
      } finally {
        setLoading(false);
      }
    }
    loadStats();
  }, []);

  return (
    <div className="space-y-8">
      {/* Hero Header */}
      <div suppressHydrationWarning className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
        <div>
          <h1 className="text-3xl font-extrabold gradient-text mb-2">
            Student Workspace
          </h1>
          <p className="text-slate-400 text-sm max-w-lg">
            Upload your resume, analyze gaps against corporate JDs, and track your placement readiness in real-time.
          </p>
        </div>
        <ReadinessGauge
          score={stats.avgScore}
          size="lg"
          label="Placement Readiness"
        />
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <StatCard
          label="Total Activity"
          value={stats.totalScans}
          color="cyan"
          icon={
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
          }
        />
        <StatCard
          label="Overall Average"
          value={stats.avgScore}
          suffix="%"
          color={stats.avgScore >= 75 ? "emerald" : "amber"}
          icon={
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
            </svg>
          }
        />
        <StatCard
          label="Best Score"
          value={stats.bestScore}
          suffix="%"
          color="emerald"
          icon={
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
            </svg>
          }
        />
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
        <Link href="/student/analyze">
          <GlassCard className="group h-full cursor-pointer border-cyan-500/10 hover:border-cyan-500/30 flex flex-col justify-between">
            <div className="flex flex-col gap-4">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-cyan-500/20 to-indigo-500/20 flex items-center justify-center group-hover:scale-110 transition-transform">
                <svg className="w-6 h-6 text-cyan-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
              </div>
              <div>
                <h3 className="text-white font-semibold">Skill Matching</h3>
                <p className="text-slate-400 text-xs mt-1">
                  Upload resume & match against corporate JDs
                </p>

              </div>
              <svg className="w-5 h-5 text-slate-600 group-hover:text-cyan-400 mt-4 transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </div>
          </GlassCard>
        </Link>

        <Link href="/student/technical-skills">
          <GlassCard className="group h-full cursor-pointer border-indigo-500/10 hover:border-indigo-500/30 flex flex-col justify-between">
            <div className="flex flex-col gap-4">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-indigo-500/20 to-blue-500/20 flex items-center justify-center group-hover:scale-110 transition-transform">
                <svg className="w-6 h-6 text-indigo-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
                </svg>
              </div>
              <div>
                <h3 className="text-white font-semibold">Technical Skills</h3>
                <p className="text-slate-400 text-xs mt-1">
                  Assess domain knowledge & tech stack
                </p>
              </div>
              <svg className="w-5 h-5 text-slate-600 group-hover:text-indigo-400 mt-4 transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </div>
          </GlassCard>
        </Link>

        <Link href="/student/aptitude">
          <GlassCard className="group h-full cursor-pointer border-rose-500/10 hover:border-rose-500/30 flex flex-col justify-between">
            <div className="flex flex-col gap-4">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-rose-500/20 to-pink-500/20 flex items-center justify-center group-hover:scale-110 transition-transform">
                <svg className="w-6 h-6 text-rose-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                </svg>
              </div>
              <div>
                <h3 className="text-white font-semibold">Aptitude Test</h3>
                <p className="text-slate-400 text-xs mt-1">
                  Logical, verbal & quantitative reasoning
                </p>
              </div>
              <svg className="w-5 h-5 text-slate-600 group-hover:text-rose-400 mt-4 transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </div>
          </GlassCard>
        </Link>

        <Link href="/student/interview/live">
          <GlassCard className="group h-full cursor-pointer border-amber-500/10 hover:border-amber-500/30 flex flex-col justify-between">
            <div className="flex flex-col gap-4">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-amber-500/20 to-yellow-500/20 flex items-center justify-center group-hover:scale-110 transition-transform">
                <svg className="w-6 h-6 text-amber-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                </svg>
              </div>
              <div>
                <h3 className="text-white font-semibold">Live Interview</h3>
                <p className="text-slate-400 text-xs mt-1">
                  Multimodal AI with Video & Voice Analysis
                </p>
              </div>
              <svg className="w-5 h-5 text-slate-600 group-hover:text-amber-400 mt-4 transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </div>
          </GlassCard>
        </Link>

        <Link href="/student/psychometric">
          <GlassCard className="group h-full cursor-pointer border-emerald-500/10 hover:border-emerald-500/30 flex flex-col justify-between">
            <div className="flex flex-col gap-4">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-emerald-500/20 to-teal-500/20 flex items-center justify-center group-hover:scale-110 transition-transform">
                <svg className="w-6 h-6 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div>
                <h3 className="text-white font-semibold">Psychometric Test</h3>
                <p className="text-slate-400 text-xs mt-1">
                  AI Paradox Theory behavioral assessment
                </p>
              </div>
              <svg className="w-5 h-5 text-slate-600 group-hover:text-emerald-400 mt-4 transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </div>
          </GlassCard>
        </Link>
      </div>

      {/* Recent Scans */}
      <GlassCard>
        <div className="flex items-center justify-between mb-5">
          <h3 className="text-lg font-bold text-white">Recent Activity</h3>
          <Link
            href="/student/assessments"
            className="text-xs text-cyan-400 hover:text-cyan-300 font-medium transition-colors"
          >
            View All →
          </Link>
        </div>
        {loading ? (
          <div className="text-center py-8 text-slate-400 text-sm animate-pulse">
            Loading activity history...
          </div>
        ) : stats.recentScans.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-slate-500 text-sm">No activity yet.</p>
            <Link
              href="/student/analyze"
              className="text-cyan-400 text-sm font-medium hover:text-cyan-300 mt-2 inline-block"
            >
              Run your first analysis →
            </Link>
          </div>
        ) : (
          <div className="space-y-3">
            {stats.recentScans.map((scan, i) => (
              <div
                key={scan.id || i}
                className="flex items-center justify-between px-4 py-3 bg-white/[0.02] rounded-xl border border-white/[0.04] hover:bg-white/[0.04] transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div
                    className={`w-2 h-2 rounded-full ${
                      (scan.score || 0) >= 75 ? "bg-emerald-400" : "bg-rose-400"
                    }`}
                  />
                  <div>
                    <p className="text-sm text-white font-medium">
                      {scan.title}
                    </p>
                    <p className="text-xs text-slate-500">
                      {scan.date
                        ? new Date(scan.date).toLocaleDateString()
                        : ""}
                    </p>
                  </div>
                </div>
                <span
                  className={`text-lg font-extrabold ${
                    (scan.score || 0) >= 75 ? "text-emerald-400" : "text-rose-400"
                  }`}
                >
                  {scan.score || 0}%
                </span>
              </div>
            ))}
          </div>
        )}
      </GlassCard>
    </div>
  );
}
