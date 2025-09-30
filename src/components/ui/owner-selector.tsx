import React from 'react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { User, Users } from 'lucide-react';
import type { OwnerOption } from '@/utils/ownerSelectionUtils';

interface OwnerSelectorProps {
  owners: OwnerOption[];
  selectedOwnerId: string;
  onOwnerChange: (ownerId: string) => void;
  label?: string;
  placeholder?: string;
  alwaysShow?: boolean;
}

export const OwnerSelector: React.FC<OwnerSelectorProps> = ({
  owners,
  selectedOwnerId,
  onOwnerChange,
  label = "Create goal for",
  placeholder = "Select who this goal is for",
  alwaysShow = false
}) => {
  // Hide selector only if there's one option AND alwaysShow is false
  if (owners.length <= 1 && !alwaysShow) {
    return null;
  }

  return (
    <div className="space-y-2">
      <Label>{label}</Label>
      <Select value={selectedOwnerId} onValueChange={onOwnerChange}>
        <SelectTrigger>
          <SelectValue placeholder={placeholder} />
        </SelectTrigger>
        <SelectContent className="bg-background border border-border z-50">
          {owners.map(owner => (
            <SelectItem key={owner.id} value={owner.id}>
              <div className="flex items-center gap-2">
                {owner.type === 'self' ? (
                  <User className="h-4 w-4" />
                ) : (
                  <Users className="h-4 w-4" />
                )}
                {owner.name}
              </div>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
};