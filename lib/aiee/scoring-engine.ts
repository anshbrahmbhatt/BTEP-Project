export interface AnswerData {
  questionId: string;
  timeSpentMs: number;
  changedCount: number;
  isCorrect: boolean;
}

export interface VideoData {
  totalDuration: number;
  watchedDuration: number;
  skips: number;
  averageSpeed: number;
}

export interface EventData {
  type: string;
  timestamp: number;
  metadata?: any;
}

export interface ScoringResult {
  integrityScore: number;
  confidenceLevel: 'HIGH' | 'MODERATE' | 'LOW';
  subscores: {
    quizBehavior: number;
    answerPattern: number;
    learningEngagement: number;
  };
  flags: string[];
}

export class ScoringEngine {
  /**
   * Normalizes a value between 0 and 1, where higher means higher integrity.
   * If the value exceeds the maxThreshold, the score is 0.
   */
  private static normalizeInverse(value: number, maxThreshold: number): number {
    if (value >= maxThreshold) return 0;
    return 1 - (value / maxThreshold);
  }

  /**
   * Evaluates a student's attempt based on events, answers, and video behavior.
   */
  public static evaluateAttempt(
    events: EventData[], 
    answerData: AnswerData[], 
    videoData: VideoData | null
  ): ScoringResult {
    const flags: string[] = [];

    // 1. Quiz Behavior Score (Max weight: 50%)
    const tabSwitches = events.filter(e => e.type === 'TAB_SWITCH' && e.metadata?.action === 'hidden').length;
    const focusLost = events.filter(e => e.type === 'FOCUS_LOST').length;
    const copyPaste = events.filter(e => e.type === 'COPY_PASTE').length;

    const tabScore = this.normalizeInverse(tabSwitches, 5); // 5+ switches = 0 score
    const focusScore = this.normalizeInverse(focusLost, 10); // 10+ blur events = 0 score
    const copyScore = this.normalizeInverse(copyPaste, 3); // 3+ copy/pastes = 0 score
    
    // Weighted Quiz Behavior Score
    const quizBehaviorScore = (tabScore * 0.5) + (focusScore * 0.3) + (copyScore * 0.2);

    // 2. Answer Pattern Score (Max weight: 30%)
    // E.g., Answers submitted in < 2 seconds are suspiciously fast
    const rapidAnswers = answerData.filter(a => a.timeSpentMs < 2000).length;
    const answerPatternScore = this.normalizeInverse(rapidAnswers, Math.max(3, answerData.length * 0.2));

    // 3. Learning Engagement Score (Max weight: 20%)
    let learningEngagementScore = 1; // Default to 1 if no video data is required
    if (videoData && videoData.totalDuration > 0) {
      const watchRatio = videoData.watchedDuration / videoData.totalDuration;
      learningEngagementScore = Math.min(1, watchRatio); // Cap at 1
    }

    // Calculate Final Integrity Score (0 - 100)
    const finalScore = (
      (quizBehaviorScore * 0.5) +
      (answerPatternScore * 0.3) +
      (learningEngagementScore * 0.2)
    ) * 100;

    // Determine Confidence Level
    let confidenceLevel: 'HIGH' | 'MODERATE' | 'LOW' = 'LOW';
    if (finalScore >= 80) confidenceLevel = 'HIGH';
    else if (finalScore >= 50) confidenceLevel = 'MODERATE';

    // Generate Explanations / Flags
    if (tabSwitches >= 2) flags.push(`Detected ${tabSwitches} tab switches.`);
    if (focusLost >= 3) flags.push(`Lost window focus ${focusLost} times.`);
    if (copyPaste >= 1) flags.push(`Detected ${copyPaste} copy/paste actions.`);
    if (rapidAnswers >= 2) flags.push(`Suspiciously fast answering on ${rapidAnswers} questions.`);
    if (videoData && (videoData.watchedDuration / videoData.totalDuration) < 0.5) {
      flags.push('Low engagement with prerequisite course material.');
    }

    return {
      integrityScore: Math.round(finalScore),
      confidenceLevel,
      subscores: {
        quizBehavior: quizBehaviorScore,
        answerPattern: answerPatternScore,
        learningEngagement: learningEngagementScore
      },
      flags
    };
  }
}
