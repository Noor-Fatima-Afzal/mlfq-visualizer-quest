import { motion, AnimatePresence } from "framer-motion";
import { Queue as QueueType } from "@/types/mlfq";
import ProcessToken from "./ProcessToken";

import { Layers } from "lucide-react";

interface QueueVisualizerProps {
  queue: QueueType;
  activeProcessId: string | null;
}

const QueueVisualizer: React.FC<QueueVisualizerProps> = ({
  queue,
  activeProcessId,
}) => {
  const getQueueColor = (level: number) => {
    const colors = [
      "hsl(var(--queue-1))",
      "hsl(var(--queue-2))",
      "hsl(var(--queue-3))",
    ];
    return colors[level] || colors[colors.length - 1];
  };

  const queueColor = getQueueColor(queue.level);

  return (
    <motion.div
      layout
      className="bg-card rounded-xl p-6 shadow-[var(--shadow-md)] border border-border"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: queue.level * 0.1 }}
    >
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div
            className="p-2 rounded-lg"
            style={{ backgroundColor: `${queueColor}20` }}
          >
            <Layers className="w-5 h-5" style={{ color: queueColor }} />
          </div>
          <div>
            <h3 className="font-semibold text-lg" style={{ color: queueColor }}>
              Queue {queue.level + 1}
            </h3>
            <p className="text-sm text-muted-foreground">
              Time Quantum: {queue.timeQuantum}ms
            </p>
          </div>
        </div>
        <div className="text-sm font-medium text-muted-foreground">
          {queue.processes.length}{" "}
          {queue.processes.length === 1 ? "process" : "processes"}
        </div>
      </div>

      <div
        className="min-h-[100px] border-2 border-dashed rounded-lg p-4"
        style={{ borderColor: `${queueColor}30` }}
      >
        {queue.processes.length === 0 ? (
          <div className="flex items-center justify-center h-full text-muted-foreground text-sm">
            No processes in queue
          </div>
        ) : (
          <div className="flex flex-wrap gap-3">
            <AnimatePresence mode="popLayout">
              {queue.processes.map((process) => (
                <ProcessToken
                  key={process.id}
                  process={process}
                  queueLevel={queue.level}
                  isActive={process.id === activeProcessId}
                />
              ))}
            </AnimatePresence>
          </div>
        )}
      </div>
    </motion.div>
  );
};

export default QueueVisualizer;
