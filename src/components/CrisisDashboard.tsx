import React, { useEffect, useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { 
  ArrowRight, 
  ArrowLeft,
  FileText, 
  RefreshCw, 
  Edit3, 
  Send,
  Sparkles,
  Zap,
  Clock,
  Sun,
  Moon,
  AlertTriangle,
  Bell,
  ShieldAlert,
  Lightbulb,
  X,
  CheckCircle2,
  Circle
} from "lucide-react";
import { TriageResult, Task } from "../types";
import { 
  formatCentralTimeRange, 
  cleanTextOfIds, 
  generateTimeBlockAction,
  resolveTask,
  formatDeadlineHuman,
  formatConflictAlertPlain,
  generateDynamicTriageResult,
  formatTimeTo12Hour,
  capitalizeTimelineTitle
} from "../utils";
import { createFocusBlockEvent } from "../lib/calendarService";

function isAfter9PM(timeStr: string): boolean {
  if (!timeStr) return false;
  const clean = timeStr.trim().toLowerCase();
  
  // Match something like "10:30 pm" or "9:15 pm" or "9:00 pm"
  const match12 = clean.match(/(?:^|\b)(\d{1,2}):(\d{2})\s*(am|pm)\b/);
  if (match12) {
    let hours = parseInt(match12[1], 10);
    const minutes = parseInt(match12[2], 10);
    const ampm = match12[3];
    if (ampm === "pm" && hours !== 12) {
      hours += 12;
    } else if (ampm === "am" && hours === 12) {
      hours = 0;
    }
    return hours > 21 || (hours === 21 && minutes > 0);
  }
  
  // Match 24h format like "21:30" or "22:00"
  const match24 = clean.match(/(?:^|\b)(\d{1,2}):(\d{2})\b/);
  if (match24) {
    const hours = parseInt(match24[1], 10);
    const minutes = parseInt(match24[2], 10);
    if (hours >= 0 && hours <= 23 && minutes >= 0 && minutes <= 59) {
      return hours > 21 || (hours === 21 && minutes > 0);
    }
  }

  // Fallback check
  if (clean.includes("pm")) {
    if (clean.includes("10:") || clean.includes("11:") || clean.includes("12:")) {
      return true;
    }
    if (clean.includes("9:")) {
      const match9 = clean.match(/9:(\d{2})/);
      if (match9) {
        const minutes = parseInt(match9[1], 10);
        return minutes > 0;
      }
    }
  }
  
  return false;
}

interface CrisisDashboardProps {
  isDarkMode: boolean;
  onToggleDarkMode: () => void;
  triage: TriageResult;
  tasks: Task[];
  onSelectTask: (taskId: string) => void;
  onOpenDraftModal: (taskId: string) => void;
  onReAnalyze: () => void;
  onBackToIntake: () => void;
  isDemoFallbackActive?: boolean;
  fallbackErrorType?: string;
  calendarConnected?: boolean;
  calendarAccessToken?: string | null;
  onDisconnectCalendar?: () => void;
  onBackToLanding?: () => void;
  globalTick?: number;
  onToggleCompleteTask?: (taskId: string) => void;
}

export default function CrisisDashboard({
  isDarkMode,
  onToggleDarkMode,
  triage,
  tasks,
  onSelectTask,
  onOpenDraftModal,
  onReAnalyze,
  onBackToIntake,
  isDemoFallbackActive = false,
  fallbackErrorType,
  calendarConnected = false,
  calendarAccessToken = null,
  onDisconnectCalendar,
  onBackToLanding,
  globalTick,
  onToggleCompleteTask,
}: CrisisDashboardProps) {
  // Count up/down animation states for the overall risk score
  const [prevScore, setPrevScore] = useState(0);
  const [animatedScore, setAnimatedScore] = useState(0);
  const [isPulsing, setIsPulsing] = useState(false);

  // States for "What if I skip?" button
  const [whatIfLoading, setWhatIfLoading] = useState<Record<string, boolean>>({});
  const [whatIfResult, setWhatIfResult] = useState<Record<string, { newScore: number; isLower: boolean }>>({});

  // Countdown timer live updates state
  const [tick, setTick] = useState(0);

  // Use globalTick to drive live updates if provided
  const currentTick = globalTick !== undefined ? globalTick : tick;

  // Notifications UI state
  const [showNotifications, setShowNotifications] = useState(false);

  // States for saving Rescue Plan to Google Calendar
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'success' | 'error'>('idle');
  const [saveError, setSaveError] = useState<string | null>(null);

  const parseTimeStr = (timeStr: string, isEnd: boolean, partnerTimeIso?: string): Date => {
    let d = new Date();
    let str = timeStr.trim().toUpperCase();
    
    if (str === "NOW" || str.startsWith("NOW")) {
      if (isEnd && partnerTimeIso) {
        const startD = new Date(partnerTimeIso);
        return new Date(startD.getTime() + 45 * 60 * 1000);
      }
      return d;
    }
    
    let isTomorrow = str.includes("TOMORROW");
    if (isTomorrow) {
      d.setDate(d.getDate() + 1);
      str = str.replace("TOMORROW", "").trim();
    }
    
    const isPM = str.includes("PM");
    const isAM = str.includes("AM");
    str = str.replace(/AM|PM/g, "").trim();
    
    let hours = 0;
    let minutes = 0;
    
    if (str.includes(":")) {
      const parts = str.split(":");
      hours = parseInt(parts[0], 10);
      minutes = parseInt(parts[1], 10);
    } else {
      hours = parseInt(str, 10);
      minutes = 0;
    }
    
    if (isNaN(hours)) hours = 12;
    if (isNaN(minutes)) minutes = 0;
    
    if (isPM && hours < 12) {
      hours += 12;
    } else if (isAM && hours === 12) {
      hours = 0;
    }
    
    d.setHours(hours, minutes, 0, 0);
    
    // Automatically roll to tomorrow if the scheduled block is in the past today
    const now = new Date();
    if (!isTomorrow && d.getTime() < now.getTime() - 15 * 60 * 1000) {
      d.setDate(d.getDate() + 1);
    }
    
    if (isNaN(d.getTime())) {
      return new Date();
    }
    
    return d;
  };

  const handleSaveToCalendar = async () => {
    if (!calendarAccessToken) return;
    setSaveStatus('saving');
    setSaveError(null);
    try {
      const timeBlocks = triage.rescuePlan.timeBlocks;
      for (const block of timeBlocks) {
        const task = resolveTask(block.taskId, tasks);
        const taskName = task ? task.name : "";
        
        const startD = parseTimeStr(block.startTime, false);
        const endD = parseTimeStr(block.endTime, true, startD.toISOString());
        
        if (startD.getTime() >= endD.getTime()) {
          endD.setTime(startD.getTime() + 45 * 60 * 1000);
        }
        
        const description = generateTimeBlockAction(block, task, tasks);
        
        await createFocusBlockEvent(
          calendarAccessToken,
          taskName,
          startD.toISOString(),
          endD.toISOString(),
          description
        );
      }
      setSaveStatus('success');
    } catch (e: any) {
      console.error("Failed to save blocks to Google Calendar:", e);
      setSaveStatus('error');
      setSaveError(e.message || "Failed to sync rescue plan.");
    }
  };

  // Dynamic Triage-aware Notifications and Reminders generator
  const getNotificationsAndReminders = () => {
    const list: { id: string; type: "urgent" | "warning" | "tip"; title: string; desc: string; taskId?: string }[] = [];

    // 1. Failure predictions with higher risk probability
    if (triage.deadlineFailurePredictions) {
      triage.deadlineFailurePredictions.forEach(p => {
        if (p.failureProbability >= 0.4) {
          const task = resolveTask(p.taskId, tasks);
          if (task) {
            list.push({
              id: `fail-${p.taskId}`,
              type: "urgent",
              title: `High Failure Risk: ${task.name}`,
              desc: `Deadline prediction shows a ${Math.round(p.failureProbability * 100)}% failure likelihood. Strategy: ${p.recoveryRequires}`,
              taskId: p.taskId
            });
          }
        }
      });
    }

    // 2. Structural schedule overlaps are shown separately in the "Schedule Conflict Detected" section below to avoid duplicate alerts.

    // 3. Helpful sacrifice/shortening tips
    if (triage.priorityStack) {
      triage.priorityStack.forEach(p => {
        if (p.sacrificeRecommended) {
          const task = resolveTask(p.taskId, tasks);
          if (task) {
            list.push({
              id: `sacrifice-${p.taskId}`,
              type: "tip",
              title: "AI Optimization Recommendation",
              desc: p.sacrificeRationale || `Consider shortening this task to free up buffer space today.`,
              taskId: p.taskId
            });
          }
        }
      });
    }

    // 4. Default nominal status
    if (list.length === 0 && tasks.length > 0) {
      list.push({
        id: "nominal-check",
        type: "tip",
        title: "Workload Status Healthy",
        desc: "All active commitments have safe scheduling margin. Keep going!"
      });
    }

    return list;
  };

  const notifications = getNotificationsAndReminders();

  useEffect(() => {
    if (globalTick !== undefined) return;
    const interval = setInterval(() => {
      setTick(prev => prev + 1);
    }, 30000); // Trigger re-render every 30 seconds for live countdowns
    return () => clearInterval(interval);
  }, [globalTick]);

  useEffect(() => {
    const startValue = prevScore;
    const endValue = triage.overallRiskScore;
    
    // 1.2s on initial zero, 1.0s otherwise
    const duration = startValue === 0 ? 1200 : 1000;
    const startTime = performance.now();

    let animationFrameId: number;

    const animate = (currentTime: number) => {
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / duration, 1);
      
      // Ease-out curve
      const easeProgress = 1 - Math.pow(1 - progress, 3);
      const currentScore = Math.round(startValue + (endValue - startValue) * easeProgress);
      setAnimatedScore(currentScore);

      if (progress < 1) {
        animationFrameId = requestAnimationFrame(animate);
      } else {
        setPrevScore(endValue);
        setIsPulsing(true);
        const timer = setTimeout(() => {
          setIsPulsing(false);
        }, 500);
        return () => clearTimeout(timer);
      }
    };

    animationFrameId = requestAnimationFrame(animate);

    return () => {
      cancelAnimationFrame(animationFrameId);
    };
  }, [triage.overallRiskScore]);

  // Buffer and countdown helpers
  const calculateMinBuffer = () => {
    let minBufMinutes = Infinity;
    for (const task of tasks) {
      try {
        let d: Date;
        if (task.deadlineDate && task.deadlineTime) {
          d = new Date(`${task.deadlineDate}T${task.deadlineTime}:00`);
        } else if (task.deadlineDate) {
          d = new Date(task.deadlineDate);
        } else {
          continue;
        }

        if (isNaN(d.getTime())) continue;

        const now = new Date();
        const diffMs = d.getTime() - now.getTime();
        const availableHours = diffMs / (1000 * 60 * 60);
        const bufferHours = availableHours - task.hoursNeeded;
        const bufferMin = bufferHours * 60;
        if (bufferMin < minBufMinutes) {
          minBufMinutes = bufferMin;
        }
      } catch (e) {
        // ignore
      }
    }

    if (minBufMinutes === Infinity) {
      return { text: "N/A", color: "text-green-500" };
    }

    let displayBuf = minBufMinutes;
    if (displayBuf < 0) {
      displayBuf = 0;
    }

    let text = "";
    if (displayBuf < 60) {
      text = `${Math.round(displayBuf)}m`;
    } else {
      text = `${Math.round(displayBuf / 60)}h`;
    }

    let color = isDarkMode ? "text-emerald-400" : "text-emerald-600";
    if (minBufMinutes < 30) {
      color = isDarkMode ? "text-rose-400 font-bold" : "text-red-600 font-bold";
    } else if (minBufMinutes < 120) {
      color = isDarkMode ? "text-amber-400 font-bold" : "text-amber-500 font-bold";
    }

    return { text, color };
  };

  const getCountdownInfo = (task: Task) => {
    let d: Date;
    if (task.deadlineDate && task.deadlineTime) {
      d = new Date(`${task.deadlineDate}T${task.deadlineTime}:00`);
    } else if (task.deadlineDate) {
      d = new Date(task.deadlineDate);
    } else {
      return { text: "N/A", color: isDarkMode ? "text-slate-500" : "text-slate-500" };
    }

    if (isNaN(d.getTime())) {
      return { text: "N/A", color: "text-slate-500" };
    }

    const now = new Date();
    const diffMs = d.getTime() - now.getTime();
    
    if (diffMs <= 0) {
      return { text: "Overdue", color: "text-red-500 font-bold" };
    }

    const diffMinutes = Math.floor(diffMs / (1000 * 60));
    const diffHours = Math.floor(diffMinutes / 60);
    const diffDays = Math.floor(diffMinutes / (60 * 24));

    let color = isDarkMode ? "text-slate-400" : "text-slate-400";
    
    // Specific rules for countdown
    if (diffMinutes < 60) {
      color = "text-rose-500 font-extrabold";
      return { text: `${diffMinutes}m`, color };
    } else if (diffHours < 6) {
      color = "text-rose-400 font-bold";
      return { text: `${diffHours}h ${diffMinutes % 60}m`, color };
    } else if (diffDays === 0) {
      color = "text-amber-500 font-bold";
      return { text: `${diffHours}h`, color };
    } else if (diffDays === 1) {
      return { text: "Tomorrow", color: isDarkMode ? "text-slate-400" : "text-slate-400" };
    } else {
      const weekday = d.toLocaleDateString("en-US", { weekday: "long" });
      return { text: weekday, color: isDarkMode ? "text-slate-400" : "text-slate-400" };
    }
  };

  const getDueInString = (task: Task) => {
    const countdown = getCountdownInfo(task);
    if (countdown.text === "Overdue") return "Overdue";
    if (countdown.text === "Tomorrow") return "Due Tomorrow";
    if (["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"].includes(countdown.text)) {
      return `Due ${countdown.text}`;
    }
    return `Due in ${countdown.text}`;
  };

  // What-if handler
  const handleWhatIfSkip = async (taskId: string) => {
    setWhatIfLoading(prev => ({ ...prev, [taskId]: true }));
    try {
      const remainingTasks = tasks.filter(t => t.id !== taskId);
      const response = await fetch("/api/analyze", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          tasks: remainingTasks,
          currentTime: new Date().toISOString(),
        }),
      });

      let newScore = 0;
      if (response.ok) {
        const parsedData = await response.json();
        if (parsedData.error) {
          const dynamicFallback = generateDynamicTriageResult(remainingTasks, new Date().toISOString());
          newScore = dynamicFallback.overallRiskScore;
        } else {
          newScore = parsedData.overallRiskScore ?? 45;
        }
      } else {
        const dynamicFallback = generateDynamicTriageResult(remainingTasks, new Date().toISOString());
        newScore = dynamicFallback.overallRiskScore;
      }

      const isLower = triage.overallRiskScore - newScore >= 10;
      setWhatIfResult(prev => ({ ...prev, [taskId]: { newScore, isLower } }));
    } catch (e) {
      const remainingTasks = tasks.filter(t => t.id !== taskId);
      const dynamicFallback = generateDynamicTriageResult(remainingTasks, new Date().toISOString());
      const newScore = dynamicFallback.overallRiskScore;
      const isLower = triage.overallRiskScore - newScore >= 10;
      setWhatIfResult(prev => ({ ...prev, [taskId]: { newScore, isLower } }));
    } finally {
      setWhatIfLoading(prev => ({ ...prev, [taskId]: false }));
    }
  };

  const minBuf = calculateMinBuffer();
  const atRiskCount = triage.priorityStack.filter(p => {
    const lvl = (p.riskLevel || p.statusColor || "").toLowerCase();
    return lvl === "critical" || lvl === "high";
  }).length;
  const conflictCount = triage.conflictDetection ? triage.conflictDetection.length : 0;

  // Color mappings
  const getRiskColors = (level: string) => {
    const lvl = level.toLowerCase();
    if (lvl === "critical" || lvl === "red") {
      return {
        text: "text-rose-500",
        bg: isDarkMode ? "bg-rose-950/30" : "bg-rose-50",
        border: "border-rose-900/30",
        accent: "bg-rose-600",
        dot: "🔴"
      };
    } else if (lvl === "high" || lvl === "orange") {
      return {
        text: "text-amber-500",
        bg: isDarkMode ? "bg-amber-950/20" : "bg-amber-50",
        border: "border-amber-800/30",
        accent: "bg-amber-500",
        dot: "🟠"
      };
    } else if (lvl === "medium" || lvl === "amber") {
      return {
        text: "text-yellow-500",
        bg: isDarkMode ? "bg-yellow-950/20" : "bg-yellow-50/50",
        border: "border-yellow-700/30",
        accent: "bg-yellow-500",
        dot: "🟡"
      };
    } else {
      return {
        text: "text-cyan-500",
        bg: isDarkMode ? "bg-cyan-950/20" : "bg-cyan-50",
        border: "border-cyan-800/30",
        accent: "bg-cyan-500",
        dot: "🟢"
      };
    }
  };

  const riskColors = getRiskColors(triage.overallRiskLevel);

  const pulseClass = isPulsing
    ? "text-rose-500 scale-110 font-black drop-shadow-[0_0_15px_rgba(244,63,94,0.5)] transition-all duration-200"
    : `scale-100 transition-all duration-300 ${riskColors.text}`;

  return (
    <div className={`flex flex-col min-h-screen px-4 pb-24 font-sans w-full transition-colors duration-300 ${
      isDarkMode ? "bg-slate-900 text-slate-100" : "bg-white text-slate-900"
    }`} id="crisis-dashboard">
      
      {/* Top Brand Banner */}
      <div className={`flex items-center justify-between py-5 border-b transition-colors duration-300 ${isDarkMode ? "border-slate-800" : "border-slate-100"}`}>
        <div className="flex items-center gap-2">
          {onBackToLanding && (
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={onBackToLanding}
              className={`p-1.5 rounded-lg border mr-1 cursor-pointer transition-colors ${
                isDarkMode 
                  ? "bg-slate-800 border-slate-700 text-slate-400 hover:text-slate-200" 
                  : "bg-slate-50 border-slate-200 text-slate-500 hover:text-slate-800"
              }`}
              title="Back to Dashboard"
            >
              <ArrowLeft size={13} className="stroke-[2.5]" />
            </motion.button>
          )}
          <div className="flex items-center gap-1.5">
            <span className="text-sm">⚡</span>
            <span className={`font-display font-black text-xl tracking-tight uppercase ${isDarkMode ? "text-slate-100" : "text-slate-900"}`}>
              Triage<span className={isDarkMode ? "text-cyan-400" : "text-indigo-600"}>AI</span>
            </span>
          </div>
          {calendarConnected && onDisconnectCalendar && (
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={onDisconnectCalendar}
              className={`text-[11px] font-extrabold uppercase tracking-widest px-2.5 py-1 rounded-lg border transition-all cursor-pointer flex items-center gap-1.5 ml-2 ${
                isDarkMode 
                  ? "bg-slate-800/60 border-slate-700/80 hover:bg-rose-950/40 hover:border-rose-900/40 text-slate-400 hover:text-rose-400" 
                  : "bg-slate-50 border-slate-200 hover:bg-rose-50 hover:border-rose-200 text-slate-500 hover:text-rose-600"
              }`}
            >
              Disconnect
            </motion.button>
          )}
        </div>
        
        <div className="flex items-center gap-2.5">
          <span className={`text-[11px] font-bold px-2.5 py-0.5 rounded-full uppercase tracking-wider ${
            isDarkMode ? "bg-cyan-950/50 text-cyan-400 border border-cyan-800/40 animate-pulse" : "bg-indigo-50 text-indigo-700 border border-indigo-100 animate-pulse"
          }`}>
            Live Simulation
          </span>

          {/* Notification bell button */}
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setShowNotifications(!showNotifications)}
            type="button"
            className={`p-1.5 rounded-lg border transition-all duration-300 cursor-pointer relative ${
              isDarkMode 
                ? "bg-slate-800 border-slate-700 text-cyan-400 hover:bg-slate-700" 
                : "bg-slate-50 border-slate-200 text-indigo-600 hover:bg-slate-100"
            }`}
            title="View notifications & reminders"
          >
            <Bell size={14} />
            {notifications.length > 0 && (
              <span className="absolute -top-0.5 -right-0.5 w-2 h-2 bg-rose-500 rounded-full animate-ping" />
            )}
            {notifications.length > 0 && (
              <span className="absolute -top-0.5 -right-0.5 w-2 h-2 bg-rose-500 rounded-full" />
            )}
          </motion.button>

          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={onToggleDarkMode}
            type="button"
            className={`p-1.5 rounded-lg border transition-all duration-300 cursor-pointer ${
              isDarkMode 
                ? "bg-slate-800 border-slate-700 text-amber-400 hover:bg-slate-700" 
                : "bg-slate-50 border-slate-200 text-indigo-600 hover:bg-slate-100"
            }`}
          >
            {isDarkMode ? <Sun size={14} /> : <Moon size={14} />}
          </motion.button>
        </div>
      </div>

      {/* Notifications Popover Overlay */}
      <AnimatePresence>
        {showNotifications && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className={`border rounded-2xl p-4 mt-3 shadow-xl space-y-3 z-40 relative transition-all duration-300 ${
              isDarkMode ? "bg-slate-800 border-slate-700 text-white" : "bg-white border-slate-200 text-slate-900"
            }`}
            id="notifications-popover"
          >
            <div className="flex items-center justify-between border-b pb-2 transition-colors duration-300 dark:border-slate-700 border-slate-100">
              <span className="text-xs font-bold uppercase tracking-widest text-slate-400 flex items-center gap-1.5">
                <Bell size={12} className="text-cyan-400" /> Reminders & Notifications ({notifications.length})
              </span>
              <button 
                onClick={() => setShowNotifications(false)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-0.5 rounded cursor-pointer"
              >
                <X size={14} />
              </button>
            </div>

            <div className="space-y-2.5 max-h-[250px] overflow-y-auto pr-1">
              {notifications.map((n) => (
                <div 
                  key={n.id} 
                  onClick={() => {
                    if (n.taskId) {
                      onSelectTask(n.taskId);
                      setShowNotifications(false);
                    }
                  }}
                  className={`p-3 rounded-xl border flex gap-2.5 cursor-pointer transition-all duration-200 text-left ${
                    n.type === "urgent"
                      ? (isDarkMode ? "bg-rose-950/20 border-rose-900/40 hover:bg-rose-950/30" : "bg-rose-50 border-rose-100 hover:bg-rose-100/50")
                      : n.type === "warning"
                      ? (isDarkMode ? "bg-amber-950/20 border-amber-900/30 hover:bg-amber-950/30" : "bg-amber-50 border-amber-200 hover:bg-amber-100/50")
                      : (isDarkMode ? "bg-cyan-950/10 border-cyan-900/35 hover:bg-cyan-950/20" : "bg-indigo-50/50 border-indigo-100 hover:bg-indigo-100/30")
                  }`}
                >
                  <div className="shrink-0 mt-0.5">
                    {n.type === "urgent" && <ShieldAlert size={14} className="text-rose-500" />}
                    {n.type === "warning" && <AlertTriangle size={14} className="text-amber-500" />}
                    {n.type === "tip" && <Lightbulb size={14} className="text-cyan-400" />}
                  </div>
                  <div className="space-y-0.5">
                    <p className={`text-xs font-bold leading-none ${
                      n.type === "urgent" ? "text-rose-500" :
                      n.type === "warning" ? "text-amber-500" :
                      (isDarkMode ? "text-cyan-300" : "text-indigo-700")
                    }`}>
                      {n.title}
                    </p>
                    <p className={`text-[11px] leading-relaxed font-semibold ${isDarkMode ? "text-slate-300" : "text-slate-600"}`}>
                      {cleanTextOfIds(n.desc, tasks)}
                    </p>
                    {n.taskId && (
                      <span className="text-[11px] font-bold text-slate-400 hover:underline block pt-1">
                        View detail →
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {isDemoFallbackActive && (
        <div className={`mt-3 border rounded-xl p-3 text-center flex flex-col items-center justify-center gap-1 shadow-sm animate-fade-in ${
          isDarkMode ? "bg-amber-950/20 border-amber-900/40 text-amber-400" : "bg-amber-50 border-amber-200 text-amber-800"
        }`} id="demo-fallback-banner">
          {fallbackErrorType === "quota_exceeded" ? (
            <>
              <div className="text-xs font-bold flex items-center gap-1">
                ⚡ Offline Fallback Mode Active (Gemini Quota Exceeded)
              </div>
              <div className="text-[11px] font-medium opacity-85 max-w-[340px]">
                Your Gemini API Key has exceeded its rate limit or free tier quota. We have seamlessly loaded a high-fidelity offline backup analysis.
              </div>
            </>
          ) : fallbackErrorType === "invalid_key" ? (
            <>
              <div className="text-xs font-bold flex items-center gap-1">
                ⚡ Offline Fallback Mode Active (Invalid API Key)
              </div>
              <div className="text-[11px] font-medium opacity-85 max-w-[340px]">
                The configured <span className="font-bold underline">GEMINI_API_KEY</span> appears to be invalid or expired. Please verify your credentials under Settings.
              </div>
            </>
          ) : fallbackErrorType === "unavailable" ? (
            <>
              <div className="text-xs font-bold flex items-center gap-1">
                ⚡ Offline Fallback Mode Active (Gemini High Demand)
              </div>
              <div className="text-[11px] font-medium opacity-85 max-w-[340px]">
                Gemini is currently experiencing high demand. We have seamlessly loaded a high-fidelity backup triage. Feel free to re-analyze in a moment!
              </div>
            </>
          ) : (
            <>
              <div className="text-xs font-bold flex items-center gap-1">
                ⚡ Offline Fallback Mode Active (Gemini Offline)
              </div>
              <div className="text-[11px] font-medium opacity-85 max-w-[340px]">
                To enable live custom analysis with Gemini, please ensure your <span className="font-bold underline">GEMINI_API_KEY</span> is configured in the Secrets panel under the Settings menu.
              </div>
            </>
          )}
        </div>
      )}

      {/* SECTION A — RISK SCORE CARD */}
      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
        className={`mt-6 border rounded-2xl p-6 shadow-sm text-center relative overflow-hidden transition-colors duration-300 ${
          isDarkMode ? "bg-gradient-to-b from-slate-800 to-slate-850 border-slate-700" : "bg-gradient-to-b from-white to-slate-50/50 border-slate-200/80"
        }`}
        id="risk-score-card"
      >
        {/* Soft state-dependent backing halo */}
        <div className={`absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 w-48 h-48 rounded-full blur-3xl opacity-20 pointer-events-none z-0 ${riskColors.accent}`} />

        <div className="relative z-10">
          <span className={`block text-[11px] font-bold uppercase tracking-widest mb-1.5 ${isDarkMode ? "text-slate-400" : "text-slate-400"}`}>
            OVERALL WORKLOAD RISK
          </span>

          {/* Large visual score with scale animation */}
          <div className="flex justify-center items-baseline mb-2 h-[84px] overflow-visible">
            <span className={`text-[72px] font-black tracking-tighter leading-none inline-block ${pulseClass}`}>
              {animatedScore}
            </span>
            <span className={`text-xl font-bold ml-1 font-mono ${isDarkMode ? "text-slate-600" : "text-slate-300"}`}>/100</span>
          </div>

          {/* Risk Level Badge */}
          <span className={`inline-block px-4 py-1 rounded-full text-[11px] font-black uppercase tracking-widest shadow-sm border transition-colors duration-300 ${
            riskColors.bg} ${riskColors.text} ${riskColors.border} mb-4`}>
            {riskColors.dot} {triage.overallRiskLevel}
          </span>

          {/* Progress Bar */}
          <div className={`w-full rounded-full h-2.5 mb-5 overflow-hidden shadow-inner border transition-colors duration-300 ${
            isDarkMode ? "bg-slate-900 border-slate-800/40" : "bg-slate-100 border-slate-200/10"
          }`}>
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${triage.overallRiskScore}%` }}
              transition={{ duration: 1.4, ease: [0.16, 1, 0.3, 1] }}
              className={`h-full rounded-full ${riskColors.accent}`}
            />
          </div>

          {/* One-sentence risk rationale from AI */}
          <p className={`text-[13px] font-bold leading-relaxed italic p-3.5 rounded-xl border border-dashed shadow-sm transition-colors duration-300 ${
            isDarkMode 
              ? "bg-slate-900/60 border-slate-700 text-slate-300" 
              : "bg-white border-slate-200 text-slate-700"
          }`}>
            "{cleanTextOfIds(triage.overallRiskRationale, tasks)}"
          </p>
        </div>
      </motion.div>

      {/* STAT SUMMARY ROW */}
      <div className="grid grid-cols-3 gap-3 mt-4" id="stat-summary-row">
        <div className={`border rounded-2xl p-3 shadow-sm flex flex-col items-center justify-center text-center transition-all duration-300 ${
          isDarkMode ? "bg-slate-800/60 border-slate-700" : "bg-white border-slate-200"
        }`}>
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-0.5">At Risk</span>
          <span className="text-xl font-extrabold text-rose-500">{atRiskCount}</span>
        </div>
        <div className={`border rounded-2xl p-3 shadow-sm flex flex-col items-center justify-center text-center transition-all duration-300 ${
          isDarkMode ? "bg-slate-800/60 border-slate-700" : "bg-white border-slate-200"
        }`}>
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-0.5">Conflicts</span>
          <span className="text-xl font-extrabold text-amber-500">{conflictCount}</span>
        </div>
        <div className={`border rounded-2xl p-3 shadow-sm flex flex-col items-center justify-center text-center transition-all duration-300 ${
          isDarkMode ? "bg-slate-800/60 border-slate-700" : "bg-white border-slate-200"
        }`}>
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-0.5">Min Buffer</span>
          <span className={`text-xl font-extrabold ${minBuf.color}`}>{minBuf.text}</span>
        </div>
      </div>

      {/* ACTIVE REMINDERS SECTION */}
      <div className="mt-5 space-y-2" id="dashboard-reminders-section">
        <h4 className="text-[11px] font-black text-slate-400 uppercase tracking-widest px-1 flex items-center gap-1.5">
          <Bell size={11} className="text-cyan-400" /> Active Reminders & Alerts
        </h4>
        <div className="grid grid-cols-1 gap-2">
          {notifications.slice(0, 2).map((n) => (
            <div
              key={`dash-rem-${n.id}`}
              onClick={() => {
                if (n.taskId) {
                  onSelectTask(n.taskId);
                }
              }}
              className={`border rounded-2xl p-3.5 flex gap-3 transition-all duration-200 shadow-sm ${
                n.taskId ? "cursor-pointer hover:scale-[1.01]" : ""
              } ${
                n.type === "urgent"
                  ? (isDarkMode ? "bg-rose-950/15 border-rose-900/30 text-rose-300 hover:bg-rose-950/25" : "bg-rose-50/70 border-rose-100 hover:bg-rose-100/50")
                  : n.type === "warning"
                  ? (isDarkMode ? "bg-amber-950/15 border-amber-900/30 text-amber-300 hover:bg-amber-950/25" : "bg-amber-50/70 border-amber-200 hover:bg-amber-100/50")
                  : (isDarkMode ? "bg-cyan-950/15 border-cyan-900/30 text-cyan-300 hover:bg-cyan-950/25" : "bg-indigo-50/40 border-indigo-100 hover:bg-indigo-100/30")
              }`}
            >
              <div className="shrink-0 mt-0.5">
                {n.type === "urgent" && <ShieldAlert size={15} className="text-rose-500" />}
                {n.type === "warning" && <AlertTriangle size={15} className="text-amber-500 animate-pulse" />}
                {n.type === "tip" && <Lightbulb size={15} className="text-cyan-400" />}
              </div>
              <div className="space-y-0.5 text-left">
                <div className="flex items-center gap-1.5 flex-wrap">
                  <span className={`text-[11px] font-extrabold uppercase tracking-wider px-1.5 py-0.5 rounded ${
                    n.type === "urgent" ? "bg-rose-500/10 text-rose-400" :
                    n.type === "warning" ? "bg-amber-500/10 text-amber-400" :
                    "bg-cyan-500/10 text-cyan-400"
                  }`}>
                    {n.type === "urgent" ? "Urgent Risk" : n.type === "warning" ? "Schedule overlap" : "AI recommendation"}
                  </span>
                  <span className={`text-[11px] font-black tracking-tight ${isDarkMode ? "text-slate-100" : "text-slate-800"}`}>
                    {n.title}
                  </span>
                </div>
                <p className={`text-xs leading-relaxed font-semibold mt-1 ${isDarkMode ? "text-slate-300" : "text-slate-600"}`}>
                  {cleanTextOfIds(n.desc, tasks)}
                </p>
                {n.taskId && (
                  <span className={`text-[11px] font-bold block pt-1 hover:underline ${isDarkMode ? "text-cyan-400" : "text-indigo-600"}`}>
                    Tap to view details & strategy →
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* SECTION B — CONFLICT ALERT */}
      {triage.conflictDetection && triage.conflictDetection.length > 0 && (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.4, delay: 0.1 }}
          className={`mt-4 border rounded-2xl p-4 flex flex-col gap-3 shadow-sm transition-colors duration-300 ${
            isDarkMode ? "bg-amber-950/20 border-amber-900/40" : "bg-amber-50 border-amber-200"
          }`}
          id="conflict-alert"
        >
          <div className="flex gap-3">
            <div className="text-amber-500 shrink-0 mt-0.5">
              <AlertTriangle size={18} className="stroke-[2.5]" />
            </div>
            <div className="space-y-1">
              <h4 className={`text-[12px] font-bold uppercase tracking-wider ${isDarkMode ? "text-amber-400" : "text-amber-950"}`}>
                Schedule Conflict Detected
              </h4>
            </div>
          </div>
          <div className="space-y-3 mt-1 pl-1">
            {triage.conflictDetection.map((conflict: any, idx: number) => (
              <div key={idx} className={`text-xs space-y-1 border-l-2 pl-3 ${
                isDarkMode ? "border-amber-500/40" : "border-amber-400"
              }`}>
                <p className={`font-semibold leading-relaxed ${isDarkMode ? "text-slate-200" : "text-slate-800"}`}>
                  {cleanTextOfIds(conflict.description || "", tasks)}
                </p>
                {conflict.resolution && (
                  <p className={`text-[11px] leading-relaxed font-medium ${isDarkMode ? "text-amber-300/90" : "text-amber-700"}`}>
                    <span className="font-bold">💡 Resolution:</span> {cleanTextOfIds(conflict.resolution, tasks)}
                  </p>
                )}
              </div>
            ))}
          </div>
        </motion.div>
      )}

      {/* NEW FEATURE 2: COUNTDOWN TIMERS */}
      <div className={`mt-4 border rounded-2xl p-4 shadow-sm transition-colors duration-300 ${
        isDarkMode ? "bg-slate-800/60 border-slate-700" : "bg-white border-slate-200"
      }`} id="deadlines-approaching">
        <h4 className={`text-[12px] font-bold uppercase tracking-wider mb-3 flex items-center gap-1.5 ${
          isDarkMode ? "text-slate-200" : "text-slate-900"
        }`}>
          <Clock size={14} className="text-slate-400" /> Deadlines approaching
        </h4>
        <div className="space-y-2">
          {tasks.map((task) => {
            const countdown = getCountdownInfo(task);
            return (
              <div key={task.id} className={`flex items-center justify-between py-1.5 border-b last:border-0 text-xs transition-colors duration-300 ${
                isDarkMode ? "border-slate-800" : "border-slate-50"
              } ${task.isCompleted ? "opacity-60" : ""}`}>
                <div className="flex items-center gap-2 truncate pr-4">
                  <button
                    onClick={() => onToggleCompleteTask?.(task.id)}
                    className={`flex items-center justify-center rounded-full focus:outline-none transition-all duration-200 cursor-pointer shrink-0 ${
                      task.isCompleted 
                        ? "text-emerald-500 scale-105" 
                        : "text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"
                    }`}
                    title={task.isCompleted ? "Mark task incomplete" : "Mark task complete"}
                  >
                    {task.isCompleted ? (
                      <CheckCircle2 size={14} className="fill-emerald-500/10" />
                    ) : (
                      <Circle size={14} />
                    )}
                  </button>
                  <span className={`font-semibold truncate max-w-[240px] ${
                    task.isCompleted 
                      ? "line-through text-slate-500 dark:text-slate-500" 
                      : (isDarkMode ? "text-slate-300" : "text-slate-700")
                  }`}>
                    {task.name}
                  </span>
                </div>
                <span className={`shrink-0 font-mono text-[11px] ${task.isCompleted ? "text-emerald-500 font-bold" : countdown.color}`}>
                  {task.isCompleted ? "Completed" : countdown.text}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* SECTION C — PRIORITY STACK */}
      <div className="mt-6 space-y-3" id="priority-stack">
        <div className="flex items-center justify-between px-1">
          <h3 className={`font-display text-lg font-bold flex items-center gap-1.5 ${isDarkMode ? "text-white" : "text-slate-900"}`}>
            <Zap size={18} className="text-cyan-400 fill-cyan-400/20" />
            Priority Stack
          </h3>
          <span className={`text-[11px] font-bold uppercase tracking-widest px-2 py-0.5 rounded-md transition-colors duration-300 ${
            isDarkMode ? "bg-slate-800 text-slate-400" : "bg-slate-100 text-slate-400"
          }`}>
            Ranked 1–{triage.priorityStack.length}
          </span>
        </div>

        <div className="space-y-3">
          {triage.priorityStack.map((item, index) => {
            const task = resolveTask(item.taskId, tasks);
            const taskName = task ? task.name : `Task: ${item.taskId}`;
            const deadlineInfo = task ? formatDeadlineHuman(task.deadlineDate, task.deadlineTime) : "No deadline";
            const hoursNeeded = task ? `${task.hoursNeeded} hr${task.hoursNeeded === 1 ? "" : "s"}` : "0";
            
            // Survival Probability calculation
            const failurePrediction = triage.deadlineFailurePredictions.find((f) => {
              if (f.taskId === item.taskId || (task && f.taskId === task.id)) return true;
              const normF = f.taskId.replace("demo-task-", "task_").replace("demo-", "task_").replace("task-", "task_");
              const normItem = item.taskId.replace("demo-task-", "task_").replace("demo-", "task_").replace("task-", "task_");
              const normTask = task ? task.id.replace("demo-task-", "task_").replace("demo-", "task_").replace("task-", "task_") : "";
              return normF === normItem || (normTask && normF === normTask);
            });
            const failureProb = failurePrediction ? failurePrediction.failureProbability : 0.3;
            const survivabilityPct = Math.round((1 - failureProb) * 100);

            let probColor = "text-emerald-400";
            if (survivabilityPct < 40) {
              probColor = "text-rose-400 font-bold";
            } else if (survivabilityPct <= 70) {
              probColor = "text-amber-400 font-bold";
            } else {
              probColor = isDarkMode ? "text-emerald-400 font-bold" : "text-emerald-600 font-bold";
            }

            const countdownInfo = task ? getCountdownInfo(task) : null;
            const lvlColors = getRiskColors(item.statusColor || item.riskLevel);

            return (
              <motion.div
                key={item.taskId}
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: index * 0.05 }}
                className={`rounded-2xl p-3.5 shadow-sm relative overflow-hidden flex flex-col justify-between transition-all duration-300 ${
                  task?.isCompleted
                    ? (isDarkMode ? "bg-slate-950/40 border border-slate-900/50 opacity-60" : "bg-slate-50 border border-slate-100 opacity-65")
                    : (isDarkMode ? "bg-slate-900/50 border border-transparent" : "bg-white border border-slate-200")
                }`}
              >
                {/* Visual Rank Tag */}
                <div className={`absolute top-0 right-0 font-mono text-[11px] font-extrabold px-2.5 py-1 rounded-bl-xl ${
                  isDarkMode ? "bg-slate-750 text-cyan-400" : "bg-slate-900 text-white"
                }`}>
                  #{index + 1}
                </div>

                <div className="space-y-1.5 pr-10">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onToggleCompleteTask?.(item.taskId);
                      }}
                      className={`flex items-center justify-center rounded-full focus:outline-none transition-all duration-200 cursor-pointer shrink-0 ${
                        task?.isCompleted 
                          ? "text-emerald-500 scale-110" 
                          : "text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 hover:scale-105"
                      }`}
                      title={task?.isCompleted ? "Mark task incomplete" : "Mark task complete"}
                    >
                      {task?.isCompleted ? (
                        <CheckCircle2 size={18} className="fill-emerald-500/10" />
                      ) : (
                        <Circle size={18} />
                      )}
                    </button>
                    <span className="text-[13px]">{lvlColors.dot}</span>
                    <span className={`font-bold text-[15px] leading-snug transition-colors duration-300 ${
                      task?.isCompleted
                        ? "line-through text-slate-500 dark:text-slate-500"
                        : (isDarkMode ? "text-white" : "text-slate-900")
                    }`}>
                      {taskName}
                    </span>
                  </div>

                  <div className={`flex items-center gap-2.5 text-xs font-semibold flex-wrap transition-colors duration-300 ${isDarkMode ? "text-slate-400" : "text-slate-500"}`}>
                    <span className="flex items-center gap-0.5">
                      🗓 {deadlineInfo}
                    </span>
                    {task && (
                      <span className={`text-[11px] px-1 rounded border transition-colors duration-300 ${
                        isDarkMode 
                          ? `bg-slate-900/60 border-slate-800 ${countdownInfo?.color || "text-slate-400"}` 
                          : `bg-slate-50 border-slate-100 ${countdownInfo?.color || "text-slate-500"}`
                      }`}>
                        {getDueInString(task)}
                      </span>
                    )}
                    <span className="text-slate-600 dark:text-slate-700">•</span>
                    <span>
                      ⏱ {hoursNeeded} needed
                    </span>
                  </div>

                  {/* NEW FEATURE 3: SURVIVAL PROBABILITY */}
                  <div className="text-[11px] font-semibold flex items-center gap-1">
                    <span className="text-slate-400 font-normal">Survival Probability:</span>
                    <span className={probColor}>{survivabilityPct}% on-time</span>
                  </div>

                  {/* One-line AI recommendation */}
                  <p className={`text-xs p-2.5 rounded-lg border font-medium leading-relaxed mt-1 transition-colors duration-300 ${
                    isDarkMode 
                      ? "text-slate-300 bg-slate-900/60 border-slate-800/80" 
                      : "text-slate-600 bg-slate-50/80 border-slate-100"
                  }`}>
                    💡 <span className={`font-bold ${isDarkMode ? "text-cyan-400" : "text-indigo-600"}`}>Triage:</span> {cleanTextOfIds(item.rationale, tasks)}
                  </p>
                </div>

                {/* Card CTA Footer */}
                <div className={`flex flex-col gap-2 mt-3 pt-2.5 border-t transition-colors duration-300 ${isDarkMode ? "border-slate-750" : "border-slate-100"}`}>
                  <div className="flex items-center justify-between gap-2">
                    <button
                      onClick={() => onSelectTask(item.taskId)}
                      className={`h-9 px-3 text-[11px] font-bold uppercase tracking-wider rounded-lg flex items-center gap-1 transition-all cursor-pointer ${
                        isDarkMode 
                          ? "bg-slate-900 hover:bg-slate-750 text-slate-200 border border-slate-750" 
                          : "bg-slate-50 hover:bg-slate-100 active:bg-slate-200 text-slate-800"
                      }`}
                    >
                      <FileText size={13} className="text-slate-400" /> View Details
                    </button>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => onToggleCompleteTask?.(item.taskId)}
                        className={`h-9 px-3 text-[11px] font-bold uppercase tracking-wider rounded-lg flex items-center gap-1.5 transition-all cursor-pointer border ${
                          task?.isCompleted
                            ? (isDarkMode 
                                ? "bg-emerald-950/30 text-emerald-400 border-emerald-900/50 hover:bg-emerald-900/40" 
                                : "bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100")
                            : (isDarkMode 
                                ? "bg-slate-900 hover:bg-slate-750 text-slate-300 border-slate-750 hover:border-slate-600" 
                                : "bg-slate-50 hover:bg-slate-100 text-slate-700 border-slate-200 hover:border-slate-300")
                        }`}
                      >
                        {task?.isCompleted ? (
                          <>
                            <CheckCircle2 size={13} className="text-emerald-500 fill-emerald-500/10" /> Completed
                          </>
                        ) : (
                          <>
                            <Circle size={13} className="text-slate-400" /> Mark Done
                          </>
                        )}
                      </button>

                      {item.sacrificeRecommended && (
                        <button
                          onClick={() => onOpenDraftModal(item.taskId)}
                          className={`h-9 px-3.5 text-[11px] font-bold uppercase tracking-wider rounded-lg flex items-center gap-1.5 transition-all cursor-pointer animate-pulse ${
                            isDarkMode 
                              ? "bg-amber-950/40 text-amber-300 border border-amber-900/50 hover:bg-amber-900/60" 
                              : "bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-200 hover:border-amber-300"
                          }`}
                        >
                          <Send size={12} /> Draft Message
                        </button>
                      )}
                    </div>
                  </div>

                  {/* NEW FEATURE 5: "WHAT IF I SKIP?" BUTTON */}
                  {item.sacrificeRecommended && (
                    <div className="mt-1 flex flex-col gap-1.5">
                      <button
                        disabled={whatIfLoading[item.taskId]}
                        onClick={() => handleWhatIfSkip(item.taskId)}
                        className={`w-full h-8 text-[11px] font-bold uppercase tracking-wider rounded-lg flex items-center justify-center gap-1 transition-all cursor-pointer disabled:opacity-75 ${
                          isDarkMode 
                            ? "bg-slate-900 hover:bg-slate-750 border border-slate-750 text-slate-300" 
                            : "bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-700"
                        }`}
                      >
                        {whatIfLoading[item.taskId] ? (
                          <span className="flex items-center gap-1">
                            <RefreshCw size={10} className="animate-spin" /> Calculating...
                          </span>
                        ) : (
                          "What if I skip this?"
                        )}
                      </button>

                      {/* Result Banner */}
                      <AnimatePresence>
                        {whatIfResult[item.taskId] !== undefined && (
                          <motion.div
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: "auto" }}
                            exit={{ opacity: 0, height: 0 }}
                            transition={{ duration: 0.25, ease: "easeInOut" }}
                            className="overflow-hidden"
                          >
                            <div className={`text-[11px] p-2.5 rounded-lg text-center font-bold leading-relaxed border mt-1.5 ${
                              whatIfResult[item.taskId].isLower 
                                ? (isDarkMode ? "bg-emerald-950/30 text-emerald-400 border-emerald-900/40" : "bg-green-50/60 text-green-800 border-green-200") 
                                : (isDarkMode ? "bg-amber-950/20 text-amber-300 border-amber-800/40" : "bg-amber-50/60 text-amber-800 border-amber-200")
                            }`}>
                              💡 Skipping this drops your risk to <span className="font-extrabold">{whatIfResult[item.taskId].newScore}/100</span>
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  )}
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>

      {/* SECTION D — RESCUE PLAN */}
      <div className="mt-8 space-y-4 animate-fade-in h-auto overflow-visible" id="rescue-plan">
        <h3 className={`font-display text-lg font-bold flex items-center gap-1.5 ${isDarkMode ? "text-white" : "text-slate-900"}`}>
          <Sparkles size={18} className="text-cyan-400" />
          Rescue Plan Timeline
        </h3>

        <div className={`border rounded-2xl p-5 shadow-sm space-y-4 transition-colors duration-300 h-auto overflow-visible ${
          isDarkMode ? "bg-slate-800/60 border-slate-700" : "bg-white border-slate-200"
        }`}>
          <p className={`text-xs leading-relaxed font-semibold transition-colors duration-300 ${isDarkMode ? "text-slate-300" : "text-slate-500"}`}>
            {capitalizeTimelineTitle(cleanTextOfIds(triage.rescuePlan.summary, tasks))}
          </p>

          <div className="relative border-l-2 border-slate-200 dark:border-slate-750 pl-4 ml-2.5 space-y-5 py-2 h-auto overflow-visible">
            {triage.rescuePlan.timeBlocks.map((block, idx) => {
              const task = resolveTask(block.taskId, tasks);
              const taskName = task ? task.name : `Task: ${block.taskId}`;
              
              // Find priority status to color the left border accent
              const priorityItem = triage.priorityStack.find((p) => p.taskId === block.taskId);
              const lvlColors = getRiskColors(priorityItem?.statusColor || "safe");

              return (
                <div key={idx} className="relative">
                  {/* Timeline dot */}
                  <div className={`absolute -left-[23px] top-1.5 w-2.5 h-2.5 rounded-full border-2 transition-colors duration-300 ${
                    isDarkMode ? "border-slate-800" : "border-white"
                  } ${lvlColors.accent}`} />

                  <div className="space-y-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className={`text-[11px] font-mono font-bold uppercase tracking-widest px-1.5 py-0.5 rounded transition-colors duration-300 ${
                        isDarkMode ? "bg-slate-900 text-slate-400" : "bg-slate-100 text-slate-400"
                      }`}>
                        {formatTimeTo12Hour(block.startTime)} - {formatTimeTo12Hour(block.endTime)}
                      </span>
                      {isAfter9PM(block.endTime) && (
                        <span className="text-[11px] font-bold text-amber-500 bg-amber-500/10 dark:bg-amber-500/20 px-1.5 py-0.5 rounded flex items-center gap-1">
                          ⚠ Late session — only if necessary
                        </span>
                      )}
                    </div>
                    
                    <h5 className={`font-bold text-sm flex items-center gap-1.5 mt-1 transition-colors duration-300 ${isDarkMode ? "text-white" : "text-slate-900"}`}>
                      {capitalizeTimelineTitle(taskName)}
                    </h5>
                    
                    <p className={`text-xs leading-relaxed transition-colors duration-300 ${isDarkMode ? "text-slate-400" : "text-slate-500"}`}>
                      {capitalizeTimelineTitle(generateTimeBlockAction(block, task, tasks))}
                    </p>

                    {block.isNonNegotiable && (
                      <span className="text-[11px] text-rose-400 font-bold mt-1 flex items-center gap-1">
                        🔒 Non-negotiable
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {calendarConnected && (
            <div className="pt-4 border-t dark:border-slate-750 border-slate-100 flex flex-col gap-2">
              <motion.button
                whileHover={saveStatus === 'idle' || saveStatus === 'error' ? { scale: 1.01 } : {}}
                whileTap={saveStatus === 'idle' || saveStatus === 'error' ? { scale: 0.99 } : {}}
                disabled={saveStatus === 'saving' || saveStatus === 'success'}
                onClick={handleSaveToCalendar}
                className={`w-full h-11 text-xs uppercase tracking-wider font-extrabold rounded-xl flex items-center justify-center gap-2 transition-all cursor-pointer shadow border ${
                  saveStatus === 'success'
                    ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-400 cursor-default shadow-none"
                    : saveStatus === 'saving'
                      ? "bg-slate-800 border-slate-700 text-slate-400 cursor-wait shadow-none"
                      : isDarkMode
                        ? "bg-emerald-500 hover:bg-emerald-400 text-slate-950 border-emerald-400 shadow-emerald-500/10"
                        : "bg-emerald-600 hover:bg-emerald-700 text-white border-emerald-600 shadow-emerald-600/10"
                }`}
              >
                {saveStatus === 'saving' ? (
                  <>
                    <RefreshCw size={14} className="animate-spin" />
                    Saving blocks...
                  </>
                ) : saveStatus === 'success' ? (
                  <>
                    <span>✅ Rescue Plan Synced!</span>
                  </>
                ) : (
                  <>
                    <span>📅 Save Rescue Plan to Google Calendar</span>
                  </>
                )}
              </motion.button>
              {saveStatus === 'error' && (
                <p className="text-[11px] font-bold text-rose-500 text-center">
                  ⚠ {saveError || "Failed to sync with Google Calendar."}
                </p>
              )}
            </div>
          )}
        </div>
      </div>

      {/* SECTION E — QUICK ACTIONS */}
      <div className="mt-10 grid grid-cols-2 gap-3" id="quick-actions">
        <button
          onClick={onBackToIntake}
          className={`h-11 font-semibold rounded-xl flex items-center justify-center gap-1.5 transition-all text-xs uppercase tracking-wider cursor-pointer border ${
            isDarkMode 
              ? "bg-slate-800 border-slate-700 text-slate-100 hover:bg-slate-700" 
              : "bg-slate-100 hover:bg-slate-200 border-slate-200/40 text-slate-800"
          }`}
        >
          <Edit3 size={15} /> Add/Edit Tasks
        </button>

        <button
          onClick={onReAnalyze}
          className={`h-11 font-semibold rounded-xl flex items-center justify-center gap-1.5 transition-all text-xs uppercase tracking-wider cursor-pointer ${
            isDarkMode
              ? "bg-gradient-to-r from-cyan-600 to-indigo-600 hover:from-cyan-500 hover:to-indigo-500 text-white"
              : "bg-gradient-to-r from-indigo-600 to-indigo-500 text-white hover:from-indigo-750 hover:to-indigo-650 shadow"
          }`}
        >
          <RefreshCw size={15} className="animate-spin-slow" /> Re-analyze
        </button>
      </div>
    </div>
  );
}
