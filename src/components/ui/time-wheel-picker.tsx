import React, { useEffect, useRef, useState } from 'react';
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle } from './drawer';
import { Button } from './button';
import { cn } from '@/lib/utils';

interface TimeWheelPickerProps {
  value?: string; // Format: "HH:MM" (24-hour)
  onChange: (time: string) => void;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

interface TimeWheelProps {
  values: number[];
  selectedValue: number;
  onChange: (value: number) => void;
  formatValue: (value: number) => string;
}

function TimeWheel({ values, selectedValue, onChange, formatValue }: TimeWheelProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const isScrollingRef = useRef(false);
  
  // Auto-scroll to selected value on mount
  useEffect(() => {
    if (scrollRef.current && selectedValue !== undefined) {
      const index = values.indexOf(selectedValue);
      if (index >= 0) {
        setTimeout(() => {
          scrollRef.current?.scrollTo({ top: index * 44, behavior: 'auto' });
        }, 50);
      }
    }
  }, [selectedValue, values]);
  
  const handleScroll = () => {
    if (!scrollRef.current || isScrollingRef.current) return;
    
    const scrollTop = scrollRef.current.scrollTop;
    const index = Math.round(scrollTop / 44);
    const newValue = values[index];
    
    if (newValue !== undefined && newValue !== selectedValue) {
      onChange(newValue);
    }
  };

  const handleClick = (val: number) => {
    isScrollingRef.current = true;
    onChange(val);
    const index = values.indexOf(val);
    scrollRef.current?.scrollTo({ top: index * 44, behavior: 'smooth' });
    setTimeout(() => {
      isScrollingRef.current = false;
    }, 300);
  };
  
  return (
    <div className="flex-1 flex flex-col items-center">
      <div 
        ref={scrollRef}
        className="overflow-y-scroll h-[220px] snap-y snap-mandatory hide-scrollbar"
        style={{ scrollbarWidth: 'none' }}
        onScroll={handleScroll}
      >
        {/* Top padding for centering */}
        <div style={{ height: '88px' }} />
        
        {values.map((val) => (
          <div
            key={val}
            className={cn(
              "h-[44px] flex items-center justify-center snap-center cursor-pointer text-lg transition-all",
              selectedValue === val ? "font-bold text-foreground scale-110" : "text-muted-foreground"
            )}
            onClick={() => handleClick(val)}
          >
            {formatValue(val)}
          </div>
        ))}
        
        {/* Bottom padding for centering */}
        <div style={{ height: '88px' }} />
      </div>
    </div>
  );
}

export function TimeWheelPicker({ value, onChange, open, onOpenChange }: TimeWheelPickerProps) {
  // Parse 24-hour time to 12-hour components
  const [hour, setHour] = useState<number>(9);
  const [minute, setMinute] = useState<number>(0);
  const [period, setPeriod] = useState<'AM' | 'PM'>('AM');
  const [hasInitialized, setHasInitialized] = useState(false);
  
  // Parse incoming value when drawer opens
  useEffect(() => {
    if (open && value) {
      const [h, m] = value.split(':').map(Number);
      setHour(h % 12 || 12);
      setMinute(m);
      setPeriod(h >= 12 ? 'PM' : 'AM');
      setHasInitialized(true);
    } else if (open && !value) {
      // Reset to default display when no value
      setHour(9);
      setMinute(0);
      setPeriod('AM');
      setHasInitialized(false);
    }
  }, [open, value]);
  
  // Convert to 24-hour format
  const convertTo24Hour = (h: number, m: number, p: 'AM' | 'PM'): string => {
    let hour24 = h === 12 ? 0 : h;
    if (p === 'PM' && h !== 12) hour24 += 12;
    if (p === 'AM' && h === 12) hour24 = 0;
    return `${String(hour24).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
  };
  
  const handleConfirm = () => {
    const time24 = convertTo24Hour(hour, minute, period);
    onChange(time24);
    onOpenChange(false);
  };
  
  return (
    <Drawer open={open} onOpenChange={onOpenChange}>
      <DrawerContent side="bottom" className="h-[400px]">
        <DrawerHeader className="border-b pb-4">
          <DrawerTitle>Select Time</DrawerTitle>
        </DrawerHeader>
        
        {/* Wheel Picker Container */}
        <div className="flex-1 flex items-center justify-center px-4 relative">
          {/* Center selection highlight bars */}
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <div className="w-full h-[44px] border-y border-primary/20 bg-primary/5" />
          </div>
          
          {/* Top gradient overlay */}
          <div className="absolute top-0 left-0 right-0 h-24 bg-gradient-to-b from-background to-transparent pointer-events-none z-10" />
          
          {/* Bottom gradient overlay */}
          <div className="absolute bottom-0 left-0 right-0 h-24 bg-gradient-to-t from-background to-transparent pointer-events-none z-10" />
          
          {/* Three wheels */}
          <div className="flex gap-4 w-full max-w-xs">
            {/* Hours Wheel */}
            <TimeWheel
              values={Array.from({ length: 12 }, (_, i) => i + 1)}
              selectedValue={hour}
              onChange={setHour}
              formatValue={(v) => String(v)}
            />
            
            {/* Minutes Wheel */}
            <TimeWheel
              values={Array.from({ length: 60 }, (_, i) => i)}
              selectedValue={minute}
              onChange={setMinute}
              formatValue={(v) => String(v).padStart(2, '0')}
            />
            
            {/* Period Wheel */}
            <div className="flex-1 flex flex-col items-center">
              <div className="overflow-y-scroll h-[220px] snap-y snap-mandatory hide-scrollbar" 
                   style={{ scrollbarWidth: 'none' }}>
                <div style={{ height: '88px' }} />
                {['AM', 'PM'].map((p) => (
                  <div
                    key={p}
                    className={cn(
                      "h-[44px] flex items-center justify-center snap-center cursor-pointer text-lg transition-all",
                      period === p ? "font-bold text-foreground scale-110" : "text-muted-foreground"
                    )}
                    onClick={() => setPeriod(p as 'AM' | 'PM')}
                  >
                    {p}
                  </div>
                ))}
                <div style={{ height: '88px' }} />
              </div>
            </div>
          </div>
        </div>
        
        {/* Confirm Button */}
        <div className="p-4 border-t">
          <Button 
            className="w-full" 
            onClick={handleConfirm}
          >
            Confirm Time
          </Button>
        </div>
      </DrawerContent>
    </Drawer>
  );
}
