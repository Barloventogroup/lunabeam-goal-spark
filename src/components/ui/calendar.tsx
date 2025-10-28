import * as React from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { DayPicker, CaptionProps } from "react-day-picker";
import { cn } from "@/lib/utils";
import { buttonVariants } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
export type CalendarProps = React.ComponentProps<typeof DayPicker> & {
  showYearPicker?: boolean;
  disableNavigation?: boolean;
};
function CustomCaption({
  displayMonth,
  showYearPicker
}: CaptionProps & {
  showYearPicker?: boolean;
}) {
  const [month, setMonth] = React.useState(displayMonth.getMonth());
  const [year, setYear] = React.useState(displayMonth.getFullYear());
  const months = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

  // Generate years from 1900 to current year
  const currentYear = new Date().getFullYear();
  const years = Array.from({
    length: currentYear - 1900 + 1
  }, (_, i) => currentYear - i);
  React.useEffect(() => {
    setMonth(displayMonth.getMonth());
    setYear(displayMonth.getFullYear());
  }, [displayMonth]);
  if (!showYearPicker) {
    return <div className="flex justify-center pt-1 relative items-center">
        
      </div>;
  }
  return <div className="flex justify-center pt-1 pb-2 gap-2">
      <Select value={month.toString()} onValueChange={value => {
      const newDate = new Date(year, parseInt(value));
      const event = new CustomEvent('monthYearChange', {
        detail: newDate
      });
      window.dispatchEvent(event);
    }}>
        <SelectTrigger className="h-8 w-[110px]">
          <SelectValue>{months[month]}</SelectValue>
        </SelectTrigger>
        <SelectContent className="pointer-events-auto max-h-[300px]">
          {months.map((m, i) => <SelectItem key={i} value={i.toString()}>
              {m}
            </SelectItem>)}
        </SelectContent>
      </Select>
      <Select value={year.toString()} onValueChange={value => {
      const newDate = new Date(parseInt(value), month);
      const event = new CustomEvent('monthYearChange', {
        detail: newDate
      });
      window.dispatchEvent(event);
    }}>
        <SelectTrigger className="h-8 w-[90px]">
          <SelectValue>{year}</SelectValue>
        </SelectTrigger>
        <SelectContent className="pointer-events-auto max-h-[300px]">
          {years.map(y => <SelectItem key={y} value={y.toString()}>
              {y}
            </SelectItem>)}
        </SelectContent>
      </Select>
    </div>;
}
function Calendar({
  className,
  classNames,
  showOutsideDays = true,
  showYearPicker = false,
  disableNavigation = false,
  ...props
}: CalendarProps) {
  const [month, setMonth] = React.useState<Date>(props.month || new Date());
  React.useEffect(() => {
    // Sync with controlled month from parent when provided
    if (props.month) {
      const m = props.month;
      if (month.getFullYear() !== m.getFullYear() || month.getMonth() !== m.getMonth()) {
        setMonth(m);
      }
    }
  }, [props.month]);
  React.useEffect(() => {
    const handleMonthYearChange = (e: Event) => {
      const customEvent = e as CustomEvent<Date>;
      setMonth(customEvent.detail);
    };
    window.addEventListener('monthYearChange', handleMonthYearChange);
    return () => window.removeEventListener('monthYearChange', handleMonthYearChange);
  }, []);
  return <DayPicker month={month} onMonthChange={setMonth} showOutsideDays={showOutsideDays} className={cn("pointer-events-auto", className)} classNames={{
    months: "flex flex-col sm:flex-row space-y-4 sm:space-x-4 sm:space-y-0",
    month: "space-y-2",
    caption: "flex justify-center pt-1 relative items-center",
    caption_label: "text-sm font-medium",
    nav: cn("space-x-1 flex items-center", disableNavigation && "hidden"),
    nav_button: cn(buttonVariants({
      variant: "outline"
    }), "h-7 w-7 bg-transparent p-0 opacity-50 hover:opacity-100 pointer-events-auto"),
    nav_button_previous: "absolute left-1",
    nav_button_next: "absolute right-1",
    table: "w-full border-collapse space-y-1",
    head_row: "flex mb-4",
    head_cell: "text-muted-foreground rounded-md w-11 font-normal text-sm",
    row: "flex w-full mt-3",
    cell: "h-11 w-11 text-center text-xs p-0 relative [&:has([aria-selected].day-range-end)]:rounded-r-md [&:has([aria-selected].day-outside)]:bg-accent/50 [&:has([aria-selected])]:bg-accent first:[&:has([aria-selected])]:rounded-l-md last:[&:has([aria-selected])]:rounded-r-md focus-within:relative focus-within:z-20",
    day: cn(buttonVariants({
      variant: "ghost"
    }), "h-10 w-10 p-0 font-normal aria-selected:opacity-100 text-sm"),
    day_range_end: "day-range-end",
    day_selected: "bg-primary text-primary-foreground hover:bg-primary hover:text-primary-foreground focus:bg-primary focus:text-primary-foreground",
    day_today: "bg-accent text-accent-foreground",
    day_outside: "day-outside text-muted-foreground opacity-50 aria-selected:bg-accent/50 aria-selected:text-muted-foreground aria-selected:opacity-30",
    day_disabled: "text-muted-foreground opacity-50",
    day_range_middle: "aria-selected:bg-accent aria-selected:text-accent-foreground",
    day_hidden: "invisible",
    ...classNames
  }} components={{
    Caption: props => <CustomCaption {...props} showYearPicker={showYearPicker} />,
    IconLeft: ({
      ..._props
    }) => <ChevronLeft className="h-4 w-4" />,
    IconRight: ({
      ..._props
    }) => <ChevronRight className="h-4 w-4" />
  }} {...props} />;
}
Calendar.displayName = "Calendar";
export { Calendar };