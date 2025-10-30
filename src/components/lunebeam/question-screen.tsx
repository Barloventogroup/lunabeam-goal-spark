import React, { useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Checkbox } from '@/components/ui/checkbox';
import { ArrowLeft, ArrowRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Progress } from '@/components/ui/progress';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
interface QuestionOption {
  value: string | number;
  label: string;
  icon?: string;
  avatar?: string;
  description?: string;
}
interface QuestionScreenProps {
  // Progress tracking
  currentStep: number;
  totalSteps: number;

  // Content
  goalTitle?: string;
  goalContext?: string; // e.g., "Starting Level: Developing 🌳"
  questionIcon?: string;
  questionText: string;
  helpText?: string;

  // Input configuration
  inputType: 'textarea' | 'radio' | 'checkbox' | 'yesno' | 'custom';
  options?: QuestionOption[];

  // State management
  value?: any;
  onChange?: (value: any) => void;

  // Navigation
  onBack: () => void;
  onContinue: () => void;
  onSkip?: () => void;

  // Validation
  required?: boolean;
  continueDisabled?: boolean;

  // Conditional expansion
  expandOnValue?: any;
  expandedContent?: React.ReactNode;

  // Custom rendering
  customContent?: React.ReactNode;
  children?: React.ReactNode;

  // Embedded mode (hide header/footer for parent-controlled navigation)
  hideHeader?: boolean;
  hideFooter?: boolean;
}
export const QuestionScreen: React.FC<QuestionScreenProps> = ({
  currentStep,
  totalSteps,
  goalTitle,
  goalContext,
  questionIcon,
  questionText,
  helpText,
  inputType,
  options = [],
  value,
  onChange,
  onBack,
  onContinue,
  onSkip,
  required = false,
  continueDisabled = false,
  expandOnValue,
  expandedContent,
  customContent,
  children,
  hideHeader = false,
  hideFooter = false
}) => {
  const firstInputRef = useRef<HTMLTextAreaElement>(null);
  const percentage = currentStep / totalSteps * 100;
  const isContinueDisabled = continueDisabled || (required && !value);

  // Auto-focus first input on mount
  useEffect(() => {
    if (inputType === 'textarea' && firstInputRef.current) {
      setTimeout(() => {
        firstInputRef.current?.focus();
      }, 100);
    }
  }, [inputType]);

  // Keyboard support
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Enter' && !isContinueDisabled && inputType !== 'textarea') {
        e.preventDefault();
        onContinue();
      } else if (e.key === 'Escape') {
        e.preventDefault();
        onBack();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isContinueDisabled, inputType, onBack, onContinue]);
  const renderInput = () => {
    if (customContent) {
      return customContent;
    }
    if (inputType === 'custom' && children) {
      return children;
    }
    switch (inputType) {
      case 'textarea':
        return <Textarea ref={firstInputRef} value={value || ''} onChange={e => onChange(e.target.value)} rows={4} className="text-lg resize-none" placeholder="Start typing..." />;
      case 'radio':
        return <RadioGroup value={String(value || '')} onValueChange={onChange}>
            <div className="space-y-3">
              {options.map(option => <div key={String(option.value)} className="relative">
                  <RadioGroupItem value={String(option.value)} id={String(option.value)} className="peer sr-only" />
                  <Label htmlFor={String(option.value)} className={cn('flex items-start gap-3 p-4 rounded-lg cursor-pointer transition-all shadow-md', 'hover:shadow-lg hover:bg-accent/50', 'peer-data-[state=checked]:bg-primary/5', 'peer-focus-visible:ring-2 peer-focus-visible:ring-primary')}>
                    {option.avatar && <Avatar className="h-8 w-8 flex-shrink-0">
                        <AvatarImage src={option.avatar} />
                        <AvatarFallback>{option.label[0]}</AvatarFallback>
                      </Avatar>}
                    {option.icon && !option.avatar && <span className="text-2xl flex-shrink-0 mt-0.5">{option.icon}</span>}
                    <div className="flex-1 min-w-0">
                      <div className="font-medium text-base">{option.label}</div>
                      {option.description && <p className="text-sm text-muted-foreground mt-1">
                          {option.description}
                        </p>}
                    </div>
                  </Label>
                </div>)}
            </div>
          </RadioGroup>;
      case 'yesno':
        return <>
            <RadioGroup value={String(value || '')} onValueChange={onChange}>
              <div className="space-y-3">
                {options.map(option => <div key={String(option.value)} className="relative">
                    <RadioGroupItem value={String(option.value)} id={String(option.value)} className="peer sr-only" />
                    <Label htmlFor={String(option.value)} className={cn('flex items-start gap-3 p-4 rounded-lg cursor-pointer transition-all shadow-md', 'hover:shadow-lg hover:bg-accent/50', 'peer-data-[state=checked]:bg-primary/5', 'peer-focus-visible:ring-2 peer-focus-visible:ring-primary')}>
                      {option.avatar && <Avatar className="h-8 w-8 flex-shrink-0">
                          <AvatarImage src={option.avatar} />
                          <AvatarFallback>{option.label[0]}</AvatarFallback>
                        </Avatar>}
                      {option.icon && !option.avatar && <span className="text-2xl flex-shrink-0 mt-0.5">{option.icon}</span>}
                      <div className="flex-1 min-w-0">
                        <div className="font-medium text-base">{option.label}</div>
                        {option.description && <p className="text-sm text-muted-foreground mt-1">
                            {option.description}
                          </p>}
                      </div>
                    </Label>
                  </div>)}
              </div>
            </RadioGroup>
            {expandOnValue !== undefined && value === expandOnValue && expandedContent && <div className="mt-4 animate-in slide-in-from-top-2 duration-300">
                {expandedContent}
              </div>}
          </>;
      case 'checkbox':
        return <div className="space-y-3">
            {options.map(option => <div key={String(option.value)} className="relative">
                <div className={cn('flex items-start gap-3 p-4 rounded-lg cursor-pointer transition-all shadow-md', 'hover:shadow-lg hover:bg-accent/50', Array.isArray(value) && value.includes(option.value) ? 'bg-primary/5' : '')} onClick={() => {
              const currentValues = Array.isArray(value) ? value : [];
              const newValues = currentValues.includes(option.value) ? currentValues.filter(v => v !== option.value) : [...currentValues, option.value];
              onChange(newValues);
            }}>
                  <Checkbox checked={Array.isArray(value) && value.includes(option.value)} onCheckedChange={() => {}} className="mt-1" />
                  {option.icon && <span className="text-xl flex-shrink-0">{option.icon}</span>}
                  <div className="flex-1 min-w-0">
                    <div className="font-medium text-base">{option.label}</div>
                    {option.description && <p className="text-sm text-muted-foreground mt-1">
                        {option.description}
                      </p>}
                  </div>
                </div>
              </div>)}
          </div>;
      default:
        return null;
    }
  };
  return <div className="min-h-[100dvh] bg-background flex flex-col animate-fade-in">
      {/* Header with Progress */}
      {!hideHeader && <div className="sticky top-safe bg-background border-b z-10 p-4">
          <div className="max-w-3xl mx-auto">
            <div className="flex items-center justify-between mb-3">
              <Button variant="ghost" size="sm" onClick={onBack} className="gap-2">
                <ArrowLeft className="h-4 w-4" />
                Back
              </Button>
              <div className="text-sm text-muted-foreground">
                Step {currentStep} of {totalSteps}
              </div>
            </div>
            <Progress value={percentage} className="h-2" />
          </div>
        </div>}

      {/* Main Content - Top Aligned */}
      <div className="flex-1 px-6 pt-6 pb-0 overflow-auto">
        <div className="max-w-2xl mx-auto w-full space-y-4">
          {/* Goal Context */}
          {(goalTitle || goalContext) && <div className="text-left space-y-1">
              {goalTitle && <h2 className="text-xl font-semibold">{goalTitle}</h2>}
              {goalContext && <p className="text-sm text-muted-foreground">{goalContext}</p>}
            </div>}

          {/* Question */}
          <div className="text-left">
          <h1 className="text-2xl md:text-3xl font-bold flex items-center gap-2 flex-wrap">
            <span>{questionText}</span>
          </h1>
          </div>

          {/* Help Text */}
          {helpText && (
            <div className="text-base text-muted-foreground">
              {helpText}
            </div>
          )}

          {/* Input */}
          <div className="space-y-4">
            {renderInput()}
          </div>
        </div>
      </div>

      {/* Footer Navigation */}
      {!hideFooter && <div className="sticky bottom-0 bg-background border-t p-6">
          <div className="max-w-3xl mx-auto flex justify-between items-center">
            {onSkip ? <Button variant="ghost" onClick={onSkip}>
                Skip for now
              </Button> : <div />}

            <Button size="lg" onClick={onContinue} disabled={isContinueDisabled} className="gap-2">
              Continue
              <ArrowRight className="h-4 w-4" />
            </Button>
          </div>
        </div>}
    </div>;
};