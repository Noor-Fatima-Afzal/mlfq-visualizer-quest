import { motion } from 'framer-motion';
import { useSimulationStore } from '@/store/simulationStore';
import { BarChart3 } from 'lucide-react';

export const GanttChart = () => {
  const { ganttChart, currentTime } = useSimulationStore();

  const getQueueColor = (level: number) => {
    const colors = [
      'hsl(var(--queue-1))',
      'hsl(var(--queue-2))',
      'hsl(var(--queue-3))',
    ];
    return colors[level] || colors[colors.length - 1];
  };

  // Calculate scale for visualization
  const maxTime = Math.max(currentTime, 100);
  const scale = 800 / maxTime; // 800px width for the chart

  return (
    <div className="bg-card rounded-xl p-6 shadow-[var(--shadow-md)] border border-border">
      <div className="flex items-center gap-3 mb-6">
        <div className="p-2 bg-primary/10 rounded-lg">
          <BarChart3 className="w-5 h-5 text-primary" />
        </div>
        <div>
          <h3 className="font-semibold text-lg">Gantt Chart</h3>
          <p className="text-sm text-muted-foreground">Execution Timeline</p>
        </div>
      </div>

      {ganttChart.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground text-sm">
          No execution history yet. Start the simulation to see the timeline.
        </div>
      ) : (
        <div className="space-y-4">
          {/* Timeline ruler */}
          <div className="relative h-8 border-b border-border">
            {Array.from({ length: Math.ceil(maxTime / 10) + 1 }, (_, i) => i * 10).map((time) => (
              <div
                key={time}
                className="absolute text-xs text-muted-foreground"
                style={{ left: `${time * scale}px` }}
              >
                {time}
              </div>
            ))}
          </div>

          {/* Gantt bars */}
          <div className="relative h-12 bg-muted/20 rounded">
            {ganttChart.map((entry, index) => {
              const width = (entry.endTime - entry.startTime) * scale;
              const left = entry.startTime * scale;
              const color = getQueueColor(entry.queueLevel);

              return (
                <motion.div
                  key={`${entry.processId}-${index}`}
                  initial={{ scaleX: 0, opacity: 0 }}
                  animate={{ scaleX: 1, opacity: 1 }}
                  transition={{ duration: 0.3 }}
                  className="absolute top-1 h-10 rounded flex items-center justify-center text-xs font-medium text-white shadow-sm"
                  style={{
                    left: `${left}px`,
                    width: `${width}px`,
                    backgroundColor: color,
                    transformOrigin: 'left',
                  }}
                  title={`${entry.processName}: ${entry.startTime}ms - ${entry.endTime}ms (Q${entry.queueLevel + 1})`}
                >
                  {width > 40 && entry.processName}
                </motion.div>
              );
            })}
          </div>

          {/* Legend */}
          <div className="flex items-center gap-4 pt-4 border-t border-border">
            {[0, 1, 2].map((level) => (
              <div key={level} className="flex items-center gap-2">
                <div
                  className="w-4 h-4 rounded"
                  style={{ backgroundColor: getQueueColor(level) }}
                />
                <span className="text-sm text-muted-foreground">Q{level + 1}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
// Jobs color also different now

// import { motion } from 'framer-motion';
// import { useSimulationStore } from '@/store/simulationStore';
// import { BarChart3 } from 'lucide-react';

// export const GanttChart = () => {
//   const { ganttChart, currentTime } = useSimulationStore();

//   // 🎨 Generate distinct color per processId and adjust tone by queue level
//   const getProcessColor = (processId: string, queueLevel: number) => {
//     // deterministic color from processId hash
//     let hash = 0;
//     for (let i = 0; i < processId.length; i++) {
//       hash = processId.charCodeAt(i) + ((hash << 5) - hash);
//     }
//     const hue = Math.abs(hash) % 360;
//     const lightness = 55 - queueLevel * 8; // deeper for lower queues
//     return `hsl(${hue}, 70%, ${lightness}%)`;
//   };

//   // Scale for visualization
//   const maxTime = Math.max(currentTime, 100);
//   const scale = 800 / maxTime;

//   return (
//     <div className="bg-card rounded-xl p-6 shadow-[var(--shadow-md)] border border-border">
//       <div className="flex items-center gap-3 mb-6">
//         <div className="p-2 bg-primary/10 rounded-lg">
//           <BarChart3 className="w-5 h-5 text-primary" />
//         </div>
//         <div>
//           <h3 className="font-semibold text-lg">Gantt Chart</h3>
//           <p className="text-sm text-muted-foreground">Execution Timeline</p>
//         </div>
//       </div>

//       {ganttChart.length === 0 ? (
//         <div className="text-center py-12 text-muted-foreground text-sm">
//           No execution history yet. Start the simulation to see the timeline.
//         </div>
//       ) : (
//         <div className="space-y-4">
//           {/* Timeline ruler */}
//           <div className="relative h-8 border-b border-border">
//             {Array.from({ length: Math.ceil(maxTime / 10) + 1 }, (_, i) => i * 10).map((time) => (
//               <div
//                 key={time}
//                 className="absolute text-xs text-muted-foreground"
//                 style={{ left: `${time * scale}px` }}
//               >
//                 {time}
//               </div>
//             ))}
//           </div>

//           {/* Gantt bars */}
//           <div className="relative min-h-[60px] space-y-2">
//             {ganttChart.map((entry, index) => {
//               const width = (entry.end - entry.start) * scale;
//               const left = entry.start * scale;
//               const color = getProcessColor(entry.processId, entry.queueLevel);

//               return (
//                 <motion.div
//                   key={`${entry.processId}-${index}`}
//                   initial={{ scaleX: 0, opacity: 0 }}
//                   animate={{ scaleX: 1, opacity: 1 }}
//                   transition={{ duration: 0.3 }}
//                   className="absolute h-10 rounded flex items-center justify-center text-xs font-medium text-white shadow-sm"
//                   style={{
//                     left: `${left}px`,
//                     width: `${width}px`,
//                     backgroundColor: color,
//                     transformOrigin: 'left',
//                   }}
//                   title={`${entry.processId}: ${entry.start}ms - ${entry.end}ms (Q${entry.queueLevel + 1})`}
//                 >
//                   {width > 40 && entry.processId}
//                 </motion.div>
//               );
//             })}
//           </div>

//           {/* Legend */}
//           <div className="flex flex-wrap items-center gap-4 pt-4 border-t border-border">
//             <div className="text-sm text-muted-foreground font-medium">Queues:</div>
//             {[0, 1, 2].map((level) => (
//               <div key={level} className="flex items-center gap-2">
//                 <div
//                   className="w-4 h-4 rounded border border-border"
//                   style={{ backgroundColor: getProcessColor(`Example${level}`, level) }}
//                 />
//                 <span className="text-sm text-muted-foreground">Q{level + 1}</span>
//               </div>
//             ))}
//           </div>
//         </div>
//       )}
//     </div>
//   );
// };
