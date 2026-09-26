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

export default function TechnicalSkillsLandingPage() {
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
    sessionStorage.setItem("assessment_type", "technical");
    
    // Point to the dedicated technical test UI
    router.push("/student/technical-skills/test");
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8 animate-fade-in">
      <div className="text-center space-y-4">
        <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-indigo-500/20 to-blue-500/20 flex items-center justify-center mx-auto shadow-lg shadow-indigo-500/10">
          <svg className="w-8 h-8 text-indigo-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
          </svg>
        </div>
        <h1 className="text-3xl font-bold text-white tracking-tight">
          Technical Skills Test
        </h1>
        <p className="text-slate-400 max-w-xl mx-auto">
          Test your domain-specific technical knowledge. The AI will generate a customized 3-part practical assessment featuring coding, design scenarios, or case studies based on your target job role.
        </p>
      </div>

      <GlassCard className="p-8 max-w-xl mx-auto border-indigo-500/20">
        <div className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">
              Target Job Role (Select Campus Drive)
            </label>
            <div className="relative">
              <select
                value={selectedRole}
                onChange={(e) => setSelectedRole(e.target.value)}
                className="w-full bg-[#0a0e1a] border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/50 appearance-none"
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
              <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-4">
                 <svg className="w-4 h-4 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                   <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                 </svg>
              </div>
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
                placeholder="e.g., Software Engineer, Data Scientist, Full Stack Developer"
                className="w-full bg-[#0a0e1a] border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
              />
            </div>
          )}

          <div className="pt-4 border-t border-white/5 space-y-4">
            <div className="flex items-center gap-3 text-sm text-slate-400">
              <svg className="w-5 h-5 text-indigo-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span>45 Minutes Total Time</span>
            </div>
            <div className="flex items-center gap-3 text-sm text-slate-400">
              <svg className="w-5 h-5 text-indigo-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span>3 Practical Challenges (Coding/Case Study/Design)</span>
            </div>
            <div className="flex items-center gap-3 text-sm text-slate-400">
               <svg className="w-5 h-5 text-indigo-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                 <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
               </svg>
               <span>Instant AI Evaluation</span>
            </div>
          </div>

          <button
            onClick={handleStart}
            disabled={!selectedRole || (selectedRole === "custom" && !customRole)}
            className="w-full py-3.5 rounded-xl bg-gradient-to-r from-indigo-500 to-blue-500 text-white font-semibold shadow-lg shadow-indigo-500/25 hover:shadow-indigo-500/40 hover:scale-[1.02] transition-all disabled:opacity-50 disabled:pointer-events-none"
          >
            Start Assessment
          </button>
        </div>
      </GlassCard>
    </div>
  );
}
