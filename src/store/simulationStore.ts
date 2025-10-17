// src/store/simulationStore.ts

import { create } from 'zustand';
import { Process, Queue, SimulationState, GanttEntry } from '@/types/mlfq';

// ----- Types -----
interface SimulationStore extends SimulationState {
  numQueues: number;
  agingInterval: number;

  // Actions
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
      | 'arrivalTime'
    >
  ) => void;
  removeProcess: (id: string) => void;
  updateProcess: (id: string, updates: Partial<Process>) => void;
  setNumQueues: (num: number) => void;
  setTimeQuantum: (queueLevel: number, quantum: number) => void;
  setAgingInterval: (interval: number) => void;

  // Simulation controls
  startSimulation: () => void;
  pauseSimulation: () => void;
  resumeSimulation: () => void;
  resetSimulation: () => void;
  stepSimulation: () => void;

  // Internal
  updateMetrics: () => void;
  addGanttEntry: (entry: GanttEntry) => void;
}

// ----- Helpers -----
const initialQueues: Queue[] = [
  { level: 0, timeQuantum: 4, processes: [] },
  { level: 1, timeQuantum: 8, processes: [] },
  { level: 2, timeQuantum: 16, processes: [] },
];

const calculateMetrics = (all: Process[], completed: Process[], currentTime: number) => {
  if (all.length === 0) {
    return {
      avgTurnaroundTime: 0,
      avgWaitingTime: 0,
      avgResponseTime: 0,
      throughput: 0,
      cpuUtilization: 0,
    };
  }

  const totalTurnaround = completed.reduce((sum, p) => sum + p.turnaroundTime, 0);
  const totalWaiting = completed.reduce((sum, p) => sum + p.waitingTime, 0);
  const totalResponse = completed.reduce((sum, p) => sum + (p.responseTime || 0), 0);
  const totalBurst = all.reduce((sum, p) => sum + p.burstTime, 0);

  return {
    avgTurnaroundTime:
      completed.length > 0 ? totalTurnaround / completed.length : 0,
    avgWaitingTime:
      completed.length > 0 ? totalWaiting / completed.length : 0,
    avgResponseTime:
      completed.length > 0 ? totalResponse / completed.length : 0,
    throughput: completed.length / (currentTime || 1),
    cpuUtilization:
      currentTime > 0 ? (totalBurst / currentTime) * 100 : 0,
  };
};

let simulationInterval: NodeJS.Timeout | null = null;

// ----- Store -----
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

  // ---------- Basic State Updates ----------
  setQueues: (queues) => set({ queues }),

  addProcess: (processData) => {
    const state = get();
    const id = `P${Date.now()}`;
    const newProcess: Process = {
      ...processData,
      id,
      arrivalTime: state.currentTime,
      remainingTime: processData.burstTime,
      waitingTime: 0,
      turnaroundTime: 0,
      quantumUsed: 0,
      state: 'waiting',
    };

    const updatedQueues = [...state.queues];
    if (updatedQueues[0]) {
      updatedQueues[0] = {
        ...updatedQueues[0],
        processes: [...updatedQueues[0].processes, newProcess],
      };
    }

    set({ queues: updatedQueues });
  },

  removeProcess: (id) => {
    const state = get();
    const updatedQueues = state.queues.map((queue) => ({
      ...queue,
      processes: queue.processes.filter((p) => p.id !== id),
    }));
    set({ queues: updatedQueues });
  },

  updateProcess: (id, updates) => {
    const state = get();
    const updatedQueues = state.queues.map((queue) => ({
      ...queue,
      processes: queue.processes.map((p) =>
        p.id === id ? { ...p, ...updates } : p
      ),
    }));
    set({ queues: updatedQueues });
  },

  setNumQueues: (num) => {
    const state = get();
    const newQueues: Queue[] = [];
    for (let i = 0; i < num; i++) {
      const existingQueue = state.queues[i];
      newQueues.push({
        level: i,
        timeQuantum: existingQueue?.timeQuantum || Math.pow(2, i + 2),
        processes: existingQueue?.processes || [],
      });
    }
    set({ numQueues: num, queues: newQueues });
  },

  setTimeQuantum: (queueLevel, quantum) => {
    const state = get();
    const updatedQueues = state.queues.map((queue) =>
      queue.level === queueLevel ? { ...queue, timeQuantum: quantum } : queue
    );
    set({ queues: updatedQueues });
  },

  setAgingInterval: (interval) => set({ agingInterval: interval }),

  // ---------- Simulation Control ----------
  startSimulation: () => {
    const { isRunning } = get();
    if (isRunning) return;

    set({ isRunning: true, isPaused: false });
    simulationInterval = setInterval(() => {
      const { isPaused, isRunning } = get();
      if (!isRunning || isPaused) {
        clearInterval(simulationInterval!);
        return;
      }
      get().stepSimulation();
    }, 200); // Simulation speed: 200ms per step
  },

  pauseSimulation: () => set({ isPaused: true }),

  resumeSimulation: () => {
    const { isRunning, isPaused } = get();
    if (isRunning && isPaused) {
      set({ isPaused: false });
      get().startSimulation();
    }
  },

  resetSimulation: () => {
    if (simulationInterval) clearInterval(simulationInterval);
    const state = get();
    const resetQueues = state.queues.map((q) => ({ ...q, processes: [] }));
    set({
      queues: resetQueues,
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

  // ---------- Step Simulation ----------
  stepSimulation: () => {
    const state = get();
    const queues = [...state.queues];
    let currentTime = state.currentTime + 1;

    // Find the first non-empty queue
    const activeQueue = queues.find((q) => q.processes.length > 0);

    if (!activeQueue) {
      // CPU is idle
      set({ currentTime, activeProcess: null });
      get().updateMetrics();
      return;
    }

    // Run the process at the head of this queue
    let process = { ...activeQueue.processes[0] };
    process.state = 'running';
    process.remainingTime -= 1;
    process.quantumUsed += 1;

    // If process starts for the first time
    if (process.responseTime === undefined) {
      process.responseTime = currentTime - process.arrivalTime;
    }

    // Add to Gantt chart
    get().addGanttEntry({
      processId: process.id,
      queueLevel: activeQueue.level,
      startTime: state.currentTime,
      endTime: currentTime,
    });

    // Check for completion
    if (process.remainingTime <= 0) {
      process.turnaroundTime = currentTime - process.arrivalTime;
      process.waitingTime = process.turnaroundTime - process.burstTime;
      process.state = 'completed';

      activeQueue.processes.shift();
      const completed = [...state.completedProcesses, process];

      set({
        queues,
        completedProcesses: completed,
        currentTime,
        activeProcess: null,
      });

      get().updateMetrics();
      return;
    }

    // Quantum exceeded → demote to next queue
    if (process.quantumUsed >= activeQueue.timeQuantum) {
      process.quantumUsed = 0;
      activeQueue.processes.shift();

      const nextLevel = Math.min(activeQueue.level + 1, queues.length - 1);
      queues[nextLevel].processes.push(process);
    } else {
      activeQueue.processes[0] = process;
    }

    // Update state
    set({
      queues,
      activeProcess: process,
      currentTime,
    });

    get().updateMetrics();
  },

  // ---------- Metric Updates ----------
  updateMetrics: () => {
    const state = get();

    // include both completed + running for live view
    const allProcesses: Process[] = [
      ...state.completedProcesses,
      ...state.queues.flatMap((q) => q.processes),
    ];

    const metrics = calculateMetrics(allProcesses, state.completedProcesses, state.currentTime);
    set({ metrics: { ...metrics } });
  },

  addGanttEntry: (entry) => {
    const state = get();
    set({ ganttChart: [...state.ganttChart, entry] });
  },
}));
