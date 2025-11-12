import { fal } from "@fal-ai/client";

fal.config({
  proxyUrl: "/api/fal/proxy",
});

// Vision/Transcription Types
export type VisionParams = {
  imageUrl: string;
  prompt?: string;
  systemPrompt?: string;
  model?: string;
};

export type VisionResult = {
  transcription: string;
  prompt: string;
};

// Text-to-Image Types
export type TextToImageParams = {
  prompt: string;
  styleImageUrl?: string;
  styleImagePath?: string; // Path to local style image in public folder
  aspectRatio?: "1:1" | "16:9" | "9:16" | "4:3" | "3:4";
  numImages?: number;
  outputFormat?: "png" | "jpeg";
};

export type TextToImageResult = {
  requestId: string;
  images: { url: string; content_type: string }[];
};

// Upload file to Fal storage
export async function uploadToFal(file: File): Promise<string> {
  const url = await fal.storage.upload(file);
  return url as string;
}

// Transcribe image using vision model and generate enhanced prompt
export async function transcribeImage(
  params: VisionParams
): Promise<VisionResult> {
  const {
    imageUrl,
    prompt = "Read the handwritten text in this image and return a JSON response.",
    systemPrompt = "You are an OCR system for children's handwriting. Return a JSON object with two fields: 'transcription' (the corrected text with fixed spelling) and 'prompt' (an enhanced, detailed prompt for image generation based on the transcription).",
    model = "google/gemini-2.5-flash-lite",
  } = params;

  const stream = await fal.stream("fal-ai/any-llm/vision", {
    input: {
      prompt,
      system_prompt: systemPrompt,
      priority: "latency" as const,
      model: model as any,
      image_urls: [imageUrl],
    },
  });

  // Collect the streaming response
  let fullText = "";
  for await (const event of stream) {
    if (event && typeof event === "object" && "output" in event) {
      fullText = (event as { output: string }).output;
    }
  }

  const result = await stream.done();
  const finalText = fullText || (result as any)?.output || "";

  // Parse JSON response
  try {
    // Extract JSON from markdown code blocks if present
    const jsonMatch = finalText.match(/```json\s*([\s\S]*?)\s*```/) ||
                      finalText.match(/```\s*([\s\S]*?)\s*```/) ||
                      [null, finalText];
    const jsonStr = jsonMatch[1] || finalText;
    const parsed = JSON.parse(jsonStr.trim());

    return {
      transcription: parsed.transcription || "",
      prompt: parsed.prompt || parsed.transcription || "",
    };
  } catch (error) {
    console.error("Failed to parse JSON response:", error);
    // Fallback: use the text as transcription
    return {
      transcription: finalText,
      prompt: finalText,
    };
  }
}

// Cache for uploaded style images
const styleImageCache = new Map<string, string>();

async function getStyleImageUrl(stylePath: string): Promise<string> {
  // Check cache first
  if (styleImageCache.has(stylePath)) {
    return styleImageCache.get(stylePath)!;
  }

  // Fetch the style image from public folder
  const response = await fetch(stylePath);
  const blob = await response.blob();
  const fileName = stylePath.split('/').pop() || 'style.png';
  const file = new File([blob], fileName, { type: "image/png" });

  // Upload to Fal storage
  const uploadedUrl = await uploadToFal(file);
  styleImageCache.set(stylePath, uploadedUrl);
  return uploadedUrl;
}

// Generate image from text prompt using reve/fast/remix with style reference
export async function generateImage(
  params: TextToImageParams,
  onProgress?: (log: string) => void
): Promise<TextToImageResult> {
  const {
    prompt,
    styleImageUrl,
    styleImagePath,
    aspectRatio = "16:9",
    numImages = 1,
    outputFormat = "png",
  } = params;

  // Get style image URL (use provided URL or upload from path if needed)
  let imageUrl: string;
  if (styleImageUrl) {
    // Use the provided URL directly (fastest option)
    imageUrl = styleImageUrl;
  } else if (styleImagePath) {
    // Upload from path if provided
    imageUrl = await getStyleImageUrl(styleImagePath);
  } else {
    // Default fallback
    imageUrl = await getStyleImageUrl("/styles/style1.png");
  }

  // Add style instruction to prompt
  const enhancedPrompt = `${prompt}. Use the style of the reference image provided.`;

  const result = await fal.subscribe("fal-ai/reve/fast/remix", {
    input: {
      prompt: enhancedPrompt,
      image_urls: [imageUrl],
      aspect_ratio: aspectRatio,
      num_images: numImages,
      output_format: outputFormat,
    },
    logs: Boolean(onProgress),
    onQueueUpdate: (update) => {
      if (update.status === "IN_PROGRESS" && onProgress) {
        update.logs.map((log) => log.message).forEach(onProgress);
      }
    },
  });

  const images = ((result?.data?.images as any) || []).map((img: any) => ({
    url: img.url,
    content_type: img.content_type || `image/${outputFormat}`,
  })) as { url: string; content_type: string }[];

  return { requestId: String(result.requestId), images };
}
