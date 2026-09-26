"use client";

import { useState, useEffect } from "react";
import { GlassCard } from "@/components/shared/GlassCard";
import { createBrowserClient } from "@supabase/ssr";
import { Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, ResponsiveContainer } from "recharts";

interface Situation {
  id: string;
  scenario: string;
}

export default function PsychometricTestPage() {
  // Phase 1: Setup
  const [targetRole, setTargetRole] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [situations, setSituations] = useState<Situation[]>([]);
  const [drives, setDrives] = useState<string[]>([]);
  const [inputMode, setInputMode] = useState<"database" | "manual">("database");
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  // Phase 2: Test
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [currentStep, setCurrentStep] = useState(0);
  
  // Phase 3: Submit
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isComplete, setIsComplete] = useState(false);
  const [evaluation, setEvaluation] = useState<any>(null);

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  useEffect(() => {
    const fetchDrives = async () => {
      const { data, error } = await supabase.from("campus_drives").select("company_name, role_title");
      if (error) {
        console.error("Error fetching drives:", error);
      }
      if (data) {
        setDrives(data.map(d => `${d.company_name} - ${d.role_title}`));
      }
    };
    fetchDrives();
  }, [supabase]);

  const handleGenerateTest = async () => {
    if (!targetRole.trim()) return;
    
    setIsGenerating(true);
    try {
      const response = await fetch("/api/student/psychometric/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ targetRole }),
      });

      if (!response.ok) throw new Error("Failed to generate test");
      const data = await response.json();
      setSituations(data.situations);
    } catch (error) {
      console.error(error);
      alert("Something went wrong generating the assessment. Please try again.");
    } finally {
      setIsGenerating(false);
    }
  };

  const handleNext = () => {
    if (currentStep < situations.length - 1) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handlePrevious = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      // Format answers as qnaPairs for the AI
      const qnaPairs = situations.map(sit => ({
        scenario: sit.scenario,
        answer: answers[sit.id] || ""
      }));

      const response = await fetch("/api/student/psychometric", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          qnaPairs,
          targetRole,
          user_id: user?.id,
          email: user?.email,
        }),
      });

      if (!response.ok) throw new Error("Failed to submit assessment");
      
      const data = await response.json();
      setEvaluation(data.evaluation);
      setIsComplete(true);
    } catch (error) {
      console.error(error);
      alert("Something went wrong. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Render Setup Phase
  if (situations.length === 0) {
    return (
      <div className="p-8 max-w-4xl mx-auto mt-10">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">Psychometric & Behavioral Simulator</h1>
          <p className="text-slate-400">Targeted AI Harrison Paradox Assessment</p>
        </div>

        <GlassCard padding="lg" className="border-indigo-500/20 text-center py-16">
          {isGenerating ? (
            <div className="flex flex-col items-center justify-center">
              <div className="w-16 h-16 border-4 border-indigo-500/20 border-t-indigo-500 rounded-full animate-spin mb-6" />
              <h3 className="text-xl font-bold text-white mb-2">Designing Your Custom Assessment...</h3>
              <p className="text-slate-400 animate-pulse max-w-md">
                Our AI is currently acting as a corporate psychologist, drafting 7 unique, high-pressure situational scenarios specific to a {targetRole}.
              </p>
            </div>
          ) : (
            <div className="max-w-md mx-auto">
              <div className="w-16 h-16 bg-indigo-500/20 rounded-2xl flex items-center justify-center mx-auto mb-6">
                <svg className="w-8 h-8 text-indigo-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                </svg>
              </div>
              <h3 className="text-2xl font-bold text-white mb-4">What role are you targeting?</h3>
              <p className="text-slate-400 mb-8">
                Enter the exact job role or company you want to prepare for. The AI will generate a behavioral assessment tailored to the daily realities of that specific job.
              </p>
              
              
              <div className="flex flex-col gap-6">
                <div className="flex bg-slate-900/50 p-1 rounded-xl border border-slate-700">
                  <button
                    onClick={() => setInputMode("database")}
                    className={`flex-1 py-2 text-sm font-medium rounded-lg transition-colors ${
                      inputMode === "database" ? "bg-indigo-500 text-white shadow" : "text-slate-400 hover:text-white"
                    }`}
                  >
                    Active Campus Drives
                  </button>
                  <button
                    onClick={() => setInputMode("manual")}
                    className={`flex-1 py-2 text-sm font-medium rounded-lg transition-colors ${
                      inputMode === "manual" ? "bg-indigo-500 text-white shadow" : "text-slate-400 hover:text-white"
                    }`}
                  >
                    Custom Role
                  </button>
                </div>

                {inputMode === "database" ? (
                  <div className="relative">
                    <button
                      onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                      className="w-full bg-slate-900/50 border border-slate-700 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-indigo-500 transition-colors text-center flex items-center justify-between"
                    >
                      <span className="flex-1">{targetRole || "-- Select an Active Drive --"}</span>
                      <svg className="w-5 h-5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
                    </button>
                    
                    {isDropdownOpen && (
                      <div className="absolute z-10 w-full mt-2 bg-slate-800 border border-slate-700 rounded-xl shadow-xl max-h-60 overflow-y-auto">
                        {drives.map((drive, idx) => (
                          <button
                            key={idx}
                            onClick={() => {
                              setTargetRole(drive);
                              setIsDropdownOpen(false);
                            }}
                            className="w-full text-left px-4 py-3 text-slate-200 hover:bg-indigo-500/20 hover:text-white transition-colors border-b border-slate-700/50 last:border-0"
                          >
                            {drive}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                ) : (
                  <input
                    type="text"
                    placeholder="e.g. Data Scientist, Investment Banker..."
                    value={targetRole}
                    onChange={(e) => setTargetRole(e.target.value)}
                    className="w-full bg-slate-900/50 border border-slate-700 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-indigo-500 transition-colors text-center"
                  />
                )}
                
                <button
                  onClick={handleGenerateTest}
                  disabled={!targetRole.trim()}
                  className="w-full py-3 rounded-xl font-medium bg-gradient-to-r from-indigo-500 to-cyan-500 text-white hover:opacity-90 disabled:opacity-50 transition-opacity"
                >
                  Generate Targeted Assessment
                </button>
              </div>
            </div>
          )}
        </GlassCard>
      </div>
    );
  }

  // Render Completion Phase
  if (isComplete) {
    const chartData = evaluation ? [
      { subject: 'Analytical', A: evaluation.analytical_ability, fullMark: 100 },
      { subject: 'Execution', A: evaluation.execution_delivery, fullMark: 100 },
      { subject: 'Interpersonal', A: evaluation.interpersonal_skills, fullMark: 100 },
      { subject: 'Teamwork', A: evaluation.team_collaboration, fullMark: 100 },
      { subject: 'Leadership', A: evaluation.leadership_potential, fullMark: 100 },
      { subject: 'Stress Tolerance', A: evaluation.stress_tolerance, fullMark: 100 },
      { subject: 'Adaptability', A: evaluation.adaptability, fullMark: 100 },
      { subject: 'Detail Focus', A: evaluation.detail_orientation, fullMark: 100 },
    ] : [];

    return (
      <div className="p-8 max-w-5xl mx-auto mt-10">
        <GlassCard padding="lg" className="border-indigo-500/20">
          <div className="text-center mb-10">
            <div className="w-16 h-16 bg-emerald-500/20 rounded-full flex items-center justify-center mx-auto mb-6">
              <svg className="w-8 h-8 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h2 className="text-3xl font-bold text-white mb-2">Assessment Complete</h2>
            <p className="text-slate-400">
              Your behavioral and psychological profile for <span className="text-indigo-400 font-semibold">{targetRole}</span> has been generated.
            </p>
          </div>

          {evaluation && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Radar Chart */}
              <div className="bg-slate-900/50 p-6 rounded-2xl border border-slate-800 flex flex-col items-center">
                <h3 className="text-xl font-bold text-white mb-6">Psychometric Radar</h3>
                <div className="w-full h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <RadarChart cx="50%" cy="50%" outerRadius="70%" data={chartData}>
                      <PolarGrid stroke="#334155" />
                      <PolarAngleAxis dataKey="subject" tick={{ fill: '#94a3b8', fontSize: 12 }} />
                      <PolarRadiusAxis angle={30} domain={[0, 100]} tick={false} axisLine={false} />
                      <Radar name="Candidate Profile" dataKey="A" stroke="#6366f1" fill="#6366f1" fillOpacity={0.5} />
                    </RadarChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Summary Report */}
              <div className="flex flex-col gap-6">
                <div className="bg-slate-900/50 p-6 rounded-2xl border border-slate-800">
                  <h3 className="text-xl font-bold text-indigo-400 mb-4">Paradox Theory Analysis</h3>
                  <div className="text-slate-300 leading-relaxed text-sm whitespace-pre-wrap">
                    {evaluation.summary_report}
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-slate-900/50 p-4 rounded-xl border border-slate-800 text-center">
                    <div className="text-3xl font-bold text-emerald-400 mb-1">{evaluation.analytical_ability}%</div>
                    <div className="text-xs text-slate-400 uppercase tracking-wider">Analytical</div>
                  </div>
                  <div className="bg-slate-900/50 p-4 rounded-xl border border-slate-800 text-center">
                    <div className="text-3xl font-bold text-blue-400 mb-1">{evaluation.team_collaboration}%</div>
                    <div className="text-xs text-slate-400 uppercase tracking-wider">Teamwork</div>
                  </div>
                  <div className="bg-slate-900/50 p-4 rounded-xl border border-slate-800 text-center">
                    <div className="text-3xl font-bold text-amber-400 mb-1">{evaluation.execution_delivery}%</div>
                    <div className="text-xs text-slate-400 uppercase tracking-wider">Execution</div>
                  </div>
                  <div className="bg-slate-900/50 p-4 rounded-xl border border-slate-800 text-center">
                    <div className="text-3xl font-bold text-purple-400 mb-1">{evaluation.adaptability}%</div>
                    <div className="text-xs text-slate-400 uppercase tracking-wider">Adaptability</div>
                  </div>
                </div>
              </div>
            </div>
          )}
          
          <div className="mt-10 text-center">
            <button
              onClick={() => window.location.href = '/student/dashboard'}
              className="px-8 py-3 rounded-xl font-medium bg-slate-800 text-white hover:bg-slate-700 transition-colors"
            >
              Return to Dashboard
            </button>
          </div>
        </GlassCard>
      </div>
    );
  }

  // Render Test Phase
  const situation = situations[currentStep];
  const currentAnswer = answers[situation.id] || "";

  return (
    <div className="p-8 max-w-4xl mx-auto mt-10">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-white mb-2">{targetRole} Assessment</h1>
        <p className="text-slate-400">Psychometric & Behavioral Simulator</p>
      </div>

      <GlassCard padding="lg" className="border-indigo-500/20 relative overflow-hidden">
        {/* Progress Bar */}
        <div className="absolute top-0 left-0 h-1 bg-slate-800 w-full">
          <div 
            className="h-full bg-gradient-to-r from-indigo-500 to-cyan-400 transition-all duration-300"
            style={{ width: `${((currentStep + 1) / situations.length) * 100}%` }}
          />
        </div>

        {isSubmitting ? (
          <div className="py-20 flex flex-col items-center justify-center text-center">
            <div className="w-16 h-16 border-4 border-indigo-500/20 border-t-indigo-500 rounded-full animate-spin mb-6" />
            <h3 className="text-xl font-bold text-white mb-2">Analyzing Behavioral Patterns...</h3>
            <p className="text-slate-400 animate-pulse">Our AI is reading your exact thought process to map your 8 core psychometric traits.</p>
          </div>
        ) : (
          <>
            <div className="mb-8 mt-4">
              <span className="text-xs font-bold text-indigo-400 tracking-wider uppercase mb-2 block">
                Scenario {currentStep + 1} of {situations.length}
              </span>
              <h2 className="text-xl text-white font-medium leading-relaxed bg-slate-900/50 p-6 rounded-xl border border-slate-800">
                {situation.scenario}
              </h2>
            </div>

            <div className="mb-10">
              <label className="block text-sm font-medium text-slate-400 mb-3">
                How would you realistically handle this situation? (Be specific)
              </label>
              <textarea
                value={currentAnswer}
                onChange={(e) => setAnswers(prev => ({ ...prev, [situation.id]: e.target.value }))}
                placeholder="Type your reaction and thought process here..."
                className="w-full h-40 bg-slate-900/80 border border-slate-700 rounded-xl p-4 text-white placeholder-slate-600 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all resize-none"
              />
              <div className="text-right mt-2 text-xs text-slate-500">
                {currentAnswer.length} characters
              </div>
            </div>

            <div className="flex items-center justify-between pt-6 border-t border-slate-800">
              <button
                onClick={handlePrevious}
                disabled={currentStep === 0}
                className="px-6 py-2 rounded-lg font-medium text-slate-400 hover:text-white disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                Previous
              </button>

              {currentStep === situations.length - 1 ? (
                <button
                  onClick={handleSubmit}
                  disabled={currentAnswer.trim().length < 10}
                  className="px-8 py-2 rounded-lg font-medium bg-gradient-to-r from-indigo-500 to-cyan-500 text-white hover:opacity-90 disabled:opacity-50 transition-opacity shadow-[0_0_20px_rgba(99,102,241,0.3)]"
                >
                  Submit Assessment
                </button>
              ) : (
                <button
                  onClick={handleNext}
                  disabled={currentAnswer.trim().length < 10}
                  className="px-8 py-2 rounded-lg font-medium bg-slate-800 text-white hover:bg-slate-700 disabled:opacity-50 transition-colors"
                >
                  Next
                </button>
              )}
            </div>
          </>
        )}
      </GlassCard>
    </div>
  );
}
