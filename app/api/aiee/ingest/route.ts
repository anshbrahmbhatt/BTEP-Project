import { NextResponse } from 'next/server';
import { requireUser } from '@/app/data/user/require-user';
import { prisma } from '@/lib/db';
import { AssessmentEventType } from '@/hooks/use-aiee-tracker';

export async function POST(req: Request) {
  try {
    const user = await requireUser();
    
    const body = await req.json();
    const { attemptId, events } = body;

    if (!attemptId || !events || !Array.isArray(events)) {
      return NextResponse.json({ error: 'Invalid payload' }, { status: 400 });
    }

    let penaltyPoints = 0;
    const newFlags: string[] = [];
    const dateStr = new Date().toLocaleDateString();

    // Calculate penalty based on the batched events
    events.forEach((event: { type: AssessmentEventType, metadata: any }) => {
      switch (event.type) {
        case 'TAB_SWITCH':
          if (event.metadata?.action === 'hidden') {
            penaltyPoints += 3; // 3 points for leaving tab
            newFlags.push(`Navigated away from quiz tab (-3 pts) on ${dateStr}`);
          }
          break;
        case 'FOCUS_LOST':
          penaltyPoints += 2; // 2 points for losing focus
          newFlags.push(`Quiz window lost focus (-2 pts) on ${dateStr}`);
          break;
        case 'COPY_PASTE':
          penaltyPoints += 5; // 5 points for copying/pasting during a quiz
          newFlags.push(`Copy/Paste action detected (-5 pts) on ${dateStr}`);
          break;
        case 'DEV_TOOLS':
          penaltyPoints += 15; // heavy penalty for dev tools
          newFlags.push(`Developer tools opened (-15 pts) on ${dateStr}`);
          break;
      }
    });

    if (penaltyPoints > 0) {
      // Fetch current user's integrity score and flags
      const dbUser = await prisma.user.findUnique({
        where: { id: user.id },
        select: { integrityScore: true, integrityFlags: true }
      });

      if (dbUser) {
        const currentScore = dbUser.integrityScore || 100;
        const newScore = Math.max(0, currentScore - penaltyPoints);
        
        // Append new flags to existing flags and keep only the latest 5
        let updatedFlags = [...(dbUser.integrityFlags || []), ...newFlags];
        if (updatedFlags.length > 5) {
          updatedFlags = updatedFlags.slice(updatedFlags.length - 5);
        }
        
        // Update score and flags in DB
        if (newScore !== currentScore || newFlags.length > 0) {
           await prisma.user.update({
             where: { id: user.id },
             data: { 
               integrityScore: newScore,
               integrityFlags: updatedFlags 
             }
           });
           console.log(`[AIEE] Deducted ${penaltyPoints} integrity points from user ${user.id}. New score: ${newScore}`);
        }
      }
    }

    return NextResponse.json({ success: true, penaltyApplied: penaltyPoints });
  } catch (error) {
    console.error('[AIEE] Ingest Error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
