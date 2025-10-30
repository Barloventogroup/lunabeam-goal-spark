import React from "react";
import { cn } from "@/lib/utils";

interface HeaderTabsContainerProps {
  className?: string;
  children?: React.ReactNode;
  tabs: React.ReactNode;
}

export const HeaderTabsContainer: React.FC<HeaderTabsContainerProps> = ({
  className,
  children,
  tabs,
}) => {
  return (
    <div
      className={cn(
        "flex-shrink-0 space-y-4 px-4 pt-5 pb-4 bg-background border-b border-border",
        className
      )}
    >
      {children}
      {tabs}
    </div>
  );
};
