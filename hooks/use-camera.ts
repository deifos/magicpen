import { useEffect, useState, RefObject } from "react";

interface UseCameraOptions {
  width?: number;
  height?: number;
  facingMode?: "user" | "environment";
}

export function useCamera(
  videoRef: RefObject<HTMLVideoElement>,
  canvasRef: RefObject<HTMLCanvasElement>,
  options: UseCameraOptions = {}
) {
  const { width = 480, height = 360, facingMode = "user" } = options;

  const [isReady, setIsReady] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let hasInitialized = false;

    const startCamera = async () => {
      console.log("Starting camera...");
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode, width, height },
        });
        console.log("Camera stream obtained");

        if (videoRef.current && canvasRef.current) {
          const video = videoRef.current;
          const canvas = canvasRef.current;

          video.srcObject = stream;
          console.log("Video srcObject set");

          const handleLoadedMetadata = async () => {
            if (hasInitialized) return;
            hasInitialized = true;

            console.log("Video metadata loaded");
            canvas.width = video.videoWidth;
            canvas.height = video.videoHeight;
            console.log(
              "Video size:",
              video.videoWidth,
              "x",
              video.videoHeight
            );

            try {
              await video.play();
              console.log("Video playing");
              setIsReady(true);
            } catch (err) {
              console.error("Error playing video:", err);
              setError("Failed to play video");
              setIsReady(true);
            }
          };

          video.addEventListener("loadedmetadata", handleLoadedMetadata);

          if (video.readyState >= 1) {
            console.log("Video already loaded, initializing immediately");
            handleLoadedMetadata();
          }

          setTimeout(() => {
            if (!hasInitialized && video.videoWidth > 0) {
              console.log("Using fallback initialization");
              handleLoadedMetadata();
            } else if (!hasInitialized) {
              console.log("Fallback failed - video size is 0");
            }
          }, 2000);
        }
      } catch (err) {
        console.error("Error accessing camera:", err);
        setError("Failed to access camera");
        setIsReady(true);
      }
    };

    startCamera();

    return () => {
      if (videoRef.current?.srcObject) {
        const stream = videoRef.current.srcObject as MediaStream;
        stream.getTracks().forEach((track) => track.stop());
      }
    };
  }, [videoRef, canvasRef, width, height, facingMode]);

  return { isReady, error };
}
