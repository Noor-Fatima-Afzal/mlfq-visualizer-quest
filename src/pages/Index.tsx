import { useSimulationStore } from '@/store/simulationStore';
import { QueueVisualizer } from '@/components/QueueVisualizer';
import { CPUVisualizer } from '@/components/CPUVisualizer';
import { SimulationControls } from '@/components/SimulationControls';
import { MetricsDashboard } from '@/components/MetricsDashboard';
import { ControlPanel } from '@/components/ControlPanel';
import { GanttChart } from '@/components/GanttChart';
import { Activity } from 'lucide-react';

const Index = () => {
  const { queues, currentTime, activeProcess } = useSimulationStore();

  // REMOVED: The duplicate simulation loop that was causing issues
  // The simulation is now handled entirely by simulationStore.ts

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
