import React from "react";
import { motion } from "framer-motion";
import { Toaster } from "./components/ui/toaster";
import { Card, CardContent, CardHeader, CardTitle } from "./components/ui/card";
import { Separator } from "./components/ui/separator";

import SimulationControls from "./components/SimulationControls";
import ControlPanel from "./components/ControlPanel";
import CPUVisualizer from "./components/CPUVisualizer";
import QueueVisualizer from "./components/QueueVisualizer";
import GanttChart from "./components/GanttChart";
import MetricsDashboard from "./components/MetricsDashboard";

import { useSimulationStore } from "@/store/simulationStore";
import "./App.css";

const App: React.FC = () => {
  // Pull state from Zustand store
  const {
    queues,
    activeProcess,
    currentTime,
    metrics,
    ganttChart,
    initializeStore,
  } = useSimulationStore();

  // Initialize mock data on first mount (so UI isn’t empty)
  React.useEffect(() => {
    initializeStore({
      queues: [
        {
          level: 0,
          timeQuantum: 4,
          processes: [
            { id: "P1", name: "P1", burstTime: 10, remainingTime: 6, priority: 0, state: "ready" },
            { id: "P2", name: "P2", burstTime: 5, remainingTime: 5, priority: 0, state: "ready" },
          ],
        },
        {
          level: 1,
          timeQuantum: 8,
          processes: [
            { id: "P3", name: "P3", burstTime: 15, remainingTime: 9, priority: 1, state: "ready" },
          ],
        },
        {
          level: 2,
          timeQuantum: 16,
          processes: [],
        },
      ],
      activeProcess: { id: "P1", name: "P1", burstTime: 10, remainingTime: 6, priority: 0, state: "running" },
      currentTime: 14,
      ganttChart: [{ process: "P1", start: 0, end: 10 }, { process: "P2", start: 10, end: 14 }],
      metrics: {
        avgTurnaroundTime: 12.5,
        avgWaitingTime: 5.3,
        avgResponseTime: 4.8,
        throughput: 0.071,
        cpuUtilization: 92.3,
      },
    });
  }, [initializeStore]);

  return (
    <div className="min-h-screen bg-gray-50 text-gray-900 p-6 flex flex-col">
      {/* HEADER */}
      <motion.header
        className="text-center mb-6"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <h1 className="text-4xl font-bold mb-1 text-indigo-600">MLFQ Simulator</h1>
        <p className="text-gray-600 text-lg">
          Multi-Level Feedback Queue Scheduling Visualizer
        </p>
      </motion.header>

      {/* MAIN CONTENT */}
      <main className="flex flex-col lg:flex-row gap-6">
        {/* LEFT COLUMN */}
        <div className="flex-1 flex flex-col gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Simulation Controls</CardTitle>
            </CardHeader>
            <CardContent>
              <SimulationControls />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Control Panel</CardTitle>
            </CardHeader>
            <CardContent>
              <ControlPanel />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Ready Queues</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col gap-4">
              {queues.map((queue) => (
                <QueueVisualizer
                  key={queue.level}
                  queue={queue}
                  activeProcessId={activeProcess?.id ?? null}
                />
              ))}
            </CardContent>
          </Card>
        </div>

        {/* RIGHT COLUMN */}
        <div className="flex-1 flex flex-col gap-6">
          <Card>
            <CardHeader>
              <CardTitle>CPU Visualizer</CardTitle>
            </CardHeader>
            <CardContent>
              <CPUVisualizer
                activeProcess={activeProcess}
                currentTime={currentTime}
              />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Metrics Dashboard</CardTitle>
            </CardHeader>
            <CardContent>
              <MetricsDashboard metrics={metrics} />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Gantt Chart</CardTitle>
            </CardHeader>
            <CardContent>
              <GanttChart data={ganttChart} />
            </CardContent>
          </Card>
        </div>
      </main>

      {/* FOOTER */}
      <Separator className="my-6" />
      <footer className="text-center text-gray-500 text-sm">
        Educational CPU Scheduling Simulator • Built with React, Zustand, and
        Framer Motion
      </footer>

      {/* TOAST */}
      <Toaster />
    </div>
  );
};

export default App;
