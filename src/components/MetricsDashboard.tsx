import { motion } from 'framer-motion';
import { useSimulationStore } from '@/store/simulationStore';
import { Clock, TrendingUp, Timer, Activity, Zap } from 'lucide-react';

export const MetricsDashboard = () => {
  const { metrics } = useSimulationStore();

  const metricCards = [
    {
      label: 'Avg Turnaround Time',
      value: metrics.avgTurnaroundTime.toFixed(2),
      unit: 'ms',
      icon: Clock,
      color: 'hsl(var(--queue-1))',
    },
    {
      label: 'Avg Waiting Time',
      value: metrics.avgWaitingTime.toFixed(2),
      unit: 'ms',
      icon: Timer,
      color: 'hsl(var(--queue-2))',
    },
    {
      label: 'Avg Response Time',
      value: metrics.avgResponseTime.toFixed(2),
      unit: 'ms',
      icon: Activity,
      color: 'hsl(var(--queue-3))',
    },
    {
      label: 'Throughput',
      value: metrics.throughput.toFixed(3),
      unit: 'proc/ms',
      icon: TrendingUp,
      color: 'hsl(var(--process-active))',
    },
    {
      label: 'CPU Utilization',
      value: metrics.cpuUtilization.toFixed(1),
      unit: '%',
      icon: Zap,
      color: 'hsl(var(--process-completed))',
    },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
      {metricCards.map((metric, index) => {
        const Icon = metric.icon;
        return (
          <motion.div
            key={metric.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.05 }}
            className="bg-card rounded-xl p-4 shadow-[var(--shadow-md)] border border-border"
          >
            <div className="flex items-center gap-2 mb-3">
              <div 
                className="p-2 rounded-lg"
                style={{ backgroundColor: `${metric.color}20` }}
              >
                <Icon className="w-4 h-4" style={{ color: metric.color }} />
              </div>
              <span className="text-xs text-muted-foreground font-medium">
                {metric.label}
              </span>
            </div>
            <div className="flex items-baseline gap-1">
              <span className="text-2xl font-bold" style={{ color: metric.color }}>
                {metric.value}
              </span>
              <span className="text-sm text-muted-foreground">{metric.unit}</span>
            </div>
          </motion.div>
        );
      })}
    </div>
  );
};
