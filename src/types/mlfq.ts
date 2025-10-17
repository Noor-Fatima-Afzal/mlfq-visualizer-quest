export interface Process {
  id: string;
  name: string;
  arrivalTime: number;
  burstTime: number;
  remainingTime: number;
  priority: number; // Queue level (0 = highest priority)
  startTime?: number;
  completionTime?: number;
  waitingTime: number;
  turnaroundTime: number;
  responseTime?: number;
  state: 'waiting' | 'running' | 'completed';
  quantumUsed: number;
}

export interface Queue {
  level: number;
  timeQuantum: number;
  processes: Process[];
}

export interface SimulationMetrics {
  avgTurnaroundTime: number;
  avgWaitingTime: number;
  avgResponseTime: number;
  throughput: number;
  cpuUtilization: number;
}

export interface GanttEntry {
  processId: string;
  processName: string;
  startTime: number;
  endTime: number;
  queueLevel: number;
}

export interface SimulationState {
  queues: Queue[];
  currentTime: number;
  isRunning: boolean;
  isPaused: boolean;
  completedProcesses: Process[];
  ganttChart: GanttEntry[];
  activeProcess: Process | null;
  metrics: SimulationMetrics;
}
