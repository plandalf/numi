import { PageView } from '@/types/offer';

export function findUniqueFonts(view: PageView): string[] {
  const fonts = new Set<string>();

  // Helper to safely extract font name from a style object
  const getFontFromStyle = (style?: Record<string, any>) => {
    if (!style) return;
    
    // Look through all style properties that end with 'Font'
    Object.entries(style).forEach(([key, value]) => {
      if (key.endsWith('Font') && value?.font) {
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