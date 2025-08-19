import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { Trophy, Plus, Calendar, Star, Gift } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { database } from "@/services/database";
import type { FamilyCircle, Goal } from "@/types";

interface WeeklyCheckinModalProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  circle: FamilyCircle;
  goals: Goal[];
  weekOf: string;
}

interface Win {
  goal_id: string;
  text: string;
  mood: 'proud' | 'happy' | 'accomplished' | 'relieved';
}

interface Microstep {
  goal_id: string;
  text: string;
  difficulty: number; // 1-5 scale
  visibility: 'private' | 'family';
  schedule: {
    days: string[];
    time: 'morning' | 'afternoon' | 'evening';
  };
}

const moodEmojis = {
  proud: '😊',
  happy: '😄',
  accomplished: '🎉',
  relieved: '😌'
};

const rewardOptions = [
  { id: 'movie', label: 'Pick Friday movie', points: 1 },
  { id: 'snack', label: 'Special snack', points: 1 },
  { id: 'activity', label: '30min favorite activity', points: 2 },
  { id: 'outing', label: 'Small outing', points: 3 }
];

export function WeeklyCheckinModal({ 
  isOpen, 
  onOpenChange, 
  circle, 
  goals, 
  weekOf 
}: WeeklyCheckinModalProps) {
  const [currentStep, setCurrentStep] = useState(1);
  const [wins, setWins] = useState<Win[]>([]);
  const [microsteps, setMicrosteps] = useState<Microstep[]>([]);
  const [selectedReward, setSelectedReward] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const [newWin, setNewWin] = useState({ text: '', mood: 'proud' as const, goal_id: '' });
  const [newMicrostep, setNewMicrostep] = useState<{
    text: string;
    goal_id: string;
    difficulty: number;
    visibility: 'private' | 'family';
    schedule: { days: string[]; time: 'morning' | 'afternoon' | 'evening' };
  }>({
    text: '',
    goal_id: '',
    difficulty: 3,
    visibility: 'family',
    schedule: { days: ['mo'], time: 'evening' }
  });

  const handleAddWin = () => {
    if (!newWin.text.trim() || !newWin.goal_id) return;
    
    setWins(prev => [...prev, { 
      ...newWin, 
      text: newWin.text.trim() 
    }]);
    
    setNewWin({ text: '', mood: 'proud', goal_id: '' });
  };

  const handleAddMicrostep = () => {
    if (!newMicrostep.text.trim() || !newMicrostep.goal_id) return;
    
    setMicrosteps(prev => [...prev, { 
      ...newMicrostep, 
      text: newMicrostep.text.trim() 
    }]);
    
    setNewMicrostep({
      text: '',
      goal_id: '',
      difficulty: 3,
      visibility: 'family',
      schedule: { days: ['mo'], time: 'evening' }
    });
  };

  const handleSaveCheckin = async () => {
    if (wins.length === 0 && microsteps.length === 0) {
      toast({
        title: "Nothing to save",
        description: "Add at least one win or microstep",
        variant: "destructive"
      });
      return;
    }

    setIsLoading(true);
    try {
      await database.saveWeeklyCheckin({
        circle_id: circle.id,
        user_id: '', // Will be set by the database function
        week_of: weekOf,
        wins,
        microsteps,
        reward: selectedReward ? { id: selectedReward } : undefined,
        completed_at: new Date().toISOString()
      });

      toast({
        title: "Check-in saved! ✨",
        description: "Your weekly plan is locked in"
      });

      onOpenChange(false);
      // Reset form
      setCurrentStep(1);
      setWins([]);
      setMicrosteps([]);
      setSelectedReward('');
    } catch (error) {
      toast({
        title: "Failed to save check-in",
        description: "Please try again",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSkipWeek = () => {
    toast({
      title: "Week skipped",
      description: "No worries, we'll try again next week"
    });
    onOpenChange(false);
  };

  const renderStep1 = () => (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Trophy className="h-5 w-5 text-yellow-500" />
          Celebrate Wins
        </CardTitle>
        <p className="text-sm text-muted-foreground">
          What went well this week?
        </p>
      </CardHeader>
      <CardContent className="space-y-4">
        {wins.map((win, index) => (
          <div key={index} className="flex items-center gap-2 p-2 bg-muted/50 rounded-lg">
            <span className="text-lg">{moodEmojis[win.mood]}</span>
            <span className="flex-1">{win.text}</span>
            <Badge variant="outline" className="text-xs">
              {goals.find(g => g.id === win.goal_id)?.title}
            </Badge>
          </div>
        ))}
        
        <div className="space-y-3 p-4 border rounded-lg">
          <div className="grid grid-cols-2 gap-2">
            <div>
              <Label>Goal</Label>
              <select 
                className="w-full p-2 border rounded"
                value={newWin.goal_id}
                onChange={(e) => setNewWin(prev => ({ ...prev, goal_id: e.target.value }))}
              >
                <option value="">Select goal</option>
                {goals.map(goal => (
                  <option key={goal.id} value={goal.id}>{goal.title}</option>
                ))}
              </select>
            </div>
            <div>
              <Label>How it felt</Label>
              <select 
                className="w-full p-2 border rounded"
                value={newWin.mood}
                onChange={(e) => setNewWin(prev => ({ ...prev, mood: e.target.value as any }))}
              >
                {Object.entries(moodEmojis).map(([mood, emoji]) => (
                  <option key={mood} value={mood}>{emoji} {mood}</option>
                ))}
              </select>
            </div>
          </div>
          <div>
            <Label>What happened?</Label>
            <Input
              placeholder="Walked 10 min M/W/F"
              value={newWin.text}
              onChange={(e) => setNewWin(prev => ({ ...prev, text: e.target.value }))}
            />
          </div>
          <Button 
            onClick={handleAddWin}
            size="sm"
            disabled={!newWin.text.trim() || !newWin.goal_id}
          >
            <Plus className="h-4 w-4 mr-2" />
            Add Win
          </Button>
        </div>
      </CardContent>
    </Card>
  );

  const renderStep2 = () => (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Calendar className="h-5 w-5 text-blue-500" />
          Plan Next Step
        </CardTitle>
        <p className="text-sm text-muted-foreground">
          Pick one tiny next step for each goal
        </p>
      </CardHeader>
      <CardContent className="space-y-4">
        {microsteps.map((step, index) => (
          <div key={index} className="p-3 border rounded-lg space-y-2">
            <div className="flex justify-between items-start">
              <span className="font-medium">{step.text}</span>
              <Badge variant={step.visibility === 'family' ? 'default' : 'secondary'}>
                {step.visibility}
              </Badge>
            </div>
            <div className="text-sm text-muted-foreground">
              {goals.find(g => g.id === step.goal_id)?.title} • 
              Difficulty: {step.difficulty}/5 • 
              {step.schedule.days.join(', ')} {step.schedule.time}
            </div>
          </div>
        ))}

        <div className="space-y-4 p-4 border rounded-lg">
          <div className="grid grid-cols-2 gap-2">
            <div>
              <Label>Goal</Label>
              <select 
                className="w-full p-2 border rounded"
                value={newMicrostep.goal_id}
                onChange={(e) => setNewMicrostep(prev => ({ ...prev, goal_id: e.target.value }))}
              >
                <option value="">Select goal</option>
                {goals.map(goal => (
                  <option key={goal.id} value={goal.id}>{goal.title}</option>
                ))}
              </select>
            </div>
            <div>
              <Label>Time</Label>
              <select 
                className="w-full p-2 border rounded"
                value={newMicrostep.schedule.time}
                onChange={(e) => setNewMicrostep(prev => ({ 
                  ...prev, 
                  schedule: { ...prev.schedule, time: e.target.value as any }
                }))}
              >
                <option value="morning">Morning</option>
                <option value="afternoon">Afternoon</option>
                <option value="evening">Evening</option>
              </select>
            </div>
          </div>

          <div>
            <Label>Next step</Label>
            <Input
              placeholder="Walk 12 min Tu/Thu"
              value={newMicrostep.text}
              onChange={(e) => setNewMicrostep(prev => ({ ...prev, text: e.target.value }))}
            />
          </div>

          <div>
            <Label>Difficulty (1=too easy, 5=too hard)</Label>
            <Slider
              value={[newMicrostep.difficulty]}
              onValueChange={([value]) => setNewMicrostep(prev => ({ ...prev, difficulty: value }))}
              min={1}
              max={5}
              step={1}
              className="my-2"
            />
            <div className="text-center text-sm text-muted-foreground">
              {newMicrostep.difficulty}/5
            </div>
          </div>

          <div className="flex items-center justify-between">
            <Label>Make visible to family</Label>
            <Switch
              checked={newMicrostep.visibility === 'family'}
              onCheckedChange={(checked) => 
                setNewMicrostep(prev => ({ 
                  ...prev, 
                  visibility: checked ? 'family' : 'private' 
                }))
              }
            />
          </div>

          <Button 
            onClick={handleAddMicrostep}
            size="sm"
            disabled={!newMicrostep.text.trim() || !newMicrostep.goal_id}
          >
            <Plus className="h-4 w-4 mr-2" />
            Add Step
          </Button>
        </div>
      </CardContent>
    </Card>
  );

  const renderStep3 = () => (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Gift className="h-5 w-5 text-purple-500" />
          Lock It In & Reward
        </CardTitle>
        <p className="text-sm text-muted-foreground">
          Lock it in and pick a small reward
        </p>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <Label className="text-lg">This week's plan:</Label>
          <div className="mt-2 space-y-2">
            {microsteps.map((step, index) => (
              <div key={index} className="p-2 bg-muted/50 rounded text-sm">
                • {step.text}
              </div>
            ))}
          </div>
        </div>

        <Separator />

        <div>
          <Label>Choose your reward:</Label>
          <div className="mt-2 grid grid-cols-1 gap-2">
            {rewardOptions.map(reward => (
              <div 
                key={reward.id}
                className={`p-3 border rounded-lg cursor-pointer transition-colors ${
                  selectedReward === reward.id ? 'bg-primary/10 border-primary' : 'hover:bg-muted/50'
                }`}
                onClick={() => setSelectedReward(reward.id)}
              >
                <div className="flex justify-between items-center">
                  <span>{reward.label}</span>
                  <div className="flex gap-1">
                    {Array.from({ length: reward.points }).map((_, i) => (
                      <Star key={i} className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Star className="h-5 w-5 text-yellow-500" />
            It's Check-in time ✨
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Step indicator */}
          <div className="flex justify-center space-x-2">
            {[1, 2, 3].map(step => (
              <div 
                key={step}
                className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                  step === currentStep ? 'bg-primary text-primary-foreground' :
                  step < currentStep ? 'bg-green-500 text-white' : 'bg-muted text-muted-foreground'
                }`}
              >
                {step}
              </div>
            ))}
          </div>

          {/* Current step content */}
          {currentStep === 1 && renderStep1()}
          {currentStep === 2 && renderStep2()}
          {currentStep === 3 && renderStep3()}

          {/* Navigation */}
          <div className="flex justify-between">
            {currentStep > 1 ? (
              <Button 
                variant="outline" 
                onClick={() => setCurrentStep(prev => prev - 1)}
              >
                Back
              </Button>
            ) : (
              <Button 
                variant="ghost" 
                onClick={handleSkipWeek}
              >
                Skip this week
              </Button>
            )}

            {currentStep < 3 ? (
              <Button 
                onClick={() => setCurrentStep(prev => prev + 1)}
                disabled={currentStep === 1 && wins.length === 0}
              >
                Next
              </Button>
            ) : (
              <Button 
                onClick={handleSaveCheckin}
                disabled={isLoading || microsteps.length === 0}
              >
                {isLoading ? "Saving..." : "Save Plan"}
              </Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}