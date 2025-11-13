import { NextRequest, NextResponse } from "next/server";
import { uploadToFal, transcribeImage, generateImage } from "@/lib/fal-client";

export const runtime = "nodejs";
export const maxDuration = 60; // 60 seconds max

interface GenerateRequest {
  imageUrl?: string;
  imageBase64?: string;
  styleUrl?: string;
  previousContext?: string;
}

export async function POST(request: NextRequest) {
  try {
    const body: GenerateRequest = await request.json();
    const { imageUrl, imageBase64, styleUrl, previousContext } = body;

    console.log("📥 API Request received:", {
      hasImageUrl: !!imageUrl,
      hasImageBase64: !!imageBase64,
      imageBase64Length: imageBase64?.length || 0,
      styleUrl,
      previousContextLength: previousContext?.length || 0,
    });

    // Validate input
    if (!imageUrl && !imageBase64) {
      console.error("❌ Validation failed: No image provided");
      return NextResponse.json(
        {
          error: "Either imageUrl or imageBase64 is required",
          received: {
            hasImageUrl: !!imageUrl,
            hasImageBase64: !!imageBase64,
            bodyKeys: Object.keys(body)
          }
        },
        { status: 400 }
      );
    }

    let uploadedImageUrl: string;

    // Handle image upload
    if (imageBase64) {
      try {
        console.log("🖼️  Converting base64 to file...");
        // Convert base64 to blob and upload
        const base64Data = imageBase64.replace(/^data:image\/\w+;base64,/, "");
        const buffer = Buffer.from(base64Data, "base64");
        console.log("📦 Buffer size:", buffer.length, "bytes");

        const blob = new Blob([buffer], { type: "image/jpeg" });
        const file = new File([blob], "upload.jpg", { type: "image/jpeg" });

        console.log("☁️  Uploading to Fal...");
        uploadedImageUrl = await uploadToFal(file);
        console.log("✅ Upload successful:", uploadedImageUrl);
      } catch (uploadError) {
        console.error("❌ Upload failed:", uploadError);
        return NextResponse.json(
          {
            error: "Failed to upload image",
            message: uploadError instanceof Error ? uploadError.message : "Unknown error"
          },
          { status: 500 }
        );
      }
    } else if (imageUrl) {
      // Use provided URL directly
      uploadedImageUrl = imageUrl;
      console.log("🔗 Using provided URL:", imageUrl);
    } else {
      return NextResponse.json(
        { error: "Invalid image input" },
        { status: 400 }
      );
    }

    // Step 1: Transcribe the image
    const contextPrompt = previousContext
      ? `\n\nPREVIOUSLY TRANSCRIBED TEXT (already processed, DO NOT include this in your response):\n"${previousContext}"\n\nYour task: Read ALL the text in the image, but return ONLY the NEW text that is NOT in the previously transcribed text above. This is a continuing story, so only transcribe what hasn't been captured yet.`
      : "\n\nThis is the first capture, so transcribe all text you see.";

    const { transcription, prompt: generationPrompt } = await transcribeImage({
      imageUrl: uploadedImageUrl,
      prompt: `Read the handwritten text in this image. Return a JSON object with exactly two fields:\n1. 'transcription': ONLY the NEW text that hasn't been transcribed before (with spelling errors fixed)\n2. 'prompt': An enhanced, detailed, vivid prompt for generating a storybook illustration based ONLY on this NEW transcription. Make the prompt descriptive and suitable for children's storybook art style.${contextPrompt}\n\nExample:\nIf image shows: "a big kat in a gardin. The kat was hapy"\nAnd previously transcribed: "a big cat in a garden"\nReturn ONLY the new part:\n{\n  "transcription": "The cat was happy",\n  "prompt": "A joyful cat with a big smile, looking delighted and content, children's storybook illustration style, warm and cheerful atmosphere"\n}`,
      systemPrompt:
        "You are an OCR system for children's handwriting that creates image generation prompts. You will receive context about previously transcribed text. Return ONLY a JSON object with 'transcription' (ONLY new text with fixed spelling, excluding previously transcribed content) and 'prompt' (enhanced vivid prompt for storybook illustration based ONLY on the new text). Do not add any explanation, just return the JSON.",
    });

    // Step 2: Generate image
    const defaultStyleUrl =
      "https://v3b.fal.media/files/b/lion/IEP3uGaGWS72ZkUem9cKV_style1.png";

    const { images } = await generateImage({
      prompt: generationPrompt,
      aspectRatio: "16:9",
      styleImageUrl: styleUrl || defaultStyleUrl,
    });

    // Return results
    return NextResponse.json({
      success: true,
      transcription,
      generationPrompt,
      uploadedImageUrl,
      generatedImages: images,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("Error in /api/generate:", error);
    return NextResponse.json(
      {
        error: "Failed to process request",
        message: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
