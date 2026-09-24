"use client";

import type { ReactNode } from "react";
import { useTrimControlState } from "@theharborproject/trim/react";
import styles from "./AccessibleContrast.module.css";

export function AccessibleContrast({ children }: { children: ReactNode }) {
  const { value } = useTrimControlState<boolean>("high-contrast.value");

  return (
    <div
      className={`flex flex-col flex-1 items-center justify-center bg-zinc-50 font-sans dark:bg-black${value ? ` ${styles.enabled}` : ""}`}
    >
      {children}
    </div>
  );
}
