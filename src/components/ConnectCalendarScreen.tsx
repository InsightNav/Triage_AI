import React, { useState } from "react";
import { motion } from "motion/react";
import { Calendar, Check, X, ArrowRight, Shield, RefreshCw, Sun, Moon, Info } from "lucide-react";
import { googleSignIn } from "../lib/firebaseAuth";
import { User } from "firebase/auth";

interface ConnectCalendarScreenProps {
  isDarkMode: boolean;
  onToggleDarkMode: () => void;
  onConnect: (user: User, accessToken: string) => void;
  onSkip: () => void;
}

export default function ConnectCalendarScreen({
  isDarkMode,
  onToggleDarkMode,
  onConnect,
  onSkip,
}: ConnectCalendarScreenProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleConnect = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const result = await googleSignIn();
      if (result) {
        setSuccess(true);
        // Wait 1.5 seconds and then callback
        setTimeout(() => {
          onConnect(result.user, result.accessToken);
        }, 1500);
      } else {
        throw new Error("Unable to obtain Google token.");
      }
    } catch (err: any) {
      console.error("Calendar connection error:", err);
      setError(
        err?.message || "Failed to connect to Google Calendar. Please try again."
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className={`flex flex-col items-center justify-between min-h-[85vh] px-6 py-10 text-center relative overflow-hidden font-sans transition-colors duration-300 ${isDarkMode ? "bg-slate-900" : "bg-white"}`} id="connect-calendar-screen">
      
      {/* Decorative Aura */}
      <div className={`absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-80 h-80 rounded-full blur-3xl pointer-events-none z-0 transition-opacity duration-500 ${
        isDarkMode 
          ? "bg-gradient-to-tr from-cyan-500/10 via-indigo-500/5 to-transparent opacity-60" 
          : "bg-gradient-to-tr from-indigo-500/5 via-cyan-500/5 to-transparent opacity-80"
      }`} />

      {/* Top Header */}
      <div className="w-full flex justify-between items-center px-2 z-20">
        <h2 className={`font-display text-base font-black uppercase tracking-wider ${isDarkMode ? "text-slate-400" : "text-slate-500"}`}>
          Calendar Sync
        </h2>
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={onToggleDarkMode}
          className={`p-2.5 rounded-xl border transition-all duration-300 cursor-pointer ${
            isDarkMode 
              ? "bg-slate-800 border-slate-700/80 text-amber-400 hover:bg-slate-700 hover:border-slate-600" 
              : "bg-slate-50 border-slate-200/60 text-indigo-600 hover:bg-slate-100"
          }`}
          title="Toggle Theme"
        >
          {isDarkMode ? <Sun size={15} /> : <Moon size={15} />}
        </motion.button>
      </div>

      {/* Main Content */}
      <div className="w-full flex-1 flex flex-col items-center justify-center py-6 z-10">
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
          className="relative mb-6"
        >
          {/* Pulsing Aura */}
          <div className={`absolute inset-0 rounded-full blur-xl transition-colors duration-300 opacity-20 ${
            isDarkMode ? "bg-cyan-500" : "bg-indigo-400"
          }`} />

          <div className={`relative w-20 h-20 rounded-2xl flex items-center justify-center border shadow-md transition-all duration-300 ${
            isDarkMode 
              ? "bg-gradient-to-b from-slate-800 to-slate-900 border-slate-700 text-cyan-400" 
              : "bg-gradient-to-b from-indigo-50 to-indigo-100/50 border-indigo-200 text-indigo-600"
          }`}>
            <Calendar size={40} className="stroke-[2.2] drop-shadow-sm" />
          </div>
        </motion.div>

        <h1 className={`font-display text-2xl font-black tracking-tight mb-2 uppercase transition-colors duration-300 ${
          isDarkMode ? "text-white" : "text-slate-900"
        }`}>
          Connect Google Calendar
        </h1>

        <p className={`text-sm max-w-[320px] leading-relaxed mb-6 font-medium transition-colors duration-300 ${
          isDarkMode ? "text-slate-400" : "text-slate-600"
        }`}>
          "PanicMode works better when it knows your real schedule."
        </p>

        {/* Success / Error Messages */}
        {success ? (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className={`p-4 rounded-xl mb-6 text-sm font-semibold flex items-center justify-center gap-2 border w-full max-w-sm ${
              isDarkMode 
                ? "bg-emerald-950/40 border-emerald-800/40 text-emerald-400" 
                : "bg-emerald-50 border-emerald-100 text-emerald-800"
            }`}
          >
            <span className="animate-bounce">✓</span> Calendar connected — reading today's schedule
          </motion.div>
        ) : error ? (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className={`p-4 rounded-xl mb-6 text-xs font-medium border text-left w-full max-w-sm ${
              isDarkMode 
                ? "bg-rose-950/40 border-rose-900/40 text-rose-400" 
                : "bg-rose-50 border-rose-200 text-rose-800"
            }`}
          >
            <p className="font-bold mb-1">Failed to authenticate:</p>
            <p className="opacity-90">{error}</p>
          </motion.div>
        ) : null}

        {/* Feature Checklists Grid */}
        <div className="w-full max-w-xs grid grid-cols-2 gap-3 mb-8 text-left">
          <div className={`p-3 rounded-xl border transition-colors duration-300 ${
            isDarkMode ? "bg-slate-800/40 border-slate-700/50" : "bg-slate-50 border-slate-100"
          }`}>
            <div className={`text-[11px] font-black uppercase tracking-wider mb-2 flex items-center gap-1 ${isDarkMode ? "text-cyan-400" : "text-indigo-600"}`}>
              <Check size={12} className="stroke-[3]" /> Read Access
            </div>
            <ul className={`text-[11px] space-y-1 font-medium leading-normal ${isDarkMode ? "text-slate-400" : "text-slate-500"}`}>
              <li>• Busy/free times</li>
              <li>• Existing meetings</li>
              <li>• Today's timeline</li>
            </ul>
          </div>

          <div className={`p-3 rounded-xl border transition-colors duration-300 ${
            isDarkMode ? "bg-slate-800/40 border-slate-700/50" : "bg-slate-50 border-slate-100"
          }`}>
            <div className={`text-[11px] font-black uppercase tracking-wider mb-2 flex items-center gap-1 text-rose-500`}>
              <X size={12} className="stroke-[3]" /> Never Do
            </div>
            <ul className={`text-[11px] space-y-1 font-medium leading-normal ${isDarkMode ? "text-slate-400" : "text-slate-500"}`}>
              <li>• Store your data</li>
              <li>• Read event descriptions</li>
              <li>• Require an account</li>
            </ul>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="w-full space-y-3 max-w-xs">
          <motion.button
            whileHover={!isLoading && !success ? { scale: 1.02 } : {}}
            whileTap={!isLoading && !success ? { scale: 0.98 } : {}}
            onClick={handleConnect}
            disabled={isLoading || success}
            className={`w-full h-12 text-white font-bold rounded-xl shadow-md transition-all duration-300 flex items-center justify-center gap-2 cursor-pointer text-[14px] ${
              success
                ? "bg-emerald-600 cursor-default shadow-none"
                : isDarkMode
                  ? "bg-gradient-to-r from-cyan-600 to-indigo-600 hover:from-cyan-500 hover:to-indigo-500"
                  : "bg-gradient-to-r from-indigo-600 to-indigo-500 hover:from-indigo-700 hover:to-indigo-600"
            }`}
          >
            {isLoading ? (
              <>
                <RefreshCw size={16} className="animate-spin" />
                Connecting Securely...
              </>
            ) : success ? (
              "Securely Synced ✓"
            ) : (
              "Connect Google Calendar"
            )}
          </motion.button>

          {!success && (
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={onSkip}
              className={`w-full h-11 font-bold rounded-xl flex items-center justify-center transition-all duration-300 cursor-pointer text-[13px] border ${
                isDarkMode
                  ? "bg-slate-800 hover:bg-slate-700 text-slate-300 border-slate-700/80"
                  : "bg-slate-50 hover:bg-slate-100 text-slate-600 border-slate-200/40"
              }`}
            >
              Skip — enter tasks only
            </motion.button>
          )}
        </div>
      </div>

      {/* Privacy Note */}
      <div className="w-full max-w-xs z-10 pt-4 border-t border-slate-800/10 dark:border-slate-800">
        <div className="flex gap-1.5 items-start text-[11px] text-slate-400 font-medium leading-normal text-left">
          <Shield size={14} className="shrink-0 text-cyan-500 stroke-[2.2] mt-0.5" />
          <span>
            🔒 We only read your free/busy times. Event details stay private. Nothing is stored on our servers. Disconnect anytime.
          </span>
        </div>
      </div>

    </div>
  );
}
