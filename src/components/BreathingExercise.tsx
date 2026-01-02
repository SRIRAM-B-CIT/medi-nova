import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Play, Pause, RotateCcw } from 'lucide-react';

type BreathingPhase = 'inhale' | 'hold' | 'exhale' | 'pause';

export function BreathingExercise() {
  const [isActive, setIsActive] = useState(false);
  const [phase, setPhase] = useState<BreathingPhase>('inhale');
  const [timeLeft, setTimeLeft] = useState(4);
  const [cycle, setCycle] = useState(0);

  const phaseDurations = {
    inhale: 4,
    hold: 4,
    exhale: 4,
    pause: 2
  };

  const phaseMessages = {
    inhale: 'Breathe In',
    hold: 'Hold',
    exhale: 'Breathe Out',
    pause: 'Rest'
  };

  useEffect(() => {
    let interval: NodeJS.Timeout;

    if (isActive && timeLeft > 0) {
      interval = setInterval(() => {
        setTimeLeft((prev) => prev - 1);
      }, 1000);
    } else if (isActive && timeLeft === 0) {
      // Move to next phase
      const phases: BreathingPhase[] = ['inhale', 'hold', 'exhale', 'pause'];
      const currentIndex = phases.indexOf(phase);
      const nextPhase = phases[(currentIndex + 1) % phases.length];
      
      setPhase(nextPhase);
      setTimeLeft(phaseDurations[nextPhase]);
      
      if (nextPhase === 'inhale') {
        setCycle(prev => prev + 1);
      }
    }

    return () => clearInterval(interval);
  }, [isActive, timeLeft, phase]);

  const handleStart = () => {
    setIsActive(true);
  };

  const handlePause = () => {
    setIsActive(false);
  };

  const handleReset = () => {
    setIsActive(false);
    setPhase('inhale');
    setTimeLeft(4);
    setCycle(0);
  };

  const getCircleClasses = () => {
    const baseClasses = "w-48 h-48 rounded-full border-4 flex items-center justify-center transition-all duration-1000";
    
    switch (phase) {
      case 'inhale':
        return `${baseClasses} bg-primary/20 border-primary animate-breathe scale-110`;
      case 'hold':
        return `${baseClasses} bg-calming/30 border-calming scale-110`;
      case 'exhale':
        return `${baseClasses} bg-secondary/20 border-secondary scale-90`;
      case 'pause':
        return `${baseClasses} bg-muted/20 border-muted`;
      default:
        return `${baseClasses} bg-primary/20 border-primary`;
    }
  };

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardContent className="p-6">
        <div className="flex flex-col items-center space-y-6">
          {/* Breathing Circle */}
          <div className="flex flex-col items-center space-y-4">
            <div className={getCircleClasses()}>
              <div className="text-center">
                <div className="text-2xl font-bold">{timeLeft}</div>
                <div className="text-sm text-muted-foreground">seconds</div>
              </div>
            </div>
            
            <div className="text-center">
              <div className="text-lg font-semibold text-primary">
                {phaseMessages[phase]}
              </div>
              <div className="text-sm text-muted-foreground">
                Cycle {cycle + 1}
              </div>
            </div>
          </div>

          {/* Controls */}
          <div className="flex space-x-3">
            {!isActive ? (
              <Button onClick={handleStart} className="bg-primary hover:bg-primary/90">
                <Play className="h-4 w-4 mr-2" />
                Start
              </Button>
            ) : (
              <Button onClick={handlePause} variant="outline">
                <Pause className="h-4 w-4 mr-2" />
                Pause
              </Button>
            )}
            
            <Button onClick={handleReset} variant="outline">
              <RotateCcw className="h-4 w-4 mr-2" />
              Reset
            </Button>
          </div>

          {/* Instructions */}
          <div className="text-center text-sm text-muted-foreground space-y-1">
            <p>Follow the circle and breathing prompts</p>
            <p>4 seconds in • 4 seconds hold • 4 seconds out • 2 seconds rest</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}