
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
  boostInterval: number; // New: Priority boost interval

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

// Fixed: Proper 4-queue setup
// Queue 0: Highest priority, shortest quantum
// Queue 3: Lowest priority, longest quantum
const initialQueues: Queue[] = [
  { level: 0, timeQuantum: 4, processes: [] },   // Highest priority - RR (4 units)
  { level: 1, timeQuantum: 8, processes: [] },   // Medium-high priority - RR (8 units)
  { level: 2, timeQuantum: 16, processes: [] },  // Medium-low priority - RR (16 units)
  { level: 3, timeQuantum: 32, processes: [] },  // Lowest priority - RR (32 units) or FCFS
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
  boostInterval: 50, // New: Boost all processes every 50 time units
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
    // Input validation
    if (data.burstTime <= 0) {
      console.error('Burst time must be positive');
      return;
    }

    const state = get();
    const id = `P${Date.now()}`;
    
    // CRITICAL: Use the provided arrival time, default to 0 if not provided
    // This ensures processes added before simulation have arrival time 0
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
        // Exponentially increasing time quantums
        const defaultQuantum = Math.pow(2, i + 2); // 4, 8, 16, 32...
        
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

  // Simulation Control
  startSimulation: () => {
    const state = get();
    if (state.isRunning) return;

    set({ isRunning: true, isPaused: false });

    if (simulationInterval) clearInterval(simulationInterval);

    // Run simulation at 500ms intervals
    simulationInterval = setInterval(() => {
      const currentState = get();
      if (!currentState.isRunning || currentState.isPaused) {
        return;
      }
      
      // Execute step
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

  // ✅ FULLY CORRECTED MLFQ Simulation Step - WITH FUNCTIONAL UPDATE
  stepSimulation: () => {
    // CRITICAL: Use functional update to ensure we have latest state
    set((state) => {
      if (!state.isRunning || state.isPaused) return state;

      const queues: Queue[] = JSON.parse(JSON.stringify(state.queues)); // Deep clone
      const currentTime = state.currentTime;
      const completedProcesses = [...state.completedProcesses];
      
      // DEBUG: Log queue state every 10 time units
      if (currentTime % 10 === 0) {
        console.log(`Time ${currentTime}:`, {
          Q0: queues[0].processes.length,
          Q1: queues[1].processes.length,
          Q2: queues[2].processes.length,
          Q3: queues[3].processes.length,
          completed: completedProcesses.length
        });
      }
      
      // Find highest priority non-empty queue FIRST
      const activeQueueIndex = queues.findIndex(q => q.processes.length > 0);
      
      if (activeQueueIndex === -1) {
        // CPU idle - no processes to run
        console.log(`Time ${currentTime}: CPU IDLE - No processes in any queue`);
        const nextTime = currentTime + 1;
        
        // Stop simulation if everything is done
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
    
    // ✅ PRIORITY BOOST: TEMPORARILY DISABLED FOR DEBUGGING
    // Testing if boost is causing the gaps
    /*
    if (state.boostInterval > 0 && currentTime > 0 && currentTime % state.boostInterval === 0) {
      // Move all processes from lower queues to Q1
      for (let i = 1; i < queues.length; i++) {
        if (queues[i].processes.length > 0) {
          queues[i].processes.forEach(p => {
            p.quantumUsed = 0;
            p.waitingTime = 0;
            p.state = 'waiting';
          });
          queues[0].processes.push(...queues[i].processes);
          queues[i].processes = [];
        }
      }
      // Re-find active queue after boost
      const newActiveIndex = queues.findIndex(q => q.processes.length > 0);
      if (newActiveIndex === -1) {
        set({ 
          currentTime: currentTime + 1, 
          activeProcess: null,
          queues 
        });
        get().updateMetrics();
        return;
      }
    }
    */

    const activeQueue = queues[activeQueueIndex];
    
    // Take the first process in the queue (FIFO/Round Robin)
    const procRef = activeQueue.processes.shift()!;
    
    // DEBUG: Log process execution
    if (currentTime % 5 === 0) {
      console.log(`Time ${currentTime}: Running ${procRef.id} from Q${activeQueueIndex}, remaining: ${procRef.remainingTime}`);
    }

    // Mark response time if first execution
    if (procRef.responseTime === undefined) {
      procRef.responseTime = currentTime - procRef.arrivalTime;
    }

    // Execute 1 time unit
    procRef.remainingTime -= 1;
    procRef.quantumUsed = (procRef.quantumUsed || 0) + 1;
    procRef.state = 'running';

    // Add Gantt chart entry
    const ganttEntry: GanttEntry = {
      processId: procRef.id,
      queueLevel: activeQueue.level,
      start: currentTime,
      end: currentTime + 1,
    };

    // ✅ FIXED: Update waiting time for processes in queues (not the running one)
    queues.forEach(q => {
      q.processes.forEach(p => {
        // Only increment waiting time for processes waiting in queues
        if (p.id !== procRef.id && p.state !== 'completed') {
          p.waitingTime = (p.waitingTime || 0) + 1;
        }
      });
    });

    // ✅ Check for process completion
    if (procRef.remainingTime <= 0) {
      procRef.turnaroundTime = currentTime + 1 - procRef.arrivalTime;
      procRef.state = 'completed';
      
      completedProcesses.push(procRef);
      
      console.log(`Time ${currentTime}: Process ${procRef.id} COMPLETED`);
      
      set({
        queues,
        currentTime: currentTime + 1,
        activeProcess: null,
        completedProcesses,
        ganttChart: [...state.ganttChart, ganttEntry],
      });

      get().updateMetrics();
      return;
    }

    // ✅ FIXED: Demotion logic - CRITICAL: Only add process to ONE queue
    if (procRef.quantumUsed >= activeQueue.timeQuantum) {
      // Time quantum expired - demote to next lower priority queue
      procRef.quantumUsed = 0; // Reset quantum counter
      procRef.waitingTime = 0; // Reset waiting time on demotion
      procRef.state = 'waiting';
      
      const nextLevel = Math.min(activeQueueIndex + 1, queues.length - 1);
      
      console.log(`Time ${currentTime}: Demoting ${procRef.id} from Q${activeQueueIndex} to Q${nextLevel}`);
      
      // CRITICAL: Make sure we only add to the target queue
      queues[nextLevel].processes.push(procRef);
      
      // Verify no duplication
      const totalInQueues = queues.reduce((sum, q) => sum + q.processes.length, 0);
      console.log(`Total processes in queues after demotion: ${totalInQueues}`);
      
    } else {
      // Quantum not expired - return to back of same queue (Round Robin)
      procRef.state = 'waiting';
      
      console.log(`Time ${currentTime}: Returning ${procRef.id} to back of Q${activeQueueIndex}`);
      
      activeQueue.processes.push(procRef);
      
      // Verify no duplication
      const totalInQueues = queues.reduce((sum, q) => sum + q.processes.length, 0);
      console.log(`Total processes in queues after return: ${totalInQueues}`);
    }

    // ✅ FIXED: Aging Promotion - DISABLED FOR NOW TO DEBUG
    // The aging mechanism seems to be causing the gaps
    // TODO: Re-enable with proper logic after confirming base simulation works
    
    // Aging disabled - commented out
    /*
    if (state.agingInterval > 0 && currentTime > 0 && currentTime % state.agingInterval === 0) {
      for (let lvl = queues.length - 1; lvl > 0; lvl--) {
        const q = queues[lvl];
        const promote: Process[] = [];
        const keep: Process[] = [];

        for (const p of q.processes) {
          if ((p.waitingTime || 0) >= state.agingInterval * 2) {
            promote.push({ 
              ...p, 
              quantumUsed: 0,
              waitingTime: 0,
              state: 'waiting'
            });
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
    */

    // ✅ Commit final state
    set({
      queues,
      currentTime: currentTime + 1,
      activeProcess: procRef,
      ganttChart: [...state.ganttChart, ganttEntry],
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
