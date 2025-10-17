import { create } from 'zustand';
import { Process, Queue, SimulationState, GanttEntry } from '@/types/mlfq';

interface SimulationStore extends SimulationState {
  // Configuration
  numQueues: number;
  agingInterval: number;
  
  // Actions
  setQueues: (queues: Queue[]) => void;
  addProcess: (process: Omit<Process, 'id' | 'remainingTime' | 'waitingTime' | 'turnaroundTime' | 'quantumUsed' | 'state'>) => void;
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

const initialQueues: Queue[] = [
  { level: 0, timeQuantum: 4, processes: [] },
  { level: 1, timeQuantum: 8, processes: [] },
  { level: 2, timeQuantum: 16, processes: [] },
];

const calculateMetrics = (completed: Process[], currentTime: number) => {
  if (completed.length === 0) {
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
  const totalBurst = completed.reduce((sum, p) => sum + p.burstTime, 0);

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

  addProcess: (processData) => {
    const state = get();
    const id = `P${Date.now()}`;
    const newProcess: Process = {
      ...processData,
      id,
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
    const updatedQueues = state.queues.map(queue => ({
      ...queue,
      processes: queue.processes.filter(p => p.id !== id),
    }));
    set({ queues: updatedQueues });
  },

  updateProcess: (id, updates) => {
    const state = get();
    const updatedQueues = state.queues.map(queue => ({
      ...queue,
      processes: queue.processes.map(p => 
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
    const updatedQueues = state.queues.map(queue =>
      queue.level === queueLevel ? { ...queue, timeQuantum: quantum } : queue
    );
    set({ queues: updatedQueues });
  },

  setAgingInterval: (interval) => set({ agingInterval: interval }),

  startSimulation: () => set({ isRunning: true, isPaused: false }),
  
  pauseSimulation: () => set({ isPaused: true }),
  
  resumeSimulation: () => set({ isPaused: false }),
  
  resetSimulation: () => {
    const state = get();
    const resetQueues = state.queues.map(q => ({ ...q, processes: [] }));
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

  stepSimulation: () => {
    const state = get();
    // This will be implemented with the actual MLFQ algorithm
    console.log('Step simulation', state.currentTime);
  },

  updateMetrics: () => {
    const state = get();
    const metrics = calculateMetrics(state.completedProcesses, state.currentTime);
    set({ metrics });
  },

  addGanttEntry: (entry) => {
    const state = get();
    set({ ganttChart: [...state.ganttChart, entry] });
  },
}));
