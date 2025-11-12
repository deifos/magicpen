import { useEffect, useState } from "react";
import { GestureRecognizer, FilesetResolver } from "@mediapipe/tasks-vision";

export function useHandTracking() {
  const [gestureRecognizer, setGestureRecognizer] = useState<GestureRecognizer | null>(
    null
  );
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let recognizer: GestureRecognizer | null = null;

    const initializeGestureRecognizer = async () => {
      try {
        const vision = await FilesetResolver.forVisionTasks(
          "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@latest/wasm"
        );

        recognizer = await GestureRecognizer.createFromOptions(vision, {
          baseOptions: {
            modelAssetPath:
              "https://storage.googleapis.com/mediapipe-models/gesture_recognizer/gesture_recognizer/float16/1/gesture_recognizer.task",
            delegate: "GPU",
          },
          runningMode: "VIDEO",
          numHands: 1,
          minHandDetectionConfidence: 0.5,
          minHandPresenceConfidence: 0.5,
          minTrackingConfidence: 0.5,
          cannedGesturesClassifierOptions: {
            scoreThreshold: 0.5,
            categoryAllowlist: ["Thumb_Up"],
          },
        });

        // Give the recognizer a moment to fully initialize
        await new Promise(resolve => setTimeout(resolve, 100));

        setGestureRecognizer(recognizer);
        setIsLoading(false);
        console.log("✅ GestureRecognizer initialized successfully");
      } catch (err) {
        console.error("Error initializing gesture recognizer:", err);
        setError("Failed to initialize gesture recognition");
        setIsLoading(false);
      }
    };

    initializeGestureRecognizer();

    return () => {
      if (recognizer) {
        recognizer.close();
      }
    };
  }, []);

  return { gestureRecognizer, isLoading, error };
}
