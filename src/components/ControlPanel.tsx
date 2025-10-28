import { useState } from 'react';
import { Plus, Settings2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card } from '@/components/ui/card';
import { useSimulationStore } from '@/store/simulationStore';
import { SchedulingAlgorithm } from '@/types/mlfq';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

export const ControlPanel = () => {
  const { 
    algorithm, 
    setAlgorithm,
    addProcess, 
    numQueues, 
    setNumQueues, 
    queues, 
    setTimeQuantum, 
    agingInterval, 
    setAgingInterval,
    rrQuantum,
    setRRQuantum 
  } = useSimulationStore();
  const [processName, setProcessName] = useState('');
  const [arrivalTime, setArrivalTime] = useState('0');
  const [burstTime, setBurstTime] = useState('10');
  const [settingsOpen, setSettingsOpen] = useState(false);

  const handleAddProcess = () => {
    if (processName && burstTime) {
      addProcess({
        name: processName,
        arrivalTime: parseInt(arrivalTime) || 0,
        burstTime: parseInt(burstTime),
        priority: 0,
      });
      setProcessName('');
      setArrivalTime('0');
      setBurstTime('10');
    }
  };

  return (
    <Card className="p-6">
      <div className="flex items-center justify-between mb-6">
        <h3 className="font-semibold text-lg">Control Panel</h3>
        <Dialog open={settingsOpen} onOpenChange={setSettingsOpen}>
          <DialogTrigger asChild>
            <Button variant="outline" size="sm" className="gap-2">
              <Settings2 className="w-4 h-4" />
              Settings
            </Button>
          </DialogTrigger>
          <DialogContent className="max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Simulation Settings</DialogTitle>
              <DialogDescription>
                Configure scheduling algorithm parameters
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 pt-4">
              <div className="space-y-2">
                <Label htmlFor="algorithm">Scheduling Algorithm</Label>
                <Select value={algorithm} onValueChange={(value) => setAlgorithm(value as SchedulingAlgorithm)}>
                  <SelectTrigger id="algorithm">
                    <SelectValue placeholder="Select algorithm" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="FIFO">FIFO / FCFS</SelectItem>
                    <SelectItem value="SJF">Shortest Job First (SJF)</SelectItem>
                    <SelectItem value="STCF">Shortest Time to Completion First (STCF)</SelectItem>
                    <SelectItem value="RR">Round Robin (RR)</SelectItem>
                    <SelectItem value="MLFQ">Multi-Level Feedback Queue (MLFQ)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {algorithm === 'RR' && (
                <div className="space-y-2">
                  <Label htmlFor="rrQuantum">Round Robin Time Quantum (ms)</Label>
                  <Input
                    id="rrQuantum"
                    type="number"
                    min="1"
                    value={rrQuantum}
                    onChange={(e) => setRRQuantum(parseInt(e.target.value) || 1)}
                  />
                </div>
              )}

              {algorithm === 'MLFQ' && (
                <>
                  <div className="space-y-2">
                    <Label htmlFor="numQueues">Number of Queues</Label>
                    <Input
                      id="numQueues"
                      type="number"
                      min="1"
                      max="5"
                      value={numQueues}
                      onChange={(e) => setNumQueues(parseInt(e.target.value) || 1)}
                    />
                  </div>

                  {queues.map((queue) => (
                    <div key={queue.level} className="space-y-2">
                      <Label htmlFor={`quantum-${queue.level}`}>
                        Queue {queue.level + 1} Time Quantum (ms)
                      </Label>
                      <Input
                        id={`quantum-${queue.level}`}
                        type="number"
                        min="1"
                        value={queue.timeQuantum}
                        onChange={(e) => setTimeQuantum(queue.level, parseInt(e.target.value) || 1)}
                      />
                    </div>
                  ))}

                  <div className="space-y-2">
                    <Label htmlFor="aging">Aging Interval (ms)</Label>
                    <Input
                      id="aging"
                      type="number"
                      min="1"
                      value={agingInterval}
                      onChange={(e) => setAgingInterval(parseInt(e.target.value) || 1)}
                    />
                  </div>
                </>
              )}
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="space-y-4">
        <div className="space-y-2">
          <Label>Selected Algorithm</Label>
          <div className="text-sm font-medium text-primary">
            {algorithm === 'FIFO' && 'First In, First Out (FCFS)'}
            {algorithm === 'SJF' && 'Shortest Job First'}
            {algorithm === 'STCF' && 'Shortest Time to Completion First'}
            {algorithm === 'RR' && `Round Robin (Quantum: ${rrQuantum}ms)`}
            {algorithm === 'MLFQ' && 'Multi-Level Feedback Queue'}
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="space-y-2">
            <Label htmlFor="processName">Process Name</Label>
            <Input
              id="processName"
              placeholder="e.g., P1"
              value={processName}
              onChange={(e) => setProcessName(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="arrivalTime">Arrival Time (ms)</Label>
            <Input
              id="arrivalTime"
              type="number"
              min="0"
              value={arrivalTime}
              onChange={(e) => setArrivalTime(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="burstTime">Burst Time (ms)</Label>
            <Input
              id="burstTime"
              type="number"
              min="1"
              value={burstTime}
              onChange={(e) => setBurstTime(e.target.value)}
            />
          </div>
        </div>

        <Button onClick={handleAddProcess} className="w-full gap-2">
          <Plus className="w-4 h-4" />
          Add Process
        </Button>
      </div>
    </Card>
  );
};
