import { create } from 'zustand';
import { Process, Queue, SimulationState, GanttEntry } from '@/types/mlfq';

interface SimulationStore extends SimulationState {
  numQueues: number;
  agingInterval: number;
  boostInterval: number;

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
  queues: initialQueues,
  currentTime: 0,
  isRunning: false,
  isPaused: false,
  completedProcesses: [],
  ganttChart: [],
  activeProcess: null,
  numQueues: 4,
  agingInterval: 10,
  boostInterval: 50,
  metrics: {
    avgTurnaroundTime: 0,
    avgWaitingTime: 0,
    avgResponseTime: 0,
    throughput: 0,
    cpuUtilization: 0,
  },

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
    
    // CRITICAL: Don't spread data - explicitly set only the fields we need
    const newProcess: Process = {
      id,
      name: data.name,
      arrivalTime,
      burstTime: data.burstTime,
      priority: data.priority,
      remainingTime: data.burstTime,
      waitingTime: 0,
      turnaroundTime: 0,
      quantumUsed: 0,
      responseTime: undefined,
      state: 'waiting',
    };

    console.log('Adding process:', { 
      id, 
      arrivalTime, 
      burstTime: data.burstTime,
      remainingTime: newProcess.remainingTime,
      quantumUsed: newProcess.quantumUsed,
      currentTime: state.currentTime 
    });

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
    processCounter = 0; // Reset process counter
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
    set((state) => {
      if (!state.isRunning || state.isPaused) return state;

      // Deep clone to avoid mutations
      const queues: Queue[] = JSON.parse(JSON.stringify(state.queues));
      const currentTime = state.currentTime;
      const completedProcesses = [...state.completedProcesses];
      const ganttChart = [...state.ganttChart];
      
      // Rule 1: Find highest priority non-empty queue
      const activeQueueIndex = queues.findIndex(q => q.processes.length > 0);
      
      if (activeQueueIndex === -1) {
        // No processes available - CPU is idle
        console.log(`Time ${currentTime}: CPU IDLE`);
        
        // Check if simulation should end
        if (completedProcesses.length > 0 && queues.every(q => q.processes.length === 0)) {
          console.log(`Simulation complete at time ${currentTime}`);
          if (simulationInterval) {
            clearInterval(simulationInterval);
            simulationInterval = null;
          }
          
          // Final metrics calculation
          const allProcesses = [...completedProcesses];
          const finalMetrics = calculateMetrics(allProcesses, completedProcesses, currentTime);
          
          return {
            ...state,
            currentTime,
            activeProcess: null,
            queues,
            isRunning: false,
            metrics: finalMetrics,
          };
        }
        
        // Continue idle - increment time
        return {
          ...state,
          currentTime: currentTime + 1,
          activeProcess: null,
          queues
        };
      }

      // Rule 2: Get process from front of queue (FIFO within queue)
      const activeQueue = queues[activeQueueIndex];
      const process = activeQueue.processes.shift()!;
      
      // Set response time on FIRST execution only
      if (process.responseTime === undefined) {
        process.responseTime = currentTime - process.arrivalTime;
        console.log(`Time ${currentTime}: ${process.id} gets CPU for FIRST time (Response Time: ${process.responseTime})`);
      }

      // Execute for 1 time unit
      process.remainingTime -= 1;
      process.quantumUsed += 1;
      process.state = 'running';

      console.log(`Time ${currentTime}: Running ${process.id} (Q${activeQueueIndex}) - Remaining: ${process.remainingTime}, Quantum: ${process.quantumUsed}/${activeQueue.timeQuantum}`);

      // Add to Gantt chart (one entry per time unit)
      ganttChart.push({
        processId: process.id,
        processName: process.name,
        startTime: currentTime,
        endTime: currentTime + 1,
        queueLevel: activeQueue.level,
      });

      // Rule 4: Check if process completed
      if (process.remainingTime <= 0) {
        process.state = 'completed';
        process.completionTime = currentTime + 1;
        process.turnaroundTime = process.completionTime - process.arrivalTime;
        process.waitingTime = process.turnaroundTime - process.burstTime;
        
        completedProcesses.push(process);
        
        console.log(`Time ${currentTime + 1}: ${process.id} COMPLETED`);
        console.log(`  Metrics - Turnaround: ${process.turnaroundTime}, Waiting: ${process.waitingTime}, Response: ${process.responseTime}`);
        
        // Calculate metrics with updated completed processes
        const allProcesses = [...completedProcesses, ...queues.flatMap(q => q.processes)];
        const newMetrics = calculateMetrics(allProcesses, completedProcesses, currentTime + 1);
        
        return {
          ...state,
          queues,
          currentTime: currentTime + 1,
          activeProcess: null,
          completedProcesses,
          ganttChart,
          metrics: newMetrics,
        };
      }

      // Rule 3: Check if quantum expired
      if (process.quantumUsed >= activeQueue.timeQuantum) {
        // Quantum fully used - demote to next lower priority queue
        const nextLevel = Math.min(activeQueueIndex + 1, queues.length - 1);
        
        // Rule 5: Reset quantum counter when moving to new queue
        process.quantumUsed = 0;
        process.state = 'waiting';
        
        queues[nextLevel].processes.push(process);
        console.log(`Time ${currentTime + 1}: ${process.id} quantum expired, demoted from Q${activeQueueIndex} to Q${nextLevel}`);
      } else {
        // Quantum not expired - return to back of same queue (Round Robin)
        process.state = 'waiting';
        activeQueue.processes.push(process);
        console.log(`Time ${currentTime + 1}: ${process.id} returns to back of Q${activeQueueIndex} (quantum: ${process.quantumUsed}/${activeQueue.timeQuantum})`);
      }

      // Update metrics
      const allProcesses = [...completedProcesses, ...queues.flatMap(q => q.processes)];
      const newMetrics = calculateMetrics(allProcesses, completedProcesses, currentTime + 1);

      return {
        ...state,
        queues,
        currentTime: currentTime + 1,
        activeProcess: process,
        ganttChart,
        completedProcesses,
        metrics: newMetrics,
      };
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
