import { RefObject } from "react";
import { Card } from "@heroui/card";

interface CameraViewProps {
  videoRef: RefObject<HTMLVideoElement>;
  canvasRef: RefObject<HTMLCanvasElement>;
  isLoading: boolean;
}

export function CameraView({
  videoRef,
  canvasRef,
  isLoading,
}: CameraViewProps) {
  return (
    <Card className="p-2">
      <div className="relative">
        <video ref={videoRef} autoPlay playsInline muted className="hidden" />
        <canvas
          ref={canvasRef}
          className="rounded-lg w-full"
          style={{
            display: isLoading ? "none" : "block",
            transform: "scaleX(-1)"
          }}
        />
        {isLoading && (
          <div className="flex items-center justify-center w-full h-[270px] bg-default-100 rounded-lg">
            <p className="text-default-600 text-sm">Loading camera...</p>
          </div>
        )}
      </div>
    </Card>
  );
}
