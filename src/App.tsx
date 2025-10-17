// import { Toaster } from "@/components/ui/toaster";
// import { Toaster as Sonner } from "@/components/ui/sonner";
// import { TooltipProvider } from "@/components/ui/tooltip";
// import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
// import { BrowserRouter, Routes, Route } from "react-router-dom";
// import Index from "./pages/Index";
// import NotFound from "./pages/NotFound";

// const queryClient = new QueryClient();

// const App = () => (
//   <QueryClientProvider client={queryClient}>
//     <TooltipProvider>
//       <Toaster />
//       <Sonner />
//       <BrowserRouter>
//         <Routes>
//           <Route path="/" element={<Index />} />
//           {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
//           <Route path="*" element={<NotFound />} />
//         </Routes>
//       </BrowserRouter>
//     </TooltipProvider>
//   </QueryClientProvider>
// );

// export default App;
import React from "react";
import { Toaster } from "@/components/ui/toaster";
import SimulationControls from "@/components/SimulationControls";
import ControlPanel from "@/components/ControlPanel";
import CPUVisualizer from "@/components/CPUVisualizer";
import QueueVisualizer from "@/components/QueueVisualizer";
import GanttChart from "@/components/GanttChart";
import MetricsDashboard from "@/components/MetricsDashboard";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { motion } from "framer-motion";
import "./App.css";

const App: React.FC = () => {
  return (
    <div className="min-h-screen bg-gray-50 text-gray-900 p-6 flex flex-col">
      {/* Header */}
      <motion.header
        className="text-center mb-6"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <h1 className="text-4xl font-bold mb-1 text-indigo-600">
          MLFQ Simulator
        </h1>
        <p className="text-gray-600 text-lg">
          Multi-Level Feedback Queue Scheduling Visualizer
        </p>
      </motion.header>

      <main className="flex flex-col lg:flex-row gap-6">
        {/* Left Column — Control + Queues */}
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
            <CardContent>
              <QueueVisualizer />
            </CardContent>
          </Card>
        </div>

        {/* Right Column — CPU + Metrics + Gantt */}
        <div className="flex-1 flex flex-col gap-6">
          <Card>
            <CardHeader>
              <CardTitle>CPU Visualizer</CardTitle>
            </CardHeader>
            <CardContent>
              <CPUVisualizer />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Metrics Dashboard</CardTitle>
            </CardHeader>
            <CardContent>
              <MetricsDashboard />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Gantt Chart</CardTitle>
            </CardHeader>
            <CardContent>
              <GanttChart />
            </CardContent>
          </Card>
        </div>
      </main>

      {/* Footer */}
      <Separator className="my-6" />
      <footer className="text-center text-gray-500 text-sm">
        Educational CPU Scheduling Simulator • Built with React, Zustand, and Framer Motion
      </footer>

      {/* Toast Notifications */}
      <Toaster />
    </div>
  );
};

export default App;
