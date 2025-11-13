"use client";

import { Card } from "@heroui/card";
import { Spinner } from "@heroui/spinner";
import { Button } from "@heroui/button";
import { useDisclosure } from "@heroui/modal";
import { Trash2 } from "lucide-react";
import { GenerationResult } from "@/types/generation";
import { ConfirmDialog } from "@/components/confirm-dialog";
import Image from "next/image";

interface GenerationResultProps {
  result: GenerationResult;
  onDelete?: (id: string) => void;
}

export function GenerationResultCard({
  result,
  onDelete,
}: GenerationResultProps) {
  const { isOpen, onOpen, onClose } = useDisclosure();

  const handleDelete = () => {
    onDelete?.(result.id);
  };

  return (
    <div className="relative grid grid-cols-1 md:grid-cols-2 gap-6 w-full mb-8">
      {/* Delete Button */}
      <Button
        isIconOnly
        color="danger"
        variant="flat"
        size="sm"
        className="absolute top-2 right-2 z-10"
        onPress={onOpen}
        title="Delete this page"
      >
        <Trash2 size={18} />
      </Button>

      {/* Confirmation Dialog */}
      <ConfirmDialog
        isOpen={isOpen}
        onClose={onClose}
        onConfirm={handleDelete}
        title="Delete Story Page"
        message="Are you sure you want to delete this story page? This action cannot be undone."
        confirmText="Delete Page"
        cancelText="Keep Page"
      />
      {/* Left side: Transcribed text */}
      <Card className="p-6 min-h-[400px] flex flex-col">
        <h3 className="text-lg font-semibold mb-4 text-blue-600 text-center">
          📖 Story Text
        </h3>
        <div className="flex-1 flex flex-col items-center justify-center">
          {result.transcribedText ? (
            <p className="text-default-700 whitespace-pre-wrap text-center text-lg leading-relaxed px-4">
              {result.transcribedText}
            </p>
          ) : (
            result.status === "transcribing" && (
              <div className="flex flex-col items-center gap-3">
                <Spinner size="lg" />
                <span className="text-sm text-default-500">
                  Reading your handwriting...
                </span>
              </div>
            )
          )}
        </div>
      </Card>

      {/* Right side: Generated images */}
      <Card className="p-6 min-h-[400px] flex flex-col">
        <h3 className="text-lg font-semibold mb-4 text-cyan-600 text-center">
          🎨 Illustration
        </h3>
        <div className="flex-1 flex items-center justify-center">
          {result.status === "generating" && (
            <div className="flex flex-col items-center gap-4">
              <Spinner size="lg" />
              <span className="text-sm text-default-500">
                Creating artwork...
              </span>
            </div>
          )}
          {result.status === "completed" &&
            result.generatedImages.length > 0 && (
              <div className="w-full space-y-4">
                {result.generatedImages.map((image, idx) => (
                  <div key={idx} className="relative w-full aspect-video">
                    <Image
                      src={image.url}
                      alt={`Generated image ${idx + 1}`}
                      fill
                      sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                      className="object-cover rounded-lg"
                    />
                  </div>
                ))}
              </div>
            )}
          {result.status === "error" && (
            <div className="text-danger text-sm text-center">
              <p>Error: {result.error || "Failed to generate image"}</p>
            </div>
          )}
        </div>
      </Card>
    </div>
  );
}
