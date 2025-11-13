"use client";

import {
  useEffect,
  useRef,
  useState,
  useImperativeHandle,
  forwardRef,
} from "react";
import { useHandTracking, useCamera, useTapGesture } from "@/hooks";
import { CameraView, GestureMessage, InstructionsCard } from "./camera";

export interface CameraCaptureRef {
  captureFrame: () => Promise<Blob | null>;
}

interface CameraCaptureProps {
  onCapture?: (imageBlob: Blob, selectedStyleUrl: string) => void;
  lastCapturedText?: string;
}

export const CameraCapture = forwardRef<CameraCaptureRef, CameraCaptureProps>(
  ({ onCapture, lastCapturedText }, ref) => {
    const videoRef = useRef<HTMLVideoElement>(null);
    const canvasRef = useRef<HTMLCanvasElement>(null);

    const [message, setMessage] = useState<string>("");
    const [tapCount, setTapCount] = useState(0);
    const [gestureProgress, setGestureProgress] = useState(0); // 0-100%
    const [captureEnabled, setCaptureEnabled] = useState(false);
    const [cooldownEndsAt, setCooldownEndsAt] = useState<number>(0);
    const [cooldownRemaining, setCooldownRemaining] = useState<number>(0);
    const [showCooldownWarning, setShowCooldownWarning] = useState(false);
    const [selectedStyle, setSelectedStyle] = useState<string>("style1");
    const [isWaitingToCapture, setIsWaitingToCapture] = useState(false);
    const [captureCountdown, setCaptureCountdown] = useState(0);

    const COOLDOWN_DURATION = 45000; // 45 seconds

    const styles = [
      {
        id: "style1",
        name: "Style 1",
        image: "/styles/style1.png",
        url: "https://v3b.fal.media/files/b/lion/IEP3uGaGWS72ZkUem9cKV_style1.png",
      },
      {
        id: "style2",
        name: "Style 2",
        image: "/styles/style2.png",
        url: "https://v3b.fal.media/files/b/panda/9zG6V8gEHgbrtSwC7pgLA_style2.png",
      },
    ];

    const [isReady, setIsReady] = useState(false);
    const streamRef = useRef<MediaStream | null>(null);
    const { gestureRecognizer, isLoading: isGestureLoading } =
      useHandTracking();

    // Start/Stop Camera based on captureEnabled
    useEffect(() => {
      const startCamera = async () => {
        try {
          console.log("Starting camera...");
          const stream = await navigator.mediaDevices.getUserMedia({
            video: { facingMode: "user", width: 480, height: 360 },
          });

          if (videoRef.current && canvasRef.current) {
            const video = videoRef.current;
            const canvas = canvasRef.current;
            video.srcObject = stream;
            streamRef.current = stream;

            video.addEventListener("loadedmetadata", async () => {
              canvas.width = video.videoWidth;
              canvas.height = video.videoHeight;
              await video.play();
              setIsReady(true);
              console.log("Camera ready");
            });
          }
        } catch (err) {
          console.error("Error accessing camera:", err);
        }
      };

      const stopCamera = () => {
        console.log("Stopping camera...");
        if (streamRef.current) {
          streamRef.current.getTracks().forEach((track) => track.stop());
          streamRef.current = null;
        }
        if (videoRef.current) {
          videoRef.current.srcObject = null;
        }
        setIsReady(false);
      };

      if (captureEnabled) {
        startCamera();
      } else {
        stopCamera();
      }

      return () => {
        stopCamera();
      };
    }, [captureEnabled, videoRef, canvasRef]);

    // Expose capture function via ref
    useImperativeHandle(ref, () => ({
      captureFrame: async () => {
        if (!canvasRef.current) return null;

        return new Promise((resolve) => {
          canvasRef.current?.toBlob((blob) => {
            resolve(blob);
          }, "image/jpeg");
        });
      },
    }));

    const handleTapDetected = async () => {
      setTapCount((prev) => prev + 1);
      setGestureProgress(0);

      // Always set cooldown, regardless of captureEnabled
      const cooldownEnd = Date.now() + COOLDOWN_DURATION;
      setCooldownEndsAt(cooldownEnd);

      if (captureEnabled) {
        // Start countdown for user to move hand
        setIsWaitingToCapture(true);
        setCaptureCountdown(5);

        // Countdown from 5 to 1
        setTimeout(() => setCaptureCountdown(4), 1000);
        setTimeout(() => setCaptureCountdown(3), 2000);
        setTimeout(() => setCaptureCountdown(2), 3000);
        setTimeout(() => setCaptureCountdown(1), 4000);

        // Capture after 5 seconds
        setTimeout(() => {
          setMessage("✨💥 SPELL CAST! CAPTURING MAGIC... 💥✨");
          setTimeout(() => setMessage(""), 3000);
          setIsWaitingToCapture(false);
          setCaptureCountdown(0);

          // Capture and process the frame
          if (onCapture && canvasRef.current) {
            const selectedStyleObj = styles.find((s) => s.id === selectedStyle);
            const styleUrl = selectedStyleObj?.url || styles[0].url;

            canvasRef.current.toBlob((blob) => {
              if (blob) {
                onCapture(blob, styleUrl);
              }
            }, "image/jpeg");
          }
        }, 5000);
      } else {
        setMessage(
          "✨ Spell detected! (Capture disabled - turn it on to cast real magic!)"
        );
        setTimeout(() => setMessage(""), 3000);
      }
    };

    const handleCooldownAttempt = () => {
      setShowCooldownWarning(true);
      setTimeout(() => setShowCooldownWarning(false), 3000);
    };

    const { detectTap } = useTapGesture(handleTapDetected, {
      onProgressUpdate: (progress) => {
        // Only show progress if capture is enabled
        setGestureProgress(captureEnabled ? progress : 0);
      },
      isOnCooldown: cooldownRemaining > 0,
      onCooldownAttempt: handleCooldownAttempt,
    });

    // Track cooldown remaining time
    useEffect(() => {
      if (cooldownEndsAt === 0) {
        setCooldownRemaining(0);
        return;
      }

      const updateCooldown = () => {
        const now = Date.now();
        const remaining = Math.max(0, cooldownEndsAt - now);
        setCooldownRemaining(remaining);

        if (remaining === 0) {
          setCooldownEndsAt(0);
        }
      };

      updateCooldown();
      const interval = setInterval(updateCooldown, 100);

      return () => clearInterval(interval);
    }, [cooldownEndsAt]);

    useEffect(() => {
      // Only process frames when camera is enabled and ready
      if (!captureEnabled || !isReady) {
        return;
      }

      let animationFrameId: number;
      let lastVideoTime = -1;

      const processFrame = () => {
        if (!videoRef.current || !canvasRef.current) {
          animationFrameId = requestAnimationFrame(processFrame);
          return;
        }

        const video = videoRef.current;
        const canvas = canvasRef.current;

        if (video.readyState < 2) {
          animationFrameId = requestAnimationFrame(processFrame);
          return;
        }

        const ctx = canvas.getContext("2d");

        if (!ctx) {
          animationFrameId = requestAnimationFrame(processFrame);
          return;
        }

        if (
          canvas.width !== video.videoWidth ||
          canvas.height !== video.videoHeight
        ) {
          canvas.width = video.videoWidth;
          canvas.height = video.videoHeight;
        }

        try {
          ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        } catch (error) {
          console.error("Error drawing video to canvas:", error);
        }

        if (
          gestureRecognizer &&
          !isGestureLoading &&
          typeof gestureRecognizer.recognizeForVideo === "function" &&
          video.readyState >= 2
        ) {
          const currentTime = video.currentTime;
          if (currentTime !== lastVideoTime) {
            lastVideoTime = currentTime;

            try {
              const nowInMs = performance.now();
              const results = gestureRecognizer.recognizeForVideo(
                video,
                nowInMs
              );

              // Always update gesture state, even during cooldown
              if (results && results.gestures && results.gestures.length > 0) {
                // Extract gesture name
                const gesture =
                  results.gestures[0]?.[0]?.categoryName || "None";
                detectTap(gesture);
              } else {
                // No gesture detected, pass "None"
                detectTap("None");
              }
            } catch (error) {
              // Silently ignore errors during initialization
              if (
                error instanceof Error &&
                !error.message.includes("XNNPACK")
              ) {
                console.error("Error during gesture recognition:", error);
              }
            }
          }
        }

        animationFrameId = requestAnimationFrame(processFrame);
      };

      processFrame();

      return () => {
        if (animationFrameId) {
          cancelAnimationFrame(animationFrameId);
        }
      };
    }, [
      gestureRecognizer,
      isGestureLoading,
      detectTap,
      cooldownRemaining,
      captureEnabled,
      isReady,
      videoRef,
      canvasRef,
    ]);

    return (
      <div className="flex flex-col items-center gap-4 w-full">
        <CameraView
          videoRef={videoRef}
          canvasRef={canvasRef}
          isLoading={!isReady}
          captureEnabled={captureEnabled}
          setCaptureEnabled={setCaptureEnabled}
          gestureProgress={gestureProgress}
          cooldownRemaining={cooldownRemaining}
          isWaitingToCapture={isWaitingToCapture}
          captureCountdown={captureCountdown}
          showCooldownWarning={showCooldownWarning}
        />

        {/* Style Picker */}
        <div className="w-full px-4">
          <div className="bg-default-100 rounded-lg p-3">
            <h3 className="text-sm font-semibold mb-2">Choose Art Style ✨</h3>
            <div className="flex gap-2">
              {styles.map((style) => (
                <button
                  key={style.id}
                  onClick={() => setSelectedStyle(style.id)}
                  className={`relative flex-1 rounded-lg overflow-hidden border-3 transition-all ${
                    selectedStyle === style.id
                      ? "border-blue-500 scale-105 shadow-lg"
                      : "border-default-300 hover:border-blue-300"
                  }`}
                >
                  <div className="w-full h-20 overflow-hidden relative">
                    <img
                      src={style.image}
                      alt={style.name}
                      className="w-full h-full object-cover"
                      style={{
                        transform: "scale(2)",
                        objectPosition: "25% 25%",
                      }}
                    />
                    {selectedStyle === style.id && (
                      <div className="absolute top-1 right-1 bg-blue-500 rounded-full w-6 h-6 flex items-center justify-center shadow-md">
                        <span className="text-white text-sm font-bold">✓</span>
                      </div>
                    )}
                  </div>
                  <p
                    className={`text-xs text-center py-1 ${
                      selectedStyle === style.id
                        ? "bg-blue-500 text-white font-semibold"
                        : "bg-default-200"
                    }`}
                  >
                    {style.name}
                  </p>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Last Captured Text */}
        {lastCapturedText && (
          <div className="w-full px-4">
            <div className="bg-green-50 border border-green-300 rounded-lg p-3">
              <h3 className="text-sm font-semibold text-green-800 mb-1">
                ✅ Last Captured
              </h3>
              <p className="text-xs text-green-700 italic">
                "{lastCapturedText}"
              </p>
              <p className="text-xs text-green-600 mt-2">
                💡 Write something new to continue your story!
              </p>
            </div>
          </div>
        )}

        <GestureMessage message={message} tapCount={tapCount} />
        <InstructionsCard />
      </div>
    );
  }
);

CameraCapture.displayName = "CameraCapture";
