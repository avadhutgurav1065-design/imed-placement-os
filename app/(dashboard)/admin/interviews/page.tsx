"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { GlassCard } from "@/components/shared/GlassCard";
import { DataTable } from "@/components/shared/DataTable";

const supabase = createClient();

export default function InterviewLogsPage() {
  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadLogs() {
      try {
        const { data, error } = await supabase
          .from("interview_logs")
          .select("*")
          .order("created_at", { ascending: false });
        
        if (error) throw error;
        setLogs(data || []);
      } catch (err) {
        console.error("Error loading interview logs:", err);
        setLogs([]);
      } finally {
        setLoading(false);
      }
    }
    loadLogs();
  }, []);

  const columns = [
    {
      key: "student_name",
      header: "Student",
      render: (row: any) => <span className="text-white font-medium">{row.student_name || "Unknown"}</span>,
    },
    {
      key: "target_role",
      header: "Target Role",
      render: (row: any) => <span className="text-cyan-400 font-medium">{row.target_role || "General"}</span>,
    },
    {
      key: "score",
      header: "Score",
      render: (row: any) => (
        <span className={`font-bold ${
          row.overall_score >= 75 ? "text-emerald-400" : row.overall_score >= 50 ? "text-amber-400" : "text-rose-400"
        }`}>
          {row.overall_score ? `${row.overall_score}%` : "—"}
        </span>
      ),
    },
    {
      key: "action_plan",
      header: "Future Plan",
      render: (row: any) => {
        const plan = row.ai_feedback?.action_plan || row.ai_feedback?.feedback || "—";
        return (
          <span className="text-slate-400 text-xs line-clamp-2 max-w-xs" title={plan}>
            {plan}
          </span>
        );
      },
    },
    {
      key: "student_behavior",
      header: "Proctoring / Behavior",
      render: (row: any) => {
        const behavior = row.ai_feedback?.student_behavior || "—";
        const hasWarning = behavior.toLowerCase().includes("cheating") || behavior.toLowerCase().includes("reading") || behavior.toLowerCase().includes("away");
        return (
          <span className={`text-xs line-clamp-2 max-w-[200px] ${hasWarning ? "text-rose-400 font-semibold" : "text-slate-400"}`} title={behavior}>
            {behavior}
          </span>
        );
      },
    },
    {
      key: "created_at",
      header: "Timestamp",
      render: (row: any) => (
        <span className="text-slate-500 text-xs">
          {row.created_at ? new Date(row.created_at).toLocaleString() : "—"}
        </span>
      ),
    },
  ];

  return (
    <div className="space-y-6 max-w-7xl">
      <div>
        <h1 className="text-2xl font-extrabold gradient-text mb-1">
          AI Interview Telemetry
        </h1>
        <p className="text-slate-400 text-sm">
          Monitor live and historical mock interviews conducted by the AI Screening Engine.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <GlassCard padding="sm">
          <p className="text-xs text-slate-400 font-medium">Total Interviews Run</p>
          <p className="text-2xl font-extrabold text-indigo-400">{logs.length}</p>
        </GlassCard>
        {/* Can add more metrics here like average length, top roles interviewed for etc */}
      </div>

      <DataTable
        columns={columns}
        data={logs}
        isLoading={loading}
        emptyMessage="No AI interviews have been conducted yet."
      />
    </div>
  );
}
