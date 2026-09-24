import { ShadcnBooleanControl } from "./renderers/shadcn-boolean";
import { ShadcnSegmentedControl } from "./renderers/shadcn-segmented";
import { ShadcnToggleActionControl } from "./renderers/shadcn-toggle-action";
import type { TrimRendererMap } from "@theharborproject/trim/react";

export const trimRenderers = {
  "toggle": ShadcnBooleanControl,
  "segmented": ShadcnSegmentedControl,
  "toggle-action": ShadcnToggleActionControl,
} satisfies TrimRendererMap;
