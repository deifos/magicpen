import { Card } from "@heroui/card";

export function InstructionsCard() {
  return (
    <Card className="p-3 w-full">
      <h3 className="text-sm font-semibold mb-2">Cast the Magic Spell! ✨</h3>
      <p className="text-xs text-default-600">
        Make a <strong>thumbs up</strong> 👍 gesture
      </p>
      <p className="text-xs text-default-600 mt-1">
        <strong>Hold for 3 seconds</strong> to cast the spell!
      </p>
      <p className="text-xs text-default-500 mt-2 italic">
        (Watch the progress bar fill up!)
      </p>
    </Card>
  );
}
