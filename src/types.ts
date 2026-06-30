export interface Task {
  id: string;
  name: string;
  deadlineDate: string; // YYYY-MM-DD
  deadlineTime: string; // HH:MM
  hoursNeeded: number; // e.g., 0.5, 1, 2, 3, 5, 8
  category: "Work" | "School" | "Finance" | "Personal";
  importance: "High" | "Medium" | "Low";
  blocksOthers: boolean;
  deadline?: string;
  isDemo?: boolean;
  isCompleted?: boolean;
}

export interface FailurePrediction {
  taskId: string;
  failureProbability: number; // 0 to 1
  failureReason: string;
  isRecoverable: boolean;
  recoveryRequires: string;
}

export interface Conflict {
  involvedTaskIds: string[];
  description: string;
  severity: string;
  resolution: string;
}

export interface PriorityTask {
  taskId: string;
  riskScore: number;
  riskLevel: string;
  startBy: string;
  rationale: string;
  statusColor: 'critical' | 'high' | 'medium' | 'safe';
  sacrificeRecommended: boolean;
  sacrificeType?: string;
  sacrificeRationale?: string;
}

export interface TimeBlock {
  startTime: string;
  endTime: string;
  action: string;
  taskId: string;
  isNonNegotiable: boolean;
}

export interface RescuePlan {
  summary: string;
  timeBlocks: TimeBlock[];
}

export interface DraftCommunication {
  forTaskId: string;
  type: string;
  body: string;
  afterSendingRiskDropsTo: number;
}

export interface ReasoningStep {
  stepNumber: number;
  observation: string;
  inference: string;
  decision: string;
}

export interface TriageResult {
  overallRiskScore: number;
  overallRiskLevel: 'critical' | 'high' | 'medium' | 'low';
  overallRiskRationale: string;
  deadlineFailurePredictions: FailurePrediction[];
  conflictDetection: Conflict[];
  priorityStack: PriorityTask[];
  rescuePlan: RescuePlan;
  draftCommunications: DraftCommunication[];
  reasoningChain: ReasoningStep[];
  modelUsed?: string;
}

export type ScreenName = 'landing' | 'connectCalendar' | 'intake' | 'loading' | 'dashboard' | 'detail';
