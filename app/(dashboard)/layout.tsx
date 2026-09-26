"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";
import { NotificationBell } from "@/components/shared/NotificationBell";
import { InstallPWA } from "@/components/shared/InstallPWA";

const studentNav = [
  {
    label: "Dashboard",
    href: "/student",
    icon: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
      </svg>
    ),
  },
  {
    label: "My Readiness",
    icon: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
      </svg>
    ),
    subItems: [
      {
        label: "Skill Matching",
        href: "/student/analyze",
      },
      {
        label: "Technical Skills",
        href: "/student/technical-skills",
      },
      {
        label: "Aptitude Skills",
        href: "/student/aptitude",
      },
      {
        label: "Interview Skills",
        href: "/student/interview/chat",
      },
      {
        label: "Psychometric Test",
        href: "/student/psychometric",
      }
    ]
  },
  {
    label: "Scan History",
    href: "/student/history",
    icon: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
  },
  {
    label: "Test Results",
    href: "/student/assessments",
    icon: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
      </svg>
    ),
  },
  {
    label: "Live Proctored Interview",
    href: "/student/interview/live",
    icon: (
      <svg className="w-5 h-5 text-rose-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
      </svg>
    ),
  },
  {
    label: "AI Resume Builder",
    href: "/student/resume-builder",
    icon: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
      </svg>
    ),
  },
  {
    label: "Alumni Referrals",
    href: "/student/referrals",
    icon: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
      </svg>
    ),
  },
  {
    label: "Leaderboard",
    href: "/student/leaderboard",
    icon: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
      </svg>
    ),
  },
  {
    label: "AI Job Matches",
    href: "/student/job-matches",
    icon: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
      </svg>
    ),
  },

];

const adminNav = [
  {
    label: "Command Center",
    href: "/admin",
    icon: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M4 5a1 1 0 011-1h14a1 1 0 011 1v2a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM4 13a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H5a1 1 0 01-1-1v-6zM16 13a1 1 0 011-1h2a1 1 0 011 1v6a1 1 0 01-1 1h-2a1 1 0 01-1-1v-6z" />
      </svg>
    ),
  },
  {
    label: "Match Router",
    href: "/admin/match-router",
    icon: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M13 10V3L4 14h7v7l9-11h-7z" />
      </svg>
    ),
  },
  {
    label: "Skill Radar",
    href: "/admin/skill-radar",
    icon: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
      </svg>
    ),
  },
  {
    label: "Risk Telemetry",
    href: "/admin/risk-telemetry",
    icon: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
      </svg>
    ),
  },
  {
    label: "Campus Drives",
    href: "/admin/drives",
    icon: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
      </svg>
    ),
  },
  {
    label: "Job Ingestion",
    href: "/admin/jobs",
    icon: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4" />
      </svg>
    ),
  },
  {
    label: "Interview Logs",
    href: "/admin/interviews",
    icon: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
      </svg>
    ),
  },
  {
    label: "Behavioral Intel",
    href: "/admin/psychometrics",
    icon: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M11 3.055A9.001 9.001 0 1020.945 13H11V3.055z" />
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M20.488 9H15V3.512A9.025 9.025 0 0120.488 9z" />
      </svg>
    ),
  },
  {
    label: "Students",
    href: "/admin/students",
    icon: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
      </svg>
    ),
  },
  {
    label: "NAAC Export",
    href: "/admin/export",
    icon: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
      </svg>
    ),
  },
  {
    label: "Alumni Portal",
    href: "/admin/alumni-tracking",
    icon: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
      </svg>
    ),
  },
  {
    label: "Fundraising",
    href: "/admin/fundraising",
    icon: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
  },
  {
    label: "Predictive Analytics",
    href: "/admin/predictive-analytics",
    icon: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M7 12l3-3 3 3 4-4M8 21l4-4 4 4M3 4h18M4 4h16v12a1 1 0 01-1 1H5a1 1 0 01-1-1V4z" />
      </svg>
    ),
  },
  {
    label: "Accreditation Reports",
    href: "/admin/accreditation-reports",
    icon: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
      </svg>
    ),
  },
  {
    label: "Corporate Drive-Link",
    href: "/admin/corporate-drive-link",
    icon: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
      </svg>
    ),
  },
];

const alumniNav = [
  {
    label: "Dashboard",
    href: "/alumni",
    icon: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
      </svg>
    ),
  },
  {
    label: "Mentorship",
    href: "/alumni/mentorship",
    icon: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
      </svg>
    ),
  },
  {
    label: "Job Referrals",
    href: "/alumni/referrals",
    icon: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
      </svg>
    ),
  },
  {
    label: "Donate to IMED",
    href: "/alumni/donate",
    icon: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
      </svg>
    ),
  },
];

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [profile, setProfile] = useState<any>(null);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [expandedNavs, setExpandedNavs] = useState<Record<string, boolean>>({
    "My Readiness": true,
  });
  const [mounted, setMounted] = useState(false);
  
  const toggleNav = (label: string) => {
    if (sidebarOpen || mobileMenuOpen) {
      setExpandedNavs((prev) => ({ ...prev, [label]: !prev[label] }));
    }
  };
  
  // Create a singleton instance per render context
  const [supabase] = useState(() => createClient());

  const isAdmin = pathname.startsWith("/admin");
  const isAlumni = pathname.startsWith("/alumni");
  const navItems = isAdmin ? adminNav : isAlumni ? alumniNav : studentNav;

  // Close mobile menu on route change
  useEffect(() => {
    setMobileMenuOpen(false);
  }, [pathname]);

  useEffect(() => {
    setMounted(true);
    async function loadUser() {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (user) {
        setUser(user);
        
        // Attempt to fetch from student profiles
        let { data: profileData } = await supabase
          .from("student_profiles")
          .select("*")
          .eq("id", user.id)
          .maybeSingle();

        // If not a student, check if alumni
        if (!profileData) {
           const { data: alumniData } = await supabase
             .from("alumni_profiles")
             .select("*")
             .eq("id", user.id)
             .maybeSingle();
             
           if (alumniData) {
             profileData = { ...alumniData, role: "alumni" };
           } else {
             // Check admin profiles
             const { data: adminData } = await supabase
               .from("admin_profiles")
               .select("*")
               .eq("id", user.id)
               .maybeSingle();

             if (adminData) {
               profileData = { ...adminData, role: "admin" };
             } else {
               // Fallback if no profile exists
               profileData = { role: "student", full_name: user.email?.split("@")[0] || "User" };
             }
           }
        }
        
        if (profileData) {
          setProfile(profileData);
        }
      }
    }
    loadUser();
  }, [supabase]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push("/login");
  };

  if (!mounted) {
    return (
      <div suppressHydrationWarning className="min-h-screen bg-[#070a13] flex items-center justify-center">
        <div suppressHydrationWarning className="animate-pulse text-cyan-500 font-semibold">Loading OS...</div>
      </div>
    );
  }

  const renderNavContent = (isMobile: boolean) => (
    <>
      {/* Logo */}
      <div className="flex items-center gap-3 px-5 py-5 border-b border-white/[0.06]">
        <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-cyan-500 to-indigo-500 flex items-center justify-center flex-shrink-0">
          <span className="text-white font-black text-sm">IP</span>
        </div>
        <div className="animate-slide-in-right">
          <h1 className="text-sm font-bold text-white leading-tight">
            IMED Placement
          </h1>
          <p className="text-[10px] text-slate-500 font-medium">
            {isAdmin ? "Admin Intelligence" : isAlumni ? "Alumni Portal" : "Student Workspace"}
          </p>
        </div>
        {isMobile && (
          <button
            onClick={() => setMobileMenuOpen(false)}
            className="ml-auto text-slate-400 hover:text-white p-1"
          >
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        )}
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto custom-scrollbar">
        {(() => {
          let currentSection = null;
          return navItems.map((item: any, index) => {
            
            if (item.subItems) {
              const isExpanded = expandedNavs[item.label];
              const isActive = item.subItems.some((sub: any) => pathname === sub.href || pathname.startsWith(sub.href));

              return (
                <div key={item.label} className="space-y-1">
                  <button
                    onClick={() => toggleNav(item.label)}
                    className={cn(
                      "w-full flex items-center justify-between gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all group",
                      isActive && !isExpanded
                        ? "bg-cyan-500/10 text-cyan-400 border border-cyan-500/20"
                        : "text-slate-400 hover:text-white hover:bg-white/[0.04]"
                    )}
                  >
                    <div className="flex items-center gap-3">
                      <span
                        className={cn(
                          "flex-shrink-0 transition-colors",
                          isActive ? "text-cyan-400" : "text-slate-500 group-hover:text-slate-300"
                        )}
                      >
                        {item.icon}
                      </span>
                      <span>{item.label}</span>
                    </div>
                    <svg
                      className={cn("w-4 h-4 transition-transform", isExpanded && "rotate-180")}
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </button>
                  {isExpanded && (
                    <div className="pl-11 pr-2 space-y-1 animate-in slide-in-from-top-2">
                      {item.subItems.map((sub: any) => {
                        const isSubActive = pathname === sub.href || pathname.startsWith(sub.href);
                        return (
                          <Link
                            key={sub.href}
                            href={sub.href}
                            className={cn(
                              "block px-3 py-2 rounded-lg text-xs font-medium transition-colors",
                              isSubActive
                                ? "bg-cyan-500/10 text-cyan-400"
                                : "text-slate-500 hover:text-slate-300 hover:bg-white/[0.02]"
                            )}
                          >
                            {sub.label}
                          </Link>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            }

            const isActive =
              pathname === item.href ||
              (item.href !== "/student" &&
                item.href !== "/admin" &&
                item.href !== "/alumni" &&
                pathname.startsWith(item.href));
                
            const showSectionHeader = item.section && item.section !== currentSection;
            if (showSectionHeader) {
              currentSection = item.section;
            }

            return (
              <React.Fragment key={item.href}>
                {showSectionHeader && (
                  <div className="px-3 pt-5 pb-2">
                    <p className="text-[10px] font-bold tracking-wider text-slate-500">
                      {item.section}
                    </p>
                  </div>
                )}
                <Link
                  href={item.href}
                  className={cn(
                    "flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all group",
                    isActive
                      ? "bg-cyan-500/10 text-cyan-400 border border-cyan-500/20"
                      : "text-slate-400 hover:text-white hover:bg-white/[0.04]"
                  )}
                >
                  <span
                    className={cn(
                      "flex-shrink-0 transition-colors",
                      isActive ? "text-cyan-400" : "text-slate-500 group-hover:text-slate-300"
                    )}
                  >
                    {item.icon}
                  </span>
                  <span>{item.label}</span>
                </Link>
              </React.Fragment>
            );
          });
        })()}
      </nav>

      {/* App Install Button (only visible if installable) */}
      <InstallPWA />

      {/* User section */}
      <div className="border-t border-white/[0.06] px-4 py-4">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-full bg-gradient-to-br from-slate-700 to-slate-800 flex items-center justify-center flex-shrink-0 text-xs font-bold text-slate-300">
            {profile?.full_name?.[0] || user?.email?.[0]?.toUpperCase() || "?"}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-white truncate">
              {profile?.full_name || "User"}
            </p>
            <p className="text-[10px] text-slate-500 truncate">
              {user?.email || ""}
            </p>
          </div>
          <button
            onClick={handleLogout}
            className="text-slate-500 hover:text-rose-400 transition-colors p-1.5"
            title="Sign Out"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
            </svg>
          </button>
        </div>
      </div>

      {/* Developer Credit */}
      <div className="px-4 pb-4 pt-2">
        <p className="text-[10px] text-slate-500/60 font-medium text-center tracking-wide">
          Designed and developed by Avadhut Gurav
        </p>
      </div>
    </>
  );

  return (
    <div suppressHydrationWarning className="min-h-screen bg-[#070a13] flex">
      {/* Background ambience */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-0 left-1/4 w-[500px] h-[500px] bg-cyan-600/[0.04] rounded-full blur-[150px]" />
        <div className="absolute bottom-0 right-1/4 w-[400px] h-[400px] bg-indigo-600/[0.04] rounded-full blur-[120px]" />
      </div>

      {/* Mobile Overlay */}
      {mobileMenuOpen && (
        <div
          className="fixed inset-0 bg-black/60 z-40 md:hidden"
          onClick={() => setMobileMenuOpen(false)}
        />
      )}

      {/* Mobile Sidebar Drawer */}
      <aside
        className={cn(
          "fixed top-0 left-0 h-full z-50 flex flex-col border-r border-white/[0.06] bg-[#0a0e1a]/95 backdrop-blur-xl w-72 transition-transform duration-300 md:hidden",
          mobileMenuOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        {renderNavContent(true)}
      </aside>

      {/* Desktop Sidebar */}
      <aside
        className={cn(
          "fixed top-0 left-0 h-full z-40 flex-col transition-all duration-300 border-r border-white/[0.06] bg-[#0a0e1a]/90 backdrop-blur-xl hidden md:flex",
          sidebarOpen ? "w-64" : "w-20"
        )}
      >
        {/* Logo */}
        <div className="flex items-center gap-3 px-5 py-5 border-b border-white/[0.06]">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-cyan-500 to-indigo-500 flex items-center justify-center flex-shrink-0">
            <span className="text-white font-black text-sm">IP</span>
          </div>
          {sidebarOpen && (
            <div className="animate-slide-in-right">
              <h1 className="text-sm font-bold text-white leading-tight">
                IMED Placement
              </h1>
              <p className="text-[10px] text-slate-500 font-medium">
                {isAdmin ? "Admin Intelligence" : isAlumni ? "Alumni Portal" : "Student Workspace"}
              </p>
            </div>
          )}
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto custom-scrollbar">
          {(() => {
            let currentSection = null;
            return navItems.map((item: any, index) => {
              
              if (item.subItems) {
                const isExpanded = expandedNavs[item.label];
                const isActive = item.subItems.some((sub: any) => pathname === sub.href || pathname.startsWith(sub.href));

                return (
                  <div key={item.label} className="space-y-1">
                    <button
                      onClick={() => toggleNav(item.label)}
                      className={cn(
                        "w-full flex items-center justify-between gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all group",
                        isActive && !isExpanded
                          ? "bg-cyan-500/10 text-cyan-400 border border-cyan-500/20"
                          : "text-slate-400 hover:text-white hover:bg-white/[0.04]",
                        !sidebarOpen && "justify-center"
                      )}
                      title={!sidebarOpen ? item.label : undefined}
                    >
                      <div className="flex items-center gap-3">
                        <span
                          className={cn(
                            "flex-shrink-0 transition-colors",
                            isActive ? "text-cyan-400" : "text-slate-500 group-hover:text-slate-300"
                          )}
                        >
                          {item.icon}
                        </span>
                        {sidebarOpen && <span>{item.label}</span>}
                      </div>
                      {sidebarOpen && (
                        <svg
                          className={cn("w-4 h-4 transition-transform", isExpanded && "rotate-180")}
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                        >
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                        </svg>
                      )}
                    </button>
                    {sidebarOpen && isExpanded && (
                      <div className="pl-11 pr-2 space-y-1 animate-in slide-in-from-top-2">
                        {item.subItems.map((sub: any) => {
                          const isSubActive = pathname === sub.href || pathname.startsWith(sub.href);
                          return (
                            <Link
                              key={sub.href}
                              href={sub.href}
                              className={cn(
                                "block px-3 py-2 rounded-lg text-xs font-medium transition-colors",
                                isSubActive
                                  ? "bg-cyan-500/10 text-cyan-400"
                                  : "text-slate-500 hover:text-slate-300 hover:bg-white/[0.02]"
                              )}
                            >
                              {sub.label}
                            </Link>
                          );
                        })}
                      </div>
                    )}
                  </div>
                );
              }

              const isActive =
                pathname === item.href ||
                (item.href !== "/student" &&
                  item.href !== "/admin" &&
                  item.href !== "/alumni" &&
                  pathname.startsWith(item.href));
                  
              const showSectionHeader = item.section && item.section !== currentSection;
              if (showSectionHeader) {
                currentSection = item.section;
              }

              return (
                <React.Fragment key={item.href}>
                  {showSectionHeader && sidebarOpen && (
                    <div className="px-3 pt-5 pb-2">
                      <p className="text-[10px] font-bold tracking-wider text-slate-500">
                        {item.section}
                      </p>
                    </div>
                  )}
                  <Link
                    href={item.href}
                    className={cn(
                      "flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all group",
                      isActive
                        ? "bg-cyan-500/10 text-cyan-400 border border-cyan-500/20"
                        : "text-slate-400 hover:text-white hover:bg-white/[0.04]",
                      !sidebarOpen && "justify-center"
                    )}
                    title={!sidebarOpen ? item.label : undefined}
                  >
                    <span
                      className={cn(
                        "flex-shrink-0 transition-colors",
                        isActive ? "text-cyan-400" : "text-slate-500 group-hover:text-slate-300"
                      )}
                    >
                      {item.icon}
                    </span>
                    {sidebarOpen && <span>{item.label}</span>}
                  </Link>
                </React.Fragment>
              );
            });
          })()}
        </nav>

        {/* Sidebar toggle */}
        <div className="px-3 pb-2 pt-2">
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-slate-500 hover:text-white hover:bg-white/[0.04] transition-all w-full"
          >
            <svg
              className={cn("w-5 h-5 transition-transform", !sidebarOpen && "rotate-180")}
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M11 19l-7-7 7-7m8 14l-7-7 7-7" />
            </svg>
            {sidebarOpen && <span>Collapse</span>}
          </button>
        </div>

        {/* User section */}
        <div className="border-t border-white/[0.06] px-4 py-4">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-full bg-gradient-to-br from-slate-700 to-slate-800 flex items-center justify-center flex-shrink-0 text-xs font-bold text-slate-300">
              {profile?.full_name?.[0] || user?.email?.[0]?.toUpperCase() || "?"}
            </div>
            {sidebarOpen && (
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-white truncate">
                  {profile?.full_name || "User"}
                </p>
                <p className="text-[10px] text-slate-500 truncate">
                  {user?.email || ""}
                </p>
              </div>
            )}
            {sidebarOpen && (
              <button
                onClick={handleLogout}
                className="text-slate-500 hover:text-rose-400 transition-colors p-1.5"
                title="Sign Out"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                </svg>
              </button>
            )}
          </div>
        </div>
      </aside>

      {/* Main content */}
      <main
        className={cn(
          "flex-1 transition-all duration-300 min-h-screen w-full",
          "md:ml-64",
          sidebarOpen ? "md:ml-64" : "md:ml-20",
          "ml-0" // No margin on mobile
        )}
      >
        {/* Top bar */}
        <header className="sticky top-0 z-30 border-b border-white/[0.06] bg-[#070a13]/80 backdrop-blur-xl">
          <div className="flex items-center justify-between px-4 md:px-8 py-3 md:py-4">
            {/* Hamburger button for mobile */}
            <div className="flex items-center gap-3">
              <button
                onClick={() => setMobileMenuOpen(true)}
                className="md:hidden text-slate-400 hover:text-white p-1"
              >
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              </button>
              <h2 className="text-base md:text-lg font-bold text-white truncate">
                {navItems.find(
                  (item) =>
                    pathname === item.href ||
                    (item.href !== "/student" &&
                      item.href !== "/admin" &&
                      item.href !== "/alumni" &&
                      pathname.startsWith(item.href))
                )?.label || (isAdmin ? "Admin" : isAlumni ? "Alumni Portal" : "Student Workspace")}
              </h2>
            </div>
            <div className="flex items-center gap-2 md:gap-3">
              <NotificationBell />
              <span
                className={cn(
                  "text-[10px] font-bold uppercase tracking-wider px-2 md:px-2.5 py-1 rounded-full",
                  profile?.role === "admin"
                    ? "bg-amber-500/10 text-amber-400 border border-amber-500/20"
                    : profile?.role === "alumni"
                    ? "bg-purple-500/10 text-purple-400 border border-purple-500/20"
                    : "bg-cyan-500/10 text-cyan-400 border border-cyan-500/20"
                )}
              >
                {profile?.role || "student"}
              </span>
            </div>
          </div>
        </header>

        {/* Page content */}
        <div className="p-4 md:p-8">{children}</div>
      </main>
    </div>
  );
}

