import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { X, Copy, Check, ShieldAlert, Sparkles } from "lucide-react";
import { TriageResult, Task, DraftCommunication } from "../types";
import { cleanTextOfIds } from "../utils";

interface DraftMessageModalProps {
  isDarkMode: boolean;
  isOpen: boolean;
  taskId: string | null;
  triage: TriageResult;
  tasks: Task[];
  onClose: () => void;
}

export default function DraftMessageModal({
  isDarkMode,
  isOpen,
  taskId,
  triage,
  tasks,
  onClose,
}: DraftMessageModalProps) {
  const [copied, setCopied] = useState(false);
  const [draftText, setDraftText] = useState("");
  const [communication, setCommunication] = useState<DraftCommunication | null>(null);

  // Find corresponding task and draft communication
  const task = tasks.find((t) => t.id === taskId);

  useEffect(() => {
    if (taskId && triage) {
      const comm = triage.draftCommunications.find((c) => c.forTaskId === taskId);
      if (comm) {
        setCommunication(comm);
        setDraftText(cleanTextOfIds(comm.body, tasks));
      } else {
        // Fallback draft in case Gemini response doesn't have it
        const fallbackBody = `Hi, due to an urgent scheduling conflict, I need to reschedule/postpone our deadline for "${task?.name || 'this task'}". I apologize for the sudden delay and will follow up shortly with a proposed slot. Thanks for your understanding!`;
        setCommunication({
          forTaskId: taskId,
          type: "Urgent Postponement Request",
          body: fallbackBody,
          afterSendingRiskDropsTo: Math.max(10, triage.overallRiskScore - 25),
        });
        setDraftText(cleanTextOfIds(fallbackBody, tasks));
      }
    }
  }, [taskId, triage, task, tasks]);

  const timeoutRef = React.useRef<any>(null);

  React.useEffect(() => {
    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, []);

  // Handle copy to clipboard
  const handleCopy = () => {
    navigator.clipboard.writeText(draftText);
    setCopied(true);
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    timeoutRef.current = setTimeout(() => {
      setCopied(false);
    }, 2000);
  };

  if (!isOpen || !task) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-slate-950/50 backdrop-blur-sm px-4" id="draft-message-modal">
      {/* Backdrop clickable zone */}
      <div className="absolute inset-0" onClick={onClose} />

      {/* Slide-up Container */}
      <motion.div
        initial={{ y: "100%" }}
        animate={{ y: 0 }}
        exit={{ y: "100%" }}
        transition={{ type: "spring", damping: 25, stiffness: 220 }}
        className={`relative w-full max-w-[480px] rounded-t-3xl shadow-xl border-t p-6 space-y-5 pb-8 z-10 transition-colors duration-300 ${
          isDarkMode ? "bg-slate-850 border-slate-700 text-white" : "bg-white border-slate-200 text-slate-900"
        }`}
      >
        {/* Handle bar for bottom sheet look */}
        <div className={`mx-auto w-12 h-1.5 rounded-full mb-2 transition-colors duration-300 ${
          isDarkMode ? "bg-slate-700" : "bg-slate-200"
        }`} />

        {/* Modal Header */}
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <h3 className={`font-display text-xl font-extrabold ${isDarkMode ? "text-white" : "text-slate-900"}`}>
              Crisis Draft Message
            </h3>
            <p className={`text-xs font-semibold uppercase tracking-wider flex items-center gap-1 ${
              isDarkMode ? "text-slate-400" : "text-slate-500"
            }`}>
              <span>FOR:</span>
              <span className={`font-bold truncate max-w-[180px] ${isDarkMode ? "text-slate-200" : "text-slate-800"}`}>{task.name}</span>
            </p>
          </div>
          
          <button
            onClick={onClose}
            className={`p-1.5 rounded-full transition-colors cursor-pointer ${
              isDarkMode ? "bg-slate-850 text-slate-400 hover:bg-slate-750 hover:text-slate-200" : "bg-slate-100 text-slate-500 hover:text-slate-800"
            }`}
            title="Close"
          >
            <X size={18} />
          </button>
        </div>

        {/* Info label */}
        <div className={`border p-3.5 rounded-xl flex items-start gap-2.5 transition-colors duration-300 ${
          isDarkMode ? "bg-slate-900/60 border-slate-800" : "bg-slate-50 border-slate-200"
        }`}>
          <Sparkles size={16} className="text-cyan-400 shrink-0 mt-0.5" />
          <p className={`text-xs leading-relaxed font-medium ${isDarkMode ? "text-slate-300" : "text-slate-600"}`}>
            Send this text directly to your client, manager, or team to salvage your day. Honesty and speed are key in crises.
          </p>
        </div>

        {/* Message body input */}
        <div className="space-y-1.5">
          <div className="flex justify-between items-center px-1">
            <label className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">
              Notification Body
            </label>
            <span className={`text-[11px] font-bold px-2 py-0.5 rounded uppercase ${
              isDarkMode ? "bg-cyan-950/40 text-cyan-400 border border-cyan-900/35" : "bg-red-105 bg-indigo-50 text-indigo-700 border border-indigo-100"
            }`}>
              {communication?.type || "Urgent Notification"}
            </span>
          </div>
          
          <textarea
            value={draftText}
            onChange={(e) => setDraftText(e.target.value)}
            className={`w-full h-36 p-3 text-sm rounded-2xl focus:outline-none resize-none font-medium leading-relaxed transition-all duration-300 ${
              isDarkMode 
                ? "bg-slate-900 border border-slate-850 text-slate-100 focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500/30" 
                : "bg-slate-50 border border-slate-200 text-slate-800 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/20"
            }`}
            placeholder="Pre-drafted crisis message..."
          />
        </div>

        {/* Impact preview badge */}
        <div className={`border p-3 rounded-xl flex items-center justify-between transition-colors duration-300 ${
          isDarkMode ? "bg-cyan-950/20 border-cyan-900/30 text-cyan-400" : "bg-emerald-50 border border-emerald-100 text-emerald-800"
        }`}>
          <div className="flex items-center gap-2">
            <ShieldAlert size={16} className={isDarkMode ? "text-cyan-400" : "text-emerald-600"} />
            <span className={`text-xs font-bold ${isDarkMode ? "text-cyan-300" : "text-emerald-950"}`}>
              Impact Preview
            </span>
          </div>
          <span className={`text-xs font-extrabold border px-2.5 py-1 rounded-lg transition-colors duration-300 ${
            isDarkMode ? "bg-slate-900 border-cyan-850 text-cyan-400" : "bg-white border-emerald-200 text-emerald-700"
          }`}>
            Risk Drops to {communication?.afterSendingRiskDropsTo || 25}/100
          </span>
        </div>

        {/* Action Buttons */}
        <div className="grid grid-cols-2 gap-3 pt-2">
          <button
            onClick={onClose}
            className={`h-12 border font-semibold rounded-xl flex items-center justify-center transition-all text-xs uppercase tracking-wider cursor-pointer ${
              isDarkMode 
                ? "bg-slate-800 hover:bg-slate-750 border-slate-700 text-slate-300" 
                : "bg-white hover:bg-slate-50 border-slate-200 text-slate-700"
            }`}
          >
            Cancel / Edit
          </button>

          <button
            onClick={handleCopy}
            className={`h-12 rounded-xl font-bold flex items-center justify-center gap-2 transition-all text-xs uppercase tracking-wider shadow-sm cursor-pointer ${
              copied
                ? "bg-emerald-600 text-white hover:bg-emerald-700"
                : (isDarkMode 
                  ? "bg-cyan-500 text-slate-950 hover:bg-cyan-400" 
                  : "bg-indigo-600 text-white hover:bg-indigo-700 active:bg-indigo-800")
            }`}
          >
            {copied ? (
              <>
                <Check size={16} /> Copied!
              </>
            ) : (
              <>
                <Copy size={16} /> Copy to Clipboard
              </>
            )}
          </button>
        </div>

        {/* Quick toast overlay if copied */}
        <AnimatePresence>
          {copied && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 10 }}
              className="absolute -top-12 left-1/2 -translate-x-1/2 bg-slate-900 text-white text-xs font-bold px-4 py-2 rounded-full shadow-lg flex items-center gap-1.5"
            >
              <Check size={14} className="text-emerald-400" /> Draft message copied to clipboard!
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  );
}
