import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Smile } from "lucide-react";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { AlertTriangle } from "lucide-react";
import { rewardsService, Reward, REWARD_CATEGORIES, ABSOLUTE_BOUNDS } from "@/services/rewardsService";
import { toast } from "sonner";

interface RewardFormModalProps {
  open: boolean;
  onClose: () => void;
  reward?: Reward | null;
  onSuccess: () => void;
}

export const RewardFormModal: React.FC<RewardFormModalProps> = ({
  open,
  onClose,
  reward,
  onSuccess
}) => {
  const [formData, setFormData] = useState({
    name: '',
    category: 'small' as keyof typeof REWARD_CATEGORIES,
    point_cost: 100,
    description: '',
    image: '',
    is_active: true
  });
  const [loading, setLoading] = useState(false);
  const [costWarning, setCostWarning] = useState<string | null>(null);

  useEffect(() => {
    if (reward) {
      setFormData({
        name: reward.name,
        category: reward.category as keyof typeof REWARD_CATEGORIES,
        point_cost: reward.point_cost,
        description: reward.description || '',
        image: reward.image || '',
        is_active: reward.is_active
      });
    } else {
      setFormData({
        name: '',
        category: 'small',
        point_cost: 100,
        description: '',
        image: '',
        is_active: true
      });
    }
  }, [reward, open]);

  useEffect(() => {
    const warning = rewardsService.getSuggestionWarning(formData.category, formData.point_cost);
    setCostWarning(warning);
  }, [formData.category, formData.point_cost]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (formData.point_cost < ABSOLUTE_BOUNDS.min || formData.point_cost > ABSOLUTE_BOUNDS.max) {
      toast.error(`Point cost must be between ${ABSOLUTE_BOUNDS.min} and ${ABSOLUTE_BOUNDS.max}`);
      return;
    }

    try {
      setLoading(true);
      if (reward) {
        await rewardsService.updateReward(reward.id, formData);
        toast.success('Reward updated successfully');
      } else {
        await rewardsService.createReward(formData);
        toast.success('Reward created successfully');
      }
      onSuccess();
    } catch (error) {
      console.error('Failed to save reward:', error);
      toast.error('Failed to save reward');
    } finally {
      setLoading(false);
    }
  };

  const getSuggestedRange = (category: keyof typeof REWARD_CATEGORIES) => {
    const config = REWARD_CATEGORIES[category];
    return `${config.min}–${config.max} pts`;
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {reward ? 'Edit Reward' : 'Add New Reward'}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Name */}
          <div className="space-y-2">
            <Label htmlFor="name">Reward Name</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
              placeholder="e.g., McDonald's trip"
              required
            />
          </div>

          {/* Category with Suggestion Box */}
          <div className="space-y-3">
            <Label>Category</Label>
            <Card className="bg-blue-50 border-blue-200">
              <CardContent className="p-4">
                <h4 className="font-medium text-blue-900 mb-3">Pick a size, we'll suggest points</h4>
                <div className="space-y-2 text-sm">
                  {Object.entries(REWARD_CATEGORIES).map(([key, config]) => (
                    <div key={key} className="flex justify-between">
                      <span className="font-medium">{config.label} ({getSuggestedRange(key as any)})</span>
                    </div>
                  ))}
                </div>
                <div className="mt-2 text-xs text-blue-700">
                  Small = a few days to a week; Medium = 1–3 weeks; Big = ~1+ month of steady effort.
                </div>
              </CardContent>
            </Card>
            <Select
              value={formData.category}
              onValueChange={(value) => setFormData(prev => ({ 
                ...prev, 
                category: value as keyof typeof REWARD_CATEGORIES,
                point_cost: REWARD_CATEGORIES[value as keyof typeof REWARD_CATEGORIES].min
              }))}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {Object.entries(REWARD_CATEGORIES).map(([key, config]) => (
                  <SelectItem key={key} value={key}>
                    {config.label} ({getSuggestedRange(key as any)})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Point Cost */}
          <div className="space-y-2">
            <Label htmlFor="cost">Point Cost</Label>
            <Input
              id="cost"
              type="number"
              value={formData.point_cost}
              onChange={(e) => setFormData(prev => ({ ...prev, point_cost: parseInt(e.target.value) || 0 }))}
              min={ABSOLUTE_BOUNDS.min}
              max={ABSOLUTE_BOUNDS.max}
              required
            />
            <div className="text-xs text-muted-foreground">
              Suggested range: {getSuggestedRange(formData.category)}
            </div>
            {costWarning && (
              <div className="flex items-center gap-2 p-2 bg-yellow-50 border border-yellow-200 rounded-md">
                <AlertTriangle className="w-4 h-4 text-yellow-600" />
                <span className="text-xs text-yellow-700">{costWarning}</span>
              </div>
            )}
          </div>

          {/* Description */}
          <div className="space-y-2">
            <Label htmlFor="description">Description (Optional)</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
              placeholder="Add details about this reward..."
              rows={3}
            />
          </div>

          {/* Image/Emoji */}
          <div className="space-y-2">
            <Label htmlFor="image">Image/Emoji (Optional)</Label>
            <div className="flex gap-2">
              <Input
                id="image"
                value={formData.image}
                onChange={(e) => setFormData(prev => ({ ...prev, image: e.target.value }))}
                placeholder="🍔 or image URL"
                className="flex-1"
              />
              <Popover>
                <PopoverTrigger asChild>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="px-3"
                    type="button"
                  >
                    <Smile className="h-4 w-4" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-2 bg-card border border-input shadow-lg z-50" align="end">
                  <div className="grid grid-cols-8 gap-1 max-w-64">
                    {['🎁', '🏆', '🍕', '🍔', '🍟', '🍿', '🍭', '🍪',
                      '🎮', '📱', '💻', '🎧', '📚', '🎨', '⚽', '🏀',
                      '🎯', '🎪', '🎭', '🎨', '🎸', '🎤', '🎬', '📷',
                      '⭐', '🌟', '✨', '💎', '👑', '🏅', '🎖️', '🏵️',
                      '❤️', '💚', '💙', '💜', '🧡', '💛', '🖤', '🤍',
                      '😊', '😍', '🤩', '😎', '🥳', '🎉', '🔥', '💪'].map(emoji => (
                      <button
                        key={emoji}
                        type="button"
                        onClick={() => setFormData(prev => ({ ...prev, image: emoji }))}
                        className="p-1 text-lg hover:bg-muted rounded transition-colors"
                      >
                        {emoji}
                      </button>
                    ))}
                  </div>
                </PopoverContent>
              </Popover>
            </div>
          </div>

          {/* Active Toggle */}
          <div className="flex items-center justify-between">
            <Label htmlFor="active">Active</Label>
            <Switch
              id="active"
              checked={formData.is_active}
              onCheckedChange={(checked) => setFormData(prev => ({ ...prev, is_active: checked }))}
            />
          </div>

          {/* Buttons */}
          <div className="flex gap-3 pt-4">
            <Button type="button" variant="outline" onClick={onClose} className="flex-1">
              Cancel
            </Button>
            <Button type="submit" disabled={loading} className="flex-1">
              {loading ? 'Saving...' : reward ? 'Update' : 'Create'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};