import { Play, Pause, RotateCcw, SkipForward } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useSimulationStore } from '@/store/simulationStore';

export const SimulationControls = () => {
  const { 
    isRunning, 
    isPaused,
    startSimulation, 
    pauseSimulation, 
    resumeSimulation, 
    resetSimulation,
    stepSimulation 
  } = useSimulationStore();

  const handlePlayPause = () => {
    if (!isRunning) {
      startSimulation();
    } else if (isPaused) {
      resumeSimulation();
    } else {
      pauseSimulation();
    }
  };

  return (
    <div className="flex items-center gap-3">
      <Button
        onClick={handlePlayPause}
        size="lg"
        className="gap-2"
      >
        {isRunning && !isPaused ? (
          <>
            <Pause className="w-5 h-5" />
            Pause
          </>
        ) : (
          <>
            <Play className="w-5 h-5" />
            {isRunning ? 'Resume' : 'Start'}
          </>
        )}
      </Button>

      <Button
        onClick={stepSimulation}
        variant="outline"
        size="lg"
        disabled={isRunning && !isPaused}
        className="gap-2"
      >
        <SkipForward className="w-5 h-5" />
        Step
      </Button>

      <Button
        onClick={resetSimulation}
        variant="outline"
        size="lg"
        className="gap-2"
      >
        <RotateCcw className="w-5 h-5" />
        Reset
      </Button>
    </div>
  );
};
