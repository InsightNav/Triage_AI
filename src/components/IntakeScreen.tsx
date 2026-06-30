import React, { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Plus, Trash2, Calendar, Clock, Sparkles, Sun, Moon } from "lucide-react";
import { Task } from "../types";

interface IntakeScreenProps {
  isDarkMode: boolean;
  onToggleDarkMode: () => void;
  tasks: Task[];
  onAddTask: (task: Task) => void;
  onDeleteTask: (id: string) => void;
  onActivatePanic: () => void;
  onBack: () => void;
  calendarConnected?: boolean;
  freeSlots?: any[];
  busySlots?: any[];
  onDisconnectCalendar?: () => void;
  isDemoMode?: boolean;
  onLoadDemo?: () => void;
  onToggleCompleteTask?: (id: string) => void;
  onClearAllTasks?: () => void;
  onShowToast?: (message: string, type: "success" | "error" | "info") => void;
  onConnectCalendarClick?: () => void;
}

export default function IntakeScreen({
  isDarkMode,
  onToggleDarkMode,
  tasks,
  onAddTask,
  onDeleteTask,
  onActivatePanic,
  onBack,
  calendarConnected = false,
  freeSlots = [],
  busySlots = [],
  onDisconnectCalendar,
  isDemoMode = false,
  onLoadDemo,
  onToggleCompleteTask,
  onClearAllTasks,
  onShowToast,
  onConnectCalendarClick,
}: IntakeScreenProps) {
  // Local state for Completed section & confirmations
  const [isCompletedCollapsed, setIsCompletedCollapsed] = useState(true);
  const [showClearConfirm, setShowClearConfirm] = useState(false);

  const activeTasks = tasks.filter(t => !t.isCompleted);
  const completedTasks = tasks.filter(t => t.isCompleted);

  // Local state for the current task form
  const [name, setName] = useState("");
  const [deadlineDate, setDeadlineDate] = useState(() => {
    const today = new Date();
    const yyyy = today.getFullYear();
    const mm = String(today.getMonth() + 1).padStart(2, '0');
    const dd = String(today.getDate()).padStart(2, '0');
    return `${yyyy}-${mm}-${dd}`;
  });
  const [deadlineTime, setDeadlineTime] = useState("17:00");
  const [hoursNeeded, setHoursNeeded] = useState<number>(2);
  const [category, setCategory] = useState<Task["category"]>("Work");
  const [importance, setImportance] = useState<Task["importance"]>("High");
  const [blocksOthers, setBlocksOthers] = useState(false);

  // Error feedback helper
  const [errorMsg, setErrorMsg] = useState("");

  // Helpers for advanced date/time UI UX presets & dynamic text
  const getDateOffset = (days: number) => {
    const d = new Date();
    d.setDate(d.getDate() + days);
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const dd = String(d.getDate()).padStart(2, '0');
    return `${yyyy}-${mm}-${dd}`;
  };

  const getDayNameForOffset = (days: number) => {
    const d = new Date();
    d.setDate(d.getDate() + days);
    return d.toLocaleDateString("en-US", { weekday: "long" });
  };

  const formatTimeTo12h = (time24: string) => {
    if (!time24) return "";
    const [hrsStr, minsStr] = time24.split(":");
    let hrs = parseInt(hrsStr, 10);
    if (isNaN(hrs)) return time24;
    const ampm = hrs >= 12 ? "PM" : "AM";
    hrs = hrs % 12;
    hrs = hrs ? hrs : 12;
    return `${hrs}:${minsStr} ${ampm}`;
  };

  const getRelativeDueText = () => {
    if (!deadlineDate || !deadlineTime) return "";
    try {
      const target = new Date(`${deadlineDate}T${deadlineTime}`);
      if (isNaN(target.getTime())) return "";
      const now = new Date();
      const diffMs = target.getTime() - now.getTime();
      
      const dayName = target.toLocaleDateString("en-US", { weekday: "long" });
      const formattedTime = formatTimeTo12h(deadlineTime);

      if (diffMs < 0) {
        return `⚠️ Deadline is in the past (${dayName} at ${formattedTime})`;
      }
      
      const diffMins = Math.floor(diffMs / (1000 * 60));
      const diffHours = Math.floor(diffMins / 60);
      const diffDays = Math.floor(diffHours / 24);
      
      if (diffDays === 0) {
        if (diffHours === 0) {
          return `⏱️ Due today in ${diffMins} mins (${dayName} at ${formattedTime})`;
        }
        return `⏱️ Due today in ${diffHours} hrs (${dayName} at ${formattedTime})`;
      } else if (diffDays === 1) {
        return `⏱️ Due Tomorrow in ${diffHours} hrs (${dayName} at ${formattedTime})`;
      } else {
        return `⏱️ Due in ${diffDays} days (${dayName} at ${formattedTime})`;
      }
    } catch (e) {
      return "";
    }
  };

  const handleAddTaskClick = (e: React.FormEvent) => {
    e.preventDefault();
    if (isDemoMode) {
      if (onShowToast) {
        onShowToast("Exit demo mode to add your own tasks", "error");
      }
      return;
    }
    if (!name.trim()) {
      setErrorMsg("Please enter a task name.");
      return;
    }
    if (!deadlineDate) {
      setErrorMsg("Please select a deadline date.");
      return;
    }
    if (!deadlineTime) {
      setErrorMsg("Please select a deadline time.");
      return;
    }

    const newTask: Task = {
      id: "task-" + Date.now() + Math.random().toString(36).substr(2, 4),
      name: name.trim(),
      deadlineDate,
      deadlineTime,
      hoursNeeded,
      category,
      importance,
      blocksOthers,
    };

    onAddTask(newTask);
    
    // Reset form fields for next task
    setName("");
    setBlocksOthers(false);
    setErrorMsg("");
  };

  const hourOptions = [0.5, 1, 2, 3, 5, 8];
  const categories: { name: Task["category"]; icon: string; color: string; darkColor: string }[] = [
    { name: "Work", icon: "💼", color: "border-blue-205 text-blue-700 bg-blue-50/50", darkColor: "border-blue-900/40 text-blue-400 bg-blue-950/40" },
    { name: "School", icon: "🎓", color: "border-purple-205 text-purple-700 bg-purple-50/50", darkColor: "border-purple-900/40 text-purple-400 bg-purple-950/40" },
    { name: "Finance", icon: "💳", color: "border-emerald-205 text-emerald-700 bg-emerald-50/50", darkColor: "border-emerald-900/40 text-emerald-400 bg-emerald-950/40" },
    { name: "Personal", icon: "👤", color: "border-pink-205 text-pink-700 bg-pink-50/50", darkColor: "border-pink-900/40 text-pink-400 bg-pink-950/40" },
  ];

  return (
    <div className={`flex flex-col min-h-screen px-4 pb-28 font-sans relative overflow-hidden transition-colors duration-300 ${isDarkMode ? "bg-slate-900 text-slate-100" : "bg-white text-slate-900"}`} id="intake-screen">
      
      {/* Background radial gradient */}
      <div className={`absolute top-0 right-0 w-64 h-64 rounded-full blur-3xl pointer-events-none z-0 transition-opacity duration-300 ${
        isDarkMode ? "bg-cyan-950/10 opacity-60" : "bg-indigo-50/40 opacity-80"
      }`} />

      {/* Header Navigation */}
      <div className={`flex items-center justify-between py-5 border-b z-10 transition-colors duration-300 ${isDarkMode ? "border-slate-800" : "border-slate-100"}`}>
        <div className="flex items-center gap-3">
          <motion.button 
            whileHover={{ x: -2 }}
            whileTap={{ scale: 0.95 }}
            onClick={onBack}
            className={`text-sm font-bold transition-colors cursor-pointer flex items-center gap-1 ${
              isDarkMode ? "text-slate-400 hover:text-slate-200" : "text-slate-500 hover:text-slate-800"
            }`}
          >
            ← Back
          </motion.button>
          {calendarConnected && onDisconnectCalendar && (
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={onDisconnectCalendar}
              className={`text-[11px] font-extrabold uppercase tracking-widest px-2.5 py-1 rounded-lg border transition-all cursor-pointer flex items-center gap-1.5 ${
                isDarkMode 
                  ? "bg-slate-800/60 border-slate-700/80 hover:bg-rose-950/40 hover:border-rose-900/40 text-slate-400 hover:text-rose-400" 
                  : "bg-slate-50 border-slate-200 hover:bg-rose-50 hover:border-rose-200 text-slate-500 hover:text-rose-600"
              }`}
            >
              Disconnect Calendar
            </motion.button>
          )}
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5">
            <span className={`font-display font-black text-base uppercase transition-colors duration-300 ${isDarkMode ? "text-slate-100" : "text-slate-900"}`}>
              Triage<span className={isDarkMode ? "text-cyan-400" : "text-indigo-600"}>AI</span>
            </span>
            <span className="text-sm">⚡</span>
          </div>

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

      {/* Today's Schedule Strip */}
      {calendarConnected ? (
        <div className={`mt-6 p-4 rounded-2xl border transition-colors duration-300 z-10 text-left ${
          isDarkMode ? "bg-slate-800/50 border-slate-700" : "bg-[#f0f4f8] border-slate-200"
        }`} id="calendar-today-schedule">
          <div className="flex items-center justify-between mb-3">
            <span className={`text-[12px] font-bold uppercase tracking-wider flex items-center gap-1.5 ${
              isDarkMode ? "text-cyan-400" : "text-[#111827]"
            }`}>
              📅 Today's Schedule
            </span>
            <span className={`text-[11px] font-mono font-bold px-2 py-0.5 rounded border ${
              isDarkMode ? "bg-slate-900 border-slate-800 text-slate-400" : "bg-white border-slate-200 text-[#111827]"
            }`}>
              Available: <span className="font-extrabold">{((freeSlots || []).reduce((sum, s) => sum + s.durationMinutes, 0) / 60).toFixed(1).replace(".0", "")} hrs</span>
            </span>
          </div>

          {/* Horizontal Bar Visualization: 8 AM to 8 PM (12 segments) */}
          <div className="flex w-full gap-0.5 rounded-lg overflow-hidden h-6 mb-3 border dark:border-slate-800 border-slate-200/50">
            {Array.from({ length: 12 }, (_, i) => 8 + i).map((hour) => {
              // Convert hour to minutes of the day
              const hrStart = hour * 60;
              const hrEnd = (hour + 1) * 60;
              
              const isBusy = (busySlots || []).some(slot => {
                const [sHr, sMin] = slot.start.split(":").map(Number);
                const [eHr, eMin] = slot.end.split(":").map(Number);
                const slotStart = sHr * 60 + sMin;
                const slotEnd = eHr * 60 + eMin;
                return slotStart < hrEnd && slotEnd > hrStart;
              });

              const label = hour % 12 === 0 ? "12PM" : hour > 12 ? `${hour - 12}PM` : `${hour}AM`;

              const currentHour = new Date().getHours();
              const isCurrentHour = hour === currentHour;

              let cellBgClass = "";
              let cellTextClass = "";

              if (isDarkMode) {
                cellBgClass = isBusy ? "bg-rose-500/80" : "bg-emerald-500/80";
                cellTextClass = "text-white";
              } else {
                if (isBusy) {
                  cellBgClass = isCurrentHour ? "bg-[#fecaca]" : "bg-[#fee2e2]";
                  cellTextClass = "text-[#dc2626]";
                } else {
                  cellBgClass = isCurrentHour ? "bg-[#bbf7d0]" : "bg-[#dcfce7]";
                  cellTextClass = "text-[#15803d]";
                }
              }

              return (
                <div
                  key={hour}
                  className={`flex-1 flex flex-col justify-center items-center text-[11px] font-black transition-colors ${cellBgClass} ${cellTextClass}`}
                  title={`${label}: ${isBusy ? "Busy" : "Free"}`}
                >
                  <span className="opacity-80 scale-90">{hour % 12 === 0 ? "12" : hour > 12 ? String(hour - 12) : String(hour)}</span>
                </div>
              );
            })}
          </div>

          {/* Timeline of events and free gaps */}
          <div className={`space-y-1 max-h-[145px] overflow-y-auto pr-1 ${
            isDarkMode 
              ? "" 
              : "[&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-track]:bg-[#f1f5f9] [&::-webkit-scrollbar-thumb]:bg-[#cbd5e1] [&::-webkit-scrollbar-thumb]:rounded-full"
          }`}>
            {[
              ...(busySlots || []).map(s => ({ ...s, type: "busy" as const })),
              ...(freeSlots || []).map(s => ({ ...s, type: "free" as const, title: "FREE" }))
            ].sort((a, b) => {
              const t1 = a.start.split(":").map(Number).reduce((h, m) => h * 60 + m);
              const t2 = b.start.split(":").map(Number).reduce((h, m) => h * 60 + m);
              return t1 - t2;
            }).map((item, idx) => {
              const startDisplay = (() => {
                const [h, m] = item.start.split(":").map(Number);
                const ampm = h >= 12 ? "PM" : "AM";
                const displayH = h % 12 === 0 ? 12 : h % 12;
                return `${displayH}${m > 0 ? `:${String(m).padStart(2, "0")}` : ""}${ampm}`;
              })();

              const endDisplay = (() => {
                const [h, m] = item.end.split(":").map(Number);
                const ampm = h >= 12 ? "PM" : "AM";
                const displayH = h % 12 === 0 ? 12 : h % 12;
                return `${displayH}${m > 0 ? `:${String(m).padStart(2, "0")}` : ""}${ampm}`;
              })();

              const isTriageEvent = item.title && (item.title.startsWith("[ResQ]") || item.title.includes("[ResQ]"));
              const cleanTitle = item.title ? item.title.replace(/^\[[^\]]+\]\s*/, "") : "";

              return (
                <div key={idx} className={`flex items-center justify-between text-xs py-0.5 px-2 rounded-lg border transition-colors ${
                  isDarkMode 
                    ? "dark:border-slate-800/40 bg-white/20 dark:bg-slate-900/20" 
                    : item.type === "free"
                      ? "bg-[#f0fdf4] border-emerald-100" 
                      : "bg-[#fff1f2] border-rose-100"
                }`}>
                  <div className="flex items-center gap-2 min-w-0 flex-1">
                    <span className={`font-mono text-[9px] font-bold shrink-0 ${
                      isDarkMode ? "text-slate-400" : "text-[#374151]"
                    }`}>
                      {startDisplay} - {endDisplay}
                    </span>
                    <span className={`font-bold shrink-0 text-[11px] ${
                      item.type === "busy" 
                        ? (isDarkMode ? "text-rose-400" : "text-[#dc2626]") 
                        : (isDarkMode ? "text-emerald-400" : "text-[#15803d]")
                    }`}>
                      {item.type === "busy" ? "██ Busy" : "░░ Free"}
                    </span>
                    {item.type === "busy" && item.title && (
                      <div className="flex items-center gap-1.5 min-w-0">
                        <span className={`text-[11px] truncate max-w-[120px] ${
                          isDarkMode ? "opacity-75 text-white" : "text-[#374151] font-medium"
                        }`} title={cleanTitle}>
                          ({cleanTitle})
                        </span>
                        {isTriageEvent && (
                          <span className={`inline-flex items-center px-1 py-0.5 rounded text-[9px] font-bold tracking-tight shrink-0 ${
                            isDarkMode 
                              ? "bg-cyan-500/15 text-cyan-400 border border-cyan-500/25" 
                              : "bg-indigo-100 text-indigo-800 border border-indigo-200"
                          }`}>
                            🔒 TriageAI
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                  <span className={`font-mono text-[9px] font-bold shrink-0 ${
                    isDarkMode 
                      ? "text-slate-400" 
                      : item.type === "free" 
                        ? "text-[#166534]" 
                        : "text-[#6b7280]"
                  }`}>
                    {item.durationMinutes >= 60 
                      ? `${(item.durationMinutes / 60).toFixed(1).replace(".0", "")} hr${item.durationMinutes === 60 ? "" : "s"}`
                      : `${item.durationMinutes} min`
                    }
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      ) : (
        onConnectCalendarClick && (
          <div className={`mt-6 p-4 rounded-2xl border transition-colors duration-300 z-10 text-left flex items-center justify-between gap-4 ${
            isDarkMode ? "bg-slate-900/50 border-slate-800" : "bg-slate-50 border-slate-200"
          }`} id="calendar-unconnected-strip">
            <div className="flex items-center gap-3">
              <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${
                isDarkMode ? "bg-indigo-500/10 text-cyan-400 border border-indigo-500/20" : "bg-indigo-50 text-indigo-600 border border-indigo-150"
              }`}>
                <Calendar size={14} className="animate-pulse" />
              </div>
              <div className="space-y-0.5">
                <p className={`text-[11px] font-black uppercase tracking-wider ${isDarkMode ? "text-slate-300" : "text-slate-700"}`}>
                  Google Calendar Sync
                </p>
                <p className={`text-[11px] leading-relaxed ${isDarkMode ? "text-slate-500" : "text-slate-500"}`}>
                  Allow Google Calendar access to detect conflicts & plan focus blocks.
                </p>
              </div>
            </div>
            <button
              onClick={onConnectCalendarClick}
              type="button"
              className={`px-3 py-1.5 rounded-lg text-[11px] font-black uppercase tracking-wider cursor-pointer shrink-0 transition-all duration-200 ${
                isDarkMode 
                  ? "bg-indigo-600 border-indigo-500 hover:bg-indigo-500 text-white" 
                  : "bg-indigo-600 border-indigo-600 hover:bg-indigo-700 text-white"
              }`}
            >
              Allow Access
            </button>
          </div>
        )
      )}

      <div className="mt-6 z-10">
        <div className="flex items-center justify-between mb-2">
          <h2 className={`font-display text-2xl font-black tracking-tight ${isDarkMode ? "text-white" : "text-slate-900"}`}>
            WHAT ARE YOU JUGGLING?
          </h2>
          <motion.span 
            key={tasks.length}
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            id="task-counter-badge" 
            className={`text-xs font-black px-3 py-1 rounded-full border shadow-sm transition-colors duration-300 ${
              isDarkMode 
                ? "bg-cyan-950/40 border-cyan-800 text-cyan-400" 
                : "bg-indigo-50 border-indigo-100 text-indigo-600"
            }`}
          >
            {tasks.length} {tasks.length === 1 ? "task" : "tasks"}
          </motion.span>
        </div>
        <p className={`text-xs font-medium leading-relaxed max-w-[400px] ${isDarkMode ? "text-slate-400" : "text-slate-500"}`}>
          Input your looming commitments and backlog tasks. Our AI engine will run stress simulations and build an optimal triage plan.
        </p>
      </div>

      {/* Task Creation Form */}
      <motion.form
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1, duration: 0.4 }}
        onSubmit={handleAddTaskClick}
        className={`mt-6 border rounded-2xl p-4 space-y-4 shadow-sm z-10 transition-colors duration-300 ${
          isDarkMode ? "bg-slate-800/40 border-slate-700" : "bg-slate-50/30 border-slate-200/80"
        }`}
        id="task-intake-form"
      >
        {isDemoMode && (
          <div className={`p-3 rounded-xl border flex items-center gap-2 font-bold text-xs ${
            isDarkMode 
              ? "bg-indigo-950/40 border-indigo-900/40 text-[#c4b5fd]" 
              : "bg-[#EEF2FF] border-[#C7D2FE] text-[#4338CA]"
          }`} id="demo-not-editable-banner">
            <span>💡</span> Demo tasks — not editable
          </div>
        )}

        {/* Task Name */}
        <div>
          <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">
            Task Title
          </label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            disabled={isDemoMode}
            placeholder={isDemoMode ? "Demo mode - not editable" : "e.g., Deliver Board Presentation slides"}
            className={`w-full h-11 px-3.5 rounded-xl border text-sm font-medium transition-all duration-300 focus:outline-none focus:ring-1 ${
              isDarkMode 
                ? "bg-slate-800 border-slate-700 text-white placeholder-slate-500 focus:bg-slate-800 focus:border-cyan-500 focus:ring-cyan-500/30" 
                : "bg-white border-slate-200 text-slate-900 placeholder-slate-400 focus:border-indigo-500 focus:ring-indigo-500/20 shadow-inner"
            }`}
          />
        </div>

        {/* Deadline Date & Time */}
        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-3.5">
            <div>
              <div className="flex justify-between items-center mb-1">
                <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-widest">
                  Deadline Date
                </label>
              </div>
              
              {/* Quick Date Presets */}
              <div className="flex gap-1 mb-1.5 flex-wrap">
                {[
                  { label: "Today", offset: 0 },
                  { label: "Tomorrow", offset: 1 },
                  { label: getDayNameForOffset(2), offset: 2 }
                ].map(p => {
                  const targetDate = getDateOffset(p.offset);
                  const isSelected = deadlineDate === targetDate;
                  return (
                    <button
                      key={p.label}
                      type="button"
                      onClick={() => setDeadlineDate(targetDate)}
                      className={`text-[11px] px-2 py-0.5 rounded font-bold border transition-all cursor-pointer shrink-0 ${
                        isSelected
                          ? (isDarkMode ? "bg-cyan-500/10 border-cyan-400 text-cyan-400 shadow-sm" : "bg-indigo-50 border-indigo-500 text-indigo-700 font-extrabold")
                          : (isDarkMode ? "bg-slate-800 border-slate-700/80 text-slate-400 hover:text-slate-200" : "bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100")
                      }`}
                    >
                      {p.label}
                    </button>
                  );
                })}
              </div>

              <div className="relative">
                <Calendar size={13} className={`absolute left-3.5 top-1/2 -translate-y-1/2 ${isDarkMode ? "text-slate-500" : "text-slate-400"}`} />
                <input
                  type="date"
                  value={deadlineDate}
                  onChange={(e) => setDeadlineDate(e.target.value)}
                  className={`w-full h-11 pl-9 pr-3 rounded-xl border text-sm font-medium transition-all duration-300 focus:outline-none focus:ring-1 ${
                    isDarkMode 
                      ? "bg-slate-800 border-slate-700 text-white focus:border-cyan-500 focus:ring-cyan-500/30" 
                      : "bg-white border-slate-200 text-slate-900 focus:border-indigo-500 focus:ring-indigo-500/20 shadow-inner"
                  }`}
                />
              </div>
            </div>

            <div>
              <div className="flex justify-between items-center mb-1">
                <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-widest">
                  Deadline Time
                </label>
              </div>

              {/* Quick Time Presets */}
              <div className="flex gap-1 mb-1.5 overflow-x-auto pb-1 whitespace-nowrap">
                {[
                  { label: "9 AM", val: "09:00" },
                  { label: "11 AM", val: "11:00" },
                  { label: "12 PM", val: "12:00" },
                  { label: "2 PM", val: "14:00" },
                  { label: "3 PM", val: "15:00" },
                  { label: "5 PM", val: "17:00" },
                  { label: "6 PM", val: "18:00" },
                  { label: "9 PM", val: "21:00" },
                  { label: "11 PM", val: "23:00" }
                ].map(p => {
                  const isSelected = deadlineTime === p.val;
                  return (
                    <button
                      key={p.label}
                      type="button"
                      onClick={() => setDeadlineTime(p.val)}
                      className={`text-[11px] px-1.5 py-0.5 rounded font-bold border transition-all cursor-pointer shrink-0 ${
                        isSelected
                          ? (isDarkMode ? "bg-cyan-500/10 border-cyan-400 text-cyan-400 shadow-sm" : "bg-indigo-50 border-indigo-500 text-indigo-700 font-extrabold")
                          : (isDarkMode ? "bg-slate-800 border-slate-700/80 text-slate-400 hover:text-slate-200" : "bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100")
                      }`}
                    >
                      {p.label}
                    </button>
                  );
                })}
              </div>

              <div className="relative">
                <Clock size={13} className={`absolute left-3.5 top-1/2 -translate-y-1/2 ${isDarkMode ? "text-slate-500" : "text-slate-400"}`} />
                <input
                  type="time"
                  value={deadlineTime}
                  onChange={(e) => setDeadlineTime(e.target.value)}
                  className={`w-full h-11 pl-9 pr-3 rounded-xl border text-sm font-medium transition-all duration-300 focus:outline-none focus:ring-1 ${
                    isDarkMode 
                      ? "bg-slate-800 border-slate-700 text-white focus:border-cyan-500 focus:ring-cyan-500/30" 
                      : "bg-white border-slate-200 text-slate-900 focus:border-indigo-500 focus:ring-indigo-500/20 shadow-inner"
                  }`}
                />
              </div>
            </div>
          </div>

          {/* Real-time relative duration text */}
          {deadlineDate && deadlineTime && (
            <div className={`text-[11px] font-bold px-3 py-1.5 rounded-lg text-center transition-all ${
              isDarkMode ? "bg-slate-900/60 text-cyan-400" : "bg-slate-50 text-indigo-700"
            }`}>
              {getRelativeDueText()}
            </div>
          )}
        </div>

        {/* Estimated Duration selector */}
        <div>
          <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">
            ESTIMATED EFFORT (Hours)
          </label>
          <div className="grid grid-cols-6 gap-1.5">
            {hourOptions.map((val) => (
              <motion.button
                whileHover={{ y: -1 }}
                whileTap={{ scale: 0.95 }}
                key={val}
                type="button"
                onClick={() => setHoursNeeded(val)}
                className={`h-9 text-xs font-bold rounded-lg flex items-center justify-center border transition-all cursor-pointer ${
                  hoursNeeded === val
                    ? (isDarkMode 
                      ? "bg-cyan-500 text-slate-950 border-cyan-400 shadow-cyan-500/20 shadow" 
                      : "bg-slate-900 text-white border-slate-950 shadow-sm")
                    : (isDarkMode 
                      ? "bg-slate-800 text-slate-300 border-slate-700 hover:bg-slate-700 hover:border-slate-600" 
                      : "bg-slate-50/60 text-slate-700 border-slate-200 hover:bg-slate-100 hover:border-slate-300")
                }`}
              >
                {val === 0.5 ? "30m" : `${val}h`}
              </motion.button>
            ))}
          </div>
        </div>

        {/* Category Chips */}
        <div>
          <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-widest mb-2">
            Context Category
          </label>
          <div className="flex flex-wrap gap-2">
            {categories.map((cat) => {
              const isSelected = category === cat.name;
              return (
                <motion.button
                  whileHover={{ y: -1 }}
                  whileTap={{ scale: 0.95 }}
                  key={cat.name}
                  type="button"
                  onClick={() => setCategory(cat.name)}
                  className={`px-3 py-1.5 text-xs font-bold rounded-full border transition-all flex items-center gap-1 cursor-pointer ${
                    isSelected
                      ? (isDarkMode 
                        ? "bg-cyan-500 text-slate-950 border-cyan-400 shadow-sm" 
                        : "bg-slate-900 text-white border-slate-900 shadow-sm")
                      : (isDarkMode 
                        ? "bg-slate-850 text-slate-300 border-slate-700/80 hover:bg-slate-800" 
                        : "bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100 hover:border-slate-300")
                  }`}
                >
                  <span>{cat.icon}</span>
                  <span>{cat.name}</span>
                </motion.button>
              );
            })}
          </div>
        </div>

        {/* Grid Row for Importance and Blocks Others */}
        <div className={`grid grid-cols-2 gap-4 pt-4 border-t transition-colors duration-300 ${isDarkMode ? "border-slate-800" : "border-slate-100"}`}>
          {/* Importance Selectors */}
          <div>
            <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-widest mb-2">
              Criticality
            </label>
            <div className="flex flex-col gap-1.5">
              {(["High", "Medium", "Low"] as const).map((level) => {
                const isSelected = importance === level;
                return (
                  <label key={level} className={`flex items-center gap-2 p-1.5 px-2.5 rounded-lg border text-xs cursor-pointer select-none transition-all duration-150 ${
                    isSelected 
                      ? (isDarkMode 
                        ? "bg-rose-950/30 border-rose-800 text-rose-300 font-bold" 
                        : "bg-red-50/30 border-red-200 text-red-950 font-bold")
                      : (isDarkMode 
                        ? "bg-slate-850 border-slate-700/80 text-slate-400 hover:bg-slate-800 hover:text-slate-200" 
                        : "bg-slate-50/40 border-slate-100 text-slate-600 hover:bg-slate-50 hover:text-slate-800")
                  }`}>
                    <input
                      type="radio"
                      name="importance"
                      checked={importance === level}
                      onChange={() => setImportance(level)}
                      className={`w-3.5 h-3.5 cursor-pointer ${isDarkMode ? "accent-cyan-400" : "accent-indigo-600"}`}
                    />
                    <span>{level} Priority</span>
                  </label>
                );
              })}
            </div>
          </div>

          {/* Blocked Toggle */}
          <div>
            <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-widest mb-2">
              Blocks others?
            </label>
            <div className={`p-3 rounded-xl border flex flex-col justify-between gap-3 h-[84px] transition-all duration-200 ${
              blocksOthers 
                ? (isDarkMode ? "bg-amber-950/20 border-amber-800/80" : "bg-amber-50/40 border-amber-200") 
                : (isDarkMode ? "bg-slate-850 border-slate-700" : "bg-slate-50/40 border-slate-100")
            }`}>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setBlocksOthers(!blocksOthers)}
                  className={`relative inline-flex h-5 w-10 items-center rounded-full transition-colors cursor-pointer focus:outline-none ${
                    blocksOthers 
                      ? (isDarkMode ? "bg-cyan-500" : "bg-indigo-600") 
                      : (isDarkMode ? "bg-slate-700" : "bg-slate-200")
                  }`}
                >
                  <span
                    className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white transition-transform ${
                      blocksOthers ? "translate-x-5" : "translate-x-0.5"
                    }`}
                  />
                </button>
                <span className={`text-[11px] font-bold ${
                  blocksOthers 
                    ? (isDarkMode ? "text-amber-400" : "text-amber-800") 
                    : (isDarkMode ? "text-slate-400" : "text-slate-500")
                }`}>
                  {blocksOthers ? "Yes, blocks pipeline" : "No"}
                </span>
              </div>
              <p className={`text-[11px] font-medium leading-relaxed ${isDarkMode ? "text-slate-500" : "text-slate-400"}`}>
                Check if this task blocks secondary jobs.
              </p>
            </div>
          </div>
        </div>

        {/* Error message */}
        {errorMsg && (
          <p className={`text-xs font-semibold p-2.5 rounded-xl border ${
            isDarkMode 
              ? "bg-red-950/40 border-red-900/60 text-red-300" 
              : "bg-red-50 border-red-100 text-red-600"
          }`}>
            ⚠ {errorMsg}
          </p>
        )}

        {/* Add Button */}
        <motion.button
          whileHover={{ scale: 1.01 }}
          whileTap={{ scale: 0.99 }}
          type="submit"
          className={`w-full h-11 font-extrabold rounded-xl flex items-center justify-center gap-1.5 transition-all text-xs uppercase tracking-wider cursor-pointer shadow-md ${
            isDarkMode 
              ? "bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black border border-emerald-400 shadow-emerald-500/20" 
              : "bg-emerald-600 hover:bg-emerald-700 text-white shadow-emerald-600/10"
          }`}
        >
          <Plus size={16} className="stroke-[3]" /> Add Task to List
        </motion.button>
      </motion.form>

      {/* Move Load Crisis Demo here as a secondary button below the form */}
      {!isDemoMode && onLoadDemo && (
        <div className="mt-4 px-1">
          <motion.button
            whileHover={{ scale: 1.01 }}
            whileTap={{ scale: 0.99 }}
            type="button"
            onClick={onLoadDemo}
            className={`w-full h-11 font-bold rounded-xl flex items-center justify-center gap-2 transition-all cursor-pointer text-xs uppercase tracking-wider border ${
              isDarkMode
                ? "bg-slate-800 hover:bg-slate-700 text-slate-100 border-slate-700/80"
                : "bg-slate-100 hover:bg-slate-200/80 text-slate-800 border-slate-200/40"
            }`}
          >
            <Sparkles size={14} className={isDarkMode ? "text-cyan-400 stroke-[2.5]" : "text-indigo-600 stroke-[2.5]"} />
            Load Crisis Demo
          </motion.button>
        </div>
      )}

      {/* Added Tasks List - Active Backlog */}
      {activeTasks.length > 0 && (
        <div className="space-y-3 mb-6 z-10 mt-6">
          <div className="flex items-center justify-between px-1">
            <h3 className="block text-[11px] font-bold text-slate-400 uppercase tracking-widest">
              Current Backlog ({activeTasks.length})
            </h3>
            {!isDemoMode && onClearAllTasks && (
              <button
                type="button"
                onClick={() => setShowClearConfirm(true)}
                className={`text-[11px] font-bold uppercase tracking-wider px-2 py-1 rounded transition-colors cursor-pointer ${
                  isDarkMode 
                    ? "bg-slate-800/40 hover:bg-rose-950/40 text-rose-400 border border-rose-900/40" 
                    : "bg-slate-50 hover:bg-rose-50 text-rose-600 border border-rose-100"
                }`}
              >
                Clear All
              </button>
            )}
          </div>
          <div className="space-y-2.5 max-h-[250px] overflow-y-auto pr-1">
            <AnimatePresence initial={false}>
              {activeTasks.map((t) => {
                const matchedCategory = categories.find(c => c.name === t.category);
                return (
                  <motion.div
                    key={t.id}
                    initial={{ opacity: 0, height: 0, y: -10 }}
                    animate={{ opacity: 1, height: "auto", y: 0 }}
                    exit={{ opacity: 0, height: 0, y: 10 }}
                    transition={{ type: "spring", stiffness: 350, damping: 25 }}
                    className={`border rounded-xl p-3 flex items-center justify-between shadow-sm overflow-hidden transition-colors duration-300 ${
                      isDarkMode ? "bg-slate-800/80 border-slate-700" : "bg-white border-slate-200/80"
                    }`}
                  >
                    <div className="flex items-start gap-2.5 flex-1 min-w-0">
                      {/* Mark as Done checkbox/button */}
                      <button
                        type="button"
                        onClick={() => {
                          if (isDemoMode) {
                            if (onShowToast) onShowToast("Exit demo mode to add your own tasks", "error");
                            return;
                          }
                          if (onToggleCompleteTask) onToggleCompleteTask(t.id);
                        }}
                        className={`mt-0.5 w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 transition-colors cursor-pointer ${
                          isDarkMode
                            ? "border-slate-600 hover:border-emerald-400 bg-slate-900/45"
                            : "border-slate-300 hover:border-emerald-600 bg-slate-50"
                        }`}
                        title="Mark as Done"
                      >
                        <div className="w-1.5 h-1.5 bg-transparent rounded-full" />
                      </button>

                      <div className="space-y-1.5 flex-1 min-w-0 pr-3">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className={`font-bold text-[14px] truncate block max-w-[180px] ${isDarkMode ? "text-white" : "text-slate-900"}`}>
                            {t.name}
                          </span>
                          <span className={`text-[11px] px-2 py-0.5 rounded-md font-bold uppercase border ${
                            isDarkMode ? (matchedCategory?.darkColor || "bg-slate-700 text-slate-300 border-slate-600") : (matchedCategory?.color || "bg-slate-100 border-slate-200")
                          }`}>
                            {matchedCategory?.icon} {t.category}
                          </span>
                          {t.blocksOthers && (
                            <span className={`text-[11px] border px-1.5 py-0.5 rounded-md font-extrabold uppercase ${
                              isDarkMode 
                                ? "bg-rose-950/40 text-rose-400 border-rose-900/40" 
                                : "bg-red-50 text-red-600 border-red-100"
                            }`}>
                              Blocks 🚨
                            </span>
                          )}
                        </div>
                        
                        <div className={`flex items-center gap-3 text-xs font-semibold ${isDarkMode ? "text-slate-400" : "text-slate-500"}`}>
                          <span className="flex items-center gap-0.5">
                            🗓 {t.deadlineDate} @ {t.deadlineTime}
                          </span>
                          <span className="flex items-center gap-0.5">
                            ⏱ {t.hoursNeeded} hr{t.hoursNeeded === 1 ? "" : "s"}
                          </span>
                          <span className={`font-extrabold ${
                            t.importance === "High" ? "text-red-500" :
                            t.importance === "Medium" ? "text-amber-500" :
                            "text-slate-400"
                          }`}>
                            {t.importance}
                          </span>
                        </div>
                      </div>
                    </div>

                    <motion.button
                      whileHover={{ scale: 1.1, color: "#ef4444" }}
                      whileTap={{ scale: 0.9 }}
                      type="button"
                      onClick={() => {
                        if (isDemoMode) {
                          if (onShowToast) onShowToast("Exit demo mode to add your own tasks", "error");
                          return;
                        }
                        onDeleteTask(t.id);
                      }}
                      className={`p-2 rounded-lg transition-colors cursor-pointer ${
                        isDarkMode ? "text-slate-500 hover:bg-slate-700/50" : "text-slate-400 hover:bg-red-50/50 hover:text-red-600"
                      }`}
                      title="Delete task"
                    >
                      <Trash2 size={16} />
                    </motion.button>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </div>
        </div>
      )}

      {/* Completed tasks collapsible section */}
      {completedTasks.length > 0 && (
        <div className="space-y-3 mb-6 z-10 mt-6" id="completed-backlog">
          <button
            type="button"
            onClick={() => setIsCompletedCollapsed(!isCompletedCollapsed)}
            className="flex items-center justify-between w-full px-1 text-left cursor-pointer focus:outline-none"
          >
            <h3 className="block text-[11px] font-bold text-slate-400 uppercase tracking-widest">
              Completed ({completedTasks.length})
            </h3>
            <span className="text-[11px] text-slate-400 font-bold uppercase tracking-wider">
              {isCompletedCollapsed ? "Show ▲" : "Hide ▼"}
            </span>
          </button>
          
          {!isCompletedCollapsed && (
            <div className="space-y-2.5 max-h-[200px] overflow-y-auto pr-1">
              <AnimatePresence initial={false}>
                {completedTasks.map((t) => {
                  const matchedCategory = categories.find(c => c.name === t.category);
                  return (
                    <motion.div
                      key={t.id}
                      initial={{ opacity: 0, height: 0, y: -10 }}
                      animate={{ opacity: 1, height: "auto", y: 0 }}
                      exit={{ opacity: 0, height: 0, y: 10 }}
                      className={`border rounded-xl p-3 flex items-center justify-between shadow-sm overflow-hidden transition-colors duration-300 opacity-60 bg-slate-50 border-slate-200 dark:bg-slate-900/40 dark:border-slate-800/85`}
                    >
                      <div className="flex items-start gap-2.5 flex-1 min-w-0">
                        <button
                          type="button"
                          onClick={() => {
                            if (isDemoMode) {
                              if (onShowToast) onShowToast("Exit demo mode to add your own tasks", "error");
                              return;
                            }
                            if (onToggleCompleteTask) onToggleCompleteTask(t.id);
                          }}
                          className="mt-0.5 w-5 h-5 rounded-full border-2 border-emerald-500 bg-emerald-500 flex items-center justify-center shrink-0 text-white cursor-pointer"
                          title="Mark as Incomplete"
                        >
                          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="3">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                          </svg>
                        </button>
                        <div className="space-y-1.5 flex-1 min-w-0 pr-3">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <span className="font-bold text-[14px] truncate block max-w-[180px] text-slate-400 line-through">
                              {t.name}
                            </span>
                          </div>
                        </div>
                      </div>
                      <motion.button
                        whileHover={{ scale: 1.1, color: "#ef4444" }}
                        whileTap={{ scale: 0.9 }}
                        type="button"
                        onClick={() => {
                          if (isDemoMode) {
                            if (onShowToast) onShowToast("Exit demo mode to add your own tasks", "error");
                            return;
                          }
                          onDeleteTask(t.id);
                        }}
                        className="p-2 rounded-lg text-slate-400 hover:text-red-600 cursor-pointer"
                        title="Delete task"
                      >
                        <Trash2 size={16} />
                      </motion.button>
                    </motion.div>
                  );
                })}
              </AnimatePresence>
            </div>
          )}
        </div>
      )}

      {/* Clear All Confirmation Modal */}
      <AnimatePresence>
        {showClearConfirm && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-slate-950/60 backdrop-blur-xs z-[100] flex items-center justify-center p-4"
          >
            <motion.div
              initial={{ scale: 0.95 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.95 }}
              className={`max-w-xs w-full p-5 rounded-2xl border shadow-xl ${
                isDarkMode ? "bg-slate-900 border-slate-800 text-white" : "bg-white border-slate-200 text-slate-900"
              }`}
            >
              <h4 className="font-bold text-base mb-2">Clear all tasks?</h4>
              <p className="text-xs text-slate-500 dark:text-slate-400 mb-4 leading-relaxed">
                Delete all tasks? This cannot be undone.
              </p>
              <div className="flex gap-2.5">
                <button
                  type="button"
                  onClick={() => setShowClearConfirm(false)}
                  className={`flex-1 h-10 rounded-xl text-xs font-bold border ${
                    isDarkMode ? "border-slate-800 hover:bg-slate-850" : "border-slate-200 hover:bg-slate-50"
                  }`}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowClearConfirm(false);
                    if (onClearAllTasks) onClearAllTasks();
                  }}
                  className="flex-1 h-10 rounded-xl text-xs font-bold bg-rose-600 hover:bg-rose-700 text-white"
                >
                  Yes, Delete
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Floating Activate Bar */}
      <div className={`fixed bottom-0 left-0 right-0 max-w-[480px] mx-auto px-4 py-3 border-t z-30 flex gap-3 transition-colors duration-300 ${
        isDarkMode ? "bg-slate-900/95 border-slate-800" : "bg-slate-50/95 border-slate-200"
      }`}>
        <motion.button
          whileHover={activeTasks.length > 0 ? { scale: 1.02 } : {}}
          whileTap={activeTasks.length > 0 ? { scale: 0.98 } : {}}
          id="btn-activate-panic"
          type="button"
          disabled={activeTasks.length === 0}
          onClick={onActivatePanic}
          className={`w-full h-12 rounded-xl font-black flex items-center justify-center gap-2 transition-all shadow-md cursor-pointer text-sm uppercase tracking-wider border ${
            activeTasks.length > 0
              ? (isDarkMode 
                ? "bg-gradient-to-r from-cyan-500 to-indigo-600 text-slate-950 border-cyan-400 font-extrabold shadow-cyan-500/10" 
                : "bg-gradient-to-r from-indigo-600 to-indigo-500 text-white border-indigo-600 shadow-indigo-500/10 hover:from-indigo-700 hover:to-indigo-600")
              : "bg-slate-800 text-slate-500 border-slate-700 cursor-not-allowed shadow-none"
          }`}
        >
          <Sparkles size={18} className={activeTasks.length > 0 ? "animate-pulse text-yellow-300 fill-yellow-300/20" : ""} /> Activate TriageAI
        </motion.button>
      </div>
    </div>
  );
}
