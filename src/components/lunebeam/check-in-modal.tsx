import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Checkbox } from '@/components/ui/checkbox';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Clock, Calendar, AlertCircle, CheckCircle2 } from 'lucide-react';
import type { CheckInPrompt, CheckInResponse, CheckInFeedback } from '@/services/checkInService';
import { useToast } from '@/hooks/use-toast';
import { cleanStepTitle } from '@/utils/stepUtils';

interface CheckInModalProps {
  prompt: CheckInPrompt | null;
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (response: CheckInResponse) => Promise<{ feedback: CheckInFeedback }>;
  onRequestExtension?: (prompt: CheckInPrompt) => void;
}

export const CheckInModal: React.FC<CheckInModalProps> = ({
  prompt,
  isOpen,
  onClose,
  onSubmit,
  onRequestExtension
}) => {
  const [completed, setCompleted] = useState(false);
  const [confidence, setConfidence] = useState(3);
  const [blockers, setBlockers] = useState('');
  const [needsHelp, setNeedsHelp] = useState(false);
  const [reflection, setReflection] = useState('');
  const [minutesSpent, setMinutesSpent] = useState<number>();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [feedback, setFeedback] = useState<CheckInFeedback | null>(null);
  const [showFeedback, setShowFeedback] = useState(false);
  const { toast } = useToast();

  if (!prompt) return null;

  const handleSubmit = async () => {
    if (isSubmitting) return;

    setIsSubmitting(true);
    try {
      const response: CheckInResponse = {
        stepId: prompt.step.id,
        completed,
        confidence,
        blockers: blockers.trim() || undefined,
        needsHelp,
        reflection: reflection.trim() || undefined,
        minutesSpent
      };

      const result = await onSubmit(response);
      setFeedback(result.feedback);
      setShowFeedback(true);

      toast({
        title: completed ? "Step completed! 🎉" : "Check-in recorded",
        description: completed 
          ? "Great work! Your progress has been updated." 
          : "Thanks for the update. We're here to support you."
      });
    } catch (error) {
      console.error('Failed to submit check-in:', error);
      toast({
        title: 'Check-in failed',
        description: 'Please try again in a moment.',
        variant: 'destructive'
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    setCompleted(false);
    setConfidence(3);
    setBlockers('');
    setNeedsHelp(false);
    setReflection('');
    setMinutesSpent(undefined);
    setShowFeedback(false);
    setFeedback(null);
    onClose();
  };

  const confidenceLabels = {
    1: "Very stuck",
    2: "Struggling",
    3: "Making progress",
    4: "Going well",
    5: "Crushing it"
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        {!showFeedback ? (
          <>
            <DialogHeader>
              <div className="flex items-center gap-2">
                <Calendar className="h-5 w-5 text-primary" />
                <DialogTitle>How's this step going?</DialogTitle>
              </div>
              <DialogDescription>
                Let's check in on your progress and see how we can support you.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-6">
              {/* Step Overview */}
              <Card>
                <CardContent className="pt-4">
                  <div className="space-y-3">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <h3 className="font-medium text-foreground">{cleanStepTitle(prompt.step.title)}</h3>
                        <p className="text-sm text-muted-foreground mt-1">
                          {prompt.goal.title}
                        </p>
                      </div>
                      <div className="flex flex-col items-end gap-2">
                        {prompt.isUrgent && (
                          <Badge variant="destructive" className="text-xs">
                            <AlertCircle className="h-3 w-3 mr-1" />
                            Overdue
                          </Badge>
                        )}
                        <div className="flex items-center gap-1 text-xs text-muted-foreground">
                          <Clock className="h-3 w-3" />
                          {prompt.daysPastDue} days ago
                        </div>
                      </div>
                    </div>
                    {prompt.step.explainer && (
                      <p className="text-sm text-muted-foreground bg-muted/50 p-3 rounded-lg">
                        {prompt.step.explainer}
                      </p>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Completion Status */}
              <div className="space-y-3">
                <Label className="text-base font-medium">Did you complete this step?</Label>
                <div className="flex gap-3">
                  <Button
                    variant={completed ? "default" : "outline"}
                    onClick={() => setCompleted(true)}
                    className="flex-1"
                  >
                    <CheckCircle2 className="h-4 w-4 mr-2" />
                    Yes, completed
                  </Button>
                  <Button
                    variant={!completed ? "default" : "outline"}
                    onClick={() => setCompleted(false)}
                    className="flex-1"
                  >
                    Still working on it
                  </Button>
                </div>
                
                {!completed && (
                  <div className="mt-3 p-3 bg-muted/50 rounded-lg">
                    <Button
                      type="button"
                      variant="ghost"
                      onClick={() => {
                        onRequestExtension?.(prompt);
                        handleClose();
                      }}
                      className="w-full text-sm"
                    >
                      🕒 I need more time - adjust my schedule
                    </Button>
                  </div>
                )}
              </div>

              {/* Confidence Level */}
              <div className="space-y-3">
                <Label className="text-base font-medium">
                  How confident do you feel about {completed ? 'what you accomplished' : 'tackling this step'}?
                </Label>
                <RadioGroup
                  value={confidence.toString()}
                  onValueChange={(value) => setConfidence(parseInt(value))}
                  className="grid grid-cols-5 gap-2"
                >
                  {[1, 2, 3, 4, 5].map((level) => (
                    <div key={level} className="text-center">
                      <RadioGroupItem
                        value={level.toString()}
                        id={`confidence-${level}`}
                        className="sr-only"
                      />
                      <Label
                        htmlFor={`confidence-${level}`}
                        className={`block p-3 rounded-lg cursor-pointer transition-colors text-xs ${
                          confidence === level
                            ? 'bg-primary text-primary-foreground'
                            : 'bg-muted hover:bg-muted/80'
                        }`}
                      >
                        <div className="font-medium">{level}</div>
                        <div className="mt-1">{confidenceLabels[level as keyof typeof confidenceLabels]}</div>
                      </Label>
                    </div>
                  ))}
                </RadioGroup>
              </div>

              {/* Time Spent */}
              <div className="space-y-3">
                <Label htmlFor="time-spent" className="text-base font-medium">
                  About how much time did you spend on this? (optional)
                </Label>
                <div className="flex gap-2">
                  {[5, 15, 30, 60, 120].map((minutes) => (
                    <Button
                      key={minutes}
                      variant={minutesSpent === minutes ? "default" : "outline"}
                      size="sm"
                      onClick={() => setMinutesSpent(minutes)}
                    >
                      {minutes < 60 ? `${minutes}m` : `${minutes / 60}h`}
                    </Button>
                  ))}
                </div>
              </div>

              {/* Blockers */}
              {!completed && (
                <div className="space-y-3">
                  <Label htmlFor="blockers" className="text-base font-medium">
                    What's making this step challenging? (optional)
                  </Label>
                  <Textarea
                    id="blockers"
                    placeholder="Describe any obstacles, confusion, or challenges you're facing..."
                    value={blockers}
                    onChange={(e) => setBlockers(e.target.value)}
                    className="min-h-[80px]"
                  />
                </div>
              )}

              {/* Help Request */}
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="needs-help"
                  checked={needsHelp}
                  onCheckedChange={(checked) => setNeedsHelp(checked === true)}
                />
                <Label htmlFor="needs-help" className="text-sm">
                  I'd like personalized guidance on this step
                </Label>
              </div>

              {/* Reflection */}
              <div className="space-y-3">
                <Label htmlFor="reflection" className="text-base font-medium">
                  Any other thoughts or observations? (optional)
                </Label>
                <Textarea
                  id="reflection"
                  placeholder="What did you learn? How are you feeling? What would help you move forward?"
                  value={reflection}
                  onChange={(e) => setReflection(e.target.value)}
                  className="min-h-[80px]"
                />
              </div>

              {/* Submit */}
              <div className="flex gap-3 pt-4">
                <Button variant="outline" onClick={handleClose} className="flex-1">
                  Skip for now
                </Button>
                <Button onClick={handleSubmit} disabled={isSubmitting} className="flex-1">
                  {isSubmitting ? 'Recording...' : 'Submit Check-in'}
                </Button>
              </div>
            </div>
          </>
        ) : (
          <>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <CheckCircle2 className="h-5 w-5 text-green-600" />
                Thanks for checking in!
              </DialogTitle>
            </DialogHeader>

            <div className="space-y-4">
              {feedback && (
                <Card>
                  <CardContent className="pt-4">
                    <div className="space-y-4">
                      <p className="text-foreground">{feedback.encouragement}</p>
                      
                      {feedback.suggestions.length > 0 && (
                        <div>
                          <h4 className="font-medium text-sm text-foreground mb-2">Suggestions:</h4>
                          <ul className="space-y-1 text-sm text-muted-foreground">
                            {feedback.suggestions.map((suggestion, index) => (
                              <li key={index} className="flex items-start gap-2">
                                <span className="text-primary mt-1">•</span>
                                <span>{suggestion}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                      
                      {feedback.nextSteps.length > 0 && (
                        <div>
                          <h4 className="font-medium text-sm text-foreground mb-2">Next steps:</h4>
                          <ul className="space-y-1 text-sm text-muted-foreground">
                            {feedback.nextSteps.map((step, index) => (
                              <li key={index} className="flex items-start gap-2">
                                <span className="text-primary mt-1">•</span>
                                <span>{step}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              )}

              <Button onClick={handleClose} className="w-full">
                Continue
              </Button>
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
};