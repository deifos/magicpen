import { Card } from "@heroui/card";

export function InstructionsCard() {
  return (
    <Card className="p-4 w-full bg-gradient-to-br from-blue-500/10 to-cyan-500/10 border border-blue-500/20">
      <h3 className="text-base font-bold mb-3 text-center text-blue-500">
        🤖 AI Hand Gestures
      </h3>
      <div className="space-y-2">
        <div className="text-sm text-foreground text-center">
          <span className="font-bold">👍 Thumbs Up</span>
          <p className="text-xs text-default-600 dark:text-default-400">
            Hold for 5 seconds → Capture & Generate
          </p>
        </div>
        <div className="text-xs text-center text-default-600 dark:text-default-400 mt-3 p-2 bg-default-100/50 dark:bg-default-100/10 rounded-lg border border-default-200/50">
          💡 <span className="font-semibold">Tip:</span> Keep your paper steady
          and make sure all text is visible!
        </div>
      </div>
    </Card>
  );
}
