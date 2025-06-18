import { PageView } from '@/types/offer';
import { Theme } from '@/types/theme';

// Helper to safely extract font name from a style object
export const getFontsFromStyle = (style?: Record<string, any>): string[] => {
  if (!style) return [];

  const fonts: string[] = [];
  
  // Look through all style properties that end with 'Font'
  Object.entries(style).forEach(([key, value]) => {
    if ((key.endsWith('Font') || key.endsWith('font')) && value?.font) {
      fonts.push(value.font);
    }
  });

  return fonts;
};

export function findUniqueFontsFromView(view: PageView): string[] {
  const fonts = new Set<string>();

  // Process each page
  Object.values(view?.pages || {}).forEach(page => {
    // Process each section in the page
    Object.values(page?.view || {}).forEach(section => {
      // Check section style
      const sectionFonts = getFontsFromStyle(section?.style);
      if (sectionFonts) {
        sectionFonts.forEach(font => fonts.add(font));
      }

      // Check each block's style
      section?.blocks?.forEach(block => {
        const blockFonts = getFontsFromStyle(block.style);
        if (blockFonts) {
          blockFonts.forEach(font => fonts.add(font));
        }
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

/**
 * Construct a Google Fonts URL string.
 * fonts: [{ name: 'Roboto', weights: [400,700] }, ...]
 * display: 'swap' | 'auto' | 'fallback' | 'optional'
 */
export function buildGoogleFontsUrl(fonts: { name: string; weights?: string[] }[], display = 'swap') {
  const families = fonts.map(f => {
    const name = f.name.replace(/ /g, '+');
    const weightPart = f.weights ? `:wght@${f.weights.join(';')}` : '';
    return `family=${name}${weightPart}`;
  }).join('&');
  return `https://fonts.googleapis.com/css2?${families}&display=${display}`;
}


