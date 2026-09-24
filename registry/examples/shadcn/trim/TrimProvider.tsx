"use client";

import type { ReactNode } from "react";
import { Trim } from "@theharborproject/trim/react";
import { trimControls } from "./trim.manifest";
import { TrimPanel } from "./TrimPanel";

export function TrimProvider({ children }: { children: ReactNode }) {
  return (
    <Trim.Registry controls={trimControls}>
      {children}
      <TrimPanel />
    </Trim.Registry>
  );
}
