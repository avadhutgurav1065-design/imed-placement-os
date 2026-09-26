"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { GlassCard } from "@/components/shared/GlassCard";
import { cn } from "@/lib/utils";
import ReactMarkdown from "react-markdown";

interface Challenge {
  title: string;
  type: string;
  description: string;
  initialCode: string;
  expectedOutput: string;
}

export default function TechnicalTestPlayer() {
  const router = useRouter();
  const [jobRole, setJobRole] = useState<string>("");
  const [challenges, setChallenges] = useState<Challenge[]>([]);
  const [currentChallengeIndex, setCurrentChallengeIndex] = useState(0);
  const [responses, setResponses] = useState<string[]>([]);
  const hasFetchedRef = React.useRef(false);
  
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [timeLeft, setTimeLeft] = useState(45 * 60); // 45 minutes

  const generateAssessment = useCallback(async (role: string) => {
    try {
      setIsLoading(true);
      setError(null);

      const res = await fetch("/api/student/technical-assessment/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ jobRole: role }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to generate technical test");
      }

      const data = await res.json();
      setChallenges(data.challenges);
      setResponses(new Array(data.challenges.length).fill(""));
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (hasFetchedRef.current) return;
    
    const role = sessionStorage.getItem("assessment_role");
    if (!role) {
      router.push("/student/technical-skills");
      return;
    }
    setJobRole(role);
    hasFetchedRef.current = true;
    generateAssessment(role);
  }, [generateAssessment, router]);

  useEffect(() => {
    if (isLoading || challenges.length === 0 || isSubmitting) return;

    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          handleSubmit();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [isLoading, challenges.length, isSubmitting]);

  const handleResponseChange = (val: string) => {
    const newResponses = [...responses];
    newResponses[currentChallengeIndex] = val;
    setResponses(newResponses);
  };

  const handleSubmit = async () => {
    try {
      setIsSubmitting(true);
      setError(null);

      const res = await fetch("/api/student/technical-assessment/evaluate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          jobRole,
          challenges,
          responses,
        }),
      });

      if (!res.ok) {
        throw new Error("Failed to submit assessment");
      }

      sessionStorage.removeItem("assessment_role");
      router.push("/student/assessments");
    } catch (err: any) {
      setError(err.message);
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-4">
        <div className="w-12 h-12 border-4 border-indigo-500/30 border-t-indigo-500 rounded-full animate-spin" />
        <p className="text-slate-400 animate-pulse">Generating your practical challenges...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-6">
        <div className="w-16 h-16 rounded-full bg-red-500/20 flex items-center justify-center">
          <svg className="w-8 h-8 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
        </div>
        <div className="text-center">
          <h2 className="text-xl font-bold text-white mb-2">Assessment Error</h2>
          <p className="text-slate-400">{error}</p>
        </div>
        <button
          onClick={() => router.push("/student/technical-skills")}
          className="px-6 py-2 bg-white/5 hover:bg-white/10 text-white rounded-lg transition-colors"
        >
          Go Back
        </button>
      </div>
    );
  }

  if (challenges.length === 0) return null;

  const currentChallenge = challenges[currentChallengeIndex];
  const isLastChallenge = currentChallengeIndex === challenges.length - 1;

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const isCoding = ["coding", "debugging"].includes(currentChallenge.type);

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Technical Skills Assessment</h1>
          <p className="text-slate-400">Target Role: {jobRole}</p>
        </div>
        <div className={cn(
          "px-4 py-2 rounded-lg font-mono font-medium flex items-center gap-2",
          timeLeft < 300 ? "bg-red-500/20 text-red-400" : "bg-indigo-500/20 text-indigo-400"
        )}>
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          {formatTime(timeLeft)}
        </div>
      </div>

      <div className="flex items-center gap-2 mb-8">
        {challenges.map((_, idx) => (
          <div key={idx} className="flex-1 flex items-center gap-2">
            <div className={cn(
              "h-2 w-full rounded-full transition-colors",
              idx === currentChallengeIndex ? "bg-indigo-500" :
              idx < currentChallengeIndex ? "bg-indigo-500/50" : "bg-white/10"
            )} />
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <GlassCard className="p-6 overflow-y-auto max-h-[600px] border-indigo-500/20">
          <div className="space-y-6">
            <div>
              <div className="inline-block px-3 py-1 rounded-full bg-indigo-500/20 text-indigo-400 text-xs font-semibold mb-3 uppercase tracking-wider">
                Challenge {currentChallengeIndex + 1} of {challenges.length} &bull; {currentChallenge.type.replace("_", " ")}
              </div>
              <h2 className="text-xl font-bold text-white">{currentChallenge.title}</h2>
            </div>
            
            <div className="prose prose-invert prose-indigo max-w-none prose-p:text-slate-300 prose-pre:bg-[#0a0e1a] prose-pre:border prose-pre:border-white/10">
              <ReactMarkdown>{currentChallenge.description}</ReactMarkdown>
            </div>
          </div>
        </GlassCard>

        <GlassCard className="p-6 flex flex-col border-indigo-500/20">
          <h3 className="text-sm font-medium text-slate-300 mb-4">Your Solution</h3>
          
          <textarea
            value={responses[currentChallengeIndex]}
            onChange={(e) => handleResponseChange(e.target.value)}
            placeholder={isCoding ? "Write your code here..." : "Type your response here..."}
            className={cn(
              "flex-1 w-full bg-[#0a0e1a] border border-white/10 rounded-xl p-4 text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/50 resize-none",
              isCoding && "font-mono text-sm"
            )}
          />

          <div className="flex items-center justify-between mt-6">
            <button
              onClick={() => setCurrentChallengeIndex(prev => prev - 1)}
              disabled={currentChallengeIndex === 0}
              className="px-6 py-2 text-slate-400 hover:text-white disabled:opacity-50 transition-colors"
            >
              Previous
            </button>

            {isLastChallenge ? (
              <button
                onClick={handleSubmit}
                disabled={isSubmitting}
                className="px-6 py-2 bg-gradient-to-r from-indigo-500 to-blue-500 hover:from-indigo-400 hover:to-blue-400 text-white rounded-lg font-medium transition-all disabled:opacity-50 flex items-center gap-2 shadow-lg shadow-indigo-500/20"
              >
                {isSubmitting ? "Submitting..." : "Submit Assessment"}
                {!isSubmitting && (
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                )}
              </button>
            ) : (
              <button
                onClick={() => setCurrentChallengeIndex(prev => prev + 1)}
                className="px-6 py-2 bg-white/10 hover:bg-white/20 text-white rounded-lg font-medium transition-colors"
              >
                Next Challenge
              </button>
            )}
          </div>
        </GlassCard>
      </div>
    </div>
  );
}
