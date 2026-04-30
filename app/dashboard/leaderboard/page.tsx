import { getLeaderboard, LeaderboardTimeframe, getRankProgress, getRankColor } from "@/lib/xp-system";
import { requireUser } from "@/app/data/user/require-user";
import { prisma } from "@/lib/db";
import Image from "next/image";
import Link from "next/link";
import { Trophy, Medal, Star, Flame } from "lucide-react";
import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

export default async function LeaderboardPage(
  props: { searchParams: Promise<{ timeframe?: string }> }
) {
  const searchParams = await props.searchParams;
  const user = await requireUser();
  
  const dbUser = await prisma.user.findUnique({ 
    where: { id: user.id }, 
    select: { totalXP: true, currentStreak: true } 
  });
  
  const currentUserId = user.id;
  const userXP = dbUser?.totalXP || 0;
  
  const timeframe = (searchParams.timeframe as LeaderboardTimeframe) || "all-time";
  
  const leaderboardData = await getLeaderboard(timeframe, 50);

  // Timeframe selector component
  const TimeframeSelector = () => (
    <div className="flex bg-slate-100 p-1 rounded-lg w-full max-w-sm mb-6 dark:bg-slate-800">
      <Link href="/dashboard/leaderboard?timeframe=weekly" className={`flex-1 text-center py-2 text-sm font-medium rounded-md transition-all ${timeframe === 'weekly' ? 'bg-white shadow-sm text-blue-600 dark:bg-slate-700 dark:text-blue-400' : 'text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200'}`}>
        Weekly
      </Link>
      <Link href="/dashboard/leaderboard?timeframe=monthly" className={`flex-1 text-center py-2 text-sm font-medium rounded-md transition-all ${timeframe === 'monthly' ? 'bg-white shadow-sm text-blue-600 dark:bg-slate-700 dark:text-blue-400' : 'text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200'}`}>
        Monthly
      </Link>
      <Link href="/dashboard/leaderboard?timeframe=all-time" className={`flex-1 text-center py-2 text-sm font-medium rounded-md transition-all ${timeframe === 'all-time' ? 'bg-white shadow-sm text-blue-600 dark:bg-slate-700 dark:text-blue-400' : 'text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200'}`}>
        All Time
      </Link>
    </div>
  );

  const userProgress = currentUserId ? getRankProgress(userXP) : null;

  return (
    <div className="p-6 max-w-5xl mx-auto flex flex-col items-center">
      
      <div className="text-center mb-8">
        <h1 className="text-4xl font-extrabold tracking-tight text-slate-900 dark:text-white flex items-center justify-center gap-3">
          <Trophy className="w-10 h-10 text-yellow-500" />
          Global Leaderboard
        </h1>
        <p className="text-slate-500 dark:text-slate-400 mt-2">Compete with other learners and climb the ranks!</p>
      </div>

      {userProgress && (
        <div className="w-full max-w-3xl grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          
          {/* Rank Progress Card */}
          <div className="col-span-1 md:col-span-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm flex flex-col justify-center">
            <div className="flex items-center justify-between mb-4">
              <div>
                <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1 flex items-center gap-1.5"><Star className="w-4 h-4" /> Current Rank</p>
                <h3 className="text-2xl font-black flex items-center gap-2">
                  <span className={getRankColor(userProgress.currentRank)}>{userProgress.currentRank}</span>
                </h3>
              </div>
              <div className="text-right">
                <p className="text-3xl font-black text-blue-600 dark:text-blue-400">{userProgress.currentXP} XP</p>
                <p className="text-xs font-semibold text-slate-500 mt-1">{userProgress.neededXP > 0 ? `${userProgress.neededXP} XP needed` : "Max Rank Achieved!"}</p>
              </div>
            </div>
            
            <div className="mt-2">
              <div className="flex justify-between text-xs font-bold text-slate-400 mb-2">
                 <span>{userProgress.currentRank}</span>
                 <span>{userProgress.nextRank}</span>
              </div>
              <div className="w-full h-4 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden border border-slate-200 dark:border-slate-700">
                <div 
                  className="h-full bg-blue-500 rounded-full transition-all duration-500 ease-out shadow-inner"
                  style={{ width: `${userProgress.progressPercent}%` }}
                ></div>
              </div>
            </div>
          </div>
          
          {/* Daily Streak Card */}
          <div className="col-span-1 bg-gradient-to-br from-orange-50 to-red-50 dark:from-orange-950/40 dark:to-red-950/20 border border-orange-200 dark:border-orange-900/50 rounded-2xl p-6 shadow-sm flex flex-col items-center justify-center text-center relative overflow-hidden">
             <div className="absolute -top-4 -right-4 opacity-10">
                <Flame className="w-32 h-32 text-orange-600" />
             </div>
             <Flame className="w-10 h-10 text-orange-500 mb-3 drop-shadow-sm relative z-10" />
             <p className="text-xs font-extrabold text-orange-600 dark:text-orange-500 uppercase tracking-widest mb-1 relative z-10">Daily Streak</p>
             <div className="flex items-baseline gap-1.5 relative z-10">
               <span className="text-5xl font-black text-slate-900 dark:text-white drop-shadow-sm">{dbUser?.currentStreak || 0}</span>
               <span className="text-sm font-bold text-slate-600 dark:text-slate-400">{dbUser?.currentStreak === 1 ? 'Day' : 'Days'}</span>
             </div>
          </div>
          
        </div>
      )}

      <TimeframeSelector />

      {/* Top 3 Podium (optional UI enhancement) */}
      {leaderboardData.length >= 3 && (
        <div className="flex items-end justify-center gap-4 mb-10 w-full mt-4">
          {/* 2nd Place */}
          <div className="flex flex-col items-center flex-1 max-w-[120px]">
            <div className="relative">
              <div className="w-16 h-16 rounded-full border-4 border-gray-300 overflow-hidden bg-slate-200">
                {leaderboardData[1].image ? (
                   <Image src={leaderboardData[1].image} alt={leaderboardData[1].name} fill className="object-cover"/>
                ) : (
                  <div className="w-full h-full flex items-center justify-center font-bold text-gray-500 text-xl">{leaderboardData[1].name.charAt(0)}</div>
                )}
              </div>
              <div className="absolute -bottom-3 left-1/2 -translate-x-1/2 bg-gray-300 rounded-full w-8 h-8 flex items-center justify-center border-2 border-white font-bold text-gray-700 z-10 shadow-sm">
                2
              </div>
            </div>
            <div className="mt-5 text-center">
              <p className="font-semibold text-slate-800 dark:text-slate-200 truncate w-24">{leaderboardData[1].name}</p>
              <p className="text-sm font-bold text-gray-500">{leaderboardData[1].totalXP} XP</p>
            </div>
            <div className="w-full h-24 bg-gradient-to-t from-gray-200 to-gray-100 dark:from-slate-800 dark:to-slate-700 rounded-t-lg mt-2 border-t-4 border-gray-300 shadow-inner"></div>
          </div>

          {/* 1st Place */}
          <div className="flex flex-col items-center flex-1 max-w-[140px] z-10">
             <div className="relative">
                <Medal className="absolute -top-6 left-1/2 -translate-x-1/2 w-8 h-8 text-yellow-500 z-20" />
                <div className="w-20 h-20 rounded-full border-4 border-yellow-400 shadow-lg shadow-yellow-200/50 overflow-hidden bg-slate-200">
                  {leaderboardData[0].image ? (
                    <Image src={leaderboardData[0].image} alt={leaderboardData[0].name} fill className="object-cover"/>
                  ) : (
                    <div className="w-full h-full flex items-center justify-center font-bold text-yellow-600 text-2xl">{leaderboardData[0].name.charAt(0)}</div>
                  )}
                </div>
                <div className="absolute -bottom-4 left-1/2 -translate-x-1/2 bg-yellow-400 rounded-full w-10 h-10 flex items-center justify-center border-2 border-white font-black text-yellow-900 z-10 shadow-md">
                  1
                </div>
             </div>
             <div className="mt-6 text-center">
                <p className="font-bold text-slate-900 dark:text-white truncate w-28 text-lg">{leaderboardData[0].name}</p>
                <p className="text-sm font-black text-yellow-600 flex items-center justify-center gap-1"><Flame className="w-4 h-4" /> {leaderboardData[0].totalXP} XP</p>
             </div>
             <div className="w-full h-32 bg-gradient-to-t from-yellow-200 to-yellow-50 dark:from-yellow-900/40 dark:to-yellow-800/20 rounded-t-lg mt-2 border-t-4 border-yellow-400 shadow-inner"></div>
          </div>

          {/* 3rd Place */}
          <div className="flex flex-col items-center flex-1 max-w-[120px]">
             <div className="relative">
                <div className="w-16 h-16 rounded-full border-4 border-amber-600 overflow-hidden bg-slate-200">
                  {leaderboardData[2].image ? (
                     <Image src={leaderboardData[2].image} alt={leaderboardData[2].name} fill className="object-cover"/>
                  ) : (
                    <div className="w-full h-full flex items-center justify-center font-bold text-amber-700 text-xl">{leaderboardData[2].name.charAt(0)}</div>
                  )}
                </div>
                <div className="absolute -bottom-3 left-1/2 -translate-x-1/2 bg-amber-600 rounded-full w-8 h-8 flex items-center justify-center border-2 border-white font-bold text-white z-10 shadow-sm">
                  3
                </div>
             </div>
             <div className="mt-5 text-center">
                <p className="font-semibold text-slate-800 dark:text-slate-200 truncate w-24">{leaderboardData[2].name}</p>
                <p className="text-sm font-bold text-amber-600">{leaderboardData[2].totalXP} XP</p>
             </div>
             <div className="w-full h-20 bg-gradient-to-t from-orange-100 to-orange-50 dark:from-orange-900/30 dark:to-orange-800/10 rounded-t-lg mt-2 border-t-4 border-amber-600 shadow-inner"></div>
          </div>
        </div>
      )}

      {/* Leaderboard Table List */}
      <div className="w-full bg-white dark:bg-slate-900 rounded-xl shadow-sm border border-slate-200 dark:border-slate-800 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-800 text-sm font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                <th className="py-4 px-6 font-semibold">Rank</th>
                <th className="py-4 px-6 font-semibold">Student</th>
                <th className="py-4 px-6 font-semibold">Tier</th>
                <th className="py-4 px-6 font-semibold text-right">XP</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {(leaderboardData.length >= 3 ? leaderboardData.slice(3) : leaderboardData).map((user) => {
                const isCurrentUser = user.id === currentUserId;
                const rankColorClass = getRankColor(user.currentRank);
                
                return (
                  <tr 
                    key={user.id} 
                    className={`hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors ${
                      isCurrentUser ? 'bg-blue-50 dark:bg-blue-900/20 shadow-inner' : ''
                    }`}
                  >
                    <td className="py-4 px-6 font-semibold text-slate-500 dark:text-slate-400">
                      #{user.position}
                    </td>
                    <td className="py-4 px-6">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full overflow-hidden bg-slate-200 flex-shrink-0">
                           {user.image ? (
                             <Image src={user.image} alt={user.name} width={32} height={32} className="object-cover w-full h-full" />
                           ) : (
                             <div className="w-full h-full flex items-center justify-center font-medium text-slate-600 text-xs">
                               {user.name.charAt(0)}
                             </div>
                           )}
                        </div>
                        <span className={`font-medium ${isCurrentUser ? 'text-blue-700 dark:text-blue-400' : 'text-slate-900 dark:text-slate-100'}`}>
                          {user.name} {isCurrentUser && "(You)"}
                        </span>
                      </div>
                    </td>
                    <td className="py-4 px-6">
                      <span className={`px-3 py-1 rounded-full text-xs font-bold border ${
                         user.currentRank.includes("Platinum") ? "bg-slate-100 border-slate-300 text-slate-700" :
                         user.currentRank.includes("Gold") ? "bg-yellow-100 border-yellow-300 text-yellow-800" :
                         user.currentRank.includes("Silver") ? "bg-gray-100 border-gray-300 text-gray-700" :
                         user.currentRank.includes("Bronze") ? "bg-orange-100 border-orange-300 text-orange-800" :
                         "bg-slate-100 border-slate-200 text-slate-600"
                      }`}>
                        {user.currentRank}
                      </span>
                    </td>
                    <td className="py-4 px-6 font-bold text-right text-slate-700 dark:text-slate-300">
                      {/* Show period XP if available, else totalXP */}
                      {(user as any).periodXP ? (user as any).periodXP : user.totalXP} XP
                    </td>
                  </tr>
                );
              })}
              
              {leaderboardData.length === 0 && (
                <tr>
                  <td colSpan={4} className="py-10 text-center text-slate-500">
                    No leaderboard data available yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
