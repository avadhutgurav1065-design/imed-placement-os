"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";

// Initialize Supabase Client for the browser using singleton
const supabase = createClient();

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [dbStatus, setDbStatus] = useState<string | null>(null);
  const router = useRouter();

  useEffect(() => {
    fetch("/api/health").then(res => res.json()).then(data => {
      if (data.status === "uninitialized") {
        setDbStatus("uninitialized");
      }
    }).catch(() => {});
  }, []);

  const handleLogin = async () => {
    setLoading(true);
    setError(null);

    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    
    if (error) {
      setError(error.message);
      setLoading(false);
      return;
    }

    if (data?.user) {
      // Determine user role for routing
      let profileRole = null;
      
      const { data: student } = await supabase.from('student_profiles').select('role').eq('id', data.user.id).maybeSingle();
      if (student) profileRole = student.role;
      
      if (!profileRole) {
        const { data: alumni } = await supabase.from('alumni_profiles').select('role').eq('id', data.user.id).maybeSingle();
        if (alumni) profileRole = alumni.role;
      }
      
      if (!profileRole) {
        const { data: admin } = await supabase.from('admin_profiles').select('role').eq('id', data.user.id).maybeSingle();
        if (admin) profileRole = admin.role;
      }
      
      const role = profileRole || data.user.user_metadata?.role || 'student';
      
      if (role === 'admin') router.push('/admin');
      else if (role === 'alumni') router.push('/alumni');
      else router.push('/student');
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-8 text-slate-200">
      <div className="max-w-md w-full bg-slate-900 border border-slate-800 rounded-2xl p-8 shadow-2xl relative">
        {dbStatus === "uninitialized" && (
          <div className="absolute -top-16 left-0 right-0 bg-rose-500/10 border border-rose-500/50 text-rose-400 p-3 rounded-xl text-xs text-center font-bold">
            ⚠️ DATABASE NOT INITIALIZED. <br/> Please execute schema.sql in your Supabase SQL Editor.
          </div>
        )}
        <h1 className="text-3xl font-extrabold text-cyan-400 text-center mb-2">Portal Login</h1>
        <p className="text-slate-400 text-center mb-8">Access the IMED Placement OS</p>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-400 mb-1">University Email</label>
            <input 
              type="email" 
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full bg-slate-950 border border-slate-700 rounded-lg px-4 py-3 text-slate-200 focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 transition-all"
              placeholder="student@university.edu"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-400 mb-1">Password</label>
            <input 
              type="password" 
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full bg-slate-950 border border-slate-700 rounded-lg px-4 py-3 text-slate-200 focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 transition-all"
              placeholder="••••••••"
            />
          </div>

          {error && <div className="text-rose-400 text-sm bg-rose-900/20 p-3 rounded border border-rose-500/30">{error}</div>}

          <div className="flex gap-4 pt-4">
            <button 
              onClick={handleLogin}
              disabled={loading}
              className="w-full bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold py-3 rounded-lg transition-all"
            >
              {loading ? 'Processing...' : 'Log In'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}