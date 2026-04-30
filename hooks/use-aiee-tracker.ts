import { useEffect, useRef, useCallback } from 'react';

export type AssessmentEventType = 'TAB_SWITCH' | 'FOCUS_LOST' | 'COPY_PASTE' | 'DEV_TOOLS' | 'IDLE';

export interface TrackedEvent {
  type: AssessmentEventType;
  timestamp: number;
  metadata?: any;
}

/**
 * Hook to track student behavior during an assessment.
 * Automatically tracks visibility changes, focus changes, copy/paste, and idle time.
 * @param attemptId The ID of the current assessment attempt
 */
export function useAssessmentTracker(attemptId: string) {
  const eventsBuffer = useRef<TrackedEvent[]>([]);
  const lastActiveTime = useRef<number>(Date.now());
  const IDLE_THRESHOLD = 60000; // 1 minute

  const logEvent = useCallback((type: AssessmentEventType, metadata?: any) => {
    eventsBuffer.current.push({
      type,
      timestamp: Date.now(),
      metadata,
    });
    
    // Optional: Log to console in development
    if (process.env.NODE_ENV === 'development') {
      console.log(`[AIEE Tracker] Event logged: ${type}`, metadata);
    }
  }, []);

  // Flush events to backend periodically
  useEffect(() => {
    if (!attemptId) return;

    const flushInterval = setInterval(() => {
      if (eventsBuffer.current.length > 0) {
        // Send events to ingestion API
        fetch('/api/aiee/ingest', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ attemptId, events: eventsBuffer.current }),
        }).catch(err => console.error('[AIEE Tracker] Failed to ingest events:', err));
        
        eventsBuffer.current = []; // Clear buffer after sending
      }
    }, 10000); // Flush every 10 seconds

    return () => {
      clearInterval(flushInterval);
      // Try to flush remaining events on unmount using sendBeacon if possible
      if (eventsBuffer.current.length > 0 && navigator.sendBeacon) {
         navigator.sendBeacon(
           '/api/aiee/ingest', 
           JSON.stringify({ attemptId, events: eventsBuffer.current })
         );
      }
    };
  }, [attemptId]);

  // Track Visibility (Tab Switches)
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.hidden) {
        logEvent('TAB_SWITCH', { action: 'hidden' });
      } else {
        logEvent('TAB_SWITCH', { action: 'visible' });
      }
    };
    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, [logEvent]);

  // Track Window Focus/Blur
  useEffect(() => {
    const handleBlur = () => logEvent('FOCUS_LOST');
    window.addEventListener('blur', handleBlur);
    return () => window.removeEventListener('blur', handleBlur);
  }, [logEvent]);

  // Track Copy/Paste
  useEffect(() => {
    const handleCopyPaste = (e: ClipboardEvent) => {
      logEvent('COPY_PASTE', { action: e.type });
    };
    document.addEventListener('copy', handleCopyPaste);
    document.addEventListener('paste', handleCopyPaste);
    return () => {
      document.removeEventListener('copy', handleCopyPaste);
      document.removeEventListener('paste', handleCopyPaste);
    };
  }, [logEvent]);

  // Track Idle Time
  useEffect(() => {
    const resetIdle = () => { lastActiveTime.current = Date.now(); };
    window.addEventListener('mousemove', resetIdle);
    window.addEventListener('keydown', resetIdle);
    window.addEventListener('scroll', resetIdle);

    const idleInterval = setInterval(() => {
      if (Date.now() - lastActiveTime.current > IDLE_THRESHOLD) {
        logEvent('IDLE', { duration: Date.now() - lastActiveTime.current });
        resetIdle(); // Reset to avoid spamming IDLE events
      }
    }, 10000);

    return () => {
      window.removeEventListener('mousemove', resetIdle);
      window.removeEventListener('keydown', resetIdle);
      window.removeEventListener('scroll', resetIdle);
      clearInterval(idleInterval);
    };
  }, [logEvent]);

  return { logEvent };
}
