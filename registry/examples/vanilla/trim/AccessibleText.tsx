"use client";

import type { ReactNode } from "react";
import { useTrimControlState } from "@theharborproject/trim/react";

type TextSize = "small" | "default" | "large";

const textSizeClasses: Record<TextSize, string> = {
  small: "text-sm",
  default: "text-base",
  large: "text-xl",
};

export function AccessibleText({ children }: { children: ReactNode }) {
  const { value } = useTrimControlState<TextSize>("text-size.value");

  return (
    <div className={textSizeClasses[value ?? "default"]}>
      {children}
    </div>
  );
}
