import { RefObject } from "react";
import { Card } from "@heroui/card";
import { Alert } from "@heroui/alert";

interface CameraViewProps {
  videoRef: RefObject<HTMLVideoElement>;
  canvasRef: RefObject<HTMLCanvasElement>;
  isLoading: boolean;
  captureEnabled: boolean;
  setCaptureEnabled: (enabled: boolean) => void;
  gestureProgress: number;
  cooldownRemaining: number;
  isWaitingToCapture: boolean;
  captureCountdown: number;
  showCooldownWarning: boolean;
}

export function CameraView({
  videoRef,
  canvasRef,
  isLoading,
  captureEnabled,
  setCaptureEnabled,
  gestureProgress,
  cooldownRemaining,
  isWaitingToCapture,
  captureCountdown,
  showCooldownWarning,
}: CameraViewProps) {
  return (
    <Card className="p-2 w-full">
      <div className="relative">
        <video ref={videoRef} autoPlay playsInline muted className="hidden" />
        <canvas
          ref={canvasRef}
          className="rounded-lg w-full"
          style={{
            display: isLoading || !captureEnabled ? "none" : "block",
            transform: "scaleX(-1)",
          }}
        />
        {(isLoading || !captureEnabled) && (
          <div className="flex flex-col items-center justify-center w-full h-[270px] bg-default-100 rounded-lg">
            {!captureEnabled ? (
              <>
                <div className="text-6xl mb-4">📷</div>
                <p className="text-default-600 text-sm font-semibold">
                  Camera is OFF
                </p>
                <p className="text-default-500 text-xs mt-2">
                  Click the button above to turn it on
                </p>
              </>
            ) : (
              <p className="text-default-600 text-sm">Loading camera...</p>
            )}
          </div>
        )}

        {/* Camera Toggle Overlay - Top Left */}
        <button
          onClick={() => setCaptureEnabled(!captureEnabled)}
          className={`absolute top-4 left-4 p-3 rounded-full shadow-lg backdrop-blur-sm transition-all z-10 ${
            captureEnabled
              ? "bg-green-500/90 hover:bg-green-600/90"
              : "bg-red-500/90 hover:bg-red-600/90"
          }`}
          title={
            captureEnabled
              ? "AI Detection ON - Click to turn OFF"
              : "AI Detection OFF - Click to turn ON"
          }
        >
          {captureEnabled ? (
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="w-6 h-6 text-white"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z"
              />
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M15 13a3 3 0 11-6 0 3 3 0 016 0z"
              />
            </svg>
          ) : (
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="w-6 h-6 text-white"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z"
              />
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M15 13a3 3 0 11-6 0 3 3 0 016 0z"
              />
              <line
                x1="3"
                y1="3"
                x2="21"
                y2="21"
                stroke="currentColor"
                strokeWidth={2}
                strokeLinecap="round"
              />
            </svg>
          )}
        </button>

        {/* Status Overlays - Bottom Section */}
        {captureEnabled && (
          <div className="absolute bottom-4 left-4 right-4 space-y-2">
            {/* Hand Removal Countdown */}
            {isWaitingToCapture && (
              <Alert
                color="primary"
                title="✋ Move your hand away!"
                description={`Capturing in ${captureCountdown}...`}
                className="animate-pulse"
              />
            )}

            {/* Cooldown Warning */}
            {showCooldownWarning &&
              cooldownRemaining > 0 &&
              !isWaitingToCapture && (
                <Alert
                  color="warning"
                  title="⚠️ Magic still recharging!"
                  description={`Wait ${Math.ceil(cooldownRemaining / 1000)} more seconds to cast again`}
                  className="animate-pulse"
                />
              )}

            {/* Cooldown Status */}
            {cooldownRemaining > 0 &&
              !showCooldownWarning &&
              !isWaitingToCapture && (
                <Alert
                  color="warning"
                  title="✏️ Write more! Magic recharging..."
                  description={`Next spell in ${Math.ceil(cooldownRemaining / 1000)} seconds`}
                  variant="flat"
                />
              )}

            {/* Gesture Progress Bar */}
            {cooldownRemaining === 0 &&
              gestureProgress > 0 &&
              !isWaitingToCapture && (
                <div className="bg-black/50 backdrop-blur-sm rounded-lg p-3">
                  <div className="relative w-full h-6 bg-white/20 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-blue-500 to-cyan-500 transition-all duration-100 flex items-center justify-center"
                      style={{ width: `${gestureProgress}%` }}
                    >
                      {gestureProgress > 10 && (
                        <span className="text-xs font-bold text-white">
                          {Math.round(gestureProgress)}%
                        </span>
                      )}
                    </div>
                  </div>
                  <p className="text-xs text-center text-white mt-1 font-semibold">
                    Hold thumbs up to cast spell! 👍✨
                  </p>
                </div>
              )}
          </div>
        )}
      </div>
    </Card>
  );
}
