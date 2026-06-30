import "dotenv/config";
import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI, Type } from "@google/genai";

const app = express();
const PORT = 3000;

app.use(express.json());

// Initialize Gemini
const apiKey = process.env.GEMINI_API_KEY;
const ai = new GoogleGenAI({
  apiKey: apiKey,
  httpOptions: {
    headers: {
      'User-Agent': 'aistudio-build',
    }
  }
});

// JSON Schema for PanicMode crisis triage
const triageResponseSchema = {
  type: Type.OBJECT,
  properties: {
    overallRiskScore: {
      type: Type.INTEGER,
      description: "Overall risk score from 0 to 100."
    },
    overallRiskLevel: {
      type: Type.STRING,
      description: "Must be one of 'critical', 'high', 'medium', or 'low'."
    },
    overallRiskRationale: {
      type: Type.STRING,
      description: "One or two sentences explaining why this risk level was assigned, referencing specific tasks."
    },
    deadlineFailurePredictions: {
      type: Type.ARRAY,
      description: "Predictions of failure for specific tasks.",
      items: {
        type: Type.OBJECT,
        properties: {
          taskId: { type: Type.STRING },
          failureProbability: { type: Type.NUMBER, description: "From 0.0 to 1.0." },
          failureReason: { type: Type.STRING },
          isRecoverable: { type: Type.BOOLEAN },
          recoveryRequires: { type: Type.STRING }
        },
        required: ["taskId", "failureProbability", "failureReason", "isRecoverable", "recoveryRequires"]
      }
    },
    conflictDetection: {
      type: Type.ARRAY,
      description: "List of identified conflicts between tasks.",
      items: {
        type: Type.OBJECT,
        properties: {
          involvedTaskIds: {
            type: Type.ARRAY,
            items: { type: Type.STRING }
          },
          description: { type: Type.STRING },
          severity: { type: Type.STRING, description: "e.g. High, Medium, Low" },
          resolution: { type: Type.STRING }
        },
        required: ["involvedTaskIds", "description", "severity", "resolution"]
      }
    },
    priorityStack: {
      type: Type.ARRAY,
      description: "Urgency-prioritized queue of all tasks, ranked 1 to N.",
      items: {
        type: Type.OBJECT,
        properties: {
          taskId: { type: Type.STRING },
          riskScore: { type: Type.INTEGER },
          riskLevel: { type: Type.STRING },
          startBy: { type: Type.STRING, description: "Suggested start time or relative time block." },
          rationale: { type: Type.STRING, description: "Specific rescue action or reason." },
          statusColor: { type: Type.STRING, description: "Must be 'critical', 'high', 'medium', or 'safe'." },
          sacrificeRecommended: { type: Type.BOOLEAN },
          sacrificeType: { type: Type.STRING, description: "e.g. 'Skip', 'Reschedule', 'Delegate', or 'None'" },
          sacrificeRationale: { type: Type.STRING, description: "Explanation of why this task should be sacrificed to save others." }
        },
        required: ["taskId", "riskScore", "riskLevel", "startBy", "rationale", "statusColor", "sacrificeRecommended"]
      }
    },
    rescuePlan: {
      type: Type.OBJECT,
      properties: {
        summary: { type: Type.STRING },
        timeBlocks: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              startTime: { type: Type.STRING },
              endTime: { type: Type.STRING },
              action: { type: Type.STRING },
              taskId: { type: Type.STRING },
              isNonNegotiable: { type: Type.BOOLEAN }
            },
            required: ["startTime", "endTime", "action", "taskId", "isNonNegotiable"]
          }
        }
      },
      required: ["summary", "timeBlocks"]
    },
    draftCommunications: {
      type: Type.ARRAY,
      description: "AI pre-drafted messages to send to contacts for tasks requiring rescheduling/skipping.",
      items: {
        type: Type.OBJECT,
        properties: {
          forTaskId: { type: Type.STRING },
          type: { type: Type.STRING, description: "e.g. 'Client Delay Notification', 'Reschedule Request'" },
          body: { type: Type.STRING, description: "Full email/message text pre-drafted in a highly professional but realistic, direct tone." },
          afterSendingRiskDropsTo: { type: Type.INTEGER, description: "Predicted overall risk score if this message is sent / task sacrificed." }
        },
        required: ["forTaskId", "type", "body", "afterSendingRiskDropsTo"]
      }
    },
    reasoningChain: {
      type: Type.ARRAY,
      description: "Chain of reasoning steps explaining the analysis. Minimum 3 steps.",
      items: {
        type: Type.OBJECT,
        properties: {
          stepNumber: { type: Type.INTEGER },
          observation: { type: Type.STRING },
          inference: { type: Type.STRING },
          decision: { type: Type.STRING }
        },
        required: ["stepNumber", "observation", "inference", "decision"]
      }
    }
  },
  required: [
    "overallRiskScore",
    "overallRiskLevel",
    "overallRiskRationale",
    "deadlineFailurePredictions",
    "conflictDetection",
    "priorityStack",
    "rescuePlan",
    "draftCommunications",
    "reasoningChain"
  ]
};

// Helper function to check if an API error is transient and retryable
function isRetryableError(err: any): boolean {
  if (!err) return false;
  let code = 500;
  if (typeof err.status === "number") {
    code = err.status;
  } else if (typeof err.code === "number") {
    code = err.code;
  }
  
  if (code === 503 || code === 429 || code === 500 || code === 504 || code === 502) {
    return true;
  }

  if (err.message) {
    const msg = err.message.toLowerCase();
    if (
      msg.includes("503") || msg.includes("unavailable") || msg.includes("busy") ||
      msg.includes("429") || msg.includes("quota") || msg.includes("rate") || msg.includes("too many") ||
      msg.includes("500") || msg.includes("server error") || msg.includes("timeout")
    ) {
      return true;
    }
  }

  return false;
}

// API Endpoint for analyzing deadline emergencies
app.post("/api/analyze", async (req, res) => {
  try {
    const { tasks, currentTime, calendarConnected, freeSlots, busySlots, totalFreeTime } = req.body;
    if (!tasks || !Array.isArray(tasks) || tasks.length === 0) {
      return res.status(200).json({ error: "Missing or invalid tasks array.", code: 400 });
    }

    if (!apiKey) {
      return res.status(200).json({ error: "Gemini API Key is not configured. Please add GEMINI_API_KEY in the Secrets panel.", code: 401, errorType: "missing_key" });
    }

    const systemInstruction = `You are TriageAI's AI triage engine — a crisis commander that analyzes deadline emergencies. Analyze the user's tasks, predict which deadlines will be missed given available time, detect conflicts between tasks, and produce an executable rescue plan with explicit reasoning. Be direct and specific. Always reference specific task data in your reasoning. Never give generic advice. Respond with valid JSON only.

IMPORTANT: Never use internal task IDs (like task_1, task_2, demo-task-1 etc.) in any text that will be displayed to users. In all rationale, description, conflict, and communication fields, always use the human-readable task name. Internal IDs may only appear in the taskId fields of the JSON structure itself.

For each rescue plan time block the action field must be a specific instruction describing exactly what to do during that time. Do not just repeat the task name. Examples:
Instead of 'buy groceries' write 'Complete grocery run — list ready, aim for under 1 hour'
Instead of 'help friend' write 'Help friend with their request — set a firm end time to stay on schedule'
Instead of 'start presentation' write 'Focus on presentation slides — deep work, notifications off, no interruptions'
The action must tell the user exactly what to do and how to approach that time block.

CRITICAL INDIVIDUAL PROBABILITIES: You must calculate a realistic, unique failureProbability (0.0 to 1.0) for EACH task in the list individually. Do NOT use the same fallback or default value for all tasks. Tasks with tight deadlines, high hours needed, and active conflicts must have high failure probability (e.g., 0.8 to 0.95), whereas tasks due tomorrow or later with no conflicts and small duration must have low failure probability (e.g., 0.05 to 0.2).

CRITICAL COMPLETE TIMELINE: Your rescuePlan.timeBlocks array MUST include a time block slot for EVERY SINGLE task in the input list. No task may be omitted. Tasks due today must get specific hour blocks (e.g., '1:00 PM' - '3:00 PM'). Tasks due tomorrow must get tomorrow slots (e.g., 'Tomorrow 9:00 AM' - 'Tomorrow 11:00 AM'). Tasks due later must get a planning note slot like 'Thursday Morning' or 'Schedule for Friday morning'. Every task from the request MUST appear on the timeline.

---

HUMAN LIFESTYLE CONSTRAINTS — APPLY THESE ALWAYS:

You are building rescue plans for real humans with
real lives. Every plan must respect these boundaries
before generating any time block or suggestion.

SLEEP AND REST:
Never schedule work between 11:00 PM and 7:00 AM.
Humans sleep during these hours. If a deadline falls
overnight, flag it as critical and plan around the
hours available TODAY before that deadline. Do not
suggest working through the night as a solution.
The absolute earliest you may ever suggest starting
work is 6:00 AM and only as a last resort when
no other option exists.

MEAL TIMES:
Avoid scheduling deep focus work during typical
meal times: 7:00 AM - 8:00 AM (breakfast),
12:00 PM - 1:00 PM (lunch), 7:00 PM - 8:00 PM
(dinner). These slots are acceptable for light
tasks like reading, reviewing notes, or checking
email but never for deep focus work sessions.

MORNING STARTUP:
Most people need 30 minutes after waking to become
productive. Do not schedule critical deep work
before 8:00 AM. Morning slots starting at 8:30 AM
or 9:00 AM are the most realistic for focus work.

HUMAN ATTENTION SPAN:
Never schedule more than 90 minutes of continuous
deep work without a break. After every 90 minutes
of focused work insert at least a 15 minute break
before the next focus block. A plan requiring 5
consecutive hours of unbroken work is not realistic
— a human will not successfully execute it.
Slightly shorten breaks to 10 minutes only when
time is genuinely tight — never eliminate them.

ENERGY LEVELS THROUGH THE DAY:
Morning 8 AM to 12 PM: Best for high-focus deep
work. Schedule the most critical and demanding
tasks here whenever possible.
Early afternoon 1 PM to 3 PM: Natural energy dip
after lunch. Best for lighter tasks, meetings,
emails, admin, or quick errands.
Late afternoon 3 PM to 6 PM: Second energy window.
Good for focused work again.
Evening 6 PM to 9 PM: Acceptable for moderate
tasks if genuinely needed. Not ideal for the
hardest or most creative work.
After 9 PM: Only recommend if truly critical and
no other slot exists anywhere in the day. Always
flag it explicitly as "evening work required —
this is not ideal but necessary given your schedule."
After 11 PM: Never recommend under any circumstances.

REALISTIC TRANSITION TIME:
Between tasks always add at least 5 to 10 minutes
for context switching. Never schedule tasks back
to back with zero gap. Humans need a brief moment
to mentally shift from one type of work to another.

COMMUTE AND TRAVEL:
If a task involves being somewhere physically such
as a meeting, exam, or interview, add realistic
travel time before it. Assume at least 15 to 30
minutes of commute unless the event is clearly
marked as remote or online.

WEEKDAY AWARENESS:
If context suggests it is a weekday assume the
user has work or study commitments even if no
calendar is connected. Do not assume the entire
day is free for task work unless calendar data
confirms it.

PRIORITIZE TODAY BEFORE TOMORROW:
Always exhaust today's realistic hours first
before suggesting tomorrow. Only move tasks to
tomorrow if today genuinely has no viable window
after working through all optimization options.

LANGUAGE FOR TIME BLOCKS:
When describing what to do in a time block be
specific and human. Instead of vague instructions
like "work on task" write something like "Open
the presentation file and complete the revenue
slide — aim for one slide every 15 minutes."
Give the user a concrete first action so they
do not have to think — they just execute.

---

WHEN TIME IS INSUFFICIENT — RESCUE ESCALATION LADDER:

When available hours are not enough to complete
all tasks do not immediately tell the user to
drop or reschedule. Work through this escalation
ladder in strict order. Only move to the next
level if the previous level does not free up
enough time. Show the user which level was
reached and explain why.

LEVEL 1 — RECLAIM TIME FROM LIFESTYLE TASKS:
Look at non-critical lifestyle activities that
can be shortened or skipped today to free up time.

Wake up earlier:
If the current time is before 9 AM and morning
hours are still available, suggest waking up
30 to 60 minutes earlier than usual. Frame it
as a specific gain: "Starting at 7:30 AM instead
of 8:30 AM gives you one full extra hour of quiet
focus before the day gets busy."
Only suggest this if it creates a meaningful time
gain and the deadline genuinely requires it.
Never suggest waking before 6:00 AM.

Shorten meals:
Suggest a quick meal instead of a full one.
Frame it as: "Grab something quick for lunch —
15 minutes instead of 45 — and use that 30
minutes for [specific task]."
Never suggest skipping meals entirely. Always
frame food as quick not absent.

Skip or shorten leisure and social activities:
If context suggests gym, social plans, TV time,
or other non-urgent leisure today, suggest
shortening or skipping it for today only.
Frame it respectfully: "Consider skipping
[activity] just for today — it frees up
[X] hours and you can return to your normal
routine tomorrow."

When keeping a social or leisure activity
in the schedule because time allows it, always
add a note in that time block's action field
acknowledging the trade-off. Example:
'Kept this in your plan — if you are running
behind consider shortening to 30 minutes to
create a buffer for your work tasks.'
Never silently include leisure without
acknowledging its impact on the overall plan.

Batch small errands:
If there are multiple small tasks like bill
payment, quick calls, or admin work suggest
doing them back to back in one efficient block.
Frame it as: "Stack your quick tasks together
at 4 PM — 30 minutes to clear them all at once
instead of breaking your focus repeatedly."

LEVEL 2 — OPTIMIZE MANDATORY ACTIVITIES:
If lifestyle adjustments alone are not enough
look at mandatory activities that can be made
more efficient without eliminating them.

Commute: Can any task be done during the commute?
Suggest reviewing notes, listening to relevant
material, or planning the next work block while
travelling if applicable.

Meetings: Can any non-critical meeting be shortened?
Suggest attending only the first 15 to 20 minutes
and leaving with a polite message ready to send.

Breaks: Trim breaks slightly today.
Instead of 15 minute breaks suggest 10 minutes.
Never eliminate breaks — only trim them.

LEVEL 3 — CREATIVE SCHEDULING:
If optimization is still not enough try creative
use of available time before considering dropping.

Split tasks across natural boundaries:
"Do the first half of [task] from 6 PM to 7 PM
before dinner, then finish the second half from
8 PM to 9 PM after dinner. This avoids one long
draining session and uses two smaller windows."

Use parallel processing where possible:
If a task has a waiting component such as sending
an email and waiting for a reply or running a
process that takes time, identify what can be
worked on during that waiting period.

Early morning as genuine last resort:
If the situation is critical and no other option
exists after Levels 1 and 2, suggest a 6:00 AM
or 6:30 AM start. Always frame it honestly:
"This is a tough situation. Your best option is
an early start — 6:30 AM gives you 90 minutes
of quiet uninterrupted focus before the day
gets busy. Set your alarm tonight."

LEVEL 4 — PARTIAL COMPLETION STRATEGY:
If even creative scheduling cannot fit everything
do not pretend the task can be fully completed.
Be honest and help the user maximize what is
possible within the real constraint.

Identify the minimum viable version of the task:
"You cannot complete the full report by 5 PM but
you can complete the executive summary and key
findings — that covers the most critical parts.
Aim for that and deliver the rest tomorrow morning."

Identify what can be cut from the task itself:
"Skip the appendix for now. Focus on the three
main sections. The appendix can be added tomorrow
before anyone has read the document."

Draft a proactive heads-up message:
Generate a communication that sets expectations
early rather than apologizing after missing the
deadline. Example: "I want to flag that I am
running tight today. I will have the core sections
to you by 5 PM and the complete document by 9 AM
tomorrow. Let me know if the core sections work
for your initial review."

LEVEL 5 — DROP OR RESCHEDULE:
Only reach this level after genuinely exhausting
Levels 1 through 4. When recommending a drop
or reschedule always do all of the following:

Explain specifically why there is no other option:
"After accounting for your available hours, early
start options, lifestyle adjustments, and task
optimization, there is genuinely not enough time
to complete both [Task A] and [Task B] today."

Recommend which specific task to drop:
Always drop the lowest-stakes task first.
Lowest stakes means: internal task, recurring
meeting, no external stakeholder, or flexible
deadline. Never recommend dropping an external
deadline or a task with named stakeholders
without first drafting a communication.

Draft the reschedule communication immediately:
Never tell the user to drop something without
also providing the exact message to send.
The draft must be ready to copy and send with
no additional effort from the user.

Suggest the specific reschedule time:
Never just say "reschedule it." Say exactly when:
"Move this to Thursday at 10 AM" or "Push this
to Monday morning next week — that is the first
realistic open slot based on what you have shared."

ALWAYS BE HONEST ABOUT TRADE-OFFS:
At every level tell the user what they are giving
up and what they are gaining. Never sugarcoat a
genuinely tight situation. Never promise a plan
will work if it requires perfect execution with
zero interruptions or mistakes.
A good rescue plan accounts for imperfection.

Example of honest framing:
"This plan is tight. It works if you start by
8 AM and keep your breaks short. If anything
runs over by more than 20 minutes then [Task B]
becomes at risk. Your backup is to send the
heads-up email now so you are not caught
off guard if that happens."

---

VALIDATION RULE — APPLY BEFORE EVERY OUTPUT:

Before generating any time block in the rescue
plan validate it against both sections above.

Ask these questions about every time block:
Does this fall in a sleep window? If yes move it.
Does this fall in a meal time? If yes adjust it.
Does this exceed 90 minutes without a break?
If yes split it with a break in between.
Is this realistic for a human to actually execute?
If no adjust it until it is.

When time is insufficient work through the
RESCUE ESCALATION LADDER from Level 1 to Level 5
before recommending any drop or reschedule.
Show the user which level of intervention was
needed and briefly explain why that level was
reached. Make the reasoning visible so the user
understands the situation clearly.

Never output a rescue plan that violates the
HUMAN LIFESTYLE CONSTRAINTS. Adjust automatically
before outputting. The user should never receive
a plan that assumes they do not sleep, do not eat,
or can work without any breaks.`;

    let userPrompt = `Current time: ${currentTime}. Analyze these tasks and produce a complete crisis triage.

Tasks: ${JSON.stringify(tasks, null, 2)}

`;

    if (calendarConnected) {
      userPrompt += `CALENDAR CONTEXT (real schedule data):
Current time: ${currentTime}
Today's free slots: ${JSON.stringify(freeSlots, null, 2)}
Today's busy slots: ${JSON.stringify(busySlots, null, 2)}
Total free time available today: ${totalFreeTime} hours

IMPORTANT INSTRUCTION: 
Calculate risk scores and rescue plans based on 
ACTUAL available time from the calendar, not just
deadline proximity. If a task needs 3 hours but 
only 1 hour of free time exists before its 
deadline, that is a CRITICAL failure — flag it 
explicitly. Rescue plan time blocks must only 
be scheduled during FREE slots. Never schedule
work during busy slots. Reference the actual 
free slot times (e.g. '11AM-1PM window') in 
your rationale and rescue plan.

`;
    }

    userPrompt += `Return JSON with these exact fields:
- overallRiskScore (0-100 integer)
- overallRiskLevel ('critical'|'high'|'medium'|'low')
- overallRiskRationale (string, 1-2 sentences, references specific tasks)
- deadlineFailurePredictions (array with taskId, failureProbability 0-1, failureReason, isRecoverable, recoveryRequires)
- conflictDetection (array with involvedTaskIds, description, severity, resolution)
- priorityStack (array ranked 1-N with taskId, riskScore, riskLevel, startBy, rationale, statusColor, sacrificeRecommended boolean, sacrificeType, sacrificeRationale)
- rescuePlan.summary (string)
- rescuePlan.timeBlocks (array with startTime, endTime, action, taskId, isNonNegotiable)
- draftCommunications (array with forTaskId, type, body, afterSendingRiskDropsTo)
- reasoningChain (array with stepNumber, observation, inference, decision — minimum 3 steps)`;

    // Try multiple free-tier models sequentially if we hit rate limits or errors
    const modelsToTry = ["gemini-3.5-flash", "gemini-3.1-flash-lite", "gemini-flash-latest"];
    let geminiError = null;
    let parsedResult = null;
    let finalModelUsed = "";

    for (const modelName of modelsToTry) {
      let modelSuccess = false;
      let modelAttempt = 1;
      const maxModelAttempts = 3;

      while (modelAttempt <= maxModelAttempts) {
        try {
          const response = await ai.models.generateContent({
            model: modelName,
            contents: userPrompt,
            config: {
              systemInstruction,
              responseMimeType: "application/json",
              responseSchema: triageResponseSchema,
              temperature: 0.2,
            }
          });

          const textResponse = response.text;
          if (!textResponse) {
            throw new Error(`Empty response from Gemini API using model ${modelName}.`);
          }

          let cleanText = textResponse.trim();
          if (cleanText.startsWith("```")) {
            cleanText = cleanText.replace(/^```json\s*/i, "").replace(/```$/, "").trim();
          }
          parsedResult = JSON.parse(cleanText);
          parsedResult.modelUsed = modelName;
          finalModelUsed = modelName;
          
          geminiError = null; // Clear any error from previous models or attempts
          modelSuccess = true;
          break; // Break the attempt loop on success
        } catch (err: any) {
          console.error(`Gemini call failed with model ${modelName} on attempt ${modelAttempt}:`, err);
          geminiError = err;

          if (modelAttempt < maxModelAttempts && isRetryableError(err)) {
            const errMsg = String(err?.message || "").toLowerCase();
            const is503 = err?.status === 503 || err?.code === 503 || errMsg.includes("503") || errMsg.includes("unavailable") || errMsg.includes("demand") || errMsg.includes("busy");
            
            if (is503) {
              if (modelAttempt === 1) {
                await new Promise(resolve => setTimeout(resolve, 1000));
                modelAttempt++;
                continue;
              } else {
                break; // Break the attempt loop to try the next model
              }
            }

            const delay = modelAttempt * 1500; // 1.5s, 3s backoff
            await new Promise(resolve => setTimeout(resolve, delay));
            modelAttempt++;
          } else {
            // Fatal error or reached max attempts for this model. Move to next model.
            break;
          }
        }
      }

      if (modelSuccess) {
        break; // Successfully got parsedResult, break the models loop!
      }
    }

    if (parsedResult) {
      return res.json(parsedResult);
    } else {
      let statusCode = 500;
      let errorType = "api_error";
      if (geminiError) {
        if (typeof geminiError.status === "number") {
          statusCode = geminiError.status;
        } else if (typeof geminiError.code === "number") {
          statusCode = geminiError.code;
        }
        if (geminiError.message) {
          const msg = geminiError.message.toLowerCase();
          if (msg.includes("503") || msg.includes("unavailable") || msg.includes("busy")) {
            statusCode = 503;
            errorType = "unavailable";
          } else if (msg.includes("429") || msg.includes("quota") || msg.includes("rate") || msg.includes("too many")) {
            statusCode = 429;
            errorType = "quota_exceeded";
          } else if (msg.includes("401") || msg.includes("api key") || msg.includes("invalid api key") || msg.includes("key not valid")) {
            statusCode = 401;
            errorType = "invalid_key";
          } else if (msg.includes("400") || msg.includes("bad request") || msg.includes("invalid")) {
            statusCode = 400;
            errorType = "bad_request";
          }
        }
      }
      return res.status(200).json({
        error: geminiError?.message || "Failed to analyze deadlines with Gemini. Please try again.",
        code: statusCode,
        errorType: errorType
      });
    }

  } catch (error: any) {
    console.error("Endpoint error:", error);
    return res.status(200).json({ error: error.message || "An unexpected error occurred.", code: 500 });
  }
});

// Configure Vite or Static Asset serving
async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
  });
}

startServer();
