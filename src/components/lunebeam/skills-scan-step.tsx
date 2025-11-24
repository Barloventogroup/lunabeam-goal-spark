import React, { useState, useEffect } from 'react';
import { EfItem, EF_ITEM_BANK, getAllPillarIds, getPillarInfo, getItemText } from '@/ef/efModel';
import { 
  EfItemResponse, 
  EfResponseValue, 
  EF_RESPONSE_LABELS,
  computePillarFrictionScores,
  computeEfPriorities,
  getTopEfFocusAreas,
  getFrictionLevelColor,
  EfPriorityArea,
  PillarFrictionScore
} from '@/ef/efScoring';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';
import { Check } from 'lucide-react';

interface SkillsScanStepProps {
  role: 'individual' | 'parent' | '';
  individualName?: string; // For parent perspective
  responses: Array<{ itemId: string; value: number }>;
  selectedPillars: string[];
  priorities: EfPriorityArea[];
  onResponsesChange: (responses: Array<{ itemId: string; value: number }>, priorities: EfPriorityArea[]) => void;
  onPillarsChange: (pillars: string[]) => void;
}

export function SkillsScanStep({ 
  role, 
  individualName,
  responses, 
  selectedPillars,
  priorities,
  onResponsesChange,
  onPillarsChange
}: SkillsScanStepProps) {
  const [localResponses, setLocalResponses] = useState<Array<{ itemId: string; value: number }>>(responses);
  const [localPriorities, setLocalPriorities] = useState<EfPriorityArea[]>(priorities);
  const [customSelectionMode, setCustomSelectionMode] = useState(false);
  
  const perspective = role === 'parent' ? 'observer' : 'individual';
  const items = EF_ITEM_BANK;
  
  // Compute priorities whenever responses change
  useEffect(() => {
    if (localResponses.length > 0) {
      const efResponses: EfItemResponse[] = localResponses.map(r => ({
        itemId: r.itemId,
        value: r.value as EfResponseValue
      }));
      
      const computedPriorities = computeEfPriorities(items, efResponses);
      setLocalPriorities(computedPriorities);
      onResponsesChange(localResponses, computedPriorities);
    }
  }, [localResponses, items.length, onResponsesChange]);
  
  // Auto-select top focus areas when all questions are answered
  useEffect(() => {
    if (
      localResponses.length === items.length && 
      selectedPillars.length === 0 && 
      !customSelectionMode &&
      localPriorities.length > 0
    ) {
      const topAreas = getTopEfFocusAreas(localPriorities, 3);
      onPillarsChange(topAreas);
    }
  }, [localResponses.length, items.length, selectedPillars.length, customSelectionMode, localPriorities, onPillarsChange]);
  
  // Handle response change for an item
  const handleResponseChange = (itemId: string, value: EfResponseValue) => {
    const existing = localResponses.find(r => r.itemId === itemId);
    let newResponses: Array<{ itemId: string; value: number }>;
    
    if (existing) {
      newResponses = localResponses.map(r => 
        r.itemId === itemId ? { ...r, value } : r
      );
    } else {
      newResponses = [...localResponses, { itemId, value }];
    }
    
    setLocalResponses(newResponses);
  };
  
  // Handle pillar selection toggle
  const handlePillarToggle = (pillarId: string) => {
    setCustomSelectionMode(true);
    
    if (selectedPillars.includes(pillarId)) {
      onPillarsChange(selectedPillars.filter(p => p !== pillarId));
    } else {
      onPillarsChange([...selectedPillars, pillarId]);
    }
  };
  
  // Get response value for an item
  const getResponseValue = (itemId: string): EfResponseValue | undefined => {
    const response = localResponses.find(r => r.itemId === itemId);
    return response ? (response.value as EfResponseValue) : undefined;
  };
  
  // Calculate completion percentage
  const completionPercent = Math.round((localResponses.length / items.length) * 100);
  
  // Get friction scores for display
  const frictionScores = localResponses.length > 0 
    ? computePillarFrictionScores(items, localResponses.map(r => ({ itemId: r.itemId, value: r.value as EfResponseValue })))
    : [];
    
  return (
    <div className="space-y-6">
      {/* Progress indicator */}
      {localResponses.length < items.length && (
        <div className="text-sm text-muted-foreground">
          {localResponses.length} of {items.length} questions answered
        </div>
      )}
      
      {/* Items Section */}
      <div className="space-y-4">
        {items.map((item) => (
            <EfItemQuestion
              key={item.id}
              item={item}
              perspective={perspective}
              individualName={individualName}
              value={getResponseValue(item.id)}
              onChange={(value) => handleResponseChange(item.id, value)}
            />
        ))}
      </div>
      
      {/* Friction Map - Show after at least 3 responses */}
      {localResponses.length >= 3 && (
        <Card className="p-4 space-y-4 bg-muted/30">
          <h3 className="font-semibold text-lg">Your Friction Map</h3>
          <p className="text-sm text-muted-foreground">
            This shows which areas feel hardest right now
          </p>
          
          <div className="space-y-2">
            {frictionScores.map((score) => (
              <FrictionPillarChip key={score.pillarId} score={score} />
            ))}
          </div>
          
          {/* Summary text */}
          {localPriorities.length > 0 && (
            <div className="pt-4 border-t border-border">
              <p className="text-sm">
                Right now, the highest friction seems to be in:{' '}
                <strong>
                  {localPriorities
                    .slice(0, 2)
                    .map(p => getPillarInfo(p.pillarId as any).label)
                    .join(' and ')}
                </strong>
              </p>
            </div>
          )}
        </Card>
      )}
      
      {/* Focus Areas Selection - Show when all items answered */}
      {localResponses.length === items.length && (
        <Card className="p-4 space-y-4 bg-primary/5">
          <h3 className="font-semibold text-lg">Choose Your Focus Areas</h3>
          <p className="text-sm text-muted-foreground">
            We've pre-selected the areas that might need the most support. 
            You can change these if you want to focus on different skills.
          </p>
          
          <div className="space-y-2">
            {getAllPillarIds().map((pillarId) => {
              const pillarInfo = getPillarInfo(pillarId);
              const isSelected = selectedPillars.includes(pillarId);
              
              return (
                <button
                  key={pillarId}
                  onClick={() => handlePillarToggle(pillarId)}
                  className={cn(
                    "w-full p-3 rounded-lg border-2 text-left transition-all",
                    isSelected 
                      ? "border-primary bg-primary/5" 
                      : "border-border hover:border-primary/50"
                  )}
                >
                  <div className="flex items-center gap-3">
                    <div className={cn(
                      "w-5 h-5 rounded border-2 flex items-center justify-center flex-shrink-0",
                      isSelected ? "bg-primary border-primary" : "border-muted-foreground"
                    )}>
                      {isSelected && (
                        <Check className="w-3 h-3 text-primary-foreground" />
                      )}
                    </div>
                    <span className="font-medium">{pillarInfo.label}</span>
                  </div>
                </button>
              );
            })}
          </div>
          
          <div className="pt-4 space-y-3 border-t border-border">
            {!customSelectionMode && (
              <button
                onClick={() => setCustomSelectionMode(true)}
                className="text-sm text-muted-foreground hover:text-foreground underline"
              >
                I'll choose areas myself
              </button>
            )}
            
            <p className="text-xs text-center text-muted-foreground pt-2">
              This scan is for planning support and goals. 
              It is not a medical or psychological diagnosis.
            </p>
          </div>
        </Card>
      )}
    </div>
  );
}

// ============================================================================
// SUB-COMPONENTS
// ============================================================================

interface EfItemQuestionProps {
  item: EfItem;
  perspective: 'individual' | 'observer';
  individualName?: string;
  value: EfResponseValue | undefined;
  onChange: (value: EfResponseValue) => void;
}

function EfItemQuestion({ item, perspective, individualName, value, onChange }: EfItemQuestionProps) {
  let questionText = getItemText(item, perspective);
  
  // For parent perspective, inject the child's name
  if (perspective === 'observer' && individualName) {
    questionText = questionText.replace(
      'How hard is it',
      `How hard is it for ${individualName}`
    );
  }
  
  return (
    <Card className="p-4 space-y-3 bg-card">
      <p className="font-medium text-sm">{questionText}</p>
      
      <RadioGroup
        value={value?.toString()}
        onValueChange={(val) => onChange(parseInt(val) as EfResponseValue)}
        className="space-y-2"
      >
        {([0, 1, 2, 3] as EfResponseValue[]).map((rating) => (
          <div key={rating} className="flex items-center space-x-2">
            <RadioGroupItem value={rating.toString()} id={`${item.id}-${rating}`} />
            <Label 
              htmlFor={`${item.id}-${rating}`}
              className="text-sm cursor-pointer flex-1"
            >
              {EF_RESPONSE_LABELS[rating]}
            </Label>
          </div>
        ))}
      </RadioGroup>
    </Card>
  );
}

interface FrictionPillarChipProps {
  score: PillarFrictionScore;
}

function FrictionPillarChip({ score }: FrictionPillarChipProps) {
  const pillarInfo = getPillarInfo(score.pillarId);
  
  return (
    <div className="flex items-center justify-between p-3 rounded-lg bg-background border border-border">
      <span className="text-sm font-medium">{pillarInfo.label}</span>
      <Badge 
        variant={score.level === 'HIGH' ? 'destructive' : score.level === 'MEDIUM' ? 'default' : 'secondary'}
        className="text-xs"
      >
        {score.level}
      </Badge>
    </div>
  );
}
