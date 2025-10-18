
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

// // Fixed: Proper 4-queue setup with correct scheduling policies
// // const initialQueues: Queue[] = [
// //   { level: 0, timeQuantum: 4, processes: [] },  // Q1: Round Robin
// //   { level: 1, timeQuantum: 8, processes: [] },  // Q2: Round Robin  
// //   { level: 2, timeQuantum: 0, processes: [] },  // Q3: SJF (no quantum needed)
// //   { level: 3, timeQuantum: 0, processes: [] },  // Q4: FCFS (no quantum needed)
// // ]; 
// const initialQueues: Queue[] = [
//   { level: 0, timeQuantum: 4, processes: [] },  // Q1: RR
//   { level: 1, timeQuantum: 8, processes: [] },  // Q2: RR  
//   { level: 2, timeQuantum: 0, processes: [] },  // Q3: SJF
//   { level: 3, timeQuantum: 0, processes: [] },  // Q4: FCFS
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
//     cpuUtilization:
//       currentTime > 0 ? Math.min((totalBurst / currentTime) * 100, 100) : 0,
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
//   numQueues: 4, // Fixed: Match actual queue count
//   agingInterval: 10,
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
//     // Input validation
//     if (data.burstTime <= 0) {
//       console.error('Burst time must be positive');
//       return;
//     }

//     const id = `P${Date.now()}`;
//     const newProcess: Process = {
//       ...data,
//       id,
//       remainingTime: data.burstTime,
//       waitingTime: 0,
//       turnaroundTime: 0,
//       quantumUsed: 0,
//       responseTime: undefined,
//       state: 'waiting',
//       arrivalTime: get().currentTime,
//     };

//     set((state) => {
//       const updated = [...state.queues];
//       updated[0].processes.push(newProcess);
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
//       completedProcesses: state.completedProcesses.map((p) =>
//         p.id === id ? { ...p, ...updates } : p
//       ),
//     }));
//   },

//   setNumQueues: (num) =>
//     set((state) => {
//       const newQueues: Queue[] = [];
//       for (let i = 0; i < num; i++) {
//         const existing = state.queues[i];
//         // Fixed: Better default time quantums based on queue level
//         let defaultQuantum = 0;
//         if (i < 2) { // RR queues
//           defaultQuantum = Math.pow(2, i + 2); // 4, 8, etc.
//         }
//         // SJF and FCFS queues don't need time quantum
        
//         newQueues.push({
//           level: i,
//           timeQuantum: existing?.timeQuantum ?? defaultQuantum,
//           processes: existing?.processes ? [...existing.processes] : [],
//         });
//       }
//       return { numQueues: num, queues: newQueues };
//     }),

//   setTimeQuantum: (level, quantum) =>
//     set((state) => ({
//       queues: state.queues.map((q) =>
//         q.level === level ? { ...q, timeQuantum: quantum } : q
//       ),
//     })),

//   setAgingInterval: (interval) => set({ agingInterval: interval }),

//   // Simulation Control
//   startSimulation: () => {
//     const { isRunning } = get();
//     if (isRunning) return;

//     set({ isRunning: true, isPaused: false });

//     if (simulationInterval) clearInterval(simulationInterval);

//     simulationInterval = setInterval(() => {
//       const { isRunning: running, isPaused } = get();
//       if (!running || isPaused) return;
//       get().stepSimulation();
//     }, 300);
//   },

//   pauseSimulation: () => set({ isPaused: true }),

//   resumeSimulation: () => {
//     const { isRunning, isPaused } = get();
//     if (isRunning && isPaused) set({ isPaused: false });
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

// // ✅ FIXED Core MLFQ Simulation Step
// stepSimulation: () => {
//   const state = get();
//   if (!state.isRunning || state.isPaused) return;

//   const queues: Queue[] = JSON.parse(JSON.stringify(state.queues)); // Deep clone
//   let currentTime = state.currentTime + 1;
//   const completedProcesses = [...state.completedProcesses];
  
//   // Find highest priority non-empty queue
//   const activeQueue = queues.find(q => q.processes.length > 0);
  
//   if (!activeQueue) {
//     // CPU idle - no processes to run
//     set({ 
//       currentTime, 
//       activeProcess: null,
//       queues 
//     });
//     get().updateMetrics();
    
//     // Stop simulation if everything is done
//     if (completedProcesses.length > 0 && queues.every(q => q.processes.length === 0)) {
//       if (simulationInterval) {
//         clearInterval(simulationInterval);
//         simulationInterval = null;
//       }
//       set({ isRunning: false });
//     }
//     return;
//   }

//   let procRef: Process;

//   // ✅ Apply correct scheduling policies
//   switch (activeQueue.level) {
//     case 0: // Q1: Round Robin
//     case 1: // Q2: Round Robin
//       // For RR, just take the first process (FIFO)
//       procRef = activeQueue.processes[0];
//       break;
      
//     case 2: // Q3: Shortest Job First
//       // Sort by remaining time and take shortest
//       activeQueue.processes.sort((a, b) => a.remainingTime - b.remainingTime);
//       procRef = activeQueue.processes[0];
//       break;
      
//     case 3: // Q4: First Come First Serve
//       // Sort by arrival time and take earliest
//       activeQueue.processes.sort((a, b) => a.arrivalTime - b.arrivalTime);
//       procRef = activeQueue.processes[0];
//       break;
      
//     default:
//       procRef = activeQueue.processes[0];
//   }

//   // Remove from current position (will be re-added if not completed/demoted)
//   activeQueue.processes = activeQueue.processes.filter(p => p.id !== procRef.id);

//   // Mark response time if first execution
//   if (procRef.responseTime === undefined) {
//     procRef.responseTime = currentTime - procRef.arrivalTime;
//   }

//   // Execute 1 time unit
//   procRef.remainingTime -= 1;
//   procRef.quantumUsed = (procRef.quantumUsed || 0) + 1;
//   procRef.state = 'running';

//   // ✅ FIXED: Add Gantt chart entry (always create new entry)
//   const ganttEntry: GanttEntry = {
//     processId: procRef.id,
//     queueLevel: activeQueue.level,
//     start: currentTime - 1,
//     end: currentTime,
//   };
//   set((state) => ({ 
//     ganttChart: [...state.ganttChart, ganttEntry] 
//   }));

//   // Update waiting time for all other ready processes
//   queues.forEach(q => {
//     q.processes.forEach(p => {
//       if (p.id !== procRef.id && p.state !== 'completed' && p.remainingTime > 0) {
//         p.waitingTime = (p.waitingTime || 0) + 1;
//       }
//     });
//   });

//   // ✅ Check for process completion
//   if (procRef.remainingTime <= 0) {
//     procRef.turnaroundTime = currentTime - procRef.arrivalTime;
//     procRef.waitingTime = (procRef.waitingTime || 0);
//     procRef.state = 'completed';
    
//     completedProcesses.push(procRef);
    
//     set({
//       queues,
//       currentTime,
//       activeProcess: null,
//       completedProcesses,
//     });

//     get().updateMetrics();
//     return;
//   }

//   // ✅ Demotion rules for Round Robin queues only
//   if (activeQueue.level < 2 && procRef.quantumUsed >= activeQueue.timeQuantum) {
//     // Time quantum expired - demote to next lower queue
//     procRef.quantumUsed = 0;
//     procRef.state = 'waiting';
    
//     const nextLevel = Math.min(activeQueue.level + 1, queues.length - 1);
//     queues[nextLevel].processes.push(procRef);
//   } else {
//     // Not completed and quantum not expired - return to same queue
//     procRef.state = 'waiting';
//     activeQueue.processes.push(procRef);
//   }

//   // ✅ Fixed Aging Promotion 
//   if (state.agingInterval > 0 && currentTime % state.agingInterval === 0) {
//     for (let lvl = queues.length - 1; lvl > 0; lvl--) {
//       const q = queues[lvl];
//       const promote: Process[] = [];
//       const keep: Process[] = [];

//       for (const p of q.processes) {
//         // Promote processes that have been waiting too long
//         if ((p.waitingTime || 0) >= state.agingInterval) {
//           promote.push({ 
//             ...p, 
//             quantumUsed: 0, 
//             state: 'waiting'
//           });
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

//   // ✅ Commit final state
//   set({
//     queues,
//     currentTime,
//     activeProcess: procRef,
//   });

//   get().updateMetrics();
// },

//   // Metrics
//   updateMetrics: () => {
//     const state = get();
//     const allInQueues = state.queues.flatMap((q) => q.processes);
//     const all = [...state.completedProcesses, ...allInQueues];
//     const metrics = calculateMetrics(all, state.completedProcesses, state.currentTime);
//     set({ metrics });
//   },

//   addGanttEntry: (entry) =>
//     set((state) => ({ ganttChart: [...state.ganttChart, entry] })),
// }));
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
    const id = `P${Date.now()}`;
    const arrivalTime = data.arrivalTime ?? 0;
    
    const newProcess: Process = {
      ...data,
      id,
      arrivalTime,
      remainingTime: data.burstTime,
      waitingTime: 0,
      turnaroundTime: 0,
      quantumUsed: 0,
      responseTime: undefined,
      state: 'waiting',
      burstTime: data.burstTime, // Explicitly preserve original burst time
    };

    console.log('Adding process:', { 
      id, 
      arrivalTime, 
      burstTime: data.burstTime,
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

      const queues: Queue[] = JSON.parse(JSON.stringify(state.queues));
      const currentTime = state.currentTime;
      const completedProcesses = [...state.completedProcesses];
      
      if (currentTime % 10 === 0) {
        console.log(`Time ${currentTime}:`, {
          Q0: queues[0].processes.length,
          Q1: queues[1].processes.length,
          Q2: queues[2].processes.length,
          Q3: queues[3].processes.length,
          completed: completedProcesses.length
        });
      }
      
      const activeQueueIndex = queues.findIndex(q => q.processes.length > 0);
      
      if (activeQueueIndex === -1) {
        console.log(`Time ${currentTime}: CPU IDLE - No processes in any queue`);
        const nextTime = currentTime + 1;
        
        if (completedProcesses.length > 0 && queues.every(q => q.processes.length === 0)) {
          console.log(`Simulation complete at time ${nextTime}`);
          if (simulationInterval) {
            clearInterval(simulationInterval);
            simulationInterval = null;
          }
          return {
            ...state,
            currentTime: nextTime,
            activeProcess: null,
            queues,
            isRunning: false
          };
        }
        
        return {
          ...state,
          currentTime: nextTime,
          activeProcess: null,
          queues
        };
      }

      const activeQueue = queues[activeQueueIndex];
      const procRef = activeQueue.processes.shift()!;
      
      // FIXED: Set response time when process first starts (before any execution)
      if (procRef.responseTime === undefined) {
        procRef.responseTime = currentTime - procRef.arrivalTime;
        console.log(`Process ${procRef.id} first response at time ${currentTime}, arrival was ${procRef.arrivalTime}, response time: ${procRef.responseTime}`);
      }
      
      if (currentTime % 5 === 0) {
        console.log(`Time ${currentTime}: Running ${procRef.id} from Q${activeQueueIndex}, remaining: ${procRef.remainingTime}`);
      }

      procRef.remainingTime -= 1;
      procRef.quantumUsed = (procRef.quantumUsed || 0) + 1;
      procRef.state = 'running';

      const ganttEntry: GanttEntry = {
        processId: procRef.id,
        queueLevel: activeQueue.level,
        start: currentTime,
        end: currentTime + 1,
      };

      // FIXED: Don't increment waiting time during this time unit
      // We'll add it at the end only for processes still in queues

      if (procRef.remainingTime <= 0) {
        procRef.turnaroundTime = currentTime + 1 - procRef.arrivalTime;
        procRef.state = 'completed';
        
        // FIXED: Waiting time = Turnaround time - Burst time
        const burstTime = procRef.burstTime || (procRef.turnaroundTime - procRef.waitingTime);
        procRef.waitingTime = procRef.turnaroundTime - burstTime;
        
        completedProcesses.push(procRef);
        
        console.log(`Time ${currentTime + 1}: Process ${procRef.id} COMPLETED`);
        console.log(`  - Burst Time: ${burstTime}`);
        console.log(`  - Turnaround: ${procRef.turnaroundTime}`);
        console.log(`  - Waiting: ${procRef.waitingTime}`);
        console.log(`  - Response: ${procRef.responseTime}`);
        
        // Increment waiting time for remaining processes
        queues.forEach(q => {
          q.processes.forEach(p => {
            p.waitingTime = (p.waitingTime || 0) + 1;
          });
        });
        
        const newState = {
          ...state,
          queues,
          currentTime: currentTime + 1,
          activeProcess: null,
          completedProcesses,
          ganttChart: [...state.ganttChart, ganttEntry],
        };

        setTimeout(() => get().updateMetrics(), 0);
        
        return newState;
      }

      if (procRef.quantumUsed >= activeQueue.timeQuantum) {
        procRef.quantumUsed = 0;
        procRef.state = 'waiting';
        
        const nextLevel = Math.min(activeQueueIndex + 1, queues.length - 1);
        
        console.log(`Time ${currentTime}: Demoting ${procRef.id} from Q${activeQueueIndex} to Q${nextLevel}`);
        
        queues[nextLevel].processes.push(procRef);
        
      } else {
        procRef.state = 'waiting';
        
        console.log(`Time ${currentTime}: Returning ${procRef.id} to back of Q${activeQueueIndex}`);
        
        activeQueue.processes.push(procRef);
      }

      // Increment waiting time for all processes in queues after placing current process
      queues.forEach(q => {
        q.processes.forEach(p => {
          p.waitingTime = (p.waitingTime || 0) + 1;
        });
      });

      const newState = {
        ...state,
        queues,
        currentTime: currentTime + 1,
        activeProcess: procRef,
        ganttChart: [...state.ganttChart, ganttEntry],
      };

      setTimeout(() => get().updateMetrics(), 0);
      
      return newState;
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
