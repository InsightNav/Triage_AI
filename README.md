# 🚨💎 TriageAI

### AI-Powered Deadline Crisis Manager
*Vib2Ship Google AI Hackathon 2026*

[![Live Demo](https://img.shields.io/badge/Live-Demo-EA4335?style=for-the-badge)](https://ais-pre-i5i5d54dnlo5bit2agwz26-930108873317.asia-southeast1.run.app)
[![Built with Gemini](https://img.shields.io/badge/Built%20with-Gemini%20AI-4285F4?style=for-the-badge)](https://ai.google.dev)

> When your schedule breaks, TriageAI builds the rescue plan.

| | |
|---|---|
| **Category** | AI Productivity |
| **Team** | Solo Developer |
| **Build Time** | Under 4 Days |
| **Primary AI** | Google Gemini API (`gemini-3.5-flash` with fallback chain) |
| **Stack** | React · TypeScript · Express · Firebase Auth · Google Calendar API |

## 🎯 What It Does

TriageAI is an AI crisis commander for your deadlines. When you're overwhelmed by converging commitments, it reads your real schedule, predicts which deadlines will be missed, detects conflicts, and generates an executable rescue plan — complete with draft communications and calendar blocks — in under 30 seconds.

Most productivity tools assume you're already organized. TriageAI is built for the moment that assumption breaks down.

## 🧠 The Problem

> *"Students, professionals, and entrepreneurs frequently miss deadlines, assignments, meetings, bill payments, interviews, and important commitments."*

Traditional calendar apps show what exists. Traditional task managers sort by static priority. Neither reasons about whether your schedule is actually survivable. TriageAI does.

| Problem | How TriageAI Solves It |
|---|---|
| Proactively assists in planning | Generates a chronological rescue plan with hour-by-hour focus blocks, written directly into Google Calendar |
| Proactive assistance | Morning briefing auto-analyzes saved tasks on app open and flags risks before a crisis forms |
| Prioritizing tasks | Priority Stack ranks tasks by true risk, calendar availability, and conflict severity — not just deadline proximity |
| Frequently missing deadlines | Calculates individual survival probability per task, warning users before it's too late |
| Completing tasks before deadlines | Identifies the cheapest sacrifice to protect priority work, and pre-drafts communications to renegotiate what can't be saved |

## ✨ Features

### Core AI Engine

- **🧠 Risk Score Engine** — Gemini produces an overall workload risk score (0–100) with a specific rationale referencing real task names and conflicts
- **📉 Deadline Failure Prediction** — Individual failure probability calculated per task based on hours needed, time available, and conflicts
- **🔍 Conflict Detection** — Identifies tasks that physically cannot both be completed as scheduled, with a concrete resolution
- **📊 Priority Stack** — Tasks ranked by real risk, not static labels
- **⏱️ Rescue Plan Timeline** — Hour-by-hour schedule built around actual free time from Google Calendar
- **🛌 Human Lifestyle Guardrails** — No work scheduled between 11 PM–7 AM, meals protected, 90-minute focus limit with mandatory breaks, realistic transition gaps between tasks
- **🪜 Rescue Escalation Ladder** — When time is insufficient, Gemini works through five tiers (reclaim lifestyle time, optimize mandatory activities, creative scheduling, minimum viable delivery, reschedule with a draft message) before ever recommending a task be dropped
- **💬 AI-Generated Draft Communications** — Pre-written, contextual messages for tasks that must be delayed or sacrificed
- **🔄 "What If I Skip This?" Simulation** — Live re-analysis showing the exact risk score impact of dropping a task
- **⛓️ AI Reasoning Chain** — Visible AI thinking on every task: Noticed → Inferred → Decided
- **⚠️ Late Session Warning Flag** — Any rescue plan timeline block ending after 9:00 PM automatically displays an amber warning badge ("⚠ Late session — only if necessary"), in both light and dark mode
- **🎭 Social Buffer Acknowledgment** — When a leisure or social activity is kept in an overloaded schedule, Gemini appends a clear trade-off note suggesting it be shortened if the day runs behind

### Calendar Integration

- **📅 Google Calendar Integration** — Reads real free/busy time across the active day window
- **💾 Save Rescue Plan to Calendar** — Writes structured focus blocks directly into Google Calendar, marked busy
- **👁️ Today's Schedule Visualization** — Visual hour bar showing free and busy periods at a glance

### Experience

- **🌅 Morning Briefing** — Proactive daily risk summary on app open, no prompting required
- **🎬 Demo Mode** — One-tap crisis scenario with four pre-loaded tasks, fully isolated from real user data
- **💾 Task Persistence** — Tasks saved to on-device localStorage. No account required. Nothing stored on any server
- **⚙️ Offline Fallback Engine** — Local mathematical engine generates structured triage output if Gemini is unavailable
- **🌗 Dark and Light Mode** — Full theme support across all screens

## 🛠️ Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React 18, TypeScript, Vite |
| Backend | Express, Node.js |
| AI | Google Gemini API via `@google/genai` SDK |
| Calendar | Google Calendar API v3 |
| Auth | Firebase Authentication (Google Sign-In) |
| Storage | localStorage / sessionStorage (on-device, privacy-first) |
| Hosting | Google Cloud via Google AI Studio |

```
┌───────────────────────────────────────────────┐
│                  FRONTEND                     │
│      React 18 + TypeScript + Vite             │
└───────────┬────────────────────┬──────────────┘
            │ OAuth flow         │ Fetch API
┌───────────▼──────────┐   ┌─────▼───────────────┐
│   Firebase Auth      │   │   Express Server    │
│   (Google Sign-In)   │   │   (Node.js)         │
└──────────────────────┘   └────────┬────────────┘
                                    │
                       ┌────────────▼────────────┐
                       │   Google Gemini API     │
                       │   (@google/genai SDK)   │
                       └─────────────────────────┘
```

## 🤖 How Gemini Is Used

TriageAI sends Gemini a structured payload of tasks and (optionally) real Google Calendar free/busy data. Gemini returns a strict JSON schema:

```json
{
  "overallRiskScore": 87,
  "overallRiskLevel": "critical",
  "overallRiskRationale": "Explains the exact conflict using real task names",
  "deadlineFailurePredictions": [
    {
      "taskId": "task-1",
      "failureProbability": 0.85,
      "failureReason": "Specific reason referencing task data",
      "isRecoverable": true,
      "recoveryRequires": "Specific recovery action"
    }
  ],
  "conflictDetection": [
    {
      "involvedTaskIds": ["task-1", "task-2"],
      "description": "Specific conflict description",
      "severity": "high",
      "resolution": "Concrete resolution strategy"
    }
  ],
  "priorityStack": [
    {
      "taskId": "task-1",
      "riskScore": 90,
      "riskLevel": "critical",
      "startBy": "9:30 AM",
      "rationale": "Specific reasoning",
      "statusColor": "red",
      "sacrificeRecommended": false,
      "sacrificeType": "none",
      "sacrificeRationale": ""
    }
  ],
  "rescuePlan": {
    "summary": "Full strategy overview",
    "timeBlocks": [
      {
        "startTime": "9:30 AM",
        "endTime": "11:00 AM",
        "action": "Specific instruction, not a placeholder",
        "taskId": "task-1",
        "isNonNegotiable": true
      }
    ]
  },
  "draftCommunications": [
    {
      "forTaskId": "task-2",
      "type": "reschedule",
      "body": "Ready-to-send message",
      "afterSendingRiskDropsTo": 45
    }
  ],
  "reasoningChain": [
    {
      "stepNumber": 1,
      "observation": "What the AI noticed in the data",
      "inference": "What that signal means",
      "decision": "What was decided as a result"
    }
  ]
}
```

**Model fallback chain:** `gemini-3.5-flash` → `gemini-3.1-flash-lite` → `gemini-flash-latest`, with automatic retry on rate limits or temporary downtime.

**System prompt enforces:**

- No internal task IDs in any user-visible text — always real task names
- Human Lifestyle Constraints — sleep windows, meal protection, 90-minute focus limits
- Rescue Escalation Ladder — five tiers exhausted before recommending a drop
- Unique, individually calculated failure probabilities per task (never a default fallback value)
- Every task must appear somewhere on the rescue timeline — none omitted
- Late session flagging — any block ending after 9:00 PM triggers a visible warning badge in the UI
- Social buffer acknowledgment — kept leisure activities get an explicit trade-off note

## 🤖 Agentic Behaviors

TriageAI doesn't just respond to prompts — it perceives context and acts autonomously:

| Behavior | Trigger | What It Does |
|---|---|---|
| 🌅 Proactive morning briefing | App opened with saved tasks | Auto-analyzes task landscape and flags risks without being asked |
| ⚡ Cascade conflict detection | Task list submitted | Identifies that Task A being late makes Task B impossible — surfaces this unprompted |
| ⚡ Sacrifice recommendation | Analysis complete | Autonomously identifies the lowest-cost task to drop and explains why |
| 🔄 Skip simulation | User taps "What if I skip?" | Re-runs full analysis on the modified task list and returns a comparative risk score |
| ⚡ Draft communication | Sacrifice identified | Writes a professional, contextual message using real task names — no user input required |
| ⚡ Calendar block creation | User confirms rescue plan | Creates focus events directly in Google Calendar |
| 🌅 Proactive deadline warnings | Landing page loads | Detects tasks under 60 minutes from deadline and surfaces alerts |
| 🌅 Lifestyle-aware scheduling | Every rescue plan generated | Validates every time block against sleep, meal, and break rules before output |
| 🪜 Escalation ladder reasoning | Available time is insufficient | Works through 5 tiers of optimization before recommending a drop |
| ⚠️ Late session flagging | Timeline block ends after 9:00 PM | Automatically renders an amber warning badge without user action |
| 🎭 Social buffer acknowledgment | Leisure activity kept in an overloaded day | Appends a trade-off note suggesting it be shortened if running behind |
| ⚙️ Offline fallback | Gemini unavailable | Local engine generates structured triage output to keep the app usable |

## 🗺️ User Journey

```
1. Open TriageAI
   Landing page loads saved tasks or shows a clean empty state

2. Connect Google Calendar (optional)
   See your real free and busy time for today

3. Add your tasks
   Name, deadline, hours needed, category, importance

4. Tap "Activate TriageAI"
   Everything sent to Gemini for analysis

5. Review the Crisis Dashboard
   Risk score, conflicts, ranked priority stack, reasoning chain

6. Take action
   Run skip simulations, copy draft messages, save the
   rescue plan as protected focus blocks in your calendar
```

## 🎬 Demo Script (2 Minutes)

**Try it without setup** — tap "Load Crisis Demo" on the landing page. No account or calendar connection required.

| Step | Time | Action | Say |
|---|---|---|---|
| 1 | 0:00–0:15 | Load demo scenario — 4 tasks pre-load | "Four real commitments. One person. Not enough time." |
| 2 | 0:15–0:40 | Tap Activate. Risk score counts up to 87/100 CRITICAL | "It read every task and detected the standup and presentation physically cannot both happen." |
| 3 | 0:40–0:55 | Show conflict detection | "The AI noticed the standup consumes the only window for the presentation. It caught what I missed." |
| 4 | 0:55–1:15 | Tap "What if I skip this?" — score drops to 45 | "The AI just simulated dropping one task and showed exactly how much breathing room that creates." |
| 5 | 1:15–1:35 | Tap "Draft Message" — view AI-written email | "It didn't just tell me to skip it. It wrote the message I need to send." |
| 6 | 1:35–1:50 | Tap "View Details" — show reasoning chain | "This is the AI showing its work. Noticed, Inferred, Decided. Not a black box." |
| 7 | 1:50–2:00 | Tap "Save Rescue Plan to Calendar" | "And the focus blocks are now in my Google Calendar. Nothing can be scheduled over them." |

## 🚀 Getting Started

### Prerequisites

- Node.js 18+
- A Google Gemini API key — [get one here](https://aistudio.google.com)
- A Firebase project with Authentication enabled
- Google Cloud OAuth credentials with Calendar API enabled

### Installation

```bash
git clone https://github.com/InsightNav/Triage_AI.git
cd Triage_AI

npm install

cp .env.example .env
```

Fill in your API keys in `.env`, then run:

```bash
npm run dev
```

The app runs at `http://localhost:3000`.

### Environment Variables

```bash
GEMINI_API_KEY=your_gemini_api_key
FIREBASE_API_KEY=your_firebase_api_key
FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
FIREBASE_PROJECT_ID=your_project_id
GOOGLE_CLIENT_ID=your_google_oauth_client_id
GOOGLE_CLIENT_SECRET=your_google_oauth_client_secret
GOOGLE_REDIRECT_URI=http://localhost:3000/api/auth/callback
PORT=3000
```

## 🔒 Privacy

All task data is stored locally on your device using localStorage. No account is required. No task data touches any server. Calendar access is scoped only to the focus blocks you choose to create — nothing else is read or modified.

## ⚠️ Current Limitations

- Optimized for single-day (24-hour) crisis resolution — not yet built for multi-week planning
- Reads the primary Google Calendar only — does not scan shared or external calendars
- Tasks persist on-device only — not synced across multiple devices

## 🗺️ Roadmap

- **Direct messaging integration** — send AI-drafted messages via Gmail or Slack with one tap, no copy-paste
- **Bi-directional live calendar sync** — real-time alerts when a new meeting conflicts with a protected focus block
- **Multi-day crisis planning** — extend triage beyond 24 hours for multi-week assignments and exam periods
- **Team triage** — share a session with your team to coordinate deadline crunches
- **AI habit learning** — automatically adjust future time estimates based on how long tasks actually take you

## 🏆 Why TriageAI Wins

Most productivity tools assume you are already organized. TriageAI is built for the moment that assumption breaks down. When deadlines collide and time runs out, it steps in as an AI crisis commander — analyzing your real schedule, detecting conflicts, and handing you an executable plan before the damage is done.

The AI does not just give advice. It detects which tasks will fail, identifies the cheapest sacrifice, writes the communication to send, creates the calendar blocks to protect your focus time, and shows its reasoning at every step. That is not a chatbot wrapper — that is a genuine AI agent working on your behalf.

Built solo in under 4 days using Google Gemini, Google Calendar API, Firebase, and Google AI Studio, TriageAI is a complete product — not a prototype. It works offline, handles Gemini failures gracefully, persists data privately on device, and delivers a demo that makes the value obvious in under 2 minutes.

<p align="center">
  <strong>TriageAI — Because deadlines don't wait.</strong><br>
  <sub>Built for the Vib2Ship Google AI Hackathon 2026 · Powered by Google Gemini AI</sub>
</p>
