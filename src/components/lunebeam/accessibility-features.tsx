import React, { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Mic, MicOff, Volume2, VolumeX, Users, User, Star, Zap, Award } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface AccessibilityPanelProps {
  isVoiceInputEnabled: boolean;
  onVoiceInputToggle: (enabled: boolean) => void;
  isTextToSpeechEnabled: boolean;
  onTextToSpeechToggle: (enabled: boolean) => void;
  isPeerModeEnabled: boolean;
  onPeerModeToggle: (enabled: boolean) => void;
  onStartVoiceInput: () => void;
  isListening: boolean;
}

export const AccessibilityPanel: React.FC<AccessibilityPanelProps> = ({
  isVoiceInputEnabled,
  onVoiceInputToggle,
  isTextToSpeechEnabled,
  onTextToSpeechToggle,
  isPeerModeEnabled,
  onPeerModeToggle,
  onStartVoiceInput,
  isListening
}) => {
  return (
    <Card className="bg-muted/30 border-dashed">
      <CardContent className="p-4 space-y-3">
        <div className="text-sm font-medium text-foreground mb-2">Accessibility Options</div>
        
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Mic className="h-4 w-4" />
            <span className="text-sm">Voice Input</span>
          </div>
          <div className="flex items-center gap-2">
            <Switch 
              checked={isVoiceInputEnabled} 
              onCheckedChange={onVoiceInputToggle}
            />
            {isVoiceInputEnabled && (
              <Button
                size="sm"
                variant={isListening ? "default" : "outline"}
                onClick={onStartVoiceInput}
                className="p-2"
              >
                {isListening ? <MicOff className="h-3 w-3" /> : <Mic className="h-3 w-3" />}
              </Button>
            )}
          </div>
        </div>

        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Volume2 className="h-4 w-4" />
            <span className="text-sm">Text-to-Speech</span>
          </div>
          <Switch 
            checked={isTextToSpeechEnabled} 
            onCheckedChange={onTextToSpeechToggle}
          />
        </div>

        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            {isPeerModeEnabled ? <Users className="h-4 w-4" /> : <User className="h-4 w-4" />}
            <span className="text-sm">Do with someone</span>
          </div>
          <Switch 
            checked={isPeerModeEnabled} 
            onCheckedChange={onPeerModeToggle}
          />
        </div>
      </CardContent>
    </Card>
  );
};

interface ReEngagementPanelProps {
  currentStreak: number;
  earnedBadges: string[];
  reminderEnabled: boolean;
  onReminderToggle: (enabled: boolean) => void;
}

export const ReEngagementPanel: React.FC<ReEngagementPanelProps> = ({
  currentStreak,
  earnedBadges,
  reminderEnabled,
  onReminderToggle
}) => {
  return (
    <Card className="bg-gradient-to-r from-primary/5 to-secondary/5 border-primary/20">
      <CardContent className="p-4 space-y-3">
        <div className="text-sm font-medium text-foreground mb-2">Your Progress</div>
        
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Zap className="h-4 w-4 text-primary" />
            <span className="text-sm">Current Streak</span>
          </div>
          <Badge variant="secondary" className="bg-primary/10 text-primary">
            {currentStreak} days
          </Badge>
        </div>

        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Award className="h-4 w-4 text-primary" />
            <span className="text-sm">Badges Earned</span>
          </div>
          <div className="flex gap-1">
            {earnedBadges.map((badge, index) => (
              <div key={index} className="text-lg">{badge}</div>
            ))}
            {earnedBadges.length === 0 && (
              <span className="text-xs text-muted-foreground">None yet</span>
            )}
          </div>
        </div>

        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Star className="h-4 w-4 text-primary" />
            <span className="text-sm">Daily Reminders</span>
          </div>
          <Switch 
            checked={reminderEnabled} 
            onCheckedChange={onReminderToggle}
          />
        </div>
      </CardContent>
    </Card>
  );
};

// Voice Input Hook
export const useVoiceInput = () => {
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const recognitionRef = useRef<any>(null);
  const { toast } = useToast();

  useEffect(() => {
    if (typeof window !== 'undefined' && 'webkitSpeechRecognition' in window) {
      const SpeechRecognition = (window as any).webkitSpeechRecognition;
      recognitionRef.current = new SpeechRecognition();
      recognitionRef.current.continuous = false;
      recognitionRef.current.interimResults = true;

      recognitionRef.current.onresult = (event: any) => {
        const current = event.resultIndex;
        const transcript = event.results[current][0].transcript;
        setTranscript(transcript);
      };

      recognitionRef.current.onend = () => {
        setIsListening(false);
      };

      recognitionRef.current.onerror = (event: any) => {
        console.error('Speech recognition error:', event.error);
        setIsListening(false);
        toast({
          title: "Voice input error",
          description: "Please try again or use text input.",
          variant: "destructive"
        });
      };
    }

    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
    };
  }, [toast]);

  const startListening = () => {
    if (recognitionRef.current && !isListening) {
      setTranscript('');
      recognitionRef.current.start();
      setIsListening(true);
    }
  };

  const stopListening = () => {
    if (recognitionRef.current && isListening) {
      recognitionRef.current.stop();
      setIsListening(false);
    }
  };

  return {
    isListening,
    transcript,
    startListening,
    stopListening,
    isSupported: typeof window !== 'undefined' && 'webkitSpeechRecognition' in window
  };
};

// Text-to-Speech Hook
export const useTextToSpeech = () => {
  const [isSpeaking, setIsSpeaking] = useState(false);

  const speak = (text: string) => {
    if ('speechSynthesis' in window) {
      // Cancel any ongoing speech
      window.speechSynthesis.cancel();
      
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.rate = 0.8;
      utterance.pitch = 1;
      utterance.volume = 0.8;
      
      utterance.onstart = () => setIsSpeaking(true);
      utterance.onend = () => setIsSpeaking(false);
      utterance.onerror = () => setIsSpeaking(false);
      
      window.speechSynthesis.speak(utterance);
    }
  };

  const stop = () => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
    }
  };

  return {
    speak,
    stop,
    isSpeaking,
    isSupported: typeof window !== 'undefined' && 'speechSynthesis' in window
  };
};

// Enhanced Confetti Animation
export const ConfettiAnimation: React.FC = () => {
  const [particles, setParticles] = useState<Array<{
    id: number;
    x: number;
    y: number;
    color: string;
    size: number;
    rotation: number;
  }>>([]);

  useEffect(() => {
    const colors = ['#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEAA7', '#DDA0DD'];
    const newParticles = Array.from({ length: 50 }, (_, i) => ({
      id: i,
      x: Math.random() * window.innerWidth,
      y: -10,
      color: colors[Math.floor(Math.random() * colors.length)],
      size: Math.random() * 10 + 5,
      rotation: Math.random() * 360
    }));

    setParticles(newParticles);

    const interval = setInterval(() => {
      setParticles(prev => 
        prev.map(particle => ({
          ...particle,
          y: particle.y + 2,
          rotation: particle.rotation + 2
        })).filter(particle => particle.y < window.innerHeight + 20)
      );
    }, 50);

    const timeout = setTimeout(() => {
      clearInterval(interval);
      setParticles([]);
    }, 3000);

    return () => {
      clearInterval(interval);
      clearTimeout(timeout);
    };
  }, []);

  return (
    <div className="fixed inset-0 pointer-events-none z-50">
      {particles.map(particle => (
        <div
          key={particle.id}
          className="absolute animate-bounce"
          style={{
            left: particle.x,
            top: particle.y,
            width: particle.size,
            height: particle.size,
            backgroundColor: particle.color,
            borderRadius: '50%',
            transform: `rotate(${particle.rotation}deg)`
          }}
        />
      ))}
    </div>
  );
};