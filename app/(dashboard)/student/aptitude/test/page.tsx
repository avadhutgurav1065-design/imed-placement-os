"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { GlassCard } from "@/components/shared/GlassCard";
import { cn } from "@/lib/utils";

interface Question {
  question: string;
  options: string[];
  correctAnswer: string;
  explanation: string;
  difficulty: "easy" | "medium" | "hard";
}

export default function AssessmentTestPlayer() {
  const router = useRouter();
  const [questions, setQuestions] = useState<Question[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  
  const [currentIdx, setCurrentIdx] = useState(0);
  const [answers, setAnswers] = useState<Record<number, string>>({});
  
  // 25 minutes = 25 * 60 seconds = 1500
  const [timeLeft, setTimeLeft] = useState(1500);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [results, setResults] = useState<any>(null);

  const [jobRole, setJobRole] = useState("");
  const [assessmentType, setAssessmentType] = useState("");
  const hasFetchedRef = React.useRef(false);

  useEffect(() => {
    if (hasFetchedRef.current) return;
    
    const role = sessionStorage.getItem("assessment_role");
    const type = sessionStorage.getItem("assessment_type") || "aptitude";

    if (!role) {
      router.push("/student");
      return;
    }

    setJobRole(role);
    setAssessmentType(type);
    
    hasFetchedRef.current = true;

    const fetchQuestions = async () => {
      try {
        const res = await fetch("/api/student/assessment/generate", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ jobRole: role, assessmentType: type }),
        });

        if (!res.ok) {
          throw new Error("Failed to generate test");
        }

        const data = await res.json();
        if (data.questions) {
          setQuestions(data.questions);
        } else {
          throw new Error("No questions returned");
        }
      } catch (err: any) {
        setError(err.message || "Something went wrong.");
      } finally {
        setLoading(false);
      }
    };

    fetchQuestions();
  }, [router]);

  const submitTest = useCallback(async () => {
    if (isSubmitting || results) return;
    setIsSubmitting(true);

    let score = 0;
    let easyCorrect = 0, mediumCorrect = 0, hardCorrect = 0;
    let easyTotal = 0, mediumTotal = 0, hardTotal = 0;

    questions.forEach((q, idx) => {
      const isCorrect = answers[idx] === q.correctAnswer;
      if (isCorrect) score++;

      if (q.difficulty === "easy") {
        easyTotal++;
        if (isCorrect) easyCorrect++;
      } else if (q.difficulty === "medium") {
        mediumTotal++;
        if (isCorrect) mediumCorrect++;
      } else if (q.difficulty === "hard") {
        hardTotal++;
        if (isCorrect) hardCorrect++;
      }
    });

    const breakdown = {
      easy: { correct: easyCorrect, total: easyTotal },
      medium: { correct: mediumCorrect, total: mediumTotal },
      hard: { correct: hardCorrect, total: hardTotal },
    };

    try {
      const res = await fetch("/api/student/assessment/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          jobRole,
          assessmentType,
          score,
          totalQuestions: questions.length,
          difficultyBreakdown: breakdown,
        }),
      });

      if (res.ok) {
        setResults({ score, total: questions.length, breakdown });
      } else {
        throw new Error("Failed to submit score");
      }
    } catch (err) {
      console.error(err);
      alert("Test finished, but failed to save score. See console.");
      setResults({ score, total: questions.length, breakdown });
    } finally {
      setIsSubmitting(false);
    }
  }, [isSubmitting, results, questions, answers, jobRole, assessmentType]);

  useEffect(() => {
    if (loading || results || error) return;
    
    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          submitTest();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [loading, results, error, submitTest]);

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
  };

  const handleSelect = (option: string) => {
    setAnswers((prev) => ({ ...prev, [currentIdx]: option }));
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-4">
        <div className="w-12 h-12 border-4 border-cyan-500/30 border-t-cyan-500 rounded-full animate-spin" />
        <p className="text-slate-400 font-medium animate-pulse">
          AI is generating a customized 25-question {assessmentType} test for {jobRole}...
        </p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-4">
        <div className="w-16 h-16 rounded-full bg-rose-500/10 flex items-center justify-center">
          <svg className="w-8 h-8 text-rose-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>
        <h2 className="text-xl font-semibold text-white">Generation Failed</h2>
        <p className="text-slate-400">{error}</p>
        <button onClick={() => router.back()} className="px-6 py-2 rounded-lg bg-white/5 hover:bg-white/10 text-white">
          Go Back
        </button>
      </div>
    );
  }

  if (results) {
    return (
      <div className="max-w-4xl mx-auto animate-fade-in space-y-8">
        <div className="text-center space-y-4">
          <div className="w-20 h-20 rounded-full bg-gradient-to-br from-emerald-500/20 to-cyan-500/20 flex items-center justify-center mx-auto shadow-lg shadow-emerald-500/10">
            <span className="text-2xl font-black text-transparent bg-clip-text bg-gradient-to-br from-emerald-400 to-cyan-400">
              {Math.round((results.score / results.total) * 100)}%
            </span>
          </div>
          <h1 className="text-3xl font-bold text-white tracking-tight">Assessment Complete</h1>
          <p className="text-slate-400">
            You scored {results.score} out of {results.total}.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <GlassCard className="p-6 text-center border-emerald-500/20">
            <div className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Easy</div>
            <div className="text-2xl font-bold text-emerald-400">
              {results.breakdown.easy.correct} / {results.breakdown.easy.total}
            </div>
          </GlassCard>
          <GlassCard className="p-6 text-center border-amber-500/20">
            <div className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Medium</div>
            <div className="text-2xl font-bold text-amber-400">
              {results.breakdown.medium.correct} / {results.breakdown.medium.total}
            </div>
          </GlassCard>
          <GlassCard className="p-6 text-center border-rose-500/20">
            <div className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Hard</div>
            <div className="text-2xl font-bold text-rose-400">
              {results.breakdown.hard.correct} / {results.breakdown.hard.total}
            </div>
          </GlassCard>
        </div>

        <div className="flex justify-center">
          <button
            onClick={() => router.push("/student/assessments")}
            className="px-8 py-3 rounded-xl bg-white/5 hover:bg-white/10 text-white font-medium transition-colors"
          >
            View All Assessments
          </button>
        </div>
      </div>
    );
  }

  const currentQuestion = questions[currentIdx];

  return (
    <div className="max-w-4xl mx-auto flex gap-6 h-[calc(100vh-8rem)]">
      {/* Main Question Area */}
      <GlassCard className="flex-1 flex flex-col min-h-0 relative overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-white/5">
          <div className="flex items-center gap-3">
            <span className="text-sm font-bold text-slate-400">
              Question {currentIdx + 1} of {questions.length}
            </span>
            <span className={cn(
              "text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full border",
              currentQuestion.difficulty === 'easy' ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20" :
              currentQuestion.difficulty === 'medium' ? "bg-amber-500/10 text-amber-400 border-amber-500/20" :
              "bg-rose-500/10 text-rose-400 border-rose-500/20"
            )}>
              {currentQuestion.difficulty}
            </span>
          </div>
          <div className="flex items-center gap-2 text-rose-400 font-mono font-bold bg-rose-500/10 px-3 py-1.5 rounded-lg border border-rose-500/20">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            {formatTime(timeLeft)}
          </div>
        </div>

        {/* Question Content */}
        <div className="flex-1 overflow-y-auto p-8 custom-scrollbar">
          <h2 className="text-xl font-medium text-white leading-relaxed mb-8 whitespace-pre-wrap">
            {currentQuestion.question}
          </h2>

          <div className="space-y-3">
            {currentQuestion.options.map((option, idx) => (
              <button
                key={idx}
                onClick={() => handleSelect(option)}
                className={cn(
                  "w-full text-left p-4 rounded-xl border transition-all duration-200",
                  answers[currentIdx] === option
                    ? "bg-cyan-500/10 border-cyan-500/50 text-cyan-300 shadow-[0_0_15px_rgba(6,182,212,0.15)]"
                    : "bg-white/[0.02] border-white/10 text-slate-300 hover:bg-white/[0.04] hover:border-white/20"
                )}
              >
                <div className="flex gap-4">
                  <div className={cn(
                    "w-6 h-6 rounded-full border flex items-center justify-center flex-shrink-0 mt-0.5 transition-colors",
                    answers[currentIdx] === option
                      ? "border-cyan-400 bg-cyan-400/20 text-cyan-400"
                      : "border-slate-600 text-transparent"
                  )}>
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                  <span className="leading-relaxed">{option}</span>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Footer Navigation */}
        <div className="p-6 border-t border-white/5 flex justify-between items-center bg-black/20">
          <button
            onClick={() => setCurrentIdx((p) => Math.max(0, p - 1))}
            disabled={currentIdx === 0}
            className="px-6 py-2.5 rounded-lg font-medium text-slate-400 hover:text-white hover:bg-white/5 disabled:opacity-30 transition-all"
          >
            Previous
          </button>
          
          {currentIdx === questions.length - 1 ? (
            <button
              onClick={submitTest}
              disabled={isSubmitting}
              className="px-8 py-2.5 rounded-lg bg-gradient-to-r from-emerald-500 to-teal-500 text-white font-bold hover:shadow-lg hover:shadow-emerald-500/25 transition-all disabled:opacity-50"
            >
              {isSubmitting ? "Submitting..." : "Submit Test"}
            </button>
          ) : (
            <button
              onClick={() => setCurrentIdx((p) => Math.min(questions.length - 1, p + 1))}
              className="px-8 py-2.5 rounded-lg bg-cyan-500/10 text-cyan-400 font-bold border border-cyan-500/20 hover:bg-cyan-500/20 transition-all"
            >
              Next
            </button>
          )}
        </div>
      </GlassCard>

      {/* Side Panel Map */}
      <GlassCard className="w-72 flex flex-col min-h-0 hidden md:flex">
        <div className="p-6 border-b border-white/5">
          <h3 className="text-sm font-bold text-white tracking-tight">Question Map</h3>
          <p className="text-xs text-slate-400 mt-1">{Object.keys(answers).length} of {questions.length} answered</p>
        </div>
        <div className="flex-1 overflow-y-auto p-4 custom-scrollbar">
          <div className="grid grid-cols-4 gap-2">
            {questions.map((_, idx) => (
              <button
                key={idx}
                onClick={() => setCurrentIdx(idx)}
                className={cn(
                  "h-10 rounded-lg text-sm font-medium transition-all border",
                  currentIdx === idx
                    ? "border-cyan-400 bg-cyan-400/20 text-cyan-300 ring-2 ring-cyan-500/30"
                    : answers[idx]
                    ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-400"
                    : "border-white/10 bg-white/5 text-slate-400 hover:bg-white/10"
                )}
              >
                {idx + 1}
              </button>
            ))}
          </div>
        </div>
      </GlassCard>
    </div>
  );
}
