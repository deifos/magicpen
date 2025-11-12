import { Card } from "@heroui/card";

interface GestureMessageProps {
  message: string;
  tapCount: number;
}

export function GestureMessage({ message, tapCount }: GestureMessageProps) {
  if (!message) return null;

  return (
    <Card className="p-4 bg-gradient-to-r from-blue-500/20 to-cyan-400/20 border-2 border-blue-500 w-full animate-pulse">
      <p className="text-blue-600 dark:text-blue-400 text-base font-bold text-center">
        {message}
      </p>
      <p className="text-xs text-default-600 text-center mt-1">
        Spell #{tapCount}
      </p>
    </Card>
  );
}
