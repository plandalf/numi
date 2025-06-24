export interface LayoutConfig {
  id: string;
  name: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
  sections: Record<string, {
    appearance?: Record<string, string | number>;
    style?: Record<string, string | number>;
    asContainer?: boolean;
    blocks?: unknown[];
  }>;
  layoutIdentifier: string; // Used for the page.layout.sm field
  layoutConfig: unknown; // The actual JSON layout configuration
}

export type LayoutId = 'left-sidebar' | 'promo' | 'full-width' | 'two-column'; 