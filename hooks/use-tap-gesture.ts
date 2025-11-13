import { useRef, useCallback } from "react";

interface UseTapGestureOptions {
  holdTime?: number;
  onProgressUpdate?: (progress: number) => void;
  isOnCooldown?: boolean;
  onCooldownAttempt?: () => void;
}

export function useTapGesture(
  onTapDetected: () => void,
  options: UseTapGestureOptions = {}
) {
  const {
    holdTime = 5000, // 5 seconds
    onProgressUpdate,
    isOnCooldown = false,
    onCooldownAttempt,
  } = options;

  const thumbsUpStartTimeRef = useRef<number>(0);
  const progressIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const cooldownUntilRef = useRef<number>(0);
  const wasThumbsUpRef = useRef<boolean>(false);
  const lastCooldownWarningRef = useRef<number>(0);

  const detectTap = useCallback(
    (gesture: string) => {
      const isThumbsUp = gesture === "Thumb_Up";
      const now = Date.now();
      const onCooldown = now < cooldownUntilRef.current;

      console.log(
        "Gesture:",
        gesture,
        "| Thumbs Up:",
        isThumbsUp,
        "| Cooldown:",
        onCooldown
      );

      if (isThumbsUp) {
        // Don't start tracking if on cooldown
        if (onCooldown) {
          // Show warning if thumbs up just detected (transition from down to up)
          if (!wasThumbsUpRef.current) {
            onCooldownAttempt?.();
            lastCooldownWarningRef.current = now;
          }
          // Just track that thumb is up, but don't start counting
          wasThumbsUpRef.current = true;
          return;
        }

        // Only start tracking if thumbs up was previously down (fresh gesture)
        // This prevents re-triggering if user keeps holding thumbs up
        if (thumbsUpStartTimeRef.current === 0 && !wasThumbsUpRef.current) {
          thumbsUpStartTimeRef.current = now;
          console.log("👍 THUMBS UP DETECTED - Hold it!");

          // Start progress update interval
          if (progressIntervalRef.current) {
            clearInterval(progressIntervalRef.current);
          }
          progressIntervalRef.current = setInterval(() => {
            const elapsed = Date.now() - thumbsUpStartTimeRef.current;
            const progress = Math.min((elapsed / holdTime) * 100, 100);
            onProgressUpdate?.(progress);

            if (progress >= 100) {
              if (progressIntervalRef.current) {
                clearInterval(progressIntervalRef.current);
                progressIntervalRef.current = null;
              }
            }
          }, 50);
        }

        // Check if held long enough
        const heldDuration = now - thumbsUpStartTimeRef.current;
        if (heldDuration >= holdTime && thumbsUpStartTimeRef.current !== 0) {
          console.log("✨💥 SPELL CAST! THUMBS UP HELD FOR 5 SECONDS!");

          // Set cooldown IMMEDIATELY (45 seconds)
          cooldownUntilRef.current = now + 45000;

          // Reset everything
          thumbsUpStartTimeRef.current = 0;

          if (progressIntervalRef.current) {
            clearInterval(progressIntervalRef.current);
            progressIntervalRef.current = null;
          }

          onProgressUpdate?.(100);
          setTimeout(() => onProgressUpdate?.(0), 500);

          // Trigger the callback
          onTapDetected();
        }

        wasThumbsUpRef.current = true;
      } else {
        // Not thumbs up - reset
        if (thumbsUpStartTimeRef.current !== 0) {
          console.log("❌ Lost thumbs up - resetting");
          thumbsUpStartTimeRef.current = 0;

          if (progressIntervalRef.current) {
            clearInterval(progressIntervalRef.current);
            progressIntervalRef.current = null;
          }

          onProgressUpdate?.(0);
        }

        wasThumbsUpRef.current = false;
      }
    },
    [holdTime, onTapDetected, onProgressUpdate]
  );

  return { detectTap };
}
