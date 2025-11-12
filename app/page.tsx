"use client";

import { useRef, useState, useEffect } from "react";
import { CameraCapture, CameraCaptureRef } from "@/components/camera-capture";
import { GenerationResultCard } from "@/components/generation-result";
import { GenerationResult } from "@/types/generation";
import { uploadToFal, transcribeImage, generateImage } from "@/lib/fal-client";

export default function Home() {
  const cameraRef = useRef<CameraCaptureRef>(null);
  const resultsContainerRef = useRef<HTMLDivElement>(null);
  const [results, setResults] = useState<GenerationResult[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [lastCapturedText, setLastCapturedText] = useState<string>("");

  const handleCapture = async (imageBlob: Blob, selectedStyleUrl: string) => {
    if (isProcessing) return;

    setIsProcessing(true);
    const resultId = `result-${Date.now()}`;

    console.log("📸 Capture with style URL:", selectedStyleUrl);

    // Create initial result entry
    const newResult: GenerationResult = {
      id: resultId,
      capturedImageUrl: "",
      transcribedText: "",
      generatedImages: [],
      timestamp: Date.now(),
      status: "processing",
    };

    setResults((prev) => [...prev, newResult]);

    try {
      // Step 1: Upload captured image
      const file = new File([imageBlob], "capture.jpg", { type: "image/jpeg" });
      const imageUrl = await uploadToFal(file);

      setResults((prev) =>
        prev.map((r) =>
          r.id === resultId
            ? { ...r, capturedImageUrl: imageUrl, status: "transcribing" }
            : r
        )
      );

      // Step 2: Transcribe the text from the image and generate enhanced prompt
      // Get all previous transcriptions to provide context
      const previousTranscriptions = results
        .filter(r => r.transcribedText)
        .map(r => r.transcribedText)
        .join(" ");

      const contextPrompt = previousTranscriptions
        ? `\n\nPREVIOUSLY TRANSCRIBED TEXT (already processed, DO NOT include this in your response):\n"${previousTranscriptions}"\n\nYour task: Read ALL the text in the image, but return ONLY the NEW text that is NOT in the previously transcribed text above. This is a continuing story, so only transcribe what hasn't been captured yet.`
        : "\n\nThis is the first capture, so transcribe all text you see.";

      const { transcription, prompt: generationPrompt } = await transcribeImage({
        imageUrl,
        prompt:
          `Read the handwritten text in this image. Return a JSON object with exactly two fields:\n1. 'transcription': ONLY the NEW text that hasn't been transcribed before (with spelling errors fixed)\n2. 'prompt': An enhanced, detailed, vivid prompt for generating a storybook illustration based ONLY on this NEW transcription. Make the prompt descriptive and suitable for children's storybook art style.${contextPrompt}\n\nExample:\nIf image shows: "a big kat in a gardin. The kat was hapy"\nAnd previously transcribed: "a big cat in a garden"\nReturn ONLY the new part:\n{\n  "transcription": "The cat was happy",\n  "prompt": "A joyful cat with a big smile, looking delighted and content, children's storybook illustration style, warm and cheerful atmosphere"\n}`,
        systemPrompt:
          "You are an OCR system for children's handwriting that creates image generation prompts. You will receive context about previously transcribed text. Return ONLY a JSON object with 'transcription' (ONLY new text with fixed spelling, excluding previously transcribed content) and 'prompt' (enhanced vivid prompt for storybook illustration based ONLY on the new text). Do not add any explanation, just return the JSON.",
      });

      setResults((prev) =>
        prev.map((r) =>
          r.id === resultId
            ? { ...r, transcribedText: transcription, status: "generating" }
            : r
        )
      );

      // Update last captured text
      setLastCapturedText(transcription);

      // Step 3: Generate image from enhanced prompt with style reference
      const { images } = await generateImage(
        {
          prompt: generationPrompt,
          aspectRatio: "16:9",
          styleImageUrl: selectedStyleUrl,
        },
        (log) => console.log("Generation log:", log)
      );

      setResults((prev) =>
        prev.map((r) =>
          r.id === resultId
            ? { ...r, generatedImages: images, status: "completed" }
            : r
        )
      );
    } catch (error) {
      console.error("Error processing capture:", error);
      setResults((prev) =>
        prev.map((r) =>
          r.id === resultId
            ? {
                ...r,
                status: "error",
                error: error instanceof Error ? error.message : "Unknown error",
              }
            : r
        )
      );
    } finally {
      setIsProcessing(false);
    }
  };

  // Auto-scroll to latest result (now at the bottom)
  useEffect(() => {
    if (results.length > 0 && resultsContainerRef.current) {
      const latestResult = resultsContainerRef.current.lastElementChild;
      if (latestResult) {
        latestResult.scrollIntoView({ behavior: "smooth", block: "start" });
      }
    }
  }, [results.length]);

  return (
    <div className="flex min-h-screen">
      {/* Fixed camera sidebar */}
      <aside className="fixed left-0 top-16 h-[calc(100vh-4rem)] w-80 border-r border-default-200 p-4 overflow-y-auto">
        <CameraCapture
          ref={cameraRef}
          onCapture={handleCapture}
          lastCapturedText={lastCapturedText}
        />
      </aside>

      {/* Main content area */}
      <main className="ml-80 flex-1 p-8">
        <div className="max-w-7xl mx-auto">
          {/* Results feed */}
          <div ref={resultsContainerRef} className="space-y-8">
            {results.map((result) => (
              <GenerationResultCard key={result.id} result={result} />
            ))}
            {results.length === 0 && (
              <div className="text-center text-default-500 py-12">
                <p className="text-lg mb-2">
                  Write something on paper, then cast the magic spell! ✨
                </p>
                <p className="text-sm text-default-400">
                  Make a thumbs up and hold it for 3 seconds! 👍⏱️
                </p>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
