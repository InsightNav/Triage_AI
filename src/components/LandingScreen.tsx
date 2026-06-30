import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Task, TriageResult } from "../types";
import { 
  Sun, 
  Moon, 
  Sparkles, 
  AlertTriangle, 
  Play, 
  Calendar, 
  ClipboardList, 
  ShieldAlert, 
  ArrowRight, 
  Zap,
  Activity,
  Plus,
  Lock,
  CheckCircle2,
  Info,
  Bell,
  BellOff
} from "lucide-react";

interface LandingScreenProps {
  isDarkMode: boolean;
  onToggleDarkMode: () => void;
  tasks: Task[];
  triageResult: TriageResult | null;
  onActivatePanic: () => void;
  onMorningCheckClick: () => void;
  onAddTaskClick: () => void;
  onLoadDemo?: () => void;
  isDemoMode?: boolean;
  onExitDemo?: () => void;
  calendarConnected?: boolean;
  onConnectCalendarClick?: () => void;
  notificationPermission?: "default" | "granted" | "denied";
  notificationsEnabled?: boolean;
  onToggleNotifications?: () => void;
  onRequestNotificationPermission?: () => void;
  onTriggerTestBriefing?: (timeOfDay: "morning" | "afternoon" | "evening") => void;
}

export default function LandingScreen({
  isDarkMode,
  onToggleDarkMode,
  tasks,
  triageResult,
  onActivatePanic,
  onMorningCheckClick,
  onAddTaskClick,
  onLoadDemo,
  isDemoMode = false,
  onExitDemo,
  calendarConnected = false,
  onConnectCalendarClick,
  notificationPermission = "default",
  notificationsEnabled = false,
  onToggleNotifications = () => {},
  onRequestNotificationPermission = () => {},
  onTriggerTestBriefing
}: LandingScreenProps) {
  const [stars, setStars] = useState<{ x: number; y: number; size: number; opacity: number }[]>([]);
  const [minutesAgo, setMinutesAgo] = useState<number>(0);

  // Generate background starry coordinates for premium dark theme depth
  useEffect(() => {
    const generatedStars = Array.from({ length: 24 }, () => ({
      x: Math.random() * 100,
      y: Math.random() * 100,
      size: Math.random() * 1.5 + 0.8,
      opacity: Math.random() * 0.6 + 0.2,
    }));
    setStars(generatedStars);
  }, []);

  // Update real-time minutes since cache was established
  useEffect(() => {
    try {
      const triageTime = localStorage.getItem('panicmode_triage_time');
      if (triageTime) {
        const diffMin = Math.floor((Date.now() - parseInt(triageTime, 10)) / (1000 * 60));
        setMinutesAgo(diffMin >= 0 ? diffMin : 0);
      }
    } catch (e) {}
  }, [triageResult]);

  // Premium deadline countdown calculator
  const getCountdownFormat = (task: Task) => {
    try {
      const now = new Date();
      const target = new Date(`${task.deadlineDate}T${task.deadlineTime}`);
      const diffMs = target.getTime() - now.getTime();
      if (diffMs < 0) return { text: "Overdue", color: "text-rose-500 font-black" };

      const diffMins = Math.floor(diffMs / (1000 * 60));
      const diffHours = Math.floor(diffMins / 60);

      if (diffMins < 60) {
        return { text: `${diffMins}m remaining`, color: "text-rose-500 font-extrabold animate-pulse" };
      } else if (diffHours < 6) {
        const remainingMins = diffMins % 60;
        return { text: `${diffHours}h ${remainingMins}m`, color: "text-amber-500 font-extrabold" };
      } else {
        const todayDateStr = now.toISOString().split("T")[0];
        const tomorrow = new Date(now);
        tomorrow.setDate(now.getDate() + 1);
        const tomorrowDateStr = tomorrow.toISOString().split("T")[0];

        if (task.deadlineDate === todayDateStr) {
          return { text: "Today", color: isDarkMode ? "text-slate-300" : "text-slate-600" };
        } else if (task.deadlineDate === tomorrowDateStr) {
          return { text: "Tomorrow", color: isDarkMode ? "text-indigo-400" : "text-indigo-600" };
        } else {
          const dayName = target.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" });
          return { text: dayName, color: isDarkMode ? "text-slate-400" : "text-slate-500" };
        }
      }
    } catch (e) {
      return { text: "--", color: "text-slate-400" };
    }
  };

  const hasTasks = tasks.length > 0;
  const hasValidCache = triageResult !== null;

  // Determine severity style for overall score
  const getScoreColor = (score: number) => {
    if (score >= 70) return "text-rose-500 font-black";
    if (score >= 40) return "text-amber-500 font-black";
    return "text-emerald-500 font-black";
  };

  return (
    <div
      className={`flex flex-col justify-between flex-1 w-full px-6 py-6 text-center relative overflow-hidden font-sans transition-colors duration-500 ${
        isDarkMode 
          ? "bg-slate-950 text-slate-100" 
          : "bg-slate-50/70 text-slate-900"
      }`}
      id="landing-screen"
    >
      {/* Decorative Aurora background drifts - matched to beautiful indigo/cyan theme */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden z-0">
        <motion.div 
          animate={{ 
            x: [0, 20, -10, 0],
            y: [0, -25, 15, 0],
            scale: [1, 1.12, 0.95, 1],
            opacity: [0.3, 0.45, 0.35, 0.3],
          }}
          transition={{ 
            duration: 15, 
            repeat: Infinity,
            ease: "easeInOut" 
          }}
          className={`absolute -top-16 -left-16 w-80 h-80 rounded-full blur-3xl ${
            isDarkMode 
              ? "bg-gradient-to-tr from-cyan-500/10 via-indigo-500/5 to-transparent" 
              : "bg-gradient-to-tr from-cyan-200/20 via-indigo-200/10 to-transparent"
          }`} 
        />
        <motion.div 
          animate={{ 
            x: [0, -15, 25, 0],
            y: [0, 20, -15, 0],
            scale: [1, 1.1, 0.9, 1],
            opacity: [0.25, 0.4, 0.3, 0.25],
          }}
          transition={{ 
            duration: 18, 
            repeat: Infinity,
            ease: "easeInOut" 
          }}
          className={`absolute -bottom-20 -right-20 w-96 h-96 rounded-full blur-3xl ${
            isDarkMode 
              ? "bg-gradient-to-br from-indigo-500/10 via-purple-500/5 to-transparent" 
              : "bg-gradient-to-br from-indigo-200/15 via-purple-200/10 to-transparent"
          }`} 
        />
      </div>

      {/* Subtle Star Particles for Dark Mode Atmosphere */}
      {isDarkMode && stars.map((star, idx) => (
        <div
          key={idx}
          className="absolute bg-white rounded-full pointer-events-none z-0 transition-all duration-300"
          style={{
            left: `${star.x}%`,
            top: `${star.y}%`,
            width: `${star.size}px`,
            height: `${star.size}px`,
            opacity: star.opacity,
          }}
        />
      ))}

      {/* Top Header bar */}
      <div className="w-full flex justify-between items-center z-10" id="landing-header">
        <div className="flex items-center gap-1.5">
          <div className="w-5 h-5 rounded-md bg-indigo-600 flex items-center justify-center shadow-sm">
            <span className="text-[11px] text-white select-none">⚡</span>
          </div>
          <span className={`text-[11px] font-black tracking-[0.18em] uppercase ${isDarkMode ? "text-slate-400" : "text-slate-500"}`}>
            TRIAGE.AI
          </span>
        </div>

        <div className="flex items-center gap-2">
          {onLoadDemo && (
            isDemoMode ? (
              <motion.button
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.97 }}
                onClick={onExitDemo}
                className={`px-3 py-1.5 rounded-xl border text-[11px] font-black uppercase tracking-wider cursor-pointer flex items-center gap-1.5 shadow-sm transition-all duration-300 ${
                  isDarkMode
                    ? "bg-rose-950/40 border-rose-900/40 text-rose-300 hover:bg-rose-950/60"
                    : "bg-rose-50 border-rose-100 text-rose-700 hover:bg-rose-100"
                }`}
              >
                <span className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-pulse shrink-0" />
                Exit Demo
              </motion.button>
            ) : (
              <motion.button
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.97 }}
                onClick={onLoadDemo}
                className={`px-3 py-1.5 rounded-xl border text-[11px] font-black uppercase tracking-wider cursor-pointer flex items-center gap-1.5 shadow-sm transition-all duration-300 ${
                  isDarkMode 
                    ? "bg-slate-900/80 border-slate-800 text-slate-300 hover:bg-slate-800" 
                    : "bg-white border-slate-200/60 text-slate-600 hover:bg-slate-100"
                }`}
              >
                <Sparkles size={11} className="text-indigo-500 animate-pulse" />
                Try Demo
              </motion.button>
            )
          )}

          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={onToggleDarkMode}
            className={`p-2 rounded-xl border transition-all duration-300 cursor-pointer ${
              isDarkMode 
                ? "bg-slate-900/80 border-slate-800 text-amber-400 hover:bg-slate-800" 
                : "bg-white border-slate-200/60 text-indigo-600 hover:bg-slate-100"
            }`}
            title="Toggle Theme"
            aria-label="Toggle Theme"
          >
            {isDarkMode ? <Sun size={13} className="stroke-[2.5]" /> : <Moon size={13} className="stroke-[2.5]" />}
          </motion.button>
        </div>
      </div>

      {/* Brand Heading Area */}
      <div className="flex flex-col items-center z-10 mt-4 space-y-2">
        {/* Animated Brand Badge */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1, duration: 0.4 }}
          className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-black uppercase tracking-[0.12em] border transition-all ${
            isDarkMode
              ? "bg-indigo-950/40 border-indigo-900/40 text-indigo-300 shadow-sm shadow-indigo-950/20"
              : "bg-indigo-50 border-indigo-100 text-indigo-700 shadow-sm"
          }`}
          id="ai-crisis-badge"
        >
          <Sparkles size={11} className="animate-pulse text-indigo-400" />
          <span>AI COGNITIVE SCHEDULER</span>
        </motion.div>

        {/* Brand Display Header - Redesigned to "TRIAGE AI" instead of "PANIC MODE" */}
        <motion.div 
          initial={{ scale: 0.95, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ delay: 0.15, duration: 0.4 }}
          className="flex items-center justify-center space-x-1.5" 
          id="app-title-group"
        >
          <span className={`text-3xl font-black uppercase tracking-tight leading-none transition-colors ${isDarkMode ? "text-white" : "text-slate-900"}`}>
            TRIAGE
          </span>
          <span className={`text-3xl font-black uppercase tracking-tight leading-none bg-gradient-to-r ${isDarkMode ? "from-cyan-400 to-indigo-400" : "from-indigo-600 to-cyan-600"} bg-clip-text text-transparent relative`}>
            AI
            <span className="absolute -top-1 -right-2.5 w-1.5 h-1.5 rounded-full bg-indigo-500 animate-pulse" />
          </span>
        </motion.div>

        {/* Elegant descriptive tagline */}
        <motion.p 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.25, duration: 0.4 }}
          className={`text-[11px] max-w-[280px] leading-relaxed font-medium transition-colors ${isDarkMode ? "text-slate-400" : "text-slate-500"}`}
        >
          Predicts schedule overload, analyzes busy calendar blocks, and auto-generates custom rescue plans instantly.
        </motion.p>
      </div>

      {/* Prominent Demo Mode Active Banner if active */}
      {isDemoMode && (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className={`z-10 mt-3 max-w-sm mx-auto w-full p-3 rounded-xl border flex items-center gap-2.5 text-left ${
            isDarkMode 
              ? "bg-indigo-950/50 border-indigo-900/60 text-[#c4b5fd]" 
              : "bg-indigo-50/90 border-indigo-100 text-indigo-800"
          }`}
          id="demo-banner-landing"
        >
          <Info size={14} className="text-indigo-500 shrink-0" />
          <div className="flex-1">
            <p className="text-[11px] font-black uppercase tracking-wider">Demo Mode Active</p>
            <p className="text-[11px] opacity-90 leading-tight">Simulating high overload to preview schedule rescue plans.</p>
          </div>
          <button
            onClick={onExitDemo}
            className={`px-2 py-1 rounded text-[11px] font-extrabold uppercase border cursor-pointer transition-colors ${
              isDarkMode 
                ? "bg-rose-950/30 border-rose-900/40 text-rose-300 hover:bg-rose-950/60" 
                : "bg-rose-100 border-rose-200 text-rose-800 hover:bg-rose-200"
            }`}
          >
            Exit
          </button>
        </motion.div>
      )}

      {/* Command Hub Dashboard Area */}
      <div className="flex flex-col z-10 mt-5 w-full max-w-sm mx-auto space-y-4">
        
        {/* [1] THE LIVE RISK RADAR/STATUS DECK */}
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3, duration: 0.4 }}
          className={`rounded-2xl p-4.5 text-left border relative transition-all duration-300 overflow-hidden ${
            hasTasks && hasValidCache
              ? isDarkMode
                ? "bg-slate-900/60 border-slate-800 shadow-xl shadow-black/10"
                : "bg-white border-slate-200/70 shadow-sm"
              : isDarkMode
                ? "bg-slate-900/40 border-slate-800/80"
                : "bg-white/80 border-slate-200"
          }`}
          id="live-risk-card"
        >
          {hasTasks && hasValidCache ? (
            <div className="space-y-3.5">
              <div className="flex items-center justify-between pb-2 border-b border-dashed dark:border-slate-800/80 border-slate-200">
                <div className="flex items-center gap-1.5">
                  <Activity size={12} className="text-indigo-500 animate-pulse" />
                  <span className={`text-[11px] font-black uppercase tracking-wider ${isDarkMode ? "text-slate-400" : "text-slate-500"}`}>
                    SCHEDULE SAFETY ANALYSIS
                  </span>
                </div>
                <div className="flex items-center gap-1">
                  <span className={`text-xs font-black ${getScoreColor(triageResult.overallRiskScore)}`}>
                    {triageResult.overallRiskScore}
                  </span>
                  <span className="text-[11px] text-slate-400 dark:text-slate-500 font-bold">/100</span>
                </div>
              </div>

              {/* Dynamic bar progress visualization */}
              <div className="space-y-1">
                <div className="flex justify-between text-[11px] font-bold text-slate-400 dark:text-slate-500">
                  <span>RISK INDEX</span>
                  <span className="uppercase text-indigo-500 dark:text-indigo-400 tracking-wider">
                    {triageResult.overallRiskScore >= 75 ? "CRITICAL CONFLICT" : triageResult.overallRiskScore >= 45 ? "HIGH OVERLOAD" : "STABLE SLOTS"}
                  </span>
                </div>
                <div className={`w-full h-1.5 rounded-full overflow-hidden ${isDarkMode ? "bg-slate-800" : "bg-slate-200"}`}>
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${triageResult.overallRiskScore}%` }}
                    transition={{ delay: 0.5, duration: 0.8, ease: "easeOut" }}
                    className={`h-full rounded-full ${
                      triageResult.overallRiskScore >= 70 
                        ? "bg-gradient-to-r from-amber-500 to-rose-500" 
                        : triageResult.overallRiskScore >= 40 
                          ? "bg-gradient-to-r from-cyan-500 to-amber-500" 
                          : "bg-gradient-to-r from-emerald-500 to-cyan-500"
                    }`}
                  />
                </div>
              </div>

              {/* Elegant Compact task row listings */}
              <div className="space-y-2 pt-1 max-h-[110px] overflow-y-auto pr-1" id="landing-tasks-mini-list">
                {tasks.filter(t => !t.isCompleted).map((task) => {
                  const countdown = getCountdownFormat(task);
                  return (
                    <div 
                      key={task.id} 
                      className={`flex items-center justify-between text-xs p-2 rounded-xl transition-colors ${
                        isDarkMode 
                          ? "bg-slate-900/60 border-0 hover:bg-slate-950" 
                          : "bg-slate-50 border border-slate-200/50 hover:bg-slate-100/50"
                      }`}
                    >
                      <div className="flex items-center gap-2 min-w-0 pr-2">
                        <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${
                          task.importance === 'High' 
                            ? 'bg-rose-500 shadow-sm shadow-rose-500/50' 
                            : 'bg-amber-500 shadow-sm shadow-amber-400/50'
                        }`} />
                        <span className={`font-semibold text-[11px] truncate max-w-[150px] ${isDarkMode ? "text-slate-200" : "text-slate-800"}`}>
                          {task.name}
                        </span>
                      </div>
                      <span className={`shrink-0 font-mono text-[11px] font-extrabold ${countdown.color}`}>
                        {countdown.text}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          ) : (
            // A gorgeous dashboard status when empty
            <div className="py-4 flex flex-col items-center justify-center space-y-3 text-center">
              <div className={`w-10 h-10 rounded-full flex items-center justify-center transition-all ${
                isDarkMode 
                  ? "bg-slate-950 text-slate-500 border border-slate-850" 
                  : "bg-slate-100 text-slate-400 border border-slate-200/40"
              }`}>
                <ShieldAlert size={16} className="text-indigo-500/90 animate-pulse" />
              </div>
              <div className="space-y-0.5">
                <p className={`text-[11px] font-black tracking-widest uppercase ${isDarkMode ? "text-slate-400" : "text-slate-600"}`}>
                  ENGINE SECURED & ACTIVE
                </p>
                <p className={`text-[11px] font-semibold leading-relaxed max-w-[220px] mx-auto ${isDarkMode ? "text-slate-500" : "text-slate-400"}`}>
                  Create custom tasks, connect your live calendar schedule, and run Triage evaluation.
                </p>
              </div>

              {onLoadDemo && !isDemoMode && (
                <button
                  onClick={onLoadDemo}
                  className={`px-3 py-1.5 rounded-lg text-[11px] font-black uppercase tracking-wider transition-all flex items-center gap-1 cursor-pointer border ${
                    isDarkMode 
                      ? "bg-indigo-950/20 border-indigo-900/40 text-indigo-300 hover:bg-indigo-950/40" 
                      : "bg-indigo-50 border-indigo-150 text-indigo-700 hover:bg-indigo-100/50"
                  }`}
                >
                  <Play size={11} className="fill-current" /> Try Demo Analysis
                </button>
              )}
            </div>
          )}
        </motion.div>

        {/* [2] GOOGLE CALENDAR SYNC CARD - Prompting them clearly when disconnected */}
        {!calendarConnected && onConnectCalendarClick && (
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.35, duration: 0.4 }}
            onClick={onConnectCalendarClick}
            className={`rounded-2xl p-4 flex items-center gap-3.5 text-left border cursor-pointer transition-all duration-200 ${
              isDarkMode
                ? "bg-gradient-to-r from-cyan-950/20 to-indigo-950/20 border-indigo-900/30 text-white hover:bg-indigo-950/30 hover:border-indigo-850"
                : "bg-gradient-to-r from-cyan-50/20 to-indigo-50/30 border-indigo-100 hover:bg-indigo-50/50 hover:border-indigo-200"
            }`}
            id="landing-connect-calendar-card"
          >
            <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 border transition-all ${
              isDarkMode 
                ? "bg-indigo-500/10 border-indigo-500/20 text-cyan-400" 
                : "bg-indigo-600/5 border-indigo-100 text-indigo-600"
            }`}>
              <Calendar size={16} className="animate-pulse" />
            </div>
            <div className="flex flex-col space-y-0.5 min-w-0 flex-1">
              <div className="flex items-center gap-1.5">
                <span className={`text-[11.5px] font-black uppercase tracking-wide ${isDarkMode ? "text-slate-200" : "text-slate-800"}`}>
                  Google Calendar Offline
                </span>
                <span className="w-1.5 h-1.5 rounded-full bg-cyan-500" />
              </div>
              <p className={`text-[11px] leading-relaxed ${isDarkMode ? "text-slate-400" : "text-slate-500"}`}>
                Sync with your Google account to read conflicts and avoid overlaps.
              </p>
              <span className="text-[11px] text-indigo-600 dark:text-cyan-400 font-extrabold tracking-widest uppercase pt-0.5 inline-flex items-center gap-1">
                Connect Google Calendar <ArrowRight size={11} />
              </span>
            </div>
          </motion.div>
        )}

        {/* [3] THE MORNING BRIEFING COMPACT DECK - Rendered always so user can access their plan */}
        {true && (
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.35, duration: 0.4 }}
            onClick={onMorningCheckClick}
            className={`rounded-2xl p-4 flex items-center gap-3.5 text-left border cursor-pointer transition-all duration-200 ${
              isDarkMode
                ? "bg-amber-950/15 border-amber-900/25 text-white hover:bg-amber-950/25 hover:border-amber-900/40"
                : "bg-amber-50/40 border-amber-100/80 hover:bg-amber-50/60 hover:border-amber-200"
            }`}
            id="morning-briefing-card"
          >
            <div className="w-9 h-9 rounded-xl bg-amber-500/10 flex items-center justify-center shrink-0 border border-amber-500/20">
              <span className="text-lg select-none animate-bounce">☀️</span>
            </div>
            <div className="flex flex-col space-y-0.5 min-w-0 flex-1">
              {hasTasks ? (
                <>
                  <div className="flex items-center gap-1.5">
                    <span className={`text-[11px] font-black tracking-wide ${isDarkMode ? "text-slate-200" : "text-slate-800"}`}>
                      Morning Briefing Active
                    </span>
                    <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-ping" />
                  </div>
                  <p className={`text-[11px] truncate ${isDarkMode ? "text-slate-400" : "text-slate-500"}`}>
                    View the customized action sequence to protect your calendar blocks today.
                  </p>
                  <span className="text-[11px] text-amber-600 dark:text-amber-400 font-extrabold tracking-widest uppercase pt-0.5 inline-flex items-center gap-1">
                    View Daily Action Plan <ArrowRight size={11} />
                  </span>
                </>
              ) : (
                <>
                  <span className={`text-[11px] font-bold ${isDarkMode ? "text-slate-400" : "text-slate-600"}`}>
                    Daily Action Plan Ready
                  </span>
                  <span className={`text-[11px] font-medium leading-normal ${isDarkMode ? "text-slate-500" : "text-slate-400"}`}>
                    Enter tasks to activate the predictive scheduling summary.
                  </span>
                </>
              )}
            </div>
          </motion.div>
        )}

        {/* If Calendar connected, show brief Connected indicator card */}
        {calendarConnected && (
          <div className={`p-2.5 rounded-xl border flex items-center justify-between text-[11px] font-bold ${
            isDarkMode ? "bg-slate-900/30 border-slate-850 text-slate-400" : "bg-white border-slate-200 text-slate-600"
          }`}>
            <span className="flex items-center gap-1.5">
              <CheckCircle2 size={11} className="text-emerald-500" />
              Calendar Securely Connected
            </span>
            <span className="text-[11px] opacity-70 uppercase tracking-widest">GOOGLE SYNC</span>
          </div>
        )}
      </div>

      {/* Primary Action Button Controls Area */}
      <div className="flex flex-col z-10 w-full max-w-sm mx-auto space-y-4 mt-auto pt-6">
        
        {/* [4] PRIMARY CALL-TO-ACTION BUTTON */}
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4, duration: 0.4 }}
          className="w-full"
        >
          <motion.button
            whileHover={{ scale: 1.02, y: -1 }}
            whileTap={{ scale: 0.98 }}
            transition={{ type: "spring", stiffness: 400, damping: 15 }}
            onClick={onActivatePanic}
            className={`w-full min-h-[44px] h-12 rounded-xl text-xs font-black uppercase tracking-wider flex items-center justify-center gap-2 transition-all cursor-pointer shadow-md ${
              isDarkMode
                ? "bg-gradient-to-r from-cyan-600 to-indigo-600 hover:from-cyan-500 hover:to-indigo-500 text-white shadow-cyan-950/20"
                : "bg-gradient-to-r from-indigo-600 to-cyan-600 hover:from-indigo-700 hover:to-cyan-700 text-white shadow-indigo-100"
            }`}
            id="btn-activate-panic-landing"
          >
            <Zap size={11} className="fill-current text-white animate-pulse" />
            <span>Analyze Schedule Risk</span>
          </motion.button>
        </motion.div>

        {/* [5] RECENT STATS / TASK SUMMARY FOOTER */}
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.45, duration: 0.4 }}
          className="text-center h-4 flex items-center justify-center"
        >
          {hasTasks ? (
            <span className={`text-[11px] font-bold tracking-wide ${isDarkMode ? "text-slate-500" : "text-slate-400"}`}>
              {tasks.length} active {tasks.length === 1 ? "task" : "tasks"} · updated {minutesAgo} min ago
            </span>
          ) : (
            <span className={`text-[11px] italic font-semibold tracking-wide ${isDarkMode ? "text-slate-500" : "text-slate-400"}`}>
              No current tasks loaded — add some to check your schedule.
            </span>
          )}
        </motion.div>

        {/* [6] SECONDARY CALL-TO-ACTION BUTTON */}
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5, duration: 0.4 }}
          className="w-full"
        >
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={onAddTaskClick}
            className={`w-full min-h-[44px] h-11 rounded-xl text-xs font-bold tracking-wider flex items-center justify-center gap-1.5 transition-all cursor-pointer border ${
              isDarkMode
                ? "bg-slate-900 hover:bg-slate-850 text-slate-200 border-slate-800"
                : "bg-white hover:bg-slate-50 text-slate-700 border-slate-200"
            }`}
            id="btn-add-task-landing"
          >
            <Plus size={12} className="stroke-[2.5] text-indigo-500" />
            <span>Add & Manage Tasks</span>
          </motion.button>
        </motion.div>

        {/* [7] COMPACT CREDITS FOOTER */}
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.55, duration: 0.4 }}
          className={`text-[11px] font-black tracking-[0.08em] uppercase text-center transition-colors pt-2 ${isDarkMode ? "text-slate-600" : "text-slate-400"}`} 
          id="powered-by-gemini-footer"
        >
          ⚡ POWERED BY GEMINI 2.5
        </motion.div>
      </div>
    </div>
  );
}
