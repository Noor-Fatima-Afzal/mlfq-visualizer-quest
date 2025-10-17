import { useEffect } from 'react';
import { useSimulationStore } from '@/store/simulationStore';
import { QueueVisualizer } from '@/components/QueueVisualizer';
import { CPUVisualizer } from '@/components/CPUVisualizer';
import { SimulationControls } from '@/components/SimulationControls';
import { MetricsDashboard } from '@/components/MetricsDashboard';
import { ControlPanel } from '@/components/ControlPanel';
import { GanttChart } from '@/components/GanttChart';
import { Activity } from 'lucide-react';

const Index = () => {
  const { queues, currentTime, activeProcess, isRunning, isPaused } = useSimulationStore();

  // MLFQ Simulation loop
  useEffect(() => {
    if (!isRunning || isPaused) return;

    const interval = setInterval(() => {
      const store = useSimulationStore.getState();
      const { queues, currentTime, activeProcess, agingInterval, addGanttEntry, completedProcesses } = store;

      // Check if any processes are available
      const hasProcesses = queues.some(q => q.processes.length > 0);
      if (!hasProcesses && !activeProcess) {
        console.log('No processes in queue');
        return;
      }

      // Find highest priority queue with processes
      let selectedProcess: typeof activeProcess = null;
      let selectedQueueLevel = -1;

      for (let i = 0; i < queues.length; i++) {
        if (queues[i].processes.length > 0) {
          selectedProcess = queues[i].processes[0];
          selectedQueueLevel = i;
          break;
        }
      }

      if (!selectedProcess) return;

      // Set as active process and record start time
      if (selectedProcess.state === 'waiting') {
        selectedProcess = {
          ...selectedProcess,
          state: 'running' as const,
          startTime: selectedProcess.startTime ?? currentTime,
          responseTime: selectedProcess.responseTime ?? currentTime - selectedProcess.arrivalTime,
        };
      }

      const currentQueue = queues[selectedQueueLevel];
      const timeQuantum = currentQueue.timeQuantum;
      const executionTime = Math.min(selectedProcess.remainingTime, timeQuantum);

      // Execute for 1 time unit
      const newRemainingTime = selectedProcess.remainingTime - 1;
      const newQuantumUsed = selectedProcess.quantumUsed + 1;

      // Check if process completes
      if (newRemainingTime === 0) {
        const completedProcess = {
          ...selectedProcess,
          remainingTime: 0,
          state: 'completed' as const,
          completionTime: currentTime + 1,
          turnaroundTime: currentTime + 1 - selectedProcess.arrivalTime,
          waitingTime: currentTime + 1 - selectedProcess.arrivalTime - selectedProcess.burstTime,
        };

        // Add Gantt entry
        addGanttEntry({
          processId: selectedProcess.id,
          processName: selectedProcess.name,
          startTime: currentTime,
          endTime: currentTime + 1,
          queueLevel: selectedQueueLevel,
        });

        // Remove from queue and add to completed
        const updatedQueues = queues.map(q =>
          q.level === selectedQueueLevel
            ? { ...q, processes: q.processes.slice(1) }
            : q
        );

        store.setQueues(updatedQueues);
        store.updateMetrics();
        useSimulationStore.setState({
          completedProcesses: [...completedProcesses, completedProcess],
          currentTime: currentTime + 1,
          activeProcess: null,
        });
      }
      // Check if quantum expired
      else if (newQuantumUsed >= timeQuantum) {
        // Add Gantt entry for this execution
        addGanttEntry({
          processId: selectedProcess.id,
          processName: selectedProcess.name,
          startTime: currentTime - newQuantumUsed + 1,
          endTime: currentTime + 1,
          queueLevel: selectedQueueLevel,
        });

        // Demote to next lower queue or keep in lowest
        const nextQueueLevel = Math.min(selectedQueueLevel + 1, queues.length - 1);
        const updatedProcess = {
          ...selectedProcess,
          remainingTime: newRemainingTime,
          quantumUsed: 0,
          state: 'waiting' as const,
          priority: nextQueueLevel,
        };

        const updatedQueues = queues.map(q => {
          if (q.level === selectedQueueLevel) {
            return { ...q, processes: q.processes.slice(1) };
          } else if (q.level === nextQueueLevel) {
            return { ...q, processes: [...q.processes, updatedProcess] };
          }
          return q;
        });

        store.setQueues(updatedQueues);
        useSimulationStore.setState({
          currentTime: currentTime + 1,
          activeProcess: null,
        });
      }
      // Continue executing in same queue
      else {
        const updatedProcess = {
          ...selectedProcess,
          remainingTime: newRemainingTime,
          quantumUsed: newQuantumUsed,
          state: 'running' as const,
        };

        const updatedQueues = queues.map(q =>
          q.level === selectedQueueLevel
            ? { ...q, processes: [updatedProcess, ...q.processes.slice(1)] }
            : q
        );

        store.setQueues(updatedQueues);
        useSimulationStore.setState({
          currentTime: currentTime + 1,
          activeProcess: updatedProcess,
        });
      }

      // Handle aging - promote processes that waited too long
      const finalQueues = useSimulationStore.getState().queues.map((queue, qIndex) => {
        if (qIndex === 0) return queue; // Skip highest priority queue

        const promoted: typeof queue.processes = [];
        const remaining: typeof queue.processes = [];

        queue.processes.forEach(p => {
          const waitTime = currentTime - (p.startTime || p.arrivalTime);
          if (waitTime >= agingInterval && waitTime % agingInterval === 0) {
            promoted.push({ ...p, priority: qIndex - 1 });
          } else {
            remaining.push(p);
          }
        });

        return { ...queue, processes: remaining };
      });

      // Add promoted processes to higher queues
      const withPromoted = finalQueues.map((queue, qIndex) => {
        if (qIndex === finalQueues.length - 1) return queue;
        
        const promotedToThis = finalQueues[qIndex + 1]?.processes.filter(p => p.priority === qIndex) || [];
        if (promotedToThis.length > 0) {
          return { ...queue, processes: [...queue.processes, ...promotedToThis] };
        }
        return queue;
      });

      if (JSON.stringify(withPromoted) !== JSON.stringify(useSimulationStore.getState().queues)) {
        store.setQueues(withPromoted);
      }
    }, 500); // 500ms per time unit for visualization

    return () => clearInterval(interval);
  }, [isRunning, isPaused]);

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-10">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-primary/10 rounded-lg">
                <Activity className="w-6 h-6 text-primary" />
              </div>
              <div>
                <h1 className="text-2xl font-bold">MLFQ Simulator</h1>
                <p className="text-sm text-muted-foreground">
                  Multi-Level Feedback Queue Scheduling Visualizer
                </p>
              </div>
            </div>
            <SimulationControls />
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-6 py-8">
        <div className="space-y-6">
          {/* Metrics */}
          <MetricsDashboard />

          {/* CPU and Control Panel */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-1">
              <CPUVisualizer 
                activeProcess={activeProcess} 
                currentTime={currentTime} 
              />
            </div>
            <div className="lg:col-span-2">
              <ControlPanel />
            </div>
          </div>

          {/* Queues */}
          <div className="space-y-4">
            <h2 className="text-xl font-semibold">Ready Queues</h2>
            <div className="space-y-4">
              {queues.map((queue) => (
                <QueueVisualizer
                  key={queue.level}
                  queue={queue}
                  activeProcessId={activeProcess?.id || null}
                />
              ))}
            </div>
          </div>

          {/* Gantt Chart */}
          <GanttChart />
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-border mt-12 py-6">
        <div className="container mx-auto px-6 text-center text-sm text-muted-foreground">
          Educational CPU Scheduling Simulator • Built with React & Framer Motion
        </div>
      </footer>
    </div>
  );
};

export default Index;
