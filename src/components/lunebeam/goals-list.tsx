import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { HeaderTabsContainer } from "@/components/ui/header-tabs-container";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Plus, ChevronLeft, ChevronRight } from "lucide-react";
import { goalsService } from "@/services/goalsService";
import type { GoalStatus } from "@/types";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useGoals } from "@/hooks/useGoals";
import { useIsMobile } from "@/hooks/use-mobile";
import { GoalDetailV2 } from "./goal-detail-v2";
import { GoalCard } from "./goal-card";
interface GoalsListProps {
  onNavigate: (view: string, goalId?: string) => void;
  refreshTrigger?: number;
}
type GoalsTab = "all" | "active" | "completed" | "created-by-me" | "created-by-others";
export const GoalsList: React.FC<GoalsListProps> = ({ onNavigate, refreshTrigger }) => {
  const [activeTab, setActiveTab] = useState<GoalsTab>("all");
  const [currentPage, setCurrentPage] = useState(1);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [selectedGoalId, setSelectedGoalId] = useState<string | null>(null);
  const [isSheetOpen, setIsSheetOpen] = useState(false);
  const isMobile = useIsMobile();
  const { toast } = useToast();
  const GOALS_PER_PAGE = 5;

  // Use React Query for goals fetching
  const filters =
    activeTab === "completed"
      ? {
          status: "completed" as GoalStatus,
        }
      : activeTab === "active"
        ? {
            status: "active" as GoalStatus,
          }
        : undefined; // 'all', 'created-by-me', 'created-by-others' fetch all statuses
  const { data, isLoading, error, refetch } = useGoals(filters);
  const goals = data?.goals || [];
  const allProfiles = data?.profiles || {};

  // Get current user
  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => setCurrentUser(user));
  }, []);

  // Reset page on tab change
  useEffect(() => {
    setCurrentPage(1);
  }, [activeTab]);

  // Refetch on external trigger
  useEffect(() => {
    if (refreshTrigger) refetch();
  }, [refreshTrigger, refetch]);
  const handleDeleteGoal = async (goalId: string, goalTitle: string) => {
    try {
      await goalsService.deleteGoal(goalId);
      toast({
        title: "Goal archived",
        description: `"${goalTitle}" has been moved to your archive`,
      });
      refetch();
    } catch (error) {
      console.error("Failed to delete goal:", error);
      toast({
        title: "Couldn't archive goal",
        description: "Something went wrong. Give it another try.",
        variant: "destructive",
      });
    }
  };

  // Apply filters
  const filteredGoals = goals.filter((goal) => {
    // Handle creator-based tabs
    if (activeTab === "created-by-me" && goal.created_by !== currentUser?.id) return false;
    if (activeTab === "created-by-others" && goal.created_by === currentUser?.id) return false;
    // Active and Completed are handled by the useGoals filter
    // 'all' tab shows everything
    return true;
  });

  // Calculate pagination
  const totalPages = Math.ceil(filteredGoals.length / GOALS_PER_PAGE);
  const startIndex = (currentPage - 1) * GOALS_PER_PAGE;
  const endIndex = startIndex + GOALS_PER_PAGE;
  const currentGoals = isMobile ? filteredGoals : filteredGoals.slice(startIndex, endIndex);
  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    const scrollContainer = document.querySelector("[data-scroll-container]");
    if (scrollContainer) {
      scrollContainer.scrollTo({
        top: 0,
        behavior: "smooth",
      });
    }
  };
  if (isLoading) {
    return (
      <div className="flex flex-col h-screen bg-background">
        <div className="flex-shrink-0 space-y-4 px-4 pt-6 pb-4 bg-background border-b">
          <div className="flex justify-between items-center">
            <div className="h-8 w-24 bg-muted animate-pulse rounded" />
            <div className="w-10 h-10 bg-muted animate-pulse rounded-full" />
          </div>
          <div className="h-10 bg-muted animate-pulse rounded" />
          <div className="h-10 w-40 bg-muted animate-pulse rounded" />
        </div>
        <div className="flex-1 overflow-y-auto px-4 py-4">
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <Card key={i} className="animate-pulse">
                <CardHeader className="pb-3">
                  <div className="space-y-3">
                    <div className="h-6 bg-muted rounded w-3/4" />
                    <div className="flex gap-2">
                      <div className="h-5 w-20 bg-muted rounded" />
                      <div className="h-5 w-24 bg-muted rounded" />
                    </div>
                  </div>
                </CardHeader>
              </Card>
            ))}
          </div>
        </div>
      </div>
    );
  }
  return (
    <div className="flex flex-col h-screen bg-background">
      {/* Fixed Header */}
      <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as GoalsTab)} className="w-full flex flex-col h-full">
        <HeaderTabsContainer
          tabs={
            <TabsList className="w-full p-0 px-4 items-center justify-start overflow-x-auto overflow-y-hidden inline-flex scrollbar-hide h-10">
              <TabsTrigger
                value="all"
                className="h-9 md:h-10 px-4 py-0 leading-none flex items-center justify-center gap-2 shadow-none data-[state=active]:shadow-none flex-shrink-0 min-w-[80px]"
              >
                All
              </TabsTrigger>
              <TabsTrigger
                value="active"
                className="h-9 md:h-10 px-4 py-0 leading-none flex items-center justify-center gap-2 shadow-none data-[state=active]:shadow-none flex-shrink-0 min-w-[80px]"
              >
                Active
              </TabsTrigger>
              <TabsTrigger
                value="completed"
                className="h-9 md:h-10 px-4 py-0 leading-none flex items-center justify-center gap-2 shadow-none data-[state=active]:shadow-none flex-shrink-0 min-w-[100px]"
              >
                Completed
              </TabsTrigger>
              <TabsTrigger
                value="created-by-me"
                className="h-9 md:h-10 px-4 py-0 leading-none flex items-center justify-center gap-2 shadow-none data-[state=active]:shadow-none flex-shrink-0 min-w-[80px]"
              >
                By Me
              </TabsTrigger>
              <TabsTrigger
                value="created-by-others"
                className="h-9 md:h-10 px-4 py-0 leading-none flex items-center justify-center gap-2 shadow-none data-[state=active]:shadow-none flex-shrink-0 min-w-[90px]"
              >
                By Others
              </TabsTrigger>
            </TabsList>
          }
        >
          {!isMobile && totalPages > 1 && (
            <div className="flex items-center justify-between min-h-[36px]">
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handlePageChange(currentPage - 1)}
                  disabled={currentPage === 1}
                  className="flex items-center gap-1"
                >
                  <ChevronLeft className="h-4 w-4" />
                  Previous
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handlePageChange(currentPage + 1)}
                  disabled={currentPage === totalPages}
                  className="flex items-center gap-1"
                >
                  Next
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
              <div className="text-sm text-muted-foreground flex items-center">
                Showing {startIndex + 1}-{Math.min(endIndex, filteredGoals.length)} of {filteredGoals.length} goals
              </div>
            </div>
          )}
        </HeaderTabsContainer>

        {/* Scrollable Content Area */}
        <div className="flex-1 overflow-y-auto" data-scroll-container>
          <div className="px-4 py-4">
            {filteredGoals.length === 0 ? (
              <Card>
                <CardContent className="text-center py-8">
                  <h3>
                    {activeTab === "completed"
                      ? "No completed goals yet"
                      : activeTab === "active"
                        ? "No active goals yet"
                        : activeTab === "created-by-me"
                          ? "No goals created by you yet"
                          : activeTab === "created-by-others"
                            ? "No goals created by others yet"
                            : "No goals yet"}
                  </h3>
                  <p className="text-body-sm text-muted-foreground mb-4">
                    {filteredGoals.length === 0 && goals.length > 0
                      ? "No goals match your current filter."
                      : activeTab === "completed"
                        ? "Complete some goals to see them here!"
                        : activeTab === "created-by-me"
                          ? "Create your first goal to get started!"
                          : activeTab === "created-by-others"
                            ? "Goals created by your supporters will appear here."
                            : "Create your first goal to get started on your journey!"}
                  </p>
                  {(activeTab === "active" || activeTab === "all" || activeTab === "created-by-me") && (
                    <div className="space-y-2">
                      <Button onClick={() => onNavigate("create-goal")} variant="outline">
                        <Plus className="h-4 w-4 mr-2" />
                        Create Your First Goal
                      </Button>
                      <p className="text-xs text-muted-foreground">Or suggest a goal for someone you support</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-4">
                {currentGoals.map((goal) => {
                  const isOwnGoal = goal.owner_id === currentUser?.id;
                  const isCreatedByMe = goal.created_by === currentUser?.id;
                  const ownerName = allProfiles[goal.owner_id]?.first_name || "Unknown";
                  const creatorName = allProfiles[goal.created_by]?.first_name || "Unknown";

                  return (
                    <GoalCard
                      key={goal.id}
                      goal={goal}
                      isOwnGoal={isOwnGoal}
                      isCreatedByMe={isCreatedByMe}
                      ownerName={ownerName}
                      creatorName={creatorName}
                      onCardClick={() => {
                        setSelectedGoalId(goal.id);
                        setIsSheetOpen(true);
                      }}
                      onChevronClick={() => {
                        setSelectedGoalId(goal.id);
                        setIsSheetOpen(true);
                      }}
                    />
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </Tabs>

      {/* Sheet for Goal Details */}
      <Sheet open={isSheetOpen} onOpenChange={setIsSheetOpen}>
        <SheetContent side="right" className="w-screen sm:max-w-none overflow-y-auto p-0">
          <div className="sticky top-0 bg-background z-10 border-b p-4">
            <SheetHeader>
              <SheetTitle>Goal Details</SheetTitle>
            </SheetHeader>
          </div>
          {selectedGoalId && (
            <GoalDetailV2
              goalId={selectedGoalId}
              onBack={() => {
                setIsSheetOpen(false);
                setSelectedGoalId(null);
              }}
            />
          )}
        </SheetContent>
      </Sheet>
    </div>
  );
};
