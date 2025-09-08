import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ArrowLeft, Target, Flag, Calendar, Hash } from 'lucide-react';
import { goalsService } from '@/services/goalsService';
import type { GoalDomain, GoalPriority } from '@/types';
import { useToast } from '@/hooks/use-toast';

interface CreateGoalProps {
  onNavigate: (view: string, goalId?: string) => void;
}

export const CreateGoal: React.FC<CreateGoalProps> = ({ onNavigate }) => {
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    domain: '' as GoalDomain | '',
    priority: 'medium' as GoalPriority,
    start_date: '',
    due_date: '',
    tags: ''
  });
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.title.trim()) {
      toast({
        title: 'Hey!',
        description: 'Your goal needs a title first',
        variant: 'destructive'
      });
      return;
    }

    if (formData.title.length > 80) {
      toast({
        title: 'Almost there!',
        description: 'Let\'s keep it short and sweet - under 80 characters',
        variant: 'destructive'
      });
      return;
    }

    setLoading(true);
    
    try {
      const goalData = {
        title: formData.title.trim(),
        description: formData.description.trim() || undefined,
        domain: formData.domain || undefined,
        priority: formData.priority,
        start_date: formData.start_date || undefined,
        due_date: formData.due_date || undefined,
      };

      const goal = await goalsService.createGoal(goalData);
      
      toast({
        description: 'Nice! Your goal is ready to go! 🎉'
      });

      // Navigate to the new goal's detail page
      onNavigate('goal-detail', goal.id);
    } catch (error) {
      console.error('Failed to create goal:', error);
      toast({
        title: 'Oops!',
        description: 'Something went wrong. Mind trying again?',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const domains: { value: GoalDomain; label: string }[] = [
    { value: 'school', label: 'Education (High School / Academic Readiness)' },
    { value: 'work', label: 'Employment' },
    { value: 'life', label: 'Life Skills' },
    { value: 'health', label: 'Health & Well-Being' },
    { value: 'other', label: 'Other' }
  ];

  const priorities: { value: GoalPriority; label: string }[] = [
    { value: 'low', label: 'Low' },
    { value: 'medium', label: 'Medium' },
    { value: 'high', label: 'High' }
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-2">
        <Button variant="ghost" size="sm" onClick={() => onNavigate('goals-list')}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <h1 className="text-2xl font-bold">
          Create New Goal
        </h1>
      </div>

      {/* Form */}
      <Card>
        <CardHeader>
          <CardTitle>Goal Details</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Title */}
            <div className="space-y-2">
              <Label htmlFor="title">Title *</Label>
              <Input
                id="title"
                placeholder="What do you want to achieve?"
                value={formData.title}
                onChange={(e) => handleChange('title', e.target.value)}
                maxLength={80}
                required
              />
              <div className="text-xs text-muted-foreground text-right">
                {formData.title.length}/80 characters
              </div>
            </div>

            {/* Description */}
            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                placeholder="Describe your goal in more detail..."
                value={formData.description}
                onChange={(e) => handleChange('description', e.target.value)}
                rows={3}
              />
            </div>

            {/* Domain and Priority Row */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="domain">Category</Label>
                <Select value={formData.domain} onValueChange={(value) => handleChange('domain', value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                  <SelectContent>
                    {domains.map(domain => (
                      <SelectItem key={domain.value} value={domain.value}>
                        {domain.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="priority">Priority</Label>
                <Select value={formData.priority} onValueChange={(value) => handleChange('priority', value as GoalPriority)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {priorities.map(priority => (
                      <SelectItem key={priority.value} value={priority.value}>
                        <div className="flex items-center gap-2">
                          <Flag className="h-4 w-4" />
                          {priority.label}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Dates Row */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="start_date">Start Date</Label>
                <Input
                  id="start_date"
                  type="date"
                  value={formData.start_date}
                  onChange={(e) => handleChange('start_date', e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="due_date">Due Date</Label>
                <Input
                  id="due_date"
                  type="date"
                  value={formData.due_date}
                  onChange={(e) => handleChange('due_date', e.target.value)}
                  min={formData.start_date || undefined}
                />
              </div>
            </div>

            {/* Actions */}
            <div className="flex gap-3">
              <Button
                type="button"
                variant="outline"
                onClick={() => onNavigate('goals-list')}
                disabled={loading}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={loading || !formData.title.trim()}>
                {loading ? 'Creating...' : 'Create Goal'}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};