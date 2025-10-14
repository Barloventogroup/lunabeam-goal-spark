import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { AlertDialog, AlertDialogContent, AlertDialogHeader, AlertDialogTitle, AlertDialogDescription, AlertDialogFooter, AlertDialogCancel, AlertDialogAction } from '@/components/ui/alert-dialog';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { StarRating } from './star-rating';
import { IndependenceSlider } from './independence-slider';
import { ConfidenceRating } from './confidence-rating';
import { Award, HelpCircle, ChevronDown, ChevronUp, Loader2, CheckCircle2, AlertCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { CheckInInput } from '@/types';

interface ProgressiveMasteryCheckInProps {
  isOpen: boolean;
  onClose: () => void;
  step: {
    id: string;
    title: string;
    notes?: string;
    explainer?: string;
  };
  goal: {
    id: string;
    title: string;
    goal_type?: string;
  };
  onComplete: (checkInData: CheckInInput) => Promise<void>;
  onSkip?: () => Promise<void>;
}

export const ProgressiveMasteryCheckIn: React.FC<ProgressiveMasteryCheckInProps> = ({
  isOpen,
  onClose,
  step,
  goal,
  onComplete,
  onSkip,
}) => {
  // Required fields
  const [qualityRating, setQualityRating] = useState<number>(0);
  const [independenceLevel, setIndependenceLevel] = useState<number>(0);

  // Optional fields
  const [timeSpentMinutes, setTimeSpentMinutes] = useState<number | undefined>();
  const [confidenceBefore, setConfidenceBefore] = useState<number>(0);
  const [confidenceAfter, setConfidenceAfter] = useState<number>(0);
  const [notes, setNotes] = useState<string>('');

  // UI states
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showSkipConfirmation, setShowSkipConfirmation] = useState(false);
  const [showAdvanced, setShowAdvanced] = useState(false);

  const isFormValid = (): boolean => {
    return qualityRating >= 1 && qualityRating <= 5 && 
           independenceLevel >= 1 && independenceLevel <= 5;
  };

  const validateTimeSpent = (value: number): boolean => {
    return value >= 1 && value <= 480;
  };

  const getCharacterCount = (): { current: number; max: number; remaining: number } => {
    return {
      current: notes.length,
      max: 500,
      remaining: 500 - notes.length,
    };
  };

  const cleanStepTitle = (title: string): string => {
    return title.replace(/^\d+\.\s*/, '').replace(/^✅\s*/, '');
  };

  const handleSubmit = async () => {
    if (!isFormValid() || isSubmitting) return;

    setIsSubmitting(true);
    setError(null);

    try {
      const checkInData: CheckInInput = {
        goalId: goal.id,
        stepId: step.id,
        qualityRating,
        independenceLevel,
        timeSpentMinutes: timeSpentMinutes || undefined,
        confidenceBefore: confidenceBefore > 0 ? confidenceBefore : undefined,
        confidenceAfter: confidenceAfter > 0 ? confidenceAfter : undefined,
        notes: notes.trim() || undefined,
      };

      await onComplete(checkInData);

      setShowSuccess(true);

      setTimeout(() => {
        handleClose();
      }, 1500);

    } catch (err) {
      console.error('Failed to submit check-in:', err);
      setError(err instanceof Error ? err.message : 'Failed to save check-in. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSkip = async () => {
    if (isSubmitting) return;

    if (!showSkipConfirmation) {
      setShowSkipConfirmation(true);
      return;
    }

    setIsSubmitting(true);

    try {
      if (onSkip) {
        await onSkip();
      }
      handleClose();
    } catch (err) {
      console.error('Failed to skip check-in:', err);
      setError('Failed to skip check-in. Please try again.');
    } finally {
      setIsSubmitting(false);
      setShowSkipConfirmation(false);
    }
  };

  const handleClose = () => {
    if (isSubmitting) return;

    setQualityRating(0);
    setIndependenceLevel(0);
    setTimeSpentMinutes(undefined);
    setConfidenceBefore(0);
    setConfidenceAfter(0);
    setNotes('');
    setShowSuccess(false);
    setError(null);
    setShowSkipConfirmation(false);
    setShowAdvanced(false);

    onClose();
  };

  return (
    <>
      <Dialog open={isOpen && !showSuccess} onOpenChange={handleClose}>
        <DialogContent className="max-w-full md:max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Award className="h-5 w-5 text-primary" />
              How did this step go?
            </DialogTitle>
            <DialogDescription>
              Tell us about your experience completing "{cleanStepTitle(step.title)}"
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6">
            {/* Step Context Card */}
            <Card className="p-4 bg-card-soft">
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-medium text-foreground">{cleanStepTitle(step.title)}</h4>
                    <p className="text-sm text-muted-foreground">{goal.title}</p>
                  </div>
                  <Badge variant="secondary" className="text-xs">
                    Progressive Mastery
                  </Badge>
                </div>
                {step.explainer && (
                  <p className="text-sm text-muted-foreground bg-muted/50 p-2 rounded">
                    {step.explainer}
                  </p>
                )}
              </div>
            </Card>

            {/* Required Fields Section */}
            <div className="space-y-4">
              {/* Quality Rating */}
              <div className="space-y-3">
                <Label className="text-base font-medium flex items-center gap-2">
                  Quality Rating <span className="text-destructive">*</span>
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <HelpCircle className="h-4 w-4 text-muted-foreground" />
                      </TooltipTrigger>
                      <TooltipContent>
                        How well did you perform this step?
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </Label>
                <StarRating
                  value={qualityRating}
                  onChange={setQualityRating}
                  size="lg"
                  showLabels={true}
                />
                {qualityRating === 0 && (
                  <p className="text-xs text-muted-foreground">
                    Please rate the quality of your work
                  </p>
                )}
              </div>

              {/* Independence Level */}
              <div className="space-y-3">
                <Label className="text-base font-medium flex items-center gap-2">
                  Independence Level <span className="text-destructive">*</span>
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <HelpCircle className="h-4 w-4 text-muted-foreground" />
                      </TooltipTrigger>
                      <TooltipContent>
                        How much help did you need?
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </Label>
                <IndependenceSlider
                  value={independenceLevel}
                  onChange={setIndependenceLevel}
                />
                {independenceLevel === 0 && (
                  <p className="text-xs text-muted-foreground">
                    Please select your independence level
                  </p>
                )}
              </div>
            </div>

            {/* Time Spent (Optional) */}
            <div className="space-y-3">
              <Label htmlFor="time-spent" className="text-base font-medium">
                Time Spent (optional)
              </Label>
              <div className="space-y-2">
                <div className="flex flex-wrap gap-2">
                  {[5, 10, 15, 30, 60, 90, 120].map((minutes) => (
                    <Button
                      key={minutes}
                      type="button"
                      variant={timeSpentMinutes === minutes ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => setTimeSpentMinutes(minutes)}
                    >
                      {minutes < 60 ? `${minutes}m` : `${minutes / 60}h`}
                    </Button>
                  ))}
                </div>
                <div className="flex items-center gap-2">
                  <Input
                    id="time-spent"
                    type="number"
                    min={1}
                    max={480}
                    placeholder="Or enter custom time"
                    value={timeSpentMinutes || ''}
                    onChange={(e) => {
                      const value = parseInt(e.target.value);
                      if (!isNaN(value) && validateTimeSpent(value)) {
                        setTimeSpentMinutes(value);
                      } else if (e.target.value === '') {
                        setTimeSpentMinutes(undefined);
                      }
                    }}
                    className="w-40"
                  />
                  <span className="text-sm text-muted-foreground">minutes</span>
                </div>
                {timeSpentMinutes && !validateTimeSpent(timeSpentMinutes) && (
                  <p className="text-xs text-destructive">
                    Time must be between 1 and 480 minutes
                  </p>
                )}
              </div>
            </div>

            {/* Advanced Metrics (Collapsible) */}
            <Collapsible open={showAdvanced} onOpenChange={setShowAdvanced}>
              <CollapsibleTrigger asChild>
                <Button variant="ghost" className="w-full justify-between">
                  <span className="text-sm font-medium">Additional Metrics (Optional)</span>
                  {showAdvanced ? (
                    <ChevronUp className="h-4 w-4" />
                  ) : (
                    <ChevronDown className="h-4 w-4" />
                  )}
                </Button>
              </CollapsibleTrigger>
              <CollapsibleContent className="space-y-4 pt-4">
                <div className="space-y-3">
                  <Label className="text-base font-medium">
                    Confidence Before Starting
                  </Label>
                  <ConfidenceRating
                    value={confidenceBefore}
                    onChange={setConfidenceBefore}
                    showLabel={true}
                  />
                </div>

                <div className="space-y-3">
                  <Label className="text-base font-medium">
                    Confidence After Completing
                  </Label>
                  <ConfidenceRating
                    value={confidenceAfter}
                    onChange={setConfidenceAfter}
                    showLabel={true}
                  />
                </div>
              </CollapsibleContent>
            </Collapsible>

            {/* Notes */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label htmlFor="notes" className="text-base font-medium">
                  Notes (optional)
                </Label>
                <span 
                  className={cn(
                    'text-xs',
                    getCharacterCount().remaining < 50 
                      ? 'text-destructive font-medium' 
                      : 'text-muted-foreground'
                  )}
                >
                  {getCharacterCount().remaining} characters remaining
                </span>
              </div>
              <Textarea
                id="notes"
                placeholder="Any thoughts, observations, or challenges you want to remember..."
                value={notes}
                onChange={(e) => {
                  if (e.target.value.length <= 500) {
                    setNotes(e.target.value);
                  }
                }}
                className="min-h-[100px] resize-none"
                maxLength={500}
              />
            </div>

            {/* Error Alert */}
            {error && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>Error</AlertTitle>
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            {/* Action Buttons */}
            <div className="flex flex-col gap-3 pt-4 border-t">
              <div className="flex gap-3">
                <Button 
                  variant="outline" 
                  onClick={handleClose}
                  disabled={isSubmitting}
                  className="flex-1"
                >
                  Cancel
                </Button>

                {onSkip && (
                  <Button
                    variant="ghost"
                    onClick={() => setShowSkipConfirmation(true)}
                    disabled={isSubmitting}
                    className="flex-1"
                  >
                    Skip Check-In
                  </Button>
                )}

                <Button
                  onClick={handleSubmit}
                  disabled={!isFormValid() || isSubmitting}
                  className="flex-1"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    'Complete Step'
                  )}
                </Button>
              </div>

              {!isFormValid() && (
                <p className="text-xs text-center text-muted-foreground">
                  Please complete quality rating and independence level to continue
                </p>
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Success State */}
      {showSuccess && (
        <div className="fixed inset-0 z-50 bg-background/80 backdrop-blur-sm flex items-center justify-center">
          <Card className="p-6 max-w-sm mx-4 text-center space-y-4 animate-scale-in">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto">
              <CheckCircle2 className="h-8 w-8 text-green-600" />
            </div>
            <div className="space-y-2">
              <h3 className="text-xl font-semibold">Step Complete! 🎉</h3>
              <p className="text-sm text-muted-foreground">
                Your progress has been recorded.
              </p>
            </div>
          </Card>
        </div>
      )}

      {/* Skip Confirmation Dialog */}
      <AlertDialog open={showSkipConfirmation} onOpenChange={setShowSkipConfirmation}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Skip Check-In?</AlertDialogTitle>
            <AlertDialogDescription>
              You can complete this step without recording detailed progress. 
              This will mark the step as done but won't save quality or independence data.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isSubmitting}>
              Go Back
            </AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleSkip}
              disabled={isSubmitting}
            >
              {isSubmitting ? 'Skipping...' : 'Skip & Complete'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};
