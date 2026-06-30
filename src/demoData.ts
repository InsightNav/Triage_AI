import { Task } from "./types";

export function getDemoTasks(): Task[] {
  const getTodayAt = (h: number, m: number) => {
    const d = new Date();
    d.setHours(h, m, 0, 0);
    return d;
  };
  const getTomorrowAt = (h: number, m: number) => {
    const d = new Date();
    d.setDate(d.getDate() + 1);
    d.setHours(h, m, 0, 0);
    return d;
  };
  const getThisFridayAt = (h: number, m: number) => {
    const d = new Date();
    const diff = (5 - d.getDay() + 7) % 7 || 7;
    d.setDate(d.getDate() + diff);
    d.setHours(h, m, 0, 0);
    return d;
  };

  const tasks = [
    {
      id: 'demo-1',
      name: 'Client Presentation Deck',
      deadline: getTodayAt(17, 0),
      hoursNeeded: 3,
      category: 'Work' as const,
      importance: 'High' as const,
      blocksOthers: true,
      isDemo: true
    },
    {
      id: 'demo-2',
      name: 'Electricity Bill Payment',
      deadline: getTomorrowAt(23, 59),
      hoursNeeded: 0.5,
      category: 'Finance' as const,
      importance: 'High' as const,
      blocksOthers: false,
      isDemo: true
    },
    {
      id: 'demo-3',
      name: 'Weekly Team Standup',
      deadline: getTodayAt(15, 0),
      hoursNeeded: 1,
      category: 'Work' as const,
      importance: 'Medium' as const,
      blocksOthers: false,
      isDemo: true
    },
    {
      id: 'demo-4',
      name: 'Project Status Report',
      deadline: getThisFridayAt(18, 0),
      hoursNeeded: 2,
      category: 'Work' as const,
      importance: 'Medium' as const,
      blocksOthers: false,
      isDemo: true
    }
  ];

  return tasks.map(task => {
    const d = task.deadline;
    const deadlineDate = d.toISOString().split('T')[0];
    const deadlineTime = d.toTimeString().substring(0, 5);
    return {
      id: task.id,
      name: task.name,
      hoursNeeded: task.hoursNeeded,
      category: task.category,
      importance: task.importance,
      blocksOthers: task.blocksOthers,
      isDemo: task.isDemo,
      deadlineDate,
      deadlineTime,
    } as Task;
  });
}
