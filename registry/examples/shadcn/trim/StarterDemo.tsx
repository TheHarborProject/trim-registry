"use client";

import { useTrimControlState } from "@theharborproject/trim/react";

type TextSize = "small" | "default" | "large";

const textSizeClasses: Record<TextSize, string> = {
  small: "text-sm",
  default: "text-base",
  large: "text-xl",
};

export function StarterDemo() {
  const { value } = useTrimControlState<TextSize>("text-size.value");

  return (
    <div className="max-w-xl space-y-2">
      <p className="text-sm font-medium text-zinc-500 dark:text-zinc-400">
        Accessible text
      </p>

      <p
        className={`${textSizeClasses[value ?? "default"]} leading-relaxed transition-[font-size]`}
      >
        Adjust the text size from the accessibility panel. This content responds
        to the Text size control without the control knowing anything about this
        component.
      </p>
    </div>
  );
}
