export const DEMO_FALLBACK = {
  overallRiskScore: 87,
  overallRiskLevel: "critical" as const,
  overallRiskRationale: "3 of 4 tasks face deadline failure. The Client Presentation has only 12 minutes of buffer, and the Standup directly conflicts with the only available work window.",
  deadlineFailurePredictions: [
    {
      taskId: "task_1",
      taskName: "Client Presentation Deck",
      failureProbability: 0.82,
      failureReason: "3 hours of work, 3.2 hours until deadline. Standup consumes 1 hour of that window — creates a 48-minute deficit without intervention.",
      isRecoverable: true,
      recoveryRequires: "Skip or shorten the standup meeting"
    },
    {
      taskId: "task_2",
      taskName: "Electricity Bill Payment",
      failureProbability: 0.15,
      failureReason: "Due tomorrow. At risk of being forgotten during today's crisis.",
      isRecoverable: true,
      recoveryRequires: "Schedule a 30-minute window after 5pm today"
    },
    {
      taskId: "task_3",
      taskName: "Weekly Team Standup",
      failureProbability: 0.05,
      failureReason: "Will occur on time but full attendance makes the presentation deadline impossible.",
      isRecoverable: true,
      recoveryRequires: "Attend first 15 minutes only"
    },
    {
      taskId: "task_4",
      taskName: "Project Status Report",
      failureProbability: 0.02,
      failureReason: "Due Friday, plenty of buffer. Extremely low chance of failure if current schedule holds.",
      isRecoverable: true,
      recoveryRequires: "Review status updates and compile report Thursday morning"
    }
  ],
  conflictDetection: [
    {
      conflictId: "conflict_1",
      involvedTaskIds: ["task_1", "task_3"],
      conflictType: "time_collision",
      description: "Client Presentation requires 3 hours of uninterrupted focus before 5pm. Weekly Standup is scheduled at 3pm for 1 hour. Full attendance makes the presentation deadline impossible.",
      severity: "high",
      resolution: "Attend only the first 15 minutes of standup, then return to the presentation. Or skip and send an async update."
    }
  ],
  priorityStack: [
    {
      rank: 1,
      taskId: "task_1",
      taskName: "Client Presentation Deck",
      riskScore: 94,
      riskLevel: "critical",
      urgencyScore: 10,
      importanceScore: 9,
      startBy: "Right now",
      rationale: "12 minutes of buffer. Any interruption causes a missed deadline. External stakeholder — high reputational risk if late.",
      statusColor: "red" as const,
      sacrificeRecommended: false
    },
    {
      rank: 2,
      taskId: "task_2",
      taskName: "Electricity Bill Payment",
      riskScore: 71,
      riskLevel: "high",
      urgencyScore: 6,
      importanceScore: 8,
      startBy: "Today after 5:15 PM",
      rationale: "Financial deadline with compounding consequences. Low effort (30 min) but easily forgotten during a crisis day.",
      statusColor: "amber" as const,
      sacrificeRecommended: false
    },
    {
      rank: 3,
      taskId: "task_3",
      taskName: "Weekly Team Standup",
      riskScore: 45,
      riskLevel: "medium",
      urgencyScore: 5,
      importanceScore: 4,
      startBy: "3:00 PM (15 min only)",
      rationale: "Recurring internal meeting. Low cancellation cost. Directly conflicts with highest-priority task.",
      statusColor: "orange" as const,
      sacrificeRecommended: true,
      sacrificeType: "shorten",
      sacrificeRationale: "Attend first 15 minutes only. Internal recurring meeting — reputational cost of shortening is minimal."
    },
    {
      rank: 4,
      taskId: "task_4",
      taskName: "Project Status Report",
      riskScore: 18,
      riskLevel: "low",
      urgencyScore: 2,
      importanceScore: 5,
      startBy: "Tomorrow 9:00 AM",
      rationale: "Due Friday. 2 hours needed. No conflicts. Safe — do not let this consume mental energy today.",
      statusColor: "green" as const,
      sacrificeRecommended: false
    }
  ],
  rescuePlan: {
    summary: "Start the presentation immediately. Attend only 15 minutes of standup at 3pm, then return to the presentation. Submit by 5pm. Pay electricity bill at 5:15pm. Status report is safe — do it tomorrow morning.",
    timeBlocks: [
      {
        startTime: "Now",
        endTime: "2:45 PM",
        action: "Client Presentation — deep work, phone on silent, no interruptions",
        taskId: "task_1",
        isNonNegotiable: true
      },
      {
        startTime: "3:00 PM",
        endTime: "3:15 PM",
        action: "Standup — first 15 minutes only, then excuse yourself",
        taskId: "task_3",
        isNonNegotiable: false
      },
      {
        startTime: "3:15 PM",
        endTime: "5:00 PM",
        action: "Client Presentation — final sections, review, and submit",
        taskId: "task_1",
        isNonNegotiable: true
      },
      {
        startTime: "5:15 PM",
        endTime: "5:45 PM",
        action: "Electricity Bill Payment — log in and pay online",
        taskId: "task_2",
        isNonNegotiable: true
      },
      {
        startTime: "Tomorrow 9:00 AM",
        endTime: "Tomorrow 11:00 AM",
        action: "Project Status Report — safe to defer, schedule now",
        taskId: "task_4",
        isNonNegotiable: false
      }
    ]
  },
  draftCommunications: [
    {
      communicationId: "comm_1",
      forTaskId: "task_3",
      type: "meeting_shorten",
      to: "Team",
      subject: "Standup today — leaving after 15 mins",
      body: "Hey team — I can join the first 15 minutes of standup today but will need to drop off early. I have a client deliverable due at 5pm that needs my full focus this afternoon. Will drop async updates in the thread. Back tomorrow at full capacity.",
      afterSendingRiskDropsTo: 61
    }
  ],
  reasoningChain: [
    {
      stepNumber: 1,
      observation: "Client Presentation has 3 hours of work remaining with only 3.2 hours until the 5pm deadline.",
      inference: "This leaves exactly 12 minutes of buffer. Any meeting, interruption, or slow start causes a missed deadline.",
      decision: "Highest priority task. Work must start immediately with zero interruptions."
    },
    {
      stepNumber: 2,
      observation: "Weekly Standup is scheduled at 3pm for 1 hour — directly inside the presentation work window.",
      inference: "Full standup attendance creates a 48-minute deficit on the presentation, making the 5pm deadline impossible.",
      decision: "Standup must be shortened to 15 minutes maximum. An async message is the lowest-cost resolution."
    },
    {
      stepNumber: 3,
      observation: "Electricity Bill Payment is due tomorrow and takes only 30 minutes.",
      inference: "Financial deadlines have compounding consequences — late fees and credit impact accumulate.",
      decision: "Schedule at 5:15pm after the presentation is submitted. Must not be forgotten in the crisis."
    },
    {
      stepNumber: 4,
      observation: "Project Status Report is due Friday with 2 hours of effort needed and no scheduling conflicts.",
      inference: "Zero risk today. Adequate time available Thursday morning without touching today's crisis window.",
      decision: "Defer entirely to tomorrow morning. Remove it from today's mental load."
    }
  ]
};
