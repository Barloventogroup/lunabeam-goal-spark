import { toast } from "sonner";

interface DailyCompletionData {
  daysCompleted: number;
  totalDays: number;
  streak: number;
  pointsEarnedToday: number;
  scheduledTime: string;
  goalTitle: string;
}

export const showDailyCompletionToast = (data: DailyCompletionData) => {
  const { daysCompleted, totalDays, streak, pointsEarnedToday, scheduledTime } = data;
  
  // Get streak message and emoji
  let streakEmoji = '';
  let streakMessage = '';
  if (streak >= 30) {
    streakEmoji = '🏆🏆🏆';
    streakMessage = `${streak}-day streak! LEGENDARY!`;
  } else if (streak >= 14) {
    streakEmoji = '🚀';
    streakMessage = `${streak}-day streak! Building habits!`;
  } else if (streak >= 7) {
    streakEmoji = '💪';
    streakMessage = `${streak}-day streak! One week strong!`;
  } else if (streak >= 3) {
    streakEmoji = '🔥';
    streakMessage = `${streak}-day streak! On fire!`;
  } else if (streak >= 1) {
    streakEmoji = '🌱';
    streakMessage = 'Great start!';
  }
  
  // Build toast description
  const descriptionParts = [
    streakMessage ? `${streakEmoji} ${streakMessage}` : '',
    `+${pointsEarnedToday} points earned today`,
    `${daysCompleted} of ${totalDays} days completed`,
    `Tomorrow at ${scheduledTime}`,
  ].filter(Boolean);
  
  toast.success(`🎉 Day ${daysCompleted} Complete!`, {
    description: descriptionParts.join('\n'),
    duration: 5000,
  });
};
