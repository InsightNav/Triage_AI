import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { ScreenName, Task, TriageResult } from "./types";
import { getDemoTasks } from "./demoData";
import LandingScreen from "./components/LandingScreen";
import ConnectCalendarScreen from "./components/ConnectCalendarScreen";
import IntakeScreen from "./components/IntakeScreen";
import LoadingScreen from "./components/LoadingScreen";
import CrisisDashboard from "./components/CrisisDashboard";
import TaskDetail from "./components/TaskDetail";
import DraftMessageModal from "./components/DraftMessageModal";
import { ShieldAlert, AlertTriangle, RefreshCw, XCircle } from "lucide-react";
import { DEMO_FALLBACK } from "./fallbackData";
import { generateDynamicTriageResult, filterTriageResult, safeParseResult } from "./utils";
import { fetchCalendarEvents, calculateTodaySlots } from "./lib/calendarService";

// Helper function to map hardcoded fallback task IDs to actual task IDs from the user's task list
function mapFallbackResultToActualIds(fallbackObj: any, actualTasks: Task[]): TriageResult {
  const presentationTask = actualTasks.find(t => {
    const name = t.name.toLowerCase();
    return name.includes("presentation");
  });
  const billTask = actualTasks.find(t => {
    const name = t.name.toLowerCase();
    return name.includes("electricity");
  });
  const standupTask = actualTasks.find(t => {
    const name = t.name.toLowerCase();
    return name.includes("standup");
  });
  const reportTask = actualTasks.find(t => {
    const name = t.name.toLowerCase();
    return name.includes("report") || name.includes("status");
  });

  const idMap: Record<string, string> = {};
  if (presentationTask) idMap["task_1"] = presentationTask.id;
  if (billTask) idMap["task_2"] = billTask.id;
  if (standupTask) idMap["task_3"] = standupTask.id;
  if (reportTask) idMap["task_4"] = reportTask.id;

  const result = JSON.parse(JSON.stringify(fallbackObj));

  result.deadlineFailurePredictions = result.deadlineFailurePredictions.map((item: any) => ({
    ...item,
    taskId: idMap[item.taskId] || item.taskId,
  }));

  result.conflictDetection = result.conflictDetection.map((item: any) => ({
    ...item,
    involvedTaskIds: item.involvedTaskIds.map((tid: string) => idMap[tid] || tid),
  }));

  result.priorityStack = result.priorityStack.map((item: any) => ({
    ...item,
    taskId: idMap[item.taskId] || item.taskId,
  }));

  result.rescuePlan.timeBlocks = result.rescuePlan.timeBlocks.map((item: any) => ({
    ...item,
    taskId: idMap[item.taskId] || item.taskId,
  }));

  result.draftCommunications = result.draftCommunications.map((item: any) => ({
    ...item,
    forTaskId: idMap[item.forTaskId] || item.forTaskId,
  }));

  return result as TriageResult;
}

const safeLocalStorage = {
  getItem: (key: string) => {
    try { return localStorage.getItem(key); } catch (e) { return null; }
  },
  setItem: (key: string, val: string) => {
    try { localStorage.setItem(key, val); } catch (e) {}
  },
  removeItem: (key: string) => {
    try { localStorage.removeItem(key); } catch (e) {}
  }
};

const safeSessionStorage = {
  getItem: (key: string) => {
    try { return sessionStorage.getItem(key); } catch (e) { return null; }
  },
  setItem: (key: string, val: string) => {
    try { sessionStorage.setItem(key, val); } catch (e) {}
  },
  removeItem: (key: string) => {
    try { sessionStorage.removeItem(key); } catch (e) {}
  }
};

export default function App() {
  // Application states
  const [currentScreen, setCurrentScreen] = useState<ScreenName>("landing");
  const [tasks, setTasks] = useState<Task[]>([]);
  const [demoTasks, setDemoTasks] = useState<Task[]>([]);
  const [isDemoMode, setIsDemoMode] = useState<boolean>(() => {
    if (typeof window !== "undefined") {
      return safeSessionStorage.getItem("panicmode_mode") === "demo";
    }
    return false;
  });
  
  const [triageResult, setTriageResult] = useState<TriageResult | null>(null);
  const [triageFromCache, setTriageFromCache] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);

  // Google Calendar state variables (Optional Integration)
  const [calendarConnected, setCalendarConnected] = useState(false);
  const [calendarAccessToken, setCalendarAccessToken] = useState<string | null>(null);
  const [freeSlots, setFreeSlots] = useState<any[]>([]);
  const [busySlots, setBusySlots] = useState<any[]>([]);
  const [calendarUser, setCalendarUser] = useState<any | null>(null);

  const [toast, setToast] = useState<{ message: string; type: "success" | "error" | "info" } | null>(null);
  const [isBriefingOpen, setIsBriefingOpen] = useState(false);

  // Master global ticker to drive live updates and notification checks from a single root timer
  const [globalTick, setGlobalTick] = useState(0);

  useEffect(() => {
    const masterInterval = setInterval(() => {
      setGlobalTick((prev) => prev + 1);
    }, 15000); // Master tick every 15 seconds
    return () => clearInterval(masterInterval);
  }, []);

  // Push Notification state tracking
  const [notificationPermission, setNotificationPermission] = useState<"default" | "granted" | "denied">(
    typeof window !== "undefined" && "Notification" in window ? Notification.permission : "default"
  );
  const [notificationsEnabled, setNotificationsEnabled] = useState<boolean>(() => {
    if (typeof window !== "undefined") {
      const saved = safeLocalStorage.getItem('panicmode_notifications_enabled');
      return saved === 'true';
    }
    return false;
  });
  const [notifiedTaskIds, setNotifiedTaskIds] = useState<Set<string>>(() => {
    if (typeof window !== "undefined") {
      const saved = safeLocalStorage.getItem('panicmode_notified_tasks');
      if (saved) {
        try {
          return new Set(JSON.parse(saved));
        } catch (e) {}
      }
    }
    return new Set();
  });

  // Save notified task IDs when changed
  useEffect(() => {
    safeLocalStorage.setItem('panicmode_notified_tasks', JSON.stringify(Array.from(notifiedTaskIds)));
  }, [notifiedTaskIds]);

  // Request browser permission for notifications
  const requestNotificationPermission = async () => {
    if (typeof window === "undefined" || !("Notification" in window)) {
      setToast({ message: "Notifications are not supported in this browser.", type: "error" });
      return;
    }
    try {
      const permission = await Notification.requestPermission();
      setNotificationPermission(permission);
      if (permission === "granted") {
        setNotificationsEnabled(true);
        safeLocalStorage.setItem('panicmode_notifications_enabled', 'true');
        setToast({ message: "🔔 Push notifications successfully enabled!", type: "success" });
        new Notification("TriageAI Alerts Enabled! ⚡", {
          body: "You'll receive alerts for nearing task deadlines and periodic triage updates.",
          icon: "/favicon.ico"
        });
      } else if (permission === "denied") {
        setNotificationsEnabled(false);
        safeLocalStorage.setItem('panicmode_notifications_enabled', 'false');
        setToast({ message: "Notifications blocked. Enable them in browser settings.", type: "error" });
      }
    } catch (error) {
      console.error("Error requesting notification permission:", error);
    }
  };

  // Toggle notifications on/off
  const toggleNotifications = () => {
    if (notificationsEnabled) {
      setNotificationsEnabled(false);
      safeLocalStorage.setItem('panicmode_notifications_enabled', 'false');
      setToast({ message: "Notifications disabled.", type: "info" });
    } else {
      if (notificationPermission === "granted") {
        setNotificationsEnabled(true);
        safeLocalStorage.setItem('panicmode_notifications_enabled', 'true');
        setToast({ message: "Notifications enabled.", type: "success" });
      } else if (notificationPermission === "denied") {
        setToast({ message: "Notifications blocked. Enable them in browser settings.", type: "error" });
      } else {
        requestNotificationPermission();
      }
    }
  };

  // Dispatch a test briefing notification instantly
  const handleTriggerTestBriefing = (timeOfDay: "morning" | "afternoon" | "evening") => {
    if (typeof window === "undefined" || !("Notification" in window)) {
      setToast({ message: "Notifications are not supported in this browser.", type: "error" });
      return;
    }
    if (Notification.permission !== "granted") {
      requestNotificationPermission();
      return;
    }

    const activeTasks = isDemoMode ? demoTasks : tasks;
    const pendingTasksCount = activeTasks.filter(t => !t.isCompleted).length;

    let title = "";
    let body = "";

    if (timeOfDay === "morning") {
      title = "☀️ Morning Triage Briefing (Demo)";
      body = pendingTasksCount > 0 
        ? `You have ${pendingTasksCount} tasks pending today. View your Daily Action Plan now!`
        : "No pending tasks for today. Have a peaceful morning!";
    } else if (timeOfDay === "afternoon") {
      title = "⛅ Afternoon Check-in Briefing (Demo)";
      body = pendingTasksCount > 0
        ? `Halfway through! You have ${pendingTasksCount} tasks remaining. Review your schedule risk.`
        : "All clear! No tasks remaining. Keep up the excellent work!";
    } else {
      title = "🌙 Evening Wrap-up Briefing (Demo)";
      body = pendingTasksCount > 0
        ? `${pendingTasksCount} tasks carried over. Adjust your priorities to protect tomorrow.`
        : "Fantastic job! All tasks completed today. View tomorrow's briefing.";
    }

    new Notification(title, {
      body,
      icon: "/favicon.ico"
    });
    setToast({ message: `Test ${timeOfDay} briefing notification dispatched!`, type: "success" });
  };

  // Active notification check loop (for nearing tasks & daily briefings)
  useEffect(() => {
    if (!notificationsEnabled || notificationPermission !== "granted") return;

    const activeTasks = isDemoMode ? demoTasks : tasks;
    const now = Date.now();
    const localDateStr = new Date().toLocaleDateString('en-CA'); // YYYY-MM-DD local format
    const currentHour = new Date().getHours();

    // 1. Check nearing task deadlines (within 30 minutes, positive time remaining, not completed)
    activeTasks.forEach((task) => {
      if (task.isCompleted) return;
      if (!task.deadlineDate || !task.deadlineTime) return;

      try {
        const target = new Date(`${task.deadlineDate}T${task.deadlineTime}`);
        const diffMs = target.getTime() - now;
        const thirtyMinutesMs = 30 * 60 * 1000;

        if (diffMs > 0 && diffMs <= thirtyMinutesMs) {
          if (!notifiedTaskIds.has(task.id)) {
            // Trigger Notification
            new Notification("Task Deadline Nearing! ⚡", {
              body: `"${task.name}" is due in ${Math.round(diffMs / (60 * 1000))} minutes (${task.deadlineTime}).`,
              icon: "/favicon.ico"
            });
            setNotifiedTaskIds((prev) => {
              const next = new Set(prev);
              next.add(task.id);
              return next;
            });
          }
        }
      } catch (e) {
        console.error("Error evaluating nearing task:", e);
      }
    });

    // 2. Check periodic briefings (Morning, Afternoon, Evening)
    let sentBriefings: Record<string, boolean> = {};
    const savedBriefings = safeLocalStorage.getItem('panicmode_sent_briefings');
    if (savedBriefings) {
      try { sentBriefings = JSON.parse(savedBriefings); } catch (e) {}
    }

    // Helper to send a briefing notification
    const sendBriefingNotification = (briefingKey: string, title: string, body: string) => {
      if (!sentBriefings[briefingKey]) {
        new Notification(title, { body, icon: "/favicon.ico" });
        sentBriefings[briefingKey] = true;
        safeLocalStorage.setItem('panicmode_sent_briefings', JSON.stringify(sentBriefings));
      }
    };

    const pendingTasksCount = activeTasks.filter(t => !t.isCompleted).length;

    // Morning briefing: 8:00 AM - 10:00 AM
    if (currentHour >= 8 && currentHour < 10) {
      const briefingKey = `${localDateStr}-morning`;
      sendBriefingNotification(
        briefingKey,
        "☀️ Morning Triage Briefing",
        pendingTasksCount > 0 
          ? `You have ${pendingTasksCount} tasks pending today. View your Daily Action Plan now!`
          : "No pending tasks for today. Have a peaceful morning!"
      );
    }
    // Afternoon briefing: 12:00 PM - 2:00 PM
    else if (currentHour >= 12 && currentHour < 14) {
      const briefingKey = `${localDateStr}-afternoon`;
      sendBriefingNotification(
        briefingKey,
        "⛅ Afternoon Check-in Briefing",
        pendingTasksCount > 0
          ? `Halfway through! You have ${pendingTasksCount} tasks remaining. Review your schedule risk.`
          : "All clear! No tasks remaining. Keep up the excellent work!"
      );
    }
    // Evening briefing: 6:00 PM - 8:00 PM
    else if (currentHour >= 18 && currentHour < 20) {
      const briefingKey = `${localDateStr}-evening`;
      sendBriefingNotification(
        briefingKey,
        "🌙 Evening Wrap-up Briefing",
        pendingTasksCount > 0
          ? `${pendingTasksCount} tasks carried over. Adjust your priorities to protect tomorrow.`
          : "Fantastic job! All tasks completed today. View tomorrow's briefing."
      );
    }
  }, [notificationsEnabled, notificationPermission, tasks, demoTasks, isDemoMode, notifiedTaskIds, globalTick]);

  // Mode tracking key constant matches specification
  const MODE_KEY = 'panicmode_mode';
  const REAL_TASKS_KEY = 'panicmode_tasks';
  const REAL_TRIAGE_KEY = 'panicmode_last_triage';
  const REAL_TRIAGE_TIME_KEY = 'panicmode_triage_time';
  const DEMO_TRIAGE_KEY = 'panicmode_demo_triage';

  const handleConnectCalendar = async (user: any, accessToken: string) => {
    setCalendarConnected(true);
    setCalendarAccessToken(accessToken);
    setCalendarUser(user);
    try {
      const rawEvents = await fetchCalendarEvents(accessToken);
      const slots = calculateTodaySlots(rawEvents);
      setFreeSlots(slots.freeSlots);
      setBusySlots(slots.busySlots);
    } catch (e) {
      console.error("Failed to fetch calendar slots on connect:", e);
    }
    setCurrentScreen("intake");
  };

  const handleDisconnectCalendar = () => {
    setCalendarConnected(false);
    setCalendarAccessToken(null);
    setCalendarUser(null);
    setFreeSlots([]);
    setBusySlots([]);
    setCurrentScreen("landing");
  };
  
  // Night Mode state with localStorage persistence
  const [isDarkMode, setIsDarkMode] = useState<boolean>(() => {
    if (typeof window !== "undefined") {
      const saved = safeLocalStorage.getItem("triage_ai_dark_mode");
      return saved === "true"; // Default to light mode (false), toggleable to dark mode
    }
    return false;
  });

  useEffect(() => {
    safeLocalStorage.setItem("triage_ai_dark_mode", String(isDarkMode));
  }, [isDarkMode]);

  const handleToggleDarkMode = () => {
    setIsDarkMode((prev) => !prev);
  };

  // Toast self-dismiss timer
  useEffect(() => {
    if (toast) {
      const timer = setTimeout(() => {
        setToast(null);
      }, 1500);
      return () => clearTimeout(timer);
    }
  }, [toast]);

  // Load tasks and triage cache on start
  useEffect(() => {
    const savedMode = safeSessionStorage.getItem(MODE_KEY);
    const demoActive = savedMode === "demo";
    setIsDemoMode(demoActive);

    // Load Real Tasks
    const storedReal = safeLocalStorage.getItem(REAL_TASKS_KEY);
    if (storedReal) {
      try {
        setTasks(JSON.parse(storedReal));
      } catch (e) {
        console.error("Failed to parse real tasks", e);
      }
    }

    if (demoActive) {
      setDemoTasks(getDemoTasks());
      
      const storedDemoTriage = safeSessionStorage.getItem(DEMO_TRIAGE_KEY);
      if (storedDemoTriage) {
        try {
          const parsed = JSON.parse(storedDemoTriage);
          setTriageResult(parsed);
          setTriageFromCache(true);
        } catch (e) {
          console.error("Failed to parse demo triage", e);
        }
      }
    } else {
      const storedTriage = safeLocalStorage.getItem(REAL_TRIAGE_KEY);
      const storedTime = safeLocalStorage.getItem(REAL_TRIAGE_TIME_KEY);
      if (storedTriage && storedTime) {
        const timeParsed = parseInt(storedTime, 10);
        const thirtyMinutes = 30 * 60 * 1000;
        if (Date.now() - timeParsed < thirtyMinutes) {
          try {
            const parsed = JSON.parse(storedTriage);
            setTriageResult(parsed);
            setTriageFromCache(true);
          } catch (e) {
            console.error("Failed to parse real triage", e);
          }
        } else {
          safeLocalStorage.removeItem(REAL_TRIAGE_KEY);
          safeLocalStorage.removeItem(REAL_TRIAGE_TIME_KEY);
        }
      }
    }
  }, []);

  // Debounced Real Task Auto-save
  useEffect(() => {
    if (!isDemoMode) {
      const handler = setTimeout(() => {
        safeLocalStorage.setItem(REAL_TASKS_KEY, JSON.stringify(tasks));
      }, 500);
      return () => clearTimeout(handler);
    }
  }, [tasks, isDemoMode]);
  
  // Draft message modal states
  const [draftTaskId, setDraftTaskId] = useState<string | null>(null);
  const [isDraftModalOpen, setIsDraftModalOpen] = useState(false);

  // Error feedback state
  const [analysisError, setAnalysisError] = useState<string | null>(null);

  // Retry and fallback states
  const [retryAttempt, setRetryAttempt] = useState(0);
  const [isDemoFallbackActive, setIsDemoFallbackActive] = useState(false);
  const [fallbackErrorType, setFallbackErrorType] = useState<string | undefined>(undefined);

  // Handle addition & deletion of tasks
  const handleAddTask = (newTask: Task) => {
    if (isDemoMode) {
      setDemoTasks((prev) => [...prev, newTask]);
    } else {
      setTasks((prev) => [...prev, newTask]);
      setToast({ message: "Saved to your device", type: "success" });
    }
  };

  const handleDeleteTask = (id: string) => {
    if (isDemoMode) {
      setDemoTasks((prev) => prev.filter((t) => t.id !== id));
    } else {
      setTasks((prev) => prev.filter((t) => t.id !== id));
      setToast({ message: "Saved to your device", type: "success" });
    }
  };

  const handleToggleCompleteTask = (id: string) => {
    if (isDemoMode) {
      setDemoTasks((prev) =>
        prev.map((t) => (t.id === id ? { ...t, isCompleted: !t.isCompleted } : t))
      );
    } else {
      setTasks((prev) => prev.map((t) => (t.id === id ? { ...t, isCompleted: !t.isCompleted } : t)));
      setToast({ message: "Saved to your device", type: "success" });
    }
  };

  const handleClearAllTasks = () => {
    if (isDemoMode) {
      setDemoTasks([]);
      safeSessionStorage.removeItem(DEMO_TRIAGE_KEY);
      setTriageResult(null);
    } else {
      setTasks([]);
      safeLocalStorage.removeItem(REAL_TASKS_KEY);
      safeLocalStorage.removeItem(REAL_TRIAGE_KEY);
      safeLocalStorage.removeItem(REAL_TRIAGE_TIME_KEY);
      setTriageResult(null);
      setTriageFromCache(false);
      setToast({ message: "All tasks cleared", type: "success" });
    }
  };

  // Load the crisis demo
  const handleLoadDemo = () => {
    safeSessionStorage.setItem(MODE_KEY, "demo");
    setIsDemoMode(true);
    setDemoTasks(getDemoTasks());
    safeSessionStorage.removeItem(DEMO_TRIAGE_KEY);
    setTriageResult(null);
    setTriageFromCache(false);
    setCurrentScreen("intake");
  };

  const exitDemoMode = () => {
    safeSessionStorage.removeItem(MODE_KEY);
    safeSessionStorage.removeItem(DEMO_TRIAGE_KEY);
    setIsDemoMode(false);
    setDemoTasks([]);
    
    // Load real tasks and triage
    const storedReal = safeLocalStorage.getItem(REAL_TASKS_KEY);
    if (storedReal) {
      try {
        setTasks(JSON.parse(storedReal));
      } catch (e) {
        console.error(e);
      }
    } else {
      setTasks([]);
    }

    const storedTriage = safeLocalStorage.getItem(REAL_TRIAGE_KEY);
    const storedTime = safeLocalStorage.getItem(REAL_TRIAGE_TIME_KEY);
    if (storedTriage && storedTime) {
      const timeParsed = parseInt(storedTime, 10);
      const thirtyMinutes = 30 * 60 * 1000;
      if (Date.now() - timeParsed < thirtyMinutes) {
        try {
          setTriageResult(JSON.parse(storedTriage));
          setTriageFromCache(true);
        } catch (e) {
          console.error(e);
        }
      } else {
        setTriageResult(null);
        setTriageFromCache(false);
      }
    } else {
      setTriageResult(null);
      setTriageFromCache(false);
    }

    // Return to the landing screen upon exiting demo mode
    setCurrentScreen("landing");
  };

  // Trigger Gemini deadline crisis analysis with retry & fallback
  const handleActivatePanic = async (forceFresh = false) => {
    const activeTasks = isDemoMode ? demoTasks : tasks;
    const tasksToSend = activeTasks.filter(t => !t.isCompleted);
    if (tasksToSend.length === 0) return;

    // 30-minute Cache Check
    const cacheTimeKey = isDemoMode ? 'panicmode_demo_triage_time' : 'panicmode_real_triage_time';
    const cacheTasksKey = isDemoMode ? 'panicmode_demo_triage_tasks' : 'panicmode_real_triage_tasks';
    const cacheResultKey = isDemoMode ? DEMO_TRIAGE_KEY : REAL_TRIAGE_KEY;

    const storedTime = isDemoMode ? safeSessionStorage.getItem(cacheTimeKey) : safeLocalStorage.getItem(cacheTimeKey);
    const storedTasks = isDemoMode ? safeSessionStorage.getItem(cacheTasksKey) : safeLocalStorage.getItem(cacheTasksKey);
    const storedResult = isDemoMode ? safeSessionStorage.getItem(cacheResultKey) : safeLocalStorage.getItem(cacheResultKey);

    const tasksJson = JSON.stringify(tasksToSend.map(t => ({
      id: t.id,
      name: t.name,
      deadlineDate: t.deadlineDate,
      deadlineTime: t.deadlineTime,
      hoursNeeded: t.hoursNeeded,
      category: t.category,
      importance: t.importance,
      blocksOthers: t.blocksOthers,
      isCompleted: t.isCompleted
    })));

    if (!forceFresh && storedTime && storedTasks && storedResult && storedTasks === tasksJson) {
      const timeParsed = parseInt(storedTime, 10);
      const thirtyMinutes = 30 * 60 * 1000;
      if (Date.now() - timeParsed < thirtyMinutes) {
        try {
          const parsed = JSON.parse(storedResult);
          setAnalysisError(null);
          setIsAnalyzing(true);
          setCurrentScreen("loading");
          // Cinematic loading feel for cache (brief delay to show progress)
          await new Promise(resolve => setTimeout(resolve, 1500));
          setTriageResult(parsed);
          setTriageFromCache(true);
          setIsAnalyzing(false);
          setCurrentScreen("dashboard");
          return;
        } catch (e) {
          // Proceed to API call if parsing fails
        }
      }
    }
    
    setAnalysisError(null);
    setIsAnalyzing(true);
    setCurrentScreen("loading");
    setRetryAttempt(0);
    setIsDemoFallbackActive(false);
    setFallbackErrorType(undefined);

    // Refresh calendar slots before submitting to include the latest event data
    let currentFreeSlots = freeSlots;
    let currentBusySlots = busySlots;
    if (calendarConnected && calendarAccessToken) {
      try {
        const rawEvents = await fetchCalendarEvents(calendarAccessToken);
        const slots = calculateTodaySlots(rawEvents);
        currentFreeSlots = slots.freeSlots;
        currentBusySlots = slots.busySlots;
        setFreeSlots(slots.freeSlots);
        setBusySlots(slots.busySlots);
      } catch (e) {
        console.error("Failed to refresh calendar slots on analyze trigger:", e);
      }
    }

    // The loading screen is designed to run through steps at 2-second intervals.
    // We will initiate the server request, but wait until at least 8 seconds have elapsed 
    // to match the visual checklist pacing and make the experience feel highly professional and cinematic.
    const startTime = Date.now();

    let attempt = 1;
    let finalResult: TriageResult | null = null;
    let success = false;
    let lastError: any = null;

    while (attempt <= 3) {
      try {
        const response = await fetch("/api/analyze", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            tasks: tasksToSend,
            currentTime: new Date().toISOString(),
            calendarConnected,
            freeSlots: currentFreeSlots,
            busySlots: currentBusySlots,
            totalFreeTime: (currentFreeSlots.reduce((sum, slot) => sum + slot.durationMinutes, 0) / 60).toFixed(1).replace(".0", ""),
          }),
        });

        const responseText = await response.text();
        let parsedData: any = null;
        let isJson = false;
        try {
          parsedData = JSON.parse(responseText);
          isJson = true;
        } catch {
          isJson = false;
        }

        if (!response.ok) {
          const errorMsg = isJson ? (parsedData.error || "Analysis failed.") : "Server returned an unexpected response format.";
          const errorCode = isJson ? (parsedData.code || response.status) : response.status;
          const customErr = new Error(errorMsg);
          (customErr as any).code = errorCode;
          throw customErr;
        }

        if (!isJson || !parsedData) {
          throw new Error("Server response is not valid JSON.");
        }

        // If the server responded with 200 OK but the JSON contains an error field
        if (parsedData.error) {
          const errorMsg = parsedData.error;
          const errorCode = parsedData.code || 500;
          const errorType = parsedData.errorType || "api_error";
          const customErr = new Error(errorMsg);
          (customErr as any).code = errorCode;
          (customErr as any).errorType = errorType;
          throw customErr;
        }

        finalResult = parsedData;
        success = true;
        break; // Success, exit retry loop!
      } catch (err: any) {
        console.error(`Attempt ${attempt} failed:`, err);
        lastError = err;

        const errCode = err?.code;
        const errType = err?.errorType;
        if (errCode === 429 || errCode === 401 || errCode === 403 || errType === "quota_exceeded" || errType === "invalid_key" || errType === "missing_key") {
          // Fatal non-retryable error detected. Skipping further retries.
          break;
        }

        if (attempt < 3) {
          const nextAttempt = attempt + 1;
          setRetryAttempt(nextAttempt);
          const waitTime = attempt === 1 ? 3000 : 5000;
          await new Promise((resolve) => setTimeout(resolve, waitTime));
          attempt++;
        } else {
          // All 3 attempts failed
          break;
        }
      }
    }

    if (success && finalResult) {
      // Calculate remaining time for the checklist animation (total 8 seconds)
      const elapsed = Date.now() - startTime;
      const minAnimationTime = 8000; // 8s
      const delayNeeded = Math.max(0, minAnimationTime - elapsed);

      await new Promise((resolve) => setTimeout(resolve, delayNeeded));

      const filtered = filterTriageResult(finalResult, tasksToSend);
      const safeParsed = safeParseResult(filtered, tasksToSend);
      setTriageResult(safeParsed);
      if (isDemoMode) {
        safeSessionStorage.setItem(DEMO_TRIAGE_KEY, JSON.stringify(safeParsed));
        safeSessionStorage.setItem('panicmode_demo_triage_tasks', tasksJson);
        safeSessionStorage.setItem('panicmode_demo_triage_time', Date.now().toString());
      } else {
        safeLocalStorage.setItem(REAL_TRIAGE_KEY, JSON.stringify(safeParsed));
        safeLocalStorage.setItem('panicmode_real_triage_tasks', tasksJson);
        safeLocalStorage.setItem(REAL_TRIAGE_TIME_KEY, Date.now().toString());
      }
      setTriageFromCache(false);
      setIsAnalyzing(false);
      setCurrentScreen("dashboard");
    } else {
      // Determine what kind of fallback error we hit
      let errorType: string | undefined = undefined;
      if (lastError) {
        const errMsg = String(lastError.message).toLowerCase();
        if (lastError.code === 429 || lastError.errorType === "quota_exceeded" || errMsg.includes("quota") || errMsg.includes("limit") || errMsg.includes("too many")) {
          errorType = "quota_exceeded";
        } else if (lastError.code === 401 || lastError.errorType === "invalid_key" || lastError.errorType === "missing_key" || errMsg.includes("api key") || errMsg.includes("credentials")) {
          errorType = "invalid_key";
        } else if (lastError.code === 503 || lastError.errorType === "unavailable" || errMsg.includes("503") || errMsg.includes("unavailable") || errMsg.includes("busy") || errMsg.includes("demand") || errMsg.includes("overload")) {
          errorType = "unavailable";
        }
      }
      setFallbackErrorType(errorType);

      // Check if current tasks match the full demo dataset criteria (all key tasks must be present)
      const hasPresentation = tasksToSend.some(t => t.name.toLowerCase().includes("presentation"));
      const hasElectricity = tasksToSend.some(t => t.name.toLowerCase().includes("electricity"));
      const hasStandup = tasksToSend.some(t => t.name.toLowerCase().includes("standup"));
      const isDemo = tasksToSend.length >= 3 && hasPresentation && hasElectricity && hasStandup;

      // Wait remaining time of cinematic 8s or brief delay if immediate
      const elapsed = Date.now() - startTime;
      const delayNeeded = Math.max(1000, 4000 - elapsed);
      await new Promise((resolve) => setTimeout(resolve, delayNeeded));

      setIsDemoFallbackActive(true);

      let chosenResult: TriageResult;

      if (isDemo) {
        // Map the hardcoded DEMO_FALLBACK data with actual task IDs
        const mappedFallback = mapFallbackResultToActualIds(DEMO_FALLBACK, tasksToSend);
        if (calendarConnected && busySlots && busySlots.length > 0) {
          mappedFallback.conflictDetection = mappedFallback.conflictDetection || [];
          busySlots.forEach((slot, index) => {
            const task = tasksToSend[index % tasksToSend.length];
            mappedFallback.conflictDetection.push({
              involvedTaskIds: [task.id],
              description: `Your focus block for "${task.name}" overlaps with your Google Calendar event: "${slot.title || "Busy Slot"}" scheduled from ${slot.start} to ${slot.end}.`,
              severity: "high",
              resolution: `Postpone the "${task.name}" focus window to your next available free slot or reschedule the "${slot.title || "Busy Slot"}" meeting.`,
            });
          });
        }
        chosenResult = filterTriageResult(mappedFallback, tasksToSend);
      } else {
        // Dynamically generate a high-fidelity local fallback result tailored to the custom tasks!
        const dynamicFallback = generateDynamicTriageResult(
          tasksToSend, 
          new Date().toISOString(),
          calendarConnected,
          freeSlots,
          busySlots
        );
        chosenResult = filterTriageResult(dynamicFallback, tasksToSend);
      }
      
      const safeParsed = safeParseResult(chosenResult, tasksToSend);
      setTriageResult(safeParsed);
      if (isDemoMode) {
        safeSessionStorage.setItem(DEMO_TRIAGE_KEY, JSON.stringify(safeParsed));
      } else {
        safeLocalStorage.setItem(REAL_TRIAGE_KEY, JSON.stringify(safeParsed));
        safeLocalStorage.setItem(REAL_TRIAGE_TIME_KEY, Date.now().toString());
      }
      setTriageFromCache(false);
      setIsAnalyzing(false);
      setCurrentScreen("dashboard");
    }
  };

  // Action to handle specific task selection
  const handleSelectTask = (taskId: string) => {
    setSelectedTaskId(taskId);
    setCurrentScreen("detail");
  };

  // Action to open the draft message bottom sheet
  const handleOpenDraftModal = (taskId: string) => {
    setDraftTaskId(taskId);
    setIsDraftModalOpen(true);
  };

  const totalFreeMinutes = freeSlots.reduce((sum, slot) => sum + slot.durationMinutes, 0);
  const totalFreeHours = totalFreeMinutes / 60;
  const isCongested = calendarConnected && totalFreeMinutes > 0 && totalFreeHours < 3;
  const bookedPercentage = Math.round(((720 - totalFreeMinutes) / 720) * 100);
  
  const morningCheckAlert = isCongested 
    ? `Your calendar is ${bookedPercentage}% booked today. TriageAI is on standby if deadlines get tight.`
    : null;

  const activeTasks = isDemoMode ? demoTasks : tasks;

  return (
    <div className={`min-h-screen select-none antialiased transition-colors duration-300 ${isDarkMode ? "bg-slate-950 text-slate-100" : "bg-slate-50 text-slate-900"}`}>
      <div className={`max-w-[480px] mx-auto min-h-screen flex flex-col relative transition-colors duration-300 ${isDarkMode ? "bg-slate-900 border-slate-800 text-slate-100 shadow-2xl shadow-black/40" : "bg-white border-x border-slate-100 text-slate-900 shadow-lg"}`}>
        
        {/* Sticky Demo Banner at the top of the container so it never overlaps other elements */}
        {isDemoMode && (
          <div
            className={`sticky top-0 w-full h-10 shrink-0 px-4 flex items-center justify-between border-b z-[150] font-sans transition-colors duration-300 ${
              isDarkMode 
                ? "bg-slate-900/95 border-slate-800 text-slate-100" 
                : "bg-slate-100/95 border-slate-200 text-slate-800"
            }`}
            id="demo-mode-banner"
          >
            <div className="flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 animate-pulse" />
              <span className="text-[10px] font-black text-indigo-500 dark:text-indigo-400 tracking-wider">
                DEMO MODE ACTIVE
              </span>
            </div>
            <button
              onClick={exitDemoMode}
              className="text-[10px] font-extrabold uppercase bg-indigo-600 hover:bg-indigo-700 text-white px-2.5 py-1 rounded cursor-pointer transition-all active:scale-95"
            >
              Exit Demo
            </button>
          </div>
        )}

        {/* Render appropriate screen */}
        {currentScreen === "landing" && (
          <LandingScreen
            isDarkMode={isDarkMode}
            onToggleDarkMode={handleToggleDarkMode}
            tasks={activeTasks}
            triageResult={triageResult}
            onActivatePanic={() => {
              if (activeTasks.length > 0) {
                if (triageResult) {
                  setCurrentScreen("dashboard");
                } else {
                  handleActivatePanic();
                }
              } else {
                setCurrentScreen("intake");
              }
            }}
            onMorningCheckClick={() => {
              setIsBriefingOpen(true);
            }}
            onAddTaskClick={() => {
              if (isDemoMode) {
                exitDemoMode();
              }
              setCurrentScreen("intake");
            }}
            onLoadDemo={handleLoadDemo}
            isDemoMode={isDemoMode}
            onExitDemo={exitDemoMode}
            calendarConnected={calendarConnected}
            onConnectCalendarClick={() => setCurrentScreen("connectCalendar")}
            notificationPermission={notificationPermission}
            notificationsEnabled={notificationsEnabled}
            onToggleNotifications={toggleNotifications}
            onRequestNotificationPermission={requestNotificationPermission}
            onTriggerTestBriefing={handleTriggerTestBriefing}
          />
        )}

        {currentScreen === "connectCalendar" && (
          <ConnectCalendarScreen
            isDarkMode={isDarkMode}
            onToggleDarkMode={handleToggleDarkMode}
            onConnect={handleConnectCalendar}
            onSkip={() => {
              setCalendarConnected(false);
              setCalendarAccessToken(null);
              setCalendarUser(null);
              setFreeSlots([]);
              setBusySlots([]);
              setCurrentScreen("intake");
            }}
          />
        )}

        {currentScreen === "intake" && (
          <IntakeScreen
            isDarkMode={isDarkMode}
            onToggleDarkMode={handleToggleDarkMode}
            tasks={activeTasks}
            onAddTask={handleAddTask}
            onDeleteTask={handleDeleteTask}
            onActivatePanic={handleActivatePanic}
            onBack={() => setCurrentScreen("landing")}
            calendarConnected={calendarConnected}
            freeSlots={freeSlots}
            busySlots={busySlots}
            onDisconnectCalendar={handleDisconnectCalendar}
            isDemoMode={isDemoMode}
            onLoadDemo={handleLoadDemo}
            onToggleCompleteTask={handleToggleCompleteTask}
            onClearAllTasks={handleClearAllTasks}
            onShowToast={(msg, type) => setToast({ message: msg, type })}
            onConnectCalendarClick={() => setCurrentScreen("connectCalendar")}
          />
        )}

        {currentScreen === "loading" && isAnalyzing && (
          <LoadingScreen isDarkMode={isDarkMode} taskCount={activeTasks.length} retryAttempt={retryAttempt} />
        )}

        {/* Friendly Error on Loading screen failure */}
        {currentScreen === "loading" && !isAnalyzing && analysisError && (
          <div className={`flex flex-col items-center justify-center min-h-[85vh] px-6 text-center ${isDarkMode ? "bg-slate-900 text-slate-100" : "bg-white text-slate-900"}`} id="error-screen">
            <div className={`w-16 h-16 rounded-full flex items-center justify-center mb-6 ${isDarkMode ? "bg-red-950 text-red-400" : "bg-red-100 text-red-600"}`}>
              <XCircle size={36} />
            </div>
            
            <h3 className={`font-display text-xl font-bold mb-2 ${isDarkMode ? "text-slate-50" : "text-slate-950"}`}>
              Crisis Triage Interrupted
            </h3>
            
            <p className={`text-sm max-w-[280px] leading-relaxed mb-6 ${isDarkMode ? "text-slate-400" : "text-slate-600"}`}>
              {analysisError}
            </p>

            <div className="w-full space-y-3 max-w-xs">
              <button
                onClick={handleActivatePanic}
                className="w-full h-12 bg-gradient-to-r from-red-600 to-red-500 hover:from-red-700 hover:to-red-600 text-white font-semibold rounded-xl shadow-md flex items-center justify-center gap-2 transition-all cursor-pointer"
              >
                <RefreshCw size={16} /> Retry Analysis
              </button>
              
              <button
                onClick={() => setCurrentScreen("intake")}
                className={`w-full h-12 font-medium rounded-xl flex items-center justify-center gap-2 transition-all cursor-pointer ${
                  isDarkMode 
                    ? "bg-slate-800 hover:bg-slate-700 text-slate-200" 
                    : "bg-slate-100 hover:bg-slate-200 text-slate-800"
                }`}
              >
                Modify Your Tasks
              </button>
            </div>
          </div>
        )}

        {currentScreen === "dashboard" && triageResult && (
          <CrisisDashboard
            isDarkMode={isDarkMode}
            onToggleDarkMode={handleToggleDarkMode}
            triage={triageResult}
            tasks={activeTasks}
            onSelectTask={handleSelectTask}
            onOpenDraftModal={handleOpenDraftModal}
            onReAnalyze={() => handleActivatePanic(true)}
            onBackToIntake={() => setCurrentScreen("intake")}
            onBackToLanding={() => setCurrentScreen("landing")}
            isDemoFallbackActive={isDemoFallbackActive}
            fallbackErrorType={fallbackErrorType}
            calendarConnected={calendarConnected}
            calendarAccessToken={calendarAccessToken}
            onDisconnectCalendar={handleDisconnectCalendar}
            globalTick={globalTick}
            onToggleCompleteTask={handleToggleCompleteTask}
          />
        )}

        {currentScreen === "detail" && triageResult && selectedTaskId && (
          <TaskDetail
            isDarkMode={isDarkMode}
            taskId={selectedTaskId}
            triage={triageResult}
            tasks={activeTasks}
            onBack={() => setCurrentScreen("dashboard")}
            onOpenDraftModal={handleOpenDraftModal}
          />
        )}

        {/* Draft Message Bottom Sheet */}
        {triageResult && (
          <DraftMessageModal
            isDarkMode={isDarkMode}
            isOpen={isDraftModalOpen}
            taskId={draftTaskId}
            triage={triageResult}
            tasks={activeTasks}
            onClose={() => {
              setIsDraftModalOpen(false);
              setDraftTaskId(null);
            }}
          />
        )}

        {/* Real-time Toast Notification */}
        <AnimatePresence>
          {toast && (
            <motion.div
              initial={{ opacity: 0, y: 40 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 30 }}
              className="fixed bottom-20 left-0 right-0 max-w-[480px] mx-auto px-4 z-[9999] pointer-events-none"
            >
              <div className="bg-emerald-500 text-slate-950 font-black px-4 py-2.5 rounded-xl shadow-lg flex items-center justify-center gap-2 text-xs uppercase tracking-wider mx-auto w-fit">
                <span>✓</span> {toast.message}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Morning Briefing Overlay Screen */}
        <AnimatePresence>
          {isBriefingOpen && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className={`fixed inset-0 z-[200] flex flex-col font-sans p-6 justify-between max-w-[480px] mx-auto border transition-all duration-300 ${
                isDarkMode 
                  ? "bg-slate-950/98 text-white border-slate-800" 
                  : "bg-white/98 text-slate-900 border-slate-100"
              }`}
            >
              <div className="space-y-6 overflow-y-auto">
                <div className={`flex items-center justify-between border-b pb-4 ${isDarkMode ? "border-white/10" : "border-slate-100"}`}>
                  <div className="flex items-center gap-2">
                    <span className="text-xl">☀️</span>
                    <div>
                      <h2 className={`text-xs font-black tracking-widest uppercase ${isDarkMode ? "text-[#fbbf24]" : "text-amber-600"}`}>MORNING BRIEFING</h2>
                      <p className={`text-[9px] ${isDarkMode ? "text-white/50" : "text-slate-500"}`}>Generated by TriageAI</p>
                    </div>
                  </div>
                  <button
                    onClick={() => setIsBriefingOpen(false)}
                    className={`p-1.5 rounded-lg border transition-colors cursor-pointer ${
                      isDarkMode 
                        ? "border-white/10 hover:bg-white/5 text-white/70 hover:text-white" 
                        : "border-slate-200 hover:bg-slate-50 text-slate-500 hover:text-slate-800"
                    }`}
                  >
                    ✕
                  </button>
                </div>

                {triageResult ? (
                  <div className="space-y-5">
                    <div className={`rounded-2xl p-4 text-center space-y-1.5 border transition-colors ${
                      isDarkMode ? "bg-white/5 border-white/10" : "bg-slate-50 border-slate-200/50"
                    }`}>
                      <span className={`text-[9px] font-bold uppercase tracking-widest block ${isDarkMode ? "text-white/40" : "text-slate-500"}`}>
                        Overall Risk Score
                      </span>
                      <span className="text-3xl font-black text-[#dc2626]">
                        {triageResult.overallRiskScore}/100
                      </span>
                      <p className={`text-xs font-medium px-2 leading-relaxed ${isDarkMode ? "text-white/80" : "text-slate-700"}`}>
                        {triageResult.overallRiskRationale || "Your scheduled day is tightly packed. Immediate planning is recommended."}
                      </p>
                    </div>

                    {/* Recommendations */}
                    <div className="space-y-3">
                      <h3 className={`text-[10px] font-black uppercase tracking-widest ${isDarkMode ? "text-white/40" : "text-slate-500"}`}>
                        RECOMMENDED ACTION PLAN
                      </h3>
                      <div className="space-y-2">
                        <div className={`p-3 border rounded-xl space-y-1 transition-colors ${
                          isDarkMode ? "bg-rose-950/20 border-rose-900/30" : "bg-rose-50/50 border-rose-100/80"
                        }`}>
                          <h4 className={`text-xs font-bold ${isDarkMode ? "text-rose-300" : "text-rose-700"}`}>1. Protect Focus Blocks</h4>
                          <p className={`text-[10px] leading-relaxed ${isDarkMode ? "text-white/70" : "text-slate-600"}`}>
                            Secure slots early before other meetings get booked. Clear out external distractions.
                          </p>
                        </div>
                        <div className={`p-3 border rounded-xl space-y-1 transition-colors ${
                          isDarkMode ? "bg-amber-950/20 border-amber-900/30" : "bg-amber-50/50 border-amber-100/80"
                        }`}>
                          <h4 className={`text-xs font-bold ${isDarkMode ? "text-amber-300" : "text-amber-700"}`}>2. Prepare Draft Communications</h4>
                          <p className={`text-[10px] leading-relaxed ${isDarkMode ? "text-white/70" : "text-slate-600"}`}>
                            We've pre-drafted status reports and risk heads-ups. Keep them ready to dispatch if a slot slips.
                          </p>
                        </div>
                        <div className={`p-3 border rounded-xl space-y-1 transition-colors ${
                          isDarkMode ? "bg-emerald-950/20 border-emerald-900/30" : "bg-emerald-50/50 border-emerald-100/80"
                        }`}>
                          <h4 className={`text-xs font-bold ${isDarkMode ? "text-emerald-300" : "text-emerald-700"}`}>3. Execute in Priority Order</h4>
                          <p className={`text-[10px] leading-relaxed ${isDarkMode ? "text-white/70" : "text-slate-600"}`}>
                            Follow the task priority list. Complete high-criticality items before touching medium priority jobs.
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="py-20 text-center space-y-3">
                    <span className="text-3xl block">🚨</span>
                    <p className={`text-sm font-bold italic ${isDarkMode ? "text-white/40" : "text-slate-400"}`}>
                      Analysis is required to populate this briefing.
                    </p>
                    <button
                      onClick={() => {
                        setIsBriefingOpen(false);
                        handleActivatePanic();
                      }}
                      className="h-10 bg-rose-600 hover:bg-rose-700 text-white font-bold rounded-xl px-5 text-xs transition-all uppercase tracking-wider cursor-pointer"
                    >
                      Run Analysis
                    </button>
                  </div>
                )}
              </div>

              <button
                onClick={() => {
                  setIsBriefingOpen(false);
                  if (triageResult) {
                    setCurrentScreen("dashboard");
                  } else {
                    setCurrentScreen("intake");
                  }
                }}
                className="w-full h-12 rounded-xl text-xs font-bold tracking-wider uppercase bg-[#fbbf24] hover:bg-[#f59e0b] text-slate-950 transition-all cursor-pointer mt-6"
              >
                Let's Go
              </button>
            </motion.div>
          )}
        </AnimatePresence>

      </div>
    </div>
  );
}
