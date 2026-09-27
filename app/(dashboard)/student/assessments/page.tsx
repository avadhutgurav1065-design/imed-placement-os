"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { GlassCard } from "@/components/shared/GlassCard";

const supabase = createClient();

export default function AssessmentHistoryPage() {
  const [assessments, setAssessments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedFeedback, setSelectedFeedback] = useState<any>(null);

  useEffect(() => {
    async function loadHistory() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: standardTests } = await supabase
        .from("student_assessments")
        .select("*")
        .eq("student_id", user.id);

      const { data: psychometricTests } = await supabase
        .from("psychometric_assessments")
        .select("*")
        .eq("user_id", user.id);

      const { data: interviewLogs } = await supabase
        .from("interview_logs")
        .select("*")
        .eq("student_id", user.id);

      const allAssessments = [
        ...(standardTests || []),
        ...(psychometricTests || []).map((pt: any) => ({
          ...pt,
          student_id: pt.user_id,
          assessment_type: "psychometric",
          job_role: pt.target_role,
          score: Math.round((
            pt.analytical_ability + 
            pt.execution_delivery + 
            pt.interpersonal_skills + 
            pt.team_collaboration + 
            pt.leadership_potential + 
            pt.stress_tolerance + 
            pt.adaptability + 
            pt.detail_orientation
          ) / 8),
          total_questions: 100, // Dummy for percentage calculation logic
          difficulty_breakdown: {
            isPsychometric: true,
            summary_report: pt.summary_report,
            analytical_ability: pt.analytical_ability,
            execution_delivery: pt.execution_delivery,
            interpersonal_skills: pt.interpersonal_skills,
            team_collaboration: pt.team_collaboration,
            leadership_potential: pt.leadership_potential,
            stress_tolerance: pt.stress_tolerance,
            adaptability: pt.adaptability,
            detail_orientation: pt.detail_orientation
          }
        })),
        ...(interviewLogs || []).map((il: any) => ({
          ...il,
          assessment_type: "live_interview",
          job_role: il.target_role,
          score: il.overall_score || 0,
          total_questions: 100,
          difficulty_breakdown: {
            isInterview: true,
            action_plan: il.ai_feedback?.action_plan,
            behavior: il.ai_feedback?.student_behavior,
            feedback: il.ai_feedback?.feedback
          }
        }))
      ].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

      setAssessments(allAssessments);
      setLoading(false);
    }
    loadHistory();
  }, []);

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      <div>
        <h1 className="text-3xl font-extrabold gradient-text mb-2">Assessment History</h1>
        <p className="text-slate-400">Review your past Aptitude and Technical Skills tests.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-4">
          {loading ? (
            <div className="text-center py-12">
              <div className="w-10 h-10 border-4 border-indigo-500/30 border-t-indigo-500 rounded-full animate-spin mx-auto mb-4" />
              <p className="text-slate-400 animate-pulse">Loading assessments...</p>
            </div>
          ) : assessments.length === 0 ? (
            <GlassCard className="p-12 text-center">
              <h3 className="text-xl font-bold text-white mb-2">No Assessments Yet</h3>
              <p className="text-slate-400">Take your first Technical or Aptitude test to see your results here.</p>
            </GlassCard>
          ) : (
            assessments.map((test) => (
              <GlassCard 
                key={test.id} 
                className="p-6 border-white/5 hover:border-indigo-500/30 cursor-pointer transition-colors"
                onClick={() => setSelectedFeedback(test)}
              >
                <div className="flex items-start justify-between">
                  <div>
                    <div className="flex items-center gap-2 mb-2">
                      <span className={`px-2.5 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${
                        test.assessment_type === 'technical' ? 'bg-indigo-500/10 text-indigo-400' : test.assessment_type === 'live_interview' ? 'bg-cyan-500/10 text-cyan-400' : 'bg-rose-500/10 text-rose-400'
                      }`}>
                        {test.assessment_type.replace('_', ' ')}
                      </span>
                      <span className="text-slate-500 text-sm">
                        {new Date(test.created_at).toLocaleDateString()}
                      </span>
                    </div>
                    <h3 className="text-xl font-bold text-white">{test.job_role}</h3>
                    <p className="text-slate-400 text-sm mt-1">Total Questions/Challenges: {test.total_questions}</p>
                  </div>
                  <div className="text-right">
                    <span className={`text-4xl font-extrabold ${
                      (test.assessment_type === 'technical' || test.assessment_type === 'live_interview' ? test.score : (test.score / test.total_questions) * 100) >= 75 ? "text-emerald-400" : (test.assessment_type === 'technical' || test.assessment_type === 'live_interview' ? test.score : (test.score / test.total_questions) * 100) >= 50 ? "text-amber-400" : "text-rose-400"
                    }`}>
                      {test.assessment_type === 'technical' || test.assessment_type === 'live_interview' ? test.score : Math.round((test.score / test.total_questions) * 100)}%
                    </span>
                    <p className="text-slate-500 text-xs mt-1 uppercase font-semibold">Overall Score</p>
                  </div>
                </div>
              </GlassCard>
            ))
          )}
        </div>

        <div>
          <GlassCard className="p-6 sticky top-6">
            <h2 className="text-xl font-bold text-white mb-4">Detailed Feedback</h2>
            {!selectedFeedback ? (
              <div className="text-center py-12 border-2 border-dashed border-white/10 rounded-xl">
                <p className="text-slate-400 text-sm">Select an assessment from the list to view detailed feedback.</p>
              </div>
            ) : (
              <div className="space-y-6 animate-fade-in">
                <div className="pb-4 border-b border-white/10">
                  <h3 className="text-lg font-bold text-white capitalize">{selectedFeedback.assessment_type} Test</h3>
                  <p className="text-slate-400 text-sm">{selectedFeedback.job_role}</p>
                </div>

                {selectedFeedback.assessment_type === 'technical' ? (
                  <div className="space-y-6">
                    {Array.isArray(selectedFeedback.difficulty_breakdown) ? (
                      selectedFeedback.difficulty_breakdown.map((fb: any, idx: number) => (
                        <div key={idx} className="bg-white/5 rounded-xl p-4">
                          <div className="flex justify-between items-start mb-2">
                            <h4 className="font-semibold text-white text-sm">{fb.challengeTitle}</h4>
                            <span className="text-indigo-400 font-mono text-sm bg-indigo-500/10 px-2 py-0.5 rounded">
                              {fb.score}/34
                            </span>
                          </div>
                          <p className="text-slate-300 text-sm leading-relaxed">{fb.comments}</p>
                        </div>
                      ))
                    ) : (
                      <p className="text-slate-400 text-sm">No detailed feedback available for this test.</p>
                    )}
                  </div>
                ) : selectedFeedback.assessment_type === 'psychometric' ? (
                  <div className="space-y-6">
                    <div className="bg-fuchsia-500/10 rounded-xl p-4 border border-fuchsia-500/20">
                      <p className="text-white text-sm leading-relaxed">{selectedFeedback.difficulty_breakdown?.summary_report || "No summary available."}</p>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      {['analytical_ability', 'execution_delivery', 'interpersonal_skills', 'team_collaboration', 'leadership_potential', 'stress_tolerance', 'adaptability', 'detail_orientation'].map((trait) => (
                        <div key={trait} className="bg-white/5 rounded-lg p-3">
                          <p className="text-slate-400 text-xs font-semibold uppercase mb-1">{trait.replace('_', ' ')}</p>
                          <p className="text-white font-bold text-lg">{selectedFeedback.difficulty_breakdown?.[trait] || 0}%</p>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : selectedFeedback.assessment_type === 'live_interview' ? (
                  <div className="space-y-6">
                    <div className="bg-cyan-500/10 rounded-xl p-4 border border-cyan-500/20">
                      <p className="text-cyan-400 text-sm font-semibold mb-1">AI Feedback</p>
                      <p className="text-white text-sm leading-relaxed whitespace-pre-wrap">{selectedFeedback.difficulty_breakdown?.feedback || "No feedback available."}</p>
                    </div>
                    <div className="bg-indigo-500/10 rounded-xl p-4 border border-indigo-500/20">
                      <p className="text-indigo-400 text-sm font-semibold mb-1">Action Plan & Future Development</p>
                      <p className="text-white text-sm leading-relaxed whitespace-pre-wrap">{selectedFeedback.difficulty_breakdown?.action_plan || "No action plan available."}</p>
                    </div>
                    <div className="bg-white/5 rounded-xl p-4">
                      <p className="text-slate-400 text-sm font-semibold mb-1">Behavior & Proctoring Analysis</p>
                      <p className="text-slate-300 text-sm">{selectedFeedback.difficulty_breakdown?.behavior || "No behavioral data recorded."}</p>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {selectedFeedback.difficulty_breakdown ? (
                      <>
                        <div className="bg-emerald-500/10 rounded-xl p-4 border border-emerald-500/20">
                          <p className="text-emerald-400 text-sm font-semibold mb-1">Easy Questions</p>
                          <p className="text-white text-lg">{selectedFeedback.difficulty_breakdown.easyCorrect} / {selectedFeedback.difficulty_breakdown.easyTotal} correct</p>
                        </div>
                        <div className="bg-amber-500/10 rounded-xl p-4 border border-amber-500/20">
                          <p className="text-amber-400 text-sm font-semibold mb-1">Medium Questions</p>
                          <p className="text-white text-lg">{selectedFeedback.difficulty_breakdown.mediumCorrect} / {selectedFeedback.difficulty_breakdown.mediumTotal} correct</p>
                        </div>
                        <div className="bg-rose-500/10 rounded-xl p-4 border border-rose-500/20">
                          <p className="text-rose-400 text-sm font-semibold mb-1">Hard Questions</p>
                          <p className="text-white text-lg">{selectedFeedback.difficulty_breakdown.hardCorrect} / {selectedFeedback.difficulty_breakdown.hardTotal} correct</p>
                        </div>
                      </>
                    ) : (
                      <p className="text-slate-400 text-sm">No difficulty breakdown available.</p>
                    )}
                  </div>
                )}
              </div>
            )}
          </GlassCard>
        </div>
      </div>
    </div>
  );
}

