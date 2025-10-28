import { create } from 'zustand';
import { Process, Queue, SimulationState, GanttEntry, SchedulingAlgorithm } from '@/types/mlfq';
import { stepMLFQ, stepFIFO, stepSJF, stepSTCF, stepRR } from './schedulingAlgorithms';

interface SimulationStore extends SimulationState {
  numQueues: number;
  agingInterval: number;
  boostInterval: number;

  setAlgorithm: (algorithm: SchedulingAlgorithm) => void;
  setRRQuantum: (quantum: number) => void;
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
  setBoostInterval: (interval: number) => void;

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
  { level: 3, timeQuantum: 32, processes: [] },
];

const calculateMetrics = (all: Process[], completed: Process[], currentTime: number) => {
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
  
  // CPU Utilization: sum of all burst times / current time
  const totalBurstTime = all.reduce((sum, p) => sum + p.burstTime, 0);

  return {
    avgTurnaroundTime: totalTurnaround / completed.length,
    avgWaitingTime: totalWaiting / completed.length,
    avgResponseTime: totalResponse / completed.length,
    throughput: currentTime > 0 ? completed.length / currentTime : 0,
    cpuUtilization: currentTime > 0 ? Math.min((totalBurstTime / currentTime) * 100, 100) : 0,
  };
};

let simulationInterval: NodeJS.Timeout | null = null;
let processCounter = 0; // For unique IDs

export const useSimulationStore = create<SimulationStore>((set, get) => ({
  algorithm: 'MLFQ',
  queues: initialQueues,
  readyQueue: [],
  currentTime: 0,
  isRunning: false,
  isPaused: false,
  completedProcesses: [],
  ganttChart: [],
  activeProcess: null,
  numQueues: 4,
  agingInterval: 10,
  boostInterval: 50,
  rrQuantum: 4,
  metrics: {
    avgTurnaroundTime: 0,
    avgWaitingTime: 0,
    avgResponseTime: 0,
    throughput: 0,
    cpuUtilization: 0,
  },

  setAlgorithm: (algorithm) => set({ algorithm }),
  
  setRRQuantum: (quantum) => set({ rrQuantum: quantum }),

  setQueues: (queues) => set({ queues }),

  addProcess: (data) => {
    if (data.burstTime <= 0) {
      console.error('Burst time must be positive');
      return;
    }

    const state = get();
    processCounter++;
    const id = `P${processCounter}`;
    const arrivalTime = data.arrivalTime ?? 0;
    
    const newProcess: Process = {
      id,
      name: data.name,
      arrivalTime,
      burstTime: data.burstTime,
      priority: 0, // Always start in highest-priority queue per MLFQ spec
      remainingTime: data.burstTime,
      waitingTime: 0,
      turnaroundTime: 0,
      quantumUsed: 0,
      responseTime: undefined,
      state: 'waiting',
    };

    console.log('Adding process:', { 
      id, 
      algorithm: state.algorithm,
      arrivalTime, 
      burstTime: data.burstTime,
      remainingTime: newProcess.remainingTime,
      quantumUsed: newProcess.quantumUsed,
      currentTime: state.currentTime 
    });

    set((state) => {
      if (state.algorithm === 'MLFQ') {
        const updated = [...state.queues];
        updated[0].processes.push(newProcess);
        return { queues: updated };
      } else {
        return { readyQueue: [...state.readyQueue, newProcess] };
      }
    });
  },

  removeProcess: (id) => {
    set((state) => ({
      queues: state.queues.map((q) => ({
        ...q,
        processes: q.processes.filter((p) => p.id !== id),
      })),
      completedProcesses: state.completedProcesses.filter((p) => p.id !== id),
    }));
  },

  updateProcess: (id, updates) => {
    set((state) => ({
      queues: state.queues.map((q) => ({
        ...q,
        processes: q.processes.map((p) => (p.id === id ? { ...p, ...updates } : p)),
      })),
      completedProcesses: state.completedProcesses.map((p) =>
        p.id === id ? { ...p, ...updates } : p
      ),
    }));
  },

  setNumQueues: (num) =>
    set((state) => {
      const newQueues: Queue[] = [];
      for (let i = 0; i < num; i++) {
        const existing = state.queues[i];
        const defaultQuantum = Math.pow(2, i + 2);
        
        newQueues.push({
          level: i,
          timeQuantum: existing?.timeQuantum ?? defaultQuantum,
          processes: existing?.processes ? [...existing.processes] : [],
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
  
  setBoostInterval: (interval) => set({ boostInterval: interval }),

  startSimulation: () => {
    const state = get();
    if (state.isRunning) return;

    set({ isRunning: true, isPaused: false });

    if (simulationInterval) clearInterval(simulationInterval);

    simulationInterval = setInterval(() => {
      const currentState = get();
      if (!currentState.isRunning || currentState.isPaused) {
        return;
      }
      
      get().stepSimulation();
    }, 500);
  },

  pauseSimulation: () => set({ isPaused: true }),

  resumeSimulation: () => {
    const { isRunning, isPaused } = get();
    if (isRunning && isPaused) set({ isPaused: false });
  },

  resetSimulation: () => {
    if (simulationInterval) {
      clearInterval(simulationInterval);
      simulationInterval = null;
    }
    processCounter = 0;
    set({
      queues: initialQueues.map((q) => ({ ...q, processes: [] })),
      readyQueue: [],
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
    set((state) => {
      if (!state.isRunning || state.isPaused) return state;

      const algorithm = state.algorithm;
      let result;

      if (algorithm === 'MLFQ') {
        const queues: Queue[] = JSON.parse(JSON.stringify(state.queues));
        result = stepMLFQ(queues, [...state.completedProcesses], [...state.ganttChart], state.currentTime);
        
        // Check if simulation complete
        if (result.activeProcess === null && result.completedProcesses.length > 0 && result.queues.every(q => q.processes.length === 0)) {
          if (simulationInterval) {
            clearInterval(simulationInterval);
            simulationInterval = null;
          }
          const allProcesses = [...result.completedProcesses];
          const finalMetrics = calculateMetrics(allProcesses, result.completedProcesses, result.currentTime);
          return {
            ...state,
            queues: result.queues,
            currentTime: result.currentTime,
            activeProcess: null,
            completedProcesses: result.completedProcesses,
            ganttChart: result.ganttChart,
            isRunning: false,
            metrics: finalMetrics,
          };
        }

        const allProcesses = [...result.completedProcesses, ...result.queues.flatMap(q => q.processes)];
        const newMetrics = calculateMetrics(allProcesses, result.completedProcesses, result.currentTime);
        
        return {
          ...state,
          queues: result.queues,
          currentTime: result.currentTime,
          activeProcess: result.activeProcess,
          completedProcesses: result.completedProcesses,
          ganttChart: result.ganttChart,
          metrics: newMetrics,
        };
      } else {
        // For other algorithms, use readyQueue
        const readyQueue = JSON.parse(JSON.stringify(state.readyQueue));
        
        switch (algorithm) {
          case 'FIFO':
            result = stepFIFO(readyQueue, [...state.completedProcesses], [...state.ganttChart], state.currentTime);
            break;
          case 'SJF':
            result = stepSJF(readyQueue, [...state.completedProcesses], [...state.ganttChart], state.currentTime);
            break;
          case 'STCF':
            result = stepSTCF(readyQueue, [...state.completedProcesses], [...state.ganttChart], state.currentTime);
            break;
          case 'RR':
            result = stepRR(readyQueue, [...state.completedProcesses], [...state.ganttChart], state.currentTime, state.rrQuantum);
            break;
          default:
            return state;
        }

        // Check if simulation complete
        if (result.activeProcess === null && result.completedProcesses.length > 0 && result.readyQueue.length === 0) {
          if (simulationInterval) {
            clearInterval(simulationInterval);
            simulationInterval = null;
          }
          const allProcesses = [...result.completedProcesses];
          const finalMetrics = calculateMetrics(allProcesses, result.completedProcesses, result.currentTime);
          return {
            ...state,
            readyQueue: result.readyQueue,
            currentTime: result.currentTime,
            activeProcess: null,
            completedProcesses: result.completedProcesses,
            ganttChart: result.ganttChart,
            isRunning: false,
            metrics: finalMetrics,
          };
        }

        const allProcesses = [...result.completedProcesses, ...result.readyQueue];
        const newMetrics = calculateMetrics(allProcesses, result.completedProcesses, result.currentTime);
        
        return {
          ...state,
          readyQueue: result.readyQueue,
          currentTime: result.currentTime,
          activeProcess: result.activeProcess,
          completedProcesses: result.completedProcesses,
          ganttChart: result.ganttChart,
          metrics: newMetrics,
        };
      }
    });
  },

  updateMetrics: () => {
    const state = get();
    const queues = state.queues ?? [];
    const allInQueues = queues.flatMap(q => q.processes ?? []);
    const all = [...(state.completedProcesses ?? []), ...allInQueues];
    const metrics = calculateMetrics(all, state.completedProcesses ?? [], state.currentTime);
    set({ metrics });
  },

  addGanttEntry: (entry) =>
    set((state) => ({ ganttChart: [...state.ganttChart, entry] })),
}));
