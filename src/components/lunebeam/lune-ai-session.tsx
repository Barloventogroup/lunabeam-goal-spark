// UPDATED: Comprehensive goal system integration
import React, { useState, useRef, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select';
import { 
  Bot, 
  User, 
  Send, 
  ArrowLeft
} from 'lucide-react';
import { useStore } from '@/store/useStore';
import { useToast } from '@/hooks/use-toast';
import { RoundBasedSuggestionEngine } from './round-based-suggestion-engine';
import { ComprehensiveGoalEngine } from './comprehensive-goal-engine';

interface Message {
  id: string;
  content: string;
  sender: 'user' | 'lune';
  timestamp: Date;
}

interface ExtractedGoal {
  title: string;
  description: string;
  category: string;
  steps: string[];
  timeEstimate: string;
}

interface LuneAISessionProps {
  category: string;
  onBack: () => void;
  onGoalCreated: (goal: ExtractedGoal) => void;
}

export const LuneAISession: React.FC<LuneAISessionProps> = ({ 
  category, 
  onBack, 
  onGoalCreated 
}) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [sessionPhase, setSessionPhase] = useState<'greeting' | 'suggestions' | 'followup' | 'summarizing' | 'refining' | 'refining_input' | 'complete' | 'comprehensive'>('comprehensive');
  const [selectedSuggestion, setSelectedSuggestion] = useState<any>(null);
  const [isCustomGoal, setIsCustomGoal] = useState(false);
  const [comprehensiveGoalData, setComprehensiveGoalData] = useState<any>(null);
  // Refinement state
  const [refineDuration, setRefineDuration] = useState<string>('10 min');
  const [refineFrequency, setRefineFrequency] = useState<string>('once');
  const [isDurationCustom, setIsDurationCustom] = useState(false);
  const [isFrequencyCustom, setIsFrequencyCustom] = useState(false);
  const [durationCustom, setDurationCustom] = useState<string>('');
  const [frequencyCustom, setFrequencyCustom] = useState<string>('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { profile } = useStore();
  const { toast } = useToast();

  const categoryNames = {
    health: 'Health & Well-Being',
    education: 'Education (High School / Academic Readiness)',
    employment: 'Employment', 
    independent_living: 'Independent Living',
    social_skills: 'Social Skills',
    housing: 'Housing',
    postsecondary: 'Postsecondary / Learning (After High School)'
  };

  useEffect(() => {
    // Only initialize once when component mounts
    if (messages.length === 0 && sessionPhase !== 'comprehensive') {
      const name = profile?.first_name || 'friend';
      const welcomeMessage: Message = {
        id: '1',
        content: `Hey ${name} 👋 Let's pick a quick goal for ${categoryNames[category as keyof typeof categoryNames]}!`,
        sender: 'lune',
        timestamp: new Date()
      };
      setMessages([welcomeMessage]);
      
      // Auto-advance to suggestions after a brief moment
      const timeoutId = setTimeout(() => {
        setSessionPhase('suggestions');
        const suggestionsMessage: Message = {
          id: '2',
          content: 'Here are some ideas to get started 🙂',
          sender: 'lune',
          timestamp: new Date()
        };
        setMessages(prev => [...prev, suggestionsMessage]);
      }, 1000);

      return () => clearTimeout(timeoutId);
    }
  }, [category, sessionPhase]); // Added sessionPhase dependency

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSuggestionSelected = (suggestion: any) => {
    setSelectedSuggestion(suggestion);
    setIsCustomGoal(false); // This is a suggested goal, not custom
    
    // Create goal directly with follow-up context
    const goalTitle = suggestion.followUpChoice 
      ? `${suggestion.text} - ${suggestion.followUpChoice}`
      : suggestion.text;
    
    const convertedGoal = {
      title: goalTitle,
      description: `A ${category} goal: ${suggestion.text}`,
      category: category,
      steps: [
        'Start with a small step',
        'Keep going at your pace', 
        'Celebrate your progress'
      ],
      timeEstimate: '15-30 minutes'
    };

    const summaryMessage: Message = {
      id: (Date.now() + 1).toString(),
      content: `Perfect! Here's your goal:

${convertedGoal.title}

Sound good?`,
      sender: 'lune',
      timestamp: new Date()
    };

    setMessages(prev => [...prev, summaryMessage]);
    setSessionPhase('summarizing');
    (window as any).pendingGoal = convertedGoal;
  };

  const handleComprehensiveGoalSelect = (goalData: any) => {
    // Create a detailed goal title with options and inputs
    let goalTitle = goalData.goal;
    
    if (goalData.selectedOption) {
      goalTitle += ` - ${goalData.selectedOption}`;
    }
    
    // Add custom inputs to the title
    const customInputValues = Object.values(goalData.customInputs || {}).filter(Boolean);
    if (customInputValues.length > 0) {
      goalTitle += ` (${customInputValues.join(', ')})`;
    }
    
    // Add follow-ups to the title  
    const followUpValues = Object.values(goalData.followUps || {}).filter(Boolean);
    if (followUpValues.length > 0) {
      goalTitle += ` • ${followUpValues.join(' • ')}`;
    }

    setComprehensiveGoalData(goalData);
    setIsCustomGoal(false);

    const convertedGoal = {
      title: goalTitle,
      description: `A ${category} goal: ${goalData.goal}`,
      category: category,
      steps: [
        'Start with a small step',
        'Keep going at your pace', 
        'Celebrate your progress'
      ],
      timeEstimate: '15-30 minutes'
    };

    onGoalCreated(convertedGoal);
  };

  const handleMetaAction = (action: 'new_ideas' | 'explain' | 'write_own' | 'pause' | 'exit') => {
    switch (action) {
      case 'new_ideas':
        setSessionPhase('suggestions');
        const newIdeasMessage: Message = {
          id: (Date.now() + 1).toString(),
          content: 'Sure! Let me show you some fresh ideas 🔄',
          sender: 'lune',
          timestamp: new Date()
        };
        setMessages(prev => [...prev, newIdeasMessage]);
        break;
      case 'write_own':
        setSessionPhase('complete');
        const writeOwnMessage: Message = {
          id: (Date.now() + 1).toString(),
          content: 'Perfect! What goal would you like to work on? ✏️',
          sender: 'lune',
          timestamp: new Date()
        };
        setMessages(prev => [...prev, writeOwnMessage]);
        break;
      case 'pause':
        const pauseMessage: Message = {
          id: (Date.now() + 1).toString(),
          content: 'All good 👍 Take your time. Come back whenever you feel ready 🌙',
          sender: 'lune',
          timestamp: new Date()
        };
        setMessages(prev => [...prev, pauseMessage]);
        setTimeout(() => onBack(), 2000);
        break;
      case 'exit':
        const exitMessage: Message = {
          id: (Date.now() + 1).toString(),
          content: 'All good 👍 We can stop here and try again later.',
          sender: 'lune',
          timestamp: new Date()
        };
        setMessages(prev => [...prev, exitMessage]);
        setTimeout(() => onBack(), 1500);
        break;
    }
  };

  const sendMessage = async () => {
    if (!input.trim() || isLoading) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      content: input.trim(),
      sender: 'user',
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');

    if (sessionPhase === 'complete') {
      // User is writing their own goal
      setIsCustomGoal(true);
      
      const convertedGoal = {
        title: input.trim(),
        description: `Custom ${category} goal`,
        category: category,
        steps: ['Start small', 'Keep going', 'Finish strong'],
        timeEstimate: '30 minutes'
      };

      const summaryMessage: Message = {
        id: (Date.now() + 1).toString(),
        content: `Love it! Here's your goal:

${convertedGoal.title}

Sound good?`,
        sender: 'lune',
        timestamp: new Date()
      };

      setMessages(prev => [...prev, summaryMessage]);
      setSessionPhase('summarizing');
      (window as any).pendingGoal = convertedGoal;
    } else if (sessionPhase === 'refining_input') {
      // Handle refinement input
      const userInput = input.trim().toLowerCase();
      
      if (userInput.includes("don't know") || userInput.includes("not sure") || userInput.includes("help")) {
        // Offer contextualized suggestions based on the goal
        const pendingGoal = (window as any).pendingGoal;
        const goalText = pendingGoal?.title || '';
        
        let suggestions = [];
        if (goalText.toLowerCase().includes('walk')) {
          suggestions = ['Make it shorter (5-10 minutes)', 'Make it daily', 'Add a specific time of day', 'Add a location preference'];
        } else if (goalText.toLowerCase().includes('read') || goalText.toLowerCase().includes('book')) {
          suggestions = ['Set number of pages', 'Choose a specific time', 'Make it daily', 'Pick a book genre'];
        } else if (goalText.toLowerCase().includes('exercise') || goalText.toLowerCase().includes('workout')) {
          suggestions = ['Shorter duration', 'Specific days of week', 'Add equipment needed', 'Set intensity level'];
        } else {
          suggestions = ['Change the duration', 'Adjust how often', 'Add a specific time', 'Make it more specific'];
        }
        
        const suggestionMessage: Message = {
          id: (Date.now() + 1).toString(),
          content: `No worries! Here are some ways you could refine "${goalText}":\n\n${suggestions.map((s, i) => `${i + 1}. ${s}`).join('\n')}\n\nJust tell me what you'd like to change! 😊`,
          sender: 'lune',
          timestamp: new Date()
        };
        
        setMessages(prev => [...prev, suggestionMessage]);
      } else {
        // Process the refinement request
        const pendingGoal = (window as any).pendingGoal;
        const refinementText = input.trim();
        
        const refinedGoal = {
          ...pendingGoal,
          title: `${pendingGoal.title} • ${refinementText}`,
          description: `${pendingGoal.description} (refined: ${refinementText})`
        };
        
        (window as any).pendingGoal = refinedGoal;
        
        const refinedMessage: Message = {
          id: (Date.now() + 1).toString(),
          content: `Perfect! Here's your refined goal:\n\n${refinedGoal.title}\n\nSound good?`,
          sender: 'lune',
          timestamp: new Date()
        };
        
        setMessages(prev => [...prev, refinedMessage]);
        setSessionPhase('summarizing');
      }
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const confirmGoal = () => {
    const pendingGoal = (window as any).pendingGoal;
    if (pendingGoal) {
      onGoalCreated(pendingGoal);
      delete (window as any).pendingGoal;
    }
  };

  const applyRefinements = () => {
    const pendingGoal = (window as any).pendingGoal;
    if (!pendingGoal) return;

    const duration = isDurationCustom ? durationCustom.trim() : refineDuration;
    const frequency = isFrequencyCustom ? frequencyCustom.trim() : refineFrequency;

    const parts: string[] = [];
    if (duration) parts.push(duration);
    if (frequency) parts.push(frequency);
    const suffix = parts.length ? ` • ${parts.join(' • ')}` : '';

    const refined = {
      ...pendingGoal,
      title: `${pendingGoal.title}${suffix}`,
      description: `${pendingGoal.description}${parts.length ? ` (duration: ${duration || 'n/a'}${frequency ? ', frequency: ' + frequency : ''})` : ''}`
    };

    (window as any).pendingGoal = refined;

    const refinedMsg: Message = {
      id: (Date.now() + 1).toString(),
      content: `Updated! Here's your refined goal:\n\n${refined.title}\n\nSound good?`,
      sender: 'lune',
      timestamp: new Date()
    };
    setMessages(prev => [...prev, refinedMsg]);
    setSessionPhase('summarizing');
  };

  // If comprehensive mode, render the engine directly
  if (sessionPhase === 'comprehensive') {
    return (
      <ComprehensiveGoalEngine
        category={category}
        onSelectGoal={handleComprehensiveGoalSelect}
        onBack={onBack}
      />
    );
  }

  return (
    <div className="min-h-screen bg-gradient-soft">
      <div className="max-w-md mx-auto h-screen flex flex-col">
        {/* Header */}
        <div className="flex items-center gap-4 p-4 border-b border-gray-200 bg-card/80 backdrop-blur">
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={onBack}
            className="p-2"
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div className="flex-1">
            <h1 className="text-xl font-bold">Lune</h1>
            <p className="text-sm text-muted-foreground">
              {categoryNames[category as keyof typeof categoryNames]}
            </p>
          </div>
          <Bot className="h-6 w-6 text-primary" />
        </div>

        {/* Messages */}
        <ScrollArea className="flex-1 p-4">
          <div className="space-y-4">
            {messages.map((message) => (
              <div
                key={message.id}
                className={`flex gap-3 ${
                  message.sender === 'user' ? 'justify-end' : 'justify-start'
                }`}
              >
                {message.sender === 'lune' && (
                  <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                    <Bot className="h-4 w-4 text-primary" />
                  </div>
                )}
                <div
                  className={`max-w-[80%] rounded-lg px-3 py-2 text-sm whitespace-pre-wrap ${
                    message.sender === 'user'
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-muted text-foreground'
                  }`}
                >
                  {message.content}
                </div>
                {message.sender === 'user' && (
                  <div className="flex-shrink-0 w-8 h-8 rounded-full bg-secondary flex items-center justify-center">
                    <User className="h-4 w-4 text-secondary-foreground" />
                  </div>
                )}
              </div>
            ))}
            {isLoading && (
              <div className="flex gap-3 justify-start">
                <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                  <Bot className="h-4 w-4 text-primary" />
                </div>
                <div className="bg-muted text-foreground rounded-lg px-3 py-2 text-sm">
                  Lune is thinking...
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>
        </ScrollArea>

        {/* Input/Actions */}
        <div className="p-4 border-t bg-card/80 backdrop-blur">
          {sessionPhase === 'suggestions' ? (
            <RoundBasedSuggestionEngine
              category={category}
              onSelectOption={handleSuggestionSelected}
              onMetaAction={handleMetaAction}
            />
          ) : sessionPhase === 'summarizing' ? (
            <div className="flex gap-2">
              {!isCustomGoal && (
                <Button 
                  variant="outline" 
                  onClick={() => {
                    const refineMessage: Message = {
                      id: (Date.now() + 1).toString(),
                      content: 'How do you want to refine this goal? 🎯',
                      sender: 'lune',
                      timestamp: new Date()
                    };
                    setMessages(prev => [...prev, refineMessage]);
                    setSessionPhase('refining_input');
                  }}
                  className="flex-1"
                >
                  Let me refine this
                </Button>
              )}
              <Button 
                onClick={confirmGoal}
                className={isCustomGoal ? "w-full" : "flex-1"}
              >
                Create Goal
              </Button>
            </div>
          ) : sessionPhase === 'refining' ? (
            <div className="space-y-3">
              <div>
                <p className="text-sm text-muted-foreground mb-2">Duration</p>
                <Select 
                  value={isDurationCustom ? 'custom' : refineDuration}
                  onValueChange={(v) => {
                    if (v === 'custom') { setIsDurationCustom(true); }
                    else { setIsDurationCustom(false); setRefineDuration(v); }
                  }}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Choose duration" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="5 min">5 min</SelectItem>
                    <SelectItem value="10 min">10 min</SelectItem>
                    <SelectItem value="15 min">15 min</SelectItem>
                    <SelectItem value="30 min">30 min</SelectItem>
                    <SelectItem value="custom">Custom...</SelectItem>
                  </SelectContent>
                </Select>
                {isDurationCustom && (
                  <Input 
                    className="mt-2" 
                    placeholder="e.g., 20 minutes" 
                    value={durationCustom}
                    onChange={(e) => setDurationCustom(e.target.value)}
                  />
                )}
              </div>

              <div>
                <p className="text-sm text-muted-foreground mb-2">Frequency</p>
                <Select 
                  value={isFrequencyCustom ? 'custom' : refineFrequency}
                  onValueChange={(v) => {
                    if (v === 'custom') { setIsFrequencyCustom(true); }
                    else { setIsFrequencyCustom(false); setRefineFrequency(v); }
                  }}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Choose frequency" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="once">Once</SelectItem>
                    <SelectItem value="daily">Daily</SelectItem>
                    <SelectItem value="3x/week">3x/week</SelectItem>
                    <SelectItem value="weekly">Weekly</SelectItem>
                    <SelectItem value="custom">Custom...</SelectItem>
                  </SelectContent>
                </Select>
                {isFrequencyCustom && (
                  <Input 
                    className="mt-2" 
                    placeholder="e.g., Mon/Wed/Fri" 
                    value={frequencyCustom}
                    onChange={(e) => setFrequencyCustom(e.target.value)}
                  />
                )}
              </div>

              <div className="flex gap-2 pt-1">
                <Button variant="outline" onClick={() => setSessionPhase('summarizing')} className="flex-1">
                  Cancel
                </Button>
                <Button onClick={applyRefinements} className="flex-1">
                  Apply refinements
                </Button>
              </div>
            </div>
          ) : sessionPhase === 'complete' || sessionPhase === 'refining_input' ? (
            <div className="flex gap-2">
              <Input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder={sessionPhase === 'refining_input' ? "Tell me how to refine it..." : "Tell me your goal idea..."}
                disabled={isLoading}
                className="flex-1"
              />
              <Button 
                onClick={sendMessage} 
                disabled={!input.trim() || isLoading}
                size="icon"
              >
                <Send className="h-4 w-4" />
              </Button>
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
};