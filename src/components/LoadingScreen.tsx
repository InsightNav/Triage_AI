import { useEffect, useState } from "react";
import { motion } from "motion/react";
import { Loader2, CheckCircle2, Circle } from "lucide-react";

interface LoadingScreenProps {
  isDarkMode: boolean;
  taskCount: number;
  retryAttempt?: number;
}

export default function LoadingScreen({ isDarkMode, taskCount, retryAttempt }: LoadingScreenProps) {
  const [step, setStep] = useState(0);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    // Increment step every 2 seconds
    const timer1 = setTimeout(() => setStep(1), 2000);
    const timer2 = setTimeout(() => setStep(2), 4000);
    const timer3 = setTimeout(() => setStep(3), 6000);
    const timer4 = setTimeout(() => setStep(4), 8000);

    // Increment progress bar steadily
    const interval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) {
          clearInterval(interval);
          return 100;
        }
        return prev + 1.25; // Reaches 100% in about 8 seconds
      });
    }, 100);

    return () => {
      clearTimeout(timer1);
      clearTimeout(timer2);
      clearTimeout(timer3);
      clearTimeout(timer4);
      clearInterval(interval);
    };
  }, []);

  const stepsList = [
    { label: "Reading your tasks", index: 0 },
    { label: "Calculating time pressure", index: 1 },
    { label: "Detecting conflicts", index: 2 },
    { label: "Building rescue strategy", index: 3 },
  ];

  return (
    <div className={`flex flex-col items-center justify-center min-h-[85vh] px-6 text-center font-sans relative overflow-hidden transition-colors duration-300 ${isDarkMode ? "bg-slate-900 text-slate-100" : "bg-white text-slate-900"}`} id="loading-screen">
      
      {/* Decorative Cyan / Indigo Ambient Glow */}
      <div className={`absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 rounded-full blur-3xl pointer-events-none z-0 transition-colors duration-300 ${
        isDarkMode ? "bg-cyan-500/10" : "bg-indigo-500/5"
      }`} />

      {/* Cinematic Pulsing Icon */}
      <div className="relative mb-8 z-10">
        <motion.div
          animate={{
            scale: [1, 1.15, 1],
            rotate: [0, 4, -4, 0],
            boxShadow: [
              isDarkMode ? "0 0 0 0 rgba(34, 211, 238, 0.2)" : "0 0 0 0 rgba(79, 70, 229, 0.15)",
              isDarkMode ? "0 0 0 20px rgba(34, 211, 238, 0)" : "0 0 0 20px rgba(79, 70, 229, 0)",
              isDarkMode ? "0 0 0 0 rgba(34, 211, 238, 0.2)" : "0 0 0 0 rgba(79, 70, 229, 0.15)"
            ]
          }}
          transition={{
            repeat: Infinity,
            duration: 2.5,
            ease: "easeInOut"
          }}
          className={`w-24 h-24 rounded-full flex items-center justify-center shadow-inner border transition-colors duration-300 ${
            isDarkMode 
              ? "bg-gradient-to-tr from-slate-800 to-slate-900 border-slate-700" 
              : "bg-gradient-to-tr from-indigo-50 to-cyan-50/50 border-indigo-100"
          }`}
        >
          <span className="text-4xl select-none" role="img" aria-label="brain">🧠</span>
        </motion.div>
        
        {/* Urgent indicator */}
        <div className={`absolute top-0.5 right-0.5 w-4 h-4 rounded-full border-2 animate-ping ${
          isDarkMode ? "bg-cyan-400 border-slate-900" : "bg-indigo-600 border-white"
        }`}></div>
      </div>

      <h2 className={`font-display text-2xl font-black mb-2 uppercase tracking-tight z-10 transition-colors duration-300 ${isDarkMode ? "text-white" : "text-slate-900"}`}>
        ANALYZING YOUR COMMITMENTS...
      </h2>
      
      <p className={`text-[11px] font-extrabold uppercase tracking-widest mb-6 z-10 transition-colors duration-300 ${isDarkMode ? "text-slate-400" : "text-slate-500"}`}>
        Triaging {taskCount} {taskCount === 1 ? "task" : "tasks"} across the next 72 hours
      </p>

      {/* Progressive loading bar */}
      <div className={`w-full max-w-[280px] h-1.5 rounded-full overflow-hidden mb-8 shadow-inner border z-10 transition-colors duration-300 ${
        isDarkMode ? "bg-slate-800 border-slate-700" : "bg-slate-100 border-slate-200/20"
      }`}>
        <motion.div 
          className="bg-gradient-to-r from-cyan-400 via-indigo-500 to-purple-600 h-full rounded-full"
          style={{ width: `${Math.min(progress, 100)}%` }}
          transition={{ ease: "linear" }}
        />
      </div>

      {/* Checklist items */}
      <div className={`w-full max-w-[280px] border rounded-2xl p-5 shadow-sm space-y-4 text-left z-10 transition-colors duration-300 ${
        isDarkMode ? "bg-slate-800/60 border-slate-700" : "bg-white border-slate-200/80"
      }`}>
        {stepsList.map((item) => {
          const isDone = step > item.index;
          const isCurrent = step === item.index;

          return (
            <div key={item.index} className="flex items-center gap-3">
              {isDone ? (
                <CheckCircle2 size={18} className="text-emerald-500 shrink-0 stroke-[2.5]" />
              ) : isCurrent ? (
                <Loader2 size={18} className={`animate-spin shrink-0 stroke-[2.5] ${isDarkMode ? "text-cyan-400" : "text-indigo-600"}`} />
              ) : (
                <Circle size={18} className={`shrink-0 stroke-[2.5] ${isDarkMode ? "text-slate-700" : "text-slate-200"}`} />
              )}
              
              <span
                className={`text-[13px] font-bold transition-all duration-300 ${
                  isDone
                    ? (isDarkMode ? "text-slate-500 line-through decoration-slate-600 font-medium" : "text-slate-400 line-through decoration-slate-300 font-medium")
                    : isCurrent
                    ? (isDarkMode ? "text-cyan-400" : "text-slate-900")
                    : "text-slate-300 dark:text-slate-600"
                }`}
              >
                {item.label}
              </span>
            </div>
          );
        })}
      </div>

      {/* Small reassurance note */}
      <p className={`text-[11px] mt-6 max-w-[240px] leading-relaxed z-10 font-medium transition-colors duration-300 ${isDarkMode ? "text-slate-500" : "text-slate-400"}`}>
        {retryAttempt && retryAttempt > 0 ? (
          <span className="text-red-500 font-bold animate-pulse">
            Gemini is busy — retrying automatically (attempt {retryAttempt} of 3)...
          </span>
        ) : (
          "Our triage engine is assessing available hours and generating prioritized recommendations."
        )}
      </p>
    </div>
  );
}
