import React, { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Calendar as CalendarComponent } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { TimePicker } from '@/components/ui/time-picker';
import { ArrowLeft, Send, Calendar, Clock, Bot, User, CheckCircle } from 'lucide-react';
import { GoalFlow } from '@/data/comprehensive-goals';
import { DateRange } from 'react-day-picker';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';

interface Message {
  id: string;
  type: 'bot' | 'user';
  content: string;
  timestamp: Date;
  options?: string[];
  customInputEnabled?: boolean;
  inputType?: 'text' | 'date' | 'time' | 'days_per_week';
  inputLabel?: string;
  stepData?: any;
}

interface GoalWizardChatProps {
  goal: GoalFlow;
  onComplete: (data: {
    goal: string;
    selectedOption?: string;
    customInputs?: Record<string, string>;
    followUps?: Record<string, string>;
    dateRange?: DateRange;
    times?: Record<string, string>;
    startDate?: Date;
    scaffoldingLevel?: 'simple' | 'detailed';
  }) => void;
  onBack: () => void;
}

interface WizardData {
  selectedOption?: string;
  customValue?: string;
  customInputs: Record<string, string>;
  followUps: Record<string, string>;
  dateRange?: DateRange;
  times: Record<string, string>;
  startDate?: Date;
  scaffoldingLevel?: 'simple' | 'detailed';
}

export const GoalWizardChat: React.FC<GoalWizardChatProps> = ({
  goal,
  onComplete,
  onBack
}) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [wizardData, setWizardData] = useState<WizardData>({
    customInputs: {},
    followUps: {},
    times: {}
  });
  const [currentInput, setCurrentInput] = useState('');
  const [currentStep, setCurrentStep] = useState(0);
  const [isWaitingForInput, setIsWaitingForInput] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date>();
  const [selectedTime, setSelectedTime] = useState<string>('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Build conversation flow based on goal structure
  const buildConversationFlow = () => {
    const flow = [];
    
    // Welcome message
    flow.push({
      type: 'bot',
      content: `Great choice! Let's set up your "${goal.goal}" goal together. I'll guide you through each step to make sure it's perfect for you. 🎯`,
      options: [],
      customInputEnabled: false
    });

    // Options step
    if (goal.options) {
      flow.push({
        type: 'bot',
        content: `To get started, what sounds like the best approach for you?`,
        options: [...goal.options, 'Custom'],
        customInputEnabled: true,
        stepData: { type: 'options', data: goal.options }
      });
    }

    // Custom inputs
    if (goal.custom_inputs) {
      goal.custom_inputs.forEach(input => {
        flow.push({
          type: 'bot',
          content: `Perfect! Now, could you tell me ${input.toLowerCase()}?`,
          options: [],
          customInputEnabled: true,
          inputType: 'text',
          inputLabel: input,
          stepData: { type: 'custom_input', data: input }
        });
      });
    }

    // Follow-ups
    if (goal.follow_ups) {
      goal.follow_ups.forEach(followUp => {
        if (followUp === 'Start date') {
          flow.push({
            type: 'bot',
            content: `Excellent! When would you like to start this goal? Pick a date that feels right for you.`,
            options: [],
            customInputEnabled: false,
            inputType: 'date',
            inputLabel: 'Start date',
            stepData: { type: 'start_date', data: followUp }
          });
        } else if (followUp === 'Days per week') {
          flow.push({
            type: 'bot',
            content: `That's a solid choice! How many days per week would you like to work on this? Choose what feels manageable for you.`,
            options: ['1', '2', '3', '4', '5', '6', '7'],
            customInputEnabled: false,
            inputType: 'days_per_week',
            stepData: { type: 'days_per_week', data: followUp }
          });
        } else if (followUp === 'Bedtime' || followUp === 'Wake time') {
          flow.push({
            type: 'bot',
            content: `Great progress! What time works best for your ${followUp.toLowerCase()}?`,
            options: [],
            customInputEnabled: false,
            inputType: 'time',
            inputLabel: followUp,
            stepData: { type: 'time', data: followUp }
          });
        } else {
          flow.push({
            type: 'bot',
            content: `Awesome! One more thing - ${followUp.toLowerCase()}?`,
            options: [],
            customInputEnabled: true,
            inputType: 'text',
            inputLabel: followUp,
            stepData: { type: 'follow_up', data: followUp }
          });
        }
      });
    }

    // Scaffolding question
    flow.push({
      type: 'bot',
      content: `You're doing great! Before we finalize your plan, would you like me to break this goal into smaller, easier steps for you, or do you prefer a simple milestone to reach?`,
      options: ['Break it down into detailed steps', 'Keep it simple with main milestones'],
      customInputEnabled: false,
      stepData: { type: 'scaffolding', data: 'scaffoldingLevel' }
    });

    // Final confirmation
    flow.push({
      type: 'bot',
      content: `Perfect! Let me show you what your plan will look like. Does this feel right to you?`,
      options: ['Yes, create this goal!', 'Let me adjust something'],
      customInputEnabled: false,
      stepData: { type: 'confirmation', data: 'final' }
    });

    return flow;
  };

  const conversationFlow = buildConversationFlow();

  useEffect(() => {
    // Start the conversation
    if (messages.length === 0) {
      addBotMessage(conversationFlow[0]);
    }
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const addBotMessage = (flowStep: any) => {
    const newMessage: Message = {
      id: Date.now().toString(),
      type: 'bot',
      content: flowStep.content,
      timestamp: new Date(),
      options: flowStep.options || [],
      customInputEnabled: flowStep.customInputEnabled || false,
      inputType: flowStep.inputType,
      inputLabel: flowStep.inputLabel,
      stepData: flowStep.stepData
    };

    setMessages(prev => [...prev, newMessage]);
    setIsWaitingForInput(true);
  };

  const addUserMessage = (content: string) => {
    const newMessage: Message = {
      id: Date.now().toString(),
      type: 'user',
      content,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, newMessage]);
  };

  const getEncouragingResponse = () => {
    const responses = [
      "Great choice! 💪",
      "That's a solid step! ✨",
      "You're making progress already! 🌟",
      "Perfect! 👏",
      "Excellent decision! 🎉",
      "That sounds wonderful! 😊"
    ];
    return responses[Math.floor(Math.random() * responses.length)];
  };

  const handleUserResponse = (response: string, inputType?: string) => {
    addUserMessage(response);
    setIsWaitingForInput(false);

    // Add encouraging response
    const encouragement: Message = {
      id: (Date.now() + 1).toString(),
      type: 'bot',
      content: getEncouragingResponse(),
      timestamp: new Date()
    };
    
    setTimeout(() => {
      setMessages(prev => [...prev, encouragement]);
      
      // Process the response and move to next step
      setTimeout(() => {
        processUserResponse(response, inputType);
      }, 800);
    }, 500);
  };

  const processUserResponse = (response: string, inputType?: string) => {
    const currentFlowStep = conversationFlow[currentStep];
    const stepData = currentFlowStep?.stepData;

    if (stepData) {
      switch (stepData.type) {
        case 'options':
          if (response === 'Custom') {
            // Handle custom input inline
            setIsWaitingForInput(true);
            return;
          }
          setWizardData(prev => ({ ...prev, selectedOption: response }));
          break;
          
        case 'custom_input':
          setWizardData(prev => ({
            ...prev,
            customInputs: { ...prev.customInputs, [stepData.data]: response }
          }));
          break;
          
        case 'follow_up':
          setWizardData(prev => ({
            ...prev,
            followUps: { ...prev.followUps, [stepData.data]: response }
          }));
          break;
          
        case 'days_per_week':
          setWizardData(prev => ({
            ...prev,
            followUps: { ...prev.followUps, [stepData.data]: response }
          }));
          break;
          
        case 'scaffolding':
          const level = response.includes('detailed') ? 'detailed' : 'simple';
          setWizardData(prev => ({ ...prev, scaffoldingLevel: level }));
          break;
          
        case 'confirmation':
          if (response.includes('Yes')) {
            // Complete the goal
            onComplete({
              goal: goal.goal,
              selectedOption: wizardData.selectedOption,
              customInputs: wizardData.customInputs,
              followUps: wizardData.followUps,
              dateRange: wizardData.dateRange,
              times: wizardData.times,
              startDate: wizardData.startDate,
              scaffoldingLevel: wizardData.scaffoldingLevel
            });
            return;
          } else {
            // Go back to adjust
            setCurrentStep(Math.max(0, currentStep - 2));
            setTimeout(() => {
              addBotMessage(conversationFlow[currentStep - 1]);
            }, 1000);
            return;
          }
      }
    }

    // Move to next step
    const nextStep = currentStep + 1;
    if (nextStep < conversationFlow.length) {
      setCurrentStep(nextStep);
      setTimeout(() => {
        addBotMessage(conversationFlow[nextStep]);
      }, 1000);
    }
  };

  const handleDateSelect = (date: Date | undefined) => {
    if (date) {
      setSelectedDate(date);
      setWizardData(prev => ({ ...prev, startDate: date }));
      handleUserResponse(format(date, 'PPP'), 'date');
    }
  };

  const handleTimeSelect = (time: string) => {
    setSelectedTime(time);
    const currentFlowStep = conversationFlow[currentStep];
    const stepData = currentFlowStep?.stepData;
    
    if (stepData) {
      setWizardData(prev => ({
        ...prev,
        times: { ...prev.times, [stepData.data]: time }
      }));
      handleUserResponse(time, 'time');
    }
  };

  const handleSendMessage = () => {
    if (currentInput.trim()) {
      handleUserResponse(currentInput.trim());
      setCurrentInput('');
    }
  };

  const getCurrentMessage = () => {
    return messages[messages.length - 1];
  };

  const currentMessage = getCurrentMessage();
  const showDatePicker = currentMessage?.inputType === 'date' && isWaitingForInput;
  const showTimePicker = currentMessage?.inputType === 'time' && isWaitingForInput;
  const showOptionsButtons = currentMessage?.options && currentMessage.options.length > 0 && isWaitingForInput;
  const showTextInput = currentMessage?.customInputEnabled && isWaitingForInput && !showDatePicker && !showTimePicker;

  return (
    <div className="min-h-screen bg-gradient-soft p-4">
      <div className="max-w-md mx-auto py-6">
        {/* Header */}
        <div className="flex items-center gap-4 mb-6">
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={onBack}
            className="p-2"
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div className="flex-1">
            <h1 className="text-xl font-bold text-foreground">Goal Setup</h1>
            <p className="text-sm text-foreground-soft">Let's create your perfect goal</p>
          </div>
        </div>

        {/* Chat Messages */}
        <div className="space-y-4 mb-6 max-h-96 overflow-y-auto">
          {messages.map((message) => (
            <div
              key={message.id}
              className={cn(
                "flex gap-3",
                message.type === 'user' ? 'justify-end' : 'justify-start'
              )}
            >
              {message.type === 'bot' && (
                <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                  <Bot className="h-4 w-4 text-primary" />
                </div>
              )}
              <div
                className={cn(
                  "max-w-[80%] rounded-2xl px-4 py-2",
                  message.type === 'user'
                    ? 'bg-primary text-primary-foreground ml-auto'
                    : 'bg-background border'
                )}
              >
                <p className="text-sm">{message.content}</p>
              </div>
              {message.type === 'user' && (
                <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary flex items-center justify-center">
                  <User className="h-4 w-4 text-primary-foreground" />
                </div>
              )}
            </div>
          ))}
          <div ref={messagesEndRef} />
        </div>

        {/* Input Area */}
        <Card>
          <CardContent className="p-4">
            {/* Option Buttons */}
            {showOptionsButtons && (
              <div className="space-y-2 mb-4">
                {currentMessage.options!.map((option, index) => (
                  <Button
                    key={index}
                    variant="outline"
                    className="w-full text-left justify-start h-auto p-3"
                    onClick={() => handleUserResponse(option)}
                  >
                    <span>{option}</span>
                  </Button>
                ))}
              </div>
            )}

            {/* Date Picker */}
            {showDatePicker && (
              <div className="space-y-3">
                <p className="text-sm font-medium">{currentMessage.inputLabel}</p>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        "w-full justify-start text-left font-normal",
                        !selectedDate && "text-muted-foreground"
                      )}
                    >
                      <Calendar className="mr-2 h-4 w-4" />
                      {selectedDate ? format(selectedDate, "PPP") : <span>Pick a date</span>}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <CalendarComponent
                      mode="single"
                      selected={selectedDate}
                      onSelect={handleDateSelect}
                      disabled={(date) => date < new Date(new Date().setHours(0, 0, 0, 0))}
                      initialFocus
                      className="p-3 pointer-events-auto"
                    />
                  </PopoverContent>
                </Popover>
              </div>
            )}

            {/* Time Picker */}
            {showTimePicker && (
              <div className="space-y-3">
                <TimePicker
                  time={selectedTime}
                  onTimeChange={handleTimeSelect}
                  label={currentMessage.inputLabel}
                />
              </div>
            )}

            {/* Text Input */}
            {showTextInput && (
              <div className="flex gap-2">
                <Input
                  value={currentInput}
                  onChange={(e) => setCurrentInput(e.target.value)}
                  placeholder={`Type your ${currentMessage.inputLabel?.toLowerCase() || 'response'}...`}
                  onKeyPress={(e) => {
                    if (e.key === 'Enter') {
                      handleSendMessage();
                    }
                  }}
                  className="flex-1"
                />
                <Button 
                  onClick={handleSendMessage}
                  disabled={!currentInput.trim()}
                  size="sm"
                  className="px-3"
                >
                  <Send className="h-4 w-4" />
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};