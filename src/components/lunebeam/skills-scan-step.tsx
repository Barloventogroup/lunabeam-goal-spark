import React, { useState } from 'react';
import { EfPillarId, EF_PILLARS, getAllPillarIds } from '@/ef/efModel';
import { Card } from '@/components/ui/card';
import { Check } from 'lucide-react';
import { cn } from '@/lib/utils';

interface SkillsScanStepProps {
  role: 'individual' | 'parent' | '';
  individualName?: string; // For parent perspective
  selectedPillars: EfPillarId[];
  onPillarsChange: (pillars: EfPillarId[]) => void;
  onSkip?: () => void; // Optional skip handler
}

const PILLAR_SUBTITLES: Record<EfPillarId, string> = {
  GETTING_STARTED_FINISHING: 'Starting and finishing tasks',
  PLANNING_ORGANIZATION_TIME: 'Managing time and staying organized',
  FOCUS_WORKING_MEMORY: 'Staying focused and on track',
  EMOTIONS_STRESS_OVERWHELM: 'Handling stress and frustration',
  FLEXIBILITY_CHANGE: 'Adapting when plans change',
  SELF_ADVOCACY_INDEPENDENCE: 'Asking for help when needed'
};

export function SkillsScanStep({ 
  role, 
  individualName,
  selectedPillars,
  onPillarsChange,
  onSkip
}: SkillsScanStepProps) {
  const [showMaxMessage, setShowMaxMessage] = useState(false);
  
  const allPillarIds = getAllPillarIds();
  
  const handlePillarToggle = (pillarId: EfPillarId) => {
    if (selectedPillars.includes(pillarId)) {
      // Deselect
      onPillarsChange(selectedPillars.filter(p => p !== pillarId));
      setShowMaxMessage(false);
    } else {
      // Select
      if (selectedPillars.length >= 3) {
        // Show message and don't allow selection
        setShowMaxMessage(true);
        setTimeout(() => setShowMaxMessage(false), 2000);
      } else {
        onPillarsChange([...selectedPillars, pillarId]);
        setShowMaxMessage(false);
      }
    }
  };
  
  const handleSkip = () => {
    // Set reasonable defaults and proceed if onSkip provided
    onPillarsChange(['GETTING_STARTED_FINISHING', 'PLANNING_ORGANIZATION_TIME']);
    if (onSkip) {
      onSkip();
    }
  };
  
  return (
    <div className="space-y-6">
      {/* Max selection message */}
      {showMaxMessage && (
        <div className="bg-muted border border-border rounded-lg p-3 text-sm text-center animate-in fade-in slide-in-from-top-2">
          You can pick up to 3 areas
        </div>
      )}
      
      {/* Pillar chips */}
      <div className="space-y-3">
        {allPillarIds.map((pillarId) => {
          const pillarInfo = EF_PILLARS[pillarId];
          const isSelected = selectedPillars.includes(pillarId);
          
          return (
            <Card
              key={pillarId}
              className={cn(
                "p-4 cursor-pointer transition-all shadow-md",
                isSelected 
                  ? "bg-primary/5 ring-2 ring-primary" 
                  : "hover:shadow-lg hover:bg-accent/50"
              )}
              onClick={() => handlePillarToggle(pillarId)}
            >
              <div className="flex items-start gap-3">
                {/* Content */}
                <div className="flex-1 space-y-1">
                  <div className="flex items-center gap-2">
                    {pillarInfo.icon && (
                      <span className="text-lg">{pillarInfo.icon}</span>
                    )}
                    <h3 className="font-semibold text-base">
                      {pillarInfo.label}
                    </h3>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {PILLAR_SUBTITLES[pillarId]}
                  </p>
                </div>
                
                {/* Conditional checkmark - only when selected, on the right */}
                {isSelected && <Check className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />}
              </div>
            </Card>
          );
        })}
      </div>
      
      {/* Skip option */}
      <div className="text-center pt-2">
        <button
          onClick={handleSkip}
          className="text-sm text-muted-foreground hover:text-foreground underline"
        >
          I'm not sure, just show me ideas
        </button>
      </div>
      
      {/* Disclaimer */}
      <p className="text-xs text-center text-muted-foreground pt-4 border-t border-border">
        This helps Lunabeam suggest goals and routines. It is not a medical or psychological diagnosis.
      </p>
    </div>
  );
}
