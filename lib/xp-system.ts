import { prisma as db } from "@/lib/db";
import { ActivityType } from "@/lib/generated/prisma";

const XP_MULTIPLIER = 1;

const XP_VALUES: Record<ActivityType, number> = {
  LESSON_COMPLETED: 50,
  QUIZ_PASSED: 100,
  DAILY_LOGIN: 20,
  DISCUSSION_PARTICIPATION: 10,
  VIDEO_WATCHED: 30, // Could be dynamic based on % watched
};

const TIERS = [
  { rank: "Platinum 3", minXP: 12000, color: "text-slate-400 font-extrabold" },
  { rank: "Platinum 2", minXP: 10500, color: "text-slate-400 font-extrabold" },
  { rank: "Platinum 1", minXP: 9000, color: "text-slate-400 font-extrabold" },
  { rank: "Gold 3", minXP: 7500, color: "text-yellow-400 font-bold" },
  { rank: "Gold 2", minXP: 6000, color: "text-yellow-400 font-bold" },
  { rank: "Gold 1", minXP: 5000, color: "text-yellow-400 font-bold" },
  { rank: "Silver 3", minXP: 4000, color: "text-gray-300 font-bold" },
  { rank: "Silver 2", minXP: 3000, color: "text-gray-300 font-bold" },
  { rank: "Silver 1", minXP: 2000, color: "text-gray-300 font-bold" },
  { rank: "Bronze 3", minXP: 1500, color: "text-amber-600 font-medium" },
  { rank: "Bronze 2", minXP: 1000, color: "text-amber-600 font-medium" },
  { rank: "Bronze 1", minXP: 500, color: "text-amber-600 font-medium" },
  { rank: "Beginner", minXP: 0, color: "text-gray-500" },
];

function calculateRank(xp: number): string {
  for (const tier of TIERS) {
    if (xp >= tier.minXP) {
      return tier.rank;
    }
  }
  return "Beginner";
}

export function getRankColor(rank: string): string {
  const tier = TIERS.find(t => t.rank === rank);
  return tier?.color || "text-gray-500";
}

export function getRankProgress(xp: number) {
  for (let i = 0; i < TIERS.length; i++) {
    if (xp >= TIERS[i].minXP) {
      if (i === 0) {
        // Max rank
        return {
          currentRank: TIERS[0].rank,
          nextRank: "MAX",
          currentXP: xp,
          neededXP: 0,
          targetXP: xp,
          progressPercent: 100
        };
      } else {
        const currentTier = TIERS[i];
        const nextTier = TIERS[i - 1];
        const range = nextTier.minXP - currentTier.minXP;
        const earnedInTier = xp - currentTier.minXP;
        
        return {
          currentRank: currentTier.rank,
          nextRank: nextTier.rank,
          currentXP: xp,
          neededXP: nextTier.minXP - xp,
          targetXP: nextTier.minXP,
          progressPercent: Math.min(100, Math.floor((earnedInTier / range) * 100))
        };
      }
    }
  }
  
  // Should theoretically never hit if Beginner is 0
  return {
    currentRank: "Beginner",
    nextRank: "Bronze 1",
    currentXP: xp,
    neededXP: 500 - xp,
    targetXP: 500,
    progressPercent: Math.floor((xp / 500) * 100)
  };
}

export async function addXP(userId: string, activityType: ActivityType) {
  const baseXP = XP_VALUES[activityType] || 0;
  const xpEarned = baseXP * XP_MULTIPLIER;

  // Transaction to ensure atomicity
  return await db.$transaction(async (tx: any) => {
    // 1. Log the activity
    await tx.xPLog.create({
      data: {
        userId,
        activityType,
        xpEarned,
      },
    });

    // 2. Get user's current XP and streak info
    const user = await tx.user.findUnique({
      where: { id: userId },
      select: { totalXP: true, currentRank: true, currentStreak: true, longestStreak: true, lastXPDate: true, integrityScore: true, lastIntegrityDate: true }
    });

    if (!user) throw new Error("User not found");

    const newTotalXP = user.totalXP + xpEarned;
    const newRank = calculateRank(newTotalXP);

    // Calculate streak
    let newStreak = user.currentStreak || 0;
    let newLongestStreak = user.longestStreak || 0;
    let newLastXPDate = new Date();
    
    if (user.lastXPDate) {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      const lastXP = new Date(user.lastXPDate);
      lastXP.setHours(0, 0, 0, 0);
      
      const diffTime = Math.abs(today.getTime() - lastXP.getTime());
      const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
      
      if (diffDays === 1) {
        // Earned XP yesterday, increment streak
        newStreak += 1;
        if (newStreak > newLongestStreak) {
          newLongestStreak = newStreak;
        }
      } else if (diffDays > 1) {
        // Missed a day or more, reset streak
        newStreak = 1;
      }
      // If diffDays === 0, streak stays the same
    } else {
      // First time earning XP
      newStreak = 1;
      newLongestStreak = 1;
    }

    // Calculate integrity updates
    let newIntegrityScore = user.integrityScore || 100;
    let newLastIntegrityDate = user.lastIntegrityDate;

    if (activityType === ActivityType.DAILY_LOGIN) {
      newIntegrityScore = Math.min(100, newIntegrityScore + 10);
      newLastIntegrityDate = new Date();
    }

    // 3. Update user and return new state
    const updatedUser = await tx.user.update({
      where: { id: userId },
      data: {
        totalXP: newTotalXP,
        currentRank: newRank,
        currentStreak: newStreak,
        longestStreak: newLongestStreak,
        lastXPDate: newLastXPDate,
        integrityScore: newIntegrityScore,
        lastIntegrityDate: newLastIntegrityDate
      },
      select: {
        id: true,
        totalXP: true,
        currentRank: true,
        currentStreak: true,
        name: true
      }
    });

    return {
      success: true,
      user: updatedUser,
      xpEarned,
      rankUp: user.currentRank !== newRank // indicates if rank changed
    };
  });
}

export type LeaderboardTimeframe = 'all-time' | 'weekly' | 'monthly';

export async function getLeaderboard(timeframe: LeaderboardTimeframe = 'all-time', limit: number = 50) {
  
  if (timeframe === 'all-time') {
    // Simply fetch top users by totalXP
    const users = await db.user.findMany({
      orderBy: { totalXP: 'desc' },
      take: limit,
      select: {
        id: true,
        name: true,
        image: true,
        totalXP: true,
        currentRank: true,
      }
    });
    
    return users.map((user: any, index: number) => ({
      ...user,
      name: user.name || 'Anonymous Learner',
      position: index + 1
    }));
  } else {
    // For weekly/monthly we calculate XP earned within that period
    const now = new Date();
    let startDate = new Date();
    
    if (timeframe === 'weekly') {
      startDate.setDate(now.getDate() - 7);
    } else if (timeframe === 'monthly') {
      startDate.setMonth(now.getMonth() - 1);
    }
    
    // Using Prisma aggregation to sum XP logically within timeframe
    const xpLogs = await db.xPLog.groupBy({
      by: ['userId'],
      where: {
        createdAt: {
          gte: startDate
        }
      },
      _sum: {
        xpEarned: true
      },
      orderBy: {
        _sum: {
          xpEarned: 'desc'
        }
      },
      take: limit
    });
    
    // Now get the users for these logs
    const topUsers = await Promise.all(xpLogs.map(async (log: any, index: number) => {
      const u = await db.user.findUnique({
        where: { id: log.userId },
        select: { id: true, name: true, image: true, currentRank: true, totalXP: true }
      });
      return {
        id: u?.id || log.userId,
        name: u?.name || 'Anonymous Learner',
        image: u?.image || null,
        currentRank: u?.currentRank || 'Beginner',
        totalXP: u?.totalXP || 0, // This is total all-time XP, but we rank by period XP
        periodXP: log._sum.xpEarned || 0,
        position: index + 1
      };
    }));
    
    return topUsers;
  }
}

export async function trackDailyLogin(userId: string) {
  const user = await db.user.findUnique({
    where: { id: userId },
    select: { lastXPDate: true }
  });
  
  if (!user) return;
  
  if (user.lastXPDate) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const lastXP = new Date(user.lastXPDate);
    lastXP.setHours(0, 0, 0, 0);
    
    if (today.getTime() === lastXP.getTime()) {
      return;
    }
  }
  
  await addXP(userId, ActivityType.DAILY_LOGIN);
}
