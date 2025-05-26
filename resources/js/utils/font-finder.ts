import { PageView } from '@/types/offer';
import { Theme } from '@/types/theme';

export function findUniqueFontsFromView(view: PageView): string[] {
  const fonts = new Set<string>();

  // Helper to safely extract font name from a style object
  const getFontFromStyle = (style?: Record<string, any>) => {
    if (!style) return;
    
    // Look through all style properties that end with 'Font'
    Object.entries(style).forEach(([key, value]) => {
      if ((key.endsWith('Font') || key.endsWith('font')) && value?.font) {
        fonts.add(value.font);
      }
    });
  };

  // Process each page
  Object.values(view?.pages || {}).forEach(page => {
    // Process each section in the page
    Object.values(page?.view || {}).forEach(section => {
      // Check section style
      getFontFromStyle(section?.style);

      // Check each block's style
      section?.blocks?.forEach(block => {
        getFontFromStyle(block.style);
      });
    });
  });

  return Array.from(fonts).sort();
} 

export function findUniqueFontsFromTheme(theme: Theme): string[] {
  if (!theme) return [];
  
  const fonts = new Set<string>(); // Always include Inter as default

  // Add main and mono fonts if they exist
  if (theme.main_font) {
    fonts.add(theme.main_font);
  }
  if (theme.mono_font) {
    fonts.add(theme.mono_font);
  }

  // Typography fields that contain font information
  const typographyFields = [
    'h1_typography',
    'h2_typography', 
    'h3_typography',
    'h4_typography',
    'h5_typography',
    'h6_typography',
    'label_typography',
    'body_typography'
  ] as const;

  // Process each typography field
  typographyFields.forEach(field => {
    const typography = theme[field];
    if (Array.isArray(typography) && typography.length >= 2) {
      // Typography array format is [size, font, weight]
      const font = typography[1];
      if (font && typeof font === 'string') {
        fonts.add(font);
      }
    }
  });

  return Array.from(fonts).sort();
}


