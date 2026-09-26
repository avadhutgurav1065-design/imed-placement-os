"use client";

import { useEffect, useState } from "react";
import { createBrowserClient } from "@supabase/ssr";
import { GlassCard } from "@/components/shared/GlassCard";
import {
  Radar,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  ResponsiveContainer,
  Tooltip
} from "recharts";

interface Assessment {
  id: string;
  student_name: string;
  target_role: string;
  analytical_ability: number;
  execution_delivery: number;
  interpersonal_skills: number;
  team_collaboration: number;
  leadership_potential: number;
  stress_tolerance: number;
  adaptability: number;
  detail_orientation: number;
  summary_report: string;
  created_at: string;
}

export default function PsychometricsDashboard() {
  const [assessments, setAssessments] = useState<Assessment[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedStudent, setSelectedStudent] = useState<Assessment | null>(null);

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  useEffect(() => {
    fetchAssessments();
  }, []);

  const fetchAssessments = async () => {
    try {
      const { data, error } = await supabase
        .from("psychometric_assessments")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      setAssessments(data || []);
      if (data && data.length > 0) {
        setSelectedStudent(data[0]);
      }
    } catch (error) {
      console.error("Error fetching assessments:", error);
    } finally {
      setLoading(false);
    }
  };

  const formatChartData = (assessment: Assessment) => {
    return [
      { subject: "Analytical", score: assessment.analytical_ability, fullMark: 100 },
      { subject: "Execution", score: assessment.execution_delivery, fullMark: 100 },
      { subject: "Interpersonal", score: assessment.interpersonal_skills, fullMark: 100 },
      { subject: "Teamwork", score: assessment.team_collaboration, fullMark: 100 },
      { subject: "Leadership", score: assessment.leadership_potential, fullMark: 100 },
      { subject: "Stress Tolerance", score: assessment.stress_tolerance, fullMark: 100 },
      { subject: "Adaptability", score: assessment.adaptability, fullMark: 100 },
      { subject: "Details", score: assessment.detail_orientation, fullMark: 100 },
    ];
  };

  if (loading) {
    return (
      <div className="p-8 flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-indigo-500/20 border-t-indigo-500 rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="p-8 max-w-7xl mx-auto">
      <div className="mb-8 flex justify-between items-end">
        <div>
          <h1 className="text-3xl font-bold text-white mb-2">Behavioral Intelligence</h1>
          <p className="text-slate-400">Harrison Paradox Theory & Psychometric Reports</p>
        </div>
        <div className="text-sm px-4 py-2 bg-indigo-500/10 text-indigo-400 rounded-full border border-indigo-500/20">
          {assessments.length} Reports Available
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Student List Sidebar */}
        <div className="lg:col-span-1 space-y-4">
          <h3 className="text-lg font-medium text-white mb-4">Candidates</h3>
          <div className="space-y-3 overflow-y-auto max-h-[600px] pr-2 custom-scrollbar">
            {assessments.length === 0 ? (
              <p className="text-slate-500 italic text-center py-8">No tests completed yet.</p>
            ) : (
              assessments.map((student) => (
                <button
                  key={student.id}
                  onClick={() => setSelectedStudent(student)}
                  className={`w-full text-left p-4 rounded-xl border transition-all duration-200 ${
                    selectedStudent?.id === student.id
                      ? "bg-indigo-500/10 border-indigo-500/50 text-white shadow-[0_0_15px_rgba(99,102,241,0.1)]"
                      : "bg-slate-900/50 border-slate-800 text-slate-400 hover:bg-slate-800 hover:border-slate-700"
                  }`}
                >
                  <div className="font-medium text-lg">{student.student_name}</div>
                  <div className="text-xs text-slate-500 mt-1">
                    Taken: {new Date(student.created_at).toLocaleDateString()}
                  </div>
                </button>
              ))
            )}
          </div>
        </div>

        {/* Radar Chart & Analysis View */}
        <div className="lg:col-span-2">
          {selectedStudent ? (
            <GlassCard padding="lg" className="h-full flex flex-col">
              <div className="flex items-center justify-between mb-8 pb-6 border-b border-slate-800">
                <div>
                  <h2 className="text-2xl font-bold text-white">{selectedStudent.student_name}</h2>
                  <p className="text-indigo-400">Target Role: {selectedStudent.target_role || "Generic Assessment"}</p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
                {/* Radar Chart */}
                <div className="h-[350px] w-full bg-slate-900/30 rounded-2xl p-4 flex items-center justify-center border border-slate-800/50">
                  <ResponsiveContainer width="100%" height="100%">
                    <RadarChart cx="50%" cy="50%" outerRadius="70%" data={formatChartData(selectedStudent)}>
                      <PolarGrid stroke="#334155" />
                      <PolarAngleAxis dataKey="subject" tick={{ fill: '#94a3b8', fontSize: 11 }} />
                      <PolarRadiusAxis angle={30} domain={[0, 100]} tick={{ fill: '#475569' }} />
                      <Tooltip 
                        contentStyle={{ backgroundColor: '#0f172a', borderColor: '#1e293b', borderRadius: '8px' }}
                        itemStyle={{ color: '#818cf8' }}
                      />
                      <Radar
                        name="Score"
                        dataKey="score"
                        stroke="#6366f1"
                        strokeWidth={2}
                        fill="#6366f1"
                        fillOpacity={0.3}
                      />
                    </RadarChart>
                  </ResponsiveContainer>
                </div>

                {/* Score Breakdown */}
                <div className="space-y-4">
                  <h3 className="font-medium text-slate-300 border-b border-slate-800 pb-2">Trait Breakdown</h3>
                  <div className="space-y-3">
                    {formatChartData(selectedStudent).map((item) => (
                      <div key={item.subject} className="flex items-center justify-between">
                        <span className="text-sm text-slate-400">{item.subject}</span>
                        <div className="flex items-center gap-3 w-1/2">
                          <div className="flex-1 h-1.5 bg-slate-800 rounded-full overflow-hidden">
                            <div 
                              className="h-full bg-gradient-to-r from-indigo-500 to-cyan-400" 
                              style={{ width: `${item.score}%` }}
                            />
                          </div>
                          <span className="text-xs font-medium text-white w-6 text-right">{item.score}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* AI Summary Report */}
              <div className="flex-1 bg-slate-900/50 rounded-2xl p-6 border border-slate-800">
                <div className="flex items-center gap-2 mb-4">
                  <svg className="w-5 h-5 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                  <h3 className="font-medium text-white">AI Behavioral Summary</h3>
                </div>
                <div className="prose prose-invert prose-sm max-w-none text-slate-300 leading-relaxed">
                  {selectedStudent.summary_report.split('\n').map((paragraph, idx) => (
                    <p key={idx} className="mb-3 last:mb-0">{paragraph}</p>
                  ))}
                </div>
              </div>
            </GlassCard>
          ) : (
            <GlassCard padding="lg" className="h-full flex items-center justify-center text-center">
              <div className="text-slate-500">
                <svg className="w-16 h-16 mx-auto mb-4 opacity-50" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
                <p>Select a candidate to view their behavioral profile</p>
              </div>
            </GlassCard>
          )}
        </div>
      </div>
    </div>
  );
}
