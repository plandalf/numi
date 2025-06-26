import { PageSection } from "./offer";

export interface LayoutConfig {
  id: string;
  name: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
  exposed?: string[]; // The sections that are exposed to the user.
  sections: Record<string, PageSection>;
  layoutIdentifier: string; // Used for the page.layout.sm field
  layoutConfig: unknown; // The actual JSON layout configuration
}

export type LayoutId = 'left-sidebar' | 'promo' | 'full-width' | 'two-column'; 