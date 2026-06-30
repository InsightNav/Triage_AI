import React from "react";
import { motion } from "motion/react";
import { ArrowLeft, Clock, Calendar, AlertTriangle, Send, Sparkles, AlertCircle, Eye, Lightbulb, CheckCircle, ChevronDown } from "lucide-react";
import { TriageResult, Task } from "../types";
import { cleanTextOfIds, refineConflictDescription } from "../utils";

interface TaskDetailProps {
  isDarkMode: boolean;
  taskId: string;
  triage: TriageResult;
  tasks: Task[];
  onBack: () => void;
  onOpenDraftModal: (taskId: string) => void;
}

export default function TaskDetail({
  isDarkMode,
  taskId,
  triage,
  tasks,
  onBack,
  onOpenDraftModal,
}: TaskDetailProps) {
  // Find current task details
  const task = tasks.find((t) => t.id === taskId);
  const priorityInfo = triage.priorityStack.find((p) => p.taskId === taskId);
  const failurePrediction = triage.deadlineFailurePredictions.find((f) => {
    if (f.taskId === taskId) return true;
    const normF = f.taskId.replace("demo-task-", "task_").replace("demo-", "task_").replace("task-", "task_");
    const normT = taskId.replace("demo-task-", "task_").replace("demo-", "task_").replace("task-", "task_");
    return normF === normT;
  });

  if (!task) {
    return (
      <div className={`flex flex-col items-center justify-center min-h-[50vh] text-center px-4 ${isDarkMode ? "text-slate-100" : "text-slate-900"}`}>
        <p className={`font-bold mb-4 ${isDarkMode ? "text-slate-400" : "text-slate-600"}`}>Task not found in the backlog.</p>
        <button onClick={onBack} className="px-4 py-2 bg-slate-900 text-white rounded-lg">
          Go Back
        </button>
      </div>
    );
  }

  // Calculate dynamic Time Available and Buffer
  const calculateBufferAndAvailable = () => {
    try {
      const deadlineStr = `${task.deadlineDate}T${task.deadlineTime}`;
      const deadlineDateObj = new Date(deadlineStr);
      const now = new Date();
      
      const diffMs = deadlineDateObj.getTime() - now.getTime();
      const availableHours = Math.max(0, diffMs / (1000 * 60 * 60)); // hours
      const buffer = availableHours - task.hoursNeeded;

      return {
        availableHours: parseFloat(availableHours.toFixed(1)),
        buffer: parseFloat(buffer.toFixed(1)),
      };
    } catch (e) {
      return {
        availableHours: 12.0,
        buffer: 12.0 - task.hoursNeeded,
      };
    }
  };

  const { availableHours, buffer } = calculateBufferAndAvailable();

  // Color-coded buffer logic
  const getBufferColor = (bufVal: number) => {
    if (bufVal < 1) {
      return { 
        text: isDarkMode ? "text-rose-400" : "text-rose-600", 
        bg: isDarkMode ? "bg-rose-950/20" : "bg-rose-50/50", 
        border: isDarkMode ? "border-rose-900/40" : "border-rose-200" 
      };
    }
    if (bufVal < 3) {
      return { 
        text: "text-amber-500", 
        bg: isDarkMode ? "bg-amber-950/20" : "bg-amber-50/50", 
        border: isDarkMode ? "border-amber-900/40" : "border-amber-200" 
      };
    }
    return { 
      text: isDarkMode ? "text-cyan-400" : "text-indigo-600", 
      bg: isDarkMode ? "bg-cyan-950/20" : "bg-cyan-50/40", 
      border: isDarkMode ? "border-cyan-900/40" : "border-cyan-100" 
    };
  };

  const bufColors = getBufferColor(buffer);

  // Risk Score Color mappings
  const getRiskColors = (level: string) => {
    const lvl = level.toLowerCase();
    if (lvl === "critical") {
      return {
        text: "text-rose-500",
        bg: isDarkMode ? "bg-rose-950/30" : "bg-rose-50",
        border: isDarkMode ? "border-rose-900/45" : "border-rose-200",
        accent: "bg-rose-600"
      };
    } else if (lvl === "high") {
      return {
        text: "text-amber-500",
        bg: isDarkMode ? "bg-amber-950/20" : "bg-amber-50",
        border: isDarkMode ? "border-amber-800/45" : "border-amber-200",
        accent: "bg-amber-500"
      };
    } else if (lvl === "medium" || lvl === "amber") {
      return {
        text: "text-yellow-500",
        bg: isDarkMode ? "bg-yellow-950/20" : "bg-yellow-50/50",
        border: isDarkMode ? "border-yellow-700/45" : "border-yellow-200",
        accent: "bg-yellow-500"
      };
    } else {
      return {
        text: "text-cyan-400",
        bg: isDarkMode ? "bg-cyan-950/20" : "bg-cyan-50",
        border: isDarkMode ? "border-cyan-900/45" : "border-cyan-200",
        accent: "bg-cyan-500"
      };
    }
  };

  const riskLevel = priorityInfo?.riskLevel || triage.overallRiskLevel;
  const riskColors = getRiskColors(riskLevel);

  // Find conflicts with this task
  const taskConflicts = triage.conflictDetection.filter((c) =>
    c.involvedTaskIds.includes(taskId)
  );

  return (
    <div className={`flex flex-col min-h-screen px-4 pb-24 font-sans w-full transition-colors duration-300 ${
      isDarkMode ? "bg-slate-900 text-slate-100" : "bg-white text-slate-900"
    }`} id="task-detail-screen">
      
      {/* Header Back Button */}
      <div className={`flex items-center justify-between py-5 border-b transition-colors duration-300 ${isDarkMode ? "border-slate-800" : "border-slate-100"}`}>
        <button
          onClick={onBack}
          className={`text-sm font-semibold flex items-center gap-1 transition-colors cursor-pointer ${
            isDarkMode ? "text-slate-400 hover:text-slate-200" : "text-slate-500 hover:text-slate-800"
          }`}
        >
          <ArrowLeft size={16} /> Dashboard
        </button>
        <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest">DETAIL INQUEST</span>
      </div>

      {/* Task Heading */}
      <div className="mt-6">
        <span className={`text-[10px] px-2.5 py-0.5 rounded-full font-bold uppercase border ${
          task.category === "Work" ? (isDarkMode ? "bg-blue-950/40 text-blue-400 border-blue-900/40" : "bg-blue-50 text-blue-600 border-blue-100") :
          task.category === "School" ? (isDarkMode ? "bg-purple-950/40 text-purple-400 border-purple-900/40" : "bg-purple-50 text-purple-600 border-purple-100") :
          task.category === "Finance" ? (isDarkMode ? "bg-emerald-950/40 text-emerald-400 border-emerald-900/40" : "bg-emerald-50 text-emerald-600 border-emerald-100") :
          (isDarkMode ? "bg-pink-950/40 text-pink-400 border-pink-900/40" : "bg-pink-50 text-pink-600 border-pink-100")
        }`}>
          {task.category}
        </span>
        <h2 className={`font-display text-2xl font-black mt-2 mb-4 leading-tight ${isDarkMode ? "text-white" : "text-slate-950"}`}>
          {task.name}
        </h2>
      </div>

      {/* Risk Score Badge Card */}
      <motion.div
        initial={{ opacity: 0, scale: 0.98 }}
        animate={{ opacity: 1, scale: 1 }}
        className={`border rounded-2xl p-4 shadow-sm flex items-center justify-between gap-4 mb-6 transition-colors duration-300 ${
          isDarkMode ? "bg-slate-800/80 border-slate-700" : "bg-white border-slate-200"
        }`}
      >
        <div className="space-y-1">
          <span className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest">
            Task Risk Level
          </span>
          <h4 className={`text-xl font-black uppercase tracking-wider ${riskColors.text}`}>
            {riskLevel}
          </h4>
          <p className={`text-xs font-medium ${isDarkMode ? "text-slate-400" : "text-slate-500"}`}>
            Risk Score estimated at {priorityInfo?.riskScore || 70}/100
          </p>
        </div>

        {/* Large visually prominent circle badge */}
        <div className={`w-14 h-14 rounded-full flex items-center justify-center font-extrabold font-mono text-lg border-2 shadow-sm transition-colors duration-300 ${
          riskColors.bg} ${riskColors.text} ${riskColors.border}`}>
          {priorityInfo?.riskScore || 70}
        </div>
      </motion.div>

      {/* Stats row: Deadline | Hours Needed | Time Available | Buffer */}
      <div className="grid grid-cols-2 gap-3 mb-6">
        <div className={`border rounded-2xl p-3 shadow-sm space-y-1 transition-colors duration-300 ${
          isDarkMode ? "bg-slate-800/80 border-slate-700" : "bg-white border-slate-200"
        }`}>
          <span className="block text-[9px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-1">
            <Calendar size={10} /> Deadline
          </span>
          <p className={`text-[13px] font-extrabold leading-tight ${isDarkMode ? "text-slate-100" : "text-slate-800"}`}>
            {task.deadlineDate}
          </p>
          <p className={`text-[11px] font-mono font-medium ${isDarkMode ? "text-slate-400" : "text-slate-500"}`}>
            @ {task.deadlineTime}
          </p>
        </div>

        <div className={`border rounded-2xl p-3 shadow-sm space-y-1 transition-colors duration-300 ${
          isDarkMode ? "bg-slate-800/80 border-slate-700" : "bg-white border-slate-200"
        }`}>
          <span className="block text-[9px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-1">
            <Clock size={10} /> Hours Needed
          </span>
          <p className={`text-[14px] font-extrabold ${isDarkMode ? "text-slate-100" : "text-slate-800"}`}>
            {task.hoursNeeded} hours
          </p>
          <p className="text-[10px] text-slate-400 font-medium uppercase tracking-wider">
            Total effort time
          </p>
        </div>

        <div className={`border rounded-2xl p-3 shadow-sm space-y-1 transition-colors duration-300 ${
          isDarkMode ? "bg-slate-800/80 border-slate-700" : "bg-white border-slate-200"
        }`}>
          <span className="block text-[9px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-1">
            ⏱ Time Available
          </span>
          <p className={`text-[14px] font-extrabold ${isDarkMode ? "text-slate-100" : "text-slate-800"}`}>
            {availableHours} hours
          </p>
          <p className="text-[10px] text-slate-400 font-medium uppercase tracking-wider">
            Until Deadline
          </p>
        </div>

        <div className={`border rounded-2xl p-3 shadow-sm space-y-1 transition-colors duration-300 ${bufColors.bg} ${bufColors.border}`}>
          <span className={`block text-[9px] font-bold uppercase tracking-widest ${bufColors.text}`}>
            🛡 Buffer Margin
          </span>
          <p className={`text-[14px] font-extrabold ${bufColors.text}`}>
            {buffer >= 0 ? `+${buffer} hours` : `${buffer} hours`}
          </p>
          <p className={`text-[10px] font-medium uppercase tracking-wider ${isDarkMode ? "text-slate-400" : "text-slate-500"}`}>
            Available minus effort
          </p>
        </div>
      </div>

      {/* Prediction Failure Reason (if exists) */}
      {failurePrediction && failurePrediction.failureProbability > 0.2 && (
        <div className={`border rounded-2xl p-4 mb-6 space-y-2 transition-colors duration-300 ${
          isDarkMode ? "bg-rose-950/20 border-rose-900/40" : "bg-red-50/50 border-red-100"
        }`}>
          <h4 className="text-[11px] font-bold text-rose-400 uppercase tracking-widest flex items-center gap-1">
            <AlertCircle size={14} /> Failure Probability Warning ({(failurePrediction.failureProbability * 100).toFixed(0)}%)
          </h4>
          <p className={`text-xs font-semibold leading-relaxed ${isDarkMode ? "text-slate-300" : "text-slate-700"}`}>
            {cleanTextOfIds(failurePrediction.failureReason, tasks)}
          </p>
          {!failurePrediction.isRecoverable && (
            <div className="text-[10px] text-red-100 font-bold uppercase bg-red-600 px-2 py-1 rounded-md max-w-max mt-2">
              🚨 Irrecoverable scheduling deadlock
            </div>
          )}
          {failurePrediction.isRecoverable && (
            <p className={`text-[11px] font-semibold p-2.5 rounded-lg border mt-2 transition-colors duration-300 ${
              isDarkMode 
                ? "bg-slate-900/60 border-rose-900/30 text-slate-300" 
                : "bg-white border-red-100/60 text-slate-600"
            }`}>
              💡 <span className="font-bold text-rose-400">Recovery strategy:</span> {cleanTextOfIds(failurePrediction.recoveryRequires, tasks)}
            </p>
          )}
        </div>
      )}

      {/* Section: Recommendation */}
      <div className={`rounded-2xl p-4 mb-6 shadow-sm border transition-colors duration-300 ${
        isDarkMode ? "bg-slate-800/80 border-slate-700 text-slate-100" : "bg-slate-900 text-white border-slate-950"
      }`}>
        <h4 className={`text-[11px] font-bold uppercase tracking-widest mb-2 flex items-center gap-1 ${isDarkMode ? "text-cyan-400" : "text-slate-400"}`}>
          <Sparkles size={12} className={isDarkMode ? "text-cyan-400" : "text-amber-400"} /> AI Director's Directive
        </h4>
        <p className={`text-xs leading-relaxed font-semibold ${isDarkMode ? "text-slate-200" : "text-slate-200"}`}>
          {priorityInfo?.rationale ? cleanTextOfIds(priorityInfo.rationale, tasks) : "Ensure uninterrupted focus. Put all devices on Do Not Disturb."}
        </p>
        {priorityInfo?.sacrificeRecommended && (
          <div className={`mt-3 border rounded-xl p-3 transition-colors duration-300 ${
            isDarkMode ? "bg-slate-900/60 border-slate-750" : "bg-slate-800 border-slate-700"
          }`}>
            <p className="text-[11px] font-bold text-amber-400 uppercase tracking-wider mb-1">
              SACRIFICE DECLARED REQUISITE
            </p>
            <p className="text-[11px] text-slate-300 leading-relaxed">
              {cleanTextOfIds(priorityInfo.sacrificeRationale || "", tasks)}
            </p>
          </div>
        )}
      </div>

      {/* Section: "Why this is [risk level]" — AI reasoning chain */}
      <div className="mb-6 space-y-3">
        <h4 className="text-[11px] font-bold text-slate-500 uppercase tracking-widest px-1">
          🛡 AI Reasoning Chain
        </h4>
        
        <div className="space-y-1">
          {triage.reasoningChain && triage.reasoningChain.map((step, idx) => (
            <React.Fragment key={idx}>
              <div className={`border rounded-2xl p-4 shadow-sm relative overflow-hidden transition-colors duration-300 ${
                isDarkMode ? "bg-slate-800/60 border-slate-700" : "bg-white border-slate-200"
              }`}>
                <span className={`absolute -right-3 -bottom-4 font-mono text-[56px] font-bold select-none transition-colors duration-300 ${
                  isDarkMode ? "text-slate-800/30" : "text-slate-50"
                }`}>
                  {step.stepNumber}
                </span>
                
                <div className="space-y-3 relative z-10">
                  <div className={`flex items-center justify-between border-b pb-1.5 transition-colors duration-300 ${
                    isDarkMode ? "border-slate-700" : "border-slate-50"
                  }`}>
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                      REASONING STEP {step.stepNumber}
                    </span>
                  </div>

                  <div className="space-y-3 text-xs">
                    {/* NOTICED */}
                    <div className={`p-2.5 rounded-xl border transition-colors duration-300 ${
                      isDarkMode ? "bg-slate-900/60 border-slate-850" : "bg-slate-50/50 border-slate-100"
                    }`}>
                      <div className="flex items-center gap-1.5 mb-1 text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                        <Eye size={12} className="text-slate-500" /> Noticed
                      </div>
                      <p className={`leading-relaxed font-semibold pl-4 border-l-2 border-slate-300 dark:border-slate-600 ${isDarkMode ? "text-slate-300" : "text-slate-800"}`}>
                        {cleanTextOfIds(step.observation, tasks)}
                      </p>
                    </div>

                    {/* INFERRED */}
                    <div className={`p-2.5 rounded-xl border transition-colors duration-300 ${
                      isDarkMode ? "bg-amber-950/10 border-amber-900/30" : "bg-amber-50/20 border-amber-100/50"
                    }`}>
                      <div className="flex items-center gap-1.5 mb-1 text-[10px] font-bold text-amber-500 uppercase tracking-wider">
                        <Lightbulb size={12} className="text-amber-500" /> Inferred
                      </div>
                      <p className={`leading-relaxed font-semibold pl-4 border-l-2 border-amber-300 dark:border-amber-800 ${isDarkMode ? "text-slate-300" : "text-slate-800"}`}>
                        {cleanTextOfIds(step.inference, tasks)}
                      </p>
                    </div>

                    {/* DECIDED */}
                    <div className={`p-2.5 rounded-xl border transition-colors duration-300 ${
                      isDarkMode ? "bg-cyan-950/20 border-cyan-900/30" : "bg-indigo-50/20 border-indigo-100/50"
                    }`}>
                      <div className={`flex items-center gap-1.5 mb-1 text-[10px] font-bold uppercase tracking-wider ${
                        isDarkMode ? "text-cyan-400" : "text-indigo-600"
                      }`}>
                        <CheckCircle size={12} className={isDarkMode ? "text-cyan-400" : "text-indigo-500"} /> Decided
                      </div>
                      <p className={`leading-relaxed font-bold pl-4 border-l-2 ${
                        isDarkMode ? "text-white border-cyan-500" : "text-slate-900 border-indigo-500"
                      }`}>
                        {cleanTextOfIds(step.decision, tasks)}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {idx < triage.reasoningChain.length - 1 && (
                <div className="flex justify-center my-1.5">
                  <motion.div 
                    animate={{ y: [0, 4, 0] }}
                    transition={{ repeat: Infinity, duration: 2, ease: "easeInOut" }}
                    className={`w-7 h-7 rounded-full border flex items-center justify-center text-slate-400 shadow-sm transition-colors duration-300 ${
                      isDarkMode ? "bg-slate-800 border-slate-700" : "bg-slate-100 border-slate-200"
                    }`}
                  >
                    <ChevronDown size={14} className="stroke-[2.5]" />
                  </motion.div>
                </div>
              )}
            </React.Fragment>
          ))}
        </div>
      </div>

      {/* Section: Conflicts with */}
      {taskConflicts.length > 0 && (
        <div className="mb-6 space-y-3">
          <h4 className="text-[11px] font-bold text-slate-500 uppercase tracking-widest px-1">
            🚨 Direct Overlaps & Conflicts
          </h4>
          <div className="space-y-2">
            {taskConflicts.map((c, i) => (
              <div key={i} className={`border rounded-xl p-3 flex gap-2.5 shadow-sm transition-colors duration-300 ${
                isDarkMode ? "bg-amber-950/20 border-amber-900/30" : "bg-amber-50 border-amber-200"
              }`}>
                <div className="text-amber-500 shrink-0">
                  <AlertTriangle size={16} />
                </div>
                <div className="space-y-1">
                  <p className="text-xs text-amber-500 font-bold leading-none">
                    Severity: {c.severity}
                  </p>
                  <p className={`text-xs leading-normal ${isDarkMode ? "text-slate-300" : "text-slate-700"}`}>
                    {refineConflictDescription(c.description, tasks)}
                  </p>
                  <p className={`text-[11px] font-semibold italic ${isDarkMode ? "text-amber-300" : "text-amber-800"}`}>
                    💡 Solution: {cleanTextOfIds(c.resolution, tasks)}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Action Footer Button if sacrifice recommended */}
      {priorityInfo?.sacrificeRecommended && (
        <div className={`fixed bottom-0 left-0 right-0 max-w-[480px] mx-auto px-4 py-3 border-t z-30 transition-colors duration-300 ${
          isDarkMode ? "bg-slate-900/95 border-slate-800" : "bg-slate-50/95 border-slate-200"
        }`}>
          <button
            onClick={() => onOpenDraftModal(taskId)}
            className={`w-full h-12 text-slate-950 font-black rounded-xl flex items-center justify-center gap-2 transition-all shadow-md cursor-pointer text-sm ${
              isDarkMode 
                ? "bg-gradient-to-r from-cyan-400 to-indigo-500 border border-cyan-300 text-slate-950" 
                : "bg-red-600 hover:bg-red-700 active:bg-red-800 text-white"
            }`}
          >
            <Send size={16} /> Draft Crisis Notification Message
          </button>
        </div>
      )}
    </div>
  );
}
