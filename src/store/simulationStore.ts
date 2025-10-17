import { create } from 'zustand';
import { Process, Queue, SimulationState, GanttEntry } from '@/types/mlfq';

interface SimulationStore extends SimulationState {
  numQueues: number;
  agingInterval: number;

  setQueues: (queues: Queue[]) => void;
  addProcess: (
    process: Omit<
      Process,
      | 'id'
      | 'remainingTime'
      | 'waitingTime'
      | 'turnaroundTime'
      | 'quantumUsed'
      | 'state'
      | 'responseTime'
    >
  ) => void;
  removeProcess: (id: string) => void;
  updateProcess: (id: string, updates: Partial<Process>) => void;
  setNumQueues: (num: number) => void;
  setTimeQuantum: (queueLevel: number, quantum: number) => void;
  setAgingInterval: (interval: number) => void;

  startSimulation: () => void;
  pauseSimulation: () => void;
  resumeSimulation: () => void;
  resetSimulation: () => void;
  stepSimulation: () => void;

  updateMetrics: () => void;
  addGanttEntry: (entry: GanttEntry) => void;
}

const initialQueues: Queue[] = [
  { level: 0, timeQuantum: 4, processes: [] },
  { level: 1, timeQuantum: 8, processes: [] },
  { level: 2, timeQuantum: 16, processes: [] },
];

const calculateMetrics = (completed: Process[], currentTime: number) => {
  if (completed.length === 0)
    return {
      avgTurnaroundTime: 0,
      avgWaitingTime: 0,
      avgResponseTime: 0,
      throughput: 0,
      cpuUtilization: 0,
    };

  const totalTurnaround = completed.reduce((s, p) => s + p.turnaroundTime, 0);
  const totalWaiting = completed.reduce((s, p) => s + p.waitingTime, 0);
  const totalResponse = completed.reduce((s, p) => s + (p.responseTime || 0), 0);
  const totalBurst = completed.reduce((s, p) => s + p.burstTime, 0);

  return {
    avgTurnaroundTime: totalTurnaround / completed.length,
    avgWaitingTime: totalWaiting / completed.length,
    avgResponseTime: totalResponse / completed.length,
    throughput: completed.length / (currentTime || 1),
    cpuUtilization: currentTime > 0 ? (totalBurst / currentTime) * 100 : 0,
  };
};

export const useSimulationStore = create<SimulationStore>((set, get) => ({
  queues: initialQueues,
  currentTime: 0,
  isRunning: false,
  isPaused: false,
  completedProcesses: [],
  ganttChart: [],
  activeProcess: null,
  numQueues: 3,
  agingInterval: 5,
  metrics: {
    avgTurnaroundTime: 0,
    avgWaitingTime: 0,
    avgResponseTime: 0,
    throughput: 0,
    cpuUtilization: 0,
  },

  setQueues: (queues) => set({ queues }),

  addProcess: (data) => {
    const id = `P${Date.now()}`;
    const newProcess: Process = {
      ...data,
      id,
      remainingTime: data.burstTime,
      waitingTime: 0,
      turnaroundTime: 0,
      quantumUsed: 0,
      responseTime: undefined,
      state: 'waiting',
    };

    set((state) => {
      const updated = [...state.queues];
      updated[0].processes.push(newProcess);
      return { queues: updated };
    });
  },

  removeProcess: (id) => {
    set((state) => ({
      queues: state.queues.map((q) => ({
        ...q,
        processes: q.processes.filter((p) => p.id !== id),
      })),
    }));
  },

  updateProcess: (id, updates) => {
    set((state) => ({
      queues: state.queues.map((q) => ({
        ...q,
        processes: q.processes.map((p) =>
          p.id === id ? { ...p, ...updates } : p
        ),
      })),
    }));
  },

  setNumQueues: (num) =>
    set((state) => {
      const newQueues: Queue[] = [];
      for (let i = 0; i < num; i++) {
        newQueues.push({
          level: i,
          timeQuantum: state.queues[i]?.timeQuantum || Math.pow(2, i + 2),
          processes: state.queues[i]?.processes || [],
        });
      }
      return { numQueues: num, queues: newQueues };
    }),

  setTimeQuantum: (level, quantum) =>
    set((state) => ({
      queues: state.queues.map((q) =>
        q.level === level ? { ...q, timeQuantum: quantum } : q
      ),
    })),

  setAgingInterval: (interval) => set({ agingInterval: interval }),

  startSimulation: () => set({ isRunning: true, isPaused: false }),
  pauseSimulation: () => set({ isPaused: true }),
  resumeSimulation: () => set({ isPaused: false }),

  resetSimulation: () => {
    set({
      queues: initialQueues.map((q) => ({ ...q, processes: [] })),
      currentTime: 0,
      isRunning: false,
      isPaused: false,
      completedProcesses: [],
      ganttChart: [],
      activeProcess: null,
      metrics: {
        avgTurnaroundTime: 0,
        avgWaitingTime: 0,
        avgResponseTime: 0,
        throughput: 0,
        cpuUtilization: 0,
      },
    });
  },

  stepSimulation: () => {
    const state = get();
    if (state.isPaused || !state.isRunning) return;

    const queues = [...state.queues];
    const active =
      state.activeProcess ||
      queues.find((q) => q.processes.length > 0)?.processes[0] ||
      null;

    if (!active) return;

    const queueLevel = queues.findIndex((q) =>
      q.processes.some((p) => p.id === active.id)
    );
    const currentQueue = queues[queueLevel];

    if (active.responseTime === undefined) {
      active.responseTime = state.currentTime - active.arrivalTime;
    }

    // Execute 1ms of CPU time
    active.remainingTime -= 1;
    active.quantumUsed += 1;

    // Record in Gantt chart
    get().addGanttEntry({
      processId: active.id,
      start: state.currentTime,
      end: state.currentTime + 1,
      queueLevel,
    });

    let completed = [...state.completedProcesses];
    let newActive: Process | null = active;

    if (active.remainingTime <= 0) {
      active.turnaroundTime = state.currentTime + 1 - active.arrivalTime;
      completed = [...completed, active];
      queues[queueLevel].processes = queues[queueLevel].processes.filter(
        (p) => p.id !== active.id
      );
      newActive = null;
    } else if (active.quantumUsed >= currentQueue.timeQuantum) {
      // demote process
      queues[queueLevel].processes = queues[queueLevel].processes.filter(
        (p) => p.id !== active.id
      );
      const nextLevel = Math.min(queueLevel + 1, queues.length - 1);
      queues[nextLevel].processes.push({ ...active, quantumUsed: 0 });
      newActive = null;
    }

    const nextActive =
      newActive ||
      queues.find((q) => q.processes.length > 0)?.processes[0] ||
      null;

    set({
      queues,
      currentTime: state.currentTime + 1,
      activeProcess: nextActive,
      completedProcesses: completed,
    });

    get().updateMetrics();
  },

  updateMetrics: () => {
    const { completedProcesses, currentTime } = get();
    const metrics = calculateMetrics(completedProcesses, currentTime);
    set({ metrics });
  },

  addGanttEntry: (entry) =>
    set((state) => ({ ganttChart: [...state.ganttChart, entry] })),
}));
