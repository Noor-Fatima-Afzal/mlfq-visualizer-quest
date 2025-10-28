import { Process, Queue, GanttEntry } from '@/types/mlfq';

// ==================== FIFO / FCFS ====================
export const stepFIFO = (
  readyQueue: Process[],
  completedProcesses: Process[],
  ganttChart: GanttEntry[],
  currentTime: number
): {
  readyQueue: Process[];
  completedProcesses: Process[];
  ganttChart: GanttEntry[];
  currentTime: number;
  activeProcess: Process | null;
} => {
  if (readyQueue.length === 0) {
    if (completedProcesses.length > 0) {
      return { readyQueue, completedProcesses, ganttChart, currentTime, activeProcess: null };
    }
    return { readyQueue, completedProcesses, ganttChart, currentTime: currentTime + 1, activeProcess: null };
  }

  const process = readyQueue.shift()!;

  // Set response time on FIRST execution
  if (process.responseTime === undefined) {
    process.responseTime = currentTime - process.arrivalTime;
  }

  // Run until completion (non-preemptive)
  const runDuration = process.remainingTime;
  const runStart = currentTime;
  const runEnd = currentTime + runDuration;

  process.remainingTime = 0;
  process.state = 'completed';
  process.completionTime = runEnd;
  process.turnaroundTime = process.completionTime - process.arrivalTime;
  process.waitingTime = process.turnaroundTime - process.burstTime;

  ganttChart.push({
    processId: process.id,
    processName: process.name,
    startTime: runStart,
    endTime: runEnd,
    queueLevel: 0,
  });

  completedProcesses.push(process);

  console.log(`FIFO: Time ${runStart}-${runEnd}: ${process.id} completed`);

  return {
    readyQueue,
    completedProcesses,
    ganttChart,
    currentTime: runEnd,
    activeProcess: process,
  };
};

// ==================== SJF ====================
export const stepSJF = (
  readyQueue: Process[],
  completedProcesses: Process[],
  ganttChart: GanttEntry[],
  currentTime: number
): {
  readyQueue: Process[];
  completedProcesses: Process[];
  ganttChart: GanttEntry[];
  currentTime: number;
  activeProcess: Process | null;
} => {
  if (readyQueue.length === 0) {
    if (completedProcesses.length > 0) {
      return { readyQueue, completedProcesses, ganttChart, currentTime, activeProcess: null };
    }
    return { readyQueue, completedProcesses, ganttChart, currentTime: currentTime + 1, activeProcess: null };
  }

  // Find shortest job
  const shortestIndex = readyQueue.reduce((minIdx, proc, idx, arr) => 
    proc.burstTime < arr[minIdx].burstTime ? idx : minIdx, 0);
  
  const process = readyQueue.splice(shortestIndex, 1)[0];

  // Set response time
  if (process.responseTime === undefined) {
    process.responseTime = currentTime - process.arrivalTime;
  }

  // Run until completion (non-preemptive)
  const runDuration = process.remainingTime;
  const runStart = currentTime;
  const runEnd = currentTime + runDuration;

  process.remainingTime = 0;
  process.state = 'completed';
  process.completionTime = runEnd;
  process.turnaroundTime = process.completionTime - process.arrivalTime;
  process.waitingTime = process.turnaroundTime - process.burstTime;

  ganttChart.push({
    processId: process.id,
    processName: process.name,
    startTime: runStart,
    endTime: runEnd,
    queueLevel: 0,
  });

  completedProcesses.push(process);

  console.log(`SJF: Time ${runStart}-${runEnd}: ${process.id} completed`);

  return {
    readyQueue,
    completedProcesses,
    ganttChart,
    currentTime: runEnd,
    activeProcess: process,
  };
};

// ==================== STCF / Preemptive SJF ====================
export const stepSTCF = (
  readyQueue: Process[],
  completedProcesses: Process[],
  ganttChart: GanttEntry[],
  currentTime: number
): {
  readyQueue: Process[];
  completedProcesses: Process[];
  ganttChart: GanttEntry[];
  currentTime: number;
  activeProcess: Process | null;
} => {
  if (readyQueue.length === 0) {
    if (completedProcesses.length > 0) {
      return { readyQueue, completedProcesses, ganttChart, currentTime, activeProcess: null };
    }
    return { readyQueue, completedProcesses, ganttChart, currentTime: currentTime + 1, activeProcess: null };
  }

  // Find process with shortest remaining time
  const shortestIndex = readyQueue.reduce((minIdx, proc, idx, arr) => 
    proc.remainingTime < arr[minIdx].remainingTime ? idx : minIdx, 0);
  
  const process = readyQueue.splice(shortestIndex, 1)[0];

  // Set response time on first execution
  if (process.responseTime === undefined) {
    process.responseTime = currentTime - process.arrivalTime;
  }

  // Run for 1 time unit (preemptive)
  process.remainingTime -= 1;
  process.state = 'running';

  ganttChart.push({
    processId: process.id,
    processName: process.name,
    startTime: currentTime,
    endTime: currentTime + 1,
    queueLevel: 0,
  });

  if (process.remainingTime <= 0) {
    process.state = 'completed';
    process.completionTime = currentTime + 1;
    process.turnaroundTime = process.completionTime - process.arrivalTime;
    process.waitingTime = process.turnaroundTime - process.burstTime;
    completedProcesses.push(process);
    console.log(`STCF: Time ${currentTime + 1}: ${process.id} completed`);
  } else {
    readyQueue.push(process);
  }

  return {
    readyQueue,
    completedProcesses,
    ganttChart,
    currentTime: currentTime + 1,
    activeProcess: process,
  };
};

// ==================== Round Robin ====================
export const stepRR = (
  readyQueue: Process[],
  completedProcesses: Process[],
  ganttChart: GanttEntry[],
  currentTime: number,
  timeQuantum: number
): {
  readyQueue: Process[];
  completedProcesses: Process[];
  ganttChart: GanttEntry[];
  currentTime: number;
  activeProcess: Process | null;
} => {
  if (readyQueue.length === 0) {
    if (completedProcesses.length > 0) {
      return { readyQueue, completedProcesses, ganttChart, currentTime, activeProcess: null };
    }
    return { readyQueue, completedProcesses, ganttChart, currentTime: currentTime + 1, activeProcess: null };
  }

  const process = readyQueue.shift()!;

  // Set response time on first execution
  if (process.responseTime === undefined) {
    process.responseTime = currentTime - process.arrivalTime;
  }

  // Run for min(remaining time, time quantum)
  const runDuration = Math.min(process.remainingTime, timeQuantum);
  const runStart = currentTime;
  const runEnd = currentTime + runDuration;

  process.remainingTime -= runDuration;
  process.state = 'running';

  ganttChart.push({
    processId: process.id,
    processName: process.name,
    startTime: runStart,
    endTime: runEnd,
    queueLevel: 0,
  });

  if (process.remainingTime <= 0) {
    process.state = 'completed';
    process.completionTime = runEnd;
    process.turnaroundTime = process.completionTime - process.arrivalTime;
    process.waitingTime = process.turnaroundTime - process.burstTime;
    completedProcesses.push(process);
    console.log(`RR: Time ${runEnd}: ${process.id} completed`);
  } else {
    process.state = 'waiting';
    readyQueue.push(process);
  }

  return {
    readyQueue,
    completedProcesses,
    ganttChart,
    currentTime: runEnd,
    activeProcess: process,
  };
};

// ==================== MLFQ ====================
export const stepMLFQ = (
  queues: Queue[],
  completedProcesses: Process[],
  ganttChart: GanttEntry[],
  currentTime: number
): {
  queues: Queue[];
  completedProcesses: Process[];
  ganttChart: GanttEntry[];
  currentTime: number;
  activeProcess: Process | null;
} => {
  // Rule 1: Find highest priority non-empty queue
  const activeQueueIndex = queues.findIndex(q => q.processes.length > 0);
  
  if (activeQueueIndex === -1) {
    if (completedProcesses.length > 0 && queues.every(q => q.processes.length === 0)) {
      console.log(`MLFQ: Simulation complete at time ${currentTime}`);
      return { queues, completedProcesses, ganttChart, currentTime, activeProcess: null };
    }
    return { queues, completedProcesses, ganttChart, currentTime: currentTime + 1, activeProcess: null };
  }

  // Rule 2: Get process from front of queue (FIFO within queue)
  const activeQueue = queues[activeQueueIndex];
  const process = activeQueue.processes.shift()!;
  
  // Set response time on FIRST execution only
  if (process.responseTime === undefined) {
    process.responseTime = currentTime - process.arrivalTime;
    console.log(`MLFQ: Time ${currentTime}: ${process.id} gets CPU for FIRST time (Response Time: ${process.responseTime})`);
  }

  // Run CONTINUOUSLY for up to the queue's time quantum or until completion
  const remainingQuantum = activeQueue.timeQuantum - (process.quantumUsed || 0);
  const runDuration = Math.max(1, Math.min(process.remainingTime, remainingQuantum));
  const runStart = currentTime;
  const runEnd = currentTime + runDuration;

  process.remainingTime -= runDuration;
  process.quantumUsed += runDuration;
  process.state = 'running';

  console.log(`MLFQ: Time ${runStart}-${runEnd}: Running ${process.id} (Q${activeQueueIndex}) for ${runDuration} units | Remaining: ${process.remainingTime}, Quantum: ${process.quantumUsed}/${activeQueue.timeQuantum}`);

  ganttChart.push({
    processId: process.id,
    processName: process.name,
    startTime: runStart,
    endTime: runEnd,
    queueLevel: activeQueue.level,
  });

  // Rule 4: Check if process completed
  if (process.remainingTime <= 0) {
    process.state = 'completed';
    process.completionTime = runEnd;
    process.turnaroundTime = process.completionTime - process.arrivalTime;
    process.waitingTime = process.turnaroundTime - process.burstTime;
    
    completedProcesses.push(process);
    
    console.log(`MLFQ: Time ${runEnd}: ${process.id} COMPLETED`);
    console.log(`  Metrics - Turnaround: ${process.turnaroundTime}, Waiting: ${process.waitingTime}, Response: ${process.responseTime}`);
    
    return {
      queues,
      completedProcesses,
      ganttChart,
      currentTime: runEnd,
      activeProcess: null,
    };
  }

  // Rule 3 and 5: Check if quantum expired -> demote
  if (process.quantumUsed >= activeQueue.timeQuantum) {
    const nextLevel = Math.min(activeQueueIndex + 1, queues.length - 1);
    process.quantumUsed = 0;
    process.state = 'waiting';
    queues[nextLevel].processes.push(process);
    console.log(`MLFQ: Time ${runEnd}: ${process.id} quantum expired, demoted from Q${activeQueueIndex} to Q${nextLevel}`);
  } else {
    process.state = 'waiting';
    activeQueue.processes.push(process);
    console.log(`MLFQ: Time ${runEnd}: ${process.id} returns to back of Q${activeQueueIndex} (quantum: ${process.quantumUsed}/${activeQueue.timeQuantum})`);
  }

  return {
    queues,
    completedProcesses,
    ganttChart,
    currentTime: runEnd,
    activeProcess: process,
  };
};
