import React, { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { getPillarInfo } from '@/ef/efModel';
import { 
  getTemplatesByPillars, 
  getOtherTemplates, 
  TIMEFRAME_OPTIONS,
  type GoalTemplate 
} from '@/goals/goalTemplates';
import { cn } from '@/lib/utils';

interface GoalIntentStepProps {
  selectedPillars: string[];
  onGoalSelected: (goalData: {
    title: string;
    templateId?: string;
    timeframe: 'short_term' | 'mid_term' | 'long_term';
    focusAreas: string[];
  }) => void;
  onSkip?: () => void;
}

export function GoalIntentStep({ 
  selectedPillars, 
  onGoalSelected,
  onSkip 
}: GoalIntentStepProps) {
  const [selectedTemplateId, setSelectedTemplateId] = useState<string | null>(null);
  const [customGoalText, setCustomGoalText] = useState('');
  const [timeframe, setTimeframe] = useState<'short_term' | 'mid_term' | 'long_term' | null>(null);
  const [showCustomInput, setShowCustomInput] = useState(false);

  const suggestedTemplates = getTemplatesByPillars(selectedPillars).slice(0, 4);
  const otherTemplates = getOtherTemplates(selectedPillars).slice(0, 4);

  const handleTemplateSelect = (templateId: string) => {
    setSelectedTemplateId(templateId);
    setShowCustomInput(false);
    setCustomGoalText('');
  };

  const handleCustomToggle = () => {
    setShowCustomInput(true);
    setSelectedTemplateId(null);
  };

  const handleContinue = () => {
    if (!timeframe) return;

    if (selectedTemplateId) {
      const template = [...suggestedTemplates, ...otherTemplates].find(
        t => t.id === selectedTemplateId
      );
      if (template) {
        onGoalSelected({
          title: template.title,
          templateId: template.id,
          timeframe,
          focusAreas: selectedPillars
        });
      }
    } else if (customGoalText.trim()) {
      onGoalSelected({
        title: customGoalText.trim(),
        timeframe,
        focusAreas: selectedPillars
      });
    }
  };

  const canContinue = timeframe && (selectedTemplateId || customGoalText.trim().length > 0);

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Suggested Templates Section */}
      {suggestedTemplates.length > 0 && (
        <div className="space-y-4">
          <div>
            <h3 className="text-xl font-semibold mb-2">Suggested for you</h3>
            <p className="text-sm text-muted-foreground">
              Based on your skills scan, these goals might help make things easier
            </p>
          </div>

          <div className="grid gap-3">
            {suggestedTemplates.map((template) => (
              <TemplateCard
                key={template.id}
                template={template}
                isSelected={selectedTemplateId === template.id}
                onSelect={() => handleTemplateSelect(template.id)}
              />
            ))}
          </div>
        </div>
      )}

      {/* Other Ideas Section */}
      {otherTemplates.length > 0 && (
        <div className="space-y-4">
          <div>
            <h3 className="text-xl font-semibold mb-2">Or try something else</h3>
            <p className="text-sm text-muted-foreground">
              Different areas to work on
            </p>
          </div>

          <div className="grid gap-3">
            {otherTemplates.map((template) => (
              <TemplateCard
                key={template.id}
                template={template}
                isSelected={selectedTemplateId === template.id}
                onSelect={() => handleTemplateSelect(template.id)}
              />
            ))}
          </div>
        </div>
      )}

      {/* Custom Goal Input */}
      <div className="space-y-4">
        <Button
          variant="outline"
          onClick={handleCustomToggle}
          className="w-full"
          disabled={showCustomInput}
        >
          Or write your own goal
        </Button>

        {showCustomInput && (
          <div className="space-y-2">
            <Label htmlFor="custom-goal">What would you like to work on?</Label>
            <Input
              id="custom-goal"
              placeholder="e.g., Complete homework before dinner each night"
              value={customGoalText}
              onChange={(e) => setCustomGoalText(e.target.value)}
              className="w-full"
            />
          </div>
        )}
      </div>

      {/* Timeframe Selector - shows when something is selected */}
      {(selectedTemplateId || customGoalText.trim()) && (
        <Card className="p-4 space-y-4 border-2 border-primary/20 bg-primary/5">
          <div>
            <h3 className="font-semibold mb-2">When do you want to work on this?</h3>
            <p className="text-sm text-muted-foreground">Choose a timeframe that feels doable</p>
          </div>

          <RadioGroup
            value={timeframe || ''}
            onValueChange={(value) => setTimeframe(value as typeof timeframe)}
          >
            {TIMEFRAME_OPTIONS.map((option) => (
              <div key={option.value} className="flex items-center space-x-2">
                <RadioGroupItem value={option.value} id={option.value} />
                <Label 
                  htmlFor={option.value}
                  className="text-sm cursor-pointer flex-1 font-medium"
                >
                  {option.label}
                  <span className="text-muted-foreground font-normal ml-2">
                    ({option.duration})
                  </span>
                </Label>
              </div>
            ))}
          </RadioGroup>
        </Card>
      )}

      {/* Action Buttons */}
      <div className="flex gap-3 pt-4">
        <Button
          onClick={handleContinue}
          disabled={!canContinue}
          className="flex-1"
        >
          Continue with this goal
        </Button>
        
        {onSkip && (
          <Button
            variant="ghost"
            onClick={onSkip}
            className="text-muted-foreground"
          >
            Skip for now
          </Button>
        )}
      </div>
    </div>
  );
}

// Template Card Component
interface TemplateCardProps {
  template: GoalTemplate;
  isSelected: boolean;
  onSelect: () => void;
}

function TemplateCard({ template, isSelected, onSelect }: TemplateCardProps) {
  return (
    <button
      onClick={onSelect}
      className={cn(
        "w-full text-left p-4 rounded-lg border-2 transition-all",
        isSelected
          ? "border-primary bg-primary/5 shadow-sm"
          : "border-border hover:border-primary/50 hover:bg-muted/50"
      )}
    >
      <div className="space-y-2">
        <div className="flex items-start justify-between gap-2">
          <h4 className="font-semibold text-sm leading-tight flex-1">
            {template.title}
          </h4>
          {isSelected && (
            <div className="w-5 h-5 rounded-full bg-primary flex items-center justify-center flex-shrink-0">
              <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
              </svg>
            </div>
          )}
        </div>

        <p className="text-sm text-muted-foreground leading-relaxed">
          {template.description}
        </p>

        <div className="flex flex-wrap gap-1.5">
          {template.pillarIds.map((pillarId) => {
            const pillarInfo = getPillarInfo(pillarId);
            return (
              <Badge key={pillarId} variant="secondary" className="text-xs">
                {pillarInfo.label}
              </Badge>
            );
          })}
        </div>
      </div>
    </button>
  );
}
