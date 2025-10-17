import { motion } from 'framer-motion';
import { Cpu } from 'lucide-react';
import { Process } from '@/types/mlfq';

interface CPUVisualizerProps {
  activeProcess: Process | null;
  currentTime: number;
}

export const CPUVisualizer = ({ activeProcess, currentTime }: CPUVisualizerProps) => {
  return (
    <div className="bg-card rounded-xl p-6 shadow-[var(--shadow-md)] border border-border">
      <div className="flex items-center gap-3 mb-6">
        <div className="p-3 bg-primary/10 rounded-lg">
          <Cpu className="w-6 h-6 text-primary" />
        </div>
        <div>
          <h3 className="font-semibold text-lg">CPU</h3>
          <p className="text-sm text-muted-foreground">Current Time: {currentTime}ms</p>
        </div>
      </div>

      <div className="relative min-h-[120px] border-2 rounded-lg p-6 flex items-center justify-center"
        style={{ 
          borderColor: activeProcess ? 'hsl(var(--process-active))' : 'hsl(var(--border))',
          backgroundColor: activeProcess ? 'hsl(var(--process-active) / 0.05)' : 'transparent'
        }}
      >
        {activeProcess ? (
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="text-center"
          >
            <motion.div
              className="inline-block p-4 rounded-full mb-3"
              style={{ backgroundColor: 'hsl(var(--process-active) / 0.2)' }}
              animate={{
                scale: [1, 1.1, 1],
              }}
              transition={{
                duration: 1,
                repeat: Infinity,
                ease: "easeInOut",
              }}
            >
              <Cpu className="w-8 h-8" style={{ color: 'hsl(var(--process-active))' }} />
            </motion.div>
            <h4 className="font-semibold text-lg mb-2" style={{ color: 'hsl(var(--process-active))' }}>
              {activeProcess.name}
            </h4>
            <div className="space-y-1 text-sm text-muted-foreground">
              <p>Remaining: {activeProcess.remainingTime}ms</p>
              <p>Queue: Q{activeProcess.priority + 1}</p>
            </div>
          </motion.div>
        ) : (
          <div className="text-center text-muted-foreground">
            <Cpu className="w-12 h-12 mx-auto mb-2 opacity-30" />
            <p className="text-sm">CPU Idle</p>
          </div>
        )}

        {activeProcess && (
          <motion.div
            className="absolute inset-0 rounded-lg"
            style={{ 
              background: 'radial-gradient(circle at center, hsl(var(--process-active) / 0.1) 0%, transparent 70%)'
            }}
            animate={{
              opacity: [0.3, 0.6, 0.3],
            }}
            transition={{
              duration: 2,
              repeat: Infinity,
              ease: "easeInOut",
            }}
          />
        )}
      </div>
    </div>
  );
};
