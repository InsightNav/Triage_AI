# TriageAI
### AI-Powered Deadline Crisis Manager  
*Vib2Ship Google AI Hackathon 2026*

| **Project Name** | **TriageAI** |
|---|---|
| **Category** | AI Productivity |
| **Hackathon** | Vib2Ship Google AI Hackathon 2026 |
| **Developer** | Solo Developer |
| **Build Time** | Under 4 Days |
| **Primary AI** | Google Gemini API (gemini-3.5-flash with schematized fallback) |
| **Stack** | React · TypeScript · Express · Firebase Authentication · Google Calendar |

---

## Table of Contents
* **01 — Executive Summary** (Page 2)
* **02 — Problem Statement Alignment** (Page 2)
* **03 — Target Users & Value Proposition** (Page 3)
* **04 — Core Features** (Page 3)
* **05 — Google Technologies Integration** (Page 5)
* **06 — Technical Architecture** (Page 6)
* **07 — Gemini AI Design & Schema** (Page 6)
* **08 — Agentic Behaviors Matrix** (Page 7)
* **09 — User Journey Flow** (Page 8)
* **10 — Interactive Demo Script** (Page 9)
* **11 — Current Limitations** (Page 10)
* **12 — Future Strategic Roadmap** (Page 10)
* **13 — Technical Stack Summary** (Page 11)
* **14 — Why TriageAI Wins** (Page 11)

---

## 01 — EXECUTIVE SUMMARY
### The product mission, the problem it solves, and why it matters.
TriageAI is an AI-powered deadline crisis manager built for students, professionals, and entrepreneurs who are overwhelmed by converging deadlines. When productivity systems fail and time runs out, TriageAI acts as an emergency crisis commander — analyzing your real schedule, predicting which deadlines will be missed, detecting conflicts, and generating an executable rescue plan in seconds.

Powered by Google Gemini AI and integrated with Google Calendar, TriageAI moves beyond traditional task managers by reasoning about the interaction between your commitments, your available time, and your relationships — then taking autonomous action to protect what matters most.

> **Core Value Proposition:** TriageAI uses Gemini AI to instantly analyze your deadlines, detect conflicts, and generate a personalized rescue plan — so you never miss what matters.

---

## 02 — PROBLEM STATEMENT ALIGNMENT
### How the solution directly locks into the specific hackathon criteria.
The hackathon challenge states: *"Students, professionals, and entrepreneurs frequently miss deadlines, assignments, meetings, bill payments, interviews, and important commitments. Build an AI-powered productivity companion that proactively assists users in planning, prioritizing, and completing tasks before deadlines are missed."*

| **Problem Component** | **How TriageAI Solves It** |
|---|---|
| **Proactively assists in planning** | Generates a chronological Rescue Plan Timeline with specific hour-by-hour focus blocks and automatically creates those blocks in Google Calendar. |
| **Proactive assistance** | Morning briefing auto-analyzes saved tasks on app open, flags upcoming collisions, and alerts users before a crisis forms rather than after. |
| **Prioritizing tasks** | Priority Stack ranks all tasks 1 to N based on true risk, calendar availability, and conflict severity — not just deadline proximity. |
| **Frequently miss deadlines** | Calculates individual Survival Probability per task — warns users when a deadline has low survival odds before it is too late. |
| **Completing tasks before deadlines** | Identifies the cheapest sacrifice to protect the highest-priority work, and pre-drafts communications to renegotiate tasks that cannot be saved. |

---

## 03 — TARGET USERS & VALUE PROPOSITION
### Who this is engineered for and why it behaves differently.
* **Students** juggling assignments, exams, part-time work, and personal commitments.
* **Professionals** managing client deliverables, internal meetings, and financial obligations simultaneously.
* **Entrepreneurs** handling client deadlines, invoices, and team commitments without an assistant.

Traditional calendar apps show what exists. Traditional task managers sort by static priority. Neither reasons about whether your schedule is survivable. TriageAI handles the critical failure points directly.

**TriageAI is different because it:**
1. **Calculates true available time** from Google Calendar rather than assuming you are free between deadlines.
2. **Detects cascade conflicts** — when Task A being late makes Task B impossible.
3. **Produces survival probabilities** per task based on actual buffer time and conflicts.
4. **Takes autonomous action** — writing communications, creating calendar blocks, and simulating hypothetical scenarios.
5. **Works as a crisis companion** not a planning tool — built for the moment when everything has already gone wrong.

---

## 04 — FEATURES
### The architectural layout of capabilities presented as a responsive grid.

### 🔵 CORE AI FEATURES
1. **🧠 Risk Score Engine**  
   Gemini analyzes the entire task landscape and produces an overall workload risk score from 0 to 100 with a risk level (Low / Medium / High / Critical) and a specific rationale referencing real task names and time conflicts.
2. **📉 Deadline Failure Prediction**  
   For every task, Gemini calculates an individual failure probability based on hours needed, time available, existing calendar conflicts, and whether other tasks depend on it. Displayed as a survival percentage (e.g. "32% on-time").
3. **🔍 Conflict Detection**  
   Identifies pairs of tasks that physically cannot both be completed as scheduled. Explains the specific conflict and provides a concrete resolution strategy.
4. **📊 Priority Stack**  
   Ranks all tasks from highest to lowest urgency based on real risk rather than static labels. Each card shows rank, risk color, survival probability, recommended start time, and AI triage rationale.
5. **⏱️ Rescue Plan Timeline (Human-Centric)**  
   A vertical time-blocked schedule showing exactly what to work on and when, built around actual free slots from Google Calendar. Every block has a specific action description, not generic placeholders.
6. **🛌 Human Lifestyle Guardrails (NEW)**  
   The timeline respects human biological limits: schedules zero work during sleep windows (11:00 PM – 7:00 AM), respects standard meal buffers, enforces a maximum of 90 minutes of continuous focus before a mandatory break, and spaces tasks with 5–10 minute transition gaps.
7. **🪜 Rescue Escalation Ladder (NEW)**  
   When available hours are short, TriageAI ascends a structured 5-stage protocol instead of instantly giving up:
   * *Level 1 — Reclaim Lifestyle Time:* Proposes quick meals, early wakes, and skipping leisure.
   * *Level 2 — Optimize Mandatory Work:* Recommends tasks during commutes, trimming meetings, and shortening breaks.
   * *Level 3 — Creative Scheduling:* Splits tasks around meals or shifts focus slots.
   * *Level 4 — Partial Completion:* Trims low-value deliverables and suggests high-impact sections.
   * *Level 5 — Reschedule/Drop:* Prepares proactive delay drafts for low-stakes stakeholders.
8. **⚠️ Late-Session Warning Flag (NEW)**  
   A specialized visual warning badge (**"⚠ Late session — only if necessary"**) triggers automatically on the timeline for any focus block extending past 9:00 PM to highlight schedule overruns.
9. **💬 AI-Generated Draft Communications**  
   When a task must be sacrificed, delayed, or shortened, Gemini pre-writes a professional communication using the actual task name and context. Users can edit and copy with one tap.
10. **🔄 "What If I Skip This?" Simulation**  
    On any sacrifice-recommended task, users can tap to simulate removing it. Gemini re-analyzes the remaining tasks and shows the new risk score instantly. Demonstrates consequential AI reasoning.
11. **⛓️ AI Reasoning Chain**  
    On every task detail screen, the AI shows its visible thinking: *Noticed → Inferred → Decided*. Judges and users can see exactly why the AI made each decision.

### 🟢 CALENDAR FEATURES
12. **📅 Google Calendar Integration**  
    Reads the user's real schedule to understand actual available time. Identifies free slots and busy blocks across the active day window.
13. **💾 Save Rescue Plan to Calendar**  
    Creates structured focus blocks directly in Google Calendar for each time block in the rescue plan. Events are marked busy so nothing can be scheduled over them.
14. **👁️ Today's Schedule Visualization**  
    Visual hour bar and slot list showing free and busy periods at a glance, including available hours for the day.

### 🟡 UX FEATURES
15. **🌅 Morning Briefing**  
    Auto-analyzes saved tasks on app open and shows a quick summary of today's risk status, task countdowns, and two AI insights — proactive behavior without user prompting.
16. **🎬 Demo Mode**  
    One-tap crisis scenario with four pre-loaded tasks demonstrating the full feature set. Completely isolated from real user data. Displays an elegant custom-styled, readable banner for demo task isolation.
17. **💾 Task Persistence**  
    All tasks saved to device localStorage. Survive browser closes and phone restarts. No account required. Full privacy — nothing stored on servers.
18. **⚙️ Offline Fallback Engine**  
    If Gemini is unavailable, a mathematical fallback engine analyzes tasks locally and generates structured triage output so the app never fails completely.
19. **🌗 Dark and Light Mode**  
    Full theme support across all screens.

---

## 05 — GOOGLE TECHNOLOGIES INTEGRATION
### Deep product breakdowns structured as distinct component blocks.

*   **🔵 Google Gemini API**  
    *Role:* The entire intelligence layer of TriageAI.  
    *How Used:* Primary triage analysis: processes tasks, calendar data, and current time to produce full JSON rescue plans. Skip simulation: re-analyzes remaining tasks when user tests hypothetical scenarios. Morning briefing: lightweight summary generation using faster model variant.  
    *Models used:* `gemini-3.5-flash` (primary), with robust exception handling and fallback options. Enforces valid JSON via strict system instructions and response schema formatting.
*   **📅 Google Calendar API**  
    *Role:* Grounds the AI in real-world schedule data.  
    *How Used:* Reads active window segments (`calendar.readonly`) to compute exact free slots and busy periods. Writes focus blocks (`calendar.events`) prefixed with `[ResQ] Focus:` to secure dedicated user working rows.  
    *Impact:* Gives Gemini absolute visibility into minutes remaining before deadlines rather than guessing by proximity alone.
*   **🌟 Google AI Studio**  
    *Role:* Development, testing, and deployment platform.  
    *How Used:* Leveraged actively for prompt optimization, structured JSON testing schemas, and hosting the production pipelines via the prompt deployment infrastructure.
*   **🔥 Firebase Authentication**  
    *Role:* Secure Google Sign-In for calendar access.  
    *How Used:* Employs signInWithPopup client routing mechanisms to authenticate tokens securely without storing credentials on server layers.

---

## 06 — TECHNICAL ARCHITECTURE
```
┌────────────────────────────────────────────────────────┐
│                      FRONTEND                          │
│  React 18 + TypeScript + Vite + Tailwind (Light/Dark)  │
└───────────┬────────────────────────────────┬───────────┘
            │ (OAuth flow)                   │ (Fetch API)
┌───────────▼─────────────┐      ┌───────────▼───────────┐
│  Firebase Auth          │      │  Custom Express Server│
│  (Google Sign-In)       │      │  (Node.js / tsx)      │
└─────────────────────────┘      └───────────┬───────────┘
                                             │
                                 ┌───────────▼───────────┐
                                 │  Google Gemini API    │
                                 │  (@google/genai SDK)  │
                                 └───────────────────────┘
```

---

## 07 — GEMINI AI DESIGN & SYSTEM PROMPT
### System prompt strategies and data schemas passed into context windows.
**System Prompt Strategy:** Gemini behaves as an emergency crisis commander under strict parameters:
*   **No raw task IDs** in user descriptions; human-readable names must be used in all visible communications.
*   **Human Lifestyle Constraints Enforcement:** Strict adherence to sleep cutoffs, meals, break pacing (max 90 minutes deep focus), and context-switch gaps.
*   **Rescue Escalation Protocol:** Iterates Levels 1–5 on insufficient hours, and explicitly outputs which level was reached and why.
*   **Explicit Leisure Acknowledgment:** When maintaining social/leisure items in an overloaded day, the action description must append warning logic detailing the specific buffer trade-offs.

#### Input Payload:
*   Current timestamp (ISO format)
*   Active tasks list (ID, name, hours needed, deadline, dependencies)
*   Google Calendar intervals (free slots, busy blocks)

#### Output JSON Schema:
```json
{
  "overallRiskScore": 87,
  "overallRiskLevel": "critical",
  "overallRiskRationale": "Explain the exact conflict...",
  "deadlineFailurePredictions": [
    {
      "taskId": "task-1",
      "failureProbability": 0.85,
      "failureReason": "Reason for failure...",
      "isRecoverable": true,
      "recoveryRequires": "Reclaiming lunch hour..."
    }
  ],
  "conflictDetection": [
    {
      "involvedTaskIds": ["task-1", "task-2"],
      "description": "Conflict description...",
      "severity": "high",
      "resolution": "Specific resolution..."
    }
  ],
  "priorityStack": [
    {
      "taskId": "task-1",
      "riskScore": 90,
      "riskLevel": "critical",
      "startBy": "09:30 AM",
      "rationale": "High weight conflict...",
      "statusColor": "red",
      "sacrificeRecommended": false,
      "sacrificeType": "none",
      "sacrificeRationale": ""
    }
  ],
  "rescuePlan": {
    "summary": "Full strategy overview...",
    "timeBlocks": [
      {
        "startTime": "09:30",
        "endTime": "11:00",
        "action": "Complete slide draft — keep focus high.",
        "taskId": "task-1",
        "isNonNegotiable": true
      }
    ]
  },
  "draftCommunications": [
    {
      "forTaskId": "task-2",
      "type": "reschedule",
      "body": "Pre-written message body...",
      "afterSendingRiskDropsTo": 45
    }
  ],
  "reasoningChain": [
    {
      "stepNumber": 1,
      "observation": "Noticed two tasks overlapping...",
      "inference": "This overlap creates a cascade failure...",
      "decision": "Recommend Level 1 Lifestyle shift..."
    }
  ]
}
```

---

## 08 — AGENTIC BEHAVIORS MATRIX
### How and when TriageAI acts on its own.

| **Icon** | **Behavior** | **Trigger** | **What TriageAI Does** |
|---|---|---|---|
| **🌅** | **Proactive Morning Briefing** | App opened with saved tasks | Auto-analyzes task landscape and flags upcoming risk count-downs and AI recommendations before user prompts. |
| **⚡** | **Cascade Conflict Detection** | Task list submitted | Automatically identifies when Task A being late causes Task B to collapse and highlights this conflict. |
| **🪜** | **Rescue Escalation Laddering** | Insufficient hours detected | Iteratively negotiates schedules through reclaim stages (Levels 1–5), providing explicit transparency on chosen level. |
| **🛌** | **Human Constraint Validator** | Timeline rendering | Auto-modifies suggested times to prevent overnight labor, schedules break buffers, and reserves meal slots. |
| **⚠️** | **Late Block Warning Flag** | Timeline Block ends past 9:00 PM | Renders a visual amber warning flag ("⚠ Late session — only if necessary") on late night entries. |
| **💬** | **Autonomous Draft Creation** | Sacrifice identified | Generates contextual, copyable stakeholder emails using live task names with zero manual text insertion needed. |
| **🔄** | **Consequential Skip Simulation** | User taps "What if I skip?" | Removes the selected item, re-submits the updated model payload, and evaluates the cascading relief. |
| **⚙️** | **Offline Fallback Engine** | Gemini API is unreachable | Seamlessly swaps to local mathematical priority queue calculations to preserve core application usability. |

---

## 09 — USER JOURNEY FLOW
```
[ 1 ] Open TriageAI ─────► Active Morning Briefing highlights saved tasks and countdowns
        │
[ 2 ] Connect Calendar ──► Reads active day's schedules to compute true available time window
        │
[ 3 ] Add Live Tasks ────► Input name, hours required, and specific hard deadline
        │
[ 4 ] Activate Triage ───► Gemini analyzes inputs, computes risks, and traces cascade conflicts
        │
[ 5 ] Review Dashboard ──► Inspects Priority Stack, reviews visible Reasoning Chain, and runs Skip Simulations
        │
[ 6 ] Secure Schedule ───► Copies draft emails for low-stakes drops, and saves focus blocks directly into Google Calendar
```

---

## 10 — INTERACTIVE DEMO SCRIPT
### Interactive pitch timeline for evaluators and hackathon judges.
* **⏱️ Total demo time:** 2 minutes | *Best viewed on mobile or desktop browser*

#### 🚀 **STEP 1 — Load Crisis Scenario [0:00 - 0:15]**
Click "Load Demo Tasks". Four realistic, overlapping tasks load: Client Presentation (3h, due 5pm), Weekly Standup (1h, due 3pm), Electricity Bill, and Status Report.
*   *Say:* "Four commitments. One person. Only 4 hours of true free time. Traditional planners fail here."

#### ⚡ **STEP 2 — Activate TriageAI [0:15 - 0:40]**
Tap "Activate TriageAI". The overall risk score counts up to **87/100 CRITICAL**.
*   *Say:* "TriageAI acts as your crisis commander. It reads your tasks, overlaps them against your actual calendar blocks, and instantly detects a collision."

#### 🔍 **STEP 3 — Show Conflict & Rescue Escalation [0:40 - 0:55]**
Scroll to "Conflicts Detected". Show the reasoning: *Weekly Standup consumes the final available window for the Client Presentation.*
*   *Say:* "The AI highlights cascade conflicts. It notices that attending the 1-hour standup guarantees missing the 3-hour presentation deadline."

#### 🔄 **STEP 4 — Skip Simulation [0:55 - 1:15]**
On the Standup task, tap "What If I Skip This?". Watch the overall risk score plunge to **45/100 MEDIUM**.
*   *Say:* "We can run a hypothetical simulation. TriageAI instantly re-computes the timeline, demonstrating how skipping the standup fully rescues our highest-priority slide deck."

#### 💬 **STEP 5 — AI-Drafted Communication [1:15 - 1:35]**
Tap "Draft Message" on the Standup card. Copy the professional, pre-written email.
*   *Say:* "It doesn't just tell you to skip it. It writes the exact renegotiation email for your team, keeping your professional relationships secure."

#### ⛓️ **STEP 6 — The AI Reasoning Chain [1:35 - 1:50]**
Tap "View Details" to see the visible thinking path: *Noticed → Inferred → Decided*.
*   *Say:* "This is the reasoning chain. You see exactly what TriageAI noticed, what it inferred, and why it decided on this schedule. No black box."

#### 📅 **STEP 7 — Save to Calendar [1:50 - 2:00]**
Tap "Save Rescue Plan to Calendar".
*   *Say:* "With one final tap, focus blocks are carved directly into my Google Calendar, protecting my time from further meetings. We are ready to execute."

---

## 11 — CURRENT LIMITATIONS
*   **Single-Day Window Focus:** Optimized primarily for immediate 24-hour crisis resolutions.
*   **Strict Calendar Scope:** Analyzes primary Google Calendar events only; does not scan secondary shared calendars or external scheduling links (Cal.com, etc.).
*   **Local-First Persistence:** Tasks persist entirely on-device; plans are not currently shared or synced across multiple distinct devices.

---

## 12 — FUTURE STRATEGIC ROADMAP
*   **Direct Messaging Integration:** One-click integration to send AI-drafted messages directly to Slack, Gmail, or WhatsApp.
*   **Bi-directional Continuous Sync:** Watches calendar events in real-time and dynamically fires desktop alerts if a new meeting ruins an active focus block.
*   **Multi-Day Crisis Planning:** Expand the triage horizon to multi-week spans, resolving exam-season preparation or complex milestone projects.
*   **AI Habit Profiling:** Learns real execution speed over time to automatically scale requested task durations up or down based on historically recorded completion speed.

---

## 13 — TECHNICAL STACK SUMMARY
*   **Frontend Core:** React 18, TypeScript, Vite, Framer Motion
*   **Backend Foundation:** Express, Node.js (tsx)
*   **Intelligence Layer:** Google Gemini API (`@google/genai` SDK)
*   **Identity & Auth:** Firebase Authentication
*   **Calendar Services:** Google Calendar API v3
*   **Design Framework:** Tailwind CSS (Light / Dark responsive)

---

## 14 — WHY TRIAGEAI WINS
Most productivity tools assume you are already organized. **TriageAI is built for the moment that assumption breaks down.** When deadlines collide and time runs out, it steps in as an AI crisis commander — analyzing your real schedule, detecting conflicts, and handing you an executable plan before the damage is done.

The AI does not just give advice. It detects which tasks will fail, identifies the cheapest sacrifice, writes the communication to send, creates the calendar blocks to protect your focus time, and shows its reasoning at every step. That is not a chatbot wrapper — that is a genuine AI agent working on your behalf.

Built solo in under 4 days using Google Gemini, Google Calendar API, Firebase, and Google AI Studio, TriageAI is a complete product — not a prototype. It works offline, handles Gemini failures gracefully, persists data privately on device, and delivers a demo that makes the value obvious in under 2 minutes.

---
**"TriageAI – Because deadlines don’t wait"**  
*Built for the Vib2Ship Google AI Hackathon 2026*  
*Powered by Google Gemini AI*
