"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { GlassCard } from "@/components/shared/GlassCard";

const PREDEFINED_ROLES = [
  "Frontend Developer",
  "Backend Developer",
  "Full Stack Developer",
  "Data Scientist",
  "Data Analyst",
  "Machine Learning Engineer",
  "DevOps Engineer",
  "Product Manager",
  "Business Analyst",
  "Marketing Manager",
  "Financial Analyst",
  "HR Executive",
  "Sales Manager"
];

export default function AptitudeLandingPage() {
  const router = useRouter();
  const [drives, setDrives] = useState<any[]>([]);
  const [selectedRole, setSelectedRole] = useState("");
  const [customRole, setCustomRole] = useState("");
  const supabase = createClient();

  useEffect(() => {
    async function fetchDrives() {
      const { data } = await supabase
        .from("campus_drives")
        .select("title")
        .order("created_at", { ascending: false });
      if (data) setDrives(data);
    }
    fetchDrives();
  }, [supabase]);

  const handleStart = () => {
    const finalRole = selectedRole === "custom" ? customRole : selectedRole;
    if (!finalRole) return;
    
    // Pass the job role to the test page via query params or sessionStorage
    sessionStorage.setItem("assessment_role", finalRole);
    sessionStorage.setItem("assessment_type", "aptitude");
    router.push("/student/aptitude/test");
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8 animate-fade-in">
      <div className="text-center space-y-4">
        <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-emerald-500/20 to-teal-500/20 flex items-center justify-center mx-auto shadow-lg shadow-emerald-500/10">
          <svg className="w-8 h-8 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
          </svg>
        </div>
        <h1 className="text-3xl font-bold text-white tracking-tight">
          Aptitude Skills Test
        </h1>
        <p className="text-slate-400 max-w-xl mx-auto">
          Test your quantitative, logical, and verbal reasoning skills. The AI will generate a customized 25-question assessment based on your target job role.
        </p>
      </div>

      <GlassCard className="p-8 max-w-xl mx-auto border-emerald-500/20">
        <div className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">
              Target Job Role (Select Campus Drive)
            </label>
            <select
              value={selectedRole}
              onChange={(e) => setSelectedRole(e.target.value)}
              className="w-full bg-[#0a0e1a] border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/50 appearance-none"
            >
              <option value="">Select a role...</option>
              {drives.length > 0 && (
                <optgroup label="Campus Drives">
                  {drives.map((drive) => (
                    <option key={drive.title} value={drive.title}>
                      {drive.title}
                    </option>
                  ))}
                </optgroup>
              )}
              <optgroup label="Common Roles">
                {PREDEFINED_ROLES.map((role) => (
                  <option key={role} value={role}>
                    {role}
                  </option>
                ))}
              </optgroup>
              <option value="custom">Other (Custom Role)</option>
            </select>
            <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-6 pt-8">
               <svg className="w-4 h-4 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                 <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
               </svg>
            </div>
          </div>

          {selectedRole === "custom" && (
            <div className="animate-fade-in">
              <label className="block text-sm font-medium text-slate-300 mb-2">
                Enter Custom Job Role
              </label>
              <input
                type="text"
                value={customRole}
                onChange={(e) => setCustomRole(e.target.value)}
                placeholder="e.g., Financial Analyst, Marketing Manager, Software Engineer"
                className="w-full bg-[#0a0e1a] border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
              />
            </div>
          )}

          <div className="pt-4 border-t border-white/5 space-y-4">
            <div className="flex items-center gap-3 text-sm text-slate-400">
              <svg className="w-5 h-5 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span>25 Minutes Total Time</span>
            </div>
            <div className="flex items-center gap-3 text-sm text-slate-400">
              <svg className="w-5 h-5 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span>25 Questions (Easy, Medium, Hard)</span>
            </div>
            <div className="flex items-center gap-3 text-sm text-slate-400">
               <svg className="w-5 h-5 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                 <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
               </svg>
               <span>Instant AI Evaluation</span>
            </div>
          </div>

          <button
            onClick={handleStart}
            disabled={!selectedRole || (selectedRole === "custom" && !customRole)}
            className="w-full py-3.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 text-white font-semibold shadow-lg shadow-emerald-500/25 hover:shadow-emerald-500/40 hover:scale-[1.02] transition-all disabled:opacity-50 disabled:pointer-events-none"
          >
            Start Assessment
          </button>
        </div>
      </GlassCard>
    </div>
  );
}
