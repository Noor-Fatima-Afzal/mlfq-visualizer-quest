// // src/store/simulationStore.ts
// import { create } from 'zustand';
// import { Process, Queue, SimulationState, GanttEntry } from '@/types/mlfq';

// interface SimulationStore extends SimulationState {
//   numQueues: number;
//   agingInterval: number;

//   setQueues: (queues: Queue[]) => void;
//   addProcess: (
//     process: Omit<
//       Process,
//       | 'id'
//       | 'remainingTime'
//       | 'waitingTime'
//       | 'turnaroundTime'
//       | 'quantumUsed'
//       | 'state'
//       | 'arrivalTime'
//       | 'responseTime'
//     >
//   ) => void;
//   removeProcess: (id: string) => void;
//   updateProcess: (id: string, updates: Partial<Process>) => void;
//   setNumQueues: (num: number) => void;
//   setTimeQuantum: (queueLevel: number, quantum: number) => void;
//   setAgingInterval: (interval: number) => void;

//   startSimulation: () => void;
//   pauseSimulation: () => void;
//   resumeSimulation: () => void;
//   resetSimulation: () => void;
//   stepSimulation: () => void;

//   updateMetrics: () => void;
//   addGanttEntry: (entry: GanttEntry) => void;
// }

// const initialQueues: Queue[] = [
//   { level: 0, timeQuantum: 4, processes: [] },
//   { level: 1, timeQuantum: 8, processes: [] },
//   { level: 2, timeQuantum: 16, processes: [] },
// ];

// const calculateMetrics = (all: Process[], completed: Process[], currentTime: number) => {
//   if (all.length === 0) {
//     return {
//       avgTurnaroundTime: 0,
//       avgWaitingTime: 0,
//       avgResponseTime: 0,
//       throughput: 0,
//       cpuUtilization: 0,
//     };
//   }

//   const totalTurnaround = completed.reduce((sum, p) => sum + (p.turnaroundTime || 0), 0);
//   const totalWaiting = completed.reduce((sum, p) => sum + (p.waitingTime || 0), 0);
//   const totalResponse = completed.reduce((sum, p) => sum + (p.responseTime || 0), 0);
//   const totalBurst = all.reduce((sum, p) => sum + (p.burstTime || 0), 0);

//   return {
//     avgTurnaroundTime: completed.length > 0 ? totalTurnaround / completed.length : 0,
//     avgWaitingTime: completed.length > 0 ? totalWaiting / completed.length : 0,
//     avgResponseTime: completed.length > 0 ? totalResponse / completed.length : 0,
//     throughput: completed.length / Math.max(currentTime, 1),
//     cpuUtilization: currentTime > 0 ? (totalBurst / currentTime) * 100 : 0,
//   };
// };

// let simulationInterval: NodeJS.Timeout | null = null;

// export const useSimulationStore = create<SimulationStore>((set, get) => ({
//   queues: initialQueues,
//   currentTime: 0,
//   isRunning: false,
//   isPaused: false,
//   completedProcesses: [],
//   ganttChart: [],
//   activeProcess: null,
//   numQueues: 3,
//   agingInterval: 5,
//   metrics: {
//     avgTurnaroundTime: 0,
//     avgWaitingTime: 0,
//     avgResponseTime: 0,
//     throughput: 0,
//     cpuUtilization: 0,
//   },

//   // Basic setters
//   setQueues: (queues) => set({ queues }),

//   addProcess: (data) => {
//     const id = `P${Date.now()}`;
//     const newProcess: Process = {
//       ...data,
//       id,
//       arrivalTime: get().currentTime,
//       remainingTime: data.burstTime,
//       waitingTime: 0,
//       turnaroundTime: 0,
//       quantumUsed: 0,
//       responseTime: undefined,
//       state: 'waiting',
//     };

//     set((state) => {
//       const updated = state.queues.map((q) => ({ ...q, processes: [...q.processes] }));
//       // push to highest priority queue (level 0)
//       if (updated[0]) updated[0].processes.push(newProcess);
//       else updated[0] = { level: 0, timeQuantum: 4, processes: [newProcess] };

//       return { queues: updated };
//     });
//   },

//   removeProcess: (id) => {
//     set((state) => ({
//       queues: state.queues.map((q) => ({
//         ...q,
//         processes: q.processes.filter((p) => p.id !== id),
//       })),
//       completedProcesses: state.completedProcesses.filter((p) => p.id !== id),
//     }));
//   },

//   updateProcess: (id, updates) => {
//     set((state) => ({
//       queues: state.queues.map((q) => ({
//         ...q,
//         processes: q.processes.map((p) => (p.id === id ? { ...p, ...updates } : p)),
//       })),
//       completedProcesses: state.completedProcesses.map((p) => (p.id === id ? { ...p, ...updates } : p)),
//     }));
//   },

//   setNumQueues: (num) =>
//     set((state) => {
//       const newQueues: Queue[] = [];
//       for (let i = 0; i < num; i++) {
//         const existing = state.queues[i];
//         newQueues.push({
//           level: i,
//           timeQuantum: existing?.timeQuantum ?? Math.pow(2, i + 2),
//           processes: existing?.processes ? [...existing.processes] : [],
//         });
//       }
//       return { numQueues: num, queues: newQueues };
//     }),

//   setTimeQuantum: (level, quantum) =>
//     set((state) => ({
//       queues: state.queues.map((q) => (q.level === level ? { ...q, timeQuantum: quantum } : q)),
//     })),

//   setAgingInterval: (interval) => set({ agingInterval: interval }),

//   // Simulation control: start / pause / resume / reset
//   startSimulation: () => {
//     const { isRunning } = get();
//     if (isRunning) return;

//     set({ isRunning: true, isPaused: false });

//     if (simulationInterval) clearInterval(simulationInterval);

//     simulationInterval = setInterval(() => {
//       const { isRunning: running, isPaused } = get();
//       if (!running || isPaused) return;
//       get().stepSimulation();
//     }, 300); // ms per tick (adjust for speed)
//   },

//   pauseSimulation: () => {
//     set({ isPaused: true });
//   },

//   resumeSimulation: () => {
//     const { isRunning, isPaused } = get();
//     if (isRunning && isPaused) {
//       set({ isPaused: false });
//     }
//   },

//   resetSimulation: () => {
//     if (simulationInterval) {
//       clearInterval(simulationInterval);
//       simulationInterval = null;
//     }
//     set({
//       queues: initialQueues.map((q) => ({ ...q, processes: [] })),
//       currentTime: 0,
//       isRunning: false,
//       isPaused: false,
//       completedProcesses: [],
//       ganttChart: [],
//       activeProcess: null,
//       metrics: {
//         avgTurnaroundTime: 0,
//         avgWaitingTime: 0,
//         avgResponseTime: 0,
//         throughput: 0,
//         cpuUtilization: 0,
//       },
//     });
//   },

//   // Core step logic
//   // Core step logic (revised)
// stepSimulation: () => {
//   const state = get();
//   if (!state.isRunning) return;

//   const queues: Queue[] = state.queues.map((q) => ({ ...q, processes: [...q.processes] }));
//   const prevTime = state.currentTime;
//   const currentTime = prevTime + 1;

//   // Pick highest-priority non-empty queue
//   const activeQueue = queues.find((q) => q.processes.length > 0);

//   // If no active process at all
//   if (!activeQueue) {
//     // Still advance time (CPU idle)
//     set({ currentTime, activeProcess: null });
//     get().updateMetrics();

//     // Stop only when ALL queues empty AND all processes completed
//     const allQueuesEmpty = queues.every((q) => q.processes.length === 0);
//     const allDone = allQueuesEmpty && state.completedProcesses.length > 0;
//     if (allDone) {
//       if (simulationInterval) clearInterval(simulationInterval);
//       set({ isRunning: false });
//     }
//     return;
//   }

//   const procRef = activeQueue.processes[0];

//   // Mark first response time
//   if (procRef.responseTime === undefined) {
//     procRef.responseTime = currentTime - procRef.arrivalTime;
//   }

//   // Execute 1ms of CPU time
//   procRef.remainingTime -= 1;
//   procRef.quantumUsed = (procRef.quantumUsed || 0) + 1;
//   procRef.state = 'running';

//   // Record Gantt entry
//   get().addGanttEntry({
//     processId: procRef.id,
//     queueLevel: activeQueue.level,
//     start: prevTime,
//     end: currentTime,
//   });

//   // Update waiting time for all other processes
//   queues.forEach((q) => {
//     q.processes.forEach((p) => {
//       if (p.id !== procRef.id && p.state !== 'completed') {
//         p.waitingTime = (p.waitingTime || 0) + 1;
//       }
//     });
//   });

//   // ✅ Completion check
//   const completedProcesses = [...state.completedProcesses];
//   if (procRef.remainingTime <= 0) {
//     procRef.turnaroundTime = currentTime - procRef.arrivalTime;
//     procRef.waitingTime = procRef.turnaroundTime - procRef.burstTime;
//     procRef.state = 'completed';

//     activeQueue.processes.shift();
//     completedProcesses.push(procRef);

//     set({
//       queues,
//       currentTime,
//       activeProcess: null,
//       completedProcesses,
//     });

//     get().updateMetrics();

//     // Only stop if EVERYTHING is done
//     const allDone = queues.every((q) => q.processes.length === 0);
//     if (allDone) {
//       if (simulationInterval) clearInterval(simulationInterval);
//       set({ isRunning: false });
//     }
//     return;
//   }

//   // ✅ Quantum expiry → demote if possible
//   if (procRef.quantumUsed >= activeQueue.timeQuantum) {
//     procRef.quantumUsed = 0;
//     procRef.state = 'waiting';
//     activeQueue.processes.shift();

//     const nextLevel = Math.min(activeQueue.level + 1, queues.length - 1);
//     queues[nextLevel].processes.push(procRef);

//     // Reset waiting time aging counter
//     procRef.waitingTime = 0;

//     set({
//       queues,
//       currentTime,
//       activeProcess: null,
//     });

//     get().updateMetrics();
//     return;
//   }

//   // ✅ Otherwise continue running at head
//   activeQueue.processes[0] = procRef;

//   // ✅ Aging: promote periodically
//   if (state.agingInterval > 0 && currentTime % state.agingInterval === 0) {
//     for (let lvl = queues.length - 1; lvl > 0; lvl--) {
//       const q = queues[lvl];
//       const promote: Process[] = [];
//       const keep: Process[] = [];

//       for (const p of q.processes) {
//         if ((p.waitingTime || 0) >= state.agingInterval) {
//           promote.push({ ...p, quantumUsed: 0, state: 'waiting', waitingTime: 0 });
//         } else {
//           keep.push(p);
//         }
//       }

//       if (promote.length > 0) {
//         q.processes = keep;
//         queues[lvl - 1].processes.push(...promote);
//       }
//     }
//   }

//   // Commit updated state for this tick
//   set({
//     queues,
//     currentTime,
//     activeProcess: procRef,
//   });

//   get().updateMetrics();
// },


//   // Metrics: include both completed and in-queues for live readings
//   updateMetrics: () => {
//     const state = get();
//     const allInQueues = state.queues.flatMap((q) => q.processes);
//     const allProcesses = [...state.completedProcesses, ...allInQueues];
//     const metrics = calculateMetrics(allProcesses, state.completedProcesses, state.currentTime);
//     set({ metrics: { ...metrics } });
//   },

//   addGanttEntry: (entry) =>
//     set((state) => ({ ganttChart: [...state.ganttChart, entry] })),
// }));
// src/store/simulationStore.ts
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

  const totalTurnaround = completed.reduce((sum, p) => sum + (p.turnaroundTime || 0), 0);
  const totalWaiting = completed.reduce((sum, p) => sum + (p.waitingTime || 0), 0);
  const totalResponse = completed.reduce((sum, p) => sum + (p.responseTime || 0), 0);
  const totalBurst = all.reduce((sum, p) => sum + (p.burstTime || 0), 0);

  return {
    avgTurnaroundTime: completed.length > 0 ? totalTurnaround / completed.length : 0,
    avgWaitingTime: completed.length > 0 ? totalWaiting / completed.length : 0,
    avgResponseTime: completed.length > 0 ? totalResponse / completed.length : 0,
    throughput: completed.length / Math.max(currentTime, 1),
    cpuUtilization:
      currentTime > 0 ? Math.min((totalBurst / currentTime) * 100, 100) : 0,
  };
};

let simulationInterval: NodeJS.Timeout | null = null;

export const useSimulationStore = create<SimulationStore>((set, get) => ({
  queues: initialQueues,
  currentTime: 0,
  isRunning: false,
  isPaused: false,
  completedProcesses: [],
  ganttChart: [],
  activeProcess: null,
  numQueues: 3,
  agingInterval: 10,
  metrics: {
    avgTurnaroundTime: 0,
    avgWaitingTime: 0,
    avgResponseTime: 0,
    throughput: 0,
    cpuUtilization: 0,
  },

  // Basic setters
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
      arrivalTime: get().currentTime,
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
        newQueues.push({
          level: i,
          timeQuantum: existing?.timeQuantum ?? Math.pow(2, i + 2),
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

  // Simulation Control
  startSimulation: () => {
    const { isRunning } = get();
    if (isRunning) return;

    set({ isRunning: true, isPaused: false });

    if (simulationInterval) clearInterval(simulationInterval);

    simulationInterval = setInterval(() => {
      const { isRunning: running, isPaused } = get();
      if (!running || isPaused) return;
      get().stepSimulation();
    }, 300);
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

  // Core simulation step
  // ✅ Realistic Hybrid MLFQ Step Simulation
stepSimulation: () => {
  const state = get();
  if (!state.isRunning) return;

  const queues: Queue[] = state.queues.map((q) => ({ ...q, processes: [...q.processes] }));
  const prevTime = state.currentTime;
  const currentTime = prevTime + 1;

  // Remove empty queues safely
  const nonEmptyQueues = queues.filter((q) => q.processes.length > 0);

  if (nonEmptyQueues.length === 0) {
    // CPU idle, but time passes
    set({ currentTime, activeProcess: null });
    get().updateMetrics();

    // Stop only when nothing left to process
    const allDone = queues.every((q) => q.processes.length === 0);
    if (allDone && state.completedProcesses.length > 0) {
      if (simulationInterval) clearInterval(simulationInterval);
      set({ isRunning: false });
    }
    return;
  }

  // ✅ Pick topmost queue (highest priority)
  const activeQueue = nonEmptyQueues[0];

  // ✅ Sorting rules based on queue level
  if (activeQueue.level === 2) {
    // Q3 → Shortest Job First (SJF)
    activeQueue.processes.sort((a, b) => a.remainingTime - b.remainingTime);
  } else if (activeQueue.level === 3) {
    // Q4 → First Come First Serve (FCFS)
    activeQueue.processes.sort((a, b) => a.arrivalTime - b.arrivalTime);
  }

  // Get the process to run
  const procRef = activeQueue.processes[0];

  // Mark response time if first time running
  if (procRef.responseTime === undefined) {
    procRef.responseTime = currentTime - procRef.arrivalTime;
  }

  // Execute 1ms
  procRef.remainingTime -= 1;
  procRef.quantumUsed = (procRef.quantumUsed || 0) + 1;
  procRef.state = 'running';

  // Record Gantt chart entry
  get().addGanttEntry({
    processId: procRef.id,
    queueLevel: activeQueue.level,
    start: prevTime,
    end: currentTime,
  });

  // Update waiting time for other processes
  queues.forEach((q) => {
    q.processes.forEach((p) => {
      if (p.id !== procRef.id && p.state !== 'completed') {
        p.waitingTime = (p.waitingTime || 0) + 1;
      }
    });
  });

  // ✅ Completion check
  const completedProcesses = [...state.completedProcesses];
  if (procRef.remainingTime <= 0) {
    procRef.turnaroundTime = currentTime - procRef.arrivalTime;
    procRef.waitingTime = procRef.turnaroundTime - procRef.burstTime;
    procRef.state = 'completed';

    activeQueue.processes.shift();
    completedProcesses.push(procRef);

    set({
      queues,
      currentTime,
      activeProcess: null,
      completedProcesses,
    });

    get().updateMetrics();

    // Stop if all queues empty
    const allDone = queues.every((q) => q.processes.length === 0);
    if (allDone) {
      if (simulationInterval) clearInterval(simulationInterval);
      set({ isRunning: false });
    }
    return;
  }

  // ✅ Demotion rules
  if (activeQueue.level < 2) {
    // For RR queues (Q1, Q2)
    if (procRef.quantumUsed >= activeQueue.timeQuantum) {
      procRef.quantumUsed = 0;
      procRef.state = 'waiting';
      activeQueue.processes.shift();

      const nextLevel = Math.min(activeQueue.level + 1, queues.length - 1);
      queues[nextLevel].processes.push(procRef);

      set({
        queues,
        currentTime,
        activeProcess: null,
      });

      get().updateMetrics();
      return;
    }
  } else {
    // Q3 (SJF) and Q4 (FCFS) — non-preemptive
    // Keep running same process until completion
  }

  // ✅ Aging promotion (periodic)
  if (state.agingInterval > 0 && currentTime % state.agingInterval === 0) {
    for (let lvl = queues.length - 1; lvl > 0; lvl--) {
      const q = queues[lvl];
      const promote: Process[] = [];
      const keep: Process[] = [];

      for (const p of q.processes) {
        if ((p.waitingTime || 0) >= state.agingInterval) {
          promote.push({ ...p, quantumUsed: 0, state: 'waiting', waitingTime: 0 });
        } else {
          keep.push(p);
        }
      }

      if (promote.length > 0) {
        q.processes = keep;
        queues[lvl - 1].processes.push(...promote);
      }
    }
  }

  // ✅ Commit new state
  set({
    queues,
    currentTime,
    activeProcess: procRef,
  });

  get().updateMetrics();
},


  // Metrics
  updateMetrics: () => {
    const state = get();
    const allInQueues = state.queues.flatMap((q) => q.processes);
    const all = [...state.completedProcesses, ...allInQueues];
    const metrics = calculateMetrics(all, state.completedProcesses, state.currentTime);
    set({ metrics });
  },

  addGanttEntry: (entry) =>
    set((state) => ({ ganttChart: [...state.ganttChart, entry] })),
}));
