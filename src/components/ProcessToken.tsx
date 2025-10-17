import { motion } from 'framer-motion';
import { Process } from '@/types/mlfq';
import { Cpu } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ProcessTokenProps {
  process: Process;
  queueLevel: number;
  isActive?: boolean;
}

export const ProcessToken = ({ process, queueLevel, isActive = false }: ProcessTokenProps) => {
  const getQueueColor = (level: number) => {
    const colors = [
      'hsl(var(--queue-1))',
      'hsl(var(--queue-2))',
      'hsl(var(--queue-3))',
    ];
    return colors[level] || colors[colors.length - 1];
  };

  const getStateColor = () => {
    if (process.state === 'completed') return 'hsl(var(--process-completed))';
    if (isActive || process.state === 'running') return 'hsl(var(--process-active))';
    return 'hsl(var(--process-waiting))';
  };

  return (
    <motion.div
      layout
      initial={{ scale: 0, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      exit={{ scale: 0, opacity: 0 }}
      transition={{ type: 'spring', stiffness: 300, damping: 25 }}
      className={cn(
        "relative p-3 rounded-lg border-2 min-w-[120px] backdrop-blur-sm",
        isActive && "shadow-[var(--shadow-glow)]"
      )}
      style={{
        borderColor: getQueueColor(queueLevel),
        backgroundColor: isActive 
          ? `${getStateColor()}20` 
          : `${getQueueColor(queueLevel)}10`,
      }}
    >
      <div className="flex items-center gap-2 mb-2">
        <Cpu 
          className="w-4 h-4" 
          style={{ color: getStateColor() }}
        />
        <span className="font-semibold text-sm" style={{ color: getStateColor() }}>
          {process.name}
        </span>
      </div>
      
      <div className="space-y-1 text-xs text-muted-foreground">
        <div className="flex justify-between">
          <span>Burst:</span>
          <span className="font-medium">{process.burstTime}ms</span>
        </div>
        <div className="flex justify-between">
          <span>Remaining:</span>
          <span className="font-medium">{process.remainingTime}ms</span>
        </div>
        <div className="flex justify-between">
          <span>Priority:</span>
          <span className="font-medium">Q{queueLevel + 1}</span>
        </div>
      </div>

      {isActive && (
        <motion.div
          className="absolute inset-0 rounded-lg border-2"
          style={{ borderColor: 'hsl(var(--process-active))' }}
          animate={{
            opacity: [0.5, 1, 0.5],
          }}
          transition={{
            duration: 1.5,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        />
      )}
    </motion.div>
  );
};
